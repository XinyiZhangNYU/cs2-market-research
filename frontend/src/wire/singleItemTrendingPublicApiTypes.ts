export type TrendingDirection = 'GAINERS' | 'LOSERS'
export type TrendingFreshness = 'FRESH' | 'STALE_RETAINED'
export type TrendingEvidenceClass =
  | 'RECONSTRUCTED_HISTORY'
  | 'HYBRID_BRIDGED'
  | 'CONTEMPORANEOUSLY_MEASURED'
export type TrendingItemKind = 'WEAPON' | 'KNIFE' | 'GLOVE' | 'AGENT' | 'OTHER' | 'UNKNOWN'
export type TrendingEditionKind = 'STANDARD' | 'STATTRAK' | 'SOUVENIR' | 'UNKNOWN'
export type TrendingWearTier =
  | 'FACTORY_NEW'
  | 'MINIMAL_WEAR'
  | 'FIELD_TESTED'
  | 'WELL_WORN'
  | 'BATTLE_SCARRED'
  | 'NOT_APPLICABLE'
  | 'UNKNOWN'

export type TrendingErrorCode =
  | 'INVALID_ARGUMENT'
  | 'INVALID_CURSOR'
  | 'NOT_PUBLISHED'
  | 'BACKEND_UNAVAILABLE'
  | 'PUBLICATION_EXPIRED'
  | 'PUBLICATION_WITHDRAWN'
  | 'RESULT_CORRUPT'

export type TrendingFilters = Readonly<{
  item_kind: TrendingItemKind | null
  base_item_code: string | null
  edition_kind: TrendingEditionKind | null
  wear_tier: TrendingWearTier | null
}>

export type TrendingListQuery = Readonly<{
  as_of: string | null
  publication_id: string | null
  direction: TrendingDirection
  page_size: number
  cursor: string | null
  filters: TrendingFilters
}>

export type TrendingCatalogMedia =
  | Readonly<{ status: 'NOT_PRODUCED' }>
  | Readonly<{
      status: 'BOUND'
      media_asset_version_id: string
      media_key: string
      presentation_kind: 'SERIES_REPRESENTATIVE' | 'STYLE_REPRESENTATIVE'
    }>

export type TrendingCatalogProjection = Readonly<{
  analysis_unit_id: string
  parent_analysis_unit_id: string | null
  analysis_unit_kind: 'BASE_MHN' | 'STYLE_VARIANT' | 'PATTERN_VARIANT'
  item_kind: TrendingItemKind
  base_item_code: string
  edition_kind: TrendingEditionKind
  wear_tier: TrendingWearTier
  localized_name: Readonly<{ en: string; zh_cn: string }>
  media: TrendingCatalogMedia
  catalog_version: string
}>

export type TrendingMember = Readonly<{
  rank: number
  tie_break_key: string
  measurement_id: string
  analysis_unit_id: string
  direction: TrendingDirection
  evidence_grade: 'THREE_SOURCE_SAME_DIRECTION' | 'THREE_SOURCE_CONFIRMED' | 'TWO_SOURCE_SUPPORTED'
  supporting_sources?: readonly ('market_a' | 'market_b' | 'market_c')[]
  unavailable_sources?: readonly Readonly<{
    source_code: 'market_a' | 'market_b' | 'market_c'
    start_reason: 'QUALIFIED' | 'NO_ACTIVE_ASK' | 'SOURCE_REFRESH_LAG' | 'PROVIDER_HISTORY_SOURCE_ABSENT'
    end_reason: 'QUALIFIED' | 'NO_ACTIVE_ASK' | 'SOURCE_REFRESH_LAG' | 'PROVIDER_HISTORY_SOURCE_ABSENT'
  }>[]
  conservative_source_code: 'market_a' | 'market_b' | 'market_c'
  conservative_same_direction_change_floor_ratio: string
  catalog: TrendingCatalogProjection
}>

