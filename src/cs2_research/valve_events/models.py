from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from types import MappingProxyType
from typing import Any, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.ingestion.transport import FetchedEnvelope

from .enums import (
    AnalysisInputStatus,
    ContractQualification,
    IssueCode,
    IssueSeverity,
    RecordIdKind,
    RegistrationStatus,
    SourceCode,
    TimestampKind,
)


SOURCE_SCHEMA_ID = "valve-event-source/v1"
SOURCE_SCHEMA_VERSION = 1
SOURCE_CANONICALIZER_VERSION = "canonical-json/v1"
SOURCE_PARSER_VERSION = "steam-news-normalizer/synthetic-v1"
STEAM_NEWS_ENDPOINT_CODE = "get_news_for_app"
STEAM_NEWS_ENDPOINT_VERSION = "v2-response-schema-pending"
_FIELD_NAME = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def require_utc(value: datetime, field_name: str) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{field_name} must be timezone-aware")
    if value.utcoffset() != timezone.utc.utcoffset(value):
        raise ValueError(f"{field_name} must use UTC")


def freeze_json_object(value: Mapping[str, Any]) -> Mapping[str, Any]:
    """Copy a JSON object so caller mutation cannot change a signed model."""

    def freeze(member: Any) -> Any:
        if isinstance(member, dict):
            return MappingProxyType({str(key): freeze(child) for key, child in member.items()})
        if isinstance(member, list):
            return tuple(freeze(child) for child in member)
        return member

    return freeze(dict(value))


