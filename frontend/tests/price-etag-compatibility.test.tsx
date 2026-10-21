import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { HttpPriceDisplayGateway } from '../src/api/HttpPriceDisplayGateway'
import { PriceDisplayApi } from '../src/api/PriceDisplayApi'
import { CatalogUnitPricePanel } from '../src/components/CatalogUnitPricePanel'
import { LangProvider } from '../src/i18n'
import { canonicalJsonText } from '../src/wire/canonical'
import { decodePriceDisplayDocument } from '../src/wire/priceDisplayApiDecode'
import { catalogFixture, itemFixture, snapshotsFixture, resealPrice, type MutablePrice } from './support/priceWireFixtures'
import type { PriceDocument, PriceItem } from '../src/wire/priceDisplayApiTypes'

// Synthetic transport representations only: no network or real CNY coverage claim.
const examples = import.meta.glob('../../schemas/examples/price-display-*.valid.json', { eager: true, import: 'default' })
const etag = (doc: PriceDocument, weak: boolean) => `${weak ? 'W/' : ''}"${doc.document_hash}"`
function response(doc: PriceDocument, tag: string | null): Response {
  const body = canonicalJsonText(doc)
  return new Response(body, { status: doc.response_kind === 'ERROR' ? doc.error.http_status : 200,
    headers: { 'Content-Type': 'application/json', 'Content-Length': String(new TextEncoder().encode(body).byteLength),
      'Cache-Control': 'no-store', ...(tag === null ? {} : { ETag: tag }) } })
}

