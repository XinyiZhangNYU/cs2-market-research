from __future__ import annotations

from dataclasses import replace
from datetime import UTC, datetime
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

from cs2_research.catalog.display import CatalogDisplayProjection
from cs2_research.trending.identity import bind_member_economic_identity, source_economic_identity
from cs2_research.trending.models import CatalogMappingStatus, TrendingCatalogMember, TrendingContractError


ROOT = Path(__file__).resolve().parents[2]


def _fixture() -> tuple[TrendingCatalogMember, dict]:
    projection = json.loads((ROOT / "schemas/examples/catalog-display-list.valid.json").read_text(encoding="utf-8"))["members"][0]["projection"]
    member = TrendingCatalogMember(
        analysis_unit_id=projection["analysis_unit_id"], display_name=projection["localized_name"]["en"],
        item_kind=projection["item_kind"], base_item_code=projection["base_item_code"],
        mapping_status=CatalogMappingStatus.EXACT, model_code="fixture-model", rarity_code="fixture-rarity",
        edition_kind=projection["edition_kind"], wear_tier=projection["wear_tier"],
        identity_available_at=datetime(2026, 8, 24, 8, 0, 1, tzinfo=UTC),
        projection_sha256=projection["projection_hash"],
    )
    return member, projection


def test_legacy_members_roundtrip_unchanged_but_are_not_economic_proof() -> None:
    member, _ = _fixture()
    legacy = member.to_document()
    assert "economic_identity" not in legacy
    assert TrendingCatalogMember.from_document(legacy).to_document() == legacy
    with pytest.raises(TrendingContractError, match="MEMBER_ECONOMIC_PROOF_REQUIRED"):
        source_economic_identity(member)


def test_exact_full_projection_seals_economic_proof_and_schema() -> None:
    member, projection = _fixture()
    bound = bind_member_economic_identity(member, projection)
    proof = source_economic_identity(bound)
    assert proof["evidence_sha256"] == projection["projection_hash"]
    assert bound.economic_identity["definition"]["analysis_unit_kind"] == "BASE_MHN"
    assert bound.economic_identity["definition"]["parent_analysis_unit_id"] is None
    schema = json.loads((ROOT / "schemas/trending-offline-contracts.v1.schema.json").read_text(encoding="utf-8"))
    Draft202012Validator({**schema, "oneOf": [{"$ref": "#/$defs/catalogMember"}]}).validate(bound.to_document())
    assert TrendingCatalogMember.from_document(bound.to_document()) == bound
    with pytest.raises(TypeError):
        bound.economic_identity["fingerprint_sha256"] = "0" * 64
    with pytest.raises(TypeError):
        bound.economic_identity["definition"]["edition_kind"] = "STANDARD"


@pytest.mark.parametrize("field,value", [("edition_kind", "STANDARD"), ("base_item_code", "another-base"), ("analysis_unit_id", "another-id")])
def test_member_economic_combinations_cannot_reuse_an_existing_proof(field: str, value: str) -> None:
    member, projection = _fixture()
    bound = bind_member_economic_identity(member, projection)
    with pytest.raises(TrendingContractError, match="MEMBER_ECONOMIC_FIELD_DRIFT"):
        replace(bound, **{field: value})
    with pytest.raises(TrendingContractError, match="MEMBER_ECONOMIC_PROJECTION_MISMATCH"):
        bind_member_economic_identity(replace(member, projection_sha256="1" * 64), projection)


def test_only_display_change_has_equal_economic_fingerprint_and_distinct_evidence() -> None:
    member, projection = _fixture()
    original = bind_member_economic_identity(member, projection)
    parsed = CatalogDisplayProjection.from_document(projection)
    newer_name = replace(parsed.localized_name, en=parsed.localized_name.en + " New display")
    new_projection = CatalogDisplayProjection.build(
        **{field: getattr(parsed, field) for field in (
            "analysis_unit_id", "parent_analysis_unit_id", "analysis_unit_kind", "item_kind",
            "base_item_code", "edition_kind", "wear_tier", "media", "catalog_version",
            "version_context", "valid_from",
        )}, localized_name=newer_name,
    )
    successor = bind_member_economic_identity(
        replace(member, display_name=newer_name.en, projection_sha256=new_projection.projection_hash,
                identity_available_at=datetime(2026, 9, 1, tzinfo=UTC)), new_projection.to_document(),
    )
    assert original.economic_identity["fingerprint_sha256"] == successor.economic_identity["fingerprint_sha256"]
    assert original.projection_sha256 != successor.projection_sha256
    assert original.identity_available_at < successor.identity_available_at
