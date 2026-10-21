import { nativeCnyTimestampMicros } from './nativeCnyTimestamp'

// This is a separate native-CNY wire, not a variant of the USD index DTO.
// Pins must come from the caller's external release selection. Matching a pin
// does not verify rights/review approval or admit a release for production.
export const NATIVE_CNY_INDEX_PUBLIC_SCHEMA = 'native-cny-index-public-day/1' as const
export const NATIVE_CNY_INDEX_BASIS = 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1' as const
/** V1: robust equal-weight return chain. Still served (before the selector switch, and as rollback). */
export const NATIVE_CNY_INDEX_METHOD = 'ROBUST_EQUAL_NATIVE_CNY_EXACT_V1' as const
/** H: price-tier balanced geometric index (backend native_cny_geometric_index.METHOD_H). */
export const NATIVE_CNY_INDEX_METHOD_H = 'PRICE_TIER_BALANCED_NATIVE_CNY_V1' as const
/** E: equal-weight geometric cohort curve (backend METHOD_E). Research second curve only:
 * read by its own spec from history, never the selector, never from /index/day. */
export const NATIVE_CNY_INDEX_METHOD_E = 'EQUAL_GEOMETRIC_COHORT_NATIVE_CNY_V1' as const
export const NATIVE_CNY_INDEX_HISTORY_CONTRACT = 'native-cny-index-history/1' as const
export const NATIVE_CNY_INDEX_ERROR_CONTRACT = 'native-cny-index-day/1' as const
export const MAX_NATIVE_CNY_INDEX_WINDOW_DAYS = 3660

// The rule of the spec that computed the day. V1: exact rationals (spec/2) or the
// fixed 50-significant-digit scale state (spec/3). H: the fixed 50-digit cumulative
// log chain. All round only for display.
const V1_NUMERIC_SEMANTICS = [
  'EXACT_PRIVATE_CALCULATION_DISPLAY_ONLY_ROUNDING',
  'FIXED_50_SIGNIFICANT_DECIMAL_DIGITS_ROUND_HALF_EVEN_SCALE_STATE_DISPLAY_ROUNDING',
] as const
const GEOMETRIC_NUMERIC_SEMANTICS = [
  'FIXED_50_SIGNIFICANT_DECIMAL_DIGITS_CUMULATIVE_LOG_CHAIN_ROUND_HALF_EVEN_DISPLAY_ROUNDING',
] as const
const AVAILABILITIES = [
  'CONTEMPORANEOUS_EOD_NOT_ARCHIVE_LAST_OBSERVATION',
  'ARCHIVE_LAST_OBSERVED_UTC_DAY_RECONSTRUCTED_LATE_BOUND',
] as const
const QUALITIES = ['UNAVAILABLE', 'LOW', 'PARTIAL', 'HIGH'] as const
const ARCHIVE_UNRESOLVED_STATE = 'HISTORY_SCOPE_UNRESOLVED_ORIGINS' as const
const V1_STATES = [
  'BELOW_MINIMUM_INTERPRETABLE_COVERAGE',
  'ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN',
  'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN',
] as const
const GEOMETRIC_STATES = [
  'BELOW_MINIMUM_INTERPRETABLE_COVERAGE',
  'ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN',
  'NEW_SEGMENT_BASE_NO_CROSS_BASIS_OR_GAP_RETURN',
] as const
const V1_ESTIMATORS = ['SYMMETRIC_1_PERCENT_WINSOR', 'RAW_EQUAL_ADMITTED_NO_WINSOR'] as const
const H_ESTIMATORS = ['PRICE_TIER_BALANCED_H', 'EQUAL_GEOMETRIC_NO_WINSOR'] as const
const E_ESTIMATORS = ['EQUAL_GEOMETRIC_COHORT_NO_WINSOR', 'EQUAL_GEOMETRIC_NO_WINSOR'] as const
// Per published method, as the gateway's METHOD_RULES: numeric semantics, measured-day
// states and estimators are bound to the method, never mixed. A method absent here
// (e.g. the deferred ROBUST_EQUAL_GEOMETRIC_NATIVE_CNY_V2) is rejected like any unknown
// value. The archive-only HISTORY_SCOPE_UNRESOLVED_ORIGINS state is allowed for either.
const METHOD_RULES = {
  [NATIVE_CNY_INDEX_METHOD]: { numeric: V1_NUMERIC_SEMANTICS, states: V1_STATES, estimators: V1_ESTIMATORS },
  [NATIVE_CNY_INDEX_METHOD_H]: { numeric: GEOMETRIC_NUMERIC_SEMANTICS, states: GEOMETRIC_STATES, estimators: H_ESTIMATORS },
  [NATIVE_CNY_INDEX_METHOD_E]: { numeric: GEOMETRIC_NUMERIC_SEMANTICS, states: GEOMETRIC_STATES, estimators: E_ESTIMATORS },
} as const
const METHODS = [NATIVE_CNY_INDEX_METHOD, NATIVE_CNY_INDEX_METHOD_H, NATIVE_CNY_INDEX_METHOD_E] as const
type MethodRules = (typeof METHOD_RULES)[keyof typeof METHOD_RULES]
const NUMERIC_SEMANTICS = [...V1_NUMERIC_SEMANTICS, ...GEOMETRIC_NUMERIC_SEMANTICS] as const
const STATES = [...V1_STATES, 'ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN', ARCHIVE_UNRESOLVED_STATE] as const
const ESTIMATORS = [...V1_ESTIMATORS, ...H_ESTIMATORS, E_ESTIMATORS[0]] as const
/** The measured adjacent-day return state of either method: the only state whose return
 * is shown and whose line may connect to the previous day. */
