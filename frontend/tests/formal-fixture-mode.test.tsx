import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import type {
  FormalResultReadGateway,
  FormalResultReadRequest,
} from '../src/api/FormalResultReadApi'
import { LangProvider } from '../src/i18n'
import { FormalFixtureWorkspace } from '../src/pages/FormalFixtureWorkspace'

const CJK = /[　-〿一-鿿＀-￯]/

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the frontend keeps mock proposal and formal fixture data channels separate', () => {
  it('preserves the existing mock proposal as the default', async () => {
    render(<App initialPage="hub" />)
    expect(screen.getByTestId('data-channel')).toHaveAttribute('data-data-mode', 'MOCK')
    expect(screen.getByTestId('prototype-banner')).toHaveTextContent(
      'EXPLORATORY_FRONTEND_PROTOTYPE / MOCK_DATA_ONLY',
    )
    expect(screen.getByTestId('page-hub')).toBeInTheDocument()
    expect(screen.queryByTestId('page-formal-fixture')).toBeNull()
    expect(await screen.findByTestId('quality-strip')).toBeInTheDocument()
  })

  it('enters the formal workspace without mounting any mock product surface', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network forbidden'))
    render(<App initialDataMode="FORMAL_FIXTURE" />)

    expect(screen.getByTestId('data-channel')).toHaveAttribute(
      'data-data-mode',
      'FORMAL_FIXTURE',
    )
    expect(screen.getByTestId('prototype-banner')).toHaveTextContent(
      'EXPLORATORY_FRONTEND_PROTOTYPE / FORMAL_FIXTURE_ONLY',
    )
    expect(screen.getByTestId('page-market-sector-dashboard')).toBeInTheDocument()
    expect(screen.queryByTestId('page-hub')).toBeNull()
    expect(screen.queryByTestId('quality-strip')).toBeNull()
    expect(await screen.findByTestId('dashboard-accounting')).toBeInTheDocument()
    expect(screen.getAllByTestId('dashboard-sector-row')).toHaveLength(4)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns to the exact mock item view that was open before replay mode', async () => {
    const user = userEvent.setup()
    render(<App initialPage="item" initialItemId="ITEM-0008" />)
    expect(await screen.findByTestId('page-item')).toHaveTextContent('ITEM-0008')

    await user.click(screen.getByTestId('data-mode-formal-fixture'))
    expect(await screen.findByTestId('dashboard-accounting')).toBeInTheDocument()
    expect(screen.queryByTestId('page-item')).toBeNull()

    await user.click(screen.getByTestId('data-mode-mock'))
    expect(await screen.findByTestId('page-item')).toHaveTextContent('ITEM-0008')
    expect(screen.getByTestId('item-image-ITEM-0008-detail')).toHaveAttribute(
      'data-image-status',
      'NOT_PRODUCED',
    )
  })
})

describe('the formal fixture desk exercises every frozen response shape', () => {
  it('switches across collection, list, unit, quality and controlled error without fetch', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network forbidden'))
    render(
      <App
        initialDataMode="FORMAL_FIXTURE"
        initialFormalScenario="MARKET_COLLECTION"
      />,
    )

    expect(await screen.findByTestId('result-collection')).toBeInTheDocument()

    await user.click(screen.getByTestId('formal-scenario-item-list'))
    expect(await screen.findByTestId('formal-result-read-list')).toBeInTheDocument()
    expect(screen.getAllByTestId('result-unit')).toHaveLength(1)

    await user.click(screen.getByTestId('formal-scenario-item-detail'))
    await waitFor(() => {
      expect(screen.queryByTestId('formal-result-read-list')).toBeNull()
      expect(screen.getByTestId('result-unit')).toBeInTheDocument()
    })
    expect(document.body).not.toHaveTextContent('M9 Bayonet Doppler P2 FN')

    await user.click(screen.getByTestId('formal-scenario-quality-detail'))
    expect(await screen.findByTestId('quality-envelope')).toBeInTheDocument()
    expect(screen.queryByTestId('result-unit')).toBeNull()

    await user.click(screen.getByTestId('formal-scenario-controlled-error'))
    const controlled = await screen.findByTestId('formal-result-read-error')
    expect(controlled).toHaveTextContent('NOT_FOUND')
    expect(controlled).toHaveTextContent('http_status=404')
    expect(controlled).toHaveTextContent('retryable=false')
    expect(controlled.textContent).not.toMatch(/SQL|DSN|MARKET_[A-D]/i)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('shows each fixture request as an explicit PIT operation', async () => {
    const user = userEvent.setup()
    render(<App initialDataMode="FORMAL_FIXTURE" initialFormalScenario="ITEM_DETAIL" />)

    const telemetry = screen.getByTestId('formal-fixture-telemetry')
    expect(telemetry).toHaveTextContent('UNIT_DETAIL')
    expect(telemetry).toHaveTextContent('2026-08-21T00:00:02.000000Z')
    expect(telemetry).toHaveTextContent('NO_NETWORK')
    expect(await screen.findByTestId('result-unit')).toBeInTheDocument()

    await user.click(screen.getByTestId('formal-scenario-quality-detail'))
    await waitFor(() => {
      expect(telemetry).toHaveTextContent('QUALITY_DETAIL')
      expect(telemetry).toHaveTextContent('2026-08-22T04:00:02.000000Z')
    })
  })
})

describe('formal fixture failures stay fail-closed and localised', () => {
  it('rejects a non-fixture gateway before it can enter the offline workspace', () => {
    const gateway: FormalResultReadGateway = {
      kind: 'HTTP',
      async read(): Promise<unknown> {
        return {}
      },
    }

    expect(() =>
      render(
        <LangProvider lang="en">
          <FormalFixtureWorkspace gateway={gateway} />
        </LangProvider>,
      ),
    ).toThrow('FormalFixtureWorkspace accepts an offline fixture gateway only')
  })

  it('withholds an injected gateway exception and offers a bounded retry', async () => {
    const user = userEvent.setup()
    const gateway: FormalResultReadGateway & { calls: number } = {
      kind: 'FORMAL_FIXTURE',
      calls: 0,
      async read(_request: FormalResultReadRequest): Promise<unknown> {
        this.calls += 1
        throw new Error('SQL DSN MARKET_B secret backend detail')
      },
    }
    render(
      <LangProvider lang="zh">
        <FormalFixtureWorkspace gateway={gateway} />
      </LangProvider>,
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('正式消费边界拒绝了该载荷')
    expect(alert.textContent).not.toMatch(/SQL|DSN|MARKET_[A-D]|secret|backend detail/i)
    expect(gateway.calls).toBe(1)

    await user.click(screen.getByRole('button', { name: '重新校验' }))
    await waitFor(() => expect(gateway.calls).toBe(2))
  })

  it('renders the whole formal workspace in English without CJK leakage', async () => {
    const { container } = render(
      <App initialDataMode="FORMAL_FIXTURE" initialLang="en" />,
    )
    expect(await screen.findByTestId('dashboard-accounting')).toBeInTheDocument()
    expect(CJK.test(container.textContent ?? '')).toBe(false)
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toContain('FORMAL_FIXTURE_ONLY')
  })
})
