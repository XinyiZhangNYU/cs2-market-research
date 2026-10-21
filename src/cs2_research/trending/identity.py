"""Exact economic identity proof; presentation changes do not change economics.

This is not an alias/compatibility policy: only the existing catalog's exact
economic fields are compared. No source name inference or retrospective seal.
"""
from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, field, fields, replace
from datetime import datetime
from decimal import Decimal
from types import MappingProxyType
from typing import Any, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.catalog.display import CatalogDisplayProjection
from cs2_research.catalog.models import ItemAnalysisUnitVersion, ItemVariantVersion, SourceMappingVersion
from cs2_research.catalog.resolver import resolve_analysis_unit, resolve_source_mapping
from cs2_research.feature_input.market_sector_cny_v3 import load_v3_member_source_ids
from cs2_research.feature_input.market_sector_taxonomy_v3 import (
    build_taxonomy_membership_v3, load_taxonomy_membership_v3,
)
from .models import (TrendingCatalogMember, TrendingContractError, parse_timestamp,
                     require, require_exact_keys, require_sha256, strict_json_bytes)


ECONOMIC_FIELDS = (
    "analysis_unit_id", "analysis_unit_kind", "parent_analysis_unit_id",
    "item_kind", "base_item_code", "edition_kind", "wear_tier",
)


def bind_member_economic_identity(
    member: TrendingCatalogMember, projection: Mapping[str, Any],
) -> TrendingCatalogMember:
    """Bind the exact already-known member to its validated full projection.

    Callers cannot move its knowledge time or swap the sealed display row.
    A successor presentation-only row can form its own new membership with the
    same economic fingerprint, without pretending its display hash is old.
    """
    parsed = CatalogDisplayProjection.from_document(projection)
    require(parsed.projection_hash == member.projection_sha256, "MEMBER_ECONOMIC_PROJECTION_MISMATCH")
    definition = {field: getattr(parsed, field) for field in ECONOMIC_FIELDS}
    evidence = {
        "definition": definition,
        "fingerprint_sha256": sha256_hex(canonical_json_bytes(definition)),
        "evidence_sha256": parsed.projection_hash,
        "available_at": utc_timestamp_text(member.identity_available_at),
    }
    return replace(member, economic_identity=evidence)


def source_economic_identity(member: TrendingCatalogMember) -> dict[str, Any]:
    """Return the compact producer binding, never a guessed source identity."""
    require(member.economic_identity is not None, "MEMBER_ECONOMIC_PROOF_REQUIRED")
    # Round-trip revalidates against the member fields and current proof bytes.
    checked = TrendingCatalogMember.from_document(member.to_document())
    return {key: checked.economic_identity[key]
            for key in ("fingerprint_sha256", "evidence_sha256", "available_at")}


TRENDING_IDENTITY_HISTORY_SCHEMA = "single-item-trending-identity-history/1"
CATALOG_IDENTITY_HISTORY_SCHEMA = "single-item-trending-catalog-identity-history/1"


def identity_version_document(version: Any) -> dict[str, Any]:
    """Serialize an existing catalog version without rewriting its clocks."""
    require(type(version) in {ItemVariantVersion, ItemAnalysisUnitVersion, SourceMappingVersion},
            "D4_IDENTITY_VERSION_TYPE")
    def scalar(value: Any) -> Any:
        if isinstance(value, datetime):
            return utc_timestamp_text(value)
        if isinstance(value, Decimal):
            return str(value)
        if isinstance(value, tuple):
            return list(value)
        return value
    return {field.name: scalar(getattr(version, field.name)) for field in fields(version)}


