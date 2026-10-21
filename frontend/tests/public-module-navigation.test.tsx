import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CatalogBrowseState } from '../src/contract/catalogBrowse'
import type { PersonalWatchlistStore } from '../src/watchlist/personalWatchlist'

type CatalogRouteCallback = (change: Readonly<{ snapshotId?: string | null }>, mode?: 'push' | 'replace') => void
const controls = vi.hoisted(() => ({
  moduleIndex: 0,
  gates: new Map<number, Promise<unknown>>(),
  catalogActive: false,
  catalogRoute: undefined as CatalogRouteCallback | undefined,
  catalogChange: undefined as ((state: CatalogBrowseState) => void) | undefined,
  catalogState: undefined as CatalogBrowseState | undefined,
}))

// Only the module wait and data-producing children are controlled. The real App,
// route parser/history, module arbiter, retained surfaces and DOM execute together.
// Only standard page modules remain reachable; WP4 module replacements are retired.
const MARKET_MODULE = 1, TRENDING_MODULE = 6
vi.mock('../src/performance/preloadable', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/performance/preloadable')>()
  return { preloadable: (...args: Parameters<typeof original.preloadable>) => {
    const index = controls.moduleIndex++, module = original.preloadable(...args)
    return { ...module, preload: () => {
      const gate = controls.gates.get(index)
      return gate === undefined ? module.preload() : gate.then(module.preload)
    } }
  } }
})
vi.mock('../src/performance/intentPrefetch', () => ({
  createIntentPrefetchScheduler: () => ({ schedule() {}, cancel() {}, cancelAll() {} }),
}))
vi.mock('../src/performance/homeDirectory', () => ({
  prepareHomeDirectory: (api: unknown) => ({ api, start: () => () => {}, read: async () => null }),
}))
vi.mock('../src/components/CurrentFxReference', () => ({ CurrentFxReference: () => null }))
vi.mock('../src/pages/PublicHomePage', () => ({ PublicHomePage: () => <h1>fixture-home</h1> }))
vi.mock('../src/pages/PublicMarketPage', () => ({ PublicMarketPage: () => <h1>fixture-market</h1> }))
vi.mock('../src/pages/PublicTrendingPage', () => ({ PublicTrendingPage: () => <h1>fixture-trending</h1> }))
vi.mock('../src/components/ProgressiveCatalogDisplayBrowseBoundary', () => ({
  ProgressiveCatalogDisplayBrowseBoundary: (props: {
    active: boolean, state: CatalogBrowseState, onChange: (state: CatalogBrowseState) => void,
    onQueryRouteChange: CatalogRouteCallback,
  }) => {
    controls.catalogActive = props.active
    controls.catalogRoute = props.onQueryRouteChange
    controls.catalogState = props.state
    controls.catalogChange = props.onChange
    return <h1>fixture-catalog</h1>
  },
}))

import { PublicBetaApp } from '../src/PublicBetaApp'
import { publicHistoryState } from '../src/publicNavigation'

const store: PersonalWatchlistStore = {
  readAll: async () => [], put: async () => {}, putMany: async () => {}, remove: async () => {}, clear: async () => {},
}
const deferred = () => {
  let resolve!: () => void, reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve() }
