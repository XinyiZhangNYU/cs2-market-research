import { boundedJsonFetch, boundedJsonTimeout } from './boundedJsonFetch'
import {
  decodeNativeCnyIndexResponse,
  snapshotNativeCnyIndexRequest,
  type NativeCnyIndexReadResult,
  type NativeCnyIndexRequest,
} from '../wire/nativeCnyIndexPublicApi'
import { parsePriceJson } from '../wire/priceDisplayJson'

const DAY_PREFIX = '/api/v1/native-cny/index/day'
const HISTORY_PREFIX = '/api/v1/native-cny/index/history'

export type NativeCnyIndexReadOptions = Readonly<{ signal?: AbortSignal }>

// Instantiated by the market adapter. Constructor/import has no fetch side effect.
export class HttpNativeCnyIndexPublicGateway {
  readonly kind = 'HTTP_NATIVE_CNY_INDEX_PUBLIC_V1' as const
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: { fetcher?: typeof fetch; timeoutMs?: number } = {}) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  async read(request: NativeCnyIndexRequest, options: NativeCnyIndexReadOptions = {}): Promise<NativeCnyIndexReadResult> {
    const target = snapshotNativeCnyIndexRequest(request)
    const search = new URLSearchParams()
    if (target.kind === 'DAY') {
      search.set('publication', target.publication_id)
      search.set('scope', target.scope_code)
    } else if (target.kind !== 'CURRENT') {
      search.set('spec', target.spec_sha256)
      search.set('start', target.start_date)
      search.set('end', target.end_date)
      search.set('scope', target.scope_code)
    }
    const isDay = target.kind === 'DAY' || target.kind === 'CURRENT'
    const query = search.toString()
    const response = await boundedJsonFetch(
      `${isDay ? DAY_PREFIX : HISTORY_PREFIX}${query ? `?${query}` : ''}`,
      {
        fetcher: this.fetcher,
        init: { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store',
          credentials: 'same-origin', referrerPolicy: 'no-referrer', redirect: 'error' },
        signal: options.signal,
        timeoutMs: this.timeoutMs,
        maxBytes: (isDay ? 1 : 4) * 1024 * 1024,
        // Reuse the pure duplicate-key/unsafe-number-rejecting JSON parser.
        // Both wires use integer JSON counts and nullable decimal display strings;
        // this imports no price transport, USD endpoint or business consumer.
        parseJson: parsePriceJson,
      },
    )
    // One native request, one decode. Errors/404 never retry an old USD route.
    return decodeNativeCnyIndexResponse(response.payload, response.status, target)
  }
}
