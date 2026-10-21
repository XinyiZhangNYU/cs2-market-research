import { pick, useLang } from '../i18n'
import { languageCurrency } from '../price/localizedCurrency'
import { nativeCnyQuoteDisplayAmount, quoteDisplayAmount, quoteMoneyText } from '../price/lowestAsk'
import {
  selectedPriceAmount,
  type PriceCurrency,
  type PricePanelState,
  type PriceQuoteView,
} from '../price/pricePresentation'
import { priceText } from '../price/strings'
import '../price/pricePresentation.css'

function QuoteAmount({ quote, currency, cnyPerUsd, nativeCny }: { quote: PriceQuoteView; currency: PriceCurrency; cnyPerUsd: string | null; nativeCny: boolean }) {
  const lang = useLang()
  const value = nativeCny ? nativeCnyQuoteDisplayAmount(quote) : quoteDisplayAmount(quote, currency, cnyPerUsd)
  const text = value === null ? null : quoteMoneyText(value)
  if (value === null || text === null) {
    return <div className="price-quote__amount" data-price-state="NONE"><p role="status">{priceText('none', lang)}</p></div>
  }
  return (
    <div className="price-quote__amount" data-price-state="AVAILABLE">
      <strong className="price-quote__value" data-price-currency={value.currency} data-price-converted={value.converted ? 'true' : undefined}>
        {text}
      </strong>
    </div>
  )
}

function QuoteTime({ value }: { value: string }) {
  const lang = useLang()
  const instant = new Date(value)
  if (!Number.isFinite(instant.getTime())) return null
  const text = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(instant)
  return <time dateTime={value}>{text}</time>
}

function QuoteCard({ quote, currency, cnyPerUsd, nativeCny }: { quote: PriceQuoteView; currency: PriceCurrency; cnyPerUsd: string | null; nativeCny: boolean }) {
  const lang = useLang()
  // A malformed row shows no amount at all.
  if (selectedPriceAmount(quote, currency) === null) {
    return <li className="price-quote" data-testid={`price-quote-${quote.key}`} role="status">{priceText('RECORD_REJECTED', lang)}</li>
  }
  return (
    <li className="price-quote" data-testid={`price-quote-${quote.key}`}>
      <header>
        <h3>{quote.quoteOrigin === 'PROVIDER_AGGREGATE' ? priceText('aggregate', lang) : pick(quote.marketLabel, lang)}</h3>
        <span>{priceText(quote.quoteKind === 'ASK' ? 'ask' : 'bid', lang)}</span>
      </header>
      <QuoteAmount quote={quote} currency={currency} cnyPerUsd={cnyPerUsd} nativeCny={nativeCny} />
      {quote.eventAt === null ? null : (
        <div className="price-quote__event">
          <span>{priceText('eventTime', lang)}</span>
          <QuoteTime value={quote.eventAt} />
        </div>
      )}
    </li>
  )
}

// Runtime pages populate these props only through the shared-Schema, hash and
// request-bound price adapter. Presentation fixtures remain test-only. The
// display currency follows the language; `cnyPerUsd` is the current daily
// reference rate for quotes published only in the other currency.
export function PriceQuotePanel({
  state,
  cnyPerUsd = null,
  nativeCny = false,
}: {
  state: PricePanelState
  cnyPerUsd?: string | null
  nativeCny?: boolean
}) {
  const lang = useLang()
  const currency = nativeCny ? 'CNY' : languageCurrency(lang)
  return (
    <section className="price-panel" aria-label={priceText('title', lang)} data-testid="price-panel" data-price-currency={currency}>
      <header className="price-panel__header">
        <h2>{priceText('title', lang)}</h2>
      </header>
      {state.status !== 'READY' ? (
        <p role="status" className="price-panel__absence">
          {priceText(state.status === 'NOT_CONNECTED' ? 'notConnected' : state.status === 'LOADING' ? 'loading' : state.reason, lang)}
        </p>
      ) : state.rows.length === 0 ? <p role="status">{priceText('empty', lang)}</p> : (
        <ul className="price-panel__quotes">
          {state.rows.map((quote) => <QuoteCard key={quote.key} quote={quote} currency={currency} cnyPerUsd={cnyPerUsd} nativeCny={nativeCny} />)}
        </ul>
      )}
    </section>
  )
}
