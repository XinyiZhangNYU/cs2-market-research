// Publication-epoch regression tests: a page never mixes values from two publications,
// cached children revalidate their parent release, and recovery follows CURRENT at most once.
// Sector cards keep their two-decimal signed format, fed by the exact ratio. No real network.
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NativeCnyMarketDescriptiveGateway, NativeCnyMarketSession, NativeCnyMarketSectorIndexGateway } from '../src/api/NativeCnyMarketGateways'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { MarketSectorIndexHistory } from '../src/components/MarketSectorIndexHistory'
import { SectorHeatmap } from '../src/components/PublicMarketIndexCharts'
import { LangProvider } from '../src/i18n'
import { PublicMarketPage } from '../src/pages/PublicMarketPage'
import { formatPublicRatio } from '../src/pages/publicResultShared'
import { exactRelativeDecimal } from '../src/price/exactDisplayDecimal'
import type { NativeCnyIndexPublicDay } from '../src/wire/nativeCnyIndexPublicApi'
import type { PersonalWatchlistController } from '../src/watchlist/personalWatchlist'
import { syntheticDay, syntheticHistory, syntheticRoute } from './native-cny-market-fixtures'

const alpha = syntheticDay().publication_id
const beta = 'f'.repeat(64)
const response = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
const watchlist = Object.freeze({ status: 'READY', entries: Object.freeze([]), pendingKeys: new Set<string>(),
  error: null, has: () => false, toggle: async () => {}, addMany: async () => 0, remove: async () => {},
  clear: async () => {}, importJson: async () => 0, exportJson: () => '', reload: () => {} }) as unknown as PersonalWatchlistController
const unavailable = () => response({ api_contract: 'native-cny-index-day/1', error: 'TEMPORARILY_UNAVAILABLE' }, 503)

beforeEach(() => vi.stubGlobal('fetch', vi.fn(async () => { throw Error('REAL_FETCH_FORBIDDEN') })))
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

function harness() {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(100_000)
  let current = alpha
  let currentReads = 0
  let historyReads = 0
  let namesDelayMs = 0
  // Failure and hold are fixed when a read starts, so a held read keeps its own outcome.
  let currentFailure: (() => Response) | null = null
  let currentHold: Promise<void> | null = null
  let historyFails = false
  let historyHold: Promise<void> | null = null
  const patch = (day: NativeCnyIndexPublicDay): NativeCnyIndexPublicDay => ({ ...day,
    publication_id: day.data.bucket_date === syntheticDay().data.bucket_date ? current : day.publication_id,
    data: { ...day.data, points: day.data.points.map((p) => current === beta && day.data.bucket_date === syntheticDay().data.bucket_date ? ({ ...p,
      // Same-day corrected tail: 10201 * 1.02 = 10405.02; preceding publications are untouched.
      index_display: p.index_display === null ? null : '10405.02000000',
      period_return_display: p.period_return_display === null ? null : '0.02000000',
      ask_sum_cny_display: '140000.28000000',
    }) : p) },
  })
  const historySignals: (AbortSignal | null | undefined)[] = []
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input), 'http://127.0.0.1')
    if (url.pathname === '/api/v1/native-cny/index/day') {
      currentReads += 1
      const failure = currentFailure, hold = currentHold
      currentHold = null
      // Deliberately ignores transport abort, like a slow network.
      if (hold !== null) await hold
      return failure === null ? response(patch(syntheticDay())) : failure()
    }
    if (url.pathname === '/api/v1/native-cny/index/history') {
      historyReads += 1
      historySignals.push(init?.signal)
      const hold = historyHold, fails = historyFails
      const q = url.searchParams, h = syntheticHistory(q.get('scope')!, q.get('start')!, q.get('end')!)
      const body = { ...h, days: h.days.map(patch) }
      // Deliberately ignores transport abort, like a slow network.
      if (hold !== null) await hold
      return fails ? unavailable() : response(body)
    }
    if (url.pathname !== '/api/v3/market-index/public/scopes') throw Error(`Unexpected route ${url.pathname}`)
    if (namesDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, namesDelayMs))
    const data = syntheticRoute(url.pathname + url.search)
    return response(data.payload, data.status)
  }
  const session = new NativeCnyMarketSession(new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }))
  return { index: new NativeCnyMarketSectorIndexGateway(session), descriptive: new NativeCnyMarketDescriptiveGateway(session),
    switchPublication: (delayNames = 0) => { current = beta; namesDelayMs = delayNames; clock.mockReturnValue(131_000) },
    expireCurrent: () => clock.mockReturnValue(131_000),
    at: (now: number) => clock.mockReturnValue(now),
    historySignals,
    failCurrent: (failure: (() => Response) | null) => { currentFailure = failure },
    holdCurrent: (hold: Promise<void>) => { currentHold = hold },
    failHistory: (fails: boolean) => { historyFails = fails },
    holdHistory: (hold: Promise<void> | null) => { historyHold = hold },
    currentReads: () => currentReads, historyReads: () => historyReads }
}
function page(h: ReturnType<typeof harness>, pin: string | null = null, requestedView: 'MARKET' | 'SECTORS' = 'MARKET') {
  return <LangProvider lang="en"><PublicMarketPage gateway={h.descriptive} indexGateway={h.index}
    publicationId={pin} scopeToken={null} catalogHref="/catalog" onCatalogClick={() => {}}
    onSelectPublication={() => {}} onOpenScope={() => {}} onCloseScope={() => {}} personalWatchlist={watchlist}
    cnyPerUsd="7" requestedView={requestedView} /></LangProvider>
}
function gate() {
  let release: () => void = () => {}
  const promise = new Promise<void>((resolve) => { release = resolve })
  return { promise, release }
}
const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)) })

