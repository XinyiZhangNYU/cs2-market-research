import { canonicalHash } from './canonical'
import { validateMarketDescriptivePublicApiResponse } from './generated/marketDescriptivePublicApiValidator.js'
import type {
  MarketDescriptiveDocument,
  MarketDescriptiveErrorCode,
  MarketDescriptiveOverviewQuery,
  MarketDescriptiveScope,
  MarketDescriptiveScopeQuery,
  MarketDescriptiveSuccess,
} from './marketDescriptivePublicApiTypes'

export type MarketDescriptiveDecodeRequest =
  | Readonly<{ kind: 'OVERVIEW'; query: MarketDescriptiveOverviewQuery }>
  | Readonly<{ kind: 'SCOPE'; query: MarketDescriptiveScopeQuery }>

const decoded = new WeakSet<object>()
const ERROR_STATUS = Object.freeze({
  INVALID_REQUEST: 400,
  NOT_PUBLISHED: 404,
  NOT_FOUND: 404,
  WITHDRAWN: 410,
  STALE_EXPIRED: 410,
  CORRUPT_PUBLICATION: 503,
  TEMPORARILY_UNAVAILABLE: 503,
} satisfies Record<MarketDescriptiveErrorCode, number>)

export class MarketDescriptiveValidationError extends Error {
  constructor() {
    super('Market descriptive response failed contract validation')
    this.name = 'MarketDescriptiveValidationError'
  }
}

