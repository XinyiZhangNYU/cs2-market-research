"""Native-CNY quotation primitives shared by the whole CNY pipeline.

Strict JSON loading, exact clocks and the authenticated capture chain live here.
The provider adapter that turns an upstream response into normalized
``native-cny-quotation-observation/1`` rows is private and not included in this
repository; ``document_metadata`` and ``iter_quotes`` mark that boundary.
"""
from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from functools import lru_cache
import gzip
import hashlib
import io
import json
import re
from pathlib import Path

from .errors import ProviderAdapterUnavailable

SOURCES = ('market_a', 'market_c', 'market_b')
ROUTES = ('upstream:archive/history', 'upstream:prices/latest')  # logical route codes
MAX_WIRE = 64 * 1024 ** 2
MAX_DECODED = 256 * 1024 ** 2


class NativeCnyError(ValueError):
    pass


class Number(str):
    """Original JSON number spelling, distinguishable from a JSON string."""


def require(condition, code):
    if not condition:
        raise NativeCnyError(code)


def digest(value):
    return hashlib.sha256(value).hexdigest()


def pairs_unique(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'DUPLICATE_JSON_KEY')
        result[key] = value
    return result


def loads(raw):
    def constant(_):
        raise NativeCnyError('NONFINITE_JSON_NUMBER')
    try:
        return json.loads(raw, parse_int=Number, parse_float=Number,
                          parse_constant=constant, object_pairs_hook=pairs_unique)
    except (UnicodeError, json.JSONDecodeError) as error:
        raise NativeCnyError('MALFORMED_JSON') from error


def control_loads(raw):
    """Strict control JSON, preserving ordinary integer/bool control types.

    Callers with an external byte pin must check it before calling this parser.
    This parser does not itself authenticate the file or recover duplicate keys.
    """
    def constant(_):
        raise NativeCnyError('NONFINITE_JSON_NUMBER')
    try:
        return json.loads(raw, object_pairs_hook=pairs_unique, parse_constant=constant)
    except (UnicodeError, json.JSONDecodeError) as error:
        raise NativeCnyError('MALFORMED_JSON') from error


def _timestamp_parts(value):
    # Cache only bounded ordinary strings; never hash/coerce untrusted objects or
    # Number/str subclasses. Successful results contain only immutable values.
    # Long fractional lexemes retain the original exact parser without retention.
    if type(value) is str and len(value) <= 128:
        return _cached_timestamp_parts(value)
    return _parse_timestamp_parts(value)


@lru_cache(maxsize=4096)
def _cached_timestamp_parts(value):
    return _parse_timestamp_parts(value)


def _parse_timestamp_parts(value):
    """Return exact UTC whole seconds and the untouched fraction digits."""
    require(isinstance(value, str) and not isinstance(value, Number), 'TIME_TYPE')
    # Preserve the existing missing-offset diagnostic for bare calendar dates.
    require(re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}', value) is None, 'TIME_OFFSET_REQUIRED')
    match = re.fullmatch(
        r'([0-9]{4}-[0-9]{2}-[0-9]{2}[Tt ][0-9]{2}:[0-9]{2}:[0-9]{2})'
        r'(?:[.,]([0-9]+))?(Z|[+-][0-9]{2}:[0-9]{2})?', value)
    require(match is not None, 'TIME_INVALID')
    base, fraction, offset = match.groups()
    require(offset is not None, 'TIME_OFFSET_REQUIRED')
    fraction = fraction or ''
    hour, minute, second = (int(part) for part in base[11:].split(':'))
    require(hour <= 24 and minute <= 59 and second <= 59, 'TIME_INVALID')
    # Validate the complete lexeme before separating its fractional seconds.
    # ISO end-of-day 24:00 is valid only with an entirely zero remainder.
    end_of_day = hour == 24
    require(not end_of_day or
            (minute == 0 and second == 0 and not any(d != '0' for d in fraction)),
            'TIME_INVALID')
    if end_of_day:
        base = base[:11] + '00:00:00'
    if offset != 'Z':
        require(int(offset[1:3]) <= 23 and int(offset[4:6]) <= 59, 'TIME_INVALID')
    try:
        parsed = datetime.fromisoformat((base + offset).replace('Z', '+00:00'))
        if end_of_day:
            parsed += timedelta(days=1)
        return parsed.astimezone(timezone.utc), fraction
    except (ValueError, OverflowError) as error:
        raise NativeCnyError('TIME_INVALID') from error


def precise_timestamp_key(value):
    """Exact response-metadata clock comparison; no float or rounding."""
    if type(value) is str and len(value) <= 128:
        return _cached_precise_timestamp_key(value)
    return _precise_timestamp_key(value)


@lru_cache(maxsize=4096)
def _cached_precise_timestamp_key(value):
    return _precise_timestamp_key(value)


def _precise_timestamp_key(value):
    whole, fraction = _timestamp_parts(value)
    return whole, Decimal('0.' + fraction) if fraction else Decimal(0)


