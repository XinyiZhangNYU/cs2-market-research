from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

import pytest

from cs2_research.state_machine.single_item_causal_kernel_v24 import (
    CausalPolicyV24,
    KnownDailyObservation,
    evaluate_as_of,
)


START = date(2026, 1, 1)


def observation(offset, *, ask="10", supply=100, bid="8", available_offset=1):
    observed = START + timedelta(days=offset)
    return KnownDailyObservation(
        item_id=7,
        observed_on=observed,
        available_at=datetime.combine(observed + timedelta(days=available_offset),
                                      datetime.min.time(), tzinfo=UTC),
        ask_usd=None if ask is None else Decimal(ask),
        supply=supply,
        bid_usd=None if bid is None else Decimal(bid),
    )


def history(*, supply_days=(), price_days=(), bid="8"):
    rows=[]
    for offset in range(90):
        rows.append(observation(
            offset,
            ask="12" if offset in price_days else "10",
            supply=180 if offset in supply_days else 300,
            bid=bid,
        ))
    return rows


def as_of(offset):
    return datetime.combine(START + timedelta(days=offset), datetime.min.time(), tzinfo=UTC)


def test_future_rows_do_not_change_past_prefix():
    rows=history(supply_days=(30,31),price_days=(40,41))
    prefix=evaluate_as_of(rows[:35],as_of=as_of(35))
    full=evaluate_as_of(rows,as_of=as_of(35))
    assert prefix == full
    assert full[-1].observed_on == START + timedelta(days=34)


def test_persistence_detection_uses_latest_required_availability_clock():
    rows=history(supply_days=(30,31))
    rows[31]=observation(31,supply=180,available_offset=10)
    before=evaluate_as_of(rows,as_of=as_of(35))
    assert not any(day.supply_onset for day in before)
    after=evaluate_as_of(rows,as_of=as_of(45))
    onset=next(day for day in after if day.supply_onset)
    assert onset.observed_on == START + timedelta(days=31)
    assert onset.supply_onset_on == START + timedelta(days=30)
    assert onset.supply_detected_at == as_of(41)


def test_bid_never_changes_triggers_or_ratios():
    rational=evaluate_as_of(history(supply_days=(30,31),bid="8"),as_of=as_of(90))
    irrational=evaluate_as_of(history(supply_days=(30,31),bid="20"),as_of=as_of(90))
    assert [(r.supply_onset,r.price_onset,r.supply_ratio,r.price_ratio) for r in rational] == [
        (r.supply_onset,r.price_onset,r.supply_ratio,r.price_ratio) for r in irrational]
    assert rational[31].bid_quote_rational is True
    assert irrational[31].bid_quote_rational is False


def test_gap_is_unknown_and_breaks_persistence():
    rows=history(supply_days=(30,32))
    rows[31]=observation(31,ask=None,supply=None,bid=None)
    evidence=evaluate_as_of(rows,as_of=as_of(90))
    assert evidence[30].supply_onset is False
    assert evidence[31].observation_complete is False
    assert evidence[32].supply_onset is False



@pytest.mark.parametrize("bad", [None, -1])
def test_noncanonical_supply_rejected(bad):
    if bad is None:
        assert observation(0,supply=bad).supply is None
    else:
        with pytest.raises(ValueError,match="SUPPLY_NONNEGATIVE"):
            observation(0,supply=bad)
