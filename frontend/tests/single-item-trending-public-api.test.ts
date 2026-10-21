import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import listFixture from '../../schemas/examples/single-item-trending-list.valid.json'
import emptyFixture from '../../schemas/examples/single-item-trending-empty.valid.json'
import notPublishedFixture from '../../schemas/examples/single-item-trending-not-published.valid.json'
import { HttpSingleItemTrendingPublicGateway } from '../src/api/HttpSingleItemTrendingPublicGateway'
import {
  SingleItemTrendingPublicApi,
  type SingleItemTrendingPublicGateway,
  type TrendingReadOptions,
  type TrendingTransportResponse,
} from '../src/api/SingleItemTrendingPublicApi'
import {
  decodeTrendingPublicDocument,
  isDecodedTrendingPublicDocument,
  TrendingPublicValidationError,
} from '../src/wire/singleItemTrendingPublicApiDecode'
import type { TrendingListQuery } from '../src/wire/singleItemTrendingPublicApiTypes'

const QUERY = Object.freeze({
  as_of: null,
  publication_id: null,
  direction: 'GAINERS',
  page_size: 50,
  cursor: null,
  filters: Object.freeze({
    item_kind: null,
    base_item_code: null,
    edition_kind: null,
    wear_tier: null,
  }),
} satisfies TrendingListQuery)

function jsonResponse(payload: unknown, status = 200): Response {
  const body = JSON.stringify(payload)
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': String(new TextEncoder().encode(body).byteLength),
    },
  })
}

function rankedFixture(count = 2): any {
  const payload: any = structuredClone(listFixture)
  payload.members = Array.from({ length: count }, (_, index) => {
    const member = structuredClone(listFixture.members[0])
    member.rank = index + 1
    member.analysis_unit_id = `item:${index + 1}`
    member.tie_break_key = member.analysis_unit_id
    member.measurement_id = String(index + 1).padStart(64, '0')
    member.catalog.analysis_unit_id = member.analysis_unit_id
    member.conservative_same_direction_change_floor_ratio = `${count - index}.00000000`
    return member
  })
  const accounting = payload.publication.accounting
  accounting.eligible_count = accounting.direction_eligible_count = count
  accounting.qualified_three_source_endpoint_count = accounting.three_source_endpoint_count = count
  accounting.direction_eligible_ratio_bps = accounting.qualified_three_source_endpoint_ratio_bps =
    accounting.three_source_endpoint_ratio_bps = Math.floor(count * 10000 / accounting.member_count)
  accounting.excluded_count = accounting.member_count - count
  accounting.status_counts.ELIGIBLE_A3 = count
  accounting.status_counts.INSUFFICIENT_THREE_SOURCES = accounting.member_count - count
  accounting.gainer_count = count
  payload.total = count
  return payload
}

class FixtureGateway implements SingleItemTrendingPublicGateway {
  readonly kind = 'TRENDING_FIXTURE'
  readonly requests: TrendingListQuery[] = []

  constructor(
    private readonly payload: unknown,
    private readonly httpStatus = 200,
    private readonly inspectFreeze = false,
  ) {}