it('outer summary and index switch publication together on a window action', async () => {
  const h = harness(), ui = render(page(h))
  await screen.findByText('10,303.01')
  expect(ui.container.querySelector('.public-market__summary')).toHaveTextContent('1%')
  h.switchPublication()
  fireEvent.click(screen.getByRole('button', { name: '1Y' }))
  await screen.findByText('10,405.02')
  await settle()
  expect(ui.container.querySelector('.public-market__summary')).toHaveTextContent('2%')
  // The page re-read in place: the chosen window survives and one CURRENT read moved both.
  expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute('aria-pressed', 'true')
  expect(h.currentReads()).toBe(2)
})

it('while the page re-reads, no index value from the old publication is shown beside the new summary', async () => {
  const h = harness(), ui = render(page(h))
  await screen.findByText('10,303.01')
  // Slow label reads after the TTL; following the page must keep the index mounted and its window.
  h.switchPublication(25)
  const indexBefore = screen.getByTestId('market-sector-index-history')
  fireEvent.click(screen.getByRole('button', { name: '1Y' }))
  const seen: string[] = []
  await waitFor(() => {
    const summary = ui.container.querySelector('.public-market__summary')?.textContent ?? ''
    const headline = ui.container.querySelector('.public-market-index__headline strong')?.textContent ?? ''
    seen.push(`${summary.includes('2%') ? 'beta' : 'alpha'}|${headline}`)
    expect(headline).toBe('10,405.02')
  })
  expect(seen.filter((entry) => entry.startsWith('beta|10,303.01'))).toEqual([])
  expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute('aria-pressed', 'true')
  expect(indexBefore.isConnected).toBe(true)
})

