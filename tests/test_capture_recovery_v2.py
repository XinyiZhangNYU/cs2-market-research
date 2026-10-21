from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from cs2_research.canonical import sha256_hex
from cs2_research.ingestion.capture_v2 import (
    RAW_RETENTION_HOLD_MARKER,
    CaptureStatus,
    CaptureV2Conflict,
    NormalizationStatus,
    PersistenceRecoverableError,
    PersistenceResult,
    PersistenceStatus,
    RecoveryValidationError,
    capture_coverage,
    capture_to_slot,
    gc_expired_capture_v2_raw,
    normalize_captured_slot,
    persist_normalized_slot,
    scan_recovery_candidates,
)
from cs2_research.ingestion.errors import (
    EnvelopeValidationError,
    TransportDenied,
    TransportRequestFailed,
)
from cs2_research.ingestion.models import FixtureProvenance, RightsSnapshot
from cs2_research.ingestion.rights import RequestPlanner
from cs2_research.ingestion.transport import FixtureTransport
from cs2_research.ingestion.transport import FetchedEnvelope


T0 = datetime(2026, 8, 24, 1, 2, 3, tzinfo=timezone.utc)
PAYLOAD = b'{"rows":[{"value":1}]}\n'
AUTHORIZATION_SENTINEL = "never-write-this-authorization-reference"


class Clock:
    def __init__(self, start: datetime = T0) -> None:
        self.value = start

    def __call__(self) -> datetime:
        value = self.value
        self.value += timedelta(seconds=1)
        return value


def _plan(payload: bytes = PAYLOAD):
    provenance = FixtureProvenance(
        fixture_id="51000000-0000-0000-0000-000000000099",
        fixture_kind="SYNTHETIC_CONTRACT",
        contains_real_market_data=False,
        payload_sha256=sha256_hex(payload),
        frozen_fetched_at=T0,
    )
    return RequestPlanner().plan(
        execution_mode="FIXTURE",
        rights=RightsSnapshot(version_label="capture-v2-fixture"),
        network_allowed=False,
        fixture=provenance,
        source_code="synthetic_vendor",
        endpoint_code="full_market",
        endpoint_version="fixture-v1",
        planned_for=T0,
        item_key_kind="OTHER",
        item_keys=("alpha",),
        request_options={"page": "1"},
        retention_mode="SYNTHETIC_FIXTURE",
    )


def _transport(payload: bytes = PAYLOAD) -> FixtureTransport:
    plan = _plan(payload)
    assert plan.fixture is not None
    return FixtureTransport(payload, plan.fixture)


def _capture(tmp_path: Path, *, slot_id: str = "slot-001"):
    plan = _plan()
    result = capture_to_slot(
        root=tmp_path,
        run_id="synthetic-run",
        slot_id=slot_id,
        plan=plan,
        transport=_transport(),
        clock=Clock(),
    )
    return plan, result


