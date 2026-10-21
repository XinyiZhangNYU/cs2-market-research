from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from typing import Any

from jsonschema import Draft202012Validator

from cs2_research.canonical import canonical_json_bytes

from .output_schema import assessment_v1_validator, assessment_v2_validator, assessment_v3_validator


ARTICLE_FIELDS = (
    "title",
    "factual_summary",
    "transmission_mechanisms",
    "scope_analysis",
    "uncertainties_and_counterforces",
    "observation_and_falsification",
    "conclusion",
)
CLAIM_FIELDS = (
    "claim_id",
    "scope_kind",
    "scope_ref",
    "scope_display",
    "tracking_status",
    "direction",
    "horizon",
    "mechanism_codes",
    "reasoning_section_ref",
    "observation_targets",
    "falsification_conditions",
    "limitations",
)
CLAIM_ARRAY_FIELDS = (
    "mechanism_codes",
    "observation_targets",
    "falsification_conditions",
    "limitations",
)
ROOT_FIELDS = {
    "contract",
    "identity",
    "article",
    "claims",
    "coverage",
    "conclusion_tags",
    "disclosures",
    "provenance",
}
SCOPE_KINDS = {"MARKET", "SECTOR", "ASSET_FAMILY", "ITEM", "MECHANISM"}
TRACKING_STATUSES = {"TRACKED", "UNTRACKED_SUBJECT", "UNRESOLVED"}
DIRECTIONS = {
    "POSITIVE",
    "NEGATIVE",
    "MIXED",
    "NO_CLEAR_IMPACT",
    "UNCERTAIN",
}
HORIZONS = {"IMMEDIATE", "SHORT_TERM", "STRUCTURAL", "UNSPECIFIED"}
TEMPORAL_MODES = {
    "PROSPECTIVE",
    "RETROSPECTIVE_REPLAY",
    "RETROSPECTIVE_WITH_HINDSIGHT",
    "RETROSPECTIVE_CORRECTION",
}
_FORBIDDEN_KEY_PARTS = (
    "score",
    "confidence",
    "probability",
    "likelihood",
    "risk_level",
)
_UNSAFE_TEXT = re.compile(r"<\s*(?:script|iframe|style)|javascript:", re.IGNORECASE)
_FORBIDDEN_NUMERIC_CLAIM = re.compile(
    r"\b(?:confidence|probability|likelihood)\b\s*(?::|=|is)?\s*\d",
    re.IGNORECASE,
)


class CandidateValidationError(ValueError):
    def __init__(self, code: str, errors: Sequence[str]) -> None:
        self.code = code
        self.errors = tuple(errors)
        super().__init__(f"{code}: {'; '.join(self.errors)}")


def allowed_mechanism_codes_from_corpus(
    corpus: Mapping[str, Any],
) -> tuple[str, ...]:
    """Accept attributed V2 vocabularies and preserve historical empty corpora."""

    if corpus.get("schema_id") == "valve-event-mechanism-corpus/v2":
        from .corpus import validate_corpus

        return validate_corpus(corpus)
    passages = corpus.get("selected_passages")
    if not isinstance(passages, list):
        raise ValueError("mechanism_corpus.selected_passages must be an array")
    if passages:
        raise ValueError(
            "mechanism_corpus does not expose a versioned mechanism-code allowlist"
        )
    return ()


def _require_mapping(value: Any, path: str, errors: list[str]) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        errors.append(f"{path} must be an object")
        return {}
    return value


def _walk_policy(value: Any, path: str, errors: list[str]) -> None:
    if isinstance(value, Mapping):
        for key, member in value.items():
            normalized = str(key).casefold()
            if any(part in normalized for part in _FORBIDDEN_KEY_PARTS):
                errors.append(f"{path}.{key} uses a forbidden score/probability field")
            _walk_policy(member, f"{path}.{key}", errors)
    elif isinstance(value, list):
        for index, member in enumerate(value):
            _walk_policy(member, f"{path}[{index}]", errors)
    elif isinstance(value, str):
        if _UNSAFE_TEXT.search(value):
            errors.append(f"{path} contains unsafe markup or URL syntax")
        if _FORBIDDEN_NUMERIC_CLAIM.search(value):
            errors.append(f"{path} contains a numeric probability/confidence claim")


