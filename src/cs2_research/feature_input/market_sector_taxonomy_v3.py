"""Prospective V3 MARKET/SECTOR taxonomy onboarding.

The V2 live ledger remains immutable.  This module builds a new, hash-bound,
multi-scope membership from the approved internal catalog snapshot and one
already captured upstream schema snapshot.  It performs no network or database
work and cannot promote an economic state.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import UTC, datetime
import hashlib
import json
from typing import Any, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text


TAXONOMY_POLICY_SCHEMA_V3 = "market-sector-taxonomy-policy/3"
TAXONOMY_MEMBERSHIP_SCHEMA_V3 = "market-sector-taxonomy-membership/3"
TAXONOMY_USAGE_SCOPE_V3 = "INTERNAL_PROSPECTIVE_MARKET_SECTOR_V3_SHADOW"
TAXONOMY_PROFILE_STATUS_V3 = "PROFILE_NOT_SELECTED"
BASE_SCOPES_V3 = ("AGENT", "ARMORY", "CASE", "COLLECTION", "GLOVE", "KNIFE", "WEAPON")
LEGACY_ITEM_KINDS_V3 = frozenset({"GLOVE", "KNIFE", "WEAPON"})
PROVIDER_IDS_V3 = ("market_a", "market_b", "market_c")


class MarketSectorTaxonomyV3Error(ValueError):
    """A V3 taxonomy input is not safe to seal."""


def _require(condition: bool, code: str) -> None:
    if not condition:
        raise MarketSectorTaxonomyV3Error(code)


def _hash64(value: object, field: str) -> str:
    _require(
        isinstance(value, str)
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value),
        f"{field}:LOWERCASE_SHA256_REQUIRED",
    )
    return value


def _timestamp(value: datetime, field: str) -> datetime:
    _require(
        isinstance(value, datetime)
        and value.tzinfo is not None
        and value.utcoffset() == UTC.utcoffset(value),
        f"{field}:UTC_REQUIRED",
    )
    return value.astimezone(UTC)


def _strict_json(payload: bytes, field: str) -> Mapping[str, Any]:
    def pairs(values: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in values:
            _require(key not in result, f"{field}:DUPLICATE_KEY:{key}")
            result[key] = value
        return result

    try:
        document = json.loads(payload.decode("utf-8"), object_pairs_hook=pairs)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise MarketSectorTaxonomyV3Error(f"{field}:INVALID_UTF8_JSON") from exc
    _require(isinstance(document, Mapping), f"{field}:OBJECT_REQUIRED")
    return document


def _text(value: object, field: str) -> str:
    _require(isinstance(value, str) and value and value == value.strip(), f"{field}:TEXT_REQUIRED")
    return value


def _positive_int(value: object, field: str) -> int:
    _require(type(value) is int and value > 0, f"{field}:POSITIVE_INTEGER_REQUIRED")
    return value


def _utc_text(value: object, field: str) -> datetime:
    raw = _text(value, field)
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise MarketSectorTaxonomyV3Error(f"{field}:UTC_TIMESTAMP_REQUIRED") from exc
    return _timestamp(parsed, field)


def _source_ids(item: Mapping[str, Any]) -> tuple[str, ...]:
    ids = item.get("ids")
    if not isinstance(ids, Mapping):
        return ()
    return tuple(source for source in PROVIDER_IDS_V3 if type(ids.get(source)) is int and ids[source] > 0)


def _provisional_analysis_unit_id(market_hash_name: str) -> str:
    return "mhn-sha256:" + hashlib.sha256(market_hash_name.encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class TaxonomyMemberV3:
    analysis_unit_id: str
    market_hash_name: str
    item_kind: str
    scope_codes: tuple[str, ...]
    identity_sha256: str
    identity_authority: str
    source_ids_present: tuple[str, ...]

    def __post_init__(self) -> None:
        _text(self.analysis_unit_id, "analysis_unit_id")
        _text(self.market_hash_name, "market_hash_name")
        _text(self.item_kind, "item_kind")
        _require(
            self.scope_codes == tuple(sorted(set(self.scope_codes))) and self.scope_codes,
            "MEMBER_SCOPE_CODES_NOT_SORTED_UNIQUE",
        )
        _hash64(self.identity_sha256, "identity_sha256")
        _require(
            self.identity_authority
            in {"EXACT_INTERNAL_CATALOG_PROJECTION", "EXACT_MARKET_HASH_NAME_SHA256_PROVISIONAL"},
            "MEMBER_IDENTITY_AUTHORITY",
        )
        _require(
            self.source_ids_present == tuple(sorted(set(self.source_ids_present)))
            and set(self.source_ids_present) <= set(PROVIDER_IDS_V3),
            "MEMBER_SOURCE_IDS",
        )

    def document(self) -> dict[str, Any]:
        return {
            "analysis_unit_id": self.analysis_unit_id,
            "identity_authority": self.identity_authority,
            "identity_sha256": self.identity_sha256,
            "item_kind": self.item_kind,
            "market_hash_name": self.market_hash_name,
            "scope_codes": list(self.scope_codes),
            "source_ids_present": list(self.source_ids_present),
        }


@dataclass(frozen=True, slots=True)
class TaxonomyMembershipV3:
    membership_id: str
    sealed_at: datetime
    members: tuple[TaxonomyMemberV3, ...]
    document: Mapping[str, Any]

    def __post_init__(self) -> None:
        _text(self.membership_id, "membership_id")
        _timestamp(self.sealed_at, "sealed_at")
        keys = tuple(member.analysis_unit_id for member in self.members)
        _require(keys == tuple(sorted(set(keys))) and bool(keys), "MEMBERS_NOT_SORTED_UNIQUE")

    def scope_members(self, scope_code: str) -> tuple[TaxonomyMemberV3, ...]:
        if scope_code == "ALL":
            return self.members
        return tuple(member for member in self.members if scope_code in member.scope_codes)


def _validate_policy(policy: Mapping[str, Any]) -> tuple[dict[str, str], tuple[str, ...], tuple[str, ...]]:
    _require(policy.get("schema") == TAXONOMY_POLICY_SCHEMA_V3, "POLICY_SCHEMA")
    _require(policy.get("usage_scope") == TAXONOMY_USAGE_SCOPE_V3, "POLICY_USAGE_SCOPE")
    _require(policy.get("formal_state_eligible") is False, "POLICY_FORMAL_STATE")
    _require(policy.get("market_scope_code") == "ALL", "POLICY_MARKET_SCOPE")
    _require(policy.get("aggregate_scope_codes") == list(BASE_SCOPES_V3), "POLICY_AGGREGATE_SCOPES")
    identity = policy.get("identity_rules")
    continuity = policy.get("continuity_rules")
    small = policy.get("small_scope_rule")
    _require(isinstance(identity, Mapping), "POLICY_IDENTITY_RULES")
    _require(identity.get("cross_platform_key") == "market_hash_name", "POLICY_IDENTITY_KEY")
    _require(identity.get("wear_only_identity_forbidden") is True, "POLICY_WEAR_IDENTITY")
    _require(isinstance(continuity, Mapping) and all(continuity.values()), "POLICY_CONTINUITY")
    _require(
        isinstance(small, Mapping)
        and small.get("singleton_status") == "LOW_MEMBER_COUNT_RAW_ONLY"
        and small.get("other_small_scope_threshold") is None
        and small.get("other_small_scope_threshold_status") == TAXONOMY_PROFILE_STATUS_V3,
        "POLICY_SMALL_SCOPE",
    )

    raw_subsectors = policy.get("weapon_subsectors")
    _require(isinstance(raw_subsectors, Mapping) and raw_subsectors, "POLICY_WEAPON_SUBSECTORS")
    weapon_to_scope: dict[str, str] = {}
    for scope, raw_weapons in raw_subsectors.items():
        _require(isinstance(scope, str) and scope.startswith("WEAPON:"), "POLICY_WEAPON_SCOPE")
        _require(isinstance(raw_weapons, list) and raw_weapons == sorted(set(raw_weapons)), "POLICY_WEAPON_LIST")
        for weapon in raw_weapons:
            _text(weapon, "weapon_name")
            _require(weapon not in weapon_to_scope, "POLICY_WEAPON_DUPLICATE")
            weapon_to_scope[weapon] = scope

    case_policy = policy.get("case_admission")
    agent_policy = policy.get("agent_admission")
    collection_policy = policy.get("collection_admission")
    armory_policy = policy.get("armory_admission")
    _require(isinstance(case_policy, Mapping), "POLICY_CASE")
    _require(isinstance(agent_policy, Mapping), "POLICY_AGENT")
    _require(isinstance(collection_policy, Mapping), "POLICY_COLLECTION")
    _require(isinstance(armory_policy, Mapping), "POLICY_ARMORY")
    _require(
        case_policy.get("category") == "container"
        and case_policy.get("is_tradable") is True
        and case_policy.get("schema_completeness_rule")
        == "TRADABLE_CONTAINER_NAME_CONTAINS_CASE_OR_ENDS_TERMINAL"
        and case_policy.get("required_provider_ids") == list(PROVIDER_IDS_V3),
        "POLICY_CASE_RULE",
    )
    raw_cases = case_policy.get("market_hash_names")
    _require(isinstance(raw_cases, list) and raw_cases == sorted(set(raw_cases)) and raw_cases, "POLICY_CASE_NAMES")
    _require(all(isinstance(name, str) and name for name in raw_cases), "POLICY_CASE_NAMES_EMPTY")
    _require(
        agent_policy.get("category") == "agent"
        and agent_policy.get("is_tradable") is True
        and agent_policy.get("required_provider_ids") == list(PROVIDER_IDS_V3),
        "POLICY_AGENT_RULE",
    )
    _require(
        collection_policy.get("member_category") == "skin"
        and collection_policy.get("collection_kind") == "weapon",
        "POLICY_COLLECTION_RULE",
    )
    raw_armory = armory_policy.get("collection_names")
    _require(
        armory_policy.get("member_category") == "skin"
        and armory_policy.get("collection_kind") == "weapon"
        and isinstance(raw_armory, list)
        and raw_armory == sorted(set(raw_armory))
        and raw_armory,
        "POLICY_ARMORY_RULE",
    )
    return weapon_to_scope, tuple(raw_cases), tuple(raw_armory)


def build_taxonomy_membership_v3(
    *,
    policy_payload: bytes,
    expected_policy_sha256: str,
    catalog_payload: bytes,
    expected_catalog_sha256: str,
    schema_payload: bytes,
    expected_schema_sha256: str,
    predecessor_membership_payload: bytes,
    expected_predecessor_membership_sha256: str,
    predecessor_profile_payload: bytes,
    expected_predecessor_profile_sha256: str,
    sealed_at: datetime,
) -> TaxonomyMembershipV3:
    """Build a new prospective membership without touching the V2 ledger."""

    sealed_at = _timestamp(sealed_at, "sealed_at")
    expected_hashes = {
        "policy": _hash64(expected_policy_sha256, "expected_policy_sha256"),
        "catalog": _hash64(expected_catalog_sha256, "expected_catalog_sha256"),
        "schema": _hash64(expected_schema_sha256, "expected_schema_sha256"),
        "predecessor_membership": _hash64(
            expected_predecessor_membership_sha256,
            "expected_predecessor_membership_sha256",
        ),
        "predecessor_profile": _hash64(
            expected_predecessor_profile_sha256,
            "expected_predecessor_profile_sha256",
        ),
    }
    payloads = {
        "policy": policy_payload,
        "catalog": catalog_payload,
        "schema": schema_payload,
        "predecessor_membership": predecessor_membership_payload,
        "predecessor_profile": predecessor_profile_payload,
    }
    for key, payload in payloads.items():
        _require(sha256_hex(payload) == expected_hashes[key], f"{key.upper()}:HASH_DRIFT")

    policy = _strict_json(policy_payload, "POLICY")
    catalog = _strict_json(catalog_payload, "CATALOG")
    schema = _strict_json(schema_payload, "SCHEMA")
    predecessor = _strict_json(predecessor_membership_payload, "PREDECESSOR_MEMBERSHIP")
    predecessor_profile = _strict_json(predecessor_profile_payload, "PREDECESSOR_PROFILE")
    weapon_to_scope, case_names, armory_names = _validate_policy(policy)

    _require(predecessor.get("schema") == "index-shadow-membership/1", "PREDECESSOR_SCHEMA")
    predecessor_id = _text(predecessor.get("membership_id"), "predecessor_membership_id")
    predecessor_members = predecessor.get("members")
    _require(isinstance(predecessor_members, list) and predecessor_members, "PREDECESSOR_MEMBERS")
    _require(predecessor.get("late_bound") is False, "PREDECESSOR_NOT_PIT")
    _require(
        predecessor_profile.get("schema_version") == "market-sector-shadow-profile/2",
        "PREDECESSOR_PROFILE_SCHEMA",
    )
    predecessor_profile_id = _text(predecessor_profile.get("profile_id"), "predecessor_profile_id")
    predecessor_t0 = _text(predecessor_profile.get("t0"), "predecessor_t0")
    _require(_utc_text(predecessor_t0, "predecessor_t0") <= sealed_at, "PREDECESSOR_T0_AFTER_SEAL")

    descriptor = catalog.get("snapshot")
    catalog_rows = catalog.get("members")
    _require(isinstance(descriptor, Mapping) and isinstance(catalog_rows, list), "CATALOG_SHAPE")
    _require(len(catalog_rows) == descriptor.get("member_count") == len(predecessor_members), "CATALOG_COUNT")
    predecessor_ids = {row.get("analysis_unit_id") for row in predecessor_members if isinstance(row, Mapping)}
    _require(len(predecessor_ids) == len(predecessor_members), "PREDECESSOR_ID_UNIQUENESS")

    items = schema.get("items")
    collections = schema.get("collections")
    counts = schema.get("counts")
    _require(isinstance(items, Mapping) and isinstance(collections, Mapping) and isinstance(counts, Mapping), "SCHEMA_SHAPE")
    _require(len(items) == counts.get("items"), "SCHEMA_ITEM_COUNT")
    _require(len(collections) == counts.get("collections"), "SCHEMA_COLLECTION_COUNT")
    _require(schema.get("schema_version") == "v3", "SCHEMA_VERSION")
    _text(schema.get("generation_id"), "schema_generation_id")
    _require(
        _utc_text(schema.get("generated_at"), "schema_generated_at") <= sealed_at,
        "SCHEMA_GENERATED_AFTER_SEAL",
    )
    discovered_case_names = tuple(
        sorted(
            name
            for name, value in items.items()
            if isinstance(name, str)
            and isinstance(value, Mapping)
            and value.get("category") == "container"
            and value.get("is_tradable") is True
            and ("Case" in name or name.endswith("Terminal"))
        )
    )
    for name in armory_names:
        collection = collections.get(name)
        _require(
            isinstance(collection, Mapping)
            and collection.get("kind") == "weapon"
            and "Armory" in str(collection.get("update_name", "")),
            f"ARMORY_COLLECTION_INVALID:{name}",
        )

    members: list[TaxonomyMemberV3] = []
    exclusions: list[dict[str, str]] = []
    for row in catalog_rows:
        _require(isinstance(row, Mapping) and isinstance(row.get("projection"), Mapping), "CATALOG_ROW")
        projection = row["projection"]
        analysis_unit_id = _text(projection.get("analysis_unit_id"), "catalog_analysis_unit_id")
        _require(analysis_unit_id in predecessor_ids, "CATALOG_NOT_IN_PREDECESSOR")
        _require(projection.get("analysis_unit_kind") == "BASE_MHN", "CATALOG_NOT_BASE_MHN")
        item_kind = _text(projection.get("item_kind"), "catalog_item_kind")
        _require(item_kind in LEGACY_ITEM_KINDS_V3, "CATALOG_ITEM_KIND")
        localized_name = projection.get("localized_name")
        _require(isinstance(localized_name, Mapping), "CATALOG_LOCALIZED_NAME")
        name = _text(localized_name.get("en"), "catalog_market_hash_name")
        source_item = items.get(name)
        if not isinstance(source_item, Mapping):
            exclusions.append(
                {
                    "analysis_unit_id": analysis_unit_id,
                    "market_hash_name": name,
                    "reason": "SCHEMA_IDENTITY_UNAVAILABLE_NOT_ADMITTED",
                }
            )
            continue
        _require(source_item.get("market_hash_name") == name, "SCHEMA_ITEM_KEY_NAME_MISMATCH")
        _require(source_item.get("is_tradable") is True, f"SCHEMA_ITEM_NOT_TRADABLE:{name}")
        _require(source_item.get("category") in {"skin", "vanilla_skin"}, f"SCHEMA_ITEM_CATEGORY:{name}")
        scopes = {item_kind}
        if item_kind == "WEAPON":
            weapon = _text(source_item.get("weapon"), f"weapon:{name}")
            _require(weapon in weapon_to_scope, f"WEAPON_NOT_CLASSIFIED:{weapon}")
            scopes.add(weapon_to_scope[weapon])
            item_collections = source_item.get("collections", [])
            _require(isinstance(item_collections, list), f"COLLECTIONS_NOT_LIST:{name}")
            weapon_collections = {
                collection_name
                for collection_name in item_collections
                if isinstance(collections.get(collection_name), Mapping)
                and collections[collection_name].get("kind") == "weapon"
            }
            if weapon_collections:
                scopes.add("COLLECTION")
            if weapon_collections.intersection(armory_names):
                scopes.add("ARMORY")
        members.append(
            TaxonomyMemberV3(
                analysis_unit_id=analysis_unit_id,
                market_hash_name=name,
                item_kind=item_kind,
                scope_codes=tuple(sorted(scopes)),
                identity_sha256=_hash64(projection.get("projection_hash"), "projection_hash"),
                identity_authority="EXACT_INTERNAL_CATALOG_PROJECTION",
                source_ids_present=tuple(sorted(_source_ids(source_item))),
            )
        )

    case_def_indices: set[int] = set()
    for name in case_names:
        source_item = items.get(name)
        _require(isinstance(source_item, Mapping), f"CASE_MISSING:{name}")
        _require(
            source_item.get("market_hash_name") == name
            and source_item.get("category") == "container"
            and source_item.get("is_tradable") is True,
            f"CASE_SEMANTICS:{name}",
        )
        def_index = _positive_int(source_item.get("def_index"), f"case_def_index:{name}")
        _require(def_index not in case_def_indices, f"CASE_DEFINDEX_DUPLICATE:{def_index}")
        case_def_indices.add(def_index)
        source_ids = tuple(sorted(_source_ids(source_item)))
        _require(source_ids == PROVIDER_IDS_V3, f"CASE_SOURCE_IDS:{name}")
        basis = {
            "category": "container",
            "def_index": def_index,
            "market_hash_name": name,
            "provider_ids": {source: source_item["ids"][source] for source in PROVIDER_IDS_V3},
        }
        members.append(
            TaxonomyMemberV3(
                analysis_unit_id=_provisional_analysis_unit_id(name),
                market_hash_name=name,
                item_kind="CASE",
                scope_codes=("CASE", f"CASE:{def_index}"),
                identity_sha256=sha256_hex(canonical_json_bytes(basis)),
                identity_authority="EXACT_MARKET_HASH_NAME_SHA256_PROVISIONAL",
                source_ids_present=source_ids,
            )
        )
    _require(discovered_case_names == case_names, "CASE_SCOPE_NOT_SCHEMA_COMPLETE")

    agent_names = sorted(
        name
        for name, value in items.items()
        if isinstance(value, Mapping)
        and value.get("category") == "agent"
        and value.get("is_tradable") is True
    )
    _require(bool(agent_names), "NO_TRADABLE_AGENTS")
    for name in agent_names:
        source_item = items[name]
        def_index = _positive_int(source_item.get("def_index"), f"agent_def_index:{name}")
        source_ids = tuple(sorted(_source_ids(source_item)))
        _require(source_ids == PROVIDER_IDS_V3, f"AGENT_SOURCE_IDS:{name}")
        basis = {
            "category": "agent",
            "def_index": def_index,
            "market_hash_name": name,
            "provider_ids": {source: source_item["ids"][source] for source in PROVIDER_IDS_V3},
        }
        members.append(
            TaxonomyMemberV3(
                analysis_unit_id=_provisional_analysis_unit_id(name),
                market_hash_name=name,
                item_kind="AGENT",
                scope_codes=("AGENT",),
                identity_sha256=sha256_hex(canonical_json_bytes(basis)),
                identity_authority="EXACT_MARKET_HASH_NAME_SHA256_PROVISIONAL",
                source_ids_present=source_ids,
            )
        )

    members.sort(key=lambda member: member.analysis_unit_id)
    _require(
        len({member.analysis_unit_id for member in members}) == len(members)
        and len({member.market_hash_name for member in members}) == len(members),
        "V3_MEMBER_IDENTITY_COLLISION",
    )
    observed_scope_counts = Counter(scope for member in members for scope in member.scope_codes)
    expected_scopes = set(BASE_SCOPES_V3) | set(weapon_to_scope.values()) | {
        f"CASE:{def_index}" for def_index in case_def_indices
    }
    _require(set(observed_scope_counts) <= expected_scopes, "V3_SCOPE_ACCOUNTING")
    scope_counts = {scope: observed_scope_counts.get(scope, 0) for scope in sorted(expected_scopes)}
    source_coverage = {
        scope: {
            source: sum(
                1 for member in members if scope in member.scope_codes and source in member.source_ids_present
            )
            for source in PROVIDER_IDS_V3
        }
        for scope in sorted(expected_scopes)
    }
    scope_definitions = [
        {
            "member_count": count,
            "member_count_status": (
                "LOW_MEMBER_COUNT" if count == 1 else "PROFILE_THRESHOLD_NOT_SELECTED"
            ),
            "parent_scope": (
                "CASE" if scope.startswith("CASE:") else "WEAPON" if scope.startswith("WEAPON:") else "ALL"
            ),
            "scope_code": scope,
            "status": "ONBOARDED_PROSPECTIVE_SHADOW",
        }
        for scope, count in sorted(scope_counts.items())
    ]
    document_without_id = {
        "schema": TAXONOMY_MEMBERSHIP_SCHEMA_V3,
        "usage_scope": TAXONOMY_USAGE_SCOPE_V3,
        "formal_state_eligible": False,
        "sealed_at": utc_timestamp_text(sealed_at),
        "market_scope_code": "ALL",
        "market_member_count": len(members),
        "membership_contract_version": TAXONOMY_MEMBERSHIP_SCHEMA_V3,
        "profile_status": TAXONOMY_PROFILE_STATUS_V3,
        "continuity": {
            "historical_backfill": False,
            "new_profile_t0_required": True,
            "predecessor_membership_id": predecessor_id,
            "predecessor_membership_sha256": expected_hashes["predecessor_membership"],
            "predecessor_profile_id": predecessor_profile_id,
            "predecessor_profile_sha256": expected_hashes["predecessor_profile"],
            "predecessor_t0": predecessor_t0,
            "predecessor_t0_rewritten": False,
            "reset_required": True,
        },
        "input_hashes": dict(sorted(expected_hashes.items())),
        "schema_identity": {
            "generated_at": schema.get("generated_at"),
            "generation_id": schema.get("generation_id"),
            "schema_version": schema.get("schema_version"),
        },
        "scope_counts": scope_counts,
        "scope_definitions": scope_definitions,
        "source_id_coverage": source_coverage,
        "excluded_predecessor_members": exclusions,
        "exclusion_counts": {"SCHEMA_IDENTITY_UNAVAILABLE_NOT_ADMITTED": len(exclusions)},
        "identity_authority_counts": dict(
            sorted(Counter(member.identity_authority for member in members).items())
        ),
        "members": [member.document() for member in members],
    }
    membership_id = "market_sector_taxonomy_v3_" + sha256_hex(
        canonical_json_bytes(document_without_id)
    )
    document = {**document_without_id, "membership_id": membership_id}
    return TaxonomyMembershipV3(membership_id, sealed_at, tuple(members), document)


def load_taxonomy_membership_v3(payload: bytes, expected_sha256: str) -> TaxonomyMembershipV3:
    """Load and self-audit a previously emitted V3 membership document."""

    _hash64(expected_sha256, "expected_sha256")
    _require(sha256_hex(payload) == expected_sha256, "MEMBERSHIP_HASH_DRIFT")
    document = _strict_json(payload, "MEMBERSHIP")
    _require(document.get("schema") == TAXONOMY_MEMBERSHIP_SCHEMA_V3, "MEMBERSHIP_SCHEMA")
    _require(document.get("usage_scope") == TAXONOMY_USAGE_SCOPE_V3, "MEMBERSHIP_USAGE_SCOPE")
    _require(document.get("formal_state_eligible") is False, "MEMBERSHIP_FORMAL_STATE")
    _require(document.get("market_scope_code") == "ALL", "MEMBERSHIP_MARKET_SCOPE")
    _require(document.get("profile_status") == TAXONOMY_PROFILE_STATUS_V3, "MEMBERSHIP_PROFILE_STATUS")
    continuity = document.get("continuity")
    _require(
        isinstance(continuity, Mapping)
        and set(continuity)
        == {
            "historical_backfill",
            "new_profile_t0_required",
            "predecessor_membership_id",
            "predecessor_membership_sha256",
            "predecessor_profile_id",
            "predecessor_profile_sha256",
            "predecessor_t0",
            "predecessor_t0_rewritten",
            "reset_required",
        }
        and continuity.get("historical_backfill") is False
        and continuity.get("new_profile_t0_required") is True
        and continuity.get("predecessor_t0_rewritten") is False
        and continuity.get("reset_required") is True,
        "MEMBERSHIP_CONTINUITY",
    )
    _require(
        set(document)
        == {
            "continuity",
            "excluded_predecessor_members",
            "exclusion_counts",
            "formal_state_eligible",
            "identity_authority_counts",
            "input_hashes",
            "market_member_count",
            "market_scope_code",
            "members",
            "membership_contract_version",
            "membership_id",
            "profile_status",
            "schema",
            "schema_identity",
            "scope_counts",
            "scope_definitions",
            "sealed_at",
            "source_id_coverage",
            "usage_scope",
        },
        "MEMBERSHIP_TOP_LEVEL_KEYS",
    )
    _require(
        document.get("membership_contract_version") == TAXONOMY_MEMBERSHIP_SCHEMA_V3,
        "MEMBERSHIP_CONTRACT_VERSION",
    )
    raw_members = document.get("members")
    _require(isinstance(raw_members, list) and raw_members, "MEMBERSHIP_MEMBERS")
    _require(
        all(
            isinstance(row, Mapping)
            and set(row)
            == {
                "analysis_unit_id",
                "identity_authority",
                "identity_sha256",
                "item_kind",
                "market_hash_name",
                "scope_codes",
                "source_ids_present",
            }
            for row in raw_members
        ),
        "MEMBERSHIP_MEMBER_SHAPE",
    )
    members = tuple(
        TaxonomyMemberV3(
            analysis_unit_id=_text(row.get("analysis_unit_id"), "analysis_unit_id"),
            market_hash_name=_text(row.get("market_hash_name"), "market_hash_name"),
            item_kind=_text(row.get("item_kind"), "item_kind"),
            scope_codes=tuple(row.get("scope_codes", [])),
            identity_sha256=_hash64(row.get("identity_sha256"), "identity_sha256"),
            identity_authority=_text(row.get("identity_authority"), "identity_authority"),
            source_ids_present=tuple(row.get("source_ids_present", [])),
        )
        for row in raw_members
        if isinstance(row, Mapping)
    )
    _require(len(members) == len(raw_members) == document.get("market_member_count"), "MEMBERSHIP_COUNT")
    actual_counts = Counter(scope for member in members for scope in member.scope_codes)
    declared_counts = document.get("scope_counts")
    _require(isinstance(declared_counts, Mapping), "MEMBERSHIP_SCOPE_COUNTS_SHAPE")
    _require(
        all(type(value) is int and value >= 0 for value in declared_counts.values())
        and {key: value for key, value in declared_counts.items() if value}
        == dict(sorted(actual_counts.items())),
        "MEMBERSHIP_SCOPE_COUNTS",
    )
    sealed_at = _utc_text(document.get("sealed_at"), "sealed_at")
    membership_id = _text(document.get("membership_id"), "membership_id")
    input_hashes = document.get("input_hashes")
    exclusions = document.get("excluded_predecessor_members")
    _require(isinstance(input_hashes, Mapping), "MEMBERSHIP_INPUT_HASHES")
    _require(isinstance(exclusions, list), "MEMBERSHIP_EXCLUSIONS")
    _require(
        all(
            isinstance(row, Mapping)
            and set(row) == {"analysis_unit_id", "market_hash_name", "reason"}
            and row.get("reason") == "SCHEMA_IDENTITY_UNAVAILABLE_NOT_ADMITTED"
            for row in exclusions
        ),
        "MEMBERSHIP_EXCLUSION_SHAPE",
    )
    _require(
        document.get("exclusion_counts")
        == {"SCHEMA_IDENTITY_UNAVAILABLE_NOT_ADMITTED": len(exclusions)},
        "MEMBERSHIP_EXCLUSION_COUNTS",
    )
    for field in ("catalog", "policy", "predecessor_membership", "predecessor_profile", "schema"):
        _hash64(input_hashes.get(field), f"input_hashes.{field}")
    _require(
        set(input_hashes)
        == {"catalog", "policy", "predecessor_membership", "predecessor_profile", "schema"},
        "MEMBERSHIP_INPUT_HASH_KEYS",
    )
    _require(
        continuity.get("predecessor_membership_sha256") == input_hashes["predecessor_membership"]
        and continuity.get("predecessor_profile_sha256") == input_hashes["predecessor_profile"],
        "MEMBERSHIP_PREDECESSOR_HASH_LINK",
    )
    _text(continuity.get("predecessor_membership_id"), "predecessor_membership_id")
    _text(continuity.get("predecessor_profile_id"), "predecessor_profile_id")
    predecessor_t0 = _utc_text(continuity.get("predecessor_t0"), "predecessor_t0")
    _require(predecessor_t0 <= sealed_at, "MEMBERSHIP_PREDECESSOR_T0_AFTER_SEAL")
    schema_identity = document.get("schema_identity")
    _require(
        isinstance(schema_identity, Mapping)
        and set(schema_identity) == {"generated_at", "generation_id", "schema_version"}
        and schema_identity.get("schema_version") == "v3",
        "MEMBERSHIP_SCHEMA_IDENTITY",
    )
    _text(schema_identity.get("generation_id"), "schema_generation_id")
    _require(
        _utc_text(schema_identity.get("generated_at"), "schema_generated_at") <= sealed_at,
        "MEMBERSHIP_SCHEMA_GENERATED_AFTER_SEAL",
    )
    authority_counts = dict(sorted(Counter(member.identity_authority for member in members).items()))
    _require(document.get("identity_authority_counts") == authority_counts, "MEMBERSHIP_AUTHORITY_COUNTS")
    source_coverage = {
        scope: {
            source: sum(
                1
                for member in members
                if scope in member.scope_codes and source in member.source_ids_present
            )
            for source in PROVIDER_IDS_V3
        }
        for scope in declared_counts
    }
    _require(document.get("source_id_coverage") == source_coverage, "MEMBERSHIP_SOURCE_COVERAGE")
    scope_definitions = document.get("scope_definitions")
    _require(isinstance(scope_definitions, list), "MEMBERSHIP_SCOPE_DEFINITIONS_SHAPE")
    expected_definitions = [
        {
            "member_count": count,
            "member_count_status": (
                "LOW_MEMBER_COUNT" if count == 1 else "PROFILE_THRESHOLD_NOT_SELECTED"
            ),
            "parent_scope": (
                "CASE"
                if scope.startswith("CASE:")
                else "WEAPON"
                if scope.startswith("WEAPON:")
                else "ALL"
            ),
            "scope_code": scope,
            "status": "ONBOARDED_PROSPECTIVE_SHADOW",
        }
        for scope, count in sorted(declared_counts.items())
    ]
    _require(scope_definitions == expected_definitions, "MEMBERSHIP_SCOPE_DEFINITIONS")
    expected_membership_id = "market_sector_taxonomy_v3_" + sha256_hex(
        canonical_json_bytes(
            {key: value for key, value in document.items() if key != "membership_id"}
        )
    )
    _require(membership_id == expected_membership_id, "MEMBERSHIP_ID_DRIFT")
    return TaxonomyMembershipV3(membership_id, sealed_at, members, document)


__all__ = [
    "BASE_SCOPES_V3",
    "MarketSectorTaxonomyV3Error",
    "TAXONOMY_MEMBERSHIP_SCHEMA_V3",
    "TAXONOMY_POLICY_SCHEMA_V3",
    "TAXONOMY_PROFILE_STATUS_V3",
    "TAXONOMY_USAGE_SCOPE_V3",
    "TaxonomyMemberV3",
    "TaxonomyMembershipV3",
    "build_taxonomy_membership_v3",
    "load_taxonomy_membership_v3",
]
