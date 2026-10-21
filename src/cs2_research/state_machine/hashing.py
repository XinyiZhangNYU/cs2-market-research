"""Canonical serialization and deterministic content identifiers."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from dataclasses import fields, is_dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal
from enum import Enum
from math import isfinite
from typing import Any, Iterator
from uuid import UUID


CANONICAL_HASH_SCHEMA_VERSION = "typed-canonical-v1"


def _type_name(value: Any) -> str:
    cls = value if isinstance(value, type) else type(value)
    return f"{cls.__module__}.{cls.__qualname__}"


def _sort_key(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def _canonical(value: Any) -> Any:
    """Return a type-preserving JSON value.

    Every node is tagged.  This deliberately changes all pre-persistence
    hashes: Decimal("1.5"), "1.5", and 1.5 must never share an identifier.
    Container and dataclass types are tagged too, so equal-looking payloads at
    different contract boundaries cannot collapse onto one content id.
    """

    if is_dataclass(value):
        return [
            "dataclass",
            _type_name(value),
            [
                [field.name, _canonical(getattr(value, field.name))]
                for field in fields(value)
                if not field.name.startswith("_")
            ],
        ]
    if isinstance(value, Enum):
        return ["enum", _type_name(value), _canonical(value.value)]
    if isinstance(value, Decimal):
        if not value.is_finite():
            raise ValueError("non-finite decimals cannot be canonically hashed")
        sign, digits, exponent = value.as_tuple()
        if not any(digits):
            return ["decimal", 0, "0", 0]
        canonical_digits = list(digits)
        while canonical_digits[-1] == 0:
            canonical_digits.pop()
            exponent += 1
        return [
            "decimal",
            sign,
            "".join(str(digit) for digit in canonical_digits),
            exponent,
        ]
    if isinstance(value, datetime):
        return ["datetime", value.isoformat(timespec="microseconds")]
    if isinstance(value, date):
        return ["date", value.isoformat()]
    if isinstance(value, timedelta):
        return ["timedelta", value.days, value.seconds, value.microseconds]
    if isinstance(value, UUID):
        return ["uuid", str(value)]
    if isinstance(value, Mapping):
        pairs = [[_canonical(key), _canonical(item)] for key, item in value.items()]
        pairs.sort(key=lambda pair: _sort_key(pair[0]))
        return ["mapping", _type_name(value), pairs]
    if isinstance(value, set):
        canonical_items = sorted((_canonical(item) for item in value), key=_sort_key)
        return ["set", canonical_items]
    if isinstance(value, frozenset):
        canonical_items = sorted((_canonical(item) for item in value), key=_sort_key)
        return ["frozenset", canonical_items]
    if isinstance(value, tuple):
        return ["tuple", [_canonical(item) for item in value]]
    if isinstance(value, list):
        return ["list", [_canonical(item) for item in value]]
    if isinstance(value, float):
        if not isfinite(value):
            raise ValueError("non-finite floats cannot be canonically hashed")
        normalized = 0.0 if value == 0.0 else value
        return ["float", repr(normalized)]
    if value is None:
        return ["none"]
    if isinstance(value, bool):
        return ["bool", value]
    if isinstance(value, int):
        return ["int", str(value)]
    if isinstance(value, str):
        return ["str", value]
    raise TypeError(f"unsupported canonical value: {type(value)!r}")


def canonical_json(value: Any) -> str:
    """Return stable JSON bytes-as-text for a supported value."""

    return json.dumps(
        ["hash-schema", CANONICAL_HASH_SCHEMA_VERSION, _canonical(value)],
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def _json_text(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def _iter_canonical(value: Any) -> Iterator[str]:
    """Yield the exact JSON representation produced by ``_canonical``.

    The public canonical document is intentionally unchanged.  This iterator
    exists so large dataclass/tuple trees can be hashed without first retaining
    both a second object graph and one giant JSON string in memory.
    """

    if is_dataclass(value):
        yield '["dataclass",'
        yield _json_text(_type_name(value))
        yield ",["
        first = True
        for field in fields(value):
            if field.name.startswith("_"):
                continue
            if not first:
                yield ","
            first = False
            yield "["
            yield _json_text(field.name)
            yield ","
            yield from _iter_canonical(getattr(value, field.name))
            yield "]"
        yield "]]"
        return
    if isinstance(value, Enum):
        yield '["enum",'
        yield _json_text(_type_name(value))
        yield ","
        yield from _iter_canonical(value.value)
        yield "]"
        return
    if isinstance(value, Decimal):
        if not value.is_finite():
            raise ValueError("non-finite decimals cannot be canonically hashed")
        sign, digits, exponent = value.as_tuple()
        if not any(digits):
            yield '["decimal",0,"0",0]'
            return
        canonical_digits = list(digits)
        while canonical_digits[-1] == 0:
            canonical_digits.pop()
            exponent += 1
        yield '["decimal",'
        yield str(sign)
        yield ","
        yield _json_text("".join(str(digit) for digit in canonical_digits))
        yield ","
        yield str(exponent)
        yield "]"
        return
    if isinstance(value, datetime):
        yield '["datetime",'
        yield _json_text(value.isoformat(timespec="microseconds"))
        yield "]"
        return
    if isinstance(value, date):
        yield '["date",'
        yield _json_text(value.isoformat())
        yield "]"
        return
    if isinstance(value, timedelta):
        yield '["timedelta",'
        yield str(value.days)
        yield ","
        yield str(value.seconds)
        yield ","
        yield str(value.microseconds)
        yield "]"
        return
    if isinstance(value, UUID):
        yield '["uuid",'
        yield _json_text(str(value))
        yield "]"
        return
    if isinstance(value, Mapping):
        pairs = [(_sort_key(_canonical(key)), item) for key, item in value.items()]
        pairs.sort(key=lambda pair: pair[0])
        yield '["mapping",'
        yield _json_text(_type_name(value))
        yield ",["
        for ordinal, (key_json, item) in enumerate(pairs):
            if ordinal:
                yield ","
            yield "["
            yield key_json
            yield ","
            yield from _iter_canonical(item)
            yield "]"
        yield "]]"
        return
    if isinstance(value, set):
        canonical_items = sorted(
            (_sort_key(_canonical(item)) for item in value)
        )
        yield '["set",['
        yield ",".join(canonical_items)
        yield "]]"
        return
    if isinstance(value, frozenset):
        canonical_items = sorted(
            (_sort_key(_canonical(item)) for item in value)
        )
        yield '["frozenset",['
        yield ",".join(canonical_items)
        yield "]]"
        return
    if isinstance(value, tuple):
        yield '["tuple",['
        for ordinal, item in enumerate(value):
            if ordinal:
                yield ","
            yield from _iter_canonical(item)
        yield "]]"
        return
    if isinstance(value, list):
        yield '["list",['
        for ordinal, item in enumerate(value):
            if ordinal:
                yield ","
            yield from _iter_canonical(item)
        yield "]]"
        return
    if isinstance(value, float):
        if not isfinite(value):
            raise ValueError("non-finite floats cannot be canonically hashed")
        normalized = 0.0 if value == 0.0 else value
        yield '["float",'
        yield _json_text(repr(normalized))
        yield "]"
        return
    if value is None:
        yield '["none"]'
        return
    if isinstance(value, bool):
        yield '["bool",'
        yield "true" if value else "false"
        yield "]"
        return
    if isinstance(value, int):
        yield '["int",'
        yield _json_text(str(value))
        yield "]"
        return
    if isinstance(value, str):
        yield '["str",'
        yield _json_text(value)
        yield "]"
        return
    raise TypeError(f"unsupported canonical value: {type(value)!r}")


def _iter_canonical_document(value: Any) -> Iterator[str]:
    yield '["hash-schema",'
    yield _json_text(CANONICAL_HASH_SCHEMA_VERSION)
    yield ","
    yield from _iter_canonical(value)
    yield "]"


def stable_hash(value: Any) -> str:
    digest = hashlib.sha256()
    for chunk in _iter_canonical_document(value):
        digest.update(chunk.encode("utf-8"))
    return digest.hexdigest()


def content_id(prefix: str, value: Any) -> str:
    if not prefix or not prefix.replace("_", "").isalnum():
        raise ValueError("identifier prefix must be non-empty alphanumeric/underscore")
    return f"{prefix}_{stable_hash(value)[:24]}"
