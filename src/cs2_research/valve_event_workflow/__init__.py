"""Private Valve-event D2 workflow services.

This package deliberately does not define the D1 source model or D3 outcome
semantics.  Inputs cross those boundaries as frozen JSON-compatible mappings.
"""

from .evaluator import (
    Evaluator,
    EvaluatorRawOutput,
    EvaluatorTransportFailure,
    FakeEvaluator,
    FakeEvaluatorFailure,
)
from .validation import CandidateValidationError, validate_candidate_document

_v81_reader_install.install()
_v9_reader_install.install()

__all__ = [
    "CandidateValidationError",
    "Evaluator",
    "EvaluatorRawOutput",
    "EvaluatorTransportFailure",
    "FakeEvaluator",
    "FakeEvaluatorFailure",
    "validate_candidate_document",
]
