import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import releasedHistory from '../src/data/valveAnalysisHistory.public.json'
import { LangProvider } from '../src/i18n'
import { ValveAnalysisHistory, parsePublicHistory } from '../src/pages/ValveAnalysisHistory'


function bilingualDocument() {
  const data = structuredClone(releasedHistory) as any
  data.cases = [data.cases[0]]
  data.schema_id = 'valve-analysis-history-public/v3'
  const version = data.cases[0].versions.at(-1)
  version.status = 'PUBLIC'
  version.analysis = {
    zh_cn: { title: '毁灭之手的市场影响', body: '新手套会分流同版型旧手套的需求。' },
    en: { title: 'The market impact of Dead Hand', body: 'New gloves can divert demand from legacy gloves with the same model.' },
  }
  version.labels = [{
    subject: { zh_cn: '旧手套', en: 'Legacy gloves' },
    direction: 'NEGATIVE',
    mechanism: { zh_cn: '新品形成替代', en: 'New items create substitution' },
    conditions: { zh_cn: ['版型或价位相近'], en: ['Comparable model or price tier'] },
    counterexamples: { zh_cn: ['收藏偏好不重叠'], en: ['Collector preferences do not overlap'] },
    basis: 'ASSISTANT_PROVISIONAL',
  }]
  return data
}


describe('bilingual Valve analysis history', () => {
  it('validates and renders the Chinese original without runtime translation', () => {
    const data = bilingualDocument()
    expect(parsePublicHistory(data).schema_id).toBe('valve-analysis-history-public/v3')
    render(<LangProvider lang="zh"><ValveAnalysisHistory document={data} /></LangProvider>)
    const body = screen.getByTestId('history-analysis-body')
    expect(body).toHaveTextContent('毁灭之手的市场影响')
    expect(body).toHaveTextContent('新手套会分流同版型旧手套的需求')
    expect(body).toHaveTextContent('版型或价位相近')
    expect(body).not.toHaveTextContent('New gloves can divert demand')
  })

  it('renders the preserved English original and English labels', () => {
    const data = bilingualDocument()
    render(<LangProvider lang="en"><ValveAnalysisHistory document={data} /></LangProvider>)
    const body = screen.getByTestId('history-analysis-body')
    expect(body).toHaveTextContent('The market impact of Dead Hand')
    expect(body).toHaveTextContent('New gloves can divert demand from legacy gloves with the same model')
    expect(body).toHaveTextContent('Comparable model or price tier')
    expect(body).not.toHaveTextContent('新手套会分流')
  })
})
