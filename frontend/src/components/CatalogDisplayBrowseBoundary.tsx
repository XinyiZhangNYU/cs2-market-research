import { useEffect, useState } from 'react'
import {
  CatalogDisplayApi,
  type CatalogDisplayGateway,
} from '../api/CatalogDisplayApi'
import { CatalogDisplayTransportError } from '../api/HttpCatalogDisplayGateway'
import {
  CatalogDisplayReadUnavailable,
  LOCAL_CATALOG_DISPLAY_PRESENTATION,
  toCatalogDisplayBrowseView,
  type CatalogDisplayBrowseView,
  type CatalogDisplayPresentation,
} from '../adapter/catalogDisplayViewModel'
import {
  reconcileCatalogBrowseState,
  type CatalogBrowseState,
} from '../contract/catalogBrowse'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { useAsync } from '../hooks/useAsync'
import { ItemBrowsePage } from '../pages/ItemBrowsePage'
import { compareCodePoints } from '../wire/canonical'
import { CatalogPitContextBar, type CatalogPitContext } from './CatalogPitContextBar'
const UTC_MICROSECOND =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$/

function assertExplicitPitInstant(value: string, field: string): void {
  if (!UTC_MICROSECOND.test(value) || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${field} must be an explicit canonical UTC instant`)
  }
}

function sameState(left: CatalogBrowseState, right: CatalogBrowseState): boolean {
  return (
    left.itemKind === right.itemKind &&
    left.equipmentModel === right.equipmentModel &&
    left.rarity === right.rarity &&
    left.itemCategory === right.itemCategory &&
    left.wearTier === right.wearTier &&
    left.baseItemCode === right.baseItemCode &&
    left.selectedEditions.join('\u0000') === right.selectedEditions.join('\u0000') &&
    left.selectedWears.join('\u0000') === right.selectedWears.join('\u0000') &&
    left.seriesQuery === right.seriesQuery
  )
}

export class CatalogDisplaySnapshotUnavailable extends Error {
  readonly code = 'NO_AVAILABLE_SNAPSHOT' as const
  readonly retryable = false

  constructor() {
    super('catalog display snapshot inventory has no descriptor for the requested cutoffs')
    this.name = 'CatalogDisplaySnapshotUnavailable'
  }
}

export type CatalogDisplayLoadProgress = Readonly<{
  loadedMembers: number
  totalMembers: number | null
  loadedPages: number
}>

export type CatalogDisplayLoadOptions = Readonly<{
  signal?: AbortSignal
  onProgress?: (progress: CatalogDisplayLoadProgress) => void
}>

export async function loadCompleteCatalogDisplaySnapshot(
  gateway: CatalogDisplayGateway,
  queryAsOf: string,
  knownAt: string,
  presentation: CatalogDisplayPresentation = LOCAL_CATALOG_DISPLAY_PRESENTATION,
  options: CatalogDisplayLoadOptions = {},
): Promise<CatalogDisplayBrowseView> {
  assertExplicitPitInstant(queryAsOf, 'queryAsOf')
  assertExplicitPitInstant(knownAt, 'knownAt')
  const api = new CatalogDisplayApi(gateway)
  const inventory = await api.listSnapshots({
    query: {
      known_at: knownAt,
      page_size: 200,
      query_as_of: queryAsOf,
      sort: 'AS_OF_DESC',
    },
    cursor: null,
  }, { signal: options.signal })
  if (inventory.response_kind === 'ERROR') {
    throw new CatalogDisplayReadUnavailable(
      inventory.error.code,
      inventory.error.retryable,
      inventory.error.http_status,
    )
  }
  const descriptor = inventory.members[0]
  if (!descriptor) throw new CatalogDisplaySnapshotUnavailable()
  options.onProgress?.(Object.freeze({
    loadedMembers: 0,
    totalMembers: descriptor.member_count,
    loadedPages: 0,
  }))

  const rows: CatalogDisplayBrowseView['rows'][number][] = []
  const items: CatalogDisplayBrowseView['items'][number][] = []
  const seenIdentifiers = new Set<string>()
  const seenCursors = new Set<string>()
  let cursor: string | null = null
  let loadedPages = 0

  while (true) {
    const response = await api.list({
      query: {
        analysis_unit_kind: null,
        as_of: descriptor.as_of,
        base_item_code: null,
        edition_kind: null,
        item_kind: null,
        known_at: descriptor.available_at,
        page_size: 200,
        sort: 'ANALYSIS_UNIT_ID_ASC',
        wear_tier: null,
      },
      cursor,
    }, { signal: options.signal })
    const page = toCatalogDisplayBrowseView(response, presentation)
    for (let index = 0; index < page.rows.length; index += 1) {
      const row = page.rows[index]
      const item = page.items[index]
      if (!item || item.analysis_unit_id !== row.analysis_unit_id) {
        throw new TypeError('catalog display row and display item accounting disagree')
      }
      if (seenIdentifiers.has(row.analysis_unit_id)) {
        throw new TypeError('catalog display pagination repeated an analysis_unit_id')
      }
      const previous = rows.at(-1)
      if (
        previous &&
        compareCodePoints(previous.analysis_unit_id, row.analysis_unit_id) >= 0
      ) {
        throw new TypeError('catalog display pagination broke strict code-point order')
      }
      seenIdentifiers.add(row.analysis_unit_id)
      rows.push(row)
      items.push(item)
    }
    loadedPages += 1
    options.onProgress?.(Object.freeze({
      loadedMembers: rows.length,
      totalMembers: descriptor.member_count,
      loadedPages,
    }))
    if (page.next_cursor === null) break
    if (seenCursors.has(page.next_cursor)) {
      throw new TypeError('catalog display pagination repeated a cursor')
    }
    seenCursors.add(page.next_cursor)
    cursor = page.next_cursor
  }

  if (rows.length !== descriptor.member_count) {
    throw new TypeError(
      'catalog display snapshot member count does not match the sealed descriptor',
    )
  }
  if (items.some((item) => item.catalog_version !== descriptor.catalog_version)) {
    throw new TypeError(
      'catalog display snapshot members do not match the descriptor catalog version',
    )
  }

  return Object.freeze({
    data_environment: presentation.data_environment,
    channel: presentation.channel,
    query_as_of: descriptor.as_of,
    query_known_at: descriptor.available_at,
    snapshot: Object.freeze({
      snapshot_id: descriptor.snapshot_id,
      catalog_version: descriptor.catalog_version,
      available_at: descriptor.available_at,
      member_count: descriptor.member_count,
      member_set_hash: descriptor.member_set_hash,
    }),
    rows: Object.freeze(rows),
    items: Object.freeze(items),
    next_cursor: null,
  })
}

/** Internal catalog diagnostics. The public entry imports its progressive consumer directly. */
export function CatalogDisplayBrowseBoundary({
  gateway,
  queryAsOf,
  knownAt,
  state,
  onChange,
  onBackToWatchList,
  onOpenUnit,
  reloadToken = 0,
  presentation = LOCAL_CATALOG_DISPLAY_PRESENTATION,
}: {
  gateway: CatalogDisplayGateway
  queryAsOf: string
  knownAt: string
  state: CatalogBrowseState
  onChange: (next: CatalogBrowseState) => void
  onBackToWatchList?: () => void
  onOpenUnit?: (analysisUnitId: string) => void
  reloadToken?: number
  presentation?: CatalogDisplayPresentation
}) {
  const lang = useLang()
  const [attempt, setAttempt] = useState(0)
  const pitContext: CatalogPitContext = {
    data_environment: presentation.data_environment,
    channel: presentation.channel,
    query_as_of: queryAsOf,
    query_known_at: knownAt,
    snapshot: null,
  }
  const read = useAsync(
    (signal) => loadCompleteCatalogDisplaySnapshot(
      gateway, queryAsOf, knownAt, presentation, { signal },
    ),
    [gateway, queryAsOf, knownAt, presentation, attempt, reloadToken],
  )

  useEffect(() => {
    if (read.status !== 'ready') return
    const reconciled = reconcileCatalogBrowseState(state, read.value.rows)
    if (!sameState(state, reconciled)) onChange(reconciled)
  }, [onChange, read, state])

  if (read.status === 'loading') {
    return (
      <section className="page" data-testid="catalog-real-loading">
        <CatalogPitContextBar context={pitContext} readState="LOADING" presentation="TECHNICAL" />
        <p className="loading">{t('catalogBrowseRealLoading', lang)}</p>
      </section>
    )
  }
  if (read.status === 'error') {
    const failure =
      read.error instanceof CatalogDisplayTransportError
        ? { code: read.error.code, retryable: read.error.retryable }
        : read.error instanceof CatalogDisplayReadUnavailable
          ? { code: read.error.code, retryable: read.error.retryable }
          : read.error instanceof CatalogDisplaySnapshotUnavailable
            ? { code: read.error.code, retryable: read.error.retryable }
            : { code: 'CONSUMPTION_BOUNDARY_REJECTED', retryable: false }
    return (
      <section className="page" data-testid="catalog-real-error" role="alert">
        <CatalogPitContextBar context={pitContext} readState="ERROR" presentation="TECHNICAL" />
        <p className="error">{t('catalogBrowseRealError', lang)}</p>
        <div className="catalog-browse__error-code">
          <code>{failure.code}</code>
          <code>retryable={String(failure.retryable)}</code>
        </div>
        <div className="catalog-browse__error-actions">
          {failure.retryable ? (
            <button type="button" data-testid="catalog-real-retry" onClick={() => setAttempt((value) => value + 1)}>
              {t('catalogBrowseRetry', lang)}
            </button>
          ) : null}
          {onBackToWatchList ? (
            <button type="button" onClick={onBackToWatchList}>{t('returnToWatchList', lang)}</button>
          ) : null}
        </div>
      </section>
    )
  }
  return (
    <ItemBrowsePage
      state={state}
      onChange={onChange}
      onBackToWatchList={onBackToWatchList}
      projectionRows={read.value.rows}
      displayItems={read.value.items}
      pitContext={read.value}
      onOpenUnit={onOpenUnit}
      presentation="TECHNICAL"
    />
  )
}
