from __future__ import annotations

from dataclasses import replace
from datetime import UTC, date, datetime, timedelta
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker

from cs2_research.catalog import CatalogDisplayProjection
from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.trending.identity import ECONOMIC_FIELDS, bind_member_economic_identity
from cs2_research.trending.formal import (
    TrendingAnomalyStatus,
    TrendingEvidenceRelease,
    TrendingMeasurementStatus,
    TrendingNumericProfile,
    TrendingPublicationBlocked,
    TrendingPublicationRelease,
    TrendingRightsRelease,
    TrendingSourceLeg,
    TrendingWindowEvidence,
    build_trending_candidate_ledger,
    build_trending_public_candidate,
)
from cs2_research.trending.models import (
    CatalogMappingStatus,
    TrendingCatalogMember,
    TrendingContractError,
    TrendingMembership,
)
from identity_fixture import build_identity_fixture


ROOT = Path(__file__).resolve().parents[2]
AS_OF = date(2026, 8, 31)
EVALUATED = datetime(2026, 9, 1, 1, tzinfo=UTC)
HASHES = tuple(format(value, "064x") for value in range(1, 100))


def _catalog(member_id: str, index: int) -> dict:
    raw = json.loads(
        (ROOT / "schemas/examples/catalog-display-list.valid.json").read_text(
            encoding="utf-8"
        )
    )["members"][0]["projection"]
    existing = CatalogDisplayProjection.from_document(raw)
    return CatalogDisplayProjection.build(
        analysis_unit_id=member_id,
        parent_analysis_unit_id=None,
        analysis_unit_kind="BASE_MHN",
        item_kind=existing.item_kind,
        base_item_code=f"weapon.fixture.{index}",
        edition_kind="STANDARD",
        wear_tier=existing.wear_tier,
        localized_name=replace(
            existing.localized_name,
            en=f"Fixture item {index}",
            zh_cn=f"测试商品 {index}",
        ),
        media=existing.media,
        catalog_version="catalog-d3-fixture-v1",
        version_context=replace(existing.version_context,
                                item_variant_version_id=str(index),
                                analysis_unit_version_id=str(index)),
        valid_from=existing.valid_from,
    ).to_document()


def _membership(count: int = 3) -> tuple[TrendingMembership, dict[str, dict]]:
    catalogs = {f"item:{index}": _catalog(f"item:{index}", index) for index in range(1, count + 1)}
    membership = TrendingMembership(
        catalog_snapshot_sha256=HASHES[0],
        catalog_version="catalog-d3-fixture-v1",
        catalog_as_of=datetime(2026, 7, 31, 23, tzinfo=UTC),
        available_at=datetime(2026, 7, 31, 23, 55, tzinfo=UTC),
        members=tuple(
            TrendingCatalogMember(
                analysis_unit_id=member_id,
                display_name=document["localized_name"]["en"],
                item_kind=document["item_kind"],
                base_item_code=document["base_item_code"],
                mapping_status=CatalogMappingStatus.EXACT,
                model_code=f"model-{index}",
                rarity_code="rarity-fixture",
                edition_kind=document["edition_kind"],
                wear_tier=document["wear_tier"],
                identity_available_at=datetime(2026, 7, 31, 23, tzinfo=UTC),
                projection_sha256=document["projection_hash"],
            )
            for index, (member_id, document) in enumerate(catalogs.items(), 1)
        ),
    )
    membership = replace(membership, members=tuple(
        bind_member_economic_identity(member, catalogs[member.analysis_unit_id])
        for member in membership.members
    ))
    return membership, catalogs


def _profile(
    *, endpoint: int = 10, delta: int = 1, approved: bool = False
) -> TrendingNumericProfile:
    return TrendingNumericProfile(
        profile_code="price-010-shadow-v1",
        available_at=datetime(2026, 9, 1, 0, 10, tzinfo=UTC),
        minimum_endpoint_cny_minor=endpoint,
        minimum_abs_leg_delta_cny_minor=delta,
        minimum_eligible_ratio_bps=0,
        endpoint_freshness_seconds=86_400,
        formal_numeric_profile_approved=approved,
        prospective_validation_approved=approved,
    )


