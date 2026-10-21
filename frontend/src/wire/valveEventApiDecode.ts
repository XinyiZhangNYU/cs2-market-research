import type { ErrorObject } from 'ajv/dist/2020'
import { canonicalHash, compareCodePoints } from './canonical'
import { validateValveEventApiResponse } from './generated/valveEventApiValidator.js'
import {
  VALVE_EVENT_API_SCHEMA_ID,
} from './valveEventApiSchema'
import type {
  ValidatedValveEventResponse,
  WireValveEventAssessment,
  WireValveEventResponse,
} from './valveEventApiTypes'

export { validateValveEventApiResponse }

export class ValveEventWireViolation extends Error {
  readonly errors: readonly ErrorObject[]

  constructor(errors: readonly ErrorObject[]) {
    super(
      `Valve event response rejected by ${VALVE_EVENT_API_SCHEMA_ID}: ` +
        errors.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; '),
    )
    this.name = 'ValveEventWireViolation'
    this.errors = errors
  }
}

export type ValveEventSemanticRule =
  | 'PRIVATE_FIELD'
  | 'PUBLIC_PAYLOAD_HASH'
  | 'PUBLIC_TIME_ORDER'
  | 'PUBLIC_LIST_ORDER'
  | 'PUBLIC_LIFECYCLE'

export class ValveEventSemanticViolation extends Error {
  readonly rule: ValveEventSemanticRule

  constructor(rule: ValveEventSemanticRule, message: string) {
    super(message)
    this.name = 'ValveEventSemanticViolation'
    this.rule = rule
  }
}

const FORBIDDEN_KEYS = new Set([
  'candidate',
  'candidate_id',
  'candidate_payload',
  'confidence',
  'confidence_score',
  'database_dsn',
  'model_prompt',
  'normalized_body_text',
  'probability',
  'prompt',
  'raw_response',
  'raw_response_sha256',
  'recommendation_detail',
  'risk_score',
  'source_extra',
])

function rejectPrivateKeys(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(rejectPrivateKeys)
    return
  }
  if (value === null || typeof value !== 'object') return
  for (const [key, member] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new ValveEventSemanticViolation(
        'PRIVATE_FIELD',
        `private field is forbidden in the public Valve event response: ${key}`,
      )
    }
    rejectPrivateKeys(member)
  }
}

function withoutPayloadHash(
  assessment: WireValveEventAssessment,
): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(assessment)) {
    if (key !== 'public_payload_sha256') body[key] = value
  }
  return body
}

function checkAssessment(assessment: WireValveEventAssessment): void {
  if (canonicalHash(withoutPayloadHash(assessment)) !== assessment.public_payload_sha256) {
    throw new ValveEventSemanticViolation(
      'PUBLIC_PAYLOAD_HASH',
      'public assessment hash does not match its canonical allowlist payload',
    )
  }
  if (
    assessment.event_cutoff_at > assessment.known_at ||
    assessment.known_at > assessment.published_at
  ) {
    throw new ValveEventSemanticViolation(
      'PUBLIC_TIME_ORDER',
      'public assessment times are not in cutoff/known/published order',
    )
  }
  if (!assessment.claims.some((claim) => claim.scope_kind === 'MARKET')) {
    throw new ValveEventSemanticViolation(
      'PUBLIC_LIFECYCLE',
      'a public assessment must retain a MARKET claim',
    )
  }
}

function checkSourceTimes(source: { official_published_at: string; first_observed_at: string }) {
  if (source.official_published_at > source.first_observed_at) {
    throw new ValveEventSemanticViolation(
      'PUBLIC_TIME_ORDER',
      'source first_observed_at predates official_published_at',
    )
  }
}

