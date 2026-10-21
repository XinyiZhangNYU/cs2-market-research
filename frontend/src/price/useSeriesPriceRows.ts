import { useEffect, useMemo, useState } from 'react'
import { PriceDisplayApi, requirePriceSuccess, type PriceDisplayGateway } from '../api/PriceDisplayApi'
import { toPricePanelState } from '../adapter/priceDisplayViewModel'
import type { PriceCatalogBinding, PriceSnapshot } from '../wire/priceDisplayApiTypes'
import { currentPriceSnapshot, type PreparedPriceDiscovery } from './priceDisplayRuntime'
import type { PriceQuoteView } from './pricePresentation'

export type SeriesPriceCell = Readonly<
  | { status: 'LOADING' }
  | { status: 'READY'; rows: readonly PriceQuoteView[] }
  | { status: 'UNAVAILABLE' }
>

type ReadyCell = Extract<SeriesPriceCell, { status: 'READY' }>

/** Bounded so a series page never opens more than a few price reads at once. */
export const SERIES_PRICE_CONCURRENCY = 3
const LOADING: SeriesPriceCell = Object.freeze({ status: 'LOADING' })
const UNAVAILABLE: SeriesPriceCell = Object.freeze({ status: 'UNAVAILABLE' })

/** Last READY rows per gateway and PIT scope, used only as the placeholder while the same
 * cell revalidates after a remount or resume, however old they are (the data is published
 * daily). They are shown unmarked until that cell's own read settles, after the snapshot read
 * and behind the other queued cells, each read bounded by its transport deadline: new rows
 * replace them, and a failed or withdrawn revalidation evicts the entry and shows UNAVAILABLE.
 * Every mount still revalidates every cell. */
const SERIES_PRICE_ROW_CACHE_LIMIT = 400
const lastReadyRows = new WeakMap<PriceDisplayGateway, Map<string, ReadyCell>>()

function rowCache(gateway: PriceDisplayGateway): Map<string, ReadyCell> {
  let cache = lastReadyRows.get(gateway)
  if (cache === undefined) {
    cache = new Map()
    lastReadyRows.set(gateway, cache)
  }
  return cache
}

/** The cells on screen, with the gateway, PIT scope and units they were set for. */
type Shown = Readonly<{
  gateway: PriceDisplayGateway | undefined
  scope: string
  idsKey: string
  reuse: boolean
  cells: ReadonlyMap<string, SeriesPriceCell>
}>
const NO_CELLS: ReadonlyMap<string, SeriesPriceCell> = new Map()

function cellKey(scope: string, id: string): string {
  return `${scope}\u0000${id}`
}

function remember(cache: Map<string, ReadyCell>, key: string, cell: ReadyCell) {
  cache.delete(key)
  cache.set(key, cell)
  while (cache.size > SERIES_PRICE_ROW_CACHE_LIMIT) cache.delete(cache.keys().next().value!)
}

export function useSeriesPriceRows({
  gateway,
  catalog,
  unitIds,
  queryAsOf,
  knownAt,
  enabled,
  discovery,
  reuse = true,
}: {
  gateway: PriceDisplayGateway | undefined
  catalog: PriceCatalogBinding | null
  unitIds: readonly string[]
  queryAsOf: string
  knownAt: string
  enabled: boolean
  discovery?: PreparedPriceDiscovery
  reuse?: boolean
}): ReadonlyMap<string, SeriesPriceCell> {
  const idsKey = unitIds.join('\u0000')
  const scope = catalog ? `${catalog.snapshot_id}\u0000${catalog.as_of}\u0000${catalog.available_at}\u0000${queryAsOf}\u0000${knownAt}` : ''
  const ids = useMemo(() => (idsKey === '' ? [] : idsKey.split('\u0000')), [idsKey])
  const [shown, setShown] = useState<Shown>(() => ({ gateway, scope, idsKey, reuse, cells: NO_CELLS }))

  useEffect(() => {
    const setCells = (cells: ReadonlyMap<string, SeriesPriceCell>) => setShown({ gateway, scope, idsKey, reuse, cells })
    if (!gateway || !catalog || ids.length === 0) {
      setCells(new Map())
      return
    }
    // Paused (hidden or waiting on a module): keep what is shown; the cleanup aborted reads.
    if (!enabled) return
    const controller = new AbortController()
    const { signal } = controller
    const cache = rowCache(gateway)
    const keyOf = (id: string) => cellKey(scope, id)
    const initial = new Map<string, SeriesPriceCell>()
    for (const id of ids) initial.set(id, (reuse ? cache.get(keyOf(id)) : undefined) ?? LOADING)
    setCells(initial)

    const settle = (id: string, cell: SeriesPriceCell) => {
      if (signal.aborted) return
      // Decoded price reuse is gateway/PIT/TTL-bound in PriceDisplayApi; the projected rows
      // kept here are a placeholder only until this revalidation settles.
      if (reuse && cell.status === 'READY') remember(cache, keyOf(id), cell)
      else cache.delete(keyOf(id))
      setShown((current) => {
        const next = new Map(current.cells)
        next.set(id, cell)
        return { ...current, cells: next }
      })
    }

    void (async () => {
      let descriptor: PriceSnapshot
      try {
        descriptor = await currentPriceSnapshot(gateway, { analysisUnitId: ids[0]!, catalog, queryAsOf, knownAt }, { signal, reuse }, reuse ? discovery : undefined)
      } catch {
        if (signal.aborted) return
        // The publication itself is unavailable: no cell can carry a price, cached or not.
        for (const id of ids) cache.delete(keyOf(id))
        setCells(new Map(ids.map((id) => [id, UNAVAILABLE])))
        return
      }
      if (signal.aborted) return
      const api = new PriceDisplayApi(gateway)
      const queue = [...ids]
      const worker = async () => {
        for (let id = queue.shift(); id !== undefined && !signal.aborted; id = queue.shift()) {
          try {
            const response = requirePriceSuccess(await api.item({
              analysis_unit_id: id,
              snapshot_id: descriptor.snapshot_id,
              as_of: descriptor.market_as_of,
              known_at: knownAt,
            }, descriptor, catalog, { signal, reuse }))
            settle(id, Object.freeze({ status: 'READY', rows: toPricePanelState(response).rows }))
          } catch {
            settle(id, UNAVAILABLE)
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(SERIES_PRICE_CONCURRENCY, queue.length) }, worker))
    })()

    return () => controller.abort()
    // `catalog` is represented by `scope`; the object identity may change per render.
  }, [enabled, gateway, ids, scope, discovery, reuse])

  if (!reuse && !enabled) return NO_CELLS
  if (shown.gateway === gateway && shown.scope === scope && shown.idsKey === idsKey && shown.reuse === reuse) return shown.cells
  // The gateway, PIT scope or units changed and their effect has not run yet (or the page is
  // paused): show what that effect would show first, never the cells of the previous identity.
  if (!gateway || !catalog || ids.length === 0) return NO_CELLS
  const cache = reuse ? lastReadyRows.get(gateway) : undefined
  return new Map(ids.map((id) => [id, cache?.get(cellKey(scope, id)) ?? LOADING]))
}
