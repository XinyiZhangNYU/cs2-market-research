"""Frozen V0 MARKET/SECTOR daily assessment and output contracts.

This module deliberately keeps the economic axes separate.  Only the absolute
price-trend proposal is consumed by the lifecycle reducer; level, relative
strength, demand, supply, shock and data quality remain independently visible.
All records are commissioning shadow records and cannot claim formal status.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from enum import StrEnum
from typing import Mapping

from .enums import (
    DataBranch,
    DataStatus,
    EvidenceFlag,
    MarketLevelRegime,
    MarketTrendStage,
    Recommendation,
    RelativeStrength,
    ScopeKind,
    SectorTrendStage,
)
from .hashing import content_id
from .index_contract import IndexCurrencyUnit
from .models import SectorBreadth, VersionContext


MARKET_SECTOR_V0_USAGE_SCOPE = "INTERNAL_MARKET_SECTOR_DAILY_SHADOW"
MARKET_SECTOR_V0_VALIDATION_STATUS = "SHADOW_UNVALIDATED"
MARKET_SECTOR_V0_PRICE_SEMANTICS = "MINIMUM_QUALIFIED_ASK"
MARKET_SECTOR_V0_LISTING_SEMANTICS = "NON_DEDUP_VISIBLE_LISTING_SLOTS"
MARKET_SECTOR_V0_TRANSPORT = "upstream"
MARKET_SECTOR_V0_LOGICAL_SOURCES = ("market_a", "market_b", "market_c")


class AxisAvailability(StrEnum):
    AVAILABLE = "AVAILABLE"
    PARTIAL = "PARTIAL"
    UNKNOWN = "UNKNOWN"
    UNAVAILABLE_NOT_ONBOARDED = "UNAVAILABLE_NOT_ONBOARDED"


class PressureStrength(StrEnum):
    WEAK = "WEAK"
    MODERATE = "MODERATE"
    STRONG = "STRONG"
    UNKNOWN = "UNKNOWN"


class ShockState(StrEnum):
    NONE = "NONE"
    UP = "UP"
    DOWN = "DOWN"
    UNKNOWN = "UNKNOWN"


class DailyQualityStatus(StrEnum):
    QUALIFIED = "QUALIFIED"
    PARTIAL = "PARTIAL"
    UNAVAILABLE = "UNAVAILABLE"
    SUSPENDED = "SUSPENDED"


def _aware_utc(value: datetime, field: str) -> None:
    if not isinstance(value, datetime) or value.tzinfo is None:
        raise ValueError(f"{field} must be timezone-aware")
    if value.utcoffset() != timedelta(0):
        raise ValueError(f"{field} must use UTC")


def _text(value: str, field: str) -> None:
    if not isinstance(value, str) or not value:
        raise ValueError(f"{field} is required")


def _finite(value: Decimal | None, field: str) -> None:
    if value is not None and (
        not isinstance(value, Decimal) or not value.is_finite()
    ):
        raise ValueError(f"{field} must be a finite Decimal or null")


def _ratio(value: Decimal, field: str) -> None:
    _finite(value, field)
    if value < 0 or value > 1:
        raise ValueError(f"{field} must be in [0, 1]")


@dataclass(frozen=True, slots=True)
class PressureAxisAssessment:
    availability: AxisAvailability
    strength: PressureStrength
    metric_values: tuple[tuple[str, Decimal | int | None], ...]
    reason_codes: tuple[str, ...]

    def __post_init__(self) -> None:
        if not self.reason_codes:
            raise ValueError("pressure axis requires a reason code")
        keys = tuple(key for key, _ in self.metric_values)
        if len(keys) != len(set(keys)) or any(not key for key in keys):
            raise ValueError("pressure metric keys must be non-empty and unique")
        if any(not reason for reason in self.reason_codes):
            raise ValueError("pressure reason codes must be non-empty")
        if len(self.reason_codes) != len(set(self.reason_codes)):
            raise ValueError("pressure reason codes must be unique")
        for key, metric in self.metric_values:
            if isinstance(metric, Decimal):
                _finite(metric, f"pressure metric {key}")
            elif metric is not None and (
                isinstance(metric, bool) or not isinstance(metric, int)
            ):
                raise ValueError(
                    "pressure metrics must be finite Decimal, integer, or null"
                )
        if self.availability in {
            AxisAvailability.UNKNOWN,
            AxisAvailability.UNAVAILABLE_NOT_ONBOARDED,
        } and self.strength is not PressureStrength.UNKNOWN:
            raise ValueError("unavailable pressure cannot claim a strength")


@dataclass(frozen=True, slots=True)
class DailyDataQuality:
    status: DailyQualityStatus
    expected_member_count: int
    qualified_member_count: int
    missing_member_count: int
    invalid_member_count: int
    source_set_break_count: int
    coverage_ratio: Decimal
    reason_codes: tuple[str, ...]

    def __post_init__(self) -> None:
        values = (
            self.expected_member_count,
            self.qualified_member_count,
            self.missing_member_count,
            self.invalid_member_count,
            self.source_set_break_count,
        )
        if any(type(value) is not int or value < 0 for value in values):
            raise ValueError("quality counts must be non-negative integers")
        if self.expected_member_count <= 0:
            raise ValueError("quality denominator must be positive")
        if sum(values[1:]) != self.expected_member_count:
            raise ValueError("quality member states must exactly cover membership")
        _ratio(self.coverage_ratio, "coverage_ratio")
        expected_ratio = Decimal(self.qualified_member_count) / Decimal(
            self.expected_member_count
        )
        if self.coverage_ratio != expected_ratio:
            raise ValueError("coverage ratio differs from member counts")
        if not self.reason_codes or len(self.reason_codes) != len(
            set(self.reason_codes)
        ):
            raise ValueError("quality reason codes must be non-empty and unique")


@dataclass(frozen=True, slots=True)
class AnomalyContribution:
    analysis_unit_id: str
    raw_return: Decimal
    suppressed_return: Decimal
    raw_equal_weight_contribution: Decimal
    suppressed_equal_weight_contribution: Decimal
    reason_code: str

    def __post_init__(self) -> None:
        _text(self.analysis_unit_id, "analysis_unit_id")
        _text(self.reason_code, "reason_code")
        for value, field in (
            (self.raw_return, "raw_return"),
            (self.suppressed_return, "suppressed_return"),
            (self.raw_equal_weight_contribution, "raw_equal_weight_contribution"),
            (
                self.suppressed_equal_weight_contribution,
                "suppressed_equal_weight_contribution",
            ),
        ):
            _finite(value, field)


@dataclass(frozen=True, slots=True)
class MarketSectorAxisAssessment:
    analysis_unit_id: str
    scope_kind: ScopeKind
    scope_code: str
    available_at: datetime
    absolute_trend_proposal: MarketTrendStage | SectorTrendStage
    level_regime: MarketLevelRegime
    relative_strength: RelativeStrength
    demand_pressure: PressureAxisAssessment
    supply_pressure: PressureAxisAssessment
    shock: ShockState
    data_quality: DailyDataQuality
    raw_price_change: Decimal | None
    suppressed_price_change: Decimal | None
    suppression_difference: Decimal | None
    anomaly_contributions: tuple[AnomalyContribution, ...]
    breadth: SectorBreadth
    evidence_flags: frozenset[EvidenceFlag]
    data_status: DataStatus
    recommendation: Recommendation
    data_branch: DataBranch
    membership_id: str
    profile_id: str
    input_snapshot_hash: str
    versions: VersionContext
    contributing_source_sets: tuple[tuple[str, ...], ...]
    currency_unit: IndexCurrencyUnit = IndexCurrencyUnit.USD_MAJOR_SOURCE
    transport: str = MARKET_SECTOR_V0_TRANSPORT
    price_semantics: str = MARKET_SECTOR_V0_PRICE_SEMANTICS
    listing_semantics: str = MARKET_SECTOR_V0_LISTING_SEMANTICS
    usage_scope: str = MARKET_SECTOR_V0_USAGE_SCOPE
    validation_status: str = MARKET_SECTOR_V0_VALIDATION_STATUS
    formal_state_eligible: bool = False

    def __post_init__(self) -> None:
        _text(self.analysis_unit_id, "analysis_unit_id")
        _text(self.scope_code, "scope_code")
        _text(self.membership_id, "membership_id")
        _text(self.profile_id, "profile_id")
        _text(self.input_snapshot_hash, "input_snapshot_hash")
        _aware_utc(self.available_at, "available_at")
        if self.scope_kind is ScopeKind.MARKET:
            if not isinstance(self.absolute_trend_proposal, MarketTrendStage):
                raise ValueError("MARKET assessment requires MarketTrendStage")
            if self.relative_strength is not RelativeStrength.UNKNOWN:
                raise ValueError("MARKET relative strength must remain UNKNOWN")
        elif self.scope_kind is ScopeKind.SECTOR:
            if not isinstance(self.absolute_trend_proposal, SectorTrendStage):
                raise ValueError("SECTOR assessment requires SectorTrendStage")
        else:
            raise ValueError("V0 assessment supports MARKET or SECTOR")
        for value, field in (
            (self.raw_price_change, "raw_price_change"),
            (self.suppressed_price_change, "suppressed_price_change"),
            (self.suppression_difference, "suppression_difference"),
        ):
            _finite(value, field)
        if (self.raw_price_change is None) != (
            self.suppressed_price_change is None
        ):
            raise ValueError("raw and suppressed changes become available together")
        if self.raw_price_change is None:
            if self.suppression_difference is not None or self.anomaly_contributions:
                raise ValueError("unavailable price change cannot carry suppression output")
        elif self.suppression_difference != (
            self.suppressed_price_change - self.raw_price_change
        ):
            raise ValueError("suppression difference is not mechanically derived")
        normalized_sets = tuple(tuple(sorted(sources)) for sources in self.contributing_source_sets)
        if normalized_sets != self.contributing_source_sets:
            raise ValueError("contributing source sets must be sorted")
        allowed = set(MARKET_SECTOR_V0_LOGICAL_SOURCES)
        if any(
            len(sources) < 2
            or len(sources) != len(set(sources))
            or not set(sources) <= allowed
            for sources in self.contributing_source_sets
        ):
            raise ValueError("contributing source sets violate the min-two source contract")
        if self.currency_unit is not IndexCurrencyUnit.USD_MAJOR_SOURCE:
            raise ValueError("interim upstream V0 path must retain provider USD")
        if self.transport != MARKET_SECTOR_V0_TRANSPORT:
            raise ValueError("V0 transport drift")
        if self.price_semantics != MARKET_SECTOR_V0_PRICE_SEMANTICS:
            raise ValueError("V0 price semantics drift")
        if self.listing_semantics != MARKET_SECTOR_V0_LISTING_SEMANTICS:
            raise ValueError("V0 listing semantics drift")
        if self.usage_scope != MARKET_SECTOR_V0_USAGE_SCOPE:
            raise ValueError("V0 usage scope drift")
        if self.validation_status != MARKET_SECTOR_V0_VALIDATION_STATUS:
            raise ValueError("V0 validation status drift")
        if self.formal_state_eligible is not False:
            raise ValueError("V0 output cannot be formal")

    @property
    def assessment_id(self) -> str:
        return content_id("market_sector_assessment_v0", self)

    def output_axes(self, *, effective_absolute_trend: str, case_id: str | None) -> Mapping[str, object]:
        """Return the stable output surface after lifecycle reduction."""

        def decimal_text(value: Decimal | None) -> str | None:
            return None if value is None else format(value, "f")

        def pressure_document(value: PressureAxisAssessment) -> dict[str, object]:
            return {
                "availability": value.availability.value,
                "strength": value.strength.value,
                "metric_values": {
                    key: decimal_text(metric) if isinstance(metric, Decimal) else metric
                    for key, metric in value.metric_values
                },
                "reason_codes": list(value.reason_codes),
            }

        return {
            "schema": "market-sector-daily-output/0",
            "assessment_id": self.assessment_id,
            "analysis_unit_id": self.analysis_unit_id,
            "scope_kind": self.scope_kind.value,
            "scope_code": self.scope_code,
            "available_at": self.available_at.isoformat().replace("+00:00", "Z"),
            "absolute_trend": effective_absolute_trend,
            "historical_level": self.level_regime.value,
            "relative_strength": self.relative_strength.value,
            "demand_pressure": pressure_document(self.demand_pressure),
            "supply_pressure": pressure_document(self.supply_pressure),
            "shock": self.shock.value,
            "data_quality": {
                "status": self.data_quality.status.value,
                "expected_member_count": self.data_quality.expected_member_count,
                "qualified_member_count": self.data_quality.qualified_member_count,
                "missing_member_count": self.data_quality.missing_member_count,
                "invalid_member_count": self.data_quality.invalid_member_count,
                "source_set_break_count": self.data_quality.source_set_break_count,
                "coverage_ratio": format(self.data_quality.coverage_ratio, "f"),
                "reason_codes": list(self.data_quality.reason_codes),
            },
            "raw_price_change": decimal_text(self.raw_price_change),
            "suppressed_price_change": decimal_text(self.suppressed_price_change),
            "suppression_difference": decimal_text(self.suppression_difference),
            "anomaly_contributions": [
                {
                    "analysis_unit_id": item.analysis_unit_id,
                    "raw_return": format(item.raw_return, "f"),
                    "suppressed_return": format(item.suppressed_return, "f"),
                    "raw_equal_weight_contribution": format(
                        item.raw_equal_weight_contribution, "f"
                    ),
                    "suppressed_equal_weight_contribution": format(
                        item.suppressed_equal_weight_contribution, "f"
                    ),
                    "reason_code": item.reason_code,
                }
                for item in self.anomaly_contributions
            ],
            "breadth": {
                "advancing_member_ratio": decimal_text(
                    self.breadth.advancing_member_ratio
                ),
                "median_member_return": decimal_text(
                    self.breadth.median_member_return
                ),
                "breadth_expanding": self.breadth.breadth_expanding,
                "breadth_narrowing": self.breadth.breadth_narrowing,
                "concentration_warning": self.breadth.concentration_warning,
            },
            "case_id": case_id,
            "membership_id": self.membership_id,
            "profile_id": self.profile_id,
            "input_snapshot_hash": self.input_snapshot_hash,
            "contributing_source_sets": [
                list(sources) for sources in self.contributing_source_sets
            ],
            "currency_unit": self.currency_unit.value,
            "transport": self.transport,
            "price_semantics": self.price_semantics,
            "listing_semantics": self.listing_semantics,
            "usage_scope": self.usage_scope,
            "validation_status": self.validation_status,
            "formal_state_eligible": False,
        }


__all__ = [
    "AnomalyContribution",
    "AxisAvailability",
    "DailyDataQuality",
    "DailyQualityStatus",
    "MARKET_SECTOR_V0_LISTING_SEMANTICS",
    "MARKET_SECTOR_V0_LOGICAL_SOURCES",
    "MARKET_SECTOR_V0_PRICE_SEMANTICS",
    "MARKET_SECTOR_V0_TRANSPORT",
    "MARKET_SECTOR_V0_USAGE_SCOPE",
    "MARKET_SECTOR_V0_VALIDATION_STATUS",
    "MarketSectorAxisAssessment",
    "PressureAxisAssessment",
    "PressureStrength",
    "ShockState",
]