def _leg(
    member: str,
    source: str,
    start: int,
    end: int,
    index: int,
    **changes,
) -> TrendingSourceLeg:
    values = dict(
        analysis_unit_id=member,
        source_code=source,
        start_date=AS_OF - timedelta(days=30),
        end_date=AS_OF,
        start_cny_minor=start,
        end_cny_minor=end,
        start_fact_id=HASHES[index],
        end_fact_id=HASHES[index + 20],
        available_at=datetime(2026, 9, 1, 0, 30, tzinfo=UTC),
        anomaly_status=TrendingAnomalyStatus.PASS,
        anomaly_assessment_id=format(index + 40, "064x"),
        endpoint_observed_at=datetime(2026, 9, 1, tzinfo=UTC),
        economic_identity_sha256=sha256_hex(canonical_json_bytes({
            field: _catalog(member, int(member.split(":")[-1]) if member.split(":")[-1].isdigit() else 1)[field]
            for field in ECONOMIC_FIELDS
        })),
    )
    values.update(changes)
    return TrendingSourceLeg(**values)


def _inputs(*, membership=None, catalogs=None, values=None,
            completed_at=EVALUATED - timedelta(minutes=30)):
    if membership is None:
        membership, catalogs = _membership()
    if catalogs is None:
        _, catalogs = _membership(len(membership.members))
    # item:1 is +10%, +20%, +30% -> +10% conservative floor.
    # item:2 is -10%, -20%, -30% -> -10% conservative floor.
    # item:3 has mixed direction and must remain in the complete excluded ledger.
    rows = (
        ("item:1", ((100, 110), (100, 120), (100, 130))),
        ("item:2", ((100, 90), (100, 80), (100, 70))),
        ("item:3", ((100, 110), (100, 90), (100, 120))),
    )
    defaults = {
        (member, source): amount
        for member, amounts in rows
        for source, amount in zip(("market_a", "market_b", "market_c"), amounts, strict=True)
    }
    return build_identity_fixture(
        membership=membership, catalog_documents=catalogs,
        values=defaults if values is None else values,
        result_as_of=AS_OF, evaluated_at=completed_at,
    )


def _legs() -> tuple[TrendingSourceLeg, ...]:
    return _inputs().endpoint_set.legs


def _with_anomaly(endpoint_set, member_id, status):
    """A new explicit synthetic assessment, not a fabricated digest or bypass."""
    return replace(endpoint_set, pairs=tuple(
        replace(pair, anomaly_assessment=replace(pair.anomaly_assessment, status=status,
                reason_codes=(f"SYNTHETIC_{status.value}",)))
        if pair.start_projection["source"]["analysis_unit_id"] == member_id else pair
        for pair in endpoint_set.pairs
    ))


def _window_evidence(
    membership: TrendingMembership,
    legs: tuple[TrendingSourceLeg, ...],
    *,
    knowledge_mode: str = "PROSPECTIVE_PIT",
    end_reduced_at: datetime = datetime(2026, 9, 1, 0, 5, tzinfo=UTC),
) -> TrendingWindowEvidence:
    ordered = tuple(sorted(legs, key=lambda row: (row.analysis_unit_id, row.source_code)))
    # Preserve the original history and bindings. In particular this helper does
    # not turn a caller's changed price/date into newly approved source evidence.
    _, catalogs = _membership(len(membership.members))
    original_membership, _ = _membership(len(membership.members))
    evidence = _inputs(membership=original_membership, catalogs=catalogs).endpoint_set.window_evidence
    return replace(
        evidence,
        membership_id=membership.membership_id,
        member_set_sha256=membership.member_set_sha256,
        member_count=len(membership.members),
        catalog_snapshot_sha256=membership.catalog_snapshot_sha256,
        end_eod_reduced_at=end_reduced_at,
        source_leg_set_sha256=sha256_hex(
            b"".join(canonical_json_bytes(row.to_document()) for row in ordered)
        ),
        available_at=max(
            membership.available_at,
            evidence.available_at,
            end_reduced_at,
            max((row.available_at for row in ordered), default=end_reduced_at),
        ),
        knowledge_mode=knowledge_mode,
    )


