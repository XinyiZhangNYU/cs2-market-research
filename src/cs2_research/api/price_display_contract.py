"""Pure publication projection and fail-closed price document decoding.

There are no repository, live-source or transport dependencies here. A later
publisher must verify admission, slot evidence and catalog membership before
calling the projector; parsing a Mapping alone grants no publication authority.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from cs2_research.api.price_display_models import (
    PriceMemberBinding, after_order_key, analysis_unit_id, decode_history_cursor,
    encode_history_cursor, item_id, price_event_at, public_document_hash,
    public_quote_id, quote_order_key,
)
from cs2_research.api.price_display_schema import (
    PRICE_API_CODE, PRICE_API_VERSION, strict_json_document, validate_shape,
)
from cs2_research.canonical import canonical_json_bytes, utc_timestamp_text
from cs2_research.fx.price_display import (
    PRICE_CONVERSION_POLICY, NativePrice, PriceValueError, project_amounts, validate_amounts,
)
from cs2_research.fx.price_display_context import (
    FrozenHistoricalPrice, PriceFxContext, PriceFxSelection, instant,
)


_SOURCE_CLOCKS = ("bucket_at", "observed_at", "source_updated_at", "source_collected_at")
_ERRORS = {
    "INVALID_ARGUMENT": (400, False), "INVALID_CURSOR": (400, False),
    "NOT_FOUND": (404, False), "CONTRACT_UNAVAILABLE": (503, True),
    "RECORD_CORRUPT": (503, False), "BACKEND_UNAVAILABLE": (503, True),
}


def validate_snapshot(snapshot: dict[str, Any], *, known_at: str) -> None:
    validate_shape(snapshot, "snapshot")
    known = instant(known_at)
    available = instant(snapshot["available_at"])
    if snapshot["snapshot_id"] == snapshot["catalog_snapshot_id"]:
        raise PriceValueError("SNAPSHOT_NAMESPACE_BINDING")
    if (
        instant(snapshot["published_at"]) > available
        or instant(snapshot["catalog_available_at"]) > available or available > known
    ):
        raise PriceValueError("SNAPSHOT_KNOWLEDGE_CLOCK")


def validate_quote(
    quote: dict[str, Any], *, kind: str, market_as_of: str, known_at: str,
) -> None:
    validate_shape(quote, "quote")
    if quote["quote_id"] != public_quote_id(quote):
        raise PriceValueError("QUOTE_HASH")
    analysis_unit_id(quote["analysis_unit_id"])
    item_id(quote["item_id"])
    if kind not in ("CURRENT", "HISTORY"):
        raise PriceValueError("INVALID_SNAPSHOT_KIND")
    available = instant(quote["available_at"])
    source_available = instant(quote["source_available_at"])
    if (
        available > instant(known_at) or source_available > available
        or instant(quote["identity_available_at"]) > available
    ):
        raise PriceValueError("QUOTE_KNOWLEDGE_CLOCK")
    for clock in _SOURCE_CLOCKS:
        value = quote[clock]
        if value is not None and instant(value) > source_available:
            raise PriceValueError("SOURCE_KNOWLEDGE_CLOCK")
    event = price_event_at(quote)
    expected_basis = "BUCKET_AT" if quote["bucket_at"] is not None else (
        "OBSERVED_AT" if quote["observed_at"] is not None else "UNAVAILABLE"
    )
    if quote["time_basis"] != expected_basis:
        raise PriceValueError("TIME_BASIS")
    if event is None:
        if kind != "CURRENT":
            raise PriceValueError("HISTORY_EVENT_TIME_REQUIRED")
    elif instant(event) > instant(market_as_of):
        raise PriceValueError("QUOTE_MARKET_AS_OF")
    source_price = None if quote["source_price"] is None else NativePrice.from_document(quote["source_price"])
    fx = None if quote["fx"] is None else PriceFxContext.from_document(quote["fx"])
    if fx is not None:
        if event is None or source_price is None:
            raise PriceValueError("FX_INPUT_BINDING")
        fx.validate_binding(quote_date=instant(event).date(), known_at=instant(known_at))
        if instant(fx.available_at) > available:
            raise PriceValueError("FX_KNOWLEDGE_CLOCK")
    validate_amounts(
        source_price, quote["amounts"], cny_per_usd=None if fx is None else fx.cny_per_usd,
        source_price_reason=quote["source_price_reason"],
        conversion_policy=PRICE_CONVERSION_POLICY if fx is None else fx.conversion_policy_version,
    )
    if event is None and source_price is not None:
        target = quote["amounts"]["CNY" if source_price.currency == "USD" else "USD"]
        if target["reason"] != "NO_ELIGIBLE_FX":
            raise PriceValueError("UNKNOWN_EVENT_FX_REASON")


def project_quote(
    *, binding: PriceMemberBinding, source: dict[str, Any], quote_kind: str,
    source_price: NativePrice | None, source_price_reason: str | None,
    bucket_at: str | None, observed_at: str | None,
    source_updated_at: str | None, source_collected_at: str | None,
    source_available_at: str, published_at: str, known_at: str,
    kind: str, market_as_of: str, current_slot_at: str | None = None,
    fx_selection: PriceFxSelection | None = None,
    frozen_history: FrozenHistoricalPrice | None = None,
) -> dict[str, Any]:
    """Project admitted inputs without reading a clock, source, file or DB.

    ``current_slot_at`` must come from independently verified exact slot
    membership, not a guessed fetch timestamp. This pure interface deliberately
    has no API write route and does not pretend to verify source admission.
    """
    if not isinstance(binding, PriceMemberBinding):
        raise PriceValueError("INVALID_MEMBER_BINDING")
    if kind == "CURRENT":
        if current_slot_at is None or current_slot_at != market_as_of:
            raise PriceValueError("CURRENT_SLOT_MEMBERSHIP_REQUIRED")
    elif kind != "HISTORY" or current_slot_at is not None:
        raise PriceValueError("INVALID_PUBLICATION_KIND")
    instant(market_as_of)
    event = bucket_at if bucket_at is not None else observed_at
    if event is None and kind == "HISTORY":
        raise PriceValueError("HISTORY_EVENT_TIME_REQUIRED")
    availability = [instant(source_available_at), instant(binding.identity_available_at), instant(published_at)]
    if frozen_history is not None:
        if (
            not isinstance(frozen_history, FrozenHistoricalPrice) or fx_selection is not None
            or source_price != frozen_history.native or source_price_reason is not None
        ):
            raise PriceValueError("FROZEN_HISTORY_INPUT_BINDING")
        derived_at = instant(frozen_history.derived_available_at)
        if derived_at < instant(source_available_at):
            raise PriceValueError("HISTORY_KNOWLEDGE_CLOCK")
        availability.append(derived_at)
        fx = frozen_history.fx
        amounts = frozen_history.amounts()
    else:
        selection = fx_selection or PriceFxSelection(None, "NO_ELIGIBLE_FX")
        if not isinstance(selection, PriceFxSelection):
            raise PriceValueError("INVALID_FX_SELECTION")
        fx = selection.context
        if fx is not None and fx.conversion_policy_version != PRICE_CONVERSION_POLICY:
            # A policy label alone is not evidence of a retained historical
            # value. Legacy projection must provide FrozenHistoricalPrice.
            raise PriceValueError("FROZEN_HISTORY_INPUT_REQUIRED")
        amounts = project_amounts(
            source_price, cny_per_usd=None if fx is None else fx.cny_per_usd,
            fx_unavailable_reason=selection.reason or "NO_ELIGIBLE_FX",
            source_price_reason=source_price_reason,
        )
    if fx is not None:
        availability.append(instant(fx.available_at))
    quote = {
        "analysis_unit_id": binding.analysis_unit_id, "item_id": binding.item_id,
        "quote_kind": quote_kind, "source": deepcopy(source),
        "bucket_at": bucket_at, "observed_at": observed_at,
        "time_basis": "BUCKET_AT" if bucket_at is not None else ("OBSERVED_AT" if observed_at is not None else "UNAVAILABLE"),
        "source_updated_at": source_updated_at, "source_collected_at": source_collected_at,
        "source_available_at": source_available_at, "identity_available_at": binding.identity_available_at,
        "identity_policy": binding.identity_policy, "late_bound": binding.late_bound,
        "source_price": None if source_price is None else source_price.to_document(),
        "source_price_reason": source_price_reason,
        "amounts": {currency: value.to_document() for currency, value in amounts.items()},
        "fx": None if fx is None else fx.to_document(),
        "available_at": utc_timestamp_text(max(availability)),
    }
    quote["quote_id"] = public_quote_id(quote)
    validate_quote(quote, kind=kind, market_as_of=market_as_of, known_at=known_at)
    return quote


def _validate_catalog_binding(snapshot: dict[str, Any], expected_catalog: dict[str, str] | None) -> None:
    if expected_catalog is None:
        return
    actual = {"snapshot_id": snapshot["catalog_snapshot_id"], "as_of": snapshot["catalog_as_of"], "available_at": snapshot["catalog_available_at"]}
    if actual != expected_catalog:
        raise PriceValueError("CATALOG_BINDING")


def decode_price_document(
    payload: bytes | str, *, expected_query: dict[str, Any] | None = None,
    expected_kind: str | None = None, expected_snapshot: dict[str, Any] | None = None,
    expected_catalog: dict[str, str] | None = None, expected_item_id: str | None = None,
    http_status: int | None = None, etag: str | None = None,
) -> dict[str, Any]:
    document = strict_json_document(payload)
    validate_shape(document)
    if document["document_hash"] != public_document_hash(document):
        raise PriceValueError("DOCUMENT_HASH")
    if etag is not None and etag != '"' + document["document_hash"] + '"':
        raise PriceValueError("ETAG_BINDING")
    if document["response_kind"] == "ERROR":
        if http_status is not None and http_status != document["error"]["http_status"]:
            raise PriceValueError("HTTP_STATUS_BINDING")
        return document
    if http_status is not None and http_status != 200:
        raise PriceValueError("HTTP_STATUS_BINDING")
    if expected_kind is not None and document["response_kind"] != expected_kind:
        raise PriceValueError("RESPONSE_KIND_BINDING")
    query = document["query"]
    if expected_query is not None and query != expected_query:
        raise PriceValueError("QUERY_BINDING")
    items = document["items"]
    if document["response_kind"] == "PRICE_SNAPSHOT_LIST":
        if len(items) > query["page_size"] or document["pagination"]["page_size"] != query["page_size"]:
            raise PriceValueError("PAGINATION_BINDING")
        seen: set[str] = set()
        previous = None
        for snapshot in items:
            validate_snapshot(snapshot, known_at=query["known_at"])
            _validate_catalog_binding(snapshot, expected_catalog)
            if (snapshot["kind"] != query["kind"] or snapshot["catalog_snapshot_id"] != query["catalog_snapshot_id"]
                or instant(snapshot["market_as_of"]) > instant(query["query_as_of"])):
                raise PriceValueError("SNAPSHOT_QUERY_BINDING")
            key = (snapshot["market_as_of"], snapshot["available_at"])
            if snapshot["snapshot_id"] in seen or (previous is not None and (
                key > previous[:2] or (key == previous[:2] and snapshot["snapshot_id"] <= previous[2])
            )):
                raise PriceValueError("SNAPSHOT_ORDER")
            seen.add(snapshot["snapshot_id"])
            previous = (*key, snapshot["snapshot_id"])
        return document
    analysis_unit_id(query["analysis_unit_id"])
    snapshot = document["snapshot"]
    validate_snapshot(snapshot, known_at=query["known_at"])
    _validate_catalog_binding(snapshot, expected_catalog)
    if expected_snapshot is not None and snapshot != expected_snapshot:
        raise PriceValueError("SNAPSHOT_BINDING")
    if query["snapshot_id"] != snapshot["snapshot_id"] or query["as_of"] != snapshot["market_as_of"]:
        raise PriceValueError("SNAPSHOT_QUERY_BINDING")
    is_history = document["response_kind"] == "PRICE_HISTORY"
    prior_after = decode_history_cursor(query) if is_history else None
    previous_order = None if prior_after is None else after_order_key(prior_after)
    seen_ids: set[str] = set()
    seen_sources: set[tuple[Any, ...]] = set()
    bound_item_id = expected_item_id
    for quote in items:
        validate_quote(quote, kind=snapshot["kind"], market_as_of=snapshot["market_as_of"], known_at=query["known_at"])
        if quote["analysis_unit_id"] != query["analysis_unit_id"]:
            raise PriceValueError("ANALYSIS_UNIT_BINDING")
        if bound_item_id is None:
            bound_item_id = quote["item_id"]
        if quote["item_id"] != bound_item_id:
            raise PriceValueError("ITEM_BINDING")
        if not instant(snapshot["published_at"]) <= instant(quote["available_at"]) <= instant(snapshot["available_at"]):
            raise PriceValueError("PUBLICATION_KNOWLEDGE_CLOCK")
        order = quote_order_key(quote)
        if quote["quote_id"] in seen_ids or (previous_order is not None and order <= previous_order):
            raise PriceValueError("QUOTE_ORDER")
        seen_ids.add(quote["quote_id"])
        previous_order = order
        source = quote["source"]
        source_key = (source["quote_origin"], source["logical_market"], quote["quote_kind"])
        if is_history:
            event = price_event_at(quote)
            if event is None or not instant(query["from"]) <= instant(event) < instant(query["to"]):
                raise PriceValueError("HISTORY_RANGE_BINDING")
            source_key = (event, *source_key)
            for name in ("quote_origin", "logical_market", "quote_kind"):
                actual = quote[name] if name == "quote_kind" else source[name]
                if query[name] is not None and query[name] != actual:
                    raise PriceValueError("SOURCE_FILTER_BINDING")
        if source_key in seen_sources:
            raise PriceValueError("DUPLICATE_LOGICAL_SOURCE")
        seen_sources.add(source_key)
    if is_history:
        page = document["pagination"]
        if len(items) > query["page_size"] or page["page_size"] != query["page_size"]:
            raise PriceValueError("PAGINATION_BINDING")
        if page["next_cursor"] is not None and (
            not items or page["next_cursor"] != encode_history_cursor(query, items[-1])
            or page["next_cursor"] == query["cursor"]
        ):
            raise PriceValueError("NEXT_CURSOR_BINDING")
    return document


def seal_price_document(document: dict[str, Any]) -> dict[str, Any]:
    """Finalize a public document only after full Schema and semantic checks."""
    result = deepcopy(document)
    result["document_hash"] = public_document_hash(result)
    return decode_price_document(canonical_json_bytes(result))


def price_error_document(code: str) -> dict[str, Any]:
    if code not in _ERRORS:
        raise PriceValueError("INVALID_ERROR_CODE")
    http_status, retryable = _ERRORS[code]
    return seal_price_document({
        "api_contract": PRICE_API_CODE, "api_version": PRICE_API_VERSION, "response_kind": "ERROR",
        "query": None, "snapshot": None, "items": [], "pagination": None,
        "error": {"code": code, "http_status": http_status, "retryable": retryable},
    })
