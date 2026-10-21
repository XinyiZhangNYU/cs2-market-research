import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PriceQuotePanel } from '../../src/components/PriceQuotePanel'
import { LangProvider, type Lang } from '../../src/i18n'
import type { PricePanelState } from '../../src/price/pricePresentation'
import { presentationReady, usdQuote } from '../support/pricePresentationFixtures'
import './price-presentation-fixture.css'

const base = usdQuote()
const big = '999999999999999999999999999999.99999999'
const scenarios: Record<string, PricePanelState> = {
  mixed: presentationReady(),
  large: presentationReady([usdQuote({
    sourcePrice: { currency: 'USD', unit: 'USD_DECIMAL', value: big, upstreamFractionDigits: null },
    amounts: {
      USD: { status: 'AVAILABLE', currency: 'USD', amount: big, scale: 8, basis: 'NATIVE', rounding: 'EXACT' },
      CNY: { status: 'UNAVAILABLE', currency: 'CNY', reason: 'AMOUNT_OUT_OF_RANGE' },
    },
    fx: null,
  })]),
  missing: presentationReady([{ ...base, fx: null, amounts: { ...base.amounts, CNY: { status: 'UNAVAILABLE', currency: 'CNY', reason: 'NO_ELIGIBLE_FX' } } }]),
  offline: { status: 'UNAVAILABLE', reason: 'NETWORK_UNAVAILABLE' },
}

function Fixture() {
  const [lang, setLang] = useState<Lang>('zh')
  const [scenario, setScenario] = useState('mixed')
  return <LangProvider lang={lang}>
    <div className="fixture-shell" lang={lang === 'zh' ? 'zh-CN' : 'en'}>
      <aside className="fixture-notice">OFFLINE SYNTHETIC COMPONENT TEST · 非真实价格 / Not live prices</aside>
      <div className="fixture-controls">
        <button type="button" data-testid="fixture-language" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>{lang === 'zh' ? 'EN' : 'ZH'}</button>
        <label>Test scenario <select data-testid="fixture-scenario" value={scenario} onChange={(event) => setScenario(event.currentTarget.value)}>
          {Object.keys(scenarios).map((name) => <option key={name}>{name}</option>)}
        </select></label>
      </div>
      <main data-testid="fixture-selected-item" data-item="synthetic-item-unchanged">
        <PriceQuotePanel state={scenarios[scenario]} />
      </main>
    </div>
  </LangProvider>
}

createRoot(document.getElementById('root')!).render(<Fixture />)
