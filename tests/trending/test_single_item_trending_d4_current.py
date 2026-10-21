from __future__ import annotations

from dataclasses import replace
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
import json
from pathlib import Path
import subprocess
import sys

import pytest
from jsonschema import Draft202012Validator, FormatChecker
from identity_fixture import build_identity_fixture

from cs2_research.fx.analysis import (AnalysisSourcePrice, project_analysis_price_to_cny,
    project_analysis_price_to_cny_v2, finalize_cny_analysis_projection_v2)
from cs2_research.feature_input.market_sector_daily_v1 import FROZEN_END_OF_DAY_REDUCTION_POLICY_V1
from cs2_research.fx.ecb import EcbRateBook, EcbReferenceLeg
from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.trending.current import (
    TrendingAnomalyAssessment,
    TrendingCnyEndpointPair,
    TrendingCurrentEndpointSet,
    TrendingEodProof,
    build_current_endpoint_set_from_daily_projections,
    build_current_trending_source_legs,
    trending_source_leg_from_cny_pair,
)
from cs2_research.trending.formal import (
    TrendingAnomalyStatus,
    TrendingNumericProfile,
    TrendingRightsRelease,
)
from cs2_research.trending.models import (
    CatalogMappingStatus,
    TrendingCatalogMember,
    TrendingContractError,
    TrendingMembership,
)


END = date(2026, 9, 7)
START = END - timedelta(days=30)
KNOWN = datetime(2026, 9, 8, 0, 10, tzinfo=UTC)
ROOT = Path(__file__).resolve().parents[2]
ANOMALY_POLICY_ID = "7" * 64


def _projection(
    *, source: str, day: date, value: int, member: str = "item:1",
    source_lag_minutes: int = 5, identity_lag_minutes: int = 0,
) -> dict:
    event_at = datetime(day.year, day.month, day.day, 23, 55, tzinfo=UTC)
    source_available_at = event_at + timedelta(minutes=source_lag_minutes)
    identity_available_at = event_at + timedelta(minutes=identity_lag_minutes)
    source_price = AnalysisSourcePrice(
        source_fact_sha256=source[-1] * 64,
        source_item_id={"market_a": 1, "market_b": 2, "market_c": 3}[source],
        analysis_unit_id=member,
        logical_source=source,
        transport="market_b_direct",
        price_kind="ASK",
        event_at=event_at,
        source_available_at=source_available_at,
        identity_available_at=identity_available_at,
        currency="CNY",
        unit="CNY_MINOR",
        value=value,
        scale=2,
    )
    return project_analysis_price_to_cny(
        source_price,
        rate_book=None,
        projected_at=max(source_available_at, identity_available_at) + timedelta(minutes=1),
    )


def _pair_from(
    start: dict,
    end: dict,
    *,
    status: TrendingAnomalyStatus = TrendingAnomalyStatus.PASS,
) -> TrendingCnyEndpointPair:
    assessment = TrendingAnomalyAssessment(
        analysis_unit_id=start["source"]["analysis_unit_id"],
        source_code=start["source"]["logical_source"],
        start_projection_sha256=start["document_hash"],
        end_projection_sha256=end["document_hash"],
        policy_id=ANOMALY_POLICY_ID,
        status=status,
        available_at=max(
            datetime.fromisoformat(start["available_at"].replace("Z", "+00:00")),
            datetime.fromisoformat(end["available_at"].replace("Z", "+00:00")),
        ),
        reason_codes=("SYNTHETIC_PASS",) if status is TrendingAnomalyStatus.PASS else ("SYNTHETIC_REVIEW",),
    )
    return TrendingCnyEndpointPair(start, end, assessment)


def _pair(source: str = "market_b", *, member: str = "item:1") -> TrendingCnyEndpointPair:
    return _pair_from(
        _projection(source=source, day=START, value=100, member=member),
        _projection(source=source, day=END, value=110, member=member),
    )


