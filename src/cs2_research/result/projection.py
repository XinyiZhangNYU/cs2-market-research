"""Explicit state-machine to result-wire projections."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from cs2_research.state_machine.enums import ClaimCode, ScopeKind
from cs2_research.state_machine.models import (
    ItemPolicyAssessment,
    ItemStateSnapshot,
    ItemStepResult,
    MarketStateSnapshot,
    SectorStateSnapshot,
)

from .models import ResultContractError, ResultIdentity, UnitResultEnvelope


def _utc(value: datetime) -> datetime:
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise ResultContractError("projection timestamps must be timezone-aware")
    return value.astimezone(timezone.utc)


def _decimal(value: Decimal | None) -> str | None:
    if value is None:
        return None
    if not isinstance(value, Decimal) or not value.is_finite():
        raise ResultContractError("result decimals must be finite Decimal values")
    return format(value, "f")


def _validate_identity(
    identity: ResultIdentity,
    *,
    analysis_unit_id: str,
    scope_kind: ScopeKind,
    catalog_version: str,
) -> None:
    if identity.analysis_unit_id != analysis_unit_id:
        raise ResultContractError("identity and state analysis units differ")
    if identity.scope_kind is not scope_kind:
        raise ResultContractError("identity and state scopes differ")
    if identity.catalog_version != catalog_version:
        raise ResultContractError("identity and state catalog versions differ")


def project_market_result(
    snapshot: MarketStateSnapshot,
    *,
    identity: ResultIdentity,
    as_of: datetime,
) -> UnitResultEnvelope:
    if not isinstance(snapshot, MarketStateSnapshot):
        raise TypeError("snapshot must be MarketStateSnapshot")
    _validate_identity(
        identity,
        analysis_unit_id=snapshot.analysis_unit_id,
        scope_kind=ScopeKind.MARKET,
        catalog_version=snapshot.versions.catalog_version,
    )
    state = {
        "trend_stage": snapshot.trend_stage.value,
        "level_regime": snapshot.level_regime.value,
        "evidence_flags": sorted(flag.value for flag in snapshot.evidence_flags),
        "recommendation": snapshot.recommendation.value,
        "case_status": snapshot.case_status.value if snapshot.case_status else None,
        "analysis_case_id": snapshot.analysis_case_id,
        "input_snapshot_hash": snapshot.input_snapshot_hash,
    }
    return UnitResultEnvelope(
        identity=identity,
        as_of=_utc(as_of),
        available_at=_utc(snapshot.available_at),
        data_branch=snapshot.data_branch,
        data_status=snapshot.data_status,
        versions=snapshot.versions,
        state=state,
        recommendation_detail=None,
        evidence_domains=(),
        claims=(),
    )


def project_sector_result(
    snapshot: SectorStateSnapshot,
    *,
    identity: ResultIdentity,
    as_of: datetime,
) -> UnitResultEnvelope:
    if not isinstance(snapshot, SectorStateSnapshot):
        raise TypeError("snapshot must be SectorStateSnapshot")
    _validate_identity(
        identity,
        analysis_unit_id=snapshot.analysis_unit_id,
        scope_kind=ScopeKind.SECTOR,
        catalog_version=snapshot.versions.catalog_version,
    )
    state = {
        "trend_stage": snapshot.trend_stage.value,
        "relative_strength": snapshot.relative_strength.value,
        "breadth": {
            "advancing_member_ratio": _decimal(
                snapshot.breadth.advancing_member_ratio
            ),
            "median_member_return": _decimal(snapshot.breadth.median_member_return),
            "breadth_expanding": snapshot.breadth.breadth_expanding,
            "breadth_narrowing": snapshot.breadth.breadth_narrowing,
            "concentration_warning": snapshot.breadth.concentration_warning,
        },
        "evidence_flags": sorted(flag.value for flag in snapshot.evidence_flags),
        "recommendation": snapshot.recommendation.value,
        "case_status": snapshot.case_status.value if snapshot.case_status else None,
        "analysis_case_id": snapshot.analysis_case_id,
        "input_snapshot_hash": snapshot.input_snapshot_hash,
    }
    return UnitResultEnvelope(
        identity=identity,
        as_of=_utc(as_of),
        available_at=_utc(snapshot.available_at),
        data_branch=snapshot.data_branch,
        data_status=snapshot.data_status,
        versions=snapshot.versions,
        state=state,
        recommendation_detail=None,
        evidence_domains=(),
        claims=(),
    )


def project_item_result(
    step: ItemStepResult,
    assessment: ItemPolicyAssessment,
    *,
    identity: ResultIdentity,
    as_of: datetime,
    claims: tuple[ClaimCode, ...] = (),
) -> UnitResultEnvelope:
    if not isinstance(step, ItemStepResult):
        raise TypeError("step must be ItemStepResult")
    if not isinstance(assessment, ItemPolicyAssessment):
        raise TypeError("assessment must be ItemPolicyAssessment")
    state_snapshot: ItemStateSnapshot = step.state_snapshot
    recommendation = step.recommendation_snapshot
    _validate_identity(
        identity,
        analysis_unit_id=state_snapshot.analysis_unit_id,
        scope_kind=ScopeKind.ITEM,
        catalog_version=state_snapshot.versions.catalog_version,
    )
    if assessment.analysis_unit_id != state_snapshot.analysis_unit_id:
        raise ResultContractError("assessment and state analysis units differ")
    if identity.analysis_unit_kind is not assessment.unified_snapshot.analysis_unit_kind:
        raise ResultContractError("identity and assessment analysis-unit kinds differ")
    if assessment.available_at != state_snapshot.available_at:
        raise ResultContractError("assessment and state availability times differ")
    if recommendation.available_at != state_snapshot.available_at:
        raise ResultContractError("recommendation and state availability times differ")
    if assessment.input_snapshot_hash != state_snapshot.input_snapshot_hash:
        raise ResultContractError("assessment and state input hashes differ")
    if recommendation.input_snapshot_hash != state_snapshot.input_snapshot_hash:
        raise ResultContractError("recommendation and state input hashes differ")
    if (
        assessment.versions != state_snapshot.versions
        or recommendation.versions != state_snapshot.versions
    ):
        raise ResultContractError("item projection mixes version contexts")
    if (
        assessment.data_branch is not state_snapshot.data_branch
        or recommendation.data_branch is not state_snapshot.data_branch
    ):
        raise ResultContractError("item projection mixes data branches")
    if recommendation.data_status is not state_snapshot.data_status:
        raise ResultContractError("recommendation and state data statuses differ")
    state = {
        "cycle_stage": state_snapshot.cycle_stage.value,
        "evidence_flags": sorted(flag.value for flag in state_snapshot.evidence_flags),
        "regime_relation": sorted(
            relation.value for relation in state_snapshot.regime_relation
        ),
        "recommendation": state_snapshot.recommendation.value,
        "case_status": (
            state_snapshot.case_status.value if state_snapshot.case_status else None
        ),
        "candidate_episode_id": state_snapshot.candidate_episode_id,
        "cycle_case_id": state_snapshot.cycle_case_id,
        "input_snapshot_hash": state_snapshot.input_snapshot_hash,
    }
    recommendation_document = {
        "recommendation": recommendation.recommendation.value,
        "signal_strength": recommendation.signal_strength.value,
        "evidence_coverage": _decimal(recommendation.evidence_coverage),
        "trade_confirmation": recommendation.trade_confirmation.value,
        "input_snapshot_hash": recommendation.input_snapshot_hash,
    }
    domain_documents = tuple(
        {
            "domain": domain.domain.value,
            "strength": domain.strength.value,
            "contributing_feature_keys": list(domain.contributing_feature_keys),
            "missing_reason": (
                domain.missing_reason.value if domain.missing_reason else None
            ),
            "policy_version": domain.policy_version,
            "input_snapshot_hash": domain.input_snapshot_hash,
        }
        for domain in assessment.domains
    )
    return UnitResultEnvelope(
        identity=identity,
        as_of=_utc(as_of),
        available_at=_utc(state_snapshot.available_at),
        data_branch=state_snapshot.data_branch,
        data_status=state_snapshot.data_status,
        versions=state_snapshot.versions,
        state=state,
        recommendation_detail=recommendation_document,
        evidence_domains=domain_documents,
        claims=claims,
    )


__all__ = [
    "project_item_result",
    "project_market_result",
    "project_sector_result",
]