def _normalizer(payload: bytes, *, capture_terminal):
    assert capture_terminal["capture_status"] == "CAPTURED"
    document = json.loads(payload.decode("utf-8"))
    return {
        "facts/rows.json": json.dumps(
            document, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")
    }


def test_capture_seals_plan_raw_manifest_and_terminal_before_persistence(
    tmp_path: Path,
) -> None:
    plan, outcome = _capture(tmp_path)
    assert outcome.status is CaptureStatus.CAPTURED
    assert outcome.response_count == 1
    slot = outcome.slot_dir
    terminal_bytes = (slot / "capture-terminal.json").read_bytes()
    terminal = json.loads(terminal_bytes)
    manifest_bytes = (slot / "raw-manifest.json").read_bytes()
    manifest = json.loads(manifest_bytes)
    raw = (slot / "raw" / "response-0001.bin").read_bytes()

    assert raw == PAYLOAD
    assert terminal["plan_hash"] == plan.request_canonical_hash
    assert terminal["raw_manifest_hash"] == sha256_hex(manifest_bytes)
    assert manifest["artifacts"][0]["sha256"] == sha256_hex(raw)
    assert outcome.terminal_hash == sha256_hex(terminal_bytes)
    assert not (slot / "normalized").exists()
    assert not (slot / "receipts").exists()


def test_plan_and_artifacts_never_persist_authorization_reference(tmp_path: Path) -> None:
    rights = RightsSnapshot(
        version_label="capture-v2-real-plan",
        acquisition="ALLOW",
        raw_storage="ALLOW",
        normalized_storage="ALLOW",
        internal_derivative_use="ALLOW",
        derived_storage="ALLOW",
        effective_from=T0 - timedelta(days=1),
    )
    plan = RequestPlanner().plan(
        execution_mode="SAMPLE",
        rights=rights,
        network_allowed=True,
        user_authorization_ref=AUTHORIZATION_SENTINEL,
        source_code="synthetic_vendor",
        endpoint_code="full_market",
        endpoint_version="sample-v1",
        planned_for=T0,
        item_key_kind="OTHER",
        item_keys=("alpha",),
        retention_mode="PERSISTED_RAW",
    )

    class InjectedNoNetworkTransport:
        def fetch(self, admitted_plan):
            assert admitted_plan is plan
            return FetchedEnvelope(
                request_plan_id=plan.request_plan_id,
                source_code=plan.source_code,
                endpoint_code=plan.endpoint_code,
                transport_kind="TEST_NO_NETWORK",
                status_code=200,
                headers=(),
                payload=PAYLOAD,
                payload_sha256=sha256_hex(PAYLOAD),
                fetched_at=T0,
                content_type="application/json",
                network_request_count=1,
                request_started_at=T0,
            )

    outcome = capture_to_slot(
        root=tmp_path,
        run_id="sample-run",
        slot_id="slot-001",
        plan=plan,
        transport=InjectedNoNetworkTransport(),
        clock=Clock(),
    )
    rendered = b"\n".join(
        path.read_bytes() for path in sorted(outcome.slot_dir.rglob("*")) if path.is_file()
    )
    assert AUTHORIZATION_SENTINEL.encode() not in rendered
    assert sha256_hex(AUTHORIZATION_SENTINEL.encode()).encode() in rendered


def test_database_outage_cannot_change_capture_terminal_and_recovery_succeeds(
    tmp_path: Path,
) -> None:
    _plan_value, capture = _capture(tmp_path)
    terminal_before = (capture.slot_dir / "capture-terminal.json").read_bytes()
    normalized = normalize_captured_slot(
        slot_dir=capture.slot_dir,
        parser_version="synthetic-parser-v1",
        normalizer=_normalizer,
        attempt_id="normalize-001",
        clock=Clock(T0 + timedelta(minutes=1)),
    )
    assert normalized.status is NormalizationStatus.SUCCEEDED

    class DatabaseDown:
        def persist(self, _bundle):
            raise PersistenceRecoverableError("synthetic database outage")

    failed = persist_normalized_slot(
        slot_dir=capture.slot_dir,
        normalization_attempt_id=normalized.attempt_id,
        writer=DatabaseDown(),
        repository_version="repository-v1",
        attempt_id="import-001",
        clock=Clock(T0 + timedelta(minutes=2)),
    )
    assert failed.status is PersistenceStatus.IMPORT_FAILED_RECOVERABLE
    assert (capture.slot_dir / "capture-terminal.json").read_bytes() == terminal_before
    candidates = scan_recovery_candidates(
        tmp_path, as_of=T0 + timedelta(hours=1)
    )
    assert len(candidates) == 1
    assert candidates[0].normalized_attempt_id == "normalize-001"
    assert candidates[0].persistence_status is PersistenceStatus.IMPORT_FAILED_RECOVERABLE

    @dataclass
    class DatabaseReady:
        calls: int = 0

        def persist(self, _bundle):
            self.calls += 1
            return PersistenceResult(
                dataset_id="dataset-synthetic-001",
                seal_id="seal-synthetic-001",
                schema_release="v0.4p-capture-recovery-contract",
                replayed=False,
            )

    ready = DatabaseReady()
    persisted = persist_normalized_slot(
        slot_dir=capture.slot_dir,
        normalization_attempt_id=normalized.attempt_id,
        writer=ready,
        repository_version="repository-v1",
        attempt_id="import-002",
        clock=Clock(T0 + timedelta(minutes=3)),
    )
    assert persisted.status is PersistenceStatus.PERSISTED
    assert ready.calls == 1
    assert scan_recovery_candidates(tmp_path, as_of=T0 + timedelta(hours=1)) == ()
    assert (capture.slot_dir / "capture-terminal.json").read_bytes() == terminal_before


def test_parser_failure_is_append_only_and_can_be_recovered(tmp_path: Path) -> None:
    _plan_value, capture = _capture(tmp_path)

    def failing(_payload: bytes, *, capture_terminal):
        assert capture_terminal["capture_status"] == "CAPTURED"
        raise ValueError("synthetic parser mismatch")

    first = normalize_captured_slot(
        slot_dir=capture.slot_dir,
        parser_version="parser-v1",
        normalizer=failing,
        attempt_id="normalize-failed",
        clock=Clock(T0 + timedelta(minutes=1)),
    )
    first_receipt = (
        capture.slot_dir / "receipts" / "normalize-normalize-failed.json"
    ).read_bytes()
    assert first.status is NormalizationStatus.FAILED_RECOVERABLE

    second = normalize_captured_slot(
        slot_dir=capture.slot_dir,
        parser_version="parser-v2",
        normalizer=_normalizer,
        attempt_id="normalize-recovered",
        clock=Clock(T0 + timedelta(minutes=2)),
    )
    assert second.status is NormalizationStatus.SUCCEEDED
    assert (
        capture.slot_dir / "receipts" / "normalize-normalize-failed.json"
    ).read_bytes() == first_receipt


def test_tampered_raw_is_rejected_before_normalizer_runs(tmp_path: Path) -> None:
    _plan_value, capture = _capture(tmp_path)
    raw_path = capture.slot_dir / "raw" / "response-0001.bin"
    raw_path.write_bytes(b"tampered")
    calls = 0

    def normalizer(_payload: bytes, *, capture_terminal):
        nonlocal calls
        calls += 1
        return {"facts/data.json": b"{}"}

    with pytest.raises(RecoveryValidationError, match="raw artifact bytes"):
        normalize_captured_slot(
            slot_dir=capture.slot_dir,
            parser_version="parser-v1",
            normalizer=normalizer,
            attempt_id="normalize-001",
            clock=Clock(),
        )
    assert calls == 0


def test_existing_slot_never_repeats_source_request(tmp_path: Path) -> None:
    plan, capture = _capture(tmp_path)

    class CountingTransport:
        calls = 0

        def fetch(self, _plan):
            self.calls += 1
            return _transport().fetch(plan)

    counter = CountingTransport()
    with pytest.raises(CaptureV2Conflict):
        capture_to_slot(
            root=tmp_path,
            run_id="synthetic-run",
            slot_id="slot-001",
            plan=plan,
            transport=counter,
            clock=Clock(T0 + timedelta(days=1)),
        )
    assert counter.calls == 0
    assert capture.status is CaptureStatus.CAPTURED


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (TransportDenied("denied"), CaptureStatus.DENIED_BEFORE_REQUEST),
        (
            TransportRequestFailed(
                "failed", context={"attempts": 2, "unsafe_url": "https://secret"}
            ),
            CaptureStatus.REQUEST_FAILED,
        ),
        (EnvelopeValidationError("reflected credential"), CaptureStatus.RESPONSE_REJECTED),
    ],
)
def test_capture_failures_leave_safe_terminal_without_raw(
    tmp_path: Path, error: Exception, expected: CaptureStatus
) -> None:
    class FailingTransport:
        def fetch(self, _plan):
            raise error

    outcome = capture_to_slot(
        root=tmp_path,
        run_id=f"failure-{expected.value.lower()}",
        slot_id="slot-001",
        plan=_plan(),
        transport=FailingTransport(),
        clock=Clock(),
    )
    terminal = json.loads((outcome.slot_dir / "capture-terminal.json").read_bytes())
    rendered = json.dumps(terminal, sort_keys=True)
    assert outcome.status is expected
    assert not (outcome.slot_dir / "raw").exists()
    assert "https://secret" not in rendered
    assert "unsafe_url" not in rendered


