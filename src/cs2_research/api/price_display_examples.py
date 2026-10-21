"""Deterministic synthetic public price documents; not source data/admission."""

from __future__ import annotations

from copy import deepcopy
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any

from cs2_research.api.price_display_contract import project_quote, price_error_document, seal_price_document
from cs2_research.api.price_display_models import (
    PriceHistoryQuery, PriceItemQuery, PriceMemberBinding, PriceSnapshotQuery,
    encode_history_cursor, public_document_hash, public_quote_id, quote_order_key,
)
from cs2_research.api.price_display_schema import PRICE_API_CODE, PRICE_API_VERSION, PRICE_POLICY_VERSION
from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.fx.ecb import EcbRateBook, EcbReferenceLeg
from cs2_research.fx.price_display import NativePrice
from cs2_research.fx.price_display_context import FrozenHistoricalPrice, PriceFxContext, PriceFxSelection, instant


SYNTHETIC_UNIT = "fixture:价格/./\\:e\u0301"
SYNTHETIC_ITEM = "9007199254740993"
MARKET_AS_OF = "2026-08-30T12:00:00.000000Z"
PUBLISHED_AT = "2026-09-03T00:00:00.000000Z"
KNOWN_AT = "2026-09-03T01:00:00.000000Z"
SOURCE_AVAILABLE = "2026-08-29T00:00:00.000000Z"


def synthetic_snapshot(kind: str = "CURRENT", *, tag: str = "main") -> dict[str, Any]:
    # Fixture IDs identify synthetic public content, not a private import/run.
    return {
        "snapshot_id": sha256_hex(canonical_json_bytes({"synthetic_price": kind, "tag": tag})),
        "catalog_snapshot_id": sha256_hex(canonical_json_bytes({"synthetic_catalog": "price-contract-only"})),
        "catalog_as_of": "2026-08-27T00:00:00.000000Z",
        "catalog_available_at": "2026-09-02T00:00:00.000000Z",
        "market_as_of": MARKET_AS_OF, "available_at": PUBLISHED_AT,
        "published_at": PUBLISHED_AT, "kind": kind, "price_policy_version": PRICE_POLICY_VERSION,
    }


def synthetic_fx(day: str, *, historical: bool = False) -> PriceFxContext:
    legs = tuple(EcbReferenceLeg(
        date(2026, 8, 28), currency, Decimal(value),
        datetime(2026, 8, 28, 14, tzinfo=UTC), None,
        datetime(2026, 8, 29, tzinfo=UTC), marker * 64,
    ) for currency, value, marker in (("CNY", "8.4", "1"), ("USD", "1.25", "2")))
    day_value = date.fromisoformat(day)
    pair = EcbRateBook(legs).select(day_value, known_at=instant(KNOWN_AT))
    return PriceFxContext.from_pair(
        pair, quote_date=day_value, known_at=instant(KNOWN_AT),
        conversion_policy="ecb-eur-cross-daily/2" if historical else "price-display-bicurrency/1",
    )


def synthetic_quote(
    *, market: str | None = "market_a", quote_kind: str = "ASK", value: str | None = "10.00000000",
    currency: str = "USD", event_at: str | None = "2026-08-28T12:00:00.000000Z",
    kind: str = "CURRENT", missing_reason: str | None = None, fx_reason: str | None = None,
    legacy_minor: int | None = None,
) -> dict[str, Any]:
    source_price = None if value is None else NativePrice(value, currency, "USD_DECIMAL" if currency == "USD" else "CNY_MINOR", 8 if currency == "USD" else 0)
    binding = PriceMemberBinding(
        SYNTHETIC_UNIT, SYNTHETIC_ITEM, "2026-09-02T00:00:00.000000Z",
        "CURRENT_EXACT_MHN_LATE_BIND_V1" if kind == "HISTORY" else "CATALOG_SNAPSHOT_EXACT_ITEM_V1",
        kind == "HISTORY",
    )
    fx = None
    if event_at is not None and source_price is not None and fx_reason is None:
        fx = synthetic_fx(event_at[:10], historical=legacy_minor is not None)
    frozen = None if legacy_minor is None else FrozenHistoricalPrice(source_price, legacy_minor, fx, "2026-08-30T13:00:00.000000Z")
    source_available = SOURCE_AVAILABLE if event_at is None else max(SOURCE_AVAILABLE, event_at)
    return project_quote(
        binding=binding,
        source={"quote_origin": "PROVIDER_AGGREGATE" if market is None else "SOURCE_QUOTE", "logical_market": market, "transport": "market_b_direct" if currency == "CNY" else "upstream"},
        quote_kind=quote_kind, source_price=source_price, source_price_reason=missing_reason,
        bucket_at=event_at, observed_at=event_at, source_updated_at=None, source_collected_at=None,
        source_available_at=source_available, published_at=PUBLISHED_AT, known_at=KNOWN_AT,
        kind=kind, market_as_of=MARKET_AS_OF, current_slot_at=MARKET_AS_OF if kind == "CURRENT" else None,
        fx_selection=None if frozen is not None else PriceFxSelection(fx, None if fx is not None else (fx_reason or "NO_ELIGIBLE_FX")),
        frozen_history=frozen,
    )


