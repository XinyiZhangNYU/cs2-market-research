"""Offline V3 projection and end-of-day reduction for sealed latest captures.

The existing upstream normalizer intentionally targets the internal catalog and
therefore omits provisional CASE/AGENT identities.  This module adds a second,
V3-only normalization attempt over the *same sealed raw response*.  It makes no
provider request and does not change the existing normalized artifact.

The resulting slot projections are keyed by the exact V3 ``analysis_unit_id``.
Twelve possible final-hour projections are then reduced with the already
frozen last-hour policy and can be consumed directly by ``market_sector_daily_v3``.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, replace
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP, localcontext
from enum import StrEnum
import json
from pathlib import Path
from typing import Any, Iterable, Mapping

from cs2_research.canonical import (
    canonical_json_bytes,
    decimal_38_8_text,
    sha256_hex,
    utc_timestamp_text,
)
from cs2_research.ingestion.capture_v2 import (
    NormalizationOutcome,
    load_normalized_bundle,
    normalize_captured_slot,
)
from cs2_research.ingestion.upstream_latest import (
    UPSTREAM_LATEST_ENDPOINT_CODE,
    parse_upstream_latest,
)

from .market_sector_daily_v1 import (
    EndOfDayReductionPolicy,
    FROZEN_END_OF_DAY_REDUCTION_POLICY_V1,
)
from .market_sector_daily_v3 import V3ReducedSourceAskFact
from .market_sector_taxonomy_v3 import PROVIDER_IDS_V3, TaxonomyMembershipV3


V3_SLOT_NORMALIZER_VERSION = "market-sector-v3-latest-slot-normalizer-v1"
V3_SLOT_FACT_SCHEMA = "market-sector-v3-slot-source-ask/1"
V3_SLOT_COVERAGE_SCHEMA = "market-sector-v3-slot-coverage/1"
V3_SLOT_PROVENANCE_SCHEMA = "market-sector-v3-slot-provenance/1"
V3_EOD_REDUCTION_SCHEMA = "market-sector-v3-eod-source-reduction/1"
V3_EOD_USAGE_SCOPE = "INTERNAL_PROSPECTIVE_MARKET_SECTOR_V3_MEASUREMENT"
USD_ATOM_SCALE = 100_000_000

_SLOT_FACT_FIELDS = frozenset(
    {
        "analysis_unit_id",
        "ask_atoms",
        "available_at",
        "identity_sha256",
        "logical_source",
        "market_hash_name",
        "membership_sha256",
        "normalized_record_sha256",
        "provider_response_time",
        "schema",
        "slot_at",
        "source_collected_at",
        "source_fact_sha256",
        "source_observed_at",
        "source_updated_at",
        "visible_listing_slots",
    }
)

_V3_SLOT_ARTIFACT_PATHS = frozenset(
    {
        "data/missing-members.canonical.jsonl",
        "data/source-asks.canonical.jsonl",
        "manifests/provenance.json",
        "summary/coverage.json",
    }
)

_V3_SLOT_PROVENANCE_FIELDS = frozenset(
    {
        "available_at",
        "capture_terminal_sha256",
        "membership_id",
        "membership_sha256",
        "normalizer_version",
        "raw_manifest_sha256",
        "raw_payload_sha256",
        "schema",
        "slot_at",
        "usage_scope",
    }
)

_V3_SLOT_COVERAGE_FIELDS = frozenset(
    {
        "formal_state_eligible",
        "identity_only_target_count",
        "membership_id",
        "membership_sha256",
        "missing_target_count",
        "missing_target_names_sha256",
        "normalized_source_fact_count",
        "positive_ask_count_by_source",
        "provisional_member_count",
        "provider_target_present_count",
        "schema",
        "slot_at",
        "source_fact_count_by_source",
        "source_missing_clock_count_by_source",
        "target_member_count",
        "unbound_source_observation_count",
        "usage_scope",
    }
)


class MarketSectorEodV3Error(ValueError):
    """A captured slot or EOD reduction violates the V3 boundary."""


def _require(condition: bool, code: str) -> None:
    if not condition:
        raise MarketSectorEodV3Error(code)


def _hash64(value: object, field: str) -> str:
    _require(
        isinstance(value, str)
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value),
        f"{field}:LOWERCASE_SHA256_REQUIRED",
    )
    return value


def _utc(value: datetime, field: str) -> datetime:
    _require(
        isinstance(value, datetime)
        and value.tzinfo is not None
        and value.utcoffset() == timedelta(0),
        f"{field}:UTC_REQUIRED",
    )
    return value.astimezone(UTC)


def _utc_text(value: object, field: str) -> datetime:
    _require(isinstance(value, str) and value, f"{field}:TEXT_REQUIRED")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise MarketSectorEodV3Error(f"{field}:UTC_TIMESTAMP_REQUIRED") from exc
    return _utc(parsed, field)


def _date_text(value: object, field: str) -> date:
    _require(isinstance(value, str) and value, f"{field}:TEXT_REQUIRED")
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise MarketSectorEodV3Error(f"{field}:DATE_REQUIRED") from exc
    _require(parsed.isoformat() == value, f"{field}:CANONICAL_DATE_REQUIRED")
    return parsed


def _strict_json(payload: bytes, field: str) -> Mapping[str, Any]:
    def pairs(values: list[tuple[str, Any]]) -> dict[str, Any]:
        output: dict[str, Any] = {}
        for key, value in values:
            _require(key not in output, f"{field}:DUPLICATE_KEY:{key}")
            output[key] = value
        return output

    try:
        document = json.loads(payload.decode("utf-8"), object_pairs_hook=pairs)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise MarketSectorEodV3Error(f"{field}:INVALID_UTF8_JSON") from exc
    _require(isinstance(document, Mapping), f"{field}:OBJECT_REQUIRED")
    return document


def _strict_file(path: Path, field: str) -> Mapping[str, Any]:
    try:
        payload = path.read_bytes()
    except OSError as exc:
        raise MarketSectorEodV3Error(f"{field}:UNREADABLE") from exc
    document = _strict_json(payload, field)
    _require(
        canonical_json_bytes(dict(document)) == payload,
        f"{field}:NON_CANONICAL_JSON",
    )
    return document


def _canonical_jsonl(path: Path, field: str) -> tuple[Mapping[str, Any], ...]:
    try:
        payload = path.read_bytes()
    except OSError as exc:
        raise MarketSectorEodV3Error(f"{field}:UNREADABLE") from exc
    if not payload:
        return ()
    _require(payload.endswith(b"\n"), f"{field}:TRAILING_LF_REQUIRED")
    rows: list[Mapping[str, Any]] = []
    for ordinal, line in enumerate(payload.splitlines(), start=1):
        _require(bool(line), f"{field}:BLANK_LINE:{ordinal}")
        document = _strict_json(line, f"{field}:{ordinal}")
        _require(
            canonical_json_bytes(dict(document)) == line + b"\n",
            f"{field}:NON_CANONICAL_JSON:{ordinal}",
        )
        rows.append(document)
    return tuple(rows)


def _membership_document_sha256(membership: TaxonomyMembershipV3) -> str:
    return sha256_hex(canonical_json_bytes(dict(membership.document)))


def _ask_atoms(value: Decimal | None) -> int | None:
    if value is None:
        return None
    decimal_38_8_text(value)
    with localcontext() as context:
        context.prec = 50
        scaled = value * USD_ATOM_SCALE
    _require(scaled == scaled.to_integral_value(), "ASK_ATOM_SCALE_DRIFT")
    return int(scaled)


def _source_clock(
    *,
    updated_at: datetime | None,
    collected_at: datetime | None,
    available_at: datetime,
) -> datetime | None:
    # Preserve the established latest-source adapter precedence.  A provider
    # response clock is knowledge time, never a substitute for a missing quote
    # event clock.
    for value in (updated_at, collected_at):
        if value is not None and value <= available_at:
            return value
    return None


def _optional_utc_text(value: datetime | None) -> str | None:
    return None if value is None else utc_timestamp_text(value)


@dataclass(frozen=True, slots=True)
class V3SlotSourceAskFact:
    analysis_unit_id: str
    market_hash_name: str
    identity_sha256: str
    logical_source: str
    slot_at: datetime
    provider_response_time: datetime
    source_updated_at: datetime | None
    source_collected_at: datetime | None
    source_observed_at: datetime | None
    available_at: datetime
    ask_atoms: int | None
    visible_listing_slots: int | None
    membership_sha256: str
    normalized_record_sha256: str
    source_fact_sha256: str

    def __post_init__(self) -> None:
        _require(isinstance(self.analysis_unit_id, str) and self.analysis_unit_id, "SLOT_FACT_UNIT")
        _require(isinstance(self.market_hash_name, str) and self.market_hash_name, "SLOT_FACT_MHN")
        _hash64(self.identity_sha256, "SLOT_FACT_IDENTITY_SHA256")
        _require(self.logical_source in PROVIDER_IDS_V3, "SLOT_FACT_SOURCE")
        _utc(self.slot_at, "SLOT_FACT_SLOT_AT")
        _require(
            self.slot_at.second == 0
            and self.slot_at.microsecond == 0
            and self.slot_at.minute % 5 == 0,
            "SLOT_FACT_SLOT_NOT_CANONICAL",
        )
        _utc(self.provider_response_time, "SLOT_FACT_PROVIDER_RESPONSE_TIME")
        for value, field in (
            (self.source_updated_at, "SLOT_FACT_UPDATED_AT"),
            (self.source_collected_at, "SLOT_FACT_COLLECTED_AT"),
            (self.source_observed_at, "SLOT_FACT_OBSERVED_AT"),
        ):
            if value is not None:
                _utc(value, field)
        _utc(self.available_at, "SLOT_FACT_AVAILABLE_AT")
        _require(
            self.slot_at <= self.available_at < self.slot_at + timedelta(minutes=5),
            "SLOT_FACT_CAPTURE_OUTSIDE_SLOT",
        )
        _require(self.provider_response_time <= self.available_at, "PROVIDER_RESPONSE_AFTER_AVAILABILITY")
        if self.source_observed_at is not None:
            _require(self.source_observed_at <= self.available_at, "SOURCE_CLOCK_AFTER_AVAILABILITY")
        _require(
            self.ask_atoms is None or (type(self.ask_atoms) is int and self.ask_atoms >= 0),
            "SLOT_FACT_ASK_ATOMS",
        )
        _require(
            self.visible_listing_slots is None
            or (type(self.visible_listing_slots) is int and self.visible_listing_slots >= 0),
            "SLOT_FACT_LISTING_SLOTS",
        )
        _hash64(self.membership_sha256, "SLOT_FACT_MEMBERSHIP_SHA256")
        _hash64(self.normalized_record_sha256, "SLOT_FACT_NORMALIZED_RECORD_SHA256")
        _hash64(self.source_fact_sha256, "SLOT_FACT_SHA256")


def _slot_fact_body(
    *,
    analysis_unit_id: str,
    market_hash_name: str,
    identity_sha256: str,
    logical_source: str,
    slot_at: datetime,
    provider_response_time: datetime,
    source_updated_at: datetime | None,
    source_collected_at: datetime | None,
    source_observed_at: datetime | None,
    available_at: datetime,
    ask_atoms: int | None,
    visible_listing_slots: int | None,
    normalized_record_sha256: str,
    membership_sha256: str,
) -> dict[str, Any]:
    return {
        "analysis_unit_id": analysis_unit_id,
        "ask_atoms": ask_atoms,
        "available_at": utc_timestamp_text(available_at),
        "identity_sha256": identity_sha256,
        "logical_source": logical_source,
        "market_hash_name": market_hash_name,
        "membership_sha256": membership_sha256,
        "normalized_record_sha256": normalized_record_sha256,
        "provider_response_time": utc_timestamp_text(provider_response_time),
        "schema": V3_SLOT_FACT_SCHEMA,
        "slot_at": utc_timestamp_text(slot_at),
        "source_collected_at": _optional_utc_text(source_collected_at),
        "source_observed_at": _optional_utc_text(source_observed_at),
        "source_updated_at": _optional_utc_text(source_updated_at),
        "visible_listing_slots": visible_listing_slots,
    }


def _slot_fact_document(body: Mapping[str, Any]) -> dict[str, Any]:
    fact_hash = sha256_hex(canonical_json_bytes(dict(body)))
    return {**body, "source_fact_sha256": fact_hash}


@dataclass(frozen=True, slots=True)
class V3SlotProjection:
    slot_at: datetime
    available_at: datetime
    membership_id: str
    membership_sha256: str
    normalized_manifest_sha256: str
    facts: tuple[V3SlotSourceAskFact, ...]
    coverage: Mapping[str, Any]

    def __post_init__(self) -> None:
        _utc(self.slot_at, "PROJECTION_SLOT_AT")
        _utc(self.available_at, "PROJECTION_AVAILABLE_AT")
        _require(
            self.slot_at.second == 0
            and self.slot_at.microsecond == 0
            and self.slot_at.minute % 5 == 0,
            "PROJECTION_SLOT_NOT_CANONICAL",
        )
        _require(
            self.slot_at <= self.available_at < self.slot_at + timedelta(minutes=5),
            "PROJECTION_CAPTURE_OUTSIDE_SLOT",
        )
        _require(isinstance(self.membership_id, str) and self.membership_id, "PROJECTION_MEMBERSHIP_ID")
        _hash64(self.membership_sha256, "PROJECTION_MEMBERSHIP_SHA256")
        _hash64(self.normalized_manifest_sha256, "PROJECTION_MANIFEST_SHA256")
        _require(isinstance(self.coverage, Mapping), "PROJECTION_COVERAGE_OBJECT_REQUIRED")
        seen: set[tuple[str, str]] = set()
        for fact in self.facts:
            _require(fact.slot_at == self.slot_at, "PROJECTION_FACT_SLOT_DRIFT")
            _require(fact.available_at == self.available_at, "PROJECTION_FACT_AVAILABILITY_DRIFT")
            _require(
                fact.membership_sha256 == self.membership_sha256,
                "PROJECTION_FACT_MEMBERSHIP_HASH_DRIFT",
            )
            key = (fact.analysis_unit_id, fact.logical_source)
            _require(key not in seen, "PROJECTION_DUPLICATE_UNIT_SOURCE")
            seen.add(key)


class V3LatestSlotNormalizer:
    """Project all sealed V3 names without altering the catalog normalizer."""

    def __init__(
        self,
        *,
        slot_dir: Path,
        membership: TaxonomyMembershipV3,
        membership_sha256: str,
    ) -> None:
        self._slot_dir = slot_dir.resolve()
        self._membership = membership
        self._membership_sha256 = _hash64(membership_sha256, "MEMBERSHIP_SHA256")
        _require(
            _membership_document_sha256(membership) == self._membership_sha256,
            "MEMBERSHIP_DOCUMENT_HASH_DRIFT",
        )

    def __call__(
        self, payload: bytes, *, capture_terminal: Mapping[str, Any]
    ) -> Mapping[str, bytes]:
        plan_path = self._slot_dir / "plan.json"
        manifest_path = self._slot_dir / "raw-manifest.json"
        terminal_path = self._slot_dir / "capture-terminal.json"
        plan_bytes = plan_path.read_bytes()
        manifest_bytes = manifest_path.read_bytes()
        terminal_bytes = terminal_path.read_bytes()
        plan = _strict_json(plan_bytes, "CAPTURE_PLAN")
        manifest = _strict_json(manifest_bytes, "RAW_MANIFEST")
        terminal = _strict_json(terminal_bytes, "CAPTURE_TERMINAL")
        _require(dict(capture_terminal) == dict(terminal), "CAPTURE_TERMINAL_ARGUMENT_DRIFT")
        _require(terminal.get("plan_document_hash") == sha256_hex(plan_bytes), "CAPTURE_PLAN_HASH_DRIFT")
        _require(terminal.get("raw_manifest_hash") == sha256_hex(manifest_bytes), "RAW_MANIFEST_HASH_DRIFT")
        _require(plan.get("source_code") == "upstream", "CAPTURE_SOURCE_DRIFT")
        _require(plan.get("endpoint_code") == UPSTREAM_LATEST_ENDPOINT_CODE, "CAPTURE_ENDPOINT_DRIFT")
        _require(manifest.get("source_code") == "upstream", "RAW_SOURCE_DRIFT")
        _require(manifest.get("endpoint_code") == UPSTREAM_LATEST_ENDPOINT_CODE, "RAW_ENDPOINT_DRIFT")
        _require(manifest.get("http_status_code") == 200, "RAW_HTTP_STATUS")
        expected_request_count = 0 if plan.get("execution_mode") == "FIXTURE" else 1
        _require(
            manifest.get("network_request_count") == expected_request_count,
            "RAW_REQUEST_COUNT",
        )
        _require(plan.get("slot_id") == terminal.get("slot_id") == manifest.get("slot_id"), "CAPTURE_SLOT_DRIFT")
        artifacts = manifest.get("artifacts")
        _require(isinstance(artifacts, list) and len(artifacts) == 1, "RAW_ARTIFACT_COUNT")
        artifact = artifacts[0]
        _require(isinstance(artifact, Mapping), "RAW_ARTIFACT_OBJECT")
        _require(artifact.get("path") == "raw/response-0001.bin", "RAW_ARTIFACT_PATH")
        _require(artifact.get("sha256") == sha256_hex(payload), "RAW_PAYLOAD_SHA256")
        _require(artifact.get("byte_count") == len(payload), "RAW_PAYLOAD_SIZE")
        slot_at = _utc_text(plan.get("planned_for"), "PLANNED_FOR")
        available_at = _utc_text(artifact.get("fetched_at"), "FETCHED_AT")
        _require(
            slot_at.second == 0
            and slot_at.microsecond == 0
            and slot_at.minute % 5 == 0,
            "SLOT_NOT_FIVE_MINUTE_ALIGNED",
        )
        _require(slot_at <= available_at < slot_at + timedelta(minutes=5), "CAPTURE_OUTSIDE_SLOT")
        _require(self._membership.sealed_at <= available_at, "MEMBERSHIP_NOT_AVAILABLE_AT_SLOT")
        _require(slot_at >= self._membership.sealed_at, "SLOT_PREDATES_MEMBERSHIP_SEAL")

        members_by_name = {member.market_hash_name: member for member in self._membership.members}
        _require(len(members_by_name) == len(self._membership.members), "MEMBERSHIP_MHN_NOT_UNIQUE")
        parsed = parse_upstream_latest(payload, target_names=frozenset(members_by_name))
        provider_names = frozenset(parsed.provider_item_names)
        missing_names = sorted(set(members_by_name) - provider_names)
        identity_only = frozenset(parsed.identity_only_item_names)
        rows: list[dict[str, Any]] = []
        unbound_source_count = 0
        source_counts: Counter[str] = Counter()
        positive_ask_counts: Counter[str] = Counter()
        missing_clock_counts: Counter[str] = Counter()
        for observation in parsed.observations:
            if observation.variant_version is not None:
                continue
            member = members_by_name.get(observation.base_market_hash_name)
            if member is None:
                continue
            source = observation.provider_source
            if source not in member.source_ids_present:
                unbound_source_count += 1
                continue
            record = observation.to_document()
            observed_at = _source_clock(
                updated_at=observation.source_updated_at,
                collected_at=observation.source_collected_at,
                available_at=available_at,
            )
            body = _slot_fact_body(
                analysis_unit_id=member.analysis_unit_id,
                market_hash_name=member.market_hash_name,
                identity_sha256=member.identity_sha256,
                logical_source=source,
                slot_at=slot_at,
                provider_response_time=observation.provider_response_time,
                source_updated_at=observation.source_updated_at,
                source_collected_at=observation.source_collected_at,
                source_observed_at=observed_at,
                available_at=available_at,
                ask_atoms=_ask_atoms(observation.ask_usd),
                visible_listing_slots=observation.ask_volume_raw,
                normalized_record_sha256=record["record_hash"],
                membership_sha256=self._membership_sha256,
            )
            row = _slot_fact_document(body)
            rows.append(row)
            source_counts[source] += 1
            if row["ask_atoms"] is not None and row["ask_atoms"] > 0:
                positive_ask_counts[source] += 1
            if observed_at is None:
                missing_clock_counts[source] += 1
        rows.sort(key=lambda row: (row["analysis_unit_id"], row["logical_source"]))
        _require(
            len({(row["analysis_unit_id"], row["logical_source"]) for row in rows})
            == len(rows),
            "DUPLICATE_UNIT_SOURCE_IN_SLOT",
        )
        missing_rows = [
            {
                "analysis_unit_id": members_by_name[name].analysis_unit_id,
                "identity_sha256": members_by_name[name].identity_sha256,
                "market_hash_name": name,
                "reason": "ABSENT_FROM_PROVIDER_LATEST_RESPONSE",
                "schema": "market-sector-v3-slot-missing-member/1",
            }
            for name in missing_names
        ]
        coverage = {
            "formal_state_eligible": False,
            "identity_only_target_count": len(set(members_by_name) & identity_only),
            "membership_id": self._membership.membership_id,
            "membership_sha256": self._membership_sha256,
            "missing_target_count": len(missing_names),
            "missing_target_names_sha256": sha256_hex(canonical_json_bytes(missing_names)),
            "normalized_source_fact_count": len(rows),
            "positive_ask_count_by_source": {
                source: positive_ask_counts[source] for source in PROVIDER_IDS_V3
            },
            "provisional_member_count": sum(
                member.identity_authority == "EXACT_MARKET_HASH_NAME_SHA256_PROVISIONAL"
                for member in self._membership.members
            ),
            "provider_target_present_count": len(set(members_by_name) & provider_names),
            "schema": V3_SLOT_COVERAGE_SCHEMA,
            "slot_at": utc_timestamp_text(slot_at),
            "source_fact_count_by_source": {
                source: source_counts[source] for source in PROVIDER_IDS_V3
            },
            "source_missing_clock_count_by_source": {
                source: missing_clock_counts[source] for source in PROVIDER_IDS_V3
            },
            "target_member_count": len(self._membership.members),
            "unbound_source_observation_count": unbound_source_count,
            "usage_scope": V3_EOD_USAGE_SCOPE,
        }
        provenance = {
            "available_at": utc_timestamp_text(available_at),
            "capture_terminal_sha256": sha256_hex(terminal_bytes),
            "membership_id": self._membership.membership_id,
            "membership_sha256": self._membership_sha256,
            "normalizer_version": V3_SLOT_NORMALIZER_VERSION,
            "raw_manifest_sha256": sha256_hex(manifest_bytes),
            "raw_payload_sha256": sha256_hex(payload),
            "schema": V3_SLOT_PROVENANCE_SCHEMA,
            "slot_at": utc_timestamp_text(slot_at),
            "usage_scope": V3_EOD_USAGE_SCOPE,
        }
        return {
            "data/missing-members.canonical.jsonl": b"".join(
                canonical_json_bytes(row) for row in missing_rows
            ),
            "data/source-asks.canonical.jsonl": b"".join(
                canonical_json_bytes(row) for row in rows
            ),
            "manifests/provenance.json": canonical_json_bytes(provenance),
            "summary/coverage.json": canonical_json_bytes(coverage),
        }


def normalize_market_sector_v3_slot(
    *,
    slot_dir: Path,
    membership: TaxonomyMembershipV3,
    membership_sha256: str,
    attempt_id: str,
    clock: Any | None = None,
) -> NormalizationOutcome:
    arguments: dict[str, Any] = {
        "slot_dir": slot_dir,
        "parser_version": V3_SLOT_NORMALIZER_VERSION,
        "normalizer": V3LatestSlotNormalizer(
            slot_dir=slot_dir,
            membership=membership,
            membership_sha256=membership_sha256,
        ),
        "attempt_id": attempt_id,
    }
    if clock is not None:
        arguments["clock"] = clock
    return normalize_captured_slot(**arguments)


def _slot_fact_from_document(document: Mapping[str, Any]) -> V3SlotSourceAskFact:
    _require(set(document) == set(_SLOT_FACT_FIELDS), "SLOT_FACT_FIELD_SET_DRIFT")
    source_hash = _hash64(document.get("source_fact_sha256"), "SOURCE_FACT_SHA256")
    body = {key: value for key, value in document.items() if key != "source_fact_sha256"}
    # Rebuild the typed row after independently checking the canonical body hash.
    return V3SlotSourceAskFact(
        analysis_unit_id=document["analysis_unit_id"],
        market_hash_name=document["market_hash_name"],
        identity_sha256=document["identity_sha256"],
        logical_source=document["logical_source"],
        slot_at=_utc_text(document["slot_at"], "SLOT_AT"),
        provider_response_time=_utc_text(
            document["provider_response_time"], "PROVIDER_RESPONSE_TIME"
        ),
        source_updated_at=(
            None
            if document["source_updated_at"] is None
            else _utc_text(document["source_updated_at"], "SOURCE_UPDATED_AT")
        ),
        source_collected_at=(
            None
            if document["source_collected_at"] is None
            else _utc_text(document["source_collected_at"], "SOURCE_COLLECTED_AT")
        ),
        source_observed_at=(
            None
            if document["source_observed_at"] is None
            else _utc_text(document["source_observed_at"], "SOURCE_OBSERVED_AT")
        ),
        available_at=_utc_text(document["available_at"], "AVAILABLE_AT"),
        ask_atoms=document["ask_atoms"],
        visible_listing_slots=document["visible_listing_slots"],
        membership_sha256=document["membership_sha256"],
        normalized_record_sha256=document["normalized_record_sha256"],
        source_fact_sha256=source_hash,
    )


def load_v3_slot_projection(
    *,
    slot_dir: Path,
    attempt_id: str,
    membership: TaxonomyMembershipV3,
    membership_sha256: str,
    expected_parser_version: str = V3_SLOT_NORMALIZER_VERSION,
    expected_usage_scope: str = V3_EOD_USAGE_SCOPE,
    expected_missing_reason: str = "ABSENT_FROM_PROVIDER_LATEST_RESPONSE",
) -> V3SlotProjection:
    membership_sha256 = _hash64(membership_sha256, "MEMBERSHIP_SHA256")
    _require(
        _membership_document_sha256(membership) == membership_sha256,
        "MEMBERSHIP_DOCUMENT_HASH_DRIFT",
    )
    bundle = load_normalized_bundle(slot_dir, attempt_id)
    _require(
        bundle.manifest.get("parser_version") == expected_parser_version,
        "V3_SLOT_PARSER_VERSION_DRIFT",
    )
    _require(
        set(bundle.manifest)
        == {
            "artifacts",
            "attempt_id",
            "capture_terminal_hash",
            "contract_version",
            "parser_version",
        }
        and bundle.manifest.get("attempt_id") == attempt_id
        and bundle.manifest.get("capture_terminal_hash") == bundle.capture_terminal_hash,
        "V3_SLOT_MANIFEST_BINDING_DRIFT",
    )
    artifacts = bundle.manifest.get("artifacts")
    _require(isinstance(artifacts, list), "V3_SLOT_ARTIFACTS_REQUIRED")
    artifact_paths = {
        descriptor.get("path")
        for descriptor in artifacts
        if isinstance(descriptor, Mapping)
    }
    _require(
        len(artifact_paths) == len(artifacts)
        and artifact_paths == _V3_SLOT_ARTIFACT_PATHS,
        "V3_SLOT_ARTIFACT_SET_DRIFT",
    )
    provenance = _strict_file(bundle.directory / "manifests" / "provenance.json", "PROVENANCE")
    coverage = _strict_file(bundle.directory / "summary" / "coverage.json", "COVERAGE")
    _require(set(provenance) == _V3_SLOT_PROVENANCE_FIELDS, "PROVENANCE_FIELD_SET_DRIFT")
    _require(set(coverage) == _V3_SLOT_COVERAGE_FIELDS, "COVERAGE_FIELD_SET_DRIFT")
    _require(provenance.get("schema") == V3_SLOT_PROVENANCE_SCHEMA, "PROVENANCE_SCHEMA")
    _require(coverage.get("schema") == V3_SLOT_COVERAGE_SCHEMA, "COVERAGE_SCHEMA")
    for document in (provenance, coverage):
        _require(document.get("membership_id") == membership.membership_id, "MEMBERSHIP_ID_DRIFT")
        _require(document.get("membership_sha256") == membership_sha256, "MEMBERSHIP_SHA256_DRIFT")
        _require(document.get("usage_scope") == expected_usage_scope, "USAGE_SCOPE_DRIFT")
    _require(provenance.get("capture_terminal_sha256") == bundle.capture_terminal_hash, "TERMINAL_HASH_DRIFT")
    _require(
        provenance.get("normalizer_version") == expected_parser_version,
        "PROVENANCE_NORMALIZER_VERSION_DRIFT",
    )
    terminal = _strict_file(slot_dir / "capture-terminal.json", "CAPTURE_TERMINAL")
    raw_manifest = _strict_file(slot_dir / "raw-manifest.json", "RAW_MANIFEST")
    _require(
        provenance.get("raw_manifest_sha256") == terminal.get("raw_manifest_hash"),
        "PROVENANCE_RAW_MANIFEST_BINDING_DRIFT",
    )
    raw_artifacts = raw_manifest.get("artifacts")
    _require(
        isinstance(raw_artifacts, list)
        and len(raw_artifacts) == 1
        and isinstance(raw_artifacts[0], Mapping),
        "RAW_ARTIFACT_SET_DRIFT",
    )
    _require(
        provenance.get("raw_payload_sha256") == raw_artifacts[0].get("sha256"),
        "PROVENANCE_RAW_PAYLOAD_BINDING_DRIFT",
    )
    row_path = bundle.directory / "data" / "source-asks.canonical.jsonl"
    documents = _canonical_jsonl(row_path, "SLOT_FACTS")
    members_by_id = {member.analysis_unit_id: member for member in membership.members}
    facts: list[V3SlotSourceAskFact] = []
    for document in documents:
        fact = _slot_fact_from_document(document)
        member = members_by_id.get(fact.analysis_unit_id)
        _require(member is not None, "SLOT_FACT_OUTSIDE_MEMBERSHIP")
        _require(fact.market_hash_name == member.market_hash_name, "SLOT_FACT_MHN_DRIFT")
        _require(fact.identity_sha256 == member.identity_sha256, "SLOT_FACT_IDENTITY_DRIFT")
        _require(fact.logical_source in member.source_ids_present, "SLOT_FACT_UNBOUND_SOURCE")
        _require(fact.membership_sha256 == membership_sha256, "SLOT_FACT_MEMBERSHIP_HASH_DRIFT")
        recomputed = sha256_hex(
            canonical_json_bytes(
                {key: value for key, value in document.items() if key != "source_fact_sha256"}
            )
        )
        _require(recomputed == fact.source_fact_sha256, "SLOT_FACT_SOURCE_HASH_DRIFT")
        facts.append(fact)
    facts.sort(key=lambda row: (row.analysis_unit_id, row.logical_source))
    _require(
        len({(row.analysis_unit_id, row.logical_source) for row in facts}) == len(facts),
        "SLOT_FACT_DUPLICATE_UNIT_SOURCE",
    )
    _require(coverage.get("normalized_source_fact_count") == len(facts), "SLOT_FACT_COUNT_DRIFT")
    slot_at = _utc_text(provenance.get("slot_at"), "PROJECTION_SLOT_AT")
    available_at = _utc_text(provenance.get("available_at"), "PROJECTION_AVAILABLE_AT")
    _require(
        all(fact.available_at == available_at for fact in facts),
        "PROJECTION_AVAILABILITY_DRIFT",
    )
    _require(all(fact.slot_at == slot_at for fact in facts), "PROJECTION_SLOT_FACT_DRIFT")

    missing_rows = _canonical_jsonl(
        bundle.directory / "data" / "missing-members.canonical.jsonl",
        "MISSING_MEMBERS",
    )
    _require(coverage.get("target_member_count") == len(membership.members), "TARGET_MEMBER_COUNT_DRIFT")
    _require(coverage.get("formal_state_eligible") is False, "COVERAGE_FORMAL_STATE_DRIFT")
    _require(coverage.get("slot_at") == provenance.get("slot_at"), "COVERAGE_SLOT_DRIFT")
    _require(
        coverage.get("provisional_member_count")
        == sum(
            member.identity_authority == "EXACT_MARKET_HASH_NAME_SHA256_PROVISIONAL"
            for member in membership.members
        ),
        "PROVISIONAL_MEMBER_COUNT_DRIFT",
    )
    _require(coverage.get("missing_target_count") == len(missing_rows), "MISSING_MEMBER_COUNT_DRIFT")
    _require(
        type(coverage.get("provider_target_present_count")) is int
        and coverage["provider_target_present_count"] + len(missing_rows)
        == len(membership.members),
        "PROVIDER_TARGET_ACCOUNTING_DRIFT",
    )
    _require(
        type(coverage.get("identity_only_target_count")) is int
        and 0
        <= coverage["identity_only_target_count"]
        <= coverage["provider_target_present_count"],
        "IDENTITY_ONLY_TARGET_ACCOUNTING_DRIFT",
    )
    _require(
        type(coverage.get("unbound_source_observation_count")) is int
        and coverage["unbound_source_observation_count"] >= 0,
        "UNBOUND_SOURCE_COUNT_DRIFT",
    )
    missing_names: list[str] = []
    for row in missing_rows:
        _require(
            set(row)
            == {"analysis_unit_id", "identity_sha256", "market_hash_name", "reason", "schema"},
            "MISSING_MEMBER_FIELD_SET_DRIFT",
        )
        member = members_by_id.get(row.get("analysis_unit_id"))
        _require(member is not None, "MISSING_MEMBER_OUTSIDE_MEMBERSHIP")
        _require(row.get("identity_sha256") == member.identity_sha256, "MISSING_MEMBER_IDENTITY_DRIFT")
        _require(row.get("market_hash_name") == member.market_hash_name, "MISSING_MEMBER_MHN_DRIFT")
        _require(
            row.get("reason") == expected_missing_reason
            and row.get("schema") == "market-sector-v3-slot-missing-member/1",
            "MISSING_MEMBER_REASON_DRIFT",
        )
        missing_names.append(member.market_hash_name)
    _require(len(set(missing_names)) == len(missing_names), "MISSING_MEMBER_DUPLICATE")
    _require(
        coverage.get("missing_target_names_sha256")
        == sha256_hex(canonical_json_bytes(sorted(missing_names))),
        "MISSING_MEMBER_NAMES_HASH_DRIFT",
    )
    source_counts = Counter(fact.logical_source for fact in facts)
    positive_counts = Counter(
        fact.logical_source for fact in facts if fact.ask_atoms is not None and fact.ask_atoms > 0
    )
    missing_clock_counts = Counter(
        fact.logical_source for fact in facts if fact.source_observed_at is None
    )
    _require(
        coverage.get("source_fact_count_by_source")
        == {source: source_counts[source] for source in PROVIDER_IDS_V3},
        "SOURCE_FACT_COUNTS_DRIFT",
    )
    _require(
        coverage.get("positive_ask_count_by_source")
        == {source: positive_counts[source] for source in PROVIDER_IDS_V3},
        "POSITIVE_ASK_COUNTS_DRIFT",
    )
    _require(
        coverage.get("source_missing_clock_count_by_source")
        == {source: missing_clock_counts[source] for source in PROVIDER_IDS_V3},
        "MISSING_CLOCK_COUNTS_DRIFT",
    )
    return V3SlotProjection(
        slot_at=slot_at,
        available_at=available_at,
        membership_id=membership.membership_id,
        membership_sha256=membership_sha256,
        normalized_manifest_sha256=bundle.manifest_hash,
        facts=tuple(facts),
        coverage=coverage,
    )


class V3EndOfDaySourceStatus(StrEnum):
    QUALIFIED = "QUALIFIED"
    INSUFFICIENT_SLOTS = "INSUFFICIENT_SLOTS"
    INVALID_OR_MISSING_ASK = "INVALID_OR_MISSING_ASK"
    STALE_QUOTE = "STALE_QUOTE"
    MISSING_SOURCE_CLOCK = "MISSING_SOURCE_CLOCK"
    CROSS_SOURCE_INCOHERENT = "CROSS_SOURCE_INCOHERENT"


@dataclass(frozen=True, slots=True)
class V3EndOfDayDiagnostic:
    analysis_unit_id: str
    logical_source: str
    status: V3EndOfDaySourceStatus
    supplied_slot_count: int
    positive_fresh_slot_count: int
    stale_slot_count: int
    missing_source_clock_slot_count: int
    invalid_or_missing_ask_slot_count: int
    reduced_ask_atoms: int | None
    reason_codes: tuple[str, ...]
    lineage_sha256: str

    def __post_init__(self) -> None:
        _require(isinstance(self.analysis_unit_id, str) and self.analysis_unit_id, "EOD_DIAGNOSTIC_UNIT")
        _require(self.logical_source in PROVIDER_IDS_V3, "EOD_DIAGNOSTIC_SOURCE")
        _require(isinstance(self.status, V3EndOfDaySourceStatus), "EOD_DIAGNOSTIC_STATUS")
        for value, field in (
            (self.supplied_slot_count, "SUPPLIED_SLOT_COUNT"),
            (self.positive_fresh_slot_count, "POSITIVE_FRESH_SLOT_COUNT"),
            (self.stale_slot_count, "STALE_SLOT_COUNT"),
            (self.missing_source_clock_slot_count, "MISSING_SOURCE_CLOCK_SLOT_COUNT"),
            (self.invalid_or_missing_ask_slot_count, "INVALID_OR_MISSING_ASK_SLOT_COUNT"),
        ):
            _require(type(value) is int and 0 <= value <= 12, f"EOD_DIAGNOSTIC_{field}")
        _require(
            self.reduced_ask_atoms is None
            or (type(self.reduced_ask_atoms) is int and self.reduced_ask_atoms > 0),
            "EOD_DIAGNOSTIC_REDUCED_ASK",
        )
        _require(
            bool(self.reason_codes)
            and len(self.reason_codes) == len(set(self.reason_codes))
            and all(isinstance(value, str) and value for value in self.reason_codes),
            "EOD_DIAGNOSTIC_REASON_CODES",
        )
        _hash64(self.lineage_sha256, "EOD_DIAGNOSTIC_LINEAGE_SHA256")


@dataclass(frozen=True, slots=True)
class V3EndOfDayReduction:
    bucket_date: date
    reduced_at: datetime
    membership_id: str
    membership_sha256: str
    input_snapshot_sha256: str
    policy_sha256: str
    supplied_slot_count: int
    source_facts: tuple[V3ReducedSourceAskFact, ...]
    diagnostics: tuple[V3EndOfDayDiagnostic, ...]

    def __post_init__(self) -> None:
        _utc(self.reduced_at, "EOD_REDUCED_AT")
        _require(isinstance(self.membership_id, str) and self.membership_id, "EOD_MEMBERSHIP_ID")
        _hash64(self.membership_sha256, "EOD_MEMBERSHIP_SHA256")
        _hash64(self.input_snapshot_sha256, "EOD_INPUT_SNAPSHOT_SHA256")
        _hash64(self.policy_sha256, "EOD_POLICY_SHA256")
        _require(
            type(self.supplied_slot_count) is int and 0 <= self.supplied_slot_count <= 12,
            "EOD_SUPPLIED_SLOT_COUNT",
        )
        fact_keys = tuple(
            (row.analysis_unit_id, row.logical_source) for row in self.source_facts
        )
        _require(
            all(
                row.bucket_date == self.bucket_date and row.available_at <= self.reduced_at
                for row in self.source_facts
            ),
            "EOD_SOURCE_FACT_TIME_DRIFT",
        )
        _require(
            fact_keys == tuple(sorted(set(fact_keys))),
            "EOD_SOURCE_FACTS_NOT_SORTED_UNIQUE",
        )
        diagnostic_keys = tuple(
            (row.analysis_unit_id, row.logical_source) for row in self.diagnostics
        )
        _require(
            diagnostic_keys == tuple(sorted(set(diagnostic_keys))),
            "EOD_DIAGNOSTICS_NOT_SORTED_UNIQUE",
        )

    @property
    def reduction_id(self) -> str:
        return "market_sector_v3_eod_reduction_" + sha256_hex(
            canonical_json_bytes(_v3_eod_body(self))
        )


def _median_atom(values: Iterable[int]) -> int:
    ordered = sorted(Decimal(value) for value in values)
    _require(bool(ordered), "EOD_MEDIAN_EMPTY")
    middle = len(ordered) // 2
    value = ordered[middle] if len(ordered) % 2 else (ordered[middle - 1] + ordered[middle]) / 2
    return int(value.to_integral_value(rounding=ROUND_HALF_UP))


def reduce_v3_end_of_day_source_asks(
    *,
    membership: TaxonomyMembershipV3,
    membership_sha256: str,
    bucket_date: date,
    reduced_at: datetime,
    projections: Iterable[V3SlotProjection],
    policy: EndOfDayReductionPolicy = FROZEN_END_OF_DAY_REDUCTION_POLICY_V1,
) -> V3EndOfDayReduction:
    reduced_at = _utc(reduced_at, "EOD_REDUCED_AT")
    _require(
        policy == FROZEN_END_OF_DAY_REDUCTION_POLICY_V1,
        "EOD_POLICY_MUST_EQUAL_FROZEN_V1",
    )
    membership_sha256 = _hash64(membership_sha256, "MEMBERSHIP_SHA256")
    _require(_membership_document_sha256(membership) == membership_sha256, "MEMBERSHIP_HASH_DRIFT")
    day_end = datetime.combine(bucket_date + timedelta(days=1), time.min, tzinfo=UTC)
    window_start = day_end - timedelta(minutes=policy.final_window_minutes)
    _require(reduced_at >= day_end, "UTC_DAY_NOT_COMPLETE")
    expected_slots = {
        window_start + timedelta(minutes=policy.slot_minutes * ordinal)
        for ordinal in range(policy.expected_slots)
    }
    materialized = tuple(sorted(projections, key=lambda row: row.slot_at))
    supplied_slots = tuple(row.slot_at for row in materialized)
    _require(len(supplied_slots) == len(set(supplied_slots)), "DUPLICATE_SLOT_PROJECTION")
    _require(set(supplied_slots) <= expected_slots, "PROJECTION_OUTSIDE_FINAL_UTC_HOUR")
    for projection in materialized:
        _require(projection.membership_id == membership.membership_id, "PROJECTION_MEMBERSHIP_ID_DRIFT")
        _require(projection.membership_sha256 == membership_sha256, "PROJECTION_MEMBERSHIP_HASH_DRIFT")
        _require(
            projection.slot_at >= membership.sealed_at,
            "PROJECTION_PREDATES_MEMBERSHIP_SEAL",
        )
        _require(projection.available_at <= reduced_at, "PROJECTION_FROM_FUTURE")
    grouped: dict[tuple[str, str], list[V3SlotSourceAskFact]] = {}
    members_by_id = {member.analysis_unit_id: member for member in membership.members}
    for projection in materialized:
        for fact in projection.facts:
            _require(fact.slot_at == projection.slot_at, "FACT_PROJECTION_SLOT_DRIFT")
            _require(fact.available_at == projection.available_at, "FACT_PROJECTION_AVAILABILITY_DRIFT")
            _require(fact.membership_sha256 == membership_sha256, "FACT_MEMBERSHIP_HASH_DRIFT")
            member = members_by_id.get(fact.analysis_unit_id)
            _require(member is not None, "FACT_OUTSIDE_MEMBERSHIP")
            _require(fact.market_hash_name == member.market_hash_name, "FACT_MHN_DRIFT")
            _require(fact.identity_sha256 == member.identity_sha256, "FACT_IDENTITY_DRIFT")
            _require(fact.logical_source in member.source_ids_present, "FACT_SOURCE_NOT_BOUND_TO_MEMBER")
            grouped.setdefault((fact.analysis_unit_id, fact.logical_source), []).append(fact)

    diagnostics: list[V3EndOfDayDiagnostic] = []
    reduced_by_member: dict[str, list[tuple[V3ReducedSourceAskFact, int]]] = {}
    maximum_age = timedelta(minutes=policy.maximum_quote_age_minutes)
    for member in membership.members:
        for source in PROVIDER_IDS_V3:
            rows = sorted(grouped.get((member.analysis_unit_id, source), ()), key=lambda row: row.slot_at)
            fresh_positive = tuple(
                row
                for row in rows
                if row.ask_atoms is not None
                and row.ask_atoms > 0
                and row.source_observed_at is not None
                and row.available_at - row.source_observed_at <= maximum_age
            )
            stale = sum(
                row.source_observed_at is not None
                and row.available_at - row.source_observed_at > maximum_age
                for row in rows
            )
            missing_clock = sum(row.source_observed_at is None for row in rows)
            invalid = sum(row.ask_atoms is None or row.ask_atoms <= 0 for row in rows)
            if len(fresh_positive) >= policy.minimum_qualified_slots:
                reduced_ask = _median_atom(
                    row.ask_atoms for row in fresh_positive if row.ask_atoms is not None
                )
                source_hash = sha256_hex(
                    canonical_json_bytes(
                        {
                            "analysis_unit_id": member.analysis_unit_id,
                            "facts": [row.source_fact_sha256 for row in fresh_positive],
                            "membership_sha256": membership_sha256,
                            "policy_sha256": policy.policy_sha256,
                            "reduced_ask_atoms": reduced_ask,
                            "source": source,
                        }
                    )
                )
                output = V3ReducedSourceAskFact(
                    analysis_unit_id=member.analysis_unit_id,
                    bucket_date=bucket_date,
                    logical_source=source,
                    ask_atoms=reduced_ask,
                    available_at=max(row.available_at for row in fresh_positive),
                    source_fact_sha256=source_hash,
                )
                status = V3EndOfDaySourceStatus.QUALIFIED
                reasons = ("LAST_UTC_HOUR_MEDIAN", "MINIMUM_NINE_OF_TWELVE_SLOTS")
                reduced_by_member.setdefault(member.analysis_unit_id, []).append((output, len(diagnostics)))
            else:
                reduced_ask = None
                if missing_clock and not fresh_positive:
                    status = V3EndOfDaySourceStatus.MISSING_SOURCE_CLOCK
                    reasons = ("SOURCE_EVENT_CLOCK_REQUIRED",)
                elif stale and not invalid:
                    status = V3EndOfDaySourceStatus.STALE_QUOTE
                    reasons = ("SOURCE_QUOTE_AGE_ABOVE_FIFTEEN_MINUTES",)
                elif invalid:
                    status = V3EndOfDaySourceStatus.INVALID_OR_MISSING_ASK
                    reasons = ("POSITIVE_ASK_REQUIRED",)
                else:
                    status = V3EndOfDaySourceStatus.INSUFFICIENT_SLOTS
                    reasons = ("QUALIFIED_FINAL_HOUR_SLOT_COUNT_BELOW_NINE",)
            diagnostics.append(
                V3EndOfDayDiagnostic(
                    analysis_unit_id=member.analysis_unit_id,
                    logical_source=source,
                    status=status,
                    supplied_slot_count=len(rows),
                    positive_fresh_slot_count=len(fresh_positive),
                    stale_slot_count=stale,
                    missing_source_clock_slot_count=missing_clock,
                    invalid_or_missing_ask_slot_count=invalid,
                    reduced_ask_atoms=reduced_ask,
                    reason_codes=reasons,
                    lineage_sha256=sha256_hex(
                        canonical_json_bytes(
                            {
                                "facts": [row.source_fact_sha256 for row in rows],
                                "identity_sha256": member.identity_sha256,
                                "source": source,
                                "status": status.value,
                            }
                        )
                    ),
                )
            )

    outputs: list[V3ReducedSourceAskFact] = []
    for entries in reduced_by_member.values():
        positive_prices = tuple(
            Decimal(fact.ask_atoms) for fact, _ in entries if fact.ask_atoms is not None and fact.ask_atoms > 0
        )
        incoherent = (
            len(positive_prices) >= 2
            and max(positive_prices) / min(positive_prices) > policy.maximum_cross_source_ratio
        )
        if incoherent:
            for _fact, diagnostic_index in entries:
                old = diagnostics[diagnostic_index]
                diagnostics[diagnostic_index] = replace(
                    old,
                    status=V3EndOfDaySourceStatus.CROSS_SOURCE_INCOHERENT,
                    reason_codes=("CROSS_SOURCE_RATIO_ABOVE_1000",),
                    lineage_sha256=sha256_hex(
                        canonical_json_bytes(
                            {"previous": old.lineage_sha256, "reason": "CROSS_SOURCE_RATIO_ABOVE_1000"}
                        )
                    ),
                )
            continue
        outputs.extend(fact for fact, _ in entries)
    outputs.sort(key=lambda row: (row.analysis_unit_id, row.logical_source))
    diagnostics.sort(key=lambda row: (row.analysis_unit_id, row.logical_source))
    input_snapshot = sha256_hex(
        canonical_json_bytes(
            {
                "membership_id": membership.membership_id,
                "membership_sha256": membership_sha256,
                "policy_sha256": policy.policy_sha256,
                "slot_projection_sha256": [row.normalized_manifest_sha256 for row in materialized],
            }
        )
    )
    return V3EndOfDayReduction(
        bucket_date=bucket_date,
        reduced_at=reduced_at,
        membership_id=membership.membership_id,
        membership_sha256=membership_sha256,
        input_snapshot_sha256=input_snapshot,
        policy_sha256=policy.policy_sha256,
        supplied_slot_count=len(materialized),
        source_facts=tuple(outputs),
        diagnostics=tuple(diagnostics),
    )


def _v3_eod_body(result: V3EndOfDayReduction) -> dict[str, Any]:
    return {
        "bucket_date": result.bucket_date.isoformat(),
        "diagnostics": [
            {
                "analysis_unit_id": row.analysis_unit_id,
                "invalid_or_missing_ask_slot_count": row.invalid_or_missing_ask_slot_count,
                "lineage_sha256": row.lineage_sha256,
                "logical_source": row.logical_source,
                "missing_source_clock_slot_count": row.missing_source_clock_slot_count,
                "positive_fresh_slot_count": row.positive_fresh_slot_count,
                "reason_codes": list(row.reason_codes),
                "reduced_ask_atoms": row.reduced_ask_atoms,
                "stale_slot_count": row.stale_slot_count,
                "status": row.status.value,
                "supplied_slot_count": row.supplied_slot_count,
            }
            for row in result.diagnostics
        ],
        "formal_state_eligible": False,
        "input_snapshot_sha256": result.input_snapshot_sha256,
        "membership_id": result.membership_id,
        "membership_sha256": result.membership_sha256,
        "policy_sha256": result.policy_sha256,
        "reduced_at": utc_timestamp_text(result.reduced_at),
        "schema": V3_EOD_REDUCTION_SCHEMA,
        "source_facts": [
            {
                "analysis_unit_id": row.analysis_unit_id,
                "ask_atoms": row.ask_atoms,
                "available_at": utc_timestamp_text(row.available_at),
                "bucket_date": row.bucket_date.isoformat(),
                "logical_source": row.logical_source,
                "source_fact_sha256": row.source_fact_sha256,
            }
            for row in result.source_facts
        ],
        "supplied_slot_count": result.supplied_slot_count,
        "usage_scope": V3_EOD_USAGE_SCOPE,
    }


def v3_end_of_day_reduction_document(result: V3EndOfDayReduction) -> dict[str, Any]:
    body = _v3_eod_body(result)
    return {**body, "reduction_id": result.reduction_id}


def load_v3_end_of_day_reduction(
    payload: bytes,
    *,
    expected_sha256: str,
    membership: TaxonomyMembershipV3,
    membership_sha256: str,
) -> V3EndOfDayReduction:
    """Load one sealed V3 EOD reduction without trusting its declared hashes."""

    expected_sha256 = _hash64(expected_sha256, "EOD_EXPECTED_SHA256")
    _require(sha256_hex(payload) == expected_sha256, "EOD_PAYLOAD_HASH_DRIFT")
    document = _strict_json(payload, "EOD_REDUCTION")
    _require(
        canonical_json_bytes(dict(document)) == payload,
        "EOD_REDUCTION_NON_CANONICAL_JSON",
    )
    _require(
        set(document)
        == {
            "bucket_date",
            "diagnostics",
            "formal_state_eligible",
            "input_snapshot_sha256",
            "membership_id",
            "membership_sha256",
            "policy_sha256",
            "reduced_at",
            "reduction_id",
            "schema",
            "source_facts",
            "supplied_slot_count",
            "usage_scope",
        },
        "EOD_REDUCTION_FIELD_SET_DRIFT",
    )
    membership_sha256 = _hash64(membership_sha256, "MEMBERSHIP_SHA256")
    _require(
        _membership_document_sha256(membership) == membership_sha256,
        "MEMBERSHIP_DOCUMENT_HASH_DRIFT",
    )
    _require(document.get("schema") == V3_EOD_REDUCTION_SCHEMA, "EOD_REDUCTION_SCHEMA_DRIFT")
    _require(document.get("usage_scope") == V3_EOD_USAGE_SCOPE, "EOD_USAGE_SCOPE_DRIFT")
    _require(document.get("formal_state_eligible") is False, "EOD_FORMAL_STATE_DRIFT")
    _require(document.get("membership_id") == membership.membership_id, "EOD_MEMBERSHIP_ID_DRIFT")
    _require(document.get("membership_sha256") == membership_sha256, "EOD_MEMBERSHIP_HASH_DRIFT")
    _require(
        document.get("policy_sha256")
        == FROZEN_END_OF_DAY_REDUCTION_POLICY_V1.policy_sha256,
        "EOD_POLICY_HASH_DRIFT",
    )
    bucket = _date_text(document.get("bucket_date"), "EOD_BUCKET_DATE")
    reduced_at = _utc_text(document.get("reduced_at"), "EOD_REDUCED_AT")
    _require(
        reduced_at
        >= datetime.combine(bucket + timedelta(days=1), time.min, tzinfo=UTC),
        "EOD_UTC_DAY_NOT_COMPLETE",
    )
    raw_facts = document.get("source_facts")
    raw_diagnostics = document.get("diagnostics")
    _require(isinstance(raw_facts, list), "EOD_SOURCE_FACTS_ARRAY_REQUIRED")
    _require(isinstance(raw_diagnostics, list), "EOD_DIAGNOSTICS_ARRAY_REQUIRED")
    members_by_id = {member.analysis_unit_id: member for member in membership.members}
    facts: list[V3ReducedSourceAskFact] = []
    for row in raw_facts:
        _require(isinstance(row, Mapping), "EOD_SOURCE_FACT_OBJECT_REQUIRED")
        _require(
            set(row)
            == {
                "analysis_unit_id",
                "ask_atoms",
                "available_at",
                "bucket_date",
                "logical_source",
                "source_fact_sha256",
            },
            "EOD_SOURCE_FACT_FIELD_SET_DRIFT",
        )
        unit = row.get("analysis_unit_id")
        source = row.get("logical_source")
        member = members_by_id.get(unit)
        _require(member is not None, "EOD_SOURCE_FACT_OUTSIDE_MEMBERSHIP")
        _require(source in member.source_ids_present, "EOD_SOURCE_FACT_UNBOUND_SOURCE")
        ask_atoms = row.get("ask_atoms")
        _require(type(ask_atoms) is int and ask_atoms > 0, "EOD_SOURCE_FACT_POSITIVE_ASK_REQUIRED")
        fact_bucket = _date_text(row.get("bucket_date"), "EOD_SOURCE_FACT_BUCKET_DATE")
        _require(fact_bucket == bucket, "EOD_SOURCE_FACT_BUCKET_DATE_DRIFT")
        available_at = _utc_text(row.get("available_at"), "EOD_SOURCE_FACT_AVAILABLE_AT")
        _require(available_at <= reduced_at, "EOD_SOURCE_FACT_FROM_FUTURE")
        facts.append(
            V3ReducedSourceAskFact(
                analysis_unit_id=str(unit),
                bucket_date=fact_bucket,
                logical_source=str(source),
                ask_atoms=ask_atoms,
                available_at=available_at,
                source_fact_sha256=_hash64(
                    row.get("source_fact_sha256"), "EOD_SOURCE_FACT_SHA256"
                ),
            )
        )
    diagnostics: list[V3EndOfDayDiagnostic] = []
    for row in raw_diagnostics:
        _require(isinstance(row, Mapping), "EOD_DIAGNOSTIC_OBJECT_REQUIRED")
        _require(
            set(row)
            == {
                "analysis_unit_id",
                "invalid_or_missing_ask_slot_count",
                "lineage_sha256",
                "logical_source",
                "missing_source_clock_slot_count",
                "positive_fresh_slot_count",
                "reason_codes",
                "reduced_ask_atoms",
                "stale_slot_count",
                "status",
                "supplied_slot_count",
            },
            "EOD_DIAGNOSTIC_FIELD_SET_DRIFT",
        )
        unit = row.get("analysis_unit_id")
        source = row.get("logical_source")
        _require(unit in members_by_id, "EOD_DIAGNOSTIC_OUTSIDE_MEMBERSHIP")
        _require(source in PROVIDER_IDS_V3, "EOD_DIAGNOSTIC_SOURCE_DRIFT")
        try:
            status = V3EndOfDaySourceStatus(row.get("status"))
        except ValueError as exc:
            raise MarketSectorEodV3Error("EOD_DIAGNOSTIC_STATUS_DRIFT") from exc
        count_fields = (
            "supplied_slot_count",
            "positive_fresh_slot_count",
            "stale_slot_count",
            "missing_source_clock_slot_count",
            "invalid_or_missing_ask_slot_count",
        )
        for field in count_fields:
            _require(
                type(row.get(field)) is int and 0 <= row[field] <= 12,
                f"EOD_DIAGNOSTIC_{field.upper()}",
            )
        reasons = row.get("reason_codes")
        _require(
            isinstance(reasons, list)
            and bool(reasons)
            and all(isinstance(value, str) and value for value in reasons),
            "EOD_DIAGNOSTIC_REASON_CODES",
        )
        reduced_ask = row.get("reduced_ask_atoms")
        _require(
            reduced_ask is None or (type(reduced_ask) is int and reduced_ask > 0),
            "EOD_DIAGNOSTIC_REDUCED_ASK",
        )
        diagnostics.append(
            V3EndOfDayDiagnostic(
                analysis_unit_id=str(unit),
                logical_source=str(source),
                status=status,
                supplied_slot_count=row["supplied_slot_count"],
                positive_fresh_slot_count=row["positive_fresh_slot_count"],
                stale_slot_count=row["stale_slot_count"],
                missing_source_clock_slot_count=row["missing_source_clock_slot_count"],
                invalid_or_missing_ask_slot_count=row["invalid_or_missing_ask_slot_count"],
                reduced_ask_atoms=reduced_ask,
                reason_codes=tuple(reasons),
                lineage_sha256=_hash64(
                    row.get("lineage_sha256"), "EOD_DIAGNOSTIC_LINEAGE_SHA256"
                ),
            )
        )
    result = V3EndOfDayReduction(
        bucket_date=bucket,
        reduced_at=reduced_at,
        membership_id=membership.membership_id,
        membership_sha256=membership_sha256,
        input_snapshot_sha256=_hash64(
            document.get("input_snapshot_sha256"), "EOD_INPUT_SNAPSHOT_SHA256"
        ),
        policy_sha256=str(document["policy_sha256"]),
        supplied_slot_count=document.get("supplied_slot_count"),
        source_facts=tuple(facts),
        diagnostics=tuple(diagnostics),
    )
    expected_diagnostic_keys = {
        (member.analysis_unit_id, source)
        for member in membership.members
        for source in PROVIDER_IDS_V3
    }
    actual_diagnostic_keys = {
        (row.analysis_unit_id, row.logical_source) for row in result.diagnostics
    }
    _require(actual_diagnostic_keys == expected_diagnostic_keys, "EOD_DIAGNOSTIC_COVERAGE_DRIFT")
    fact_keys = {(row.analysis_unit_id, row.logical_source) for row in result.source_facts}
    qualified_keys = {
        (row.analysis_unit_id, row.logical_source)
        for row in result.diagnostics
        if row.status is V3EndOfDaySourceStatus.QUALIFIED
    }
    _require(fact_keys == qualified_keys, "EOD_QUALIFIED_FACT_SET_DRIFT")
    _require(
        v3_end_of_day_reduction_document(result) == dict(document),
        "EOD_REDUCTION_CONTENT_DRIFT",
    )
    return result


def seal_v3_end_of_day_reduction(path: Path, result: V3EndOfDayReduction) -> str:
    payload = canonical_json_bytes(v3_end_of_day_reduction_document(result))
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        _require(path.read_bytes() == payload, "IMMUTABLE_V3_EOD_REDUCTION_CONFLICT")
        return sha256_hex(payload)
    try:
        with path.open("xb") as handle:
            handle.write(payload)
            handle.flush()
    except FileExistsError:
        _require(path.read_bytes() == payload, "IMMUTABLE_V3_EOD_REDUCTION_CONFLICT")
    return sha256_hex(payload)


__all__ = [
    "MarketSectorEodV3Error",
    "V3EndOfDayDiagnostic",
    "V3EndOfDayReduction",
    "V3EndOfDaySourceStatus",
    "V3LatestSlotNormalizer",
    "V3SlotProjection",
    "V3SlotSourceAskFact",
    "V3_EOD_REDUCTION_SCHEMA",
    "V3_EOD_USAGE_SCOPE",
    "V3_SLOT_NORMALIZER_VERSION",
    "load_v3_end_of_day_reduction",
    "load_v3_slot_projection",
    "normalize_market_sector_v3_slot",
    "reduce_v3_end_of_day_source_asks",
    "seal_v3_end_of_day_reduction",
    "v3_end_of_day_reduction_document",
]
