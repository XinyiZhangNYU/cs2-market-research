"""Evidence-bound source absence diagnostics, separate from shared EOD policy.

The EOD lineage commits every observed source fact, including visible listings.
Requiring the exact list prevents a caller from dropping inconvenient slots.
This module classifies absence; it does not authorize any fallback reason.
"""
from __future__ import annotations

from collections import Counter
from datetime import date, datetime, time, timedelta, UTC
from enum import StrEnum
from typing import Any, Iterable, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.feature_input.market_sector_eod_v3 import _slot_fact_from_document
from .models import require


class SourceAvailabilityReason(StrEnum):
    QUALIFIED = "QUALIFIED"
    NO_ACTIVE_ASK = "NO_ACTIVE_ASK"
    QUOTE_VALUE_MISSING_OR_INVALID = "QUOTE_VALUE_MISSING_OR_INVALID"
    SOURCE_REFRESH_LAG = "SOURCE_REFRESH_LAG"
    MISSING_SOURCE_CLOCK = "MISSING_SOURCE_CLOCK"
    TEMPORAL_VIOLATION = "TEMPORAL_VIOLATION"
    INSUFFICIENT_SLOTS = "INSUFFICIENT_SLOTS"
    CONTRACT_MISMATCH = "CONTRACT_MISMATCH"


def classify_source_slots(
    documents: Iterable[Mapping[str, Any]], *, analysis_unit_id: str,
    source_code: str, day: date, maximum_age_minutes: int = 15,
    minimum_slots: int = 9,
) -> dict[str, Any]:
    """Classify validated V3 facts without inferring liquidity from listings.

    Invalid/unknown clocks or ambiguous quote values cannot justify fallback.
    A positive quote with zero visible listings is contradictory, not absence.
    The nine-slot requirement is inherited from the current EOD contract.
    """
    require(type(maximum_age_minutes) is int and maximum_age_minutes > 0, "TIER_MAX_AGE")
    require(type(minimum_slots) is int and 1 <= minimum_slots <= 12, "TIER_MIN_SLOTS")
    rows = tuple(sorted((_slot_fact_from_document(dict(d)) for d in documents), key=lambda r: r.slot_at))
    require(len(rows) <= 12 and len({r.slot_at for r in rows}) == len(rows), "TIER_DUPLICATE_SLOT")
    end = datetime.combine(day + timedelta(days=1), time.min, tzinfo=UTC)
    require(all(end - timedelta(hours=1) <= r.slot_at < end for r in rows), "TIER_SLOT_DAY")
    require(all(r.analysis_unit_id == analysis_unit_id and r.logical_source == source_code for r in rows),
            "TIER_SOURCE_IDENTITY")
    require(len({(r.identity_sha256, r.membership_sha256) for r in rows}) <= 1, "TIER_SLOT_IDENTITY_DRIFT")
    counts: Counter[str] = Counter()
    for row in rows:
        # Do not turn a future updated_at into an older collected_at fallback.
        if any(t is not None and t > row.available_at for t in (row.source_updated_at, row.source_collected_at)):
            counts[SourceAvailabilityReason.TEMPORAL_VIOLATION] += 1
        elif row.source_observed_at is None:
            counts[SourceAvailabilityReason.MISSING_SOURCE_CLOCK] += 1
        elif row.ask_atoms is not None and row.ask_atoms > 0:
            if row.visible_listing_slots == 0:
                counts[SourceAvailabilityReason.CONTRACT_MISMATCH] += 1
            elif row.available_at - row.source_observed_at > timedelta(minutes=maximum_age_minutes):
                counts[SourceAvailabilityReason.SOURCE_REFRESH_LAG] += 1
            else:
                counts[SourceAvailabilityReason.QUALIFIED] += 1
        elif row.visible_listing_slots == 0:
            if row.available_at - row.source_observed_at > timedelta(minutes=maximum_age_minutes):
                # An old zero-listing observation does not establish current absence.
                counts[SourceAvailabilityReason.QUOTE_VALUE_MISSING_OR_INVALID] += 1
            else:
                counts[SourceAvailabilityReason.NO_ACTIVE_ASK] += 1
        else:
            counts[SourceAvailabilityReason.QUOTE_VALUE_MISSING_OR_INVALID] += 1
    hard = (
        SourceAvailabilityReason.TEMPORAL_VIOLATION,
        SourceAvailabilityReason.CONTRACT_MISMATCH,
        SourceAvailabilityReason.MISSING_SOURCE_CLOCK,
        SourceAvailabilityReason.QUOTE_VALUE_MISSING_OR_INVALID,
    )
    # Qualification remains a nine-slot quantity. Fallback, however, cannot
    # explain away an independently observed hard error in the remaining slots.
    if counts[SourceAvailabilityReason.QUALIFIED] >= minimum_slots:
        status = SourceAvailabilityReason.QUALIFIED
    elif any(counts[k] for k in hard):
        status = next(k for k in hard if counts[k])
    elif len(rows) < minimum_slots:
        status = SourceAvailabilityReason.INSUFFICIENT_SLOTS
    elif counts[SourceAvailabilityReason.NO_ACTIVE_ASK] >= minimum_slots:
        status = SourceAvailabilityReason.NO_ACTIVE_ASK
    elif counts[SourceAvailabilityReason.SOURCE_REFRESH_LAG] > 0 and (
        counts[SourceAvailabilityReason.QUALIFIED] + counts[SourceAvailabilityReason.SOURCE_REFRESH_LAG] >= minimum_slots
    ) and counts[SourceAvailabilityReason.NO_ACTIVE_ASK] == 0:
        status = SourceAvailabilityReason.SOURCE_REFRESH_LAG
    else:
        status = SourceAvailabilityReason.INSUFFICIENT_SLOTS
    return {
        "analysis_unit_id": analysis_unit_id, "source_code": source_code,
        "day": day.isoformat(), "maximum_age_minutes": maximum_age_minutes,
        "minimum_slots": minimum_slots, "supplied_slot_count": len(rows),
        "reason": status.value,
        "slot_reason_counts": {reason.value: counts[reason] for reason in SourceAvailabilityReason},
        "source_fact_sha256s": [r.source_fact_sha256 for r in rows],
    }


