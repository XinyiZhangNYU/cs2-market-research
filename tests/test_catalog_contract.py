from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest

from cs2_research.catalog import (
    CatalogResolutionError,
    ItemAnalysisUnitVersion,
    ItemVariantVersion,
    SourceMappingVersion,
    require_resolved,
    resolve_analysis_unit,
    resolve_source_mapping,
)


T0 = datetime(2026, 1, 1, tzinfo=timezone.utc)
T1 = datetime(2026, 2, 1, tzinfo=timezone.utc)


def _mapping(
    mapping_version_id: int,
    *,
    item_id: int | None = 101,
    mapping_status: str = "RESOLVED",
    valid_from: datetime = T0,
    recorded_at: datetime = T0,
    valid_to: datetime | None = None,
    candidate_item_ids: tuple[int, ...] = (),
) -> SourceMappingVersion:
    return SourceMappingVersion(
        mapping_version_id=mapping_version_id,
        source_code="synthetic_vendor",
        source_item_id="platform-42",
        source_style_id="phase-1",
        scope_kind="STYLE_WEAR",
        item_id=item_id,
        observed_market_hash_name="Synthetic Doppler (Factory New)",
        mapping_status=mapping_status,  # type: ignore[arg-type]
        semantic_status="UNVERIFIED",
        valid_from=valid_from,
        recorded_at=recorded_at,
        evidence_ref="SYNTHETIC_CONTRACT",
        valid_to=valid_to,
        min_float=Decimal("0.00"),
        max_float=Decimal("0.07"),
        candidate_item_ids=candidate_item_ids,
        reason_code=None if mapping_status == "RESOLVED" else "SYNTHETIC_UNRESOLVED",
    )


def _resolve(
    mappings: list[SourceMappingVersion],
    *,
    valid_at: datetime = T0,
    known_at: datetime = T1,
):
    return resolve_source_mapping(
        mappings,
        source_code="synthetic_vendor",
        source_item_id="platform-42",
        source_style_id="phase-1",
        scope_kind="STYLE_WEAR",
        min_float=Decimal("0.00"),
        max_float=Decimal("0.07"),
        observed_market_hash_name="Synthetic Doppler (Factory New)",
        valid_at=valid_at,
        known_at=known_at,
    )


def test_item_identity_attributes_are_versioned_and_pit_bounded() -> None:
    version = ItemVariantVersion(
        variant_version_id=1,
        item_id=101,
        version_label="valve-synthetic-v1",
        item_kind="KNIFE",
        market_hash_name="Synthetic Doppler (Factory New)",
        base_item_code="weapon_knife_synthetic",
        paint_index=99999,
        wear_tier="FACTORY_NEW",
        edition_kind="STATTRAK",
        phase_code="P1",
        style_code="DOPPLER_P1",
        semantic_status="UNVERIFIED",
        valid_from=T0,
        recorded_at=T0,
        evidence_ref="SYNTHETIC_CONTRACT",
        valid_to=T1,
    )
    assert version.item_id == 101
    assert version.valid_to == T1
    with pytest.raises(ValueError, match="valid_to"):
        ItemVariantVersion(**{**version.__dict__, "valid_to": T0})


def test_half_open_pit_mapping_selects_exact_revision() -> None:
    first = _mapping(1, item_id=101, valid_from=T0, valid_to=T1)
    second = _mapping(2, item_id=102, valid_from=T1)
    assert require_resolved(
        _resolve([first, second], valid_at=T1 - timedelta(microseconds=1))
    ).item_id == 101
    assert require_resolved(_resolve([first, second], valid_at=T1)).item_id == 102


def test_mapping_cannot_be_seen_before_it_was_recorded() -> None:
    backfilled = _mapping(1, valid_from=T0, recorded_at=T1)
    not_known = _resolve(
        [backfilled],
        valid_at=T0,
        known_at=T1 - timedelta(microseconds=1),
    )
    assert not_known.status == "NOT_YET_KNOWN"
    assert not_known.reason_code == "MAPPING_NOT_YET_KNOWN"
    assert _resolve([backfilled], valid_at=T0, known_at=T1).status == "RESOLVED"


def test_mapping_is_not_active_after_explicit_valid_to() -> None:
    closed = _mapping(1, valid_from=T0, valid_to=T1)
    result = _resolve([closed], valid_at=T1, known_at=T1)
    assert result.status == "OUT_OF_VALIDITY"
    assert result.reason_code == "MAPPING_OUT_OF_VALIDITY"


