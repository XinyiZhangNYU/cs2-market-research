"""Deterministic source-native to CNY-minor analysis projection.

This module is deliberately offline.  It does not select a market method,
publish a state, read a database, or contact a provider.  Its only job is to
turn one already-sealed native price fact into one content-addressed CNY input
whose event-day FX and knowledge clocks can be audited downstream.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from typing import Any, Mapping

from cs2_research.canonical import (
    canonical_json_bytes,
    sha256_hex,
    typed_record_hash,
    utc_timestamp_text,
)

from .ecb import EcbDailyPair, EcbRateBook, FxContractError


CNY_ANALYSIS_CONVERSION_POLICY = "analysis-cny-minor-half-even/1"
CNY_ANALYSIS_FX_SELECTION_POLICY = "ecb-latest-complete-nonfuture-max7d/1"
CNY_ANALYSIS_SCHEMA = "cny-analysis-projection/1"
CNY_ANALYSIS_SCHEMA_V2 = "cny-analysis-projection/2"
CNY_ANALYSIS_USAGE_SCOPE = "INTERNAL_ANALYSIS_INPUT"
BIGINT_MAX = 2**63 - 1
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_INTEGER = re.compile(r"(?:0|[1-9][0-9]*)\Z")
_RATE_18 = re.compile(r"(?:0|[1-9][0-9]*)\.[0-9]{18}\Z")
_SOURCES = frozenset({"market_a", "market_b", "market_c"})
_TRANSPORTS = frozenset({"market_b_direct", "upstream"})
_KINDS = frozenset({"ASK", "BID"})


class CnyAnalysisProjectionError(ValueError):
    """Controlled fail-closed error at the analysis-currency boundary."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def _require(condition: bool, code: str) -> None:
    if not condition:
        raise CnyAnalysisProjectionError(code)


def _utc(value: datetime, code: str) -> datetime:
    _require(
        isinstance(value, datetime)
        and value.tzinfo is not None
        and value.utcoffset() is not None,
        code,
    )
    return value.astimezone(UTC)


def _instant(value: object, code: str) -> datetime:
    _require(isinstance(value, str), code)
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise CnyAnalysisProjectionError(code) from None
    parsed = _utc(parsed, code)
    _require(utc_timestamp_text(parsed) == value, code)
    return parsed


def _identifier(value: object, code: str) -> str:
    _require(isinstance(value, str) and bool(value) and "\x00" not in value, code)
    return value


def _hash(value: object, code: str) -> str:
    _require(isinstance(value, str) and _SHA256.fullmatch(value) is not None, code)
    return value


def _integer_text(value: object, code: str) -> int:
    _require(isinstance(value, str) and _INTEGER.fullmatch(value) is not None, code)
    parsed = int(value)
    _require(parsed <= BIGINT_MAX, code)
    return parsed


def _exact_fields(value: object, expected: set[str], code: str) -> Mapping[str, Any]:
    _require(isinstance(value, dict) and set(value) == expected, code)
    return value


def _half_even(numerator: int, denominator: int) -> tuple[int, str]:
    _require(type(numerator) is int and numerator >= 0, "INVALID_PROJECTION_RATIO")
    _require(type(denominator) is int and denominator > 0, "INVALID_PROJECTION_RATIO")
    quotient, remainder = divmod(numerator, denominator)
    if remainder * 2 > denominator or (
        remainder * 2 == denominator and quotient % 2 == 1
    ):
        quotient += 1
    rounding = "EXACT" if remainder == 0 else "ROUNDED"
    if numerator > 0 and quotient == 0:
        rounding = "ROUNDED_TO_ZERO"
    return quotient, rounding


def _rate_text(pair: EcbDailyPair) -> str:
    rendered = format(pair.cny_per_usd, ".18f")
    _require(_RATE_18.fullmatch(rendered) is not None and int(rendered.replace(".", "")) > 0,
             "INVALID_FX_RATE")
    return rendered