it('explicit publication must not display the new current index on window action', async () => {
  const h = harness(), ui = render(page(h, alpha))
  await screen.findByText('10,303.01')
  h.switchPublication()
  fireEvent.click(screen.getByRole('button', { name: '1Y' }))
  await settle()
  expect(ui.container.querySelector('.public-market-index__headline strong')?.textContent ?? '').not.toContain('10,405.02')
  // Fails closed with a retry; the outer summary stays on the pinned publication.
  expect(within(screen.getByTestId('market-sector-index-history')).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  expect(ui.container.querySelector('.public-market__summary')).toHaveTextContent('1%')
})

it('revisiting a cached child after TTL must revalidate the parent release', async () => {
  const h = harness()
  render(<LangProvider lang="en"><MarketSectorIndexHistory gateway={h.index} scopeCode="ALL" view="SECTORS" cnyPerUsd="7" /></LangProvider>)
  fireEvent.click(await screen.findByTestId('sector-tile-WEAPON'))
  expect(await screen.findByTestId('sector-tile-WEAPON_MODEL:7')).toHaveTextContent('$10,000')
  fireEvent.click(within(screen.getByTestId('v3-child-sector-grid')).getByRole('button', { name: 'All sectors' }))
  await waitFor(() => expect(screen.queryByTestId('v3-child-sector-grid')).toBeNull())
  h.switchPublication()
  fireEvent.click(screen.getByTestId('sector-tile-WEAPON'))
  await waitFor(() => expect(screen.getByTestId('sector-tile-WEAPON_MODEL:7')).toHaveTextContent('$20,000'))
  await settle()
  expect(screen.getByTestId('sector-tile-WEAPON_MODEL:7')).toHaveTextContent('$20,000')
  expect(h.currentReads()).toBe(2)
})

it('within the CURRENT TTL a cached child revisit reads nothing new', async () => {
  const h = harness()
  render(<LangProvider lang="en"><MarketSectorIndexHistory gateway={h.index} scopeCode="ALL" view="SECTORS" cnyPerUsd="7" /></LangProvider>)
  fireEvent.click(await screen.findByTestId('sector-tile-WEAPON'))
  await screen.findByTestId('sector-tile-WEAPON_MODEL:7')
  fireEvent.click(within(screen.getByTestId('v3-child-sector-grid')).getByRole('button', { name: 'All sectors' }))
  await waitFor(() => expect(screen.queryByTestId('v3-child-sector-grid')).toBeNull())
  const before = { current: h.currentReads(), history: h.historyReads() }
  fireEvent.click(screen.getByTestId('sector-tile-WEAPON'))
  expect(await screen.findByTestId('sector-tile-WEAPON_MODEL:7')).toHaveTextContent('$10,000')
  await settle()
  expect({ current: h.currentReads(), history: h.historyReads() }).toEqual(before)
})

it('one initial operation allows at most one automatic rediscovery', async () => {
  let time = 100_000, currentReads = 0, historyReads = 0
  vi.spyOn(Date, 'now').mockImplementation(() => time)
  const fetcher: typeof fetch = async (input) => {
    const url = new URL(String(input), 'http://127.0.0.1')
    if (url.pathname === '/api/v1/native-cny/index/day') {
      currentReads += 1
      // Bound the test producer to four publications, then stop further recovery.
      if (currentReads > 4) return unavailable()
      return response({ ...syntheticDay(), publication_id: String(currentReads).repeat(64) })
    }
    if (url.pathname === '/api/v1/native-cny/index/history') { historyReads += 1; time += 31_000; return unavailable() }
    if (url.pathname !== '/api/v3/market-index/public/scopes') throw Error('Unexpected route')
    const r = syntheticRoute(url.pathname + url.search)
    return response(r.payload, r.status)
  }
  const session = new NativeCnyMarketSession(new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }))
  render(<LangProvider lang="en"><MarketSectorIndexHistory gateway={new NativeCnyMarketSectorIndexGateway(session)} scopeCode="ALL" view="SECTORS" /></LangProvider>)
  await screen.findAllByRole('button', { name: 'Try again' })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })
  expect(currentReads).toBeLessThanOrEqual(2)
  // After the problem is shown nothing keeps reading; a user retry starts one new budget.
  const settled = { currentReads, historyReads }
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)) })
  expect({ currentReads, historyReads }).toEqual(settled)
  fireEvent.click(screen.getAllByRole('button', { name: 'Try again' })[0]!)
  await screen.findAllByRole('button', { name: 'Try again' })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)) })
  expect(currentReads - settled.currentReads).toBeLessThanOrEqual(2)
})

it('the page-mode index follows a moving CURRENT at most once per operation', async () => {
  let time = 100_000, currentReads = 0
  vi.spyOn(Date, 'now').mockImplementation(() => time)
  const fetcher: typeof fetch = async (input) => {
    const url = new URL(String(input), 'http://127.0.0.1')
    if (url.pathname === '/api/v1/native-cny/index/day') {
      currentReads += 1
      if (currentReads > 6) return unavailable()
      return response({ ...syntheticDay(), publication_id: String(currentReads).repeat(64) })
    }
    if (url.pathname === '/api/v1/native-cny/index/history') { time += 31_000; return unavailable() }
    if (url.pathname !== '/api/v3/market-index/public/scopes') throw Error('Unexpected route')
    const r = syntheticRoute(url.pathname + url.search)
    return response(r.payload, r.status)
  }
  const session = new NativeCnyMarketSession(new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }))
  render(<LangProvider lang="en"><PublicMarketPage gateway={new NativeCnyMarketDescriptiveGateway(session)}
    indexGateway={new NativeCnyMarketSectorIndexGateway(session)} publicationId={null} scopeToken={null}
    catalogHref="/catalog" onCatalogClick={() => {}} onSelectPublication={() => {}} onOpenScope={() => {}}
    onCloseScope={() => {}} personalWatchlist={watchlist} cnyPerUsd="7" requestedView="MARKET" /></LangProvider>)
  await within(await screen.findByTestId('market-sector-index-history')).findByRole('button', { name: 'Try again' })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)) })
  // Page read + one index recovery (which the page follows from the shared CURRENT).
  expect(currentReads).toBeLessThanOrEqual(2)
})

