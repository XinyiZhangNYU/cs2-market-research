from __future__ import annotations

import html
import re
import unicodedata
from datetime import datetime, timezone
from html.parser import HTMLParser
from typing import Any
from urllib.parse import urlsplit

from cs2_research.canonical import CanonicalizationError, canonical_json_bytes

from .enums import (
    AnalysisInputStatus,
    IssueCode,
    IssueSeverity,
    RecordIdKind,
    SourceCode,
    TimestampKind,
)
from .models import (
    SOURCE_PARSER_VERSION,
    SOURCE_SCHEMA_ID,
    SOURCE_SCHEMA_VERSION,
    NormalizedNotice,
    NormalizedNoticeBatch,
    NormalizedRecordSlot,
    ParsedNoticeBatch,
    SourceIssue,
    normalized_content_sha256,
    source_notice_id,
    source_notice_version_id,
    thaw_json_value,
)
from .source import STEAM_APP_ID


_SUPPRESSED_HTML = frozenset(
    {"script", "style", "iframe", "object", "embed", "video", "audio", "svg", "canvas"}
)
_BLOCK_HTML = frozenset(
    {"address", "article", "aside", "blockquote", "div", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "main", "nav", "ol", "p", "pre", "section", "table", "tr", "ul"}
)
_BB_IMAGE = re.compile(r"\[img(?:=[^\]]*)?\].*?\[/img\]", re.IGNORECASE | re.DOTALL)
_BB_URL_NAMED = re.compile(r"\[url=[^\]]*\](.*?)\[/url\]", re.IGNORECASE | re.DOTALL)
_BB_URL = re.compile(r"\[url\](.*?)\[/url\]", re.IGNORECASE | re.DOTALL)
_BB_LIST_ITEM = re.compile(r"\[\*\]", re.IGNORECASE)
_BB_TAG = re.compile(r"\[/?[A-Za-z][^\]\r\n]{0,200}\]")


class _PlainTextHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.suppressed_stack: list[str] = []

    @property
    def suppressed(self) -> bool:
        return bool(self.suppressed_stack)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        lowered = tag.lower()
        if lowered in _SUPPRESSED_HTML:
            self.suppressed_stack.append(lowered)
            return
        if self.suppressed:
            return
        if lowered == "img":
            self.parts.append("\n[图片已省略]\n")
        elif lowered == "br" or lowered in _BLOCK_HTML:
            self.parts.append("\n")
        elif lowered == "li":
            self.parts.append("\n- ")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        lowered = tag.lower()
        if self.suppressed:
            return
        if lowered == "img":
            self.parts.append("\n[图片已省略]\n")
        elif lowered == "br" or lowered in _BLOCK_HTML:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        lowered = tag.lower()
        if self.suppressed:
            if lowered == self.suppressed_stack[-1]:
                self.suppressed_stack.pop()
            return
        if lowered in _BLOCK_HTML or lowered == "li":
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self.suppressed:
            self.parts.append(data)


def _normalize_lines(value: str) -> str:
    value = unicodedata.normalize("NFC", value.replace("\r\n", "\n").replace("\r", "\n"))
    lines = [re.sub(r"[\t\f\v ]+", " ", line).strip() for line in value.split("\n")]
    output: list[str] = []
    blank = False
    for line in lines:
        if line:
            output.append(line)
            blank = False
        elif output and not blank:
            output.append("")
            blank = True
    while output and not output[-1]:
        output.pop()
    return "\n".join(output)


def rich_text_to_plain_text(value: str) -> str:
    """Convert inert source markup to readable text without following any URL."""
    bb = _BB_IMAGE.sub("\n[图片已省略]\n", value)
    bb = _BB_URL_NAMED.sub(lambda match: match.group(1), bb)
    bb = _BB_URL.sub(lambda match: match.group(1), bb)
    bb = _BB_LIST_ITEM.sub("\n- ", bb)
    bb = _BB_TAG.sub("", bb)
    parser = _PlainTextHTMLParser()
    parser.feed(bb)
    parser.close()
    return _normalize_lines(html.unescape("".join(parser.parts)))


def _issue(
    code: IssueCode,
    severity: IssueSeverity,
    detail: str,
    ordinal: int,
    field_name: str | None = None,
) -> SourceIssue:
    return SourceIssue(code, severity, detail, ordinal, field_name)


def _required_string(
    member: dict[str, Any], field_name: str, ordinal: int, issues: list[SourceIssue]
) -> str | None:
    if field_name not in member:
        issues.append(_issue(IssueCode.REQUIRED_FIELD_MISSING, IssueSeverity.BLOCKING, "required field was absent", ordinal, field_name))
        return None
    value = member[field_name]
    if not isinstance(value, str):
        issues.append(_issue(IssueCode.FIELD_TYPE_INVALID, IssueSeverity.BLOCKING, "required field was not a string", ordinal, field_name))
        return None
    if not value.strip():
        issues.append(_issue(IssueCode.FIELD_TYPE_INVALID, IssueSeverity.BLOCKING, "required string was empty", ordinal, field_name))
        return None
    return value