def test_coverage_reports_capture_normalization_and_import_independently(
    tmp_path: Path,
) -> None:
    _plan_value, first = _capture(tmp_path, slot_id="slot-001")
    _plan_value, second = _capture(tmp_path, slot_id="slot-002")
    normalized = normalize_captured_slot(
        slot_dir=first.slot_dir,
        parser_version="parser-v1",
        normalizer=_normalizer,
        attempt_id="normalize-001",
        clock=Clock(T0 + timedelta(minutes=1)),
    )

    class Ready:
        def persist(self, _bundle):
            return PersistenceResult("dataset-001", "seal-001", "v0.4p-test", False)

    persist_normalized_slot(
        slot_dir=first.slot_dir,
        normalization_attempt_id=normalized.attempt_id,
        writer=Ready(),
        repository_version="repository-v1",
        attempt_id="import-001",
        clock=Clock(T0 + timedelta(minutes=2)),
    )
    assert second.status is CaptureStatus.CAPTURED
    assert capture_coverage(tmp_path) == {
        "scheduled_slot_count": 2,
        "request_attempt_slot_count": 0,
        "captured_slot_count": 2,
        "normalized_slot_count": 1,
        "persisted_slot_count": 1,
    }


def _persist_for_raw_gc(capture) -> None:
    normalized = normalize_captured_slot(
        slot_dir=capture.slot_dir,
        parser_version="parser-v1",
        normalizer=_normalizer,
        attempt_id="normalize-gc",
        clock=Clock(T0 + timedelta(minutes=1)),
    )

    class Ready:
        def persist(self, _bundle):
            return PersistenceResult(
                "dataset-gc", "seal-gc", "v0.4p-test", False
            )

    persisted = persist_normalized_slot(
        slot_dir=capture.slot_dir,
        normalization_attempt_id=normalized.attempt_id,
        writer=Ready(),
        repository_version="repository-v1",
        attempt_id="import-gc",
        clock=Clock(T0 + timedelta(minutes=2)),
    )
    assert persisted.status is PersistenceStatus.PERSISTED


