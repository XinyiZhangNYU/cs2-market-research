// Transport-neutral frontend boundary for the formal result read API.
//
// This file deliberately has no fetch implementation. A caller must inject a gateway that
// returns unknown JSON; the response then passes through the shared API schema, the nested
// envelope schema and all semantic checks before it can reach an adapter or component.
import type {
  ResultReadResponseKind,
  ValidatedResultReadResponse,
  WireQualityResultListQuery,
  WireResultListQuery,
} from '../wire/resultReadApiTypes'
import type { GatewayReadOptions } from './GatewayReadOptions'

export type UnitDetailReadRequest = {
  readonly operation: 'UNIT_DETAIL'
  readonly analysis_unit_id: string
  readonly as_of: string
}

export type UnitListReadRequest = {
  readonly operation: 'UNIT_LIST'
  readonly query: WireResultListQuery
  readonly cursor: string | null
}

export type CollectionDetailReadRequest = {
  readonly operation: 'COLLECTION_DETAIL'
  readonly collection_id: string
  readonly as_of: string
}

export type QualityDetailReadRequest = {
  readonly operation: 'QUALITY_DETAIL'
  readonly analysis_unit_id: string
  readonly as_of: string
}

export type QualityListReadRequest = {
  readonly operation: 'QUALITY_LIST'
  readonly query: WireQualityResultListQuery
  readonly cursor: string | null
}

export type FormalResultReadRequest =
  | UnitDetailReadRequest
  | UnitListReadRequest
  | CollectionDetailReadRequest
  | QualityDetailReadRequest
  | QualityListReadRequest

export interface FormalResultReadGateway {
  readonly kind: string
  read(request: FormalResultReadRequest, options?: GatewayReadOptions): Promise<unknown>
}

export type ValidatedOperationResponse<Kind extends ResultReadResponseKind> =
  ValidatedResultReadResponse & {
    readonly response_kind: Kind | 'ERROR'
  }

export class UnexpectedResultReadResponse extends Error {
  constructor(expected: ResultReadResponseKind, actual: ResultReadResponseKind) {
    super(`formal result read expected ${expected} but received ${actual}`)
    this.name = 'UnexpectedResultReadResponse'
  }
}

export class ResultReadRequestBindingViolation extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResultReadRequestBindingViolation'
  }
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  Object.freeze(value)
  for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry)
}

function protectedRequest<Request extends FormalResultReadRequest>(request: Request): Request {
  const copy = structuredClone(request)
  deepFreeze(copy)
  return copy
}

function sameListQuery(left: WireResultListQuery, right: WireResultListQuery): boolean {
  return (
    left.as_of === right.as_of &&
    left.scope_kind === right.scope_kind &&
    left.analysis_unit_kind === right.analysis_unit_kind &&
    left.edition_kind === right.edition_kind &&
    left.parent_analysis_unit_id === right.parent_analysis_unit_id &&
    left.data_status === right.data_status &&
    left.sort === right.sort &&
    left.page_size === right.page_size
  )
}

function sameQualityListQuery(
  left: WireQualityResultListQuery,
  right: WireQualityResultListQuery,
): boolean {
  return (
    left.as_of === right.as_of &&
    left.analysis_unit_kind === right.analysis_unit_kind &&
    left.edition_kind === right.edition_kind &&
    left.parent_analysis_unit_id === right.parent_analysis_unit_id &&
    left.sort === right.sort &&
    left.page_size === right.page_size
  )
}

