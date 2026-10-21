import { afterEach, describe, expect, it, vi } from 'vitest'
import marketFixture from '../../schemas/examples/market-watchlist-public-market.valid.json'
import watchlistFixture from '../../schemas/examples/market-watchlist-public-watchlist.valid.json'
import errorFixture from '../../schemas/examples/market-watchlist-public-error.valid.json'
import { HttpMarketWatchlistPublicGateway } from '../src/api/HttpMarketWatchlistPublicGateway'
import {
  MarketWatchlistPublicApi,
  type MarketWatchlistPublicGateway,
  type PublicResultRequest,
  type PublicResultTransportResponse,
} from '../src/api/MarketWatchlistPublicApi'
import { priceAnalysisUnitToken } from '../src/wire/priceDisplayPrimitives'
import {
  decodePublicResultDocument,
  isDecodedPublicResultDocument,
  PublicResultValidationError,
} from '../src/wire/marketWatchlistPublicApiDecode'

const PUBLICATION_ID = watchlistFixture.publication.publication_id
const UNIT_ID = watchlistFixture.members[0].result.analysis_unit_id

function response(payload: unknown, httpStatus = 200): PublicResultTransportResponse {
  return { payload: structuredClone(payload), httpStatus }
}

class FixtureGateway implements MarketWatchlistPublicGateway {
  readonly kind = 'FIXTURE'
  readonly requests: PublicResultRequest[] = []

  constructor(
    private readonly payload: unknown,
    private readonly httpStatus = 200,
    private readonly mutate = false,
  ) {}

  async read(request: PublicResultRequest): Promise<PublicResultTransportResponse> {
    this.requests.push(structuredClone(request))
    if (this.mutate) {
      expect(Object.isFrozen(request)).toBe(true)
      expect(Object.isFrozen(request.query)).toBe(true)
      expect(() => Object.assign(request.query, { as_of: 'tampered' })).toThrow()
    }
    return response(this.payload, this.httpStatus)
  }
}

function detailFixture(): Record<string, unknown> {
  const source = structuredClone(watchlistFixture)
  return {
    api_contract: source.api_contract,
    api_version: source.api_version,
    response_kind: 'WATCHLIST_DETAIL',
    query: {
      as_of: null,
      query_known_at: source.query.query_known_at,
      publication_id: PUBLICATION_ID,
      analysis_unit_id: UNIT_ID,
    },
    publication: source.publication,
    member: source.members[0],
  }
}

