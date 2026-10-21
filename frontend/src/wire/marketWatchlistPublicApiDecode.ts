import { validateMarketWatchlistPublicApiResponse } from './generated/marketWatchlistPublicApiValidator.js'
import type {
  MarketHistoryQuery,
  MarketOverviewQuery,
  PublicMarketHistoryResponse,
  PublicMarketOverviewResponse,
  PublicResultDocument,
  PublicResultErrorCode,
  PublicResultPublication,
  PublicWatchlistDetailResponse,
  PublicWatchlistHistoryResponse,
  PublicWatchlistResponse,
  WatchlistDetailQuery,
  WatchlistHistoryQuery,
  WatchlistQuery,
} from './marketWatchlistPublicApiTypes'

export type PublicResultDecodeRequest =
  | Readonly<{ kind: 'MARKET_OVERVIEW'; query: MarketOverviewQuery }>
  | Readonly<{ kind: 'MARKET_HISTORY'; query: MarketHistoryQuery }>
  | Readonly<{ kind: 'WATCHLIST'; query: WatchlistQuery }>
  | Readonly<{ kind: 'WATCHLIST_DETAIL'; query: WatchlistDetailQuery }>
  | Readonly<{ kind: 'WATCHLIST_HISTORY'; query: WatchlistHistoryQuery }>

const decoded = new WeakSet<object>()
const ERROR_STATUS = Object.freeze({
  INVALID_ARGUMENT: 400,
  INVALID_CURSOR: 400,
  NOT_PUBLISHED: 404,
  NOT_FOUND: 404,
  BACKEND_UNAVAILABLE: 503,
  PUBLICATION_EXPIRED: 503,
  PUBLICATION_WITHDRAWN: 503,
  RESULT_CORRUPT: 503,
} satisfies Record<PublicResultErrorCode, number>)

export class PublicResultValidationError extends Error {
  constructor() {
    super('Public result response failed contract validation')
    this.name = 'PublicResultValidationError'
  }
}

