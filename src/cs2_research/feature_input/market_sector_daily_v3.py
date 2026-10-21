"""Analysis-unit keyed prospective measurements for V3 MARKET/SECTOR scopes.

V3 contains provisional CASE and AGENT identities that cannot be represented by
the legacy positive-integer ``item_id`` join.  This module keys every fact by
the sealed ``analysis_unit_id`` instead.  It produces price/return measurements
for every V3 scope, but deliberately does not run a lifecycle or open a profile.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal, localcontext
from enum import StrEnum
from typing import Any, Iterable, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text

from .market_sector_taxonomy_v3 import PROVIDER_IDS_V3, TaxonomyMembershipV3


V3_DAILY_MEASUREMENT_SCHEMA = "market-sector-daily-measurement/3"
V3_DAILY_USAGE_SCOPE = "INTERNAL_PROSPECTIVE_MARKET_SECTOR_V3_MEASUREMENT"
V3_FUSION_RULE = "TWO_SOURCE_MEAN_THREE_SOURCE_MEDIAN"
V3_RETURN_RULE = "ADJACENT_COMPLETE_UTC_DAY_IDENTICAL_SOURCE_SET_SIMPLE_RETURN"
V3_ROBUST_RULE = "SYMMETRIC_1_PERCENT_WINSOR_MINIMUM_ONE_HUNDRED"
GROSS_ERROR_RATIO_LIMIT_V3 = Decimal("1000")


class MarketSectorDailyV3Error(ValueError):
    """A V3 daily fact or measurement violates its prospective boundary."""


class V3MemberPriceStatus(StrEnum):
    QUALIFIED = "QUALIFIED"
    INSUFFICIENT_SOURCES = "INSUFFICIENT_SOURCES"
    INVALID_VALUE = "INVALID_VALUE"


def _require(condition: bool, code: str) -> None:
    if not condition:
        raise MarketSectorDailyV3Error(code)


def _utc(value: datetime, field: str) -> datetime:
    _require(
        isinstance(value, datetime)
        and value.tzinfo is not None
        and value.utcoffset() == timedelta(0),
        f"{field}:UTC_REQUIRED",
    )
    return value.astimezone(UTC)


def _hash64(value: object, field: str) -> str:
    _require(
        isinstance(value, str)
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value),
        f"{field}:LOWERCASE_SHA256_REQUIRED",
    )
    return value


def _median(values: Iterable[Decimal]) -> Decimal:
    ordered = sorted(values)
    _require(bool(ordered), "MEDIAN_EMPTY")
    middle = len(ordered) // 2
    return ordered[middle] if len(ordered) % 2 else (ordered[middle - 1] + ordered[middle]) / 2


def _decimal_text(value: Decimal | None) -> str | None:
    return None if value is None else format(value, "f")


@dataclass(frozen=True, slots=True)
class V3ReducedSourceAskFact:
    analysis_unit_id: str
    bucket_date: date
    logical_source: str
    ask_atoms: int | None
    available_at: datetime
    source_fact_sha256: str

    def __post_init__(self) -> None:
        _require(isinstance(self.analysis_unit_id, str) and self.analysis_unit_id, "FACT_ANALYSIS_UNIT")
        _require(self.logical_source in PROVIDER_IDS_V3, "FACT_LOGICAL_SOURCE")
        _require(
            self.ask_atoms is None or (type(self.ask_atoms) is int and self.ask_atoms >= 0),
            "FACT_ASK_ATOMS",
        )
        _utc(self.available_at, "FACT_AVAILABLE_AT")
        _hash64(self.source_fact_sha256, "FACT_SHA256")


@dataclass(frozen=True, slots=True)
class V3FusedMemberAsk:
    analysis_unit_id: str
    identity_sha256: str
    status: V3MemberPriceStatus
    fused_ask_atoms: Decimal | None
    participating_sources: tuple[str, ...]
    reason_codes: tuple[str, ...]
    lineage_sha256: str


@dataclass(frozen=True, slots=True)
class V3DailyPriceFrame:
    bucket_date: date
    available_at: datetime
    membership_id: str
    input_snapshot_sha256: str
    members: tuple[V3FusedMemberAsk, ...]

    @property
    def frame_id(self) -> str:
        return "market_sector_v3_price_frame_" + sha256_hex(
            canonical_json_bytes(v3_price_frame_document(self))
        )


def build_v3_daily_price_frame(
    *,
    membership: TaxonomyMembershipV3,
    bucket_date: date,
    available_at: datetime,
    facts: Iterable[V3ReducedSourceAskFact],
    input_snapshot_sha256: str,
) -> V3DailyPriceFrame:
    """Fuse one complete UTC day without requiring a legacy integer item id."""

    available_at = _utc(available_at, "FRAME_AVAILABLE_AT")
    _hash64(input_snapshot_sha256, "INPUT_SNAPSHOT_SHA256")
    _require(
        available_at >= datetime.combine(bucket_date + timedelta(days=1), time.min, tzinfo=UTC),
        "UTC_DAY_NOT_COMPLETE",
    )
    _require(membership.sealed_at <= available_at, "MEMBERSHIP_NOT_AVAILABLE")
    member_by_id = {member.analysis_unit_id: member for member in membership.members}
    grouped: dict[str, list[V3ReducedSourceAskFact]] = {}
    seen: set[tuple[str, str]] = set()
    for fact in facts:
        _require(fact.bucket_date == bucket_date, "FACT_BUCKET_DATE_DRIFT")
        _require(fact.available_at <= available_at, "FACT_FROM_FUTURE")
        member = member_by_id.get(fact.analysis_unit_id)
        _require(member is not None, "FACT_OUTSIDE_MEMBERSHIP")
        _require(fact.logical_source in member.source_ids_present, "FACT_SOURCE_NOT_BOUND_TO_MEMBER")
        key = (fact.analysis_unit_id, fact.logical_source)
        _require(key not in seen, "DUPLICATE_LOGICAL_SOURCE_FACT")
        seen.add(key)
        grouped.setdefault(fact.analysis_unit_id, []).append(fact)

    outputs: list[V3FusedMemberAsk] = []
    with localcontext() as context:
        context.prec = 50
        for member in membership.members:
            present = sorted(grouped.get(member.analysis_unit_id, ()), key=lambda row: row.logical_source)
            positive = tuple(row for row in present if row.ask_atoms is not None and row.ask_atoms > 0)
            invalid = tuple(row for row in present if row.ask_atoms is not None and row.ask_atoms <= 0)
            sources = tuple(row.logical_source for row in positive)
            if len(positive) >= 2:
                status = V3MemberPriceStatus.QUALIFIED
                fused = _median(Decimal(row.ask_atoms) for row in positive)
                reasons = ("MINIMUM_TWO_LOGICAL_SOURCES",)
            elif invalid:
                status = V3MemberPriceStatus.INVALID_VALUE
                fused = None
                reasons = ("NON_POSITIVE_ASK_PRESENT_AND_MINIMUM_TWO_NOT_MET",)
            else:
                status = V3MemberPriceStatus.INSUFFICIENT_SOURCES
                fused = None
                reasons = ("MINIMUM_TWO_LOGICAL_SOURCES_NOT_MET",)
            lineage = sha256_hex(
                canonical_json_bytes(
                    {
                        "facts": [row.source_fact_sha256 for row in present],
                        "identity_sha256": member.identity_sha256,
                        "participating_sources": list(sources),
                        "status": status.value,
                    }
                )
            )
            outputs.append(
                V3FusedMemberAsk(
                    analysis_unit_id=member.analysis_unit_id,
                    identity_sha256=member.identity_sha256,
                    status=status,
                    fused_ask_atoms=fused,
                    participating_sources=sources,
                    reason_codes=reasons,
                    lineage_sha256=lineage,
                )
            )
    return V3DailyPriceFrame(
        bucket_date=bucket_date,
        available_at=available_at,
        membership_id=membership.membership_id,
        input_snapshot_sha256=input_snapshot_sha256,
        members=tuple(outputs),
    )


def _symmetric_winsor(
    values: list[tuple[str, Decimal]],
) -> tuple[dict[str, Decimal], tuple[Mapping[str, str], ...], str]:
    if len(values) < 100:
        return (
            dict(values),
            (),
            (
                "NO_VALID_RETURNS"
                if not values
                else "INSUFFICIENT_FOR_SYMMETRIC_1_PERCENT_WINSOR"
            ),
        )
    ordered = sorted(value for _, value in values)
    tail_count = len(values) // 100
    lower = ordered[tail_count]
    upper = ordered[-tail_count - 1]
    adjusted = {key: min(max(value, lower), upper) for key, value in values}
    contributions = tuple(
        {
            "analysis_unit_id": key,
            "raw_return": _decimal_text(value),
            "suppressed_return": _decimal_text(adjusted[key]),
        }
        for key, value in sorted(values)
        if adjusted[key] != value
    )
    return adjusted, contributions, "SYMMETRIC_1_PERCENT_WINSOR_APPLIED"


def _top_absolute_contribution_share(
    values: list[tuple[str, Decimal]], count: int
) -> Decimal | None:
    magnitudes = sorted((abs(value) for _, value in values), reverse=True)
    total = sum(magnitudes, Decimal(0))
    if not magnitudes:
        return None
    if total == 0:
        return Decimal(0)
    return sum(magnitudes[:count], Decimal(0)) / total


def build_v3_daily_scope_measurement(
    *,
    membership: TaxonomyMembershipV3,
    previous: V3DailyPriceFrame,
    current: V3DailyPriceFrame,
) -> Mapping[str, Any]:
    """Measure every V3 scope; lifecycle and state eligibility remain disabled."""

    _require(current.bucket_date == previous.bucket_date + timedelta(days=1), "COMPLETE_UTC_DAY_GAP")
    _require(
        previous.membership_id == current.membership_id == membership.membership_id,
        "MEMBERSHIP_ID_DRIFT",
    )
    _require(current.available_at >= previous.available_at, "KNOWLEDGE_CLOCK_REVERSED")
    _require(
        tuple(row.analysis_unit_id for row in previous.members)
        == tuple(row.analysis_unit_id for row in current.members)
        == tuple(row.analysis_unit_id for row in membership.members),
        "MEMBER_ORDER_DRIFT",
    )
    returns: dict[str, tuple[Decimal | None, str]] = {}
    with localcontext() as context:
        context.prec = 50
        for old, new in zip(previous.members, current.members):
            if old.status is not V3MemberPriceStatus.QUALIFIED or new.status is not V3MemberPriceStatus.QUALIFIED:
                returns[new.analysis_unit_id] = (None, "MISSING_OR_INVALID_ENDPOINT")
            elif old.participating_sources != new.participating_sources:
                returns[new.analysis_unit_id] = (None, "SOURCE_SET_BREAK")
            else:
                assert old.fused_ask_atoms is not None and new.fused_ask_atoms is not None
                ratio = new.fused_ask_atoms / old.fused_ask_atoms
                if ratio > GROSS_ERROR_RATIO_LIMIT_V3 or ratio < 1 / GROSS_ERROR_RATIO_LIMIT_V3:
                    returns[new.analysis_unit_id] = (None, "GROSS_ERROR_QUARANTINE")
                else:
                    returns[new.analysis_unit_id] = (ratio - 1, "VALID")

    scope_codes = sorted({"ALL", *(scope for member in membership.members for scope in member.scope_codes)})
    current_by_id = {row.analysis_unit_id: row for row in current.members}
    scopes: list[dict[str, Any]] = []
    for scope in scope_codes:
        members = membership.scope_members(scope)
        ids = {member.analysis_unit_id for member in members}
        prices = [
            current_by_id[key].fused_ask_atoms
            for key in ids
            if current_by_id[key].status is V3MemberPriceStatus.QUALIFIED
        ]
        valid = [(key, returns[key][0]) for key in sorted(ids) if returns[key][1] == "VALID"]
        typed_valid = [(key, value) for key, value in valid if value is not None]
        adjusted, anomaly_contributions, suppression_reason = _symmetric_winsor(
            typed_valid
        )
        raw = robust = median = advancing = declining = flat = None
        if typed_valid:
            raw = sum(value for _, value in typed_valid) / len(typed_valid)
            robust = sum(adjusted.values()) / len(adjusted)
            median = _median(value for _, value in typed_valid)
            advancing = Decimal(sum(value > 0 for _, value in typed_valid)) / len(typed_valid)
            declining = Decimal(sum(value < 0 for _, value in typed_valid)) / len(typed_valid)
            flat = Decimal(sum(value == 0 for _, value in typed_valid)) / len(typed_valid)
        fixed_cohort_ids = {
            member.analysis_unit_id
            for member in members
            if len(member.source_ids_present) >= 2
        }
        fixed_valid = [
            (key, value) for key, value in typed_valid if key in fixed_cohort_ids
        ]
        fixed_composition_identifiable = bool(fixed_cohort_ids) and len(
            fixed_valid
        ) == len(fixed_cohort_ids)
        fixed_adjusted, _, _ = _symmetric_winsor(fixed_valid)
        fixed_raw = fixed_robust = None
        if fixed_composition_identifiable:
            fixed_raw = sum(value for _, value in fixed_valid) / len(fixed_valid)
            fixed_robust = sum(fixed_adjusted.values()) / len(fixed_adjusted)
        scopes.append(
            {
                "advancing_member_ratio": _decimal_text(advancing),
                "anomaly_contributions": list(anomaly_contributions),
                "anomaly_member_count": len(anomaly_contributions),
                "catalog_direction_identifiable": len(typed_valid) == len(members),
                "current_mean_fused_ask_atoms": _decimal_text(
                    None if not prices else sum(prices) / len(prices)
                ),
                "current_price_coverage": _decimal_text(Decimal(len(prices)) / len(members)),
                "current_qualified_price_count": len(prices),
                "current_sum_fused_ask_atoms": _decimal_text(None if not prices else sum(prices)),
                "declining_member_ratio": _decimal_text(declining),
                "estimator_applied": len(typed_valid) >= 100,
                "fixed_cohort_composition_identifiable": fixed_composition_identifiable,
                "fixed_cohort_member_count": len(fixed_cohort_ids),
                "fixed_cohort_raw_equal_member_return": _decimal_text(fixed_raw),
                "fixed_cohort_return_coverage": _decimal_text(
                    None
                    if not fixed_cohort_ids
                    else Decimal(len(fixed_valid)) / len(fixed_cohort_ids)
                ),
                "fixed_cohort_robust_equal_member_return": _decimal_text(
                    fixed_robust
                ),
                "fixed_cohort_valid_return_count": len(fixed_valid),
                "flat_member_ratio": _decimal_text(flat),
                "formal_state_eligible": False,
                "median_member_return": _decimal_text(median),
                "member_count": len(members),
                "missing_or_invalid_endpoint_count": sum(
                    returns[key][1] == "MISSING_OR_INVALID_ENDPOINT" for key in ids
                ),
                "raw_equal_member_return": _decimal_text(raw),
                "return_coverage": _decimal_text(Decimal(len(typed_valid)) / len(members)),
                "robust_equal_member_return": _decimal_text(robust),
                "scope_code": scope,
                "scope_role": (
                    "RAW_ONLY_VISIBLE_NO_STATE" if len(members) < 5 else "PROSPECTIVE_MEASUREMENT_ONLY"
                ),
                "source_set_break_count": sum(returns[key][1] == "SOURCE_SET_BREAK" for key in ids),
                "source_incapable_member_count": len(members) - len(fixed_cohort_ids),
                "suppression_reason_code": suppression_reason,
                "top1_absolute_contribution_share": _decimal_text(
                    _top_absolute_contribution_share(typed_valid, 1)
                ),
                "top5_absolute_contribution_share": _decimal_text(
                    _top_absolute_contribution_share(typed_valid, 5)
                ),
                "gross_error_quarantine_count": sum(
                    returns[key][1] == "GROSS_ERROR_QUARANTINE" for key in ids
                ),
                "valid_return_count": len(typed_valid),
            }
        )
    return {
        "bucket_date": current.bucket_date.isoformat(),
        "current_price_frame_id": current.frame_id,
        "formal_state_eligible": False,
        "fusion_rule": V3_FUSION_RULE,
        "membership_id": membership.membership_id,
        "previous_bucket_date": previous.bucket_date.isoformat(),
        "previous_price_frame_id": previous.frame_id,
        "profile_opened": False,
        "return_rule": V3_RETURN_RULE,
        "robust_rule": V3_ROBUST_RULE,
        "schema": V3_DAILY_MEASUREMENT_SCHEMA,
        "scope_count": len(scopes),
        "scopes": scopes,
        "state_transition_permitted": False,
        "usage_scope": V3_DAILY_USAGE_SCOPE,
    }


def v3_price_frame_document(frame: V3DailyPriceFrame) -> dict[str, Any]:
    return {
        "available_at": utc_timestamp_text(frame.available_at),
        "bucket_date": frame.bucket_date.isoformat(),
        "input_snapshot_sha256": frame.input_snapshot_sha256,
        "membership_id": frame.membership_id,
        "members": [
            {
                "analysis_unit_id": row.analysis_unit_id,
                "fused_ask_atoms": _decimal_text(row.fused_ask_atoms),
                "identity_sha256": row.identity_sha256,
                "lineage_sha256": row.lineage_sha256,
                "participating_sources": list(row.participating_sources),
                "reason_codes": list(row.reason_codes),
                "status": row.status.value,
            }
            for row in frame.members
        ],
        "schema": "market-sector-v3-price-frame/1",
    }


__all__ = [
    "MarketSectorDailyV3Error",
    "V3DailyPriceFrame",
    "V3FusedMemberAsk",
    "V3MemberPriceStatus",
    "V3ReducedSourceAskFact",
    "V3_DAILY_MEASUREMENT_SCHEMA",
    "V3_DAILY_USAGE_SCOPE",
    "build_v3_daily_price_frame",
    "build_v3_daily_scope_measurement",
    "v3_price_frame_document",
]
