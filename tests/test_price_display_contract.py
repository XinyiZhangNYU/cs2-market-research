from __future__ import annotations

import base64
from copy import deepcopy
from datetime import UTC, datetime, timedelta
import json
import socket

import pytest

from cs2_research.api.price_display_contract import (
    decode_price_document, price_error_document, project_quote, seal_price_document,
    validate_quote,
)
from cs2_research.api.price_display_examples import (
    KNOWN_AT, MARKET_AS_OF, PUBLISHED_AT, SYNTHETIC_ITEM, SYNTHETIC_UNIT,
    build_price_display_examples, synthetic_fx, synthetic_quote, synthetic_snapshot,
)
from cs2_research.api.price_display_models import (
    PriceHistoryQuery, PriceItemQuery, PriceMemberBinding, PriceSnapshotQuery,
    analysis_unit_id, decode_analysis_unit_token, decode_history_cursor,
    encode_analysis_unit_token, encode_history_cursor, item_id,
    public_document_hash, public_quote_id, quote_order_key,
)
from cs2_research.api.price_display_schema import (
    MAX_DOCUMENT_BYTES, SCHEMA_PATH, strict_json_document, validate_shape,
)
from cs2_research.canonical import canonical_json_bytes, sha256_hex, utc_timestamp_text
from cs2_research.fx.price_display import BIGINT_MAX, NativePrice, PriceValueError
from cs2_research.fx.price_display_context import (
    FrozenHistoricalPrice, PriceFxSelection, public_rate_id,
)


@pytest.fixture(autouse=True)
def offline(monkeypatch):
    def reject(*args, **kwargs):
        raise AssertionError("price boundary tests may not access a network or database")
    monkeypatch.setattr(socket, "create_connection", reject)
    monkeypatch.setattr(socket.socket, "connect", reject)
    monkeypatch.setattr(socket.socket, "connect_ex", reject)
    import psycopg
    monkeypatch.setattr(psycopg, "connect", reject)


@pytest.fixture(scope="module")
def examples():
    return build_price_display_examples()


def rehash(document):
    # A valid hash never excuses invalid values or query/identity bindings.
    for row in document["items"]:
        if "quote_id" in row:
            row["quote_id"] = public_quote_id(row)
    document["document_hash"] = public_document_hash(document)
    return canonical_json_bytes(document)


def b64(raw):
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def projector_inputs(**overrides):
    values = dict(
        binding=PriceMemberBinding(SYNTHETIC_UNIT, SYNTHETIC_ITEM, PUBLISHED_AT),
        source={"quote_origin": "SOURCE_QUOTE", "logical_market": "market_a", "transport": "upstream"},
        quote_kind="ASK", source_price=NativePrice("10.00000000", "USD", "USD_DECIMAL", 8),
        source_price_reason=None, bucket_at="2026-08-28T12:00:00.000000Z",
        observed_at="2026-08-28T12:00:00.000000Z", source_updated_at=None,
        source_collected_at=None, source_available_at="2026-08-29T00:00:00.000000Z",
        published_at=PUBLISHED_AT, known_at=KNOWN_AT, kind="CURRENT",
        market_as_of=MARKET_AS_OF, current_slot_at=MARKET_AS_OF,
        fx_selection=PriceFxSelection(synthetic_fx("2026-08-28"), None),
    )
    values.update(overrides)
    return values


