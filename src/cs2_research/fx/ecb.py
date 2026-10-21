"""Strict ECB CNY/EUR and USD/EUR vintage decoding.

The ECB files are evidence inputs, not live configuration.  Every caller must
bind the exact file hash and retrieval instant.  The rate book never fills from
the future and never synthesizes a missing currency leg.
"""

from __future__ import annotations

import csv
import hashlib
import re
from bisect import bisect_right
from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_EVEN, localcontext
from pathlib import Path
from typing import Iterable

from cs2_research.canonical import typed_record_hash, utc_timestamp_text


ECB_CROSS_POLICY_VERSION = "ecb-eur-cross-daily/2"
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_CURRENCIES = frozenset({"CNY", "USD"})


class FxContractError(ValueError):
    """An input cannot enter the frozen FX fact boundary."""


def _utc(value: datetime, field: str) -> datetime:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() is None
    ):
        raise FxContractError(f"{field} must be timezone-aware")
    return value.astimezone(UTC)


def _decimal_text(value: Decimal) -> str:
    if not isinstance(value, Decimal) or not value.is_finite() or value <= 0:
        raise FxContractError("reference rates must be finite and positive")
    with localcontext() as context:
        context.prec = 50
        rendered = format(value.normalize(), "f")
    if "." in rendered:
        rendered = rendered.rstrip("0").rstrip(".")
    return rendered or "0"


def _parse_datetime(value: str, field: str) -> datetime:
    if not value:
        raise FxContractError(f"{field} is required")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise FxContractError(f"{field} is not an ISO-8601 instant") from None
    return _utc(parsed, field)


@dataclass(frozen=True, slots=True)
class EcbReferenceLeg:
    source_event_date: date
    currency: str
    rate_per_eur: Decimal
    valid_from: datetime
    valid_to: datetime | None
    retrieved_at: datetime
    evidence_sha256: str

    def __post_init__(self) -> None:
        if not isinstance(self.source_event_date, date):
            raise FxContractError("source_event_date must be a date")
        if self.currency not in _CURRENCIES:
            raise FxContractError("only CNY/EUR and USD/EUR legs are admitted")
        _decimal_text(self.rate_per_eur)
        valid_from = _utc(self.valid_from, "valid_from")
        retrieved_at = _utc(self.retrieved_at, "retrieved_at")
        valid_to = None if self.valid_to is None else _utc(self.valid_to, "valid_to")
        if valid_to is not None and valid_to <= valid_from:
            raise FxContractError("valid_to must be later than valid_from")
        if retrieved_at < valid_from:
            raise FxContractError("retrieved_at cannot precede publisher valid_from")
        if not _SHA256.fullmatch(self.evidence_sha256):
            raise FxContractError("evidence_sha256 must be lowercase SHA-256")
        object.__setattr__(self, "valid_from", valid_from)
        object.__setattr__(self, "valid_to", valid_to)
        object.__setattr__(self, "retrieved_at", retrieved_at)

    @property
    def revision_hash(self) -> str:
        return typed_record_hash(
            "ecb-reference-leg-v1",
            (
                ("source_event_date", "date", self.source_event_date.isoformat()),
                ("currency", "currency", self.currency),
                ("currency_denom", "currency", "EUR"),
                ("rate_per_eur", "decimal", _decimal_text(self.rate_per_eur)),
                ("valid_from", "timestamp", utc_timestamp_text(self.valid_from)),
                (
                    "valid_to",
                    "timestamp",
                    None if self.valid_to is None else utc_timestamp_text(self.valid_to),
                ),
            ),
        )


