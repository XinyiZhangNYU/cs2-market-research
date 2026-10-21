from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Literal


ItemKind = Literal["WEAPON", "KNIFE", "GLOVE", "AGENT", "OTHER", "UNKNOWN"]
WearTier = Literal[
    "FACTORY_NEW",
    "MINIMAL_WEAR",
    "FIELD_TESTED",
    "WELL_WORN",
    "BATTLE_SCARRED",
    "NOT_APPLICABLE",
    "UNKNOWN",
]
EditionKind = Literal["STANDARD", "STATTRAK", "SOUVENIR", "UNKNOWN"]
SemanticStatus = Literal["CONFIRMED", "INFERRED", "UNVERIFIED"]
ScopeKind = Literal[
    "AGGREGATE",
    "MARKET_HASH_NAME",
    "WEAR_RANGE",
    "STYLE",
    "STYLE_WEAR",
    "EXACT_VARIANT",
]
MappingStatus = Literal["RESOLVED", "UNKNOWN", "AMBIGUOUS", "CONFLICT", "REJECTED"]
AnalysisUnitKind = Literal["BASE_MHN", "STYLE_VARIANT", "PATTERN_VARIANT"]
PromotionStatus = Literal["BASE_MHN", "INTERNAL_VARIANT"]
ResolutionStatus = Literal[
    "RESOLVED",
    "UNKNOWN",
    "AMBIGUOUS",
    "CONFLICT",
    "REJECTED",
    "NAME_MISMATCH",
    "OUT_OF_VALIDITY",
    "NOT_YET_KNOWN",
]


_SOURCE_CODE = re.compile(r"^[a-z0-9_]+$")
_ITEM_KINDS = {"WEAPON", "KNIFE", "GLOVE", "AGENT", "OTHER", "UNKNOWN"}
_WEAR_TIERS = {
    "FACTORY_NEW",
    "MINIMAL_WEAR",
    "FIELD_TESTED",
    "WELL_WORN",
    "BATTLE_SCARRED",
    "NOT_APPLICABLE",
    "UNKNOWN",
}
_EDITION_KINDS = {"STANDARD", "STATTRAK", "SOUVENIR", "UNKNOWN"}
_SEMANTIC_STATUSES = {"CONFIRMED", "INFERRED", "UNVERIFIED"}
_SCOPE_KINDS = {
    "AGGREGATE",
    "MARKET_HASH_NAME",
    "WEAR_RANGE",
    "STYLE",
    "STYLE_WEAR",
    "EXACT_VARIANT",
}
_MAPPING_STATUSES = {"RESOLVED", "UNKNOWN", "AMBIGUOUS", "CONFLICT", "REJECTED"}
_ANALYSIS_UNIT_KINDS = {"BASE_MHN", "STYLE_VARIANT", "PATTERN_VARIANT"}
_PROMOTION_STATUSES = {"BASE_MHN", "INTERNAL_VARIANT"}
_SHA256 = re.compile(r"^[0-9a-f]{64}$")


def _require_utc(value: datetime, field: str) -> None:
    if not isinstance(value, datetime):
        raise ValueError(f"{field} must be a datetime")
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{field} must include a UTC offset")
    if value.utcoffset().total_seconds() != 0:
        raise ValueError(f"{field} must use UTC")


def _validate_interval(valid_from: datetime, valid_to: datetime | None) -> None:
    _require_utc(valid_from, "valid_from")
    if valid_to is not None:
        _require_utc(valid_to, "valid_to")
        if valid_to <= valid_from:
            raise ValueError("valid_to must be later than valid_from")


@dataclass(frozen=True)
class ItemIdentity:
    """Stable internal identity; changing attributes create a version, not a new row."""

    item_id: int
    first_seen_at: datetime

    def __post_init__(self) -> None:
        if (
            isinstance(self.item_id, bool)
            or not isinstance(self.item_id, int)
            or self.item_id <= 0
        ):
            raise ValueError("item_id must be positive")
        _require_utc(self.first_seen_at, "first_seen_at")