def _usd_projection(
    *, source: str, day: date, value: int, member: str = "item:usd"
) -> dict:
    event_at = datetime(day.year, day.month, day.day, 23, 55, tzinfo=UTC)
    published_at = datetime(day.year, day.month, day.day, 14, tzinfo=UTC)
    book = EcbRateBook(
        (
            EcbReferenceLeg(
                source_event_date=day,
                currency="CNY",
                rate_per_eur=Decimal("7"),
                valid_from=published_at,
                valid_to=None,
                retrieved_at=published_at,
                evidence_sha256="d" * 64,
            ),
            EcbReferenceLeg(
                source_event_date=day,
                currency="USD",
                rate_per_eur=Decimal("1"),
                valid_from=published_at,
                valid_to=None,
                retrieved_at=published_at,
                evidence_sha256="e" * 64,
            ),
        )
    )
    return project_analysis_price_to_cny(
        AnalysisSourcePrice(
            source_fact_sha256="f" * 64,
            source_item_id=9,
            analysis_unit_id=member,
            logical_source=source,
            transport="upstream",
            price_kind="ASK",
            event_at=event_at,
            source_available_at=event_at + timedelta(minutes=1),
            identity_available_at=event_at,
            currency="USD",
            unit="USD_ATOMS",
            value=value,
            scale=8,
        ),
        rate_book=book,
        projected_at=event_at + timedelta(minutes=2),
    )


def test_exact_cny_pair_builds_one_auditable_source_leg() -> None:
    pair = _pair()
    leg = trending_source_leg_from_cny_pair(pair, start_date=START, end_date=END)
    assert leg.analysis_unit_id == "item:1"
    assert leg.source_code == "market_b"
    assert (leg.start_cny_minor, leg.end_cny_minor) == (100, 110)
    assert leg.start_fact_id == pair.start_projection["document_hash"]
    assert leg.end_fact_id == pair.end_projection["document_hash"]


def test_exact_upstream_usd_pair_uses_sealed_cny_projection_without_reconversion() -> None:
    pair = _pair_from(
        _usd_projection(source="market_a", day=START, value=100_000_000),
        _usd_projection(source="market_a", day=END, value=110_000_000),
    )
    leg = trending_source_leg_from_cny_pair(pair, start_date=START, end_date=END)
    assert leg.source_code == "market_a"
    assert (leg.start_cny_minor, leg.end_cny_minor) == (700, 770)
    assert pair.start_projection["fx"]["cny_per_usd"] == "7.000000000000000000"


def test_current_adapter_sorts_and_rejects_duplicate_pairs() -> None:
    pairs = (_pair(member="item:2"), _pair(member="item:1"))
    rows = build_current_trending_source_legs(pairs, start_date=START, end_date=END)
    assert [row.analysis_unit_id for row in rows] == ["item:1", "item:2"]
    with pytest.raises(TrendingContractError, match="D4_DUPLICATE_ENDPOINT_PAIR"):
        build_current_trending_source_legs(
            (pairs[0], pairs[0]), start_date=START, end_date=END
        )


@pytest.mark.parametrize(
    "mutate,code",
    (
        (lambda pair: _pair_from(pair.start_projection, _projection(source="market_b", day=END, value=110, member="item:2")), "D4_ENDPOINT_IDENTITY_DRIFT"),
        (lambda pair: _pair_from(pair.start_projection, _projection(source="market_b", day=END - timedelta(days=1), value=110)), "D4_END_DATE_DRIFT"),
    ),
)
def test_identity_and_date_drift_fail_closed(mutate, code: str) -> None:
    with pytest.raises(TrendingContractError, match=code):
        trending_source_leg_from_cny_pair(
            mutate(_pair()), start_date=START, end_date=END
        )


def test_projection_tamper_and_non_ask_fail_closed() -> None:
    pair = _pair()
    tampered = dict(pair.end_projection)
    tampered["target"] = {**tampered["target"], "value": "111"}
    with pytest.raises(TrendingContractError, match="D4_END_PROJECTION_INVALID"):
        trending_source_leg_from_cny_pair(
            replace(pair, end_projection=tampered), start_date=START, end_date=END
        )

    non_ask = dict(pair.end_projection)
    non_ask["source"] = {**non_ask["source"], "price_kind": "BID"}
    # Hash drift is intentionally caught before semantic price-kind admission.
    with pytest.raises(TrendingContractError, match="D4_END_PROJECTION_INVALID"):
        trending_source_leg_from_cny_pair(
            replace(pair, end_projection=non_ask), start_date=START, end_date=END
        )


