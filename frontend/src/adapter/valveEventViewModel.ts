import { isValidatedValveEventResponse } from '../wire/valveEventApiDecode'
import type {
  ValidatedValveEventResponse,
  WireValveEventAssessment,
  WireValveEventClaim,
  WireValveEventDetailResponse,
  WireValveEventListResponse,
  WireValveEventSource,
} from '../wire/valveEventApiTypes'

export type KnownCode<Known extends string> = Readonly<{
  code: Known | 'UNKNOWN'
  source: string
  known: boolean
}>

export const EVENT_STATUSES = [
  'SOURCE_ONLY',
  'ANALYSIS_PENDING',
  'ANALYSIS_BLOCKED',
  'PUBLIC',
  'SOURCE_UPDATED_ANALYSIS_PENDING',
  'CORRECTED',
  'WITHDRAWN',
] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export const TEMPORAL_MODES = [
  'PROSPECTIVE',
  'RETROSPECTIVE_REPLAY',
  'RETROSPECTIVE_WITH_HINDSIGHT',
  'RETROSPECTIVE_CORRECTION',
] as const
export type EventTemporalMode = (typeof TEMPORAL_MODES)[number]

export const IMPACT_DIRECTIONS = [
  'POSITIVE',
  'NEGATIVE',
  'MIXED',
  'NO_CLEAR_IMPACT',
  'UNCERTAIN',
] as const
export type EventImpactDirection = (typeof IMPACT_DIRECTIONS)[number]

export const OUTCOME_LABELS = [
  'SUPPORTED',
  'MIXED',
  'NOT_SUPPORTED',
  'UNAVAILABLE',
] as const
export type EventOutcomeLabel = (typeof OUTCOME_LABELS)[number]

export const TRACKING_STATUSES = [
  'TRACKED',
  'UNTRACKED_SUBJECT',
  'UNRESOLVED',
] as const
export type EventTrackingStatus = (typeof TRACKING_STATUSES)[number]

export const IMPACT_HORIZONS = [
  'IMMEDIATE',
  'SHORT_TERM',
  'STRUCTURAL',
  'UNSPECIFIED',
] as const
export type EventImpactHorizon = (typeof IMPACT_HORIZONS)[number]

function known<Known extends string>(
  value: string,
  vocabulary: readonly Known[],
): KnownCode<Known> {
  return Object.freeze({
    code: vocabulary.includes(value as Known) ? (value as Known) : 'UNKNOWN',
    source: value,
    known: vocabulary.includes(value as Known),
  })
}

function nullableKnown<Known extends string>(
  value: string | null,
  vocabulary: readonly Known[],
): KnownCode<Known> | null {
  return value === null ? null : known(value, vocabulary)
}

