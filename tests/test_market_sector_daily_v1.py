from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
import json
from pathlib import Path

import jsonschema
import pytest

from cs2_research.feature_input.market_sector_daily import (
    DailyMembership,
    DailyMembershipMember,
    DailyProducerError,
)
from cs2_research.feature_input.market_sector_daily_v1 import (
    EndOfDaySourceStatus,
    FiveMinuteSourceAskFact,
    end_of_day_reduction_document,
    reduce_last_hour_source_asks,
    seal_end_of_day_reduction,
)


SHA = "a" * 64


def _membership(count: int = 1) -> DailyMembership:
    return DailyMembership(
        contract_version="market-sector-daily-membership/1",
        event_as_of=datetime(2026, 1, 1, tzinfo=UTC),
        available_at=datetime(2026, 1, 1, tzinfo=UTC),
        members=tuple(
            DailyMembershipMember(
                item_id=item_id,
                analysis_unit_id=f"item:{item_id}",
                sector_codes=("WEAPON",),
                member_sha256=f"{item_id:064x}",
            )
            for item_id in range(1, count + 1)
        ),
    )


def _fact(
    item_id: int,
    source: str,
    slot: datetime,
    ask: int | None,
    *,
    age_minutes: int = 1,
    slots: int | None = 2,
) -> FiveMinuteSourceAskFact:
    available = slot + timedelta(seconds=30)
    return FiveMinuteSourceAskFact(
        item_id=item_id,
        logical_source=source,
        slot_at=slot,
        observed_at=available - timedelta(minutes=age_minutes),
        available_at=available,
        ask_atoms=ask,
        visible_listing_slots=slots,
        source_fact_sha256=(f"{item_id}{len(source)}{slot.minute}" * 64)[:64],
    )


def _hour(item_id: int, source: str, day: date, base: int, *, count: int = 12):
    start = datetime.combine(day, datetime.min.time(), tzinfo=UTC) + timedelta(hours=23)
    return [
        _fact(item_id, source, start + timedelta(minutes=5 * index), base + index)
        for index in range(count)
    ]


def _reduce(rows, day=date(2026, 1, 2)):
    return reduce_last_hour_source_asks(
        membership=_membership(),
        bucket_date=day,
        reduced_at=datetime.combine(day + timedelta(days=1), datetime.min.time(), tzinfo=UTC),
        facts=rows,
        input_snapshot_sha256=SHA,
    )


def test_last_hour_median_requires_nine_slots_and_preserves_source_identity() -> None:
    day = date(2026, 1, 2)
    rows = [
        *_hour(1, "market_a", day, 100),
        *_hour(1, "market_c", day, 110, count=9),
        *_hour(1, "market_b", day, 120, count=8),
    ]
    result = _reduce(rows, day)
    assert [(row.logical_source, row.ask_atoms) for row in result.source_facts] == [
        ("market_a", 106),
        ("market_c", 114),
    ]
    diagnostics = {row.logical_source: row for row in result.diagnostics}
    assert diagnostics["market_a"].status is EndOfDaySourceStatus.QUALIFIED
    assert diagnostics["market_c"].positive_fresh_slot_count == 9
    assert diagnostics["market_b"].status is EndOfDaySourceStatus.INSUFFICIENT_SLOTS
    schema = json.loads(
        (
            Path(__file__).parents[1]
            / "schemas"
            / "market-sector-eod-source-reduction.v1.schema.json"
        ).read_text(encoding="utf-8")
    )
    jsonschema.Draft202012Validator.check_schema(schema)
    jsonschema.Draft202012Validator(schema, format_checker=jsonschema.FormatChecker()).validate(
        end_of_day_reduction_document(result)
    )


def test_stale_and_nonpositive_slots_do_not_count_as_qualified() -> None:
    day = date(2026, 1, 2)
    start = datetime.combine(day, datetime.min.time(), tzinfo=UTC) + timedelta(hours=23)
    stale = [_fact(1, "market_a", start + timedelta(minutes=5 * i), 100, age_minutes=16) for i in range(12)]
    invalid = [_fact(1, "market_c", start + timedelta(minutes=5 * i), 0) for i in range(12)]
    result = _reduce([*stale, *invalid], day)
    assert result.source_facts == ()
    diagnostics = {row.logical_source: row for row in result.diagnostics}
    assert diagnostics["market_a"].status is EndOfDaySourceStatus.STALE_QUOTE
    assert diagnostics["market_c"].status is EndOfDaySourceStatus.INVALID_OR_MISSING_ASK
    assert diagnostics["market_b"].status is EndOfDaySourceStatus.INSUFFICIENT_SLOTS


def test_cross_source_ratio_above_1000_quarantines_the_item_endpoint() -> None:
    day = date(2026, 1, 2)
    result = _reduce(
        [
            *_hour(1, "market_a", day, 100),
            *_hour(1, "market_c", day, 110_001),
        ],
        day,
    )
    assert result.source_facts == ()
    assert {
        row.status for row in result.diagnostics if row.logical_source != "market_b"
    } == {EndOfDaySourceStatus.CROSS_SOURCE_INCOHERENT}


def test_duplicate_or_noncanonical_slot_and_incomplete_day_fail_closed() -> None:
    day = date(2026, 1, 2)
    start = datetime.combine(day, datetime.min.time(), tzinfo=UTC) + timedelta(hours=23)
    row = _fact(1, "market_a", start, 100)
    with pytest.raises(DailyProducerError, match="EOD_DUPLICATE_ITEM_SOURCE_SLOT"):
        _reduce([row, row], day)
    with pytest.raises(DailyProducerError, match="FIVE_MINUTE_SLOT_NOT_CANONICAL"):
        _fact(1, "market_a", start + timedelta(minutes=1), 100)
    with pytest.raises(DailyProducerError, match="UTC_DAY_NOT_COMPLETE"):
        reduce_last_hour_source_asks(
            membership=_membership(),
            bucket_date=day,
            reduced_at=start,
            facts=(),
            input_snapshot_sha256=SHA,
        )


def test_reduction_seal_is_append_once_and_conflict_detected(tmp_path) -> None:
    day = date(2026, 1, 2)
    result = _reduce([*_hour(1, "market_a", day, 100), *_hour(1, "market_c", day, 110)], day)
    target = tmp_path / "eod.json"
    digest = seal_end_of_day_reduction(target, result)
    assert seal_end_of_day_reduction(target, result) == digest
    changed = _reduce([*_hour(1, "market_a", day, 101), *_hour(1, "market_c", day, 110)], day)
    with pytest.raises(DailyProducerError, match="IMMUTABLE_EOD_REDUCTION_CONFLICT"):
        seal_end_of_day_reduction(target, changed)