def _profile() -> TrendingNumericProfile:
    return TrendingNumericProfile(
        profile_code="price-010-shadow-v1",
        available_at=datetime(2026, 9, 7, 0, tzinfo=UTC),
        minimum_endpoint_cny_minor=10,
        minimum_abs_leg_delta_cny_minor=1,
        minimum_eligible_ratio_bps=8_000,
        endpoint_freshness_seconds=7_200,
        formal_numeric_profile_approved=False,
        prospective_validation_approved=False,
    )


def _membership() -> TrendingMembership:
    return TrendingMembership(
        catalog_snapshot_sha256="9" * 64,
        catalog_version="catalog-current-fixture-v1",
        catalog_as_of=datetime(2026, 8, 7, 22, tzinfo=UTC),
        available_at=datetime(2026, 8, 7, 23, tzinfo=UTC),
        members=(
            TrendingCatalogMember(
                analysis_unit_id="item:1",
                display_name="Fixture",
                item_kind="WEAPON",
                base_item_code="weapon.fixture",
                mapping_status=CatalogMappingStatus.EXACT,
                model_code="model-fixture",
                rarity_code="rarity-fixture",
                edition_kind="STANDARD",
                wear_tier="FACTORY_NEW",
                identity_available_at=datetime(2026, 8, 7, 23, tzinfo=UTC),
                projection_sha256="8" * 64,
                economic_identity=_economic_proof("item:1"),
            ),
        ),
    )


def _economic_proof(member: str) -> dict:
    definition = {"analysis_unit_id": member, "analysis_unit_kind": "BASE_MHN",
                  "parent_analysis_unit_id": None, "item_kind": "WEAPON",
                  "base_item_code": "weapon.fixture", "edition_kind": "STANDARD",
                  "wear_tier": "FACTORY_NEW"}
    return {"definition": definition, "fingerprint_sha256": sha256_hex(canonical_json_bytes(definition)),
            "evidence_sha256": "8" * 64, "available_at": "2026-08-07T23:00:00.000000Z"}


def _book(day: date) -> EcbRateBook:
    published = datetime.combine(day, datetime.min.time(), UTC) + timedelta(hours=14)
    return EcbRateBook(tuple(
        EcbReferenceLeg(source_event_date=day, currency=currency, rate_per_eur=Decimal("1"),
                        valid_from=published, valid_to=None, retrieved_at=published,
                        evidence_sha256=digest * 64)
        for currency, digest in (("CNY", "d"), ("USD", "e"))
    ))


def _endpoint_set() -> TrendingCurrentEndpointSet:
    return build_identity_fixture(result_as_of=END, evaluated_at=KNOWN).endpoint_set


def _projection_for_source(
    *, source: str, day: date, end: bool = False, member: str = "item:1"
) -> dict:
    event = datetime.combine(day, datetime.min.time(), UTC) + timedelta(hours=23, minutes=56)
    valuation = datetime.combine(day + timedelta(days=1), datetime.min.time(), UTC) + timedelta(minutes=5)
    identity = _economic_proof(member)
    return project_analysis_price_to_cny_v2(
        AnalysisSourcePrice(source_fact_sha256=sha256_hex(canonical_json_bytes([source, str(day), member])),
                            source_item_id={"market_a": 1, "market_b": 2, "market_c": 3}[source],
                            analysis_unit_id=member, logical_source=source, transport="upstream",
                            price_kind="ASK", event_at=event, source_available_at=event,
                            identity_available_at=datetime(2026, 8, 7, 23, tzinfo=UTC),
                            currency="USD", unit="USD_ATOMS", value=110_000_000 if end else 100_000_000,
                            scale=8),
        rate_book=_book(day), valuation_as_of=valuation, projected_at=valuation + timedelta(minutes=1),
        economic_identity={key: identity[key] for key in ("fingerprint_sha256", "evidence_sha256", "available_at")},
    )


