"""Evidence-bound adapter from complete EOD CNY projections to Trending legs.

The adapter never selects a nearest row, forward-fills, switches source, or
invents an anomaly pass. A formal endpoint set is accepted only when both UTC
days have complete sealed V3 EOD reductions and every paired projection points
back to the exact source fact in the corresponding reduction. Missing anomaly
assessments are represented as ``UNKNOWN`` and therefore fail closed later.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from datetime import UTC, date, datetime, time, timedelta
import hashlib
from types import MappingProxyType
from typing import Any, Iterable, Iterator, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.fx.analysis import (
    CNY_ANALYSIS_SCHEMA_V2,
    CnyAnalysisProjectionError,
    analysis_source_from_market_sector_eod_fact,
    validate_cny_analysis_projection,
)
from cs2_research.feature_input.market_sector_daily_v1 import FROZEN_END_OF_DAY_REDUCTION_POLICY_V1
from cs2_research.feature_input.market_sector_eod_v3 import V3EndOfDayDiagnostic, V3EndOfDaySourceStatus

from .formal import (
    EXPECTED_SOURCES,
    TrendingAnomalyStatus,
    TrendingSourceLeg,
    TrendingWindowEvidence,
)
from .identity import TrendingIdentityHistory
from .models import (
    TrendingContractError,
    parse_date,
    parse_timestamp,
    require,
    require_exact_keys,
    require_sha256,
    require_text,
)


TRENDING_CURRENT_ENDPOINT_SET_SCHEMA = "single-item-trending-current-endpoint-set/4"
TRENDING_EOD_PROOF_SCHEMA = "single-item-trending-eod-proof/2"
TRENDING_ANOMALY_ASSESSMENT_SCHEMA = "single-item-trending-anomaly-assessment/1"
UPSTREAM_EOD_SCHEMA = "market-sector-v3-eod-source-reduction/1"
UPSTREAM_EOD_USAGE_SCOPE = "INTERNAL_PROSPECTIVE_MARKET_SECTOR_V3_MEASUREMENT"


def _utc(value: datetime, code: str) -> datetime:
    require(
        isinstance(value, datetime)
        and value.tzinfo is not None
        and value.utcoffset() == timedelta(0),
        code,
    )
    return value.astimezone(UTC)


def _document_id(value: Mapping[str, Any]) -> str:
    return sha256_hex(canonical_json_bytes(dict(value)))


def _set_hash(values: Iterable[Mapping[str, Any]]) -> str:
    digest = hashlib.sha256()
    for value in values:
        digest.update(canonical_json_bytes(dict(value)))
    return digest.hexdigest()


def _canonical_array_hash(values: Iterable[Mapping[str, Any]]) -> str:
    """Hash one canonical JSON array without retaining every member."""
    digest = hashlib.sha256()
    digest.update(b"[")
    first = True
    for value in values:
        if not first:
            digest.update(b",")
        first = False
        digest.update(canonical_json_bytes(dict(value))[:-1])
    digest.update(b"]\n")
    return digest.hexdigest()


def _document_id_with_array(
    body: Mapping[str, Any],
    array_key: str,
    values: Iterable[Mapping[str, Any]],
) -> str:
    """Hash a canonical object whose one top-level array is streamed."""
    require(array_key not in body, "D4_STREAM_ARRAY_KEY_PRESENT")
    digest = hashlib.sha256()
    digest.update(b"{")
    first_key = True
    for key in sorted((*body.keys(), array_key)):
        if not first_key:
            digest.update(b",")
        first_key = False
        digest.update(canonical_json_bytes(key)[:-1])
        digest.update(b":")
        if key != array_key:
            digest.update(canonical_json_bytes(body[key])[:-1])
            continue
        digest.update(b"[")
        first_value = True
        for value in values:
            if not first_value:
                digest.update(b",")
            first_value = False
            digest.update(canonical_json_bytes(dict(value))[:-1])
        digest.update(b"]")
    digest.update(b"}\n")
    return digest.hexdigest()


def _validate_eod_projection(projection: Mapping[str, Any], proof: "TrendingEodProof") -> None:
    """Bind values as well as IDs to the original USD EOD fact and qualification."""
    require(projection.get("schema") == CNY_ANALYSIS_SCHEMA_V2, "D4_SET_DAILY_V2_REQUIRED")
    source = projection["source"]
    key = (source["analysis_unit_id"], source["logical_source"])
    fact = proof.fact_by_identity.get(key)
    require(fact is not None, "D4_EOD_SOURCE_FACT_MISSING")
    try:
        expected = analysis_source_from_market_sector_eod_fact(
            dict(fact), source_item_id=source["source_item_id"],
            identity_available_at=parse_timestamp(source["identity_available_at"], "D4_EOD_IDENTITY_TIME"),
        )
    except CnyAnalysisProjectionError as exc:
        raise TrendingContractError("D4_EOD_SOURCE_FACT_INVALID") from exc
    require(dict(source) == expected.to_document(), "D4_EOD_SOURCE_CONTENT_DRIFT")
    observation = projection.get("observation")
    require(isinstance(observation, Mapping), "D4_SET_NOT_DAILY_EOD")
    diagnostic = proof.diagnostic_by_identity[key]
    day_start = datetime.combine(proof.bucket_date, time.min, tzinfo=UTC)
    require(dict(observation) == {
        "kind": "UTC_DAILY_EOD", "interval_start": utc_timestamp_text(day_start),
        "interval_end": utc_timestamp_text(day_start + timedelta(days=1)),
        "reduction_policy_sha256": proof.policy_sha256,
        "reduction_sha256": proof.artifact_sha256,
        "coverage_evidence_sha256": proof.artifact_sha256,
        "supplied_slot_count": proof.supplied_slot_count,
        "positive_fresh_slot_count": diagnostic["positive_fresh_slot_count"],
    }, "D4_EOD_OBSERVATION_CONTENT_DRIFT")
    # The reduction exists BEFORE its CNY projection. Reprocessing may arrive
    # later, but must keep the original valuation cutoff and actual new clock.
    require(parse_timestamp(projection["valuation_as_of"], "D4_EOD_VALUATION") == proof.reduced_at,
            "D4_EOD_VALUATION_BINDING")
    require(parse_timestamp(projection["projected_at"], "D4_EOD_PROJECTED") >= proof.reduced_at,
            "D4_EOD_PROJECTION_BEFORE_REDUCTION")


@dataclass(frozen=True, slots=True)
class TrendingEodProof:
    """Minimal, independently hash-bound projection of one V3 EOD artifact."""

    reduction_id: str
    artifact_sha256: str
    bucket_date: date
    reduced_at: datetime
    upstream_membership_id: str
    upstream_membership_sha256: str
    policy_sha256: str
    supplied_slot_count: int
    source_facts: tuple[Mapping[str, Any], ...]
    input_snapshot_sha256: str
    diagnostics: tuple[Mapping[str, Any], ...]
    _fact_index: Mapping[tuple[str, str], Mapping[str, Any]] = field(init=False, repr=False, compare=False)
    _diagnostic_index: Mapping[tuple[str, str], Mapping[str, Any]] = field(init=False, repr=False, compare=False)

    def __post_init__(self) -> None:
        require_text(self.reduction_id, "D4_EOD_REDUCTION_ID")
        for value, code in (
            (self.artifact_sha256, "D4_EOD_ARTIFACT_HASH"),
            (self.upstream_membership_sha256, "D4_EOD_MEMBERSHIP_HASH"),
            (self.policy_sha256, "D4_EOD_POLICY_HASH"),
            (self.input_snapshot_sha256, "D4_EOD_INPUT_SNAPSHOT_HASH"),
        ):
            require_sha256(value, code)
        require_text(self.upstream_membership_id, "D4_EOD_MEMBERSHIP_ID")
        require(isinstance(self.bucket_date, date), "D4_EOD_BUCKET_DATE")
        reduced_at = _utc(self.reduced_at, "D4_EOD_REDUCED_AT")
        day_end = datetime.combine(
            self.bucket_date + timedelta(days=1), time.min, tzinfo=UTC
        )
        require(reduced_at >= day_end, "D4_EOD_DAY_NOT_COMPLETE")
        policy = FROZEN_END_OF_DAY_REDUCTION_POLICY_V1
        require(
            type(self.supplied_slot_count) is int
            and policy.minimum_qualified_slots <= self.supplied_slot_count <= policy.expected_slots,
            "D4_EOD_SLOT_SET_INCOMPLETE",
        )
        require(isinstance(self.source_facts, tuple), "D4_EOD_FACTS")
        normalized: list[dict[str, Any]] = []
        for raw in self.source_facts:
            fact = require_exact_keys(
                raw,
                {
                    "analysis_unit_id", "ask_atoms", "available_at",
                    "bucket_date", "logical_source", "source_fact_sha256",
                },
                "D4_EOD_FACT",
            )
            require_text(fact["analysis_unit_id"], "D4_EOD_FACT_MEMBER")
            require(fact["logical_source"] in EXPECTED_SOURCES, "D4_EOD_FACT_SOURCE")
            require(
                type(fact["ask_atoms"]) is int and fact["ask_atoms"] > 0,
                "D4_EOD_FACT_ASK",
            )
            require(
                parse_date(fact["bucket_date"], "D4_EOD_FACT_DATE")
                == self.bucket_date,
                "D4_EOD_FACT_DATE_DRIFT",
            )
            require(
                parse_timestamp(fact["available_at"], "D4_EOD_FACT_AVAILABLE")
                <= reduced_at,
                "D4_EOD_FACT_FROM_FUTURE",
            )
            require(day_end - timedelta(minutes=policy.final_window_minutes)
                    <= parse_timestamp(fact["available_at"], "D4_EOD_FACT_AVAILABLE") < day_end,
                    "D4_EOD_FACT_OUTSIDE_FROZEN_FINAL_HOUR")
            require_sha256(fact["source_fact_sha256"], "D4_EOD_FACT_HASH")
            normalized.append(dict(fact))
        normalized.sort(key=lambda row: (row["analysis_unit_id"], row["logical_source"]))
        identities = tuple(
            (row["analysis_unit_id"], row["logical_source"]) for row in normalized
        )
        require(len(identities) == len(set(identities)), "D4_EOD_DUPLICATE_FACT")
        require(
            tuple(dict(row) for row in self.source_facts) == tuple(normalized),
            "D4_EOD_FACT_ORDER",
        )
        require(self.policy_sha256 == policy.policy_sha256, "D4_EOD_POLICY_NOT_FROZEN")
        require(isinstance(self.diagnostics, tuple), "D4_EOD_DIAGNOSTICS")
        diagnostic_keys: list[tuple[str, str]] = []
        qualified: dict[tuple[str, str], V3EndOfDayDiagnostic] = {}
        for raw in self.diagnostics:
            row = require_exact_keys(raw, {
                "analysis_unit_id", "logical_source", "status", "supplied_slot_count",
                "positive_fresh_slot_count", "stale_slot_count", "missing_source_clock_slot_count",
                "invalid_or_missing_ask_slot_count", "reduced_ask_atoms", "reason_codes", "lineage_sha256",
            }, "D4_EOD_DIAGNOSTIC_SHAPE")
            require(isinstance(row["reason_codes"], (list, tuple)), "D4_EOD_DIAGNOSTIC_REASONS")
            try:
                diagnostic = V3EndOfDayDiagnostic(**{
                    **row, "status": V3EndOfDaySourceStatus(row["status"]),
                    "reason_codes": tuple(row["reason_codes"]),
                })
            except (ValueError, TypeError) as exc:
                raise TrendingContractError("D4_EOD_DIAGNOSTIC_INVALID") from exc
            key = (diagnostic.analysis_unit_id, diagnostic.logical_source)
            diagnostic_keys.append(key)
            require(all(diagnostic.positive_fresh_slot_count + count <= diagnostic.supplied_slot_count
                        for count in (diagnostic.stale_slot_count, diagnostic.missing_source_clock_slot_count,
                                      diagnostic.invalid_or_missing_ask_slot_count)),
                    "D4_EOD_DIAGNOSTIC_COUNT_OVERLAP")
            if diagnostic.status is V3EndOfDaySourceStatus.QUALIFIED:
                require(diagnostic.supplied_slot_count == self.supplied_slot_count
                        and diagnostic.positive_fresh_slot_count >= policy.minimum_qualified_slots,
                        "D4_EOD_DIAGNOSTIC_NOT_QUALIFIED")
                qualified[key] = diagnostic
        require(diagnostic_keys == sorted(set(diagnostic_keys)), "D4_EOD_DIAGNOSTIC_ORDER")
        require(set(qualified) == set(identities), "D4_EOD_QUALIFIED_FACT_SET")
        for fact in self.source_facts:
            key = (fact["analysis_unit_id"], fact["logical_source"])
            require(qualified[key].reduced_ask_atoms == fact["ask_atoms"], "D4_EOD_DIAGNOSTIC_AMOUNT")
        raw = self.reduction_document()
        require(raw["reduction_id"] == "market_sector_v3_eod_reduction_" + _document_id(
            {key: value for key, value in raw.items() if key != "reduction_id"}
        ), "D4_EOD_REDUCTION_CONTENT_ID")
        require(_document_id(raw) == self.artifact_sha256, "D4_EOD_REDUCTION_CONTENT_HASH")
        # frozen dataclass alone does not freeze nested caller-owned JSON.
        # Copy and freeze every nested value after validating the full artifact.
        object.__setattr__(self, "source_facts", tuple(MappingProxyType(dict(row)) for row in self.source_facts))
        object.__setattr__(self, "diagnostics", tuple(MappingProxyType({
            **row, "reason_codes": tuple(row["reason_codes"]),
        }) for row in self.diagnostics))
        object.__setattr__(self, "_fact_index", MappingProxyType({
            (row["analysis_unit_id"], row["logical_source"]): row for row in self.source_facts}))
        object.__setattr__(self, "_diagnostic_index", MappingProxyType({
            (row["analysis_unit_id"], row["logical_source"]): row for row in self.diagnostics}))

    def _diagnostic_documents(self) -> list[dict[str, Any]]:
        return [{**row, "reason_codes": list(row["reason_codes"])} for row in self.diagnostics]

    def reduction_document(self) -> dict[str, Any]:
        """Reconstruct the exact upstream document, including qualification diagnostics."""
        return {
            "schema": UPSTREAM_EOD_SCHEMA, "usage_scope": UPSTREAM_EOD_USAGE_SCOPE,
            "formal_state_eligible": False, "bucket_date": self.bucket_date.isoformat(),
            "reduced_at": utc_timestamp_text(self.reduced_at), "reduction_id": self.reduction_id,
            "membership_id": self.upstream_membership_id,
            "membership_sha256": self.upstream_membership_sha256,
            "policy_sha256": self.policy_sha256, "input_snapshot_sha256": self.input_snapshot_sha256,
            "supplied_slot_count": self.supplied_slot_count,
            "source_facts": [dict(row) for row in self.source_facts],
            "diagnostics": self._diagnostic_documents(),
        }

    @property
    def fact_set_sha256(self) -> str:
        return _set_hash(self.source_facts)

    @property
    def fact_by_identity(self) -> Mapping[tuple[str, str], Mapping[str, Any]]:
        return self._fact_index

    @property
    def diagnostic_by_identity(self) -> Mapping[tuple[str, str], Mapping[str, Any]]:
        return self._diagnostic_index

    def to_document(self) -> dict[str, Any]:
        return {
            "schema_version": TRENDING_EOD_PROOF_SCHEMA,
            "reduction_id": self.reduction_id,
            "artifact_sha256": self.artifact_sha256,
            "bucket_date": self.bucket_date.isoformat(),
            "reduced_at": utc_timestamp_text(self.reduced_at),
            "upstream_membership_id": self.upstream_membership_id,
            "upstream_membership_sha256": self.upstream_membership_sha256,
            "policy_sha256": self.policy_sha256,
            "supplied_slot_count": self.supplied_slot_count,
            "source_fact_count": len(self.source_facts),
            "source_fact_set_sha256": self.fact_set_sha256,
            "source_facts": [dict(row) for row in self.source_facts],
            "input_snapshot_sha256": self.input_snapshot_sha256,
            "diagnostics": self._diagnostic_documents(),
        }

    @classmethod
    def from_document(cls, value: Any) -> "TrendingEodProof":
        document = require_exact_keys(
            value,
            {
                "schema_version", "reduction_id", "artifact_sha256",
                "bucket_date", "reduced_at", "upstream_membership_id",
                "upstream_membership_sha256", "policy_sha256",
                "supplied_slot_count", "source_fact_count",
                "source_fact_set_sha256", "source_facts",
                "input_snapshot_sha256", "diagnostics",
            },
            "D4_EOD_PROOF_DOCUMENT",
        )
        require(document["schema_version"] == TRENDING_EOD_PROOF_SCHEMA, "D4_EOD_PROOF_SCHEMA")
        require(isinstance(document["source_facts"], list), "D4_EOD_PROOF_FACTS")
        require(isinstance(document["diagnostics"], list), "D4_EOD_PROOF_DIAGNOSTICS")
        proof = cls(
            reduction_id=document["reduction_id"],
            artifact_sha256=document["artifact_sha256"],
            bucket_date=parse_date(document["bucket_date"], "D4_EOD_BUCKET_DATE"),
            reduced_at=parse_timestamp(document["reduced_at"], "D4_EOD_REDUCED_AT"),
            upstream_membership_id=document["upstream_membership_id"],
            upstream_membership_sha256=document["upstream_membership_sha256"],
            policy_sha256=document["policy_sha256"],
            supplied_slot_count=document["supplied_slot_count"],
            source_facts=tuple(document["source_facts"]),
            input_snapshot_sha256=document["input_snapshot_sha256"],
            diagnostics=tuple(document["diagnostics"]),
        )
        require(document["source_fact_count"] == len(proof.source_facts), "D4_EOD_FACT_COUNT")
        require(document["source_fact_set_sha256"] == proof.fact_set_sha256, "D4_EOD_FACT_SET")
        require(proof.to_document() == dict(document), "D4_EOD_PROOF_IDENTITY")
        return proof

    @classmethod
    def from_v3_reduction(
        cls,
        value: Any,
        *,
        artifact_sha256: str,
    ) -> "TrendingEodProof":
        """Validate and project one canonical upstream V3 reduction document."""

        document = require_exact_keys(
            value,
            {
                "bucket_date", "diagnostics", "formal_state_eligible",
                "input_snapshot_sha256", "membership_id", "membership_sha256",
                "policy_sha256", "reduced_at", "reduction_id", "schema",
                "source_facts", "supplied_slot_count", "usage_scope",
            },
            "D4_UPSTREAM_EOD_DOCUMENT",
        )
        require_sha256(artifact_sha256, "D4_UPSTREAM_EOD_ARTIFACT_HASH")
        require(
            sha256_hex(canonical_json_bytes(dict(document))) == artifact_sha256,
            "D4_UPSTREAM_EOD_ARTIFACT_DRIFT",
        )
        require(
            document["schema"] == UPSTREAM_EOD_SCHEMA
            and document["usage_scope"] == UPSTREAM_EOD_USAGE_SCOPE
            and document["formal_state_eligible"] is False,
            "D4_UPSTREAM_EOD_SCOPE",
        )
        expected_reduction_id = "market_sector_v3_eod_reduction_" + sha256_hex(
            canonical_json_bytes(
                {key: item for key, item in document.items() if key != "reduction_id"}
            )
        )
        require(document["reduction_id"] == expected_reduction_id, "D4_UPSTREAM_EOD_REDUCTION_ID")
        require(isinstance(document["diagnostics"], list), "D4_UPSTREAM_EOD_DIAGNOSTICS")
        require(isinstance(document["source_facts"], list), "D4_UPSTREAM_EOD_FACTS")
        return cls(
            reduction_id=document["reduction_id"],
            artifact_sha256=artifact_sha256,
            bucket_date=parse_date(document["bucket_date"], "D4_EOD_BUCKET_DATE"),
            reduced_at=parse_timestamp(document["reduced_at"], "D4_EOD_REDUCED_AT"),
            upstream_membership_id=document["membership_id"],
            upstream_membership_sha256=document["membership_sha256"],
            policy_sha256=document["policy_sha256"],
            supplied_slot_count=document["supplied_slot_count"],
            source_facts=tuple(document["source_facts"]),
            input_snapshot_sha256=document["input_snapshot_sha256"],
            diagnostics=tuple(document["diagnostics"]),
        )


@dataclass(frozen=True, slots=True)
class TrendingAnomalyAssessment:
    analysis_unit_id: str
    source_code: str
    start_projection_sha256: str
    end_projection_sha256: str
    policy_id: str
    status: TrendingAnomalyStatus
    available_at: datetime
    reason_codes: tuple[str, ...]

    def __post_init__(self) -> None:
        require_text(self.analysis_unit_id, "D4_ANOMALY_MEMBER")
        require(self.source_code in EXPECTED_SOURCES, "D4_ANOMALY_SOURCE")
        for value, code in (
            (self.start_projection_sha256, "D4_ANOMALY_START_PROJECTION"),
            (self.end_projection_sha256, "D4_ANOMALY_END_PROJECTION"),
            (self.policy_id, "D4_ANOMALY_POLICY"),
        ):
            require_sha256(value, code)
        require(isinstance(self.status, TrendingAnomalyStatus), "D4_ANOMALY_STATUS")
        _utc(self.available_at, "D4_ANOMALY_AVAILABLE")
        require(
            isinstance(self.reason_codes, tuple)
            and bool(self.reason_codes)
            and self.reason_codes == tuple(sorted(set(self.reason_codes)))
            and all(isinstance(value, str) and value for value in self.reason_codes),
            "D4_ANOMALY_REASONS",
        )

    def body_document(self) -> dict[str, Any]:
        return {
            "schema_version": TRENDING_ANOMALY_ASSESSMENT_SCHEMA,
            "analysis_unit_id": self.analysis_unit_id,
            "source_code": self.source_code,
            "start_projection_sha256": self.start_projection_sha256,
            "end_projection_sha256": self.end_projection_sha256,
            "policy_id": self.policy_id,
            "status": self.status.value,
            "available_at": utc_timestamp_text(self.available_at),
            "reason_codes": list(self.reason_codes),
        }

    @property
    def assessment_id(self) -> str:
        return _document_id(self.body_document())

    def to_document(self) -> dict[str, Any]:
        return {"assessment_id": self.assessment_id, **self.body_document()}

    @classmethod
    def from_document(cls, value: Any) -> "TrendingAnomalyAssessment":
        document = require_exact_keys(
            value,
            {
                "assessment_id", "schema_version", "analysis_unit_id",
                "source_code", "start_projection_sha256",
                "end_projection_sha256", "policy_id", "status",
                "available_at", "reason_codes",
            },
            "D4_ANOMALY_DOCUMENT",
        )
        require(document["schema_version"] == TRENDING_ANOMALY_ASSESSMENT_SCHEMA, "D4_ANOMALY_SCHEMA")
        require(isinstance(document["reason_codes"], list), "D4_ANOMALY_REASONS")
        try:
            status = TrendingAnomalyStatus(document["status"])
        except (TypeError, ValueError):
            raise TrendingContractError("D4_ANOMALY_STATUS") from None
        assessment = cls(
            analysis_unit_id=document["analysis_unit_id"],
            source_code=document["source_code"],
            start_projection_sha256=document["start_projection_sha256"],
            end_projection_sha256=document["end_projection_sha256"],
            policy_id=document["policy_id"],
            status=status,
            available_at=parse_timestamp(document["available_at"], "D4_ANOMALY_AVAILABLE"),
            reason_codes=tuple(document["reason_codes"]),
        )
        require(assessment.to_document() == dict(document), "D4_ANOMALY_IDENTITY")
        return assessment

    @classmethod
    def unknown(
        cls,
        *,
        analysis_unit_id: str,
        source_code: str,
        start_projection_sha256: str,
        end_projection_sha256: str,
        policy_id: str,
        available_at: datetime,
    ) -> "TrendingAnomalyAssessment":
        return cls(
            analysis_unit_id=analysis_unit_id,
            source_code=source_code,
            start_projection_sha256=start_projection_sha256,
            end_projection_sha256=end_projection_sha256,
            policy_id=policy_id,
            status=TrendingAnomalyStatus.UNKNOWN,
            available_at=available_at,
            reason_codes=("ASSESSMENT_NOT_SUPPLIED",),
        )


@dataclass(frozen=True, slots=True)
class TrendingCnyEndpointPair:
    start_projection: Mapping[str, Any]
    end_projection: Mapping[str, Any]
    anomaly_assessment: TrendingAnomalyAssessment

    def __post_init__(self) -> None:
        require(isinstance(self.start_projection, Mapping), "D4_START_PROJECTION")
        require(isinstance(self.end_projection, Mapping), "D4_END_PROJECTION")
        require(isinstance(self.anomaly_assessment, TrendingAnomalyAssessment), "D4_ANOMALY_ASSESSMENT")


@dataclass(frozen=True, slots=True)
class TrendingCurrentEndpointSet:
    """One sealed collection of exact EOD pairs and independent assessments."""

    membership_id: str
    member_set_sha256: str
    member_count: int
    catalog_snapshot_sha256: str
    result_as_of: date
    evaluated_at: datetime
    maximum_source_lag_seconds: int
    start_eod_proof: TrendingEodProof
    end_eod_proof: TrendingEodProof
    anomaly_policy_id: str
    knowledge_mode: str
    pairs: tuple[TrendingCnyEndpointPair, ...]
    identity_history: TrendingIdentityHistory | None = None

    def __post_init__(self) -> None:
        for value, code in (
            (self.membership_id, "D4_SET_MEMBERSHIP"),
            (self.member_set_sha256, "D4_SET_MEMBER_SET"),
            (self.catalog_snapshot_sha256, "D4_SET_CATALOG_SNAPSHOT"),
            (self.anomaly_policy_id, "D4_SET_ANOMALY_POLICY"),
        ):
            require_sha256(value, code)
        require(type(self.member_count) is int and self.member_count > 0, "D4_SET_MEMBER_COUNT")
        require(isinstance(self.result_as_of, date), "D4_SET_AS_OF")
        evaluated_at = _utc(self.evaluated_at, "D4_SET_EVALUATED_AT")
        require(
            type(self.maximum_source_lag_seconds) is int
            and 1 <= self.maximum_source_lag_seconds <= 86_400,
            "D4_SET_SOURCE_LAG_LIMIT",
        )
        require(
            isinstance(self.start_eod_proof, TrendingEodProof)
            and isinstance(self.end_eod_proof, TrendingEodProof),
            "D4_SET_EOD_PROOFS",
        )
        require(
            self.start_eod_proof.bucket_date == self.start_date
            and self.end_eod_proof.bucket_date == self.result_as_of,
            "D4_SET_EOD_DATE_BINDING",
        )
        require(
            max(self.start_eod_proof.reduced_at, self.end_eod_proof.reduced_at) <= evaluated_at,
            "D4_SET_EOD_CLOCK_BINDING",
        )
        require(
            self.knowledge_mode in {"PROSPECTIVE_PIT", "RETROSPECTIVE_DIAGNOSTIC"},
            "D4_SET_KNOWLEDGE_MODE",
        )
        require(isinstance(self.pairs, tuple), "D4_SET_PAIRS")
        require(len(self.pairs) <= self.member_count * len(EXPECTED_SOURCES), "D4_SET_PAIR_LIMIT")
        legs = tuple(
            trending_source_leg_from_cny_pair(
                pair, start_date=self.start_date, end_date=self.result_as_of
            )
            for pair in self.pairs
        )
        identities = tuple((leg.analysis_unit_id, leg.source_code) for leg in legs)
        require(identities == tuple(sorted(identities)), "D4_SET_PAIR_ORDER")
        require(len(identities) == len(set(identities)), "D4_DUPLICATE_ENDPOINT_PAIR")
        start_facts = self.start_eod_proof.fact_by_identity
        end_facts = self.end_eod_proof.fact_by_identity
        for pair, leg in zip(self.pairs, legs, strict=True):
            for projection, proof in (
                (pair.start_projection, self.start_eod_proof),
                (pair.end_projection, self.end_eod_proof),
            ):
                _validate_eod_projection(projection, proof)
                source = projection["source"]
                event_at = parse_timestamp(source["event_at"], "D4_SET_SOURCE_EVENT_AT")
                source_available_at = parse_timestamp(
                    source["source_available_at"], "D4_SET_SOURCE_AVAILABLE_AT"
                )
                identity_available_at = parse_timestamp(
                    source["identity_available_at"], "D4_SET_IDENTITY_AVAILABLE_AT"
                )
                require(identity_available_at <= event_at, "D4_SET_RETROSPECTIVE_IDENTITY")
                require(
                    (source_available_at - event_at).total_seconds()
                    <= self.maximum_source_lag_seconds,
                    "D4_SET_RETROSPECTIVE_SOURCE",
                )
                identity = projection.get("economic_identity")
                require(isinstance(identity, Mapping), "D4_SET_ECONOMIC_PROOF_REQUIRED")
                require(parse_timestamp(identity["available_at"], "D4_SET_ECONOMIC_AVAILABLE") <= event_at,
                        "D4_SET_RETROSPECTIVE_ECONOMIC_IDENTITY")
            key = (leg.analysis_unit_id, leg.source_code)
            require(
                key in start_facts
                and start_facts[key]["source_fact_sha256"]
                == pair.start_projection["source"]["source_fact_sha256"],
                "D4_SET_START_EOD_FACT_BINDING",
            )
            require(
                key in end_facts
                and end_facts[key]["source_fact_sha256"]
                == pair.end_projection["source"]["source_fact_sha256"],
                "D4_SET_END_EOD_FACT_BINDING",
            )
            assessment = pair.anomaly_assessment
            require(
                assessment.analysis_unit_id == leg.analysis_unit_id
                and assessment.source_code == leg.source_code
                and assessment.start_projection_sha256 == leg.start_fact_id
                and assessment.end_projection_sha256 == leg.end_fact_id
                and assessment.policy_id == self.anomaly_policy_id,
                "D4_SET_ANOMALY_BINDING",
            )
            require(
                leg.available_at <= evaluated_at
                and assessment.available_at <= evaluated_at,
                "D4_SET_FUTURE_INPUT",
            )
        require(self.identity_history is None or isinstance(self.identity_history, TrendingIdentityHistory),
                "D4_SET_IDENTITY_HISTORY_TYPE")
        require(self.knowledge_mode != "PROSPECTIVE_PIT" or self.identity_history is not None,
                "D4_SET_IDENTITY_HISTORY_REQUIRED")
        if self.identity_history is not None:
            require(self.identity_history.assembled_at <= evaluated_at, "D4_SET_IDENTITY_ASSEMBLY_FROM_FUTURE")
            # Validate both original memberships even for an empty pair set.
            for proof in (self.start_eod_proof, self.end_eod_proof):
                upstream = self.identity_history.upstream(proof.upstream_membership_sha256)
                require(upstream.membership_id == proof.upstream_membership_id, "D4_SET_IDENTITY_MEMBERSHIP_DRIFT")
            # Validate each historical binding without retaining the resulting
            # source-leg collection. Full universes can contain tens of
            # thousands of intentionally verbose binding receipts.
            for _leg in self.iter_legs():
                pass

    @property
    def start_date(self) -> date:
        return self.result_as_of - timedelta(days=30)

    @property
    def legs(self) -> tuple[TrendingSourceLeg, ...]:
        return tuple(self.iter_legs())

    def iter_legs(self) -> Iterator[TrendingSourceLeg]:
        """Yield exact source legs without materializing the whole universe."""
        # Pair JSON is an external Mapping boundary: never reuse a derived leg
        # after its caller replaced a value under the same sealed EOD identity.
        for pair in self.pairs:
            for projection, proof in ((pair.start_projection, self.start_eod_proof),
                                      (pair.end_projection, self.end_eod_proof)):
                _validated(projection, "D4_CONSUMED_PROJECTION_INVALID")
                _validate_eod_projection(projection, proof)
        for pair in self.pairs:
            leg = trending_source_leg_from_cny_pair(pair, start_date=self.start_date, end_date=self.result_as_of)
            if self.identity_history is not None:
                binding = self.identity_history.bind_pair(pair.start_projection, pair.end_projection,
                    start_membership_id=self.start_eod_proof.upstream_membership_id,
                    start_membership_sha256=self.start_eod_proof.upstream_membership_sha256,
                    end_membership_id=self.end_eod_proof.upstream_membership_id,
                    end_membership_sha256=self.end_eod_proof.upstream_membership_sha256)
                leg = replace(leg, identity_binding=binding,
                              identity_binding_sha256=sha256_hex(canonical_json_bytes(binding)))
            yield leg

    @property
    def identities(self) -> tuple[tuple[str, str], ...]:
        return tuple((leg.analysis_unit_id, leg.source_code) for leg in self.legs)

    @property
    def anomaly_assessment_set_sha256(self) -> str:
        return _set_hash(pair.anomaly_assessment.to_document() for pair in self.pairs)

    @property
    def source_leg_set_sha256(self) -> str:
        return _set_hash(leg.to_document() for leg in self.iter_legs())

    def iter_pair_documents(self) -> Iterator[dict[str, Any]]:
        for pair, leg in zip(self.pairs, self.iter_legs(), strict=True):
            yield {
                "analysis_unit_id": leg.analysis_unit_id,
                "source_code": leg.source_code,
                "anomaly_assessment": pair.anomaly_assessment.to_document(),
                "start_projection": dict(pair.start_projection),
                "end_projection": dict(pair.end_projection),
            }

    def pair_documents(self) -> list[dict[str, Any]]:
        return list(self.iter_pair_documents())

    def _body_without_pairs(
        self,
        *,
        pair_set_sha256: str,
        source_leg_set_sha256: str,
    ) -> dict[str, Any]:
        return {
            "schema_version": TRENDING_CURRENT_ENDPOINT_SET_SCHEMA,
            "membership_id": self.membership_id,
            "member_set_sha256": self.member_set_sha256,
            "member_count": self.member_count,
            "catalog_snapshot_sha256": self.catalog_snapshot_sha256,
            "knowledge_mode": self.knowledge_mode,
            "identity_history_sha256": None if self.identity_history is None else self.identity_history.history_sha256,
            "identity_history": None if self.identity_history is None else self.identity_history.to_document(),
            "maximum_source_lag_seconds": self.maximum_source_lag_seconds,
            "start_date": self.start_date.isoformat(),
            "result_as_of": self.result_as_of.isoformat(),
            "evaluated_at": utc_timestamp_text(self.evaluated_at),
            "start_eod_proof": self.start_eod_proof.to_document(),
            "end_eod_proof": self.end_eod_proof.to_document(),
            "anomaly_policy_id": self.anomaly_policy_id,
            "anomaly_assessment_set_sha256": self.anomaly_assessment_set_sha256,
            "pair_count": len(self.pairs),
            "pair_set_sha256": pair_set_sha256,
            "source_leg_set_sha256": source_leg_set_sha256,
        }

    def body_document(self) -> dict[str, Any]:
        documents = self.pair_documents()
        return {
            **self._body_without_pairs(
                pair_set_sha256=sha256_hex(canonical_json_bytes(documents)),
                source_leg_set_sha256=self.source_leg_set_sha256,
            ),
            "pairs": documents,
        }

    def _streamed_identity(self) -> tuple[str, str, str]:
        source_hash = self.source_leg_set_sha256
        pair_hash = _canonical_array_hash(self.iter_pair_documents())
        endpoint_id = _document_id_with_array(
            self._body_without_pairs(
                pair_set_sha256=pair_hash,
                source_leg_set_sha256=source_hash,
            ),
            "pairs",
            self.iter_pair_documents(),
        )
        return endpoint_id, pair_hash, source_hash

    @property
    def endpoint_set_id(self) -> str:
        endpoint_id, _pair_hash, _source_hash = self._streamed_identity()
        return endpoint_id

    @property
    def window_evidence(self) -> TrendingWindowEvidence:
        # This receipt is assembled at evaluation, not retroactively at the
        # earliest instant its source legs happened to exist. The formal gate
        # independently requires the referenced membership to be known by it.
        available_at = self.evaluated_at
        endpoint_id, _pair_hash, source_hash = self._streamed_identity()
        return TrendingWindowEvidence(
            endpoint_set_id=endpoint_id,
            membership_id=self.membership_id,
            member_set_sha256=self.member_set_sha256,
            member_count=self.member_count,
            catalog_snapshot_sha256=self.catalog_snapshot_sha256,
            start_date=self.start_date,
            end_date=self.result_as_of,
            start_eod_reduction_id=self.start_eod_proof.reduction_id,
            start_eod_sha256=self.start_eod_proof.artifact_sha256,
            start_eod_reduced_at=self.start_eod_proof.reduced_at,
            end_eod_reduction_id=self.end_eod_proof.reduction_id,
            end_eod_sha256=self.end_eod_proof.artifact_sha256,
            end_eod_reduced_at=self.end_eod_proof.reduced_at,
            anomaly_policy_id=self.anomaly_policy_id,
            anomaly_assessment_set_sha256=self.anomaly_assessment_set_sha256,
            source_leg_set_sha256=source_hash,
            available_at=available_at,
            knowledge_mode=self.knowledge_mode,
            identity_history_sha256=None if self.identity_history is None else self.identity_history.history_sha256,
            identity_history=self.identity_history,
        )

    def to_document(self) -> dict[str, Any]:
        return {"endpoint_set_id": self.endpoint_set_id, **self.body_document()}

    @classmethod
    def build(
        cls,
        *,
        membership_id: str,
        member_set_sha256: str,
        member_count: int,
        catalog_snapshot_sha256: str,
        result_as_of: date,
        evaluated_at: datetime,
        maximum_source_lag_seconds: int,
        start_eod_proof: TrendingEodProof,
        end_eod_proof: TrendingEodProof,
        anomaly_policy_id: str,
        knowledge_mode: str,
        pairs: Iterable[TrendingCnyEndpointPair],
        identity_history: TrendingIdentityHistory | None = None,
    ) -> "TrendingCurrentEndpointSet":
        start_date = result_as_of - timedelta(days=30)
        identified = [
            (
                trending_source_leg_from_cny_pair(
                    pair, start_date=start_date, end_date=result_as_of
                ),
                pair,
            )
            for pair in pairs
        ]
        identified.sort(key=lambda value: (value[0].analysis_unit_id, value[0].source_code))
        return cls(
            membership_id=membership_id,
            member_set_sha256=member_set_sha256,
            member_count=member_count,
            catalog_snapshot_sha256=catalog_snapshot_sha256,
            result_as_of=result_as_of,
            evaluated_at=evaluated_at,
            maximum_source_lag_seconds=maximum_source_lag_seconds,
            start_eod_proof=start_eod_proof,
            end_eod_proof=end_eod_proof,
            anomaly_policy_id=anomaly_policy_id,
            knowledge_mode=knowledge_mode,
            pairs=tuple(pair for _leg, pair in identified),
            identity_history=identity_history,
        )

    @classmethod
    def from_document(cls, value: Any) -> "TrendingCurrentEndpointSet":
        document = require_exact_keys(
            value,
            {
                "endpoint_set_id", "schema_version", "membership_id",
                "member_set_sha256", "member_count", "catalog_snapshot_sha256",
                "knowledge_mode", "maximum_source_lag_seconds", "start_date",
                "result_as_of", "evaluated_at", "start_eod_proof",
                "end_eod_proof", "anomaly_policy_id",
                "anomaly_assessment_set_sha256", "pair_count",
                "pair_set_sha256", "source_leg_set_sha256", "pairs",
                "identity_history", "identity_history_sha256",
            },
            "D4_SET_DOCUMENT",
        )
        require(document["schema_version"] == TRENDING_CURRENT_ENDPOINT_SET_SCHEMA, "D4_SET_SCHEMA")
        require(isinstance(document["pairs"], list), "D4_SET_PAIRS")
        pairs: list[TrendingCnyEndpointPair] = []
        expected_identities: list[tuple[str, str]] = []
        for raw_pair in document["pairs"]:
            pair_document = require_exact_keys(
                raw_pair,
                {
                    "analysis_unit_id", "source_code", "anomaly_assessment",
                    "start_projection", "end_projection",
                },
                "D4_SET_PAIR",
            )
            pair = TrendingCnyEndpointPair(
                start_projection=pair_document["start_projection"],
                end_projection=pair_document["end_projection"],
                anomaly_assessment=TrendingAnomalyAssessment.from_document(
                    pair_document["anomaly_assessment"]
                ),
            )
            pairs.append(pair)
            expected_identities.append(
                (pair_document["analysis_unit_id"], pair_document["source_code"])
            )
        endpoint_set = cls(
            membership_id=document["membership_id"],
            member_set_sha256=document["member_set_sha256"],
            member_count=document["member_count"],
            catalog_snapshot_sha256=document["catalog_snapshot_sha256"],
            result_as_of=parse_date(document["result_as_of"], "D4_SET_AS_OF"),
            evaluated_at=parse_timestamp(document["evaluated_at"], "D4_SET_EVALUATED_AT"),
            maximum_source_lag_seconds=document["maximum_source_lag_seconds"],
            start_eod_proof=TrendingEodProof.from_document(document["start_eod_proof"]),
            end_eod_proof=TrendingEodProof.from_document(document["end_eod_proof"]),
            anomaly_policy_id=document["anomaly_policy_id"],
            knowledge_mode=document["knowledge_mode"],
            pairs=tuple(pairs),
            identity_history=None if document["identity_history"] is None else
                TrendingIdentityHistory.from_document(document["identity_history"]),
        )
        require(document["start_date"] == endpoint_set.start_date.isoformat(), "D4_SET_START_DATE")
        require(tuple(expected_identities) == endpoint_set.identities, "D4_SET_PAIR_IDENTITY")
        require(document["pair_count"] == len(endpoint_set.pairs), "D4_SET_PAIR_COUNT")
        require(
            document["anomaly_assessment_set_sha256"]
            == endpoint_set.anomaly_assessment_set_sha256,
            "D4_SET_ANOMALY_SET",
        )
        require(document["source_leg_set_sha256"] == endpoint_set.source_leg_set_sha256, "D4_SET_LEG_SET")
        require(endpoint_set.to_document() == dict(document), "D4_SET_IDENTITY")
        return endpoint_set


@dataclass(frozen=True, slots=True)
class TrendingCurrentEndpointSelection:
    endpoint_set: TrendingCurrentEndpointSet
    start_projection_count: int
    end_projection_count: int
    start_in_membership_count: int
    end_in_membership_count: int
    outside_membership_start_count: int
    outside_membership_end_count: int
    paired_projection_count: int
    unpaired_start_count: int
    unpaired_end_count: int
    unknown_anomaly_count: int

    def __post_init__(self) -> None:
        counts = (
            self.start_projection_count, self.end_projection_count,
            self.start_in_membership_count, self.end_in_membership_count,
            self.outside_membership_start_count, self.outside_membership_end_count,
            self.paired_projection_count, self.unpaired_start_count,
            self.unpaired_end_count, self.unknown_anomaly_count,
        )
        require(
            isinstance(self.endpoint_set, TrendingCurrentEndpointSet)
            and all(type(value) is int and value >= 0 for value in counts),
            "D4_SELECTION_SHAPE",
        )
        require(
            self.start_projection_count
            == self.start_in_membership_count + self.outside_membership_start_count,
            "D4_SELECTION_START_ACCOUNTING",
        )
        require(
            self.end_projection_count
            == self.end_in_membership_count + self.outside_membership_end_count,
            "D4_SELECTION_END_ACCOUNTING",
        )
        require(
            self.start_in_membership_count
            == self.paired_projection_count + self.unpaired_start_count
            and self.end_in_membership_count
            == self.paired_projection_count + self.unpaired_end_count,
            "D4_SELECTION_PAIR_ACCOUNTING",
        )
        require(len(self.endpoint_set.pairs) == self.paired_projection_count, "D4_SELECTION_PAIR_COUNT")
        require(
            self.unknown_anomaly_count
            == sum(
                pair.anomaly_assessment.status is TrendingAnomalyStatus.UNKNOWN
                for pair in self.endpoint_set.pairs
            ),
            "D4_SELECTION_ANOMALY_ACCOUNTING",
        )

    def accounting_document(self) -> dict[str, int]:
        return {
            "start_projection_count": self.start_projection_count,
            "end_projection_count": self.end_projection_count,
            "start_in_membership_count": self.start_in_membership_count,
            "end_in_membership_count": self.end_in_membership_count,
            "outside_membership_start_count": self.outside_membership_start_count,
            "outside_membership_end_count": self.outside_membership_end_count,
            "paired_projection_count": self.paired_projection_count,
            "unpaired_start_count": self.unpaired_start_count,
            "unpaired_end_count": self.unpaired_end_count,
            "unknown_anomaly_count": self.unknown_anomaly_count,
        }


def build_current_endpoint_set_from_daily_projections(
    *,
    membership: "TrendingMembership",
    result_as_of: date,
    evaluated_at: datetime,
    maximum_source_lag_seconds: int,
    start_projections: Iterable[Mapping[str, Any]],
    end_projections: Iterable[Mapping[str, Any]],
    start_eod_proof: TrendingEodProof,
    end_eod_proof: TrendingEodProof,
    anomaly_policy_id: str,
    anomaly_assessments: Iterable[TrendingAnomalyAssessment] = (),
    identity_history: TrendingIdentityHistory | None = None,
) -> TrendingCurrentEndpointSelection:
    """Pair exact 30-day projections and retain every evidence boundary."""

    from .models import TrendingMembership

    require(isinstance(membership, TrendingMembership), "D4_SELECTION_MEMBERSHIP")
    require(isinstance(result_as_of, date), "D4_SELECTION_AS_OF")
    evaluated_at = _utc(evaluated_at, "D4_SELECTION_EVALUATED_AT")
    require(membership.available_at <= evaluated_at, "D4_SELECTION_MEMBERSHIP_NOT_KNOWN")
    require(isinstance(start_eod_proof, TrendingEodProof), "D4_SELECTION_START_EOD")
    require(isinstance(end_eod_proof, TrendingEodProof), "D4_SELECTION_END_EOD")
    require_sha256(anomaly_policy_id, "D4_SELECTION_ANOMALY_POLICY")
    start_date = result_as_of - timedelta(days=30)
    require(
        start_eod_proof.bucket_date == start_date
        and end_eod_proof.bucket_date == result_as_of,
        "D4_SELECTION_EOD_DATE_BINDING",
    )
    member_ids = {member.analysis_unit_id for member in membership.members}
    members_by_id = {member.analysis_unit_id: member for member in membership.members}

    def indexed(
        values: Iterable[Mapping[str, Any]],
        *,
        expected_day: date,
        proof: TrendingEodProof,
        code: str,
    ) -> tuple[dict[tuple[str, str], Mapping[str, Any]], int, int]:
        answer: dict[tuple[str, str], Mapping[str, Any]] = {}
        seen: set[tuple[str, str]] = set()
        outside = 0
        count = 0
        proof_facts = proof.fact_by_identity
        for raw in values:
            projection = _validated(raw, code + "_PROJECTION_INVALID")
            require(projection["event_day"] == expected_day.isoformat(), code + "_DATE_DRIFT")
            require(
                parse_timestamp(projection["available_at"], code + "_AVAILABLE_AT")
                <= evaluated_at,
                code + "_FUTURE_PROJECTION",
            )
            source = projection["source"]
            key = (source["analysis_unit_id"], source["logical_source"])
            require(key not in seen, code + "_DUPLICATE_PROJECTION")
            seen.add(key)
            require(
                key in proof_facts
                and proof_facts[key]["source_fact_sha256"]
                == source["source_fact_sha256"],
                code + "_EOD_FACT_BINDING",
            )
            _validate_eod_projection(projection, proof)
            count += 1
            if key[0] not in member_ids:
                outside += 1
                continue
            member = members_by_id[key[0]]
            require(member.identity_available_at <= evaluated_at, code + "_MEMBER_NOT_KNOWN")
            source_identity = projection.get("economic_identity")
            require(isinstance(source_identity, Mapping) and member.economic_identity is not None,
                    code + "_ECONOMIC_PROOF_REQUIRED")
            require(source_identity["fingerprint_sha256"] == member.economic_identity["fingerprint_sha256"],
                    code + "_ECONOMIC_IDENTITY_DRIFT")
            answer[key] = projection
        return answer, count, outside

    start, start_count, start_outside = indexed(
        start_projections,
        expected_day=start_date,
        proof=start_eod_proof,
        code="D4_SELECTION_START",
    )
    end, end_count, end_outside = indexed(
        end_projections,
        expected_day=result_as_of,
        proof=end_eod_proof,
        code="D4_SELECTION_END",
    )
    common = tuple(sorted(set(start) & set(end)))
    supplied_assessments: dict[tuple[str, str], TrendingAnomalyAssessment] = {}
    for assessment in anomaly_assessments:
        require(isinstance(assessment, TrendingAnomalyAssessment), "D4_SELECTION_ANOMALY_TYPE")
        key = (assessment.analysis_unit_id, assessment.source_code)
        require(key not in supplied_assessments, "D4_SELECTION_DUPLICATE_ANOMALY")
        require(key in common, "D4_SELECTION_ANOMALY_OUTSIDE_PAIR")
        supplied_assessments[key] = assessment

    pairs: list[TrendingCnyEndpointPair] = []
    for key in common:
        assessment = supplied_assessments.get(key)
        if assessment is None:
            assessment = TrendingAnomalyAssessment.unknown(
                analysis_unit_id=key[0],
                source_code=key[1],
                start_projection_sha256=start[key]["document_hash"],
                end_projection_sha256=end[key]["document_hash"],
                policy_id=anomaly_policy_id,
                available_at=evaluated_at,
            )
        pairs.append(
            TrendingCnyEndpointPair(
                start_projection=start[key],
                end_projection=end[key],
                anomaly_assessment=assessment,
            )
        )

    # Current display assembly is not the history. Only original, content-checked
    # source mappings and version intervals can qualify the historical endpoints.
    knowledge_mode = (
        "PROSPECTIVE_PIT"
        if identity_history is not None and all(
            parse_timestamp(projection["economic_identity"]["available_at"], "D4_ECONOMIC_KNOWN")
            <= parse_timestamp(projection["source"]["event_at"], "D4_SOURCE_EVENT")
            for projection in (*start.values(), *end.values())
        )
        else "RETROSPECTIVE_DIAGNOSTIC"
    )
    endpoint_set = TrendingCurrentEndpointSet.build(
        membership_id=membership.membership_id,
        member_set_sha256=membership.member_set_sha256,
        member_count=len(membership.members),
        catalog_snapshot_sha256=membership.catalog_snapshot_sha256,
        result_as_of=result_as_of,
        evaluated_at=evaluated_at,
        maximum_source_lag_seconds=maximum_source_lag_seconds,
        start_eod_proof=start_eod_proof,
        end_eod_proof=end_eod_proof,
        anomaly_policy_id=anomaly_policy_id,
        knowledge_mode=knowledge_mode,
        pairs=pairs,
        identity_history=identity_history,
    )
    return TrendingCurrentEndpointSelection(
        endpoint_set=endpoint_set,
        start_projection_count=start_count,
        end_projection_count=end_count,
        start_in_membership_count=len(start),
        end_in_membership_count=len(end),
        outside_membership_start_count=start_outside,
        outside_membership_end_count=end_outside,
        paired_projection_count=len(common),
        unpaired_start_count=len(start) - len(common),
        unpaired_end_count=len(end) - len(common),
        unknown_anomaly_count=sum(
            pair.anomaly_assessment.status is TrendingAnomalyStatus.UNKNOWN
            for pair in pairs
        ),
    )


def _validated(document: Mapping[str, Any], code: str) -> Mapping[str, Any]:
    try:
        validate_cny_analysis_projection(document)
    except CnyAnalysisProjectionError as exc:
        raise TrendingContractError(code) from exc
    require(document["formal_state_eligible"] is False, "D4_INPUT_SCOPE_DRIFT")
    require(document["usage_scope"] == "INTERNAL_ANALYSIS_INPUT", "D4_INPUT_SCOPE_DRIFT")
    source = document["source"]
    target = document["target"]
    require(source["logical_source"] in EXPECTED_SOURCES, "D4_SOURCE_UNSUPPORTED")
    require(source["price_kind"] == "ASK", "D4_PRICE_KIND_UNSUPPORTED")
    require(
        target["status"] == "AVAILABLE"
        and target["currency"] == "CNY"
        and target["unit"] == "CNY_MINOR",
        "D4_TARGET_NOT_CNY_MINOR",
    )
    return document


def trending_source_leg_from_cny_pair(
    pair: TrendingCnyEndpointPair,
    *,
    start_date: date,
    end_date: date,
) -> TrendingSourceLeg:
    require(isinstance(pair, TrendingCnyEndpointPair), "D4_ENDPOINT_PAIR_TYPE")
    require(
        isinstance(start_date, date)
        and isinstance(end_date, date)
        and (end_date - start_date).days == 30,
        "D4_WINDOW_DATES",
    )
    start = _validated(pair.start_projection, "D4_START_PROJECTION_INVALID")
    end = _validated(pair.end_projection, "D4_END_PROJECTION_INVALID")
    start_source = start["source"]
    end_source = end["source"]
    require(start["event_day"] == start_date.isoformat(), "D4_START_DATE_DRIFT")
    require(end["event_day"] == end_date.isoformat(), "D4_END_DATE_DRIFT")
    require(
        start_source["analysis_unit_id"] == end_source["analysis_unit_id"]
        and start_source["source_item_id"] == end_source["source_item_id"]
        and start_source["logical_source"] == end_source["logical_source"]
        and start_source["transport"] == end_source["transport"]
        and start_source["price_kind"] == end_source["price_kind"],
        "D4_ENDPOINT_IDENTITY_DRIFT",
    )
    assessment = pair.anomaly_assessment
    require(
        assessment.analysis_unit_id == start_source["analysis_unit_id"]
        and assessment.source_code == start_source["logical_source"]
        and assessment.start_projection_sha256 == start["document_hash"]
        and assessment.end_projection_sha256 == end["document_hash"],
        "D4_ANOMALY_PROJECTION_BINDING",
    )
    input_known_at = max(parse_timestamp(start["available_at"], "D4_START_AVAILABLE_AT"),
                         parse_timestamp(end["available_at"], "D4_END_AVAILABLE_AT"))
    require(assessment.available_at >= input_known_at, "D4_ANOMALY_BEFORE_INPUTS")
    start_identity = start.get("economic_identity")
    end_identity = end.get("economic_identity")
    fingerprint = None
    if start_identity is not None or end_identity is not None:
        require(isinstance(start_identity, Mapping) and isinstance(end_identity, Mapping)
                and start_identity["fingerprint_sha256"] == end_identity["fingerprint_sha256"],
                "D4_ENDPOINT_ECONOMIC_IDENTITY_DRIFT")
        fingerprint = start_identity["fingerprint_sha256"]
    return TrendingSourceLeg(
        analysis_unit_id=start_source["analysis_unit_id"],
        source_code=start_source["logical_source"],
        start_date=start_date,
        end_date=end_date,
        start_cny_minor=int(start["target"]["value"]),
        end_cny_minor=int(end["target"]["value"]),
        start_fact_id=start["document_hash"],
        end_fact_id=end["document_hash"],
        available_at=max(
            parse_timestamp(start["available_at"], "D4_START_AVAILABLE_AT"),
            parse_timestamp(end["available_at"], "D4_END_AVAILABLE_AT"),
            assessment.available_at,
        ),
        anomaly_status=assessment.status,
        anomaly_assessment_id=assessment.assessment_id,
        economic_identity_sha256=fingerprint,
        endpoint_observed_at=(
            datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=UTC)
            if start.get("schema") == end.get("schema") == CNY_ANALYSIS_SCHEMA_V2
            and start.get("observation") is not None and end.get("observation") is not None
            else None
        ),
    )


def build_current_trending_source_legs(
    pairs: Iterable[TrendingCnyEndpointPair],
    *,
    start_date: date,
    end_date: date,
) -> tuple[TrendingSourceLeg, ...]:
    rows = tuple(
        trending_source_leg_from_cny_pair(
            pair, start_date=start_date, end_date=end_date
        )
        for pair in pairs
    )
    identities = [(row.analysis_unit_id, row.source_code) for row in rows]
    require(len(identities) == len(set(identities)), "D4_DUPLICATE_ENDPOINT_PAIR")
    return tuple(sorted(rows, key=lambda row: (row.analysis_unit_id, row.source_code)))


__all__ = [
    "TRENDING_ANOMALY_ASSESSMENT_SCHEMA",
    "TRENDING_CURRENT_ENDPOINT_SET_SCHEMA",
    "TRENDING_EOD_PROOF_SCHEMA",
    "TrendingAnomalyAssessment",
    "TrendingCnyEndpointPair",
    "TrendingCurrentEndpointSelection",
    "TrendingCurrentEndpointSet",
    "TrendingEodProof",
    "build_current_endpoint_set_from_daily_projections",
    "build_current_trending_source_legs",
    "trending_source_leg_from_cny_pair",
]
