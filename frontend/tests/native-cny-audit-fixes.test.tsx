// Review probes F01-F03, kept as regression tests with their original oracles.
// No real network.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NativeCnyMarketDescriptiveGateway, NativeCnyMarketSession, NativeCnyMarketSectorIndexGateway, mapNativeIndexPoint } from '../src/api/NativeCnyMarketGateways'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import { MarketSectorIndexHistory } from '../src/components/MarketSectorIndexHistory'
import { LangProvider } from '../src/i18n'
import { canonicalHash } from '../src/wire/canonical'
import { decodeNativeCnyIndexResponse } from '../src/wire/nativeCnyIndexPublicApi'
import type { NativeCnyIndexPublicDay } from '../src/wire/nativeCnyIndexPublicApi'
import { indexFromForRange, indexRequestLimit, latestDailyReturn, ratioNumber, windowReturn } from '../src/pages/publicMarketIndexChart'
import { formatPublicRatio } from '../src/pages/publicResultShared'
import { formatSignedPercent } from '../src/pages/publicHomeShared'
import { PublicMarketPage } from '../src/pages/PublicMarketPage'
import { exactRelativeDecimal } from '../src/price/exactDisplayDecimal'
import { marketScopeToken } from '../src/watchlist/marketScopeToken'
import type { PersonalWatchlistController } from '../src/watchlist/personalWatchlist'
import { syntheticDay, syntheticHistory, syntheticRoute } from './native-cny-market-fixtures'

const DAY = 86_400_000
const personalWatchlist = Object.freeze({ status: 'READY', entries: Object.freeze([]), pendingKeys: new Set<string>(),
  error: null, has: () => false, toggle: async () => {}, addMany: async () => 0, remove: async () => {},
  clear: async () => {}, importJson: async () => 0, exportJson: () => '', reload: () => {} }) as unknown as PersonalWatchlistController
const shift = (day: string, delta: number) => new Date(Date.parse(`${day}T00:00:00Z`) + delta * DAY).toISOString().slice(0, 10)
const response = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
function fallback(input: RequestInfo | URL): Response {
  const url = new URL(String(input), 'http://127.0.0.1')
  if (url.pathname !== '/api/v3/market-index/public/scopes') throw new Error(`Unexpected synthetic route: ${url.pathname}`)
  const result = syntheticRoute(url.pathname + url.search)
  return response(result.payload, result.status)
}
function gateway(fetcher: typeof fetch) {
  return new NativeCnyMarketSectorIndexGateway(new NativeCnyMarketSession(
    new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }),
  ))
}
function dayAt(date: string): NativeCnyIndexPublicDay {
  const sample = syntheticDay(4, ['ALL'])
  return { ...sample, publication_id: canonicalHash({ audit_date: date }), released_at: `${date}T23:59:00Z`,
    data: { ...sample.data, bucket_date: date, measured_at: `${date}T23:55:00Z`,
      points: sample.data.points.map(point => ({ ...point, segment_number: 1,
        index_display: '10000.00000000', period_return_display: '0.00000000',
        state: 'ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN' as const })) } }
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Real network is forbidden') })))
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('F01: formats a native window just below the 0.05% boundary without a lossy intermediate coordinate', () => {
  const base = 10n ** 22n, last = base + base / 2000n - 1n
  // Exact integer oracle: return * 1000 is strictly below 1/2.
  expect(2n * (last - base) * 1000n < base).toBe(true)
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = dayAt(shift('2026-10-01', index))
    const value = index === 6 ? last : base
    return { ...day, data: { ...day.data, points: day.data.points.map(point => ({ ...point,
      index_display: value.toString(), period_return_display: index === 0 ? null : index === 6 ? '0.00050000' : '0.00000000',
      state: index === 0 ? 'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN' as const : 'ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN' as const,
    })) } }
  })
  for (const day of days) expect(decodeNativeCnyIndexResponse(day, 200, { kind: 'CURRENT' }).kind).toBe('DAY')
  const points = days.map((day, index) => mapNativeIndexPoint(day, days[index - 1]))
  const actual = windowReturn(points, '7D')
  expect(actual).not.toBeNull()
  // Matches the visible V3HistoryResult formatting path. Candidate is expected to fail.
  expect(formatPublicRatio(String(actual), 'en')).toBe(formatPublicRatio('0', 'en'))
})

