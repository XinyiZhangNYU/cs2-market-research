"""Public, non-private FX context for immutable price display publication."""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from datetime import UTC, date, datetime
from typing import Any

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.fx.ecb import (
    ECB_CROSS_POLICY_VERSION, EcbDailyPair, EcbRateBook, FxContractError,
)
from cs2_research.fx.price_display import (
    HISTORICAL_CONVERSION_POLICY, PRICE_CONVERSION_POLICY, BIGINT_MAX,
    DisplayAmount, NativePrice, PriceValueError, exact_fields, fixed_integer,
    project_amounts, rate_scaled_18,
)


_INSTANT = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z\Z")
_DATE = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}\Z")
_HASH = re.compile(r"[0-9a-f]{64}\Z")
_RATE_ID_FIELDS = (
    "authority", "method", "source_event_date", "cny_per_usd", "cny_valid_from",
    "usd_valid_from", "available_at", "fx_selection_policy_version",
)


def instant(value: object) -> datetime:
    if not isinstance(value, str) or not _INSTANT.fullmatch(value):
        raise PriceValueError("INVALID_TIMESTAMP")
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise PriceValueError("INVALID_TIMESTAMP") from None


def event_date(value: object) -> date:
    if not isinstance(value, str) or not _DATE.fullmatch(value):
        raise PriceValueError("INVALID_DATE")
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise PriceValueError("INVALID_DATE") from None


def public_rate_id(document: dict[str, Any]) -> str:
    """Only public rate content; neither carry nor private leg IDs enter it."""
    return sha256_hex(canonical_json_bytes({key: document[key] for key in _RATE_ID_FIELDS}))


@dataclass(frozen=True, slots=True)
class PriceFxContext:
    public_rate_id: str
    authority: str
    method: str
    source_event_date: str
    cny_per_usd: str
    carry_days: int
    available_at: str
    cny_valid_from: str
    usd_valid_from: str
    fx_selection_policy_version: str
    conversion_policy_version: str
    usage: str

    def __post_init__(self) -> None:
        if (
            self.authority != "ECB" or self.method != "ECB_EUR_CROSS"
            or self.usage != "PRICE_DISPLAY_ONLY"
            or self.fx_selection_policy_version != ECB_CROSS_POLICY_VERSION
            or self.conversion_policy_version not in (
                PRICE_CONVERSION_POLICY, HISTORICAL_CONVERSION_POLICY,
            )
        ):
            raise PriceValueError("INVALID_FX_POLICY")
        rate_scaled_18(self.cny_per_usd)
        event_date(self.source_event_date)
        if type(self.carry_days) is not int or not 0 <= self.carry_days <= 7:
            raise PriceValueError("INVALID_FX_CARRY")
        available = instant(self.available_at)
        if any(instant(v) > available for v in (self.cny_valid_from, self.usd_valid_from)):
            raise PriceValueError("FX_KNOWLEDGE_CLOCK")
        if (
            not isinstance(self.public_rate_id, str) or not _HASH.fullmatch(self.public_rate_id)
            or self.public_rate_id != public_rate_id(asdict(self))
        ):
            raise PriceValueError("PUBLIC_RATE_HASH")

    def validate_binding(self, *, quote_date: date, known_at: datetime) -> None:
        if (
            type(quote_date) is not date or not isinstance(known_at, datetime)
            or known_at.tzinfo is None or known_at.utcoffset() != UTC.utcoffset(known_at)
        ):
            raise PriceValueError("INVALID_FX_QUERY")
        if (quote_date - event_date(self.source_event_date)).days != self.carry_days:
            raise PriceValueError("FX_DATE_BINDING")
        if instant(self.available_at) > known_at:
            raise PriceValueError("FX_FUTURE_KNOWLEDGE")

    @classmethod
    def from_pair(
        cls, pair: EcbDailyPair, *, quote_date: date, known_at: datetime,
        conversion_policy: str = PRICE_CONVERSION_POLICY,
    ) -> PriceFxContext:
        if not isinstance(pair, EcbDailyPair):
            raise PriceValueError("INVALID_FX_PAIR")
        if (
            type(quote_date) is not date or not isinstance(known_at, datetime)
            or known_at.tzinfo is None or known_at.utcoffset() != UTC.utcoffset(known_at)
        ):
            raise PriceValueError("INVALID_FX_QUERY")
        # Even a caller-constructed pair must obey both legs' visibility.
        for leg in (pair.cny_leg, pair.usd_leg):
            if (
                leg.valid_from > known_at or leg.retrieved_at > known_at
                or (leg.valid_to is not None and known_at >= leg.valid_to)
            ):
                raise PriceValueError("FX_FUTURE_KNOWLEDGE")
        document = {
            "authority": "ECB", "method": "ECB_EUR_CROSS",
            "source_event_date": pair.source_event_date.isoformat(),
            "cny_per_usd": format(pair.cny_per_usd, ".18f"),
            "carry_days": pair.carry_days,
            "available_at": utc_timestamp_text(pair.available_at),
            "cny_valid_from": utc_timestamp_text(pair.cny_leg.valid_from),
            "usd_valid_from": utc_timestamp_text(pair.usd_leg.valid_from),
            "fx_selection_policy_version": ECB_CROSS_POLICY_VERSION,
            "conversion_policy_version": conversion_policy,
            "usage": "PRICE_DISPLAY_ONLY",
        }
        result = cls(public_rate_id=public_rate_id(document), **document)
        result.validate_binding(quote_date=quote_date, known_at=known_at)
        return result

    @classmethod
    def from_document(cls, document: object) -> PriceFxContext:
        fields = exact_fields(document, {
            "public_rate_id", "authority", "method", "source_event_date",
            "cny_per_usd", "carry_days", "available_at", "cny_valid_from",
            "usd_valid_from", "fx_selection_policy_version", "conversion_policy_version", "usage",
        }, "INVALID_FX_CONTEXT")
        return cls(**fields)

    def to_document(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True, slots=True)
