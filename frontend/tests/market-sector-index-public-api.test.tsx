import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import directoryFixture from '../../schemas/examples/market-sector-index-public-api/v1/directory.json'
import seriesFixture from '../../schemas/examples/market-sector-index-public-api/v1/series.json'
import seriesV2Fixture from '../../schemas/examples/market-sector-index-public-api/v2/series.json'
import notPublishedFixture from '../../schemas/examples/market-sector-index-public-api/v1/not-published.json'
import catalogDetailFixture from '../../schemas/examples/catalog-display-query-detail.valid.json'
import catalogSnapshotListFixture from '../../schemas/examples/catalog-display-snapshot-list.valid.json'
import {
  HttpMarketSectorIndexPublicGateway,
  MarketSectorIndexTransportError,
} from '../src/api/HttpMarketSectorIndexPublicGateway'
import { CatalogDisplayTransportError } from '../src/api/HttpCatalogDisplayGateway'
import type {
  CatalogDisplayGateway,
  CatalogDisplayGatewayRequest,
  CatalogDisplayQueryGatewayRequest,
} from '../src/api/CatalogDisplayApi'
import type {
  WireCatalogDetailQuery,
  WireCatalogDetailResponse,
} from '../src/wire/catalogDisplayQueryApiTypes'
import type {
  WireCatalogDisplaySnapshotListResponse,
} from '../src/wire/catalogDisplaySnapshotApiTypes'
import {
  MarketSectorIndexPublicApi,
  type MarketSectorIndexPublicGateway,
  type MarketSectorIndexTransportResponse,
} from '../src/api/MarketSectorIndexPublicApi'
import { MarketSectorIndexHistory } from '../src/components/MarketSectorIndexHistory'
import {
  chartPointDisclosures,
  filterPointsByRange,
  formatChartValue,
  heatmapWeights,
  indexFromForRange,
  indexLevelBridgeRuns,
  indexLevelRuns,
  joinedLevelLine,
  latestDailyReturn,
  layoutTreemap,
  primaryRun,
  rebasedPercentBridgeRuns,
  rebasedPercentRuns,
  recentIndexFrom,
  returnFill,
  returnLabel,
  sectorIllustrationModel,
  tileFill,
  unionChartDates,
  valuesOnDates,
  windowReturn,
  commonObservableReturn,
} from '../src/pages/publicMarketIndexChart'
import { canonicalHash } from '../src/wire/canonical'
import { LangProvider } from '../src/i18n'
import {
  decodeMarketSectorIndexDocument,
  MarketSectorIndexValidationError,
  type MarketSectorIndexDecodeRequest,
} from '../src/wire/marketSectorIndexPublicApiDecode'

const PUBLICATION = '9'.repeat(64)
const TOKEN = '5cae7b8d9e596aed9729bc81c52df450ee4473ce17e6791440e13407ea454967'
const WEAPON_TOKEN = '9e8462f6cc99c5d6bfe670a31ef6188d5205bea312c1c434edcc7c4fe60b7e6c'
const CASE_TOKEN = canonicalHash({ contract: 'market-sector-index-public-api', scope_code: 'CASE' })
const DIRECTORY_REQUEST = Object.freeze({
  kind: 'DIRECTORY', query: Object.freeze({ publication_id: null }),
} satisfies MarketSectorIndexDecodeRequest)
const SERIES_REQUEST = Object.freeze({
  kind: 'SERIES',
  query: Object.freeze({
    publication_id: PUBLICATION,
    scope_token: TOKEN,
    from_date: '2026-09-08',
    to_date: '2026-09-10',
    after_date: null,
    limit: 512,
  }),
} satisfies MarketSectorIndexDecodeRequest)
const SERIES_V2_REQUEST = Object.freeze({
  kind: 'SERIES',
  query: Object.freeze({
    publication_id: null,
    scope_token: TOKEN,
    from_date: '2026-09-08',
    to_date: null,
    after_date: null,
    limit: 512,
  }),
} satisfies MarketSectorIndexDecodeRequest)
type SeriesRequest = Extract<MarketSectorIndexDecodeRequest, Readonly<{ kind: 'SERIES' }>>

function isSeriesRequest(request: MarketSectorIndexDecodeRequest): request is SeriesRequest {
  return request.kind === 'SERIES'
}

function seriesPayloadForRequest(fixture: unknown, request: SeriesRequest): any {
  const payload: any = structuredClone(fixture)
  payload.query.from_date = request.query.from_date
  payload.query.to_date = request.query.to_date
  payload.query.after_date = request.query.after_date
  payload.query.limit = request.query.limit
  payload.query.next_after_date = null
  return payload
}

class FixtureGateway implements MarketSectorIndexPublicGateway {
  readonly kind = 'MARKET_SECTOR_INDEX_FIXTURE'
  readonly requests: MarketSectorIndexDecodeRequest[] = []

