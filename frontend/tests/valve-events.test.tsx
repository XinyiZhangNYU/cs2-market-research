import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import detailFixture from '../../schemas/examples/valve-event-public-detail.valid.json'
import listFixture from '../../schemas/examples/valve-event-public-list.valid.json'
import { App } from '../src/App'
import {
  isPresentableValveEventView,
  mergeValveEventListViews,
  toValveEventListView,
} from '../src/adapter/valveEventViewModel'
import {
  ValveEventsApi,
  type ValveEventsGateway,
  type ValveEventsRequest,
} from '../src/api/ValveEventsApi'
import { LangProvider } from '../src/i18n'
import { ValveEventsWorkspace } from '../src/pages/ValveEventsWorkspace'
import {
  decodeValveEventApiResponse,
  isValidatedValveEventResponse,
  ValveEventSemanticViolation,
} from '../src/wire/valveEventApiDecode'
import type {
  ValidatedValveEventResponse,
  WireValveEventDetailResponse,
  WireValveEventListResponse,
} from '../src/wire/valveEventApiTypes'

afterEach(() => {
  vi.restoreAllMocks()
})

class FixtureGateway implements ValveEventsGateway {
  readonly kind = 'FORMAL_FIXTURE'
  calls: ValveEventsRequest[] = []

  constructor(
    private readonly transformDetail?: (value: typeof detailFixture) => unknown,
  ) {}

  async read(request: ValveEventsRequest): Promise<unknown> {
    this.calls.push(structuredClone(request))
    if (request.operation === 'LIST') return structuredClone(listFixture)
    const detail = structuredClone(detailFixture)
    return this.transformDetail ? this.transformDetail(detail) : detail
  }
}