it('F02: an active native sector overview can drill down after current publication changes beyond TTL', async () => {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(100_000)
  let publication = syntheticDay().publication_id
  const fetcher: typeof fetch = async input => {
    const url = new URL(String(input), 'http://127.0.0.1')
    if (url.pathname === '/api/v1/native-cny/index/day') return response({ ...syntheticDay(), publication_id: publication })
    if (url.pathname === '/api/v1/native-cny/index/history') {
      const q = url.searchParams
      const data = syntheticHistory(q.get('scope')!, q.get('start')!, q.get('end')!)
      return response({ ...data, days: data.days.map(day => day.data.bucket_date === syntheticDay().data.bucket_date
        ? { ...day, publication_id: publication } : day) })
    }
    return fallback(input)
  }
  render(<LangProvider lang="en"><MarketSectorIndexHistory gateway={gateway(fetcher)} scopeCode="ALL" view="SECTORS" /></LangProvider>)
  const weapon = await screen.findByTestId('sector-tile-WEAPON')
  publication = 'f'.repeat(64) // A valid new current publication of the same day.
  clock.mockReturnValue(131_000)
  fireEvent.click(weapon)
  // Candidate holds the parent release pin and enters the native empty state.
  expect(await screen.findByTestId('sector-tile-WEAPON_MODEL:7')).toBeTruthy()
})

it('F03: native 1Y preserves all anchor/tail points without fetching identical complete windows repeatedly', async () => {
  const end = '2026-10-10', from = indexFromForRange(null, end, '1Y')
  const historyUrls: string[] = []
  const fetcher: typeof fetch = async input => {
    const url = new URL(String(input), 'http://127.0.0.1')
    if (url.pathname === '/api/v1/native-cny/index/day') return response(dayAt(end))
    if (url.pathname === '/api/v1/native-cny/index/history') {
      historyUrls.push(url.pathname + url.search)
      const q = url.searchParams, start = q.get('start')!, finish = q.get('end')!, scope = q.get('scope')!
      const days: NativeCnyIndexPublicDay[] = []
      for (let date = start; date <= finish; date = shift(date, 1)) days.push(dayAt(date))
      return response({ ...syntheticHistory(scope, start, finish), days, missing_publication_dates: [] })
    }
    return fallback(input)
  }
  const api = new MarketSectorIndexPublicApi(gateway(fetcher))
  const result = await api.seriesV3Pages({ publication_id: null,
    scope_token: canonicalHash({ contract: 'market-sector-index-public-api', scope_code: 'ALL' }),
    from_date: from, to_date: end, after_date: null, limit: 366 })
  expect(from).toBe('2025-10-09')
  expect(result.response_kind).toBe('INDEX_SERIES')
  if (result.response_kind !== 'INDEX_SERIES') throw new Error('Expected a complete native series')
  expect(result.points).toHaveLength(367)
  // Candidate is predicted to make four identical requests. A valid repair may use
  // one full read or distinct bounded chunks, but must not repeat the same full URL.
  expect(new Set(historyUrls).size).toBe(historyUrls.length)
})

// ---- additions beyond the review probes ----

