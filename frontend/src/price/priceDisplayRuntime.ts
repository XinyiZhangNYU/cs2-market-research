import { BoundedJsonFetchError } from '../api/boundedJsonFetch'
import { PriceDisplayApi, PRICE_MEMORY_TTL_MS, PriceReadUnavailable, requirePriceSuccess, type PriceDisplayGateway, type PriceReadOptions } from '../api/PriceDisplayApi'
import type { PriceCatalogBinding, PriceHistoryQuery, PriceItem, PriceSnapshot, PriceSnapshotKind, PriceSnapshotQuery } from '../wire/priceDisplayApiTypes'
import { PriceDisplayValidationError, priceDateDay, priceInstantMicros } from '../wire/priceDisplayPrimitives'
import type { PricePanelState } from './pricePresentation'
import { priceDiscoveryKey, type PreparedPriceDiscovery } from './preparedPriceDiscovery'
export { preparePriceDiscovery, type PreparedPriceDiscovery } from './preparedPriceDiscovery'

export type PriceReadContext = Readonly<{
  analysisUnitId: string
  catalog: PriceCatalogBinding
  queryAsOf: string
  knownAt: string
}>

function snapshotDiscoveryQuery(context: PriceReadContext, kind: PriceSnapshotKind): PriceSnapshotQuery {
  return {
    query_as_of: context.queryAsOf, known_at: context.knownAt,
    catalog_snapshot_id: context.catalog.snapshot_id, kind, page_size: 20, sort: 'MARKET_AS_OF_DESC',
  }
}

export async function currentPriceSnapshot(gateway: PriceDisplayGateway, context: PriceReadContext, options: PriceReadOptions = {}, prepared?: PreparedPriceDiscovery): Promise<PriceSnapshot> {
  options.signal?.throwIfAborted()
  if (options.reuse === false || !prepared || prepared.gateway !== gateway || prepared.key !== priceDiscoveryKey(context) ||
      (prepared.loadedAt !== null && (Date.now() < prepared.loadedAt || Date.now() - prepared.loadedAt >= PRICE_MEMORY_TTL_MS))) {
    return discoverPriceSnapshot(gateway, context, 'CURRENT', options)
  }
  const descriptor = await new Promise<PriceSnapshot>((resolve, reject) => {
    const signal = options.signal
    const abort = () => { signal?.removeEventListener('abort', abort); reject(signal?.reason) }
    signal?.addEventListener('abort', abort, { once: true })
    if (signal?.aborted) { abort(); return }
    prepared.promise.then(
      (value) => { signal?.removeEventListener('abort', abort); if (signal?.aborted) reject(signal.reason); else resolve(value) },
      (error) => { signal?.removeEventListener('abort', abort); reject(error) },
    )
  })
  options.signal?.throwIfAborted()
  // Check after the asynchronous handoff as well. A preparation can have read
  // a near-expiry cached document or waited until its original lease expired.
  if (!new PriceDisplayApi(gateway).isSnapshotFresh(snapshotDiscoveryQuery(context, 'CURRENT'), context.catalog, descriptor)) {
    return discoverPriceSnapshot(gateway, context, 'CURRENT', options)
  }
  return descriptor
}

export async function discoverPriceSnapshot(gateway: PriceDisplayGateway, context: PriceReadContext, kind: PriceSnapshotKind, options: PriceReadOptions = {}): Promise<PriceSnapshot> {
  const api = new PriceDisplayApi(gateway)
  const inventory = requirePriceSuccess(await api.snapshots(snapshotDiscoveryQuery(context, kind), context.catalog, options))
  const descriptor = inventory.items[0]
  if (!descriptor) throw new PriceReadUnavailable('NO_COMPATIBLE_SNAPSHOT')
  return descriptor
}

