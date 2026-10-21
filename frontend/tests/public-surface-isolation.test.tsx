import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersonalWatchlistStore } from '../src/watchlist/personalWatchlist'

const controls = vi.hoisted(() => ({
  moduleIndex: 0,
  failing: new Set<number>(),
  attempts: new Map<number, number>(),
  gates: new Map<number, Promise<unknown>>(),
  prefetches: new Map<string, (signal: AbortSignal) => Promise<void>>(),
  reloads: [] as string[],
  marketFailure: undefined as unknown,
  marketWait: undefined as Promise<void> | undefined,
  // What a build does for a failed dynamic import: report it, then reject with that error.
  failedImport(): TypeError {
    const error = new TypeError('Failed to fetch dynamically imported module')
    const event = new Event('vite:preloadError', { cancelable: true }) as Event & { payload?: unknown }
    event.payload = error
    window.dispatchEvent(event)
    return error
  },
}))

// The real App, preloadable, module arbiter, boundaries and history run together. Only the import
// inside a page module fails on request (every attempt anew, like a build's import of a module whose
// fetch failed), a navigation wait can be gated, and the reload records the address it would load.
// Indices follow the eleven preloadable declarations in PublicBetaApp.tsx.
const TRENDING_MODULE = 6, TRADEUP_MODULE = 7
vi.mock('../src/performance/preloadable', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/performance/preloadable')>()
  return { preloadable: (load: Parameters<typeof original.preloadable>[0]) => {
    const index = controls.moduleIndex++
    const module = original.preloadable((): ReturnType<typeof load> => {
      controls.attempts.set(index, (controls.attempts.get(index) ?? 0) + 1)
      return controls.failing.has(index) ? Promise.reject(controls.failedImport()) : load()
    })
    return { ...module, preload: () => {
      const gate = controls.gates.get(index)
      return gate === undefined ? module.preload() : gate.then(module.preload)
    } }
  } }
})
// Prefetch intents are kept so a test can run one; like the real scheduler, a failure is dropped.
vi.mock('../src/performance/intentPrefetch', () => ({
  createIntentPrefetchScheduler: () => ({
    schedule(key: string, task: (signal: AbortSignal) => Promise<void>) { controls.prefetches.set(key, task) },
    cancel(key: string) { controls.prefetches.delete(key) },
    cancelAll() { controls.prefetches.clear() },
  }),
}))
vi.mock('../src/performance/moduleLoadRecovery', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/performance/moduleLoadRecovery')>()
  return { ...original, reloadPage: () => { controls.reloads.push(`${window.location.pathname}${window.location.search}`) } }
})
vi.mock('../src/performance/homeDirectory', () => ({
  prepareHomeDirectory: (api: unknown) => ({ api, start: () => () => {}, read: async () => null }),
}))
vi.mock('../src/components/CurrentFxReference', () => ({ CurrentFxReference: () => null }))
vi.mock('../src/pages/PublicHomePage', () => ({ PublicHomePage: () => <h1>fixture-home</h1> }))
vi.mock('../src/pages/PublicMarketPage', async () => {
  const { use } = await import('react')
  return { PublicMarketPage: () => {
    if (controls.marketFailure !== undefined) throw controls.marketFailure
    if (controls.marketWait !== undefined) use(controls.marketWait)
    return <h1>fixture-market</h1>
  } }
})
vi.mock('../src/pages/PublicTrendingPage', () => ({ PublicTrendingPage: () => <h1>fixture-trending</h1> }))
vi.mock('../src/pages/PublicTradeUpPage', () => ({ PublicTradeUpPage: () => <h1>fixture-tradeup</h1> }))

import { PublicBetaApp } from '../src/PublicBetaApp'
import { publicHistoryState } from '../src/publicNavigation'
import { MODULE_RELOAD_SESSION_KEY, moduleReloadEnvironment, trackModuleLoadFailures } from '../src/performance/moduleLoadRecovery'

