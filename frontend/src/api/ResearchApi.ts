import type {
  AnalysisUnit,
  CollectionHeader,
  EvidenceDomainSnapshot,
  ItemStateSnapshot,
  LifecycleEvent,
  MarketStateSnapshot,
  OutcomeEvaluation,
  RecommendationSnapshot,
  ScopeHeader,
  SectorStateSnapshot,
  SourceCoverageRow,
  StateTransition,
} from '../contract/types'
import type { AnalysisUnitKind, ClaimCode, ValidationLevel } from '../contract/enums'
import type { QueryOutcome } from '../contract/identity'
import type { Field } from '../contract/provenance'
import type { Lang } from '../i18n'

export type MarketOverview = {
  header: ScopeHeader
  sectors_header: CollectionHeader
  market: MarketStateSnapshot
  sectors: readonly SectorStateSnapshot[]
}

export type PoolRow = {
  unit: AnalysisUnit
  state: ItemStateSnapshot
  recommendation: RecommendationSnapshot
  promotion_reason: Field<string>
}

// One envelope per economic-identity granularity. A single envelope over every row would summarise
// a parent MHN together with style and pattern children, which is the fusion fusion.py refuses.
export type PoolGroup = {
  analysis_unit_kind: AnalysisUnitKind
  header: CollectionHeader
  rows: readonly PoolRow[]
}

export type CandidatePool = {
  groups: readonly PoolGroup[]
  // Subjects only, flattened for per-row views. Parents that have children in `groups` are not
  // here: they appear in `background` instead, so no ranking or count can put them side by side.
  rows: readonly PoolRow[]
  background: readonly PoolRow[]
}

export type ItemDetail = {
  header: ScopeHeader
  unit: AnalysisUnit
  // The parent when this unit is a style or pattern child: identity context, never a source of
  // numbers for this unit. Null for a base MHN.
  parent: AnalysisUnit | null
  state: ItemStateSnapshot
  recommendation: RecommendationSnapshot
  query_outcome: QueryOutcome
  domains: readonly EvidenceDomainSnapshot[]
  transitions: readonly StateTransition[]
  claims: readonly ClaimCode[]
  supporting_factors: Field<readonly string[]>
  primary_risks: Field<readonly string[]>
  invalidation_conditions: Field<readonly string[]>
}

export type SignalsAndCases = {
  header: CollectionHeader
  events: readonly LifecycleEvent[]
  outcomes: readonly OutcomeEvaluation[]
}

export type DataQuality = {
  sources: readonly SourceCoverageRow[]
  isolated_events: readonly {
    occurred_at: string
    analysis_unit_id: string
    detail: string
  }[]
}

export type ResearchReport = {
  validation_level: ValidationLevel
  index_members: readonly {
    analysis_unit_id: string
    display_name: string
    weight: string
  }[]
  paper_validation_note: string
}

// This page-prototype API still carries lang for mock-only display text such as display_name and
// isolated-event detail. The formal result contract is separate: missing_reason is a controlled
// code localized after decoding, and producer-authored prose is not rendered by its components.
export interface ResearchApi {
  readonly kind: 'MOCK' | 'HTTP'
  getMarketOverview(lang: Lang): Promise<MarketOverview>
  getCandidatePool(lang: Lang): Promise<CandidatePool>
  getItemDetail(analysisUnitId: string, lang: Lang): Promise<ItemDetail>
  getSignalsAndCases(lang: Lang): Promise<SignalsAndCases>
  getDataQuality(lang: Lang): Promise<DataQuality>
  getResearchReport(lang: Lang): Promise<ResearchReport>
}