def test_synthetic_examples_are_reproducible_shared_bytes(examples):
    assert len(examples) == 18
    assert build_price_display_examples() == examples
    directory = SCHEMA_PATH.parent / "examples"
    paths = sorted(directory.glob("price-display-*.json"))
    assert {p.name for p in paths} == set(examples)
    for name, document in examples.items():
        raw = (directory / name).read_bytes()
        assert raw == (json.dumps(document, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")
        assert strict_json_document(raw) == document
        if name.endswith(".valid.json"):
            assert decode_price_document(raw) == document
        else:
            with pytest.raises(PriceValueError):
                decode_price_document(raw)


def test_synthetic_mixed_sources_native_zero_precision_and_late_binding(examples):
    item = examples["price-display-item.valid.json"]
    rows = item["items"]
    assert all(row["item_id"] == "9007199254740993" for row in rows)
    assert all(row["analysis_unit_id"] == SYNTHETIC_UNIT for row in rows)
    assert {row["source"]["logical_market"] for row in rows} == {"market_a", "market_c", "market_b"}
    assert {row["quote_kind"] for row in rows} == {"ASK", "BID"}
    native_cny = next(row for row in rows if row["source_price"] and row["source_price"]["currency"] == "CNY")
    assert native_cny["source_price"]["value"] == str(BIGINT_MAX)
    assert native_cny["amounts"]["CNY"]["amount"] == "92233720368547758.07"
    tiny = next(row for row in rows if row["source_price"] and row["source_price"]["value"] == "0.00000001")
    assert tiny["amounts"]["USD"]["amount"] == "0.00000001"
    assert tiny["amounts"]["CNY"]["rounding"] == "ROUNDED_TO_ZERO"
    assert rows[-1]["time_basis"] == "UNAVAILABLE"
    assert rows[-1]["source_price"]["value"] == "0.00000000"
    assert rows[-1]["amounts"]["USD"]["status"] == "AVAILABLE"
    assert rows[-1]["amounts"]["CNY"]["reason"] == "NO_ELIGIBLE_FX"
    assert all(row["source_price"]["upstream_fraction_digits"] is None for row in rows if row["source_price"])
    historical = examples["price-display-history-page-1.valid.json"]["items"][0]
    assert historical["late_bound"] is True
    assert historical["identity_policy"] == "CURRENT_EXACT_MHN_LATE_BIND_V1"
    assert historical["fx"]["conversion_policy_version"] == "ecb-eur-cross-daily/2"
    assert historical["amounts"]["USD"]["amount"] == "10.00000000"
    assert historical["amounts"]["CNY"]["amount"] == "67.20"


@pytest.mark.parametrize("value", [
    "a", SYNTHETIC_UNIT, "/", "\\", ".", "..", "%2F", "a/b\\c", " a ",
    "名字", "e\u0301", "é", "😀" * 256, "A" * 256,
])
def test_analysis_unit_tokens_are_exact_canonical_transport_not_paths(value):
    token = encode_analysis_unit_token(value)
    assert set(token) <= set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_")
    assert len(token) <= 1366
    assert decode_analysis_unit_token(token) == value
    assert encode_analysis_unit_token(decode_analysis_unit_token(token)) == token
    assert analysis_unit_id(value) == value


def test_no_unicode_normalization_or_second_url_decode():
    assert encode_analysis_unit_token("é") != encode_analysis_unit_token("e\u0301")
    assert encode_analysis_unit_token("A") != encode_analysis_unit_token("a")
    assert decode_analysis_unit_token(encode_analysis_unit_token("%2F")) == "%2F"
    assert decode_analysis_unit_token(encode_analysis_unit_token("..")) == ".."
    assert len(encode_analysis_unit_token("😀" * 256)) == 1366


@pytest.mark.parametrize("value", ["", "x" * 257, "😀" * 257, "\x00", "\x1f", "\x7f", "\ud800", "\udfff", 123, None])
def test_invalid_original_identifiers_rejected(value):
    with pytest.raises(PriceValueError, match="INVALID_ANALYSIS_UNIT_ID"):
        encode_analysis_unit_token(value)


@pytest.mark.parametrize("token", [
    "", "YQ=", "YQ==", "YR", "YS", "a", "_w", "wK8", "7aCA", "AA", "fQ\n",
    "%59Q", "YQ/", "YQ\\", "A" * 1367, b"YQ", None,
])
def test_noncanonical_or_invalid_utf8_tokens_rejected(token):
    with pytest.raises(PriceValueError, match="INVALID_ANALYSIS_UNIT_TOKEN"):
        decode_analysis_unit_token(token)


@pytest.mark.parametrize("value", ["1", "9007199254740993", str(BIGINT_MAX)])
def test_item_identity_is_nonlossy_positive_decimal_string(value):
    assert item_id(value) == value


@pytest.mark.parametrize("value", ["0", "01", "+1", "1.0", "1e1", "1\n", str(BIGINT_MAX + 1), 1, True])
def test_item_id_aliases_or_out_of_range_rejected(value):
    with pytest.raises(PriceValueError, match="INVALID_ITEM_ID"):
        item_id(value)


@pytest.mark.parametrize("payload,code", [
    (b'{"a":1,"a":2}', "DUPLICATE_JSON_KEY"),
    (b'{"a":{"b":1,"b":2}}', "DUPLICATE_JSON_KEY"),
    (b'{"a":1.0}', "INVALID_JSON_NUMBER"), (b'{"a":1e1}', "INVALID_JSON_NUMBER"),
    (b'{"a":NaN}', "INVALID_JSON_NUMBER"), (b'{"a":Infinity}', "INVALID_JSON_NUMBER"),
    (b'[]', "INVALID_JSON_OBJECT"), (b'{}{}', "INVALID_JSON"), (b'\xef\xbb\xbf{}', "INVALID_JSON"),
    (b'{"a":"\xff"}', "INVALID_JSON"), (b'{"a":"\\ud800"}', "INVALID_JSON"),
    (b'{', "INVALID_JSON"), (None, "INVALID_JSON"),
    (b'{"a":' + b'9' * 5000 + b'}', "INVALID_JSON"),
])
def test_strict_json_fails_with_controlled_nonreflective_code(payload, code):
    with pytest.raises(PriceValueError, match=code) as caught:
        strict_json_document(payload)
    assert str(caught.value) == code


def test_json_size_and_non_json_values_are_bounded():
    with pytest.raises(PriceValueError, match="DOCUMENT_TOO_LARGE"):
        strict_json_document(b" " * (MAX_DOCUMENT_BYTES + 1))
    with pytest.raises(PriceValueError, match="DOCUMENT_TOO_LARGE"):
        validate_shape({"oversized": "a" * MAX_DOCUMENT_BYTES})
    for doc in ({"a": 1.0}, {"a": float("nan")}, {"a": "\ud800"}, {1: "x"}):
        with pytest.raises(PriceValueError, match="INVALID_JSON_VALUE"):
            validate_shape(doc)


@pytest.mark.parametrize("field,value", [
    ("value", "-1.00000000"), ("value", "1e1"), ("value", 10), ("value", "10.00000000\n"),
    ("currency", "EUR"), ("unit", "CNY_MINOR_FX_DERIVED"),
    ("normalized_fraction_digits", 2), ("upstream_fraction_digits", -1),
    ("upstream_fraction_digits", 9007199254740992), ("upstream_fraction_digits", True),
    ("private_path", "sensitive-value-must-not-echo"),
])
def test_native_mutation_rejected_even_after_rehash(examples, field, value):
    bad = deepcopy(examples["price-display-item.valid.json"])
    bad["items"][0]["source_price"][field] = value
    with pytest.raises(PriceValueError) as caught:
        decode_price_document(rehash(bad))
    assert "sensitive-value" not in str(caught.value)


@pytest.mark.parametrize("currency,field,value", [
    ("USD", "amount", "9.99999999"), ("USD", "basis", "FX_DERIVED"),
    ("CNY", "amount", "0.01"), ("CNY", "currency", "USD"),
    ("CNY", "scale", 8), ("CNY", "rounding", "ROUNDED_TO_ZERO"),
    ("CNY", "amount", "92233720368547758.08"), ("USD", "rounding", "ROUNDED"),
])
def test_amount_semantics_not_only_hash(examples, currency, field, value):
    bad = deepcopy(examples["price-display-item.valid.json"])
    bad["items"][0]["amounts"][currency][field] = value
    with pytest.raises(PriceValueError):
        decode_price_document(rehash(bad))


@pytest.mark.parametrize("field,value", [
    ("cny_per_usd", "6.72000000"), ("cny_per_usd", "7.200000000000000000"),
    ("carry_days", 1), ("carry_days", 8), ("usage", "FUSION"),
    ("source_event_date", "2026-08-29"), ("authority", "WIDGET"),
    ("available_at", "2026-09-04T00:00:00.000000Z"),
    ("usd_valid_from", "2026-08-30T00:00:00.000000Z"),
    ("revision_hash", "a" * 64),
])
def test_fx_binding_rechecked_after_public_hash(examples, field, value):
    bad = deepcopy(examples["price-display-item.valid.json"])
    fx = bad["items"][0]["fx"]
    fx[field] = value
    fx["public_rate_id"] = public_rate_id(fx)
    with pytest.raises(PriceValueError):
        decode_price_document(rehash(bad))


@pytest.mark.parametrize("field,value", [
    ("time_basis", "OBSERVED_AT"), ("source_price_reason", "SOURCE_CONFLICT"),
    ("source_available_at", "2026-08-27T00:00:00.000000Z"),
    ("identity_available_at", "2026-09-04T00:00:00.000000Z"),
    ("source_updated_at", "2026-09-04T00:00:00.000000Z"),
    ("source_collected_at", "2026-09-04T00:00:00.000000Z"),
    ("available_at", "2026-09-02T23:59:59.999999Z"),
    ("available_at", "2026-09-03T00:00:00.000001Z"),
    ("analysis_unit_id", "different-unit"), ("item_id", "2"), ("late_bound", True),
])
def test_row_identity_and_all_knowledge_clocks_bound(examples, field, value):
    bad = deepcopy(examples["price-display-item.valid.json"])
    bad["items"][0][field] = value
    with pytest.raises(PriceValueError):
        decode_price_document(rehash(bad))


def test_bucket_then_observed_date_and_unknown_time_are_not_fabricated():
    both = project_quote(**projector_inputs())
    assert both["time_basis"] == "BUCKET_AT"
    observed = project_quote(**projector_inputs(bucket_at=None))
    assert observed["time_basis"] == "OBSERVED_AT"
    assert observed["bucket_at"] is None
    unknown = project_quote(**projector_inputs(bucket_at=None, observed_at=None, fx_selection=None))
    assert unknown["time_basis"] == "UNAVAILABLE" and unknown["fx"] is None
    assert unknown["amounts"]["USD"]["amount"] == "10.00000000"
    assert unknown["amounts"]["CNY"]["reason"] == "NO_ELIGIBLE_FX"
    for overrides in (
        dict(current_slot_at=None), dict(current_slot_at="2026-08-29T12:00:00.000000Z"),
        dict(kind="HISTORY", current_slot_at=None, bucket_at=None, observed_at=None, fx_selection=None),
        dict(bucket_at=None, observed_at=None),
        dict(bucket_at=None, observed_at=None, source_price=None, source_price_reason="SOURCE_UNAVAILABLE", fx_selection=None),
        dict(bucket_at=None, observed_at=None, fx_selection=PriceFxSelection(None, "FX_STALE")),
    ):
        with pytest.raises(PriceValueError):
            project_quote(**projector_inputs(**overrides))


def test_source_absence_requires_reason_and_never_borrows_a_price():
    for reason in ("SOURCE_UNAVAILABLE", "CAPTURE_GAP", "SOURCE_CONFLICT"):
        row = project_quote(**projector_inputs(source_price=None, source_price_reason=reason, fx_selection=None))
        assert row["source_price"] is None and row["fx"] is None
        for amount in row["amounts"].values():
            assert amount["status"] == "UNAVAILABLE" and amount["amount"] is None
            assert amount["reason"] == reason
        bad = deepcopy(row)
        bad["amounts"]["CNY"]["reason"] = "NO_ELIGIBLE_FX"
        bad["quote_id"] = public_quote_id(bad)
        with pytest.raises(PriceValueError):
            validate_quote(bad, kind="CURRENT", market_as_of=MARKET_AS_OF, known_at=KNOWN_AT)
    with pytest.raises(PriceValueError):
        project_quote(**projector_inputs(source_price=None, fx_selection=None))


def test_frozen_history_requires_saved_value_not_a_legacy_label():
    legacy = synthetic_fx("2026-08-28", historical=True)
    with pytest.raises(PriceValueError, match="FROZEN_HISTORY_INPUT_REQUIRED"):
        project_quote(**projector_inputs(fx_selection=PriceFxSelection(legacy, None)))
    native = NativePrice("10.00000000", "USD", "USD_DECIMAL", 8)
    saved = FrozenHistoricalPrice(native, 6720, legacy, "2026-08-30T13:00:00.000000Z")
    args = projector_inputs(kind="HISTORY", current_slot_at=None, frozen_history=saved, fx_selection=None)
    result = project_quote(**args)
    assert result["amounts"]["CNY"]["amount"] == "67.20"
    assert result["fx"] == legacy.to_document()
    assert result["available_at"] == PUBLISHED_AT
    for overrides in (
        dict(fx_selection=PriceFxSelection(legacy, None)),
        dict(source_price=NativePrice("11.00000000", "USD", "USD_DECIMAL", 8)),
        dict(source_available_at="2026-08-31T00:00:00.000000Z"),
    ):
        with pytest.raises(PriceValueError):
            project_quote(**dict(args, **overrides))


def test_request_snapshot_catalog_item_hash_and_etag_bindings(examples):
    doc = examples["price-display-item.valid.json"]
    raw = canonical_json_bytes(doc)
    catalog = {"snapshot_id": doc["snapshot"]["catalog_snapshot_id"], "as_of": doc["snapshot"]["catalog_as_of"], "available_at": doc["snapshot"]["catalog_available_at"]}
    valid = dict(expected_query=doc["query"], expected_kind="PRICE_ITEM", expected_snapshot=doc["snapshot"], expected_catalog=catalog, expected_item_id=SYNTHETIC_ITEM, http_status=200, etag='"' + doc["document_hash"] + '"')
    assert decode_price_document(raw, **valid) == doc
    for key, value in (
        ("expected_query", dict(doc["query"], known_at=PUBLISHED_AT)),
        ("expected_kind", "PRICE_HISTORY"),
        ("expected_snapshot", dict(doc["snapshot"], market_as_of=PUBLISHED_AT)),
        ("expected_catalog", dict(catalog, snapshot_id="f" * 64)),
        ("expected_item_id", "1"), ("http_status", 404),
        ("etag", 'W/"' + doc["document_hash"] + '"'),
    ):
        with pytest.raises(PriceValueError):
            decode_price_document(raw, **dict(valid, **{key: value}))
    bad = deepcopy(doc)
    bad["items"][0]["source_price"]["value"] = "11.00000000"
    with pytest.raises(PriceValueError, match="DOCUMENT_HASH"):
        decode_price_document(canonical_json_bytes(bad))
    bad["document_hash"] = public_document_hash(bad)
    with pytest.raises(PriceValueError, match="QUOTE_HASH"):
        decode_price_document(canonical_json_bytes(bad))


def test_snapshot_visibility_namespace_order_and_query(examples):
    doc = examples["price-display-snapshots.valid.json"]
    for edit in (
        lambda d: d["items"].reverse(),
        lambda d: d["items"].append(deepcopy(d["items"][0])),
        lambda d: d["items"][0].update(snapshot_id=d["items"][0]["catalog_snapshot_id"]),
        lambda d: d["items"][0].update(catalog_snapshot_id="a" * 64),
        lambda d: d["items"][0].update(published_at="2026-09-04T00:00:00.000000Z"),
        lambda d: d["query"].update(known_at="2026-09-02T23:59:59.999999Z"),
        lambda d: d["query"].update(query_as_of="2026-08-29T00:00:00.000000Z"),
        lambda d: d["pagination"].update(page_size=19),
        lambda d: d["items"][0].update(kind="HISTORY"),
    ):
        bad = deepcopy(doc)
        edit(bad)
        with pytest.raises(PriceValueError):
            decode_price_document(rehash(bad))
    same_time = [synthetic_snapshot(tag="a"), synthetic_snapshot(tag="b")]
    tied = deepcopy(doc)
    tied["items"] = sorted(same_time, key=lambda row: row["snapshot_id"])
    assert decode_price_document(rehash(tied))["items"] == tied["items"]


def test_current_duplicate_source_transport_does_not_create_independent_market(examples):
    bad = deepcopy(examples["price-display-item.valid.json"])
    market_b = next(row for row in bad["items"] if row["source"]["logical_market"] == "market_b" and row["quote_kind"] == "ASK")
    duplicate = deepcopy(market_b)
    duplicate["source"]["transport"] = "upstream"
    duplicate["quote_id"] = public_quote_id(duplicate)
    bad["items"].append(duplicate)
    bad["items"].sort(key=quote_order_key)
    with pytest.raises(PriceValueError, match="DUPLICATE_LOGICAL_SOURCE"):
        decode_price_document(rehash(bad))


def test_history_keyset_allows_full_page_then_tail_without_loss(examples):
    first = deepcopy(examples["price-display-history-page-1.valid.json"])
    second = deepcopy(examples["price-display-history-page-2.valid.json"])
    assert first["pagination"]["next_cursor"] == second["query"]["cursor"]
    assert decode_history_cursor(first["query"]) is None
    after = decode_history_cursor(second["query"])
    assert after["quote_id"] == first["items"][-1]["quote_id"]
    assert decode_price_document(canonical_json_bytes(first)) == first
    assert decode_price_document(canonical_json_bytes(second), expected_item_id=SYNTHETIC_ITEM) == second
    joined = first["items"] + second["items"]
    assert len(joined) == len({q["quote_id"] for q in joined}) == 3
    assert joined == sorted(joined, key=quote_order_key)
    assert joined[-1]["source"] == {"quote_origin": "PROVIDER_AGGREGATE", "logical_market": None, "transport": "upstream"}


@pytest.mark.parametrize("key,value", [
    ("analysis_unit_id", "another"), ("snapshot_id", "1" * 64), ("as_of", PUBLISHED_AT),
    ("known_at", "2026-09-04T00:00:00.000000Z"),
    ("from", "2026-08-27T00:00:00.000000Z"), ("to", "2026-09-01T00:00:00.000000Z"),
    ("quote_origin", "SOURCE_QUOTE"), ("logical_market", "market_b"),
    ("quote_kind", "BID"), ("page_size", 3),
])
def test_cursor_binds_every_query_dimension(examples, key, value):
    query = deepcopy(examples["price-display-history-page-2.valid.json"]["query"])
    query[key] = value
    with pytest.raises(PriceValueError, match="INVALID_CURSOR"):
        decode_history_cursor(query)


def test_cursor_no_noncanonical_json_padding_private_fields_or_future_after(examples):
    query = deepcopy(examples["price-display-history-page-2.valid.json"]["query"])
    raw = base64.urlsafe_b64decode(query["cursor"] + "=" * (-len(query["cursor"]) % 4))
    decoded = json.loads(raw)
    for replacement in (
        query["cursor"] + "=", query["cursor"] + "%", b64(raw.rstrip(b"\n")),
        b64(json.dumps(decoded, indent=2).encode("utf-8")),
        b64(canonical_json_bytes(dict(decoded, private_import_id="sensitive"))),
        b64(canonical_json_bytes(dict(decoded, after=dict(decoded["after"], event_at=PUBLISHED_AT)))),
        b64(canonical_json_bytes(dict(decoded, after=dict(decoded["after"], quote_kind="TRADE")))),
    ):
        with pytest.raises(PriceValueError):
            decode_history_cursor(dict(query, cursor=replacement))


def test_history_boundary_ranges_filters_duplicates_and_next_cursor(examples):
    first = examples["price-display-history-page-1.valid.json"]
    for edit in (
        lambda d: d["items"].reverse(),
        lambda d: d["items"].append(deepcopy(d["items"][0])),
        lambda d: d["query"].update(**{"from": "2026-08-29T00:00:00.000000Z"}),
        lambda d: d["query"].update(**{"to": "2026-08-29T12:00:00.000000Z"}),
        lambda d: d["query"].update(quote_kind="BID"),
        lambda d: d["query"].update(logical_market="market_a"),
        lambda d: d["query"].update(quote_origin="PROVIDER_AGGREGATE"),
        lambda d: d["pagination"].update(next_cursor=encode_history_cursor(d["query"], d["items"][0])),
        lambda d: d["pagination"].update(page_size=1),
        lambda d: d["snapshot"].update(kind="CURRENT"),
    ):
        bad = deepcopy(first)
        edit(bad)
        with pytest.raises(PriceValueError):
            decode_price_document(rehash(bad))
    second = deepcopy(examples["price-display-history-page-2.valid.json"])
    second["items"] = deepcopy(first["items"])
    second["pagination"]["next_cursor"] = None
    with pytest.raises(PriceValueError, match="QUOTE_ORDER"):
        decode_price_document(rehash(second))
    start = datetime(2025, 1, 1, tzinfo=UTC)
    args = dict(analysis_unit_id=SYNTHETIC_UNIT, snapshot_id=first["snapshot"]["snapshot_id"], as_of=MARKET_AS_OF, known_at=KNOWN_AT, from_at=utc_timestamp_text(start))
    assert PriceHistoryQuery(**args, to_at=utc_timestamp_text(start + timedelta(days=366)), page_size=200)
    for overrides in (
        {"to_at": utc_timestamp_text(start)}, {"to_at": utc_timestamp_text(start + timedelta(days=367))},
        {"to_at": utc_timestamp_text(start + timedelta(days=1)), "page_size": 201},
        {"to_at": utc_timestamp_text(start + timedelta(days=1)), "quote_origin": "PROVIDER_AGGREGATE", "logical_market": "market_a"},
    ):
        with pytest.raises(PriceValueError):
            PriceHistoryQuery(**args, **overrides)


def test_empty_real_sets_are_distinct_from_missing_contract(examples):
    for name in ("price-display-snapshots-empty.valid.json", "price-display-item-empty.valid.json", "price-display-history-empty.valid.json"):
        doc = decode_price_document(canonical_json_bytes(examples[name]), http_status=200)
        assert doc["items"] == [] and doc["response_kind"] != "ERROR"
    error = price_error_document("CONTRACT_UNAVAILABLE")
    assert error["error"] == {"code": "CONTRACT_UNAVAILABLE", "http_status": 503, "retryable": True}
    assert error["query"] is None and error["snapshot"] is None
    assert decode_price_document(canonical_json_bytes(error), http_status=503) == error
    with pytest.raises(PriceValueError, match="HTTP_STATUS_BINDING"):
        decode_price_document(canonical_json_bytes(error), http_status=200)


def test_every_object_allowlist_rejects_recursive_private_fields(examples):
    original = examples["price-display-item.valid.json"]
    paths = []

    def walk(value, path):
        if isinstance(value, dict):
            paths.append(path)
            for key, member in value.items():
                walk(member, (*path, key))
        elif isinstance(value, list):
            for index, member in enumerate(value):
                walk(member, (*path, index))
    walk(original, ())
    for path in paths:
        doc = deepcopy(original)
        target = doc
        for part in path:
            target = target[part]
        target["private_artifact_path"] = "do-not-echo-this-value"
        with pytest.raises(PriceValueError) as caught:
            decode_price_document(rehash(doc))
        assert "do-not-echo" not in str(caught.value)
    # Fixed errors cannot be used to exfiltrate a provider/DB exception either.
    with pytest.raises(PriceValueError, match="INVALID_ERROR_CODE"):
        price_error_document("provider-secret-error")


def test_query_models_have_no_implicit_now_or_identity_alias(examples):
    current = synthetic_snapshot()
    assert PriceSnapshotQuery(MARKET_AS_OF, KNOWN_AT, current["catalog_snapshot_id"], "CURRENT").to_document() == examples["price-display-snapshots.valid.json"]["query"]
    assert PriceItemQuery(SYNTHETIC_UNIT, current["snapshot_id"], MARKET_AS_OF, KNOWN_AT).to_document() == examples["price-display-item.valid.json"]["query"]
    for kwargs in ({"page_size": 0}, {"page_size": 21}, {"kind": "LATEST"}, {"known_at": "now"}):
        args = dict(query_as_of=MARKET_AS_OF, known_at=KNOWN_AT, catalog_snapshot_id=current["catalog_snapshot_id"], kind="CURRENT")
        with pytest.raises(PriceValueError):
            PriceSnapshotQuery(**dict(args, **kwargs))
    with pytest.raises(PriceValueError):
        PriceMemberBinding(SYNTHETIC_UNIT, SYNTHETIC_ITEM, PUBLISHED_AT, "CURRENT_EXACT_MHN_LATE_BIND_V1", False)
    with pytest.raises(PriceValueError):
        PriceMemberBinding(SYNTHETIC_UNIT, SYNTHETIC_ITEM, "2026-09-03T00:00:00Z")


def test_document_hash_uses_utf8_sorted_keys_one_lf_and_does_not_mutate(examples):
    doc = deepcopy(examples["price-display-item.valid.json"])
    before = deepcopy(doc)
    projected = seal_price_document(doc)
    assert doc == before and projected == doc and projected is not doc
    unsigned = {key: value for key, value in doc.items() if key != "document_hash"}
    independent = (json.dumps(unsigned, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")
    assert independent.endswith(b"\n") and not independent.endswith(b"\n\n")
    assert public_document_hash(doc) == sha256_hex(independent)
    assert SYNTHETIC_UNIT.encode("utf-8").split(b"\\")[0] in independent
