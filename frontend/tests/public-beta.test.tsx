import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import listFixture from '../../schemas/examples/catalog-display-list.valid.json'
import snapshotListFixture from '../../schemas/examples/catalog-display-snapshot-list.valid.json'
import qualityDetailFixture from '../../schemas/examples/result-read-quality-detail.valid.json'
import unitDetailFixture from '../../schemas/examples/result-read-unit-detail.valid.json'
import resultErrorFixture from '../../schemas/examples/result-read-error.valid.json'
import publicMarketFixture from '../../schemas/examples/market-watchlist-public-market.valid.json'
import publicWatchlistFixture from '../../schemas/examples/market-watchlist-public-watchlist.valid.json'
import publicNotPublishedFixture from '../../schemas/examples/market-watchlist-public-error.valid.json'
import marketDescriptiveCurrentFixture from '../../schemas/examples/market-descriptive-public-api/v1/overview-current.json'
import marketDescriptiveNotPublishedFixture from '../../schemas/examples/market-descriptive-public-api/v1/not-published.json'
import publicTrendingFixture from '../../schemas/examples/single-item-trending-list.valid.json'
import itemMonitorResultFixture from '../../schemas/examples/single-item-monitor-public-api/v1/result.json'
import itemMonitorEmptyFixture from '../../schemas/examples/single-item-monitor-public-api/v1/initial-empty.json'
import valveListFixture from '../../schemas/examples/valve-event-public-list.valid.json'
import { PublicBetaApp } from '../src/PublicBetaApp'
import { publicHistoryState } from '../src/publicNavigation'
import type {
  CatalogDisplayGateway,
  CatalogDisplayGatewayRequest,
  CatalogDisplayQueryGatewayRequest,
} from '../src/api/CatalogDisplayApi'
import type { GatewayReadOptions } from '../src/api/GatewayReadOptions'
import { CatalogDisplayTransportError } from '../src/api/HttpCatalogDisplayGateway'
import type {
  FormalResultReadGateway,
  FormalResultReadRequest,
} from '../src/api/FormalResultReadApi'
import type {
  MarketWatchlistPublicGateway,
  PublicResultRequest,
  PublicResultTransportResponse,
} from '../src/api/MarketWatchlistPublicApi'
import type {
  MarketDescriptivePublicGateway,
  MarketDescriptiveTransportResponse,
} from '../src/api/MarketDescriptivePublicApi'
import type { MarketDescriptiveDecodeRequest } from '../src/wire/marketDescriptivePublicApiDecode'
import type {
  MarketSectorIndexPublicGateway,
  MarketSectorIndexTransportResponse,
} from '../src/api/MarketSectorIndexPublicApi'
import type { ItemMonitorPublicGateway, ItemMonitorTransportResponse } from '../src/api/ItemMonitorPublicApi'
import type { ItemMonitorDecodeRequest } from '../src/wire/itemMonitorPublicApiDecode'
import type {
  SingleItemTrendingPublicGateway,
  TrendingTransportResponse,
} from '../src/api/SingleItemTrendingPublicApi'
import { PublicErrorBoundary } from '../src/components/PublicErrorBoundary'
import type {
  FxReferenceGateway,
  FxReferenceRequest,
} from '../src/api/FxReferenceApi'
import { canonicalHash, snapshotIdOf } from '../src/wire/canonical'
import type {
  CatalogQueryRarity,
  WireCatalogDisplayQueryResponse,
  WireCatalogSeriesMember,
} from '../src/wire/catalogDisplayQueryApiTypes'
import type {
  WireCatalogDisplayListResponse,
  WireCatalogDisplayProjection,
} from '../src/wire/catalogDisplayApiTypes'
import type { WireCatalogDisplaySnapshotListResponse } from '../src/wire/catalogDisplaySnapshotApiTypes'
import type { WireQualityDetailResponse, WireUnitDetailResponse } from '../src/wire/resultReadApiTypes'
import type { TrendingListQuery } from '../src/wire/singleItemTrendingPublicApiTypes'
import { QualityListTestGateway } from './support/qualityListTestGateway'
import { PriceWireTestGateway } from './support/priceWireTestGateway'
import { PublicItemResultTestGateway, publicItemResultFixture } from './support/publicItemResultTestGateway'
import {
  CATALOG_NAVIGATION_PROFILE_SHA256,
  CATALOG_NAVIGATION_SOURCE_MAPPING_SHA256,
} from '../src/wire/catalogDisplayQueryApiSchema'
import { normalizeCatalogQueryText } from '../src/catalog/catalogQueryText'
import {
  CATALOG_DISCOVERY_BATCH_SIZE,
  CATALOG_DISCOVERY_FIXED_MODEL_IDS,
  CATALOG_DISCOVERY_SCROLL_OFFSET_SESSION_KEY,
  CATALOG_DISCOVERY_SESSION_KEY,
  CATALOG_DISCOVERY_VISIBLE_COUNT_SESSION_KEY,
  orderCatalogDiscoverySeries,
  planCatalogDiscoveryModels,
} from '../src/catalog/catalogDiscovery'
import { compareCatalogSeriesDefault } from '../src/catalog/catalogDefaultOrder'
import { catalogSeriesLabel } from '../src/catalog/catalogSeriesPresentation'
import { equipmentModelById, equipmentModels, type EquipmentModel } from '../src/catalog/equipmentModels'
import {
  PersonalWatchlistCorruptError,
  type PersonalWatchTarget,
  type PersonalWatchlistStore,
} from '../src/watchlist/personalWatchlist'

const NOW = '2026-08-25T02:00:00.000Z'
const QUERY_INSTANT = '2026-08-25T02:00:00.000000Z'
const CATALOG_VERSION = 'catalog-public-test-v1'
const UNIT_ID = 'item:43'
const BASE_CODE = 'fixture.weapon.official-name-shape'
const ZH_NAME = 'StatTrak™ 合同样例 | 官方字符串形状 (久经沙场)'
const ZH_SERIES_NAME = '合同样例 | 官方字符串形状'
const EN_SERIES_NAME = 'Contract Fixture | Official String Shape'
const LAZY_VIEW_WAIT = { timeout: 10_000 } as const

function rehash(projection: WireCatalogDisplayProjection): void {
  const { projection_hash: _projectionHash, ...document } = projection
  projection.projection_hash = canonicalHash(document)
}

class PublicCatalogTestGateway implements CatalogDisplayGateway {
  readonly kind = 'PUBLIC_CATALOG_TEST'
  readonly requests: (CatalogDisplayGatewayRequest | CatalogDisplayQueryGatewayRequest)[] = []

  constructor(
    private readonly options: Readonly<{
      error?: Error
      emptySnapshots?: boolean
      includeParent?: boolean
      includeSibling?: boolean
      media?: 'BOUND' | 'NOT_PRODUCED' | 'MIXED'
    }> = {},
  ) {}

  protected members(): WireCatalogDisplayListResponse['members'] {
    const response = structuredClone(listFixture) as WireCatalogDisplayListResponse
    const child = response.members[0]
    child.projection.analysis_unit_id = UNIT_ID
    child.projection.catalog_version = CATALOG_VERSION
    if (this.options.includeParent) {
      child.projection.analysis_unit_kind = 'STYLE_VARIANT'
      child.projection.parent_analysis_unit_id = 'item:42'
    }
    if (this.options.media !== 'BOUND') {
      child.projection.media = { status: 'NOT_PRODUCED' }
      child.projection.version_context.media_asset_version_id = null
    }
    rehash(child.projection)
    if (this.options.includeParent) {
      const parent = structuredClone(child)
      parent.projection.analysis_unit_id = 'item:42'
      parent.projection.analysis_unit_kind = 'BASE_MHN'
      parent.projection.parent_analysis_unit_id = null
      if (this.options.media !== 'BOUND' && this.options.media !== 'MIXED') {
        parent.projection.media = { status: 'NOT_PRODUCED' }
        parent.projection.version_context.media_asset_version_id = null
      } else if (parent.projection.media.status !== 'BOUND') {
        const boundTemplate = structuredClone(
          (listFixture as WireCatalogDisplayListResponse).members[0].projection,
        )
        parent.projection.media = boundTemplate.media
        parent.projection.version_context.media_asset_version_id =
          boundTemplate.version_context.media_asset_version_id
      }
      rehash(parent.projection)
      response.members = [parent, child]
    }
    if (this.options.includeSibling) {
      const sibling = structuredClone(child)
      sibling.projection.analysis_unit_id = 'item:44'
      sibling.projection.edition_kind = 'STANDARD'
      sibling.projection.wear_tier = 'FACTORY_NEW'
      sibling.projection.localized_name = {
        authority: 'VALVE_STEAM',
        en: 'Zulu Variant | Official String Shape (Factory New)',
        zh_cn: 'ZZZ 变体 | 官方字符串形状 (崭新出厂)',
      }
      rehash(sibling.projection)
      response.members = [...response.members, sibling]
    }
    return response.members
  }

  private snapshotDescriptor() {
    const response = structuredClone(
      snapshotListFixture,
    ) as WireCatalogDisplaySnapshotListResponse
    const descriptor = response.members[0]
    descriptor.as_of = listFixture.query.as_of
    descriptor.available_at = listFixture.query.known_at
    descriptor.catalog_version = CATALOG_VERSION
    descriptor.member_count = this.members().length
    return descriptor
  }

  private queryBase(request: CatalogDisplayQueryGatewayRequest) {
    return {
      api_contract: 'catalog-display-query-api' as const,
      api_version: 'v1' as const,
      profiles: {
        navigation_sha256: CATALOG_NAVIGATION_PROFILE_SHA256,
        navigation_version: 'v1' as const,
        search_profile: 'ECMASCRIPT_NFKC_WS_LOWER_V1' as const,
        sort_profile: 'LOCALIZED_CODEPOINT_V1' as const,
        source_mapping_sha256: CATALOG_NAVIGATION_SOURCE_MAPPING_SHA256,
      },
      query: structuredClone(request.query),
      snapshot: this.snapshotDescriptor(),
    }
  }

  async read(request: CatalogDisplayGatewayRequest): Promise<unknown> {
    this.requests.push(structuredClone(request))
    if (this.options.error) throw this.options.error
    if (request.operation === 'CATALOG_DISPLAY_SNAPSHOT_LIST') {
      const response = structuredClone(
        snapshotListFixture,
      ) as WireCatalogDisplaySnapshotListResponse
      response.query = structuredClone(request.query)
      response.members = this.options.emptySnapshots ? [] : [this.snapshotDescriptor()]
      return response
    }

    const response = structuredClone(listFixture) as WireCatalogDisplayListResponse
    response.query = structuredClone(request.query)
    response.members = [...this.members()]
    return response
  }

  async readQuery(request: CatalogDisplayQueryGatewayRequest): Promise<unknown> {
    this.requests.push(structuredClone(request))
    if (this.options.error) throw this.options.error
    const base = this.queryBase(request)
    const allMembers = [...this.members()]
    const imageCounts = (members: typeof allMembers) => ({
      bound: members.filter((member) => member.projection.media.status === 'BOUND').length,
      not_produced: members.filter((member) => member.projection.media.status === 'NOT_PRODUCED').length,
      total: members.length,
    })

    if (request.operation === 'CATALOG_QUERY_BOOTSTRAP') {
      return {
        ...base,
        response_kind: 'CATALOG_QUERY_BOOTSTRAP',
        categories: [{ category_id: 'UNCLASSIFIED', member_count: allMembers.length, series_count: 1 }],
        equipment: [{
          category_id: 'UNCLASSIFIED',
          item_kind: 'WEAPON',
          member_count: allMembers.length,
          selection_id: 'unclassified:WEAPON',
          series_count: 1,
        }],
        image_counts: imageCounts(allMembers),
      }
    }

    if (request.operation === 'CATALOG_QUERY_SERIES') {
      const normalized = request.query.search_normalized
      const eligibleMembers = allMembers.filter((member) =>
        request.query.wear_tier === null || member.projection.wear_tier === request.query.wear_tier)
      const matched = eligibleMembers.length > 0 && (normalized === null || eligibleMembers.some((member) =>
        normalizeCatalogQueryText(member.projection.localized_name.en).includes(normalized) ||
        normalizeCatalogQueryText(member.projection.localized_name.zh_cn).includes(normalized),
      ))
      return {
        ...base,
        response_kind: 'CATALOG_QUERY_SERIES',
        members: matched ? [{
          base_item_code: BASE_CODE,
          category_id: 'UNCLASSIFIED',
          equipment_model_id: 'unclassified:WEAPON',
          item_kind: 'WEAPON',
          matched_member_count: eligibleMembers.length,
          rarity: null,
          representative: eligibleMembers[0],
        }] : [],
        next_cursor: null,
        previous_cursor: null,
        total_matching_series: matched ? 1 : 0,
      }
    }

    if (request.operation === 'CATALOG_QUERY_UNITS') {
      const eligible = allMembers.filter((member) =>
        member.projection.item_kind === request.query.item_kind &&
        member.projection.base_item_code === request.query.base_item_code,
      )
      const members = eligible.filter((member) =>
        request.query.edition_kinds.includes(member.projection.edition_kind) &&
        request.query.wear_tiers.includes(member.projection.wear_tier),
      ).sort((left, right) => {
        const editions = ['STANDARD', 'STATTRAK', 'SOUVENIR', 'UNKNOWN'] as const
        const wears = ['FACTORY_NEW', 'MINIMAL_WEAR', 'FIELD_TESTED', 'WELL_WORN', 'BATTLE_SCARRED', 'NOT_APPLICABLE', 'UNKNOWN'] as const
        if (request.query.sort === 'EDITION_ASC') {
          const difference = editions.indexOf(left.projection.edition_kind) - editions.indexOf(right.projection.edition_kind)
          if (difference !== 0) return difference
        }
        if (request.query.sort === 'WEAR_ASC') {
          const difference = wears.indexOf(left.projection.wear_tier) - wears.indexOf(right.projection.wear_tier)
          if (difference !== 0) return difference
        }
        const leftName = normalizeCatalogQueryText(left.projection.localized_name[request.query.locale])
        const rightName = normalizeCatalogQueryText(right.projection.localized_name[request.query.locale])
        return leftName < rightName ? -1 : leftName > rightName ? 1 : left.projection.analysis_unit_id < right.projection.analysis_unit_id ? -1 : 1
      })
      const editionOrder = ['STANDARD', 'STATTRAK', 'SOUVENIR', 'UNKNOWN'] as const
      const wearOrder = ['FACTORY_NEW', 'MINIMAL_WEAR', 'FIELD_TESTED', 'WELL_WORN', 'BATTLE_SCARRED', 'NOT_APPLICABLE', 'UNKNOWN'] as const
      return {
        ...base,
        response_kind: 'CATALOG_QUERY_UNITS',
        facet: {
          edition_counts: editionOrder.flatMap((value) => {
            const count = eligible.filter((member) => member.projection.edition_kind === value).length
            return count === 0 ? [] : [{ value, count }]
          }),
          eligible_member_count: eligible.length,
          image_counts: imageCounts(eligible),
          wear_counts: wearOrder.flatMap((value) => {
            const count = eligible.filter((member) => member.projection.wear_tier === value).length
            return count === 0 ? [] : [{ value, count }]
          }),
        },
        members,
        next_cursor: null,
        previous_cursor: null,
        total_matching_members: members.length,
      }
    }

    const member = allMembers.find((candidate) =>
      candidate.projection.analysis_unit_id === request.query.analysis_unit_id,
    )
    if (!member) {
      return {
        api_contract: 'catalog-display-query-api',
        api_version: 'v1',
        response_kind: 'ERROR',
        error: { code: 'NOT_FOUND', http_status: 404, retryable: false },
      }
    }
    const siblings = allMembers.filter((candidate) =>
      candidate.projection.item_kind === member.projection.item_kind &&
      candidate.projection.base_item_code === member.projection.base_item_code,
    )
    return {
      ...base,
      response_kind: 'CATALOG_QUERY_DETAIL',
      member,
      next_cursor: null,
      parent_present: member.projection.parent_analysis_unit_id !== null && allMembers.some((candidate) =>
        candidate.projection.analysis_unit_id === member.projection.parent_analysis_unit_id,
      ),
      previous_cursor: null,
      sibling_total: siblings.length,
      siblings,
    }
  }
}

