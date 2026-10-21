"""Retained endpoint-event proof only, NOT every contributing raw-slot clock.

Synthetic counterexamples: contract closure is not real historical evidence or
an assertion that the narrower scope suffices for an independent evidence release.
"""
from copy import deepcopy
from dataclasses import fields, replace
from datetime import timedelta
import json
from pathlib import Path
import subprocess
import sys

import pytest

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.catalog.display import CatalogDisplayProjection
from cs2_research.fx.analysis import AnalysisSourcePrice
from cs2_research.trending.current import (
    TrendingCurrentEndpointSet, build_current_endpoint_set_from_daily_projections,
)
from cs2_research.trending.formal import TrendingWindowEvidence
from cs2_research.trending.identity import TrendingIdentityHistory, bind_member_economic_identity
from cs2_research.trending.models import TrendingContractError
from identity_fixture import build_identity_fixture
from test_single_item_trending_d4_current import _reproject


def _history_changed(fixture, change):
    raw = deepcopy(fixture.catalog_history_document)
    change(raw)
    payload = canonical_json_bytes(raw)
    artifacts = dict(fixture.history.artifacts)
    artifacts.pop(fixture.history.catalog_history_sha256)
    digest = sha256_hex(payload)
    artifacts[digest] = payload.decode("utf-8")
    return replace(fixture.history, catalog_history_sha256=digest, artifacts=artifacts)


def _with_projections(pair, start, end):
    assessment = replace(pair.anomaly_assessment, start_projection_sha256=start["document_hash"],
                         end_projection_sha256=end["document_hash"])
    return replace(pair, start_projection=start, end_projection=end, anomaly_assessment=assessment)


def _selection(fixture, **changes):
    endpoint = fixture.endpoint_set
    args = dict(membership=fixture.membership, result_as_of=endpoint.result_as_of,
                evaluated_at=endpoint.evaluated_at, maximum_source_lag_seconds=7200,
                start_projections=[p.start_projection for p in endpoint.pairs],
                end_projections=[p.end_projection for p in endpoint.pairs],
                start_eod_proof=endpoint.start_eod_proof, end_eod_proof=endpoint.end_eod_proof,
                anomaly_policy_id=endpoint.anomaly_policy_id,
                anomaly_assessments=[p.anomaly_assessment for p in endpoint.pairs],
                identity_history=fixture.history)
    return build_current_endpoint_set_from_daily_projections(**{**args, **changes}).endpoint_set


def test_true_synthetic_history_roundtrips_and_receipts_are_rebuilt():
    fixture = build_identity_fixture()
    endpoint = fixture.endpoint_set
    assert endpoint.knowledge_mode == "PROSPECTIVE_PIT"
    assert endpoint.to_document()["schema_version"].endswith("/4")
    assert TrendingCurrentEndpointSet.from_document(endpoint.to_document()) == endpoint
    window = endpoint.window_evidence
    assert window.to_document()["schema_version"].endswith("/2")
    assert TrendingWindowEvidence.from_document(window.to_document()) == window
    for leg in endpoint.legs:
        fixture.history.validate_binding(leg.identity_binding)
        assert leg.start_fact_id == leg.identity_binding["start"]["projection"]["document_hash"]
        assert leg.end_fact_id == leg.identity_binding["end"]["projection"]["document_hash"]
        assert leg.identity_binding_sha256 == sha256_hex(canonical_json_bytes(leg.identity_binding))


def test_internal_binding_does_not_copy_whole_upstream_but_public_accessor_isolated(monkeypatch):
    fixture = build_identity_fixture(member_count=3)
    history = fixture.history
    digest = history.upstream_membership_sha256s[0]
    exposed = history.upstream(digest)
    exposed.document["members"].clear()
    assert history.upstream(digest).document["members"]
    expected = fixture.endpoint_set.legs[0].identity_binding
    def copying_forbidden(*args, **kwargs):
        raise AssertionError("per-endpoint whole-catalog deepcopy")
    monkeypatch.setattr(TrendingIdentityHistory,"upstream",copying_forbidden)
    history.validate_binding(expected)


