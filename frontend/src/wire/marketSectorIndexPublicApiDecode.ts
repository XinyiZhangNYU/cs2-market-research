import { canonicalHash } from './canonical'
import { validateMarketSectorIndexPublicApiResponse } from './generated/marketSectorIndexPublicApiValidator.js'
import { validateMarketSectorIndexPublicApiV2Response } from './generated/marketSectorIndexPublicApiV2Validator.js'
import type {
  MarketSectorIndexDirectoryQuery,
  MarketSectorIndexDocument,
  MarketSectorIndexErrorCode,
  MarketSectorIndexPoint,
  MarketSectorIndexScope,
  MarketSectorIndexSeriesQuery,
} from './marketSectorIndexPublicApiTypes'

export type MarketSectorIndexDecodeRequest =
  | Readonly<{ kind: 'DIRECTORY'; query: MarketSectorIndexDirectoryQuery }>
  | Readonly<{ kind: 'SERIES'; query: MarketSectorIndexSeriesQuery }>

const decoded = new WeakSet<object>()
const ERROR_STATUS = Object.freeze({
  INVALID_REQUEST: 400,
  NOT_PUBLISHED: 404,
  NOT_FOUND: 404,
  WITHDRAWN: 410,
  STALE_EXPIRED: 410,
  CORRUPT_PUBLICATION: 503,
  TEMPORARILY_UNAVAILABLE: 503,
} satisfies Record<MarketSectorIndexErrorCode, number>)

export class MarketSectorIndexValidationError extends Error {
  constructor() {
    super('Market/sector index response failed contract validation')
    this.name = 'MarketSectorIndexValidationError'
  }
}

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

