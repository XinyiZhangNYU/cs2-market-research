import type {
  WireQualityConflictSummary,
  WireQualityQueryObservation,
  WireQualityResult,
  WireQualitySourceSummary,
} from './types'
import { compareCodePoints, isSortedByCodePoint, snapshotIdOf } from './canonical'

export const QUALITY_SEMANTIC_RULES = [
  'QUALITY_TIME_ORDER',
  'QUALITY_IDENTITY_SHAPE',
  'QUALITY_CELL_ACCOUNTING',
  'QUALITY_FRESHNESS_ACCOUNTING',
  'QUALITY_RATIO_MATCH',
  'QUALITY_SOURCE_RECONCILIATION',
  'QUALITY_QUERY_SHAPE',
  'QUALITY_CANONICAL_ORDER',
  'QUALITY_SNAPSHOT_ID_MATCH',
] as const

export type QualitySemanticRule = (typeof QUALITY_SEMANTIC_RULES)[number]

export class QualitySemanticViolation extends Error {
  readonly rule: QualitySemanticRule

  constructor(rule: QualitySemanticRule, message: string) {
    super(`${rule}: ${message}`)
    this.name = 'QualitySemanticViolation'
    this.rule = rule
  }
}

function fail(rule: QualitySemanticRule, message: string): never {
  throw new QualitySemanticViolation(rule, message)
}

function count(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail('QUALITY_CELL_ACCOUNTING', `${name} must be a non-negative safe integer`)
  }
  return value
}

function power10(exponent: number): bigint {
  return 10n ** BigInt(exponent)
}

function decimalFraction(text: string): readonly [bigint, number] {
  const match = /^(0|[1-9][0-9]*)(?:\.([0-9]+))?$/.exec(text)
  if (!match) fail('QUALITY_RATIO_MATCH', `${text} is not canonical decimal text`)
  const fraction = match[2] ?? ''
  return [BigInt(`${match[1]}${fraction}`), fraction.length]
}

// Python Decimal division uses precision 28 and ROUND_HALF_EVEN by default. The producer compares
// the received ratio to that Decimal value, so the frontend reproduces the same numeric value
// rather than using binary floating point or requiring an exact rational expansion.
function pythonDecimalRatio(numerator: number, denominator: number): readonly [bigint, number] {
  if (denominator === 0 || numerator === 0) return [0n, 0]
  if (numerator === denominator) return [1n, 0]
  const n = BigInt(numerator)
  const d = BigInt(denominator)
  let firstSignificantPlace = 0
  let scaled = n
  while (scaled < d) {
    scaled *= 10n
    firstSignificantPlace += 1
  }
  const places = firstSignificantPlace + 27
  const dividend = n * power10(places)
  let rounded = dividend / d
  const remainder = dividend % d
  const doubled = remainder * 2n
  if (doubled > d || (doubled === d && rounded % 2n === 1n)) rounded += 1n
  return [rounded, places]
}

function ratioMatches(text: string, numerator: number, denominator: number): boolean {
  const [actual, actualScale] = decimalFraction(text)
  const [expected, expectedScale] = pythonDecimalRatio(numerator, denominator)
  return actual * power10(expectedScale) === expected * power10(actualScale)
}

function compareTuple(left: readonly string[], right: readonly string[]): number {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    const compared = compareCodePoints(left[index], right[index])
    if (compared !== 0) return compared
  }
  return left.length - right.length
}

function canonicallySorted<T>(rows: readonly T[], key: (row: T) => readonly string[]): boolean {
  for (let index = 1; index < rows.length; index += 1) {
    if (compareTuple(key(rows[index - 1]), key(rows[index])) > 0) return false
  }
  return true
}

function checkIdentity(result: WireQualityResult): void {
  const identity = result.identity
  if (identity.scope_kind !== 'ITEM' || identity.analysis_unit_kind === null) {
    fail('QUALITY_IDENTITY_SHAPE', 'quality result requires an ITEM economic identity')
  }
  if (identity.edition_kind === null) {
    fail('QUALITY_IDENTITY_SHAPE', 'quality ITEM identity requires an edition')
  }
  if (identity.analysis_unit_kind === 'BASE_MHN') {
    if (identity.parent_analysis_unit_id !== null) {
      fail('QUALITY_IDENTITY_SHAPE', 'BASE_MHN quality identity cannot carry a parent')
    }
  } else {
    if (identity.parent_analysis_unit_id === null) {
      fail('QUALITY_IDENTITY_SHAPE', 'STYLE/PATTERN quality identity requires a parent')
    }
    if (identity.parent_analysis_unit_id === identity.analysis_unit_id) {
      fail('QUALITY_IDENTITY_SHAPE', 'quality identity cannot parent itself')
    }
  }
}

function checkSourceSummary(summary: WireQualitySourceSummary): void {
  const expected = count(summary.expected_feature_count, 'expected_feature_count')
  const observed = count(summary.observed_feature_count, 'observed_feature_count')
  const fresh = count(summary.fresh_feature_count, 'fresh_feature_count')
  const missing = count(summary.missing_feature_count, 'missing_feature_count')
  const stale = count(summary.stale_feature_count, 'stale_feature_count')
  if (observed + missing !== expected) {
    fail('QUALITY_SOURCE_RECONCILIATION', 'source feature accounting must be exact')
  }
  if (fresh + stale !== observed) {
    fail('QUALITY_SOURCE_RECONCILIATION', 'source freshness accounting must be exact')
  }
}

