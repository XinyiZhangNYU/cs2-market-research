"""Immutable snapshot index for the catalog query/read API V1."""

from __future__ import annotations

import json
import re
import threading
import unicodedata
from collections import OrderedDict, defaultdict
from dataclasses import dataclass
from pathlib import Path
from types import MappingProxyType
from typing import Any, Callable, Iterable, Mapping

from cs2_research.canonical import canonical_json_bytes, sha256_hex

from .display import StoredCatalogDisplayProjection
from .display_live import CatalogDisplaySnapshot


CATALOG_NAVIGATION_PROFILE_VERSION = "v1"
CATALOG_SEARCH_PROFILE = "ECMASCRIPT_NFKC_WS_LOWER_V1"
CATALOG_SORT_PROFILE = "LOCALIZED_CODEPOINT_V1"
_PROFILE_PATH = (
    Path(__file__).resolve().parents[3]
    / "config"
    / "catalog-display-navigation-profile.v1.json"
)
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_ITEM_KINDS = ("WEAPON", "KNIFE", "GLOVE", "AGENT", "OTHER", "UNKNOWN")
_RARITIES = frozenset(
    {
        "COVERT",
        "CLASSIFIED",
        "RESTRICTED",
        "MIL_SPEC",
        "INDUSTRIAL",
        "CONSUMER",
        "EXTRAORDINARY",
        "CONTRABAND",
    }
)

# ECMAScript WhiteSpace + LineTerminator code points used by trim and \s.
_ECMASCRIPT_WHITESPACE = frozenset(
    {
        0x0009,
        0x000A,
        0x000B,
        0x000C,
        0x000D,
        0x0020,
        0x00A0,
        0x1680,
        0x2000,
        0x2001,
        0x2002,
        0x2003,
        0x2004,
        0x2005,
        0x2006,
        0x2007,
        0x2008,
        0x2009,
        0x200A,
        0x2028,
        0x2029,
        0x202F,
        0x205F,
        0x3000,
        0xFEFF,
    }
)


class CatalogQueryContractUnavailable(RuntimeError):
    """The shared profile or sealed snapshot read surface is unavailable."""


class CatalogQueryRecordCorrupt(RuntimeError):
    """The profile or snapshot fails its immutable integrity contract."""


class CatalogQuerySnapshotNotFound(LookupError):
    """The exact requested sealed snapshot does not exist."""


@dataclass(frozen=True, slots=True)
class CatalogNavigationModel:
    selection_id: str
    item_kind: str
    category_id: str
    exact_series: frozenset[str]
    fallback: bool = False


@dataclass(frozen=True, slots=True)
class CatalogNavigationSelection:
    selection_id: str
    item_kind: str
    category_id: str
    model_ids: frozenset[str]


@dataclass(frozen=True, slots=True)
class CatalogSeriesClassification:
    model_id: str
    category_id: str
    rarity: str | None


@dataclass(frozen=True, slots=True)
class CatalogNavigationProfile:
    profile_version: str
    profile_sha256: str
    source_mapping_sha256: str
    source_member_count: int
    series_count: int
    models: Mapping[str, CatalogNavigationModel]
    selections: Mapping[str, CatalogNavigationSelection]
    classifications: Mapping[tuple[str, str], CatalogSeriesClassification]
    fallback_model_by_kind: Mapping[str, str]

    def classify(self, item_kind: str, base_item_code: str) -> CatalogSeriesClassification:
        exact = self.classifications.get((item_kind, base_item_code))
        if exact is not None:
            return exact
        fallback_id = self.fallback_model_by_kind.get(item_kind)
        if fallback_id is None:
            raise CatalogQueryRecordCorrupt("snapshot contains an unsupported item kind")
        return CatalogSeriesClassification(fallback_id, "UNCLASSIFIED", None)

    def selection(self, selection_id: str) -> CatalogNavigationSelection:
        try:
            return self.selections[selection_id]
        except KeyError:
            raise ValueError("unknown equipment selection") from None


