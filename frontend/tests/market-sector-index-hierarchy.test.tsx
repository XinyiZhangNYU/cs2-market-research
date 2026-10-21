import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import directoryV1Fixture from '../../schemas/examples/market-sector-index-public-api/v1/directory.json'
import seriesV2Fixture from '../../schemas/examples/market-sector-index-public-api/v2/series.json'

import { MarketSectorIndexPublicApi, type MarketSectorIndexPublicGateway,
  type MarketSectorIndexTransportResponse,
} from '../src/api/MarketSectorIndexPublicApi'
import { HttpMarketSectorIndexPublicGateway } from '../src/api/HttpMarketSectorIndexPublicGateway'
import { MarketSectorIndexHistory } from '../src/components/MarketSectorIndexHistory'
import { LangProvider } from '../src/i18n'
import { canonicalHash } from '../src/wire/canonical'
import type { MarketSectorIndexDecodeRequest } from '../src/wire/marketSectorIndexPublicApiDecode'
import type {
  MarketSectorIndexGroupCode,
  MarketSectorIndexRequestV3,
} from '../src/wire/marketSectorIndexPublicApiV3Types'


const PUBLICATION = '6'.repeat(64)
const release = {
  publication_id: PUBLICATION,
  manifest_sha256: '1'.repeat(64),
  rights_revision: '2'.repeat(64),
  published_at: '2026-09-19T17:30:00Z',
  withdrawn_at: null,
  directory_id: `market_sector_index_scope_directory_${'8'.repeat(64)}`,
  directory_sha256: '3'.repeat(64),
  directory_sealed_at: '2026-09-19T17:00:00Z',
  candidate_sha256: '4'.repeat(64),
  successor_delta_sha256: '5'.repeat(64),
  continuation_spec_sha256: '7'.repeat(64),
  history_start: '2023-01-01',
  history_end: '2026-09-10',
  measured_start: '2026-09-11',
  measured_end: '2026-09-15',
  availability_semantics: ['RECONSTRUCTED_LATE_BOUND', 'CONTEMPORANEOUSLY_MEASURED'],
} as const
const groupCodes = [
  'MARKET', 'SECTORS', 'CASES', 'WEAPON_MODELS', 'KNIFE_MODELS',
  'GLOVE_MODELS', 'COLLECTIONS', 'ARMORY_RELEASES', 'DOPPLER',
] as const

function labels(code: MarketSectorIndexGroupCode) {
  if (code === 'MARKET') return { en: 'Broad market', zh_cn: '大盘' }
  if (code === 'KNIFE_MODELS') return { en: 'Knife models', zh_cn: '刀型' }
  return { en: code, zh_cn: code }
}

type FixtureScopeCode =
  | 'ALL'
  | 'WEAPON'
  | 'KNIFE'
  | 'WEAPON_MODEL:7'
  | 'KNIFE_MODEL:515'
  | 'ARMORY_RELEASE:20241002'
  | 'COLLECTION:GRAPHIC_DESIGN'
  | 'DOPPLER:P1'

