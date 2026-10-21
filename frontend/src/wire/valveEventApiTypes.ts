import type { DeepReadonly } from './validated'

export type WireValveEventSource = {
  event_id: string
  first_observed_at: string
  official_published_at: string
  official_title: string
  official_url: string | null
  source_code: 'STEAM_ISteamNews_V2'
  source_notice_version_id: string
  source_updated_at: string | null
}

export type WireValveEventFlags = {
  corrected: boolean
  source_updated: boolean
  withdrawn: boolean
}

export type WireValveEventSummary = {
  conclusion_summary:
    | string
    | Readonly<{ zh_cn: string; en: string }>
    | null
  flags: WireValveEventFlags
  outcome_label: string | null
  primary_direction: string | null
  scope_labels: readonly string[]
  source: WireValveEventSource
  status: string
  temporal_mode: string | null
}

export type WireValveEventArticle =
  | {
      conclusion: string
      factual_summary: string
      observation_and_falsification: string
      scope_analysis: string
      title: string
      transmission_mechanisms: string
      uncertainties_and_counterforces: string
    }
  | {
      zh_cn: Readonly<{ title: string; body: string }>
      en: Readonly<{ title: string; body: string }>
    }

export type WireValveEventClaim = {
  claim_id: string
  direction: string
  falsification_conditions: readonly string[]
  horizon: string
  limitations: readonly string[]
  mechanism_codes: readonly string[]
  observation_targets: readonly string[]
  reasoning_section_ref: string
  scope_display: string
  scope_kind: string
  scope_ref: string | null
  tracking_status: string
}

export type WireValveEventAssessment = {
  article: WireValveEventArticle
  claims: readonly WireValveEventClaim[]
  context_snapshot_id: string
  context_status: string
  correction_of_publication_id: string | null
  disclosures: readonly string[]
  event_cutoff_at: string
  known_at: string
  public_payload_sha256: string
  publication_id: string
  publication_version_no: number
  published_at: string
  source_notice_version_id: string
  temporal_mode: string
}

export type WireValveEventOutcome = {
  evidence_status: string
  explanation: string
  label: string
  noise_and_causality_disclosure: string
  observation_cutoff_at: string
  outcome_evaluation_id: string
  outcome_publication_id: string
  policy_release_id: string
  published_at: string
}

export type WireValveEventPublicVersion = {
  publication_id: string
  publication_version_no: number
  published_at: string
  temporal_mode: string
  withdrawal_reason: string | null
  withdrawn: boolean
}

export type WireValveEventResource = {
  flags: WireValveEventFlags
  latest_outcome: WireValveEventOutcome | null
  latest_publication: WireValveEventAssessment | null
  public_versions: readonly WireValveEventPublicVersion[]
  source: WireValveEventSource
  status: string
}

export type WireValveEventListResponse = {
  api_contract: 'valve-event-public-api'
  api_version: 'v1'
  events: readonly WireValveEventSummary[]
  next_cursor: string | null
  query_hash: string
  response_kind: 'VALVE_EVENT_LIST'
}

export type WireValveEventDetailResponse = {
  api_contract: 'valve-event-public-api'
  api_version: 'v1'
  etag: string
  event: WireValveEventResource
  response_kind: 'VALVE_EVENT_DETAIL'
}

export type WireValveEventResponse =
  | WireValveEventListResponse
  | WireValveEventDetailResponse

declare const VALIDATED_VALVE_EVENT_RESPONSE: unique symbol

export type ValidatedValveEventResponse = DeepReadonly<WireValveEventResponse> & {
  readonly [VALIDATED_VALVE_EVENT_RESPONSE]: WireValveEventResponse['response_kind']
}
