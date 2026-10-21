import { boundedJsonFetch, boundedJsonTimeout } from './boundedJsonFetch'
import { canonicalHash } from '../wire/canonical'
import { parsePriceJson } from '../wire/priceDisplayJson'
import { nativeCnyTimestampMicros } from '../wire/nativeCnyTimestamp'

const PATH = '/api/v1/native-cny/trending/day'
const MAX_HEX = 4096
const BODY_FIELDS = ['schema', 'basis', 'currency', 'fx_applied', 'method',
  'numeric_semantics', 'candidate_sha256', 'catalog_publication_id', 'start_date',
  'end_date', 'as_of', 'input_available_at', 'evidence_class',
  'historical_membership_qualified', 'members']
const MEMBER_FIELDS = ['rank', 'direction', 'analysis_unit_id', 'display_name',
  'evidence_grade', 'supporting_source_count', 'return_exact', 'conservative_source']
const ENVELOPE_FIELDS = ['api_contract', 'publication_id', 'public_sha256',
  'rights_sha256', 'readiness_review_sha256', 'released_at', 'data']

export type NativeCnyTrendingSelection = Readonly<{
  publicationId: string
  publicSha256: string
  rightsSha256: string
  readinessReviewSha256: string
  candidateSha256: string
  catalogPublicationId: string
  startDate: string
  endDate: string
  knownAt: string
}>

export type NativeCnyTrendingMember = Readonly<{
  rank: number
  direction: 'GAINERS' | 'LOSERS'
  analysisUnitId: string
  displayName: string
  evidenceGrade: 'THREE_SOURCE_CONFIRMED' | 'TWO_SOURCE_SUPPORTED'
  supportingSourceCount: 2 | 3
  returnExact: Readonly<{ numerator_hex: string; denominator_hex: string }>
  conservativeSource: 'market_a' | 'market_c' | 'market_b'
}>

export type NativeCnyTrendingDay = Readonly<{
  publicationId: string
  catalogPublicationId: string
  candidateSha256: string
  publicSha256: string
  rightsSha256: string
  readinessReviewSha256: string
  releasedAt: string
  currency: 'CNY'
  fxApplied: false
  method: 'TRENDING_NATIVE_CNY_EXACT_ENDPOINTS_V1'
  startDate: string
  endDate: string
  asOf: string
  inputAvailableAt: string
  evidenceClass: 'CONTEMPORANEOUSLY_MEASURED' | 'HYBRID_BRIDGED' | 'RECONSTRUCTED_HISTORY'
  historicalMembershipQualified: false
  members: readonly NativeCnyTrendingMember[]
}>

export class NativeCnyTrendingClientError extends Error {
  constructor(readonly code: 'INVALID_SELECTION' | 'INVALID_RESPONSE' |
    'UNSUPPORTED_EXACT_SIZE' | 'NOT_PUBLISHED' | 'TEMPORARILY_UNAVAILABLE' | 'HTTP_FAILURE') {
    super(`Native CNY Trending: ${code}`)
    this.name = 'NativeCnyTrendingClientError'
  }
}

function requireWire(condition: unknown): asserts condition {
  if (!condition) throw new NativeCnyTrendingClientError('INVALID_RESPONSE')
}
function object(value: unknown, fields: readonly string[]): Record<string, unknown> {
  requireWire(value !== null && typeof value === 'object' && !Array.isArray(value))
  const result = value as Record<string, unknown>
  requireWire(Object.keys(result).length === fields.length &&
    fields.every((key) => Object.hasOwn(result, key)))
  return result
}
function hash(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value)
}
function calendarDate(value: unknown): number {
  requireWire(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value) &&
    value.slice(0, 4) !== '0000')
  const instant = Date.parse(`${value}T00:00:00Z`)
  requireWire(Number.isFinite(instant) && new Date(instant).toISOString().slice(0, 10) === value)
  return instant
}

// Keep Python's complete supported clock domain and exact comparisons. Extra
// zero tails are equivalent; nonzero unsupported precision is never truncated.
function clock(value: unknown): bigint {
  try { return nativeCnyTimestampMicros(value) }
  catch { throw new NativeCnyTrendingClientError('INVALID_RESPONSE') }
}

function validateSelection(selection: NativeCnyTrendingSelection): void {
  try {
    requireWire([selection.publicationId, selection.publicSha256, selection.rightsSha256,
      selection.readinessReviewSha256, selection.candidateSha256,
      selection.catalogPublicationId].every(hash))
    requireWire(calendarDate(selection.endDate) - calendarDate(selection.startDate) === 30 * 86400_000)
    clock(selection.knownAt)
  } catch {
    throw new NativeCnyTrendingClientError('INVALID_SELECTION')
  }
}

