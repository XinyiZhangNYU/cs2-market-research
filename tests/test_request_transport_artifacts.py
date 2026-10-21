from __future__ import annotations

import json
import os
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from cs2_research.canonical import sha256_hex
from cs2_research.ingestion.artifacts import ImmutableArtifactStore
from cs2_research.ingestion.errors import (
    ArtifactCommitError,
    ArtifactConflict,
    ArtifactValidationError,
    EnvelopeValidationError,
    PlanningDenied,
    TransportDenied,
)
from cs2_research.ingestion.models import FixtureProvenance, RightsSnapshot
from cs2_research.ingestion.rights import RequestPlanner
from cs2_research.ingestion.transport import FixtureTransport, NetworkDisabledTransport


NOW = datetime(2026, 8, 13, 1, 2, 3, tzinfo=timezone.utc)
PAYLOAD = b'{"synthetic":true}\n'


def _fixture(*, payload_hash: str | None = None) -> FixtureProvenance:
    return FixtureProvenance(
        fixture_id="51000000-0000-0000-0000-000000000001",
        fixture_kind="SYNTHETIC_CONTRACT",
        contains_real_market_data=False,
        payload_sha256=payload_hash or sha256_hex(PAYLOAD),
        frozen_fetched_at=NOW,
    )


def _fixture_plan():
    return RequestPlanner().plan(
        execution_mode="FIXTURE",
        rights=RightsSnapshot(version_label="unknown-fixture"),
        network_allowed=False,
        fixture=_fixture(),
        source_code="synthetic_vendor",
        endpoint_code="quotes",
        endpoint_version="contract-v1",
        planned_for=NOW,
        item_key_kind="OTHER",
        item_keys=("b", "a"),
        retention_mode="SYNTHETIC_FIXTURE",
    )


def test_request_planner_is_deterministic_and_binds_exact_item_manifest() -> None:
    first = _fixture_plan()
    second = _fixture_plan()
    assert first == second
    assert first.request_plan_id
    assert first.item_key_kind == "OTHER"
    assert first.item_keys == ("a", "b")
    assert first.item_manifest_hash == sha256_hex(b'["a","b"]\n')
    assert first.request_canonical_hash


def test_request_plan_hash_binds_complete_rights_snapshot() -> None:
    planner = RequestPlanner()
    rights = RightsSnapshot(
        version_label="same-label",
        internal_derivative_use="UNKNOWN",
        effective_from=NOW - timedelta(days=1),
        valid_to=NOW + timedelta(days=1),
    )
    base = dict(
        execution_mode="FIXTURE",
        network_allowed=False,
        fixture=_fixture(),
        source_code="synthetic_vendor",
        endpoint_code="quotes",
        endpoint_version="contract-v1",
        planned_for=NOW,
    )
    first = planner.plan(rights=rights, **base)
    changed = planner.plan(
        rights=replace(rights, internal_derivative_use="ALLOW"), **base
    )
    assert first.request_canonical_hash != changed.request_canonical_hash
    assert first.request_plan_id != changed.request_plan_id

    with pytest.raises(PlanningDenied, match="invalid permission state"):
        planner.plan(
            rights=replace(rights, derived_storage="MAYBE"),  # type: ignore[arg-type]
            **base,
        )
    with pytest.raises(PlanningDenied, match="valid_to must be later"):
        planner.plan(
            rights=replace(
                rights,
                effective_from=NOW + timedelta(days=1),
                valid_to=NOW,
            ),
            **base,
        )


def test_request_planner_checks_backfill_and_storage_rights_independently() -> None:
    planner = RequestPlanner()
    base = dict(
        execution_mode="BACKFILL",
        network_allowed=True,
        user_authorization_ref="approval-20260813-sample-only",
        source_code="synthetic_vendor",
        endpoint_code="history",
        endpoint_version="v1",
        planned_for=NOW,
        item_key_kind="OTHER",
        item_keys=("x",),
        retention_mode="PERSISTED_RAW",
    )
    with pytest.raises(PlanningDenied, match="historical backfill") as missing_history:
        planner.plan(
            rights=RightsSnapshot(
                version_label="no-history",
                acquisition="ALLOW",
                systematic_collection="ALLOW",
                normalized_storage="ALLOW",
                raw_storage="ALLOW",
            ),
            **base,
        )
    assert missing_history.value.code == "RIGHTS_DENIED"

    with pytest.raises(PlanningDenied, match="raw storage"):
        planner.plan(
            rights=RightsSnapshot(
                version_label="no-raw",
                acquisition="ALLOW",
                systematic_collection="ALLOW",
                historical_backfill="ALLOW",
                normalized_storage="ALLOW",
            ),
            **base,
        )

    plan = planner.plan(
        rights=RightsSnapshot(
            version_label="all-required",
            acquisition="ALLOW",
            systematic_collection="ALLOW",
            historical_backfill="ALLOW",
            normalized_storage="ALLOW",
            raw_storage="ALLOW",
        ),
        **base,
    )
    assert plan.retention_mode == "PERSISTED_RAW"