it('F01: exact window ratio strings keep the exact side of every display threshold', () => {
  expect(exactRelativeDecimal('10045.00000000', '10000.00000000')).toBe('0.0045')
  expect(exactRelativeDecimal('9995.50000000', '10000.00000000')).toBe('-0.00045')
  expect(exactRelativeDecimal('40000', '30000')).toBe(`0.${'3'.repeat(40)}1`)
  expect(exactRelativeDecimal('8794.32310425', '8794.32310425')).toBe('0')
  expect(exactRelativeDecimal('1', '0')).toBeNull()
  expect(exactRelativeDecimal('1e3', '1')).toBeNull()
  const base = 10n ** 22n, ratio = (last: bigint) => exactRelativeDecimal(last.toString(), base.toString())
  // Exactly on the 0.05% tie, just below and just above it (both signs).
  expect(formatPublicRatio(ratio(base + base / 2000n), 'en')).toBe('0.1%')
  expect(formatPublicRatio(ratio(base + base / 2000n - 1n), 'en')).toBe('0%')
  expect(formatPublicRatio(ratio(base + base / 2000n + 1n), 'en')).toBe('0.1%')
  expect(formatPublicRatio(ratio(base - base / 2000n + 1n), 'en')).toBe('-0%')
  expect(formatPublicRatio(ratio(base - base / 2000n), 'en')).toBe('-0.1%')
  expect(formatSignedPercent(ratio(base + base / 2000n - 1n), 'zh')).toBe(formatSignedPercent(0, 'zh'))
  expect(formatSignedPercent(exactRelativeDecimal('10045', '10000'), 'zh')).toBe(formatSignedPercent(0.005, 'zh'))
  // The previous Number path put the exact 0.45% tie on the wrong side.
  expect(formatPublicRatio(String(10045 / 10000 - 1), 'en')).toBe('0.4%')
  expect(formatPublicRatio(exactRelativeDecimal('10045', '10000'), 'en')).toBe('0.5%')
  // Ordinary production-sized strings match the previous Number path.
  for (const [last, first] of [['8833.61614001', '8794.32310425'], ['8402.10000000', '8794.32310425']] as const) {
    const exact = exactRelativeDecimal(last, first)!
    expect(formatPublicRatio(exact, 'zh')).toBe(formatPublicRatio(String(Number(last) / Number(first) - 1), 'zh'))
    expect(ratioNumber(exact)).toBeCloseTo(Number(last) / Number(first) - 1, 12)
  }
})

it('F01: native daily return text uses the producer decimal string', () => {
  const days = Array.from({ length: 2 }, (_, index) => {
    const day = dayAt(shift('2026-10-01', index))
    return { ...day, data: { ...day.data, points: day.data.points.map(point => ({ ...point,
      index_display: index === 0 ? '10000.00000000' : '10004.50000000',
      period_return_display: index === 0 ? null : '0.00045000',
      state: index === 0 ? 'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN' as const : 'ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN' as const,
    })) } }
  })
  for (const day of days) expect(decodeNativeCnyIndexResponse(day, 200, { kind: 'CURRENT' }).kind).toBe('DAY')
  const points = days.map((day, index) => mapNativeIndexPoint(day, days[index - 1]))
  expect(typeof latestDailyReturn(points)).toBe('string')
  expect(formatPublicRatio(latestDailyReturn(points), 'en')).toBe('0%')
  expect(windowReturn(points)).toBe('0.00045')
})

it('F02: a native problem state offers Retry that recovers on the same publication', async () => {
  let failChildren = true
  const fetcher: typeof fetch = async input => {
    const url = new URL(String(input), 'http://127.0.0.1')
    if (url.pathname === '/api/v1/native-cny/index/day') return response(syntheticDay())
    if (url.pathname === '/api/v1/native-cny/index/history') {
      const q = url.searchParams
      if (failChildren && q.get('scope')!.startsWith('WEAPON_MODEL:')) return response({ error: 'unavailable' }, 503)
      return response(syntheticHistory(q.get('scope')!, q.get('start')!, q.get('end')!))
    }
    return fallback(input)
  }
  render(<LangProvider lang="en"><MarketSectorIndexHistory gateway={gateway(fetcher)} scopeCode="ALL" view="SECTORS" /></LangProvider>)
  fireEvent.click(await screen.findByTestId('sector-tile-WEAPON'))
  const retry = await screen.findByRole('button', { name: 'Try again' })
  expect(screen.queryByTestId('sector-tile-WEAPON_MODEL:7')).toBeNull()
  failChildren = false
  fireEvent.click(retry)
  expect(await screen.findByTestId('sector-tile-WEAPON_MODEL:7')).toBeTruthy()
})

