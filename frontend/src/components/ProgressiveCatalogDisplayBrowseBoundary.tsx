import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { preloadable } from '../performance/preloadable'
import { preparePriceDiscovery } from '../price/preparedPriceDiscovery'
import { useRetainedRead, type RetainedRead } from '../hooks/useRetainedRead'
import { readCatalogSeriesWindow } from '../catalog/readCatalogSeriesWindow'
import equal from 'fast-deep-equal'
import {
  CatalogDisplayApi,
  type CatalogDisplayGateway,
} from '../api/CatalogDisplayApi'
import { CatalogDisplayTransportError } from '../api/HttpCatalogDisplayGateway'
import type { FormalResultReadGateway } from '../api/FormalResultReadApi'
import type { MarketWatchlistPublicGateway } from '../api/MarketWatchlistPublicApi'
import type { CatalogPriceControls } from './CatalogUnitPricePanel'
import {
  CatalogDisplayReadUnavailable,
  catalogDisplayPitContext,
  toCatalogDisplayMemberView,
  type CatalogDisplayPresentation,
} from '../adapter/catalogDisplayViewModel'
import type {
  WireCatalogBootstrapResponse,
  WireCatalogDetailResponse,
  WireCatalogDetailQuery,
  WireCatalogSeriesResponse,
  WireCatalogSeriesQuery,
  WireCatalogUnitsResponse,
  WireCatalogUnitsQuery,
} from '../wire/catalogDisplayQueryApiTypes'
import { normalizeCatalogQueryText } from '../catalog/catalogQueryText'
import type { WireCatalogDisplaySnapshotDescriptor } from '../wire/catalogDisplaySnapshotApiTypes'
import type { CatalogBrowseState } from '../contract/catalogBrowse'
import { CatalogSortOrder, WearTier } from '../contract/catalogBrowse'
import { EditionKind } from '../contract/identity'
import { allEquipmentInCategory, equipmentCategories, equipmentModelById, equipmentModels } from '../catalog/equipmentModels'
import { equipmentForSeries, type EquipmentSummary } from '../catalog/catalogEquipment'
import { rarityForSeries } from '../catalog/catalogFacets'
import { parseCatalogSearchIntent } from '../catalog/catalogSearchIntent'
import { cx } from '../catalog/catalogExplorerCopy'
import { pick, useLang } from '../i18n'
import { t } from '../i18n/strings'
import { catalogSeriesLabel } from '../catalog/catalogSeriesPresentation'
import {
  CATALOG_DISCOVERY_BATCH_SIZE,
  CATALOG_DISCOVERY_LIMIT,
  CATALOG_DISCOVERY_VISIBLE_COUNT_SESSION_KEY,
  catalogDiscoverySessionSeed,
} from '../catalog/catalogDiscovery'
import { catalogCategoryWatchCandidate, equipmentModelWatchCandidate } from '../watchlist/watchTargetRegistry'
import type { PersonalWatchlistController } from '../watchlist/personalWatchlist'
import type { PublicDetailOrigin } from '../publicNavigation'
import { CatalogEquipmentRail } from './CatalogEquipmentRail'
import { CatalogQueryBar, clearedCatalogQuery } from './CatalogQueryBar'
import { CatalogSeriesTile, type CatalogTileModelLink } from './CatalogSeriesTile'
import { PersonalWatchlistToggle } from './PersonalWatchlistToggle'
import '../catalog/catalogExplorer.css'

const detailModule = preloadable(async () => {
  const module = await import('../pages/CatalogUnitDetailPage')
  return { default: module.CatalogUnitDetailPage }
})
const seriesModule = preloadable(async () => {
  const module = await import('./CatalogSeriesPage')
  return { default: module.CatalogSeriesPage }
})
const CatalogUnitDetailPage = detailModule.Component
const CatalogSeriesPage = seriesModule.Component

const ALL_EDITIONS = Object.freeze(Object.values(EditionKind))
const ALL_WEARS = Object.freeze(Object.values(WearTier))
const SERIES_PAGE_SIZE = 60
const COLLECTION_PAGE_SIZE = 200
const MAX_AUTOMATIC_PAGES = 100
const UNITS_CACHE_LIMIT = 8
const SKELETON_TILES = 8

// Per gateway, so a remount after the detail view finds the series window and
// the open series' units again without another round trip.
const seriesCaches = new WeakMap<CatalogDisplayGateway, Map<string, WireCatalogSeriesResponse>>()
const unitsCaches = new WeakMap<CatalogDisplayGateway, Map<string, WireCatalogUnitsResponse>>()
// The browse list's window scroll survives the series and detail views.
let savedBrowseScroll = 0

function cacheFor<T>(caches: WeakMap<CatalogDisplayGateway, Map<string, T>>, gateway: CatalogDisplayGateway) {
  let cache = caches.get(gateway)
  if (!cache) {
    cache = new Map()
    caches.set(gateway, cache)
  }
  return cache
}

function windowScrollTop(): number {
  return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
}

function setWindowScrollTop(value: number): void {
  document.documentElement.scrollTop = value
  document.body.scrollTop = value
  if (!navigator.userAgent.toLowerCase().includes('jsdom')) window.scrollTo(0, value)
}

function readDiscoverySessionNumber(key: string, fallback: number): number {
  try {
    const raw = globalThis.sessionStorage?.getItem(key)
    if (raw === null || raw === undefined) return fallback
    const stored = Number(raw)
    if (Number.isFinite(stored) && stored >= 0) return stored
  } catch {
    // Storage availability must not determine whether the catalog can render.
  }
  return fallback
}

