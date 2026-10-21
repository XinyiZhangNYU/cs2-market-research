import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { HttpNativeCnyTrendingGateway } from '../src/api/HttpNativeCnyTrendingGateway'
import { NativeCnyTrendingPublicGateway } from '../src/api/NativeCnyTrendingPublicGateway'
import { SingleItemTrendingPublicApi, type TrendingListOptions } from '../src/api/SingleItemTrendingPublicApi'
import { CatalogDisplayApi, type CatalogDisplayGatewayRequest, type CatalogDisplayQueryGatewayRequest } from '../src/api/CatalogDisplayApi'
import type { NativeTrendingList } from '../src/trending/nativeCnyTrendingPresentation'
import { LangProvider } from '../src/i18n'
import { HomeMovers } from '../src/pages/PublicHomeModules'
import { PublicTrendingPage } from '../src/pages/PublicTrendingPage'
import type { TrendingDirection, TrendingFilters } from '../src/wire/singleItemTrendingPublicApiTypes'
import { EMPTY_FILTERS, fixtureNow, nativeFixtureResponse, nativePublicFixture, NATIVE_QUERY, SyntheticTrendingCatalog } from './native-cny-trending-public-fixtures'

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const unavailable = { api_contract: 'catalog-display-query-api', api_version: 'v1', response_kind: 'ERROR',
  error: { code: 'BACKEND_UNAVAILABLE', http_status: 503, retryable: true } }
class DelayedCatalog extends SyntheticTrendingCatalog {
  snapshotMs = 0
  detailDelay = (_id: string) => 0
  attempts = new Map<string, number>()
  failures = new Map<string, number>()
  snapshotFails = false
  inFlight = 0
  peak = 0
  lastCompletedAt = 0
  override async read(request: CatalogDisplayGatewayRequest) {
    if (this.snapshotMs) await pause(this.snapshotMs)
    if (this.snapshotFails) throw new Error('snapshot transport unavailable')
    return super.read(request)
  }
  override async readQuery(request: CatalogDisplayQueryGatewayRequest) {
    if (request.operation !== 'CATALOG_QUERY_DETAIL') throw new Error('unexpected query')
    const id = request.query.analysis_unit_id
    const attempt = (this.attempts.get(id) ?? 0) + 1
    this.attempts.set(id, attempt)
    this.inFlight++; this.peak = Math.max(this.peak, this.inFlight)
    try {
      const delay = this.detailDelay(id)
      if (delay) await pause(delay) // deliberately ignores AbortSignal
      if (attempt <= (this.failures.get(id) ?? 0)) return structuredClone(unavailable)
      return await super.readQuery(request)
    } finally { this.inFlight--; this.lastCompletedAt = Date.now() }
  }
}
function setup(delayed = false) {
  const catalog = new DelayedCatalog()
  catalog.missing.clear()
  if (delayed) {
    catalog.snapshotMs = 290
    catalog.detailDelay = (id) => ['item:5', 'item:25'].includes(id) ? 1600 : 270
  }
  const fetcher = vi.fn(async () => {
    if (delayed) await pause(600)
    return nativeFixtureResponse(nativePublicFixture(50))
  })
  const gateway = new NativeCnyTrendingPublicGateway(catalog, new HttpNativeCnyTrendingGateway(fetcher), fixtureNow)
  return { catalog, fetcher, gateway, api: new SingleItemTrendingPublicApi(gateway) }
}
function Page({ gateway }: { gateway: NativeCnyTrendingPublicGateway }) {
  const [direction, setDirection] = useState<TrendingDirection>('GAINERS')
  const [filters, setFilters] = useState<TrendingFilters>(EMPTY_FILTERS)
  return <PublicTrendingPage gateway={gateway} asOf={null} publicationId={null} direction={direction} filters={filters}
    catalogHref="/catalog" onCatalogClick={() => {}} onQueryChange={(d, f) => { setDirection(d); setFilters(f) }} />
}
beforeAll(async () => {
  // Measure transport delays, not Vitest's real-time dynamic-module loader.
  const catalog = new SyntheticTrendingCatalog(), api = new CatalogDisplayApi(catalog)
  await api.listSnapshots({ query: { query_as_of: '2026-10-11T12:00:00.000000Z', known_at: '2026-10-11T12:00:00.000000Z', sort: 'AS_OF_DESC', page_size: 1 }, cursor: null })
  await api.detail({ query: { snapshot_id: catalog.snapshot.snapshot_id, analysis_unit_id: 'item:1', page_size: 1 }, cursor: null })
})

