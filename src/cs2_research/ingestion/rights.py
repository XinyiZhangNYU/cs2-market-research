from __future__ import annotations

import re
import uuid
from collections.abc import Iterable, Mapping
from datetime import datetime, timezone
from typing import Any

from cs2_research.canonical import canonical_json_bytes, sha256_hex

from .errors import PlanningDenied
from .models import (
    FixtureProvenance,
    RequestPlan,
    RetentionMode,
    RightsSnapshot,
)


_PLAN_NAMESPACE = uuid.UUID("d1184248-25ce-5fee-bae8-e246e48c5bb0")
_SOURCE_CODE = re.compile(r"^[a-z0-9_]+$")
_PERMISSION_STATES = {"ALLOW", "DENY", "UNKNOWN"}
_ITEM_KEY_KINDS = {"MARKET_HASH_NAME", "SOURCE_ITEM_ID", "OTHER", "NOT_APPLICABLE"}
_REQUEST_OPTION_NAME = re.compile(r"^[a-z][a-z0-9_]*$")
# Matched as substrings, not exact names: "app_key" alone would have let
# "api_key", "access_token" and "session_id" straight through. A legitimate
# option that happens to contain one of these should be renamed rather than
# have the guard loosened.
_CREDENTIAL_LIKE_OPTION_TOKENS = (
    "auth",
    "cert",
    "cookie",
    "credential",
    "key",
    "passwd",
    "password",
    "secret",
    "session",
    "sign",
    "token",
)


def _iso_utc(value: datetime) -> str:
    if value.tzinfo is None or value.utcoffset() is None:
        raise PlanningDenied("planned_for must include a UTC offset")
    if value.utcoffset().total_seconds() != 0:
        raise PlanningDenied("planned_for must use UTC")
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _check_rights_time(rights: RightsSnapshot, planned_for: datetime) -> None:
    if rights.effective_from is not None:
        if rights.effective_from.tzinfo is None or rights.effective_from.utcoffset() is None:
            raise PlanningDenied("rights effective_from must include a UTC offset")
        if rights.effective_from.utcoffset().total_seconds() != 0:
            raise PlanningDenied("rights effective_from must use UTC")
    if rights.valid_to is not None:
        if rights.valid_to.tzinfo is None or rights.valid_to.utcoffset() is None:
            raise PlanningDenied("rights valid_to must include a UTC offset")
        if rights.valid_to.utcoffset().total_seconds() != 0:
            raise PlanningDenied("rights valid_to must use UTC")
    if (
        rights.effective_from is not None
        and rights.valid_to is not None
        and rights.valid_to <= rights.effective_from
    ):
        raise PlanningDenied("rights valid_to must be later than effective_from")
    if rights.effective_from is not None and planned_for < rights.effective_from:
        raise PlanningDenied("rights version is not yet effective at planned_for")
    if rights.valid_to is not None:
        if planned_for >= rights.valid_to:
            raise PlanningDenied("rights version is no longer effective at planned_for")


def rights_snapshot_document(rights: RightsSnapshot) -> dict[str, str | None]:
    permission_fields = (
        "acquisition",
        "systematic_collection",
        "historical_backfill",
        "raw_storage",
        "normalized_storage",
        "internal_derivative_use",
        "derived_storage",
    )
    document: dict[str, str | None] = {"version_label": rights.version_label}
    for field in permission_fields:
        value = getattr(rights, field)
        if value not in _PERMISSION_STATES:
            raise PlanningDenied(f"rights {field} has an invalid permission state")
        document[field] = value
    document["effective_from"] = (
        _iso_utc(rights.effective_from) if rights.effective_from is not None else None
    )
    document["valid_to"] = _iso_utc(rights.valid_to) if rights.valid_to is not None else None
    return document


