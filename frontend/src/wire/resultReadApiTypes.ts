import type {
  WireCollectionResult,
  WireQualityResult,
  WireUnitResult,
} from './types'
import type {
  DeepReadonly,
  ValidatedCollectionResult,
  ValidatedQualityResult,
  ValidatedUnitResult,
} from './validated'

export type ResultReadResponseKind =
  | 'UNIT_DETAIL'
  | 'UNIT_LIST'
  | 'COLLECTION_DETAIL'
  | 'QUALITY_DETAIL'
  | 'QUALITY_LIST'
  | 'ERROR'

export type WireResultStorage = {
  published_at: string
  document_hash: string
}

export type WireResultResource<Envelope> = {
  envelope: Envelope
  storage: WireResultStorage
}

export type WireResultListQuery = {
  as_of: string
  scope_kind: 'MARKET' | 'SECTOR' | 'ITEM' | null
  analysis_unit_kind: 'BASE_MHN' | 'STYLE_VARIANT' | 'PATTERN_VARIANT' | null
  edition_kind: 'STANDARD' | 'STATTRAK' | 'SOUVENIR' | 'UNKNOWN' | null
  parent_analysis_unit_id: string | null
  data_status:
    | 'COMPLETE'
    | 'UNAVAILABLE_BY_DESIGN'
    | 'DEGRADED_OPTIONAL'
    | 'DATA_UNAVAILABLE_RUNTIME_GRACE'
    | 'STALE_GRACE'
    | 'DATA_UNAVAILABLE_RUNTIME'
    | 'STALE'
    | 'CONFLICTED'
    | null
  sort: 'ANALYSIS_UNIT_ID_ASC'
  page_size: number
}

export type WireQualityResultListQuery = {
  as_of: string
  analysis_unit_kind: 'BASE_MHN' | 'STYLE_VARIANT' | 'PATTERN_VARIANT' | null
  edition_kind: 'STANDARD' | 'STATTRAK' | 'SOUVENIR' | 'UNKNOWN' | null
  parent_analysis_unit_id: string | null
  sort: 'ANALYSIS_UNIT_ID_ASC'
  page_size: number
}

type ApiBase<Kind extends ResultReadResponseKind> = {
  api_contract: 'result-read-api'
  api_version: 'v1'
  response_kind: Kind
}

export type WireUnitDetailResponse = ApiBase<'UNIT_DETAIL'> & {
  query_as_of: string
  resource: WireResultResource<WireUnitResult>
}

export type WireCollectionDetailResponse = ApiBase<'COLLECTION_DETAIL'> & {
  query_as_of: string
  resource: WireResultResource<WireCollectionResult>
}

export type WireQualityDetailResponse = ApiBase<'QUALITY_DETAIL'> & {
  query_as_of: string
  resource: WireResultResource<WireQualityResult>
}

export type WireUnitListResponse = ApiBase<'UNIT_LIST'> & {
  query: WireResultListQuery
  members: readonly WireResultResource<WireUnitResult>[]
  next_cursor: string | null
}

export type WireQualityListResponse = ApiBase<'QUALITY_LIST'> & {
  query: WireQualityResultListQuery
  members: readonly WireResultResource<WireQualityResult>[]
  next_cursor: string | null
}

export type ResultReadErrorCode =
  | 'INVALID_ARGUMENT'
  | 'INVALID_CURSOR'
  | 'NOT_FOUND'
  | 'CONTRACT_UNAVAILABLE'
  | 'RESULT_CORRUPT'
  | 'BACKEND_UNAVAILABLE'

export type WireResultReadError = ApiBase<'ERROR'> & {
  error: {
    code: ResultReadErrorCode
    http_status: 400 | 404 | 503
    retryable: boolean
  }
}

export type WireResultReadResponse =
  | WireUnitDetailResponse
  | WireUnitListResponse
  | WireCollectionDetailResponse
  | WireQualityDetailResponse
  | WireQualityListResponse
  | WireResultReadError

export type DecodedUnitDetailResponse = Omit<WireUnitDetailResponse, 'resource'> & {
  resource: WireResultResource<ValidatedUnitResult>
}

export type DecodedCollectionDetailResponse = Omit<
  WireCollectionDetailResponse,
  'resource'
> & {
  resource: WireResultResource<ValidatedCollectionResult>
}

export type DecodedQualityDetailResponse = Omit<WireQualityDetailResponse, 'resource'> & {
  resource: WireResultResource<ValidatedQualityResult>
}

export type DecodedUnitListResponse = Omit<WireUnitListResponse, 'members'> & {
  members: readonly WireResultResource<ValidatedUnitResult>[]
}

export type DecodedQualityListResponse = Omit<WireQualityListResponse, 'members'> & {
  members: readonly WireResultResource<ValidatedQualityResult>[]
}

export type DecodedResultReadResponse =
  | DecodedUnitDetailResponse
  | DecodedUnitListResponse
  | DecodedCollectionDetailResponse
  | DecodedQualityDetailResponse
  | DecodedQualityListResponse
  | WireResultReadError

declare const VALIDATED_RESULT_READ_API: unique symbol

export type ValidatedResultReadResponse = DeepReadonly<DecodedResultReadResponse> & {
  readonly [VALIDATED_RESULT_READ_API]: ResultReadResponseKind
}
