from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal
import json
from pathlib import Path

import jsonschema
import pytest

from cs2_research.feature_input.market_sector_daily_v3 import (
    MarketSectorDailyV3Error,
    V3ReducedSourceAskFact,
    build_v3_daily_price_frame,
    build_v3_daily_scope_measurement,
)
from cs2_research.feature_input.market_sector_taxonomy_v3 import (
    TaxonomyMemberV3,
    TaxonomyMembershipV3,
)


ROOT = Path(__file__).resolve().parents[1]


def _membership() -> TaxonomyMembershipV3:
    members = tuple(
        sorted(
            (
                TaxonomyMemberV3("item:1", "One", "WEAPON", ("WEAPON", "WEAPON:RIFLE"), "1" * 64, "EXACT_INTERNAL_CATALOG_PROJECTION", ("market_a", "market_b", "market_c")),
                TaxonomyMemberV3("mhn-sha256:" + "2" * 64, "Agent", "AGENT", ("AGENT",), "2" * 64, "EXACT_MARKET_HASH_NAME_SHA256_PROVISIONAL", ("market_a", "market_b", "market_c")),
                TaxonomyMemberV3("mhn-sha256:" + "3" * 64, "Case", "CASE", ("CASE", "CASE:123"), "3" * 64, "EXACT_MARKET_HASH_NAME_SHA256_PROVISIONAL", ("market_a", "market_b", "market_c")),
            ),
            key=lambda row: row.analysis_unit_id,
        )
    )
    return TaxonomyMembershipV3(
        "market_sector_taxonomy_v3_" + "4" * 64,
        datetime(2026, 1, 1, tzinfo=UTC),
        members,
        {},
    )


def _fact(unit: str, day: date, source: str, ask: int | None, marker: str) -> V3ReducedSourceAskFact:
    return V3ReducedSourceAskFact(
        analysis_unit_id=unit,
        bucket_date=day,
        logical_source=source,
        ask_atoms=ask,
        available_at=datetime(day.year, day.month, day.day + 1, 0, 5, tzinfo=UTC),
        source_fact_sha256=marker * 64,
    )


def test_v3_measurement_supports_provisional_case_and_agent_identities() -> None:
    membership = _membership()
    units = {member.market_hash_name: member.analysis_unit_id for member in membership.members}
    day1 = date(2026, 1, 2)
    day2 = date(2026, 1, 3)
    previous_facts = [
        _fact(units[name], day1, source, ask, marker)
        for name, ask, source, marker in (
            ("One", 100, "market_a", "a"), ("One", 100, "market_c", "b"),
            ("Case", 200, "market_a", "c"), ("Case", 200, "market_c", "d"),
            ("Agent", 300, "market_a", "e"), ("Agent", 300, "market_c", "f"),
        )
    ]
    current_facts = [
        _fact(units[name], day2, source, ask, marker)
        for name, ask, source, marker in (
            ("One", 110, "market_a", "1"), ("One", 110, "market_c", "2"),
            ("Case", 240, "market_a", "3"), ("Case", 240, "market_c", "4"),
            ("Agent", 330, "market_a", "5"), ("Agent", 330, "market_b", "6"),
        )
    ]
    previous = build_v3_daily_price_frame(
        membership=membership,
        bucket_date=day1,
        available_at=datetime(2026, 1, 3, 0, 10, tzinfo=UTC),
        facts=previous_facts,
        input_snapshot_sha256="7" * 64,
    )
    current = build_v3_daily_price_frame(
        membership=membership,
        bucket_date=day2,
        available_at=datetime(2026, 1, 4, 0, 10, tzinfo=UTC),
        facts=current_facts,
        input_snapshot_sha256="8" * 64,
    )
    result = build_v3_daily_scope_measurement(
        membership=membership, previous=previous, current=current
    )
    scopes = {row["scope_code"]: row for row in result["scopes"]}
    assert scopes["ALL"]["member_count"] == 3
    assert scopes["ALL"]["valid_return_count"] == 2
    assert scopes["ALL"]["source_set_break_count"] == 1
    assert scopes["ALL"]["raw_equal_member_return"] == "0.15"
    assert scopes["CASE"]["raw_equal_member_return"] == "0.2"
    assert scopes["CASE:123"]["scope_role"] == "RAW_ONLY_VISIBLE_NO_STATE"
    assert scopes["AGENT"]["valid_return_count"] == 0
    assert scopes["AGENT"]["raw_equal_member_return"] is None
    schema = json.loads(
        (ROOT / "schemas" / "market-sector-daily-measurement.v3.schema.json").read_bytes()
    )
    jsonschema.Draft202012Validator.check_schema(schema)
    jsonschema.Draft202012Validator(
        schema, format_checker=jsonschema.FormatChecker()
    ).validate(result)


def test_v3_measurement_rejects_unknown_member_and_duplicate_source() -> None:
    membership = _membership()
    day = date(2026, 1, 2)
    unknown = _fact("unknown", day, "market_a", 100, "a")
    with pytest.raises(MarketSectorDailyV3Error, match="FACT_OUTSIDE_MEMBERSHIP"):
        build_v3_daily_price_frame(
            membership=membership,
            bucket_date=day,
            available_at=datetime(2026, 1, 3, 0, 10, tzinfo=UTC),
            facts=[unknown],
            input_snapshot_sha256="7" * 64,
        )
    unit = membership.members[0].analysis_unit_id
    fact = _fact(unit, day, "market_a", 100, "b")
    with pytest.raises(MarketSectorDailyV3Error, match="DUPLICATE_LOGICAL_SOURCE_FACT"):
        build_v3_daily_price_frame(
            membership=membership,
            bucket_date=day,
            available_at=datetime(2026, 1, 3, 0, 10, tzinfo=UTC),
            facts=[fact, fact],
            input_snapshot_sha256="7" * 64,
        )