  async read(request: MarketSectorIndexDecodeRequest): Promise<MarketSectorIndexTransportResponse> {
    this.requests.push(structuredClone(request))
    return {
      payload: request.kind === 'DIRECTORY'
        ? structuredClone(directoryFixture)
        : seriesPayloadForRequest(seriesFixture, request),
      httpStatus: 200,
    }
  }
}

class V2FixtureGateway implements MarketSectorIndexPublicGateway {
  readonly kind = 'MARKET_SECTOR_INDEX_V2_FIXTURE'
  readonly preferredSeriesVersion = '2' as const
  readonly requests: MarketSectorIndexDecodeRequest[] = []

  async read(request: MarketSectorIndexDecodeRequest): Promise<MarketSectorIndexTransportResponse> {
    this.requests.push(structuredClone(request))
    return {
      payload: request.kind === 'DIRECTORY'
        ? structuredClone(directoryFixture)
        : seriesPayloadForRequest(seriesV2Fixture, request),
      httpStatus: 200,
    }
  }
}

class PagedV2FixtureGateway implements MarketSectorIndexPublicGateway {
  readonly kind = 'MARKET_SECTOR_INDEX_PAGED_V2_FIXTURE'
  readonly preferredSeriesVersion = '2' as const
  readonly requests: MarketSectorIndexDecodeRequest[] = []

  constructor(private readonly breakSecondPageJoin = false) {}

  async read(request: MarketSectorIndexDecodeRequest): Promise<MarketSectorIndexTransportResponse> {
    this.requests.push(structuredClone(request))
    if (request.kind === 'DIRECTORY') {
      const payload: any = structuredClone(directoryFixture)
      payload.scopes[0].first_available_date = null
      payload.scopes[0].last_available_date = null
      payload.release.history_start = '2022-12-25'
      return { payload, httpStatus: 200 }
    }
    const offset = request.query.after_date === null
      ? 0
      : (seriesV2Fixture.points as readonly { date: string }[])
          .findIndex((point) => point.date === request.query.after_date) + 1
    const payload = seriesPayloadForRequest(seriesV2Fixture, request)
    payload.points = payload.points.slice(offset, offset + request.query.limit)
    if (this.breakSecondPageJoin && request.query.after_date === '2026-09-09') {
      payload.points[0].segment_id = 'wrong-segment'
    }
    payload.query.next_after_date = offset + request.query.limit < seriesV2Fixture.points.length
      ? payload.points.at(-1).date
      : null
    return { payload, httpStatus: 200 }
  }
}

class MultiScopeGateway implements MarketSectorIndexPublicGateway {
  readonly kind = 'MARKET_SECTOR_INDEX_MULTI_SCOPE_FIXTURE'
  readonly requests: MarketSectorIndexDecodeRequest[] = []

