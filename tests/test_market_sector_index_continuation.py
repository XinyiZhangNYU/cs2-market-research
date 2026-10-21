from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

import pytest

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.feature_input.market_sector_daily_v3 import (
    V3DailyPriceFrame,
    V3FusedMemberAsk,
    V3MemberPriceStatus,
)
from cs2_research.feature_input.market_sector_index_continuation import (
    AVAILABILITY,
    MarketSectorIndexContinuationError,
    build_forward_measured_points,
    make_forward_index_spec,
    validate_forward_point,
)
from cs2_research.feature_input.market_sector_taxonomy_v3 import (
    TaxonomyMemberV3,
    TaxonomyMembershipV3,
)


def _membership(count: int = 101) -> TaxonomyMembershipV3:
    members = tuple(
        TaxonomyMemberV3(
            analysis_unit_id=f"item-{index:03d}",
            market_hash_name=f"Item {index:03d}",
            item_kind="WEAPON",
            scope_codes=("WEAPON",),
            identity_sha256=sha256_hex(f"identity-{index}".encode()),
            identity_authority="EXACT_INTERNAL_CATALOG_PROJECTION",
            source_ids_present=("market_a", "market_b", "market_c"),
        )
        for index in range(count)
    )
    return TaxonomyMembershipV3(
        membership_id="market-sector-v3-membership-test",
        sealed_at=datetime(2026, 9, 6, tzinfo=UTC),
        members=members,
        document={"test": True},
    )


def _frame(
    membership: TaxonomyMembershipV3,
    day: date,
    *,
    prices: list[Decimal | None] | None = None,
    sources: list[tuple[str, ...]] | None = None,
) -> V3DailyPriceFrame:
    prices = prices or [Decimal("100")] * len(membership.members)
    sources = sources or [("market_a", "market_b")] * len(membership.members)
    rows = []
    for member, price, source_set in zip(membership.members, prices, sources, strict=True):
        rows.append(
            V3FusedMemberAsk(
                member.analysis_unit_id,
                member.identity_sha256,
                V3MemberPriceStatus.QUALIFIED if price is not None else V3MemberPriceStatus.INSUFFICIENT_SOURCES,
                price,
                source_set if price is not None else (),
                ("TEST",),
                sha256_hex(canonical_json_bytes({"day": day.isoformat(), "member": member.analysis_unit_id})),
            )
        )
    return V3DailyPriceFrame(
        bucket_date=day,
        available_at=datetime(day.year, day.month, day.day, tzinfo=UTC) + timedelta(days=1, minutes=5),
        membership_id=membership.membership_id,
        input_snapshot_sha256=sha256_hex(day.isoformat().encode()),
        members=tuple(rows),
    )


def _spec(membership: TaxonomyMembershipV3, anchor: date = date(2026, 9, 10)):
    anchors = {
        scope: {
            "point_id": "market_sector_index_point_" + sha256_hex(scope.encode()),
            "index_value": "1000",
        }
        for scope in ("ALL", "WEAPON")
    }
    return make_forward_index_spec(
        membership=membership,
        historical_publication_id="1" * 64,
        historical_manifest_sha256="2" * 64,
        historical_series_revision_id="market_sector_index_series_" + "3" * 64,
        historical_product_policy_sha256="4" * 64,
        historical_anchor_date=anchor,
        historical_anchor_points=anchors,
        membership_event_ledger_id="market_sector_membership_events_" + "5" * 64,
        source_ledger_spec_sha256="6" * 64,
        opened_at=datetime(anchor.year, anchor.month, anchor.day, 12, tzinfo=UTC) + timedelta(days=1),
        implementation_commit="7" * 40,
        rebalance_effective_date=anchor,
    )


def test_first_measured_day_uses_historical_scale_but_starts_a_new_visual_segment():
    membership = _membership()
    old = _frame(membership, date(2026, 9, 10))
    new = _frame(membership, date(2026, 9, 11), prices=[Decimal("500"), *([Decimal("110")] * 100)])
    points = build_forward_measured_points(
        spec=_spec(membership), membership=membership, previous=old, current=new,
        source_day_sha256="8" * 64, source_head_tip_sha256="9" * 64,
        measured_at=datetime(2026, 9, 12, 1, tzinfo=UTC),
    )
    assert {point["scope_code"] for point in points} == {"ALL", "WEAPON"}
    point = next(point for point in points if point["scope_code"] == "ALL")
    validate_forward_point(point)
    assert point["availability_semantic"] == AVAILABILITY
    assert point["period_return"] is None
    assert point["index_value"] == "1000"
    assert point["segment_id"] == "ALL:MEASURED:1"
    assert point["anomaly_member_count"] == 0
    assert point["anomaly_contributions"] == []
    assert point["raw_equal_return"] is point["robust_equal_return"] is None
    assert point["effective_estimator"] is None
    assert point["reason_codes"] == ["CONTEMPORANEOUS_BOUNDARY_BASE_NO_RETURN_OR_VISUAL_JOIN"]


