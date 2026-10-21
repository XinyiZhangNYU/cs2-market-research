"""Immutable contracts shared by state policies, reducers, and storage.

No object in this module fetches platform data.  Source identities only appear
as provenance on a unified feature snapshot; the state reducer consumes that
unified snapshot and policy assessment, never a platform-specific signal.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import TypeAlias

from .enums import (
    AnalysisUnitKind,
    BLOCKING_DATA_STATUSES,
    EVIDENCE_BEARING_STRENGTHS,
    DERIVED_GRACE_DATA_STATUSES,
    CaseStatus,
    CoreDomain,
    DataBranch,
    DataStatus,
    Directness,
    DomainMissingReasonCode,
    DomainStrength,
    EvidenceFlag,
    EvidenceType,
    FeatureProvision,
    FeatureRequiredness,
    FeatureValueStatus,
    FreshnessStatus,
    ItemCycleStage,
    LifecycleAction,
    LifecycleEntityKind,
    MarketLevelRegime,
    MarketTrendStage,
    MissingCause,
    Recommendation,
    RegimeRelation,
    RelativeStrength,
    ResolutionCode,
    ScopeKind,
    SectorTrendStage,
    SemanticStatus,
    SignalStrength,
    TradeConfirmation,
    TransitionMode,
    TransitionReason,
)
from .hashing import content_id, stable_hash

Scalar: TypeAlias = Decimal | int | str | bool | None


def _require_text(value: str, name: str) -> None:
    if not value or not value.strip():
        raise ValueError(f"{name} must be non-empty")


def _require_aware(value: datetime, name: str) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{name} must be timezone-aware")


def _require_ratio(value: Decimal, name: str) -> None:
    if value < Decimal(0) or value > Decimal(1):
        raise ValueError(f"{name} must be between 0 and 1")


@dataclass(frozen=True, slots=True)
class VersionContext:
    """All versions required to reproduce a formal state decision."""

    catalog_version: str
    group_version: str
    index_version: str
    fusion_method_version: str
    feature_profile_version: str
    algorithm_version: str
    parameter_set_version: str
    stage_policy_version: str
    failure_policy_version: str

    def __post_init__(self) -> None:
        for field_name in (
            "catalog_version",
            "group_version",
            "index_version",
            "fusion_method_version",
            "feature_profile_version",
            "algorithm_version",
            "parameter_set_version",
            "stage_policy_version",
            "failure_policy_version",
        ):
            _require_text(getattr(self, field_name), field_name)


@dataclass(frozen=True, slots=True)
class FeatureExpectation:
    """One feature's branch availability, algorithm requirement and domain use."""

    feature_key: str
    requiredness: FeatureRequiredness
    provision: FeatureProvision
    eligible_domains: frozenset[CoreDomain] = field(default_factory=frozenset)

    def __post_init__(self) -> None:
        _require_text(self.feature_key, "feature_key")
        if (
            self.requiredness is FeatureRequiredness.REQUIRED
            and self.provision is FeatureProvision.UNAVAILABLE_BY_DESIGN
        ):
            raise ValueError(
                "a required feature cannot be unavailable by design; "
                "the algorithm is unsupported on this data branch"
            )