function writeDiscoverySessionNumber(key: string, value: number): void {
  try {
    globalThis.sessionStorage?.setItem(key, String(value))
  } catch {
    // The current document state remains usable when sessionStorage is blocked.
  }
}

class ProgressiveCatalogSnapshotUnavailable extends Error {
  readonly code = 'NO_AVAILABLE_SNAPSHOT' as const
  readonly retryable = false
}

function success<T extends WireCatalogBootstrapResponse['response_kind'] | WireCatalogSeriesResponse['response_kind'] | WireCatalogUnitsResponse['response_kind'] | WireCatalogDetailResponse['response_kind']>(
  response: Awaited<ReturnType<CatalogDisplayApi['bootstrap']>>,
  expected: T,
): Extract<
  WireCatalogBootstrapResponse | WireCatalogSeriesResponse | WireCatalogUnitsResponse | WireCatalogDetailResponse,
  { response_kind: T }
> {
  if (response.response_kind === 'ERROR') {
    throw new CatalogDisplayReadUnavailable(
      response.error.code,
      response.error.retryable,
      response.error.http_status,
    )
  }
  if (response.response_kind !== expected) {
    throw new TypeError('catalog query response kind changed after request binding')
  }
  return response as unknown as Extract<
    WireCatalogBootstrapResponse | WireCatalogSeriesResponse | WireCatalogUnitsResponse | WireCatalogDetailResponse,
    { response_kind: T }
  >
}

type CursorPage = {
  next_cursor: string | null
  previous_cursor: string | null
  snapshot: {
    catalog_version: string
    member_set_hash: string
    snapshot_id: string
  }
}