def _optional_string(
    member: dict[str, Any], field_name: str | None, ordinal: int, issues: list[SourceIssue]
) -> str | None:
    if field_name is None or field_name not in member or member[field_name] is None:
        return None
    value = member[field_name]
    if not isinstance(value, str):
        issues.append(_issue(IssueCode.FIELD_TYPE_INVALID, IssueSeverity.WARNING, "optional field was not a string and was not projected", ordinal, field_name))
        return None
    normalized = _normalize_lines(value)
    return normalized or None


def _validated_url(value: str | None, ordinal: int, field_name: str | None, issues: list[SourceIssue]) -> str | None:
    if value is None:
        return None
    parts = urlsplit(value)
    if (
        parts.scheme.lower() not in {"http", "https"}
        or not parts.hostname
        or parts.username is not None
        or parts.password is not None
        or len(value) > 2048
        or any(ord(character) < 0x20 for character in value)
    ):
        issues.append(_issue(IssueCode.INVALID_URL, IssueSeverity.WARNING, "source URL failed passive validation and was not projected", ordinal, field_name))
        return None
    return value


def _record_id(member: dict[str, Any], batch: ParsedNoticeBatch, ordinal: int, issues: list[SourceIssue]) -> str | None:
    field_name = batch.contract.source_record_id_field
    if field_name not in member:
        issues.append(_issue(IssueCode.REQUIRED_FIELD_MISSING, IssueSeverity.BLOCKING, "stable source record id was absent", ordinal, field_name))
        return None
    value = member[field_name]
    if batch.contract.record_id_kind is RecordIdKind.STRING:
        if not isinstance(value, str) or not value.strip():
            issues.append(_issue(IssueCode.FIELD_TYPE_INVALID, IssueSeverity.BLOCKING, "stable source record id was not a non-empty string", ordinal, field_name))
            return None
        return value
    if isinstance(value, int) and not isinstance(value, bool) and value >= 0:
        return str(value)
    issues.append(_issue(IssueCode.FIELD_TYPE_INVALID, IssueSeverity.BLOCKING, "stable source record id was not a non-negative integer", ordinal, field_name))
    return None


def _published_at(member: dict[str, Any], batch: ParsedNoticeBatch, ordinal: int, issues: list[SourceIssue]) -> datetime | None:
    field_name = batch.contract.published_at_field
    if field_name not in member:
        issues.append(_issue(IssueCode.REQUIRED_FIELD_MISSING, IssueSeverity.BLOCKING, "official publication time was absent", ordinal, field_name))
        return None
    value = member[field_name]
    if batch.contract.timestamp_kind is not TimestampKind.UNIX_SECONDS:
        issues.append(_issue(IssueCode.INVALID_TIMESTAMP, IssueSeverity.BLOCKING, "timestamp contract kind was unsupported", ordinal, field_name))
        return None
    if not isinstance(value, int) or isinstance(value, bool) or value < 0:
        issues.append(_issue(IssueCode.INVALID_TIMESTAMP, IssueSeverity.BLOCKING, "publication time was not a non-negative integer Unix second", ordinal, field_name))
        return None
    try:
        return datetime.fromtimestamp(value, tz=timezone.utc)
    except (OverflowError, OSError, ValueError):
        issues.append(_issue(IssueCode.INVALID_TIMESTAMP, IssueSeverity.BLOCKING, "publication time was outside the supported UTC range", ordinal, field_name))
        return None