def _version(value: Any, model: type) -> Any:
    raw = require_exact_keys(value, {field.name for field in fields(model)}, "D4_IDENTITY_VERSION_FIELDS")
    parsed = dict(raw)
    for name in ("valid_from", "recorded_at", "valid_to"):
        if parsed[name] is not None:
            parsed[name] = parse_timestamp(parsed[name], "D4_IDENTITY_VERSION_CLOCK")
    if model is SourceMappingVersion:
        for name in ("min_float", "max_float"):
            if parsed[name] is not None:
                require(isinstance(parsed[name], str), "D4_IDENTITY_FLOAT_TYPE")
                parsed[name] = Decimal(parsed[name])
        require(isinstance(parsed["candidate_item_ids"], list), "D4_IDENTITY_CANDIDATES")
        parsed["candidate_item_ids"] = tuple(parsed["candidate_item_ids"])
    try:
        version = model(**parsed)
    except (TypeError, ValueError) as exc:
        raise TrendingContractError("D4_IDENTITY_VERSION_INVALID") from exc
    require(identity_version_document(version) == dict(raw), "D4_IDENTITY_VERSION_CANONICAL")
    return version


@dataclass(frozen=True, slots=True)
class TrendingIdentityHistory:
    """Exact archived catalog histories and upstream snapshots, never an approval.

    Artifact values are the ORIGINAL UTF-8 text, not normalized JSON. Their hash
    must match the dependencies already sealed by the EOD memberships. Catalog
    versions retain valid_from/valid_to and recorded_at. Late packaging records
    assembled_at separately and cannot make a late version known at an endpoint.
    Authentic extraction and complete historical records remain provenance duties
    of the existing reviewer-owned evidence release, not a new boolean here.
    """

    assembled_at: datetime
    catalog_history_sha256: str
    upstream_membership_sha256s: tuple[str, ...]
    artifacts: Mapping[str, str]
    _upstreams: Mapping[str, Any] = field(init=False, repr=False, compare=False)
    _source_ids: Mapping[str, Mapping[tuple[str, str], int]] = field(init=False, repr=False, compare=False)
    _upstream_members: Mapping[str, Mapping[str, Any]] = field(init=False, repr=False, compare=False)
    _variants: Mapping[int, tuple[ItemVariantVersion, ...]] = field(init=False, repr=False, compare=False)
    _units: Mapping[int, tuple[ItemAnalysisUnitVersion, ...]] = field(init=False, repr=False, compare=False)
    _mappings: Mapping[tuple[str, str], tuple[SourceMappingVersion, ...]] = field(init=False, repr=False, compare=False)
    _projections: Mapping[str, CatalogDisplayProjection] = field(init=False, repr=False, compare=False)
    _history_sha256: str = field(init=False, repr=False, compare=False)

    def __post_init__(self) -> None:
        parse_timestamp(utc_timestamp_text(self.assembled_at), "D4_IDENTITY_ASSEMBLED")
        require_sha256(self.catalog_history_sha256, "D4_IDENTITY_CATALOG_HISTORY_HASH")
        require(isinstance(self.artifacts, Mapping), "D4_IDENTITY_ARTIFACTS")
        copied: dict[str, str] = {}
        for digest, raw in self.artifacts.items():
            require_sha256(digest, "D4_IDENTITY_ARTIFACT_HASH")
            require(isinstance(raw, str), "D4_IDENTITY_ARTIFACT_TEXT")
            require(sha256_hex(raw.encode("utf-8")) == digest, "D4_IDENTITY_ARTIFACT_DRIFT")
            copied[digest] = raw
        object.__setattr__(self, "artifacts", MappingProxyType(dict(sorted(copied.items()))))
        require(self.upstream_membership_sha256s == tuple(sorted(set(self.upstream_membership_sha256s)))
                and bool(self.upstream_membership_sha256s), "D4_IDENTITY_UPSTREAM_SET")
        history = self.catalog_history
        upstreams, source_ids, upstream_members = {}, {}, {}
        for digest in self.upstream_membership_sha256s:
            upstream = load_taxonomy_membership_v3(self.payload(digest), expected_sha256=digest)
            hashes = upstream.document["input_hashes"]
            inputs = ("policy", "catalog", "schema", "predecessor_membership", "predecessor_profile")
            rebuilt = build_taxonomy_membership_v3(
                **{f"{name}_payload": self.payload(hashes[name]) for name in inputs},
                **{f"expected_{name}_sha256": hashes[name] for name in inputs},
                sealed_at=upstream.sealed_at,
            )
            require(canonical_json_bytes(rebuilt.document) == canonical_json_bytes(upstream.document),
                    "D4_IDENTITY_UPSTREAM_REBUILD_DRIFT")
            catalog = strict_json_bytes(self.payload(hashes["catalog"]), "D4_IDENTITY_CATALOG_JSON")
            catalog_rows = tuple(CatalogDisplayProjection.from_document(row["projection"])
                                 for row in catalog["members"])
            require(len({row.analysis_unit_id for row in catalog_rows}) == len(catalog_rows),
                    "D4_IDENTITY_CATALOG_DUPLICATE")
            catalog_by_id = {row.analysis_unit_id: row for row in catalog_rows}
            for member in upstream.members:
                if member.identity_authority == "EXACT_INTERNAL_CATALOG_PROJECTION":
                    original = catalog_by_id.get(member.analysis_unit_id)
                    require(original is not None and original.projection_hash == member.identity_sha256
                            and original.localized_name.en == member.market_hash_name,
                            "D4_IDENTITY_ORIGINAL_CATALOG_DRIFT")
            upstreams[digest] = upstream
            upstream_members[digest] = MappingProxyType({row.analysis_unit_id: row for row in upstream.members})
            require(upstream.sealed_at <= self.assembled_at, "D4_IDENTITY_ASSEMBLY_BEFORE_SEAL")
            schema_hash = upstream.document["input_hashes"]["schema"]
            source_ids[digest] = MappingProxyType(dict(load_v3_member_source_ids(
                schema_payload=self.payload(schema_hash), expected_schema_sha256=schema_hash, membership=upstream)))
        object.__setattr__(self, "_upstreams", MappingProxyType(upstreams))
        object.__setattr__(self, "_source_ids", MappingProxyType(source_ids))
        object.__setattr__(self, "_upstream_members", MappingProxyType(upstream_members))
        for collection, model in (("variant_versions", ItemVariantVersion),
                                  ("analysis_unit_versions", ItemAnalysisUnitVersion),
                                  ("source_mappings", SourceMappingVersion)):
            require(isinstance(history[collection], list), "D4_IDENTITY_HISTORY_ROWS")
            versions = tuple(_version(row, model) for row in history[collection])
            id_field = {ItemVariantVersion: "variant_version_id",
                        ItemAnalysisUnitVersion: "analysis_unit_version_id",
                        SourceMappingVersion: "mapping_version_id"}[model]
            ids = tuple(getattr(row, id_field) for row in versions)
            require(ids == tuple(sorted(set(ids))), "D4_IDENTITY_VERSION_IDS")
            for row in versions:
                require(row.recorded_at <= self.assembled_at, "D4_IDENTITY_ASSEMBLY_BEFORE_RECORD")
                require(row.evidence_hash is not None, "D4_IDENTITY_VERSION_EVIDENCE_REQUIRED")
                self.payload(row.evidence_hash)
            grouped: dict[Any, list[Any]] = {}
            for row in versions:
                key = (row.source_code, row.source_item_id) if model is SourceMappingVersion else row.item_id
                grouped.setdefault(key, []).append(row)
            target = {ItemVariantVersion: "_variants", ItemAnalysisUnitVersion: "_units",
                      SourceMappingVersion: "_mappings"}[model]
            object.__setattr__(self, target, MappingProxyType({key: tuple(rows) for key, rows in grouped.items()}))
        require(isinstance(history["catalog_projections"], list), "D4_IDENTITY_CATALOG_PROJECTIONS")
        projections = tuple(CatalogDisplayProjection.from_document(row)
                            for row in history["catalog_projections"])
        keys = tuple(row.projection_hash for row in projections)
        require(keys == tuple(sorted(set(keys))), "D4_IDENTITY_PROJECTION_IDS")
        object.__setattr__(self, "_projections", MappingProxyType({row.projection_hash: row for row in projections}))
        object.__setattr__(self, "_history_sha256", sha256_hex(canonical_json_bytes(self.body_document())))

    def payload(self, digest: str) -> bytes:
        require_sha256(digest, "D4_IDENTITY_DEPENDENCY_HASH")
        require(digest in self.artifacts, "D4_IDENTITY_DEPENDENCY_MISSING")
        return self.artifacts[digest].encode("utf-8")

    @property
    def catalog_history(self) -> Mapping[str, Any]:
        document = strict_json_bytes(self.payload(self.catalog_history_sha256), "D4_IDENTITY_HISTORY_JSON")
        value = require_exact_keys(document, {"schema_version", "variant_versions",
            "analysis_unit_versions", "source_mappings", "catalog_projections"}, "D4_IDENTITY_HISTORY_FIELDS")
        require(value["schema_version"] == CATALOG_IDENTITY_HISTORY_SCHEMA, "D4_IDENTITY_HISTORY_SCHEMA")
        return value

    def upstream(self, digest: str) -> Any:
        require(digest in self.upstream_membership_sha256s, "D4_IDENTITY_UPSTREAM_UNBOUND")
        # The upstream model retains a mutable JSON document. Do not expose the
        # cached object that was rebuilt from frozen original artifact bytes.
        return deepcopy(self._upstreams[digest])

    def body_document(self) -> dict[str, Any]:
        return {"schema_version": TRENDING_IDENTITY_HISTORY_SCHEMA,
                "assembled_at": utc_timestamp_text(self.assembled_at),
                "catalog_history_sha256": self.catalog_history_sha256,
                "upstream_membership_sha256s": list(self.upstream_membership_sha256s),
                "artifacts": dict(self.artifacts)}

    @property
    def history_sha256(self) -> str:
        return self._history_sha256

    def to_document(self) -> dict[str, Any]:
        return {"identity_history_sha256": self.history_sha256, **self.body_document()}

    @classmethod
    def from_document(cls, value: Any) -> "TrendingIdentityHistory":
        raw = require_exact_keys(value, {"identity_history_sha256", "schema_version", "assembled_at",
            "catalog_history_sha256", "upstream_membership_sha256s", "artifacts"}, "D4_IDENTITY_DOCUMENT")
        require(raw["schema_version"] == TRENDING_IDENTITY_HISTORY_SCHEMA, "D4_IDENTITY_SCHEMA")
        require(isinstance(raw["upstream_membership_sha256s"], list), "D4_IDENTITY_UPSTREAM_SET")
        history = cls(assembled_at=parse_timestamp(raw["assembled_at"], "D4_IDENTITY_ASSEMBLED"),
                      catalog_history_sha256=raw["catalog_history_sha256"],
                      upstream_membership_sha256s=tuple(raw["upstream_membership_sha256s"]),
                      artifacts=raw["artifacts"])
        require(history.to_document() == dict(raw), "D4_IDENTITY_HISTORY_ID")
        return history

    def bind_endpoint(self, projection: Mapping[str, Any], *, upstream_membership_id: str,
                      upstream_membership_sha256: str) -> dict[str, Any]:
        """Resolve the retained endpoint event at its OWN historical cutoff."""
        from cs2_research.fx.analysis import validate_cny_analysis_projection
        validate_cny_analysis_projection(projection)
        receipt = self._bind_source_identity(projection["source"], projection["economic_identity"],
            upstream_membership_id=upstream_membership_id,
            upstream_membership_sha256=upstream_membership_sha256)
        return {"projection_sha256": projection["document_hash"], "projection": dict(projection), **receipt}

    def bind_source_observation(self, *, analysis_unit_id: str, source_code: str,
                                event_at: datetime, upstream_membership_sha256: str) -> dict[str, Any]:
        """Resolve a missing quote's identity without inventing a price projection."""
        require(upstream_membership_sha256 in self.upstream_membership_sha256s,
                "D4_IDENTITY_UPSTREAM_UNBOUND")
        upstream = self._upstreams[upstream_membership_sha256]
        member = self._upstream_members[upstream_membership_sha256].get(analysis_unit_id)
        require(member is not None, "D4_IDENTITY_UPSTREAM_MEMBER_UNPROVEN")
        original = self._projections.get(member.identity_sha256)
        require(original is not None, "D4_IDENTITY_ORIGINAL_PROJECTION_MISSING")
        source_item_id = self._source_ids[upstream_membership_sha256].get((analysis_unit_id, source_code))
        require(source_item_id is not None, "D4_IDENTITY_SOURCE_ITEM_DRIFT")
        source = {"analysis_unit_id": analysis_unit_id, "logical_source": source_code,
                  "source_item_id": source_item_id, "event_at": utc_timestamp_text(event_at),
                  "identity_available_at": utc_timestamp_text(upstream.sealed_at)}
        economic = {"fingerprint_sha256": sha256_hex(canonical_json_bytes(
                        {name: getattr(original, name) for name in ECONOMIC_FIELDS})),
                    "evidence_sha256": original.projection_hash,
                    "available_at": utc_timestamp_text(upstream.sealed_at)}
        return self._bind_source_identity(source, economic, upstream_membership_id=upstream.membership_id,
                                         upstream_membership_sha256=upstream_membership_sha256)

    def _bind_source_identity(self, source: Mapping[str, Any], economic: Mapping[str, Any], *,
                              upstream_membership_id: str, upstream_membership_sha256: str) -> dict[str, Any]:
        event_at = parse_timestamp(source["event_at"], "D4_IDENTITY_EVENT")
        # Internal read-only validation needs two scalar fields, not a deep copy
        # of the entire catalog per source leg. The public accessor still copies
        # its mutable document, so callers cannot mutate this verified cache.
        require(upstream_membership_sha256 in self.upstream_membership_sha256s,
                "D4_IDENTITY_UPSTREAM_UNBOUND")
        upstream = self._upstreams[upstream_membership_sha256]
        require(upstream.membership_id == upstream_membership_id, "D4_IDENTITY_UPSTREAM_ID")
        require(upstream.sealed_at <= event_at, "D4_IDENTITY_UPSTREAM_LATE")
        require(parse_timestamp(source["identity_available_at"], "D4_IDENTITY_SOURCE_KNOWN")
                == upstream.sealed_at, "D4_IDENTITY_SOURCE_CLOCK_DRIFT")
        member = self._upstream_members[upstream_membership_sha256].get(source["analysis_unit_id"])
        require(member is not None and member.identity_authority == "EXACT_INTERNAL_CATALOG_PROJECTION",
                "D4_IDENTITY_UPSTREAM_MEMBER_UNPROVEN")
        schema_hash = upstream.document["input_hashes"]["schema"]
        source_ids = self._source_ids[upstream_membership_sha256]
        require(source_ids.get((member.analysis_unit_id, source["logical_source"])) == source["source_item_id"],
                "D4_IDENTITY_SOURCE_ITEM_DRIFT")
        mappings = self._mappings.get((source["logical_source"], str(source["source_item_id"])), ())
        resolution = resolve_source_mapping(mappings, source_code=source["logical_source"],
            source_item_id=str(source["source_item_id"]), source_style_id=None, scope_kind="MARKET_HASH_NAME",
            valid_at=event_at, known_at=event_at, observed_market_hash_name=member.market_hash_name)
        require(resolution.status == "RESOLVED" and resolution.mapping is not None,
                "D4_IDENTITY_MAPPING_" + resolution.status)
        mapping = resolution.mapping
        require(mapping.semantic_status == "CONFIRMED", "D4_IDENTITY_MAPPING_UNCONFIRMED")
        require(member.analysis_unit_id == f"item:{mapping.item_id}", "D4_IDENTITY_INTERNAL_ITEM_DRIFT")
        unit_resolution = resolve_analysis_unit(self._units.get(mapping.item_id, ()),
                                               item_id=mapping.item_id, valid_at=event_at, known_at=event_at)
        require(unit_resolution.status == "RESOLVED" and unit_resolution.version is not None,
                "D4_IDENTITY_UNIT_" + unit_resolution.status)
        unit = unit_resolution.version
        active = [row for row in self._variants.get(mapping.item_id, ()) if row.recorded_at <= event_at
                  and row.valid_from <= event_at and (row.valid_to is None or event_at < row.valid_to)]
        require(bool(active), "D4_IDENTITY_VARIANT_NOT_VALID_OR_KNOWN")
        latest_valid = max(row.valid_from for row in active)
        active = [row for row in active if row.valid_from == latest_valid]
        require(len(active) == 1, "D4_IDENTITY_VARIANT_CONFLICT")
        variant = active[0]
        require(unit.semantic_status == variant.semantic_status == "CONFIRMED", "D4_IDENTITY_ECONOMICS_UNCONFIRMED")
        original = self._projections.get(member.identity_sha256)
        require(original is not None, "D4_IDENTITY_ORIGINAL_PROJECTION_MISSING")
        require(original.version_context.item_variant_version_id == str(variant.variant_version_id)
                and original.version_context.analysis_unit_version_id == str(unit.analysis_unit_version_id),
                "D4_IDENTITY_CATALOG_VERSION_DRIFT")
        require(original.analysis_unit_id == member.analysis_unit_id
                and original.analysis_unit_kind == unit.analysis_unit_kind
                and original.item_kind == variant.item_kind and original.base_item_code == variant.base_item_code
                and original.edition_kind == variant.edition_kind and original.wear_tier == variant.wear_tier
                and variant.market_hash_name == member.market_hash_name, "D4_IDENTITY_ECONOMIC_CONTENT_DRIFT")
        fingerprint = sha256_hex(canonical_json_bytes({name: getattr(original, name) for name in ECONOMIC_FIELDS}))
        require(economic["fingerprint_sha256"] == fingerprint
                and economic["evidence_sha256"] == original.projection_hash, "D4_IDENTITY_PROJECTION_EVIDENCE_DRIFT")
        economic_known = parse_timestamp(economic["available_at"], "D4_IDENTITY_ECONOMIC_KNOWN")
        require(max(variant.recorded_at, unit.recorded_at) <= economic_known <= event_at,
                "D4_IDENTITY_ECONOMIC_CLOCK_DRIFT")
        require(mapping.recorded_at <= upstream.sealed_at, "D4_IDENTITY_MAPPING_AFTER_SEAL")
        return {
            "identity_history_sha256": self.history_sha256,
            "upstream_membership_id": upstream_membership_id,
            "upstream_membership_sha256": upstream_membership_sha256,
            "upstream_schema_sha256": schema_hash,
            "catalog_projection_sha256": original.projection_hash,
            "economic_identity_sha256": fingerprint,
            "mapping_version": identity_version_document(mapping), "variant_version": identity_version_document(variant),
            "analysis_unit_version": identity_version_document(unit), "valid_at": utc_timestamp_text(event_at),
            "known_at": utc_timestamp_text(event_at),
        }

    def bind_pair(self, start: Mapping[str, Any], end: Mapping[str, Any], *,
                  start_membership_id: str, start_membership_sha256: str,
                  end_membership_id: str, end_membership_sha256: str) -> dict[str, Any]:
        return {"schema_version": "single-item-trending-identity-binding/1",
                "identity_history_sha256": self.history_sha256,
                "start": self.bind_endpoint(start, upstream_membership_id=start_membership_id,
                                            upstream_membership_sha256=start_membership_sha256),
                "end": self.bind_endpoint(end, upstream_membership_id=end_membership_id,
                                          upstream_membership_sha256=end_membership_sha256)}

    def validate_binding(self, value: Mapping[str, Any]) -> None:
        """Rebuild a receipt from the original histories; a digest is insufficient."""
        raw = require_exact_keys(value, {"schema_version", "identity_history_sha256", "start", "end"},
                                 "D4_IDENTITY_BINDING_FIELDS")
        require(isinstance(raw["start"], Mapping) and isinstance(raw["end"], Mapping),
                "D4_IDENTITY_ENDPOINT_RECEIPTS")
        start, end = raw["start"], raw["end"]
        expected = self.bind_pair(start["projection"], end["projection"],
            start_membership_id=start["upstream_membership_id"],
            start_membership_sha256=start["upstream_membership_sha256"],
            end_membership_id=end["upstream_membership_id"],
            end_membership_sha256=end["upstream_membership_sha256"])
        require(canonical_json_bytes(dict(raw)) == canonical_json_bytes(expected), "D4_IDENTITY_BINDING_CONTENT_DRIFT")