it('sector cards keep two signed decimals and use the exact ratio', () => {
  const ratio = exactRelativeDecimal('10045', '10000')!
  render(<SectorHeatmap lang="en" label="Audit card" cells={[{ name: 'Audit sector', scopeCode: 'WEAPON', size: 1, ratio }]} />)
  expect(screen.getByTestId('sector-tile-WEAPON')).toHaveTextContent('+0.45%')
  expect(formatPublicRatio(ratio, 'en')).toBe('0.5%')
})

// Follow-up review: N01 short windows sharing the 3M read, N02 Retry lifecycle.
it.each(['7D', '1M'] as const)('N01: ACTIVE 3M to %s confirms CURRENT beyond the TTL', async (range) => {
  const h = harness(), ui = render(page(h))
  await screen.findByText('10,303.01')
  h.switchPublication()
  fireEvent.click(screen.getByRole('button', { name: range }))
  await waitFor(() => expect(ui.container.querySelector('.public-market-index__headline strong')).toHaveTextContent('10,405.02'))
  await settle()
  expect(ui.container.querySelector('.public-market__summary')).toHaveTextContent('2%')
  expect(screen.getByRole('button', { name: range })).toHaveAttribute('aria-pressed', 'true')
  expect(h.currentReads()).toBe(2)
})

it('within the CURRENT TTL a short window reuses the 3M read and reads nothing new', async () => {
  const h = harness(), ui = render(page(h))
  await screen.findByText('10,303.01')
  await settle()
  const before = { current: h.currentReads(), history: h.historyReads() }
  fireEvent.click(screen.getByRole('button', { name: '7D' }))
  fireEvent.click(screen.getByRole('button', { name: '1M' }))
  await settle()
  expect({ current: h.currentReads(), history: h.historyReads() }).toEqual(before)
  expect(ui.container.querySelector('.public-market-index__headline strong')).toHaveTextContent('10,303.01')
})

it('an explicit publication fails closed on a short window after CURRENT moved', async () => {
  const h = harness(), ui = render(page(h, alpha))
  await screen.findByText('10,303.01')
  h.switchPublication()
  fireEvent.click(screen.getByRole('button', { name: '1M' }))
  const index = screen.getByTestId('market-sector-index-history')
  expect(await within(index).findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  expect(ui.container.querySelector('.public-market-index__headline strong')).toBeNull()
  expect(ui.container.querySelector('.public-market__summary')).toHaveTextContent('1%')
})

it('a standalone sector view moves roots to the new publication on a short window', async () => {
  const h = harness()
  render(<LangProvider lang="en"><MarketSectorIndexHistory gateway={h.index} scopeCode="ALL" view="SECTORS" cnyPerUsd="7" /></LangProvider>)
  expect(await screen.findByTestId('sector-tile-WEAPON')).toHaveTextContent('$10,000')
  h.switchPublication()
  fireEvent.click(screen.getByRole('button', { name: '1M' }))
  await waitFor(() => expect(screen.getByTestId('sector-tile-WEAPON')).toHaveTextContent('$20,000'))
  expect(h.currentReads()).toBe(2)
})

it('unmount cancels an in-flight sector Retry, which never follows the page afterward', async () => {
  let failHistory = true, current = alpha, currentReads = 0, release: () => void = () => {}
  const hold = new Promise<void>((resolve) => { release = resolve })
  const signals: (AbortSignal | null | undefined)[] = []
  const clock = vi.spyOn(Date, 'now').mockReturnValue(100_000)
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input), 'http://127.0.0.1')
    if (url.pathname === '/api/v1/native-cny/index/day') {
      currentReads += 1
      signals.push(init?.signal)
      if (currentReads === 2) await hold
      return response({ ...syntheticDay(), publication_id: current })
    }
    if (url.pathname === '/api/v1/native-cny/index/history') {
      if (failHistory) return unavailable()
      const q = url.searchParams
      return response(syntheticHistory(q.get('scope')!, q.get('start')!, q.get('end')!))
    }
    if (url.pathname !== '/api/v3/market-index/public/scopes') throw Error('Unexpected route')
    const r = syntheticRoute(url.pathname + url.search)
    return response(r.payload, r.status)
  }
  const session = new NativeCnyMarketSession(new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }))
  const follow = vi.fn(() => true)
  const ui = render(<LangProvider lang="en"><MarketSectorIndexHistory gateway={new NativeCnyMarketSectorIndexGateway(session)}
    scopeCode="ALL" view="SECTORS" nativePublicationId={alpha} onNativePublicationChanged={follow} /></LangProvider>)
  const retry = await screen.findByRole('button', { name: 'Try again' })
  failHistory = false
  current = beta
  clock.mockReturnValue(131_000)
  fireEvent.click(retry)
  await waitFor(() => expect(currentReads).toBe(2))
  ui.unmount()
  release()
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)) })
  expect(follow).not.toHaveBeenCalled()
  expect(signals.at(-1)?.aborted).toBe(true)
})

