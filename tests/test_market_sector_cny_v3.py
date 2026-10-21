from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from dataclasses import replace
from decimal import Decimal
import json
import importlib.util
from pathlib import Path

import pytest

from cs2_research.canonical import canonical_json_bytes, sha256_hex
from cs2_research.feature_input.market_sector_cny_v3 import (
    MarketSectorCnyV3Error,
    build_v3_cny_projection_batch,
    finalize_v3_cny_projection_batch,
    load_v3_member_source_ids,
)
from cs2_research.feature_input.market_sector_daily_v3 import (
    V3MemberPriceStatus,
    V3ReducedSourceAskFact,
    v3_price_frame_document,
)
from cs2_research.feature_input.market_sector_eod_v3 import (
    V3EndOfDayReduction, V3EndOfDayDiagnostic, V3EndOfDaySourceStatus,
)
from cs2_research.feature_input.market_sector_daily_v1 import FROZEN_END_OF_DAY_REDUCTION_POLICY_V1
from cs2_research.feature_input.market_sector_taxonomy_v3 import (
    TaxonomyMemberV3,
    TaxonomyMembershipV3,
)
from cs2_research.fx import EcbRateBook, EcbReferenceLeg


def _schema(*, omit_market_c: bool = False) -> bytes:
    ids = {"market_a": 11, "market_b": 22, "market_c": 33}
    if omit_market_c:
        ids.pop("market_c")
    return canonical_json_bytes(
        {
            "counts": {"items": 1},
            "generation_id": "generation-test",
            "items": {"One": {"ids": ids}},
            "schema_version": "v3",
        }
    )


def _membership(schema_sha: str, *, sources: tuple[str, ...] = ("market_a", "market_b", "market_c")) -> TaxonomyMembershipV3:
    member = TaxonomyMemberV3(
        analysis_unit_id="item:1",
        market_hash_name="One",
        item_kind="WEAPON",
        scope_codes=("WEAPON",),
        identity_sha256="1" * 64,
        identity_authority="EXACT_INTERNAL_CATALOG_PROJECTION",
        source_ids_present=sources,
    )
    return TaxonomyMembershipV3(
        membership_id="market_sector_taxonomy_v3_" + "2" * 64,
        sealed_at=datetime(2026, 9, 1, tzinfo=UTC),
        members=(member,),
        document={
            "input_hashes": {"schema": schema_sha},
            "schema_identity": {
                "generated_at": "2026-08-28T00:00:00Z",
                "generation_id": "generation-test",
                "schema_version": "v3",
            },
        },
    )


def _reduction(membership: TaxonomyMembershipV3) -> V3EndOfDayReduction:
    facts = tuple(
        V3ReducedSourceAskFact(
            analysis_unit_id="item:1",
            bucket_date=date(2026, 9, 6),
            logical_source=source,
            ask_atoms=value,
            available_at=datetime(2026, 9, 6, 23, 55, tzinfo=UTC),
            source_fact_sha256=marker * 64,
        )
        for source, value, marker in (
            ("market_a", 100_000_000, "a"),
            ("market_b", 200_000_000, "b"),
        )
    )
    return V3EndOfDayReduction(
        bucket_date=date(2026, 9, 6),
        reduced_at=datetime(2026, 9, 7, tzinfo=UTC),
        membership_id=membership.membership_id,
        membership_sha256="4" * 64,
        input_snapshot_sha256="5" * 64,
        policy_sha256="6" * 64,
        supplied_slot_count=12,
        source_facts=facts,
        diagnostics=(),
    )


def _book() -> EcbRateBook:
    published = datetime(2026, 9, 4, 14, tzinfo=UTC)
    retrieved = datetime(2026, 9, 4, 16, tzinfo=UTC)
    return EcbRateBook(
        tuple(
            EcbReferenceLeg(
                source_event_date=date(2026, 9, 4),
                currency=currency,
                rate_per_eur=rate,
                valid_from=published,
                valid_to=None,
                retrieved_at=retrieved,
                evidence_sha256=marker * 64,
            )
            for currency, rate, marker in (
                ("CNY", Decimal("7"), "c"),
                ("USD", Decimal("1"), "d"),
            )
        )
    )


