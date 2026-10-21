import type {
  CatalogDisplayErrorCode,
  CatalogEditionKind,
  CatalogItemKind,
  CatalogWearTier,
  WireCatalogDisplayMember,
} from './catalogDisplayApiTypes'
import type { WireCatalogDisplaySnapshotDescriptor } from './catalogDisplaySnapshotApiTypes'
import type { DeepReadonly } from './validated'

export type CatalogQueryLocale = 'en' | 'zh_cn'
export type CatalogQuerySort = 'NAME_ASC' | 'EDITION_ASC' | 'WEAR_ASC'
export type CatalogQueryRarity =
  | 'COVERT'
  | 'CLASSIFIED'
  | 'RESTRICTED'
  | 'MIL_SPEC'
  | 'INDUSTRIAL'
  | 'CONSUMER'
  | 'EXTRAORDINARY'
  | 'CONTRABAND'
export type CatalogQueryItemCategory =
  | 'NORMAL'
  | 'STATTRAK'
  | 'SOUVENIR'
  | 'STAR'
  | 'STAR_STATTRAK'

export type WireCatalogQueryProfiles = {
  navigation_sha256: string
  navigation_version: 'v1'
  search_profile: 'ECMASCRIPT_NFKC_WS_LOWER_V1'
  sort_profile: 'LOCALIZED_CODEPOINT_V1'
  source_mapping_sha256: string
}

export type WireCatalogQueryImageCounts = {
  bound: number
  not_produced: number
  total: number
}

export type WireCatalogBootstrapQuery = { snapshot_id: string }
export type WireCatalogSeriesQuery = {
  equipment_selection_id: string
  item_category: CatalogQueryItemCategory | null
  locale: CatalogQueryLocale
  page_size: number
  rarity: CatalogQueryRarity | null
  search_normalized: string | null
  search_text: string | null
  snapshot_id: string
  sort: 'NAME_ASC' | 'PRODUCT' | 'DISCOVERY'
  discovery_seed?: string
  wear_tier: CatalogWearTier | null
}
export type WireCatalogUnitsQuery = {
  base_item_code: string
  edition_kinds: readonly CatalogEditionKind[]
  item_category: CatalogQueryItemCategory | null
  item_kind: CatalogItemKind
  locale: CatalogQueryLocale
  page_size: number
  rarity: CatalogQueryRarity | null
  snapshot_id: string
  sort: CatalogQuerySort
  wear_tiers: readonly CatalogWearTier[]
}
export type WireCatalogDetailQuery = {
  analysis_unit_id: string
  page_size: number
  snapshot_id: string
}

type WireCatalogQueryBase<K extends string, Q> = {
  api_contract: 'catalog-display-query-api'
  api_version: 'v1'
  response_kind: K
  profiles: WireCatalogQueryProfiles
  query: Q
  snapshot: WireCatalogDisplaySnapshotDescriptor
}

export type WireCatalogBootstrapResponse = WireCatalogQueryBase<
  'CATALOG_QUERY_BOOTSTRAP',
  WireCatalogBootstrapQuery
> & {
  categories: readonly {
    category_id: string
    member_count: number
    series_count: number
  }[]
  equipment: readonly {
    category_id: string
    item_kind: CatalogItemKind
    member_count: number
    selection_id: string
    series_count: number
  }[]
  image_counts: WireCatalogQueryImageCounts
}

export type WireCatalogSeriesMember = {
  base_item_code: string
  category_id: string
  equipment_model_id: string
  item_kind: CatalogItemKind
  matched_member_count: number
  rarity: CatalogQueryRarity | null
  representative: WireCatalogDisplayMember
}

export type WireCatalogSeriesResponse = WireCatalogQueryBase<
  'CATALOG_QUERY_SERIES',
  WireCatalogSeriesQuery
> & {
  members: readonly WireCatalogSeriesMember[]
  next_cursor: string | null
  previous_cursor: string | null
  total_matching_series: number
}

export type WireCatalogFacet = {
  edition_counts: readonly { count: number; value: CatalogEditionKind }[]
  eligible_member_count: number
  image_counts: WireCatalogQueryImageCounts
  wear_counts: readonly { count: number; value: CatalogWearTier }[]
}

export type WireCatalogUnitsResponse = WireCatalogQueryBase<
  'CATALOG_QUERY_UNITS',
  WireCatalogUnitsQuery
> & {
  facet: WireCatalogFacet
  members: readonly WireCatalogDisplayMember[]
  next_cursor: string | null
  previous_cursor: string | null
  total_matching_members: number
}

export type WireCatalogDetailResponse = WireCatalogQueryBase<
  'CATALOG_QUERY_DETAIL',
  WireCatalogDetailQuery
> & {
  member: WireCatalogDisplayMember
  next_cursor: string | null
  parent_present: boolean
  previous_cursor: string | null
  sibling_total: number
  siblings: readonly WireCatalogDisplayMember[]
}

export type WireCatalogQueryError = {
  api_contract: 'catalog-display-query-api'
  api_version: 'v1'
  response_kind: 'ERROR'
  error: {
    code: CatalogDisplayErrorCode
    http_status: 400 | 404 | 503
    retryable: boolean
  }
}

export type WireCatalogDisplayQueryResponse =
  | WireCatalogBootstrapResponse
  | WireCatalogSeriesResponse
  | WireCatalogUnitsResponse
  | WireCatalogDetailResponse
  | WireCatalogQueryError

declare const VALIDATED_CATALOG_DISPLAY_QUERY_API: unique symbol
export type ValidatedCatalogDisplayQueryResponse =
  DeepReadonly<WireCatalogDisplayQueryResponse> & {
    readonly [VALIDATED_CATALOG_DISPLAY_QUERY_API]: WireCatalogDisplayQueryResponse['response_kind']
  }