@dataclass(frozen=True, slots=True)
class AnalysisSourcePrice:
    source_fact_sha256: str
    source_item_id: int
    analysis_unit_id: str
    logical_source: str
    transport: str
    price_kind: str
    event_at: datetime
    source_available_at: datetime
    identity_available_at: datetime
    currency: str
    unit: str
    value: int
    scale: int

    def __post_init__(self) -> None:
        _hash(self.source_fact_sha256, "INVALID_SOURCE_FACT_HASH")
        _require(type(self.source_item_id) is int and self.source_item_id > 0,
                 "INVALID_SOURCE_ITEM_ID")
        _identifier(self.analysis_unit_id, "INVALID_ANALYSIS_UNIT")
        _require(isinstance(self.logical_source, str) and self.logical_source in _SOURCES,
                 "INVALID_LOGICAL_SOURCE")
        _require(isinstance(self.transport, str) and self.transport in _TRANSPORTS,
                 "INVALID_TRANSPORT")
        _require(isinstance(self.price_kind, str) and self.price_kind in _KINDS,
                 "INVALID_PRICE_KIND")
        event_at = _utc(self.event_at, "INVALID_EVENT_AT")
        source_available_at = _utc(self.source_available_at, "INVALID_SOURCE_AVAILABLE_AT")
        identity_available_at = _utc(
            self.identity_available_at, "INVALID_IDENTITY_AVAILABLE_AT"
        )
        _require(event_at <= source_available_at, "SOURCE_CLOCK_PRECEDES_EVENT")
        _require(type(self.value) is int and 0 <= self.value <= BIGINT_MAX, "INVALID_SOURCE_VALUE")
        _require(type(self.scale) is int, "INVALID_SOURCE_UNIT")
        if self.currency == "USD":
            _require(self.unit == "USD_ATOMS" and self.scale in (8, 10), "INVALID_SOURCE_UNIT")
            _require(self.transport == "upstream", "INVALID_TRANSPORT_CURRENCY")
        elif self.currency == "CNY":
            _require(self.unit == "CNY_MINOR" and self.scale == 2, "INVALID_SOURCE_UNIT")
            _require(
                self.transport == "market_b_direct" and self.logical_source == "market_b",
                "INVALID_TRANSPORT_CURRENCY",
            )
        else:
            raise CnyAnalysisProjectionError("INVALID_SOURCE_CURRENCY")
        object.__setattr__(self, "event_at", event_at)
        object.__setattr__(self, "source_available_at", source_available_at)
        object.__setattr__(self, "identity_available_at", identity_available_at)

    def to_document(self) -> dict[str, Any]:
        return {
            "analysis_unit_id": self.analysis_unit_id,
            "currency": self.currency,
            "event_at": utc_timestamp_text(self.event_at),
            "identity_available_at": utc_timestamp_text(self.identity_available_at),
            "logical_source": self.logical_source,
            "price_kind": self.price_kind,
            "scale": self.scale,
            "source_available_at": utc_timestamp_text(self.source_available_at),
            "source_fact_sha256": self.source_fact_sha256,
            "source_item_id": self.source_item_id,
            "transport": self.transport,
            "unit": self.unit,
            "value": str(self.value),
        }

    @classmethod
    def from_document(cls, value: object) -> "AnalysisSourcePrice":
        fields = _exact_fields(
            value,
            {
                "analysis_unit_id", "currency", "event_at", "identity_available_at",
                "logical_source", "price_kind", "scale", "source_available_at",
                "source_fact_sha256", "source_item_id", "transport", "unit", "value",
            },
            "INVALID_SOURCE_DOCUMENT",
        )
        return cls(
            source_fact_sha256=fields["source_fact_sha256"],
            source_item_id=fields["source_item_id"],
            analysis_unit_id=fields["analysis_unit_id"],
            logical_source=fields["logical_source"],
            transport=fields["transport"],
            price_kind=fields["price_kind"],
            event_at=_instant(fields["event_at"], "INVALID_EVENT_AT"),
            source_available_at=_instant(
                fields["source_available_at"], "INVALID_SOURCE_AVAILABLE_AT"
            ),
            identity_available_at=_instant(
                fields["identity_available_at"], "INVALID_IDENTITY_AVAILABLE_AT"
            ),
            currency=fields["currency"],
            unit=fields["unit"],
            value=_integer_text(fields["value"], "INVALID_SOURCE_VALUE"),
            scale=fields["scale"],
        )


