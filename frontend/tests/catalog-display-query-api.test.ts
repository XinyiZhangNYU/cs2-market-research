import bootstrapFixture from '../../schemas/examples/catalog-display-query-bootstrap.valid.json'
import detailFixture from '../../schemas/examples/catalog-display-query-detail.valid.json'
import errorFixture from '../../schemas/examples/catalog-display-query-error.valid.json'
import seriesFixture from '../../schemas/examples/catalog-display-query-series.valid.json'
import unitsFixture from '../../schemas/examples/catalog-display-query-units.valid.json'
import {
  CatalogDisplayApi,
  CatalogDisplayRequestBindingViolation,
  type CatalogDisplayGateway,
  type CatalogDisplayGatewayRequest,
  type CatalogDisplayQueryGatewayRequest,
} from '../src/api/CatalogDisplayApi'
import {
  CatalogDisplayTransportError,
  HttpCatalogDisplayGateway,
} from '../src/api/HttpCatalogDisplayGateway'
import {
  CatalogDisplayQuerySemanticViolation,
  CatalogDisplayQueryWireViolation,
  decodeCatalogDisplayQueryApiResponse,
  isValidatedCatalogDisplayQueryResponse,
  normalizeCatalogQueryText,
} from '../src/wire/catalogDisplayQueryApiDecode'
import type {
  WireCatalogBootstrapResponse,
  WireCatalogDetailResponse,
  WireCatalogDisplayQueryResponse,
  WireCatalogSeriesQuery,
  WireCatalogSeriesResponse,
  WireCatalogUnitsQuery,
  WireCatalogUnitsResponse,
} from '../src/wire/catalogDisplayQueryApiTypes'

function queryFixture<T extends WireCatalogDisplayQueryResponse>(value: unknown): T {
  return structuredClone(value) as T
}

function semanticFixture<T extends WireCatalogDisplayQueryResponse>(value: unknown): T {
  const response = queryFixture<T>(value)
  if (response.response_kind === 'CATALOG_QUERY_BOOTSTRAP') {
    response.image_counts = { bound: 1, not_produced: 1, total: 2 }
  } else if (response.response_kind === 'CATALOG_QUERY_SERIES') {
    response.snapshot.catalog_version = response.members[0].representative.projection.catalog_version
  } else if (response.response_kind === 'CATALOG_QUERY_UNITS') {
    response.snapshot.catalog_version = response.members[0].projection.catalog_version
  } else if (response.response_kind === 'CATALOG_QUERY_DETAIL') {
    response.snapshot.catalog_version = response.member.projection.catalog_version
  }
  return response
}

class QueryFixtureGateway implements CatalogDisplayGateway {
  readonly kind = 'QUERY_TEST'
  readonly requests: (CatalogDisplayGatewayRequest | CatalogDisplayQueryGatewayRequest)[] = []

  constructor(private readonly payload: unknown) {}

  async read(request: CatalogDisplayGatewayRequest): Promise<unknown> {
    this.requests.push(request)
    return structuredClone(this.payload)
  }

  async readQuery(request: CatalogDisplayQueryGatewayRequest): Promise<unknown> {
    this.requests.push(request)
    return structuredClone(this.payload)
  }
}