def test_raw_gc_is_dry_run_capable_append_only_and_idempotent(tmp_path: Path) -> None:
    _plan_value, capture = _capture(tmp_path)
    _persist_for_raw_gc(capture)
    slot = capture.slot_dir
    raw_path = slot / "raw" / "response-0001.bin"
    terminal_before = (slot / "capture-terminal.json").read_bytes()
    normalized_before = tuple(
        (path.relative_to(slot), path.read_bytes())
        for path in sorted((slot / "normalized").rglob("*"))
        if path.is_file()
    )

    before_expiry = gc_expired_capture_v2_raw(
        tmp_path, now=T0 + timedelta(days=6)
    )
    assert before_expiry.expired_slots == 0
    assert raw_path.is_file()

    dry_run = gc_expired_capture_v2_raw(
        tmp_path, now=T0 + timedelta(days=8), dry_run=True
    )
    assert dry_run.eligible_slots == 1
    assert dry_run.deleted_slots == 0
    assert raw_path.is_file()
    assert not (slot / "receipts" / "raw-delete.json").exists()

    deleted = gc_expired_capture_v2_raw(tmp_path, now=T0 + timedelta(days=8))
    assert deleted.deleted_slots == 1
    assert deleted.errors == ()
    assert not raw_path.exists()
    receipt = json.loads((slot / "receipts" / "raw-delete.json").read_bytes())
    assert receipt["receipt_type"] == "RAW_DELETION"
    assert receipt["status"] == "COMMITTED"
    assert receipt["dataset_id"] == "dataset-gc"
    assert receipt["seal_id"] == "seal-gc"
    assert (slot / "capture-terminal.json").read_bytes() == terminal_before
    assert tuple(
        (path.relative_to(slot), path.read_bytes())
        for path in sorted((slot / "normalized").rglob("*"))
        if path.is_file()
    ) == normalized_before

    replay = gc_expired_capture_v2_raw(tmp_path, now=T0 + timedelta(days=9))
    assert replay.already_deleted_slots == 1
    assert replay.deleted_slots == 0
    assert replay.errors == ()


