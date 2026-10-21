import {
  BoundedJsonFetchError,
  boundedJsonFetch,
  boundedJsonTimeout,
  type BoundedJsonFetchFailure,
} from './boundedJsonFetch'
import type {
  MarketSectorIndexPublicGateway,
  MarketSectorIndexLegacyApiVersion,
  MarketSectorIndexReadOptions,
  MarketSectorIndexTransportResponse,
  MarketSectorIndexVersionedTransportResponse,
} from './MarketSectorIndexPublicApi'
import type { MarketSectorIndexDecodeRequest } from '../wire/marketSectorIndexPublicApiDecode'
import type { MarketSectorIndexRequestV3 } from '../wire/marketSectorIndexPublicApiV3Types'

const V1_PREFIX = '/api/v1/market-index/public'
const V2_PREFIX = '/api/v2/market-index/public'
const V3_PREFIX = '/api/v3/market-index/public'
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024

export type MarketSectorIndexTransportFailure =
  | BoundedJsonFetchFailure
  | 'HTTP_STATUS_MISMATCH'

export class MarketSectorIndexTransportError extends Error {
  constructor(
    readonly code: MarketSectorIndexTransportFailure,
    readonly retryable: boolean,
    readonly httpStatus: number | null = null,
  ) {
    super(`market/sector index gateway failed: ${code}`)
    this.name = 'MarketSectorIndexTransportError'
  }
}

function requestPath(request: MarketSectorIndexDecodeRequest, version: '1' | '2'): string {
  if (request.kind === 'DIRECTORY' && version !== '1') throw new TypeError('V2 has no directory route')
  const search = new URLSearchParams()
  const values = request.kind === 'DIRECTORY'
    ? { publication: request.query.publication_id }
    : {
        publication: request.query.publication_id,
        from: request.query.from_date,
        to: request.query.to_date,
        after: request.query.after_date,
        limit: request.query.limit,
      }
  for (const [key, value] of Object.entries(values)) {
    if (value !== null) search.set(key, String(value))
  }
  const suffix = request.kind === 'DIRECTORY'
    ? '/scopes'
    : `/scopes/${request.query.scope_token}/points`
  const query = search.toString()
  const prefix = version === '2' ? V2_PREFIX : V1_PREFIX
  return `${prefix}${suffix}${query.length === 0 ? '' : `?${query}`}`
}

function identifiesMarketIndex(payload: unknown): boolean {
  return payload !== null && typeof payload === 'object' &&
    (payload as { contract_name?: unknown }).contract_name === 'market-sector-index-public-api'
}

export class HttpMarketSectorIndexPublicGateway implements MarketSectorIndexPublicGateway {
  readonly kind = 'HTTP_MARKET_SECTOR_INDEX_PUBLIC_V2_WITH_V1_FALLBACK' as const
  readonly preferredSeriesVersion = '3' as const
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: { fetcher?: typeof fetch; timeoutMs?: number } = {}) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  private async fetchPath(
    path: string,
    options: MarketSectorIndexReadOptions,
  ): Promise<MarketSectorIndexTransportResponse> {
    if (new TextEncoder().encode(path).byteLength > 16_384) throw new TypeError('Market index request URL exceeds limit')
    let response: Awaited<ReturnType<typeof boundedJsonFetch>>
    try {
      response = await boundedJsonFetch(path, {
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
        priority: options.priority,
        timeoutMs: this.timeoutMs,
        maxBytes: MAX_RESPONSE_BYTES,
      })
    } catch (error) {
      if (!(error instanceof BoundedJsonFetchError)) throw error
      throw new MarketSectorIndexTransportError(
        error.code,
        error.httpStatus === null || error.httpStatus >= 500,
        error.httpStatus,
      )
    }
    return Object.freeze({ payload: response.payload, httpStatus: response.status })
  }

  private requireMarketIndexOrSuccess(
    response: MarketSectorIndexTransportResponse,
  ): MarketSectorIndexTransportResponse {
    if (
      (response.httpStatus >= 200 && response.httpStatus < 300) ||
      identifiesMarketIndex(response.payload)
    ) return response
    throw new MarketSectorIndexTransportError(
      'HTTP_STATUS_MISMATCH',
      response.httpStatus >= 500,
      response.httpStatus,
    )
  }

  async read(
    request: MarketSectorIndexDecodeRequest,
    options: MarketSectorIndexReadOptions = {},
  ): Promise<MarketSectorIndexTransportResponse> {
    if (request.kind === 'DIRECTORY') {
      return this.requireMarketIndexOrSuccess(
        await this.fetchPath(requestPath(request, '1'), options),
      )
    }
    const selected = await this.readSeriesPage(request, null, options)
    return Object.freeze({ payload: selected.payload, httpStatus: selected.httpStatus })
  }

  async readSeriesPage(
    request: Extract<MarketSectorIndexDecodeRequest, { kind: 'SERIES' }>,
    selectedVersion: MarketSectorIndexLegacyApiVersion | null,
    options: MarketSectorIndexReadOptions = {},
  ): Promise<MarketSectorIndexVersionedTransportResponse> {
    if (selectedVersion !== null) {
      const response = this.requireMarketIndexOrSuccess(
        await this.fetchPath(requestPath(request, selectedVersion), options),
      )
      return Object.freeze({ ...response, apiVersion: selectedVersion })
    }
    const v2 = await this.fetchPath(requestPath(request, '2'), options)
    // Only an unmistakably absent route may fall back. A V2 contract error
    // remains visible and can never be disguised as older historical data.
    if (v2.httpStatus !== 404 || identifiesMarketIndex(v2.payload)) {
      const response = this.requireMarketIndexOrSuccess(v2)
      return Object.freeze({ ...response, apiVersion: '2' as const })
    }
    const v1 = this.requireMarketIndexOrSuccess(
      await this.fetchPath(requestPath(request, '1'), options),
    )
    return Object.freeze({ ...v1, apiVersion: '1' as const })
  }

  async readDirectoryV3(
    request: MarketSectorIndexRequestV3,
    options: MarketSectorIndexReadOptions = {},
  ): Promise<MarketSectorIndexTransportResponse> {
    const search = new URLSearchParams()
    if (request.query.publication_id !== null) search.set('publication', request.query.publication_id)
    let suffix = '/scope-groups'
    if (request.kind === 'SCOPES') {
      suffix = '/scopes'
      search.set('group', request.query.group)
      if (request.query.after !== null) search.set('after', request.query.after)
      search.set('limit', String(request.query.limit))
    } else if (request.kind === 'SERIES') {
      suffix = `/scopes/${request.query.scope_token}/points`
      if (request.query.from_date !== null) search.set('from', request.query.from_date)
      if (request.query.to_date !== null) search.set('to', request.query.to_date)
      if (request.query.after_date !== null) search.set('after', request.query.after_date)
      search.set('limit', String(request.query.limit))
    }
    const query = search.toString()
    return this.requireMarketIndexOrSuccess(
      await this.fetchPath(`${V3_PREFIX}${suffix}${query.length === 0 ? '' : `?${query}`}`, options),
    )
  }
}





