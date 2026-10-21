import type { ErrorObject } from 'ajv/dist/2020'
import { compareCodePoints } from './canonical'
import {
  CATALOG_DISPLAY_SNAPSHOT_API_SCHEMA_ID,
} from './catalogDisplaySnapshotApiSchema'
import { validateCatalogDisplaySnapshotApiResponse } from './generated/catalogDisplaySnapshotApiValidator.js'
import type {
  ValidatedCatalogDisplaySnapshotResponse,
  WireCatalogDisplaySnapshotDescriptor,
  WireCatalogDisplaySnapshotResponse,
} from './catalogDisplaySnapshotApiTypes'

export { validateCatalogDisplaySnapshotApiResponse }

export class CatalogDisplaySnapshotWireViolation extends Error {
  readonly errors: readonly ErrorObject[]

  constructor(errors: readonly ErrorObject[]) {
    super(
      `catalog display snapshot response rejected by ${CATALOG_DISPLAY_SNAPSHOT_API_SCHEMA_ID}: ` +
        errors.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; '),
    )
    this.name = 'CatalogDisplaySnapshotWireViolation'
    this.errors = errors
  }
}

export const CATALOG_DISPLAY_SNAPSHOT_SEMANTIC_RULES = [
  'SNAPSHOT_QUERY_SHAPE',
  'SNAPSHOT_PAGE_ACCOUNTING',
  'SNAPSHOT_SORT_ORDER',
  'SNAPSHOT_PIT_TIME_ORDER',
  'SNAPSHOT_ERROR_SHAPE',
] as const
export type CatalogDisplaySnapshotSemanticRule =
  (typeof CATALOG_DISPLAY_SNAPSHOT_SEMANTIC_RULES)[number]

export class CatalogDisplaySnapshotSemanticViolation extends Error {
  constructor(
    readonly rule: CatalogDisplaySnapshotSemanticRule,
    message: string,
  ) {
    super(message)
    this.name = 'CatalogDisplaySnapshotSemanticViolation'
  }
}

function fail(rule: CatalogDisplaySnapshotSemanticRule, message: string): never {
  throw new CatalogDisplaySnapshotSemanticViolation(rule, message)
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
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    microsecond > 999_999
  ) {
    return false
  }
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function compareDescriptorKeys(
  left: WireCatalogDisplaySnapshotDescriptor,
  right: WireCatalogDisplaySnapshotDescriptor,
): number {
  if (left.as_of !== right.as_of) return left.as_of > right.as_of ? -1 : 1
  return -compareCodePoints(left.snapshot_id, right.snapshot_id)
}

const ERROR_SHAPES = {
  INVALID_ARGUMENT: { http_status: 400, retryable: false },
  INVALID_CURSOR: { http_status: 400, retryable: false },
  CONTRACT_UNAVAILABLE: { http_status: 503, retryable: true },
  RECORD_CORRUPT: { http_status: 503, retryable: false },
  BACKEND_UNAVAILABLE: { http_status: 503, retryable: true },
} as const

function verifyError(
  response: Extract<WireCatalogDisplaySnapshotResponse, { response_kind: 'ERROR' }>,
): void {
  const expected = ERROR_SHAPES[response.error.code]
  if (
    response.error.http_status !== expected.http_status ||
    response.error.retryable !== expected.retryable
  ) {
    fail(
      'SNAPSHOT_ERROR_SHAPE',
      'catalog display snapshot error status or retryability is inconsistent',
    )
  }
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  Object.freeze(value)
  for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry)
}

const SEALED_RESPONSES = new WeakMap<
  object,
  'CATALOG_DISPLAY_SNAPSHOT_LIST' | 'ERROR'
>()

function seal(
  response: WireCatalogDisplaySnapshotResponse,
): ValidatedCatalogDisplaySnapshotResponse {
  deepFreeze(response)
  SEALED_RESPONSES.set(response, response.response_kind)
  return response as ValidatedCatalogDisplaySnapshotResponse
}

export function isValidatedCatalogDisplaySnapshotResponse(
  value: unknown,
  kind?: 'CATALOG_DISPLAY_SNAPSHOT_LIST' | 'ERROR',
): value is ValidatedCatalogDisplaySnapshotResponse {
  if (value === null || typeof value !== 'object') return false
  const actual = SEALED_RESPONSES.get(value)
  return actual !== undefined && (kind === undefined || actual === kind)
}

export function decodeCatalogDisplaySnapshotApiResponse(
  payload: unknown,
): ValidatedCatalogDisplaySnapshotResponse {
  if (!validateCatalogDisplaySnapshotApiResponse(payload)) {
    throw new CatalogDisplaySnapshotWireViolation(
      validateCatalogDisplaySnapshotApiResponse.errors ?? [],
    )
  }
  const wire = structuredClone(payload) as WireCatalogDisplaySnapshotResponse
  if (wire.response_kind === 'ERROR') {
    verifyError(wire)
    return seal(wire)
  }
  if (
    !isCanonicalUtcInstant(wire.query.query_as_of) ||
    !isCanonicalUtcInstant(wire.query.known_at)
  ) {
    fail(
      'SNAPSHOT_QUERY_SHAPE',
      'catalog display snapshot query requires real canonical UTC instants',
    )
  }
  if (wire.members.length > wire.query.page_size) {
    fail(
      'SNAPSHOT_PAGE_ACCOUNTING',
      'catalog display snapshot member count exceeds page_size',
    )
  }
  if (wire.next_cursor !== null && wire.members.length !== wire.query.page_size) {
    fail(
      'SNAPSHOT_PAGE_ACCOUNTING',
      'a continued catalog display snapshot page must fill page_size',
    )
  }
  const seen = new Set<string>()
  for (let index = 0; index < wire.members.length; index += 1) {
    const descriptor = wire.members[index]
    if (
      !isCanonicalUtcInstant(descriptor.as_of) ||
      !isCanonicalUtcInstant(descriptor.available_at) ||
      descriptor.available_at < descriptor.as_of ||
      descriptor.as_of > wire.query.query_as_of ||
      descriptor.available_at > wire.query.known_at
    ) {
      fail(
        'SNAPSHOT_PIT_TIME_ORDER',
        'snapshot descriptor exceeds the explicit query cutoffs',
      )
    }
    if (seen.has(descriptor.snapshot_id)) {
      fail('SNAPSHOT_PAGE_ACCOUNTING', 'snapshot descriptors must be unique')
    }
    seen.add(descriptor.snapshot_id)
    if (index > 0 && compareDescriptorKeys(wire.members[index - 1], descriptor) >= 0) {
      fail(
        'SNAPSHOT_SORT_ORDER',
        'snapshot descriptors must use strict (as_of, snapshot_id) descending order',
      )
    }
  }
  return seal(wire)
}