def _fx_document(pair: EcbDailyPair) -> dict[str, Any]:
    return {
        "authority": "ECB",
        "available_at": utc_timestamp_text(pair.available_at),
        "carry_days": pair.carry_days,
        "cny_leg_revision_hash": pair.cny_leg.revision_hash,
        "cny_per_usd": _rate_text(pair),
        "method": "ECB_EUR_CROSS",
        "pair_hash": pair.pair_hash,
        "selection_policy_version": CNY_ANALYSIS_FX_SELECTION_POLICY,
        "source_event_date": pair.source_event_date.isoformat(),
        "usd_leg_revision_hash": pair.usd_leg.revision_hash,
    }


def _projection_lineage(
    source: AnalysisSourcePrice,
    *,
    target_value: int,
    target_basis: str,
    target_rounding: str,
    fx: Mapping[str, Any] | None,
    projected_at: datetime,
) -> str:
    return typed_record_hash(
        "cny-analysis-projection-v1",
        (
            ("source_fact_sha256", "sha256", source.source_fact_sha256),
            ("source_item_id", "integer", str(source.source_item_id)),
            ("analysis_unit_id", "string", source.analysis_unit_id),
            ("logical_source", "enum", source.logical_source),
            ("transport", "enum", source.transport),
            ("price_kind", "enum", source.price_kind),
            ("event_at", "timestamp", utc_timestamp_text(source.event_at)),
            ("source_available_at", "timestamp", utc_timestamp_text(source.source_available_at)),
            ("identity_available_at", "timestamp", utc_timestamp_text(source.identity_available_at)),
            ("source_currency", "currency", source.currency),
            ("source_unit", "unit", source.unit),
            ("source_value", "integer", str(source.value)),
            ("source_scale", "integer", str(source.scale)),
            ("fx_pair_hash", "sha256", None if fx is None else fx["pair_hash"]),
            ("fx_source_event_date", "date", None if fx is None else fx["source_event_date"]),
            ("cny_per_usd", "decimal", None if fx is None else fx["cny_per_usd"]),
            ("fx_available_at", "timestamp", None if fx is None else fx["available_at"]),
            ("fx_selection_policy", "string", None if fx is None else fx["selection_policy_version"]),
            ("conversion_policy", "string", CNY_ANALYSIS_CONVERSION_POLICY),
            ("target_value", "integer", str(target_value)),
            ("target_basis", "enum", target_basis),
            ("target_rounding", "enum", target_rounding),
            ("projected_at", "timestamp", utc_timestamp_text(projected_at)),
        ),
    )


def _assemble_projection(
    source: AnalysisSourcePrice,
    *,
    target_value: int,
    target_basis: str,
    target_rounding: str,
    fx: Mapping[str, Any] | None,
    projected_at: datetime,
) -> dict[str, Any]:
    lineage = _projection_lineage(
        source,
        target_value=target_value,
        target_basis=target_basis,
        target_rounding=target_rounding,
        fx=fx,
        projected_at=projected_at,
    )
    document: dict[str, Any] = {
        "available_at": utc_timestamp_text(projected_at),
        "conversion_policy_version": CNY_ANALYSIS_CONVERSION_POLICY,
        "document_hash": "",
        "event_day": source.event_at.date().isoformat(),
        "formal_state_eligible": False,
        "fx": None if fx is None else dict(fx),
        "lineage_sha256": lineage,
        "projected_at": utc_timestamp_text(projected_at),
        "projection_id": f"cny_analysis_projection_v1_{lineage[:24]}",
        "schema": CNY_ANALYSIS_SCHEMA,
        "source": source.to_document(),
        "target": {
            "basis": target_basis,
            "currency": "CNY",
            "reason": None,
            "rounding": target_rounding,
            "status": "AVAILABLE",
            "unit": "CNY_MINOR",
            "value": str(target_value),
        },
        "usage_scope": CNY_ANALYSIS_USAGE_SCOPE,
    }
    document["document_hash"] = sha256_hex(
        canonical_json_bytes({k: v for k, v in document.items() if k != "document_hash"})
    )
    return document


