from __future__ import annotations

import copy
import socket
from dataclasses import replace
from datetime import UTC, date, datetime
from decimal import Decimal

import pytest

from cs2_research.canonical import canonical_json_bytes
from cs2_research.fx.ecb import EcbDailyPair, EcbRateBook, EcbReferenceLeg, FxContractError
from cs2_research.fx.price_display import NativePrice, PriceValueError
from cs2_research.fx.price_display_context import (
    FrozenHistoricalPrice, PriceFxContext, event_date, instant, public_rate_id,
    select_price_fx,
)


@pytest.fixture(autouse=True)
def offline(monkeypatch):
    def reject(*args, **kwargs):
        raise AssertionError("price contract tests may not access a network or database")
    monkeypatch.setattr(socket, "create_connection", reject)
    monkeypatch.setattr(socket.socket, "connect", reject)
    monkeypatch.setattr(socket.socket, "connect_ex", reject)
    import psycopg
    monkeypatch.setattr(psycopg, "connect", reject)


def leg(currency, *, day=date(2026, 8, 28), rate=None):
    return EcbReferenceLeg(
        day, currency, Decimal(rate or ("8.4" if currency == "CNY" else "1.25")),
        datetime(2026, 8, 28, 14, tzinfo=UTC), None,
        datetime(2026, 8, 29, tzinfo=UTC), ("1" if currency == "CNY" else "2") * 64,
    )


def context(*, day=date(2026, 8, 28), policy="price-display-bicurrency/1"):
    book = EcbRateBook((leg("CNY"), leg("USD")))
    known = datetime(2026, 9, 6, tzinfo=UTC)
    return PriceFxContext.from_pair(book.select(day, known_at=known), quote_date=day, known_at=known, conversion_policy=policy)


@pytest.mark.parametrize("day,expected_carry,reason", [
    (date(2026, 8, 28), 0, None), (date(2026, 8, 30), 2, None),
    (date(2026, 9, 4), 7, None), (date(2026, 9, 5), None, "FX_STALE"),
    (date(2026, 8, 27), None, "NO_ELIGIBLE_FX"), (None, None, "NO_ELIGIBLE_FX"),
])
def test_price_event_age_not_wall_clock_age(day, expected_carry, reason):
    selection = select_price_fx(EcbRateBook((leg("CNY"), leg("USD"))), quote_date=day, known_at=datetime(2030, 1, 1, tzinfo=UTC))
    assert selection.reason == reason
    if reason is None:
        assert selection.context.carry_days == expected_carry
        assert selection.context.cny_per_usd == "6.720000000000000000"
    else:
        assert selection.context is None


def test_both_retrieval_clocks_and_validity_must_be_visible():
    original = leg("USD")
    later = replace(original, retrieved_at=datetime(2026, 8, 30, tzinfo=UTC))
    book = EcbRateBook((leg("CNY"), later))
    early = select_price_fx(book, quote_date=date(2026, 8, 28), known_at=datetime(2026, 8, 29, tzinfo=UTC))
    assert early.context is None
    assert early.reason == "NO_ELIGIBLE_FX"
    available = select_price_fx(book, quote_date=date(2026, 8, 28), known_at=later.retrieved_at)
    assert available.context.available_at == "2026-08-30T00:00:00.000000Z"
    expired = replace(original, valid_to=datetime(2026, 8, 30, tzinfo=UTC))
    expired_selection = select_price_fx(EcbRateBook((leg("CNY"), expired)), quote_date=date(2026, 8, 28), known_at=expired.valid_to)
    assert expired_selection.context is None
    with pytest.raises(PriceValueError, match="FX_FUTURE_KNOWLEDGE"):
        PriceFxContext.from_pair(EcbDailyPair(date(2026, 8, 28), leg("CNY"), expired, 0), quote_date=date(2026, 8, 28), known_at=expired.valid_to)


def test_incomplete_or_different_date_pair_has_no_rate():
    for legs in ((leg("CNY"),), (leg("CNY"), leg("USD", day=date(2026, 8, 29)))):
        selected = select_price_fx(EcbRateBook(legs), quote_date=date(2026, 8, 30), known_at=datetime(2026, 9, 3, tzinfo=UTC))
        assert selected.reason == "NO_ELIGIBLE_FX"
    with pytest.raises(FxContractError):
        EcbDailyPair(date(2026, 8, 28), leg("CNY"), leg("USD", day=date(2026, 8, 29)), 0)


