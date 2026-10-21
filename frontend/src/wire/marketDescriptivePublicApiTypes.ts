import type { NativeCnyIndexMethod } from './nativeCnyIndexPublicApi'

export type MarketDescriptiveResponseKind = 'RESULT' | 'EMPTY' | 'ERROR'
export type MarketDescriptiveOperation = 'OVERVIEW' | 'SCOPE'
export type MarketDescriptiveScopeKind = 'MARKET' | 'SECTOR' | 'SUBSECTOR'
export type MarketDescriptiveCoverageGrade = 'HIGH' | 'PARTIAL' | 'DETAIL_ONLY'
export type MarketDescriptiveReturnMethod =
  | 'RAW_EQUAL_MEMBER_RETURN'
  | 'SYMMETRIC_WINSOR_1_PERCENT'
export type MarketDescriptiveFreshnessStatus =
  | 'CURRENT'
  | 'HISTORICAL_VALUE_DISPLAY_ONLY'
  | 'NO_RECENT_STATISTIC'
export type MarketDescriptiveQualityStatus =
  | 'AVAILABLE'
  | 'NO_PUBLISHED_DAY'
  | 'UNAVAILABLE'
  | 'BASELINE_ONLY'
export type MarketDescriptiveErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_PUBLISHED'
  | 'NOT_FOUND'
  | 'WITHDRAWN'
  | 'STALE_EXPIRED'
  | 'CORRUPT_PUBLICATION'
  | 'TEMPORARILY_UNAVAILABLE'

export type MarketDescriptiveLabels = Readonly<{ en: string; zh_cn: string }>

export type MarketDescriptiveScope = Readonly<{
  scope_token: string
  scope_id: string
  scope_kind: MarketDescriptiveScopeKind
  parent_scope_id: string | null
  ancestor_scope_ids: readonly string[]
  labels: MarketDescriptiveLabels
  fixed_member_count: number
  paired_member_count: number
  day_price_member_count: number
  paired_coverage_ratio: string | null
  day_price_coverage_ratio: string | null
  coverage_grade: MarketDescriptiveCoverageGrade
  headline_eligible: boolean
  raw_return_ratio: string | null
  suppressed_return_ratio: string | null
  return_selected_for_display: string | null
  return_method: MarketDescriptiveReturnMethod | null
  missing_endpoint_count: number | null
  source_set_break_count: number | null
  single_source_pair_count: number | null
  unmapped_member_count: number | null
  other_unavailable_count: number | null
  member_price_sum_cny: string | null
  member_price_mean_cny: string | null
  price_basis: 'ONE_SELECTED_EOD_PRICE_PER_AVAILABLE_MEMBER' | 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE'
}>

export type MarketDescriptiveDayPair = Readonly<{
  from_date: string
  to_date: string
  is_adjacent_utc_day: true
  eod_window: Readonly<{
    expected_slots: 12
    minimum_qualified_slots: 9
    maximum_latest_slot_age_minutes: 15
  }>
}>

export type MarketDescriptivePublication = Readonly<{
  publication_id: string
  parent_publication_id: string | null
  manifest_sha256: string | null
  rights_revision: string | null
  published_at: string | null
  withdrawn_at: string | null
  clock_disclosure?: PublicPublicationClockDisclosure | null
}>

export type PublicPublicationClockDisclosure = Readonly<{
  status: 'PREPARED_CLOCK_NOT_ACTUAL'
  published_at_kind: 'PREPARED_VALUE'
  actual_public_available_at: null
  known_not_before_at: string
  recorded_at: string
  reason: 'INITIAL_ACTIVE_APPLY_CLOCK_NOT_OBSERVED'
}>

export type MarketDescriptiveSnapshot = Readonly<{
  catalog_snapshot_id: null
  membership_version: string | null
  input_sha256: string | null
  start_date: string | null
  end_date: string | null
  source_export_as_of: string | null
  imported_at: string | null
}>

export type MarketDescriptiveFreshness = Readonly<{
  evaluated_at: string
  expected_latest_complete_date: string | null
  lag_complete_days: number | null
  status: MarketDescriptiveFreshnessStatus | null
  headline_data_date: string | null
}>

export type MarketDescriptiveHeadline = Readonly<{
  publication_id: string
  day_pair: MarketDescriptiveDayPair
  scope: MarketDescriptiveScope
}>

export type MarketDescriptiveQuality = Readonly<{
  date: string
  status: MarketDescriptiveQualityStatus
  scope: MarketDescriptiveScope | null
}>

export type MarketDescriptiveHistory = Readonly<{
  publication_id: string
  day_pair: MarketDescriptiveDayPair
  scopes: readonly MarketDescriptiveScope[]
  connect_to_previous: boolean
}>

export type MarketDescriptiveSuccess = Readonly<{
  /** In-memory native projection only; never accepted by the legacy wire decoder. */
  native_cny?: true
  /** Native projection only: the decoded /index/day method, so the method note names the live series. */
  native_method?: NativeCnyIndexMethod
  contract_name: 'market-descriptive-public-api'
  contract_version: '1'
  response_kind: Exclude<MarketDescriptiveResponseKind, 'ERROR'>
  operation: MarketDescriptiveOperation
  product_kind: 'MARKET_DESCRIPTIVE'
  method: 'EQUAL_WEIGHTED_MEMBER_RETURN'
  publication: MarketDescriptivePublication
  snapshot: MarketDescriptiveSnapshot
  freshness: MarketDescriptiveFreshness
  day_pair: MarketDescriptiveDayPair | null
  headline: MarketDescriptiveHeadline | null
  current_day_quality: MarketDescriptiveQuality
  scopes: readonly MarketDescriptiveScope[]
  history: readonly MarketDescriptiveHistory[]
}>

export type MarketDescriptiveError = Readonly<{
  contract_name: 'market-descriptive-public-api'
  contract_version: '1'
  response_kind: 'ERROR'
  error: Readonly<{ code: MarketDescriptiveErrorCode; retryable: boolean }>
}>

export type MarketDescriptiveDocument = MarketDescriptiveSuccess | MarketDescriptiveError

export type MarketDescriptiveOverviewQuery = Readonly<{ publication_id: string | null }>
export type MarketDescriptiveScopeQuery = Readonly<{
  publication_id: string
  scope_token: string
}>
