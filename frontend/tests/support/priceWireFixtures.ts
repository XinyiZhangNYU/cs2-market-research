import itemSource from '../../../schemas/examples/price-display-item.valid.json'
import snapshotSource from '../../../schemas/examples/price-display-snapshots.valid.json'
import historySource from '../../../schemas/examples/price-display-history-page-1.valid.json'
import historyNextSource from '../../../schemas/examples/price-display-history-page-2.valid.json'
import historySnapshotSource from '../../../schemas/examples/price-display-history-snapshots.valid.json'
import { canonicalHash } from '../../src/wire/canonical'
import type { PriceCatalogBinding, PriceDocument, PriceHistory, PriceItem, PriceSnapshotList } from '../../src/wire/priceDisplayApiTypes'

export type MutablePrice<T> = T extends object ? { -readonly [K in keyof T]: MutablePrice<T[K]> } : T
export const itemFixture = (): MutablePrice<PriceItem> => structuredClone(itemSource) as unknown as MutablePrice<PriceItem>
export const snapshotsFixture = (): MutablePrice<PriceSnapshotList> => structuredClone(snapshotSource) as unknown as MutablePrice<PriceSnapshotList>
export const historyFixture = (): MutablePrice<PriceHistory> => structuredClone(historySource) as unknown as MutablePrice<PriceHistory>
export const historyNextFixture = (): MutablePrice<PriceHistory> => structuredClone(historyNextSource) as unknown as MutablePrice<PriceHistory>
export const historySnapshotsFixture = (): MutablePrice<PriceSnapshotList> => structuredClone(historySnapshotSource) as unknown as MutablePrice<PriceSnapshotList>
export const catalogFixture: PriceCatalogBinding = Object.freeze({ snapshot_id: itemSource.snapshot.catalog_snapshot_id, as_of: itemSource.snapshot.catalog_as_of, available_at: itemSource.snapshot.catalog_available_at })

// Synthetic evidence mutations only. Do not repair/reseal a response in runtime.
export function resealPrice<T extends PriceDocument>(document: MutablePrice<T>): MutablePrice<T> {
  if (document.response_kind === 'PRICE_ITEM' || document.response_kind === 'PRICE_HISTORY') {
    for (const quote of document.items) quote.quote_id = canonicalHash(Object.fromEntries(Object.entries(quote).filter(([key]) => key !== 'quote_id')))
  }
  document.document_hash = canonicalHash(Object.fromEntries(Object.entries(document).filter(([key]) => key !== 'document_hash')))
  return document
}