def project_analysis_price_to_cny(
    source: AnalysisSourcePrice,
    *,
    rate_book: EcbRateBook | None,
    projected_at: datetime,
) -> dict[str, Any]:
    """Project one sealed source price, or fail closed without an output fact."""
    _require(isinstance(source, AnalysisSourcePrice), "INVALID_SOURCE_DOCUMENT")
    projected = _utc(projected_at, "INVALID_PROJECTED_AT")
    _require(
        projected >= max(source.event_at, source.source_available_at, source.identity_available_at),
        "BACKDATED_PROJECTION",
    )
    if source.currency == "CNY":
        document = _assemble_projection(
            source,
            target_value=source.value,
            target_basis="NATIVE",
            target_rounding="EXACT",
            fx=None,
            projected_at=projected,
        )
        validate_cny_analysis_projection(document)
        return document
    _require(isinstance(rate_book, EcbRateBook), "FX_RATE_BOOK_REQUIRED")
    try:
        pair = rate_book.select(
            source.event_at.date(), known_at=projected, max_carry_days=7
        )
    except FxContractError:
        raise CnyAnalysisProjectionError("NO_ELIGIBLE_EVENT_DAY_FX") from None
    _require(pair.available_at <= projected, "FX_NOT_YET_KNOWN")
    expected_carry = (source.event_at.date() - pair.source_event_date).days
    _require(0 <= expected_carry <= 7 and pair.carry_days == expected_carry, "FX_CARRY_DRIFT")
    rate_units = int(_rate_text(pair).replace(".", ""))
    denominator = 10 ** (source.scale + 18 - 2)
    target_value, rounding = _half_even(source.value * rate_units, denominator)
    _require(target_value <= BIGINT_MAX, "CNY_MINOR_OVERFLOW")
    document = _assemble_projection(
        source,
        target_value=target_value,
        target_basis="FX_DERIVED",
        target_rounding=rounding,
        fx=_fx_document(pair),
        projected_at=projected,
    )
    validate_cny_analysis_projection(document)
    return document


def analysis_source_from_market_sector_eod_fact(
    value: object,
    *,
    source_item_id: int,
    identity_available_at: datetime,
) -> AnalysisSourcePrice:
    """Adapt one *actual* frozen V3 per-source EOD reduction.

    The V3 reduction deliberately retains only the canonical bucket and the
    latest availability instant of the contributing final-hour observations;
    it does not retain a standalone provider ``observed_at`` field.  Using the
    retained availability instant as both the conservative event and knowledge
    clock avoids inventing an earlier source event while still selecting FX by
    the exact UTC bucket date.  ``source_item_id`` is supplied from the exact
    upstream schema snapshot already bound by the V3 membership.
    """
    fact = _exact_fields(
        value,
        {
            "analysis_unit_id", "ask_atoms", "available_at", "bucket_date",
            "logical_source", "source_fact_sha256",
        },
        "INVALID_EOD_SOURCE_FACT",
    )
    try:
        bucket_date = date.fromisoformat(fact["bucket_date"])
    except (TypeError, ValueError):
        raise CnyAnalysisProjectionError("INVALID_EOD_BUCKET_DATE") from None
    available_at = _instant(fact["available_at"], "INVALID_SOURCE_AVAILABLE_AT")
    _require(available_at.date() == bucket_date, "EOD_BUCKET_EVENT_DATE_DRIFT")
    _require(
        type(fact["ask_atoms"]) is int and fact["ask_atoms"] > 0,
        "INVALID_SOURCE_VALUE",
    )
    return AnalysisSourcePrice(
        source_fact_sha256=fact["source_fact_sha256"],
        source_item_id=source_item_id,
        analysis_unit_id=_identifier(fact["analysis_unit_id"], "INVALID_ANALYSIS_UNIT"),
        logical_source=fact["logical_source"],
        transport="upstream",
        price_kind="ASK",
        event_at=available_at,
        source_available_at=available_at,
        identity_available_at=_utc(
            identity_available_at, "INVALID_IDENTITY_AVAILABLE_AT"
        ),
        currency="USD",
        unit="USD_ATOMS",
        value=fact["ask_atoms"],
        scale=8,
    )


