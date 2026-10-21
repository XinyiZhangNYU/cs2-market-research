from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from typing import Any, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text

from .models import require_utc


PUBLIC_API_CONTRACT = "valve-event-public-api"
PUBLIC_API_VERSION = "v1"
PUBLIC_SCHEMA_ID = "valve-event-public-api/v1"
_SHA256 = re.compile(r"^[0-9a-f]{64}$")


class PublicEventStatus(StrEnum):
    SOURCE_ONLY = "SOURCE_ONLY"
    ANALYSIS_PENDING = "ANALYSIS_PENDING"
    ANALYSIS_BLOCKED = "ANALYSIS_BLOCKED"
    PUBLIC = "PUBLIC"
    SOURCE_UPDATED_ANALYSIS_PENDING = "SOURCE_UPDATED_ANALYSIS_PENDING"
    CORRECTED = "CORRECTED"
    WITHDRAWN = "WITHDRAWN"


class TemporalMode(StrEnum):
    PROSPECTIVE = "PROSPECTIVE"
    RETROSPECTIVE_REPLAY = "RETROSPECTIVE_REPLAY"
    RETROSPECTIVE_WITH_HINDSIGHT = "RETROSPECTIVE_WITH_HINDSIGHT"
    RETROSPECTIVE_CORRECTION = "RETROSPECTIVE_CORRECTION"


class ImpactDirection(StrEnum):
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    MIXED = "MIXED"
    NO_CLEAR_IMPACT = "NO_CLEAR_IMPACT"
    UNCERTAIN = "UNCERTAIN"


class ImpactHorizon(StrEnum):
    IMMEDIATE = "IMMEDIATE"
    SHORT_TERM = "SHORT_TERM"
    STRUCTURAL = "STRUCTURAL"
    UNSPECIFIED = "UNSPECIFIED"


class TrackingStatus(StrEnum):
    TRACKED = "TRACKED"
    UNTRACKED_SUBJECT = "UNTRACKED_SUBJECT"
    UNRESOLVED = "UNRESOLVED"


class PublicScopeKind(StrEnum):
    MARKET = "MARKET"
    SECTOR = "SECTOR"
    ASSET_FAMILY = "ASSET_FAMILY"
    ITEM = "ITEM"
    MECHANISM = "MECHANISM"


@dataclass(frozen=True)
class PublicSourceMetadata:
    event_id: str
    source_code: str
    source_notice_version_id: str
    official_title: str
    official_url: str | None
    official_published_at: datetime
    first_observed_at: datetime
    source_updated_at: datetime | None = None

    def __post_init__(self) -> None:
        require_utc(self.official_published_at, "official_published_at")
        require_utc(self.first_observed_at, "first_observed_at")
        if self.source_updated_at is not None:
            require_utc(self.source_updated_at, "source_updated_at")
        if any(
            not value.strip()
            for value in (
                self.event_id,
                self.source_code,
                self.source_notice_version_id,
                self.official_title,
            )
        ):
            raise ValueError("public source metadata identifiers must be non-empty")

    def to_document(self) -> dict[str, Any]:
        return {
            "event_id": self.event_id,
            "first_observed_at": utc_timestamp_text(self.first_observed_at),
            "official_published_at": utc_timestamp_text(self.official_published_at),
            "official_title": self.official_title,
            "official_url": self.official_url,
            "source_code": self.source_code,
            "source_notice_version_id": self.source_notice_version_id,
            "source_updated_at": (
                utc_timestamp_text(self.source_updated_at)
                if self.source_updated_at is not None
                else None
            ),
        }


