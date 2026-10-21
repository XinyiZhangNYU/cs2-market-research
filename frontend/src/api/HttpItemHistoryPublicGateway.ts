import { BoundedJsonFetchError, boundedJsonFetch, boundedJsonTimeout } from './boundedJsonFetch'
import {
  ItemHistoryAvailabilityError,
  type ItemHistoryPublicGateway,
  type ItemHistoryReadOptions,
  type ItemHistoryTransportResponse,
} from './ItemHistoryPublicApi'
import type { ItemHistoryDecodeRequest } from '../wire/itemHistoryPublicApiDecode'

const PREFIX = '/api/v1/item-monitor/history'
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024

function requestPath(request: ItemHistoryDecodeRequest): string {
  const search = new URLSearchParams()
  if (request.kind === 'DETAIL') {
    search.set('publication', request.query.publication_id)
    return `${PREFIX}/${request.query.history_event_token}?${search}`
  }
  if (request.query.publication_id !== null) search.set('publication', request.query.publication_id)
  search.set('page_size', String(request.query.page_size))
  search.set('sort', request.query.sort)
  if (request.query.name_query !== null) search.set('name', request.query.name_query)
  if (request.query.cursor !== null) search.set('cursor', request.query.cursor)
  return `${PREFIX}?${search}`
}

export class HttpItemHistoryPublicGateway implements ItemHistoryPublicGateway {
  readonly kind = 'HTTP_ITEM_HISTORY_PUBLIC' as const
  private readonly fetcher: typeof fetch
  private readonly timeoutMs: number

  constructor(options: { fetcher?: typeof fetch; timeoutMs?: number } = {}) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.timeoutMs = boundedJsonTimeout(options.timeoutMs ?? 15_000)
  }

  async read(request: ItemHistoryDecodeRequest, options: ItemHistoryReadOptions = {}): Promise<ItemHistoryTransportResponse> {
    try {
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
    } catch (error) {
      if (error instanceof BoundedJsonFetchError && error.httpStatus !== null && error.httpStatus >= 500) {
        throw new ItemHistoryAvailabilityError(error.httpStatus)
      }
      throw error
    }
  }
}
