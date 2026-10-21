import type {
  CatalogDisplayGateway,
  CatalogDisplayGatewayRequest,
  CatalogDisplayQueryGatewayRequest,
} from './CatalogDisplayApi'
import type { GatewayReadOptions } from './GatewayReadOptions'
import {
  BoundedJsonFetchError,
  boundedJsonFetch,
  boundedJsonTimeout,
} from './boundedJsonFetch'

export const DEFAULT_LOCAL_CATALOG_DISPLAY_API_BASE_URL =
  '/api/v1/catalog-display'

export type CatalogDisplayTransportFailure =
  | 'NETWORK_UNAVAILABLE'
  | 'REQUEST_TIMEOUT'
  | 'INVALID_CONTENT_TYPE'
  | 'RESPONSE_TOO_LARGE'
  | 'INVALID_JSON_RESPONSE'
  | 'HTTP_STATUS_MISMATCH'

export class CatalogDisplayTransportError extends Error {
  constructor(
    readonly code: CatalogDisplayTransportFailure,
    readonly retryable: boolean,
    readonly httpStatus: number | null = null,
  ) {
    super(`catalog display gateway failed: ${code}`)
    this.name = 'CatalogDisplayTransportError'
  }
}

export type HttpCatalogDisplayGatewayOptions = Readonly<{
  baseUrl?: string
  fetcher?: typeof fetch
  timeoutMs?: number
}>

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function normalizedLocalBaseUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes('?') || trimmed.includes('#')) {
    throw new TypeError('local catalog display base URL cannot contain query or fragment')
  }
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//')) {
      throw new TypeError('local catalog display base URL cannot be protocol-relative')
    }
    return trimmed.replace(/\/+$/, '')
  }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new TypeError('local catalog display base URL must be same-origin or loopback')
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    !LOOPBACK_HOSTS.has(parsed.hostname) ||
    parsed.username ||
    parsed.password
  ) {
    throw new TypeError('local catalog display base URL must be same-origin or loopback')
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`
}

function appendOptional(
  parameters: URLSearchParams,
  name: string,
  value: string | null,
): void {
  if (value !== null) parameters.set(name, value)
}

function requestUrl(baseUrl: string, request: CatalogDisplayGatewayRequest | CatalogDisplayQueryGatewayRequest): string {
  const parameters = new URLSearchParams()
  if (request.operation === 'CATALOG_QUERY_BOOTSTRAP') {
    parameters.set('snapshot_id', request.query.snapshot_id)
    return `${baseUrl}/query/bootstrap?${parameters}`
  }
  if (request.operation === 'CATALOG_QUERY_SERIES') {
    parameters.set('snapshot_id', request.query.snapshot_id)
    parameters.set('equipment_selection_id', request.query.equipment_selection_id)
    appendOptional(parameters, 'discovery_seed', request.query.discovery_seed ?? null)
    parameters.set('locale', request.query.locale)
    appendOptional(parameters, 'rarity', request.query.rarity)
    appendOptional(parameters, 'item_category', request.query.item_category)
    appendOptional(parameters, 'wear_tier', request.query.wear_tier)
    appendOptional(parameters, 'search_text', request.query.search_text)
    parameters.set('sort', request.query.sort)
    parameters.set('page_size', String(request.query.page_size))
    appendOptional(parameters, 'cursor', request.cursor)
    return `${baseUrl}/query/series?${parameters}`
  }
  if (request.operation === 'CATALOG_QUERY_UNITS') {
    parameters.set('snapshot_id', request.query.snapshot_id)
    parameters.set('item_kind', request.query.item_kind)
    parameters.set('base_item_code', request.query.base_item_code)
    for (const edition of request.query.edition_kinds) parameters.append('edition_kind', edition)
    for (const wear of request.query.wear_tiers) parameters.append('wear_tier', wear)
    parameters.set('locale', request.query.locale)
    appendOptional(parameters, 'rarity', request.query.rarity)
    appendOptional(parameters, 'item_category', request.query.item_category)
    parameters.set('sort', request.query.sort)
    parameters.set('page_size', String(request.query.page_size))
    appendOptional(parameters, 'cursor', request.cursor)
    return `${baseUrl}/query/units?${parameters}`
  }
  if (request.operation === 'CATALOG_QUERY_DETAIL') {
    parameters.set('snapshot_id', request.query.snapshot_id)
    parameters.set('analysis_unit_id', request.query.analysis_unit_id)
    parameters.set('page_size', String(request.query.page_size))
    appendOptional(parameters, 'cursor', request.cursor)
    return `${baseUrl}/query/detail?${parameters}`
  }
  if (request.operation === 'CATALOG_DISPLAY_SNAPSHOT_LIST') {
    parameters.set('query_as_of', request.query.query_as_of)
    parameters.set('known_at', request.query.known_at)
    parameters.set('sort', request.query.sort)
    parameters.set('page_size', String(request.query.page_size))
    appendOptional(parameters, 'cursor', request.cursor)
    return `${baseUrl}/snapshots?${parameters}`
  }
  parameters.set('as_of', request.query.as_of)
  parameters.set('known_at', request.query.known_at)
  appendOptional(parameters, 'item_kind', request.query.item_kind)
  appendOptional(parameters, 'base_item_code', request.query.base_item_code)
  appendOptional(parameters, 'analysis_unit_kind', request.query.analysis_unit_kind)
  appendOptional(parameters, 'edition_kind', request.query.edition_kind)
  appendOptional(parameters, 'wear_tier', request.query.wear_tier)
  parameters.set('sort', request.query.sort)
  parameters.set('page_size', String(request.query.page_size))
  appendOptional(parameters, 'cursor', request.cursor)
  return `${baseUrl}/units?${parameters}`
}

function declaredErrorStatus(payload: unknown): number | null {
  if (payload === null || typeof payload !== 'object') return null
  const candidate = payload as Record<string, unknown>
  if (candidate.response_kind !== 'ERROR') return null
  if (candidate.error === null || typeof candidate.error !== 'object') return null
  const status = (candidate.error as Record<string, unknown>).http_status
  return typeof status === 'number' && Number.isInteger(status) ? status : null
}

export class HttpCatalogDisplayGateway implements CatalogDisplayGateway {
  readonly kind = 'LOCAL_CATALOG_DISPLAY_API' as const
  private readonly baseUrl: string
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: HttpCatalogDisplayGatewayOptions = {}) {
    this.baseUrl = normalizedLocalBaseUrl(
      options.baseUrl ?? DEFAULT_LOCAL_CATALOG_DISPLAY_API_BASE_URL,
    )
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  async read(
    request: CatalogDisplayGatewayRequest,
    options: GatewayReadOptions = {},
  ): Promise<unknown> {
    return this.readBounded(request, options)
  }

  async readQuery(
    request: CatalogDisplayQueryGatewayRequest,
    options: GatewayReadOptions = {},
  ): Promise<unknown> {
    return this.readBounded(request, options)
  }

  private async readBounded(
    request: CatalogDisplayGatewayRequest | CatalogDisplayQueryGatewayRequest,
    options: GatewayReadOptions,
  ): Promise<unknown> {
    let response: Awaited<ReturnType<typeof boundedJsonFetch>>
    try {
      response = await boundedJsonFetch(requestUrl(this.baseUrl, request), {
        fetcher: this.fetcher,
        timeoutMs: this.timeoutMs,
        signal: options.signal,
        maxBytes:
          request.operation === 'CATALOG_QUERY_BOOTSTRAP'
            ? 128 * 1024
            : request.operation === 'CATALOG_QUERY_SERIES'
              ? 256 * 1024
              : request.operation === 'CATALOG_QUERY_UNITS'
                ? 512 * 1024
                : request.operation === 'CATALOG_QUERY_DETAIL'
                  ? 256 * 1024
                  : undefined,
        init: {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          credentials: 'same-origin',
          referrerPolicy: 'no-referrer',
        },
      })
    } catch (error) {
      if (!(error instanceof BoundedJsonFetchError)) throw error
      throw new CatalogDisplayTransportError(
        error.code,
        error.httpStatus === null || error.httpStatus >= 500,
        error.httpStatus,
      )
    }
    const errorStatus = declaredErrorStatus(response.payload)
    if (
      (response.ok && errorStatus !== null) ||
      (!response.ok && errorStatus !== response.status)
    ) {
      throw new CatalogDisplayTransportError(
        'HTTP_STATUS_MISMATCH',
        response.status >= 500,
        response.status,
      )
    }
    return response.payload
  }
}
