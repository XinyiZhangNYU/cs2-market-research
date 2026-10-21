import { useEffect, useMemo, useRef, useState } from 'react'
import type { PriceDisplayGateway } from '../api/PriceDisplayApi'
import { toPricePanelState } from '../adapter/priceDisplayViewModel'
import type { PricePanelState } from '../price/pricePresentation'
import { loadCurrentPrice, priceFailureState, type PriceReadContext, type PreparedPriceDiscovery } from '../price/priceDisplayRuntime'
import { canonicalJsonText } from '../wire/canonical'
import { priceAssert } from '../wire/priceDisplayPrimitives'
import { PriceQuotePanel } from './PriceQuotePanel'
import '../price/priceRuntime.css'

export type CatalogPriceControls = Readonly<{
  gateway: PriceDisplayGateway
  /** Current daily reference rate; prices show in the language's currency. */
  cnyPerUsd?: string | null
  discovery?: PreparedPriceDiscovery
  enabled?: boolean
  /** Explicit native cutover: CNY only and fresh reads, with no prior-price placeholder. */
  nativeCny?: boolean
}>
const LOADING: PricePanelState = Object.freeze({ status: 'LOADING' })

// Current quotes only. Single-item quote history is not published on an
// ongoing basis, so the detail page offers no history view.
export function CatalogUnitPricePanel({ context: inputContext, gateway, cnyPerUsd = null, discovery, enabled = true, nativeCny = false }: CatalogPriceControls & { context: PriceReadContext }) {
  const context = useMemo<PriceReadContext>(() => ({ ...inputContext, catalog: { ...inputContext.catalog } }), [inputContext.analysisUnitId, inputContext.queryAsOf, inputContext.knownAt, inputContext.catalog.snapshot_id, inputContext.catalog.as_of, inputContext.catalog.available_at])
  const contextKey = canonicalJsonText(context)
  const live = useRef<object | null>(null)
  const [current, setCurrent] = useState<{ key: string; gateway: PriceDisplayGateway; nativeCny: boolean; panel: PricePanelState }>({ key: contextKey, gateway, nativeCny, panel: LOADING })

  useEffect(() => {
    if (!enabled) return
    const owner = {}, controller = new AbortController()
    live.current = owner
    setCurrent({ key: contextKey, gateway, nativeCny, panel: LOADING })
    void loadCurrentPrice(gateway, context, { signal: controller.signal, reuse: !nativeCny }, nativeCny ? undefined : discovery).then((response) => {
      if (live.current === owner && !controller.signal.aborted) {
        const itemId = response.items[0]?.item_id
        for (const quote of response.items) priceAssert(quote.item_id === itemId)
        setCurrent({ key: contextKey, gateway, nativeCny, panel: toPricePanelState(response) })
      }
    }).catch((error: unknown) => {
      if (live.current === owner && !controller.signal.aborted) setCurrent({ key: contextKey, gateway, nativeCny, panel: priceFailureState(error) })
    })
    return () => { live.current = null; controller.abort() }
  }, [enabled, gateway, context, contextKey, discovery, nativeCny])

  const panel = current.key === contextKey && current.gateway === gateway && current.nativeCny === nativeCny &&
    (!nativeCny || enabled) ? current.panel : LOADING
  return <section className="formal-price-runtime" data-testid="catalog-unit-price" data-price-read-state={panel.status}>
    <PriceQuotePanel state={panel} cnyPerUsd={cnyPerUsd} nativeCny={nativeCny} />
  </section>
}
