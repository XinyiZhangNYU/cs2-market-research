"""Explicit field-level fusion for source facts.

This is intentionally not a platform-signal voter.  Facts must first agree on
field semantics, units, evidence kind, and timing.  A caller must also provide
a versioned numeric fusion policy; there is no implicit averaging fallback.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from enum import StrEnum

from .enums import (
    AnalysisUnitKind,
    DataBranch,
    Directness,
    EvidenceType,
    FeatureValueStatus,
    FreshnessStatus,
    ScopeKind,
    SemanticStatus,
)
from .hashing import content_id, stable_hash
from .models import (
    FeatureExpectationProfile,
    UnifiedFeatureSnapshot,
    UnifiedFeatureValue,
    VersionContext,
)


class FusionContractError(ValueError):
    pass


class NumericFusionMethod(StrEnum):
    SINGLE_SOURCE_PROXY = "SINGLE_SOURCE_PROXY"
    MEDIAN = "MEDIAN"
    EXPLICIT_WEIGHTED_MEAN = "EXPLICIT_WEIGHTED_MEAN"


@dataclass(frozen=True, slots=True)
class SourceNumericFact:
    source: str
    source_fact_id: str
    feature_key: str
    scope_key: str
    analysis_unit_kind: AnalysisUnitKind
    value: Decimal
    unit: str
    evidence_type: EvidenceType
    directness: Directness
    semantic_status: SemanticStatus
    source_event_at: datetime | None
    available_at: datetime

    def __post_init__(self) -> None:
        if (
            not self.source
            or not self.source_fact_id
            or not self.feature_key
            or not self.scope_key
        ):
            raise ValueError(
                "source, source_fact_id, feature_key, and scope_key are required"
            )
        if not self.unit:
            raise ValueError("fact unit is required")
        if self.available_at.tzinfo is None or self.available_at.utcoffset() is None:
            raise ValueError("available_at must be timezone-aware")
        if self.source_event_at is not None and (
            self.source_event_at.tzinfo is None
            or self.source_event_at.utcoffset() is None
        ):
            raise ValueError("source_event_at must be timezone-aware")
        if (
            self.source_event_at is not None
            and self.source_event_at > self.available_at
        ):
            raise ValueError("source_event_at cannot be later than available_at")
        if (
            self.directness is Directness.INFERRED
            and self.evidence_type is EvidenceType.TRADE
        ):
            raise ValueError("inferred values cannot be represented as trade facts")


@dataclass(frozen=True, slots=True)
class NumericFusionPolicy:
    version: str
    method: NumericFusionMethod
    expected_sources: frozenset[str]
    max_relative_dispersion: Decimal
    dispersion_floor: Decimal
    max_available_at_skew: timedelta
    source_weights: tuple[tuple[str, Decimal], ...] = ()

    def __post_init__(self) -> None:
        if not self.version:
            raise ValueError("fusion policy version is required")
        if not self.expected_sources:
            raise ValueError("expected_sources cannot be empty")
        if self.max_relative_dispersion < 0:
            raise ValueError("max_relative_dispersion cannot be negative")
        if self.dispersion_floor <= 0:
            raise ValueError("dispersion_floor must be positive")
        if self.max_available_at_skew < timedelta(0):
            raise ValueError("max_available_at_skew cannot be negative")
        weights = dict(self.source_weights)
        if len(weights) != len(self.source_weights):
            raise ValueError("source weights must be unique")
        if any(weight <= 0 for weight in weights.values()):
            raise ValueError("source weights must be positive")
        if self.method is NumericFusionMethod.EXPLICIT_WEIGHTED_MEAN:
            if set(weights) != set(self.expected_sources):
                raise ValueError("weighted fusion needs one weight per expected source")
        elif self.source_weights:
            raise ValueError("weights are only valid for explicit weighted fusion")
        object.__setattr__(
            self,
            "source_weights",
            tuple(sorted(self.source_weights, key=lambda pair: pair[0])),
        )


def _median(values: tuple[Decimal, ...]) -> Decimal:
    ordered = sorted(values)
    midpoint = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[midpoint]
    return (ordered[midpoint - 1] + ordered[midpoint]) / Decimal(2)


def _relative_dispersion(values: tuple[Decimal, ...], floor: Decimal) -> Decimal:
    if len(values) <= 1:
        return Decimal(0)
    center = _median(values)
    denominator = max(abs(center), floor)
    return (max(values) - min(values)) / denominator


def fuse_numeric_feature(
    facts: tuple[SourceNumericFact, ...],
    policy: NumericFusionPolicy,
) -> UnifiedFeatureValue:
    """Fuse compatible numeric facts or return an explicit conflicted value."""

    if not facts:
        raise FusionContractError("at least one source fact is required")
    sources = tuple(sorted(fact.source for fact in facts))
    if len(sources) != len(set(sources)):
        raise FusionContractError("only one fact per source may enter a fusion window")
    if not set(sources).issubset(policy.expected_sources):
        raise FusionContractError("a fact came from a source outside the policy scope")

    keys = {fact.feature_key for fact in facts}
    scopes = {fact.scope_key for fact in facts}
    units = {fact.unit for fact in facts}
    evidence_types = {fact.evidence_type for fact in facts}
    directnesses = {fact.directness for fact in facts}
    if len(keys) != 1:
        raise FusionContractError("different feature semantics cannot be fused")
    if len(scopes) != 1:
        raise FusionContractError("different fact granularities cannot be fused")
    if len(units) != 1:
        raise FusionContractError("different units cannot be fused")
    if len(evidence_types) != 1:
        raise FusionContractError("different evidence types cannot be fused")
    if len(directnesses) != 1:
        raise FusionContractError(
            "facts with different directness cannot be fused; "
            "inferred evidence must remain identifiable"
        )
    directness = next(iter(directnesses))
    unit_kinds = {fact.analysis_unit_kind for fact in facts}
    if len(unit_kinds) != 1:
        raise FusionContractError("different analysis-unit kinds cannot be fused")
    scope_key = next(iter(scopes))
    analysis_unit_kind = next(iter(unit_kinds))
    available_times = tuple(fact.available_at for fact in facts)
    if max(available_times) - min(available_times) > policy.max_available_at_skew:
        raise FusionContractError("source facts exceed the allowed time skew")

    input_ids = tuple(sorted(fact.source_fact_id for fact in facts))
    coverage = Decimal(len(sources)) / Decimal(len(policy.expected_sources))
    if any(fact.semantic_status is not SemanticStatus.CONFIRMED for fact in facts):
        return UnifiedFeatureValue(
            feature_key=next(iter(keys)),
            scope_key=scope_key,
            analysis_unit_kind=analysis_unit_kind,
            value=None,
            unit=next(iter(units)),
            status=FeatureValueStatus.CONFLICTED,
            semantic_status=SemanticStatus.INCOMPATIBLE,
            participating_sources=sources,
            source_coverage=coverage,
            source_dispersion=None,
            evidence_type=next(iter(evidence_types)),
            directness=directness,
            missing_cause=None,
            input_fact_ids=input_ids,
        )

    values = tuple(fact.value for fact in facts)
    dispersion = _relative_dispersion(values, policy.dispersion_floor)
    if dispersion > policy.max_relative_dispersion:
        return UnifiedFeatureValue(
            feature_key=next(iter(keys)),
            scope_key=scope_key,
            analysis_unit_kind=analysis_unit_kind,
            value=None,
            unit=next(iter(units)),
            status=FeatureValueStatus.CONFLICTED,
            semantic_status=SemanticStatus.CONFIRMED,
            participating_sources=sources,
            source_coverage=coverage,
            source_dispersion=dispersion,
            evidence_type=next(iter(evidence_types)),
            directness=directness,
            missing_cause=None,
            input_fact_ids=input_ids,
        )

    if len(facts) == 1:
        if policy.method is not NumericFusionMethod.SINGLE_SOURCE_PROXY:
            raise FusionContractError(
                "a single fact requires an explicit SINGLE_SOURCE_PROXY policy"
            )
        fused = values[0]
    elif policy.method is NumericFusionMethod.MEDIAN:
        fused = _median(values)
    elif policy.method is NumericFusionMethod.EXPLICIT_WEIGHTED_MEAN:
        weights = dict(policy.source_weights)
        numerator = sum(
            (fact.value * weights[fact.source] for fact in facts), Decimal(0)
        )
        denominator = sum((weights[fact.source] for fact in facts), Decimal(0))
        fused = numerator / denominator
    else:
        raise FusionContractError(
            "multi-source facts require an explicit multi-source fusion method"
        )

    return UnifiedFeatureValue(
        feature_key=next(iter(keys)),
        scope_key=scope_key,
        analysis_unit_kind=analysis_unit_kind,
        value=fused,
        unit=next(iter(units)),
        status=FeatureValueStatus.AVAILABLE,
        semantic_status=SemanticStatus.CONFIRMED,
        participating_sources=sources,
        source_coverage=coverage,
        source_dispersion=dispersion,
        evidence_type=next(iter(evidence_types)),
        directness=directness,
        missing_cause=None,
        input_fact_ids=input_ids,
    )


def build_unified_snapshot(
    *,
    analysis_unit_id: str,
    scope_kind: ScopeKind,
    analysis_unit_kind: AnalysisUnitKind,
    available_at: datetime,
    fused_features: tuple[UnifiedFeatureValue, ...],
    policies: tuple[NumericFusionPolicy, ...],
    versions: VersionContext,
    data_branch: DataBranch,
    feature_profile: FeatureExpectationProfile,
    freshness_status: FreshnessStatus,
) -> UnifiedFeatureSnapshot:
    """Build a snapshot against an immutable, branch-specific feature contract."""

    if not fused_features:
        raise FusionContractError("a unified snapshot requires at least one feature")
    fused_features = tuple(
        sorted(fused_features, key=lambda feature: feature.feature_key)
    )
    policies = tuple(sorted(policies, key=stable_hash))
    if feature_profile.version != versions.feature_profile_version:
        raise FusionContractError("feature profile version does not match context")
    if feature_profile.data_branch is not data_branch:
        raise FusionContractError("feature profile data branch mismatch")
    if feature_profile.scope_kind is not scope_kind:
        raise FusionContractError("feature profile scope mismatch")
    if feature_profile.analysis_unit_kind is not analysis_unit_kind:
        raise FusionContractError("feature profile analysis-unit kind mismatch")
    if any(feature.scope_key != analysis_unit_id for feature in fused_features):
        raise FusionContractError(
            "fused features do not all bind to the requested analysis unit"
        )
    if any(
        feature.analysis_unit_kind is not analysis_unit_kind
        for feature in fused_features
    ):
        raise FusionContractError(
            "fused features do not all use the requested analysis-unit kind"
        )
    try:
        feature_profile.classify(fused_features)
    except ValueError as error:
        raise FusionContractError(str(error)) from error
    participating_sources = tuple(
        sorted(
            {
                source
                for feature in fused_features
                for source in feature.participating_sources
            }
        )
    )
    input_fact_ids = tuple(
        sorted(
            {
                fact_id
                for feature in fused_features
                for fact_id in feature.input_fact_ids
            }
        )
    )
    coverage = sum(
        (feature.source_coverage for feature in fused_features), Decimal(0)
    ) / Decimal(len(fused_features))
    dispersions = tuple(
        feature.source_dispersion
        for feature in fused_features
        if feature.source_dispersion is not None
    )
    source_dispersion = max(dispersions) if dispersions else None
    feature_semantics = {feature.semantic_status for feature in fused_features}
    if SemanticStatus.INCOMPATIBLE in feature_semantics:
        semantic_compatibility = SemanticStatus.INCOMPATIBLE
    elif SemanticStatus.UNKNOWN in feature_semantics:
        semantic_compatibility = SemanticStatus.UNKNOWN
    elif SemanticStatus.PROVISIONAL in feature_semantics:
        semantic_compatibility = SemanticStatus.PROVISIONAL
    else:
        semantic_compatibility = SemanticStatus.CONFIRMED
    input_hash = stable_hash(
        {
            "features": fused_features,
            "policies": policies,
            "feature_profile": feature_profile,
            "freshness_status": freshness_status,
            "available_at": available_at,
        }
    )
    return UnifiedFeatureSnapshot(
        analysis_unit_id=analysis_unit_id,
        scope_kind=scope_kind,
        analysis_unit_kind=analysis_unit_kind,
        available_at=available_at,
        features=fused_features,
        participating_sources=participating_sources,
        source_coverage=coverage,
        source_dispersion=source_dispersion,
        semantic_compatibility=semantic_compatibility,
        input_fact_ids=input_fact_ids,
        input_snapshot_hash=input_hash,
        versions=versions,
        feature_profile=feature_profile,
        data_branch=data_branch,
        freshness_status=freshness_status,
    )


def source_fact_id(fact: SourceNumericFact) -> str:
    return content_id("fact", fact)
