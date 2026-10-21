from __future__ import annotations

import os
import re
import shutil
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from cs2_research.canonical import (
    CanonicalizationError,
    canonical_json_bytes,
    sha256_hex,
)

from .errors import ArtifactCommitError, ArtifactConflict, ArtifactValidationError


_BUNDLE_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._=-]{0,199}$")
_MANIFEST_PATH = "manifests/artifact-store.json"


@dataclass(frozen=True)
class ArtifactDescriptor:
    path: str
    sha256: str
    byte_count: int


@dataclass(frozen=True)
class ArtifactReceipt:
    bundle_dir: Path
    bundle_name: str
    artifact_count: int
    manifest_sha256: str
    reused_existing: bool
    artifacts: tuple[ArtifactDescriptor, ...]


def _tree_descriptors(root: Path) -> tuple[ArtifactDescriptor, ...]:
    descriptors: list[ArtifactDescriptor] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(root).as_posix()
        if relative == _MANIFEST_PATH:
            continue
        payload = path.read_bytes()
        descriptors.append(ArtifactDescriptor(relative, sha256_hex(payload), len(payload)))
    return tuple(descriptors)


def _tree_hashes(root: Path) -> dict[str, str]:
    return {
        path.relative_to(root).as_posix(): sha256_hex(path.read_bytes())
        for path in sorted(root.rglob("*"))
        if path.is_file()
    }


class ImmutableArtifactStore:
    """Atomically publishes a staged directory and never overwrites bytes."""

    def __init__(self, root: Path) -> None:
        self.root = root

    def publish_directory(
        self,
        *,
        stage: Path,
        bundle_name: str,
        metadata: dict[str, Any],
    ) -> ArtifactReceipt:
        if not _BUNDLE_NAME.fullmatch(bundle_name):
            raise ArtifactValidationError("bundle_name has an invalid format")
        self.root.mkdir(parents=True, exist_ok=True)
        root = self.root.resolve()
        stage_resolved = stage.resolve()
        if stage_resolved.parent != root:
            raise ArtifactValidationError("stage must be an immediate child of artifact root")
        if not stage_resolved.is_dir():
            raise ArtifactValidationError("stage directory does not exist")
        target = root / bundle_name
        try:
            if (stage_resolved / _MANIFEST_PATH).exists():
                raise ArtifactValidationError(
                    "stage cannot supply the reserved artifact-store manifest"
                )
            descriptors = _tree_descriptors(stage_resolved)
            if not descriptors:
                raise ArtifactValidationError("artifact bundle cannot be empty")
            manifest_document = {
                "artifact_count": len(descriptors),
                "artifacts": [descriptor.__dict__ for descriptor in descriptors],
                "bundle_name": bundle_name,
                "metadata": metadata,
                "schema_version": 1,
            }
            manifest_bytes = canonical_json_bytes(manifest_document)
            manifest_path = stage_resolved / _MANIFEST_PATH
            manifest_path.parent.mkdir(parents=True, exist_ok=True)
            manifest_path.write_bytes(manifest_bytes)
            manifest_sha256 = sha256_hex(manifest_bytes)
            if target.exists():
                if _tree_hashes(stage_resolved) != _tree_hashes(target):
                    raise ArtifactConflict(
                        f"immutable target exists with different content: {target}",
                        context={"bundle_name": bundle_name},
                    )
                shutil.rmtree(stage_resolved)
                return ArtifactReceipt(
                    target,
                    bundle_name,
                    len(descriptors),
                    manifest_sha256,
                    True,
                    descriptors,
                )
            delays = (0.0, 0.05, 0.1, 0.2, 0.4, 0.8)
            for attempt, delay in enumerate(delays):
                if delay:
                    time.sleep(delay)
                try:
                    os.replace(stage_resolved, target)
                    break
                except PermissionError:
                    if attempt == len(delays) - 1:
                        raise
        except (ArtifactConflict, ArtifactValidationError):
            if stage_resolved.exists():
                shutil.rmtree(stage_resolved)
            raise
        except CanonicalizationError as exc:
            if stage_resolved.exists():
                shutil.rmtree(stage_resolved)
            raise ArtifactValidationError(
                "artifact manifest metadata is not canonical-JSON compatible"
            ) from exc
        except Exception as exc:
            if stage_resolved.exists():
                shutil.rmtree(stage_resolved)
            raise ArtifactCommitError(
                f"atomic artifact publish failed: {type(exc).__name__}",
                context={"bundle_name": bundle_name},
            ) from exc

        return ArtifactReceipt(
            target,
            bundle_name,
            len(descriptors),
            manifest_sha256,
            False,
            descriptors,
        )
