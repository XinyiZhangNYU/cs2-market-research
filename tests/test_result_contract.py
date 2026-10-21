from __future__ import annotations

import copy
import json
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.result import (
    CollectionResultEnvelope,
    ResultContractError,
    ResultIdentity,
    UnitResultEnvelope,
    decode_result_envelope,
)
from cs2_research.state_machine.enums import (
    AnalysisUnitKind,
    ClaimCode,
    DataBranch,
    DataStatus,
    DomainMissingReasonCode,
    DomainStrength,
    ScopeKind,
)
from cs2_research.state_machine.models import VersionContext


T0 = datetime(2026, 8, 21, 0, 0, tzinfo=UTC)
HASH = "a" * 64
EXAMPLE_ROOT = Path(__file__).parents[1] / "schemas" / "examples"


def _versions() -> VersionContext:
    return VersionContext(
        catalog_version="catalog-v1",
        group_version="group-v1",
        index_version="index-v1",
        fusion_method_version="fusion-v1",
        feature_profile_version="profile-v1",
        algorithm_version="algorithm-v1",
        parameter_set_version="parameters-v1",
        stage_policy_version="stage-v1",
        failure_policy_version="failure-v1",
    )


def _market_result(*, as_of: datetime = T0) -> UnitResultEnvelope:
    return UnitResultEnvelope(
        identity=ResultIdentity(
            analysis_unit_id="market:cn-cash",
            scope_kind=ScopeKind.MARKET,
            display_name="中国现金市场",
            identity_available_at=T0 - timedelta(hours=1),
            catalog_version="catalog-v1",
        ),
        as_of=as_of,
        available_at=as_of - timedelta(seconds=1),
        data_branch=DataBranch.B,
        data_status=DataStatus.COMPLETE,
        versions=_versions(),
        state={
            "trend_stage": "NEUTRAL",
            "level_regime": "NORMAL",
            "evidence_flags": [],
            "recommendation": "WATCH",
            "case_status": None,
            "analysis_case_id": None,
            "input_snapshot_hash": HASH,
        },
        recommendation_detail=None,
        evidence_domains=(),
        claims=(),
    )


def _item_result() -> UnitResultEnvelope:
    domains = tuple(
        {
            "domain": domain,
            "strength": "MODERATE",
            "contributing_feature_keys": [feature],
            "missing_reason": None,
            "policy_version": "stage-v1",
            "input_snapshot_hash": HASH,
        }
        for domain, feature in (
            ("P", "price_return"),
            ("D", "bid_strength"),
            ("S", "listing_contraction"),
        )
    )
    return UnitResultEnvelope(
        identity=ResultIdentity(
            analysis_unit_id="item:42:phase-p2",
            scope_kind=ScopeKind.ITEM,
            display_name="M9 Bayonet Doppler P2 FN",
            identity_available_at=T0 - timedelta(hours=1),
            catalog_version="catalog-v1",
            analysis_unit_kind=AnalysisUnitKind.STYLE_VARIANT,
            edition_kind="STANDARD",
            parent_analysis_unit_id="item:42",
        ),
        as_of=T0,
        available_at=T0 - timedelta(seconds=1),
        data_branch=DataBranch.B,
        data_status=DataStatus.UNAVAILABLE_BY_DESIGN,
        versions=_versions(),
        state={
            "cycle_stage": "PRESSURE_BUILDING",
            "evidence_flags": ["DEMAND_ACCELERATING"],
            "regime_relation": ["ITEM_SPECIFIC"],
            "recommendation": "WATCH",
            "case_status": "ACTIVE",
            "candidate_episode_id": "candidate:42",
            "cycle_case_id": None,
            "input_snapshot_hash": HASH,
        },
        recommendation_detail={
            "recommendation": "WATCH",
            "signal_strength": "MODERATE",
            "evidence_coverage": "0.67",
            "trade_confirmation": "UNAVAILABLE",
            "input_snapshot_hash": HASH,
        },
        evidence_domains=domains,
        claims=(ClaimCode.BUY_DEMAND_STRENGTHENING,),
    )


def test_unit_contract_round_trips_and_hashes_exact_content() -> None:
    result = _item_result()
    restored = UnitResultEnvelope.from_document(result.to_document())
    assert restored == result
    assert restored.snapshot_id == result.snapshot_id
    assert restored.document_hash == result.document_hash

    changed = copy.deepcopy(result.to_document())
    changed["identity"]["display_name"] = "tampered display name"
    with pytest.raises(ResultContractError, match="snapshot_id"):
        UnitResultEnvelope.from_document(changed)


