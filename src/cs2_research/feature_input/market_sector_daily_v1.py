"""Prospective end-of-day source reduction for MARKET/SECTOR V1.

The reducer consumes already captured five-minute upstream logical-source facts.
It never contacts a provider.  For each item/source it uses the median of the
qualified slots in the final UTC hour, then refuses an item endpoint when the
qualified logical sources disagree by more than the frozen gross-error ratio.
The V0 item/source fusion remains the downstream boundary.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP
from enum import StrEnum
from pathlib import Path
from typing import Iterable

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.state_machine.hashing import content_id, stable_hash

from .market_sector_daily import (
    DailyMembership,
    DailyProducerError,
    DailySourceAskFact,
)
from cs2_research.state_machine.market_sector_contract import (
    MARKET_SECTOR_V0_LOGICAL_SOURCES,
    MARKET_SECTOR_V0_TRANSPORT,
)


MARKET_SECTOR_EOD_POLICY_VERSION = "MARKET_SECTOR_EOD_LAST_HOUR_MEDIAN_V1"


class EndOfDaySourceStatus(StrEnum):
    QUALIFIED = "QUALIFIED"
    INSUFFICIENT_SLOTS = "INSUFFICIENT_SLOTS"
    INVALID_OR_MISSING_ASK = "INVALID_OR_MISSING_ASK"
    STALE_QUOTE = "STALE_QUOTE"
    CROSS_SOURCE_INCOHERENT = "CROSS_SOURCE_INCOHERENT"


@dataclass(frozen=True, slots=True)
class EndOfDayReductionPolicy:
    slot_minutes: int = 5
    final_window_minutes: int = 60
    minimum_qualified_slots: int = 9
    maximum_quote_age_minutes: int = 15
    maximum_cross_source_ratio: Decimal = Decimal("1000")
    price_aggregation: str = "MEDIAN_ROUND_HALF_UP_TO_ATOM"
    listing_slots_aggregation: str = "LAST_QUALIFIED_SLOT"

    def __post_init__(self) -> None:
        if self.slot_minutes != 5 or self.final_window_minutes != 60:
            raise DailyProducerError("EOD_WINDOW_POLICY_DRIFT")
        expected = self.final_window_minutes // self.slot_minutes
        if not 1 <= self.minimum_qualified_slots <= expected:
            raise DailyProducerError("EOD_MINIMUM_SLOT_COUNT_INVALID")
        if self.maximum_quote_age_minutes != 15:
            raise DailyProducerError("EOD_QUOTE_AGE_POLICY_DRIFT")
        if self.maximum_cross_source_ratio != Decimal("1000"):
            raise DailyProducerError("EOD_CROSS_SOURCE_RATIO_POLICY_DRIFT")

    @property
    def expected_slots(self) -> int:
        return self.final_window_minutes // self.slot_minutes

    def as_document(self) -> dict[str, object]:
        return {
            "final_window_minutes": self.final_window_minutes,
            "listing_slots_aggregation": self.listing_slots_aggregation,
            "maximum_cross_source_ratio": format(
                self.maximum_cross_source_ratio, "f"
            ),
            "maximum_quote_age_minutes": self.maximum_quote_age_minutes,
            "minimum_qualified_slots": self.minimum_qualified_slots,
            "policy_version": MARKET_SECTOR_EOD_POLICY_VERSION,
            "price_aggregation": self.price_aggregation,
            "slot_minutes": self.slot_minutes,
        }

    @property
    def policy_sha256(self) -> str:
        return sha256_hex(canonical_json_bytes(self.as_document()))


FROZEN_END_OF_DAY_REDUCTION_POLICY_V1 = EndOfDayReductionPolicy()


@dataclass(frozen=True, slots=True)
class FiveMinuteSourceAskFact:
    item_id: int
    logical_source: str
    slot_at: datetime
    observed_at: datetime
    available_at: datetime
    ask_atoms: int | None
    visible_listing_slots: int | None
    source_fact_sha256: str
    transport: str = MARKET_SECTOR_V0_TRANSPORT

    def __post_init__(self) -> None:
        if type(self.item_id) is not int or self.item_id <= 0:
            raise DailyProducerError("FIVE_MINUTE_ITEM_ID_INVALID")
        if self.logical_source not in MARKET_SECTOR_V0_LOGICAL_SOURCES:
            raise DailyProducerError("FIVE_MINUTE_LOGICAL_SOURCE_INVALID")
        for value, field in (
            (self.slot_at, "slot_at"),
            (self.observed_at, "observed_at"),
            (self.available_at, "available_at"),
        ):
            if value.tzinfo is None or value.utcoffset() != timedelta(0):
                raise DailyProducerError(f"{field} must use UTC")
        if (
            self.slot_at.second
            or self.slot_at.microsecond
            or self.slot_at.minute % 5
        ):
            raise DailyProducerError("FIVE_MINUTE_SLOT_NOT_CANONICAL")
        if self.available_at < self.slot_at or self.available_at >= self.slot_at + timedelta(minutes=5):
            raise DailyProducerError("FIVE_MINUTE_CAPTURE_OUTSIDE_SLOT")
        if self.observed_at > self.available_at:
            raise DailyProducerError("SOURCE_OBSERVATION_FROM_FUTURE")
        if self.ask_atoms is not None and (
            type(self.ask_atoms) is not int or self.ask_atoms < 0
        ):
            raise DailyProducerError("FIVE_MINUTE_ASK_INVALID_TYPE")
        if self.visible_listing_slots is not None and (
            type(self.visible_listing_slots) is not int
            or self.visible_listing_slots < 0
        ):
            raise DailyProducerError("FIVE_MINUTE_LISTING_SLOTS_INVALID")
        if (
            len(self.source_fact_sha256) != 64
            or any(c not in "0123456789abcdef" for c in self.source_fact_sha256)
        ):
            raise DailyProducerError("FIVE_MINUTE_FACT_HASH_INVALID")
        if self.transport != MARKET_SECTOR_V0_TRANSPORT:
            raise DailyProducerError("FIVE_MINUTE_TRANSPORT_DRIFT")


@dataclass(frozen=True, slots=True)
class EndOfDaySourceDiagnostic:
    analysis_unit_id: str
    item_id: int
    logical_source: str
    status: EndOfDaySourceStatus
    supplied_slot_count: int
    positive_fresh_slot_count: int
    stale_slot_count: int
    invalid_or_missing_ask_slot_count: int
    reduced_ask_atoms: int | None
    reason_codes: tuple[str, ...]
    lineage_sha256: str


@dataclass(frozen=True, slots=True)
class EndOfDayReduction:
    bucket_date: date
    reduced_at: datetime
    membership_id: str
    input_snapshot_sha256: str
    policy_sha256: str
    source_facts: tuple[DailySourceAskFact, ...]
    diagnostics: tuple[EndOfDaySourceDiagnostic, ...]

    @property
    def reduction_id(self) -> str:
        return content_id("market_sector_eod_reduction_v1", self)


def _median_atom(values: Iterable[int]) -> int:
    ordered = sorted(Decimal(value) for value in values)
    if not ordered:
        raise DailyProducerError("EOD_MEDIAN_REQUIRES_VALUES")
    middle = len(ordered) // 2
    value = (
        ordered[middle]
        if len(ordered) % 2
        else (ordered[middle - 1] + ordered[middle]) / Decimal(2)
    )
    return int(value.to_integral_value(rounding=ROUND_HALF_UP))


def reduce_last_hour_source_asks(
    *,
    membership: DailyMembership,
    bucket_date: date,
    reduced_at: datetime,
    facts: Iterable[FiveMinuteSourceAskFact],
    input_snapshot_sha256: str,
    policy: EndOfDayReductionPolicy = FROZEN_END_OF_DAY_REDUCTION_POLICY_V1,
) -> EndOfDayReduction:
    """Reduce the last twelve UTC five-minute slots without interpolation."""

    if reduced_at.tzinfo is None or reduced_at.utcoffset() != timedelta(0):
        raise DailyProducerError("EOD_REDUCED_AT_MUST_USE_UTC")
    day_end = datetime.combine(bucket_date + timedelta(days=1), time.min, tzinfo=UTC)
    window_start = day_end - timedelta(minutes=policy.final_window_minutes)
    if reduced_at < day_end:
        raise DailyProducerError("UTC_DAY_NOT_COMPLETE")
    if (
        len(input_snapshot_sha256) != 64
        or any(c not in "0123456789abcdef" for c in input_snapshot_sha256)
    ):
        raise DailyProducerError("EOD_INPUT_SNAPSHOT_HASH_INVALID")
    member_by_item = {member.item_id: member for member in membership.members}
    grouped: dict[tuple[int, str], list[FiveMinuteSourceAskFact]] = {}
    seen: set[tuple[int, str, datetime]] = set()
    for fact in facts:
        if fact.item_id not in member_by_item:
            raise DailyProducerError("EOD_FACT_OUTSIDE_MEMBERSHIP")
        if not window_start <= fact.slot_at < day_end:
            raise DailyProducerError("EOD_FACT_OUTSIDE_FINAL_UTC_HOUR")
        key = (fact.item_id, fact.logical_source, fact.slot_at)
        if key in seen:
            raise DailyProducerError("EOD_DUPLICATE_ITEM_SOURCE_SLOT")
        seen.add(key)
        grouped.setdefault((fact.item_id, fact.logical_source), []).append(fact)

    diagnostics: list[EndOfDaySourceDiagnostic] = []
    reduced_by_item: dict[int, list[tuple[DailySourceAskFact, int]]] = {}
    max_age = timedelta(minutes=policy.maximum_quote_age_minutes)
    for member in membership.members:
        for source in MARKET_SECTOR_V0_LOGICAL_SOURCES:
            rows = sorted(grouped.get((member.item_id, source), ()), key=lambda row: row.slot_at)
            fresh_positive = tuple(
                row
                for row in rows
                if row.ask_atoms is not None
                and row.ask_atoms > 0
                and row.available_at - row.observed_at <= max_age
            )
            stale = sum(row.available_at - row.observed_at > max_age for row in rows)
            invalid = sum(row.ask_atoms is None or row.ask_atoms <= 0 for row in rows)
            if len(fresh_positive) >= policy.minimum_qualified_slots:
                reduced_ask = _median_atom(row.ask_atoms for row in fresh_positive if row.ask_atoms is not None)
                last = fresh_positive[-1]
                output = DailySourceAskFact(
                    item_id=member.item_id,
                    bucket_date=bucket_date,
                    logical_source=source,
                    ask_atoms=reduced_ask,
                    visible_listing_slots=last.visible_listing_slots,
                    observed_at=max(row.observed_at for row in fresh_positive),
                    available_at=max(row.available_at for row in fresh_positive),
                    source_fact_sha256=stable_hash(
                        (
                            MARKET_SECTOR_EOD_POLICY_VERSION,
                            policy.policy_sha256,
                            tuple(row.source_fact_sha256 for row in fresh_positive),
                            reduced_ask,
                            last.visible_listing_slots,
                        )
                    ),
                )
                status = EndOfDaySourceStatus.QUALIFIED
                reasons = ("LAST_UTC_HOUR_MEDIAN", "MINIMUM_NINE_OF_TWELVE_SLOTS")
                reduced_by_item.setdefault(member.item_id, []).append((output, len(diagnostics)))
            else:
                reduced_ask = None
                if stale and not invalid:
                    status = EndOfDaySourceStatus.STALE_QUOTE
                elif invalid:
                    status = EndOfDaySourceStatus.INVALID_OR_MISSING_ASK
                else:
                    status = EndOfDaySourceStatus.INSUFFICIENT_SLOTS
                reasons = ("QUALIFIED_FINAL_HOUR_SLOT_COUNT_BELOW_NINE",)
            diagnostics.append(
                EndOfDaySourceDiagnostic(
                    analysis_unit_id=member.analysis_unit_id,
                    item_id=member.item_id,
                    logical_source=source,
                    status=status,
                    supplied_slot_count=len(rows),
                    positive_fresh_slot_count=len(fresh_positive),
                    stale_slot_count=stale,
                    invalid_or_missing_ask_slot_count=invalid,
                    reduced_ask_atoms=reduced_ask,
                    reason_codes=reasons,
                    lineage_sha256=stable_hash(
                        (
                            member.member_sha256,
                            source,
                            tuple(row.source_fact_sha256 for row in rows),
                            status,
                            reduced_ask,
                        )
                    ),
                )
            )

    outputs: list[DailySourceAskFact] = []
    for item_id, entries in reduced_by_item.items():
        prices = tuple(Decimal(entry.ask_atoms) for entry, _ in entries if entry.ask_atoms)
        incoherent = (
            len(prices) >= 2
            and max(prices) / min(prices) > policy.maximum_cross_source_ratio
        )
        if incoherent:
            for _entry, diagnostic_index in entries:
                original = diagnostics[diagnostic_index]
                diagnostics[diagnostic_index] = replace(
                    original,
                    status=EndOfDaySourceStatus.CROSS_SOURCE_INCOHERENT,
                    reason_codes=("CROSS_SOURCE_RATIO_ABOVE_1000",),
                    lineage_sha256=stable_hash(
                        (original.lineage_sha256, "CROSS_SOURCE_RATIO_ABOVE_1000")
                    ),
                )
            continue
        outputs.extend(entry for entry, _ in entries)

    outputs.sort(key=lambda row: (row.item_id, row.logical_source))
    diagnostics.sort(key=lambda row: (row.item_id, row.logical_source))
    return EndOfDayReduction(
        bucket_date=bucket_date,
        reduced_at=reduced_at,
        membership_id=membership.membership_id,
        input_snapshot_sha256=input_snapshot_sha256,
        policy_sha256=policy.policy_sha256,
        source_facts=tuple(outputs),
        diagnostics=tuple(diagnostics),
    )


def end_of_day_reduction_document(result: EndOfDayReduction) -> dict[str, object]:
    return {
        "bucket_date": result.bucket_date.isoformat(),
        "diagnostics": [
            {
                "analysis_unit_id": row.analysis_unit_id,
                "invalid_or_missing_ask_slot_count": row.invalid_or_missing_ask_slot_count,
                "item_id": row.item_id,
                "lineage_sha256": row.lineage_sha256,
                "logical_source": row.logical_source,
                "positive_fresh_slot_count": row.positive_fresh_slot_count,
                "reason_codes": list(row.reason_codes),
                "reduced_ask_atoms": row.reduced_ask_atoms,
                "stale_slot_count": row.stale_slot_count,
                "status": row.status.value,
                "supplied_slot_count": row.supplied_slot_count,
            }
            for row in result.diagnostics
        ],
        "input_snapshot_sha256": result.input_snapshot_sha256,
        "membership_id": result.membership_id,
        "policy_sha256": result.policy_sha256,
        "reduced_at": result.reduced_at.isoformat().replace("+00:00", "Z"),
        "reduction_id": result.reduction_id,
        "schema": "market-sector-eod-source-reduction/1",
        "source_facts": [
            {
                "ask_atoms": row.ask_atoms,
                "available_at": row.available_at.isoformat().replace("+00:00", "Z"),
                "bucket_date": row.bucket_date.isoformat(),
                "item_id": row.item_id,
                "logical_source": row.logical_source,
                "observed_at": row.observed_at.isoformat().replace("+00:00", "Z"),
                "source_fact_sha256": row.source_fact_sha256,
                "transport": row.transport,
                "visible_listing_slots": row.visible_listing_slots,
            }
            for row in result.source_facts
        ],
    }


def seal_end_of_day_reduction(path: Path, result: EndOfDayReduction) -> str:
    payload = canonical_json_bytes(end_of_day_reduction_document(result)) + b"\n"
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        if path.read_bytes() != payload:
            raise DailyProducerError("IMMUTABLE_EOD_REDUCTION_CONFLICT")
        return sha256_hex(payload)
    try:
        with path.open("xb") as handle:
            handle.write(payload)
            handle.flush()
    except FileExistsError:
        if path.read_bytes() != payload:
            raise DailyProducerError("IMMUTABLE_EOD_REDUCTION_CONFLICT")
    return sha256_hex(payload)


__all__ = [
    "EndOfDayReduction",
    "EndOfDayReductionPolicy",
    "EndOfDaySourceDiagnostic",
    "EndOfDaySourceStatus",
    "FROZEN_END_OF_DAY_REDUCTION_POLICY_V1",
    "FiveMinuteSourceAskFact",
    "MARKET_SECTOR_EOD_POLICY_VERSION",
    "end_of_day_reduction_document",
    "reduce_last_hour_source_asks",
    "seal_end_of_day_reduction",
]
