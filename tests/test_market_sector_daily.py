from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

import pytest

from cs2_research.feature_input.market_sector_daily import (
    DailyMemberPriceStatus,
    DailyMemberReturnStatus,
    DailyMembership,
    DailyMembershipMember,
    DailyProducerError,
    DailySourceAskFact,
    SuppressionMethod,
    aggregate_daily_scope,
    build_daily_price_frame,
    build_daily_return_frame,
    seal_daily_frame,
)


SHA = "a" * 64


def membership(count: int = 6) -> DailyMembership:
    return DailyMembership(
        contract_version="market-sector-daily-membership/0",
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


def fact(
    item_id: int,
    day: date,
    source: str,
    ask: int | None,
    *,
    slots: int | None = 2,
) -> DailySourceAskFact:
    observed = datetime.combine(day, datetime.min.time(), tzinfo=UTC) + timedelta(
        hours=23
    )
    return DailySourceAskFact(
        item_id=item_id,
        bucket_date=day,
        logical_source=source,
        ask_atoms=ask,
        visible_listing_slots=slots,
        observed_at=observed,
        available_at=observed + timedelta(minutes=1),
        source_fact_sha256=(f"{item_id}{len(source)}{day.day}" * 64)[:64],
    )


def frame(members, day: date, prices: dict[int, tuple[int, int, int]], *, missing=()):
    rows = []
    sources = ("market_a", "market_b", "market_c")
    for item_id, values in prices.items():
        for source, value in zip(sources, values):
            if (item_id, source) not in missing:
                rows.append(fact(item_id, day, source, value))
    return build_daily_price_frame(
        membership=members,
        bucket_date=day,
        available_at=datetime.combine(
            day + timedelta(days=1), datetime.min.time(), tzinfo=UTC
        ),
        facts=rows,
        input_snapshot_hash=SHA,
    )


def test_two_source_mean_and_three_source_median_are_deterministic() -> None:
    members = membership(2)
    day = date(2026, 1, 2)
    result = frame(
        members,
        day,
        {1: (100, 300, 200), 2: (100, 300, 900)},
        missing=((2, "market_c"),),
    )
    assert result.members[0].fused_ask_atoms == Decimal(200)
    assert result.members[0].participating_sources == ("market_a", "market_b", "market_c")
    assert result.members[1].fused_ask_atoms == Decimal(200)
    assert result.members[1].participating_sources == ("market_a", "market_b")


def test_null_zero_and_source_absence_never_become_a_price() -> None:
    members = membership(3)
    day = date(2026, 1, 2)
    result = frame(
        members,
        day,
        {1: (100, 0, 200), 2: (None, 0, 200), 3: (100, 200, 300)},
        missing=((2, "market_a"),),
    )
    assert result.members[0].status is DailyMemberPriceStatus.VALID
    assert result.members[0].participating_sources == ("market_a", "market_c")
    assert result.members[1].status is DailyMemberPriceStatus.INVALID_VALUE
    assert result.members[1].fused_ask_atoms is None


def test_logical_source_duplicate_fails_even_with_one_transport() -> None:
    members = membership(1)
    day = date(2026, 1, 2)
    rows = [fact(1, day, "market_a", 100), fact(1, day, "market_a", 101)]
    with pytest.raises(DailyProducerError, match="DUPLICATE_LOGICAL_SOURCE_FACT"):
        build_daily_price_frame(
            membership=members,
            bucket_date=day,
            available_at=datetime(2026, 1, 3, tzinfo=UTC),
            facts=rows,
            input_snapshot_hash=SHA,
        )


def test_incomplete_day_and_date_gap_fail_closed() -> None:
    members = membership(1)
    day = date(2026, 1, 2)
    with pytest.raises(DailyProducerError, match="UTC_DAY_NOT_COMPLETE"):
        build_daily_price_frame(
            membership=members,
            bucket_date=day,
            available_at=datetime(2026, 1, 2, 23, 59, tzinfo=UTC),
            facts=(),
            input_snapshot_hash=SHA,
        )
    first = frame(members, day, {1: (100, 100, 100)})
    third = frame(members, day + timedelta(days=2), {1: (110, 110, 110)})
    with pytest.raises(DailyProducerError, match="COMPLETE_UTC_DAY_GAP"):
        build_daily_return_frame(first, third)


def test_source_set_change_is_not_interpreted_as_market_return() -> None:
    members = membership(1)
    day = date(2026, 1, 2)
    first = frame(
        members,
        day,
        {1: (100, 100, 100)},
        missing=((1, "market_c"),),
    )
    second = frame(
        members,
        day + timedelta(days=1),
        {1: (110, 110, 110)},
        missing=((1, "market_a"),),
    )
    result = build_daily_return_frame(first, second)
    assert result.members[0].status is DailyMemberReturnStatus.SOURCE_SET_BREAK
    assert result.members[0].value is None


def test_cross_day_gross_error_ratio_is_quarantined_symmetrically() -> None:
    members = membership(4)
    day = date(2026, 1, 2)
    first = frame(
        members,
        day,
        {
            1: (1, 1, 1),
            2: (1001, 1001, 1001),
            3: (1_000_000, 1_000_000, 1_000_000),
            4: (1000, 1000, 1000),
        },
    )
    second = frame(
        members,
        day + timedelta(days=1),
        {
            1: (1001, 1001, 1001),
            2: (1, 1, 1),
            3: (1000, 1000, 1000),
            4: (1_000_000, 1_000_000, 1_000_000),
        },
    )
    result = build_daily_return_frame(first, second)
    statuses = {row.analysis_unit_id: row.status for row in result.members}
    assert statuses == {
        "item:1": DailyMemberReturnStatus.QUARANTINED_RETURN,
        "item:2": DailyMemberReturnStatus.QUARANTINED_RETURN,
        "item:3": DailyMemberReturnStatus.VALID,
        "item:4": DailyMemberReturnStatus.VALID,
    }


def test_one_percent_winsor_is_mirror_symmetric_and_needs_full_tail() -> None:
    members = membership(100)
    day = date(2026, 1, 2)
    first = frame(members, day, {item: (100, 100, 100) for item in range(1, 101)})

    def aggregate(last_price: int):
        values = {item: (100, 100, 100) for item in range(1, 101)}
        values[100] = (last_price, last_price, last_price)
        return aggregate_daily_scope(
            membership=members,
            return_frame=build_daily_return_frame(
                first, frame(members, day + timedelta(days=1), values)
            ),
            scope_code="ALL",
            minimum_coverage=Decimal(1),
            suppression_method=SuppressionMethod.WINSOR_1_PERCENT,
        )

    positive = aggregate(110)
    negative = aggregate(90)
    assert positive.suppressed_price_change == Decimal(0)
    assert negative.suppressed_price_change == Decimal(0)
    assert positive.raw_price_change == -negative.raw_price_change


def test_scope_aggregation_does_not_erase_sparse_move_when_mad_is_zero() -> None:
    members = membership(10)
    day = date(2026, 1, 2)
    first = frame(members, day, {item: (100, 100, 100) for item in range(1, 11)})
    second_values = {item: (101, 101, 101) for item in range(1, 10)}
    second_values[10] = (1000, 1000, 1000)
    second = frame(members, day + timedelta(days=1), second_values)
    returns = build_daily_return_frame(first, second)
    output = aggregate_daily_scope(
        membership=members,
        return_frame=returns,
        scope_code="ALL",
        minimum_coverage=Decimal("0.80"),
        suppression_method=SuppressionMethod.MEDIAN_5_MAD,
    )
    assert output.raw_price_change == output.suppressed_price_change
    assert output.suppression_difference == Decimal(0)
    assert output.anomaly_contributions == ()
    assert output.data_quality.qualified_member_count == 10
    assert output.supply_pressure.metric_values[0] == ("visible_listing_slots", 60)


def test_scope_aggregation_clips_only_when_mad_is_identifiable() -> None:
    members = membership(10)
    day = date(2026, 1, 2)
    first = frame(members, day, {item: (100, 100, 100) for item in range(1, 11)})
    second_values = {
        item: (100 + item, 100 + item, 100 + item) for item in range(1, 10)
    }
    second_values[10] = (1000, 1000, 1000)
    second = frame(members, day + timedelta(days=1), second_values)
    returns = build_daily_return_frame(first, second)
    output = aggregate_daily_scope(
        membership=members,
        return_frame=returns,
        scope_code="ALL",
        minimum_coverage=Decimal("0.80"),
        suppression_method=SuppressionMethod.MEDIAN_5_MAD,
    )
    assert output.raw_price_change > output.suppressed_price_change
    assert [row.analysis_unit_id for row in output.anomaly_contributions] == [
        "item:10"
    ]


def test_daily_frame_seal_is_exact_replay_and_conflict_is_rejected(tmp_path) -> None:
    members = membership(1)
    day = date(2026, 1, 2)
    first = frame(members, day, {1: (100, 100, 100)})
    target = tmp_path / "2026-01-02.json"
    digest = seal_daily_frame(target, first)
    assert seal_daily_frame(target, first) == digest
    changed = frame(members, day, {1: (101, 101, 101)})
    with pytest.raises(DailyProducerError, match="IMMUTABLE_DAILY_FRAME_CONFLICT"):
        seal_daily_frame(target, changed)