def normalize_notice_batch(
    batch: ParsedNoticeBatch,
    *,
    body_byte_limit: int = 256 * 1024,
    parser_version: str = SOURCE_PARSER_VERSION,
) -> NormalizedNoticeBatch:
    if body_byte_limit <= 0:
        raise ValueError("body_byte_limit must be positive")
    normalized_slots: list[NormalizedRecordSlot] = []
    known_fields = set(batch.contract.record_fields)
    for parsed_slot in batch.record_slots:
        ordinal = parsed_slot.member_ordinal
        issues = list(parsed_slot.issues)
        if parsed_slot.raw_member is None:
            normalized_slots.append(NormalizedRecordSlot(ordinal, None, tuple(issues)))
            continue
        member = thaw_json_value(parsed_slot.raw_member)
        assert isinstance(member, dict)
        record_id = _record_id(member, batch, ordinal, issues)
        published_at = _published_at(member, batch, ordinal, issues)

        app_field = batch.contract.app_id_field
        app_id = member.get(app_field)
        if app_field not in member:
            issues.append(_issue(IssueCode.REQUIRED_FIELD_MISSING, IssueSeverity.BLOCKING, "application id was absent", ordinal, app_field))
        elif not isinstance(app_id, int) or isinstance(app_id, bool):
            issues.append(_issue(IssueCode.FIELD_TYPE_INVALID, IssueSeverity.BLOCKING, "application id was not an integer", ordinal, app_field))
        elif app_id != STEAM_APP_ID:
            issues.append(_issue(IssueCode.APP_ID_MISMATCH, IssueSeverity.BLOCKING, "application id was not the frozen AppID 730", ordinal, app_field))

        raw_title = _required_string(member, batch.contract.title_field, ordinal, issues)
        title = rich_text_to_plain_text(raw_title) if raw_title is not None else ""
        if raw_title is not None and not title:
            issues.append(_issue(IssueCode.FIELD_TYPE_INVALID, IssueSeverity.BLOCKING, "title became empty after inert markup conversion", ordinal, batch.contract.title_field))

        body_field = batch.contract.body_field
        raw_body = member.get(body_field)
        if body_field not in member or not isinstance(raw_body, str):
            issues.append(_issue(IssueCode.BODY_UNAVAILABLE, IssueSeverity.WARNING, "body was absent or not a string; source metadata remains usable", ordinal, body_field))
            body = ""
            analysis_status = AnalysisInputStatus.BODY_UNAVAILABLE
        else:
            body = rich_text_to_plain_text(raw_body)
            if not body:
                issues.append(_issue(IssueCode.BODY_UNAVAILABLE, IssueSeverity.WARNING, "body contained no usable text; source metadata remains usable", ordinal, body_field))
                analysis_status = AnalysisInputStatus.BODY_UNAVAILABLE
            elif len(body.encode("utf-8")) > body_byte_limit:
                issues.append(_issue(IssueCode.BLOCKED_INPUT_TOO_LARGE, IssueSeverity.WARNING, "full normalized body exceeded the evaluator input limit and was not truncated", ordinal, body_field))
                analysis_status = AnalysisInputStatus.BLOCKED_INPUT_TOO_LARGE
            else:
                analysis_status = AnalysisInputStatus.ELIGIBLE

        official_url = _validated_url(
            _optional_string(member, batch.contract.official_url_field, ordinal, issues),
            ordinal,
            batch.contract.official_url_field,
            issues,
        )
        feed_name = _optional_string(member, batch.contract.feed_name_field, ordinal, issues)
        feed_label = _optional_string(member, batch.contract.feed_label_field, ordinal, issues)
        author = _optional_string(member, batch.contract.author_field, ordinal, issues)
        source_extra = {key: value for key, value in member.items() if key not in known_fields}
        try:
            canonical_json_bytes(source_extra)
        except CanonicalizationError:
            issues.append(_issue(IssueCode.SOURCE_EXTRA_NOT_CANONICAL, IssueSeverity.BLOCKING, "unknown fields could not be preserved in canonical JSON", ordinal))

        if any(issue.severity is IssueSeverity.BLOCKING for issue in issues):
            normalized_slots.append(NormalizedRecordSlot(ordinal, None, tuple(issues)))
            continue
        assert record_id is not None and published_at is not None and app_id == STEAM_APP_ID
        notice_id = source_notice_id(SourceCode.STEAM_ISTEAMNEWS_V2, STEAM_APP_ID, record_id)
        content_document = {
            "analysis_input_status": analysis_status.value,
            "app_id": STEAM_APP_ID,
            "author_text": author,
            "feed_label": feed_label,
            "feed_name": feed_name,
            "normalized_body_text": body,
            "official_published_at": published_at.strftime("%Y-%m-%dT%H:%M:%S.000000Z"),
            "official_url": official_url,
            "parser_version": parser_version,
            "schema_id": SOURCE_SCHEMA_ID,
            "schema_version": SOURCE_SCHEMA_VERSION,
            "source_code": SourceCode.STEAM_ISTEAMNEWS_V2.value,
            "source_extra": source_extra,
            "source_notice_id": notice_id,
            "source_record_id": record_id,
            "title": title,
        }
        content_hash = normalized_content_sha256(content_document)
        notice = NormalizedNotice(
            source_notice_id=notice_id,
            source_notice_version_id=source_notice_version_id(notice_id, content_hash),
            event_id=notice_id,
            source_code=SourceCode.STEAM_ISTEAMNEWS_V2,
            app_id=STEAM_APP_ID,
            source_record_id=record_id,
            official_published_at=published_at,
            first_observed_at=batch.envelope.fetched_at,
            title=title,
            official_url=official_url,
            feed_name=feed_name,
            feed_label=feed_label,
            author_text=author,
            normalized_body_text=body,
            source_extra=source_extra,
            parser_version=parser_version,
            raw_response_sha256=batch.envelope.payload_sha256,
            normalized_notice_sha256=content_hash,
            analysis_input_status=analysis_status,
        )
        if notice.content_document() != content_document:
            raise AssertionError("normalized notice content hash document drifted")
        normalized_slots.append(NormalizedRecordSlot(ordinal, notice, tuple(issues)))
    return NormalizedNoticeBatch(batch, tuple(normalized_slots))


__all__ = ["normalize_notice_batch", "rich_text_to_plain_text"]