def test_unit_contract_rejects_unknown_fields_parent_shape_and_uppercase_hash() -> None:
    document = _market_result().to_document()
    document["source_code"] = "market_b_direct"
    with pytest.raises(ResultContractError, match="unknown"):
        UnitResultEnvelope.from_document(document)

    with pytest.raises(ResultContractError, match="ITEM identity requires"):
        ResultIdentity(
            analysis_unit_id="item:1",
            scope_kind=ScopeKind.ITEM,
            display_name="missing granularity",
            identity_available_at=T0,
            catalog_version="catalog-v1",
        )

    document = _market_result().to_document()
    document["state"]["input_snapshot_hash"] = HASH.upper()
    document.pop("snapshot_id")
    document["snapshot_id"] = "B" * 64
    with pytest.raises(ResultContractError, match="lowercase SHA-256"):
        UnitResultEnvelope.from_document(document)


def test_item_parent_context_and_domain_reason_are_structured() -> None:
    with pytest.raises(ResultContractError, match="cannot carry a parent"):
        ResultIdentity(
            analysis_unit_id="item:42",
            scope_kind=ScopeKind.ITEM,
            display_name="base item",
            identity_available_at=T0,
            catalog_version="catalog-v1",
            analysis_unit_kind=AnalysisUnitKind.BASE_MHN,
            edition_kind="STANDARD",
            parent_analysis_unit_id="item:1",
        )
    with pytest.raises(ResultContractError, match="parent_analysis_unit_id"):
        ResultIdentity(
            analysis_unit_id="item:43",
            scope_kind=ScopeKind.ITEM,
            display_name="style item",
            identity_available_at=T0,
            catalog_version="catalog-v1",
            analysis_unit_kind=AnalysisUnitKind.STYLE_VARIANT,
            edition_kind="STANDARD",
        )

    item = _item_result()
    unavailable_domain = {
        "domain": "D",
        "strength": DomainStrength.UNAVAILABLE.value,
        "contributing_feature_keys": [],
        "missing_reason": DomainMissingReasonCode.UNAVAILABLE_BY_DESIGN.value,
        "policy_version": "stage-v1",
        "input_snapshot_hash": HASH,
    }
    unavailable = tuple(
        unavailable_domain if member["domain"] == "D" else member
        for member in item.evidence_domains
    )
    accepted = UnitResultEnvelope(
        identity=item.identity,
        as_of=item.as_of,
        available_at=item.available_at,
        data_branch=item.data_branch,
        data_status=item.data_status,
        versions=item.versions,
        state=item.state,
        recommendation_detail=item.recommendation_detail,
        evidence_domains=unavailable,
        claims=(),
    )
    assert accepted.evidence_domains[0]["missing_reason"] == "UNAVAILABLE_BY_DESIGN"

    hostile_domain = dict(unavailable_domain)
    hostile_domain["missing_reason"] = "请立即在 MARKET_B 下单"
    hostile = tuple(
        hostile_domain if member["domain"] == "D" else member
        for member in item.evidence_domains
    )
    with pytest.raises(ResultContractError, match="missing_reason"):
        UnitResultEnvelope(
            identity=item.identity,
            as_of=item.as_of,
            available_at=item.available_at,
            data_branch=item.data_branch,
            data_status=item.data_status,
            versions=item.versions,
            state=item.state,
            recommendation_detail=item.recommendation_detail,
            evidence_domains=hostile,
            claims=(),
        )


def test_branch_b_cannot_claim_trades_or_trade_confirmation() -> None:
    item = _item_result()
    with pytest.raises(ValueError, match="trade-confirmation claims"):
        UnitResultEnvelope(
            identity=item.identity,
            as_of=item.as_of,
            available_at=item.available_at,
            data_branch=item.data_branch,
            data_status=item.data_status,
            versions=item.versions,
            state=item.state,
            recommendation_detail=item.recommendation_detail,
            evidence_domains=item.evidence_domains,
            claims=(ClaimCode.SWEEPING_CONFIRMED,),
        )

    recommendation = dict(item.recommendation_detail or {})
    recommendation["trade_confirmation"] = "CONFIRMED"
    with pytest.raises(ResultContractError, match="branch B"):
        UnitResultEnvelope(
            identity=item.identity,
            as_of=item.as_of,
            available_at=item.available_at,
            data_branch=item.data_branch,
            data_status=item.data_status,
            versions=item.versions,
            state=item.state,
            recommendation_detail=recommendation,
            evidence_domains=item.evidence_domains,
            claims=(),
        )


