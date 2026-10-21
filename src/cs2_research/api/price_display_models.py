"""Pure price-query, transport-token and public identity models.

An analysis-unit token is a reversible transport encoding, never a path or an
item ID. A future publisher supplies the separately verified catalog mapping.
"""

from __future__ import annotations

import base64
import binascii
import re
from dataclasses import asdict, dataclass
from datetime import timedelta
from typing import Any

from cs2_research.api.price_display_schema import (
    PRICE_API_CODE, PRICE_API_VERSION, strict_json_document, validate_shape,
)
from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.fx.price_display import BIGINT_MAX, PriceValueError, exact_fields
from cs2_research.fx.price_display_context import instant


MAX_ANALYSIS_UNIT_BYTES = 1024
MAX_ANALYSIS_UNIT_TOKEN = 1366
MAX_CURSOR_LENGTH = 8192
_TOKEN = re.compile(r"[A-Za-z0-9_-]+\Z")
_ITEM_ID = re.compile(r"[1-9][0-9]{0,18}\Z")
_HASH = re.compile(r"[0-9a-f]{64}\Z")


def analysis_unit_id(value: object) -> str:
    if not isinstance(value, str) or not 1 <= len(value) <= 256:
        raise PriceValueError("INVALID_ANALYSIS_UNIT_ID")
    if any(ord(c) < 32 or ord(c) == 127 or 0xD800 <= ord(c) <= 0xDFFF for c in value):
        raise PriceValueError("INVALID_ANALYSIS_UNIT_ID")
    if len(value.encode("utf-8")) > MAX_ANALYSIS_UNIT_BYTES:
        raise PriceValueError("INVALID_ANALYSIS_UNIT_ID")
    return value  # No trim, Unicode normalization, case folding or splitting.


def item_id(value: object) -> str:
    if not isinstance(value, str) or not _ITEM_ID.fullmatch(value) or int(value) > BIGINT_MAX:
        raise PriceValueError("INVALID_ITEM_ID")
    return value


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _unb64(token: object, maximum: int, error: str) -> bytes:
    if not isinstance(token, str) or not 1 <= len(token) <= maximum or not _TOKEN.fullmatch(token):
        raise PriceValueError(error)
    try:
        raw = base64.b64decode(token + "=" * (-len(token) % 4), altchars=b"-_", validate=True)
    except (binascii.Error, ValueError):
        raise PriceValueError(error) from None
    if _b64(raw) != token:
        raise PriceValueError(error)
    return raw


def encode_analysis_unit_token(value: str) -> str:
    return _b64(analysis_unit_id(value).encode("utf-8"))


def decode_analysis_unit_token(token: str) -> str:
    raw = _unb64(token, MAX_ANALYSIS_UNIT_TOKEN, "INVALID_ANALYSIS_UNIT_TOKEN")
    if not 1 <= len(raw) <= MAX_ANALYSIS_UNIT_BYTES:
        raise PriceValueError("INVALID_ANALYSIS_UNIT_TOKEN")
    try:
        return analysis_unit_id(raw.decode("utf-8"))
    except (UnicodeError, PriceValueError):
        raise PriceValueError("INVALID_ANALYSIS_UNIT_TOKEN") from None


@dataclass(frozen=True, slots=True)
class PriceSnapshotQuery:
    query_as_of: str
    known_at: str
    catalog_snapshot_id: str
    kind: str
    page_size: int = 20
    sort: str = "MARKET_AS_OF_DESC"

    def __post_init__(self) -> None:
        validate_shape(self.to_document(), "snapshotQuery")

    def to_document(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True, slots=True)
class PriceItemQuery:
    analysis_unit_id: str
    snapshot_id: str
    as_of: str
    known_at: str

    def __post_init__(self) -> None:
        validate_shape(self.to_document(), "itemQuery")
        analysis_unit_id(self.analysis_unit_id)

    def to_document(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True, slots=True)
class PriceHistoryQuery:
    analysis_unit_id: str
    snapshot_id: str
    as_of: str
    known_at: str
    from_at: str
    to_at: str
    quote_origin: str | None = None
    logical_market: str | None = None
    quote_kind: str | None = None
    page_size: int = 100
    cursor: str | None = None
    sort: str = "EVENT_SOURCE_QUOTE_ID_ASC"

    def __post_init__(self) -> None:
        validate_history_query(self.to_document())

    def to_document(self) -> dict[str, Any]:
        document = asdict(self)
        document["from"] = document.pop("from_at")
        document["to"] = document.pop("to_at")
        return document


def validate_history_query(query: dict[str, Any]) -> None:
    validate_shape(query, "historyQuery")
    analysis_unit_id(query["analysis_unit_id"])
    duration = instant(query["to"]) - instant(query["from"])
    if duration <= timedelta(0) or duration > timedelta(days=366):
        raise PriceValueError("INVALID_HISTORY_RANGE")
    if query["quote_origin"] == "PROVIDER_AGGREGATE" and query["logical_market"] is not None:
        raise PriceValueError("INVALID_SOURCE_FILTER")


