"""Normalized latest-quote observation contract for the upstream provider.

The provider adapter that decodes the upstream wire format is not part of this
public repository. This module keeps only the normalized, provider-independent
output types and schema identifiers that downstream code consumes.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any

from cs2_research.canonical import (
    canonical_json_bytes,
    decimal_38_8_text,
    sha256_hex,
    utc_timestamp_text,
)

from .errors import ProviderAdapterUnavailable

UPSTREAM_LATEST_ENDPOINT_CODE = "prices_latest_all_market"
UPSTREAM_LATEST_NORMALIZER_VERSION = "upstream-developer-latest-normalizer-v4"
UPSTREAM_LATEST_OBSERVATION_SCHEMA = "upstream-latest-source-observation/1"
UPSTREAM_LATEST_COVERAGE_SCHEMA = "upstream-latest-coverage/3"
UPSTREAM_LATEST_PROVENANCE_SCHEMA = "upstream-latest-provenance/1"
UPSTREAM_SELECTED_SOURCES = ("market_a", "market_c", "market_b")


class UpstreamLatestError(ValueError):
    """The latest response, slot, or catalog binding violates the frozen contract."""


class UpstreamLatestScheduleError(UpstreamLatestError):
    """A launch cannot truthfully represent the declared five-minute slot."""


@dataclass(frozen=True, slots=True)
class UpstreamLatestSourceObservation:
    provider_source: str
    base_market_hash_name: str
    observed_market_hash_name: str
    variant_version: str | None
    variant_display_name: str | None
    provider_response_time: datetime
    source_updated_at: datetime | None
    source_collected_at: datetime | None
    ask_usd: Decimal | None
    ask_volume_raw: int | None
    bid_usd: Decimal | None
    bid_volume_raw: int | None
    catalog_mapping_status: str

    @property
    def crossed_quote(self) -> bool:
        return (
            self.ask_usd is not None
            and self.bid_usd is not None
            and self.bid_usd > self.ask_usd
        )

    def to_document(self) -> dict[str, Any]:
        body: dict[str, Any] = {
            "ask_usd": _decimal_text(self.ask_usd),
            "ask_volume_raw": self.ask_volume_raw,
            "base_market_hash_name": self.base_market_hash_name,
            "bid_usd": _decimal_text(self.bid_usd),
            "bid_volume_raw": self.bid_volume_raw,
            "catalog_mapping_status": self.catalog_mapping_status,
            "crossed_quote": self.crossed_quote,
            "currency": "USD",
            "observed_market_hash_name": self.observed_market_hash_name,
            "provider_response_time": utc_timestamp_text(self.provider_response_time),
            "provider_source": self.provider_source,
            "schema_version": UPSTREAM_LATEST_OBSERVATION_SCHEMA,
            "source_collected_at": _optional_timestamp_text(self.source_collected_at),
            "source_updated_at": _optional_timestamp_text(self.source_updated_at),
            "variant_display_name": self.variant_display_name,
            "variant_version": self.variant_version,
        }
        record_hash = sha256_hex(canonical_json_bytes(body))
        return {**body, "record_hash": record_hash}


@dataclass(frozen=True, slots=True)
class UpstreamLatestResponse:
    response_time: datetime
    provider_item_names: tuple[str, ...]
    observations: tuple[UpstreamLatestSourceObservation, ...]
    variant_count: int
    variant_version_counts: tuple[tuple[str, int], ...]
    identity_only_item_names: tuple[str, ...]
    withheld_identity_only_variant_sources: tuple[
        tuple[str, str, tuple[str, ...]], ...
    ]


@dataclass(frozen=True, slots=True)
class UpstreamLatestScheduleCoverage:
    expected_slot_count: int
    terminal_slot_count: int
    captured_slot_count: int
    missing_slot_ids: tuple[str, ...]
    rejected_slot_ids: tuple[str, ...]


def parse_upstream_latest(
    payload: bytes,
    *,
    target_names: frozenset[str] | None = None,
) -> UpstreamLatestResponse:
    """Decode one upstream latest response into normalized observations.

    The implementation belongs to the private provider adapter.
    """
    raise ProviderAdapterUnavailable("PROVIDER_ADAPTER_NOT_INCLUDED")


def _decimal_text(value: Decimal | None) -> str | None:
    return None if value is None else decimal_38_8_text(value)


def _optional_timestamp_text(value: datetime | None) -> str | None:
    return None if value is None else utc_timestamp_text(value)
