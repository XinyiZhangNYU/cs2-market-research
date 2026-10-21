from datetime import UTC, date, datetime
from decimal import Decimal

import pytest

from cs2_research.canonical import sha256_hex
from cs2_research.feature_input.market_sector_index_contracts import REBALANCED_SPEC_SCHEMA
from cs2_research.feature_input.market_sector_index_continuation import (
    build_forward_measured_points,
    make_forward_index_spec,
)
from cs2_research.feature_input.market_sector_index_rebalance import (
    MarketSectorIndexRebalanceError,
    make_rebalance_transition,
    make_rebalanced_forward_index_spec,
    validate_rebalance_transition,
)
from cs2_research.feature_input.market_sector_taxonomy_v3 import TaxonomyMemberV3, TaxonomyMembershipV3
from test_market_sector_index_continuation import _frame, _membership


def _spec_on(membership, anchor):
    return make_forward_index_spec(
        membership=membership,
        historical_publication_id="1" * 64,
        historical_manifest_sha256="2" * 64,
        historical_series_revision_id="market_sector_index_series_" + "3" * 64,
        historical_product_policy_sha256="4" * 64,
        historical_anchor_date=anchor,
        historical_anchor_points={
            scope: {
                "point_id": "market_sector_index_point_" + sha256_hex(scope.encode()),
                "index_value": "1000",
            }
            for scope in ("ALL", "WEAPON")
        },
        membership_event_ledger_id="market_sector_membership_events_" + "5" * 64,
        source_ledger_spec_sha256="6" * 64,
        opened_at=datetime(anchor.year, anchor.month, anchor.day + 1, 12, tzinfo=UTC),
        implementation_commit="7" * 40,
        rebalance_effective_date=anchor,
    )


def _latest_points(parent, spec, anchor):
    day1 = _frame(parent, anchor, prices=[Decimal("100")] * len(parent.members))
    day2 = _frame(parent, date.fromordinal(anchor.toordinal() + 1), prices=[Decimal("110")] * len(parent.members))
    first = build_forward_measured_points(
        spec=spec, membership=parent, previous=day1, current=day2,
        source_day_sha256="8" * 64, source_head_tip_sha256="8" * 64,
        measured_at=datetime(2026, 9, 30, 1, tzinfo=UTC),
    )
    day3 = _frame(parent, date.fromordinal(anchor.toordinal() + 2), prices=[Decimal("121")] * len(parent.members))
    second = build_forward_measured_points(
        spec=spec, membership=parent, previous=day2, current=day3,
        source_day_sha256="9" * 64, source_head_tip_sha256="9" * 64,
        measured_at=datetime(2026, 10, 1, 1, tzinfo=UTC), prior_points=first,
    )
    return day3, second


def _successor(parent):
    added = TaxonomyMemberV3(
        analysis_unit_id="item-new",
        market_hash_name="New Case",
        item_kind="CASE",
        scope_codes=("CASE", "CASE:NEW"),
        identity_sha256=sha256_hex(b"new-case"),
        identity_authority="EXACT_INTERNAL_CATALOG_PROJECTION",
        source_ids_present=("market_a", "market_b", "market_c"),
    )
    return TaxonomyMembershipV3(
        membership_id="market-sector-v3-membership-successor",
        sealed_at=datetime(2026, 10, 1, tzinfo=UTC),
        members=tuple(sorted((*parent.members, added), key=lambda member: member.analysis_unit_id)),
        document={"test": "successor"},
    )


def test_release_event_rollover_inherits_old_levels_and_bases_new_scopes_at_1000():
    parent = _membership(5)
    spec = _spec_on(parent, date(2026, 9, 28))
    parent_frame, latest = _latest_points(parent, spec, date(2026, 9, 28))
    successor = _successor(parent)
    transition = make_rebalance_transition(
        parent_spec=spec,
        parent_membership=parent,
        parent_latest_points=latest,
        parent_publication_id="a" * 64,
        parent_manifest_sha256="b" * 64,
        parent_ledger_day_count=2,
        parent_ledger_tip_sha256="c" * 64,
        new_membership=successor,
        new_membership_event_ledger_id="market_sector_membership_events_" + "d" * 64,
        effective_date=date(2026, 10, 1),
        trigger="RELEASE_EVENT",
        trigger_event_id="e" * 64,
        sealed_at=datetime(2026, 10, 2, tzinfo=UTC),
    )
    document = transition.document()
    assert document["successor"]["added_analysis_unit_ids"] == ["item-new"]
    assert document["successor"]["new_scope_codes"] == ["CASE", "CASE:NEW"]
    assert document["successor"]["anchors"]["ALL"]["index_value"] == "1100"
    assert document["successor"]["anchors"]["CASE"]["index_value"] == "1000"

    successor_spec = make_rebalanced_forward_index_spec(
        transition=transition,
        parent_spec=spec,
        new_membership=successor,
        source_ledger_spec_sha256="f" * 64,
        opened_at=datetime(2026, 10, 2, tzinfo=UTC),
        implementation_commit="1" * 40,
    )
    assert successor_spec.document()["schema"] == REBALANCED_SPEC_SCHEMA
    old_prices = [Decimal("121")] * len(parent.members) + [None]
    current_prices = [Decimal("133.1")] * len(parent.members) + [Decimal("50")]
    old = _frame(successor, date(2026, 9, 30), prices=old_prices)
    current = _frame(successor, date(2026, 10, 1), prices=current_prices)
    points = build_forward_measured_points(
        spec=successor_spec, membership=successor, previous=old, current=current,
        source_day_sha256="2" * 64, source_head_tip_sha256="3" * 64,
        measured_at=datetime(2026, 10, 2, 1, tzinfo=UTC),
    )
    by_scope = {point["scope_code"]: point for point in points}
    assert by_scope["ALL"]["period_return"] is None
    assert by_scope["ALL"]["index_value"] == "1100"
    assert by_scope["CASE"]["period_return"] is None
    assert by_scope["CASE"]["index_value"] == "1000"


