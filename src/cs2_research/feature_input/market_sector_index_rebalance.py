"""Hash-bound MARKET/SECTOR monthly and release-event basket rollover.

The transition is separate from daily measurement. It proves which immutable
continuation ended, which enlarged cumulative origin membership starts, and
which level each scope inherits. An unchanged monthly cohort keeps using its
existing spec, so its first day remains an ordinary adjacent measurement. A
real rollover never calculates a return: the effective day establishes a new
segment base and only the next adjacent complete UTC day can contribute one.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
import json
from typing import Any, Mapping, Sequence

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from .market_sector_index_contracts import REBALANCED_SPEC_SCHEMA
from .market_sector_descriptive import _membership_binding
from .market_sector_index_continuation import (
    ForwardIndexSpec,
    make_forward_index_spec,
    validate_forward_point,
)
from .market_sector_taxonomy_v3 import TaxonomyMembershipV3


TRANSITION_SCHEMA = "market-sector-index-rebalance-transition/1"
TRANSITION_PREFIX = "market_sector_index_rebalance_"
TRIGGERS = {"MONTHLY_UTC", "RELEASE_EVENT"}
ANCHOR_SEMANTIC = "NO_SWITCH_RETURN_EFFECTIVE_DAY_ESTABLISHES_NEW_SEGMENT_BASE"


class MarketSectorIndexRebalanceError(ValueError):
    pass


def _require(ok: bool, code: str) -> None:
    if not ok:
        raise MarketSectorIndexRebalanceError(code)


def _hash64(value: object, code: str) -> str:
    _require(
        isinstance(value, str)
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value),
        code,
    )
    return value


def _utc(value: datetime, code: str) -> datetime:
    _require(
        isinstance(value, datetime)
        and value.tzinfo is not None
        and value.utcoffset() == timedelta(0),
        code,
    )
    return value.astimezone(UTC)


def _scope_codes(membership: TaxonomyMembershipV3) -> tuple[str, ...]:
    return tuple(sorted({"ALL", *(scope for member in membership.members for scope in member.scope_codes)}))


def _member_map(membership: TaxonomyMembershipV3) -> dict[str, Any]:
    return {member.analysis_unit_id: member for member in membership.members}


@dataclass(frozen=True, slots=True)
class RebalanceTransition:
    payload: bytes

    @property
    def sha256(self) -> str:
        return sha256_hex(self.payload)

    @property
    def transition_id(self) -> str:
        return TRANSITION_PREFIX + self.sha256

    def document(self) -> dict[str, Any]:
        value = json.loads(self.payload)
        _require(isinstance(value, dict), "TRANSITION_OBJECT")
        validate_rebalance_transition(value)
        return value


def validate_rebalance_transition(document: Mapping[str, Any]) -> None:
    required = {
        "schema", "anchor_semantic", "trigger", "trigger_event_id", "effective_date",
        "sealed_at", "parent", "successor", "provider_request_count", "database_read_count",
        "database_write_count", "automatic_promotion",
    }
    _require(set(document) == required and document.get("schema") == TRANSITION_SCHEMA,
             "TRANSITION_SHAPE")
    _require(document.get("anchor_semantic") == ANCHOR_SEMANTIC, "TRANSITION_ANCHOR_SEMANTIC")
    trigger = document.get("trigger")
    _require(trigger in TRIGGERS, "TRANSITION_TRIGGER")
    try:
        effective = date.fromisoformat(document["effective_date"])
        sealed = datetime.fromisoformat(document["sealed_at"].replace("Z", "+00:00"))
    except (TypeError, ValueError):
        raise MarketSectorIndexRebalanceError("TRANSITION_CLOCK") from None
    _utc(sealed, "TRANSITION_CLOCK")
    _require(sealed.date() >= effective, "TRANSITION_CLOCK")
    if trigger == "MONTHLY_UTC":
        _require(effective.day == 1 and document["trigger_event_id"] is None,
                 "TRANSITION_MONTHLY_TRIGGER")
    else:
        _hash64(document["trigger_event_id"], "TRANSITION_RELEASE_EVENT_ID")
    parent = document.get("parent")
    successor = document.get("successor")
    _require(isinstance(parent, Mapping) and set(parent) == {
        "continuation_spec_sha256", "membership_id", "membership_binding_sha256",
        "publication_id", "manifest_sha256", "ledger_day_count", "ledger_tip_sha256",
        "last_bucket_date",
    }, "TRANSITION_PARENT_SHAPE")
    _require(isinstance(successor, Mapping) and set(successor) == {
        "membership_id", "membership_binding_sha256", "membership_event_ledger_id",
        "added_analysis_unit_ids", "removed_analysis_unit_ids", "scope_codes",
        "new_scope_codes", "anchors",
    }, "TRANSITION_SUCCESSOR_SHAPE")
    for key in ("continuation_spec_sha256", "membership_binding_sha256", "publication_id",
                "manifest_sha256", "ledger_tip_sha256"):
        _hash64(parent[key], "TRANSITION_PARENT_HASH")
    _hash64(successor["membership_binding_sha256"], "TRANSITION_SUCCESSOR_BINDING")
    _require(type(parent["ledger_day_count"]) is int and parent["ledger_day_count"] > 0,
             "TRANSITION_PARENT_COUNT")
    _require(date.fromisoformat(parent["last_bucket_date"]) + timedelta(days=1) == effective,
             "TRANSITION_DATE_LINK")
    _require(successor["removed_analysis_unit_ids"] == [], "TRANSITION_REMOVAL")
    for key in ("added_analysis_unit_ids", "scope_codes", "new_scope_codes"):
        values = successor[key]
        _require(isinstance(values, list) and values == sorted(set(values)),
                 "TRANSITION_SORTED_SET")
    _require(bool(successor["added_analysis_unit_ids"]),
             "TRANSITION_NOOP_SUCCESSOR_FORBIDDEN")
    anchors = successor["anchors"]
    _require(isinstance(anchors, Mapping) and sorted(anchors) == successor["scope_codes"],
             "TRANSITION_ANCHOR_SCOPE_SET")
    _require(set(successor["new_scope_codes"]) <= set(successor["scope_codes"]),
             "TRANSITION_NEW_SCOPE_SET")
    for scope, row in anchors.items():
        _require(isinstance(scope, str) and isinstance(row, Mapping) and set(row) == {
            "anchor_kind", "point_id", "index_value",
        }, "TRANSITION_ANCHOR_SHAPE")
        _require(row["anchor_kind"] in {"INHERITED_PARENT_POINT", "NEW_SCOPE_BASE_1000"},
                 "TRANSITION_ANCHOR_KIND")
        _require(
            isinstance(row["point_id"], str)
            and row["point_id"].startswith("market_sector_index_point_")
            and len(row["point_id"]) == len("market_sector_index_point_") + 64,
            "TRANSITION_ANCHOR_POINT_ID",
        )
        level = Decimal(row["index_value"])
        _require(level.is_finite() and level > 0, "TRANSITION_ANCHOR_LEVEL")
        if scope in successor["new_scope_codes"]:
            _require(row["anchor_kind"] == "NEW_SCOPE_BASE_1000" and level == 1000,
                     "TRANSITION_NEW_SCOPE_ANCHOR")
        else:
            _require(row["anchor_kind"] == "INHERITED_PARENT_POINT",
                     "TRANSITION_INHERITED_SCOPE_ANCHOR")
    _require(
        document["provider_request_count"] == document["database_read_count"]
        == document["database_write_count"] == 0
        and document["automatic_promotion"] is False,
        "TRANSITION_BOUNDARY",
    )


def make_rebalance_transition(
    *,
    parent_spec: ForwardIndexSpec,
    parent_membership: TaxonomyMembershipV3,
    parent_latest_points: Sequence[Mapping[str, Any]],
    parent_publication_id: str,
    parent_manifest_sha256: str,
    parent_ledger_day_count: int,
    parent_ledger_tip_sha256: str,
    new_membership: TaxonomyMembershipV3,
    new_membership_event_ledger_id: str,
    effective_date: date,
    trigger: str,
    trigger_event_id: str | None,
    sealed_at: datetime,
) -> RebalanceTransition:
    """Seal one cumulative-origin cohort transition without manufacturing return."""

    sealed_at = _utc(sealed_at, "SEALED_AT_UTC")
    _require(type(effective_date) is date, "EFFECTIVE_DATE")
    _require(trigger in TRIGGERS, "TRIGGER")
    if trigger == "MONTHLY_UTC":
        _require(effective_date.day == 1, "MONTHLY_EFFECTIVE_DATE_NOT_FIRST")
        _require(trigger_event_id is None, "MONTHLY_TRIGGER_EVENT_FORBIDDEN")
    else:
        _hash64(trigger_event_id, "RELEASE_EVENT_ID")
    _hash64(parent_publication_id, "PARENT_PUBLICATION_ID")
    _hash64(parent_manifest_sha256, "PARENT_MANIFEST_SHA256")
    _hash64(parent_ledger_tip_sha256, "PARENT_LEDGER_TIP_SHA256")
    _require(type(parent_ledger_day_count) is int and parent_ledger_day_count > 0, "PARENT_LEDGER_DAY_COUNT")
    _require(
        isinstance(new_membership_event_ledger_id, str)
        and new_membership_event_ledger_id.startswith("market_sector_membership_events_")
        and len(new_membership_event_ledger_id) == len("market_sector_membership_events_") + 64,
        "MEMBERSHIP_EVENT_LEDGER_ID",
    )

    parent_members = _member_map(parent_membership)
    new_members = _member_map(new_membership)
    removed = sorted(set(parent_members) - set(new_members))
    added = sorted(set(new_members) - set(parent_members))
    _require(not removed, "ORIGIN_MEMBERSHIP_REMOVAL_FORBIDDEN")
    for key, member in parent_members.items():
        _require(member == new_members[key], "EXISTING_MEMBER_IDENTITY_OR_SCOPE_DRIFT")
    if trigger == "RELEASE_EVENT":
        _require(bool(added), "RELEASE_EVENT_WITHOUT_NEW_MEMBER")
    else:
        _require(bool(added), "MONTHLY_NOOP_REUSES_EXISTING_SPEC")

    parent_scopes = _scope_codes(parent_membership)
    new_scopes = _scope_codes(new_membership)
    _require(set(parent_scopes) <= set(new_scopes), "ORIGIN_SCOPE_REMOVAL_FORBIDDEN")
    points = {point.get("scope_code"): point for point in parent_latest_points}
    _require(set(points) == set(parent_scopes), "PARENT_POINT_SCOPE_SET")
    parent_dates: set[str] = set()
    anchors: dict[str, dict[str, str]] = {}
    for scope in parent_scopes:
        point = points[scope]
        validate_forward_point(point)
        _require(point["continuation_spec_sha256"] == parent_spec.sha256, "PARENT_POINT_SPEC")
        _require(point["index_value"] is not None, "PARENT_POINT_LEVEL_UNAVAILABLE")
        level = Decimal(point["index_value"])
        _require(level.is_finite() and level > 0, "PARENT_POINT_LEVEL")
        parent_dates.add(point["bucket_date"])
        anchors[scope] = {
            "anchor_kind": "INHERITED_PARENT_POINT",
            "point_id": point["point_id"],
            "index_value": str(point["index_value"]),
        }
    _require(len(parent_dates) == 1, "PARENT_POINT_DATE_SET")
    parent_date = date.fromisoformat(next(iter(parent_dates)))
    _require(effective_date == parent_date + timedelta(days=1), "NON_ADJACENT_REBALANCE_DATE")
    _require(sealed_at.date() >= effective_date, "SEALED_BEFORE_EFFECTIVE_DATE")

    for scope in sorted(set(new_scopes) - set(parent_scopes)):
        seed = {
            "schema": "market-sector-index-rebalance-anchor/1",
            "scope_code": scope,
            "effective_date": effective_date.isoformat(),
            "new_membership_id": new_membership.membership_id,
            "index_value": "1000",
            "semantic": ANCHOR_SEMANTIC,
        }
        anchors[scope] = {
            "anchor_kind": "NEW_SCOPE_BASE_1000",
            "point_id": "market_sector_index_point_" + sha256_hex(canonical_json_bytes(seed)),
            "index_value": "1000",
        }

    document = {
        "schema": TRANSITION_SCHEMA,
        "anchor_semantic": ANCHOR_SEMANTIC,
        "trigger": trigger,
        "trigger_event_id": trigger_event_id,
        "effective_date": effective_date.isoformat(),
        "sealed_at": utc_timestamp_text(sealed_at),
        "parent": {
            "continuation_spec_sha256": parent_spec.sha256,
            "membership_id": parent_membership.membership_id,
            "membership_binding_sha256": _membership_binding(parent_membership),
            "publication_id": parent_publication_id,
            "manifest_sha256": parent_manifest_sha256,
            "ledger_day_count": parent_ledger_day_count,
            "ledger_tip_sha256": parent_ledger_tip_sha256,
            "last_bucket_date": parent_date.isoformat(),
        },
        "successor": {
            "membership_id": new_membership.membership_id,
            "membership_binding_sha256": _membership_binding(new_membership),
            "membership_event_ledger_id": new_membership_event_ledger_id,
            "added_analysis_unit_ids": added,
            "removed_analysis_unit_ids": [],
            "scope_codes": list(new_scopes),
            "new_scope_codes": sorted(set(new_scopes) - set(parent_scopes)),
            "anchors": dict(sorted(anchors.items())),
        },
        "provider_request_count": 0,
        "database_read_count": 0,
        "database_write_count": 0,
        "automatic_promotion": False,
    }
    validate_rebalance_transition(document)
    return RebalanceTransition(canonical_json_bytes(document))


def make_rebalanced_forward_index_spec(
    *,
    transition: RebalanceTransition,
    parent_spec: ForwardIndexSpec,
    new_membership: TaxonomyMembershipV3,
    source_ledger_spec_sha256: str,
    opened_at: datetime,
    implementation_commit: str,
) -> ForwardIndexSpec:
    """Create the next immutable daily spec bound to a verified transition."""

    transition_doc = transition.document()
    _require(transition_doc.get("schema") == TRANSITION_SCHEMA, "TRANSITION_SCHEMA")
    _require(
        transition_doc["parent"]["continuation_spec_sha256"] == parent_spec.sha256,
        "TRANSITION_PARENT_SPEC",
    )
    _require(
        transition_doc["successor"]["membership_binding_sha256"] == _membership_binding(new_membership),
        "TRANSITION_SUCCESSOR_MEMBERSHIP",
    )
    parent_doc = parent_spec.document()
    anchors = {
        scope: {"point_id": row["point_id"], "index_value": row["index_value"]}
        for scope, row in transition_doc["successor"]["anchors"].items()
    }
    base = make_forward_index_spec(
        membership=new_membership,
        historical_publication_id=transition_doc["parent"]["publication_id"],
        historical_manifest_sha256=transition_doc["parent"]["manifest_sha256"],
        historical_series_revision_id=parent_doc["historical_anchor"]["series_revision_id"],
        historical_product_policy_sha256=parent_doc["historical_anchor"]["product_policy_sha256"],
        historical_anchor_date=date.fromisoformat(transition_doc["parent"]["last_bucket_date"]),
        historical_anchor_points=anchors,
        membership_event_ledger_id=transition_doc["successor"]["membership_event_ledger_id"],
        source_ledger_spec_sha256=source_ledger_spec_sha256,
        opened_at=opened_at,
        implementation_commit=implementation_commit,
        rebalance_effective_date=date.fromisoformat(transition_doc["effective_date"]),
    )
    document = base.document()
    document["schema"] = REBALANCED_SPEC_SCHEMA
    document["rebalance_transition_id"] = transition.transition_id
    document["rebalance_transition_sha256"] = transition.sha256
    document["rebalance_trigger"] = transition_doc["trigger"]
    document["anchor_semantic"] = ANCHOR_SEMANTIC
    return ForwardIndexSpec(canonical_json_bytes(document))


__all__ = [
    "ANCHOR_SEMANTIC",
    "MarketSectorIndexRebalanceError",
    "RebalanceTransition",
    "TRANSITION_SCHEMA",
    "make_rebalance_transition",
    "make_rebalanced_forward_index_spec",
    "validate_rebalance_transition",
]