def validate_cny_analysis_projection(value: object) -> dict[str, Any]:
    """Validate structure, arithmetic, clocks and both content hashes."""
    if isinstance(value, dict) and value.get("schema") == CNY_ANALYSIS_SCHEMA_V2:
        return _validate_projection_v2(value)
    document = _exact_fields(
        value,
        {
            "available_at", "conversion_policy_version", "document_hash", "event_day",
            "formal_state_eligible", "fx", "lineage_sha256", "projected_at",
            "projection_id", "schema", "source", "target", "usage_scope",
        },
        "INVALID_PROJECTION_DOCUMENT",
    )
    _require(document["schema"] == CNY_ANALYSIS_SCHEMA, "INVALID_PROJECTION_SCHEMA")
    _require(
        document["conversion_policy_version"] == CNY_ANALYSIS_CONVERSION_POLICY,
        "INVALID_CONVERSION_POLICY",
    )
    _require(document["usage_scope"] == CNY_ANALYSIS_USAGE_SCOPE, "INVALID_USAGE_SCOPE")
    _require(document["formal_state_eligible"] is False, "FORMAL_PROMOTION_FORBIDDEN")
    projected_at = _instant(document["projected_at"], "INVALID_PROJECTED_AT")
    _require(
        _instant(document["available_at"], "INVALID_AVAILABLE_AT") == projected_at,
        "AVAILABLE_AT_DRIFT",
    )
    source = AnalysisSourcePrice.from_document(document["source"])
    _require(document["event_day"] == source.event_at.date().isoformat(), "EVENT_DAY_DRIFT")
    _require(
        projected_at >= max(source.event_at, source.source_available_at, source.identity_available_at),
        "BACKDATED_PROJECTION",
    )
    target = _exact_fields(
        document["target"],
        {"basis", "currency", "reason", "rounding", "status", "unit", "value"},
        "INVALID_TARGET_DOCUMENT",
    )
    _require(
        target["status"] == "AVAILABLE"
        and target["currency"] == "CNY"
        and target["unit"] == "CNY_MINOR"
        and target["reason"] is None,
        "INVALID_TARGET_DOCUMENT",
    )
    target_value = _integer_text(target["value"], "INVALID_TARGET_VALUE")
    fx = document["fx"]
    if source.currency == "CNY":
        _require(fx is None, "NATIVE_CNY_MUST_NOT_BIND_FX")
        _require(
            target_value == source.value
            and target["basis"] == "NATIVE"
            and target["rounding"] == "EXACT",
            "NATIVE_CNY_PROJECTION_DRIFT",
        )
    else:
        fx = _exact_fields(
            fx,
            {
                "authority", "available_at", "carry_days", "cny_leg_revision_hash",
                "cny_per_usd", "method", "pair_hash", "selection_policy_version",
                "source_event_date", "usd_leg_revision_hash",
            },
            "INVALID_FX_DOCUMENT",
        )
        _require(
            fx["authority"] == "ECB"
            and fx["method"] == "ECB_EUR_CROSS"
            and fx["selection_policy_version"] == CNY_ANALYSIS_FX_SELECTION_POLICY,
            "INVALID_FX_DOCUMENT",
        )
        cny_leg = _hash(fx["cny_leg_revision_hash"], "INVALID_FX_HASH")
        usd_leg = _hash(fx["usd_leg_revision_hash"], "INVALID_FX_HASH")
        pair_hash = _hash(fx["pair_hash"], "INVALID_FX_HASH")
        _require(
            isinstance(fx["cny_per_usd"], str)
            and _RATE_18.fullmatch(fx["cny_per_usd"]) is not None
            and int(fx["cny_per_usd"].replace(".", "")) > 0,
            "INVALID_FX_RATE",
        )
        try:
            source_event_date = date.fromisoformat(fx["source_event_date"])
        except (TypeError, ValueError):
            raise CnyAnalysisProjectionError("INVALID_FX_EVENT_DATE") from None
        expected_carry = (source.event_at.date() - source_event_date).days
        _require(
            type(fx["carry_days"]) is int
            and fx["carry_days"] == expected_carry
            and 0 <= expected_carry <= 7,
            "FX_CARRY_DRIFT",
        )
        _require(
            _instant(fx["available_at"], "INVALID_FX_AVAILABLE_AT") <= projected_at,
            "FX_NOT_YET_KNOWN",
        )
        expected_pair_hash = typed_record_hash(
            "ecb-daily-pair-v1",
            (
                ("source_event_date", "date", source_event_date.isoformat()),
                ("cny_leg_revision_hash", "sha256", cny_leg),
                ("usd_leg_revision_hash", "sha256", usd_leg),
                ("cny_per_usd", "decimal", fx["cny_per_usd"].rstrip("0").rstrip(".")),
            ),
        )
        _require(pair_hash == expected_pair_hash, "FX_PAIR_HASH_DRIFT")
        expected_value, expected_rounding = _half_even(
            source.value * int(fx["cny_per_usd"].replace(".", "")),
            10 ** (source.scale + 18 - 2),
        )
        _require(expected_value <= BIGINT_MAX, "CNY_MINOR_OVERFLOW")
        _require(
            target_value == expected_value
            and target["basis"] == "FX_DERIVED"
            and target["rounding"] == expected_rounding,
            "CNY_PROJECTION_ARITHMETIC_DRIFT",
        )
    lineage = _projection_lineage(
        source,
        target_value=target_value,
        target_basis=target["basis"],
        target_rounding=target["rounding"],
        fx=fx,
        projected_at=projected_at,
    )
    _require(_hash(document["lineage_sha256"], "INVALID_LINEAGE_HASH") == lineage,
             "LINEAGE_HASH_DRIFT")
    _require(
        document["projection_id"] == f"cny_analysis_projection_v1_{lineage[:24]}",
        "PROJECTION_ID_DRIFT",
    )
    expected_document_hash = sha256_hex(
        canonical_json_bytes({k: v for k, v in document.items() if k != "document_hash"})
    )
    _require(
        _hash(document["document_hash"], "INVALID_DOCUMENT_HASH") == expected_document_hash,
        "DOCUMENT_HASH_DRIFT",
    )
    return dict(document)


