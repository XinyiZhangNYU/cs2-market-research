import {
  decodeItemHistoryDocument,
  isDecodedItemHistoryDocument,
  ItemHistoryValidationError,
  type ItemHistoryDecodeRequest,
} from '../wire/itemHistoryPublicApiDecode'
import type {
  ItemHistoryDetailQuery,
  ItemHistoryDocument,
  ItemHistoryListQuery,
} from '../wire/itemHistoryPublicApiTypes'

export type ItemHistoryReadOptions = Readonly<{ signal?: AbortSignal }>
export type ItemHistoryTransportResponse = Readonly<{ payload: unknown; httpStatus: number }>

export interface ItemHistoryPublicGateway {
  readonly kind: string
  read(request: ItemHistoryDecodeRequest, options?: ItemHistoryReadOptions): Promise<ItemHistoryTransportResponse>
}

export class ItemHistoryAvailabilityError extends Error {
  constructor(readonly httpStatus: number | null) {
    super('item history service is temporarily unavailable')
    this.name = 'ItemHistoryAvailabilityError'
  }
}

const SHA256 = /^[0-9a-f]{64}$/u
const CURSOR = /^[A-Za-z0-9_-]{1,4096}$/u

function assertRequest(request: ItemHistoryDecodeRequest): void {
  if (request.kind === 'DETAIL') {
    if (Object.keys(request.query).sort().join(',') !== 'history_event_token,publication_id' ||
        !SHA256.test(request.query.publication_id) || !SHA256.test(request.query.history_event_token)) {
      throw new TypeError('invalid item history detail query')
    }
    return
  }
  if (Object.keys(request.query).sort().join(',') !== 'cursor,name_query,page_size,publication_id,sort' ||
      !['MAX_PRICE_MULTIPLE_DESC', 'SUPPLY_ONSET_DESC'].includes(request.query.sort) ||
      !Number.isInteger(request.query.page_size) || request.query.page_size < 1 || request.query.page_size > 100 ||
      (request.query.publication_id !== null && !SHA256.test(request.query.publication_id)) ||
      (request.query.cursor !== null && !CURSOR.test(request.query.cursor)) ||
      (request.query.name_query !== null &&
        (request.query.name_query !== request.query.name_query.trim() ||
          request.query.name_query.length < 1 || request.query.name_query.length > 100)) ||
      (request.query.cursor !== null && request.query.publication_id === null)) {
    throw new TypeError('invalid item history list query')
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

export class ItemHistoryPublicApi {
  constructor(private readonly gateway: ItemHistoryPublicGateway) {
    if (!gateway || typeof gateway.read !== 'function') throw new TypeError('ItemHistoryPublicApi requires a gateway')
  }

  private async receive(request: ItemHistoryDecodeRequest, options: ItemHistoryReadOptions): Promise<ItemHistoryDocument> {
    options.signal?.throwIfAborted()
    assertRequest(request)
    const protectedRequest = deepFreeze(structuredClone(request)) as ItemHistoryDecodeRequest
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await this.gateway.read(protectedRequest, options)
      options.signal?.throwIfAborted()
      try {
        const document = decodeItemHistoryDocument(response.payload, protectedRequest, response.httpStatus)
        if (!isDecodedItemHistoryDocument(document)) throw new TypeError('item history decoder returned an unsealed document')
        return document
      } catch (error) {
        if (error instanceof ItemHistoryValidationError && response.httpStatus >= 500) {
          throw new ItemHistoryAvailabilityError(response.httpStatus)
        }
        if (!(error instanceof ItemHistoryValidationError) || attempt === 1) throw error
      }
    }
    throw new ItemHistoryValidationError()
  }

  async list(query: ItemHistoryListQuery, options: ItemHistoryReadOptions = {}): Promise<ItemHistoryDocument> {
    return await this.receive({ kind: 'LIST', query }, options)
  }

  async detail(query: ItemHistoryDetailQuery, options: ItemHistoryReadOptions = {}): Promise<ItemHistoryDocument> {
    return await this.receive({ kind: 'DETAIL', query }, options)
  }
}