def envelope(kind: str, query: dict[str, Any], snapshot: dict[str, Any] | None, items: list[dict[str, Any]], pagination: dict[str, Any] | None) -> dict[str, Any]:
    return seal_price_document({
        "api_contract": PRICE_API_CODE, "api_version": PRICE_API_VERSION,
        "response_kind": kind, "query": query, "snapshot": snapshot,
        "items": items, "pagination": pagination,
    })


def build_price_display_examples() -> dict[str, dict[str, Any]]:
    current = synthetic_snapshot()
    historical = synthetic_snapshot("HISTORY")
    item_query = PriceItemQuery(SYNTHETIC_UNIT, current["snapshot_id"], MARKET_AS_OF, KNOWN_AT).to_document()
    rows = sorted([
        synthetic_quote(),
        synthetic_quote(market="market_a", quote_kind="BID", value="0.00000000", event_at=None),
        synthetic_quote(market="market_c", value="0.00000001"),
        synthetic_quote(market="market_c", quote_kind="BID", value=None, missing_reason="SOURCE_UNAVAILABLE"),
        synthetic_quote(market="market_b", value="9223372036854775807", currency="CNY"),
        synthetic_quote(market="market_b", quote_kind="BID", value=None, missing_reason="SOURCE_CONFLICT"),
    ], key=quote_order_key)
    history_rows = sorted([
        synthetic_quote(kind="HISTORY", legacy_minor=6720),
        synthetic_quote(kind="HISTORY", market="market_b", quote_kind="BID", value="1344", currency="CNY", event_at="2026-08-29T12:00:00.000000Z"),
        synthetic_quote(kind="HISTORY", market=None, value="15.00000000", event_at="2026-08-30T12:00:00.000000Z", legacy_minor=10080),
    ], key=quote_order_key)
    hq = PriceHistoryQuery(SYNTHETIC_UNIT, historical["snapshot_id"], MARKET_AS_OF, KNOWN_AT, "2026-08-28T00:00:00.000000Z", "2026-08-31T00:00:00.000000Z", page_size=2).to_document()
    cursor = encode_history_cursor(hq, history_rows[1])
    old_current = dict(synthetic_snapshot(tag="older"), market_as_of="2026-08-29T12:00:00.000000Z")
    sq = PriceSnapshotQuery(MARKET_AS_OF, KNOWN_AT, current["catalog_snapshot_id"], "CURRENT").to_document()
    hsq = dict(sq, kind="HISTORY")
    documents = {
        "price-display-snapshots.valid.json": envelope("PRICE_SNAPSHOT_LIST", sq, None, [current, old_current], {"page_size": 20, "next_cursor": None}),
        "price-display-snapshots-empty.valid.json": envelope("PRICE_SNAPSHOT_LIST", sq, None, [], {"page_size": 20, "next_cursor": None}),
        "price-display-history-snapshots.valid.json": envelope("PRICE_SNAPSHOT_LIST", hsq, None, [historical], {"page_size": 20, "next_cursor": None}),
        "price-display-item.valid.json": envelope("PRICE_ITEM", item_query, current, rows, None),
        "price-display-item-empty.valid.json": envelope("PRICE_ITEM", item_query, current, [], None),
        "price-display-item-no-fx.valid.json": envelope("PRICE_ITEM", item_query, current, [synthetic_quote(fx_reason="NO_ELIGIBLE_FX")], None),
        "price-display-item-stale-fx.valid.json": envelope("PRICE_ITEM", item_query, current, [synthetic_quote(fx_reason="FX_STALE")], None),
        "price-display-history-page-1.valid.json": envelope("PRICE_HISTORY", hq, historical, history_rows[:2], {"page_size": 2, "next_cursor": cursor}),
        "price-display-history-page-2.valid.json": envelope("PRICE_HISTORY", dict(hq, cursor=cursor), historical, history_rows[2:], {"page_size": 2, "next_cursor": None}),
        "price-display-history-empty.valid.json": envelope("PRICE_HISTORY", dict(hq, **{"from": "2026-08-27T00:00:00.000000Z", "to": "2026-08-28T00:00:00.000000Z"}), historical, [], {"page_size": 2, "next_cursor": None}),
    }
    for code in ("INVALID_ARGUMENT", "INVALID_CURSOR", "NOT_FOUND", "CONTRACT_UNAVAILABLE", "RECORD_CORRUPT", "BACKEND_UNAVAILABLE"):
        documents[f"price-display-error-{code.lower().replace('_', '-')}.valid.json"] = price_error_document(code)
    bad = deepcopy(documents["price-display-item.valid.json"])
    # Hash-consistent but mathematically impossible; the semantic gate must fail.
    bad["items"][0]["amounts"]["CNY"]["amount"] = "0.01"
    bad["items"][0]["quote_id"] = public_quote_id(bad["items"][0])
    bad["document_hash"] = public_document_hash(bad)
    documents["price-display-amount-tamper.invalid.json"] = bad
    bad_fx = deepcopy(documents["price-display-item.valid.json"])
    bad_fx["items"][0]["source_price"]["upstream_fraction_digits"] = -1
    bad_fx["items"][0]["quote_id"] = public_quote_id(bad_fx["items"][0])
    bad_fx["document_hash"] = public_document_hash(bad_fx)
    documents["price-display-negative-precision.invalid.json"] = bad_fx
    return documents