def _v2_lineage(document: Mapping[str, Any], legacy_lineage: str) -> str:
    return sha256_hex(canonical_json_bytes({
        "schema": CNY_ANALYSIS_SCHEMA_V2,
        "arithmetic_lineage_sha256": legacy_lineage,
        "valuation_as_of": document["valuation_as_of"],
        "observation": document["observation"],
        "economic_identity": document["economic_identity"],
    }))


def _validate_projection_v2(document: dict[str, Any]) -> dict[str, Any]:
    extra = {"valuation_as_of", "observation", "economic_identity"}
    _require(set(document) == extra | {
        "available_at", "conversion_policy_version", "document_hash", "event_day",
        "formal_state_eligible", "fx", "lineage_sha256", "projected_at",
        "projection_id", "schema", "source", "target", "usage_scope",
    }, "INVALID_PROJECTION_DOCUMENT")
    # Reuse v1 structural/arithmetic checks before touching attacker-provided
    # nested fields. Its final v1 lineage intentionally differs for a v2 record.
    legacy_input = {key: value for key, value in document.items() if key not in extra}
    legacy_input["schema"] = CNY_ANALYSIS_SCHEMA
    try:
        validate_cny_analysis_projection(legacy_input)
    except CnyAnalysisProjectionError as exc:
        if exc.code not in {"LINEAGE_HASH_DRIFT", "PROJECTION_ID_DRIFT"}:
            raise
    source = AnalysisSourcePrice.from_document(document.get("source"))
    target = document.get("target")
    _require(isinstance(target, dict), "INVALID_TARGET_DOCUMENT")
    projected = _instant(document.get("projected_at"), "INVALID_PROJECTED_AT")
    valuation = _instant(document["valuation_as_of"], "INVALID_VALUATION_AS_OF")
    _require(source.event_at <= valuation <= projected, "VALUATION_CLOCK_ORDER")
    legacy = _assemble_projection(
        source, target_value=_integer_text(target.get("value"), "INVALID_TARGET_VALUE"),
        target_basis=target.get("basis"), target_rounding=target.get("rounding"),
        fx=document.get("fx"), projected_at=projected,
    )
    _require(set(document) == set(legacy) | extra, "INVALID_PROJECTION_DOCUMENT")
    for field in set(legacy) - {"schema", "lineage_sha256", "projection_id", "document_hash"}:
        _require(document[field] == legacy[field], "PROJECTION_V2_FIELD_DRIFT")
    if document["fx"] is not None:
        _require(_instant(document["fx"]["available_at"], "INVALID_FX_AVAILABLE_AT") <= valuation,
                 "FX_NOT_KNOWN_AT_VALUATION")
    observation = document["observation"]
    if observation is not None:
        observation = _exact_fields(observation, {
            "kind", "interval_start", "interval_end", "reduction_policy_sha256",
            "reduction_sha256", "supplied_slot_count", "positive_fresh_slot_count",
            "coverage_evidence_sha256",
        }, "INVALID_OBSERVATION_DESCRIPTOR")
        _require(observation["kind"] == "UTC_DAILY_EOD", "INVALID_OBSERVATION_KIND")
        start = _instant(observation["interval_start"], "INVALID_OBSERVATION_START")
        end = _instant(observation["interval_end"], "INVALID_OBSERVATION_END")
        _require(start == datetime.combine(source.event_at.date(), time.min, UTC)
                 and end == start + timedelta(days=1)
                 and end <= valuation, "EOD_INTERVAL_NOT_CLOSED")
        _require(type(observation["supplied_slot_count"]) is int
                 and 9 <= observation["supplied_slot_count"] <= 12
                 and type(observation["positive_fresh_slot_count"]) is int
                 and 9 <= observation["positive_fresh_slot_count"] <= observation["supplied_slot_count"],
                 "INVALID_EOD_COVERAGE")
        _hash(observation["reduction_policy_sha256"], "INVALID_EOD_POLICY_HASH")
        _hash(observation["reduction_sha256"], "INVALID_EOD_REDUCTION_HASH")
        _hash(observation["coverage_evidence_sha256"], "INVALID_EOD_COVERAGE_HASH")
    identity = document["economic_identity"]
    if identity is not None:
        identity = _exact_fields(identity, {
            "fingerprint_sha256", "evidence_sha256", "available_at",
        }, "INVALID_ECONOMIC_IDENTITY")
        _hash(identity["fingerprint_sha256"], "INVALID_ECONOMIC_FINGERPRINT")
        _hash(identity["evidence_sha256"], "INVALID_ECONOMIC_EVIDENCE")
        _require(_instant(identity["available_at"], "INVALID_ECONOMIC_AVAILABLE_AT") <= projected,
                 "ECONOMIC_IDENTITY_NOT_YET_KNOWN")
    lineage = _v2_lineage(document, legacy["lineage_sha256"])
    _require(document["lineage_sha256"] == lineage, "LINEAGE_HASH_DRIFT")
    _require(document["projection_id"] == f"cny_analysis_projection_v2_{lineage[:24]}",
             "PROJECTION_ID_DRIFT")
    _require(document["document_hash"] == sha256_hex(canonical_json_bytes({
        key: value for key, value in document.items() if key != "document_hash"
    })), "DOCUMENT_HASH_DRIFT")
    return dict(document)