@dataclass(frozen=True, slots=True)
class FeatureExpectationProfile:
    """Immutable, hash-bound feature contract for one branch and scope."""

    version: str
    data_branch: DataBranch
    scope_kind: ScopeKind
    analysis_unit_kind: AnalysisUnitKind
    expectations: tuple[FeatureExpectation, ...]

    def __post_init__(self) -> None:
        _require_text(self.version, "feature profile version")
        if not self.expectations:
            raise ValueError("feature profile cannot be empty")
        keys = [expectation.feature_key for expectation in self.expectations]
        if len(keys) != len(set(keys)):
            raise ValueError("feature expectation keys must be unique")
        object.__setattr__(
            self,
            "expectations",
            tuple(sorted(self.expectations, key=lambda item: item.feature_key)),
        )

    @property
    def profile_hash(self) -> str:
        return stable_hash(self)

    def expectation(self, feature_key: str) -> FeatureExpectation:
        for expectation in self.expectations:
            if expectation.feature_key == feature_key:
                return expectation
        raise KeyError(feature_key)

    def classify(
        self, features: tuple["UnifiedFeatureValue", ...]
    ) -> DataStatus:
        """Validate a fully materialized feature set and derive aggregate status."""

        feature_map = {feature.feature_key: feature for feature in features}
        profile_keys = {
            expectation.feature_key for expectation in self.expectations
        }
        if set(feature_map) != profile_keys or len(feature_map) != len(features):
            missing = sorted(profile_keys - set(feature_map))
            unexpected = sorted(set(feature_map) - profile_keys)
            raise ValueError(
                "features must exactly match the expectation profile; "
                f"missing={missing}, unexpected={unexpected}"
            )

        required_conflict = False
        required_runtime_gap = False
        optional_degraded = False
        by_design_gap = False
        for expectation in self.expectations:
            feature = feature_map[expectation.feature_key]
            if expectation.provision is FeatureProvision.UNAVAILABLE_BY_DESIGN:
                if not (
                    feature.status is FeatureValueStatus.UNAVAILABLE
                    and feature.missing_cause is MissingCause.BY_DESIGN
                ):
                    raise ValueError(
                        "a by-design-unavailable feature must be "
                        "UNAVAILABLE/BY_DESIGN"
                    )
                by_design_gap = True
                continue

            if (
                feature.status is FeatureValueStatus.UNAVAILABLE
                and feature.missing_cause is not MissingCause.RUNTIME
            ):
                raise ValueError(
                    "an expected unavailable feature must carry RUNTIME cause"
                )
            if expectation.requiredness is FeatureRequiredness.REQUIRED:
                required_conflict |= (
                    feature.status is FeatureValueStatus.CONFLICTED
                )
                required_runtime_gap |= (
                    feature.status is FeatureValueStatus.UNAVAILABLE
                )
            else:
                optional_degraded |= feature.status in {
                    FeatureValueStatus.UNAVAILABLE,
                    FeatureValueStatus.CONFLICTED,
                }

        if required_conflict:
            return DataStatus.CONFLICTED
        if required_runtime_gap:
            return DataStatus.DATA_UNAVAILABLE_RUNTIME
        if optional_degraded:
            return DataStatus.DEGRADED_OPTIONAL
        if by_design_gap:
            return DataStatus.UNAVAILABLE_BY_DESIGN
        return DataStatus.COMPLETE


@dataclass(frozen=True, slots=True)
class UnifiedFeatureValue:
    """One field-level fused value with explicit semantic and source scope."""

    feature_key: str
    scope_key: str
    analysis_unit_kind: AnalysisUnitKind
    value: Scalar
    unit: str
    status: FeatureValueStatus
    semantic_status: SemanticStatus
    participating_sources: tuple[str, ...]
    source_coverage: Decimal
    source_dispersion: Decimal | None
    evidence_type: EvidenceType
    directness: Directness
    missing_cause: MissingCause | None
    input_fact_ids: tuple[str, ...]

    def __post_init__(self) -> None:
        _require_text(self.feature_key, "feature_key")
        _require_text(self.scope_key, "scope_key")
        _require_text(self.unit, "unit")
        object.__setattr__(
            self,
            "participating_sources",
            tuple(sorted(self.participating_sources)),
        )
        object.__setattr__(self, "input_fact_ids", tuple(sorted(self.input_fact_ids)))
        _require_ratio(self.source_coverage, "source_coverage")
        if len(set(self.participating_sources)) != len(self.participating_sources):
            raise ValueError("participating_sources must be unique")
        if len(set(self.input_fact_ids)) != len(self.input_fact_ids):
            raise ValueError("input_fact_ids must be unique")
        if self.source_dispersion is not None and self.source_dispersion < 0:
            raise ValueError("source_dispersion cannot be negative")
        if self.status is FeatureValueStatus.AVAILABLE:
            if self.value is None:
                raise ValueError("an available feature must have a value")
            if not self.participating_sources or not self.input_fact_ids:
                raise ValueError("an available feature must retain source provenance")
            if self.semantic_status is SemanticStatus.INCOMPATIBLE:
                raise ValueError("semantically incompatible facts cannot be available")
            if self.missing_cause is not None:
                raise ValueError("an available feature cannot carry a missing cause")
        elif self.value is not None:
            raise ValueError(
                "unavailable/conflicted features cannot expose a fused value"
            )
        elif self.status is FeatureValueStatus.UNAVAILABLE:
            if self.missing_cause is None:
                raise ValueError("an unavailable feature requires a missing cause")
        elif self.missing_cause is not None:
            raise ValueError("a conflicted feature is not a missing observation")
        if (
            self.directness is Directness.INFERRED
            and self.evidence_type is EvidenceType.TRADE
        ):
            raise ValueError("inferred values cannot be represented as trade facts")


