"""Deterministic daily minimum-ask fusion for MARKET/SECTOR V0.

The current transport is upstream, but its MARKET_A/MarketC/MarketB rows remain three
logical source facts.  Transport identity never receives a vote.  Values stay
in provider USD and every derived return requires the same qualified logical
source set at both endpoints.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal, localcontext
from enum import StrEnum
from pathlib import Path
from typing import Iterable

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.state_machine.hashing import content_id, stable_hash
from cs2_research.state_machine.market_sector_contract import (
    AnomalyContribution,
    AxisAvailability,
    DailyDataQuality,
    DailyQualityStatus,
    MARKET_SECTOR_V0_LISTING_SEMANTICS,
    MARKET_SECTOR_V0_LOGICAL_SOURCES,
    MARKET_SECTOR_V0_TRANSPORT,
    PressureAxisAssessment,
    PressureStrength,
)


class DailyProducerError(ValueError):
    """A daily input would violate the frozen V0 transport or time contract."""


class DailyMemberPriceStatus(StrEnum):
    VALID = "VALID"
    INSUFFICIENT_SOURCES = "INSUFFICIENT_SOURCES"
    INVALID_VALUE = "INVALID_VALUE"


class DailyMemberReturnStatus(StrEnum):
    VALID = "VALID"
    MISSING_ENDPOINT = "MISSING_ENDPOINT"
    INVALID_ENDPOINT = "INVALID_ENDPOINT"
    SOURCE_SET_BREAK = "SOURCE_SET_BREAK"
    QUARANTINED_RETURN = "QUARANTINED_RETURN"


class SuppressionMethod(StrEnum):
    NONE = "NONE"
    WINSOR_1_PERCENT = "WINSOR_1_PERCENT"
    MEDIAN_5_MAD = "MEDIAN_5_MAD"
    MEDIAN_8_MAD = "MEDIAN_8_MAD"


# The same fail-closed cross-day bound used by the historical V1 path.  Keeping
# it here makes the member-return qualification shared by retrospective and
# prospective consumers instead of relying on a later aggregate-level check.
GROSS_ERROR_RATIO_LIMIT = Decimal("1000")


def _utc(value: datetime, field: str) -> None:
    if value.tzinfo is None or value.utcoffset() != timedelta(0):
        raise DailyProducerError(f"{field} must use UTC")


def _sha(value: str, field: str) -> None:
    if (
        not isinstance(value, str)
        or len(value) != 64
        or any(character not in "0123456789abcdef" for character in value)
    ):
        raise DailyProducerError(f"{field} must be lowercase SHA-256")


def _median(values: Iterable[Decimal]) -> Decimal:
    ordered = sorted(values)
    if not ordered:
        raise DailyProducerError("median requires at least one value")
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / Decimal(2)


@dataclass(frozen=True, slots=True)
class DailyMembershipMember:
    item_id: int
    analysis_unit_id: str
    sector_codes: tuple[str, ...]
    member_sha256: str

    def __post_init__(self) -> None:
        if type(self.item_id) is not int or self.item_id <= 0:
            raise DailyProducerError("item_id must be a positive integer")
        if not self.analysis_unit_id:
            raise DailyProducerError("analysis_unit_id is required")
        if not self.sector_codes or tuple(sorted(set(self.sector_codes))) != self.sector_codes:
            raise DailyProducerError("sector_codes must be sorted and unique")
        if any(not code or code == "ALL" for code in self.sector_codes):
            raise DailyProducerError("sector code is invalid")
        _sha(self.member_sha256, "member_sha256")


@dataclass(frozen=True, slots=True)
class DailyMembership:
    contract_version: str
    event_as_of: datetime
    available_at: datetime
    members: tuple[DailyMembershipMember, ...]
    retrospective_late_bound: bool = False
    sealed_membership_id: str | None = None

    def __post_init__(self) -> None:
        if not self.contract_version:
            raise DailyProducerError("membership contract version is required")
        _utc(self.event_as_of, "membership event_as_of")
        _utc(self.available_at, "membership available_at")
        if self.available_at < self.event_as_of:
            raise DailyProducerError("membership cannot be known before its event")
        if not self.members:
            raise DailyProducerError("membership must contain members")
        order = tuple(member.item_id for member in self.members)
        if order != tuple(sorted(set(order))):
            raise DailyProducerError("membership members must be item-id sorted and unique")
        units = tuple(member.analysis_unit_id for member in self.members)
        if len(units) != len(set(units)):
            raise DailyProducerError("analysis units must be unique")
        if self.sealed_membership_id is not None and not self.sealed_membership_id:
            raise DailyProducerError("sealed membership id cannot be empty")

    @property
    def membership_id(self) -> str:
        return self.sealed_membership_id or content_id(
            "market_sector_daily_membership", self
        )

    def scope_members(self, scope_code: str) -> tuple[DailyMembershipMember, ...]:
        if scope_code == "ALL":
            return self.members
        return tuple(member for member in self.members if scope_code in member.sector_codes)


@dataclass(frozen=True, slots=True)
class DailySourceAskFact:
    item_id: int
    bucket_date: date
    logical_source: str
    ask_atoms: int | None
    visible_listing_slots: int | None
    observed_at: datetime
    available_at: datetime
    source_fact_sha256: str
    transport: str = MARKET_SECTOR_V0_TRANSPORT

    def __post_init__(self) -> None:
        if type(self.item_id) is not int or self.item_id <= 0:
            raise DailyProducerError("source fact item_id must be positive")
        if self.logical_source not in MARKET_SECTOR_V0_LOGICAL_SOURCES:
            raise DailyProducerError("unknown logical source")
        if self.ask_atoms is not None and (
            type(self.ask_atoms) is not int or self.ask_atoms < 0
        ):
            raise DailyProducerError("ask_atoms must preserve null/zero/non-negative")
        if self.visible_listing_slots is not None and (
            type(self.visible_listing_slots) is not int
            or self.visible_listing_slots < 0
        ):
            raise DailyProducerError("listing slots must be null or non-negative")
        _utc(self.observed_at, "observed_at")
        _utc(self.available_at, "available_at")
        if self.available_at < self.observed_at:
            raise DailyProducerError("source fact cannot be available before observation")
        _sha(self.source_fact_sha256, "source_fact_sha256")
        if self.transport != MARKET_SECTOR_V0_TRANSPORT:
            raise DailyProducerError("source transport drift")


@dataclass(frozen=True, slots=True)
class DailyFusedMemberAsk:
    analysis_unit_id: str
    item_id: int
    status: DailyMemberPriceStatus
    fused_ask_atoms: Decimal | None
    participating_sources: tuple[str, ...]
    source_asks: tuple[tuple[str, int | None], ...]
    visible_listing_slots: int | None
    reason_codes: tuple[str, ...]
    lineage_sha256: str


@dataclass(frozen=True, slots=True)
class DailyPriceFrame:
    bucket_date: date
    available_at: datetime
    membership_id: str
    input_snapshot_hash: str
    members: tuple[DailyFusedMemberAsk, ...]
    retrospective_late_bound: bool
    transport: str = MARKET_SECTOR_V0_TRANSPORT
    currency_unit: str = "USD_MAJOR_SOURCE"

    @property
    def frame_id(self) -> str:
        return content_id("market_sector_daily_price_frame", self)


@dataclass(frozen=True, slots=True)
class DailyMemberReturn:
    analysis_unit_id: str
    item_id: int
    status: DailyMemberReturnStatus
    value: Decimal | None
    participating_sources: tuple[str, ...]
    current_visible_listing_slots: int | None
    reason_codes: tuple[str, ...]
    lineage_sha256: str


@dataclass(frozen=True, slots=True)
class DailyReturnFrame:
    previous_date: date
    bucket_date: date
    available_at: datetime
    membership_id: str
    previous_price_frame_id: str
    current_price_frame_id: str
    members: tuple[DailyMemberReturn, ...]
    retrospective_late_bound: bool
    currency_unit: str = "USD_MAJOR_SOURCE"

    @property
    def frame_id(self) -> str:
        return content_id("market_sector_daily_return_frame", self)


@dataclass(frozen=True, slots=True)
class DailyScopeAggregation:
    scope_code: str
    bucket_date: date
    raw_price_change: Decimal | None
    suppressed_price_change: Decimal | None
    suppression_difference: Decimal | None
    anomaly_contributions: tuple[AnomalyContribution, ...]
    advancing_member_ratio: Decimal | None
    declining_member_ratio: Decimal | None
    flat_member_ratio: Decimal | None
    median_member_return: Decimal | None
    visible_listing_slots: int | None
    data_quality: DailyDataQuality
    supply_pressure: PressureAxisAssessment
    contributing_source_sets: tuple[tuple[str, ...], ...]
    suppression_method: SuppressionMethod
    suppression_reason_code: str
    return_frame_id: str


def build_daily_price_frame(
    *,
    membership: DailyMembership,
    bucket_date: date,
    available_at: datetime,
    facts: Iterable[DailySourceAskFact],
    input_snapshot_hash: str,
) -> DailyPriceFrame:
    """Fuse one complete UTC day without cheapest-source selection or fallback."""

    _utc(available_at, "frame available_at")
    _sha(input_snapshot_hash, "input_snapshot_hash")
    complete_after = datetime.combine(
        bucket_date + timedelta(days=1), time.min, tzinfo=UTC
    )
    if available_at < complete_after:
        raise DailyProducerError("UTC_DAY_NOT_COMPLETE")
    if not membership.retrospective_late_bound:
        if membership.event_as_of.date() > bucket_date or membership.available_at > available_at:
            raise DailyProducerError("MEMBERSHIP_NOT_POINT_IN_TIME_VISIBLE")

    member_by_item = {member.item_id: member for member in membership.members}
    grouped: dict[int, list[DailySourceAskFact]] = {}
    seen: set[tuple[int, str]] = set()
    for fact in facts:
        if fact.bucket_date != bucket_date:
            raise DailyProducerError("SOURCE_FACT_DAY_MISMATCH")
        if fact.observed_at.date() != bucket_date:
            raise DailyProducerError("SOURCE_FACT_OBSERVED_OUTSIDE_BUCKET_DAY")
        if fact.available_at > available_at:
            raise DailyProducerError("SOURCE_FACT_FROM_FUTURE")
        if fact.item_id not in member_by_item:
            raise DailyProducerError("SOURCE_FACT_OUTSIDE_MEMBERSHIP")
        key = (fact.item_id, fact.logical_source)
        if key in seen:
            raise DailyProducerError("DUPLICATE_LOGICAL_SOURCE_FACT")
        seen.add(key)
        grouped.setdefault(fact.item_id, []).append(fact)

    outputs: list[DailyFusedMemberAsk] = []
    with localcontext() as context:
        context.prec = 50
        for member in membership.members:
            present = sorted(
                grouped.get(member.item_id, ()), key=lambda item: item.logical_source
            )
            positive = tuple(
                fact for fact in present if fact.ask_atoms is not None and fact.ask_atoms > 0
            )
            sources = tuple(fact.logical_source for fact in positive)
            raw = tuple((fact.logical_source, fact.ask_atoms) for fact in present)
            invalid = tuple(
                fact for fact in present if fact.ask_atoms is not None and fact.ask_atoms <= 0
            )
            if len(positive) >= 2:
                fused = _median(Decimal(fact.ask_atoms) for fact in positive)
                status = DailyMemberPriceStatus.VALID
                reasons = ("MIN_TWO_LOGICAL_SOURCES",)
            elif invalid:
                fused = None
                status = DailyMemberPriceStatus.INVALID_VALUE
                reasons = ("POSITIVE_MINIMUM_ASK_SOURCE_COUNT_BELOW_TWO",)
            else:
                fused = None
                status = DailyMemberPriceStatus.INSUFFICIENT_SOURCES
                reasons = ("QUALIFIED_LOGICAL_SOURCE_COUNT_BELOW_TWO",)
            slots = tuple(
                fact.visible_listing_slots
                for fact in positive
                if fact.visible_listing_slots is not None
            )
            outputs.append(
                DailyFusedMemberAsk(
                    analysis_unit_id=member.analysis_unit_id,
                    item_id=member.item_id,
                    status=status,
                    fused_ask_atoms=fused,
                    participating_sources=sources,
                    source_asks=raw,
                    visible_listing_slots=sum(slots) if slots else None,
                    reason_codes=reasons,
                    lineage_sha256=stable_hash(
                        (
                            member.member_sha256,
                            tuple(fact.source_fact_sha256 for fact in present),
                            status,
                            sources,
                        )
                    ),
                )
            )
    return DailyPriceFrame(
        bucket_date=bucket_date,
        available_at=available_at,
        membership_id=membership.membership_id,
        input_snapshot_hash=input_snapshot_hash,
        members=tuple(outputs),
        retrospective_late_bound=membership.retrospective_late_bound,
    )


def build_daily_return_frame(
    previous: DailyPriceFrame, current: DailyPriceFrame
) -> DailyReturnFrame:
    """Build one-day member returns; gaps and source-set changes never bridge."""

    if current.bucket_date != previous.bucket_date + timedelta(days=1):
        raise DailyProducerError("COMPLETE_UTC_DAY_GAP")
    if current.membership_id != previous.membership_id:
        raise DailyProducerError("MEMBERSHIP_CHANGE_BREAKS_CONTINUITY")
    if current.available_at < previous.available_at:
        raise DailyProducerError("KNOWLEDGE_CLOCK_MOVED_BACKWARDS")
    if tuple(member.item_id for member in current.members) != tuple(
        member.item_id for member in previous.members
    ):
        raise DailyProducerError("MEMBER_ORDER_OR_IDENTITY_DRIFT")

    results: list[DailyMemberReturn] = []
    with localcontext() as context:
        context.prec = 50
        for old, new in zip(previous.members, current.members):
            if old.status is DailyMemberPriceStatus.INVALID_VALUE or new.status is DailyMemberPriceStatus.INVALID_VALUE:
                status = DailyMemberReturnStatus.INVALID_ENDPOINT
                value = None
                reasons = ("INVALID_MINIMUM_ASK_ENDPOINT",)
                sources: tuple[str, ...] = ()
            elif old.status is not DailyMemberPriceStatus.VALID or new.status is not DailyMemberPriceStatus.VALID:
                status = DailyMemberReturnStatus.MISSING_ENDPOINT
                value = None
                reasons = ("MIN_TWO_SOURCE_ENDPOINT_UNAVAILABLE",)
                sources = ()
            elif old.participating_sources != new.participating_sources:
                status = DailyMemberReturnStatus.SOURCE_SET_BREAK
                value = None
                reasons = ("SOURCE_SET_CHANGED",)
                sources = new.participating_sources
            else:
                sources = new.participating_sources
                ratio = new.fused_ask_atoms / old.fused_ask_atoms
                if (
                    ratio < Decimal(1) / GROSS_ERROR_RATIO_LIMIT
                    or ratio > GROSS_ERROR_RATIO_LIMIT
                ):
                    status = DailyMemberReturnStatus.QUARANTINED_RETURN
                    value = None
                    reasons = ("CROSS_DAY_GROSS_ERROR_RATIO_QUARANTINED",)
                else:
                    status = DailyMemberReturnStatus.VALID
                    value = ratio - Decimal(1)
                    reasons = ("SAME_SOURCE_SET_MINIMUM_ASK_RETURN",)
            results.append(
                DailyMemberReturn(
                    analysis_unit_id=new.analysis_unit_id,
                    item_id=new.item_id,
                    status=status,
                    value=value,
                    participating_sources=sources,
                    current_visible_listing_slots=new.visible_listing_slots,
                    reason_codes=reasons,
                    lineage_sha256=stable_hash(
                        (old.lineage_sha256, new.lineage_sha256, status, value)
                    ),
                )
            )
    return DailyReturnFrame(
        previous_date=previous.bucket_date,
        bucket_date=current.bucket_date,
        available_at=current.available_at,
        membership_id=current.membership_id,
        previous_price_frame_id=previous.frame_id,
        current_price_frame_id=current.frame_id,
        members=tuple(results),
        retrospective_late_bound=(
            previous.retrospective_late_bound or current.retrospective_late_bound
        ),
    )


def _suppress(
    values: tuple[tuple[str, Decimal], ...], method: SuppressionMethod
) -> tuple[dict[str, Decimal], str]:
    if method is SuppressionMethod.NONE or len(values) < 5:
        return dict(values), "NO_SUPPRESSION" if len(values) >= 5 else "LOW_MEMBER_COUNT"
    ordered = sorted(value for _, value in values)
    if method is SuppressionMethod.WINSOR_1_PERCENT:
        # Trim an equal integer count from both tails.  The former percentile
        # index formula clipped one positive tail member for n=5 while leaving
        # the mirrored negative sample unchanged.
        tail_count = len(ordered) // 100
        if tail_count == 0:
            return dict(values), "INSUFFICIENT_FOR_SYMMETRIC_1_PERCENT_WINSOR"
        lower = ordered[tail_count]
        upper = ordered[-tail_count - 1]
        return (
            {unit: min(max(value, lower), upper) for unit, value in values},
            "SYMMETRIC_1_PERCENT_WINSOR",
        )
    center = _median(ordered)
    mad = _median(abs(value - center) for value in ordered)
    if mad == 0:
        return dict(values), "ZERO_MAD_NO_SUPPRESSION"
    multiplier = Decimal(5 if method is SuppressionMethod.MEDIAN_5_MAD else 8)
    lower, upper = center - multiplier * mad, center + multiplier * mad
    return (
        {unit: min(max(value, lower), upper) for unit, value in values},
        f"MEDIAN_{int(multiplier)}_MAD_CLIP",
    )


def aggregate_daily_scope(
    *,
    membership: DailyMembership,
    return_frame: DailyReturnFrame,
    scope_code: str,
    minimum_coverage: Decimal,
    suppression_method: SuppressionMethod,
) -> DailyScopeAggregation:
    """Aggregate equal member returns while preserving raw anomaly contribution."""

    if return_frame.membership_id != membership.membership_id:
        raise DailyProducerError("RETURN_MEMBERSHIP_MISMATCH")
    if minimum_coverage < 0 or minimum_coverage > 1:
        raise DailyProducerError("minimum_coverage must be in [0,1]")
    scoped = membership.scope_members(scope_code)
    if not scoped:
        raise DailyProducerError("UNAVAILABLE_NOT_ONBOARDED")
    ids = {member.analysis_unit_id for member in scoped}
    rows = tuple(member for member in return_frame.members if member.analysis_unit_id in ids)
    valid = tuple((row.analysis_unit_id, row.value) for row in rows if row.status is DailyMemberReturnStatus.VALID)
    missing = sum(row.status is DailyMemberReturnStatus.MISSING_ENDPOINT for row in rows)
    invalid = sum(
        row.status
        in {
            DailyMemberReturnStatus.INVALID_ENDPOINT,
            DailyMemberReturnStatus.QUARANTINED_RETURN,
        }
        for row in rows
    )
    source_breaks = sum(row.status is DailyMemberReturnStatus.SOURCE_SET_BREAK for row in rows)
    coverage = Decimal(len(valid)) / Decimal(len(rows))
    qualified = coverage >= minimum_coverage
    quality = DailyDataQuality(
        status=DailyQualityStatus.QUALIFIED if qualified else DailyQualityStatus.PARTIAL,
        expected_member_count=len(rows),
        qualified_member_count=len(valid),
        missing_member_count=missing,
        invalid_member_count=invalid,
        source_set_break_count=source_breaks,
        coverage_ratio=coverage,
        reason_codes=(
            "COVERAGE_AT_OR_ABOVE_PROFILE"
            if qualified
            else "COVERAGE_BELOW_PROFILE",
        ),
    )
    raw_change = suppressed_change = difference = None
    anomalies: tuple[AnomalyContribution, ...] = ()
    advancing = declining = flat = median_return = None
    suppression_reason = "NOT_APPLIED_UNQUALIFIED"
    if qualified and valid:
        with localcontext() as context:
            context.prec = 50
            raw_change = sum(value for _, value in valid) / Decimal(len(valid))
            adjusted, reason = _suppress(valid, suppression_method)
            suppression_reason = reason
            suppressed_change = sum(adjusted.values()) / Decimal(len(valid))
            difference = suppressed_change - raw_change
            anomalies = tuple(
                AnomalyContribution(
                    analysis_unit_id=unit,
                    raw_return=value,
                    suppressed_return=adjusted[unit],
                    raw_equal_weight_contribution=value / Decimal(len(valid)),
                    suppressed_equal_weight_contribution=adjusted[unit]
                    / Decimal(len(valid)),
                    reason_code=reason,
                )
                for unit, value in sorted(valid)
                if adjusted[unit] != value
            )
            advancing = Decimal(sum(value > 0 for _, value in valid)) / Decimal(len(valid))
            declining = Decimal(sum(value < 0 for _, value in valid)) / Decimal(len(valid))
            flat = Decimal(sum(value == 0 for _, value in valid)) / Decimal(len(valid))
            median_return = _median(value for _, value in valid)
    slots = tuple(
        row.current_visible_listing_slots
        for row in rows
        if row.current_visible_listing_slots is not None
    )
    source_sets = tuple(
        sorted(
            {
                row.participating_sources
                for row in rows
                if row.status is DailyMemberReturnStatus.VALID
            }
        )
    )
    supply = PressureAxisAssessment(
        availability=(
            AxisAvailability.AVAILABLE
            if len(slots) == len(rows)
            else AxisAvailability.PARTIAL
            if slots
            else AxisAvailability.UNKNOWN
        ),
        strength=PressureStrength.UNKNOWN,
        metric_values=(
            ("visible_listing_slots", sum(slots) if slots else None),
            ("listing_slot_coverage", Decimal(len(slots)) / Decimal(len(rows))),
        ),
        reason_codes=(
            "SUPPLY_THRESHOLDS_NOT_CALIBRATED",
            MARKET_SECTOR_V0_LISTING_SEMANTICS,
        ),
    )
    return DailyScopeAggregation(
        scope_code=scope_code,
        bucket_date=return_frame.bucket_date,
        raw_price_change=raw_change,
        suppressed_price_change=suppressed_change,
        suppression_difference=difference,
        anomaly_contributions=anomalies,
        advancing_member_ratio=advancing,
        declining_member_ratio=declining,
        flat_member_ratio=flat,
        median_member_return=median_return,
        visible_listing_slots=sum(slots) if slots else None,
        data_quality=quality,
        supply_pressure=supply,
        contributing_source_sets=source_sets,
        suppression_method=suppression_method,
        suppression_reason_code=suppression_reason,
        return_frame_id=return_frame.frame_id,
    )


def daily_frame_document(frame: DailyPriceFrame) -> dict[str, object]:
    return {
        "schema": "market-sector-daily-price-frame/0",
        "bucket_date": frame.bucket_date.isoformat(),
        "available_at": frame.available_at.isoformat().replace("+00:00", "Z"),
        "membership_id": frame.membership_id,
        "input_snapshot_hash": frame.input_snapshot_hash,
        "frame_id": frame.frame_id,
        "transport": frame.transport,
        "currency_unit": frame.currency_unit,
        "retrospective_late_bound": frame.retrospective_late_bound,
        "members": [
            {
                "analysis_unit_id": row.analysis_unit_id,
                "item_id": row.item_id,
                "status": row.status.value,
                "fused_ask_atoms": None
                if row.fused_ask_atoms is None
                else format(row.fused_ask_atoms, "f"),
                "participating_sources": list(row.participating_sources),
                "source_asks": [list(value) for value in row.source_asks],
                "visible_listing_slots": row.visible_listing_slots,
                "reason_codes": list(row.reason_codes),
                "lineage_sha256": row.lineage_sha256,
            }
            for row in frame.members
        ],
    }


def seal_daily_frame(path: Path, frame: DailyPriceFrame) -> str:
    """Create one immutable day record; exact replay is idempotent."""

    payload = canonical_json_bytes(daily_frame_document(frame)) + b"\n"
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        existing = path.read_bytes()
        if existing != payload:
            raise DailyProducerError("IMMUTABLE_DAILY_FRAME_CONFLICT")
        return sha256_hex(existing)
    try:
        with path.open("xb") as handle:
            handle.write(payload)
            handle.flush()
    except FileExistsError:
        existing = path.read_bytes()
        if existing != payload:
            raise DailyProducerError("IMMUTABLE_DAILY_FRAME_CONFLICT")
    return sha256_hex(payload)


__all__ = [
    "DailyFusedMemberAsk",
    "DailyMemberPriceStatus",
    "DailyMemberReturn",
    "DailyMemberReturnStatus",
    "DailyMembership",
    "DailyMembershipMember",
    "DailyPriceFrame",
    "DailyProducerError",
    "DailyReturnFrame",
    "DailyScopeAggregation",
    "DailySourceAskFact",
    "SuppressionMethod",
    "aggregate_daily_scope",
    "build_daily_price_frame",
    "build_daily_return_frame",
    "daily_frame_document",
    "seal_daily_frame",
]
