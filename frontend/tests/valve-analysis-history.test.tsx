import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LangProvider } from '../src/i18n'
import releasedHistory from '../src/data/valveAnalysisHistory.public.json'
import { ValveAnalysisHistory, parsePublicHistory } from '../src/pages/ValveAnalysisHistory'
import { readPublicRoute, publicRouteHref } from '../src/publicNavigation'

function open(document: unknown = releasedHistory, lang: 'zh' | 'en' = 'zh') {
  return render(<LangProvider lang={lang}><ValveAnalysisHistory document={document} /></LangProvider>)
}

function deadHandCase() {
  return screen.getAllByTestId('valve-history-case').find(entry => entry.querySelector('h3')?.textContent?.includes('毁灭之手'))!
}

// The release keeps only final versions. Revision behavior is exercised on a
// synthetic history: two review copies of one analysis, the second marked for
// correction, followed by the published version.
function revisedHistory() {
  const data = structuredClone(releasedHistory) as any
  const entry = data.cases.find((c: any) => c.title.includes('毁灭之手'))
  const published = entry.versions[0]
  const draft = (version: number, id: string, quality: string) => ({
    ...published, version, revision_id: id.repeat(64), author: 'MODEL', quality, status: 'AWAITING_REVIEW',
    analyzed_at: '2026-09-08T23:56:00Z', information_cutoff_at: '2026-09-08T23:50:00Z', recorded_at: '2026-09-09T00:30:00Z',
    analysis: null, labels: [], comments: [],
  })
  entry.versions = [draft(1, 'a', 'UNREVIEWED'), draft(2, 'b', 'NEEDS_CORRECTION'), { ...published, version: 3 }]
  return data
}

