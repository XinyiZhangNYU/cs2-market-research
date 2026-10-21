import {
  decodeMarketDescriptiveDocument,
  isDecodedMarketDescriptiveDocument,
  type MarketDescriptiveDecodeRequest,
} from '../wire/marketDescriptivePublicApiDecode'
import { nativeMarketProjection } from './NativeCnyMarketGateways'
import type {
  MarketDescriptiveDocument,
  MarketDescriptiveOverviewQuery,
  MarketDescriptiveScopeQuery,
} from '../wire/marketDescriptivePublicApiTypes'

export type MarketDescriptiveReadOptions = Readonly<{ signal?: AbortSignal }>
export type MarketDescriptiveTransportResponse = Readonly<{ payload: unknown; httpStatus: number }>

export interface MarketDescriptivePublicGateway {
  readonly kind: string
  read(
    request: MarketDescriptiveDecodeRequest,
    options?: MarketDescriptiveReadOptions,
  ): Promise<MarketDescriptiveTransportResponse>
}

const SHA256 = /^[0-9a-f]{64}$/u

function assertRequest(request: MarketDescriptiveDecodeRequest): void {
  if (request.kind === 'OVERVIEW') {
    if (Object.keys(request.query).join('') !== 'publication_id') throw new TypeError('invalid descriptive overview query')
    if (request.query.publication_id !== null && !SHA256.test(request.query.publication_id)) {
      throw new TypeError('invalid descriptive publication id')
    }
    return
  }
  if (Object.keys(request.query).sort().join(',') !== 'publication_id,scope_token') {
    throw new TypeError('invalid descriptive scope query')
  }
  if (!SHA256.test(request.query.publication_id) || !SHA256.test(request.query.scope_token)) {
    throw new TypeError('invalid descriptive scope identity')
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

export class MarketDescriptivePublicApi {
  constructor(private readonly gateway: MarketDescriptivePublicGateway) {
    if (!gateway || typeof gateway.read !== 'function') {
      throw new TypeError('MarketDescriptivePublicApi requires a gateway')
    }
  }

  private async receive(
    request: MarketDescriptiveDecodeRequest,
    options: MarketDescriptiveReadOptions,
  ): Promise<MarketDescriptiveDocument> {
    options.signal?.throwIfAborted()
    assertRequest(request)
    const protectedRequest = deepFreeze(structuredClone(request)) as MarketDescriptiveDecodeRequest
    const response = await this.gateway.read(protectedRequest, options)
    options.signal?.throwIfAborted()
    const native = nativeMarketProjection('descriptive', response.payload, protectedRequest)
    if (native !== null) return native
    const document = decodeMarketDescriptiveDocument(response.payload, protectedRequest, response.httpStatus)
    if (!isDecodedMarketDescriptiveDocument(document)) {
      throw new TypeError('market descriptive decoder returned an unsealed document')
    }
    return document
  }

  async overview(
    query: MarketDescriptiveOverviewQuery,
    options: MarketDescriptiveReadOptions = {},
  ): Promise<MarketDescriptiveDocument> {
    return await this.receive({ kind: 'OVERVIEW', query }, options)
  }

  async scope(
    query: MarketDescriptiveScopeQuery,
    options: MarketDescriptiveReadOptions = {},
  ): Promise<MarketDescriptiveDocument> {
    return await this.receive({ kind: 'SCOPE', query }, options)
  }
}