def thaw_json_value(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {key: thaw_json_value(member) for key, member in value.items()}
    if isinstance(value, tuple):
        return [thaw_json_value(member) for member in value]
    return value


@dataclass(frozen=True)
class SteamNewsResponseContract:
    """An injected response shape; D1 intentionally ships no production instance."""

    contract_id: str
    qualification: ContractQualification
    records_path: tuple[str, ...]
    source_record_id_field: str
    app_id_field: str
    published_at_field: str
    title_field: str
    body_field: str
    official_url_field: str | None = None
    feed_name_field: str | None = None
    feed_label_field: str | None = None
    author_field: str | None = None
    record_id_kind: RecordIdKind = RecordIdKind.STRING
    timestamp_kind: TimestampKind = TimestampKind.UNIX_SECONDS
    top_level_allowlist: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if not self.contract_id.strip():
            raise ValueError("contract_id must be non-empty")
        if not self.records_path:
            raise ValueError("records_path must be non-empty")
        names = (*self.records_path, *self.record_fields)
        if any(not _FIELD_NAME.fullmatch(name) for name in names):
            raise ValueError("response field names must be simple JSON object keys")
        if len(set(self.record_fields)) != len(self.record_fields):
            raise ValueError("response record fields must be distinct")
        if self.top_level_allowlist and self.records_path[0] not in self.top_level_allowlist:
            raise ValueError("top_level_allowlist must include the records path root")

    @property
    def required_record_fields(self) -> tuple[str, ...]:
        return (
            self.source_record_id_field,
            self.app_id_field,
            self.published_at_field,
            self.title_field,
            self.body_field,
        )

    @property
    def record_fields(self) -> tuple[str, ...]:
        optional = (
            self.official_url_field,
            self.feed_name_field,
            self.feed_label_field,
            self.author_field,
        )
        return self.required_record_fields + tuple(name for name in optional if name)

    def to_document(self) -> dict[str, Any]:
        return {
            "app_id_field": self.app_id_field,
            "author_field": self.author_field,
            "body_field": self.body_field,
            "contract_id": self.contract_id,
            "feed_label_field": self.feed_label_field,
            "feed_name_field": self.feed_name_field,
            "official_url_field": self.official_url_field,
            "published_at_field": self.published_at_field,
            "qualification": self.qualification.value,
            "record_id_kind": self.record_id_kind.value,
            "records_path": list(self.records_path),
            "source_record_id_field": self.source_record_id_field,
            "timestamp_kind": self.timestamp_kind.value,
            "title_field": self.title_field,
            "top_level_allowlist": list(self.top_level_allowlist),
        }


@dataclass(frozen=True)
class SourceIssue:
    code: IssueCode
    severity: IssueSeverity
    detail: str
    member_ordinal: int | None = None
    field_name: str | None = None

    def to_document(self) -> dict[str, Any]:
        return {
            "code": self.code.value,
            "detail": self.detail,
            "field_name": self.field_name,
            "member_ordinal": self.member_ordinal,
            "severity": self.severity.value,
        }


@dataclass(frozen=True)
class ParsedRecordSlot:
    member_ordinal: int
    raw_member: Mapping[str, Any] | None
    issues: tuple[SourceIssue, ...] = ()

    def __post_init__(self) -> None:
        if self.member_ordinal < 0:
            raise ValueError("member_ordinal cannot be negative")
        if self.raw_member is not None:
            object.__setattr__(self, "raw_member", freeze_json_object(self.raw_member))

    @property
    def blocking(self) -> bool:
        return any(issue.severity is IssueSeverity.BLOCKING for issue in self.issues)


@dataclass(frozen=True)
class ParsedNoticeBatch:
    envelope: FetchedEnvelope
    contract: SteamNewsResponseContract
    record_slots: tuple[ParsedRecordSlot, ...]
    batch_issues: tuple[SourceIssue, ...]
    returned_member_count: int
    unconsumed_top_level_fields: tuple[str, ...]

    def __post_init__(self) -> None:
        if self.returned_member_count < 0:
            raise ValueError("returned_member_count cannot be negative")
        if len(self.record_slots) != self.returned_member_count:
            raise ValueError("every returned member must have exactly one record slot")
        if tuple(slot.member_ordinal for slot in self.record_slots) != tuple(
            range(self.returned_member_count)
        ):
            raise ValueError("record slots must account for members in source order")


@dataclass(frozen=True)
class NormalizedNotice:
    source_notice_id: str
    source_notice_version_id: str
    event_id: str
    source_code: SourceCode
    app_id: int
    source_record_id: str
    official_published_at: datetime
    first_observed_at: datetime
    title: str
    official_url: str | None
    feed_name: str | None
    feed_label: str | None
    author_text: str | None
    normalized_body_text: str
    source_extra: Mapping[str, Any]
    parser_version: str
    raw_response_sha256: str
    normalized_notice_sha256: str
    analysis_input_status: AnalysisInputStatus

    def __post_init__(self) -> None:
        require_utc(self.official_published_at, "official_published_at")
        require_utc(self.first_observed_at, "first_observed_at")
        object.__setattr__(self, "source_extra", freeze_json_object(self.source_extra))

    def content_document(self) -> dict[str, Any]:
        """Return version-defining content, excluding observation/fetch provenance."""
        return {
            "analysis_input_status": self.analysis_input_status.value,
            "app_id": self.app_id,
            "author_text": self.author_text,
            "feed_label": self.feed_label,
            "feed_name": self.feed_name,
            "normalized_body_text": self.normalized_body_text,
            "official_published_at": utc_timestamp_text(self.official_published_at),
            "official_url": self.official_url,
            "parser_version": self.parser_version,
            "schema_id": SOURCE_SCHEMA_ID,
            "schema_version": SOURCE_SCHEMA_VERSION,
            "source_code": self.source_code.value,
            "source_extra": thaw_json_value(self.source_extra),
            "source_notice_id": self.source_notice_id,
            "source_record_id": self.source_record_id,
            "title": self.title,
        }

    def to_document(self) -> dict[str, Any]:
        return {
            **self.content_document(),
            "canonicalizer_version": SOURCE_CANONICALIZER_VERSION,
            "event_id": self.event_id,
            "first_observed_at": utc_timestamp_text(self.first_observed_at),
            "normalized_notice_sha256": self.normalized_notice_sha256,
            "raw_response_sha256": self.raw_response_sha256,
            "source_notice_version_id": self.source_notice_version_id,
        }


@dataclass(frozen=True)
class NormalizedRecordSlot:
    member_ordinal: int
    notice: NormalizedNotice | None
    issues: tuple[SourceIssue, ...]

    @property
    def blocked(self) -> bool:
        return self.notice is None


@dataclass(frozen=True)
class NormalizedNoticeBatch:
    parsed: ParsedNoticeBatch
    record_slots: tuple[NormalizedRecordSlot, ...]

    def __post_init__(self) -> None:
        if len(self.record_slots) != self.parsed.returned_member_count:
            raise ValueError("normalization must account for every parsed record slot")
        if tuple(slot.member_ordinal for slot in self.record_slots) != tuple(
            range(self.parsed.returned_member_count)
        ):
            raise ValueError("normalized slots must preserve source order")

    @property
    def notices(self) -> tuple[NormalizedNotice, ...]:
        return tuple(slot.notice for slot in self.record_slots if slot.notice is not None)

    @property
    def issues(self) -> tuple[SourceIssue, ...]:
        return self.parsed.batch_issues + tuple(
            issue for slot in self.record_slots for issue in slot.issues
        )

    @property
    def blocked_count(self) -> int:
        return sum(slot.blocked for slot in self.record_slots)


@dataclass(frozen=True)
class RegisteredNoticeVersion:
    notice: NormalizedNotice
    version_no: int
    previous_source_notice_version_id: str | None
    registered_at: datetime

    def __post_init__(self) -> None:
        require_utc(self.registered_at, "registered_at")
        if self.version_no < 1:
            raise ValueError("version_no must be positive")


@dataclass(frozen=True)
class RegistrationResult:
    member_ordinal: int
    status: RegistrationStatus
    version: RegisteredNoticeVersion


@dataclass(frozen=True)
class RegistryBatchReceipt:
    results: tuple[RegistrationResult, ...]
    blocked_ordinals: tuple[int, ...]
    created_count: int = field(init=False)
    reused_count: int = field(init=False)

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "created_count",
            sum(result.status is RegistrationStatus.CREATED for result in self.results),
        )
        object.__setattr__(
            self,
            "reused_count",
            sum(result.status is RegistrationStatus.REUSED for result in self.results),
        )


