from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from cs2_research.canonical import sha256_hex
from cs2_research.ingestion.models import FixtureProvenance, RequestPlan, RightsSnapshot
from cs2_research.ingestion.rights import RequestPlanner, verify_plan_integrity
from cs2_research.ingestion.transport import FetchedEnvelope, FixtureTransport

from .enums import IssueCode, IssueSeverity, RecordIdKind
from .models import (
    STEAM_NEWS_ENDPOINT_CODE,
    STEAM_NEWS_ENDPOINT_VERSION,
    ParsedNoticeBatch,
    ParsedRecordSlot,
    SourceIssue,
    SteamNewsResponseContract,
)


STEAM_NEWS_REQUEST_SOURCE_CODE = "steam_isteamnews_v2"
STEAM_APP_ID = 730
DEFAULT_SYNTHETIC_RESPONSE_BYTE_LIMIT = 8 * 1024 * 1024


class _DuplicateJsonKey(ValueError):
    def __init__(self, key: str) -> None:
        super().__init__(key)
        self.key = key


class _NonStandardJsonConstant(ValueError):
    pass


def _strict_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise _DuplicateJsonKey(key)
        result[key] = value
    return result


def _reject_constant(value: str) -> None:
    raise _NonStandardJsonConstant(value)


def synthetic_response_contract_v1() -> SteamNewsResponseContract:
    """Return a test-only shape. It is not evidence of Steam's real response schema."""
    from .enums import ContractQualification, TimestampKind

    return SteamNewsResponseContract(
        contract_id="synthetic-steam-news-response/v1",
        qualification=ContractQualification.SYNTHETIC_ONLY_UNQUALIFIED,
        records_path=("appnews", "newsitems"),
        source_record_id_field="gid",
        app_id_field="appid",
        published_at_field="date",
        title_field="title",
        body_field="contents",
        official_url_field="url",
        feed_name_field="feedname",
        feed_label_field="feedlabel",
        author_field="author",
        record_id_kind=RecordIdKind.STRING,
        timestamp_kind=TimestampKind.UNIX_SECONDS,
        top_level_allowlist=("appnews",),
    )


def build_synthetic_fixture_plan(
    *,
    payload: bytes,
    frozen_fetched_at: datetime,
    fixture_id: str | None = None,
    count: int,
    enddate_exclusive: int | None = None,
) -> tuple[RequestPlan, FixtureTransport]:
    """Build an admitted, deterministic, zero-network request for synthetic bytes."""
    if isinstance(count, bool) or count <= 0:
        raise ValueError("count must be a positive integer")
    if enddate_exclusive is not None and (
        isinstance(enddate_exclusive, bool) or enddate_exclusive < 0
    ):
        raise ValueError("enddate_exclusive must be a non-negative integer")
    payload_hash = sha256_hex(payload)
    provenance = FixtureProvenance(
        fixture_id=fixture_id
        or str(uuid.uuid5(uuid.NAMESPACE_URL, f"synthetic-steam-news|{payload_hash}")),
        fixture_kind="SYNTHETIC_CONTRACT",
        contains_real_market_data=False,
        payload_sha256=payload_hash,
        frozen_fetched_at=frozen_fetched_at,
    )
    options = {
        "appid": str(STEAM_APP_ID),
        "count": str(count),
        "maxlength": "0",
    }
    if enddate_exclusive is not None:
        options["enddate"] = str(enddate_exclusive)
    plan = RequestPlanner().plan(
        execution_mode="FIXTURE",
        rights=RightsSnapshot(version_label="synthetic-fixture-no-real-data"),
        network_allowed=False,
        fixture=provenance,
        source_code=STEAM_NEWS_REQUEST_SOURCE_CODE,
        endpoint_code=STEAM_NEWS_ENDPOINT_CODE,
        endpoint_version=STEAM_NEWS_ENDPOINT_VERSION,
        planned_for=frozen_fetched_at,
        item_key_kind="NOT_APPLICABLE",
        request_options=options,
        retention_mode="SYNTHETIC_FIXTURE",
    )
    return plan, FixtureTransport(payload=payload, provenance=provenance)


