import type { FormalResultReadGateway } from './FormalResultReadApi'
import type { WireResultListQuery } from '../wire/resultReadApiTypes'

export type MarketSectorSnapshotDescriptor = Readonly<{
  as_of: string
  market_analysis_unit_id: string
  sector_collection_id: string
  sector_query: Omit<WireResultListQuery, 'as_of'>
}>

// Both the offline fixture and a future transport implement this boundary. The loader, decoder,
// view model and page do not know which transport supplied the unknown JSON documents.
export interface MarketSectorDashboardGateway extends FormalResultReadGateway {
  listMarketSectorSnapshots(): Promise<readonly MarketSectorSnapshotDescriptor[]>
}