@dataclass(frozen=True)
class PublicArticle:
    title: str
    factual_summary: str
    transmission_mechanisms: str
    scope_analysis: str
    uncertainties_and_counterforces: str
    observation_and_falsification: str
    conclusion: str

    def __post_init__(self) -> None:
        if any(not value.strip() for value in self.to_document().values()):
            raise ValueError("every public article section must be non-empty")

    def to_document(self) -> dict[str, str]:
        return {
            "conclusion": self.conclusion,
            "factual_summary": self.factual_summary,
            "observation_and_falsification": self.observation_and_falsification,
            "scope_analysis": self.scope_analysis,
            "title": self.title,
            "transmission_mechanisms": self.transmission_mechanisms,
            "uncertainties_and_counterforces": self.uncertainties_and_counterforces,
        }


@dataclass(frozen=True)
class PublicClaim:
    claim_id: str
    scope_kind: PublicScopeKind
    scope_ref: str | None
    scope_display: str
    tracking_status: TrackingStatus
    direction: ImpactDirection
    horizon: ImpactHorizon
    mechanism_codes: tuple[str, ...]
    reasoning_section_ref: str
    observation_targets: tuple[str, ...]
    falsification_conditions: tuple[str, ...]
    limitations: tuple[str, ...]

    def __post_init__(self) -> None:
        if not self.claim_id.strip() or not self.scope_display.strip() or not self.reasoning_section_ref.strip():
            raise ValueError("public claim identity and article reference must be non-empty")
        if self.tracking_status is TrackingStatus.TRACKED and (
            self.scope_ref is None or not self.scope_ref.strip()
        ):
            raise ValueError("tracked public claims require a stable scope reference")
        for values in (
            self.mechanism_codes,
            self.observation_targets,
            self.falsification_conditions,
            self.limitations,
        ):
            if any(not value.strip() for value in values):
                raise ValueError("public claim text arrays cannot contain empty values")

    def to_document(self) -> dict[str, Any]:
        return {
            "claim_id": self.claim_id,
            "direction": self.direction.value,
            "falsification_conditions": list(self.falsification_conditions),
            "horizon": self.horizon.value,
            "limitations": list(self.limitations),
            "mechanism_codes": list(self.mechanism_codes),
            "observation_targets": list(self.observation_targets),
            "reasoning_section_ref": self.reasoning_section_ref,
            "scope_display": self.scope_display,
            "scope_kind": self.scope_kind.value,
            "scope_ref": self.scope_ref,
            "tracking_status": self.tracking_status.value,
        }


@dataclass(frozen=True)
class PublicAssessment:
    publication_id: str
    publication_version_no: int
    source_notice_version_id: str
    temporal_mode: TemporalMode
    event_cutoff_at: datetime
    known_at: datetime
    published_at: datetime
    article: PublicArticle
    claims: tuple[PublicClaim, ...]
    disclosures: tuple[str, ...]
    context_status: str
    context_snapshot_id: str
    correction_of_publication_id: str | None
    public_payload_sha256: str

    def __post_init__(self) -> None:
        for name in ("event_cutoff_at", "known_at", "published_at"):
            require_utc(getattr(self, name), name)
        if isinstance(self.publication_version_no, bool) or self.publication_version_no < 1:
            raise ValueError("publication_version_no must be positive")
        if not any(claim.scope_kind is PublicScopeKind.MARKET for claim in self.claims):
            raise ValueError("public assessment must contain a MARKET claim")
        if not self.disclosures or any(not disclosure.strip() for disclosure in self.disclosures):
            raise ValueError("public assessment must contain non-empty disclosures")
        if not _SHA256.fullmatch(self.public_payload_sha256):
            raise ValueError("public payload hash must be lowercase SHA-256")

    def to_document(self) -> dict[str, Any]:
        return {
            "article": self.article.to_document(),
            "claims": [claim.to_document() for claim in self.claims],
            "context_snapshot_id": self.context_snapshot_id,
            "context_status": self.context_status,
            "correction_of_publication_id": self.correction_of_publication_id,
            "disclosures": list(self.disclosures),
            "event_cutoff_at": utc_timestamp_text(self.event_cutoff_at),
            "known_at": utc_timestamp_text(self.known_at),
            "public_payload_sha256": self.public_payload_sha256,
            "publication_id": self.publication_id,
            "publication_version_no": self.publication_version_no,
            "published_at": utc_timestamp_text(self.published_at),
            "source_notice_version_id": self.source_notice_version_id,
            "temporal_mode": self.temporal_mode.value,
        }


