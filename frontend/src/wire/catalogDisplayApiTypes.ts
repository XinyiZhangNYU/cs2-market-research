import type { DeepReadonly } from './validated'

export type CatalogItemKind =
  | 'WEAPON'
  | 'KNIFE'
  | 'GLOVE'
  | 'AGENT'
  | 'OTHER'
  | 'UNKNOWN'

export type CatalogWearTier =
  | 'FACTORY_NEW'
  | 'MINIMAL_WEAR'
  | 'FIELD_TESTED'
  | 'WELL_WORN'
  | 'BATTLE_SCARRED'
  | 'NOT_APPLICABLE'
  | 'UNKNOWN'

export type CatalogEditionKind = 'STANDARD' | 'STATTRAK' | 'SOUVENIR' | 'UNKNOWN'
export type CatalogAnalysisUnitKind = 'BASE_MHN' | 'STYLE_VARIANT' | 'PATTERN_VARIANT'
export type CatalogNameAuthority = 'VALVE_STEAM' | 'MARKET_D' | 'MARKET_B'

export type WireCatalogDisplayQuery = {
  analysis_unit_kind: CatalogAnalysisUnitKind | null
  as_of: string
  base_item_code: string | null
  edition_kind: CatalogEditionKind | null
  item_kind: CatalogItemKind | null
  known_at: string
  page_size: number
  sort: 'ANALYSIS_UNIT_ID_ASC'
  wear_tier: CatalogWearTier | null
}

export type WireCatalogDisplayMedia =
  | { status: 'NOT_PRODUCED' }
  | {
      status: 'BOUND'
      media_key: string
      presentation_kind: 'SERIES_REPRESENTATIVE' | 'STYLE_REPRESENTATIVE'
    }

export type WireCatalogDisplayProjection = {
  analysis_unit_id: string
  parent_analysis_unit_id: string | null
  analysis_unit_kind: CatalogAnalysisUnitKind
  item_kind: CatalogItemKind
  base_item_code: string
  edition_kind: CatalogEditionKind
  wear_tier: CatalogWearTier
  localized_name: {
    authority: CatalogNameAuthority
    en: string
    zh_cn: string
  }
  media: WireCatalogDisplayMedia
  catalog_version: string
  version_context: {
    analysis_unit_version_id: string
    item_variant_version_id: string
    media_asset_version_id: string | null
    name_en_version_id: string
    name_zh_cn_version_id: string
  }
  valid_from: string
  projection_hash: string
}

export type WireCatalogDisplayMember = {
  projection: WireCatalogDisplayProjection
  storage: {
    available_at: string
    valid_to: string | null
  }
}

export type WireCatalogDisplayListResponse = {
  api_contract: 'catalog-display-api'
  api_version: 'v1'
  response_kind: 'CATALOG_DISPLAY_LIST'
  query: WireCatalogDisplayQuery
  members: readonly WireCatalogDisplayMember[]
  next_cursor: string | null
}

export type CatalogDisplayErrorCode =
  | 'INVALID_ARGUMENT'
  | 'INVALID_CURSOR'
  | 'NOT_FOUND'
  | 'CONTRACT_UNAVAILABLE'
  | 'RECORD_CORRUPT'
  | 'BACKEND_UNAVAILABLE'

export type WireCatalogDisplayError = {
  api_contract: 'catalog-display-api'
  api_version: 'v1'
  response_kind: 'ERROR'
  error: {
    code: CatalogDisplayErrorCode
    http_status: 400 | 404 | 503
    retryable: boolean
  }
}

export type WireCatalogDisplayResponse =
  | WireCatalogDisplayListResponse
  | WireCatalogDisplayError

declare const VALIDATED_CATALOG_DISPLAY_API: unique symbol

export type ValidatedCatalogDisplayResponse = DeepReadonly<WireCatalogDisplayResponse> & {
  readonly [VALIDATED_CATALOG_DISPLAY_API]: 'CATALOG_DISPLAY_LIST' | 'ERROR'
}