// Follow-up review: C01 an unreadable CURRENT must not authorize reuse,
// C02 concurrent recoveries of one operation share one completed follow.
const currentFailures = {
  'TEMPORARILY_UNAVAILABLE 503': unavailable,
  'NOT_PUBLISHED 404': () => response({ api_contract: 'native-cny-index-day/1', error: 'NOT_PUBLISHED' }, 404),
  'malformed payload': () => response({ api_contract: 'native-cny-index-day/1', unexpected: true }),
} as const
it.each(Object.keys(currentFailures) as (keyof typeof currentFailures)[])('C01: a short window fails closed when CURRENT is %s, and Retry recovers', async (failure) => {
  const h = harness(), ui = render(page(h))
  await screen.findByText('10,303.01')
  h.expireCurrent()
  h.failCurrent(currentFailures[failure])
  fireEvent.click(screen.getByRole('button', { name: '1M' }))
  const index = screen.getByTestId('market-sector-index-history')
  const retry = await within(index).findByRole('button', { name: 'Try again' })
  expect(ui.container.querySelector('.public-market-index__headline strong')).toBeNull()
  h.failCurrent(null)
  fireEvent.click(retry)
  await waitFor(() => expect(ui.container.querySelector('.public-market-index__headline strong')).toHaveTextContent('10,303.01'))
  expect(within(index).queryByRole('button', { name: 'Try again' })).toBeNull()
  expect(screen.getByRole('button', { name: '1M' })).toHaveAttribute('aria-pressed', 'true')
})

it('a sector view hides its cards when CURRENT cannot be read on a short window', async () => {
  const h = harness()
  render(<LangProvider lang="en"><MarketSectorIndexHistory gateway={h.index} scopeCode="ALL" view="SECTORS" cnyPerUsd="7" /></LangProvider>)
  expect(await screen.findByTestId('sector-tile-WEAPON')).toHaveTextContent('$10,000')
  h.expireCurrent()
  h.failCurrent(unavailable)
  fireEvent.click(screen.getByRole('button', { name: '1M' }))
  const retry = await screen.findByRole('button', { name: 'Try again' })
  expect(screen.queryByTestId('sector-tile-WEAPON')).toBeNull()
  h.failCurrent(null)
  fireEvent.click(retry)
  expect(await screen.findByTestId('sector-tile-WEAPON')).toHaveTextContent('$10,000')
})

it('a cancelled failing confirmation never overwrites the newer window', async () => {
  const h = harness(), ui = render(page(h))
  await screen.findByText('10,303.01')
  const held = gate()
  h.expireCurrent()
  h.failCurrent(unavailable)
  h.holdCurrent(held.promise)
  fireEvent.click(screen.getByRole('button', { name: '7D' }))
  await waitFor(() => expect(h.currentReads()).toBe(2))
  h.failCurrent(null)
  fireEvent.click(screen.getByRole('button', { name: '1M' }))
  await settle()
  held.release()
  await settle()
  expect(ui.container.querySelector('.public-market-index__headline strong')).toHaveTextContent('10,303.01')
  expect(within(screen.getByTestId('market-sector-index-history')).queryByRole('button', { name: 'Try again' })).toBeNull()
  expect(screen.getByRole('button', { name: '1M' })).toHaveAttribute('aria-pressed', 'true')
})