def _empty_batch(
    *,
    envelope: Any,
    contract: SteamNewsResponseContract,
    issue: SourceIssue,
) -> ParsedNoticeBatch:
    return ParsedNoticeBatch(
        envelope=envelope,
        contract=contract,
        record_slots=(),
        batch_issues=(issue,),
        returned_member_count=0,
        unconsumed_top_level_fields=(),
    )


def parse_steam_news_envelope(
    *,
    envelope: FetchedEnvelope,
    contract: SteamNewsResponseContract,
    response_byte_limit: int = DEFAULT_SYNTHETIC_RESPONSE_BYTE_LIMIT,
    response_label: str = "Steam news",
) -> ParsedNoticeBatch:
    """Strictly parse already-captured bytes while accounting for every member.

    Network admission remains the transport's responsibility.  Keeping parsing at
    the envelope boundary lets D4 replay immutable real bytes without installing a
    network path in the replay process.
    """
    if response_byte_limit <= 0:
        raise ValueError("response_byte_limit must be positive")
    if (
        envelope.source_code != STEAM_NEWS_REQUEST_SOURCE_CODE
        or envelope.endpoint_code != STEAM_NEWS_ENDPOINT_CODE
    ):
        raise ValueError("Steam news parser received an envelope for another source")
    if envelope.status_code != 200:
        return _empty_batch(
            envelope=envelope,
            contract=contract,
            issue=SourceIssue(
                IssueCode.HTTP_STATUS_UNEXPECTED,
                IssueSeverity.BLOCKING,
                f"{response_label} response status was {envelope.status_code}",
            ),
        )
    if envelope.content_type.lower() != "application/json":
        return _empty_batch(
            envelope=envelope,
            contract=contract,
            issue=SourceIssue(
                IssueCode.CONTENT_TYPE_INVALID,
                IssueSeverity.BLOCKING,
                f"{response_label} response content type was not application/json",
            ),
        )
    if len(envelope.payload) > response_byte_limit:
        return _empty_batch(
            envelope=envelope,
            contract=contract,
            issue=SourceIssue(
                IssueCode.RESPONSE_TOO_LARGE,
                IssueSeverity.BLOCKING,
                f"{response_label} response exceeded the configured byte limit",
            ),
        )
    try:
        text = envelope.payload.decode("utf-8", errors="strict")
    except UnicodeDecodeError:
        return _empty_batch(
            envelope=envelope,
            contract=contract,
            issue=SourceIssue(
                IssueCode.INVALID_UTF8,
                IssueSeverity.BLOCKING,
                f"{response_label} response was not strict UTF-8",
            ),
        )
    try:
        document = json.loads(
            text,
            object_pairs_hook=_strict_object,
            parse_constant=_reject_constant,
        )
    except _DuplicateJsonKey as exc:
        return _empty_batch(
            envelope=envelope,
            contract=contract,
            issue=SourceIssue(
                IssueCode.DUPLICATE_JSON_KEY,
                IssueSeverity.BLOCKING,
                f"duplicate JSON object key: {exc.key}",
            ),
        )
    except (json.JSONDecodeError, _NonStandardJsonConstant):
        return _empty_batch(
            envelope=envelope,
            contract=contract,
            issue=SourceIssue(
                IssueCode.INVALID_JSON,
                IssueSeverity.BLOCKING,
                f"{response_label} response was not strict JSON",
            ),
        )
    if not isinstance(document, dict):
        return _empty_batch(
            envelope=envelope,
            contract=contract,
            issue=SourceIssue(
                IssueCode.CONTRACT_MISMATCH,
                IssueSeverity.BLOCKING,
                "response root was not an object",
            ),
        )
    current: Any = document
    for path_member in contract.records_path:
        if not isinstance(current, dict) or path_member not in current:
            return _empty_batch(
                envelope=envelope,
                contract=contract,
                issue=SourceIssue(
                    IssueCode.CONTRACT_MISMATCH,
                    IssueSeverity.BLOCKING,
                    "configured record path was absent",
                    field_name=path_member,
                ),
            )
        current = current[path_member]
    if not isinstance(current, list):
        return _empty_batch(
            envelope=envelope,
            contract=contract,
            issue=SourceIssue(
                IssueCode.CONTRACT_MISMATCH,
                IssueSeverity.BLOCKING,
                "configured record path did not resolve to an array",
            ),
        )

    seen_record_ids: set[str] = set()
    slots: list[ParsedRecordSlot] = []
    for ordinal, member in enumerate(current):
        if not isinstance(member, dict):
            issue = SourceIssue(
                IssueCode.MEMBER_NOT_OBJECT,
                IssueSeverity.BLOCKING,
                "record array member was not an object",
                member_ordinal=ordinal,
            )
            slots.append(ParsedRecordSlot(ordinal, None, (issue,)))
            continue
        issues: list[SourceIssue] = []
        record_id = member.get(contract.source_record_id_field)
        record_id_text: str | None = None
        if contract.record_id_kind is RecordIdKind.STRING and isinstance(record_id, str):
            record_id_text = record_id
        elif (
            contract.record_id_kind is RecordIdKind.INTEGER_AS_STRING
            and isinstance(record_id, int)
            and not isinstance(record_id, bool)
        ):
            record_id_text = str(record_id)
        if record_id_text is not None and record_id_text in seen_record_ids:
            issues.append(
                SourceIssue(
                    IssueCode.DUPLICATE_SOURCE_RECORD_ID,
                    IssueSeverity.WARNING,
                    "source record id repeated within the response",
                    member_ordinal=ordinal,
                    field_name=contract.source_record_id_field,
                )
            )
        if record_id_text is not None:
            seen_record_ids.add(record_id_text)
        slots.append(ParsedRecordSlot(ordinal, member, tuple(issues)))

    allowed_top = set(contract.top_level_allowlist or (contract.records_path[0],))
    unconsumed_top = tuple(sorted(set(document) - allowed_top))
    return ParsedNoticeBatch(
        envelope=envelope,
        contract=contract,
        record_slots=tuple(slots),
        batch_issues=(),
        returned_member_count=len(current),
        unconsumed_top_level_fields=unconsumed_top,
    )