@dataclass(frozen=True, slots=True)
class UnifiedFeatureSnapshot:
    analysis_unit_id: str
    scope_kind: ScopeKind
    analysis_unit_kind: AnalysisUnitKind
    available_at: datetime
    features: tuple[UnifiedFeatureValue, ...]
    participating_sources: tuple[str, ...]
    source_coverage: Decimal
    source_dispersion: Decimal | None
    semantic_compatibility: SemanticStatus
    input_fact_ids: tuple[str, ...]
    input_snapshot_hash: str
    versions: VersionContext
    feature_profile: FeatureExpectationProfile
    data_branch: DataBranch
    freshness_status: FreshnessStatus
    data_status: DataStatus = field(init=False)

    def __post_init__(self) -> None:
        _require_text(self.analysis_unit_id, "analysis_unit_id")
        _require_aware(self.available_at, "available_at")
        object.__setattr__(
            self,
            "features",
            tuple(sorted(self.features, key=lambda feature: feature.feature_key)),
        )
        object.__setattr__(
            self,
            "participating_sources",
            tuple(sorted(self.participating_sources)),
        )
        object.__setattr__(self, "input_fact_ids", tuple(sorted(self.input_fact_ids)))
        _require_ratio(self.source_coverage, "source_coverage")
        if self.source_dispersion is not None and self.source_dispersion < 0:
            raise ValueError("source_dispersion cannot be negative")
        keys = [feature.feature_key for feature in self.features]
        if len(keys) != len(set(keys)):
            raise ValueError("feature keys must be unique within a snapshot")
        if len(set(self.participating_sources)) != len(self.participating_sources):
            raise ValueError("participating_sources must be unique")
        if len(set(self.input_fact_ids)) != len(self.input_fact_ids):
            raise ValueError("input_fact_ids must be unique")
        _require_text(self.input_snapshot_hash, "input_snapshot_hash")
        feature_sources = {
            source
            for feature in self.features
            for source in feature.participating_sources
        }
        if not feature_sources.issubset(set(self.participating_sources)):
            raise ValueError("snapshot provenance must include all feature sources")
        feature_facts = {
            fact_id for feature in self.features for fact_id in feature.input_fact_ids
        }
        if not feature_facts.issubset(set(self.input_fact_ids)):
            raise ValueError("snapshot provenance must include all feature fact ids")
        if self.feature_profile.data_branch is not self.data_branch:
            raise ValueError("feature profile data branch mismatch")
        if self.feature_profile.scope_kind is not self.scope_kind:
            raise ValueError("feature profile scope mismatch")
        if self.feature_profile.analysis_unit_kind is not self.analysis_unit_kind:
            raise ValueError("feature profile analysis-unit kind mismatch")
        if any(feature.scope_key != self.analysis_unit_id for feature in self.features):
            raise ValueError("all features must bind to the snapshot analysis unit")
        if any(
            feature.analysis_unit_kind is not self.analysis_unit_kind
            for feature in self.features
        ):
            raise ValueError("all features must use the snapshot analysis-unit kind")
        if self.feature_profile.version != self.versions.feature_profile_version:
            raise ValueError("feature profile version mismatch")
        materialization_status = self.feature_profile.classify(self.features)
        if materialization_status in {
            DataStatus.CONFLICTED,
            DataStatus.DATA_UNAVAILABLE_RUNTIME,
        }:
            aggregate_status = materialization_status
        elif self.freshness_status is FreshnessStatus.STALE:
            aggregate_status = DataStatus.STALE
        else:
            aggregate_status = materialization_status
        object.__setattr__(self, "data_status", aggregate_status)

    @property
    def snapshot_id(self) -> str:
        return content_id("ufs", self)

    def feature(self, key: str) -> UnifiedFeatureValue:
        for feature in self.features:
            if feature.feature_key == key:
                return feature
        raise KeyError(key)


