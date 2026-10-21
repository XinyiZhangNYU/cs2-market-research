import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CatalogDisplayPresentation } from './adapter/catalogDisplayViewModel'
import type { CatalogDisplayGateway } from './api/CatalogDisplayApi'
import { HttpCatalogDisplayGateway } from './api/HttpCatalogDisplayGateway'
import type { FormalResultReadGateway } from './api/FormalResultReadApi'
import { HttpFormalResultReadGateway } from './api/HttpFormalResultReadGateway'
import type { FxReferenceGateway } from './api/FxReferenceApi'
import { HttpFxReferenceGateway } from './api/HttpFxReferenceGateway'
import { HttpPriceDisplayGateway } from './api/HttpPriceDisplayGateway'
import { HttpMarketWatchlistPublicGateway } from './api/HttpMarketWatchlistPublicGateway'
import type { MarketWatchlistPublicGateway } from './api/MarketWatchlistPublicApi'
import { HttpMarketDescriptivePublicGateway } from './api/HttpMarketDescriptivePublicGateway'
import type { MarketDescriptivePublicGateway } from './api/MarketDescriptivePublicApi'
import {
  MarketSectorIndexPublicApi,
  type MarketSectorIndexPublicGateway,
} from './api/MarketSectorIndexPublicApi'
import { HttpMarketSectorIndexPublicGateway } from './api/HttpMarketSectorIndexPublicGateway'
import type { ItemMonitorPublicGateway } from './api/ItemMonitorPublicApi'
import type { ItemCurrentPublicGateway } from './api/ItemCurrentPublicApi'
import type { ItemHistoryPublicGateway } from './api/ItemHistoryPublicApi'
import { createTrendingPublicGateway } from './api/nativeCnyTrendingConfig'
import type { ValveEventsGateway } from './api/ValveEventsApi'
import type { SingleItemTrendingPublicGateway } from './api/SingleItemTrendingPublicApi'
import type { PriceDisplayGateway } from './api/PriceDisplayApi'
import type { NativeCnyPublicSelection } from './api/NativeCnyPublicSelection'
import { NativeCnyMarketSession, NativeCnyMarketDescriptiveGateway, NativeCnyMarketSectorIndexGateway } from './api/NativeCnyMarketGateways'
import { nativeCnyMarketEnabled } from './api/nativeCnyMarketConfig'
import { catalogQueryInstant } from './api/catalogDisplayRuntime'
import { KeptAliveSurface } from './components/KeptAliveSurface'
import { BrandWordmark } from './components/BrandWordmark'
import brandWordmark from './assets/brand/cs2-rotate-wordmark.svg'
import {
  initialCatalogBrowseState,
  type CatalogBrowseState,
} from './contract/catalogBrowse'
import { LANGS, LANG_CODE, LangProvider, type Lang } from './i18n'
import { rememberPublicLanguagePreference } from './i18n/publicLanguagePreference'
import { t } from './i18n/strings'
import {
  IndexedDbPersonalWatchlistStore,
  usePersonalWatchlist,
  type PersonalWatchlistStore,
} from './watchlist/personalWatchlist'
import { marketScopeToken } from './watchlist/marketScopeToken'
import type { MarketBoardView } from './pages/publicMarketIndexChart'
import type { WatchTargetDestination } from './watchlist/watchTargetRegistry'
import type {
  TrendingDirection,
  TrendingFilters,
} from './wire/singleItemTrendingPublicApiTypes'
import {
  isPublicHistoryState,
  publicHistoryState,
  publicRouteHref,
  readPublicRoute,
  type PublicBetaSurface,
  type PublicDetailOrigin,
  type PublicRouteState,
} from './publicNavigation'
import { createIntentPrefetchScheduler } from './performance/intentPrefetch'
import { preloadable } from './performance/preloadable'
import { prepareHomeDirectory } from './performance/homeDirectory'
import { homeIdleEnabled, useCompactHome } from './performance/homeLayout'
import { createModuleNavigation } from './performance/moduleNavigation'

export type { PublicBetaSurface } from './publicNavigation'

const catalogModule = preloadable(async () => {
  const module = await import('./components/ProgressiveCatalogDisplayBrowseBoundary')
  return { default: module.ProgressiveCatalogDisplayBrowseBoundary }
})

const CurrentFxReference = lazy(async () => {
  const module = await import('./components/CurrentFxReference')
  return { default: module.CurrentFxReference }
})

const marketModule = preloadable(async () => {
  const module = await import('./pages/PublicMarketPage')
  return { default: module.PublicMarketPage }
})

const watchlistModule = preloadable(async () => {
  const module = await import('./pages/PublicWatchlistPage')
  return { default: module.PublicWatchlistPage }
})

const homeModule = preloadable(async () => {
  const module = await import('./pages/PublicHomePage')
  return { default: module.PublicHomePage }
})

const historyModule = preloadable(async () => {
  const module = await import('./pages/PublicWatchlistPage')
  return { default: module.PublicItemHistoryPage }
})

const currentModule = preloadable(async () => {
  const module = await import('./pages/PublicWatchlistPage')
  return { default: module.PublicItemCurrentPage }
})

const trendingModule = preloadable(async () => {
  const module = await import('./pages/PublicTrendingPage')
  return { default: module.PublicTrendingPage }
})

const tradeupModule = preloadable(async () => {
  const module = await import('./pages/PublicTradeUpPage')
  return { default: module.PublicTradeUpPage }
})

const followingModule = preloadable(async () => {
  const module = await import('./pages/PersonalWatchlistPage')
  return { default: module.PersonalWatchlistPage }
})

const portfolioModule = preloadable(async () => {
  const module = await import('./pages/PublicSteamPortfolioPage')
  return { default: module.PublicSteamPortfolioPage }
})

const valveModule = preloadable(async () => {
  const module = await import('./pages/PublicValveAnnouncementsPage')
  return { default: module.PublicValveAnnouncementsPage }
})


const ValveAnalysisHistory = lazy(async () => {
  const module = await import('./pages/ValveAnalysisHistory')
  return { default: module.ValveAnalysisHistory }
})

const ProgressiveCatalogDisplayBrowseBoundary = catalogModule.Component
const PublicMarketPage = marketModule.Component
const PublicWatchlistPage = watchlistModule.Component
const PublicHomePage = homeModule.Component
const PublicItemHistoryPage = historyModule.Component
const PublicItemCurrentPage = currentModule.Component
const PublicTrendingPage = trendingModule.Component
const PublicTradeUpPage = tradeupModule.Component
const PersonalWatchlistPage = followingModule.Component
const PublicSteamPortfolioPage = portfolioModule.Component
const PublicValveAnnouncementsPage = valveModule.Component

const SURFACE_MODULE_LOADERS: Readonly<Partial<Record<PublicBetaSurface, () => Promise<unknown>>>> = {
  HOME: homeModule.preload,
  CATALOG: catalogModule.preload,
  MARKET: marketModule.preload,
  WATCHLIST: () => Promise.all([watchlistModule.preload(), currentModule.preload(), historyModule.preload()]),
  TRENDING: trendingModule.preload,
  TRADEUP: tradeupModule.preload,
  FOLLOWING: followingModule.preload,
  PORTFOLIO: portfolioModule.preload,
  VALVE: valveModule.preload,
}

const HOME_IDLE_PREFETCH_SURFACES: readonly PublicBetaSurface[] = [
  'CATALOG', 'MARKET', 'WATCHLIST', 'TRENDING',
]

