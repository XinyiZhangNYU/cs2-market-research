from __future__ import annotations

import copy
import json
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.fx import (
    AnalysisSourcePrice,
    CnyAnalysisProjectionError,
    EcbRateBook,
    EcbReferenceLeg,
    analysis_source_from_market_sector_eod_fact,
    project_analysis_price_to_cny,
    validate_cny_analysis_projection,
)
from cs2_research.feature_input.market_sector_daily_v3 import V3ReducedSourceAskFact
from cs2_research.fx.analysis import project_analysis_price_to_cny_v2
from cs2_research.feature_input.market_sector_eod_v3 import (
    V3EndOfDayReduction,
    v3_end_of_day_reduction_document,
)


PROJECTED_AT = datetime(2026, 9, 6, 23, 59, tzinfo=UTC)
EVENT_AT = datetime(2026, 9, 6, 23, 55, tzinfo=UTC)


def _book(rate: str = "7.000000000000000000", *, retrieved_at: datetime | None = None) -> EcbRateBook:
    source_day = date(2026, 9, 4)
    retrieved = retrieved_at or datetime(2026, 9, 6, 12, 0, tzinfo=UTC)
    published = datetime(2026, 9, 4, 14, 0, tzinfo=UTC)
    return EcbRateBook(
        (
            EcbReferenceLeg(
                source_event_date=source_day,
                currency="CNY",
                rate_per_eur=Decimal(rate),
                valid_from=published,
                valid_to=None,
                retrieved_at=retrieved,
                evidence_sha256="a" * 64,
            ),
            EcbReferenceLeg(
                source_event_date=source_day,
                currency="USD",
                rate_per_eur=Decimal("1"),
                valid_from=published,
                valid_to=None,
                retrieved_at=retrieved,
                evidence_sha256="b" * 64,
            ),
        )
    )


def _source(**overrides: object) -> AnalysisSourcePrice:
    values: dict[str, object] = {
        "source_fact_sha256": "c" * 64,
        "source_item_id": 42,
        "analysis_unit_id": "defindex:7|paint:token:paintkit_test",
        "logical_source": "market_a",
        "transport": "upstream",
        "price_kind": "ASK",
        "event_at": EVENT_AT,
        "source_available_at": EVENT_AT + timedelta(minutes=1),
        "identity_available_at": datetime(2026, 8, 30, 11, 17, tzinfo=UTC),
        "currency": "USD",
        "unit": "USD_ATOMS",
        "value": 100_000_000,
        "scale": 8,
    }
    values.update(overrides)
    return AnalysisSourcePrice(**values)


def _rehash(document: dict[str, object]) -> None:
    document["document_hash"] = sha256_hex(
        canonical_json_bytes({k: v for k, v in document.items() if k != "document_hash"})
    )


def test_usd_scale8_projects_with_event_day_pair_and_complete_lineage() -> None:
    document = project_analysis_price_to_cny(
        _source(), rate_book=_book(), projected_at=PROJECTED_AT
    )
    assert document["target"] == {
        "basis": "FX_DERIVED",
        "currency": "CNY",
        "reason": None,
        "rounding": "EXACT",
        "status": "AVAILABLE",
        "unit": "CNY_MINOR",
        "value": "700",
    }
    assert document["event_day"] == "2026-09-06"
    assert document["fx"]["source_event_date"] == "2026-09-04"
    assert document["fx"]["carry_days"] == 2
    assert document["fx"]["cny_per_usd"] == "7.000000000000000000"
    assert document["formal_state_eligible"] is False
    assert validate_cny_analysis_projection(document) == document


@pytest.mark.parametrize(
    "scale,value,rate,expected,rounding",
    [
        (10, 10_000_000_000, "6.745000000000000000", "674", "ROUNDED"),
        (10, 10_000_000_000, "6.755000000000000000", "676", "ROUNDED"),
        (8, 0, "7.000000000000000000", "0", "EXACT"),
        (10, 1, "7.000000000000000000", "0", "ROUNDED_TO_ZERO"),
    ],
)
def test_integer_projection_supports_both_frozen_usd_scales_and_half_even(
    scale: int, value: int, rate: str, expected: str, rounding: str
) -> None:
    document = project_analysis_price_to_cny(
        _source(scale=scale, value=value), rate_book=_book(rate), projected_at=PROJECTED_AT
    )
    assert document["target"]["value"] == expected
    assert document["target"]["rounding"] == rounding


def test_native_cny_preserves_zero_without_fake_fx_lineage() -> None:
    document = project_analysis_price_to_cny(
        _source(
            logical_source="market_b", transport="market_b_direct", currency="CNY",
            unit="CNY_MINOR", scale=2, value=0,
        ),
        rate_book=None,
        projected_at=PROJECTED_AT,
    )
    assert document["target"]["value"] == "0"
    assert document["target"]["basis"] == "NATIVE"
    assert document["target"]["rounding"] == "EXACT"
    assert document["fx"] is None
    validate_cny_analysis_projection(document)