@dataclass(frozen=True, slots=True)
class EvidenceDomainSnapshot:
    analysis_unit_id: str
    scope_kind: ScopeKind
    domain: CoreDomain
    strength: DomainStrength
    contributing_feature_keys: tuple[str, ...]
    missing_reason: DomainMissingReasonCode | None
    policy_version: str
    available_at: datetime
    input_snapshot_hash: str
    versions: VersionContext
    data_branch: DataBranch
    data_status: DataStatus

    def __post_init__(self) -> None:
        _require_text(self.policy_version, "policy_version")
        _require_text(self.analysis_unit_id, "analysis_unit_id")
        _require_aware(self.available_at, "available_at")
        _require_text(self.input_snapshot_hash, "input_snapshot_hash")
        object.__setattr__(
            self,
            "contributing_feature_keys",
            tuple(sorted(self.contributing_feature_keys)),
        )
        if self.scope_kind is not ScopeKind.ITEM:
            raise ValueError("P/D/S domains are item-scope evidence")
        if len(self.contributing_feature_keys) != len(
            set(self.contributing_feature_keys)
        ):
            raise ValueError("contributing feature keys must be unique")
        if self.strength in {DomainStrength.UNAVAILABLE, DomainStrength.CONFLICTED}:
            if not isinstance(self.missing_reason, DomainMissingReasonCode):
                raise ValueError("unavailable/conflicted domains require a reason")
        elif self.missing_reason is not None:
            raise ValueError("available domain strengths cannot carry a missing reason")
        if (
            self.strength in EVIDENCE_BEARING_STRENGTHS
            and not self.contributing_feature_keys
        ):
            raise ValueError("an evidence-bearing domain requires contributing features")

    @property
    def snapshot_id(self) -> str:
        return content_id("eds", self)


