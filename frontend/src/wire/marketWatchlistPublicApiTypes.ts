import type {
  CaseStatus,
  CoreDomain,
  DomainMissingReasonCode,
  DomainStrength,
  EvidenceFlag,
  ItemCycleStage,
  MarketLevelRegime,
  MarketTrendStage,
  Recommendation,
  RegimeRelation,
  RelativeStrength,
  SectorTrendStage,
  SignalStrength,
  TradeConfirmation,
} from '../contract/enums'
import type { EditionKind } from '../contract/identity'

export type PublicResultErrorCode =
  | 'INVALID_ARGUMENT'
  | 'INVALID_CURSOR'
  | 'NOT_PUBLISHED'
  | 'NOT_FOUND'
  | 'BACKEND_UNAVAILABLE'
  | 'PUBLICATION_EXPIRED'
  | 'PUBLICATION_WITHDRAWN'
  | 'RESULT_CORRUPT'

export type PublicResultFreshness = 'FRESH' | 'STALE_RETAINED'
export type PublicResultDataStatus = 'COMPLETE' | 'DEGRADED_OPTIONAL'
export type PublicSectorCode = 'GLOVE' | 'KNIFE' | 'WEAPON'

export type PublicCatalogDescriptor = Readonly<{
  snapshot_id: string
  catalog_version: string
  as_of: string
  available_at: string
  member_count: number
  member_set_hash: string
}>

export type PublicResultPublication = Readonly<{
  publication_id: string
  manifest_hash: string
  result_as_of: string
  input_available_at: string
  public_available_at: string
  published_at: string
  fresh_until: string
  retain_until: string
  freshness: PublicResultFreshness
  supersedes_publication_id: string | null
  producer_release: Readonly<{
    release_code: string
    algorithm_version: string
    parameter_set_version: string
    data_quality_policy_version: string
  }>
  watchlist_policy_code: string
  catalog: PublicCatalogDescriptor
}>

export type PublicMarketState = Readonly<{
  analysis_unit_id: string
  data_status: PublicResultDataStatus
  trend_stage: MarketTrendStage
  level_regime: MarketLevelRegime
  evidence_flags: readonly EvidenceFlag[]
  recommendation: Recommendation
  case_status: CaseStatus | null
}>

export type PublicSectorState = Readonly<{
  display_order: number
  sector_code: PublicSectorCode
  analysis_unit_id: string
  data_status: PublicResultDataStatus
  trend_stage: SectorTrendStage
  relative_strength: RelativeStrength
  breadth: Readonly<{
    advancing_member_ratio: string | null
    median_member_return: string | null
    breadth_expanding: boolean
    breadth_narrowing: boolean
    concentration_warning: boolean
  }>
  evidence_flags: readonly EvidenceFlag[]
  recommendation: Recommendation
  case_status: CaseStatus | null
}>

export type PublicItemState = Readonly<{
  analysis_unit_id: string
  data_status: PublicResultDataStatus
  cycle_stage: ItemCycleStage
  evidence_flags: readonly EvidenceFlag[]
  regime_relation: readonly RegimeRelation[]
  recommendation: Recommendation
  case_status: CaseStatus | null
  recommendation_detail: Readonly<{
    recommendation: Recommendation
    signal_strength: SignalStrength
    evidence_coverage: string
    trade_confirmation: TradeConfirmation
  }>
  evidence_domains: readonly Readonly<{
    domain: CoreDomain
    strength: DomainStrength
    contributing_feature_keys: readonly string[]
    missing_reason: DomainMissingReasonCode | null
  }>[]
  claims: readonly string[]
}>

export type PublicCatalogMedia =
  | Readonly<{ status: 'NOT_PRODUCED' }>
  | Readonly<{
      status: 'BOUND'
      media_asset_version_id: string
      media_key: string
      presentation_kind: 'SERIES_REPRESENTATIVE' | 'STYLE_REPRESENTATIVE'
    }>

