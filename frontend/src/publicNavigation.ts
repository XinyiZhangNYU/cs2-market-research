import {
  initialCatalogBrowseState,
  CatalogSortOrder,
  ItemKind,
  WearTier,
  type CatalogBrowseState,
} from './contract/catalogBrowse'
import { EditionKind } from './contract/identity'
import type { Lang } from './i18n'
import { equipmentModelById } from './catalog/equipmentModels'
import {
  isCatalogRarity,
  isCatalogItemCategory,
  isCatalogWearTier,
  type CatalogRarity,
  type CatalogItemCategory,
  type CatalogWearTier,
} from './catalog/catalogFacetOptions'
import { isCatalogQueryTextWithinLimit } from './catalog/catalogQueryText'
import type {
  TrendingDirection,
  TrendingFilters,
} from './wire/singleItemTrendingPublicApiTypes'

export type PublicBetaSurface = 'HOME' | 'CATALOG' | 'MARKET' | 'WATCHLIST' | 'TRENDING' | 'TRADEUP' | 'FOLLOWING' | 'PORTFOLIO' | 'VALVE'

export type PublicRouteState = Readonly<{
  surface: PublicBetaSurface
  lang: Lang
  historyView?: boolean
  selectedUnitId: string | null
  browseState: CatalogBrowseState
  catalogSnapshotId?: string | null
  researchAsOf?: string | null
  publicResultAsOf?: string | null
  publicPublicationId?: string | null
  publicWatchlistUnitId?: string | null
  marketScopeToken?: string | null
  marketView?: 'SECTORS' | null
  trendingAsOf: string | null
  trendingPublicationId: string | null
  trendingDirection: TrendingDirection
  trendingFilters: TrendingFilters
  invalid: boolean
}>

export type PublicRouteDefaults = Readonly<{
  surface: PublicBetaSurface
  lang: Lang
}>

type LocationLike = Pick<Location, 'pathname' | 'search'>

const ITEM_KINDS = new Set<string>(Object.values(ItemKind))
const EDITIONS = new Set<string>(Object.values(EditionKind))
const WEARS = new Set<string>(Object.values(WearTier))
const SORT_ORDERS = new Set<string>(Object.values(CatalogSortOrder))
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/u
const MAX_OPAQUE_VALUE_LENGTH = 512
const SHA256 = /^[0-9a-f]{64}$/u
const UTC_MICROSECOND =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$/u
const DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u
const PUBLIC_SURFACE_PATH = Object.freeze({
  HOME: '/',
  CATALOG: '/catalog',
  MARKET: '/market',
  WATCHLIST: '/item-monitor',
  TRENDING: '/trending',
  TRADEUP: '/tradeup',
  FOLLOWING: '/following',
  PORTFOLIO: '/portfolio',
  VALVE: '/valve',
}) satisfies Readonly<Record<PublicBetaSurface, string>>
const PUBLIC_RESEARCH_PATH = '/research'

function oneValue(params: URLSearchParams, key: string): string | null | undefined {
  const values = params.getAll(key)
  if (values.length === 0) return null
  if (values.length !== 1) return undefined
  return values[0]
}

function safeOpaqueValue(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_OPAQUE_VALUE_LENGTH &&
    !CONTROL_CHARACTER.test(value)
  )
}

function safeSearchValue(value: string): boolean {
  return isCatalogQueryTextWithinLimit(value) && !CONTROL_CHARACTER.test(value)
}

