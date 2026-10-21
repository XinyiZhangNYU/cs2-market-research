import type { PriceDisplayGateway, PriceReadOptions, PriceRequest, PriceTransportResponse } from '../../src/api/PriceDisplayApi'
import { BoundedJsonFetchError } from '../../src/api/boundedJsonFetch'
import type { PriceCatalogBinding, PriceDocument, PriceQuote, PriceSnapshot } from '../../src/wire/priceDisplayApiTypes'
import { comparePriceOrder, decodePriceCursor, encodePriceCursor, priceEvent, priceOrder } from '../../src/wire/priceDisplayPrimitives'
import { catalogFixture, historyFixture, historyNextFixture, historySnapshotsFixture, itemFixture, resealPrice, snapshotsFixture, type MutablePrice } from './priceWireFixtures'

// Pure, explicitly synthetic gateway. No source data, URL, credentials or fetch.
export class PriceWireTestGateway implements PriceDisplayGateway {
  readonly kind = 'SYNTHETIC_PRICE_WIRE_TEST'
  readonly requests: PriceRequest[] = []
  readonly signals: (AbortSignal | undefined)[] = []
  constructor(readonly options: {
    catalog?: PriceCatalogBinding
    emptySnapshots?: boolean
    failure?: boolean
    invalidDocument?: boolean
    noFx?: boolean
    currentEmpty?: boolean
    crossPageItem?: boolean
    crossKindItem?: boolean
  } = {}) {}

  descriptor(kind: 'CURRENT' | 'HISTORY'): MutablePrice<PriceSnapshot> {
    const descriptor = kind === 'CURRENT' ? itemFixture().snapshot : historyFixture().snapshot
    const catalog = this.options.catalog ?? catalogFixture
    Object.assign(descriptor, { catalog_snapshot_id: catalog.snapshot_id, catalog_as_of: catalog.as_of, catalog_available_at: catalog.available_at })
    return descriptor
  }
  async read(request: PriceRequest, options: PriceReadOptions = {}): Promise<PriceTransportResponse> {
    this.requests.push(structuredClone(request))
    this.signals.push(options.signal)
    if (this.options.failure) throw new BoundedJsonFetchError('NETWORK_UNAVAILABLE')
    let document: MutablePrice<PriceDocument>
    if (request.kind === 'PRICE_SNAPSHOT_LIST') {
      const result = request.query.kind === 'CURRENT' ? snapshotsFixture() : historySnapshotsFixture()
      result.query = structuredClone(request.query)
      result.items = this.options.emptySnapshots ? [] : [this.descriptor(request.query.kind)]
      result.pagination.page_size = request.query.page_size
      document = resealPrice(result)
    } else if (request.kind === 'PRICE_ITEM') {
      const result = itemFixture()
      result.query = structuredClone(request.query)
      result.snapshot = this.descriptor('CURRENT')
      for (const quote of result.items) {
        quote.analysis_unit_id = request.query.analysis_unit_id
        if (this.options.noFx && quote.source_price !== null) {
          quote.fx = null
          const currency = quote.source_price.currency === 'USD' ? 'CNY' : 'USD'
          quote.amounts[currency] = { status: 'UNAVAILABLE', currency, amount: null, scale: null, basis: null, rounding: null, reason: 'NO_ELIGIBLE_FX' }
        }
      }
      if (this.options.currentEmpty) result.items = []
      document = resealPrice(result)
    } else {
      const result = historyFixture()
      result.snapshot = this.descriptor('HISTORY')
      result.query = structuredClone(request.query)
      const all = [...historyFixture().items, ...historyNextFixture().items]
      for (const quote of all) {
        quote.analysis_unit_id = request.query.analysis_unit_id
        if (this.options.crossKindItem) quote.item_id = '42'
      }
      // Seal IDs before filtering/sorting/constructing a cursor for the new unit.
      result.items = all
      resealPrice(result)
      const after = decodePriceCursor(request.query)
      const selected = all.filter((quote) => {
        const event = priceEvent(quote)!
        return request.query.from <= event && event < request.query.to &&
          (request.query.quote_kind === null || request.query.quote_kind === quote.quote_kind) &&
          (request.query.quote_origin === null || request.query.quote_origin === quote.source.quote_origin) &&
          (request.query.logical_market === null || request.query.logical_market === quote.source.logical_market) &&
          (after === null || comparePriceOrder(priceOrder(quote), priceOrder(after)) > 0)
      }).sort((a: PriceQuote, b: PriceQuote) => comparePriceOrder(priceOrder(a), priceOrder(b)))
      result.items = selected.slice(0, Math.min(2, request.query.page_size))
      if (this.options.crossPageItem && request.query.cursor !== null) for (const quote of result.items) quote.item_id = '42'
      resealPrice(result)
      result.pagination = { page_size: request.query.page_size, next_cursor: selected.length > result.items.length ? encodePriceCursor(request.query, result.items.at(-1)!) : null }
      document = resealPrice(result)
    }
    if (this.options.invalidDocument) document.document_hash = '0'.repeat(64)
    return { payload: document, httpStatus: 200, etag: `"${document.document_hash}"` }
  }
}
