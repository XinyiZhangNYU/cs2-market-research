"""Provider-neutral quality result DTOs, separate from economic state."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING, Any, Mapping, TypeVar

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.state_machine.enums import ScopeKind

from .models import ResultContractError, ResultIdentity

if TYPE_CHECKING:
    from cs2_research.planning.source_quality import SourceQualitySnapshot


QUALITY_CONTRACT_CODE = "research-quality-envelope"
QUALITY_CONTRACT_VERSION = "v1"
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_DECIMAL = re.compile(r"^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$")
_TIMESTAMP = re.compile(
    r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$"
)
_EnumT = TypeVar("_EnumT", bound=StrEnum)


class QuerySampleState(StrEnum):
    POSITIVE_SAMPLE = "POSITIVE_SAMPLE"
    ZERO_CURRENT_SAMPLE = "ZERO_CURRENT_SAMPLE"


class QueryCapabilityState(StrEnum):
    CONFIRMED = "CONFIRMED"
    UNKNOWN = "UNKNOWN"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class QualityQueryKind(StrEnum):
    BASE_QUOTE = "BASE_QUOTE"
    LISTING_PAGE = "LISTING_PAGE"
    STYLE_LISTING = "STYLE_LISTING"
    STYLE_BID = "STYLE_BID"
    MARKET_SNAPSHOT = "MARKET_SNAPSHOT"


def _text(value: str, name: str) -> None:
    if not isinstance(value, str) or not value.strip() or "\x00" in value:
        raise ResultContractError(f"{name} must be non-empty NUL-free text")


def _utc(value: datetime, name: str) -> None:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() != timezone.utc.utcoffset(value)
    ):
        raise ResultContractError(f"{name} must use UTC")


def _count(value: int, name: str) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ResultContractError(f"{name} must be a non-negative integer")


def _sha(value: str, name: str) -> None:
    if not isinstance(value, str) or not _SHA256.fullmatch(value):
        raise ResultContractError(f"{name} must be lowercase SHA-256")


def _exact(document: Mapping[str, Any], expected: set[str], name: str) -> None:
    if not isinstance(document, Mapping) or set(document) != expected:
        raise ResultContractError(f"{name} keys do not match the quality contract")


def _timestamp(value: Any, name: str) -> datetime:
    if not isinstance(value, str) or not _TIMESTAMP.fullmatch(value):
        raise ResultContractError(f"{name} must use canonical UTC spelling")
    try:
        parsed = datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as exc:
        raise ResultContractError(f"{name} must be an ISO-8601 timestamp") from exc
    _utc(parsed, name)
    return parsed


def _decimal_text(value: Decimal) -> str:
    if not isinstance(value, Decimal) or not value.is_finite() or value < 0:
        raise ResultContractError("quality ratios must be finite non-negative Decimals")
    text = format(value, "f")
    if not _DECIMAL.fullmatch(text):
        raise ResultContractError("quality ratio cannot be encoded canonically")
    return text


def _enum(enum_type: type[_EnumT], value: Any, name: str) -> _EnumT:
    try:
        return enum_type(value)
    except (TypeError, ValueError) as exc:
        raise ResultContractError(f"{name} is not a supported value") from exc


@dataclass(frozen=True, slots=True)
class QualityQueryObservation:
    observation_id: str
    source_ref: str
    query_kind: QualityQueryKind
    sample_state: QuerySampleState
    capability_state: QueryCapabilityState
    returned_member_count: int
    observed_at: datetime
    available_at: datetime

    def __post_init__(self) -> None:
        _text(self.observation_id, "observation_id")
        _text(self.source_ref, "source_ref")
        if not isinstance(self.query_kind, QualityQueryKind):
            raise ResultContractError("query_kind must be QualityQueryKind")
        if not isinstance(self.sample_state, QuerySampleState):
            raise ResultContractError("sample_state must be QuerySampleState")
        if not isinstance(self.capability_state, QueryCapabilityState):
            raise ResultContractError("capability_state must be QueryCapabilityState")
        _count(self.returned_member_count, "returned_member_count")
        _utc(self.observed_at, "observed_at")
        _utc(self.available_at, "available_at")
        if self.available_at < self.observed_at:
            raise ResultContractError("query availability cannot predate observation")
        if self.sample_state is QuerySampleState.POSITIVE_SAMPLE:
            if self.returned_member_count <= 0:
                raise ResultContractError("positive sample requires returned members")
            if self.capability_state is not QueryCapabilityState.CONFIRMED:
                raise ResultContractError("positive sample confirms query capability")
        elif self.returned_member_count != 0:
            raise ResultContractError("zero current sample requires zero members")

    def to_document(self) -> dict[str, Any]:
        return {
            "observation_id": self.observation_id,
            "source_ref": self.source_ref,
            "query_kind": self.query_kind.value,
            "sample_state": self.sample_state.value,
            "capability_state": self.capability_state.value,
            "returned_member_count": self.returned_member_count,
            "observed_at": utc_timestamp_text(self.observed_at),
            "available_at": utc_timestamp_text(self.available_at),
        }

    @classmethod
    def from_document(cls, document: Any) -> "QualityQueryObservation":
        _exact(
            document,
            {
                "observation_id",
                "source_ref",
                "query_kind",
                "sample_state",
                "capability_state",
                "returned_member_count",
                "observed_at",
                "available_at",
            },
            "query observation",
        )
        return cls(
            observation_id=document["observation_id"],
            source_ref=document["source_ref"],
            query_kind=_enum(QualityQueryKind, document["query_kind"], "query_kind"),
            sample_state=_enum(
                QuerySampleState, document["sample_state"], "sample_state"
            ),
            capability_state=_enum(
                QueryCapabilityState,
                document["capability_state"],
                "capability_state",
            ),
            returned_member_count=document["returned_member_count"],
            observed_at=_timestamp(document["observed_at"], "observed_at"),
            available_at=_timestamp(document["available_at"], "available_at"),
        )


@dataclass(frozen=True, slots=True)
class QualitySourceSummary:
    source_ref: str
    expected_feature_count: int
    observed_feature_count: int
    fresh_feature_count: int
    missing_feature_count: int
    stale_feature_count: int

    def __post_init__(self) -> None:
        _text(self.source_ref, "source_ref")
        for value, name in (
            (self.expected_feature_count, "expected_feature_count"),
            (self.observed_feature_count, "observed_feature_count"),
            (self.fresh_feature_count, "fresh_feature_count"),
            (self.missing_feature_count, "missing_feature_count"),
            (self.stale_feature_count, "stale_feature_count"),
        ):
            _count(value, name)
        if self.observed_feature_count + self.missing_feature_count != self.expected_feature_count:
            raise ResultContractError("source quality feature accounting must be exact")
        if self.fresh_feature_count + self.stale_feature_count != self.observed_feature_count:
            raise ResultContractError("source freshness accounting must be exact")

    def to_document(self) -> dict[str, Any]:
        return {
            "source_ref": self.source_ref,
            "expected_feature_count": self.expected_feature_count,
            "observed_feature_count": self.observed_feature_count,
            "fresh_feature_count": self.fresh_feature_count,
            "missing_feature_count": self.missing_feature_count,
            "stale_feature_count": self.stale_feature_count,
        }

    @classmethod
    def from_document(cls, document: Any) -> "QualitySourceSummary":
        _exact(
            document,
            {
                "source_ref",
                "expected_feature_count",
                "observed_feature_count",
                "fresh_feature_count",
                "missing_feature_count",
                "stale_feature_count",
            },
            "source summary",
        )
        return cls(**document)


@dataclass(frozen=True, slots=True)
class QualityConflictSummary:
    feature_key: str
    reason_code: str
    participating_source_refs: tuple[str, ...]
    source_fact_count: int
    relative_dispersion: str | None

    def __post_init__(self) -> None:
        _text(self.feature_key, "feature_key")
        _text(self.reason_code, "reason_code")
        if self.participating_source_refs != tuple(
            sorted(set(self.participating_source_refs))
        ):
            raise ResultContractError("participating sources must be sorted and unique")
        _count(self.source_fact_count, "source_fact_count")
        if self.source_fact_count <= 0:
            raise ResultContractError("a conflict requires at least one source fact")
        if self.relative_dispersion is not None:
            if not isinstance(self.relative_dispersion, str) or not _DECIMAL.fullmatch(
                self.relative_dispersion
            ):
                raise ResultContractError("relative_dispersion must be decimal text")

    def to_document(self) -> dict[str, Any]:
        return {
            "feature_key": self.feature_key,
            "reason_code": self.reason_code,
            "participating_source_refs": list(self.participating_source_refs),
            "source_fact_count": self.source_fact_count,
            "relative_dispersion": self.relative_dispersion,
        }

    @classmethod
    def from_document(cls, document: Any) -> "QualityConflictSummary":
        _exact(
            document,
            {
                "feature_key",
                "reason_code",
                "participating_source_refs",
                "source_fact_count",
                "relative_dispersion",
            },
            "quality conflict",
        )
        sources = document["participating_source_refs"]
        if not isinstance(sources, list):
            raise ResultContractError("participating_source_refs must be an array")
        return cls(
            feature_key=document["feature_key"],
            reason_code=document["reason_code"],
            participating_source_refs=tuple(sources),
            source_fact_count=document["source_fact_count"],
            relative_dispersion=document["relative_dispersion"],
        )


@dataclass(frozen=True, slots=True)
class QualityResultEnvelope:
    identity: ResultIdentity
    as_of: datetime
    available_at: datetime
    policy_version: str
    input_quality_snapshot_id: str
    expected_cell_count: int
    observed_cell_count: int
    fresh_cell_count: int
    coverage_ratio: str
    fresh_coverage_ratio: str
    missing_cell_count: int
    stale_cell_count: int
    future_fact_count: int
    source_summaries: tuple[QualitySourceSummary, ...]
    conflicts: tuple[QualityConflictSummary, ...]
    query_observations: tuple[QualityQueryObservation, ...]

    def __post_init__(self) -> None:
        if not isinstance(self.identity, ResultIdentity):
            raise ResultContractError("quality identity must be ResultIdentity")
        if self.identity.scope_kind is not ScopeKind.ITEM:
            raise ResultContractError("quality result currently requires ITEM identity")
        _utc(self.as_of, "as_of")
        _utc(self.available_at, "available_at")
        if self.identity.identity_available_at > self.as_of:
            raise ResultContractError("quality identity knowledge cannot be later than as_of")
        if self.available_at > self.as_of:
            raise ResultContractError("quality available_at cannot be later than as_of")
        _text(self.policy_version, "policy_version")
        _text(self.input_quality_snapshot_id, "input_quality_snapshot_id")
        for value, name in (
            (self.expected_cell_count, "expected_cell_count"),
            (self.observed_cell_count, "observed_cell_count"),
            (self.fresh_cell_count, "fresh_cell_count"),
            (self.missing_cell_count, "missing_cell_count"),
            (self.stale_cell_count, "stale_cell_count"),
            (self.future_fact_count, "future_fact_count"),
        ):
            _count(value, name)
        if self.observed_cell_count + self.missing_cell_count != self.expected_cell_count:
            raise ResultContractError("quality cell accounting must be exact")
        if self.fresh_cell_count + self.stale_cell_count != self.observed_cell_count:
            raise ResultContractError("quality freshness accounting must be exact")
        for value, name in (
            (self.coverage_ratio, "coverage_ratio"),
            (self.fresh_coverage_ratio, "fresh_coverage_ratio"),
        ):
            if not isinstance(value, str) or not _DECIMAL.fullmatch(value):
                raise ResultContractError(f"{name} must be decimal text")
            if Decimal(value) > 1:
                raise ResultContractError(f"{name} cannot exceed one")
        expected_coverage = (
            Decimal(0)
            if self.expected_cell_count == 0
            else Decimal(self.observed_cell_count) / Decimal(self.expected_cell_count)
        )
        expected_fresh_coverage = (
            Decimal(0)
            if self.expected_cell_count == 0
            else Decimal(self.fresh_cell_count) / Decimal(self.expected_cell_count)
        )
        if Decimal(self.coverage_ratio) != expected_coverage:
            raise ResultContractError("coverage_ratio does not match cell accounting")
        if Decimal(self.fresh_coverage_ratio) != expected_fresh_coverage:
            raise ResultContractError(
                "fresh_coverage_ratio does not match cell accounting"
            )
        summaries = tuple(sorted(self.source_summaries, key=lambda row: row.source_ref))
        if len({row.source_ref for row in summaries}) != len(summaries):
            raise ResultContractError("source summaries must be unique")
        if (
            sum(row.expected_feature_count for row in summaries)
            != self.expected_cell_count
            or sum(row.observed_feature_count for row in summaries)
            != self.observed_cell_count
            or sum(row.fresh_feature_count for row in summaries)
            != self.fresh_cell_count
            or sum(row.missing_feature_count for row in summaries)
            != self.missing_cell_count
            or sum(row.stale_feature_count for row in summaries)
            != self.stale_cell_count
        ):
            raise ResultContractError(
                "source summaries do not reconcile to aggregate quality counts"
            )
        conflicts = tuple(
            sorted(self.conflicts, key=lambda row: (row.feature_key, row.reason_code))
        )
        if len({(row.feature_key, row.reason_code) for row in conflicts}) != len(
            conflicts
        ):
            raise ResultContractError("quality conflicts must be unique")
        queries = tuple(
            sorted(
                self.query_observations,
                key=lambda row: (row.source_ref, row.query_kind.value, row.observation_id),
            )
        )
        if any(row.available_at > self.available_at for row in queries):
            raise ResultContractError("quality result cannot predate a query observation")
        if len({row.observation_id for row in queries}) != len(queries):
            raise ResultContractError("quality query observations must be unique")
        if any(row.observation_id == self.input_quality_snapshot_id for row in queries):
            raise ResultContractError("query and quality snapshot IDs must be distinct")
        object.__setattr__(self, "source_summaries", summaries)
        object.__setattr__(self, "conflicts", conflicts)
        object.__setattr__(self, "query_observations", queries)

    def body_document(self) -> dict[str, Any]:
        return {
            "contract_code": QUALITY_CONTRACT_CODE,
            "contract_version": QUALITY_CONTRACT_VERSION,
            "envelope_kind": "QUALITY",
            "identity": self.identity.to_document(),
            "as_of": utc_timestamp_text(self.as_of),
            "available_at": utc_timestamp_text(self.available_at),
            "policy_version": self.policy_version,
            "input_quality_snapshot_id": self.input_quality_snapshot_id,
            "expected_cell_count": self.expected_cell_count,
            "observed_cell_count": self.observed_cell_count,
            "fresh_cell_count": self.fresh_cell_count,
            "coverage_ratio": self.coverage_ratio,
            "fresh_coverage_ratio": self.fresh_coverage_ratio,
            "missing_cell_count": self.missing_cell_count,
            "stale_cell_count": self.stale_cell_count,
            "future_fact_count": self.future_fact_count,
            "source_summaries": [row.to_document() for row in self.source_summaries],
            "conflicts": [row.to_document() for row in self.conflicts],
            "query_observations": [
                row.to_document() for row in self.query_observations
            ],
        }

    @property
    def snapshot_id(self) -> str:
        return sha256_hex(canonical_json_bytes(self.body_document()))

    @property
    def document_hash(self) -> str:
        return sha256_hex(canonical_json_bytes(self.to_document()))

    def to_document(self) -> dict[str, Any]:
        return {"snapshot_id": self.snapshot_id, **self.body_document()}

    @classmethod
    def from_document(cls, document: Any) -> "QualityResultEnvelope":
        _exact(
            document,
            {
                "snapshot_id",
                "contract_code",
                "contract_version",
                "envelope_kind",
                "identity",
                "as_of",
                "available_at",
                "policy_version",
                "input_quality_snapshot_id",
                "expected_cell_count",
                "observed_cell_count",
                "fresh_cell_count",
                "coverage_ratio",
                "fresh_coverage_ratio",
                "missing_cell_count",
                "stale_cell_count",
                "future_fact_count",
                "source_summaries",
                "conflicts",
                "query_observations",
            },
            "quality result",
        )
        if document["contract_code"] != QUALITY_CONTRACT_CODE:
            raise ResultContractError("unsupported quality contract_code")
        if document["contract_version"] != QUALITY_CONTRACT_VERSION:
            raise ResultContractError("unsupported quality contract_version")
        if document["envelope_kind"] != "QUALITY":
            raise ResultContractError("quality result requires envelope_kind=QUALITY")
        for field in ("source_summaries", "conflicts", "query_observations"):
            if not isinstance(document[field], list):
                raise ResultContractError(f"{field} must be an array")
        envelope = cls(
            identity=ResultIdentity.from_document(document["identity"]),
            as_of=_timestamp(document["as_of"], "as_of"),
            available_at=_timestamp(document["available_at"], "available_at"),
            policy_version=document["policy_version"],
            input_quality_snapshot_id=document["input_quality_snapshot_id"],
            expected_cell_count=document["expected_cell_count"],
            observed_cell_count=document["observed_cell_count"],
            fresh_cell_count=document["fresh_cell_count"],
            coverage_ratio=document["coverage_ratio"],
            fresh_coverage_ratio=document["fresh_coverage_ratio"],
            missing_cell_count=document["missing_cell_count"],
            stale_cell_count=document["stale_cell_count"],
            future_fact_count=document["future_fact_count"],
            source_summaries=tuple(
                QualitySourceSummary.from_document(row)
                for row in document["source_summaries"]
            ),
            conflicts=tuple(
                QualityConflictSummary.from_document(row)
                for row in document["conflicts"]
            ),
            query_observations=tuple(
                QualityQueryObservation.from_document(row)
                for row in document["query_observations"]
            ),
        )
        if envelope.to_document() != dict(document):
            raise ResultContractError("quality result must use canonical ordering")
        _sha(document["snapshot_id"], "snapshot_id")
        if document["snapshot_id"] != envelope.snapshot_id:
            raise ResultContractError("quality snapshot_id does not match canonical result")
        return envelope


def project_source_quality(
    snapshot: SourceQualitySnapshot,
    *,
    identity: ResultIdentity,
    available_at: datetime,
    query_observations: tuple[QualityQueryObservation, ...] = (),
) -> QualityResultEnvelope:
    """Project quality facts without creating an economic recommendation."""

    if snapshot.analysis_unit_id != identity.analysis_unit_id:
        raise ResultContractError("quality snapshot and identity analysis units differ")
    source_summaries = tuple(
        QualitySourceSummary(
            source_ref=row.source_code,
            expected_feature_count=row.expected_feature_count,
            observed_feature_count=row.observed_feature_count,
            fresh_feature_count=row.fresh_feature_count,
            missing_feature_count=row.missing_feature_count,
            stale_feature_count=row.stale_feature_count,
        )
        for row in snapshot.source_breakdown
    )
    conflicts = tuple(
        QualityConflictSummary(
            feature_key=row.feature_key,
            reason_code=row.reason_code,
            participating_source_refs=row.participating_sources,
            source_fact_count=len(row.source_fact_ids),
            relative_dispersion=(
                _decimal_text(row.relative_dispersion)
                if row.relative_dispersion is not None
                else None
            ),
        )
        for row in snapshot.conflicts
    )
    return QualityResultEnvelope(
        identity=identity,
        as_of=snapshot.as_of,
        available_at=available_at,
        policy_version=snapshot.policy_version,
        input_quality_snapshot_id=snapshot.snapshot_id,
        expected_cell_count=snapshot.expected_cell_count,
        observed_cell_count=snapshot.observed_cell_count,
        fresh_cell_count=snapshot.fresh_cell_count,
        coverage_ratio=_decimal_text(snapshot.coverage_ratio),
        fresh_coverage_ratio=_decimal_text(snapshot.fresh_coverage_ratio),
        missing_cell_count=len(snapshot.missing_cells),
        stale_cell_count=len(snapshot.stale_cells),
        future_fact_count=snapshot.future_fact_count,
        source_summaries=source_summaries,
        conflicts=conflicts,
        query_observations=query_observations,
    )


__all__ = [
    "QUALITY_CONTRACT_CODE",
    "QUALITY_CONTRACT_VERSION",
    "QualityConflictSummary",
    "QualityQueryKind",
    "QualityQueryObservation",
    "QualityResultEnvelope",
    "QualitySourceSummary",
    "QueryCapabilityState",
    "QuerySampleState",
    "project_source_quality",
]
