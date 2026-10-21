import type { ErrorObject } from 'ajv/dist/2020'
import { canonicalHash, compareCodePoints } from './canonical'
import {
  CATALOG_DISPLAY_API_SCHEMA_ID,
} from './catalogDisplayApiSchema'
import { validateCatalogDisplayApiResponse } from './generated/catalogDisplayApiValidator.js'
import type {
  ValidatedCatalogDisplayResponse,
  WireCatalogDisplayMember,
  WireCatalogDisplayProjection,
  WireCatalogDisplayQuery,
  WireCatalogDisplayResponse,
} from './catalogDisplayApiTypes'
import type { WireCatalogDisplaySnapshotDescriptor } from './catalogDisplaySnapshotApiTypes'

export { validateCatalogDisplayApiResponse }

export class CatalogDisplayWireViolation extends Error {
  readonly errors: readonly ErrorObject[]

  constructor(errors: readonly ErrorObject[]) {
    super(
      `catalog display response rejected by ${CATALOG_DISPLAY_API_SCHEMA_ID}: ` +
        errors.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; '),
    )
    this.name = 'CatalogDisplayWireViolation'
    this.errors = errors
  }
}

export const CATALOG_DISPLAY_SEMANTIC_RULES = [
  'PROJECTION_HASH',
  'PIT_TIME_ORDER',
  'PAGE_ACCOUNTING',
  'SORT_ORDER',
  'FILTER_MATCH',
  'QUERY_SHAPE',
  'IDENTITY_SHAPE',
  'LOCALIZED_NAME_SHAPE',
  'MEDIA_BINDING_SHAPE',
  'ERROR_SHAPE',
] as const
export type CatalogDisplaySemanticRule =
  (typeof CATALOG_DISPLAY_SEMANTIC_RULES)[number]

export class CatalogDisplaySemanticViolation extends Error {
  constructor(
    readonly rule: CatalogDisplaySemanticRule,
    message: string,
  ) {
    super(message)
    this.name = 'CatalogDisplaySemanticViolation'
  }
}

function fail(rule: CatalogDisplaySemanticRule, message: string): never {
  throw new CatalogDisplaySemanticViolation(rule, message)
}

function projectionHashDocument(
  projection: WireCatalogDisplayProjection,
): Omit<WireCatalogDisplayProjection, 'projection_hash'> {
  const { projection_hash: _projectionHash, ...document } = projection
  return document
}

function isTrimmedControlFree(value: string): boolean {
  return (
    value === value.trim() &&
    value.length > 0 &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  )
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
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return day <= daysInMonth
}

function verifyQuery(query: WireCatalogDisplayQuery): void {
  if (!isCanonicalUtcInstant(query.as_of) || !isCanonicalUtcInstant(query.known_at)) {
    fail('QUERY_SHAPE', 'catalog display query requires real canonical UTC instants')
  }
  if (query.base_item_code !== null && query.item_kind === null) {
    fail('QUERY_SHAPE', 'base_item_code requires an explicit item_kind')
  }
  if (
    query.base_item_code !== null &&
    !isTrimmedControlFree(query.base_item_code)
  ) {
    fail('QUERY_SHAPE', 'base_item_code must be trimmed control-free text')
  }
}

function verifyProjection(
  member: WireCatalogDisplayMember,
  query: WireCatalogDisplayQuery,
): void {
  const projection = member.projection
  if (canonicalHash(projectionHashDocument(projection)) !== projection.projection_hash) {
    fail('PROJECTION_HASH', 'projection_hash does not match canonical projection bytes')
  }
  if (
    !isCanonicalUtcInstant(projection.valid_from) ||
    !isCanonicalUtcInstant(member.storage.available_at) ||
    (member.storage.valid_to !== null &&
      !isCanonicalUtcInstant(member.storage.valid_to)) ||
    projection.valid_from > query.as_of ||
    member.storage.available_at > query.known_at ||
    (member.storage.valid_to !== null && query.as_of >= member.storage.valid_to)
  ) {
    fail('PIT_TIME_ORDER', 'projection does not answer the explicit as_of and known_at')
  }
  if (
    !isTrimmedControlFree(projection.analysis_unit_id) ||
    !isTrimmedControlFree(projection.base_item_code) ||
    !isTrimmedControlFree(projection.catalog_version) ||
    (projection.parent_analysis_unit_id !== null &&
      !isTrimmedControlFree(projection.parent_analysis_unit_id)) ||
    (projection.analysis_unit_kind === 'BASE_MHN' &&
      projection.parent_analysis_unit_id !== null) ||
    (projection.analysis_unit_kind !== 'BASE_MHN' &&
      projection.parent_analysis_unit_id === null) ||
    projection.analysis_unit_id === projection.parent_analysis_unit_id
  ) {
    fail('IDENTITY_SHAPE', 'analysis-unit kind and explicit parent identity disagree')
  }
  if (
    !isTrimmedControlFree(projection.localized_name.en) ||
    !isTrimmedControlFree(projection.localized_name.zh_cn) ||
    (projection.edition_kind === 'STATTRAK' &&
      (!projection.localized_name.en.includes('StatTrak™') ||
        !projection.localized_name.zh_cn.includes('StatTrak™')))
  ) {
    fail(
      'LOCALIZED_NAME_SHAPE',
      'provider-attributed localized names are incomplete or altered',
    )
  }
  const mediaVersion = projection.version_context.media_asset_version_id
  if (projection.media.status === 'NOT_PRODUCED') {
    if (mediaVersion !== null) {
      fail('MEDIA_BINDING_SHAPE', 'NOT_PRODUCED media cannot carry a media version')
    }
  } else {
    const segments = projection.media.media_key.split('/')
    if (
      mediaVersion === null ||
      segments.some((segment) => segment === '' || segment === '.' || segment === '..')
    ) {
      fail('MEDIA_BINDING_SHAPE', 'BOUND media key or version context is unsafe')
    }
  }
  if (
    (query.item_kind !== null && projection.item_kind !== query.item_kind) ||
    (query.base_item_code !== null &&
      projection.base_item_code !== query.base_item_code) ||
    (query.analysis_unit_kind !== null &&
      projection.analysis_unit_kind !== query.analysis_unit_kind) ||
    (query.edition_kind !== null && projection.edition_kind !== query.edition_kind) ||
    (query.wear_tier !== null && projection.wear_tier !== query.wear_tier)
  ) {
    fail('FILTER_MATCH', 'catalog display member does not match the echoed query')
  }
}