def parse_steam_news_fixture(
    *,
    plan: RequestPlan,
    transport: FixtureTransport,
    contract: SteamNewsResponseContract,
    response_byte_limit: int = DEFAULT_SYNTHETIC_RESPONSE_BYTE_LIMIT,
) -> ParsedNoticeBatch:
    """Fetch injected bytes and account for every member without any network path."""
    verify_plan_integrity(plan)
    if (
        plan.execution_mode != "FIXTURE"
        or plan.network_allowed
        or plan.source_code != STEAM_NEWS_REQUEST_SOURCE_CODE
        or plan.endpoint_code != STEAM_NEWS_ENDPOINT_CODE
        or plan.endpoint_version != STEAM_NEWS_ENDPOINT_VERSION
    ):
        raise ValueError("Steam news fixture parser requires the frozen zero-network plan")
    envelope = transport.fetch(plan)
    if envelope.network_request_count != 0 or envelope.transport_kind != "FIXTURE":
        raise ValueError("D1 source accepts only the zero-network fixture transport")
    return parse_steam_news_envelope(
        envelope=envelope,
        contract=contract,
        response_byte_limit=response_byte_limit,
        response_label="synthetic",
    )


@dataclass(frozen=True)
class SteamNewsFixtureCapture:
    plan: RequestPlan
    transport: FixtureTransport
    contract: SteamNewsResponseContract

    def run(self, *, response_byte_limit: int = DEFAULT_SYNTHETIC_RESPONSE_BYTE_LIMIT) -> ParsedNoticeBatch:
        return parse_steam_news_fixture(
            plan=self.plan,
            transport=self.transport,
            contract=self.contract,
            response_byte_limit=response_byte_limit,
        )


__all__ = [
    "DEFAULT_SYNTHETIC_RESPONSE_BYTE_LIMIT",
    "STEAM_APP_ID",
    "STEAM_NEWS_REQUEST_SOURCE_CODE",
    "SteamNewsFixtureCapture",
    "build_synthetic_fixture_plan",
    "parse_steam_news_envelope",
    "parse_steam_news_fixture",
    "synthetic_response_contract_v1",
]
