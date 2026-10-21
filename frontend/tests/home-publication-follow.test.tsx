import { act, cleanup, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NativeCnyMarketDescriptiveGateway, NativeCnyMarketSession, NativeCnyMarketSectorIndexGateway } from '../src/api/NativeCnyMarketGateways'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { MarketSectorIndexPublicApi, type NativePublicationGeneration } from '../src/api/MarketSectorIndexPublicApi'
import { prepareHomeDirectory } from '../src/performance/homeDirectory'
import { HomeMarketPanel } from '../src/pages/PublicHomeHero'
import { HomeSectorStrip } from '../src/pages/PublicHomeModules'
import { PublicMarketPage } from '../src/pages/PublicMarketPage'
import { HOME_ACTIVATION_READS, useHomeLoad } from '../src/pages/publicHomeShared'
import type { PersonalWatchlistController } from '../src/watchlist/personalWatchlist'
import type { NativeCnyIndexPublicDay } from '../src/wire/nativeCnyIndexPublicApi'
import { LangProvider } from '../src/i18n'
import { fixtureDates, fixtureSpec, syntheticDay, syntheticRoute } from './native-cny-market-fixtures'

// SPEC-7 H7-7 (amended): one HOME activation reads each module at most twice, the first read and
// one follow of a newly accepted publication; after that a module of an older one is withdrawn.
// HOME and MARKET always show the one publication the shared API accepted.

afterEach(() => { cleanup(); vi.useRealTimers() })
const T0 = 10_000_000
const noop = () => undefined
const flush = () => act(async () => { for (let i = 0; i < 30; i++) await Promise.resolve() })

const dayAt = (ordinal: number, date: string, publication: string, level?: string): NativeCnyIndexPublicDay => {
  const day = syntheticDay(ordinal)
  return { ...day, publication_id: publication, released_at: `${date}T23:59:00Z`,
    data: { ...day.data, bucket_date: date, measured_at: `${date}T23:55:00Z`,
      points: day.data.points.map((point) => level === undefined ? point : { ...point, index_display: level, period_return_display: '0.02000000' }) } }
}
// A = the fixture's last day (Apr 6); B and C are later publications on Apr 7 and Apr 8.
const DAY_A = syntheticDay(4)
const DAY_B = dayAt(4, '2025-04-07', 'f'.repeat(64), '10509.07020000')
const DAY_C = dayAt(4, '2025-04-08', 'a'.repeat(64), '10719.25000000')

/** One native session whose CURRENT can be moved; history and day reads are counted. */
function nativeSource() {
  const rows = fixtureDates.map((_, index) => syntheticDay(index))
  const state = { current: DAY_A, days: 0, failDays: false, histories: [] as { scope: string; start: string; end: string }[] }
  const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
  const fetcher: typeof fetch = async (input) => {
    const url = new URL(String(input), 'http://127.0.0.1'), query = url.searchParams
    if (url.pathname === '/api/v1/native-cny/index/day') {
      state.days += 1
      return state.failDays ? json({ error: 'unavailable' }, 503) : json(state.current)
    }
    if (url.pathname === '/api/v1/native-cny/index/history') {
      const scope = query.get('scope')!, start = query.get('start')!, end = query.get('end')!
      state.histories.push({ scope, start, end })
      const published = [...rows, ...[DAY_B, DAY_C].filter((day) => day.data.bucket_date <= state.current.data.bucket_date)]
      const days = published.filter((day) => day.data.bucket_date >= start && day.data.bucket_date <= end)
        .map((day) => ({ ...day, data: { ...day.data, points: day.data.points.filter((point) => point.scope_code === scope) } }))
      const present = new Set(days.map((day) => day.data.bucket_date)), missing: string[] = []
      for (let at = Date.parse(`${start}T00:00:00Z`); at <= Date.parse(`${end}T00:00:00Z`); at += 86_400_000) {
        const date = new Date(at).toISOString().slice(0, 10)
        if (!present.has(date)) missing.push(date)
      }
      return json({ api_contract: 'native-cny-index-history/1', spec_sha256: fixtureSpec, scope, start_date: start, end_date: end,
        currency: 'CNY', fx_applied: false, days, missing_publication_dates: missing, missing_prices_filled: false,
        calculation_revisions_mixed: false })
    }
    const result = syntheticRoute(url.pathname + url.search)
    return json(result.payload, result.status)
  }
  const session = new NativeCnyMarketSession(new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher }))
  const index = new NativeCnyMarketSectorIndexGateway(session)
  return { state, session, index, api: new MarketSectorIndexPublicApi(index), descriptive: new NativeCnyMarketDescriptiveGateway(session),
    all: () => state.histories.filter((read) => read.scope === 'ALL').length }
}
type Source = ReturnType<typeof nativeSource>
const keyOf = (day: NativeCnyIndexPublicDay) => `${day.publication_id}|${day.data.bucket_date}`