@dataclass(frozen=True, slots=True)
class ItemPolicyAssessment:
    """Versioned policy output consumed by the deterministic item reducer.

    Thresholds are intentionally absent.  A policy version classifies fused
    facts into these booleans and domain strengths.  The reducer independently
    enforces semantic invariants such as the absolute-rise requirement.
    """

    unified_snapshot: UnifiedFeatureSnapshot
    domains: tuple[EvidenceDomainSnapshot, ...]
    absolute_return: Decimal | None
    pressure_qualified: bool
    confirmation_qualified: bool
    cooling_qualified: bool
    baseline_qualified: bool
    fast_path_qualified: bool
    watch_qualified: bool
    recommended_qualified: bool
    strong_qualified: bool
    overheated: bool
    evidence_flags: frozenset[EvidenceFlag]
    regime_relation: frozenset[RegimeRelation]
    signal_strength: SignalStrength
    evidence_coverage: Decimal
    trade_confirmation: TradeConfirmation
    market_state_id: str | None
    sector_state_id: str | None

    def __post_init__(self) -> None:
        if self.unified_snapshot.scope_kind is not ScopeKind.ITEM:
            raise ValueError("an item assessment requires an ITEM unified snapshot")
        object.__setattr__(
            self,
            "domains",
            tuple(sorted(self.domains, key=lambda domain: domain.domain.value)),
        )
        if self.unified_snapshot.data_status in DERIVED_GRACE_DATA_STATUSES:
            raise ValueError("grace data statuses are reducer outputs, not inputs")
        _require_ratio(self.evidence_coverage, "evidence_coverage")
        domain_map = {domain.domain: domain for domain in self.domains}
        if set(domain_map) != set(CoreDomain) or len(self.domains) != len(CoreDomain):
            raise ValueError("an item assessment must contain exactly P, D, and S")
        for domain in self.domains:
            if domain.analysis_unit_id != self.unified_snapshot.analysis_unit_id:
                raise ValueError("domain analysis unit mismatch")
            if domain.available_at != self.unified_snapshot.available_at:
                raise ValueError(
                    "domain evidence must share the bound snapshot availability time"
                )
            if domain.data_branch is not self.unified_snapshot.data_branch:
                raise ValueError("domain data branch mismatch")
            if domain.data_status is not self.unified_snapshot.data_status:
                raise ValueError("domain data status mismatch")
            if domain.versions != self.unified_snapshot.versions:
                raise ValueError("domain version context mismatch")
            if domain.input_snapshot_hash != self.unified_snapshot.input_snapshot_hash:
                raise ValueError("domain input hash must bind the unified snapshot")
            for feature_key in domain.contributing_feature_keys:
                try:
                    feature = self.unified_snapshot.feature(feature_key)
                    expectation = self.unified_snapshot.feature_profile.expectation(
                        feature_key
                    )
                except KeyError as error:
                    raise ValueError(
                        "domain evidence must resolve in the bound feature snapshot"
                    ) from error
                if domain.domain not in expectation.eligible_domains:
                    raise ValueError(
                        "feature profile does not admit the contributor for this domain"
                    )
                if (
                    domain.strength in EVIDENCE_BEARING_STRENGTHS
                    and feature.status is not FeatureValueStatus.AVAILABLE
                ):
                    raise ValueError(
                        "domain evidence must reference an available feature"
                    )
        if self.baseline_qualified and any(
            (
                self.pressure_qualified,
                self.confirmation_qualified,
                self.cooling_qualified,
                self.fast_path_qualified,
            )
        ):
            raise ValueError(
                "baseline qualification cannot conflict with active signals"
            )
        if self.confirmation_qualified and self.cooling_qualified:
            raise ValueError("confirmation and cooling cannot both be qualified")
        if self.strong_qualified and not self.recommended_qualified:
            raise ValueError("strong qualification requires recommended qualification")
        if self.recommended_qualified and not self.watch_qualified:
            raise ValueError("recommended qualification requires watch qualification")
        if any(
            (
                self.pressure_qualified,
                self.confirmation_qualified,
                self.cooling_qualified,
                self.fast_path_qualified,
            )
        ) and not any(
            domain.strength in EVIDENCE_BEARING_STRENGTHS for domain in self.domains
        ):
            raise ValueError(
                "a stage-changing qualification requires bound item evidence"
            )
        if self.unified_snapshot.data_branch is DataBranch.B:
            if self.trade_confirmation is not TradeConfirmation.UNAVAILABLE:
                raise ValueError(
                    "data branch B must expose unavailable trade confirmation"
                )
            if EvidenceFlag.SWEEPING_CONFIRMED in self.evidence_flags:
                raise ValueError("data branch B cannot assert confirmed sweeping")
        if (
            EvidenceFlag.SWEEPING_CONFIRMED in self.evidence_flags
            and self.trade_confirmation is not TradeConfirmation.CONFIRMED
        ):
            raise ValueError("confirmed sweeping requires admitted trade confirmation")
        if EvidenceFlag.SUSPECTED_SWEEPING in self.evidence_flags:
            demand = domain_map[CoreDomain.DEMAND]
            supply = domain_map[CoreDomain.SUPPLY]
            if all(
                domain.strength
                in {DomainStrength.UNAVAILABLE, DomainStrength.CONFLICTED}
                for domain in (demand, supply)
            ):
                raise ValueError(
                    "suspected sweeping requires usable demand or supply evidence"
                )

    @property
    def analysis_unit_id(self) -> str:
        return self.unified_snapshot.analysis_unit_id

    @property
    def available_at(self) -> datetime:
        return self.unified_snapshot.available_at

    @property
    def versions(self) -> VersionContext:
        return self.unified_snapshot.versions

    @property
    def data_branch(self) -> DataBranch:
        return self.unified_snapshot.data_branch

    @property
    def data_status(self) -> DataStatus:
        return self.unified_snapshot.data_status

    @property
    def input_snapshot_hash(self) -> str:
        return stable_hash(
            {
                "unified_snapshot": self.unified_snapshot.snapshot_id,
                "domains": tuple(domain.snapshot_id for domain in self.domains),
                "policy": self,
            }
        )


@dataclass(frozen=True, slots=True)
class ItemStateSnapshot:
    analysis_unit_id: str
    available_at: datetime
    cycle_stage: ItemCycleStage
    evidence_flags: frozenset[EvidenceFlag]
    data_status: DataStatus
    regime_relation: frozenset[RegimeRelation]
    recommendation: Recommendation
    case_status: CaseStatus | None
    candidate_episode_id: str | None
    cycle_case_id: str | None
    data_branch: DataBranch
    versions: VersionContext
    input_snapshot_hash: str

    def __post_init__(self) -> None:
        _require_text(self.analysis_unit_id, "analysis_unit_id")
        _require_aware(self.available_at, "available_at")
        _require_text(self.input_snapshot_hash, "input_snapshot_hash")
        if self.cycle_case_id is not None and self.candidate_episode_id is not None:
            raise ValueError(
                "an active cycle case replaces an active candidate episode"
            )
        if self.case_status is not None and not (
            self.cycle_case_id or self.candidate_episode_id
        ):
            raise ValueError("case_status requires an active candidate or cycle case")

    @property
    def scope_kind(self) -> ScopeKind:
        return ScopeKind.ITEM

    @property
    def snapshot_id(self) -> str:
        return content_id("state", self)


