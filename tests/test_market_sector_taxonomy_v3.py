from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime
import json
from pathlib import Path

import pytest

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.feature_input.market_sector_taxonomy_v3 import (
    MarketSectorTaxonomyV3Error,
    build_taxonomy_membership_v3,
    load_taxonomy_membership_v3,
)


ROOT = Path(__file__).resolve().parents[1]
POLICY = json.loads(
    (ROOT / "config" / "market-sector-v3" / "taxonomy-policy-v3.json").read_text(
        encoding="utf-8"
    )
)
T0 = datetime(2026, 9, 6, 15, 0, tzinfo=UTC)


def _source_item(name: str, category: str, def_index: int, **extra: object) -> dict:
    return {
        "market_hash_name": name,
        "category": category,
        "is_tradable": True,
        "def_index": def_index,
        "ids": {"market_a": def_index + 1000, "market_b": def_index + 2000, "market_c": def_index + 3000},
        **extra,
    }


def _catalog_row(item_id: int, name: str, kind: str) -> dict:
    return {
        "projection": {
            "analysis_unit_id": f"item:{item_id}",
            "analysis_unit_kind": "BASE_MHN",
            "item_kind": kind,
            "localized_name": {"en": name},
            "projection_hash": f"{item_id:064x}",
        }
    }


def _inputs(*, unknown_weapon: bool = False, case_tradable: bool = True):
    policy = deepcopy(POLICY)
    policy["case_admission"]["market_hash_names"] = ["Example Case"]
    policy["armory_admission"]["collection_names"] = ["The Gallery Collection"]
    catalog_rows = [
        _catalog_row(1, "AK-47 | Example (Factory New)", "WEAPON"),
        _catalog_row(2, "★ Karambit", "KNIFE"),
        _catalog_row(3, "★ Sport Gloves | Example (Factory New)", "GLOVE"),
        _catalog_row(4, "AK-47", "WEAPON"),
    ]
    catalog = {
        "snapshot": {"member_count": 4},
        "members": catalog_rows,
    }
    items = {
        "AK-47 | Example (Factory New)": _source_item(
            "AK-47 | Example (Factory New)",
            "skin",
            7,
            weapon="Unknown" if unknown_weapon else "AK-47",
            collections=["The Gallery Collection"],
        ),
        "★ Karambit": _source_item("★ Karambit", "vanilla_skin", 507, weapon="Karambit"),
        "★ Sport Gloves | Example (Factory New)": _source_item(
            "★ Sport Gloves | Example (Factory New)", "skin", 5030, weapon="Sport Gloves"
        ),
        "Example Case": _source_item("Example Case", "container", 4001),
        "Agent Example": _source_item("Agent Example", "agent", 5001),
    }
    items["Example Case"]["is_tradable"] = case_tradable
    schema = {
        "schema_version": "v3",
        "generation_id": "fixture-generation",
        "generated_at": "2026-09-05T00:00:00Z",
        "counts": {"items": len(items), "collections": 1},
        "collections": {
            "The Gallery Collection": {
                "kind": "weapon",
                "update_name": "The Armory",
            }
        },
        "items": items,
    }
    predecessor = {
        "schema": "index-shadow-membership/1",
        "membership_id": "index_membership_fixture",
        "late_bound": False,
        "members": [
            {"analysis_unit_id": f"item:{item_id}"}
            for item_id in range(1, 5)
        ],
    }
    profile = {
        "schema_version": "market-sector-shadow-profile/2",
        "profile_id": "market_sector_shadow_profile_v2_fixture",
        "t0": "2026-09-06T12:53:38Z",
    }
    documents = {
        "policy": canonical_json_bytes(policy),
        "catalog": canonical_json_bytes(catalog),
        "schema": canonical_json_bytes(schema),
        "predecessor_membership": canonical_json_bytes(predecessor),
        "predecessor_profile": canonical_json_bytes(profile),
    }
    return documents


def _build(documents: dict[str, bytes]):
    return build_taxonomy_membership_v3(
        policy_payload=documents["policy"],
        expected_policy_sha256=sha256_hex(documents["policy"]),
        catalog_payload=documents["catalog"],
        expected_catalog_sha256=sha256_hex(documents["catalog"]),
        schema_payload=documents["schema"],
        expected_schema_sha256=sha256_hex(documents["schema"]),
        predecessor_membership_payload=documents["predecessor_membership"],
        expected_predecessor_membership_sha256=sha256_hex(documents["predecessor_membership"]),
        predecessor_profile_payload=documents["predecessor_profile"],
        expected_predecessor_profile_sha256=sha256_hex(documents["predecessor_profile"]),
        sealed_at=T0,
    )