function checkSemantics(response: WireValveEventResponse): void {
  rejectPrivateKeys(response)
  if (response.response_kind === 'VALVE_EVENT_LIST') {
    const keys = response.events.map(
      (event) => `${event.source.official_published_at}\u0000${event.source.event_id}`,
    )
    if (new Set(keys).size !== keys.length) {
      throw new ValveEventSemanticViolation(
        'PUBLIC_LIST_ORDER',
        'public event list contains duplicate sort identities',
      )
    }
    for (let index = 1; index < response.events.length; index += 1) {
      const previous = response.events[index - 1].source
      const current = response.events[index].source
      const ordered =
        previous.official_published_at > current.official_published_at ||
        (previous.official_published_at === current.official_published_at &&
          compareCodePoints(previous.event_id, current.event_id) > 0)
      if (!ordered) {
        throw new ValveEventSemanticViolation(
          'PUBLIC_LIST_ORDER',
          'public event list is not in official_published_at/event_id descending order',
        )
      }
    }
    response.events.forEach((event) => {
      checkSourceTimes(event.source)
      if ((event.status === 'WITHDRAWN') !== event.flags.withdrawn) {
        throw new ValveEventSemanticViolation(
          'PUBLIC_LIFECYCLE',
          'WITHDRAWN summary status and flag must agree',
        )
      }
      if (
        event.status === 'SOURCE_ONLY' &&
        (event.conclusion_summary !== null ||
          event.primary_direction !== null ||
          event.temporal_mode !== null)
      ) {
        throw new ValveEventSemanticViolation(
          'PUBLIC_LIFECYCLE',
          'SOURCE_ONLY summary cannot contain an analysis projection',
        )
      }
    })
    return
  }

  const resource = response.event
  checkSourceTimes(resource.source)
  if ((resource.status === 'WITHDRAWN') !== resource.flags.withdrawn) {
    throw new ValveEventSemanticViolation(
      'PUBLIC_LIFECYCLE',
      'WITHDRAWN detail status and flag must agree',
    )
  }
  const versionNumbers = resource.public_versions.map(
    (version) => version.publication_version_no,
  )
  if (
    new Set(versionNumbers).size !== versionNumbers.length ||
    versionNumbers.some((value, index) => index > 0 && versionNumbers[index - 1] >= value) ||
    resource.public_versions.some(
      (version) =>
        version.withdrawn !== (version.withdrawal_reason !== null) ||
        (version.withdrawal_reason !== null && !version.withdrawal_reason.trim()),
    )
  ) {
    throw new ValveEventSemanticViolation(
      'PUBLIC_LIFECYCLE',
      'public version history must be unique, ascending, and have consistent withdrawal metadata',
    )
  }
  if (
    resource.status === 'WITHDRAWN' &&
    !resource.public_versions.at(-1)?.withdrawn
  ) {
    throw new ValveEventSemanticViolation(
      'PUBLIC_LIFECYCLE',
      'WITHDRAWN status requires the newest public version to be withdrawn',
    )
  }
  if (resource.latest_publication === null) {
    const allPublicVersionsWithdrawn =
      resource.public_versions.length > 0 &&
      resource.public_versions.every((version) => version.withdrawn)
    if (
      resource.latest_outcome !== null ||
      (resource.status === 'WITHDRAWN' && !allPublicVersionsWithdrawn) ||
      (resource.public_versions.length > 0 &&
        (resource.status !== 'WITHDRAWN' || !allPublicVersionsWithdrawn))
    ) {
      throw new ValveEventSemanticViolation(
        'PUBLIC_LIFECYCLE',
        'detail without an active publication may contain only withdrawn public history',
      )
    }
    return
  }
  checkAssessment(resource.latest_publication)
  if (response.etag !== resource.latest_publication.public_payload_sha256) {
    throw new ValveEventSemanticViolation(
      'PUBLIC_PAYLOAD_HASH',
      'detail ETag does not match the latest public payload hash',
    )
  }
  const activeIndex = resource.public_versions.findIndex(
    (version) =>
      version.publication_id === resource.latest_publication?.publication_id &&
      version.publication_version_no ===
        resource.latest_publication?.publication_version_no,
  )
  if (
    activeIndex < 0 ||
    resource.public_versions[activeIndex].withdrawn ||
    resource.public_versions.slice(activeIndex + 1).some((version) => !version.withdrawn)
  ) {
    throw new ValveEventSemanticViolation(
      'PUBLIC_LIFECYCLE',
      'latest publication must be the newest non-withdrawn public version',
    )
  }
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  Object.freeze(value)
  for (const member of Object.values(value as Record<string, unknown>)) deepFreeze(member)
}

const SEALED = new WeakMap<object, WireValveEventResponse['response_kind']>()

export function isValidatedValveEventResponse(
  value: unknown,
  kind?: WireValveEventResponse['response_kind'],
): value is ValidatedValveEventResponse {
  if (value === null || typeof value !== 'object') return false
  const actual = SEALED.get(value)
  return actual !== undefined && (kind === undefined || actual === kind)
}

export function decodeValveEventApiResponse(
  payload: unknown,
): ValidatedValveEventResponse {
  if (!validateValveEventApiResponse(payload)) {
    throw new ValveEventWireViolation(validateValveEventApiResponse.errors ?? [])
  }
  const copy = structuredClone(payload) as WireValveEventResponse
  checkSemantics(copy)
  deepFreeze(copy)
  SEALED.set(copy, copy.response_kind)
  return copy as ValidatedValveEventResponse
}