function clickNav(path: string): void {
  const link = document.querySelector<HTMLAnchorElement>(`nav a[href="${path}"]`)
  if (!link) throw new Error(`Missing fixture navigation ${path}`)
  fireEvent.click(link)
}
async function mount(path = '/'): Promise<void> {
  window.history.replaceState(publicHistoryState(false), '', path)
  render(<PublicBetaApp personalWatchlistStore={store} now={() => new Date('2026-10-05T06:00:00Z')} />)
  await screen.findByRole('heading', { name: path.startsWith('/catalog') ? 'fixture-catalog' : 'fixture-home' })
}
const main = () => document.querySelector('main')!
beforeEach(() => {
  controls.gates.clear(); controls.catalogRoute = undefined; controls.catalogChange = undefined
  controls.catalogState = undefined; controls.catalogActive = false
  window.localStorage.clear()
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('real App arbitration with controlled late module/data completion', () => {
  it.each([
    ['/market', MARKET_MODULE, 'fixture-market', 'index'],
    ['/trending', TRENDING_MODULE, 'fixture-trending', 'trending'],
  ] as const)('ignores retired WP4 selection and awaits the standard module on %s', async (path, moduleIndex, panel, kind) => {
    window.history.replaceState(publicHistoryState(false), '', '/')
    const read = vi.fn(), day = vi.fn()
    const selection = kind === 'index'
      ? { index: { gateway: { read }, request: null } }
      : { trending: { gateway: { day }, selection: null } }
    render(<PublicBetaApp nativeCnyPublic={selection} personalWatchlistStore={store} />)
    await screen.findByRole('heading', { name: 'fixture-home' })
    const gate = deferred(); controls.gates.set(moduleIndex, gate.promise)
    clickNav(path)
    expect(main()).toHaveAttribute('aria-busy', 'true')
    expect(window.location.pathname).toBe('/')
    await act(async () => { gate.resolve(); await flush() })
    await screen.findByText(panel)
    expect(main()).toHaveAttribute('aria-busy', 'false')
    expect(screen.getByRole('heading', { name: panel })).toBeVisible()
    clickNav('/')
    await waitFor(() => expect(window.location.pathname).toBe('/'))
    expect(screen.getByRole('heading', { name: 'fixture-home' })).toBeVisible()
    expect(screen.getByText(panel)).not.toBeVisible()
    expect(read).not.toHaveBeenCalled(); expect(day).not.toHaveBeenCalled()
  })

  it.each(['sidebar', 'brand'] as const)('A to pending B to A cancels B through the %s without writing history', async (entry) => {
    await mount()
    const gate = deferred(); controls.gates.set(MARKET_MODULE, gate.promise)
    const push = vi.spyOn(window.history, 'pushState'), replace = vi.spyOn(window.history, 'replaceState')
    clickNav('/market'); expect(main()).toHaveAttribute('aria-busy', 'true')
    if (entry === 'sidebar') clickNav('/')
    else fireEvent.click(document.querySelector('.formal-site__masthead-brand')!)
    expect(main()).toHaveAttribute('aria-busy', 'false')
    expect(main()).not.toHaveAttribute('inert')
    await act(async () => { gate.resolve(); await flush() })
    expect(window.location.pathname).toBe('/')
    expect(push).not.toHaveBeenCalled(); expect(replace).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'fixture-home' })).toBeVisible()
  })

  it('old Catalog completion cannot cancel a pending destination or replace its URL', async () => {
    await mount('/catalog')
    const oldCompletion = controls.catalogRoute!, gate = deferred()
    controls.gates.set(MARKET_MODULE, gate.promise)
    const push = vi.spyOn(window.history, 'pushState'), replace = vi.spyOn(window.history, 'replaceState')
    clickNav('/market')
    await act(async () => { oldCompletion({ snapshotId: 'late-snapshot' }, 'replace'); await flush() })
    expect(main()).toHaveAttribute('aria-busy', 'true')
    expect(window.location.search).not.toContain('late-snapshot')
    expect(replace).not.toHaveBeenCalled()
    await act(async () => { gate.resolve(); await flush() })
    await screen.findByRole('heading', { name: 'fixture-market' })
    expect(window.location.pathname).toBe('/market'); expect(push).toHaveBeenCalledTimes(1)
  })

  it('pauses Catalog reads during module wait and resumes on reselecting Catalog', async () => {
    await mount('/catalog')
    const gate = deferred(); controls.gates.set(MARKET_MODULE, gate.promise)
    expect(controls.catalogActive).toBe(true)
    clickNav('/market'); expect(controls.catalogActive).toBe(false)
    clickNav('/catalog'); expect(controls.catalogActive).toBe(true)
    await act(async () => { controls.catalogRoute!({ snapshotId: 'current-snapshot' }); gate.resolve(); await flush() })
    expect(window.location.pathname).toBe('/catalog')
    expect(new URLSearchParams(window.location.search).get('snapshot')).toBe('current-snapshot')
  })

  it('binds Catalog normalization to the exact source route after a language update', async () => {
    await mount('/catalog')
    const obsolete = controls.catalogRoute!
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    const replace = vi.spyOn(window.history, 'replaceState')
    await act(async () => { obsolete({ snapshotId: 'old-language-result' }); await flush() })
    expect(new URLSearchParams(window.location.search).get('snapshot')).toBeNull()
    expect(replace).not.toHaveBeenCalled()
    await act(async () => { controls.catalogRoute!({ snapshotId: 'current-language-result' }); await flush() })
    expect(new URLSearchParams(window.location.search).get('snapshot')).toBe('current-language-result')
    expect(document.documentElement.lang).toBe('en')
    expect(replace).toHaveBeenCalledTimes(1)
  })

  it('binds Catalog normalization to the exact source query after a filter update', async () => {
    await mount('/catalog')
    const obsolete = controls.catalogRoute!
    await act(async () => { controls.catalogChange!({ ...controls.catalogState!, seriesQuery: 'changed' }); await flush() })
    await act(async () => { obsolete({ snapshotId: 'old-query-result' }); await flush() })
    expect(new URLSearchParams(window.location.search).get('snapshot')).toBeNull()
    expect(new URLSearchParams(window.location.search).get('q')).toBe('changed')
    await act(async () => { controls.catalogRoute!({ snapshotId: 'current-query-result' }); await flush() })
    expect(new URLSearchParams(window.location.search).get('snapshot')).toBe('current-query-result')
  })

  it('ignores an old Catalog callback after a different surface commits', async () => {
    await mount('/catalog'); const obsolete = controls.catalogRoute!
    clickNav('/')
    await screen.findByRole('heading', { name: 'fixture-home' })
    await act(async () => { obsolete({ snapshotId: 'hidden-catalog-result' }); await flush() })
    expect(window.location.pathname).toBe('/'); expect(window.location.search).toBe('')
  })

  it('does not re-admit an obsolete Catalog callback after leaving and returning to the same URL', async () => {
    await mount('/catalog'); const obsolete = controls.catalogRoute!
    clickNav('/'); await screen.findByRole('heading', { name: 'fixture-home' })
    clickNav('/catalog'); await screen.findByRole('heading', { name: 'fixture-catalog' })
    await act(async () => { obsolete({ snapshotId: 'previous-visit-result' }); await flush() })
    expect(window.location.pathname).toBe('/catalog')
    expect(new URLSearchParams(window.location.search).get('snapshot')).toBeNull()
    await act(async () => { controls.catalogRoute!({ snapshotId: 'current-visit-result' }); await flush() })
    expect(new URLSearchParams(window.location.search).get('snapshot')).toBe('current-visit-result')
  })

  it('a user language change on the displayed page supersedes a pending destination', async () => {
    await mount(); const gate = deferred(); controls.gates.set(MARKET_MODULE, gate.promise)
    const push = vi.spyOn(window.history, 'pushState'), replace = vi.spyOn(window.history, 'replaceState')
    clickNav('/market'); fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    await act(async () => { gate.resolve(); await flush() })
    expect(window.location.pathname).toBe('/'); expect(document.documentElement.lang).toBe('en')
    expect(new URLSearchParams(window.location.search).get('lang')).toBe('en')
    expect(main()).toHaveAttribute('aria-busy', 'false'); expect(main()).not.toHaveAttribute('inert')
    expect(push).not.toHaveBeenCalled(); expect(replace).toHaveBeenCalledTimes(1)
  })

  it('A to pending B to C commits only C when imports settle out of order', async () => {
    await mount()
    const first = deferred(), second = deferred()
    controls.gates.set(MARKET_MODULE, first.promise); controls.gates.set(TRENDING_MODULE, second.promise)
    const push = vi.spyOn(window.history, 'pushState')
    clickNav('/market'); clickNav('/trending')
    await act(async () => { second.resolve(); await flush() })
    await screen.findByRole('heading', { name: 'fixture-trending' })
    await act(async () => { first.resolve(); await flush() })
    expect(window.location.pathname).toBe('/trending'); expect(push).toHaveBeenCalledTimes(1)
    expect(main()).toHaveAttribute('aria-busy', 'false'); expect(main()).not.toHaveAttribute('inert')
  })

  it('a popstate to the displayed route cancels the wait without pushing a late destination', async () => {
    await mount(); const gate = deferred(); controls.gates.set(MARKET_MODULE, gate.promise)
    const push = vi.spyOn(window.history, 'pushState')
    clickNav('/market')
    window.history.replaceState(publicHistoryState(false), '', '/')
    fireEvent(window, new PopStateEvent('popstate', { state: window.history.state }))
    await act(async () => { gate.resolve(); await flush() })
    expect(window.location.pathname).toBe('/'); expect(push).not.toHaveBeenCalled()
    expect(main()).toHaveAttribute('aria-busy', 'false'); expect(main()).not.toHaveAttribute('inert')
  })

  it.each(['sidebar', 'brand'].flatMap((entry) => ['success', 'reject', 'timeout'].map((settlement) => ({ entry, settlement }))))(
    'reselects displayed A after the URL already moved to pending B: $entry / $settlement', async ({ entry, settlement }) => {
      await mount(); vi.useFakeTimers()
      const gate = deferred(); controls.gates.set(MARKET_MODULE, gate.promise)
      // Controlled popstate: the browser URL/history entry has moved BEFORE
      // App module admission. This is the reverse of the prior popstate test.
      const destinationState = publicHistoryState(false)
      window.history.pushState(destinationState, '', '/market?view=sectors')
      fireEvent(window, new PopStateEvent('popstate', { state: destinationState }))
      expect(window.location.pathname).toBe('/market')
      expect(screen.getByRole('heading', { name: 'fixture-home' })).toBeVisible()
      expect(main()).toHaveAttribute('aria-busy', 'true')
      const length = window.history.length
      const push = vi.spyOn(window.history, 'pushState'), replace = vi.spyOn(window.history, 'replaceState')
      if (entry === 'sidebar') clickNav('/')
      else fireEvent.click(document.querySelector('.formal-site__masthead-brand')!)
      expect(window.location.pathname).toBe('/'); expect(window.location.search).toBe('')
      expect(window.history.state).toEqual(publicHistoryState(false))
      expect(push).toHaveBeenCalledTimes(1); expect(replace).not.toHaveBeenCalled()
      expect(window.history.length).toBe(length + 1)
      expect(main()).toHaveAttribute('aria-busy', 'false'); expect(main()).not.toHaveAttribute('inert')
      await act(async () => {
        if (settlement === 'success') gate.resolve()
        else if (settlement === 'reject') gate.reject(new Error('controlled traversal preload failure'))
        else await vi.advanceTimersByTimeAsync(15_001)
        await flush()
      })
      expect(window.location.pathname).toBe('/'); expect(window.history.state).toEqual(publicHistoryState(false))
      expect(screen.getByRole('heading', { name: 'fixture-home' })).toBeVisible()
      expect(push).toHaveBeenCalledTimes(1); expect(replace).not.toHaveBeenCalled()
    },
  )

  it('preserves the traversed destination entry for later Back/Forward instead of replacing it', async () => {
    await mount()
    const gate = deferred(); controls.gates.set(MARKET_MODULE, gate.promise)
    const destinationState = publicHistoryState(false), destination = '/market?lang=en&view=sectors'
    window.history.pushState(destinationState, '', destination)
    fireEvent(window, new PopStateEvent('popstate', { state: destinationState }))
    const push = vi.spyOn(window.history, 'pushState'), replace = vi.spyOn(window.history, 'replaceState')
    clickNav('/')
    await act(async () => { gate.resolve(); await flush() })
    controls.gates.delete(MARKET_MODULE)
    expect(window.location.pathname).toBe('/')
    // jsdom's own history traversal, not a manually synthesized second event;
    // this still does NOT claim validation of native Chrome history behavior.
    await act(async () => { window.history.back() })
    await screen.findByRole('heading', { name: 'fixture-market' })
    expect(window.location.pathname + window.location.search).toBe(destination)
    expect(window.history.state).toEqual(destinationState)
    await waitFor(() => expect(document.documentElement.lang).toBe('en'))
    expect(main()).toHaveAttribute('aria-busy', 'false')
    await act(async () => { window.history.forward() })
    await screen.findByRole('heading', { name: 'fixture-home' })
    expect(window.location.pathname + window.location.search).toBe('/')
    await waitFor(() => expect(document.documentElement.lang).toBe('zh-CN'))
    expect(main()).toHaveAttribute('aria-busy', 'false'); expect(main()).not.toHaveAttribute('inert')
    expect(push).toHaveBeenCalledTimes(1); expect(replace).not.toHaveBeenCalled()
  })

  it('keeps the moved history cursor through a superseding uncommitted click before reselecting A', async () => {
    await mount()
    const first = deferred(), second = deferred()
    controls.gates.set(MARKET_MODULE, first.promise); controls.gates.set(TRENDING_MODULE, second.promise)
    window.history.pushState(publicHistoryState(false), '', '/market')
    fireEvent(window, new PopStateEvent('popstate', { state: window.history.state }))
    const push = vi.spyOn(window.history, 'pushState'), replace = vi.spyOn(window.history, 'replaceState')
    clickNav('/trending'); clickNav('/')
    expect(window.location.pathname).toBe('/')
    await act(async () => { second.resolve(); first.resolve(); await flush() })
    expect(window.location.pathname).toBe('/')
    expect(screen.getByRole('heading', { name: 'fixture-home' })).toBeVisible()
    expect(main()).toHaveAttribute('aria-busy', 'false'); expect(main()).not.toHaveAttribute('inert')
    expect(push).toHaveBeenCalledTimes(1); expect(replace).not.toHaveBeenCalled()
  })

  it('pushes a new language intent after pending traversal instead of overwriting its destination', async () => {
    await mount(); const gate = deferred(); controls.gates.set(MARKET_MODULE, gate.promise)
    window.history.pushState(publicHistoryState(false), '', '/market')
    fireEvent(window, new PopStateEvent('popstate', { state: window.history.state }))
    const push = vi.spyOn(window.history, 'pushState'), replace = vi.spyOn(window.history, 'replaceState')
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    await act(async () => { gate.resolve(); await flush() })
    expect(window.location.pathname + window.location.search).toBe('/?lang=en')
    expect(window.history.state).toEqual(publicHistoryState(false))
    expect(document.documentElement.lang).toBe('en')
    expect(main()).toHaveAttribute('aria-busy', 'false'); expect(main()).not.toHaveAttribute('inert')
    expect(push).toHaveBeenCalledTimes(1); expect(replace).not.toHaveBeenCalled()
  })

  it('clears the traversal marker after its route commits so a later click cancellation writes no history', async () => {
    await mount(); const first = deferred(); controls.gates.set(MARKET_MODULE, first.promise)
    window.history.pushState(publicHistoryState(false), '', '/market')
    fireEvent(window, new PopStateEvent('popstate', { state: window.history.state }))
    await act(async () => { first.resolve(); await flush() })
    await screen.findByRole('heading', { name: 'fixture-market' })
    const second = deferred(); controls.gates.set(TRENDING_MODULE, second.promise)
    const push = vi.spyOn(window.history, 'pushState'), replace = vi.spyOn(window.history, 'replaceState')
    clickNav('/trending'); clickNav('/market')
    await act(async () => { second.resolve(); await flush() })
    expect(window.location.pathname).toBe('/market')
    expect(main()).toHaveAttribute('aria-busy', 'false'); expect(main()).not.toHaveAttribute('inert')
    expect(push).not.toHaveBeenCalled(); expect(replace).not.toHaveBeenCalled()
  })

  it('a second popstate to displayed A reconciles without a recovery push', async () => {
    await mount(); const gate = deferred(); controls.gates.set(MARKET_MODULE, gate.promise)
    window.history.pushState(publicHistoryState(false), '', '/market')
    fireEvent(window, new PopStateEvent('popstate', { state: window.history.state }))
    window.history.pushState(publicHistoryState(false), '', '/')
    const push = vi.spyOn(window.history, 'pushState'), replace = vi.spyOn(window.history, 'replaceState')
    fireEvent(window, new PopStateEvent('popstate', { state: window.history.state }))
    clickNav('/')
    await act(async () => { gate.resolve(); await flush() })
    expect(window.location.pathname).toBe('/')
    expect(main()).toHaveAttribute('aria-busy', 'false'); expect(main()).not.toHaveAttribute('inert')
    expect(push).not.toHaveBeenCalled(); expect(replace).not.toHaveBeenCalled()
  })

  it('latest traversal and explicit reselect win over both older pending destinations', async () => {
    await mount(); const first = deferred(), second = deferred()
    controls.gates.set(MARKET_MODULE, first.promise); controls.gates.set(TRENDING_MODULE, second.promise)
    for (const destination of ['/market', '/trending']) {
      window.history.pushState(publicHistoryState(false), '', destination)
      fireEvent(window, new PopStateEvent('popstate', { state: window.history.state }))
    }
    const push = vi.spyOn(window.history, 'pushState'), replace = vi.spyOn(window.history, 'replaceState')
    clickNav('/')
    await act(async () => { first.resolve(); second.reject(new Error('controlled later traversal failure')); await flush() })
    expect(window.location.pathname).toBe('/')
    expect(window.history.state).toEqual(publicHistoryState(false))
    expect(main()).toHaveAttribute('aria-busy', 'false'); expect(main()).not.toHaveAttribute('inert')
    expect(push).toHaveBeenCalledTimes(1); expect(replace).not.toHaveBeenCalled()
  })

  it('a late rejection after reselecting the displayed page cannot navigate', async () => {
    await mount(); const gate = deferred(); controls.gates.set(MARKET_MODULE, gate.promise)
    const push = vi.spyOn(window.history, 'pushState')
    clickNav('/market'); clickNav('/')
    await act(async () => { gate.reject(new Error('controlled preload failure')); await flush() })
    expect(window.location.pathname).toBe('/'); expect(push).not.toHaveBeenCalled()
    expect(main()).toHaveAttribute('aria-busy', 'false')
  })

  it('cancelled module timeout cannot commit or steal focus later', async () => {
    await mount(); vi.useFakeTimers()
    const gate = deferred(); controls.gates.set(MARKET_MODULE, gate.promise)
    const push = vi.spyOn(window.history, 'pushState')
    clickNav('/market')
    const brand = document.querySelector<HTMLElement>('.formal-site__masthead-brand')!
    brand.focus(); fireEvent.click(brand)
    await act(async () => { await vi.advanceTimersByTimeAsync(15_001); gate.resolve(); await flush() })
    expect(window.location.pathname).toBe('/'); expect(push).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(brand); expect(main()).not.toHaveAttribute('inert')
  })

  it('unmount invalidates pending import completion and history side effects', async () => {
    await mount(); const gate = deferred(); controls.gates.set(MARKET_MODULE, gate.promise)
    const push = vi.spyOn(window.history, 'pushState')
    clickNav('/market'); cleanup()
    await act(async () => { gate.resolve(); await flush() })
    expect(window.location.pathname).toBe('/'); expect(push).not.toHaveBeenCalled()
    await waitFor(() => expect(document.querySelector('main')).toBeNull())
  })
})
