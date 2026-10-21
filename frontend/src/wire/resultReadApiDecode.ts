import type { ErrorObject } from 'ajv/dist/2020'
import { canonicalHash, compareCodePoints } from './canonical'
import { decodeCollectionResult, decodeUnitResult } from './decode'
import { validateResultReadApiResponse } from './generated/resultReadApiValidator.js'
import { decodeQualityResult } from './qualityDecode'
import {
  RESULT_READ_API_SCHEMA_ID,
} from './resultReadApiSchema'
import type {
  DecodedResultReadResponse,
  ResultReadResponseKind,
  ValidatedResultReadResponse,
  WireQualityResultListQuery,
  WireResultListQuery,
  WireResultReadResponse,
  WireResultResource,
} from './resultReadApiTypes'
import type { WireQualityResult, WireUnitResult } from './types'

export { validateResultReadApiResponse }

export class ResultReadApiWireViolation extends Error {
  readonly errors: readonly ErrorObject[]

  constructor(errors: readonly ErrorObject[]) {
    super(
      `result read response rejected by ${RESULT_READ_API_SCHEMA_ID}: ` +
        errors.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; '),
    )
    this.name = 'ResultReadApiWireViolation'
    this.errors = errors
  }
}

export const RESULT_READ_API_SEMANTIC_RULES = [
  'API_DOCUMENT_HASH',
  'API_TIME_ORDER',
  'API_PAGE_ACCOUNTING',
  'API_SORT_ORDER',
  'API_FILTER_MATCH',
] as const

export type ResultReadApiSemanticRule = (typeof RESULT_READ_API_SEMANTIC_RULES)[number]

export class ResultReadApiSemanticViolation extends Error {
  readonly rule: ResultReadApiSemanticRule

  constructor(rule: ResultReadApiSemanticRule, message: string) {
    super(message)
    this.name = 'ResultReadApiSemanticViolation'
    this.rule = rule
  }
}

function fail(rule: ResultReadApiSemanticRule, message: string): never {
  throw new ResultReadApiSemanticViolation(rule, message)
}

function verifyResource(
  resource: WireResultResource<{ as_of: string }>,
  queryAsOf: string,
): void {
  if (canonicalHash(resource.envelope) !== resource.storage.document_hash) {
    fail('API_DOCUMENT_HASH', 'resource document_hash does not match its envelope')
  }
  if (resource.envelope.as_of > queryAsOf || resource.storage.published_at > queryAsOf) {
    fail('API_TIME_ORDER', 'resource is later than the explicit query as_of')
  }
}

function matchesQuery(envelope: WireUnitResult, query: WireResultListQuery): boolean {
  const identity = envelope.identity
  return (
    (query.scope_kind === null || identity.scope_kind === query.scope_kind) &&
    (query.analysis_unit_kind === null ||
      identity.analysis_unit_kind === query.analysis_unit_kind) &&
    (query.edition_kind === null || identity.edition_kind === query.edition_kind) &&
    (query.parent_analysis_unit_id === null ||
      identity.parent_analysis_unit_id === query.parent_analysis_unit_id) &&
    (query.data_status === null || envelope.data_status === query.data_status)
  )
}

function matchesQualityQuery(
  envelope: WireQualityResult,
  query: WireQualityResultListQuery,
): boolean {
  const identity = envelope.identity
  return (
    (query.analysis_unit_kind === null ||
      identity.analysis_unit_kind === query.analysis_unit_kind) &&
    (query.edition_kind === null || identity.edition_kind === query.edition_kind) &&
    (query.parent_analysis_unit_id === null ||
      identity.parent_analysis_unit_id === query.parent_analysis_unit_id)
  )
}

