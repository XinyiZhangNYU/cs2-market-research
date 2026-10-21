from __future__ import annotations

import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable, Protocol

import httpx

from cs2_research.canonical import canonical_json_bytes, sha256_hex

from .errors import (
    CredentialUnavailable,
    EnvelopeValidationError,
    PlanningDenied,
    TransportDenied,
    TransportRequestFailed,
)
from .models import FixtureProvenance, RequestPlan
from .rights import verify_plan_integrity


_SAFE_RESPONSE_HEADERS = frozenset(
    {
        "cache-control",
        "content-encoding",
        "content-type",
        "date",
        "etag",
        "last-modified",
        "retry-after",
        "vary",
        "x-ratelimit-limit",
        "x-ratelimit-remaining",
        "x-ratelimit-reset",
    }
)
_RETRYABLE_STATUS_CODES = frozenset({429, 500, 502, 503, 504})


def _require_utc(value: datetime, field: str) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise EnvelopeValidationError(f"{field} must include a UTC offset")
    if value.utcoffset().total_seconds() != 0:
        raise EnvelopeValidationError(f"{field} must use UTC")


@dataclass(frozen=True)
class FetchedEnvelope:
    """Provider-independent bytes returned by exactly one admitted transport call."""

    request_plan_id: str
    source_code: str
    endpoint_code: str
    transport_kind: str
    status_code: int
    headers: tuple[tuple[str, str], ...]
    payload: bytes
    payload_sha256: str
    fetched_at: datetime
    content_type: str
    compression: str = "NONE"
    network_request_count: int = 0
    request_started_at: datetime | None = None

    def __post_init__(self) -> None:
        _require_utc(self.fetched_at, "fetched_at")
        if self.request_started_at is not None:
            _require_utc(self.request_started_at, "request_started_at")
            if self.request_started_at > self.fetched_at:
                raise EnvelopeValidationError(
                    "request_started_at cannot be later than fetched_at"
                )
        if not isinstance(self.payload, bytes):
            raise EnvelopeValidationError("payload must be exact bytes")
        if not self.request_plan_id:
            raise EnvelopeValidationError("request_plan_id must be non-empty")
        if (
            not self.source_code.strip()
            or not self.endpoint_code.strip()
            or not self.transport_kind.strip()
            or not self.content_type.strip()
        ):
            raise EnvelopeValidationError(
                "source, endpoint, transport and content type must be non-empty"
            )
        if not 100 <= self.status_code <= 599:
            raise EnvelopeValidationError("status_code must be between 100 and 599")
        if self.payload_sha256 != sha256_hex(self.payload):
            raise EnvelopeValidationError("payload_sha256 does not match exact payload bytes")
        if self.compression not in {"NONE", "GZIP", "ZSTD", "BR", "DEFLATE"}:
            raise EnvelopeValidationError("unsupported compression")
        if self.network_request_count < 0:
            raise EnvelopeValidationError("network_request_count cannot be negative")
        normalized_headers = tuple(
            (name.strip().lower(), value.strip()) for name, value in self.headers
        )
        if normalized_headers != self.headers:
            raise EnvelopeValidationError(
                "headers must be normalized lowercase name/value pairs"
            )
        if len({name for name, _value in self.headers}) != len(self.headers):
            raise EnvelopeValidationError("duplicate response header names are not allowed")
        if any(not name for name, _value in self.headers):
            raise EnvelopeValidationError("response header names must be non-empty")


class Transport(Protocol):
    def fetch(self, plan: RequestPlan) -> FetchedEnvelope: ...


@dataclass(frozen=True)
class FixtureTransport:
    """An injected-byte transport that has no network implementation."""

    payload: bytes
    provenance: FixtureProvenance
    content_type: str = "application/json"
    status_code: int = 200
    headers: tuple[tuple[str, str], ...] = ()

    def fetch(self, plan: RequestPlan) -> FetchedEnvelope:
        if plan.execution_mode != "FIXTURE" or plan.network_allowed:
            raise TransportDenied("fixture transport accepts only zero-network FIXTURE plans")
        if plan.fixture is None or plan.fixture != self.provenance:
            raise TransportDenied("fixture transport provenance does not match request plan")
        actual_hash = sha256_hex(self.payload)
        if actual_hash != self.provenance.payload_sha256:
            raise EnvelopeValidationError(
                "fixture payload hash does not match frozen provenance"
            )
        return FetchedEnvelope(
            request_plan_id=plan.request_plan_id,
            source_code=plan.source_code,
            endpoint_code=plan.endpoint_code,
            transport_kind="FIXTURE",
            status_code=self.status_code,
            headers=self.headers,
            payload=self.payload,
            payload_sha256=actual_hash,
            fetched_at=self.provenance.frozen_fetched_at,
            content_type=self.content_type,
            network_request_count=0,
            request_started_at=self.provenance.frozen_fetched_at,
        )


class NetworkDisabledTransport:
    """Fail-closed placeholder used where a real HTTP transport is not authorized."""

    def fetch(self, plan: RequestPlan) -> FetchedEnvelope:
        raise TransportDenied(
            f"no network transport is installed for {plan.source_code}/{plan.endpoint_code}",
            context={"request_plan_id": plan.request_plan_id},
        )


def _system_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _environment_value(name: str) -> str | None:
    return os.environ.get(name)


def _safe_headers(headers: httpx.Headers) -> tuple[tuple[str, str], ...]:
    return tuple(
        sorted(
            (name.lower(), value.strip())
            for name, value in headers.items()
            if name.lower() in _SAFE_RESPONSE_HEADERS
        )
    )


def _compression(headers: httpx.Headers) -> str:
    value = headers.get("content-encoding", "").strip().lower()
    if not value or value == "identity":
        return "NONE"
    mapping = {
        "br": "BR",
        "deflate": "DEFLATE",
        "gzip": "GZIP",
        "zstd": "ZSTD",
    }
    try:
        return mapping[value]
    except KeyError as exc:
        raise EnvelopeValidationError(
            "upstream returned an unsupported content encoding",
            context={"content_encoding": value},
        ) from exc
