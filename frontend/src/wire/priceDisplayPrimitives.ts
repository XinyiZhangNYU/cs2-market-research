import { canonicalJsonBytes, canonicalJsonText, compareCodePoints } from './canonical'
import { parsePriceJson } from './priceDisplayJson'
import type { PriceCursorAfter, PriceHistoryQuery, PriceQuery, PriceQuote, PriceResponseKind } from './priceDisplayApiTypes'

export class PriceDisplayValidationError extends Error {
  readonly code = 'RECORD_REJECTED'
  constructor() { super('Price response failed validation'); this.name = 'PriceDisplayValidationError' }
}
export function priceAssert(condition: unknown): asserts condition {
  if (!condition) throw new PriceDisplayValidationError()
}
export function priceExactFields(value: object, names: readonly string[]): void {
  const actual = Object.keys(value)
  priceAssert(actual.length === names.length && actual.every((key) => names.includes(key)))
}
export function priceDateDay(value: string): number {
  priceAssert(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u.test(value))
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  priceAssert(year >= 1 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= 31)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(0, 0, 0, 0)
  priceAssert(date.toISOString().slice(0, 10) === value)
  return date.getTime() / 86_400_000
}
export function priceInstantMicros(value: string): bigint {
  priceAssert(typeof value === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$/u.test(value))
  const day = priceDateDay(value.slice(0, 10))
  const hour = Number(value.slice(11, 13)), minute = Number(value.slice(14, 16)), second = Number(value.slice(17, 19))
  priceAssert(hour < 24 && minute < 60 && second < 60)
  return BigInt(day) * 86_400_000_000n + BigInt(hour * 3600 + minute * 60 + second) * 1_000_000n + BigInt(value.slice(20, 26))
}
export function priceIdentifier(value: string): string {
  priceAssert(typeof value === 'string' && [...value].length >= 1 && [...value].length <= 256 && !/[\u0000-\u001f\u007f\ud800-\udfff]/u.test(value))
  priceAssert(new TextEncoder().encode(value).byteLength <= 1024)
  return value
}
export function priceBase64url(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}
export function priceUnbase64url(token: string, maximum: number): Uint8Array {
  priceAssert(typeof token === 'string' && token.length >= 1 && token.length <= maximum && /^[A-Za-z0-9_-]+$/u.test(token))
  let bytes: Uint8Array
  try {
    bytes = Uint8Array.from(atob(token.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - token.length % 4) % 4)), (char) => char.charCodeAt(0))
  } catch { throw new PriceDisplayValidationError() }
  priceAssert(priceBase64url(bytes) === token)
  return bytes
}
export function priceAnalysisUnitToken(value: string): string {
  return priceBase64url(new TextEncoder().encode(priceIdentifier(value)))
}
export function priceAnalysisUnitFromToken(token: string): string {
  try {
    const bytes = priceUnbase64url(token, 1366)
    priceAssert(bytes.byteLength <= 1024)
    return priceIdentifier(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes))
  } catch { throw new PriceDisplayValidationError() }
}