function assert(condition: unknown): asserts condition {
  if (!condition) throw new MarketDescriptiveValidationError()
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function dayValue(value: string | null): number {
  assert(value !== null)
  const parsed = Date.parse(`${value}T00:00:00.000Z`)
  assert(Number.isFinite(parsed))
  return parsed
}

function decimal(value: string | null): number {
  assert(value !== null)
  const parsed = Number(value)
  assert(Number.isFinite(parsed))
  return parsed
}

function validateScope(scope: MarketDescriptiveScope): void {
  // These nulls are presentation-only for native adapters, never legacy wire values.
  assert(scope.single_source_pair_count !== null && scope.unmapped_member_count !== null &&
    scope.missing_endpoint_count !== null && scope.source_set_break_count !== null && scope.other_unavailable_count !== null)
  assert(scope.scope_token === canonicalHash({ contract: 'market-descriptive-public-api', scope_id: scope.scope_id }))
  assert(scope.paired_member_count <= scope.day_price_member_count)
  assert(scope.day_price_member_count <= scope.fixed_member_count)
  assert(scope.single_source_pair_count <= scope.paired_member_count)
  assert(scope.unmapped_member_count <= scope.fixed_member_count)
  assert(
    scope.missing_endpoint_count + scope.source_set_break_count + scope.other_unavailable_count ===
      scope.fixed_member_count - scope.paired_member_count,
  )
  const paired = decimal(scope.paired_coverage_ratio)
  const priced = decimal(scope.day_price_coverage_ratio)
  assert(paired >= 0 && paired <= 1 && priced >= 0 && priced <= 1)
  assert(Math.abs(paired - scope.paired_member_count / scope.fixed_member_count) < 1e-12)
  assert(Math.abs(priced - scope.day_price_member_count / scope.fixed_member_count) < 1e-12)
  const chosen = scope.return_method === 'SYMMETRIC_WINSOR_1_PERCENT'
    ? scope.suppressed_return_ratio
    : scope.raw_return_ratio
  assert(scope.return_selected_for_display === chosen)
  assert((scope.raw_return_ratio !== null) === (scope.paired_member_count > 0))
  assert((scope.suppressed_return_ratio !== null) === (scope.paired_member_count >= 100))
  if (scope.scope_id === 'ALL') {
    assert(scope.scope_kind === 'MARKET' && scope.parent_scope_id === null && scope.ancestor_scope_ids.length === 0)
  } else {
    assert(scope.scope_kind === (scope.scope_id.includes(':') ? 'SUBSECTOR' : 'SECTOR'))
    assert(scope.ancestor_scope_ids[0] === 'ALL')
    assert(scope.ancestor_scope_ids.at(-1) === scope.parent_scope_id)
  }
}

function validateSuccess(document: MarketDescriptiveSuccess, request: MarketDescriptiveDecodeRequest): void {
  assert(document.snapshot.source_export_as_of !== null && document.snapshot.imported_at !== null &&
    document.publication.published_at !== null && document.freshness.lag_complete_days !== null)
  assert(document.operation === request.kind)
  assert(document.publication.withdrawn_at === null)
  assert(Date.parse(document.snapshot.source_export_as_of) <= Date.parse(document.snapshot.imported_at))
  assert(Date.parse(document.snapshot.imported_at) <= Date.parse(document.publication.published_at))
  assert(Date.parse(document.publication.published_at) <= Date.parse(document.freshness.evaluated_at))
  const disclosure = document.publication.clock_disclosure
  if (disclosure !== undefined && disclosure !== null) {
    assert(disclosure.status === 'PREPARED_CLOCK_NOT_ACTUAL')
    assert(disclosure.published_at_kind === 'PREPARED_VALUE')
    assert(disclosure.actual_public_available_at === null)
    assert(disclosure.reason === 'INITIAL_ACTIVE_APPLY_CLOCK_NOT_OBSERVED')
    assert(Date.parse(document.publication.published_at) < Date.parse(disclosure.known_not_before_at))
    assert(Date.parse(disclosure.known_not_before_at) <= Date.parse(disclosure.recorded_at))
    assert(Date.parse(disclosure.recorded_at) <= Date.parse(document.freshness.evaluated_at))
  }
  assert(dayValue(document.snapshot.start_date) <= dayValue(document.snapshot.end_date))
  assert(document.freshness.lag_complete_days >= 0)
  assert(document.current_day_quality.date === document.freshness.expected_latest_complete_date)
  if (request.query.publication_id !== null) {
    assert(document.publication.publication_id === request.query.publication_id)
  }
  if (request.kind === 'SCOPE') {
    assert(document.scopes.length === 1)
    assert(document.scopes[0]?.scope_token === request.query.scope_token)
  }
  if (document.response_kind === 'EMPTY') {
    assert(document.scopes.length === 0 && document.day_pair === null)
  } else {
    assert(document.scopes.length > 0 && document.day_pair !== null)
    if (document.operation === 'OVERVIEW') {
      assert(document.scopes.filter((scope) => scope.scope_id === 'ALL').length === 1)
    }
  }
  const ids = document.scopes.map((scope) => scope.scope_id)
  assert(ids.length === new Set(ids).size)
  const tokens = new Set<string>()
  for (const scope of document.scopes) {
    assert(!tokens.has(scope.scope_token))
    tokens.add(scope.scope_token)
    validateScope(scope)
    if (document.operation === 'OVERVIEW' && scope.parent_scope_id !== null) {
      assert(ids.includes(scope.parent_scope_id))
    }
  }
  if (document.headline === null) {
    assert(document.freshness.headline_data_date === null)
    assert(document.freshness.status === 'NO_RECENT_STATISTIC')
  } else {
    validateScope(document.headline.scope)
    assert(document.headline.scope.headline_eligible)
    assert(document.headline.day_pair.to_date === document.freshness.headline_data_date)
  }
  let previousDay: number | null = null
  for (const entry of document.history) {
    const currentDay = dayValue(entry.day_pair.to_date)
    if (previousDay !== null) assert(previousDay > currentDay)
    previousDay = currentDay
    const historyIds = entry.scopes.map((scope) => scope.scope_id)
    assert(historyIds.length === new Set(historyIds).size)
    entry.scopes.forEach(validateScope)
  }
  if (document.history.length > 0) assert(document.history.at(-1)?.connect_to_previous === false)
}

export function decodeMarketDescriptiveDocument(
  input: unknown,
  request: MarketDescriptiveDecodeRequest,
  httpStatus: number,
): MarketDescriptiveDocument {
  try {
    const document: unknown = structuredClone(input)
    assert(validateMarketDescriptivePublicApiResponse(document))
    const typed = document as MarketDescriptiveDocument
    if (typed.response_kind === 'ERROR') {
      assert(ERROR_STATUS[typed.error.code] === httpStatus)
      assert(typed.error.retryable === (typed.error.code === 'TEMPORARILY_UNAVAILABLE'))
    } else {
      assert(httpStatus === 200)
      validateSuccess(typed, request)
    }
    deepFreeze(typed)
    decoded.add(typed)
    return typed
  } catch (error) {
    if (error instanceof MarketDescriptiveValidationError) throw error
    throw new MarketDescriptiveValidationError()
  }
}

export function isDecodedMarketDescriptiveDocument(value: unknown): value is MarketDescriptiveDocument {
  return value !== null && typeof value === 'object' && decoded.has(value)
}
