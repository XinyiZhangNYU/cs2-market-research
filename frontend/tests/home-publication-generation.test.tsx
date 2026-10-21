import { act, cleanup, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NativeCnyMarketSession, NativeCnyMarketSectorIndexGateway } from '../src/api/NativeCnyMarketGateways'
import { HttpNativeCnyIndexPublicGateway } from '../src/api/HttpNativeCnyIndexPublicGateway'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { MarketSectorIndexPublicApi, type NativePublicationGeneration } from '../src/api/MarketSectorIndexPublicApi'
import { prepareHomeDirectory } from '../src/performance/homeDirectory'
import { HomeMarketPanel } from '../src/pages/PublicHomeHero'
import { HomeSectorStrip } from '../src/pages/PublicHomeModules'
import { HOME_RETURN_FRESH_MS, useHomeLoad } from '../src/pages/publicHomeShared'
import { LangProvider } from '../src/i18n'
import { syntheticDay, syntheticRoute } from './native-cny-market-fixtures'

afterEach(() => { cleanup(); vi.useRealTimers() })
const flush = async () => { await act(async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }) }
const T0 = 10_000_000
// Publication A is the 04-05 day, B the 04-06 day of the shared fixtures.
const A = 3, B = 4

/** A native API whose CURRENT day can move from A to B, with an optional gate on history reads. */
function nativeHome() {
  const state = { ordinal: A, hold: null as Promise<void> | null, days: 0 }
  const fetcher: typeof fetch = async (input) => {
    const path = String(input)
    if (path.includes('/native-cny/index/history') && state.hold) await state.hold
    const url = new URL(path, 'http://127.0.0.1')
    const result = url.pathname === '/api/v1/native-cny/index/day'
      ? (state.days += 1, { payload: syntheticDay(state.ordinal), status: 200 })
      : syntheticRoute(path)
    return new Response(JSON.stringify(result.payload), { status: result.status, headers: { 'Content-Type': 'application/json' } })
  }
  const gateway = new NativeCnyMarketSectorIndexGateway(new NativeCnyMarketSession(
    new HttpNativeCnyIndexPublicGateway({ fetcher }), new HttpMarketSectorIndexPublicGateway({ fetcher })))
  return { state, api: new MarketSectorIndexPublicApi(gateway) }
}

function Hero({ api, active = true }: { api: MarketSectorIndexPublicApi; active?: boolean }) {
  return <LangProvider lang="en">
    <HomeMarketPanel active={active} api={api} marketHref="/market" onMarketClick={() => undefined} catalogStatus={null} />
  </LangProvider>
}
function Strip({ api }: { api: MarketSectorIndexPublicApi }) {
  return <LangProvider lang="en">
    <HomeSectorStrip api={api} sectorHref={(code) => `/market/${code ?? ''}`} onSectorClick={() => undefined} />
  </LangProvider>
}

