import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicBetaApp } from '../src/PublicBetaApp'
import type { NativeCnyPublicSelection } from '../src/api/NativeCnyPublicSelection'

const capture = vi.hoisted(() => ({ market: vi.fn(), trending: vi.fn(), catalog: vi.fn() }))
vi.mock('../src/components/CurrentFxReference', () => ({ CurrentFxReference: () => null }))
vi.mock('../src/performance/homeDirectory', () => ({ prepareHomeDirectory: () => ({ start: () => () => {}, read: async () => null }) }))
vi.mock('../src/pages/PublicMarketPage', () => ({ PublicMarketPage: (props: unknown) => {
  capture.market(props); return <div data-testid="standard-market" />
} }))
vi.mock('../src/pages/PublicTrendingPage', () => ({ PublicTrendingPage: (props: unknown) => {
  capture.trending(props); return <div data-testid="standard-trending" />
} }))
vi.mock('../src/components/ProgressiveCatalogDisplayBrowseBoundary', () => ({ ProgressiveCatalogDisplayBrowseBoundary: (props: unknown) => {
  capture.catalog(props); return <div data-testid="standard-catalog" />
} }))
const store = { readAll: async () => [], put: async () => {}, putMany: async () => {}, remove: async () => {}, clear: async () => {} }
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('No network in synthetic app tests') }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('standard public entry and fixed rollback switch', () => {
  it.each(['1', '0'])('market switch %s preserves the page and selects only its gateway', async (flag) => {
    vi.stubEnv('VITE_NATIVE_CNY_MARKET', flag)
    window.history.replaceState(null, '', '/market')
    render(<PublicBetaApp personalWatchlistStore={store} />)
    await screen.findByTestId('standard-market')
    expect(capture.market.mock.lastCall?.[0].gateway.kind).toBe(flag === '1' ? 'NATIVE_CNY_MARKET_DESCRIPTIVE' : 'HTTP_MARKET_DESCRIPTIVE_PUBLIC')
    expect(capture.market.mock.lastCall?.[0].indexGateway.kind).toBe(flag === '1'
      ? 'NATIVE_CNY_MARKET_INDEX' : 'HTTP_MARKET_SECTOR_INDEX_PUBLIC_V2_WITH_V1_FALLBACK')
    expect(screen.queryByTestId('native-cny-index-panel')).toBeNull()
  })
  it('defaults native on without a configured flag', async () => {
    vi.stubEnv('VITE_NATIVE_CNY_MARKET', undefined)
    window.history.replaceState(null, '', '/market')
    render(<PublicBetaApp personalWatchlistStore={store} />)
    await screen.findByTestId('standard-market')
    expect(capture.market.mock.lastCall?.[0].gateway.kind).toBe('NATIVE_CNY_MARKET_DESCRIPTIVE')
  })
  it.each(['1', '0'])('market switch %s does not override the independent legacy Trending switch or invoke WP4', async (flag) => {
    vi.stubEnv('VITE_NATIVE_CNY_MARKET', flag)
    vi.stubEnv('VITE_NATIVE_CNY_TRENDING', '0')
    window.history.replaceState(null, '', '/trending?lang=en')
    const day = vi.fn(), read = vi.fn()
    const selection: NativeCnyPublicSelection = { index: { gateway: { read }, request: null }, trending: { gateway: { day }, selection: null } }
    render(<PublicBetaApp nativeCnyPublic={selection} personalWatchlistStore={store} />)
    await screen.findByTestId('standard-trending')
    expect(capture.trending.mock.lastCall?.[0].gateway.kind).not.toContain('NATIVE')
    expect(screen.queryByTestId('native-cny-trending-panel')).toBeNull()
    expect(read).not.toHaveBeenCalled(); expect(day).not.toHaveBeenCalled()
  })
  it.each(['1', '0'])('market switch %s does not override default native Trending; WP4 remains disconnected', async (flag) => {
    vi.stubEnv('VITE_NATIVE_CNY_MARKET', flag)
    vi.stubEnv('VITE_NATIVE_CNY_TRENDING', undefined)
    window.history.replaceState(null, '', '/trending?lang=en')
    const day = vi.fn()
    render(<PublicBetaApp nativeCnyPublic={{ trending: { gateway: { day }, selection: null } }} personalWatchlistStore={store} />)
    await screen.findByTestId('standard-trending')
    expect(capture.trending.mock.lastCall?.[0].gateway.kind).toBe('NATIVE_CNY_TRENDING')
    expect(day).not.toHaveBeenCalled()
    expect(screen.queryByTestId('native-cny-trending-panel')).toBeNull()
  })
  it.each(['1', '0'])('switch %s and WP4 selection cannot change Catalog price mode', async (flag) => {
    vi.stubEnv('VITE_NATIVE_CNY_MARKET', flag)
    window.history.replaceState(null, '', '/catalog')
    render(<PublicBetaApp nativeCnyPublic={{}} personalWatchlistStore={store} />)
    await screen.findByTestId('standard-catalog')
    expect(capture.catalog.mock.lastCall?.[0].price.nativeCny).toBe(false)
  })
})
