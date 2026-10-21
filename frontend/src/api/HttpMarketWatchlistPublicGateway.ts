import { boundedJsonFetch, boundedJsonTimeout } from './boundedJsonFetch'
import type {
  MarketWatchlistPublicGateway,
  PublicResultReadOptions,
  PublicResultRequest,
  PublicResultTransportResponse,
} from './MarketWatchlistPublicApi'
import { priceAnalysisUnitToken } from '../wire/priceDisplayPrimitives'

const PUBLIC_RESULTS_PREFIX = '/api/v1/research-results/public'
const MAX_PUBLIC_RESULT_BYTES = 1024 * 1024

function queryString(values: Readonly<Record<string, string | number | null>>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value === null) continue
    search.set(key, String(value))
  }
  const value = search.toString()
  return value.length === 0 ? '' : `?${value}`
}

function requestPath(request: PublicResultRequest): string {
  if (request.kind === 'MARKET_OVERVIEW') {
    return `${PUBLIC_RESULTS_PREFIX}/market${queryString({ as_of: request.query.as_of })}`
  }
  if (request.kind === 'MARKET_HISTORY') {
    return `${PUBLIC_RESULTS_PREFIX}/market/history${queryString({
      as_of: request.query.as_of,
      page_size: request.query.page_size,
      cursor: request.query.cursor,
    })}`
  }
  if (request.kind === 'WATCHLIST') {
    return `${PUBLIC_RESULTS_PREFIX}/watchlist${queryString({
      as_of: request.query.as_of,
      publication_id: request.query.publication_id,
      sort: request.query.sort,
      page_size: request.query.page_size,
      cursor: request.query.cursor,
    })}`
  }
  const token = priceAnalysisUnitToken(request.query.analysis_unit_id)
  const suffix = request.kind === 'WATCHLIST_HISTORY' ? '/history' : ''
  if (request.kind === 'WATCHLIST_HISTORY') {
    return `${PUBLIC_RESULTS_PREFIX}/watchlist/${token}${suffix}${queryString({
      publication_id: request.query.publication_id,
      page_size: request.query.page_size,
      cursor: request.query.cursor,
    })}`
  }
  return `${PUBLIC_RESULTS_PREFIX}/watchlist/${token}${queryString({
    publication_id: request.query.publication_id,
  })}`
}

export class HttpMarketWatchlistPublicGateway implements MarketWatchlistPublicGateway {
  readonly kind = 'HTTP_MARKET_WATCHLIST_PUBLIC' as const
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: { fetcher?: typeof fetch; timeoutMs?: number } = {}) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  async read(
    request: PublicResultRequest,
    options: PublicResultReadOptions = {},
  ): Promise<PublicResultTransportResponse> {
    const url = requestPath(request)
    if (new TextEncoder().encode(url).byteLength > 16_384) {
      throw new TypeError('public result request URL exceeds limit')
    }
    const response = await boundedJsonFetch(url, {
      fetcher: this.fetcher,
      init: {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin',
        referrerPolicy: 'no-referrer',
        redirect: 'error',
      },
      signal: options.signal,
      timeoutMs: this.timeoutMs,
      maxBytes: MAX_PUBLIC_RESULT_BYTES,
    })
    return Object.freeze({ payload: response.payload, httpStatus: response.status })
  }
}
