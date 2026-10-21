import {
  decodePublicResultDocument,
  isDecodedPublicResultDocument,
  type PublicResultDecodeRequest,
} from '../wire/marketWatchlistPublicApiDecode'
import type {
  MarketHistoryQuery,
  MarketOverviewQuery,
  PublicMarketHistoryResponse,
  PublicMarketOverviewResponse,
  PublicResultDocument,
  PublicResultErrorResponse,
  PublicWatchlistDetailResponse,
  PublicWatchlistHistoryResponse,
  PublicWatchlistResponse,
  WatchlistDetailQuery,
  WatchlistHistoryQuery,
  WatchlistQuery,
} from '../wire/marketWatchlistPublicApiTypes'

export type PublicResultRequest = PublicResultDecodeRequest
export type PublicResultReadOptions = Readonly<{ signal?: AbortSignal }>
export type PublicResultTransportResponse = Readonly<{ payload: unknown; httpStatus: number }>

export interface MarketWatchlistPublicGateway {
  readonly kind: string
  read(
    request: PublicResultRequest,
    options?: PublicResultReadOptions,
  ): Promise<PublicResultTransportResponse>
}

const UTC_MICROSECOND =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$/u
const SHA256 = /^[0-9a-f]{64}$/u
const SAFE_CURSOR = /^[A-Za-z0-9_-]{1,16384}$/u
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/u

function exactKeys(value: object, expected: readonly string[]): boolean {
  return Object.keys(value).sort().join('\u0000') === [...expected].sort().join('\u0000')
}

function validInstant(value: string | null): boolean {
  return value === null || (UTC_MICROSECOND.test(value) && !Number.isNaN(Date.parse(value)))
}

function validCursor(value: string | null): boolean {
  return value === null || SAFE_CURSOR.test(value)
}

function validPageSize(value: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= maximum
}

function assertRequest(request: PublicResultRequest): void {
  if (request.kind === 'MARKET_OVERVIEW') {
    const query = request.query
    if (!exactKeys(query, ['as_of']) || !validInstant(query.as_of)) throw new TypeError('invalid market query')
    return
  }
  if (request.kind === 'MARKET_HISTORY') {
    const query = request.query
    if (
      !exactKeys(query, ['as_of', 'page_size', 'cursor']) ||
      !validInstant(query.as_of) ||
      !validPageSize(query.page_size, 32) ||
      !validCursor(query.cursor)
    ) throw new TypeError('invalid market history query')
    return
  }
  if (request.kind === 'WATCHLIST') {
    const query = request.query
    if (
      !exactKeys(query, ['as_of', 'publication_id', 'sort', 'page_size', 'cursor']) ||
      !validInstant(query.as_of) ||
      (query.publication_id !== null && !SHA256.test(query.publication_id)) ||
      query.sort !== 'RANK_ASC' ||
      !validPageSize(query.page_size, 100) ||
      !validCursor(query.cursor)
    ) throw new TypeError('invalid watchlist query')
    return
  }
  if (request.kind === 'WATCHLIST_DETAIL') {
    const query = request.query
    if (
      !exactKeys(query, ['as_of', 'publication_id', 'analysis_unit_id']) ||
      query.as_of !== null ||
      !SHA256.test(query.publication_id) ||
      query.analysis_unit_id.length === 0 ||
      query.analysis_unit_id.length > 512 ||
      CONTROL_CHARACTER.test(query.analysis_unit_id)
    ) throw new TypeError('invalid watchlist detail query')
    return
  }
  const query = request.query
  if (
    !exactKeys(query, ['publication_id', 'analysis_unit_id', 'page_size', 'cursor']) ||
    !SHA256.test(query.publication_id) ||
    query.analysis_unit_id.length === 0 ||
    query.analysis_unit_id.length > 512 ||
    CONTROL_CHARACTER.test(query.analysis_unit_id) ||
    !validPageSize(query.page_size, 50) ||
    !validCursor(query.cursor)
  ) throw new TypeError('invalid watchlist history query')
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

export type MarketOverviewDocument = PublicMarketOverviewResponse | PublicResultErrorResponse
export type MarketHistoryDocument = PublicMarketHistoryResponse | PublicResultErrorResponse
export type WatchlistDocument = PublicWatchlistResponse | PublicResultErrorResponse
export type WatchlistDetailDocument = PublicWatchlistDetailResponse | PublicResultErrorResponse
export type WatchlistHistoryDocument = PublicWatchlistHistoryResponse | PublicResultErrorResponse

export class MarketWatchlistPublicApi {
  constructor(private readonly gateway: MarketWatchlistPublicGateway) {
    if (!gateway || typeof gateway.read !== 'function') {
      throw new TypeError('MarketWatchlistPublicApi requires a gateway')
    }
  }

  private async receive(
    request: PublicResultRequest,
    options: PublicResultReadOptions,
  ): Promise<PublicResultDocument> {
    options.signal?.throwIfAborted()
    assertRequest(request)
    const protectedRequest = deepFreeze(structuredClone(request)) as PublicResultRequest
    const response = await this.gateway.read(protectedRequest, options)
    options.signal?.throwIfAborted()
    const document = decodePublicResultDocument(
      response.payload,
      protectedRequest,
      response.httpStatus,
    )
    if (!isDecodedPublicResultDocument(document)) {
      throw new TypeError('public result decoder returned an unsealed document')
    }
    return document
  }

  async market(
    query: MarketOverviewQuery,
    options: PublicResultReadOptions = {},
  ): Promise<MarketOverviewDocument> {
    return await this.receive({ kind: 'MARKET_OVERVIEW', query }, options) as MarketOverviewDocument
  }

  async marketHistory(
    query: MarketHistoryQuery,
    options: PublicResultReadOptions = {},
  ): Promise<MarketHistoryDocument> {
    return await this.receive({ kind: 'MARKET_HISTORY', query }, options) as MarketHistoryDocument
  }

  async watchlist(
    query: WatchlistQuery,
    options: PublicResultReadOptions = {},
  ): Promise<WatchlistDocument> {
    return await this.receive({ kind: 'WATCHLIST', query }, options) as WatchlistDocument
  }

  async watchlistDetail(
    query: WatchlistDetailQuery,
    options: PublicResultReadOptions = {},
  ): Promise<WatchlistDetailDocument> {
    return await this.receive({ kind: 'WATCHLIST_DETAIL', query }, options) as WatchlistDetailDocument
  }

  async watchlistHistory(
    query: WatchlistHistoryQuery,
    options: PublicResultReadOptions = {},
  ): Promise<WatchlistHistoryDocument> {
    return await this.receive({ kind: 'WATCHLIST_HISTORY', query }, options) as WatchlistHistoryDocument
  }
}
