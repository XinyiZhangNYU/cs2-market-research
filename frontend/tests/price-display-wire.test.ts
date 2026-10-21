import { describe, expect, it } from 'vitest'
import { canonicalHash, canonicalJsonText } from '../src/wire/canonical'
import { decodePriceDisplayDocument, isDecodedPriceDocument } from '../src/wire/priceDisplayApiDecode'
import { PRICE_DISPLAY_API_SCHEMA } from '../src/wire/priceDisplayApiSchema'
import { validatePriceDisplayApiResponse } from '../src/wire/generated/wireValidators.js'
import { parsePriceJson } from '../src/wire/priceDisplayJson'
import { decodePriceCursor, encodePriceCursor, priceAnalysisUnitFromToken, priceAnalysisUnitToken, priceBase64url, priceInstantMicros } from '../src/wire/priceDisplayPrimitives'
import { toPricePanelState } from '../src/adapter/priceDisplayViewModel'
import { catalogFixture, historyFixture, historyNextFixture, itemFixture, resealPrice, snapshotsFixture, type MutablePrice } from './support/priceWireFixtures'
import type { PriceItem } from '../src/wire/priceDisplayApiTypes'

const examples = import.meta.glob('../../schemas/examples/price-display-*.json', { eager: true, import: 'default' })