def test_v3_builds_multi_scope_membership_and_preserves_continuity_boundary():
    result = _build(_inputs())

    assert len(result.members) == 5
    assert result.document["exclusion_counts"] == {
        "SCHEMA_IDENTITY_UNAVAILABLE_NOT_ADMITTED": 1
    }
    assert result.document["identity_authority_counts"] == {
        "EXACT_INTERNAL_CATALOG_PROJECTION": 3,
        "EXACT_MARKET_HASH_NAME_SHA256_PROVISIONAL": 2,
    }
    ak = next(member for member in result.members if member.market_hash_name.startswith("AK-47 |"))
    assert ak.scope_codes == ("ARMORY", "COLLECTION", "WEAPON", "WEAPON:RIFLE")
    assert len(result.scope_members("CASE")) == 1
    assert len(result.scope_members("CASE:4001")) == 1
    assert len(result.scope_members("AGENT")) == 1
    assert result.document["continuity"] == {
        "historical_backfill": False,
        "new_profile_t0_required": True,
        "predecessor_membership_id": "index_membership_fixture",
        "predecessor_membership_sha256": sha256_hex(_inputs()["predecessor_membership"]),
        "predecessor_profile_id": "market_sector_shadow_profile_v2_fixture",
        "predecessor_profile_sha256": sha256_hex(_inputs()["predecessor_profile"]),
        "predecessor_t0": "2026-09-06T12:53:38Z",
        "predecessor_t0_rewritten": False,
        "reset_required": True,
    }


def test_v3_output_self_reads_and_hash_drift_fails_closed():
    result = _build(_inputs())
    payload = canonical_json_bytes(result.document)
    loaded = load_taxonomy_membership_v3(payload, sha256_hex(payload))
    assert loaded.membership_id == result.membership_id
    assert loaded.scope_members("ALL") == result.members

    with pytest.raises(MarketSectorTaxonomyV3Error, match="MEMBERSHIP_HASH_DRIFT"):
        load_taxonomy_membership_v3(payload + b"\n", sha256_hex(payload))

    tampered = dict(result.document)
    tampered["profile_status"] = "SELECTED_WITHOUT_EVIDENCE"
    tampered_payload = canonical_json_bytes(tampered)
    with pytest.raises(MarketSectorTaxonomyV3Error, match="MEMBERSHIP_PROFILE_STATUS"):
        load_taxonomy_membership_v3(tampered_payload, sha256_hex(tampered_payload))


def test_v3_rejects_input_hash_drift_before_interpretation():
    documents = _inputs()
    with pytest.raises(MarketSectorTaxonomyV3Error, match="SCHEMA:HASH_DRIFT"):
        build_taxonomy_membership_v3(
            policy_payload=documents["policy"],
            expected_policy_sha256=sha256_hex(documents["policy"]),
            catalog_payload=documents["catalog"],
            expected_catalog_sha256=sha256_hex(documents["catalog"]),
            schema_payload=documents["schema"] + b" ",
            expected_schema_sha256=sha256_hex(documents["schema"]),
            predecessor_membership_payload=documents["predecessor_membership"],
            expected_predecessor_membership_sha256=sha256_hex(documents["predecessor_membership"]),
            predecessor_profile_payload=documents["predecessor_profile"],
            expected_predecessor_profile_sha256=sha256_hex(documents["predecessor_profile"]),
            sealed_at=T0,
        )


def test_v3_rejects_unclassified_weapon_instead_of_guessing():
    with pytest.raises(MarketSectorTaxonomyV3Error, match="WEAPON_NOT_CLASSIFIED:Unknown"):
        _build(_inputs(unknown_weapon=True))


def test_v3_rejects_case_semantic_drift():
    with pytest.raises(MarketSectorTaxonomyV3Error, match="CASE_SEMANTICS:Example Case"):
        _build(_inputs(case_tradable=False))


def test_v3_rejects_case_scope_that_is_not_complete_for_bound_schema():
    documents = _inputs()
    schema = json.loads(documents["schema"])
    schema["items"]["Sealed Example Terminal"] = _source_item(
        "Sealed Example Terminal", "container", 4002
    )
    schema["counts"]["items"] += 1
    documents["schema"] = canonical_json_bytes(schema)

    with pytest.raises(MarketSectorTaxonomyV3Error, match="CASE_SCOPE_NOT_SCHEMA_COMPLETE"):
        _build(documents)


def test_v3_case_scope_is_low_member_count_but_remains_visible():
    result = _build(_inputs())
    definitions = {row["scope_code"]: row for row in result.document["scope_definitions"]}
    assert definitions["CASE:4001"] == {
        "member_count": 1,
        "member_count_status": "LOW_MEMBER_COUNT",
        "parent_scope": "CASE",
        "scope_code": "CASE:4001",
        "status": "ONBOARDED_PROSPECTIVE_SHADOW",
    }
