import type {
  ValveEventsGateway,
  ValveEventsRequest,
  ValveEventsReadOptions,
} from './ValveEventsApi'
import {
  BoundedJsonFetchError,
  boundedJsonFetch,
  boundedJsonTimeout,
  type BoundedJsonFetchFailure,
} from './boundedJsonFetch'

export const DEFAULT_VALVE_EVENT_API_BASE_URL = '/api/v1/valve-events'
export const VALVE_EVENT_LIST_PAGE_SIZE = 100
export const VALVE_EVENT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024

export type ValveEventTransportFailure =
  | BoundedJsonFetchFailure
  | 'HTTP_STATUS_MISMATCH'
  | 'INVALID_REQUEST'

export class ValveEventTransportError extends Error {
  constructor(
    readonly code: ValveEventTransportFailure,
    readonly retryable: boolean,
    readonly httpStatus: number | null = null,
  ) {
    super(`Valve event read gateway failed: ${code}`)
    this.name = 'ValveEventTransportError'
  }
}

export type HttpValveEventsGatewayOptions = Readonly<{
  baseUrl?: string
  fetcher?: typeof fetch
  timeoutMs?: number
  /** Summary consumers such as the home page read a short first page instead of the full list. */
  listPageSize?: number
}>

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const SHA256 = /^[0-9a-f]{64}$/u

function normalizedBaseUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes('?') || trimmed.includes('#')) {
    throw new TypeError('Valve event API base URL must omit query and fragment')
  }
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//')) {
      throw new TypeError('Valve event API base URL cannot be protocol-relative')
    }
    return trimmed.replace(/\/+$/u, '')
  }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new TypeError('Valve event API base URL must be same-origin or loopback')
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    !LOOPBACK_HOSTS.has(parsed.hostname) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new TypeError('Valve event API base URL must be same-origin or loopback')
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/u, '')}`
}

function requestUrl(baseUrl: string, request: ValveEventsRequest, listPageSize: number): string {
  if (request.operation === 'DETAIL') {
    if (!SHA256.test(request.event_id)) {
      throw new ValveEventTransportError('INVALID_REQUEST', false)
    }
    return `${baseUrl}/${request.event_id}`
  }
  if (
    request.cursor !== null &&
    (!request.cursor || new TextEncoder().encode(request.cursor).byteLength > 1_024)
  ) {
    throw new ValveEventTransportError('INVALID_REQUEST', false)
  }
  const query = new URLSearchParams({ limit: String(listPageSize) })
  if (request.cursor !== null) query.set('cursor', request.cursor)
  const url = `${baseUrl}?${query}`
  if (new TextEncoder().encode(url).byteLength > 16_384) {
    throw new ValveEventTransportError('INVALID_REQUEST', false)
  }
  return url
}

export class HttpValveEventsGateway implements ValveEventsGateway {
  readonly kind = 'READ_ONLY_HTTP' as const
  private readonly baseUrl: string
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number
  private readonly listPageSize: number

  constructor(options: HttpValveEventsGatewayOptions = {}) {
    this.baseUrl = normalizedBaseUrl(
      options.baseUrl ?? DEFAULT_VALVE_EVENT_API_BASE_URL,
    )
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
    const listPageSize = options.listPageSize ?? VALVE_EVENT_LIST_PAGE_SIZE
    if (!Number.isInteger(listPageSize) || listPageSize < 1 || listPageSize > VALVE_EVENT_LIST_PAGE_SIZE) {
      throw new TypeError('Valve event list page size must be an integer from 1 to 100')
    }
    this.listPageSize = listPageSize
  }

  async read(request: ValveEventsRequest, options: ValveEventsReadOptions = {}): Promise<unknown> {
    let response: Awaited<ReturnType<typeof boundedJsonFetch>>
    try {
      response = await boundedJsonFetch(requestUrl(this.baseUrl, request, this.listPageSize), {
        fetcher: this.fetcher,
        signal: options.signal,
        timeoutMs: this.timeoutMs,
        maxBytes: VALVE_EVENT_MAX_RESPONSE_BYTES,
        init: {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          credentials: 'same-origin',
          referrerPolicy: 'no-referrer',
          redirect: 'error',
        },
      })
    } catch (error) {
      if (error instanceof ValveEventTransportError) throw error
      if (!(error instanceof BoundedJsonFetchError)) throw error
      throw new ValveEventTransportError(
        error.code,
        error.httpStatus === null || error.httpStatus >= 500,
        error.httpStatus,
      )
    }
    if (!response.ok) {
      throw new ValveEventTransportError(
        'HTTP_STATUS_MISMATCH',
        response.status >= 500,
        response.status,
      )
    }
    return response.payload
  }
}