describe('HOME modules follow one accepted native publication (HOME-01)', () => {
  it('a strip mounted after CURRENT moved pulls the hero to the same publication, never beside the old one', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const { api, state } = nativeHome()
    render(<Hero api={api} />)
    const hero = await screen.findByTestId('home-market')
    await within(hero).findByText('Apr 5')
    // CURRENT's own cache has expired and B is published; HOME is not left (compact -> full).
    vi.setSystemTime(T0 + 31_000)
    state.ordinal = B
    render(<Strip api={api} />)
    const strip = await screen.findByTestId('home-sectors')
    await waitFor(() => expect(strip).toHaveTextContent('Apr 6'))
    expect(hero).not.toHaveTextContent('Apr 5')
    await within(hero).findByText('Apr 6')
    expect(strip).not.toHaveTextContent('Apr 5')
  })

  it('a return inside the freshness window does not restore A after another surface accepted B', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const { api, state } = nativeHome()
    // CURRENT is read at T0, the hero settles later: its own window outlives CURRENT's cache.
    let release!: () => void
    state.hold = new Promise<void>((done) => { release = done })
    const view = render(<Hero api={api} />)
    await flush()
    vi.setSystemTime(T0 + 5_000)
    state.hold = null
    await act(async () => { release() })
    const hero = await screen.findByTestId('home-market')
    await within(hero).findByText('Apr 5')
    view.rerender(<Hero api={api} active={false} />)
    // MARKET confirms CURRENT after its cache expired and accepts B.
    vi.setSystemTime(T0 + 31_000)
    state.ordinal = B
    expect((await api.directoryV3Groups(null))?.release.history_end).toBe('2025-04-06')
    // The hero's READY is only 26 s old, inside HOME_RETURN_FRESH_MS, but it belongs to A.
    expect(31_000 - 5_000).toBeLessThan(HOME_RETURN_FRESH_MS)
    view.rerender(<Hero api={api} active />)
    expect(screen.getByTestId('home-market')).not.toHaveTextContent('Apr 5')
    await within(screen.getByTestId('home-market')).findByText('Apr 6')
  })

  it('a prepared directory confirmed by CURRENT inside the TTL is not read twice', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const { api, state } = nativeHome()
    const prepared = prepareHomeDirectory(api)
    const stop = prepared.start()
    const controller = new AbortController()
    const first = await prepared.read(controller.signal)
    const second = await prepared.read(controller.signal)
    stop()
    expect(first?.release.history_end).toBe('2025-04-05')
    expect(second).toBe(first)
    expect(state.days).toBe(1)
    expect(api.isActiveDirectoryFresh(first!)).toBe(true)
    vi.setSystemTime(T0 + 30_000)
    expect(api.isActiveDirectoryFresh(first!)).toBe(false)
  })

  it('CURRENT answers are accepted in the order their reads started', async () => {
    const { api, state } = nativeHome()
    const seen: (string | null)[] = []
    const store = api.nativePublication!
    store.subscribe(() => seen.push(store.current()))
    await api.directoryV3Groups(null)
    expect(store.current()).toBe(`${'4'.repeat(64)}|2025-04-05`)
    // A pinned read that reuses the still-fresh CURRENT never moves the page.
    state.ordinal = B
    await api.directoryV3Groups('4'.repeat(64)).catch(() => null)
    expect(store.current()).toBe(`${'4'.repeat(64)}|2025-04-05`)
    expect(seen).toEqual([`${'4'.repeat(64)}|2025-04-05`])
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

describe('useHomeLoad generation semantics', () => {
  const of = (value: string) => value.split(':')[0]!

  it('a settled value of an older publication disappears at once and is read again', async () => {
    const { store, move } = generationStore('A')
    let answer = 'A:1'
    const read = vi.fn(async () => answer)
    const view = renderHook(() => useHomeLoad(true, read, [], { store, of }))
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'A:1' }))
    answer = 'B:1'
    act(() => move('B'))
    expect(view.result.current.status).not.toBe('READY')
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'B:1' }))
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('a read that settles on an older publication follows once, then fails closed', async () => {
    const { store, move } = generationStore('A')
    const answers = ['A:1', 'B:1', 'B:2']
    const read = vi.fn(async () => {
      const value = answers.shift()!
      // Another surface accepts a newer publication while each of the first two reads runs.
      if (value === 'A:1') move('B')
      if (value === 'B:1') move('C')
      return value
    })
    const view = renderHook(() => useHomeLoad(true, read, [], { store, of }))
    await waitFor(() => expect(view.result.current).toEqual({ status: 'UNAVAILABLE' }))
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('without a generation the legacy return cache is unchanged', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const read = vi.fn(async () => 'value')
    const view = renderHook(({ enabled }: { enabled: boolean }) => useHomeLoad(enabled, read, [], null), {
      initialProps: { enabled: true },
    })
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'value' }))
    view.rerender({ enabled: false })
    vi.setSystemTime(T0 + 1_000)
    view.rerender({ enabled: true })
    expect(view.result.current).toEqual({ status: 'READY', value: 'value' })
    await flush()
    expect(read).toHaveBeenCalledTimes(1)
  })
})
