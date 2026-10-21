import type { FxReferenceGateway, FxReferenceRequest } from './FxReferenceApi'
import {
  BoundedJsonFetchError,
  boundedJsonFetch,
  boundedJsonTimeout,
} from './boundedJsonFetch'

export const DEFAULT_FX_REFERENCE_API_URL = '/api/v1/fx/current'

export type FxReferenceTransportFailure =
  | 'NETWORK_UNAVAILABLE'
  | 'REQUEST_TIMEOUT'
  | 'INVALID_CONTENT_TYPE'
  | 'RESPONSE_TOO_LARGE'
  | 'INVALID_JSON_RESPONSE'
  | 'HTTP_STATUS_MISMATCH'

export class FxReferenceTransportError extends Error {
  constructor(
    readonly code: FxReferenceTransportFailure,
    readonly retryable: boolean,
    readonly httpStatus: number | null = null,
  ) {
    super(`FX reference gateway failed: ${code}`)
    this.name = 'FxReferenceTransportError'
  }
}

export type HttpFxReferenceGatewayOptions = Readonly<{
  url?: string
  fetcher?: typeof fetch
  timeoutMs?: number
}>

function normalizedUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('?') || trimmed.includes('#')) {
    throw new TypeError('FX reference URL must be a root-relative path without query or fragment')
  }
  return trimmed
}

function declaredErrorStatus(payload: unknown): number | null {
  if (payload === null || typeof payload !== 'object') return null
  const document = payload as Record<string, unknown>
  if (document.response_kind !== 'ERROR' || document.error === null || typeof document.error !== 'object') {
    return null
  }
  const status = (document.error as Record<string, unknown>).http_status
  return typeof status === 'number' && Number.isInteger(status) ? status : null
}

export class HttpFxReferenceGateway implements FxReferenceGateway {
  readonly kind = 'SAME_ORIGIN_FX_REFERENCE'
  private readonly url: string
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: HttpFxReferenceGatewayOptions = {}) {
    this.url = normalizedUrl(options.url ?? DEFAULT_FX_REFERENCE_API_URL)
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  async read(request: FxReferenceRequest): Promise<unknown> {
    let response: Awaited<ReturnType<typeof boundedJsonFetch>>
    try {
      const params = new URLSearchParams({ known_at: request.known_at })
      response = await boundedJsonFetch(`${this.url}?${params}`, {
        fetcher: this.fetcher,
        timeoutMs: this.timeoutMs,
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
      throw new FxReferenceTransportError(
        error.code,
        error.httpStatus === null || error.httpStatus >= 500,
        error.httpStatus,
      )
    }
    const errorStatus = declaredErrorStatus(response.payload)
    if ((response.ok && errorStatus !== null) || (!response.ok && errorStatus !== response.status)) {
      throw new FxReferenceTransportError(
        'HTTP_STATUS_MISMATCH', response.status >= 500, response.status,
      )
    }
    return response.payload
  }
}