afterEach(async () => {
  cleanup()
  // A failed assertion must not strand an abort-ignoring fake transport in
  // the session-wide limiter when the next test switches back to real time.
  if (vi.isFakeTimers()) await vi.runAllTimersAsync()
  vi.useRealTimers(); vi.restoreAllMocks()
})

describe('demand, progressive rows, failure isolation and cache', () => {
  it('home enriches only five displayed rows and records controlled completion time', async () => {
    vi.useFakeTimers()
    const { gateway, catalog } = setup(true)
    const start = Date.now()
    render(<LangProvider lang="zh"><HomeMovers gateway={gateway} href="/trending" onClick={() => {}} /></LangProvider>)
    await act(async () => { await vi.advanceTimersByTimeAsync(600) })
    const home = screen.getByTestId('home-movers')
    expect(home.querySelectorAll('li')).toHaveLength(5)
    expect(home.querySelectorAll('[data-catalog-state="LOADING"]')).toHaveLength(5)
    expect(home).toHaveTextContent('+500.0%')
    expect(home).not.toHaveTextContent('Synthetic')
    expect(catalog.attempts.size).toBe(0)
    await act(async () => { await vi.advanceTimersByTimeAsync(561) })
    expect(home.querySelectorAll('[data-catalog-state="READY"]')).toHaveLength(4)
    await act(async () => { await vi.runAllTimersAsync() })
    expect(home.querySelectorAll('[data-catalog-state="READY"]')).toHaveLength(5)
    expect(catalog.attempts.size).toBe(5)
    expect(catalog.peak).toBeLessThanOrEqual(4)
    expect(catalog.lastCompletedAt - start).toBeGreaterThanOrEqual(2760)
    expect(catalog.lastCompletedAt - start).toBeLessThan(2800)
    console.info(`M13C_SIM_HOME_COMPLETE_MS=${catalog.lastCompletedAt - start} rows=5 detail_requests=5`)
  })
  it('page shows native rows at 600ms, replaces each row in order, and gates filters until one direction is ready', async () => {
    vi.useFakeTimers()
    const { gateway, catalog } = setup(true)
    render(<LangProvider lang="zh"><Page gateway={gateway} /></LangProvider>)
    await act(async () => { await vi.advanceTimersByTimeAsync(599) })
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    const rows = screen.getByRole('list'), original = Array.from(rows.children)
    expect(original).toHaveLength(50)
    expect(rows).toHaveTextContent('+500.0%')
    expect(rows).toHaveTextContent('三个市场同向')
    expect(rows).not.toHaveTextContent('Synthetic fallback')
    screen.getAllByRole('combobox').forEach((e) => expect(e).toBeDisabled())
    expect(screen.getByTestId('public-trending-image-1')).toHaveAttribute('data-image-status', 'LOADING')
    await act(async () => { await vi.advanceTimersByTimeAsync(561) })
    expect(within(rows).getByText('合成步枪 | 样例 1')).toBeVisible()
    expect(rows.querySelectorAll('[data-catalog-state="LOADING"]').length).toBeGreaterThan(0)
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000) })
    expect(catalog.attempts.size).toBe(50)
    expect(Array.from(rows.children)).toEqual(original)
    screen.getAllByRole('combobox').forEach((e) => expect(e).toBeEnabled())
    fireEvent.change(screen.getByLabelText('商品类型'), { target: { value: 'KNIFE' } })
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(screen.getByRole('list').children).toHaveLength(25)
    expect(screen.getByRole('list').firstElementChild).toHaveTextContent('02')
    expect(catalog.attempts.size).toBe(50)
    fireEvent.click(screen.getByRole('button', { name: '跌幅榜' }))
    expect(screen.queryByText('+500.0%')).not.toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000) })
    expect(catalog.attempts.size).toBe(100)
    expect(screen.queryByText('+500.0%')).not.toBeInTheDocument()
    expect(catalog.peak).toBeLessThanOrEqual(4)
  })
  it('records exact simulated native first-row and direction-complete timings', async () => {
    vi.useFakeTimers()
    const { api, catalog } = setup(true), start = Date.now()
    const progress: { ms: number; doc: NativeTrendingList }[] = []
    const pending = api.list(NATIVE_QUERY, { onProgress: (doc) => {
      if (doc.response_kind === 'TRENDING_LIST' && doc.api_version === 'native-cny') progress.push({ ms: Date.now() - start, doc })
    } }).then((doc) => ({ ms: Date.now() - start, doc }))
    await vi.runAllTimersAsync()
    const result = await pending
    expect(progress[0].ms).toBe(600)
    expect(result.ms).toBeLessThan(10_000)
    expect(result.doc).toMatchObject({ catalog_status: 'READY', total: 50 })
    expect(catalog.attempts.size).toBe(50)
    expect(progress.every(({doc})=>doc.members.every((m,i)=>m.rank===i+1))).toBe(true)
    console.info(`M13C_SIM_PAGE_FIRST_ROWS_MS=${progress[0].ms} DIRECTION_COMPLETE_MS=${result.ms} detail_requests=50`)
  })
  it.each([1, 2])('503 attempts=%s recovers or falls back only that row, with no failure caching', async (failures) => {
    const { api, catalog } = setup()
    catalog.failures.set('item:1', failures)
    const value = await api.list(NATIVE_QUERY)
    expect(value).toMatchObject({ response_kind: 'TRENDING_LIST', total: 50, missing_catalog_count: failures === 1 ? 0 : 1 })
    expect(catalog.attempts.get('item:1')).toBe(2)
    if (value.response_kind !== 'TRENDING_LIST') throw Error('missing')
    expect(value.members[1].catalog.localized_name.zh_cn).toContain('合成刀具')
    if (failures === 2) {
      expect(value.members[0].catalog.localized_name.zh_cn).toBe('Synthetic fallback 1')
      await api.list(NATIVE_QUERY)
      expect(catalog.attempts.get('item:1')).toBe(3)
    }
    expect(catalog.attempts.get('item:2')).toBe(1)
  })
  it('NOT_FOUND is not retried or cached', async () => {
    const { api, catalog } = setup()
    catalog.missing.add('item:4')
    await api.list(NATIVE_QUERY); await api.list(NATIVE_QUERY)
    expect(catalog.attempts.get('item:4')).toBe(2)
    expect(catalog.attempts.get('item:1')).toBe(1)
  })
  it('snapshot failure keeps all native rows, fallback and unavailable filters; failure not cached', async () => {
    const { gateway, catalog } = setup()
    catalog.snapshotFails = true
    render(<LangProvider lang="zh"><Page gateway={gateway} /></LangProvider>)
    expect(await screen.findByText('Synthetic fallback 1')).toBeVisible()
    expect(screen.getByRole('list').children).toHaveLength(50)
    screen.getAllByRole('combobox').forEach((e)=>expect(e).toBeDisabled())
    expect(catalog.attempts.size).toBe(0)
    catalog.snapshotFails = false
    expect(await new SingleItemTrendingPublicApi(gateway).list(NATIVE_QUERY)).toMatchObject({ catalog_status: 'READY', missing_catalog_count: 0 })
  })
  it('keeps immutable details after pointer TTL and separates new snapshots', async () => {
    const { api, catalog, fetcher } = setup()
    const now = vi.spyOn(Date, 'now').mockReturnValue(100_000)
    await api.list(NATIVE_QUERY)
    now.mockReturnValue(200_000)
    await api.list(NATIVE_QUERY)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(catalog.attempts.get('item:1')).toBe(1)
    expect(catalog.requests.filter(r=>r.operation==='CATALOG_DISPLAY_SNAPSHOT_LIST')).toHaveLength(2)
    catalog.snapshot.snapshot_id = 'd'.repeat(64)
    now.mockReturnValue(300_000)
    await api.list(NATIVE_QUERY)
    expect(catalog.attempts.get('item:1')).toBe(2)
  })
  it('evicts detail LRU beyond 400 entries without extending pointer TTL', async () => {
    const { api, catalog } = setup()
    const now = vi.spyOn(Date, 'now')
    for (let batch=0; batch<5; batch++) {
      now.mockReturnValue(100_000 + batch * 40_000)
      catalog.snapshot.snapshot_id = String(batch+1).repeat(64)
      await api.list(NATIVE_QUERY)
      await api.list({ ...NATIVE_QUERY, direction: 'LOSERS' })
    }
    expect(catalog.attempts.get('item:1')).toBe(5)
    now.mockReturnValue(500_000); catalog.snapshot.snapshot_id='1'.repeat(64)
    await api.list(NATIVE_QUERY, { nativeLimit: 5 })
    expect(catalog.attempts.get('item:1')).toBe(6)
  })
  it('deduplicates active subscribers; cancelling one keeps the other and globally caps slow aborted transports', async () => {
    vi.useFakeTimers()
    const { api, gateway, catalog } = setup()
    catalog.detailDelay = () => 270
    const controller = new AbortController(), updates = vi.fn()
    const options: TrendingListOptions = { signal: controller.signal, nativeLimit: 5, onProgress: updates }
    const aborted = api.list(NATIVE_QUERY, options)
    const assertion = expect(aborted).rejects.toMatchObject({ name: 'AbortError' })
    const kept = api.list(NATIVE_QUERY, { nativeLimit: 5 })
    await vi.advanceTimersByTimeAsync(1)
    controller.abort(); const count = updates.mock.calls.length
    const restarted = new SingleItemTrendingPublicApi(gateway).list({ ...NATIVE_QUERY, direction:'LOSERS' })
    await vi.runAllTimersAsync(); await assertion
    expect(await kept).toMatchObject({ total: 5 })
    expect(await restarted).toMatchObject({ total: 50 })
    expect(catalog.attempts.size).toBe(55)
    expect(catalog.attempts.get('item:1')).toBe(1)
    expect(updates).toHaveBeenCalledTimes(count)
    expect(catalog.peak).toBeLessThanOrEqual(4)
  })
  it('caps actual transports across adapter instances, including cancelled transports still settling', async () => {
    vi.useFakeTimers()
    const first = setup(), second = setup()
    let active = 0, peak = 0
    for (const { catalog } of [first, second]) {
      catalog.detailDelay = () => 270
      const read = catalog.readQuery.bind(catalog)
      vi.spyOn(catalog, 'readQuery').mockImplementation(async (request) => {
        active++; peak = Math.max(peak, active)
        try { return await read(request) } finally { active-- }
      })
    }
    const controller = new AbortController()
    const cancelled = first.api.list(NATIVE_QUERY, { signal: controller.signal })
    const assertion = expect(cancelled).rejects.toMatchObject({ name: 'AbortError' })
    await vi.advanceTimersByTimeAsync(1)
    expect(active).toBe(4)
    controller.abort()
    const current = second.api.list({ ...NATIVE_QUERY, direction: 'LOSERS' })
    await vi.runAllTimersAsync()
    await assertion
    expect(await current).toMatchObject({ total: 50, catalog_status: 'READY' })
    expect(peak).toBe(4)
    expect(first.catalog.attempts.size).toBe(4)
  })
  it('does not retain a partially enriched home value as a settled return cache', async () => {
    vi.useFakeTimers()
    const { gateway, catalog } = setup(true)
    const view = (active: boolean) => <LangProvider lang="zh"><HomeMovers active={active} gateway={gateway} href="/trending" onClick={() => {}} /></LangProvider>
    const { rerender } = render(view(true))
    await act(async () => { await vi.advanceTimersByTimeAsync(600) })
    expect(screen.getByTestId('home-movers').querySelectorAll('[data-catalog-state="LOADING"]')).toHaveLength(5)
    rerender(view(false))
    await act(async () => { await vi.runAllTimersAsync() })
    expect(catalog.attempts.size).toBe(0)
    rerender(view(true))
    await act(async () => { await vi.runAllTimersAsync() })
    expect(screen.getByTestId('home-movers').querySelectorAll('[data-catalog-state="READY"]')).toHaveLength(5)
    expect(catalog.attempts.size).toBe(5)
  })
  it('does not admit unsealed transport progress through the public API', async () => {
    const update = vi.fn()
    const api = new SingleItemTrendingPublicApi({ kind: 'UNTRUSTED', read: async (_query, options) => {
      const response = { payload: { nativeTrendingProjection: true }, httpStatus: 200 }
      options?.onProgress?.(response)
      return response
    } })
    await expect(api.list(NATIVE_QUERY, { onProgress: update })).rejects.toThrow('Unsealed native progress')
    expect(update).not.toHaveBeenCalled()
  })
})
