import marketDetailFixture from '../../../schemas/examples/result-read-dashboard-market-unit-detail.valid.json'
import sectorCollectionFixture from '../../../schemas/examples/result-read-dashboard-sector-collection-detail.valid.json'
import sectorListFixture from '../../../schemas/examples/result-read-dashboard-sector-unit-list.valid.json'
import type {
  FormalResultReadRequest,
} from '../api/FormalResultReadApi'
import type {
  MarketSectorDashboardGateway,
  MarketSectorSnapshotDescriptor,
} from '../api/MarketSectorDashboardGateway'
import { selectLatestSnapshotAtOrBefore } from '../api/snapshotSelector'
import { decodeResultReadApiResponse } from '../wire/resultReadApiDecode'
import type { WireResultListQuery } from '../wire/resultReadApiTypes'

type FixtureDocuments = Readonly<{
  market: unknown
  sectors: unknown
  collection: unknown
}>

type OfflineSnapshot = Readonly<{
  descriptor: MarketSectorSnapshotDescriptor
  documents: FixtureDocuments
}>

function withoutAsOf(query: WireResultListQuery): Omit<WireResultListQuery, 'as_of'> {
  const { as_of: _asOf, ...filters } = query
  return filters
}

function buildSnapshot(documents: FixtureDocuments): OfflineSnapshot {
  const market = decodeResultReadApiResponse(documents.market)
  const sectors = decodeResultReadApiResponse(documents.sectors)
  const collection = decodeResultReadApiResponse(documents.collection)
  if (
    market.response_kind !== 'UNIT_DETAIL' ||
    sectors.response_kind !== 'UNIT_LIST' ||
    collection.response_kind !== 'COLLECTION_DETAIL'
  ) {
    throw new TypeError('dashboard fixture response kinds do not match their operations')
  }
  const asOf = market.resource.envelope.as_of
  if (
    sectors.members.some((member) => member.envelope.as_of !== asOf) ||
    collection.resource.envelope.as_of !== asOf
  ) {
    throw new TypeError('dashboard fixture documents do not share one as_of')
  }
  return Object.freeze({
    descriptor: Object.freeze({
      as_of: asOf,
      market_analysis_unit_id: market.resource.envelope.identity.analysis_unit_id,
      sector_collection_id: collection.resource.envelope.collection_id,
      sector_query: Object.freeze(withoutAsOf(sectors.query)),
    }),
    documents,
  })
}

const OFFLINE_SNAPSHOTS: readonly OfflineSnapshot[] = Object.freeze([
  buildSnapshot(
    Object.freeze({
      market: marketDetailFixture,
      sectors: sectorListFixture,
      collection: sectorCollectionFixture,
    }),
  ),
])

function requestAsOf(request: FormalResultReadRequest): string {
  return request.operation === 'UNIT_LIST' || request.operation === 'QUALITY_LIST'
    ? request.query.as_of
    : request.as_of
}

function sameSectorQuery(
  requested: WireResultListQuery,
  expected: Omit<WireResultListQuery, 'as_of'>,
): boolean {
  const actual = withoutAsOf(requested)
  return (Object.keys(expected) as (keyof typeof expected)[]).every(
    (key) => actual[key] === expected[key],
  )
}

function cloneDetail(document: unknown, queryAsOf: string): unknown {
  const response = structuredClone(document) as { query_as_of: string }
  response.query_as_of = queryAsOf
  return response
}

function cloneList(document: unknown, queryAsOf: string): unknown {
  const response = structuredClone(document) as { query: { as_of: string } }
  response.query.as_of = queryAsOf
  return response
}

export class OfflineMarketSectorDashboardGateway
  implements MarketSectorDashboardGateway
{
  readonly kind = 'OFFLINE_FIXTURE' as const

  async listMarketSectorSnapshots(): Promise<readonly MarketSectorSnapshotDescriptor[]> {
    return OFFLINE_SNAPSHOTS.map((snapshot) => structuredClone(snapshot.descriptor))
  }

  async read(request: FormalResultReadRequest): Promise<unknown> {
    const snapshot = selectLatestSnapshotAtOrBefore(
      OFFLINE_SNAPSHOTS.map((candidate) => ({
        as_of: candidate.descriptor.as_of,
        candidate,
      })),
      requestAsOf(request),
    ).candidate
    const { descriptor, documents } = snapshot

    if (request.operation === 'UNIT_DETAIL') {
      if (request.analysis_unit_id !== descriptor.market_analysis_unit_id) {
        throw new TypeError('offline dashboard has no matching MARKET unit')
      }
      return cloneDetail(documents.market, request.as_of)
    }
    if (request.operation === 'COLLECTION_DETAIL') {
      if (request.collection_id !== descriptor.sector_collection_id) {
        throw new TypeError('offline dashboard has no matching SECTOR collection')
      }
      return cloneDetail(documents.collection, request.as_of)
    }
    if (request.operation === 'UNIT_LIST') {
      if (request.cursor !== null || !sameSectorQuery(request.query, descriptor.sector_query)) {
        throw new TypeError('offline dashboard has no matching SECTOR page')
      }
      return cloneList(documents.sectors, request.query.as_of)
    }
    throw new TypeError('offline dashboard does not provide a QUALITY fixture')
  }
}