function Home({ source, prepared, active = true, sectors = true }: {
  source: Source; prepared: ReturnType<typeof prepareHomeDirectory>; active?: boolean; sectors?: boolean
}) {
  return <LangProvider lang="en">
    <HomeMarketPanel active={active} preparedDirectory={prepared} api={source.api} marketHref="/market" onMarketClick={noop} catalogStatus={null} />
    {sectors && <HomeSectorStrip active={active} preparedDirectory={prepared} api={source.api} sectorHref={(code) => `/market/${code ?? ''}`} onSectorClick={noop} />}
  </LangProvider>
}
const heroDay = () => screen.getByTestId('home-market').querySelector('time')?.dateTime ?? null

describe('native CURRENT freshness keeps its own clock (HOME-02)', () => {
  it('a logical directory read that only reuses CURRENT does not renew the prepared directory', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    const prepared = prepareHomeDirectory(source.api)
    const stop = prepared.start()
    const first = await prepared.read(new AbortController().signal)
    expect(first?.release.history_end).toBe('2025-04-06')
    // Inside CURRENT's 30 s the reuse is served from its cache: no new day read, no new clock.
    vi.setSystemTime(T0 + 29_000)
    await source.api.directoryV3Groups(null)
    expect(source.state.days).toBe(1)
    expect(source.api.isActiveDirectoryFresh(first!)).toBe(true)
    // Past CURRENT's own expiry the prepared copy is no longer fresh, whatever read last reused it.
    vi.setSystemTime(T0 + 31_000)
    source.state.current = DAY_B
    expect(source.api.isActiveDirectoryFresh(first!)).toBe(false)
    const again = await prepared.read(new AbortController().signal)
    stop()
    expect(again?.release.history_end).toBe('2025-04-07')
    expect(source.api.nativePublication!.current()).toBe(keyOf(DAY_B))
  })

  it('a pinned read that loads a moved CURRENT moves the accepted publication', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    await source.api.directoryV3Groups(null)
    expect(source.api.nativePublication!.current()).toBe(keyOf(DAY_A))
    // Inside CURRENT's TTL a pinned read reuses A and moves nothing.
    source.state.current = DAY_B
    await source.api.directoryV3Groups(DAY_A.publication_id)
    expect(source.api.nativePublication!.current()).toBe(keyOf(DAY_A))
    // After it the pinned read fails closed, but the CURRENT it found is accepted.
    vi.setSystemTime(T0 + 31_000)
    await source.api.directoryV3Groups(DAY_A.publication_id).catch(() => null)
    expect(source.api.nativePublication!.current()).toBe(keyOf(DAY_B))
  })

  it('a strip mounted after CURRENT expired shows the new publication and pulls the hero along', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    const prepared = prepareHomeDirectory(source.api)
    const stop = prepared.start()
    const view = render(<Home source={source} prepared={prepared} sectors={false} />)
    await waitFor(() => expect(heroDay()).toBe('2025-04-06'))
    vi.setSystemTime(T0 + 29_000)
    await act(async () => { await source.api.directoryV3Groups(null) })
    vi.setSystemTime(T0 + 31_000)
    source.state.current = DAY_B
    view.rerender(<Home source={source} prepared={prepared} />)
    const strip = await screen.findByTestId('home-sectors')
    await waitFor(() => expect(strip).toHaveTextContent('Apr 7'))
    expect(strip).not.toHaveTextContent('unavailable')
    await waitFor(() => expect(heroDay()).toBe('2025-04-07'))
    stop()
  })
})