const GLOBAL_RIFLE_BASE_CODE = 'fixture.weapon.global-rifle-match'

class MultiCategorySearchCatalogTestGateway extends PublicCatalogTestGateway {
  override async readQuery(
    request: CatalogDisplayQueryGatewayRequest,
    _options: GatewayReadOptions = {},
  ): Promise<unknown> {
    const payload = await super.readQuery(request) as WireCatalogDisplayQueryResponse
    if (payload.response_kind === 'ERROR') return payload
    payload.snapshot.member_count = 3
    if (payload.response_kind === 'CATALOG_QUERY_BOOTSTRAP') {
      payload.categories = [
        { category_id: 'RIFLES', member_count: 1, series_count: 1 },
        ...payload.categories,
      ]
      payload.equipment = [...payload.equipment, {
        category_id: 'RIFLES',
        item_kind: 'WEAPON',
        member_count: 1,
        selection_id: 'weapon_ak47',
        series_count: 1,
      }]
      payload.image_counts = { bound: 0, not_produced: 3, total: 3 }
      return payload
    }
    if (
      payload.response_kind === 'CATALOG_QUERY_SERIES' &&
      request.operation === 'CATALOG_QUERY_SERIES' &&
      request.query.equipment_selection_id === 'GLOBAL' &&
      payload.members[0]
    ) {
      const member = structuredClone(payload.members[0])
      member.base_item_code = GLOBAL_RIFLE_BASE_CODE
      member.category_id = 'RIFLES'
      member.equipment_model_id = 'weapon_ak47'
      member.representative.projection.analysis_unit_id = 'item:global-rifle'
      member.representative.projection.base_item_code = GLOBAL_RIFLE_BASE_CODE
      member.representative.projection.localized_name = {
        authority: 'VALVE_STEAM',
        en: 'StatTrak™ AK-47 | Official String Shape (Field-Tested)',
        zh_cn: 'StatTrak™ AK-47 | 官方字符串形状 (久经沙场)',
      }
      rehash(member.representative.projection)
      payload.members = [member, ...payload.members].sort((left, right) => compareSeries(left, right, request.query.locale))
      payload.total_matching_series = payload.members.length
    }
    return payload
  }
}

const DISCOVERY_MODELS = equipmentModels.filter((model) => model.category !== 'UNCLASSIFIED')

function compareSeries(left: WireCatalogSeriesMember, right: WireCatalogSeriesMember, locale: 'en' | 'zh_cn'): number {
  const value = (member: WireCatalogSeriesMember) => {
    const row = member.representative.projection
    return { baseItemCode: member.base_item_code, rarity: member.rarity,
      name: catalogSeriesLabel(row, { en: row.localized_name.en, zh: row.localized_name.zh_cn })[locale === 'en' ? 'en' : 'zh'] }
  }
  return compareCatalogSeriesDefault(value(left), value(right))
}

class DefaultDiscoveryCatalogTestGateway extends PublicCatalogTestGateway {
  private seriesMember(
    model: EquipmentModel,
    suffix: 'alpha' | 'base' | 'omega',
    rarity: CatalogQueryRarity | null,
    wearTier: WireCatalogSeriesMember['representative']['projection']['wear_tier'],
    source: WireCatalogSeriesMember['representative'],
  ): WireCatalogSeriesMember {
    const template = structuredClone(source)
    const modelIndex = DISCOVERY_MODELS.findIndex((candidate) => candidate.id === model.id)
    const baseItemCode = suffix === 'base'
      ? `defindex:${modelIndex + 100}|paint:none`
      : `fixture:${model.id}:${suffix}`
    template.projection.analysis_unit_id = `item:discovery:${model.id}:${suffix}`
    template.projection.base_item_code = baseItemCode
    template.projection.edition_kind = 'STANDARD'
    template.projection.item_kind = model.itemKind
    template.projection.wear_tier = wearTier
    const label = suffix === 'alpha' ? 'Alpha' : suffix === 'base' ? 'Base' : 'Omega'
    template.projection.localized_name = {
      authority: 'VALVE_STEAM',
      en: `${model.name.en} | ${label} Session Pick (Field-Tested)`,
      zh_cn: `${model.name.zh} | ${label} 会话展示 (久经沙场)`,
    }
    rehash(template.projection)
    return {
      base_item_code: baseItemCode,
      category_id: model.category,
      equipment_model_id: model.id,
      item_kind: model.itemKind,
      matched_member_count: 1,
      rarity,
      representative: template,
    }
  }

  override async readQuery(
    request: CatalogDisplayQueryGatewayRequest,
    _options: GatewayReadOptions = {},
  ): Promise<unknown> {
    const payload = await super.readQuery(request) as WireCatalogDisplayQueryResponse
    if (payload.response_kind === 'ERROR') return payload
    payload.snapshot.member_count = 200
    if (payload.response_kind === 'CATALOG_QUERY_BOOTSTRAP') {
      const categoryIds = [...new Set(DISCOVERY_MODELS.map((model) => model.category))].sort()
      payload.categories = categoryIds.map((categoryId) => {
        const count = DISCOVERY_MODELS.filter((model) => model.category === categoryId).length * 3
        return { category_id: categoryId, member_count: count, series_count: count }
      })
      payload.equipment = DISCOVERY_MODELS.map((model) => ({
        category_id: model.category,
        item_kind: model.itemKind,
        member_count: 3,
        selection_id: model.id,
        series_count: 3,
      }))
      payload.image_counts = { bound: 0, not_produced: 200, total: 200 }
      return payload
    }
    if (
      payload.response_kind === 'CATALOG_QUERY_SERIES' &&
      request.operation === 'CATALOG_QUERY_SERIES'
    ) {
      const selection = request.query.equipment_selection_id
      const models = selection === 'GLOBAL' ? DISCOVERY_MODELS : selection.startsWith('all:')
        ? DISCOVERY_MODELS.filter((candidate) => candidate.category === selection.slice(4))
        : [equipmentModelById(selection)].filter((model): model is EquipmentModel => model !== undefined)
      const source = this.members()[0]
      if (models.length === 0 || !source) return payload
      const rarity = request.query.rarity
      const wear = request.query.wear_tier ?? 'FIELD_TESTED'
      let members = models.flatMap((model) => [
            this.seriesMember(model, 'alpha', rarity, wear, source),
            this.seriesMember(model, 'base', rarity, wear, source),
            this.seriesMember(model, 'omega', rarity, wear, source),
          ]).filter((member) => request.query.search_normalized === null ||
            Object.values(member.representative.projection.localized_name).some((name) =>
              normalizeCatalogQueryText(name).includes(request.query.search_normalized!)))
      if (request.query.sort === 'DISCOVERY') {
        const seed = request.query.discovery_seed!
        const plan = planCatalogDiscoveryModels(DISCOVERY_MODELS.map((model) => ({ model, series: 3, members: 3 })), seed)
        members = orderCatalogDiscoverySeries(plan, members.map((member) => ({
          baseItemCode: member.base_item_code, equipmentModelId: member.equipment_model_id,
          itemKind: member.item_kind, value: member,
        })), seed).map((choice) => choice.candidate.value)
      } else members.sort((left, right) => compareSeries(left, right, request.query.locale))
      const offset = request.cursor === null ? 0 : Number(request.cursor.slice('series_'.length))
      payload.members = members.slice(offset, offset + request.query.page_size)
      payload.next_cursor = offset + request.query.page_size < members.length ? `series_${offset + request.query.page_size}` : null
      payload.previous_cursor = offset > 0 ? `series_${Math.max(0, offset - request.query.page_size)}` : null
      payload.total_matching_series = members.length
      return payload
    }
    return payload
  }
}

const PAGINATED_SERIES_PAGE_SIZE = 60
const PAGINATED_SERIES_TOTAL = PAGINATED_SERIES_PAGE_SIZE + 1

class PaginatedSeriesCatalogTestGateway extends PublicCatalogTestGateway {
  override async read(request: CatalogDisplayGatewayRequest): Promise<unknown> {
    const payload = await super.read(request)
    if (request.operation === 'CATALOG_DISPLAY_SNAPSHOT_LIST') {
      const response = payload as WireCatalogDisplaySnapshotListResponse
      if (response.members[0]) response.members[0].member_count = PAGINATED_SERIES_TOTAL
    }
    return payload
  }

  override async readQuery(
    request: CatalogDisplayQueryGatewayRequest,
    _options: GatewayReadOptions = {},
  ): Promise<unknown> {
    const payload = await super.readQuery(request) as WireCatalogDisplayQueryResponse
    if (payload.response_kind === 'ERROR') return payload
    payload.snapshot.member_count = PAGINATED_SERIES_TOTAL
    if (payload.response_kind === 'CATALOG_QUERY_BOOTSTRAP') {
      payload.categories[0]!.member_count = PAGINATED_SERIES_TOTAL
      payload.categories[0]!.series_count = PAGINATED_SERIES_TOTAL
      payload.equipment[0]!.member_count = PAGINATED_SERIES_TOTAL
      payload.equipment[0]!.series_count = PAGINATED_SERIES_TOTAL
      payload.image_counts = {
        bound: 0,
        not_produced: PAGINATED_SERIES_TOTAL,
        total: PAGINATED_SERIES_TOTAL,
      }
      return payload
    }
    if (
      request.operation !== 'CATALOG_QUERY_SERIES' ||
      payload.response_kind !== 'CATALOG_QUERY_SERIES'
    ) return payload

    const template = payload.members[0]
    if (!template) throw new TypeError('paginated series fixture requires one template member')
    const all = Array.from({ length: PAGINATED_SERIES_TOTAL }, (_, index) => {
      const serial = String(index).padStart(3, '0')
      const member = structuredClone(template)
      member.base_item_code = `fixture.weapon.series-${serial}`
      member.representative.projection.analysis_unit_id = `fixture:item:series-${serial}`
      member.representative.projection.base_item_code = member.base_item_code
      member.representative.projection.localized_name = {
        authority: 'VALVE_STEAM',
        en: index === PAGINATED_SERIES_PAGE_SIZE
          ? 'StatTrak™ AAA Cross-page Series (Field-Tested)'
          : `StatTrak™ Catalog Series ${serial} (Field-Tested)`,
        zh_cn: index === PAGINATED_SERIES_PAGE_SIZE
          ? 'StatTrak™ AAA 跨页系列 (久经沙场)'
          : `StatTrak™ 目录系列 ${serial} (久经沙场)`,
      }
      rehash(member.representative.projection)
      return member
    })
    all.sort((left, right) => compareSeries(left, right, request.query.locale))
    const secondPage = request.cursor === 'series_page_2'
    if (request.cursor !== null && !secondPage) throw new TypeError('unexpected series cursor')
    payload.members = secondPage
      ? all.slice(PAGINATED_SERIES_PAGE_SIZE)
      : all.slice(0, PAGINATED_SERIES_PAGE_SIZE)
    payload.next_cursor = secondPage ? null : 'series_page_2'
    payload.previous_cursor = secondPage ? 'series_page_1' : null
    payload.total_matching_series = PAGINATED_SERIES_TOTAL
    return payload
  }
}

class LateSeriesCatalogTestGateway extends PublicCatalogTestGateway {
  firstSignal: AbortSignal | undefined
  private releaseFirst!: () => void
  private readonly firstRelease = new Promise<void>((resolve) => {
    this.releaseFirst = resolve
  })

  override async readQuery(
    request: CatalogDisplayQueryGatewayRequest,
    options: GatewayReadOptions = {},
  ): Promise<unknown> {
    const payload = await super.readQuery(request)
    if (
      request.operation === 'CATALOG_QUERY_SERIES' &&
      request.query.search_text === 'Official'
    ) {
      this.firstSignal = options.signal
      await this.firstRelease
    }
    return payload
  }

  releaseLateResponse(): void {
    this.releaseFirst()
  }
}

class PublicQualityTestGateway implements FormalResultReadGateway {
  readonly kind = 'LOCAL_RESULT_API' as const
  readonly requests: FormalResultReadRequest[] = []
  private readonly listGateway: QualityListTestGateway

  constructor(
    private readonly error?: Error,
    nextCursor: string | null = null,
    private readonly detailControlledAbsence = false,
    private readonly detailControlledFailure = false,
    private readonly unitResult: 'ABSENT' | 'READY' | 'FAILURE' = 'ABSENT',
  ) {
    this.listGateway = new QualityListTestGateway(
      error ? { throwError: error } : { nextCursor },
    )
  }

  async read(request: FormalResultReadRequest): Promise<unknown> {
    this.requests.push(structuredClone(request))
    if (this.error) throw this.error
    if (request.operation === 'QUALITY_LIST') return this.listGateway.read(request)
    if (request.operation === 'UNIT_DETAIL') {
      if (this.unitResult === 'ABSENT') return structuredClone(resultErrorFixture)
      if (this.unitResult === 'FAILURE') {
        return {
          api_contract: 'result-read-api',
          api_version: 'v1',
          response_kind: 'ERROR',
          error: {
            code: 'BACKEND_UNAVAILABLE',
            http_status: 503,
            retryable: true,
          },
        }
      }
      const response = structuredClone(unitDetailFixture) as WireUnitDetailResponse
      response.query_as_of = request.as_of
      response.resource.envelope.identity.analysis_unit_id = request.analysis_unit_id
      response.resource.envelope.identity.catalog_version = CATALOG_VERSION
      response.resource.envelope.versions.catalog_version = CATALOG_VERSION
      response.resource.envelope.identity.edition_kind =
        request.analysis_unit_id === 'item:44' ? 'STANDARD' : 'STATTRAK'
      if (request.analysis_unit_id === 'item:42') {
        response.resource.envelope.identity.analysis_unit_kind = 'BASE_MHN'
        response.resource.envelope.identity.parent_analysis_unit_id = null
      } else {
        response.resource.envelope.identity.analysis_unit_kind = 'STYLE_VARIANT'
        response.resource.envelope.identity.parent_analysis_unit_id = 'item:42'
      }
      response.resource.envelope.snapshot_id = snapshotIdOf(
        response.resource.envelope as unknown as Record<string, unknown>,
      )
      response.resource.storage.document_hash = canonicalHash(response.resource.envelope)
      return response
    }
    if (request.operation !== 'QUALITY_DETAIL') {
      throw new TypeError('PublicQualityTestGateway accepts unit and quality reads only')
    }
    if (this.detailControlledAbsence) return structuredClone(resultErrorFixture)
    if (this.detailControlledFailure) {
      return {
        api_contract: 'result-read-api',
        api_version: 'v1',
        response_kind: 'ERROR',
        error: {
          code: 'BACKEND_UNAVAILABLE',
          http_status: 503,
          retryable: true,
        },
      }
    }

    const response = structuredClone(qualityDetailFixture) as WireQualityDetailResponse
    response.query_as_of = request.as_of
    response.resource.envelope.identity.analysis_unit_id = request.analysis_unit_id
    response.resource.envelope.identity.catalog_version = CATALOG_VERSION
    response.resource.envelope.snapshot_id = snapshotIdOf(
      response.resource.envelope as unknown as Record<string, unknown>,
    )
    response.resource.storage.document_hash = canonicalHash(response.resource.envelope)
    return response
  }
}