async function collectCursorPages<TPage extends CursorPage, TMember>({
  signal,
  label,
  load,
  membersOf,
  totalOf,
  keyOf,
  consistent = () => true,
}: {
  signal: AbortSignal
  label: string
  load: (cursor: string | null) => Promise<TPage>
  membersOf: (page: TPage) => readonly TMember[]
  totalOf: (page: TPage) => number
  keyOf: (member: TMember) => string
  consistent?: (first: TPage, page: TPage) => boolean
}): Promise<{ first: TPage; members: readonly TMember[] }> {
  let cursor: string | null = null
  let first: TPage | null = null
  let expectedTotal = 0
  const cursors = new Set<string>()
  const memberKeys = new Set<string>()
  const members: TMember[] = []

  for (let pageNumber = 0; ; pageNumber += 1) {
    if (pageNumber >= MAX_AUTOMATIC_PAGES) {
      throw new TypeError(`${label} automatic page limit exceeded`)
    }
    if (signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError')
    const page = await load(cursor)
    if (first === null) {
      if (page.previous_cursor !== null) {
        throw new TypeError(`${label} first page unexpectedly has a previous cursor`)
      }
      first = page
      expectedTotal = totalOf(page)
    } else if (
      page.snapshot.snapshot_id !== first.snapshot.snapshot_id ||
      page.snapshot.member_set_hash !== first.snapshot.member_set_hash ||
      page.snapshot.catalog_version !== first.snapshot.catalog_version ||
      totalOf(page) !== expectedTotal ||
      !consistent(first, page)
    ) {
      throw new TypeError(`${label} pages do not share one stable snapshot and result set`)
    }

    for (const member of membersOf(page)) {
      const key = keyOf(member)
      if (memberKeys.has(key)) throw new TypeError(`${label} pages repeat a member identity`)
      memberKeys.add(key)
      members.push(member)
    }
    if (members.length > expectedTotal) {
      throw new TypeError(`${label} pages exceed the declared result total`)
    }

    const next = page.next_cursor
    if (next === null) break
    if (cursors.has(next)) throw new TypeError(`${label} pages repeat a cursor`)
    cursors.add(next)
    cursor = next
  }

  if (first === null || members.length !== expectedTotal) {
    throw new TypeError(`${label} pages do not account for the complete result set`)
  }
  return { first, members: Object.freeze(members) }
}

function equipmentSummariesFromBootstrap(
  bootstrap: WireCatalogBootstrapResponse | undefined,
): readonly EquipmentSummary[] {
  if (!bootstrap) return []
  return bootstrap.equipment.map((entry) => {
    const model = equipmentModelById(entry.selection_id)
    if (!model || model.itemKind !== entry.item_kind || model.category !== entry.category_id) {
      throw new TypeError('bootstrap equipment does not match the frontend profile consumer')
    }
    return { model, series: entry.series_count, members: entry.member_count }
  })
}

async function readAllUnits(
  api: CatalogDisplayApi,
  query: WireCatalogUnitsQuery,
  signal: AbortSignal,
): Promise<WireCatalogUnitsResponse> {
  const collected = await collectCursorPages({
    signal,
    label: 'catalog units',
    load: async (cursor) => success(await api.units({ query, cursor }, { signal }), 'CATALOG_QUERY_UNITS'),
    membersOf: (page) => page.members,
    totalOf: (page) => page.total_matching_members,
    keyOf: (member) => member.projection.analysis_unit_id,
    consistent: (first, page) => equal(first.facet, page.facet),
  })
  return { ...collected.first, members: collected.members, next_cursor: null, previous_cursor: null }
}

async function readAllDetailSiblings(
  api: CatalogDisplayApi,
  query: WireCatalogDetailQuery,
  signal: AbortSignal,
): Promise<WireCatalogDetailResponse> {
  const collected = await collectCursorPages({
    signal,
    label: 'catalog detail siblings',
    load: async (cursor) => success(await api.detail({ query, cursor }, { signal }), 'CATALOG_QUERY_DETAIL'),
    membersOf: (page) => page.siblings,
    totalOf: (page) => page.sibling_total,
    keyOf: (member) => member.projection.analysis_unit_id,
    consistent: (first, page) =>
      first.parent_present === page.parent_present && equal(first.member, page.member),
  })
  return { ...collected.first, siblings: collected.members, next_cursor: null, previous_cursor: null }
}

function failure(error: unknown): { code: string; retryable: boolean } {
  if (error instanceof CatalogDisplayTransportError) {
    return { code: error.code, retryable: error.retryable }
  }
  if (error instanceof CatalogDisplayReadUnavailable) {
    return { code: error.code, retryable: error.retryable }
  }
  if (error instanceof ProgressiveCatalogSnapshotUnavailable) {
    return { code: error.code, retryable: error.retryable }
  }
  return { code: 'CONSUMPTION_BOUNDARY_REJECTED', retryable: false }
}

function InlineReadState({
  read,
  retry,
  loadingLabel,
}: {
  read: RetainedRead<unknown>
  retry: () => void
  loadingLabel: string
}) {
  const lang = useLang()
  if (read.status === 'loading') {
    return <p className="formal-catalog__query-status" role="status" aria-live="polite">{loadingLabel}</p>
  }
  if (read.status !== 'error') return null
  const detail = failure(read.error)
  const hasRetainedValue = 'value' in read && read.value !== undefined
  return (
    <div className="formal-catalog__query-error" role="alert">
      <span>{t(hasRetainedValue ? 'publicCatalogRetainedError' : 'catalogBrowsePublicError', lang)}</span>
      {detail.retryable ? <button type="button" onClick={retry}>{t('catalogBrowseRetry', lang)}</button> : null}
    </div>
  )
}

export type CatalogQueryRouteChange = Readonly<{
  snapshotId?: string | null
}>

function withoutSeries(state: CatalogBrowseState): CatalogBrowseState {
  return { ...state, baseItemCode: null, selectedEditions: [], selectedWears: [] }
}

export function ProgressiveCatalogDisplayBrowseBoundary({
  active = true,
  gateway,
  queryAsOf,
  knownAt,
  state,
  onChange,
  onOpenUnit,
  onReplaceUnit,
  selectedUnitId,
  onCloseUnit,
  qualityGateway,
  publicResultGateway,
  price,
  presentation,
  reloadToken,
  snapshotId,
  resultAsOf,
  onQueryRouteChange,
  personalWatchlist,
  detailBackTarget,
  seriesHref = () => '#',
  unitHref = () => '#',
  onLeaveUnit,
}: {
  active?: boolean
  gateway: CatalogDisplayGateway
  queryAsOf: string
  knownAt: string
  state: CatalogBrowseState
  onChange: (next: CatalogBrowseState) => void
  onOpenUnit?: (analysisUnitId: string) => void
  onReplaceUnit?: (analysisUnitId: string) => void
  selectedUnitId: string | null
  onCloseUnit?: () => void
  qualityGateway?: FormalResultReadGateway
  publicResultGateway?: MarketWatchlistPublicGateway
  price?: CatalogPriceControls
  presentation: CatalogDisplayPresentation
  reloadToken: number
  snapshotId: string | null
  resultAsOf: string
  onQueryRouteChange?: (change: CatalogQueryRouteChange, mode?: 'push' | 'replace') => void
  personalWatchlist?: PersonalWatchlistController
  detailBackTarget: PublicDetailOrigin | null
  /** Address of a browse state, so series tiles are real links. */
  seriesHref?: (state: CatalogBrowseState) => string
  /** Address of one item's detail view. */
  unitHref?: (analysisUnitId: string) => string
  /** Leave an item's detail view for a browse state (its category, model or series). */
  onLeaveUnit?: (state: CatalogBrowseState) => void
}) {
  const lang = useLang()
  const api = useMemo(() => new CatalogDisplayApi(gateway), [gateway])
  const [discoverySeed] = useState(catalogDiscoverySessionSeed)
  const [discoveryVisibleCount, setDiscoveryVisibleCount] = useState(() => Math.max(
    CATALOG_DISCOVERY_LIMIT,
    Math.floor(readDiscoverySessionNumber(
      CATALOG_DISCOVERY_VISIBLE_COUNT_SESSION_KEY,
      CATALOG_DISCOVERY_LIMIT,
    )),
  ))
  const [completedReloadToken, setCompletedReloadToken] = useState(reloadToken)
  const refreshLatest = reloadToken !== completedReloadToken
  const descriptorCache = useRef<{
    source: string
    descriptor: WireCatalogDisplaySnapshotDescriptor
  } | null>(null)
  const sourceKey = `${queryAsOf}\u0000${knownAt}\u0000${reloadToken}`
  const [descriptorRead, retryDescriptor] = useRetainedRead(
    active,
    `${sourceKey}\u0000${snapshotId ?? ''}`,
    async (signal) => {
      const cached = descriptorCache.current
      if (
        cached?.source === sourceKey &&
        (snapshotId === null || snapshotId === cached.descriptor.snapshot_id)
      ) {
        return cached
      }
      const inventory = await api.listSnapshots({
        query: {
          known_at: knownAt,
          page_size: 200,
          query_as_of: queryAsOf,
          sort: 'AS_OF_DESC',
        },
        cursor: null,
      }, { signal })
      if (inventory.response_kind === 'ERROR') {
        throw new CatalogDisplayReadUnavailable(
          inventory.error.code,
          inventory.error.retryable,
          inventory.error.http_status,
        )
      }
      const descriptor = refreshLatest || snapshotId === null
        ? inventory.members[0]
        : inventory.members.find((candidate) => candidate.snapshot_id === snapshotId)
      if (!descriptor) throw new ProgressiveCatalogSnapshotUnavailable()
      descriptorCache.current = { source: sourceKey, descriptor }
      return { source: sourceKey, descriptor }
    },
  )
  const descriptorRecord = 'value' in descriptorRead && descriptorRead.value?.source === sourceKey
    ? descriptorRead.value
    : undefined
  const descriptor = descriptorRecord?.descriptor
  const seriesOpen = state.itemKind !== null && state.baseItemCode !== null

  // Equipment navigation and the series list are independent reads: the list
  // never waits for the navigation counts.
  const [bootstrapRead, retryBootstrap] = useRetainedRead(
    active && descriptor !== undefined && selectedUnitId === null,
    descriptor?.snapshot_id ?? '',
    async (signal) => success(
      await api.bootstrap({ query: { snapshot_id: descriptor!.snapshot_id } }, { signal }),
      'CATALOG_QUERY_BOOTSTRAP',
    ),
  )
  const bootstrap = 'value' in bootstrapRead && bootstrapRead.value?.snapshot.snapshot_id === descriptor?.snapshot_id
    ? bootstrapRead.value
    : undefined
  const equipmentSummaries = useMemo(() => equipmentSummariesFromBootstrap(bootstrap), [bootstrap])

  const [settledSearch, setSettledSearch] = useState(state.seriesQuery)
  useEffect(() => {
    const timeout = window.setTimeout(() => setSettledSearch(state.seriesQuery), 250)
    return () => window.clearTimeout(timeout)
  }, [state.seriesQuery])
  // Hold the read until the debounced query catches up so that a text edit
  // cannot launch a stale request before the current search value settles.
  const seriesSearchSettled = settledSearch === state.seriesQuery

  const selectedModel = equipmentModelById(state.equipmentModel)
  const trimmedSearch = settledSearch.trim()
  const parsedIntent = useMemo(
    () => selectedModel || trimmedSearch === '' ? null : parseCatalogSearchIntent(trimmedSearch, equipmentModels),
    [selectedModel, trimmedSearch],
  )
  const [declinedIntent, setDeclinedIntent] = useState<string | null>(null)
  const intentModel = parsedIntent?.model && declinedIntent !== trimmedSearch ? parsedIntent.model : null
  const facetsActive = state.rarity !== null || state.itemCategory !== null || state.wearTier !== null
  const globalResultsActive = state.equipmentModel === null && (state.seriesQuery.trim() !== '' || facetsActive)
  const defaultDiscoveryActive = state.equipmentModel === null && !globalResultsActive
  const scopeModel = selectedModel ?? intentModel ?? undefined
  const searchText = intentModel ? parsedIntent!.remainder : trimmedSearch === '' ? null : trimmedSearch
  const apiLocale = lang === 'zh' ? 'zh_cn' : 'en'
  const seriesQuery: WireCatalogSeriesQuery = {
    snapshot_id: descriptor?.snapshot_id ?? '',
    equipment_selection_id: scopeModel?.id ?? 'GLOBAL',
    locale: apiLocale,
    rarity: state.rarity,
    item_category: state.itemCategory,
    wear_tier: state.wearTier,
    search_text: searchText,
    search_normalized: searchText === null ? null : normalizeCatalogQueryText(searchText),
    sort: defaultDiscoveryActive ? 'DISCOVERY' : 'PRODUCT',
    page_size: defaultDiscoveryActive ? CATALOG_DISCOVERY_BATCH_SIZE : SERIES_PAGE_SIZE,
    ...(defaultDiscoveryActive ? { discovery_seed: discoverySeed } : {}),
  }
  const seriesKey = JSON.stringify(seriesQuery)
  const [requestedSeries, setRequestedSeries] = useState({ key: '', count: SERIES_PAGE_SIZE })
  const requestedSeriesCount = defaultDiscoveryActive ? discoveryVisibleCount
    : requestedSeries.key === seriesKey ? requestedSeries.count : SERIES_PAGE_SIZE
  const [browseSeriesRead, retryBrowseSeries] = useRetainedRead(
    active && descriptor !== undefined && selectedUnitId === null && seriesSearchSettled && !seriesOpen,
    JSON.stringify([seriesKey, requestedSeriesCount]),
    async (signal) => readCatalogSeriesWindow(api, seriesQuery, requestedSeriesCount, signal, cacheFor(seriesCaches, gateway)),
  )
  const retainedSeries = 'value' in browseSeriesRead ? browseSeriesRead.value : undefined
  const browseSeriesCandidate = retainedSeries && equal(retainedSeries.query, seriesQuery) ? retainedSeries : undefined
  // A replaced query keeps the previous results on screen, dimmed, until the new
  // page arrives; it never blanks the grid on every keystroke or filter change.
  const seriesStale = browseSeriesCandidate === undefined || !seriesSearchSettled
  const displayedSeries = browseSeriesCandidate ??
    (retainedSeries && retainedSeries.snapshot.snapshot_id === descriptor?.snapshot_id && browseSeriesRead.status !== 'error'
      ? retainedSeries
      : undefined)

  const unitsQuery: WireCatalogUnitsQuery = {
    snapshot_id: descriptor?.snapshot_id ?? '',
    item_kind: state.itemKind ?? 'UNKNOWN',
    base_item_code: state.baseItemCode ?? '',
    edition_kinds: ALL_EDITIONS,
    wear_tiers: ALL_WEARS,
    locale: apiLocale,
    rarity: null,
    item_category: null,
    sort: CatalogSortOrder.EDITION_ASC,
    page_size: COLLECTION_PAGE_SIZE,
  }
  const unitsKey = JSON.stringify(unitsQuery)
  useEffect(() => {
    if (!active || (!seriesOpen && selectedUnitId === null)) return
    // Chunk loading starts with the data read, not only after all units arrive.
    void (selectedUnitId === null ? seriesModule : detailModule).preload().catch(() => undefined)
  }, [active, seriesOpen, selectedUnitId])
  const preparedPrice = useMemo(() => {
    if (!active || !descriptor || !price || (!seriesOpen && selectedUnitId === null)) return undefined
    return preparePriceDiscovery(price.gateway, {
      analysisUnitId: selectedUnitId ?? '', queryAsOf, knownAt,
      catalog: { snapshot_id: descriptor.snapshot_id, as_of: descriptor.as_of, available_at: descriptor.available_at },
    })
  }, [active, descriptor, price?.gateway, queryAsOf, knownAt, seriesOpen, selectedUnitId])
  useEffect(() => preparedPrice?.start(), [preparedPrice])
  const [unitsRead, retryUnits] = useRetainedRead(
    active && descriptor !== undefined && selectedUnitId === null && seriesOpen,
    unitsKey,
    async (signal) => {
      const cache = cacheFor(unitsCaches, gateway)
      const hit = cache.get(unitsKey)
      if (hit) return hit
      const value = await readAllUnits(api, unitsQuery, signal)
      cache.set(unitsKey, value)
      while (cache.size > UNITS_CACHE_LIMIT) cache.delete(cache.keys().next().value!)
      return value
    },
  )
  const unitsCandidate = 'value' in unitsRead && unitsRead.value &&
    equal(unitsRead.value.query, unitsQuery) ? unitsRead.value : undefined

  const [detailRead, retryDetail] = useRetainedRead(
    active && descriptor !== undefined && selectedUnitId !== null,
    JSON.stringify([
      descriptor?.snapshot_id,
      selectedUnitId,
    ]),
    async (signal) => readAllDetailSiblings(api, {
      snapshot_id: descriptor!.snapshot_id,
      analysis_unit_id: selectedUnitId!,
      page_size: COLLECTION_PAGE_SIZE,
    }, signal),
  )
  const detail = 'value' in detailRead ? detailRead.value : undefined

  const viewSnapshot = selectedUnitId !== null
    ? detail?.snapshot
    : seriesOpen
      ? unitsCandidate?.snapshot
      : browseSeriesCandidate?.snapshot ?? bootstrap?.snapshot
  const activeDescriptor = viewSnapshot ?? descriptor

  const candidateReady = descriptor !== undefined && (
    selectedUnitId !== null
      ? detail?.snapshot.snapshot_id === descriptor.snapshot_id &&
        detail.query.analysis_unit_id === selectedUnitId
      : seriesOpen
        ? unitsCandidate?.snapshot.snapshot_id === descriptor.snapshot_id
        : browseSeriesCandidate?.snapshot.snapshot_id === descriptor.snapshot_id
  )

  useEffect(() => {
    if (!active || !candidateReady || !descriptor) return
    if (snapshotId !== descriptor.snapshot_id) {
      onQueryRouteChange?.({
        snapshotId: descriptor.snapshot_id,
      }, 'replace')
    }
    if (refreshLatest) setCompletedReloadToken(reloadToken)
  }, [active, candidateReady, descriptor, onQueryRouteChange, refreshLatest, reloadToken, snapshotId])

  const pitContext = activeDescriptor
    ? catalogDisplayPitContext(activeDescriptor, presentation)
    : {
        data_environment: presentation.data_environment,
        channel: presentation.channel,
        query_as_of: queryAsOf,
        query_known_at: knownAt,
        snapshot: null,
      }

  const presentedSeries = useMemo(() => (displayedSeries?.members ?? []).map((entry) => {
    const representative = toCatalogDisplayMemberView(entry.representative)
    return {
      entry,
      representative,
      name: pick(catalogSeriesLabel(representative.row, representative.item.display_name), lang),
    }
  }), [displayedSeries, lang])
  const visibleSeries = defaultDiscoveryActive
    ? presentedSeries.slice(0, discoveryVisibleCount)
    : presentedSeries
  const seriesTotal = displayedSeries?.total_matching_series ?? 0
  const seriesHasMore = displayedSeries !== undefined && visibleSeries.length < seriesTotal
  const seriesLoading = browseSeriesRead.status === 'loading'

  const showMoreSeries = () => {
    if (!seriesHasMore || seriesLoading || seriesStale) return
    if (defaultDiscoveryActive) {
      setDiscoveryVisibleCount((current) => {
        const next = Math.min(seriesTotal, current + CATALOG_DISCOVERY_BATCH_SIZE)
        writeDiscoverySessionNumber(CATALOG_DISCOVERY_VISIBLE_COUNT_SESSION_KEY, next)
        return next
      })
    } else {
      setRequestedSeries({ key: seriesKey, count: Math.min(seriesTotal, requestedSeriesCount + SERIES_PAGE_SIZE) })
    }
  }
  const showMoreRef = useRef(showMoreSeries)
  showMoreRef.current = showMoreSeries
  const sentinel = useRef<HTMLDivElement>(null)
  const seriesGrid = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const target = sentinel.current
    if (!target || typeof IntersectionObserver !== 'function' || !seriesHasMore || seriesOpen || !active) return
    // One page-level scroll: the next batch is requested before the end is reached.
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) showMoreRef.current()
    }, { rootMargin: '600px 0px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [active, seriesHasMore, seriesLoading, seriesOpen, visibleSeries.length])

  // Window scroll belongs to whichever view is showing. The browse list's
  // position is recorded while it is visible and restored when it returns.
  const browseVisible = useRef(false)
  const previousSeriesOpen = useRef(seriesOpen)
  const openedSeriesInApp = useRef(false)
  const lastOpenedSeries = useRef<string | null>(null)
  useLayoutEffect(() => {
    browseVisible.current = active && selectedUnitId === null && !seriesOpen
    if (selectedUnitId !== null || !active) {
      previousSeriesOpen.current = seriesOpen
      return
    }
    if (previousSeriesOpen.current === seriesOpen) return
    previousSeriesOpen.current = seriesOpen
    if (seriesOpen) {
      setWindowScrollTop(0)
      return
    }
    openedSeriesInApp.current = false
    setWindowScrollTop(savedBrowseScroll)
    const code = lastOpenedSeries.current
    if (code !== null) {
      const tile = [...document.querySelectorAll<HTMLElement>('[data-testid^="catalog-base-"]')]
        .find((candidate) => candidate.dataset.testid === `catalog-base-${code}`)
      tile?.focus({ preventScroll: true })
    }
  }, [active, selectedUnitId, seriesOpen])
  useEffect(() => {
    const record = () => {
      if (browseVisible.current) savedBrowseScroll = windowScrollTop()
    }
    window.addEventListener('scroll', record, { passive: true })
    return () => window.removeEventListener('scroll', record)
  }, [])

  if (
    descriptorRead.status === 'error' &&
    descriptor === undefined &&
    activeDescriptor === undefined
  ) {
    const detailFailure = failure(descriptorRead.error)
    return (
      <section className="page" data-testid="catalog-real-error" role="alert">
        <p className="error">{t('catalogBrowsePublicError', lang)}</p>
        {detailFailure.retryable ? <button type="button" onClick={retryDescriptor}>{t('catalogBrowseRetry', lang)}</button> : null}
      </section>
    )
  }

  if (selectedUnitId !== null) {
    if (!activeDescriptor || !detail || (presentation.data_environment !== 'LIVE_PUBLIC' && !qualityGateway) || !onCloseUnit) {
      const read = descriptor ? detailRead : descriptorRead
      return (
        <section className="formal-catalog__empty" data-testid="catalog-query-detail-loading" aria-busy={read.status === 'loading'}>
          <InlineReadState read={read} retry={descriptor ? retryDetail : retryDescriptor} loadingLabel={t('publicCatalogLoadingDetail', lang)} />
          {read.status === 'error' && onCloseUnit ? <button type="button" onClick={onCloseUnit}>{t('publicDetailBack', lang)}</button> : null}
        </section>
      )
    }
    const member = toCatalogDisplayMemberView(detail.member)
    const siblings = detail.siblings.map(toCatalogDisplayMemberView)
    const detailStatusRead = descriptor ? detailRead : descriptorRead
    // Breadcrumbs come from the item itself; the address may not name a model.
    const unitModel = equipmentForSeries(member.row.item_kind, member.row.base_item_code)
    const unitCategory = equipmentCategories.find((entry) => entry.id === unitModel.category)
    const categoryChoice = allEquipmentInCategory(unitModel.category)
    // A breadcrumb opens a fresh list: start it at its top, not where browsing last stood.
    const crumb = (crumbLabel: string, target: CatalogBrowseState | null) => target && onLeaveUnit
      ? { label: crumbLabel, href: seriesHref(target), onOpen: () => {
          savedBrowseScroll = 0
          lastOpenedSeries.current = null
          onLeaveUnit(target)
        } }
      : { label: crumbLabel }
    const trail = [
      ...(unitCategory ? [crumb(pick(unitCategory.name, lang), categoryChoice
        ? { ...withoutSeries(state), itemKind: categoryChoice.itemKind, equipmentModel: categoryChoice.id, seriesQuery: '' }
        : null)] : []),
      crumb(pick(unitModel.name, lang), unitModel.scope === 'MODEL'
        ? { ...withoutSeries(state), itemKind: unitModel.itemKind, equipmentModel: unitModel.id, seriesQuery: '' }
        : null),
      crumb(pick(catalogSeriesLabel(member.row, member.item.display_name), lang), {
        ...state,
        itemKind: member.row.item_kind,
        baseItemCode: member.row.base_item_code,
        selectedEditions: [],
        selectedWears: [],
      }),
    ]
    return (
      <div aria-busy={detailStatusRead.status === 'loading'}>
        <InlineReadState read={detailStatusRead} retry={descriptor ? retryDetail : retryDescriptor} loadingLabel={t('publicCatalogLoadingDetail', lang)} />
        <Suspense
          fallback={
            <div className="formal-site__module-loading" role="status">
              {t('publicLoadingSurface', lang)}
            </div>
          }
        >
          <CatalogUnitDetailPage
            row={member.row}
            item={member.item}
            pitContext={pitContext}
            qualityGateway={qualityGateway}
            publicResultGateway={publicResultGateway}
            queryAsOf={queryAsOf}
            resultAsOf={resultAsOf}
            price={price ? { ...price, knownAt, enabled: active, discovery: preparedPrice } : undefined}
            onBack={onCloseUnit}
            siblingUnits={siblings}
            siblingTotal={detail.sibling_total}
            onOpenSibling={onReplaceUnit ?? onOpenUnit}
            onOpenParent={
              detail.parent_present && member.item.parent_analysis_unit_id && (onReplaceUnit ?? onOpenUnit)
                ? () => (onReplaceUnit ?? onOpenUnit)!(member.item.parent_analysis_unit_id!)
                : undefined
            }
            personalWatchlist={personalWatchlist}
            detailBackTarget={detailBackTarget}
            rarity={rarityForSeries(member.row.item_kind, member.row.base_item_code)}
            trail={trail}
          />
        </Suspense>
      </div>
    )
  }

  const openSeries = (entry: { item_kind: CatalogBrowseState['itemKind']; base_item_code: string }) => ({
    ...state,
    itemKind: entry.item_kind,
    baseItemCode: entry.base_item_code,
    selectedEditions: [],
    selectedWears: [],
  })
  const leaveSeries = () => {
    if (openedSeriesInApp.current) {
      openedSeriesInApp.current = false
      window.history.back()
      return
    }
    onChange({ ...withoutSeries(state), itemKind: state.equipmentModel === null ? null : state.itemKind })
  }
  const selectModel = (model: { id: string; itemKind: NonNullable<CatalogBrowseState['itemKind']> }) => {
    if (model.id === state.equipmentModel) return
    onChange({ ...withoutSeries(state), itemKind: model.itemKind, equipmentModel: model.id })
  }
  const modelLinkFor = (entry: { item_kind: CatalogBrowseState['itemKind']; base_item_code: string }): CatalogTileModelLink | undefined => {
    if (entry.item_kind === null) return undefined
    const model = equipmentForSeries(entry.item_kind, entry.base_item_code)
    const summary = equipmentSummaries.find((row) => row.model.id === model.id)
    if (model.category === 'UNCLASSIFIED' || !summary) return undefined
    return {
      href: seriesHref({ ...withoutSeries(state), itemKind: model.itemKind, equipmentModel: model.id }),
      seriesCount: summary.series,
      current: state.equipmentModel === model.id,
      onOpen: () => {
        selectModel(model)
        // The model's list is shorter than the one being scrolled; start it at its top.
        const top = seriesGrid.current?.getBoundingClientRect().top
        if (top !== undefined && top < 0) setWindowScrollTop(Math.max(0, windowScrollTop() + top - 120))
      },
    }
  }
  const searchEverywhere = () => onChange({ ...withoutSeries(state), itemKind: null, equipmentModel: null })
  const seriesFailure = browseSeriesRead.status === 'error' ? failure(browseSeriesRead.error) : null
  const category = selectedModel ? equipmentCategories.find((entry) => entry.id === selectedModel.category) : undefined
  const modelWatch = selectedModel && personalWatchlist ? equipmentModelWatchCandidate(selectedModel) : null
  const kindWatch = selectedModel && personalWatchlist ? catalogCategoryWatchCandidate(selectedModel.itemKind) : null
  const openSeriesModel = seriesOpen ? equipmentForSeries(state.itemKind!, state.baseItemCode!) : undefined
  const openSeriesMember = seriesOpen
    ? retainedSeries?.members.find((entry) => entry.item_kind === state.itemKind && entry.base_item_code === state.baseItemCode)
    : undefined
  const openSeriesTitle = openSeriesMember
    ? pick(catalogSeriesLabel(
        toCatalogDisplayMemberView(openSeriesMember.representative).row,
        toCatalogDisplayMemberView(openSeriesMember.representative).item.display_name,
      ), lang)
    : null

  return (
    <div className="catalog-explorer" data-testid="page-item-browse" aria-busy={descriptorRead.status === 'loading' || seriesLoading}>
      <div className="cx-browse" hidden={seriesOpen}>
        <header className="cx-header">
          <h1>{t('publicCatalogTitle', lang)}</h1>
        </header>
        <div className="cx-layout">
          <aside className="cx-side">
            {bootstrap ? (
              <CatalogEquipmentRail
                summaries={equipmentSummaries}
                selectedModelId={selectedModel?.id ?? null}
                onSelectModel={selectModel}
                onClearModel={searchEverywhere}
              />
            ) : bootstrapRead.status === 'error' ? (
              <div className="cx-notice cx-notice--error" role="alert">
                <span>{t('catalogBrowsePublicError', lang)}</span>
                {failure(bootstrapRead.error).retryable ? <button type="button" onClick={retryBootstrap}>{cx('retry', lang)}</button> : null}
              </div>
            ) : (
              <div className="cx-rail cx-rail--loading" aria-hidden="true">
                {Array.from({ length: 6 }, (_, index) => <span key={index} className="cx-skeleton cx-skeleton--chip" />)}
              </div>
            )}
          </aside>

          <div className="cx-main">
            <CatalogQueryBar state={state} onChange={onChange} />

            <section className="cx-results" data-testid="catalog-series-results" aria-busy={seriesLoading}>
              <header className="cx-results__head">
                {selectedModel ? (
                  <div className="cx-results__title">
                    {category && selectedModel.scope === 'MODEL' ? <p className="cx-results__eyebrow">{pick(category.name, lang)}</p> : null}
                    <h2 data-testid="catalog-selected-model">{pick(selectedModel.name, lang)}</h2>
                    {modelWatch && personalWatchlist ? (
                      <PersonalWatchlistToggle controller={personalWatchlist} candidate={modelWatch} presentation="ICON" />
                    ) : null}
                    {kindWatch && personalWatchlist ? (
                      <PersonalWatchlistToggle controller={personalWatchlist} candidate={kindWatch} presentation="COMPACT"
                        caption={cx('kindFollow', lang, { name: pick(kindWatch.localized_name, lang) })} />
                    ) : null}
                  </div>
                ) : globalResultsActive ? (
                  <div className="cx-results__title">
                    <h2 data-testid="catalog-global-search-results">
                      {state.seriesQuery.trim() !== '' ? cx('searchResults', lang) : cx('filteredResults', lang)}
                    </h2>
                  </div>
                ) : (
                  <div className="cx-results__title">
                    <h2 data-testid="catalog-default-discovery">{cx('discoveryTitle', lang)}</h2>
                  </div>
                )}
                {displayedSeries ? (
                  <p className="cx-results__count" aria-live="polite" data-testid="catalog-series-count">
                    {cx('shownOfTotal', lang, { shown: visibleSeries.length, total: seriesTotal })}
                  </p>
                ) : null}
              </header>

              {intentModel && !selectedModel ? (
                <p className="cx-notice cx-notice--intent" data-testid="catalog-search-intent">
                  <span>
                    {cx('intentModel', lang, { model: pick(intentModel.name, lang) })}
                    {parsedIntent?.remainder ? cx('intentKeyword', lang, { text: parsedIntent.remainder }) : ''}
                  </span>
                  <button type="button" onClick={() => setDeclinedIntent(trimmedSearch)}>{cx('intentUndo', lang)}</button>
                </p>
              ) : null}
              {selectedModel && state.seriesQuery.trim() !== '' ? (
                <p className="cx-notice" data-testid="catalog-scoped-search">
                  <span>{cx('scopedSearch', lang, { model: pick(selectedModel.name, lang) })}</span>
                  <button type="button" onClick={searchEverywhere}>{cx('searchEverywhere', lang)}</button>
                </p>
              ) : null}
              {seriesFailure ? (
                <div className="cx-notice cx-notice--error" role="alert">
                  <span>{cx(displayedSeries ? 'readFailedRetained' : 'readFailed', lang)}</span>
                  {seriesFailure.retryable ? <button type="button" onClick={retryBrowseSeries}>{cx('retry', lang)}</button> : null}
                </div>
              ) : null}

              {displayedSeries ? (
                <div
                  ref={seriesGrid}
                  className="cx-grid"
                  data-testid="catalog-series-grid"
                  data-series-mode={defaultDiscoveryActive ? 'SESSION_DISCOVERY' : 'FILTERED'}
                  data-render-strategy="CONTENT_VISIBILITY"
                  data-stale={seriesStale ? 'true' : undefined}
                >
                  {visibleSeries.map(({ entry, representative, name }) => (
                    <CatalogSeriesTile
                      key={`${entry.item_kind}:${entry.base_item_code}`}
                      itemKind={entry.item_kind}
                      baseItemCode={entry.base_item_code}
                      analysisUnitId={representative.row.analysis_unit_id}
                      name={name}
                      image={representative.item.image}
                      rarity={entry.rarity}
                      count={entry.matched_member_count}
                      href={seriesHref(openSeries(entry))}
                      modelLink={modelLinkFor(entry)}
                      onOpen={() => {
                        savedBrowseScroll = windowScrollTop()
                        lastOpenedSeries.current = entry.base_item_code
                        openedSeriesInApp.current = true
                        onChange(openSeries(entry))
                      }}
                    />
                  ))}
                </div>
              ) : !seriesFailure ? (
                <div className="cx-grid" data-testid="catalog-series-loading" role="status">
                  <span className="cx-visually-hidden">{cx('loadingSeries', lang)}</span>
                  {Array.from({ length: SKELETON_TILES }, (_, index) => (
                    <span key={index} className="cx-skeleton cx-skeleton--tile" aria-hidden="true" />
                  ))}
                </div>
              ) : null}

              {displayedSeries && presentedSeries.length === 0 && !seriesStale ? (
                <div className="cx-empty" data-testid="catalog-series-search-empty">
                  <strong>{cx('emptyTitle', lang)}</strong>
                  <div className="cx-empty__actions">
                    {scopeModel ? (
                      <button type="button" onClick={() => {
                        if (intentModel && !selectedModel) setDeclinedIntent(trimmedSearch)
                        else searchEverywhere()
                      }}>{cx('searchEverywhere', lang)}</button>
                    ) : null}
                    {facetsActive || state.seriesQuery !== '' ? (
                      <button type="button" onClick={() => onChange({
                        ...clearedCatalogQuery(state),
                        itemKind: state.itemKind,
                        equipmentModel: state.equipmentModel,
                      })}>{cx('clearFilters', lang)}</button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {seriesHasMore ? (
                <div className="cx-more" ref={sentinel}>
                  <button type="button" data-testid="catalog-series-more" disabled={seriesLoading || seriesStale} onClick={showMoreSeries}>
                    {seriesLoading ? cx('loadingMore', lang) : cx('loadMore', lang)}
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>

      {seriesOpen ? (
        <Suspense fallback={<div className="cx-series cx-series--loading" role="status">{cx('unitsLoading', lang)}</div>}>
          <CatalogSeriesPage
            read={{
              status: unitsCandidate ? 'ready' : unitsRead.status === 'error' ? 'error' : 'loading',
              response: unitsCandidate,
              retryable: unitsRead.status === 'error' ? failure(unitsRead.error).retryable : false,
            }}
            retry={retryUnits}
            title={openSeriesTitle}
            rarity={openSeriesMember?.rarity ?? rarityForSeries(state.itemKind!, state.baseItemCode!)}
            model={openSeriesModel}
            pitContext={pitContext}
            queryAsOf={queryAsOf}
            knownAt={knownAt}
            price={price ? { ...price, enabled: active, discovery: preparedPrice } : undefined}
            unitHref={unitHref}
            onOpenUnit={onOpenUnit}
            personalWatchlist={personalWatchlist}
            onBack={leaveSeries}
            onOpenModel={openSeriesModel && openSeriesModel.scope === 'MODEL' ? () => onChange({
              ...withoutSeries(state),
              itemKind: openSeriesModel.itemKind,
              equipmentModel: openSeriesModel.id,
              seriesQuery: '',
            }) : undefined}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