def test_v3_eod_source_fact_adapter_preserves_identity_clocks_and_scale8() -> None:
    reduced = V3ReducedSourceAskFact(
        analysis_unit_id="defindex:9|paint:token:paintkit_eod",
        bucket_date=date(2026, 9, 6),
        logical_source="market_c",
        ask_atoms=123_456_789,
        available_at=datetime(2026, 9, 6, 23, 56, tzinfo=UTC),
        source_fact_sha256="e" * 64,
    )
    reduction = V3EndOfDayReduction(
        bucket_date=date(2026, 9, 6),
        reduced_at=datetime(2026, 9, 7, tzinfo=UTC),
        membership_id="membership",
        membership_sha256="1" * 64,
        input_snapshot_sha256="2" * 64,
        policy_sha256="3" * 64,
        supplied_slot_count=12,
        source_facts=(reduced,),
        diagnostics=(),
    )
    fact = v3_end_of_day_reduction_document(reduction)["source_facts"][0]
    source = analysis_source_from_market_sector_eod_fact(
        fact,
        source_item_id=730001,
        identity_available_at=datetime(2026, 8, 30, 11, 17, tzinfo=UTC),
    )
    assert source.source_item_id == 730001
    assert source.value == 123_456_789
    assert source.scale == 8
    assert source.price_kind == "ASK"
    assert source.event_at == datetime(2026, 9, 6, 23, 56, tzinfo=UTC)
    assert set(fact) == {
        "analysis_unit_id", "ask_atoms", "available_at", "bucket_date",
        "logical_source", "source_fact_sha256",
    }
    document = project_analysis_price_to_cny(
        source, rate_book=_book(), projected_at=PROJECTED_AT
    )
    assert document["source"]["source_fact_sha256"] == "e" * 64
    assert document["source"]["logical_source"] == "market_c"


def test_v3_eod_adapter_rejects_date_drift_and_unknown_fields() -> None:
    fact = {
        "analysis_unit_id": "unit",
        "ask_atoms": 1,
        "available_at": "2026-09-06T23:56:00.000000Z",
        "bucket_date": "2026-09-05",
        "logical_source": "market_a",
        "source_fact_sha256": "e" * 64,
    }
    with pytest.raises(CnyAnalysisProjectionError, match="EOD_BUCKET_EVENT_DATE_DRIFT"):
        analysis_source_from_market_sector_eod_fact(
            fact,
            source_item_id=1,
            identity_available_at=PROJECTED_AT,
        )
    fact["extra"] = True
    with pytest.raises(CnyAnalysisProjectionError, match="INVALID_EOD_SOURCE_FACT"):
        analysis_source_from_market_sector_eod_fact(
            fact,
            source_item_id=1,
            identity_available_at=PROJECTED_AT,
        )


def test_missing_or_not_yet_known_event_day_fx_fails_closed() -> None:
    late = datetime(2026, 9, 7, 0, 1, tzinfo=UTC)
    with pytest.raises(CnyAnalysisProjectionError, match="NO_ELIGIBLE_EVENT_DAY_FX"):
        project_analysis_price_to_cny(
            _source(), rate_book=_book(retrieved_at=late), projected_at=PROJECTED_AT
        )


def test_backdated_projection_and_currency_unit_drift_are_rejected() -> None:
    with pytest.raises(CnyAnalysisProjectionError, match="BACKDATED_PROJECTION"):
        project_analysis_price_to_cny(
            _source(), rate_book=_book(), projected_at=EVENT_AT
        )
    with pytest.raises(CnyAnalysisProjectionError, match="INVALID_SOURCE_UNIT"):
        _source(currency="USD", unit="CNY_MINOR", scale=2)
    with pytest.raises(CnyAnalysisProjectionError, match="INVALID_TRANSPORT"):
        _source(transport="direct")
    with pytest.raises(CnyAnalysisProjectionError, match="INVALID_TRANSPORT_CURRENCY"):
        _source(currency="CNY", unit="CNY_MINOR", scale=2)
    with pytest.raises(CnyAnalysisProjectionError, match="INVALID_SOURCE_UNIT"):
        _source(scale=8.0)


def test_semantic_validator_rejects_rehashed_arithmetic_and_pair_tampering() -> None:
    original = project_analysis_price_to_cny(
        _source(), rate_book=_book(), projected_at=PROJECTED_AT
    )
    arithmetic = copy.deepcopy(original)
    arithmetic["target"]["value"] = "701"
    _rehash(arithmetic)
    with pytest.raises(CnyAnalysisProjectionError, match="CNY_PROJECTION_ARITHMETIC_DRIFT"):
        validate_cny_analysis_projection(arithmetic)

    pair = copy.deepcopy(original)
    pair["fx"]["pair_hash"] = "d" * 64
    _rehash(pair)
    with pytest.raises(CnyAnalysisProjectionError, match="FX_PAIR_HASH_DRIFT"):
        validate_cny_analysis_projection(pair)


