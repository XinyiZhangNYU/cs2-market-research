import { validateSingleItemTrendingPublicApiResponse } from './generated/singleItemTrendingPublicApiValidator.js'
import { validateSingleItemTrendingPublicApiV3Response } from './generated/singleItemTrendingPublicApiV3Validator.js'
import { validateSingleItemTrendingPublicApiV4Response } from './generated/singleItemTrendingPublicApiV4Validator.js'
import type {
  TrendingListQuery,
  TrendingListResponse,
  TrendingMember,
  TrendingPublication,
  TrendingPublicDocument,
} from './singleItemTrendingPublicApiTypes'

const decoded = new WeakSet<object>()
const ERROR_STATUS = Object.freeze({
  INVALID_ARGUMENT: 400,
  INVALID_CURSOR: 400,
  NOT_PUBLISHED: 404,
  BACKEND_UNAVAILABLE: 503,
  PUBLICATION_EXPIRED: 503,
  PUBLICATION_WITHDRAWN: 503,
  RESULT_CORRUPT: 503,
} as const)

export class TrendingPublicValidationError extends Error {
  constructor() {
    super('Trending public response failed contract validation')
    this.name = 'TrendingPublicValidationError'
  }
}

function assert(condition: unknown): asserts condition {
  if (!condition) throw new TrendingPublicValidationError()
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function validateSafeNumbers(value: unknown): void {
  if (typeof value === 'number') assert(Number.isSafeInteger(value))
  else if (value !== null && typeof value === 'object') Object.values(value).forEach(validateSafeNumbers)
}

// Fixed eight-place wire decimals can exceed Number's precision. Display ties do
// not establish exact rational ties, so no identity ordering is inferred here.
export function trendingDisplayOrderIsValid(previous: TrendingMember, next: TrendingMember): boolean {
  const a = BigInt(previous.conservative_same_direction_change_floor_ratio.replace('.', ''))
  const b = BigInt(next.conservative_same_direction_change_floor_ratio.replace('.', ''))
  return previous.direction === next.direction && (previous.direction === 'GAINERS' ? a >= b : a <= b)
}

function validatePublication(
  publication: TrendingPublication,
  snapshotKnownAt: string,
  requestKnownAt: string,
  apiVersion: TrendingListResponse['api_version'],
): void {
  assert(snapshotKnownAt <= requestKnownAt)
  assert(publication.input_available_at <= publication.public_available_at)
  assert(publication.public_available_at <= publication.published_at)
  assert(publication.published_at <= publication.fresh_until)
  assert(publication.fresh_until <= publication.retain_until)
  assert(publication.published_at <= snapshotKnownAt)
  assert(requestKnownAt <= publication.retain_until)
  const dayClose = new Date(`${publication.result_as_of}T00:00:00.000Z`)
  dayClose.setUTCDate(dayClose.getUTCDate() + 1)
  if (publication.evidence_class !== undefined && publication.evidence_class !== 'CONTEMPORANEOUSLY_MEASURED') {
    assert(publication.freshness_anchor_at === publication.input_available_at)
  } else {
    assert(publication.freshness_anchor_at === dayClose.toISOString().replace('.000Z', '.000000Z'))
  }
  assert(publication.freshness_anchor_at <= publication.public_available_at)
  assert(publication.freshness_anchor_at <= publication.input_available_at)
  assert(publication.catalog.as_of <= publication.catalog.available_at)
  assert(publication.catalog.available_at <= publication.public_available_at)
  assert(publication.catalog.available_at <= publication.catalog.published_at)
  assert(publication.catalog.published_at <= publication.public_available_at)
  if (publication.evidence_class !== undefined) {
    assert(publication.window_start_date !== undefined)
    assert(publication.evidence_disclosure !== undefined)
    assert(publication.currency_disclosure !== undefined)
    const start = new Date(`${publication.window_start_date}T00:00:00.000Z`)
    const end = new Date(`${publication.result_as_of}T00:00:00.000Z`)
    assert((end.getTime() - start.getTime()) / 86_400_000 === 30)
    const expected = {
      RECONSTRUCTED_HISTORY: ['HISTORICAL_PROVIDER_ARCHIVE', 'HISTORICAL_PROVIDER_ARCHIVE', '历史重建', false],
      HYBRID_BRIDGED: ['HISTORICAL_PROVIDER_ARCHIVE', 'CONTEMPORANEOUS_EOD', '混合桥接', false],
      CONTEMPORANEOUSLY_MEASURED: ['CONTEMPORANEOUS_EOD', 'CONTEMPORANEOUS_EOD', '当前实测', true],
    } as const
    const disclosure = publication.evidence_disclosure
    const selected = expected[publication.evidence_class]
    assert(disclosure.start_endpoint_acquisition === selected[0])
    assert(disclosure.end_endpoint_acquisition === selected[1])
    assert(disclosure.public_label === selected[2])
    assert(disclosure.prospective_continuity_credit === selected[3])
    assert(disclosure.pit_membership_claimed === false)
    assert((disclosure.historical_obtained_at !== null) === (publication.evidence_class !== 'CONTEMPORANEOUSLY_MEASURED'))
    if (disclosure.historical_obtained_at !== null) assert(disclosure.historical_obtained_at <= publication.input_available_at)
    assert(publication.tiering_policy?.evidence_class === publication.evidence_class)
    assert(publication.tiering_policy?.public_primary_grade === 'THREE_SOURCE_CONFIRMED')
    assert(publication.tiering_policy?.two_source_publication_state ===
      'WITHHELD_PENDING_SEPARATE_RIGHTS_AND_PRODUCT_APPROVAL')
    assert(publication.currency_disclosure.start_fx_source_event_date <= publication.window_start_date)
    assert(publication.currency_disclosure.end_fx_source_event_date <= publication.result_as_of)
  }
  assert(
    publication.accounting.member_count ===
      publication.accounting.eligible_count + publication.accounting.excluded_count,
  )
  const statusTotal = Object.values(publication.accounting.status_counts)
    .reduce((sum, count) => sum + count, 0)
  assert(statusTotal === publication.accounting.member_count)
  assert(publication.catalog.member_count === publication.accounting.member_count)
  const accounting = publication.accounting
  const tiered = publication.tiering_policy !== undefined
  assert(accounting.eligible_count === accounting.status_counts.ELIGIBLE_A3 + (tiered ? accounting.status_counts.ELIGIBLE_A2! : 0))
  assert(accounting.direction_eligible_count === accounting.eligible_count)
  assert(accounting.eligible_count <= (tiered ? accounting.qualified_supported_endpoint_count! : accounting.qualified_three_source_endpoint_count))
  assert(accounting.qualified_three_source_endpoint_count <= accounting.three_source_endpoint_count)
  assert(accounting.three_source_endpoint_count <= accounting.member_count)
  const ratioBps = (count: number) => Number(BigInt(count) * 10000n / BigInt(accounting.member_count))
  if (tiered) {
    assert(accounting.qualified_supported_endpoint_count === accounting.qualified_three_source_endpoint_count + accounting.qualified_two_source_endpoint_count!)
    assert(accounting.qualified_supported_endpoint_count! <= accounting.member_count)
    assert(accounting.qualified_supported_endpoint_ratio_bps === ratioBps(accounting.qualified_supported_endpoint_count!))
    assert(accounting.qualified_supported_endpoint_ratio_bps! >= publication.tiering_policy!.minimum_supported_endpoint_ratio_bps)
    assert(accounting.three_source_confirmed_count === accounting.status_counts.ELIGIBLE_A3)
    assert(accounting.three_source_confirmed_count! <= accounting.qualified_three_source_endpoint_count)
    assert(accounting.two_source_supported_count === accounting.status_counts.ELIGIBLE_A2)
    assert(accounting.two_source_supported_count! <= accounting.qualified_two_source_endpoint_count!)
    for (const reasons of Object.values(accounting.source_endpoint_reason_counts!)) {
      assert(Object.values(reasons).reduce((sum, n) => sum + n, 0) <= 2 * accounting.member_count)
    }
  }
  assert(accounting.three_source_endpoint_ratio_bps === ratioBps(accounting.three_source_endpoint_count))
  assert(accounting.qualified_three_source_endpoint_ratio_bps === ratioBps(accounting.qualified_three_source_endpoint_count))
  assert(accounting.direction_eligible_ratio_bps === ratioBps(accounting.direction_eligible_count))
  if (publication.evidence_class === undefined) {
    assert(accounting.three_source_endpoint_ratio_bps >= publication.producer_release.minimum_three_source_endpoint_ratio_bps!)
    assert(accounting.qualified_three_source_endpoint_ratio_bps >= publication.producer_release.minimum_qualified_three_source_endpoint_ratio_bps!)
    assert(accounting.direction_eligible_ratio_bps >= publication.producer_release.minimum_direction_eligible_ratio_bps!)
  }
  assert(
    publication.accounting.gainer_count + publication.accounting.loser_count <=
      publication.accounting.eligible_count,
  )
  assert(publication.accounting.gainer_count <= publication.producer_release.public_top_n_per_direction)
  assert(publication.accounting.loser_count <= publication.producer_release.public_top_n_per_direction)
  assert(publication.accounting.gainer_count <= publication.rights_maximum_public_members_per_direction)
  assert(publication.accounting.loser_count <= publication.rights_maximum_public_members_per_direction)
  assert(publication.producer_release.public_top_n_per_direction <= publication.rights_maximum_public_members_per_direction)
  if (apiVersion === 'v4') {
    const readiness = publication.tiering_policy!
    assert(readiness.public_readiness_policy_id !== undefined)
    assert(readiness.minimum_qualified_three_source_endpoint_ratio_bps !== undefined)
    assert(readiness.minimum_public_candidates_per_direction !== undefined)
    assert(readiness.empty_public_lane_state === 'WITHHOLD_PUBLICATION')
    assert(
      accounting.qualified_three_source_endpoint_ratio_bps >=
        readiness.minimum_qualified_three_source_endpoint_ratio_bps,
    )
    assert(accounting.gainer_count >= readiness.minimum_public_candidates_per_direction)
    assert(accounting.loser_count >= readiness.minimum_public_candidates_per_direction)
  }
  assert(
    publication.freshness === (requestKnownAt <= publication.fresh_until ? 'FRESH' : 'STALE_RETAINED'),
  )
}

function validateMember(member: TrendingMember, response: TrendingListResponse): void {
  if (response.api_version === 'v3' || response.api_version === 'v4') {
    const sources = member.supporting_sources!
    const missing = member.unavailable_sources!
    const expected = member.evidence_grade === 'THREE_SOURCE_CONFIRMED' ? 3 : 2
    assert(sources.length === expected && missing.length === 3 - expected)
    assert(sources.join(',') === [...new Set(sources)].sort().join(','))
    assert(sources.includes(member.conservative_source_code))
    assert([...sources, ...missing.map((r) => r.source_code)].sort().join(',') === 'market_a,market_b,market_c')
    const allowed = response.publication.tiering_policy!.allowed_missing_reasons
    for (const row of missing) {
      const reasons = [row.start_reason, row.end_reason]
      assert(reasons.some((reason) => reason !== 'QUALIFIED'))
      assert(reasons.every((reason) => reason === 'QUALIFIED' || allowed.includes(reason)))
      if (response.api_version === 'v4' && response.publication.evidence_class === 'RECONSTRUCTED_HISTORY') {
        assert(reasons.every((reason) => reason === 'QUALIFIED' || reason === 'PROVIDER_HISTORY_SOURCE_ABSENT'))
      }
      if (response.api_version === 'v4' && response.publication.evidence_class === 'CONTEMPORANEOUSLY_MEASURED') {
        assert(!reasons.includes('PROVIDER_HISTORY_SOURCE_ABSENT'))
      }
    }
    if (response.api_version === 'v4') assert(member.evidence_grade === 'THREE_SOURCE_CONFIRMED')
  }
  assert(member.direction === response.query.direction)
  assert(member.tie_break_key === member.analysis_unit_id)
  assert(member.catalog.analysis_unit_id === member.analysis_unit_id)
  assert(member.catalog.catalog_version === response.publication.catalog.catalog_version)
  const negative = member.conservative_same_direction_change_floor_ratio.startsWith('-')
  assert(response.query.direction === 'LOSERS' ? negative : !negative)
  for (const [key, value] of Object.entries(response.query.filters)) {
    if (value !== null) assert(member.catalog[key as keyof TrendingListQuery['filters']] === value)
  }
}

function validateList(response: TrendingListResponse, request: TrendingListQuery): void {
  const query = response.query
  assert(query.as_of === request.as_of)
  if (request.publication_id !== null) assert(query.publication_id === request.publication_id)
  assert(query.publication_id === response.publication.publication_id)
  assert(query.direction === request.direction)
  assert(query.page_size === request.page_size)
  assert(query.cursor === request.cursor)
  assert(query.filters.item_kind === request.filters.item_kind)
  assert(query.filters.base_item_code === request.filters.base_item_code)
  assert(query.filters.edition_kind === request.filters.edition_kind)
  assert(query.filters.wear_tier === request.filters.wear_tier)
  validatePublication(
    response.publication,
    query.snapshot_known_at,
    query.request_known_at,
    response.api_version,
  )
  if (response.api_version === 'v3' || response.api_version === 'v4') {
    assert(response.members.filter((m) => m.evidence_grade === 'TWO_SOURCE_SUPPORTED').length
      <= response.publication.accounting.two_source_supported_count!)
    assert(response.members.filter((m) => m.evidence_grade === 'THREE_SOURCE_CONFIRMED').length
      <= response.publication.accounting.three_source_confirmed_count!)
    if (response.api_version === 'v4') {
      assert(response.members.every((member) => member.evidence_grade === 'THREE_SOURCE_CONFIRMED'))
    }
  }
  if (query.as_of !== null) assert(response.publication.result_as_of <= query.as_of)
  assert(response.members.length <= query.page_size)
  assert(response.members.length <= response.total)
  const directionCount = query.direction === 'GAINERS'
    ? response.publication.accounting.gainer_count
    : response.publication.accounting.loser_count
  assert(response.total <= directionCount)
  if (Object.values(query.filters).every((value) => value === null)) assert(response.total === directionCount)
  if (response.next_cursor !== null) assert(response.members.length === query.page_size)
  if (response.next_cursor !== null) assert(response.next_cursor !== query.cursor)
  if (query.cursor === null && response.members.length > 0) assert(response.members[0].rank === 1)
  if (query.cursor !== null) assert(response.members.length > 0 && response.members[0].rank > 1)
  if (response.members.length === 0) assert(response.total === 0 && response.next_cursor === null)
  else {
    const firstRank = response.members[0].rank
    const lastRank = response.members[response.members.length - 1].rank
    assert(response.members.length === Math.min(query.page_size, response.total - firstRank + 1))
    assert((response.next_cursor !== null) === (lastRank < response.total))
  }
  const identities = new Set<string>()
  const measurements = new Set<string>()
  let previousRank: number | null = null
  let previousMember: TrendingMember | null = null
  for (const member of response.members) {
    validateMember(member, response)
    assert(member.rank <= response.total)
    if (previousRank !== null) assert(member.rank === previousRank + 1)
    assert(!identities.has(member.analysis_unit_id))
    assert(!measurements.has(member.measurement_id))
    if (previousMember !== null) assert(trendingDisplayOrderIsValid(previousMember, member))
    identities.add(member.analysis_unit_id)
    measurements.add(member.measurement_id)
    previousRank = member.rank
    previousMember = member
  }
}

export function decodeTrendingPublicDocument(
  input: unknown,
  request: TrendingListQuery,
  httpStatus: number,
): TrendingPublicDocument {
  try {
    const document: unknown = structuredClone(input)
    const version = document !== null && typeof document === 'object' && 'api_version' in document
      ? document.api_version
      : undefined
    assert(
      version === 'v4'
        ? validateSingleItemTrendingPublicApiV4Response(document)
        : version === 'v3'
          ? validateSingleItemTrendingPublicApiV3Response(document)
          : validateSingleItemTrendingPublicApiResponse(document),
    )
    validateSafeNumbers(document)
    const typed = document as TrendingPublicDocument
    if (typed.response_kind === 'ERROR') {
      assert(ERROR_STATUS[typed.error.code] === httpStatus)
    } else {
      assert(httpStatus === 200)
      validateList(typed, request)
    }
    deepFreeze(typed)
    decoded.add(typed)
    return typed
  } catch (error) {
    if (error instanceof TrendingPublicValidationError) throw error
    throw new TrendingPublicValidationError()
  }
}

export function isDecodedTrendingPublicDocument(value: unknown): value is TrendingPublicDocument {
  return value !== null && typeof value === 'object' && decoded.has(value)
}
