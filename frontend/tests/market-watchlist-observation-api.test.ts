import { afterEach, describe, expect, it, vi } from 'vitest'
import watchlistFixture from '../../schemas/examples/market-watchlist-public-observation-watchlist.valid.json'
import emptyFixture from '../../schemas/examples/market-watchlist-public-observation-empty.valid.json'
import staleFixture from '../../schemas/examples/market-watchlist-public-observation-stale.valid.json'
import detailFixture from '../../schemas/examples/market-watchlist-public-observation-detail.valid.json'
import errorFixture from '../../schemas/examples/market-watchlist-public-observation-error.valid.json'
import invalidQueryFixture from '../../schemas/examples/market-watchlist-public-observation-invalid-query.valid.json'
import unavailableFixture from '../../schemas/examples/market-watchlist-public-observation-unavailable.valid.json'
import corruptFixture from '../../schemas/examples/market-watchlist-public-observation-corrupt.valid.json'
import { BoundedJsonFetchError } from '../src/api/boundedJsonFetch'
import { HttpMarketWatchlistObservationGateway } from '../src/api/HttpMarketWatchlistObservationGateway'
import {
  MarketWatchlistObservationApi,
  type MarketWatchlistObservationGateway,
  type ObservationRequest,
  type TransportResponse,
} from '../src/api/MarketWatchlistObservationApi'
import {
  decodePublicObservationDocument,
  isDecodedPublicObservationDocument,
  PublicObservationValidationError,
} from '../src/wire/marketWatchlistObservationApiDecode'
import { priceAnalysisUnitToken } from '../src/wire/priceDisplayPrimitives'

const PUBLICATION_ID = watchlistFixture.publication.publication_id
const UNIT_ID = watchlistFixture.members[0].analysis_unit_id
const LIST_QUERY = Object.freeze({
  as_of: null,
  publication_id: null,
  sort: 'SIGNAL_TIME_DESC' as const,
  page_size: 50,
  cursor: null,
})

function response(payload: unknown, httpStatus = 200): TransportResponse {
  return { payload: structuredClone(payload), httpStatus }
}

class FixtureGateway implements MarketWatchlistObservationGateway {
  readonly kind = 'FIXTURE'
  readonly requests: ObservationRequest[] = []

  constructor(
    private readonly payload: unknown,
    private readonly httpStatus = 200,
    private readonly assertSealedRequest = false,
  ) {}

