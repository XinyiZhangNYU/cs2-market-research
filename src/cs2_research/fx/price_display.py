"""Exact, offline USD/CNY display arithmetic; never a trading/fusion input.

All arithmetic is integer arithmetic on the *native* price and the scale-18
rate.  In particular, neither Decimal's ambient context nor a rounded inverse
rate participates.  This module has no file, database, clock or network input.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from typing import Any, Mapping


PRICE_CONVERSION_POLICY = "price-display-bicurrency/1"
HISTORICAL_CONVERSION_POLICY = "ecb-eur-cross-daily/2"
BIGINT_MAX = 2**63 - 1
USD_SCALED_MAX = 10**38 - 1
SAFE_INTEGER_MAX = 2**53 - 1
SOURCE_REASONS = frozenset({"SOURCE_UNAVAILABLE", "CAPTURE_GAP", "SOURCE_CONFLICT"})
FX_REASONS = frozenset({"NO_ELIGIBLE_FX", "FX_STALE"})
AMOUNT_REASONS = SOURCE_REASONS | FX_REASONS | {"AMOUNT_OUT_OF_RANGE"}
_USD = re.compile(r"(?:0|[1-9][0-9]{0,29})\.[0-9]{8}\Z")
_MINOR = re.compile(r"(?:0|[1-9][0-9]{0,18})\Z")
_CNY = re.compile(r"(?:0|[1-9][0-9]{0,16})\.[0-9]{2}\Z")
_RATE = re.compile(r"(?:0|[1-9][0-9]{0,19})\.[0-9]{18}\Z")


class PriceValueError(ValueError):
    """A controlled, non-reflective rejection at the price boundary."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def exact_fields(value: object, expected: set[str], code: str) -> Mapping[str, Any]:
    if not isinstance(value, dict) or set(value) != expected:
        raise PriceValueError(code)
    return value


def fixed_integer(value: int, scale: int) -> str:
    """Render an already-quantized nonnegative integer, without floating point."""
    if type(value) is not int or value < 0 or scale not in (2, 8):
        raise PriceValueError("INVALID_AMOUNT")
    base = 10**scale
    return f"{value // base}.{value % base:0{scale}d}"


def rate_scaled_18(value: object) -> int:
    if not isinstance(value, str) or not _RATE.fullmatch(value):
        raise PriceValueError("INVALID_FX_RATE")
    scaled = int(value.replace(".", ""))
    if scaled == 0:
        raise PriceValueError("INVALID_FX_RATE")
    return scaled


def half_even_ratio(numerator: int, denominator: int) -> tuple[int, str]:
    if (
        type(numerator) is not int or numerator < 0
        or type(denominator) is not int or denominator <= 0
    ):
        raise PriceValueError("INVALID_RATIO")
    quotient, remainder = divmod(numerator, denominator)
    if remainder * 2 > denominator or (
        remainder * 2 == denominator and quotient % 2 == 1
    ):
        quotient += 1
    rounding = "EXACT" if remainder == 0 else "ROUNDED"
    if numerator > 0 and quotient == 0:
        rounding = "ROUNDED_TO_ZERO"
    return quotient, rounding


@dataclass(frozen=True, slots=True)
class NativePrice:
    value: str
    currency: str
    unit: str
    normalized_fraction_digits: int
    upstream_fraction_digits: int | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.value, str):
            raise PriceValueError("INVALID_NATIVE_INPUT")
        if type(self.normalized_fraction_digits) is not int:
            raise PriceValueError("INVALID_NATIVE_PRECISION")
        upstream = self.upstream_fraction_digits
        if upstream is not None and (
            type(upstream) is not int or not 0 <= upstream <= SAFE_INTEGER_MAX
        ):
            raise PriceValueError("INVALID_UPSTREAM_PRECISION")
        if self.unit == "USD_DECIMAL" and self.currency == "USD":
            if self.normalized_fraction_digits != 8 or not _USD.fullmatch(self.value):
                raise PriceValueError("INVALID_NATIVE_INPUT")
        elif self.unit == "CNY_MINOR" and self.currency == "CNY":
            if (
                self.normalized_fraction_digits != 0
                or not _MINOR.fullmatch(self.value)
                or int(self.value) > BIGINT_MAX
            ):
                raise PriceValueError("INVALID_NATIVE_INPUT")
        else:
            # A historical derived CNY value is deliberately not an input unit.
            raise PriceValueError("INVALID_NATIVE_INPUT")

    @classmethod
    def from_document(cls, value: object) -> NativePrice:
        fields = exact_fields(value, {
            "value", "currency", "unit", "normalized_fraction_digits",
            "upstream_fraction_digits",
        }, "INVALID_NATIVE_INPUT")
        return cls(**fields)

    def to_document(self) -> dict[str, Any]:
        return asdict(self)

    @property
    def scaled_value(self) -> int:
        return int(self.value.replace(".", ""))

    @property
    def native_amount(self) -> str:
        return self.value if self.currency == "USD" else fixed_integer(int(self.value), 2)