  async read(
    query: TrendingListQuery,
    _options: TrendingReadOptions = {},
  ): Promise<TrendingTransportResponse> {
    this.requests.push(structuredClone(query))
    if (this.inspectFreeze) {
      expect(Object.isFrozen(query)).toBe(true)
      expect(Object.isFrozen(query.filters)).toBe(true)
      expect(() => Object.assign(query.filters, { item_kind: 'KNIFE' })).toThrow()
    }
    return { payload: structuredClone(this.payload), httpStatus: this.httpStatus }
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('single-item-trending-public-api/v2 frontend boundary', () => {
  it('pins the assigned shared Schema bytes and accepts recursively sealed public examples', async () => {
    const schemaPath = resolve(import.meta.dirname, '../../schemas/single-item-trending-public-api.v2.schema.json')
    const schemaText = readFileSync(schemaPath, 'utf8').replace(/\r\n?/gu, '\n')
    const schemaHash = createHash('sha256').update(schemaText).digest('hex')
    expect(JSON.parse(schemaText).$id).toBe('urn:cs2-research:single-item-trending-public-api:v2')
    const generated = readFileSync(resolve(import.meta.dirname, '../src/wire/generated/singleItemTrendingPublicApiValidator.js'), 'utf8')
    expect(generated).toContain(`single-item-trending-public-api.v2.schema.json:${schemaHash}`)

    const gateway = new FixtureGateway(listFixture, 200, true)
    const document = await new SingleItemTrendingPublicApi(gateway).list(QUERY)
    expect(document.response_kind).toBe('TRENDING_LIST')
    expect(isDecodedTrendingPublicDocument(document)).toBe(true)
    expect(Object.isFrozen(document)).toBe(true)
    if (document.response_kind !== 'TRENDING_LIST') throw new Error('unexpected response')
    expect(Object.isFrozen(document.members[0].catalog)).toBe(true)
    expect(document.members[0].evidence_grade).toBe('THREE_SOURCE_SAME_DIRECTION')
    expect(JSON.stringify(document)).not.toMatch(/provider_url|source_asset_ref|https?:\/\//iu)

    const empty = await new SingleItemTrendingPublicApi(new FixtureGateway(emptyFixture)).list(QUERY)
    expect(empty).toMatchObject({ response_kind: 'TRENDING_LIST', total: 0, members: [] })
  })

  it('binds direction, filters, publication, ranks, accounting, clocks and HTTP status', () => {
    const cases = [
      (payload: any) => { payload.query.direction = 'LOSERS' },
      (payload: any) => { payload.query.filters.item_kind = 'KNIFE' },
      (payload: any) => { payload.query.publication_id = '9'.repeat(64) },
      (payload: any) => { payload.members[0].rank = 2 },
      (payload: any) => { payload.members[0].catalog.analysis_unit_id = 'item:other' },
      (payload: any) => { payload.members[0].catalog.catalog_version = 'other-catalog-v1' },
      (payload: any) => { payload.members[0].conservative_same_direction_change_floor_ratio = '-0.10000000' },
      (payload: any) => { payload.publication.input_available_at = '2026-09-07T10:32:00.000000Z' },
      (payload: any) => { payload.publication.accounting.excluded_count -= 1 },
      (payload: any) => { payload.members[0].provider_url = 'https://private.invalid' },
    ]
    for (const mutate of cases) {
      const payload = structuredClone(listFixture)
      mutate(payload)
      expect(() => decodeTrendingPublicDocument(payload, QUERY, 200))
        .toThrow(TrendingPublicValidationError)
    }
    expect(() => decodeTrendingPublicDocument(notPublishedFixture, QUERY, 200))
      .toThrow(TrendingPublicValidationError)
    expect(decodeTrendingPublicDocument(notPublishedFixture, QUERY, 404)).toEqual(notPublishedFixture)
  })

  it('rejects V1 success and error bodies instead of silently falling back', () => {
    for (const [payload, status] of [[listFixture, 200], [notPublishedFixture, 404]] as const) {
      expect(() => decodeTrendingPublicDocument({ ...payload, api_version: 'v1' }, QUERY, status))
        .toThrow(TrendingPublicValidationError)
    }
  })

  it('enforces the same source clock, catalog clock and released cap boundaries as Python', () => {
    const mutations: ((payload: any) => void)[] = [
      (p) => { p.publication.input_available_at = '2026-09-06T23:59:59.000000Z' },
      (p) => { p.publication.catalog.as_of = '2026-09-07T11:59:59.000000Z' },
      // Actual rows fit within 2, but the declared producer cap of 50 does not.
      (p) => { p.publication.rights_maximum_public_members_per_direction = 2 },
    ]
    for (const mutate of mutations) {
      const payload = rankedFixture()
      mutate(payload)
      expect(() => decodeTrendingPublicDocument(payload, QUERY, 200), String(mutate)).toThrow(TrendingPublicValidationError)
    }
  })

  it('checks complete pages, unique measurements, exact accounting and all coverage gates', () => {
    const mutations: ((payload: any) => void)[] = [
      (p) => { p.members.pop() }, // total=2 but one row and no next page
      (p) => { p.members[1].measurement_id = p.members[0].measurement_id },
      (p) => { p.publication.accounting.status_counts.ELIGIBLE_A3 = 1; p.publication.accounting.status_counts.CONFLICTED_DIRECTION = 1 },
      (p) => { p.publication.accounting.direction_eligible_count = 1 },
      (p) => { p.publication.accounting.qualified_three_source_endpoint_count = 1 },
      (p) => { p.publication.accounting.three_source_endpoint_ratio_bps = 2 },
      (p) => { p.publication.accounting.qualified_three_source_endpoint_ratio_bps = 2 },
      (p) => { p.publication.accounting.direction_eligible_ratio_bps = 2 },
      (p) => { p.publication.producer_release.minimum_three_source_endpoint_ratio_bps = 2 },
      (p) => { p.publication.producer_release.minimum_qualified_three_source_endpoint_ratio_bps = 2 },
      (p) => { p.publication.producer_release.minimum_direction_eligible_ratio_bps = 2 },
      (p) => { p.publication.producer_release.minimum_qualified_three_source_endpoint_ratio_bps = null },
      (p) => { p.publication.rights_maximum_public_members_per_direction = 1 },
      (p) => { p.query.request_known_at = '2026-09-07T11:59:59.000000Z' },
      (p) => { p.publication.catalog.withdrawn = true },
      (p) => { p.publication.catalog.published_at = '2026-09-07T11:59:59.000000Z' },
      (p) => { p.publication.freshness_anchor_at = '2026-09-06T00:00:00.000000Z' },
      (p) => { p.publication.accounting.member_count = Number.MAX_SAFE_INTEGER + 1 },
    ]
    for (const mutate of mutations) {
      const payload = rankedFixture()
      mutate(payload)
      expect(() => decodeTrendingPublicDocument(payload, QUERY, 200), String(mutate)).toThrow(TrendingPublicValidationError)
    }
    expect(() => decodeTrendingPublicDocument(rankedFixture(), QUERY, 200)).not.toThrow()
  })

  it('rejects mismatching member filter attributes but accepts a correctly filtered subset', () => {
    for (const [key, wrong] of [
      ['item_kind', 'KNIFE'], ['base_item_code', 'other'],
      ['edition_kind', 'STANDARD'], ['wear_tier', 'FACTORY_NEW'],
    ] as const) {
      const payload = rankedFixture()
      const query = { ...QUERY, filters: { ...QUERY.filters, [key]: wrong } }
      payload.query.filters = query.filters
      expect(() => decodeTrendingPublicDocument(payload, query, 200)).toThrow(TrendingPublicValidationError)
      for (const member of payload.members) member.catalog[key] = wrong
      expect(() => decodeTrendingPublicDocument(payload, query, 200)).not.toThrow()
    }
  })

  it('checks visible-score monotonicity with integers without inventing exact tie order', () => {
    const payload = rankedFixture()
    payload.members[0].conservative_same_direction_change_floor_ratio = '9007199254740992.00000001'
    payload.members[1].conservative_same_direction_change_floor_ratio = '9007199254740992.00000002'
    expect(() => decodeTrendingPublicDocument(payload, QUERY, 200)).toThrow(TrendingPublicValidationError)
    payload.members[0].conservative_same_direction_change_floor_ratio = '9007199254740992.00000002'
    // Reversed identities are permitted: equal displayed decimals need not be exact ties.
    payload.members[0].analysis_unit_id = payload.members[0].tie_break_key = payload.members[0].catalog.analysis_unit_id = 'zz'
    expect(() => decodeTrendingPublicDocument(payload, QUERY, 200)).not.toThrow()
  })

  it('accepts signed tiny loser zero and a legitimately aging continuation without refreshing its snapshot', () => {
    const payload = rankedFixture(1)
    payload.query.direction = payload.members[0].direction = 'LOSERS'
    payload.members[0].conservative_same_direction_change_floor_ratio = '-0.00000000'
    payload.publication.accounting.gainer_count = 0
    payload.publication.accounting.loser_count = 1
    expect(() => decodeTrendingPublicDocument(payload, { ...QUERY, direction: 'LOSERS' }, 200)).not.toThrow()
    payload.members[0].conservative_same_direction_change_floor_ratio = '0.00000000'
    expect(() => decodeTrendingPublicDocument(payload, { ...QUERY, direction: 'LOSERS' }, 200)).toThrow()

    const continuation = rankedFixture()
    continuation.query.page_size = 1
    continuation.query.cursor = 'next_1'
    continuation.query.request_known_at = '2026-09-09T12:00:00.000000Z'
    continuation.publication.freshness = 'STALE_RETAINED'
    continuation.members = continuation.members.slice(1)
    const query = { ...QUERY, cursor: 'next_1', page_size: 1 }
    expect(() => decodeTrendingPublicDocument(continuation, query, 200)).not.toThrow()
    continuation.query.request_known_at = '2026-10-08T12:00:00.000000Z'
    expect(() => decodeTrendingPublicDocument(continuation, query, 200)).toThrow()
  })

  it('treats filter member order as irrelevant while binding every filter value', () => {
    const canonicalBackendOrder: any = structuredClone(listFixture)
    canonicalBackendOrder.query.filters = {
      base_item_code: null,
      edition_kind: null,
      item_kind: null,
      wear_tier: null,
    }
    expect(() => decodeTrendingPublicDocument(canonicalBackendOrder, QUERY, 200)).not.toThrow()

    canonicalBackendOrder.query.filters.item_kind = 'KNIFE'
    expect(() => decodeTrendingPublicDocument(canonicalBackendOrder, QUERY, 200))
      .toThrow(TrendingPublicValidationError)
  })

  it('rejects malformed and foreign request values before touching the gateway', async () => {
    const gateway = new FixtureGateway(listFixture)
    const api = new SingleItemTrendingPublicApi(gateway)
    await expect(api.list({ ...QUERY, as_of: '2026-02-30' })).rejects.toThrow('invalid Trending query')
    await expect(api.list({ ...QUERY, page_size: 101 })).rejects.toThrow('invalid Trending query')
    await expect(api.list({ ...QUERY, cursor: 'bad+padding' })).rejects.toThrow('invalid Trending query')
    await expect(api.list({
      ...QUERY,
      filters: { ...QUERY.filters, base_item_code: ' padded ' },
    })).rejects.toThrow('invalid Trending query')
    await expect(api.list(Object.assign({}, QUERY, { provider_url: 'private' })))
      .rejects.toThrow('invalid Trending query')
    expect(gateway.requests).toHaveLength(0)
  })

  it('uses only the independent same-origin bounded GET route with exact filter names', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(listFixture))
    const gateway = new HttpSingleItemTrendingPublicGateway({ fetcher })
    const api = new SingleItemTrendingPublicApi(gateway)
    await api.list(QUERY)

    expect(fetcher).toHaveBeenCalledTimes(1)
    const [target, init] = fetcher.mock.calls[0]
    const url = new URL(String(target), 'https://test.invalid')
    expect(url.pathname).toBe('/api/v1/research-results/public/trending')
    expect(url.pathname).not.toContain('/watchlist')
    expect(Object.fromEntries(url.searchParams)).toEqual({ direction: 'GAINERS', page_size: '50' })
    expect(init).toMatchObject({
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      headers: { Accept: 'application/json' },
    })
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('keeps NOT_PUBLISHED controlled and never substitutes another product response', async () => {
    const result = await new SingleItemTrendingPublicApi(
      new FixtureGateway(notPublishedFixture, 404),
    ).list(QUERY)
    expect(result).toEqual(notPublishedFixture)

    const foreign = {
      api_contract: 'market-watchlist-public-api',
      api_version: 'v1',
      response_kind: 'WATCHLIST',
      query: {},
      members: [],
    }
    await expect(new SingleItemTrendingPublicApi(new FixtureGateway(foreign)).list(QUERY))
      .rejects.toThrow(TrendingPublicValidationError)
  })
})
