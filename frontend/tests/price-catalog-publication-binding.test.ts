import { describe, expect, it, vi } from 'vitest'
import { HttpPriceDisplayGateway } from '../src/api/HttpPriceDisplayGateway'
import { loadCurrentPrice } from '../src/price/priceDisplayRuntime'
import { canonicalJsonText } from '../src/wire/canonical'
import { decodePriceDisplayDocument } from '../src/wire/priceDisplayApiDecode'
import type { PriceCatalogBinding, PriceDocument } from '../src/wire/priceDisplayApiTypes'
import { catalogFixture, historyFixture, itemFixture, resealPrice, snapshotsFixture } from './support/priceWireFixtures'

const nextMicrosecond = (value: string) => `${value.slice(0, 20)}${String(Number(value.slice(20, 26)) + 1).padStart(6, '0')}Z`

describe('independent catalog publication and immutable price seal clocks', () => {
  it.each([snapshotsFixture, itemFixture, historyFixture])('accepts later public availability without modifying sealed content', fixture => {
    const document = fixture()
    const before = structuredClone(document)
    const later: PriceCatalogBinding = { ...catalogFixture, available_at: nextMicrosecond(catalogFixture.available_at) }
    for (const catalog of [catalogFixture, later, { ...catalogFixture, available_at: document.query.known_at }]) {
      expect(decodePriceDisplayDocument(document, { catalog, query: document.query, etag: `W/"${document.document_hash}"` })).toEqual(before)
    }
    expect(document).toEqual(before)
  })

  it.each([
    ['different snapshot', { ...catalogFixture, snapshot_id: '0'.repeat(64) }],
    ['different catalog event time', { ...catalogFixture, as_of: nextMicrosecond(catalogFixture.as_of) }],
    ['publication before seal', { ...catalogFixture, available_at: '0001-01-01T00:00:00.000000Z' }],
    ['publication one microsecond beyond known-at', { ...catalogFixture, available_at: nextMicrosecond(itemFixture().query.known_at) }],
    ['noncanonical publication clock', { ...catalogFixture, available_at: catalogFixture.available_at.replace('.000000Z', 'Z') }],
    ['impossible publication calendar date', { ...catalogFixture, available_at: '2026-02-30T00:00:00.000000Z' }],
    ['foreign binding field', { ...catalogFixture, private_source_ref: true }],
  ])('rejects %s even with valid document hash and weak ETag', (_label, catalog) => {
    for (const document of [snapshotsFixture(), itemFixture(), historyFixture()]) {
      expect(() => decodePriceDisplayDocument(document, { catalog, etag: `W/"${document.document_hash}"` })).toThrow()
    }
  })

  it('rejects a publication clock one microsecond before a nonzero seal clock', () => {
    const document = itemFixture()
    const catalog = { ...catalogFixture, available_at: nextMicrosecond(catalogFixture.available_at) }
    document.snapshot.catalog_available_at = nextMicrosecond(catalog.available_at)
    resealPrice(document)
    expect(decodePriceDisplayDocument(document)).toEqual(document)
    expect(() => decodePriceDisplayDocument(document, { catalog })).toThrow()
  })

  it('completes snapshot discovery and item reads against a later catalog publication', async () => {
    const item = itemFixture()
    const catalog = { ...catalogFixture, available_at: item.query.known_at }
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async input => {
      const document: PriceDocument = String(input).split('?')[0].endsWith('/snapshots') ? snapshotsFixture() : item
      const body = canonicalJsonText(document)
      return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json', ETag: `W/"${document.document_hash}"` } })
    })
    expect(await loadCurrentPrice(new HttpPriceDisplayGateway({ fetcher }), {
      analysisUnitId: item.query.analysis_unit_id, catalog,
      queryAsOf: snapshotsFixture().query.query_as_of, knownAt: item.query.known_at,
    })).toEqual(item)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(catalog.available_at).toBe(item.query.known_at)
    expect(item.snapshot.catalog_available_at).toBe(catalogFixture.available_at)
  })
})
