from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, localcontext
from typing import Any, Iterable, Mapping, Sequence


class CanonicalizationError(ValueError):
    """Raised when a value cannot enter the project's canonical JSON layer."""


_FIELD_NAME = re.compile(r"^[a-z][a-z0-9_]*$")
_TYPE_TAG = re.compile(r"^[a-z][a-z0-9_-]*$")
_NAMESPACE = re.compile(r"^[a-z0-9][a-z0-9_.-]*$")
_DECIMAL_SCALE_8 = Decimal("0.00000001")


def _validate_json_value(value: Any, path: str = "$") -> None:
    if value is None or isinstance(value, (str, bool, int)):
        return
    if isinstance(value, (float, Decimal)):
        raise CanonicalizationError(f"{path}: floats and Decimal values are forbidden")
    if isinstance(value, list):
        for index, member in enumerate(value):
            _validate_json_value(member, f"{path}[{index}]")
        return
    if isinstance(value, dict):
        for key, member in value.items():
            if not isinstance(key, str):
                raise CanonicalizationError(f"{path}: object keys must be strings")
            _validate_json_value(member, f"{path}.{key}")
        return
    raise CanonicalizationError(f"{path}: unsupported value type {type(value).__name__}")


def canonical_json_bytes(value: Any) -> bytes:
    """Serialize canonical JSON as UTF-8 with exactly one trailing LF."""
    _validate_json_value(value)
    serialized = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    )
    return (serialized + "\n").encode("utf-8")


def sha256_hex(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def utc_timestamp_text(value: datetime) -> str:
    """Return the timestamp spelling shared by Python and PostgreSQL V0.4c."""
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise CanonicalizationError("timestamp must be timezone-aware")
    if value.utcoffset() != timezone.utc.utcoffset(value):
        raise CanonicalizationError("timestamp must use UTC")
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def decimal_38_8_text(value: Decimal) -> str:
    """Return the exact NUMERIC(38,8) spelling used by the database hash."""
    if not isinstance(value, Decimal) or not value.is_finite() or value < 0:
        raise CanonicalizationError("decimal must be finite and non-negative")
    integer_digits = 1 if value == 0 else max(value.adjusted() + 1, 0)
    if integer_digits > 30:
        raise CanonicalizationError("decimal exceeds NUMERIC(38,8) precision")
    try:
        with localcontext() as context:
            # NUMERIC(38,8) can contain 38 significant digits, while Python's
            # process-default Decimal context is commonly only 28 digits.
            context.prec = 50
            quantized = value.quantize(_DECIMAL_SCALE_8)
    except InvalidOperation as exc:
        raise CanonicalizationError("decimal cannot be represented as NUMERIC(38,8)") from exc
    if quantized != value:
        raise CanonicalizationError("decimal exceeds NUMERIC(38,8) scale")
    return format(quantized, ".8f")


def canonical_enum_map_text(value: Mapping[str, str]) -> str:
    """Length-prefix a string map so JSON formatting cannot alter record hashes."""
    lines: list[str] = []
    for key in sorted(value):
        member = value[key]
        if not isinstance(key, str) or not isinstance(member, str):
            raise CanonicalizationError("canonical enum maps require string keys and values")
        if "\x00" in key or "\x00" in member:
            raise CanonicalizationError("NUL is forbidden in canonical text")
        lines.append(
            f"{len(key.encode('utf-8'))}:{key}:{len(member.encode('utf-8'))}:{member}"
        )
    return "\n".join(lines)


def canonical_string_list_text(values: Sequence[str]) -> str:
    """Canonicalize a set-like list of source field names."""
    ordered = sorted(values)
    if len(set(ordered)) != len(ordered):
        raise CanonicalizationError("canonical string lists cannot contain duplicates")
    lines: list[str] = []
    for value in ordered:
        if not isinstance(value, str) or not value or "\x00" in value:
            raise CanonicalizationError(
                "canonical string lists require non-empty NUL-free strings"
            )
        lines.append(f"{len(value.encode('utf-8'))}:{value}")
    return "\n".join(lines)


def typed_field_line(name: str, type_tag: str, value_text: str | None) -> bytes:
    """Encode one explicitly typed field using UTF-8 byte lengths."""
    if not _FIELD_NAME.fullmatch(name):
        raise CanonicalizationError(f"invalid canonical field name: {name!r}")
    if not _TYPE_TAG.fullmatch(type_tag):
        raise CanonicalizationError(f"invalid canonical type tag: {type_tag!r}")
    if value_text is not None and (
        not isinstance(value_text, str) or "\x00" in value_text
    ):
        raise CanonicalizationError("canonical field values must be NUL-free text or None")
    name_length = len(name.encode("utf-8"))
    if value_text is None:
        return f"{name_length}:{name}:{type_tag}:N:\n".encode("utf-8")
    value_length = len(value_text.encode("utf-8"))
    return f"{name_length}:{name}:{type_tag}:V:{value_length}:{value_text}\n".encode(
        "utf-8"
    )


def typed_record_bytes(
    namespace: str, fields: Iterable[tuple[str, str, str | None]]
) -> bytes:
    """Encode a record with type tags that survive cross-language hashing."""
    if not _NAMESPACE.fullmatch(namespace):
        raise CanonicalizationError(f"invalid canonical namespace: {namespace!r}")
    payload = bytearray(f"{namespace}\n".encode("ascii"))
    seen: set[str] = set()
    for name, type_tag, value_text in fields:
        if name in seen:
            raise CanonicalizationError(f"duplicate canonical field: {name}")
        seen.add(name)
        payload.extend(typed_field_line(name, type_tag, value_text))
    return bytes(payload)


def typed_record_hash(
    namespace: str, fields: Iterable[tuple[str, str, str | None]]
) -> str:
    return sha256_hex(typed_record_bytes(namespace, fields))


def dataset_manifest_line(
    ordinal: int, source_item_id: str, normalized_member_hash: str
) -> str:
    if ordinal <= 0:
        raise ValueError("member ordinal must be positive")
    if len(normalized_member_hash) != 64:
        raise ValueError("member hash must be a 64-character SHA-256 hex digest")
    try:
        int(normalized_member_hash, 16)
    except ValueError as exc:
        raise ValueError("member hash must contain hexadecimal characters") from exc
    byte_length = len(source_item_id.encode("utf-8"))
    return f"{ordinal}:{byte_length}:{source_item_id}:{normalized_member_hash.lower()}"


def dataset_manifest_hash(
    members: Iterable[tuple[int, str, str]],
) -> str:
    ordered = sorted(members, key=lambda member: member[0])
    expected_ordinals = list(range(1, len(ordered) + 1))
    actual_ordinals = [member[0] for member in ordered]
    if actual_ordinals != expected_ordinals:
        raise ValueError("dataset member ordinals must be contiguous and start at 1")
    payload = "\n".join(
        dataset_manifest_line(ordinal, source_item_id, member_hash)
        for ordinal, source_item_id, member_hash in ordered
    ).encode("utf-8")
    return sha256_hex(payload)
