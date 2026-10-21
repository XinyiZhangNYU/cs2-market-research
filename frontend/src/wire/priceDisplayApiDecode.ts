import { canonicalHash, canonicalJsonText, compareCodePoints } from './canonical'
import { validatePriceDisplayApiResponse } from './generated/priceDisplayApiValidator.js'
import { validatePriceAmounts } from './priceDisplayAmountValidation'
import {
  PriceDisplayValidationError, comparePriceOrder, decodePriceCursor,
  encodePriceCursor, priceAssert, priceEvent, priceExactFields, priceIdentifier,
  priceInstantMicros, priceOrder, priceSourceKey, validatePriceQuery,
} from './priceDisplayPrimitives'
import type {
  PriceCatalogBinding, PriceDocument, PriceQuery, PriceQuote,
  PriceResponseKind, PriceSnapshot,
} from './priceDisplayApiTypes'

const decoded = new WeakSet<object>()
export type PriceDecodeBinding = Readonly<{
  query?: PriceQuery
  kind?: PriceResponseKind
  catalog?: PriceCatalogBinding
  snapshot?: PriceSnapshot
  itemId?: string
  httpStatus?: number
  etag?: string
}>

function hashWithout(value: object, omitted: string): string {
  return canonicalHash(Object.fromEntries(Object.entries(value).filter(([key]) => key !== omitted)))
}
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}
function validateCatalogPublicationBinding(snapshot: PriceSnapshot, catalog: PriceCatalogBinding, knownAt: string): void {
  priceExactFields(catalog, ['snapshot_id', 'as_of', 'available_at'])
  priceInstantMicros(catalog.as_of)
  priceInstantMicros(catalog.available_at)
  priceAssert(snapshot.catalog_snapshot_id === catalog.snapshot_id && snapshot.catalog_as_of === catalog.as_of)
  // Price publications retain the catalog seal clock (0028). Public catalog
  // discovery uses its later publication clock (0032), even for the same
  // immutable snapshot. Bind identity exactly and both distinct clocks to PIT;
  // never replace the independently supplied catalog binding with price data.
  priceAssert(snapshot.catalog_available_at <= catalog.available_at && catalog.available_at <= knownAt)
}
function validateSnapshot(snapshot: PriceSnapshot, knownAt: string, catalog?: PriceCatalogBinding): void {
  for (const field of ['catalog_as_of', 'catalog_available_at', 'market_as_of', 'available_at', 'published_at'] as const) priceInstantMicros(snapshot[field])
  priceAssert(snapshot.snapshot_id !== snapshot.catalog_snapshot_id)
  priceAssert(snapshot.published_at <= snapshot.available_at && snapshot.catalog_available_at <= snapshot.available_at && snapshot.available_at <= knownAt)
  if (catalog !== undefined) validateCatalogPublicationBinding(snapshot, catalog, knownAt)
}
function validateQuote(quote: PriceQuote, snapshot: PriceSnapshot, knownAt: string): void {
  priceAssert(quote.quote_id === hashWithout(quote, 'quote_id'))
  priceIdentifier(quote.analysis_unit_id)
  priceAssert(BigInt(quote.item_id) <= 9_223_372_036_854_775_807n)
  for (const field of ['available_at', 'source_available_at', 'identity_available_at'] as const) priceInstantMicros(quote[field])
  priceAssert(quote.available_at <= knownAt && quote.source_available_at <= quote.available_at && quote.identity_available_at <= quote.available_at)
  for (const field of ['bucket_at', 'observed_at', 'source_updated_at', 'source_collected_at'] as const) {
    const clock = quote[field]
    if (clock !== null) { priceInstantMicros(clock); priceAssert(clock <= quote.source_available_at) }
  }
  const event = priceEvent(quote)
  priceAssert(quote.time_basis === (quote.bucket_at !== null ? 'BUCKET_AT' : quote.observed_at !== null ? 'OBSERVED_AT' : 'UNAVAILABLE'))
  if (event === null) priceAssert(snapshot.kind === 'CURRENT')
  else priceAssert(event <= snapshot.market_as_of)
  priceAssert(snapshot.published_at <= quote.available_at && quote.available_at <= snapshot.available_at)
  validatePriceAmounts(quote, knownAt)
}

