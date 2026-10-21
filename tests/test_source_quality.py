from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from cs2_research.planning.source_quality import (
    QualityFeatureRule,
    SourceQualityPolicy,
    assess_source_quality,
)
from cs2_research.state_machine.enums import (
    AnalysisUnitKind,
    Directness,
    EvidenceType,
    SemanticStatus,
)
from cs2_research.state_machine.fusion import SourceNumericFact


T0 = datetime(2026, 8, 21, 0, 0, tzinfo=timezone.utc)


def _fact(
    source: str,
    feature: str,
    value: str,
    at: datetime,
    *,
    fact_id: str | None = None,
) -> SourceNumericFact:
    return SourceNumericFact(
        source=source,
        source_fact_id=fact_id or f"{source}-{feature}-{value}-{at.isoformat()}",
        feature_key=feature,
        scope_key="item:1",
        analysis_unit_kind=AnalysisUnitKind.BASE_MHN,
        value=Decimal(value),
        unit="CNY_MINOR",
        evidence_type=EvidenceType.PRICE,
        directness=Directness.DIRECT,
        semantic_status=SemanticStatus.CONFIRMED,
        source_event_at=None,
        available_at=at,
    )


def _policy() -> SourceQualityPolicy:
    return SourceQualityPolicy(
        version="quality-v1",
        rules=(
            QualityFeatureRule(
                feature_key="best_ask",
                unit="CNY_MINOR",
                expected_sources=("market_a", "market_b_direct", "market_d"),
                max_age=timedelta(minutes=15),
                max_available_at_skew=timedelta(minutes=5),
                max_relative_dispersion=Decimal("0.10"),
                dispersion_floor=Decimal(1),
            ),
        ),
    )


def test_quality_axes_remain_separate() -> None:
    result = assess_source_quality(
        analysis_unit_id="item:1",
        as_of=T0,
        facts=(
            _fact("market_a", "best_ask", "100", T0 - timedelta(minutes=1)),
            _fact("market_b_direct", "best_ask", "130", T0 - timedelta(minutes=2)),
        ),
        policy=_policy(),
    )
    assert result.expected_cell_count == 3
    assert result.observed_cell_count == 2
    assert result.fresh_cell_count == 2
    assert result.coverage_ratio == Decimal(2) / Decimal(3)
    assert result.missing_cells[0].source_code == "market_d"
    assert [item.reason_code for item in result.conflicts] == ["VALUE_DISPERSION"]


def test_stale_and_future_facts_do_not_become_fresh_coverage() -> None:
    result = assess_source_quality(
        analysis_unit_id="item:1",
        as_of=T0,
        facts=(
            _fact("market_a", "best_ask", "100", T0 - timedelta(minutes=20)),
            _fact("market_b_direct", "best_ask", "100", T0 + timedelta(minutes=1)),
        ),
        policy=_policy(),
    )
    assert result.observed_cell_count == 1
    assert result.fresh_cell_count == 0
    assert result.future_fact_count == 1
    assert {cell.source_code for cell in result.missing_cells} == {"market_b_direct", "market_d"}
    assert {cell.source_code for cell in result.stale_cells} == {"market_a"}


def test_conflicting_latest_facts_from_one_source_are_visible() -> None:
    first = _fact("market_a", "best_ask", "100", T0, fact_id="a")
    second = replace(first, value=Decimal("101"), source_fact_id="b")
    result = assess_source_quality(
        analysis_unit_id="item:1",
        as_of=T0,
        facts=(first, second),
        policy=_policy(),
    )
    assert "DUPLICATE_LATEST_SOURCE_FACT" in {
        item.reason_code for item in result.conflicts
    }


def test_completely_missing_feature_is_missing_not_zero_participant_conflict() -> None:
    result = assess_source_quality(
        analysis_unit_id="item:1",
        as_of=T0,
        facts=(),
        policy=_policy(),
    )

    assert result.observed_cell_count == 0
    assert result.fresh_cell_count == 0
    assert {cell.source_code for cell in result.missing_cells} == {
        "market_a",
        "market_b_direct",
        "market_d",
    }
    assert result.conflicts == ()
