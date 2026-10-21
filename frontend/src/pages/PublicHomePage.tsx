import { Suspense, useMemo, type MouseEvent } from 'react'
import { CatalogDisplayApi, type CatalogDisplayGateway } from '../api/CatalogDisplayApi'
import type { ItemCurrentPublicGateway } from '../api/ItemCurrentPublicApi'
import type { MarketSectorIndexPublicApi } from '../api/MarketSectorIndexPublicApi'
import type { SingleItemTrendingPublicGateway } from '../api/SingleItemTrendingPublicApi'
import type { ValveEventsGateway } from '../api/ValveEventsApi'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import type { WireCatalogDisplaySnapshotDescriptor } from '../wire/catalogDisplaySnapshotApiTypes'
import { HomeMarketPanel, useCompactHome } from './PublicHomeHero'
import { useHomeLoad } from './publicHomeShared'
import { preloadable } from '../performance/preloadable'
import type { HomeDirectory } from '../performance/homeDirectory'
import { NativeCnyUnavailablePanel } from '../components/NativeCnyUnavailablePanel'
import './publicHome.css'

const secondary = preloadable(async () => {
  const module = await import('./PublicHomeSecondary')
  return { default: module.PublicHomeSecondary }
})
const PublicHomeSecondary = secondary.Component

type CatalogPulse =
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{ status: 'READY'; descriptor: WireCatalogDisplaySnapshotDescriptor }>
  | Readonly<{ status: 'UNAVAILABLE' }>

export type PublicHomePrefetchTarget =
  | 'CATALOG'
  | 'MARKET'
  | 'WATCHLIST'
  | 'TRENDING'
  | 'VALVE'
  | 'TRADEUP'

