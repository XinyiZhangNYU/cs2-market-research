import {
  decodeTrendingPublicDocument,
  isDecodedTrendingPublicDocument,
} from '../wire/singleItemTrendingPublicApiDecode'
import { nativeTrendingProjection } from './NativeCnyTrendingPublicGateway'
import type { NativeTrendingList, NativeTrendingEmpty } from '../trending/nativeCnyTrendingPresentation'
import type {
  TrendingEditionKind,
  TrendingItemKind,
  TrendingListQuery,
  TrendingPublicDocument,
  TrendingWearTier,
} from '../wire/singleItemTrendingPublicApiTypes'

export type TrendingReadOptions = Readonly<{
  signal?: AbortSignal
  /** Native home preview only; the full page continues to show the whole direction. */
  nativeLimit?: number
  onProgress?: (response: TrendingTransportResponse) => void
}>
type TrendingDocument = TrendingPublicDocument | NativeTrendingList | NativeTrendingEmpty
export type TrendingListOptions = Omit<TrendingReadOptions, 'onProgress'> & Readonly<{
  onProgress?: (document: TrendingDocument) => void
}>
export type TrendingTransportResponse = Readonly<{ payload: unknown; httpStatus: number }>

export interface SingleItemTrendingPublicGateway {
  readonly kind: string
  read(
    query: TrendingListQuery,
    options?: TrendingReadOptions,
  ): Promise<TrendingTransportResponse>
}

const SHA256 = /^[0-9a-f]{64}$/u
const SAFE_CURSOR = /^[A-Za-z0-9_-]{1,8192}$/u
const DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/u
const ITEM_KINDS = new Set<TrendingItemKind>(['WEAPON', 'KNIFE', 'GLOVE', 'AGENT', 'OTHER', 'UNKNOWN'])
const EDITION_KINDS = new Set<TrendingEditionKind>(['STANDARD', 'STATTRAK', 'SOUVENIR', 'UNKNOWN'])
const WEAR_TIERS = new Set<TrendingWearTier>([
  'FACTORY_NEW', 'MINIMAL_WEAR', 'FIELD_TESTED', 'WELL_WORN',
  'BATTLE_SCARRED', 'NOT_APPLICABLE', 'UNKNOWN',
])

function exactKeys(value: object, expected: readonly string[]): boolean {
  return Object.keys(value).sort().join('\u0000') === [...expected].sort().join('\u0000')
}

function validDate(value: string | null): boolean {
  if (value === null) return true
  if (!DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function assertQuery(query: TrendingListQuery): void {
  const filters = query.filters
  const base = filters.base_item_code
  if (
    !exactKeys(query, ['as_of', 'publication_id', 'direction', 'page_size', 'cursor', 'filters']) ||
    !exactKeys(filters, ['item_kind', 'base_item_code', 'edition_kind', 'wear_tier']) ||
    !validDate(query.as_of) ||
    (query.publication_id !== null && !SHA256.test(query.publication_id)) ||
    (query.direction !== 'GAINERS' && query.direction !== 'LOSERS') ||
    !Number.isInteger(query.page_size) || query.page_size < 1 || query.page_size > 100 ||
    (query.cursor !== null && !SAFE_CURSOR.test(query.cursor)) ||
    (filters.item_kind !== null && !ITEM_KINDS.has(filters.item_kind)) ||
    (filters.edition_kind !== null && !EDITION_KINDS.has(filters.edition_kind)) ||
    (filters.wear_tier !== null && !WEAR_TIERS.has(filters.wear_tier)) ||
    (base !== null && (
      base.length === 0 || base.length > 256 || base !== base.trim() || CONTROL_CHARACTER.test(base)
    ))
  ) throw new TypeError('invalid Trending query')
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

export class SingleItemTrendingPublicApi {
  constructor(private readonly gateway: SingleItemTrendingPublicGateway) {
    if (!gateway || typeof gateway.read !== 'function') {
      throw new TypeError('SingleItemTrendingPublicApi requires a gateway')
    }
  }

  async list(
    query: TrendingListQuery,
    options: TrendingListOptions = {},
  ): Promise<TrendingPublicDocument | NativeTrendingList | NativeTrendingEmpty> {
    options.signal?.throwIfAborted()
    assertQuery(query)
    const protectedQuery = deepFreeze(structuredClone(query)) as TrendingListQuery
    const response = await this.gateway.read(protectedQuery, { ...options, onProgress: options.onProgress === undefined
      ? undefined : (update) => {
        if (options.signal?.aborted) return
        // Progress uses exactly the same sealed local boundary, never a raw DTO.
        const native = nativeTrendingProjection(update.payload, protectedQuery, update.httpStatus)
        if (native === null) throw new TypeError('Unsealed native progress')
        options.onProgress!(native)
      } })
    options.signal?.throwIfAborted()
    const native = nativeTrendingProjection(response.payload, protectedQuery, response.httpStatus)
    if (native !== null) return native
    const document = decodeTrendingPublicDocument(
      response.payload,
      protectedQuery,
      response.httpStatus,
    )
    if (!isDecodedTrendingPublicDocument(document)) {
      throw new TypeError('Trending decoder returned an unsealed document')
    }
    return document
  }
}
