import errorFixture from '../../schemas/examples/catalog-display-error.valid.json'
import listFixture from '../../schemas/examples/catalog-display-list.valid.json'
import snapshotErrorFixture from '../../schemas/examples/catalog-display-snapshot-error.valid.json'
import snapshotListFixture from '../../schemas/examples/catalog-display-snapshot-list.valid.json'
import {
  catalogMediaRoute,
  encodeCatalogMediaKey,
} from '../src/adapter/catalogDisplayViewModel'
import {
  CatalogDisplayApi,
  CatalogDisplayRequestBindingViolation,
  type CatalogDisplayGateway,
  type CatalogDisplayGatewayRequest,
  type CatalogDisplayListRequest,
} from '../src/api/CatalogDisplayApi'
import {
  HttpCatalogDisplayGateway,
} from '../src/api/HttpCatalogDisplayGateway'
import {
  catalogQueryInstant,
  createLiveCatalogDisplayRuntime,
} from '../src/api/catalogDisplayRuntime'
import {
  CatalogDisplaySemanticViolation,
  CatalogDisplayWireViolation,
  decodeCatalogDisplayApiResponse,
  isValidatedCatalogDisplayResponse,
} from '../src/wire/catalogDisplayApiDecode'
import {
  CatalogDisplaySnapshotSemanticViolation,
  CatalogDisplaySnapshotWireViolation,
  decodeCatalogDisplaySnapshotApiResponse,
  isValidatedCatalogDisplaySnapshotResponse,
} from '../src/wire/catalogDisplaySnapshotApiDecode'
import { canonicalHash } from '../src/wire/canonical'
import type {
  CatalogNameAuthority,
  WireCatalogDisplayMember,
  WireCatalogDisplayListResponse,
  WireCatalogDisplayProjection,
} from '../src/wire/catalogDisplayApiTypes'
import type {
  WireCatalogDisplaySnapshotListResponse,
} from '../src/wire/catalogDisplaySnapshotApiTypes'

function cloneList(): WireCatalogDisplayListResponse {
  return structuredClone(listFixture) as WireCatalogDisplayListResponse
}

function rehash(projection: WireCatalogDisplayProjection): void {
  const { projection_hash: _projectionHash, ...document } = projection
  projection.projection_hash = canonicalHash(document)
}

const NAME_AUTHORITIES = ['VALVE_STEAM', 'MARKET_D', 'MARKET_B'] as const satisfies readonly CatalogNameAuthority[]

class FixtureGateway implements CatalogDisplayGateway {
  readonly kind = 'TEST'
  readonly requests: CatalogDisplayGatewayRequest[] = []

  constructor(private readonly payload: unknown) {}

  async read(request: CatalogDisplayGatewayRequest): Promise<unknown> {
    this.requests.push(request)
    return structuredClone(this.payload)
  }
}