it('F02: the native market page rediscovers an ACTIVE overview after a new publication', async () => {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(100_000)
  let publication = syntheticDay().publication_id
  const fetcher: typeof fetch = async input => {
    const url = new URL(String(input), 'http://127.0.0.1')
    if (url.pathname === '/api/v1/native-cny/index/day') return response({ ...syntheticDay(), publication_id: publication })
    if (url.pathname === '/api/v1/native-cny/index/history') {
      const q = url.searchParams
      const data = syntheticHistory(q.get('scope')!, q.get('start')!, q.get('end')!)
      return response({ ...data, days: data.days.map(day => day.data.bucket_date === syntheticDay().data.bucket_date
        ? { ...day, publication_id: publication } : day) })
    }
    return fallback(input)
  }
  const session = new NativeCnyMarketSession(new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }))
  const descriptive = new NativeCnyMarketDescriptiveGateway(session)
  const indexGateway = new NativeCnyMarketSectorIndexGateway(session)
  const page = (scopeToken: string | null) => (
    <LangProvider lang="en">
      <PublicMarketPage gateway={descriptive} indexGateway={indexGateway}
        publicationId={null} scopeToken={scopeToken} catalogHref="/catalog" onCatalogClick={() => {}}
        onSelectPublication={() => {}} onOpenScope={() => {}} onCloseScope={() => {}} personalWatchlist={personalWatchlist} />
    </LangProvider>
  )
  const view = render(page(null))
  await waitFor(() => expect(screen.queryByText(/loading/iu)).toBeNull())
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  publication = 'f'.repeat(64)
  clock.mockReturnValue(131_000)
  view.rerender(page(marketScopeToken('WEAPON')))
  await waitFor(() => expect(screen.queryByText(/loading/iu)).toBeNull())
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  expect(document.body.textContent).not.toContain('No market statistic in this publication')
  expect(screen.getAllByText(/weapon/iu).length).toBeGreaterThan(0)
})

it('F03: native 3M and 1Y windows each issue exactly one history request', async () => {
  for (const range of ['3M', '1Y'] as const) {
    const end = '2026-10-10', from = indexFromForRange(null, end, range)
    const historyUrls: string[] = []
    const fetcher: typeof fetch = async input => {
      const url = new URL(String(input), 'http://127.0.0.1')
      if (url.pathname === '/api/v1/native-cny/index/day') return response(dayAt(end))
      if (url.pathname === '/api/v1/native-cny/index/history') {
        historyUrls.push(url.pathname + url.search)
        const q = url.searchParams, start = q.get('start')!, finish = q.get('end')!
        const days: NativeCnyIndexPublicDay[] = []
        for (let date = start; date <= finish; date = shift(date, 1)) days.push(dayAt(date))
        return response({ ...syntheticHistory(q.get('scope')!, start, finish), days, missing_publication_dates: [] })
      }
      return fallback(input)
    }
    const result = await new MarketSectorIndexPublicApi(gateway(fetcher)).seriesV3Pages({ publication_id: null,
      scope_token: canonicalHash({ contract: 'market-sector-index-public-api', scope_code: 'ALL' }),
      from_date: from, to_date: end, after_date: null, limit: indexRequestLimit(range) })
    if (result.response_kind !== 'INDEX_SERIES') throw new Error('Expected a complete native series')
    expect(result.points.at(0)!.date).toBe(from)
    expect(result.points.at(-1)!.date).toBe(end)
    expect(result.points.length).toBe(Math.round((Date.parse(end) - Date.parse(from)) / DAY) + 1)
    expect(historyUrls).toHaveLength(1)
  }
})