describe('HOME activation read budget (H7-7 amended)', () => {
  it('a late subscriber that finds a new publication costs the hero one follow, within the budget', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    const prepared = prepareHomeDirectory(source.api)
    const stop = prepared.start()
    const view = render(<Home source={source} prepared={prepared} sectors={false} />)
    await waitFor(() => expect(heroDay()).toBe('2025-04-06'))
    vi.setSystemTime(T0 + 31_000)
    source.state.current = DAY_B
    view.rerender(<Home source={source} prepared={prepared} />)
    await waitFor(() => expect(heroDay()).toBe('2025-04-07'))
    await flush()
    expect(source.all()).toBe(HOME_ACTIVATION_READS)
    // Every ALL window is the bounded 31-day month.
    for (const read of source.state.histories.filter((entry) => entry.scope === 'ALL')) {
      expect((Date.parse(read.end) - Date.parse(read.start)) / 86_400_000 + 1).toBeLessThanOrEqual(31)
    }
    stop()
  })

  it('further publication changes in one activation withdraw the hero instead of reading again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    const prepared = prepareHomeDirectory(source.api)
    const stop = prepared.start()
    const view = render(<Home source={source} prepared={prepared} sectors={false} />)
    await waitFor(() => expect(heroDay()).toBe('2025-04-06'))
    const moveTo = async (day: NativeCnyIndexPublicDay, at: number) => {
      vi.setSystemTime(at); source.state.current = day
      await act(async () => { await source.api.directoryV3Groups(null) })
    }
    await moveTo(DAY_B, T0 + 31_000)
    await waitFor(() => expect(heroDay()).toBe('2025-04-07'))
    expect(source.all()).toBe(2)
    await moveTo(DAY_C, T0 + 62_000)
    const hero = screen.getByTestId('home-market')
    await waitFor(() => expect(hero).toHaveClass('public-home__market--unavailable'))
    expect(hero).not.toHaveTextContent('Apr 7')
    await moveTo(DAY_A, T0 + 93_000)
    await flush()
    expect(source.all()).toBe(2)
    expect(hero).toHaveClass('public-home__market--unavailable')
    // A new activation starts a new budget and reads the accepted publication.
    view.rerender(<Home source={source} prepared={prepared} sectors={false} active={false} />)
    view.rerender(<Home source={source} prepared={prepared} sectors={false} />)
    await waitFor(() => expect(heroDay()).toBe('2025-04-06'))
    expect(source.all()).toBe(3)
    stop()
  })
})

/** A hand-moved generation store for the hook alone. */
function generationStore(initial: string | null) {
  let key = initial
  const listeners = new Set<() => void>()
  const store: NativePublicationGeneration = {
    current: () => key,
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener) } },
  }
  return { store, move: (next: string) => { key = next; for (const listener of [...listeners]) listener() } }
}

