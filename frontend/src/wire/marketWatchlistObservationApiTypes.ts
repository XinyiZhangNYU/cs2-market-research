export type PublicObservationErrorCode =
  | 'INVALID_ARGUMENT'
  | 'INVALID_CURSOR'
  | 'NOT_PUBLISHED'
  | 'NOT_FOUND'
  | 'BACKEND_UNAVAILABLE'
  | 'PUBLICATION_EXPIRED'
  | 'PUBLICATION_WITHDRAWN'
  | 'RESULT_CORRUPT'

export type PublicObservationFreshness = 'FRESH' | 'STALE_RETAINED'
export type PublicObservationQualityStatus = 'COMPLETE' | 'DEGRADED_OPTIONAL'
export type PublicObservationQualityReason =
  | 'CLOCK_SKEW'
  | 'INPUT_GAP'
  | 'OPTIONAL_SOURCE_UNAVAILABLE'
  | 'STALE_RETAINED'
export type PublicObservationReasonCode =
  | 'COINCIDENT'
  | 'FIRST_ENTRY'
  | 'RECENT_PERSISTENT'
  | 'REENTRY'
  | 'SUPPLY_LEAD'

export type PublicObservationSourceCoverage = Readonly<{
  status: 'COMPLETE'
  expected_source_count: number
  observed_source_count: number
  observation_count: number
}>

export type PublicObservationDataQuality = Readonly<{
  status: PublicObservationQualityStatus
  reason_codes: readonly PublicObservationQualityReason[]
}>

export type PublicObservationCatalogDescriptor = Readonly<{
  snapshot_id: string
  catalog_version: string
  as_of: string
  available_at: string
  member_count: number
  member_set_hash: string
}>

export type PublicObservationCatalogMedia =
  | Readonly<{ status: 'NOT_PRODUCED' }>
  | Readonly<{
      status: 'BOUND'
      media_asset_version_id: string
      media_key: string
      presentation_kind: 'SERIES_REPRESENTATIVE' | 'STYLE_REPRESENTATIVE'
    }>

export type PublicObservationCatalogProjection = Readonly<{
  analysis_unit_id: string
  parent_analysis_unit_id: string | null
  analysis_unit_kind: 'BASE_MHN' | 'STYLE_VARIANT' | 'PATTERN_VARIANT'
  item_kind: 'WEAPON' | 'KNIFE' | 'GLOVE' | 'AGENT' | 'OTHER' | 'UNKNOWN'
  base_item_code: string
  edition_kind: 'STANDARD' | 'STATTRAK' | 'SOUVENIR' | 'UNKNOWN'
  wear_tier:
    | 'FACTORY_NEW'
    | 'MINIMAL_WEAR'
    | 'FIELD_TESTED'
    | 'WELL_WORN'
    | 'BATTLE_SCARRED'
    | 'NOT_APPLICABLE'
    | 'UNKNOWN'
  localized_name: Readonly<{ en: string; zh_cn: string }>
  media: PublicObservationCatalogMedia
  catalog_version: string
}>

export type PublicObservationPublication = Readonly<{
  publication_id: string
  manifest_hash: string
  as_of: string
  known_at: string
  public_available_at: string
  published_at: string
  fresh_until: string
  retain_until: string
  freshness: PublicObservationFreshness
  supersedes_publication_id: string | null
  producer_release: Readonly<{
    release_code: string
    algorithm_version: string
    data_quality_policy_version: string
    input_contract_version: 'market-watchlist-observation-input/1'
  }>
  policy: Readonly<{
    policy_code: 'SYSTEM_PROSPECTIVE_ITEM_OBSERVATION_V1'
    policy_version: 'v1'
    order: 'SIGNAL_TIME_DESC'
  }>
  public_purpose: Readonly<{
    purpose_code: 'CS2_ROTATE_BOUNDED_ITEM_OBSERVATION_PAGE_V1'
    rights_version_label: 'upstream-bounded-item-observation-page-2026-09-06'
    terms_sha256: '547a6a0d29f78f038ca785c60aad1788b8d7acd628322fc0c54799ccea1be1e9'
    distribution_mode: 'BOUNDED_SAME_ORIGIN_DERIVED_PAGE'
  }>
  catalog: PublicObservationCatalogDescriptor
  source_coverage: PublicObservationSourceCoverage
  data_quality: PublicObservationDataQuality
}>

export type PublicObservationMember = Readonly<{
  position: number
  lane: 'OBSERVATION'
  validation_status: 'SHADOW_UNVALIDATED'
  observation_id: string
  analysis_unit_id: string
  signal_observed_at: string
  known_at: string
  reason_codes: readonly PublicObservationReasonCode[]
  source_coverage: PublicObservationSourceCoverage
  data_quality: PublicObservationDataQuality
  catalog: PublicObservationCatalogProjection
}>

export type ObservationListQuery = Readonly<{
  as_of: string | null
  publication_id: string | null
  sort: 'SIGNAL_TIME_DESC'
  page_size: number
  cursor: string | null
}>

export type ObservationDetailQuery = Readonly<{
  publication_id: string
  analysis_unit_id: string
}>

type PublicObservationResponseBase = Readonly<{
  api_contract: 'market-watchlist-public-observation-api'
  api_version: 'v1'
}>

export type PublicObservationWatchlistResponse = PublicObservationResponseBase & Readonly<{
  response_kind: 'OBSERVATION_WATCHLIST'
  lane: 'OBSERVATION'
  validation_status: 'SHADOW_UNVALIDATED'
  query: ObservationListQuery & Readonly<{ query_known_at: string; publication_id: string }>
  publication: PublicObservationPublication
  total: number
  members: readonly PublicObservationMember[]
  next_cursor: string | null
}>

export type PublicObservationDetailResponse = PublicObservationResponseBase & Readonly<{
  response_kind: 'OBSERVATION_DETAIL'
  lane: 'OBSERVATION'
  validation_status: 'SHADOW_UNVALIDATED'
  query: ObservationDetailQuery & Readonly<{ query_known_at: string }>
  publication: PublicObservationPublication
  member: PublicObservationMember
}>

export type PublicObservationErrorResponse = PublicObservationResponseBase & Readonly<{
  response_kind: 'ERROR'
  error: Readonly<{ code: PublicObservationErrorCode; retryable: boolean }>
}>

export type PublicObservationDocument =
  | PublicObservationWatchlistResponse
  | PublicObservationDetailResponse
  | PublicObservationErrorResponse