def _proof(day: date, projections: tuple[dict, ...], *, supplied_slot_count: int = 12) -> TrendingEodProof:
    """Construct synthetic upstream evidence, then bind the supplied synthetic projections.

    Test-only fixture assembly; never used to mutate frozen production artifacts.
    """
    facts = sorted(({
        "analysis_unit_id": p["source"]["analysis_unit_id"], "ask_atoms": int(p["source"]["value"]),
        "available_at": p["source"]["source_available_at"], "bucket_date": day.isoformat(),
        "logical_source": p["source"]["logical_source"], "source_fact_sha256": p["source"]["source_fact_sha256"],
    } for p in projections), key=lambda row: (row["analysis_unit_id"], row["logical_source"]))
    diagnostics = [{
        "analysis_unit_id": f["analysis_unit_id"], "logical_source": f["logical_source"],
        "status": "QUALIFIED", "supplied_slot_count": supplied_slot_count, "positive_fresh_slot_count": supplied_slot_count,
        "stale_slot_count": 0, "missing_source_clock_slot_count": 0,
        "invalid_or_missing_ask_slot_count": 0, "reduced_ask_atoms": f["ask_atoms"],
        "reason_codes": ["LAST_UTC_HOUR_MEDIAN", "MINIMUM_NINE_OF_TWELVE_SLOTS"],
        "lineage_sha256": "3" * 64,
    } for f in facts]
    reduced_at = datetime.combine(day + timedelta(days=1), datetime.min.time(), UTC) + timedelta(minutes=5)
    body = {
        "bucket_date": day.isoformat(), "diagnostics": diagnostics, "formal_state_eligible": False,
        "input_snapshot_sha256": "4" * 64, "membership_id": "fixture-v3-membership",
        "membership_sha256": "6" * 64, "policy_sha256": FROZEN_END_OF_DAY_REDUCTION_POLICY_V1.policy_sha256,
        "reduced_at": utc_timestamp_text(reduced_at), "schema": "market-sector-v3-eod-source-reduction/1",
        "source_facts": facts, "supplied_slot_count": supplied_slot_count,
        "usage_scope": "INTERNAL_PROSPECTIVE_MARKET_SECTOR_V3_MEASUREMENT",
    }
    document = {**body, "reduction_id": "market_sector_v3_eod_reduction_" + sha256_hex(canonical_json_bytes(body))}
    digest = sha256_hex(canonical_json_bytes(document))
    proof = TrendingEodProof.from_v3_reduction(document, artifact_sha256=digest)
    for p in projections:
        observation = {
            "kind": "UTC_DAILY_EOD", "interval_start": utc_timestamp_text(datetime.combine(day, datetime.min.time(), UTC)),
            "interval_end": utc_timestamp_text(datetime.combine(day + timedelta(days=1), datetime.min.time(), UTC)),
            "reduction_policy_sha256": proof.policy_sha256, "reduction_sha256": digest,
            "coverage_evidence_sha256": digest, "supplied_slot_count": supplied_slot_count, "positive_fresh_slot_count": supplied_slot_count,
        }
        rebound = project_analysis_price_to_cny_v2(
            AnalysisSourcePrice.from_document(p["source"]), rate_book=_book(day),
            valuation_as_of=reduced_at, projected_at=datetime.fromisoformat(p["projected_at"].replace("Z", "+00:00")),
            observation=observation, economic_identity=p["economic_identity"],
        )
        p.clear()
        p.update(rebound)
    return proof



def test_eod_proof_uses_frozen_nine_to_twelve_slot_policy() -> None:
    day = date(2026, 9, 10)
    projections = tuple(
        _projection_for_source(source=source, day=day, end=True)
        for source in ("market_a", "market_b", "market_c")
    )
    proof = _proof(day, projections, supplied_slot_count=11)
    assert proof.supplied_slot_count == 11
    with pytest.raises(TrendingContractError, match="D4_EOD_SLOT_SET_INCOMPLETE"):
        _proof(day, projections, supplied_slot_count=8)


def _upstream_eod_payload(day: date, projections: tuple[dict, ...]) -> bytes:
    return canonical_json_bytes(_proof(day, projections).reduction_document())