@dataclass(frozen=True, slots=True)
class EcbDailyPair:
    source_event_date: date
    cny_leg: EcbReferenceLeg
    usd_leg: EcbReferenceLeg
    carry_days: int

    def __post_init__(self) -> None:
        if self.cny_leg.currency != "CNY" or self.usd_leg.currency != "USD":
            raise FxContractError("daily pair must contain CNY and USD legs")
        if (
            self.cny_leg.source_event_date != self.source_event_date
            or self.usd_leg.source_event_date != self.source_event_date
        ):
            raise FxContractError("daily pair legs must share source_event_date")
        if isinstance(self.carry_days, bool) or self.carry_days < 0:
            raise FxContractError("carry_days must be non-negative")

    @property
    def cny_per_usd(self) -> Decimal:
        with localcontext() as context:
            context.prec = 50
            return (self.cny_leg.rate_per_eur / self.usd_leg.rate_per_eur).quantize(
                Decimal("0.000000000000000001"), rounding=ROUND_HALF_EVEN
            )

    @property
    def available_at(self) -> datetime:
        # ``valid_from`` is the publisher clock.  The project cannot claim the
        # pair was knowable before it actually acquired evidence for both
        # legs, so the knowledge clock must also include both retrievals.
        return max(
            self.cny_leg.valid_from,
            self.usd_leg.valid_from,
            self.cny_leg.retrieved_at,
            self.usd_leg.retrieved_at,
        )

    @property
    def pair_hash(self) -> str:
        return typed_record_hash(
            "ecb-daily-pair-v1",
            (
                ("source_event_date", "date", self.source_event_date.isoformat()),
                ("cny_leg_revision_hash", "sha256", self.cny_leg.revision_hash),
                ("usd_leg_revision_hash", "sha256", self.usd_leg.revision_hash),
                ("cny_per_usd", "decimal", _decimal_text(self.cny_per_usd)),
            ),
        )


def load_ecb_vintage_csv(
    path: Path,
    *,
    expected_sha256: str,
    retrieved_at: datetime,
) -> tuple[EcbReferenceLeg, ...]:
    """Decode one exact ECB Data API CSV artifact.

    Non-CNY/USD rows are rejected rather than ignored because the caller is
    required to supply the already bounded two-leg artifact.
    """

    path = Path(path)
    if not _SHA256.fullmatch(expected_sha256):
        raise FxContractError("expected_sha256 must be lowercase SHA-256")
    payload = path.read_bytes()
    if hashlib.sha256(payload).hexdigest() != expected_sha256:
        raise FxContractError("ECB vintage artifact hash mismatch")
    retrieved = _utc(retrieved_at, "retrieved_at")
    try:
        text = payload.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise FxContractError("ECB vintage artifact must be UTF-8 CSV") from None
    reader = csv.DictReader(text.splitlines())
    required = {
        "KEY",
        "FREQ",
        "CURRENCY",
        "CURRENCY_DENOM",
        "EXR_TYPE",
        "EXR_SUFFIX",
        "TIME_PERIOD",
        "OBS_VALUE",
        "VALID_FROM",
        "VALID_TO",
    }
    if reader.fieldnames is None or not required.issubset(reader.fieldnames):
        raise FxContractError("ECB vintage CSV header is incomplete")
    legs: list[EcbReferenceLeg] = []
    for ordinal, row in enumerate(reader, start=2):
        currency = row["CURRENCY"]
        if (
            currency not in _CURRENCIES
            or row["FREQ"] != "D"
            or row["CURRENCY_DENOM"] != "EUR"
            or row["EXR_TYPE"] != "SP00"
            or row["EXR_SUFFIX"] != "A"
            or row["KEY"] != f"EXR.D.{currency}.EUR.SP00.A"
        ):
            raise FxContractError(f"ECB vintage row {ordinal} is outside the two-leg contract")
        try:
            event_date = date.fromisoformat(row["TIME_PERIOD"])
            rate = Decimal(row["OBS_VALUE"])
        except (ValueError, InvalidOperation):
            raise FxContractError(f"ECB vintage row {ordinal} has invalid date/rate") from None
        valid_to = (
            None
            if not row["VALID_TO"]
            else _parse_datetime(row["VALID_TO"], "VALID_TO")
        )
        legs.append(
            EcbReferenceLeg(
                source_event_date=event_date,
                currency=currency,
                rate_per_eur=rate,
                valid_from=_parse_datetime(row["VALID_FROM"], "VALID_FROM"),
                valid_to=valid_to,
                retrieved_at=retrieved,
                evidence_sha256=expected_sha256,
            )
        )
    if not legs:
        raise FxContractError("ECB vintage artifact contains no admitted legs")
    return tuple(legs)