function v3Scope(code: FixtureScopeCode, group: MarketSectorIndexGroupCode) {
  const collectionToken = canonicalHash({
    contract: 'market-sector-index-public-api', scope_code: 'COLLECTION:GRAPHIC_DESIGN',
  })
  return {
    scope_token: canonicalHash({ contract: 'market-sector-index-public-api', scope_code: code }),
    scope_code: code,
    scope_kind: code === 'ALL' ? 'MARKET' : code.includes(':') ? 'SUBSECTOR' : 'SECTOR',
    group_code: group,
    parent_scope_code: code === 'ALL' ? null
      : code === 'WEAPON' || code === 'KNIFE' ? 'ALL'
        : code.startsWith('WEAPON_MODEL:') ? 'WEAPON'
      : code.startsWith('KNIFE_MODEL:') ? 'KNIFE'
        : code.startsWith('ARMORY_RELEASE:') ? 'ARMORY'
          : code.startsWith('DOPPLER:') ? 'DOPPLER'
          : 'COLLECTION',
    ancestor_scope_codes: code === 'ALL' ? []
      : code === 'WEAPON' || code === 'KNIFE' ? ['ALL']
        : code.startsWith('WEAPON_MODEL:') ? ['ALL', 'WEAPON']
      : code.startsWith('KNIFE_MODEL:') ? ['ALL', 'KNIFE']
        : code.startsWith('ARMORY_RELEASE:') ? ['ALL', 'ARMORY']
          : code.startsWith('DOPPLER:') ? ['DOPPLER']
          : ['ALL', 'COLLECTION'],
    labels: code === 'ALL'
      ? { en: 'Whole market', zh_cn: '整体市场' }
      : code === 'WEAPON'
        ? { en: 'Weapons', zh_cn: '武器' }
        : code === 'KNIFE'
          ? { en: 'Knives', zh_cn: '刀具' }
          : code === 'WEAPON_MODEL:7'
            ? { en: 'AK-47', zh_cn: 'AK-47' }
      : code === 'KNIFE_MODEL:515'
        ? { en: 'Butterfly Knife', zh_cn: '蝴蝶刀' }
        : code === 'ARMORY_RELEASE:20241002'
          ? { en: 'The Armory 2024', zh_cn: '武库 2024' }
          : code === 'DOPPLER:P1'
            ? { en: 'Doppler Phase 1', zh_cn: '多普勒 P1' }
          : { en: 'Graphic Design Collection', zh_cn: '平面设计收藏品' },
    series_source: code.startsWith('DOPPLER:')
      ? 'VARIANT_RECONSTRUCTION'
      : 'REGULAR_SUCCESSOR_RECONSTRUCTION',
    price_history_eligibility: 'RECONSTRUCTED_HISTORY',
    first_available_date: code.startsWith('DOPPLER:') ? '2023-10-31' : '2023-01-01',
    last_available_date: code.startsWith('DOPPLER:') ? '2026-08-26' : '2026-09-10',
    current_member_count: code === 'ALL' ? 17028 : code === 'ARMORY_RELEASE:20241002' ? 4 : 202,
    observed_price_member_count: code === 'ALL' ? 16252 : code === 'ARMORY_RELEASE:20241002' ? 3 : 200,
    origin_uncertainty_disclosed: code === 'ARMORY_RELEASE:20241002',
    low_member_count: code === 'ARMORY_RELEASE:20241002',
    linked_collection_scope_tokens: code === 'ARMORY_RELEASE:20241002' ? [collectionToken] : [],
  } as const
}

const fixtureScopes = [
  v3Scope('ALL', 'MARKET'),
  v3Scope('WEAPON', 'SECTORS'),
  v3Scope('KNIFE', 'SECTORS'),
  v3Scope('WEAPON_MODEL:7', 'WEAPON_MODELS'),
  v3Scope('KNIFE_MODEL:515', 'KNIFE_MODELS'),
  v3Scope('ARMORY_RELEASE:20241002', 'ARMORY_RELEASES'),
  v3Scope('COLLECTION:GRAPHIC_DESIGN', 'COLLECTIONS'),
  v3Scope('DOPPLER:P1', 'DOPPLER'),
]

function fixtureScopeForToken(token: string) {
  return fixtureScopes.find((scope) => scope.scope_token === token) ?? fixtureScopes[0]
}

class HierarchyGateway implements MarketSectorIndexPublicGateway {
  readonly kind = 'HIERARCHY_FIXTURE'
  readonly preferredSeriesVersion = '3' as const
  readonly v3Requests: MarketSectorIndexRequestV3[] = []
  readonly seriesScopeCodes: string[] = []