def test_current_endpoint_set_round_trip_is_sorted_hash_bound_and_exact() -> None:
    endpoint_set = _endpoint_set()
    assert endpoint_set.identities == (
        ("item:1", "market_a"),
        ("item:1", "market_b"),
        ("item:1", "market_c"),
    )
    assert TrendingCurrentEndpointSet.from_document(endpoint_set.to_document()) == endpoint_set
    schema = json.loads(
        (ROOT / "schemas/single-item-trending-d3.v3.schema.json").read_text(
            encoding="utf-8"
        )
    )
    Draft202012Validator(
        schema, format_checker=FormatChecker()
    ).validate(endpoint_set.to_document())

    tampered = endpoint_set.to_document()
    tampered["pairs"][0]["source_code"] = "market_c"
    with pytest.raises(TrendingContractError, match="D4_SET_PAIR_IDENTITY"):
        TrendingCurrentEndpointSet.from_document(tampered)

    with pytest.raises(TrendingContractError, match="D4_SET_PAIR_ORDER"):
        TrendingCurrentEndpointSet(
            membership_id=endpoint_set.membership_id,
            member_set_sha256=endpoint_set.member_set_sha256,
            member_count=endpoint_set.member_count,
            catalog_snapshot_sha256=endpoint_set.catalog_snapshot_sha256,
            result_as_of=endpoint_set.result_as_of,
            evaluated_at=endpoint_set.evaluated_at,
            maximum_source_lag_seconds=endpoint_set.maximum_source_lag_seconds,
            start_eod_proof=endpoint_set.start_eod_proof,
            end_eod_proof=endpoint_set.end_eod_proof,
            anomaly_policy_id=endpoint_set.anomaly_policy_id,
            knowledge_mode=endpoint_set.knowledge_mode,
            pairs=tuple(reversed(endpoint_set.pairs)),
        )


def test_daily_projection_bridge_filters_wider_universe_and_accounts_missing_pairs() -> None:
    membership = _membership()
    start = [
        _projection_for_source(source=source, day=START)
        for source in ("market_a", "market_b", "market_c")
    ] + [_projection_for_source(source="market_a", day=START, member="item:outside")]
    end = [
        _projection_for_source(source=source, day=END, end=True)
        for source in ("market_a", "market_b")
    ] + [_projection_for_source(source="market_a", day=END, end=True, member="item:outside")]
    selection = build_current_endpoint_set_from_daily_projections(
        membership=membership,
        result_as_of=END,
        evaluated_at=KNOWN,
        maximum_source_lag_seconds=7_200,
        start_projections=start,
        end_projections=end,
        start_eod_proof=_proof(START, tuple(start)),
        end_eod_proof=_proof(END, tuple(end)),
        anomaly_policy_id=ANOMALY_POLICY_ID,
    )
    assert selection.endpoint_set.identities == (
        ("item:1", "market_a"),
        ("item:1", "market_b"),
    )
    assert selection.accounting_document() == {
        "start_projection_count": 4,
        "end_projection_count": 3,
        "start_in_membership_count": 3,
        "end_in_membership_count": 2,
        "outside_membership_start_count": 1,
        "outside_membership_end_count": 1,
        "paired_projection_count": 2,
        "unpaired_start_count": 1,
        "unpaired_end_count": 0,
        "unknown_anomaly_count": 2,
    }


def test_daily_projection_bridge_keeps_late_display_with_same_economics() -> None:
    late_membership = replace(
        _membership(),
        available_at=datetime(2026, 8, 9, 0, 1, tzinfo=UTC),
    )
    start = (_projection_for_source(source="market_a", day=START),)
    end = (_projection_for_source(source="market_a", day=END, end=True),)
    selection = build_current_endpoint_set_from_daily_projections(
        membership=late_membership,
        result_as_of=END,
        evaluated_at=KNOWN,
        maximum_source_lag_seconds=7_200,
        start_projections=start,
        end_projections=end,
        start_eod_proof=_proof(START, start),
        end_eod_proof=_proof(END, end),
        anomaly_policy_id=ANOMALY_POLICY_ID,
    )
    # This legacy fixture has no original historical mapping package. Late
    # display is admitted, but it cannot claim prospective identity proof.
    assert selection.endpoint_set.knowledge_mode == "RETROSPECTIVE_DIAGNOSTIC"


