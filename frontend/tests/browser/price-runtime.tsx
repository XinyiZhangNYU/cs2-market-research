import { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CatalogUnitPricePanel } from '../../src/components/CatalogUnitPricePanel'
import { HttpPriceDisplayGateway } from '../../src/api/HttpPriceDisplayGateway'
import type { PriceRequest } from '../../src/api/PriceDisplayApi'
import { LangProvider, type Lang } from '../../src/i18n'
import type { PriceReadContext } from '../../src/price/priceDisplayRuntime'
import { priceAnalysisUnitFromToken } from '../../src/wire/priceDisplayPrimitives'
import type { PriceHistoryQuery, PriceItemQuery, PriceSnapshotQuery } from '../../src/wire/priceDisplayApiTypes'
import { canonicalJsonText } from '../../src/wire/canonical'
import { catalogFixture, itemFixture, snapshotsFixture } from '../support/priceWireFixtures'
import { PriceWireTestGateway } from '../support/priceWireTestGateway'
import './price-presentation-fixture.css'

const item = itemFixture()
const context: PriceReadContext = { analysisUnitId: item.query.analysis_unit_id, catalog: catalogFixture, queryAsOf: snapshotsFixture().query.query_as_of, knownAt: item.query.known_at }
const scenarios = ['mixed', 'no_fx', 'network', 'empty_snapshots', 'invalid_json'] as const
type Scenario = (typeof scenarios)[number]

function requestFromUrl(input: RequestInfo | URL): PriceRequest {
  const url = new URL(String(input), window.location.origin)
  const fields = Object.fromEntries(url.searchParams)
  if (url.pathname === '/api/v1/price-display/snapshots') return { kind: 'PRICE_SNAPSHOT_LIST', query: { ...fields, page_size: Number(fields.page_size) } as unknown as PriceSnapshotQuery }
  const parts = url.pathname.split('/')
  const query = { ...fields, analysis_unit_id: priceAnalysisUnitFromToken(parts[5]) }
  if (parts.length === 6) return { kind: 'PRICE_ITEM', query: query as unknown as PriceItemQuery }
  if (parts.length !== 7 || parts[6] !== 'history') throw new Error('Unexpected synthetic route')
  return { kind: 'PRICE_HISTORY', query: { quote_origin: null, logical_market: null, quote_kind: null, cursor: null, ...query, page_size: Number(fields.page_size) } as unknown as PriceHistoryQuery }
}

function Fixture() {
  const [lang, setLang] = useState<Lang>('zh')
  const [scenario, setScenario] = useState<Scenario>('mixed')
  const [count, setCount] = useState(0)
  const gateway = useMemo(() => {
    const source = new PriceWireTestGateway({ noFx: scenario === 'no_fx', emptySnapshots: scenario === 'empty_snapshots' })
    return new HttpPriceDisplayGateway({ fetcher: async (input, init) => {
      setCount((current) => current + 1)
      if (scenario === 'network') throw new TypeError('Synthetic disconnected transport')
      init?.signal?.throwIfAborted()
      const response = await source.read(requestFromUrl(input), { signal: init?.signal ?? undefined })
      const body = scenario === 'invalid_json' ? '{"duplicate":1,"duplicate":2}' : canonicalJsonText(response.payload)
      return new Response(body, { status: response.httpStatus, headers: { 'Content-Type': 'application/json; charset=utf-8', ETag: response.etag!, 'Content-Length': String(new TextEncoder().encode(body).byteLength) } })
    } })
  }, [scenario])
  return <LangProvider lang={lang}>
    <div className="fixture-shell" lang={lang === 'zh' ? 'zh-CN' : 'en'}>
      <aside className="fixture-notice">OFFLINE SYNTHETIC COMPONENT TEST · 非真实价格 / Not live prices. In-memory HTTP fixture; no database/provider.</aside>
      <div className="fixture-controls">
        <button type="button" data-testid="fixture-language" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>{lang === 'zh' ? 'EN' : 'ZH'}</button>
        <label>Test scenario <select data-testid="fixture-scenario" value={scenario} onChange={(event) => { setCount(0); setScenario(event.currentTarget.value as Scenario) }}>
          {scenarios.map((name) => <option key={name}>{name}</option>)}
        </select></label>
        <output data-testid="fixture-request-count">{count}</output>
      </div>
      <main data-testid="fixture-selected-item">
        <h1>Synthetic catalog member · 合成目录成员</h1>
        <CatalogUnitPricePanel context={context} gateway={gateway} />
      </main>
    </div>
  </LangProvider>
}

createRoot(document.getElementById('root')!).render(<Fixture />)
