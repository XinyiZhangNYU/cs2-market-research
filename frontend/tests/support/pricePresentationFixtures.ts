// Synthetic PRESENTATION props only. These are not shared wire examples, a
// published snapshot, source data, or a substitute for a future real API gate.
import type {
  PricePanelState, PriceQuoteView, PricePublicationView,
} from '../../src/price/pricePresentation'

export const presentationPublication: PricePublicationView = {
  kind: 'HISTORY',
  priceSnapshotId: 'synthetic-price-publication-not-a-wire-id',
  catalogSnapshotId: 'synthetic-catalog-publication-not-a-wire-id',
  marketAsOf: '2020-08-14T00:00:00.000000Z',
  knownAt: '2026-09-03T01:00:00.000000Z',
}

export function usdQuote(overrides: Partial<PriceQuoteView> = {}): PriceQuoteView {
  return {
    key: 'synthetic-usd-ask',
    marketLabel: { zh: '市场 A', en: 'Market A' },
    transportLabel: { zh: '合成 USD 来源', en: 'Synthetic USD source' },
    quoteOrigin: 'SOURCE_QUOTE',
    quoteKind: 'ASK',
    sourcePrice: { currency: 'USD', unit: 'USD_DECIMAL', value: '10.00100000', upstreamFractionDigits: null },
    amounts: {
      USD: { status: 'AVAILABLE', currency: 'USD', amount: '10.00100000', scale: 8, basis: 'NATIVE', rounding: 'EXACT' },
      CNY: { status: 'AVAILABLE', currency: 'CNY', amount: '70.01', scale: 2, basis: 'FX_DERIVED', rounding: 'ROUNDED' },
    },
    eventAt: '2020-08-14T00:00:00.000000Z',
    eventBasis: 'BUCKET_AT',
    availableAt: '2026-09-03T00:00:00.000000Z',
    lateBound: true,
    fx: {
      sourceDate: '2020-08-13',
      cnyPerUsd: '7.000000000000000000',
      carryDays: 1,
      selectionPolicy: 'synthetic-eligible-fx/1',
      conversionPolicy: 'ecb-eur-cross-daily/2',
    },
    ...overrides,
  }
}

export function cnyQuote(overrides: Partial<PriceQuoteView> = {}): PriceQuoteView {
  return usdQuote({
    key: 'synthetic-cny-bid',
    marketLabel: { zh: '市场 B', en: 'Market B' },
    transportLabel: { zh: '合成 CNY 来源', en: 'Synthetic CNY source' },
    quoteKind: 'BID',
    sourcePrice: { currency: 'CNY', unit: 'CNY_MINOR', value: '12345', upstreamFractionDigits: 0 },
    amounts: {
      CNY: { status: 'AVAILABLE', currency: 'CNY', amount: '123.45', scale: 2, basis: 'NATIVE', rounding: 'EXACT' },
      USD: { status: 'AVAILABLE', currency: 'USD', amount: '17.63571429', scale: 8, basis: 'FX_DERIVED', rounding: 'ROUNDED' },
    },
    ...overrides,
  })
}

export function presentationReady(rows: readonly PriceQuoteView[] = [usdQuote(), cnyQuote()]): PricePanelState {
  return { status: 'READY', publication: presentationPublication, rows }
}
