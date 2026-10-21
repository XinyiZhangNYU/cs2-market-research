from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Literal


PermissionState = Literal["ALLOW", "DENY", "UNKNOWN"]
ExecutionMode = Literal["FIXTURE", "SAMPLE", "SYSTEMATIC", "BACKFILL"]
RetentionMode = Literal[
    "SYNTHETIC_FIXTURE", "PERSISTED_RAW", "EPHEMERAL_NORMALIZED"
]


@dataclass(frozen=True)
class RightsSnapshot:
    version_label: str
    acquisition: PermissionState = "UNKNOWN"
    systematic_collection: PermissionState = "UNKNOWN"
    historical_backfill: PermissionState = "UNKNOWN"
    raw_storage: PermissionState = "UNKNOWN"
    normalized_storage: PermissionState = "UNKNOWN"
    internal_derivative_use: PermissionState = "UNKNOWN"
    derived_storage: PermissionState = "UNKNOWN"
    effective_from: datetime | None = None
    valid_to: datetime | None = None


@dataclass(frozen=True)
class FixtureProvenance:
    fixture_id: str
    fixture_kind: str
    contains_real_market_data: bool
    payload_sha256: str
    frozen_fetched_at: datetime


@dataclass(frozen=True)
class RequestPlan:
    execution_mode: ExecutionMode
    network_allowed: bool
    user_authorization_ref: str | None
    fixture: FixtureProvenance | None
    request_plan_id: str
    source_code: str
    endpoint_code: str
    endpoint_version: str
    rights_version_label: str
    rights_snapshot: RightsSnapshot
    planned_for: datetime
    item_key_kind: str
    item_keys: tuple[str, ...]
    item_manifest_hash: str
    retention_mode: RetentionMode
    request_canonical_hash: str
    request_options: tuple[tuple[str, str], ...] = ()
    request_options_hash: str = ""


@dataclass(frozen=True)
class SourceQuote:
    source_member_key: str
    source_item_id: str
    market_hash_name: str
    best_ask_minor: int | None
    ask_volume_raw: Decimal | None
    best_bid_minor: int | None
    bid_volume_raw: Decimal | None
    field_availability: dict[str, str]
    unconsumed_fields: tuple[str, ...]


@dataclass(frozen=True)
class SourceRecordIssue:
    issue_code: str
    severity: str
    detail_code: str
    request_item_key: str | None = None
    source_member_key: str | None = None
    source_item_id: str | None = None
    field_name: str | None = None
    source_member_ordinal: int | None = None
    field_availability: dict[str, str] | None = None


@dataclass(frozen=True)
class SourceRecordBatch:
    records: tuple[SourceQuote, ...]
    issues: tuple[SourceRecordIssue, ...]
    returned_member_count: int
    unconsumed_top_level_fields: tuple[str, ...]


@dataclass(frozen=True)
class PipelineArtifacts:
    output_dir: Path
    run_id: str
    dataset_snapshot_id: str
    record_count: int
    issue_count: int
    completeness_status: str
    manifest_hash: str
    issue_manifest_hash: str
    dataset_content_hash: str
    file_sha256: dict[str, str]


@dataclass(frozen=True)
class SampleAcquisitionArtifacts:
    output_dir: Path
    run_id: str
    status: str
    record_count: int
    issue_count: int
    network_request_count: int
    payload_sha256: str
    file_sha256: dict[str, str]