def test_real_request_requires_explicit_planned_time() -> None:
    with pytest.raises(PlanningDenied, match="explicit planned_for"):
        RequestPlanner().plan(
            execution_mode="SAMPLE",
            rights=RightsSnapshot(
                version_label="sample-allowed",
                acquisition="ALLOW",
                normalized_storage="ALLOW",
            ),
            network_allowed=True,
            user_authorization_ref="approval-synthetic-test",
            source_code="synthetic_vendor",
            endpoint_code="quotes",
            endpoint_version="v1",
        )


def test_request_plan_rejects_ambiguous_item_keys_and_retention() -> None:
    planner = RequestPlanner()
    with pytest.raises(PlanningDenied, match="item keys"):
        planner.plan(
            execution_mode="FIXTURE",
            rights=RightsSnapshot(version_label="fixture-unknown"),
            network_allowed=False,
            fixture=_fixture(),
            source_code="synthetic_vendor",
            endpoint_code="quotes",
            endpoint_version="v1",
            planned_for=NOW,
            item_keys=(1,),  # type: ignore[arg-type]
        )
    with pytest.raises(PlanningDenied, match="supported real-data retention"):
        planner.plan(
            execution_mode="SAMPLE",
            rights=RightsSnapshot(
                version_label="sample-allowed",
                acquisition="ALLOW",
                normalized_storage="ALLOW",
            ),
            network_allowed=True,
            user_authorization_ref="approval-synthetic-test",
            source_code="synthetic_vendor",
            endpoint_code="quotes",
            endpoint_version="v1",
            planned_for=NOW,
            retention_mode="UNKNOWN_MODE",  # type: ignore[arg-type]
        )


def test_fixture_transport_returns_exact_bytes_and_zero_network() -> None:
    envelope = FixtureTransport(PAYLOAD, _fixture()).fetch(_fixture_plan())
    assert envelope.payload is PAYLOAD
    assert envelope.payload_sha256 == sha256_hex(PAYLOAD)
    assert envelope.fetched_at == NOW
    assert envelope.network_request_count == 0
    assert envelope.transport_kind == "FIXTURE"


def test_fixture_and_disabled_transports_fail_closed() -> None:
    with pytest.raises(EnvelopeValidationError, match="frozen provenance"):
        FixtureTransport(PAYLOAD, _fixture(payload_hash="0" * 64)).fetch(
            RequestPlanner().plan(
                execution_mode="FIXTURE",
                rights=RightsSnapshot(version_label="unknown-fixture"),
                network_allowed=False,
                fixture=_fixture(payload_hash="0" * 64),
                source_code="synthetic_vendor",
                endpoint_code="quotes",
                endpoint_version="contract-v1",
                planned_for=NOW,
            )
        )
    with pytest.raises(TransportDenied) as disabled:
        NetworkDisabledTransport().fetch(_fixture_plan())
    assert disabled.value.code == "TRANSPORT_DENIED"


def test_fixture_transport_requires_exact_frozen_provenance() -> None:
    changed_time = replace(_fixture(), frozen_fetched_at=NOW + timedelta(seconds=1))
    with pytest.raises(TransportDenied, match="provenance"):
        FixtureTransport(PAYLOAD, changed_time).fetch(_fixture_plan())


def _stage(root: Path, name: str, payload: bytes = b"alpha\n") -> Path:
    stage = root / name
    (stage / "normalized").mkdir(parents=True)
    (stage / "normalized" / "quotes.jsonl").write_bytes(payload)
    return stage