@dataclass(frozen=True)
class PublicOutcome:
    outcome_publication_id: str
    outcome_evaluation_id: str
    label: str
    explanation: str
    observation_cutoff_at: datetime
    policy_release_id: str
    evidence_status: str
    noise_and_causality_disclosure: str
    published_at: datetime

    def __post_init__(self) -> None:
        require_utc(self.observation_cutoff_at, "observation_cutoff_at")
        require_utc(self.published_at, "outcome.published_at")
        if self.label not in {"SUPPORTED", "MIXED", "NOT_SUPPORTED", "UNAVAILABLE"}:
            raise ValueError("public outcome label is unsupported")
        if any(
            not value.strip()
            for value in (
                self.outcome_publication_id,
                self.outcome_evaluation_id,
                self.explanation,
                self.policy_release_id,
                self.evidence_status,
                self.noise_and_causality_disclosure,
            )
        ):
            raise ValueError("public outcome fields must be non-empty")

    def to_document(self) -> dict[str, Any]:
        return {
            "evidence_status": self.evidence_status,
            "explanation": self.explanation,
            "label": self.label,
            "noise_and_causality_disclosure": self.noise_and_causality_disclosure,
            "observation_cutoff_at": utc_timestamp_text(self.observation_cutoff_at),
            "outcome_evaluation_id": self.outcome_evaluation_id,
            "outcome_publication_id": self.outcome_publication_id,
            "policy_release_id": self.policy_release_id,
            "published_at": utc_timestamp_text(self.published_at),
        }


@dataclass(frozen=True)
class PublicVersionEntry:
    publication_id: str
    publication_version_no: int
    temporal_mode: TemporalMode
    published_at: datetime
    withdrawn: bool
    withdrawal_reason: str | None

    def __post_init__(self) -> None:
        require_utc(self.published_at, "version.published_at")
        if self.withdrawn != (self.withdrawal_reason is not None):
            raise ValueError("withdrawal reason must be present exactly when withdrawn")

    def to_document(self) -> dict[str, Any]:
        return {
            "publication_id": self.publication_id,
            "publication_version_no": self.publication_version_no,
            "published_at": utc_timestamp_text(self.published_at),
            "temporal_mode": self.temporal_mode.value,
            "withdrawal_reason": self.withdrawal_reason,
            "withdrawn": self.withdrawn,
        }


@dataclass(frozen=True)
class PublicEventResource:
    source: PublicSourceMetadata
    status: PublicEventStatus
    latest_publication: PublicAssessment | None
    latest_outcome: PublicOutcome | None
    public_versions: tuple[PublicVersionEntry, ...]
    source_updated: bool
    corrected: bool
    withdrawn: bool

    def __post_init__(self) -> None:
        if self.latest_publication is None and self.public_versions:
            raise ValueError("public version history cannot exist without a latest publication")
        if self.latest_publication is not None and not self.public_versions:
            raise ValueError("a latest publication must appear in public version history")
        if self.corrected and self.status is not PublicEventStatus.CORRECTED:
            raise ValueError("corrected flag and public status must agree")
        if self.withdrawn and self.status is not PublicEventStatus.WITHDRAWN:
            raise ValueError("withdrawn flag and public status must agree")

    def to_document(self) -> dict[str, Any]:
        document = {
            "flags": {
                "corrected": self.corrected,
                "source_updated": self.source_updated,
                "withdrawn": self.withdrawn,
            },
            "latest_outcome": self.latest_outcome.to_document() if self.latest_outcome else None,
            "latest_publication": self.latest_publication.to_document() if self.latest_publication else None,
            "public_versions": [version.to_document() for version in self.public_versions],
            "source": self.source.to_document(),
            "status": self.status.value,
        }
        assert_public_projection_safe(document)
        return document


