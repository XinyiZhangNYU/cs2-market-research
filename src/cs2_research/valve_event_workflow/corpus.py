"""Versioned, sealed mechanism vocabulary for prospective input packs."""
from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime, timezone
from typing import Any

from cs2_research.canonical import canonical_json_bytes, sha256_hex


CORPUS_SCHEMA_ID = "valve-event-mechanism-corpus/v2"


def utc(value: Any, name: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError(f"{name} must be a UTC timestamp")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None or parsed.utcoffset() != timezone.utc.utcoffset(parsed):
        raise ValueError(f"{name} must use UTC")
    return parsed


def digest(value: Any, name: str) -> str:
    if not isinstance(value, str) or len(value) != 64 or set(value) - set("0123456789abcdef"):
        raise ValueError(f"{name} must be a lowercase SHA-256")
    return value


def validate_corpus(document: Mapping[str, Any]) -> tuple[str, ...]:
    fields = {
        "schema_id", "corpus_release_id", "knowledge_cutoff_at", "sealed_at",
        "vocabulary_version", "mechanism_codes", "selected_passages", "rights_snapshot_id",
        "build_tool_version", "excluded_documents", "human_seal",
    }
    if set(document) != fields or document["schema_id"] != CORPUS_SCHEMA_ID:
        raise ValueError("mechanism corpus V2 fields or schema differ from the contract")
    digest(document["corpus_release_id"], "corpus_release_id")
    content = {key: value for key, value in document.items() if key != "corpus_release_id"}
    if sha256_hex(canonical_json_bytes(content)) != document["corpus_release_id"]:
        raise ValueError("mechanism corpus content does not match its release seal")
    if utc(document["knowledge_cutoff_at"], "knowledge cutoff") > utc(document["sealed_at"], "corpus seal"):
        raise ValueError("mechanism corpus knowledge cannot postdate its seal")
    for field in ("rights_snapshot_id", "vocabulary_version", "build_tool_version"):
        if not isinstance(document[field], str) or not document[field].strip():
            raise ValueError(f"mechanism corpus {field} is required")
    review = document["human_seal"]
    if not isinstance(review, Mapping) or set(review) != {"reviewer_ref","decision_ref","decided_at","review_content_sha256"}:
        raise ValueError("mechanism corpus requires an exact human seal decision")
    for field in ("reviewer_ref","decision_ref"):
        if not isinstance(review[field], str) or not review[field].strip():
            raise ValueError("human corpus reviewer and decision reference are required")
    reviewed_content = {key:value for key,value in document.items() if key not in {"corpus_release_id","sealed_at","human_seal"}}
    if review["review_content_sha256"] != sha256_hex(canonical_json_bytes(reviewed_content)):
        raise ValueError("human seal does not cover the exact corpus content and rights")
    if not utc(document["knowledge_cutoff_at"],"knowledge cutoff") <= utc(review["decided_at"],"human decision") <= utc(document["sealed_at"],"corpus seal"):
        raise ValueError("human corpus decision clock is inconsistent with knowledge and seal")
    excluded = document["excluded_documents"]
    if not isinstance(excluded,list) or any(
        not isinstance(member,Mapping) or set(member)!={"source_ref","reason"}
        or any(not isinstance(value,str) or not value.strip() for value in member.values()) for member in excluded
    ):
        raise ValueError("excluded corpus documents require source references and reasons")
    codes = document["mechanism_codes"]
    if (
        not isinstance(codes, list) or not codes
        or any(not isinstance(code, str) or not code.strip() or "\x00" in code for code in codes)
        or codes != sorted(set(codes))
    ):
        raise ValueError("mechanism codes must be nonempty unique sorted nonblank strings")
    passages = document["selected_passages"]
    if not isinstance(passages, list):
        raise ValueError("selected passages must be an array")
    covered: set[str] = set()
    passage_ids: set[str] = set()
    for passage in passages:
        if not isinstance(passage, Mapping) or set(passage) != {
            "passage_id", "mechanism_codes", "text", "source_ref", "source_sha256",
            "known_at", "rights_snapshot_id",
            "source_type", "text_sha256", "rights",
        }:
            raise ValueError("mechanism passage fields differ from the contract")
        for field in ("text", "source_ref", "rights_snapshot_id", "passage_id"):
            if not isinstance(passage[field], str) or not passage[field].strip():
                raise ValueError(f"mechanism passage {field} is required")
        if passage["passage_id"] in passage_ids:
            raise ValueError("mechanism passage identity is duplicated")
        passage_ids.add(passage["passage_id"])
        digest(passage["source_sha256"], "passage source hash")
        if passage["text_sha256"] != sha256_hex(passage["text"].encode("utf-8")):
            raise ValueError("normalized mechanism text differs from its hash")
        if not isinstance(passage["source_type"],str) or not passage["source_type"].strip():
            raise ValueError("mechanism source type is required")
        rights = passage["rights"]
        if not isinstance(rights,Mapping) or rights != {
            "acquisition":"ALLOW","raw_storage":"ALLOW","internal_derivative_use":"ALLOW","model_processing":"ALLOW",
        }:
            raise ValueError("mechanism source rights must allow acquisition, retention, derivation and model processing")
        if utc(passage["known_at"], "passage known_at") > utc(document["knowledge_cutoff_at"], "knowledge cutoff"):
            raise ValueError("mechanism passage was not known by the corpus cutoff")
        member_codes = passage["mechanism_codes"]
        if (
            not isinstance(member_codes, list) or not member_codes
            or any(not isinstance(code, str) for code in member_codes)
            or member_codes != sorted(set(member_codes))
            or not set(member_codes).issubset(codes)
        ):
            raise ValueError("mechanism passage has unfrozen codes")
        covered.update(member_codes)
    if covered != set(codes):
        raise ValueError("every mechanism code requires an attributed passage")
    return tuple(codes)
