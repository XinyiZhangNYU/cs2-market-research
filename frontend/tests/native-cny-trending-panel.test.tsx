import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpNativeCnyTrendingGateway, NativeCnyTrendingClientError,
  decodeNativeCnyTrendingDay } from '../src/api/HttpNativeCnyTrendingGateway'
import type { NativeCnyTrendingDay, NativeCnyTrendingSelection } from '../src/api/HttpNativeCnyTrendingGateway'
import { BoundedJsonFetchError } from '../src/api/boundedJsonFetch'
import { canonicalHash } from '../src/wire/canonical'
import { NativeCnyTrendingPanel } from '../src/trending/NativeCnyTrendingPanel'
import { nativeTrendingFixture } from './native-cny-trending-view-fixture'

function deferred() {
  let resolve!: (day: NativeCnyTrendingDay) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<NativeCnyTrendingDay>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
async function settle(action: () => void = () => undefined) {
  await act(async () => { action(); await Promise.resolve() })
}
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('LIVE_NETWORK_FORBIDDEN') })) })
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('standalone native Trending opt-in requests', () => {
  it('has no default gateway or fetch when mounted without opt-in props', () => {
    render(<NativeCnyTrendingPanel />)
    expect(screen.getByRole('status')).toHaveTextContent('未注入')
    expect(fetch).not.toHaveBeenCalled()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
  it('does not request with selection but no explicit gateway', () => {
    render(<NativeCnyTrendingPanel selection={nativeTrendingFixture().selection} />)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('does not request without an explicit selection', () => {
    const gateway = { day: vi.fn() }
    render(<NativeCnyTrendingPanel gateway={gateway} />)
    expect(gateway.day).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('未选择')
  })
  it.each(['publicationId', 'publicSha256', 'rightsSha256', 'readinessReviewSha256',
    'candidateSha256', 'catalogPublicationId', 'startDate', 'endDate', 'knownAt'] as const)(
    'does not request on an incomplete selection field: %s', field => {
      const gateway = { day: vi.fn() }
      const bad = { ...nativeTrendingFixture().selection, [field]: undefined } as unknown as NativeCnyTrendingSelection
      render(<NativeCnyTrendingPanel gateway={gateway} selection={bad} />)
      expect(gateway.day).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveAttribute('data-error-code', 'INVALID_SELECTION')
    })
  it('requests once with a full frozen selection and its own AbortSignal', async () => {
    const { day, selection } = nativeTrendingFixture(), pending = deferred()
    const gateway = { day: vi.fn((_selection: NativeCnyTrendingSelection, _signal?: AbortSignal) => pending.promise) }
    render(<NativeCnyTrendingPanel gateway={gateway} selection={selection} />)
    expect(screen.getByRole('status')).toHaveTextContent('正在读取')
    expect(gateway.day).toHaveBeenCalledTimes(1)
    const [pinned, signal] = gateway.day.mock.calls[0] as unknown as [NativeCnyTrendingSelection, AbortSignal]
    expect(pinned).toEqual(selection); expect(pinned).not.toBe(selection)
    expect(Object.isFrozen(pinned)).toBe(true); expect(signal.aborted).toBe(false)
    selection.knownAt = '2026-10-02T00:00:03Z'
    await settle(() => pending.resolve(day))
    expect(screen.getByText('2026-10-02T00:00:02Z')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('works with the actual native gateway and an injected one-attempt synthetic fetch', async () => {
    const fixture = nativeTrendingFixture()
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(fixture.envelope),
      { headers: { 'Content-Type': 'application/json' } }))
    render(<NativeCnyTrendingPanel gateway={new HttpNativeCnyTrendingGateway(fetcher)} selection={fixture.selection} />)
    await settle()
    expect(screen.getByText('合成 Trending 物品')).toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher.mock.calls[0]?.[0]).toBe(`/api/v1/native-cny/trending/day?publication=${fixture.selection.publicationId}`)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('retains exact text, original ranks, all pins/clocks/quality and source labels without inventing source rows', async () => {
    const { day, selection } = nativeTrendingFixture('1', '<img src=x onerror=alert(1)>')
    const gateway = { day: vi.fn(async () => day) }
    const { container } = render(<NativeCnyTrendingPanel gateway={gateway} selection={selection} />)
    await settle()
    const gainers = within(screen.getByRole('region', { name: '涨幅 GAINERS' }))
    expect(gainers.getAllByRole('row').slice(1).map(row => within(row).getAllByRole('cell')[0].textContent))
      .toEqual(['1', '2', '3'])
    expect(gainers.getAllByRole('row').slice(1).map(row => within(row).getAllByRole('cell')[1].textContent))
      .toEqual(['<img src=x onerror=alert(1)>item:18446744073709551615', '相等比率：十item:10', '相等比率：二item:2'])
    expect(screen.getByText(`0x1${'0'.repeat(200)} / 0x3`)).toBeInTheDocument()
    expect(screen.getByText('-0x1 / 0x3')).toBeInTheDocument()
    for (const value of Object.values(selection)) expect(screen.getAllByText(value).length).toBeGreaterThan(0)
    for (const value of [day.releasedAt, day.asOf, day.inputAvailableAt, day.evidenceClass, day.method])
      expect(screen.getByText(value)).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('支持来源数：2')
    expect(container.textContent).toContain('保守端点来源：market_a')
    expect(container.textContent).toContain('未列出某来源不能推断为 NO_ACTIVE_ASK')
    expect(container.textContent).toContain('不认证 rights / review')
    expect(container.textContent).toContain('正文 hash，不是 HTTP 整包 hash')
  })
  it('presents an explicitly published empty list, not a missing/error response', async () => {
    const value = nativeTrendingFixture(); value.envelope.data.members = []
    value.envelope.public_sha256 = canonicalHash(value.envelope.data)
    value.selection.publicSha256 = value.envelope.public_sha256
    const day = decodeNativeCnyTrendingDay(value.envelope, value.selection)
    render(<NativeCnyTrendingPanel gateway={{ day: async () => day }} selection={value.selection} />)
    await settle()
    expect(screen.getByRole('status')).toHaveTextContent('成员列表为空')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
  it.each(['NOT_PUBLISHED', 'TEMPORARILY_UNAVAILABLE', 'UNSUPPORTED_EXACT_SIZE'] as const)(
    'keeps %s as an explicit error, with no fallback, fabricated empty list or retry', async code => {
      const gateway = { day: vi.fn(async () => { throw new NativeCnyTrendingClientError(code) }) }
      const { container } = render(<NativeCnyTrendingPanel gateway={gateway} selection={nativeTrendingFixture().selection} />)
      await settle()
      expect(screen.getByRole('alert')).toHaveAttribute('data-error-code', code)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      expect(container.textContent).not.toContain('成员列表为空')
      if (code === 'UNSUPPORTED_EXACT_SIZE') expect(screen.getByRole('alert')).toHaveTextContent('4096')
      expect(gateway.day).toHaveBeenCalledTimes(1)
      expect(fetch).not.toHaveBeenCalled()
    })
  it('handles deadline failure without echoing arbitrary diagnostics', async () => {
    const gateway = { day: vi.fn(async () => { throw new BoundedJsonFetchError('REQUEST_TIMEOUT') }) }
    render(<NativeCnyTrendingPanel gateway={gateway} selection={nativeTrendingFixture().selection} />)
    await settle()
    expect(screen.getByRole('alert')).toHaveAttribute('data-error-code', 'REQUEST_TIMEOUT')
  })
  it('catches synchronous gateway failure and never echoes secret diagnostic text', async () => {
    const gateway = { day: vi.fn(() => { throw new Error('SYNTHETIC_SECRET_ENDPOINT_DSN') }) }
    const { container } = render(<NativeCnyTrendingPanel gateway={gateway} selection={nativeTrendingFixture().selection} />)
    await settle()
    expect(screen.getByRole('alert')).toHaveAttribute('data-error-code', 'REQUEST_FAILED')
    expect(container.textContent).not.toContain('SYNTHETIC_SECRET_ENDPOINT_DSN')
  })
  it('does not echo a non-allowlisted code attached to a known error class', async () => {
    const error = Object.assign(new NativeCnyTrendingClientError('INVALID_RESPONSE'), { code: 'SYNTHETIC_SECRET_CODE' })
    const gateway = { day: vi.fn(async () => { throw error }) }
    const { container } = render(<NativeCnyTrendingPanel gateway={gateway} selection={nativeTrendingFixture().selection} />)
    await settle()
    expect(screen.getByRole('alert')).toHaveAttribute('data-error-code', 'REQUEST_FAILED')
    expect(container.textContent).not.toContain('SYNTHETIC_SECRET_CODE')
  })
})

describe('native Trending request retirement and cancellation', () => {
  it('manual cancellation aborts and ignores a late completion without auto-retrying', async () => {
    const { selection, day } = nativeTrendingFixture(), pending = deferred()
    const gateway = { day: vi.fn((_selection: NativeCnyTrendingSelection, _signal?: AbortSignal) => pending.promise) }
    const { rerender } = render(<NativeCnyTrendingPanel gateway={gateway} selection={selection} />)
    const signal = gateway.day.mock.calls[0]?.[1] as unknown as AbortSignal
    fireEvent.click(screen.getByRole('button', { name: '取消本次请求' }))
    expect(signal.aborted).toBe(true)
    await settle(() => pending.resolve(day))
    expect(screen.getByRole('status')).toHaveTextContent('已取消')
    expect(screen.queryByText('合成 Trending 物品')).not.toBeInTheDocument()
    rerender(<NativeCnyTrendingPanel gateway={gateway} selection={{ ...selection }} />)
    expect(gateway.day).toHaveBeenCalledTimes(1)
  })
  it('does not start with an already-aborted external signal', () => {
    const external = new AbortController(); external.abort()
    const gateway = { day: vi.fn() }
    render(<NativeCnyTrendingPanel gateway={gateway} selection={nativeTrendingFixture().selection} signal={external.signal} />)
    expect(gateway.day).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('已取消')
  })
  it('external cancellation propagates to the request and cannot become READY later', async () => {
    const external = new AbortController(), pending = deferred(), value = nativeTrendingFixture()
    const gateway = { day: vi.fn((_selection: NativeCnyTrendingSelection, _signal?: AbortSignal) => pending.promise) }
    render(<NativeCnyTrendingPanel gateway={gateway} selection={value.selection} signal={external.signal} />)
    const requestSignal = gateway.day.mock.calls[0]?.[1] as unknown as AbortSignal
    await settle(() => external.abort())
    expect(requestSignal.aborted).toBe(true)
    await settle(() => pending.resolve(value.day))
    expect(screen.getByRole('status')).toHaveTextContent('已取消')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
  it('unmount aborts and retires late failures', async () => {
    const pending = deferred(), gateway = { day: vi.fn((_selection: NativeCnyTrendingSelection, _signal?: AbortSignal) => pending.promise) }
    const { unmount } = render(<NativeCnyTrendingPanel gateway={gateway} selection={nativeTrendingFixture().selection} />)
    const signal = gateway.day.mock.calls[0]?.[1] as unknown as AbortSignal
    unmount(); expect(signal.aborted).toBe(true)
    await settle(() => pending.reject(new Error('late synthetic failure')))
  })
  it('switches publications, hides old data and ignores old completion even when gateway ignores abort', async () => {
    const old = nativeTrendingFixture('1', '旧 publication 名称'), next = nativeTrendingFixture('2', '新 publication 名称')
    const first = deferred(), second = deferred()
    const gateway = { day: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) }
    const { rerender } = render(<NativeCnyTrendingPanel gateway={gateway} selection={old.selection} />)
    const oldSignal = gateway.day.mock.calls[0][1] as AbortSignal
    rerender(<NativeCnyTrendingPanel gateway={gateway} selection={next.selection} />)
    expect(oldSignal.aborted).toBe(true)
    expect(screen.queryByText('旧 publication 名称')).not.toBeInTheDocument()
    await settle(() => second.resolve(next.day))
    await settle(() => first.resolve(old.day))
    expect(screen.getByText('新 publication 名称')).toBeInTheDocument()
    expect(screen.queryByText('旧 publication 名称')).not.toBeInTheDocument()
    expect(gateway.day).toHaveBeenCalledTimes(2)
  })
  it('deselection immediately hides a ready publication and does not fetch latest', async () => {
    const value = nativeTrendingFixture(), gateway = { day: vi.fn(async () => value.day) }
    const { rerender } = render(<NativeCnyTrendingPanel gateway={gateway} selection={value.selection} />)
    await settle(); expect(screen.getByText('合成 Trending 物品')).toBeInTheDocument()
    rerender(<NativeCnyTrendingPanel gateway={gateway} selection={null} />)
    expect(screen.queryByText('合成 Trending 物品')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('未选择')
    expect(gateway.day).toHaveBeenCalledTimes(1)
  })
  it('equivalent copied selections do not repeat a request', async () => {
    const value = nativeTrendingFixture(), gateway = { day: vi.fn(async () => value.day) }
    const { rerender } = render(<NativeCnyTrendingPanel gateway={gateway} selection={value.selection} />)
    await settle()
    rerender(<NativeCnyTrendingPanel gateway={gateway} selection={{ ...value.selection }} />)
    expect(gateway.day).toHaveBeenCalledTimes(1)
  })
  it('gateway switching retires a late old error, even with identical pins', async () => {
    const value = nativeTrendingFixture(), pending = deferred()
    const old = { day: vi.fn((_selection: NativeCnyTrendingSelection, _signal?: AbortSignal) => pending.promise) }, next = { day: vi.fn(async () => value.day) }
    const { rerender } = render(<NativeCnyTrendingPanel gateway={old} selection={value.selection} />)
    const oldSignal = old.day.mock.calls[0]?.[1] as unknown as AbortSignal
    rerender(<NativeCnyTrendingPanel gateway={next} selection={value.selection} />)
    expect(oldSignal.aborted).toBe(true)
    await settle()
    await settle(() => pending.reject(new NativeCnyTrendingClientError('NOT_PUBLISHED')))
    expect(screen.getByText('合成 Trending 物品')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('a knownAt change is a real full-selection switch, not a mutation of an in-flight request', () => {
    const value = nativeTrendingFixture(), pending = deferred()
    const gateway = { day: vi.fn((_selection: NativeCnyTrendingSelection, _signal?: AbortSignal) => pending.promise) }
    const { rerender } = render(<NativeCnyTrendingPanel gateway={gateway} selection={value.selection} />)
    const oldSignal = gateway.day.mock.calls[0]?.[1] as unknown as AbortSignal
    rerender(<NativeCnyTrendingPanel gateway={gateway} selection={{ ...value.selection, knownAt: '2026-10-02T00:00:03Z' }} />)
    expect(oldSignal.aborted).toBe(true)
    expect(gateway.day).toHaveBeenCalledTimes(2)
    const first = gateway.day.mock.calls[0]?.[0] as unknown as NativeCnyTrendingSelection
    expect(first.knownAt).toBe('2026-10-02T00:00:02Z')
  })
})
