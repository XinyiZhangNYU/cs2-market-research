import { compareCodePoints } from './canonical'
import { validateMarketWatchlistObservationApiResponse } from './generated/marketWatchlistObservationApiValidator.js'
import type {
  ObservationDetailQuery,
  ObservationListQuery,
  PublicObservationDataQuality,
  PublicObservationDocument,
  PublicObservationErrorCode,
  PublicObservationMember,
  PublicObservationPublication,
  PublicObservationSourceCoverage,
  PublicObservationWatchlistResponse,
  PublicObservationDetailResponse,
} from './marketWatchlistObservationApiTypes'

export type PublicObservationDecodeRequest =
  | Readonly<{ kind: 'OBSERVATION_WATCHLIST'; query: ObservationListQuery }>
  | Readonly<{ kind: 'OBSERVATION_DETAIL'; query: ObservationDetailQuery }>

const decoded = new WeakSet<object>()
const ERROR_STATUS = Object.freeze({
  INVALID_ARGUMENT: 400,
  INVALID_CURSOR: 400,
  NOT_PUBLISHED: 404,
  NOT_FOUND: 404,
  BACKEND_UNAVAILABLE: 503,
  PUBLICATION_EXPIRED: 410,
  PUBLICATION_WITHDRAWN: 410,
  RESULT_CORRUPT: 503,
} satisfies Record<PublicObservationErrorCode, number>)

export class PublicObservationValidationError extends Error {
  constructor() {
    super('Public observation response failed contract validation')
    this.name = 'PublicObservationValidationError'
  }
}

function assert(condition: unknown): asserts condition {
  if (!condition) throw new PublicObservationValidationError()
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function validateCoverage(coverage: PublicObservationSourceCoverage): void {
  assert(coverage.observed_source_count >= coverage.expected_source_count)
}

function validateQuality(quality: PublicObservationDataQuality): void {
  validateCanonicalCodes(quality.reason_codes)
  assert(
    quality.status === 'COMPLETE'
      ? quality.reason_codes.length === 0
      : quality.reason_codes.length > 0,
  )
}

function validateCanonicalCodes(codes: readonly string[]): void {
  for (let index = 1; index < codes.length; index += 1) {
    assert(compareCodePoints(codes[index - 1], codes[index]) < 0)
  }
}

function validateCanonicalInstant(value: string): void {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{6})Z$/u.exec(
    value,
  )
  assert(match !== null)
  const [year, month, day, hour, minute, second, microsecond] = match
    .slice(1)
    .map(Number)
  assert(year >= 1)
  assert(month >= 1 && month <= 12)
  assert(day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate())
  assert(hour <= 23 && minute <= 59 && second <= 59 && microsecond <= 999_999)
}

function validatePublication(
  publication: PublicObservationPublication,
  queryKnownAt: string,
): void {
  ;[
    queryKnownAt,
    publication.as_of,
    publication.known_at,
    publication.public_available_at,
    publication.published_at,
    publication.fresh_until,
    publication.retain_until,
    publication.catalog.as_of,
    publication.catalog.available_at,
  ].forEach(validateCanonicalInstant)
  assert(publication.as_of <= publication.known_at)
  assert(publication.known_at <= publication.public_available_at)
  assert(publication.public_available_at <= publication.published_at)
  assert(publication.published_at <= queryKnownAt)
  assert(publication.published_at <= publication.fresh_until)
  assert(publication.public_available_at <= publication.fresh_until)
  assert(publication.fresh_until <= publication.retain_until)
  assert(queryKnownAt <= publication.retain_until)
  assert(publication.catalog.as_of <= publication.as_of)
  assert(publication.catalog.available_at <= publication.known_at)
  assert(
    publication.freshness ===
      (queryKnownAt <= publication.fresh_until ? 'FRESH' : 'STALE_RETAINED'),
  )
  validateCoverage(publication.source_coverage)
  validateQuality(publication.data_quality)
}

function validateMember(
  member: PublicObservationMember,
  publication: PublicObservationPublication,
): void {
  validateCanonicalInstant(member.signal_observed_at)
  validateCanonicalInstant(member.known_at)
  assert(member.catalog.analysis_unit_id === member.analysis_unit_id)
  assert(member.catalog.catalog_version === publication.catalog.catalog_version)
  assert(member.signal_observed_at <= member.known_at)
  assert(member.signal_observed_at <= publication.as_of)
  assert(member.known_at <= publication.known_at)
  validateCanonicalCodes(member.reason_codes)
  validateCoverage(member.source_coverage)
  validateQuality(member.data_quality)
}

