import { boundedJsonFetch, boundedJsonTimeout } from './boundedJsonFetch'
import { checkedNativeCnySingleBinding, decodeNativeCnySingleDay, NativeCnySingleDecodeError,
  NATIVE_CNY_SINGLE_MAX_BYTES, parseNativeCnySingleJson } from '../wire/nativeCnySingleDecode'
import type { NativeCnySingleBinding, NativeCnySingleDay } from '../wire/nativeCnySingleDecode'

type SingleHttpCode = 'INVALID_REQUEST' | 'NOT_PUBLISHED' | 'TEMPORARILY_UNAVAILABLE'

export class NativeCnySingleHttpError extends Error {
  constructor(readonly httpStatus: number, readonly code: SingleHttpCode) {
    super(`native CNY single read failed: ${code} (${httpStatus})`)
    this.name = 'NativeCnySingleHttpError'
  }
}

/** Explicitly opt-in; no latest-publication selection or legacy/UI fallback. */
export class HttpNativeCnySingleGateway {
  readonly kind = 'HTTP_NATIVE_CNY_SINGLE' as const
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: { fetcher: typeof fetch; timeoutMs?: number }) {
    if (typeof options.fetcher !== 'function') throw new TypeError('an explicit single-item fetcher is required')
    this.fetcher = options.fetcher
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 5_000)
  }

  async read(binding: NativeCnySingleBinding, options: { signal?: AbortSignal } = {}): Promise<NativeCnySingleDay> {
    const expected = checkedNativeCnySingleBinding(binding)
    const query = new URLSearchParams({ item: expected.itemId, publication: expected.publicationId })
    const response = await boundedJsonFetch(`/api/v1/native-cny/single/day?${query}`, {
      fetcher: this.fetcher, timeoutMs: this.timeoutMs, signal: options.signal,
      maxBytes: NATIVE_CNY_SINGLE_MAX_BYTES, parseJson: parseNativeCnySingleJson,
      init: { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store',
        credentials: 'same-origin', referrerPolicy: 'no-referrer', redirect: 'error' },
    })
    if (response.status === 200 && response.ok) return decodeNativeCnySingleDay(response.payload, expected)
    const payload = response.payload
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)
      || Object.keys(payload).length !== 2 || !Object.hasOwn(payload, 'api_contract') || !Object.hasOwn(payload, 'error')) {
      throw new NativeCnySingleDecodeError('HTTP error envelope')
    }
    const error = payload as Record<string, unknown>
    const expectedCode = new Map<number, SingleHttpCode>([[400, 'INVALID_REQUEST'], [404, 'NOT_PUBLISHED'], [503, 'TEMPORARILY_UNAVAILABLE']]).get(response.status)
    if (error.api_contract !== 'native-cny-single-day/1' || expectedCode === undefined || error.error !== expectedCode) {
      throw new NativeCnySingleDecodeError('HTTP status/error binding')
    }
    throw new NativeCnySingleHttpError(response.status, expectedCode)
  }
}