  async read(request: MarketSectorIndexDecodeRequest): Promise<MarketSectorIndexTransportResponse> {
    this.requests.push(structuredClone(request))
    if (request.kind === 'DIRECTORY') {
      const payload: any = structuredClone(directoryFixture)
      payload.scopes.push({
        ...payload.scopes[0],
        scope_token: WEAPON_TOKEN,
        scope_code: 'WEAPON',
        scope_kind: 'SECTOR',
        labels: { en: 'Weapons', zh_cn: '武器' },
      })
      payload.scopes.push({
        ...payload.scopes[0],
        scope_token: CASE_TOKEN,
        scope_code: 'CASE',
        scope_kind: 'SECTOR',
        labels: { en: 'Cases', zh_cn: '武器箱' },
        current_member_count: 44,
      })
      return { payload, httpStatus: 200 }
    }
    const payload = seriesPayloadForRequest(seriesFixture, request)
    if (request.query.scope_token === WEAPON_TOKEN) {
      payload.scope = {
        ...payload.scope,
        scope_token: WEAPON_TOKEN,
        scope_code: 'WEAPON',
        scope_kind: 'SECTOR',
        labels: { en: 'Weapons', zh_cn: '武器' },
      }
    } else if (request.query.scope_token === CASE_TOKEN) {
      payload.scope = {
        ...payload.scope,
        scope_token: CASE_TOKEN,
        scope_code: 'CASE',
        scope_kind: 'SECTOR',
        labels: { en: 'Cases', zh_cn: '武器箱' },
        current_member_count: 44,
      }
    }
    return { payload, httpStatus: 200 }
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

class StubCatalogGateway implements CatalogDisplayGateway {
  readonly kind = 'CATALOG_DISPLAY_STUB'
  readonly detailQueries: WireCatalogDetailQuery[] = []

  constructor(private readonly failQueries = false) {}

  async read(request: CatalogDisplayGatewayRequest): Promise<unknown> {
    if (request.operation === 'CATALOG_DISPLAY_SNAPSHOT_LIST') {
      const response = structuredClone(
        catalogSnapshotListFixture,
      ) as WireCatalogDisplaySnapshotListResponse
      response.query = structuredClone(request.query)
      return response
    }
    throw new TypeError(`unexpected catalog display request ${request.operation}`)
  }

  async readQuery(request: CatalogDisplayQueryGatewayRequest): Promise<unknown> {
    if (this.failQueries) throw new CatalogDisplayTransportError('NETWORK_UNAVAILABLE', true)
    if (request.operation !== 'CATALOG_QUERY_DETAIL') {
      throw new TypeError(`unexpected catalog query request ${request.operation}`)
    }
    this.detailQueries.push(structuredClone(request.query))
    const response = structuredClone(catalogDetailFixture) as WireCatalogDetailResponse
    response.query = structuredClone(request.query)
    response.member.projection.analysis_unit_id = request.query.analysis_unit_id
    response.member.projection.catalog_version = response.snapshot.catalog_version
    const { projection_hash: _memberHash, ...memberDocument } = response.member.projection
    response.member.projection.projection_hash = canonicalHash(memberDocument)
    response.siblings = []
    response.next_cursor = null
    response.sibling_total = 1
    return response
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('public market index chart windows', () => {
  const points = seriesFixture.points as unknown as import('../src/wire/marketSectorIndexPublicApiTypes').MarketSectorIndexPoint[]

  it('keeps formal returns closed at a boundary while adding a display-only bridge for finite levels', () => {
    expect(recentIndexFrom('2022-12-25', '2026-09-10')).toBe('2025-09-09')
    expect(indexFromForRange('2022-12-25', '2026-09-10', '3M')).toBe('2026-06-11')
    expect(windowReturn(points)).toBeCloseTo(0.01)
    expect(commonObservableReturn(points)).toBeCloseTo(0.01)
    expect(windowReturn(points, '7D')).toBeNull()
    const gapped = structuredClone(points)
    gapped[1] = {
      ...gapped[1]!,
      date: '2026-09-11',
      connect_to_previous: false,
      segment_id: 'segment-2',
      index: { ...gapped[1]!.index, value: '1100', period_return: null },
    }
    expect(windowReturn(gapped)).toBeNull()
    expect(latestDailyReturn(gapped)).toBeNull()
    expect(commonObservableReturn(gapped)).toBeNull()
    expect(indexLevelRuns(gapped)).toHaveLength(2)
    expect(indexLevelBridgeRuns(gapped)).toHaveLength(1)
    expect(joinedLevelLine([
      ...indexLevelRuns(gapped),
      ...indexLevelBridgeRuns(gapped),
    ]).map((point) => point.value)).toEqual([1000, 1100])
    const week = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(Date.parse('2026-09-04T00:00:00.000Z') + index * 86_400_000).toISOString().slice(0, 10)
      const template = structuredClone(points[index === 0 ? 0 : 1]!)
      return {
        ...template,
        date,
        connect_to_previous: index > 0,
        segment_id: 'segment-1',
        index: {
          ...template.index,
          value: String(1000 + index * 10),
          period_return: index === 0 ? null : '0.01',
        },
      }
    })
    expect(windowReturn(week, '7D')).toBeCloseTo(0.06)
    expect(windowReturn(week)).toBeCloseTo(0.06)
    expect(latestDailyReturn(week)).toBeCloseTo(0.01)
    expect(filterPointsByRange(points, '7D')).toHaveLength(2)
    expect(indexLevelRuns(points)).toHaveLength(1)
    const overlay = rebasedPercentRuns(points)
    expect(overlay[0]?.map((point) => point.value)).toEqual([0, expect.closeTo(0.01)])
    expect(valuesOnDates(overlay[0] ?? [], unionChartDates(overlay))).toEqual([0, expect.closeTo(0.01)])
  })

  it('renders the 2026-09-11 through 2026-09-17 mixed-quality path without inventing a formal return', () => {
    const dates = [
      '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14',
      '2026-09-15', '2026-09-16', '2026-09-17',
    ] as const
    const segments = ['prior', 'repair', 'repair', 'successor', 'successor', 'measured', 'measured'] as const
    const starts = new Set([0, 1, 3, 5])
    const mixed = dates.map((date, index) => {
      const template = structuredClone(points[0]!)
      const measured = index >= 5
      return {
        ...template,
        point_id: String(index + 1).repeat(64),
        date,
        segment_id: segments[index]!,
        connect_to_previous: !starts.has(index),
        availability: measured ? 'CONTEMPORANEOUSLY_MEASURED' : 'RECONSTRUCTED_LATE_BOUND',
        index: {
          ...template.index,
          value: String(1000 + index * 10),
          period_return: starts.has(index) ? null : '0.01',
        },
        quality: {
          ...template.quality,
          overall: measured ? 'HIGH' : 'PARTIAL',
          reason_codes: measured ? ['CONTEMPORANEOUS'] : ['LATE_BOUND_RECONSTRUCTION'],
        },
      } as import('../src/wire/marketSectorIndexPublicApiTypes').MarketSectorIndexPoint
    })

    const solid = indexLevelRuns(mixed)
    const bridges = indexLevelBridgeRuns(mixed)
    expect(solid).toHaveLength(4)
    expect(bridges).toHaveLength(3)
    expect(windowReturn(mixed, '7D')).toBeNull()
    expect(joinedLevelLine([...solid, ...bridges]).map((point) => point.value)).toEqual([
      1000, 1010, 1020, 1030, 1040, 1050, 1060,
    ])
    expect(rebasedPercentBridgeRuns(mixed)).toHaveLength(3)
    expect(rebasedPercentRuns(mixed)[3]?.at(-1)?.value).toBeCloseTo(0.06)
    expect(chartPointDisclosures(mixed).filter((point) => point.visualBridgeFromPrevious).map((point) => point.date)).toEqual([
      '2026-09-12', '2026-09-14', '2026-09-16',
    ])
    expect(chartPointDisclosures(mixed).at(-1)).toMatchObject({
      availability: 'CONTEMPORANEOUSLY_MEASURED',
      overallQuality: 'HIGH',
    })

    const withTrueNull = structuredClone(mixed)
    withTrueNull[3] = {
      ...withTrueNull[3]!,
      index: { ...withTrueNull[3]!.index, value: null, period_return: null },
    }
    expect(indexLevelBridgeRuns(withTrueNull)).toHaveLength(2)
    expect(joinedLevelLine([
      ...indexLevelRuns(withTrueNull),
      ...indexLevelBridgeRuns(withTrueNull),
    ]).find((point) => point.date === '2026-09-14')?.value).toBeNull()
  })

  it('keeps explicit nulls unavailable and does not format empty points as NaN', () => {
    const main = [
      { date: '2026-06-20', value: 0 },
      { date: '2026-09-11', value: -0.02 },
      { date: '2026-09-14', value: null },
    ]
    const stub = [
      { date: '2026-06-20', value: null },
      { date: '2026-09-11', value: null },
      { date: '2026-09-14', value: 0 },
    ]
    expect(primaryRun([main, stub])).toBe(main)
    expect(joinedLevelLine([main, stub]).map((point) => point.value)).toEqual([0, -0.02, 0])
    expect(formatChartValue(null, (value) => `${value}`)).toBe('—')
    expect(formatChartValue(Number.NaN, (value) => `${value}`)).toBe('—')
    expect(formatChartValue(-0.025, (value) => value.toFixed(3))).toBe('-0.025')
  })

  it('paints window returns with the public paper palette instead of the dark island', () => {
    expect(returnFill(null)).toBe('#e7e7df')
    expect(returnFill(0.08)).toBe('rgb(50 129 172)')
    expect(returnFill(-0.08)).toBe('rgb(196 92 42)')
    expect(returnLabel(0.08)).toBe('#fffdf7')
    expect(returnLabel(null)).toBe('#102c3a')
  })

  it('keeps heatmap tiles readable and illustrates only the exact named sectors', () => {
    expect(tileFill(0.008)).not.toBe(returnFill(0.008))
    expect(tileFill(0.008)).toMatch(/^rgb\(\d+ \d+ \d+\)$/u)
    const weights = heatmapWeights([16_900_000, 8_400])
    expect(weights[1]! / weights.reduce((sum, weight) => sum + weight, 0)).toBeGreaterThan(0.025)
    const boxes = layoutTreemap(weights)
    const area = boxes.reduce((sum, box) => sum + box.w * box.h, 0)
    expect(area).toBeCloseTo(10_000, 4)
    expect(sectorIllustrationModel('KNIFE')).toBe('skin_knife_butterfly_ruby')
    expect(sectorIllustrationModel('GLOVE')).toBe('sporty_gloves')
    expect(sectorIllustrationModel('WEAPON')).toBe('skin_ak47_vulcan')
    expect(sectorIllustrationModel('CASE')).toBe('crate_dreams_nightmares')
    expect(sectorIllustrationModel('AGENT')).toBe('agent_getaway_sally')
    expect(sectorIllustrationModel('COLLECTION')).toBe('collection_cache')
    expect(sectorIllustrationModel('ARMORY')).toBe('skin_awp_longdog')
    expect(sectorIllustrationModel('WEAPON:RIFLE')).toBeNull()
  })
})

describe('market/sector continuous index public boundary', () => {
  it('pins the shared Schema and accepts recursively sealed directory and series examples', async () => {
    const schemaText = readFileSync(
      resolve(import.meta.dirname, '../../schemas/market-sector-index-public-api.v1.schema.json'),
      'utf8',
    ).replace(/\r\n?/gu, '\n')
    const schemaHash = createHash('sha256').update(schemaText).digest('hex')
    const generated = readFileSync(
      resolve(import.meta.dirname, '../src/wire/generated/marketSectorIndexPublicApiValidator.js'),
      'utf8',
    )
    expect(JSON.parse(schemaText).$id).toBe('urn:cs2:market-sector-index-public-api:1')
    expect(generated).toContain(`market-sector-index-public-api.v1.schema.json:${schemaHash}`)

    const gateway = new FixtureGateway()
    const api = new MarketSectorIndexPublicApi(gateway)
    const directory = await api.directory(DIRECTORY_REQUEST.query)
    const series = await api.series(SERIES_REQUEST.query)
    expect(directory.response_kind).toBe('SCOPE_DIRECTORY')
    expect(series.response_kind).toBe('INDEX_SERIES')
    expect(Object.isFrozen(directory)).toBe(true)
    expect(Object.isFrozen(series)).toBe(true)
    if (series.response_kind !== 'INDEX_SERIES') throw new Error('unexpected response')
    expect(Object.isFrozen(series.points[0]?.coverage)).toBe(true)
    expect(gateway.requests).toEqual([DIRECTORY_REQUEST, SERIES_REQUEST])
  })

  it('rejects identity, query, coverage and connectivity drift plus mismatched error status', () => {
    const cases: ((payload: any) => void)[] = [
      (payload) => { payload.scope.scope_token = 'f'.repeat(64) },
      (payload) => { payload.query.to_date = '2026-09-09' },
      (payload) => { payload.points[1].coverage.coverage_ratio = '0.9' },
      (payload) => { payload.points[1].date = '2026-09-10' },
      (payload) => { payload.points[1].connect_to_previous = true; payload.points[1].segment_id = 'other' },
      (payload) => { payload.points[1].quality.grade_counts.E = 1 },
      (payload) => { payload.points[1].coverage.qualified_member_count = 9 },
    ]
    for (const mutate of cases) {
      const payload: any = structuredClone(seriesFixture)
      mutate(payload)
      expect(() => decodeMarketSectorIndexDocument(payload, SERIES_REQUEST, 200)).toThrow()
    }
    expect(() => decodeMarketSectorIndexDocument(notPublishedFixture, DIRECTORY_REQUEST, 200)).toThrow()
    expect(() => decodeMarketSectorIndexDocument(notPublishedFixture, DIRECTORY_REQUEST, 404)).not.toThrow()
  })

  it('accepts a paired return rejected by the declared return domain without counting it as qualified', () => {
    const payload: any = structuredClone(seriesFixture)
    const point = payload.points[1]
    point.coverage.paired_member_count = 9
    point.quality.rejected_return_domain_count = 1
    point.quality.grade_counts.E = 1
    expect(() => decodeMarketSectorIndexDocument(payload, SERIES_REQUEST, 200)).not.toThrow()
  })

  it('builds only the exact bounded same-origin directory and series URLs', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      return jsonResponse(url.includes('/points?') ? seriesFixture : directoryFixture)
    })
    const api = new MarketSectorIndexPublicApi(new HttpMarketSectorIndexPublicGateway({ fetcher }))
    await api.directory({ publication_id: null })
    await api.series(SERIES_REQUEST.query)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(String(fetcher.mock.calls[0]?.[0])).toBe('/api/v1/market-index/public/scopes')
    const seriesUrl = new URL(String(fetcher.mock.calls[1]?.[0]), 'https://example.test')
    expect(seriesUrl.pathname).toBe(`/api/v2/market-index/public/scopes/${TOKEN}/points`)
    expect(Object.fromEntries(seriesUrl.searchParams)).toEqual({
      publication: PUBLICATION,
      from: '2026-09-08',
      to: '2026-09-10',
      limit: '512',
    })
  })

