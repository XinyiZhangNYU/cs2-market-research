import { afterEach, describe, expect, it, vi } from 'vitest'
import currentFixture from '../../schemas/examples/market-descriptive-public-api/v1/overview-current.json'
import emptyFixture from '../../schemas/examples/market-descriptive-public-api/v1/overview-empty.json'
import scopeFixture from '../../schemas/examples/market-descriptive-public-api/v1/scope-detail.json'
import notPublishedFixture from '../../schemas/examples/market-descriptive-public-api/v1/not-published.json'
import {
  HttpMarketDescriptivePublicGateway,
  MarketDescriptiveTransportError,
} from '../src/api/HttpMarketDescriptivePublicGateway'
import {
  MarketDescriptivePublicApi,
  type MarketDescriptivePublicGateway,
  type MarketDescriptiveTransportResponse,
} from '../src/api/MarketDescriptivePublicApi'
import type { MarketDescriptiveDecodeRequest } from '../src/wire/marketDescriptivePublicApiDecode'
import {
  decodeMarketDescriptiveDocument,
  isDecodedMarketDescriptiveDocument,
  MarketDescriptiveValidationError,
} from '../src/wire/marketDescriptivePublicApiDecode'

const PUBLICATION_ID = currentFixture.publication.publication_id
const SCOPE_TOKEN = currentFixture.scopes[0].scope_token

class FixtureGateway implements MarketDescriptivePublicGateway {
  readonly kind = 'FIXTURE'
  readonly requests: MarketDescriptiveDecodeRequest[] = []

  constructor(private readonly payload: unknown, private readonly httpStatus = 200) {}

  async read(request: MarketDescriptiveDecodeRequest): Promise<MarketDescriptiveTransportResponse> {
    expect(Object.isFrozen(request)).toBe(true)
    expect(Object.isFrozen(request.query)).toBe(true)
    this.requests.push(structuredClone(request))
    return { payload: structuredClone(this.payload), httpStatus: this.httpStatus }
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

afterEach(() => vi.restoreAllMocks())

describe('market-descriptive-public-api/v1 frontend boundary', () => {
  it('accepts and recursively seals RESULT and EMPTY examples', async () => {
    const current = await new MarketDescriptivePublicApi(new FixtureGateway(currentFixture)).overview({ publication_id: null })
    expect(current.response_kind).toBe('RESULT')
    expect(isDecodedMarketDescriptiveDocument(current)).toBe(true)
    expect(Object.isFrozen(current)).toBe(true)
    if (current.response_kind !== 'RESULT') throw new Error('unexpected response')
    expect(Object.isFrozen(current.scopes[0])).toBe(true)

    const empty = await new MarketDescriptivePublicApi(new FixtureGateway(emptyFixture)).overview({ publication_id: null })
    expect(empty.response_kind).toBe('EMPTY')
  })

  it('binds operation, publication, scope token and HTTP error status', async () => {
    const detail = await new MarketDescriptivePublicApi(new FixtureGateway(scopeFixture)).scope({
      publication_id: PUBLICATION_ID,
      scope_token: SCOPE_TOKEN,
    })
    expect(detail.response_kind).toBe('RESULT')
    if (detail.response_kind !== 'RESULT') throw new Error('unexpected response')
    expect(detail.operation).toBe('SCOPE')

    expect(() => decodeMarketDescriptiveDocument(
      scopeFixture,
      { kind: 'OVERVIEW', query: { publication_id: PUBLICATION_ID } },
      200,
    )).toThrow(MarketDescriptiveValidationError)
    expect(() => decodeMarketDescriptiveDocument(
      currentFixture,
      { kind: 'OVERVIEW', query: { publication_id: '9'.repeat(64) } },
      200,
    )).toThrow(MarketDescriptiveValidationError)
    expect(() => decodeMarketDescriptiveDocument(
      notPublishedFixture,
      { kind: 'OVERVIEW', query: { publication_id: null } },
      200,
    )).toThrow(MarketDescriptiveValidationError)
    const error = decodeMarketDescriptiveDocument(
      notPublishedFixture,
      { kind: 'OVERVIEW', query: { publication_id: null } },
      404,
    )
    expect(error.response_kind).toBe('ERROR')
  })

  it('rejects count, method, identity and private-field drift', () => {
    for (const mutate of [
      (payload: any) => { payload.scopes[0].paired_member_count = 101 },
      (payload: any) => { payload.scopes[0].return_selected_for_display = '0.02' },
      (payload: any) => { payload.scopes[0].scope_token = '9'.repeat(64) },
      (payload: any) => { payload.scopes[0].provider_url = 'https://private.invalid' },
    ]) {
      const payload = structuredClone(currentFixture)
      mutate(payload)
      expect(() => decodeMarketDescriptiveDocument(
        payload,
        { kind: 'OVERVIEW', query: { publication_id: null } },
        200,
      )).toThrow(MarketDescriptiveValidationError)
    }
  })

  it('rejects malformed request fields before transport', async () => {
    const gateway = new FixtureGateway(currentFixture)
    const api = new MarketDescriptivePublicApi(gateway)
    await expect(api.overview({ publication_id: 'bad' })).rejects.toThrow('invalid descriptive publication id')
    await expect(api.scope({ publication_id: PUBLICATION_ID, scope_token: 'bad' })).rejects.toThrow('invalid descriptive scope identity')
    await expect(api.overview(Object.assign({ publication_id: null }, { provider: 'private' }))).rejects.toThrow('invalid descriptive overview query')
    expect(gateway.requests).toHaveLength(0)
  })

  it('uses bounded same-origin GET routes with pinned publication and path scope identity', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(currentFixture))
      .mockResolvedValueOnce(jsonResponse(scopeFixture))
    const api = new MarketDescriptivePublicApi(new HttpMarketDescriptivePublicGateway({ fetcher }))
    await api.overview({ publication_id: PUBLICATION_ID })
    await api.scope({ publication_id: PUBLICATION_ID, scope_token: SCOPE_TOKEN })

    const overviewUrl = new URL(String(fetcher.mock.calls[0][0]), 'https://test.invalid')
    const scopeUrl = new URL(String(fetcher.mock.calls[1][0]), 'https://test.invalid')
    expect(overviewUrl.pathname).toBe('/api/v1/market-descriptive/public')
    expect(overviewUrl.searchParams.get('publication')).toBe(PUBLICATION_ID)
    expect(scopeUrl.pathname).toBe(`/api/v1/market-descriptive/public/scopes/${SCOPE_TOKEN}`)
    expect(scopeUrl.searchParams.get('publication')).toBe(PUBLICATION_ID)
    for (const [, init] of fetcher.mock.calls) {
      expect(init).toMatchObject({
        method: 'GET', cache: 'no-store', credentials: 'same-origin',
        referrerPolicy: 'no-referrer', redirect: 'error', headers: { Accept: 'application/json' },
      })
      expect(init?.signal).toBeInstanceOf(AbortSignal)
    }
  })

  it('classifies an origin outage as transport rather than result corruption', async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      transport_error: { code: 'ORIGIN_UNAVAILABLE', http_status: 503 },
    }, 503))
    const api = new MarketDescriptivePublicApi(new HttpMarketDescriptivePublicGateway({ fetcher }))
    await expect(api.overview({ publication_id: null })).rejects.toEqual(
      new MarketDescriptiveTransportError('HTTP_STATUS_MISMATCH', true, 503),
    )
  })
})