@dataclass(frozen=True, slots=True)
class MarketStateSnapshot:
    analysis_unit_id: str
    available_at: datetime
    trend_stage: MarketTrendStage
    level_regime: MarketLevelRegime
    evidence_flags: frozenset[EvidenceFlag]
    data_status: DataStatus
    recommendation: Recommendation
    case_status: CaseStatus | None
    analysis_case_id: str | None
    data_branch: DataBranch
    versions: VersionContext
    input_snapshot_hash: str

    def __post_init__(self) -> None:
        _require_text(self.analysis_unit_id, "analysis_unit_id")
        _require_aware(self.available_at, "available_at")
        _require_text(self.input_snapshot_hash, "input_snapshot_hash")
        if self.case_status is not None and self.analysis_case_id is None:
            raise ValueError("case_status requires an analysis case")

    @property
    def scope_kind(self) -> ScopeKind:
        return ScopeKind.MARKET

    @property
    def snapshot_id(self) -> str:
        return content_id("state", self)


@dataclass(frozen=True, slots=True)
class SectorBreadth:
    advancing_member_ratio: Decimal | None
    median_member_return: Decimal | None
    breadth_expanding: bool
    breadth_narrowing: bool
    concentration_warning: bool

    def __post_init__(self) -> None:
        if self.advancing_member_ratio is not None:
            _require_ratio(self.advancing_member_ratio, "advancing_member_ratio")
        if self.breadth_expanding and self.breadth_narrowing:
            raise ValueError("breadth cannot expand and narrow simultaneously")


@dataclass(frozen=True, slots=True)
class SectorStateSnapshot:
    analysis_unit_id: str
    available_at: datetime
    trend_stage: SectorTrendStage
    relative_strength: RelativeStrength
    breadth: SectorBreadth
    evidence_flags: frozenset[EvidenceFlag]
    data_status: DataStatus
    recommendation: Recommendation
    case_status: CaseStatus | None
    analysis_case_id: str | None
    data_branch: DataBranch
    versions: VersionContext
    input_snapshot_hash: str

    def __post_init__(self) -> None:
        _require_text(self.analysis_unit_id, "analysis_unit_id")
        _require_aware(self.available_at, "available_at")
        _require_text(self.input_snapshot_hash, "input_snapshot_hash")
        if self.case_status is not None and self.analysis_case_id is None:
            raise ValueError("case_status requires an analysis case")

    @property
    def scope_kind(self) -> ScopeKind:
        return ScopeKind.SECTOR

    @property
    def snapshot_id(self) -> str:
        return content_id("state", self)


@dataclass(frozen=True, slots=True)
class RecommendationSnapshot:
    analysis_unit_id: str
    available_at: datetime
    recommendation: Recommendation
    signal_strength: SignalStrength
    evidence_coverage: Decimal
    trade_confirmation: TradeConfirmation
    data_branch: DataBranch
    data_status: DataStatus
    input_snapshot_hash: str
    versions: VersionContext

    def __post_init__(self) -> None:
        _require_ratio(self.evidence_coverage, "evidence_coverage")
        _require_aware(self.available_at, "available_at")
        if (
            self.data_branch is DataBranch.B
            and self.trade_confirmation is not TradeConfirmation.UNAVAILABLE
        ):
            raise ValueError("branch B recommendation must expose unavailable trades")

    @property
    def snapshot_id(self) -> str:
        return content_id("rec", self)

    @property
    def scope_kind(self) -> ScopeKind:
        return ScopeKind.ITEM


@dataclass(frozen=True, slots=True)
class StateTransition:
    analysis_unit_id: str
    available_at: datetime
    from_stage: ItemCycleStage
    to_stage: ItemCycleStage
    reason: TransitionReason
    mode: TransitionMode
    input_snapshot_hash: str
    versions: VersionContext
    data_branch: DataBranch
    data_status: DataStatus

    def __post_init__(self) -> None:
        _require_aware(self.available_at, "available_at")
        if self.from_stage is self.to_stage:
            raise ValueError("a transition must change the economic stage")

    @property
    def transition_id(self) -> str:
        return content_id("transition", self)

    @property
    def scope_kind(self) -> ScopeKind:
        return ScopeKind.ITEM


