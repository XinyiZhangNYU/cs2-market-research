"""Strict wire DTOs for derived research results.

The DTO is deliberately separate from state-machine dataclasses.  It exposes
only provider-neutral, explicitly projected fields and rejects unknown keys.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.state_machine.claims import ClaimNotAllowed, validate_claims
from cs2_research.state_machine.enums import (
    AnalysisUnitKind,
    CaseStatus,
    ClaimCode,
    CoreDomain,
    DataBranch,
    DataStatus,
    DomainMissingReasonCode,
    DomainStrength,
    EvidenceFlag,
    ItemCycleStage,
    MarketLevelRegime,
    MarketTrendStage,
    Recommendation,
    RegimeRelation,
    RelativeStrength,
    ScopeKind,
    SectorTrendStage,
    SignalStrength,
    TradeConfirmation,
)
from cs2_research.state_machine.models import VersionContext


CONTRACT_CODE = "research-result-envelope"
CONTRACT_VERSION = "v1"
EDITION_KINDS = frozenset({"STANDARD", "STATTRAK", "SOUVENIR", "UNKNOWN"})
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_CANONICAL_TIMESTAMP = re.compile(
    r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$"
)
_EVIDENCE_COVERAGE = re.compile(r"^(?:0(?:\.[0-9]+)?|1(?:\.0+)?)$")
_SIGNED_FIXED_DECIMAL = re.compile(r"^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$")
_NONBLANK_TEXT = re.compile(
    r"^(?=[^\u0000\ud800-\udfff]*"
    r"[^\u0000\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200a"
    r"\u2028\u2029\u202f\u205f\u3000\ud800-\udfff])"
    r"[^\u0000\ud800-\udfff]+$"
)
_VERSION_FIELDS = (
    "catalog_version",
    "group_version",
    "index_version",
    "fusion_method_version",
    "feature_profile_version",
    "algorithm_version",
    "parameter_set_version",
    "stage_policy_version",
    "failure_policy_version",
)


class ResultContractError(ValueError):
    """A document cannot enter the formal result boundary."""


def _text(value: Any, name: str) -> str:
    if not isinstance(value, str) or not _NONBLANK_TEXT.fullmatch(value):
        raise ResultContractError(f"{name} must be non-empty NUL-free text")
    return value


def _utc(value: datetime, name: str) -> None:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() != timezone.utc.utcoffset(value)
    ):
        raise ResultContractError(f"{name} must use UTC")


def _timestamp(value: Any, name: str) -> datetime:
    text = _text(value, name)
    if not _CANONICAL_TIMESTAMP.fullmatch(text):
        raise ResultContractError(
            f"{name} must use canonical UTC spelling YYYY-MM-DDTHH:MM:SS.ffffffZ"
        )
    try:
        parsed = datetime.fromisoformat(text[:-1] + "+00:00")
    except ValueError as exc:
        raise ResultContractError(f"{name} must be an ISO-8601 timestamp") from exc
    _utc(parsed, name)
    return parsed


def _ratio_decimal(value: Any, name: str) -> str:
    text = _text(value, name)
    if not _EVIDENCE_COVERAGE.fullmatch(text):
        raise ResultContractError(
            f"{name} must be a decimal string between 0 and 1"
        )
    return text


def _evidence_coverage(value: Any) -> str:
    return _ratio_decimal(value, "evidence_coverage")


def _signed_fixed_decimal(value: Any, name: str) -> str:
    text = _text(value, name)
    if not _SIGNED_FIXED_DECIMAL.fullmatch(text):
        raise ResultContractError(
            f"{name} must be a finite signed fixed-decimal string"
        )
    return text


def _exact(document: Mapping[str, Any], expected: set[str], name: str) -> None:
    if not isinstance(document, Mapping):
        raise ResultContractError(f"{name} must be an object")
    actual = set(document)
    if actual != expected:
        missing = sorted(expected - actual)
        unknown = sorted(actual - expected)
        raise ResultContractError(
            f"{name} keys mismatch; missing={missing}, unknown={unknown}"
        )


def _sha(value: Any, name: str) -> str:
    text = _text(value, name)
    if not _SHA256.fullmatch(text):
        raise ResultContractError(f"{name} must be a lowercase SHA-256 hex digest")
    return text


def _enum(enum_type: type[Any], value: Any, name: str) -> Any:
    try:
        return enum_type(value)
    except (TypeError, ValueError) as exc:
        raise ResultContractError(f"unsupported {name}: {value!r}") from exc


def _string_tuple(value: Any, name: str, *, unique: bool = True) -> tuple[str, ...]:
    if not isinstance(value, list):
        raise ResultContractError(f"{name} must be an array")
    members = tuple(_text(member, f"{name} member") for member in value)
    if unique and len(members) != len(set(members)):
        raise ResultContractError(f"{name} members must be unique")
    return members


def _version_document(versions: VersionContext) -> dict[str, str]:
    return {field: getattr(versions, field) for field in _VERSION_FIELDS}


def _version_context(document: Any) -> VersionContext:
    if not isinstance(document, Mapping):
        raise ResultContractError("versions must be an object")
    _exact(document, set(_VERSION_FIELDS), "versions")
    return VersionContext(**{field: _text(document[field], field) for field in _VERSION_FIELDS})


@dataclass(frozen=True, slots=True)
class ResultIdentity:
    analysis_unit_id: str
    scope_kind: ScopeKind
    display_name: str
    identity_available_at: datetime
    catalog_version: str
    analysis_unit_kind: AnalysisUnitKind | None = None
    edition_kind: str | None = None
    parent_analysis_unit_id: str | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.scope_kind, ScopeKind):
            raise ResultContractError("scope_kind must be ScopeKind")
        _text(self.analysis_unit_id, "analysis_unit_id")
        _text(self.display_name, "display_name")
        _text(self.catalog_version, "catalog_version")
        _utc(self.identity_available_at, "identity_available_at")
        if self.scope_kind is ScopeKind.ITEM:
            if not isinstance(self.analysis_unit_kind, AnalysisUnitKind):
                raise ResultContractError("ITEM identity requires analysis_unit_kind")
            if self.edition_kind not in EDITION_KINDS:
                raise ResultContractError("ITEM identity requires a supported edition_kind")
            if self.analysis_unit_kind is AnalysisUnitKind.BASE_MHN:
                if self.parent_analysis_unit_id is not None:
                    raise ResultContractError("BASE_MHN identity cannot carry a parent")
            else:
                _text(self.parent_analysis_unit_id, "parent_analysis_unit_id")
                if self.parent_analysis_unit_id == self.analysis_unit_id:
                    raise ResultContractError("an item identity cannot parent itself")
        elif (
            self.analysis_unit_kind is not None
            or self.edition_kind is not None
            or self.parent_analysis_unit_id is not None
        ):
            raise ResultContractError(
                "MARKET/SECTOR identities cannot carry item kind, edition, or parent"
            )

    def to_document(self) -> dict[str, Any]:
        return {
            "analysis_unit_id": self.analysis_unit_id,
            "scope_kind": self.scope_kind.value,
            "display_name": self.display_name,
            "identity_available_at": utc_timestamp_text(self.identity_available_at),
            "catalog_version": self.catalog_version,
            "analysis_unit_kind": (
                self.analysis_unit_kind.value if self.analysis_unit_kind else None
            ),
            "edition_kind": self.edition_kind,
            "parent_analysis_unit_id": self.parent_analysis_unit_id,
        }

    @classmethod
    def from_document(cls, document: Any) -> "ResultIdentity":
        if not isinstance(document, Mapping):
            raise ResultContractError("identity must be an object")
        _exact(
            document,
            {
                "analysis_unit_id",
                "scope_kind",
                "display_name",
                "identity_available_at",
                "catalog_version",
                "analysis_unit_kind",
                "edition_kind",
                "parent_analysis_unit_id",
            },
            "identity",
        )
        scope = _enum(ScopeKind, document["scope_kind"], "scope_kind")
        raw_kind = document["analysis_unit_kind"]
        kind = None if raw_kind is None else _enum(
            AnalysisUnitKind, raw_kind, "analysis_unit_kind"
        )
        raw_edition = document["edition_kind"]
        if raw_edition is not None and not isinstance(raw_edition, str):
            raise ResultContractError("edition_kind must be a string or null")
        return cls(
            analysis_unit_id=_text(document["analysis_unit_id"], "analysis_unit_id"),
            scope_kind=scope,
            display_name=_text(document["display_name"], "display_name"),
            identity_available_at=_timestamp(
                document["identity_available_at"], "identity_available_at"
            ),
            catalog_version=_text(document["catalog_version"], "catalog_version"),
            analysis_unit_kind=kind,
            edition_kind=raw_edition,
            parent_analysis_unit_id=(
                None
                if document["parent_analysis_unit_id"] is None
                else _text(
                    document["parent_analysis_unit_id"],
                    "parent_analysis_unit_id",
                )
            ),
        )


def _validate_state(scope: ScopeKind, document: Any) -> dict[str, Any]:
    if not isinstance(document, Mapping):
        raise ResultContractError("state must be an object")
    state = dict(document)
    common = {"evidence_flags", "recommendation", "case_status", "input_snapshot_hash"}
    if scope is ScopeKind.MARKET:
        expected = common | {"trend_stage", "level_regime", "analysis_case_id"}
        _exact(state, expected, "MARKET state")
        _enum(MarketTrendStage, state["trend_stage"], "trend_stage")
        _enum(MarketLevelRegime, state["level_regime"], "level_regime")
    elif scope is ScopeKind.SECTOR:
        expected = common | {
            "trend_stage",
            "relative_strength",
            "breadth",
            "analysis_case_id",
        }
        _exact(state, expected, "SECTOR state")
        _enum(SectorTrendStage, state["trend_stage"], "trend_stage")
        _enum(RelativeStrength, state["relative_strength"], "relative_strength")
        breadth = state["breadth"]
        if not isinstance(breadth, Mapping):
            raise ResultContractError("breadth must be an object")
        _exact(
            breadth,
            {
                "advancing_member_ratio",
                "median_member_return",
                "breadth_expanding",
                "breadth_narrowing",
                "concentration_warning",
            },
            "breadth",
        )
        if breadth["advancing_member_ratio"] is not None:
            _ratio_decimal(
                breadth["advancing_member_ratio"], "advancing_member_ratio"
            )
        if breadth["median_member_return"] is not None:
            _signed_fixed_decimal(
                breadth["median_member_return"], "median_member_return"
            )
        for field in (
            "breadth_expanding",
            "breadth_narrowing",
            "concentration_warning",
        ):
            if not isinstance(breadth[field], bool):
                raise ResultContractError(f"{field} must be boolean")
    else:
        expected = common | {
            "cycle_stage",
            "regime_relation",
            "candidate_episode_id",
            "cycle_case_id",
        }
        _exact(state, expected, "ITEM state")
        _enum(ItemCycleStage, state["cycle_stage"], "cycle_stage")
        relations = _string_tuple(state["regime_relation"], "regime_relation")
        for relation in relations:
            _enum(RegimeRelation, relation, "regime_relation")
    flags = _string_tuple(state["evidence_flags"], "evidence_flags")
    for flag in flags:
        _enum(EvidenceFlag, flag, "evidence_flag")
    _enum(Recommendation, state["recommendation"], "recommendation")
    if state["case_status"] is not None:
        _enum(CaseStatus, state["case_status"], "case_status")
    for field in ("analysis_case_id", "candidate_episode_id", "cycle_case_id"):
        if field in state and state[field] is not None:
            _text(state[field], field)
    _sha(state["input_snapshot_hash"], "input_snapshot_hash")
    return state


def _validate_recommendation(document: Any, branch: DataBranch) -> dict[str, Any] | None:
    if document is None:
        return None
    if not isinstance(document, Mapping):
        raise ResultContractError("recommendation_detail must be an object or null")
    recommendation = dict(document)
    _exact(
        recommendation,
        {
            "recommendation",
            "signal_strength",
            "evidence_coverage",
            "trade_confirmation",
            "input_snapshot_hash",
        },
        "recommendation_detail",
    )
    _enum(Recommendation, recommendation["recommendation"], "recommendation")
    _enum(SignalStrength, recommendation["signal_strength"], "signal_strength")
    _evidence_coverage(recommendation["evidence_coverage"])
    confirmation = _enum(
        TradeConfirmation,
        recommendation["trade_confirmation"],
        "trade_confirmation",
    )
    if branch is DataBranch.B and confirmation is not TradeConfirmation.UNAVAILABLE:
        raise ResultContractError("branch B recommendation must expose unavailable trades")
    _sha(recommendation["input_snapshot_hash"], "input_snapshot_hash")
    return recommendation


def _validate_domains(document: Any) -> tuple[dict[str, Any], ...]:
    if not isinstance(document, list):
        raise ResultContractError("evidence_domains must be an array")
    domains: list[dict[str, Any]] = []
    seen: set[CoreDomain] = set()
    for index, raw in enumerate(document):
        if not isinstance(raw, Mapping):
            raise ResultContractError(f"evidence_domains[{index}] must be an object")
        member = dict(raw)
        _exact(
            member,
            {
                "domain",
                "strength",
                "contributing_feature_keys",
                "missing_reason",
                "policy_version",
                "input_snapshot_hash",
            },
            f"evidence_domains[{index}]",
        )
        domain = _enum(CoreDomain, member["domain"], "domain")
        if domain in seen:
            raise ResultContractError("evidence domains must be unique")
        seen.add(domain)
        strength = _enum(DomainStrength, member["strength"], "strength")
        keys = _string_tuple(
            member["contributing_feature_keys"], "contributing_feature_keys"
        )
        reason = member["missing_reason"]
        if strength in {DomainStrength.UNAVAILABLE, DomainStrength.CONFLICTED}:
            _enum(DomainMissingReasonCode, reason, "missing_reason")
        elif reason is not None:
            raise ResultContractError("available evidence domain cannot carry missing_reason")
        if keys != tuple(sorted(keys)):
            raise ResultContractError("contributing_feature_keys must be sorted")
        _text(member["policy_version"], "policy_version")
        _sha(member["input_snapshot_hash"], "input_snapshot_hash")
        domains.append(member)
    if seen != set(CoreDomain):
        raise ResultContractError("ITEM results require exactly P/D/S evidence domains")
    return tuple(sorted(domains, key=lambda item: item["domain"]))


@dataclass(frozen=True, slots=True)
class UnitResultEnvelope:
    identity: ResultIdentity
    as_of: datetime
    available_at: datetime
    data_branch: DataBranch
    data_status: DataStatus
    versions: VersionContext
    state: Mapping[str, Any]
    recommendation_detail: Mapping[str, Any] | None
    evidence_domains: tuple[Mapping[str, Any], ...]
    claims: tuple[ClaimCode, ...]

    def __post_init__(self) -> None:
        if not isinstance(self.identity, ResultIdentity):
            raise ResultContractError("identity must be ResultIdentity")
        if not isinstance(self.data_branch, DataBranch):
            raise ResultContractError("data_branch must be DataBranch")
        if not isinstance(self.data_status, DataStatus):
            raise ResultContractError("data_status must be DataStatus")
        if not isinstance(self.versions, VersionContext):
            raise ResultContractError("versions must be VersionContext")
        _utc(self.as_of, "as_of")
        _utc(self.available_at, "available_at")
        if self.identity.identity_available_at > self.as_of:
            raise ResultContractError("identity knowledge cannot be later than as_of")
        if self.available_at > self.as_of:
            raise ResultContractError("available_at cannot be later than as_of")
        if self.identity.catalog_version != self.versions.catalog_version:
            raise ResultContractError("identity and state catalog versions differ")
        state = _validate_state(self.identity.scope_kind, self.state)
        recommendation = _validate_recommendation(
            self.recommendation_detail, self.data_branch
        )
        if self.identity.scope_kind is ScopeKind.ITEM:
            if recommendation is None:
                raise ResultContractError("ITEM result requires recommendation_detail")
            domains = _validate_domains([dict(member) for member in self.evidence_domains])
            if recommendation["recommendation"] != state["recommendation"]:
                raise ResultContractError(
                    "item state and recommendation detail disagree"
                )
            if recommendation["input_snapshot_hash"] != state["input_snapshot_hash"]:
                raise ResultContractError(
                    "item state and recommendation detail input hashes differ"
                )
            domain_input_hashes = {
                member["input_snapshot_hash"] for member in domains
            }
            if len(domain_input_hashes) != 1:
                raise ResultContractError(
                    "P/D/S evidence domains must bind one feature snapshot"
                )
        else:
            if recommendation is not None or self.evidence_domains:
                raise ResultContractError(
                    "MARKET/SECTOR result cannot carry item recommendation or P/D/S"
                )
            domains = ()
        if any(not isinstance(claim, ClaimCode) for claim in self.claims):
            raise ResultContractError("claims must contain ClaimCode values")
        try:
            validate_claims(self.data_branch, self.claims)
        except ClaimNotAllowed as exc:
            raise ResultContractError(str(exc)) from None
        if self.identity.scope_kind is not ScopeKind.ITEM and self.claims:
            raise ResultContractError("MARKET/SECTOR result cannot carry item claims")
        if len(self.claims) != len(set(self.claims)):
            raise ResultContractError("claims must be unique")
        object.__setattr__(self, "state", state)
        object.__setattr__(self, "recommendation_detail", recommendation)
        object.__setattr__(self, "evidence_domains", domains)
        object.__setattr__(self, "claims", tuple(sorted(self.claims, key=lambda x: x.value)))

    def body_document(self) -> dict[str, Any]:
        return {
            "contract_code": CONTRACT_CODE,
            "contract_version": CONTRACT_VERSION,
            "envelope_kind": "UNIT",
            "identity": self.identity.to_document(),
            "as_of": utc_timestamp_text(self.as_of),
            "available_at": utc_timestamp_text(self.available_at),
            "data_branch": self.data_branch.value,
            "data_status": self.data_status.value,
            "versions": _version_document(self.versions),
            "state": dict(self.state),
            "recommendation_detail": (
                dict(self.recommendation_detail)
                if self.recommendation_detail is not None
                else None
            ),
            "evidence_domains": [dict(member) for member in self.evidence_domains],
            "claims": [claim.value for claim in self.claims],
        }

    @property
    def snapshot_id(self) -> str:
        return sha256_hex(canonical_json_bytes(self.body_document()))

    def to_document(self) -> dict[str, Any]:
        return {"snapshot_id": self.snapshot_id, **self.body_document()}

    @property
    def document_hash(self) -> str:
        return sha256_hex(canonical_json_bytes(self.to_document()))

    @classmethod
    def from_document(cls, document: Any) -> "UnitResultEnvelope":
        if not isinstance(document, Mapping):
            raise ResultContractError("unit result must be an object")
        expected = {
            "snapshot_id",
            "contract_code",
            "contract_version",
            "envelope_kind",
            "identity",
            "as_of",
            "available_at",
            "data_branch",
            "data_status",
            "versions",
            "state",
            "recommendation_detail",
            "evidence_domains",
            "claims",
        }
        _exact(document, expected, "unit result")
        if document["contract_code"] != CONTRACT_CODE:
            raise ResultContractError("unsupported contract_code")
        if document["contract_version"] != CONTRACT_VERSION:
            raise ResultContractError("unsupported contract_version")
        if document["envelope_kind"] != "UNIT":
            raise ResultContractError("unit result requires envelope_kind=UNIT")
        claims_raw = _string_tuple(document["claims"], "claims")
        raw_domains = document["evidence_domains"]
        if not isinstance(raw_domains, list):
            raise ResultContractError("evidence_domains must be an array")
        envelope = cls(
            identity=ResultIdentity.from_document(document["identity"]),
            as_of=_timestamp(document["as_of"], "as_of"),
            available_at=_timestamp(document["available_at"], "available_at"),
            data_branch=_enum(DataBranch, document["data_branch"], "data_branch"),
            data_status=_enum(DataStatus, document["data_status"], "data_status"),
            versions=_version_context(document["versions"]),
            state=document["state"],
            recommendation_detail=document["recommendation_detail"],
            evidence_domains=tuple(raw_domains),
            claims=tuple(_enum(ClaimCode, claim, "claim") for claim in claims_raw),
        )
        if list(document["claims"]) != [claim.value for claim in envelope.claims]:
            raise ResultContractError("claims must use canonical ascending order")
        if list(raw_domains) != [dict(member) for member in envelope.evidence_domains]:
            raise ResultContractError(
                "evidence_domains must use canonical ascending domain order"
            )
        if _sha(document["snapshot_id"], "snapshot_id") != envelope.snapshot_id:
            raise ResultContractError("snapshot_id does not match canonical unit result")
        return envelope


@dataclass(frozen=True, slots=True)
class CollectionResultEnvelope:
    collection_id: str
    scope_kind: ScopeKind
    as_of: datetime
    available_at: datetime
    data_branch: DataBranch
    data_status: DataStatus
    versions: VersionContext
    member_count: int
    member_result_ids: tuple[str, ...]
    missing_member_ids: tuple[str, ...]
    unavailable_member_ids: tuple[str, ...]

    def __post_init__(self) -> None:
        if not isinstance(self.scope_kind, ScopeKind):
            raise ResultContractError("scope_kind must be ScopeKind")
        if not isinstance(self.data_branch, DataBranch):
            raise ResultContractError("data_branch must be DataBranch")
        if not isinstance(self.data_status, DataStatus):
            raise ResultContractError("data_status must be DataStatus")
        if not isinstance(self.versions, VersionContext):
            raise ResultContractError("versions must be VersionContext")
        _text(self.collection_id, "collection_id")
        _utc(self.as_of, "as_of")
        _utc(self.available_at, "available_at")
        if self.available_at > self.as_of:
            raise ResultContractError("collection available_at cannot be later than as_of")
        if isinstance(self.member_count, bool) or not isinstance(self.member_count, int):
            raise ResultContractError("member_count must be an integer")
        if self.member_count < 0:
            raise ResultContractError("member_count cannot be negative")
        for name, values in (
            ("member_result_ids", self.member_result_ids),
            ("missing_member_ids", self.missing_member_ids),
            ("unavailable_member_ids", self.unavailable_member_ids),
        ):
            if len(values) != len(set(values)):
                raise ResultContractError(f"{name} must be unique")
            for value in values:
                if name == "member_result_ids":
                    _sha(value, name)
                else:
                    _text(value, name)
        if set(self.missing_member_ids).intersection(self.unavailable_member_ids):
            raise ResultContractError("missing and unavailable members must not overlap")
        if (
            len(self.member_result_ids)
            + len(self.missing_member_ids)
            + len(self.unavailable_member_ids)
            != self.member_count
        ):
            raise ResultContractError("collection member accounting must be exact")
        object.__setattr__(self, "member_result_ids", tuple(sorted(self.member_result_ids)))
        object.__setattr__(self, "missing_member_ids", tuple(sorted(self.missing_member_ids)))
        object.__setattr__(
            self, "unavailable_member_ids", tuple(sorted(self.unavailable_member_ids))
        )

    def body_document(self) -> dict[str, Any]:
        return {
            "contract_code": CONTRACT_CODE,
            "contract_version": CONTRACT_VERSION,
            "envelope_kind": "COLLECTION",
            "collection_id": self.collection_id,
            "scope_kind": self.scope_kind.value,
            "as_of": utc_timestamp_text(self.as_of),
            "available_at": utc_timestamp_text(self.available_at),
            "data_branch": self.data_branch.value,
            "data_status": self.data_status.value,
            "versions": _version_document(self.versions),
            "member_count": self.member_count,
            "returned_member_count": len(self.member_result_ids),
            "member_result_ids": list(self.member_result_ids),
            "missing_member_ids": list(self.missing_member_ids),
            "unavailable_member_ids": list(self.unavailable_member_ids),
        }

    @property
    def snapshot_id(self) -> str:
        return sha256_hex(canonical_json_bytes(self.body_document()))

    def to_document(self) -> dict[str, Any]:
        return {"snapshot_id": self.snapshot_id, **self.body_document()}

    @property
    def document_hash(self) -> str:
        return sha256_hex(canonical_json_bytes(self.to_document()))

    @classmethod
    def from_document(cls, document: Any) -> "CollectionResultEnvelope":
        if not isinstance(document, Mapping):
            raise ResultContractError("collection result must be an object")
        expected = {
            "snapshot_id",
            "contract_code",
            "contract_version",
            "envelope_kind",
            "collection_id",
            "scope_kind",
            "as_of",
            "available_at",
            "data_branch",
            "data_status",
            "versions",
            "member_count",
            "returned_member_count",
            "member_result_ids",
            "missing_member_ids",
            "unavailable_member_ids",
        }
        _exact(document, expected, "collection result")
        if document["contract_code"] != CONTRACT_CODE:
            raise ResultContractError("unsupported contract_code")
        if document["contract_version"] != CONTRACT_VERSION:
            raise ResultContractError("unsupported contract_version")
        if document["envelope_kind"] != "COLLECTION":
            raise ResultContractError("collection requires envelope_kind=COLLECTION")
        returned = document["returned_member_count"]
        if isinstance(returned, bool) or not isinstance(returned, int):
            raise ResultContractError("returned_member_count must be an integer")
        member_result_ids = _string_tuple(
            document["member_result_ids"], "member_result_ids"
        )
        if returned != len(member_result_ids):
            raise ResultContractError("returned_member_count does not match member IDs")
        envelope = cls(
            collection_id=_text(document["collection_id"], "collection_id"),
            scope_kind=_enum(ScopeKind, document["scope_kind"], "scope_kind"),
            as_of=_timestamp(document["as_of"], "as_of"),
            available_at=_timestamp(document["available_at"], "available_at"),
            data_branch=_enum(DataBranch, document["data_branch"], "data_branch"),
            data_status=_enum(DataStatus, document["data_status"], "data_status"),
            versions=_version_context(document["versions"]),
            member_count=document["member_count"],
            member_result_ids=member_result_ids,
            missing_member_ids=_string_tuple(
                document["missing_member_ids"], "missing_member_ids"
            ),
            unavailable_member_ids=_string_tuple(
                document["unavailable_member_ids"], "unavailable_member_ids"
            ),
        )
        for name in (
            "member_result_ids",
            "missing_member_ids",
            "unavailable_member_ids",
        ):
            if list(document[name]) != list(getattr(envelope, name)):
                raise ResultContractError(
                    f"{name} must use canonical ascending order"
                )
        if _sha(document["snapshot_id"], "snapshot_id") != envelope.snapshot_id:
            raise ResultContractError(
                "snapshot_id does not match canonical collection result"
            )
        return envelope


def decode_result_envelope(
    document: Any,
) -> UnitResultEnvelope | CollectionResultEnvelope:
    """Decode one formal result through the provider-neutral semantic boundary."""
    if not isinstance(document, Mapping):
        raise ResultContractError("result envelope must be an object")
    kind = document.get("envelope_kind")
    if kind == "UNIT":
        return UnitResultEnvelope.from_document(document)
    if kind == "COLLECTION":
        return CollectionResultEnvelope.from_document(document)
    raise ResultContractError(f"unsupported envelope_kind: {kind!r}")


__all__ = [
    "CONTRACT_CODE",
    "CONTRACT_VERSION",
    "CollectionResultEnvelope",
    "EDITION_KINDS",
    "ResultContractError",
    "ResultIdentity",
    "UnitResultEnvelope",
    "decode_result_envelope",
]