function checkConflict(conflict: WireQualityConflictSummary): void {
  if (!isSortedByCodePoint(conflict.participating_source_refs)) {
    fail('QUALITY_CANONICAL_ORDER', 'participating source references must be sorted')
  }
  if (new Set(conflict.participating_source_refs).size !== conflict.participating_source_refs.length) {
    fail('QUALITY_CANONICAL_ORDER', 'participating source references must be unique')
  }
}

function checkQuery(query: WireQualityQueryObservation, resultAvailableAt: string): void {
  if (query.available_at < query.observed_at || query.available_at > resultAvailableAt) {
    fail('QUALITY_TIME_ORDER', 'query observation time is outside the quality result window')
  }
  if (query.sample_state === 'POSITIVE_SAMPLE') {
    if (query.returned_member_count <= 0 || query.capability_state !== 'CONFIRMED') {
      fail('QUALITY_QUERY_SHAPE', 'a positive sample requires members and confirmed capability')
    }
  } else if (query.returned_member_count !== 0) {
    fail('QUALITY_QUERY_SHAPE', 'a zero current sample requires zero returned members')
  }
}

export function checkQualitySemantics(result: WireQualityResult): void {
  checkIdentity(result)
  if (result.identity.identity_available_at > result.as_of || result.available_at > result.as_of) {
    fail('QUALITY_TIME_ORDER', 'quality knowledge cannot be later than as_of')
  }

  const expected = count(result.expected_cell_count, 'expected_cell_count')
  const observed = count(result.observed_cell_count, 'observed_cell_count')
  const fresh = count(result.fresh_cell_count, 'fresh_cell_count')
  const missing = count(result.missing_cell_count, 'missing_cell_count')
  const stale = count(result.stale_cell_count, 'stale_cell_count')
  count(result.future_fact_count, 'future_fact_count')
  if (observed + missing !== expected) {
    fail('QUALITY_CELL_ACCOUNTING', 'aggregate cell accounting must be exact')
  }
  if (fresh + stale !== observed) {
    fail('QUALITY_FRESHNESS_ACCOUNTING', 'aggregate freshness accounting must be exact')
  }
  if (!ratioMatches(result.coverage_ratio, observed, expected)) {
    fail('QUALITY_RATIO_MATCH', 'coverage_ratio does not match aggregate counts')
  }
  if (!ratioMatches(result.fresh_coverage_ratio, fresh, expected)) {
    fail('QUALITY_RATIO_MATCH', 'fresh_coverage_ratio does not match aggregate counts')
  }

  result.source_summaries.forEach(checkSourceSummary)
  if (!canonicallySorted(result.source_summaries, (row) => [row.source_ref])) {
    fail('QUALITY_CANONICAL_ORDER', 'source summaries must be sorted')
  }
  if (new Set(result.source_summaries.map((row) => row.source_ref)).size !== result.source_summaries.length) {
    fail('QUALITY_SOURCE_RECONCILIATION', 'source summaries must be unique')
  }
  const totals = result.source_summaries.reduce(
    (sum, row) => ({
      expected: sum.expected + row.expected_feature_count,
      observed: sum.observed + row.observed_feature_count,
      fresh: sum.fresh + row.fresh_feature_count,
      missing: sum.missing + row.missing_feature_count,
      stale: sum.stale + row.stale_feature_count,
    }),
    { expected: 0, observed: 0, fresh: 0, missing: 0, stale: 0 },
  )
  if (
    totals.expected !== expected ||
    totals.observed !== observed ||
    totals.fresh !== fresh ||
    totals.missing !== missing ||
    totals.stale !== stale
  ) {
    fail('QUALITY_SOURCE_RECONCILIATION', 'source summaries do not reconcile to aggregates')
  }

  result.conflicts.forEach(checkConflict)
  if (!canonicallySorted(result.conflicts, (row) => [row.feature_key, row.reason_code])) {
    fail('QUALITY_CANONICAL_ORDER', 'quality conflicts must be sorted')
  }
  const conflictKeys = result.conflicts.map((row) => `${row.feature_key}\u0000${row.reason_code}`)
  if (new Set(conflictKeys).size !== conflictKeys.length) {
    fail('QUALITY_CANONICAL_ORDER', 'quality conflicts must be unique')
  }

  result.query_observations.forEach((row) => checkQuery(row, result.available_at))
  if (
    !canonicallySorted(result.query_observations, (row) => [
      row.source_ref,
      row.query_kind,
      row.observation_id,
    ])
  ) {
    fail('QUALITY_CANONICAL_ORDER', 'query observations must be sorted')
  }
  const queryIds = result.query_observations.map((row) => row.observation_id)
  if (new Set(queryIds).size !== queryIds.length || queryIds.includes(result.input_quality_snapshot_id)) {
    fail('QUALITY_QUERY_SHAPE', 'query observation IDs must be unique and distinct from the input snapshot')
  }

  if (result.snapshot_id !== snapshotIdOf(result as unknown as Record<string, unknown>)) {
    fail('QUALITY_SNAPSHOT_ID_MATCH', 'quality snapshot_id does not match canonical content')
  }
}
