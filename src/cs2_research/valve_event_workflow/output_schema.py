from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from jsonschema import Draft202012Validator

from cs2_research.canonical import sha256_hex


ASSESSMENT_V1_SCHEMA_SHA256 = "12cdddd3bc6bd66fd3502669434470be6d7db524ebdda18e27693a0c5f44b374"
ASSESSMENT_V2_SCHEMA_SHA256 = "d965c268cbb04a886a891175104e6ebaf22b5dbed70533d6e849bb6cb037e319"
ASSESSMENT_V3_SCHEMA_SHA256 = "d205e9d89a80cce0e75fccb27b1f2f8120a8ccb3175d8c708b7502b6e88ed04b"


@lru_cache(maxsize=1)
def assessment_v1_validator() -> Draft202012Validator:
    """Load the original frozen output contract, rejecting missing or changed bytes."""
    schema_path = Path(__file__).resolve().parents[3] / "schemas" / "valve-event-assessment-v1.schema.json"
    schema_bytes = schema_path.read_bytes()
    if sha256_hex(schema_bytes) != ASSESSMENT_V1_SCHEMA_SHA256:
        raise ValueError("frozen assessment v1 output schema hash mismatch")
    schema = json.loads(schema_bytes)
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


@lru_cache(maxsize=1)
def assessment_v2_validator() -> Draft202012Validator:
    schema_path = Path(__file__).resolve().parents[3] / "schemas" / "valve-event-assessment-v2.schema.json"
    schema_bytes = schema_path.read_bytes()
    if sha256_hex(schema_bytes) != ASSESSMENT_V2_SCHEMA_SHA256:
        raise ValueError("frozen assessment v2 output schema hash mismatch")
    schema = json.loads(schema_bytes)
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


@lru_cache(maxsize=1)
def assessment_v3_validator() -> Draft202012Validator:
    schema_path = Path(__file__).resolve().parents[3] / "schemas" / "valve-event-assessment-v3.schema.json"
    schema_bytes = schema_path.read_bytes()
    if sha256_hex(schema_bytes) != ASSESSMENT_V3_SCHEMA_SHA256:
        raise ValueError("assessment v3 output schema hash mismatch")
    schema = json.loads(schema_bytes)
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)