export async function loadCurrentPrice(gateway: PriceDisplayGateway, context: PriceReadContext, options: PriceReadOptions = {}, prepared?: PreparedPriceDiscovery): Promise<PriceItem> {
  const descriptor = await currentPriceSnapshot(gateway, context, options, prepared)
  options.signal?.throwIfAborted()
  return requirePriceSuccess(await new PriceDisplayApi(gateway).item({
    analysis_unit_id: context.analysisUnitId, snapshot_id: descriptor.snapshot_id,
    as_of: descriptor.market_as_of, known_at: context.knownAt,
  }, descriptor, context.catalog, options))
}

export function priceFailureState(error: unknown): Extract<PricePanelState, { status: 'UNAVAILABLE' }> {
  if (error instanceof PriceReadUnavailable) return { status: 'UNAVAILABLE', reason: error.code === 'NO_COMPATIBLE_SNAPSHOT' ? error.code : error.code === 'RECORD_CORRUPT' ? 'RECORD_REJECTED' : 'CONTRACT_UNAVAILABLE' }
  if (error instanceof BoundedJsonFetchError) {
    if (['NETWORK_UNAVAILABLE', 'REQUEST_TIMEOUT'].includes(error.code)) return { status: 'UNAVAILABLE', reason: 'NETWORK_UNAVAILABLE' }
    // A non-2xx response without the JSON envelope (an edge or origin error page) is the price
    // service being unavailable, the same state as a decoded BACKEND_UNAVAILABLE; only a 2xx
    // response that fails the wire checks is a rejected record.
    if (error.httpStatus !== null && (error.httpStatus < 200 || error.httpStatus > 299)) return { status: 'UNAVAILABLE', reason: 'CONTRACT_UNAVAILABLE' }
    return { status: 'UNAVAILABLE', reason: 'RECORD_REJECTED' }
  }
  if (error instanceof PriceDisplayValidationError) return { status: 'UNAVAILABLE', reason: 'RECORD_REJECTED' }
  return { status: 'UNAVAILABLE', reason: 'CONTRACT_UNAVAILABLE' }
}

export type PriceHistoryRange = Readonly<{
  fromDate: string
  throughDate: string
  source: 'ALL' | 'market_a' | 'market_c' | 'market_b' | 'PROVIDER_AGGREGATE'
  quoteKind: 'ALL' | 'ASK' | 'BID'
}>
function dateFromDay(day: number): string { return new Date(day * 86_400_000).toISOString().slice(0, 10) }
export function initialPriceHistoryRange(snapshot: PriceSnapshot): PriceHistoryRange {
  const last = priceDateDay(snapshot.market_as_of.slice(0, 10))
  return { fromDate: dateFromDay(Math.max(priceDateDay('0001-01-01'), last - 29)), throughDate: dateFromDay(last), source: 'ALL', quoteKind: 'ALL' }
}
export function priceHistoryQuery(context: PriceReadContext, snapshot: PriceSnapshot, range: PriceHistoryRange): PriceHistoryQuery {
  const from = `${range.fromDate}T00:00:00.000000Z`
  const to = `${dateFromDay(priceDateDay(range.throughDate) + 1)}T00:00:00.000000Z`
  const duration = priceInstantMicros(to) - priceInstantMicros(from)
  if (duration <= 0n || duration > 366n * 86_400_000_000n) throw new PriceDisplayValidationError()
  return {
    analysis_unit_id: context.analysisUnitId, snapshot_id: snapshot.snapshot_id,
    as_of: snapshot.market_as_of, known_at: context.knownAt, from, to,
    quote_origin: range.source === 'ALL' ? null : range.source === 'PROVIDER_AGGREGATE' ? 'PROVIDER_AGGREGATE' : 'SOURCE_QUOTE',
    logical_market: range.source === 'ALL' || range.source === 'PROVIDER_AGGREGATE' ? null : range.source,
    quote_kind: range.quoteKind === 'ALL' ? null : range.quoteKind,
    page_size: 100, cursor: null, sort: 'EVENT_SOURCE_QUOTE_ID_ASC',
  }
}
