import type {
  FormalResultReadGateway,
  FormalResultReadRequest,
} from './FormalResultReadApi'
import type { GatewayReadOptions } from './GatewayReadOptions'
import {
  BoundedJsonFetchError,
  boundedJsonFetch,
  boundedJsonTimeout,
} from './boundedJsonFetch'

export const DEFAULT_LOCAL_RESULT_API_BASE_URL =
  '/api/v1/research-results'

export type ResultGatewayTransportFailure =
  | 'NETWORK_UNAVAILABLE'
  | 'REQUEST_TIMEOUT'
  | 'INVALID_CONTENT_TYPE'
  | 'RESPONSE_TOO_LARGE'
  | 'INVALID_JSON_RESPONSE'
  | 'HTTP_STATUS_MISMATCH'

export class ResultGatewayTransportError extends Error {
  constructor(
    readonly code: ResultGatewayTransportFailure,
    readonly retryable: boolean,
    readonly httpStatus: number | null = null,
  ) {
    super(`result read gateway failed: ${code}`)
    this.name = 'ResultGatewayTransportError'
  }
}

export type HttpFormalResultReadGatewayOptions = Readonly<{
  baseUrl?: string
  fetcher?: typeof fetch
  timeoutMs?: number
}>

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function normalizedLocalBaseUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes('?') || trimmed.includes('#')) {
    throw new TypeError('local result API base URL must be a path without query or fragment')
  }

  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//')) {
      throw new TypeError('local result API base URL cannot be protocol-relative')
    }
    return trimmed.replace(/\/+$/, '')
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new TypeError('local result API base URL must be same-origin or loopback')
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    !LOOPBACK_HOSTS.has(parsed.hostname) ||
    parsed.username ||
    parsed.password
  ) {
    throw new TypeError('local result API base URL must be same-origin or loopback')
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`
}

function appendOptional(
  params: URLSearchParams,
  name: string,
  value: string | null,
): void {
  if (value !== null) params.set(name, value)
}

function requestUrl(baseUrl: string, request: FormalResultReadRequest): string {
  const params = new URLSearchParams()
  if (request.operation === 'UNIT_DETAIL') {
    params.set('as_of', request.as_of)
    return `${baseUrl}/units/${encodeURIComponent(request.analysis_unit_id)}?${params}`
  }
  if (request.operation === 'COLLECTION_DETAIL') {
    params.set('as_of', request.as_of)
    return `${baseUrl}/collections/${encodeURIComponent(request.collection_id)}?${params}`
  }
  if (request.operation === 'QUALITY_DETAIL') {
    params.set('as_of', request.as_of)
    return `${baseUrl}/quality/${encodeURIComponent(request.analysis_unit_id)}?${params}`
  }

  if (request.operation === 'QUALITY_LIST') {
    params.set('as_of', request.query.as_of)
    appendOptional(params, 'analysis_unit_kind', request.query.analysis_unit_kind)
    appendOptional(params, 'edition_kind', request.query.edition_kind)
    appendOptional(
      params,
      'parent_analysis_unit_id',
      request.query.parent_analysis_unit_id,
    )
    params.set('sort', request.query.sort)
    params.set('page_size', String(request.query.page_size))
    appendOptional(params, 'cursor', request.cursor)
    return `${baseUrl}/quality?${params}`
  }

  params.set('as_of', request.query.as_of)
  appendOptional(params, 'scope_kind', request.query.scope_kind)
  appendOptional(params, 'analysis_unit_kind', request.query.analysis_unit_kind)
  appendOptional(params, 'edition_kind', request.query.edition_kind)
  appendOptional(
    params,
    'parent_analysis_unit_id',
    request.query.parent_analysis_unit_id,
  )
  appendOptional(params, 'data_status', request.query.data_status)
  params.set('sort', request.query.sort)
  params.set('page_size', String(request.query.page_size))
  appendOptional(params, 'cursor', request.cursor)
  return `${baseUrl}/units?${params}`
}

function declaredErrorStatus(payload: unknown): number | null {
  if (payload === null || typeof payload !== 'object') return null
  const candidate = payload as Record<string, unknown>
  if (candidate.response_kind !== 'ERROR') return null
  if (candidate.error === null || typeof candidate.error !== 'object') return null
  const status = (candidate.error as Record<string, unknown>).http_status
  return typeof status === 'number' && Number.isInteger(status) ? status : null
}

/**
 * Browser transport for the read-only Result API.
 *
 * The payload deliberately remains `unknown`: FormalResultReadApi still owns the outer schema,
 * nested envelope, canonical hash, semantic and request-binding checks. This gateway only maps a
 * typed request to GET, enforces same-origin or explicit loopback transport, and binds the HTTP
 * status to a controlled
 * ERROR response without reflecting response bodies or URLs into thrown errors.
 */
export class HttpFormalResultReadGateway implements FormalResultReadGateway {
  readonly kind = 'LOCAL_RESULT_API' as const
  private readonly baseUrl: string
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: HttpFormalResultReadGatewayOptions = {}) {
    this.baseUrl = normalizedLocalBaseUrl(
      options.baseUrl ?? DEFAULT_LOCAL_RESULT_API_BASE_URL,
    )
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  async read(
    request: FormalResultReadRequest,
    options: GatewayReadOptions = {},
  ): Promise<unknown> {
    let response: Awaited<ReturnType<typeof boundedJsonFetch>>
    try {
      response = await boundedJsonFetch(requestUrl(this.baseUrl, request), {
        fetcher: this.fetcher,
        timeoutMs: this.timeoutMs,
        signal: options.signal,
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
      throw new ResultGatewayTransportError(
        error.code,
        error.httpStatus === null || error.httpStatus >= 500,
        error.httpStatus,
      )
    }

    const errorStatus = declaredErrorStatus(response.payload)
    if ((response.ok && errorStatus !== null) || (!response.ok && errorStatus !== response.status)) {
      throw new ResultGatewayTransportError(
        'HTTP_STATUS_MISMATCH',
        response.status >= 500,
        response.status,
      )
    }
    return response.payload
  }
}
