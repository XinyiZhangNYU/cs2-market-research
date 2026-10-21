import {
  decodePublicObservationDocument,
  isDecodedPublicObservationDocument,
  type PublicObservationDecodeRequest,
} from '../wire/marketWatchlistObservationApiDecode'
import type {
  ObservationDetailQuery,
  ObservationListQuery,
  PublicObservationDetailResponse,
  PublicObservationDocument,
  PublicObservationErrorResponse,
  PublicObservationWatchlistResponse,
} from '../wire/marketWatchlistObservationApiTypes'

export type ObservationRequest = PublicObservationDecodeRequest
export type ObservationReadOptions = Readonly<{ signal?: AbortSignal }>
export type TransportResponse = Readonly<{ payload: unknown; httpStatus: number }>

export interface MarketWatchlistObservationGateway {
  readonly kind: string
  read(
    request: ObservationRequest,
    options?: ObservationReadOptions,
  ): Promise<TransportResponse>
}

const UTC_MICROSECOND =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{6}Z$/u
const SHA256 = /^[0-9a-f]{64}$/u
const SAFE_CURSOR = /^[A-Za-z0-9_-]{1,8192}$/u
const CONTROL_OR_SURROGATE = /[\u0000-\u001f\u007f\ud800-\udfff]/u

function exactKeys(value: object, expected: readonly string[]): boolean {
  return Object.keys(value).sort().join('\u0000') === [...expected].sort().join('\u0000')
}

function validInstant(value: string | null): boolean {
  if (value === null) return true
  if (!UTC_MICROSECOND.test(value)) return false
  const milliseconds = Date.parse(value)
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === `${value.slice(0, 23)}Z`
}

function validIdentifier(value: string): boolean {
  return (
    typeof value === 'string' &&
    [...value].length >= 1 &&
    [...value].length <= 256 &&
    !CONTROL_OR_SURROGATE.test(value) &&
    new TextEncoder().encode(value).byteLength <= 1024
  )
}

function assertRequest(request: ObservationRequest): void {
  if (request.kind === 'OBSERVATION_WATCHLIST') {
    const query = request.query
    if (
      !exactKeys(query, ['as_of', 'publication_id', 'sort', 'page_size', 'cursor']) ||
      !validInstant(query.as_of) ||
      (query.publication_id !== null && !SHA256.test(query.publication_id)) ||
      query.sort !== 'SIGNAL_TIME_DESC' ||
      !Number.isInteger(query.page_size) ||
      query.page_size < 1 ||
      query.page_size > 100 ||
      (query.cursor !== null && !SAFE_CURSOR.test(query.cursor))
    ) {
      throw new TypeError('invalid observation watchlist query')
    }
    return
  }
  const query = request.query
  if (
    !exactKeys(query, ['publication_id', 'analysis_unit_id']) ||
    !SHA256.test(query.publication_id) ||
    !validIdentifier(query.analysis_unit_id)
  ) {
    throw new TypeError('invalid observation detail query')
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

export type ObservationWatchlistDocument =
  | PublicObservationWatchlistResponse
  | PublicObservationErrorResponse
export type ObservationDetailDocument =
  | PublicObservationDetailResponse
  | PublicObservationErrorResponse

export class MarketWatchlistObservationApi {
  constructor(private readonly gateway: MarketWatchlistObservationGateway) {
    if (!gateway || typeof gateway.read !== 'function') {
      throw new TypeError('MarketWatchlistObservationApi requires a gateway')
    }
  }

  private async receive(
    request: ObservationRequest,
    options: ObservationReadOptions,
  ): Promise<PublicObservationDocument> {
    options.signal?.throwIfAborted()
    assertRequest(request)
    const protectedRequest = deepFreeze(structuredClone(request)) as ObservationRequest
    const response = await this.gateway.read(protectedRequest, options)
    options.signal?.throwIfAborted()
    const document = decodePublicObservationDocument(
      response.payload,
      protectedRequest,
      response.httpStatus,
    )
    if (!isDecodedPublicObservationDocument(document)) {
      throw new TypeError('public observation decoder returned an unsealed document')
    }
    return document
  }

  async watchlist(
    query: ObservationListQuery,
    options: ObservationReadOptions = {},
  ): Promise<ObservationWatchlistDocument> {
    return await this.receive(
      { kind: 'OBSERVATION_WATCHLIST', query },
      options,
    ) as ObservationWatchlistDocument
  }

  async detail(
    query: ObservationDetailQuery,
    options: ObservationReadOptions = {},
  ): Promise<ObservationDetailDocument> {
    return await this.receive(
      { kind: 'OBSERVATION_DETAIL', query },
      options,
    ) as ObservationDetailDocument
  }
}
