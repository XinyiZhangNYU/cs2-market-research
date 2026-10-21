import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { canonicalHash, snapshotIdOf } from '../src/wire/canonical'
import {
  decodeResultReadApiResponse,
  isValidatedResultReadResponse,
  ResultReadApiSemanticViolation,
  ResultReadApiWireViolation,
  validateResultReadApiResponse,
} from '../src/wire/resultReadApiDecode'
import {
  RESULT_READ_API_SCHEMA,
  RESULT_READ_API_SCHEMA_ID,
} from '../src/wire/resultReadApiSchema'

const ROOT = join(import.meta.dirname, '..', '..', 'schemas', 'examples')

function load(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(ROOT, name), 'utf8')) as Record<string, unknown>
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function rehash(document: Record<string, unknown>): Record<string, unknown> {
  document['snapshot_id'] = snapshotIdOf(document)
  return document
}

function storage(envelope: Record<string, unknown>, publishedAt = '2026-08-21T00:00:01.000000Z') {
  return {
    envelope,
    storage: {
      published_at: publishedAt,
      document_hash: canonicalHash(envelope),
    },
  }
}

function unitDetail() {
  return {
    api_contract: 'result-read-api',
    api_version: 'v1',
    response_kind: 'UNIT_DETAIL',
    query_as_of: '2026-08-21T00:00:02.000000Z',
    resource: storage(load('unit-item-branch-b.valid.json')),
  }
}

function qualityDetail() {
  return {
    api_contract: 'result-read-api',
    api_version: 'v1',
    response_kind: 'QUALITY_DETAIL',
    query_as_of: '2026-08-21T00:00:02.000000Z',
    resource: storage(load('quality-item-style.valid.json')),
  }
}

function query() {
  return {
    as_of: '2026-08-21T00:00:02.000000Z',
    scope_kind: 'ITEM',
    analysis_unit_kind: 'STYLE_VARIANT',
    edition_kind: 'STANDARD',
    parent_analysis_unit_id: 'item:42',
    data_status: 'UNAVAILABLE_BY_DESIGN',
    sort: 'ANALYSIS_UNIT_ID_ASC',
    page_size: 100,
  }
}

function listResponse(...envelopes: Record<string, unknown>[]) {
  return {
    api_contract: 'result-read-api',
    api_version: 'v1',
    response_kind: 'UNIT_LIST',
    query: query(),
    members: envelopes.map((envelope) => storage(envelope)),
    next_cursor: null,
  }
}

describe('the shared result-read schema is the only outer wire contract', () => {
  it('compiles with both formal envelope dependencies', () => {
    expect(RESULT_READ_API_SCHEMA.$id).toBe(RESULT_READ_API_SCHEMA_ID)
    expect(validateResultReadApiResponse(unitDetail())).toBe(true)
    expect(validateResultReadApiResponse(qualityDetail())).toBe(true)
  })

  it.each([
    ['result-read-unit-detail.valid.json', 'UNIT_DETAIL'],
    ['result-read-unit-list.valid.json', 'UNIT_LIST'],
    ['result-read-collection-detail.valid.json', 'COLLECTION_DETAIL'],
    ['result-read-quality-detail.valid.json', 'QUALITY_DETAIL'],
    ['result-read-quality-list.valid.json', 'QUALITY_LIST'],
    ['result-read-error.valid.json', 'ERROR'],
    ['result-read-dashboard-market-unit-detail.valid.json', 'UNIT_DETAIL'],
    ['result-read-dashboard-sector-unit-list.valid.json', 'UNIT_LIST'],
    [
      'result-read-dashboard-sector-collection-detail.valid.json',
      'COLLECTION_DETAIL',
    ],
  ] as const)('decodes the Python-generated %s fixture', (name, kind) => {
    const decoded = decodeResultReadApiResponse(load(name))
    expect(isValidatedResultReadResponse(decoded, kind)).toBe(true)
  })

  it('rejects a source-private outer field', () => {
    const payload = unitDetail() as Record<string, unknown>
    payload.source_item_id = 'must-not-enter'
    expect(() => decodeResultReadApiResponse(payload)).toThrow(ResultReadApiWireViolation)
  })

  it.each([
    ['INVALID_ARGUMENT', 400, false],
    ['INVALID_CURSOR', 400, false],
    ['NOT_FOUND', 404, false],
    ['CONTRACT_UNAVAILABLE', 503, true],
    ['RESULT_CORRUPT', 503, false],
    ['BACKEND_UNAVAILABLE', 503, true],
  ] as const)('binds %s to its exact HTTP and retry semantics', (code, status, retryable) => {
    const payload = {
      api_contract: 'result-read-api',
      api_version: 'v1',
      response_kind: 'ERROR',
      error: { code, http_status: status, retryable },
    }
    const decoded = decodeResultReadApiResponse(payload)
    expect(isValidatedResultReadResponse(decoded, 'ERROR')).toBe(true)
    const wrong = clone(payload)
    wrong.error.retryable = !retryable
    expect(() => decodeResultReadApiResponse(wrong)).toThrow(ResultReadApiWireViolation)
  })
})