export type PublicCatalogProjection = Readonly<{
  analysis_unit_id: string
  parent_analysis_unit_id: string | null
  analysis_unit_kind: 'BASE_MHN' | 'STYLE_VARIANT' | 'PATTERN_VARIANT'
  item_kind: 'WEAPON' | 'KNIFE' | 'GLOVE' | 'AGENT' | 'OTHER' | 'UNKNOWN'
  base_item_code: string
  edition_kind: EditionKind
  wear_tier:
    | 'FACTORY_NEW'
    | 'MINIMAL_WEAR'
    | 'FIELD_TESTED'
    | 'WELL_WORN'
    | 'BATTLE_SCARRED'
    | 'NOT_APPLICABLE'
    | 'UNKNOWN'
  localized_name: Readonly<{ en: string; zh_cn: string }>
  media: PublicCatalogMedia
  catalog_version: string
}>

export type PublicWatchlistMember = Readonly<{
  rank: number
  tie_break_key: string
  inclusion_reason_codes: readonly string[]
  result: PublicItemState
  catalog: PublicCatalogProjection
}>

export type MarketOverviewQuery = Readonly<{ as_of: string | null }>
export type MarketHistoryQuery = Readonly<{
  as_of: string | null
  page_size: number
  cursor: string | null
}>
export type WatchlistQuery = Readonly<{
  as_of: string | null
  publication_id: string | null
  sort: 'RANK_ASC'
  page_size: number
  cursor: string | null
}>
export type WatchlistDetailQuery = Readonly<{
  as_of: string | null
  publication_id: string
  analysis_unit_id: string
}>
export type WatchlistHistoryQuery = Readonly<{
  publication_id: string
  analysis_unit_id: string
  page_size: number
  cursor: string | null
}>

type ResponseBase = Readonly<{
  api_contract: 'market-watchlist-public-api'
  api_version: 'v1'
}>

export type PublicMarketOverviewResponse = ResponseBase & Readonly<{
  response_kind: 'MARKET_OVERVIEW'
  query: MarketOverviewQuery & Readonly<{ query_known_at: string }>
  publication: PublicResultPublication
  market: PublicMarketState
  sectors: readonly [PublicSectorState, PublicSectorState, PublicSectorState]
}>

export type PublicMarketHistoryMember = Readonly<{
  publication: PublicResultPublication
  market: PublicMarketState
  sectors: readonly [PublicSectorState, PublicSectorState, PublicSectorState]
}>

export type PublicMarketHistoryResponse = ResponseBase & Readonly<{
  response_kind: 'MARKET_HISTORY'
  query: MarketHistoryQuery & Readonly<{ query_known_at: string }>
  members: readonly PublicMarketHistoryMember[]
  next_cursor: string | null
}>

export type PublicWatchlistResponse = ResponseBase & Readonly<{
  response_kind: 'WATCHLIST'
  query: WatchlistQuery & Readonly<{ query_known_at: string }>
  publication: PublicResultPublication
  total: number
  members: readonly PublicWatchlistMember[]
  next_cursor: string | null
}>

export type PublicWatchlistDetailResponse = ResponseBase & Readonly<{
  response_kind: 'WATCHLIST_DETAIL'
  query: WatchlistDetailQuery & Readonly<{ query_known_at: string }>
  publication: PublicResultPublication
  member: PublicWatchlistMember
}>

export type PublicWatchlistHistoryMember = Readonly<{
  publication: PublicResultPublication
  rank: number
  inclusion_reason_codes: readonly string[]
  result: PublicItemState
}>

export type PublicWatchlistHistoryResponse = ResponseBase & Readonly<{
  response_kind: 'WATCHLIST_HISTORY'
  query: WatchlistHistoryQuery & Readonly<{ query_known_at: string }>
  members: readonly PublicWatchlistHistoryMember[]
  next_cursor: string | null
}>

export type PublicResultErrorResponse = ResponseBase & Readonly<{
  response_kind: 'ERROR'
  error: Readonly<{ code: PublicResultErrorCode; retryable: boolean }>
}>

export type PublicResultDocument =
  | PublicMarketOverviewResponse
  | PublicMarketHistoryResponse
  | PublicWatchlistResponse
  | PublicWatchlistDetailResponse
  | PublicWatchlistHistoryResponse
  | PublicResultErrorResponse
