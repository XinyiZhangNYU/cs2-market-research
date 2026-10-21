import { canonicalHash } from './canonical'
import { validateMarketSectorIndexPublicApiV3Response } from './generated/marketSectorIndexPublicApiV3Validator.js'
import { MarketSectorIndexValidationError } from './marketSectorIndexPublicApiDecode'
import type {
  MarketSectorIndexDirectoryDocumentV3,
  MarketSectorIndexRequestV3,
  MarketSectorIndexScopeV3,
} from './marketSectorIndexPublicApiV3Types'

const decoded = new WeakSet<object>()
const DAY_MS = 86_400_000
const ERROR_STATUS = Object.freeze({
  INVALID_REQUEST: 400,
  NOT_PUBLISHED: 404,
  NOT_FOUND: 404,
  WITHDRAWN: 410,
  STALE_EXPIRED: 410,
  CORRUPT_PUBLICATION: 503,
  TEMPORARILY_UNAVAILABLE: 503,
})

function assert(condition: unknown): asserts condition {
  if (!condition) throw new MarketSectorIndexValidationError()
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function validateScope(scope: MarketSectorIndexScopeV3): void {
  assert(scope.scope_token === canonicalHash({
    contract: 'market-sector-index-public-api', scope_code: scope.scope_code,
  }))
  assert(scope.scope_kind === (scope.scope_code === 'ALL' ? 'MARKET' : scope.scope_code.includes(':') ? 'SUBSECTOR' : 'SECTOR'))
  assert(scope.observed_price_member_count <= scope.current_member_count)
  assert((scope.first_available_date === null) === (scope.last_available_date === null))
  assert(scope.linked_collection_scope_tokens.length === new Set(scope.linked_collection_scope_tokens).size)
  if (scope.group_code !== 'ARMORY_RELEASES') assert(scope.linked_collection_scope_tokens.length === 0)
}

export function decodeMarketSectorIndexDirectoryV3(
  input: unknown,
  request: MarketSectorIndexRequestV3,
  httpStatus: number,
): MarketSectorIndexDirectoryDocumentV3 {
  try {
    const value: unknown = structuredClone(input)
    assert(validateMarketSectorIndexPublicApiV3Response(value))
    const document = value as MarketSectorIndexDirectoryDocumentV3
    if (document.response_kind === 'ERROR') {
      assert(ERROR_STATUS[document.error.code] === httpStatus)
      assert(document.error.retryable === (document.error.code === 'TEMPORARILY_UNAVAILABLE'))
    } else {
      assert(httpStatus === 200)
      assert(document.release.withdrawn_at === null)
      if (request.query.publication_id !== null) assert(document.release.publication_id === request.query.publication_id)
      if (request.kind === 'GROUPS') {
        assert(document.response_kind === 'SCOPE_GROUP_DIRECTORY')
        assert(document.groups.length === 9 && document.scopes.length === 0)
        assert(document.query.group === null && document.query.after === null && document.query.limit === null && document.query.next_after === null)
        assert(document.groups.every((group, index) => group.display_order === index))
      } else if (request.kind === 'SCOPES') {
        assert(document.response_kind === 'SCOPE_PAGE')
        assert(document.groups.length === 0)
        assert(document.query.group === request.query.group)
        assert(document.query.after === request.query.after)
        assert(document.query.limit === request.query.limit)
        assert(document.scopes.length <= request.query.limit)
        document.scopes.forEach((scope) => {
          assert(scope.group_code === request.query.group)
          validateScope(scope)
        })
        if (document.query.next_after !== null) {
          assert(document.scopes.length === request.query.limit)
          assert(document.query.next_after === document.scopes.at(-1)?.scope_token)
        }
      } else {
        assert(document.response_kind === 'INDEX_SERIES')
        assert(document.release.measured_start !== null && document.release.measured_end !== null)
        assert(document.scope.scope_token === request.query.scope_token)
        validateScope(document.scope)
        assert(document.series_query.from_date === request.query.from_date)
        assert(document.series_query.to_date === request.query.to_date)
        assert(document.series_query.after_date === request.query.after_date)
        assert(document.series_query.limit === request.query.limit)
        assert(document.points.length <= request.query.limit)
        const scopeSupportsMeasured = document.scope.series_source === 'REGULAR_SUCCESSOR_RECONSTRUCTION'
        const scopeFirst = document.scope.first_available_date
        const scopeLast = document.scope.last_available_date
        let previousDate: string | null = null
        let previousPoint: typeof document.points[number] | null = null
        for (const point of document.points) {
          assert(/^\d{4}-\d{2}-\d{2}$/u.test(point.date))
          if (previousDate !== null) assert(point.date > previousDate)
          if (request.query.from_date !== null) assert(point.date >= request.query.from_date)
          if (request.query.to_date !== null) assert(point.date <= request.query.to_date)
          if (request.query.after_date !== null) assert(point.date > request.query.after_date)
          if (scopeFirst !== null) assert(point.date >= scopeFirst)
          if (point.availability === 'RECONSTRUCTED_LATE_BOUND') {
            if (point.date > document.release.history_end) {
              assert(scopeSupportsMeasured)
              assert(point.date >= document.release.measured_start)
              assert(point.date <= document.release.measured_end)
            }
            if (!scopeSupportsMeasured) {
              assert(scopeLast !== null && point.date <= scopeLast)
            }
          } else {
            assert(scopeSupportsMeasured)
            assert(point.date >= document.release.measured_start)
            assert(point.date <= document.release.measured_end)
          }
          if (previousPoint !== null && point.connect_to_previous) {
            assert(Date.parse(`${point.date}T00:00:00Z`) - Date.parse(`${previousPoint.date}T00:00:00Z`) === DAY_MS)
            assert(point.segment_id !== null && point.segment_id === previousPoint.segment_id)
            assert(point.availability === previousPoint.availability)
            assert(point.index.period_return !== null)
          }
          previousDate = point.date
          previousPoint = point
        }
        if (document.series_query.next_after_date !== null) {
          assert(document.points.length === request.query.limit)
          assert(document.series_query.next_after_date === document.points.at(-1)?.date)
        }
      }
    }
    deepFreeze(document)
    decoded.add(document)
    return document
  } catch (error) {
    if (error instanceof MarketSectorIndexValidationError) throw error
    throw new MarketSectorIndexValidationError()
  }
}

export function isDecodedMarketSectorIndexDirectoryV3(value: unknown): value is MarketSectorIndexDirectoryDocumentV3 {
  return value !== null && typeof value === 'object' && decoded.has(value)
}