def merge_reference_legs(
    *collections: Iterable[EcbReferenceLeg],
) -> tuple[EcbReferenceLeg, ...]:
    """Merge exact semantic revisions and fail on contradictory duplicates."""

    by_revision: dict[str, EcbReferenceLeg] = {}
    by_identity: dict[tuple[date, str, datetime, datetime | None], str] = {}
    for collection in collections:
        for leg in collection:
            if not isinstance(leg, EcbReferenceLeg):
                raise TypeError("reference leg collections must contain EcbReferenceLeg")
            identity = (
                leg.source_event_date,
                leg.currency,
                leg.valid_from,
                leg.valid_to,
            )
            prior_hash = by_identity.get(identity)
            if prior_hash is not None and prior_hash != leg.revision_hash:
                raise FxContractError("ECB vintage identity has conflicting values")
            by_identity[identity] = leg.revision_hash
            prior = by_revision.get(leg.revision_hash)
            # A semantic revision may be present in more than one frozen
            # vintage.  Retain the earliest locally acquired evidence so its
            # knowledge clock is deterministic and never later than necessary.
            if prior is None or (
                leg.retrieved_at,
                leg.evidence_sha256,
            ) < (
                prior.retrieved_at,
                prior.evidence_sha256,
            ):
                by_revision[leg.revision_hash] = leg
    return tuple(
        sorted(
            by_revision.values(),
            key=lambda leg: (
                leg.source_event_date,
                leg.currency,
                leg.valid_from,
                leg.revision_hash,
            ),
        )
    )


class EcbRateBook:
    def __init__(self, legs: Iterable[EcbReferenceLeg]) -> None:
        grouped: dict[tuple[date, str], list[EcbReferenceLeg]] = {}
        for leg in merge_reference_legs(tuple(legs)):
            grouped.setdefault((leg.source_event_date, leg.currency), []).append(leg)
        dates = sorted({key[0] for key in grouped})
        if not dates:
            raise FxContractError("rate book requires reference legs")
        self._grouped = {
            key: tuple(sorted(values, key=lambda leg: (leg.valid_from, leg.revision_hash)))
            for key, values in grouped.items()
        }
        self._dates = tuple(dates)
        self._unbounded_knowledge_cache: dict[tuple[date, int], EcbDailyPair] = {}

    def _visible_leg(
        self,
        event_date: date,
        currency: str,
        known_at: datetime | None,
    ) -> EcbReferenceLeg | None:
        candidates = self._grouped.get((event_date, currency), ())
        if known_at is None:
            return candidates[-1] if candidates else None
        known = _utc(known_at, "known_at")
        visible = tuple(
            leg
            for leg in candidates
            if leg.valid_from <= known
            and leg.retrieved_at <= known
            and (leg.valid_to is None or known < leg.valid_to)
        )
        return visible[-1] if visible else None

    def select(
        self,
        bucket_date: date,
        *,
        known_at: datetime | None = None,
        max_carry_days: int = 7,
    ) -> EcbDailyPair:
        if not isinstance(bucket_date, date):
            raise FxContractError("bucket_date must be a date")
        if (
            isinstance(max_carry_days, bool)
            or not isinstance(max_carry_days, int)
            or max_carry_days < 0
        ):
            raise FxContractError("max_carry_days must be a non-negative integer")
        cache_key = (bucket_date, max_carry_days)
        if known_at is None:
            cached = self._unbounded_knowledge_cache.get(cache_key)
            if cached is not None:
                return cached

        start_index = bisect_right(self._dates, bucket_date) - 1
        for date_index in range(start_index, -1, -1):
            event_date = self._dates[date_index]
            carry_days = (bucket_date - event_date).days
            if carry_days > max_carry_days:
                break
            cny = self._visible_leg(event_date, "CNY", known_at)
            usd = self._visible_leg(event_date, "USD", known_at)
            if cny is not None and usd is not None:
                pair = EcbDailyPair(event_date, cny, usd, carry_days)
                if known_at is None:
                    self._unbounded_knowledge_cache[cache_key] = pair
                return pair
        raise FxContractError("no complete non-future ECB pair within carry bound")


__all__ = [
    "ECB_CROSS_POLICY_VERSION",
    "EcbDailyPair",
    "EcbRateBook",
    "EcbReferenceLeg",
    "FxContractError",
    "load_ecb_vintage_csv",
    "merge_reference_legs",
]
