import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  MarketSectorIndexDirectoryV3ResponseError,
  MarketSectorIndexPublicApi,
  type MarketSectorIndexPublicGateway,
  type NativeSecondarySeries,
} from '../api/MarketSectorIndexPublicApi'
import { CatalogDisplayApi, type CatalogDisplayGateway } from '../api/CatalogDisplayApi'
import { catalogQueryInstant } from '../api/catalogDisplayRuntime'
import { SectorHeatmap, SectorTileGrid } from './PublicMarketIndexCharts'
import { equipmentImageForModel } from '../catalog/equipmentImages'
import {
  marketSubsectorIllustrationModel,
  sectorIllustrationImage,
} from '../catalog/sectorIllustrations'
import { createIntentPrefetchScheduler } from '../performance/intentPrefetch'

const MarketLevelChart = lazy(async () => {
  const module = await import('./PublicMarketIndexEcharts')
  return { default: module.MarketLevelChart }
})
const SectorOverlayChart = lazy(async () => {
  const module = await import('./PublicMarketIndexEcharts')
  return { default: module.SectorOverlayChart }
})
import { useLang, type Lang } from '../i18n'
import { t, type StringKey } from '../i18n/strings'
import { MarketSectorIndexValidationError } from '../wire/marketSectorIndexPublicApiDecode'
import { NATIVE_CNY_INDEX_METHOD_H } from '../wire/nativeCnyIndexPublicApi'
import type {
  MarketSectorIndexDirectoryReleaseV3,
  MarketSectorIndexGroupCode,
  MarketSectorIndexSeriesV3,
  MarketSectorIndexScopeV3,
} from '../wire/marketSectorIndexPublicApiV3Types'
import type {
  MarketSectorIndexErrorCode,
  MarketSectorIndexLabels,
  MarketSectorIndexPoint,
  MarketSectorIndexScope,
  MarketSectorIndexSeries,
} from '../wire/marketSectorIndexPublicApiTypes'
import { formatPublicRatio } from '../pages/publicResultShared'
import { INDEX_DISCLOSURE_COPY, marketT } from '../pages/publicMarketCopy'
import { formatLocalizedCurrencyFromCny } from '../price/localizedCurrency'
import { formatExactDisplayDecimal } from '../price/exactDisplayDecimal'
import {
  fetchRangeFor,
  filterPointsByRange,
  chartPointDisclosures,
  indexRequestLimit,
  INDEX_RANGES,
  NATIVE_INDEX_RANGES,
  indexFromForRange,
  indexLevelBridgeRuns,
  indexLevelRuns,
  latestDailyReturn,
  marketScope,
  numericAskSum,
  rebasedPercentBridgeRuns,
  rebasedPercentRuns,
  runCount,
  SECTOR_LINE_COLOR_BY_CODE,
  SECTOR_LINE_COLORS,
  sectorScopes,
  windowReturn,
  ratioNumber,
  type IndexRange,
  type MarketBoardView,
} from '../pages/publicMarketIndexChart'

type ProblemCode = MarketSectorIndexErrorCode | 'TRANSPORT' | 'VALIDATION'
type MarketState =
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{ status: 'EMPTY'; scope: MarketSectorIndexScope }>
  | Readonly<{ status: 'READY'; series: MarketSectorIndexSeries }>
  | Readonly<{ status: 'PROBLEM'; code: ProblemCode }>
type SectorState =
  | Readonly<{ status: 'IDLE' }>
  | Readonly<{ status: 'LOADING'; series: readonly MarketSectorIndexSeries[] }>
  | Readonly<{ status: 'READY'; series: readonly MarketSectorIndexSeries[] }>
  | Readonly<{ status: 'PROBLEM'; code: ProblemCode }>

const PROBLEM_COPY = Object.freeze({
  INVALID_REQUEST: ['publicResultNotFoundTitle', 'publicResultNotFoundNote'],
  NOT_PUBLISHED: ['publicResultNotPublishedTitle', 'publicResultNotPublishedNote'],
  NOT_FOUND: ['publicResultNotFoundTitle', 'publicResultNotFoundNote'],
  WITHDRAWN: ['publicResultWithdrawnTitle', 'publicResultWithdrawnNote'],
  STALE_EXPIRED: ['publicResultExpiredTitle', 'publicResultExpiredNote'],
  CORRUPT_PUBLICATION: ['publicResultCorruptTitle', 'publicResultCorruptNote'],
  TEMPORARILY_UNAVAILABLE: ['publicResultTemporaryTitle', 'publicResultTemporaryNote'],
  TRANSPORT: ['publicResultTemporaryTitle', 'publicResultTemporaryNote'],
  VALIDATION: ['publicResultCorruptTitle', 'publicResultCorruptNote'],
} satisfies Record<ProblemCode, readonly [StringKey, StringKey]>)

function problemCode(error: unknown): ProblemCode {
  if (
    error instanceof MarketSectorIndexDirectoryV3ResponseError &&
    Object.hasOwn(PROBLEM_COPY, error.code)
  ) return error.code as MarketSectorIndexErrorCode
  return error instanceof MarketSectorIndexValidationError ? 'VALIDATION' : 'TRANSPORT'
}