describe('Valve event wire and adapter boundary', () => {
  it('validates, seals and adapts the shared public list fixture', () => {
    const decoded = decodeValveEventApiResponse(structuredClone(listFixture))
    expect(isValidatedValveEventResponse(decoded, 'VALVE_EVENT_LIST')).toBe(true)
    expect(Object.isFrozen(decoded)).toBe(true)
    if (decoded.response_kind !== 'VALVE_EVENT_LIST') throw new Error('expected list')
    const view = toValveEventListView(
      decoded as ValidatedValveEventResponse & WireValveEventListResponse,
    )
    expect(isPresentableValveEventView(view, 'LIST')).toBe(true)
    expect(view.events).toHaveLength(2)
    expect(view.events[1].status.code).toBe('SOURCE_ONLY')
    expect(view.events[1].conclusion).toBeNull()
  })

  it('ignores future fields and explicitly downgrades an unknown enum', () => {
    const payload = structuredClone(listFixture) as unknown as Record<string, unknown>
    payload.future_top_level = { safe_future_field: true }
    const events = payload.events as Array<Record<string, unknown>>
    events[0].status = 'FUTURE_REVIEW_STATE'
    events[0].future_summary_field = 'ignored by the V1 adapter'
    const decoded = decodeValveEventApiResponse(payload)
    if (decoded.response_kind !== 'VALVE_EVENT_LIST') throw new Error('expected list')
    const view = toValveEventListView(
      decoded as ValidatedValveEventResponse & WireValveEventListResponse,
    )

    expect(view.events[0].status).toEqual({
      code: 'UNKNOWN',
      source: 'FUTURE_REVIEW_STATE',
      known: false,
    })
    expect(view).not.toHaveProperty('future_top_level')
    expect(view.events[0]).not.toHaveProperty('future_summary_field')
  })

  it('rejects private fields and a mismatched public payload hash', () => {
    const privatePayload = structuredClone(detailFixture) as unknown as Record<
      string,
      unknown
    >
    const privateEvent = privatePayload.event as Record<string, unknown>
    privateEvent.normalized_body_text = 'must never be public'
    expect(() => decodeValveEventApiResponse(privatePayload)).toThrowError(
      ValveEventSemanticViolation,
    )

    const badHash = structuredClone(detailFixture)
    badHash.event.latest_publication.public_payload_sha256 = '0'.repeat(64)
    expect(() => decodeValveEventApiResponse(badHash)).toThrowError(
      /public assessment hash/,
    )
  })

  it('binds detail responses to the requested public event id', async () => {
    const api = new ValveEventsApi(new FixtureGateway())
    await expect(api.detail({ event_id: 'different-event' })).rejects.toThrowError(
      /requested public event id/,
    )
  })

  it('keeps the newest active body when newer public versions are withdrawn', () => {
    const payload = structuredClone(detailFixture) as WireValveEventDetailResponse
    payload.event.status = 'WITHDRAWN'
    payload.event.flags.withdrawn = true
    payload.event.public_versions = [...payload.event.public_versions, {
      publication_id: 'withdrawn-publication-v3',
      publication_version_no: 3,
      published_at: '2026-08-23T09:00:00.000000Z',
      temporal_mode: 'RETROSPECTIVE_CORRECTION',
      withdrawal_reason: 'Superseded body was withdrawn after review.',
      withdrawn: true,
    }]
    const decoded = decodeValveEventApiResponse(payload)
    expect(decoded.response_kind).toBe('VALVE_EVENT_DETAIL')
  })

  it('accepts metadata-only history when every public body is withdrawn', () => {
    const payload = structuredClone(detailFixture) as WireValveEventDetailResponse
    payload.event.status = 'WITHDRAWN'
    payload.event.flags.withdrawn = true
    payload.event.latest_publication = null
    payload.event.latest_outcome = null
    payload.event.public_versions = payload.event.public_versions.map((version) => ({
      ...version,
      withdrawn: true,
      withdrawal_reason: 'Withdrawn from public body access.',
    }))
    const decoded = decodeValveEventApiResponse(payload)
    expect(decoded.response_kind).toBe('VALVE_EVENT_DETAIL')
  })

  it('rejects WITHDRAWN detail without a newest withdrawn version', () => {
    const payload = structuredClone(detailFixture) as WireValveEventDetailResponse
    payload.event.status = 'WITHDRAWN'
    payload.event.flags.withdrawn = true
    expect(() => decodeValveEventApiResponse(payload)).toThrow(
      /newest public version to be withdrawn/u,
    )
  })

  it('refuses a continuation from another query or with duplicate events', () => {
    const currentPayload = structuredClone(listFixture) as WireValveEventListResponse
    currentPayload.next_cursor = 'next-page'
    const decoded = decodeValveEventApiResponse(currentPayload)
    if (decoded.response_kind !== 'VALVE_EVENT_LIST') throw new Error('expected list')
    const current = toValveEventListView(
      decoded as ValidatedValveEventResponse & WireValveEventListResponse,
    )
    const duplicate = toValveEventListView(decoded)
    expect(() => mergeValveEventListViews(current, duplicate)).toThrow(
      /duplicate event/u,
    )
    const anotherQueryPayload = structuredClone(listFixture) as WireValveEventListResponse
    anotherQueryPayload.events = []
    anotherQueryPayload.query_hash = '2'.repeat(64)
    const anotherQueryDecoded = decodeValveEventApiResponse(anotherQueryPayload)
    if (anotherQueryDecoded.response_kind !== 'VALVE_EVENT_LIST') {
      throw new Error('expected list')
    }
    const anotherQuery = toValveEventListView(anotherQueryDecoded)
    expect(() => mergeValveEventListViews(current, anotherQuery)).toThrow(
      /not bound/u,
    )
  })
})

