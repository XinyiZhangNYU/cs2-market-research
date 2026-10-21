import type { MarketSectorIndexErrorCode, MarketSectorIndexLabels } from './marketSectorIndexPublicApiTypes'
import type { MarketSectorIndexPoint } from './marketSectorIndexPublicApiTypes'
import type { NativeCnyIndexMethod } from './nativeCnyIndexPublicApi'

export type MarketSectorIndexGroupCode =
  | 'MARKET'
  | 'SECTORS'
  | 'CASES'
  | 'WEAPON_MODELS'
  | 'KNIFE_MODELS'
  | 'GLOVE_MODELS'
  | 'COLLECTIONS'
  | 'ARMORY_RELEASES'
  | 'DOPPLER'

export type MarketSectorIndexScopeGroup = Readonly<{
  group_code: MarketSectorIndexGroupCode
  labels: MarketSectorIndexLabels
  display_order: number
  scope_count: number
}>

export type MarketSectorIndexScopeV3 = Readonly<{
  scope_token: string
  scope_code: string
  scope_kind: 'MARKET' | 'SECTOR' | 'SUBSECTOR'
  group_code: MarketSectorIndexGroupCode
  parent_scope_code: string | null
  ancestor_scope_codes: readonly string[]
  labels: MarketSectorIndexLabels
  series_source: 'REGULAR_SUCCESSOR_RECONSTRUCTION' | 'VARIANT_RECONSTRUCTION' | 'NATIVE_CNY'
  price_history_eligibility: 'RECONSTRUCTED_HISTORY' | 'FORWARD_ONLY' | null
  first_available_date: string | null
  last_available_date: string | null
  current_member_count: number
  observed_price_member_count: number
  origin_uncertainty_disclosed: boolean
  low_member_count: boolean | null
  linked_collection_scope_tokens: readonly string[]
}>

export type MarketSectorIndexDirectoryReleaseV3 = Readonly<{
  native_cny?: true
  /** Native CNY only: the decoded /index/day method (V1 or H), so copy can name the live series. */
  native_method?: NativeCnyIndexMethod
  publication_id: string
  manifest_sha256: string | null
  rights_revision: string | null
  published_at: string
  withdrawn_at: string | null
  directory_id: string | null
  directory_sha256: string | null
  directory_sealed_at: string | null
  candidate_sha256: string | null
  successor_delta_sha256: string | null
  continuation_spec_sha256: string | null
  history_start: string | null
  history_end: string
  measured_start: string | null
  measured_end: string | null
  availability_semantics: readonly ['RECONSTRUCTED_LATE_BOUND', 'CONTEMPORANEOUSLY_MEASURED']
}>

type Common = Readonly<{
  contract_name: 'market-sector-index-public-api'
  contract_version: '3'
  product_kind: 'DESCRIPTIVE_MARKET_SECTOR_INDEX'
  purpose: 'CS2_ROTATE_HIERARCHICAL_MARKET_SECTOR_INDEX_V3'
  prediction_status: 'NOT_A_PREDICTION'
  release: MarketSectorIndexDirectoryReleaseV3
  query: Readonly<{
    group: MarketSectorIndexGroupCode | null
    after: string | null
    limit: number | null
    next_after: string | null
  }>
}>

export type MarketSectorIndexGroupDirectoryV3 = Common & Readonly<{
  response_kind: 'SCOPE_GROUP_DIRECTORY'
  groups: readonly MarketSectorIndexScopeGroup[]
  scopes: readonly []
}>

export type MarketSectorIndexScopePageV3 = Common & Readonly<{
  response_kind: 'SCOPE_PAGE'
  groups: readonly []
  scopes: readonly MarketSectorIndexScopeV3[]
}>

export type MarketSectorIndexDirectoryErrorV3 = Readonly<{
  contract_name: 'market-sector-index-public-api'
  contract_version: '3'
  response_kind: 'ERROR'
  error: Readonly<{ code: MarketSectorIndexErrorCode; retryable: boolean }>
}>

export type MarketSectorIndexSeriesV3 = Readonly<{
  contract_name: 'market-sector-index-public-api'
  contract_version: '3'
  response_kind: 'INDEX_SERIES'
  product_kind: 'DESCRIPTIVE_MARKET_SECTOR_INDEX'
  purpose: 'CS2_ROTATE_HIERARCHICAL_MARKET_SECTOR_INDEX_V3'
  prediction_status: 'NOT_A_PREDICTION'
  release: MarketSectorIndexDirectoryReleaseV3
  scope: MarketSectorIndexScopeV3
  series_query: Readonly<{
    from_date: string | null
    to_date: string | null
    after_date: string | null
    limit: number
    next_after_date: string | null
  }>
  points: readonly MarketSectorIndexPoint[]
}>

export type MarketSectorIndexDirectoryDocumentV3 =
  | MarketSectorIndexGroupDirectoryV3
  | MarketSectorIndexScopePageV3
  | MarketSectorIndexSeriesV3
  | MarketSectorIndexDirectoryErrorV3

export type MarketSectorIndexRequestV3 =
  | Readonly<{ kind: 'GROUPS'; query: Readonly<{ publication_id: string | null }> }>
  | Readonly<{ kind: 'SCOPES'; query: Readonly<{
      publication_id: string | null
      group: MarketSectorIndexGroupCode
      after: string | null
      limit: number
    }> }>
  | Readonly<{ kind: 'SERIES'; query: Readonly<{
      publication_id: string | null
      scope_token: string
      from_date: string | null
      to_date: string | null
      after_date: string | null
      limit: number
    }> }>

export type MarketSectorIndexDirectoryRequestV3 = Exclude<MarketSectorIndexRequestV3, { kind: 'SERIES' }>
