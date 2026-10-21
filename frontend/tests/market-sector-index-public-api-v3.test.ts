import { describe, expect, it, vi } from 'vitest'
import seriesV2Fixture from '../../schemas/examples/market-sector-index-public-api/v2/series.json'

import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import { canonicalHash } from '../src/wire/canonical'
import { decodeMarketSectorIndexDirectoryV3 } from '../src/wire/marketSectorIndexPublicApiV3Decode'
import type { MarketSectorIndexDirectoryRequestV3 } from '../src/wire/marketSectorIndexPublicApiV3Types'


const PUBLICATION = '6'.repeat(64)
const DIRECTORY_ID = `market_sector_index_scope_directory_${'8'.repeat(64)}`
const groups = [
  'MARKET', 'SECTORS', 'CASES', 'WEAPON_MODELS', 'KNIFE_MODELS',
  'GLOVE_MODELS', 'COLLECTIONS', 'ARMORY_RELEASES', 'DOPPLER',
].map((group_code, display_order) => ({
  group_code,
  labels: { en: group_code, zh_cn: group_code },
  display_order,
  scope_count: group_code === 'COLLECTIONS' ? 2 : 0,
}))

function scope(code: string) {
  return {
    scope_token: canonicalHash({ contract: 'market-sector-index-public-api', scope_code: code }),
    scope_code: code,
    scope_kind: 'SUBSECTOR',
    group_code: 'COLLECTIONS',
    parent_scope_code: 'COLLECTION',
    ancestor_scope_codes: ['ALL', 'COLLECTION'],
    labels: { en: code, zh_cn: code },
    series_source: 'REGULAR_SUCCESSOR_RECONSTRUCTION',
    price_history_eligibility: 'RECONSTRUCTED_HISTORY',
    first_available_date: '2023-01-01',
    last_available_date: '2026-09-10',
    current_member_count: 2,
    observed_price_member_count: 2,
    origin_uncertainty_disclosed: false,
    low_member_count: false,
    linked_collection_scope_tokens: [],
  } as const
}

const release = {
  publication_id: PUBLICATION,
  manifest_sha256: '1'.repeat(64),
  rights_revision: '2'.repeat(64),
  published_at: '2026-09-19T17:30:00Z',
  withdrawn_at: null,
  directory_id: DIRECTORY_ID,
  directory_sha256: '3'.repeat(64),
  directory_sealed_at: '2026-09-19T17:00:00Z',
  candidate_sha256: '4'.repeat(64),
  successor_delta_sha256: '5'.repeat(64),
  continuation_spec_sha256: '7'.repeat(64),
  history_start: '2023-01-01',
  history_end: '2026-09-10',
  measured_start: '2026-09-11',
  measured_end: '2026-09-15',
  availability_semantics: ['RECONSTRUCTED_LATE_BOUND', 'CONTEMPORANEOUSLY_MEASURED'],
} as const

const base = {
  contract_name: 'market-sector-index-public-api',
  contract_version: '3',
  product_kind: 'DESCRIPTIVE_MARKET_SECTOR_INDEX',
  purpose: 'CS2_ROTATE_HIERARCHICAL_MARKET_SECTOR_INDEX_V3',
  prediction_status: 'NOT_A_PREDICTION',
  release,
} as const

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status, headers: { 'Content-Type': 'application/json' },
  })
}