const PUBLIC_CATALOG_DISPLAY_PRESENTATION = Object.freeze({
  data_environment: 'LIVE_PUBLIC',
  channel: 'PUBLIC_REAL_PIT_CATALOG',
}) satisfies CatalogDisplayPresentation

function systemNow(): Date {
  return new Date()
}

function currentScrollTop(): number {
  return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
}

function restoreScrollTop(value: number): void {
  document.documentElement.scrollTop = value
  document.body.scrollTop = value
  if (!navigator.userAgent.toLowerCase().includes('jsdom')) window.scrollTo(0, value)
}

function sameRouteState(left: PublicRouteState, right: PublicRouteState): boolean {
  return publicRouteHref(left) === publicRouteHref(right) && left.invalid === right.invalid
}

type SidebarIconName = 'HOME' | 'CATALOG' | 'MARKET' | 'WATCHLIST' | 'TRENDING' | 'TRADEUP' | 'VALVE' | 'PERSONAL' | 'PORTFOLIO'

function SidebarIcon({ name }: { name: SidebarIconName }) {
  if (name === 'HOME') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5z" /><path d="M9 21v-7h6v7" /></svg>
  }
  if (name === 'CATALOG') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
  }
  if (name === 'MARKET') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m6 10V5m6 14v-7m4 7V3" /></svg>
  }
  if (name === 'WATCHLIST') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z" /><path d="M8 15l3-3 2 2 3-4" /></svg>
  }
  if (name === 'TRENDING') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 8 4-4 4 4m-4-4v16" /><path d="m20 16-4 4-4-4m4 4V4" /></svg>
  }
  if (name === 'TRADEUP') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h6v6H5zM13 13h6v6h-6z" /><path d="m14 5 5 5m0-5v5h-5M10 19l-5-5m0 5v-5h5" /></svg>
  }
  if (name === 'VALVE') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-2l13-5v12z" /><path d="M8 14.5 9.5 21h4L12 13" /><path d="M20 9v6" /></svg>
  }
  if (name === 'PORTFOLIO') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v13H4z" /><path d="M4 7l8-4 8 4" /><path d="M12 7v13" /></svg>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>
}

function SidebarToggleGlyph() {
  return <span className="formal-site__sidebar-toggle-glyph" aria-hidden="true"><i /><i /></span>
}

function surfaceTitle(route: PublicRouteState, lang: Lang): string {
  if (route.surface === 'CATALOG') return t('publicCatalogDocumentTitle', lang)
  if (route.surface === 'MARKET') return t('publicMarketDocumentTitle', lang)
  if (route.surface === 'WATCHLIST') return t('publicWatchlistDocumentTitle', lang)
  if (route.surface === 'TRENDING') return t('publicTrendingDocumentTitle', lang)
  if (route.surface === 'TRADEUP') return t('publicTradeUpDocumentTitle', lang)
  if (route.surface === 'FOLLOWING') return t('publicPersonalWatchlistDocumentTitle', lang)
  if (route.surface === 'PORTFOLIO') return t('publicPortfolioDocumentTitle', lang)
  if (route.surface === 'VALVE') return t('publicValveDocumentTitle', lang)
  return t('publicHomeDocumentTitle', lang)
}


/** Matches the stylesheet breakpoint at which the sidebar becomes an overlay drawer. */
const DRAWER_NAVIGATION_QUERY = '(max-width: 900px)'

function isDrawerNavigationViewport(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DRAWER_NAVIGATION_QUERY).matches
}

