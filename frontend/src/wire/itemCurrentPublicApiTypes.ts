import type { WireCatalogDisplayProjection } from './catalogDisplayApiTypes'

export type ItemCurrentErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_PUBLISHED'
  | 'NOT_FOUND'
  | 'WITHDRAWN'
  | 'STALE_EXPIRED'
  | 'CORRUPT_PUBLICATION'
  | 'TEMPORARILY_UNAVAILABLE'

export type ItemCurrentSort = 'RELIABLE_SIGNAL_DESC' | 'DETECTED_DESC' | 'SUPPLY_CONTRACTION_DESC'
export type ItemCurrentStage = 'SUPPLY_PRESSURE' | 'PRICE_RESPONSE_ONLY' | 'PAIRED_RESPONSE'
export type ItemCurrentFirstLeg = 'SUPPLY' | 'PRICE'
export type ItemCurrentTiming = 'SUPPLY_LEADS' | 'PRICE_LEADS' | 'CONCURRENT_DAILY'
export type ItemCurrentCoverageQuality = 'FULL' | 'HIGH_COVERAGE' | 'PARTIAL_USABLE'
export type ItemCurrentSupplyConfidence = 'STANDARD' | 'LOW_BASELINE_DEPTH'

export type ItemCurrentPublication = Readonly<{
  publication_id: string
  parent_publication_id: string | null
  manifest_sha256: string
  rights_revision: string
  published_at: string
  withdrawn_at: null
}>

export type ItemCurrentSnapshot = Readonly<{
  catalog_snapshot_id: string
  membership_version: string
  input_head_sha256: string
  source_observed_through: string
  source_available_through: string
  imported_at: string
}>

export type ItemCurrentRelease = Readonly<{
  runtime_version: 'single-item-prospective-runtime/4'
  projection_version: 'single-item-prospective-stage/1'
  causal_kernel_version: 'single-item-causal-kernel/2.4'
  policy_sha256: string
  coverage_policy_version: string
  full_member_count: number
  evaluated_member_count: number
  public_stage_count: number
}>

export type ItemCurrentCoverage = Readonly<{
  expected_slots: 288
  qualified_paired_slots: number
  longest_missing_run: number
  quality: ItemCurrentCoverageQuality
}>

export type ItemCurrentMember = Readonly<{
  stage_token: string
  catalog_snapshot_id: string
  catalog: Readonly<WireCatalogDisplayProjection>
  stage: ItemCurrentStage
  first_leg: ItemCurrentFirstLeg
  as_of: string
  supply_onset: string | null
  supply_detected_at: string | null
  price_onset: string | null
  price_detected_at: string | null
  pairing_deadline_on: string
  timing_relationship: ItemCurrentTiming | null
  supply_contraction_ratio: string | null
  supply_measurement_confidence: ItemCurrentSupplyConfidence
  confidence_is_probability: false
  bid_role: 'QUOTE_QUALITY_CONTEXT_ONLY'
  coverage: ItemCurrentCoverage
  retrospective_peak: null
  retrospective_ended_on: null
}>

export type ItemCurrentFreshness = Readonly<{
  evaluated_at: string
  expected_latest_complete_date: string
  lag_complete_days: number
  status: 'CURRENT' | 'STALE_RETAINED'
  headline_data_date: string
}>

export type ItemCurrentSuccess = Readonly<{
  contract_name: 'single-item-current-public-api'
  contract_version: '1'
  response_kind: 'RESULT' | 'EMPTY'
  operation: 'LIST' | 'DETAIL'
  publication: ItemCurrentPublication
  snapshot: ItemCurrentSnapshot
  release: ItemCurrentRelease
  freshness: ItemCurrentFreshness
  empty_reason: null | 'NO_CURRENT_STAGE'
  sort: ItemCurrentSort
  page_size: number
  members: readonly ItemCurrentMember[]
  next_cursor: string | null
}>

export type ItemCurrentError = Readonly<{
  contract_name: 'single-item-current-public-api'
  contract_version: '1'
  response_kind: 'ERROR'
  error: Readonly<{ code: ItemCurrentErrorCode; retryable: boolean }>
}>

export type ItemCurrentDocument = ItemCurrentSuccess | ItemCurrentError
export type ItemCurrentListQuery = Readonly<{
  publication_id: string | null
  page_size: number
  cursor: string | null
  sort: ItemCurrentSort
  name_query: string | null
}>
export type ItemCurrentDetailQuery = Readonly<{
  publication_id: string
  stage_token: string
}>
