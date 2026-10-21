import fixture from '../../../schemas/examples/market-watchlist-public-watchlist.valid.json'
import type { MarketWatchlistPublicGateway, PublicResultReadOptions, PublicResultRequest, PublicResultTransportResponse } from '../../src/api/MarketWatchlistPublicApi'
import type { CatalogProjectionRow } from '../../src/contract/catalogBrowse'
import type { PublicResultErrorCode, PublicWatchlistResponse } from '../../src/wire/marketWatchlistPublicApiTypes'

export function publicItemResultFixture(identity?: CatalogProjectionRow): PublicWatchlistResponse {
  const source = structuredClone(fixture) as PublicWatchlistResponse
  if (identity) {
    return { ...source, members: [{ ...source.members[0]!, tie_break_key: identity.analysis_unit_id,
      result: { ...source.members[0]!.result, analysis_unit_id: identity.analysis_unit_id },
      catalog: { ...source.members[0]!.catalog, ...identity } }] }
  }
  return source
}

export class PublicItemResultTestGateway implements MarketWatchlistPublicGateway {
  readonly kind = 'SYNTHETIC_PUBLIC_ITEM_RESULT'
  readonly requests: PublicResultRequest[] = []
  constructor(readonly source = publicItemResultFixture(), readonly failure?: { at: 'WATCHLIST' | 'WATCHLIST_DETAIL'; code: PublicResultErrorCode }) {}
  async read(request: PublicResultRequest, _options: PublicResultReadOptions = {}): Promise<PublicResultTransportResponse> {
    this.requests.push(structuredClone(request))
    if (request.kind === this.failure?.at) {
      const code = this.failure.code
      return { httpStatus: ['NOT_FOUND', 'NOT_PUBLISHED'].includes(code) ? 404 : 503,
        payload: { api_contract: 'market-watchlist-public-api', api_version: 'v1', response_kind: 'ERROR',
          error: { code, retryable: ['BACKEND_UNAVAILABLE', 'PUBLICATION_EXPIRED'].includes(code) } } }
    }
    const source = structuredClone(this.source)
    if (request.kind === 'WATCHLIST') return { httpStatus: 200, payload: { ...source,
      query: { ...request.query, query_known_at: source.query.query_known_at, publication_id: source.publication.publication_id } } }
    if (request.kind === 'WATCHLIST_DETAIL') return { httpStatus: 200, payload: {
      api_contract: source.api_contract, api_version: source.api_version, response_kind: 'WATCHLIST_DETAIL',
      query: { ...request.query, query_known_at: source.query.query_known_at },
      publication: source.publication, member: source.members[0],
    } }
    throw new Error('unexpected synthetic public item operation')
  }
}