def test_raw_gc_refuses_unpersisted_or_held_slots(tmp_path: Path) -> None:
    unpersisted_root = tmp_path / "unpersisted"
    _plan_value, unpersisted = _capture(unpersisted_root)
    normalize_captured_slot(
        slot_dir=unpersisted.slot_dir,
        parser_version="parser-v1",
        normalizer=_normalizer,
        attempt_id="normalize-only",
        clock=Clock(T0 + timedelta(minutes=1)),
    )
    refused = gc_expired_capture_v2_raw(
        unpersisted_root, now=T0 + timedelta(days=8)
    )
    assert refused.protected_slots == 1
    assert "requires a verified PERSISTED receipt" in refused.errors[0]
    assert (unpersisted.slot_dir / "raw" / "response-0001.bin").is_file()

    held_root = tmp_path / "held"
    _plan_value, held = _capture(held_root)
    _persist_for_raw_gc(held)
    (held.slot_dir / RAW_RETENTION_HOLD_MARKER).write_text("hold\n", encoding="utf-8")
    held_result = gc_expired_capture_v2_raw(
        held_root, now=T0 + timedelta(days=8)
    )
    assert held_result.protected_slots == 1
    assert RAW_RETENTION_HOLD_MARKER in held_result.errors[0]
    assert (held.slot_dir / "raw" / "response-0001.bin").is_file()
    (held.slot_dir / RAW_RETENTION_HOLD_MARKER).unlink()
    in_progress = held.slot_dir / "normalized" / ".attempt=active.tmp"
    in_progress.mkdir()
    active_result = gc_expired_capture_v2_raw(
        held_root, now=T0 + timedelta(days=8)
    )
    assert active_result.protected_slots == 1
    assert "in-progress temp file" in active_result.errors[0]
    assert (held.slot_dir / "raw" / "response-0001.bin").is_file()


def test_raw_gc_refuses_tampered_bytes(tmp_path: Path) -> None:
    _plan_value, capture = _capture(tmp_path)
    _persist_for_raw_gc(capture)
    raw_path = capture.slot_dir / "raw" / "response-0001.bin"
    raw_path.write_bytes(b"tampered")
    result = gc_expired_capture_v2_raw(tmp_path, now=T0 + timedelta(days=8))
    assert result.protected_slots == 1
    assert "no longer match" in result.errors[0]
    assert raw_path.read_bytes() == b"tampered"
    assert not (capture.slot_dir / "receipts" / "raw-delete.json").exists()


def test_raw_gc_ignores_non_captured_terminals(tmp_path: Path) -> None:
    class FailingTransport:
        def fetch(self, _plan):
            raise TransportRequestFailed("synthetic outage", context={"attempts": 1})

    failed = capture_to_slot(
        root=tmp_path,
        run_id="failed-run",
        slot_id="slot-001",
        plan=_plan(),
        transport=FailingTransport(),
        clock=Clock(),
    )
    assert failed.status is CaptureStatus.REQUEST_FAILED
    result = gc_expired_capture_v2_raw(tmp_path, now=T0 + timedelta(days=8))
    assert result.scanned_slots == 1
    assert result.expired_slots == 0
    assert result.protected_slots == 0
    assert result.errors == ()


def test_raw_gc_recovers_a_crash_after_atomic_staging(tmp_path: Path) -> None:
    _plan_value, capture = _capture(tmp_path)
    _persist_for_raw_gc(capture)
    slot = capture.slot_dir
    manifest = json.loads((slot / "raw-manifest.json").read_bytes())
    digest = manifest["artifacts"][0]["sha256"]
    raw_path = slot / "raw" / "response-0001.bin"
    staged_path = slot / ".gc" / f"response-0001.{digest}.pending-delete"
    staged_path.parent.mkdir()
    os.replace(raw_path, staged_path)

    result = gc_expired_capture_v2_raw(tmp_path, now=T0 + timedelta(days=8))
    assert result.deleted_slots == 1
    assert result.errors == ()
    assert not staged_path.exists()
    assert not raw_path.exists()
    assert (slot / "receipts" / "raw-delete.json").is_file()


def test_contract_schema_is_valid_json_and_declares_all_document_kinds() -> None:
    schema_path = Path(__file__).parents[1] / "schemas" / "capture-recovery-v2.schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    assert schema["$schema"].endswith("2020-12/schema")
    assert set(schema["$defs"]) >= {
        "plan",
        "raw_manifest",
        "capture_terminal",
        "normalization_receipt",
        "persistence_receipt",
        "raw_deletion_receipt",
    }
