import { AnalysisUnitKind, ScopeKind, ValidationLevel } from '../contract/enums'
import { collectionHeader } from '../contract/collection'
import {
  assertQueryOutcome,
  identityRole,
  QuerySampleState,
  SourceCapabilityState,
  type QueryOutcome,
} from '../contract/identity'
import type { Lang } from '../i18n'
import { pick } from '../i18n'
import * as fx from '../mock/fixtures'
import type {
  CandidatePool,
  DataQuality,
  ItemDetail,
  MarketOverview,
  ResearchApi,
  ResearchReport,
  SignalsAndCases,
} from './ResearchApi'

export class UnknownAnalysisUnit extends Error {}

// Units without an explicit outcome were observed normally; the count is deliberately not a
// per-unit invention, only enough to satisfy the positive-sample invariant.
const DEFAULT_QUERY_OUTCOME: QueryOutcome = {
  sample_state: QuerySampleState.POSITIVE_SAMPLE,
  capability_state: SourceCapabilityState.CONFIRMED,
  returned_member_count: 1,
}

export class MockResearchApi implements ResearchApi {
  readonly kind = 'MOCK' as const

  async getMarketOverview(): Promise<MarketOverview> {
    return {
      header: fx.header(ScopeKind.MARKET, fx.MARKET),
      sectors_header: collectionHeader({
        scope_kind: ScopeKind.SECTOR,
        collection_id: 'SECTORS',
        members: fx.SECTORS,
      }),
      market: fx.MARKET,
      sectors: fx.SECTORS,
    }
  }

  async getCandidatePool(lang: Lang): Promise<CandidatePool> {
    const units = fx.units(lang)
    const all = units.map((unit) => ({
      unit,
      state: fx.ITEM_STATES[unit.analysis_unit_id],
      recommendation: fx.ITEM_RECOMMENDATIONS[unit.analysis_unit_id],
      promotion_reason: fx.PROMOTION_REASON,
    }))
    const background = all.filter(
      (row) => identityRole(row.unit, units) === 'BACKGROUND_ONLY',
    )
    const rows = all.filter((row) => !background.includes(row))

    // Grouped in the order the kinds are declared, so the pool reads the same way on every run.
    const groups = Object.values(AnalysisUnitKind)
      .map((kind) => ({
        analysis_unit_kind: kind,
        rows: rows.filter((row) => row.unit.analysis_unit_kind === kind),
      }))
      .filter((group) => group.rows.length > 0)
      .map((group) => ({
        ...group,
        header: collectionHeader({
          scope_kind: ScopeKind.ITEM,
          collection_id: `CANDIDATE-POOL/${group.analysis_unit_kind}`,
          members: group.rows.map((row) => ({
            ...row.state,
            analysis_unit_kind: row.unit.analysis_unit_kind,
          })),
        }),
      }))

    return { groups, rows, background }
  }

  async getItemDetail(analysisUnitId: string, lang: Lang): Promise<ItemDetail> {
    const units = fx.units(lang)
    const unit = units.find((u) => u.analysis_unit_id === analysisUnitId)
    if (!unit) throw new UnknownAnalysisUnit(analysisUnitId)
    const state = fx.ITEM_STATES[analysisUnitId]
    const outcome = fx.QUERY_OUTCOMES[analysisUnitId] ?? DEFAULT_QUERY_OUTCOME
    assertQueryOutcome(outcome)
    return {
      header: fx.header(ScopeKind.ITEM, state),
      unit,
      parent:
        units.find((u) => u.analysis_unit_id === unit.parent_analysis_unit_id) ?? null,
      state,
      recommendation: fx.ITEM_RECOMMENDATIONS[analysisUnitId],
      query_outcome: outcome,
      domains: fx.itemDomains(analysisUnitId, lang),
      transitions: fx.ITEM_TRANSITIONS[analysisUnitId] ?? [],
      claims: fx.ITEM_CLAIMS[analysisUnitId] ?? [],
      supporting_factors: fx.SUPPORTING_FACTORS,
      primary_risks: fx.PRIMARY_RISKS,
      invalidation_conditions: fx.INVALIDATION_CONDITIONS,
    }
  }

  async getSignalsAndCases(): Promise<SignalsAndCases> {
    return {
      // Lifecycle events carry no data_status or versions, so the only members that can back this
      // envelope are the outcome evaluations. They have evaluated_at, which is when the outcome was
      // judged, not when the data became available — passing it as available_at would rename a
      // field, so the span stays empty and only versions travels.
      header: collectionHeader({
        scope_kind: ScopeKind.ITEM,
        collection_id: 'CASE-HISTORY',
        members: fx.OUTCOMES.map((outcome) => ({ versions: outcome.versions })),
      }),
      events: fx.LIFECYCLE_EVENTS,
      outcomes: fx.OUTCOMES,
    }
  }

  async getDataQuality(lang: Lang): Promise<DataQuality> {
    return {
      sources: fx.SOURCE_COVERAGE,
      isolated_events: fx.isolatedEvents(lang),
    }
  }

  async getResearchReport(lang: Lang): Promise<ResearchReport> {
    return {
      validation_level: ValidationLevel.COMPONENT_BACKTEST,
      index_members: fx.indexMembers(lang),
      paper_validation_note: pick(fx.PAPER_VALIDATION_NOTE, lang),
    }
  }
}
