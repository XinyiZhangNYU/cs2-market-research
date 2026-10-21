import type { DeepReadonly } from './validated'

export type WireFxReferenceQuery = {
  known_at: string
}

export type WireFxReference = {
  authority: 'ECB'
  available_at: string
  carry_days: number
  cny_per_usd: string
  cny_valid_from: string
  method: 'ECB_EUR_CROSS'
  source_event_date: string
  usage: 'REFERENCE_RATE_INFORMATIONAL_ONLY'
  usd_valid_from: string
}

export type WireFxReferenceCurrentResponse = {
  api_contract: 'fx-reference-api'
  api_version: 'v1'
  response_kind: 'FX_REFERENCE_CURRENT'
  query: WireFxReferenceQuery
  reference: WireFxReference
}

export type FxReferenceErrorCode =
  | 'INVALID_ARGUMENT'
  | 'NO_CURRENT_REFERENCE'
  | 'RECORD_CORRUPT'
  | 'BACKEND_UNAVAILABLE'

export type WireFxReferenceErrorResponse = {
  api_contract: 'fx-reference-api'
  api_version: 'v1'
  response_kind: 'ERROR'
  error: {
    code: FxReferenceErrorCode
    http_status: 400 | 503
    retryable: boolean
  }
}

export type WireFxReferenceApiResponse =
  | WireFxReferenceCurrentResponse
  | WireFxReferenceErrorResponse

declare const VALIDATED_FX_REFERENCE_API: unique symbol

export type ValidatedFxReferenceApiResponse =
  DeepReadonly<WireFxReferenceApiResponse> & {
    readonly [VALIDATED_FX_REFERENCE_API]: 'FX_REFERENCE_CURRENT' | 'ERROR'
  }
