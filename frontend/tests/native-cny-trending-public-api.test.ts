import { describe, expect, it, vi } from 'vitest'
import { canonicalHash } from '../src/wire/canonical'
import { CatalogDisplayApi } from '../src/api/CatalogDisplayApi'
import { decodeCurrentNativeCnyTrendingDay, HttpNativeCnyTrendingGateway } from '../src/api/HttpNativeCnyTrendingGateway'
import { NativeCnyTrendingPublicGateway, nativeTrendingProjection } from '../src/api/NativeCnyTrendingPublicGateway'
import { SingleItemTrendingPublicApi } from '../src/api/SingleItemTrendingPublicApi'
import { createTrendingPublicGateway, nativeCnyTrendingEnabled } from '../src/api/nativeCnyTrendingConfig'
import { formatNativeTrendingPercent } from '../src/trending/nativeCnyTrendingPresentation'
import { exactRatio, fixtureNow, nativePublicFixture, nativeFixtureResponse, NATIVE_QUERY, SyntheticTrendingCatalog } from './native-cny-trending-public-fixtures'

function setup(perDirection = 4) {
  const value = nativePublicFixture(perDirection), catalog = new SyntheticTrendingCatalog()
  const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => nativeFixtureResponse(value))
  const gateway = new NativeCnyTrendingPublicGateway(catalog, new HttpNativeCnyTrendingGateway(fetcher), fixtureNow)
  return { value, catalog, fetcher, gateway, api: new SingleItemTrendingPublicApi(gateway) }
}

describe('current native Trending decoding and exact percent', () => {
  it('binds the default browser fetch receiver, not the bounded-request options object', async () => {
    const value = nativePublicFixture()
    const original = globalThis.fetch
    globalThis.fetch = function (this: unknown) {
      expect(this).toBe(globalThis)
      return Promise.resolve(nativeFixtureResponse(value))
    }
    try {
      expect((await new HttpNativeCnyTrendingGateway().current()).members).toHaveLength(8)
    } finally { globalThis.fetch = original }
  })
  it('discovers current bindings without a URL query; preserves signed exact ratios', async () => {
    const { value, fetcher, gateway } = setup()
    const day = decodeCurrentNativeCnyTrendingDay(value)
    expect(day.members).toHaveLength(8)
    expect(day.members[4].returnExact.numerator_hex).toMatch(/^-/)
    await gateway.read(NATIVE_QUERY)
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/native-cny/trending/day')
  })
  it.each(['contract', 'schema', 'currency', 'fx', 'hash', 'bodyHash', 'direction', 'id', 'zero', 'hex', 'negativeDenominator', 'rankGap', 'rankDuplicate', 'order', 'evidence', 'clock'])(
    'rejects whole publication on %s', (failure) => {
      const value = nativePublicFixture(), row = value.data.members[0]
      if (failure === 'contract') value.api_contract = 'wrong'
      if (failure === 'schema') value.data.schema = 'wrong'
      if (failure === 'currency') value.data.currency = 'USD'
      if (failure === 'fx') value.data.fx_applied = true
      if (failure === 'hash') value.rights_sha256 = 'not-hash'
      if (failure === 'direction') row.direction = 'SIDEWAYS'
      if (failure === 'id') row.analysis_unit_id = 'item:no'
      if (failure === 'zero') row.return_exact.denominator_hex = '0'
      if (failure === 'hex') row.return_exact.numerator_hex = '0xAB'
      if (failure === 'negativeDenominator') row.return_exact.denominator_hex = '-2'
      if (failure === 'rankGap') value.data.members[1].rank = 3
      if (failure === 'rankDuplicate') value.data.members[1].rank = 1
      if (failure === 'order') value.data.members[1].return_exact = exactRatio(9n, 10n)
      if (failure === 'evidence') row.supporting_source_count = 2
      if (failure === 'clock') value.data.input_available_at = '2026-10-03T00:00:00Z'
      value.public_sha256 = failure === 'bodyHash' ? '0'.repeat(64) : canonicalHash(value.data)
      expect(() => decodeCurrentNativeCnyTrendingDay(value)).toThrow()
    },
  )
  it.each(['zh', 'en'] as const)('rounds signed boundaries exactly in %s', (lang) => {
    expect(formatNativeTrendingPercent(exactRatio(2178n, 1000n), lang)).toBe('+217.8%')
    expect(formatNativeTrendingPercent(exactRatio(-5683n, 10000n), lang)).toBe('-56.8%')
    expect(formatNativeTrendingPercent(exactRatio(1n, 2000n), lang)).toBe('+0.1%')
    expect(formatNativeTrendingPercent(exactRatio(-1n, 2000n), lang)).toBe('-0.1%')
    expect(formatNativeTrendingPercent(exactRatio(1n, 2001n), lang, false)).toBe('+0.0%')
    expect(formatNativeTrendingPercent(exactRatio(-1n, 2001n), lang, false)).toBe('-0.0%')
    expect(formatNativeTrendingPercent(exactRatio(-1n, 2001n), lang)).not.toContain('0.0%')
  })
  it('never loses arbitrary-size integers or near-half rounding to Number', () => {
    expect(formatNativeTrendingPercent(exactRatio(900719925474099312345n, 10n), 'en')).toBe('+9,007,199,254,740,993,123,450.0%')
    const d = 10n ** 200n
    expect(formatNativeTrendingPercent(exactRatio(d + d / 2000n - 1n, d), 'en')).toBe('+100.0%')
    expect(formatNativeTrendingPercent(exactRatio(d + d / 2000n, d), 'en')).toBe('+100.1%')
  })
})

