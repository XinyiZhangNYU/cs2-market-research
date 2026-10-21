import type { ErrorObject } from 'ajv/dist/2020'
import { FX_REFERENCE_API_SCHEMA_ID } from './fxReferenceApiSchema'
import { validateFxReferenceApiResponse } from './generated/fxReferenceApiValidator.js'
import type {
  ValidatedFxReferenceApiResponse,
  WireFxReferenceApiResponse,
  WireFxReferenceErrorResponse,
} from './fxReferenceApiTypes'

export { validateFxReferenceApiResponse }

export class FxReferenceWireViolation extends Error {
  constructor(readonly errors: readonly ErrorObject[]) {
    super(
      `FX reference response rejected by ${FX_REFERENCE_API_SCHEMA_ID}: ` +
        errors.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; '),
    )
    this.name = 'FxReferenceWireViolation'
  }
}

export type FxReferenceSemanticRule =
  | 'CANONICAL_TIME'
  | 'REFERENCE_TIME_ORDER'
  | 'CARRY_ACCOUNTING'
  | 'ERROR_SHAPE'

export class FxReferenceSemanticViolation extends Error {
  constructor(readonly rule: FxReferenceSemanticRule, message: string) {
    super(message)
    this.name = 'FxReferenceSemanticViolation'
  }
}

function fail(rule: FxReferenceSemanticRule, message: string): never {
  throw new FxReferenceSemanticViolation(rule, message)
}

function isCanonicalUtcInstant(value: string): boolean {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{6})Z$/u.exec(
    value,
  )
  if (!match) return false
  const [year, month, day, hour, minute, second, microsecond] = match
    .slice(1)
    .map(Number)
  if (
    year < 1 || month < 1 || month > 12 || day < 1 || hour > 23 ||
    minute > 59 || second > 59 || microsecond > 999_999
  ) return false
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function dateDay(value: string): number {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/u.exec(value)
  if (!match) return Number.NaN
  const [year, month, day] = match.slice(1).map(Number)
  const instant = Date.UTC(year, month - 1, day)
  const roundTrip = new Date(instant).toISOString().slice(0, 10)
  return roundTrip === value ? instant / 86_400_000 : Number.NaN
}

const ERROR_SHAPES = {
  INVALID_ARGUMENT: { http_status: 400, retryable: false },
  NO_CURRENT_REFERENCE: { http_status: 503, retryable: true },
  RECORD_CORRUPT: { http_status: 503, retryable: false },
  BACKEND_UNAVAILABLE: { http_status: 503, retryable: true },
} as const

function verifyError(response: WireFxReferenceErrorResponse): void {
  const expected = ERROR_SHAPES[response.error.code]
  if (
    response.error.http_status !== expected.http_status ||
    response.error.retryable !== expected.retryable
  ) fail('ERROR_SHAPE', 'FX reference error status or retryability is inconsistent')
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  Object.freeze(value)
  for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry)
}

const SEALED = new WeakMap<object, 'FX_REFERENCE_CURRENT' | 'ERROR'>()

function seal(response: WireFxReferenceApiResponse): ValidatedFxReferenceApiResponse {
  deepFreeze(response)
  SEALED.set(response, response.response_kind)
  return response as ValidatedFxReferenceApiResponse
}

export function isValidatedFxReferenceApiResponse(
  value: unknown,
  kind?: 'FX_REFERENCE_CURRENT' | 'ERROR',
): value is ValidatedFxReferenceApiResponse {
  if (value === null || typeof value !== 'object') return false
  const actual = SEALED.get(value)
  return actual !== undefined && (kind === undefined || actual === kind)
}

export function decodeFxReferenceApiResponse(
  payload: unknown,
): ValidatedFxReferenceApiResponse {
  if (!validateFxReferenceApiResponse(payload)) {
    throw new FxReferenceWireViolation(validateFxReferenceApiResponse.errors ?? [])
  }
  const response = structuredClone(payload) as WireFxReferenceApiResponse
  if (response.response_kind === 'ERROR') {
    verifyError(response)
    return seal(response)
  }
  const instants = [
    response.query.known_at,
    response.reference.available_at,
    response.reference.cny_valid_from,
    response.reference.usd_valid_from,
  ]
  if (!instants.every(isCanonicalUtcInstant)) {
    fail('CANONICAL_TIME', 'FX reference requires real canonical UTC instants')
  }
  const knownAt = Date.parse(response.query.known_at)
  const availableAt = Date.parse(response.reference.available_at)
  const cnyValidFrom = Date.parse(response.reference.cny_valid_from)
  const usdValidFrom = Date.parse(response.reference.usd_valid_from)
  if (
    availableAt > knownAt || cnyValidFrom > availableAt || usdValidFrom > availableAt
  ) fail('REFERENCE_TIME_ORDER', 'FX reference uses a future or unavailable leg')
  const sourceDay = dateDay(response.reference.source_event_date)
  const knownDay = Date.UTC(
    new Date(knownAt).getUTCFullYear(),
    new Date(knownAt).getUTCMonth(),
    new Date(knownAt).getUTCDate(),
  ) / 86_400_000
  if (!Number.isFinite(sourceDay) || knownDay - sourceDay !== response.reference.carry_days) {
    fail('CARRY_ACCOUNTING', 'FX source date does not match the declared carry days')
  }
  return seal(response)
}
