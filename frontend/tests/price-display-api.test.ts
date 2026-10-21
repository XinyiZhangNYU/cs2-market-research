import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpPriceDisplayGateway } from '../src/api/HttpPriceDisplayGateway'
import { PriceDisplayApi, PRICE_MEMORY_TTL_MS, type PriceDisplayGateway, type PriceRequest, type PriceTransportResponse } from '../src/api/PriceDisplayApi'
import { canonicalJsonText } from '../src/wire/canonical'
import { decodePriceDisplayDocument } from '../src/wire/priceDisplayApiDecode'
import { priceAnalysisUnitToken } from '../src/wire/priceDisplayPrimitives'
import { currentPriceSnapshot, preparePriceDiscovery, initialPriceHistoryRange, loadCurrentPrice, priceHistoryQuery, type PriceReadContext } from '../src/price/priceDisplayRuntime'
import { toPriceHistoryPanelState } from '../src/adapter/priceDisplayViewModel'
import { catalogFixture, historyFixture, historyNextFixture, itemFixture, resealPrice, snapshotsFixture } from './support/priceWireFixtures'
import type { PriceDocument } from '../src/wire/priceDisplayApiTypes'

const item = itemFixture()
const itemRequest: PriceRequest = { kind: 'PRICE_ITEM', query: item.query }
const context: PriceReadContext = { analysisUnitId: item.query.analysis_unit_id, catalog: catalogFixture, queryAsOf: snapshotsFixture().query.query_as_of, knownAt: item.query.known_at }
const transport = (document: PriceDocument): PriceTransportResponse => ({ payload: document, etag: `"${document.document_hash}"`, httpStatus: document.response_kind === 'ERROR' ? document.error.http_status : 200 })
function httpResponse(document: PriceDocument, headers: HeadersInit = {}): Response {
  const body = canonicalJsonText(document)
  return new Response(body, { status: document.response_kind === 'ERROR' ? document.error.http_status : 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ETag: `"${document.document_hash}"`, 'Content-Length': String(new TextEncoder().encode(body).byteLength), ...headers } })
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('full-PIT price reuse', () => {
  it('preparation has no render-time effect, then starts once and survives effect replay', async () => {
    const read = vi.fn(async () => transport(snapshotsFixture())), gateway = { kind: 'SYNTHETIC_TEST', read }
    const prepared = preparePriceDiscovery(gateway, context); expect(read).not.toHaveBeenCalled()
    const release = prepared.start(); release(); const releaseReplay = prepared.start()
    expect(await currentPriceSnapshot(gateway, context, {}, prepared)).toEqual(snapshotsFixture().items[0])
    expect(read).toHaveBeenCalledTimes(1); releaseReplay(); await Promise.resolve()
  })
  it('a failed parallel discovery reaches the UI without a second failure request', async () => {
    const read = vi.fn(async () => { throw new Error('transport failure') }), gateway = { kind: 'SYNTHETIC_TEST', read }
    const prepared = preparePriceDiscovery(gateway, context), release = prepared.start()
    await expect(loadCurrentPrice(gateway, context, {}, prepared)).rejects.toThrow('transport failure')
    expect(read).toHaveBeenCalledTimes(1); release()
  })
  it('a cancelled prepared consumer does not cancel another consumer', async () => {
    const read = vi.fn(async () => transport(snapshotsFixture())), gateway = { kind: 'SYNTHETIC_TEST', read }, abort = new AbortController()
    const prepared = preparePriceDiscovery(gateway, context)
    const first = currentPriceSnapshot(gateway, context, { signal: abort.signal }, prepared), second = currentPriceSnapshot(gateway, context, {}, prepared)
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' }); abort.abort(); await rejected
    const release = prepared.start(); await second; expect(read).toHaveBeenCalledTimes(1); release()
  })
  it('revalidates an expired prepared success instead of retaining it for the page lifetime', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const read = vi.fn(async () => transport(snapshotsFixture())), gateway = { kind: 'SYNTHETIC_TEST', read }
    const prepared = preparePriceDiscovery(gateway, context), release = prepared.start()
    await currentPriceSnapshot(gateway, context, {}, prepared)
    vi.setSystemTime(1_000 + PRICE_MEMORY_TTL_MS)
    await currentPriceSnapshot(gateway, context, {}, prepared); expect(read).toHaveBeenCalledTimes(2); release()
  })
  it('does not renew an almost-expired API discovery at preparation handoff', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const read = vi.fn(async () => transport(snapshotsFixture())), gateway = { kind: 'SYNTHETIC_TEST', read }
    await currentPriceSnapshot(gateway, context)
    vi.setSystemTime(1_000 + PRICE_MEMORY_TTL_MS - 1)
    const prepared = preparePriceDiscovery(gateway, context), release = prepared.start()
    await currentPriceSnapshot(gateway, context, {}, prepared)
    expect(read).toHaveBeenCalledTimes(1)
    vi.setSystemTime(1_000 + PRICE_MEMORY_TTL_MS)
    await currentPriceSnapshot(gateway, context, {}, prepared)
    expect(read).toHaveBeenCalledTimes(2); release()
  })
  it('surfaces a failed revalidation instead of a prepared snapshot whose original lease expired', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const read = vi.fn(async () => transport(snapshotsFixture())), gateway = { kind: 'SYNTHETIC_TEST', read }
    await currentPriceSnapshot(gateway, context)
    vi.setSystemTime(1_000 + PRICE_MEMORY_TTL_MS - 1)
    const prepared = preparePriceDiscovery(gateway, context), release = prepared.start()
    await currentPriceSnapshot(gateway, context, {}, prepared)
    vi.setSystemTime(1_000 + PRICE_MEMORY_TTL_MS)
    read.mockRejectedValueOnce(new Error('synthetic origin unavailable at revalidation'))
    await expect(currentPriceSnapshot(gateway, context, {}, prepared)).rejects.toThrow('synthetic origin unavailable')
    expect(read).toHaveBeenCalledTimes(2); release()
  })
  it('rechecks original freshness after the asynchronous prepared handoff', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const read = vi.fn(async () => transport(snapshotsFixture())), gateway = { kind: 'SYNTHETIC_TEST', read }
    const prepared = preparePriceDiscovery(gateway, context), release = prepared.start()
    await currentPriceSnapshot(gateway, context, {}, prepared)
    vi.setSystemTime(1_000 + PRICE_MEMORY_TTL_MS - 1)
    const selection = currentPriceSnapshot(gateway, context, {}, prepared)
    vi.setSystemTime(1_000 + PRICE_MEMORY_TTL_MS)
    await selection; expect(read).toHaveBeenCalledTimes(2); release()
  })
  it('freshness proof binds the exact decoded descriptor, gateway, query and catalog without network', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const read = vi.fn(async () => transport(snapshotsFixture())), gateway = { kind: 'SYNTHETIC_TEST', read }
    const api = new PriceDisplayApi(gateway), document = await api.snapshots(snapshotsFixture().query, catalogFixture)
    if (document.response_kind !== 'PRICE_SNAPSHOT_LIST') throw new Error('fixture')
    const query = snapshotsFixture().query, descriptor = document.items[0]
    expect(api.isSnapshotFresh(query, catalogFixture, descriptor)).toBe(true)
    expect(api.isSnapshotFresh(query, catalogFixture, structuredClone(descriptor))).toBe(false)
    expect(api.isSnapshotFresh({ ...query, known_at: '2026-09-04T00:00:00.000000Z' }, catalogFixture, descriptor)).toBe(false)
    expect(api.isSnapshotFresh(query, { ...catalogFixture, available_at: '2026-09-04T00:00:00.000000Z' }, descriptor)).toBe(false)
    expect(new PriceDisplayApi({ kind: 'SYNTHETIC_TEST', read }).isSnapshotFresh(query, catalogFixture, descriptor)).toBe(false)
    expect(read).toHaveBeenCalledTimes(1)
    vi.setSystemTime(1_000 + PRICE_MEMORY_TTL_MS)
    expect(api.isSnapshotFresh(query, catalogFixture, descriptor)).toBe(false)
    expect(read).toHaveBeenCalledTimes(1)
  })
  it('reuses discovery and item across API instances, then revalidates at expiry', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const read = vi.fn<PriceDisplayGateway['read']>().mockImplementation(async (request) => transport(request.kind === 'PRICE_SNAPSHOT_LIST' ? snapshotsFixture() : itemFixture()))
    const gateway = { kind: 'SYNTHETIC_TEST', read }
    expect(await loadCurrentPrice(gateway, context)).toEqual(item)
    expect(await loadCurrentPrice(gateway, context)).toEqual(item)
    expect(read).toHaveBeenCalledTimes(2)
    vi.setSystemTime(1_000 + PRICE_MEMORY_TTL_MS)
    await loadCurrentPrice(gateway, context); expect(read).toHaveBeenCalledTimes(4)
  })
  it('never reuses a result from another gateway', async () => {
    const good = { kind: 'SYNTHETIC_TEST', read: vi.fn(async () => transport(itemFixture())) }
    const bad = { kind: 'SYNTHETIC_TEST', read: vi.fn(async () => { throw new Error('other gateway') }) }
    await new PriceDisplayApi(good).item(item.query, item.snapshot, catalogFixture)
    await expect(new PriceDisplayApi(bad).item(item.query, item.snapshot, catalogFixture)).rejects.toThrow('other gateway')
    expect(bad.read).toHaveBeenCalledTimes(1)
  })
  it('binds independent catalog metadata even when the wire query is unchanged', async () => {
    const read = vi.fn(async () => transport(itemFixture())), api = new PriceDisplayApi({ kind: 'SYNTHETIC_TEST', read })
    await api.item(item.query, item.snapshot, catalogFixture)
    await expect(api.item(item.query, item.snapshot, { ...catalogFixture, snapshot_id: 'f'.repeat(64) })).rejects.toThrow()
    expect(read).toHaveBeenCalledTimes(2)
  })
  it('binds the complete known-at query instead of just the item identifier', async () => {
    const read = vi.fn<PriceDisplayGateway['read']>().mockImplementation(async (request) => {
      const document = itemFixture(); if (request.kind !== 'PRICE_ITEM') throw new Error('fixture')
      document.query = { ...request.query }; return transport(resealPrice(document))
    })
    const api = new PriceDisplayApi({ kind: 'SYNTHETIC_TEST', read })
    await api.item(item.query, item.snapshot, catalogFixture)
    const query = { ...item.query, known_at: '2026-09-04T00:00:00.000000Z' }
    expect(await api.item(query, item.snapshot, catalogFixture)).toMatchObject({ query })
    expect(read).toHaveBeenCalledTimes(2)
  })
  it('keeps the shared item read alive when just one subscriber leaves', async () => {
    let finish!: (value: PriceTransportResponse) => void, signal!: AbortSignal
    const read = vi.fn<PriceDisplayGateway['read']>().mockImplementation((_request, options) => {
      signal = options!.signal!; return new Promise((resolve) => { finish = resolve })
    })
    const gateway = { kind: 'SYNTHETIC_TEST', read }, abort = new AbortController()
    const first = new PriceDisplayApi(gateway).item(item.query, item.snapshot, catalogFixture, { signal: abort.signal })
    const second = new PriceDisplayApi(gateway).item(item.query, item.snapshot, catalogFixture)
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    await Promise.resolve(); abort.abort(); await rejected
    expect(signal.aborted).toBe(false); finish(transport(itemFixture()))
    expect(await second).toEqual(item); expect(read).toHaveBeenCalledTimes(1)
  })
  it('does not retain failed transport or invalid wire metadata', async () => {
    const read = vi.fn<PriceDisplayGateway['read']>().mockRejectedValueOnce(new Error('failure')).mockResolvedValueOnce({ ...transport(item), etag: '"wrong"' }).mockResolvedValue(transport(item))
    const api = new PriceDisplayApi({ kind: 'SYNTHETIC_TEST', read })
    await expect(api.item(item.query, item.snapshot, catalogFixture)).rejects.toThrow()
    await expect(api.item(item.query, item.snapshot, catalogFixture)).rejects.toThrow()
    expect(await api.item(item.query, item.snapshot, catalogFixture)).toEqual(item)
    expect(read).toHaveBeenCalledTimes(3)
  })
  it('does not cache historical pages', async () => {
    const document = historyFixture(), read = vi.fn(async () => transport(document))
    const api = new PriceDisplayApi({ kind: 'SYNTHETIC_TEST', read })
    await api.history(document.query, document.snapshot, catalogFixture)
    await api.history(document.query, document.snapshot, catalogFixture)
    expect(read).toHaveBeenCalledTimes(2)
  })
})

