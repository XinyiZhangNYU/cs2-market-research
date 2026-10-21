"""Versioned source-tiered candidates over the existing evidence-bound ledger.

No default fallback authorization is supplied. A policy explicitly names each
allowed absence reason. Every missing endpoint is replayed from the original
EOD lineage and the source's historical identity, never from a caller's label.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from fractions import Fraction
import hashlib
from typing import Any, Iterable, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from .availability import bind_source_diagnostic
from .current import TrendingEodProof, _validate_eod_projection
from .formal import (EXPECTED_SOURCES, TrendingCandidateLedger, TrendingSourceLeg,
                     _measurement, _utc, build_trending_candidate_ledger)
from .models import parse_timestamp, require, require_sha256, require_text


GRADES = ("THREE_SOURCE_CONFIRMED", "TWO_SOURCE_SUPPORTED", "CONFLICTED", "WITHHELD_DATA_INCOMPLETE")
FALLBACK_REASONS = frozenset({"NO_ACTIVE_ASK", "SOURCE_REFRESH_LAG"})
SCHEMA = "single-item-trending-tiered-candidate/2"
MEASUREMENT_DELTA_KEYS = (
    "measurement_id", "schema_version", "analysis_unit_id", "segment", "status",
    "direction", "conservative_source_code", "conservative_change_numerator",
    "conservative_change_denominator", "conservative_same_direction_change_floor_ratio",
    "evidence_grade", "supporting_sources", "unavailable_sources",
    "fallback_evidence_qualified", "tiering_policy_id",
)


def _sealed(body: Mapping[str, Any], key: str) -> dict[str, Any]:
    return {key: sha256_hex(canonical_json_bytes(dict(body))), **body}


def measurement_identity_reference(
    ordinal: int, measurement: Mapping[str, Any]
) -> dict[str, Any]:
    """Commit one exact measurement without repeating its large document."""
    require(type(ordinal) is int and ordinal > 0, "TIER_MEASUREMENT_ORDINAL")
    measurement_id = measurement.get("measurement_id")
    require_sha256(measurement_id, "TIER_MEASUREMENT_IDENTITY")
    return {"candidate_ordinal": ordinal, "measurement_id": measurement_id}


def measurement_identity_set_hash(
    measurements: Iterable[Mapping[str, Any]],
) -> str:
    """Hash the ordered identities of exact, individually sealed rows."""
    digest = hashlib.sha256()
    for ordinal, measurement in enumerate(measurements, 1):
        digest.update(canonical_json_bytes(measurement_identity_reference(ordinal, measurement)))
    return digest.hexdigest()


def tiered_candidate_id(candidate_header_body: Mapping[str, Any]) -> str:
    """Content-address a bounded header whose set hash commits every row."""
    require("candidate_id" not in candidate_header_body
            and "measurements" not in candidate_header_body, "TIER_CANDIDATE_HEADER")
    return sha256_hex(canonical_json_bytes(dict(candidate_header_body)))


@dataclass(frozen=True)
class TrendingTieringPolicy:
    policy_code: str
    available_at: datetime
    numeric_profile_id: str
    allowed_missing_reasons: tuple[str, ...] = ()
    maximum_quote_age_minutes: int = 15
    formal_policy_approved: bool = False
    minimum_supported_endpoint_ratio_bps: int | None = None

    def __post_init__(self) -> None:
        require_text(self.policy_code, "TIER_POLICY_CODE")
        _utc(self.available_at, "TIER_POLICY_CLOCK")
        require_sha256(self.numeric_profile_id, "TIER_POLICY_NUMERIC_PROFILE")
        require(type(self.allowed_missing_reasons) is tuple
                and self.allowed_missing_reasons == tuple(sorted(set(self.allowed_missing_reasons)))
                and set(self.allowed_missing_reasons) <= FALLBACK_REASONS, "TIER_POLICY_REASONS")
        # The bound EOD proof is currently the frozen 15-minute policy. A new
        # freshness rule needs a matching reducer/proof version, not just a label.
        require(type(self.maximum_quote_age_minutes) is int and self.maximum_quote_age_minutes == 15,
                "TIER_POLICY_AGE")
        require(type(self.formal_policy_approved) is bool, "TIER_POLICY_APPROVAL")
        require(self.minimum_supported_endpoint_ratio_bps is None or (
            type(self.minimum_supported_endpoint_ratio_bps) is int
            and 0 <= self.minimum_supported_endpoint_ratio_bps <= 10000), "TIER_POLICY_COVERAGE")
        require(not self.formal_policy_approved or self.minimum_supported_endpoint_ratio_bps is not None,
                "TIER_FORMAL_COVERAGE_REQUIRED")

    def to_document(self) -> dict[str, Any]:
        return _sealed({"schema_version": "single-item-trending-tiering-policy/1",
            "policy_code": self.policy_code, "available_at": utc_timestamp_text(self.available_at),
            "numeric_profile_id": self.numeric_profile_id,
            "allowed_missing_reasons": list(self.allowed_missing_reasons),
            "maximum_quote_age_minutes": self.maximum_quote_age_minutes,
            "minimum_qualified_slots": 9, "expected_slots": 12,
            "formal_policy_approved": self.formal_policy_approved,
            "minimum_supported_endpoint_ratio_bps": self.minimum_supported_endpoint_ratio_bps}, "policy_id")


@dataclass(frozen=True)
class TrendingTieredCandidate:
    baseline: TrendingCandidateLedger
    policy: TrendingTieringPolicy
    document: Mapping[str, Any]
    evidence_document: Mapping[str, Any]


def measurement_delta(
    measurement: Mapping[str, Any], baseline: Mapping[str, Any]
) -> dict[str, Any]:
    """Return the fixed V3 overlay and prove it reconstructs the exact row."""
    delta = {key: measurement[key] for key in MEASUREMENT_DELTA_KEYS}
    require({**dict(baseline), **delta} == dict(measurement), "TIER_MEASUREMENT_DELTA")
    return delta


def _build_tiered_measurement(
    *,
    member: Any,
    baseline: TrendingCandidateLedger,
    baseline_row: Mapping[str, Any],
    policy: TrendingTieringPolicy,
    start_eod_proof: TrendingEodProof,
    end_eod_proof: TrendingEodProof,
    grouped: Mapping[tuple[str, str], TrendingSourceLeg],
    source_slot_documents: Mapping[
        tuple[str, str, str], tuple[Mapping[str, Any], ...]
    ],
) -> tuple[dict[str, Any], tuple[dict[str, Any], ...]]:
    """Build one tiered row without retaining the rest of the candidate.

    The ordinary in-memory builder and the bounded streaming producer share
    this exact function so that chunking cannot silently change eligibility,
    absence evidence, identifiers, or the conservative score.
    """
    window = baseline.window_evidence
    require(window is not None and window.identity_history is not None,
            "TIER_WINDOW_REQUIRED")
    member_id = member.analysis_unit_id
    complete = tuple(s for s in EXPECTED_SOURCES if (member_id, s) in grouped)
    missing = []
    hard_failure = False
    used_proofs: list[dict[str, Any]] = []
    for source in EXPECTED_SOURCES:
        leg = grouped.get((member_id, source))
        if leg is not None:
            for side, proof in (("start", start_eod_proof), ("end", end_eod_proof)):
                require(leg.identity_binding is not None, "TIER_LEG_IDENTITY")
                _validate_eod_projection(leg.identity_binding[side]["projection"], proof)
            continue
        reasons = []
        for proof in (start_eod_proof, end_eod_proof):
            diag = proof.diagnostic_by_identity.get((member_id, source))
            if diag is not None and diag["status"] == "QUALIFIED":
                reasons.append("QUALIFIED")
                continue
            key = (proof.bucket_date.isoformat(), member_id, source)
            original = source_slot_documents.get(key)
            if not original:
                reasons.append("EVIDENCE_UNAVAILABLE")
                continue
            result = bind_source_diagnostic(
                original,
                proof=proof,
                analysis_unit_id=member_id,
                source_code=source,
                maximum_age_minutes=policy.maximum_quote_age_minutes,
            )
            receipts = []
            for observation in original:
                identity = window.identity_history.bind_source_observation(
                    analysis_unit_id=member_id,
                    source_code=source,
                    event_at=parse_timestamp(observation["slot_at"], "TIER_IDENTITY_EVENT"),
                    upstream_membership_sha256=proof.upstream_membership_sha256,
                )
                require(
                    identity["catalog_projection_sha256"]
                    == observation["identity_sha256"]
                    and identity["economic_identity_sha256"]
                    == member.economic_identity["fingerprint_sha256"],
                    "TIER_ABSENCE_ECONOMIC_IDENTITY",
                )
                receipts.append(identity)
            used_proofs.append(
                {
                    "diagnostic": result,
                    "source_facts": list(original),
                    "identities": receipts,
                }
            )
            reasons.append(
                "CONTRACT_MISMATCH"
                if diag is not None and diag["status"] == "CROSS_SOURCE_INCOHERENT"
                else result["reason"]
            )
        allowed = any(reason != "QUALIFIED" for reason in reasons) and all(
            reason == "QUALIFIED" or reason in policy.allowed_missing_reasons
            for reason in reasons
        )
        hard_failure |= not allowed
        missing.append(
            {
                "source_code": source,
                "start_reason": reasons[0],
                "end_reason": reasons[1],
            }
        )
    selected = tuple(grouped[(member_id, source)] for source in complete)
    row = dict(baseline_row)
    if len(complete) == 2:
        row = _measurement(
            analysis_unit_id=member_id,
            profile=baseline.profile,
            membership_id=baseline.membership.membership_id,
            result_as_of=baseline.result_as_of,
            evaluated_at=baseline.evaluated_at,
            legs=selected,
            window_evidence=window,
            expected_economic_identity_sha256=member.economic_identity["fingerprint_sha256"],
            expected_sources=complete,
        )
        if hard_failure and row["status"] != "CONFLICTED_DIRECTION":
            row.update(
                status="WITHHELD_SOURCE_EVIDENCE",
                direction=None,
                conservative_source_code=None,
                conservative_change_numerator=None,
                conservative_change_denominator=None,
                conservative_same_direction_change_floor_ratio=None,
            )
    grade = (
        "CONFLICTED"
        if row["status"] == "CONFLICTED_DIRECTION"
        else "THREE_SOURCE_CONFIRMED"
        if row["status"] == "ELIGIBLE_A3" and len(complete) == 3
        else "TWO_SOURCE_SUPPORTED"
        if row["status"] == "ELIGIBLE_A3" and len(complete) == 2
        else "WITHHELD_DATA_INCOMPLETE"
    )
    row.pop("measurement_id")
    row.update(
        schema_version="single-item-trending-tiered-measurement/1",
        segment="SOURCE_TIERED",
        status="ELIGIBLE_A2" if grade == "TWO_SOURCE_SUPPORTED" else row["status"],
        evidence_grade=grade,
        supporting_sources=list(complete),
        unavailable_sources=missing,
        fallback_evidence_qualified=(len(complete) == 2 and not hard_failure),
        tiering_policy_id=policy.to_document()["policy_id"],
    )
    return _sealed(row, "measurement_id"), tuple(used_proofs)


def build_tiered_candidate(
    *, baseline: TrendingCandidateLedger, policy: TrendingTieringPolicy,
    start_eod_proof: TrendingEodProof, end_eod_proof: TrendingEodProof,
    # Keyed by (UTC date text, analysis_unit_id, logical source). Each value
    # contains ALL observed source facts for that endpoint, in original form.
    source_slot_documents: Mapping[tuple[str, str, str], tuple[Mapping[str, Any], ...]],
) -> TrendingTieredCandidate:
    require(policy.numeric_profile_id == baseline.profile.profile_id, "TIER_PROFILE_BINDING")
    require(policy.available_at <= baseline.evaluated_at, "TIER_POLICY_NOT_KNOWN")
    window = baseline.window_evidence
    require(window is not None and window.identity_history is not None
            and window.knowledge_mode == "PROSPECTIVE_PIT", "TIER_WINDOW_REQUIRED")
    require(start_eod_proof.artifact_sha256 == window.start_eod_sha256
            and end_eod_proof.artifact_sha256 == window.end_eod_sha256, "TIER_EOD_BINDING")
    require(start_eod_proof.bucket_date == window.start_date and end_eod_proof.bucket_date == window.end_date,
            "TIER_EOD_DATES")
    require(start_eod_proof.reduced_at == window.start_eod_reduced_at
            and end_eod_proof.reduced_at == window.end_eod_reduced_at, "TIER_EOD_CLOCKS")
    # Replay the entire legacy candidate, not merely its content hash.
    legs = tuple(_leg_from_document(d) for row in baseline.measurements for d in row["source_legs"])
    rebuilt = build_trending_candidate_ledger(profile=baseline.profile, membership=baseline.membership,
        source_legs=legs, result_as_of=baseline.result_as_of, evaluated_at=baseline.evaluated_at,
        window_evidence=window)
    require(rebuilt.run_document == baseline.run_document and rebuilt.measurements == baseline.measurements,
            "TIER_BASELINE_REPLAY")
    grouped = {(leg.analysis_unit_id, leg.source_code): leg for leg in legs}
    members = {m.analysis_unit_id: m for m in baseline.membership.members}
    require(all(k[0] in (window.start_date.isoformat(), window.end_date.isoformat())
                and k[1] in members and k[2] in EXPECTED_SOURCES for k in source_slot_documents),
            "TIER_EVIDENCE_OUTSIDE_WINDOW")
    rows = []
    used_proofs = []
    baseline_rows = {r["analysis_unit_id"]: r for r in baseline.measurements}
    for member in baseline.membership.members:
        row, proofs = _build_tiered_measurement(
            member=member,
            baseline=baseline,
            baseline_row=baseline_rows[member.analysis_unit_id],
            policy=policy,
            start_eod_proof=start_eod_proof,
            end_eod_proof=end_eod_proof,
            grouped=grouped,
            source_slot_documents=source_slot_documents,
        )
        rows.append(row)
        used_proofs.extend(proofs)
    rankings = {}
    eligible = [r for r in rows if r["evidence_grade"] in GRADES[:2]]
    for direction in ("GAINERS", "LOSERS"):
        selected = [r for r in eligible if r["direction"] == direction]
        selected.sort(key=lambda r: ((-1 if direction == "GAINERS" else 1) * Fraction(
            r["conservative_change_numerator"], r["conservative_change_denominator"]), r["analysis_unit_id"]))
        rankings[direction] = [{"rank": n, "measurement_id": r["measurement_id"],
                               "analysis_unit_id": r["analysis_unit_id"]} for n, r in enumerate(selected, 1)]
    counts = Counter(r["evidence_grade"] for r in rows)
    input_statuses = {"ELIGIBLE_A3", "ELIGIBLE_A2", "CONFLICTED_DIRECTION", "FLAT_OR_ZERO_CONFLICT", "WITHHELD_MICROPRICE"}
    qualified_two = sum(len(r["source_legs"]) == 2 and r["fallback_evidence_qualified"]
                        and r["status"] in input_statuses
                        and all(l["start_cny_minor"] > 0 and l["end_cny_minor"] > 0 for l in r["source_legs"])
                        for r in rows)
    qualified_three = baseline.run_document["qualified_three_source_endpoint_count"]
    reason_counts = {s: Counter() for s in EXPECTED_SOURCES}
    for row in rows:
        for missing in row["unavailable_sources"]:
            for side in ("start_reason", "end_reason"):
                reason_counts[missing["source_code"]][missing[side]] += 1
    accounting = {k: baseline.run_document[k] for k in ("member_count", "three_source_endpoint_count",
        "three_source_endpoint_ratio_bps", "qualified_three_source_endpoint_count", "qualified_three_source_endpoint_ratio_bps")}
    accounting.update(qualified_two_source_endpoint_count=qualified_two,
        qualified_supported_endpoint_count=qualified_two + qualified_three,
        qualified_supported_endpoint_ratio_bps=(qualified_two + qualified_three) * 10000 // len(rows),
        three_source_confirmed_count=counts["THREE_SOURCE_CONFIRMED"],
        two_source_supported_count=counts["TWO_SOURCE_SUPPORTED"],
        direction_eligible_count=len(eligible), direction_eligible_ratio_bps=len(eligible) * 10000 // len(rows),
        eligible_count=len(eligible), excluded_count=len(rows) - len(eligible),
        status_counts={k: sum(r["status"] == k for r in rows) for k in (
            *baseline.run_document["status_counts"], "ELIGIBLE_A2", "WITHHELD_SOURCE_EVIDENCE")},
        source_endpoint_reason_counts={s: dict(sorted(c.items())) for s, c in reason_counts.items()})
    evidence = _sealed({"schema_version": "single-item-trending-tiering-evidence/1",
        "start_eod_proof": start_eod_proof.to_document(), "end_eod_proof": end_eod_proof.to_document(),
        "source_absence_proofs": used_proofs}, "evidence_id")
    body = {"schema_version": SCHEMA, "baseline_candidate_id": baseline.run_document["candidate_ledger_id"],
        "policy": policy.to_document(), "evidence_id": evidence["evidence_id"],
        "member_count": len(rows), "grade_counts": {grade: counts[grade] for grade in GRADES},
        "accounting": accounting,
        "eligible_count": len(eligible), "excluded_count": len(rows) - len(eligible),
        "measurement_set_sha256": measurement_identity_set_hash(rows), "rankings": rankings,
        "formal_publication_eligible": False, "public_state_published": False}
    document = {"candidate_id": tiered_candidate_id(body), **body, "measurements": rows}
    return TrendingTieredCandidate(baseline, policy, document, evidence)


def validate_tiered_candidate(candidate: TrendingTieredCandidate) -> None:
    """Reconstruct the candidate and evidence before storage or public projection."""
    evidence = candidate.evidence_document
    slots = {}
    for proof in evidence["source_absence_proofs"]:
        d = proof["diagnostic"]
        key = (d["day"], d["analysis_unit_id"], d["source_code"])
        require(key not in slots, "TIER_DUPLICATE_ABSENCE_PROOF")
        slots[key] = tuple(proof["source_facts"])
    rebuilt = build_tiered_candidate(baseline=candidate.baseline, policy=candidate.policy,
        start_eod_proof=TrendingEodProof.from_document(evidence["start_eod_proof"]),
        end_eod_proof=TrendingEodProof.from_document(evidence["end_eod_proof"]), source_slot_documents=slots)
    require(rebuilt.document == candidate.document and rebuilt.evidence_document == evidence, "TIER_CANDIDATE_REPLAY")


def _leg_from_document(value: Mapping[str, Any]) -> TrendingSourceLeg:
    from datetime import date
    from .formal import TrendingAnomalyStatus
    leg = TrendingSourceLeg(**{k: v for k, v in value.items() if k not in {
        "start_date", "end_date", "available_at", "endpoint_observed_at", "anomaly_status",
        "change_numerator", "change_denominator", "change_ratio"}},
        start_date=date.fromisoformat(value["start_date"]), end_date=date.fromisoformat(value["end_date"]),
        available_at=parse_timestamp(value["available_at"], "TIER_LEG_KNOWN"),
        endpoint_observed_at=None if value["endpoint_observed_at"] is None else parse_timestamp(value["endpoint_observed_at"], "TIER_LEG_OBSERVED"),
        anomaly_status=TrendingAnomalyStatus(value["anomaly_status"]))
    require(leg.to_document() == value, "TIER_LEG_REPLAY")
    return leg