function jsonResponse(payload: unknown, status = 200): Response {
  const body = JSON.stringify(payload)
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': String(new TextEncoder().encode(body).byteLength),
    },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('market-watchlist-public-api/v1 frontend boundary', () => {
  it('accepts and recursively seals the shared market and watchlist examples', async () => {
    const marketGateway = new FixtureGateway(marketFixture, 200, true)
    const market = await new MarketWatchlistPublicApi(marketGateway).market({ as_of: null })
    expect(market.response_kind).toBe('MARKET_OVERVIEW')
    expect(isDecodedPublicResultDocument(market)).toBe(true)
    expect(Object.isFrozen(market)).toBe(true)
    if (market.response_kind !== 'MARKET_OVERVIEW') throw new Error('unexpected response')
    expect(Object.isFrozen(market.sectors[0])).toBe(true)
    expect(market.sectors.map((sector) => sector.sector_code)).toEqual(['GLOVE', 'KNIFE', 'WEAPON'])

    const watchGateway = new FixtureGateway(watchlistFixture)
    const watchlist = await new MarketWatchlistPublicApi(watchGateway).watchlist({
      as_of: null,
      publication_id: null,
      sort: 'RANK_ASC',
      page_size: 50,
      cursor: null,
    })
    expect(watchlist.response_kind).toBe('WATCHLIST')
    if (watchlist.response_kind !== 'WATCHLIST') throw new Error('unexpected response')
    expect(watchlist.members[0].catalog.media).toEqual({
      status: 'BOUND',
      media_asset_version_id: '5',
      media_key: 'fixture/series-representative',
      presentation_kind: 'SERIES_REPRESENTATIVE',
    })
    expect(JSON.stringify(watchlist)).not.toMatch(/source_asset_ref|authority|provider|https?:\/\//iu)
  })

  it('binds response kind, query, publication and HTTP error status', async () => {
    const wrongKind = structuredClone(marketFixture) as Record<string, unknown>
    wrongKind.response_kind = 'WATCHLIST'
    expect(() => decodePublicResultDocument(
      wrongKind,
      { kind: 'MARKET_OVERVIEW', query: { as_of: null } },
      200,
    )).toThrow(PublicResultValidationError)

    const wrongPublication = structuredClone(watchlistFixture)
    wrongPublication.query.publication_id = '9'.repeat(64)
    expect(() => decodePublicResultDocument(
      wrongPublication,
      {
        kind: 'WATCHLIST',
        query: { as_of: null, publication_id: null, sort: 'RANK_ASC', page_size: 50, cursor: null },
      },
      200,
    )).toThrow(PublicResultValidationError)

    const api = new MarketWatchlistPublicApi(new FixtureGateway(errorFixture, 200))
    await expect(api.market({ as_of: null })).rejects.toThrow(PublicResultValidationError)
    const acceptedError = await new MarketWatchlistPublicApi(
      new FixtureGateway(errorFixture, 404),
    ).market({ as_of: null })
    expect(acceptedError).toEqual(errorFixture)
  })

  it('rejects clock, rank, catalog identity and private-field drift', () => {
    for (const mutate of [
      (payload: any) => { payload.publication.input_available_at = '2026-09-03T12:00:01.000000Z' },
      (payload: any) => { payload.members[0].rank = 0 },
      (payload: any) => { payload.members[0].catalog.analysis_unit_id = 'item:other' },
      (payload: any) => { payload.members[0].catalog.source_asset_ref = 'private' },
      (payload: any) => { payload.members[0].catalog.media.provider_url = 'https://provider.invalid/image' },
    ]) {
      const payload = structuredClone(watchlistFixture)
      mutate(payload)
      expect(() => decodePublicResultDocument(
        payload,
        {
          kind: 'WATCHLIST',
          query: { as_of: null, publication_id: null, sort: 'RANK_ASC', page_size: 50, cursor: null },
        },
        200,
      )).toThrow(PublicResultValidationError)
    }
  })

  it('rejects malformed or foreign request fields before calling a gateway', async () => {
    const gateway = new FixtureGateway(marketFixture)
    const api = new MarketWatchlistPublicApi(gateway)
    await expect(api.market({ as_of: 'not-a-time' })).rejects.toThrow('invalid market query')
    await expect(api.watchlist({
      as_of: null,
      publication_id: null,
      sort: 'RANK_ASC',
      page_size: 101,
      cursor: null,
    })).rejects.toThrow('invalid watchlist query')
    await expect(api.market(Object.assign({ as_of: null }, { provider_url: 'private' }))).rejects.toThrow(
      'invalid market query',
    )
    expect(gateway.requests).toHaveLength(0)
  })

  it('uses only same-origin bounded GET routes and keeps the unit out of the query string', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(marketFixture))
      .mockResolvedValueOnce(jsonResponse(watchlistFixture))
      .mockResolvedValueOnce(jsonResponse(detailFixture()))
    const gateway = new HttpMarketWatchlistPublicGateway({ fetcher })
    const api = new MarketWatchlistPublicApi(gateway)
    await api.market({ as_of: null })
    await api.watchlist({ as_of: null, publication_id: null, sort: 'RANK_ASC', page_size: 50, cursor: null })
    await api.watchlistDetail({ as_of: null, publication_id: PUBLICATION_ID, analysis_unit_id: UNIT_ID })

    expect(fetcher).toHaveBeenCalledTimes(3)
    const marketUrl = new URL(String(fetcher.mock.calls[0][0]), 'https://test.invalid')
    const listUrl = new URL(String(fetcher.mock.calls[1][0]), 'https://test.invalid')
    const detailUrl = new URL(String(fetcher.mock.calls[2][0]), 'https://test.invalid')
    expect(marketUrl.pathname).toBe('/api/v1/research-results/public/market')
    expect(listUrl.pathname).toBe('/api/v1/research-results/public/watchlist')
    expect(detailUrl.pathname).toBe(
      `/api/v1/research-results/public/watchlist/${priceAnalysisUnitToken(UNIT_ID)}`,
    )
    expect(detailUrl.searchParams.get('publication_id')).toBe(PUBLICATION_ID)
    expect(detailUrl.searchParams.has('analysis_unit_id')).toBe(false)
    expect(detailUrl.searchParams.has('as_of')).toBe(false)
    for (const [, init] of fetcher.mock.calls) {
      expect(init).toMatchObject({
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
        referrerPolicy: 'no-referrer',
        redirect: 'error',
        headers: { Accept: 'application/json' },
      })
      expect(init?.signal).toBeInstanceOf(AbortSignal)
    }
  })
})
