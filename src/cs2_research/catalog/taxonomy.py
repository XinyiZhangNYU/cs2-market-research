from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass(frozen=True)
class TaxonomyPaintEntry:
    paint_index: int
    kit: str | None
    role: str
    family: str
    identity_policy: str


@dataclass(frozen=True)
class SourceTaxonomyLabel:
    label: str
    source_id: str | None
    dimension_code: str


@dataclass(frozen=True)
class SourceItemRuleMember:
    member_code: str
    match_kind: str
    source_label: str | None = None
    source_id: str | None = None
    paint_index: int | None = None
    paint_seed: int | None = None
    min_value: Decimal | None = None
    max_value: Decimal | None = None
    observed_count: int | None = None
    evidence_kind: str = "UNVERIFIED"
    evidence_ref: str = "UNVERIFIED"
    evidence_hash: str | None = None


@dataclass(frozen=True)
class SourceItemRule:
    rule_code: str
    source_item_key_kind: str
    source_item_key: str
    dimension_kind: str
    promotion_policy: str
    semantic_status: str
    evidence_kind: str
    evidence_ref: str
    evidence_hash: str | None
    effective_from: datetime
    members: tuple[SourceItemRuleMember, ...]


@dataclass(frozen=True)
class SourceTaxonomyMap:
    """Versioned provider taxonomy bytes, independent of parser behaviour."""

    source_code: str
    version: str
    valid_from: datetime
    config_sha256: str
    paint_entries: dict[int, TaxonomyPaintEntry]
    source_labels: dict[str, SourceTaxonomyLabel]
    item_rules: tuple[SourceItemRule, ...]


@dataclass(frozen=True)
class TaxonomyResolution:
    mapping_version: str
    mapping_sha256: str
    source_code: str
    resolution_status: str
    analysis_unit_kind: str
    canonical_style_code: str | None
    source_classification_code: str | None
    family: str | None
    role: str | None
    source_style_id: str | None
    promotion_status: str


__all__ = [
    "SourceItemRule",
    "SourceItemRuleMember",
    "SourceTaxonomyLabel",
    "SourceTaxonomyMap",
    "TaxonomyPaintEntry",
    "TaxonomyResolution",
]
