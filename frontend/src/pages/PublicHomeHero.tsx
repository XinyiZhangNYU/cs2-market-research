import type { MouseEvent, ReactNode } from 'react'
import { nativeGenerationOf, type MarketSectorIndexPublicApi } from '../api/MarketSectorIndexPublicApi'
import { useLang } from '../i18n'
import type { MarketSectorIndexPoint } from '../wire/marketSectorIndexPublicApiTypes'
import type { MarketSectorIndexDirectoryReleaseV3, MarketSectorIndexScopeV3 } from '../wire/marketSectorIndexPublicApiV3Types'
import { filterPointsByRange, indexFromForRange, indexLevelRuns, INDEX_RANGE_DAYS, latestDailyReturn, numericIndex, windowReturn, type ChartPoint, type PublicRatio } from './publicMarketIndexChart'
import { homeT } from './publicHomeCopy'
import { useHomeLoad, locale, formatDay, formatSignedPercent, direction, type HomeGeneration } from './publicHomeShared'
import type { HomeDirectory } from '../performance/homeDirectory'
import { formatExactDisplayDecimal } from '../price/exactDisplayDecimal'
export { useCompactHome } from '../performance/homeLayout'

export type IndexWindow = Readonly<{
  scope: MarketSectorIndexScopeV3
  points: readonly MarketSectorIndexPoint[]
  /** Full 30-day window return; null whenever any step in the window is not formally connected. */
  ratio: PublicRatio | null
  /** Latest adjacent-day return, the same figure the market page shows on compact sector cards. */
  daily: PublicRatio | null
}>

type MarketHeadline = Readonly<{ release: MarketSectorIndexDirectoryReleaseV3; market: IndexWindow }>

function seriesEnd(scope: MarketSectorIndexScopeV3, release: MarketSectorIndexDirectoryReleaseV3): string | null {
  // Same end rule as the market page: native scopes carry no bounds and end on the published day.
  if (release.native_cny) return release.history_end
  if (scope.first_available_date === null || scope.last_available_date === null) return null
  // Same end rule as the market page: reconstructed successors run to the release's measured end.
  return scope.series_source === 'REGULAR_SUCCESSOR_RECONSTRUCTION'
    ? release.measured_end
    : scope.last_available_date
}

function previousUtcDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) - 86_400_000).toISOString().slice(0, 10)
}

/** `PAIR` reads only the latest adjacent pair (sector cards need the daily return alone). */
export async function readMonthWindow(
  api: MarketSectorIndexPublicApi,
  release: MarketSectorIndexDirectoryReleaseV3,
  scope: MarketSectorIndexScopeV3,
  signal: AbortSignal,
  priority: 'FOREGROUND' | 'BACKGROUND' = 'FOREGROUND',
  span: '1M' | 'PAIR' = '1M',
): Promise<IndexWindow | null> {
  const end = seriesEnd(scope, release)
  if ((!release.native_cny && scope.first_available_date === null) || end === null) return null
  const pairFrom = scope.first_available_date !== null && scope.first_available_date > previousUtcDay(end)
    ? scope.first_available_date : previousUtcDay(end)
  const series = await api.seriesV3Pages({
    publication_id: release.publication_id,
    scope_token: scope.scope_token,
    from_date: span === 'PAIR' ? pairFrom : indexFromForRange(scope.first_available_date, end, '1M'),
    to_date: end,
    after_date: null,
    limit: span === 'PAIR' ? 2 : INDEX_RANGE_DAYS['1M'],
  }, { signal, priority })
  if (series.response_kind === 'ERROR') return null
  const points = span === 'PAIR' ? series.points : filterPointsByRange(series.points, '1M')
  return { scope, points, ratio: span === 'PAIR' ? null : windowReturn(points, '1M'), daily: latestDailyReturn(points) }
}

/** Native index modules follow the publication the shared API accepted; legacy has none. */
export function homeGeneration<T>(
  api: MarketSectorIndexPublicApi,
  releaseOf: (value: T) => MarketSectorIndexDirectoryReleaseV3,
): HomeGeneration<T> | null {
  const store = api.nativePublication
  return store === null ? null : { store, of: (value) => nativeGenerationOf(releaseOf(value)) }
}

export async function readRelease(api: MarketSectorIndexPublicApi, signal: AbortSignal, prepared?: HomeDirectory) {
  if (prepared && prepared.api !== api) throw new TypeError('HOME directory API binding mismatch')
  const directory = prepared ? await prepared.read(signal) : await api.directoryV3Groups(null, { signal })
  return directory?.release ?? null
}

async function readMarketHeadline(api: MarketSectorIndexPublicApi, signal: AbortSignal, prepared?: HomeDirectory): Promise<MarketHeadline | null> {
  const release = await readRelease(api, signal, prepared)
  if (release === null) return null
  const page = await api.directoryV3ScopePages('MARKET', release.publication_id, { signal }, 32)
  const scope = page.scopes.find((candidate) => candidate.scope_code === 'ALL') ?? page.scopes[0]
  if (scope === undefined) return null
  const market = await readMonthWindow(api, page.release, scope, signal)
  return market === null ? null : { release: page.release, market }
}