describe('Valve event formal fixture pages', () => {
  it('keeps the existing market formal surface as default and switches modules explicitly', async () => {
    const user = userEvent.setup()
    render(<App initialDataMode="FORMAL_FIXTURE" />)
    expect(await screen.findByTestId('page-market-sector-dashboard')).toBeInTheDocument()

    await user.click(screen.getByTestId('formal-module-valve-events'))
    expect(await screen.findByTestId('valve-event-list')).toBeInTheDocument()
    expect(screen.queryByTestId('page-market-sector-dashboard')).toBeNull()

    await user.click(screen.getByTestId('formal-module-market'))
    expect(await screen.findByTestId('page-market-sector-dashboard')).toBeInTheDocument()
  })

  it('renders source-only and corrected events from the offline fixture without fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network forbidden'))
    render(
      <App
        initialDataMode="FORMAL_FIXTURE"
        initialFormalSurface="VALVE_EVENTS"
      />,
    )

    expect(await screen.findByTestId('valve-event-list')).toBeInTheDocument()
    expect(screen.getAllByTestId(/^valve-event-card-/)).toHaveLength(2)
    expect(screen.getByText('SOURCE_ONLY')).toBeInTheDocument()
    expect(screen.getByText('CORRECTED')).toBeInTheDocument()
    expect(screen.getByText(/官方事件已登记/)).toBeInTheDocument()
    expect(screen.getByText('NO_NETWORK')).toBeInTheDocument()
    expect(screen.getByTestId('valve-events-steam-disclaimer')).toHaveTextContent(
      '与 Valve 或 Steam 无隶属、合作或背书关系',
    )
    expect(screen.getAllByText('AI 生成草稿 · 人工审核并批准发布')).toHaveLength(1)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('opens the approved article, aligned claims, outcome and public-only history', async () => {
    const user = userEvent.setup()
    render(
      <App
        initialDataMode="FORMAL_FIXTURE"
        initialFormalSurface="VALVE_EVENTS"
      />,
    )
    document.documentElement.scrollTop = 720
    document.body.scrollTop = 720
    await user.click(await screen.findByRole('button', { name: '阅读已批准分析' }))

    expect(await screen.findByTestId('valve-event-detail')).toBeInTheDocument()
    expect(document.documentElement.scrollTop).toBe(0)
    expect(document.body.scrollTop).toBe(0)
    expect(screen.getByTestId('valve-event-article')).toHaveTextContent(
      'There is currently no clear evidence of a market-wide effect',
    )
    expect(screen.getByTestId('valve-event-article')).toHaveTextContent(
      'AI 生成草稿 · 人工审核并批准发布',
    )
    expect(screen.getAllByTestId('valve-event-claim')).toHaveLength(2)
    expect(screen.getByTestId('valve-event-outcome')).toHaveTextContent('SUPPORTED')
    expect(screen.getByText('v1')).toBeInTheDocument()
    expect(screen.getByText('v2')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(
      /normalized_body_text|candidate_payload|confidence_score|risk_score/i,
    )
    const official = screen.getByRole('link', { name: /打开官方公告/ })
    expect(official).toHaveAttribute('target', '_blank')
    expect(official).toHaveAttribute('rel', expect.stringContaining('noopener'))

    await user.tab()
    expect(document.activeElement).not.toBe(document.body)
  })

  it('keeps the approved article when the optional outcome is absent', async () => {
    const user = userEvent.setup()
    const gateway = new FixtureGateway((detail) => {
      const mutable = detail as unknown as {
        event: { latest_outcome: unknown | null }
      }
      mutable.event.latest_outcome = null
      return mutable
    })
    render(
      <App
        initialDataMode="FORMAL_FIXTURE"
        initialFormalSurface="VALVE_EVENTS"
        valveEventsGateway={gateway}
      />,
    )
    await user.click(await screen.findByRole('button', { name: '阅读已批准分析' }))

    expect(await screen.findByTestId('valve-event-article')).toBeInTheDocument()
    expect(screen.getByTestId('valve-event-outcome')).toHaveTextContent(
      '结果观察尚未公开',
    )
  })

  it('keeps an all-withdrawn event navigable to its public withdrawal record', async () => {
    const user = userEvent.setup()
    const withdrawnList = structuredClone(listFixture) as WireValveEventListResponse
    const summary = withdrawnList.events[0]
    summary.status = 'WITHDRAWN'
    summary.flags.withdrawn = true
    summary.conclusion_summary = null
    summary.outcome_label = null
    summary.primary_direction = null
    summary.scope_labels = []
    summary.temporal_mode = null

    const withdrawnDetail = structuredClone(
      detailFixture,
    ) as WireValveEventDetailResponse
    withdrawnDetail.event.status = 'WITHDRAWN'
    withdrawnDetail.event.flags.withdrawn = true
    withdrawnDetail.event.latest_publication = null
    withdrawnDetail.event.latest_outcome = null
    withdrawnDetail.event.public_versions = withdrawnDetail.event.public_versions.map(
      (version) => ({
        ...version,
        withdrawn: true,
        withdrawal_reason: 'Withdrawn from public body access.',
      }),
    )
    const gateway: ValveEventsGateway = {
      kind: 'READ_ONLY_HTTP',
      async read(request): Promise<unknown> {
        return structuredClone(
          request.operation === 'LIST' ? withdrawnList : withdrawnDetail,
        )
      },
    }
    render(
      <LangProvider lang="zh">
        <ValveEventsWorkspace gateway={gateway} />
      </LangProvider>,
    )

    await user.click(
      await screen.findByRole('button', { name: '查看撤回记录' }),
    )
    expect(await screen.findByTestId('valve-event-detail')).toHaveTextContent(
      '当前没有仍有效的公开分析正文',
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Withdrawn from public body access.',
    )
  })

  it('withholds gateway exceptions and offers a bounded retry', async () => {
    const user = userEvent.setup()
    const gateway: ValveEventsGateway & { calls: number } = {
      kind: 'FORMAL_FIXTURE',
      calls: 0,
      async read(): Promise<unknown> {
        this.calls += 1
        throw new Error('SQL DSN model prompt secret backend detail')
      },
    }
    render(
      <LangProvider lang="zh">
        <ValveEventsWorkspace gateway={gateway} />
      </LangProvider>,
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('公告暂时无法读取')
    expect(alert.textContent).not.toMatch(/SQL|DSN|model prompt|secret|backend detail/i)
    expect(gateway.calls).toBe(1)
    await user.click(screen.getByRole('button', { name: '重新读取事件档案' }))
    await waitFor(() => expect(gateway.calls).toBe(2))
  })

  it('accepts a read-only HTTP gateway and loads an older keyset page', async () => {
    const user = userEvent.setup()
    const calls: ValveEventsRequest[] = []
    const gateway: ValveEventsGateway = {
      kind: 'READ_ONLY_HTTP',
      async read(request): Promise<unknown> {
        calls.push(structuredClone(request))
        const page = structuredClone(listFixture) as WireValveEventListResponse
        if (request.operation !== 'LIST') return detailFixture
        if (request.cursor === null) {
          page.events = [page.events[0]]
          page.next_cursor = 'older-page'
        } else {
          page.events = [page.events[1]]
          page.next_cursor = null
        }
        return page
      },
    }
    render(
      <LangProvider lang="zh">
        <ValveEventsWorkspace gateway={gateway} />
      </LangProvider>,
    )

    expect(await screen.findByTestId('valve-event-list')).toBeInTheDocument()
    expect(screen.getByText('READ_ONLY_HTTP')).toBeInTheDocument()
    expect(screen.getAllByTestId(/^valve-event-card-/u)).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: '读取更早公告' }))
    await waitFor(() =>
      expect(screen.getAllByTestId(/^valve-event-card-/u)).toHaveLength(2),
    )
    expect(calls).toEqual([
      { operation: 'LIST', cursor: null },
      { operation: 'LIST', cursor: 'older-page' },
    ])
  })
})

describe('Valve event responsive and reduced-motion contract', () => {
  it('contains explicit narrow-layout and reduced-motion handling for the dossier', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*\.valve-events__hero/)
    expect(css).toMatch(/@media \(max-width: 520px\)[\s\S]*\.valve-events__spine/)
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
