from copy import deepcopy
from dataclasses import replace
from datetime import timedelta

import pytest

from cs2_research.trending.availability import classify_source_slots
from cs2_research.trending.formal import build_trending_candidate_ledger
from cs2_research.trending.models import TrendingContractError
from cs2_research.trending.tiered import TrendingTieringPolicy, build_tiered_candidate
from identity_fixture import build_identity_fixture
from test_single_item_trending_d3_formal import _profile, AS_OF, EVALUATED


def make_candidate(*, missing=None, values=None, allowed=("NO_ACTIVE_ASK",), slots_transform=None,
                   count=1, formal=False, endpoint_transform=None):
    fixture = build_identity_fixture(member_count=count, result_as_of=AS_OF,
        evaluated_at=EVALUATED, missing_endpoints=missing, values=values)
    endpoint = fixture.endpoint_set
    if endpoint_transform:
        endpoint = endpoint_transform(endpoint)
    profile = _profile(approved=formal)
    baseline = build_trending_candidate_ledger(profile=profile, membership=fixture.membership,
        source_legs=endpoint.legs, result_as_of=AS_OF, evaluated_at=EVALUATED,
        window_evidence=endpoint.window_evidence)
    policy = TrendingTieringPolicy("test-tiering", EVALUATED, profile.profile_id, allowed,
        formal_policy_approved=formal, minimum_supported_endpoint_ratio_bps=0 if formal else None)
    slots = fixture.source_slot_documents
    if slots_transform:
        slots = slots_transform(slots)
    return build_tiered_candidate(baseline=baseline, policy=policy,
        start_eod_proof=fixture.start_proof, end_eod_proof=fixture.end_proof,
        source_slot_documents=slots), fixture


def absence(source="market_b", reason="NO_ACTIVE_ASK", sides=("start", "end")):
    days = {"start": AS_OF - timedelta(days=30), "end": AS_OF}
    return {(days[side].isoformat(), "item:1", source): reason for side in sides}


def test_legacy_three_source_candidate_keeps_exact_score():
    candidate, _ = make_candidate()
    row = candidate.document["measurements"][0]
    assert row["evidence_grade"] == "THREE_SOURCE_CONFIRMED"
    assert row["conservative_same_direction_change_floor_ratio"] == "0.10000000"
    assert candidate.document["formal_publication_eligible"] is False


@pytest.mark.parametrize("source", ("market_a", "market_b", "market_c"))
@pytest.mark.parametrize("sides", (("start",), ("end",), ("start", "end")))
def test_two_source_legal_case_requires_same_pair_and_exact_absence(source, sides):
    candidate, _ = make_candidate(missing=absence(source=source, sides=sides))
    row = candidate.document["measurements"][0]
    assert row["evidence_grade"] == "TWO_SOURCE_SUPPORTED"
    assert row["supporting_sources"] == [s for s in ("market_a", "market_b", "market_c") if s != source]
    assert candidate.document["eligible_count"] == 1


def test_approved_reason_is_required_and_raw_evidence_cannot_be_omitted():
    for kwargs in ({"allowed": ()}, {"slots_transform": lambda slots: {}}):
        candidate, _ = make_candidate(missing=absence(), **kwargs)
        assert candidate.document["measurements"][0]["evidence_grade"] == "WITHHELD_DATA_INCOMPLETE"


def test_lag_is_separately_opted_in_and_not_zero_listing():
    missing = absence(reason="SOURCE_REFRESH_LAG")
    candidate, _ = make_candidate(missing=missing)
    assert candidate.document["eligible_count"] == 0
    candidate, _ = make_candidate(missing=missing, allowed=("SOURCE_REFRESH_LAG",))
    assert candidate.document["measurements"][0]["evidence_grade"] == "TWO_SOURCE_SUPPORTED"


def test_two_complete_sources_that_disagree_remain_conflicted():
    values = {("item:1", "market_a"): (100, 110), ("item:1", "market_c"): (100, 90)}
    candidate, _ = make_candidate(missing=absence(), values=values)
    assert candidate.document["measurements"][0]["evidence_grade"] == "CONFLICTED"
    assert candidate.document["eligible_count"] == 0


def test_complete_third_source_disagreement_is_not_dropped():
    values = {("item:1", "market_a"): (100, 110), ("item:1", "market_b"): (100, 90)}
    candidate, _ = make_candidate(values=values)
    assert candidate.document["measurements"][0]["evidence_grade"] == "CONFLICTED"


def test_mismatched_source_pairs_do_not_make_two_complete_sources():
    missing = {**absence(source="market_a", sides=("start",)), **absence(source="market_b", sides=("end",))}
    candidate, _ = make_candidate(missing=missing)
    assert candidate.document["eligible_count"] == 0


def test_two_source_microprice_gate_is_preserved():
    candidate, _ = make_candidate(missing=absence(), values={("item:1", "market_a"): (9, 20)})
    assert candidate.document["measurements"][0]["status"] == "WITHHELD_MICROPRICE"


def test_missing_proof_cannot_drop_one_source_slot():
    def remove_slot(slots):
        return {k: v[:-1] for k, v in slots.items()}
    with pytest.raises(TrendingContractError, match="TIER_EOD_SLOT_COUNT"):
        make_candidate(missing=absence(), slots_transform=remove_slot)


def test_missing_proof_cannot_change_listing_value_even_with_new_fact_hash():
    from cs2_research.feature_input.market_sector_eod_v3 import _slot_fact_document
    def tamper(slots):
        result = deepcopy(slots)
        key = next(iter(result))
        row = {k: v for k, v in result[key][0].items() if k != "source_fact_sha256"}
        row["visible_listing_slots"] = 1
        result[key] = (_slot_fact_document(row), *result[key][1:])
        return result
    with pytest.raises(TrendingContractError, match="TIER_EOD_LINEAGE_DRIFT"):
        make_candidate(missing=absence(), slots_transform=tamper)


@pytest.mark.parametrize("listings", (None, 1))
def test_ambiguous_zero_price_is_not_proof_of_no_active_listing(listings):
    from cs2_research.feature_input.market_sector_eod_v3 import _slot_fact_document
    _, fixture = make_candidate(missing=absence())
    original = next(iter(fixture.source_slot_documents.values()))
    rows = [_slot_fact_document({**{k: v for k, v in r.items() if k != "source_fact_sha256"},
                               "visible_listing_slots": listings}) for r in original]
    result = classify_source_slots(rows, analysis_unit_id="item:1", source_code="market_b",
                                   day=AS_OF - timedelta(days=30))
    assert result["reason"] == "QUOTE_VALUE_MISSING_OR_INVALID"


def test_policy_cannot_allow_identity_or_ambiguous_errors():
    with pytest.raises(TrendingContractError, match="TIER_POLICY_REASONS"):
        TrendingTieringPolicy("bad", EVALUATED, "a" * 64, ("CONTRACT_MISMATCH",))