def test_daily_projection_bridge_rejects_duplicates_and_future_inputs() -> None:
    projection = _projection_for_source(source="market_a", day=START, member="item:outside")
    with pytest.raises(TrendingContractError, match="D4_SELECTION_START_DUPLICATE_PROJECTION"):
        build_current_endpoint_set_from_daily_projections(
            membership=_membership(),
            result_as_of=END,
            evaluated_at=KNOWN,
            maximum_source_lag_seconds=7_200,
            start_projections=(projection, projection),
            end_projections=(),
            start_eod_proof=_proof(START, (projection,)),
            end_eod_proof=_proof(END, ()),
            anomaly_policy_id=ANOMALY_POLICY_ID,
        )

    with pytest.raises(TrendingContractError, match="D4_SELECTION_END_FUTURE_PROJECTION"):
        build_current_endpoint_set_from_daily_projections(
            membership=_membership(),
            result_as_of=END,
            evaluated_at=KNOWN - timedelta(minutes=20),
            maximum_source_lag_seconds=7_200,
            start_projections=(),
            end_projections=(_projection_for_source(source="market_a", day=END, end=True),),
            start_eod_proof=_proof(START, ()),
            end_eod_proof=_proof(
                END,
                (_projection_for_source(source="market_a", day=END, end=True),),
            ),
            anomaly_policy_id=ANOMALY_POLICY_ID,
        )

    future_start = _projection_for_source(source="market_a", day=START)
    future_end = _projection_for_source(source="market_a", day=END, end=True)
    future_start_proof = _proof(START, (future_start,))
    future_end_proof = _proof(END, (future_end,))
    future_pair = _pair_from(future_start, future_end)
    with pytest.raises(TrendingContractError, match="D4_SET_EOD_CLOCK_BINDING"):
        TrendingCurrentEndpointSet.build(
            membership_id=_membership().membership_id,
            member_set_sha256=_membership().member_set_sha256,
            member_count=1,
            catalog_snapshot_sha256=_membership().catalog_snapshot_sha256,
            result_as_of=END,
            evaluated_at=KNOWN - timedelta(minutes=20),
            maximum_source_lag_seconds=7_200,
            start_eod_proof=future_start_proof,
            end_eod_proof=future_end_proof,
            anomaly_policy_id=ANOMALY_POLICY_ID,
            knowledge_mode="PROSPECTIVE_PIT",
            pairs=(future_pair,),
        )


def test_current_set_allows_late_reprojection_without_rejuvenating_data() -> None:
    start = _projection_for_source(source="market_b", day=START)
    end = _projection_for_source(source="market_b", day=END, end=True)
    start_proof, end_proof = _proof(START, (start,)), _proof(END, (end,))
    late_at = datetime.combine(START + timedelta(days=2), datetime.min.time(), tzinfo=UTC)
    late = finalize_cny_analysis_projection_v2(start, projected_at=late_at)
    pair = _pair_from(late, end)
    endpoint = TrendingCurrentEndpointSet.build(
        membership_id=_membership().membership_id, member_set_sha256=_membership().member_set_sha256,
        member_count=1, catalog_snapshot_sha256=_membership().catalog_snapshot_sha256,
        result_as_of=END, evaluated_at=KNOWN, maximum_source_lag_seconds=7200,
        start_eod_proof=start_proof, end_eod_proof=end_proof,
        anomaly_policy_id=ANOMALY_POLICY_ID, knowledge_mode="RETROSPECTIVE_DIAGNOSTIC", pairs=(pair,),
    )
    assert late["valuation_as_of"] == start["valuation_as_of"]
    assert late["projected_at"] == utc_timestamp_text(late_at)
    assert endpoint.legs[0].endpoint_observed_at == datetime(2026, 9, 8, tzinfo=UTC)


def _reproject(projection: dict, **changes) -> dict:
    source = changes.pop("source", AnalysisSourcePrice.from_document(projection["source"]))
    return project_analysis_price_to_cny_v2(
        source, rate_book=_book(source.event_at.date()),
        valuation_as_of=datetime.fromisoformat(projection["valuation_as_of"].replace("Z", "+00:00")),
        projected_at=datetime.fromisoformat(projection["projected_at"].replace("Z", "+00:00")),
        observation=changes.pop("observation", projection["observation"]),
        economic_identity=changes.pop("economic_identity", projection["economic_identity"]),
        **changes,
    )


