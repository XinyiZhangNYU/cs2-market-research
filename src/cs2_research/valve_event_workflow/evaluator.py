from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Mapping, Protocol


@dataclass(frozen=True, slots=True)
class EvaluatorRawOutput:
    payload: bytes
    provider_request_ref: str | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.payload, bytes):
            raise TypeError("evaluator raw output must be bytes")


class Evaluator(Protocol):
    """Backend-facing evaluator boundary returning unparsed provider bytes."""

    @property
    def profile_release_id(self) -> str: ...

    def evaluate(self, input_pack: Mapping[str, Any]) -> EvaluatorRawOutput: ...


class EvaluatorTransportFailure(RuntimeError):
    """Transport failure with exact adapter diagnostic bytes for retention."""

    def __init__(
        self,
        error_code: str,
        *,
        diagnostic_bytes: bytes = b"",
        provider_request_ref: str | None = None,
    ) -> None:
        super().__init__(error_code)
        self.error_code = error_code
        self.diagnostic_bytes = diagnostic_bytes
        self.provider_request_ref = provider_request_ref


class FakeEvaluatorFailure(EvaluatorTransportFailure):
    """Synthetic evaluator failure used by zero-model acceptance tests."""


class FakeEvaluator:
    """Deterministic zero-network evaluator returning exact raw bytes."""

    def __init__(
        self,
        *,
        profile_release_id: str,
        response: Mapping[str, Any] | None = None,
        raw_response: bytes | str | None = None,
        failure_code: str | None = None,
        failure_bytes: bytes | None = None,
        provider_request_ref: str | None = None,
    ) -> None:
        mode_count = sum(
            value is not None for value in (response, raw_response, failure_code)
        )
        if mode_count != 1:
            raise ValueError(
                "provide exactly one of response, raw_response or failure_code"
            )
        if response is not None:
            payload = (
                json.dumps(
                    dict(response),
                    ensure_ascii=False,
                    sort_keys=True,
                    separators=(",", ":"),
                    allow_nan=False,
                )
                + "\n"
            ).encode("utf-8")
        elif isinstance(raw_response, str):
            payload = raw_response.encode("utf-8")
        elif isinstance(raw_response, bytes):
            payload = raw_response
        else:
            payload = None
        self._profile_release_id = profile_release_id
        self._payload = payload
        self._failure_code = failure_code
        self._failure_bytes = (
            failure_bytes
            if failure_bytes is not None
            else (failure_code or "").encode("utf-8")
        )
        self._provider_request_ref = provider_request_ref
        self.call_count = 0

    @property
    def profile_release_id(self) -> str:
        return self._profile_release_id

    def evaluate(self, input_pack: Mapping[str, Any]) -> EvaluatorRawOutput:
        if not isinstance(input_pack, Mapping):
            raise TypeError("input_pack must be a mapping")
        self.call_count += 1
        if self._failure_code is not None:
            raise FakeEvaluatorFailure(
                self._failure_code,
                diagnostic_bytes=self._failure_bytes,
                provider_request_ref=self._provider_request_ref,
            )
        assert self._payload is not None
        return EvaluatorRawOutput(self._payload, self._provider_request_ref)


__all__ = [
    "Evaluator",
    "EvaluatorRawOutput",
    "EvaluatorTransportFailure",
    "FakeEvaluator",
    "FakeEvaluatorFailure",
]