def project_analysis_price_to_cny_v2(
    source: AnalysisSourcePrice, *, rate_book: EcbRateBook | None,
    valuation_as_of: datetime, projected_at: datetime,
    observation: Mapping[str, Any] | None = None,
    economic_identity: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Select FX at valuation; bind the later actual materialization separately.

    Missing observation/economic evidence stays explicitly unproven. The v1
    decoder remains available for old evidence, without upgrading its clocks.
    """
    _require(isinstance(source, AnalysisSourcePrice), "INVALID_SOURCE_DOCUMENT")
    valuation = _utc(valuation_as_of, "INVALID_VALUATION_AS_OF")
    projected = _utc(projected_at, "INVALID_PROJECTED_AT")
    _require(source.event_at <= valuation <= projected, "VALUATION_CLOCK_ORDER")
    _require(projected >= max(source.source_available_at, source.identity_available_at),
             "BACKDATED_PROJECTION")
    fx = None
    target_value, basis, rounding = source.value, "NATIVE", "EXACT"
    if source.currency == "USD":
        _require(isinstance(rate_book, EcbRateBook), "FX_RATE_BOOK_REQUIRED")
        try:
            pair = rate_book.select(source.event_at.date(), known_at=valuation, max_carry_days=7)
        except FxContractError:
            raise CnyAnalysisProjectionError("NO_ELIGIBLE_EVENT_DAY_FX") from None
        fx = _fx_document(pair)
        target_value, rounding = _half_even(
            source.value * int(fx["cny_per_usd"].replace(".", "")),
            10 ** (source.scale + 18 - 2),
        )
        _require(target_value <= BIGINT_MAX, "CNY_MINOR_OVERFLOW")
        basis = "FX_DERIVED"
    document = _assemble_projection(
        source, target_value=target_value, target_basis=basis,
        target_rounding=rounding, fx=fx, projected_at=projected,
    )
    return _seal_projection_v2(
        document, valuation_as_of=utc_timestamp_text(valuation),
        observation=observation, economic_identity=economic_identity,
    )


def _seal_projection_v2(
    document: dict[str, Any], *, valuation_as_of: str,
    observation: Mapping[str, Any] | None,
    economic_identity: Mapping[str, Any] | None,
) -> dict[str, Any]:
    document.update({
        "schema": CNY_ANALYSIS_SCHEMA_V2,
        "valuation_as_of": valuation_as_of,
        "observation": None if observation is None else dict(observation),
        "economic_identity": None if economic_identity is None else dict(economic_identity),
    })
    document["lineage_sha256"] = _v2_lineage(document, document["lineage_sha256"])
    document["projection_id"] = f"cny_analysis_projection_v2_{document['lineage_sha256'][:24]}"
    document["document_hash"] = sha256_hex(canonical_json_bytes({
        key: value for key, value in document.items() if key != "document_hash"
    }))
    return validate_cny_analysis_projection(document)


def finalize_cny_analysis_projection_v2(
    value: object, *, projected_at: datetime,
) -> dict[str, Any]:
    """Seal an in-memory calculation at completion without selecting FX again.

    This returns a new content-addressed object. It does not overwrite an old
    artifact or assert that later file serialization/publication is complete.
    """
    prepared = validate_cny_analysis_projection(value)
    _require(prepared["schema"] == CNY_ANALYSIS_SCHEMA_V2,
             "LEGACY_MATERIALIZATION_UNPROVEN")
    completed = _utc(projected_at, "INVALID_PROJECTED_AT")
    _require(completed >= _instant(prepared["projected_at"], "INVALID_PROJECTED_AT"),
             "COMPLETION_CLOCK_REVERSED")
    target = prepared["target"]
    document = _assemble_projection(
        AnalysisSourcePrice.from_document(prepared["source"]),
        target_value=int(target["value"]), target_basis=target["basis"],
        target_rounding=target["rounding"], fx=prepared["fx"], projected_at=completed,
    )
    return _seal_projection_v2(
        document, valuation_as_of=prepared["valuation_as_of"],
        observation=prepared["observation"], economic_identity=prepared["economic_identity"],
    )


__all__ = [
    "AnalysisSourcePrice",
    "BIGINT_MAX",
    "CNY_ANALYSIS_CONVERSION_POLICY",
    "CNY_ANALYSIS_FX_SELECTION_POLICY",
    "CNY_ANALYSIS_SCHEMA",
    "CNY_ANALYSIS_SCHEMA_V2",
    "CNY_ANALYSIS_USAGE_SCOPE",
    "CnyAnalysisProjectionError",
    "analysis_source_from_market_sector_eod_fact",
    "project_analysis_price_to_cny",
    "project_analysis_price_to_cny_v2",
    "finalize_cny_analysis_projection_v2",
    "validate_cny_analysis_projection",
]
