// Consumer types for the directly imported shared price-display-api V1 Schema.
// These are not publication DTOs; only the decoder may admit response objects.
export type PriceCurrency = 'USD' | 'CNY'
export type PriceSnapshotKind = 'CURRENT' | 'HISTORY'
export type PriceQuoteOrigin = 'SOURCE_QUOTE' | 'PROVIDER_AGGREGATE'
export type PriceMarket = 'market_a' | 'market_c' | 'market_b'
export type PriceQuoteKind = 'ASK' | 'BID'
export type PriceSourceReason = 'SOURCE_UNAVAILABLE' | 'CAPTURE_GAP' | 'SOURCE_CONFLICT'
export type PriceAmountReason = PriceSourceReason | 'NO_ELIGIBLE_FX' | 'FX_STALE' | 'AMOUNT_OUT_OF_RANGE'

export type PriceSource = Readonly<{
  quote_origin: PriceQuoteOrigin
  logical_market: PriceMarket | null
  transport: 'upstream' | 'market_b_direct'
}>
export type PriceSourceValue = Readonly<{
  value: string
  currency: PriceCurrency
  unit: 'USD_DECIMAL' | 'CNY_MINOR'
  normalized_fraction_digits: 0 | 8
  upstream_fraction_digits: number | null
}>
export type PriceAmount = Readonly<
  | { status: 'AVAILABLE'; currency: PriceCurrency; amount: string; scale: 2 | 8
      basis: 'NATIVE' | 'FX_DERIVED'; rounding: 'EXACT' | 'ROUNDED' | 'ROUNDED_TO_ZERO'; reason: null }
  | { status: 'UNAVAILABLE'; currency: PriceCurrency; amount: null; scale: null
      basis: null; rounding: null; reason: PriceAmountReason }
>
export type PriceFx = Readonly<{
  public_rate_id: string
  authority: 'ECB'
  method: 'ECB_EUR_CROSS'
  source_event_date: string
  cny_per_usd: string
  carry_days: number
  available_at: string
  cny_valid_from: string
  usd_valid_from: string
  fx_selection_policy_version: 'ecb-eur-cross-daily/2'
  conversion_policy_version: 'price-display-bicurrency/1' | 'ecb-eur-cross-daily/2'
  usage: 'PRICE_DISPLAY_ONLY'
}>
export type PriceQuote = Readonly<{
  quote_id: string
  analysis_unit_id: string
  item_id: string
  quote_kind: PriceQuoteKind
  source: PriceSource
  bucket_at: string | null
  observed_at: string | null
  time_basis: 'BUCKET_AT' | 'OBSERVED_AT' | 'UNAVAILABLE'
  source_updated_at: string | null
  source_collected_at: string | null
  source_available_at: string
  identity_available_at: string
  identity_policy: 'CATALOG_SNAPSHOT_EXACT_ITEM_V1' | 'CURRENT_EXACT_MHN_LATE_BIND_V1'
  late_bound: boolean
  source_price: PriceSourceValue | null
  source_price_reason: PriceSourceReason | null
  amounts: Readonly<Record<PriceCurrency, PriceAmount>>
  fx: PriceFx | null
  available_at: string
}>
export type PriceSnapshot = Readonly<{
  snapshot_id: string
  catalog_snapshot_id: string
  catalog_as_of: string
  catalog_available_at: string
  market_as_of: string
  available_at: string
  published_at: string
  kind: PriceSnapshotKind
  price_policy_version: 'price-display-read/1'
}>
export type PriceCatalogBinding = Readonly<{
  snapshot_id: string
  as_of: string
  /** Availability of the independently selected catalog publication; this can
   * follow the catalog seal clock retained by an immutable price snapshot. */
  available_at: string
}>
export type PriceSnapshotQuery = Readonly<{
  query_as_of: string
  known_at: string
  catalog_snapshot_id: string
  kind: PriceSnapshotKind
  page_size: number
  sort: 'MARKET_AS_OF_DESC'
}>
export type PriceItemQuery = Readonly<{
  analysis_unit_id: string
  snapshot_id: string
  as_of: string
  known_at: string
}>
export type PriceHistoryQuery = Readonly<PriceItemQuery & {
  from: string
  to: string
  quote_origin: PriceQuoteOrigin | null
  logical_market: PriceMarket | null
  quote_kind: PriceQuoteKind | null
  page_size: number
  cursor: string | null
  sort: 'EVENT_SOURCE_QUOTE_ID_ASC'
}>
export type PriceQuery = PriceSnapshotQuery | PriceItemQuery | PriceHistoryQuery
type CommonResponse = Readonly<{
  api_contract: 'price-display-api'
  api_version: 'v1'
  document_hash: string
}>
export type PriceSnapshotList = CommonResponse & Readonly<{
  response_kind: 'PRICE_SNAPSHOT_LIST'
  query: PriceSnapshotQuery
  snapshot: null
  items: readonly PriceSnapshot[]
  pagination: { readonly page_size: number; readonly next_cursor: null }
}>
export type PriceItem = CommonResponse & Readonly<{
  response_kind: 'PRICE_ITEM'
  query: PriceItemQuery
  snapshot: PriceSnapshot
  items: readonly PriceQuote[]
  pagination: null
}>
export type PriceHistory = CommonResponse & Readonly<{
  response_kind: 'PRICE_HISTORY'
  query: PriceHistoryQuery
  snapshot: PriceSnapshot
  items: readonly PriceQuote[]
  pagination: { readonly page_size: number; readonly next_cursor: string | null }
}>
export type PriceError = CommonResponse & Readonly<{
  response_kind: 'ERROR'
  query: null
  snapshot: null
  items: readonly []
  pagination: null
  error: {
    readonly code: 'INVALID_ARGUMENT' | 'INVALID_CURSOR' | 'NOT_FOUND' | 'CONTRACT_UNAVAILABLE' | 'RECORD_CORRUPT' | 'BACKEND_UNAVAILABLE'
    readonly http_status: 400 | 404 | 503
    readonly retryable: boolean
  }
}>
export type PriceDocument = PriceSnapshotList | PriceItem | PriceHistory | PriceError
export type PriceResponseKind = Exclude<PriceDocument['response_kind'], 'ERROR'>
export type PriceCursorAfter = Readonly<{
  event_at: string
  quote_origin: PriceQuoteOrigin
  logical_market: PriceMarket | null
  quote_kind: PriceQuoteKind
  quote_id: string
}>