export const NATIVE_CNY_ADJACENT_RETURN_STATES = Object.freeze([
  'ADJACENT_NATIVE_CNY_ROBUST_EQUAL_RETURN', 'ADJACENT_NATIVE_CNY_GEOMETRIC_RETURN',
] as const)
export type NativeCnyIndexMethod = (typeof METHODS)[number]
export type NativeCnyIndexState = (typeof STATES)[number]
export function isNativeCnyAdjacentReturnState(state: NativeCnyIndexState): boolean {
  return (NATIVE_CNY_ADJACENT_RETURN_STATES as readonly string[]).includes(state)
}
const ERROR_STATUSES = { INVALID_REQUEST: 400, NOT_PUBLISHED: 404, TEMPORARILY_UNAVAILABLE: 503 } as const

export type NativeCnyIndexPublicationPin = Readonly<{ bucket_date: string; publication_id: string }>
export type NativeCnyIndexDayRequest = Readonly<{
  kind: 'DAY'
  publication_id: string
  spec_sha256: string
  scope_code: string
  bucket_date: string
}>
export type NativeCnyIndexHistoryRequest = Readonly<{
  kind: 'HISTORY'
  spec_sha256: string
  scope_code: string
  start_date: string
  end_date: string
  // Complete, ordered pins for the expected published days in this window.
  // The history route has no publication query; these are local decode targets.
  publication_pins: readonly NativeCnyIndexPublicationPin[]
}>
/** Discovery is explicit; pinned readers retain their original target checks. */
export type NativeCnyIndexCurrentRequest = Readonly<{ kind: 'CURRENT' }>
export type NativeCnyIndexWindowRequest = Readonly<{
  kind: 'WINDOW'
  spec_sha256: string
  scope_code: string
  start_date: string
  end_date: string
}>
export type NativeCnyIndexRequest = NativeCnyIndexDayRequest | NativeCnyIndexHistoryRequest
  | NativeCnyIndexCurrentRequest | NativeCnyIndexWindowRequest

