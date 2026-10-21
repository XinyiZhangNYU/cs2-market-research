import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicBetaApp } from '../src/PublicBetaApp'
import { PublicHomePage } from '../src/pages/PublicHomePage'
import { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import type { NativeCnyPublicSelection } from '../src/api/NativeCnyPublicSelection'
import { publicHistoryState } from '../src/publicNavigation'

const inherited = vi.hoisted(() => ({ hero: vi.fn(), secondary: vi.fn(), current: vi.fn(), history: vi.fn(), monitor: vi.fn(), fx: vi.fn() }))
vi.mock('../src/pages/PublicHomeHero', () => ({
  useCompactHome: () => false,
  HomeMarketPanel: (props: unknown) => { inherited.hero(props); return <div data-testid="inherited-home-summary">OLD USD SUMMARY</div> },
}))
vi.mock('../src/pages/PublicHomeSecondary', () => ({
  PublicHomeSecondary: (props: unknown) => { inherited.secondary(props); return <div data-testid="inherited-home-secondary" /> },
}))
vi.mock('../src/pages/PublicWatchlistPage', () => ({
  PublicItemCurrentPage: (props: unknown) => { inherited.current(props); return <div data-testid="inherited-current">OLD STAGE</div> },
  PublicItemHistoryPage: (props: unknown) => { inherited.history(props); return <div data-testid="inherited-history">OLD HISTORY</div> },
  PublicWatchlistPage: (props: unknown) => { inherited.monitor(props); return <div data-testid="inherited-monitor" /> },
}))
vi.mock('../src/components/CurrentFxReference', () => ({
  CurrentFxReference: () => { inherited.fx(); return <div data-testid="inherited-fx" /> },
}))
const store = { readAll: async () => [], put: async () => {}, putMany: async () => {}, remove: async () => {}, clear: async () => {} }
const selection: NativeCnyPublicSelection = { index: { gateway: { read: vi.fn() }, request: null },
  trending: { gateway: { day: vi.fn() }, selection: null } }
const now = () => new Date('2026-10-04T00:00:00Z')
const pendingRead = () => new Promise<never>(() => {})
const noRead = () => vi.fn(pendingRead)
function go(path: string) {
  window.history.pushState(publicHistoryState(false), '', path)
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
}
beforeEach(() => {
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/?lang=zh')
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('synthetic suite prohibits network') }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('retires WP4 app overrides without changing other surfaces', () => {
  it('retired WP4 selection leaves HOME summary and FX mounted', async () => {
    const catalogRead = noRead(), directoryRead = noRead()
    render(<PublicBetaApp nativeCnyPublic={selection} personalWatchlistStore={store} now={now}
      catalogGateway={{ kind: 'UNUSED_CATALOG', read: catalogRead }}
      marketSectorIndexGateway={{ kind: 'UNUSED_DIRECTORY', read: directoryRead, readDirectoryV3: directoryRead }} />)
    await screen.findByTestId('inherited-home-summary')
    expect(screen.queryByTestId('native-cny-unavailable-home')).toBeNull()
    expect(inherited.hero).toHaveBeenCalled()
    expect(inherited.fx).toHaveBeenCalled()
  })

  it('adding retired WP4 selection does not tear down a warmed HOME or its pending request', async () => {
    let signal: AbortSignal | undefined
    const directoryRead = vi.fn((_request: unknown, options?: { signal?: AbortSignal }) => { signal = options?.signal; return pendingRead() })
    const catalogRead = noRead()
    const app = (nativeCnyPublic?: NativeCnyPublicSelection) => <PublicBetaApp nativeCnyPublic={nativeCnyPublic}
      personalWatchlistStore={store} now={now} catalogGateway={{ kind: 'PENDING_CATALOG', read: catalogRead }}
      marketSectorIndexGateway={{ kind: 'PENDING_DIRECTORY', read: directoryRead, readDirectoryV3: directoryRead }} />
    const rendered = render(app())
    await screen.findByTestId('inherited-home-summary')
    await waitFor(() => expect(signal).toBeDefined())
    rendered.rerender(app(selection))
    await screen.findByTestId('inherited-home-summary')
    expect(screen.queryByTestId('native-cny-unavailable-home')).toBeNull()
    expect(screen.getByTestId('inherited-fx')).toBeVisible()
    expect(signal?.aborted).toBe(false)
  })

  it.each(['/item-monitor?lang=zh', '/item-monitor/history?lang=zh'])('preserves the standard lifecycle at %s', async (path) => {
    window.history.replaceState(null, '', path)
    render(<PublicBetaApp nativeCnyPublic={selection} personalWatchlistStore={store} now={now} />)
    await screen.findByTestId(path.includes('/history') ? 'inherited-history' : 'inherited-current')
    expect(screen.queryByTestId('native-cny-unavailable-watchlist')).toBeNull()
  })

  it('retired WP4 props preserve current and exact history route pins', async () => {
    window.history.replaceState(null, '', '/item-monitor?lang=zh&publication=' + '4'.repeat(64) + '&unit=' + '5'.repeat(64))
    const app = (nativeCnyPublic?: NativeCnyPublicSelection) => <PublicBetaApp nativeCnyPublic={nativeCnyPublic} personalWatchlistStore={store} now={now} />
    const rendered = render(app())
    await screen.findByTestId('inherited-current')
    rendered.rerender(app(selection))
    expect(screen.getByTestId('inherited-current')).toBeVisible()
    act(() => go('/item-monitor/history?lang=zh&publication=' + '6'.repeat(64)))
    await screen.findByTestId('inherited-history')
    rendered.rerender(app())
    await screen.findByTestId('inherited-history')
    expect(inherited.history.mock.lastCall?.[0]).toMatchObject({ publicationId: '6'.repeat(64) })
  })

  it('direct HOME mode transition aborts its pending pulse and never displays inherited summary while native', async () => {
    let signal: AbortSignal | undefined
    const read = vi.fn((_request: unknown, options?: { signal?: AbortSignal }) => { signal = options?.signal; return pendingRead() })
    const indexApi = new MarketSectorIndexPublicApi({ kind: 'UNUSED_DIRECTORY', read: noRead() })
    const noClick = () => {}
    const props = { gateway: { kind: 'PENDING_CATALOG', read }, marketIndexApi: indexApi,
      trendingGateway: { kind: 'UNUSED_TRENDING', read: noRead() }, queryInstant: '2026-10-04T00:00:00Z',
      catalogHref: '/catalog', marketHref: '/market', sectorHref: () => '/market', watchlistHref: '/item-monitor',
      trendingHref: '/trending', valveHref: '/valve', tradeupHref: '/tradeup',
      onCatalogClick: noClick, onMarketClick: noClick, onSectorClick: noClick, onWatchlistClick: noClick,
      onTrendingClick: noClick, onValveClick: noClick, onTradeupClick: noClick }
    const rendered = render(<PublicHomePage {...props} />)
    await waitFor(() => expect(read).toHaveBeenCalledTimes(1))
    rendered.rerender(<PublicHomePage {...props} nativeCny />)
    expect(screen.queryByTestId('inherited-home-summary')).toBeNull()
    expect(screen.getByTestId('native-cny-unavailable-home')).toHaveAttribute('data-state', 'UNAVAILABLE')
    expect(signal?.aborted).toBe(true)
    expect(read).toHaveBeenCalledTimes(1)
  })
})