@dataclass(frozen=True, slots=True)
class ShadowTransition:
    analysis_unit_id: str
    available_at: datetime
    theoretical_from_stage: ItemCycleStage
    theoretical_to_stage: ItemCycleStage
    reason: TransitionReason
    participating_evidence: tuple[str, ...]
    input_snapshot_hash: str
    versions: VersionContext
    data_branch: DataBranch
    data_status: DataStatus
    formal_transition_id: str | None = None

    def __post_init__(self) -> None:
        _require_aware(self.available_at, "available_at")
        if self.theoretical_from_stage is self.theoretical_to_stage:
            raise ValueError("a shadow transition must change stage")

    @property
    def shadow_transition_id(self) -> str:
        return content_id("shadow", self)

    @property
    def scope_kind(self) -> ScopeKind:
        return ScopeKind.ITEM


@dataclass(frozen=True, slots=True)
class CandidateEpisodeStarted:
    candidate_episode_id: str
    analysis_unit_id: str
    started_at: datetime
    reason_codes: tuple[str, ...]
    market_state_id: str | None
    sector_state_id: str | None
    domain_snapshot_ids: tuple[str, ...]
    input_snapshot_hash: str
    versions: VersionContext
    data_branch: DataBranch
    data_status: DataStatus

    def __post_init__(self) -> None:
        _require_aware(self.started_at, "started_at")
        if not self.reason_codes:
            raise ValueError("a candidate episode requires a reason")

    @property
    def scope_kind(self) -> ScopeKind:
        return ScopeKind.ITEM


@dataclass(frozen=True, slots=True)
class CycleCaseStarted:
    cycle_case_id: str
    analysis_unit_id: str
    started_at: datetime
    origin_candidate_episode_id: str | None
    previous_case_id: str | None
    input_snapshot_hash: str
    versions: VersionContext
    data_branch: DataBranch
    data_status: DataStatus

    def __post_init__(self) -> None:
        _require_aware(self.started_at, "started_at")

    @property
    def scope_kind(self) -> ScopeKind:
        return ScopeKind.ITEM


@dataclass(frozen=True, slots=True)
class AnalysisCaseStarted:
    analysis_case_id: str
    analysis_unit_id: str
    scope_kind: ScopeKind
    started_at: datetime
    initial_state_hash: str
    previous_case_id: str | None
    input_snapshot_hash: str
    versions: VersionContext
    data_branch: DataBranch
    data_status: DataStatus

    def __post_init__(self) -> None:
        _require_aware(self.started_at, "started_at")
        if self.scope_kind is ScopeKind.ITEM:
            raise ValueError("item cases use CycleCaseStarted")


_VALID_RESOLUTIONS = {
    (CaseStatus.RESOLVED, ResolutionCode.COMPLETED_UP_CYCLE),
    (CaseStatus.RESOLVED, ResolutionCode.RETURNED_TO_BASELINE),
    (CaseStatus.RESOLVED, ResolutionCode.TREND_REVERSED),
    (CaseStatus.RESOLVED, ResolutionCode.NO_CONFIRMATION),
    (CaseStatus.UNRESOLVED, ResolutionCode.DATA_LOSS),
    (CaseStatus.RETRACTED, ResolutionCode.INVALID_INPUT),
}


@dataclass(frozen=True, slots=True)
class LifecycleEvent:
    entity_kind: LifecycleEntityKind
    entity_id: str
    analysis_unit_id: str
    scope_kind: ScopeKind
    occurred_at: datetime
    action: LifecycleAction
    resulting_status: CaseStatus
    resolution_code: ResolutionCode | None
    reason: str
    input_snapshot_hash: str
    versions: VersionContext
    data_branch: DataBranch
    data_status: DataStatus

    def __post_init__(self) -> None:
        _require_aware(self.occurred_at, "occurred_at")
        _require_text(self.reason, "reason")
        if (
            self.entity_kind
            in {
                LifecycleEntityKind.CANDIDATE_EPISODE,
                LifecycleEntityKind.CYCLE_CASE,
            }
            and self.scope_kind is not ScopeKind.ITEM
        ):
            raise ValueError("candidate and cycle events must use ITEM scope")
        if (
            self.entity_kind is LifecycleEntityKind.ANALYSIS_CASE
            and self.scope_kind is ScopeKind.ITEM
        ):
            raise ValueError("item lifecycle uses candidate/cycle entities")
        if self.action is LifecycleAction.CLOSED:
            if (self.resulting_status, self.resolution_code) not in _VALID_RESOLUTIONS:
                raise ValueError("invalid case status/resolution combination")
        elif self.resolution_code is not None:
            raise ValueError("only a close event can carry a resolution code")
        if (
            self.action is LifecycleAction.SUSPENDED
            and self.resulting_status is not CaseStatus.SUSPENDED
        ):
            raise ValueError("suspension must result in SUSPENDED")
        if (
            self.action
            in {
                LifecycleAction.STARTED,
                LifecycleAction.RESUMED,
                LifecycleAction.REACCELERATED,
            }
            and self.resulting_status is not CaseStatus.ACTIVE
        ):
            raise ValueError("active lifecycle actions must result in ACTIVE")
        if self.action is LifecycleAction.CONVERTED:
            if self.entity_kind is not LifecycleEntityKind.CANDIDATE_EPISODE:
                raise ValueError("only candidate episodes can be converted")
            if self.resulting_status is not CaseStatus.RESOLVED:
                raise ValueError("conversion must resolve the candidate episode")

    @property
    def event_id(self) -> str:
        return content_id("case_event", self)