def price_event_at(quote: dict[str, Any]) -> str | None:
    return quote["bucket_at"] if quote["bucket_at"] is not None else quote["observed_at"]


def quote_order_key(quote: dict[str, Any]) -> tuple[bool, str, str, str, str, str]:
    value = price_event_at(quote)
    source = quote["source"]
    return (
        value is None, value or "", source["quote_origin"], source["logical_market"] or "",
        quote["quote_kind"], quote["quote_id"],
    )


def _after(quote: dict[str, Any]) -> dict[str, Any]:
    return {
        "event_at": price_event_at(quote), "quote_origin": quote["source"]["quote_origin"],
        "logical_market": quote["source"]["logical_market"],
        "quote_kind": quote["quote_kind"], "quote_id": quote["quote_id"],
    }


def after_order_key(after: dict[str, Any]) -> tuple[bool, str, str, str, str, str]:
    return (False, after["event_at"], after["quote_origin"], after["logical_market"] or "", after["quote_kind"], after["quote_id"])


def encode_history_cursor(query: dict[str, Any], last_quote: dict[str, Any]) -> str:
    validate_history_query(query)
    value = _after(last_quote)
    if value["event_at"] is None:
        raise PriceValueError("INVALID_CURSOR")
    token = _b64(canonical_json_bytes({
        "api_contract": PRICE_API_CODE, "api_version": PRICE_API_VERSION,
        "query": dict(query, cursor=None), "after": value,
    }))
    decode_history_cursor(dict(query, cursor=token))
    return token


def decode_history_cursor(query: dict[str, Any]) -> dict[str, Any] | None:
    validate_history_query(query)
    if query["cursor"] is None:
        return None
    try:
        raw = _unb64(query["cursor"], MAX_CURSOR_LENGTH, "INVALID_CURSOR")
        document = strict_json_document(raw)
        exact_fields(document, {"api_contract", "api_version", "query", "after"}, "INVALID_CURSOR")
        if (
            document["api_contract"] != PRICE_API_CODE or document["api_version"] != PRICE_API_VERSION
            or document["query"] != dict(query, cursor=None) or canonical_json_bytes(document) != raw
        ):
            raise PriceValueError("INVALID_CURSOR")
        after = exact_fields(document["after"], {"event_at", "quote_origin", "logical_market", "quote_kind", "quote_id"}, "INVALID_CURSOR")
        event = instant(after["event_at"])
        if not instant(query["from"]) <= event < instant(query["to"]) or event > instant(query["as_of"]):
            raise PriceValueError("INVALID_CURSOR")
        if after["quote_origin"] not in ("SOURCE_QUOTE", "PROVIDER_AGGREGATE") or after["quote_kind"] not in ("ASK", "BID"):
            raise PriceValueError("INVALID_CURSOR")
        if (after["quote_origin"] == "PROVIDER_AGGREGATE" and after["logical_market"] is not None) or (
            after["quote_origin"] == "SOURCE_QUOTE" and after["logical_market"] not in ("market_a", "market_c", "market_b")
        ):
            raise PriceValueError("INVALID_CURSOR")
        if not isinstance(after["quote_id"], str) or not _HASH.fullmatch(after["quote_id"]):
            raise PriceValueError("INVALID_CURSOR")
        for key in ("quote_origin", "logical_market", "quote_kind"):
            if query[key] is not None and query[key] != after[key]:
                raise PriceValueError("INVALID_CURSOR")
        return dict(after)
    except (ValueError, TypeError, KeyError):
        raise PriceValueError("INVALID_CURSOR") from None


def public_document_hash(document: dict[str, Any]) -> str:
    return sha256_hex(canonical_json_bytes({key: value for key, value in document.items() if key != "document_hash"}))


def public_quote_id(quote: dict[str, Any]) -> str:
    return sha256_hex(canonical_json_bytes({key: value for key, value in quote.items() if key != "quote_id"}))


@dataclass(frozen=True, slots=True)
class PriceMemberBinding:
    """Publisher-verified mapping, not a caller-controlled public write DTO."""

    analysis_unit_id: str
    item_id: str
    identity_available_at: str
    identity_policy: str = "CATALOG_SNAPSHOT_EXACT_ITEM_V1"
    late_bound: bool = False

    def __post_init__(self) -> None:
        analysis_unit_id(self.analysis_unit_id)
        item_id(self.item_id)
        instant(self.identity_available_at)
        if self.identity_policy not in ("CATALOG_SNAPSHOT_EXACT_ITEM_V1", "CURRENT_EXACT_MHN_LATE_BIND_V1"):
            raise PriceValueError("INVALID_IDENTITY_POLICY")
        if type(self.late_bound) is not bool or self.late_bound != (self.identity_policy == "CURRENT_EXACT_MHN_LATE_BIND_V1"):
            raise PriceValueError("IDENTITY_POLICY_BINDING")