describe('price HTTP gateway and exact request binding', () => {
  it('uses the internal encoded route and a single bounded, credential-limited GET', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(httpResponse(item))
    const gateway = new HttpPriceDisplayGateway({ fetcher })
    const document = await new PriceDisplayApi(gateway).item(item.query, item.snapshot, catalogFixture)
    expect(document).toEqual(item)
    const [input, init] = fetcher.mock.calls[0]
    const url = new URL(String(input), 'https://test.invalid')
    expect(String(input).startsWith('/api/v1/price-display/items/')).toBe(true)
    expect(url.pathname).toBe(`/api/v1/price-display/items/${priceAnalysisUnitToken(item.query.analysis_unit_id)}`)
    expect(url.searchParams.has('analysis_unit_id')).toBe(false)
    expect(url.searchParams.get('known_at')).toBe(context.knownAt)
    expect(init).toMatchObject({ method: 'GET', cache: 'no-store', credentials: 'same-origin', referrerPolicy: 'no-referrer', redirect: 'error', headers: { Accept: 'application/json' } })
    expect(init?.signal).toBeInstanceOf(AbortSignal)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('serializes only effective allowlisted snapshot and history parameters', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => httpResponse(snapshotsFixture()))
    const gateway = new HttpPriceDisplayGateway({ fetcher })
    await gateway.read({ kind: 'PRICE_SNAPSHOT_LIST', query: snapshotsFixture().query })
    await gateway.read({ kind: 'PRICE_HISTORY', query: historyNextFixture().query })
    const snapshotUrl = new URL(String(fetcher.mock.calls[0][0]), 'https://test.invalid')
    const historyUrl = new URL(String(fetcher.mock.calls[1][0]), 'https://test.invalid')
    expect(snapshotUrl.pathname).toBe('/api/v1/price-display/snapshots')
    expect(historyUrl.pathname.endsWith('/history')).toBe(true)
    expect(historyUrl.searchParams.get('cursor')).toBe(historyNextFixture().query.cursor)
    expect(historyUrl.searchParams.has('logical_market')).toBe(false)
    expect(historyUrl.searchParams.get('page_size')).toBe('2')
    expect(historyUrl.searchParams.get('from')).toBe(historyFixture().query.from)
  })
  it.each(['lowercase-weak', 'missing', 'wrong', 'status'] as const)('fails closed on %s HTTP metadata', async (mode) => {
    const metadata = transport(item)
    const gateway: PriceDisplayGateway = { kind: 'SYNTHETIC_TEST', read: async () => ({ ...metadata, etag: mode === 'lowercase-weak' ? `w/${metadata.etag}` : mode === 'missing' ? null : mode === 'wrong' ? '"wrong"' : metadata.etag, httpStatus: mode === 'status' ? 503 : 200 }) }
    await expect(new PriceDisplayApi(gateway).item(item.query, item.snapshot, catalogFixture)).rejects.toMatchObject({ code: 'RECORD_REJECTED' })
  })
  it('rejects response query drift even when the untrusted gateway tries to mutate the request', async () => {
    const request = structuredClone(item.query)
    const gateway: PriceDisplayGateway = { kind: 'SYNTHETIC_TEST', read: async (input) => {
      expect(Object.isFrozen(input)).toBe(true)
      expect(Object.isFrozen(input.query)).toBe(true)
      expect(() => Object.assign(input.query, { known_at: 'different' })).toThrow()
      const wrong = itemFixture()
      wrong.query.known_at = '2026-09-04T00:00:00.000000Z'
      return transport(resealPrice(wrong))
    } }
    await expect(new PriceDisplayApi(gateway).item(request, item.snapshot, catalogFixture)).rejects.toThrow()
    expect(request).toEqual(item.query)
  })
  it('does not start a request for an invalid identifier, foreign query field or invalid cursor', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const gateway = new HttpPriceDisplayGateway({ fetcher })
    await expect(gateway.read({ ...itemRequest, query: { ...item.query, analysis_unit_id: '\0' } })).rejects.toThrow()
    await expect(gateway.read({ ...itemRequest, query: Object.assign({ ...item.query }, { provider_url: 'no' }) })).rejects.toThrow()
    await expect(gateway.read({ kind: 'PRICE_HISTORY', query: { ...historyFixture().query, cursor: 'YQ' } })).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })
  it.each(['\ufeff{}', '{"x":1,"x":2}', '{"x":1.0}', '{"x":1e0}', '{"x":"\\ud800"}'])('strictly rejects raw JSON before Schema admission', async (text) => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(new TextEncoder().encode(text), { headers: { 'Content-Type': 'application/json' } }))
    await expect(new HttpPriceDisplayGateway({ fetcher }).read(itemRequest)).rejects.toMatchObject({ code: 'INVALID_JSON_RESPONSE' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('bounds response bytes and validates UTF8 without reflecting contents', async () => {
    for (const response of [new Response(new Uint8Array([0xff]), { headers: { 'Content-Type': 'application/json' } }), new Response('{}', { headers: { 'Content-Type': 'application/json', 'Content-Length': '8388609' } })]) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response)
      await expect(new HttpPriceDisplayGateway({ fetcher }).read(itemRequest)).rejects.toThrow(/bounded JSON fetch failed/u)
      expect(fetcher).toHaveBeenCalledTimes(1)
    }
  })
  it('retains the 15s default deadline through a stalled body and never retries', async () => {
    vi.useFakeTimers()
    const canceled = vi.fn()
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(new ReadableStream({ start() {}, cancel: canceled }), { headers: { 'Content-Type': 'application/json' } }))
    const operation = new HttpPriceDisplayGateway({ fetcher }).read(itemRequest)
    const failure = expect(operation).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' })
    await vi.advanceTimersByTimeAsync(15_001)
    await failure
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(canceled).toHaveBeenCalledTimes(1)
  })
  it('aborts the body when the item is no longer selected', async () => {
    const parent = new AbortController(), canceled = vi.fn()
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(new ReadableStream({ start() {}, cancel: canceled }), { headers: { 'Content-Type': 'application/json' } }))
    const operation = new HttpPriceDisplayGateway({ fetcher }).read(itemRequest, { signal: parent.signal })
    const failure = expect(operation).rejects.toMatchObject({ name: 'AbortError' })
    await Promise.resolve(); await Promise.resolve()
    parent.abort()
    await failure
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

describe('descriptor-first runtime and page accumulation', () => {
  it('keeps original discovery known_at instead of either seal time', async () => {
    const read = vi.fn<PriceDisplayGateway['read']>().mockResolvedValueOnce(transport(snapshotsFixture())).mockResolvedValueOnce(transport(item))
    const result = await loadCurrentPrice({ kind: 'SYNTHETIC_TEST', read }, context)
    expect(result).toEqual(item)
    expect(read).toHaveBeenCalledTimes(2)
    const second = read.mock.calls[1][0]
    expect(second).toEqual({ kind: 'PRICE_ITEM', query: item.query })
    expect(second.query.known_at).not.toBe(item.snapshot.available_at)
    expect(second.query.known_at).not.toBe(catalogFixture.available_at)
  })
  it('does not invent a snapshot from now or fall back after empty discovery', async () => {
    const empty = snapshotsFixture(); empty.items = []
    const read = vi.fn<PriceDisplayGateway['read']>().mockResolvedValue(transport(resealPrice(empty)))
    await expect(loadCurrentPrice({ kind: 'SYNTHETIC_TEST', read }, context)).rejects.toMatchObject({ code: 'NO_COMPATIBLE_SNAPSHOT' })
    expect(read).toHaveBeenCalledTimes(1)
  })
  it('stops after an error on the selected snapshot instead of trying an older one', async () => {
    const read = vi.fn<PriceDisplayGateway['read']>().mockResolvedValueOnce(transport(snapshotsFixture())).mockRejectedValueOnce(new Error('controlled transport failure'))
    await expect(loadCurrentPrice({ kind: 'SYNTHETIC_TEST', read }, context)).rejects.toThrow()
    expect(read).toHaveBeenCalledTimes(2)
  })
  it('accumulates actual source rows from 2+1 pages, preserving the published historical FX policy', () => {
    const first = decodePriceDisplayDocument(historyFixture()), next = decodePriceDisplayDocument(historyNextFixture())
    if (first.response_kind !== 'PRICE_HISTORY' || next.response_kind !== 'PRICE_HISTORY') throw new Error('fixture kind')
    const view = toPriceHistoryPanelState([first, next])
    expect(view.rows).toHaveLength(3)
    expect(view.rows[0].fx?.conversionPolicy).toBe('ecb-eur-cross-daily/2')
    expect(view.rows[0].amounts.CNY).toMatchObject({ amount: '67.20' })
    const tampered = historyNextFixture()
    tampered.items[0].item_id = '42'
    const decoded = decodePriceDisplayDocument(resealPrice(tampered))
    if (decoded.response_kind !== 'PRICE_HISTORY') throw new Error('fixture kind')
    expect(() => toPriceHistoryPanelState([first, decoded])).toThrow()
    expect(() => toPriceHistoryPanelState([next])).toThrow()
    expect(() => toPriceHistoryPanelState([first, next, next])).toThrow()
  })
  it('uses a UTC inclusive-day form but the exact half-open wire interval', () => {
    const descriptor = historyFixture().snapshot
    const range = initialPriceHistoryRange(descriptor)
    expect(range).toMatchObject({ fromDate: '2026-08-01', throughDate: '2026-08-30' })
    const query = priceHistoryQuery(context, descriptor, { ...range, source: 'PROVIDER_AGGREGATE', quoteKind: 'BID' })
    expect(query).toMatchObject({ from: '2026-08-01T00:00:00.000000Z', to: '2026-08-31T00:00:00.000000Z', quote_origin: 'PROVIDER_AGGREGATE', logical_market: null, quote_kind: 'BID', known_at: context.knownAt })
    expect(() => priceHistoryQuery(context, descriptor, { ...range, fromDate: '2020-01-01' })).toThrow()
    expect(() => priceHistoryQuery(context, descriptor, { ...range, fromDate: '2026-08-31' })).toThrow()
  })
})
