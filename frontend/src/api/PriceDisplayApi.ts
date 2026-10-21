import { decodePriceDisplayDocument, isDecodedPriceDocument } from '../wire/priceDisplayApiDecode'
import type { PriceDecodeBinding } from '../wire/priceDisplayApiDecode'
import type {
  PriceCatalogBinding, PriceDocument, PriceError, PriceHistory, PriceHistoryQuery,
  PriceItem, PriceItemQuery, PriceSnapshot, PriceSnapshotList, PriceSnapshotQuery,
} from '../wire/priceDisplayApiTypes'
import { priceAssert, validatePriceQuery } from '../wire/priceDisplayPrimitives'
import { canonicalJsonText } from '../wire/canonical'
import { SharedRead } from '../performance/sharedRead'

export type PriceRequest = Readonly<
  | { kind: 'PRICE_SNAPSHOT_LIST'; query: PriceSnapshotQuery }
  | { kind: 'PRICE_ITEM'; query: PriceItemQuery }
  | { kind: 'PRICE_HISTORY'; query: PriceHistoryQuery }
>
export type PriceReadOptions = Readonly<{ signal?: AbortSignal; reuse?: boolean }>
export type PriceTransportResponse = Readonly<{ payload: unknown; httpStatus: number; etag: string | null }>
export interface PriceDisplayGateway {
  readonly kind: string
  read(request: PriceRequest, options?: PriceReadOptions): Promise<PriceTransportResponse>
}

export class PriceReadUnavailable extends Error {
  constructor(readonly code: PriceError['error']['code'] | 'NO_COMPATIBLE_SNAPSHOT') {
    super('Price publication is unavailable')
    this.name = 'PriceReadUnavailable'
  }
}
export function requirePriceSuccess<T extends PriceDocument>(response: T): Exclude<T, PriceError> {
  if (response.response_kind === 'ERROR') throw new PriceReadUnavailable(response.error.code)
  return response as Exclude<T, PriceError>
}

export const PRICE_MEMORY_TTL_MS = 5_000
const priceReads = new WeakMap<PriceDisplayGateway, SharedRead<PriceDocument>>()
const priceReadKey = (request: PriceRequest, binding: PriceDecodeBinding) => canonicalJsonText({ request, binding })
function readsFor(gateway: PriceDisplayGateway): SharedRead<PriceDocument> {
  let reads = priceReads.get(gateway)
  if (!reads) { reads = new SharedRead(400, PRICE_MEMORY_TTL_MS); priceReads.set(gateway, reads) }
  return reads
}

export class PriceDisplayApi {
  constructor(private readonly gateway: PriceDisplayGateway) {
    if (!gateway || typeof gateway.read !== 'function') throw new TypeError('PriceDisplayApi requires a gateway')
  }

  /** The exact selected descriptor must still belong to this gateway's fully
   * bound discovery document. Preparation cannot restart its five-second lease. */
  isSnapshotFresh(query: PriceSnapshotQuery, catalog: PriceCatalogBinding, snapshot: PriceSnapshot): boolean {
    validatePriceQuery(query, 'PRICE_SNAPSHOT_LIST')
    return priceReads.get(this.gateway)?.hasFreshValue(
      priceReadKey({ kind: 'PRICE_SNAPSHOT_LIST', query }, { catalog }),
      (document) => document.response_kind === 'PRICE_SNAPSHOT_LIST' && document.items[0] === snapshot,
    ) ?? false
  }

  private async receive(request: PriceRequest, binding: PriceDecodeBinding, options: PriceReadOptions): Promise<PriceDocument> {
    validatePriceQuery(request.query, request.kind)
    const protectedRequest = Object.freeze({ ...request, query: Object.freeze(structuredClone(request.query)) }) as PriceRequest
    const protectedBinding = structuredClone(binding)
    options.signal?.throwIfAborted()
    const load = async (signal: AbortSignal) => {
      const response = await this.gateway.read(protectedRequest, { signal })
      signal.throwIfAborted()
      priceAssert(typeof response.etag === 'string')
      const document = decodePriceDisplayDocument(response.payload, {
        ...protectedBinding, kind: protectedRequest.kind, query: protectedRequest.query,
        httpStatus: response.httpStatus, etag: response.etag,
      })
      priceAssert(isDecodedPriceDocument(document))
      return document
    }
    // No persistence and no immutable assumption. History is deliberately not
    // retained. Both query and independent decoder binding belong in this key.
    if (request.kind === 'PRICE_HISTORY' || options.reuse === false) {
      return await load(options.signal ?? new AbortController().signal)
    }
    const document = await readsFor(this.gateway).read(
      priceReadKey(protectedRequest, protectedBinding), load,
      (value) => value.response_kind !== 'ERROR', options.signal,
    )
    options.signal?.throwIfAborted()
    return document
  }

  async snapshots(query: PriceSnapshotQuery, catalog: PriceCatalogBinding, options: PriceReadOptions = {}): Promise<PriceSnapshotList | PriceError> {
    return await this.receive({ kind: 'PRICE_SNAPSHOT_LIST', query }, { catalog }, options) as PriceSnapshotList | PriceError
  }
  async item(query: PriceItemQuery, snapshot: PriceSnapshot, catalog: PriceCatalogBinding, options: PriceReadOptions = {}): Promise<PriceItem | PriceError> {
    return await this.receive({ kind: 'PRICE_ITEM', query }, { snapshot, catalog }, options) as PriceItem | PriceError
  }
  async history(query: PriceHistoryQuery, snapshot: PriceSnapshot, catalog: PriceCatalogBinding, options: PriceReadOptions = {}, itemId?: string): Promise<PriceHistory | PriceError> {
    return await this.receive({ kind: 'PRICE_HISTORY', query }, { snapshot, catalog, itemId }, options) as PriceHistory | PriceError
  }
}