function validDate(value: string): boolean {
  if (!DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function uniqueValues<T extends string>(values: readonly T[]): readonly T[] {
  return [...new Set(values)]
}

export function readPublicRoute(
  location: LocationLike,
  defaults: PublicRouteDefaults,
): PublicRouteState {
  const normalizedPath = location.pathname.replace(/\/+$/u, '') || '/'
  const researchPath = normalizedPath === PUBLIC_RESEARCH_PATH
  const legacyWatchlistPath = normalizedPath === '/watchlist'
  const itemMonitorHistoryPath = normalizedPath === '/item-monitor/history'
  const itemMonitorHistoryDetail = normalizedPath.match(/^\/item-monitor\/history\/([0-9a-f]{64})$/u)
  const malformedItemMonitorHistoryPath = normalizedPath.startsWith('/item-monitor/history/') && itemMonitorHistoryDetail === null
  const valveHistory = normalizedPath === '/valve/history'
  const historyView = valveHistory || itemMonitorHistoryPath || itemMonitorHistoryDetail !== null
  const params = new URLSearchParams(location.search)
  let surface = defaults.surface
  let invalid = false
  if (normalizedPath === '/') surface = 'HOME'
  else if (normalizedPath === '/catalog') surface = 'CATALOG'
  else if (researchPath) surface = 'CATALOG'
  else if (normalizedPath === '/market') surface = 'MARKET'
  else if (normalizedPath === '/item-monitor' || itemMonitorHistoryPath || itemMonitorHistoryDetail !== null) surface = 'WATCHLIST'
  else if (normalizedPath === '/following') surface = 'FOLLOWING'
  else if (normalizedPath === '/portfolio') surface = 'PORTFOLIO'
  else if (legacyWatchlistPath) {
    const legacyView = oneValue(params, 'view')
    if (legacyView === 'personal') surface = 'FOLLOWING'
    else {
      surface = 'WATCHLIST'
      if (legacyView !== null && legacyView !== 'system') invalid = true
    }
  }
  else if (normalizedPath === '/trending') surface = 'TRENDING'
  else if (normalizedPath === '/tradeup') surface = 'TRADEUP'
  else if (normalizedPath === '/valve' || valveHistory) surface = 'VALVE'
  else if (normalizedPath !== '/') invalid = true
  if (malformedItemMonitorHistoryPath) invalid = true

  const allowedKeys = new Set(
    surface === 'CATALOG'
      ? ['lang', 'unit', 'kind', 'model', 'rarity', 'category', 'wear_tier', 'base', 'edition', 'wear', 'q', 'sort', 'snapshot', 'as_of', 'series_cursor', 'units_cursor', 'detail_cursor']
      : surface === 'MARKET'
        ? ['lang', 'publication', 'scope', 'view']
        : surface === 'WATCHLIST'
          ? legacyWatchlistPath
            ? ['lang', 'view', 'as_of', 'publication', 'unit']
            : itemMonitorHistoryPath || itemMonitorHistoryDetail !== null
              ? ['lang', 'publication']
              : ['lang', 'publication', 'unit']
          : surface === 'FOLLOWING'
            ? legacyWatchlistPath ? ['lang', 'view'] : ['lang']
          : surface === 'TRENDING'
            ? ['lang', 'as_of', 'publication', 'direction', 'item_kind', 'base_item_code', 'edition_kind', 'wear_tier']
          : ['lang'],
  )
  for (const key of params.keys()) {
    if (!allowedKeys.has(key)) invalid = true
  }

  const langValue = oneValue(params, 'lang')
  let lang = defaults.lang
  if (langValue === 'zh' || langValue === 'en') lang = langValue
  else if (langValue !== null) invalid = true

  if (surface === 'TRENDING') {
    const asOfValue = oneValue(params, 'as_of')
    const publicationValue = oneValue(params, 'publication')
    const directionValue = oneValue(params, 'direction')
    const itemKindValue = oneValue(params, 'item_kind')
    const baseItemCodeValue = oneValue(params, 'base_item_code')
    const editionKindValue = oneValue(params, 'edition_kind')
    const wearTierValue = oneValue(params, 'wear_tier')
    let trendingAsOf: string | null = null
    if (typeof asOfValue === 'string' && validDate(asOfValue)) trendingAsOf = asOfValue
    else if (asOfValue !== null) invalid = true
    let trendingPublicationId: string | null = null
    if (typeof publicationValue === 'string' && SHA256.test(publicationValue)) {
      trendingPublicationId = publicationValue
    } else if (publicationValue !== null) invalid = true
    let trendingDirection: TrendingDirection = 'GAINERS'
    if (directionValue === 'GAINERS' || directionValue === 'LOSERS') trendingDirection = directionValue
    else if (directionValue !== null) invalid = true
    const itemKind = typeof itemKindValue === 'string' && ITEM_KINDS.has(itemKindValue)
      ? itemKindValue as TrendingFilters['item_kind']
      : null
    if (itemKindValue !== null && itemKind === null) invalid = true
    const editionKind = typeof editionKindValue === 'string' && EDITIONS.has(editionKindValue)
      ? editionKindValue as TrendingFilters['edition_kind']
      : null
    if (editionKindValue !== null && editionKind === null) invalid = true
    const wearTier = typeof wearTierValue === 'string' && WEARS.has(wearTierValue)
      ? wearTierValue as TrendingFilters['wear_tier']
      : null
    if (wearTierValue !== null && wearTier === null) invalid = true
    const baseItemCode = typeof baseItemCodeValue === 'string' &&
      baseItemCodeValue.length <= 256 && baseItemCodeValue === baseItemCodeValue.trim() &&
      safeOpaqueValue(baseItemCodeValue)
      ? baseItemCodeValue
      : null
    if (baseItemCodeValue !== null && baseItemCode === null) invalid = true
    return Object.freeze({
      surface,
      lang,
      historyView,
      selectedUnitId: null,
      browseState: initialCatalogBrowseState(),
      catalogSnapshotId: null,
      researchAsOf: null,
      publicResultAsOf: null,
      publicPublicationId: null,
      publicWatchlistUnitId: null,
      trendingAsOf,
      trendingPublicationId,
      trendingDirection,
      trendingFilters: Object.freeze({
        item_kind: itemKind,
        base_item_code: baseItemCode,
        edition_kind: editionKind,
        wear_tier: wearTier,
      }),
      invalid,
    })
  }

  if (surface !== 'CATALOG') {
    const resultAsOfValue = oneValue(params, 'as_of')
    const publicationValue = oneValue(params, 'publication')
    const watchlistUnitValue = oneValue(params, 'unit')
    const marketScopeValue = oneValue(params, 'scope')
    const marketViewValue = surface === 'MARKET' ? oneValue(params, 'view') : null
    let publicResultAsOf: string | null = null
    if (
      resultAsOfValue !== null &&
      resultAsOfValue !== undefined &&
      UTC_MICROSECOND.test(resultAsOfValue) &&
      !Number.isNaN(Date.parse(resultAsOfValue))
    ) {
      publicResultAsOf = resultAsOfValue
    } else if (resultAsOfValue !== null) invalid = true
    let publicPublicationId: string | null = null
    if (
      publicationValue !== null &&
      publicationValue !== undefined &&
      SHA256.test(publicationValue)
    ) {
      publicPublicationId = publicationValue
    } else if (publicationValue !== null) invalid = true
    let publicWatchlistUnitId: string | null = null
    if (
      watchlistUnitValue !== null &&
      watchlistUnitValue !== undefined &&
      SHA256.test(watchlistUnitValue)
    ) {
      publicWatchlistUnitId = watchlistUnitValue
    } else if (watchlistUnitValue !== null) invalid = true
    if (itemMonitorHistoryDetail !== null) publicWatchlistUnitId = itemMonitorHistoryDetail[1] ?? null
    let marketScopeToken: string | null = null
    if (
      marketScopeValue !== null &&
      marketScopeValue !== undefined &&
      SHA256.test(marketScopeValue)
    ) {
      marketScopeToken = marketScopeValue
    } else if (marketScopeValue !== null) invalid = true
    let marketView: 'SECTORS' | null = null
    if (marketViewValue === 'sectors') marketView = 'SECTORS'
    else if (marketViewValue !== null) invalid = true
    if (surface !== 'WATCHLIST' && publicWatchlistUnitId !== null) {
      invalid = true
    }
    if (historyView && itemMonitorHistoryPath && publicWatchlistUnitId !== null) invalid = true
    if (surface !== 'WATCHLIST' && surface !== 'MARKET' && publicPublicationId !== null) invalid = true
    if (surface !== 'MARKET' && marketScopeToken !== null) invalid = true
    if (publicWatchlistUnitId !== null && publicPublicationId === null) invalid = true
    // A stable scope token may intentionally target the latest publication. The market page
    // resolves that request in two steps: latest overview, then the exact scope on that release.
    return Object.freeze({
      surface,
      lang,
      historyView,
      selectedUnitId: null,
      browseState: initialCatalogBrowseState(),
      catalogSnapshotId: null,
      researchAsOf: null,
      publicResultAsOf,
      publicPublicationId,
      publicWatchlistUnitId,
      marketScopeToken,
      marketView,
      trendingAsOf: null,
      trendingPublicationId: null,
      trendingDirection: 'GAINERS',
      trendingFilters: Object.freeze({
        item_kind: null,
        base_item_code: null,
        edition_kind: null,
        wear_tier: null,
      }),
      invalid,
    })
  }

  const kindValue = oneValue(params, 'kind')
  const modelValue = oneValue(params, 'model')
  const rarityValue = oneValue(params, 'rarity')
  const categoryValue = oneValue(params, 'category')
  // This global facet is intentionally separate from the per-series `wear` checkboxes.
  const wearTierValue = oneValue(params, 'wear_tier')
  const baseValue = oneValue(params, 'base')
  const unitValue = oneValue(params, 'unit')
  const queryValue = oneValue(params, 'q')
  const sortValue = oneValue(params, 'sort')
  const snapshotValue = oneValue(params, 'snapshot')
  const researchAsOfValue = oneValue(params, 'as_of')
  const seriesCursorValue = oneValue(params, 'series_cursor')
  const unitsCursorValue = oneValue(params, 'units_cursor')
  const detailCursorValue = oneValue(params, 'detail_cursor')
  const editionValues = params.getAll('edition')
  const wearValues = params.getAll('wear')

  let itemKind: CatalogBrowseState['itemKind'] = null
  if (kindValue !== null && kindValue !== undefined && ITEM_KINDS.has(kindValue)) {
    itemKind = kindValue as CatalogBrowseState['itemKind']
  } else if (kindValue !== null) invalid = true

  let equipmentModel: string | null = null
  if (modelValue !== null && modelValue !== undefined) {
    const model = equipmentModelById(modelValue)
    if (!model || model.itemKind !== itemKind) invalid = true
    else equipmentModel = model.id
  } else if (modelValue !== null) invalid = true

  let rarity: CatalogRarity | null = null
  if (typeof rarityValue === 'string' && isCatalogRarity(rarityValue)) rarity = rarityValue
  else if (rarityValue !== null) invalid = true
  let itemCategory: CatalogItemCategory | null = null
  if (typeof categoryValue === 'string' && isCatalogItemCategory(categoryValue)) itemCategory = categoryValue
  else if (categoryValue !== null) invalid = true
  let wearTier: CatalogWearTier | null = null
  if (typeof wearTierValue === 'string' && isCatalogWearTier(wearTierValue)) wearTier = wearTierValue
  else if (wearTierValue !== null) invalid = true

  let baseItemCode: string | null = null
  if (baseValue !== null && baseValue !== undefined && safeOpaqueValue(baseValue)) {
    baseItemCode = baseValue
  } else if (baseValue !== null) invalid = true
  if (baseItemCode !== null && itemKind === null) invalid = true

  const selectedEditions: EditionKind[] = []
  for (const edition of editionValues) {
    if (!EDITIONS.has(edition)) invalid = true
    else selectedEditions.push(edition as EditionKind)
  }
  const selectedWears: WearTier[] = []
  for (const wear of wearValues) {
    if (!WEARS.has(wear)) invalid = true
    else selectedWears.push(wear as WearTier)
  }
  if ((selectedEditions.length > 0 || selectedWears.length > 0) && baseItemCode === null) {
    invalid = true
  }

  let selectedUnitId: string | null = null
  if (unitValue !== null && unitValue !== undefined && safeOpaqueValue(unitValue)) {
    selectedUnitId = unitValue
  } else if (unitValue !== null) invalid = true
  if (researchPath && selectedUnitId === null) invalid = true

  let seriesQuery = ''
  if (queryValue !== null && queryValue !== undefined && safeSearchValue(queryValue)) {
    seriesQuery = queryValue
  } else if (queryValue !== null) invalid = true

  // Known legacy sort parameters remain readable, but product order is fixed and
  // the canonical URL drops them. Unknown or duplicate values still fail closed.
  if (sortValue !== null && (sortValue === undefined || !SORT_ORDERS.has(sortValue))) invalid = true

  let catalogSnapshotId: string | null = null
  if (snapshotValue !== null && snapshotValue !== undefined && SHA256.test(snapshotValue)) {
    catalogSnapshotId = snapshotValue
  } else if (snapshotValue !== null) invalid = true
  let researchAsOf: string | null = null
  if (
    researchAsOfValue !== null &&
    researchAsOfValue !== undefined &&
    UTC_MICROSECOND.test(researchAsOfValue) &&
    !Number.isNaN(Date.parse(researchAsOfValue))
  ) {
    researchAsOf = researchAsOfValue
  } else if (researchAsOfValue !== null) invalid = true
  if (researchAsOf !== null && selectedUnitId === null) invalid = true
  const cursor = (value: string | null | undefined): string | null => {
    if (value === null) return null
    if (value !== undefined && /^[A-Za-z0-9_-]{1,512}$/u.test(value)) return value
    invalid = true
    return null
  }
  const catalogSeriesCursor = cursor(seriesCursorValue)
  const catalogUnitsCursor = cursor(unitsCursorValue)
  const catalogDetailCursor = cursor(detailCursorValue)
  if (catalogSeriesCursor !== null && equipmentModel === null) invalid = true
  if (catalogUnitsCursor !== null && baseItemCode === null) invalid = true
  if (catalogDetailCursor !== null && selectedUnitId === null) invalid = true
  if (
    catalogSnapshotId === null &&
    (catalogSeriesCursor !== null || catalogUnitsCursor !== null || catalogDetailCursor !== null)
  ) invalid = true

  return Object.freeze({
    surface,
    lang,
    historyView,
    selectedUnitId,
    catalogSnapshotId,
    researchAsOf,
    publicResultAsOf: null,
    publicPublicationId: null,
    publicWatchlistUnitId: null,
    trendingAsOf: null,
    trendingPublicationId: null,
    trendingDirection: 'GAINERS',
    trendingFilters: Object.freeze({
      item_kind: null,
      base_item_code: null,
      edition_kind: null,
      wear_tier: null,
    }),
    browseState: Object.freeze({
      itemKind,
      equipmentModel,
      rarity,
      itemCategory,
      wearTier,
      baseItemCode,
      selectedEditions: Object.freeze(uniqueValues(selectedEditions)),
      selectedWears: Object.freeze(uniqueValues(selectedWears)),
      seriesQuery,
    }),
    invalid,
  })
}

export function publicRouteHref(route: PublicRouteState): string {
  const path = route.surface === 'CATALOG' && route.selectedUnitId !== null
    ? PUBLIC_RESEARCH_PATH
    : route.surface === 'VALVE' && route.historyView
      ? '/valve/history'
      : route.surface === 'WATCHLIST' && route.historyView
        ? route.publicWatchlistUnitId
          ? `/item-monitor/history/${route.publicWatchlistUnitId}`
          : '/item-monitor/history'
        : PUBLIC_SURFACE_PATH[route.surface]
  const params = new URLSearchParams()
  if (route.lang === 'en') params.set('lang', 'en')
  if (route.surface === 'CATALOG') {
    if (route.catalogSnapshotId) params.set('snapshot', route.catalogSnapshotId)
    if (route.selectedUnitId !== null) params.set('unit', route.selectedUnitId)
    if (route.selectedUnitId !== null && route.researchAsOf) {
      params.set('as_of', route.researchAsOf)
    }
    if (route.browseState.itemKind !== null) params.set('kind', route.browseState.itemKind)
    if (route.browseState.equipmentModel !== null) params.set('model', route.browseState.equipmentModel)
    if (route.browseState.rarity !== null) params.set('rarity', route.browseState.rarity)
    if (route.browseState.itemCategory !== null) params.set('category', route.browseState.itemCategory)
    if (route.browseState.wearTier !== null) params.set('wear_tier', route.browseState.wearTier)
    if (route.browseState.baseItemCode !== null) {
      params.set('base', route.browseState.baseItemCode)
    }
    for (const edition of route.browseState.selectedEditions) {
      params.append('edition', edition)
    }
    for (const wear of route.browseState.selectedWears) params.append('wear', wear)
    if (route.browseState.seriesQuery !== '') params.set('q', route.browseState.seriesQuery)
  } else if (route.surface === 'MARKET') {
    if (route.publicPublicationId) params.set('publication', route.publicPublicationId)
    if (route.marketScopeToken) params.set('scope', route.marketScopeToken)
    // A scope already opens the sector tab, so the explicit view is only kept without one.
    else if (route.marketView === 'SECTORS') params.set('view', 'sectors')
  } else if (route.surface === 'WATCHLIST') {
    if (route.publicPublicationId) params.set('publication', route.publicPublicationId)
    if (!route.historyView && route.publicWatchlistUnitId) params.set('unit', route.publicWatchlistUnitId)
  } else if (route.surface === 'TRENDING') {
    if (route.trendingAsOf) params.set('as_of', route.trendingAsOf)
    if (route.trendingPublicationId) params.set('publication', route.trendingPublicationId)
    if (route.trendingDirection === 'LOSERS') params.set('direction', 'LOSERS')
    if (route.trendingFilters.item_kind) params.set('item_kind', route.trendingFilters.item_kind)
    if (route.trendingFilters.base_item_code) params.set('base_item_code', route.trendingFilters.base_item_code)
    if (route.trendingFilters.edition_kind) params.set('edition_kind', route.trendingFilters.edition_kind)
    if (route.trendingFilters.wear_tier) params.set('wear_tier', route.trendingFilters.wear_tier)
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export type PublicDetailOrigin = 'CATALOG' | 'FOLLOWING' | 'PORTFOLIO'

export type PublicHistoryState = Readonly<{
  cs2Public: true
  returnToCatalog: boolean
  detailOrigin?: PublicDetailOrigin | null
}>

export function publicHistoryState(
  returnToCatalog = false,
  detailOrigin: PublicDetailOrigin | null = returnToCatalog ? 'CATALOG' : null,
): PublicHistoryState {
  return Object.freeze({ cs2Public: true, returnToCatalog, detailOrigin })
}

export function isPublicHistoryState(value: unknown): value is PublicHistoryState {
  if (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).cs2Public === true &&
    typeof (value as Record<string, unknown>).returnToCatalog === 'boolean'
  ) {
    const origin = (value as Record<string, unknown>).detailOrigin
    return origin === undefined || origin === null || origin === 'CATALOG' || origin === 'FOLLOWING' || origin === 'PORTFOLIO'
  }
  return false
}
