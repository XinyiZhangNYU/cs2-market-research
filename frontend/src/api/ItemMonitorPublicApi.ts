import {
  decodeItemMonitorDocument,
  isDecodedItemMonitorDocument,
  type ItemMonitorDecodeRequest,
} from '../wire/itemMonitorPublicApiDecode'
import type {
  ItemMonitorDetailQuery,
  ItemMonitorDocument,
  ItemMonitorListQuery,
} from '../wire/itemMonitorPublicApiTypes'

export type ItemMonitorReadOptions = Readonly<{ signal?: AbortSignal }>
export type ItemMonitorTransportResponse = Readonly<{ payload: unknown; httpStatus: number }>

export interface ItemMonitorPublicGateway {
  readonly kind: string
  read(request: ItemMonitorDecodeRequest, options?: ItemMonitorReadOptions): Promise<ItemMonitorTransportResponse>
}

const SHA256 = /^[0-9a-f]{64}$/u
const CURSOR = /^[A-Za-z0-9_-]{1,4096}$/u

function assertRequest(request: ItemMonitorDecodeRequest): void {
  if (request.kind === 'DETAIL') {
    if (Object.keys(request.query).sort().join(',') !== 'analysis_unit_token,publication_id' ||
        !SHA256.test(request.query.publication_id) || !SHA256.test(request.query.analysis_unit_token)) {
      throw new TypeError('invalid item monitor detail query')
    }
    return
  }
  if (Object.keys(request.query).sort().join(',') !== 'cursor,page_size,publication_id,sort' ||
      request.query.sort !== 'SIGNAL_TIME_DESC' || !Number.isInteger(request.query.page_size) ||
      request.query.page_size < 1 || request.query.page_size > 100 ||
      (request.query.publication_id !== null && !SHA256.test(request.query.publication_id)) ||
      (request.query.cursor !== null && !CURSOR.test(request.query.cursor)) ||
      (request.query.cursor !== null && request.query.publication_id === null)) {
    throw new TypeError('invalid item monitor list query')
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

export class ItemMonitorPublicApi {
  constructor(private readonly gateway: ItemMonitorPublicGateway) {
    if (!gateway || typeof gateway.read !== 'function') throw new TypeError('ItemMonitorPublicApi requires a gateway')
  }

  private async receive(request: ItemMonitorDecodeRequest, options: ItemMonitorReadOptions): Promise<ItemMonitorDocument> {
    options.signal?.throwIfAborted()
    assertRequest(request)
    const protectedRequest = deepFreeze(structuredClone(request)) as ItemMonitorDecodeRequest
    const response = await this.gateway.read(protectedRequest, options)
    options.signal?.throwIfAborted()
    const document = decodeItemMonitorDocument(response.payload, protectedRequest, response.httpStatus)
    if (!isDecodedItemMonitorDocument(document)) throw new TypeError('item monitor decoder returned an unsealed document')
    return document
  }

  async list(query: ItemMonitorListQuery, options: ItemMonitorReadOptions = {}): Promise<ItemMonitorDocument> {
    return await this.receive({ kind: 'LIST', query }, options)
  }

  async detail(query: ItemMonitorDetailQuery, options: ItemMonitorReadOptions = {}): Promise<ItemMonitorDocument> {
    return await this.receive({ kind: 'DETAIL', query }, options)
  }
}