describe('useHomeLoad activation budget', () => {
  const of = (value: string) => value.split(':')[0]!

  it('counts settled follows and in-flight follows against one budget', async () => {
    const { store, move } = generationStore('A')
    let answer = 'A:1'
    const read = vi.fn(async () => answer)
    const view = renderHook(({ enabled }: { enabled: boolean }) => useHomeLoad(enabled, read, [], { store, of }), {
      initialProps: { enabled: true },
    })
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'A:1' }))
    answer = 'B:1'
    act(() => move('B'))
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'B:1' }))
    answer = 'C:1'
    act(() => move('C'))
    await waitFor(() => expect(view.result.current).toEqual({ status: 'UNAVAILABLE' }))
    act(() => move('D'))
    await flush()
    expect(read).toHaveBeenCalledTimes(HOME_ACTIVATION_READS)
    // Hidden and shown again: a new activation.
    answer = 'D:1'
    view.rerender({ enabled: false })
    view.rerender({ enabled: true })
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'D:1' }))
    expect(read).toHaveBeenCalledTimes(3)
  })

  it('a read that failed while the accepted publication moved follows it', async () => {
    const { store, move } = generationStore('A')
    const read = vi.fn(async () => {
      if (read.mock.calls.length === 1) { move('B'); throw new Error('NOT_PUBLISHED') }
      return 'B:1'
    })
    const view = renderHook(() => useHomeLoad(true, read, [], { store, of }))
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'B:1' }))
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('a read that failed with the publication unchanged stays unavailable', async () => {
    const { store } = generationStore('A')
    const read = vi.fn(async () => { throw new Error('down') })
    const view = renderHook(() => useHomeLoad(true, read, [], { store, of }))
    await waitFor(() => expect(view.result.current).toEqual({ status: 'UNAVAILABLE' }))
    await flush()
    expect(read).toHaveBeenCalledTimes(1)
  })
})

const watchlist = { status: 'READY', entries: [], pendingKeys: new Set(), error: null, has: () => false,
  toggle: async () => undefined, addMany: async () => 0, remove: async () => undefined, clear: async () => undefined,
} as unknown as PersonalWatchlistController
function Market({ source, active, publicationId = null, gateway = source.descriptive }: {
  source: Source; active: boolean; publicationId?: string | null; gateway?: Source['descriptive']
}) {
  return <LangProvider lang="en"><PublicMarketPage active={active} gateway={gateway} indexGateway={source.index}
    indexApi={source.api} publicationId={publicationId} scopeToken={null} catalogHref="/catalog" onCatalogClick={noop}
    onSelectPublication={noop} onOpenScope={noop} onCloseScope={noop} personalWatchlist={watchlist} cnyPerUsd="7"
    requestedView="MARKET" /></LangProvider>
}
// Text anywhere in the document, hidden or not: a withdrawn page keeps nothing of the older publication.
const shown = (text: string) => screen.queryAllByText(text)

