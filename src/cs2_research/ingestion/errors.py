from __future__ import annotations

from collections.abc import Mapping
from typing import Any


class IngestionError(RuntimeError):
    """Base class for stable, machine-readable ingestion failures."""

    code = "INGESTION_ERROR"

    def __init__(
        self,
        message: str,
        *,
        context: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.context = dict(context or {})


class PlanningDenied(IngestionError, ValueError):
    code = "RIGHTS_DENIED"


class TransportDenied(IngestionError):
    code = "TRANSPORT_DENIED"


class CredentialUnavailable(IngestionError):
    code = "CREDENTIAL_UNAVAILABLE"


class TransportRequestFailed(IngestionError):
    code = "TRANSPORT_REQUEST_FAILED"


class EnvelopeValidationError(IngestionError, ValueError):
    code = "ENVELOPE_INVALID"


class ArtifactValidationError(IngestionError, ValueError):
    code = "ARTIFACT_INVALID"


class ArtifactConflict(IngestionError):
    code = "ARTIFACT_CONFLICT"


class ArtifactCommitError(IngestionError):
    code = "ARTIFACT_COMMIT_FAILED"


class ProviderAdapterUnavailable(IngestionError, NotImplementedError):
    """Raised where the private provider-format adapter would run."""

    code = "PROVIDER_ADAPTER_NOT_INCLUDED"