@dataclass(frozen=True, slots=True)
class DisplayAmount:
    status: str
    currency: str
    amount: str | None
    scale: int | None
    basis: str | None
    rounding: str | None
    reason: str | None

    def __post_init__(self) -> None:
        if self.currency not in ("USD", "CNY"):
            raise PriceValueError("INVALID_AMOUNT_CURRENCY")
        if self.status == "UNAVAILABLE":
            if (
                any(v is not None for v in (self.amount, self.scale, self.basis, self.rounding))
                or self.reason not in AMOUNT_REASONS
            ):
                raise PriceValueError("INVALID_UNAVAILABLE_AMOUNT")
            return
        pattern = _USD if self.currency == "USD" else _CNY
        if (
            self.status != "AVAILABLE" or self.reason is not None
            or type(self.scale) is not int
            or self.scale != (8 if self.currency == "USD" else 2)
            or not isinstance(self.amount, str) or not pattern.fullmatch(self.amount)
            or self.basis not in ("NATIVE", "FX_DERIVED")
            or self.rounding not in ("EXACT", "ROUNDED", "ROUNDED_TO_ZERO")
        ):
            raise PriceValueError("INVALID_AVAILABLE_AMOUNT")
        scaled = int(self.amount.replace(".", ""))
        if scaled > (USD_SCALED_MAX if self.currency == "USD" else BIGINT_MAX):
            raise PriceValueError("INVALID_AMOUNT_RANGE")
        if self.basis == "NATIVE" and self.rounding != "EXACT":
            raise PriceValueError("NATIVE_MUST_BE_EXACT")
        if self.rounding == "ROUNDED_TO_ZERO" and scaled != 0:
            raise PriceValueError("INVALID_ZERO_ROUNDING")

    @classmethod
    def from_document(cls, value: object) -> DisplayAmount:
        return cls(**exact_fields(value, {
            "status", "currency", "amount", "scale", "basis", "rounding", "reason",
        }, "INVALID_AMOUNT"))

    def to_document(self) -> dict[str, Any]:
        return asdict(self)


def unavailable_amount(currency: str, reason: str) -> DisplayAmount:
    return DisplayAmount("UNAVAILABLE", currency, None, None, None, None, reason)


def project_amounts(
    source: NativePrice | None,
    *,
    cny_per_usd: str | None = None,
    fx_unavailable_reason: str = "NO_ELIGIBLE_FX",
    source_price_reason: str | None = None,
) -> dict[str, DisplayAmount]:
    """One native representation plus at most one conversion/quantization."""
    if fx_unavailable_reason not in FX_REASONS:
        raise PriceValueError("INVALID_FX_REASON")
    if source is None:
        if source_price_reason not in SOURCE_REASONS or cny_per_usd is not None:
            raise PriceValueError("INVALID_SOURCE_UNAVAILABLE")
        return {c: unavailable_amount(c, source_price_reason) for c in ("USD", "CNY")}
    if not isinstance(source, NativePrice) or source_price_reason is not None:
        raise PriceValueError("INVALID_NATIVE_INPUT")
    native = DisplayAmount(
        "AVAILABLE", source.currency, source.native_amount,
        8 if source.currency == "USD" else 2, "NATIVE", "EXACT", None,
    )
    target_currency = "CNY" if source.currency == "USD" else "USD"
    if cny_per_usd is None:
        target = unavailable_amount(target_currency, fx_unavailable_reason)
    else:
        rate = rate_scaled_18(cny_per_usd)
        if source.currency == "USD":
            # USD_scaled_8 * rate_scaled_18 * 100 / (10**8 * 10**18).
            scaled, rounding = half_even_ratio(source.scaled_value * rate, 10**24)
        else:
            # CNY_minor * 10**8 * 10**18 / (100 * rate_scaled_18).
            scaled, rounding = half_even_ratio(source.scaled_value * 10**24, rate)
        ceiling = BIGINT_MAX if target_currency == "CNY" else USD_SCALED_MAX
        scale = 2 if target_currency == "CNY" else 8
        target = (
            unavailable_amount(target_currency, "AMOUNT_OUT_OF_RANGE")
            if scaled > ceiling else DisplayAmount(
                "AVAILABLE", target_currency, fixed_integer(scaled, scale), scale,
                "FX_DERIVED", rounding, None,
            )
        )
    return {"USD": native if source.currency == "USD" else target,
            "CNY": native if source.currency == "CNY" else target}


def validate_amounts(
    source: NativePrice | None,
    amounts: object,
    *,
    cny_per_usd: str | None,
    source_price_reason: str | None,
    conversion_policy: str = PRICE_CONVERSION_POLICY,
) -> None:
    """Verify sealed outputs, never replace them with the recomputed check."""
    fields = exact_fields(amounts, {"USD", "CNY"}, "INVALID_AMOUNTS")
    parsed = {c: DisplayAmount.from_document(fields[c]) for c in ("USD", "CNY")}
    if any(parsed[c].currency != c for c in parsed):
        raise PriceValueError("AMOUNT_CURRENCY_BINDING")
    if conversion_policy not in (PRICE_CONVERSION_POLICY, HISTORICAL_CONVERSION_POLICY):
        raise PriceValueError("INVALID_CONVERSION_POLICY")
    if conversion_policy == HISTORICAL_CONVERSION_POLICY and (
        source is None or source.currency != "USD" or cny_per_usd is None
    ):
        raise PriceValueError("INVALID_FROZEN_HISTORY")
    missing_reason = "NO_ELIGIBLE_FX"
    if source is not None and cny_per_usd is None:
        missing_reason = parsed["CNY" if source.currency == "USD" else "USD"].reason
        if missing_reason not in FX_REASONS:
            raise PriceValueError("INVALID_FX_REASON")
    expected = project_amounts(
        source, cny_per_usd=cny_per_usd,
        fx_unavailable_reason=missing_reason, source_price_reason=source_price_reason,
    )
    if parsed != expected:
        raise PriceValueError("AMOUNT_SEMANTICS")