describe('native adapter and catalog enrichment', () => {
  it('accepts the synthetic catalog through the unchanged snapshot and detail validators', async () => {
    const catalog = new SyntheticTrendingCatalog(), api = new CatalogDisplayApi(catalog)
    await api.listSnapshots({ query: { query_as_of: '2026-10-11T00:00:00.000000Z', known_at: '2026-10-11T00:00:00.000000Z',
      page_size: 1, sort: 'AS_OF_DESC' }, cursor: null })
    expect(await api.detail({ query: { snapshot_id: catalog.snapshot.snapshot_id, analysis_unit_id: 'item:1', page_size: 1 }, cursor: null }))
      .toMatchObject({ response_kind: 'CATALOG_QUERY_DETAIL' })
  })
  it('validates only the selected direction, caches successes, caps concurrency at four', async () => {
    const { catalog, api, fetcher } = setup(50)
    catalog.delayMs = 1
    const first = await api.list(NATIVE_QUERY)
    expect(first).toMatchObject({ api_version: 'native-cny', total: 50, next_cursor: null, missing_catalog_count: 1 })
    if (first.response_kind !== 'TRENDING_LIST') throw new Error('not ready')
    expect(first.members[0].catalog.localized_name.zh_cn).toContain('合成步枪')
    expect(first.members[0].catalog.media).toMatchObject({ status: 'BOUND', media_key: 'synthetic/1', media_asset_version_id: '105' })
    expect(first.members[3].catalog).toMatchObject({ item_kind: 'UNKNOWN', base_item_code: 'UNKNOWN', edition_kind: 'UNKNOWN',
      wear_tier: 'UNKNOWN', localized_name: { en: 'Synthetic fallback 4', zh_cn: 'Synthetic fallback 4' }, media: { status: 'NOT_PRODUCED' } })
    expect(first.members[0]).not.toHaveProperty('measurement_id')
    expect(first.members[0]).not.toHaveProperty('tie_break_key')
    expect(first.publication).not.toHaveProperty('freshness')
    expect(Object.isFrozen(first.members[0].catalog)).toBe(true)
    const count = catalog.requests.length
    expect(count).toBe(51) // one snapshot + current direction only
    await api.list({ ...NATIVE_QUERY, direction: 'LOSERS' })
    expect(catalog.requests.length).toBe(101)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(catalog.maxActive).toBe(4)
  })
  it.each([
    [{ item_kind: 'WEAPON' }, [1, 3]], [{ base_item_code: 'synthetic.bayonet' }, [2]],
    [{ edition_kind: 'STATTRAK' }, [3]], [{ wear_tier: 'FACTORY_NEW' }, [2]], [{ item_kind: 'UNKNOWN' }, [4]],
  ] as const)('filters %o locally without renumbering', async (filter, ranks) => {
    const { api } = setup()
    const result = await api.list({ ...NATIVE_QUERY, filters: { ...NATIVE_QUERY.filters, ...filter } })
    if (result.response_kind !== 'TRENDING_LIST') throw new Error('not ready')
    expect(result.members.map((member) => member.rank)).toEqual(ranks)
  })
  it('filters all dimensions together; no match is a valid empty list', async () => {
    const { api } = setup()
    const query = { ...NATIVE_QUERY, direction: 'LOSERS' as const,
      filters: { item_kind: 'WEAPON' as const, base_item_code: 'synthetic.ak47', edition_kind: 'STATTRAK' as const, wear_tier: 'FIELD_TESTED' as const } }
    expect(await api.list(query)).toMatchObject({ total: 0, members: [] })
  })
  it('does not substitute current for a mismatched pinned URL', async () => {
    const { api } = setup()
    expect(await api.list({ ...NATIVE_QUERY, publication_id: '9'.repeat(64) })).toMatchObject({ response_kind: 'ERROR' })
    expect(await api.list({ ...NATIVE_QUERY, as_of: '2020-01-01' })).toMatchObject({ response_kind: 'ERROR' })
    expect(await api.list({ ...NATIVE_QUERY, cursor: 'old_cursor' })).toMatchObject({ response_kind: 'ERROR' })
  })
  it('does not accept cloned projection handles, wrong query or status', async () => {
    const { gateway } = setup()
    const response = await gateway.read(NATIVE_QUERY)
    expect(nativeTrendingProjection(structuredClone(response.payload), NATIVE_QUERY, 200)).toBeNull()
    expect(() => nativeTrendingProjection(response.payload, { ...NATIVE_QUERY, direction: 'LOSERS' }, 200)).toThrow()
    expect(() => nativeTrendingProjection(response.payload, NATIVE_QUERY, 503)).toThrow()
  })
  it.each([404, 503, 400, 200])('maps %s / invalid wire to empty and never calls catalog or legacy', async (status) => {
    const catalog = new SyntheticTrendingCatalog(), fetcher = vi.fn(async () => nativeFixtureResponse({
      api_contract: 'native-cny-trending-day/1', error: status === 404 ? 'NOT_PUBLISHED' : status === 503 ? 'TEMPORARILY_UNAVAILABLE' : 'INVALID_REQUEST',
    }, status))
    const gateway = new NativeCnyTrendingPublicGateway(catalog, new HttpNativeCnyTrendingGateway(fetcher), fixtureNow)
    expect(await new SingleItemTrendingPublicApi(gateway).list(NATIVE_QUERY)).toMatchObject({ response_kind: 'ERROR', error: { code: 'NOT_PUBLISHED' } })
    expect(catalog.requests).toHaveLength(0)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('falls back per row on catalog outage without discarding native results', async () => {
    const { catalog, api } = setup()
    vi.spyOn(catalog, 'readQuery').mockResolvedValue({ api_contract: 'catalog-display-query-api', api_version: 'v1',
      response_kind: 'ERROR', error: { code: 'BACKEND_UNAVAILABLE', http_status: 503, retryable: true } })
    expect(await api.list(NATIVE_QUERY)).toMatchObject({ response_kind: 'TRENDING_LIST', total: 4, missing_catalog_count: 4 })
  })
  it('subscriber abort leaves another subscriber intact; no duplicate batch', async () => {
    const { api, catalog, fetcher } = setup()
    catalog.delayMs = 10
    const abort = new AbortController()
    const first = api.list(NATIVE_QUERY, { signal: abort.signal })
    const assertion = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    const second = api.list({ ...NATIVE_QUERY, direction: 'LOSERS' })
    abort.abort()
    await assertion
    expect(await second).toMatchObject({ total: 4 })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(catalog.requests).toHaveLength(5)
  })
  it('expires memory cache and rechecks current publication; no failed response retained', async () => {
    const { api, fetcher } = setup()
    const time = vi.spyOn(Date, 'now').mockReturnValue(100_000)
    try {
      await api.list(NATIVE_QUERY)
      time.mockReturnValue(130_001)
      fetcher.mockImplementation(async () => nativeFixtureResponse({ api_contract: 'native-cny-trending-day/1', error: 'NOT_PUBLISHED' }, 404))
      expect(await api.list(NATIVE_QUERY)).toMatchObject({ response_kind: 'ERROR' })
      await api.list(NATIVE_QUERY)
      expect(fetcher).toHaveBeenCalledTimes(3)
    } finally { time.mockRestore() }
  })
  it('cancel/restart never exceeds four underlying catalog calls, even when transport ignores abort', async () => {
    const { api, catalog } = setup(10)
    catalog.delayMs = 20
    const controller = new AbortController()
    const first = api.list(NATIVE_QUERY, { signal: controller.signal })
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    await vi.waitFor(() => expect(catalog.active).toBe(4), { interval: 1 })
    controller.abort()
    const next = api.list(NATIVE_QUERY)
    await rejected
    expect(await next).toMatchObject({ total: 10 })
    expect(catalog.maxActive).toBeLessThanOrEqual(4)
  })
  it('rejects changed snapshot metadata even if individual catalog docs validate', async () => {
    const { api, catalog } = setup()
    const original = catalog.readQuery.bind(catalog)
    vi.spyOn(catalog, 'readQuery').mockImplementation(async (request) => {
      const doc = await original(request)
      if ('snapshot' in doc) doc.snapshot.member_count = 99
      return doc
    })
    expect(await api.list(NATIVE_QUERY)).toMatchObject({ response_kind: 'TRENDING_LIST', total: 4, missing_catalog_count: 4 })
  })
  it('defaults ON; explicit OFF constructs the unchanged legacy gateway', () => {
    const catalog = new SyntheticTrendingCatalog()
    expect(nativeCnyTrendingEnabled(undefined)).toBe(true)
    for (const value of ['0', 'false']) {
      expect(nativeCnyTrendingEnabled(value)).toBe(false)
      expect(createTrendingPublicGateway(catalog, nativeCnyTrendingEnabled(value)).kind).not.toBe('NATIVE_CNY_TRENDING')
    }
    expect(createTrendingPublicGateway(catalog, true).kind).toBe('NATIVE_CNY_TRENDING')
  })
})