def timestamp(value):
    """Observation/request clocks: exact microseconds or explicit rejection.

    Extra fraction digits may only be zero; caller retains original strings.
    Response metadata uses precise_timestamp_key instead, never this lossy path.
    """
    if type(value) is str and len(value) <= 128:
        return _cached_observation_timestamp(value)
    return _observation_timestamp(value)


@lru_cache(maxsize=4096)
def _cached_observation_timestamp(value):
    return _observation_timestamp(value)


def _observation_timestamp(value):
    whole, fraction = _timestamp_parts(value)
    require(not any(d != '0' for d in fraction[6:]), 'TIME_PRECISION_UNSUPPORTED')
    return whole.replace(microsecond=int((fraction + '000000')[:6]))


def number(value):
    if value is None:
        return None
    require(isinstance(value, Number), 'NUMERIC_LEXEME_REQUIRED')
    require(Decimal(value).is_finite(), 'NONFINITE_PRICE')
    return str(value)


def canonical_request(job):
    return json.dumps(job, ensure_ascii=False, sort_keys=True,
                      separators=(',', ':'), allow_nan=False).encode()


def load_attempt(root, job, plan_sha256):
    """Authenticate immutable request/receipt/raw chain, not provider truth."""
    root = Path(root)
    receipt = control_loads((root / 'receipt.json').read_bytes())
    intent = control_loads((root / 'intent.json').read_bytes())
    request = control_loads((root / 'request.json').read_bytes())
    path = root / 'response.wire'
    require(path.stat().st_size <= MAX_WIRE, 'WIRE_LIMIT')
    return load_attempt_bytes(path.read_bytes(), receipt, intent, request, job, plan_sha256)


def load_attempt_bytes(wire, receipt, intent, request, job, plan_sha256):
    """Same authentication for directory and verified archive transports."""
    require(receipt.get('status') == 'PRESERVED' and receipt.get('http_status') == 200,
            'ATTEMPT_NOT_PRESERVED')
    require(intent.get('plan_sha256') == plan_sha256, 'PLAN_BINDING')
    require(request == job and receipt.get('id') == job['id'], 'REQUEST_BINDING')
    require(receipt.get('request_sha256') == digest(canonical_request(job)), 'REQUEST_HASH')
    require(timestamp(receipt['finished_at']) >= timestamp(receipt['requested_at']), 'RECEIPT_TIME_ORDER')
    require(len(wire) <= MAX_WIRE, 'WIRE_LIMIT')
    require(digest(wire) == receipt.get('wire_sha256'), 'WIRE_HASH')
    encoding = receipt.get('headers', {}).get('Content-Encoding') or 'identity'
    if encoding == 'gzip':
        with gzip.GzipFile(fileobj=io.BytesIO(wire)) as stream:
            decoded = stream.read(MAX_DECODED + 1)
    else:
        require(encoding == 'identity', 'CONTENT_ENCODING')
        decoded = wire
    require(len(decoded) <= MAX_DECODED, 'DECODED_LIMIT')
    require(digest(decoded) == receipt.get('decoded_sha256'), 'DECODED_HASH')
    return loads(decoded), receipt


def request_range(body):
    """Provider contract: UTC floor(start), ceil(end), end exclusive."""
    def instant(value):
        if isinstance(value, str) and len(value) == 10:
            value += 'T00:00:00Z'
        return timestamp(value)
    start, end = instant(body['start']), instant(body['end'])
    require(start < end, 'REQUEST_RANGE')
    width = timedelta(hours=1) if body['interval'] == '1h' else timedelta(days=1)
    epoch = datetime(1970, 1, 1, tzinfo=timezone.utc)
    floor = lambda value: epoch + ((value-epoch)//width)*width
    return floor(start), floor(end) + (width if end != floor(end) else timedelta(0))


def document_metadata(doc, job, retrieved_at):
    """Validate one upstream envelope and return its provider-neutral summary.

    Output: ``native-cny-quotation-envelope/1`` with job_id, route, retrieved_at,
    response_time, requested/returned name counts, absent/unexpected names and
    provider_errors. Implemented by the private provider adapter.
    """
    raise ProviderAdapterUnavailable('PROVIDER_ADAPTER_NOT_INCLUDED')


def iter_quotes(doc, job, *, retrieved_at, wire_sha256):
    """Yield normalized ``native-cny-quotation-observation/1`` rows.

    One row per (market_hash_name, variant_key, bucket, source) with exact
    ``ask_text``/``bid_text`` lexemes, observed/collected/retrieved clocks,
    listing-count fields and data-quality ``flags`` (SOURCE_ABSENT, ASK_NULL,
    CROSSED_QUOTE, OBSERVATION_OUTSIDE_BUCKET, ...). Variants are never merged
    and no alias is guessed. Implemented by the private provider adapter.
    """
    raise ProviderAdapterUnavailable('PROVIDER_ADAPTER_NOT_INCLUDED')