def test_artifact_store_is_atomic_idempotent_and_manifested(tmp_path: Path) -> None:
    store = ImmutableArtifactStore(tmp_path)
    first = store.publish_directory(
        stage=_stage(tmp_path, ".stage-first"),
        bundle_name="run=synthetic-1",
        metadata={"usage_scope": "TEST_ONLY"},
    )
    manifest = json.loads(
        (first.bundle_dir / "manifests" / "artifact-store.json").read_text(
            encoding="utf-8"
        )
    )
    assert first.reused_existing is False
    assert manifest["artifact_count"] == 1
    assert manifest["metadata"] == {"usage_scope": "TEST_ONLY"}

    second = store.publish_directory(
        stage=_stage(tmp_path, ".stage-second"),
        bundle_name="run=synthetic-1",
        metadata={"usage_scope": "TEST_ONLY"},
    )
    assert second.reused_existing is True
    assert second.manifest_sha256 == first.manifest_sha256


def test_artifact_store_conflict_preserves_target_and_cleans_stage(tmp_path: Path) -> None:
    store = ImmutableArtifactStore(tmp_path)
    first = store.publish_directory(
        stage=_stage(tmp_path, ".stage-first"),
        bundle_name="run=synthetic-1",
        metadata={},
    )
    stage = _stage(tmp_path, ".stage-conflict", b"different\n")
    with pytest.raises(ArtifactConflict) as conflict:
        store.publish_directory(stage=stage, bundle_name="run=synthetic-1", metadata={})
    assert conflict.value.code == "ARTIFACT_CONFLICT"
    assert not stage.exists()
    assert (first.bundle_dir / "normalized" / "quotes.jsonl").read_bytes() == b"alpha\n"


def test_artifact_store_rolls_back_if_final_rename_fails(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    stage = _stage(tmp_path, ".stage-failure")

    def fail_replace(_source: os.PathLike[str], _target: os.PathLike[str]) -> None:
        raise PermissionError("synthetic rename denial")

    monkeypatch.setattr("cs2_research.ingestion.artifacts.os.replace", fail_replace)
    with pytest.raises(ArtifactCommitError) as failed:
        ImmutableArtifactStore(tmp_path).publish_directory(
            stage=stage,
            bundle_name="run=synthetic-failed",
            metadata={},
        )
    assert failed.value.code == "ARTIFACT_COMMIT_FAILED"
    assert not stage.exists()
    assert not (tmp_path / "run=synthetic-failed").exists()


def test_artifact_store_retries_transient_windows_rename_denial(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    stage = _stage(tmp_path, ".stage-transient")
    real_replace = os.replace
    attempts = 0

    def transient_replace(source: os.PathLike[str], target: os.PathLike[str]) -> None:
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise PermissionError("synthetic transient rename denial")
        real_replace(source, target)

    monkeypatch.setattr("cs2_research.ingestion.artifacts.os.replace", transient_replace)
    receipt = ImmutableArtifactStore(tmp_path).publish_directory(
        stage=stage,
        bundle_name="run=synthetic-transient",
        metadata={},
    )
    assert attempts == 3
    assert receipt.bundle_dir.is_dir()


def test_artifact_store_rolls_back_noncanonical_manifest_metadata(tmp_path: Path) -> None:
    stage = _stage(tmp_path, ".stage-invalid-metadata")
    with pytest.raises(ArtifactValidationError) as invalid:
        ImmutableArtifactStore(tmp_path).publish_directory(
            stage=stage,
            bundle_name="run=synthetic-invalid",
            metadata={"forbidden_float": 1.5},
        )
    assert invalid.value.code == "ARTIFACT_INVALID"
    assert not stage.exists()
    assert not (tmp_path / "run=synthetic-invalid").exists()


def test_artifact_store_rejects_reserved_manifest_from_stage(tmp_path: Path) -> None:
    stage = _stage(tmp_path, ".stage-reserved")
    reserved = stage / "manifests" / "artifact-store.json"
    reserved.parent.mkdir(parents=True)
    reserved.write_text("caller supplied\n", encoding="utf-8")
    with pytest.raises(ArtifactValidationError, match="reserved"):
        ImmutableArtifactStore(tmp_path).publish_directory(
            stage=stage,
            bundle_name="run=synthetic-reserved",
            metadata={},
        )
    assert not stage.exists()
