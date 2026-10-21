"""Provider-neutral capture, normalization and recoverable persistence V2.

The module intentionally has no provider HTTP implementation and no PostgreSQL
dependency.  It consumes the existing admitted ``RequestPlan``/``Transport``
boundary, seals irreplaceable response bytes first, and delegates normalization
and persistence to injected workers.  A database outage can therefore produce
an append-only import receipt without changing the immutable capture terminal.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import StrEnum
from pathlib import Path, PurePosixPath
from typing import Any, Callable, Mapping, Protocol

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text

from .errors import (
    CredentialUnavailable,
    EnvelopeValidationError,
    IngestionError,
    PlanningDenied,
    TransportDenied,
    TransportRequestFailed,
)
from .models import RequestPlan
from .rights import rights_snapshot_document, verify_plan_integrity
from .transport import FetchedEnvelope, Transport


CAPTURE_CONTRACT_VERSION = "capture-recovery-v2/1"
RAW_DELETION_RECEIPT_VERSION = "capture-raw-deletion-v1"
RAW_RETENTION_HOLD_MARKER = ".raw-retention-hold"
RECOVERY_IN_PROGRESS_MARKER = ".recovery-in-progress"
_SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._=-]{0,127}$")
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_SAFE_CONTEXT_KEYS = frozenset(
    {
        "attempts",
        "credential_name",
        "endpoint_code",
        "failure_type",
        "request_plan_id",
    }
)


class CaptureStatus(StrEnum):
    NOT_ATTEMPTED = "NOT_ATTEMPTED"
    DENIED_BEFORE_REQUEST = "DENIED_BEFORE_REQUEST"
    REQUEST_FAILED = "REQUEST_FAILED"
    RESPONSE_REJECTED = "RESPONSE_REJECTED"
    CAPTURED = "CAPTURED"


class NormalizationStatus(StrEnum):
    NOT_STARTED = "NOT_STARTED"
    SUCCEEDED = "SUCCEEDED"
    FAILED_RECOVERABLE = "FAILED_RECOVERABLE"
    FAILED_TERMINAL = "FAILED_TERMINAL"


class PersistenceStatus(StrEnum):
    NOT_REQUESTED = "NOT_REQUESTED"
    PENDING_IMPORT = "PENDING_IMPORT"
    IMPORTING = "IMPORTING"
    PERSISTED = "PERSISTED"
    IMPORT_FAILED_RECOVERABLE = "IMPORT_FAILED_RECOVERABLE"
    IMPORT_FAILED_TERMINAL = "IMPORT_FAILED_TERMINAL"


class CaptureV2Error(RuntimeError):
    """Base class for the stable V2 filesystem boundary."""


class CaptureV2Conflict(CaptureV2Error):
    """An immutable identity already points at different bytes."""


class RecoveryValidationError(CaptureV2Error):
    """A sealed input no longer matches its recorded hash or shape."""


class PersistenceRecoverableError(CaptureV2Error):
    """The target persistence service can be retried without new source I/O."""


class PersistenceTerminalError(CaptureV2Error):
    """The normalized content cannot be persisted without human correction."""


class NormalizationTerminalError(CaptureV2Error):
    """The captured bytes cannot be normalized without human correction."""


@dataclass(frozen=True, slots=True)
class CaptureOutcome:
    slot_dir: Path
    status: CaptureStatus
    terminal_hash: str
    raw_manifest_hash: str | None
    response_count: int


@dataclass(frozen=True, slots=True)
class NormalizationOutcome:
    slot_dir: Path
    attempt_id: str
    status: NormalizationStatus
    receipt_hash: str
    output_manifest_hash: str | None


@dataclass(frozen=True, slots=True)
class PersistenceResult:
    dataset_id: str
    seal_id: str
    schema_release: str
    replayed: bool


@dataclass(frozen=True, slots=True)
class PersistenceOutcome:
    slot_dir: Path
    attempt_id: str
    status: PersistenceStatus
    receipt_hash: str
    dataset_id: str | None
    seal_id: str | None


@dataclass(frozen=True, slots=True)
class NormalizedBundle:
    slot_dir: Path
    attempt_id: str
    directory: Path
    manifest: Mapping[str, Any]
    manifest_hash: str
    capture_terminal_hash: str


@dataclass(frozen=True, slots=True)
class RecoveryCandidate:
    slot_dir: Path
    capture_status: CaptureStatus
    normalization_status: NormalizationStatus
    persistence_status: PersistenceStatus
    raw_delete_after: datetime | None
    raw_available: bool
    normalized_attempt_id: str | None


@dataclass(frozen=True, slots=True)
class RawGcResult:
    scanned_slots: int
    expired_slots: int
    eligible_slots: int
    deleted_slots: int
    already_deleted_slots: int
    protected_slots: int
    dry_run: bool
    errors: tuple[str, ...]


class Normalizer(Protocol):
    def __call__(
        self, payload: bytes, *, capture_terminal: Mapping[str, Any]
    ) -> Mapping[str, bytes]: ...


class PersistenceWriter(Protocol):
    def persist(self, bundle: NormalizedBundle) -> PersistenceResult: ...


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _require_utc(value: datetime, field: str) -> datetime:
    if value.tzinfo is None or value.utcoffset() != timedelta(0):
        raise ValueError(f"{field} must use UTC")
    return value.astimezone(timezone.utc)


def _safe_id(value: str, field: str) -> str:
    if not isinstance(value, str) or not _SAFE_ID.fullmatch(value):
        raise ValueError(f"{field} has an invalid format")
    return value


def _slot_directory(root: Path, run_id: str, slot_id: str) -> Path:
    _safe_id(run_id, "run_id")
    _safe_id(slot_id, "slot_id")
    resolved_root = root.resolve()
    if root.exists() and root.is_symlink():
        raise CaptureV2Error("capture root cannot be a symlink")
    slot = resolved_root / f"run={run_id}" / f"slot={slot_id}"
    if slot.exists() and slot.is_symlink():
        raise CaptureV2Error("capture slot cannot be a symlink")
    return slot


def _strict_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        raise RecoveryValidationError(f"{path.name} is unreadable") from None
    if not isinstance(value, dict):
        raise RecoveryValidationError(f"{path.name} must contain an object")
    return value


def _write_once(path: Path, payload: bytes) -> str:
    """Atomically create a file without ever replacing an existing target."""

    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    try:
        with temporary.open("xb") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        try:
            os.link(temporary, path)
        except FileExistsError:
            existing = path.read_bytes()
            if existing != payload:
                raise CaptureV2Conflict(
                    f"immutable file exists with different bytes: {path.name}"
                ) from None
        finally:
            temporary.unlink(missing_ok=True)
    except Exception:
        temporary.unlink(missing_ok=True)
        raise
    return sha256_hex(payload)


def _safe_context(error: BaseException) -> dict[str, Any]:
    context: dict[str, Any] = {"exception_type": type(error).__name__}
    if isinstance(error, IngestionError):
        for key, value in error.context.items():
            if key not in _SAFE_CONTEXT_KEYS:
                continue
            if isinstance(value, (bool, int)) or value is None:
                context[key] = value
            elif isinstance(value, str) and len(value) <= 128 and "://" not in value:
                context[key] = value
    return context


def _diagnostic(error: BaseException) -> str:
    if isinstance(error, CredentialUnavailable):
        return "CREDENTIAL_UNAVAILABLE"
    if isinstance(error, PlanningDenied):
        return "RIGHTS_OR_PLAN_DENIED"
    if isinstance(error, TransportDenied):
        return "TRANSPORT_DENIED"
    if isinstance(error, TransportRequestFailed):
        return "TRANSPORT_REQUEST_FAILED"
    if isinstance(error, EnvelopeValidationError):
        return "RESPONSE_ENVELOPE_REJECTED"
    return type(error).__name__.upper()[:64]


def _plan_document(
    plan: RequestPlan,
    *,
    run_id: str,
    slot_id: str,
    created_at: datetime,
) -> dict[str, Any]:
    authorization_hash = (
        None
        if plan.user_authorization_ref is None
        else sha256_hex(plan.user_authorization_ref.encode("utf-8"))
    )
    return {
        "authorization_ref_sha256": authorization_hash,
        "contract_version": CAPTURE_CONTRACT_VERSION,
        "created_at": utc_timestamp_text(created_at),
        "endpoint_code": plan.endpoint_code,
        "endpoint_version": plan.endpoint_version,
        "execution_mode": plan.execution_mode,
        "item_key_kind": plan.item_key_kind,
        "item_keys": list(plan.item_keys),
        "item_manifest_hash": plan.item_manifest_hash,
        "planned_for": utc_timestamp_text(plan.planned_for),
        "request_canonical_hash": plan.request_canonical_hash,
        "request_options": [list(pair) for pair in plan.request_options],
        "request_options_hash": plan.request_options_hash,
        "request_plan_id": plan.request_plan_id,
        "retention_mode": plan.retention_mode,
        "rights_snapshot": rights_snapshot_document(plan.rights_snapshot),
        "rights_version_label": plan.rights_version_label,
        "run_id": run_id,
        "slot_id": slot_id,
        "source_code": plan.source_code,
    }


def _terminal_document(
    *,
    run_id: str,
    slot_id: str,
    plan: RequestPlan,
    plan_document_hash: str,
    status: CaptureStatus,
    started_at: datetime,
    finished_at: datetime,
    request_attempt_count: int,
    response_count: int,
    raw_manifest_hash: str | None,
    raw_delete_after: datetime | None,
    diagnostic_code: str | None,
    safe_context: Mapping[str, Any],
) -> dict[str, Any]:
    return {
        "capture_status": status.value,
        "contract_version": CAPTURE_CONTRACT_VERSION,
        "diagnostic_code": diagnostic_code,
        "finished_at": utc_timestamp_text(finished_at),
        "plan_document_hash": plan_document_hash,
        "plan_hash": plan.request_canonical_hash,
        "raw_delete_after": (
            None if raw_delete_after is None else utc_timestamp_text(raw_delete_after)
        ),
        "raw_manifest_hash": raw_manifest_hash,
        "request_attempt_count": request_attempt_count,
        "request_plan_id": plan.request_plan_id,
        "response_count": response_count,
        "run_id": run_id,
        "safe_context": dict(safe_context),
        "slot_id": slot_id,
        "started_at": utc_timestamp_text(started_at),
    }


def capture_to_slot(
    *,
    root: Path,
    run_id: str,
    slot_id: str,
    plan: RequestPlan,
    transport: Transport,
    raw_ttl_days: int = 7,
    clock: Callable[[], datetime] = _utc_now,
) -> CaptureOutcome:
    """Seal one admitted response before any normalization or database work."""

    if isinstance(raw_ttl_days, bool) or not 1 <= raw_ttl_days <= 365:
        raise ValueError("raw_ttl_days must be between 1 and 365")
    verify_plan_integrity(plan)
    slot = _slot_directory(root, run_id, slot_id)
    slot.mkdir(parents=True, exist_ok=True)
    started_at = _require_utc(clock(), "started_at")
    plan_bytes = canonical_json_bytes(
        _plan_document(
            plan,
            run_id=run_id,
            slot_id=slot_id,
            created_at=started_at,
        )
    )
    plan_hash = _write_once(slot / "plan.json", plan_bytes)
    terminal_path = slot / "capture-terminal.json"
    if terminal_path.exists():
        raise CaptureV2Conflict("capture terminal already exists; source request is not repeated")

    try:
        envelope = transport.fetch(plan)
    except (CredentialUnavailable, PlanningDenied, TransportDenied) as error:
        status = CaptureStatus.DENIED_BEFORE_REQUEST
        finished_at = _require_utc(clock(), "finished_at")
        terminal = _terminal_document(
            run_id=run_id,
            slot_id=slot_id,
            plan=plan,
            plan_document_hash=plan_hash,
            status=status,
            started_at=started_at,
            finished_at=finished_at,
            request_attempt_count=0,
            response_count=0,
            raw_manifest_hash=None,
            raw_delete_after=None,
            diagnostic_code=_diagnostic(error),
            safe_context=_safe_context(error),
        )
        terminal_hash = _write_once(terminal_path, canonical_json_bytes(terminal))
        return CaptureOutcome(slot, status, terminal_hash, None, 0)
    except EnvelopeValidationError as error:
        status = CaptureStatus.RESPONSE_REJECTED
        finished_at = _require_utc(clock(), "finished_at")
        terminal = _terminal_document(
            run_id=run_id,
            slot_id=slot_id,
            plan=plan,
            plan_document_hash=plan_hash,
            status=status,
            started_at=started_at,
            finished_at=finished_at,
            request_attempt_count=1,
            response_count=0,
            raw_manifest_hash=None,
            raw_delete_after=None,
            diagnostic_code=_diagnostic(error),
            safe_context=_safe_context(error),
        )
        terminal_hash = _write_once(terminal_path, canonical_json_bytes(terminal))
        return CaptureOutcome(slot, status, terminal_hash, None, 0)
    except Exception as error:
        status = CaptureStatus.REQUEST_FAILED
        finished_at = _require_utc(clock(), "finished_at")
        terminal = _terminal_document(
            run_id=run_id,
            slot_id=slot_id,
            plan=plan,
            plan_document_hash=plan_hash,
            status=status,
            started_at=started_at,
            finished_at=finished_at,
            request_attempt_count=(
                int(error.context.get("attempts", 1))
                if isinstance(error, IngestionError)
                else 1
            ),
            response_count=0,
            raw_manifest_hash=None,
            raw_delete_after=None,
            diagnostic_code=_diagnostic(error),
            safe_context=_safe_context(error),
        )
        terminal_hash = _write_once(terminal_path, canonical_json_bytes(terminal))
        return CaptureOutcome(slot, status, terminal_hash, None, 0)

    if envelope.request_plan_id != plan.request_plan_id:
        raise RecoveryValidationError("transport envelope does not bind the request plan")
    raw_path = slot / "raw" / "response-0001.bin"
    _write_once(raw_path, envelope.payload)
    raw_delete_after = envelope.fetched_at + timedelta(days=raw_ttl_days)
    raw_manifest = {
        "artifacts": [
            {
                "byte_count": len(envelope.payload),
                "content_type": envelope.content_type,
                "fetched_at": utc_timestamp_text(envelope.fetched_at),
                "path": "raw/response-0001.bin",
                "response_ordinal": 1,
                "sha256": envelope.payload_sha256,
            }
        ],
        "contract_version": CAPTURE_CONTRACT_VERSION,
        "endpoint_code": envelope.endpoint_code,
        "http_status_code": envelope.status_code,
        "network_request_count": envelope.network_request_count,
        "plan_hash": plan.request_canonical_hash,
        "request_plan_id": plan.request_plan_id,
        "response_headers_allowlisted": [list(pair) for pair in envelope.headers],
        "run_id": run_id,
        "slot_id": slot_id,
        "source_code": envelope.source_code,
        "transport_kind": envelope.transport_kind,
    }
    raw_manifest_hash = _write_once(
        slot / "raw-manifest.json", canonical_json_bytes(raw_manifest)
    )
    status = (
        CaptureStatus.CAPTURED
        if 200 <= envelope.status_code < 300
        else CaptureStatus.RESPONSE_REJECTED
    )
    finished_at = _require_utc(clock(), "finished_at")
    terminal = _terminal_document(
        run_id=run_id,
        slot_id=slot_id,
        plan=plan,
        plan_document_hash=plan_hash,
        status=status,
        started_at=started_at,
        finished_at=finished_at,
        request_attempt_count=envelope.network_request_count,
        response_count=1,
        raw_manifest_hash=raw_manifest_hash,
        raw_delete_after=raw_delete_after,
        diagnostic_code=(None if status is CaptureStatus.CAPTURED else "HTTP_RESPONSE_REJECTED"),
        safe_context={},
    )
    terminal_hash = _write_once(terminal_path, canonical_json_bytes(terminal))
    return CaptureOutcome(slot, status, terminal_hash, raw_manifest_hash, 1)


def _verified_capture(slot: Path) -> tuple[dict[str, Any], bytes, str]:
    terminal_path = slot / "capture-terminal.json"
    terminal_bytes = terminal_path.read_bytes()
    terminal = _strict_json(terminal_path)
    if terminal.get("contract_version") != CAPTURE_CONTRACT_VERSION:
        raise RecoveryValidationError("capture terminal contract is unsupported")
    if terminal.get("capture_status") != CaptureStatus.CAPTURED.value:
        raise RecoveryValidationError("only CAPTURED slots can be normalized")
    plan_path = slot / "plan.json"
    plan_bytes = plan_path.read_bytes()
    if terminal.get("plan_document_hash") != sha256_hex(plan_bytes):
        raise RecoveryValidationError("plan bytes no longer match the capture terminal")
    raw_manifest_path = slot / "raw-manifest.json"
    raw_manifest_bytes = raw_manifest_path.read_bytes()
    if terminal.get("raw_manifest_hash") != sha256_hex(raw_manifest_bytes):
        raise RecoveryValidationError("raw manifest no longer matches the capture terminal")
    raw_manifest = _strict_json(raw_manifest_path)
    artifacts = raw_manifest.get("artifacts")
    if not isinstance(artifacts, list) or len(artifacts) != 1:
        raise RecoveryValidationError("V2/1 requires exactly one response artifact")
    artifact = artifacts[0]
    if not isinstance(artifact, dict) or artifact.get("path") != "raw/response-0001.bin":
        raise RecoveryValidationError("raw artifact path is invalid")
    raw_path = slot / "raw" / "response-0001.bin"
    payload = raw_path.read_bytes()
    if artifact.get("sha256") != sha256_hex(payload) or artifact.get("byte_count") != len(payload):
        raise RecoveryValidationError("raw artifact bytes do not match their manifest")
    return terminal, payload, sha256_hex(terminal_bytes)


def verify_captured_slot(slot_dir: Path) -> tuple[dict[str, Any], str]:
    """Verify sealed raw capture evidence without normalizing or persisting it."""
    terminal, _payload, terminal_hash = _verified_capture(slot_dir)
    return terminal, terminal_hash


def _artifact_relative_path(value: str) -> PurePosixPath:
    if not isinstance(value, str) or not value or "\\" in value:
        raise RecoveryValidationError("normalized artifact path is invalid")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise RecoveryValidationError("normalized artifact path is invalid")
    if value == "manifest.json":
        raise RecoveryValidationError("normalizer cannot provide the reserved manifest")
    return path


def _attempt_id(value: str | None) -> str:
    return _safe_id(value or f"attempt-{uuid.uuid4().hex}", "attempt_id")


def _receipt_path(slot: Path, kind: str, attempt_id: str) -> Path:
    return slot / "receipts" / f"{kind}-{attempt_id}.json"


def normalize_captured_slot(
    *,
    slot_dir: Path,
    parser_version: str,
    normalizer: Normalizer,
    attempt_id: str | None = None,
    clock: Callable[[], datetime] = _utc_now,
) -> NormalizationOutcome:
    parser_version = _safe_id(parser_version, "parser_version")
    attempt_id = _attempt_id(attempt_id)
    terminal, payload, terminal_hash = _verified_capture(slot_dir)
    started_at = _require_utc(clock(), "started_at")
    receipt_path = _receipt_path(slot_dir, "normalize", attempt_id)
    if receipt_path.exists():
        raise CaptureV2Conflict("normalization attempt already exists")
    stage = slot_dir / "normalized" / f".attempt={attempt_id}.{uuid.uuid4().hex}.tmp"
    target = slot_dir / "normalized" / f"attempt={attempt_id}"
    output_manifest_hash: str | None = None
    status = NormalizationStatus.FAILED_RECOVERABLE
    diagnostic_code: str | None = None
    safe_context: dict[str, Any] = {}
    try:
        outputs = normalizer(payload, capture_terminal=terminal)
        if not isinstance(outputs, Mapping) or not outputs:
            raise RecoveryValidationError("normalizer must return at least one artifact")
        stage.mkdir(parents=True, exist_ok=False)
        descriptors: list[dict[str, Any]] = []
        for name, content in sorted(outputs.items()):
            relative = _artifact_relative_path(name)
            if not isinstance(content, bytes):
                raise RecoveryValidationError("normalized artifact content must be bytes")
            destination = stage.joinpath(*relative.parts)
            _write_once(destination, content)
            descriptors.append(
                {
                    "byte_count": len(content),
                    "path": relative.as_posix(),
                    "sha256": sha256_hex(content),
                }
            )
        manifest = {
            "artifacts": descriptors,
            "attempt_id": attempt_id,
            "capture_terminal_hash": terminal_hash,
            "contract_version": CAPTURE_CONTRACT_VERSION,
            "parser_version": parser_version,
        }
        output_manifest_hash = _write_once(
            stage / "manifest.json", canonical_json_bytes(manifest)
        )
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            raise CaptureV2Conflict("normalized attempt directory already exists")
        os.rename(stage, target)
        status = NormalizationStatus.SUCCEEDED
    except NormalizationTerminalError as error:
        status = NormalizationStatus.FAILED_TERMINAL
        diagnostic_code = type(error).__name__.upper()
        safe_context = _safe_context(error)
    except Exception as error:
        diagnostic_code = type(error).__name__.upper()
        safe_context = _safe_context(error)
    finally:
        if stage.exists():
            shutil.rmtree(stage)
    finished_at = _require_utc(clock(), "finished_at")
    receipt = {
        "attempt_id": attempt_id,
        "capture_terminal_hash": terminal_hash,
        "contract_version": CAPTURE_CONTRACT_VERSION,
        "diagnostic_code": diagnostic_code,
        "finished_at": utc_timestamp_text(finished_at),
        "input_raw_manifest_hash": terminal["raw_manifest_hash"],
        "normalization_status": status.value,
        "output_manifest_hash": output_manifest_hash,
        "parser_version": parser_version,
        "receipt_type": "NORMALIZATION",
        "safe_context": safe_context,
        "started_at": utc_timestamp_text(started_at),
    }
    receipt_hash = _write_once(receipt_path, canonical_json_bytes(receipt))
    return NormalizationOutcome(
        slot_dir, attempt_id, status, receipt_hash, output_manifest_hash
    )


def load_normalized_bundle(slot_dir: Path, attempt_id: str) -> NormalizedBundle:
    attempt_id = _safe_id(attempt_id, "attempt_id")
    receipt_path = _receipt_path(slot_dir, "normalize", attempt_id)
    receipt_bytes = receipt_path.read_bytes()
    receipt = _strict_json(receipt_path)
    if receipt.get("normalization_status") != NormalizationStatus.SUCCEEDED.value:
        raise RecoveryValidationError("normalization attempt did not succeed")
    directory = slot_dir / "normalized" / f"attempt={attempt_id}"
    manifest_path = directory / "manifest.json"
    manifest_bytes = manifest_path.read_bytes()
    if receipt.get("output_manifest_hash") != sha256_hex(manifest_bytes):
        raise RecoveryValidationError("normalized manifest does not match its receipt")
    manifest = _strict_json(manifest_path)
    for artifact in manifest.get("artifacts", []):
        if not isinstance(artifact, dict):
            raise RecoveryValidationError("normalized manifest artifact is invalid")
        relative = _artifact_relative_path(str(artifact.get("path", "")))
        payload = directory.joinpath(*relative.parts).read_bytes()
        if artifact.get("sha256") != sha256_hex(payload) or artifact.get("byte_count") != len(payload):
            raise RecoveryValidationError("normalized artifact bytes do not match")
    terminal_hash = receipt.get("capture_terminal_hash")
    if not isinstance(terminal_hash, str) or not _SHA256.fullmatch(terminal_hash):
        raise RecoveryValidationError("normalization receipt terminal hash is invalid")
    if sha256_hex((slot_dir / "capture-terminal.json").read_bytes()) != terminal_hash:
        raise RecoveryValidationError("normalization receipt references another terminal")
    return NormalizedBundle(
        slot_dir=slot_dir,
        attempt_id=attempt_id,
        directory=directory,
        manifest=manifest,
        manifest_hash=sha256_hex(manifest_bytes),
        capture_terminal_hash=terminal_hash,
    )


def persist_normalized_slot(
    *,
    slot_dir: Path,
    normalization_attempt_id: str,
    writer: PersistenceWriter,
    repository_version: str,
    attempt_id: str | None = None,
    target_instance_label: str = "LOCAL_DEVELOPMENT",
    clock: Callable[[], datetime] = _utc_now,
) -> PersistenceOutcome:
    attempt_id = _attempt_id(attempt_id)
    repository_version = _safe_id(repository_version, "repository_version")
    target_instance_label = _safe_id(target_instance_label, "target_instance_label")
    bundle = load_normalized_bundle(slot_dir, normalization_attempt_id)
    started_at = _require_utc(clock(), "started_at")
    receipt_path = _receipt_path(slot_dir, "import", attempt_id)
    if receipt_path.exists():
        raise CaptureV2Conflict("persistence attempt already exists")
    status = PersistenceStatus.IMPORT_FAILED_RECOVERABLE
    result: PersistenceResult | None = None
    diagnostic_code: str | None = None
    safe_context: dict[str, Any] = {}
    try:
        result = writer.persist(bundle)
        if not isinstance(result, PersistenceResult):
            raise PersistenceTerminalError("writer returned an invalid result")
        for value, field in (
            (result.dataset_id, "dataset_id"),
            (result.seal_id, "seal_id"),
            (result.schema_release, "schema_release"),
        ):
            _safe_id(value, field)
        status = PersistenceStatus.PERSISTED
    except PersistenceTerminalError as error:
        status = PersistenceStatus.IMPORT_FAILED_TERMINAL
        diagnostic_code = type(error).__name__.upper()
        safe_context = _safe_context(error)
    except Exception as error:
        diagnostic_code = type(error).__name__.upper()
        safe_context = _safe_context(error)
    finished_at = _require_utc(clock(), "finished_at")
    receipt = {
        "attempt_id": attempt_id,
        "capture_terminal_hash": bundle.capture_terminal_hash,
        "contract_version": CAPTURE_CONTRACT_VERSION,
        "dataset_id": None if result is None else result.dataset_id,
        "diagnostic_code": diagnostic_code,
        "finished_at": utc_timestamp_text(finished_at),
        "input_normalized_manifest_hash": bundle.manifest_hash,
        "normalization_attempt_id": normalization_attempt_id,
        "persistence_status": status.value,
        "receipt_type": "PERSISTENCE",
        "repository_version": repository_version,
        "replayed": None if result is None else result.replayed,
        "safe_context": safe_context,
        "schema_release": None if result is None else result.schema_release,
        "seal_id": None if result is None else result.seal_id,
        "started_at": utc_timestamp_text(started_at),
        "target_instance_label": target_instance_label,
    }
    receipt_hash = _write_once(receipt_path, canonical_json_bytes(receipt))
    return PersistenceOutcome(
        slot_dir=slot_dir,
        attempt_id=attempt_id,
        status=status,
        receipt_hash=receipt_hash,
        dataset_id=None if result is None else result.dataset_id,
        seal_id=None if result is None else result.seal_id,
    )


def _latest_receipt(slot: Path, kind: str, status_field: str) -> dict[str, Any] | None:
    receipts: list[dict[str, Any]] = []
    for path in sorted((slot / "receipts").glob(f"{kind}-*.json")):
        document = _strict_json(path)
        if status_field in document:
            receipts.append(document)
    if not receipts:
        return None
    return max(receipts, key=lambda item: str(item.get("finished_at", "")))


def scan_recovery_candidates(
    root: Path,
    *,
    as_of: datetime | None = None,
) -> tuple[RecoveryCandidate, ...]:
    as_of = _require_utc(as_of or _utc_now(), "as_of")
    candidates: list[RecoveryCandidate] = []
    for terminal_path in sorted(root.glob("run=*/slot=*/capture-terminal.json")):
        slot = terminal_path.parent
        terminal = _strict_json(terminal_path)
        try:
            capture_status = CaptureStatus(str(terminal["capture_status"]))
        except (KeyError, ValueError):
            raise RecoveryValidationError("capture terminal status is invalid") from None
        normalize = _latest_receipt(slot, "normalize", "normalization_status")
        persistence = _latest_receipt(slot, "import", "persistence_status")
        normalization_status = (
            NormalizationStatus.NOT_STARTED
            if normalize is None
            else NormalizationStatus(str(normalize["normalization_status"]))
        )
        persistence_status = (
            PersistenceStatus.PENDING_IMPORT
            if capture_status is CaptureStatus.CAPTURED and persistence is None
            else PersistenceStatus.NOT_REQUESTED
            if persistence is None
            else PersistenceStatus(str(persistence["persistence_status"]))
        )
        if capture_status is not CaptureStatus.CAPTURED:
            continue
        if persistence_status is PersistenceStatus.PERSISTED:
            continue
        raw_delete_text = terminal.get("raw_delete_after")
        raw_delete_after = (
            None
            if raw_delete_text is None
            else datetime.fromisoformat(str(raw_delete_text).replace("Z", "+00:00"))
        )
        raw_available = (
            (slot / "raw" / "response-0001.bin").is_file()
            and (raw_delete_after is None or as_of < raw_delete_after)
        )
        normalized_attempt = (
            None
            if normalize is None
            or normalization_status is not NormalizationStatus.SUCCEEDED
            else str(normalize["attempt_id"])
        )
        if not raw_available and normalized_attempt is None:
            continue
        candidates.append(
            RecoveryCandidate(
                slot_dir=slot,
                capture_status=capture_status,
                normalization_status=normalization_status,
                persistence_status=persistence_status,
                raw_delete_after=raw_delete_after,
                raw_available=raw_available,
                normalized_attempt_id=normalized_attempt,
            )
        )
    return tuple(candidates)


def _gc_instant(value: Any, field: str) -> datetime:
    if not isinstance(value, str):
        raise RecoveryValidationError(f"{field} is not a UTC instant")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise RecoveryValidationError(f"{field} is not a UTC instant") from None
    try:
        return _require_utc(parsed, field)
    except ValueError:
        raise RecoveryValidationError(f"{field} is not a UTC instant") from None


def _gc_raw_descriptor(
    slot: Path,
) -> tuple[dict[str, Any], str, str, str, int, datetime]:
    terminal_path = slot / "capture-terminal.json"
    terminal_bytes = terminal_path.read_bytes()
    terminal = _strict_json(terminal_path)
    if terminal.get("contract_version") != CAPTURE_CONTRACT_VERSION:
        raise RecoveryValidationError("capture terminal contract is unsupported")
    if terminal.get("capture_status") != CaptureStatus.CAPTURED.value:
        raise RecoveryValidationError("raw GC only accepts CAPTURED slots")
    terminal_hash = sha256_hex(terminal_bytes)
    raw_manifest_path = slot / "raw-manifest.json"
    raw_manifest_bytes = raw_manifest_path.read_bytes()
    raw_manifest_hash = sha256_hex(raw_manifest_bytes)
    if terminal.get("raw_manifest_hash") != raw_manifest_hash:
        raise RecoveryValidationError("raw manifest no longer matches the capture terminal")
    raw_manifest = _strict_json(raw_manifest_path)
    artifacts = raw_manifest.get("artifacts")
    if not isinstance(artifacts, list) or len(artifacts) != 1:
        raise RecoveryValidationError("V2/1 requires exactly one response artifact")
    artifact = artifacts[0]
    if not isinstance(artifact, dict) or artifact.get("path") != "raw/response-0001.bin":
        raise RecoveryValidationError("raw artifact path is invalid")
    digest = artifact.get("sha256")
    byte_count = artifact.get("byte_count")
    if not isinstance(digest, str) or not _SHA256.fullmatch(digest):
        raise RecoveryValidationError("raw artifact digest is invalid")
    if isinstance(byte_count, bool) or not isinstance(byte_count, int) or byte_count < 0:
        raise RecoveryValidationError("raw artifact byte count is invalid")
    raw_delete_after = _gc_instant(terminal.get("raw_delete_after"), "raw_delete_after")
    return (
        terminal,
        terminal_hash,
        raw_manifest_hash,
        digest,
        byte_count,
        raw_delete_after,
    )


def _verify_gc_payload(path: Path, *, digest: str, byte_count: int) -> None:
    if path.is_symlink():
        raise RecoveryValidationError("raw GC refuses symlink payloads")
    payload = path.read_bytes()
    if len(payload) != byte_count or sha256_hex(payload) != digest:
        raise RecoveryValidationError("raw payload bytes no longer match their manifest")


def _gc_dependency_receipt(
    slot: Path, *, terminal_hash: str, raw_manifest_hash: str
) -> dict[str, Any]:
    normalized: dict[str, tuple[NormalizedBundle, str]] = {}
    for path in sorted((slot / "receipts").glob("normalize-*.json")):
        receipt = _strict_json(path)
        if receipt.get("normalization_status") != NormalizationStatus.SUCCEEDED.value:
            continue
        if (
            receipt.get("contract_version") != CAPTURE_CONTRACT_VERSION
            or receipt.get("receipt_type") != "NORMALIZATION"
            or receipt.get("input_raw_manifest_hash") != raw_manifest_hash
        ):
            raise RecoveryValidationError("normalization receipt contract is invalid")
        attempt_id = str(receipt.get("attempt_id", ""))
        bundle = load_normalized_bundle(slot, attempt_id)
        if bundle.capture_terminal_hash != terminal_hash:
            raise RecoveryValidationError("normalization receipt references another terminal")
        normalized[attempt_id] = (bundle, sha256_hex(path.read_bytes()))
    if not normalized:
        raise RecoveryValidationError("raw GC requires a verified successful normalization")

    persisted: list[
        tuple[datetime, dict[str, Any], NormalizedBundle, str, str]
    ] = []
    for path in sorted((slot / "receipts").glob("import-*.json")):
        receipt = _strict_json(path)
        if receipt.get("persistence_status") != PersistenceStatus.PERSISTED.value:
            continue
        if (
            receipt.get("contract_version") != CAPTURE_CONTRACT_VERSION
            or receipt.get("receipt_type") != "PERSISTENCE"
            or not isinstance(receipt.get("replayed"), bool)
        ):
            raise RecoveryValidationError("persistence receipt contract is invalid")
        normalization_attempt_id = str(receipt.get("normalization_attempt_id", ""))
        dependency = normalized.get(normalization_attempt_id)
        if dependency is None:
            raise RecoveryValidationError(
                "persistence receipt lacks a verified normalization dependency"
            )
        bundle, normalization_receipt_hash = dependency
        if receipt.get("capture_terminal_hash") != terminal_hash:
            raise RecoveryValidationError("persistence receipt references another terminal")
        if receipt.get("input_normalized_manifest_hash") != bundle.manifest_hash:
            raise RecoveryValidationError("persistence receipt does not bind normalized bytes")
        for field in ("dataset_id", "seal_id", "schema_release"):
            if not isinstance(receipt.get(field), str) or not receipt[field]:
                raise RecoveryValidationError(
                    f"persisted receipt is missing {field}"
                )
        persisted.append(
            (
                _gc_instant(receipt.get("finished_at"), "finished_at"),
                receipt,
                bundle,
                normalization_receipt_hash,
                sha256_hex(path.read_bytes()),
            )
        )
    if not persisted:
        raise RecoveryValidationError("raw GC requires a verified PERSISTED receipt")
    (
        _finished_at,
        receipt,
        bundle,
        normalization_receipt_hash,
        persistence_receipt_hash,
    ) = max(persisted, key=lambda value: value[0])
    return {
        "dataset_id": receipt["dataset_id"],
        "normalization_attempt_id": bundle.attempt_id,
        "normalization_receipt_hash": normalization_receipt_hash,
        "persistence_attempt_id": receipt["attempt_id"],
        "persistence_receipt_hash": persistence_receipt_hash,
        "seal_id": receipt["seal_id"],
    }


def _validate_raw_deletion_receipt(
    receipt: Mapping[str, Any],
    *,
    terminal: Mapping[str, Any],
    terminal_hash: str,
    raw_manifest_hash: str,
    digest: str,
    byte_count: int,
) -> None:
    expected = {
        "capture_terminal_hash": terminal_hash,
        "contract_version": CAPTURE_CONTRACT_VERSION,
        "raw_byte_count": byte_count,
        "raw_content_hash": digest,
        "raw_manifest_hash": raw_manifest_hash,
        "raw_delete_after": terminal["raw_delete_after"],
        "raw_relative_path": "raw/response-0001.bin",
        "receipt_contract_version": RAW_DELETION_RECEIPT_VERSION,
        "receipt_type": "RAW_DELETION",
        "run_id": terminal["run_id"],
        "slot_id": terminal["slot_id"],
        "status": "COMMITTED",
    }
    if any(receipt.get(key) != value for key, value in expected.items()):
        raise RecoveryValidationError("raw deletion receipt does not bind this slot")
    committed_at = _gc_instant(receipt.get("committed_at"), "committed_at")
    raw_delete_after = _gc_instant(receipt.get("raw_delete_after"), "raw_delete_after")
    if committed_at < raw_delete_after:
        raise RecoveryValidationError("raw deletion was committed before TTL expiry")
    for field in ("dataset_id", "seal_id"):
        if not isinstance(receipt.get(field), str) or not receipt[field]:
            raise RecoveryValidationError(f"raw deletion receipt is missing {field}")
    for field in ("normalization_receipt_hash", "persistence_receipt_hash"):
        value = receipt.get(field)
        if not isinstance(value, str) or not _SHA256.fullmatch(value):
            raise RecoveryValidationError(f"raw deletion receipt is missing {field}")


def gc_expired_capture_v2_raw(
    root: Path,
    *,
    now: datetime | None = None,
    dry_run: bool = False,
) -> RawGcResult:
    """Delete only expired, normalized and persisted V2 raw bytes.

    The raw payload is atomically moved to a same-volume staging name before an
    immutable deletion receipt is committed. A crash before the receipt leaves
    recoverable staged bytes; a crash after it can only retain bytes longer.
    Capture terminals, manifests, normalized facts and persistence receipts are
    never modified.
    """

    now = _require_utc(now or _utc_now(), "now")
    if root.exists() and root.is_symlink():
        raise CaptureV2Error("capture root cannot be a symlink")
    root = root.resolve()
    if not root.is_dir():
        return RawGcResult(0, 0, 0, 0, 0, 0, dry_run, ())

    scanned_slots = 0
    expired_slots = 0
    eligible_slots = 0
    deleted_slots = 0
    already_deleted_slots = 0
    protected_slots = 0
    errors: list[str] = []
    for terminal_path in sorted(root.glob("run=*/slot=*/capture-terminal.json")):
        scanned_slots += 1
        slot = terminal_path.parent
        label = slot.relative_to(root).as_posix()
        try:
            if slot.is_symlink():
                raise RecoveryValidationError("raw GC refuses symlink slots")
            preliminary_terminal = _strict_json(terminal_path)
            if preliminary_terminal.get("capture_status") != CaptureStatus.CAPTURED.value:
                continue
            (
                terminal,
                terminal_hash,
                raw_manifest_hash,
                digest,
                byte_count,
                raw_delete_after,
            ) = _gc_raw_descriptor(slot)
            if raw_delete_after > now:
                continue
            expired_slots += 1
            for marker in (RAW_RETENTION_HOLD_MARKER, RECOVERY_IN_PROGRESS_MARKER):
                if (slot / marker).exists():
                    raise RecoveryValidationError(f"raw GC is blocked by {marker}")
            if any(path.name.endswith(".tmp") for path in slot.rglob("*")):
                raise RecoveryValidationError("raw GC is blocked by an in-progress temp file")

            raw_path = slot / "raw" / "response-0001.bin"
            staged_path = slot / ".gc" / f"response-0001.{digest}.pending-delete"
            receipt_path = slot / "receipts" / "raw-delete.json"
            if receipt_path.exists():
                receipt = _strict_json(receipt_path)
                _validate_raw_deletion_receipt(
                    receipt,
                    terminal=terminal,
                    terminal_hash=terminal_hash,
                    raw_manifest_hash=raw_manifest_hash,
                    digest=digest,
                    byte_count=byte_count,
                )
                if raw_path.exists():
                    raise RecoveryValidationError(
                        "committed raw deletion receipt conflicts with live raw bytes"
                    )
                if staged_path.exists():
                    _verify_gc_payload(staged_path, digest=digest, byte_count=byte_count)
                    eligible_slots += 1
                    if not dry_run:
                        staged_path.unlink()
                        deleted_slots += 1
                else:
                    already_deleted_slots += 1
                continue

            dependency = _gc_dependency_receipt(
                slot,
                terminal_hash=terminal_hash,
                raw_manifest_hash=raw_manifest_hash,
            )
            if raw_path.exists() and staged_path.exists():
                raise RecoveryValidationError("raw and staged deletion bytes both exist")
            payload_path = raw_path if raw_path.exists() else staged_path
            if not payload_path.exists():
                raise RecoveryValidationError("raw bytes are missing without a deletion receipt")
            _verify_gc_payload(payload_path, digest=digest, byte_count=byte_count)
            eligible_slots += 1
            if dry_run:
                continue

            staged_path.parent.mkdir(parents=True, exist_ok=True)
            if staged_path.parent.is_symlink():
                raise RecoveryValidationError("raw GC staging directory cannot be a symlink")
            if payload_path == raw_path:
                os.replace(raw_path, staged_path)
            receipt = {
                "capture_terminal_hash": terminal_hash,
                "committed_at": utc_timestamp_text(now),
                "contract_version": CAPTURE_CONTRACT_VERSION,
                "dataset_id": dependency["dataset_id"],
                "normalization_attempt_id": dependency["normalization_attempt_id"],
                "normalization_receipt_hash": dependency["normalization_receipt_hash"],
                "persistence_attempt_id": dependency["persistence_attempt_id"],
                "persistence_receipt_hash": dependency["persistence_receipt_hash"],
                "raw_byte_count": byte_count,
                "raw_content_hash": digest,
                "raw_delete_after": utc_timestamp_text(raw_delete_after),
                "raw_manifest_hash": raw_manifest_hash,
                "raw_relative_path": "raw/response-0001.bin",
                "receipt_contract_version": RAW_DELETION_RECEIPT_VERSION,
                "receipt_type": "RAW_DELETION",
                "run_id": terminal["run_id"],
                "seal_id": dependency["seal_id"],
                "slot_id": terminal["slot_id"],
                "status": "COMMITTED",
            }
            try:
                _write_once(receipt_path, canonical_json_bytes(receipt))
            except Exception:
                if staged_path.exists() and not raw_path.exists() and not receipt_path.exists():
                    os.replace(staged_path, raw_path)
                raise
            staged_path.unlink()
            deleted_slots += 1
        except Exception as error:
            protected_slots += 1
            errors.append(f"{label}: {type(error).__name__}: {error}")
    return RawGcResult(
        scanned_slots=scanned_slots,
        expired_slots=expired_slots,
        eligible_slots=eligible_slots,
        deleted_slots=deleted_slots,
        already_deleted_slots=already_deleted_slots,
        protected_slots=protected_slots,
        dry_run=dry_run,
        errors=tuple(errors),
    )


def capture_coverage(root: Path) -> dict[str, int]:
    plans = tuple(root.glob("run=*/slot=*/plan.json"))
    terminals = tuple(root.glob("run=*/slot=*/capture-terminal.json"))
    captured = 0
    attempted = 0
    normalized = 0
    persisted = 0
    for terminal_path in terminals:
        terminal = _strict_json(terminal_path)
        attempted += int(int(terminal.get("request_attempt_count", 0)) > 0)
        captured += int(terminal.get("capture_status") == CaptureStatus.CAPTURED.value)
        slot = terminal_path.parent
        normalized += int(
            any(
                _strict_json(path).get("normalization_status")
                == NormalizationStatus.SUCCEEDED.value
                for path in (slot / "receipts").glob("normalize-*.json")
            )
        )
        persisted += int(
            any(
                _strict_json(path).get("persistence_status")
                == PersistenceStatus.PERSISTED.value
                for path in (slot / "receipts").glob("import-*.json")
            )
        )
    return {
        "scheduled_slot_count": len(plans),
        "request_attempt_slot_count": attempted,
        "captured_slot_count": captured,
        "normalized_slot_count": normalized,
        "persisted_slot_count": persisted,
    }


__all__ = [
    "CAPTURE_CONTRACT_VERSION",
    "RAW_DELETION_RECEIPT_VERSION",
    "RAW_RETENTION_HOLD_MARKER",
    "RECOVERY_IN_PROGRESS_MARKER",
    "CaptureOutcome",
    "CaptureStatus",
    "CaptureV2Conflict",
    "CaptureV2Error",
    "NormalizationOutcome",
    "NormalizationStatus",
    "NormalizationTerminalError",
    "NormalizedBundle",
    "PersistenceOutcome",
    "PersistenceRecoverableError",
    "PersistenceResult",
    "PersistenceStatus",
    "PersistenceTerminalError",
    "RecoveryCandidate",
    "RecoveryValidationError",
    "RawGcResult",
    "capture_coverage",
    "capture_to_slot",
    "gc_expired_capture_v2_raw",
    "load_normalized_bundle",
    "normalize_captured_slot",
    "persist_normalized_slot",
    "scan_recovery_candidates",
]
