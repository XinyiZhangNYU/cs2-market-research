"""Formal D3 contracts for the descriptive single-item Trending list.

The D2 ledgers and the historical E0 experiments are private evidence.  This
module creates a new, exact CNY comparison ledger whose identity is independent
of any presentation rank.  Public projection is a separate operation and is
fail-closed until every release gate, including public-use rights, is explicit.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_EVEN, localcontext
from enum import Enum
from fractions import Fraction
from typing import Any, Iterable, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.result.public_results import catalog_projection
from .identity import TrendingIdentityHistory

from .models import (
    TrendingContractError,
    TrendingMembership,
    parse_date,
    parse_timestamp,
    require,
    require_exact_keys,
    require_sha256,
    require_text,
    strict_json_bytes,
)


TRENDING_NUMERIC_PROFILE_SCHEMA = "single-item-trending-numeric-profile/1"
TRENDING_RIGHTS_RELEASE_SCHEMA = "single-item-trending-rights-release/2"
TRENDING_EVIDENCE_RELEASE_SCHEMA = "single-item-trending-window-evidence-release/1"
TRENDING_MEASUREMENT_SCHEMA = "single-item-trending-measurement/3"
TRENDING_CANDIDATE_LEDGER_SCHEMA = "single-item-trending-candidate-ledger/3"
TRENDING_PUBLIC_MANIFEST_SCHEMA = "single-item-trending-public-manifest/3"
TRENDING_FORMAL_PRODUCER_VERSION = "single-item-trending-m3a-cny-v3"
TRENDING_WINDOW_EVIDENCE_SCHEMA = "single-item-trending-window-evidence/2"

EXPECTED_SOURCES = ("market_a", "market_b", "market_c")
_RATIO_SCALE = Decimal("0.00000001")


class TrendingDirection(str, Enum):
    GAINERS = "GAINERS"
    LOSERS = "LOSERS"


class TrendingMeasurementStatus(str, Enum):
    ELIGIBLE_A3 = "ELIGIBLE_A3"
    CONFLICTED_DIRECTION = "CONFLICTED_DIRECTION"
    INSUFFICIENT_THREE_SOURCES = "INSUFFICIENT_THREE_SOURCES"
    FLAT_OR_ZERO_CONFLICT = "FLAT_OR_ZERO_CONFLICT"
    WITHHELD_ANOMALY = "WITHHELD_ANOMALY"
    WITHHELD_ANOMALY_UNKNOWN = "WITHHELD_ANOMALY_UNKNOWN"
    WITHHELD_WINDOW_EVIDENCE = "WITHHELD_WINDOW_EVIDENCE"
    WITHHELD_MICROPRICE = "WITHHELD_MICROPRICE"
    STALE_ENDPOINT = "STALE_ENDPOINT"
    TEMPORAL_VIOLATION = "TEMPORAL_VIOLATION"
    CONTRACT_MISMATCH = "CONTRACT_MISMATCH"


class TrendingCandidateStatus(str, Enum):
    INTERNAL_CANDIDATE = "INTERNAL_CANDIDATE"
    WITHHELD_MEMBER_ACCOUNTING = "WITHHELD_MEMBER_ACCOUNTING"
    WITHHELD_NO_DIRECTION_ELIGIBLE = "WITHHELD_NO_DIRECTION_ELIGIBLE"


class TrendingPublicGate(str, Enum):
    NUMERIC_PROFILE_WITHHELD = "NUMERIC_PROFILE_WITHHELD"
    PROSPECTIVE_VALIDATION_WITHHELD = "PROSPECTIVE_VALIDATION_WITHHELD"
    RIGHTS_WITHHELD = "RIGHTS_WITHHELD"
    PIT_MEMBERSHIP_WITHHELD = "PIT_MEMBERSHIP_WITHHELD"
    FRESHNESS_WITHHELD = "FRESHNESS_WITHHELD"
    WINDOW_EVIDENCE_WITHHELD = "WINDOW_EVIDENCE_WITHHELD"
    ANOMALY_POLICY_WITHHELD = "ANOMALY_POLICY_WITHHELD"
    CATALOG_PUBLICATION_WITHHELD = "CATALOG_PUBLICATION_WITHHELD"
    COVERAGE_WITHHELD = "COVERAGE_WITHHELD"
    CANDIDATE_WITHHELD = "CANDIDATE_WITHHELD"


class TrendingAnomalyStatus(str, Enum):
    PASS = "PASS"
    FLAGGED = "FLAGGED"
    UNKNOWN = "UNKNOWN"


def _utc(value: datetime, code: str) -> datetime:
    require(
        isinstance(value, datetime)
        and value.tzinfo is not None
        and value.utcoffset() == UTC.utcoffset(value),
        code,
    )
    return value.astimezone(UTC)


def _positive(value: Any, code: str, *, maximum: int | None = None) -> int:
    require(isinstance(value, int) and not isinstance(value, bool) and value > 0, code)
    if maximum is not None:
        require(value <= maximum, code)
    return value


def _ratio_text(value: Fraction) -> str:
    with localcontext() as context:
        context.prec = 96
        rendered = (Decimal(value.numerator) / Decimal(value.denominator)).quantize(
            _RATIO_SCALE, rounding=ROUND_HALF_EVEN
        )
    # Direction is determined by the exact fraction, even when its display
    # rounds to zero. Retain Decimal's sign so tiny losses cannot masquerade
    # as nonnegative values at the public/API boundary.
    return format(rendered, ".8f")


def _document_id(document: Mapping[str, Any]) -> str:
    return sha256_hex(canonical_json_bytes(dict(document)))


def _set_hash(documents: Iterable[Mapping[str, Any]]) -> str:
    return sha256_hex(b"".join(canonical_json_bytes(dict(row)) for row in documents))


def _utc_day_closed_at(value: date) -> datetime:
    return datetime.combine(value + timedelta(days=1), time.min, tzinfo=UTC)


@dataclass(frozen=True, slots=True)
class TrendingNumericProfile:
    profile_code: str
    available_at: datetime
    minimum_endpoint_cny_minor: int
    minimum_abs_leg_delta_cny_minor: int
    minimum_eligible_ratio_bps: int
    endpoint_freshness_seconds: int
    formal_numeric_profile_approved: bool
    prospective_validation_approved: bool

    def __post_init__(self) -> None:
        require_text(self.profile_code, "D3_PROFILE_CODE")
        _utc(self.available_at, "D3_PROFILE_AVAILABLE_AT")
        _positive(self.minimum_endpoint_cny_minor, "D3_PROFILE_ENDPOINT")
        _positive(self.minimum_abs_leg_delta_cny_minor, "D3_PROFILE_DELTA")
        require(
            isinstance(self.minimum_eligible_ratio_bps, int)
            and not isinstance(self.minimum_eligible_ratio_bps, bool)
            and 0 <= self.minimum_eligible_ratio_bps <= 10_000,
            "D3_PROFILE_ELIGIBLE_BPS",
        )
        _positive(
            self.endpoint_freshness_seconds,
            "D3_PROFILE_FRESHNESS",
            maximum=31_536_000,
        )
        require(
            type(self.formal_numeric_profile_approved) is bool
            and type(self.prospective_validation_approved) is bool,
            "D3_PROFILE_APPROVAL_TYPE",
        )

    def body_document(self) -> dict[str, Any]:
        return {
            "schema_version": TRENDING_NUMERIC_PROFILE_SCHEMA,
            "profile_code": self.profile_code,
            "available_at": utc_timestamp_text(self.available_at),
            "method_id": "M3",
            "segment": "A_THREE_SOURCE",
            "horizon_days": 30,
            "analysis_currency": "CNY",
            "price_scale": 2,
            "sources": list(EXPECTED_SOURCES),
            "minimum_endpoint_cny_minor": self.minimum_endpoint_cny_minor,
            "minimum_abs_leg_delta_cny_minor": self.minimum_abs_leg_delta_cny_minor,
            "minimum_eligible_ratio_bps": self.minimum_eligible_ratio_bps,
            "endpoint_freshness_seconds": self.endpoint_freshness_seconds,
            "formal_numeric_profile_approved": self.formal_numeric_profile_approved,
            "prospective_validation_approved": self.prospective_validation_approved,
        }

    @property
    def profile_id(self) -> str:
        return _document_id(self.body_document())

    def to_document(self) -> dict[str, Any]:
        return {"profile_id": self.profile_id, **self.body_document()}

    @classmethod
    def from_document(cls, value: Any) -> "TrendingNumericProfile":
        document = require_exact_keys(
            value,
            {
                "profile_id", "schema_version", "profile_code", "available_at",
                "method_id", "segment", "horizon_days", "analysis_currency",
                "price_scale", "sources", "minimum_endpoint_cny_minor",
                "minimum_abs_leg_delta_cny_minor", "minimum_eligible_ratio_bps",
                "endpoint_freshness_seconds", "formal_numeric_profile_approved",
                "prospective_validation_approved",
            },
            "D3_PROFILE_DOCUMENT",
        )
        require(document["schema_version"] == TRENDING_NUMERIC_PROFILE_SCHEMA, "D3_PROFILE_SCHEMA")
        require(
            document["method_id"] == "M3"
            and document["segment"] == "A_THREE_SOURCE"
            and document["horizon_days"] == 30
            and document["analysis_currency"] == "CNY"
            and document["price_scale"] == 2
            and tuple(document["sources"]) == EXPECTED_SOURCES,
            "D3_PROFILE_METHOD",
        )
        profile = cls(
            profile_code=document["profile_code"],
            available_at=parse_timestamp(document["available_at"], "D3_PROFILE_AVAILABLE_AT"),
            minimum_endpoint_cny_minor=document["minimum_endpoint_cny_minor"],
            minimum_abs_leg_delta_cny_minor=document["minimum_abs_leg_delta_cny_minor"],
            minimum_eligible_ratio_bps=document["minimum_eligible_ratio_bps"],
            endpoint_freshness_seconds=document["endpoint_freshness_seconds"],
            formal_numeric_profile_approved=document["formal_numeric_profile_approved"],
            prospective_validation_approved=document["prospective_validation_approved"],
        )
        require(profile.to_document() == dict(document), "D3_PROFILE_IDENTITY")
        return profile


@dataclass(frozen=True, slots=True)
class TrendingRightsRelease:
    release_code: str
    available_at: datetime
    usage_scope: str
    public_derived_trending_allowed: bool
    allowed_public_source_codes: tuple[str, ...]
    maximum_public_members_per_direction: int

    def __post_init__(self) -> None:
        require_text(self.release_code, "D3_RIGHTS_CODE")
        _utc(self.available_at, "D3_RIGHTS_AVAILABLE_AT")
        require(
            self.usage_scope in {"INTERNAL_SHADOW", "PUBLIC_DERIVED_TRENDING"},
            "D3_RIGHTS_SCOPE",
        )
        require(type(self.public_derived_trending_allowed) is bool, "D3_RIGHTS_ALLOWED")
        require(
            self.public_derived_trending_allowed
            == (self.usage_scope == "PUBLIC_DERIVED_TRENDING"),
            "D3_RIGHTS_SCOPE_DISAGREES",
        )
        require(
            isinstance(self.allowed_public_source_codes, tuple)
            and self.allowed_public_source_codes
            == tuple(sorted(set(self.allowed_public_source_codes)))
            and set(self.allowed_public_source_codes).issubset(EXPECTED_SOURCES),
            "D3_RIGHTS_SOURCE_SCOPE",
        )
        if self.public_derived_trending_allowed:
            require(
                self.allowed_public_source_codes == EXPECTED_SOURCES,
                "D3_RIGHTS_ALL_SOURCES_REQUIRED",
            )
            _positive(
                self.maximum_public_members_per_direction,
                "D3_RIGHTS_MEMBER_LIMIT",
                maximum=50,
            )
        else:
            require(not self.allowed_public_source_codes, "D3_RIGHTS_PUBLIC_SOURCES_FORBIDDEN")
            require(
                self.maximum_public_members_per_direction == 0,
                "D3_RIGHTS_INTERNAL_MEMBER_LIMIT",
            )

    def body_document(self) -> dict[str, Any]:
        return {
            "schema_version": TRENDING_RIGHTS_RELEASE_SCHEMA,
            "release_code": self.release_code,
            "available_at": utc_timestamp_text(self.available_at),
            "usage_scope": self.usage_scope,
            "public_derived_trending_allowed": self.public_derived_trending_allowed,
            "allowed_public_source_codes": list(self.allowed_public_source_codes),
            "maximum_public_members_per_direction": self.maximum_public_members_per_direction,
        }

    @property
    def release_id(self) -> str:
        return _document_id(self.body_document())

    def to_document(self) -> dict[str, Any]:
        return {"rights_release_id": self.release_id, **self.body_document()}

    @classmethod
    def from_document(cls, value: Any) -> "TrendingRightsRelease":
        document = require_exact_keys(
            value,
            {
                "rights_release_id", "schema_version", "release_code", "available_at",
                "usage_scope", "public_derived_trending_allowed",
                "allowed_public_source_codes", "maximum_public_members_per_direction",
            },
            "D3_RIGHTS_DOCUMENT",
        )
        require(document["schema_version"] == TRENDING_RIGHTS_RELEASE_SCHEMA, "D3_RIGHTS_SCHEMA")
        require(isinstance(document["allowed_public_source_codes"], list), "D3_RIGHTS_SOURCES")
        rights = cls(
            release_code=document["release_code"],
            available_at=parse_timestamp(document["available_at"], "D3_RIGHTS_AVAILABLE_AT"),
            usage_scope=document["usage_scope"],
            public_derived_trending_allowed=document["public_derived_trending_allowed"],
            allowed_public_source_codes=tuple(document["allowed_public_source_codes"]),
            maximum_public_members_per_direction=document[
                "maximum_public_members_per_direction"
            ],
        )
        require(rights.to_document() == dict(document), "D3_RIGHTS_IDENTITY")
        return rights


@dataclass(frozen=True, slots=True)
class TrendingWindowEvidence:
    """Hash-bound proof that one exact 30-day window is publishable evidence.

    The object is produced by the current-data bridge after it has verified two
    complete upstream EOD reductions, a fixed point-in-time membership and an
    explicit anomaly decision for every paired source leg.  A retrospective
    diagnostic may still be represented, but it cannot cross the public gate.
    """

    endpoint_set_id: str
    membership_id: str
    member_set_sha256: str
    member_count: int
    catalog_snapshot_sha256: str
    start_date: date
    end_date: date
    start_eod_reduction_id: str
    start_eod_sha256: str
    start_eod_reduced_at: datetime
    end_eod_reduction_id: str
    end_eod_sha256: str
    end_eod_reduced_at: datetime
    anomaly_policy_id: str
    anomaly_assessment_set_sha256: str
    source_leg_set_sha256: str
    available_at: datetime
    knowledge_mode: str
    identity_history_sha256: str | None = None
    identity_history: TrendingIdentityHistory | None = None

    def __post_init__(self) -> None:
        require((self.identity_history is None) == (self.identity_history_sha256 is None),
                "D3_EVIDENCE_IDENTITY_HISTORY_PAIR")
        if self.identity_history is not None:
            require(isinstance(self.identity_history, TrendingIdentityHistory), "D3_EVIDENCE_IDENTITY_HISTORY_TYPE")
            require(self.identity_history.history_sha256 == self.identity_history_sha256,
                    "D3_EVIDENCE_IDENTITY_HISTORY_HASH")
            require(self.identity_history.assembled_at <= self.available_at, "D3_EVIDENCE_BEFORE_IDENTITY_ASSEMBLY")
        for value, code in (
            (self.endpoint_set_id, "D3_EVIDENCE_ENDPOINT_SET"),
            (self.membership_id, "D3_EVIDENCE_MEMBERSHIP"),
            (self.member_set_sha256, "D3_EVIDENCE_MEMBER_SET"),
            (self.catalog_snapshot_sha256, "D3_EVIDENCE_CATALOG_SNAPSHOT"),
            (self.start_eod_sha256, "D3_EVIDENCE_START_EOD_HASH"),
            (self.end_eod_sha256, "D3_EVIDENCE_END_EOD_HASH"),
            (self.anomaly_policy_id, "D3_EVIDENCE_ANOMALY_POLICY"),
            (self.anomaly_assessment_set_sha256, "D3_EVIDENCE_ANOMALY_SET"),
            (self.source_leg_set_sha256, "D3_EVIDENCE_LEG_SET"),
        ):
            require_sha256(value, code)
        require_text(self.start_eod_reduction_id, "D3_EVIDENCE_START_EOD_ID")
        require_text(self.end_eod_reduction_id, "D3_EVIDENCE_END_EOD_ID")
        _positive(self.member_count, "D3_EVIDENCE_MEMBER_COUNT")
        require(
            isinstance(self.start_date, date)
            and isinstance(self.end_date, date)
            and (self.end_date - self.start_date).days == 30,
            "D3_EVIDENCE_WINDOW",
        )
        start_reduced = _utc(self.start_eod_reduced_at, "D3_EVIDENCE_START_REDUCED")
        end_reduced = _utc(self.end_eod_reduced_at, "D3_EVIDENCE_END_REDUCED")
        available = _utc(self.available_at, "D3_EVIDENCE_AVAILABLE")
        require(start_reduced <= end_reduced <= available, "D3_EVIDENCE_CLOCK_ORDER")
        start_day_closed_at = datetime.combine(
            self.start_date + timedelta(days=1), time.min, tzinfo=UTC
        )
        end_day_closed_at = datetime.combine(
            self.end_date + timedelta(days=1), time.min, tzinfo=UTC
        )
        require(
            start_reduced >= start_day_closed_at
            and end_reduced >= end_day_closed_at,
            "D3_EVIDENCE_INCOMPLETE_EOD",
        )
        require(
            self.knowledge_mode in {"PROSPECTIVE_PIT", "RETROSPECTIVE_DIAGNOSTIC"},
            "D3_EVIDENCE_KNOWLEDGE_MODE",
        )

    def body_document(self) -> dict[str, Any]:
        return {
            "schema_version": TRENDING_WINDOW_EVIDENCE_SCHEMA,
            "endpoint_set_id": self.endpoint_set_id,
            "membership_id": self.membership_id,
            "member_set_sha256": self.member_set_sha256,
            "member_count": self.member_count,
            "catalog_snapshot_sha256": self.catalog_snapshot_sha256,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "start_eod": {
                "reduction_id": self.start_eod_reduction_id,
                "artifact_sha256": self.start_eod_sha256,
                "reduced_at": utc_timestamp_text(self.start_eod_reduced_at),
            },
            "end_eod": {
                "reduction_id": self.end_eod_reduction_id,
                "artifact_sha256": self.end_eod_sha256,
                "reduced_at": utc_timestamp_text(self.end_eod_reduced_at),
            },
            "anomaly_policy_id": self.anomaly_policy_id,
            "anomaly_assessment_set_sha256": self.anomaly_assessment_set_sha256,
            "source_leg_set_sha256": self.source_leg_set_sha256,
            "available_at": utc_timestamp_text(self.available_at),
            "knowledge_mode": self.knowledge_mode,
            "identity_history_sha256": self.identity_history_sha256,
            "identity_history": None if self.identity_history is None else self.identity_history.to_document(),
        }

    @property
    def window_evidence_id(self) -> str:
        return _document_id(self.body_document())

    def to_document(self) -> dict[str, Any]:
        return {"window_evidence_id": self.window_evidence_id, **self.body_document()}

    @classmethod
    def from_document(cls, value: Any) -> "TrendingWindowEvidence":
        document = require_exact_keys(
            value,
            {
                "window_evidence_id", "schema_version", "endpoint_set_id",
                "membership_id", "member_set_sha256", "member_count",
                "catalog_snapshot_sha256", "start_date", "end_date",
                "start_eod", "end_eod", "anomaly_policy_id",
                "anomaly_assessment_set_sha256", "source_leg_set_sha256",
                "available_at", "knowledge_mode", "identity_history_sha256", "identity_history",
            },
            "D3_EVIDENCE_DOCUMENT",
        )
        require(
            document["schema_version"] == TRENDING_WINDOW_EVIDENCE_SCHEMA,
            "D3_EVIDENCE_SCHEMA",
        )
        start_eod = require_exact_keys(
            document["start_eod"],
            {"reduction_id", "artifact_sha256", "reduced_at"},
            "D3_EVIDENCE_START_EOD",
        )
        end_eod = require_exact_keys(
            document["end_eod"],
            {"reduction_id", "artifact_sha256", "reduced_at"},
            "D3_EVIDENCE_END_EOD",
        )
        evidence = cls(
            endpoint_set_id=document["endpoint_set_id"],
            membership_id=document["membership_id"],
            member_set_sha256=document["member_set_sha256"],
            member_count=document["member_count"],
            catalog_snapshot_sha256=document["catalog_snapshot_sha256"],
            start_date=parse_date(document["start_date"], "D3_EVIDENCE_START_DATE"),
            end_date=parse_date(document["end_date"], "D3_EVIDENCE_END_DATE"),
            start_eod_reduction_id=start_eod["reduction_id"],
            start_eod_sha256=start_eod["artifact_sha256"],
            start_eod_reduced_at=parse_timestamp(
                start_eod["reduced_at"], "D3_EVIDENCE_START_REDUCED"
            ),
            end_eod_reduction_id=end_eod["reduction_id"],
            end_eod_sha256=end_eod["artifact_sha256"],
            end_eod_reduced_at=parse_timestamp(
                end_eod["reduced_at"], "D3_EVIDENCE_END_REDUCED"
            ),
            anomaly_policy_id=document["anomaly_policy_id"],
            anomaly_assessment_set_sha256=document["anomaly_assessment_set_sha256"],
            source_leg_set_sha256=document["source_leg_set_sha256"],
            available_at=parse_timestamp(document["available_at"], "D3_EVIDENCE_AVAILABLE"),
            knowledge_mode=document["knowledge_mode"],
            identity_history_sha256=document["identity_history_sha256"],
            identity_history=(None if document["identity_history"] is None else
                              TrendingIdentityHistory.from_document(document["identity_history"])),
        )
        require(evidence.to_document() == dict(document), "D3_EVIDENCE_IDENTITY")
        return evidence


@dataclass(frozen=True, slots=True)
class TrendingEvidenceRelease:
    """Independent reviewer release for one exact window and catalog publication."""

    release_code: str
    available_at: datetime
    window_evidence_id: str
    endpoint_set_id: str
    membership_id: str
    member_set_sha256: str
    expected_member_count: int
    catalog_publication_id: str
    catalog_snapshot_sha256: str
    catalog_member_set_sha256: str
    start_eod_sha256: str
    start_eod_reduced_at: datetime
    end_eod_sha256: str
    end_eod_reduced_at: datetime
    anomaly_policy_id: str
    anomaly_assessment_set_sha256: str
    source_leg_set_sha256: str
    eod_proofs_approved: bool
    anomaly_policy_approved: bool
    pit_membership_approved: bool

    def __post_init__(self) -> None:
        require_text(self.release_code, "D3_EVIDENCE_RELEASE_CODE")
        _utc(self.available_at, "D3_EVIDENCE_RELEASE_AVAILABLE")
        for value, code in (
            (self.window_evidence_id, "D3_EVIDENCE_RELEASE_WINDOW"),
            (self.endpoint_set_id, "D3_EVIDENCE_RELEASE_ENDPOINT"),
            (self.membership_id, "D3_EVIDENCE_RELEASE_MEMBERSHIP"),
            (self.member_set_sha256, "D3_EVIDENCE_RELEASE_MEMBER_SET"),
            (self.catalog_publication_id, "D3_EVIDENCE_RELEASE_CATALOG_PUBLICATION"),
            (self.catalog_snapshot_sha256, "D3_EVIDENCE_RELEASE_CATALOG_SNAPSHOT"),
            (self.catalog_member_set_sha256, "D3_EVIDENCE_RELEASE_CATALOG_MEMBER_SET"),
            (self.start_eod_sha256, "D3_EVIDENCE_RELEASE_START_EOD"),
            (self.end_eod_sha256, "D3_EVIDENCE_RELEASE_END_EOD"),
            (self.anomaly_policy_id, "D3_EVIDENCE_RELEASE_ANOMALY_POLICY"),
            (self.anomaly_assessment_set_sha256, "D3_EVIDENCE_RELEASE_ANOMALY_SET"),
            (self.source_leg_set_sha256, "D3_EVIDENCE_RELEASE_LEG_SET"),
        ):
            require_sha256(value, code)
        start_reduced = _utc(
            self.start_eod_reduced_at, "D3_EVIDENCE_RELEASE_START_REDUCED"
        )
        end_reduced = _utc(
            self.end_eod_reduced_at, "D3_EVIDENCE_RELEASE_END_REDUCED"
        )
        require(
            start_reduced <= end_reduced <= self.available_at,
            "D3_EVIDENCE_RELEASE_CLOCK_ORDER",
        )
        _positive(self.expected_member_count, "D3_EVIDENCE_RELEASE_MEMBER_COUNT")
        require(
            type(self.eod_proofs_approved) is bool
            and type(self.anomaly_policy_approved) is bool
            and type(self.pit_membership_approved) is bool,
            "D3_EVIDENCE_RELEASE_APPROVAL_TYPE",
        )

    def body_document(self) -> dict[str, Any]:
        return {
            "schema_version": TRENDING_EVIDENCE_RELEASE_SCHEMA,
            "release_code": self.release_code,
            "available_at": utc_timestamp_text(self.available_at),
            "window_evidence_id": self.window_evidence_id,
            "endpoint_set_id": self.endpoint_set_id,
            "membership_id": self.membership_id,
            "member_set_sha256": self.member_set_sha256,
            "expected_member_count": self.expected_member_count,
            "catalog_publication_id": self.catalog_publication_id,
            "catalog_snapshot_sha256": self.catalog_snapshot_sha256,
            "catalog_member_set_sha256": self.catalog_member_set_sha256,
            "start_eod_sha256": self.start_eod_sha256,
            "start_eod_reduced_at": utc_timestamp_text(self.start_eod_reduced_at),
            "end_eod_sha256": self.end_eod_sha256,
            "end_eod_reduced_at": utc_timestamp_text(self.end_eod_reduced_at),
            "anomaly_policy_id": self.anomaly_policy_id,
            "anomaly_assessment_set_sha256": self.anomaly_assessment_set_sha256,
            "source_leg_set_sha256": self.source_leg_set_sha256,
            "eod_proofs_approved": self.eod_proofs_approved,
            "anomaly_policy_approved": self.anomaly_policy_approved,
            "pit_membership_approved": self.pit_membership_approved,
        }

    @property
    def release_id(self) -> str:
        return _document_id(self.body_document())

    def to_document(self) -> dict[str, Any]:
        return {"evidence_release_id": self.release_id, **self.body_document()}

    @classmethod
    def from_document(cls, value: Any) -> "TrendingEvidenceRelease":
        document = require_exact_keys(
            value,
            {
                "evidence_release_id", "schema_version", "release_code",
                "available_at", "window_evidence_id", "endpoint_set_id",
                "membership_id", "member_set_sha256", "expected_member_count",
                "catalog_publication_id", "catalog_snapshot_sha256",
                "catalog_member_set_sha256", "start_eod_sha256",
                "start_eod_reduced_at", "end_eod_sha256",
                "end_eod_reduced_at", "anomaly_policy_id",
                "anomaly_assessment_set_sha256", "source_leg_set_sha256",
                "eod_proofs_approved",
                "anomaly_policy_approved", "pit_membership_approved",
            },
            "D3_EVIDENCE_RELEASE_DOCUMENT",
        )
        require(
            document["schema_version"] == TRENDING_EVIDENCE_RELEASE_SCHEMA,
            "D3_EVIDENCE_RELEASE_SCHEMA",
        )
        release = cls(
            release_code=document["release_code"],
            available_at=parse_timestamp(
                document["available_at"], "D3_EVIDENCE_RELEASE_AVAILABLE"
            ),
            window_evidence_id=document["window_evidence_id"],
            endpoint_set_id=document["endpoint_set_id"],
            membership_id=document["membership_id"],
            member_set_sha256=document["member_set_sha256"],
            expected_member_count=document["expected_member_count"],
            catalog_publication_id=document["catalog_publication_id"],
            catalog_snapshot_sha256=document["catalog_snapshot_sha256"],
            catalog_member_set_sha256=document["catalog_member_set_sha256"],
            start_eod_sha256=document["start_eod_sha256"],
            start_eod_reduced_at=parse_timestamp(
                document["start_eod_reduced_at"],
                "D3_EVIDENCE_RELEASE_START_REDUCED",
            ),
            end_eod_sha256=document["end_eod_sha256"],
            end_eod_reduced_at=parse_timestamp(
                document["end_eod_reduced_at"],
                "D3_EVIDENCE_RELEASE_END_REDUCED",
            ),
            anomaly_policy_id=document["anomaly_policy_id"],
            anomaly_assessment_set_sha256=document[
                "anomaly_assessment_set_sha256"
            ],
            source_leg_set_sha256=document["source_leg_set_sha256"],
            eod_proofs_approved=document["eod_proofs_approved"],
            anomaly_policy_approved=document["anomaly_policy_approved"],
            pit_membership_approved=document["pit_membership_approved"],
        )
        require(release.to_document() == dict(document), "D3_EVIDENCE_RELEASE_IDENTITY")
        return release


@dataclass(frozen=True, slots=True)
class TrendingSourceLeg:
    analysis_unit_id: str
    source_code: str
    start_date: date
    end_date: date
    start_cny_minor: int
    end_cny_minor: int
    start_fact_id: str
    end_fact_id: str
    available_at: datetime
    anomaly_status: TrendingAnomalyStatus
    anomaly_assessment_id: str
    endpoint_observed_at: datetime | None = None
    economic_identity_sha256: str | None = None
    identity_binding_sha256: str | None = None
    identity_binding: Mapping[str, Any] | None = None

    def __post_init__(self) -> None:
        require_text(self.analysis_unit_id, "D3_LEG_MEMBER")
        require(self.source_code in EXPECTED_SOURCES, "D3_LEG_SOURCE")
        require(isinstance(self.start_date, date) and isinstance(self.end_date, date), "D3_LEG_DATE")
        require((self.end_date - self.start_date).days == 30, "D3_LEG_HORIZON")
        for value in (self.start_cny_minor, self.end_cny_minor):
            require(isinstance(value, int) and not isinstance(value, bool) and value >= 0, "D3_LEG_PRICE")
        require_sha256(self.start_fact_id, "D3_LEG_START_FACT")
        require_sha256(self.end_fact_id, "D3_LEG_END_FACT")
        _utc(self.available_at, "D3_LEG_AVAILABLE_AT")
        require(isinstance(self.anomaly_status, TrendingAnomalyStatus), "D3_LEG_ANOMALY")
        require_sha256(
            self.anomaly_assessment_id,
            "D3_LEG_ANOMALY_ASSESSMENT",
        )
        if self.endpoint_observed_at is not None:
            _utc(self.endpoint_observed_at, "D3_LEG_ENDPOINT_OBSERVED_AT")
        if self.economic_identity_sha256 is not None:
            require_sha256(self.economic_identity_sha256, "D3_LEG_ECONOMIC_IDENTITY")
        require((self.identity_binding is None) == (self.identity_binding_sha256 is None),
                "D3_LEG_IDENTITY_BINDING_PAIR")
        if self.identity_binding is not None:
            payload = canonical_json_bytes(dict(self.identity_binding))
            require(sha256_hex(payload) == self.identity_binding_sha256, "D3_LEG_IDENTITY_BINDING_HASH")
            binding = strict_json_bytes(payload, "D3_LEG_BINDING_JSON")
            for side, fact_id, day, price in (("start", self.start_fact_id, self.start_date, self.start_cny_minor),
                                            ("end", self.end_fact_id, self.end_date, self.end_cny_minor)):
                receipt = binding[side]
                projection = receipt["projection"]
                require(receipt["projection_sha256"] == projection["document_hash"] == fact_id
                        and projection["source"]["analysis_unit_id"] == self.analysis_unit_id
                        and projection["source"]["logical_source"] == self.source_code
                        and projection["source"]["price_kind"] == "ASK"
                        and projection["event_day"] == day.isoformat()
                        and int(projection["target"]["value"]) == price
                        and receipt["economic_identity_sha256"] == self.economic_identity_sha256,
                        "D3_LEG_IDENTITY_BINDING_CONTENT")
            object.__setattr__(self, "identity_binding", binding)

    @property
    def change(self) -> Fraction | None:
        if self.start_cny_minor <= 0:
            return None
        return Fraction(self.end_cny_minor - self.start_cny_minor, self.start_cny_minor)

    def to_document(self) -> dict[str, Any]:
        change = self.change
        binding = None
        if self.identity_binding is not None:
            payload = canonical_json_bytes(dict(self.identity_binding))
            require(sha256_hex(payload) == self.identity_binding_sha256, "D3_LEG_IDENTITY_BINDING_HASH")
            binding = strict_json_bytes(payload, "D3_LEG_BINDING_JSON")
        return {
            "analysis_unit_id": self.analysis_unit_id,
            "source_code": self.source_code,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "start_cny_minor": self.start_cny_minor,
            "end_cny_minor": self.end_cny_minor,
            "start_fact_id": self.start_fact_id,
            "end_fact_id": self.end_fact_id,
            "available_at": utc_timestamp_text(self.available_at),
            "anomaly_status": self.anomaly_status.value,
            "anomaly_assessment_id": self.anomaly_assessment_id,
            "endpoint_observed_at": (
                None if self.endpoint_observed_at is None
                else utc_timestamp_text(self.endpoint_observed_at)
            ),
            "economic_identity_sha256": self.economic_identity_sha256,
            "identity_binding_sha256": self.identity_binding_sha256,
            "identity_binding": binding,
            "change_numerator": None if change is None else change.numerator,
            "change_denominator": None if change is None else change.denominator,
            "change_ratio": None if change is None else _ratio_text(change),
        }


@dataclass(frozen=True, slots=True)
class TrendingCandidateLedger:
    profile: TrendingNumericProfile
    membership: TrendingMembership
    window_evidence: TrendingWindowEvidence | None
    result_as_of: date
    evaluated_at: datetime
    measurements: tuple[Mapping[str, Any], ...]
    run_document: Mapping[str, Any]

    def __post_init__(self) -> None:
        require(isinstance(self.profile, TrendingNumericProfile), "D3_LEDGER_PROFILE")
        require(isinstance(self.membership, TrendingMembership), "D3_LEDGER_MEMBERSHIP")
        require(
            self.window_evidence is None
            or isinstance(self.window_evidence, TrendingWindowEvidence),
            "D3_LEDGER_WINDOW_EVIDENCE",
        )
        require(isinstance(self.result_as_of, date), "D3_LEDGER_AS_OF")
        _utc(self.evaluated_at, "D3_LEDGER_EVALUATED_AT")
        require(
            len(self.measurements) == len(self.membership.members)
            and [row["analysis_unit_id"] for row in self.measurements]
            == [member.analysis_unit_id for member in self.membership.members],
            "D3_LEDGER_COMPLETE_MEMBER_ACCOUNTING",
        )


def _measurement(
    *,
    analysis_unit_id: str,
    profile: TrendingNumericProfile,
    membership_id: str,
    result_as_of: date,
    evaluated_at: datetime,
    legs: tuple[TrendingSourceLeg, ...],
    window_evidence: TrendingWindowEvidence | None,
    expected_economic_identity_sha256: str | None,
    expected_sources: tuple[str, ...] = EXPECTED_SOURCES,
) -> dict[str, Any]:
    status = TrendingMeasurementStatus.INSUFFICIENT_THREE_SOURCES
    direction: TrendingDirection | None = None
    selected_source: str | None = None
    score: Fraction | None = None

    require(len(expected_sources) in (2, 3) and tuple(sorted(set(expected_sources))) == expected_sources
            and set(expected_sources) <= set(EXPECTED_SOURCES), "D3_MEASUREMENT_SOURCE_SET")
    if len(legs) == len(expected_sources):
        if (
            tuple(leg.source_code for leg in legs) != expected_sources
            or any(leg.analysis_unit_id != analysis_unit_id for leg in legs)
            or expected_economic_identity_sha256 is None
            or any(
                leg.economic_identity_sha256 != expected_economic_identity_sha256
                for leg in legs
            )
        ):
            status = TrendingMeasurementStatus.CONTRACT_MISMATCH
        elif any(leg.end_date != result_as_of for leg in legs):
            status = TrendingMeasurementStatus.TEMPORAL_VIOLATION
        elif any(
            leg.endpoint_observed_at is None
            or leg.endpoint_observed_at != _utc_day_closed_at(leg.end_date)
            for leg in legs
        ):
            status = TrendingMeasurementStatus.CONTRACT_MISMATCH
        elif any(
            leg.available_at > evaluated_at
            or leg.endpoint_observed_at > evaluated_at
            or leg.available_at < leg.endpoint_observed_at
            for leg in legs
        ):
            status = TrendingMeasurementStatus.TEMPORAL_VIOLATION
        elif (
            window_evidence is None
            or window_evidence.knowledge_mode != "PROSPECTIVE_PIT"
            or window_evidence.identity_history_sha256 is None
            or any(leg.identity_binding_sha256 is None for leg in legs)
        ):
            status = TrendingMeasurementStatus.WITHHELD_WINDOW_EVIDENCE
        elif window_evidence.end_eod_reduced_at > evaluated_at:
            status = TrendingMeasurementStatus.TEMPORAL_VIOLATION
        elif (
            evaluated_at - _utc_day_closed_at(result_as_of)
        ).total_seconds() > profile.endpoint_freshness_seconds:
            status = TrendingMeasurementStatus.STALE_ENDPOINT
        elif any(
            leg.anomaly_status is TrendingAnomalyStatus.UNKNOWN for leg in legs
        ):
            status = TrendingMeasurementStatus.WITHHELD_ANOMALY_UNKNOWN
        elif any(
            leg.anomaly_status is TrendingAnomalyStatus.FLAGGED for leg in legs
        ):
            status = TrendingMeasurementStatus.WITHHELD_ANOMALY
        elif any(leg.change is None or leg.change == 0 for leg in legs):
            status = TrendingMeasurementStatus.FLAT_OR_ZERO_CONFLICT
        else:
            changes = tuple(leg.change for leg in legs)
            assert all(change is not None for change in changes)
            typed_changes = tuple(change for change in changes if change is not None)
            signs = {1 if value > 0 else -1 for value in typed_changes}
            if len(signs) != 1:
                status = TrendingMeasurementStatus.CONFLICTED_DIRECTION
            elif (
                min(min(leg.start_cny_minor, leg.end_cny_minor) for leg in legs)
                < profile.minimum_endpoint_cny_minor
                or min(abs(leg.end_cny_minor - leg.start_cny_minor) for leg in legs)
                < profile.minimum_abs_leg_delta_cny_minor
            ):
                status = TrendingMeasurementStatus.WITHHELD_MICROPRICE
            else:
                status = TrendingMeasurementStatus.ELIGIBLE_A3
                direction = (
                    TrendingDirection.GAINERS
                    if typed_changes[0] > 0
                    else TrendingDirection.LOSERS
                )
                if direction is TrendingDirection.GAINERS:
                    selected_index = min(range(len(legs)), key=lambda index: (typed_changes[index], legs[index].source_code))
                else:
                    selected_index = max(range(len(legs)), key=lambda index: (typed_changes[index], legs[index].source_code))
                selected_source = legs[selected_index].source_code
                score = typed_changes[selected_index]

    body = {
        "schema_version": TRENDING_MEASUREMENT_SCHEMA,
        "producer_version": TRENDING_FORMAL_PRODUCER_VERSION,
        "numeric_profile_id": profile.profile_id,
        "membership_id": membership_id,
        "analysis_unit_id": analysis_unit_id,
        "result_as_of": result_as_of.isoformat(),
        "evaluated_at": utc_timestamp_text(evaluated_at),
        "analysis_currency": "CNY",
        "price_scale": 2,
        "method_id": "M3",
        "segment": "A_THREE_SOURCE",
        "horizon_days": 30,
        "status": status.value,
        "direction": None if direction is None else direction.value,
        "conservative_source_code": selected_source,
        "conservative_change_numerator": None if score is None else score.numerator,
        "conservative_change_denominator": None if score is None else score.denominator,
        "conservative_same_direction_change_floor_ratio": None if score is None else _ratio_text(score),
        "source_legs": [leg.to_document() for leg in legs],
    }
    return {"measurement_id": _document_id(body), **body}


def _rankings(measurements: Iterable[Mapping[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    eligible = [
        row for row in measurements
        if row["status"] == TrendingMeasurementStatus.ELIGIBLE_A3.value
    ]

    def score(row: Mapping[str, Any]) -> Fraction:
        return Fraction(
            row["conservative_change_numerator"],
            row["conservative_change_denominator"],
        )

    answer: dict[str, list[dict[str, Any]]] = {}
    for direction in TrendingDirection:
        selected = [row for row in eligible if row["direction"] == direction.value]
        selected.sort(
            key=(
                (lambda row: (-score(row), row["analysis_unit_id"]))
                if direction is TrendingDirection.GAINERS
                else (lambda row: (score(row), row["analysis_unit_id"]))
            )
        )
        answer[direction.value] = [
            {
                "rank": rank,
                "analysis_unit_id": row["analysis_unit_id"],
                "measurement_id": row["measurement_id"],
                "score_numerator": row["conservative_change_numerator"],
                "score_denominator": row["conservative_change_denominator"],
            }
            for rank, row in enumerate(selected, 1)
        ]
    return answer


def build_trending_candidate_ledger(
    *,
    profile: TrendingNumericProfile,
    membership: TrendingMembership,
    source_legs: Iterable[TrendingSourceLeg],
    result_as_of: date,
    evaluated_at: datetime,
    window_evidence: TrendingWindowEvidence | None = None,
) -> TrendingCandidateLedger:
    """Build the complete private D3 ledger and exact ranking references."""

    require(isinstance(profile, TrendingNumericProfile), "D3_BUILD_PROFILE")
    require(isinstance(membership, TrendingMembership), "D3_BUILD_MEMBERSHIP")
    require(isinstance(result_as_of, date), "D3_BUILD_AS_OF")
    evaluated_at = _utc(evaluated_at, "D3_BUILD_EVALUATED_AT")
    require(profile.available_at <= evaluated_at, "D3_PROFILE_NOT_KNOWN")
    require(membership.available_at <= evaluated_at, "D3_MEMBERSHIP_NOT_KNOWN")

    start_date = result_as_of - timedelta(days=30)
    if window_evidence is not None:
        require(
            window_evidence.membership_id == membership.membership_id
            and window_evidence.member_set_sha256 == membership.member_set_sha256
            and window_evidence.member_count == len(membership.members)
            and window_evidence.catalog_snapshot_sha256
            == membership.catalog_snapshot_sha256,
            "D3_WINDOW_MEMBERSHIP_BINDING",
        )
        require(
            window_evidence.start_date == start_date
            and window_evidence.end_date == result_as_of,
            "D3_WINDOW_DATE_BINDING",
        )
        require(window_evidence.available_at <= evaluated_at, "D3_WINDOW_NOT_KNOWN")
        # This membership binds the current presentation snapshot. Its later
        # name/media knowledge is not a historical economic identity clock.
        # The endpoint adapter verifies the original source's economic proof;
        # this layer still requires exact fingerprints and explicit PIT release.

    known_ids = {member.analysis_unit_id for member in membership.members}
    grouped: dict[str, list[TrendingSourceLeg]] = defaultdict(list)
    identities: set[tuple[str, str]] = set()
    materialized_legs = tuple(source_legs)
    for leg in materialized_legs:
        require(isinstance(leg, TrendingSourceLeg), "D3_BUILD_LEG_TYPE")
        require(leg.analysis_unit_id in known_ids, "D3_LEG_OUTSIDE_MEMBERSHIP")
        identity = (leg.analysis_unit_id, leg.source_code)
        require(identity not in identities, "D3_DUPLICATE_SOURCE_LEG")
        if window_evidence is not None and window_evidence.identity_history is not None:
            if leg.identity_binding is not None:
                window_evidence.identity_history.validate_binding(leg.identity_binding)
                for endpoint, digest in (("start", window_evidence.start_eod_sha256),
                                         ("end", window_evidence.end_eod_sha256)):
                    require(leg.identity_binding[endpoint]["projection"]["observation"]["reduction_sha256"]
                            == digest, "D3_IDENTITY_WINDOW_EOD_BINDING")
        identities.add(identity)
        grouped[leg.analysis_unit_id].append(leg)

    ordered_legs = tuple(
        sorted(materialized_legs, key=lambda leg: (leg.analysis_unit_id, leg.source_code))
    )
    source_leg_set_sha256 = _set_hash(leg.to_document() for leg in ordered_legs)
    if window_evidence is not None:
        require(
            window_evidence.source_leg_set_sha256 == source_leg_set_sha256,
            "D3_WINDOW_LEG_SET_BINDING",
        )
        require(
            window_evidence.available_at >= max(
                membership.available_at,
                window_evidence.start_eod_reduced_at,
                window_evidence.end_eod_reduced_at,
                *(leg.available_at for leg in ordered_legs),
            ),
            "D3_WINDOW_BEFORE_INPUTS",
        )

    membership_id = membership.membership_id
    measurements = tuple(
        _measurement(
            analysis_unit_id=member.analysis_unit_id,
            profile=profile,
            membership_id=membership_id,
            result_as_of=result_as_of,
            evaluated_at=evaluated_at,
            legs=tuple(sorted(grouped[member.analysis_unit_id], key=lambda leg: leg.source_code)),
            window_evidence=window_evidence,
            expected_economic_identity_sha256=(
                (member.economic_identity or {}).get("fingerprint_sha256")
            ),
        )
        for member in membership.members
    )
    counts = Counter(row["status"] for row in measurements)
    direction_eligible = counts[TrendingMeasurementStatus.ELIGIBLE_A3.value]
    # Input quality is independent of a market moving in the same direction.
    # Flat, conflicting and micro-price results may have perfectly valid inputs.
    # UNKNOWN/flagged/stale/unproven inputs must never count as qualified.
    qualified_statuses = {
        TrendingMeasurementStatus.ELIGIBLE_A3.value,
        TrendingMeasurementStatus.CONFLICTED_DIRECTION.value,
        TrendingMeasurementStatus.FLAT_OR_ZERO_CONFLICT.value,
        TrendingMeasurementStatus.WITHHELD_MICROPRICE.value,
    }
    qualified_three_source_endpoint_count = sum(
        row["status"] in qualified_statuses
        and all(
            leg["start_cny_minor"] > 0 and leg["end_cny_minor"] > 0
            for leg in row["source_legs"]
        )
        for row in measurements
    )
    three_source_endpoint_count = sum(
        len(grouped[member.analysis_unit_id]) == len(EXPECTED_SOURCES)
        and tuple(
            sorted(leg.source_code for leg in grouped[member.analysis_unit_id])
        )
        == EXPECTED_SOURCES
        for member in membership.members
    )
    candidate_status = (
        TrendingCandidateStatus.INTERNAL_CANDIDATE
        if direction_eligible
        and window_evidence is not None
        and window_evidence.knowledge_mode == "PROSPECTIVE_PIT"
        else TrendingCandidateStatus.WITHHELD_NO_DIRECTION_ELIGIBLE
    )
    rankings = _rankings(measurements)
    latest_input = max(
        [membership.available_at, profile.available_at]
        + ([] if window_evidence is None else [window_evidence.available_at])
        + [leg.available_at for members in grouped.values() for leg in members]
    )
    body = {
        "schema_version": TRENDING_CANDIDATE_LEDGER_SCHEMA,
        "producer_version": TRENDING_FORMAL_PRODUCER_VERSION,
        "numeric_profile_id": profile.profile_id,
        "window_evidence_id": (
            None if window_evidence is None else window_evidence.window_evidence_id
        ),
        "knowledge_mode": (
            "UNPROVEN"
            if window_evidence is None
            else window_evidence.knowledge_mode
        ),
        "membership_id": membership_id,
        "member_set_sha256": membership.member_set_sha256,
        "catalog_snapshot_sha256": membership.catalog_snapshot_sha256,
        "catalog_version": membership.catalog_version,
        "result_as_of": result_as_of.isoformat(),
        "input_available_at": utc_timestamp_text(latest_input),
        "evaluated_at": utc_timestamp_text(evaluated_at),
        "member_count": len(measurements),
        "measurement_set_sha256": _set_hash(measurements),
        "three_source_endpoint_count": three_source_endpoint_count,
        "three_source_endpoint_ratio_bps": (
            three_source_endpoint_count * 10_000 // len(measurements)
        ),
        "direction_eligible_count": direction_eligible,
        "qualified_three_source_endpoint_count": qualified_three_source_endpoint_count,
        "qualified_three_source_endpoint_ratio_bps": (
            qualified_three_source_endpoint_count * 10_000 // len(measurements)
        ),
        "direction_eligible_ratio_bps": (
            direction_eligible * 10_000 // len(measurements)
        ),
        # Compatibility aliases are retained in the private ledger only.  The
        # v2 public contract exposes the two denominators by their exact names.
        "eligible_count": direction_eligible,
        "excluded_count": len(measurements) - direction_eligible,
        "status_counts": {
            status.value: counts.get(status.value, 0)
            for status in TrendingMeasurementStatus
        },
        "candidate_status": candidate_status.value,
        "rankings": rankings,
        "formal_publication_eligible": False,
        "public_state_published": False,
    }
    run_document = {"candidate_ledger_id": _document_id(body), **body}
    return TrendingCandidateLedger(
        profile=profile,
        membership=membership,
        window_evidence=window_evidence,
        result_as_of=result_as_of,
        evaluated_at=evaluated_at,
        measurements=measurements,
        run_document=run_document,
    )


@dataclass(frozen=True, slots=True)
class TrendingPublicationRelease:
    release_code: str
    available_at: datetime
    algorithm_version: str
    data_quality_policy_version: str
    expected_member_count: int
    pit_membership_approved: bool
    freshness_policy_approved: bool
    coverage_policy_approved: bool
    minimum_three_source_endpoint_ratio_bps: int
    minimum_direction_eligible_ratio_bps: int
    freshness_seconds: int
    retention_seconds: int
    public_top_n_per_direction: int = 50
    # None is an undecided policy, never an implicit zero or the old presence gate.
    minimum_qualified_three_source_endpoint_ratio_bps: int | None = None

    def __post_init__(self) -> None:
        for value, code in (
            (self.release_code, "D3_RELEASE_CODE"),
            (self.algorithm_version, "D3_RELEASE_ALGORITHM"),
            (self.data_quality_policy_version, "D3_RELEASE_QUALITY"),
        ):
            require_text(value, code)
        _utc(self.available_at, "D3_RELEASE_AVAILABLE_AT")
        _positive(self.expected_member_count, "D3_RELEASE_MEMBERS")
        require(
            type(self.pit_membership_approved) is bool
            and type(self.freshness_policy_approved) is bool
            and type(self.coverage_policy_approved) is bool,
            "D3_RELEASE_GATE_TYPE",
        )
        for value, code in (
            (
                self.minimum_three_source_endpoint_ratio_bps,
                "D3_RELEASE_THREE_SOURCE_BPS",
            ),
            (
                self.minimum_direction_eligible_ratio_bps,
                "D3_RELEASE_DIRECTION_ELIGIBLE_BPS",
            ),
        ):
            require(
                isinstance(value, int)
                and not isinstance(value, bool)
                and 0 <= value <= 10_000,
                code,
            )
        _positive(self.freshness_seconds, "D3_RELEASE_FRESHNESS", maximum=31_536_000)
        if self.minimum_qualified_three_source_endpoint_ratio_bps is not None:
            require(
                type(self.minimum_qualified_three_source_endpoint_ratio_bps) is int
                and 0 <= self.minimum_qualified_three_source_endpoint_ratio_bps <= 10_000,
                "D3_RELEASE_QUALIFIED_THREE_SOURCE_BPS",
            )
        _positive(self.retention_seconds, "D3_RELEASE_RETENTION", maximum=63_072_000)
        require(self.retention_seconds >= self.freshness_seconds, "D3_RELEASE_CLOCK_RANGE")
        _positive(
            self.public_top_n_per_direction,
            "D3_RELEASE_PUBLIC_TOP_N",
            maximum=50,
        )

    def body_document(self) -> dict[str, Any]:
        return {
            "release_code": self.release_code,
            "available_at": utc_timestamp_text(self.available_at),
            "algorithm_version": self.algorithm_version,
            "data_quality_policy_version": self.data_quality_policy_version,
            "expected_member_count": self.expected_member_count,
            "pit_membership_approved": self.pit_membership_approved,
            "freshness_policy_approved": self.freshness_policy_approved,
            "coverage_policy_approved": self.coverage_policy_approved,
            "minimum_qualified_three_source_endpoint_ratio_bps": (
                self.minimum_qualified_three_source_endpoint_ratio_bps
            ),
            "minimum_three_source_endpoint_ratio_bps": (
                self.minimum_three_source_endpoint_ratio_bps
            ),
            "minimum_direction_eligible_ratio_bps": (
                self.minimum_direction_eligible_ratio_bps
            ),
            "freshness_seconds": self.freshness_seconds,
            "retention_seconds": self.retention_seconds,
            "public_top_n_per_direction": self.public_top_n_per_direction,
        }

    @property
    def release_id(self) -> str:
        return _document_id(self.body_document())


class TrendingPublicationBlocked(TrendingContractError):
    def __init__(self, gates: Iterable[TrendingPublicGate]) -> None:
        self.gates = tuple(sorted(set(gates), key=lambda gate: gate.value))
        super().__init__("D3_PUBLICATION_BLOCKED:" + ",".join(gate.value for gate in self.gates))


@dataclass(frozen=True, slots=True)
class TrendingPublicCandidate:
    manifest: Mapping[str, Any]
    members: tuple[Mapping[str, Any], ...]


def build_trending_public_candidate(
    *,
    ledger: TrendingCandidateLedger,
    release: TrendingPublicationRelease,
    rights: TrendingRightsRelease,
    evidence_release: TrendingEvidenceRelease,
    catalog_descriptor: Mapping[str, Any],
    catalog_documents: Mapping[str, Mapping[str, Any]],
    public_available_at: datetime,
    supersedes_publication_id: str | None = None,
    tiered_candidate: Any = None,
) -> TrendingPublicCandidate:
    """Cross the public boundary only when every independently released gate passes."""

    public_available_at = _utc(public_available_at, "D3_PUBLIC_AVAILABLE_AT")
    run = dict(ledger.run_document)
    measured_rows = ledger.measurements
    if tiered_candidate is not None:
        from .tiered import validate_tiered_candidate
        require(tiered_candidate.baseline is ledger, "TIER_PUBLIC_BASELINE")
        validate_tiered_candidate(tiered_candidate)
        tiered = tiered_candidate.document
        run.update(tiered["accounting"])
        run.update(candidate_ledger_id=tiered["candidate_id"], measurement_set_sha256=tiered["measurement_set_sha256"],
                   rankings=tiered["rankings"], candidate_status=(TrendingCandidateStatus.INTERNAL_CANDIDATE.value
                   if tiered["eligible_count"] else TrendingCandidateStatus.WITHHELD_NO_DIRECTION_ELIGIBLE.value))
        measured_rows = tuple(tiered["measurements"])
    gates: list[TrendingPublicGate] = []
    if tiered_candidate is not None:
        policy = tiered_candidate.policy
        if not policy.formal_policy_approved:
            gates.append(TrendingPublicGate.NUMERIC_PROFILE_WITHHELD)
        if policy.minimum_supported_endpoint_ratio_bps is None or run["qualified_supported_endpoint_ratio_bps"] < policy.minimum_supported_endpoint_ratio_bps:
            gates.append(TrendingPublicGate.COVERAGE_WITHHELD)
    if not ledger.profile.formal_numeric_profile_approved:
        gates.append(TrendingPublicGate.NUMERIC_PROFILE_WITHHELD)
    if not ledger.profile.prospective_validation_approved:
        gates.append(TrendingPublicGate.PROSPECTIVE_VALIDATION_WITHHELD)
    if not rights.public_derived_trending_allowed:
        gates.append(TrendingPublicGate.RIGHTS_WITHHELD)
    if not release.pit_membership_approved or len(ledger.measurements) != release.expected_member_count:
        gates.append(TrendingPublicGate.PIT_MEMBERSHIP_WITHHELD)
    if not release.freshness_policy_approved:
        gates.append(TrendingPublicGate.FRESHNESS_WITHHELD)
    if (
        not release.coverage_policy_approved
        or release.minimum_qualified_three_source_endpoint_ratio_bps is None
        or run["qualified_three_source_endpoint_ratio_bps"]
        < release.minimum_qualified_three_source_endpoint_ratio_bps
    ):
        gates.append(TrendingPublicGate.COVERAGE_WITHHELD)
    if ledger.window_evidence is None:
        gates.append(TrendingPublicGate.WINDOW_EVIDENCE_WITHHELD)
    else:
        if (
            evidence_release.window_evidence_id
            != ledger.window_evidence.window_evidence_id
            or not evidence_release.eod_proofs_approved
        ):
            gates.append(TrendingPublicGate.WINDOW_EVIDENCE_WITHHELD)
        if not evidence_release.anomaly_policy_approved:
            gates.append(TrendingPublicGate.ANOMALY_POLICY_WITHHELD)
        if (
            not evidence_release.pit_membership_approved
            or ledger.window_evidence.knowledge_mode != "PROSPECTIVE_PIT"
            or ledger.window_evidence.identity_history is None
        ):
            gates.append(TrendingPublicGate.PIT_MEMBERSHIP_WITHHELD)
    if (
        run["three_source_endpoint_ratio_bps"]
        < release.minimum_three_source_endpoint_ratio_bps
        or run["direction_eligible_ratio_bps"]
        < release.minimum_direction_eligible_ratio_bps
    ):
        gates.append(TrendingPublicGate.COVERAGE_WITHHELD)
    if run["candidate_status"] != TrendingCandidateStatus.INTERNAL_CANDIDATE.value:
        gates.append(TrendingPublicGate.CANDIDATE_WITHHELD)
    if gates:
        raise TrendingPublicationBlocked(gates)
    require(rights.allowed_public_source_codes == EXPECTED_SOURCES, "D3_PUBLIC_SOURCE_RIGHTS")
    require(
        release.public_top_n_per_direction
        <= rights.maximum_public_members_per_direction
        <= 50,
        "D3_PUBLIC_RIGHTS_TOP_N",
    )
    require(release.available_at <= public_available_at, "D3_RELEASE_NOT_KNOWN")
    require(rights.available_at <= public_available_at, "D3_RIGHTS_NOT_KNOWN")
    require(
        evidence_release.available_at <= public_available_at,
        "D3_EVIDENCE_RELEASE_NOT_KNOWN",
    )
    require(ledger.evaluated_at <= public_available_at, "D3_PUBLIC_BEFORE_EVALUATION")
    if supersedes_publication_id is not None:
        require_sha256(supersedes_publication_id, "D3_SUPERSEDES_ID")

    descriptor = dict(catalog_descriptor)
    require_exact_keys(
        descriptor,
        {
            "catalog_publication_id", "snapshot_id", "catalog_version", "as_of",
            "available_at", "published_at", "member_count", "member_set_hash",
            "decision", "withdrawn",
        },
        "D3_CATALOG_DESCRIPTOR",
    )
    require_sha256(descriptor["catalog_publication_id"], "D3_CATALOG_PUBLICATION")
    require_sha256(descriptor["snapshot_id"], "D3_CATALOG_SNAPSHOT")
    require_sha256(descriptor["member_set_hash"], "D3_CATALOG_MEMBER_SET")
    require(
        descriptor["decision"] == "APPROVED" and descriptor["withdrawn"] is False,
        "D3_CATALOG_PUBLICATION_WITHHELD",
    )
    require(
        descriptor["catalog_publication_id"]
        == evidence_release.catalog_publication_id,
        "D3_CATALOG_PUBLICATION_BINDING",
    )
    require(
        descriptor["snapshot_id"] == ledger.membership.catalog_snapshot_sha256,
        "D3_CATALOG_SNAPSHOT_BINDING",
    )
    require(descriptor["catalog_version"] == ledger.membership.catalog_version, "D3_CATALOG_VERSION")
    require(
        parse_timestamp(descriptor["as_of"], "D3_CATALOG_AS_OF")
        == ledger.membership.catalog_as_of,
        "D3_CATALOG_AS_OF_BINDING",
    )
    require(
        parse_timestamp(descriptor["available_at"], "D3_CATALOG_AVAILABLE")
        == ledger.membership.available_at,
        "D3_CATALOG_AVAILABLE_BINDING",
    )
    require(descriptor["member_count"] == len(ledger.measurements), "D3_CATALOG_COUNT")
    require(
        descriptor["member_set_hash"]
        == evidence_release.catalog_member_set_sha256,
        "D3_CATALOG_MEMBER_SET_BINDING",
    )
    require(
        evidence_release.membership_id == ledger.membership.membership_id
        and evidence_release.member_set_sha256 == ledger.membership.member_set_sha256
        and evidence_release.expected_member_count == len(ledger.measurements)
        and evidence_release.catalog_snapshot_sha256
        == ledger.membership.catalog_snapshot_sha256,
        "D3_EVIDENCE_MEMBERSHIP_BINDING",
    )
    assert ledger.window_evidence is not None
    require(
        evidence_release.available_at >= ledger.window_evidence.available_at,
        "D3_EVIDENCE_RELEASE_BEFORE_WINDOW",
    )
    require(
        evidence_release.endpoint_set_id == ledger.window_evidence.endpoint_set_id
        and evidence_release.start_eod_sha256 == ledger.window_evidence.start_eod_sha256
        and evidence_release.start_eod_reduced_at
        == ledger.window_evidence.start_eod_reduced_at
        and evidence_release.end_eod_sha256 == ledger.window_evidence.end_eod_sha256
        and evidence_release.end_eod_reduced_at
        == ledger.window_evidence.end_eod_reduced_at
        and evidence_release.anomaly_policy_id
        == ledger.window_evidence.anomaly_policy_id
        and evidence_release.anomaly_assessment_set_sha256
        == ledger.window_evidence.anomaly_assessment_set_sha256,
        "D3_EVIDENCE_WINDOW_BINDING",
    )
    catalog_available_at = parse_timestamp(
        descriptor["available_at"], "D3_CATALOG_AVAILABLE"
    )
    catalog_published_at = parse_timestamp(
        descriptor["published_at"], "D3_CATALOG_PUBLISHED"
    )
    require(
        ledger.membership.available_at
        <= catalog_available_at
        <= catalog_published_at
        <= public_available_at,
        "D3_CATALOG_PUBLICATION_CLOCK",
    )

    measurements = {row["measurement_id"]: row for row in measured_rows}
    membership_by_id = {
        member.analysis_unit_id: member for member in ledger.membership.members
    }
    public_members: list[dict[str, Any]] = []
    public_counts: dict[str, int] = {}
    for direction in TrendingDirection:
        selected_rankings = run["rankings"][direction.value][
            : release.public_top_n_per_direction
        ]
        public_counts[direction.value] = len(selected_rankings)
        for ranked in selected_rankings:
            row = measurements[ranked["measurement_id"]]
            require(
                (tuple(leg["source_code"] for leg in row["source_legs"]) == EXPECTED_SOURCES
                 if tiered_candidate is None else row["evidence_grade"] in ("THREE_SOURCE_CONFIRMED", "TWO_SOURCE_SUPPORTED")),
                "D3_PUBLIC_SOURCE_ORDER",
            )
            private_catalog = catalog_documents.get(row["analysis_unit_id"])
            require(private_catalog is not None, "D3_PUBLIC_CATALOG_MEMBER_MISSING")
            require(
                private_catalog.get("projection_hash")
                == membership_by_id[row["analysis_unit_id"]].projection_sha256,
                "D3_PUBLIC_CATALOG_PROJECTION_BINDING",
            )
            projected = catalog_projection(private_catalog)
            require(projected["analysis_unit_id"] == row["analysis_unit_id"], "D3_PUBLIC_CATALOG_IDENTITY")
            require(
                projected["catalog_version"] == descriptor["catalog_version"],
                "D3_PUBLIC_MEMBER_CATALOG_VERSION",
            )
            public_members.append({
                "rank": ranked["rank"],
                "tie_break_key": row["analysis_unit_id"],
                "measurement_id": row["measurement_id"],
                "analysis_unit_id": row["analysis_unit_id"],
                "direction": direction.value,
                "evidence_grade": "THREE_SOURCE_SAME_DIRECTION",
                "conservative_source_code": row["conservative_source_code"],
                "conservative_same_direction_change_floor_ratio": row[
                    "conservative_same_direction_change_floor_ratio"
                ],
                "catalog": projected,
            })
            if tiered_candidate is not None:
                public_members[-1].update(evidence_grade=row["evidence_grade"],
                    supporting_sources=row["supporting_sources"], unavailable_sources=row["unavailable_sources"])

    input_available_at = parse_timestamp(
        ledger.run_document["input_available_at"], "D3_INPUT_AVAILABLE_AT"
    )
    if tiered_candidate is not None:
        input_available_at = max(input_available_at, tiered_candidate.policy.available_at)
    # Freshness belongs to the measured UTC day, not to the time at which an
    # old EOD artifact happened to be reduced or republished. A late rebuild
    # therefore cannot make historical observations fresh again.
    freshness_anchor = _utc_day_closed_at(ledger.result_as_of)
    require(
        evidence_release.source_leg_set_sha256
        == ledger.window_evidence.source_leg_set_sha256,
        "D3_EVIDENCE_LEG_SET_BINDING",
    )
    # Preserve the existing independent evaluation and raw-endpoint budgets.
    # Neither late production nor publication renews the raw measured day.
    fresh_until = min(
        ledger.evaluated_at + timedelta(seconds=release.freshness_seconds),
        freshness_anchor + timedelta(seconds=ledger.profile.endpoint_freshness_seconds),
    )
    retain_until = public_available_at + timedelta(seconds=release.retention_seconds)
    require(
        public_available_at <= fresh_until,
        "D3_PUBLICATION_AFTER_DATA_FRESHNESS",
    )
    manifest_body = {
        "schema_version": TRENDING_PUBLIC_MANIFEST_SCHEMA,
        "candidate_ledger_id": run["candidate_ledger_id"],
        "measurement_set_sha256": run["measurement_set_sha256"],
        "producer_release_id": release.release_id,
        "numeric_profile_id": ledger.profile.profile_id,
        "rights_release_id": rights.release_id,
        "evidence_release_id": evidence_release.release_id,
        "window_evidence_id": ledger.window_evidence.window_evidence_id,
        "result_as_of": ledger.result_as_of.isoformat(),
        "input_available_at": utc_timestamp_text(input_available_at),
        "public_available_at": utc_timestamp_text(public_available_at),
        "freshness_anchor_at": utc_timestamp_text(freshness_anchor),
        "fresh_until": utc_timestamp_text(fresh_until),
        "retain_until": utc_timestamp_text(retain_until),
        "supersedes_publication_id": supersedes_publication_id,
        "catalog": descriptor,
        "member_count": len(ledger.measurements),
        "three_source_endpoint_count": ledger.run_document[
            "three_source_endpoint_count"
        ],
        "qualified_three_source_endpoint_count": ledger.run_document[
            "qualified_three_source_endpoint_count"
        ],
        "qualified_three_source_endpoint_ratio_bps": ledger.run_document[
            "qualified_three_source_endpoint_ratio_bps"
        ],
        "three_source_endpoint_ratio_bps": ledger.run_document[
            "three_source_endpoint_ratio_bps"
        ],
        "direction_eligible_count": ledger.run_document[
            "direction_eligible_count"
        ],
        "direction_eligible_ratio_bps": ledger.run_document[
            "direction_eligible_ratio_bps"
        ],
        "eligible_count": ledger.run_document["direction_eligible_count"],
        "excluded_count": (
            len(ledger.measurements)
            - ledger.run_document["direction_eligible_count"]
        ),
        "status_counts": dict(ledger.run_document["status_counts"]),
        "gainer_count": public_counts[TrendingDirection.GAINERS.value],
        "loser_count": public_counts[TrendingDirection.LOSERS.value],
        "public_member_set_sha256": _set_hash(public_members),
        "producer_release": {
            "release_code": release.release_code,
            "algorithm_version": release.algorithm_version,
            "data_quality_policy_version": release.data_quality_policy_version,
            "public_top_n_per_direction": release.public_top_n_per_direction,
            "minimum_qualified_three_source_endpoint_ratio_bps": (
                release.minimum_qualified_three_source_endpoint_ratio_bps
            ),
            "minimum_three_source_endpoint_ratio_bps": (
                release.minimum_three_source_endpoint_ratio_bps
            ),
            "minimum_direction_eligible_ratio_bps": (
                release.minimum_direction_eligible_ratio_bps
            ),
        },
        "numeric_profile": {
            "profile_code": ledger.profile.profile_code,
            "method_id": "M3",
            "segment": "A_THREE_SOURCE",
            "horizon_days": 30,
            "analysis_currency": "CNY",
            "minimum_endpoint_cny_minor": ledger.profile.minimum_endpoint_cny_minor,
            "minimum_abs_leg_delta_cny_minor": ledger.profile.minimum_abs_leg_delta_cny_minor,
        },
        "rights_release_code": rights.release_code,
        "rights_maximum_public_members_per_direction": (
            rights.maximum_public_members_per_direction
        ),
        "evidence_release_code": evidence_release.release_code,
    }
    if tiered_candidate is not None:
        manifest_body.update(schema_version="single-item-trending-public-manifest/4")
        manifest_body.update({k: v for k, v in run.items() if k in tiered_candidate.document["accounting"]})
        manifest_body["numeric_profile"]["segment"] = "SOURCE_TIERED"
        manifest_body["tiering_policy"] = {k: v for k, v in tiered_candidate.policy.to_document().items()
            if k in {"policy_id", "policy_code", "allowed_missing_reasons", "maximum_quote_age_minutes",
                     "minimum_qualified_slots", "expected_slots", "minimum_supported_endpoint_ratio_bps"}}
    manifest = {"manifest_hash": _document_id(manifest_body), **manifest_body}
    return TrendingPublicCandidate(manifest=manifest, members=tuple(public_members))


__all__ = [
    "EXPECTED_SOURCES",
    "TRENDING_CANDIDATE_LEDGER_SCHEMA",
    "TRENDING_EVIDENCE_RELEASE_SCHEMA",
    "TRENDING_FORMAL_PRODUCER_VERSION",
    "TRENDING_MEASUREMENT_SCHEMA",
    "TRENDING_NUMERIC_PROFILE_SCHEMA",
    "TRENDING_PUBLIC_MANIFEST_SCHEMA",
    "TRENDING_RIGHTS_RELEASE_SCHEMA",
    "TRENDING_WINDOW_EVIDENCE_SCHEMA",
    "TrendingAnomalyStatus",
    "TrendingCandidateLedger",
    "TrendingCandidateStatus",
    "TrendingDirection",
    "TrendingEvidenceRelease",
    "TrendingMeasurementStatus",
    "TrendingNumericProfile",
    "TrendingPublicCandidate",
    "TrendingPublicGate",
    "TrendingPublicationBlocked",
    "TrendingPublicationRelease",
    "TrendingRightsRelease",
    "TrendingSourceLeg",
    "TrendingWindowEvidence",
    "build_trending_candidate_ledger",
    "build_trending_public_candidate",
]