def test_source_changes_are_retained_with_a_to_d_grades_and_disclosure():
    membership = _membership(5)
    old = _frame(membership, date(2026, 9, 10), sources=[
        ("market_a", "market_b"), ("market_a", "market_b"), ("market_a",), ("market_a",), ("market_a",),
    ])
    new = _frame(
        membership, date(2026, 9, 11),
        prices=[Decimal("110"), Decimal("110"), Decimal("110"), Decimal("110"), None],
        sources=[("market_a", "market_b"), ("market_a", "market_c"), ("market_a",), ("market_c",), ()],
    )
    point = next(
        point for point in build_forward_measured_points(
            spec=_spec(membership), membership=membership, previous=old, current=new,
            source_day_sha256="8" * 64, source_head_tip_sha256="9" * 64,
            measured_at=datetime(2026, 9, 12, 1, tzinfo=UTC),
        ) if point["scope_code"] == "ALL"
    )
    validate_forward_point(point)
    assert point["grade_counts"] == {"A": 1, "B": 1, "C": 1, "D": 1, "E": 1}
    assert point["paired_member_count"] == point["qualified_member_count"] == 4
    assert point["source_pair_counts"] == {"1->1": 1, "1->2": 1, "5->3": 1, "5->5": 1}
    assert "GRADE_D_SHARE_ABOVE_WARNING_LEVEL" not in point["reason_codes"]


def test_domain_rejection_is_in_raw_audit_but_not_robust_return():
    membership = _membership(2)
    anchor = _frame(membership, date(2026, 9, 10), prices=[Decimal("100"), Decimal("100")])
    old = _frame(membership, date(2026, 9, 11), prices=[Decimal("100"), Decimal("100")])
    prior = build_forward_measured_points(
        spec=_spec(membership), membership=membership, previous=anchor, current=old,
        source_day_sha256="8" * 64, source_head_tip_sha256="8" * 64,
        measured_at=datetime(2026, 9, 12, 1, tzinfo=UTC),
    )
    new = _frame(membership, date(2026, 9, 12), prices=[Decimal("200000"), Decimal("110")])
    point = next(
        point for point in build_forward_measured_points(
            spec=_spec(membership), membership=membership, previous=old, current=new,
            source_day_sha256="9" * 64, source_head_tip_sha256="9" * 64,
            measured_at=datetime(2026, 9, 13, 1, tzinfo=UTC), prior_points=prior,
        ) if point["scope_code"] == "ALL"
    )
    validate_forward_point(point)
    assert point["paired_member_count"] == 2
    assert point["qualified_member_count"] == point["rejected_return_domain_count"] == 1
    assert Decimal(point["raw_equal_return"]) > 900
    assert point["robust_equal_return"] == "0.1"


def test_subsequent_day_compounds_inside_measured_segment():
    membership = _membership(5)
    old = _frame(membership, date(2026, 9, 10))
    day1 = _frame(membership, date(2026, 9, 11), prices=[Decimal("110")] * 5)
    first = build_forward_measured_points(
        spec=_spec(membership), membership=membership, previous=old, current=day1,
        source_day_sha256="8" * 64, source_head_tip_sha256="9" * 64,
        measured_at=datetime(2026, 9, 12, 1, tzinfo=UTC),
    )
    day2 = _frame(membership, date(2026, 9, 12), prices=[Decimal("121")] * 5)
    second = build_forward_measured_points(
        spec=_spec(membership), membership=membership, previous=day1, current=day2,
        source_day_sha256="a" * 64, source_head_tip_sha256="b" * 64,
        measured_at=datetime(2026, 9, 13, 1, tzinfo=UTC), prior_points=first,
    )
    point = next(point for point in second if point["scope_code"] == "ALL")
    validate_forward_point(point)
    assert point["period_return"] == "0.1"
    assert point["index_value"] == "1100"
    assert point["segment_id"] == "ALL:MEASURED:1"


def test_unchanged_month_boundary_is_an_ordinary_adjacent_day():
    membership = _membership(5)
    spec = _spec(membership, date(2026, 9, 29))
    anchor = _frame(membership, date(2026, 9, 29))
    september_close = _frame(
        membership, date(2026, 9, 30), prices=[Decimal("110")] * 5,
    )
    prior = build_forward_measured_points(
        spec=spec, membership=membership, previous=anchor, current=september_close,
        source_day_sha256="8" * 64, source_head_tip_sha256="9" * 64,
        measured_at=datetime(2026, 10, 1, 1, tzinfo=UTC),
    )
    october_open = _frame(
        membership, date(2026, 10, 1), prices=[Decimal("121")] * 5,
    )
    points = build_forward_measured_points(
        spec=spec, membership=membership, previous=september_close, current=october_open,
        source_day_sha256="a" * 64, source_head_tip_sha256="b" * 64,
        measured_at=datetime(2026, 10, 2, 1, tzinfo=UTC), prior_points=prior,
    )
    point = next(point for point in points if point["scope_code"] == "ALL")
    assert point["period_return"] == "0.1"
    assert point["index_value"] == "1100"
    assert point["segment_id"] == "ALL:MEASURED:1"