function bindResponseToRequest(
  request: FormalResultReadRequest,
  response: ValidatedResultReadResponse,
): void {
  if (response.response_kind === 'ERROR') return
  if (request.operation === 'UNIT_DETAIL' && response.response_kind === 'UNIT_DETAIL') {
    if (
      response.query_as_of !== request.as_of ||
      response.resource.envelope.identity.analysis_unit_id !== request.analysis_unit_id
    ) {
      throw new ResultReadRequestBindingViolation(
        'UNIT_DETAIL response does not answer the requested identity and as_of',
      )
    }
    return
  }
  if (
    request.operation === 'COLLECTION_DETAIL' &&
    response.response_kind === 'COLLECTION_DETAIL'
  ) {
    if (
      response.query_as_of !== request.as_of ||
      response.resource.envelope.collection_id !== request.collection_id
    ) {
      throw new ResultReadRequestBindingViolation(
        'COLLECTION_DETAIL response does not answer the requested collection and as_of',
      )
    }
    return
  }
  if (request.operation === 'QUALITY_DETAIL' && response.response_kind === 'QUALITY_DETAIL') {
    if (
      response.query_as_of !== request.as_of ||
      response.resource.envelope.identity.analysis_unit_id !== request.analysis_unit_id
    ) {
      throw new ResultReadRequestBindingViolation(
        'QUALITY_DETAIL response does not answer the requested identity and as_of',
      )
    }
    return
  }
  if (request.operation === 'UNIT_LIST' && response.response_kind === 'UNIT_LIST') {
    if (!sameListQuery(response.query, request.query)) {
      throw new ResultReadRequestBindingViolation(
        'UNIT_LIST response does not echo the requested filters, order, page size and as_of',
      )
    }
    return
  }
  if (request.operation === 'QUALITY_LIST' && response.response_kind === 'QUALITY_LIST') {
    if (!sameQualityListQuery(response.query, request.query)) {
      throw new ResultReadRequestBindingViolation(
        'QUALITY_LIST response does not echo the requested filters, order, page size and as_of',
      )
    }
    return
  }
  throw new UnexpectedResultReadResponse(request.operation, response.response_kind)
}

export class FormalResultReadApi {
  readonly kind = 'FORMAL_RESULT_READ' as const

  constructor(private readonly gateway: FormalResultReadGateway) {
    if (!gateway || typeof gateway.read !== 'function') {
      throw new TypeError('FormalResultReadApi requires an injected read gateway')
    }
  }

  private async execute<Kind extends Exclude<ResultReadResponseKind, 'ERROR'>>(
    request: FormalResultReadRequest,
    expected: Kind,
    options?: GatewayReadOptions,
  ): Promise<ValidatedOperationResponse<Kind>> {
    const {
      decodeResultReadApiResponse,
      isValidatedResultReadResponse,
    } = await import('../wire/resultReadApiDecode')
    const payload = await this.gateway.read(protectedRequest(request), options)
    const response = decodeResultReadApiResponse(payload)
    if (response.response_kind !== expected && response.response_kind !== 'ERROR') {
      throw new UnexpectedResultReadResponse(expected, response.response_kind)
    }
    bindResponseToRequest(request, response)
    if (!isValidatedResultReadResponse(response, response.response_kind)) {
      throw new TypeError('decoder returned an unregistered formal result response')
    }
    return response as ValidatedOperationResponse<Kind>
  }

  getUnit(request: Omit<UnitDetailReadRequest, 'operation'>, options?: GatewayReadOptions) {
    return this.execute({ operation: 'UNIT_DETAIL', ...request }, 'UNIT_DETAIL', options)
  }

  listUnits(request: Omit<UnitListReadRequest, 'operation'>, options?: GatewayReadOptions) {
    return this.execute({ operation: 'UNIT_LIST', ...request }, 'UNIT_LIST', options)
  }

  getCollection(request: Omit<CollectionDetailReadRequest, 'operation'>, options?: GatewayReadOptions) {
    return this.execute({ operation: 'COLLECTION_DETAIL', ...request }, 'COLLECTION_DETAIL', options)
  }

  getQuality(request: Omit<QualityDetailReadRequest, 'operation'>, options?: GatewayReadOptions) {
    return this.execute({ operation: 'QUALITY_DETAIL', ...request }, 'QUALITY_DETAIL', options)
  }

  listQuality(request: Omit<QualityListReadRequest, 'operation'>, options?: GatewayReadOptions) {
    return this.execute({ operation: 'QUALITY_LIST', ...request }, 'QUALITY_LIST', options)
  }
}