describe('direct shared price Schema and immutable semantic decoder', () => {
  it('imports the frozen shared Schema, not a frontend copy', () => {
    expect(PRICE_DISPLAY_API_SCHEMA.$id).toBe('urn:cs2-research:price-display-api:v1')
    expect(Object.keys(examples)).toHaveLength(18)
  })
  it.each(Object.entries(examples))('checks the shared example %s', (name, source) => {
    if (name.endsWith('.invalid.json')) expect(() => decodePriceDisplayDocument(source)).toThrow()
    else {
      const result = decodePriceDisplayDocument(parsePriceJson(JSON.stringify(source)))
      expect(result).toEqual(source)
      expect(isDecodedPriceDocument(result)).toBe(true)
      expect(isDecodedPriceDocument(source)).toBe(false)
      expect(Object.isFrozen(result)).toBe(true)
      expect(Object.isFrozen(result.items)).toBe(true)
    }
  })
  it('rejects schema-valid, fully rehashed amount tampering', () => {
    const source = examples['../../schemas/examples/price-display-amount-tamper.invalid.json']
    expect(validatePriceDisplayApiResponse(source)).toBe(true)
    expect(() => decodePriceDisplayDocument(source)).toThrow()
  })
  it('retains BIGINT identities, native values and decimal strings above 2^53', () => {
    const decoded = decodePriceDisplayDocument(itemFixture())
    if (decoded.response_kind !== 'PRICE_ITEM') throw new Error('fixture kind')
    const panel = toPricePanelState(decoded)
    expect(decoded.items[0].item_id).toBe('9007199254740993')
    expect(panel.rows[1].sourcePrice?.value).toBe('9223372036854775807')
    expect(panel.rows[1].amounts.CNY).toMatchObject({ amount: '92233720368547758.07', basis: 'NATIVE' })
    expect(panel.rows[3].amounts.CNY).toMatchObject({ amount: '0.00', rounding: 'ROUNDED_TO_ZERO' })
    expect(() => toPricePanelState(itemFixture())).toThrow()
  })
  it.each<[string, (doc: MutablePrice<PriceItem>) => void]>([
    ['native amount', (d) => { d.items[0].amounts.USD.amount = '10.00000001' }],
    ['derived amount', (d) => { d.items[0].amounts.CNY.amount = '67.21' }],
    ['native rounding', (d) => { d.items[0].amounts.USD.rounding = 'ROUNDED' }],
    ['derived rounding', (d) => { d.items[0].amounts.CNY.rounding = 'ROUNDED' }],
    ['numeric source', (d) => { Object.assign(d.items[0].source_price!, { value: 10 }) }],
    ['CNY overflow', (d) => { d.items[1].source_price!.value = '9223372036854775808' }],
    ['item overflow', (d) => { for (const q of d.items) q.item_id = '9223372036854775808' }],
    ['cross-item row', (d) => { d.items[1].item_id = '2' }],
    ['cross-unit row', (d) => { d.items[1].analysis_unit_id = 'different' }],
    ['unpaired surrogate', (d) => { d.query.analysis_unit_id = '\ud800' }],
    ['private property', (d) => { Object.assign(d.items[0], { private_source_ref: 'private' }) }],
    ['unknown currency', (d) => { Object.assign(d.items[0].source_price!, { currency: 'EUR' }) }],
    ['unknown market', (d) => { Object.assign(d.items[0].source, { logical_market: 'MARKET_A' }) }],
    ['wrong transport identity', (d) => { d.items[0].source.transport = 'market_b_direct' }],
    ['aggregate with market', (d) => { d.items[0].source.quote_origin = 'PROVIDER_AGGREGATE' }],
    ['source reason with price', (d) => { d.items[0].source_price_reason = 'CAPTURE_GAP' }],
    ['missing source mismatched reason', (d) => { d.items[2].amounts.USD.reason = 'CAPTURE_GAP' }],
    ['unknown time as known', (d) => { d.items[5].time_basis = 'OBSERVED_AT' }],
    ['unknown time fake target', (d) => { d.items[5].amounts.CNY.reason = 'FX_STALE' }],
    ['late binding policy', (d) => { d.items[0].late_bound = !d.items[0].late_bound }],
    ['future source microsecond', (d) => { d.items[0].source_updated_at = '2026-09-03T00:00:00.000001Z' }],
    ['future known microsecond', (d) => { d.query.known_at = '2026-09-02T23:59:59.999999Z' }],
    ['publication clock', (d) => { d.snapshot.published_at = '2026-09-03T00:00:00.000001Z' }],
    ['invalid calendar date', (d) => { d.items[0].bucket_at = '2026-02-30T00:00:00.000000Z' }],
    ['non-canonical instant', (d) => { d.items[0].bucket_at = '2026-08-28T12:00:00Z' }],
    ['FX carry', (d) => { d.items[0].fx!.carry_days = 1 }],
    ['FX leg future', (d) => { d.items[0].fx!.cny_valid_from = '2027-01-01T00:00:00.000000Z' }],
    ['FX full rate changed', (d) => { d.items[0].fx!.cny_per_usd = '6.720000000000000001' }],
    ['current widget precision', (d) => { d.items[0].fx!.cny_per_usd = '6.72000000' }],
    ['CNY using legacy USD policy', (d) => { d.items[1].fx!.conversion_policy_version = 'ecb-eur-cross-daily/2' }],
    ['same snapshot namespaces', (d) => { d.snapshot.catalog_snapshot_id = d.snapshot.snapshot_id }],
    ['quote order', (d) => { d.items.reverse() }],
    ['duplicate logical source', (d) => { d.items[1].source = structuredClone(d.items[0].source) }],
  ])('fails closed on %s even with a fresh outer and quote hash', (_label, mutate) => {
    const document = itemFixture()
    mutate(document)
    expect(() => decodePriceDisplayDocument(resealPrice(document))).toThrow()
  })
  it('checks request, catalog, snapshot, item and strong ETag independently', () => {
    const document = itemFixture()
    const correct = { kind: 'PRICE_ITEM' as const, query: document.query, catalog: catalogFixture, snapshot: document.snapshot, itemId: document.items[0].item_id, httpStatus: 200, etag: `"${document.document_hash}"` }
    expect(decodePriceDisplayDocument(document, correct)).toEqual(document)
    for (const wrong of [
      { ...correct, kind: 'PRICE_HISTORY' as const },
      { ...correct, query: { ...document.query, analysis_unit_id: 'another' } },
      { ...correct, catalog: { ...catalogFixture, available_at: '9999-12-31T23:59:59.999999Z' } },
      { ...correct, snapshot: { ...document.snapshot, published_at: '2026-09-02T00:00:00.000000Z' } },
      { ...correct, itemId: '1' }, { ...correct, httpStatus: 503 },
      { ...correct, etag: `w/"${document.document_hash}"` }, { ...correct, etag: '"other"' },
    ]) expect(() => decodePriceDisplayDocument(document, wrong)).toThrow()
  })
  it('keeps discovery cutoffs distinct from catalog and price seal times', () => {
    const document = snapshotsFixture()
    expect(document.query.known_at).not.toBe(catalogFixture.available_at)
    expect(decodePriceDisplayDocument(document, { catalog: catalogFixture, query: document.query })).toEqual(document)
    const old = structuredClone(document)
    old.query.known_at = catalogFixture.available_at
    expect(() => decodePriceDisplayDocument(resealPrice(old))).toThrow()
    const duplicate = structuredClone(document)
    duplicate.items.push(duplicate.items[0])
    expect(() => decodePriceDisplayDocument(resealPrice(duplicate))).toThrow()
  })
  it('checks half-even as a relation without replacing the wire amount', () => {
    for (const [usd, cny, rounding] of [['0.00250000', '0.00', 'ROUNDED_TO_ZERO'], ['0.00750000', '0.02', 'ROUNDED']] as const) {
      const document = itemFixture()
      document.items = [document.items[0]]
      const quote = document.items[0]
      quote.source_price!.value = usd
      quote.amounts.USD.amount = usd
      quote.amounts.CNY.amount = cny
      quote.amounts.CNY.rounding = rounding
      quote.fx!.cny_per_usd = '2.000000000000000000'
      const fx = quote.fx!
      fx.public_rate_id = canonicalHash(Object.fromEntries(['authority', 'method', 'source_event_date', 'cny_per_usd', 'cny_valid_from', 'usd_valid_from', 'available_at', 'fx_selection_policy_version'].map((key) => [key, fx[key as keyof typeof fx]])))
      expect(decodePriceDisplayDocument(resealPrice(document))).toEqual(document)
      quote.amounts.CNY.amount = '0.01'
      quote.amounts.CNY.rounding = 'ROUNDED'
      expect(() => decodePriceDisplayDocument(resealPrice(document))).toThrow()
    }
  })
  it('allows target overflow only when the precise ratio really exceeds that currency range', () => {
    const document = itemFixture()
    document.items = [document.items[0]]
    document.items[0].source_price!.value = '9'.repeat(30) + '.99999999'
    document.items[0].amounts.USD.amount = document.items[0].source_price!.value
    document.items[0].amounts.CNY = { status: 'UNAVAILABLE', currency: 'CNY', amount: null, scale: null, basis: null, rounding: null, reason: 'AMOUNT_OUT_OF_RANGE' }
    expect(decodePriceDisplayDocument(resealPrice(document))).toEqual(document)
    document.items[0].source_price!.value = '10.00000000'
    document.items[0].amounts.USD.amount = '10.00000000'
    expect(() => decodePriceDisplayDocument(resealPrice(document))).toThrow()
  })
})