export function PublicBetaApp({
  qualityGateway,
  catalogGateway,
  fxGateway,
  priceGateway,
  publicResultGateway,
  marketDescriptiveGateway,
  marketSectorIndexGateway,
  itemMonitorGateway,
  itemCurrentGateway,
  itemHistoryGateway,
  trendingGateway,
  valveGateway,
  personalWatchlistStore,
  now = systemNow,
  initialSurface = 'HOME',
  initialLang = 'zh',
}: {
  qualityGateway?: FormalResultReadGateway
  catalogGateway?: CatalogDisplayGateway
  fxGateway?: FxReferenceGateway
  priceGateway?: PriceDisplayGateway
  publicResultGateway?: MarketWatchlistPublicGateway
  marketDescriptiveGateway?: MarketDescriptivePublicGateway
  marketSectorIndexGateway?: MarketSectorIndexPublicGateway
  itemMonitorGateway?: ItemMonitorPublicGateway
  itemCurrentGateway?: ItemCurrentPublicGateway
  itemHistoryGateway?: ItemHistoryPublicGateway
  trendingGateway?: SingleItemTrendingPublicGateway
  /** Retired WP4 prop: accepted for caller compatibility, deliberately ignored. */
  nativeCnyPublic?: NativeCnyPublicSelection
  valveGateway?: ValveEventsGateway
  personalWatchlistStore?: PersonalWatchlistStore
  now?: () => Date
  initialSurface?: PublicBetaSurface
  initialLang?: Lang
}) {
  const defaults = useMemo(
    () => ({ surface: initialSurface, lang: initialLang }),
    [initialLang, initialSurface],
  )
  const [route, setRoute] = useState<PublicRouteState>(() =>
    readPublicRoute(window.location, defaults),
  )
  const routeRef = useRef(route)
  const pendingHistoryTraversal = useRef(false)
  const [modulePending, setModulePending] = useState(false)
  const moduleNavigation = useMemo(() => createModuleNavigation(setModulePending), [])
  useEffect(() => () => moduleNavigation.dispose(), [moduleNavigation])
  const surfaceModuleLoader = useCallback((target: PublicBetaSurface) => {
    return SURFACE_MODULE_LOADERS[target]
  }, [])
  routeRef.current = route
  const retainedSurfaceRoutes = useRef(new Map<PublicBetaSurface, PublicRouteState>())
  retainedSurfaceRoutes.current.set(route.surface, route)
  const catalogRoute = retainedSurfaceRoutes.current.get('CATALOG') ?? route
  const marketRoute = retainedSurfaceRoutes.current.get('MARKET') ?? route
  const watchlistRoute = retainedSurfaceRoutes.current.get('WATCHLIST') ?? route
  const trendingRoute = retainedSurfaceRoutes.current.get('TRENDING') ?? route
  const valveRoute = retainedSurfaceRoutes.current.get('VALVE') ?? route
  const [visitedSurfaces, setVisitedSurfaces] = useState<ReadonlySet<PublicBetaSurface>>(
    () => new Set([route.surface]),
  )
  const mainRef = useRef<HTMLElement>(null)
  const pendingFocus = useRef<'MAIN' | 'ROW' | null>(null)
  const lastOpenedUnit = useRef<string | null>(route.selectedUnitId)
  const surfaceScroll = useRef<Record<PublicBetaSurface, number>>({
    HOME: 0,
    CATALOG: 0,
    MARKET: 0,
    WATCHLIST: 0,
    TRENDING: 0,
    TRADEUP: 0,
    FOLLOWING: 0,
    PORTFOLIO: 0,
    VALVE: 0,
  })
  const catalogBrowseScroll = useRef(0)
  const [initialQueryInstant] = useState(() => catalogQueryInstant(now()))
  const [catalogRead] = useState(() => ({
    queryInstant: initialQueryInstant,
    revision: 0,
  }))
  const qualitySource = useMemo(
    () => qualityGateway ?? new HttpFormalResultReadGateway(),
    [qualityGateway],
  )
  const catalogSource = useMemo(
    () => catalogGateway ?? new HttpCatalogDisplayGateway(),
    [catalogGateway],
  )
  const fxSource = useMemo(
    () => fxGateway ?? new HttpFxReferenceGateway(),
    [fxGateway],
  )
  const priceSource = useMemo(() => priceGateway ?? new HttpPriceDisplayGateway(), [priceGateway])
  const publicResultSource = useMemo(
    () => publicResultGateway ?? new HttpMarketWatchlistPublicGateway(),
    [publicResultGateway],
  )
  const nativeMarket = useMemo(() => {
    if (!nativeCnyMarketEnabled()) return null
    const session = new NativeCnyMarketSession()
    return { descriptive: new NativeCnyMarketDescriptiveGateway(session), index: new NativeCnyMarketSectorIndexGateway(session) }
  }, [])
  const marketDescriptiveSource = useMemo(
    () => marketDescriptiveGateway ?? nativeMarket?.descriptive ?? new HttpMarketDescriptivePublicGateway(),
    [marketDescriptiveGateway, nativeMarket],
  )
  const marketIndexSource = useMemo(
    () => marketSectorIndexGateway ?? nativeMarket?.index ?? new HttpMarketSectorIndexPublicGateway(),
    [marketSectorIndexGateway, nativeMarket],
  )
  const marketIndexApi = useMemo(
    () => new MarketSectorIndexPublicApi(marketIndexSource),
    [marketIndexSource],
  )
  // HOME reads the same index source as MARKET, so both show one series and one date.
  const homeIndexApi = marketIndexApi
  const trendingSource = useMemo(
    () => trendingGateway ?? createTrendingPublicGateway(catalogSource),
    [trendingGateway, catalogSource],
  )
  const personalWatchlistSource = useMemo(
    () => personalWatchlistStore ?? new IndexedDbPersonalWatchlistStore(),
    [personalWatchlistStore],
  )
  const personalWatchlist = usePersonalWatchlist(personalWatchlistSource, now)
  const [currentCnyPerUsd, setCurrentCnyPerUsd] = useState<string | null>(null)
  const receiveCurrentFxRate = useCallback((rate: string | null) => setCurrentCnyPerUsd(rate), [])
  // At drawer widths the sidebar covers the page, so it starts closed there and closes after a
  // surface change; on wider screens it is a column beside the content and starts open.
  const [sidebarOpen, setSidebarOpen] = useState(() => !isDrawerNavigationViewport())
  const intentPrefetch = useMemo(() => createIntentPrefetchScheduler(), [])
  const homeActive = route.surface === 'HOME' && !modulePending
  const compactHome = useCompactHome()
  const homeDirectory = useMemo(() => prepareHomeDirectory(homeIndexApi), [homeIndexApi, homeActive])

  // Start the existing shared directory while HOME's chunk is still loading.
  // This is a foreground read for visible HOME, not an extra background fetch.
  // Hero/sector consumers attach their own subscriptions to the same in-flight read.
  useEffect(() => {
    if (!homeActive) return
    return homeDirectory.start()
  }, [homeActive, homeDirectory])

  const prefetchSurface = useCallback((target: PublicBetaSurface, immediate = false) => {
    const loader = surfaceModuleLoader(target)
    if (loader === undefined) return
    intentPrefetch.schedule(`surface:${target}`, async (signal) => {
      const directoryRead = target === 'MARKET'
        ? marketIndexApi.directoryV3Groups(null, { signal, priority: 'BACKGROUND' })
        : Promise.resolve(null)
      const [, directory] = await Promise.all([loader(), directoryRead])
      signal.throwIfAborted()
      if (target !== 'MARKET') return
      if (directory === null) return
      await marketIndexApi.directoryV3ScopePages(
        'SECTORS', directory.release.publication_id, { signal, priority: 'BACKGROUND' }, 32,
      )
    }, immediate)
  }, [intentPrefetch, marketIndexApi, surfaceModuleLoader])

  const cancelSurfacePrefetch = useCallback((target: PublicBetaSurface) => {
    intentPrefetch.cancel(`surface:${target}`)
  }, [intentPrefetch])

  useEffect(() => {
    const cancelWhenHidden = () => {
      if (document.visibilityState === 'hidden') intentPrefetch.cancelAll()
    }
    document.addEventListener('visibilitychange', cancelWhenHidden)
    return () => {
      document.removeEventListener('visibilitychange', cancelWhenHidden)
      intentPrefetch.cancelAll()
    }
  }, [intentPrefetch])

  useEffect(() => {
    if (!homeIdleEnabled(route.surface === 'HOME', modulePending, compactHome)) return
    const browser = window as Window & typeof globalThis & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
      cancelIdleCallback?: (handle: number) => void
    }
    const run = () => {
      for (const target of HOME_IDLE_PREFETCH_SURFACES) prefetchSurface(target, true)
    }
    if (browser.requestIdleCallback !== undefined) {
      const handle = browser.requestIdleCallback(run, { timeout: 2_500 })
      return () => browser.cancelIdleCallback?.(handle)
    }
    const handle = window.setTimeout(run, 1_200)
    return () => window.clearTimeout(handle)
  }, [compactHome, modulePending, prefetchSurface, route.surface])

  const applyRoute = useCallback((next: PublicRouteState, commitHistory?: () => void, historyTraversal = false) => {
    const loader = next.surface === routeRef.current.surface ? undefined : surfaceModuleLoader(next.surface)
    // popstate has ALREADY moved the browser's cursor, unlike a click. Keep the
    // unreconciled cursor through superseding click waits until a route commits;
    // replacing only the pending loader does not undo the browser's traversal.
    if (historyTraversal) pendingHistoryTraversal.current = true
    moduleNavigation.run(loader, () => {
      pendingHistoryTraversal.current = false
      commitHistory?.()
      routeRef.current = next
      setRoute(next)
    })
    // Old surface remains mounted, but inert until the destination is ready.
    // The latest navigation wins, including browser back/forward. A failed
    // import still commits the route and reaches that page's error boundary,
    // which in a build loads the destination again once, since the browser
    // keeps the failed module for this document. A failed prefetch reloads
    // nothing; only a later navigation or prefetch intent tries that import
    // once more.
  }, [moduleNavigation, surfaceModuleLoader])

  const navigate = useCallback(
    (
      next: PublicRouteState,
      mode: 'push' | 'replace',
      state = publicHistoryState(false),
    ) => {
      const normalized = Object.freeze({ ...next, invalid: false })
      // A new user intent after a pending traversal starts from its new cursor.
      // Push instead of replacing that real destination entry; ordinary filter/
      // language replacements and uncommitted click cancellation stay unchanged.
      const method = mode === 'push' || (moduleNavigation.pending && pendingHistoryTraversal.current)
        ? 'pushState' : 'replaceState'
      applyRoute(normalized, () => window.history[method](state, '', publicRouteHref(normalized)))
    },
    [applyRoute, moduleNavigation],
  )

  useEffect(() => {
    const canonicalHref = publicRouteHref(routeRef.current)
    const currentHref = `${window.location.pathname}${window.location.search}`
    if (!isPublicHistoryState(window.history.state) || currentHref !== canonicalHref) {
      window.history.replaceState(
        isPublicHistoryState(window.history.state)
          ? window.history.state
          : publicHistoryState(false),
        '',
        canonicalHref,
      )
    }
    const onPopState = () => {
      const previous = routeRef.current
      if (previous.selectedUnitId === null) {
        surfaceScroll.current[previous.surface] = currentScrollTop()
      }
      const next = readPublicRoute(window.location, defaults)
      if (previous.selectedUnitId !== null && next.selectedUnitId === null) {
        lastOpenedUnit.current = previous.selectedUnitId
        pendingFocus.current = next.surface === 'CATALOG' ? 'ROW' : 'MAIN'
      } else if (
        previous.surface !== next.surface ||
        previous.selectedUnitId !== next.selectedUnitId
      ) {
        pendingFocus.current = 'MAIN'
      }
      applyRoute(next, undefined, true)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [applyRoute, defaults])

  useEffect(() => {
    setVisitedSurfaces((current) => {
      if (current.has(route.surface)) return current
      return new Set([...current, route.surface])
    })
  }, [route.surface])

  useEffect(() => {
    document.title = surfaceTitle(route, route.lang)
    document.documentElement.lang = route.lang === 'zh' ? 'zh-CN' : 'en'
  }, [route])

  useEffect(() => {
    if (isDrawerNavigationViewport()) setSidebarOpen(false)
  }, [route.surface])

  useEffect(() => {
    if (!sidebarOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [sidebarOpen])

  useEffect(() => {
    if (
      route.surface !== 'CATALOG' ||
      route.selectedUnitId === null ||
      route.researchAsOf ||
      moduleNavigation.pending ||
      routeRef.current !== route
    ) return
    navigate(
      { ...routeRef.current, researchAsOf: catalogRead.queryInstant, invalid: false },
      'replace',
      isPublicHistoryState(window.history.state)
        ? window.history.state
        : publicHistoryState(false),
    )
  }, [catalogRead.queryInstant, moduleNavigation, modulePending, navigate, route])

  useEffect(() => {
    if (pendingFocus.current === null) return
    const focusTarget = pendingFocus.current
    pendingFocus.current = null
    const frame = window.requestAnimationFrame(() => {
      if (focusTarget === 'ROW' && lastOpenedUnit.current !== null) {
        restoreScrollTop(catalogBrowseScroll.current)
        const expected = `catalog-row-${lastOpenedUnit.current}`
        const row = [...document.querySelectorAll<HTMLElement>('[data-testid^="catalog-row-"]')]
          .find((candidate) => candidate.dataset.testid === expected)
        if (row) {
          row.focus()
          return
        }
      }
      restoreScrollTop(
        route.selectedUnitId === null ? surfaceScroll.current[route.surface] : 0,
      )
      // The position was just set; focusing must not scroll main under the sticky header.
      mainRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [route.historyView, route.publicWatchlistUnitId, route.selectedUnitId, route.surface])

  const reselectDisplayedRoute = () => {
    const current = routeRef.current
    const traversed = moduleNavigation.pending && pendingHistoryTraversal.current
    moduleNavigation.cancel()
    pendingHistoryTraversal.current = false
    pendingFocus.current = null
    if (traversed && `${window.location.pathname}${window.location.search}` !== publicRouteHref(current)) {
      // This explicit click is a NEW navigation from the traversed entry, not
      // an undo or a replace. Preserve that entry for subsequent Back/Forward.
      navigate(current, 'push')
    }
  }

  const setSurface = (surface: PublicBetaSurface) => {
    prefetchSurface(surface, true)
    const current = routeRef.current
    if (
      current.surface === surface &&
      current.selectedUnitId === null &&
      !(surface === 'VALVE' && current.historyView) &&
      !(surface === 'WATCHLIST' && current.historyView)
    ) {
      // An uncommitted click wait needs no history write; a pending popstate has
      // already changed the address and needs explicit user-navigation recovery.
      reselectDisplayedRoute()
      return
    }
    surfaceScroll.current[current.surface] = currentScrollTop()
    pendingFocus.current = 'MAIN'
    navigate(
      {
        ...current,
        surface,
        historyView: false,
        selectedUnitId: null,
        researchAsOf: null,
        publicResultAsOf: null,
        publicPublicationId: null,
        publicWatchlistUnitId: null,
        marketScopeToken: null,
        marketView: null,
        trendingAsOf: null,
        trendingPublicationId: null,
        trendingDirection: 'GAINERS',
        trendingFilters: {
          item_kind: null,
          base_item_code: null,
          edition_kind: null,
          wear_tier: null,
        },
        invalid: false,
      },
      'push',
    )
  }

  const hrefFor = (surface: PublicBetaSurface): string =>
    publicRouteHref({
      ...route,
      surface,
      historyView: false,
      selectedUnitId: null,
      researchAsOf: null,
      publicResultAsOf: null,
      publicPublicationId: null,
      publicWatchlistUnitId: null,
      marketScopeToken: null,
      marketView: null,
      trendingAsOf: null,
      trendingPublicationId: null,
      trendingDirection: 'GAINERS',
      trendingFilters: {
        item_kind: null,
        base_item_code: null,
        edition_kind: null,
        wear_tier: null,
      },
      invalid: false,
    })

  const surfaceIntentProps = (target: PublicBetaSurface) => ({
    onMouseEnter: () => prefetchSurface(target),
    onMouseLeave: () => cancelSurfacePrefetch(target),
    onFocus: () => prefetchSurface(target),
    onBlur: () => cancelSurfacePrefetch(target),
    onTouchStart: () => prefetchSurface(target, true),
  })

  const valveHref = (history: boolean): string =>
    `${history ? '/valve/history' : '/valve'}${route.lang === 'en' ? '?lang=en' : ''}`

  const setValveHistory = (valveHistory: boolean) => {
    const current = routeRef.current
    if (current.surface === 'VALVE' && Boolean(current.historyView) === valveHistory) {
      reselectDisplayedRoute()
      return
    }
    surfaceScroll.current[current.surface] = currentScrollTop()
    pendingFocus.current = 'MAIN'
    navigate(
      readPublicRoute(new URL(valveHref(valveHistory), window.location.origin), defaults),
      'push',
    )
  }

  const setBrowseState = (browseState: CatalogBrowseState) => {
    const current = routeRef.current
    const searchOnly =
      current.browseState.seriesQuery !== browseState.seriesQuery &&
      current.browseState.itemKind === browseState.itemKind &&
      current.browseState.equipmentModel === browseState.equipmentModel &&
      current.browseState.rarity === browseState.rarity &&
      current.browseState.itemCategory === browseState.itemCategory &&
      current.browseState.wearTier === browseState.wearTier &&
      current.browseState.baseItemCode === browseState.baseItemCode &&
      current.browseState.selectedEditions.join('\u0000') === browseState.selectedEditions.join('\u0000') &&
      current.browseState.selectedWears.join('\u0000') === browseState.selectedWears.join('\u0000')
    const next = {
      ...current,
      browseState,
      invalid: false,
    }
    if (!sameRouteState(current, next)) navigate(next, searchOnly ? 'replace' : 'push')
  }

  const setCatalogQueryRoute = useCallback((change: Readonly<{
    snapshotId?: string | null
  }>, mode: 'push' | 'replace' = 'replace') => {
    const current = routeRef.current
    // This callback is data-driven URL normalization, not a new navigation
    // intent. Bind it to the exact source route; a late/hidden read must not
    // cancel a user's module wait or mutate a different language/filter/page.
    if (moduleNavigation.pending || current.surface !== 'CATALOG' || current !== catalogRoute) return
    const next = {
      ...current,
      catalogSnapshotId: change.snapshotId === undefined ? current.catalogSnapshotId ?? null : change.snapshotId,
      invalid: false,
    }
    if (!sameRouteState(current, next)) {
      navigate(
        next,
        mode,
        isPublicHistoryState(window.history.state)
          ? window.history.state
          : publicHistoryState(false),
      )
    }
  }, [catalogRoute, moduleNavigation, navigate])

  const openUnit = (analysisUnitId: string, origin: PublicDetailOrigin = 'CATALOG') => {
    const current = routeRef.current
    catalogBrowseScroll.current = currentScrollTop()
    lastOpenedUnit.current = analysisUnitId
    pendingFocus.current = 'MAIN'
    navigate(
      {
        ...current,
        surface: 'CATALOG',
        selectedUnitId: analysisUnitId,
        researchAsOf: catalogRead.queryInstant,
        invalid: false,
      },
      'push',
      publicHistoryState(true, origin),
    )
  }

  const replaceUnit = (analysisUnitId: string) => {
    const current = routeRef.current
    if (current.selectedUnitId === analysisUnitId) return
    lastOpenedUnit.current = analysisUnitId
    pendingFocus.current = 'MAIN'
    navigate(
      { ...current, surface: 'CATALOG', selectedUnitId: analysisUnitId, invalid: false },
      'replace',
      isPublicHistoryState(window.history.state)
        ? window.history.state
        : publicHistoryState(false),
    )
  }

  const closeUnit = () => {
    const current = routeRef.current
    lastOpenedUnit.current = current.selectedUnitId
    pendingFocus.current = 'ROW'
    if (isPublicHistoryState(window.history.state) && window.history.state.returnToCatalog) {
      window.history.back()
      return
    }
    navigate({
      ...current,
      selectedUnitId: null,
      researchAsOf: null,
      invalid: false,
    }, 'replace')
  }

  // A breadcrumb leaves the item for a new browse state; that view starts at its top.
  const leaveUnit = (browseState: CatalogBrowseState) => {
    const current = routeRef.current
    surfaceScroll.current.CATALOG = 0
    pendingFocus.current = 'MAIN'
    navigate({
      ...current,
      surface: 'CATALOG',
      browseState,
      selectedUnitId: null,
      researchAsOf: null,
      invalid: false,
    }, 'push')
  }

  const selectMarketPublication = (publicationId: string | null) => {
    const current = routeRef.current
    const next = {
      ...current,
      surface: 'MARKET' as const,
      publicResultAsOf: null,
      publicPublicationId: publicationId,
      publicWatchlistUnitId: null,
      historyView: false,
      marketScopeToken: null,
      invalid: false,
    }
    if (!sameRouteState(current, next)) navigate(next, 'push')
  }

  const openMarketScope = (scopeToken: string, publicationId: string) => {
    const current = routeRef.current
    const next = {
      ...current,
      surface: 'MARKET' as const,
      publicResultAsOf: null,
      publicPublicationId: publicationId,
      publicWatchlistUnitId: null,
      marketScopeToken: scopeToken,
      invalid: false,
    }
    if (!sameRouteState(current, next)) navigate(next, 'push')
  }

  const closeMarketScope = () => {
    const current = routeRef.current
    // Leaving a sector returns to the sector overview, not to the whole-market tab.
    const next = { ...current, marketScopeToken: null, marketView: 'SECTORS' as const, invalid: false }
    if (!sameRouteState(current, next)) navigate(next, 'replace')
  }

  const selectMarketView = (view: MarketBoardView) => {
    const current = routeRef.current
    const next = {
      ...current,
      marketScopeToken: view === 'MARKET' ? null : current.marketScopeToken ?? null,
      marketView: view === 'SECTORS' ? 'SECTORS' as const : null,
      invalid: false,
    }
    if (!sameRouteState(current, next)) navigate(next, 'replace')
  }

  const selectTrendingQuery = (
    direction: TrendingDirection,
    filters: TrendingFilters,
    mode: 'push' | 'replace' = 'push',
  ) => {
    const current = routeRef.current
    const next = {
      ...current,
      surface: 'TRENDING' as const,
      selectedUnitId: null,
      researchAsOf: null,
      publicResultAsOf: null,
      publicPublicationId: null,
      publicWatchlistUnitId: null,
      trendingAsOf: current.surface === 'TRENDING' ? current.trendingAsOf : null,
      trendingPublicationId: current.surface === 'TRENDING' ? current.trendingPublicationId : null,
      trendingDirection: direction,
      trendingFilters: filters,
      invalid: false,
    }
    if (!sameRouteState(current, next)) navigate(next, mode)
  }

  const openWatchlistMember = (
    publicationId: string,
    analysisUnitId: string,
  ) => {
    pendingFocus.current = 'MAIN'
    navigate({
      ...routeRef.current,
      surface: 'WATCHLIST',
      publicResultAsOf: null,
      publicPublicationId: publicationId,
      publicWatchlistUnitId: analysisUnitId,
      historyView: false,
      invalid: false,
    }, 'push')
  }

  const closeWatchlistMember = () => {
    pendingFocus.current = 'MAIN'
    navigate({
      ...routeRef.current,
      publicWatchlistUnitId: null,
      invalid: false,
    }, 'replace')
  }

  const itemMonitorHref = (history: boolean): string => publicRouteHref({
    ...routeRef.current,
    surface: 'WATCHLIST',
    selectedUnitId: null,
    researchAsOf: null,
    publicResultAsOf: null,
    publicPublicationId: null,
    publicWatchlistUnitId: null,
    historyView: history,
    marketScopeToken: null,
    invalid: false,
  })

  const setItemMonitorHistory = (history: boolean) => {
    pendingFocus.current = 'MAIN'
    navigate({
      ...routeRef.current,
      surface: 'WATCHLIST',
      publicResultAsOf: null,
      publicPublicationId: null,
      publicWatchlistUnitId: null,
      historyView: history,
      marketScopeToken: null,
      invalid: false,
    }, 'push')
  }

  const openItemHistoryMember = (publicationId: string, historyEventToken: string) => {
    pendingFocus.current = 'MAIN'
    navigate({
      ...routeRef.current,
      surface: 'WATCHLIST',
      publicResultAsOf: null,
      publicPublicationId: publicationId,
      historyView: true,
      publicWatchlistUnitId: historyEventToken,
      invalid: false,
    }, 'push')
  }

  const closeItemHistoryMember = () => {
    pendingFocus.current = 'MAIN'
    navigate({
      ...routeRef.current,
      publicWatchlistUnitId: null,
      invalid: false,
    }, 'replace')
  }

  // A saved target only opens a typed same-site product, catalog or formal market route. The
  // destination is derived at click time; no arbitrary href is ever stored in the browser.
  const watchDestinationRoute = (destination: WatchTargetDestination): PublicRouteState => {
    if (destination.surface === 'MARKET') {
      return {
        ...routeRef.current,
        surface: 'MARKET',
        selectedUnitId: null,
        catalogSnapshotId: null,
        researchAsOf: null,
        publicResultAsOf: null,
        publicPublicationId: null,
        publicWatchlistUnitId: null,
        marketScopeToken: destination.scopeToken,
        marketView: null,
        invalid: false,
      }
    }
    const base = {
      ...routeRef.current,
      surface: 'CATALOG' as const,
      // Resolve the saved opaque identity against the newest admissible catalog cut.
      // The catalog boundary replaces the route with the exact snapshot it admits.
      catalogSnapshotId: null,
      researchAsOf: null,
      publicResultAsOf: null,
      publicPublicationId: null,
      publicWatchlistUnitId: null,
      invalid: false,
    }
    if (destination.surface === 'PRODUCT') {
      return {
        ...base,
        selectedUnitId: destination.unitId,
        browseState: {
          ...initialCatalogBrowseState(),
          itemKind: destination.itemKind,
          // Returning lands on the series page, which always shows every version × wear.
          baseItemCode: destination.baseItemCode,
        },
      }
    }
    return {
      ...base,
      selectedUnitId: null,
      browseState: {
        ...initialCatalogBrowseState(),
        itemKind: destination.itemKind,
        equipmentModel: destination.equipmentModel,
      },
    }
  }

  // `null` opens the sector overview tab; a scope code opens that sector directly.
  const marketSectorRoute = (scopeCode: string | null): PublicRouteState => ({
    ...routeRef.current,
    surface: 'MARKET',
    historyView: false,
    selectedUnitId: null,
    catalogSnapshotId: null,
    researchAsOf: null,
    publicResultAsOf: null,
    publicPublicationId: null,
    publicWatchlistUnitId: null,
    marketScopeToken: scopeCode === null ? null : marketScopeToken(scopeCode),
    marketView: scopeCode === null ? 'SECTORS' : null,
    invalid: false,
  })

  const watchDestinationHref = (destination: WatchTargetDestination): string =>
    publicRouteHref(watchDestinationRoute(destination))

  const openWatchDestination = (destination: WatchTargetDestination) => {
    surfaceScroll.current.FOLLOWING = currentScrollTop()
    if (destination.surface === 'PRODUCT') lastOpenedUnit.current = destination.unitId
    pendingFocus.current = 'MAIN'
    navigate(watchDestinationRoute(destination), 'push', publicHistoryState(true, 'FOLLOWING'))
  }

  const lang = route.lang
  const surface = route.surface
  // A kept-alive page retries a caught failure when its own route changes or when it is shown
  // again; while hidden, or left behind by a pending navigation, it is not active.
  const keptAlive = (target: PublicBetaSurface) => ({
    shown: surface === target,
    active: surface === target && !modulePending,
    lang,
    resetKey: publicRouteHref(retainedSurfaceRoutes.current.get(target) ?? route),
  })
  const detailOrigin = isPublicHistoryState(window.history.state)
    ? window.history.state.detailOrigin ?? null
    : null

  return (
    <LangProvider lang={lang}>
      <div
        className={`formal-site formal-site--sidebar-${sidebarOpen ? 'open' : 'closed'}`}
        lang={lang === 'zh' ? 'zh-CN' : 'en'}
      >
        <a className="formal-site__skip" href="#formal-site-content">
          {t('publicSkipToContent', lang)}
        </a>

        <aside
          id="formal-site-sidebar"
          className="formal-site__sidebar"
          aria-label={t('publicNavLabel', lang)}
          data-testid="public-sidebar"
        >
          <div className="formal-site__sidebar-head">
            <button
              type="button"
              className="formal-site__sidebar-close"
              aria-controls="formal-site-sidebar"
              aria-expanded={sidebarOpen}
              aria-label={t('publicSidebarClose', lang)}
              onClick={() => setSidebarOpen(false)}
            >
              <SidebarToggleGlyph />
            </button>
          </div>

          <nav className="formal-site__sidebar-nav">
            <p>{t('publicSidebarPrimaryLabel', lang)}</p>
            <div>
              <a
                href={hrefFor('HOME')}
                {...surfaceIntentProps('HOME')}
                className={surface === 'HOME' ? 'is-active' : undefined}
                aria-current={surface === 'HOME' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  setSurface('HOME')
                }}
              >
                <SidebarIcon name="HOME" />
                <span>{t('publicHomeNav', lang)}</span>
              </a>
              <a
                href={hrefFor('CATALOG')}
                {...surfaceIntentProps('CATALOG')}
                className={surface === 'CATALOG' ? 'is-active' : undefined}
                aria-current={surface === 'CATALOG' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  setSurface('CATALOG')
                }}
              >
                <SidebarIcon name="CATALOG" />
                <span>{t('publicCatalogNav', lang)}</span>
              </a>
              <a
                href={hrefFor('MARKET')}
                {...surfaceIntentProps('MARKET')}
                className={surface === 'MARKET' ? 'is-active' : undefined}
                aria-current={surface === 'MARKET' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  setSurface('MARKET')
                }}
              >
                <SidebarIcon name="MARKET" />
                <span>{t('publicMarketNav', lang)}</span>
              </a>
              <a
                href={hrefFor('WATCHLIST')}
                {...surfaceIntentProps('WATCHLIST')}
                className={surface === 'WATCHLIST' ? 'is-active' : undefined}
                aria-current={surface === 'WATCHLIST' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  setSurface('WATCHLIST')
                }}
              >
                <SidebarIcon name="WATCHLIST" />
                <span>{t('publicWatchlistNav', lang)}</span>
              </a>
              <a
                href={hrefFor('TRENDING')}
                {...surfaceIntentProps('TRENDING')}
                className={surface === 'TRENDING' ? 'is-active' : undefined}
                aria-current={surface === 'TRENDING' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  setSurface('TRENDING')
                }}
              >
                <SidebarIcon name="TRENDING" />
                <span>{t('publicTrendingNav', lang)}</span>
              </a>
              <a
                href={hrefFor('VALVE')}
                {...surfaceIntentProps('VALVE')}
                className={surface === 'VALVE' ? 'is-active' : undefined}
                aria-current={surface === 'VALVE' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  setSurface('VALVE')
                }}
              >
                <SidebarIcon name="VALVE" />
                <span>{t('publicValveNav', lang)}</span>
              </a>
              <a
                href={hrefFor('TRADEUP')}
                {...surfaceIntentProps('TRADEUP')}
                className={surface === 'TRADEUP' ? 'is-active' : undefined}
                aria-current={surface === 'TRADEUP' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  setSurface('TRADEUP')
                }}
              >
                <SidebarIcon name="TRADEUP" />
                <span>{t('publicTradeUpNav', lang)}</span>
              </a>
            </div>

            <p>{t('publicSidebarPersonalLabel', lang)}</p>
            <div>
              <a
                href={hrefFor('FOLLOWING')}
                {...surfaceIntentProps('FOLLOWING')}
                className={surface === 'FOLLOWING' ? 'is-active' : undefined}
                aria-current={surface === 'FOLLOWING' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  setSurface('FOLLOWING')
                }}
              >
                <SidebarIcon name="PERSONAL" />
                <span>{t('personalWatchlistTab', lang)}</span>
              </a>
              <a
                href={hrefFor('PORTFOLIO')}
                {...surfaceIntentProps('PORTFOLIO')}
                className={surface === 'PORTFOLIO' ? 'is-active' : undefined}
                aria-current={surface === 'PORTFOLIO' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  setSurface('PORTFOLIO')
                }}
              >
                <SidebarIcon name="PORTFOLIO" />
                <span>{t('publicPortfolioNav', lang)}</span>
              </a>
            </div>
          </nav>
        </aside>

        <button
          type="button"
          className="formal-site__sidebar-backdrop"
          aria-label={t('publicSidebarClose', lang)}
          onClick={() => setSidebarOpen(false)}
        />

        <div className="formal-site__workspace">
          <header className="formal-site__masthead">
            {!sidebarOpen ? (
              <button
                type="button"
                className="formal-site__sidebar-toggle"
                aria-controls="formal-site-sidebar"
                aria-expanded={false}
                aria-label={t('publicSidebarOpen', lang)}
                onClick={() => setSidebarOpen(true)}
              >
                <SidebarToggleGlyph />
              </button>
            ) : null}
            <div className="formal-site__topbar">
              <a
                className="formal-site__brand formal-site__masthead-brand"
                href={hrefFor('HOME')}
                {...surfaceIntentProps('HOME')}
                aria-label={t('publicBrand', lang)}
                onClick={(event) => {
                  event.preventDefault()
                  setSurface('HOME')
                }}
              >
                <BrandWordmark className="formal-site__brand-logo" spinning={surface === 'HOME'} />
              </a>

              <div className="formal-site__utilities">
                <Suspense
                  fallback={
                    <aside className="formal-fx-reference" aria-label={t('publicFxLabel', lang)}>
                      <span>{t('publicFxLabel', lang)}</span>
                      <strong role="status">{t('publicFxLoading', lang)}</strong>
                      <small>{t('publicFxDisclosure', lang)}</small>
                    </aside>
                  }
                >
                  <CurrentFxReference
                    gateway={fxSource}
                    knownAt={initialQueryInstant}
                    onRateChange={receiveCurrentFxRate}
                  />
                </Suspense>
                <div className="formal-site__language" aria-label={t('publicLanguageLabel', lang)}>
                  {LANGS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={lang === option ? 'is-active' : undefined}
                      aria-pressed={lang === option}
                      onClick={() => {
                        rememberPublicLanguagePreference(option)
                        navigate({
                          ...routeRef.current,
                          lang: option,
                          invalid: false,
                        }, 'replace')
                      }}
                    >
                      {LANG_CODE[option]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

        {modulePending ? (
          <div className="formal-site__navigation-pending" role="status" aria-live="polite">
            {t('publicLoadingSurface', lang)}
          </div>
        ) : null}

        <main
          id="formal-site-content"
          className="formal-site__main"
          ref={mainRef}
          tabIndex={-1}
          aria-busy={modulePending}
          inert={modulePending}
        >
          {route.invalid ? (
            <section className="formal-route-error" role="alert" data-testid="public-route-error">
              <h1>{t('publicRouteErrorTitle', lang)}</h1>
              <p>{t('publicRouteErrorNote', lang)}</p>
              <a
                href={publicRouteHref({
                  ...route,
                  surface: 'HOME',
                  selectedUnitId: null,
                  researchAsOf: null,
                  publicResultAsOf: null,
                  publicPublicationId: null,
                  publicWatchlistUnitId: null,
                  trendingAsOf: null,
                  trendingPublicationId: null,
                  trendingDirection: 'GAINERS',
                  trendingFilters: {
                    item_kind: null,
                    base_item_code: null,
                    edition_kind: null,
                    wear_tier: null,
                  },
                  browseState: initialCatalogBrowseState(),
                  invalid: false,
                })}
                onClick={(event) => {
                  event.preventDefault()
                  navigate(
                    {
                      ...routeRef.current,
                      surface: 'HOME',
                      selectedUnitId: null,
                      researchAsOf: null,
                      publicResultAsOf: null,
                      publicPublicationId: null,
                      publicWatchlistUnitId: null,
                      trendingAsOf: null,
                      trendingPublicationId: null,
                      trendingDirection: 'GAINERS',
                      trendingFilters: {
                        item_kind: null,
                        base_item_code: null,
                        edition_kind: null,
                        wear_tier: null,
                      },
                      browseState: initialCatalogBrowseState(),
                      invalid: false,
                    },
                    'replace',
                  )
                }}
              >
                {t('publicRouteErrorAction', lang)}
              </a>
            </section>
          ) : (
            <>
              {visitedSurfaces.has('HOME') ? (
                <KeptAliveSurface key="legacy-home" {...keptAlive('HOME')}>
                  <PublicHomePage
                    active={route.surface === 'HOME' && !modulePending}
                    preparedDirectory={homeDirectory}
                    gateway={catalogSource}
                    marketIndexApi={homeIndexApi}
                    trendingGateway={trendingSource}
                    itemCurrentGateway={itemCurrentGateway}
                    valveGateway={valveGateway}
                    queryInstant={initialQueryInstant}
                    catalogHref={hrefFor('CATALOG')}
                    marketHref={hrefFor('MARKET')}
                    sectorHref={(scopeCode) => publicRouteHref(marketSectorRoute(scopeCode))}
                    watchlistHref={hrefFor('WATCHLIST')}
                    trendingHref={hrefFor('TRENDING')}
                    valveHref={hrefFor('VALVE')}
                    tradeupHref={hrefFor('TRADEUP')}
                    onPrefetch={(target, immediate) => prefetchSurface(target, immediate)}
                    onCancelPrefetch={cancelSurfacePrefetch}
                    onCatalogClick={(event) => {
                      event.preventDefault()
                      setSurface('CATALOG')
                    }}
                    onMarketClick={(event) => {
                      event.preventDefault()
                      setSurface('MARKET')
                    }}
                    onSectorClick={(event, scopeCode) => {
                      event.preventDefault()
                      prefetchSurface('MARKET', true)
                      surfaceScroll.current.HOME = currentScrollTop()
                      pendingFocus.current = 'MAIN'
                      navigate(marketSectorRoute(scopeCode), 'push')
                    }}
                    onWatchlistClick={(event) => {
                      event.preventDefault()
                      setSurface('WATCHLIST')
                    }}
                    onTrendingClick={(event) => {
                      event.preventDefault()
                      setSurface('TRENDING')
                    }}
                    onValveClick={(event) => {
                      event.preventDefault()
                      setSurface('VALVE')
                    }}
                    onTradeupClick={(event) => {
                      event.preventDefault()
                      setSurface('TRADEUP')
                    }}
                  />
                </KeptAliveSurface>
              ) : null}
              {visitedSurfaces.has('CATALOG') ? (
                <KeptAliveSurface {...keptAlive('CATALOG')}>
                  <ProgressiveCatalogDisplayBrowseBoundary
                    active={surface === 'CATALOG' && !modulePending}
                    gateway={catalogSource}
                    queryAsOf={catalogRead.queryInstant}
                    knownAt={catalogRead.queryInstant}
                    reloadToken={catalogRead.revision}
                    state={catalogRoute.browseState}
                    onChange={setBrowseState}
                    presentation={PUBLIC_CATALOG_DISPLAY_PRESENTATION}
                    onOpenUnit={openUnit}
                    onReplaceUnit={replaceUnit}
                    selectedUnitId={catalogRoute.selectedUnitId}
                    onCloseUnit={closeUnit}
                    onLeaveUnit={leaveUnit}
                    qualityGateway={qualitySource}
                    publicResultGateway={publicResultSource}
                    price={{ gateway: priceSource, cnyPerUsd: currentCnyPerUsd, nativeCny: false }}
                    snapshotId={catalogRoute.catalogSnapshotId ?? null}
                    resultAsOf={catalogRoute.researchAsOf ?? catalogRead.queryInstant}
                    onQueryRouteChange={setCatalogQueryRoute}
                    personalWatchlist={personalWatchlist}
                    detailBackTarget={detailOrigin}
                    seriesHref={(browseState) => publicRouteHref({
                      ...catalogRoute,
                      surface: 'CATALOG',
                      browseState,
                      selectedUnitId: null,
                      researchAsOf: null,
                      invalid: false,
                    })}
                    unitHref={(analysisUnitId) => publicRouteHref({
                      ...catalogRoute,
                      surface: 'CATALOG',
                      selectedUnitId: analysisUnitId,
                      researchAsOf: catalogRead.queryInstant,
                      invalid: false,
                    })}
                  />
                </KeptAliveSurface>
              ) : null}
              {visitedSurfaces.has('MARKET') ? (
                <KeptAliveSurface {...keptAlive('MARKET')}>
                  <PublicMarketPage
                    active={keptAlive('MARKET').active}
                    gateway={marketDescriptiveSource}
                    indexGateway={marketIndexSource}
                    indexApi={marketIndexApi}
                    catalogGateway={catalogSource}
                    cnyPerUsd={currentCnyPerUsd}
                    publicationId={marketRoute.publicPublicationId ?? null}
                    scopeToken={marketRoute.marketScopeToken ?? null}
                    catalogHref={hrefFor('CATALOG')}
                    onCatalogClick={(event) => {
                      event.preventDefault()
                      setSurface('CATALOG')
                    }}
                    onSelectPublication={selectMarketPublication}
                    onOpenScope={openMarketScope}
                    onCloseScope={closeMarketScope}
                    requestedView={marketRoute.marketScopeToken || marketRoute.marketView === 'SECTORS' ? 'SECTORS' : 'MARKET'}
                    onSelectView={selectMarketView}
                    personalWatchlist={personalWatchlist}
                  />
                </KeptAliveSurface>
              ) : null}
              {visitedSurfaces.has('WATCHLIST') ? (
                <KeptAliveSurface key="legacy-watchlist" {...keptAlive('WATCHLIST')}>
                  {watchlistRoute.historyView ? (
                    <PublicItemHistoryPage
                      gateway={itemHistoryGateway}
                      cnyPerUsd={currentCnyPerUsd}
                      publicationId={watchlistRoute.publicPublicationId ?? null}
                      selectedEventToken={watchlistRoute.publicWatchlistUnitId ?? null}
                      currentHref={itemMonitorHref(false)}
                      historyHref={itemMonitorHref(true)}
                      catalogHref={hrefFor('CATALOG')}
                      onCatalogClick={(event) => {
                        event.preventDefault()
                        setSurface('CATALOG')
                      }}
                      onCurrentClick={(event) => {
                        event.preventDefault()
                        setItemMonitorHistory(false)
                      }}
                      onHistoryClick={(event) => event.preventDefault()}
                      onOpenMember={openItemHistoryMember}
                      onCloseMember={closeItemHistoryMember}
                    />
                  ) : itemMonitorGateway ? (
                    <PublicWatchlistPage
                      gateway={itemMonitorGateway}
                      publicationId={watchlistRoute.publicPublicationId ?? null}
                      selectedUnitId={watchlistRoute.publicWatchlistUnitId ?? null}
                      currentHref={itemMonitorHref(false)}
                      historyHref={itemMonitorHref(true)}
                      catalogHref={hrefFor('CATALOG')}
                      onCatalogClick={(event) => {
                        event.preventDefault()
                        setSurface('CATALOG')
                      }}
                      onCurrentClick={(event) => event.preventDefault()}
                      onHistoryClick={(event) => {
                        event.preventDefault()
                        setItemMonitorHistory(true)
                      }}
                      onOpenMember={openWatchlistMember}
                      onCloseMember={closeWatchlistMember}
                    />
                  ) : (
                    <PublicItemCurrentPage
                      gateway={itemCurrentGateway}
                      publicationId={watchlistRoute.publicPublicationId ?? null}
                      selectedStageToken={watchlistRoute.publicWatchlistUnitId ?? null}
                      currentHref={itemMonitorHref(false)}
                      historyHref={itemMonitorHref(true)}
                      catalogHref={hrefFor('CATALOG')}
                      onCatalogClick={(event) => {
                        event.preventDefault()
                        setSurface('CATALOG')
                      }}
                      onCurrentClick={(event) => event.preventDefault()}
                      onHistoryClick={(event) => {
                        event.preventDefault()
                        setItemMonitorHistory(true)
                      }}
                      onOpenMember={openWatchlistMember}
                      onCloseMember={closeWatchlistMember}
                    />
                  )}
                </KeptAliveSurface>
              ) : null}
              {visitedSurfaces.has('FOLLOWING') ? (
                <KeptAliveSurface {...keptAlive('FOLLOWING')}>
                  <PersonalWatchlistPage
                    controller={personalWatchlist}
                    catalogHref={hrefFor('CATALOG')}
                    onCatalogClick={(event) => {
                      event.preventDefault()
                      setSurface('CATALOG')
                    }}
                    destinationHref={watchDestinationHref}
                    onOpenDestination={openWatchDestination}
                  />
                </KeptAliveSurface>
              ) : null}
              {visitedSurfaces.has('PORTFOLIO') ? (
                <KeptAliveSurface {...keptAlive('PORTFOLIO')}>
                  <PublicSteamPortfolioPage
                    catalogGateway={catalogSource}
                    queryInstant={initialQueryInstant}
                    catalogHref={hrefFor('CATALOG')}
                    followingHref={hrefFor('FOLLOWING')}
                    watchlist={personalWatchlist}
                    now={now}
                    onCatalogClick={(event) => {
                      event.preventDefault()
                      setSurface('CATALOG')
                    }}
                    onFollowingClick={(event) => {
                      event.preventDefault()
                      setSurface('FOLLOWING')
                    }}
                    onOpenCatalog={(analysisUnitId) => openUnit(analysisUnitId, 'PORTFOLIO')}
                  />
                </KeptAliveSurface>
              ) : null}
              {visitedSurfaces.has('TRENDING') ? (
                <KeptAliveSurface {...keptAlive('TRENDING')}>
                  <PublicTrendingPage
                    active={surface === 'TRENDING'}
                    gateway={trendingSource}
                    asOf={trendingRoute.trendingAsOf}
                    publicationId={trendingRoute.trendingPublicationId}
                    direction={trendingRoute.trendingDirection}
                    filters={trendingRoute.trendingFilters}
                    catalogHref={hrefFor('CATALOG')}
                    onCatalogClick={(event) => {
                      event.preventDefault()
                      setSurface('CATALOG')
                    }}
                    onQueryChange={selectTrendingQuery}
                  />
                </KeptAliveSurface>
              ) : null}
              {visitedSurfaces.has('VALVE') ? (
                <KeptAliveSurface {...keptAlive('VALVE')}>
                  {valveRoute.historyView ? (
                    <ValveAnalysisHistory
                      announcementsHref={valveHref(false)}
                      onAnnouncementsClick={(event) => {
                        event.preventDefault()
                        setValveHistory(false)
                      }}
                    />
                  ) : (
                    <PublicValveAnnouncementsPage
                      gateway={valveGateway}
                      historyHref={valveHref(true)}
                      onHistoryClick={(event) => {
                        event.preventDefault()
                        setValveHistory(true)
                      }}
                    />
                  )}
                </KeptAliveSurface>
              ) : null}
              {visitedSurfaces.has('TRADEUP') ? (
                <KeptAliveSurface {...keptAlive('TRADEUP')}>
                  <PublicTradeUpPage />
                </KeptAliveSurface>
              ) : null}
            </>
          )}
        </main>

        <footer className="formal-site__footer">
          <img
            className="formal-site__footer-brand"
            src={brandWordmark}
            width={195.086}
            height={44}
            alt={t('publicBrand', lang)}
          />
          <span className="formal-site__footer-copy">
            <span>{t('publicBetaFooter', lang)}</span>
            <a href={`/sources/valve.html#${lang}`}>{t('publicPrivacyLink', lang)}</a>
          </span>
        </footer>
        </div>
      </div>
    </LangProvider>
  )
}