def test_origin_member_removal_is_rejected():
    parent = _membership(2)
    spec = _spec_on(parent, date(2026, 9, 28))
    _, latest = _latest_points(parent, spec, date(2026, 9, 28))
    smaller = TaxonomyMembershipV3(
        membership_id="smaller",
        sealed_at=datetime(2026, 10, 1, tzinfo=UTC),
        members=parent.members[:1],
        document={"test": True},
    )
    with pytest.raises(MarketSectorIndexRebalanceError, match="ORIGIN_MEMBERSHIP_REMOVAL_FORBIDDEN"):
        make_rebalance_transition(
            parent_spec=spec, parent_membership=parent, parent_latest_points=latest,
            parent_publication_id="a" * 64, parent_manifest_sha256="b" * 64,
            parent_ledger_day_count=2, parent_ledger_tip_sha256="c" * 64,
            new_membership=smaller,
            new_membership_event_ledger_id="market_sector_membership_events_" + "d" * 64,
            effective_date=date(2026, 10, 1), trigger="MONTHLY_UTC", trigger_event_id=None,
            sealed_at=datetime(2026, 10, 2, tzinfo=UTC),
        )


def test_monthly_review_reuses_existing_spec_when_membership_is_unchanged():
    parent = _membership(2)
    spec = _spec_on(parent, date(2026, 9, 28))
    _, latest = _latest_points(parent, spec, date(2026, 9, 28))
    with pytest.raises(MarketSectorIndexRebalanceError, match="MONTHLY_NOOP_REUSES_EXISTING_SPEC"):
        make_rebalance_transition(
            parent_spec=spec, parent_membership=parent, parent_latest_points=latest,
            parent_publication_id="a" * 64, parent_manifest_sha256="b" * 64,
            parent_ledger_day_count=2, parent_ledger_tip_sha256="c" * 64,
            new_membership=parent,
            new_membership_event_ledger_id="market_sector_membership_events_" + "d" * 64,
            effective_date=date(2026, 10, 1), trigger="MONTHLY_UTC", trigger_event_id=None,
            sealed_at=datetime(2026, 10, 2, tzinfo=UTC),
        )


def test_monthly_rollover_is_allowed_when_the_origin_membership_grows():
    parent = _membership(2)
    spec = _spec_on(parent, date(2026, 9, 28))
    _, latest = _latest_points(parent, spec, date(2026, 9, 28))
    transition = make_rebalance_transition(
        parent_spec=spec, parent_membership=parent, parent_latest_points=latest,
        parent_publication_id="a" * 64, parent_manifest_sha256="b" * 64,
        parent_ledger_day_count=2, parent_ledger_tip_sha256="c" * 64,
        new_membership=_successor(parent),
        new_membership_event_ledger_id="market_sector_membership_events_" + "d" * 64,
        effective_date=date(2026, 10, 1), trigger="MONTHLY_UTC", trigger_event_id=None,
        sealed_at=datetime(2026, 10, 2, tzinfo=UTC),
    )
    assert transition.document()["successor"]["added_analysis_unit_ids"] == ["item-new"]

    forged = transition.document()
    forged["successor"]["added_analysis_unit_ids"] = []
    with pytest.raises(MarketSectorIndexRebalanceError, match="TRANSITION_NOOP_SUCCESSOR_FORBIDDEN"):
        validate_rebalance_transition(forged)


def test_monthly_rollover_requires_first_of_month():
    parent = _membership(2)
    spec = _spec_on(parent, date(2026, 9, 28))
    _, latest = _latest_points(parent, spec, date(2026, 9, 28))
    with pytest.raises(MarketSectorIndexRebalanceError, match="MONTHLY_EFFECTIVE_DATE_NOT_FIRST"):
        make_rebalance_transition(
            parent_spec=spec, parent_membership=parent, parent_latest_points=latest,
            parent_publication_id="a" * 64, parent_manifest_sha256="b" * 64,
            parent_ledger_day_count=2, parent_ledger_tip_sha256="c" * 64,
            new_membership=_successor(parent),
            new_membership_event_ledger_id="market_sector_membership_events_" + "d" * 64,
            effective_date=date(2026, 10, 2), trigger="MONTHLY_UTC", trigger_event_id=None,
            sealed_at=datetime(2026, 10, 3, tzinfo=UTC),
        )