  async readDirectoryV3(request: MarketSectorIndexRequestV3): Promise<MarketSectorIndexTransportResponse> {
    this.v3Requests.push(structuredClone(request))
    if (request.kind === 'SERIES') {
      const selected = fixtureScopeForToken(request.query.scope_token)
      const code = selected.scope_code
      this.seriesScopeCodes.push(code)
      const points = request.query.limit === 2
        ? structuredClone(seriesV2Fixture.points.slice(-2)).map((point, index) => ({
            ...point,
            date: `2026-09-${14 + index}`,
          }))
        : code === 'DOPPLER:P1'
        ? structuredClone(seriesV2Fixture.points.slice(0, 3)).map((point, index) => ({
            ...point,
            date: `2026-08-${String(24 + index).padStart(2, '0')}`,
          }))
        : structuredClone(seriesV2Fixture.points)
      return {
        httpStatus: 200,
        payload: {
          contract_name: 'market-sector-index-public-api',
          contract_version: '3',
          response_kind: 'INDEX_SERIES',
          product_kind: 'DESCRIPTIVE_MARKET_SECTOR_INDEX',
          purpose: 'CS2_ROTATE_HIERARCHICAL_MARKET_SECTOR_INDEX_V3',
          prediction_status: 'NOT_A_PREDICTION',
          release,
          scope: selected,
          series_query: {
            from_date: request.query.from_date,
            to_date: request.query.to_date,
            after_date: request.query.after_date,
            limit: request.query.limit,
            next_after_date: null,
          },
          points,
        },
      }
    }
    if (request.kind === 'GROUPS') {
      return {
        httpStatus: 200,
        payload: {
          contract_name: 'market-sector-index-public-api',
          contract_version: '3',
          response_kind: 'SCOPE_GROUP_DIRECTORY',
          product_kind: 'DESCRIPTIVE_MARKET_SECTOR_INDEX',
          purpose: 'CS2_ROTATE_HIERARCHICAL_MARKET_SECTOR_INDEX_V3',
          prediction_status: 'NOT_A_PREDICTION',
          release,
          query: { group: null, after: null, limit: null, next_after: null },
          groups: groupCodes.map((code, display_order) => ({
            group_code: code,
            labels: labels(code),
            display_order,
            scope_count: fixtureScopes.filter((scope) => scope.group_code === code).length,
          })),
          scopes: [],
        },
      }
    }
    const selected = fixtureScopes.filter((scope) => scope.group_code === request.query.group)
    return {
      httpStatus: 200,
      payload: {
        contract_name: 'market-sector-index-public-api',
        contract_version: '3',
        response_kind: 'SCOPE_PAGE',
        product_kind: 'DESCRIPTIVE_MARKET_SECTOR_INDEX',
        purpose: 'CS2_ROTATE_HIERARCHICAL_MARKET_SECTOR_INDEX_V3',
        prediction_status: 'NOT_A_PREDICTION',
        release,
        query: { group: request.query.group, after: request.query.after, limit: request.query.limit, next_after: null },
        groups: [],
        scopes: selected,
      },
    }
  }

  async read(request: MarketSectorIndexDecodeRequest): Promise<MarketSectorIndexTransportResponse> {
    if (request.kind === 'DIRECTORY') throw new Error('legacy directory must not be loaded when V3 is published')
    const code = fixtureScopeForToken(request.query.scope_token).scope_code
    this.seriesScopeCodes.push(code)
    const payload: any = structuredClone(seriesV2Fixture)
    payload.scope = {
      ...payload.scope,
      scope_token: request.query.scope_token,
      scope_code: code,
      scope_kind: code === 'ALL' ? 'MARKET' : 'SUBSECTOR',
      labels: code === 'ALL'
        ? { en: 'Whole market', zh_cn: '整体市场' }
        : { en: 'Butterfly Knife', zh_cn: '蝴蝶刀' },
      current_member_count: code === 'ALL' ? 17028 : 202,
      observed_price_member_count: code === 'ALL' ? 16252 : 200,
    }
    payload.query = {
      from_date: request.query.from_date,
      to_date: request.query.to_date,
      after_date: request.query.after_date,
      limit: request.query.limit,
      next_after_date: null,
    }
    return { payload, httpStatus: 200 }
  }
}

class DelayedChildSeriesGateway extends HierarchyGateway {
  private readonly childGate: Promise<void>
  private releaseGate!: () => void

  constructor() {
    super()
    this.childGate = new Promise((resolve) => { this.releaseGate = resolve })
  }

  releaseChildSeries() {
    this.releaseGate()
  }

