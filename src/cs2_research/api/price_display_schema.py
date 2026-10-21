"""Local-only shared Schema loading and strict JSON decoding for price V1."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker

from cs2_research.canonical import canonical_json_bytes
from cs2_research.fx.price_display import PriceValueError


PRICE_API_CODE = "price-display-api"
PRICE_API_VERSION = "v1"
PRICE_POLICY_VERSION = "price-display-read/1"
MAX_DOCUMENT_BYTES = 8 * 1024 * 1024
SCHEMA_PATH = Path(__file__).resolve().parents[3] / "schemas/price-display-api.v1.schema.json"


def _pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise PriceValueError("DUPLICATE_JSON_KEY")
        result[key] = value
    return result


def _non_json_number(value: str) -> None:
    raise PriceValueError("INVALID_JSON_NUMBER")


def strict_json_document(payload: bytes | str) -> dict[str, Any]:
    if not isinstance(payload, (bytes, str)):
        raise PriceValueError("INVALID_JSON")
    try:
        raw = payload.encode("utf-8") if isinstance(payload, str) else payload
        if len(raw) > MAX_DOCUMENT_BYTES:
            raise PriceValueError("DOCUMENT_TOO_LARGE")
        document = json.loads(
            raw.decode("utf-8"), object_pairs_hook=_pairs,
            parse_constant=_non_json_number, parse_float=_non_json_number,
        )
        if not isinstance(document, dict):
            raise PriceValueError("INVALID_JSON_OBJECT")
        # Also refuses escaped lone surrogates and unsupported numeric values.
        canonical_json_bytes(document)
        return document
    except PriceValueError:
        raise
    except (UnicodeError, ValueError, RecursionError):
        raise PriceValueError("INVALID_JSON") from None


@lru_cache(maxsize=1)
def _schema() -> dict[str, Any]:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    # The price schema is self-contained. Loading a schema never resolves an
    # external HTTP ref, including when called by a future installed adapter.
    def check(value: Any) -> None:
        if isinstance(value, dict):
            if "$ref" in value and not value["$ref"].startswith("#/$defs/"):
                raise PriceValueError("EXTERNAL_SCHEMA_REFERENCE")
            for member in value.values():
                check(member)
        elif isinstance(value, list):
            for member in value:
                check(member)
    check(schema)
    return schema


@lru_cache(maxsize=16)
def _validator(definition: str | None) -> Draft202012Validator:
    schema = _schema()
    if definition is not None:
        if definition not in schema["$defs"]:
            raise PriceValueError("UNKNOWN_SCHEMA_DEFINITION")
        schema = {"$schema": schema["$schema"], "$defs": schema["$defs"], "$ref": f"#/$defs/{definition}"}
    return Draft202012Validator(schema, format_checker=FormatChecker())


def validate_shape(document: object, definition: str | None = None) -> None:
    try:
        raw = canonical_json_bytes(document)
    except (ValueError, TypeError, UnicodeError, RecursionError):
        raise PriceValueError("INVALID_JSON_VALUE") from None
    if len(raw) > MAX_DOCUMENT_BYTES:
        raise PriceValueError("DOCUMENT_TOO_LARGE")
    if not _validator(definition).is_valid(document):
        # Do not reflect a private field/value from a malformed input.
        raise PriceValueError("SCHEMA")