function Sparkline({ points }: { points: readonly MarketSectorIndexPoint[] }) {
  const width = 320
  const height = 92
  const runs = indexLevelRuns(points)
  const values = runs.flatMap((run) => run.flatMap((point) => point.value === null ? [] : [point.value]))
  if (values.length < 2) return <div className="public-home__spark public-home__spark--empty" aria-hidden="true" />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = points.length > 1 ? width / (points.length - 1) : width
  const y = (value: number) => 6 + (1 - (value - min) / span) * (height - 12)
  const pathFor = (run: readonly ChartPoint[]) => run
    .map((point, index) => point.value === null ? null : `${index * step},${y(point.value).toFixed(2)}`)
    .filter((entry): entry is string => entry !== null)
    .map((entry, index) => `${index === 0 ? 'M' : 'L'}${entry}`)
    .join(' ')
  const longest = runs.reduce<readonly ChartPoint[]>((best, run) => (
    run.filter((point) => point.value !== null).length > best.filter((point) => point.value !== null).length ? run : best
  ), [])
  const firstIndex = longest.findIndex((point) => point.value !== null)
  const lastIndex = longest.length - 1 - [...longest].reverse().findIndex((point) => point.value !== null)
  const area = firstIndex < 0
    ? ''
    : `${pathFor(longest)} L${lastIndex * step},${height} L${firstIndex * step},${height} Z`
  return (
    <svg className="public-home__spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="public-home-spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {area ? <path d={area} fill="url(#public-home-spark-fill)" stroke="none" /> : null}
      {runs.map((run, index) => (
        <path key={index} d={pathFor(run)} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      ))}
    </svg>
  )
}

export function HomeMarketPanel({
  active = true,
  preparedDirectory,
  api,
  marketHref,
  onMarketClick,
  catalogStatus,
}: {
  active?: boolean
  preparedDirectory?: HomeDirectory
  api: MarketSectorIndexPublicApi
  marketHref: string
  onMarketClick: (event: MouseEvent<HTMLAnchorElement>) => void
  catalogStatus: ReactNode
}) {
  const lang = useLang()
  // The prepared directory is a per-visit episode (recreated on every HOME activation, which
  // already re-runs the load); the data identity is the API, so a return can keep READY.
  const state = useHomeLoad(active, (signal) => readMarketHeadline(api, signal, preparedDirectory), [api],
    homeGeneration(api, (value: MarketHeadline) => value.release))
  const market = state.status === 'READY' ? state.value.market : null
  const last = market?.points.at(-1)
  const level = last === undefined ? null : numericIndex(last)
  return (
    <aside
      className={`public-home__market public-home__market--${state.status.toLowerCase()}`}
      aria-label={homeT('marketKicker', lang)}
      data-testid="home-market"
    >
      <div className="public-home__market-head">
        <p>{homeT('marketKicker', lang)}</p>
        <a href={marketHref} onClick={onMarketClick}>{homeT('openMarket', lang)} →</a>
      </div>
      <div className="public-home__market-figure" aria-live="polite">
        <strong data-direction={direction(market?.ratio ?? null)} data-testid="home-market-return">
          {formatSignedPercent(market?.ratio ?? null, lang)}
        </strong>
        <small>
          {state.status === 'LOADING' ? homeT('marketLoading', lang)
            : state.status === 'UNAVAILABLE' ? homeT('marketUnavailable', lang)
              : market!.ratio === null ? homeT('marketGap', lang) : homeT('marketWindow', lang)}
        </small>
      </div>
      {market === null ? <div className="public-home__spark public-home__spark--empty" aria-hidden="true" /> : <Sparkline points={market.points} />}
      <dl className="public-home__market-stats">
        <div>
          <dt>{homeT('marketLevel', lang)}</dt>
          <dd>{last?.native_cny ? formatExactDisplayDecimal(last.index.value, lang, 1)
            : level === null ? '—' : new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 1 }).format(level)}</dd>
        </div>
        <div>
          <dt>{homeT('marketDaily', lang)}</dt>
          <dd data-direction={direction(market?.daily ?? null)} data-testid="home-market-daily">
            {formatSignedPercent(market?.daily ?? null, lang)}
          </dd>
        </div>
        <div>
          <dt>{homeT('marketMembers', lang)}</dt>
          <dd>{market === null ? '—' : new Intl.NumberFormat(locale(lang)).format(market.scope.current_member_count)}</dd>
        </div>
        <div>
          <dt>{homeT('dataThrough', lang)}</dt>
          <dd>{last === undefined ? '—' : <time dateTime={last.date} title={formatDay(last.date, lang, true)}>{formatDay(last.date, lang)}</time>}</dd>
        </div>
      </dl>
      {catalogStatus}
    </aside>
  )
}