def test_document_hash_and_unknown_fields_fail_closed() -> None:
    original = project_analysis_price_to_cny(
        _source(), rate_book=_book(), projected_at=PROJECTED_AT
    )
    tampered = copy.deepcopy(original)
    tampered["source"]["analysis_unit_id"] = "other"
    with pytest.raises(CnyAnalysisProjectionError, match="LINEAGE_HASH_DRIFT"):
        validate_cny_analysis_projection(tampered)

    unknown = copy.deepcopy(original)
    unknown["private"] = True
    with pytest.raises(CnyAnalysisProjectionError, match="INVALID_PROJECTION_DOCUMENT"):
        validate_cny_analysis_projection(unknown)


def test_shared_schema_accepts_built_document_and_rejects_cross_field_shape_drift() -> None:
    schema_path = Path(__file__).resolve().parents[1] / "schemas/cny-analysis-projection.v1.schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    document = project_analysis_price_to_cny(
        _source(), rate_book=_book(), projected_at=PROJECTED_AT
    )
    assert list(validator.iter_errors(document)) == []

    drift = copy.deepcopy(document)
    drift["source"]["currency"] = "EUR"
    assert list(validator.iter_errors(drift))

    scale_drift = copy.deepcopy(document)
    scale_drift["source"]["scale"] = 2
    assert list(validator.iter_errors(scale_drift))

    native = project_analysis_price_to_cny(
        _source(
            logical_source="market_b", transport="market_b_direct", currency="CNY",
            unit="CNY_MINOR", scale=2, value=123,
        ),
        rate_book=None,
        projected_at=PROJECTED_AT,
    )
    assert list(validator.iter_errors(native)) == []


def test_v2_late_recomputation_keeps_old_fx_cutoff_and_actual_availability() -> None:
    later = PROJECTED_AT + timedelta(days=2)
    source = _source(identity_available_at=PROJECTED_AT + timedelta(hours=1))
    document = project_analysis_price_to_cny_v2(
        source, rate_book=_book(), valuation_as_of=PROJECTED_AT, projected_at=later,
    )
    assert document["available_at"] == "2026-09-08T23:59:00.000000Z"
    assert document["projected_at"] == document["available_at"]
    assert document["valuation_as_of"] == "2026-09-06T23:59:00.000000Z"
    assert document["target"]["value"] == "700"
    assert document["economic_identity"] is None
    assert document["observation"] is None
    schema = json.loads((Path(__file__).resolve().parents[1]
                         / "schemas/cny-analysis-projection.v2.schema.json").read_bytes())
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(document)
    with pytest.raises(CnyAnalysisProjectionError, match="NO_ELIGIBLE_EVENT_DAY_FX"):
        project_analysis_price_to_cny_v2(
            source, rate_book=_book(retrieved_at=PROJECTED_AT + timedelta(minutes=1)),
            valuation_as_of=PROJECTED_AT, projected_at=later,
        )
    backdated = copy.deepcopy(document)
    backdated["projected_at"] = backdated["valuation_as_of"]
    backdated["available_at"] = backdated["valuation_as_of"]
    _rehash(backdated)
    with pytest.raises(CnyAnalysisProjectionError, match="BACKDATED_PROJECTION"):
        validate_cny_analysis_projection(backdated)


def test_v2_observation_and_economic_evidence_are_clock_bound() -> None:
    valuation = datetime(2026, 9, 7, tzinfo=UTC)
    observation = {
        "kind": "UTC_DAILY_EOD", "interval_start": "2026-09-06T00:00:00.000000Z",
        "interval_end": "2026-09-07T00:00:00.000000Z",
        "reduction_policy_sha256": "a" * 64, "reduction_sha256": "b" * 64,
        "coverage_evidence_sha256": "b" * 64,
        "supplied_slot_count": 11, "positive_fresh_slot_count": 9,
    }
    identity = {"fingerprint_sha256": "c" * 64, "evidence_sha256": "d" * 64,
                "available_at": "2026-09-07T02:00:00.000000Z"}
    document = project_analysis_price_to_cny_v2(
        _source(), rate_book=_book(), valuation_as_of=valuation,
        projected_at=valuation + timedelta(hours=3), observation=observation,
        economic_identity=identity,
    )
    assert validate_cny_analysis_projection(document) == document
    with pytest.raises(CnyAnalysisProjectionError, match="ECONOMIC_IDENTITY_NOT_YET_KNOWN"):
        project_analysis_price_to_cny_v2(
            _source(), rate_book=_book(), valuation_as_of=valuation,
            projected_at=valuation + timedelta(hours=1), observation=observation,
            economic_identity=identity,
        )
    with pytest.raises(CnyAnalysisProjectionError, match="EOD_INTERVAL_NOT_CLOSED"):
        project_analysis_price_to_cny_v2(
            _source(), rate_book=_book(), valuation_as_of=PROJECTED_AT,
            projected_at=valuation, observation=observation,
        )
    for supplied,positive in ((8,8),(11,8),(11,12),(13,9)):
        invalid={**observation,"supplied_slot_count":supplied,"positive_fresh_slot_count":positive}
        with pytest.raises(CnyAnalysisProjectionError,match="INVALID_EOD_COVERAGE"):
            project_analysis_price_to_cny_v2(
                _source(),rate_book=_book(),valuation_as_of=valuation,
                projected_at=valuation+timedelta(hours=3),observation=invalid,
                economic_identity=identity,
            )
