import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PriceQuotePanel } from '../src/components/PriceQuotePanel'
import { LangProvider, type Lang } from '../src/i18n'
import { type PricePanelState, type PriceQuoteView } from '../src/price/pricePresentation'
import { cnyQuote, presentationPublication, presentationReady, usdQuote } from './support/pricePresentationFixtures'

function FixtureHost({ state = presentationReady(), initialLang = 'zh', cnyPerUsd = null }: { state?: PricePanelState; initialLang?: Lang; cnyPerUsd?: string | null }) {
  const [lang, setLang] = useState<Lang>(initialLang)
  return <LangProvider lang={lang}>
    <button type="button" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>Language</button>
    <div data-testid="synthetic-selected-item">synthetic-item-unchanged</div>
    <PriceQuotePanel state={state} cnyPerUsd={cnyPerUsd} />
  </LangProvider>
}

function quoteCard(key: string) {
  return within(screen.getByTestId(`price-quote-${key}`))
}

function money(text: string) {
  return screen.getByText(text, { selector: 'strong' })
}

describe('currency presentation only (no production wire or real prices)', () => {
  it('shows each market separately in the page currency, never a combined current price', () => {
    render(<FixtureHost />)
    const usd = quoteCard('synthetic-usd-ask')
    const cny = quoteCard('synthetic-cny-bid')
    expect(usd.getByText('¥70.01')).toHaveAttribute('data-price-currency', 'CNY')
    expect(cny.getByText('¥123.45')).toHaveAttribute('data-price-currency', 'CNY')
    expect(usd.getByText('在售')).toBeInTheDocument()
    expect(cny.getByText('求购')).toBeInTheDocument()
    expect(screen.queryByText('¥193.46')).not.toBeInTheDocument()
  })

  it('takes the currency from the language with no switch, keeping row order and the selected item without fetching', async () => {
    const user = userEvent.setup()
    const state = presentationReady()
    const before = JSON.stringify(state)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected network request'))
    try {
      render(<FixtureHost state={state} />)
      for (let index = 0; index < 3; index += 1) {
        await user.click(screen.getByRole('button', { name: 'Language' }))
        expect(screen.getByTestId('price-panel')).toHaveAttribute('data-price-currency', 'USD')
        expect(quoteCard('synthetic-usd-ask').getByText('$10.001')).toHaveAttribute('data-price-currency', 'USD')
        expect(quoteCard('synthetic-cny-bid').getByText('$17.64')).toHaveAttribute('data-price-converted', 'true')
        await user.click(screen.getByRole('button', { name: 'Language' }))
        expect(screen.getByTestId('price-panel')).toHaveAttribute('data-price-currency', 'CNY')
        expect(quoteCard('synthetic-cny-bid').getByText('¥123.45')).toBeInTheDocument()
      }
      expect(screen.queryByRole('combobox')).toBeNull()
      expect(screen.getByTestId('synthetic-selected-item')).toHaveTextContent('synthetic-item-unchanged')
      expect([...document.querySelectorAll('[data-testid^="price-quote-"]')].map((node) => node.getAttribute('data-testid'))).toEqual(['price-quote-synthetic-usd-ask', 'price-quote-synthetic-cny-bid'])
      expect(JSON.stringify(state)).toBe(before)
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally { fetchSpy.mockRestore() }
  })

  it('shows no method notes: no basis badge, original value, rate, snapshot or publication context', () => {
    render(<FixtureHost />)
    expect(document.querySelector('details')).toBeNull()
    expect(document.querySelector('[data-price-basis]')).toBeNull()
    expect(document.body.textContent).not.toContain('7.000000000000000000')
    expect(document.body.textContent).not.toContain('ecb-eur-cross-daily/2')
    expect(document.body.textContent).not.toContain(presentationPublication.priceSnapshotId)
    expect(document.body.textContent).not.toMatch(/汇率|换算|原生|原币种|舍入/u)
  })

  it.each(['NO_ELIGIBLE_FX', 'FX_STALE', 'AMOUNT_OUT_OF_RANGE'] as const)('converts a native dollar price with the daily rate when the published yuan amount is missing: %s', (reason) => {
    const quote = usdQuote()
    render(<FixtureHost cnyPerUsd="7.1" state={presentationReady([{
      ...quote, fx: null, amounts: { ...quote.amounts, CNY: { status: 'UNAVAILABLE', currency: 'CNY', reason } },
    }])} />)
    expect(money('¥71.01')).toHaveAttribute('data-price-converted', 'true')
    expect(money('¥71.01')).toHaveAttribute('data-price-currency', 'CNY')
  })

  it('keeps the published currency when there is neither a published amount nor a daily rate', () => {
    const quote = usdQuote()
    render(<FixtureHost state={presentationReady([{
      ...quote, fx: null, amounts: { ...quote.amounts, CNY: { status: 'UNAVAILABLE', currency: 'CNY', reason: 'NO_ELIGIBLE_FX' } },
    }])} />)
    expect(money('$10.001')).toHaveAttribute('data-price-currency', 'USD')
    expect(document.querySelector('strong[data-price-currency="CNY"]')).toBeNull()
  })

  it('converts in the yuan to dollar direction too', () => {
    const quote = cnyQuote()
    render(<FixtureHost initialLang="en" cnyPerUsd="7" state={presentationReady([{
      ...quote, fx: null, amounts: { ...quote.amounts, USD: { status: 'UNAVAILABLE', currency: 'USD', reason: 'NO_ELIGIBLE_FX' } },
    }])} />)
    expect(money('$17.64')).toHaveAttribute('data-price-converted', 'true')
  })

  it('shows positive rounded-to-zero as below a minimum unit, not as a zero price', async () => {
    const user = userEvent.setup()
    const quote = usdQuote({
      sourcePrice: { currency: 'USD', unit: 'USD_DECIMAL', value: '0.00000001', upstreamFractionDigits: null },
      amounts: {
        USD: { status: 'AVAILABLE', currency: 'USD', amount: '0.00000001', scale: 8, basis: 'NATIVE', rounding: 'EXACT' },
        CNY: { status: 'AVAILABLE', currency: 'CNY', amount: '0.00', scale: 2, basis: 'FX_DERIVED', rounding: 'ROUNDED_TO_ZERO' },
      },
    })
    render(<FixtureHost state={presentationReady([quote])} />)
    expect(money('< ¥0.01')).toBeInTheDocument()
    expect(screen.queryByText('¥0.00')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Language' }))
    expect(money('$0.00000001')).toHaveAttribute('data-price-currency', 'USD')
  })

  it('treats a zero placeholder as no price', () => {
    const quote = cnyQuote({
      sourcePrice: { currency: 'CNY', unit: 'CNY_MINOR', value: '0', upstreamFractionDigits: null },
      amounts: {
        CNY: { status: 'AVAILABLE', currency: 'CNY', amount: '0.00', scale: 2, basis: 'NATIVE', rounding: 'EXACT' },
        USD: { status: 'UNAVAILABLE', currency: 'USD', reason: 'NO_ELIGIBLE_FX' },
      },
      fx: null,
    })
    render(<FixtureHost state={presentationReady([quote])} />)
    expect(quoteCard('synthetic-cny-bid').getByRole('status')).toHaveTextContent('暂无价格')
    expect(document.querySelector('strong[data-price-currency]')).toBeNull()
  })

  it('never recalculates a supplied published amount', () => {
    const quote = usdQuote()
    // This is deliberately NOT an arithmetic-valid wire vector. It tests that a
    // presentation component selects its supplied bytes, not a second FX formula.
    const supplied = { ...quote, amounts: { ...quote.amounts, CNY: { ...quote.amounts.CNY, amount: '99.99' } } } as PriceQuoteView
    render(<FixtureHost cnyPerUsd="7" state={presentationReady([supplied])} />)
    expect(screen.getByText('¥99.99')).toBeInTheDocument()
    expect(screen.queryByText('¥70.01')).not.toBeInTheDocument()
  })

  it('identifies an aggregate separately instead of calling it a fourth market', () => {
    render(<FixtureHost state={presentationReady([usdQuote({ quoteOrigin: 'PROVIDER_AGGREGATE' })])} />)
    expect(screen.getByRole('heading', { name: '综合参考' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'MARKET_A' })).not.toBeInTheDocument()
    expect(document.querySelectorAll('a')).toHaveLength(0)
  })

  it.each(['SOURCE_UNAVAILABLE', 'CAPTURE_GAP', 'SOURCE_CONFLICT'] as const)('does not replace missing source %s with zero or another quote', (reason) => {
    render(<FixtureHost cnyPerUsd="7" state={presentationReady([usdQuote({
      sourcePrice: null, fx: null,
      amounts: { USD: { status: 'UNAVAILABLE', currency: 'USD', reason }, CNY: { status: 'UNAVAILABLE', currency: 'CNY', reason } },
      eventAt: null, eventBasis: null,
    })])} />)
    expect(screen.getByRole('status')).toHaveTextContent('暂无价格')
    expect(document.querySelector('strong[data-price-currency]')).toBeNull()
    expect(document.querySelector('.price-quote__event')).toBeNull()
  })

  it.each([
    { status: 'NOT_CONNECTED' }, { status: 'LOADING' },
    { status: 'UNAVAILABLE', reason: 'NO_COMPATIBLE_SNAPSHOT' },
    { status: 'UNAVAILABLE', reason: 'CONTRACT_UNAVAILABLE' },
    { status: 'UNAVAILABLE', reason: 'NETWORK_UNAVAILABLE' },
    { status: 'UNAVAILABLE', reason: 'RECORD_REJECTED' },
  ] as const)('shows controlled %s without a sample fallback', (state) => {
    render(<FixtureHost state={state} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(document.querySelector('strong[data-price-currency]')).toBeNull()
    expect(screen.queryByTestId('price-quote-synthetic-usd-ask')).not.toBeInTheDocument()
    expect(screen.getByTestId('synthetic-selected-item')).toBeInTheDocument()
  })

  it('does not fabricate prices for an empty publication', () => {
    render(<FixtureHost state={presentationReady([])} />)
    expect(screen.getByRole('status')).toHaveTextContent('暂无报价。')
    expect(document.querySelectorAll('strong[data-price-currency]')).toHaveLength(0)
  })

  it('does not render a corrupt row', () => {
    const quote = usdQuote({ sourcePrice: { currency: 'USD', unit: 'USD_DECIMAL', value: 'untrusted secret diagnostic', upstreamFractionDigits: null } })
    render(<FixtureHost state={presentationReady([quote])} />)
    expect(screen.getByRole('status')).toHaveTextContent('价格暂时无法显示')
    expect(document.body.textContent).not.toContain('untrusted secret diagnostic')
    expect(document.querySelectorAll('strong[data-price-currency]')).toHaveLength(0)
  })

  it('does not lose significant digits beyond JS safe integers in the DOM', () => {
    const amount = '9007199254740993.12345678'
    const quote = usdQuote({
      sourcePrice: { currency: 'USD', unit: 'USD_DECIMAL', value: amount, upstreamFractionDigits: null },
      amounts: {
        USD: { status: 'AVAILABLE', currency: 'USD', amount, scale: 8, basis: 'NATIVE', rounding: 'EXACT' },
        CNY: { status: 'UNAVAILABLE', currency: 'CNY', reason: 'AMOUNT_OUT_OF_RANGE' },
      },
      fx: null,
    })
    render(<FixtureHost state={presentationReady([quote])} initialLang="en" />)
    expect(money('$9,007,199,254,740,993.12345678')).toBeInTheDocument()
  })
})