const store: PersonalWatchlistStore = {
  readAll: async () => [], put: async () => {}, putMany: async () => {}, remove: async () => {}, clear: async () => {},
}
const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((yes) => { resolve = yes })
  return { promise, resolve }
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve() }
// Lets every settled import, lazy retry and commit run.
const settle = () => act(async () => {
  for (let i = 0; i < 4; i++) { await flush(); await new Promise((done) => setTimeout(done, 0)) }
})
function navLink(path: string): HTMLAnchorElement {
  const link = document.querySelector<HTMLAnchorElement>(`nav a[href="${path}"]`)
  if (!link) throw new Error(`Missing fixture navigation ${path}`)
  return link
}
const clickNav = async (path: string) => { fireEvent.click(navLink(path)); await settle() }
const back = async () => { await act(async () => { window.history.back() }); await settle() }
async function mount(path = '/', heading: string | null = 'fixture-home'): Promise<void> {
  window.history.replaceState(publicHistoryState(false), '', path)
  render(<PublicBetaApp personalWatchlistStore={store} now={() => new Date('2026-10-05T06:00:00Z')} />)
  if (heading !== null) await screen.findByRole('heading', { name: heading })
  await settle()
}
const main = () => document.querySelector('main')!
const pages = () => [...main().children].filter((child): child is HTMLElement => child instanceof HTMLElement && child.tagName === 'SECTION')
// The kept-alive page the reader is on; every other one is hidden.
function shownPage(): HTMLElement {
  const shown = pages().filter((page) => !page.hidden)
  expect(shown).toHaveLength(1)
  return shown[0]!
}
const pageWith = (text: string) => pages().find((page) => page.textContent?.includes(text))!
// Every automatic reload first stores the tab's reload guard. The address at that moment is where
// that reload lands, whichever code performs it.
const guardWrites: string[] = []
// This tab already loaded this build again once after a failed module.
function reloadUsed(): void {
  window.sessionStorage.setItem(MODULE_RELOAD_SESSION_KEY, JSON.stringify([moduleReloadEnvironment().build]))
  guardWrites.length = 0
}

let stopTracking = () => {}
beforeEach(() => {
  controls.failing.clear(); controls.attempts.clear(); controls.gates.clear(); controls.prefetches.clear()
  controls.reloads.length = 0; controls.marketFailure = undefined; controls.marketWait = undefined
  window.localStorage.clear(); window.sessionStorage.removeItem(MODULE_RELOAD_SESSION_KEY)
  guardWrites.length = 0
  const setItem = Storage.prototype.setItem
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
    if (key === MODULE_RELOAD_SESSION_KEY) guardWrites.push(`${window.location.pathname}${window.location.search}`)
    setItem.call(this, key, value)
  })
  // Registered before the app in public-main; it records failures and reloads nothing itself.
  stopTracking = trackModuleLoadFailures(window)
})
afterEach(() => { cleanup(); stopTracking(); vi.restoreAllMocks() })

describe('a failed page module is recovered on the page the reader opened', () => {
  // First in the file: page modules keep their state across these tests, and this one needs the
  // first render of a module nothing has requested yet.
  it('a direct visit to a page whose module fails loads it again once', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    controls.failing.add(TRENDING_MODULE)
    await mount('/trending', null)
    await waitFor(() => expect(controls.reloads).toEqual(['/trending']))
    expect(guardWrites).toEqual(['/trending'])
    expect(controls.attempts.get(TRENDING_MODULE)).toBe(1)
  })

  it('a click to a page whose module fails loads the destination again once, after its route committed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await mount()
    controls.failing.add(TRENDING_MODULE)
    await clickNav('/trending')
    expect(window.location.pathname).toBe('/trending')
    expect(guardWrites).toEqual(['/trending'])
    await waitFor(() => expect(controls.reloads).toEqual(['/trending']))
    // The failed import is not repeated by rendering; the reload is the retry.
    expect(controls.attempts.get(TRENDING_MODULE)).toBe(1)
    expect(within(shownPage()).getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('a failed prefetch reloads nothing; the click that opens that page still recovers once', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await mount()
    controls.failing.add(TRENDING_MODULE)
    fireEvent.mouseEnter(navLink('/trending'))
    const prefetch = controls.prefetches.get('surface:TRENDING')
    expect(prefetch).toBeDefined()
    await act(async () => { await prefetch!(new AbortController().signal).catch(() => undefined) })
    await settle()
    expect(controls.attempts.get(TRENDING_MODULE)).toBe(1)
    expect(guardWrites).toEqual([])
    expect(controls.reloads).toEqual([])
    expect(window.sessionStorage.getItem(MODULE_RELOAD_SESSION_KEY)).toBeNull()
    expect(window.location.pathname).toBe('/')
    expect(screen.getByRole('heading', { name: 'fixture-home' })).toBeVisible()
    await clickNav('/trending')
    await waitFor(() => expect(controls.reloads).toEqual(['/trending']))
    expect(guardWrites).toEqual(['/trending'])
    expect(controls.attempts.get(TRENDING_MODULE)).toBe(2)
  })
})