function dayValue(value: string): number {
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

function ratio(value: string | null, numerator: number, denominator: number | null): void {
  assert(denominator !== null)
  const parsed = decimal(value)
  assert(parsed >= 0 && parsed <= 1)
  assert(Math.abs(parsed - (denominator === 0 ? 0 : numerator / denominator)) < 1e-10)
}

function boundedRatio(value: string | null): void {
  const parsed = decimal(value)
  assert(parsed >= 0 && parsed <= 1)
}

function validateScope(scope: MarketSectorIndexScope): void {
  assert(scope.scope_token === canonicalHash({
    contract: 'market-sector-index-public-api', scope_code: scope.scope_code,
  }))
  assert(scope.scope_kind === (scope.scope_code === 'ALL' ? 'MARKET' : scope.scope_code.includes(':') ? 'SUBSECTOR' : 'SECTOR'))
  assert(scope.observed_price_member_count <= scope.current_member_count)
  assert((scope.first_available_date === null) === (scope.last_available_date === null))
  if (scope.first_available_date !== null && scope.last_available_date !== null) {
    assert(dayValue(scope.first_available_date) <= dayValue(scope.last_available_date))
  }
}

function validatePoint(
  point: MarketSectorIndexPoint,
  previous: MarketSectorIndexPoint | null,
  version: '1' | '2',
  externalPreviousDate: string | null = null,
): void {
  assert(point.coverage.expected_member_count_upper_bound !== null &&
    point.origin_uncertainty.possible_unadmitted_member_count !== null && point.quality.anomaly_member_count !== null)
  assert(point.coverage.expected_member_count <= point.coverage.expected_member_count_upper_bound)
  assert(point.coverage.qualified_member_count <= point.coverage.expected_member_count)
  assert(point.coverage.paired_member_count <= point.coverage.expected_member_count)
  assert(
    point.coverage.paired_member_count ===
      point.coverage.qualified_member_count + point.quality.rejected_return_domain_count,
  )
  assert(point.coverage.absolute_price_qualified_member_count <= point.coverage.expected_member_count)
  ratio(point.coverage.coverage_ratio, point.coverage.qualified_member_count, point.coverage.expected_member_count)
  ratio(point.coverage.coverage_ratio_lower_bound, point.coverage.qualified_member_count, point.coverage.expected_member_count_upper_bound)
  boundedRatio(point.coverage.absolute_price_coverage_ratio)
  boundedRatio(point.coverage.absolute_price_coverage_ratio_lower_bound)
  const admittedGrades = point.quality.grade_counts.A + point.quality.grade_counts.B +
    point.quality.grade_counts.C + point.quality.grade_counts.D
  assert(admittedGrades === point.coverage.qualified_member_count)
  assert(point.quality.grade_counts.E === point.coverage.expected_member_count - point.coverage.paired_member_count)
  assert(
    point.coverage.expected_member_count_upper_bound ===
      point.coverage.expected_member_count + point.origin_uncertainty.possible_unadmitted_member_count,
  )
  if (point.connect_to_previous) {
    assert(previous !== null || externalPreviousDate !== null)
    assert(dayValue(point.date) - dayValue(previous?.date ?? externalPreviousDate!) === 86_400_000)
    assert(point.segment_id !== null)
    if (previous !== null) {
      assert(point.segment_id === previous.segment_id)
      assert(point.availability === previous.availability)
    }
    assert(point.index.period_return !== null)
  }
  if (version === '2') {
    const contributions = point.quality.anomaly_contributions
    assert(Array.isArray(contributions))
    assert(contributions.length <= point.quality.anomaly_member_count)
    const identities = new Set<string>()
    for (const contribution of contributions) {
      assert(contribution.analysis_unit_id.length > 0)
      assert(!identities.has(contribution.analysis_unit_id))
      identities.add(contribution.analysis_unit_id)
      const adjustment = decimal(contribution.adjustment)
      // The producer records the signed change applied by winsorization:
      // suppressed - raw.  A clipped positive outlier therefore has a
      // negative adjustment, while a clipped negative outlier is positive.
      assert(Math.abs(adjustment - (decimal(contribution.suppressed_return) - decimal(contribution.raw_return))) < 1e-10)
    }
  } else {
    assert(point.quality.anomaly_contributions === undefined)
  }
}

function validateSuccess(
  document: Exclude<MarketSectorIndexDocument, { response_kind: 'ERROR' }>,
  request: MarketSectorIndexDecodeRequest,
): void {
  assert(document.release.withdrawn_at === null)
  assert(dayValue(document.release.history_start) <= dayValue(document.release.history_end))
  if (request.query.publication_id !== null) assert(document.release.publication_id === request.query.publication_id)
  if (request.kind === 'DIRECTORY') {
    assert(document.contract_version === '1')
    assert(document.response_kind === 'SCOPE_DIRECTORY')
    assert(document.scope === null && document.points.length === 0)
    assert(document.query.from_date === null && document.query.to_date === null)
    assert(document.query.after_date === null && document.query.limit === 1 && document.query.next_after_date === null)
    const tokens = document.scopes.map((scope) => scope.scope_token)
    assert(tokens.length === new Set(tokens).size)
    document.scopes.forEach(validateScope)
    return
  }
  assert(document.response_kind === 'INDEX_SERIES')
  validateScope(document.scope)
  assert(document.scope.scope_token === request.query.scope_token)
  assert(document.query.from_date === request.query.from_date)
  assert(document.query.to_date === request.query.to_date)
  assert(document.query.after_date === request.query.after_date)
  assert(document.query.limit === request.query.limit)
  assert(document.points.length <= request.query.limit)

  let seriesEnd = dayValue(document.release.history_end)
  if (document.contract_version === '2') {
    const { measured_start: start, measured_end: end } = document.release
    assert((start === null) === (end === null))
    if (start !== null && end !== null) {
      assert(dayValue(start) === dayValue(document.release.history_end) + 86_400_000)
      assert(dayValue(start) <= dayValue(end))
      seriesEnd = dayValue(end)
    }
  }

  let previous: MarketSectorIndexPoint | null = null
  for (const point of document.points) {
    const current = dayValue(point.date)
    assert(current >= dayValue(document.release.history_start) && current <= seriesEnd)
    if (request.query.from_date !== null) assert(current >= dayValue(request.query.from_date))
    if (request.query.to_date !== null) assert(current <= dayValue(request.query.to_date))
    if (request.query.after_date !== null) assert(current > dayValue(request.query.after_date))
    if (previous !== null) assert(current > dayValue(previous.date))
    if (document.contract_version === '2') {
      if (point.availability === 'RECONSTRUCTED_LATE_BOUND') {
        if (current > dayValue(document.release.history_end)) {
          assert(document.release.measured_start !== null && document.release.measured_end !== null)
          assert(current >= dayValue(document.release.measured_start) && current <= dayValue(document.release.measured_end))
        }
      } else {
        assert(point.availability === 'CONTEMPORANEOUSLY_MEASURED')
        assert(document.release.measured_start !== null && document.release.measured_end !== null)
        assert(current >= dayValue(document.release.measured_start) && current <= dayValue(document.release.measured_end))
        if (
          (previous === null && request.query.after_date === null) ||
          (previous !== null && previous.availability !== point.availability)
        ) {
          assert(!point.connect_to_previous)
          assert(point.index.period_return === null)
        }
      }
    }
    validatePoint(
      point,
      previous,
      document.contract_version,
      previous === null ? request.query.after_date : null,
    )
    previous = point
  }
  if (document.query.next_after_date !== null) {
    assert(document.points.length === request.query.limit)
    assert(document.query.next_after_date === document.points.at(-1)?.date)
  }
}

export function decodeMarketSectorIndexDocument(
  input: unknown,
  request: MarketSectorIndexDecodeRequest,
  httpStatus: number,
): MarketSectorIndexDocument {
  try {
    const document: unknown = structuredClone(input)
    const version = document !== null && typeof document === 'object'
      ? (document as { contract_version?: unknown }).contract_version
      : null
    if (version === '2') {
      assert(request.kind === 'SERIES')
      assert(validateMarketSectorIndexPublicApiV2Response(document))
    } else {
      assert(validateMarketSectorIndexPublicApiResponse(document))
    }
    const typed = document as MarketSectorIndexDocument
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
    if (error instanceof MarketSectorIndexValidationError) throw error
    throw new MarketSectorIndexValidationError()
  }
}

export function isDecodedMarketSectorIndexDocument(value: unknown): value is MarketSectorIndexDocument {
  return value !== null && typeof value === 'object' && decoded.has(value)
}