describe('dated labeled announcement history', () => {
  it('renders the reader article as paragraphs with clocks outside the body', () => {
    const data = structuredClone(releasedHistory) as unknown as ReturnType<typeof parsePublicHistory>
    data.cases = [data.cases[0]!]
    data.schema_id = 'valve-analysis-history-public/v2'
    const v = data.cases[0]!.versions.at(-1)!
    v.status = 'PUBLIC'
    v.analysis = { title:'回防模式体验改善', body:'这次更新改善了回防模式的组队体验。\n\n对饰品市场没有明显影响。' }
    v.labels = []
    open(data)
    const body = screen.getByTestId('history-analysis-body')
    expect(body.querySelectorAll('p')).toHaveLength(2)
    expect(body).toHaveTextContent(v.analysis.title)
    expect(body).not.toHaveTextContent('参考资料截至')
    expect(body).not.toHaveTextContent('公告事实')
    expect(body).not.toHaveTextContent('适用条件')
  })
  it('rejects internal audit fields and a reader body under the frozen v1 contract', () => {
    for (const schema of ['valve-analysis-history-public/v1','valve-analysis-history-public/v2']) {
      const data = structuredClone(releasedHistory) as any
      data.cases = [data.cases[0]]
      data.schema_id = schema
      const v = data.cases[0].versions.at(-1)
      v.status = 'PUBLIC'
      v.analysis = { title:'文章', body:'正文' }
      if (schema.endsWith('v2')) v.analysis.evidence_audit = { secret:'internal' }
      expect(() => parsePublicHistory(data)).toThrow()
    }
  })
  it('shows a later correction on an earlier copy of the same dated analysis', async () => {
    const user = userEvent.setup(); open(revisedHistory())
    const card = deadHandCase()
    expect(card).toHaveTextContent('站长点评')
    await user.selectOptions(screen.getByRole('combobox', { name: /毁灭之手.*分析版本/u }), 'a'.repeat(64))
    expect(card).toHaveTextContent('2026-09-08 23:56 UTC')
    expect(card).toHaveTextContent('已有纠正意见，请勿直接沿用旧结论')
    expect(card).toHaveTextContent('后续版本已收录点评')
    expect(within(card).queryByTestId('history-analysis-body')).not.toBeInTheDocument()
  })
  it('supports a canonical history URL and rejects invented view parameters', () => {
    const route = readPublicRoute({ pathname:'/valve/history', search:'?lang=zh' },{surface:'HOME',lang:'en'})
    expect(route.invalid).toBe(false)
    expect(route.historyView).toBe(true)
    expect(publicRouteHref(route)).toBe('/valve/history')
    expect(readPublicRoute({pathname:'/valve',search:'?view=history'},{surface:'HOME',lang:'zh'}).invalid).toBe(true)
  })
  it('shows the release case count, both clocks and attributed user commentary without draft bodies', () => {
    open()
    expect(screen.getAllByTestId('valve-history-case')).toHaveLength(releasedHistory.cases.length)
    const dead = deadHandCase()
    expect(dead).toHaveTextContent('2026-03-11 22:59 UTC')
    expect(dead).toHaveTextContent('分析时间')
    expect(dead).toHaveTextContent('参考资料截至')
    expect(dead).toHaveTextContent('站长点评')
    expect(dead).toHaveTextContent('比如知道了创世终端机的机制')
    expect(within(dead).getByTestId('history-analysis-body')).toHaveTextContent('毁灭之手确认金色稀有物品进入终端机')
    expect(dead).not.toHaveTextContent('本次相对 Genesis 先例的核心变化')
  })

  it('searches cases by title', async () => {
    const user = userEvent.setup(); open()
    await user.type(screen.getByRole('searchbox'),'Genesis Collection')
    expect(screen.getAllByTestId('valve-history-case')).toHaveLength(1)
    expect(screen.getByTestId('valve-history-case')).toHaveTextContent('Genesis Collection')
  })

  it('has an English presentation without rewriting original Chinese commentary', () => {
    open(releasedHistory,'en')
    expect(screen.getByRole('heading',{name:'Announcement analysis history'})).toBeVisible()
    expect(screen.getAllByText(/Curator comment ·/u).length).toBeGreaterThan(0)
    expect(screen.getByTestId('valve-analysis-history')).toHaveTextContent('我的分析有些是马后炮')
  })

  it('shows approved text and conditional labels separately from user comments', () => {
    const data = structuredClone(releasedHistory) as unknown as ReturnType<typeof parsePublicHistory>
    data.cases = [data.cases[0]!]
    const v = data.cases[0]!.versions.at(-1)!
    v.status = 'PUBLIC'
    v.analysis = { facts:'Test fact', mechanisms:'Conditional mechanism', conclusion:'Directional pressure', limitations:['Not a measured outcome'] }
    v.labels = [{ subject:'Old gloves', direction:'NEGATIVE', mechanism:'Substitution', conditions:['Comparable goods'], counterexamples:['Collector preference'], basis:'USER_DERIVED' }]
    open(data)
    const body = screen.getByTestId('history-analysis-body')
    expect(body).toHaveTextContent('Test fact')
    expect(body).toHaveTextContent('Comparable goods')
    expect(body).toHaveTextContent('Collector preference')
    expect(body).toHaveTextContent('依据站长点评整理')
  })

  it('rejects private body or comments returned for withdrawn cases', () => {
    const data = structuredClone(releasedHistory)
    data.cases[0]!.withdrawn = true
    expect(() => parsePublicHistory(data)).toThrow()
    open(data)
    expect(screen.getByRole('alert')).toBeVisible()
    expect(screen.queryByTestId('valve-history-case')).toBeNull()
  })

  it('rejects private fields, future clocks and unsafe links', () => {
    for (const mutate of [
      (d: any) => { d.cases[0].versions[0].private_draft = 'hidden' },
      (d: any) => { d.cases[0].versions[0].information_cutoff_at = '2099-01-01T00:00:00Z' },
      (d: any) => { d.cases[0].official_url = 'javascript:alert(1)' },
    ]) {
      const data = structuredClone(releasedHistory); mutate(data)
      expect(() => parsePublicHistory(data)).toThrow()
    }
  })
})
