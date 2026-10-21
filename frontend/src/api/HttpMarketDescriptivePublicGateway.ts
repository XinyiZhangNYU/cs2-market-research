import {
  BoundedJsonFetchError,
  boundedJsonFetch,
  boundedJsonTimeout,
  type BoundedJsonFetchFailure,
} from './boundedJsonFetch'
import type {
  MarketDescriptivePublicGateway,
  MarketDescriptiveReadOptions,
  MarketDescriptiveTransportResponse,
} from './MarketDescriptivePublicApi'
import type { MarketDescriptiveDecodeRequest } from '../wire/marketDescriptivePublicApiDecode'

const PREFIX = '/api/v1/market-descriptive/public'
const MAX_RESPONSE_BYTES = 1024 * 1024

export type MarketDescriptiveTransportFailure =
  | BoundedJsonFetchFailure
  | 'HTTP_STATUS_MISMATCH'

export class MarketDescriptiveTransportError extends Error {
  constructor(
    readonly code: MarketDescriptiveTransportFailure,
    readonly retryable: boolean,
    readonly httpStatus: number | null = null,
  ) {
    super(`market descriptive gateway failed: ${code}`)
    this.name = 'MarketDescriptiveTransportError'
  }
}

function identifiesMarketDescriptive(payload: unknown): boolean {
  return payload !== null && typeof payload === 'object' &&
    (payload as { contract_name?: unknown }).contract_name === 'market-descriptive-public-api'
}

function requestPath(request: MarketDescriptiveDecodeRequest): string {
  const search = new URLSearchParams()
  if (request.query.publication_id !== null) search.set('publication', request.query.publication_id)
  const suffix = request.kind === 'SCOPE' ? `/scopes/${request.query.scope_token}` : ''
  const query = search.toString()
  return `${PREFIX}${suffix}${query.length === 0 ? '' : `?${query}`}`
}

export class HttpMarketDescriptivePublicGateway implements MarketDescriptivePublicGateway {
  readonly kind = 'HTTP_MARKET_DESCRIPTIVE_PUBLIC' as const
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: { fetcher?: typeof fetch; timeoutMs?: number } = {}) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  async read(
    request: MarketDescriptiveDecodeRequest,
    options: MarketDescriptiveReadOptions = {},
  ): Promise<MarketDescriptiveTransportResponse> {
    let response: Awaited<ReturnType<typeof boundedJsonFetch>>
    try {
      response = await boundedJsonFetch(requestPath(request), {
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
        maxBytes: MAX_RESPONSE_BYTES,
      })
    } catch (error) {
      if (!(error instanceof BoundedJsonFetchError)) throw error
      throw new MarketDescriptiveTransportError(
        error.code,
        error.httpStatus === null || error.httpStatus >= 500,
        error.httpStatus,
      )
    }
    if (!((response.status >= 200 && response.status < 300) || identifiesMarketDescriptive(response.payload))) {
      throw new MarketDescriptiveTransportError(
        'HTTP_STATUS_MISMATCH',
        response.status >= 500,
        response.status,
      )
    }
    return Object.freeze({ payload: response.payload, httpStatus: response.status })
  }
}