const itemFields = ['analysis_unit_id', 'snapshot_id', 'as_of', 'known_at'] as const
const historyFields = [...itemFields, 'from', 'to', 'quote_origin', 'logical_market', 'quote_kind', 'page_size', 'cursor', 'sort'] as const
const hashPattern = /^[0-9a-f]{64}$/u
export function validatePriceQuery(query: PriceQuery, kind: PriceResponseKind): void {
  priceInstantMicros(query.known_at)
  if (kind === 'PRICE_SNAPSHOT_LIST') {
    priceExactFields(query, ['query_as_of', 'known_at', 'catalog_snapshot_id', 'kind', 'page_size', 'sort'])
    priceAssert('query_as_of' in query)
    priceInstantMicros(query.query_as_of)
    priceAssert(hashPattern.test(query.catalog_snapshot_id) && ['CURRENT', 'HISTORY'].includes(query.kind))
    priceAssert(Number.isInteger(query.page_size) && query.page_size >= 1 && query.page_size <= 20 && query.sort === 'MARKET_AS_OF_DESC')
    return
  }
  priceAssert('analysis_unit_id' in query)
  priceIdentifier(query.analysis_unit_id)
  priceInstantMicros(query.as_of)
  priceAssert(hashPattern.test(query.snapshot_id))
  priceExactFields(query, kind === 'PRICE_ITEM' ? itemFields : historyFields)
  if (kind === 'PRICE_ITEM') return
  priceAssert('from' in query)
  const duration = priceInstantMicros(query.to) - priceInstantMicros(query.from)
  priceAssert(duration > 0n && duration <= 366n * 86_400_000_000n)
  priceAssert([null, 'SOURCE_QUOTE', 'PROVIDER_AGGREGATE'].includes(query.quote_origin))
  priceAssert([null, 'market_a', 'market_c', 'market_b'].includes(query.logical_market))
  priceAssert([null, 'ASK', 'BID'].includes(query.quote_kind))
  priceAssert(query.quote_origin !== 'PROVIDER_AGGREGATE' || query.logical_market === null)
  priceAssert(Number.isInteger(query.page_size) && query.page_size >= 1 && query.page_size <= 200 && query.sort === 'EVENT_SOURCE_QUOTE_ID_ASC')
  priceAssert(query.cursor === null || (typeof query.cursor === 'string' && query.cursor.length >= 1 && query.cursor.length <= 8192 && /^[A-Za-z0-9_-]+$/u.test(query.cursor)))
}
export function priceEvent(quote: PriceQuote): string | null { return quote.bucket_at ?? quote.observed_at }
export function priceAfter(quote: PriceQuote): PriceCursorAfter {
  const event = priceEvent(quote)
  priceAssert(event !== null)
  return { event_at: event, quote_origin: quote.source.quote_origin, logical_market: quote.source.logical_market, quote_kind: quote.quote_kind, quote_id: quote.quote_id }
}
export function priceOrder(value: PriceQuote | PriceCursorAfter): readonly string[] {
  const event = 'source' in value ? priceEvent(value) : value.event_at
  const source = 'source' in value ? value.source : value
  return [event === null ? '1' : '0', event ?? '', source.quote_origin, source.logical_market ?? '', value.quote_kind, value.quote_id]
}
export function comparePriceOrder(left: readonly string[], right: readonly string[]): number {
  for (let index = 0; index < left.length; index += 1) {
    const difference = compareCodePoints(left[index], right[index])
    if (difference !== 0) return difference
  }
  return 0
}
export function priceSourceKey(quote: PriceQuote, history: boolean): string {
  return canonicalJsonText([...(history ? [priceEvent(quote)] : []), quote.source.quote_origin, quote.source.logical_market, quote.quote_kind])
}
export function decodePriceCursor(query: PriceHistoryQuery): PriceCursorAfter | null {
  validatePriceQuery(query, 'PRICE_HISTORY')
  if (query.cursor === null) return null
  try {
    const bytes = priceUnbase64url(query.cursor, 8192)
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
    const document = parsePriceJson(text) as Record<string, unknown>
    priceExactFields(document, ['api_contract', 'api_version', 'query', 'after'])
    priceAssert(document.api_contract === 'price-display-api' && document.api_version === 'v1')
    priceAssert(canonicalJsonText(document) === text && canonicalJsonText(document.query) === canonicalJsonText({ ...query, cursor: null }))
    priceAssert(document.after !== null && typeof document.after === 'object' && !Array.isArray(document.after))
    const after = document.after as PriceCursorAfter
    priceExactFields(after, ['event_at', 'quote_origin', 'logical_market', 'quote_kind', 'quote_id'])
    priceInstantMicros(after.event_at)
    priceAssert(query.from <= after.event_at && after.event_at < query.to && after.event_at <= query.as_of)
    priceAssert(['SOURCE_QUOTE', 'PROVIDER_AGGREGATE'].includes(after.quote_origin) && ['ASK', 'BID'].includes(after.quote_kind))
    priceAssert(after.quote_origin === 'PROVIDER_AGGREGATE' ? after.logical_market === null : ['market_a', 'market_c', 'market_b'].includes(after.logical_market ?? ''))
    priceAssert(hashPattern.test(after.quote_id))
    for (const field of ['quote_origin', 'logical_market', 'quote_kind'] as const) priceAssert(query[field] === null || query[field] === after[field])
    return after
  } catch { throw new PriceDisplayValidationError() }
}
export function encodePriceCursor(query: PriceHistoryQuery, quote: PriceQuote): string {
  const token = priceBase64url(canonicalJsonBytes({ api_contract: 'price-display-api', api_version: 'v1', query: { ...query, cursor: null }, after: priceAfter(quote) }))
  decodePriceCursor({ ...query, cursor: token })
  return token
}
