"""Synthetic full-proof coverage tests; no live data or numeric approval."""
from dataclasses import replace
from copy import deepcopy
from datetime import UTC, datetime
from decimal import Decimal
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker

from cs2_research.trending.formal import (
    TrendingAnomalyStatus, TrendingNumericProfile, TrendingPublicationRelease,
    build_trending_candidate_ledger,
)
from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.fx.analysis import AnalysisSourcePrice, project_analysis_price_to_cny_v2, validate_cny_analysis_projection
from cs2_research.fx.ecb import EcbRateBook, EcbReferenceLeg
from cs2_research.trending.models import TrendingContractError
from identity_fixture import SOURCES, build_identity_fixture


def _ledger(fixture, endpoint_set=None, *, freshness=86_400):
    endpoints = endpoint_set or fixture.endpoint_set
    profile = TrendingNumericProfile(
        profile_code="synthetic-coverage-only", available_at=endpoints.evaluated_at,
        minimum_endpoint_cny_minor=10, minimum_abs_leg_delta_cny_minor=1,
        minimum_eligible_ratio_bps=8000, endpoint_freshness_seconds=freshness,
        formal_numeric_profile_approved=False, prospective_validation_approved=False,
    )
    return build_trending_candidate_ledger(
        profile=profile, membership=fixture.membership, source_legs=endpoints.legs,
        result_as_of=endpoints.result_as_of, evaluated_at=endpoints.evaluated_at,
        window_evidence=endpoints.window_evidence,
    )


def test_qualified_inputs_are_independent_of_market_direction_and_microprice():
    values = {(member, source): prices for member, prices in (
        ("item:3", (100, 100)), ("item:4", (1, 2))) for source in SOURCES}
    values[("item:2", "market_b")] = (100, 90)
    fixture = build_identity_fixture(member_count=7, values=values)
    pairs = []
    for pair in fixture.endpoint_set.pairs:
        source = pair.start_projection["source"]
        if source["analysis_unit_id"] == "item:7" and source["logical_source"] == "market_c":
            continue
        status = {"item:5": TrendingAnomalyStatus.UNKNOWN, "item:6": TrendingAnomalyStatus.FLAGGED}.get(
            source["analysis_unit_id"], TrendingAnomalyStatus.PASS
        )
        pairs.append(replace(pair, anomaly_assessment=replace(pair.anomaly_assessment, status=status)))
    endpoints = replace(fixture.endpoint_set, pairs=tuple(pairs))
    ledger = _ledger(fixture, endpoints)
    assert [row["status"] for row in ledger.measurements] == [
        "ELIGIBLE_A3", "CONFLICTED_DIRECTION", "FLAT_OR_ZERO_CONFLICT", "WITHHELD_MICROPRICE",
        "WITHHELD_ANOMALY_UNKNOWN", "WITHHELD_ANOMALY", "INSUFFICIENT_THREE_SOURCES",
    ]
    run = ledger.run_document
    assert (run["member_count"], run["three_source_endpoint_count"],
            run["qualified_three_source_endpoint_count"], run["direction_eligible_count"]) == (7, 6, 4, 1)
    assert (run["three_source_endpoint_ratio_bps"], run["qualified_three_source_endpoint_ratio_bps"],
            run["direction_eligible_ratio_bps"]) == (8571, 5714, 1428)
    # The historical profile 80% field is not silently relabelled as a new gate.
    assert ledger.profile.minimum_eligible_ratio_bps == 8000
    assert len(run["rankings"]["GAINERS"]) == 1
    schema = json.loads((Path(__file__).resolve().parents[2] / "schemas/single-item-trending-d3.v3.schema.json").read_text("utf-8"))
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    for document in (endpoints.to_document(), endpoints.window_evidence.to_document(),
                     ledger.run_document, *ledger.measurements):
        validator.validate(document)


@pytest.mark.parametrize("missing_history", [False, True])
def test_stale_or_unproven_complete_sources_cannot_inflate_qualified_coverage(missing_history):
    fixture = build_identity_fixture()
    endpoints = fixture.endpoint_set
    if missing_history:
        endpoints = replace(endpoints, identity_history=None, knowledge_mode="RETROSPECTIVE_DIAGNOSTIC")
    ledger = _ledger(fixture, endpoints, freshness=86_400 if missing_history else 1)
    assert ledger.run_document["three_source_endpoint_ratio_bps"] == 10_000
    assert ledger.run_document["qualified_three_source_endpoint_ratio_bps"] == 0
    assert ledger.run_document["direction_eligible_count"] == 0
    assert ledger.measurements[0]["status"] == ("WITHHELD_WINDOW_EVIDENCE" if missing_history else "STALE_ENDPOINT")
    assert ledger.measurements[0]["source_legs"][0]["change_ratio"] == "0.10000000"
    assert ledger.run_document["rankings"] == {"GAINERS": [], "LOSERS": []}


def test_unset_qualified_budget_is_explicit_and_content_addressed():
    fixture = build_identity_fixture()
    release = TrendingPublicationRelease(
        release_code="synthetic-unapproved-budget", available_at=fixture.endpoint_set.evaluated_at,
        algorithm_version="single-item-trending-m3a-cny-v3", data_quality_policy_version="synthetic",
        expected_member_count=1, pit_membership_approved=False, freshness_policy_approved=False,
        coverage_policy_approved=False, minimum_three_source_endpoint_ratio_bps=8000,
        minimum_direction_eligible_ratio_bps=0, freshness_seconds=3600, retention_seconds=86_400,
    )
    assert release.body_document()["minimum_qualified_three_source_endpoint_ratio_bps"] is None
    assert replace(release, minimum_qualified_three_source_endpoint_ratio_bps=0).release_id != release.release_id
    assert release.minimum_three_source_endpoint_ratio_bps == 8000


def test_generic_valid_bid_projection_cannot_be_substituted_into_an_ask_trending_leg():
    fixture = build_identity_fixture()
    leg = fixture.endpoint_set.legs[0]
    binding = deepcopy(dict(leg.identity_binding))
    original = binding["start"]["projection"]
    source = replace(AnalysisSourcePrice.from_document(original["source"]), price_kind="BID")
    day = source.event_at.date()
    published = datetime(day.year, day.month, day.day, 14, tzinfo=UTC)
    book = EcbRateBook(tuple(EcbReferenceLeg(day, currency, Decimal("1"), published, None, published,
        sha256_hex(canonical_json_bytes([currency, day.isoformat()]))) for currency in ("CNY", "USD")))
    bid = project_analysis_price_to_cny_v2(source, rate_book=book,
        valuation_as_of=datetime.fromisoformat(original["valuation_as_of"].replace("Z", "+00:00")),
        projected_at=datetime.fromisoformat(original["projected_at"].replace("Z", "+00:00")),
        economic_identity=original["economic_identity"], observation=original["observation"])
    validate_cny_analysis_projection(bid)  # A genuine valid generic BID, not a stale hash negative.
    binding["start"]["projection"] = bid
    binding["start"]["projection_sha256"] = bid["document_hash"]
    fixture.history.validate_binding(binding)  # History itself is price-kind independent.
    with pytest.raises(TrendingContractError, match="D3_LEG_IDENTITY_BINDING_CONTENT"):
        replace(leg, start_fact_id=bid["document_hash"], identity_binding=binding,
                identity_binding_sha256=sha256_hex(canonical_json_bytes(binding)))
