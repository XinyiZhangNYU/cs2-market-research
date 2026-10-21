"""Research-only paired ask-sum diagnostics. Not a publication path or contract change."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from math import exp, log
from typing import Mapping, Sequence

from cs2_research.feature_input.market_sector_daily_v3 import GROSS_ERROR_RATIO_LIMIT_V3

DOMAIN_LOW = Decimal("0.001")


@dataclass(frozen=True, slots=True)
class AdmittedPair:
    analysis_unit_id: str
    old_price: Decimal
    new_price: Decimal
    grade: str
    raw_return: Decimal


def admit_pairs(
    previous: Sequence[tuple[str, Decimal | None, str]],
    current: Sequence[tuple[str, Decimal | None, str]],
) -> tuple[tuple[AdmittedPair, ...], tuple[AdmittedPair, ...], int]:
    """previous/current rows are (id, price-or-None, grade). Domain uses the same [0.001, 1000] as the producer."""

    if len(previous) != len(current):
        raise ValueError("PAIR_LENGTH")
    paired: list[AdmittedPair] = []
    admitted: list[AdmittedPair] = []
    rejected = 0
    for (old_id, old_price, grade), (new_id, new_price, _) in zip(previous, current, strict=True):
        if old_id != new_id:
            raise ValueError("PAIR_IDENTITY")
        if old_price is None or new_price is None or old_price <= 0 or new_price <= 0:
            continue
        ratio = new_price / old_price
        raw_return = ratio - 1
        record = AdmittedPair(old_id, old_price, new_price, grade, raw_return)
        paired.append(record)
        if DOMAIN_LOW <= ratio <= GROSS_ERROR_RATIO_LIMIT_V3:
            admitted.append(record)
        else:
            rejected += 1
    return tuple(paired), tuple(admitted), rejected


def ask_return(pairs: Sequence[AdmittedPair]) -> Decimal:
    old = sum((row.old_price for row in pairs), Decimal(0))
    new = sum((row.new_price for row in pairs), Decimal(0))
    if old <= 0:
        raise ValueError("EMPTY_ASK_WEIGHT")
    return new / old - 1


def equal_return(pairs: Sequence[AdmittedPair]) -> Decimal:
    if not pairs:
        raise ValueError("EMPTY_EQUAL")
    return sum((row.raw_return for row in pairs), Decimal(0)) / len(pairs)


def winsorized(values: Sequence[Decimal]) -> tuple[Decimal, ...]:
    if len(values) < 100:
        return tuple(values)
    ordered = sorted(values)
    tail = len(values) // 100
    lower, upper = ordered[tail], ordered[-tail - 1]
    return tuple(min(max(value, lower), upper) for value in values)


def robust_equal_return(pairs: Sequence[AdmittedPair]) -> Decimal:
    adjusted = winsorized(tuple(row.raw_return for row in pairs))
    if not adjusted:
        raise ValueError("EMPTY_ROBUST")
    return sum(adjusted, Decimal(0)) / len(adjusted)


def geom_equal_return(pairs: Sequence[AdmittedPair]) -> Decimal:
    if not pairs:
        raise ValueError("EMPTY_GEOM")
    total = sum((log(float(1 + row.raw_return)) for row in pairs), 0.0)
    return Decimal(str(exp(total / len(pairs)) - 1))


def decompose(pairs: Sequence[AdmittedPair]) -> dict[str, Decimal]:
    ask = ask_return(pairs)
    equal = equal_return(pairs)
    robust = robust_equal_return(pairs)
    return {
        "ask": ask,
        "equal_admitted": equal,
        "robust": robust,
        "weight_gap": ask - equal,
        "winsor_gap": equal - robust,
        "ask_minus_robust": ask - robust,
    }


def weights(pairs: Sequence[AdmittedPair]) -> tuple[Decimal, ...]:
    total = sum((row.old_price for row in pairs), Decimal(0))
    if total <= 0:
        raise ValueError("EMPTY_WEIGHTS")
    return tuple(row.old_price / total for row in pairs)


def concentration(pairs: Sequence[AdmittedPair], previous_known: Sequence[Decimal]) -> dict[str, Decimal | int]:
    ranked = sorted(weights(pairs), reverse=True)
    herfindahl = sum((weight * weight for weight in ranked), Decimal(0))
    known = sum((price for price in previous_known if price > 0), Decimal(0))
    admitted_old = sum((row.old_price for row in pairs), Decimal(0))
    d_weight = sum((row.old_price for row in pairs if row.grade == "D"), Decimal(0)) / admitted_old
    top10 = sum(ranked[:10], Decimal(0))
    return {
        "n": len(pairs),
        "max_weight": ranked[0],
        "top10_weight": top10,
        "effective_n": (Decimal(1) / herfindahl) if herfindahl > 0 else Decimal(0),
        "paired_price_coverage": (admitted_old / known) if known > 0 else Decimal(0),
        "d_grade_weight_share": d_weight,
    }


TOY_PREVIOUS = (
    ("cheap-a", Decimal("1"), "A"),
    ("cheap-b", Decimal("1"), "A"),
    ("expensive", Decimal("100"), "A"),
)
TOY_CURRENT = (
    ("cheap-a", Decimal("1.1"), "A"),
    ("cheap-b", Decimal("1.1"), "A"),
    ("expensive", Decimal("90"), "A"),
)

RANGE_INCLUSIVE_DAYS = {"7D": 7, "1M": 31, "3M": 92, "1Y": 366}


def _index_value(point: Mapping[str, object]) -> Decimal | None:
    index = point.get("index")
    if not isinstance(index, Mapping):
        return None
    value = index.get("value")
    if value is None:
        return None
    number = Decimal(str(value))
    return number if number.is_finite() else None


def adjacent_utc_days(previous: str, current: str) -> bool:
    return date.fromisoformat(current) - date.fromisoformat(previous) == timedelta(days=1)


def connected_adjacent_window(points: Sequence[Mapping[str, object]]) -> bool:
    if len(points) < 2:
        return False
    for previous, current in zip(points, points[1:], strict=False):
        current_index = current.get("index")
        period = current_index.get("period_return") if isinstance(current_index, Mapping) else None
        if (
            not current.get("connect_to_previous")
            or current.get("segment_id") is None
            or current.get("segment_id") != previous.get("segment_id")
            or period is None
            or _index_value(previous) is None
            or _index_value(current) is None
            or not adjacent_utc_days(str(previous["date"]), str(current["date"]))
        ):
            return False
    return True


def expected_window_start(last_date: str, inclusive_days: int) -> str:
    return (date.fromisoformat(last_date) - timedelta(days=inclusive_days - 1)).isoformat()


def window_return(points: Sequence[Mapping[str, object]], inclusive_days: int | None = None) -> Decimal | None:
    if not connected_adjacent_window(points):
        return None
    first, last = points[0], points[-1]
    if inclusive_days is not None and str(first["date"]) != expected_window_start(str(last["date"]), inclusive_days):
        return None
    start = _index_value(first)
    end = _index_value(last)
    if start is None or end is None or start == 0:
        return None
    return end / start - 1


def naive_last_first(points: Sequence[Mapping[str, object]]) -> Decimal | None:
    finite = [point for point in points if _index_value(point) is not None]
    if len(finite) < 2:
        return None
    start = _index_value(finite[0])
    end = _index_value(finite[-1])
    if start is None or end is None or start == 0:
        return None
    return end / start - 1


def common_observable_return(points: Sequence[Mapping[str, object]]) -> Decimal | None:
    best: list[Mapping[str, object]] = []
    active: list[Mapping[str, object]] = []
    for point in points:
        if _index_value(point) is None:
            active = []
            continue
        if not active:
            active = [point]
        else:
            previous = active[-1]
            current_index = point.get("index")
            period = current_index.get("period_return") if isinstance(current_index, Mapping) else None
            if (
                point.get("connect_to_previous")
                and point.get("segment_id") is not None
                and point.get("segment_id") == previous.get("segment_id")
                and period is not None
                and adjacent_utc_days(str(previous["date"]), str(point["date"]))
            ):
                active.append(point)
            else:
                active = [point]
        if len(active) > len(best):
            best = list(active)
    if len(best) < 2:
        return None
    start = _index_value(best[0])
    end = _index_value(best[-1])
    if start is None or end is None or start == 0:
        return None
    return end / start - 1


def compound_linked_returns(daily: Sequence[Decimal]) -> Decimal:
    level = Decimal(1)
    for value in daily:
        level *= 1 + value
    return level - 1
