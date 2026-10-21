"""Strict, root-relative transport parser for the frozen price routes."""

from __future__ import annotations

import re
from typing import Any, Callable, ContextManager
from urllib.parse import parse_qs

from .price_display import PRICE_API_PREFIX, PriceDisplayApiError, PriceDisplayService
from .price_display_models import PriceHistoryQuery, PriceItemQuery, PriceSnapshotQuery, decode_analysis_unit_token


def _parameters(raw: str, allowed: set[str]) -> dict[str, str]:
    if re.search(r"%(?![0-9a-fA-F]{2})", raw):
        raise PriceDisplayApiError("INVALID_ARGUMENT")
    try:
        fields = parse_qs(raw, keep_blank_values=True, strict_parsing=True, encoding="utf-8", errors="strict", max_num_fields=16)
        if not set(fields) <= allowed or any(len(v) != 1 or v[0] == "" or any(ord(c) < 32 or ord(c) == 127 for c in v[0]) for v in fields.values()):
            raise ValueError
        return {key: value[0] for key, value in fields.items()}
    except (ValueError, UnicodeError):
        raise PriceDisplayApiError("INVALID_ARGUMENT") from None


def _page(value: str | None, default: int, maximum: int) -> int:
    if value is None:
        return default
    if not re.fullmatch(r"[1-9][0-9]{0,2}", value) or int(value) > maximum:
        raise PriceDisplayApiError("INVALID_ARGUMENT")
    return int(value)


def dispatch_price(
    factory: Callable[[], ContextManager[PriceDisplayService]] | None,
    path: str, raw_query: str,
) -> dict[str, Any]:
    try:
        if path == PRICE_API_PREFIX + "snapshots":
            p = _parameters(raw_query, {"query_as_of", "known_at", "catalog_snapshot_id", "kind", "page_size", "sort"})
            query = PriceSnapshotQuery(p["query_as_of"], p["known_at"], p["catalog_snapshot_id"], p["kind"], _page(p.get("page_size"), 20, 20), p.get("sort", "MARKET_AS_OF_DESC"))
            operation = "snapshots"
        elif path.startswith(PRICE_API_PREFIX + "items/"):
            parts = path.removeprefix(PRICE_API_PREFIX + "items/").split("/")
            if len(parts) not in {1, 2} or (len(parts) == 2 and parts[1] != "history"):
                raise PriceDisplayApiError("NOT_FOUND")
            unit = decode_analysis_unit_token(parts[0])
            if len(parts) == 1:
                p = _parameters(raw_query, {"snapshot_id", "as_of", "known_at"})
                query = PriceItemQuery(unit, p["snapshot_id"], p["as_of"], p["known_at"])
                operation = "item"
            else:
                p = _parameters(raw_query, {"snapshot_id", "as_of", "known_at", "from", "to", "quote_origin", "logical_market", "quote_kind", "page_size", "cursor", "sort"})
                query = PriceHistoryQuery(unit, p["snapshot_id"], p["as_of"], p["known_at"], p["from"], p["to"],
                    quote_origin=p.get("quote_origin"), logical_market=p.get("logical_market"), quote_kind=p.get("quote_kind"),
                    page_size=_page(p.get("page_size"), 100, 200), cursor=p.get("cursor"), sort=p.get("sort", "EVENT_SOURCE_QUOTE_ID_ASC"))
                operation = "history"
        else:
            raise PriceDisplayApiError("NOT_FOUND")
    except PriceDisplayApiError:
        raise
    except (ValueError, TypeError, KeyError):
        raise PriceDisplayApiError("INVALID_ARGUMENT") from None
    if factory is None:
        raise PriceDisplayApiError("CONTRACT_UNAVAILABLE")
    try:
        with factory() as service:
            return getattr(service, operation)(query)
    except PriceDisplayApiError:
        raise
    except Exception:
        raise PriceDisplayApiError("BACKEND_UNAVAILABLE") from None
