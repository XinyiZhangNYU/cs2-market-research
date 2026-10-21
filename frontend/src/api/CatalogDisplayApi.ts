import type {
  ValidatedCatalogDisplayResponse,
  WireCatalogDisplayQuery,
} from '../wire/catalogDisplayApiTypes'
import type {
  ValidatedCatalogDisplaySnapshotResponse,
  WireCatalogDisplaySnapshotQuery,
} from '../wire/catalogDisplaySnapshotApiTypes'
import type { GatewayReadOptions } from './GatewayReadOptions'
import equal from 'fast-deep-equal'
import type {
  ValidatedCatalogDisplayQueryResponse,
  WireCatalogBootstrapQuery,
  WireCatalogDetailQuery,
  WireCatalogSeriesQuery,
  WireCatalogUnitsQuery,
} from '../wire/catalogDisplayQueryApiTypes'

export type CatalogDisplayListRequest = {
  readonly operation: 'CATALOG_DISPLAY_LIST'
  readonly query: WireCatalogDisplayQuery
  readonly cursor: string | null
}

export type CatalogDisplaySnapshotListRequest = {
  readonly operation: 'CATALOG_DISPLAY_SNAPSHOT_LIST'
  readonly query: WireCatalogDisplaySnapshotQuery
  readonly cursor: string | null
}

export type CatalogQueryBootstrapRequest = {
  readonly operation: 'CATALOG_QUERY_BOOTSTRAP'
  readonly query: WireCatalogBootstrapQuery
}

export type CatalogQuerySeriesRequest = {
  readonly operation: 'CATALOG_QUERY_SERIES'
  readonly query: WireCatalogSeriesQuery
  readonly cursor: string | null
}

export type CatalogQueryUnitsRequest = {
  readonly operation: 'CATALOG_QUERY_UNITS'
  readonly query: WireCatalogUnitsQuery
  readonly cursor: string | null
}

export type CatalogQueryDetailRequest = {
  readonly operation: 'CATALOG_QUERY_DETAIL'
  readonly query: WireCatalogDetailQuery
  readonly cursor: string | null
}

export type CatalogDisplayGatewayRequest =
  | CatalogDisplayListRequest
  | CatalogDisplaySnapshotListRequest

export type CatalogDisplayQueryGatewayRequest =
  | CatalogQueryBootstrapRequest
  | CatalogQuerySeriesRequest
  | CatalogQueryUnitsRequest
  | CatalogQueryDetailRequest

export interface CatalogDisplayGateway {
  readonly kind: string
  read(request: CatalogDisplayGatewayRequest, options?: GatewayReadOptions): Promise<unknown>
  readQuery?(request: CatalogDisplayQueryGatewayRequest, options?: GatewayReadOptions): Promise<unknown>
}

export class CatalogDisplayRequestBindingViolation extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CatalogDisplayRequestBindingViolation'
  }
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  Object.freeze(value)
  for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry)
}

function sameQuery(left: WireCatalogDisplayQuery, right: WireCatalogDisplayQuery): boolean {
  return (
    left.analysis_unit_kind === right.analysis_unit_kind &&
    left.as_of === right.as_of &&
    left.base_item_code === right.base_item_code &&
    left.edition_kind === right.edition_kind &&
    left.item_kind === right.item_kind &&
    left.known_at === right.known_at &&
    left.page_size === right.page_size &&
    left.sort === right.sort &&
    left.wear_tier === right.wear_tier
  )
}

function sameSnapshotQuery(
  left: WireCatalogDisplaySnapshotQuery,
  right: WireCatalogDisplaySnapshotQuery,
): boolean {
  return (
    left.known_at === right.known_at &&
    left.page_size === right.page_size &&
    left.query_as_of === right.query_as_of &&
    left.sort === right.sort
  )
}

export class CatalogDisplayApi {
  readonly kind = 'CATALOG_DISPLAY_READ' as const

  constructor(private readonly gateway: CatalogDisplayGateway) {
    if (!gateway || typeof gateway.read !== 'function') {
      throw new TypeError('CatalogDisplayApi requires an injected gateway')
    }
  }

  async list(
    request: Omit<CatalogDisplayListRequest, 'operation'>,
    options?: GatewayReadOptions,
  ): Promise<ValidatedCatalogDisplayResponse> {
    const protectedRequest: CatalogDisplayListRequest = structuredClone({
      operation: 'CATALOG_DISPLAY_LIST' as const,
      ...request,
    })
    deepFreeze(protectedRequest)
    const [{ decodeCatalogDisplayApiResponse, isValidatedCatalogDisplayResponse }, payload] = await Promise.all([
      import('../wire/catalogDisplayApiDecode'),
      Promise.resolve().then(() => this.gateway.read(protectedRequest, options)),
    ])
    const response = decodeCatalogDisplayApiResponse(payload)
    if (response.response_kind === 'CATALOG_DISPLAY_LIST') {
      if (!sameQuery(response.query, protectedRequest.query)) {
        throw new CatalogDisplayRequestBindingViolation(
          'catalog display response does not echo the requested PIT query',
        )
      }
    }
    if (!isValidatedCatalogDisplayResponse(response, response.response_kind)) {
      throw new TypeError('decoder returned an unregistered catalog display response')
    }
    return response
  }