  override async readDirectoryV3(
    request: MarketSectorIndexRequestV3,
  ): Promise<MarketSectorIndexTransportResponse> {
    if (
      request.kind === 'SERIES' &&
      fixtureScopeForToken(request.query.scope_token).scope_code === 'WEAPON_MODEL:7'
    ) await this.childGate
    return super.readDirectoryV3(request)
  }
}

afterEach(cleanup)

describe('hierarchical market/sector navigation', () => {
  it('renders child cards and representative images before background history prefetch finishes', async () => {
    const gateway = new DelayedChildSeriesGateway()
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="ALL" view="SECTORS" />
      </LangProvider>,
    )
    await screen.findByTestId('v3-coarse-sector-heatmap')
    fireEvent.click(screen.getByTestId('sector-tile-WEAPON'))
    const card = await screen.findByTestId('sector-tile-WEAPON_MODEL:7')
    expect(card).toHaveTextContent('AK-47')
    expect(card).toHaveTextContent('—')
    expect(screen.getByTestId('equipment-image-skin_ak47_wild_lotus')).toBeInTheDocument()

    gateway.releaseChildSeries()
    await waitFor(() => expect(card).toHaveTextContent('+1%'))
  })

  it('keeps the broad-sector heatmap and drills into an equal child-sector grid', async () => {
    const gateway = new HierarchyGateway()
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="ALL" view="SECTORS" />
      </LangProvider>,
    )
    const overlay = await screen.findByTestId('v3-coarse-sector-overlay')
    expect(screen.getByRole('heading', { name: '板块走势' })).toBeInTheDocument()
    expect(screen.queryByText('粗板块对比')).not.toBeInTheDocument()
    expect(screen.queryByText('SECTOR OVERVIEW')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('指数分组')).not.toBeInTheDocument()
    expect(overlay).toHaveTextContent('全部板块')
    expect(overlay).toHaveTextContent('武器')
    expect(overlay).toHaveTextContent('刀具')
    const rootMap = screen.getByTestId('v3-coarse-sector-heatmap')
    expect(rootMap).toHaveTextContent('武器')
    expect(rootMap).toHaveTextContent('刀具')
    expect(rootMap).not.toHaveTextContent('AK-47')

    fireEvent.click(screen.getByTestId('sector-tile-WEAPON'))
    const childMap = await screen.findByTestId('v3-child-sector-grid')
    expect(await screen.findByTestId('sector-tile-WEAPON_MODEL:7')).toBeInTheDocument()
    expect(childMap).toHaveTextContent('AK-47')
    expect(childMap.querySelector('.public-market-sector-grid')).toBeInTheDocument()
    expect(childMap.querySelector('.public-market-board__map')).not.toBeInTheDocument()
    expect(screen.getByTestId('equipment-image-skin_ak47_wild_lotus')).toBeInTheDocument()
    expect(screen.getByTestId('sector-tile-WEAPON_MODEL:7')).toHaveTextContent('1%')
    const cardRequest = gateway.v3Requests.find(
      (request) => request.kind === 'SERIES' &&
        fixtureScopeForToken(request.query.scope_token).scope_code === 'WEAPON_MODEL:7',
    )
    expect(cardRequest?.kind === 'SERIES' ? cardRequest.query : null).toMatchObject({
      from_date: '2026-09-14',
      to_date: '2026-09-15',
      limit: 2,
    })
    expect(gateway.v3Requests.some(
      (request) => request.kind === 'SCOPES' && request.query.group === 'WEAPON_MODELS',
    )).toBe(true)
    expect(screen.queryByTestId('v3-sector-detail')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('sector-tile-WEAPON_MODEL:7'))
    expect(await screen.findByRole('heading', { name: 'AK-47指数走势' })).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /AK-47连续指数/ })).toBeInTheDocument()
  })

  it('keeps the market page focused on the broad market without exposing internal groups', async () => {
    const gateway = new HierarchyGateway()
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="ALL" />
      </LangProvider>,
    )
    expect(await screen.findByText('1,020.1')).toBeInTheDocument()
    const chart = await screen.findByRole('img', { name: /整体市场连续指数/u })
    expect(chart).toHaveAttribute('data-bridge-count', '1')
    expect(chart).toHaveAttribute('data-point-disclosure-count', '5')
    expect(screen.getByTestId('market-sector-index-history')).not.toHaveTextContent('虚线只连接两端均有指数值')
    expect(screen.queryByLabelText('指数分组')).not.toBeInTheDocument()
    expect(screen.queryByTestId('v3-coarse-sector-overlay')).not.toBeInTheDocument()
    expect(gateway.seriesScopeCodes).toEqual(['ALL'])
    expect(gateway.v3Requests.filter((request) => request.kind === 'SCOPES').every(
      (request) => request.query.group === 'MARKET',
    )).toBe(true)
    expect(gateway.v3Requests.filter((request) => request.kind === 'SERIES').every(
      (request) => request.query.to_date === '2026-09-15',
    )).toBe(true)
  })

  it('shows low-member and origin disclosures and navigates armory links to collections', async () => {
    const gateway = new HierarchyGateway()
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="ARMORY_RELEASE:20241002" />
      </LangProvider>,
    )
    expect(await screen.findByText(/低成员范围/)).toBeInTheDocument()
    expect(screen.getByText(/成员起源存在不确定性/)).toBeInTheDocument()
    const link = screen.getByRole('button', { name: '平面设计收藏品' })
    fireEvent.click(link)
    expect(await screen.findByRole('img', { name: /平面设计收藏品连续指数/ })).toBeInTheDocument()
    expect(gateway.v3Requests.some(
      (request) => request.kind === 'SCOPES' && request.query.group === 'COLLECTIONS',
    )).toBe(true)
  })

  it('keeps a historical-only Doppler request on the scope range instead of the global measured end', async () => {
    const gateway = new HierarchyGateway()
    render(
      <LangProvider lang="en">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="DOPPLER:P1" />
      </LangProvider>,
    )
    expect(await screen.findByRole('img', { name: /Doppler Phase 1 continuous index, 2026-08-24 to 2026-08-26/ })).toBeInTheDocument()
    const series = gateway.v3Requests.find((request) => request.kind === 'SERIES')
    expect(series?.query.from_date).toBe('2026-05-27')
    expect(series?.query.to_date).toBe('2026-08-26')
    expect(series?.query.limit).toBe(92)
  })
})


