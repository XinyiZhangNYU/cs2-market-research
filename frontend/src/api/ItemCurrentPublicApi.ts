import {
  decodeItemCurrentDocument,
  isDecodedItemCurrentDocument,
  ItemCurrentValidationError,
  type ItemCurrentDecodeRequest,
} from '../wire/itemCurrentPublicApiDecode'
import type {
  ItemCurrentDetailQuery,
  ItemCurrentDocument,
  ItemCurrentListQuery,
} from '../wire/itemCurrentPublicApiTypes'

export type ItemCurrentReadOptions = Readonly<{ signal?: AbortSignal }>
export type ItemCurrentTransportResponse = Readonly<{ payload: unknown; httpStatus: number }>

export interface ItemCurrentPublicGateway {
  readonly kind: string
  read(request: ItemCurrentDecodeRequest, options?: ItemCurrentReadOptions): Promise<ItemCurrentTransportResponse>
}

export class ItemCurrentAvailabilityError extends Error {
  constructor(readonly httpStatus: number | null) {
    super('item current service is temporarily unavailable')
    this.name = 'ItemCurrentAvailabilityError'
  }
}

const SHA256 = /^[0-9a-f]{64}$/u
const CURSOR = /^[A-Za-z0-9_-]{1,4096}$/u

function assertRequest(request: ItemCurrentDecodeRequest): void {
  if (request.kind === 'DETAIL') {
    if (Object.keys(request.query).sort().join(',') !== 'publication_id,stage_token' ||
        !SHA256.test(request.query.publication_id) || !SHA256.test(request.query.stage_token)) {
      throw new TypeError('invalid item current detail query')
    }
    return
  }
  if (Object.keys(request.query).sort().join(',') !== 'cursor,name_query,page_size,publication_id,sort' ||
      !['RELIABLE_SIGNAL_DESC', 'DETECTED_DESC', 'SUPPLY_CONTRACTION_DESC'].includes(request.query.sort) ||
      !Number.isInteger(request.query.page_size) || request.query.page_size < 1 || request.query.page_size > 100 ||
      (request.query.publication_id !== null && !SHA256.test(request.query.publication_id)) ||
      (request.query.cursor !== null && !CURSOR.test(request.query.cursor)) ||
      (request.query.name_query !== null &&
        (request.query.name_query !== request.query.name_query.trim() ||
          request.query.name_query.length < 1 || request.query.name_query.length > 100)) ||
      (request.query.cursor !== null && request.query.publication_id === null)) {
    throw new TypeError('invalid item current list query')
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

export class ItemCurrentPublicApi {
  constructor(private readonly gateway: ItemCurrentPublicGateway) {
    if (!gateway || typeof gateway.read !== 'function') throw new TypeError('ItemCurrentPublicApi requires a gateway')
  }

  private async receive(request: ItemCurrentDecodeRequest, options: ItemCurrentReadOptions): Promise<ItemCurrentDocument> {
    options.signal?.throwIfAborted()
    assertRequest(request)
    const protectedRequest = deepFreeze(structuredClone(request)) as ItemCurrentDecodeRequest
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await this.gateway.read(protectedRequest, options)
      options.signal?.throwIfAborted()
      try {
        const document = decodeItemCurrentDocument(response.payload, protectedRequest, response.httpStatus)
        if (!isDecodedItemCurrentDocument(document)) throw new TypeError('item current decoder returned an unsealed document')
        return document
      } catch (error) {
        // Edge/origin failures can be JSON without being a publication document.
        // Preserve valid contract errors (including CORRUPT_PUBLICATION) above.
        if (error instanceof ItemCurrentValidationError && response.httpStatus >= 500) {
          throw new ItemCurrentAvailabilityError(response.httpStatus)
        }
        if (!(error instanceof ItemCurrentValidationError) || attempt === 1) throw error
      }
    }
    throw new ItemCurrentValidationError()
  }

  async list(query: ItemCurrentListQuery, options: ItemCurrentReadOptions = {}): Promise<ItemCurrentDocument> {
    return await this.receive({ kind: 'LIST', query }, options)
  }

  async detail(query: ItemCurrentDetailQuery, options: ItemCurrentReadOptions = {}): Promise<ItemCurrentDocument> {
    return await this.receive({ kind: 'DETAIL', query }, options)
  }
}