def _ledger(*, profile: TrendingNumericProfile | None = None):
    membership, catalogs = _membership()
    legs = _legs()
    return (
        build_trending_candidate_ledger(
            profile=profile or _profile(),
            membership=membership,
            source_legs=legs,
            result_as_of=AS_OF,
            evaluated_at=EVALUATED,
            window_evidence=_window_evidence(membership, legs),
        ),
        catalogs,
    )


def test_candidate_uses_exact_cny_floor_and_complete_member_accounting() -> None:
    ledger, _ = _ledger()
    rows = {row["analysis_unit_id"]: row for row in ledger.measurements}
    assert len(rows) == ledger.run_document["member_count"] == 3
    assert rows["item:1"]["status"] == "ELIGIBLE_A3"
    assert rows["item:1"]["conservative_source_code"] == "market_a"
    assert rows["item:1"]["conservative_same_direction_change_floor_ratio"] == "0.10000000"
    assert rows["item:2"]["status"] == "ELIGIBLE_A3"
    assert rows["item:2"]["conservative_source_code"] == "market_a"
    assert rows["item:2"]["conservative_same_direction_change_floor_ratio"] == "-0.10000000"
    assert rows["item:3"]["status"] == "CONFLICTED_DIRECTION"
    assert ledger.run_document["eligible_count"] == 2
    assert ledger.run_document["excluded_count"] == 1
    assert ledger.run_document["rankings"]["GAINERS"][0]["analysis_unit_id"] == "item:1"
    assert ledger.run_document["rankings"]["LOSERS"][0]["analysis_unit_id"] == "item:2"
    assert all("rank" not in row for row in ledger.measurements)


def test_current_membership_can_be_sealed_after_window_start() -> None:
    membership, _ = _membership()
    late_membership = replace(
        membership,
        available_at=datetime(2026, 8, 2, 0, 1, tzinfo=UTC),
    )
    legs = _legs()
    ledger = build_trending_candidate_ledger(
        profile=_profile(),
        membership=late_membership,
        source_legs=legs,
        result_as_of=AS_OF,
        evaluated_at=EVALUATED,
        window_evidence=_window_evidence(late_membership, legs),
    )
    assert ledger.run_document["eligible_count"] == 2


def test_window_evidence_rejects_reduction_before_utc_day_close() -> None:
    membership, _ = _membership()
    legs = _legs()
    with pytest.raises(TrendingContractError, match="D3_EVIDENCE_INCOMPLETE_EOD"):
        replace(
            _window_evidence(membership, legs),
            end_eod_reduced_at=datetime(2026, 8, 31, 23, 59, tzinfo=UTC),
        )




def test_measurement_identity_is_rank_independent() -> None:
    membership, catalogs = _membership()
    values = {(leg.analysis_unit_id, leg.source_code): (leg.start_cny_minor, leg.end_cny_minor)
              for leg in _legs()}
    values.update({("item:3", code): (100, 140 + index)
                   for index, code in enumerate(("market_a", "market_b", "market_c"))})
    endpoint = _inputs(membership=membership, catalogs=catalogs, values=values).endpoint_set
    withheld = _with_anomaly(endpoint, "item:3", TrendingAnomalyStatus.FLAGGED)
    ledger = build_trending_candidate_ledger(
        profile=_profile(), membership=membership, source_legs=withheld.legs,
        result_as_of=AS_OF, evaluated_at=EVALUATED, window_evidence=withheld.window_evidence,
    )
    original = {row["analysis_unit_id"]: row["measurement_id"] for row in ledger.measurements}
    second = build_trending_candidate_ledger(
        profile=ledger.profile,
        membership=ledger.membership,
        source_legs=endpoint.legs,
        result_as_of=AS_OF,
        evaluated_at=EVALUATED,
        window_evidence=endpoint.window_evidence,
    )
    assert next(row for row in second.measurements if row["analysis_unit_id"] == "item:1")["measurement_id"] == original["item:1"]
    assert second.run_document["rankings"]["GAINERS"][0]["analysis_unit_id"] == "item:3"