describe('Market V3 request-window and cache regressions', () => {
  const query = (publicationId: string | null = PUBLICATION) => ({
    publication_id: publicationId,
    scope_token: v3Scope('ALL', 'MARKET').scope_token,
    from_date: '2026-06-16',
    to_date: '2026-09-15',
    after_date: null,
    limit: 92,
  })

  it('loads the default 3M window, fetches 1Y on demand, and then reuses settled 3M', async () => {
    const gateway = new HierarchyGateway()
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="ALL" />
      </LangProvider>,
    )
    expect(await screen.findByText('1,020.1')).toBeInTheDocument()
    expect(gateway.v3Requests.filter((request) => request.kind === 'SERIES')).toHaveLength(1)
    expect(gateway.v3Requests.find((request) => request.kind === 'SERIES')?.query).toMatchObject({
      from_date: '2026-06-16',
      limit: 92,
    })
    fireEvent.click(screen.getByRole('button', { name: '1年' }))
    await waitFor(() => expect(gateway.v3Requests.filter((request) => request.kind === 'SERIES')).toHaveLength(2))
    fireEvent.click(screen.getByRole('button', { name: '3月' }))
    await waitFor(() => expect(screen.getByText('1,020.1')).toBeInTheDocument())
    expect(gateway.v3Requests.filter((request) => request.kind === 'SERIES')).toHaveLength(2)
  })

  it('deduplicates simultaneous ACTIVE group reads', async () => {
    const gateway = new HierarchyGateway()
    const api = new MarketSectorIndexPublicApi(gateway)
    await Promise.all([api.directoryV3Groups(null), api.directoryV3Groups(null)])
    expect(gateway.v3Requests.filter((request) => request.kind === 'GROUPS')).toHaveLength(1)
  })

  it('isolates caller cancellation while a shared group read completes for another caller', async () => {
    const gateway = new HierarchyGateway()
    const original = gateway.readDirectoryV3.bind(gateway)
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    gateway.readDirectoryV3 = async (request) => {
      if (request.kind === 'GROUPS') await gate
      return await original(request)
    }
    const api = new MarketSectorIndexPublicApi(gateway)
    const controller = new AbortController()
    const canceled = api.directoryV3Groups(null, { signal: controller.signal })
    const retained = api.directoryV3Groups(null)
    controller.abort(new DOMException('caller', 'AbortError'))
    release()
    await expect(canceled).rejects.toMatchObject({ name: 'AbortError' })
    await expect(retained).resolves.toMatchObject({ response_kind: 'SCOPE_GROUP_DIRECTORY' })
    expect(gateway.v3Requests.filter((request) => request.kind === 'GROUPS')).toHaveLength(1)
  })

  it('does not cache a failed transport', async () => {
    const gateway = new HierarchyGateway()
    const original = gateway.readDirectoryV3.bind(gateway)
    let calls = 0
    gateway.readDirectoryV3 = async (request) => {
      calls += 1
      if (calls === 1) throw new Error('temporary')
      return await original(request)
    }
    const api = new MarketSectorIndexPublicApi(gateway)
    await expect(api.directoryV3Groups(null)).rejects.toThrow('temporary')
    await expect(api.directoryV3Groups(null)).resolves.toMatchObject({ response_kind: 'SCOPE_GROUP_DIRECTORY' })
    expect(calls).toBe(2)
  })

  it('reuses completed exact-publication series but not completed ACTIVE series', async () => {
    const gateway = new HierarchyGateway()
    const api = new MarketSectorIndexPublicApi(gateway)
    await api.seriesV3Pages(query())
    await api.seriesV3Pages(query())
    expect(gateway.v3Requests.filter((request) => request.kind === 'SERIES')).toHaveLength(1)

    const activeGateway = new HierarchyGateway()
    const activeApi = new MarketSectorIndexPublicApi(activeGateway)
    const first = await activeApi.seriesV3Pages(query(null))
    const original = activeGateway.readDirectoryV3.bind(activeGateway)
    activeGateway.readDirectoryV3 = async (request) => {
      const response: any = await original(request)
      const copy = structuredClone(response)
      copy.payload.release.publication_id = 'a'.repeat(64)
      return copy
    }
    const second = await activeApi.seriesV3Pages(query(null))
    expect(first.response_kind).toBe('INDEX_SERIES')
    expect(second.response_kind).toBe('INDEX_SERIES')
    if (second.response_kind === 'INDEX_SERIES') expect(second.release.publication_id).toBe('a'.repeat(64))
    expect(activeGateway.v3Requests.filter((request) => request.kind === 'SERIES')).toHaveLength(2)
  })

  it('honors an already-aborted signal even when a completed cache entry exists', async () => {
    const api = new MarketSectorIndexPublicApi(new HierarchyGateway())
    await api.directoryV3Groups(null)
    const controller = new AbortController()
    controller.abort(new DOMException('caller', 'AbortError'))
    await expect(api.directoryV3Groups(null, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('normalizes equivalent exact series queries with different property insertion order', async () => {
    const gateway = new HierarchyGateway()
    const api = new MarketSectorIndexPublicApi(gateway)
    const original = query()
    const reversed = Object.fromEntries(Object.entries(original).reverse()) as typeof original
    await api.seriesV3Pages(original)
    await api.seriesV3Pages(reversed)
    expect(gateway.v3Requests.filter((request) => request.kind === 'SERIES')).toHaveLength(1)
  })

  it.each(['from_date', 'to_date', 'after_date'] as const)(
    'rejects a missing %s before consulting a warm exact-series cache',
    async (field) => {
      const gateway = new HierarchyGateway()
      const api = new MarketSectorIndexPublicApi(gateway)
      await api.seriesV3Pages(query())
      const invalid: any = { ...query() }
      delete invalid[field]

      await expect(api.seriesV3Pages(invalid)).rejects.toThrow(TypeError)
      expect(gateway.v3Requests.filter((request) => request.kind === 'SERIES')).toHaveLength(1)
    },
  )

  for (const request of [
    { kind: 'GROUPS', query: { publication_id: null } },
    { kind: 'SCOPES', query: { publication_id: PUBLICATION, group: 'MARKET', after: null, limit: 32 } },
    { kind: 'SERIES', query: query() },
  ] satisfies MarketSectorIndexRequestV3[]) {
    it(`${request.kind} cancels the shared HTTP supplier after its final subscriber leaves`, async () => {
      const transport = await new HierarchyGateway().readDirectoryV3(request)
      const finishers: Array<() => void> = []
      let calls = 0
      let aborts = 0
      let active = 0
      const fetcher = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((resolve, reject) => {
        calls += 1
        active += 1
        const signal = init?.signal as AbortSignal
        const onAbort = () => {
          aborts += 1
          active -= 1
          reject(signal.reason)
        }
        signal.addEventListener('abort', onAbort, { once: true })
        finishers.push(() => {
          signal.removeEventListener('abort', onAbort)
          if (signal.aborted) return
          active -= 1
          resolve(new Response(JSON.stringify(transport.payload), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }))
        })
      }))
      const api = new MarketSectorIndexPublicApi(new HttpMarketSectorIndexPublicGateway({ fetcher }))
      const read = (signal?: AbortSignal) => request.kind === 'GROUPS'
        ? api.directoryV3Groups(null, { signal })
        : request.kind === 'SCOPES'
          ? api.directoryV3ScopePages(request.query.group, request.query.publication_id, { signal })
          : api.seriesV3Pages(request.query, { signal })
      const first = new AbortController()
      const second = new AbortController()
      const firstResult = read(first.signal).catch((error: unknown) => error)
      const secondResult = read(second.signal).catch((error: unknown) => error)
      await waitFor(() => expect(calls).toBe(1))
      first.abort(new DOMException('first caller', 'AbortError'))
      await expect(firstResult).resolves.toMatchObject({ name: 'AbortError' })
      expect({ calls, aborts, active }).toEqual({ calls: 1, aborts: 0, active: 1 })
      second.abort(new DOMException('last caller', 'AbortError'))
      await expect(secondResult).resolves.toMatchObject({ name: 'AbortError' })
      await waitFor(() => expect({ calls, aborts, active }).toEqual({ calls: 1, aborts: 1, active: 0 }))

      const retry = read()
      await waitFor(() => expect(calls).toBe(2))
      finishers[1]!()
      await expect(retry).resolves.toBeTruthy()
      expect({ calls, aborts, active }).toEqual({ calls: 2, aborts: 1, active: 0 })
    })
  }

  afterEach(() => vi.restoreAllMocks())
})

class V3AbsentGateway implements MarketSectorIndexPublicGateway {
  readonly kind = 'V3_ABSENT_FIXTURE'
  readonly preferredSeriesVersion = '3' as const
  readonly legacyRequests: MarketSectorIndexDecodeRequest[] = []

  async readDirectoryV3(): Promise<MarketSectorIndexTransportResponse> {
    return {
      httpStatus: 404,
      payload: {
        contract_name: 'market-sector-index-public-api', contract_version: '3',
        response_kind: 'ERROR', error: { code: 'NOT_PUBLISHED', retryable: false },
      },
    }
  }

  async read(request: MarketSectorIndexDecodeRequest): Promise<MarketSectorIndexTransportResponse> {
    this.legacyRequests.push(structuredClone(request))
    if (request.kind === 'DIRECTORY') return { httpStatus: 200, payload: structuredClone(directoryV1Fixture) }
    const payload: any = structuredClone(seriesV2Fixture)
    payload.query = {
      from_date: request.query.from_date, to_date: request.query.to_date,
      after_date: request.query.after_date, limit: request.query.limit, next_after_date: null,
    }
    return { httpStatus: 200, payload }
  }
}

describe('hierarchical market/sector version fallback', () => {
  it('never sends the V1 directory publication identity to a V2-preferred series request', async () => {
    const gateway = new V3AbsentGateway()
    render(
      <LangProvider lang="en">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="ALL" />
      </LangProvider>,
    )
    expect(await screen.findByText('1,020.1')).toBeInTheDocument()
    const series = gateway.legacyRequests.find((request) => request.kind === 'SERIES')
    expect(series?.query.publication_id).toBeNull()
  })
})