  async listSnapshots(
    request: Omit<CatalogDisplaySnapshotListRequest, 'operation'>,
    options?: GatewayReadOptions,
  ): Promise<ValidatedCatalogDisplaySnapshotResponse> {
    const protectedRequest: CatalogDisplaySnapshotListRequest = structuredClone({
      operation: 'CATALOG_DISPLAY_SNAPSHOT_LIST' as const,
      ...request,
    })
    deepFreeze(protectedRequest)
    const [{ decodeCatalogDisplaySnapshotApiResponse, isValidatedCatalogDisplaySnapshotResponse }, payload] = await Promise.all([
      import('../wire/catalogDisplaySnapshotApiDecode'),
      Promise.resolve().then(() => this.gateway.read(protectedRequest, options)),
    ])
    const response = decodeCatalogDisplaySnapshotApiResponse(payload)
    if (response.response_kind === 'CATALOG_DISPLAY_SNAPSHOT_LIST') {
      if (!sameSnapshotQuery(response.query, protectedRequest.query)) {
        throw new CatalogDisplayRequestBindingViolation(
          'catalog display snapshot response does not echo the requested PIT cutoffs',
        )
      }
    }
    if (
      !isValidatedCatalogDisplaySnapshotResponse(
        response,
        response.response_kind,
      )
    ) {
      throw new TypeError(
        'decoder returned an unregistered catalog display snapshot response',
      )
    }
    return response
  }

  private async query<
    T extends
      | CatalogQueryBootstrapRequest
      | CatalogQuerySeriesRequest
      | CatalogQueryUnitsRequest
      | CatalogQueryDetailRequest,
  >(
    request: T,
    expectedKind: T['operation'],
    options?: GatewayReadOptions,
  ): Promise<ValidatedCatalogDisplayQueryResponse> {
    const protectedRequest = structuredClone(request)
    deepFreeze(protectedRequest)
    if (!this.gateway.readQuery) {
      throw new TypeError('catalog display gateway does not implement snapshot-bound queries')
    }
    const readQuery = this.gateway.readQuery.bind(this.gateway)
    const [{ decodeCatalogDisplayQueryApiResponse, isValidatedCatalogDisplayQueryResponse }, payload] = await Promise.all([
      import('../wire/catalogDisplayQueryApiDecode'),
      Promise.resolve().then(() => readQuery(protectedRequest, options)),
    ])
    const response = decodeCatalogDisplayQueryApiResponse(payload)
    if (response.response_kind !== 'ERROR') {
      if (response.response_kind !== expectedKind || !equal(response.query, protectedRequest.query)) {
        throw new CatalogDisplayRequestBindingViolation(
          'catalog query response does not echo the exact requested snapshot-bound query',
        )
      }
      if ('cursor' in protectedRequest && 'next_cursor' in response) {
        const current = protectedRequest.cursor
        if (
          (current !== null &&
            (response.next_cursor === current || response.previous_cursor === current)) ||
          (response.next_cursor !== null && response.next_cursor === response.previous_cursor)
        ) {
          throw new CatalogDisplayRequestBindingViolation(
            'catalog query response repeated the current or opposite page cursor',
          )
        }
      }
    }
    if (!isValidatedCatalogDisplayQueryResponse(response, response.response_kind)) {
      throw new TypeError('decoder returned an unregistered catalog query response')
    }
    return response
  }

  bootstrap(
    request: Omit<CatalogQueryBootstrapRequest, 'operation'>,
    options?: GatewayReadOptions,
  ): Promise<ValidatedCatalogDisplayQueryResponse> {
    return this.query(
      { operation: 'CATALOG_QUERY_BOOTSTRAP', ...request },
      'CATALOG_QUERY_BOOTSTRAP',
      options,
    )
  }

  series(
    request: Omit<CatalogQuerySeriesRequest, 'operation'>,
    options?: GatewayReadOptions,
  ): Promise<ValidatedCatalogDisplayQueryResponse> {
    return this.query(
      { operation: 'CATALOG_QUERY_SERIES', ...request },
      'CATALOG_QUERY_SERIES',
      options,
    )
  }

  units(
    request: Omit<CatalogQueryUnitsRequest, 'operation'>,
    options?: GatewayReadOptions,
  ): Promise<ValidatedCatalogDisplayQueryResponse> {
    return this.query(
      { operation: 'CATALOG_QUERY_UNITS', ...request },
      'CATALOG_QUERY_UNITS',
      options,
    )
  }

  detail(
    request: Omit<CatalogQueryDetailRequest, 'operation'>,
    options?: GatewayReadOptions,
  ): Promise<ValidatedCatalogDisplayQueryResponse> {
    return this.query(
      { operation: 'CATALOG_QUERY_DETAIL', ...request },
      'CATALOG_QUERY_DETAIL',
      options,
    )
  }
}
