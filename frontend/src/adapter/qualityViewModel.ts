import type { IsoUtcTimestamp } from '../contract/types'
import { displayToken, type DisplayToken, type ResultIdentityView } from './resultViewModel'
import { requireValidated, sealView } from '../wire/validated'
import type { Presentable, ValidatedQualityResult } from '../wire/validated'
import type {
  QualityQueryKind,
  WireQualityQueryObservation,
  WireQualityResult,
} from '../wire/types'
import type { QuerySampleState, SourceCapabilityState } from '../contract/identity'

export type QualitySourceSummaryView = {
  source_ref: DisplayToken
  expected_feature_count: number
  observed_feature_count: number
  fresh_feature_count: number
  missing_feature_count: number
  stale_feature_count: number
}

export type QualityConflictView = {
  feature_key: DisplayToken
  reason_code: DisplayToken
  participating_source_refs: readonly DisplayToken[]
  source_fact_count: number
  relative_dispersion: string | null
}

export type QualityQueryObservationView = {
  observation_id: DisplayToken
  source_ref: DisplayToken
  query_kind: QualityQueryKind
  sample_state: QuerySampleState
  capability_state: SourceCapabilityState
  returned_member_count: number
  observed_at: IsoUtcTimestamp
  available_at: IsoUtcTimestamp
}

export type QualityResultView = {
  snapshot_id: string
  identity: ResultIdentityView
  as_of: IsoUtcTimestamp
  available_at: IsoUtcTimestamp
  policy_version: DisplayToken
  input_quality_snapshot_id: DisplayToken
  aggregate: Pick<
    WireQualityResult,
    | 'expected_cell_count'
    | 'observed_cell_count'
    | 'fresh_cell_count'
    | 'coverage_ratio'
    | 'fresh_coverage_ratio'
    | 'missing_cell_count'
    | 'stale_cell_count'
    | 'future_fact_count'
  >
  source_summaries: readonly QualitySourceSummaryView[]
  conflicts: readonly QualityConflictView[]
  query_observations: readonly QualityQueryObservationView[]
}

export type PresentableQualityView = Presentable<QualityResultView, 'QUALITY_VIEW'>

function identityView(result: ValidatedQualityResult): ResultIdentityView {
  return {
    analysis_unit_id: displayToken(result.identity.analysis_unit_id),
    scope_kind: result.identity.scope_kind,
    display_name: result.identity.display_name,
    identity_available_at: result.identity.identity_available_at,
    catalog_version: displayToken(result.identity.catalog_version),
    analysis_unit_kind: result.identity.analysis_unit_kind,
    edition_kind: result.identity.edition_kind,
    parent_analysis_unit_id:
      result.identity.parent_analysis_unit_id === null
        ? null
        : displayToken(result.identity.parent_analysis_unit_id),
  }
}

function queryView(query: WireQualityQueryObservation): QualityQueryObservationView {
  return {
    observation_id: displayToken(query.observation_id),
    source_ref: displayToken(query.source_ref),
    query_kind: query.query_kind,
    sample_state: query.sample_state,
    capability_state: query.capability_state,
    returned_member_count: query.returned_member_count,
    observed_at: query.observed_at,
    available_at: query.available_at,
  }
}

export function qualityResultView(result: ValidatedQualityResult): PresentableQualityView {
  requireValidated(result, 'qualityResultView', 'QUALITY')
  const view: QualityResultView = {
    snapshot_id: result.snapshot_id,
    identity: identityView(result),
    as_of: result.as_of,
    available_at: result.available_at,
    policy_version: displayToken(result.policy_version),
    input_quality_snapshot_id: displayToken(result.input_quality_snapshot_id),
    aggregate: {
      expected_cell_count: result.expected_cell_count,
      observed_cell_count: result.observed_cell_count,
      fresh_cell_count: result.fresh_cell_count,
      coverage_ratio: result.coverage_ratio,
      fresh_coverage_ratio: result.fresh_coverage_ratio,
      missing_cell_count: result.missing_cell_count,
      stale_cell_count: result.stale_cell_count,
      future_fact_count: result.future_fact_count,
    },
    source_summaries: result.source_summaries.map((row) => ({
      source_ref: displayToken(row.source_ref),
      expected_feature_count: row.expected_feature_count,
      observed_feature_count: row.observed_feature_count,
      fresh_feature_count: row.fresh_feature_count,
      missing_feature_count: row.missing_feature_count,
      stale_feature_count: row.stale_feature_count,
    })),
    conflicts: result.conflicts.map((row) => ({
      feature_key: displayToken(row.feature_key),
      reason_code: displayToken(row.reason_code),
      participating_source_refs: row.participating_source_refs.map(displayToken),
      source_fact_count: row.source_fact_count,
      relative_dispersion: row.relative_dispersion,
    })),
    query_observations: result.query_observations.map(queryView),
  }
  sealView(view, 'QUALITY_VIEW')
  return view as PresentableQualityView
}