@pytest.mark.parametrize(
    ("case", "status"),
    [
        ("missing", "INSUFFICIENT_THREE_SOURCES"),
        ("flagged", "WITHHELD_ANOMALY"),
        ("unknown", "WITHHELD_ANOMALY_UNKNOWN"),
        ("positive-flat", "FLAT_OR_ZERO_CONFLICT"),
    ],
)
def test_explicit_fail_closed_statuses(case, status) -> None:
    fixture = _inputs()
    endpoint = fixture.endpoint_set
    if case == "positive-flat":
        values = {(row.analysis_unit_id, row.source_code): (row.start_cny_minor, row.end_cny_minor)
                  for row in endpoint.legs}
        values[("item:1", "market_a")] = (100, 100)
        endpoint = _inputs(values=values).endpoint_set
    elif case in {"flagged", "unknown"}:
        endpoint = _with_anomaly(endpoint, "item:1", TrendingAnomalyStatus(case.upper()))
    legs = endpoint.legs
    if case == "missing":
        legs = tuple(row for row in legs if not (row.analysis_unit_id == "item:1" and row.source_code == "market_a"))
    evidence = replace(endpoint.window_evidence, source_leg_set_sha256=sha256_hex(
        b"".join(canonical_json_bytes(row.to_document()) for row in legs)))
    ledger = build_trending_candidate_ledger(
        profile=_profile(), membership=fixture.membership, source_legs=legs,
        result_as_of=AS_OF, evaluated_at=EVALUATED,
        window_evidence=evidence,
    )
    row = next(row for row in ledger.measurements if row["analysis_unit_id"] == "item:1")
    assert row["status"] == status
    assert row["conservative_same_direction_change_floor_ratio"] is None


def test_zero_math_and_tampered_bound_endpoints_never_become_qualified() -> None:
    assert _leg("item:1", "market_a", 0, 100, 1).change is None
    bound = _legs()[0]
    for changes in ({"start_cny_minor": 0}, {
        "start_date": bound.start_date - timedelta(days=1),
        "end_date": bound.end_date - timedelta(days=1),
    }):
        with pytest.raises(TrendingContractError, match="D3_LEG_IDENTITY_BINDING_CONTENT"):
            replace(bound, **changes)
    membership, _ = _membership(1)
    legs = tuple(_leg("item:1", source, 0, 100, index)
                 for index, source in enumerate(("market_a", "market_b", "market_c"), 1))
    ledger = build_trending_candidate_ledger(profile=_profile(), membership=membership,
        source_legs=legs, result_as_of=AS_OF, evaluated_at=EVALUATED)
    assert ledger.measurements[0]["status"] == "WITHHELD_WINDOW_EVIDENCE"
    assert ledger.run_document["qualified_three_source_endpoint_count"] == 0


def test_freshness_is_anchored_to_the_measured_utc_day() -> None:
    membership, _ = _membership()
    legs = _legs()
    ledger = build_trending_candidate_ledger(
        profile=replace(_profile(), endpoint_freshness_seconds=1),
        membership=membership,
        source_legs=legs,
        result_as_of=AS_OF,
        evaluated_at=EVALUATED,
        window_evidence=_window_evidence(membership, legs),
    )
    assert {row["status"] for row in ledger.measurements} == {"STALE_ENDPOINT"}


def test_late_eod_reduction_cannot_refresh_an_old_measurement_day() -> None:
    membership, _ = _membership()
    legs = _legs()
    ledger = build_trending_candidate_ledger(
        profile=replace(_profile(), endpoint_freshness_seconds=1800),
        membership=membership,
        source_legs=legs,
        result_as_of=AS_OF,
        evaluated_at=EVALUATED,
        window_evidence=_window_evidence(
            membership,
            legs,
            end_reduced_at=EVALUATED,
        ),
    )
    assert {row["status"] for row in ledger.measurements} == {"STALE_ENDPOINT"}