def bind_source_diagnostic(
    documents: Iterable[Mapping[str, Any]], *, proof: Any, analysis_unit_id: str,
    source_code: str, maximum_age_minutes: int = 15,
) -> dict[str, Any]:
    """Bind the exact raw fact set to a validated, immutable EOD diagnostic."""
    from .current import TrendingEodProof
    require(isinstance(proof, TrendingEodProof), "TIER_EOD_PROOF")
    documents = tuple(documents)
    diagnostic = proof.diagnostic_by_identity.get((analysis_unit_id, source_code))
    require(diagnostic is not None, "TIER_EOD_DIAGNOSTIC_MISSING")
    result = classify_source_slots(documents, analysis_unit_id=analysis_unit_id,
        source_code=source_code, day=proof.bucket_date, maximum_age_minutes=maximum_age_minutes)
    require(result["supplied_slot_count"] == diagnostic["supplied_slot_count"], "TIER_EOD_SLOT_COUNT")
    identities = {d["identity_sha256"] for d in documents}
    require(len(identities) == 1, "TIER_RAW_IDENTITY_REQUIRED")
    require(all(d["membership_sha256"] == proof.upstream_membership_sha256 for d in documents),
            "TIER_EOD_MEMBERSHIP")
    lineage = sha256_hex(canonical_json_bytes({
        "facts": result["source_fact_sha256s"], "identity_sha256": next(iter(identities)),
        "source": source_code, "status": diagnostic["status"],
    }))
    require(lineage == diagnostic["lineage_sha256"], "TIER_EOD_LINEAGE_DRIFT")
    require(all(datetime.fromisoformat(d["available_at"].replace("Z", "+00:00")) <= proof.reduced_at
                for d in documents), "TIER_RAW_AFTER_REDUCTION")
    return {**result, "eod_artifact_sha256": proof.artifact_sha256,
            "original_eod_status": diagnostic["status"], "lineage_sha256": lineage}