export type NativeCnyIndexPublicPoint = Readonly<{
  scope_code: string
  expected_member_count: number
  paired_member_count: number
  qualified_member_count: number
  rejected_return_domain_count: number
  absolute_price_qualified_member_count: number
  segment_number: number
  grade_counts: Readonly<Record<'A' | 'B' | 'C' | 'D' | 'E', number>>
  source_pair_counts: Readonly<Record<string, number>>
  warnings: readonly 'GRADE_D_SHARE_ABOVE_WARNING_LEVEL'[]
  absolute_price_semantic: 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE'
  period_return_display: string | null
  index_display: string | null
  ask_sum_cny_display: string | null
  ask_median_cny_display: string | null
  price_quality: typeof QUALITIES[number]
  return_quality: typeof QUALITIES[number]
  state: NativeCnyIndexState
  effective_estimator: typeof ESTIMATORS[number] | null
}>
export type NativeCnyIndexPublicData = Readonly<{
  schema: typeof NATIVE_CNY_INDEX_PUBLIC_SCHEMA
  basis: typeof NATIVE_CNY_INDEX_BASIS
  method: NativeCnyIndexMethod
  currency: 'CNY'
  fx_applied: false
  price_unit: 'CNY_MAJOR'
  numeric_semantics: (typeof NUMERIC_SEMANTICS)[number]
  bucket_date: string
  measured_at: string
  spec_sha256: string
  availability: typeof AVAILABILITIES[number]
  points: readonly NativeCnyIndexPublicPoint[]
}>
export type NativeCnyIndexPublicDay = Readonly<{
  publication_id: string
  public_sha256: string
  rights_sha256: string
  review_sha256: string
  released_at: string
  data: NativeCnyIndexPublicData
}>
export type NativeCnyIndexPublicHistory = Readonly<{
  api_contract: typeof NATIVE_CNY_INDEX_HISTORY_CONTRACT
  spec_sha256: string
  scope: string
  start_date: string
  end_date: string
  currency: 'CNY'
  fx_applied: false
  days: readonly NativeCnyIndexPublicDay[]
  missing_publication_dates: readonly string[]
  missing_prices_filled: false
  calculation_revisions_mixed: false
}>
export type NativeCnyIndexReadResult =
  | Readonly<{ kind: 'DAY'; day: NativeCnyIndexPublicDay }>
  | Readonly<{ kind: 'HISTORY'; history: NativeCnyIndexPublicHistory }>
  | Readonly<{
      kind: 'ERROR'
      api_contract: typeof NATIVE_CNY_INDEX_ERROR_CONTRACT
      error: keyof typeof ERROR_STATUSES
      http_status: typeof ERROR_STATUSES[keyof typeof ERROR_STATUSES]
    }>

export class NativeCnyIndexWireError extends TypeError {
  constructor(readonly code: 'INVALID_REQUEST_TARGET' | 'INVALID_RESPONSE' | 'TARGET_MISMATCH' | 'HTTP_STATUS_MISMATCH') {
    super(`native CNY index wire rejected: ${code}`)
    this.name = 'NativeCnyIndexWireError'
  }
}

function requireValue(condition: unknown, code: NativeCnyIndexWireError['code'] = 'INVALID_RESPONSE'): asserts condition {
  if (!condition) throw new NativeCnyIndexWireError(code)
}
function record(value: unknown): Record<string, unknown> {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}
function exactFields(value: Record<string, unknown>, fields: readonly string[]): void {
  requireValue(Object.keys(value).length === fields.length && fields.every((key) => Object.hasOwn(value, key)))
}
function hash(value: unknown): string {
  requireValue(typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value))
  return value
}
function scope(value: unknown): string {
  requireValue(typeof value === 'string' && /^[A-Z][A-Z0-9_:]{0,127}$/u.test(value))
  return value
}
function calendarDay(value: unknown): string {
  requireValue(typeof value === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u.test(value) && !value.startsWith('0000-'))
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  requireValue(Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value)
  return value
}
function timestamp(value: unknown): string {
  requireValue(typeof value === 'string')
  try { nativeCnyTimestampMicros(value) }
  catch { throw new NativeCnyIndexWireError('INVALID_RESPONSE') }
  return value
}
function count(value: unknown): number {
  requireValue(typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1_000_000)
  return value
}
function display(value: unknown): string | null {
  requireValue(value === null || typeof value === 'string' && value.length <= 200 && /^-?[0-9]+(?:\.[0-9]+)?$/u.test(value))
  return value
}
function member<const T extends readonly string[]>(value: unknown, choices: T): T[number] {
  requireValue(typeof value === 'string' && choices.includes(value))
  return value
}
function calendarWindow(start: string, end: string): string[] {
  const first = Date.parse(`${start}T00:00:00Z`)
  const last = Date.parse(`${end}T00:00:00Z`)
  const size = (last - first) / 86_400_000 + 1
  requireValue(Number.isInteger(size) && size >= 1 && size <= MAX_NATIVE_CNY_INDEX_WINDOW_DAYS)
  // Calendar enumeration is only for coverage validation, never price filling.
  return Array.from({ length: size }, (_, i) => new Date(first + i * 86_400_000).toISOString().slice(0, 10))
}