def _normalize_request_options(
    request_options: Mapping[str, str] | Iterable[tuple[str, str]],
) -> tuple[tuple[str, str], ...]:
    pairs = list(
        request_options.items()
        if isinstance(request_options, Mapping)
        else request_options
    )
    normalized: list[tuple[str, str]] = []
    seen: set[str] = set()
    for pair in pairs:
        if not isinstance(pair, tuple) or len(pair) != 2:
            raise PlanningDenied("request options must be name/value pairs")
        name, value = pair
        if not isinstance(name, str) or not _REQUEST_OPTION_NAME.fullmatch(name):
            raise PlanningDenied("request option name has an invalid format")
        if any(token in name for token in _CREDENTIAL_LIKE_OPTION_TOKENS):
            raise PlanningDenied("credentials are forbidden in request options")
        if name in seen:
            raise PlanningDenied("request option names must be unique")
        if (
            not isinstance(value, str)
            or not value
            or value != value.strip()
            or len(value) > 256
            or any(ord(character) < 0x20 for character in value)
        ):
            raise PlanningDenied("request option value has an invalid format")
        seen.add(name)
        normalized.append((name, value))
    return tuple(sorted(normalized))


def _canonical_plan_document(
    *,
    endpoint_code: str,
    endpoint_version: str,
    execution_mode: str,
    fixture: FixtureProvenance | None,
    item_manifest_hash: str,
    item_key_kind: str,
    network_allowed: bool,
    planned_iso: str,
    retention_mode: RetentionMode,
    rights_document: dict[str, str | None],
    source_code: str,
    user_authorization_ref: str | None,
    canonical_options: list[list[str]],
) -> dict[str, Any]:
    document: dict[str, Any] = {
        "endpoint_code": endpoint_code,
        "endpoint_version": endpoint_version,
        "execution_mode": execution_mode,
        "fixture_id": fixture.fixture_id if fixture is not None else None,
        "fixture_payload_sha256": (
            fixture.payload_sha256 if fixture is not None else None
        ),
        "item_manifest_hash": item_manifest_hash,
        "item_key_kind": item_key_kind,
        "network_allowed": network_allowed,
        "planned_for": planned_iso,
        "retention_mode": retention_mode,
        "rights_snapshot": rights_document,
        "source_code": source_code,
        "user_authorization_ref": user_authorization_ref,
    }
    # Absent options must not appear as an empty list: that would change the
    # hash of every plan built before request options existed.
    if canonical_options:
        document["request_options"] = canonical_options
    return document


def verify_plan_integrity(plan: RequestPlan) -> None:
    """Recompute a plan's hashes from its own fields and reject any mismatch.

    A transport that only compares hash-to-hash confirms the caller is
    self-consistent, not that the plan is the one the planner produced. This
    recomputes the whole chain — manifest, options, canonical document, plan id
    — so a hand-built or mutated plan cannot reach the network.
    """

    if plan.rights_snapshot.version_label != plan.rights_version_label:
        raise PlanningDenied("plan rights snapshot does not match its version label")

    ordered_items = sorted(plan.item_keys)
    if list(plan.item_keys) != ordered_items:
        raise PlanningDenied("plan item keys are not in canonical order")
    if plan.item_manifest_hash != sha256_hex(canonical_json_bytes(ordered_items)):
        raise PlanningDenied("plan item manifest hash does not match its item keys")

    canonical_options = [list(pair) for pair in plan.request_options]
    if plan.request_options_hash != sha256_hex(canonical_json_bytes(canonical_options)):
        raise PlanningDenied("plan request options hash does not match its options")

    expected_hash = sha256_hex(
        canonical_json_bytes(
            _canonical_plan_document(
                endpoint_code=plan.endpoint_code,
                endpoint_version=plan.endpoint_version,
                execution_mode=plan.execution_mode,
                fixture=plan.fixture,
                item_manifest_hash=plan.item_manifest_hash,
                item_key_kind=plan.item_key_kind,
                network_allowed=plan.network_allowed,
                planned_iso=_iso_utc(plan.planned_for),
                retention_mode=plan.retention_mode,
                rights_document=rights_snapshot_document(plan.rights_snapshot),
                source_code=plan.source_code,
                user_authorization_ref=plan.user_authorization_ref,
                canonical_options=canonical_options,
            )
        )
    )
    if plan.request_canonical_hash != expected_hash:
        raise PlanningDenied("plan canonical hash does not match its own fields")
    if plan.request_plan_id != str(uuid.uuid5(_PLAN_NAMESPACE, expected_hash)):
        raise PlanningDenied("plan id does not match its canonical hash")


