// Wire shapes mirroring the frozen dataclasses in repo/src/cs2_research/state_machine/models.py.
// Decimal fields stay strings: hashing.py treats Decimal("1.5") and 1.5 as different identities,
// so a JSON number here would silently collapse the type the Python side deliberately preserves.

import type {
  AnalysisUnitKind,
  CaseStatus,
  CoreDomain,
  DataBranch,
  DataStatus,
  Directness,
  DomainStrength,
  EvidenceFlag,
  ItemCycleStage,
  LifecycleAction,
  LifecycleEntityKind,
  MarketLevelRegime,
  MarketTrendStage,
  OutcomeLabel,
  Recommendation,
  RegimeRelation,
  RelativeStrength,
  ResolutionCode,
  ScopeKind,
  SectorTrendStage,
  SignalStrength,
  TradeConfirmation,
  TransitionMode,
  TransitionReason,
  ValidationLevel,
} from './enums'
import type { EditionKind } from './identity'
import type { ItemImageSource } from './itemImage'
import type { DerivedFromMembers, DerivedSpan, Field } from './provenance'

export type IsoUtcTimestamp = string
export type DecimalString = string

export type VersionContext = {
  catalog_version: string
  group_version: string
  index_version: string
  fusion_method_version: string
  feature_profile_version: string
  algorithm_version: string
  parameter_set_version: string
  stage_policy_version: string
  failure_policy_version: string
}

// Identity for derived member-version buckets. JSON.stringify is not an identity: object
// key order is not part of the contract. Adding a VersionContext field without updating
// this list is a type error.
export const VERSION_FIELD_KEYS = [
  'catalog_version',
  'group_version',
  'index_version',
  'fusion_method_version',
  'feature_profile_version',
  'algorithm_version',
  'parameter_set_version',
  'stage_policy_version',
  'failure_policy_version',
] as const satisfies readonly (keyof VersionContext)[]

type VersionKeysCovered = Exclude<keyof VersionContext, (typeof VERSION_FIELD_KEYS)[number]>
type _AssertVersionKeysCovered = VersionKeysCovered extends never ? true : VersionKeysCovered
const _VERSION_KEYS_COVERED: _AssertVersionKeysCovered = true
void _VERSION_KEYS_COVERED

export type ItemStateSnapshot = {
  analysis_unit_id: string
  available_at: IsoUtcTimestamp
  cycle_stage: ItemCycleStage
  evidence_flags: readonly EvidenceFlag[]
  data_status: DataStatus
  regime_relation: readonly RegimeRelation[]
  recommendation: Recommendation
  case_status: CaseStatus | null
  candidate_episode_id: string | null
  cycle_case_id: string | null
  data_branch: DataBranch
  versions: VersionContext
  input_snapshot_hash: string
}

export type MarketStateSnapshot = {
  analysis_unit_id: string
  available_at: IsoUtcTimestamp
  trend_stage: MarketTrendStage
  level_regime: MarketLevelRegime
  evidence_flags: readonly EvidenceFlag[]
  data_status: DataStatus
  recommendation: Recommendation
  case_status: CaseStatus | null
  analysis_case_id: string | null
  data_branch: DataBranch
  versions: VersionContext
  input_snapshot_hash: string
}

export type SectorBreadth = {
  advancing_member_ratio: DecimalString | null
  median_member_return: DecimalString | null
  breadth_expanding: boolean
  breadth_narrowing: boolean
  concentration_warning: boolean
}

export type SectorStateSnapshot = {
  analysis_unit_id: string
  available_at: IsoUtcTimestamp
  trend_stage: SectorTrendStage
  relative_strength: RelativeStrength
  breadth: SectorBreadth
  evidence_flags: readonly EvidenceFlag[]
  data_status: DataStatus
  recommendation: Recommendation
  case_status: CaseStatus | null
  analysis_case_id: string | null
  data_branch: DataBranch
  versions: VersionContext
  input_snapshot_hash: string
}

export type RecommendationSnapshot = {
  analysis_unit_id: string
  available_at: IsoUtcTimestamp
  recommendation: Recommendation
  signal_strength: SignalStrength
  evidence_coverage: DecimalString
  trade_confirmation: TradeConfirmation
  data_branch: DataBranch
  data_status: DataStatus
  input_snapshot_hash: string
  versions: VersionContext
}

