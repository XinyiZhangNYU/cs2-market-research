"""Synthetic ORIGINAL history inputs for tests; never production historical proof.

Uses the real catalog versions, upstream membership builder, artifact parsers,
EOD/projection validators and identity binding. No fixed-hash bypass or mock.
Caller-supplied display rows may be current; the separately synthetic historical
versions are explicit test inputs, not assertions about any live catalog store.
"""
from dataclasses import dataclass, field, fields, replace
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
import json
from pathlib import Path
from typing import Any, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.catalog.display import CatalogDisplayProjection
from cs2_research.catalog.models import ItemAnalysisUnitVersion, ItemVariantVersion, SourceMappingVersion
from cs2_research.feature_input.market_sector_daily_v1 import FROZEN_END_OF_DAY_REDUCTION_POLICY_V1
from cs2_research.feature_input.market_sector_taxonomy_v3 import build_taxonomy_membership_v3
from cs2_research.fx.analysis import AnalysisSourcePrice, project_analysis_price_to_cny_v2
from cs2_research.fx.ecb import EcbRateBook, EcbReferenceLeg
from cs2_research.trending.current import (TrendingAnomalyAssessment, TrendingCnyEndpointPair,
    TrendingCurrentEndpointSet, TrendingEodProof, build_current_endpoint_set_from_daily_projections)
from cs2_research.trending.formal import TrendingAnomalyStatus
from cs2_research.trending.identity import (CATALOG_IDENTITY_HISTORY_SCHEMA, TrendingIdentityHistory,
    bind_member_economic_identity, identity_version_document, source_economic_identity)
from cs2_research.trending.models import CatalogMappingStatus, TrendingCatalogMember, TrendingMembership

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ("market_a", "market_b", "market_c")


@dataclass
class IdentityFixture:
    membership: TrendingMembership
    catalogs: dict[str, dict]
    history: TrendingIdentityHistory
    endpoint_set: TrendingCurrentEndpointSet
    upstream_document: dict
    catalog_history_document: dict
    source_slot_documents: dict = field(default_factory=dict)

    @property
    def start_proof(self):
        return self.endpoint_set.start_eod_proof

    @property
    def end_proof(self):
        return self.endpoint_set.end_eod_proof