def test_real_v3_reduced_shape_projects_before_fusion() -> None:
    schema = _schema()
    membership = _membership(sha256_hex(schema))
    batch = build_v3_cny_projection_batch(
        membership=membership,
        membership_sha256="4" * 64,
        reduction=_reduction(membership),
        schema_payload=schema,
        schema_sha256=sha256_hex(schema),
        rate_book=_book(),
        projection_computed_at=datetime(2026, 9, 7, 1, tzinfo=UTC),
    )
    assert [row["source"]["source_item_id"] for row in batch.projections] == [11, 22]
    assert [row.ask_atoms for row in batch.converted_facts] == [700, 1400]
    assert batch.valuation_as_of == datetime(2026, 9, 7, tzinfo=UTC)
    assert batch.projection_computed_at == datetime(2026, 9, 7, 1, tzinfo=UTC)
    assert all(row.available_at == batch.projection_computed_at for row in batch.converted_facts)
    assert batch.frame.available_at == batch.projection_computed_at
    assert all(row["schema"] == "cny-analysis-projection/2" for row in batch.projections)
    assert all(row["available_at"] == "2026-09-07T01:00:00.000000Z" for row in batch.projections)
    assert all(row["valuation_as_of"] == "2026-09-07T00:00:00.000000Z" for row in batch.projections)
    assert batch.quantized_to_zero_count == 0
    member = batch.frame.members[0]
    assert member.status is V3MemberPriceStatus.QUALIFIED
    assert str(member.fused_ask_atoms) == "1050"
    assert member.participating_sources == ("market_a", "market_b")


def test_schema_hash_and_membership_source_coverage_fail_closed() -> None:
    schema = _schema()
    membership = _membership(sha256_hex(schema))
    with pytest.raises(MarketSectorCnyV3Error, match="SCHEMA_HASH_DRIFT"):
        load_v3_member_source_ids(
            schema_payload=schema + b" ",
            expected_schema_sha256=sha256_hex(schema),
            membership=membership,
        )

    missing = _schema(omit_market_c=True)
    mismatched = _membership(sha256_hex(missing))
    with pytest.raises(MarketSectorCnyV3Error, match="SCHEMA_SOURCE_COVERAGE_DRIFT"):
        load_v3_member_source_ids(
            schema_payload=missing,
            expected_schema_sha256=sha256_hex(missing),
            membership=mismatched,
        )


def test_v3_eod_descriptor_binds_the_actual_frozen_coverage() -> None:
    schema = _schema()
    membership = _membership(sha256_hex(schema))
    reduction = _reduction(membership)
    policy = FROZEN_END_OF_DAY_REDUCTION_POLICY_V1
    diagnostics = tuple(V3EndOfDayDiagnostic(
        row.analysis_unit_id, row.logical_source, V3EndOfDaySourceStatus.QUALIFIED,
        12, policy.minimum_qualified_slots, 0, 0, 3, row.ask_atoms,
        ("QUALIFIED",), "7" * 64,
    ) for row in reduction.source_facts)
    reduction = replace(reduction, policy_sha256=policy.policy_sha256, diagnostics=diagnostics)
    args = dict(membership=membership, membership_sha256="4" * 64, reduction=reduction,
                schema_payload=schema, schema_sha256=sha256_hex(schema), rate_book=_book(),
                projection_computed_at=datetime(2026, 9, 7, 3, tzinfo=UTC))
    batch = build_v3_cny_projection_batch(**args)
    for row in batch.projections:
        observation = row["observation"]
        assert observation["positive_fresh_slot_count"] == 9
        assert observation["coverage_evidence_sha256"] == batch.source_reduction_sha256
        assert observation["interval_end"] == "2026-09-07T00:00:00.000000Z"
        assert observation["reduction_policy_sha256"] == policy.policy_sha256
    insufficient = replace(diagnostics[0], positive_fresh_slot_count=8)
    args["reduction"] = replace(reduction, diagnostics=(insufficient, diagnostics[1]))
    with pytest.raises(MarketSectorCnyV3Error, match="EOD_DIAGNOSTIC_NOT_QUALIFIED"):
        build_v3_cny_projection_batch(**args)


def test_schema_member_without_any_provider_ids_is_a_bound_nonparticipating_member() -> None:
    schema = canonical_json_bytes(
        {
            "counts": {"items": 1},
            "generation_id": "generation-test",
            "items": {"One": {"market_hash_name": "One"}},
            "schema_version": "v3",
        }
    )
    membership = _membership(sha256_hex(schema), sources=())
    assert (
        load_v3_member_source_ids(
            schema_payload=schema,
            expected_schema_sha256=sha256_hex(schema),
            membership=membership,
        )
        == {}
    )

    mismatched = _membership(sha256_hex(schema), sources=("market_a",))
    with pytest.raises(MarketSectorCnyV3Error, match="SCHEMA_MEMBER_IDS_MISSING"):
        load_v3_member_source_ids(
            schema_payload=schema,
            expected_schema_sha256=sha256_hex(schema),
            membership=mismatched,
        )


