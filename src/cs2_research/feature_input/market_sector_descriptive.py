"""Approved descriptive statistics; offline, not a publication/forecast policy.

The input remains a validated EOD + FX batch. This module does not relax the
9/12, 15-minute source gate or invent missing prices. Legacy V3 artifacts are
never rewritten. Production needs a separate trusted input/ledger binding.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, replace
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal, localcontext
import json
from typing import Iterable, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from .market_sector_cny_v3 import V3CnyProjectionBatch
from .market_sector_daily_v1 import FROZEN_END_OF_DAY_REDUCTION_POLICY_V1
from .market_sector_daily_v3 import (
    V3DailyPriceFrame, V3FusedMemberAsk, V3MemberPriceStatus,
    build_v3_daily_scope_measurement, v3_price_frame_document,
    GROSS_ERROR_RATIO_LIMIT_V3,
)
from .market_sector_eod_v3 import (
    V3EndOfDayReduction, load_v3_end_of_day_reduction,
    v3_end_of_day_reduction_document,
)
from .market_sector_precise_cny import PRECISE_UNIT, build_precise_cny_frame
from .market_sector_taxonomy_v3 import TaxonomyMembershipV3


def descriptive_policy_document() -> dict:
    # A new policy/version is required to change any adopted value.
    return {
        "schema": "market-sector-descriptive-policy/1",
        "authority": "USER_APPROVED_2026_09_08",
        "purpose": "CURRENT_TREND_STATISTICS_NOT_FORECAST",
        "currency_unit": PRECISE_UNIT,
        "minimum_logical_sources": 1,
        "minimum_supplied_eod_slots": 9,
        "high_coverage_bps": 9000,
        "partial_coverage_bps": 7000,
        "historical_headline_max_missing_days": 3,
        "eod_policy_sha256": FROZEN_END_OF_DAY_REDUCTION_POLICY_V1.policy_sha256,
        "return_rule": "ADJACENT_UTC_DAY_IDENTICAL_MEMBER_AND_SOURCE_SET",
        "fusion_rule": "ONE_SOURCE_VALUE_TWO_SOURCE_MEAN_THREE_SOURCE_MEDIAN",
        "robust_rule": "SYMMETRIC_1_PERCENT_WINSOR_MINIMUM_ONE_HUNDRED",
        "missing_price_imputation": "NONE",
        "historical_value_use": "DISPLAY_ONLY_NEVER_RETURN_INPUT",
        "automatic_promotion": False,
    }


POLICY_SHA256 = sha256_hex(canonical_json_bytes(descriptive_policy_document()))
EVIDENCE_MODES = frozenset({"UNKNOWN", "FIXTURE", "SYSTEMATIC"})
SOURCE_BINDING_LEVELS = frozenset({
    "UNVERIFIED_FRAME", "RAW_REPLAY_VERIFIED", "POST_HOC_RAW_RECONSTRUCTED",
    "POST_HOC_RAW_RECONSTRUCTED_PARTIAL_USABLE",
})


def _require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError("DESCRIPTIVE_" + reason)


def _utc(value: datetime) -> datetime:
    _require(isinstance(value, datetime) and value.tzinfo is not None
             and value.utcoffset() == timedelta(0), "UTC_REQUIRED")
    return value


def _membership_binding(membership: TaxonomyMembershipV3) -> str:
    # Includes actual typed members as well as the source document; an unchanged
    # ID string cannot hide changed identity/taxonomy/denominator.
    return sha256_hex(canonical_json_bytes({
        "membership_id": membership.membership_id,
        "sealed_at": utc_timestamp_text(membership.sealed_at),
        "document": dict(membership.document),
        "members": [m.document() for m in membership.members],
    }))


def _frame_document(frame: V3DailyPriceFrame) -> dict:
    doc = v3_price_frame_document(frame)
    doc["schema"] = "market-sector-descriptive-price-frame/1"
    doc["currency_unit"] = PRECISE_UNIT
    for row in doc["members"]:
        row["fused_ask_cny_major"] = row.pop("fused_ask_atoms")
    return doc


@dataclass(frozen=True)
class DescriptiveFrame:
    frame: V3DailyPriceFrame
    membership_binding_sha256: str
    parent_precise_sha256: str
    policy_sha256: str
    evidence_class: str
    document_sha256: str
    evidence_mode: str = "UNKNOWN"
    source_binding_level: str = "UNVERIFIED_FRAME"
    source_binding_sha256: str | None = None

    def source_evidence(self) -> dict:
        return {"evidence_mode": self.evidence_mode, "binding_level": self.source_binding_level,
                "binding_sha256": self.source_binding_sha256,
                "provider_provenance_authenticated": False}

    def body(self) -> dict:
        return {
            "schema": "market-sector-descriptive-frame/2",
            "policy_sha256": self.policy_sha256,
            "membership_binding_sha256": self.membership_binding_sha256,
            "parent_precise_sha256": self.parent_precise_sha256,
            "evidence_class": self.evidence_class,
            "source_evidence": self.source_evidence(),
            "price_frame": _frame_document(self.frame),
            "publication_eligible": False,
        }

    def document(self) -> dict:
        return {**self.body(), "document_sha256": self.document_sha256}


def bind_source_evidence(frame: DescriptiveFrame, *, membership, evidence_mode: str,
                         binding_level: str, binding_sha256: str | None) -> DescriptiveFrame:
    """Label verifier output; does not itself verify or authenticate a source.

    Admission/reconstruction callers must complete their pinned replay first.
    A standalone frame reader treats these labels as claims, not replay proof.
    """
    _validate_frame(membership, frame)
    candidate = replace(frame, evidence_mode=evidence_mode, source_binding_level=binding_level,
                        source_binding_sha256=binding_sha256)
    candidate = replace(candidate, document_sha256=sha256_hex(canonical_json_bytes(candidate.body())))
    _validate_frame(membership, candidate)
    return candidate


def _pair_source_evidence(previous: DescriptiveFrame, current: DescriptiveFrame) -> dict:
    levels = sorted({previous.source_binding_level, current.source_binding_level})
    return {"evidence_modes": sorted({previous.evidence_mode, current.evidence_mode}),
            "binding_levels": levels,
            "minimum_binding": "UNVERIFIED_FRAME" if "UNVERIFIED_FRAME" in levels else "RAW_BOUND",
            "previous": {"frame_sha256": previous.document_sha256, **previous.source_evidence()},
            "current": {"frame_sha256": current.document_sha256, **current.source_evidence()},
            "provider_provenance_authenticated": False}


def build_descriptive_frame(*, membership: TaxonomyMembershipV3,
                            batch: V3CnyProjectionBatch,
                            reduction: V3EndOfDayReduction,
                            allow_pre_seal_replay: bool = False) -> DescriptiveFrame:
    """Preserve source admission; refusion permits ONE qualified source.

    Structural checks do not independently authenticate a provider. A real
    caller must verify the original trusted result/provenance chain first.
    """
    payload = canonical_json_bytes(v3_end_of_day_reduction_document(reduction))
    checked = load_v3_end_of_day_reduction(
        payload, expected_sha256=batch.source_reduction_sha256,
        membership=membership, membership_sha256=batch.membership_sha256)
    _require(checked.reduction_id == batch.source_reduction_id
             and batch.valuation_as_of == checked.reduced_at
             and batch.frame.bucket_date == checked.bucket_date, "REDUCTION_BATCH_BINDING")
    _require(9 <= checked.supplied_slot_count <= 12, "EOD_SLOT_COUNT")
    _require(batch.schema_sha256 == membership.document["input_hashes"]["schema"],
             "SCHEMA_BINDING")
    original = {(f.analysis_unit_id, f.logical_source): f for f in checked.source_facts}
    diagnostics = {(d.analysis_unit_id, d.logical_source): d for d in checked.diagnostics}
    for key, fact in original.items():
        diagnostic = diagnostics[key]
        _require(9 <= diagnostic.positive_fresh_slot_count <= diagnostic.supplied_slot_count <= 12
                 and diagnostic.positive_fresh_slot_count + diagnostic.stale_slot_count <= diagnostic.supplied_slot_count
                 and diagnostic.positive_fresh_slot_count + diagnostic.missing_source_clock_slot_count <= diagnostic.supplied_slot_count
                 and diagnostic.positive_fresh_slot_count + diagnostic.invalid_or_missing_ask_slot_count <= diagnostic.supplied_slot_count
                 and diagnostic.reduced_ask_atoms == fact.ask_atoms, "EOD_SOURCE_QUALIFICATION")
    seen = set()
    for projection in batch.projections:
        source = projection["source"]
        key = (source["analysis_unit_id"], source["logical_source"])
        fact = original.get(key)
        _require(fact is not None and key not in seen, "SOURCE_ACCOUNTING")
        _require(source["source_fact_sha256"] == fact.source_fact_sha256
                 and source["currency"] == "USD" and source["scale"] == 8
                 and source["value"] == str(fact.ask_atoms), "SOURCE_REDUCTION_BINDING")
        seen.add(key)
    _require(seen == set(original), "SOURCE_ACCOUNTING")
    precise = build_precise_cny_frame(membership=membership, batch=batch)
    grouped: dict[str, list[Mapping]] = {}
    for row in precise.source_rows:
        grouped.setdefault(row["analysis_unit_id"], []).append(row)
    outputs = []
    with localcontext() as ctx:
        ctx.prec = 50
        for member in membership.members:
            rows = sorted(grouped.get(member.analysis_unit_id, []), key=lambda r: r["logical_source"])
            values = sorted(Decimal(r["exact_cny_major"]) for r in rows)
            _require(all(v.is_finite() and v > 0 for v in values), "INVALID_PRICE")
            value = (None if not values else values[len(values)//2] if len(values) % 2
                     else (values[len(values)//2-1] + values[len(values)//2]) / 2)
            outputs.append(V3FusedMemberAsk(
                member.analysis_unit_id, member.identity_sha256,
                V3MemberPriceStatus.QUALIFIED if values else V3MemberPriceStatus.INSUFFICIENT_SOURCES,
                value, tuple(r["logical_source"] for r in rows),
                ("NO_QUALIFIED_SOURCE" if not values else
                 "SINGLE_SOURCE_REDUCED_CROSS_VALIDATION" if len(values) == 1 else "MULTI_SOURCE",),
                sha256_hex(canonical_json_bytes({"rows": rows, "policy": POLICY_SHA256,
                                               "identity": member.identity_sha256})),
            ))
    frame = replace(precise.frame, members=tuple(outputs))
    _require(type(allow_pre_seal_replay) is bool, "REPLAY_FLAG_TYPE")
    candidate = DescriptiveFrame(frame, _membership_binding(membership),
        precise.document()["document_sha256"], POLICY_SHA256,
        "POST_HOC_PRE_SEAL_REPLAY" if allow_pre_seal_replay else "POST_SEAL_OFFLINE_VALIDATION", "")
    candidate = replace(candidate, document_sha256=sha256_hex(canonical_json_bytes(candidate.body())))
    _validate_frame(membership, candidate)
    return candidate


def _validate_frame(membership: TaxonomyMembershipV3, wrapper: DescriptiveFrame) -> None:
    _require(isinstance(wrapper, DescriptiveFrame), "NEW_UNIT_WRAPPER_REQUIRED")
    _require(wrapper.policy_sha256 == POLICY_SHA256, "POLICY_DRIFT")
    _require(isinstance(wrapper.evidence_mode, str) and wrapper.evidence_mode in EVIDENCE_MODES,
             "EVIDENCE_MODE")
    _require(isinstance(wrapper.source_binding_level, str)
             and wrapper.source_binding_level in SOURCE_BINDING_LEVELS, "SOURCE_BINDING_LEVEL")
    pin = wrapper.source_binding_sha256
    if wrapper.source_binding_level == "UNVERIFIED_FRAME":
        _require(pin is None, "UNVERIFIED_BINDING_PIN")
    else:
        _require(wrapper.evidence_mode != "UNKNOWN" and isinstance(pin, str) and len(pin) == 64
                 and all(c in "0123456789abcdef" for c in pin), "SOURCE_BINDING_PIN")
    _require(wrapper.document_sha256 == sha256_hex(canonical_json_bytes(wrapper.body())),
             "FRAME_DIGEST_DRIFT")
    _require(wrapper.membership_binding_sha256 == _membership_binding(membership), "MEMBERSHIP_DRIFT")
    frame = wrapper.frame
    _require(frame.membership_id == membership.membership_id, "MEMBERSHIP_ID_DRIFT")
    _require(_utc(frame.available_at) >= datetime.combine(frame.bucket_date + timedelta(days=1),
                                                        time.min, tzinfo=UTC), "INCOMPLETE_DAY")
    _require(wrapper.evidence_class in ("POST_HOC_PRE_SEAL_REPLAY", "POST_SEAL_OFFLINE_VALIDATION"),
             "EVIDENCE_CLASS")
    _require(wrapper.evidence_class == "POST_HOC_PRE_SEAL_REPLAY"
             or datetime.combine(frame.bucket_date, time.min, tzinfo=UTC) >= membership.sealed_at,
             "DAY_BEFORE_MEMBERSHIP_SEAL")
    _require(tuple(r.analysis_unit_id for r in frame.members)
             == tuple(m.analysis_unit_id for m in membership.members), "MEMBER_ACCOUNTING")
    for row, member in zip(frame.members, membership.members):
        _require(row.identity_sha256 == member.identity_sha256, "IDENTITY_DRIFT")
        sources = row.participating_sources
        _require(sources == tuple(sorted(set(sources)))
                 and set(sources) <= set(member.source_ids_present), "SOURCE_SET_INVALID")
        if row.status is V3MemberPriceStatus.QUALIFIED:
            _require(bool(sources) and isinstance(row.fused_ask_atoms, Decimal)
                     and row.fused_ask_atoms.is_finite() and row.fused_ask_atoms > 0, "INVALID_PRICE")
        else:
            _require(row.fused_ask_atoms is None and not sources, "UNQUALIFIED_PRICE_PRESENT")


def coverage_grade(valid: int, total: int) -> str:
    _require(type(valid) is int and type(total) is int and 0 <= valid <= total and total > 0,
             "COVERAGE_COUNTS")
    if valid == 0:
        return "NO_CURRENT_PAIRS"
    # Integer comparison: no rounded percentage can cross a threshold.
    if valid * 10000 >= total * 9000:
        return "HIGH_COVERAGE_ESTIMATE"
    if valid * 10000 >= total * 7000:
        return "PARTIAL_COVERAGE_ESTIMATE"
    return "OBSERVED_SAMPLE_DETAIL_ONLY"


@dataclass(frozen=True)
class DescriptiveMeasurement:
    payload: bytes
    document_sha256: str

    def document(self) -> dict:
        _require(sha256_hex(self.payload) == self.document_sha256, "MEASUREMENT_DIGEST_DRIFT")
        return json.loads(self.payload)


def build_descriptive_measurement(*, membership: TaxonomyMembershipV3,
                                  previous: DescriptiveFrame,
                                  current: DescriptiveFrame) -> DescriptiveMeasurement:
    _validate_frame(membership, previous)
    _validate_frame(membership, current)
    with localcontext() as ctx:
        ctx.prec = 50
        # Reuse existing gap, identical-source-set, ratio quarantine and winsor
        # arithmetic. No old artifact or estimator parameter is changed.
        measured = build_v3_daily_scope_measurement(membership=membership,
            previous=previous.frame, current=current.frame)
        members = []
        for old, new, identity in zip(previous.frame.members, current.frame.members, membership.members):
            value = None
            if old.fused_ask_atoms is None or new.fused_ask_atoms is None:
                reason = "MISSING_OR_INVALID_ENDPOINT"
            elif old.participating_sources != new.participating_sources:
                reason = "SOURCE_SET_BREAK"
            else:
                ratio = new.fused_ask_atoms / old.fused_ask_atoms
                if not 1 / GROSS_ERROR_RATIO_LIMIT_V3 <= ratio <= GROSS_ERROR_RATIO_LIMIT_V3:
                    reason = "GROSS_ERROR_QUARANTINE"
                else:
                    value, reason = ratio - 1, "VALID"
            members.append({
                "analysis_unit_id": identity.analysis_unit_id,
                "identity_sha256": identity.identity_sha256,
                "item_kind": identity.item_kind, "scope_codes": list(identity.scope_codes),
                "previous_sources": list(old.participating_sources),
                "current_sources": list(new.participating_sources),
                "raw_return": None if value is None else format(value, "f"),
                "reason": reason,
            })
        by_id = {r["analysis_unit_id"]: r for r in members}
        scopes = []
        for old_scope in measured["scopes"]:
            scope = dict(old_scope)
            # The shared helper's cohort was defined by TWO mapped sources.
            # Preserve every diagnostic, but never present it as this policy's
            # one-source structural eligibility or silently change old V3.
            legacy = {k: scope.pop(k) for k in tuple(scope)
                      if k.startswith("fixed_cohort_") or k == "source_incapable_member_count"}
            scope["legacy_two_source_diagnostics"] = {"minimum_mapped_sources": 2, **legacy}
            scope_members = membership.scope_members(scope["scope_code"])
            rows = [by_id[m.analysis_unit_id] for m in scope_members]
            valid = [r for r in rows if r["reason"] == "VALID"]
            _require(len(valid) == scope["valid_return_count"], "RETURN_ACCOUNTING")
            single = sum(len(r["current_sources"]) == 1 for r in valid)
            grade = coverage_grade(len(valid), len(rows))
            selected = scope["robust_equal_member_return"] if scope["estimator_applied"] else scope["raw_equal_member_return"]
            # Existing helper calls the raw fallback "robust" at n<100. Do not
            # expose that misleading name in this new contract.
            if not scope["estimator_applied"]:
                scope["robust_equal_member_return"] = None
            for field in ("current_mean_fused_ask_atoms", "current_sum_fused_ask_atoms"):
                scope[field.replace("_atoms", "_cny_major")] = scope.pop(field)
            scope.update({
                "minimum_mapped_sources": 1,
                "source_incapable_member_count": sum(not m.source_ids_present for m in scope_members),
                "coverage_grade": grade,
                "current_headline_eligible": grade in ("HIGH_COVERAGE_ESTIMATE", "PARTIAL_COVERAGE_ESTIMATE"),
                "observed_sample_return": selected,
                "estimator_used": "WINSORIZED_EQUAL_MEMBER_RETURN" if scope["estimator_applied"] else "RAW_EQUAL_MEMBER_RETURN",
                "scope_role": "SINGLE_MEMBER_DIRECT_PRICE" if len(rows) == 1 else "DESCRIPTIVE_SAMPLE_STATISTICS",
                "single_source_pair_count": single,
                "single_source_pair_ratio": None if not valid else format(Decimal(single)/len(valid), "f"),
                "missing_by_item_kind": dict(sorted(Counter(r["item_kind"] for r in rows if r["reason"] != "VALID").items())),
                "unavailable_reason_counts": dict(sorted(Counter(r["reason"] for r in rows if r["reason"] != "VALID").items())),
                "complete_target_exact_return": scope["raw_equal_member_return"] if len(valid) == len(rows) else None,
            })
            scopes.append(scope)
    doc = {
        "schema": "market-sector-descriptive-measurement/2",
        "policy_sha256": POLICY_SHA256, "currency_unit": PRECISE_UNIT,
        "membership_id": membership.membership_id,
        "membership_binding_sha256": _membership_binding(membership),
        "previous_frame_sha256": previous.document_sha256,
        "current_frame_sha256": current.document_sha256,
        "previous_bucket_date": previous.frame.bucket_date.isoformat(),
        "bucket_date": current.frame.bucket_date.isoformat(),
        "available_at": utc_timestamp_text(current.frame.available_at),
        "scopes": scopes, "members": members,
        "source_evidence": _pair_source_evidence(previous, current),
        "evidence_class": ("POST_HOC_PRE_SEAL_REPLAY" if "POST_HOC_PRE_SEAL_REPLAY" in
            (previous.evidence_class, current.evidence_class) else "POST_SEAL_OFFLINE_VALIDATION"),
        "forecast_efficacy_claimed": False, "formal_state_eligible": False,
        "publication_eligible": False, "automatic_promotion": False,
    }
    payload = canonical_json_bytes(doc)
    return DescriptiveMeasurement(payload, sha256_hex(payload))


def select_descriptive_display(*, measurements: Iterable[DescriptiveMeasurement],
                               membership: TaxonomyMembershipV3, scope_code: str,
                               expected_bucket_date: date, as_of: datetime,
                               allow_pre_seal_replay: bool = False) -> dict:
    """Pick a dated display value, NEVER construct an imputed price/return.

    expected_bucket_date is the newest complete UTC bucket due from the caller's
    schedule. No grace period is silently introduced here. Already sealed price
    returns must be chained by a separate append-only runtime, not this selector.
    """
    _utc(as_of)
    _require(type(allow_pre_seal_replay) is bool, "REPLAY_FLAG_TYPE")
    _require(expected_bucket_date < as_of.date(), "EXPECTED_DAY_NOT_COMPLETE")
    _require(bool(membership.scope_members(scope_code)), "UNKNOWN_SCOPE")
    measurements = tuple(measurements)
    binding = _membership_binding(membership)
    rows = {}
    documents = {}
    for result in measurements:
        _require(isinstance(result, DescriptiveMeasurement), "MEASUREMENT_WRAPPER_REQUIRED")
        doc = result.document()
        _require(allow_pre_seal_replay or doc["evidence_class"] != "POST_HOC_PRE_SEAL_REPLAY", "REPLAY_NOT_CURRENT_DISPLAY_INPUT")
        _require(doc["schema"] == "market-sector-descriptive-measurement/2"
                 and doc["policy_sha256"] == POLICY_SHA256, "POLICY_DRIFT")
        _require(doc["membership_binding_sha256"] == binding, "MEMBERSHIP_DRIFT")
        day = date.fromisoformat(doc["bucket_date"])
        available = _utc(datetime.fromisoformat(doc["available_at"].replace("Z", "+00:00")))
        if available > as_of or day > expected_bucket_date:
            continue
        _require(day not in rows, "DUPLICATE_VISIBLE_DAY_REQUIRES_REVISION_POLICY")
        scope = next(s for s in doc["scopes"] if s["scope_code"] == scope_code)
        rows[day] = (scope, result.document_sha256)
        documents[result.document_sha256] = doc
    for day, (_, digest) in rows.items():
        preceding = rows.get(day-timedelta(days=1))
        if preceding:
            _require(documents[digest]["previous_frame_sha256"]
                     == documents[preceding[1]]["current_frame_sha256"], "SHARED_ENDPOINT_REPLACEMENT")
    current = rows.get(expected_bucket_date)
    eligible = [(d, s, digest) for d, (s, digest) in rows.items() if s["current_headline_eligible"]]
    eligible.sort(key=lambda r: r[0])
    latest = eligible[-1] if eligible else None
    headline, headline_day, digest, status, age = None, None, None, "NO_RECENT_STATISTIC", None
    if latest is not None:
        day, scope, digest = latest
        age = (expected_bucket_date - day).days
        if age <= 3:
            headline, headline_day = scope["observed_sample_return"], day.isoformat()
            status = scope["coverage_grade"] if age == 0 else "HISTORICAL_VALUE_DISPLAY_ONLY"
    # Exactly adjacent current observations only; a chart consumer must leave
    # missing/disqualified days as gaps rather than joining them horizontally.
    previous = rows.get(expected_bucket_date - timedelta(days=1))
    chain_matches = False
    if current and previous:
        chain_matches = (documents[current[1]]["previous_frame_sha256"]
                         == documents[previous[1]]["current_frame_sha256"])
        _require(chain_matches, "SHARED_ENDPOINT_REPLACEMENT")
    quality = None
    if headline is not None:
        selected_doc = documents[digest]
        selected_scope = next(s for s in selected_doc["scopes"] if s["scope_code"] == scope_code)
        # Exact selected measurement, never today's coverage beside an old number.
        quality = {"bucket_date": headline_day, "measurement_sha256": digest,
                   "scope": selected_scope, "source_evidence": selected_doc["source_evidence"],
                   "evidence_class": selected_doc["evidence_class"]}
    return {
        "schema": "market-sector-descriptive-display/2", "scope_code": scope_code,
        **({"calendar_basis": "POST_HOC_FIXED_MEMBERSHIP", "prospective_registration": False}
           if allow_pre_seal_replay else {}),
        "policy_sha256": POLICY_SHA256, "as_of": utc_timestamp_text(as_of),
        "expected_bucket_date": expected_bucket_date.isoformat(), "status": status,
        "headline_return": headline, "headline_bucket_date": headline_day,
        "headline_measurement_sha256": digest if headline is not None else None,
        "headline_quality": quality,
        "age_in_expected_days": age,
        "current_sample_detail": current[0] if current else None,
        "current_sample_bucket_date": expected_bucket_date.isoformat() if current else None,
        "current_sample_measurement_sha256": current[1] if current else None,
        "current_source_evidence": documents[current[1]]["source_evidence"] if current else None,
        "latest_historical_measurement_sha256": None if latest is None else latest[2],
        "connect_current_to_previous": bool(current and previous and chain_matches
            and current[0]["current_headline_eligible"] and previous[0]["current_headline_eligible"]),
        "current_trend_state": None, "historical_values_used_in_calculation": False,
        "publication_eligible": False, "automatic_promotion": False,
    }