def test_no_history_is_retrospective_and_direct_prospective_claim_is_rejected():
    fixture = build_identity_fixture()
    diagnostic = _selection(fixture, identity_history=None)
    assert diagnostic.knowledge_mode == "RETROSPECTIVE_DIAGNOSTIC"
    assert all(leg.identity_binding is None for leg in diagnostic.legs)
    assert all(leg.start_cny_minor == 100 for leg in diagnostic.legs)
    with pytest.raises(TrendingContractError, match="D4_SET_IDENTITY_HISTORY_REQUIRED"):
        replace(diagnostic, knowledge_mode="PROSPECTIVE_PIT")


@pytest.mark.parametrize("collection,field,value,code", [
    ("source_mappings", "valid_from", "2026-08-09T00:00:00.000000Z", "MAPPING_OUT_OF_VALIDITY"),
    ("source_mappings", "valid_to", "2026-08-08T23:56:00.000000Z", "MAPPING_OUT_OF_VALIDITY"),
    ("source_mappings", "recorded_at", "2026-08-09T00:00:00.000000Z", "MAPPING_NOT_YET_KNOWN"),
    ("source_mappings", "recorded_at", "2026-08-08T23:00:00.000000Z", "MAPPING_AFTER_SEAL"),
    ("variant_versions", "valid_from", "2026-08-09T00:00:00.000000Z", "VARIANT_NOT_VALID_OR_KNOWN"),
    ("variant_versions", "recorded_at", "2026-08-09T00:00:00.000000Z", "VARIANT_NOT_VALID_OR_KNOWN"),
    ("analysis_unit_versions", "valid_from", "2026-08-09T00:00:00.000000Z", "UNIT_OUT_OF_VALIDITY"),
    ("analysis_unit_versions", "recorded_at", "2026-08-09T00:00:00.000000Z", "UNIT_NOT_YET_KNOWN"),
])
def test_rehashed_history_cannot_make_late_or_expired_identity_prospective(collection, field, value, code):
    fixture = build_identity_fixture()
    changed = _history_changed(fixture, lambda h: h[collection][0].update({field: value}))
    with pytest.raises(TrendingContractError, match=code):
        replace(fixture.endpoint_set, identity_history=changed)


def test_both_source_ids_rekeyed_with_unchanged_eod_fact_refs_fail_closed():
    fixture = build_identity_fixture()
    pair = fixture.endpoint_set.pairs[0]
    changed = [_reproject(dict(p), source=replace(AnalysisSourcePrice.from_document(p["source"]),
                                                source_item_id=99999))
               for p in (pair.start_projection, pair.end_projection)]
    assert changed[0]["source"]["source_fact_sha256"] == pair.start_projection["source"]["source_fact_sha256"]
    with pytest.raises(TrendingContractError, match="D4_IDENTITY_SOURCE_ITEM_DRIFT"):
        replace(fixture.endpoint_set, pairs=(_with_projections(pair, *changed), *fixture.endpoint_set.pairs[1:]))


def test_late_display_refresh_preserves_old_economic_history():
    fixture = build_identity_fixture()
    old_member = fixture.membership.members[0]
    old_display = CatalogDisplayProjection.from_document(fixture.catalogs[old_member.analysis_unit_id])
    late_at = fixture.endpoint_set.evaluated_at - timedelta(minutes=1)
    values = {f.name: getattr(old_display, f.name) for f in fields(old_display) if f.name != "projection_hash"}
    values.update(localized_name=replace(old_display.localized_name, zh_cn="新展示名称"),
                  catalog_version="later-display-only", valid_from=late_at)
    new_display = CatalogDisplayProjection.build(**values)
    member = bind_member_economic_identity(replace(old_member, projection_sha256=new_display.projection_hash,
                                                   identity_available_at=late_at, economic_identity=None),
                                           new_display.to_document())
    membership = replace(fixture.membership, members=(member,), catalog_as_of=late_at,
                         available_at=late_at, catalog_version="later-display-only",
                         catalog_snapshot_sha256=sha256_hex(canonical_json_bytes(new_display.to_document())))
    endpoint = _selection(fixture, membership=membership)
    assert endpoint.knowledge_mode == "PROSPECTIVE_PIT"
    assert endpoint.identity_history == fixture.history
    assert endpoint.legs[0].identity_binding["start"]["catalog_projection_sha256"] == old_display.projection_hash
    assert new_display.projection_hash != old_display.projection_hash