@dataclass(frozen=True)
class PublicEventSummary:
    source: PublicSourceMetadata
    status: PublicEventStatus
    conclusion_summary: str | None
    primary_direction: ImpactDirection | None
    scope_labels: tuple[str, ...]
    temporal_mode: TemporalMode | None
    outcome_label: str | None
    source_updated: bool
    corrected: bool
    withdrawn: bool

    def to_document(self) -> dict[str, Any]:
        return {
            "conclusion_summary": self.conclusion_summary,
            "flags": {
                "corrected": self.corrected,
                "source_updated": self.source_updated,
                "withdrawn": self.withdrawn,
            },
            "outcome_label": self.outcome_label,
            "primary_direction": self.primary_direction.value if self.primary_direction else None,
            "scope_labels": list(self.scope_labels),
            "source": self.source.to_document(),
            "status": self.status.value,
            "temporal_mode": self.temporal_mode.value if self.temporal_mode else None,
        }


@dataclass(frozen=True)
class ValveEventListResponse:
    events: tuple[PublicEventSummary, ...]
    next_cursor: str | None
    query_hash: str

    def to_document(self) -> dict[str, Any]:
        document = {
            "api_contract": PUBLIC_API_CONTRACT,
            "api_version": PUBLIC_API_VERSION,
            "events": [event.to_document() for event in self.events],
            "next_cursor": self.next_cursor,
            "query_hash": self.query_hash,
            "response_kind": "VALVE_EVENT_LIST",
        }
        assert_public_projection_safe(document)
        return document


@dataclass(frozen=True)
class ValveEventDetailResponse:
    event: PublicEventResource
    etag: str

    def to_document(self) -> dict[str, Any]:
        document = {
            "api_contract": PUBLIC_API_CONTRACT,
            "api_version": PUBLIC_API_VERSION,
            "etag": self.etag,
            "event": self.event.to_document(),
            "response_kind": "VALVE_EVENT_DETAIL",
        }
        assert_public_projection_safe(document)
        return document


_FORBIDDEN_PUBLIC_KEYS = frozenset(
    {
        "candidate",
        "candidate_id",
        "candidate_payload",
        "confidence",
        "confidence_score",
        "database_dsn",
        "model_prompt",
        "normalized_body_text",
        "probability",
        "prompt",
        "raw_response",
        "raw_response_sha256",
        "recommendation_detail",
        "risk_score",
        "source_extra",
    }
)


def assert_public_projection_safe(value: Any) -> None:
    """Fail closed if a public DTO accidentally gains a private or score field."""
    if isinstance(value, Mapping):
        for key, member in value.items():
            if key in _FORBIDDEN_PUBLIC_KEYS:
                raise ValueError(f"private field is forbidden in public projection: {key}")
            assert_public_projection_safe(member)
    elif isinstance(value, (list, tuple)):
        for member in value:
            assert_public_projection_safe(member)


def public_payload_sha256(payload_without_hash: Mapping[str, Any]) -> str:
    assert_public_projection_safe(payload_without_hash)
    return sha256_hex(canonical_json_bytes(dict(payload_without_hash)))


__all__ = [
    "ImpactDirection",
    "ImpactHorizon",
    "PublicArticle",
    "PublicAssessment",
    "PublicClaim",
    "PublicEventResource",
    "PublicEventStatus",
    "PublicEventSummary",
    "PublicOutcome",
    "PublicScopeKind",
    "PublicSourceMetadata",
    "PublicVersionEntry",
    "TemporalMode",
    "TrackingStatus",
    "ValveEventDetailResponse",
    "ValveEventListResponse",
    "assert_public_projection_safe",
    "public_payload_sha256",
]
