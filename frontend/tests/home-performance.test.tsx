import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../src/i18n'
import { HomeMarketPanel, HomeMovers, HomeItemCurrent, HomeValve } from '../src/pages/PublicHomeModules'
import type { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import { PublicHomePage } from '../src/pages/PublicHomePage'
import { homeIdleEnabled } from '../src/performance/homeLayout'
afterEach(cleanup)
describe('retained HOME read lifecycle', () => {
  it('does not start a hidden hero, cancels on leave and starts a fresh read on return', async () => {
    const signals: AbortSignal[] = []
    const directoryV3Groups = vi.fn((_publication, options) => {
      signals.push(options.signal); return new Promise(() => {})
    })
    const api = { directoryV3Groups } as unknown as MarketSectorIndexPublicApi
    const page = (active: boolean) => <LangProvider lang="en"><HomeMarketPanel active={active} api={api} marketHref="/market" onMarketClick={() => {}} catalogStatus={null} /></LangProvider>
    const view = render(page(false)); expect(directoryV3Groups).not.toHaveBeenCalled()
    view.rerender(page(true)); await waitFor(() => expect(directoryV3Groups).toHaveBeenCalledTimes(1))
    expect(signals[0]!.aborted).toBe(false); view.rerender(page(false)); expect(signals[0]!.aborted).toBe(true)
    view.rerender(page(true)); await waitFor(() => expect(directoryV3Groups).toHaveBeenCalledTimes(2))
    expect(signals[1]!.aborted).toBe(false); view.unmount(); expect(signals[1]!.aborted).toBe(true)
  })
  it.each(['trending', 'current', 'valve'] as const)('gates and cancels the %s module without starting more reads', async (kind) => {
    const signals: AbortSignal[] = []
    const read = vi.fn((_request, options) => { signals.push(options.signal); return new Promise<{ payload: unknown; httpStatus: number }>(() => {}) })
    const gateway = { kind: 'SYNTHETIC_TEST', read }, common = { href: '/', onClick: () => {} }
    const page = (active: boolean) => <LangProvider lang="en">{kind === 'trending' ? <HomeMovers {...common} gateway={gateway} active={active} /> : kind === 'current' ? <HomeItemCurrent {...common} gateway={gateway} active={active} /> : <HomeValve {...common} gateway={gateway} active={active} />}</LangProvider>
    const view = render(page(false)); expect(read).not.toHaveBeenCalled()
    view.rerender(page(true)); await waitFor(() => expect(read).toHaveBeenCalledTimes(1))
    view.rerender(page(false)); expect(signals[0]!.aborted).toBe(true); expect(read).toHaveBeenCalledTimes(1)
  })
})

describe('responsive lazy HOME lists', () => {
  it('uses intent-only warming on mobile and does not idle-warm a hidden/pending HOME', () => {
    expect(homeIdleEnabled(true, false, false)).toBe(true)
    expect(homeIdleEnabled(true, false, true)).toBe(false)
    expect(homeIdleEnabled(false, false, false)).toBe(false)
    expect(homeIdleEnabled(true, true, false)).toBe(false)
  })
  it('omits list reads on mobile, restores them on resize, and cancels them when hidden', async () => {
    const original = window.matchMedia
    let compact = true
    const listeners = new Set<() => void>()
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: (media: string) => ({
      media, get matches() { return compact },
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    }) })
    const signals: AbortSignal[] = []
    const read = vi.fn((_request, options) => { signals.push(options.signal); return new Promise<{ payload: unknown; httpStatus: number }>(() => {}) })
    const directoryV3Groups = vi.fn(() => Promise.resolve(null))
    const marketIndexApi = { directoryV3Groups } as unknown as MarketSectorIndexPublicApi
    const props: ComponentProps<typeof PublicHomePage> = {
      gateway: { kind: 'TEST', read: () => new Promise(() => {}) }, marketIndexApi,
      trendingGateway: { kind: 'TEST', read }, itemCurrentGateway: { kind: 'TEST', read },
      valveGateway: { kind: 'TEST', read }, queryInstant: '2026-10-04T00:00:00Z',
      catalogHref: '/catalog', marketHref: '/market', sectorHref: () => '/market?view=sectors',
      watchlistHref: '/item-monitor', trendingHref: '/trending', valveHref: '/valve', tradeupHref: '/tradeup',
      onCatalogClick: () => {}, onMarketClick: () => {}, onSectorClick: () => {}, onWatchlistClick: () => {},
      onTrendingClick: () => {}, onValveClick: () => {}, onTradeupClick: () => {},
    }
    const page = (active: boolean) => <LangProvider lang="en"><PublicHomePage {...props} active={active} /></LangProvider>
    const view = render(page(true))
    try {
      await waitFor(() => expect(directoryV3Groups).toHaveBeenCalledTimes(1))
      expect(screen.getByTestId('public-home')).toHaveAttribute('data-layout', 'compact')
      expect(screen.queryByTestId('home-sectors')).toBeNull()
      expect(read).not.toHaveBeenCalled()
      act(() => { compact = false; listeners.forEach((listener) => listener()) })
      expect(await screen.findByTestId('home-sectors')).toBeInTheDocument()
      await waitFor(() => expect(read).toHaveBeenCalledTimes(3))
      view.rerender(page(false))
      expect(signals.every((signal) => signal.aborted)).toBe(true)
      expect(read).toHaveBeenCalledTimes(3)
      view.rerender(page(true))
      await waitFor(() => expect(read).toHaveBeenCalledTimes(6))
      act(() => { compact = true; listeners.forEach((listener) => listener()) })
      expect(screen.queryByTestId('home-sectors')).toBeNull()
      expect(signals.every((signal) => signal.aborted)).toBe(true)
      view.rerender(page(false))
      act(() => { compact = false; listeners.forEach((listener) => listener()) })
      expect(await screen.findByTestId('home-sectors')).toBeInTheDocument()
      expect(read).toHaveBeenCalledTimes(6)
    } finally {
      view.unmount()
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: original })
    }
  })
})
