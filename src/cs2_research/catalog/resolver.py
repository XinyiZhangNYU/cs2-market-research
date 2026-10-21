from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime
from decimal import Decimal

from .models import (
    AnalysisUnitResolution,
    ItemAnalysisUnitVersion,
    MappingResolution,
    ScopeKind,
    SourceMappingVersion,
)


class CatalogResolutionError(RuntimeError):
    """Fail-closed catalog resolution error with a stable code."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def resolve_source_mapping(
    mappings: Iterable[SourceMappingVersion],
    *,
    source_code: str,
    source_item_id: str,
    source_style_id: str | None,
    scope_kind: ScopeKind,
    valid_at: datetime,
    known_at: datetime,
    observed_market_hash_name: str | None = None,
    min_float: Decimal | None = None,
    max_float: Decimal | None = None,
) -> MappingResolution:
    key = (
        source_code,
        source_item_id,
        source_style_id,
        scope_kind,
        min_float,
        max_float,
    )
    keyed = [mapping for mapping in mappings if mapping.key == key]
    if not keyed:
        return MappingResolution("UNKNOWN", None, (), "MAPPING_UNKNOWN")
    known = [mapping for mapping in keyed if mapping.recorded_at <= known_at]
    if not known:
        return MappingResolution(
            "NOT_YET_KNOWN", None, (), "MAPPING_NOT_YET_KNOWN"
        )
    eligible = [
        mapping
        for mapping in known
        if mapping.valid_from <= valid_at
        and (mapping.valid_to is None or valid_at < mapping.valid_to)
    ]
    if not eligible:
        return MappingResolution(
            "OUT_OF_VALIDITY", None, (), "MAPPING_OUT_OF_VALIDITY"
        )
    latest_valid_from = max(mapping.valid_from for mapping in eligible)
    active = [mapping for mapping in eligible if mapping.valid_from == latest_valid_from]
    if len(active) > 1:
        candidates = tuple(
            sorted(
                {
                    item_id
                    for mapping in active
                    for item_id in (
                        ((mapping.item_id,) if mapping.item_id is not None else ())
                        + mapping.candidate_item_ids
                    )
                }
            )
        )
        return MappingResolution("CONFLICT", None, candidates, "MAPPING_INTERVAL_CONFLICT")

    mapping = active[0]
    if mapping.mapping_status != "RESOLVED":
        return MappingResolution(
            mapping.mapping_status,
            mapping,
            mapping.candidate_item_ids,
            mapping.reason_code or f"MAPPING_{mapping.mapping_status}",
        )
    if (
        observed_market_hash_name is not None
        and mapping.observed_market_hash_name is not None
        and observed_market_hash_name != mapping.observed_market_hash_name
    ):
        return MappingResolution(
            "NAME_MISMATCH", mapping, (), "MAPPING_NAME_MISMATCH"
        )
    return MappingResolution("RESOLVED", mapping, (), "MAPPING_RESOLVED")


def require_resolved(resolution: MappingResolution) -> SourceMappingVersion:
    if resolution.status != "RESOLVED" or resolution.mapping is None:
        raise CatalogResolutionError(
            resolution.reason_code,
            f"source mapping is not resolved: {resolution.status}",
        )
    return resolution.mapping


def resolve_analysis_unit(
    versions: Iterable[ItemAnalysisUnitVersion],
    *,
    item_id: int,
    valid_at: datetime,
    known_at: datetime,
) -> AnalysisUnitResolution:
    """Resolve one internal economic granularity without current-catalog leakage."""

    keyed = [version for version in versions if version.item_id == item_id]
    if not keyed:
        return AnalysisUnitResolution("UNKNOWN", None, "ANALYSIS_UNIT_UNKNOWN")
    known = [version for version in keyed if version.recorded_at <= known_at]
    if not known:
        return AnalysisUnitResolution(
            "NOT_YET_KNOWN", None, "ANALYSIS_UNIT_NOT_YET_KNOWN"
        )
    eligible = [
        version
        for version in known
        if version.valid_from <= valid_at
        and (version.valid_to is None or valid_at < version.valid_to)
    ]
    if not eligible:
        return AnalysisUnitResolution(
            "OUT_OF_VALIDITY", None, "ANALYSIS_UNIT_OUT_OF_VALIDITY"
        )
    latest_valid_from = max(version.valid_from for version in eligible)
    active = [
        version for version in eligible if version.valid_from == latest_valid_from
    ]
    if len(active) != 1:
        return AnalysisUnitResolution("CONFLICT", None, "ANALYSIS_UNIT_CONFLICT")
    return AnalysisUnitResolution("RESOLVED", active[0], "ANALYSIS_UNIT_RESOLVED")
