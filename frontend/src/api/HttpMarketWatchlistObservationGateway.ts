import { boundedJsonFetch, boundedJsonTimeout } from './boundedJsonFetch'
import type {
  MarketWatchlistObservationGateway,
  ObservationReadOptions,
  ObservationRequest,
  TransportResponse,
} from './MarketWatchlistObservationApi'
import { priceAnalysisUnitToken } from '../wire/priceDisplayPrimitives'

const PUBLIC_OBSERVATIONS_WATCHLIST = '/api/v1/research-observations/public/watchlist'
const MAX_PUBLIC_OBSERVATION_BYTES = 1024 * 1024

function queryString(values: Readonly<Record<string, string | number | null>>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value === null) continue
    search.set(key, String(value))
  }
  const value = search.toString()
  return value.length === 0 ? '' : `?${value}`
}

function requestPath(request: ObservationRequest): string {
  if (request.kind === 'OBSERVATION_WATCHLIST') {
    return `${PUBLIC_OBSERVATIONS_WATCHLIST}${queryString({
      as_of: request.query.as_of,
      publication_id: request.query.publication_id,
      sort: request.query.sort,
      page_size: request.query.page_size,
      cursor: request.query.cursor,
    })}`
  }
  const token = priceAnalysisUnitToken(request.query.analysis_unit_id)
  return `${PUBLIC_OBSERVATIONS_WATCHLIST}/${token}${queryString({
    publication_id: request.query.publication_id,
  })}`
}

export class HttpMarketWatchlistObservationGateway
implements MarketWatchlistObservationGateway {
  readonly kind = 'HTTP_MARKET_WATCHLIST_OBSERVATION' as const
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: { fetcher?: typeof fetch; timeoutMs?: number } = {}) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  async read(
    request: ObservationRequest,
    options: ObservationReadOptions = {},
  ): Promise<TransportResponse> {
    const url = requestPath(request)
    if (new TextEncoder().encode(url).byteLength > 16_384) {
      throw new TypeError('public observation request URL exceeds limit')
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
      maxBytes: MAX_PUBLIC_OBSERVATION_BYTES,
    })
    return Object.freeze({ payload: response.payload, httpStatus: response.status })
  }
}