export function PublicHomePage({
  active = true,
  nativeCny = false,
  preparedDirectory,
  gateway,
  marketIndexApi,
  trendingGateway,
  itemCurrentGateway,
  valveGateway,
  queryInstant,
  catalogHref,
  marketHref,
  sectorHref,
  watchlistHref,
  trendingHref,
  valveHref,
  tradeupHref,
  onCatalogClick,
  onMarketClick,
  onSectorClick,
  onWatchlistClick,
  onTrendingClick,
  onValveClick,
  onTradeupClick,
  onPrefetch,
  onCancelPrefetch,
}: {
  active?: boolean
  nativeCny?: boolean
  preparedDirectory?: HomeDirectory
  gateway: CatalogDisplayGateway
  marketIndexApi: MarketSectorIndexPublicApi
  trendingGateway: SingleItemTrendingPublicGateway
  itemCurrentGateway?: ItemCurrentPublicGateway
  valveGateway?: ValveEventsGateway
  queryInstant: string
  catalogHref: string
  marketHref: string
  /** A root sector opened on the market page's sector tab (latest release). */
  sectorHref: (scopeCode: string | null) => string
  watchlistHref: string
  trendingHref: string
  valveHref: string
  tradeupHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onMarketClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onSectorClick: (event: MouseEvent<HTMLAnchorElement>, scopeCode: string | null) => void
  onWatchlistClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onTrendingClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onValveClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onTradeupClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onPrefetch?: (target: PublicHomePrefetchTarget, immediate?: boolean) => void
  onCancelPrefetch?: (target: PublicHomePrefetchTarget) => void
}) {
  const lang = useLang()
  const compact = useCompactHome()
  const api = useMemo(() => new CatalogDisplayApi(gateway), [gateway])
  // Same return-path rule as the HOME modules: a settled READY pulse survives hide/show.
  const pulseLoad = useHomeLoad(active && !nativeCny, async (signal) => {
    const response = await api.listSnapshots(
      {
        query: {
          query_as_of: queryInstant,
          known_at: queryInstant,
          sort: 'AS_OF_DESC',
          page_size: 1,
        },
        cursor: null,
      },
      { signal },
    )
    if (response.response_kind !== 'CATALOG_DISPLAY_SNAPSHOT_LIST') return null
    return response.members[0] ?? null
  }, [api, queryInstant, nativeCny])
  const pulse: CatalogPulse = pulseLoad.status === 'READY' ? { status: 'READY', descriptor: pulseLoad.value } : pulseLoad

  const memberCount = pulse.status === 'READY'
    ? new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US').format(
        pulse.descriptor.member_count,
      )
    : '—'
  const intentProps = (target: PublicHomePrefetchTarget) => ({
    onMouseEnter: () => onPrefetch?.(target),
    onMouseLeave: () => onCancelPrefetch?.(target),
    onFocus: () => onPrefetch?.(target),
    onBlur: () => onCancelPrefetch?.(target),
    onTouchStart: () => onPrefetch?.(target, true),
  })

  const catalogStatus = (
    <p
      className={`public-home__catalog public-home__catalog--${pulse.status.toLowerCase()}`}
      data-testid="home-catalog-status"
      aria-live="polite"
    >
      <span>{t('publicHomeSnapshotKicker', lang)}</span>
      <strong data-testid="home-catalog-count">{memberCount}</strong>
      {pulse.status === 'READY' ? (
        <small>{t('publicHomeSnapshotCount', lang)}</small>
      ) : pulse.status === 'LOADING' ? (
        <small>{t('publicHomeSnapshotLoading', lang)}</small>
      ) : (
        <small title={t('publicHomeSnapshotUnavailableNote', lang)}>{t('publicHomeSnapshotUnavailable', lang)}</small>
      )}
    </p>
  )

  return (
    <div className="public-home" data-testid="public-home" data-layout={compact ? 'compact' : 'full'}>
      <section className="public-home__hero" aria-labelledby="public-home-title">
        {/* The home opens on data, not a slogan; the heading stays for assistive tech and search. */}
        <h1 id="public-home-title" className="public-home__sr-only">{t('publicHomeTitle', lang)}</h1>
        {nativeCny ? <NativeCnyUnavailablePanel surface="home" /> : <HomeMarketPanel
          active={active}
          preparedDirectory={preparedDirectory}
          api={marketIndexApi}
          marketHref={marketHref}
          onMarketClick={onMarketClick}
          catalogStatus={catalogStatus}
        />}
      </section>

      {compact || nativeCny ? null : (
        <Suspense fallback={<div className="public-home__secondary-loading" role="status">{t('publicLoadingSurface', lang)}</div>}>
          <PublicHomeSecondary active={active} marketIndexApi={marketIndexApi} preparedDirectory={preparedDirectory}
            trendingGateway={trendingGateway} itemCurrentGateway={itemCurrentGateway} valveGateway={valveGateway}
            sectorHref={sectorHref} trendingHref={trendingHref} watchlistHref={watchlistHref} valveHref={valveHref}
            onSectorClick={onSectorClick} onTrendingClick={onTrendingClick} onWatchlistClick={onWatchlistClick} onValveClick={onValveClick} />
        </Suspense>
      )}

      <nav
        id="public-product-entries"
        className="public-home__features"
        aria-label={t('publicHomeEntriesLabel', lang)}
      >
        <div className="public-home__feature-grid">
          <a className="public-home__feature-card" href={catalogHref} {...intentProps('CATALOG')} onClick={onCatalogClick}>
            <h3>{t('publicHomeCatalogCardTitle', lang)}</h3>
            <span className="public-home__feature-note">{t('publicHomeCatalogCardNote', lang)}</span>
          </a>
          <a
            className="public-home__feature-card"
            href={marketHref}
            {...intentProps('MARKET')}
            onClick={onMarketClick}
          >
            <h3>{t('publicHomeMarketCardTitle', lang)}</h3>
            <span className="public-home__feature-note">{t('publicHomeMarketCardNote', lang)}</span>
          </a>
          <a
            className="public-home__feature-card"
            href={watchlistHref}
            {...intentProps('WATCHLIST')}
            onClick={onWatchlistClick}
          >
            <h3>{t('publicHomeWatchlistCardTitle', lang)}</h3>
            <span className="public-home__feature-note">{t('publicHomeWatchlistCardNote', lang)}</span>
          </a>
          <a
            className="public-home__feature-card"
            href={trendingHref}
            {...intentProps('TRENDING')}
            onClick={onTrendingClick}
          >
            <h3>{t('publicHomeTrendingCardTitle', lang)}</h3>
            <span className="public-home__feature-note">{t('publicHomeTrendingCardNote', lang)}</span>
          </a>
          <a
            className="public-home__feature-card"
            href={valveHref}
            {...intentProps('VALVE')}
            onClick={onValveClick}
          >
            <h3>{t('publicHomeValveCardTitle', lang)}</h3>
            <span className="public-home__feature-note">{t('publicHomeValveCardNote', lang)}</span>
          </a>
          <a
            className="public-home__feature-card"
            href={tradeupHref}
            {...intentProps('TRADEUP')}
            onClick={onTradeupClick}
          >
            <h3>{t('publicHomeTradeupCardTitle', lang)}</h3>
            <span className="public-home__feature-note">{t('publicHomeTradeupCardNote', lang)}</span>
          </a>
        </div>
      </nav>
    </div>
  )
}