describe('snapshot-bound catalog query API', () => {
  it('accepts and freezes every query response shape after its semantic gates', () => {
    // Shared fixtures exercise wire shape and deliberately reuse generic
    // descriptor bytes. Align their cross-document facts for the stricter
    // frontend semantic gate.
    const responses = [
      semanticFixture<WireCatalogBootstrapResponse>(bootstrapFixture),
      semanticFixture<WireCatalogSeriesResponse>(seriesFixture),
      semanticFixture<WireCatalogUnitsResponse>(unitsFixture),
      semanticFixture<WireCatalogDetailResponse>(detailFixture),
      semanticFixture(errorFixture),
    ]

    for (const payload of responses) {
      const response = decodeCatalogDisplayQueryApiResponse(payload)
      expect(isValidatedCatalogDisplayQueryResponse(response, response.response_kind)).toBe(true)
      expect(Object.isFrozen(response)).toBe(true)
    }
  })

  it('normalizes search exactly with NFKC, ECMAScript whitespace and default lowercase', () => {
    expect(normalizeCatalogQueryText('\ufeff  ＤＲＡＧＯＮ\u3000Lore  ')).toBe('dragon lore')
    expect(normalizeCatalogQueryText('İTEM\u00a0\u00a0Name')).toBe('i̇tem name')
  })

  it('rejects unknown fields, profile drift and mixed snapshot identities', () => {
    const unknown = queryFixture<WireCatalogSeriesResponse>(seriesFixture) as unknown as Record<string, unknown>
    unknown.provider_url = 'forbidden'
    expect(() => decodeCatalogDisplayQueryApiResponse(unknown)).toThrow(
      CatalogDisplayQueryWireViolation,
    )

    const profileDrift = semanticFixture<WireCatalogSeriesResponse>(seriesFixture)
    profileDrift.profiles.navigation_sha256 = 'c'.repeat(64)
    expect(() => decodeCatalogDisplayQueryApiResponse(profileDrift)).toThrowError(
      expect.objectContaining({ rule: 'PROFILE_BINDING' }),
    )

    const mixedSnapshot = semanticFixture<WireCatalogSeriesResponse>(seriesFixture)
    mixedSnapshot.query.snapshot_id = 'c'.repeat(64)
    expect(() => decodeCatalogDisplayQueryApiResponse(mixedSnapshot)).toThrowError(
      expect.objectContaining({ rule: 'SNAPSHOT_BINDING' }),
    )
  })

  it('rejects member/filter, facet and page-accounting drift', () => {
    const wrongSeries = semanticFixture<WireCatalogUnitsResponse>(unitsFixture)
    wrongSeries.query.base_item_code = 'fixture.weapon.other-series'
    expect(() => decodeCatalogDisplayQueryApiResponse(wrongSeries)).toThrowError(
      expect.objectContaining({ rule: 'QUERY_MEMBER_MATCH' }),
    )

    const wrongFacet = semanticFixture<WireCatalogUnitsResponse>(unitsFixture)
    wrongFacet.facet.eligible_member_count = 2
    expect(() => decodeCatalogDisplayQueryApiResponse(wrongFacet)).toThrowError(
      expect.objectContaining({ rule: 'FACET_ACCOUNTING' }),
    )

    const underfilled = semanticFixture<WireCatalogSeriesResponse>(seriesFixture)
    underfilled.next_cursor = 'next'
    underfilled.query.page_size = 2
    expect(() => decodeCatalogDisplayQueryApiResponse(underfilled)).toThrow(
      CatalogDisplayQuerySemanticViolation,
    )

    const wrongSearch = semanticFixture<WireCatalogSeriesResponse>(seriesFixture)
    wrongSearch.query.search_text = 'ＤＲＡＧＯＮ  Lore'
    wrongSearch.query.search_normalized = 'not-the-normalized-query'
    expect(() => decodeCatalogDisplayQueryApiResponse(wrongSearch)).toThrowError(
      expect.objectContaining({ rule: 'QUERY_SHAPE' }),
    )

    const wrongWear = semanticFixture<WireCatalogSeriesResponse>(seriesFixture)
    wrongWear.query.wear_tier = 'FACTORY_NEW'
    expect(() => decodeCatalogDisplayQueryApiResponse(wrongWear)).toThrowError(
      expect.objectContaining({ rule: 'QUERY_MEMBER_MATCH' }),
    )

    const unorderedFilters = semanticFixture<WireCatalogUnitsResponse>(unitsFixture)
    unorderedFilters.query.edition_kinds = ['STATTRAK', 'STANDARD']
    expect(() => decodeCatalogDisplayQueryApiResponse(unorderedFilters)).toThrowError(
      expect.objectContaining({ rule: 'QUERY_SHAPE' }),
    )
  })

  it('binds the exact operation and complete echoed query', async () => {
    const payload = semanticFixture<WireCatalogSeriesResponse>(seriesFixture)
    const query = structuredClone(payload.query)
    const gateway = new QueryFixtureGateway(payload)
    const response = await new CatalogDisplayApi(gateway).series({ query, cursor: null })
    expect(response.response_kind).toBe('CATALOG_QUERY_SERIES')
    expect(gateway.requests).toEqual([{ operation: 'CATALOG_QUERY_SERIES', query, cursor: null }])
    expect(Object.isFrozen(gateway.requests[0])).toBe(true)

    const changedQuery: WireCatalogSeriesQuery = {
      ...query,
      search_text: 'Contract',
      search_normalized: 'contract',
    }
    await expect(
      new CatalogDisplayApi(new QueryFixtureGateway(payload)).series({
        query: changedQuery,
        cursor: null,
      }),
    ).rejects.toBeInstanceOf(CatalogDisplayRequestBindingViolation)

    await expect(
      new CatalogDisplayApi({
        kind: 'LEGACY_ONLY',
        read: async () => payload,
      }).series({ query, cursor: null }),
    ).rejects.toThrow(/does not implement snapshot-bound queries/u)
  })

  it('rejects a response that repeats its current or opposite page cursor', async () => {
    const payload = semanticFixture<WireCatalogSeriesResponse>(seriesFixture)
    payload.previous_cursor = 'current_page'
    await expect(new CatalogDisplayApi(new QueryFixtureGateway(payload)).series({
      query: payload.query,
      cursor: 'current_page',
    })).rejects.toBeInstanceOf(CatalogDisplayRequestBindingViolation)

    payload.previous_cursor = 'same_destination'
    payload.next_cursor = 'same_destination'
    payload.query.page_size = 1
    await expect(new CatalogDisplayApi(new QueryFixtureGateway(payload)).series({
      query: payload.query,
      cursor: null,
    })).rejects.toBeInstanceOf(CatalogDisplayRequestBindingViolation)
  })

  it('maps units to one same-origin GET with repeated edition/wear values', async () => {
    const payload = queryFixture<WireCatalogUnitsResponse>(unitsFixture)
    const query: WireCatalogUnitsQuery = {
      ...payload.query,
      edition_kinds: ['STANDARD', 'STATTRAK'],
      wear_tiers: ['FACTORY_NEW', 'FIELD_TESTED'],
    }
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    const gateway = new HttpCatalogDisplayGateway({ fetcher })

    await gateway.readQuery({ operation: 'CATALOG_QUERY_UNITS', query, cursor: 'opaque_cursor' })

    expect(fetcher).toHaveBeenCalledTimes(1)
    const url = new URL(String(fetcher.mock.calls[0]?.[0]), 'https://example.invalid')
    expect(url.pathname).toBe('/api/v1/catalog-display/query/units')
    expect(url.searchParams.getAll('edition_kind')).toEqual(['STANDARD', 'STATTRAK'])
    expect(url.searchParams.getAll('wear_tier')).toEqual(['FACTORY_NEW', 'FIELD_TESTED'])
    expect(url.searchParams.get('snapshot_id')).toBe(query.snapshot_id)
    expect(url.searchParams.get('cursor')).toBe('opaque_cursor')
    expect(url.searchParams.has('provider_url')).toBe(false)
  })

  it('maps the optional global wear facet to the series request without duplicating it', async () => {
    const payload = queryFixture<WireCatalogSeriesResponse>(seriesFixture)
    const query: WireCatalogSeriesQuery = { ...payload.query, wear_tier: 'FIELD_TESTED' }
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    const gateway = new HttpCatalogDisplayGateway({ fetcher })

    await gateway.readQuery({ operation: 'CATALOG_QUERY_SERIES', query, cursor: null })

    const url = new URL(String(fetcher.mock.calls[0]?.[0]), 'https://example.invalid')
    expect(url.pathname).toBe('/api/v1/catalog-display/query/series')
    expect(url.searchParams.getAll('wear_tier')).toEqual(['FIELD_TESTED'])
  })

  it('enforces the operation-specific decoded response budget', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response('{}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(128 * 1024 + 1),
      },
    }))
    const gateway = new HttpCatalogDisplayGateway({ fetcher })

    await expect(gateway.readQuery({
      operation: 'CATALOG_QUERY_BOOTSTRAP',
      query: queryFixture<WireCatalogBootstrapResponse>(bootstrapFixture).query,
    })).rejects.toEqual(expect.objectContaining<Partial<CatalogDisplayTransportError>>({
      code: 'RESPONSE_TOO_LARGE',
      retryable: false,
      httpStatus: 200,
    }))
  })
})