def test_price_010_shadow_gate_withholds_sub_ten_cent_endpoint() -> None:
    membership, catalogs = _membership(1)
    values = {
        ("item:1", source): (9, 10 + index)
        for index, source in enumerate(("market_a", "market_b", "market_c"), 1)
    }
    endpoint = _inputs(membership=membership, catalogs=catalogs, values=values).endpoint_set
    ledger = build_trending_candidate_ledger(
        profile=_profile(endpoint=10), membership=membership, source_legs=endpoint.legs,
        result_as_of=AS_OF, evaluated_at=EVALUATED,
        window_evidence=endpoint.window_evidence,
    )
    assert ledger.measurements[0]["status"] == "WITHHELD_MICROPRICE"


def test_public_boundary_reports_all_missing_releases_at_once() -> None:
    ledger, catalogs = _ledger()
    rights = TrendingRightsRelease(
        release_code="internal-only-v1",
        available_at=EVALUATED,
        usage_scope="INTERNAL_SHADOW",
        public_derived_trending_allowed=False,
        allowed_public_source_codes=(),
        maximum_public_members_per_direction=0,
    )
    release = TrendingPublicationRelease(
        release_code="d3-shadow-v1", available_at=EVALUATED,
        algorithm_version="m3a-cny-v1", data_quality_policy_version="shadow-v1",
        expected_member_count=3, pit_membership_approved=False,
        freshness_policy_approved=False, coverage_policy_approved=False,
        minimum_three_source_endpoint_ratio_bps=10_000,
        minimum_qualified_three_source_endpoint_ratio_bps=10_000,
        minimum_direction_eligible_ratio_bps=0, freshness_seconds=7200,
        retention_seconds=86_400,
    )
    with pytest.raises(TrendingPublicationBlocked) as caught:
        build_trending_public_candidate(
            ledger=ledger, release=release, rights=rights,
            evidence_release=_evidence_release(ledger, _descriptor(ledger), approved=False),
            catalog_descriptor=_descriptor(ledger), catalog_documents=catalogs,
            public_available_at=EVALUATED + timedelta(minutes=5),
        )
    assert {gate.value for gate in caught.value.gates} == {
        "NUMERIC_PROFILE_WITHHELD",
        "PROSPECTIVE_VALIDATION_WITHHELD",
        "RIGHTS_WITHHELD",
        "PIT_MEMBERSHIP_WITHHELD",
        "FRESHNESS_WITHHELD",
        "COVERAGE_WITHHELD",
        "WINDOW_EVIDENCE_WITHHELD",
        "ANOMALY_POLICY_WITHHELD",
    }


def _descriptor(ledger) -> dict:
    return {
        "catalog_publication_id": HASHES[80],
        "snapshot_id": ledger.membership.catalog_snapshot_sha256,
        "catalog_version": ledger.membership.catalog_version,
        "as_of": utc_timestamp_text(ledger.membership.catalog_as_of),
        "available_at": utc_timestamp_text(ledger.membership.available_at),
        "published_at": "2026-09-01T00:40:00.000000Z",
        "member_count": len(ledger.membership.members),
        "member_set_hash": HASHES[81],
        "decision": "APPROVED",
        "withdrawn": False,
    }


def _evidence_release(
    ledger, descriptor: dict, *, approved: bool = True
) -> TrendingEvidenceRelease:
    assert ledger.window_evidence is not None
    evidence = ledger.window_evidence
    return TrendingEvidenceRelease(
        release_code="synthetic-window-evidence-v1",
        available_at=EVALUATED,
        window_evidence_id=evidence.window_evidence_id,
        endpoint_set_id=evidence.endpoint_set_id,
        membership_id=evidence.membership_id,
        member_set_sha256=evidence.member_set_sha256,
        expected_member_count=evidence.member_count,
        catalog_publication_id=descriptor["catalog_publication_id"],
        catalog_snapshot_sha256=evidence.catalog_snapshot_sha256,
        catalog_member_set_sha256=descriptor["member_set_hash"],
        start_eod_sha256=evidence.start_eod_sha256,
        start_eod_reduced_at=evidence.start_eod_reduced_at,
        end_eod_sha256=evidence.end_eod_sha256,
        end_eod_reduced_at=evidence.end_eod_reduced_at,
        anomaly_policy_id=evidence.anomaly_policy_id,
        anomaly_assessment_set_sha256=evidence.anomaly_assessment_set_sha256,
        source_leg_set_sha256=evidence.source_leg_set_sha256,
        eod_proofs_approved=approved,
        anomaly_policy_approved=approved,
        pit_membership_approved=approved,
    )


