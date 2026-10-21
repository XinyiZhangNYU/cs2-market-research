import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../src/i18n'
import type { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import { prepareHomeDirectory, type HomeDirectory } from '../src/performance/homeDirectory'
import { HomeMarketPanel } from '../src/pages/PublicHomeHero'
import { HomeValve } from '../src/pages/PublicHomeModules'
import { HOME_RETURN_FRESH_MS, useHomeLoad, type Load } from '../src/pages/publicHomeShared'
import valveListFixture from '../../schemas/examples/valve-event-public-list.valid.json'

afterEach(() => { cleanup(); vi.useRealTimers() })
const flush = async () => { await act(async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }) }
const T0 = 10_000_000

function hook(read: (signal: AbortSignal) => Promise<string | null>, deps: readonly unknown[] = []) {
  return renderHook(({ enabled, keys }: { enabled: boolean; keys: readonly unknown[] }) => useHomeLoad(enabled, read, keys), {
    initialProps: { enabled: true, keys: deps },
  })
}

describe('HOME return path keeps settled modules (F-A)', () => {
  it('a return inside the freshness window starts no read and never shows LOADING', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const read = vi.fn(async () => 'value')
    const view = hook(read)
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'value' }))
    for (let i = 0; i < 3; i++) {
      view.rerender({ enabled: false, keys: [] })
      vi.setSystemTime(T0 + (i + 1) * 1_000)
      view.rerender({ enabled: true, keys: [] })
      expect(view.result.current.status).toBe('READY')
    }
    await flush()
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('after the window the old value stays shown while it is read again; a new value replaces it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    let next: () => Promise<string | null> = async () => 'first'
    const read = vi.fn(() => next())
    const view = hook(read)
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'first' }))
    view.rerender({ enabled: false, keys: [] })
    vi.setSystemTime(T0 + HOME_RETURN_FRESH_MS)
    let resolve!: (value: string) => void
    next = () => new Promise<string>((done) => { resolve = done })
    view.rerender({ enabled: true, keys: [] })
    expect(view.result.current).toEqual({ status: 'READY', value: 'first' })
    await flush()
    expect(view.result.current).toEqual({ status: 'READY', value: 'first' })
    expect(read).toHaveBeenCalledTimes(2)
    await act(async () => { resolve('second') })
    expect(view.result.current).toEqual({ status: 'READY', value: 'second' })
    // The re-read starts a new window: the next return inside it reads nothing.
    view.rerender({ enabled: false, keys: [] })
    vi.setSystemTime(T0 + HOME_RETURN_FRESH_MS + 1_000)
    view.rerender({ enabled: true, keys: [] })
    await flush()
    expect(view.result.current).toEqual({ status: 'READY', value: 'second' })
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('a value one day old stays shown, unchanged, while its re-read hangs', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    let next: () => Promise<string | null> = async () => 'old'
    const read = vi.fn(() => next())
    const view = hook(read)
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'old' }))
    view.rerender({ enabled: false, keys: [] })
    vi.setSystemTime(T0 + 86_400_000)
    next = () => new Promise(() => {})
    view.rerender({ enabled: true, keys: [] })
    await flush()
    expect(view.result.current).toEqual({ status: 'READY', value: 'old' })
    expect(read).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['null', async (): Promise<string | null> => null],
    ['a rejected read', async (): Promise<string | null> => { throw new Error('offline') }],
  ] as const)('after the window a read that yields %s withdraws the old value to UNAVAILABLE', async (_label, failing) => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    let next: (signal: AbortSignal) => Promise<string | null> = async () => 'value'
    const read = vi.fn((signal: AbortSignal) => next(signal))
    const view = hook(read)
    await waitFor(() => expect(view.result.current.status).toBe('READY'))
    view.rerender({ enabled: false, keys: [] })
    vi.setSystemTime(T0 + HOME_RETURN_FRESH_MS + 1)
    next = failing
    view.rerender({ enabled: true, keys: [] })
    expect(view.result.current).toEqual({ status: 'READY', value: 'value' })
    await waitFor(() => expect(view.result.current.status).toBe('UNAVAILABLE'))
    // The failed revalidation is not a READY record: the next return retries immediately.
    view.rerender({ enabled: false, keys: [] })
    next = async () => 'recovered'
    view.rerender({ enabled: true, keys: [] })
    expect(view.result.current.status).toBe('LOADING')
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'recovered' }))
    expect(read).toHaveBeenCalledTimes(3)
  })

  it('hiding aborts an unsettled re-read; the next return shows the old value and reads again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const signals: AbortSignal[] = []
    let next: () => Promise<string | null> = async () => 'value'
    const read = vi.fn((signal: AbortSignal) => { signals.push(signal); return next() })
    const view = hook(read)
    await waitFor(() => expect(view.result.current.status).toBe('READY'))
    vi.setSystemTime(T0 + HOME_RETURN_FRESH_MS + 1)
    next = () => new Promise(() => {})
    view.rerender({ enabled: false, keys: [] })
    view.rerender({ enabled: true, keys: [] })
    expect(read).toHaveBeenCalledTimes(2)
    view.rerender({ enabled: false, keys: [] })
    expect(signals[1]!.aborted).toBe(true)
    expect(view.result.current).toEqual({ status: 'READY', value: 'value' })
    view.rerender({ enabled: true, keys: [] })
    expect(read).toHaveBeenCalledTimes(3)
    expect(view.result.current).toEqual({ status: 'READY', value: 'value' })
  })

  it.each([
    ['inside the window, A is shown again without a read', 1_000, { status: 'READY', value: 'a-value' }, 2],
    ['after the window, A is shown again while it is read again', HOME_RETURN_FRESH_MS, { status: 'READY', value: 'a-value' }, 3],
  ] as const)('A, B, A with the read for B dropped: %s', async (_label, elapsed, shown, reads) => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const signals: AbortSignal[] = []
    let next: () => Promise<string | null> = async () => 'a-value'
    const read = vi.fn((signal: AbortSignal) => { signals.push(signal); return next() })
    const view = hook(read, ['a'])
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'a-value' }))
    next = () => new Promise(() => {})
    view.rerender({ enabled: true, keys: ['b'] })
    expect(view.result.current).toEqual({ status: 'LOADING' })
    vi.setSystemTime(T0 + elapsed)
    view.rerender({ enabled: true, keys: ['a'] })
    expect(signals[1]!.aborted).toBe(true)
    expect(view.result.current).toEqual(shown)
    await flush()
    expect(view.result.current).toEqual(shown)
    expect(read).toHaveBeenCalledTimes(reads)
  })

  it('a changed data identity never shows the previous value', async () => {
    const read = vi.fn(async () => 'value')
    const view = hook(read, ['api-a'])
    await waitFor(() => expect(view.result.current.status).toBe('READY'))
    view.rerender({ enabled: false, keys: ['api-a'] })
    view.rerender({ enabled: true, keys: ['api-b'] })
    expect(view.result.current.status).toBe('LOADING')
    await waitFor(() => expect(view.result.current.status).toBe('READY'))
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('the first render for changed deps on the same mounted module never returns the previous value (FA-05)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    let hang = false
    const read = vi.fn((): Promise<string | null> => (hang ? new Promise(() => {}) : Promise.resolve('a-value')))
    // Every render is recorded, not only the value after effects have run.
    const seen: Array<readonly [unknown, Load<string>]> = []
    const view = renderHook(({ enabled, keys }: { enabled: boolean; keys: readonly unknown[] }) => {
      const load = useHomeLoad(enabled, read, keys)
      seen.push([keys[0], load])
      return load
    }, { initialProps: { enabled: true, keys: ['api-a'] as readonly unknown[] } })
    await waitFor(() => expect(view.result.current).toEqual({ status: 'READY', value: 'a-value' }))
    hang = true
    const from = seen.length
    view.rerender({ enabled: true, keys: ['api-b'] })
    expect(seen.slice(from).length).toBeGreaterThan(0)
    expect(seen.slice(from).every(([id, load]) => id === 'api-b' && load.status === 'LOADING')).toBe(true)
    // Hidden with other deps: still not A's value.
    view.rerender({ enabled: false, keys: ['api-c'] })
    expect(view.result.current.status).toBe('LOADING')
    // Back to A inside its window: A's value on the first render, and no read.
    const back = seen.length
    view.rerender({ enabled: true, keys: ['api-a'] })
    expect(seen[back]).toEqual(['api-a', { status: 'READY', value: 'a-value' }])
    await flush()
    expect(view.result.current).toEqual({ status: 'READY', value: 'a-value' })
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('real HomeValve: returning to HOME keeps the list and issues no request', async () => {
    const read = vi.fn(async () => structuredClone(valveListFixture))
    const gateway = { kind: 'SYNTHETIC_TEST', read }
    const page = (active: boolean) => <LangProvider lang="en"><HomeValve gateway={gateway as never} active={active} href="/valve" onClick={() => {}} /></LangProvider>
    const view = render(page(true))
    const module = await screen.findByTestId('home-valve')
    await waitFor(() => expect(module.querySelector('.public-home__rows--valve')).not.toBeNull())
    view.rerender(page(false))
    view.rerender(page(true))
    expect(module.querySelector('.public-home__rows--valve')).not.toBeNull()
    await flush()
    expect(read).toHaveBeenCalledTimes(1)
  })

  it('hero: a new per-visit directory episode on return does not reset the READY headline', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const release = { publication_id: 'pub-1', measured_end: '2026-10-01' }
    const scope = {
      scope_code: 'ALL', scope_token: 'scope-all', first_available_date: '2026-01-01', last_available_date: '2026-10-01',
      series_source: 'REGULAR', current_member_count: 12,
    }
    const fake = {
      directoryV3Groups: vi.fn(async () => ({ release })),
      isActiveDirectoryFresh: vi.fn(() => true),
      directoryV3ScopePages: vi.fn(async () => ({ release, scopes: [scope] })),
      seriesV3Pages: vi.fn(async () => ({ response_kind: 'MARKET_SECTOR_INDEX_SERIES', points: [] })),
    }
    const api = fake as unknown as MarketSectorIndexPublicApi
    // PublicBetaApp recreates the episode whenever HOME activation flips.
    const page = (active: boolean, episode: HomeDirectory) => (
      <LangProvider lang="en"><HomeMarketPanel active={active} api={api} preparedDirectory={episode} marketHref="/market" onMarketClick={() => {}} catalogStatus={null} /></LangProvider>
    )
    const view = render(page(true, prepareHomeDirectory(api)))
    const panel = screen.getByTestId('home-market')
    await waitFor(() => expect(panel).toHaveClass('public-home__market--ready'))
    view.rerender(page(false, prepareHomeDirectory(api)))
    view.rerender(page(true, prepareHomeDirectory(api)))
    expect(panel).toHaveClass('public-home__market--ready')
    await flush()
    expect(fake.seriesV3Pages).toHaveBeenCalledTimes(1)

    view.rerender(page(false, prepareHomeDirectory(api)))
    vi.setSystemTime(T0 + HOME_RETURN_FRESH_MS + 1)
    view.rerender(page(true, prepareHomeDirectory(api)))
    // Past the window the headline stays READY while it is read again.
    expect(panel).toHaveClass('public-home__market--ready')
    await waitFor(() => expect(fake.seriesV3Pages).toHaveBeenCalledTimes(2))
    await flush()
    expect(panel).toHaveClass('public-home__market--ready')
  })
})
