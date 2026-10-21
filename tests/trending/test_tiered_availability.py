from copy import deepcopy
from datetime import timedelta

import pytest
from cs2_research.feature_input.market_sector_eod_v3 import _slot_fact_document
from cs2_research.trending.availability import classify_source_slots
from cs2_research.trending.models import TrendingContractError
from test_tiered_candidates import make_candidate, absence
from test_single_item_trending_d3_formal import AS_OF, _with_anomaly
from cs2_research.trending.formal import TrendingAnomalyStatus


def raw_rows():
    _, fixture = make_candidate(missing=absence())
    return next(iter(fixture.source_slot_documents.values()))


def changed(rows, **changes):
    return [_slot_fact_document({**{k: v for k, v in row.items() if k != "source_fact_sha256"}, **changes}) for row in rows]


def reason(rows):
    return classify_source_slots(rows, analysis_unit_id="item:1", source_code="market_b",
                                 day=AS_OF - timedelta(days=30))["reason"]


def test_unknown_clock_does_not_mean_no_ask():
    assert reason(changed(raw_rows(), source_observed_at=None, source_updated_at=None,
                          source_collected_at=None)) == "MISSING_SOURCE_CLOCK"


def test_stale_zero_listing_cannot_establish_current_absence():
    assert reason(changed(raw_rows(), source_observed_at="2026-08-01T20:00:00.000000Z",
        source_updated_at="2026-08-01T20:00:00.000000Z", source_collected_at=None)) == "QUOTE_VALUE_MISSING_OR_INVALID"


def test_positive_price_with_zero_visible_listing_is_contradiction():
    assert reason(changed(raw_rows(), ask_atoms=1000)) == "CONTRACT_MISMATCH"


def test_raw_future_updated_clock_does_not_fallback_to_old_collected_clock():
    assert reason(changed(raw_rows(), source_updated_at="2026-08-02T00:00:00.000000Z")) == "TEMPORAL_VIOLATION"


def test_duplicate_slots_and_incomplete_evidence_do_not_qualify():
    rows = raw_rows()
    with pytest.raises(TrendingContractError, match="TIER_DUPLICATE_SLOT"):
        reason([*rows[:-1], rows[0]])
    assert reason(rows[:8]) == "INSUFFICIENT_SLOTS"


@pytest.mark.parametrize("status", (TrendingAnomalyStatus.UNKNOWN, TrendingAnomalyStatus.FLAGGED))
def test_two_source_anomaly_gate_is_not_relaxed(status):
    candidate, _ = make_candidate(missing=absence(),
        endpoint_transform=lambda endpoint: _with_anomaly(endpoint, "item:1", status))
    assert candidate.document["eligible_count"] == 0
    assert candidate.document["accounting"]["qualified_two_source_endpoint_count"] == 0


def test_tiered_measurement_identity_does_not_include_other_member_rank():
    # Keep the original EOD bytes identical. Altering prices would create a new
    # day evidence seal (a legitimate input identity change), not just new ranks.
    values = {("item:2", source): (100, 500) for source in ("market_a", "market_b", "market_c")}
    first, _ = make_candidate(missing=absence(), count=2, values=values,
        endpoint_transform=lambda e: _with_anomaly(e, "item:2", TrendingAnomalyStatus.FLAGGED))
    second, _ = make_candidate(missing=absence(), count=2, values=values)
    assert first.document["measurements"][0]["measurement_id"] == second.document["measurements"][0]["measurement_id"]
    assert second.document["rankings"]["GAINERS"][0]["analysis_unit_id"] == "item:2"