def test_v3_measurement_rejects_incomplete_day() -> None:
    membership = _membership()
    with pytest.raises(MarketSectorDailyV3Error, match="UTC_DAY_NOT_COMPLETE"):
        build_v3_daily_price_frame(
            membership=membership,
            bucket_date=date(2026, 1, 2),
            available_at=datetime(2026, 1, 2, 23, 59, tzinfo=UTC),
            facts=[],
            input_snapshot_sha256="7" * 64,
        )


def _large_membership(count: int) -> TaxonomyMembershipV3:
    return TaxonomyMembershipV3(
        "market_sector_taxonomy_v3_" + "9" * 64,
        datetime(2026, 1, 1, tzinfo=UTC),
        tuple(
            TaxonomyMemberV3(
                f"item:{index:03d}",
                f"Item {index}",
                "WEAPON",
                ("WEAPON",),
                format(index, "064x"),
                "EXACT_INTERNAL_CATALOG_PROJECTION",
                ("market_a", "market_b", "market_c"),
            )
            for index in range(1, count + 1)
        ),
        {},
    )


def _frames_from_returns(
    membership: TaxonomyMembershipV3,
    returns: dict[str, str | None],
):
    day1 = date(2026, 1, 2)
    day2 = date(2026, 1, 3)
    previous_facts: list[V3ReducedSourceAskFact] = []
    current_facts: list[V3ReducedSourceAskFact] = []
    for index, member in enumerate(membership.members, start=1):
        for source, old_marker, new_marker in (
            ("market_a", "a", "c"),
            ("market_c", "b", "d"),
        ):
            previous_facts.append(
                _fact(member.analysis_unit_id, day1, source, 100_000, old_marker)
            )
            value = returns[member.analysis_unit_id]
            if value is not None:
                current_facts.append(
                    _fact(
                        member.analysis_unit_id,
                        day2,
                        source,
                        int(Decimal("100000") * (Decimal(1) + Decimal(value))),
                        new_marker,
                    )
                )
    return (
        build_v3_daily_price_frame(
            membership=membership,
            bucket_date=day1,
            available_at=datetime(2026, 1, 3, 0, 10, tzinfo=UTC),
            facts=previous_facts,
            input_snapshot_sha256="7" * 64,
        ),
        build_v3_daily_price_frame(
            membership=membership,
            bucket_date=day2,
            available_at=datetime(2026, 1, 4, 0, 10, tzinfo=UTC),
            facts=current_facts,
            input_snapshot_sha256="8" * 64,
        ),
    )


def test_missing_members_cannot_reverse_fixed_cohort_direction() -> None:
    membership = _large_membership(100)
    complete_returns = {
        member.analysis_unit_id: ("0.03" if index <= 80 else "-0.47")
        for index, member in enumerate(membership.members, start=1)
    }
    previous, complete = _frames_from_returns(membership, complete_returns)
    complete_scope = build_v3_daily_scope_measurement(
        membership=membership, previous=previous, current=complete
    )["scopes"][0]
    assert complete_scope["raw_equal_member_return"] == "-0.07"
    assert complete_scope["fixed_cohort_raw_equal_member_return"] == "-0.07"
    assert complete_scope["fixed_cohort_composition_identifiable"] is True

    partial_returns = dict(complete_returns)
    for member in membership.members[80:]:
        partial_returns[member.analysis_unit_id] = None
    previous, partial = _frames_from_returns(membership, partial_returns)
    partial_scope = build_v3_daily_scope_measurement(
        membership=membership, previous=previous, current=partial
    )["scopes"][0]
    assert partial_scope["raw_equal_member_return"] == "0.03"
    assert partial_scope["fixed_cohort_return_coverage"] == "0.8"
    assert partial_scope["fixed_cohort_composition_identifiable"] is False
    assert partial_scope["fixed_cohort_raw_equal_member_return"] is None
    assert partial_scope["fixed_cohort_robust_equal_member_return"] is None
    assert partial_scope["catalog_direction_identifiable"] is False


def test_winsor_boundary_discloses_degeneracy_and_raw_concentration() -> None:
    membership = _large_membership(100)
    returns = {
        member.analysis_unit_id: ("1.611" if index == 100 else "0.002")
        for index, member in enumerate(membership.members, start=1)
    }
    previous, current = _frames_from_returns(membership, returns)
    scope = build_v3_daily_scope_measurement(
        membership=membership, previous=previous, current=current
    )["scopes"][0]
    assert scope["estimator_applied"] is True
    assert scope["suppression_reason_code"] == "SYMMETRIC_1_PERCENT_WINSOR_APPLIED"
    assert scope["anomaly_member_count"] == 1
    assert scope["anomaly_contributions"] == [
        {
            "analysis_unit_id": "item:100",
            "raw_return": "1.611",
            "suppressed_return": "0.002",
        }
    ]
    assert Decimal(scope["top1_absolute_contribution_share"]) > Decimal("0.89")

    returns["item:001"] = None
    previous, current = _frames_from_returns(membership, returns)
    scope = build_v3_daily_scope_measurement(
        membership=membership, previous=previous, current=current
    )["scopes"][0]
    assert scope["valid_return_count"] == 99
    assert scope["estimator_applied"] is False
    assert scope["suppression_reason_code"] == "INSUFFICIENT_FOR_SYMMETRIC_1_PERCENT_WINSOR"
    assert scope["raw_equal_member_return"] == scope["robust_equal_member_return"]
    assert scope["anomaly_contributions"] == []