describe('canonical source-grain history keyset', () => {
  it('matches the independently generated backend cursor bytes and page 2', () => {
    const first = historyFixture(), next = historyNextFixture()
    expect(encodePriceCursor(first.query, first.items.at(-1)!)).toBe(first.pagination.next_cursor)
    expect(next.query.cursor).toBe(first.pagination.next_cursor)
    expect(decodePriceCursor(next.query)?.quote_id).toBe(first.items.at(-1)!.quote_id)
    expect(decodePriceDisplayDocument(first)).toEqual(first)
    expect(decodePriceDisplayDocument(next)).toEqual(next)
  })
  it.each(['query', 'pad', 'noncanonical', 'next', 'repeat', 'range', 'filter', 'empty', 'unknown time'] as const)('rejects history %s drift', (mode) => {
    const document = historyNextFixture()
    if (mode === 'query') document.query.known_at = '2026-09-04T00:00:00.000000Z'
    if (mode === 'pad') document.query.cursor += '='
    if (mode === 'noncanonical') {
      const decoded = JSON.parse(atob(document.query.cursor!.replaceAll('-', '+').replaceAll('_', '/'))) as object
      document.query.cursor = priceBase64url(new TextEncoder().encode(JSON.stringify(decoded)))
    }
    if (mode === 'next') document.pagination.next_cursor = 'YQ'
    if (mode === 'repeat') document.items = [historyFixture().items.at(-1)!]
    if (mode === 'range') document.query.to = document.query.from
    if (mode === 'filter') document.query.logical_market = 'market_a'
    if (mode === 'empty') { document.items = []; document.pagination.next_cursor = document.query.cursor }
    if (mode === 'unknown time') document.items[0] = itemFixture().items[5]
    expect(() => decodePriceDisplayDocument(resealPrice(document))).toThrow()
  })
})

describe('strict JSON, exact Unicode token and microsecond clocks', () => {
  it.each(['{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{"x":1.0}', '{"x":1e0}', '{"x":NaN}', '{"x":Infinity}', '{"x":9007199254740992}', '\ufeff{}', '{"x":"\\ud800"}', '{"x":"\\udc00"}', '{"x":01}', '{"x":1,}', '{"x":[1,]}', '{}{}', '[]', 'null'])('rejects non-contract JSON %s', (text) => {
    expect(() => parsePriceJson(text)).toThrow()
  })
  it('preserves nested duplicate checking, string precision, valid scalars and canonical LF', () => {
    const text = '{"price":"9007199254740993.00000000","a":[{"字符":"🗡️"}],"__proto__":1}'
    expect(canonicalJsonText(parsePriceJson(text))).toBe(canonicalJsonText(JSON.parse(text)))
    expect(() => parsePriceJson('{"nested":{"x":1,"x":2}}')).toThrow()
  })
  it.each(['price:42', 'slash/./\\%', '刀🗡️', 'é', 'e\u0301', ' leading ', '%2F', '\ufeffnative', '𐐷'.repeat(256)])('reversibly transports exact scalar identifier %s', (identifier) => {
    const token = priceAnalysisUnitToken(identifier)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/u)
    expect(priceAnalysisUnitFromToken(token)).toBe(identifier)
  })
  it.each(['', '\0', '\u007f', '\ud800', 'x'.repeat(257)])('rejects invalid identifiers', (identifier) => {
    expect(() => priceAnalysisUnitToken(identifier)).toThrow()
  })
  it.each(['', 'YQ==', 'YR', '%59Q', '/w', '_w', 'YQ/YQ'])('rejects aliases and invalid UTF8 tokens %s', (token) => {
    expect(() => priceAnalysisUnitFromToken(token)).toThrow()
  })
  it('does not truncate microseconds or misinterpret year 0001 as 1901', () => {
    expect(priceInstantMicros('2026-09-03T00:00:00.000001Z') - priceInstantMicros('2026-09-03T00:00:00.000000Z')).toBe(1n)
    expect(priceInstantMicros('0001-01-02T00:00:00.000000Z') - priceInstantMicros('0001-01-01T00:00:00.000000Z')).toBe(86_400_000_000n)
    for (const invalid of ['0000-01-01T00:00:00.000000Z', '2026-02-29T00:00:00.000000Z', '2026-01-01T24:00:00.000000Z', '2026-01-01T00:00:60.000000Z']) expect(() => priceInstantMicros(invalid)).toThrow()
  })
})
