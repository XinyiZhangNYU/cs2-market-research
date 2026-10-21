import { isDecodedPriceDocument } from '../wire/priceDisplayApiDecode'
import type { PriceHistory, PriceItem, PriceQuote } from '../wire/priceDisplayApiTypes'
import { comparePriceOrder, priceAssert, priceEvent, priceOrder, priceSourceKey } from '../wire/priceDisplayPrimitives'
import { canonicalJsonText } from '../wire/canonical'
import type { NativePriceView, PriceAmountsView, PricePanelState, PriceQuoteView } from '../price/pricePresentation'
import type { Localized } from '../i18n'

const markets: Record<'market_a' | 'market_c' | 'market_b', Localized> = {
  market_a: { zh: '市场 A', en: 'Market A' },
  market_c: { zh: '市场 C', en: 'Market C' },
  market_b: { zh: '市场 B', en: 'Market B' },
}
function quoteView(quote: PriceQuote): PriceQuoteView {
  const source = quote.source_price
  const sourcePrice: NativePriceView | null = source === null ? null : source.currency === 'USD'
    ? { currency: 'USD', unit: 'USD_DECIMAL', value: source.value, upstreamFractionDigits: source.upstream_fraction_digits }
    : { currency: 'CNY', unit: 'CNY_MINOR', value: source.value, upstreamFractionDigits: source.upstream_fraction_digits }
  const amounts = Object.fromEntries((['USD', 'CNY'] as const).map((currency) => {
    const amount = quote.amounts[currency]
    return [currency, Object.freeze(amount.status === 'AVAILABLE'
      ? { status: amount.status, currency, amount: amount.amount, scale: amount.scale, basis: amount.basis, rounding: amount.rounding }
      : { status: amount.status, currency, reason: amount.reason })]
  })) as PriceAmountsView
  return Object.freeze({
    key: quote.quote_id,
    marketLabel: quote.source.logical_market === null ? { zh: '供应商聚合', en: 'Provider aggregate' } : markets[quote.source.logical_market],
    transportLabel: quote.source.transport === 'upstream' ? { zh: '聚合供应商', en: 'Aggregator' } : { zh: '市场 B 直连', en: 'Market B direct' },
    quoteOrigin: quote.source.quote_origin, quoteKind: quote.quote_kind,
    sourcePrice: sourcePrice === null ? null : Object.freeze(sourcePrice), amounts: Object.freeze(amounts),
    eventAt: priceEvent(quote), eventBasis: quote.time_basis === 'UNAVAILABLE' ? null : quote.time_basis,
    availableAt: quote.available_at, lateBound: quote.late_bound,
    fx: quote.fx === null ? null : Object.freeze({ sourceDate: quote.fx.source_event_date, cnyPerUsd: quote.fx.cny_per_usd, carryDays: quote.fx.carry_days, selectionPolicy: quote.fx.fx_selection_policy_version, conversionPolicy: quote.fx.conversion_policy_version }),
  })
}

// Branded input only: fixture props and raw, hash-only documents cannot enter a
// live price panel. No FX computation, source fusion or amount sorting here.
export function toPricePanelState(response: PriceItem | PriceHistory): Extract<PricePanelState, { status: 'READY' }> {
  priceAssert(isDecodedPriceDocument(response))
  return Object.freeze({
    status: 'READY',
    publication: Object.freeze({ kind: response.snapshot.kind, priceSnapshotId: response.snapshot.snapshot_id, catalogSnapshotId: response.snapshot.catalog_snapshot_id, marketAsOf: response.snapshot.market_as_of, knownAt: response.query.known_at }),
    rows: Object.freeze(response.items.map(quoteView)),
  })
}

/** Accumulate only consecutive decoded pages from one immutable publication.
 * Each page is valid alone; this also prevents cross-page item/source drift. */
export function toPriceHistoryPanelState(pages: readonly PriceHistory[]): Extract<PricePanelState, { status: 'READY' }> {
  priceAssert(pages.length > 0 && pages[0].query.cursor === null)
  const first = pages[0]
  const view = toPricePanelState(first)
  const rows: PriceQuoteView[] = []
  const ids = new Set<string>(), sources = new Set<string>()
  let prior: readonly string[] | null = null
  let itemId: string | null = null
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index]
    priceAssert(isDecodedPriceDocument(page))
    priceAssert(canonicalJsonText(page.snapshot) === canonicalJsonText(first.snapshot))
    priceAssert(canonicalJsonText({ ...page.query, cursor: null }) === canonicalJsonText(first.query))
    if (index > 0) priceAssert(pages[index - 1].pagination.next_cursor !== null && page.query.cursor === pages[index - 1].pagination.next_cursor)
    for (const quote of page.items) {
      itemId ??= quote.item_id
      priceAssert(itemId === quote.item_id)
      const source = priceSourceKey(quote, true), order = priceOrder(quote)
      priceAssert(!ids.has(quote.quote_id) && !sources.has(source) && (prior === null || comparePriceOrder(prior, order) < 0))
      ids.add(quote.quote_id); sources.add(source); prior = order
    }
    rows.push(...toPricePanelState(page).rows)
  }
  return Object.freeze({ ...view, rows: Object.freeze(rows) })
}