export type TrendingPublication = Readonly<{
  publication_id: string
  manifest_hash: string
  result_as_of: string
  input_available_at: string
  public_available_at: string
  published_at: string
  freshness_anchor_at: string
  fresh_until: string
  retain_until: string
  freshness: TrendingFreshness
  supersedes_publication_id: string | null
  producer_release: Readonly<{
    release_code: string
    algorithm_version: string
    data_quality_policy_version: string
    public_top_n_per_direction: number
    minimum_three_source_endpoint_ratio_bps?: number
    minimum_qualified_three_source_endpoint_ratio_bps?: number
    minimum_direction_eligible_ratio_bps?: number
  }>
  numeric_profile: Readonly<{
    profile_code: string
    method_id: 'M3'
    segment: 'A_THREE_SOURCE' | 'SOURCE_TIERED' | 'SOURCE_TIERED_HISTORY_HYBRID'
    horizon_days: 30
    analysis_currency: 'CNY'
    minimum_endpoint_cny_minor: number
    minimum_abs_leg_delta_cny_minor: number
  }>
  rights_release_code: string
  tiering_policy?: Readonly<{
    policy_id: string
    policy_code: string
    evidence_class?: TrendingEvidenceClass
    allowed_missing_reasons: readonly string[]
    maximum_quote_age_minutes?: number
    minimum_qualified_slots?: 9
    expected_slots?: 12
    minimum_supported_endpoint_ratio_bps: number
    public_primary_grade?: 'THREE_SOURCE_CONFIRMED'
    two_source_publication_state?: 'WITHHELD_PENDING_SEPARATE_RIGHTS_AND_PRODUCT_APPROVAL'
    public_readiness_policy_id?: string
    minimum_qualified_three_source_endpoint_ratio_bps?: number
    minimum_public_candidates_per_direction?: number
    empty_public_lane_state?: 'WITHHOLD_PUBLICATION'
  }>
  window_start_date?: string
  evidence_class?: TrendingEvidenceClass
  evidence_disclosure?: Readonly<{
    start_endpoint_acquisition: 'HISTORICAL_PROVIDER_ARCHIVE' | 'CONTEMPORANEOUS_EOD'
    end_endpoint_acquisition: 'HISTORICAL_PROVIDER_ARCHIVE' | 'CONTEMPORANEOUS_EOD'
    historical_obtained_at: string | null
    late_bound_current_membership: boolean
    pit_membership_claimed: false
    prospective_continuity_credit: boolean
    public_label: '历史重建' | '混合桥接' | '当前实测'
  }>
  currency_disclosure?: Readonly<{
    source_currency: 'USD'
    source_native_semantics: 'UPSTREAM_PROVIDER_USD_REFERENCE_NOT_PROVEN_PLATFORM_NATIVE'
    analysis_currency: 'CNY'
    analysis_semantics: 'FX_RECONSTRUCTED_CNY_REFERENCE'
    conversion_policy: 'analysis-cny-minor-half-even/1'
    start_fx_source_event_date: string
    end_fx_source_event_date: string
    current_fx_repricing_forbidden: true
  }>
  rights_maximum_public_members_per_direction: number
  evidence_release_code: string
  catalog: Readonly<{
    catalog_publication_id: string
    snapshot_id: string
    catalog_version: string
    as_of: string
    available_at: string
    published_at: string
    member_count: number
    member_set_hash: string
    decision: 'APPROVED'
    withdrawn: false
  }>
  accounting: Readonly<{
    member_count: number
    qualified_two_source_endpoint_count?: number
    qualified_supported_endpoint_count?: number
    qualified_supported_endpoint_ratio_bps?: number
    three_source_confirmed_count?: number
    two_source_supported_count?: number
    source_endpoint_reason_counts?: Readonly<Record<string, Readonly<Record<string, number>>>>
    three_source_endpoint_count: number
    three_source_endpoint_ratio_bps: number
    qualified_three_source_endpoint_count: number
    qualified_three_source_endpoint_ratio_bps: number
    direction_eligible_count: number
    direction_eligible_ratio_bps: number
    eligible_count: number
    excluded_count: number
    status_counts: Readonly<{
      ELIGIBLE_A3: number
      ELIGIBLE_A2?: number
      WITHHELD_SOURCE_EVIDENCE?: number
      CONFLICTED_DIRECTION: number
      INSUFFICIENT_THREE_SOURCES: number
      FLAT_OR_ZERO_CONFLICT: number
      WITHHELD_ANOMALY: number
      WITHHELD_ANOMALY_UNKNOWN: number
      WITHHELD_WINDOW_EVIDENCE: number
      WITHHELD_MICROPRICE: number
      STALE_ENDPOINT: number
      TEMPORAL_VIOLATION: number
      CONTRACT_MISMATCH: number
    }>
    gainer_count: number
    loser_count: number
  }>
}>

type TrendingResponseBase = Readonly<{
  api_contract: 'single-item-trending-public-api'
  api_version: 'v2' | 'v3' | 'v4'
}>

export type TrendingListResponse = TrendingResponseBase & Readonly<{
  response_kind: 'TRENDING_LIST'
  query: TrendingListQuery & Readonly<{ snapshot_known_at: string; request_known_at: string }>
  publication: TrendingPublication
  total: number
  members: readonly TrendingMember[]
  next_cursor: string | null
}>

export type TrendingErrorResponse = TrendingResponseBase & Readonly<{
  response_kind: 'ERROR'
  error: Readonly<{ code: TrendingErrorCode; retryable: boolean }>
}>

export type TrendingPublicDocument = TrendingListResponse | TrendingErrorResponse