function ratio(value: unknown): { wire: NativeCnyTrendingMember['returnExact']; n: bigint; d: bigint } {
  const exact = object(value, ['numerator_hex', 'denominator_hex'])
  const a = exact.numerator_hex, b = exact.denominator_hex
  requireWire(typeof a === 'string' && typeof b === 'string')
  if (a.length > MAX_HEX || b.length > MAX_HEX) {
    throw new NativeCnyTrendingClientError('UNSUPPORTED_EXACT_SIZE')
  }
  requireWire(/^-?(?:0|[1-9a-f][0-9a-f]*)$/u.test(a) &&
    /^[1-9a-f][0-9a-f]*$/u.test(b))
  const n = a.startsWith('-') ? -BigInt(`0x${a.slice(1)}`) : BigInt(`0x${a}`)
  const d = BigInt(`0x${b}`)
  let x = n < 0n ? -n : n, y = d
  while (y !== 0n) { const remainder = x % y; x = y; y = remainder }
  requireWire(x === 1n)
  return { wire: Object.freeze({ numerator_hex: a, denominator_hex: b }), n, d }
}

/** Explicitly selected whole publication only. This validates bytes/bindings,
 * not current rights, independent review authenticity or production eligibility.
 * Exact values above this client's bound are rejected, never approximated. */
export function decodeNativeCnyTrendingDay(
  value: unknown, selection: NativeCnyTrendingSelection,
): NativeCnyTrendingDay {
  validateSelection(selection)
  const envelope = object(value, ENVELOPE_FIELDS)
  requireWire(envelope.api_contract === 'native-cny-trending-day/1' &&
    envelope.publication_id === selection.publicationId &&
    envelope.public_sha256 === selection.publicSha256 &&
    envelope.rights_sha256 === selection.rightsSha256 &&
    envelope.readiness_review_sha256 === selection.readinessReviewSha256)
  const doc = object(envelope.data, BODY_FIELDS)
  requireWire(doc.schema === 'native-cny-trending-public-day/1' &&
    doc.basis === 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1' && doc.currency === 'CNY' &&
    doc.fx_applied === false && doc.method === 'TRENDING_NATIVE_CNY_EXACT_ENDPOINTS_V1' &&
    doc.numeric_semantics === 'EXACT_NATIVE_CNY_RETURN_RATIO' &&
    doc.historical_membership_qualified === false &&
    doc.candidate_sha256 === selection.candidateSha256 &&
    doc.catalog_publication_id === selection.catalogPublicationId &&
    doc.start_date === selection.startDate && doc.end_date === selection.endDate)
  requireWire(clock(doc.input_available_at) <= clock(doc.as_of) &&
    clock(doc.as_of) <= clock(envelope.released_at) &&
    clock(envelope.released_at) <= clock(selection.knownAt))
  requireWire(['CONTEMPORANEOUSLY_MEASURED', 'HYBRID_BRIDGED', 'RECONSTRUCTED_HISTORY']
    .includes(doc.evidence_class as string))
  requireWire(canonicalHash(doc) === selection.publicSha256)
  requireWire(Array.isArray(doc.members) && doc.members.length <= 100)
  const seen = new Set<string>(), counts = { GAINERS: 0, LOSERS: 0 }
  const previous: Partial<Record<'GAINERS' | 'LOSERS', { n: bigint; d: bigint; unit: string }>> = {}
  let losers = false
  const members = doc.members.map((value): NativeCnyTrendingMember => {
    const row = object(value, MEMBER_FIELDS)
    const direction = row.direction
    requireWire(direction === 'GAINERS' || direction === 'LOSERS')
    requireWire(!(losers && direction === 'GAINERS'))
    losers ||= direction === 'LOSERS'
    counts[direction] += 1
    requireWire(row.rank === counts[direction] && counts[direction] <= 50)
    const unit = row.analysis_unit_id
    requireWire(typeof unit === 'string' && unit.length <= 128 && /^item:(?:0|[1-9][0-9]*)$/u.test(unit) && !seen.has(unit))
    seen.add(unit)
    requireWire(typeof row.display_name === 'string' && row.display_name.length > 0 &&
      Array.from(row.display_name).length <= 4096)
    const grade = row.evidence_grade
    requireWire(grade === 'THREE_SOURCE_CONFIRMED' || grade === 'TWO_SOURCE_SUPPORTED')
    const count = grade === 'THREE_SOURCE_CONFIRMED' ? 3 : 2
    requireWire(row.supporting_source_count === count &&
      ['market_a', 'market_c', 'market_b'].includes(row.conservative_source as string))
    const exact = ratio(row.return_exact)
    requireWire(direction === 'GAINERS' ? exact.n > 0n : -exact.d < exact.n && exact.n < 0n)
    const prior = previous[direction]
    if (prior !== undefined) {
      const difference = prior.n * exact.d - exact.n * prior.d
      requireWire((direction === 'GAINERS' ? difference > 0n : difference < 0n) ||
        (difference === 0n && prior.unit < unit))
    }
    previous[direction] = { n: exact.n, d: exact.d, unit }
    return Object.freeze({ rank: counts[direction], direction, analysisUnitId: unit,
      displayName: row.display_name, evidenceGrade: grade, supportingSourceCount: count,
      returnExact: exact.wire, conservativeSource: row.conservative_source as NativeCnyTrendingMember['conservativeSource'] })
  })
  return Object.freeze({ publicationId: selection.publicationId,
    catalogPublicationId: selection.catalogPublicationId, candidateSha256: selection.candidateSha256,
    publicSha256: selection.publicSha256, rightsSha256: selection.rightsSha256,
    readinessReviewSha256: selection.readinessReviewSha256, releasedAt: envelope.released_at as string,
    currency: 'CNY', fxApplied: false, method: 'TRENDING_NATIVE_CNY_EXACT_ENDPOINTS_V1',
    startDate: selection.startDate, endDate: selection.endDate, asOf: doc.as_of as string,
    inputAvailableAt: doc.input_available_at as string,
    evidenceClass: doc.evidence_class as NativeCnyTrendingDay['evidenceClass'],
    historicalMembershipQualified: false, members: Object.freeze(members) })
}

