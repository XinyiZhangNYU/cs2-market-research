"""Synthetic capture-chain helpers for tests.

Upstream payloads are opaque placeholder bytes: decoding the provider wire
format belongs to the private provider adapter, which is not in this repository.
"""
import gzip
import json

from cs2_research.ingestion import native_cny as n


def job(route='upstream:archive/history'):
    body = {'items': ['item'], 'currency': 'CNY'}
    if route != 'upstream:prices/latest':
        body.update(start='2026-09-01', end='2026-09-02', interval='1d', sources=list(n.SOURCES))
    return {'id': 'synthetic-1', 'route': route, 'body': body}


def document():
    return n.loads(b'{"synthetic_upstream_document":"2026-09-01"}')


def make_attempt(tmp_path):
    raw = b'{"synthetic_upstream_document":"2026-09-26"}'
    wire = gzip.compress(raw)
    request = job('upstream:prices/latest')
    receipt = {'id': request['id'], 'status': 'PRESERVED', 'http_status': 200,
      'request_sha256': n.digest(n.canonical_request(request)),
      'wire_sha256': n.digest(wire), 'decoded_sha256': n.digest(raw),
      'headers': {'Content-Encoding': 'gzip'}, 'requested_at': '2026-09-26T17:00:00Z',
      'finished_at': '2026-09-26T17:00:01Z'}
    for filename, value in [('receipt.json', receipt), ('request.json', request),
                            ('intent.json', {'plan_sha256': 'a'*64})]:
        (tmp_path/filename).write_text(json.dumps(value))
    (tmp_path/'response.wire').write_bytes(wire)
    return request, receipt
