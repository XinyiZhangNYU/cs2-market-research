import type { NativeCnyTrendingDay, NativeCnyTrendingMember,
  NativeCnyTrendingSelection } from '../api/HttpNativeCnyTrendingGateway'
import { nativeCnyTimestampMicros } from '../wire/nativeCnyTimestamp'

export class NativeCnyTrendingViewError extends Error {
  constructor(readonly code: 'INVALID_SELECTION' | 'INVALID_RESPONSE') {
    super(code)
    this.name = 'NativeCnyTrendingViewError'
  }
}

const HASH_KEYS = ['publicationId', 'publicSha256', 'rightsSha256',
  'readinessReviewSha256', 'candidateSha256', 'catalogPublicationId'] as const

function calendarDay(value: unknown): number {
  if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u.test(value) ||
      value.startsWith('0000-')) throw new NativeCnyTrendingViewError('INVALID_SELECTION')
  const day = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== value)
    throw new NativeCnyTrendingViewError('INVALID_SELECTION')
  return day
}

/** Copy all external pins before a request. Absent selection is not a latest request. */
export function snapshotNativeCnyTrendingSelection(
  input: NativeCnyTrendingSelection,
): NativeCnyTrendingSelection {
  try {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) throw new Error()
    const selection = {
      publicationId: input.publicationId, publicSha256: input.publicSha256,
      rightsSha256: input.rightsSha256, readinessReviewSha256: input.readinessReviewSha256,
      candidateSha256: input.candidateSha256, catalogPublicationId: input.catalogPublicationId,
      startDate: input.startDate, endDate: input.endDate, knownAt: input.knownAt,
    }
    if (!HASH_KEYS.every(key => typeof selection[key] === 'string' &&
        /^[0-9a-f]{64}$/u.test(selection[key]))) throw new Error()
    if (calendarDay(selection.endDate) - calendarDay(selection.startDate) !== 30 * 86400_000)
      throw new Error()
    nativeCnyTimestampMicros(selection.knownAt)
    return Object.freeze(selection)
  } catch {
    throw new NativeCnyTrendingViewError('INVALID_SELECTION')
  }
}

export type NativeCnyTrendingMemberView = Readonly<NativeCnyTrendingMember & {
  exactReturnText: string
}>

export type NativeCnyTrendingViewModel = Readonly<{
  selectionPins: NativeCnyTrendingSelection
  publicationId: string
  publicSha256: string
  rightsSha256: string
  readinessReviewSha256: string
  releasedAt: string
  currency: 'CNY'
  fxApplied: false
  method: NativeCnyTrendingDay['method']
  startDate: string
  endDate: string
  asOf: string
  inputAvailableAt: string
  evidenceClass: NativeCnyTrendingDay['evidenceClass']
  historicalMembershipQualified: false
  members: readonly NativeCnyTrendingMemberView[]
  gainers: readonly NativeCnyTrendingMemberView[]
  losers: readonly NativeCnyTrendingMemberView[]
}>

/** Lossless text of the already-decoded ratio; no Number, percent or rounding. */
export function nativeCnyTrendingExactReturnText(exact: NativeCnyTrendingMember['returnExact']): string {
  const numerator = exact.numerator_hex.startsWith('-')
    ? `-0x${exact.numerator_hex.slice(1)}` : `0x${exact.numerator_hex}`
  return `${numerator} / 0x${exact.denominator_hex}`
}

/** Presentation of an already-decoded native day, not a replacement wire decoder.
 * External pins remain caller-provided evidence, never rights/review certification.
 * Neither member ordering nor the exact endpoint-return method is recalculated. */
export function nativeCnyTrendingViewModel(
  day: NativeCnyTrendingDay, input: NativeCnyTrendingSelection,
): NativeCnyTrendingViewModel {
  const selection = snapshotNativeCnyTrendingSelection(input)
  if (day.currency !== 'CNY' || day.fxApplied !== false ||
      day.method !== 'TRENDING_NATIVE_CNY_EXACT_ENDPOINTS_V1' ||
      day.historicalMembershipQualified !== false ||
      day.publicationId !== selection.publicationId || day.publicSha256 !== selection.publicSha256 ||
      day.rightsSha256 !== selection.rightsSha256 || day.readinessReviewSha256 !== selection.readinessReviewSha256 ||
      day.startDate !== selection.startDate || day.endDate !== selection.endDate)
    throw new NativeCnyTrendingViewError('INVALID_RESPONSE')
  const members = Object.freeze(day.members.map(member => Object.freeze({ ...member,
    returnExact: Object.freeze({ ...member.returnExact }),
    exactReturnText: nativeCnyTrendingExactReturnText(member.returnExact),
  })))
  return Object.freeze({ selectionPins: selection,
    publicationId: day.publicationId, publicSha256: day.publicSha256,
    rightsSha256: day.rightsSha256, readinessReviewSha256: day.readinessReviewSha256,
    releasedAt: day.releasedAt, currency: day.currency, fxApplied: day.fxApplied, method: day.method,
    startDate: day.startDate, endDate: day.endDate, asOf: day.asOf,
    inputAvailableAt: day.inputAvailableAt, evidenceClass: day.evidenceClass,
    historicalMembershipQualified: day.historicalMembershipQualified, members,
    gainers: Object.freeze(members.filter(member => member.direction === 'GAINERS')),
    losers: Object.freeze(members.filter(member => member.direction === 'LOSERS')),
  })
}