@dataclass(frozen=True, slots=True)
class ItemRuntimeState:
    analysis_unit_id: str
    cycle_stage: ItemCycleStage = ItemCycleStage.BASELINE
    recommendation: Recommendation = Recommendation.IGNORE
    active_candidate_episode_id: str | None = None
    active_cycle_case_id: str | None = None
    previous_cycle_case_id: str | None = None
    case_status: CaseStatus | None = None
    evidence_flags: frozenset[EvidenceFlag] = field(default_factory=frozenset)
    regime_relation: frozenset[RegimeRelation] = field(default_factory=frozenset)
    last_available_at: datetime | None = None
    last_snapshot_id: str | None = None
    failure_started_at: datetime | None = None
    failure_status: DataStatus | None = None
    failure_policy_version: str | None = None

    def __post_init__(self) -> None:
        _require_text(self.analysis_unit_id, "analysis_unit_id")
        if self.last_available_at is not None:
            _require_aware(self.last_available_at, "last_available_at")
        if self.failure_started_at is not None:
            _require_aware(self.failure_started_at, "failure_started_at")
        failure_parts = (
            self.failure_started_at,
            self.failure_status,
            self.failure_policy_version,
        )
        if any(part is None for part in failure_parts) and any(
            part is not None for part in failure_parts
        ):
            raise ValueError(
                "failure time, status, and policy version must be present together"
            )
        if self.failure_policy_version is not None:
            _require_text(self.failure_policy_version, "failure_policy_version")
        if (
            self.failure_status is not None
            and self.failure_status not in BLOCKING_DATA_STATUSES
        ):
            raise ValueError("runtime failure status must be a blocking raw status")
        if (
            self.failure_started_at is not None
            and self.last_available_at is not None
            and self.failure_started_at > self.last_available_at
        ):
            raise ValueError("failure cannot start after the latest observation")
        if self.active_candidate_episode_id and self.active_cycle_case_id:
            raise ValueError("candidate and cycle case cannot both be active")
        has_active_case = bool(
            self.active_candidate_episode_id or self.active_cycle_case_id
        )
        if has_active_case != (self.case_status is not None):
            raise ValueError(
                "active case identity and case_status must be present together"
            )


@dataclass(frozen=True, slots=True)
class ItemStepResult:
    runtime: ItemRuntimeState
    state_snapshot: ItemStateSnapshot
    recommendation_snapshot: RecommendationSnapshot
    transition: StateTransition | None
    shadow_transition: ShadowTransition | None
    candidate_starts: tuple[CandidateEpisodeStarted, ...] = field(default_factory=tuple)
    cycle_starts: tuple[CycleCaseStarted, ...] = field(default_factory=tuple)
    lifecycle_events: tuple[LifecycleEvent, ...] = field(default_factory=tuple)

    @property
    def record_hash(self) -> str:
        return stable_hash(self)

    def records_for_append(self) -> tuple[object, ...]:
        records: list[object] = [self.state_snapshot, self.recommendation_snapshot]
        if self.transition is not None:
            records.append(self.transition)
        if self.shadow_transition is not None:
            records.append(self.shadow_transition)
        records.extend(self.candidate_starts)
        records.extend(self.cycle_starts)
        records.extend(self.lifecycle_events)
        return tuple(records)
