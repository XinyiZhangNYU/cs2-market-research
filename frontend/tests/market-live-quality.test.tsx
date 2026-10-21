import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { researchApi, setResearchApi } from '../src/api'
import { MarketQualitySection } from '../src/components/MarketQualitySection'
import { LangProvider } from '../src/i18n'
import { MarketOverviewPage } from '../src/pages/MarketOverviewPage'
import { QualityListTestGateway } from './support/qualityListTestGateway'
import type { FormalResultReadGateway } from '../src/api/FormalResultReadApi'

const QUERY_AS_OF = '2026-08-24T12:00:00.000000Z'
const CJK = /[　-〿一-鿿＀-￯]/

function renderSection(
  gateway = new QualityListTestGateway(),
  lang: 'zh' | 'en' = 'zh',
) {
  return render(
    <LangProvider lang={lang}>
      <MarketQualitySection gateway={gateway} initialQueryAsOf={QUERY_AS_OF} />
    </LangProvider>,
  )
}

describe('the market page consumes real QUALITY_LIST results without a mock fallback', () => {
  it('renders real quality without waiting for the synthetic economic proposal', async () => {
    const previous = researchApi()
    const stalled = Object.create(previous) as typeof previous
    stalled.getMarketOverview = () => new Promise<never>(() => undefined)
    setResearchApi(stalled)
    const view = render(
      <LangProvider lang="zh">
        <MarketOverviewPage qualityGateway={new QualityListTestGateway()} />
      </LangProvider>,
    )
    try {
      expect(await screen.findByTestId('live-quality-row')).toBeInTheDocument()
      expect(screen.getByText('加载合成数据…')).toBeInTheDocument()
    } finally {
      view.unmount()
      setResearchApi(previous)
    }
  })

  it('rejects a fixture gateway instead of presenting replay bytes as live quality', () => {
    const fixtureGateway: FormalResultReadGateway = {
      kind: 'FORMAL_FIXTURE',
      async read(): Promise<unknown> {
        return {}
      },
    }
    expect(() =>
      render(
        <LangProvider lang="zh">
          <MarketQualitySection gateway={fixtureGateway} initialQueryAsOf={QUERY_AS_OF} />
        </LangProvider>,
      ),
    ).toThrow('MarketQualitySection accepts the local real-result gateway only')
  })

  it('shows exact query/result/available/published times and safe identities', async () => {
    const gateway = new QualityListTestGateway()
    renderSection(gateway)

    const row = await screen.findByTestId('live-quality-row')
    expect(screen.getByTestId('live-quality-query')).toHaveTextContent(QUERY_AS_OF)
    expect(screen.getByTestId('live-quality-query')).toHaveTextContent('LOCAL_RESULT_API')
    expect(screen.getByTestId('quality-page-accounting')).toHaveTextContent('75.0%')
    expect(screen.getByTestId('quality-page-accounting')).toHaveTextContent('50.0%')
    expect(row).toHaveTextContent('2026-08-22T04:00:00.000000Z')
    expect(row).toHaveTextContent('2026-08-22T03:59:59.000000Z')
    expect(row).toHaveTextContent('2026-08-22T04:00:01.000000Z')
    expect(row).toHaveTextContent('REF#')
    expect(document.body).not.toHaveTextContent('M9 Bayonet Doppler P2 FN')
    expect(gateway.requests).toHaveLength(1)
    expect(gateway.requests[0]).toMatchObject({
      operation: 'QUALITY_LIST',
      query: {
        as_of: QUERY_AS_OF,
        analysis_unit_kind: null,
        edition_kind: null,
        parent_analysis_unit_id: null,
        sort: 'ANALYSIS_UNIT_ID_ASC',
        page_size: 50,
      },
      cursor: null,
    })

    await userEvent.click(screen.getByRole('button', { name: /REF#/ }))
    const detail = screen.getByTestId('live-quality-detail')
    expect(detail).toHaveTextContent('来源质量汇总')
    expect(detail).toHaveTextContent('本次无正样本')
    expect(detail).not.toHaveTextContent('source:primary')
  })

  it('treats a filtered empty page as legal absence rather than invalid applicability', async () => {
    const gateway = new QualityListTestGateway()
    renderSection(gateway)
    await screen.findByTestId('live-quality-row')

    await userEvent.selectOptions(screen.getByLabelText('经济身份粒度'), 'BASE_MHN')
    const empty = await screen.findByTestId('live-quality-empty')
    expect(empty).toHaveTextContent('合法的空结果')
    expect(empty).toHaveTextContent('不据此判断组合无效')
    expect(screen.queryByTestId('live-quality-row')).toBeNull()
    expect(gateway.requests.at(-1)).toMatchObject({
      operation: 'QUALITY_LIST',
      query: { analysis_unit_kind: 'BASE_MHN' },
      cursor: null,
    })
  })

  it('keeps an opaque forward cursor and a local previous-page stack', async () => {
    const gateway = new QualityListTestGateway({ nextCursor: 'opaque-quality-cursor' })
    renderSection(gateway)
    await screen.findByTestId('live-quality-row')

    await userEvent.click(screen.getByRole('button', { name: '下一页' }))
    await waitFor(() => expect(gateway.requests).toHaveLength(2))
    expect(gateway.requests[1]).toMatchObject({
      operation: 'QUALITY_LIST',
      cursor: 'opaque-quality-cursor',
    })
    expect(screen.getByTestId('live-quality-query')).toHaveTextContent('2')

    await userEvent.click(screen.getByRole('button', { name: '上一页' }))
    await waitFor(() => expect(gateway.requests).toHaveLength(3))
    expect(gateway.requests[2]).toMatchObject({ operation: 'QUALITY_LIST', cursor: null })
  })

  it('refreshes to a canonical six-microsecond query instant', async () => {
    const gateway = new QualityListTestGateway()
    render(
      <LangProvider lang="zh">
        <MarketQualitySection
          gateway={gateway}
          initialQueryAsOf={QUERY_AS_OF}
          now={() => new Date('2026-08-24T12:34:56.789Z')}
        />
      </LangProvider>,
    )
    await screen.findByTestId('live-quality-row')

    await userEvent.click(screen.getByRole('button', { name: '刷新到当前时点' }))
    await waitFor(() => expect(gateway.requests).toHaveLength(2))
    expect(gateway.requests[1]).toMatchObject({
      operation: 'QUALITY_LIST',
      query: { as_of: '2026-08-24T12:34:56.789000Z' },
      cursor: null,
    })
  })

  it('renders controlled and boundary errors without reflecting backend detail', async () => {
    const controlled = new QualityListTestGateway({ controlledError: true })
    const first = renderSection(controlled)
    const controlledAlert = await screen.findByTestId('live-quality-controlled-error')
    expect(controlledAlert).toHaveTextContent('NOT_FOUND')
    expect(controlledAlert).toHaveTextContent('http_status=404')
    expect(screen.queryByTestId('live-quality-row')).toBeNull()
    first.unmount()

    const boundary = new QualityListTestGateway({
      throwError: new Error('SQL DSN MARKET_B secret backend detail'),
    })
    renderSection(boundary)
    const boundaryAlert = await screen.findByTestId('live-quality-boundary-error')
    expect(boundaryAlert).toHaveTextContent('CONSUMPTION_BOUNDARY_REJECTED')
    expect(boundaryAlert.textContent).not.toMatch(/SQL|DSN|MARKET_[A-D]|secret|backend detail/i)
    expect(screen.queryByTestId('live-quality-row')).toBeNull()
  })

  it('has a complete English surface without CJK leakage', async () => {
    const { container } = renderSection(new QualityListTestGateway(), 'en')
    expect(await screen.findByTestId('live-quality-row')).toBeInTheDocument()
    expect(CJK.test(container.textContent ?? '')).toBe(false)
  })
})