export function verifyCatalogDisplayMemberForSnapshot(
  member: WireCatalogDisplayMember,
  snapshot: WireCatalogDisplaySnapshotDescriptor,
): void {
  verifyProjection(member, {
    analysis_unit_kind: null,
    as_of: snapshot.as_of,
    base_item_code: null,
    edition_kind: null,
    item_kind: null,
    known_at: snapshot.available_at,
    page_size: 200,
    sort: 'ANALYSIS_UNIT_ID_ASC',
    wear_tier: null,
  })
  if (member.projection.catalog_version !== snapshot.catalog_version) {
    fail('FILTER_MATCH', 'catalog display member does not match snapshot catalog version')
  }
}

const ERROR_SHAPES = {
  INVALID_ARGUMENT: { http_status: 400, retryable: false },
  INVALID_CURSOR: { http_status: 400, retryable: false },
  NOT_FOUND: { http_status: 404, retryable: false },
  CONTRACT_UNAVAILABLE: { http_status: 503, retryable: true },
  RECORD_CORRUPT: { http_status: 503, retryable: false },
  BACKEND_UNAVAILABLE: { http_status: 503, retryable: true },
} as const

function verifyError(response: Extract<WireCatalogDisplayResponse, { response_kind: 'ERROR' }>): void {
  const expected = ERROR_SHAPES[response.error.code]
  if (
    response.error.http_status !== expected.http_status ||
    response.error.retryable !== expected.retryable
  ) {
    fail('ERROR_SHAPE', 'catalog display error status or retryability is inconsistent')
  }
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  Object.freeze(value)
  for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry)
}

const SEALED_RESPONSES = new WeakMap<object, 'CATALOG_DISPLAY_LIST' | 'ERROR'>()

function seal(
  response: WireCatalogDisplayResponse,
): ValidatedCatalogDisplayResponse {
  deepFreeze(response)
  SEALED_RESPONSES.set(response, response.response_kind)
  return response as ValidatedCatalogDisplayResponse
}

export function isValidatedCatalogDisplayResponse(
  value: unknown,
  kind?: 'CATALOG_DISPLAY_LIST' | 'ERROR',
): value is ValidatedCatalogDisplayResponse {
  if (value === null || typeof value !== 'object') return false
  const actual = SEALED_RESPONSES.get(value)
  return actual !== undefined && (kind === undefined || actual === kind)
}

export function decodeCatalogDisplayApiResponse(
  payload: unknown,
): ValidatedCatalogDisplayResponse {
  if (!validateCatalogDisplayApiResponse(payload)) {
    throw new CatalogDisplayWireViolation(validateCatalogDisplayApiResponse.errors ?? [])
  }
  const wire = structuredClone(payload) as WireCatalogDisplayResponse
  if (wire.response_kind === 'ERROR') {
    verifyError(wire)
    return seal(wire)
  }
  verifyQuery(wire.query)
  if (wire.members.length > wire.query.page_size) {
    fail('PAGE_ACCOUNTING', 'catalog display member count exceeds page_size')
  }
  if (wire.next_cursor !== null && wire.members.length !== wire.query.page_size) {
    fail('PAGE_ACCOUNTING', 'a continued catalog display page must fill page_size')
  }
  const identifiers = wire.members.map((member) => {
    verifyProjection(member, wire.query)
    return member.projection.analysis_unit_id
  })
  if (new Set(identifiers).size !== identifiers.length) {
    fail('PAGE_ACCOUNTING', 'catalog display members must be unique')
  }
  for (let index = 1; index < identifiers.length; index += 1) {
    if (compareCodePoints(identifiers[index - 1], identifiers[index]) >= 0) {
      fail('SORT_ORDER', 'catalog display members must use strict code-point order')
    }
  }
  return seal(wire)
}
