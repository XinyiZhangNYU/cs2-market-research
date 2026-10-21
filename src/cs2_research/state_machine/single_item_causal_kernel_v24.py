"""Point-in-time single-item detector shared by history and live projections.

The kernel is deliberately pure: it accepts dated facts plus their availability
clocks and returns only facts knowable at ``as_of``.  It does not read files,
databases, provider APIs, future outcomes, or publication state.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Context, Decimal, ROUND_HALF_EVEN, localcontext
import hashlib
import json
from statistics import median
from typing import Iterable, Sequence


KERNEL_VERSION = "single-item-causal-kernel/2.4"
POLICY_VERSION = "single-item-causal-kernel-policy/2.4"
_DECIMAL_CONTEXT = Context(prec=50, rounding=ROUND_HALF_EVEN)


class CausalKernelError(ValueError):
    """A non-canonical input or policy was rejected."""


def _require(condition: bool, code: str) -> None:
    if not condition:
        raise CausalKernelError(code)


def _plain(value):
    if isinstance(value, Decimal):
        rendered = format(value, "f").rstrip("0").rstrip(".")
        return rendered or "0"
    if isinstance(value, (date, datetime)):
        return value.isoformat().replace("+00:00", "Z")
    if isinstance(value, dict):
        return {key: _plain(value[key]) for key in sorted(value)}
    if isinstance(value, (list, tuple)):
        return [_plain(item) for item in value]
    return value


def canonical_bytes(value) -> bytes:
    return json.dumps(_plain(value), ensure_ascii=False, sort_keys=True,
                      separators=(",", ":")).encode("utf-8")


def _median(values: Sequence[Decimal]) -> Decimal | None:
    return None if not values else Decimal(str(median(values)))


def _ratio(numerator: Decimal | None, denominator: Decimal | None) -> Decimal | None:
    if numerator is None or denominator is None or denominator <= 0:
        return None
    with localcontext(_DECIMAL_CONTEXT):
        return numerator / denominator


@dataclass(frozen=True, slots=True)
class CausalPolicyV24:
    version: str = POLICY_VERSION
    smoothing_days: int = 7
    short_baseline_days: int = 28
    long_baseline_days: int = 56
    minimum_baseline_days: int = 21
    onset_persistence_days: int = 2
    onset_persistence_window: int = 3
    supply_onset_ratio: Decimal = Decimal("0.85")
    supply_confirmation_ratio: Decimal = Decimal("0.70")
    price_onset_ratio: Decimal = Decimal("1.15")
    price_confirmation_ratio: Decimal = Decimal("2.0")
    minimum_baseline_price_usd: Decimal = Decimal("0.50")
    minimum_absolute_price_move_usd: Decimal = Decimal("0.10")
    minimum_baseline_notional_usd: Decimal = Decimal("2000")
    minimum_baseline_supply: int = 10
    supply_noise_multiplier: Decimal = Decimal("3")
    minimum_absolute_supply_drop: Decimal = Decimal("3")
    pairing_horizon_days: int = 60
    bid_role: str = "QUOTE_QUALITY_CONTEXT_ONLY"

    def __post_init__(self) -> None:
        _require(self.version == POLICY_VERSION, "POLICY_VERSION")
        _require(1 <= self.smoothing_days < self.minimum_baseline_days,
                 "SMOOTHING_WINDOW")
        _require(self.minimum_baseline_days <= self.short_baseline_days
                 < self.long_baseline_days, "BASELINE_WINDOWS")
        _require(1 <= self.onset_persistence_days <= self.onset_persistence_window,
                 "PERSISTENCE_WINDOW")
        _require(Decimal(0) < self.supply_confirmation_ratio
                 < self.supply_onset_ratio < Decimal(1), "SUPPLY_THRESHOLDS")
        _require(Decimal(1) < self.price_onset_ratio
                 < self.price_confirmation_ratio, "PRICE_THRESHOLDS")
        _require(self.pairing_horizon_days == 60, "PAIRING_HORIZON")
        _require(self.bid_role == "QUOTE_QUALITY_CONTEXT_ONLY", "BID_ROLE")

    @property
    def sha256(self) -> str:
        return hashlib.sha256(canonical_bytes(asdict(self))).hexdigest()


@dataclass(frozen=True, slots=True)
class KnownDailyObservation:
    item_id: int
    observed_on: date
    available_at: datetime
    ask_usd: Decimal | None
    supply: int | None
    bid_usd: Decimal | None = None

    def __post_init__(self) -> None:
        _require(type(self.item_id) is int and self.item_id >= 0, "ITEM_ID")
        _require(self.available_at.tzinfo is not None
                 and self.available_at.utcoffset() == timedelta(0), "AVAILABLE_AT_UTC")
        _require(self.available_at.date() >= self.observed_on, "AVAILABLE_BEFORE_OBSERVATION")
        _require(self.ask_usd is None or self.ask_usd >= 0, "ASK_NONNEGATIVE")
        _require(self.bid_usd is None or self.bid_usd >= 0, "BID_NONNEGATIVE")
        _require(self.supply is None or type(self.supply) is int and self.supply >= 0,
                 "SUPPLY_NONNEGATIVE")


@dataclass(frozen=True, slots=True)
class CausalDayV24:
    item_id: int
    observed_on: date
    available_at: datetime
    ask_usd: Decimal | None
    supply: int | None
    bid_usd: Decimal | None
    smoothed_ask_usd: Decimal | None
    smoothed_supply: Decimal | None
    baseline_ask_usd: Decimal | None
    baseline_supply: Decimal | None
    baseline_notional_usd: Decimal | None
    supply_noise: Decimal | None
    price_ratio: Decimal | None
    supply_ratio: Decimal | None
    supply_onset: bool
    supply_onset_on: date | None
    supply_detected_at: datetime | None
    price_onset: bool
    price_onset_on: date | None
    price_detected_at: datetime | None
    supply_confirmed: bool
    price_confirmed: bool
    supply_quality_eligible: bool
    price_quality_eligible: bool
    bid_quote_rational: bool | None

    @property
    def observation_complete(self) -> bool:
        return self.ask_usd is not None and self.supply is not None


def _window(rows: Sequence[KnownDailyObservation], index: int, days: int,
            field: str, *, prior_only: bool) -> list[Decimal]:
    end_index = index if prior_only else index + 1
    end_day = rows[index].observed_on - (timedelta(days=1) if prior_only else timedelta(0))
    start_day = end_day - timedelta(days=days - 1)
    result: list[Decimal] = []
    for row in rows[:end_index]:
        if start_day <= row.observed_on <= end_day:
            value = getattr(row, field)
            if value is not None:
                result.append(Decimal(value))
    return result


def _persistence_window(provisional: Sequence[dict], index: int, key: str,
                        policy: CausalPolicyV24) -> list[dict]:
    start = max(0, index - policy.onset_persistence_window + 1)
    window = provisional[start:index + 1]
    if len(window) < policy.onset_persistence_days:
        return []
    expected = provisional[index]["row"].observed_on - timedelta(days=len(window) - 1)
    if window[0]["row"].observed_on != expected:
        return []
    field = "supply" if key == "raw_supply" else "ask_usd"
    if any(getattr(value["row"], field) is None for value in window):
        return []
    return window if sum(bool(row[key]) for row in window) >= policy.onset_persistence_days else []


def _persistent(provisional: Sequence[dict], index: int, key: str,
                policy: CausalPolicyV24) -> bool:
    return bool(_persistence_window(provisional, index, key, policy))


def _persistence_onset(provisional: Sequence[dict], index: int, key: str,
                       policy: CausalPolicyV24) -> date | None:
    window = _persistence_window(provisional, index, key, policy)
    qualifying = [value["row"].observed_on for value in window if value[key]]
    return min(qualifying) if qualifying else None


def _persistence_detection(provisional: Sequence[dict], index: int, key: str,
                           policy: CausalPolicyV24) -> datetime | None:
    window = _persistence_window(provisional, index, key, policy)
    if not window:
        return None
    return max(value["row"].available_at for value in window)


def evaluate_as_of(
    observations: Iterable[KnownDailyObservation],
    *,
    as_of: datetime,
    policy: CausalPolicyV24 | None = None,
) -> tuple[CausalDayV24, ...]:
    """Evaluate an item prefix; facts unavailable at ``as_of`` are invisible."""

    policy = policy or CausalPolicyV24()
    _require(as_of.tzinfo is not None and as_of.utcoffset() == timedelta(0), "AS_OF_UTC")
    supplied = tuple(observations)
    _require(bool(supplied), "EMPTY_HISTORY")
    item_ids = {row.item_id for row in supplied}
    _require(len(item_ids) == 1, "MIXED_ITEM_HISTORY")
    _require(all(supplied[index - 1].observed_on < supplied[index].observed_on
                 for index in range(1, len(supplied))), "OBSERVATIONS_NOT_ORDERED")
    rows = tuple(row for row in supplied if row.available_at <= as_of)
    if not rows:
        return ()

    provisional: list[dict] = []
    for index, row in enumerate(rows):
        asks = _window(rows, index, policy.smoothing_days, "ask_usd", prior_only=False)
        supplies = _window(rows, index, policy.smoothing_days, "supply", prior_only=False)
        ask_short = _window(rows, index, policy.short_baseline_days, "ask_usd", prior_only=True)
        ask_long = _window(rows, index, policy.long_baseline_days, "ask_usd", prior_only=True)
        supply_short = _window(rows, index, policy.short_baseline_days, "supply", prior_only=True)
        supply_long = _window(rows, index, policy.long_baseline_days, "supply", prior_only=True)
        smoothed_ask = _median(asks)
        smoothed_supply = _median(supplies)
        baseline_ask = _median(ask_long) if len(ask_long) >= policy.minimum_baseline_days else None
        short_supply = _median(supply_short)
        long_supply = _median(supply_long)
        baseline_supply = (
            max(value for value in (short_supply, long_supply) if value is not None)
            if len(supply_long) >= policy.minimum_baseline_days else None
        )
        price_ratio = _ratio(smoothed_ask, baseline_ask)
        supply_ratio = _ratio(smoothed_supply, baseline_supply)
        notional = (None if baseline_ask is None or baseline_supply is None
                    else baseline_ask * baseline_supply)
        prior_rows = rows[max(0, index - policy.long_baseline_days):index]
        movements = [
            abs(Decimal(right.supply) - Decimal(left.supply))
            for left, right in zip(prior_rows, prior_rows[1:])
            if right.observed_on == left.observed_on + timedelta(days=1)
            and left.supply is not None and right.supply is not None
        ]
        noise = _median(movements)
        noise_floor = max(policy.minimum_absolute_supply_drop,
                          (noise or Decimal(0)) * policy.supply_noise_multiplier)
        supply_drop = (None if baseline_supply is None or row.supply is None
                       else baseline_supply - Decimal(row.supply))
        smoothed_supply_drop = (None if baseline_supply is None or smoothed_supply is None
                                else baseline_supply - smoothed_supply)
        price_move = (None if baseline_ask is None or smoothed_ask is None
                      else smoothed_ask - baseline_ask)
        supply_quality = bool(
            baseline_supply is not None and baseline_supply >= policy.minimum_baseline_supply
            and noise is not None and supply_drop is not None and supply_drop >= noise_floor
        )
        supply_confirmation_quality = bool(
            baseline_supply is not None and baseline_supply >= policy.minimum_baseline_supply
            and noise is not None and smoothed_supply_drop is not None
            and smoothed_supply_drop >= noise_floor
        )
        price_quality = bool(
            row.ask_usd is not None and baseline_ask is not None
            and baseline_ask >= policy.minimum_baseline_price_usd
            and notional is not None and notional >= policy.minimum_baseline_notional_usd
            and price_move is not None and price_move >= policy.minimum_absolute_price_move_usd
        )
        raw_supply = bool(
            row.supply is not None and baseline_supply is not None
            and Decimal(row.supply) / baseline_supply <= policy.supply_onset_ratio
            and supply_quality
        )
        raw_price = bool(price_ratio is not None
                         and price_ratio >= policy.price_onset_ratio and price_quality)
        bid_rational = None
        if row.ask_usd is not None and row.ask_usd > 0 and row.bid_usd is not None:
            bid_rational = (row.bid_usd <= row.ask_usd
                            and row.bid_usd >= row.ask_usd * Decimal("0.50"))
        provisional.append({
            "row": row,
            "smoothed_ask": smoothed_ask,
            "smoothed_supply": smoothed_supply,
            "baseline_ask": baseline_ask,
            "baseline_supply": baseline_supply,
            "notional": notional,
            "noise": noise,
            "price_ratio": price_ratio,
            "supply_ratio": supply_ratio,
            "supply_quality": supply_quality,
            "price_quality": price_quality,
            "raw_supply": raw_supply,
            "raw_price": raw_price,
            "supply_confirmed": bool(
                supply_ratio is not None and supply_ratio <= policy.supply_confirmation_ratio
                and supply_confirmation_quality
            ),
            "price_confirmed": bool(
                price_ratio is not None and price_ratio >= policy.price_confirmation_ratio
                and price_quality
            ),
            "bid_rational": bid_rational,
        })

    return tuple(CausalDayV24(
        item_id=value["row"].item_id,
        observed_on=value["row"].observed_on,
        available_at=value["row"].available_at,
        ask_usd=value["row"].ask_usd,
        supply=value["row"].supply,
        bid_usd=value["row"].bid_usd,
        smoothed_ask_usd=value["smoothed_ask"],
        smoothed_supply=value["smoothed_supply"],
        baseline_ask_usd=value["baseline_ask"],
        baseline_supply=value["baseline_supply"],
        baseline_notional_usd=value["notional"],
        supply_noise=value["noise"],
        price_ratio=value["price_ratio"],
        supply_ratio=value["supply_ratio"],
        supply_onset=_persistent(provisional, index, "raw_supply", policy),
        supply_onset_on=_persistence_onset(provisional, index, "raw_supply", policy),
        supply_detected_at=_persistence_detection(provisional, index, "raw_supply", policy),
        price_onset=_persistent(provisional, index, "raw_price", policy),
        price_onset_on=_persistence_onset(provisional, index, "raw_price", policy),
        price_detected_at=_persistence_detection(provisional, index, "raw_price", policy),
        supply_confirmed=value["supply_confirmed"],
        price_confirmed=value["price_confirmed"],
        supply_quality_eligible=value["supply_quality"],
        price_quality_eligible=value["price_quality"],
        bid_quote_rational=value["bid_rational"],
    ) for index, value in enumerate(provisional))


def frozen_baseline(day: CausalDayV24, *, scope: str,
                    policy: CausalPolicyV24 | None = None) -> dict:
    policy = policy or CausalPolicyV24()
    _require(scope in {"ASSOCIATION", "SUPPLY_LEG", "PRICE_LEG"}, "BASELINE_SCOPE")
    _require(day.baseline_ask_usd is not None and day.baseline_supply is not None,
             "BASELINE_NOT_READY")
    return {
        "scope": scope,
        "observed_on": day.observed_on.isoformat(),
        "ask_usd": day.baseline_ask_usd,
        "supply": day.baseline_supply,
        "notional_usd": day.baseline_notional_usd,
        "quality_eligible": bool(
            day.baseline_notional_usd is not None
            and day.baseline_notional_usd >= policy.minimum_baseline_notional_usd
        ),
    }


__all__ = [
    "KERNEL_VERSION", "POLICY_VERSION", "CausalKernelError", "CausalPolicyV24",
    "KnownDailyObservation", "CausalDayV24", "evaluate_as_of", "frozen_baseline",
    "canonical_bytes",
]