describe('market/sector V3 hierarchical directory', () => {
  it('checks the original active-directory cache clock and rejects foreign or backward-clock reuse', async () => {
    vi.useFakeTimers(); vi.setSystemTime(100_000)
    try {
      const fetcher = vi.fn(async () => jsonResponse({ ...base, response_kind: 'SCOPE_GROUP_DIRECTORY', query: { group: null, after: null, limit: null, next_after: null }, groups, scopes: [] }))
      const api = new MarketSectorIndexPublicApi(new HttpMarketSectorIndexPublicGateway({ fetcher }))
      const first = await api.directoryV3Groups(null)
      expect(first).not.toBeNull()
      if (first === null) throw new Error('test directory missing')
      vi.setSystemTime(129_000)
      expect(api.isActiveDirectoryFresh(first)).toBe(true)
      expect(api.isActiveDirectoryFresh(structuredClone(first))).toBe(false)
      expect(await api.directoryV3Groups(null)).toBe(first)
      expect(fetcher).toHaveBeenCalledTimes(1)
      vi.setSystemTime(130_000)
      expect(api.isActiveDirectoryFresh(first)).toBe(false)
      const second = await api.directoryV3Groups(null)
      expect(fetcher).toHaveBeenCalledTimes(2)
      expect(api.isActiveDirectoryFresh(first)).toBe(false)
      if (second === null) throw new Error('test directory missing')
      vi.setSystemTime(129_999)
      expect(api.isActiveDirectoryFresh(second)).toBe(false)
    } finally { vi.useRealTimers() }
  })
  it('decodes exact group and scope page contracts', () => {
    const groupRequest = { kind: 'GROUPS', query: { publication_id: null } } satisfies MarketSectorIndexDirectoryRequestV3
    const groupDocument = {
      ...base,
      response_kind: 'SCOPE_GROUP_DIRECTORY',
      query: { group: null, after: null, limit: null, next_after: null },
      groups,
      scopes: [],
    }
    expect(() => decodeMarketSectorIndexDirectoryV3(groupDocument, groupRequest, 200)).not.toThrow()
    const pageRequest = {
      kind: 'SCOPES',
      query: { publication_id: PUBLICATION, group: 'COLLECTIONS', after: null, limit: 1 },
    } satisfies MarketSectorIndexDirectoryRequestV3
    const page = {
      ...base,
      response_kind: 'SCOPE_PAGE',
      query: { group: 'COLLECTIONS', after: null, limit: 1, next_after: scope('COLLECTION:00000000000000000000000000000001').scope_token },
      groups: [],
      scopes: [scope('COLLECTION:00000000000000000000000000000001')],
    }
    expect(() => decodeMarketSectorIndexDirectoryV3(page, pageRequest, 200)).not.toThrow()
    const bad: any = structuredClone(page)
    bad.scopes[0].scope_token = 'f'.repeat(64)
    expect(() => decodeMarketSectorIndexDirectoryV3(bad, pageRequest, 200)).toThrow()
  })

  it('uses bounded V3 URLs and pins publication across pages', async () => {
    let scopePage = 0
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), 'https://example.test')
      if (url.pathname.endsWith('/scope-groups')) {
        return jsonResponse({
          ...base,
          response_kind: 'SCOPE_GROUP_DIRECTORY',
          query: { group: null, after: null, limit: null, next_after: null },
          groups,
          scopes: [],
        })
      }
      const code = scopePage === 0
        ? 'COLLECTION:00000000000000000000000000000001'
        : 'COLLECTION:00000000000000000000000000000002'
      const next = scopePage === 0 ? scope(code).scope_token : null
      const after = scopePage === 0 ? null : scope('COLLECTION:00000000000000000000000000000001').scope_token
      scopePage += 1
      return jsonResponse({
        ...base,
        response_kind: 'SCOPE_PAGE',
        query: { group: 'COLLECTIONS', after, limit: 1, next_after: next },
        groups: [],
        scopes: [scope(code)],
      })
    })
    const api = new MarketSectorIndexPublicApi(new HttpMarketSectorIndexPublicGateway({ fetcher }))
    const directory = await api.directoryV3Groups(null)
    expect(directory?.groups).toHaveLength(9)
    const result = await api.directoryV3ScopePages('COLLECTIONS', PUBLICATION, {}, 1)
    expect(result.scopes.map((entry) => entry.scope_code)).toEqual([
      'COLLECTION:00000000000000000000000000000001',
      'COLLECTION:00000000000000000000000000000002',
    ])
    expect(fetcher.mock.calls.map((call) => String(call[0]))).toEqual([
      '/api/v3/market-index/public/scope-groups',
      `/api/v3/market-index/public/scopes?publication=${PUBLICATION}&group=COLLECTIONS&limit=1`,
      `/api/v3/market-index/public/scopes?publication=${PUBLICATION}&group=COLLECTIONS&after=${scope('COLLECTION:00000000000000000000000000000001').scope_token}&limit=1`,
    ])
  })

  it('falls back only when V3 is explicitly not published', async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      contract_name: 'market-sector-index-public-api',
      contract_version: '3',
      response_kind: 'ERROR',
      error: { code: 'NOT_PUBLISHED', retryable: false },
    }, 404))
    const api = new MarketSectorIndexPublicApi(new HttpMarketSectorIndexPublicGateway({ fetcher }))
    await expect(api.directoryV3Groups(null)).resolves.toBeNull()
  })

  it('reads V3 points from the same pinned release', async () => {
    const selected = scope('COLLECTION:00000000000000000000000000000001')
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), 'https://example.test')
      expect(url.pathname).toBe(`/api/v3/market-index/public/scopes/${selected.scope_token}/points`)
      expect(url.searchParams.get('publication')).toBe(PUBLICATION)
      const points = structuredClone(seriesV2Fixture.points.slice(0, 2))
      return jsonResponse({
        ...base,
        response_kind: 'INDEX_SERIES',
        scope: selected,
        series_query: {
          from_date: '2026-09-08', to_date: '2026-09-10', after_date: null,
          limit: 2, next_after_date: null,
        },
        points,
      })
    })
    const api = new MarketSectorIndexPublicApi(new HttpMarketSectorIndexPublicGateway({ fetcher }))
    const result = await api.seriesV3Pages({
      publication_id: PUBLICATION,
      scope_token: selected.scope_token,
      from_date: '2026-09-08',
      to_date: '2026-09-10',
      after_date: null,
      limit: 2,
    })
    expect(result.response_kind).toBe('INDEX_SERIES')
    if (result.response_kind === 'INDEX_SERIES') expect(result.points).toHaveLength(2)
  })

  it('accepts a late-bound repair inside the opened measured window but not beyond it', () => {
    const selected = scope('COLLECTION:00000000000000000000000000000001')
    const request = {
      kind: 'SERIES',
      query: {
        publication_id: PUBLICATION,
        scope_token: selected.scope_token,
        from_date: '2026-09-12',
        to_date: '2026-09-12',
        after_date: null,
        limit: 1,
      },
    } as const
    const point = {
      ...structuredClone(seriesV2Fixture.points[4]),
      connect_to_previous: false,
      availability: 'RECONSTRUCTED_LATE_BOUND',
      index: {
        ...structuredClone(seriesV2Fixture.points[4]!.index),
        period_return: null,
      },
    }
    const document = {
      ...base,
      response_kind: 'INDEX_SERIES',
      scope: selected,
      series_query: {
        from_date: request.query.from_date,
        to_date: request.query.to_date,
        after_date: request.query.after_date,
        limit: request.query.limit,
        next_after_date: null,
      },
      points: [point],
    }
    expect(() => decodeMarketSectorIndexDirectoryV3(document, request, 200)).not.toThrow()
    const beyond = structuredClone(document)
    beyond.points[0]!.date = '2026-09-16'
    expect(() => decodeMarketSectorIndexDirectoryV3(beyond, {
      ...request,
      query: { ...request.query, from_date: '2026-09-16', to_date: '2026-09-16' },
    }, 200)).toThrow()
  })

  it('reads one bounded completing page when the V3 window fills at its anchor limit', async () => {
    const selected = scope('COLLECTION:00000000000000000000000000000001')
    const requested: Array<{ after: string | null; limit: number }> = []
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), 'https://example.test')
      const after = url.searchParams.get('after')
      const limit = Number(url.searchParams.get('limit'))
      requested.push({ after, limit })
      const offset = after === null ? 0 : 4
      const points = structuredClone(seriesV2Fixture.points.slice(offset, offset + limit))
      return jsonResponse({
        ...base,
        response_kind: 'INDEX_SERIES',
        scope: selected,
        series_query: {
          from_date: '2026-09-08', to_date: '2026-09-12', after_date: after,
          limit, next_after_date: offset === 0 ? points.at(-1)?.date ?? null : null,
        },
        points,
      })
    })
    const api = new MarketSectorIndexPublicApi(new HttpMarketSectorIndexPublicGateway({ fetcher }))
    const result = await api.seriesV3Pages({
      publication_id: PUBLICATION,
      scope_token: selected.scope_token,
      from_date: '2026-09-08',
      to_date: '2026-09-12',
      after_date: null,
      limit: 4,
    })
    expect(result.response_kind).toBe('INDEX_SERIES')
    if (result.response_kind === 'INDEX_SERIES') {
      expect(result.points.map((point) => point.date)).toEqual([
        '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12',
      ])
    }
    expect(requested).toEqual([
      { after: null, limit: 4 },
      { after: '2026-09-11', limit: 128 },
    ])
  })

  it('rejects measured or post-boundary points for a history-only scope even without a request end date', () => {
    const variantCode = 'DOPPLER:P1'
    const selected = {
      ...scope(variantCode),
      group_code: 'DOPPLER',
      parent_scope_code: 'DOPPLER',
      ancestor_scope_codes: ['ALL', 'DOPPLER'],
      series_source: 'VARIANT_RECONSTRUCTION',
      first_available_date: '2023-10-31',
      last_available_date: '2026-08-26',
    }
    const request = {
      kind: 'SERIES',
      query: {
        publication_id: PUBLICATION,
        scope_token: selected.scope_token,
        from_date: '2025-08-25',
        to_date: null,
        after_date: null,
        limit: 2,
      },
    } as const
    const bad = {
      ...base,
      response_kind: 'INDEX_SERIES',
      scope: selected,
      series_query: { ...request.query, next_after_date: null },
      points: structuredClone(seriesV2Fixture.points.slice(-2)),
    }
    expect(() => decodeMarketSectorIndexDirectoryV3(bad, request, 200)).toThrow()
  })
})