function validateDocument(document: PriceDocument, binding: PriceDecodeBinding): void {
  priceAssert(document.document_hash === hashWithout(document, 'document_hash'))
  // The final HTTP representation may be re-encoded by the edge.
  // Preserve and compare the actual header; canonical content is verified above.
  // This is not a strong-validator conversion or conditional-cache permission.
  if (binding.etag !== undefined) {
    const quotedHash = `"${document.document_hash}"`
    priceAssert(binding.etag === quotedHash || binding.etag === `W/${quotedHash}`)
  }
  if (document.response_kind === 'ERROR') {
    if (binding.httpStatus !== undefined) priceAssert(binding.httpStatus === document.error.http_status)
    return
  }
  if (binding.httpStatus !== undefined) priceAssert(binding.httpStatus === 200)
  if (binding.kind !== undefined) priceAssert(document.response_kind === binding.kind)
  if (binding.query !== undefined) priceAssert(canonicalJsonText(document.query) === canonicalJsonText(binding.query))
  validatePriceQuery(document.query, document.response_kind)
  if (document.response_kind === 'PRICE_SNAPSHOT_LIST') {
    const { query, items, pagination } = document
    priceAssert(items.length <= query.page_size && pagination.page_size === query.page_size)
    let previous: PriceSnapshot | null = null
    const seen = new Set<string>()
    for (const snapshot of items) {
      validateSnapshot(snapshot, query.known_at, binding.catalog)
      priceAssert(snapshot.kind === query.kind && snapshot.catalog_snapshot_id === query.catalog_snapshot_id && snapshot.market_as_of <= query.query_as_of)
      priceAssert(!seen.has(snapshot.snapshot_id))
      seen.add(snapshot.snapshot_id)
      if (previous !== null) {
        const eventOrder = compareCodePoints(previous.market_as_of, snapshot.market_as_of)
        const knownOrder = compareCodePoints(previous.available_at, snapshot.available_at)
        priceAssert(eventOrder > 0 || (eventOrder === 0 && (knownOrder > 0 || (knownOrder === 0 && compareCodePoints(previous.snapshot_id, snapshot.snapshot_id) < 0))))
      }
      previous = snapshot
    }
    return
  }
  const { query, snapshot, items } = document
  validateSnapshot(snapshot, query.known_at, binding.catalog)
  if (binding.snapshot !== undefined) priceAssert(canonicalJsonText(snapshot) === canonicalJsonText(binding.snapshot))
  priceAssert(query.snapshot_id === snapshot.snapshot_id && query.as_of === snapshot.market_as_of)
  const history = document.response_kind === 'PRICE_HISTORY'
  const after = history ? decodePriceCursor(document.query) : null
  let priorOrder = after === null ? null : priceOrder(after)
  let itemId = binding.itemId
  const ids = new Set<string>(), sources = new Set<string>()
  for (const quote of items) {
    validateQuote(quote, snapshot, query.known_at)
    priceAssert(quote.analysis_unit_id === query.analysis_unit_id)
    itemId ??= quote.item_id
    priceAssert(quote.item_id === itemId)
    const order = priceOrder(quote)
    priceAssert(!ids.has(quote.quote_id) && (priorOrder === null || comparePriceOrder(priorOrder, order) < 0))
    ids.add(quote.quote_id)
    priorOrder = order
    const sourceKey = priceSourceKey(quote, history)
    priceAssert(!sources.has(sourceKey))
    sources.add(sourceKey)
    if (document.response_kind === 'PRICE_HISTORY') {
      const event = priceEvent(quote)
      priceAssert(event !== null && document.query.from <= event && event < document.query.to)
      for (const field of ['quote_origin', 'logical_market', 'quote_kind'] as const) {
        const actual = field === 'quote_kind' ? quote.quote_kind : quote.source[field]
        priceAssert(document.query[field] === null || document.query[field] === actual)
      }
    }
  }
  if (document.response_kind === 'PRICE_HISTORY') {
    const { pagination } = document
    priceAssert(items.length <= document.query.page_size && pagination.page_size === document.query.page_size)
    if (pagination.next_cursor !== null) {
      priceAssert(items.length > 0 && pagination.next_cursor !== document.query.cursor)
      priceAssert(pagination.next_cursor === encodePriceCursor(document.query, items[items.length - 1]))
    }
  }
}

/** Unknown input -> directly shared-Schema + semantic/hash/request-bound value.
 * A matching digest alone cannot admit forged rates, rounded native amounts or
 * another catalog/price publication. No response is repaired here. */
export function decodePriceDisplayDocument(input: unknown, binding: PriceDecodeBinding = {}): PriceDocument {
  try {
    const document: unknown = structuredClone(input)
    priceAssert(validatePriceDisplayApiResponse(document))
    const typed = document as PriceDocument
    validateDocument(typed, binding)
    deepFreeze(typed)
    decoded.add(typed)
    return typed
  } catch { throw new PriceDisplayValidationError() }
}
export function isDecodedPriceDocument(value: unknown): value is PriceDocument {
  return value !== null && typeof value === 'object' && decoded.has(value)
}
