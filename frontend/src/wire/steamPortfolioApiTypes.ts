import type { CatalogEditionKind, CatalogItemKind, CatalogNameAuthority, CatalogWearTier, WireCatalogDisplayMedia } from './catalogDisplayApiTypes'

export const STEAM_PORTFOLIO_CATALOG_HITS_CONTRACT = 'steam-portfolio-api'
export const STEAM_PORTFOLIO_INVENTORY_CONTRACT = 'steam-portfolio-inventory'
export const STEAM_PORTFOLIO_API_VERSION = 'v1'
export const STEAM_PORTFOLIO_NAME_PAGE_SIZE = 40

export type SteamPortfolioInventoryErrorCode =
  | 'INVALID_ARGUMENT'
  | 'PRIVATE'
  | 'NOT_FOUND'
  | 'STEAM_UNAVAILABLE'

export type SteamPortfolioCatalogErrorCode =
  | 'INVALID_ARGUMENT'
  | 'NOT_FOUND'
  | 'CONTRACT_UNAVAILABLE'
  | 'RECORD_CORRUPT'
  | 'BACKEND_UNAVAILABLE'

export type SteamPortfolioStack = Readonly<{
  market_hash_name: string
  quantity: number
}>

export type SteamPortfolioInventorySuccess = Readonly<{
  api_contract: typeof STEAM_PORTFOLIO_INVENTORY_CONTRACT
  api_version: typeof STEAM_PORTFOLIO_API_VERSION
  response_kind: 'STEAM_PORTFOLIO_INVENTORY'
  steamid: string
  appid: 730
  contextid: '2'
  total_asset_count: number
  skipped_unnamed: number
  truncated: boolean
  stacks: readonly SteamPortfolioStack[]
}>

export type SteamPortfolioInventoryError = Readonly<{
  api_contract: typeof STEAM_PORTFOLIO_INVENTORY_CONTRACT
  api_version: typeof STEAM_PORTFOLIO_API_VERSION
  response_kind: 'ERROR'
  error: Readonly<{
    code: SteamPortfolioInventoryErrorCode
    http_status: number
    retryable: boolean
  }>
}>

export type SteamPortfolioCatalogMember = Readonly<{
  analysis_unit_id: string
  item_kind: CatalogItemKind
  base_item_code: string
  edition_kind: CatalogEditionKind
  wear_tier: CatalogWearTier
  localized_name: Readonly<{
    authority: CatalogNameAuthority
    en: string
    zh_cn: string
  }>
  media: WireCatalogDisplayMedia
  version_context: Readonly<{
    media_asset_version_id: string | null
  }>
}>

export type SteamPortfolioCatalogHitStatus = 'UNIQUE' | 'AMBIGUOUS' | 'UNSUPPORTED'

export type SteamPortfolioCatalogHit = Readonly<{
  market_hash_name: string
  status: SteamPortfolioCatalogHitStatus
  member: SteamPortfolioCatalogMember | null
}>

export type SteamPortfolioCatalogHitsSuccess = Readonly<{
  api_contract: typeof STEAM_PORTFOLIO_CATALOG_HITS_CONTRACT
  api_version: typeof STEAM_PORTFOLIO_API_VERSION
  response_kind: 'STEAM_PORTFOLIO_CATALOG_HITS'
  snapshot_id: string
  hits: readonly SteamPortfolioCatalogHit[]
}>

export type SteamPortfolioCatalogHitsError = Readonly<{
  api_contract: typeof STEAM_PORTFOLIO_CATALOG_HITS_CONTRACT
  api_version: typeof STEAM_PORTFOLIO_API_VERSION
  response_kind: 'ERROR'
  error: Readonly<{
    code: SteamPortfolioCatalogErrorCode
    http_status: number
    retryable: boolean
  }>
}>

export type SteamPortfolioInventoryResponse =
  | SteamPortfolioInventorySuccess
  | SteamPortfolioInventoryError

export type SteamPortfolioCatalogHitsResponse =
  | SteamPortfolioCatalogHitsSuccess
  | SteamPortfolioCatalogHitsError