function verifyStrictIdentityOrder(
  ids: readonly string[],
  kind: 'UNIT_LIST' | 'QUALITY_LIST',
): void {
  if (new Set(ids).size !== ids.length) {
    fail('API_PAGE_ACCOUNTING', `${kind} members must be unique`)
  }
  for (let index = 1; index < ids.length; index += 1) {
    if (compareCodePoints(ids[index - 1], ids[index]) >= 0) {
      fail('API_SORT_ORDER', `${kind} members must use strict code-point order`)
    }
  }
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  Object.freeze(value)
  for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry)
}

const SEALED_READ_RESPONSES = new WeakMap<object, ResultReadResponseKind>()

function sealReadResponse(
  response: DecodedResultReadResponse,
): ValidatedResultReadResponse {
  deepFreeze(response)
  SEALED_READ_RESPONSES.set(response, response.response_kind)
  return response as ValidatedResultReadResponse
}

export function isValidatedResultReadResponse(
  value: unknown,
  kind?: ResultReadResponseKind,
): value is ValidatedResultReadResponse {
  if (value === null || typeof value !== 'object') return false
  const actual = SEALED_READ_RESPONSES.get(value)
  return actual !== undefined && (kind === undefined || actual === kind)
}

export function decodeResultReadApiResponse(payload: unknown): ValidatedResultReadResponse {
  if (!validateResultReadApiResponse(payload)) {
    throw new ResultReadApiWireViolation(validateResultReadApiResponse.errors ?? [])
  }
  const wire = payload as WireResultReadResponse
  if (wire.response_kind === 'ERROR') {
    return sealReadResponse(structuredClone(wire))
  }
  if (wire.response_kind === 'UNIT_DETAIL') {
    verifyResource(wire.resource, wire.query_as_of)
    return sealReadResponse({
      ...structuredClone(wire),
      resource: {
        ...structuredClone(wire.resource),
        envelope: decodeUnitResult(wire.resource.envelope),
      },
    })
  }
  if (wire.response_kind === 'COLLECTION_DETAIL') {
    verifyResource(wire.resource, wire.query_as_of)
    return sealReadResponse({
      ...structuredClone(wire),
      resource: {
        ...structuredClone(wire.resource),
        envelope: decodeCollectionResult(wire.resource.envelope),
      },
    })
  }
  if (wire.response_kind === 'QUALITY_DETAIL') {
    verifyResource(wire.resource, wire.query_as_of)
    return sealReadResponse({
      ...structuredClone(wire),
      resource: {
        ...structuredClone(wire.resource),
        envelope: decodeQualityResult(wire.resource.envelope),
      },
    })
  }

  if (wire.response_kind === 'QUALITY_LIST') {
    if (wire.members.length > wire.query.page_size) {
      fail('API_PAGE_ACCOUNTING', 'member count exceeds page_size')
    }
    const decoded = wire.members.map((resource) => {
      verifyResource(resource, wire.query.as_of)
      if (!matchesQualityQuery(resource.envelope, wire.query)) {
        fail('API_FILTER_MATCH', 'a quality member does not match the echoed query')
      }
      return {
        ...structuredClone(resource),
        envelope: decodeQualityResult(resource.envelope),
      }
    })
    verifyStrictIdentityOrder(
      decoded.map((resource) => resource.envelope.identity.analysis_unit_id),
      'QUALITY_LIST',
    )
    return sealReadResponse({
      ...structuredClone(wire),
      members: decoded,
    })
  }

  if (wire.members.length > wire.query.page_size) {
    fail('API_PAGE_ACCOUNTING', 'member count exceeds page_size')
  }
  const decoded = wire.members.map((resource) => {
    verifyResource(resource, wire.query.as_of)
    if (!matchesQuery(resource.envelope, wire.query)) {
      fail('API_FILTER_MATCH', 'a member does not match the echoed query')
    }
    return {
      ...structuredClone(resource),
      envelope: decodeUnitResult(resource.envelope),
    }
  })
  const ids = decoded.map((resource) => resource.envelope.identity.analysis_unit_id)
  verifyStrictIdentityOrder(ids, 'UNIT_LIST')
  return sealReadResponse({
    ...structuredClone(wire),
    members: decoded,
  })
}