def test_public_boundary_rejects_a_different_catalog_snapshot_with_same_version() -> None:
    ledger, catalogs = _ledger(profile=_profile(approved=True))
    descriptor = _descriptor(ledger)
    descriptor["snapshot_id"] = HASHES[80]
    with pytest.raises(TrendingContractError, match="D3_CATALOG_SNAPSHOT_BINDING"):
        build_trending_public_candidate(
            ledger=ledger,
            release=TrendingPublicationRelease(
                release_code="synthetic-formal-test-v1",
                available_at=EVALUATED,
                algorithm_version="m3a-cny-v1",
                data_quality_policy_version="synthetic-v1",
                expected_member_count=3,
                pit_membership_approved=True,
                freshness_policy_approved=True,
                coverage_policy_approved=True,
                minimum_three_source_endpoint_ratio_bps=10_000,
                minimum_qualified_three_source_endpoint_ratio_bps=10_000,
                minimum_direction_eligible_ratio_bps=0,
                freshness_seconds=7200,
                retention_seconds=86_400,
            ),
            rights=TrendingRightsRelease(
                release_code="synthetic-public-test-v1",
                available_at=EVALUATED,
                usage_scope="PUBLIC_DERIVED_TRENDING",
                public_derived_trending_allowed=True,
                allowed_public_source_codes=("market_a", "market_b", "market_c"),
                maximum_public_members_per_direction=50,
            ),
            evidence_release=_evidence_release(ledger, descriptor),
            catalog_descriptor=descriptor,
            catalog_documents=catalogs,
            public_available_at=EVALUATED + timedelta(minutes=5),
        )


def test_explicit_test_release_projects_only_allowlisted_public_fields() -> None:
    ledger, catalogs = _ledger(profile=_profile(approved=True))
    rights = TrendingRightsRelease(
        release_code="synthetic-public-test-v1",
        available_at=EVALUATED,
        usage_scope="PUBLIC_DERIVED_TRENDING",
        public_derived_trending_allowed=True,
        allowed_public_source_codes=("market_a", "market_b", "market_c"),
        maximum_public_members_per_direction=50,
    )
    release = TrendingPublicationRelease(
        release_code="synthetic-formal-test-v1", available_at=EVALUATED,
        algorithm_version="m3a-cny-v1", data_quality_policy_version="synthetic-v1",
        expected_member_count=3, pit_membership_approved=True,
        freshness_policy_approved=True, coverage_policy_approved=True,
        minimum_three_source_endpoint_ratio_bps=10_000,
        minimum_qualified_three_source_endpoint_ratio_bps=10_000,
        minimum_direction_eligible_ratio_bps=0, freshness_seconds=7200,
        retention_seconds=86_400,
    )
    public = build_trending_public_candidate(
        ledger=ledger, release=release, rights=rights,
        evidence_release=_evidence_release(ledger, _descriptor(ledger)),
        catalog_descriptor=_descriptor(ledger), catalog_documents=catalogs,
        public_available_at=EVALUATED + timedelta(minutes=5),
    )
    assert len(public.members) == 2
    assert public.manifest["eligible_count"] == 2
    assert public.manifest["excluded_count"] == 1
    assert {member["direction"] for member in public.members} == {"GAINERS", "LOSERS"}
    rendered = json.dumps(
        {"manifest": public.manifest, "members": public.members},
        ensure_ascii=False,
    )
    for private_name in (
        "start_fact_id", "end_fact_id", "start_cny_minor", "end_cny_minor",
        "source_asset_ref", "provider_url", "dsn",
    ):
        assert private_name not in rendered

    schema = json.loads(
        (ROOT / "schemas/single-item-trending-d3.v3.schema.json").read_text(
            encoding="utf-8"
        )
    )
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    for document in (
        ledger.profile.to_document(),
        rights.to_document(),
        ledger.window_evidence.to_document(),
        _evidence_release(ledger, _descriptor(ledger)).to_document(),
        *ledger.measurements,
        ledger.run_document,
        public.manifest,
    ):
        validator.validate(document)