@dataclass(frozen=True)
class ItemVariantVersion:
    """Point-in-time attributes of one internal economic variant."""

    variant_version_id: int
    item_id: int
    version_label: str
    item_kind: ItemKind
    market_hash_name: str | None
    base_item_code: str | None
    paint_index: int | None
    wear_tier: WearTier
    edition_kind: EditionKind
    phase_code: str | None
    style_code: str | None
    semantic_status: SemanticStatus
    valid_from: datetime
    recorded_at: datetime
    evidence_ref: str
    evidence_hash: str | None = None
    valid_to: datetime | None = None

    def __post_init__(self) -> None:
        if (
            isinstance(self.variant_version_id, bool)
            or not isinstance(self.variant_version_id, int)
            or self.variant_version_id <= 0
            or isinstance(self.item_id, bool)
            or not isinstance(self.item_id, int)
            or self.item_id <= 0
        ):
            raise ValueError("variant_version_id and item_id must be positive")
        if not self.version_label or not self.version_label.strip():
            raise ValueError("version_label must be non-empty")
        if self.item_kind not in _ITEM_KINDS:
            raise ValueError("unsupported item_kind")
        if self.wear_tier not in _WEAR_TIERS:
            raise ValueError("unsupported wear_tier")
        if self.edition_kind not in _EDITION_KINDS:
            raise ValueError("unsupported edition_kind")
        if self.semantic_status not in _SEMANTIC_STATUSES:
            raise ValueError("unsupported semantic_status")
        if not self.evidence_ref or not self.evidence_ref.strip():
            raise ValueError("evidence_ref must be non-empty")
        if self.evidence_hash is not None and not _SHA256.fullmatch(self.evidence_hash):
            raise ValueError("evidence_hash must be lowercase SHA-256 or None")
        for field, value in (
            ("market_hash_name", self.market_hash_name),
            ("base_item_code", self.base_item_code),
            ("phase_code", self.phase_code),
            ("style_code", self.style_code),
        ):
            if value is not None and not value.strip():
                raise ValueError(f"{field} must be non-empty or None")
        if self.paint_index is not None and (
            isinstance(self.paint_index, bool)
            or not isinstance(self.paint_index, int)
            or self.paint_index < 0
        ):
            raise ValueError("paint_index cannot be negative")
        _validate_interval(self.valid_from, self.valid_to)
        _require_utc(self.recorded_at, "recorded_at")


@dataclass(frozen=True)
class ItemAnalysisUnitVersion:
    """PIT classification of one internal identity's economic granularity.

    This is deliberately separate from provider taxonomy.  A MARKET_B/MARKET_D/MARKET_A
    label can be retained as a source fact without becoming an internal style
    or pattern identity until a versioned promotion decision exists here.
    """

    analysis_unit_version_id: int
    item_id: int
    version_label: str
    analysis_unit_kind: AnalysisUnitKind
    promotion_status: PromotionStatus
    internal_variant_code: str | None
    semantic_status: SemanticStatus
    valid_from: datetime
    recorded_at: datetime
    evidence_ref: str
    evidence_hash: str | None = None
    valid_to: datetime | None = None

    def __post_init__(self) -> None:
        for value, field in (
            (self.analysis_unit_version_id, "analysis_unit_version_id"),
            (self.item_id, "item_id"),
        ):
            if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
                raise ValueError(f"{field} must be positive")
        if not self.version_label or not self.version_label.strip():
            raise ValueError("version_label must be non-empty")
        if self.analysis_unit_kind not in _ANALYSIS_UNIT_KINDS:
            raise ValueError("unsupported analysis_unit_kind")
        if self.promotion_status not in _PROMOTION_STATUSES:
            raise ValueError("unsupported promotion_status")
        if self.semantic_status not in _SEMANTIC_STATUSES:
            raise ValueError("unsupported semantic_status")
        if not self.evidence_ref or not self.evidence_ref.strip():
            raise ValueError("evidence_ref must be non-empty")
        if self.evidence_hash is not None and not _SHA256.fullmatch(self.evidence_hash):
            raise ValueError("evidence_hash must be lowercase SHA-256 or None")
        if self.analysis_unit_kind == "BASE_MHN":
            if self.promotion_status != "BASE_MHN" or self.internal_variant_code is not None:
                raise ValueError(
                    "BASE_MHN requires BASE_MHN promotion and no internal variant code"
                )
        elif (
            self.promotion_status != "INTERNAL_VARIANT"
            or self.internal_variant_code is None
            or not self.internal_variant_code.strip()
        ):
            raise ValueError(
                "style/pattern units require INTERNAL_VARIANT and a variant code"
            )
        _validate_interval(self.valid_from, self.valid_to)
        _require_utc(self.recorded_at, "recorded_at")