describe('exact final HTTP ETag representation', () => {
  it.each(Object.entries(examples))('admits both forms for shared valid example %s, including controlled errors', (_name, raw) => {
    const doc = raw as PriceDocument
    for (const weak of [false, true]) {
      const actual = decodePriceDisplayDocument(doc, { etag: etag(doc, weak), httpStatus: doc.response_kind === 'ERROR' ? doc.error.http_status : 200 })
      expect(actual).toEqual(doc)
      expect(Object.isFrozen(actual)).toBe(true)
    }
  })
  it.each([
    ['lowercase prefix', (hash: string) => `w/"${hash}"`],
    ['uppercase hash', (hash: string) => `W/"${hash.toUpperCase()}"`],
    ['leading whitespace', (hash: string) => ` W/"${hash}"`],
    ['trailing whitespace', (hash: string) => `W/"${hash}" `],
    ['inner whitespace', (hash: string) => `W/ "${hash}"`],
    ['tag list', (hash: string) => `W/"${hash}", "${hash}"`],
    ['duplicate tag', (hash: string) => `W/"${hash}", W/"${hash}"`],
    ['bare hash', (hash: string) => hash],
    ['unquoted weak', (hash: string) => `W/${hash}`],
    ['wrong hash', () => `W/"${'0'.repeat(64)}"`],
    ['wildcard', () => '*'],
    ['empty', () => ''],
  ] as const)('rejects %s without normalization', (_name, make) => {
    const doc = itemFixture()
    expect(() => decodePriceDisplayDocument(doc, { etag: make(doc.document_hash) })).toThrow()
  })
  it.each<[string, (doc: MutablePrice<PriceItem>) => void]>([
    ['document hash', d => { d.document_hash = '0'.repeat(64) }],
    ['quote hash', d => { d.items[0].quote_id = '0'.repeat(64) }],
    ['rehashed native amount', d => { d.items[0].amounts.USD.amount = '10.00000001'; resealPrice(d) }],
    ['rehashed derived amount', d => { d.items[0].amounts.CNY.amount = '67.21'; resealPrice(d) }],
    ['rehashed FX', d => { d.items[0].fx!.cny_per_usd = '6.720000000000000001'; resealPrice(d) }],
    ['rehashed private field', d => { Object.assign(d, { private_source_ref: true }); resealPrice(d) }],
  ])('weak representation does not admit %s', (_name, mutate) => {
    const doc = itemFixture(); mutate(doc)
    expect(() => decodePriceDisplayDocument(doc, { etag: etag(doc, true) })).toThrow()
  })
  it('keeps independent request, catalog, price snapshot, item and status binding under weak ETags', () => {
    const doc = itemFixture()
    const binding = { query: doc.query, kind: 'PRICE_ITEM' as const, catalog: catalogFixture,
      snapshot: doc.snapshot, itemId: doc.items[0].item_id, httpStatus: 200, etag: etag(doc, true) }
    expect(decodePriceDisplayDocument(doc, binding)).toEqual(doc)
    for (const wrong of [
      { ...binding, query: { ...doc.query, analysis_unit_id: 'other' } },
      { ...binding, catalog: { ...catalogFixture, snapshot_id: '0'.repeat(64) } },
      { ...binding, snapshot: { ...doc.snapshot, snapshot_id: '0'.repeat(64) } },
      { ...binding, itemId: '1' }, { ...binding, httpStatus: 503 },
    ]) expect(() => decodePriceDisplayDocument(doc, wrong)).toThrow()
  })
  it.each([false, true])('HTTP/controller preserve actual tag, validate content, and make one GET (weak=%s)', async weak => {
    const doc = itemFixture(), tag = etag(doc, weak)
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => response(doc, tag))
    const gateway = new HttpPriceDisplayGateway({ fetcher })
    const read = vi.spyOn(gateway, 'read')
    expect(await new PriceDisplayApi(gateway).item(doc.query, doc.snapshot, catalogFixture)).toEqual(doc)
    expect((await read.mock.results[0].value).etag).toBe(tag)
    expect(fetcher).toHaveBeenCalledTimes(1)
    const init = fetcher.mock.calls[0][1]!
    expect(init).toMatchObject({ method: 'GET', cache: 'no-store', redirect: 'error' })
    const headers = new Headers(init.headers)
    expect(headers.has('If-Match')).toBe(false)
    expect(headers.has('If-None-Match')).toBe(false)
    expect(headers.has('Range')).toBe(false)
  })
  it('missing HTTP ETag remains rejected rather than using optional offline binding', async () => {
    const doc = itemFixture(), fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(doc, null))
    await expect(new PriceDisplayApi(new HttpPriceDisplayGateway({ fetcher })).item(doc.query, doc.snapshot, catalogFixture)).rejects.toMatchObject({ code: 'RECORD_REJECTED' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

const item = itemFixture()
const context = { analysisUnitId: item.query.analysis_unit_id, catalog: catalogFixture,
  queryAsOf: snapshotsFixture().query.query_as_of, knownAt: item.query.known_at }
function host(gateway: HttpPriceDisplayGateway) {
  return <LangProvider lang="en"><h1>Selected catalog remains available</h1>
    <CatalogUnitPricePanel context={context} gateway={gateway} />
  </LangProvider>
}
describe('formal component through actual HTTP gateway, with synthetic response bytes', () => {
  it.each([false, true])('reaches READY with original native/derived amounts (weak=%s)', async weak => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async input => {
      const doc = String(input).split('?')[0].endsWith('/snapshots') ? snapshotsFixture() : itemFixture()
      return response(doc, etag(doc, weak))
    })
    render(host(new HttpPriceDisplayGateway({ fetcher })))
    await waitFor(() => expect(screen.getByTestId('catalog-unit-price')).toHaveAttribute('data-price-read-state', 'READY'))
    expect(screen.getByText('$10.00', { selector: 'strong' })).toHaveAttribute('data-price-currency', 'USD')
    expect(screen.getByText('$13,725,256,007,224,368.76', { selector: 'strong' })).toHaveAttribute('data-price-converted', 'true')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('heading', { name: 'Selected catalog remains available' })).toBeInTheDocument()
  })
  it.each(['missing', 'mismatch', 'multiple'])('fails locally on %s tag without quotes, retry or fallback', async mode => {
    const doc = snapshotsFixture()
    const tag = mode === 'missing' ? null : mode === 'mismatch' ? `W/"${'0'.repeat(64)}"` : `${etag(doc, true)},${etag(doc, true)}`
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(doc, tag))
    render(host(new HttpPriceDisplayGateway({ fetcher })))
    await waitFor(() => expect(screen.getByTestId('catalog-unit-price')).toHaveAttribute('data-price-read-state', 'UNAVAILABLE'))
    expect(document.querySelectorAll('.price-quote')).toHaveLength(0)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('heading', { name: 'Selected catalog remains available' })).toBeInTheDocument()
  })
})