def test_rehashed_projection_cannot_change_original_eod_amount() -> None:
    endpoint = _endpoint_set()
    pair = endpoint.pairs[0]
    original = dict(pair.start_projection)
    changed = _reproject(original, source=replace(
        AnalysisSourcePrice.from_document(original["source"]), value=123_000_000))
    assert changed["document_hash"] != original["document_hash"]
    assert changed["source"]["source_fact_sha256"] == original["source"]["source_fact_sha256"]
    with pytest.raises(TrendingContractError, match="D4_EOD_SOURCE_CONTENT_DRIFT"):
        replace(endpoint, pairs=(_pair_from(changed, dict(pair.end_projection)), *endpoint.pairs[1:]))


@pytest.mark.parametrize("change,code", [
    ({"positive_fresh_slot_count": 8}, "D4_EOD_DIAGNOSTIC_NOT_QUALIFIED"),
    ({"reduced_ask_atoms": 123_000_000}, "D4_EOD_DIAGNOSTIC_AMOUNT"),
    ({"unexpected_approval": True}, "D4_EOD_DIAGNOSTIC_SHAPE"),
    ({"stale_slot_count": 12}, "D4_EOD_DIAGNOSTIC_COUNT_OVERLAP"),
    ({"missing_source_clock_slot_count": 12}, "D4_EOD_DIAGNOSTIC_COUNT_OVERLAP"),
    ({"invalid_or_missing_ask_slot_count": 12}, "D4_EOD_DIAGNOSTIC_COUNT_OVERLAP"),
])
def test_upstream_qualification_is_checked_even_after_valid_rehash(change, code) -> None:
    document = _endpoint_set().start_eod_proof.reduction_document()
    document["diagnostics"][0] = {**document["diagnostics"][0], **change}
    document["reduction_id"] = "market_sector_v3_eod_reduction_" + sha256_hex(canonical_json_bytes(
        {key: value for key, value in document.items() if key != "reduction_id"}))
    with pytest.raises(TrendingContractError, match=code):
        TrendingEodProof.from_v3_reduction(document, artifact_sha256=sha256_hex(canonical_json_bytes(document)))


def test_eod_proof_direct_constructor_cannot_detach_qualified_payload_hash() -> None:
    proof = _endpoint_set().start_eod_proof
    with pytest.raises(TrendingContractError, match="D4_EOD_REDUCTION_CONTENT_ID"):
        replace(proof, input_snapshot_sha256="e" * 64)


def test_whole_day_fact_cannot_impersonate_the_frozen_final_hour_reduction() -> None:
    document = _endpoint_set().start_eod_proof.reduction_document()
    document["source_facts"][0]["available_at"] = START.isoformat() + "T09:00:00.000000Z"
    document["reduction_id"] = "market_sector_v3_eod_reduction_" + sha256_hex(canonical_json_bytes(
        {key: value for key, value in document.items() if key != "reduction_id"}))
    with pytest.raises(TrendingContractError, match="D4_EOD_FACT_OUTSIDE_FROZEN_FINAL_HOUR"):
        TrendingEodProof.from_v3_reduction(document, artifact_sha256=sha256_hex(canonical_json_bytes(document)))


def test_anomaly_pass_cannot_predate_the_inputs_it_claims_to_review() -> None:
    endpoint = _endpoint_set()
    pair = endpoint.pairs[0]
    early = replace(pair.anomaly_assessment, available_at=datetime(2026, 8, 1, tzinfo=UTC))
    with pytest.raises(TrendingContractError, match="D4_ANOMALY_BEFORE_INPUTS"):
        replace(endpoint, pairs=(replace(pair, anomaly_assessment=early), *endpoint.pairs[1:]))


def test_daily_observation_hash_is_not_replaceable_by_matching_source_id() -> None:
    endpoint = _endpoint_set()
    pair = endpoint.pairs[0]
    original = dict(pair.start_projection)
    changed = _reproject(original, observation={**original["observation"], "coverage_evidence_sha256": "e" * 64})
    with pytest.raises(TrendingContractError, match="D4_EOD_OBSERVATION_CONTENT_DRIFT"):
        replace(endpoint, pairs=(_pair_from(changed, dict(pair.end_projection)), *endpoint.pairs[1:]))


def test_pair_cannot_mix_two_economic_definitions_with_the_same_display_id() -> None:
    endpoint = _endpoint_set()
    pair = endpoint.pairs[0]
    original = dict(pair.end_projection)
    changed = _reproject(original, economic_identity={**original["economic_identity"], "fingerprint_sha256": "e" * 64})
    with pytest.raises(TrendingContractError, match="D4_ENDPOINT_ECONOMIC_IDENTITY_DRIFT"):
        replace(endpoint, pairs=(_pair_from(dict(pair.start_projection), changed), *endpoint.pairs[1:]))