  async read(request: ObservationRequest): Promise<TransportResponse> {
    this.requests.push(structuredClone(request))
    if (this.assertSealedRequest) {
      expect(Object.isFrozen(request)).toBe(true)
      expect(Object.isFrozen(request.query)).toBe(true)
      expect(() => Object.assign(request.query, { publication_id: '9'.repeat(64) })).toThrow()
    }
    return response(this.payload, this.httpStatus)
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

describe('market-watchlist-public-observation-api/v1 frontend boundary', () => {
  it('accepts and recursively seals positive, empty, stale and detail fixtures', async () => {
    const watchlist = await new MarketWatchlistObservationApi(
      new FixtureGateway(watchlistFixture, 200, true),
    ).watchlist(LIST_QUERY)
    expect(watchlist.response_kind).toBe('OBSERVATION_WATCHLIST')
    expect(isDecodedPublicObservationDocument(watchlist)).toBe(true)
    expect(Object.isFrozen(watchlist)).toBe(true)
    if (watchlist.response_kind !== 'OBSERVATION_WATCHLIST') throw new Error('unexpected response')
    expect(Object.isFrozen(watchlist.members)).toBe(true)
    expect(Object.isFrozen(watchlist.members[0].catalog.localized_name)).toBe(true)
    expect(watchlist.members[0].lane).toBe('OBSERVATION')
    expect(watchlist.members[0].validation_status).toBe('SHADOW_UNVALIDATED')

    const empty = await new MarketWatchlistObservationApi(
      new FixtureGateway(emptyFixture),
    ).watchlist(LIST_QUERY)
    expect(empty).toMatchObject({ response_kind: 'OBSERVATION_WATCHLIST', total: 0, members: [] })

    const stale = await new MarketWatchlistObservationApi(
      new FixtureGateway(staleFixture),
    ).watchlist(LIST_QUERY)
    expect(stale.response_kind === 'OBSERVATION_WATCHLIST' && stale.publication.freshness).toBe(
      'STALE_RETAINED',
    )

    const detail = await new MarketWatchlistObservationApi(
      new FixtureGateway(detailFixture),
    ).detail({ publication_id: PUBLICATION_ID, analysis_unit_id: UNIT_ID })
    expect(detail.response_kind).toBe('OBSERVATION_DETAIL')
    expect(isDecodedPublicObservationDocument(detail)).toBe(true)
    if (detail.response_kind !== 'OBSERVATION_DETAIL') throw new Error('unexpected response')
    expect(Object.isFrozen(detail.member.reason_codes)).toBe(true)
  })

  it('binds response kind, query, publication, member and HTTP error status', async () => {
    const wrongKind = structuredClone(watchlistFixture) as Record<string, unknown>
    wrongKind.response_kind = 'OBSERVATION_DETAIL'
    expect(() => decodePublicObservationDocument(
      wrongKind,
      { kind: 'OBSERVATION_WATCHLIST', query: LIST_QUERY },
      200,
    )).toThrow(PublicObservationValidationError)

    const wrongPublication = structuredClone(watchlistFixture)
    wrongPublication.query.publication_id = '9'.repeat(64)
    expect(() => decodePublicObservationDocument(
      wrongPublication,
      { kind: 'OBSERVATION_WATCHLIST', query: LIST_QUERY },
      200,
    )).toThrow(PublicObservationValidationError)

    const wrongMember = structuredClone(detailFixture)
    wrongMember.query.analysis_unit_id = 'item:other'
    expect(() => decodePublicObservationDocument(
      wrongMember,
      {
        kind: 'OBSERVATION_DETAIL',
        query: { publication_id: PUBLICATION_ID, analysis_unit_id: UNIT_ID },
      },
      200,
    )).toThrow(PublicObservationValidationError)

    for (const [fixture, status] of [
      [errorFixture, 404],
      [invalidQueryFixture, 400],
      [unavailableFixture, 503],
      [corruptFixture, 503],
    ] as const) {
      const document = await new MarketWatchlistObservationApi(
        new FixtureGateway(fixture, status),
      ).watchlist(LIST_QUERY)
      expect(document.response_kind).toBe('ERROR')
    }

    for (const code of ['PUBLICATION_EXPIRED', 'PUBLICATION_WITHDRAWN'] as const) {
      const fixture = structuredClone(errorFixture)
      fixture.error.code = code
      const document = await new MarketWatchlistObservationApi(
        new FixtureGateway(fixture, 410),
      ).watchlist(LIST_QUERY)
      expect(document).toMatchObject({ response_kind: 'ERROR', error: { code } })
    }

    await expect(new MarketWatchlistObservationApi(
      new FixtureGateway(errorFixture, 200),
    ).watchlist(LIST_QUERY)).rejects.toThrow(PublicObservationValidationError)

    const wrongRetryability = structuredClone(unavailableFixture)
    wrongRetryability.error.retryable = false
    await expect(new MarketWatchlistObservationApi(
      new FixtureGateway(wrongRetryability, 503),
    ).watchlist(LIST_QUERY)).rejects.toThrow(PublicObservationValidationError)
  })

  it('rejects clock, order, coverage, identity and private-field drift', () => {
    const mutations = [
      (payload: any) => { payload.publication.known_at = '2026-09-06T11:59:59.000000Z' },
      (payload: any) => { payload.publication.freshness = 'STALE_RETAINED' },
      (payload: any) => { payload.publication.source_coverage.observed_source_count = 2 },
      (payload: any) => { payload.members[0].known_at = '2026-09-06T12:00:31.000000Z' },
      (payload: any) => { payload.members[0].catalog.analysis_unit_id = 'item:other' },
      (payload: any) => { payload.members[0].catalog.catalog_version = 'other-catalog' },
      (payload: any) => { payload.members[0].position = 2 },
      (payload: any) => { payload.members[0].recommendation = 'WATCH' },
      (payload: any) => { payload.source_ledger = { sha256: 'private' } },
      (payload: any) => { payload.members[0].catalog.source_asset_ref = 'private' },
      (payload: any) => { payload.members[0].catalog.media.provider_url = 'https://provider.invalid/image' },
    ]
    for (const mutate of mutations) {
      const payload = structuredClone(watchlistFixture)
      mutate(payload)
      expect(() => decodePublicObservationDocument(
        payload,
        { kind: 'OBSERVATION_WATCHLIST', query: LIST_QUERY },
        200,
      )).toThrow(PublicObservationValidationError)
    }

    const unordered = structuredClone(watchlistFixture)
    const second = structuredClone(unordered.members[0])
    second.position = 2
    second.observation_id = '6'.repeat(64)
    second.analysis_unit_id = 'item:fixture-002'
    second.catalog.analysis_unit_id = second.analysis_unit_id
    second.signal_observed_at = '2026-09-06T11:59:00.000000Z'
    unordered.total = 2
    unordered.members.push(second)
    expect(() => decodePublicObservationDocument(
      unordered,
      { kind: 'OBSERVATION_WATCHLIST', query: LIST_QUERY },
      200,
    )).toThrow(PublicObservationValidationError)
  })

  it('rejects every impossible response instant even when it matches the wire pattern', () => {
    const mutations = [
      (payload: any) => { payload.query.query_known_at = '2026-02-31T12:05:00.000000Z' },
      (payload: any) => { payload.publication.as_of = '2026-02-31T12:00:00.000000Z' },
      (payload: any) => { payload.publication.known_at = '2026-02-31T12:00:30.000000Z' },
      (payload: any) => { payload.publication.public_available_at = '2026-02-31T12:01:00.000000Z' },
      (payload: any) => { payload.publication.published_at = '2026-02-31T12:02:00.000000Z' },
      (payload: any) => { payload.publication.fresh_until = '2026-02-31T13:01:00.000000Z' },
      (payload: any) => { payload.publication.retain_until = '2026-02-31T12:01:00.000000Z' },
      (payload: any) => { payload.publication.catalog.as_of = '2026-02-31T11:55:00.000000Z' },
      (payload: any) => { payload.publication.catalog.available_at = '2026-02-31T11:56:00.000000Z' },
      (payload: any) => { payload.members[0].signal_observed_at = '2026-02-31T11:58:00.000000Z' },
      (payload: any) => { payload.members[0].known_at = '2026-02-31T11:59:00.000000Z' },
    ]
    for (const mutate of mutations) {
      const payload = structuredClone(watchlistFixture)
      mutate(payload)
      expect(() => decodePublicObservationDocument(
        payload,
        { kind: 'OBSERVATION_WATCHLIST', query: LIST_QUERY },
        200,
      )).toThrow(PublicObservationValidationError)
    }
  })

  it('rejects malformed or foreign request fields before calling the gateway', async () => {
    const gateway = new FixtureGateway(watchlistFixture)
    const api = new MarketWatchlistObservationApi(gateway)
    await expect(api.watchlist({ ...LIST_QUERY, as_of: '2026-02-31T00:00:00.000000Z' }))
      .rejects.toThrow('invalid observation watchlist query')
    await expect(api.watchlist({ ...LIST_QUERY, page_size: 101 }))
      .rejects.toThrow('invalid observation watchlist query')
    await expect(api.watchlist({ ...LIST_QUERY, cursor: '' }))
      .rejects.toThrow('invalid observation watchlist query')
    await expect(api.watchlist(Object.assign({}, LIST_QUERY, { provider_url: 'private' })))
      .rejects.toThrow('invalid observation watchlist query')
    await expect(api.detail({ publication_id: 'bad', analysis_unit_id: UNIT_ID }))
      .rejects.toThrow('invalid observation detail query')
    expect(gateway.requests).toHaveLength(0)
  })

  it('uses same-origin bounded GET routes with the detail identity only in the path', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(watchlistFixture))
      .mockResolvedValueOnce(jsonResponse(detailFixture))
    const api = new MarketWatchlistObservationApi(
      new HttpMarketWatchlistObservationGateway({ fetcher }),
    )
    await api.watchlist(LIST_QUERY)
    await api.detail({ publication_id: PUBLICATION_ID, analysis_unit_id: UNIT_ID })

    expect(fetcher).toHaveBeenCalledTimes(2)
    const listUrl = new URL(String(fetcher.mock.calls[0][0]), 'https://test.invalid')
    const detailUrl = new URL(String(fetcher.mock.calls[1][0]), 'https://test.invalid')
    expect(listUrl.pathname).toBe('/api/v1/research-observations/public/watchlist')
    expect(listUrl.searchParams.get('sort')).toBe('SIGNAL_TIME_DESC')
    expect(listUrl.searchParams.get('page_size')).toBe('50')
    expect(detailUrl.pathname).toBe(
      `/api/v1/research-observations/public/watchlist/${priceAnalysisUnitToken(UNIT_ID)}`,
    )
    expect(detailUrl.searchParams.get('publication_id')).toBe(PUBLICATION_ID)
    expect(detailUrl.searchParams.has('analysis_unit_id')).toBe(false)
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

  it('enforces the 1 MiB body bound and never retries transport failures', async () => {
    const oversizedFetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(1024 * 1024 + 1),
      },
    }))
    const oversized = new MarketWatchlistObservationApi(
      new HttpMarketWatchlistObservationGateway({ fetcher: oversizedFetcher }),
    )
    await expect(oversized.watchlist(LIST_QUERY)).rejects.toMatchObject({
      name: 'BoundedJsonFetchError',
      code: 'RESPONSE_TOO_LARGE',
    } satisfies Partial<BoundedJsonFetchError>)
    expect(oversizedFetcher).toHaveBeenCalledTimes(1)

    const failedFetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline'))
    const failed = new MarketWatchlistObservationApi(
      new HttpMarketWatchlistObservationGateway({ fetcher: failedFetcher }),
    )
    await expect(failed.watchlist(LIST_QUERY)).rejects.toMatchObject({
      name: 'BoundedJsonFetchError',
      code: 'NETWORK_UNAVAILABLE',
    } satisfies Partial<BoundedJsonFetchError>)
    expect(failedFetcher).toHaveBeenCalledTimes(1)
  })
})
