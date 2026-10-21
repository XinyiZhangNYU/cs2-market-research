"""Source-independent catalog-display publication and snapshot models.

The source batch is a private producer input.  It can carry an opaque upstream
asset reference and an optional relative local-blob reference; neither value is
part of the public catalog-display or snapshot API.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Literal, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text

from .display import LocalizedOfficialName


CATALOG_DISPLAY_SOURCE_CONTRACT = "catalog-display-source-batch"
CATALOG_DISPLAY_SOURCE_VERSION = "v1"
CATALOG_DISPLAY_SNAPSHOT_CONTRACT = "catalog-display-snapshot-api"
CATALOG_DISPLAY_SNAPSHOT_VERSION = "v1"

MediaContentType = Literal["image/png", "image/jpeg", "image/webp"]
MediaPresentationKind = Literal[
    "SERIES_REPRESENTATIVE",
    "STYLE_REPRESENTATIVE",
]

_CONTROL_CHARACTER = re.compile(r"[\x00-\x1f\x7f]")
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_MEDIA_KEY = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]{0,255}$")
_MEDIA_TYPES = frozenset({"image/png", "image/jpeg", "image/webp"})
_PRESENTATION_KINDS = frozenset(
    {"SERIES_REPRESENTATIVE", "STYLE_REPRESENTATIVE"}
)


def _utc(value: datetime, field: str) -> None:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() != timezone.utc.utcoffset(value)
    ):
        raise ValueError(f"{field} must use UTC")


def _text(value: str, field: str, *, maximum: int) -> None:
    if (
        not isinstance(value, str)
        or not value
        or value != value.strip()
        or len(value) > maximum
        or _CONTROL_CHARACTER.search(value)
    ):
        raise ValueError(f"{field} must be trimmed, non-empty, control-free text")


def _hash(value: str | None, field: str, *, required: bool = False) -> None:
    if value is None and not required:
        return
    if not isinstance(value, str) or not _SHA256.fullmatch(value):
        raise ValueError(f"{field} must be lowercase SHA-256")


def _media_key(value: str) -> None:
    if not isinstance(value, str) or not _MEDIA_KEY.fullmatch(value):
        raise ValueError("media_key has an invalid format")
    if any(part in {"", ".", ".."} for part in value.split("/")):
        raise ValueError("media_key contains an unsafe path segment")


def _relative_blob_ref(value: str) -> None:
    _text(value, "blob_ref", maximum=512)
    if "\\" in value or value.startswith("/"):
        raise ValueError("blob_ref must be a portable relative path")
    if any(part in {"", ".", ".."} for part in value.split("/")):
        raise ValueError("blob_ref contains an unsafe path segment")


def _timestamp(value: object, field: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError(f"{field} must be an RFC3339 UTC string")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise ValueError(f"{field} must be an RFC3339 UTC string") from None
    _utc(parsed, field)
    return parsed


@dataclass(frozen=True, slots=True)
class CatalogDisplaySourceMedia:
    media_key: str
    source_asset_ref: str
    content_type: MediaContentType
    presentation_kind: MediaPresentationKind
    blob_ref: str | None = None
    expected_content_hash: str | None = None

    def __post_init__(self) -> None:
        _media_key(self.media_key)
        _text(self.source_asset_ref, "source_asset_ref", maximum=2048)
        if self.content_type not in _MEDIA_TYPES:
            raise ValueError("unsupported content_type")
        if self.presentation_kind not in _PRESENTATION_KINDS:
            raise ValueError("unsupported presentation_kind")
        if self.blob_ref is not None:
            _relative_blob_ref(self.blob_ref)
        _hash(self.expected_content_hash, "expected_content_hash")
        if self.blob_ref is None and self.expected_content_hash is not None:
            raise ValueError("expected_content_hash requires blob_ref")

    def to_document(self) -> dict[str, str | None]:
        return {
            "blob_ref": self.blob_ref,
            "content_type": self.content_type,
            "expected_content_hash": self.expected_content_hash,
            "media_key": self.media_key,
            "presentation_kind": self.presentation_kind,
            "source_asset_ref": self.source_asset_ref,
        }


@dataclass(frozen=True, slots=True)
class CatalogDisplaySourceRecord:
    item_id: int
    localized_name: LocalizedOfficialName
    media: CatalogDisplaySourceMedia | None = None

    def __post_init__(self) -> None:
        if isinstance(self.item_id, bool) or not isinstance(self.item_id, int) or self.item_id <= 0:
            raise ValueError("item_id must be positive")
        if not isinstance(self.localized_name, LocalizedOfficialName):
            raise TypeError("localized_name must be LocalizedOfficialName")
        if self.media is not None and not isinstance(self.media, CatalogDisplaySourceMedia):
            raise TypeError("media must be CatalogDisplaySourceMedia or None")

    def to_document(self) -> dict[str, Any]:
        return {
            "item_id": self.item_id,
            "localized_name": self.localized_name.to_document(),
            "media": None if self.media is None else self.media.to_document(),
        }


@dataclass(frozen=True, slots=True)
class CatalogDisplaySourceBatch:
    catalog_version: str
    as_of: datetime
    known_at: datetime
    evidence_ref: str
    records: tuple[CatalogDisplaySourceRecord, ...]
    evidence_hash: str | None = None

    def __post_init__(self) -> None:
        _text(self.catalog_version, "catalog_version", maximum=128)
        _utc(self.as_of, "as_of")
        _utc(self.known_at, "known_at")
        if self.known_at < self.as_of:
            raise ValueError("known_at cannot precede as_of")
        _text(self.evidence_ref, "evidence_ref", maximum=2048)
        _hash(self.evidence_hash, "evidence_hash")
        if any(not isinstance(record, CatalogDisplaySourceRecord) for record in self.records):
            raise TypeError("records must contain CatalogDisplaySourceRecord values")
        item_ids = tuple(record.item_id for record in self.records)
        if item_ids != tuple(sorted(set(item_ids))):
            raise ValueError("records must be unique and sorted by item_id")

    def to_document(self) -> dict[str, Any]:
        return {
            "as_of": utc_timestamp_text(self.as_of),
            "catalog_version": self.catalog_version,
            "evidence_hash": self.evidence_hash,
            "evidence_ref": self.evidence_ref,
            "known_at": utc_timestamp_text(self.known_at),
            "records": [record.to_document() for record in self.records],
            "source_contract": CATALOG_DISPLAY_SOURCE_CONTRACT,
            "source_version": CATALOG_DISPLAY_SOURCE_VERSION,
        }

    @property
    def batch_hash(self) -> str:
        return sha256_hex(canonical_json_bytes(self.to_document()))

    @classmethod
    def from_document(cls, document: Mapping[str, Any]) -> "CatalogDisplaySourceBatch":
        expected = {
            "as_of",
            "catalog_version",
            "evidence_hash",
            "evidence_ref",
            "known_at",
            "records",
            "source_contract",
            "source_version",
        }
        if not isinstance(document, Mapping) or set(document) != expected:
            raise ValueError("catalog display source batch has unexpected fields")
        if document["source_contract"] != CATALOG_DISPLAY_SOURCE_CONTRACT:
            raise ValueError("unsupported source_contract")
        if document["source_version"] != CATALOG_DISPLAY_SOURCE_VERSION:
            raise ValueError("unsupported source_version")
        raw_records = document["records"]
        if not isinstance(raw_records, list):
            raise ValueError("records must be an array")
        records: list[CatalogDisplaySourceRecord] = []
        for raw in raw_records:
            if not isinstance(raw, Mapping) or set(raw) != {
                "item_id",
                "localized_name",
                "media",
            }:
                raise ValueError("catalog display source record has unexpected fields")
            names = raw["localized_name"]
            if not isinstance(names, Mapping) or set(names) != {"authority", "en", "zh_cn"}:
                raise ValueError("localized_name has unexpected fields")
            media = raw["media"]
            parsed_media: CatalogDisplaySourceMedia | None
            if media is None:
                parsed_media = None
            else:
                if not isinstance(media, Mapping) or set(media) != {
                    "blob_ref",
                    "content_type",
                    "expected_content_hash",
                    "media_key",
                    "presentation_kind",
                    "source_asset_ref",
                }:
                    raise ValueError("media has unexpected fields")
                parsed_media = CatalogDisplaySourceMedia(
                    media_key=media["media_key"],
                    source_asset_ref=media["source_asset_ref"],
                    content_type=media["content_type"],
                    presentation_kind=media["presentation_kind"],
                    blob_ref=media["blob_ref"],
                    expected_content_hash=media["expected_content_hash"],
                )
            records.append(
                CatalogDisplaySourceRecord(
                    item_id=raw["item_id"],
                    localized_name=LocalizedOfficialName(
                        en=names["en"],
                        zh_cn=names["zh_cn"],
                        authority=names["authority"],
                    ),
                    media=parsed_media,
                )
            )
        return cls(
            catalog_version=document["catalog_version"],
            as_of=_timestamp(document["as_of"], "as_of"),
            known_at=_timestamp(document["known_at"], "known_at"),
            evidence_ref=document["evidence_ref"],
            evidence_hash=document["evidence_hash"],
            records=tuple(records),
        )


@dataclass(frozen=True, slots=True)
class CatalogDisplaySnapshot:
    snapshot_id: str
    catalog_version: str
    as_of: datetime
    available_at: datetime
    member_count: int
    member_set_hash: str

    def __post_init__(self) -> None:
        _hash(self.snapshot_id, "snapshot_id", required=True)
        _text(self.catalog_version, "catalog_version", maximum=128)
        _utc(self.as_of, "as_of")
        _utc(self.available_at, "available_at")
        if self.available_at < self.as_of:
            raise ValueError("available_at cannot precede as_of")
        if (
            isinstance(self.member_count, bool)
            or not isinstance(self.member_count, int)
            or self.member_count < 0
        ):
            raise ValueError("member_count cannot be negative")
        _hash(self.member_set_hash, "member_set_hash", required=True)

    def to_document(self) -> dict[str, Any]:
        return {
            "as_of": utc_timestamp_text(self.as_of),
            "available_at": utc_timestamp_text(self.available_at),
            "catalog_version": self.catalog_version,
            "member_count": self.member_count,
            "member_set_hash": self.member_set_hash,
            "snapshot_id": self.snapshot_id,
        }


@dataclass(frozen=True, slots=True)
class CatalogDisplaySnapshotPage:
    members: tuple[CatalogDisplaySnapshot, ...]
    next_after: tuple[datetime, str] | None

    def __post_init__(self) -> None:
        if any(not isinstance(member, CatalogDisplaySnapshot) for member in self.members):
            raise TypeError("members must contain CatalogDisplaySnapshot values")
        order = tuple((member.as_of, member.snapshot_id) for member in self.members)
        if order != tuple(sorted(set(order), reverse=True)):
            raise ValueError("snapshot members must be unique and sorted descending")
        if self.next_after is not None:
            if not self.members or self.next_after != order[-1]:
                raise ValueError("next_after must equal the final snapshot key")


__all__ = [
    "CATALOG_DISPLAY_SNAPSHOT_CONTRACT",
    "CATALOG_DISPLAY_SNAPSHOT_VERSION",
    "CATALOG_DISPLAY_SOURCE_CONTRACT",
    "CATALOG_DISPLAY_SOURCE_VERSION",
    "CatalogDisplaySnapshot",
    "CatalogDisplaySnapshotPage",
    "CatalogDisplaySourceBatch",
    "CatalogDisplaySourceMedia",
    "CatalogDisplaySourceRecord",
]
