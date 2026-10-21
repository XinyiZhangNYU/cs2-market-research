import { unitResultView, collectionResultView } from './resultViewModel'
import { FormalResultReadApi } from '../api/FormalResultReadApi'
import type {
  MarketSectorDashboardGateway,
  MarketSectorSnapshotDescriptor,
} from '../api/MarketSectorDashboardGateway'
import { selectLatestSnapshotAtOrBefore } from '../api/snapshotSelector'
import { compareCodePoints } from '../wire/canonical'
import type {
  DecodedCollectionDetailResponse,
  DecodedUnitDetailResponse,
  DecodedUnitListResponse,
  WireResultListQuery,
} from '../wire/resultReadApiTypes'
import type { VersionContext } from '../contract/types'
import type {
  PresentableCollectionView,
  PresentableUnitView,
} from './resultViewModel'

export class MarketSectorDashboardIntegrityViolation extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MarketSectorDashboardIntegrityViolation'
  }
}

export type MarketSectorDashboardView = Readonly<{
  channel: string
  contract_status: 'VALIDATED'
  query_as_of: string
  selected_as_of: string
  market_published_at: string
  sector_collection_published_at: string
  sector_published_at: Readonly<Record<string, string>>
  market: PresentableUnitView
  sectors: readonly PresentableUnitView[]
  sector_collection: PresentableCollectionView
}>

function fail(message: string): never {
  throw new MarketSectorDashboardIntegrityViolation(message)
}

function versionKey(versions: VersionContext): string {
  return JSON.stringify(versions)
}

async function readSectorPages(
  api: FormalResultReadApi,
  descriptor: MarketSectorSnapshotDescriptor,
  queryAsOf: string,
): Promise<DecodedUnitListResponse[]> {
  const query: WireResultListQuery = { as_of: queryAsOf, ...descriptor.sector_query }
  const pages: DecodedUnitListResponse[] = []
  const seenCursors = new Set<string>()
  let cursor: string | null = null
  do {
    const response = await api.listUnits({ query, cursor })
    if (response.response_kind === 'ERROR') {
      fail('dashboard read returned a controlled API error')
    }
    if (response.response_kind !== 'UNIT_LIST') fail('SECTOR list was not returned')
    pages.push(response)
    cursor = response.next_cursor
    if (cursor !== null) {
      if (seenCursors.has(cursor)) fail('SECTOR pagination returned a cursor cycle')
      seenCursors.add(cursor)
    }
  } while (cursor !== null)
  return pages
}

function assertSharedContext(
  selectedAsOf: string,
  market: DecodedUnitDetailResponse,
  sectorPages: readonly DecodedUnitListResponse[],
  collection: DecodedCollectionDetailResponse,
): void {
  const sectorResources = sectorPages.flatMap((page) => page.members)
  const units = [market.resource, ...sectorResources]
  if (
    units.some((resource) => resource.envelope.as_of !== selectedAsOf) ||
    collection.resource.envelope.as_of !== selectedAsOf
  ) {
    fail('MARKET, SECTOR and COLLECTION do not share the selected as_of')
  }
  if (market.resource.envelope.identity.scope_kind !== 'MARKET') {
    fail('dashboard MARKET request returned a non-MARKET unit')
  }
  if (sectorResources.some((resource) => resource.envelope.identity.scope_kind !== 'SECTOR')) {
    fail('dashboard SECTOR request returned a non-SECTOR unit')
  }
  if (collection.resource.envelope.scope_kind !== 'SECTOR') {
    fail('dashboard collection is not a SECTOR collection')
  }
  const sharedVersion = versionKey(market.resource.envelope.versions)
  if (
    units.some((resource) => versionKey(resource.envelope.versions) !== sharedVersion) ||
    versionKey(collection.resource.envelope.versions) !== sharedVersion
  ) {
    fail('MARKET, SECTOR and COLLECTION do not share one version context')
  }
  const catalogVersion = market.resource.envelope.versions.catalog_version
  if (
    units.some(
      (resource) => resource.envelope.identity.catalog_version !== catalogVersion,
    )
  ) {
    fail('MARKET and SECTOR identities do not share the versioned catalog')
  }
  const sectorIds = sectorResources.map(
    (resource) => resource.envelope.identity.analysis_unit_id,
  )
  for (let index = 1; index < sectorIds.length; index += 1) {
    if (compareCodePoints(sectorIds[index - 1], sectorIds[index]) >= 0) {
      fail('SECTOR pages are not globally unique and sorted')
    }
  }
  const returnedSnapshots = sectorResources
    .map((resource) => resource.envelope.snapshot_id)
    .sort(compareCodePoints)
  const declaredSnapshots = [...collection.resource.envelope.member_result_ids]
  if (
    returnedSnapshots.length !== declaredSnapshots.length ||
    returnedSnapshots.some((snapshot, index) => snapshot !== declaredSnapshots[index])
  ) {
    fail('SECTOR rows do not exactly match COLLECTION member_result_ids')
  }
  if (collection.resource.envelope.returned_member_count !== sectorResources.length) {
    fail('SECTOR row count does not match COLLECTION returned_member_count')
  }
}

export async function loadMarketSectorDashboard(
  gateway: MarketSectorDashboardGateway,
  requestedQueryAsOf?: string,
): Promise<MarketSectorDashboardView> {
  const inventory = await gateway.listMarketSectorSnapshots()
  if (inventory.length === 0) fail('dashboard snapshot inventory is empty')
  const queryAsOf =
    requestedQueryAsOf ??
    [...inventory]
      .sort((left, right) => compareCodePoints(left.as_of, right.as_of))
      .at(-1)!.as_of
  const descriptor = selectLatestSnapshotAtOrBefore(inventory, queryAsOf)
  const api = new FormalResultReadApi(gateway)
  const [marketResponse, sectorPages, collectionResponse] = await Promise.all([
    api.getUnit({
      analysis_unit_id: descriptor.market_analysis_unit_id,
      as_of: queryAsOf,
    }),
    readSectorPages(api, descriptor, queryAsOf),
    api.getCollection({
      collection_id: descriptor.sector_collection_id,
      as_of: queryAsOf,
    }),
  ])
  if (marketResponse.response_kind === 'ERROR') {
    fail('dashboard MARKET read returned a controlled API error')
  }
  if (collectionResponse.response_kind === 'ERROR') {
    fail('dashboard COLLECTION read returned a controlled API error')
  }
  const market = marketResponse
  const collection = collectionResponse
  if (market.response_kind !== 'UNIT_DETAIL') fail('MARKET detail was not returned')
  if (collection.response_kind !== 'COLLECTION_DETAIL') {
    fail('SECTOR collection detail was not returned')
  }
  assertSharedContext(descriptor.as_of, market, sectorPages, collection)

  const sectorResources = sectorPages.flatMap((page) => page.members)
  const publishedEntries = sectorResources.map(
    (resource) =>
      [resource.envelope.snapshot_id, resource.storage.published_at] as const,
  )
  return Object.freeze({
    channel: gateway.kind,
    contract_status: 'VALIDATED' as const,
    query_as_of: queryAsOf,
    selected_as_of: descriptor.as_of,
    market_published_at: market.resource.storage.published_at,
    sector_collection_published_at: collection.resource.storage.published_at,
    sector_published_at: Object.freeze(Object.fromEntries(publishedEntries)),
    market: unitResultView(market.resource.envelope),
    sectors: Object.freeze(
      sectorResources.map((resource) => unitResultView(resource.envelope)),
    ),
    sector_collection: collectionResultView(collection.resource.envelope),
  })
}