@dataclass(frozen=True)
class SourceMappingVersion:
    """One versioned platform-key assertion, including unresolved states."""

    mapping_version_id: int
    source_code: str
    source_item_id: str
    source_style_id: str | None
    scope_kind: ScopeKind
    item_id: int | None
    observed_market_hash_name: str | None
    mapping_status: MappingStatus
    semantic_status: SemanticStatus
    valid_from: datetime
    recorded_at: datetime
    evidence_ref: str
    valid_to: datetime | None = None
    evidence_hash: str | None = None
    min_float: Decimal | None = None
    max_float: Decimal | None = None
    candidate_item_ids: tuple[int, ...] = ()
    reason_code: str | None = None

    def __post_init__(self) -> None:
        if (
            isinstance(self.mapping_version_id, bool)
            or not isinstance(self.mapping_version_id, int)
            or self.mapping_version_id <= 0
        ):
            raise ValueError("mapping_version_id must be positive")
        if not _SOURCE_CODE.fullmatch(self.source_code):
            raise ValueError("source_code has an invalid format")
        if not self.source_item_id or not self.source_item_id.strip():
            raise ValueError("source_item_id must be non-empty")
        if self.source_style_id is not None and not self.source_style_id.strip():
            raise ValueError("source_style_id must be non-empty or None")
        if self.observed_market_hash_name is not None and not self.observed_market_hash_name.strip():
            raise ValueError("observed_market_hash_name must be non-empty or None")
        if self.scope_kind not in _SCOPE_KINDS:
            raise ValueError("unsupported scope_kind")
        if self.mapping_status not in _MAPPING_STATUSES:
            raise ValueError("unsupported mapping_status")
        if self.semantic_status not in _SEMANTIC_STATUSES:
            raise ValueError("unsupported semantic_status")
        if not self.evidence_ref or not self.evidence_ref.strip():
            raise ValueError("evidence_ref must be non-empty")
        if self.evidence_hash is not None and not _SHA256.fullmatch(self.evidence_hash):
            raise ValueError("evidence_hash must be lowercase SHA-256 or None")
        _validate_interval(self.valid_from, self.valid_to)
        _require_utc(self.recorded_at, "recorded_at")
        if (self.min_float is None) != (self.max_float is None):
            raise ValueError("min_float and max_float must be both present or both absent")
        if self.min_float is not None:
            if not isinstance(self.min_float, Decimal) or not isinstance(
                self.max_float, Decimal
            ):
                raise ValueError("float range values must be Decimal")
            if self.scope_kind not in {"WEAR_RANGE", "STYLE_WEAR"}:
                raise ValueError("float range is valid only for wear-range scopes")
            if not Decimal("0") <= self.min_float <= self.max_float <= Decimal("1"):
                raise ValueError("float range must satisfy 0 <= min <= max <= 1")
        elif self.scope_kind in {"WEAR_RANGE", "STYLE_WEAR"}:
            raise ValueError("wear-range scopes require min_float and max_float")
        if self.scope_kind in {"STYLE", "STYLE_WEAR"} and not self.source_style_id:
            raise ValueError("style scopes require source_style_id")
        if len(set(self.candidate_item_ids)) != len(self.candidate_item_ids):
            raise ValueError("candidate_item_ids must be unique")
        if any(
            isinstance(item_id, bool)
            or not isinstance(item_id, int)
            or item_id <= 0
            for item_id in self.candidate_item_ids
        ):
            raise ValueError("candidate item IDs must be positive")
        if self.mapping_status == "RESOLVED":
            if (
                self.item_id is None
                or isinstance(self.item_id, bool)
                or not isinstance(self.item_id, int)
                or self.item_id <= 0
            ):
                raise ValueError("RESOLVED mapping requires one positive item_id")
            if self.candidate_item_ids:
                raise ValueError("RESOLVED mapping cannot carry alternative candidates")
        else:
            if self.item_id is not None:
                raise ValueError("unresolved mapping cannot claim an item_id")
            if self.reason_code is None or not self.reason_code.strip():
                raise ValueError("unresolved mapping requires reason_code")
            if self.mapping_status in {"AMBIGUOUS", "CONFLICT"} and len(
                self.candidate_item_ids
            ) < 2:
                raise ValueError("AMBIGUOUS/CONFLICT mapping requires at least two candidates")
            if (
                self.mapping_status not in {"AMBIGUOUS", "CONFLICT"}
                and self.candidate_item_ids
            ):
                raise ValueError(
                    "only AMBIGUOUS/CONFLICT mappings can carry candidates"
                )

    @property
    def key(self) -> tuple[
        str,
        str,
        str | None,
        ScopeKind,
        Decimal | None,
        Decimal | None,
    ]:
        return (
            self.source_code,
            self.source_item_id,
            self.source_style_id,
            self.scope_kind,
            self.min_float,
            self.max_float,
        )

@dataclass(frozen=True)
class MappingResolution:
    status: ResolutionStatus
    mapping: SourceMappingVersion | None
    candidate_item_ids: tuple[int, ...]
    reason_code: str


@dataclass(frozen=True)
class AnalysisUnitResolution:
    status: Literal["RESOLVED", "UNKNOWN", "NOT_YET_KNOWN", "OUT_OF_VALIDITY", "CONFLICT"]
    version: ItemAnalysisUnitVersion | None
    reason_code: str