def test_item_contract_binds_recommendation_and_all_domains() -> None:
    item = _item_result()

    recommendation = dict(item.recommendation_detail or {})
    recommendation["input_snapshot_hash"] = "b" * 64
    with pytest.raises(ResultContractError, match="input hashes differ"):
        UnitResultEnvelope(
            identity=item.identity,
            as_of=item.as_of,
            available_at=item.available_at,
            data_branch=item.data_branch,
            data_status=item.data_status,
            versions=item.versions,
            state=item.state,
            recommendation_detail=recommendation,
            evidence_domains=item.evidence_domains,
            claims=(),
        )

    domains = [dict(member) for member in item.evidence_domains]
    domains[0]["input_snapshot_hash"] = "b" * 64
    with pytest.raises(ResultContractError, match="one feature snapshot"):
        UnitResultEnvelope(
            identity=item.identity,
            as_of=item.as_of,
            available_at=item.available_at,
            data_branch=item.data_branch,
            data_status=item.data_status,
            versions=item.versions,
            state=item.state,
            recommendation_detail=item.recommendation_detail,
            evidence_domains=tuple(domains),
            claims=(),
        )


def test_collection_requires_exact_missing_and_unavailable_accounting() -> None:
    result = _market_result()
    collection = CollectionResultEnvelope(
        collection_id="overview:market",
        scope_kind=ScopeKind.MARKET,
        as_of=T0,
        available_at=T0,
        data_branch=DataBranch.B,
        data_status=DataStatus.DEGRADED_OPTIONAL,
        versions=_versions(),
        member_count=3,
        member_result_ids=(result.snapshot_id,),
        missing_member_ids=("market:missing",),
        unavailable_member_ids=("market:unavailable",),
    )
    assert CollectionResultEnvelope.from_document(collection.to_document()) == collection

    with pytest.raises(ResultContractError, match="accounting"):
        CollectionResultEnvelope(
            collection_id="overview:broken",
            scope_kind=ScopeKind.MARKET,
            as_of=T0,
            available_at=T0,
            data_branch=DataBranch.B,
            data_status=DataStatus.COMPLETE,
            versions=_versions(),
            member_count=2,
            member_result_ids=(result.snapshot_id,),
            missing_member_ids=(),
            unavailable_member_ids=(),
        )


def _apply_negative_case(document: object, case: dict[str, object]) -> object:
    changed = copy.deepcopy(document)
    path = case["path"]
    assert isinstance(path, list) and path
    target = changed
    for member in path[:-1]:
        target = target[member]  # type: ignore[index]
    final = path[-1]
    target[final] = case["value"]  # type: ignore[index]
    return changed


def _apply_semantic_operations(
    document: object, operations: list[dict[str, object]]
) -> object:
    changed = copy.deepcopy(document)
    for operation in operations:
        path = operation["path"]
        assert isinstance(path, list) and path
        target = changed
        for member in path[:-1]:
            target = target[member]  # type: ignore[index]
        if operation["operation"] == "replace":
            target[path[-1]] = operation["value"]  # type: ignore[index]
        elif operation["operation"] == "add":
            final = path[-1]
            assert final not in target  # type: ignore[operator]
            target[final] = operation["value"]  # type: ignore[index]
        elif operation["operation"] == "remove":
            del target[path[-1]]  # type: ignore[index]
        elif operation["operation"] == "reverse":
            target[path[-1]] = list(reversed(target[path[-1]]))  # type: ignore[index]
        else:
            raise AssertionError(f"unsupported semantic operation: {operation!r}")
    return changed


def _rehash_envelope(document: object) -> None:
    assert isinstance(document, dict)
    body = {key: value for key, value in document.items() if key != "snapshot_id"}
    document["snapshot_id"] = sha256_hex(canonical_json_bytes(body))


def test_language_neutral_examples_share_the_strict_python_contract() -> None:
    unit_document = json.loads(
        (EXAMPLE_ROOT / "unit-item-branch-b.valid.json").read_text(encoding="utf-8")
    )
    collection_document = json.loads(
        (EXAMPLE_ROOT / "collection-missing-unavailable.valid.json").read_text(
            encoding="utf-8"
        )
    )
    sector_document = json.loads(
        (EXAMPLE_ROOT / "unit-sector.valid.json").read_text(encoding="utf-8")
    )
    assert UnitResultEnvelope.from_document(unit_document).to_document() == unit_document
    assert (
        CollectionResultEnvelope.from_document(collection_document).to_document()
        == collection_document
    )
    assert decode_result_envelope(unit_document).to_document() == unit_document
    assert decode_result_envelope(collection_document).to_document() == collection_document
    assert decode_result_envelope(sector_document).to_document() == sector_document

    cases = json.loads(
        (EXAMPLE_ROOT / "negative-cases.json").read_text(encoding="utf-8")
    )
    assert {case["case_id"] for case in cases} == {
        "branch-b-trade-confirmation",
        "duplicate-p-domain",
        "source-private-top-level-field",
    }
    for case in cases:
        assert case["base_file"] == "unit-item-branch-b.valid.json"
        with pytest.raises(ValueError):
            UnitResultEnvelope.from_document(
                _apply_negative_case(unit_document, case)
            )


