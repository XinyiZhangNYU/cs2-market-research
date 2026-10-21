import type { DeepReadonly } from './validated'

export type WireCatalogDisplaySnapshotQuery = {
  known_at: string
  page_size: number
  query_as_of: string
  sort: 'AS_OF_DESC'
}

export type WireCatalogDisplaySnapshotDescriptor = {
  snapshot_id: string
  catalog_version: string
  as_of: string
  available_at: string
  member_count: number
  member_set_hash: string
}

export type WireCatalogDisplaySnapshotListResponse = {
  api_contract: 'catalog-display-snapshot-api'
  api_version: 'v1'
  response_kind: 'CATALOG_DISPLAY_SNAPSHOT_LIST'
  query: WireCatalogDisplaySnapshotQuery
  members: readonly WireCatalogDisplaySnapshotDescriptor[]
  next_cursor: string | null
}

export type CatalogDisplaySnapshotErrorCode =
  | 'INVALID_ARGUMENT'
  | 'INVALID_CURSOR'
  | 'CONTRACT_UNAVAILABLE'
  | 'RECORD_CORRUPT'
  | 'BACKEND_UNAVAILABLE'

export type WireCatalogDisplaySnapshotError = {
  api_contract: 'catalog-display-snapshot-api'
  api_version: 'v1'
  response_kind: 'ERROR'
  error: {
    code: CatalogDisplaySnapshotErrorCode
    http_status: 400 | 503
    retryable: boolean
  }
}

export type WireCatalogDisplaySnapshotResponse =
  | WireCatalogDisplaySnapshotListResponse
  | WireCatalogDisplaySnapshotError

declare const VALIDATED_CATALOG_DISPLAY_SNAPSHOT_API: unique symbol

export type ValidatedCatalogDisplaySnapshotResponse =
  DeepReadonly<WireCatalogDisplaySnapshotResponse> & {
    readonly [VALIDATED_CATALOG_DISPLAY_SNAPSHOT_API]:
      | 'CATALOG_DISPLAY_SNAPSHOT_LIST'
      | 'ERROR'
  }
