"""Read-only service for already published price allowlists.

No source, FX selector or publisher is called by a GET. Repository methods are
deliberately limited to the three public result views and their release signal.
"""

from __future__ import annotations

from typing import Any, Protocol

from cs2_research.api.price_display_contract import (
    price_error_document, seal_price_document, validate_quote, validate_snapshot,
)
from cs2_research.api.price_display_models import (
    PriceHistoryQuery, PriceItemQuery, PriceSnapshotQuery,
    decode_history_cursor, encode_history_cursor, item_id,
)
from cs2_research.api.price_display_schema import PRICE_API_CODE, PRICE_API_VERSION
from cs2_research.fx.price_display import PriceValueError
from cs2_research.fx.price_display_context import instant


PRICE_API_PREFIX = "/api/v1/price-display/"


class PriceDisplayApiError(RuntimeError):
    def __init__(self, code: str) -> None:
        self.code = code
        self._document = price_error_document(code)
        self.http_status = self._document["error"]["http_status"]
        super().__init__(code)

    def to_document(self) -> dict[str, Any]:
        return self._document


class PriceDisplayReadRepository(Protocol):
    def is_published(self) -> bool: ...
    def list_snapshots(self, query: PriceSnapshotQuery) -> list[dict[str, Any]]: ...
    def snapshot(self, snapshot_id: str, known_at: str) -> dict[str, Any] | None: ...
    def member(self, snapshot_id: str, analysis_unit_id: str) -> str | None: ...
    def current_rows(self, query: PriceItemQuery) -> list[dict[str, Any]]: ...
    def history_rows(self, query: PriceHistoryQuery) -> list[dict[str, Any]]: ...


def _document(
    kind: str, query: dict[str, Any], snapshot: dict[str, Any] | None,
    items: list[dict[str, Any]], pagination: dict[str, Any] | None,
) -> dict[str, Any]:
    return seal_price_document({
        "api_contract": PRICE_API_CODE, "api_version": PRICE_API_VERSION,
        "response_kind": kind, "query": query, "snapshot": snapshot,
        "items": items, "pagination": pagination,
    })


class PriceDisplayService:
    def __init__(self, repository: PriceDisplayReadRepository) -> None:
        self._repository = repository

    def _call(self, operation: Any, *args: Any) -> Any:
        try:
            return operation(*args)
        except PriceDisplayApiError:
            raise
        except (PriceValueError, KeyError, TypeError):
            raise PriceDisplayApiError("RECORD_CORRUPT") from None
        except Exception:
            raise PriceDisplayApiError("BACKEND_UNAVAILABLE") from None

    def _ready(self) -> None:
        if self._call(self._repository.is_published) is not True:
            raise PriceDisplayApiError("CONTRACT_UNAVAILABLE")

    def snapshots(self, query: PriceSnapshotQuery) -> dict[str, Any]:
        if not isinstance(query, PriceSnapshotQuery):
            raise PriceDisplayApiError("INVALID_ARGUMENT")
        self._ready()
        snapshots = self._call(self._repository.list_snapshots, query)
        try:
            return _document(
                "PRICE_SNAPSHOT_LIST", query.to_document(), None, snapshots,
                {"page_size": query.page_size, "next_cursor": None},
            )
        except (ValueError, TypeError, KeyError):
            raise PriceDisplayApiError("RECORD_CORRUPT") from None

    def _bound_snapshot(self, query: PriceItemQuery | PriceHistoryQuery, kind: str) -> tuple[dict[str, Any], str]:
        self._ready()
        snapshot = self._call(self._repository.snapshot, query.snapshot_id, query.known_at)
        if snapshot is None:
            raise PriceDisplayApiError("NOT_FOUND")
        try:
            validate_snapshot(snapshot, known_at=query.known_at)
            if snapshot["snapshot_id"] != query.snapshot_id:
                raise PriceValueError("SNAPSHOT_BINDING")
            if snapshot["kind"] != kind:
                raise PriceDisplayApiError("NOT_FOUND")
            if snapshot["market_as_of"] != query.as_of:
                raise PriceDisplayApiError("INVALID_ARGUMENT")
            member_id = self._call(self._repository.member, query.snapshot_id, query.analysis_unit_id)
            if member_id is None:
                raise PriceDisplayApiError("NOT_FOUND")
            return snapshot, item_id(member_id)
        except PriceDisplayApiError:
            raise
        except (ValueError, TypeError, KeyError):
            raise PriceDisplayApiError("RECORD_CORRUPT") from None

    @staticmethod
    def _validate_rows(rows: list[dict[str, Any]], snapshot: dict[str, Any], member_id: str, query: PriceItemQuery | PriceHistoryQuery) -> None:
        for row in rows:
            validate_quote(row, kind=snapshot["kind"], market_as_of=query.as_of, known_at=query.known_at)
            if row["item_id"] != member_id or row["analysis_unit_id"] != query.analysis_unit_id:
                raise PriceValueError("ITEM_BINDING")
            if not instant(snapshot["published_at"]) <= instant(row["available_at"]) <= instant(snapshot["available_at"]):
                raise PriceValueError("PUBLICATION_KNOWLEDGE_CLOCK")

    def item(self, query: PriceItemQuery) -> dict[str, Any]:
        if not isinstance(query, PriceItemQuery):
            raise PriceDisplayApiError("INVALID_ARGUMENT")
        snapshot, member_id = self._bound_snapshot(query, "CURRENT")
        rows = self._call(self._repository.current_rows, query)
        try:
            self._validate_rows(rows, snapshot, member_id, query)
            return _document("PRICE_ITEM", query.to_document(), snapshot, rows, None)
        except (ValueError, TypeError, KeyError):
            raise PriceDisplayApiError("RECORD_CORRUPT") from None

    def history(self, query: PriceHistoryQuery) -> dict[str, Any]:
        if not isinstance(query, PriceHistoryQuery):
            raise PriceDisplayApiError("INVALID_ARGUMENT")
        try:
            decode_history_cursor(query.to_document())
        except (ValueError, TypeError, KeyError):
            raise PriceDisplayApiError("INVALID_CURSOR") from None
        snapshot, member_id = self._bound_snapshot(query, "HISTORY")
        # The repository returns page_size + 1, not a count or full history.
        rows = self._call(self._repository.history_rows, query)
        try:
            if len(rows) > query.page_size + 1:
                raise PriceValueError("PAGINATION_BINDING")
            self._validate_rows(rows, snapshot, member_id, query)
            page = rows[:query.page_size]
            cursor = encode_history_cursor(query.to_document(), page[-1]) if len(rows) > query.page_size else None
            return _document("PRICE_HISTORY", query.to_document(), snapshot, page,
                             {"page_size": query.page_size, "next_cursor": cursor})
        except (ValueError, TypeError, KeyError):
            raise PriceDisplayApiError("RECORD_CORRUPT") from None