def _require_object(value: Any, field: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise CatalogQueryRecordCorrupt(f"{field} must be an object")
    return value


def _require_text(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value or value != value.strip():
        raise CatalogQueryRecordCorrupt(f"{field} must be non-empty trimmed text")
    return value


def load_catalog_navigation_profile(
    path: Path = _PROFILE_PATH,
) -> CatalogNavigationProfile:
    try:
        payload = path.read_bytes()
        document = json.loads(payload.decode("utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise CatalogQueryContractUnavailable("catalog navigation profile unavailable") from exc
    if canonical_json_bytes(document) != payload:
        raise CatalogQueryRecordCorrupt("catalog navigation profile is not canonical JSON")
    root = _require_object(document, "profile")
    profile_version = _require_text(root.get("profile_version"), "profile_version")
    if profile_version != CATALOG_NAVIGATION_PROFILE_VERSION:
        raise CatalogQueryContractUnavailable("unsupported catalog navigation profile")
    profile_hash = sha256_hex(payload)
    source_mapping_hash = _require_text(
        root.get("source_mapping_sha256"), "source_mapping_sha256"
    )
    if not _SHA256.fullmatch(source_mapping_hash):
        raise CatalogQueryRecordCorrupt("invalid source mapping hash")
    source_member_count = root.get("source_member_count")
    series_count = root.get("series_count")
    if (
        isinstance(source_member_count, bool)
        or not isinstance(source_member_count, int)
        or source_member_count < 0
        or isinstance(series_count, bool)
        or not isinstance(series_count, int)
        or series_count < 0
    ):
        raise CatalogQueryRecordCorrupt("invalid profile cardinality")

    raw_models = root.get("models")
    raw_series = _require_object(root.get("series_by_model"), "series_by_model")
    raw_rarity = _require_object(root.get("rarity_by_model"), "rarity_by_model")
    if not isinstance(raw_models, list):
        raise CatalogQueryRecordCorrupt("models must be an array")
    models: dict[str, CatalogNavigationModel] = {}
    classifications: dict[tuple[str, str], CatalogSeriesClassification] = {}
    for raw_model in raw_models:
        model = _require_object(raw_model, "model")
        model_id = _require_text(model.get("id"), "model.id")
        item_kind = _require_text(model.get("itemKind"), "model.itemKind")
        category_id = _require_text(model.get("category"), "model.category")
        if item_kind not in _ITEM_KINDS or model_id in models:
            raise CatalogQueryRecordCorrupt("invalid or duplicate navigation model")
        codes = raw_series.get(model_id)
        rarities = raw_rarity.get(model_id)
        if not isinstance(codes, list) or not isinstance(rarities, list) or len(codes) != len(rarities):
            raise CatalogQueryRecordCorrupt("series and rarity alignment drift")
        exact_codes: set[str] = set()
        for code, rarity in zip(codes, rarities, strict=True):
            code = _require_text(code, "base_item_code")
            if code in exact_codes or (rarity != "UNCLASSIFIED" and rarity not in _RARITIES):
                raise CatalogQueryRecordCorrupt("invalid duplicate series or rarity")
            exact_codes.add(code)
            key = (item_kind, code)
            if key in classifications:
                raise CatalogQueryRecordCorrupt("series appears in multiple navigation models")
            classifications[key] = CatalogSeriesClassification(
                model_id=model_id,
                category_id=category_id,
                rarity=None if rarity == "UNCLASSIFIED" else rarity,
            )
        models[model_id] = CatalogNavigationModel(
            selection_id=model_id,
            item_kind=item_kind,
            category_id=category_id,
            exact_series=frozenset(exact_codes),
        )
    if len(classifications) != series_count:
        raise CatalogQueryRecordCorrupt("profile series_count drift")

    fallback_by_kind: dict[str, str] = {}
    for raw_fallback in root.get("fallback_models", []):
        fallback = _require_object(raw_fallback, "fallback_model")
        selection_id = _require_text(fallback.get("selection_id"), "selection_id")
        item_kind = _require_text(fallback.get("item_kind"), "item_kind")
        category_id = _require_text(fallback.get("category_id"), "category_id")
        if item_kind not in _ITEM_KINDS or item_kind in fallback_by_kind or selection_id in models:
            raise CatalogQueryRecordCorrupt("invalid fallback model")
        fallback_by_kind[item_kind] = selection_id
        models[selection_id] = CatalogNavigationModel(
            selection_id=selection_id,
            item_kind=item_kind,
            category_id=category_id,
            exact_series=frozenset(),
            fallback=True,
        )
    if set(fallback_by_kind) != set(_ITEM_KINDS):
        raise CatalogQueryRecordCorrupt("profile must define every item-kind fallback")

    selections: dict[str, CatalogNavigationSelection] = {
        model_id: CatalogNavigationSelection(
            selection_id=model_id,
            item_kind=model.item_kind,
            category_id=model.category_id,
            model_ids=frozenset({model_id}),
        )
        for model_id, model in models.items()
    }
    for raw_selector in root.get("category_selectors", []):
        selector = _require_object(raw_selector, "category_selector")
        selection_id = _require_text(selector.get("selection_id"), "selection_id")
        item_kind = _require_text(selector.get("item_kind"), "item_kind")
        category_id = _require_text(selector.get("category_id"), "category_id")
        model_ids = frozenset(
            model_id
            for model_id, model in models.items()
            if not model.fallback
            and model.item_kind == item_kind
            and model.category_id == category_id
        )
        if not model_ids or selection_id in selections:
            raise CatalogQueryRecordCorrupt("invalid category selector")
        selections[selection_id] = CatalogNavigationSelection(
            selection_id=selection_id,
            item_kind=item_kind,
            category_id=category_id,
            model_ids=model_ids,
        )
    return CatalogNavigationProfile(
        profile_version=profile_version,
        profile_sha256=profile_hash,
        source_mapping_sha256=source_mapping_hash,
        source_member_count=source_member_count,
        series_count=series_count,
        models=MappingProxyType(models),
        selections=MappingProxyType(selections),
        classifications=MappingProxyType(classifications),
        fallback_model_by_kind=MappingProxyType(fallback_by_kind),
    )


def normalize_catalog_text(value: str) -> str:
    if not isinstance(value, str):
        raise TypeError("catalog text must be a string")
    normalized = unicodedata.normalize("NFKC", value)
    output: list[str] = []
    pending_space = False
    started = False
    for character in normalized:
        if ord(character) in _ECMASCRIPT_WHITESPACE:
            if started:
                pending_space = True
            continue
        if pending_space:
            output.append(" ")
            pending_space = False
        output.append(character)
        started = True
    return "".join(output).lower()


def catalog_item_category(item_kind: str, edition_kind: str) -> str | None:
    if item_kind == "WEAPON":
        return {
            "STANDARD": "NORMAL",
            "STATTRAK": "STATTRAK",
            "SOUVENIR": "SOUVENIR",
        }.get(edition_kind)
    if item_kind in {"KNIFE", "GLOVE"}:
        return {"STANDARD": "STAR", "STATTRAK": "STAR_STATTRAK"}.get(
            edition_kind
        )
    return None


@dataclass(frozen=True, slots=True)
class CatalogQuerySnapshotSource:
    descriptor: CatalogDisplaySnapshot
    members_by_ordinal: tuple[StoredCatalogDisplayProjection, ...]

    def __post_init__(self) -> None:
        if not isinstance(self.descriptor, CatalogDisplaySnapshot):
            raise TypeError("descriptor must be CatalogDisplaySnapshot")
        if any(
            not isinstance(member, StoredCatalogDisplayProjection)
            for member in self.members_by_ordinal
        ):
            raise TypeError("members_by_ordinal contains an invalid member")


@dataclass(frozen=True, slots=True)
class CatalogQueryIndex:
    descriptor: CatalogDisplaySnapshot
    profile: CatalogNavigationProfile
    members: tuple[StoredCatalogDisplayProjection, ...]
    members_by_id: Mapping[str, StoredCatalogDisplayProjection]
    series: Mapping[tuple[str, str], tuple[StoredCatalogDisplayProjection, ...]]
    classifications: Mapping[tuple[str, str], CatalogSeriesClassification]

    @classmethod
    def build(
        cls,
        source: CatalogQuerySnapshotSource,
        profile: CatalogNavigationProfile,
    ) -> "CatalogQueryIndex":
        descriptor = source.descriptor
        ordinal_members = source.members_by_ordinal
        if len(ordinal_members) != descriptor.member_count:
            raise CatalogQueryRecordCorrupt("snapshot member_count mismatch")
        member_hash = sha256_hex(
            canonical_json_bytes(
                [
                    {
                        "analysis_unit_id": member.projection.analysis_unit_id,
                        "projection_hash": member.projection.projection_hash,
                    }
                    for member in ordinal_members
                ]
            )
        )
        if member_hash != descriptor.member_set_hash:
            raise CatalogQueryRecordCorrupt("snapshot member_set_hash mismatch")
        member_ids = [member.projection.analysis_unit_id for member in ordinal_members]
        if len(set(member_ids)) != len(member_ids):
            raise CatalogQueryRecordCorrupt("snapshot member identity is not unique")
        for member in ordinal_members:
            if member.projection.catalog_version != descriptor.catalog_version:
                raise CatalogQueryRecordCorrupt("snapshot catalog_version mismatch")
        members = tuple(
            sorted(ordinal_members, key=lambda member: member.projection.analysis_unit_id)
        )
        members_by_id = {member.projection.analysis_unit_id: member for member in members}
        grouped: dict[tuple[str, str], list[StoredCatalogDisplayProjection]] = defaultdict(list)
        classifications: dict[tuple[str, str], CatalogSeriesClassification] = {}
        for member in members:
            projection = member.projection
            key = (projection.item_kind, projection.base_item_code)
            grouped[key].append(member)
            classifications[key] = profile.classify(*key)
        frozen_series = {
            key: tuple(values)
            for key, values in grouped.items()
        }
        return cls(
            descriptor=descriptor,
            profile=profile,
            members=members,
            members_by_id=MappingProxyType(members_by_id),
            series=MappingProxyType(frozen_series),
            classifications=MappingProxyType(classifications),
        )

    @property
    def cache_key(self) -> tuple[str, str]:
        return self.descriptor.snapshot_id, self.profile.profile_sha256

    def eligible_series(
        self,
        *,
        selection_id: str,
        rarity: str | None,
        item_category: str | None,
        search_text: str | None,
        wear_tier: str | None = None,
    ) -> list[
        tuple[
            tuple[str, str],
            tuple[StoredCatalogDisplayProjection, ...],
            CatalogSeriesClassification,
        ]
    ]:
        selection = None if selection_id == "GLOBAL" else self.profile.selection(selection_id)
        needle = "" if search_text is None else normalize_catalog_text(search_text)
        result = []
        for key, all_members in self.series.items():
            item_kind, _ = key
            classification = self.classifications[key]
            if selection is not None and (item_kind != selection.item_kind or classification.model_id not in selection.model_ids):
                continue
            if rarity is not None and classification.rarity != rarity:
                continue
            eligible = tuple(
                member
                for member in all_members
                if (
                    item_category is None
                    or catalog_item_category(
                        member.projection.item_kind, member.projection.edition_kind
                    )
                    == item_category
                )
                and (wear_tier is None or member.projection.wear_tier == wear_tier)
            )
            if not eligible:
                continue
            if needle and not any(
                needle in normalize_catalog_text(member.projection.localized_name.en)
                or needle
                in normalize_catalog_text(member.projection.localized_name.zh_cn)
                for member in eligible
            ):
                continue
            result.append((key, eligible, classification))
        return result


class CatalogQueryIndexCache:
    """Small, single-flight cache whose values are immutable sealed indexes."""

    def __init__(self, *, maximum_snapshots: int = 2) -> None:
        if isinstance(maximum_snapshots, bool) or maximum_snapshots != 2:
            raise ValueError("V1 cache must retain exactly two snapshots")
        self._maximum = maximum_snapshots
        self._lock = threading.Lock()
        self._entries: OrderedDict[tuple[str, str], CatalogQueryIndex] = OrderedDict()

    def get(
        self,
        snapshot_id: str,
        profile: CatalogNavigationProfile,
        loader: Callable[[str], CatalogQuerySnapshotSource],
    ) -> CatalogQueryIndex:
        key = (snapshot_id, profile.profile_sha256)
        with self._lock:
            cached = self._entries.get(key)
            if cached is not None:
                self._entries.move_to_end(key)
                return cached
            built = CatalogQueryIndex.build(loader(snapshot_id), profile)
            if built.cache_key != key:
                raise CatalogQueryRecordCorrupt("loaded snapshot identity drift")
            self._entries[key] = built
            self._entries.move_to_end(key)
            while len(self._entries) > self._maximum:
                self._entries.popitem(last=False)
            return built

    def keys(self) -> tuple[tuple[str, str], ...]:
        with self._lock:
            return tuple(self._entries)


def image_counts(
    members: Iterable[StoredCatalogDisplayProjection],
) -> dict[str, int]:
    bound = 0
    total = 0
    for member in members:
        total += 1
        if member.projection.media.status == "BOUND":
            bound += 1
    return {"bound": bound, "not_produced": total - bound, "total": total}


__all__ = [
    "CATALOG_NAVIGATION_PROFILE_VERSION",
    "CATALOG_SEARCH_PROFILE",
    "CATALOG_SORT_PROFILE",
    "CatalogNavigationProfile",
    "CatalogQueryContractUnavailable",
    "CatalogQueryIndex",
    "CatalogQueryIndexCache",
    "CatalogQueryRecordCorrupt",
    "CatalogQuerySnapshotNotFound",
    "CatalogQuerySnapshotSource",
    "catalog_item_category",
    "image_counts",
    "load_catalog_navigation_profile",
    "normalize_catalog_text",
]