/** Snapshot targets before any await. CURRENT discovers a release; WINDOW pins its spec. */
export function snapshotNativeCnyIndexRequest(input: NativeCnyIndexRequest): NativeCnyIndexRequest {
  try {
    const target = record(input)
    if (target.kind === 'CURRENT') {
      exactFields(target, ['kind'])
      return Object.freeze({ kind: 'CURRENT' })
    }
    const spec_sha256 = hash(target.spec_sha256)
    const scope_code = scope(target.scope_code)
    if (target.kind === 'DAY') {
      exactFields(target, ['kind', 'publication_id', 'spec_sha256', 'scope_code', 'bucket_date'])
      return Object.freeze({ kind: 'DAY', spec_sha256, scope_code,
        publication_id: hash(target.publication_id), bucket_date: calendarDay(target.bucket_date) })
    }
    if (target.kind === 'WINDOW') {
      exactFields(target, ['kind', 'spec_sha256', 'scope_code', 'start_date', 'end_date'])
      const start_date = calendarDay(target.start_date)
      const end_date = calendarDay(target.end_date)
      calendarWindow(start_date, end_date)
      return Object.freeze({ kind: 'WINDOW', spec_sha256, scope_code, start_date, end_date })
    }
    requireValue(target.kind === 'HISTORY')
    exactFields(target, ['kind', 'spec_sha256', 'scope_code', 'start_date', 'end_date', 'publication_pins'])
    const start_date = calendarDay(target.start_date)
    const end_date = calendarDay(target.end_date)
    const days = calendarWindow(start_date, end_date)
    requireValue(Array.isArray(target.publication_pins) && target.publication_pins.length <= days.length)
    let prior = ''
    const publication_pins = Array.from(target.publication_pins, (inputPin: unknown) => {
      const pin = record(inputPin)
      exactFields(pin, ['bucket_date', 'publication_id'])
      const bucket_date = calendarDay(pin.bucket_date)
      requireValue(bucket_date >= start_date && bucket_date <= end_date && bucket_date > prior)
      prior = bucket_date
      return Object.freeze({ bucket_date, publication_id: hash(pin.publication_id) })
    })
    return Object.freeze({ kind: 'HISTORY', spec_sha256, scope_code, start_date, end_date,
      publication_pins: Object.freeze(publication_pins) })
  } catch {
    throw new NativeCnyIndexWireError('INVALID_REQUEST_TARGET')
  }
}