def test_public_rate_hash_excludes_carry_and_private_identity_but_not_content():
    a = context()
    b = context(day=date(2026, 8, 30))
    assert a.public_rate_id == b.public_rate_id
    assert a.carry_days != b.carry_days
    assert b"evidence_sha256" not in canonical_json_bytes(a.to_document())
    assert b"revision_hash" not in canonical_json_bytes(a.to_document())
    changed = a.to_document()
    changed["cny_per_usd"] = "7.000000000000000000"
    with pytest.raises(PriceValueError, match="PUBLIC_RATE_HASH"):
        PriceFxContext.from_document(changed)
    changed["public_rate_id"] = public_rate_id(changed)
    assert PriceFxContext.from_document(changed).public_rate_id != a.public_rate_id


@pytest.mark.parametrize("field,value", [
    ("authority", "OTHER"), ("cny_per_usd", "6.72000000"), ("carry_days", 8),
    ("carry_days", True), ("usage", "TRADING"), ("conversion_policy_version", "widget/1"),
    ("source_event_date", "2026-02-30"), ("available_at", "2026-08-28T13:00:00.000000Z"),
    ("usd_valid_from", "2026-08-28T14:00:00Z"), ("private_leg_id", "secret"),
])
def test_fx_shape_and_semantics_reject_bad_context(field, value):
    doc = context().to_document()
    doc[field] = value
    doc["public_rate_id"] = public_rate_id(doc)
    with pytest.raises(PriceValueError):
        PriceFxContext.from_document(doc)


def test_date_and_knowledge_binding_remain_required_after_valid_hash():
    fx = context()
    with pytest.raises(PriceValueError, match="FX_DATE_BINDING"):
        fx.validate_binding(quote_date=date(2026, 8, 29), known_at=datetime(2026, 9, 3, tzinfo=UTC))
    with pytest.raises(PriceValueError, match="FX_FUTURE_KNOWLEDGE"):
        fx.validate_binding(quote_date=date(2026, 8, 28), known_at=datetime(2026, 8, 28, tzinfo=UTC))


def test_historical_values_and_policy_never_consult_a_new_vintage():
    old = context(policy="ecb-eur-cross-daily/2")
    source = NativePrice("10.00000000", "USD", "USD_DECIMAL", 8)
    sealed = FrozenHistoricalPrice(source, 6720, old, "2026-08-29T00:00:00.000000Z")
    before = {c: v.to_document() for c, v in sealed.amounts().items()}
    updated = replace(leg("CNY", rate="9.0"), valid_from=datetime(2026, 9, 1, tzinfo=UTC), retrieved_at=datetime(2026, 9, 2, tzinfo=UTC))
    new = select_price_fx(EcbRateBook((leg("CNY"), leg("USD"), updated)), quote_date=date(2026, 8, 28), known_at=datetime(2026, 9, 3, tzinfo=UTC))
    assert new.context.public_rate_id != old.public_rate_id
    assert new.context.cny_per_usd == "7.200000000000000000"
    assert {c: v.to_document() for c, v in sealed.amounts().items()} == before
    assert sealed.fx.conversion_policy_version == "ecb-eur-cross-daily/2"
    assert before["USD"]["amount"] == "10.00000000"
    assert before["CNY"]["amount"] == "67.20"
    with pytest.raises(PriceValueError, match="FROZEN_HISTORY_AMOUNT_MISMATCH"):
        replace(sealed, cny_minor=7200)
    with pytest.raises(PriceValueError, match="HISTORY_KNOWLEDGE_CLOCK"):
        replace(sealed, derived_available_at="2026-08-28T23:59:59.999999Z")


@pytest.mark.parametrize("timestamp", ["2026-09-03T00:00:00Z", "2026-02-30T00:00:00.000000Z", "2026-09-03T00:00:60.000000Z", "2026-09-03T00:00:00.000000+00:00", "2026-09-03T00:00:00.000000Z\n"])
def test_canonical_real_timestamp_only(timestamp):
    with pytest.raises(PriceValueError):
        instant(timestamp)