class PriceFxSelection:
    context: PriceFxContext | None
    reason: str | None

    def __post_init__(self) -> None:
        if (self.context is None and self.reason not in ("NO_ELIGIBLE_FX", "FX_STALE")) or (
            self.context is not None and (not isinstance(self.context, PriceFxContext) or self.reason is not None)
        ):
            raise PriceValueError("INVALID_FX_SELECTION")


def select_price_fx(
    book: EcbRateBook, *, quote_date: date | None, known_at: datetime,
) -> PriceFxSelection:
    """Select at publication time. GET must consume the already sealed context."""
    if not isinstance(book, EcbRateBook) or not isinstance(known_at, datetime):
        raise PriceValueError("INVALID_FX_QUERY")
    if known_at.tzinfo is None or known_at.utcoffset() != UTC.utcoffset(known_at):
        raise PriceValueError("INVALID_FX_QUERY")
    if quote_date is None:
        return PriceFxSelection(None, "NO_ELIGIBLE_FX")
    if type(quote_date) is not date:
        raise PriceValueError("INVALID_FX_QUERY")
    try:
        pair = book.select(quote_date, known_at=known_at, max_carry_days=7)
    except FxContractError:
        # Only *visible* older pairs distinguish stale from unknown. No future
        # evidence date/rate is returned and no alternative source is consulted.
        try:
            book.select(quote_date, known_at=known_at, max_carry_days=(quote_date - date.min).days)
        except FxContractError:
            return PriceFxSelection(None, "NO_ELIGIBLE_FX")
        return PriceFxSelection(None, "FX_STALE")
    return PriceFxSelection(PriceFxContext.from_pair(pair, quote_date=quote_date, known_at=known_at), None)


@dataclass(frozen=True, slots=True)
class FrozenHistoricalPrice:
    """A supplied sealed historical value, not a request to recalibrate it."""

    native: NativePrice
    cny_minor: int
    fx: PriceFxContext
    derived_available_at: str

    def __post_init__(self) -> None:
        if (
            not isinstance(self.native, NativePrice) or self.native.currency != "USD"
            or type(self.cny_minor) is not int or not 0 <= self.cny_minor <= BIGINT_MAX
            or not isinstance(self.fx, PriceFxContext)
            or self.fx.conversion_policy_version != HISTORICAL_CONVERSION_POLICY
        ):
            raise PriceValueError("INVALID_FROZEN_HISTORY")
        if instant(self.derived_available_at) < instant(self.fx.available_at):
            raise PriceValueError("HISTORY_KNOWLEDGE_CLOCK")
        expected = project_amounts(self.native, cny_per_usd=self.fx.cny_per_usd)["CNY"]
        if expected.status != "AVAILABLE" or expected.amount != fixed_integer(self.cny_minor, 2):
            raise PriceValueError("FROZEN_HISTORY_AMOUNT_MISMATCH")

    def amounts(self) -> dict[str, DisplayAmount]:
        verified = project_amounts(self.native, cny_per_usd=self.fx.cny_per_usd)
        # Copy the supplied, verified minor value, not a new-vintage conversion.
        verified["CNY"] = DisplayAmount(
            "AVAILABLE", "CNY", fixed_integer(self.cny_minor, 2), 2,
            "FX_DERIVED", verified["CNY"].rounding, None,
        )
        return verified