describe('catalog-display-api/v1', () => {
  it('builds the default live-local runtime from one explicit canonical PIT cutoff', () => {
    const gateway = new FixtureGateway(listFixture)
    const runtime = createLiveCatalogDisplayRuntime({
      gateway,
      now: () => new Date('2026-08-25T03:15:16.789Z'),
    })
    expect(runtime).toEqual({
      dataEnvironment: 'LIVE_LOCAL',
      gateway,
      snapshotQueryAsOf: '2026-08-25T03:15:16.789000Z',
      snapshotKnownAt: '2026-08-25T03:15:16.789000Z',
    })
    expect(Object.isFrozen(runtime)).toBe(true)
    expect(() => catalogQueryInstant(new Date(Number.NaN))).toThrow(
      'catalog query instant must be a valid Date',
    )
  })

  it('accepts the shared sealed-snapshot fixtures and rejects unknown fields', () => {
    const response = decodeCatalogDisplaySnapshotApiResponse(snapshotListFixture)
    expect(
      isValidatedCatalogDisplaySnapshotResponse(
        response,
        'CATALOG_DISPLAY_SNAPSHOT_LIST',
      ),
    ).toBe(true)
    if (response.response_kind !== 'CATALOG_DISPLAY_SNAPSHOT_LIST') {
      throw new Error('unexpected')
    }
    expect(response.members[0]).toMatchObject({
      as_of: '2026-08-25T01:00:00.000000Z',
      available_at: '2026-08-25T01:00:01.000000Z',
    })
    expect(Object.isFrozen(response.members[0])).toBe(true)

    const error = decodeCatalogDisplaySnapshotApiResponse(snapshotErrorFixture)
    expect(isValidatedCatalogDisplaySnapshotResponse(error, 'ERROR')).toBe(true)

    const unknown = structuredClone(snapshotListFixture) as unknown as Record<
      string,
      unknown
    >
    unknown.source_asset_ref = 'forbidden'
    expect(() => decodeCatalogDisplaySnapshotApiResponse(unknown)).toThrow(
      CatalogDisplaySnapshotWireViolation,
    )
  })

  it('enforces snapshot PIT cutoffs, descending order and controlled errors', () => {
    const future = structuredClone(
      snapshotListFixture,
    ) as WireCatalogDisplaySnapshotListResponse
    future.members[0].available_at = '2026-08-25T03:00:00.000000Z'
    expect(() => decodeCatalogDisplaySnapshotApiResponse(future)).toThrowError(
      expect.objectContaining({ rule: 'SNAPSHOT_PIT_TIME_ORDER' }),
    )

    const impossibleSeal = structuredClone(
      snapshotListFixture,
    ) as WireCatalogDisplaySnapshotListResponse
    impossibleSeal.members[0].available_at = '2026-08-25T00:59:59.000000Z'
    expect(() =>
      decodeCatalogDisplaySnapshotApiResponse(impossibleSeal),
    ).toThrowError(expect.objectContaining({ rule: 'SNAPSHOT_PIT_TIME_ORDER' }))

    const unsorted = structuredClone(
      snapshotListFixture,
    ) as WireCatalogDisplaySnapshotListResponse
    unsorted.members = [
      ...unsorted.members,
      {
        ...structuredClone(unsorted.members[0]),
        as_of: '2026-08-25T00:59:59.000000Z',
        snapshot_id: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      },
    ].reverse()
    expect(() => decodeCatalogDisplaySnapshotApiResponse(unsorted)).toThrow(
      CatalogDisplaySnapshotSemanticViolation,
    )

    const inconsistentError = structuredClone(snapshotErrorFixture)
    inconsistentError.error.retryable = false
    expect(() =>
      decodeCatalogDisplaySnapshotApiResponse(inconsistentError),
    ).toThrowError(expect.objectContaining({ rule: 'SNAPSHOT_ERROR_SHAPE' }))
  })

  it('accepts Python-generated fixtures and seals complete provider-attributed names', () => {
    const response = decodeCatalogDisplayApiResponse(listFixture)
    expect(isValidatedCatalogDisplayResponse(response, 'CATALOG_DISPLAY_LIST')).toBe(true)
    if (response.response_kind !== 'CATALOG_DISPLAY_LIST') throw new Error('unexpected')
    expect(response.members[0].projection.localized_name).toEqual({
      authority: 'VALVE_STEAM',
      en: 'StatTrak™ Contract Fixture | Official String Shape (Field-Tested)',
      zh_cn: 'StatTrak™ 合同样例 | 官方字符串形状 (久经沙场)',
    })
    expect(response.members[0].projection.media).toEqual({
      status: 'BOUND',
      media_key: 'fixture/series-representative',
      presentation_kind: 'SERIES_REPRESENTATIVE',
    })
    expect(Object.isFrozen(response.members[0].projection.localized_name)).toBe(true)

    const error = decodeCatalogDisplayApiResponse(errorFixture)
    expect(isValidatedCatalogDisplayResponse(error, 'ERROR')).toBe(true)
  })

  it.each(NAME_AUTHORITIES)('accepts and freezes the shared %s name authority', (authority) => {
    const payload = cloneList()
    payload.members[0].projection.localized_name.authority = authority
    rehash(payload.members[0].projection)

    const response = decodeCatalogDisplayApiResponse(payload)
    if (response.response_kind !== 'CATALOG_DISPLAY_LIST') throw new Error('unexpected')
    expect(response.members[0].projection.localized_name.authority).toBe(authority)
    expect(Object.isFrozen(response.members[0].projection.localized_name)).toBe(true)
  })

  it('rejects an unknown name authority at the shared Schema boundary', () => {
    const payload = cloneList()
    ;(
      payload.members[0].projection.localized_name as unknown as { authority: string }
    ).authority = 'UNDECLARED_PROVIDER'
    rehash(payload.members[0].projection)

    expect(() => decodeCatalogDisplayApiResponse(payload)).toThrow(
      CatalogDisplayWireViolation,
    )
  })

  it('rejects unknown wire fields before semantics', () => {
    const payload = cloneList() as unknown as Record<string, unknown>
    payload.source_item_id = 'forbidden-provider-key'
    expect(() => decodeCatalogDisplayApiResponse(payload)).toThrow(
      CatalogDisplayWireViolation,
    )
  })

  it('recomputes the Python canonical projection hash', () => {
    const payload = cloneList()
    payload.members[0].projection.localized_name.en = 'tampered'
    expect(() => decodeCatalogDisplayApiResponse(payload)).toThrowError(
      expect.objectContaining({ rule: 'PROJECTION_HASH' }),
    )
  })

  it('keeps authority inside the canonical projection hash', () => {
    const payload = cloneList()
    payload.members[0].projection.localized_name.authority = 'MARKET_D'
    expect(() => decodeCatalogDisplayApiResponse(payload)).toThrowError(
      expect.objectContaining({ rule: 'PROJECTION_HASH' }),
    )
  })

  it('rejects trademark loss even when an attacker recomputes the hash', () => {
    const payload = cloneList()
    payload.members[0].projection.localized_name.en =
      'StatTrak Contract Fixture | Official String Shape (Field-Tested)'
    rehash(payload.members[0].projection)
    expect(() => decodeCatalogDisplayApiResponse(payload)).toThrowError(
      expect.objectContaining({ rule: 'LOCALIZED_NAME_SHAPE' }),
    )
  })

  it('rejects unsafe media path segments even with a matching hash', () => {
    const payload = cloneList()
    const media = payload.members[0].projection.media
    if (media.status !== 'BOUND') throw new Error('fixture must be bound')
    media.media_key = 'fixture/../provider-url'
    rehash(payload.members[0].projection)
    expect(() => decodeCatalogDisplayApiResponse(payload)).toThrow(
      CatalogDisplayWireViolation,
    )
  })

  it('rejects malformed PIT queries and underfilled continued pages', () => {
    const invalidTime = cloneList()
    invalidTime.query.as_of = '2026-02-31T09:00:00.000000Z'
    expect(() => decodeCatalogDisplayApiResponse(invalidTime)).toThrowError(
      expect.objectContaining({ rule: 'QUERY_SHAPE' }),
    )

    const unboundBase = cloneList()
    unboundBase.query.item_kind = null
    expect(() => decodeCatalogDisplayApiResponse(unboundBase)).toThrowError(
      expect.objectContaining({ rule: 'QUERY_SHAPE' }),
    )

    const underfilled = cloneList()
    underfilled.query.page_size = 2
    underfilled.next_cursor = 'still_more'
    expect(() => decodeCatalogDisplayApiResponse(underfilled)).toThrowError(
      expect.objectContaining({ rule: 'PAGE_ACCOUNTING' }),
    )
  })

  it('rejects inconsistent controlled error metadata', () => {
    const payload = structuredClone(errorFixture)
    payload.error.retryable = false
    expect(() => decodeCatalogDisplayApiResponse(payload)).toThrowError(
      expect.objectContaining({ rule: 'ERROR_SHAPE' }),
    )
  })

  it('binds the response to the exact as_of and known_at request', async () => {
    const gateway = new FixtureGateway(listFixture)
    const api = new CatalogDisplayApi(gateway)
    const request: Omit<CatalogDisplayListRequest, 'operation'> = {
      query: structuredClone(
        listFixture.query,
      ) as WireCatalogDisplayListResponse['query'],
      cursor: null,
    }
    const response = await api.list(request)
    expect(response.response_kind).toBe('CATALOG_DISPLAY_LIST')
    expect(gateway.requests[0]).toEqual({
      operation: 'CATALOG_DISPLAY_LIST',
      ...request,
    })
    expect(Object.isFrozen(gateway.requests[0].query)).toBe(true)

    const changed = cloneList()
    changed.query.known_at = '2026-08-24T09:00:01.000000Z'
    rehash(changed.members[0].projection)
    await expect(
      new CatalogDisplayApi(new FixtureGateway(changed)).list(request),
    ).rejects.toBeInstanceOf(CatalogDisplayRequestBindingViolation)
  })

  it('binds snapshot discovery to the exact query cutoffs', async () => {
    const gateway = new FixtureGateway(snapshotListFixture)
    const api = new CatalogDisplayApi(gateway)
    const request = {
      query: structuredClone(
        snapshotListFixture.query,
      ) as WireCatalogDisplaySnapshotListResponse['query'],
      cursor: null,
    }
    const response = await api.listSnapshots(request)
    expect(response.response_kind).toBe('CATALOG_DISPLAY_SNAPSHOT_LIST')
    expect(gateway.requests[0]).toEqual({
      operation: 'CATALOG_DISPLAY_SNAPSHOT_LIST',
      ...request,
    })

    const changed = structuredClone(
      snapshotListFixture,
    ) as WireCatalogDisplaySnapshotListResponse
    changed.query.known_at = '2026-08-25T02:00:01.000000Z'
    await expect(
      new CatalogDisplayApi(new FixtureGateway(changed)).listSnapshots(request),
    ).rejects.toBeInstanceOf(CatalogDisplayRequestBindingViolation)
  })

  it('maps a typed request to same-origin GET without exposing a provider URL', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      expect(url).toContain('/api/v1/catalog-display/units?')
      expect(url).toContain('as_of=2026-08-24T09%3A00%3A00.000000Z')
      expect(url).toContain('known_at=2026-08-24T09%3A00%3A00.000000Z')
      expect(url).toContain('base_item_code=fixture.weapon.official-name-shape')
      expect(url).not.toContain('steamstatic')
      return new Response(JSON.stringify(listFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    const gateway = new HttpCatalogDisplayGateway({ fetcher })
    const payload = await gateway.read({
      operation: 'CATALOG_DISPLAY_LIST',
      query: structuredClone(listFixture.query) as WireCatalogDisplayListResponse['query'],
      cursor: null,
    })
    expect(payload).toEqual(listFixture)
    expect(String(fetcher.mock.calls[0]?.[0])).toMatch(
      /^\/api\/v1\/catalog-display\/units\?/u,
    )
  })

  it('maps snapshot discovery to the dedicated GET route', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      expect(url).toContain('/api/v1/catalog-display/snapshots?')
      expect(url).toContain('query_as_of=2026-08-25T02%3A00%3A00.000000Z')
      expect(url).toContain('known_at=2026-08-25T02%3A00%3A00.000000Z')
      expect(url).toContain('sort=AS_OF_DESC')
      expect(url).not.toContain('item_kind')
      return new Response(JSON.stringify(snapshotListFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    const gateway = new HttpCatalogDisplayGateway({ fetcher })
    const payload = await gateway.read({
      operation: 'CATALOG_DISPLAY_SNAPSHOT_LIST',
      query: structuredClone(
        snapshotListFixture.query,
      ) as WireCatalogDisplaySnapshotListResponse['query'],
      cursor: null,
    })
    expect(payload).toEqual(snapshotListFixture)
  })

  it('propagates an explicit caller cancellation instead of reporting a transport timeout', async () => {
    const fetcher = vi.fn<typeof fetch>(async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('cancelled by consumer', 'AbortError')),
          { once: true },
        )
      }),
    )
    const gateway = new HttpCatalogDisplayGateway({ fetcher })
    const controller = new AbortController()
    const read = gateway.read(
      {
        operation: 'CATALOG_DISPLAY_SNAPSHOT_LIST',
        query: structuredClone(
          snapshotListFixture.query,
        ) as WireCatalogDisplaySnapshotListResponse['query'],
        cursor: null,
      },
      { signal: controller.signal },
    )
    controller.abort()

    await expect(read).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('builds exact-version media URLs with canonical unpadded UTF-8 base64url', () => {
    const key = '系列/红宝石🗡'
    const token = encodeCatalogMediaKey(key)
    expect(token).not.toMatch(/[+/=]/u)
    const padded =
      token.replace(/-/gu, '+').replace(/_/gu, '/') +
      '='.repeat((4 - (token.length % 4)) % 4)
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
    expect(new TextDecoder().decode(bytes)).toBe(key)
    expect(catalogMediaRoute(key, '105')).toBe(`/media/catalog/v1/105/${token}`)
    expect(() => catalogMediaRoute(key, '0')).toThrow(/positive decimal/u)
    expect(() => encodeCatalogMediaKey('\ud800')).toThrow(/Unicode scalar/u)
  })

  it('rejects an HTTP status that is not bound to a controlled error body', async () => {
    const gateway = new HttpCatalogDisplayGateway({
      fetcher: vi.fn(async () =>
        new Response(JSON.stringify(listFixture), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    })
    await expect(
      gateway.read({
        operation: 'CATALOG_DISPLAY_LIST',
        query: structuredClone(listFixture.query) as WireCatalogDisplayListResponse['query'],
        cursor: null,
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: 'HTTP_STATUS_MISMATCH',
      }),
    )
  })

  it('uses distinct semantic error types', () => {
    const payload = cloneList()
    ;(payload.members as WireCatalogDisplayMember[]).push(
      structuredClone(payload.members[0]),
    )
    expect(() => decodeCatalogDisplayApiResponse(payload)).toThrow(
      CatalogDisplaySemanticViolation,
    )
  })
})