def test_unavailable_day_is_explicit_and_recovery_is_a_new_unjoined_segment():
    membership = _membership(5)
    old = _frame(membership, date(2026, 9, 10))
    missing = _frame(membership, date(2026, 9, 11), prices=[None] * 5, sources=[()] * 5)
    first = build_forward_measured_points(
        spec=_spec(membership), membership=membership, previous=old, current=missing,
        source_day_sha256="8" * 64, source_head_tip_sha256="9" * 64,
        measured_at=datetime(2026, 9, 12, 1, tzinfo=UTC),
    )
    unavailable = next(point for point in first if point["scope_code"] == "ALL")
    validate_forward_point(unavailable)
    assert unavailable["quality_status"] == "UNAVAILABLE"
    assert unavailable["index_value"] is unavailable["period_return"] is None

    recovered = _frame(membership, date(2026, 9, 12), prices=[Decimal("110")] * 5)
    second = build_forward_measured_points(
        spec=_spec(membership), membership=membership, previous=missing, current=recovered,
        source_day_sha256="a" * 64, source_head_tip_sha256="b" * 64,
        measured_at=datetime(2026, 9, 13, 1, tzinfo=UTC), prior_points=first,
    )
    resumed = next(point for point in second if point["scope_code"] == "ALL")
    validate_forward_point(resumed)
    assert resumed["period_return"] is None
    assert resumed["index_value"] == "1000"
    assert resumed["segment_id"] == "ALL:MEASURED:1"
    assert resumed["reason_codes"] == ["ADJACENT_DAY_RETURN_COVERAGE_UNAVAILABLE_NEW_SEGMENT_BASE"]


def test_canonical_admitted_set_splits_ask_weight_from_winsor():
    from cs2_research.feature_input.paired_ask_sum_research import admit_pairs, decompose

    membership = _membership(101)
    old_prices = [Decimal("1"), Decimal("1"), Decimal("100"), *([Decimal("10")] * 98)]
    new_prices = [Decimal("1.1"), Decimal("1.1"), Decimal("90"), *([Decimal("10")] * 98)]
    anchor = _frame(membership, date(2026, 9, 10), prices=old_prices)
    day1 = _frame(membership, date(2026, 9, 11), prices=old_prices)
    first = build_forward_measured_points(
        spec=_spec(membership), membership=membership, previous=anchor, current=day1,
        source_day_sha256="8" * 64, source_head_tip_sha256="9" * 64,
        measured_at=datetime(2026, 9, 12, 1, tzinfo=UTC),
    )
    day2 = _frame(membership, date(2026, 9, 12), prices=new_prices)
    second = build_forward_measured_points(
        spec=_spec(membership), membership=membership, previous=day1, current=day2,
        source_day_sha256="a" * 64, source_head_tip_sha256="b" * 64,
        measured_at=datetime(2026, 9, 13, 1, tzinfo=UTC), prior_points=first,
    )
    point = next(point for point in second if point["scope_code"] == "ALL")
    validate_forward_point(point)
    previous = tuple((member.analysis_unit_id, price, "A") for member, price in zip(membership.members, old_prices, strict=True))
    current = tuple((member.analysis_unit_id, price, "A") for member, price in zip(membership.members, new_prices, strict=True))
    _, admitted, rejected = admit_pairs(previous, current)
    gaps = decompose(admitted)
    assert rejected == 0
    assert len(admitted) == point["qualified_member_count"] == 101
    assert abs(Decimal(point["period_return"]) - gaps["robust"]) < Decimal("0.000000000001")
    assert abs(Decimal(point["raw_equal_return"]) - gaps["equal_admitted"]) < Decimal("0.000000000001")
    assert gaps["weight_gap"] != 0
    assert gaps["winsor_gap"] != 0
    assert gaps["ask"] != gaps["robust"]


def test_first_pair_must_start_at_frozen_anchor():
    membership = _membership(5)
    with pytest.raises(MarketSectorIndexContinuationError, match="FIRST_PAIR_NOT_ANCHORED"):
        build_forward_measured_points(
            spec=_spec(membership), membership=membership,
            previous=_frame(membership, date(2026, 9, 9)),
            current=_frame(membership, date(2026, 9, 10)),
            source_day_sha256="8" * 64, source_head_tip_sha256="9" * 64,
            measured_at=datetime(2026, 9, 11, 1, tzinfo=UTC),
        )
