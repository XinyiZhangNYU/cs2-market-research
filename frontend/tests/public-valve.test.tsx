import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import listFixture from '../../schemas/examples/valve-event-public-list.valid.json'
import detailFixture from '../../schemas/examples/valve-event-public-detail.valid.json'
import { LangProvider } from '../src/i18n'
import { canonicalHash } from '../src/wire/canonical'
import { PublicValveAnnouncementsPage } from '../src/pages/PublicValveAnnouncementsPage'
import type { ValveEventsGateway } from '../src/api/ValveEventsApi'
import type { WireValveEventListResponse, WireValveEventDetailResponse } from '../src/wire/valveEventApiTypes'

function open(gateway: ValveEventsGateway, lang: 'zh' | 'en' = 'zh') {
  return render(<LangProvider lang={lang}><PublicValveAnnouncementsPage gateway={gateway} />
  </LangProvider>)
}

describe('public Valve announcement consumer', () => {
  it('shows reviewed analysis with historical timing and no implementation diagnostics', async () => {
    const user = userEvent.setup()
    open({ kind: 'READ_ONLY_HTTP', read: async (request) => structuredClone(request.operation === 'LIST' ? listFixture : detailFixture) })
    const list = await screen.findByTestId('valve-event-list')
    const page = screen.getByTestId('public-valve-page')
    expect(list).toHaveTextContent('仅有官方公告')
    expect(list).toHaveTextContent('2026年8月20日')
    expect(list).not.toHaveTextContent('首次取得时间')
    expect(list).not.toHaveTextContent('2026-08-20T12:00:00.000000Z')
    expect(page).not.toHaveTextContent('官方来源 · AI 生成草稿 · 人工审核批准')
    expect(screen.queryByRole('link', { name: '返回首页' })).toBeNull()
    expect(screen.queryByRole('link', { name: '先浏览装备与系列' })).toBeNull()
    await user.click(within(list).getByRole('button', { name: '阅读已批准分析' }))
    const article = await screen.findByTestId('valve-event-article')
    expect(article).toHaveTextContent('AI 生成草稿')
    expect(article).toHaveTextContent('报告发布时间')
    expect(article).toHaveTextContent('2026年8月21日')
    expect(article).not.toHaveTextContent('2026-08-21T09:01:00.000000Z')
    expect(article).not.toHaveTextContent('RETROSPECTIVE_')
    expect(screen.getByTestId('public-valve-page')).not.toHaveTextContent('READ_ONLY_HTTP')
    expect(screen.getByTestId('public-valve-page')).not.toHaveTextContent('valve-event-public-api')
  })

  it.each(['zh', 'en'] as const)('shows an explicit empty archive in %s', async (lang) => {
    const empty = structuredClone(listFixture)
    empty.events = []
    empty.next_cursor = null
    open({ kind: 'READ_ONLY_HTTP', read: async () => empty }, lang)
    expect(await screen.findByTestId('valve-event-list')).toHaveTextContent(lang === 'zh'
      ? '暂时没有可展示的官方公告。' : 'No official announcements are available yet.')
  })

  it('does not display unvalidated server text', async () => {
    open({ kind: 'READ_ONLY_HTTP', read: async () => ({ ...listFixture, response_kind: 'broken', private_draft: 'DO_NOT_DISPLAY' }) })
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(screen.queryByTestId('valve-event-list')).toBeNull()
    expect(screen.getByTestId('public-valve-page')).not.toHaveTextContent('DO_NOT_DISPLAY')
  })

  it('does not reinterpret a future event status as a known context status', async () => {
    const list = structuredClone(listFixture)
    list.events[1]!.status = 'COMPLETE'
    open({ kind: 'READ_ONLY_HTTP', read: async () => list })
    const archive = await screen.findByTestId('valve-event-list')
    expect(archive).toHaveTextContent('状态暂不可识别')
    expect(archive).not.toHaveTextContent('背景数据完整')
  })

  it('keeps a withdrawn publication navigable without its former body or outcome', async () => {
    const list = structuredClone(listFixture) as WireValveEventListResponse
    Object.assign(list.events[0]!, { status: 'WITHDRAWN', conclusion_summary: null,
      outcome_label: null, primary_direction: null, scope_labels: [], temporal_mode: null,
      flags: { ...list.events[0]!.flags, withdrawn: true } })
    const detail = structuredClone(detailFixture) as WireValveEventDetailResponse
    Object.assign(detail.event, { status: 'WITHDRAWN', latest_publication: null, latest_outcome: null,
      flags: { ...detail.event.flags, withdrawn: true },
      public_versions: detail.event.public_versions.map((version) => ({ ...version,
        withdrawn: true, withdrawal_reason: 'Public correction review.' })) })
    open({ kind: 'READ_ONLY_HTTP', read: async (request) => structuredClone(request.operation === 'LIST' ? list : detail) })
    await userEvent.setup().click(await screen.findByRole('button', { name: '查看撤回记录' }))
    expect(await screen.findByTestId('valve-event-detail')).toHaveTextContent('Public correction review.')
    expect(screen.queryByTestId('valve-event-article')).toBeNull()
    expect(screen.getByTestId('valve-event-outcome')).toHaveTextContent('结果观察尚未公开')
  })

  it.each([
    ['zh', '双语活动库标题', '中文第二段。'],
    ['en', 'Bilingual activity title', 'English second paragraph.'],
  ] as const)('renders a V3 reader article in %s', async (lang, title, secondParagraph) => {
    const list = structuredClone(listFixture) as WireValveEventListResponse
    list.events[0]!.conclusion_summary = {
      zh_cn: '中文摘要。',
      en: 'English summary.',
    }
    const detail = structuredClone(detailFixture) as WireValveEventDetailResponse
    detail.event.latest_publication!.article = {
      zh_cn: {
        title: '双语活动库标题',
        body: '中文第一段。\n\n中文第二段。',
      },
      en: {
        title: 'Bilingual activity title',
        body: 'English first paragraph.\n\nEnglish second paragraph.',
      },
    }
    const { public_payload_sha256: _oldHash, ...publicPayload } =
      detail.event.latest_publication!
    detail.event.latest_publication!.public_payload_sha256 = canonicalHash(publicPayload)
    detail.etag = detail.event.latest_publication!.public_payload_sha256
    open({
      kind: 'READ_ONLY_HTTP',
      read: async (request) =>
        structuredClone(request.operation === 'LIST' ? list : detail),
    }, lang)
    expect(await screen.findByTestId('valve-event-list')).toHaveTextContent(
      lang === 'zh' ? '中文摘要。' : 'English summary.',
    )
    await userEvent.setup().click(
      await screen.findByRole('button', {
        name: lang === 'zh' ? '阅读已批准分析' : 'Read approved analysis',
      }),
    )
    const article = await screen.findByTestId('valve-event-article')
    expect(article).toHaveTextContent(title)
    expect(article).toHaveTextContent(secondParagraph)
  })

})