def test_shared_semantic_cases_match_the_declared_acceptance_and_rule() -> None:
    cases = json.loads(
        (EXAMPLE_ROOT / "semantic-cases.v1.json").read_text(encoding="utf-8")
    )
    assert len(cases) == 37
    assert len({case["case_id"] for case in cases}) == len(cases)
    assert {case["expected_acceptance"] for case in cases} == {"ACCEPT", "REJECT"}
    assert {case["rule_id"] for case in cases} == {
        "CANONICAL_SET_ORDER",
        "CANONICAL_UTC_TIMESTAMP",
        "CLAIM_BRANCH",
        "COLLECTION_EXACT_ACCOUNTING",
        "COLLECTION_MEMBER_COUNT",
        "COLLECTION_MEMBER_DISJOINT",
        "COLLECTION_RETURNED_COUNT",
        "COLLECTION_TIME_ORDER",
        "DOMAIN_INPUT_HASH_UNIFORM",
        "DOMAIN_MISSING_REASON",
        "DOMAIN_SET_EXACT",
        "ENUM_MEMBER",
        "ENVELOPE_KIND",
        "EVIDENCE_COVERAGE_RANGE",
        "EXACT_KEY_SET",
        "FEATURE_KEYS_SORTED",
        "IDENTITY_CATALOG_MATCH",
        "IDENTITY_SCOPE_SHAPE",
        "IDENTITY_TIME_ORDER",
        "ITEM_INPUT_HASH_MATCH",
        "ITEM_RECOMMENDATION_MATCH",
        "ITEM_SCOPE_SHAPE",
        "NONBLANK_NUL_FREE_TEXT",
        "NONBLANK_UNICODE_SCALAR_TEXT",
        "SECTOR_BREADTH_DECIMAL",
        "SECTOR_BREADTH_RATIO",
        "SHA256_DIGEST",
        "SNAPSHOT_ID_MATCH",
        "UNIT_TIME_ORDER",
    }

    for case in cases:
        document = json.loads(
            (EXAMPLE_ROOT / case["base_file"]).read_text(encoding="utf-8")
        )
        changed = _apply_semantic_operations(document, case["operations"])
        if case["rehash_snapshot"]:
            _rehash_envelope(changed)
        if case["expected_acceptance"] == "ACCEPT":
            decoded = decode_result_envelope(changed)
            assert decoded.to_document() == changed
            assert decoded.snapshot_id == changed["snapshot_id"]
        else:
            with pytest.raises(
                ResultContractError,
                match=re.escape(case["python_error_contains"]),
            ):
                decode_result_envelope(changed)


def test_language_neutral_schema_is_strict_and_matches_closed_vocabularies() -> None:
    schema_path = (
        Path(__file__).parents[1]
        / "schemas"
        / "research-result-envelope.v1.schema.json"
    )
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    assert schema["$schema"].endswith("2020-12/schema")
    assert schema["$defs"]["unit_result"]["additionalProperties"] is False
    assert schema["$defs"]["collection_result"]["additionalProperties"] is False
    assert schema["$defs"]["data_branch"]["enum"] == ["A", "B"]
    assert schema["$defs"]["timestamp"]["pattern"].endswith("\\.[0-9]{6}Z$")
    assert ".*" not in schema["$defs"]["nonblank_text"]["pattern"]
    assert "\\ud800-\\udfff" in schema["$defs"]["nonblank_text"]["pattern"]
    breadth = schema["$defs"]["sector_state"]["properties"]["breadth"]
    assert breadth["properties"]["advancing_member_ratio"]["oneOf"][0] == {
        "$ref": "#/$defs/ratio_decimal_text"
    }
    assert breadth["properties"]["median_member_return"]["oneOf"][0] == {
        "$ref": "#/$defs/signed_fixed_decimal_text"
    }
    assert "allOf" not in schema["$defs"]["market_state"]
    domain_missing_rule = schema["$defs"]["evidence_domain"]["allOf"][0]
    assert domain_missing_rule["if"]["properties"]["strength"] == {
        "enum": ["UNAVAILABLE", "CONFLICTED"]
    }
    assert set(schema["$defs"]["identity"]["properties"]["edition_kind"]["enum"]) == {
        "STANDARD",
        "STATTRAK",
        "SOUVENIR",
        "UNKNOWN",
        None,
    }
    item_rule = schema["$defs"]["unit_result"]["allOf"][2]
    domain_rule = item_rule["then"]["properties"]["evidence_domains"]
    assert domain_rule["minItems"] == domain_rule["maxItems"] == 3
    assert len(domain_rule["allOf"]) == 3
    branch_b_rule = schema["$defs"]["unit_result"]["allOf"][3]
    assert branch_b_rule["if"]["properties"]["data_branch"] == {"const": "B"}
