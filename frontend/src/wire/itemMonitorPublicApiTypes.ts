import type { WireCatalogDisplayProjection } from './catalogDisplayApiTypes'

export type ItemMonitorErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_PUBLISHED'
  | 'NOT_FOUND'
  | 'WITHDRAWN'
  | 'STALE_EXPIRED'
  | 'CORRUPT_PUBLICATION'
  | 'TEMPORARILY_UNAVAILABLE'

export type ItemMonitorFreshnessStatus = 'UNAVAILABLE' | 'CURRENT' | 'STALE_RETAINED'
export type ItemMonitorEmptyReason = null | 'NO_QUALIFIED_OBSERVATION' | 'NO_ELIGIBLE_CANDIDATES'
export type ItemMonitorSignalFamily = 'SUPPLY_LEAD' | 'RECENT_PERSISTENT' | 'COINCIDENT'
export type ItemMonitorEntryKind = 'FIRST_ENTRY' | 'REENTRY'
export type ItemMonitorTriggerReason = ItemMonitorSignalFamily | ItemMonitorEntryKind

export type ItemMonitorPublication = Readonly<{
  publication_id: string
  parent_publication_id: string | null
  manifest_sha256: string
  rights_revision: string
  published_at: string
  withdrawn_at: null
  clock_disclosure?: ItemMonitorPublicationClockDisclosure | null
}>

export type ItemMonitorPublicationClockDisclosure = Readonly<{
  status: 'PREPARED_CLOCK_NOT_ACTUAL'
  published_at_kind: 'PREPARED_VALUE'
  actual_public_available_at: null
  known_not_before_at: string
  recorded_at: string
  reason: 'INITIAL_ACTIVE_APPLY_CLOCK_NOT_OBSERVED'
}>

export type ItemMonitorSnapshot = Readonly<{
  catalog_snapshot_id: string
  membership_version: string
  input_sha256: string
  start_date: string | null
  end_date: string | null
  source_export_as_of: string
  imported_at: string
}>

export type ItemMonitorRelease = Readonly<{
  release_id: string
  cohort_id: string
  algorithm_version: string
  parameter_set_version: string
  coverage_policy_version: string
  data_quality_version: string
  full_member_count: number
  source_candidate_count: number
  pre_release_candidate_count: number
  public_member_count: number
}>

export type ItemMonitorFreshness = Readonly<{
  evaluated_at: string
  expected_latest_complete_date: string
  lag_complete_days: number | null
  status: ItemMonitorFreshnessStatus
  headline_data_date: string | null
}>

export type ItemMonitorSignalEvent = Readonly<{
  signal_family: ItemMonitorSignalFamily
  entry_kind: ItemMonitorEntryKind
  known_at: string
  trigger_reasons: readonly [ItemMonitorTriggerReason, ItemMonitorTriggerReason]
}>

export type ItemMonitorMember = Readonly<{
  release_maturity: 'EXPERIMENTAL'
  efficacy_status: 'UNVALIDATED'
  false_positives_possible: true
  analysis_unit_token: string
  catalog_snapshot_id: string
  catalog: Readonly<WireCatalogDisplayProjection>
  signal_observed_at: string
  earlier_signal_event_count: number
  signal_events: readonly ItemMonitorSignalEvent[]
  coverage: Readonly<{
    expected_slots: 288
    qualified_paired_slots: number
    longest_missing_run: number
  }>
  data_quality: 'QUALIFIED_EXPERIMENTAL_INPUT'
}>

export type ItemMonitorSuccess = Readonly<{
  contract_name: 'single-item-monitor-public-api'
  contract_version: '1'
  response_kind: 'RESULT' | 'EMPTY'
  operation: 'LIST' | 'DETAIL'
  release_maturity: 'EXPERIMENTAL'
  efficacy_status: 'UNVALIDATED'
  false_positives_possible: true
  publication: ItemMonitorPublication
  snapshot: ItemMonitorSnapshot
  release: ItemMonitorRelease
  freshness: ItemMonitorFreshness
  empty_reason: ItemMonitorEmptyReason
  sort: 'SIGNAL_TIME_DESC'
  page_size: number
  members: readonly ItemMonitorMember[]
  next_cursor: string | null
}>

export type ItemMonitorError = Readonly<{
  contract_name: 'single-item-monitor-public-api'
  contract_version: '1'
  response_kind: 'ERROR'
  error: Readonly<{ code: ItemMonitorErrorCode; retryable: boolean }>
}>

export type ItemMonitorDocument = ItemMonitorSuccess | ItemMonitorError
export type ItemMonitorListQuery = Readonly<{
  publication_id: string | null
  page_size: number
  cursor: string | null
  sort: 'SIGNAL_TIME_DESC'
}>
export type ItemMonitorDetailQuery = Readonly<{
  publication_id: string
  analysis_unit_token: string
}>