describe('a kept-alive MARKET follows the accepted publication (HOME-01)', () => {
  it('a MARKET left behind while hidden is withdrawn, never shows the older publication, and follows', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    const view = render(<Market source={source} active />)
    await screen.findByText('10,303.01')
    view.rerender(<Market source={source} active={false} />)
    // HOME accepts B while MARKET is hidden.
    vi.setSystemTime(T0 + 31_000)
    source.state.current = DAY_B
    await act(async () => { await source.api.directoryV3Groups(null) })
    view.rerender(<Market source={source} active />)
    expect(shown('10,303.01')).toEqual([])
    await waitFor(() => expect(shown('10,509.07')).toHaveLength(1))
    expect(shown('10,303.01')).toEqual([])
  })

  it('a visible MARKET follows a publication accepted elsewhere in place', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    render(<Market source={source} active />)
    await screen.findByText('10,303.01')
    vi.setSystemTime(T0 + 31_000)
    source.state.current = DAY_B
    await act(async () => { await source.api.directoryV3Groups(null) })
    await waitFor(() => expect(shown('10,509.07')).toHaveLength(1))
  })

  it('a visible MARKET is withdrawn from the moment B is accepted until its follow lands B', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    let hold = false
    const held: (() => void)[] = []
    const gateway = Object.create(source.descriptive) as Source['descriptive']
    gateway.read = async (request, options) => {
      const result = await source.descriptive.read(request, options)
      if (hold) await new Promise<void>((resolve) => { held.push(resolve) })
      return result
    }
    render(<Market source={source} active gateway={gateway} />)
    await screen.findByText('10,303.01')
    hold = true
    vi.setSystemTime(T0 + 31_000)
    source.state.current = DAY_B
    await act(async () => { await source.api.directoryV3Groups(null) })
    await waitFor(() => expect(held.length).toBeGreaterThan(0))
    await flush()
    // The follow's answer is held: the page is withdrawn and neither publication is in the document.
    expect(source.api.nativePublication!.current()).toBe(keyOf(DAY_B))
    expect(screen.queryByTestId('public-market-page')).toBeNull()
    expect(shown('10,303.01')).toEqual([])
    expect(shown('10,509.07')).toEqual([])
    hold = false
    await act(async () => { for (const resolve of held.splice(0)) resolve() })
    await waitFor(() => expect(shown('10,509.07')).toHaveLength(1))
    expect(shown('10,303.01')).toEqual([])
  })

  it('a follow that still answers the older publication offers Retry instead of loading forever', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    // A source that keeps answering the first (A) document once B is accepted.
    const answered = new Map<string, Awaited<ReturnType<Source['descriptive']['read']>>>()
    const gateway = Object.create(source.descriptive) as Source['descriptive']
    let stale = false
    gateway.read = async (request, options) => {
      const key = JSON.stringify(request.query)
      if (stale && answered.has(key)) return answered.get(key)!
      const result = await source.descriptive.read(request, options)
      if (!answered.has(key)) answered.set(key, result)
      return result
    }
    render(<Market source={source} active gateway={gateway} />)
    await screen.findByText('10,303.01')
    stale = true
    vi.setSystemTime(T0 + 31_000)
    source.state.current = DAY_B
    await act(async () => { await source.api.directoryV3Groups(null) })
    const retry = await screen.findByRole('button', { name: 'Try again' })
    expect(shown('10,303.01')).toEqual([])
    stale = false
    await act(async () => { retry.click() })
    await waitFor(() => expect(shown('10,509.07')).toHaveLength(1))
  })

  it('B confirmed by the index window stays cached while the page withdraws, so the follow reads no CURRENT (HOME-04)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    render(<Market source={source} active />)
    await screen.findByText('10,303.01')
    vi.setSystemTime(T0 + 31_000)
    source.state.current = DAY_B
    // Every CURRENT read after B is confirmed fails: only the confirmed, cached B can land the follow.
    const stop = source.session.observeCurrent((day) => { if (day.publication_id === DAY_B.publication_id) source.state.failDays = true })
    const days = source.state.days
    await act(async () => { screen.getAllByRole('button', { name: '1Y' })[0]!.click() })
    await waitFor(() => expect(shown('10,509.07')).toHaveLength(1))
    stop()
    expect(source.state.days).toBe(days + 1)
    expect(source.session.hasFreshCurrent((day) => day.publication_id === DAY_B.publication_id)).toBe(true)
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('a publication accepted again waits for its own follow before offering Retry (HOME-05)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    const answered = new Map<string, Awaited<ReturnType<Source['descriptive']['read']>>>()
    const held: (() => void)[] = []
    let mode: 'normal' | 'stale' | 'hold' = 'normal'
    const gateway = Object.create(source.descriptive) as Source['descriptive']
    gateway.read = async (request, options) => {
      const key = JSON.stringify(request.query)
      if (mode === 'stale' && answered.has(key)) return answered.get(key)!
      const result = await source.descriptive.read(request, options)
      if (!answered.has(key)) answered.set(key, result)
      if (mode === 'hold') await new Promise<void>((resolve) => { held.push(resolve) })
      return result
    }
    const accept = async (day: NativeCnyIndexPublicDay, at: number) => {
      vi.setSystemTime(T0 + at)
      source.state.current = day
      await act(async () => { await source.api.directoryV3Groups(null) })
    }
    render(<Market source={source} active gateway={gateway} />)
    await screen.findByText('10,303.01')
    // B's first follow settles on the older answer: Retry.
    mode = 'stale'
    await accept(DAY_B, 31_000)
    await screen.findByRole('button', { name: 'Try again' })
    // C, then B again, each with its follow still waiting.
    mode = 'hold'
    await accept(DAY_C, 62_000)
    await waitFor(() => expect(held).toHaveLength(1))
    await accept(DAY_B, 93_000)
    await waitFor(() => expect(held).toHaveLength(2))
    await flush()
    expect(source.api.nativePublication!.current()).toBe(keyOf(DAY_B))
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
    expect(shown('10,303.01')).toEqual([])
    mode = 'normal'
    await act(async () => { for (const resolve of held.splice(0)) resolve() })
    await waitFor(() => expect(shown('10,509.07')).toHaveLength(1))
  })

  for (const between of ['A shown again', 'C while hidden'] as const) {
    it(`a publication accepted again after ${between} follows anew instead of reusing its old Retry (HOME-05)`, async () => {
      vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
      const source = nativeSource()
      const answered = new Map<string, Awaited<ReturnType<Source['descriptive']['read']>>>()
      const held: (() => void)[] = []
      let mode: 'normal' | 'stale' | 'hold' = 'normal'
      let reads = 0
      const gateway = Object.create(source.descriptive) as Source['descriptive']
      gateway.read = async (request, options) => {
        reads += 1
        const key = JSON.stringify(request.query)
        if (mode === 'stale' && answered.has(key)) return answered.get(key)!
        const result = await source.descriptive.read(request, options)
        if (!answered.has(key)) answered.set(key, result)
        if (mode === 'hold') await new Promise<void>((resolve) => { held.push(resolve) })
        return result
      }
      const accept = async (day: NativeCnyIndexPublicDay, at: number) => {
        vi.setSystemTime(T0 + at)
        source.state.current = day
        await act(async () => { await source.api.directoryV3Groups(null) })
      }
      const view = render(<Market source={source} active gateway={gateway} />)
      await screen.findByText('10,303.01')
      // B's first follow settles on the older answer: Retry.
      mode = 'stale'
      await accept(DAY_B, 31_000)
      await screen.findByRole('button', { name: 'Try again' })
      expect(reads).toBe(2)
      mode = 'hold'
      if (between === 'A shown again') {
        // Back to A, which the page still shows: nothing to follow, nothing read.
        await accept(DAY_A, 62_000)
        await waitFor(() => expect(shown('10,303.01')).toHaveLength(1))
        expect(reads).toBe(2)
        await accept(DAY_B, 93_000)
      } else {
        view.rerender(<Market source={source} active={false} gateway={gateway} />)
        await accept(DAY_C, 62_000)
        await accept(DAY_B, 93_000)
        view.rerender(<Market source={source} active gateway={gateway} />)
      }
      await waitFor(() => expect(held).toHaveLength(1))
      await flush()
      expect(reads).toBe(3)
      expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
      expect(shown('10,303.01')).toEqual([])
      mode = 'normal'
      await act(async () => { for (const resolve of held.splice(0)) resolve() })
      await waitFor(() => expect(shown('10,509.07')).toHaveLength(1))
      expect(reads).toBe(3)
    })
  }

  it('an explicit publication never follows', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const source = nativeSource()
    const view = render(<Market source={source} active publicationId={DAY_A.publication_id} />)
    await screen.findByText('10,303.01')
    const days = source.state.days
    view.rerender(<Market source={source} active={false} publicationId={DAY_A.publication_id} />)
    vi.setSystemTime(T0 + 31_000)
    source.state.current = DAY_B
    await act(async () => { await source.api.directoryV3Groups(null) })
    view.rerender(<Market source={source} active publicationId={DAY_A.publication_id} />)
    await flush()
    expect(screen.queryByText('10,509.07')).toBeNull()
    expect(within(screen.getByTestId('public-market-page')).getByText('10,303.01')).toBeTruthy()
    expect(source.state.days).toBe(days + 1)
  })
})