def test_unknown_ambiguous_conflict_and_name_mismatch_remain_distinct() -> None:
    unknown = _resolve([])
    assert unknown.status == "UNKNOWN"

    ambiguous = _resolve(
        [
            _mapping(
                1,
                item_id=None,
                mapping_status="AMBIGUOUS",
                candidate_item_ids=(101, 102),
            )
        ]
    )
    assert ambiguous.status == "AMBIGUOUS"
    assert ambiguous.candidate_item_ids == (101, 102)

    conflict = _resolve([_mapping(1), _mapping(2, item_id=102)])
    assert conflict.status == "CONFLICT"
    assert conflict.candidate_item_ids == (101, 102)

    mismatch = resolve_source_mapping(
        [_mapping(1)],
        source_code="synthetic_vendor",
        source_item_id="platform-42",
        source_style_id="phase-1",
        scope_kind="STYLE_WEAR",
        min_float=Decimal("0.00"),
        max_float=Decimal("0.07"),
        observed_market_hash_name="Different name",
        valid_at=T0,
        known_at=T1,
    )
    assert mismatch.status == "NAME_MISMATCH"
    with pytest.raises(CatalogResolutionError) as rejected:
        require_resolved(mismatch)
    assert rejected.value.code == "MAPPING_NAME_MISMATCH"


def test_mapping_model_rejects_implicit_or_invalid_scope_semantics() -> None:
    with pytest.raises(ValueError, match="require source_style_id"):
        SourceMappingVersion(
            mapping_version_id=1,
            source_code="synthetic_vendor",
            source_item_id="platform-42",
            source_style_id=None,
            scope_kind="STYLE",
            item_id=101,
            observed_market_hash_name=None,
            mapping_status="RESOLVED",
            semantic_status="UNVERIFIED",
            valid_from=T0,
            recorded_at=T0,
            evidence_ref="SYNTHETIC_CONTRACT",
        )
    with pytest.raises(ValueError, match="at least two candidates"):
        _mapping(
            1,
            item_id=None,
            mapping_status="CONFLICT",
            candidate_item_ids=(101,),
        )
    with pytest.raises(ValueError, match="unsupported mapping_status"):
        SourceMappingVersion(
            mapping_version_id=1,
            source_code="synthetic_vendor",
            source_item_id="platform-42",
            source_style_id=None,
            scope_kind="AGGREGATE",
            item_id=None,
            observed_market_hash_name=None,
            mapping_status="GUESSED",  # type: ignore[arg-type]
            semantic_status="UNVERIFIED",
            valid_from=T0,
            recorded_at=T0,
            evidence_ref="SYNTHETIC_CONTRACT",
        )
    with pytest.raises(ValueError, match="unsupported wear_tier"):
        ItemVariantVersion(
            variant_version_id=1,
            item_id=101,
            version_label="invalid-wear",
            item_kind="WEAPON",
            market_hash_name=None,
            base_item_code=None,
            paint_index=None,
            wear_tier="PRISTINE",  # type: ignore[arg-type]
            edition_kind="STANDARD",
            phase_code=None,
            style_code=None,
            semantic_status="UNVERIFIED",
            valid_from=T0,
            recorded_at=T0,
            evidence_ref="SYNTHETIC_CONTRACT",
        )


def _analysis_unit(
    version_id: int,
    *,
    item_id: int = 101,
    kind: str = "BASE_MHN",
    promotion: str = "BASE_MHN",
    code: str | None = None,
    valid_from: datetime = T0,
    recorded_at: datetime = T0,
    valid_to: datetime | None = None,
) -> ItemAnalysisUnitVersion:
    return ItemAnalysisUnitVersion(
        analysis_unit_version_id=version_id,
        item_id=item_id,
        version_label=f"analysis-unit-v{version_id}",
        analysis_unit_kind=kind,  # type: ignore[arg-type]
        promotion_status=promotion,  # type: ignore[arg-type]
        internal_variant_code=code,
        semantic_status="UNVERIFIED",
        valid_from=valid_from,
        recorded_at=recorded_at,
        valid_to=valid_to,
        evidence_ref="SYNTHETIC_CONTRACT",
    )


def test_analysis_unit_kind_is_versioned_and_pit_bounded() -> None:
    first = _analysis_unit(1, valid_to=T1)
    second = _analysis_unit(
        2,
        kind="STYLE_VARIANT",
        promotion="INTERNAL_VARIANT",
        code="DOPPLER_P2",
        valid_from=T1,
        recorded_at=T1,
    )
    january = resolve_analysis_unit(
        [first, second], item_id=101, valid_at=T0, known_at=T1
    )
    february = resolve_analysis_unit(
        [first, second], item_id=101, valid_at=T1, known_at=T1
    )
    assert january.status == "RESOLVED"
    assert january.version is first
    assert february.status == "RESOLVED"
    assert february.version is second


def test_analysis_unit_does_not_leak_a_late_catalog_decision() -> None:
    backfilled = _analysis_unit(1, valid_from=T0, recorded_at=T1)
    result = resolve_analysis_unit(
        [backfilled],
        item_id=101,
        valid_at=T0,
        known_at=T1 - timedelta(microseconds=1),
    )
    assert result.status == "NOT_YET_KNOWN"


def test_analysis_unit_model_rejects_parent_child_collapse() -> None:
    with pytest.raises(ValueError, match="BASE_MHN requires"):
        _analysis_unit(
            1,
            kind="BASE_MHN",
            promotion="INTERNAL_VARIANT",
            code="P1",
        )
    with pytest.raises(ValueError, match="style/pattern units require"):
        _analysis_unit(1, kind="STYLE_VARIANT", promotion="BASE_MHN")