// models.py rejects any scope other than ITEM for P/D/S evidence.
export type EvidenceDomainSnapshot = {
  analysis_unit_id: string
  scope_kind: typeof ScopeKind.ITEM
  domain: CoreDomain
  strength: DomainStrength
  contributing_feature_keys: readonly string[]
  missing_reason: string | null
  policy_version: string
  available_at: IsoUtcTimestamp
  input_snapshot_hash: string
  versions: VersionContext
  data_branch: DataBranch
  data_status: DataStatus
}

export type StateTransition = {
  analysis_unit_id: string
  available_at: IsoUtcTimestamp
  from_stage: ItemCycleStage
  to_stage: ItemCycleStage
  reason: TransitionReason
  mode: TransitionMode
  input_snapshot_hash: string
  versions: VersionContext
  data_branch: DataBranch
  data_status: DataStatus
}

export type LifecycleEvent = {
  entity_kind: LifecycleEntityKind
  entity_id: string
  analysis_unit_id: string
  action: LifecycleAction
  occurred_at: IsoUtcTimestamp
  previous_entity_id: string | null
  resolution_code: ResolutionCode | null
}

export type OutcomeEvaluation = {
  case_id: string
  analysis_unit_id: string
  label: OutcomeLabel
  validation_level: ValidationLevel
  evaluated_at: IsoUtcTimestamp
  resolution_code: ResolutionCode | null
  versions: VersionContext
}

// Source-independent extension slot. Platform-private identifiers must never reach the core model.
export type VariantAttributes = Readonly<Record<string, string>>

// The identity a result is attributed to. No state snapshot carries any of this, so the whole
// type is a requested result-side projection rather than a mirror of a produced shape — see the
// analysis_unit_kind and edition_kind entries in CONTRACT_PROPOSALS.
//
// analysis_unit_kind, edition_kind and parent_analysis_unit_id are plain fields rather than
// Field<T>, on the same footing as sector_id and display_name: for a synthetic unit these are
// part of its definition, not an observation standing in for a backend value. What must never
// happen is deriving them from a state snapshot (they are absent there) or from the shape of
// analysis_unit_id, and identity.test.ts holds that line.
export type AnalysisUnit = {
  analysis_unit_id: string
  scope_kind: ScopeKind
  analysis_unit_kind: AnalysisUnitKind
  edition_kind: EditionKind
  // Set only when the parent is itself an analysis unit. A child never inherits the parent's
  // numbers; this exists so the UI can label the parent as context and keep them apart.
  parent_analysis_unit_id: string | null
  display_name: string
  // Presentation-side catalog/media join. It is deliberately separate from state/result fields:
  // a missing image never changes the research answer, and a result payload cannot smuggle a URL.
  image: ItemImageSource
  sector_id: string | null
  variant_attributes: VariantAttributes
  pool_tier: Field<string>
}

export type SourceCoverageRow = {
  source_id: string
  observed_units: number
  last_observed_at: IsoUtcTimestamp
  directness: Directness
  data_status: DataStatus
}

export type ScopeHeader = {
  scope_kind: ScopeKind
  analysis_unit_id: string
  available_at: IsoUtcTimestamp
  as_of: Field<IsoUtcTimestamp>
  data_branch: DataBranch
  data_status: DataStatus
  versions: VersionContext
}

// A ScopeHeader answers for one analysis unit at one instant. A page listing many units answers
// for none of them, so it cannot borrow one member's timestamp or status. Member facts are a
// DERIVED_FROM_MEMBERS distribution (collapse into a summary, not into a collection field).
// The five collection fields stay NOT_PRODUCED.
export type CollectionHeader = {
  scope_kind: ScopeKind
  collection_id: string
  member_count: number
  member_available_at: DerivedSpan<IsoUtcTimestamp> | null
  member_data_status: DerivedFromMembers<DataStatus>
  member_data_branch: DerivedFromMembers<DataBranch>
  member_versions: DerivedFromMembers<VersionContext>
  as_of: Field<IsoUtcTimestamp>
  available_at: Field<IsoUtcTimestamp>
  data_status: Field<DataStatus>
  data_branch: Field<DataBranch>
  versions: Field<VersionContext>
}
