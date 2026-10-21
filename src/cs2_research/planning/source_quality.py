"""PIT source coverage, missingness, conflict, and freshness metrics."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Iterable

from cs2_research.state_machine.enums import SemanticStatus
from cs2_research.state_machine.fusion import SourceNumericFact
from cs2_research.state_machine.hashing import content_id


class SourceQualityError(ValueError):
    pass


def _text(value: str, name: str) -> None:
    if not isinstance(value, str) or not value.strip() or "\x00" in value:
        raise SourceQualityError(f"{name} must be non-empty NUL-free text")


def _utc(value: datetime, name: str) -> None:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() != timezone.utc.utcoffset(value)
    ):
        raise SourceQualityError(f"{name} must use UTC")


@dataclass(frozen=True, slots=True)
class QualityFeatureRule:
    feature_key: str
    unit: str
    expected_sources: tuple[str, ...]
    max_age: timedelta
    max_available_at_skew: timedelta
    max_relative_dispersion: Decimal
    dispersion_floor: Decimal

    def __post_init__(self) -> None:
        _text(self.feature_key, "feature_key")
        _text(self.unit, "unit")
        if self.expected_sources != tuple(sorted(set(self.expected_sources))):
            raise SourceQualityError("expected_sources must be sorted and unique")
        if not self.expected_sources:
            raise SourceQualityError("expected_sources cannot be empty")
        if not isinstance(self.max_age, timedelta) or self.max_age <= timedelta(0):
            raise SourceQualityError("max_age must be positive")
        if (
            not isinstance(self.max_available_at_skew, timedelta)
            or self.max_available_at_skew < timedelta(0)
        ):
            raise SourceQualityError("max_available_at_skew cannot be negative")
        for value, name in (
            (self.max_relative_dispersion, "max_relative_dispersion"),
            (self.dispersion_floor, "dispersion_floor"),
        ):
            if not isinstance(value, Decimal) or not value.is_finite():
                raise SourceQualityError(f"{name} must be a finite Decimal")
        if self.max_relative_dispersion < 0:
            raise SourceQualityError("max_relative_dispersion cannot be negative")
        if self.dispersion_floor <= 0:
            raise SourceQualityError("dispersion_floor must be positive")


@dataclass(frozen=True, slots=True)
class SourceQualityPolicy:
    version: str
    rules: tuple[QualityFeatureRule, ...]

    def __post_init__(self) -> None:
        _text(self.version, "source quality policy version")
        if not self.rules:
            raise SourceQualityError("source quality policy requires rules")
        keys = tuple(rule.feature_key for rule in self.rules)
        if keys != tuple(sorted(set(keys))):
            raise SourceQualityError("quality rules must be sorted and unique")


@dataclass(frozen=True, slots=True)
class QualityCell:
    source_code: str
    feature_key: str


@dataclass(frozen=True, slots=True)
class QualityConflict:
    feature_key: str
    reason_code: str
    participating_sources: tuple[str, ...]
    source_fact_ids: tuple[str, ...]
    relative_dispersion: Decimal | None = None


@dataclass(frozen=True, slots=True)
class SourceBreakdown:
    source_code: str
    expected_feature_count: int
    observed_feature_count: int
    fresh_feature_count: int
    missing_feature_count: int
    stale_feature_count: int


@dataclass(frozen=True, slots=True)
class SourceQualitySnapshot:
    analysis_unit_id: str
    as_of: datetime
    policy_version: str
    expected_cell_count: int
    observed_cell_count: int
    fresh_cell_count: int
    coverage_ratio: Decimal
    fresh_coverage_ratio: Decimal
    missing_cells: tuple[QualityCell, ...]
    stale_cells: tuple[QualityCell, ...]
    conflicts: tuple[QualityConflict, ...]
    source_breakdown: tuple[SourceBreakdown, ...]
    future_fact_count: int

    @property
    def snapshot_id(self) -> str:
        return content_id("source_quality", self)


def _median(values: tuple[Decimal, ...]) -> Decimal:
    ordered = sorted(values)
    midpoint = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[midpoint]
    return (ordered[midpoint - 1] + ordered[midpoint]) / Decimal(2)


def _conflict(
    rule: QualityFeatureRule,
    facts: tuple[SourceNumericFact, ...],
) -> QualityConflict | None:
    # Missing/stale cells are accounted on their own axes.  An empty set has
    # no participants and therefore cannot constitute a semantic conflict.
    if not facts:
        return None
    sources = tuple(sorted(fact.source for fact in facts))
    fact_ids = tuple(sorted(fact.source_fact_id for fact in facts))
    if any(fact.unit != rule.unit for fact in facts):
        return QualityConflict(rule.feature_key, "UNIT_MISMATCH", sources, fact_ids)
    if len({fact.evidence_type for fact in facts}) != 1 or len(
        {fact.directness for fact in facts}
    ) != 1:
        return QualityConflict(
            rule.feature_key, "SEMANTIC_MISMATCH", sources, fact_ids
        )
    if any(fact.semantic_status is not SemanticStatus.CONFIRMED for fact in facts):
        return QualityConflict(
            rule.feature_key, "SEMANTIC_UNCONFIRMED", sources, fact_ids
        )
    if len(facts) <= 1:
        return None
    times = tuple(fact.available_at for fact in facts)
    if max(times) - min(times) > rule.max_available_at_skew:
        return QualityConflict(rule.feature_key, "TIME_SKEW", sources, fact_ids)
    values = tuple(fact.value for fact in facts)
    center = _median(values)
    dispersion = (max(values) - min(values)) / max(
        abs(center), rule.dispersion_floor
    )
    if dispersion > rule.max_relative_dispersion:
        return QualityConflict(
            rule.feature_key,
            "VALUE_DISPERSION",
            sources,
            fact_ids,
            dispersion,
        )
    return None


def assess_source_quality(
    *,
    analysis_unit_id: str,
    as_of: datetime,
    facts: Iterable[SourceNumericFact],
    policy: SourceQualityPolicy,
) -> SourceQualitySnapshot:
    """Measure quality without inventing a platform vote or economic signal."""

    _text(analysis_unit_id, "analysis_unit_id")
    _utc(as_of, "as_of")
    rows = tuple(facts)
    if any(fact.scope_key != analysis_unit_id for fact in rows):
        raise SourceQualityError("facts from different analysis units cannot mix")
    configured_keys = {rule.feature_key for rule in policy.rules}
    future_count = sum(
        fact.available_at > as_of and fact.feature_key in configured_keys
        for fact in rows
    )
    missing: list[QualityCell] = []
    stale: list[QualityCell] = []
    conflicts: list[QualityConflict] = []
    selected: dict[tuple[str, str], SourceNumericFact] = {}

    for rule in policy.rules:
        by_source: dict[str, list[SourceNumericFact]] = {
            source: [] for source in rule.expected_sources
        }
        unexpected_sources: set[str] = set()
        for fact in rows:
            if fact.feature_key != rule.feature_key or fact.available_at > as_of:
                continue
            if fact.source not in by_source:
                unexpected_sources.add(fact.source)
                continue
            by_source[fact.source].append(fact)
        if unexpected_sources:
            conflicts.append(
                QualityConflict(
                    rule.feature_key,
                    "UNEXPECTED_SOURCE",
                    tuple(sorted(unexpected_sources)),
                    tuple(
                        sorted(
                            fact.source_fact_id
                            for fact in rows
                            if fact.feature_key == rule.feature_key
                            and fact.source in unexpected_sources
                            and fact.available_at <= as_of
                        )
                    ),
                )
            )
        fresh_facts: list[SourceNumericFact] = []
        for source in rule.expected_sources:
            candidates = by_source[source]
            if not candidates:
                missing.append(QualityCell(source, rule.feature_key))
                continue
            latest_at = max(fact.available_at for fact in candidates)
            latest = tuple(fact for fact in candidates if fact.available_at == latest_at)
            signatures = {
                (
                    fact.value,
                    fact.unit,
                    fact.evidence_type,
                    fact.directness,
                    fact.semantic_status,
                )
                for fact in latest
            }
            if len(signatures) != 1:
                conflicts.append(
                    QualityConflict(
                        rule.feature_key,
                        "DUPLICATE_LATEST_SOURCE_FACT",
                        (source,),
                        tuple(sorted(fact.source_fact_id for fact in latest)),
                    )
                )
            chosen = min(latest, key=lambda fact: fact.source_fact_id)
            selected[(source, rule.feature_key)] = chosen
            if as_of - chosen.available_at > rule.max_age:
                stale.append(QualityCell(source, rule.feature_key))
            else:
                fresh_facts.append(chosen)
        cross_source = _conflict(rule, tuple(fresh_facts))
        if cross_source is not None:
            conflicts.append(cross_source)

    expected_cells = sum(len(rule.expected_sources) for rule in policy.rules)
    observed_cells = len(selected)
    stale_keys = {(cell.source_code, cell.feature_key) for cell in stale}
    fresh_cells = sum(key not in stale_keys for key in selected)
    all_sources = sorted(
        {source for rule in policy.rules for source in rule.expected_sources}
    )
    breakdown = tuple(
        SourceBreakdown(
            source_code=source,
            expected_feature_count=sum(
                source in rule.expected_sources for rule in policy.rules
            ),
            observed_feature_count=sum(key[0] == source for key in selected),
            fresh_feature_count=sum(
                key[0] == source and key not in stale_keys for key in selected
            ),
            missing_feature_count=sum(cell.source_code == source for cell in missing),
            stale_feature_count=sum(cell.source_code == source for cell in stale),
        )
        for source in all_sources
    )
    return SourceQualitySnapshot(
        analysis_unit_id=analysis_unit_id,
        as_of=as_of,
        policy_version=policy.version,
        expected_cell_count=expected_cells,
        observed_cell_count=observed_cells,
        fresh_cell_count=fresh_cells,
        coverage_ratio=Decimal(observed_cells) / Decimal(expected_cells),
        fresh_coverage_ratio=Decimal(fresh_cells) / Decimal(expected_cells),
        missing_cells=tuple(sorted(missing, key=lambda item: (item.source_code, item.feature_key))),
        stale_cells=tuple(sorted(stale, key=lambda item: (item.source_code, item.feature_key))),
        conflicts=tuple(
            sorted(
                conflicts,
                key=lambda item: (item.feature_key, item.reason_code, item.participating_sources),
            )
        ),
        source_breakdown=breakdown,
        future_fact_count=future_count,
    )


__all__ = [
    "QualityCell",
    "QualityConflict",
    "QualityFeatureRule",
    "SourceBreakdown",
    "SourceQualityError",
    "SourceQualityPolicy",
    "SourceQualitySnapshot",
    "assess_source_quality",
]