function passiveOfficialUrl(value: string | null): string | null {
  if (value === null) return null
  try {
    const parsed = new URL(value)
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    ) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

export type ValveEventSourceView = Readonly<{
  eventId: string
  officialTitle: string
  officialUrl: string | null
  officialPublishedAt: string
  firstObservedAt: string
  sourceUpdatedAt: string | null
  sourceCode: string
}>

export type ValveEventSummaryView = Readonly<{
  source: ValveEventSourceView
  status: KnownCode<EventStatus>
  conclusion: Readonly<{ zh: string; en: string }> | null
  direction: KnownCode<EventImpactDirection> | null
  temporalMode: KnownCode<EventTemporalMode> | null
  outcome: KnownCode<EventOutcomeLabel> | null
  scopeLabels: readonly string[]
  flags: Readonly<{ corrected: boolean; sourceUpdated: boolean; withdrawn: boolean }>
}>

export type ValveEventListView = Readonly<{
  events: readonly ValveEventSummaryView[]
  nextCursor: string | null
  queryHash: string
  channel: ValveEventReadChannel
}>

export type ValveEventReadChannel = 'FORMAL_FIXTURE' | 'READ_ONLY_HTTP'

export type ValveEventClaimView = Readonly<{
  claimId: string
  scopeDisplay: string
  scopeKind: string
  scopeRef: string | null
  trackingStatus: KnownCode<EventTrackingStatus>
  direction: KnownCode<EventImpactDirection>
  horizon: KnownCode<EventImpactHorizon>
  mechanismCodes: readonly string[]
  observationTargets: readonly string[]
  falsificationConditions: readonly string[]
  limitations: readonly string[]
}>

export type ValveEventAssessmentView = Readonly<{
  publicationId: string
  publicationVersion: number
  temporalMode: KnownCode<EventTemporalMode>
  eventCutoffAt: string
  publishedAt: string
  contextStatus: string
  correctedFrom: string | null
  article:
    | Readonly<{
        kind: 'SECTIONED_V1'
        title: string
        factualSummary: string
        transmissionMechanisms: string
        scopeAnalysis: string
        uncertaintiesAndCounterforces: string
        observationAndFalsification: string
        conclusion: string
      }>
    | Readonly<{
        kind: 'BILINGUAL_READER_V3'
        zh: Readonly<{ title: string; body: string }>
        en: Readonly<{ title: string; body: string }>
      }>
  claims: readonly ValveEventClaimView[]
  disclosures: readonly string[]
}>

export type ValveEventDetailView = Readonly<{
  source: ValveEventSourceView
  status: KnownCode<EventStatus>
  flags: Readonly<{ corrected: boolean; sourceUpdated: boolean; withdrawn: boolean }>
  assessment: ValveEventAssessmentView | null
  outcome: Readonly<{
    label: KnownCode<EventOutcomeLabel>
    explanation: string
    observationCutoffAt: string
    evidenceStatus: string
    causalityDisclosure: string
    publishedAt: string
  }> | null
  publicVersions: readonly Readonly<{
    publicationId: string
    version: number
    temporalMode: KnownCode<EventTemporalMode>
    publishedAt: string
    withdrawn: boolean
    withdrawalReason: string | null
  }>[]
  etag: string
  channel: ValveEventReadChannel
}>

function sourceView(source: WireValveEventSource): ValveEventSourceView {
  return {
    eventId: source.event_id,
    officialTitle: source.official_title,
    officialUrl: passiveOfficialUrl(source.official_url),
    officialPublishedAt: source.official_published_at,
    firstObservedAt: source.first_observed_at,
    sourceUpdatedAt: source.source_updated_at,
    sourceCode: source.source_code,
  }
}

function claimView(claim: WireValveEventClaim): ValveEventClaimView {
  return {
    claimId: claim.claim_id,
    scopeDisplay: claim.scope_display,
    scopeKind: claim.scope_kind,
    scopeRef: claim.scope_ref,
    trackingStatus: known(claim.tracking_status, TRACKING_STATUSES),
    direction: known(claim.direction, IMPACT_DIRECTIONS),
    horizon: known(claim.horizon, IMPACT_HORIZONS),
    mechanismCodes: [...claim.mechanism_codes],
    observationTargets: [...claim.observation_targets],
    falsificationConditions: [...claim.falsification_conditions],
    limitations: [...claim.limitations],
  }
}

function articleView(
  article: WireValveEventAssessment['article'],
): ValveEventAssessmentView['article'] {
  if ('zh_cn' in article) {
    return {
      kind: 'BILINGUAL_READER_V3',
      zh: { title: article.zh_cn.title, body: article.zh_cn.body },
      en: { title: article.en.title, body: article.en.body },
    }
  }
  return {
    kind: 'SECTIONED_V1',
    title: article.title,
    factualSummary: article.factual_summary,
    transmissionMechanisms: article.transmission_mechanisms,
    scopeAnalysis: article.scope_analysis,
    uncertaintiesAndCounterforces: article.uncertainties_and_counterforces,
    observationAndFalsification: article.observation_and_falsification,
    conclusion: article.conclusion,
  }
}

function summaryView(
  summary: string | Readonly<{ zh_cn: string; en: string }> | null,
): Readonly<{ zh: string; en: string }> | null {
  if (summary === null) return null
  if (typeof summary === 'string') return { zh: summary, en: summary }
  return { zh: summary.zh_cn, en: summary.en }
}

function assessmentView(
  assessment: WireValveEventAssessment,
): ValveEventAssessmentView {
  return {
    publicationId: assessment.publication_id,
    publicationVersion: assessment.publication_version_no,
    temporalMode: known(assessment.temporal_mode, TEMPORAL_MODES),
    eventCutoffAt: assessment.event_cutoff_at,
    publishedAt: assessment.published_at,
    contextStatus: assessment.context_status,
    correctedFrom: assessment.correction_of_publication_id,
    article: articleView(assessment.article),
    claims: assessment.claims.map(claimView),
    disclosures: [...assessment.disclosures],
  }
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  Object.freeze(value)
  for (const member of Object.values(value as Record<string, unknown>)) deepFreeze(member)
}

const PRESENTABLE = new WeakMap<object, 'LIST' | 'DETAIL'>()

function sealView<T extends object>(value: T, kind: 'LIST' | 'DETAIL'): T {
  deepFreeze(value)
  PRESENTABLE.set(value, kind)
  return value
}

export function isPresentableValveEventView(
  value: unknown,
  kind?: 'LIST' | 'DETAIL',
): boolean {
  if (value === null || typeof value !== 'object') return false
  const actual = PRESENTABLE.get(value)
  return actual !== undefined && (kind === undefined || actual === kind)
}

export function toValveEventListView(
  response: ValidatedValveEventResponse & WireValveEventListResponse,
  channel: ValveEventReadChannel = 'FORMAL_FIXTURE',
): ValveEventListView {
  if (!isValidatedValveEventResponse(response, 'VALVE_EVENT_LIST')) {
    throw new TypeError('Valve event list adapter requires a decoded response')
  }
  return sealView(
    {
      events: response.events.map((event) => ({
        source: sourceView(event.source),
        status: known(event.status, EVENT_STATUSES),
        conclusion: summaryView(event.conclusion_summary),
        direction: nullableKnown(event.primary_direction, IMPACT_DIRECTIONS),
        temporalMode: nullableKnown(event.temporal_mode, TEMPORAL_MODES),
        outcome: nullableKnown(event.outcome_label, OUTCOME_LABELS),
        scopeLabels: [...event.scope_labels],
        flags: {
          corrected: event.flags.corrected,
          sourceUpdated: event.flags.source_updated,
          withdrawn: event.flags.withdrawn,
        },
      })),
      nextCursor: response.next_cursor,
      queryHash: response.query_hash,
      channel,
    },
    'LIST',
  )
}

export function mergeValveEventListViews(
  current: ValveEventListView,
  next: ValveEventListView,
): ValveEventListView {
  if (
    !isPresentableValveEventView(current, 'LIST') ||
    !isPresentableValveEventView(next, 'LIST') ||
    current.nextCursor === null ||
    current.queryHash !== next.queryHash ||
    current.channel !== next.channel
  ) {
    throw new TypeError('Valve event continuation is not bound to the current list')
  }
  const eventIds = new Set(current.events.map((event) => event.source.eventId))
  if (next.events.some((event) => eventIds.has(event.source.eventId))) {
    throw new TypeError('Valve event continuation contains a duplicate event')
  }
  return sealView(
    {
      events: [...current.events, ...next.events],
      nextCursor: next.nextCursor,
      queryHash: current.queryHash,
      channel: current.channel,
    },
    'LIST',
  )
}

export function toValveEventDetailView(
  response: ValidatedValveEventResponse & WireValveEventDetailResponse,
  channel: ValveEventReadChannel = 'FORMAL_FIXTURE',
): ValveEventDetailView {
  if (!isValidatedValveEventResponse(response, 'VALVE_EVENT_DETAIL')) {
    throw new TypeError('Valve event detail adapter requires a decoded response')
  }
  const resource = response.event
  return sealView(
    {
      source: sourceView(resource.source),
      status: known(resource.status, EVENT_STATUSES),
      flags: {
        corrected: resource.flags.corrected,
        sourceUpdated: resource.flags.source_updated,
        withdrawn: resource.flags.withdrawn,
      },
      assessment:
        resource.latest_publication === null
          ? null
          : assessmentView(resource.latest_publication),
      outcome:
        resource.latest_outcome === null
          ? null
          : {
              label: known(resource.latest_outcome.label, OUTCOME_LABELS),
              explanation: resource.latest_outcome.explanation,
              observationCutoffAt:
                resource.latest_outcome.observation_cutoff_at,
              evidenceStatus: resource.latest_outcome.evidence_status,
              causalityDisclosure:
                resource.latest_outcome.noise_and_causality_disclosure,
              publishedAt: resource.latest_outcome.published_at,
            },
      publicVersions: resource.public_versions.map((version) => ({
        publicationId: version.publication_id,
        version: version.publication_version_no,
        temporalMode: known(version.temporal_mode, TEMPORAL_MODES),
        publishedAt: version.published_at,
        withdrawn: version.withdrawn,
        withdrawalReason: version.withdrawal_reason,
      })),
      etag: response.etag,
      channel,
    },
    'DETAIL',
  )
}