def test_public_boundary_caps_each_direction_without_truncating_private_accounting() -> None:
    membership, catalogs = _membership(6)
    values = {
        (member_id, source): (100, 110 + member_index + source_index)
        for member_index, member_id in enumerate(catalogs, 1)
        for source_index, source in enumerate(("market_a", "market_b", "market_c"), 1)
    }
    endpoint = _inputs(membership=membership, catalogs=catalogs, values=values).endpoint_set
    ledger = build_trending_candidate_ledger(
        profile=_profile(approved=True),
        membership=membership,
        source_legs=endpoint.legs,
        result_as_of=AS_OF,
        evaluated_at=EVALUATED,
        window_evidence=endpoint.window_evidence,
    )
    public = build_trending_public_candidate(
        ledger=ledger,
        release=TrendingPublicationRelease(
            release_code="synthetic-top-two-v1",
            available_at=EVALUATED,
            algorithm_version="m3a-cny-v1",
            data_quality_policy_version="synthetic-v1",
            expected_member_count=6,
            pit_membership_approved=True,
            freshness_policy_approved=True,
            coverage_policy_approved=True,
            minimum_three_source_endpoint_ratio_bps=10_000,
            minimum_qualified_three_source_endpoint_ratio_bps=10_000,
            minimum_direction_eligible_ratio_bps=0,
            freshness_seconds=7200,
            retention_seconds=86_400,
            public_top_n_per_direction=2,
        ),
        rights=TrendingRightsRelease(
            release_code="synthetic-public-test-v1",
            available_at=EVALUATED,
            usage_scope="PUBLIC_DERIVED_TRENDING",
            public_derived_trending_allowed=True,
            allowed_public_source_codes=("market_a", "market_b", "market_c"),
            maximum_public_members_per_direction=50,
        ),
        evidence_release=_evidence_release(ledger, _descriptor(ledger)),
        catalog_descriptor=_descriptor(ledger),
        catalog_documents=catalogs,
        public_available_at=EVALUATED + timedelta(minutes=5),
    )

    assert ledger.run_document["eligible_count"] == 6
    assert len(ledger.measurements) == 6
    assert len(public.members) == 2
    assert public.manifest["eligible_count"] == 6
    assert public.manifest["three_source_endpoint_count"] == 6
    assert public.manifest["direction_eligible_count"] == 6
    assert public.manifest["gainer_count"] == 2
    assert public.manifest["loser_count"] == 0
    assert public.manifest["producer_release"]["public_top_n_per_direction"] == 2
    assert [member["rank"] for member in public.members] == [1, 2]


def test_duplicate_leg_and_membership_escape_fail_the_whole_build() -> None:
    membership, _ = _membership()
    with pytest.raises(TrendingContractError, match="D3_DUPLICATE_SOURCE_LEG"):
        build_trending_candidate_ledger(
            profile=_profile(), membership=membership,
            source_legs=(*_legs(), _legs()[0]), result_as_of=AS_OF,
            evaluated_at=EVALUATED,
        )
    with pytest.raises(TrendingContractError, match="D3_LEG_OUTSIDE_MEMBERSHIP"):
        build_trending_candidate_ledger(
            profile=_profile(), membership=membership,
            source_legs=(*_legs(), _leg("item:outside", "market_a", 100, 110, 60)),
            result_as_of=AS_OF, evaluated_at=EVALUATED,
        )
