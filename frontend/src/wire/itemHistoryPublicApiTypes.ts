import type { WireCatalogDisplayProjection } from './catalogDisplayApiTypes'

export type ItemHistoryErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_PUBLISHED'
  | 'NOT_FOUND'
  | 'WITHDRAWN'
  | 'STALE_EXPIRED'
  | 'CORRUPT_PUBLICATION'
  | 'TEMPORARILY_UNAVAILABLE'

export type ItemHistorySort = 'MAX_PRICE_MULTIPLE_DESC' | 'SUPPLY_ONSET_DESC'
export type ItemHistoryProductPool = 'ORDINARY' | 'SOUVENIR'
export type ItemHistoryTimingRelationship = 'SUPPLY_LEADS' | 'CONCURRENT_DAILY' | 'PRICE_LEADS'
export type ItemHistorySupplyConfidence = 'STANDARD' | 'LOW_BASELINE_DEPTH'

export type ItemHistoryPublication = Readonly<{
  publication_id: string
  parent_publication_id: string | null
  manifest_sha256: string
  rights_revision: string
  published_at: string
  withdrawn_at: null
}>

export type ItemHistorySnapshot = Readonly<{
  source_contract: 'single-item-history-family-relation/2.4'
  source_manifest_sha256: string
  source_family_events_sha256: string
  catalog_snapshot_id: string
  input_event_count: number
  history_observed_through: string
  imported_at: string
}>

export type ItemHistoryRelease = Readonly<{
  release_id: string
  algorithm_version: 'single-item-history-reconstruction/2.4'
  causal_kernel_version: 'single-item-causal-kernel/2.4'
  source_generator_commit: string
  accepted_verifier_commit: string
  version_contract_sha256: string
  display_episode_contract?: 'single-item-history-display-episode/2'
  display_episode_policy_sha256?: string
  display_episode_lineage_sha256?: string
  scope: 'HISTORICAL_ANOMALY_CYCLES'
  source_event_count: number
  public_event_count: number
  manipulation_labels_enabled: false
}>

export type ItemHistoryRepresentativeNative = Readonly<{
  item_id: number
  family_event_id: string
  family_cycle_ordinal: number
  timing_relationship: ItemHistoryTimingRelationship
  supply_onset: string
  price_onset: string
  pairing_detected_on: string
  statistics_from: string
  statistics_through: string
  peak_on: string
}>

export type ItemHistoryMember = Readonly<{
  history_event_token: string
  catalog_snapshot_id: string
  catalog: Readonly<WireCatalogDisplayProjection>
  product_pool: ItemHistoryProductPool
  family_cycle_ordinal: number
  timing_relationship: ItemHistoryTimingRelationship
  knowledge_mode: 'RETROSPECTIVE_LATE_BOUND'
  supply_onset: string
  price_onset: string
  pairing_detected_on: string
  observed_through: string
  statistics_from: string
  statistics_through: string
  peak_on: string
  baseline_ask_usd: string
  peak_ask_usd: string
  maximum_price_multiple: string
  baseline_supply: string
  minimum_supply: number
  remaining_supply_ratio: string
  supply_contraction_ratio: string
  supply_measurement_confidence: ItemHistorySupplyConfidence
  related_variant_count: number
  display_episode_timeline_scope?: 'DISPLAY_EPISODE_GROUP'
  display_episode_source_cycle_count?: number
  group_timeline_includes_other_variants?: boolean
  representative_native?: ItemHistoryRepresentativeNative
  event_end_is_economic_claim: false
  manipulation_label: null
}>

export type ItemHistorySuccess = Readonly<{
  contract_name: 'single-item-history-public-api'
  contract_version: '1'
  response_kind: 'RESULT'
  operation: 'LIST' | 'DETAIL'
  publication: ItemHistoryPublication
  snapshot: ItemHistorySnapshot
  release: ItemHistoryRelease
  sort: ItemHistorySort
  page_size: number
  members: readonly ItemHistoryMember[]
  next_cursor: string | null
}>

export type ItemHistoryError = Readonly<{
  contract_name: 'single-item-history-public-api'
  contract_version: '1'
  response_kind: 'ERROR'
  error: Readonly<{ code: ItemHistoryErrorCode; retryable: boolean }>
}>

export type ItemHistoryDocument = ItemHistorySuccess | ItemHistoryError
export type ItemHistoryListQuery = Readonly<{
  publication_id: string | null
  page_size: number
  cursor: string | null
  sort: ItemHistorySort
  name_query: string | null
}>
export type ItemHistoryDetailQuery = Readonly<{
  publication_id: string
  history_event_token: string
}>