def build_identity_fixture(*, member_count: int = 1, result_as_of: date = date(2026, 9, 7),
                           evaluated_at: datetime | None = None,
                           membership: TrendingMembership | None = None,
                           catalog_documents: Mapping[str, Mapping[str, Any]] | None = None,
                           values: Mapping[tuple[str, str], tuple[int, int]] | None = None,
                           historical_recorded_at: datetime | None = None,
                           missing_endpoints: Mapping[tuple[str, str, str], str] | None = None) -> IdentityFixture:
    """Create explicit synthetic version histories, including for an existing display.

    Prices are CNY minor units; rate=1 converts the exact source USD atoms. Tests
    using a database must separately mark any backdated synthetic store versions
    as a fixture operation. This helper never reads or changes a database.
    """
    start_day = result_as_of - timedelta(days=30)
    start = datetime.combine(start_day, datetime.min.time(), UTC)
    evaluated_at = evaluated_at or datetime.combine(result_as_of + timedelta(days=1), datetime.min.time(), UTC) + timedelta(minutes=10)
    recorded = historical_recorded_at or start - timedelta(days=2)
    sealed = start - timedelta(hours=1)
    valid_from = start - timedelta(days=3)
    seed = CatalogDisplayProjection.from_document(json.loads(
        (ROOT / "schemas/examples/catalog-display-list.valid.json").read_text(encoding="utf-8"))["members"][0]["projection"])
    catalogs: dict[str, dict] = {}
    if membership is None:
        members = []
        for index in range(1, member_count + 1):
            member_id = f"item:{index}"
            kwargs = {field.name: getattr(seed, field.name) for field in fields(seed) if field.name != "projection_hash"}
            kwargs.update(analysis_unit_id=member_id, parent_analysis_unit_id=None, analysis_unit_kind="BASE_MHN",
                          item_kind="WEAPON", edition_kind="STANDARD", wear_tier="FACTORY_NEW",
                          base_item_code=f"weapon.fixture.{index}", catalog_version="identity-fixture-v1", valid_from=valid_from,
                          localized_name=replace(seed.localized_name, en=f"Fixture item {index}", zh_cn=f"测试商品 {index}"),
                          version_context=replace(seed.version_context, item_variant_version_id=str(index),
                                                  analysis_unit_version_id=str(index)))
            display = CatalogDisplayProjection.build(**kwargs)
            catalogs[member_id] = display.to_document()
            member = TrendingCatalogMember(analysis_unit_id=member_id, display_name=display.localized_name.en,
                item_kind=display.item_kind, base_item_code=display.base_item_code, mapping_status=CatalogMappingStatus.EXACT,
                model_code="fixture-model", rarity_code="fixture-rarity", edition_kind=display.edition_kind,
                wear_tier=display.wear_tier, identity_available_at=recorded, projection_sha256=display.projection_hash)
            members.append(bind_member_economic_identity(member, display.to_document()))
        membership = TrendingMembership(catalog_snapshot_sha256=sha256_hex(canonical_json_bytes(catalogs)),
            catalog_version="identity-fixture-v1", catalog_as_of=recorded, available_at=sealed, members=tuple(members))
    else:
        assert catalog_documents is not None
        catalogs = {key: dict(value) for key, value in catalog_documents.items()}
    original = {key: CatalogDisplayProjection.from_document(value) for key, value in catalogs.items()}
    policy = json.loads((ROOT / "config/market-sector-v3/taxonomy-policy-v3.json").read_text(encoding="utf-8"))
    policy["case_admission"]["market_hash_names"] = ["Synthetic Case"]
    collections = {name: {"kind": "weapon", "update_name": "Armory fixture"}
                   for name in policy["armory_admission"]["collection_names"]}
    schema = {"schema_version": "v3", "generation_id": "identity-fixture-generation",
        "generated_at": utc_timestamp_text(recorded), "counts": {"items": len(original)+2, "collections": len(collections)},
        "collections": collections, "items": {"Synthetic Case": {"market_hash_name": "Synthetic Case",
            "category": "container", "is_tradable": True, "def_index": 4001,
            "ids": {"market_a": 990001, "market_b": 990002, "market_c": 990003}},
            "Synthetic Agent": {"market_hash_name": "Synthetic Agent", "category": "agent", "is_tradable": True,
                "def_index": 5001, "ids": {"market_a": 990004, "market_b": 990005, "market_c": 990006}}}}
    source_ids = {}
    for index, (member_id, display) in enumerate(sorted(original.items()), 1):
        ids = {source: index * 100 + lane for lane, source in enumerate(SOURCES, 1)}
        source_ids.update({(member_id, source): value for source, value in ids.items()})
        schema["items"][display.localized_name.en] = {"market_hash_name": display.localized_name.en, "category": "skin",
            "is_tradable": True, "def_index": 7, "weapon": "AK-47", "ids": ids, "collections": []}
    documents = {
        "policy": canonical_json_bytes(policy),
        "catalog": canonical_json_bytes({"snapshot": {"member_count": len(original)},
            "members": [{"projection": row.to_document()} for row in original.values()]}),
        "schema": canonical_json_bytes(schema),
        "predecessor_membership": canonical_json_bytes({"schema": "index-shadow-membership/1",
            "membership_id": "identity-fixture-predecessor", "late_bound": False,
            "members": [{"analysis_unit_id": key} for key in original]}),
        "predecessor_profile": canonical_json_bytes({"schema_version": "market-sector-shadow-profile/2",
            "profile_id": "identity-fixture-profile", "t0": utc_timestamp_text(recorded)}),
    }
    args = {f"{name}_payload": payload for name, payload in documents.items()}
    args.update({f"expected_{name}_sha256": sha256_hex(payload) for name, payload in documents.items()})
    upstream = build_taxonomy_membership_v3(**args, sealed_at=sealed)
    upstream_payload = canonical_json_bytes(upstream.document)
    upstream_hash = sha256_hex(upstream_payload)
    artifacts = {sha256_hex(payload): payload.decode("utf-8") for payload in (*documents.values(), upstream_payload)}
    variants, units, mappings = [], [], []
    for member_id, display in original.items():
        evidence = canonical_json_bytes(display.to_document())
        evidence_hash = sha256_hex(evidence)
        artifacts[evidence_hash] = evidence.decode("utf-8")
        item_id = int(member_id.removeprefix("item:"))
        variants.append(ItemVariantVersion(int(display.version_context.item_variant_version_id), item_id,
            "synthetic-original", display.item_kind, display.localized_name.en, display.base_item_code, None,
            display.wear_tier, display.edition_kind, None, None, "CONFIRMED", valid_from, recorded,
            "synthetic-original-catalog", evidence_hash))
        units.append(ItemAnalysisUnitVersion(int(display.version_context.analysis_unit_version_id), item_id,
            "synthetic-original", display.analysis_unit_kind, "BASE_MHN", None, "CONFIRMED", valid_from,
            recorded, "synthetic-original-catalog", evidence_hash))
        for source in SOURCES:
            mappings.append(SourceMappingVersion(source_ids[(member_id, source)], source,
                str(source_ids[(member_id, source)]), None, "MARKET_HASH_NAME", item_id,
                display.localized_name.en, "RESOLVED", "CONFIRMED", valid_from, recorded,
                "synthetic-original-schema", evidence_hash=sha256_hex(documents["schema"])))
    catalog_history = {"schema_version": CATALOG_IDENTITY_HISTORY_SCHEMA,
        "variant_versions": [identity_version_document(row) for row in sorted(variants, key=lambda row: row.variant_version_id)],
        "analysis_unit_versions": [identity_version_document(row) for row in sorted(units, key=lambda row: row.analysis_unit_version_id)],
        "source_mappings": [identity_version_document(row) for row in sorted(mappings, key=lambda row: row.mapping_version_id)],
        "catalog_projections": [row.to_document() for row in sorted(original.values(), key=lambda row: row.projection_hash)]}
    history_payload = canonical_json_bytes(catalog_history)
    artifacts[sha256_hex(history_payload)] = history_payload.decode("utf-8")
    history = TrendingIdentityHistory(assembled_at=evaluated_at, catalog_history_sha256=sha256_hex(history_payload),
        upstream_membership_sha256s=(upstream_hash,), artifacts=artifacts)
    projections, proofs = [], []
    source_slot_documents = {}
    # Large exact-fraction tests must still respect AnalysisSourcePrice BIGINT.
    # A synthetic rate of 1,000,000 CNY/USD makes one source atom one CNY minor.
    large_values = any(value > 9_223_372_036_854 for pair in (values or {}).values() for value in pair)
    atoms_per_minor = 1 if large_values else 1_000_000
    cny_rate = Decimal("1000000") if large_values else Decimal("1")
    for day, side in ((start_day, 0), (result_as_of, 1)):
        event = datetime.combine(day, datetime.min.time(), UTC) + timedelta(hours=23, minutes=56)
        reduced = datetime.combine(day + timedelta(days=1), datetime.min.time(), UTC) + timedelta(minutes=5)
        facts = []
        for member_id in sorted(original):
            for source in SOURCES:
                minor = (values or {}).get((member_id, source), (100, 110))[side]
                facts.append({"analysis_unit_id": member_id, "logical_source": source, "bucket_date": day.isoformat(),
                    "available_at": utc_timestamp_text(event), "ask_atoms": minor * atoms_per_minor,
                    "source_fact_sha256": sha256_hex(canonical_json_bytes([member_id, source, day.isoformat(), minor]))})
        diagnostics = [{"analysis_unit_id": row["analysis_unit_id"], "logical_source": row["logical_source"],
            "status": "QUALIFIED", "supplied_slot_count": 12, "positive_fresh_slot_count": 12,
            "stale_slot_count": 0, "missing_source_clock_slot_count": 0, "invalid_or_missing_ask_slot_count": 0,
            "reduced_ask_atoms": row["ask_atoms"], "reason_codes": ["SYNTHETIC_TWELVE_SLOTS"],
            "lineage_sha256": row["source_fact_sha256"]} for row in facts]
        for diagnostic in diagnostics:
            member_id, source = diagnostic["analysis_unit_id"], diagnostic["logical_source"]
            key = (day.isoformat(), member_id, source)
            reason = (missing_endpoints or {}).get(key)
            if reason is None:
                continue
            from cs2_research.feature_input.market_sector_eod_v3 import _slot_fact_body, _slot_fact_document
            slot_documents = []
            for ordinal in range(12):
                slot = datetime.combine(day, datetime.min.time(), UTC) + timedelta(hours=23, minutes=ordinal * 5)
                acquired = slot + timedelta(seconds=1)
                clock = acquired - timedelta(minutes=30 if reason == "SOURCE_REFRESH_LAG" else 1)
                slot_documents.append(_slot_fact_document(_slot_fact_body(
                    analysis_unit_id=member_id, market_hash_name=original[member_id].localized_name.en,
                    identity_sha256=original[member_id].projection_hash, logical_source=source,
                    slot_at=slot, provider_response_time=acquired, source_updated_at=clock,
                    source_collected_at=clock, source_observed_at=clock, available_at=acquired,
                    ask_atoms=100_000_000 if reason == "SOURCE_REFRESH_LAG" else 0,
                    visible_listing_slots=5 if reason == "SOURCE_REFRESH_LAG" else 0,
                    normalized_record_sha256=sha256_hex(canonical_json_bytes([list(key), ordinal])),
                    membership_sha256=upstream_hash)))
            status = "STALE_QUOTE" if reason == "SOURCE_REFRESH_LAG" else "INVALID_OR_MISSING_ASK"
            diagnostic.update(status=status, positive_fresh_slot_count=0,
                stale_slot_count=12 if reason == "SOURCE_REFRESH_LAG" else 0,
                invalid_or_missing_ask_slot_count=0 if reason == "SOURCE_REFRESH_LAG" else 12,
                reduced_ask_atoms=None, reason_codes=["SYNTHETIC_ABSENCE"],
                lineage_sha256=sha256_hex(canonical_json_bytes({"facts": [r["source_fact_sha256"] for r in slot_documents],
                    "identity_sha256": original[member_id].projection_hash, "source": source, "status": status})))
            facts = [r for r in facts if (r["analysis_unit_id"], r["logical_source"]) != (member_id, source)]
            source_slot_documents[key] = tuple(slot_documents)
        body = {"bucket_date": day.isoformat(), "diagnostics": diagnostics, "formal_state_eligible": False,
            "input_snapshot_sha256": sha256_hex(canonical_json_bytes(facts)), "membership_id": upstream.membership_id,
            "membership_sha256": upstream_hash, "policy_sha256": FROZEN_END_OF_DAY_REDUCTION_POLICY_V1.policy_sha256,
            "reduced_at": utc_timestamp_text(reduced), "schema": "market-sector-v3-eod-source-reduction/1",
            "source_facts": facts, "supplied_slot_count": 12,
            "usage_scope": "INTERNAL_PROSPECTIVE_MARKET_SECTOR_V3_MEASUREMENT"}
        reduction = {**body, "reduction_id": "market_sector_v3_eod_reduction_" + sha256_hex(canonical_json_bytes(body))}
        proof = TrendingEodProof.from_v3_reduction(reduction, artifact_sha256=sha256_hex(canonical_json_bytes(reduction)))
        published = datetime.combine(day, datetime.min.time(), UTC) + timedelta(hours=14)
        book = EcbRateBook(tuple(EcbReferenceLeg(day, currency, cny_rate if currency == "CNY" else Decimal("1"), published, None, published,
            sha256_hex(canonical_json_bytes([currency, day.isoformat()]))) for currency in ("CNY", "USD")))
        rows = []
        for fact in facts:
            member_id, source = fact["analysis_unit_id"], fact["logical_source"]
            definition = {name: getattr(original[member_id], name) for name in (
                "analysis_unit_id", "analysis_unit_kind", "parent_analysis_unit_id", "item_kind", "base_item_code", "edition_kind", "wear_tier")}
            economic = {"fingerprint_sha256": sha256_hex(canonical_json_bytes(definition)),
                        "evidence_sha256": original[member_id].projection_hash, "available_at": utc_timestamp_text(recorded)}
            observation = {"kind": "UTC_DAILY_EOD", "interval_start": utc_timestamp_text(datetime.combine(day, datetime.min.time(), UTC)),
                "interval_end": utc_timestamp_text(datetime.combine(day+timedelta(days=1), datetime.min.time(), UTC)),
                "reduction_policy_sha256": proof.policy_sha256, "reduction_sha256": proof.artifact_sha256,
                "coverage_evidence_sha256": proof.artifact_sha256, "supplied_slot_count": 12, "positive_fresh_slot_count": 12}
            rows.append(project_analysis_price_to_cny_v2(AnalysisSourcePrice(fact["source_fact_sha256"],
                source_ids[(member_id, source)], member_id, source, "upstream", "ASK", event, event, sealed,
                "USD", "USD_ATOMS", fact["ask_atoms"], 8), rate_book=book, valuation_as_of=reduced,
                projected_at=reduced+timedelta(minutes=1), economic_identity=economic, observation=observation))
        projections.append(tuple(rows)); proofs.append(proof)
    policy_id = sha256_hex(canonical_json_bytes({"synthetic_anomaly_policy": 1}))
    start_rows = {(r["source"]["analysis_unit_id"], r["source"]["logical_source"]): r for r in projections[0]}
    end_rows = {(r["source"]["analysis_unit_id"], r["source"]["logical_source"]): r for r in projections[1]}
    assessments = tuple(TrendingAnomalyAssessment(a["source"]["analysis_unit_id"], a["source"]["logical_source"],
        a["document_hash"], b["document_hash"], policy_id, TrendingAnomalyStatus.PASS, evaluated_at, ("SYNTHETIC_PASS",))
        for key in sorted(start_rows.keys() & end_rows.keys()) for a, b in [(start_rows[key], end_rows[key])])
    selection = build_current_endpoint_set_from_daily_projections(membership=membership, result_as_of=result_as_of,
        evaluated_at=evaluated_at, maximum_source_lag_seconds=7200, start_projections=projections[0],
        end_projections=projections[1], start_eod_proof=proofs[0], end_eod_proof=proofs[1],
        anomaly_policy_id=policy_id, anomaly_assessments=assessments, identity_history=history)
    return IdentityFixture(membership, catalogs, history, selection.endpoint_set, dict(upstream.document), catalog_history,
                           source_slot_documents)
