"""Provider-neutral, bitemporal catalog display projection models.

The projection is deliberately separate from formal research-result envelopes.
It contains only product identity needed by the UI: controlled catalog axes,
complete provider-attributed localized names, and an internal media key.  Provider item IDs,
seller data, source URLs, and free-form producer labels never enter the public
document.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Literal, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text


CATALOG_DISPLAY_CONTRACT = "catalog-display"
CATALOG_DISPLAY_VERSION = "v1"
OFFICIAL_NAME_AUTHORITY = "VALVE_STEAM"
CatalogNameAuthority = Literal["VALVE_STEAM", "MARKET_D", "MARKET_B"]
CATALOG_NAME_AUTHORITIES = frozenset({"VALVE_STEAM", "MARKET_D", "MARKET_B"})

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
AnalysisUnitKind = Literal["BASE_MHN", "STYLE_VARIANT", "PATTERN_VARIANT"]
MediaStatus = Literal["NOT_PRODUCED", "BOUND"]
MediaPresentationKind = Literal[
    "SERIES_REPRESENTATIVE",
    "STYLE_REPRESENTATIVE",
]


_ITEM_KINDS = frozenset({"WEAPON", "KNIFE", "GLOVE", "AGENT", "OTHER", "UNKNOWN"})
_WEAR_TIERS = frozenset(
    {
        "FACTORY_NEW",
        "MINIMAL_WEAR",
        "FIELD_TESTED",
        "WELL_WORN",
        "BATTLE_SCARRED",
        "NOT_APPLICABLE",
        "UNKNOWN",
    }
)
_EDITION_KINDS = frozenset({"STANDARD", "STATTRAK", "SOUVENIR", "UNKNOWN"})
_ANALYSIS_UNIT_KINDS = frozenset({"BASE_MHN", "STYLE_VARIANT", "PATTERN_VARIANT"})
_MEDIA_PRESENTATION_KINDS = frozenset(
    {"SERIES_REPRESENTATIVE", "STYLE_REPRESENTATIVE"}
)
_CONTROL_CHARACTER = re.compile(r"[\x00-\x1f\x7f]")
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_MEDIA_KEY = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]{0,255}$")
_VERSION_ID = re.compile(r"^[1-9][0-9]*$")


def _utc(value: datetime, field: str) -> None:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() != timezone.utc.utcoffset(value)
    ):
        raise ValueError(f"{field} must use UTC")


def _text(value: str, field: str, *, maximum: int = 512) -> None:
    if (
        not isinstance(value, str)
        or not value
        or value != value.strip()
        or len(value) > maximum
        or _CONTROL_CHARACTER.search(value)
    ):
        raise ValueError(f"{field} must be trimmed, non-empty, control-free text")


def _optional_text(value: str | None, field: str, *, maximum: int = 512) -> None:
    if value is not None:
        _text(value, field, maximum=maximum)


def _version_id(value: str | None, field: str, *, required: bool = True) -> None:
    if value is None and not required:
        return
    if not isinstance(value, str) or not _VERSION_ID.fullmatch(value):
        raise ValueError(f"{field} must be a positive decimal identifier string")


def _media_key(value: str) -> None:
    if not isinstance(value, str) or not _MEDIA_KEY.fullmatch(value):
        raise ValueError("media_key has an invalid format")
    if any(part in {"", ".", ".."} for part in value.split("/")):
        raise ValueError("media_key contains an unsafe path segment")


@dataclass(frozen=True, slots=True)
class LocalizedOfficialName:
    """Complete attributed source strings; the frontend displays, not composes."""

    en: str
    zh_cn: str
    authority: CatalogNameAuthority = OFFICIAL_NAME_AUTHORITY

    def __post_init__(self) -> None:
        _text(self.en, "localized_name.en")
        _text(self.zh_cn, "localized_name.zh_cn")
        if self.authority not in CATALOG_NAME_AUTHORITIES:
            raise ValueError("unsupported catalog name authority")

    def to_document(self) -> dict[str, str]:
        return {
            "authority": self.authority,
            "en": self.en,
            "zh_cn": self.zh_cn,
        }


@dataclass(frozen=True, slots=True)
class CatalogDisplayMedia:
    status: MediaStatus
    media_key: str | None = None
    presentation_kind: MediaPresentationKind | None = None

    def __post_init__(self) -> None:
        if self.status == "NOT_PRODUCED":
            if self.media_key is not None or self.presentation_kind is not None:
                raise ValueError("NOT_PRODUCED media cannot carry a key or presentation")
            return
        if self.status != "BOUND":
            raise ValueError("unsupported media status")
        if self.media_key is None:
            raise ValueError("BOUND media requires media_key")
        _media_key(self.media_key)
        if self.presentation_kind not in _MEDIA_PRESENTATION_KINDS:
            raise ValueError("BOUND media requires a controlled presentation_kind")

    def to_document(self) -> dict[str, str]:
        if self.status == "NOT_PRODUCED":
            return {"status": self.status}
        assert self.media_key is not None
        assert self.presentation_kind is not None
        return {
            "status": self.status,
            "media_key": self.media_key,
            "presentation_kind": self.presentation_kind,
        }


@dataclass(frozen=True, slots=True)
class CatalogDisplayVersionContext:
    """Exact internal versions used to produce one safe display projection."""

    item_variant_version_id: str
    analysis_unit_version_id: str
    name_en_version_id: str
    name_zh_cn_version_id: str
    media_asset_version_id: str | None

    def __post_init__(self) -> None:
        _version_id(self.item_variant_version_id, "item_variant_version_id")
        _version_id(self.analysis_unit_version_id, "analysis_unit_version_id")
        _version_id(self.name_en_version_id, "name_en_version_id")
        _version_id(self.name_zh_cn_version_id, "name_zh_cn_version_id")
        _version_id(
            self.media_asset_version_id,
            "media_asset_version_id",
            required=False,
        )

    def to_document(self) -> dict[str, str | None]:
        return {
            "analysis_unit_version_id": self.analysis_unit_version_id,
            "item_variant_version_id": self.item_variant_version_id,
            "media_asset_version_id": self.media_asset_version_id,
            "name_en_version_id": self.name_en_version_id,
            "name_zh_cn_version_id": self.name_zh_cn_version_id,
        }


@dataclass(frozen=True, slots=True)
class CatalogDisplayProjection:
    """One atomic safe display row at one catalog-valid time."""

    analysis_unit_id: str
    parent_analysis_unit_id: str | None
    analysis_unit_kind: AnalysisUnitKind
    item_kind: ItemKind
    base_item_code: str
    edition_kind: EditionKind
    wear_tier: WearTier
    localized_name: LocalizedOfficialName
    media: CatalogDisplayMedia
    catalog_version: str
    version_context: CatalogDisplayVersionContext
    valid_from: datetime
    projection_hash: str

    def __post_init__(self) -> None:
        _text(self.analysis_unit_id, "analysis_unit_id", maximum=256)
        _optional_text(
            self.parent_analysis_unit_id,
            "parent_analysis_unit_id",
            maximum=256,
        )
        if self.analysis_unit_kind not in _ANALYSIS_UNIT_KINDS:
            raise ValueError("unsupported analysis_unit_kind")
        if self.analysis_unit_kind == "BASE_MHN":
            if self.parent_analysis_unit_id is not None:
                raise ValueError("BASE_MHN display rows cannot have a parent")
        elif self.parent_analysis_unit_id is None:
            raise ValueError("style/pattern display rows require an explicit parent")
        if self.parent_analysis_unit_id == self.analysis_unit_id:
            raise ValueError("display row cannot be its own parent")
        if self.item_kind not in _ITEM_KINDS:
            raise ValueError("unsupported item_kind")
        _text(self.base_item_code, "base_item_code", maximum=256)
        if self.edition_kind not in _EDITION_KINDS:
            raise ValueError("unsupported edition_kind")
        if self.wear_tier not in _WEAR_TIERS:
            raise ValueError("unsupported wear_tier")
        if not isinstance(self.localized_name, LocalizedOfficialName):
            raise TypeError("localized_name must be LocalizedOfficialName")
        if self.edition_kind == "STATTRAK" and (
            "StatTrak™" not in self.localized_name.en
            or "StatTrak™" not in self.localized_name.zh_cn
        ):
            raise ValueError("STATTRAK localized names must preserve the exact StatTrak™ mark")
        if not isinstance(self.media, CatalogDisplayMedia):
            raise TypeError("media must be CatalogDisplayMedia")
        if not isinstance(self.version_context, CatalogDisplayVersionContext):
            raise TypeError("version_context must be CatalogDisplayVersionContext")
        if (self.media.status == "BOUND") != (
            self.version_context.media_asset_version_id is not None
        ):
            raise ValueError("media binding and media_asset_version_id disagree")
        _text(self.catalog_version, "catalog_version", maximum=128)
        _utc(self.valid_from, "valid_from")
        if not isinstance(self.projection_hash, str) or not _SHA256.fullmatch(
            self.projection_hash
        ):
            raise ValueError("projection_hash must be lowercase SHA-256")
        if self.projection_hash != self.calculate_hash():
            raise ValueError("projection_hash does not match the canonical projection")

    @classmethod
    def build(
        cls,
        *,
        analysis_unit_id: str,
        parent_analysis_unit_id: str | None,
        analysis_unit_kind: AnalysisUnitKind,
        item_kind: ItemKind,
        base_item_code: str,
        edition_kind: EditionKind,
        wear_tier: WearTier,
        localized_name: LocalizedOfficialName,
        media: CatalogDisplayMedia,
        catalog_version: str,
        version_context: CatalogDisplayVersionContext,
        valid_from: datetime,
    ) -> "CatalogDisplayProjection":
        unverified = cls.__new__(cls)
        object.__setattr__(unverified, "analysis_unit_id", analysis_unit_id)
        object.__setattr__(unverified, "parent_analysis_unit_id", parent_analysis_unit_id)
        object.__setattr__(unverified, "analysis_unit_kind", analysis_unit_kind)
        object.__setattr__(unverified, "item_kind", item_kind)
        object.__setattr__(unverified, "base_item_code", base_item_code)
        object.__setattr__(unverified, "edition_kind", edition_kind)
        object.__setattr__(unverified, "wear_tier", wear_tier)
        object.__setattr__(unverified, "localized_name", localized_name)
        object.__setattr__(unverified, "media", media)
        object.__setattr__(unverified, "catalog_version", catalog_version)
        object.__setattr__(unverified, "version_context", version_context)
        object.__setattr__(unverified, "valid_from", valid_from)
        object.__setattr__(unverified, "projection_hash", "0" * 64)
        projection_hash = sha256_hex(canonical_json_bytes(unverified.hash_document()))
        return cls(
            analysis_unit_id=analysis_unit_id,
            parent_analysis_unit_id=parent_analysis_unit_id,
            analysis_unit_kind=analysis_unit_kind,
            item_kind=item_kind,
            base_item_code=base_item_code,
            edition_kind=edition_kind,
            wear_tier=wear_tier,
            localized_name=localized_name,
            media=media,
            catalog_version=catalog_version,
            version_context=version_context,
            valid_from=valid_from,
            projection_hash=projection_hash,
        )

    def hash_document(self) -> dict[str, Any]:
        return {
            "analysis_unit_id": self.analysis_unit_id,
            "analysis_unit_kind": self.analysis_unit_kind,
            "base_item_code": self.base_item_code,
            "catalog_version": self.catalog_version,
            "edition_kind": self.edition_kind,
            "item_kind": self.item_kind,
            "localized_name": self.localized_name.to_document(),
            "media": self.media.to_document(),
            "parent_analysis_unit_id": self.parent_analysis_unit_id,
            "valid_from": utc_timestamp_text(self.valid_from),
            "version_context": self.version_context.to_document(),
            "wear_tier": self.wear_tier,
        }

    def calculate_hash(self) -> str:
        return sha256_hex(canonical_json_bytes(self.hash_document()))

    def to_document(self) -> dict[str, Any]:
        return {**self.hash_document(), "projection_hash": self.projection_hash}

    @classmethod
    def from_document(cls, document: Mapping[str, Any]) -> "CatalogDisplayProjection":
        if not isinstance(document, Mapping) or set(document) != {
            "analysis_unit_id",
            "parent_analysis_unit_id",
            "analysis_unit_kind",
            "item_kind",
            "base_item_code",
            "edition_kind",
            "wear_tier",
            "localized_name",
            "media",
            "catalog_version",
            "version_context",
            "valid_from",
            "projection_hash",
        }:
            raise ValueError("catalog display projection has unexpected fields")
        names = document["localized_name"]
        media = document["media"]
        versions = document["version_context"]
        if not isinstance(names, Mapping) or set(names) != {"authority", "en", "zh_cn"}:
            raise ValueError("localized_name has unexpected fields")
        if not isinstance(media, Mapping):
            raise ValueError("media must be an object")
        if media.get("status") == "NOT_PRODUCED":
            if set(media) != {"status"}:
                raise ValueError("NOT_PRODUCED media has unexpected fields")
            parsed_media = CatalogDisplayMedia("NOT_PRODUCED")
        elif media.get("status") == "BOUND":
            if set(media) != {"status", "media_key", "presentation_kind"}:
                raise ValueError("BOUND media has unexpected fields")
            parsed_media = CatalogDisplayMedia(
                "BOUND",
                media_key=media["media_key"],
                presentation_kind=media["presentation_kind"],
            )
        else:
            raise ValueError("unsupported media status")
        if not isinstance(versions, Mapping) or set(versions) != {
            "analysis_unit_version_id",
            "item_variant_version_id",
            "media_asset_version_id",
            "name_en_version_id",
            "name_zh_cn_version_id",
        }:
            raise ValueError("version_context has unexpected fields")
        try:
            valid_from = datetime.fromisoformat(
                str(document["valid_from"]).replace("Z", "+00:00")
            )
        except (TypeError, ValueError):
            raise ValueError("valid_from is invalid") from None
        return cls(
            analysis_unit_id=document["analysis_unit_id"],
            parent_analysis_unit_id=document["parent_analysis_unit_id"],
            analysis_unit_kind=document["analysis_unit_kind"],
            item_kind=document["item_kind"],
            base_item_code=document["base_item_code"],
            edition_kind=document["edition_kind"],
            wear_tier=document["wear_tier"],
            localized_name=LocalizedOfficialName(
                en=names["en"],
                zh_cn=names["zh_cn"],
                authority=names["authority"],
            ),
            media=parsed_media,
            catalog_version=document["catalog_version"],
            version_context=CatalogDisplayVersionContext(
                item_variant_version_id=versions["item_variant_version_id"],
                analysis_unit_version_id=versions["analysis_unit_version_id"],
                name_en_version_id=versions["name_en_version_id"],
                name_zh_cn_version_id=versions["name_zh_cn_version_id"],
                media_asset_version_id=versions["media_asset_version_id"],
            ),
            valid_from=valid_from,
            projection_hash=document["projection_hash"],
        )


@dataclass(frozen=True, slots=True)
class StoredCatalogDisplayProjection:
    projection: CatalogDisplayProjection
    available_at: datetime
    valid_to: datetime | None

    def __post_init__(self) -> None:
        if not isinstance(self.projection, CatalogDisplayProjection):
            raise TypeError("projection must be CatalogDisplayProjection")
        _utc(self.available_at, "available_at")
        if self.valid_to is not None:
            _utc(self.valid_to, "valid_to")
            if self.valid_to <= self.projection.valid_from:
                raise ValueError("valid_to must be later than valid_from")

    def to_document(self) -> dict[str, Any]:
        return {
            "projection": self.projection.to_document(),
            "storage": {
                "available_at": utc_timestamp_text(self.available_at),
                "valid_to": (
                    None if self.valid_to is None else utc_timestamp_text(self.valid_to)
                ),
            },
        }


class CatalogDisplayContractUnavailable(RuntimeError):
    """The connected store does not expose the frozen display projection."""


class CatalogDisplayRecordCorrupt(RuntimeError):
    """Stored safe-display bytes fail the canonical projection contract."""


@dataclass(frozen=True, slots=True)
class CatalogDisplayPage:
    members: tuple[StoredCatalogDisplayProjection, ...]
    next_after_analysis_unit_id: str | None

    def __post_init__(self) -> None:
        if any(
            not isinstance(member, StoredCatalogDisplayProjection)
            for member in self.members
        ):
            raise TypeError("members must contain StoredCatalogDisplayProjection values")
        member_ids = tuple(
            member.projection.analysis_unit_id for member in self.members
        )
        if member_ids != tuple(sorted(set(member_ids))):
            raise ValueError("catalog display page members must be unique and sorted")
        if self.next_after_analysis_unit_id is not None:
            _text(
                self.next_after_analysis_unit_id,
                "next_after_analysis_unit_id",
                maximum=256,
            )
            if not member_ids:
                raise ValueError("a continued catalog display page cannot be empty")
            if self.next_after_analysis_unit_id != member_ids[-1]:
                raise ValueError(
                    "next_after_analysis_unit_id must equal the final page member"
                )


__all__ = [
    "CATALOG_NAME_AUTHORITIES",
    "CATALOG_DISPLAY_CONTRACT",
    "CATALOG_DISPLAY_VERSION",
    "OFFICIAL_NAME_AUTHORITY",
    "CatalogDisplayContractUnavailable",
    "CatalogDisplayMedia",
    "CatalogDisplayPage",
    "CatalogDisplayProjection",
    "CatalogDisplayRecordCorrupt",
    "CatalogDisplayVersionContext",
    "CatalogNameAuthority",
    "LocalizedOfficialName",
    "StoredCatalogDisplayProjection",
]