function assert(condition: unknown): asserts condition {
  if (!condition) throw new PublicResultValidationError()
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function validatePublication(publication: PublicResultPublication, queryKnownAt: string): void {
  assert(publication.input_available_at <= publication.result_as_of)
  assert(publication.result_as_of <= publication.public_available_at)
  assert(publication.public_available_at <= publication.published_at)
  assert(publication.published_at <= queryKnownAt)
  assert(publication.published_at <= publication.fresh_until)
  assert(publication.fresh_until <= publication.retain_until)
  assert(publication.catalog.as_of <= publication.result_as_of)
  assert(publication.catalog.available_at <= publication.public_available_at)
  const expectedFreshness = queryKnownAt <= publication.fresh_until
    ? 'FRESH'
    : 'STALE_RETAINED'
  assert(queryKnownAt <= publication.retain_until)
  assert(publication.freshness === expectedFreshness)
}

function validateMarketResponse(response: PublicMarketOverviewResponse): void {
  validatePublication(response.publication, response.query.query_known_at)
  if (response.query.as_of !== null) assert(response.publication.result_as_of <= response.query.as_of)
  assert(response.market.analysis_unit_id.length > 0)
  assert(response.sectors.map((sector) => sector.sector_code).join(',') === 'GLOVE,KNIFE,WEAPON')
  assert(response.sectors.every((sector, index) => sector.display_order === index + 1))
}

function validateMarketHistory(response: PublicMarketHistoryResponse): void {
  assert(response.members.length <= response.query.page_size)
  if (response.next_cursor !== null) assert(response.members.length > 0)
  let previous: PublicResultPublication | null = null
  for (const member of response.members) {
    validatePublication(member.publication, response.query.query_known_at)
    if (response.query.as_of !== null) assert(member.publication.result_as_of <= response.query.as_of)
    assert(member.sectors.map((sector) => sector.sector_code).join(',') === 'GLOVE,KNIFE,WEAPON')
    if (previous !== null) {
      assert(
        previous.result_as_of > member.publication.result_as_of ||
        (previous.result_as_of === member.publication.result_as_of &&
          (previous.public_available_at > member.publication.public_available_at ||
            (previous.public_available_at === member.publication.public_available_at &&
              previous.publication_id < member.publication.publication_id))),
      )
    }
    previous = member.publication
  }
}

function validateWatchlist(response: PublicWatchlistResponse): void {
  validatePublication(response.publication, response.query.query_known_at)
  assert(response.query.publication_id === response.publication.publication_id)
  if (response.query.as_of !== null) assert(response.publication.result_as_of <= response.query.as_of)
  assert(response.members.length <= response.query.page_size)
  assert(response.members.length <= response.total)
  if (response.next_cursor !== null) assert(response.members.length > 0)
  let priorRank = 0
  const identities = new Set<string>()
  for (const member of response.members) {
    assert(member.rank > priorRank)
    assert(member.rank <= response.total)
    assert(member.tie_break_key === member.result.analysis_unit_id)
    assert(member.catalog.analysis_unit_id === member.result.analysis_unit_id)
    assert(member.catalog.catalog_version === response.publication.catalog.catalog_version)
    assert(!identities.has(member.result.analysis_unit_id))
    identities.add(member.result.analysis_unit_id)
    priorRank = member.rank
  }
}

function validateDetail(response: PublicWatchlistDetailResponse): void {
  validatePublication(response.publication, response.query.query_known_at)
  assert(response.query.publication_id === response.publication.publication_id)
  assert(response.member.result.analysis_unit_id === response.query.analysis_unit_id)
  assert(response.member.tie_break_key === response.query.analysis_unit_id)
  assert(response.member.catalog.analysis_unit_id === response.query.analysis_unit_id)
  assert(response.member.catalog.catalog_version === response.publication.catalog.catalog_version)
}

function validateWatchlistHistory(response: PublicWatchlistHistoryResponse): void {
  assert(response.members.length <= response.query.page_size)
  if (response.next_cursor !== null) assert(response.members.length > 0)
  let previous: PublicResultPublication | null = null
  for (const member of response.members) {
    validatePublication(member.publication, response.query.query_known_at)
    assert(member.result.analysis_unit_id === response.query.analysis_unit_id)
    if (previous !== null) {
      assert(
        previous.result_as_of > member.publication.result_as_of ||
        (previous.result_as_of === member.publication.result_as_of &&
          (previous.public_available_at > member.publication.public_available_at ||
            (previous.public_available_at === member.publication.public_available_at &&
              previous.publication_id < member.publication.publication_id))),
      )
    }
    previous = member.publication
  }
}

function validateRequestBinding(document: Exclude<PublicResultDocument, { response_kind: 'ERROR' }>, request: PublicResultDecodeRequest): void {
  assert(document.response_kind === request.kind)
  const query = document.query as unknown as Record<string, unknown>
  if (typeof query.as_of === 'string') {
    assert(typeof query.query_known_at === 'string' && query.as_of <= query.query_known_at)
  }
  if ('as_of' in request.query) assert(query.as_of === request.query.as_of)
  if ('page_size' in request.query) assert(query.page_size === request.query.page_size)
  if ('cursor' in request.query) assert(query.cursor === request.query.cursor)
  if ('sort' in request.query) assert('sort' in query && query.sort === request.query.sort)
  if ('analysis_unit_id' in request.query) {
    assert('analysis_unit_id' in query && query.analysis_unit_id === request.query.analysis_unit_id)
  }
  if ('publication_id' in request.query && request.query.publication_id !== null) {
    assert('publication_id' in query && query.publication_id === request.query.publication_id)
  }
}

export function decodePublicResultDocument(
  input: unknown,
  request: PublicResultDecodeRequest,
  httpStatus: number,
): PublicResultDocument {
  try {
    const document: unknown = structuredClone(input)
    assert(validateMarketWatchlistPublicApiResponse(document))
    const typed = document as PublicResultDocument
    if (typed.response_kind === 'ERROR') {
      assert(ERROR_STATUS[typed.error.code] === httpStatus)
    } else {
      assert(httpStatus === 200)
      validateRequestBinding(typed, request)
      if (typed.response_kind === 'MARKET_OVERVIEW') validateMarketResponse(typed)
      else if (typed.response_kind === 'MARKET_HISTORY') validateMarketHistory(typed)
      else if (typed.response_kind === 'WATCHLIST') validateWatchlist(typed)
      else if (typed.response_kind === 'WATCHLIST_DETAIL') validateDetail(typed)
      else validateWatchlistHistory(typed)
    }
    deepFreeze(typed)
    decoded.add(typed)
    return typed
  } catch (error) {
    if (error instanceof PublicResultValidationError) throw error
    throw new PublicResultValidationError()
  }
}

export function isDecodedPublicResultDocument(value: unknown): value is PublicResultDocument {
  return value !== null && typeof value === 'object' && decoded.has(value)
}
