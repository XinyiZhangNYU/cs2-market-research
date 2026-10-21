"""Strict public-promotion models for MARKET, SECTOR, and ITEM results.

The private Result ledger remains the authority for calculations.  This module
only constructs the small allowlisted projection which may be sealed by the
separate public promotion workflow.  In particular, Result display names,
input hashes, case identifiers, source data, and producer diagnostics are never
copied into the public document.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Mapping, Sequence

from jsonschema import Draft202012Validator
from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.catalog import CatalogDisplayProjection
from cs2_research.result.models import UnitResultEnvelope
from cs2_research.state_machine.enums import ScopeKind


PUBLIC_API_CONTRACT = "market-watchlist-public-api"
PUBLIC_API_VERSION = "v1"
PUBLIC_RELEASE = "v0.4ad-market-watchlist-public-results"
MAX_PUBLIC_DOCUMENT_BYTES = 1024 * 1024
SECTOR_CODES = ("GLOVE", "KNIFE", "WEAPON")
ELIGIBLE_DATA_STATUSES = frozenset({"COMPLETE", "DEGRADED_OPTIONAL"})
PRODUCER_KINDS = frozenset({"FORMAL_PROSPECTIVE", "SHADOW", "WARMUP", "RETROSPECTIVE"})
USAGE_SCOPES = frozenset({"FORMAL_PUBLIC_RESULT", "RESEARCH_ONLY", "TEST_ONLY"})

_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = _ROOT / "schemas/market-watchlist-public-api.v1.schema.json"
_SHA = re.compile(r"[0-9a-f]{64}\Z")
_CODE = re.compile(r"[A-Z][A-Z0-9_]{0,63}\Z")
_MEDIA_KEY = re.compile(
    r"[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?"
    r"(?:/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9._-])?)*\Z"
)
_VERSION_ID = re.compile(r"[1-9][0-9]*\Z")
_ANALYSIS_UNIT_KINDS = frozenset({"BASE_MHN", "STYLE_VARIANT", "PATTERN_VARIANT"})
_ITEM_KINDS = frozenset({"WEAPON", "KNIFE", "GLOVE", "AGENT", "OTHER", "UNKNOWN"})
_EDITION_KINDS = frozenset({"STANDARD", "STATTRAK", "SOUVENIR", "UNKNOWN"})
_WEAR_TIERS = frozenset({
    "FACTORY_NEW", "MINIMAL_WEAR", "FIELD_TESTED", "WELL_WORN",
    "BATTLE_SCARRED", "NOT_APPLICABLE", "UNKNOWN",
})
_MEDIA_PRESENTATION_KINDS = frozenset({"SERIES_REPRESENTATIVE", "STYLE_REPRESENTATIVE"})
_PUBLIC_CATALOG_KEYS = {
    "analysis_unit_id", "parent_analysis_unit_id", "analysis_unit_kind", "item_kind",
    "base_item_code", "edition_kind", "wear_tier", "localized_name", "media",
    "catalog_version",
}


class PublicResultContractError(ValueError):
    """A candidate cannot cross the public promotion boundary."""


def _exact(value: Any, keys: set[str], label: str) -> None:
    if not isinstance(value, Mapping) or set(value) != keys:
        raise PublicResultContractError(f"{label} has unexpected fields")


def _object(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, Mapping):
        raise PublicResultContractError(f"{label} must be an object")
    return dict(value)


def _text(value: Any, label: str, *, maximum: int = 256) -> str:
    if (
        not isinstance(value, str)
        or not value
        or value != value.strip()
        or len(value) > maximum
        or any(ord(member) < 32 or ord(member) == 127 or 0xD800 <= ord(member) <= 0xDFFF for member in value)
    ):
        raise PublicResultContractError(f"{label} must be trimmed control-free text")
    return value


def _sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or _SHA.fullmatch(value) is None:
        raise PublicResultContractError(f"{label} must be lowercase SHA-256")
    return value


def _utc(value: datetime, label: str) -> datetime:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() != timezone.utc.utcoffset(value)
    ):
        raise PublicResultContractError(f"{label} must use UTC")
    return value.astimezone(timezone.utc)


def _timestamp_text(value: Any, label: str) -> datetime:
    if not isinstance(value, str):
        raise PublicResultContractError(f"{label} must be a canonical UTC timestamp")
    try:
        parsed = datetime.fromisoformat(value.removesuffix("Z") + "+00:00")
    except ValueError:
        raise PublicResultContractError(f"{label} must be a canonical UTC timestamp") from None
    parsed = _utc(parsed, label)
    if utc_timestamp_text(parsed) != value:
        raise PublicResultContractError(f"{label} must be a canonical UTC timestamp")
    return parsed


def _positive(value: Any, label: str, *, maximum: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= maximum:
        raise PublicResultContractError(f"{label} is outside its allowed range")
    return value


def document_hash(document: Mapping[str, Any]) -> str:
    return sha256_hex(canonical_json_bytes(dict(document)))


def _project_state(envelope: UnitResultEnvelope) -> dict[str, Any]:
    if envelope.data_status.value not in ELIGIBLE_DATA_STATUSES:
        raise PublicResultContractError("only COMPLETE or DEGRADED_OPTIONAL results are eligible")
    state = envelope.state
    common = {
        "analysis_unit_id": envelope.identity.analysis_unit_id,
        "data_status": envelope.data_status.value,
    }
    if envelope.identity.scope_kind is ScopeKind.MARKET:
        return {
            **common,
            "trend_stage": state["trend_stage"],
            "level_regime": state["level_regime"],
            "evidence_flags": list(state["evidence_flags"]),
            "recommendation": state["recommendation"],
            "case_status": state["case_status"],
        }
    if envelope.identity.scope_kind is ScopeKind.SECTOR:
        return {
            **common,
            "trend_stage": state["trend_stage"],
            "relative_strength": state["relative_strength"],
            "breadth": dict(state["breadth"]),
            "evidence_flags": list(state["evidence_flags"]),
            "recommendation": state["recommendation"],
            "case_status": state["case_status"],
        }
    assert envelope.recommendation_detail is not None
    return {
        **common,
        "cycle_stage": state["cycle_stage"],
        "evidence_flags": list(state["evidence_flags"]),
        "regime_relation": list(state["regime_relation"]),
        "recommendation": state["recommendation"],
        "case_status": state["case_status"],
        "recommendation_detail": {
            key: envelope.recommendation_detail[key]
            for key in ("recommendation", "signal_strength", "evidence_coverage", "trade_confirmation")
        },
        "evidence_domains": [
            {
                key: member[key]
                for key in ("domain", "strength", "contributing_feature_keys", "missing_reason")
            }
            for member in envelope.evidence_domains
        ],
        "claims": [claim.value for claim in envelope.claims],
    }


def result_binding(
    envelope: UnitResultEnvelope,
    *,
    document_sha256: str | None = None,
    sector_code: str | None = None,
    display_order: int | None = None,
) -> dict[str, Any]:
    """Bind an exact private Result snapshot to its safe public projection."""

    if not isinstance(envelope, UnitResultEnvelope):
        raise PublicResultContractError("result binding requires a UnitResultEnvelope")
    expected_hash = envelope.document_hash
    if document_sha256 is not None and _sha(document_sha256, "document_sha256") != expected_hash:
        raise PublicResultContractError("result document hash does not match the envelope")
    binding: dict[str, Any] = {
        "snapshot_id": envelope.snapshot_id,
        "document_hash": expected_hash,
        "projection": _project_state(envelope),
    }
    if envelope.identity.scope_kind is ScopeKind.SECTOR:
        if sector_code not in SECTOR_CODES or display_order != SECTOR_CODES.index(sector_code) + 1:
            raise PublicResultContractError("sector code and display order are not canonical")
        binding = {"display_order": display_order, "sector_code": sector_code, **binding}
    elif sector_code is not None or display_order is not None:
        raise PublicResultContractError("only SECTOR bindings carry a sector code")
    return binding


def _validate_catalog_projection(document: Mapping[str, Any]) -> dict[str, Any]:
    """Validate the deliberately smaller public catalog projection.

    This is an independent public wire shape.  It intentionally excludes the
    private catalog's name authority, version context, validity interval, and
    projection hash while retaining only identity/facet fields, trusted names,
    and the controlled same-origin media binding.
    """

    projection = _object(document, "public catalog projection")
    _exact(projection, _PUBLIC_CATALOG_KEYS, "public catalog projection")
    analysis_unit_id = _text(projection["analysis_unit_id"], "catalog.analysis_unit_id")
    parent = projection["parent_analysis_unit_id"]
    if parent is not None:
        parent = _text(parent, "catalog.parent_analysis_unit_id")
    analysis_unit_kind = projection["analysis_unit_kind"]
    if analysis_unit_kind not in _ANALYSIS_UNIT_KINDS:
        raise PublicResultContractError("catalog.analysis_unit_kind is invalid")
    if (analysis_unit_kind == "BASE_MHN") != (parent is None):
        raise PublicResultContractError("catalog parent identity is invalid")
    if parent == analysis_unit_id:
        raise PublicResultContractError("catalog projection cannot be its own parent")
    item_kind = projection["item_kind"]
    if item_kind not in _ITEM_KINDS:
        raise PublicResultContractError("catalog.item_kind is invalid")
    base_item_code = _text(projection["base_item_code"], "catalog.base_item_code")
    edition_kind = projection["edition_kind"]
    if edition_kind not in _EDITION_KINDS:
        raise PublicResultContractError("catalog.edition_kind is invalid")
    wear_tier = projection["wear_tier"]
    if wear_tier not in _WEAR_TIERS:
        raise PublicResultContractError("catalog.wear_tier is invalid")

    names = _object(projection["localized_name"], "catalog.localized_name")
    _exact(names, {"en", "zh_cn"}, "catalog.localized_name")
    names = {
        "en": _text(names["en"], "catalog.localized_name.en", maximum=512),
        "zh_cn": _text(names["zh_cn"], "catalog.localized_name.zh_cn", maximum=512),
    }
    if edition_kind == "STATTRAK" and any("StatTrak™" not in value for value in names.values()):
        raise PublicResultContractError("STATTRAK catalog names must preserve the exact mark")

    media = _object(projection["media"], "catalog.media")
    if media.get("status") == "NOT_PRODUCED":
        _exact(media, {"status"}, "catalog.media")
        media = {"status": "NOT_PRODUCED"}
    elif media.get("status") == "BOUND":
        _exact(
            media,
            {"status", "media_asset_version_id", "media_key", "presentation_kind"},
            "catalog.media",
        )
        media_asset_version_id = _text(
            media["media_asset_version_id"],
            "catalog.media.media_asset_version_id",
        )
        if _VERSION_ID.fullmatch(media_asset_version_id) is None:
            raise PublicResultContractError(
                "catalog.media.media_asset_version_id is invalid"
            )
        media_key = _text(media["media_key"], "catalog.media.media_key")
        if _MEDIA_KEY.fullmatch(media_key) is None or any(
            segment in {".", ".."} for segment in media_key.split("/")
        ):
            raise PublicResultContractError("catalog.media.media_key is invalid")
        if media["presentation_kind"] not in _MEDIA_PRESENTATION_KINDS:
            raise PublicResultContractError("catalog.media.presentation_kind is invalid")
        media = {
            "status": "BOUND",
            "media_asset_version_id": media_asset_version_id,
            "media_key": media_key,
            "presentation_kind": media["presentation_kind"],
        }
    else:
        raise PublicResultContractError("catalog.media.status is invalid")

    return {
        "analysis_unit_id": analysis_unit_id,
        "parent_analysis_unit_id": parent,
        "analysis_unit_kind": analysis_unit_kind,
        "item_kind": item_kind,
        "base_item_code": base_item_code,
        "edition_kind": edition_kind,
        "wear_tier": wear_tier,
        "localized_name": names,
        "media": media,
        "catalog_version": _text(
            projection["catalog_version"], "catalog.catalog_version", maximum=128
        ),
    }


def catalog_projection(document: Mapping[str, Any]) -> dict[str, Any]:
    """Project a validated private catalog row into the minimal public wire."""

    try:
        parsed = CatalogDisplayProjection.from_document(document)
    except (TypeError, ValueError) as exc:
        raise PublicResultContractError("source catalog projection is invalid") from exc
    return _validate_catalog_projection({
        "analysis_unit_id": parsed.analysis_unit_id,
        "parent_analysis_unit_id": parsed.parent_analysis_unit_id,
        "analysis_unit_kind": parsed.analysis_unit_kind,
        "item_kind": parsed.item_kind,
        "base_item_code": parsed.base_item_code,
        "edition_kind": parsed.edition_kind,
        "wear_tier": parsed.wear_tier,
        "localized_name": {
            "en": parsed.localized_name.en,
            "zh_cn": parsed.localized_name.zh_cn,
        },
        "media": (
            parsed.media.to_document()
            if parsed.media.status == "NOT_PRODUCED"
            else {
                **parsed.media.to_document(),
                "media_asset_version_id": parsed.version_context.media_asset_version_id,
            }
        ),
        "catalog_version": parsed.catalog_version,
    })


@dataclass(frozen=True, slots=True)
class PublicProducerRelease:
    release_code: str
    producer_kind: str
    usage_scope: str
    formal_state_eligible: bool
    algorithm_version: str
    parameter_set_version: str
    data_quality_policy_version: str
    freshness_seconds: int
    retention_seconds: int

    def __post_init__(self) -> None:
        _text(self.release_code, "release_code")
        if self.producer_kind not in PRODUCER_KINDS:
            raise PublicResultContractError("unsupported producer_kind")
        if self.usage_scope not in USAGE_SCOPES:
            raise PublicResultContractError("unsupported usage_scope")
        if type(self.formal_state_eligible) is not bool:
            raise PublicResultContractError("formal_state_eligible must be boolean")
        if self.formal_state_eligible != (
            self.producer_kind == "FORMAL_PROSPECTIVE" and self.usage_scope == "FORMAL_PUBLIC_RESULT"
        ):
            raise PublicResultContractError("formal eligibility disagrees with release class")
        for label in ("algorithm_version", "parameter_set_version", "data_quality_policy_version"):
            _text(getattr(self, label), label)
        _positive(self.freshness_seconds, "freshness_seconds", maximum=31_536_000)
        _positive(self.retention_seconds, "retention_seconds", maximum=63_072_000)
        if self.retention_seconds < self.freshness_seconds:
            raise PublicResultContractError("retention must not precede freshness")

    def to_document(self) -> dict[str, Any]:
        return {
            "release_code": self.release_code,
            "producer_kind": self.producer_kind,
            "usage_scope": self.usage_scope,
            "formal_state_eligible": self.formal_state_eligible,
            "algorithm_version": self.algorithm_version,
            "parameter_set_version": self.parameter_set_version,
            "data_quality_policy_version": self.data_quality_policy_version,
            "freshness_seconds": self.freshness_seconds,
            "retention_seconds": self.retention_seconds,
        }

    @property
    def release_id(self) -> str:
        return document_hash(self.to_document())


@dataclass(frozen=True, slots=True)
class WatchlistPolicy:
    policy_code: str
    member_cap: int
    allow_empty: bool
    allowed_reason_codes: tuple[str, ...]

    def __post_init__(self) -> None:
        _text(self.policy_code, "policy_code")
        _positive(self.member_cap, "member_cap", maximum=500)
        if type(self.allow_empty) is not bool:
            raise PublicResultContractError("allow_empty must be boolean")
        if not isinstance(self.allowed_reason_codes, tuple):
            raise PublicResultContractError("allowed_reason_codes must be a tuple")
        if tuple(sorted(self.allowed_reason_codes)) != self.allowed_reason_codes or len(set(self.allowed_reason_codes)) != len(self.allowed_reason_codes):
            raise PublicResultContractError("allowed_reason_codes must be unique and sorted")
        if any(not isinstance(code, str) or _CODE.fullmatch(code) is None for code in self.allowed_reason_codes):
            raise PublicResultContractError("invalid inclusion reason code")

    def to_document(self) -> dict[str, Any]:
        return {
            "policy_code": self.policy_code,
            "member_cap": self.member_cap,
            "allow_empty": self.allow_empty,
            "allowed_reason_codes": list(self.allowed_reason_codes),
        }

    @property
    def policy_id(self) -> str:
        return document_hash(self.to_document())


@dataclass(frozen=True, slots=True)
class PublicManifest:
    producer_release_id: str
    watchlist_policy_id: str
    result_as_of: datetime
    input_available_at: datetime
    public_available_at: datetime
    fresh_until: datetime
    retain_until: datetime
    supersedes_publication_id: str | None
    catalog: Mapping[str, Any]
    market: Mapping[str, Any]
    sectors: tuple[Mapping[str, Any], ...]
    watchlist: tuple[Mapping[str, Any], ...]

    def __post_init__(self) -> None:
        _sha(self.producer_release_id, "producer_release_id")
        _sha(self.watchlist_policy_id, "watchlist_policy_id")
        if self.supersedes_publication_id is not None:
            _sha(self.supersedes_publication_id, "supersedes_publication_id")
        clocks = tuple(_utc(getattr(self, name), name) for name in (
            "result_as_of", "input_available_at", "public_available_at", "fresh_until", "retain_until"
        ))
        if not (clocks[1] <= clocks[0] <= clocks[2] <= clocks[3] <= clocks[4]):
            raise PublicResultContractError("manifest clocks are not monotonic")
        catalog = _object(self.catalog, "catalog")
        _exact(catalog, {"snapshot_id", "catalog_version", "as_of", "available_at", "member_count", "member_set_hash"}, "catalog")
        _sha(catalog["snapshot_id"], "catalog.snapshot_id")
        _sha(catalog["member_set_hash"], "catalog.member_set_hash")
        _text(catalog["catalog_version"], "catalog.catalog_version")
        if isinstance(catalog["member_count"], bool) or not isinstance(catalog["member_count"], int) or catalog["member_count"] < 0:
            raise PublicResultContractError("catalog.member_count is invalid")
        catalog_as_of = _timestamp_text(catalog["as_of"], "catalog.as_of")
        catalog_available_at = _timestamp_text(catalog["available_at"], "catalog.available_at")
        if catalog_as_of > self.result_as_of or catalog_available_at > self.public_available_at:
            raise PublicResultContractError("catalog clocks exceed the manifest boundary")
        market = _object(self.market, "market binding")
        _exact(market, {"snapshot_id", "document_hash", "projection"}, "market binding")
        _sha(market["snapshot_id"], "market.snapshot_id")
        _sha(market["document_hash"], "market.document_hash")
        if not isinstance(market["projection"], Mapping):
            raise PublicResultContractError("market projection must be an object")
        if len(self.sectors) != 3:
            raise PublicResultContractError("manifest requires exactly three sectors")
        for index, member in enumerate(self.sectors):
            member = _object(member, "sector binding")
            _exact(
                member,
                {"display_order", "sector_code", "snapshot_id", "document_hash", "projection"},
                "sector binding",
            )
            if (
                _positive(member.get("display_order"), "sector.display_order", maximum=3)
                != index + 1
                or member.get("sector_code") != SECTOR_CODES[index]
            ):
                raise PublicResultContractError("sector order must be GLOVE, KNIFE, WEAPON")
            _sha(member["snapshot_id"], "sector.snapshot_id")
            _sha(member["document_hash"], "sector.document_hash")
            if not isinstance(member["projection"], Mapping):
                raise PublicResultContractError("sector projection must be an object")
        if len(self.watchlist) > 500:
            raise PublicResultContractError("watchlist exceeds the absolute member cap")
        for index, member in enumerate(self.watchlist, 1):
            member = _object(member, "watchlist member")
            _exact(member, {"rank", "tie_break_key", "inclusion_reason_codes", "result_binding", "catalog"}, "watchlist member")
            binding = _object(member["result_binding"], "watchlist result binding")
            _exact(
                binding,
                {"snapshot_id", "document_hash", "projection"},
                "watchlist result binding",
            )
            projection = _object(binding["projection"], "watchlist result projection")
            catalog_member = _object(member["catalog"], "watchlist catalog projection")
            if (
                _positive(member["rank"], "watchlist.rank", maximum=500) != index
                or member["tie_break_key"] != projection.get("analysis_unit_id")
            ):
                raise PublicResultContractError("watchlist rank or tie-break is invalid")
            if catalog_member.get("analysis_unit_id") != member["tie_break_key"]:
                raise PublicResultContractError("watchlist catalog identity does not match result")
            _sha(binding["snapshot_id"], "watchlist.snapshot_id")
            _sha(binding["document_hash"], "watchlist.document_hash")
            if not isinstance(member["inclusion_reason_codes"], (list, tuple)):
                raise PublicResultContractError("watchlist inclusion reasons must be an array")
            reasons = tuple(member["inclusion_reason_codes"])
            if (
                tuple(sorted(reasons)) != reasons
                or len(set(reasons)) != len(reasons)
                or any(not isinstance(code, str) or _CODE.fullmatch(code) is None for code in reasons)
            ):
                raise PublicResultContractError("watchlist inclusion reasons are not canonical")
            validated_catalog = _validate_catalog_projection(catalog_member)
            if validated_catalog["catalog_version"] != catalog["catalog_version"]:
                raise PublicResultContractError("watchlist catalog version differs from the descriptor")

    def to_document(self) -> dict[str, Any]:
        return {
            "schema_version": "market-watchlist-public-manifest/1",
            "producer_release_id": self.producer_release_id,
            "watchlist_policy_id": self.watchlist_policy_id,
            "result_as_of": utc_timestamp_text(self.result_as_of),
            "input_available_at": utc_timestamp_text(self.input_available_at),
            "public_available_at": utc_timestamp_text(self.public_available_at),
            "fresh_until": utc_timestamp_text(self.fresh_until),
            "retain_until": utc_timestamp_text(self.retain_until),
            "supersedes_publication_id": self.supersedes_publication_id,
            "catalog": dict(self.catalog),
            "market": dict(self.market),
            "sectors": [dict(member) for member in self.sectors],
            "watchlist": [dict(member) for member in self.watchlist],
        }

    @property
    def manifest_hash(self) -> str:
        return document_hash(self.to_document())


def watchlist_member(
    *,
    rank: int,
    result: UnitResultEnvelope,
    catalog: Mapping[str, Any],
    inclusion_reason_codes: Sequence[str],
) -> dict[str, Any]:
    if result.identity.scope_kind is not ScopeKind.ITEM:
        raise PublicResultContractError("watchlist members require ITEM results")
    projection = catalog_projection(catalog)
    if projection["analysis_unit_id"] != result.identity.analysis_unit_id:
        raise PublicResultContractError("catalog and result analysis unit differ")
    reasons = tuple(inclusion_reason_codes)
    if tuple(sorted(reasons)) != reasons or len(reasons) != len(set(reasons)):
        raise PublicResultContractError("inclusion reason codes must be unique and sorted")
    if any(not isinstance(code, str) or _CODE.fullmatch(code) is None for code in reasons):
        raise PublicResultContractError("invalid inclusion reason code")
    return {
        "rank": _positive(rank, "rank", maximum=500),
        "tie_break_key": result.identity.analysis_unit_id,
        "inclusion_reason_codes": list(reasons),
        "result_binding": result_binding(result),
        "catalog": projection,
    }


@lru_cache(maxsize=1)
def public_validator() -> Draft202012Validator:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


def validate_public_document(document: Mapping[str, Any]) -> None:
    try:
        raw = canonical_json_bytes(dict(document))
    except (TypeError, ValueError, UnicodeError, RecursionError) as exc:
        raise PublicResultContractError("public document is not canonical JSON") from exc
    if len(raw) > MAX_PUBLIC_DOCUMENT_BYTES:
        raise PublicResultContractError("public document exceeds 1 MiB")
    if not public_validator().is_valid(document):
        raise PublicResultContractError("public document violates the shared Schema")


__all__ = [
    "ELIGIBLE_DATA_STATUSES", "MAX_PUBLIC_DOCUMENT_BYTES", "PUBLIC_API_CONTRACT",
    "PUBLIC_API_VERSION", "PUBLIC_RELEASE", "PublicManifest", "PublicProducerRelease",
    "PublicResultContractError", "SECTOR_CODES", "WatchlistPolicy", "catalog_projection",
    "document_hash", "public_validator", "result_binding", "validate_public_document",
    "watchlist_member",
]
