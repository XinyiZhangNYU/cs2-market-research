// The economic identity a result is attributed to, and the display-layer rules that keep two
// identities from being merged.
//
// Layering matters here. enums.ts mirrors state_machine/enums.py; the values below mirror
// Literal aliases in catalog/models.py and the validated string sets in storage/detail_staging.py.
// No state snapshot carries any of them, so none of this may be read off ItemStateSnapshot.

import { AnalysisUnitKind } from './enums'

// catalog/models.py: EditionKind = Literal["STANDARD", "STATTRAK", "SOUVENIR", "UNKNOWN"].
// Four values, not three. market_snapshot_facts.py rejects UNKNOWN, but that is the fact
// adapter refusing to record an unresolved edition — it does not remove the state from the
// catalog, and a UI that models three values has to invent a stand-in for the fourth.
export const EditionKind = {
  STANDARD: 'STANDARD',
  STATTRAK: 'STATTRAK',
  SOUVENIR: 'SOUVENIR',
  UNKNOWN: 'UNKNOWN',
} as const
export type EditionKind = (typeof EditionKind)[keyof typeof EditionKind]

// catalog/models.py: PromotionStatus = Literal["BASE_MHN", "INTERNAL_VARIANT"].
export const PromotionStatus = {
  BASE_MHN: 'BASE_MHN',
  INTERNAL_VARIANT: 'INTERNAL_VARIANT',
} as const
export type PromotionStatus = (typeof PromotionStatus)[keyof typeof PromotionStatus]

// detail_staging.py validates query_sample_state against exactly this set.
export const QuerySampleState = {
  POSITIVE_SAMPLE: 'POSITIVE_SAMPLE',
  ZERO_CURRENT_SAMPLE: 'ZERO_CURRENT_SAMPLE',
} as const
export type QuerySampleState = (typeof QuerySampleState)[keyof typeof QuerySampleState]

// detail_staging.py validates capability_state against exactly this set, and additionally
// requires POSITIVE_SAMPLE to imply CONFIRMED. Capability and sample count are separate axes:
// "the source cannot answer this kind of query" and "the source answered with zero rows right
// now" are different facts, and collapsing them is the mistake B6 exists to prevent.
export const SourceCapabilityState = {
  CONFIRMED: 'CONFIRMED',
  UNKNOWN: 'UNKNOWN',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const
export type SourceCapabilityState =
  (typeof SourceCapabilityState)[keyof typeof SourceCapabilityState]

// What one query observed, kept as the two independent axes the backend records.
export type QueryOutcome = {
  sample_state: QuerySampleState
  capability_state: SourceCapabilityState
  returned_member_count: number
}

// detail_facts.py raises when a zero sample reports a non-zero member count, and detail_staging.py
// raises when a positive sample is not backed by a CONFIRMED capability. Mirrored so the prototype
// cannot render a combination the backend would refuse to store.
export class ImpossibleQueryOutcome extends Error {}

export function assertQueryOutcome(outcome: QueryOutcome): void {
  if (outcome.sample_state === QuerySampleState.ZERO_CURRENT_SAMPLE) {
    if (outcome.returned_member_count !== 0)
      throw new ImpossibleQueryOutcome('zero sample has a non-zero member count')
    return
  }
  if (outcome.capability_state !== SourceCapabilityState.CONFIRMED)
    throw new ImpossibleQueryOutcome('positive sample requires a confirmed capability')
  if (outcome.returned_member_count === 0)
    throw new ImpossibleQueryOutcome('positive sample has no members')
}

// A zero sample says one thing only: this query, against this source, returned nothing at this
// instant. These are the readings it does NOT license. Kept as machine codes so the wording test
// can assert the UI never states them, and so the claim survives translation.
export const ZERO_SAMPLE_NON_CONCLUSIONS = [
  'SOURCE_LACKS_SUPPORT',
  'IDENTITY_DOES_NOT_EXIST',
  'TOTAL_SUPPLY_IS_ZERO',
] as const
export type ZeroSampleNonConclusion = (typeof ZERO_SAMPLE_NON_CONCLUSIONS)[number]

export class MixedAnalysisUnitKinds extends Error {}

// fusion.py refuses to fuse facts whose analysis-unit kinds differ. The same refusal has to hold
// on screen: once a summary spans a parent MHN and a style or pattern child, every number in it
// answers for no single economic identity. Callers partition first and summarise per kind.
export function assertSingleAnalysisUnitKind(
  kinds: readonly (AnalysisUnitKind | undefined)[],
): void {
  const present = [...new Set(kinds.filter((kind): kind is AnalysisUnitKind => kind !== undefined))]
  if (present.length > 1)
    throw new MixedAnalysisUnitKinds(
      `different analysis-unit kinds cannot be summarised together: ${present.sort().join(', ')}`,
    )
}

// A parent MHN listed next to its own children is context, not a comparable row: its quotes
// aggregate the children's supply, so ranking it against them double-counts. Anything else is a
// subject in its own right.
export type IdentityRole = 'SUBJECT' | 'BACKGROUND_ONLY'

export function identityRole(unit: {
  analysis_unit_id: string
  analysis_unit_kind: AnalysisUnitKind
  parent_analysis_unit_id: string | null
}, siblings: readonly { parent_analysis_unit_id: string | null }[]): IdentityRole {
  if (unit.analysis_unit_kind !== AnalysisUnitKind.BASE_MHN) return 'SUBJECT'
  const hasChildrenPresent = siblings.some(
    (other) => other.parent_analysis_unit_id === unit.analysis_unit_id,
  )
  return hasChildrenPresent ? 'BACKGROUND_ONLY' : 'SUBJECT'
}