class RequestPlanner:
    """Construct immutable plans only after the requested rights all resolve to ALLOW."""

    def plan(
        self,
        *,
        execution_mode: str,
        rights: RightsSnapshot,
        network_allowed: bool,
        fixture: FixtureProvenance | None = None,
        user_authorization_ref: str | None = None,
        source_code: str,
        endpoint_code: str,
        endpoint_version: str,
        planned_for: datetime | None = None,
        item_key_kind: str = "NOT_APPLICABLE",
        item_keys: Iterable[str] = (),
        request_options: Mapping[str, str] | Iterable[tuple[str, str]] = (),
        retention_mode: RetentionMode | None = None,
    ) -> RequestPlan:
        if not _SOURCE_CODE.fullmatch(source_code):
            raise PlanningDenied("source_code has an invalid format")
        if (
            not endpoint_code
            or not endpoint_code.strip()
            or not endpoint_version
            or not endpoint_version.strip()
            or not rights.version_label
            or not rights.version_label.strip()
        ):
            raise PlanningDenied(
                "endpoint_code, endpoint_version and rights version must be non-empty"
            )
        if planned_for is None:
            if execution_mode == "FIXTURE" and fixture is not None:
                planned_for = fixture.frozen_fetched_at
            else:
                raise PlanningDenied("real requests require explicit planned_for")
        planned_iso = _iso_utc(planned_for)
        planned_for = planned_for.astimezone(timezone.utc)
        _check_rights_time(rights, planned_for)
        rights_document = rights_snapshot_document(rights)

        raw_items = list(item_keys)
        if any(not isinstance(item, str) or not item.strip() for item in raw_items):
            raise PlanningDenied("item keys must be non-empty strings")
        ordered_items = sorted(raw_items)
        if len(set(ordered_items)) != len(ordered_items):
            raise PlanningDenied("item keys must be unique")
        if item_key_kind not in _ITEM_KEY_KINDS:
            raise PlanningDenied("item_key_kind is unsupported")
        if ordered_items and item_key_kind == "NOT_APPLICABLE":
            raise PlanningDenied("non-empty item keys require an explicit item_key_kind")
        if not ordered_items and item_key_kind != "NOT_APPLICABLE":
            raise PlanningDenied("empty item keys require item_key_kind=NOT_APPLICABLE")
        item_manifest_hash = sha256_hex(canonical_json_bytes(ordered_items))
        normalized_options = _normalize_request_options(request_options)
        canonical_options = [list(pair) for pair in normalized_options]
        request_options_hash = sha256_hex(canonical_json_bytes(canonical_options))

        if execution_mode == "FIXTURE":
            retention_mode = retention_mode or "SYNTHETIC_FIXTURE"
            if network_allowed:
                raise PlanningDenied("FIXTURE requires network_allowed=false")
            if user_authorization_ref is not None:
                raise PlanningDenied("FIXTURE cannot carry a real-request authorization")
            if fixture is None:
                raise PlanningDenied("FIXTURE requires frozen provenance")
            if fixture.fixture_kind != "SYNTHETIC_CONTRACT":
                raise PlanningDenied("FIXTURE accepts only SYNTHETIC_CONTRACT provenance")
            if fixture.contains_real_market_data:
                raise PlanningDenied("FIXTURE cannot contain real market data")
            try:
                uuid.UUID(fixture.fixture_id)
            except ValueError as exc:
                raise PlanningDenied("fixture_id must be a UUID") from exc
            if not re.fullmatch(r"[0-9a-f]{64}", fixture.payload_sha256):
                raise PlanningDenied("fixture payload hash must be lowercase SHA-256")
            _iso_utc(fixture.frozen_fetched_at)
            if retention_mode != "SYNTHETIC_FIXTURE":
                raise PlanningDenied("FIXTURE requires SYNTHETIC_FIXTURE retention")
        else:
            if execution_mode not in {"SAMPLE", "SYSTEMATIC", "BACKFILL"}:
                raise PlanningDenied(f"unsupported execution mode: {execution_mode}")
            if (
                not network_allowed
                or not user_authorization_ref
                or not user_authorization_ref.strip()
            ):
                raise PlanningDenied("real requests require network and explicit authorization")
            if fixture is not None:
                raise PlanningDenied("real requests cannot use fixture provenance")
            if rights.acquisition != "ALLOW":
                raise PlanningDenied("acquisition right is not ALLOW")
            if execution_mode in {"SYSTEMATIC", "BACKFILL"}:
                if rights.systematic_collection != "ALLOW":
                    raise PlanningDenied("systematic collection right is not ALLOW")
            if execution_mode == "BACKFILL" and rights.historical_backfill != "ALLOW":
                raise PlanningDenied("historical backfill right is not ALLOW")
            retention_mode = retention_mode or "EPHEMERAL_NORMALIZED"
            if retention_mode not in {"PERSISTED_RAW", "EPHEMERAL_NORMALIZED"}:
                raise PlanningDenied("real requests require a supported real-data retention")
            if rights.normalized_storage != "ALLOW":
                raise PlanningDenied("normalized storage right is not ALLOW")
            if retention_mode == "PERSISTED_RAW" and rights.raw_storage != "ALLOW":
                raise PlanningDenied("raw storage right is not ALLOW")

        canonical_document = _canonical_plan_document(
            endpoint_code=endpoint_code,
            endpoint_version=endpoint_version,
            execution_mode=execution_mode,
            fixture=fixture,
            item_manifest_hash=item_manifest_hash,
            item_key_kind=item_key_kind,
            network_allowed=network_allowed,
            planned_iso=planned_iso,
            retention_mode=retention_mode,
            rights_document=rights_document,
            source_code=source_code,
            user_authorization_ref=user_authorization_ref,
            canonical_options=canonical_options,
        )
        request_hash = sha256_hex(canonical_json_bytes(canonical_document))
        request_plan_id = str(uuid.uuid5(_PLAN_NAMESPACE, request_hash))
        return RequestPlan(
            execution_mode=execution_mode,  # type: ignore[arg-type]
            network_allowed=network_allowed,
            user_authorization_ref=user_authorization_ref,
            fixture=fixture,
            request_plan_id=request_plan_id,
            source_code=source_code,
            endpoint_code=endpoint_code,
            endpoint_version=endpoint_version,
            rights_version_label=rights.version_label,
            rights_snapshot=rights,
            planned_for=planned_for,
            item_key_kind=item_key_kind,
            item_keys=tuple(ordered_items),
            item_manifest_hash=item_manifest_hash,
            retention_mode=retention_mode,
            request_canonical_hash=request_hash,
            request_options=normalized_options,
            request_options_hash=request_options_hash,
        )


def plan_request(
    *,
    execution_mode: str,
    rights: RightsSnapshot,
    network_allowed: bool,
    fixture: FixtureProvenance | None = None,
    user_authorization_ref: str | None = None,
    source_code: str,
    endpoint_code: str,
    endpoint_version: str,
    planned_for: datetime | None = None,
    item_key_kind: str = "NOT_APPLICABLE",
    item_keys: Iterable[str] = (),
    request_options: Mapping[str, str] | Iterable[tuple[str, str]] = (),
    retention_mode: RetentionMode | None = None,
) -> RequestPlan:
    return RequestPlanner().plan(
        execution_mode=execution_mode,
        rights=rights,
        network_allowed=network_allowed,
        fixture=fixture,
        user_authorization_ref=user_authorization_ref,
        source_code=source_code,
        endpoint_code=endpoint_code,
        endpoint_version=endpoint_version,
        planned_for=planned_for,
        item_key_kind=item_key_kind,
        item_keys=item_keys,
        request_options=request_options,
        retention_mode=retention_mode,
    )


__all__ = [
    "PlanningDenied",
    "RequestPlanner",
    "plan_request",
    "rights_snapshot_document",
    "verify_plan_integrity",
]