function validateRequestBinding(
  response: PublicObservationWatchlistResponse | PublicObservationDetailResponse,
  request: PublicObservationDecodeRequest,
): void {
  assert(response.response_kind === request.kind)
  assert(response.query.query_known_at >= response.publication.published_at)
  assert(response.query.publication_id === response.publication.publication_id)
  if (request.kind === 'OBSERVATION_WATCHLIST') {
    assert(response.response_kind === 'OBSERVATION_WATCHLIST')
    assert(response.query.as_of === request.query.as_of)
    assert(response.query.sort === request.query.sort)
    assert(response.query.page_size === request.query.page_size)
    assert(response.query.cursor === request.query.cursor)
    if (request.query.publication_id !== null) {
      assert(response.query.publication_id === request.query.publication_id)
    }
    if (response.query.as_of !== null) {
      assert(response.query.as_of <= response.query.query_known_at)
      assert(response.publication.as_of <= response.query.as_of)
    }
    return
  }
  assert(response.response_kind === 'OBSERVATION_DETAIL')
  assert(response.query.publication_id === request.query.publication_id)
  assert(response.query.analysis_unit_id === request.query.analysis_unit_id)
}

function validateWatchlist(response: PublicObservationWatchlistResponse): void {
  validatePublication(response.publication, response.query.query_known_at)
  assert(response.members.length <= response.query.page_size)
  assert(response.members.length <= response.total)
  assert(response.total === 0 ? response.members.length === 0 : response.members.length > 0)
  assert(response.total !== 0 || response.next_cursor === null)
  if (response.next_cursor !== null) assert(response.members.length > 0)

  const identities = new Set<string>()
  const observationIds = new Set<string>()
  let previous: PublicObservationMember | null = null
  for (const member of response.members) {
    validateMember(member, response.publication)
    assert(member.position <= response.total)
    assert(!identities.has(member.analysis_unit_id))
    assert(!observationIds.has(member.observation_id))
    identities.add(member.analysis_unit_id)
    observationIds.add(member.observation_id)
    if (previous !== null) {
      assert(member.position === previous.position + 1)
      assert(previous.signal_observed_at >= member.signal_observed_at)
      if (previous.signal_observed_at === member.signal_observed_at) {
        assert(compareCodePoints(previous.analysis_unit_id, member.analysis_unit_id) < 0)
      }
    }
    previous = member
  }

  if (response.members.length > 0) {
    const first = response.members[0]
    const last = response.members[response.members.length - 1]
    if (response.query.cursor === null) assert(first.position === 1)
    assert(response.next_cursor === null ? last.position === response.total : last.position < response.total)
  }
}

function validateDetail(response: PublicObservationDetailResponse): void {
  validatePublication(response.publication, response.query.query_known_at)
  validateMember(response.member, response.publication)
  assert(response.member.analysis_unit_id === response.query.analysis_unit_id)
}

export function decodePublicObservationDocument(
  input: unknown,
  request: PublicObservationDecodeRequest,
  httpStatus: number,
): PublicObservationDocument {
  try {
    const document: unknown = structuredClone(input)
    assert(validateMarketWatchlistObservationApiResponse(document))
    const typed = document as PublicObservationDocument
    if (typed.response_kind === 'ERROR') {
      assert(ERROR_STATUS[typed.error.code] === httpStatus)
      assert(typed.error.retryable === (typed.error.code === 'BACKEND_UNAVAILABLE'))
    } else {
      assert(httpStatus === 200)
      validateRequestBinding(typed, request)
      if (typed.response_kind === 'OBSERVATION_WATCHLIST') validateWatchlist(typed)
      else validateDetail(typed)
    }
    deepFreeze(typed)
    decoded.add(typed)
    return typed
  } catch (error) {
    if (error instanceof PublicObservationValidationError) throw error
    throw new PublicObservationValidationError()
  }
}

export function isDecodedPublicObservationDocument(
  value: unknown,
): value is PublicObservationDocument {
  return value !== null && typeof value === 'object' && decoded.has(value)
}
