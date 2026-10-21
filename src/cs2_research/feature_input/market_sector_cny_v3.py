"""Offline CNY projection boundary for sealed MARKET/SECTOR V3 EOD facts.

The upstream transport supplies the three domestic logical sources in USD atoms.
This module binds each V3 member back to the exact upstream schema snapshot sealed
by the membership, projects every qualified per-source EOD ask to CNY minor
using event-day ECB evidence, and only then performs cross-source fusion.

No profile, state or publication is opened here.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import UTC, datetime, time, timedelta
import json
from typing import Any, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.fx import (
    AnalysisSourcePrice,
    EcbRateBook,
    analysis_source_from_market_sector_eod_fact,
)
from cs2_research.fx.analysis import (
    finalize_cny_analysis_projection_v2, project_analysis_price_to_cny_v2,
)

from .market_sector_daily_v3 import (
    V3DailyPriceFrame,
    V3ReducedSourceAskFact,
    build_v3_daily_price_frame,
)
from .market_sector_daily_v1 import FROZEN_END_OF_DAY_REDUCTION_POLICY_V1
from .market_sector_eod_v3 import (
    V3EndOfDayReduction,
    V3EndOfDaySourceStatus,
    v3_end_of_day_reduction_document,
)
from .market_sector_taxonomy_v3 import PROVIDER_IDS_V3, TaxonomyMembershipV3


V3_CNY_PROJECTION_BATCH_SCHEMA = "market-sector-v3-cny-projection-batch/2"
V3_CNY_PROJECTION_STATUS = "PASS_V3_COMPLETE_UTC_DAY_CNY_PRICE_FRAME"
V3_CNY_UNIT = "CNY_MINOR"
V3_CNY_SEMANTICS = "ECB_VALUED_DERIVED_CNY_NOT_NATIVE_PROVIDER_CNY"
V3_CNY_PROJECTED_AT_ROLE = "VALUATION_AND_FX_KNOWLEDGE_CUTOFF"


class MarketSectorCnyV3Error(ValueError):
    """A V3 CNY projection input violates the sealed cross-layer boundary."""


def _require(condition: bool, code: str) -> None:
    if not condition:
        raise MarketSectorCnyV3Error(code)


def _hash64(value: object, code: str) -> str:
    _require(
        isinstance(value, str)
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value),
        code,
    )
    return value


def _utc(value: datetime, code: str) -> datetime:
    _require(
        isinstance(value, datetime)
        and value.tzinfo is not None
        and value.utcoffset() == timedelta(0),
        code,
    )
    return value.astimezone(UTC)


def _strict_json(payload: bytes, code: str) -> Mapping[str, Any]:
    def pairs(values: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in values:
            _require(key not in result, f"{code}:DUPLICATE_KEY:{key}")
            result[key] = value
        return result

    try:
        document = json.loads(payload.decode("utf-8"), object_pairs_hook=pairs)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise MarketSectorCnyV3Error(f"{code}:INVALID_UTF8_JSON") from exc
    _require(isinstance(document, Mapping), f"{code}:OBJECT_REQUIRED")
    return document


def _reduced_fact_document(fact: V3ReducedSourceAskFact) -> dict[str, Any]:
    return {
        "analysis_unit_id": fact.analysis_unit_id,
        "ask_atoms": fact.ask_atoms,
        "available_at": utc_timestamp_text(fact.available_at),
        "bucket_date": fact.bucket_date.isoformat(),
        "logical_source": fact.logical_source,
        "source_fact_sha256": fact.source_fact_sha256,
    }


def load_v3_member_source_ids(
    *,
    schema_payload: bytes,
    expected_schema_sha256: str,
    membership: TaxonomyMembershipV3,
) -> Mapping[tuple[str, str], int]:
    """Load exact provider item IDs and prove agreement with the membership."""

    expected = _hash64(expected_schema_sha256, "SCHEMA_SHA256")
    _require(sha256_hex(schema_payload) == expected, "SCHEMA_HASH_DRIFT")
    input_hashes = membership.document.get("input_hashes")
    _require(
        isinstance(input_hashes, Mapping) and input_hashes.get("schema") == expected,
        "MEMBERSHIP_SCHEMA_HASH_DRIFT",
    )
    document = _strict_json(schema_payload, "SCHEMA")
    identity = membership.document.get("schema_identity")
    _require(isinstance(identity, Mapping), "MEMBERSHIP_SCHEMA_IDENTITY")
    _require(
        document.get("schema_version") == identity.get("schema_version") == "v3"
        and document.get("generation_id") == identity.get("generation_id"),
        "SCHEMA_IDENTITY_DRIFT",
    )
    items = document.get("items")
    counts = document.get("counts")
    _require(isinstance(items, Mapping) and isinstance(counts, Mapping), "SCHEMA_SHAPE")
    _require(len(items) == counts.get("items"), "SCHEMA_ITEM_COUNT_DRIFT")

    result: dict[tuple[str, str], int] = {}
    for member in membership.members:
        item = items.get(member.market_hash_name)
        _require(isinstance(item, Mapping), "SCHEMA_MEMBER_MISSING")
        if "ids" not in item:
            _require(not member.source_ids_present, "SCHEMA_MEMBER_IDS_MISSING")
            continue
        raw_ids = item["ids"]
        _require(isinstance(raw_ids, Mapping), "SCHEMA_MEMBER_IDS_MISSING")
        present = tuple(
            source
            for source in PROVIDER_IDS_V3
            if type(raw_ids.get(source)) is int and raw_ids[source] > 0
        )
        _require(present == member.source_ids_present, "SCHEMA_SOURCE_COVERAGE_DRIFT")
        for source in present:
            result[(member.analysis_unit_id, source)] = raw_ids[source]
    return result


@dataclass(frozen=True, slots=True)
class V3CnyProjectionBatch:
    valuation_as_of: datetime
    projection_computed_at: datetime
    membership_id: str
    membership_sha256: str
    schema_sha256: str
    source_reduction_id: str
    source_reduction_sha256: str
    projections: tuple[Mapping[str, Any], ...]
    converted_facts: tuple[V3ReducedSourceAskFact, ...]
    frame: V3DailyPriceFrame
    input_snapshot_sha256: str
    quantized_to_zero_count: int


def _input_snapshot_sha256(
    *, projections: tuple[Mapping[str, Any], ...], membership_sha256: str,
    schema_sha256: str, source_reduction_sha256: str, valuation_as_of: datetime,
) -> str:
    return sha256_hex(canonical_json_bytes({
        "conversion_policy": "analysis-cny-minor-half-even/1",
        "currency_unit": V3_CNY_UNIT,
        "currency_semantics": V3_CNY_SEMANTICS,
        "fx_return_included": True,
        "membership_sha256": membership_sha256,
        "projection_document_hashes": [row["document_hash"] for row in projections],
        "projected_at_role": V3_CNY_PROJECTED_AT_ROLE,
        "schema_sha256": schema_sha256,
        "source_reduction_sha256": source_reduction_sha256,
        "valuation_as_of": utc_timestamp_text(valuation_as_of),
    }))


def build_v3_cny_projection_batch(
    *,
    membership: TaxonomyMembershipV3,
    membership_sha256: str,
    reduction: V3EndOfDayReduction,
    schema_payload: bytes,
    schema_sha256: str,
    rate_book: EcbRateBook,
    projection_computed_at: datetime,
    economic_identities: Mapping[str, Mapping[str, Any]] | None = None,
) -> V3CnyProjectionBatch:
    """Project one sealed, quality-qualified V3 day to CNY before fusion."""

    membership_sha = _hash64(membership_sha256, "MEMBERSHIP_SHA256")
    _require(reduction.membership_id == membership.membership_id, "REDUCTION_MEMBERSHIP_ID")
    _require(reduction.membership_sha256 == membership_sha, "REDUCTION_MEMBERSHIP_SHA256")
    _require(9 <= reduction.supplied_slot_count <= 12, "REDUCTION_SLOT_COUNT")
    valuation_as_of = _utc(reduction.reduced_at, "VALUATION_AS_OF")
    computed_at = _utc(
        projection_computed_at,
        "PROJECTION_COMPUTED_AT",
    )
    _require(computed_at >= valuation_as_of, "PROJECTION_COMPUTED_BEFORE_VALUATION")
    day_start = datetime.combine(reduction.bucket_date, time.min, UTC)
    _require(valuation_as_of >= day_start + timedelta(days=1), "EOD_UTC_DAY_NOT_CLOSED")
    source_reduction_payload = canonical_json_bytes(
        v3_end_of_day_reduction_document(reduction)
    )
    source_reduction_sha = sha256_hex(source_reduction_payload)
    diagnostics = {(row.analysis_unit_id, row.logical_source): row
                   for row in reduction.diagnostics}
    source_ids = load_v3_member_source_ids(
        schema_payload=schema_payload,
        expected_schema_sha256=schema_sha256,
        membership=membership,
    )
    members = {member.analysis_unit_id: member for member in membership.members}
    projection_documents: list[Mapping[str, Any]] = []
    converted: list[V3ReducedSourceAskFact] = []
    quantized_to_zero_count = 0
    for fact in reduction.source_facts:
        member = members.get(fact.analysis_unit_id)
        _require(member is not None, "REDUCTION_FACT_OUTSIDE_MEMBERSHIP")
        source_item_id = source_ids.get((fact.analysis_unit_id, fact.logical_source))
        _require(type(source_item_id) is int and source_item_id > 0, "SOURCE_ITEM_ID_MISSING")
        source: AnalysisSourcePrice = analysis_source_from_market_sector_eod_fact(
            _reduced_fact_document(fact),
            source_item_id=source_item_id,
            identity_available_at=membership.sealed_at,
        )
        diagnostic = diagnostics.get((fact.analysis_unit_id, fact.logical_source))
        observation = None
        if diagnostic is not None:
            _require(diagnostic.reduced_ask_atoms == fact.ask_atoms,
                     "EOD_DIAGNOSTIC_VALUE_DRIFT")
            policy = FROZEN_END_OF_DAY_REDUCTION_POLICY_V1
            _require(reduction.policy_sha256 == policy.policy_sha256
                     and diagnostic.status is V3EndOfDaySourceStatus.QUALIFIED
                     and diagnostic.supplied_slot_count == reduction.supplied_slot_count
                     and diagnostic.positive_fresh_slot_count >= policy.minimum_qualified_slots,
                     "EOD_DIAGNOSTIC_NOT_QUALIFIED")
            observation = {
                "kind": "UTC_DAILY_EOD",
                "interval_start": utc_timestamp_text(day_start),
                "interval_end": utc_timestamp_text(day_start + timedelta(days=1)),
                "reduction_policy_sha256": reduction.policy_sha256,
                "reduction_sha256": source_reduction_sha,
                "coverage_evidence_sha256": source_reduction_sha,
                "supplied_slot_count": reduction.supplied_slot_count,
                "positive_fresh_slot_count": diagnostic.positive_fresh_slot_count,
            }
        projection = project_analysis_price_to_cny_v2(
            source,
            rate_book=rate_book,
            valuation_as_of=valuation_as_of,
            projected_at=computed_at,
            observation=observation,
            economic_identity=(economic_identities or {}).get(fact.analysis_unit_id),
        )
        target = projection["target"]
        _require(
            target.get("status") == "AVAILABLE"
            and target.get("currency") == "CNY"
            and target.get("unit") == V3_CNY_UNIT,
            "CNY_TARGET_DRIFT",
        )
        cny_minor = int(target["value"])
        _require(cny_minor >= 0, "CNY_TARGET_NEGATIVE")
        quantized_to_zero_count += int(cny_minor == 0)
        projection_documents.append(projection)
        converted.append(
            V3ReducedSourceAskFact(
                analysis_unit_id=fact.analysis_unit_id,
                bucket_date=fact.bucket_date,
                logical_source=fact.logical_source,
                ask_atoms=cny_minor,
                available_at=computed_at,
                source_fact_sha256=projection["document_hash"],
            )
        )

    ordered_pairs = tuple(
        sorted(
            zip(projection_documents, converted),
            key=lambda pair: (pair[1].analysis_unit_id, pair[1].logical_source),
        )
    )
    projections = tuple(pair[0] for pair in ordered_pairs)
    facts = tuple(pair[1] for pair in ordered_pairs)
    input_snapshot_sha = _input_snapshot_sha256(
        projections=projections, membership_sha256=membership_sha,
        schema_sha256=schema_sha256, source_reduction_sha256=source_reduction_sha,
        valuation_as_of=valuation_as_of,
    )
    frame = build_v3_daily_price_frame(
        membership=membership,
        bucket_date=reduction.bucket_date,
        available_at=computed_at,
        facts=facts,
        input_snapshot_sha256=input_snapshot_sha,
    )
    return V3CnyProjectionBatch(
        valuation_as_of=valuation_as_of,
        projection_computed_at=computed_at,
        membership_id=membership.membership_id,
        membership_sha256=membership_sha,
        schema_sha256=schema_sha256,
        source_reduction_id=reduction.reduction_id,
        source_reduction_sha256=source_reduction_sha,
        projections=projections,
        converted_facts=facts,
        frame=frame,
        input_snapshot_sha256=input_snapshot_sha,
        quantized_to_zero_count=quantized_to_zero_count,
    )


def finalize_v3_cny_projection_batch(
    batch: V3CnyProjectionBatch, *, projection_computed_at: datetime,
) -> V3CnyProjectionBatch:
    """Bind completed calculations to one observed completion clock.

    FX vintage, converted values, fused values and all qualification decisions
    are retained. Only clocks and the hashes depending on them are rebound.
    No system clock, file I/O, FX selection or numerical fusion occurs here.
    """
    _require(isinstance(batch, V3CnyProjectionBatch), "CNY_BATCH_REQUIRED")
    completed = _utc(projection_computed_at, "PROJECTION_COMPUTED_AT")
    _require(completed >= max(batch.projection_computed_at, batch.frame.available_at),
             "PROJECTION_COMPLETION_CLOCK_REVERSED")
    _require(len(batch.projections) == len(batch.converted_facts), "CNY_BATCH_FACT_COUNT_DRIFT")
    projections = tuple(finalize_cny_analysis_projection_v2(dict(row), projected_at=completed)
                        for row in batch.projections)
    facts = []
    grouped: dict[str, list[V3ReducedSourceAskFact]] = {}
    for old, projection, fact in zip(batch.projections, projections, batch.converted_facts):
        _require(fact.source_fact_sha256 == old["document_hash"]
                 and fact.ask_atoms == int(old["target"]["value"])
                 and fact.analysis_unit_id == old["source"]["analysis_unit_id"]
                 and fact.logical_source == old["source"]["logical_source"],
                 "CNY_BATCH_FACT_BINDING_DRIFT")
        bound = replace(fact, available_at=completed, source_fact_sha256=projection["document_hash"])
        facts.append(bound)
        grouped.setdefault(bound.analysis_unit_id, []).append(bound)
    members = []
    for member in batch.frame.members:
        present = sorted(grouped.get(member.analysis_unit_id, ()), key=lambda row: row.logical_source)
        # This is the existing daily-frame lineage contract; the fused Decimal
        # and status are carried forward verbatim from the completed calculation.
        lineage = sha256_hex(canonical_json_bytes({
            "facts": [row.source_fact_sha256 for row in present],
            "identity_sha256": member.identity_sha256,
            "participating_sources": list(member.participating_sources),
            "status": member.status.value,
        }))
        members.append(replace(member, lineage_sha256=lineage))
    snapshot = _input_snapshot_sha256(
        projections=projections, membership_sha256=batch.membership_sha256,
        schema_sha256=batch.schema_sha256, source_reduction_sha256=batch.source_reduction_sha256,
        valuation_as_of=batch.valuation_as_of,
    )
    frame = replace(batch.frame, available_at=completed, input_snapshot_sha256=snapshot,
                    members=tuple(members))
    return replace(batch, projection_computed_at=completed, projections=projections,
                   converted_facts=tuple(facts), frame=frame, input_snapshot_sha256=snapshot)


__all__ = [
    "MarketSectorCnyV3Error",
    "V3CnyProjectionBatch",
    "V3_CNY_PROJECTION_BATCH_SCHEMA",
    "V3_CNY_PROJECTION_STATUS",
    "V3_CNY_UNIT",
    "V3_CNY_SEMANTICS",
    "V3_CNY_PROJECTED_AT_ROLE",
    "build_v3_cny_projection_batch",
    "finalize_v3_cny_projection_batch",
    "load_v3_member_source_ids",
]