function formatDay(value: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`))
}

function formatDecimal(value: string | null, lang: Lang, digits = 2, nativeCny = false): string {
  if (nativeCny) return formatExactDisplayDecimal(value, lang, digits)
  if (value === null || !Number.isFinite(Number(value))) return '—'
  return new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    maximumFractionDigits: digits,
  }).format(Number(value))
}

function rangeLabel(range: IndexRange, lang: Lang): string {
  return marketT((
    { '7D': 'indexRange7d', '1M': 'indexRange1m', '3M': 'indexRange3m', '1Y': 'indexRange1y', ALL: 'indexRangeAll' } as const
  )[range], lang)
}

async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
  stop: () => boolean = () => false,
): Promise<readonly R[]> {
  const results: R[] = []
  let next = 0
  const workers = Array.from({ length: Math.min(Math.max(concurrency, 1), items.length) }, async () => {
    while (next < items.length && !stop()) {
      const current = next
      next += 1
      results[current] = await mapper(items[current] as T)
    }
  })
  await Promise.all(workers)
  return results
}

type DirectorySnapshot = Readonly<{
  scopes: readonly MarketSectorIndexScope[]
  publicationId: string | null
  historyStart: string
  historyEnd: string
}>

async function loadScopeSeries(
  api: MarketSectorIndexPublicApi,
  directory: DirectorySnapshot,
  scope: MarketSectorIndexScope,
  preferMeasuredSeries: boolean,
  range: IndexRange,
  signal: AbortSignal,
) {
  if ((scope.first_available_date === null || scope.last_available_date === null) && !preferMeasuredSeries) {
    return { kind: 'EMPTY' as const, scope }
  }
  const last = scope.last_available_date ?? directory.historyEnd
  const series = await api.seriesPages({
    publication_id: directory.publicationId,
    scope_token: scope.scope_token,
    from_date: indexFromForRange(
      scope.first_available_date ?? directory.historyStart,
      last,
      range,
    ),
    to_date: preferMeasuredSeries ? null : scope.last_available_date,
    after_date: null,
    limit: indexRequestLimit(range),
  }, { signal })
  return { kind: 'SERIES' as const, series }
}

const PUBLIC_SCOPE_NAMES = Object.freeze({
  ALL: { zh: '大盘', en: 'Market' },
  AGENT: { zh: '探员', en: 'Agents' },
  ARMORY: { zh: '武库', en: 'Armory' },
  CASE: { zh: '武器箱', en: 'Cases' },
  COLLECTION: { zh: '收藏品', en: 'Collections' },
  GLOVE: { zh: '手套', en: 'Gloves' },
  KNIFE: { zh: '刀具', en: 'Knives' },
  WEAPON: { zh: '武器', en: 'Weapons' },
} satisfies Record<string, Readonly<{ zh: string; en: string }>>)

function scopeName(scope: Pick<MarketSectorIndexScope, 'scope_code' | 'labels'> & { series_source?: string }, lang: Lang): string {
  if ('series_source' in scope && scope.series_source === 'NATIVE_CNY') return lang === 'zh' ? scope.labels.zh_cn : scope.labels.en
  const standard = PUBLIC_SCOPE_NAMES[scope.scope_code as keyof typeof PUBLIC_SCOPE_NAMES]
  if (standard !== undefined) return standard[lang]
  return lang === 'zh' ? scope.labels.zh_cn : scope.labels.en
}

function ProblemPanel({
  code, onRetry,
}: {
  code: ProblemCode
  onRetry: () => void
}) {
  const lang = useLang()
  return (
    <div className="public-market-index__problem" role="status" data-error-code={code}>
      <strong>{t(PROBLEM_COPY[code][0], lang)}</strong>
      <p>{t(PROBLEM_COPY[code][1], lang)}</p>
      <button type="button" onClick={onRetry}>{t('publicResultRetry', lang)}</button>
    </div>
  )
}

/** Native problem state keeps its no-points copy and adds a recovery entry. */
function NativeProblem({ onRetry }: { onRetry: () => void }) {
  const lang = useLang()
  return (
    <div className="public-market-index__problem" role="status">
      <p className="public-market-index__empty">{marketT('indexNoPoints', lang)}</p>
      <button type="button" onClick={onRetry}>{t('publicResultRetry', lang)}</button>
    </div>
  )
}

function RangePicker({
  value, onChange, native = false,
}: {
  value: IndexRange
  onChange: (range: IndexRange) => void
  native?: boolean
}) {
  const lang = useLang()
  return (
    <div className="public-market-board__ranges" role="group" aria-label={marketT('indexWindow', lang)}>
      {(native ? NATIVE_INDEX_RANGES : INDEX_RANGES).map((range) => (
        <button
          key={range}
          type="button"
          aria-pressed={value === range}
          onClick={() => onChange(range)}
        >
          {rangeLabel(range, lang)}
        </button>
      ))}
    </div>
  )
}

type MarketSectorIndexHistoryProps = Readonly<{
  gateway: MarketSectorIndexPublicGateway
  api?: MarketSectorIndexPublicApi
  scopeCode: string
  catalogGateway?: CatalogDisplayGateway | null
  view?: MarketBoardView
  onSelectSector?: (scopeCode: string) => void
  onClearSector?: () => void
  selectedSectorCode?: string | null
  cnyPerUsd?: string | null
  /** Native page epoch: the publication the page shows. Every index read is pinned to it. */
  nativePublicationId?: string | null
  /** The pinned publication is no longer current; true when the page moves to the current one. */
  onNativePublicationChanged?: () => boolean
}>

function LegacyMarketSectorIndexHistory({
  gateway, api: providedApi, scopeCode, catalogGateway = null, view = 'MARKET', onSelectSector, onClearSector,
  selectedSectorCode = null, cnyPerUsd = null,
}: MarketSectorIndexHistoryProps) {
  const lang = useLang()
  const fallbackApi = useMemo(() => new MarketSectorIndexPublicApi(gateway), [gateway])
  const api = providedApi ?? fallbackApi
  const preferMeasuredSeries = (gateway.preferredSeriesVersion ?? '1') !== '1'
  const [reload, setReload] = useState(0)
  const [range, setRange] = useState<IndexRange>('3M')
  const [directory, setDirectory] = useState<DirectorySnapshot | null>(null)
  const [marketState, setMarketState] = useState<MarketState>({ status: 'LOADING' })
  const [sectorState, setSectorState] = useState<SectorState>({ status: 'IDLE' })
  const [anomaliesOpen, setAnomaliesOpen] = useState(false)
  const [focusedSectorCode, setFocusedSectorCode] = useState<string | null>(selectedSectorCode)
  const [anomalyNames, setAnomalyNames] = useState<ReadonlyMap<string, MarketSectorIndexLabels>>(new Map())
  const resolvedAnomalyNames = useRef<ReadonlyMap<string, MarketSectorIndexLabels>>(new Map())
  const catalogSnapshotId = useRef<string | null>(null)
  const fetchRange = fetchRangeFor(range)
  const retry = () => {
    setSectorState({ status: 'IDLE' })
    setReload((value) => value + 1)
  }

  useEffect(() => {
    setFocusedSectorCode(selectedSectorCode)
  }, [selectedSectorCode])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setMarketState({ status: 'LOADING' })
      const document = await api.directory({ publication_id: null }, { signal: controller.signal })
      if (document.response_kind === 'ERROR') {
        if (controller.signal.aborted) return
        setDirectory(null)
        setMarketState({ status: 'PROBLEM', code: document.error.code })
        return
      }
      if (document.response_kind !== 'SCOPE_DIRECTORY') throw new MarketSectorIndexValidationError()
      const snapshot = {
        scopes: document.scopes,
        publicationId: preferMeasuredSeries ? null : document.release.publication_id,
        historyStart: document.release.history_start,
        historyEnd: document.release.history_end,
      } satisfies DirectorySnapshot
      if (controller.signal.aborted) return
      setDirectory(snapshot)
    }
    void load().catch((error: unknown) => {
      if (controller.signal.aborted) return
      setMarketState({ status: 'PROBLEM', code: problemCode(error) })
    })
    return () => controller.abort()
  }, [api, preferMeasuredSeries, reload])

  useEffect(() => {
    if (directory === null) return
    const controller = new AbortController()
    const load = async () => {
      setMarketState({ status: 'LOADING' })
      const scope = marketScope(directory.scopes, scopeCode)
      if (scope === undefined) {
        setMarketState({ status: 'PROBLEM', code: 'NOT_FOUND' })
        return
      }
      const loaded = await loadScopeSeries(
        api, directory, scope, preferMeasuredSeries, fetchRange, controller.signal,
      )
      if (controller.signal.aborted) return
      if (loaded.kind === 'EMPTY') setMarketState({ status: 'EMPTY', scope: loaded.scope })
      else if (loaded.series.response_kind === 'ERROR') setMarketState({ status: 'PROBLEM', code: loaded.series.error.code })
      else if (loaded.series.response_kind === 'INDEX_SERIES') setMarketState({ status: 'READY', series: loaded.series })
      else throw new MarketSectorIndexValidationError()
    }
    void load().catch((error: unknown) => {
      if (controller.signal.aborted) return
      setMarketState({ status: 'PROBLEM', code: problemCode(error) })
    })
    return () => controller.abort()
  }, [api, directory, fetchRange, preferMeasuredSeries, scopeCode])

  useEffect(() => {
    if (directory === null) return
    const controller = new AbortController()
    const load = async () => {
      setSectorState({ status: 'LOADING', series: [] })
      const wanted = sectorScopes(directory.scopes)
      if (wanted.length === 0) {
        if (!controller.signal.aborted) setSectorState({ status: 'READY', series: [] })
        return
      }
      const loaded = await mapPool(wanted, 4, async (scope) => {
        try {
          return await loadScopeSeries(
            api, directory, scope, preferMeasuredSeries, fetchRange, controller.signal,
          )
        } catch (error: unknown) {
          return { kind: 'FAILED' as const, code: problemCode(error) }
        }
      })
      if (controller.signal.aborted) return
      const ready: MarketSectorIndexSeries[] = []
      let lastError: ProblemCode | null = null
      for (const item of loaded) {
        if (item.kind === 'EMPTY') continue
        if (item.kind === 'FAILED') {
          lastError = item.code
          continue
        }
        if (item.series.response_kind === 'ERROR') {
          lastError = item.series.error.code
          continue
        }
        if (item.series.response_kind !== 'INDEX_SERIES') throw new MarketSectorIndexValidationError()
        ready.push(item.series)
      }
      if (ready.length === 0 && lastError !== null) {
        setSectorState({ status: 'PROBLEM', code: lastError })
        return
      }
      setSectorState({ status: 'READY', series: ready })
    }
    void load().catch((error: unknown) => {
      if (controller.signal.aborted) return
      setSectorState({ status: 'PROBLEM', code: problemCode(error) })
    })
    return () => controller.abort()
  }, [api, directory, fetchRange, preferMeasuredSeries])

  const marketWindow = useMemo(
    () => marketState.status === 'READY' ? filterPointsByRange(marketState.series.points, range) : [],
    [marketState, range],
  )
  const marketRuns = useMemo(() => indexLevelRuns(marketWindow), [marketWindow])
  const marketBridges = useMemo(() => indexLevelBridgeRuns(marketWindow), [marketWindow])
  const marketDisclosures = useMemo(() => chartPointDisclosures(marketWindow), [marketWindow])
  const marketChange = windowReturn(marketWindow, range)
  const latest = marketWindow.at(-1) ?? null
  const anomalyContributions = latest?.quality.anomaly_contributions ?? []
  const anomalyKey = anomalyContributions.map((entry) => entry.analysis_unit_id).join('\u0000')
  useEffect(() => {
    if (catalogGateway === null || !anomaliesOpen || anomalyContributions.length === 0) return
    const controller = new AbortController()
    const api = new CatalogDisplayApi(catalogGateway)
    const instant = catalogQueryInstant(new Date())
    const resolve = async () => {
      let snapshotId = catalogSnapshotId.current
      if (snapshotId === null) {
        const inventory = await api.listSnapshots({
          query: { known_at: instant, page_size: 4, query_as_of: instant, sort: 'AS_OF_DESC' },
          cursor: null,
        }, { signal: controller.signal })
        if (inventory.response_kind !== 'CATALOG_DISPLAY_SNAPSHOT_LIST') return
        if (inventory.response_kind !== 'CATALOG_DISPLAY_SNAPSHOT_LIST') return
        const descriptor = inventory.members[0]
        if (descriptor === undefined) return
        snapshotId = descriptor.snapshot_id
        catalogSnapshotId.current = snapshotId
      }
      const missing = anomalyContributions
        .map((entry) => entry.analysis_unit_id)
        .filter((id) => !resolvedAnomalyNames.current.has(id))
      const resolved = await mapPool(missing, 4, async (id) => {
        try {
          const response = await api.detail({
            query: { analysis_unit_id: id, page_size: 1, snapshot_id: snapshotId! },
            cursor: null,
          }, { signal: controller.signal })
          if (response.response_kind !== 'CATALOG_QUERY_DETAIL') return null
          const localized = response.member.projection.localized_name
          return [id, { en: localized.en, zh_cn: localized.zh_cn }] as const
        } catch {
          return null
        }
      })
      if (controller.signal.aborted) return
      const updates = resolved.filter((item): item is readonly [string, MarketSectorIndexLabels] => item !== null)
      if (updates.length === 0) return
      const merged = new Map(resolvedAnomalyNames.current)
      for (const [id, labels] of updates) merged.set(id, labels)
      resolvedAnomalyNames.current = merged
      setAnomalyNames(merged)
    }
    void resolve().catch(() => undefined)
    return () => controller.abort()
    // anomalyContributions is derived from the same series points as anomalyKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogGateway, anomaliesOpen, anomalyKey])
  const scopes = directory?.scopes ?? []
  const sectorScopeOrder = useMemo(
    () => new Map(sectorScopes(scopes).map((scope, index) => [scope.scope_code, index])),
    [scopes],
  )
  const sectorWindows = useMemo(
    () => sectorState.status === 'READY' || sectorState.status === 'LOADING'
      ? sectorState.series.map((series) => {
        const points = filterPointsByRange(series.points, range)
        const lastPoint = points.at(-1) ?? series.points.at(-1)
        const colorIndex = sectorScopeOrder.get(series.scope.scope_code) ?? 0
        const semanticColor = SECTOR_LINE_COLOR_BY_CODE[
          series.scope.scope_code as keyof typeof SECTOR_LINE_COLOR_BY_CODE
        ]
        return {
          series,
          points,
          name: scopeName(series.scope, lang),
          color: semanticColor ?? SECTOR_LINE_COLORS[colorIndex % SECTOR_LINE_COLORS.length] as string,
          overlay: rebasedPercentRuns(points),
          overlayBridges: rebasedPercentBridgeRuns(points),
          ratio: windowReturn(points, range),
          size: (lastPoint === undefined ? null : numericAskSum(lastPoint)) ?? series.scope.current_member_count,
        }
      }).sort((left, right) => (
        (sectorScopeOrder.get(left.series.scope.scope_code) ?? Number.MAX_SAFE_INTEGER)
        - (sectorScopeOrder.get(right.series.scope.scope_code) ?? Number.MAX_SAFE_INTEGER)
      ))
      : [],
    [lang, range, sectorScopeOrder, sectorState],
  )
  const visibleSectorWindows = focusedSectorCode === null
    ? sectorWindows
    : sectorWindows.filter((entry) => entry.series.scope.scope_code === focusedSectorCode)
  const focusedSectorName = sectorWindows.find(
    (entry) => entry.series.scope.scope_code === focusedSectorCode,
  )?.name ?? null
  const sectorHeatmapCells = useMemo(() => {
    const windowsByCode = new Map(
      sectorWindows.map((entry) => [entry.series.scope.scope_code, entry]),
    )
    return sectorScopes(scopes).map((scope) => {
      const loaded = windowsByCode.get(scope.scope_code)
      return {
        name: loaded?.name ?? scopeName(scope, lang),
        scopeCode: scope.scope_code,
        size: loaded?.size ?? scope.current_member_count,
        ratio: loaded?.ratio ?? null,
      }
    })
  }, [lang, scopes, sectorWindows])

  return (
    <section
      className="public-market-index public-market-board"
      aria-labelledby="public-market-index-title"
      data-testid="market-sector-index-history"
      data-series-id="ROBUST_EQUAL_V3"
    >
      <div className="public-market-board__toolbar">
        <div className="public-result-section-heading">
          <p>CONTINUOUS INDEX</p>
          <h2 id="public-market-index-title">{marketT('indexTitle', lang)}</h2>
        </div>
        <div className="public-market-board__controls">
          <RangePicker value={range} onChange={setRange} />
        </div>
      </div>
      <p className="public-market-board__method">{marketT('indexMethodName', lang)}</p>
      <p className="public-market-index__disclosure">{marketT(INDEX_DISCLOSURE_COPY.V1, lang)}</p>
      {scopes.length > 0 ? (
        <p className="public-market-board__scope-note">
          {marketT('indexScope', lang)}
          {': '}
          {scopes.filter((scope) => view === 'MARKET' ? scope.scope_kind === 'MARKET' : scope.scope_kind === 'SECTOR')
            .map((scope) => scopeName(scope, lang))
            .join(' · ') || marketT('indexNoSectors', lang)}
        </p>
      ) : null}

      {view === 'MARKET' ? (
        <div role="tabpanel" data-board-view="MARKET">
          {marketState.status === 'LOADING' ? <p role="status">{marketT('indexLoading', lang)}</p> : null}
          {marketState.status === 'EMPTY' ? (
            <p role="status" data-history-eligibility={marketState.scope.price_history_eligibility}>{marketT('indexNoHistory', lang)}</p>
          ) : null}
          {marketState.status === 'PROBLEM' ? (
            <ProblemPanel code={marketState.code} onRetry={retry} />
          ) : null}
          {marketState.status === 'READY' ? (
            <>
              <div className="public-market-index__headline">
                <div>
                  <span>{marketT('indexLatestValue', lang)}</span>
                  <strong>{formatDecimal(latest?.index.value ?? null, lang, 3, Boolean(latest?.native_cny))}</strong>
                  <small data-change={marketChange === null ? 'flat' : ratioNumber(marketChange) < 0 ? 'down' : 'up'}>
                    {latest === null ? '—' : formatDay(latest.date, lang)}
                    {' · '}
                    {marketChange === null ? '—' : formatPublicRatio(marketChange, lang)}
                    {' '}
                    {rangeLabel(range, lang)}
                  </small>
                </div>
                <dl>
                  <div><dt>{marketT('indexDailyChange', lang)}</dt><dd>{formatPublicRatio(latest?.index.period_return ?? null, lang)}</dd></div>
                  <div><dt>{marketT('indexCoverage', lang)}</dt><dd>{formatPublicRatio(latest?.coverage.coverage_ratio_lower_bound ?? null, lang)}</dd></div>
                  <div><dt>{marketT('indexQuality', lang)}</dt><dd>{latest?.quality.overall ?? '—'}</dd></div>
                </dl>
              </div>
              {marketRuns.length === 0 ? (
                <p className="public-market-index__empty">{marketT('indexNoPoints', lang)}</p>
              ) : (
                <div
                  className="public-market-board__canvas"
                  data-segment-count={runCount(marketRuns)}
                  data-bridge-count={marketBridges.length}
                >
                  <Suspense fallback={<p role="status">{marketT('indexLoading', lang)}</p>}>
                    <MarketLevelChart
                      runs={marketRuns}
                      bridges={marketBridges}
                      disclosures={marketDisclosures}
                      lang={lang}
                      label={lang === 'zh'
                        ? `${scopeName(marketState.series.scope, lang)}连续指数，${marketWindow[0]?.date ?? ''}至${latest?.date ?? ''}`
                        : `${scopeName(marketState.series.scope, lang)} continuous index, ${marketWindow[0]?.date ?? ''} to ${latest?.date ?? ''}`}
                    />
                  </Suspense>
                </div>
              )}
              <div className="public-market-index__range">
                <span>{marketWindow[0] ? formatDay(marketWindow[0].date, lang) : '—'}</span>
                <span>{latest ? formatDay(latest.date, lang) : '—'}</span>
              </div>
              {latest !== null ? (
                <dl className="public-market-index__details">
                  <div><dt>{marketT('rawReturn', lang)}</dt><dd>{formatPublicRatio(latest.index.raw_equal_return, lang)}</dd></div>
                  <div><dt>{marketT('suppressedReturn', lang)}</dt><dd>{formatPublicRatio(latest.index.robust_equal_return, lang)}</dd></div>
                  <div><dt>{marketT('indexAskSum', lang)}</dt><dd>{formatLocalizedCurrencyFromCny(latest.absolute_price.member_minimum_ask_sum_cny, lang, cnyPerUsd, 0)}</dd></div>
                  <div><dt>{marketT('indexMedianAsk', lang)}</dt><dd>{formatLocalizedCurrencyFromCny(latest.absolute_price.member_minimum_ask_median_cny, lang, cnyPerUsd, 0)}</dd></div>
                  <div><dt>{marketT('indexMembers', lang)}</dt><dd>{latest.coverage.paired_member_count} / {latest.coverage.expected_member_count_upper_bound ?? '—'}</dd></div>
                  <div><dt>{marketT('indexAvailability', lang)}</dt><dd>{marketT(latest.availability === 'RECONSTRUCTED_LATE_BOUND' ? 'indexReconstructed' : 'indexForward', lang)}</dd></div>
                  <div><dt>{marketT('indexGradeCounts', lang)}</dt><dd>A {latest.quality.grade_counts.A} · B {latest.quality.grade_counts.B} · C {latest.quality.grade_counts.C} · D {latest.quality.grade_counts.D} · E {latest.quality.grade_counts.E}</dd></div>
                  <div><dt>{marketT('indexAnomalyCount', lang)}</dt><dd>{latest.quality.anomaly_member_count ?? '—'}</dd></div>
                </dl>
              ) : null}
              {anomalyContributions.length > 0 ? (
                <details className="public-market-index__anomalies" open={anomaliesOpen}>
                  <summary
                    onClick={(event) => {
                      event.preventDefault()
                      setAnomaliesOpen((open) => !open)
                    }}
                  >
                    {marketT('indexAnomalyDetails', lang)}
                  </summary>
                  <ul>
                    {anomalyContributions.map((entry) => {
                      const labels = anomalyNames.get(entry.analysis_unit_id)
                      const name = labels === undefined ? null : lang === 'zh' ? labels.zh_cn : labels.en
                      return (
                        <li key={entry.analysis_unit_id}>
                          {name !== null && name !== '' ? (
                            <span className="public-market-index__anomaly-name">{name}</span>
                          ) : (
                            <span className="public-market-index__anomaly-name">
                              {marketT('indexAnomalyNameUnavailable', lang)}
                            </span>
                          )}
                          <span>{formatPublicRatio(entry.raw_return, lang)} → {formatPublicRatio(entry.suppressed_return, lang)}</span>
                        </li>
                      )
                    })}
                  </ul>
                </details>
              ) : null}
            </>
          ) : null}
        </div>
      ) : (
        <div role="tabpanel" data-board-view="SECTORS">
          <p className="public-market-board__method">{marketT('indexSectorMethod', lang)}</p>
          {sectorState.status === 'LOADING' && sectorWindows.length === 0 ? (
            <p role="status">{marketT('indexLoading', lang)}</p>
          ) : null}
          {sectorState.status === 'LOADING' && sectorWindows.length > 0 ? (
            <p role="status">{marketT('indexLoadingMore', lang)}</p>
          ) : null}
          {sectorState.status === 'PROBLEM' ? (
            <ProblemPanel code={sectorState.code} onRetry={retry} />
          ) : null}
          {sectorState.status === 'READY' && sectorHeatmapCells.length === 0 ? (
            <p role="status">{marketT('indexNoSectors', lang)}</p>
          ) : null}
          {sectorState.status === 'READY' && sectorHeatmapCells.length > 0 ? (
            <div className="public-market-board__sectors">
              {sectorWindows.length > 0 ? (
                <div
                  className="public-market-board__canvas"
                  data-segment-count={visibleSectorWindows.reduce((sum, entry) => sum + runCount(entry.overlay), 0)}
                  data-bridge-count={visibleSectorWindows.reduce((sum, entry) => sum + entry.overlayBridges.length, 0)}
                >
                  {visibleSectorWindows.length > 0 ? (
                    <Suspense fallback={<p role="status">{marketT('indexLoading', lang)}</p>}>
                      <SectorOverlayChart
                        lang={lang}
                        label={focusedSectorName === null
                          ? marketT('indexSectorLines', lang)
                          : `${marketT('indexSectorLines', lang)}：${focusedSectorName}`}
                        series={visibleSectorWindows.map((entry) => ({
                          name: entry.name,
                          runs: entry.overlay,
                          bridges: entry.overlayBridges,
                          color: entry.color,
                        }))}
                      />
                    </Suspense>
                  ) : (
                    <p className="public-market-index__empty">{marketT('indexNoHistory', lang)}</p>
                  )}
                  <div
                    className="public-market-board__legend"
                    role="group"
                    aria-label={marketT('indexSectorLegend', lang)}
                  >
                    <button
                      type="button"
                      aria-pressed={focusedSectorCode === null}
                      onClick={() => {
                        setFocusedSectorCode(null)
                        onClearSector?.()
                      }}
                    >
                      <span className="public-market-board__legend-dot public-market-board__legend-dot--all" aria-hidden="true" />
                      <span>{marketT('indexAllSectors', lang)}</span>
                    </button>
                    {sectorWindows.map((entry) => {
                      const code = entry.series.scope.scope_code
                      return (
                        <button
                          key={code}
                          type="button"
                          data-testid={`sector-line-legend-${code}`}
                          aria-pressed={focusedSectorCode === code}
                          aria-label={lang === 'zh'
                            ? `只看${entry.name}并打开板块详情`
                            : `Show only ${entry.name} and open sector details`}
                          onClick={() => {
                            setFocusedSectorCode(code)
                            onSelectSector?.(code)
                          }}
                        >
                          <span
                            className="public-market-board__legend-dot"
                            style={{ backgroundColor: entry.color }}
                            aria-hidden="true"
                          />
                          <span>{entry.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
              <div className="public-market-board__canvas">
                <SectorHeatmap
                  lang={lang}
                  label={marketT('indexSectorHeatmap', lang)}
                  cells={sectorHeatmapCells}
                  onSelectScope={onSelectSector}
                  selectedScopeCode={selectedSectorCode}
                />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}

type V3HistoryState =
  | Readonly<{ status: 'IDLE' }>
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{ status: 'EMPTY'; scope: MarketSectorIndexScopeV3 }>
  | Readonly<{
      status: 'READY'
      series: MarketSectorIndexSeriesV3
      linkedCollections: readonly MarketSectorIndexScopeV3[]
    }>
  | Readonly<{ status: 'PROBLEM'; code: ProblemCode }>

type V3OverviewState =
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{
      status: 'READY'
      scopes: readonly MarketSectorIndexScopeV3[]
      series: readonly MarketSectorIndexSeriesV3[]
      failedCount: number
    }>
  | Readonly<{ status: 'PROBLEM'; code: ProblemCode }>

const CHILD_GROUP_BY_ROOT: Readonly<Partial<Record<string, MarketSectorIndexGroupCode>>> = Object.freeze({
  ARMORY: 'ARMORY_RELEASES',
  CASE: 'CASES',
  COLLECTION: 'COLLECTIONS',
  GLOVE: 'GLOVE_MODELS',
  KNIFE: 'KNIFE_MODELS',
  WEAPON: 'WEAPON_MODELS',
})

function v3SeriesEnd(
  scope: MarketSectorIndexScopeV3,
  release: MarketSectorIndexDirectoryReleaseV3,
): string | null {
  if (release.native_cny) return release.history_end
  if (scope.first_available_date === null || scope.last_available_date === null) return null
  return scope.series_source === 'REGULAR_SUCCESSOR_RECONSTRUCTION'
    ? release.measured_end
    : scope.last_available_date
}

function previousUtcDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) - 86_400_000).toISOString().slice(0, 10)
}

function latestPairFrom(first: string, last: string): string {
  return first > previousUtcDay(last) ? first : previousUtcDay(last)
}

const prefetchedMarketImages = new Set<string>()

function prefetchMarketImages(scopeCodes: readonly string[], limit = 12): void {
  if (typeof Image === 'undefined') return
  for (const scopeCode of scopeCodes.slice(0, limit)) {
    const modelId = marketSubsectorIllustrationModel(scopeCode)
    if (modelId === undefined) continue
    const image = equipmentImageForModel(modelId) ?? sectorIllustrationImage(modelId)
    if (image === undefined || prefetchedMarketImages.has(image.src)) continue
    prefetchedMarketImages.add(image.src)
    const preload = new Image()
    preload.decoding = 'async'
    preload.referrerPolicy = 'no-referrer'
    preload.src = image.src
  }
}

async function loadV3GroupSeries(
  api: MarketSectorIndexPublicApi,
  release: MarketSectorIndexDirectoryReleaseV3,
  group: MarketSectorIndexGroupCode,
  fetchRange: Extract<IndexRange, '3M' | '1Y'>,
  signal: AbortSignal,
  keep: (scope: MarketSectorIndexScopeV3) => boolean = () => true,
  onProgress?: (state: Extract<V3OverviewState, { status: 'READY' }>) => void,
  readKind: 'CHART' | 'CARD' = 'CHART',
): Promise<Extract<V3OverviewState, { status: 'READY' }>> {
  const page = await api.directoryV3ScopePages(group, release.publication_id, { signal }, 32)
  const scopes = page.scopes.filter(keep)
  const progressiveSeries: MarketSectorIndexSeriesV3[] = []
  let progressiveFailures = 0
  const publishProgress = release.native_cny ? undefined : onProgress
  publishProgress?.({ status: 'READY', scopes, series: [], failedCount: progressiveFailures })
  const loaded = await mapPool(scopes, 4, async (scope) => {
    const end = v3SeriesEnd(scope, release)
    if ((!release.native_cny && scope.first_available_date === null) || end === null) {
      return { kind: 'EMPTY' as const }
    }
    try {
      const fromDate = readKind === 'CARD'
        ? latestPairFrom(scope.first_available_date ?? previousUtcDay(end), end)
        : indexFromForRange(scope.first_available_date, end, fetchRange)
      const series = await api.seriesV3Pages({
        publication_id: release.publication_id,
        scope_token: scope.scope_token,
        from_date: fromDate,
        to_date: end,
        after_date: null,
        limit: readKind === 'CARD' ? 2 : indexRequestLimit(fetchRange),
      }, { signal })
      if (series.response_kind === 'ERROR') {
        progressiveFailures += 1
        publishProgress?.({ status: 'READY', scopes, series: [...progressiveSeries], failedCount: progressiveFailures })
        return { kind: 'FAILED' as const, code: series.error.code as ProblemCode }
      }
      progressiveSeries.push(series)
      publishProgress?.({ status: 'READY', scopes, series: [...progressiveSeries], failedCount: progressiveFailures })
      return { kind: 'SERIES' as const, series }
    } catch (error: unknown) {
      if (signal.aborted) throw error
      progressiveFailures += 1
      publishProgress?.({ status: 'READY', scopes, series: [...progressiveSeries], failedCount: progressiveFailures })
      return { kind: 'FAILED' as const, code: problemCode(error) }
    }
  // Native fails closed on any failure, so it starts no further reads after the first.
  }, () => Boolean(release.native_cny) && progressiveFailures > 0)
  const series = loaded.flatMap((entry) => entry.kind === 'SERIES' ? [entry.series] : [])
  const failures = loaded.filter((entry) => entry.kind === 'FAILED')
  if ((release.native_cny || series.length === 0) && failures.length > 0) {
    throw new MarketSectorIndexDirectoryV3ResponseError(failures[0]!.code, false)
  }
  return { status: 'READY', scopes, series, failedCount: failures.length }
}

type NativeConfirmation = 'SAME' | 'MOVED' | 'STALE'
type NativeEpoch = Readonly<{
  /**
   * A user action starts a new operation with one automatic recovery. The returned signal
   * aborts when the next operation begins or the view unmounts.
   */
  begin: () => AbortSignal
  /**
   * Compares the viewed publication with CURRENT. MOVED: the whole view (and page) is
   * switching to the current publication. STALE: a pinned view must fail closed.
   * The first completed recovery of an operation claims its budget; concurrent recoveries
   * reuse that claim instead of following again, and a spent budget reads nothing.
   */
  confirm: (viewed: string, signal: AbortSignal, recovery: boolean) => Promise<NativeConfirmation>
}>

function V3SectorOverview({
  api, release, range, cnyPerUsd, onSelectFineScope, onClearFineScope, native, switching,
}: {
  api: MarketSectorIndexPublicApi
  release: MarketSectorIndexDirectoryReleaseV3
  range: Exclude<IndexRange, 'ALL'>
  cnyPerUsd: string | null
  onSelectFineScope: (group: MarketSectorIndexGroupCode, scopeCode: string) => void
  onClearFineScope: () => void
  native: NativeEpoch
  /** The page already shows another publication; nothing from this release may render. */
  switching: boolean
}) {
  const lang = useLang()
  const fetchRange = range === '1Y' ? '1Y' : '3M'
  const [reload, setReload] = useState(0)
  const [rootState, setRootState] = useState<V3OverviewState>({ status: 'LOADING' })
  const [focusedRootCode, setFocusedRootCode] = useState<string | null>(null)
  const [drillRoot, setDrillRoot] = useState<MarketSectorIndexScopeV3 | null>(null)
  const [childState, setChildState] = useState<V3OverviewState | null>(null)
  const childCache = useRef(new Map<string, Extract<V3OverviewState, { status: 'READY' }>>())
  const intentPrefetch = useMemo(() => createIntentPrefetchScheduler(), [])
  const recover = (signal: AbortSignal) =>
    native.confirm(release.publication_id, signal, true).catch((): NativeConfirmation => 'SAME')

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
    const controller = new AbortController()
    setRootState({ status: 'LOADING' })
    void loadV3GroupSeries(
      api,
      release,
      'SECTORS',
      fetchRange,
      controller.signal,
      (scope) => (scope.scope_kind === 'SECTOR' || Boolean(release.native_cny)) && scope.parent_scope_code === 'ALL',
    ).then((state) => {
      if (!controller.signal.aborted) setRootState(state)
    }).catch(async (error: unknown) => {
      if (controller.signal.aborted) return
      // A pinned native release fails closed after a new publication. Move the whole view
      // (roots, children, detail) to the current release instead of reporting no points.
      if (release.native_cny && await recover(controller.signal) === 'MOVED') return
      if (!controller.signal.aborted) setRootState({ status: 'PROBLEM', code: problemCode(error) })
    })
    return () => controller.abort()
    // native only reads refs; the release and reload counter scope this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, fetchRange, release, reload])

  useEffect(() => {
    const childGroup = drillRoot === null ? undefined : CHILD_GROUP_BY_ROOT[drillRoot.scope_code]
    if (drillRoot === null || childGroup === undefined) {
      setChildState(null)
      return
    }
    const cacheKey = `${release.publication_id}:${childGroup}:${fetchRange}`
    const cached = childCache.current.get(cacheKey)
    if (cached !== undefined && !release.native_cny) {
      setChildState(cached)
      return
    }
    const controller = new AbortController()
    if (cached !== undefined) {
      // A cached native child is shown only after this operation confirms its release.
      setChildState({ status: 'LOADING' })
      void native.confirm(release.publication_id, controller.signal, false).then((outcome) => {
        if (controller.signal.aborted || outcome === 'MOVED') return
        setChildState(outcome === 'SAME' ? cached : { status: 'PROBLEM', code: 'NOT_PUBLISHED' })
      }).catch((error: unknown) => {
        if (!controller.signal.aborted) setChildState({ status: 'PROBLEM', code: problemCode(error) })
      })
      return () => controller.abort()
    }
    setChildState({ status: 'LOADING' })
    void loadV3GroupSeries(
      api,
      release,
      childGroup,
      fetchRange,
      controller.signal,
      (scope) => scope.ancestor_scope_codes.includes(drillRoot.scope_code),
      (state) => {
        if (!controller.signal.aborted) setChildState(state)
      },
      'CARD',
    ).then((state) => {
      if (!controller.signal.aborted) {
        childCache.current.set(cacheKey, state)
        setChildState(state)
      }
    }).catch(async (error: unknown) => {
      if (controller.signal.aborted) return
      if (release.native_cny && await recover(controller.signal) === 'MOVED') return
      if (!controller.signal.aborted) setChildState({ status: 'PROBLEM', code: problemCode(error) })
    })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, drillRoot, fetchRange, release, reload])

  const makeWindows = (state: V3OverviewState | null) => {
    if (state?.status !== 'READY') return []
    const seriesByCode = new Map(state.series.map((series) => [series.scope.scope_code, series]))
    return state.scopes.map((scope, index) => {
      const series = seriesByCode.get(scope.scope_code)
      const points = series === undefined ? [] : filterPointsByRange(series.points, range)
      const latest = points.at(-1) ?? series?.points.at(-1)
      const color = SECTOR_LINE_COLOR_BY_CODE[
        scope.scope_code as keyof typeof SECTOR_LINE_COLOR_BY_CODE
      ] ?? SECTOR_LINE_COLORS[index % SECTOR_LINE_COLORS.length] as string
      return {
        scope,
        series,
        points,
        name: scopeName(scope, lang),
        color,
        overlay: rebasedPercentRuns(points),
        overlayBridges: rebasedPercentBridgeRuns(points),
        ratio: windowReturn(points, range),
        dailyRatio: latestDailyReturn(points),
        size: (latest === undefined ? null : numericAskSum(latest)) ?? scope.current_member_count,
        sizeLabel: release.native_cny ? formatLocalizedCurrencyFromCny(
          latest?.absolute_price.member_minimum_ask_sum_cny ?? null, lang, cnyPerUsd, 0,
        ) : undefined,
      }
    })
  }
  const rootWindows = makeWindows(rootState)
  const childWindows = makeWindows(childState)
  const visibleRoots = focusedRootCode === null
    ? rootWindows.filter((entry) => entry.series !== undefined)
    : rootWindows.filter((entry) => entry.scope.scope_code === focusedRootCode && entry.series !== undefined)
  const rootCells = rootWindows.map((entry) => ({
    name: entry.name,
    scopeCode: entry.scope.scope_code,
    size: entry.size,
    sizeLabel: entry.sizeLabel,
    ratio: entry.ratio,
  }))
  const childCells = childWindows.map((entry) => ({
    name: entry.name,
    scopeCode: entry.scope.scope_code,
    size: entry.size,
    sizeLabel: entry.sizeLabel,
    ratio: entry.dailyRatio,
  }))
  const rootIntentKey = (scopeCode: string) => {
    const childGroup = CHILD_GROUP_BY_ROOT[scopeCode]
    return childGroup === undefined ? null : `market-group:${release.publication_id}:${childGroup}`
  }
  const prefetchRoot = (scopeCode: string, immediate = false) => {
    const childGroup = CHILD_GROUP_BY_ROOT[scopeCode]
    const key = rootIntentKey(scopeCode)
    if (childGroup === undefined || key === null) return
    intentPrefetch.schedule(key, async (signal) => {
      const page = await api.directoryV3ScopePages(
        childGroup, release.publication_id, { signal }, 32,
      )
      signal.throwIfAborted()
      prefetchMarketImages(page.scopes
        .filter((scope) => scope.ancestor_scope_codes.includes(scopeCode))
        .map((scope) => scope.scope_code))
    }, immediate)
  }
  const cancelRootPrefetch = (scopeCode: string) => {
    const key = rootIntentKey(scopeCode)
    if (key !== null) intentPrefetch.cancel(key)
  }
  const childIntentKey = (scopeCode: string) =>
    `market-series:${release.publication_id}:${scopeCode}:${fetchRange}`
  const prefetchChild = (scopeCode: string, immediate = false) => {
    // A hover must not start years of history; All loads on explicit selection.
    const scope = childWindows.find((entry) => entry.scope.scope_code === scopeCode)?.scope
    if (scope === undefined || (!release.native_cny && scope.first_available_date === null)) return
    const end = v3SeriesEnd(scope, release)
    if (end === null) return
    intentPrefetch.schedule(childIntentKey(scopeCode), async (signal) => {
      const series = await api.seriesV3Pages({
        publication_id: release.publication_id,
        scope_token: scope.scope_token,
        from_date: indexFromForRange(scope.first_available_date!, end, fetchRange),
        to_date: end,
        after_date: null,
        limit: indexRequestLimit(fetchRange),
      }, { signal })
      if (series.response_kind === 'ERROR') throw new MarketSectorIndexDirectoryV3ResponseError(
        series.error.code, series.error.retryable,
      )
    }, immediate)
  }
  const cancelChildPrefetch = (scopeCode: string) => intentPrefetch.cancel(childIntentKey(scopeCode))
  const retryNative = () => {
    const signal = native.begin()
    void native.confirm(release.publication_id, signal, false).catch((): NativeConfirmation => 'SAME').then((outcome) => {
      if (!signal.aborted && outcome === 'SAME') setReload((value) => value + 1)
    })
  }
  const openRoot = (scopeCode: string) => {
    const scope = rootWindows.find((entry) => entry.scope.scope_code === scopeCode)?.scope
    if (scope === undefined) return
    native.begin()
    setDrillRoot(scope)
    setFocusedRootCode(scopeCode)
    const childGroup = CHILD_GROUP_BY_ROOT[scopeCode]
    if (childGroup === undefined) onSelectFineScope('SECTORS', scopeCode)
    else onClearFineScope()
  }

  return (
    <section className="public-market-hierarchy" aria-labelledby="public-market-sector-trends-title">
      <div className="public-result-section-heading">
        <h3 id="public-market-sector-trends-title">{lang === 'zh' ? '板块走势' : 'Sector trends'}</h3>
      </div>
      {rootState.status === 'LOADING' || switching ? <p role="status">{marketT('indexLoading', lang)}</p> : null}
      {switching ? null : rootState.status === 'PROBLEM' ? release.native_cny
        ? <NativeProblem onRetry={retryNative} />
        : <ProblemPanel code={rootState.code} onRetry={() => setReload((value) => value + 1)} /> : null}
      {!switching && rootState.status === 'READY' ? (
        <div className="public-market-board__sectors">
          {visibleRoots.length > 0 ? (
            <div className="public-market-board__canvas" data-testid="v3-coarse-sector-overlay">
              <Suspense fallback={<p role="status">{marketT('indexLoading', lang)}</p>}>
                <SectorOverlayChart
                  lang={lang}
                  label={marketT(release.native_cny ? 'indexSectorLegend' : 'indexSectorLines', lang)}
                  series={visibleRoots.map((entry) => ({
                    name: entry.name,
                    runs: entry.overlay,
                    bridges: entry.overlayBridges,
                    preserveSegments: Boolean(release.native_cny),
                    color: entry.color,
                  }))}
                />
              </Suspense>
              <div className="public-market-board__legend" role="group" aria-label={marketT('indexSectorLegend', lang)}>
                <button type="button" aria-pressed={focusedRootCode === null} onClick={() => setFocusedRootCode(null)}>
                  <span className="public-market-board__legend-dot public-market-board__legend-dot--all" aria-hidden="true" />
                  <span>{marketT('indexAllSectors', lang)}</span>
                </button>
                {rootWindows.map((entry) => (
                  <button
                    key={entry.scope.scope_code}
                    type="button"
                    aria-pressed={focusedRootCode === entry.scope.scope_code}
                    disabled={entry.series === undefined}
                    onClick={() => setFocusedRootCode(entry.scope.scope_code)}
                  >
                    <span className="public-market-board__legend-dot" style={{ backgroundColor: entry.color }} aria-hidden="true" />
                    <span>{entry.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : <p className="public-market-index__empty">{marketT('indexNoHistory', lang)}</p>}
          <div className="public-market-board__canvas" data-testid="v3-coarse-sector-heatmap">
            <div className="public-market-hierarchy__map-heading">
              <h3>{lang === 'zh' ? '板块热力图' : 'Sector heatmap'}</h3>
            </div>
            <SectorHeatmap
              lang={lang}
              label={marketT('indexSectorHeatmap', lang)}
              cells={rootCells}
              onIntentScope={prefetchRoot}
              onCancelIntentScope={cancelRootPrefetch}
              onSelectScope={openRoot}
              selectedScopeCode={drillRoot?.scope_code ?? null}
            />
          </div>
          {drillRoot !== null ? (
            <div className="public-market-board__canvas public-market-hierarchy__children" data-testid="v3-child-sector-grid">
              <div className="public-market-hierarchy__map-heading">
                <div>
                  <button type="button" onClick={() => {
                    setDrillRoot(null)
                    setFocusedRootCode(null)
                    onClearFineScope()
                  }}>{lang === 'zh' ? '全部板块' : 'All sectors'}</button>
                  <span aria-hidden="true"> / </span>
                  <strong>{scopeName(drillRoot, lang)}</strong>
                </div>
              </div>
              {childState === null ? (
                <p>{lang === 'zh' ? '该板块当前没有已发布的下一级指数。' : 'No published child index is available for this sector.'}</p>
              ) : childState.status === 'LOADING' ? (
                <p role="status">{marketT('indexLoading', lang)}</p>
              ) : childState.status === 'PROBLEM' ? (
                release.native_cny ? <NativeProblem onRetry={retryNative} />
                  : <ProblemPanel code={childState.code} onRetry={() => setReload((value) => value + 1)} />
              ) : childCells.length === 0 ? (
                <p>{marketT('indexNoSectors', lang)}</p>
              ) : (
                <SectorTileGrid
                  lang={lang}
                  label={lang === 'zh' ? `${scopeName(drillRoot, lang)}细分板块` : `${scopeName(drillRoot, lang)} child sectors`}
                  cells={childCells}
                  onIntentScope={prefetchChild}
                  onCancelIntentScope={cancelChildPrefetch}
                  onSelectScope={(scopeCode) => {
                    const childGroup = CHILD_GROUP_BY_ROOT[drillRoot.scope_code]
                    if (childGroup !== undefined) onSelectFineScope(childGroup, scopeCode)
                  }}
                />
              )}
            </div>
          ) : null}
          {rootState.failedCount > 0 ? (
            <p className="public-market-index__disclosure">
              {lang === 'zh' ? `${rootState.failedCount} 个板块暂时无法读取。` : `${rootState.failedCount} sectors are temporarily unavailable.`}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function v3GroupForScope(scopeCode: string, view: MarketBoardView): MarketSectorIndexGroupCode {
  if (scopeCode === 'ALL') return view === 'MARKET' ? 'MARKET' : 'SECTORS'
  if (scopeCode.startsWith('CASE:')) return 'CASES'
  if (scopeCode.startsWith('WEAPON_MODEL:')) return 'WEAPON_MODELS'
  if (scopeCode.startsWith('KNIFE_MODEL:')) return 'KNIFE_MODELS'
  if (scopeCode.startsWith('GLOVE_MODEL:')) return 'GLOVE_MODELS'
  if (scopeCode.startsWith('COLLECTION:')) return 'COLLECTIONS'
  if (scopeCode.startsWith('ARMORY_RELEASE:')) return 'ARMORY_RELEASES'
  if (
    scopeCode === 'DOPPLER' || scopeCode.startsWith('DOPPLER:') ||
    scopeCode === 'GAMMA_DOPPLER' || scopeCode.startsWith('GAMMA_DOPPLER:')
  ) return 'DOPPLER'
  return view === 'MARKET' ? 'MARKET' : 'SECTORS'
}

/** The E second curve beside an H main curve, read for the main curve's own scope and window.
 * Only under an H release (its copy names the main index's members); never under V1 or a
 * rollback to V1. Loads after the main curve and never delays, replaces or fails it: any
 * failure, NOT_PUBLISHED included, leaves E hidden. */
function useNativeSecondaryCurve(
  gateway: MarketSectorIndexPublicGateway | undefined, series: MarketSectorIndexSeriesV3,
): NativeSecondarySeries | null {
  const from = series.series_query.from_date, to = series.series_query.to_date
  const key = gateway?.readNativeSecondarySeries !== undefined && series.release.native_cny &&
    series.release.native_method === NATIVE_CNY_INDEX_METHOD_H && from !== null && to !== null
    ? JSON.stringify([series.release.publication_id, series.scope.scope_code, from, to]) : null
  const [loaded, setLoaded] = useState<Readonly<{ key: string; curve: NativeSecondarySeries | null }> | null>(null)
  useEffect(() => {
    if (key === null || gateway?.readNativeSecondarySeries === undefined || from === null || to === null) return
    const controller = new AbortController()
    gateway.readNativeSecondarySeries({ scope_code: series.scope.scope_code, from_date: from, to_date: to },
      { signal: controller.signal }).then(
      (curve) => { if (!controller.signal.aborted) setLoaded({ key, curve }) },
      () => { if (!controller.signal.aborted) setLoaded({ key, curve: null }) },
    )
    return () => controller.abort()
    // `key` names the publication, scope and window that the other inputs derive from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, key])
  return loaded !== null && loaded.key === key ? loaded.curve : null
}

/** E points inside the main curve's displayed window, ending at E's own latest row. */
export function secondaryWindowPoints(
  curve: NativeSecondarySeries | null, main: readonly MarketSectorIndexPoint[],
): readonly MarketSectorIndexPoint[] {
  const first = main[0]?.date, last = main.at(-1)?.date
  if (curve === null || first === undefined || last === undefined) return []
  return curve.points.filter((point) => point.date >= first && point.date <= last && point.date <= curve.latest_date)
}

function V3HistoryResult({
  series, linkedCollections, onSelectLinkedCollection, range, cnyPerUsd, gateway,
}: {
  series: MarketSectorIndexSeriesV3
  linkedCollections: readonly MarketSectorIndexScopeV3[]
  onSelectLinkedCollection: (scope: MarketSectorIndexScopeV3) => void
  range: IndexRange
  cnyPerUsd: string | null
  gateway?: MarketSectorIndexPublicGateway
}) {
  const lang = useLang()
  const points = useMemo(() => filterPointsByRange(series.points, range), [range, series.points])
  const latest = points.at(-1) ?? series.points.at(-1) ?? null
  const runs = useMemo(() => indexLevelRuns(points), [points])
  const bridges = useMemo(() => indexLevelBridgeRuns(points), [points])
  const disclosures = useMemo(() => chartPointDisclosures(points), [points])
  const curve = useNativeSecondaryCurve(gateway, series)
  const secondaryPoints = useMemo(() => secondaryWindowPoints(curve, points), [curve, points])
  const secondaryRuns = useMemo(() => indexLevelRuns(secondaryPoints), [secondaryPoints])
  const secondaryDisclosures = useMemo(() => chartPointDisclosures(secondaryPoints), [secondaryPoints])
  const secondaryAsOf = secondaryRuns.length === 0 ? null : secondaryPoints.at(-1)?.date ?? null
  const secondary = useMemo(() => secondaryAsOf === null ? null : {
    name: marketT('indexCurveE', lang), runs: secondaryRuns, disclosures: secondaryDisclosures,
  }, [lang, secondaryAsOf, secondaryDisclosures, secondaryRuns])
  const change = windowReturn(points, range)
  const anomalies = latest?.quality.anomaly_contributions ?? []
  const mainLabel = lang === 'zh'
    ? `${series.scope.labels.zh_cn}连续指数，${points[0]?.date ?? ''}至${latest?.date ?? ''}`
    : `${series.scope.labels.en} continuous index, ${points[0]?.date ?? ''} to ${latest?.date ?? ''}`
  const label = secondaryAsOf === null ? mainLabel : lang === 'zh'
    ? `${mainLabel}；主指数${marketT('indexCurveMain', lang)}为实线，对照曲线${marketT('indexCurveE', lang)}为虚线，截至${secondaryAsOf}`
    : `${mainLabel}; main index ${marketT('indexCurveMain', lang)} solid, comparison curve ${marketT('indexCurveE', lang)} dashed, as of ${secondaryAsOf}`
  return (
    <>
      {series.scope.low_member_count ? (
        <p className="public-market-index__disclosure" data-disclosure="LOW_MEMBER_COUNT">
          {lang === 'zh'
            ? `低成员范围：当前仅 ${series.scope.current_member_count} 个成员，指数更容易受单一商品影响。`
            : `Low-member scope: only ${series.scope.current_member_count} current members; one item can have an outsized effect.`}
        </p>
      ) : null}
      {!series.release.native_cny && (series.scope.origin_uncertainty_disclosed || latest?.origin_uncertainty.status !== 'NONE') ? (
        <p className="public-market-index__disclosure" data-disclosure="ORIGIN_UNCERTAINTY">
          {lang === 'zh'
            ? `成员起源存在不确定性：活跃不确定成员 ${latest?.origin_uncertainty.active_uncertain_origin_member_count ?? 0}，可能未纳入成员 ${latest?.origin_uncertainty.possible_unadmitted_member_count ?? 0}。`
            : `Origin uncertainty: ${latest?.origin_uncertainty.active_uncertain_origin_member_count ?? 0} active uncertain members and ${latest?.origin_uncertainty.possible_unadmitted_member_count ?? 0} possibly unadmitted members.`}
        </p>
      ) : null}
      {linkedCollections.length > 0 ? (
        <nav className="public-market-index__linked-collections" aria-label={lang === 'zh' ? '关联收藏品指数' : 'Linked collection indexes'}>
          <span>{lang === 'zh' ? '关联收藏品：' : 'Linked collections: '}</span>
          {linkedCollections.map((scope) => (
            <button key={scope.scope_token} type="button" onClick={() => onSelectLinkedCollection(scope)}>
              {scopeName(scope, lang)}
            </button>
          ))}
        </nav>
      ) : null}
      <div className="public-market-index__headline">
        <div>
          <span>{marketT('indexLatestValue', lang)}</span>
          <strong>{formatDecimal(latest?.index.value ?? null, lang, 3, Boolean(latest?.native_cny))}</strong>
          <small data-change={change === null ? 'flat' : ratioNumber(change) < 0 ? 'down' : 'up'}>
            {latest === null ? '—' : formatDay(latest.date, lang)}
            {' · '}
            {change === null ? '—' : formatPublicRatio(change, lang)}
            {' '}
            {rangeLabel(range, lang)}
          </small>
        </div>
        <dl>
          <div><dt>{marketT('indexDailyChange', lang)}</dt><dd>{formatPublicRatio(latest?.index.period_return ?? null, lang)}</dd></div>
          <div><dt>{marketT('indexCoverage', lang)}</dt><dd>{formatPublicRatio(latest?.coverage.coverage_ratio_lower_bound ?? null, lang)}</dd></div>
          <div><dt>{marketT('indexQuality', lang)}</dt><dd>{latest?.quality.overall ?? '—'}</dd></div>
        </dl>
      </div>
      {runs.length === 0 ? (
        <p className="public-market-index__empty">{marketT('indexNoPoints', lang)}</p>
      ) : (
        <div
          className="public-market-board__canvas"
          data-segment-count={runCount(runs)}
          data-bridge-count={bridges.length}
        >
          <Suspense fallback={<p role="status">{marketT('indexLoading', lang)}</p>}>
            <MarketLevelChart
              runs={runs}
              bridges={bridges}
              disclosures={disclosures}
              preserveSegments={Boolean(series.release.native_cny)}
              lang={lang}
              label={label}
              primaryName={marketT('indexCurveMain', lang)}
              secondary={secondary}
            />
          </Suspense>
        </div>
      )}
      <div className="public-market-index__range">
        <span>{points[0] ? formatDay(points[0].date, lang) : '—'}</span>
        <span>{latest ? formatDay(latest.date, lang) : '—'}</span>
      </div>
      {secondaryAsOf !== null && runs.length > 0 ? (
        <div className="public-market-index__curves" data-testid="index-second-curve" data-secondary-as-of={secondaryAsOf}>
          <ul className="public-market-index__legend" aria-label={marketT('indexCurveLegend', lang)}>
            <li data-curve="MAIN"><span className="public-market-index__swatch" aria-hidden="true" />{marketT('indexCurveMain', lang)}</li>
            <li data-curve="E">
              <span className="public-market-index__swatch public-market-index__swatch--secondary" aria-hidden="true" />
              {marketT('indexCurveE', lang)}
              <small>{lang === 'zh'
                ? `（${marketT('indexCurveAsOf', lang)} ${formatDay(secondaryAsOf, lang)}）`
                : ` (${marketT('indexCurveAsOf', lang)} ${formatDay(secondaryAsOf, lang)})`}</small>
            </li>
          </ul>
          <p className="public-market-index__disclosure" data-disclosure="SECOND_CURVE">{marketT('indexCurveENote', lang)}</p>
        </div>
      ) : null}
      {latest !== null ? (
        <dl className="public-market-index__details">
          {/* Native CNY points carry no raw/robust equal-weight returns (always —): not shown. */}
          {latest.native_cny ? null : <>
            <div><dt>{marketT('rawReturn', lang)}</dt><dd>{formatPublicRatio(latest.index.raw_equal_return, lang)}</dd></div>
            <div><dt>{marketT('suppressedReturn', lang)}</dt><dd>{formatPublicRatio(latest.index.robust_equal_return, lang)}</dd></div>
          </>}
          <div><dt>{marketT('indexAskSum', lang)}</dt><dd>{formatLocalizedCurrencyFromCny(latest.absolute_price.member_minimum_ask_sum_cny, lang, cnyPerUsd, 0)}</dd></div>
          <div><dt>{marketT('indexMedianAsk', lang)}</dt><dd>{formatLocalizedCurrencyFromCny(latest.absolute_price.member_minimum_ask_median_cny, lang, cnyPerUsd, 0)}</dd></div>
          <div><dt>{marketT('indexMembers', lang)}</dt><dd>{latest.coverage.paired_member_count} / {latest.coverage.expected_member_count_upper_bound ?? '—'}</dd></div>
          <div><dt>{marketT('indexAvailability', lang)}</dt><dd>{marketT(latest.availability === 'RECONSTRUCTED_LATE_BOUND' ? 'indexReconstructed' : 'indexForward', lang)}</dd></div>
          <div><dt>{marketT('indexGradeCounts', lang)}</dt><dd>A {latest.quality.grade_counts.A} · B {latest.quality.grade_counts.B} · C {latest.quality.grade_counts.C} · D {latest.quality.grade_counts.D} · E {latest.quality.grade_counts.E}</dd></div>
          <div><dt>{marketT('indexAnomalyCount', lang)}</dt><dd>{latest.quality.anomaly_member_count ?? '—'}</dd></div>
        </dl>
      ) : null}
      {anomalies.length > 0 ? (
        <details className="public-market-index__anomalies">
          <summary>{marketT('indexAnomalyDetails', lang)}</summary>
          <ul>{anomalies.map((entry) => (
            <li key={entry.analysis_unit_id}>
              <code>{entry.analysis_unit_id}</code>
              <span>{formatPublicRatio(entry.raw_return, lang)} → {formatPublicRatio(entry.suppressed_return, lang)}</span>
            </li>
          ))}</ul>
        </details>
      ) : null}
    </>
  )
}

/** The method line names the series the release actually publishes. A native release
 * carries its decoded method; until it is known no method is named, so the H page never
 * flashes the V1 name. Non-native releases keep the V1 name. */
export function v3MethodCopy(
  release: MarketSectorIndexDirectoryReleaseV3 | null, nativeGateway: boolean,
): 'indexMethodName' | 'indexMethodNameH' | null {
  if (release === null) return nativeGateway ? null : 'indexMethodName'
  return release.native_method === NATIVE_CNY_INDEX_METHOD_H ? 'indexMethodNameH' : 'indexMethodName'
}

/** The disclosure follows the method line: V1, H, or neutral while no method is named. */
export function v3DisclosureCopy(methodCopy: ReturnType<typeof v3MethodCopy>) {
  return INDEX_DISCLOSURE_COPY[methodCopy === null ? 'NEUTRAL' : methodCopy === 'indexMethodNameH' ? 'H' : 'V1']
}

function V3MarketSectorIndexHistory({
  gateway, api: providedApi, scopeCode, view = 'MARKET', selectedSectorCode = null, cnyPerUsd = null,
  nativePublicationId, onNativePublicationChanged,
  ...legacyProps
}: MarketSectorIndexHistoryProps) {
  const lang = useLang()
  const fallbackApi = useMemo(() => new MarketSectorIndexPublicApi(gateway), [gateway])
  const api = providedApi ?? fallbackApi
  const requestedScope = selectedSectorCode ?? scopeCode
  const requestedDetailScope = view === 'SECTORS' && selectedSectorCode === null && requestedScope === 'ALL'
    ? null
    : requestedScope
  const [reload, setReload] = useState(0)
  const [range, setRange] = useState<IndexRange>('3M')
  const [useLegacy, setUseLegacy] = useState(false)
  const [selectedScopeCode, setSelectedScopeCode] = useState<string | null>(requestedDetailScope)
  const [selectedGroupCode, setSelectedGroupCode] = useState<MarketSectorIndexGroupCode>(
    requestedDetailScope === null ? 'SECTORS' : v3GroupForScope(requestedDetailScope, view),
  )
  const [release, setRelease] = useState<MarketSectorIndexDirectoryReleaseV3 | null>(null)
  const releaseRef = useRef(release)
  releaseRef.current = release
  const pagePin = nativePublicationId ?? null
  const pagePinRef = useRef(pagePin)
  pagePinRef.current = pagePin
  const onPublicationChangedRef = useRef(onNativePublicationChanged)
  onPublicationChangedRef.current = onNativePublicationChanged
  // One automatic native recovery per user operation. Effects, release changes and
  // page epochs never grant another; only begin() on a user action does.
  const recoveryBudget = useRef(1)
  // Publication this operation's claimed follow moved to; recoveries behind it reuse it.
  const followedTo = useRef<string | null>(null)
  const supersededBy = (viewed: string) => followedTo.current !== null && followedTo.current !== viewed
  // Work started from a user action outside an effect (Retry, window confirmation).
  const operation = useRef<AbortController | null>(null)
  useEffect(() => () => operation.current?.abort(), [])
  // The viewed publication is superseded and this view cannot follow: fail closed, cards included.
  const [expired, setExpired] = useState(false)
  // The history run of the operation effect; a window action that fails closed revokes it.
  const historyRun = useRef<AbortController | null>(null)
  const followPage = (target: string): boolean => {
    // A spent budget still agrees with a follow to the same publication already under way.
    if (recoveryBudget.current <= 0) return followedTo.current === target
    recoveryBudget.current -= 1
    if (!(onPublicationChangedRef.current?.() ?? false)) return false
    followedTo.current = target
    return true
  }
  const native = useMemo<NativeEpoch>(() => ({
    begin: () => {
      recoveryBudget.current = 1
      followedTo.current = null
      operation.current?.abort()
      operation.current = new AbortController()
      return operation.current.signal
    },
    confirm: async (viewed, signal, recovery) => {
      if (recovery && recoveryBudget.current <= 0) return supersededBy(viewed) ? 'MOVED' : 'STALE'
      const directory = await api.directoryV3Groups(null, { signal })
      if (signal.aborted || directory === null) return 'STALE'
      const current = directory.release
      // Only a completed recovery claims the budget, so a cancelled one leaves it to its
      // successor. Concurrent recoveries (roots, children, detail) share that one claim:
      // a later one reuses the claimed follow and never follows again.
      let mayFollow = !recovery
      if (recovery && recoveryBudget.current > 0) {
        recoveryBudget.current -= 1
        mayFollow = true
      } else if (recovery && supersededBy(viewed)) return 'MOVED'
      if (current.publication_id === viewed) return 'SAME'
      const pin = pagePinRef.current
      if (pin !== null) {
        // The page owns the publication: it follows CURRENT (ACTIVE) or fails closed (explicit).
        if (current.publication_id === pin) return 'MOVED'
        if (!mayFollow) return 'STALE'
        if (!recovery) return followPage(current.publication_id) ? 'MOVED' : 'STALE'
        if (!(onPublicationChangedRef.current?.() ?? false)) return 'STALE'
        followedTo.current = current.publication_id
        return 'MOVED'
      }
      if (!mayFollow) return 'STALE'
      followedTo.current = current.publication_id
      if (releaseRef.current?.publication_id !== current.publication_id) {
        releaseRef.current = current
        setRelease(current)
        setReload((value) => value + 1)
      }
      return 'MOVED'
    },
    // followPage only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [api])
  const beginOperation = native.begin
  const overviewRange = range === 'ALL' ? '1Y' : range
  // Clamp synchronously on the navigation render, before effects can dispatch
  // with the outgoing market selection. A detail All never feeds the overview.
  const effectiveRange = view === 'SECTORS' && (selectedScopeCode === null || selectedScopeCode === 'ALL')
    ? overviewRange : range
  const fetchRange = fetchRangeFor(effectiveRange)
  const [state, setState] = useState<V3HistoryState>(
    requestedDetailScope === null ? { status: 'IDLE' } : { status: 'LOADING' },
  )
  const selectRange = (next: IndexRange) => {
    const signal = beginOperation()
    setRange(next)
    const viewed = releaseRef.current
    const nextEffective = view === 'SECTORS' && (selectedScopeCode === null || selectedScopeCode === 'ALL')
      ? (next === 'ALL' ? '1Y' : next) : next
    // A new fetch range re-runs the operation effect, which confirms CURRENT itself.
    if (!viewed?.native_cny || fetchRangeFor(nextEffective) !== fetchRange) return
    // 7D/1M/3M share one history read: reuse it only for a confirmed publication. An
    // unconfirmed one (superseded, or CURRENT unreadable) fails closed with a Retry.
    const failClosed = (code: ProblemCode) => {
      if (signal.aborted) return
      // A history still in flight for the shared fetch range must not commit over this
      // failure; only a new operation (Retry) reads again.
      historyRun.current?.abort()
      setExpired(true)
      setState({ status: 'PROBLEM', code })
    }
    void native.confirm(viewed.publication_id, signal, false).then(
      (outcome) => { if (outcome === 'STALE') failClosed('NOT_PUBLISHED') },
      (error: unknown) => failClosed(problemCode(error)),
    )
  }
  // The page moved to another publication; this release's content must not render beside it.
  const switching = pagePin !== null && release !== null && Boolean(release.native_cny) &&
    release.publication_id !== pagePin

  useEffect(() => {
    beginOperation()
    if (view === 'SECTORS') setRange(current => current === 'ALL' ? '1Y' : current)
    const nextScope = selectedSectorCode ?? scopeCode
    const nextDetailScope = view === 'SECTORS' && selectedSectorCode === null && nextScope === 'ALL'
      ? null
      : nextScope
    setSelectedScopeCode(nextDetailScope)
    setSelectedGroupCode(nextDetailScope === null ? 'SECTORS' : v3GroupForScope(nextDetailScope, view))
    setState(nextDetailScope === null ? { status: 'IDLE' } : { status: 'LOADING' })
  }, [scopeCode, selectedSectorCode, view])

  useEffect(() => {
    const controller = new AbortController()
    historyRun.current = controller
    setState(selectedScopeCode === null ? { status: 'IDLE' } : { status: 'LOADING' })
    // Native publication this run reads; a failure after it is known may recover once.
    let viewed: string | null = null
    void (async () => {
      // Every operation starts by confirming CURRENT (shared, TTL-bounded).
      const directory = await api.directoryV3Groups(null, { signal: controller.signal })
      if (directory === null) {
        if (!controller.signal.aborted) setUseLegacy(true)
        return
      }
      setUseLegacy(false)
      if (controller.signal.aborted) return
      if (directory.release.native_cny && pagePin !== null && directory.release.publication_id !== pagePin) {
        // The page shows another publication: it follows CURRENT once, or this view fails closed.
        if (!followPage(directory.release.publication_id)) {
          setExpired(true)
          setState({ status: 'PROBLEM', code: 'NOT_PUBLISHED' })
        }
        return
      }
      setExpired(false)
      if (directory.release.native_cny) viewed = directory.release.publication_id
      setRelease((current) => current?.publication_id === directory.release.publication_id
        ? current
        : directory.release)
      if (selectedScopeCode === null) return
      const page = await api.directoryV3ScopePages(
        selectedGroupCode, directory.release.publication_id, { signal: controller.signal }, 32,
      )
      if (controller.signal.aborted) return
      const scope = page.scopes.find((candidate) => candidate.scope_code === selectedScopeCode)
      if (scope === undefined) {
        setState({ status: 'PROBLEM', code: 'NOT_FOUND' })
        return
      }
      if (!directory.release.native_cny && (scope.first_available_date === null || scope.last_available_date === null)) {
        setState({ status: 'EMPTY', scope })
        return
      }
      let linkedCollections: readonly MarketSectorIndexScopeV3[] = []
      if (scope.linked_collection_scope_tokens.length > 0) {
        const collectionPage = await api.directoryV3ScopePages(
          'COLLECTIONS', directory.release.publication_id, { signal: controller.signal }, 32,
        )
        const byToken = new Map(collectionPage.scopes.map((candidate) => [candidate.scope_token, candidate]))
        linkedCollections = scope.linked_collection_scope_tokens.map((token) => {
          const linked = byToken.get(token)
          if (linked === undefined) throw new MarketSectorIndexValidationError()
          return linked
        })
      }
      const effectiveEnd = v3SeriesEnd(scope, directory.release)
      if (effectiveEnd === null) { setState({ status: 'EMPTY', scope }); return }
      const readSeries = fetchRange === 'ALL' ? api.allNativeSeriesV3.bind(api) : api.seriesV3Pages.bind(api)
      const series = await readSeries({
        publication_id: directory.release.publication_id,
        scope_token: scope.scope_token,
        from_date: indexFromForRange(scope.first_available_date, effectiveEnd, fetchRange),
        to_date: effectiveEnd,
        after_date: null,
        limit: indexRequestLimit(fetchRange),
      }, { signal: controller.signal })
      if (controller.signal.aborted) return
      if (series.response_kind === 'ERROR' && viewed !== null) {
        throw new MarketSectorIndexDirectoryV3ResponseError(series.error.code, series.error.retryable)
      }
      if (series.response_kind === 'ERROR') setState({ status: 'PROBLEM', code: series.error.code })
      else setState({ status: 'READY', series, linkedCollections })
    })().catch(async (error: unknown) => {
      if (controller.signal.aborted) return
      if (viewed !== null && await native.confirm(viewed, controller.signal, true)
        .catch((): NativeConfirmation => 'SAME') === 'MOVED') return
      if (!controller.signal.aborted) setState({ status: 'PROBLEM', code: problemCode(error) })
    })
    return () => controller.abort()
    // followPage and native only read refs; the page epoch re-runs this operation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, fetchRange, pagePin, reload, selectedGroupCode, selectedScopeCode])

  const methodCopy = v3MethodCopy(release, gateway.kind === 'NATIVE_CNY_MARKET_INDEX')
  if (useLegacy) {
    return <LegacyMarketSectorIndexHistory gateway={gateway} api={api} scopeCode={scopeCode} view={view} selectedSectorCode={selectedSectorCode} cnyPerUsd={cnyPerUsd} {...legacyProps} />
  }
  return (
    <section className="public-market-index public-market-board" aria-labelledby="public-market-index-title" data-testid="market-sector-index-history" data-series-id="ROBUST_EQUAL_V3">
      <div className="public-market-board__toolbar">
        <div className="public-result-section-heading">
          <p>CONTINUOUS INDEX</p>
          <h2 id="public-market-index-title">{marketT('indexTitle', lang)}</h2>
        </div>
        <div className="public-market-board__controls"><RangePicker value={view === 'SECTORS' ? overviewRange : range} onChange={selectRange} native={view !== 'SECTORS' && gateway.kind === 'NATIVE_CNY_MARKET_INDEX'} /></div>
      </div>
      {methodCopy === null ? null : <p className="public-market-board__method">{marketT(methodCopy, lang)}</p>}
      <p className="public-market-index__disclosure">{marketT(v3DisclosureCopy(methodCopy), lang)}</p>
      {view === 'SECTORS' && release !== null && !expired ? (
        <V3SectorOverview
          api={api}
          release={release}
          range={overviewRange}
          cnyPerUsd={cnyPerUsd}
          onSelectFineScope={(group, scope) => {
            beginOperation()
            setSelectedGroupCode(group)
            setSelectedScopeCode(scope)
          }}
          onClearFineScope={() => {
            setSelectedGroupCode('SECTORS')
            setSelectedScopeCode(null)
            setState({ status: 'IDLE' })
          }}
          native={native}
          switching={switching}
        />
      ) : null}
      {view === 'SECTORS' && selectedScopeCode !== null && selectedScopeCode !== 'ALL' && gateway.kind === 'NATIVE_CNY_MARKET_INDEX' ? (
        <div className="public-market-board__controls" data-testid="v3-detail-ranges">
          <RangePicker value={effectiveRange} onChange={selectRange} native />
        </div>
      ) : null}
      {state.status === 'LOADING' ? <p role="status">{marketT('indexLoading', lang)}</p> : null}
      {state.status === 'EMPTY' ? <p role="status" data-history-eligibility={state.scope.price_history_eligibility}>{marketT('indexNoHistory', lang)}</p> : null}
      {state.status === 'PROBLEM' ? gateway.kind === 'NATIVE_CNY_MARKET_INDEX'
        ? <NativeProblem onRetry={() => { beginOperation(); setReload((value) => value + 1) }} />
        : <ProblemPanel code={state.code} onRetry={() => setReload((value) => value + 1)} /> : null}
      {state.status === 'READY' && switching && view !== 'SECTORS' ? <p role="status">{marketT('indexLoading', lang)}</p> : null}
      {state.status === 'READY' && !switching ? (
        <section className={view === 'SECTORS' ? 'public-market-index__selected-detail' : undefined} data-testid={view === 'SECTORS' ? 'v3-sector-detail' : undefined}>
          {view === 'SECTORS' ? (
            <div className="public-market-hierarchy__map-heading">
              <h3>{scopeName(state.series.scope, lang)}{lang === 'zh' ? '指数走势' : ' index trend'}</h3>
            </div>
          ) : null}
          <V3HistoryResult
            gateway={gateway}
            series={state.series}
            linkedCollections={state.linkedCollections}
            range={effectiveRange}
            cnyPerUsd={cnyPerUsd}
            onSelectLinkedCollection={(scope) => {
              beginOperation()
              setSelectedGroupCode('COLLECTIONS')
              setSelectedScopeCode(scope.scope_code)
            }}
          />
        </section>
      ) : null}
    </section>
  )
}

export function MarketSectorIndexHistory(props: MarketSectorIndexHistoryProps) {
  return props.gateway.preferredSeriesVersion === '3'
    ? <V3MarketSectorIndexHistory {...props} />
    : <LegacyMarketSectorIndexHistory {...props} />
}