/** Current discovery uses the response's bindings, not caller-pinned identity.
 * Reuse ALL pinned wire checks (including exact hash, order and clocks). This
 * does not attest external rights/review authenticity or historical eligibility. */
export function decodeCurrentNativeCnyTrendingDay(value: unknown): NativeCnyTrendingDay {
  const envelope = object(value, ENVELOPE_FIELDS)
  const doc = object(envelope.data, BODY_FIELDS)
  try {
    return decodeNativeCnyTrendingDay(value, {
      publicationId: envelope.publication_id as string, publicSha256: envelope.public_sha256 as string,
      rightsSha256: envelope.rights_sha256 as string, readinessReviewSha256: envelope.readiness_review_sha256 as string,
      candidateSha256: doc.candidate_sha256 as string, catalogPublicationId: doc.catalog_publication_id as string,
      startDate: doc.start_date as string, endDate: doc.end_date as string,
      // No user-selected knowledge cutoff exists for current discovery.
      knownAt: envelope.released_at as string,
    })
  } catch (error) {
    if (error instanceof NativeCnyTrendingClientError && error.code === 'INVALID_SELECTION') {
      throw new NativeCnyTrendingClientError('INVALID_RESPONSE')
    }
    throw error
  }
}

/** Native-only transport; no legacy data fallback. */
export class HttpNativeCnyTrendingGateway {
  private readonly timeoutMs: number
  constructor(private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis), timeoutMs = 10_000) {
    this.timeoutMs = boundedJsonTimeout(timeoutMs)
  }
  async day(selection: NativeCnyTrendingSelection, signal?: AbortSignal): Promise<NativeCnyTrendingDay> {
    const frozenSelection = Object.freeze({ ...selection })
    validateSelection(frozenSelection)
    return decodeNativeCnyTrendingDay(await this.request(`${PATH}?publication=${frozenSelection.publicationId}`, signal), frozenSelection)
  }
  async current(signal?: AbortSignal): Promise<NativeCnyTrendingDay> {
    return decodeCurrentNativeCnyTrendingDay(await this.request(PATH, signal))
  }
  private async request(url: string, signal?: AbortSignal): Promise<unknown> {
    const result = await boundedJsonFetch(url, {
      fetcher: this.fetcher, timeoutMs: this.timeoutMs, maxBytes: 1024 * 1024 + 4096,
      signal, parseJson: parsePriceJson,
      init: { method: 'GET', credentials: 'omit', redirect: 'error', cache: 'no-store', headers: { Accept: 'application/json' } },
    })
    if (!result.ok) {
      const error = object(result.payload, ['api_contract', 'error'])
      requireWire(error.api_contract === 'native-cny-trending-day/1')
      if (result.status === 404 && error.error === 'NOT_PUBLISHED') throw new NativeCnyTrendingClientError('NOT_PUBLISHED')
      if (result.status === 503 && error.error === 'TEMPORARILY_UNAVAILABLE') throw new NativeCnyTrendingClientError('TEMPORARILY_UNAVAILABLE')
      throw new NativeCnyTrendingClientError('HTTP_FAILURE')
    }
    requireWire(result.status === 200)
    return result.payload
  }
}
