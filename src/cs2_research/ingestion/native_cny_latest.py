"""Explicit all-market native-CNY latest input, isolated from legacy USD readers.

This module performs no I/O or publication. The provider adapter that decodes a
latest response into normalized rows is private and not included here.
"""
from collections import Counter
from datetime import timedelta
import gzip
import io
import re

from . import native_cny as n
from .errors import ProviderAdapterUnavailable

SCHEMA = 'upstream-native-cny-latest-observation/1'
REQUEST = {'method': 'GET', 'origin': 'https://provider.invalid',
           'route': 'upstream:prices/latest',
           'query': {'currency': 'CNY', 'sources': 'market_a,market_c,market_b'}}


def decode_wire(wire, encoding):
    n.require(len(wire) <= n.MAX_WIRE, 'WIRE_LIMIT')
    n.require(encoding in ('identity', 'gzip'), 'CONTENT_ENCODING')
    if encoding == 'gzip':
        with gzip.GzipFile(fileobj=io.BytesIO(wire)) as stream:
            decoded = stream.read(n.MAX_DECODED + 1)
    else:
        decoded = wire
    n.require(len(decoded) <= n.MAX_DECODED, 'DECODED_LIMIT')
    return decoded


def normalize_latest(decoded, *, request, wire_sha256, slot_at,
                     requested_at, finished_at, target_names, catalog_sha256):
    """Validate one whole latest response, then return ``(rows, report)``.

    Rows are ``native-cny-quotation-observation/1`` records extended with the
    slot, request hash, catalog hash, target-identity status and variant version,
    sorted by (market_hash_name, variant_key, source). The report counts targets,
    returned and missing names, per-source rows and flags. Implemented by the
    private provider adapter.
    """
    raise ProviderAdapterUnavailable('PROVIDER_ADAPTER_NOT_INCLUDED')