  it('classifies a public-gateway origin outage as transport rather than contract corruption', async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      transport_error: { code: 'ORIGIN_UNAVAILABLE', http_status: 503 },
    }, 503))
    const api = new MarketSectorIndexPublicApi(new HttpMarketSectorIndexPublicGateway({ fetcher }))

    await expect(api.directory({ publication_id: null })).rejects.toEqual(
      new MarketSectorIndexTransportError('HTTP_STATUS_MISMATCH', true, 503),
    )
  })

  it('shows a retryable temporary outage instead of a data-validation failure', async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      transport_error: { code: 'ORIGIN_UNAVAILABLE', http_status: 503 },
    }, 503))
    const gateway = new HttpMarketSectorIndexPublicGateway({ fetcher })
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="ALL" />
      </LangProvider>,
    )

    const panel = await screen.findByTestId('market-sector-index-history')
    expect(await screen.findByText('结果服务暂不可用')).toBeInTheDocument()
    expect(panel).toHaveAttribute('data-testid', 'market-sector-index-history')
    expect(panel).toHaveTextContent('请稍后手动重试')
    expect(panel).not.toHaveTextContent('结果未通过校验')
    expect(panel.querySelector('[data-error-code="TRANSPORT"]')).not.toBeNull()
  })

  it('rejects calendar-invalid dates instead of allowing Date normalization', async () => {
    const gateway = new FixtureGateway()
    const api = new MarketSectorIndexPublicApi(gateway)
    await expect(api.series({
      ...SERIES_REQUEST.query,
      from_date: '2026-02-30',
    })).rejects.toThrow('invalid index series identity or date')
    expect(gateway.requests).toHaveLength(0)
  })

  it('renders real descriptive values, a gap-aware chart and reconstruction disclosure', async () => {
    const gateway = new FixtureGateway()
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="ALL" />
      </LangProvider>,
    )
    const panel = await screen.findByTestId('market-sector-index-history')
    expect(await screen.findByText('1,010')).toBeInTheDocument()
    expect(panel).toHaveAttribute('data-series-id', 'ROBUST_EQUAL_V3')
    expect(panel).toHaveTextContent('市场指数与历史轨迹')
    expect(panel).toHaveTextContent('正式序列：稳健等权（ROBUST_EQUAL_V3）')
    expect(panel).toHaveTextContent('当前只展示稳健等权正式序列')
    expect(panel).not.toHaveTextContent('价格分层平衡几何指数')
    expect(panel).toHaveTextContent('诊断：原始等权日涨跌')
    expect(panel).toHaveTextContent('正式：稳健等权日涨跌')
    expect(panel).toHaveTextContent('1%')
    expect(panel).toHaveTextContent('72.7%')
    expect(panel).toHaveTextContent('事后重建')
    expect(panel).toHaveTextContent('不是预测或交易建议')
    expect(panel).not.toHaveTextContent('虚线只连接两端均有指数值')
    expect(panel.querySelector('[data-segment-count="1"]')).not.toBeNull()
    const chart = await screen.findByRole('img', { name: /大盘连续指数/u })
    expect(chart).toHaveAttribute('data-bridge-count', '0')
    expect(chart).toHaveAttribute('data-point-disclosure-count', '2')
    expect(gateway.requests).toEqual([
      DIRECTORY_REQUEST,
      { ...SERIES_REQUEST, query: { ...SERIES_REQUEST.query, limit: 92 } },
    ])
  })

  it('names the only formal series in English and exposes no price-weighted selector', async () => {
    render(
      <LangProvider lang="en">
        <MarketSectorIndexHistory gateway={new FixtureGateway()} scopeCode="ALL" />
      </LangProvider>,
    )
    const panel = await screen.findByTestId('market-sector-index-history')
    expect(panel).toHaveTextContent('Market index and history')
    expect(panel).toHaveTextContent('Official series: Robust equal weight (ROBUST_EQUAL_V3)')
    expect(panel).toHaveTextContent('there is no price- or market-cap-weighted entry point')
    expect(panel).not.toHaveTextContent('price-tier balanced')
    expect(panel.querySelector('select[name="index-method"]')).toBeNull()
  })

  it('accepts V2 mixed semantics and renders measured quality denominators and anomaly detail', async () => {
    expect(() => decodeMarketSectorIndexDocument(seriesV2Fixture, SERIES_V2_REQUEST, 200)).not.toThrow()
    const gateway = new V2FixtureGateway()
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="ALL" />
      </LangProvider>,
    )
    const panel = await screen.findByTestId('market-sector-index-history')
    expect(await screen.findByText('1,020.1')).toBeInTheDocument()
    expect(panel).toHaveTextContent('上线后同期实测')
    expect(panel).toHaveTextContent('A 6 · B 1 · C 1 · D 0 · E 2')
    expect(panel).not.toHaveTextContent('unit-redacted-1')
    expect(gateway.requests).toEqual([
      DIRECTORY_REQUEST,
      { ...SERIES_V2_REQUEST, query: { ...SERIES_V2_REQUEST.query, limit: 92 } },
    ])
    expect(panel.querySelector('[data-segment-count="2"]')).not.toBeNull()
    expect(panel.querySelector('[data-bridge-count="1"]')).not.toBeNull()
    expect(await screen.findByRole('img', { name: /大盘连续指数/u })).toHaveAttribute('data-bridge-count', '1')
  })

  it('resolves anomaly contributor ids into authoritative names through the catalog gateway', async () => {
    const gateway = new V2FixtureGateway()
    const catalogGateway = new StubCatalogGateway()
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory
          gateway={gateway}
          scopeCode="ALL"
          catalogGateway={catalogGateway}
        />
      </LangProvider>,
    )
    const panel = await screen.findByTestId('market-sector-index-history')
    expect(await screen.findByText('1,020.1')).toBeInTheDocument()
    const details = panel.querySelector('details.public-market-index__anomalies')
    expect(details).not.toBeNull()
    fireEvent.click(screen.getByText('查看异常贡献明细'))
    expect(details).toHaveAttribute('open')
    await expect(screen.findByText(/合同样例/u)).resolves.toBeInTheDocument()
    expect(screen.queryByText('unit-redacted-1')).toBeNull()
    expect(catalogGateway.detailQueries).toEqual([{
      analysis_unit_id: 'unit-redacted-1',
      page_size: 1,
      snapshot_id: catalogSnapshotListFixture.members[0]!.snapshot_id,
    }])
    expect(panel).toHaveTextContent('20% → 10%')
  })

  it('keeps internal anomaly ids hidden when the catalog name channel fails', async () => {
    const gateway = new V2FixtureGateway()
    const catalogGateway = new StubCatalogGateway(true)
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory
          gateway={gateway}
          scopeCode="ALL"
          catalogGateway={catalogGateway}
        />
      </LangProvider>,
    )
    const panel = await screen.findByTestId('market-sector-index-history')
    expect(await screen.findByText('1,020.1')).toBeInTheDocument()
    const details = panel.querySelector('details.public-market-index__anomalies')
    expect(details).not.toBeNull()
    fireEvent.click(screen.getByText('查看异常贡献明细'))
    await expect(screen.findByText('饰品名称暂不可用')).resolves.toBeInTheDocument()
    expect(screen.queryByText('unit-redacted-1')).toBeNull()
    expect(screen.queryByText(/合同样例/u)).toBeNull()
  })

  it('reads the V2 chart through bounded pages, pins the release and validates page joins', async () => {
    const gateway = new PagedV2FixtureGateway()
    const api = new MarketSectorIndexPublicApi(gateway)
    const series = await api.seriesPages({
      ...SERIES_V2_REQUEST.query,
      from_date: '2026-09-08',
      limit: 5,
    }, {}, 2)
    expect(series.response_kind).toBe('INDEX_SERIES')
    if (series.response_kind !== 'INDEX_SERIES') throw new Error('unexpected response')
    expect(series.points.map((point) => point.date)).toEqual([
      '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12',
    ])
    expect(gateway.requests).toHaveLength(3)
    expect(gateway.requests.slice(1).map((request) => request.query.publication_id)).toEqual([
      seriesV2Fixture.release.publication_id,
      seriesV2Fixture.release.publication_id,
    ])
    expect(gateway.requests.filter(isSeriesRequest).map((request) => ({
      after: request.query.after_date,
      limit: request.query.limit,
    }))).toEqual([
      { after: null, limit: 2 },
      { after: '2026-09-09', limit: 2 },
      { after: '2026-09-11', limit: 1 },
    ])
  })

  it('pins the selected legacy API version as well as the publication across pages', async () => {
    const requested: string[] = []
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), 'https://example.test')
      requested.push(`${url.pathname}${url.search}`)
      if (url.pathname.startsWith('/api/v2/')) {
        return jsonResponse({ status: 404, message: 'route not found' }, 404)
      }
      const after = url.searchParams.get('after')
      const offset = after === null ? 0 : 1
      const payload: any = structuredClone(seriesFixture)
      payload.query = {
        from_date: '2026-09-08',
        to_date: '2026-09-10',
        after_date: after,
        limit: 1,
        next_after_date: offset === 0 ? seriesFixture.points[0]?.date : null,
      }
      payload.points = structuredClone(seriesFixture.points.slice(offset, offset + 1))
      return jsonResponse(payload)
    })
    const api = new MarketSectorIndexPublicApi(new HttpMarketSectorIndexPublicGateway({ fetcher }))
    const result = await api.seriesPages({ ...SERIES_REQUEST.query, limit: 2 }, {}, 1)
    expect(result.response_kind).toBe('INDEX_SERIES')
    expect(requested.filter((path) => path.startsWith('/api/v2/'))).toHaveLength(1)
    expect(requested.filter((path) => path.startsWith('/api/v1/'))).toHaveLength(2)
    expect(requested[2]).toContain(`publication=${PUBLICATION}`)
    expect(requested[2]).toContain('after=2026-09-08')
  })

  it('reads a completing measured tail after the requested window fills exactly', async () => {
    const gateway = new PagedV2FixtureGateway()
    const api = new MarketSectorIndexPublicApi(gateway)
    const series = await api.seriesPages({
      ...SERIES_V2_REQUEST.query,
      from_date: '2026-09-08',
      limit: 4,
    })
    expect(series.response_kind).toBe('INDEX_SERIES')
    if (series.response_kind !== 'INDEX_SERIES') throw new Error('unexpected response')
    expect(series.points.map((point) => point.date)).toEqual([
      '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12',
    ])
    expect(gateway.requests.filter(isSeriesRequest).map((request) => ({
      after: request.query.after_date,
      limit: request.query.limit,
    }))).toEqual([
      { after: null, limit: 4 },
      { after: '2026-09-11', limit: 128 },
    ])
  })

  it('rejects a page whose first point claims a different connected segment', async () => {
    const api = new MarketSectorIndexPublicApi(new PagedV2FixtureGateway(true))
    await expect(api.seriesPages({
      ...SERIES_V2_REQUEST.query,
      from_date: '2026-09-08',
      limit: 5,
    }, {}, 2)).rejects.toBeInstanceOf(MarketSectorIndexValidationError)
  })

  it('renders from bounded pages when the directory lacks per-scope date bounds', async () => {
    const gateway = new PagedV2FixtureGateway()
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="ALL" />
      </LangProvider>,
    )
    expect(await screen.findByTestId('market-sector-index-history')).toBeInTheDocument()
    expect(await screen.findByText('1,020.1')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /大盘连续指数/u })).toBeInTheDocument()
    const seriesRequests = gateway.requests.filter(isSeriesRequest)
    expect(seriesRequests).toHaveLength(1)
    expect(seriesRequests[0]?.query.limit).toBe(92)
    expect(seriesRequests[0]?.query.from_date).toBe('2026-06-11')
  })

  it('keeps sector history browsable when the separate current-day product is unavailable', async () => {
    const gateway = new MultiScopeGateway()
    const onSelectSector = vi.fn()
    const onClearSector = vi.fn()
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory
          gateway={gateway}
          scopeCode="ALL"
          view="SECTORS"
          onSelectSector={onSelectSector}
          onClearSector={onClearSector}
        />
      </LangProvider>,
    )
    const chart = await screen.findByRole('img', { name: '板块指数相对窗口起点' })
    await waitFor(() => expect(chart).toHaveAttribute('data-series-count', '2'))
    expect(screen.getByRole('group', { name: '板块曲线' })).toBeInTheDocument()
    const weaponLegend = screen.getByTestId('sector-line-legend-WEAPON')
    expect(weaponLegend.querySelector('.public-market-board__legend-dot')).toHaveStyle({
      backgroundColor: '#0072b2',
    })
    expect(screen.getByTestId('sector-line-legend-CASE').querySelector('.public-market-board__legend-dot')).toHaveStyle({
      backgroundColor: '#333333',
    })
    expect(weaponLegend).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(weaponLegend)
    expect(onSelectSector).toHaveBeenCalledWith('WEAPON')
    expect(weaponLegend).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(chart).toHaveAttribute('data-series-count', '1'))
    fireEvent.click(screen.getByRole('button', { name: '全部板块' }))
    expect(onClearSector).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(chart).toHaveAttribute('data-series-count', '2'))
    expect(screen.getByRole('list', { name: '板块热力' })).toBeInTheDocument()
    const weaponTile = screen.getByTestId('sector-tile-WEAPON')
    expect(weaponTile).toBeInTheDocument()
    expect(screen.getByTestId('sector-tile-CASE')).toBeInTheDocument()
    fireEvent.click(weaponTile)
    expect(onSelectSector).toHaveBeenLastCalledWith('WEAPON')
    expect(screen.getByTestId('market-sector-index-history')).toHaveTextContent('武器')
    expect(screen.getByTestId('market-sector-index-history')).toHaveTextContent('武器箱')
    expect(gateway.requests.map((request) => request.kind)).toEqual([
      'DIRECTORY', 'SERIES', 'SERIES', 'SERIES',
    ])
  })

  it('publishes the heatmap layout once after the complete sector batch resolves', async () => {
    const base = new MultiScopeGateway()
    let releaseWeapon!: () => void
    let releaseCases!: () => void
    const weaponGate = new Promise<void>((resolve) => { releaseWeapon = resolve })
    const casesGate = new Promise<void>((resolve) => { releaseCases = resolve })
    const gateway: MarketSectorIndexPublicGateway = {
      kind: 'DEFERRED_MULTI_SCOPE_FIXTURE',
      read: async (request) => {
        const response = await base.read(request)
        if (request.kind === 'SERIES' && request.query.scope_token === WEAPON_TOKEN) await weaponGate
        if (request.kind === 'SERIES' && request.query.scope_token === CASE_TOKEN) await casesGate
        return response
      },
    }
    render(
      <LangProvider lang="zh">
        <MarketSectorIndexHistory gateway={gateway} scopeCode="ALL" view="SECTORS" />
      </LangProvider>,
    )
    await waitFor(() => expect(base.requests.filter((request) => request.kind === 'SERIES')).toHaveLength(3))
    expect(screen.queryByRole('list', { name: '板块热力' })).toBeNull()

    releaseWeapon()
    await waitFor(() => expect(base.requests.filter((request) => (
      request.kind === 'SERIES' && request.query.scope_token === WEAPON_TOKEN
    ))).toHaveLength(1))
    expect(screen.queryByRole('list', { name: '板块热力' })).toBeNull()

    releaseCases()
    expect(await screen.findByRole('list', { name: '板块热力' })).toBeInTheDocument()
    expect(screen.getByTestId('sector-tile-WEAPON')).toBeInTheDocument()
    expect(screen.getByTestId('sector-tile-CASE')).toBeInTheDocument()
  })
})


