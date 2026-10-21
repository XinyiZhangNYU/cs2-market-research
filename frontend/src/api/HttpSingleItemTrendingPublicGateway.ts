import { boundedJsonFetch, boundedJsonTimeout } from './boundedJsonFetch'
import type {
  SingleItemTrendingPublicGateway,
  TrendingReadOptions,
  TrendingTransportResponse,
} from './SingleItemTrendingPublicApi'
import type { TrendingListQuery } from '../wire/singleItemTrendingPublicApiTypes'

const TRENDING_PATH = '/api/v1/research-results/public/trending'
const MAX_TRENDING_BYTES = 2 * 1024 * 1024

function requestPath(query: TrendingListQuery): string {
  const search = new URLSearchParams()
  const values = {
    as_of: query.as_of,
    publication_id: query.publication_id,
    direction: query.direction,
    page_size: query.page_size,
    cursor: query.cursor,
    item_kind: query.filters.item_kind,
    base_item_code: query.filters.base_item_code,
    edition_kind: query.filters.edition_kind,
    wear_tier: query.filters.wear_tier,
  }
  for (const [key, value] of Object.entries(values)) {
    if (value !== null) search.set(key, String(value))
  }
  return `${TRENDING_PATH}?${search}`
}

export class HttpSingleItemTrendingPublicGateway implements SingleItemTrendingPublicGateway {
  readonly kind = 'HTTP_SINGLE_ITEM_TRENDING_PUBLIC' as const
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: { fetcher?: typeof fetch; timeoutMs?: number } = {}) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  async read(
    query: TrendingListQuery,
    options: TrendingReadOptions = {},
  ): Promise<TrendingTransportResponse> {
    const url = requestPath(query)
    if (new TextEncoder().encode(url).byteLength > 16_384) {
      throw new TypeError('Trending request URL exceeds limit')
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
      maxBytes: MAX_TRENDING_BYTES,
    })
    return Object.freeze({ payload: response.payload, httpStatus: response.status })
  }
}