describe('the outer API keeps formal results self-verifying and point-in-time safe', () => {
  it('returns an immutable nominal wrapper around an independently validated envelope', () => {
    const decoded = decodeResultReadApiResponse(unitDetail())
    expect(isValidatedResultReadResponse(decoded, 'UNIT_DETAIL')).toBe(true)
    expect(Object.isFrozen(decoded)).toBe(true)
    if (decoded.response_kind !== 'UNIT_DETAIL') throw new Error('wrong test kind')
    expect(Object.isFrozen(decoded.resource.envelope)).toBe(true)
    expect(() => {
      ;(decoded as { query_as_of: string }).query_as_of = 'not-a-time'
    }).toThrow(TypeError)
  })

  it('rejects a storage hash that does not bind the returned envelope', () => {
    const payload = unitDetail()
    payload.resource.storage.document_hash = '0'.repeat(64)
    expect(() => decodeResultReadApiResponse(payload)).toThrowError(
      expect.objectContaining({ rule: 'API_DOCUMENT_HASH' }),
    )
  })

  it('rejects a result or publication later than the explicit query time', () => {
    const publication = unitDetail()
    publication.resource.storage.published_at = '2026-08-21T00:00:03.000000Z'
    expect(() => decodeResultReadApiResponse(publication)).toThrowError(
      expect.objectContaining({ rule: 'API_TIME_ORDER' }),
    )

    const envelope = unitDetail()
    envelope.query_as_of = '2026-08-20T23:59:59.000000Z'
    expect(() => decodeResultReadApiResponse(envelope)).toThrow(ResultReadApiSemanticViolation)
  })
})

describe('UNIT_LIST preserves keyset order, accounting and filter semantics', () => {
  it('accepts the canonical shared item under its exact identity filters', () => {
    const decoded = decodeResultReadApiResponse(
      listResponse(load('unit-item-branch-b.valid.json')),
    )
    expect(isValidatedResultReadResponse(decoded, 'UNIT_LIST')).toBe(true)
  })

  it('rejects a member that does not match the echoed query', () => {
    const payload = listResponse(load('unit-item-branch-b.valid.json'))
    payload.query.edition_kind = 'STATTRAK'
    expect(() => decodeResultReadApiResponse(payload)).toThrowError(
      expect.objectContaining({ rule: 'API_FILTER_MATCH' }),
    )
  })

  it('rejects duplicate and out-of-order members using code-point order', () => {
    const first = load('unit-item-branch-b.valid.json')
    const second = clone(first)
    const secondIdentity = second.identity as Record<string, unknown>
    secondIdentity.analysis_unit_id = 'item:🗡'
    rehash(second)

    const outOfOrder = listResponse(second, first)
    expect(() => decodeResultReadApiResponse(outOfOrder)).toThrowError(
      expect.objectContaining({ rule: 'API_SORT_ORDER' }),
    )

    const duplicate = listResponse(first, first)
    expect(() => decodeResultReadApiResponse(duplicate)).toThrowError(
      expect.objectContaining({ rule: 'API_PAGE_ACCOUNTING' }),
    )
  })

  it('rejects a page whose members exceed its echoed page_size', () => {
    const first = load('unit-item-branch-b.valid.json')
    const second = clone(first)
    ;(second.identity as Record<string, unknown>).analysis_unit_id = 'item:99'
    rehash(second)
    const payload = listResponse(first, second)
    payload.query.page_size = 1
    expect(() => decodeResultReadApiResponse(payload)).toThrowError(
      expect.objectContaining({ rule: 'API_PAGE_ACCOUNTING' }),
    )
  })
})

describe('QUALITY_LIST preserves keyset order, accounting and quality identity filters', () => {
  it('accepts the exact Python-generated quality list', () => {
    const decoded = decodeResultReadApiResponse(load('result-read-quality-list.valid.json'))
    expect(isValidatedResultReadResponse(decoded, 'QUALITY_LIST')).toBe(true)
  })

  it('rejects a quality member that does not match the echoed identity query', () => {
    const payload = load('result-read-quality-list.valid.json')
    ;(payload.query as Record<string, unknown>).edition_kind = 'STATTRAK'
    expect(() => decodeResultReadApiResponse(payload)).toThrowError(
      expect.objectContaining({ rule: 'API_FILTER_MATCH' }),
    )
  })

  it('rejects a future publication and a forged quality document hash', () => {
    const future = load('result-read-quality-list.valid.json')
    const futureMember = (future.members as Record<string, unknown>[])[0]
    ;(futureMember.storage as Record<string, unknown>).published_at =
      '2026-08-22T04:00:03.000000Z'
    expect(() => decodeResultReadApiResponse(future)).toThrowError(
      expect.objectContaining({ rule: 'API_TIME_ORDER' }),
    )

    const forged = load('result-read-quality-list.valid.json')
    const forgedMember = (forged.members as Record<string, unknown>[])[0]
    ;(forgedMember.storage as Record<string, unknown>).document_hash = '0'.repeat(64)
    expect(() => decodeResultReadApiResponse(forged)).toThrowError(
      expect.objectContaining({ rule: 'API_DOCUMENT_HASH' }),
    )
  })
})
