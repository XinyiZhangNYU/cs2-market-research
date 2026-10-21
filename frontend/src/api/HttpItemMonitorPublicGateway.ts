import { boundedJsonFetch, boundedJsonTimeout } from './boundedJsonFetch'
import type {
  ItemMonitorPublicGateway,
  ItemMonitorReadOptions,
  ItemMonitorTransportResponse,
} from './ItemMonitorPublicApi'
import type { ItemMonitorDecodeRequest } from '../wire/itemMonitorPublicApiDecode'

const PREFIX = '/api/v1/item-monitor/public'
const MAX_RESPONSE_BYTES = 1024 * 1024

function requestPath(request: ItemMonitorDecodeRequest): string {
  const search = new URLSearchParams()
  if (request.kind === 'DETAIL') {
    search.set('publication', request.query.publication_id)
    return `${PREFIX}/${request.query.analysis_unit_token}?${search}`
  }
  if (request.query.publication_id !== null) search.set('publication', request.query.publication_id)
  search.set('page_size', String(request.query.page_size))
  search.set('sort', request.query.sort)
  if (request.query.cursor !== null) search.set('cursor', request.query.cursor)
  return `${PREFIX}?${search}`
}

export class HttpItemMonitorPublicGateway implements ItemMonitorPublicGateway {
  readonly kind = 'HTTP_ITEM_MONITOR_PUBLIC' as const
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: { fetcher?: typeof fetch; timeoutMs?: number } = {}) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  async read(request: ItemMonitorDecodeRequest, options: ItemMonitorReadOptions = {}): Promise<ItemMonitorTransportResponse> {
    const response = await boundedJsonFetch(requestPath(request), {
      fetcher: this.fetcher,
      init: {
        method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store',
        credentials: 'same-origin', referrerPolicy: 'no-referrer', redirect: 'error',
      },
      signal: options.signal,
      timeoutMs: this.timeoutMs,
      maxBytes: MAX_RESPONSE_BYTES,
    })
    return Object.freeze({ payload: response.payload, httpStatus: response.status })
  }
}