def test_window_receipt_clock_is_actual_assembly_not_old_input_clock() -> None:
    endpoint = replace(_endpoint_set(), evaluated_at=KNOWN + timedelta(minutes=1))
    assert endpoint.window_evidence.available_at == KNOWN + timedelta(minutes=1)
    assert endpoint.window_evidence.available_at > endpoint.legs[0].available_at


def test_proof_is_deeply_frozen_and_does_not_alias_input_or_serialized_json() -> None:
    document = _endpoint_set().start_eod_proof.to_document()
    proof = TrendingEodProof.from_document(document)
    original_hash = proof.artifact_sha256
    document["source_facts"][0]["ask_atoms"] = 456
    document["diagnostics"][0]["reason_codes"].append("REPLACED")
    exported = proof.to_document()
    exported["diagnostics"][0]["reduced_ask_atoms"] = 456
    assert proof.artifact_sha256 == original_hash == sha256_hex(canonical_json_bytes(proof.reduction_document()))
    with pytest.raises(TypeError):
        proof.source_facts[0]["ask_atoms"] = 456
    with pytest.raises(TypeError):
        proof.diagnostics[0]["reduced_ask_atoms"] = 456


def test_reusing_endpoint_object_revalidates_mutable_projection_against_frozen_proof() -> None:
    endpoint = _endpoint_set()
    pair = endpoint.pairs[0]
    original = dict(pair.start_projection)
    changed = _reproject(original, source=replace(
        AnalysisSourcePrice.from_document(original["source"]), value=123_000_000))
    pair.start_projection.clear()
    pair.start_projection.update(changed)
    with pytest.raises(TrendingContractError, match="D4_EOD_SOURCE_CONTENT_DRIFT"):
        endpoint.legs


def test_profile_and_rights_documents_round_trip_and_reject_identity_drift() -> None:
    profile = _profile()
    assert TrendingNumericProfile.from_document(profile.to_document()) == profile
    rights = TrendingRightsRelease(
        release_code="internal-shadow-fixture-v1",
        available_at=datetime(2026, 9, 7, 0, tzinfo=UTC),
        usage_scope="INTERNAL_SHADOW",
        public_derived_trending_allowed=False,
        allowed_public_source_codes=(),
        maximum_public_members_per_direction=0,
    )
    assert TrendingRightsRelease.from_document(rights.to_document()) == rights
    broken = profile.to_document()
    broken["minimum_endpoint_cny_minor"] = 11
    with pytest.raises(TrendingContractError, match="D3_PROFILE_IDENTITY"):
        TrendingNumericProfile.from_document(broken)


def test_current_set_rejects_identity_known_after_its_source_fact() -> None:
    start = _projection_for_source(source="market_b", day=START)
    end = _projection_for_source(source="market_b", day=END, end=True)
    source = AnalysisSourcePrice.from_document(start["source"])
    start = project_analysis_price_to_cny_v2(
        replace(source, identity_available_at=source.event_at + timedelta(minutes=1)),
        rate_book=_book(START), valuation_as_of=datetime(2026, 8, 9, 0, 5, tzinfo=UTC),
        projected_at=datetime(2026, 8, 9, 0, 6, tzinfo=UTC), economic_identity=start["economic_identity"],
    )
    start_proof, end_proof = _proof(START, (start,)), _proof(END, (end,))
    pair = _pair_from(start, end)
    with pytest.raises(TrendingContractError, match="D4_SET_RETROSPECTIVE_IDENTITY"):
        TrendingCurrentEndpointSet.build(
            membership_id=_membership().membership_id, member_set_sha256=_membership().member_set_sha256,
            member_count=1, catalog_snapshot_sha256=_membership().catalog_snapshot_sha256,
            result_as_of=END, evaluated_at=KNOWN, maximum_source_lag_seconds=7200,
            start_eod_proof=start_proof, end_eod_proof=end_proof,
            anomaly_policy_id=ANOMALY_POLICY_ID, knowledge_mode="PROSPECTIVE_PIT", pairs=(pair,),
        )