def stable_identity_sha256(namespace: str, identity: Mapping[str, Any]) -> str:
    """Build a namespaced business ID compatible with ``control.sha256_hex``."""
    if not namespace.strip():
        raise ValueError("stable identity namespace must be non-empty")
    return sha256_hex(
        canonical_json_bytes({"namespace": namespace, "identity": dict(identity)})
    )


def source_notice_id(source_code: SourceCode, app_id: int, source_record_id: str) -> str:
    return stable_identity_sha256(
        "valve-event-source-notice-v1",
        {
            "app_id": app_id,
            "source_code": source_code.value,
            "source_record_id": source_record_id,
        },
    )


def source_notice_version_id(notice_id: str, content_sha256: str) -> str:
    return stable_identity_sha256(
        "valve-event-source-notice-version-v1",
        {
            "normalized_notice_sha256": content_sha256,
            "source_notice_id": notice_id,
        },
    )


def normalized_content_sha256(document: Mapping[str, Any]) -> str:
    return sha256_hex(canonical_json_bytes(dict(document)))


__all__ = [
    "NormalizedNotice",
    "NormalizedNoticeBatch",
    "NormalizedRecordSlot",
    "ParsedNoticeBatch",
    "ParsedRecordSlot",
    "RegisteredNoticeVersion",
    "RegistrationResult",
    "RegistryBatchReceipt",
    "SOURCE_CANONICALIZER_VERSION",
    "SOURCE_PARSER_VERSION",
    "SOURCE_SCHEMA_ID",
    "SOURCE_SCHEMA_VERSION",
    "STEAM_NEWS_ENDPOINT_CODE",
    "STEAM_NEWS_ENDPOINT_VERSION",
    "SourceIssue",
    "SteamNewsResponseContract",
    "freeze_json_object",
    "normalized_content_sha256",
    "require_utc",
    "source_notice_id",
    "source_notice_version_id",
    "stable_identity_sha256",
    "thaw_json_value",
]
