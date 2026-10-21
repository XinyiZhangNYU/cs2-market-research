"""Strict, provider-neutral contracts for the offline Trending producer.

The D2 boundary deliberately cannot publish public results.  It accepts one
explicit source lane, one sealed catalog membership, and source-level daily
price facts.  All identifiers are derived from canonical bytes.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from enum import Enum
from types import MappingProxyType
from typing import Any, Mapping

from cs2_research.canonical import (
    canonical_json_bytes,
    sha256_hex,
    utc_timestamp_text,
)


TRENDING_POLICY_SCHEMA = "trending-offline-policy/1"
TRENDING_MEMBERSHIP_SCHEMA = "trending-offline-membership/1"
TRENDING_DAILY_FACT_SCHEMA = "trending-daily-price-fact/1"
TRENDING_WINDOW_FACT_SCHEMA = "trending-window-fact/1"
TRENDING_RUN_SCHEMA = "trending-offline-run/1"
TRENDING_PRODUCER_VERSION = "single-item-trending-offline-producer-v1"
SUPPORTED_HORIZONS_DAYS = (7, 14, 30)
SUPPORTED_ITEM_KINDS = frozenset({"WEAPON", "KNIFE", "GLOVE"})
SUPPORTED_EDITION_KINDS = frozenset(
    {"STANDARD", "STATTRAK", "SOUVENIR", "UNKNOWN"}
)

_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_SOURCE_CODE = re.compile(r"^[a-z][a-z0-9_]{0,31}$")
_CURRENCY = re.compile(r"^[A-Z]{3}$")


class TrendingContractError(ValueError):
    """An input cannot enter the offline Trending contract."""


class KnowledgeMode(str, Enum):
    PROSPECTIVE_PIT = "PROSPECTIVE_PIT"
    RETROSPECTIVE_LATE_BOUND = "RETROSPECTIVE_LATE_BOUND"


class AnomalyAction(str, Enum):
    INCLUDE_FLAGGED = "INCLUDE_FLAGGED"
    WITHHOLD_MEMBER = "WITHHOLD_MEMBER"


class EntryStatus(str, Enum):
    ELIGIBLE = "ELIGIBLE"
    EXCLUDED = "EXCLUDED"


class WindowStatus(str, Enum):
    INTERNAL_CANDIDATE = "INTERNAL_CANDIDATE"
    WITHHELD_NO_ELIGIBLE = "WITHHELD_NO_ELIGIBLE"
    WITHHELD_ELIGIBLE_COVERAGE = "WITHHELD_ELIGIBLE_COVERAGE"
    WITHHELD_ENDPOINT_COVERAGE = "WITHHELD_ENDPOINT_COVERAGE"


class CatalogMappingStatus(str, Enum):
    EXACT = "EXACT"
    SCHEMA_UNMATCHED = "SCHEMA_UNMATCHED"


class ExclusionReason(str, Enum):
    MISSING_START = "MISSING_START"
    LATE_START = "LATE_START"
    NULL_START = "NULL_START"
    ZERO_START = "ZERO_START"
    MISSING_END = "MISSING_END"
    LATE_END = "LATE_END"
    NULL_END = "NULL_END"
    ZERO_END = "ZERO_END"
    PATH_INCOMPLETE = "PATH_INCOMPLETE"
    ANOMALY_REVIEW_REQUIRED = "ANOMALY_REVIEW_REQUIRED"


def require(condition: bool, code: str) -> None:
    if not condition:
        raise TrendingContractError(code)


def require_text(value: Any, code: str) -> str:
    require(
        isinstance(value, str)
        and bool(value.strip())
        and "\x00" not in value
        and not any(0xD800 <= ord(character) <= 0xDFFF for character in value),
        code,
    )
    return value


def require_sha256(value: Any, code: str) -> str:
    require(isinstance(value, str) and _SHA256.fullmatch(value) is not None, code)
    return value


def require_utc(value: Any, code: str) -> datetime:
    require(
        isinstance(value, datetime)
        and value.tzinfo is not None
        and value.utcoffset() == timedelta(0),
        code,
    )
    return value.astimezone(UTC)


def parse_timestamp(value: Any, code: str) -> datetime:
    require(isinstance(value, str) and value.endswith("Z"), code)
    try:
        parsed = datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as exc:
        raise TrendingContractError(code) from exc
    require_utc(parsed, code)
    require(utc_timestamp_text(parsed) == value, code)
    return parsed


def parse_date(value: Any, code: str) -> date:
    require(isinstance(value, str), code)
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise TrendingContractError(code) from exc
    require(parsed.isoformat() == value, code)
    return parsed


def strict_json_bytes(payload: bytes, code: str) -> Any:
    def pairs(values: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in values:
            require(key not in result, code + "_DUPLICATE_KEY")
            result[key] = value
        return result

    def forbidden(_value: str) -> None:
        raise TrendingContractError(code + "_NON_INTEGER_NUMBER")

    try:
        return json.loads(
            payload.decode("utf-8"),
            object_pairs_hook=pairs,
            parse_float=forbidden,
            parse_constant=forbidden,
        )
    except TrendingContractError:
        raise
    except (UnicodeError, ValueError) as exc:
        raise TrendingContractError(code) from exc


def require_exact_keys(
    document: Any, expected: set[str], code: str
) -> Mapping[str, Any]:
    require(isinstance(document, Mapping), code + "_OBJECT")
    actual = set(document)
    require(actual == expected, code + "_FIELDS")
    return document


def _enum(enum_type: type[Enum], value: Any, code: str) -> Any:
    try:
        return enum_type(value)
    except (TypeError, ValueError) as exc:
        raise TrendingContractError(code) from exc


def _bounded_bps(value: Any, code: str) -> int:
    require(isinstance(value, int) and not isinstance(value, bool), code)
    require(0 <= value <= 10_000, code)
    return value


@dataclass(frozen=True, slots=True)
class TrendingPolicy:
    policy_version: str
    available_at: datetime
    source_code: str
    currency: str
    price_scale: int
    horizons_days: tuple[int, ...]
    minimum_eligible_ratio_bps: int
    minimum_end_to_start_coverage_ratio_bps: int
    minimum_path_coverage_ratio_bps: int
    maximum_consecutive_missing_days: int
    anomaly_abs_change_bps: int
    anomaly_action: AnomalyAction
    knowledge_mode: KnowledgeMode
    formal_publication_eligible: bool = False
    public_rights_release_id: None = None

    def __post_init__(self) -> None:
        require_text(self.policy_version, "POLICY_VERSION")
        require_utc(self.available_at, "POLICY_AVAILABLE_AT")
        require(
            isinstance(self.source_code, str)
            and _SOURCE_CODE.fullmatch(self.source_code) is not None,
            "POLICY_SOURCE_CODE",
        )
        require(
            isinstance(self.currency, str)
            and _CURRENCY.fullmatch(self.currency) is not None,
            "POLICY_CURRENCY",
        )
        require(
            isinstance(self.price_scale, int)
            and not isinstance(self.price_scale, bool)
            and 0 <= self.price_scale <= 18,
            "POLICY_PRICE_SCALE",
        )
        require(self.horizons_days == SUPPORTED_HORIZONS_DAYS, "POLICY_HORIZONS")
        _bounded_bps(self.minimum_eligible_ratio_bps, "POLICY_MIN_ELIGIBLE_BPS")
        _bounded_bps(
            self.minimum_end_to_start_coverage_ratio_bps,
            "POLICY_MIN_ENDPOINT_BPS",
        )
        _bounded_bps(
            self.minimum_path_coverage_ratio_bps,
            "POLICY_MIN_PATH_BPS",
        )
        require(
            isinstance(self.maximum_consecutive_missing_days, int)
            and not isinstance(self.maximum_consecutive_missing_days, bool)
            and 0 <= self.maximum_consecutive_missing_days <= max(self.horizons_days),
            "POLICY_MAX_GAP",
        )
        require(
            isinstance(self.anomaly_abs_change_bps, int)
            and not isinstance(self.anomaly_abs_change_bps, bool)
            and self.anomaly_abs_change_bps > 0,
            "POLICY_ANOMALY_BPS",
        )
        require(isinstance(self.anomaly_action, AnomalyAction), "POLICY_ANOMALY_ACTION")
        require(isinstance(self.knowledge_mode, KnowledgeMode), "POLICY_KNOWLEDGE_MODE")
        require(self.formal_publication_eligible is False, "D2_PUBLICATION_FORBIDDEN")
        require(self.public_rights_release_id is None, "D2_RIGHTS_RELEASE_FORBIDDEN")

    def body_document(self) -> dict[str, Any]:
        return {
            "schema_version": TRENDING_POLICY_SCHEMA,
            "policy_version": self.policy_version,
            "available_at": utc_timestamp_text(self.available_at),
            "source_code": self.source_code,
            "currency": self.currency,
            "price_scale": self.price_scale,
            "horizons_days": list(self.horizons_days),
            "minimum_eligible_ratio_bps": self.minimum_eligible_ratio_bps,
            "minimum_end_to_start_coverage_ratio_bps": (
                self.minimum_end_to_start_coverage_ratio_bps
            ),
            "minimum_path_coverage_ratio_bps": self.minimum_path_coverage_ratio_bps,
            "maximum_consecutive_missing_days": self.maximum_consecutive_missing_days,
            "anomaly_abs_change_bps": self.anomaly_abs_change_bps,
            "anomaly_action": self.anomaly_action.value,
            "knowledge_mode": self.knowledge_mode.value,
            "formal_publication_eligible": False,
            "public_rights_release_id": None,
        }

    @property
    def policy_id(self) -> str:
        return sha256_hex(canonical_json_bytes(self.body_document()))

    def to_document(self) -> dict[str, Any]:
        return {"policy_id": self.policy_id, **self.body_document()}

    @classmethod
    def from_document(cls, document: Any) -> "TrendingPolicy":
        expected = {
            "policy_id",
            "schema_version",
            "policy_version",
            "available_at",
            "source_code",
            "currency",
            "price_scale",
            "horizons_days",
            "minimum_eligible_ratio_bps",
            "minimum_end_to_start_coverage_ratio_bps",
            "minimum_path_coverage_ratio_bps",
            "maximum_consecutive_missing_days",
            "anomaly_abs_change_bps",
            "anomaly_action",
            "knowledge_mode",
            "formal_publication_eligible",
            "public_rights_release_id",
        }
        raw = require_exact_keys(document, expected, "POLICY")
        require(raw["schema_version"] == TRENDING_POLICY_SCHEMA, "POLICY_SCHEMA")
        horizons = raw["horizons_days"]
        require(isinstance(horizons, list), "POLICY_HORIZONS")
        policy = cls(
            policy_version=require_text(raw["policy_version"], "POLICY_VERSION"),
            available_at=parse_timestamp(raw["available_at"], "POLICY_AVAILABLE_AT"),
            source_code=raw["source_code"],
            currency=raw["currency"],
            price_scale=raw["price_scale"],
            horizons_days=tuple(horizons),
            minimum_eligible_ratio_bps=raw["minimum_eligible_ratio_bps"],
            minimum_end_to_start_coverage_ratio_bps=raw[
                "minimum_end_to_start_coverage_ratio_bps"
            ],
            minimum_path_coverage_ratio_bps=raw[
                "minimum_path_coverage_ratio_bps"
            ],
            maximum_consecutive_missing_days=raw[
                "maximum_consecutive_missing_days"
            ],
            anomaly_abs_change_bps=raw["anomaly_abs_change_bps"],
            anomaly_action=_enum(
                AnomalyAction, raw["anomaly_action"], "POLICY_ANOMALY_ACTION"
            ),
            knowledge_mode=_enum(
                KnowledgeMode, raw["knowledge_mode"], "POLICY_KNOWLEDGE_MODE"
            ),
            formal_publication_eligible=raw["formal_publication_eligible"],
            public_rights_release_id=raw["public_rights_release_id"],
        )
        require_sha256(raw["policy_id"], "POLICY_ID")
        require(raw["policy_id"] == policy.policy_id, "POLICY_ID_MISMATCH")
        return policy


@dataclass(frozen=True, slots=True)
class TrendingCatalogMember:
    analysis_unit_id: str
    display_name: str
    item_kind: str
    base_item_code: str
    mapping_status: CatalogMappingStatus
    model_code: str | None
    rarity_code: str | None
    edition_kind: str
    wear_tier: str | None
    identity_available_at: datetime
    projection_sha256: str
    economic_identity: Mapping[str, Any] | None = None

    def __post_init__(self) -> None:
        require_text(self.analysis_unit_id, "MEMBER_ID")
        require_text(self.display_name, "MEMBER_DISPLAY_NAME")
        require(self.item_kind in SUPPORTED_ITEM_KINDS, "MEMBER_ITEM_KIND")
        require_text(self.base_item_code, "MEMBER_BASE_ITEM_CODE")
        require(
            isinstance(self.mapping_status, CatalogMappingStatus),
            "MEMBER_MAPPING_STATUS",
        )
        if self.model_code is not None:
            require_text(self.model_code, "MEMBER_MODEL_CODE")
        if self.rarity_code is not None:
            require_text(self.rarity_code, "MEMBER_RARITY_CODE")
        if self.mapping_status is CatalogMappingStatus.EXACT:
            require(self.model_code is not None, "EXACT_MEMBER_MODEL_REQUIRED")
            require(self.rarity_code is not None, "EXACT_MEMBER_RARITY_REQUIRED")
        else:
            require(self.model_code is None, "UNMATCHED_MEMBER_MODEL_FORBIDDEN")
            require(self.rarity_code is None, "UNMATCHED_MEMBER_RARITY_FORBIDDEN")
        require(self.edition_kind in SUPPORTED_EDITION_KINDS, "MEMBER_EDITION_KIND")
        if self.wear_tier is not None:
            require_text(self.wear_tier, "MEMBER_WEAR_TIER")
        require_utc(self.identity_available_at, "MEMBER_IDENTITY_AVAILABLE_AT")
        require_sha256(self.projection_sha256, "MEMBER_PROJECTION_SHA256")
        if self.economic_identity is not None:
            evidence = require_exact_keys(
                self.economic_identity,
                {"definition", "fingerprint_sha256", "evidence_sha256", "available_at"},
                "MEMBER_ECONOMIC_IDENTITY",
            )
            definition = require_exact_keys(
                evidence["definition"],
                {"analysis_unit_id", "analysis_unit_kind", "parent_analysis_unit_id",
                 "item_kind", "base_item_code", "edition_kind", "wear_tier"},
                "MEMBER_ECONOMIC_DEFINITION",
            )
            for field in ("analysis_unit_id", "item_kind", "base_item_code", "edition_kind", "wear_tier"):
                require(definition[field] == getattr(self, field), "MEMBER_ECONOMIC_FIELD_DRIFT")
            require(definition["analysis_unit_kind"] in {"BASE_MHN", "STYLE_VARIANT", "PATTERN_VARIANT"}, "MEMBER_ECONOMIC_KIND")
            parent = definition["parent_analysis_unit_id"]
            require((parent is None) == (definition["analysis_unit_kind"] == "BASE_MHN"), "MEMBER_ECONOMIC_PARENT")
            if parent is not None:
                require_text(parent, "MEMBER_ECONOMIC_PARENT")
                require(parent != self.analysis_unit_id, "MEMBER_ECONOMIC_PARENT")
            require_sha256(evidence["fingerprint_sha256"], "MEMBER_ECONOMIC_FINGERPRINT")
            require(evidence["fingerprint_sha256"] == sha256_hex(canonical_json_bytes(dict(definition))), "MEMBER_ECONOMIC_FINGERPRINT")
            require_sha256(evidence["evidence_sha256"], "MEMBER_ECONOMIC_EVIDENCE")
            require(evidence["evidence_sha256"] == self.projection_sha256, "MEMBER_ECONOMIC_EVIDENCE_DRIFT")
            require(parse_timestamp(evidence["available_at"], "MEMBER_ECONOMIC_KNOWN") == self.identity_available_at, "MEMBER_ECONOMIC_KNOWN_DRIFT")
            object.__setattr__(self, "economic_identity", MappingProxyType({
                **dict(evidence), "definition": MappingProxyType(dict(definition)),
            }))

    def to_document(self) -> dict[str, Any]:
        document = {
            "analysis_unit_id": self.analysis_unit_id,
            "display_name": self.display_name,
            "item_kind": self.item_kind,
            "base_item_code": self.base_item_code,
            "mapping_status": self.mapping_status.value,
            "model_code": self.model_code,
            "rarity_code": self.rarity_code,
            "edition_kind": self.edition_kind,
            "wear_tier": self.wear_tier,
            "identity_available_at": utc_timestamp_text(self.identity_available_at),
            "projection_sha256": self.projection_sha256,
        }
        # Preserve legacy document/hash bytes. Legacy members remain readable,
        # but absence of an economic proof is not prospective qualification.
        if self.economic_identity is not None:
            document["economic_identity"] = {
                **dict(self.economic_identity),
                "definition": dict(self.economic_identity["definition"]),
            }
        return document

    @classmethod
    def from_document(cls, document: Any) -> "TrendingCatalogMember":
        expected = {
            "analysis_unit_id",
            "display_name",
            "item_kind",
            "base_item_code",
            "mapping_status",
            "model_code",
            "rarity_code",
            "edition_kind",
            "wear_tier",
            "identity_available_at",
            "projection_sha256",
        }
        if isinstance(document, Mapping) and "economic_identity" in document:
            expected.add("economic_identity")
        raw = require_exact_keys(document, expected, "MEMBER")
        return cls(
            analysis_unit_id=raw["analysis_unit_id"],
            display_name=raw["display_name"],
            item_kind=raw["item_kind"],
            base_item_code=raw["base_item_code"],
            mapping_status=_enum(
                CatalogMappingStatus,
                raw["mapping_status"],
                "MEMBER_MAPPING_STATUS",
            ),
            model_code=raw["model_code"],
            rarity_code=raw["rarity_code"],
            edition_kind=raw["edition_kind"],
            wear_tier=raw["wear_tier"],
            identity_available_at=parse_timestamp(
                raw["identity_available_at"], "MEMBER_IDENTITY_AVAILABLE_AT"
            ),
            projection_sha256=raw["projection_sha256"],
            economic_identity=raw.get("economic_identity"),
        )


@dataclass(frozen=True, slots=True)
class TrendingMembership:
    catalog_snapshot_sha256: str
    catalog_version: str
    catalog_as_of: datetime
    available_at: datetime
    members: tuple[TrendingCatalogMember, ...]

    def __post_init__(self) -> None:
        require_sha256(self.catalog_snapshot_sha256, "CATALOG_SNAPSHOT_SHA256")
        require_text(self.catalog_version, "CATALOG_VERSION")
        require_utc(self.catalog_as_of, "CATALOG_AS_OF")
        require_utc(self.available_at, "MEMBERSHIP_AVAILABLE_AT")
        require(self.catalog_as_of <= self.available_at, "CATALOG_CLOCK_ORDER")
        require(bool(self.members), "MEMBERSHIP_EMPTY")
        require(
            all(isinstance(member, TrendingCatalogMember) for member in self.members),
            "MEMBERSHIP_MEMBER_TYPE",
        )
        ordered = tuple(sorted(self.members, key=lambda item: item.analysis_unit_id))
        require(
            len({member.analysis_unit_id for member in ordered}) == len(ordered),
            "MEMBERSHIP_DUPLICATE_ID",
        )
        require(
            all(member.identity_available_at <= self.available_at for member in ordered),
            "MEMBERSHIP_IDENTITY_CLOCK",
        )
        object.__setattr__(self, "members", ordered)

    @property
    def member_set_sha256(self) -> str:
        return sha256_hex(
            canonical_json_bytes([member.to_document() for member in self.members])
        )

    def body_document(self) -> dict[str, Any]:
        return {
            "schema_version": TRENDING_MEMBERSHIP_SCHEMA,
            "catalog_snapshot_sha256": self.catalog_snapshot_sha256,
            "catalog_version": self.catalog_version,
            "catalog_as_of": utc_timestamp_text(self.catalog_as_of),
            "available_at": utc_timestamp_text(self.available_at),
            "member_count": len(self.members),
            "member_set_sha256": self.member_set_sha256,
            "members": [member.to_document() for member in self.members],
        }

    @property
    def membership_id(self) -> str:
        return sha256_hex(canonical_json_bytes(self.body_document()))

    def to_document(self) -> dict[str, Any]:
        return {"membership_id": self.membership_id, **self.body_document()}

    @classmethod
    def from_document(cls, document: Any) -> "TrendingMembership":
        expected = {
            "membership_id",
            "schema_version",
            "catalog_snapshot_sha256",
            "catalog_version",
            "catalog_as_of",
            "available_at",
            "member_count",
            "member_set_sha256",
            "members",
        }
        raw = require_exact_keys(document, expected, "MEMBERSHIP")
        require(
            raw["schema_version"] == TRENDING_MEMBERSHIP_SCHEMA,
            "MEMBERSHIP_SCHEMA",
        )
        members_raw = raw["members"]
        require(isinstance(members_raw, list), "MEMBERSHIP_MEMBERS")
        membership = cls(
            catalog_snapshot_sha256=raw["catalog_snapshot_sha256"],
            catalog_version=raw["catalog_version"],
            catalog_as_of=parse_timestamp(raw["catalog_as_of"], "CATALOG_AS_OF"),
            available_at=parse_timestamp(
                raw["available_at"], "MEMBERSHIP_AVAILABLE_AT"
            ),
            members=tuple(
                TrendingCatalogMember.from_document(member) for member in members_raw
            ),
        )
        require(
            [member.to_document() for member in membership.members] == members_raw,
            "MEMBERSHIP_ORDER",
        )
        require(raw["member_count"] == len(membership.members), "MEMBERSHIP_COUNT")
        require_sha256(raw["member_set_sha256"], "MEMBER_SET_SHA256")
        require(
            raw["member_set_sha256"] == membership.member_set_sha256,
            "MEMBER_SET_SHA256_MISMATCH",
        )
        require_sha256(raw["membership_id"], "MEMBERSHIP_ID")
        require(
            raw["membership_id"] == membership.membership_id,
            "MEMBERSHIP_ID_MISMATCH",
        )
        return membership


@dataclass(frozen=True, slots=True)
class DailyPriceFact:
    analysis_unit_id: str
    source_code: str
    currency: str
    bucket_date: date
    available_at: datetime
    source_event_at: datetime | None
    price_atoms: int | None
    price_scale: int
    catalog_snapshot_sha256: str
    input_record_sha256: str

    def __post_init__(self) -> None:
        require_text(self.analysis_unit_id, "FACT_MEMBER_ID")
        require(
            isinstance(self.source_code, str)
            and _SOURCE_CODE.fullmatch(self.source_code) is not None,
            "FACT_SOURCE_CODE",
        )
        require(
            isinstance(self.currency, str)
            and _CURRENCY.fullmatch(self.currency) is not None,
            "FACT_CURRENCY",
        )
        require(isinstance(self.bucket_date, date), "FACT_BUCKET_DATE")
        available = require_utc(self.available_at, "FACT_AVAILABLE_AT")
        closed = datetime.combine(
            self.bucket_date + timedelta(days=1), time.min, tzinfo=UTC
        )
        require(available >= closed, "FACT_AVAILABLE_BEFORE_BUCKET_CLOSE")
        if self.source_event_at is not None:
            event = require_utc(self.source_event_at, "FACT_SOURCE_EVENT_AT")
            require(event <= closed, "FACT_EVENT_AFTER_BUCKET_CLOSE")
            require(event <= available, "FACT_EVENT_AFTER_AVAILABLE")
        if self.price_atoms is not None:
            require(
                isinstance(self.price_atoms, int)
                and not isinstance(self.price_atoms, bool)
                and self.price_atoms >= 0,
                "FACT_PRICE_ATOMS",
            )
        require(
            isinstance(self.price_scale, int)
            and not isinstance(self.price_scale, bool)
            and 0 <= self.price_scale <= 18,
            "FACT_PRICE_SCALE",
        )
        require_sha256(self.catalog_snapshot_sha256, "FACT_CATALOG_SHA256")
        require_sha256(self.input_record_sha256, "FACT_INPUT_RECORD_SHA256")

    def body_document(self) -> dict[str, Any]:
        return {
            "schema_version": TRENDING_DAILY_FACT_SCHEMA,
            "analysis_unit_id": self.analysis_unit_id,
            "source_code": self.source_code,
            "currency": self.currency,
            "bucket_date": self.bucket_date.isoformat(),
            "bucket_closed_at": utc_timestamp_text(
                datetime.combine(
                    self.bucket_date + timedelta(days=1), time.min, tzinfo=UTC
                )
            ),
            "available_at": utc_timestamp_text(self.available_at),
            "source_event_at": (
                None
                if self.source_event_at is None
                else utc_timestamp_text(self.source_event_at)
            ),
            "price_field": "REFERENCE_ASK",
            "price_atoms": self.price_atoms,
            "price_scale": self.price_scale,
            "catalog_snapshot_sha256": self.catalog_snapshot_sha256,
            "input_record_sha256": self.input_record_sha256,
        }

    @property
    def fact_id(self) -> str:
        return sha256_hex(canonical_json_bytes(self.body_document()))

    def to_document(self) -> dict[str, Any]:
        return {"fact_id": self.fact_id, **self.body_document()}

    @classmethod
    def from_document(cls, document: Any) -> "DailyPriceFact":
        expected = {
            "fact_id",
            "schema_version",
            "analysis_unit_id",
            "source_code",
            "currency",
            "bucket_date",
            "bucket_closed_at",
            "available_at",
            "source_event_at",
            "price_field",
            "price_atoms",
            "price_scale",
            "catalog_snapshot_sha256",
            "input_record_sha256",
        }
        raw = require_exact_keys(document, expected, "DAILY_FACT")
        require(raw["schema_version"] == TRENDING_DAILY_FACT_SCHEMA, "FACT_SCHEMA")
        require(raw["price_field"] == "REFERENCE_ASK", "FACT_PRICE_FIELD")
        bucket_date = parse_date(raw["bucket_date"], "FACT_BUCKET_DATE")
        expected_close = datetime.combine(
            bucket_date + timedelta(days=1), time.min, tzinfo=UTC
        )
        require(
            parse_timestamp(raw["bucket_closed_at"], "FACT_BUCKET_CLOSED_AT")
            == expected_close,
            "FACT_BUCKET_CLOSE_MISMATCH",
        )
        event_raw = raw["source_event_at"]
        fact = cls(
            analysis_unit_id=raw["analysis_unit_id"],
            source_code=raw["source_code"],
            currency=raw["currency"],
            bucket_date=bucket_date,
            available_at=parse_timestamp(raw["available_at"], "FACT_AVAILABLE_AT"),
            source_event_at=(
                None
                if event_raw is None
                else parse_timestamp(event_raw, "FACT_SOURCE_EVENT_AT")
            ),
            price_atoms=raw["price_atoms"],
            price_scale=raw["price_scale"],
            catalog_snapshot_sha256=raw["catalog_snapshot_sha256"],
            input_record_sha256=raw["input_record_sha256"],
        )
        require_sha256(raw["fact_id"], "FACT_ID")
        require(raw["fact_id"] == fact.fact_id, "FACT_ID_MISMATCH")
        return fact


__all__ = [
    "AnomalyAction",
    "CatalogMappingStatus",
    "DailyPriceFact",
    "EntryStatus",
    "ExclusionReason",
    "KnowledgeMode",
    "SUPPORTED_HORIZONS_DAYS",
    "TRENDING_DAILY_FACT_SCHEMA",
    "TRENDING_MEMBERSHIP_SCHEMA",
    "TRENDING_POLICY_SCHEMA",
    "TRENDING_PRODUCER_VERSION",
    "TRENDING_RUN_SCHEMA",
    "TRENDING_WINDOW_FACT_SCHEMA",
    "TrendingCatalogMember",
    "TrendingContractError",
    "TrendingMembership",
    "TrendingPolicy",
    "WindowStatus",
    "parse_date",
    "parse_timestamp",
    "require",
    "require_exact_keys",
    "require_sha256",
    "strict_json_bytes",
]