function decodePoint(
  input: unknown, expectedScope: string, availability: NativeCnyIndexPublicData['availability'], rules: MethodRules,
): NativeCnyIndexPublicPoint {
  const point = record(input)
  exactFields(point, ['scope_code', 'expected_member_count', 'paired_member_count', 'qualified_member_count',
    'rejected_return_domain_count', 'grade_counts', 'source_pair_counts', 'warnings',
    'absolute_price_qualified_member_count', 'absolute_price_semantic', 'period_return_display',
    'index_display', 'segment_number', 'price_quality', 'return_quality', 'state', 'effective_estimator',
    'ask_sum_cny_display', 'ask_median_cny_display'])
  const scope_code = scope(point.scope_code)
  requireValue(scope_code === expectedScope, 'TARGET_MISMATCH')
  const grades = record(point.grade_counts)
  exactFields(grades, ['A', 'B', 'C', 'D', 'E'])
  const grade_counts = Object.freeze({ A: count(grades.A), B: count(grades.B), C: count(grades.C), D: count(grades.D), E: count(grades.E) })
  const pairs = record(point.source_pair_counts)
  requireValue(Object.keys(pairs).length <= 49)
  const source_pair_counts: Record<string, number> = Object.create(null) as Record<string, number>
  for (const [key, value] of Object.entries(pairs)) {
    requireValue(/^[1-7]->[1-7]$/u.test(key))
    source_pair_counts[key] = count(value)
  }
  requireValue(Array.isArray(point.warnings) && (point.warnings.length === 0 ||
    point.warnings.length === 1 && point.warnings[0] === 'GRADE_D_SHARE_ABOVE_WARNING_LEVEL'))
  requireValue(point.absolute_price_semantic === 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE')
  const state: NativeCnyIndexState = point.state === ARCHIVE_UNRESOLVED_STATE ? ARCHIVE_UNRESOLVED_STATE
    : member(point.state, rules.states)
  const segment_number = count(point.segment_number)
  const period_return_display = display(point.period_return_display)
  const index_display = display(point.index_display)
  if (state === ARCHIVE_UNRESOLVED_STATE) {
    requireValue(availability === AVAILABILITIES[1] && segment_number === 0 &&
      period_return_display === null && index_display === null)
  }
  return Object.freeze({ scope_code,
    expected_member_count: count(point.expected_member_count), paired_member_count: count(point.paired_member_count),
    qualified_member_count: count(point.qualified_member_count), rejected_return_domain_count: count(point.rejected_return_domain_count),
    absolute_price_qualified_member_count: count(point.absolute_price_qualified_member_count), segment_number,
    grade_counts, source_pair_counts: Object.freeze(source_pair_counts),
    warnings: Object.freeze([...point.warnings]) as NativeCnyIndexPublicPoint['warnings'],
    absolute_price_semantic: 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE', period_return_display, index_display,
    ask_sum_cny_display: display(point.ask_sum_cny_display), ask_median_cny_display: display(point.ask_median_cny_display),
    price_quality: member(point.price_quality, QUALITIES), return_quality: member(point.return_quality, QUALITIES),
    state, effective_estimator: point.effective_estimator === null ? null : member(point.effective_estimator, rules.estimators) })
}

function decodeDay(input: unknown, target: NativeCnyIndexDayRequest | null, selector: boolean): NativeCnyIndexPublicDay {
  const day = record(input)
  exactFields(day, ['publication_id', 'public_sha256', 'rights_sha256', 'review_sha256', 'released_at', 'data'])
  const publication_id = hash(day.publication_id)
  if (target !== null) requireValue(publication_id === target.publication_id, 'TARGET_MISMATCH')
  const data = record(day.data)
  exactFields(data, ['schema', 'basis', 'method', 'currency', 'fx_applied', 'price_unit', 'numeric_semantics',
    'bucket_date', 'measured_at', 'spec_sha256', 'availability', 'points'])
  requireValue(data.schema === NATIVE_CNY_INDEX_PUBLIC_SCHEMA && data.basis === NATIVE_CNY_INDEX_BASIS &&
    data.currency === 'CNY' && data.fx_applied === false && data.price_unit === 'CNY_MAJOR')
  const method = member(data.method, METHODS)
  // E is never the selected release: a CURRENT or pinned /index/day answer carrying E is rejected.
  if (selector) requireValue(method !== NATIVE_CNY_INDEX_METHOD_E)
  const rules: MethodRules = METHOD_RULES[method]
  const numeric_semantics = member(data.numeric_semantics, rules.numeric)
  const bucket_date = calendarDay(data.bucket_date)
  const spec_sha256 = hash(data.spec_sha256)
  if (target !== null) requireValue(bucket_date === target.bucket_date && spec_sha256 === target.spec_sha256, 'TARGET_MISMATCH')
  const availability = member(data.availability, AVAILABILITIES)
  requireValue(Array.isArray(data.points) && data.points.length >= 1 && data.points.length <= 1000)
  if (target !== null) requireValue(data.points.length === 1)
  const points = data.points.map((point: unknown) => decodePoint(
    point, target?.scope_code ?? scope(record(point).scope_code), availability, rules,
  ))
  requireValue(new Set(points.map((point) => point.scope_code)).size === points.length)
  const publicData: NativeCnyIndexPublicData = Object.freeze({
    schema: NATIVE_CNY_INDEX_PUBLIC_SCHEMA, basis: NATIVE_CNY_INDEX_BASIS, method,
    currency: 'CNY', fx_applied: false, price_unit: 'CNY_MAJOR',
    numeric_semantics, bucket_date, spec_sha256,
    measured_at: timestamp(data.measured_at), availability,
    points: Object.freeze(points),
  })
  // public_sha256 is the server's whole public artifact hash (scope-filtered
  // data is not that artifact). Do not claim to recompute approval or this hash.
  return Object.freeze({ publication_id, public_sha256: hash(day.public_sha256), rights_sha256: hash(day.rights_sha256),
    review_sha256: hash(day.review_sha256), released_at: timestamp(day.released_at), data: publicData })
}

function decodeHistory(input: unknown, target: NativeCnyIndexHistoryRequest | NativeCnyIndexWindowRequest): NativeCnyIndexPublicHistory {
  const history = record(input)
  exactFields(history, ['api_contract', 'spec_sha256', 'scope', 'start_date', 'end_date', 'currency', 'fx_applied',
    'days', 'missing_publication_dates', 'missing_prices_filled', 'calculation_revisions_mixed'])
  requireValue(history.api_contract === NATIVE_CNY_INDEX_HISTORY_CONTRACT && history.currency === 'CNY' &&
    history.fx_applied === false && history.missing_prices_filled === false && history.calculation_revisions_mixed === false)
  const spec_sha256 = hash(history.spec_sha256)
  const scope_code = scope(history.scope)
  const start_date = calendarDay(history.start_date)
  const end_date = calendarDay(history.end_date)
  requireValue(spec_sha256 === target.spec_sha256 && scope_code === target.scope_code &&
    start_date === target.start_date && end_date === target.end_date, 'TARGET_MISMATCH')
  const window = calendarWindow(start_date, end_date)
  requireValue(Array.isArray(history.days) && history.days.length <= window.length)
  if (target.kind === 'HISTORY') requireValue(history.days.length >= 1 && history.days.length === target.publication_pins.length)
  let prior = ''
  const days = Array.from(history.days, (inputDay: unknown, i: number) => {
    // Unpinned history still validates the entire day before accepting its identity.
    const decoded = target.kind === 'HISTORY' ? decodeDay(inputDay, {
      kind: 'DAY', spec_sha256, scope_code, ...target.publication_pins[i],
    }, false) : decodeDay(inputDay, null, false)
    const data = decoded.data
    requireValue(data.spec_sha256 === spec_sha256 && data.points.length === 1 &&
      data.points[0]?.scope_code === scope_code, 'TARGET_MISMATCH')
    requireValue(data.bucket_date > prior && data.bucket_date >= start_date && data.bucket_date <= end_date)
    prior = data.bucket_date
    return decoded
  })
  // One spec is one method: a history answer never mixes calculation methods.
  requireValue(days.every((day) => day.data.method === days[0]!.data.method))
  const present = new Set(days.map((day) => day.data.bucket_date))
  const expectedMissing = calendarWindow(start_date, end_date).filter((day) => !present.has(day))
  const missingDates = history.missing_publication_dates
  requireValue(Array.isArray(missingDates) && missingDates.length === expectedMissing.length &&
    expectedMissing.every((day, i) => day === missingDates[i]))
  // Preserve each published row's nullable displays, segment and availability;
  // no calendar rows, derived returns, FX or chart connections are synthesized.
  return Object.freeze({ api_contract: NATIVE_CNY_INDEX_HISTORY_CONTRACT, spec_sha256, scope: scope_code,
    start_date, end_date, currency: 'CNY', fx_applied: false, days: Object.freeze(days),
    missing_publication_dates: Object.freeze([...expectedMissing]), missing_prices_filled: false, calculation_revisions_mixed: false })
}

/** Current discovery and pinned/window reads share all schema and value checks. */
export function decodeNativeCnyIndexResponse(
  input: unknown,
  httpStatus: number,
  request: NativeCnyIndexRequest,
): NativeCnyIndexReadResult {
  const target = snapshotNativeCnyIndexRequest(request)
  if (httpStatus !== 200) {
    const error = record(input)
    exactFields(error, ['api_contract', 'error'])
    requireValue(error.api_contract === NATIVE_CNY_INDEX_ERROR_CONTRACT && typeof error.error === 'string' &&
      Object.hasOwn(ERROR_STATUSES, error.error))
    const code = error.error as keyof typeof ERROR_STATUSES
    const status = ERROR_STATUSES[code]
    requireValue(httpStatus === status, 'HTTP_STATUS_MISMATCH')
    return Object.freeze({ kind: 'ERROR', api_contract: NATIVE_CNY_INDEX_ERROR_CONTRACT, error: code, http_status: status })
  }
  return target.kind === 'DAY' || target.kind === 'CURRENT'
    ? Object.freeze({ kind: 'DAY', day: decodeDay(input, target.kind === 'CURRENT' ? null : target, true) })
    : Object.freeze({ kind: 'HISTORY', history: decodeHistory(input, target) })
}
