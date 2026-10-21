// TypeScript shapes for the formal envelope. These are not a second schema: nothing here is
// enforced at runtime, the JSON Schema is. They exist so decoded data has a type after it has
// already been validated. tests/wire-schema.test.ts checks each list against the schema's own
// required arrays and enums, so a shape that drifts fails mechanically instead of silently.
import type {
  AnalysisUnitKind,
  CaseStatus,
  ClaimCode,
  CoreDomain,
  DataBranch,
  DataStatus,
  DomainMissingReasonCode,
  DomainStrength,
  EvidenceFlag,
  ItemCycleStage,
  MarketLevelRegime,
  MarketTrendStage,
  Recommendation,
  RegimeRelation,
  RelativeStrength,
  ScopeKind,
  SectorTrendStage,
  SignalStrength,
  TradeConfirmation,
} from '../contract/enums'
import type { EditionKind } from '../contract/identity'
import type { QuerySampleState, SourceCapabilityState } from '../contract/identity'
import type { VersionContext } from '../contract/types'

// RC-R005: the wire uses the research scope MARKET/SECTOR/ITEM, and economic granularity is a
// separate field. catalog's same-named ScopeKind never appears here.
export type WireIdentity = {
  analysis_unit_id: string
  scope_kind: ScopeKind
  display_name: string
  identity_available_at: string
  catalog_version: string
  analysis_unit_kind: AnalysisUnitKind | null
  edition_kind: EditionKind | null
  parent_analysis_unit_id: string | null
}

export type WireMarketState = {
  trend_stage: MarketTrendStage
  level_regime: MarketLevelRegime
  evidence_flags: readonly EvidenceFlag[]
  recommendation: Recommendation
  case_status: CaseStatus | null
  analysis_case_id: string | null
  input_snapshot_hash: string
}

export type WireSectorBreadth = {
  advancing_member_ratio: string | null
  median_member_return: string | null
  breadth_expanding: boolean
  breadth_narrowing: boolean
  concentration_warning: boolean
}

export type WireSectorState = {
  trend_stage: SectorTrendStage
  relative_strength: RelativeStrength
  breadth: WireSectorBreadth
  evidence_flags: readonly EvidenceFlag[]
  recommendation: Recommendation
  case_status: CaseStatus | null
  analysis_case_id: string | null
  input_snapshot_hash: string
}

export type WireItemState = {
  cycle_stage: ItemCycleStage
  evidence_flags: readonly EvidenceFlag[]
  regime_relation: readonly RegimeRelation[]
  recommendation: Recommendation
  case_status: CaseStatus | null
  candidate_episode_id: string | null
  cycle_case_id: string | null
  input_snapshot_hash: string
}

export type WireState = WireMarketState | WireSectorState | WireItemState

export type WireRecommendationDetail = {
  recommendation: Recommendation
  signal_strength: SignalStrength
  // Decimal stays a string on the wire, so no float rounding happens between the producer and
  // the screen. The frontend renders it and never does arithmetic on it.
  evidence_coverage: string
  trade_confirmation: TradeConfirmation
  input_snapshot_hash: string
}

// RC-R003: exactly these six fields. No per-source numbers, weights or thresholds.
export type WireEvidenceDomain = {
  domain: CoreDomain
  strength: DomainStrength
  contributing_feature_keys: readonly string[]
  missing_reason: DomainMissingReasonCode | null
  policy_version: string
  input_snapshot_hash: string
}

export type WireUnitResult = {
  snapshot_id: string
  contract_code: 'research-result-envelope'
  contract_version: 'v1'
  envelope_kind: 'UNIT'
  identity: WireIdentity
  as_of: string
  available_at: string
  data_branch: DataBranch
  data_status: DataStatus
  versions: VersionContext
  state: WireState
  recommendation_detail: WireRecommendationDetail | null
  evidence_domains: readonly WireEvidenceDomain[]
  claims: readonly ClaimCode[]
}

// RC-R002: the producer states the accounting. member_result_ids are result snapshot hashes;
// missing and unavailable are analysis unit ids the frontend could not have known about.
export type WireCollectionResult = {
  snapshot_id: string
  contract_code: 'research-result-envelope'
  contract_version: 'v1'
  envelope_kind: 'COLLECTION'
  collection_id: string
  scope_kind: ScopeKind
  as_of: string
  available_at: string
  data_branch: DataBranch
  data_status: DataStatus
  versions: VersionContext
  member_count: number
  returned_member_count: number
  member_result_ids: readonly string[]
  missing_member_ids: readonly string[]
  unavailable_member_ids: readonly string[]
}

export type WireResultEnvelope = WireUnitResult | WireCollectionResult

export type QualityQueryKind =
  | 'BASE_QUOTE'
  | 'LISTING_PAGE'
  | 'STYLE_LISTING'
  | 'STYLE_BID'
  | 'MARKET_SNAPSHOT'

export type WireQualitySourceSummary = {
  source_ref: string
  expected_feature_count: number
  observed_feature_count: number
  fresh_feature_count: number
  missing_feature_count: number
  stale_feature_count: number
}

export type WireQualityConflictSummary = {
  feature_key: string
  reason_code: string
  participating_source_refs: readonly string[]
  source_fact_count: number
  relative_dispersion: string | null
}

export type WireQualityQueryObservation = {
  observation_id: string
  source_ref: string
  query_kind: QualityQueryKind
  sample_state: QuerySampleState
  capability_state: SourceCapabilityState
  returned_member_count: number
  observed_at: string
  available_at: string
}

export type WireQualityResult = {
  snapshot_id: string
  contract_code: 'research-quality-envelope'
  contract_version: 'v1'
  envelope_kind: 'QUALITY'
  identity: WireIdentity
  as_of: string
  available_at: string
  policy_version: string
  input_quality_snapshot_id: string
  expected_cell_count: number
  observed_cell_count: number
  fresh_cell_count: number
  coverage_ratio: string
  fresh_coverage_ratio: string
  missing_cell_count: number
  stale_cell_count: number
  future_fact_count: number
  source_summaries: readonly WireQualitySourceSummary[]
  conflicts: readonly WireQualityConflictSummary[]
  query_observations: readonly WireQualityQueryObservation[]
}

export function isUnitResult(envelope: WireResultEnvelope): envelope is WireUnitResult {
  return envelope.envelope_kind === 'UNIT'
}

export function isCollectionResult(
  envelope: WireResultEnvelope,
): envelope is WireCollectionResult {
  return envelope.envelope_kind === 'COLLECTION'
}