def test_receipt_cannot_choose_version_not_in_history_even_after_rehash():
    fixture = build_identity_fixture()
    receipt = deepcopy(fixture.endpoint_set.legs[0].identity_binding)
    receipt["start"]["mapping_version"]["mapping_version_id"] += 50000
    with pytest.raises(TrendingContractError, match="D4_IDENTITY_BINDING_CONTENT_DRIFT"):
        fixture.history.validate_binding(receipt)


def test_upstream_membership_cannot_be_swapped_or_relabelled():
    fixture = build_identity_fixture()
    receipt = fixture.endpoint_set.legs[0].identity_binding["start"]
    with pytest.raises(TrendingContractError, match="D4_IDENTITY_UPSTREAM_ID"):
        fixture.history.bind_endpoint(receipt["projection"], upstream_membership_id="changed",
                                       upstream_membership_sha256=receipt["upstream_membership_sha256"])
    with pytest.raises(TrendingContractError, match="D4_IDENTITY_UPSTREAM_UNBOUND"):
        fixture.history.bind_endpoint(receipt["projection"], upstream_membership_id=receipt["upstream_membership_id"],
                                       upstream_membership_sha256="0" * 64)


def test_original_artifact_bytes_and_complete_dependencies_are_required():
    fixture = build_identity_fixture()
    artifacts = dict(fixture.history.artifacts)
    digest = fixture.upstream_document["input_hashes"]["catalog"]
    artifacts[digest] += " "
    with pytest.raises(TrendingContractError, match="D4_IDENTITY_ARTIFACT_DRIFT"):
        replace(fixture.history, artifacts=artifacts)
    artifacts.pop(digest)
    with pytest.raises(TrendingContractError, match="D4_IDENTITY_DEPENDENCY_MISSING"):
        replace(fixture.history, artifacts=artifacts)


def test_exported_upstream_document_does_not_mutate_cached_proof():
    fixture = build_identity_fixture()
    digest = fixture.history.upstream_membership_sha256s[0]
    exported = fixture.history.upstream(digest)
    exported.document["input_hashes"]["schema"] = "0" * 64
    fixture.history.validate_binding(fixture.endpoint_set.legs[0].identity_binding)


def test_history_late_packaging_is_not_a_historical_clock_rewrite():
    fixture = build_identity_fixture()
    assert fixture.history.assembled_at > fixture.endpoint_set.start_eod_proof.reduced_at
    with pytest.raises(TrendingContractError, match="D4_SET_IDENTITY_ASSEMBLY_FROM_FUTURE"):
        replace(fixture.endpoint_set, identity_history=replace(fixture.history,
            assembled_at=fixture.endpoint_set.evaluated_at + timedelta(seconds=1)))


def test_mutable_receipt_copy_cannot_evade_digest_revalidation():
    fixture = build_identity_fixture()
    leg = fixture.endpoint_set.legs[0]
    leg.identity_binding["start"]["known_at"] = utc_timestamp_text(fixture.endpoint_set.evaluated_at)
    with pytest.raises(TrendingContractError, match="D3_LEG_IDENTITY_BINDING_HASH"):
        leg.to_document()


@pytest.mark.parametrize("delta", [-1, 1])
def test_large_exact_values_use_valid_source_atoms_without_precision_loss(delta):
    fixture = build_identity_fixture(values={("item:1", source): (10**18, 10**18 + delta)
                                             for source in ("market_a", "market_b", "market_c")})
    for leg in fixture.endpoint_set.legs:
        assert leg.start_cny_minor == 10**18
        assert leg.end_cny_minor == 10**18 + delta
        assert leg.change.numerator == delta
        assert leg.change.denominator == 10**18


