import { boundedJsonFetch, boundedJsonTimeout } from './boundedJsonFetch'
import type { PriceDisplayGateway, PriceReadOptions, PriceRequest, PriceTransportResponse } from './PriceDisplayApi'
import { parsePriceJson } from '../wire/priceDisplayJson'
import { decodePriceCursor, priceAnalysisUnitToken, priceAssert, validatePriceQuery } from '../wire/priceDisplayPrimitives'

export class HttpPriceDisplayGateway implements PriceDisplayGateway {
  readonly kind = 'HTTP_PRICE_DISPLAY' as const
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: { fetcher?: typeof fetch; timeoutMs?: number } = {}) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  async read(request: PriceRequest, options: PriceReadOptions = {}): Promise<PriceTransportResponse> {
    validatePriceQuery(request.query, request.kind)
    if (request.kind === 'PRICE_HISTORY') decodePriceCursor(request.query)
    const prefix = '/api/v1/price-display'
    const path = request.kind === 'PRICE_SNAPSHOT_LIST'
      ? `${prefix}/snapshots`
      : `${prefix}/items/${priceAnalysisUnitToken(request.query.analysis_unit_id)}${request.kind === 'PRICE_HISTORY' ? '/history' : ''}`
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(request.query)) {
      if (key !== 'analysis_unit_id' && value !== null) search.set(key, String(value))
    }
    const url = `${path}?${search}`
    priceAssert(new TextEncoder().encode(url).byteLength <= 16_384)
    let etag: string | null = null
    const response = await boundedJsonFetch(url, {
      fetcher: async (input, init) => {
        const result = await this.fetcher(input, init)
        etag = result.headers.get('etag')
        return result
      },
      init: {
        method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store',
        credentials: 'same-origin', referrerPolicy: 'no-referrer', redirect: 'error',
      },
      signal: options.signal,
      timeoutMs: this.timeoutMs,
      parseJson: parsePriceJson,
    })
    return Object.freeze({ payload: response.payload, httpStatus: response.status, etag })
  }
}