class PublicFxTestGateway implements FxReferenceGateway {
  readonly kind = 'PUBLIC_FX_TEST'
  readonly requests: FxReferenceRequest[] = []

  async read(request: FxReferenceRequest): Promise<unknown> {
    this.requests.push(structuredClone(request))
    return {
      api_contract: 'fx-reference-api',
      api_version: 'v1',
      response_kind: 'FX_REFERENCE_CURRENT',
      query: { known_at: request.known_at },
      reference: {
        authority: 'ECB',
        available_at: '2026-08-24T16:00:00.000000Z',
        carry_days: 1,
        cny_per_usd: '6.72054161',
        cny_valid_from: '2026-08-24T16:00:00.000000Z',
        method: 'ECB_EUR_CROSS',
        source_event_date: '2026-08-24',
        usage: 'REFERENCE_RATE_INFORMATIONAL_ONLY',
        usd_valid_from: '2026-08-24T16:00:00.000000Z',
      },
    }
  }
}

class PublicResultsTestGateway implements MarketWatchlistPublicGateway {
  readonly kind = 'PUBLIC_RESULTS_TEST'
  readonly requests: PublicResultRequest[] = []

  async read(request: PublicResultRequest): Promise<PublicResultTransportResponse> {
    this.requests.push(structuredClone(request))
    if (request.kind === 'MARKET_OVERVIEW') {
      const source = structuredClone(publicMarketFixture)
      return {
        payload: {
          ...source,
          query: { ...source.query, as_of: request.query.as_of },
        },
        httpStatus: 200,
      }
    }
    if (request.kind === 'WATCHLIST') {
      const source = structuredClone(publicWatchlistFixture)
      return {
        payload: {
          ...source,
          query: {
            ...source.query,
            as_of: request.query.as_of,
            publication_id: request.query.publication_id ?? source.query.publication_id,
          },
        },
        httpStatus: 200,
      }
    }
    if (request.kind === 'WATCHLIST_DETAIL') {
      const source = structuredClone(publicWatchlistFixture)
      return {
        httpStatus: 200,
        payload: {
          api_contract: source.api_contract,
          api_version: source.api_version,
          response_kind: 'WATCHLIST_DETAIL',
          query: {
            as_of: null,
            query_known_at: source.query.query_known_at,
            publication_id: request.query.publication_id,
            analysis_unit_id: request.query.analysis_unit_id,
          },
          publication: source.publication,
          member: source.members[0],
        },
      }
    }
    const query = {
      ...structuredClone(request.query),
      query_known_at: publicMarketFixture.query.query_known_at,
    }
    return {
      httpStatus: 200,
      payload: {
        api_contract: 'market-watchlist-public-api',
        api_version: 'v1',
        response_kind: request.kind,
        query,
        members: [],
        next_cursor: null,
      },
    }
  }
}

class FixedPublicResultsTestGateway implements MarketWatchlistPublicGateway {
  readonly kind = 'FIXED_PUBLIC_RESULTS_TEST'
  readonly requests: PublicResultRequest[] = []

  constructor(
    private readonly payload: unknown,
    private readonly httpStatus: number,
  ) {}

  async read(request: PublicResultRequest): Promise<PublicResultTransportResponse> {
    this.requests.push(structuredClone(request))
    return { payload: structuredClone(this.payload), httpStatus: this.httpStatus }
  }
}

class FixedMarketDescriptiveTestGateway implements MarketDescriptivePublicGateway {
  readonly kind = 'FIXED_MARKET_DESCRIPTIVE_TEST'
  readonly requests: MarketDescriptiveDecodeRequest[] = []

  constructor(
    private readonly payload: unknown = marketDescriptiveCurrentFixture,
    private readonly httpStatus = 200,
  ) {}

  async read(request: MarketDescriptiveDecodeRequest): Promise<MarketDescriptiveTransportResponse> {
    this.requests.push(structuredClone(request))
    return { payload: structuredClone(this.payload), httpStatus: this.httpStatus }
  }
}

class UnavailableMarketSectorIndexTestGateway implements MarketSectorIndexPublicGateway {
  readonly kind = 'UNAVAILABLE_MARKET_SECTOR_INDEX_TEST'

  async read(): Promise<MarketSectorIndexTransportResponse> {
    return {
      httpStatus: 404,
      payload: {
        contract_name: 'market-sector-index-public-api',
        contract_version: '1',
        response_kind: 'ERROR',
        error: { code: 'NOT_PUBLISHED', retryable: false },
      },
    }
  }
}

class ItemMonitorTestGateway implements ItemMonitorPublicGateway {
  readonly kind = 'ITEM_MONITOR_TEST'
  readonly requests: ItemMonitorDecodeRequest[] = []

  constructor(private readonly payload: unknown = itemMonitorResultFixture, private readonly httpStatus = 200) {}

  async read(request: ItemMonitorDecodeRequest): Promise<ItemMonitorTransportResponse> {
    this.requests.push(structuredClone(request))
    const payload = structuredClone(this.payload) as any
    if (payload.response_kind !== 'ERROR' && request.query.publication_id !== null) {
      payload.publication.publication_id = request.query.publication_id
    }
    if (payload.response_kind !== 'ERROR' && request.kind === 'DETAIL') {
      payload.operation = 'DETAIL'
      payload.page_size = 1
      payload.next_cursor = null
      payload.members = payload.members.filter((member: any) => member.analysis_unit_token === request.query.analysis_unit_token)
    }
    return { payload, httpStatus: this.httpStatus }
  }
}

class PublicTrendingTestGateway implements SingleItemTrendingPublicGateway {
  readonly kind = 'PUBLIC_TRENDING_TEST'
  readonly requests: TrendingListQuery[] = []

  async read(request: TrendingListQuery): Promise<TrendingTransportResponse> {
    this.requests.push(structuredClone(request))
    const source = structuredClone(publicTrendingFixture) as any
    source.query = {
      ...source.query,
      ...structuredClone(request),
      publication_id: request.publication_id ?? source.publication.publication_id,
    }
    return { payload: source, httpStatus: 200 }
  }
}

function fixedNow(): Date {
  return new Date(NOW)
}

async function settleAsyncViews(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 0))
  })
}

class MemoryPersonalWatchlistStore implements PersonalWatchlistStore {
  private readonly entries = new Map<string, PersonalWatchTarget>()

  async readAll(): Promise<readonly PersonalWatchTarget[]> {
    return [...this.entries.values()]
  }

  async put(target: PersonalWatchTarget): Promise<void> {
    this.entries.set(target.target_key, target)
  }

  async putMany(targets: readonly PersonalWatchTarget[]): Promise<void> {
    for (const target of targets) this.entries.set(target.target_key, target)
  }

  async remove(targetKey: string): Promise<void> {
    this.entries.delete(targetKey)
  }

  async clear(): Promise<void> {
    this.entries.clear()
  }
}

class CorruptPersonalWatchlistStore implements PersonalWatchlistStore {
  async readAll(): Promise<readonly PersonalWatchTarget[]> {
    throw new PersonalWatchlistCorruptError()
  }

  async put(): Promise<void> {
    throw new Error('unreachable')
  }

  async putMany(): Promise<void> {
    throw new Error('unreachable')
  }

  async remove(): Promise<void> {
    throw new Error('unreachable')
  }

  async clear(): Promise<void> {
    throw new Error('unreachable')
  }
}

class FailingUnitsCatalogTestGateway extends PublicCatalogTestGateway {
  override async readQuery(request: CatalogDisplayQueryGatewayRequest): Promise<unknown> {
    if (request.operation === 'CATALOG_QUERY_UNITS') {
      this.requests.push(request)
      throw new CatalogDisplayTransportError('HTTP_STATUS_MISMATCH', true, 500)
    }
    return super.readQuery(request)
  }
}

