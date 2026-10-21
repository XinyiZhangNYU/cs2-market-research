"""Opt-in coverage measurement for one future shadow cohort, never a signal.

The caller supplies one boolean per ordered UTC slot, after the established
source identity/clock/current positive-ask + non-null volume pair checks.
This function cannot verify raw provenance or authorize a runtime cutover.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
import re
from typing import Sequence

from cs2_research.canonical import canonical_json_bytes, sha256_hex


POLICY_ID = "single-item-next-shadow-coverage-252-of-288-gap12-partial-capture/2"
EXPECTED_SLOTS = 288
MINIMUM_QUALIFIED_PAIRS = 252
HIGH_COVERAGE_PAIRS = 260
MAXIMUM_GAP_SLOTS = 12
DAILY_VERSION = "single-item-prospective-daily-feature/4"
PARAMETER_VERSION = "single-item-next-shadow-252-of-288-gap12-partial-capture-unvalidated-v2"


def policy_document() -> dict:
    """Return a fresh copy of the exact machine policy, with no implicit defaults."""
    return {
        "schema_version": "single-item-shadow-coverage-policy/2",
        "policy_id": POLICY_ID,
        "scope": "NEXT_SHADOW_WINDOW_ONLY",
        "timezone": "UTC",
        "slot_seconds": 300,
        "expected_slots": EXPECTED_SLOTS,
        "minimum_qualified_pairs": MINIMUM_QUALIFIED_PAIRS,
        "maximum_consecutive_unqualified_slots": MAXIMUM_GAP_SLOTS,
        "combine_requirements": "AND",
        "include_leading_and_trailing_gaps": True,
        "minimum_present_capture_slots": 1,
        "high_coverage_label_threshold": HIGH_COVERAGE_PAIRS,
        "qualified_pair_rule": "EXISTING_SAME_SLOT_SAME_SOURCE_QUALIFIED_PAIR",
        "on_coverage_failure": "UNKNOWN_NOT_FALSE",
        "missing_capture_slot_policy": "COUNT_AS_UNQUALIFIED_NO_IMPUTATION",
        "retroactive_application": False,
        "automatic_renewal": False,
        "production_enabled": False,
        "watching_transition_enabled": False,
        "efficacy_status": "SHADOW_UNVALIDATED",
        "success_label": None,
    }


@dataclass(frozen=True, slots=True)
class ShadowDayCoverage:
    policy_id: str
    policy_sha256: str
    pair_mask_sha256: str
    qualified_pair_count: int
    longest_unqualified_run: int
    coverage_eligible: bool
    reason_codes: tuple[str, ...]


def evaluate_shadow_day_coverage(
    pair_mask: Sequence[bool], *, policy_id: str,
) -> ShadowDayCoverage:
    """Require explicit policy and 288 true booleans; never infer missing slots.

    Mask false means this item's source pair was unqualified in an existing
    slot (including source absence), or the separately audited capture mask
    proves that the slot was not captured. No value is imputed. Eligibility is
    necessary, not sufficient, for signal evaluation/candidate admission.
    """
    if policy_id != POLICY_ID:
        raise ValueError("EXPLICIT_NEXT_SHADOW_COVERAGE_POLICY_REQUIRED")
    if not isinstance(pair_mask, (tuple, list)) or len(pair_mask) != EXPECTED_SLOTS:
        raise ValueError("EXACT_288_ORDERED_PAIR_FLAGS_REQUIRED")
    if any(type(flag) is not bool for flag in pair_mask):
        raise ValueError("PAIR_FLAGS_MUST_BE_BOOLEANS")
    flags = tuple(pair_mask)
    qualified = sum(flags)
    longest = current = 0
    for flag in flags:
        current = 0 if flag else current + 1
        longest = max(longest, current)
    reasons = []
    if qualified < MINIMUM_QUALIFIED_PAIRS:
        reasons.append("INSUFFICIENT_QUALIFIED_PAIRS")
    if longest > MAXIMUM_GAP_SLOTS:
        reasons.append("EXCESSIVE_UNQUALIFIED_GAP")
    return ShadowDayCoverage(
        policy_id=POLICY_ID,
        policy_sha256=sha256_hex(canonical_json_bytes(policy_document())),
        pair_mask_sha256=sha256_hex(canonical_json_bytes(list(flags))),
        qualified_pair_count=qualified,
        longest_unqualified_run=longest,
        coverage_eligible=not reasons,
        reason_codes=tuple(reasons),
    )


def coverage_document(pair_mask: Sequence[bool], *, policy_id: str) -> dict:
    """Compact, lossless ordered mask; bit zero is the first UTC slot."""
    result = asdict(evaluate_shadow_day_coverage(pair_mask, policy_id=policy_id))
    result["reason_codes"] = list(result["reason_codes"])
    result["pair_coverage_band"] = (
        "HIGH_260_TO_288"
        if result["qualified_pair_count"] >= HIGH_COVERAGE_PAIRS
        else "ADMISSION_252_TO_259"
        if result["qualified_pair_count"] >= MINIMUM_QUALIFIED_PAIRS
        else "BELOW_252"
    )
    result["pair_mask_hex"] = f"{sum(1 << i for i, flag in enumerate(pair_mask) if flag):072x}"
    result["pair_mask_encoding"] = "SLOT_0_LSB_288_BITS_HEX"
    return result


def validate_coverage_document(document: dict) -> None:
    _validate_coverage_document(document, {})


def _validate_coverage_document(document: dict, expected_by_mask: dict[str, bytes]) -> None:
    encoded = document.get("pair_mask_hex") if isinstance(document, dict) else None
    if not isinstance(encoded, str) or re.fullmatch(r"[0-9a-f]{72}", encoded) is None:
        raise ValueError("COVERAGE_MASK_ENCODING")
    expected = expected_by_mask.get(encoded)
    if expected is None:
        bits = int(encoded, 16)
        mask = [bool(bits & (1 << i)) for i in range(EXPECTED_SLOTS)]
        expected = canonical_json_bytes(coverage_document(mask, policy_id=POLICY_ID))
        # Bound memory even with arbitrary distinct masks; no cache escapes the
        # validation call and values derive from the policy, never input claims.
        if len(expected_by_mask) >= 128:
            expected_by_mask.clear()
        expected_by_mask[encoded] = expected
    # Canonical comparison also rejects 0/1 masquerading as bools in JSON.
    if canonical_json_bytes(document) != expected:
        raise ValueError("COVERAGE_DIAGNOSTIC_DRIFT")


def coverage_binding(*, policy_id: str, cohort_sha256: str) -> dict:
    if policy_id != POLICY_ID:
        raise ValueError("EXPLICIT_NEXT_SHADOW_COVERAGE_POLICY_REQUIRED")
    if not isinstance(cohort_sha256, str) or re.fullmatch(r"[0-9a-f]{64}", cohort_sha256) is None:
        raise ValueError("COVERAGE_COHORT_HASH_REQUIRED")
    return {"policy_id": policy_id,
            "policy_sha256": sha256_hex(canonical_json_bytes(policy_document())),
            "cohort_policy_sha256": cohort_sha256}


def capture_mask_document(capture_mask: Sequence[bool]) -> dict:
    if not isinstance(capture_mask, (tuple, list)) or len(capture_mask) != EXPECTED_SLOTS:
        raise ValueError("EXACT_288_ORDERED_CAPTURE_FLAGS_REQUIRED")
    if any(type(flag) is not bool for flag in capture_mask):
        raise ValueError("CAPTURE_FLAGS_MUST_BE_BOOLEANS")
    flags = tuple(capture_mask)
    return {
        "capture_slot_mask_hex": f"{sum(1 << i for i, flag in enumerate(flags) if flag):072x}",
        "capture_slot_mask_sha256": sha256_hex(canonical_json_bytes(list(flags))),
        "capture_slot_mask_encoding": "SLOT_0_LSB_288_BITS_HEX",
    }


def _validated_capture_mask(document: dict) -> tuple[bool, ...]:
    encoded = document.get("capture_slot_mask_hex") if isinstance(document, dict) else None
    if not isinstance(encoded, str) or re.fullmatch(r"[0-9a-f]{72}", encoded) is None:
        raise ValueError("CAPTURE_MASK_ENCODING")
    bits = int(encoded, 16)
    mask = tuple(bool(bits & (1 << i)) for i in range(EXPECTED_SLOTS))
    expected = capture_mask_document(mask)
    if any(document.get(key) != value for key, value in expected.items()):
        raise ValueError("CAPTURE_MASK_DRIFT")
    return mask


def validate_daily_coverage(document: dict, *, binding: dict) -> None:
    """Recheck diagnostics and cohort before rolling input, admission or readback.

    This verifies internal consistency, not the underlying captured provenance.
    Raw slot verification remains the source adapter's responsibility.
    """
    if (document.get("schema_version") != DAILY_VERSION
            or document.get("parameter_set_version") != PARAMETER_VERSION
            or document.get("coverage_binding") != binding
            or document.get("coverage_policy_status") != "ADOPTED_NEXT_SHADOW_ONLY"):
        raise ValueError("DAILY_COVERAGE_BINDING_DRIFT")
    capture_mask = _validated_capture_mask(document)
    slot_count = document.get("slot_count")
    if (type(slot_count) is not int
            or not 1 <= slot_count <= EXPECTED_SLOTS
            or sum(capture_mask) != slot_count
            or document.get("expected_slot_count") != EXPECTED_SLOTS
            or document.get("missing_capture_slot_count") != EXPECTED_SLOTS - slot_count
            or document.get("daily_bucket_complete") is not (slot_count == EXPECTED_SLOTS)
            or document.get("partial_capture_accepted") is not (slot_count < EXPECTED_SLOTS)):
        raise ValueError("DAILY_CAPTURE_COVERAGE_DRIFT")
    capture_bits = int(document["capture_slot_mask_hex"], 16)
    expected_by_mask: dict[str, bytes] = {}
    for row in document["features"]:
        coverage = row.get("coverage")
        _validate_coverage_document(coverage, expected_by_mask)
        pair_bits = int(coverage["pair_mask_hex"], 16)
        if pair_bits & ~capture_bits:
            raise ValueError("PAIR_MASK_OUTSIDE_CAPTURE_MASK")
        if (coverage["qualified_pair_count"] != row.get("qualified_pair_observation_count")
                or type(row.get("qualified_pair_observation_count")) is not int):
            raise ValueError("COVERAGE_PAIR_COUNT_DRIFT")
        if (row.get("coverage_policy_status") != "ADOPTED_NEXT_SHADOW_ONLY"
                or type(row.get("recent_coverage_eligible")) is not bool):
            raise ValueError("COVERAGE_ROW_POLICY_DRIFT")
        if not row["recent_coverage_eligible"] and row["signals"]["RECENT_PERSISTENT"] != "UNKNOWN":
            raise ValueError("RECENT_COVERAGE_SIGNAL_BYPASS")
        if not coverage["coverage_eligible"] and (
                set(row["signals"].values()) != {"UNKNOWN"}
                or row.get("signal_input_eligibility") != "WITHHELD_COVERAGE"):
            raise ValueError("COVERAGE_SIGNAL_BYPASS")
