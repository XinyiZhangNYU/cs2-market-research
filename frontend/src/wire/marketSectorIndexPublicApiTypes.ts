export type MarketSectorIndexErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_PUBLISHED'
  | 'NOT_FOUND'
  | 'WITHDRAWN'
  | 'STALE_EXPIRED'
  | 'CORRUPT_PUBLICATION'
  | 'TEMPORARILY_UNAVAILABLE'

export type MarketSectorIndexLabels = Readonly<{ en: string; zh_cn: string }>

export type MarketSectorIndexScope = Readonly<{
  scope_token: string
  scope_code: string
  scope_kind: 'MARKET' | 'SECTOR' | 'SUBSECTOR'
  labels: MarketSectorIndexLabels
  price_history_eligibility: 'RECONSTRUCTED_HISTORY' | 'FORWARD_ONLY'
  first_available_date: string | null
  last_available_date: string | null
  current_member_count: number
  observed_price_member_count: number
  origin_uncertainty_disclosed: boolean
}>

export type MarketSectorIndexAnomalyContribution = Readonly<{
  analysis_unit_id: string
  raw_return: string
  suppressed_return: string
  adjustment: string
}>

export type MarketSectorIndexPoint = Readonly<{
  native_cny?: true
  point_id: string
  date: string
  segment_id: string | null
  connect_to_previous: boolean
  availability:
    | 'RECONSTRUCTED_LATE_BOUND'
    | 'FORWARD_MEASURED'
    | 'CONTEMPORANEOUSLY_MEASURED'
  index: Readonly<{
    value: string | null
    period_return: string | null
    raw_equal_return: string | null
    robust_equal_return: string | null
    effective_estimator: string | null
  }>
  absolute_price: Readonly<{
    member_minimum_ask_sum_cny: string | null
    member_minimum_ask_median_cny: string | null
    semantic: 'SUM_AND_MEDIAN_OF_MEMBER_MINIMUM_ASKS_NOT_MARKET_VALUE' | 'FUSED_MEMBER_ASKS_NOT_MARKET_VALUE'
  }>
  coverage: Readonly<{
    expected_member_count: number
    expected_member_count_upper_bound: number | null
    qualified_member_count: number
    paired_member_count: number
    coverage_ratio: string | null
    coverage_ratio_lower_bound: string | null
    absolute_price_qualified_member_count: number
    absolute_price_coverage_ratio: string | null
    absolute_price_coverage_ratio_lower_bound: string | null
  }>
  quality: Readonly<{
    overall: 'HIGH' | 'PARTIAL' | 'LOW' | 'UNAVAILABLE'
    return: 'HIGH' | 'PARTIAL' | 'LOW' | 'UNAVAILABLE'
    price: 'HIGH' | 'PARTIAL' | 'LOW' | 'UNAVAILABLE'
    grade_counts: Readonly<{ A: number; B: number; C: number; D: number; E: number }>
    grade_d_share: string | null
    anomaly_member_count: number | null
    anomaly_contributions?: readonly MarketSectorIndexAnomalyContribution[]
    rejected_return_domain_count: number
    reason_codes: readonly string[]
  }>
  origin_uncertainty: Readonly<{
    status:
      | 'NONE'
      | 'ACTIVE_UNCERTAIN_ORIGIN'
      | 'POSSIBLE_UNADMITTED_MEMBERS'
      | 'ACTIVE_AND_POSSIBLE_UNCERTAIN_ORIGIN'
      | null
    active_uncertain_origin_member_count: number | null
    possible_unadmitted_member_count: number | null
  }>
}>

export type MarketSectorIndexReleaseV1 = Readonly<{
  publication_id: string
  manifest_sha256: string
  rights_revision: string
  published_at: string
  withdrawn_at: string | null
  series_revision_id: string
  product_policy_sha256: string
  source_result_sha256: string
  history_start: string
  history_end: string
  availability_semantic: 'RECONSTRUCTED_LATE_BOUND_NOT_HISTORICALLY_DECISION_AVAILABLE'
}>

export type MarketSectorIndexReleaseV2 = Readonly<{
  publication_id: string
  manifest_sha256: string
  rights_revision: string
  published_at: string
  withdrawn_at: string | null
  series_revision_id: string
  product_policy_sha256: string
  historical_publication_id: string
  historical_manifest_sha256: string
  continuation_spec_sha256: string
  history_start: string
  history_end: string
  measured_start: string | null
  measured_end: string | null
  availability_semantics: readonly ['RECONSTRUCTED_LATE_BOUND', 'CONTEMPORANEOUSLY_MEASURED']
}>

export type MarketSectorIndexQuery = Readonly<{
  from_date: string | null
  to_date: string | null
  after_date: string | null
  limit: number
  next_after_date: string | null
}>

type MarketSectorIndexCommon = Readonly<{
  contract_name: 'market-sector-index-public-api'
  product_kind: 'DESCRIPTIVE_MARKET_SECTOR_INDEX'
  prediction_status: 'NOT_A_PREDICTION'
  query: MarketSectorIndexQuery
}>

export type MarketSectorIndexDirectory = MarketSectorIndexCommon & Readonly<{
  contract_version: '1'
  purpose: 'CS2_ROTATE_DERIVED_MARKET_SECTOR_INDEX_HISTORY_V1'
  release: MarketSectorIndexReleaseV1
  response_kind: 'SCOPE_DIRECTORY'
  scope: null
  points: readonly []
  scopes: readonly MarketSectorIndexScope[]
}>

export type MarketSectorIndexSeriesV1 = MarketSectorIndexCommon & Readonly<{
  contract_version: '1'
  purpose: 'CS2_ROTATE_DERIVED_MARKET_SECTOR_INDEX_HISTORY_V1'
  release: MarketSectorIndexReleaseV1
  response_kind: 'INDEX_SERIES'
  scope: MarketSectorIndexScope
  points: readonly MarketSectorIndexPoint[]
  scopes?: readonly MarketSectorIndexScope[]
}>

export type MarketSectorIndexSeriesV2 = MarketSectorIndexCommon & Readonly<{
  contract_version: '2'
  purpose: 'CS2_ROTATE_DESCRIPTIVE_MARKET_SECTOR_INDEX_HISTORY_AND_CURRENT_V2'
  release: MarketSectorIndexReleaseV2
  response_kind: 'INDEX_SERIES'
  scope: MarketSectorIndexScope
  points: readonly MarketSectorIndexPoint[]
}>

export type MarketSectorIndexSeries = MarketSectorIndexSeriesV1 | MarketSectorIndexSeriesV2

export type MarketSectorIndexError = Readonly<{
  contract_name: 'market-sector-index-public-api'
  contract_version: '1'
  response_kind: 'ERROR'
  error: Readonly<{ code: MarketSectorIndexErrorCode; retryable: boolean }>
}>

export type MarketSectorIndexDocument =
  | MarketSectorIndexDirectory
  | MarketSectorIndexSeries
  | MarketSectorIndexError

export type MarketSectorIndexDirectoryQuery = Readonly<{ publication_id: string | null }>

export type MarketSectorIndexSeriesQuery = Readonly<{
  publication_id: string | null
  scope_token: string
  from_date: string | null
  to_date: string | null
  after_date: string | null
  limit: number
}>