describe('the formal public site exposes only fail-closed real-data surfaces', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/catalog')
    window.sessionStorage.removeItem(CATALOG_DISCOVERY_VISIBLE_COUNT_SESSION_KEY)
    window.sessionStorage.removeItem(CATALOG_DISCOVERY_SCROLL_OFFSET_SESSION_KEY)
  })

  it('lands on a product home that reads one real snapshot descriptor without exposing the quality audit', async () => {
    window.history.replaceState(null, '', '/')
    const catalog = new PublicCatalogTestGateway()
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        catalogGateway={catalog}
        qualityGateway={new PublicQualityTestGateway()}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )

    // First test in the file: the lazy home chunk is transformed cold, which can exceed the
    // default 1s wait when the public gate runs many files in parallel.
    expect(await screen.findByTestId('public-home', {}, { timeout: 5000 })).toBeInTheDocument()
    const brandLink = screen.getByRole('link', { name: 'CS2 ROTATE' })
    // The masthead wordmark is inline so the mark can be animated, and decorative because the
    // link around it already carries the name.
    const brandWordmark = brandLink.querySelector('svg.formal-site__brand-logo')
    expect(brandWordmark).toBeInTheDocument()
    expect(brandWordmark).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('img', { name: 'CS2 ROTATE' })).toHaveClass(
      'formal-site__footer-brand',
    )
    // The mark turns on the home surface only.
    expect(screen.getByTestId('brand-wordmark-mark')).toHaveClass(
      'brand-wordmark__mark--spinning',
    )
    expect(screen.getByTestId('brand-wordmark-mark').querySelector('g')).toHaveAttribute(
      'transform',
      'translate(0 2)',
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'CS2 Rotate · 饰品市场观察' }),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('home-catalog-count')).toHaveTextContent('1'))
    expect(screen.getByTestId('home-catalog-status')).toHaveTextContent('件目录饰品')
    expect(screen.getByTestId('home-catalog-status')).not.toHaveTextContent('目录已更新')
    expect(screen.getByTestId('home-catalog-status')).not.toHaveTextContent('更新时间')
    expect(screen.getByRole('link', { name: '首页' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: '装备与系列' })).toBeInTheDocument()
    const sidebar = screen.getByTestId('public-sidebar')
    const shell = sidebar.closest('.formal-site')
    const masthead = document.querySelector<HTMLElement>('.formal-site__masthead')!
    expect(shell).toHaveClass('formal-site--sidebar-open')
    expect(within(sidebar).queryByRole('link', { name: 'CS2 ROTATE' })).toBeNull()
    expect(within(masthead).getByRole('link', { name: 'CS2 ROTATE' })).toBe(brandLink)
    expect(within(masthead).queryByText('首页')).toBeNull()
    expect(screen.queryByRole('button', { name: '展开导航' })).toBeNull()
    expect(within(sidebar).getByRole('link', { name: '我的关注' })).toBeInTheDocument()
    const closeNavigation = within(sidebar).getByRole('button', { name: '收起导航' })
    expect(closeNavigation.querySelector('.formal-site__sidebar-toggle-glyph')).toBeInTheDocument()
    expect(closeNavigation.textContent).toBe('')
    const featureNavigation = screen.getByRole('navigation', { name: '主要功能' })
    expect(featureNavigation).toBeInTheDocument()
    expect(within(featureNavigation).getAllByRole('link')).toHaveLength(6)
    expect(within(featureNavigation).getByRole('link', { name: /装备与系列/u })).toHaveAttribute('href', '/catalog')
    expect(within(featureNavigation).getByRole('link', { name: /大盘与板块观察/u })).toHaveAttribute('href', '/market')
    // The sector strip's "all" link lands on the market page's sector tab, not the index tab.
    expect(within(await screen.findByTestId('home-sectors')).getByRole('link', { name: /全部/u })).toHaveAttribute(
      'href',
      '/market?view=sectors',
    )
    expect(within(featureNavigation).getByRole('link', { name: /单品观察榜/u })).toHaveAttribute('href', '/item-monitor')
    expect(within(featureNavigation).getByRole('link', { name: /30日涨跌/u })).toHaveAttribute('href', '/trending')
    expect(within(featureNavigation).getByRole('link', { name: /炼金模拟器/u })).toHaveAttribute('href', '/tradeup')
    expect(within(featureNavigation).queryByRole('link', { name: /我的关注/u })).toBeNull()
    expect(within(featureNavigation).queryByRole('link', { name: /公开库存/u })).toBeNull()
    const valveLinks = screen.getAllByRole('link', { name: /Valve 公告/u })
    expect(valveLinks.every((link) => !link.textContent?.includes('开发中'))).toBe(true)
    expect(within(featureNavigation).getByRole('link', { name: /Valve 公告/u })).toHaveAttribute('href', '/valve')
    expect(featureNavigation).not.toHaveTextContent('选择研究对象')
    expect(featureNavigation).not.toHaveTextContent('市场视角')
    expect(featureNavigation).not.toHaveTextContent('单品视角')
    expect(featureNavigation).not.toHaveTextContent('公告视角')
    expect(featureNavigation).not.toHaveTextContent('入口已上线')
    expect(featureNavigation).not.toHaveTextContent('开始浏览')
    expect(featureNavigation).not.toHaveTextContent('↗')
    for (const index of ['01', '02', '03', '04', '05', '06', '07', '08']) {
      expect(within(featureNavigation).queryByText(index, { exact: true })).toBeNull()
    }
    expect(document.body).not.toHaveTextContent('异动观察')
    await user.click(closeNavigation)
    expect(shell).toHaveClass('formal-site--sidebar-closed')
    const openNavigation = screen.getByRole('button', { name: '展开导航' })
    expect(openNavigation.parentElement).toBe(masthead)
    expect(openNavigation.querySelector('.formal-site__sidebar-toggle-glyph')).toBeInTheDocument()
    expect(within(masthead).getByRole('link', { name: 'CS2 ROTATE' })).toBeInTheDocument()
    await user.click(openNavigation)
    expect(shell).toHaveClass('formal-site--sidebar-open')
    expect(screen.queryByRole('button', { name: '展开导航' })).toBeNull()
    expect(document.body).not.toHaveTextContent('四个职责明确的入口')
    expect(document.body).not.toHaveTextContent('产品入口')
    expect(document.body).not.toHaveTextContent('状态机')
    expect(document.body).not.toHaveTextContent('生产与消费链')
    expect(document.body).not.toHaveTextContent('样例数据')
    expect(screen.queryByText('信息要有来源，缺失也要诚实')).toBeNull()
    expect(screen.queryByText('先把可验证的体验做好')).toBeNull()
    expect(screen.queryByRole('link', { name: '数据质量' })).toBeNull()
    expect(screen.queryByTestId('market-live-quality')).toBeNull()
    expect(document.title).toBe('CS2 Rotate · 饰品市场观察')
    expect(catalog.requests).toHaveLength(1)
    expect(catalog.requests[0]).toMatchObject({
      operation: 'CATALOG_DISPLAY_SNAPSHOT_LIST',
      query: {
        query_as_of: QUERY_INSTANT,
        known_at: QUERY_INSTANT,
        sort: 'AS_OF_DESC',
        page_size: 1,
      },
    })
  })

  it('publishes concise, navigable formal market and system-watchlist result pages', async () => {
    window.history.replaceState(null, '', '/market')
    const marketCatalog = new PublicCatalogTestGateway()
    const marketQuality = new PublicQualityTestGateway()
    const marketResults = new PublicResultsTestGateway()
    const marketDescriptive = new FixedMarketDescriptiveTestGateway()
    const marketView = render(
      <PublicBetaApp
        catalogGateway={marketCatalog}
        qualityGateway={marketQuality}
        publicResultGateway={marketResults}
        marketDescriptiveGateway={marketDescriptive}
        marketSectorIndexGateway={new UnavailableMarketSectorIndexTestGateway()}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )

    const market = await screen.findByTestId('public-market-page')
    expect(market).toHaveTextContent('大盘与板块观察')
    expect(market).toHaveTextContent('1%')
    expect(market).toHaveTextContent('高覆盖')
    expect(market).not.toHaveTextContent('状态机')
    expect(market).not.toHaveTextContent('生产与消费链')
    expect(market).not.toHaveTextContent('模拟判断')
    expect(within(screen.getByTestId('public-sidebar')).getByRole('link', { name: /大盘与板块观察/u })).toHaveAttribute('aria-current', 'page')
    expect(document.title).toBe('CS2 Rotate · 大盘与板块观察')
    // Away from home the wordmark rests, so the moving mark never reads as a loading state.
    expect(screen.getByTestId('brand-wordmark-mark')).not.toHaveClass(
      'brand-wordmark__mark--spinning',
    )
    expect(marketCatalog.requests).toHaveLength(0)
    expect(marketQuality.requests).toHaveLength(0)
    expect(marketResults.requests).toHaveLength(0)
    expect(marketDescriptive.requests).toEqual([{ kind: 'OVERVIEW', query: { publication_id: null } }])
    marketView.unmount()

    window.history.replaceState(null, '', '/item-monitor?lang=en')
    const watchCatalog = new PublicCatalogTestGateway()
    const watchQuality = new PublicQualityTestGateway()
    const watchResults = new PublicResultsTestGateway()
    const itemMonitor = new ItemMonitorTestGateway()
    render(
      <PublicBetaApp
        catalogGateway={watchCatalog}
        qualityGateway={watchQuality}
        publicResultGateway={watchResults}
        itemMonitorGateway={itemMonitor}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )

    const watchlist = await screen.findByTestId('public-watchlist-page')
    expect(watchlist).toHaveTextContent('Item Monitor')
    await within(watchlist).findByText('Synthetic 000')
    expect(watchlist).toHaveTextContent('Experimental')
    expect(watchlist).not.toHaveTextContent('state-machine')
    expect(watchlist).not.toHaveTextContent('invented conclusion')
    expect(within(screen.getByTestId('public-sidebar')).getByRole('link', { name: 'Item Monitor' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'System shortlist' })).toBeNull()
    expect(document.title).toBe('CS2 Rotate · Item Monitor')
    expect(watchCatalog.requests).toHaveLength(0)
    expect(watchQuality.requests).toHaveLength(0)
    expect(watchResults.requests).toHaveLength(0)
    expect(itemMonitor.requests).toEqual([{
      kind: 'LIST', query: { publication_id: null, page_size: 50, cursor: null, sort: 'SIGNAL_TIME_DESC' },
    }])
  })

  it('keeps the retrospective Price Movers product on its own route and sidebar entry', async () => {
    window.history.replaceState(null, '', '/trending?lang=en')
    const trending = new PublicTrendingTestGateway()
    render(
      <PublicBetaApp
        trendingGateway={trending}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )

    const page = await screen.findByTestId('public-trending-page')
    expect(page).toHaveTextContent('Price Movers')
    expect(page).toHaveTextContent('Retrospective')
    expect(page).not.toHaveTextContent('Item Monitor')
    const sidebar = screen.getByTestId('public-sidebar')
    expect(within(sidebar).getByRole('link', { name: 'Price Movers' })).toHaveAttribute('aria-current', 'page')
    expect(within(sidebar).getByRole('link', { name: 'Item Monitor' })).not.toHaveAttribute('aria-current')
    expect(document.title).toBe('CS2 Rotate · Price Movers')
    expect(window.location.pathname).toBe('/trending')
    expect(trending.requests).toEqual([{
      as_of: null,
      publication_id: null,
      direction: 'GAINERS',
      page_size: 24,
      cursor: null,
      filters: {
        item_kind: null,
        base_item_code: null,
        edition_kind: null,
        wear_tier: null,
      },
    }])
  })

  it('saves exact catalog items in a persistent personal watchlist and opens the product directly', async () => {
    const store = new MemoryPersonalWatchlistStore()
    const catalog = new PublicCatalogTestGateway({ media: 'BOUND' })
    const results = new FixedPublicResultsTestGateway(publicNotPublishedFixture, 404)
    const user = userEvent.setup()
    const first = render(
      <PublicBetaApp
        catalogGateway={catalog}
        qualityGateway={new PublicQualityTestGateway()}
        publicResultGateway={results}
        personalWatchlistStore={store}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await user.click(screen.getByTestId(`catalog-base-${BASE_CODE}`))
    // The exact item is followed from its small card in the series matrix, without opening it.
    const cell = await screen.findByTestId(`catalog-row-${UNIT_ID}`, undefined, LAZY_VIEW_WAIT)
    const toggle = within(cell.parentElement!).getByTestId(`personal-watchlist-toggle-ITEM:${UNIT_ID}`)
    expect(cell).not.toContainElement(toggle)
    await waitFor(() => expect(toggle).toBeEnabled())
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)
    await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'true'))
    expect(new URL(window.location.href).searchParams.has('unit')).toBe(false)
    expect(screen.getByTestId('catalog-base-section')).toBeInTheDocument()
    const resultReadsBeforeFollowing = results.requests.length

    await user.click(within(screen.getByTestId('public-sidebar')).getByRole('link', { name: '我的关注' }))
    const page = await screen.findByTestId('personal-watchlist-page')
    expect(page).toHaveTextContent(ZH_NAME)
    expect(page).toHaveTextContent('1项已关注')
    expect(page).toHaveTextContent('只保存在此浏览器')
    expect(results.requests).toHaveLength(resultReadsBeforeFollowing)
    const savedItem = screen.getByTestId(`personal-watchlist-item-ITEM:${UNIT_ID}`)
    const productLink = within(savedItem).getByRole('link', { name: /打开商品详情/u })
    expect(productLink).toHaveAttribute('href', expect.stringContaining(`unit=${encodeURIComponent(UNIT_ID)}`))
    expect(productLink).toHaveAttribute('href', expect.stringContaining(`base=${encodeURIComponent(BASE_CODE)}`))
    expect(productLink.getAttribute('href')).not.toContain('snapshot=')
    expect(productLink.getAttribute('href')).not.toContain('as_of=')

    first.unmount()
    const resultReadsBeforeReload = results.requests.length
    window.history.replaceState(null, '', '/following')
    const secondUser = userEvent.setup()
    render(
      <PublicBetaApp
        catalogGateway={catalog}
        qualityGateway={new PublicQualityTestGateway()}
        publicResultGateway={results}
        personalWatchlistStore={store}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )
    const restored = await screen.findByTestId(`personal-watchlist-item-ITEM:${UNIT_ID}`)
    await secondUser.click(within(restored).getByRole('link', { name: /打开商品详情/u }))

    expect(await screen.findByTestId(`formal-unit-detail-${UNIT_ID}`, undefined, LAZY_VIEW_WAIT)).toBeInTheDocument()
    const route = new URL(window.location.href)
    expect(route.pathname).toBe('/research')
    expect(route.searchParams.get('unit')).toBe(UNIT_ID)
    expect(route.searchParams.get('snapshot')).toBe(snapshotListFixture.members[0].snapshot_id)
    expect(route.searchParams.get('as_of')).toBe(QUERY_INSTANT)
    await waitFor(() => expect(results.requests).toHaveLength(resultReadsBeforeReload + 1))
    expect(results.requests.at(-1)).toMatchObject({ kind: 'WATCHLIST', query: { page_size: 1, cursor: null } })

    const detailToggle = screen.getByTestId(`personal-watchlist-toggle-ITEM:${UNIT_ID}`)
    expect(detailToggle).toHaveAttribute('aria-pressed', 'true')
    await secondUser.click(detailToggle)
    await waitFor(() => expect(detailToggle).toHaveAttribute('aria-pressed', 'false'))
    expect(await store.readAll()).toHaveLength(0)
    await secondUser.click(detailToggle)
    await waitFor(() => expect(detailToggle).toHaveAttribute('aria-pressed', 'true'))
    expect(await store.readAll()).toHaveLength(1)
    await secondUser.click(screen.getByRole('button', { name: /返回我的关注/u }))
    expect(await screen.findByTestId(`personal-watchlist-item-ITEM:${UNIT_ID}`)).toBeInTheDocument()
    expect(window.location.pathname).toBe('/following')
    expect(new URL(window.location.href).searchParams.has('view')).toBe(false)
  })

  it('keeps personal storage on its explicit sidebar route and rejects corrupt local records without a network fallback', async () => {
    window.history.replaceState(publicHistoryState(false), '', '/watchlist?lang=en&view=personal')
    const catalog = new PublicCatalogTestGateway()
    const results = new PublicResultsTestGateway()
    render(
      <PublicBetaApp
        catalogGateway={catalog}
        qualityGateway={new PublicQualityTestGateway()}
        publicResultGateway={results}
        personalWatchlistStore={new CorruptPersonalWatchlistStore()}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )

    const problem = await screen.findByTestId('personal-watchlist-problem')
    expect(problem).toHaveTextContent('Following failed validation')
    expect(screen.getByRole('link', { name: 'Following' })).toHaveAttribute('aria-current', 'page')
    expect(window.location.pathname).toBe('/following')
    expect(window.location.search).toBe('?lang=en')
    expect(catalog.requests).toHaveLength(0)
    expect(results.requests).toHaveLength(0)
  })

  it('pins an item-monitor member to its exact publication without exposing formal or retrospective fields', async () => {
    window.history.replaceState(null, '', '/item-monitor?lang=en')
    const user = userEvent.setup()
    const results = new PublicResultsTestGateway()
    const itemMonitor = new ItemMonitorTestGateway()
    render(
      <PublicBetaApp
        catalogGateway={new PublicCatalogTestGateway()}
        qualityGateway={new PublicQualityTestGateway()}
        publicResultGateway={results}
        itemMonitorGateway={itemMonitor}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )

    await screen.findByTestId('public-watchlist-page')
    expect(itemMonitor.requests.map((request) => request.kind)).toEqual(['LIST'])

    await user.click(await screen.findByRole('button', { name: /Synthetic 000/u }))
    const detail = await screen.findByTestId('item-monitor-detail')
    expect(detail).toHaveTextContent('Synthetic 000')

    await waitFor(() => {
      expect(itemMonitor.requests.some((request) => request.kind === 'DETAIL')).toBe(true)
    })
    const route = new URL(window.location.href)
    expect(route.pathname).toBe('/item-monitor')
    expect(route.searchParams.get('publication')).toBe(itemMonitorResultFixture.publication.publication_id)
    expect(route.searchParams.get('unit')).toBe(itemMonitorResultFixture.members[0].analysis_unit_token)
    expect(route.searchParams.has('as_of')).toBe(false)

    const product = screen.getByRole('link', { name: /View item/u })
    expect(product).toHaveAttribute(
      'href',
      `/research?unit=synthetic-public-0&snapshot=${itemMonitorResultFixture.snapshot.catalog_snapshot_id}&lang=en`,
    )
    expect(detail).not.toHaveTextContent('recommendation')
    expect(detail).not.toHaveTextContent('expected return')
    expect(results.requests).toHaveLength(0)
  })

  it('distinguishes not-published from a sealed empty watchlist without falling back to catalog data', async () => {
    window.history.replaceState(null, '', '/market')
    const unavailable = new FixedMarketDescriptiveTestGateway(marketDescriptiveNotPublishedFixture, 404)
    const marketCatalog = new PublicCatalogTestGateway()
    const first = render(
      <PublicBetaApp
        catalogGateway={marketCatalog}
        qualityGateway={new PublicQualityTestGateway()}
        marketDescriptiveGateway={unavailable}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )
    const problem = (await screen.findByRole('heading', { name: '尚无正式发布' })).closest('[role="status"]')
    expect(problem).toHaveAttribute('data-error-code', 'NOT_PUBLISHED')
    expect(problem).toHaveTextContent('尚无正式发布')
    expect(marketCatalog.requests).toHaveLength(0)
    first.unmount()

    window.history.replaceState(null, '', '/item-monitor')
    const empty = new ItemMonitorTestGateway(itemMonitorEmptyFixture, 200)
    const emptyCatalog = new PublicCatalogTestGateway()
    render(
      <PublicBetaApp
        catalogGateway={emptyCatalog}
        qualityGateway={new PublicQualityTestGateway()}
        itemMonitorGateway={empty}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )
    const page = await screen.findByTestId('public-watchlist-page')
    expect(page).toHaveTextContent('尚无满足条件的完整观察')
    expect(page).toHaveTextContent('不会用历史或模拟内容填充')
    expect(emptyCatalog.requests).toHaveLength(0)
  })

  it('opens the public Valve archive and keeps the former quality route internal', async () => {
    window.history.replaceState(null, '', '/')
    const user = userEvent.setup()
    const quality = new PublicQualityTestGateway()
    const catalog = new PublicCatalogTestGateway()
    const view = render(
      <PublicBetaApp
        valveGateway={{ kind: 'READ_ONLY_HTTP', read: async () => structuredClone(valveListFixture) }}
        catalogGateway={catalog}
        qualityGateway={quality}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )

    await screen.findByTestId('public-home')
    await user.click(screen.getAllByRole('link', { name: /Valve 公告/u })[0]!)
    const valve = await screen.findByTestId('public-valve-page')
    expect(valve).toHaveTextContent('Valve 事件影响档案')
    expect(valve).not.toHaveTextContent('正在开发 · 尚未上线')
    await within(valve).findByTestId('valve-event-list')
    expect(valve).not.toHaveTextContent('READ_ONLY_HTTP')
    expect(window.location.pathname).toBe('/valve')
    expect(document.title).toBe('CS2 Rotate · Valve 公告')
    await user.click(within(valve).getByRole('link', { name: '历史分析' }))
    const history = await screen.findByTestId('valve-analysis-history')
    expect(history).toHaveTextContent('已建档 4 条公告')
    expect(window.location.pathname).toBe('/valve/history')
    await user.click(within(history).getByRole('link', { name: '最新公告' }))
    expect(await screen.findByTestId('public-valve-page')).toBeVisible()
    expect(window.location.pathname).toBe('/valve')
    expect(quality.requests).toHaveLength(0)
    await settleAsyncViews()
    await act(async () => view.unmount())

    window.history.replaceState(null, '', '/quality')
    const rejectedQuality = new PublicQualityTestGateway()
    const rejectedCatalog = new PublicCatalogTestGateway()
    render(
      <PublicBetaApp
        catalogGateway={rejectedCatalog}
        qualityGateway={rejectedQuality}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )
    await settleAsyncViews()
    expect(screen.getByTestId('public-route-error')).toHaveTextContent('这个页面地址无法使用')
    expect(screen.queryByTestId('market-live-quality')).toBeNull()
    expect(rejectedQuality.requests).toHaveLength(0)
    expect(rejectedCatalog.requests).toHaveLength(0)
  })

  it('keeps the home page useful when the live catalog pulse is unavailable without inventing a count', async () => {
    window.history.replaceState(null, '', '/')
    render(
      <PublicBetaApp
        catalogGateway={new PublicCatalogTestGateway({
          error: new Error('database secret must not escape'),
        })}
        qualityGateway={new PublicQualityTestGateway()}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )

    const pulse = await screen.findByTestId('home-catalog-status')
    await waitFor(() => expect(pulse).toHaveTextContent('目录暂不可用'))
    expect(screen.getByTestId('home-catalog-count')).toHaveTextContent('—')
    expect(pulse).not.toHaveTextContent('database secret')
    expect(within(screen.getByRole('navigation', { name: '主要功能' }))
      .getByRole('link', { name: /装备与系列/u })).toBeInTheDocument()
  })

  it('opens the sealed catalog without prototype or transport labels', async () => {
    const catalog = new PublicCatalogTestGateway()
    render(
      <PublicBetaApp
        catalogGateway={catalog}
        qualityGateway={new PublicQualityTestGateway()}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )

    expect(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '装备与系列' })).toBeInTheDocument()
    expect(document.title).toBe('CS2 Rotate · 装备与系列')
    expect(screen.queryByTestId('catalog-pit-context')).toBeNull()
    expect(screen.queryByTestId('catalog-image-coverage')).toBeNull()
    expect(screen.queryByTestId('catalog-refresh-latest')).toBeNull()
    expect(document.body).not.toHaveTextContent('数据说明')
    expect(document.body).not.toHaveTextContent('按装备、型号、品质、类别和磨损查找饰品。')
    expect(document.body).not.toHaveTextContent('查看图片与详细信息')
    expect(document.body).not.toHaveTextContent('PUBLIC_BETA')
    expect(document.body).not.toHaveTextContent('REAL_DATA_ONLY')
    expect(document.body).not.toHaveTextContent('PUBLIC_RESULT_API')
    expect(document.body).not.toHaveTextContent('LOCAL_RESULT_API')
    expect(document.body).not.toHaveTextContent('MOCK_DATA_ONLY')
    expect(document.body).not.toHaveTextContent('样例数据')
    expect(screen.queryByTestId('live-quality-row')).toBeNull()
    expect(catalog.requests[0]).toMatchObject({
      operation: 'CATALOG_DISPLAY_SNAPSHOT_LIST',
      query: {
        query_as_of: QUERY_INSTANT,
        known_at: QUERY_INSTANT,
        sort: 'AS_OF_DESC',
      },
    })
  })

  it('opens the catalog with one snapshot read, then the bootstrap and discovery page in parallel', async () => {
    const catalog = new PublicCatalogTestGateway()
    render(
      <PublicBetaApp
        catalogGateway={catalog}
        qualityGateway={new PublicQualityTestGateway()}
        now={fixedNow}
      />,
    )

    expect(await screen.findByTestId('catalog-category-UNCLASSIFIED')).toBeInTheDocument()
    await waitFor(() => expect(catalog.requests).toHaveLength(3))
    const operations = catalog.requests.map((request) => request.operation)
    expect(operations[0]).toBe('CATALOG_DISPLAY_SNAPSHOT_LIST')
    expect([...operations.slice(1)].sort()).toEqual([
      'CATALOG_QUERY_BOOTSTRAP',
      'CATALOG_QUERY_SERIES',
    ])
    expect(catalog.requests.find((request) => request.operation === 'CATALOG_QUERY_SERIES')).toMatchObject({
      query: { equipment_selection_id: 'GLOBAL', sort: 'DISCOVERY' },
    })
    expect(catalog.requests).not.toContainEqual(expect.objectContaining({
      operation: 'CATALOG_DISPLAY_LIST',
    }))
  })

  it('keeps image availability out of the catalog header', async () => {
    const catalog = new PublicCatalogTestGateway({
      includeParent: true,
      media: 'MIXED',
    })
    render(
      <PublicBetaApp
        catalogGateway={catalog}
        qualityGateway={new PublicQualityTestGateway()}
        now={fixedNow}
      />,
    )

    expect(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT)).toBeInTheDocument()
    expect(screen.queryByTestId('catalog-image-coverage')).toBeNull()
    expect(screen.queryByTestId('catalog-refresh-latest')).toBeNull()
    expect(
      catalog.requests.filter((request) => request.operation === 'CATALOG_DISPLAY_SNAPSHOT_LIST'),
    ).toHaveLength(1)
  })

  it('browses a series, renders bound media, and opens the same PIT item detail', async () => {
    const catalog = new PublicCatalogTestGateway({ media: 'BOUND' })
    const quality = new PublicQualityTestGateway()
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={quality}
        publicResultGateway={new FixedPublicResultsTestGateway(publicNotPublishedFixture, 404)}
        catalogGateway={catalog}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    expect(screen.getByTestId('catalog-series-grid')).toHaveAttribute(
      'data-render-strategy',
      'CONTENT_VISIBILITY',
    )
    expect(document.querySelector('.formal-catalog__pagination')).toBeNull()
    await user.click(screen.getByTestId(`catalog-base-${BASE_CODE}`))

    const row = await screen.findByTestId(`catalog-row-${UNIT_ID}`, undefined, LAZY_VIEW_WAIT)
    expect(document.querySelector('.formal-catalog__pagination')).toBeNull()
    expect(row.getAttribute('aria-label')).toContain(ZH_NAME)
    expect(screen.getByTestId('catalog-unit-rows')).not.toHaveTextContent(/名称来源|Name source|VALVE_STEAM|MARKET_D/u)
    expect(screen.getByTestId('catalog-series-grid')).not.toBeVisible()
    expect(screen.getByTestId('catalog-selected-series')).toHaveTextContent(ZH_SERIES_NAME)
    const browseSlot = screen.getByTestId(`item-image-${UNIT_ID}-series-hero`)
    const browseImage = browseSlot.querySelector('img')
    if (!browseImage) throw new TypeError('bound browse media did not render an img element')
    expect(browseImage).toHaveAttribute(
      'src',
      '/media/catalog/v1/105/Zml4dHVyZS9zZXJpZXMtcmVwcmVzZW50YXRpdmU',
    )
    expect(browseImage).toHaveAttribute('referrerpolicy', 'no-referrer')
    fireEvent.load(browseImage)
    expect(browseSlot).toHaveAttribute('data-image-status', 'BOUND')
    expect(browseSlot).not.toHaveTextContent('BOUND')

    await user.click(row)
    expect(window.location.pathname).toBe('/research')
    expect(new URLSearchParams(window.location.search).get('unit')).toBe(UNIT_ID)
    expect(new URLSearchParams(window.location.search).get('snapshot')).toBe(
      snapshotListFixture.members[0].snapshot_id,
    )
    expect(new URLSearchParams(window.location.search).get('as_of')).toBe(QUERY_INSTANT)
    const detail = await screen.findByTestId(`formal-unit-detail-${UNIT_ID}`)
    expect(document.querySelector('.formal-catalog__pagination')).toBeNull()
    expect(detail).toHaveTextContent(ZH_NAME)
    expect(detail).toHaveTextContent('久经沙场')
    expect(detail).toHaveTextContent('StatTrak™')
    expect(detail).not.toHaveTextContent(/名称来源|Name source|VALVE_STEAM|MARKET_D/u)
    const research = await screen.findByTestId('catalog-unit-research-result')
    await waitFor(() => expect(research).toHaveAttribute('data-result-state', 'NOT_PUBLISHED'))
    expect(research).toHaveTextContent('尚无正式发布')
    expect(research).not.toHaveTextContent(/压力积累|推荐候选|强候选/u)
    expect(research).not.toHaveTextContent('单品观察榜发布')
    expect(screen.queryByTestId('formal-unit-public-quality')).toBeNull()
    expect(detail).not.toHaveTextContent(/覆盖 75\.0%|数据质量|商品身份/u)
    expect(quality.requests).toEqual([])
    expect(catalog.requests.find((request) => request.operation === 'CATALOG_QUERY_UNITS')).toMatchObject({
      operation: 'CATALOG_QUERY_UNITS',
      query: {
        snapshot_id: snapshotListFixture.members[0].snapshot_id,
        base_item_code: BASE_CODE,
      },
    })
  })

  it('renders a published formal item result as a compact product summary without raw state codes', async () => {
    const results = new PublicQualityTestGateway(undefined, null, false, false, 'READY')
    const published = new PublicItemResultTestGateway(publicItemResultFixture({ analysis_unit_id: UNIT_ID,
      item_kind: 'WEAPON', base_item_code: BASE_CODE, edition_kind: 'STATTRAK', wear_tier: 'FIELD_TESTED' }))
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={results}
        publicResultGateway={published}
        catalogGateway={new PublicCatalogTestGateway()}
        fxGateway={new PublicFxTestGateway()}
        now={() => new Date(publicWatchlistFixture.query.query_known_at)}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await user.click(screen.getByTestId(`catalog-base-${BASE_CODE}`))
    await user.click(await screen.findByTestId(`catalog-row-${UNIT_ID}`, undefined, LAZY_VIEW_WAIT))

    const result = await screen.findByTestId('catalog-unit-research-result')
    await waitFor(() => expect(result).toHaveAttribute('data-result-state', 'READY'))
    expect(result).toHaveTextContent('压力积累')
    expect(result).toHaveTextContent('观察')
    expect(result).toHaveTextContent('完整')
    expect(result).toHaveTextContent('100%')
    expect(result).not.toHaveTextContent(/PRESSURE_BUILDING|UNAVAILABLE_BY_DESIGN|input_snapshot_hash/u)
    expect(result.querySelector('details')).not.toHaveAttribute('open')
    expect(results.requests).toEqual([])
    expect(published.requests.map((request) => request.kind)).toEqual(['WATCHLIST', 'WATCHLIST_DETAIL'])
  })

  it('gives content-visibility series choices explicit localized accessible names', async () => {
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={new PublicCatalogTestGateway()}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))

    const grid = screen.getByTestId('catalog-series-grid')
    expect(grid).toHaveAttribute('data-render-strategy', 'CONTENT_VISIBILITY')
    expect(screen.getByTestId(`catalog-base-${BASE_CODE}`)).toHaveAttribute('aria-label', ZH_SERIES_NAME)
    expect(within(grid).getByRole('link', { name: ZH_SERIES_NAME })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByTestId('catalog-series-grid')).toHaveAttribute(
      'data-render-strategy',
      'CONTENT_VISIBILITY',
    )
    expect(screen.getByTestId(`catalog-base-${BASE_CODE}`)).toHaveAttribute('aria-label', EN_SERIES_NAME)
    expect(within(screen.getByTestId('catalog-series-grid')).getByRole('link', { name: EN_SERIES_NAME })).toBeInTheDocument()
  })

  it('fetches only the first globally ordered series page and continues on demand', async () => {
    const catalog = new PaginatedSeriesCatalogTestGateway()
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))

    const seriesRequests = () => catalog.requests.filter((request) =>
      request.operation === 'CATALOG_QUERY_SERIES' && request.query.sort === 'PRODUCT',
    )
    await waitFor(() => expect(seriesRequests()).toHaveLength(1), LAZY_VIEW_WAIT)
    expect(seriesRequests()[0]).toMatchObject({
      cursor: null,
      query: { page_size: PAGINATED_SERIES_PAGE_SIZE, sort: 'PRODUCT' },
    })
    await waitFor(() => {
      const current = screen.getByTestId('catalog-series-grid')
      expect(current).toHaveAttribute('data-series-mode', 'FILTERED')
      expect(current).not.toHaveAttribute('data-stale')
      expect(current.querySelectorAll('.cx-tile')).toHaveLength(PAGINATED_SERIES_PAGE_SIZE)
    }, LAZY_VIEW_WAIT)
    const grid = screen.getByTestId('catalog-series-grid')
    expect(grid.querySelector('.cx-tile')).toHaveAttribute(
      'data-testid', 'catalog-base-fixture.weapon.series-060',
    )
    fireEvent.click(screen.getByTestId('catalog-series-more'))
    await waitFor(() => expect(seriesRequests()).toHaveLength(2), LAZY_VIEW_WAIT)
    expect(seriesRequests()[1]).toMatchObject({
      cursor: 'series_page_2',
      query: { page_size: PAGINATED_SERIES_PAGE_SIZE },
    })

    await waitFor(() => expect(grid.querySelectorAll('.cx-tile')).toHaveLength(
      PAGINATED_SERIES_TOTAL,
    ), LAZY_VIEW_WAIT)
    expect(screen.getByTestId('catalog-series-count')).toHaveTextContent(`${PAGINATED_SERIES_TOTAL} / ${PAGINATED_SERIES_TOTAL} 个系列`)
    expect(screen.queryByTestId('catalog-series-more')).toBeNull()
    expect(screen.getByTestId('catalog-base-fixture.weapon.series-000')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-base-fixture.weapon.series-060')).toBeInTheDocument()
    expect(grid.querySelector('.cx-tile')).toHaveAttribute(
      'data-testid',
      'catalog-base-fixture.weapon.series-060',
    )
    expect(document.querySelector('.formal-catalog__pagination')).toBeNull()
    expect(window.location.search).not.toContain('series_cursor')
  }, 15_000)

  it('opens the clicked series as its own page and hides the sibling list', async () => {
    const catalog = new PaginatedSeriesCatalogTestGateway()
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await waitFor(() => {
      const current = screen.getByTestId('catalog-series-grid')
      expect(current).not.toHaveAttribute('data-stale')
      expect(current).toHaveAttribute('data-series-mode', 'FILTERED')
    }, LAZY_VIEW_WAIT)
    const grid = screen.getByTestId('catalog-series-grid')
    const cards = within(grid).getAllByTestId(/^catalog-base-/u).slice(0, 20)
    expect(cards).toHaveLength(20)
    catalog.requests.splice(0)

    const opened = cards[0]!
    const openedBaseCode = opened.getAttribute('data-testid')?.replace('catalog-base-', '')
    fireEvent.click(opened)
    expect(window.location.search).toContain(`base=${encodeURIComponent(openedBaseCode ?? '')}`)
    expect(screen.getByTestId('catalog-series-grid')).not.toBeVisible()
    expect(await screen.findByTestId('catalog-selected-series', undefined, LAZY_VIEW_WAIT)).toBeInTheDocument()
    await waitFor(() => expect(
      catalog.requests.filter((request) => request.operation === 'CATALOG_QUERY_UNITS'),
    ).toHaveLength(1), LAZY_VIEW_WAIT)
    expect(catalog.requests.find((request) => request.operation === 'CATALOG_QUERY_UNITS')).toMatchObject({
      query: { base_item_code: openedBaseCode },
    })
  })

  it('binds the global wear facet into the complete series read and selected series unit query', async () => {
    const catalog = new PublicCatalogTestGateway({ includeSibling: true })
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await user.click(screen.getByTestId('catalog-filter-wearTier'))
    await user.click(screen.getByTestId('catalog-wearTier-FACTORY_NEW'))

    await waitFor(() => expect(catalog.requests).toContainEqual(expect.objectContaining({
      operation: 'CATALOG_QUERY_SERIES',
      cursor: null,
      query: expect.objectContaining({ wear_tier: 'FACTORY_NEW' }),
    })), LAZY_VIEW_WAIT)
    const card = await screen.findByTestId(`catalog-base-${BASE_CODE}`, undefined, LAZY_VIEW_WAIT)
    expect(card).toHaveAttribute('aria-label', 'ZZZ 变体 | 官方字符串形状')
    expect(card).not.toHaveTextContent(/崭新出厂|Factory New|StatTrak|久经沙场|Field-Tested/u)
    expect(window.location.search).toContain('wear_tier=FACTORY_NEW')

    // The series page is the full version × wear matrix: the list facet narrows
    // which series appear, not which of its versions the series page shows.
    await user.click(card)
    await waitFor(() => expect(catalog.requests).toContainEqual(expect.objectContaining({
      operation: 'CATALOG_QUERY_UNITS',
      query: expect.objectContaining({ base_item_code: BASE_CODE, rarity: null }),
    })), LAZY_VIEW_WAIT)
    const unitsQuery = catalog.requests.find((request) => request.operation === 'CATALOG_QUERY_UNITS')
    expect(unitsQuery?.operation === 'CATALOG_QUERY_UNITS' ? unitsQuery.query.wear_tiers : null).toContain('FACTORY_NEW')
    expect(unitsQuery?.operation === 'CATALOG_QUERY_UNITS' ? unitsQuery.query.wear_tiers.length : 0).toBeGreaterThan(1)
    const rows = await screen.findByTestId('catalog-unit-rows', undefined, LAZY_VIEW_WAIT)
    await waitFor(() => expect(within(rows).getAllByTestId(/^catalog-row-/u).length).toBeGreaterThan(0), LAZY_VIEW_WAIT)
    expect(rows).toHaveTextContent('崭新出厂')
    expect(rows).not.toHaveTextContent(/名称来源|Name source|VALVE_STEAM|MARKET_D/u)
    expect(window.location.search).toContain('wear_tier=FACTORY_NEW')
  })

  it('shows the unit count as unknown, not zero, when the selected series read fails', async () => {
    const catalog = new FailingUnitsCatalogTestGateway({ includeSibling: true })
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await user.click(await screen.findByTestId(`catalog-base-${BASE_CODE}`, undefined, LAZY_VIEW_WAIT))
    const rows = await screen.findByTestId('catalog-unit-rows', undefined, LAZY_VIEW_WAIT)
    await waitFor(() => expect(within(rows).getByRole('alert')).toBeInTheDocument(), LAZY_VIEW_WAIT)
    const count = within(rows).getByTestId('catalog-unit-count')
    expect(count).toHaveAttribute('data-count-state', 'unknown')
    expect(count).toHaveTextContent('—')
    expect(count).not.toHaveTextContent('0')
    expect(within(rows).queryAllByRole('article')).toHaveLength(0)
  })

  it('starts with the navigation drawer closed at drawer widths and closes it after a surface change', async () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query === '(max-width: 900px)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    vi.stubGlobal('matchMedia', matchMedia)
    window.history.replaceState(null, '', '/')
    try {
      const user = userEvent.setup()
      render(
        <PublicBetaApp
          qualityGateway={new PublicQualityTestGateway()}
          catalogGateway={new PublicCatalogTestGateway()}
          now={fixedNow}
        />,
      )
      const shell = screen.getByTestId('public-sidebar').closest('.formal-site')
      expect(shell).toHaveClass('formal-site--sidebar-closed')
      await user.click(screen.getByRole('button', { name: '展开导航' }))
      expect(shell).toHaveClass('formal-site--sidebar-open')
      await user.click(within(screen.getByTestId('public-sidebar')).getByRole('link', { name: '装备与系列' }))
      expect(window.location.pathname).toBe('/catalog')
      await waitFor(() => expect(shell).toHaveClass('formal-site--sidebar-closed'))
      expect(screen.getByRole('button', { name: '展开导航' })).toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('searches controlled names in either locale, reports no matches safely, and preserves discovery controls in the URL', async () => {
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={new PublicCatalogTestGateway({ includeSibling: true })}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    const search = screen.getByTestId('catalog-series-search')
    await user.type(search, 'Official String Shape')
    expect(await screen.findByTestId(`catalog-base-${BASE_CODE}`, undefined, LAZY_VIEW_WAIT)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('catalog-series-count')).toHaveTextContent('1 / 1 个系列'), LAZY_VIEW_WAIT)
    expect(window.location.search).toContain('q=Official+String+Shape')

    await user.clear(search)
    await user.type(search, '不会匹配的系列')
    expect(await screen.findByTestId('catalog-series-search-empty', undefined, LAZY_VIEW_WAIT)).toHaveTextContent('没有符合条件的系列')
    expect(screen.queryByTestId(`catalog-base-${BASE_CODE}`)).toBeNull()

    await user.keyboard('{Escape}')
    expect(search).toHaveValue('')
    expect(await screen.findByTestId(`catalog-base-${BASE_CODE}`, undefined, LAZY_VIEW_WAIT)).toBeInTheDocument()
    expect(window.location.search).not.toContain('q=')
  })

  it('searches the full catalog from the facet rail without requiring an equipment selection', async () => {
    const catalog = new PublicCatalogTestGateway({ includeSibling: true })
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    const filters = await screen.findByTestId('catalog-facet-filters', undefined, LAZY_VIEW_WAIT)
    const search = within(filters).getByTestId('catalog-series-search')
    expect(await screen.findByTestId('catalog-equipment-all', undefined, LAZY_VIEW_WAIT)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByTestId('catalog-selected-model')).toBeNull()
    expect(catalog.requests.some((request) =>
      request.operation === 'CATALOG_QUERY_SERIES' && request.query.sort !== 'DISCOVERY')).toBe(false)

    await user.type(search, 'Official String Shape')
    expect(await screen.findByTestId('catalog-global-search-results', undefined, LAZY_VIEW_WAIT)).toHaveTextContent('搜索结果')
    await waitFor(() => expect(catalog.requests).toContainEqual(expect.objectContaining({
      operation: 'CATALOG_QUERY_SERIES',
      query: expect.objectContaining({
        equipment_selection_id: 'GLOBAL',
        search_text: 'Official String Shape',
      }),
    })), LAZY_VIEW_WAIT)
    await waitFor(() => expect(screen.getByTestId('catalog-series-grid')).not.toHaveAttribute('data-stale'), LAZY_VIEW_WAIT)
    expect(screen.getByTestId(`catalog-base-${BASE_CODE}`)).toBeInTheDocument()
    expect(window.location.search).toContain('q=Official+String+Shape')
    expect(window.location.search).not.toContain('model=')

    await user.click(screen.getByTestId(`catalog-base-${BASE_CODE}`))
    expect(await screen.findByTestId('catalog-selected-series', undefined, LAZY_VIEW_WAIT)).toHaveTextContent(ZH_SERIES_NAME)
    expect(screen.queryByTestId('catalog-selected-model')).toBeNull()
    expect(screen.getByTestId('catalog-series-grid')).not.toBeVisible()
    await waitFor(() => expect(catalog.requests).toContainEqual(expect.objectContaining({
      operation: 'CATALOG_QUERY_UNITS',
      query: expect.objectContaining({ base_item_code: BASE_CODE }),
    })), LAZY_VIEW_WAIT)

    await user.click(screen.getByTestId('catalog-series-back'))
    expect(await screen.findByTestId('catalog-global-search-results', undefined, LAZY_VIEW_WAIT)).toBeVisible()
    await user.click(screen.getByTestId('catalog-equipment-all'))
    expect(await screen.findByTestId('catalog-global-search-results', undefined, LAZY_VIEW_WAIT)).toBeInTheDocument()
    expect(search).toHaveValue('Official String Shape')
    expect(window.location.search).not.toContain('model=')
    expect(window.location.search).not.toContain('base=')
  })

  it('opens with sixteen session-fixed series, keeps approved families in the first twelve, and progressively exposes the complete catalog', async () => {
    window.sessionStorage.setItem(CATALOG_DISCOVERY_SESSION_KEY, 'public-default-session')
    const catalog = new DefaultDiscoveryCatalogTestGateway()
    const view = render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    expect(await screen.findByTestId('catalog-default-discovery', undefined, LAZY_VIEW_WAIT)).toHaveTextContent('随机探索')
    const grid = await screen.findByTestId('catalog-series-grid', undefined, LAZY_VIEW_WAIT)
    expect(grid).toHaveAttribute('data-series-mode', 'SESSION_DISCOVERY')
    const cards = within(grid).getAllByTestId(/^catalog-base-/u)
    expect(cards).toHaveLength(16)
    const seriesRequests = () => catalog.requests.filter((request) => request.operation === 'CATALOG_QUERY_SERIES')
    expect(seriesRequests()).toHaveLength(1)
    expect(seriesRequests()[0]).toMatchObject({ cursor: null, query: {
      equipment_selection_id: 'GLOBAL', sort: 'DISCOVERY', page_size: 16,
      discovery_seed: 'public-default-session',
    } })
    const firstTwelve = cards.slice(0, 12)
    const firstTwelveIds = firstTwelve.map((card) => card.getAttribute('data-testid') ?? '')
    for (const modelId of CATALOG_DISCOVERY_FIXED_MODEL_IDS) {
      expect(firstTwelveIds.some((id) => id.includes(`fixture:${modelId}:`))).toBe(true)
    }
    const firstTwelveText = firstTwelve.map((card) => card.textContent).join(' ')
    expect(DISCOVERY_MODELS.some((model) =>
      model.category === 'KNIVES' && firstTwelveText.includes(model.name.zh))).toBe(true)
    expect(DISCOVERY_MODELS.some((model) =>
      model.category === 'GLOVES' && firstTwelveText.includes(model.name.zh))).toBe(true)
    expect(window.location.search).not.toContain('model=')
    expect(window.location.search).not.toContain('base=')

    fireEvent.click(screen.getByTestId('catalog-series-more'))
    await waitFor(() => expect(within(grid).getAllByTestId(/^catalog-base-/u))
      .toHaveLength(16 + CATALOG_DISCOVERY_BATCH_SIZE), LAZY_VIEW_WAIT)
    const expandedCards = within(grid).getAllByTestId(/^catalog-base-/u)
    expect(expandedCards).toHaveLength(16 + CATALOG_DISCOVERY_BATCH_SIZE)
    expect(seriesRequests()).toHaveLength(2)
    expect(seriesRequests()[1]).toMatchObject({ cursor: 'series_16', query: { page_size: 16 } })
    expect(new Set(expandedCards.map((card) => card.getAttribute('data-testid'))).size)
      .toBe(expandedCards.length)
    const firstOrder = expandedCards.map((card) => card.getAttribute('data-testid'))
    view.unmount()
    window.history.replaceState(null, '', '/catalog')
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={new DefaultDiscoveryCatalogTestGateway()}
        now={fixedNow}
      />,
    )
    const repeatedGrid = await screen.findByTestId('catalog-series-grid', undefined, LAZY_VIEW_WAIT)
    expect(within(repeatedGrid).getAllByTestId(/^catalog-base-/u).map((card) =>
      card.getAttribute('data-testid'))).toEqual(firstOrder)
  })

  it('opens the clicked discovery series instead of the parent equipment series list', async () => {
    window.sessionStorage.setItem(CATALOG_DISCOVERY_SESSION_KEY, 'public-discovery-open-series')
    const catalog = new DefaultDiscoveryCatalogTestGateway()
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    const grid = await screen.findByTestId('catalog-series-grid', undefined, LAZY_VIEW_WAIT)
    const card = within(grid).getAllByTestId(/^catalog-base-/u)[0]!
    const seriesName = card.getAttribute('aria-label')
    if (!seriesName) throw new TypeError('discovery series card needs an accessible name')
    await user.click(card)

    expect(screen.getByTestId('catalog-series-grid')).not.toBeVisible()
    expect(screen.getByTestId('catalog-default-discovery')).not.toBeVisible()
    expect(screen.queryByTestId('catalog-selected-model')).toBeNull()
    expect(await screen.findByTestId('catalog-selected-series', undefined, LAZY_VIEW_WAIT)).toHaveTextContent(seriesName)
    expect(await screen.findByTestId('catalog-unit-rows', undefined, LAZY_VIEW_WAIT)).toBeInTheDocument()
    expect(window.location.search).toContain('base=')
    expect(window.location.search).toContain('kind=')
    // A series is its own layer: opening one from discovery does not pretend
    // the visitor chose its equipment model.
    expect(window.location.search).not.toContain('model=')
    expect(catalog.requests.flatMap((request) =>
      request.operation === 'CATALOG_QUERY_SERIES' ? [request.query.equipment_selection_id] : [],
    )).toEqual(['GLOBAL'])

    // Back returns to the same discovery list, not to a parent equipment list.
    await user.click(screen.getByTestId('catalog-series-back'))
    await waitFor(() => expect(screen.getByTestId('catalog-series-grid')).toBeVisible(), LAZY_VIEW_WAIT)
    expect(screen.getByTestId('catalog-default-discovery')).toBeVisible()
    expect(screen.queryByTestId('catalog-selected-series')).toBeNull()
    expect(window.location.search).not.toContain('base=')
  })

  it('appends the next discovery batch without redundant discovery controls', async () => {
    window.sessionStorage.setItem(CATALOG_DISCOVERY_SESSION_KEY, 'public-scroll-session')
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={new DefaultDiscoveryCatalogTestGateway()}
        now={fixedNow}
      />,
    )

    const grid = await screen.findByTestId('catalog-series-grid', undefined, LAZY_VIEW_WAIT)
    expect(screen.queryByTestId('catalog-discovery-more')).toBeNull()
    expect(screen.queryByTestId('catalog-discovery-shuffle')).toBeNull()
    fireEvent.click(await screen.findByTestId('catalog-series-more'))
    await waitFor(() => expect(within(grid).getAllByTestId(/^catalog-base-/u))
      .toHaveLength(16 + CATALOG_DISCOVERY_BATCH_SIZE), LAZY_VIEW_WAIT)

    expect(window.sessionStorage.getItem(CATALOG_DISCOVERY_VISIBLE_COUNT_SESSION_KEY))
      .toBe(String(16 + CATALOG_DISCOVERY_BATCH_SIZE))
  })

  it('lets any facet replace the default session page and restores it after clearing facets', async () => {
    window.sessionStorage.setItem(CATALOG_DISCOVERY_SESSION_KEY, 'public-filter-session')
    const catalog = new DefaultDiscoveryCatalogTestGateway()
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    const defaultGrid = await screen.findByTestId('catalog-series-grid', undefined, LAZY_VIEW_WAIT)
    fireEvent.click(await screen.findByTestId('catalog-series-more'))
    await waitFor(() => expect(within(defaultGrid).getAllByTestId(/^catalog-base-/u))
      .toHaveLength(16 + CATALOG_DISCOVERY_BATCH_SIZE), LAZY_VIEW_WAIT)
    const defaultOrder = within(defaultGrid).getAllByTestId(/^catalog-base-/u).map((card) =>
      card.getAttribute('data-testid'))
    expect(defaultOrder).toHaveLength(16 + CATALOG_DISCOVERY_BATCH_SIZE)
    await user.click(screen.getByTestId('catalog-filter-rarity'))
    await user.click(screen.getByTestId('catalog-rarity-COVERT'))
    expect(await screen.findByTestId('catalog-global-search-results', undefined, LAZY_VIEW_WAIT)).toHaveTextContent('筛选结果')
    await waitFor(() => expect(screen.getByTestId('catalog-series-grid')).toHaveAttribute(
      'data-series-mode',
      'FILTERED',
    ), LAZY_VIEW_WAIT)
    expect(screen.queryByTestId('catalog-default-discovery')).toBeNull()
    expect(catalog.requests).toContainEqual(expect.objectContaining({
      operation: 'CATALOG_QUERY_SERIES',
      query: expect.objectContaining({ rarity: 'COVERT', search_text: null }),
    }))

    await user.click(screen.getByTestId('catalog-facets-reset'))
    expect(await screen.findByTestId('catalog-default-discovery', undefined, LAZY_VIEW_WAIT)).toBeInTheDocument()
    const restoredGrid = await screen.findByTestId('catalog-series-grid', undefined, LAZY_VIEW_WAIT)
    expect(restoredGrid).toHaveAttribute('data-series-mode', 'SESSION_DISCOVERY')
    await waitFor(() => expect(within(restoredGrid).getAllByTestId(/^catalog-base-/u).map((card) =>
      card.getAttribute('data-testid'))).toEqual(defaultOrder), LAZY_VIEW_WAIT)

    await user.type(screen.getByTestId('catalog-series-search'), 'AWP')
    await waitFor(() => expect(screen.getByTestId('catalog-series-grid')).toHaveAttribute(
      'data-series-mode',
      'FILTERED',
    ), LAZY_VIEW_WAIT)
    await user.click(screen.getByTestId('catalog-series-search-clear'))
    const searchRestoredGrid = await screen.findByTestId('catalog-series-grid', undefined, LAZY_VIEW_WAIT)
    await waitFor(() => expect(searchRestoredGrid).toHaveAttribute(
      'data-series-mode',
      'SESSION_DISCOVERY',
    ), LAZY_VIEW_WAIT)
    expect(within(searchRestoredGrid).getAllByTestId(/^catalog-base-/u).map((card) =>
      card.getAttribute('data-testid'))).toEqual(defaultOrder)
  })

  it('searches every category in one bounded global query without duplicate series', async () => {
    const catalog = new MultiCategorySearchCatalogTestGateway({ includeSibling: true })
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    await user.type(
      await screen.findByTestId('catalog-series-search', undefined, LAZY_VIEW_WAIT),
      'Official String Shape',
    )
    await waitFor(() => expect(catalog.requests).toContainEqual(expect.objectContaining({
      operation: 'CATALOG_QUERY_SERIES',
      query: expect.objectContaining({ search_text: 'Official String Shape' }),
    })), LAZY_VIEW_WAIT)
    await waitFor(() => {
      const current = screen.getByTestId('catalog-series-grid')
      expect(current).toHaveAttribute('data-series-mode', 'FILTERED')
      expect(current).not.toHaveAttribute('data-stale')
    }, LAZY_VIEW_WAIT)
    const grid = screen.getByTestId('catalog-series-grid')
    expect(within(grid).getAllByTestId(/^catalog-base-/u)).toHaveLength(2)
    expect(screen.getByTestId(`catalog-base-${BASE_CODE}`)).toBeInTheDocument()
    expect(screen.getByTestId(`catalog-base-${GLOBAL_RIFLE_BASE_CODE}`)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('catalog-series-count')).toHaveTextContent('2 / 2 个系列'), LAZY_VIEW_WAIT)
    const selections = catalog.requests.flatMap((request) =>
      request.operation === 'CATALOG_QUERY_SERIES' && request.query.sort !== 'DISCOVERY'
        ? [request.query.equipment_selection_id]
        : [])
    expect(selections).toEqual(['GLOBAL'])
  })

  it('canonicalizes a legacy cursor URL and reuses a completed query after clearing search', async () => {
    window.history.replaceState(
      null,
      '',
      `/catalog?kind=WEAPON&model=unclassified%3AWEAPON&snapshot=${snapshotListFixture.members[0].snapshot_id}&series_cursor=series-page-2`,
    )
    const catalog = new PublicCatalogTestGateway({ includeSibling: true })
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    const seriesRequests = () => catalog.requests.filter((request) =>
      request.operation === 'CATALOG_QUERY_SERIES',
    )
    const search = await screen.findByTestId('catalog-series-search', undefined, LAZY_VIEW_WAIT)
    await waitFor(() => expect(seriesRequests()).toHaveLength(1), { timeout: 2_000 })
    expect(seriesRequests()[0]).toMatchObject({
      cursor: null,
      query: { search_text: null },
    })
    expect(window.location.search).not.toContain('series_cursor')

    fireEvent.change(search, { target: { value: 'Official String Shape' } })
    expect(seriesRequests()).toHaveLength(1)
    await waitFor(() => expect(seriesRequests()).toHaveLength(2), { timeout: 2_000 })
    expect(seriesRequests()[1]).toMatchObject({
      cursor: null,
      query: { search_text: 'Official String Shape' },
    })
    await act(async () => new Promise((resolve) => window.setTimeout(resolve, 350)))
    expect(seriesRequests()).toHaveLength(2)

    await user.click(screen.getByTestId('catalog-series-search-clear'))
    expect(seriesRequests()).toHaveLength(2)
    await waitFor(() => expect(screen.getByTestId(`catalog-base-${BASE_CODE}`)).toBeInTheDocument(), { timeout: 2_000 })
    expect(seriesRequests()).toHaveLength(2)
    await act(async () => new Promise((resolve) => window.setTimeout(resolve, 350)))
    expect(seriesRequests()).toHaveLength(2)
  })

  it('aborts an obsolete search generation and never commits its late response', async () => {
    const catalog = new LateSeriesCatalogTestGateway()
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        catalogGateway={catalog}
        qualityGateway={new PublicQualityTestGateway()}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    const search = screen.getByTestId('catalog-series-search')
    fireEvent.change(search, { target: { value: 'Official' } })
    await waitFor(() => expect(catalog.firstSignal).toBeDefined(), { timeout: 2_000 })

    fireEvent.change(search, { target: { value: 'No match' } })
    await waitFor(() => expect(catalog.requests).toContainEqual(expect.objectContaining({
      operation: 'CATALOG_QUERY_SERIES',
      query: expect.objectContaining({ search_text: 'No match' }),
    })), { timeout: 2_000 })
    expect(catalog.firstSignal?.aborted).toBe(true)
    expect(await screen.findByTestId('catalog-series-search-empty')).toBeInTheDocument()

    await act(async () => catalog.releaseLateResponse())
    await waitFor(() => expect(screen.getByTestId('catalog-series-search-empty')).toBeInTheDocument())
    expect(screen.queryByTestId(`catalog-base-${BASE_CODE}`)).toBeNull()
  })

  it('removes duplicate series controls and keeps the fixed product order without a sort control', async () => {
    const catalog = new PublicCatalogTestGateway({ includeSibling: true })
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await user.click(screen.getByTestId(`catalog-base-${BASE_CODE}`))

    expect(await screen.findByTestId('catalog-row-item:44', undefined, LAZY_VIEW_WAIT)).toBeInTheDocument()
    expect(screen.queryByTestId('catalog-series-summary')).toBeNull()
    expect(document.querySelector('.formal-catalog__filters')).toBeNull()
    expect(screen.queryByTestId('catalog-edition-STANDARD')).toBeNull()
    expect(screen.queryByTestId('catalog-wear-FACTORY_NEW')).toBeNull()

    const ids = () => screen.getAllByTestId(/^catalog-row-/u).map((node) => node.dataset.testid)
    expect(ids()).toEqual(['catalog-row-item:44', `catalog-row-${UNIT_ID}`])
    expect(screen.queryByTestId('catalog-results-sort')).toBeNull()
    expect(window.location.search).not.toContain('sort=')
    expect(catalog.requests).toContainEqual(expect.objectContaining({
      operation: 'CATALOG_QUERY_UNITS',
      query: expect.objectContaining({ sort: 'EDITION_ASC' }),
    }))
  })

  it('switches same-series variants in place and returns directly to the retained catalog state', async () => {
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={new PublicCatalogTestGateway({ includeSibling: true })}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await user.click(screen.getByTestId(`catalog-base-${BASE_CODE}`))
    await user.click(await screen.findByTestId(`catalog-row-${UNIT_ID}`, undefined, LAZY_VIEW_WAIT))

    const current = await screen.findByTestId(`formal-unit-sibling-${UNIT_ID}`)
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current).toBeDisabled()
    await user.click(screen.getByTestId('formal-unit-sibling-item:44'))
    expect(await screen.findByTestId('formal-unit-detail-item:44')).toHaveTextContent('ZZZ 变体')
    expect(window.location.search).toContain('unit=item%3A44')
    expect(screen.getByTestId('formal-unit-sibling-item:44')).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: '返回装备与系列' }))
    expect(await screen.findByTestId('catalog-unit-rows')).toBeInTheDocument()
    expect(window.location.search).not.toContain('unit=')
    expect(screen.queryByTestId('catalog-results-sort')).toBeNull()
  })

  it('keeps identity internals off the public detail and leads back through its breadcrumbs', async () => {
    const catalog = new PublicCatalogTestGateway({ includeParent: true })
    const quality = new PublicQualityTestGateway(undefined, null, true)
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={quality}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await user.click(screen.getByTestId(`catalog-base-${BASE_CODE}`))
    await user.click(await screen.findByTestId(`catalog-row-${UNIT_ID}`, undefined, LAZY_VIEW_WAIT))

    const detail = await screen.findByTestId(`formal-unit-detail-${UNIT_ID}`)
    expect(screen.queryByTestId('detail-valid-from')).toBeNull()
    expect(screen.queryByTestId('detail-available-at')).toBeNull()
    expect(screen.queryByTestId('formal-unit-parent-link')).toBeNull()
    expect(screen.queryByTestId('formal-unit-public-quality')).toBeNull()
    expect(detail).not.toHaveTextContent(/item:42|商品身份|数据质量/u)

    // Unclassified items have no "all in category" view, so that level is plain text.
    const trail = within(screen.getByTestId('formal-unit-trail'))
    expect(trail.queryByRole('link', { name: '待分类' })).toBeNull()
    expect(trail.getByText('待分类')).toBeInTheDocument()
    const model = trail.getByRole('link', { name: '未分类武器' })
    expect(model.getAttribute('href')).toContain('model=unclassified%3AWEAPON')
    await user.click(trail.getAllByRole('link').at(-1)!)
    expect(await screen.findByTestId('catalog-unit-rows')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/catalog')
    expect(window.location.search).not.toContain('unit=')
    expect(new URLSearchParams(window.location.search).get('base')).toBe(BASE_CODE)

    window.history.back()
    await screen.findByTestId(`formal-unit-detail-${UNIT_ID}`)
    await user.click(within(screen.getByTestId('formal-unit-trail')).getByRole('link', { name: '未分类武器' }))
    expect(await screen.findByTestId('catalog-selected-model')).toHaveTextContent('未分类武器')
    expect(screen.queryByTestId('catalog-unit-rows')).toBeNull()
    expect(window.location.search).not.toContain('unit=')
    expect(new URLSearchParams(window.location.search).get('model')).toBe('unclassified:WEAPON')
  })

  it('does not request private quality even when that private gateway would fail', async () => {
    const quality = new PublicQualityTestGateway(undefined, null, false, true)
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={quality}
        publicResultGateway={new FixedPublicResultsTestGateway(publicNotPublishedFixture, 404)}
        catalogGateway={new PublicCatalogTestGateway()}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await user.click(screen.getByTestId(`catalog-base-${BASE_CODE}`))
    await user.click(await screen.findByTestId(`catalog-row-${UNIT_ID}`, undefined, LAZY_VIEW_WAIT))

    await waitFor(() => expect(screen.getByTestId('catalog-unit-research-result')).toHaveAttribute('data-result-state', 'NOT_PUBLISHED'))
    expect(screen.queryByTestId('formal-unit-public-quality')).toBeNull()
    expect(quality.requests).toEqual([])
    expect(screen.queryByTestId('formal-unit-quality-absent')).toBeNull()
  })

  it('keeps one catalog session across routes and restores URL, scroll and row focus', async () => {
    const catalog = new PublicCatalogTestGateway({ media: 'BOUND' })
    const quality = new PublicQualityTestGateway()
    const user = userEvent.setup()
    render(
      <PublicBetaApp
        qualityGateway={quality}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )

    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await user.click(screen.getByTestId(`catalog-base-${BASE_CODE}`))
    expect(window.location.pathname).toBe('/catalog')
    expect(window.location.search).toContain('kind=WEAPON')
    expect(window.location.search).toContain(`base=${BASE_CODE}`)
    // A series URL names the series only; version and wear live in its matrix.
    expect(window.location.search).not.toContain('edition=')
    expect(window.location.search).not.toContain('wear=')

    const row = await screen.findByTestId(`catalog-row-${UNIT_ID}`, undefined, LAZY_VIEW_WAIT)
    document.documentElement.scrollTop = 121
    await user.click(row)
    expect(window.location.search).toContain('unit=item%3A43')
    expect(await screen.findByTestId(`formal-unit-detail-${UNIT_ID}`)).toBeInTheDocument()
    await waitFor(() => expect(document.title).toContain(ZH_NAME))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')))

    await user.click(screen.getByRole('button', { name: '返回装备与系列' }))
    const restoredRow = await screen.findByTestId(`catalog-row-${UNIT_ID}`)
    await waitFor(() => expect(document.activeElement).toBe(restoredRow))
    expect(document.documentElement.scrollTop).toBe(121)
    expect(catalog.requests.map((request) => request.operation).sort()).toEqual([
      'CATALOG_DISPLAY_SNAPSHOT_LIST',
      'CATALOG_QUERY_BOOTSTRAP',
      'CATALOG_QUERY_DETAIL',
      'CATALOG_QUERY_SERIES',
      'CATALOG_QUERY_SERIES',
      'CATALOG_QUERY_UNITS',
    ])

    await act(async () => window.history.forward())
    expect(await screen.findByTestId(`formal-unit-detail-${UNIT_ID}`)).toBeInTheDocument()
    await act(async () => window.history.back())
    expect(await screen.findByTestId(`catalog-row-${UNIT_ID}`)).toBeInTheDocument()
    expect(catalog.requests).toHaveLength(6)

    await user.click(screen.getByRole('link', { name: '首页' }))
    expect(await screen.findByTestId('public-home')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
    await user.click(screen.getByRole('link', { name: '装备与系列' }))
    expect(await screen.findByTestId(`catalog-row-${UNIT_ID}`)).toBeInTheDocument()
    expect(catalog.requests).toHaveLength(7)
    expect(catalog.requests.some((request) => request.operation === 'CATALOG_DISPLAY_LIST')).toBe(false)
  })

  it('reconstructs a deep-linked browse state and fails closed on invalid URL values', async () => {
    window.history.replaceState(
      null,
      '',
      `/catalog?lang=en&kind=WEAPON&model=unclassified%3AWEAPON&base=${encodeURIComponent(BASE_CODE)}&edition=STATTRAK&wear=FIELD_TESTED&q=Official+String&sort=WEAR_ASC`,
    )
    const catalog = new PublicCatalogTestGateway()
    const view = render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={catalog}
        now={fixedNow}
      />,
    )
    expect(await screen.findByTestId(`catalog-row-${UNIT_ID}`)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Item Explorer' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByTestId('catalog-edition-STATTRAK')).toBeNull()
    expect(screen.queryByTestId('catalog-wear-FIELD_TESTED')).toBeNull()
    expect(screen.getByTestId('catalog-series-search')).toHaveValue('Official String')
    expect(screen.queryByTestId('catalog-results-sort')).toBeNull()
    // Legacy edition/wear parameters still parse, but the series page always
    // reads the whole version × wear matrix.
    expect(catalog.requests).toContainEqual(expect.objectContaining({
      operation: 'CATALOG_QUERY_UNITS',
      query: expect.objectContaining({
        base_item_code: BASE_CODE,
        edition_kinds: expect.arrayContaining(['STANDARD', 'STATTRAK', 'SOUVENIR']),
        wear_tiers: expect.arrayContaining(['FACTORY_NEW', 'FIELD_TESTED']),
      }),
    }))
    await settleAsyncViews()
    await act(async () => view.unmount())

    window.history.replaceState(null, '', '/catalog?kind=UNTRUSTED')
    const rejectedCatalog = new PublicCatalogTestGateway()
    const invalidKind = render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={rejectedCatalog}
        now={fixedNow}
      />,
    )
    await settleAsyncViews()
    expect(screen.getByTestId('public-route-error')).toHaveTextContent('地址中的页面、筛选或商品信息无法识别')
    expect(rejectedCatalog.requests).toHaveLength(0)
    expect(screen.queryByTestId(`catalog-row-${UNIT_ID}`)).toBeNull()
    await act(async () => invalidKind.unmount())

    window.history.replaceState(null, '', '/catalog?sort=UNTRUSTED')
    const rejectedSort = new PublicCatalogTestGateway()
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={rejectedSort}
        now={fixedNow}
      />,
    )
    await settleAsyncViews()
    expect(screen.getByTestId('public-route-error')).toBeInTheDocument()
    expect(rejectedSort.requests).toHaveLength(0)
  })

  it('opens a known item deep link after reload and fails closed for an unknown identity', async () => {
    window.history.replaceState(null, '', `/research?unit=${encodeURIComponent(UNIT_ID)}`)
    const knownGateway = new PublicCatalogTestGateway()
    const known = render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={knownGateway}
        now={fixedNow}
      />,
    )
    expect(await screen.findByTestId(`formal-unit-detail-${UNIT_ID}`)).toBeInTheDocument()
    await waitFor(() => expect(document.title).toContain(ZH_NAME))
    expect(knownGateway.requests.map((request) => request.operation)).toEqual([
      'CATALOG_DISPLAY_SNAPSHOT_LIST',
      'CATALOG_QUERY_DETAIL',
    ])
    expect(knownGateway.requests.some((request) =>
      request.operation === 'CATALOG_QUERY_BOOTSTRAP' ||
      request.operation === 'CATALOG_QUERY_SERIES' ||
      request.operation === 'CATALOG_DISPLAY_LIST',
    )).toBe(false)
    known.unmount()

    window.history.replaceState(null, '', '/research?unit=item%3Adoes-not-exist')
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={new PublicCatalogTestGateway()}
        now={fixedNow}
      />,
    )
    const failure = await screen.findByRole('alert')
    expect(failure).toHaveTextContent('饰品目录暂时无法读取')
    expect(failure).not.toHaveTextContent(/MOCK|ITEM-0001/iu)
    expect(screen.queryByTestId(`catalog-row-${UNIT_ID}`)).toBeNull()
  })

  it('contains unexpected render failures without reflecting their details or mock content', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function BrokenSurface(): never {
      throw new Error('source_asset_ref=secret provider URL database password')
    }
    render(
      <PublicErrorBoundary lang="en" resetKey="catalog">
        <BrokenSurface />
      </PublicErrorBoundary>,
    )
    const failure = screen.getByTestId('public-runtime-error')
    expect(failure).toHaveTextContent('This page cannot be displayed right now')
    expect(failure.textContent).not.toMatch(/source_asset_ref|provider URL|password|mock/iu)
    consoleError.mockRestore()
  })

  it('switches every formal-shell sentence to English without CJK leakage', async () => {
    window.history.replaceState(null, '', '/')
    const user = userEvent.setup()
    const { container } = render(
      <PublicBetaApp
        catalogGateway={new PublicCatalogTestGateway()}
        qualityGateway={new PublicQualityTestGateway()}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )
    await screen.findByTestId('public-home')
    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'CS2 Rotate · Item market intelligence',
      }),
    ).toBeInTheDocument()
    expect(document.title).toBe('CS2 Rotate · Item market intelligence')
    expect(container).toHaveTextContent('Item Explorer')
    expect(/[　-〿一-鿿＀-￯]/u.test(container.textContent ?? '')).toBe(
      false,
    )
  })

  it('fails closed for an empty catalog snapshot inventory', async () => {
    render(
      <PublicBetaApp
        qualityGateway={new PublicQualityTestGateway()}
        catalogGateway={new PublicCatalogTestGateway({ emptySnapshots: true })}
        fxGateway={new PublicFxTestGateway()}
        now={fixedNow}
      />,
    )
    const catalogError = await screen.findByTestId(
      'catalog-real-error',
      undefined,
      LAZY_VIEW_WAIT,
    )
    expect(catalogError).toHaveTextContent('饰品目录暂时无法读取')
    expect(catalogError).not.toHaveTextContent('MOCK')
    expect(catalogError).not.toHaveTextContent('NO_AVAILABLE_SNAPSHOT')
    expect(screen.queryByTestId('catalog-real-empty')).toBeNull()
    await waitFor(() => expect(screen.queryByTestId(`catalog-row-${UNIT_ID}`)).toBeNull())
  })

  it('connects snapshot-bound prices and maps English to USD across sibling navigation', async () => {
    const catalog = new PublicCatalogTestGateway({ includeSibling: true })
    const price = new PriceWireTestGateway({ catalog: {
      snapshot_id: snapshotListFixture.members[0].snapshot_id,
      as_of: listFixture.query.as_of,
      available_at: listFixture.query.known_at,
    } })
    const user = userEvent.setup()
    render(<PublicBetaApp catalogGateway={catalog} qualityGateway={new PublicQualityTestGateway()} fxGateway={new PublicFxTestGateway()} priceGateway={price} now={() => new Date('2026-09-03T01:00:00.000Z')} />)
    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await user.click(screen.getByTestId(`catalog-base-${BASE_CODE}`))
    const seriesRow = await screen.findByTestId(`catalog-row-${UNIT_ID}`, undefined, LAZY_VIEW_WAIT)
    // The series matrix reads the lowest ask of every version it shows.
    await waitFor(() => expect(seriesRow).toHaveAttribute('data-price-state', 'ask'), LAZY_VIEW_WAIT)
    expect(seriesRow.getAttribute('aria-label')).toMatch(/最低在售/u)
    // Chinese shows yuan: a USD-only listing is converted with the day's reference rate.
    expect(seriesRow).toHaveAttribute('data-price-currency', 'CNY')
    expect(seriesRow.querySelector('.cx-unit__price')?.textContent).toMatch(/^¥/u)
    const seriesUnits = price.requests.flatMap((request) =>
      'analysis_unit_id' in request.query ? [request.query.analysis_unit_id] : [])
    expect([...seriesUnits].sort()).toEqual(['item:43', 'item:44'])
    const detailStart = price.requests.length
    await user.click(seriesRow)
    const panel = await screen.findByTestId('catalog-unit-price')
    await waitFor(() => expect(panel).toHaveAttribute('data-price-read-state', 'READY'))
    expect(within(panel).getByText('¥67.20', { selector: 'strong' })).toHaveAttribute('data-price-currency', 'CNY')
    expect(within(panel).queryByRole('combobox')).toBeNull()
    expect(price.requests.at(-1)?.query).toMatchObject({ analysis_unit_id: UNIT_ID, known_at: '2026-09-03T01:00:00.000000Z' })
    await user.click(screen.getByRole('button', { name: 'EN' }))
    expect(within(panel).getByTestId('price-panel')).toHaveAttribute('data-price-currency', 'USD')
    // Same full PIT/gateway: opening a series member and switching display
    // currency must not repeat either price discovery or the item read.
    expect(price.requests).toHaveLength(detailStart)
    expect(catalog.requests).toHaveLength(6)
    await user.click(screen.getByTestId('formal-unit-sibling-item:44'))
    await screen.findByTestId('formal-unit-detail-item:44')
    await waitFor(() => expect(screen.getByTestId('catalog-unit-price')).toHaveAttribute('data-price-read-state', 'READY'))
    expect(screen.getByTestId('price-panel')).toHaveAttribute('data-price-currency', 'USD')
    expect(price.requests.find((request) => request.kind === 'PRICE_ITEM' && request.query.analysis_unit_id === 'item:44')?.query)
      .toMatchObject({ analysis_unit_id: 'item:44', known_at: '2026-09-03T01:00:00.000000Z' })
    expect(price.requests).toHaveLength(detailStart)
    expect(catalog.requests).toHaveLength(7)
    expect(screen.queryByRole('link', { name: 'Data quality' })).toBeNull()
  })

  it('keeps formal identity, image and navigation when the price transport is disconnected', async () => {
    const price = new PriceWireTestGateway({ failure: true }), user = userEvent.setup()
    render(<PublicBetaApp catalogGateway={new PublicCatalogTestGateway()} qualityGateway={new PublicQualityTestGateway()} fxGateway={new PublicFxTestGateway()} priceGateway={price} now={fixedNow} />)
    await user.click(await screen.findByTestId('catalog-category-UNCLASSIFIED', undefined, LAZY_VIEW_WAIT))
    await user.click(screen.getByTestId('catalog-model-unclassified:WEAPON'))
    await user.click(screen.getByTestId(`catalog-base-${BASE_CODE}`))
    const seriesRow = await screen.findByTestId(`catalog-row-${UNIT_ID}`, undefined, LAZY_VIEW_WAIT)
    // A failed price read shows no price, never a placeholder amount.
    await waitFor(() => expect(seriesRow).toHaveAttribute('data-price-state', 'none'), LAZY_VIEW_WAIT)
    expect(seriesRow).toHaveTextContent('—')
    const detailStart = price.requests.length
    await user.click(seriesRow)
    expect(await screen.findByText('价格暂时无法读取，请稍后再试。')).toBeInTheDocument()
    expect(screen.getByTestId(`formal-unit-detail-${UNIT_ID}`)).toBeInTheDocument()
    expect(screen.getByTestId(`item-image-${UNIT_ID}-formal-detail`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '返回装备与系列' })).toBeInTheDocument()
    expect(price.requests).toHaveLength(detailStart + 1)
    expect(document.querySelector('.price-quote')).toBeNull()
  })

  describe('retained hidden surfaces do not perform unrelated reads', () => {
    const settle = (milliseconds = 100) => act(async () => {
      await new Promise((resolve) => setTimeout(resolve, milliseconds))
    })

    const navigate = (pathname: string) => {
      const link = [...document.querySelectorAll('nav a[href], aside a[href]')]
        .find((candidate) => new URL((candidate as HTMLAnchorElement).href).pathname === pathname)
      if (link === undefined) throw new Error(`missing navigation link ${pathname}`)
      fireEvent.click(link)
    }

    const setup = (lang: 'en' | 'zh', pathname = '/catalog') => {
      window.history.replaceState(null, '', `${pathname}?lang=${lang}`)
      const catalog = new PublicCatalogTestGateway()
      const trending = new PublicTrendingTestGateway()
      render(
        <PublicBetaApp
          catalogGateway={catalog}
          fxGateway={new PublicFxTestGateway()}
          trendingGateway={trending}
          personalWatchlistStore={new MemoryPersonalWatchlistStore()}
          now={fixedNow}
        />,
      )
      return { catalog, trending }
    }

    for (const lang of ['en', 'zh'] as const) {
      it(`does not refetch a hidden catalog in another locale after switching language from ${lang}`, async () => {
        const { catalog } = setup(lang)
        const search = await waitFor(() => {
          const input = document.querySelector('input[type="search"]')
          expect(input).not.toBeNull()
          return input!
        }, LAZY_VIEW_WAIT)
        fireEvent.change(search, { target: { value: 'Contract' } })
        await waitFor(() => expect(catalog.requests.some(
          (request) => request.operation === 'CATALOG_QUERY_SERIES',
        )).toBe(true), LAZY_VIEW_WAIT)
        await settle(350)
        navigate('/trending')
        await screen.findByTestId('public-trending-page', undefined, LAZY_VIEW_WAIT)
        await settle(200)
        const before = catalog.requests.length
        fireEvent.click(screen.getByRole('button', { name: lang === 'en' ? 'ZH' : 'EN' }))
        await settle(500)
        expect(catalog.requests).toHaveLength(before)
      })
    }

    it('retains a hidden Trending query without a navigation refetch', async () => {
      const { trending } = setup('en', '/trending')
      await screen.findByTestId('public-trending-page', undefined, LAZY_VIEW_WAIT)
      await settle(200)
      const before = trending.requests.length
      navigate('/catalog')
      await waitFor(() => expect(document.querySelector('input[type="search"]')).not.toBeNull(), LAZY_VIEW_WAIT)
      await settle(300)
      expect(trending.requests).toHaveLength(before)
    })

    it('ignores foreground focus while Trending is hidden', async () => {
      const { trending } = setup('en', '/trending')
      await screen.findByTestId('public-trending-page', undefined, LAZY_VIEW_WAIT)
      await settle(200)
      navigate('/catalog')
      await waitFor(() => expect(document.querySelector('input[type="search"]')).not.toBeNull(), LAZY_VIEW_WAIT)
      await settle(250)
      const before = trending.requests.length
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
      fireEvent(window, new Event('focus'))
      await settle(200)
      expect(trending.requests).toHaveLength(before)
    })
  })

})