describe('each kept-alive page fails and waits on its own', () => {
  it('a module that keeps failing shows its error on its own page only; Back into it retries without a reload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await mount()
    reloadUsed()
    controls.failing.add(TRENDING_MODULE)
    await clickNav('/trending')
    expect(window.location.pathname).toBe('/trending')
    await waitFor(() => expect(within(shownPage()).getByRole('alert')).toBeInTheDocument())
    await clickNav('/')
    expect(screen.getByRole('heading', { name: 'fixture-home' })).toBeVisible()
    expect(screen.queryByRole('alert')).toBeNull()
    await clickNav('/tradeup')
    expect(await screen.findByRole('heading', { name: 'fixture-tradeup' })).toBeVisible()
    expect(screen.queryByRole('alert')).toBeNull()
    await back()
    await waitFor(() => expect(window.location.pathname).toBe('/'))
    expect(screen.getByRole('heading', { name: 'fixture-home' })).toBeVisible()
    await back()
    await waitFor(() => expect(window.location.pathname).toBe('/trending'))
    await waitFor(() => expect(within(shownPage()).getByRole('alert')).toBeInTheDocument())
    expect(controls.attempts.get(TRENDING_MODULE)).toBe(2)
    expect(guardWrites).toEqual([])
    expect(controls.reloads).toEqual([])
  })

  it.each([
    ['recovered', undefined, []],
    ['still failing', 'failed', ['/market?lang=en']],
  ] as const)('a failure inside a hidden page leaves the shown page alone; showing it again retries it (%s)', async (_label, persists, reloads) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await mount()
    await clickNav('/market')
    await screen.findByRole('heading', { name: 'fixture-market' })
    const market = pageWith('fixture-market')
    await clickNav('/')
    const failure = controls.failedImport()
    controls.marketFailure = failure
    // A language change renders every kept-alive page again, the hidden one included.
    fireEvent.click(screen.getByRole('button', { name: 'EN' })); await settle()
    expect(document.documentElement.lang).toBe('en')
    expect(screen.getByRole('heading', { name: 'fixture-home' })).toBeVisible()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(guardWrites).toEqual([])
    expect(controls.reloads).toEqual([])
    // The hidden page holds the failure.
    expect(main().contains(market)).toBe(true)
    expect(market.hidden).toBe(true)
    expect(market.querySelector('[data-testid="public-runtime-error"]')).not.toBeNull()
    controls.marketFailure = persists === undefined ? undefined : failure
    await clickNav('/market?lang=en')
    expect(shownPage()).toBe(market)
    if (persists === undefined) expect(within(market).getByRole('heading', { name: 'fixture-market' })).toBeVisible()
    await waitFor(() => expect(controls.reloads).toEqual(reloads))
    expect(guardWrites).toEqual(reloads)
  })

  it('a wait inside a hidden page does not replace the shown page with a loading state', async () => {
    await mount()
    await clickNav('/market')
    await screen.findByRole('heading', { name: 'fixture-market' })
    const market = pageWith('fixture-market')
    await clickNav('/')
    controls.marketWait = new Promise<void>(() => {})
    fireEvent.click(screen.getByRole('button', { name: 'EN' })); await settle()
    expect(document.documentElement.lang).toBe('en')
    expect(screen.getByRole('heading', { name: 'fixture-home' })).toBeVisible()
    expect(within(shownPage()).queryByRole('status')).toBeNull()
    // The hidden page holds its own loading state.
    expect(market.hidden).toBe(true)
    expect(market.querySelector('.formal-site__module-loading')).not.toBeNull()
  })

  it('a failure on the page left behind by a pending navigation reloads nothing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await mount()
    await clickNav('/market')
    await screen.findByRole('heading', { name: 'fixture-market' })
    const market = pageWith('fixture-market')
    const gate = deferred(); controls.gates.set(TRADEUP_MODULE, gate.promise)
    controls.marketFailure = controls.failedImport()
    await clickNav('/tradeup')
    expect(main()).toHaveAttribute('aria-busy', 'true')
    expect(window.location.pathname).toBe('/market')
    // The page being left caught the failure while inert, and reloaded nothing.
    expect(shownPage()).toBe(market)
    expect(market.querySelector('[data-testid="public-runtime-error"]')).not.toBeNull()
    expect(guardWrites).toEqual([])
    expect(controls.reloads).toEqual([])
    await act(async () => { gate.resolve(); await flush() }); await settle()
    expect(await screen.findByRole('heading', { name: 'fixture-tradeup' })).toBeVisible()
    expect(window.location.pathname).toBe('/tradeup')
    expect(guardWrites).toEqual([])
    expect(controls.reloads).toEqual([])
  })
})