it('simultaneous root and detail recoveries follow the page once and both land on it', async () => {
  const h = harness(), history = gate(), current = gate(), follow = vi.fn()
  function FollowingPage() {
    const [pin, setPin] = useState(alpha)
    return <MarketSectorIndexHistory gateway={h.index} scopeCode="ALL" view="SECTORS" selectedSectorCode="WEAPON" cnyPerUsd="7"
      nativePublicationId={pin} onNativePublicationChanged={() => { follow(); setPin(beta); return true }} />
  }
  h.failHistory(true)
  h.holdHistory(history.promise)
  render(<LangProvider lang="en"><FollowingPage /></LangProvider>)
  // Roots and the WEAPON detail are all waiting on history reads that will fail.
  await waitFor(() => expect(h.historyReads()).toBeGreaterThanOrEqual(4))
  h.switchPublication()
  h.holdCurrent(current.promise)
  h.holdHistory(null)
  history.release()
  // Both recoveries wait on the one shared CURRENT read.
  await waitFor(() => expect(h.currentReads()).toBe(2))
  await settle()
  h.failHistory(false)
  current.release()
  await waitFor(() => expect(screen.getByTestId('sector-tile-WEAPON')).toHaveTextContent('$20,000'))
  await settle()
  expect(follow).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
})

// Follow-up review: G01 a history still in flight for the shared 3M read must
// not commit over a short window that failed closed; a Retry starts a new read.
async function pendingHistoryThenFailedWindow(h: ReturnType<typeof harness>, range: '7D' | '1M') {
  fireEvent.click(screen.getByRole('button', { name: '1Y' }))
  await waitFor(() => expect(h.historyReads()).toBe(2))
  await screen.findByText('10,303.01')
  // A 3M read starts inside the CURRENT TTL and stays in flight while CURRENT expires.
  h.at(125_000)
  const old = gate()
  h.holdHistory(old.promise)
  fireEvent.click(screen.getByRole('button', { name: '3M' }))
  await waitFor(() => expect(h.historyReads()).toBe(3))
  h.holdHistory(null)
  h.at(131_000)
  h.failCurrent(unavailable)
  fireEvent.click(screen.getByRole('button', { name: range }))
  const index = screen.getByTestId('market-sector-index-history')
  return { index, old, retry: await within(index).findByRole('button', { name: 'Try again' }) }
}

it.each(['7D', '1M'] as const)('G01: an in-flight 3M history cannot undo a failed %s confirmation', async (range) => {
  const h = harness(), ui = render(page(h))
  await screen.findByText('10,303.01')
  const { index, old } = await pendingHistoryThenFailedWindow(h, range)
  expect(ui.container.querySelector('.public-market-index__headline strong')).toBeNull()
  old.release()
  await settle()
  expect(within(index).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  expect(ui.container.querySelector('.public-market-index__headline strong')).toBeNull()
  expect(h.historySignals[2]?.aborted).toBe(true)
  expect({ current: h.currentReads(), history: h.historyReads() }).toEqual({ current: 2, history: 3 })
})

it('Retry after a failed window recovers on the current publication; the old history stays revoked', async () => {
  const h = harness(), ui = render(page(h))
  await screen.findByText('10,303.01')
  const { index, old, retry } = await pendingHistoryThenFailedWindow(h, '1M')
  h.failCurrent(null)
  h.switchPublication()
  fireEvent.click(retry)
  await waitFor(() => expect(ui.container.querySelector('.public-market-index__headline strong')).toHaveTextContent('10,405.02'))
  old.release()
  await settle()
  expect(ui.container.querySelector('.public-market-index__headline strong')).toHaveTextContent('10,405.02')
  expect(ui.container.querySelector('.public-market__summary')).toHaveTextContent('2%')
  expect(within(index).queryByRole('button', { name: 'Try again' })).toBeNull()
  expect(screen.getByRole('button', { name: '1M' })).toHaveAttribute('aria-pressed', 'true')
})