def validate_candidate_document(
    document: Mapping[str, Any],
    *,
    expected_event_id: str,
    expected_source_notice_version_id: str,
    expected_temporal_mode: str,
    expected_event_cutoff_at: str,
    expected_context_snapshot_id: str,
    expected_context_status: str,
    expected_tracked_universe_version: str,
    expected_selection_rules_version: str,
    expected_coverage_manifest_sha256: str,
    expected_assessed_scopes: Sequence[str],
    expected_input_pack_id: str,
    expected_profile_release_id: str,
    expected_corpus_release_id: str,
    expected_tracked_scope_identities: Sequence[tuple[str, str]] = (),
    allowed_mechanism_codes: Sequence[str] = (),
    maximum_bytes: int = 262_144,
    expected_schema_version: str = "v1",
    assessment_schema: Mapping[str, Any] | None = None,
) -> None:
    errors: list[str] = []
    if expected_schema_version not in {"v1", "v2", "v3"}:
        raise ValueError("unsupported expected assessment schema version")
    reader = expected_schema_version in {"v2", "v3"}
    article_fields = ("title", "body") if expected_schema_version == "v2" else ARTICLE_FIELDS
    sections = ("body", "evidence_audit") if reader else ARTICLE_FIELDS
    if assessment_schema is not None:
        Draft202012Validator.check_schema(assessment_schema)
        validator = Draft202012Validator(assessment_schema)
    else:
        validator = (
            assessment_v3_validator() if expected_schema_version == "v3"
            else assessment_v2_validator() if reader
            else assessment_v1_validator()
        )
    for error in validator.iter_errors(document):
        path = "$" + "".join(
            f"[{member}]" if isinstance(member, int) else f".{member}"
            for member in error.absolute_path
        )
        detail = f"missing fields: {error.message}" if error.validator == "required" else error.message
        errors.append(f"{path}: {detail}")
    if errors:
        _walk_policy(document, "$", errors)
        _raise_candidate_errors(errors)
    frozen_scope_identities = tuple(expected_tracked_scope_identities)
    if any(
        not isinstance(pair, tuple) or len(pair) != 2
        or not isinstance(pair[0], str)
        or pair[0] not in SCOPE_KINDS
        or not isinstance(pair[1], str) or not pair[1].strip()
        for pair in frozen_scope_identities
    ) or len(set(frozen_scope_identities)) != len(frozen_scope_identities):
        raise ValueError("expected_tracked_scope_identities must contain unique exact scope pairs")
    tracked_scope_set = set(frozen_scope_identities)
    frozen_mechanism_codes = tuple(allowed_mechanism_codes)
    if len(set(frozen_mechanism_codes)) != len(frozen_mechanism_codes) or not all(
        isinstance(code, str) and code.strip() for code in frozen_mechanism_codes
    ):
        raise ValueError("allowed_mechanism_codes must be unique non-empty strings")
    allowed_mechanism_code_set = set(frozen_mechanism_codes)
    root = _require_mapping(document, "$", errors)
    unknown_root_fields = set(root) - (ROOT_FIELDS | ({"evidence_audit"} if reader else set()))
    if unknown_root_fields:
        errors.append(
            f"$ has unknown fields: {', '.join(sorted(map(str, unknown_root_fields)))}"
        )
    contract = _require_mapping(root.get("contract"), "$.contract", errors)
    if contract.get("schema_id") != "valve-event-assessment":
        errors.append("$.contract.schema_id must be valve-event-assessment")
    if contract.get("schema_version") != expected_schema_version:
        errors.append("$.contract.schema_version differs from expected version")

    identity = _require_mapping(root.get("identity"), "$.identity", errors)
    expected_identity = {
        "event_id": expected_event_id,
        "source_notice_version_id": expected_source_notice_version_id,
        "temporal_mode": expected_temporal_mode,
        "event_cutoff_at": expected_event_cutoff_at,
    }
    for key, expected in expected_identity.items():
        if identity.get(key) != expected:
            errors.append(f"$.identity.{key} does not match frozen input")
    if identity.get("temporal_mode") not in TEMPORAL_MODES:
        errors.append("$.identity.temporal_mode is unsupported")

    article = _require_mapping(root.get("article"), "$.article", errors)
    if expected_schema_version == "v3":
        from .reader_assessment import validate_reader_article

        try:
            validate_reader_article(article)
        except ValueError as exc:
            errors.append(f"$.article is invalid: {exc}")
    else:
        unknown_article_fields = set(article) - set(article_fields)
        if unknown_article_fields:
            errors.append(
                "$.article has unknown fields: "
                + ", ".join(sorted(map(str, unknown_article_fields)))
            )
        for field in article_fields:
            value = article.get(field)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"$.article.{field} must be non-empty text")

    claims = root.get("claims")
    market_claims = 0
    if not isinstance(claims, list) or not claims:
        errors.append("$.claims must be a non-empty array")
        claims = []
    for index, raw_claim in enumerate(claims):
        claim = _require_mapping(raw_claim, f"$.claims[{index}]", errors)
        missing_claim_fields = set(CLAIM_FIELDS) - set(claim)
        if missing_claim_fields:
            errors.append(
                f"$.claims[{index}] is missing fields: "
                + ", ".join(sorted(missing_claim_fields))
            )
        unknown_claim_fields = set(claim) - set(CLAIM_FIELDS)
        if unknown_claim_fields:
            errors.append(
                f"$.claims[{index}] has unknown fields: "
                + ", ".join(sorted(map(str, unknown_claim_fields)))
            )
        scope_kind = claim.get("scope_kind")
        if scope_kind not in SCOPE_KINDS:
            errors.append(f"$.claims[{index}].scope_kind is unsupported")
        if scope_kind == "MARKET":
            market_claims += 1
        if claim.get("tracking_status") not in TRACKING_STATUSES:
            errors.append(f"$.claims[{index}].tracking_status is unsupported")
        if claim.get("direction") not in DIRECTIONS:
            errors.append(f"$.claims[{index}].direction is unsupported")
        if claim.get("horizon") not in HORIZONS:
            errors.append(f"$.claims[{index}].horizon is unsupported")
        section = claim.get("reasoning_section_ref")
        if section not in sections:
            errors.append(f"$.claims[{index}].reasoning_section_ref is unsupported")
        if not isinstance(claim.get("claim_id"), str) or not claim["claim_id"].strip():
            errors.append(f"$.claims[{index}].claim_id must be non-empty")
        scope_ref = claim.get("scope_ref")
        if scope_ref is not None and not isinstance(scope_ref, str):
            errors.append(f"$.claims[{index}].scope_ref must be text or null")
        if claim.get("tracking_status") == "TRACKED":
            if (scope_kind, scope_ref) not in tracked_scope_set:
                errors.append(
                    f"$.claims[{index}] TRACKED scope identity is outside frozen selection"
                )
            if scope_kind not in expected_assessed_scopes:
                errors.append(f"$.claims[{index}] TRACKED scope is outside assessed coverage")
        elif scope_ref is not None:
            # Untracked/unresolved subjects can be discussed qualitatively, but
            # cannot mint an internal identity by changing their status label.
            errors.append(f"$.claims[{index}] untracked or unresolved scope_ref must be null")
        scope_display = claim.get("scope_display")
        if not isinstance(scope_display, str) or not scope_display.strip():
            errors.append(f"$.claims[{index}].scope_display must be non-empty text")
        for field in CLAIM_ARRAY_FIELDS:
            members = claim.get(field)
            if not isinstance(members, list) or not all(
                isinstance(member, str) and member.strip() for member in members
            ):
                errors.append(
                    f"$.claims[{index}].{field} must be a string array"
                )
        mechanism_codes = claim.get("mechanism_codes")
        if isinstance(mechanism_codes, list) and all(
            isinstance(member, str) and member.strip() for member in mechanism_codes
        ):
            if len(set(mechanism_codes)) != len(mechanism_codes):
                errors.append(
                    f"$.claims[{index}].mechanism_codes contains duplicate codes"
                )
            unknown_codes = sorted(
                set(mechanism_codes) - allowed_mechanism_code_set
            )
            if unknown_codes:
                errors.append(
                    f"$.claims[{index}].mechanism_codes contains codes outside the "
                    "frozen controlled vocabulary: " + ", ".join(unknown_codes)
                )
    if market_claims == 0:
        errors.append("at least one MARKET claim is required")

    coverage = _require_mapping(root.get("coverage"), "$.coverage", errors)
    required_coverage = (
        "catalog_version",
        "tracked_universe_version",
        "selection_rules_version",
        "context_status",
        "coverage_manifest_sha256",
    )
    for key in required_coverage:
        if not isinstance(coverage.get(key), str) or not coverage[key].strip():
            errors.append(f"$.coverage.{key} must be non-empty text")
    if coverage.get("context_snapshot_id") != expected_context_snapshot_id:
        errors.append("$.coverage.context_snapshot_id does not match frozen input")
    expected_coverage = {
        "context_status": expected_context_status,
        "tracked_universe_version": expected_tracked_universe_version,
        "selection_rules_version": expected_selection_rules_version,
        "coverage_manifest_sha256": expected_coverage_manifest_sha256,
    }
    for key, expected in expected_coverage.items():
        if coverage.get(key) != expected:
            errors.append(f"$.coverage.{key} does not match frozen input")
    if coverage.get("assessed_scopes") != list(expected_assessed_scopes):
        errors.append(
            "$.coverage.assessed_scopes does not exactly match frozen input"
        )

    provenance = _require_mapping(root.get("provenance"), "$.provenance", errors)
    expected_provenance = {
        "input_pack_id": expected_input_pack_id,
        "profile_release_id": expected_profile_release_id,
        "corpus_release_id": expected_corpus_release_id,
        "schema_version": expected_schema_version,
    }
    for key, expected in expected_provenance.items():
        if provenance.get(key) != expected:
            errors.append(f"$.provenance.{key} does not match frozen input")

    if not isinstance(root.get("conclusion_tags"), Mapping):
        errors.append("$.conclusion_tags must be an object")
    disclosures = root.get("disclosures")
    if not isinstance(disclosures, list) or not disclosures or not all(
        isinstance(member, str) and member.strip() for member in disclosures
    ):
        errors.append("$.disclosures must be a non-empty string array")

    _walk_policy(root, "$", errors)
    try:
        byte_count = len(canonical_json_bytes(dict(root)))
        if byte_count > maximum_bytes:
            errors.append(f"candidate exceeds {maximum_bytes} canonical bytes")
    except (TypeError, ValueError) as exc:
        errors.append(f"candidate cannot be canonicalized: {exc}")

    if errors:
        _raise_candidate_errors(errors)


def _raise_candidate_errors(errors: list[str]) -> None:
    policy_errors = [
        member
        for member in errors
        if "forbidden score/probability" in member
        or "numeric probability/confidence" in member
    ]
    unsafe_errors = [member for member in errors if "unsafe" in member]
    if policy_errors:
        code = "OUTPUT_POLICY_FORBIDDEN_SCORE"
    elif unsafe_errors:
        code = "OUTPUT_UNSAFE_CONTENT"
    elif any("mechanism_codes" in member for member in errors):
        code = "OUTPUT_MECHANISM_CODE_MISMATCH"
    elif any("article" in member for member in errors):
        code = "OUTPUT_ARTICLE_INCOMPLETE"
    elif any("provenance" in member for member in errors):
        code = "OUTPUT_PROVENANCE_MISMATCH"
    elif any("coverage" in member or "scope" in member for member in errors):
        code = "OUTPUT_SCOPE_MISMATCH"
    else:
        code = "OUTPUT_SCHEMA_INVALID"
    raise CandidateValidationError(code, errors)