def test_schema_duplicate_keys_and_generation_drift_fail_closed() -> None:
    duplicate = b'{"counts":{"items":1},"generation_id":"generation-test","items":{},"items":{},"schema_version":"v3"}'
    membership = _membership(sha256_hex(duplicate))
    with pytest.raises(MarketSectorCnyV3Error, match="DUPLICATE_KEY:items"):
        load_v3_member_source_ids(
            schema_payload=duplicate,
            expected_schema_sha256=sha256_hex(duplicate),
            membership=membership,
        )

    document = json.loads(_schema())
    document["generation_id"] = "other"
    drift = canonical_json_bytes(document)
    membership = _membership(sha256_hex(drift))
    with pytest.raises(MarketSectorCnyV3Error, match="SCHEMA_IDENTITY_DRIFT"):
        load_v3_member_source_ids(
            schema_payload=drift,
            expected_schema_sha256=sha256_hex(drift),
            membership=membership,
        )


def test_quantized_zero_isolated_to_one_source_without_losing_healthy_member() -> None:
    schema = canonical_json_bytes(
        {
            "counts": {"items": 2},
            "generation_id": "generation-test",
            "items": {
                "Healthy": {"ids": {"market_a": 11, "market_b": 22}},
                "Tiny": {"ids": {"market_a": 33, "market_b": 44}},
            },
            "schema_version": "v3",
        }
    )
    schema_sha = sha256_hex(schema)
    members = tuple(
        TaxonomyMemberV3(
            analysis_unit_id=f"item:{index}",
            market_hash_name=name,
            item_kind="WEAPON",
            scope_codes=("WEAPON",),
            identity_sha256=str(index) * 64,
            identity_authority="EXACT_INTERNAL_CATALOG_PROJECTION",
            source_ids_present=("market_a", "market_b"),
        )
        for index, name in ((1, "Healthy"), (2, "Tiny"))
    )
    membership = TaxonomyMembershipV3(
        membership_id="market_sector_taxonomy_v3_" + "2" * 64,
        sealed_at=datetime(2026, 9, 1, tzinfo=UTC),
        members=members,
        document={
            "input_hashes": {"schema": schema_sha},
            "schema_identity": {
                "generated_at": "2026-08-28T00:00:00Z",
                "generation_id": "generation-test",
                "schema_version": "v3",
            },
        },
    )
    facts = tuple(
        V3ReducedSourceAskFact(
            analysis_unit_id=unit,
            bucket_date=date(2026, 9, 6),
            logical_source=source,
            ask_atoms=value,
            available_at=datetime(2026, 9, 6, 23, 55, tzinfo=UTC),
            source_fact_sha256=marker * 64,
        )
        for unit, source, value, marker in (
            ("item:1", "market_a", 100_000_000, "a"),
            ("item:1", "market_b", 200_000_000, "b"),
            ("item:2", "market_a", 10_000, "c"),
            ("item:2", "market_b", 1_000_000, "d"),
        )
    )
    reduction = V3EndOfDayReduction(
        bucket_date=date(2026, 9, 6),
        reduced_at=datetime(2026, 9, 7, tzinfo=UTC),
        membership_id=membership.membership_id,
        membership_sha256="4" * 64,
        input_snapshot_sha256="5" * 64,
        policy_sha256="6" * 64,
        supplied_slot_count=12,
        source_facts=facts,
        diagnostics=(),
    )
    batch = build_v3_cny_projection_batch(
        membership=membership,
        membership_sha256="4" * 64,
        reduction=reduction,
        schema_payload=schema,
        schema_sha256=schema_sha,
        rate_book=_book(),
        projection_computed_at=datetime(2026, 9, 7, 1, tzinfo=UTC),
    )
    assert batch.quantized_to_zero_count == 1
    by_id = {row.analysis_unit_id: row for row in batch.frame.members}
    assert by_id["item:1"].status is V3MemberPriceStatus.QUALIFIED
    assert by_id["item:2"].status is V3MemberPriceStatus.INVALID_VALUE
    assert by_id["item:2"].fused_ask_atoms is None
    assert sorted(row.ask_atoms for row in batch.converted_facts if row.analysis_unit_id == "item:2") == [0, 7]



def test_completion_clock_cannot_precede_prepared_batch() -> None:
    schema = _schema()
    membership = _membership(sha256_hex(schema))
    prepared = build_v3_cny_projection_batch(
        membership=membership, membership_sha256="4" * 64, reduction=_reduction(membership),
        schema_payload=schema, schema_sha256=sha256_hex(schema), rate_book=_book(),
        projection_computed_at=datetime(2026, 9, 7, 3, tzinfo=UTC),
    )
    with pytest.raises(MarketSectorCnyV3Error, match="PROJECTION_COMPLETION_CLOCK_REVERSED"):
        finalize_v3_cny_projection_batch(
            prepared, projection_computed_at=datetime(2026, 9, 7, 2, tzinfo=UTC),
        )
