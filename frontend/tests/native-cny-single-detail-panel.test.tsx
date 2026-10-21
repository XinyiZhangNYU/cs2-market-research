import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NativeCnySingleDetailPanel } from '../src/components/NativeCnySingleDetailPanel'
import type { NativeCnySingleDetailGateway } from '../src/adapter/nativeCnySingleViewModel'
import { HttpNativeCnySingleGateway, NativeCnySingleHttpError } from '../src/api/HttpNativeCnySingleGateway'
import { BoundedJsonFetchError } from '../src/api/boundedJsonFetch'
import type { NativeCnySingleBinding, NativeCnySingleDay } from '../src/wire/nativeCnySingleDecode'
import { deferred, pin, singleDocument, singleSelection } from './native-cny-single-view.fixtures'

beforeEach(() => {
  // Any unintended global transport fails locally; no business HTTP is possible in this suite.
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('global transport forbidden in synthetic tests') }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const panel = () => screen.getByTestId('native-cny-single-detail')
const stateIs = (state: string) => waitFor(() => expect(panel().getAttribute('data-single-state')).toBe(state))
function gateway(read: NativeCnySingleDetailGateway['read']): NativeCnySingleDetailGateway {
  return { kind: 'HTTP_NATIVE_CNY_SINGLE', read }
}
function queuedGateway() {
  const calls: Array<{ selection: NativeCnySingleBinding; signal: AbortSignal;
    pending: ReturnType<typeof deferred<NativeCnySingleDay>> }> = []
  return { calls, api: gateway((selection, { signal }) => {
    const pending = deferred<NativeCnySingleDay>()
    calls.push({ selection, signal, pending })
    return pending.promise // Intentionally ignores abort to exercise late-response protection.
  }) }
}

describe('opt-in native single DOM effects (author synthetic jsdom, not SSR)', () => {
  it('does not read without an explicit complete selection', () => {
    const read = vi.fn(async (selection: NativeCnySingleBinding) => singleDocument(selection))
    render(<NativeCnySingleDetailPanel gateway={gateway(read)} selection={null} />)
    expect(panel().getAttribute('data-single-state')).toBe('UNSELECTED')
    expect(read).not.toHaveBeenCalled()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
  for (const missing of ['itemId', 'publicationId', 'publicSha256', 'rightsSha256', 'reviewSha256', 'catalogPublicationId', 'day'] as const) {
    it(`refuses selection missing ${missing} before a request`, () => {
      const read = vi.fn(async (selection: NativeCnySingleBinding) => singleDocument(selection))
      const selection = { ...singleSelection(), [missing]: undefined } as unknown as NativeCnySingleBinding
      render(<NativeCnySingleDetailPanel gateway={gateway(read)} selection={selection} />)
      expect(panel().getAttribute('data-single-state')).toBe('INVALID_SELECTION')
      expect(read).not.toHaveBeenCalled()
    })
  }
  it('requires the explicit single gateway, never a fallback transport', async () => {
    const read = vi.fn(async (selection: NativeCnySingleBinding) => singleDocument(selection))
    const wrong = { kind: 'LEGACY', read } as unknown as NativeCnySingleDetailGateway
    render(<NativeCnySingleDetailPanel gateway={wrong} selection={singleSelection()} />)
    await stateIs('INVALID_GATEWAY')
    expect(read).not.toHaveBeenCalled()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
  it('actually loads through the fixed single HTTP gateway using only a local fetch substitute', async () => {
    const selection = singleSelection()
    const document = singleDocument(selection)
    const fixture = { ...document, data: { ...document.data,
      features: document.data.features.map((row) => ({ ...row, item_id: BigInt(row.item_id), qualified_baseline_days: BigInt(row.qualified_baseline_days) })),
      triggers: document.data.triggers.map((row) => ({ ...row, item_id: BigInt(row.item_id) })) } }
    const body = JSON.stringify(fixture, (_key, value: unknown) => typeof value === 'bigint' ? `~int:${value}` : value)
      .replace(/"~int:([0-9]+)"/gu, '$1')
    const fetcher = vi.fn<typeof fetch>(async () => new Response(body, { headers: { 'content-type': 'application/json' } }))
    render(<NativeCnySingleDetailPanel gateway={new HttpNativeCnySingleGateway({ fetcher })} selection={selection} />)
    await stateIs('READY')
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/native-cny/single/day?item=${selection.itemId}&publication=${selection.publicationId}`)
    expect(panel().textContent).toContain(selection.itemId)
    expect(panel().textContent).toContain('NO_RANK · stage=null')
    expect(panel().textContent).toContain('本详情未发布价格')
    expect(panel().textContent).toContain('fx_applied=false')
    expect(panel().textContent).toContain('HH55/X3')
    expect(panel().textContent).toContain('prospective_validation_credit=false')
    expect(panel().textContent).toContain(document.released_at)
    expect(panel().textContent).toContain(document.data.computed_at)
    for (const value of Object.values(selection)) expect(panel().textContent).toContain(value)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
  it('renders unknown/no-trigger, continuation and null label without inventing an entry or FALSE', async () => {
    render(<NativeCnySingleDetailPanel gateway={gateway(async () => singleDocument())} selection={singleSelection()} />)
    await stateIs('READY')
    const unknown = panel().querySelector('[data-family="COINCIDENT"]')!
    expect(unknown.textContent).toContain('signal=UNKNOWN')
    expect(unknown.textContent).toContain('disposition=UNKNOWN')
    expect(unknown.textContent).toContain('本族未发布触发；不等于信号为 FALSE')
    expect(within(unknown as HTMLElement).queryByText('触发 ID')).toBeNull()
    const continuation = panel().querySelector('[data-family="RECENT_PERSISTENT"]')!
    expect(continuation.textContent).toContain('disposition=CONTINUATION')
    expect(within(continuation as HTMLElement).queryByText('触发 ID')).toBeNull()
    expect(panel().textContent).toContain('未发布标签（null）')
    expect(panel().textContent).toContain('UNKNOWN_NO_ARCHIVE_IDENTITY')
    expect(panel().textContent).toContain('原始发布整日包')
  })
  it('renders archive origin, historical label and supplied qualification facts without changing knowledge mode', async () => {
    const original = singleDocument()
    const document: NativeCnySingleDay = { ...original, data: { ...original.data,
      daily_origin: 'ARCHIVE_RECONSTRUCTION', features: [{ ...original.data.features[0],
        current_qualified: false, recent_complete: false, reference_complete: true }],
      triggers: [{ ...original.data.triggers[0], public_label: '历史重建' }] } }
    render(<NativeCnySingleDetailPanel gateway={gateway(async () => document)} selection={singleSelection()} />)
    await stateIs('READY')
    expect(panel().textContent).toContain('ARCHIVE_RECONSTRUCTION')
    expect(panel().textContent).toContain('历史重建')
    expect(panel().textContent).toContain('false / false / true')
    expect(panel().textContent).toContain('RETROSPECTIVE_LATE_BOUND')
    expect(panel().textContent).toContain('prospective_validation_credit=false')
  })
  for (const [error, state] of [
    [new NativeCnySingleHttpError(400, 'INVALID_REQUEST'), 'INVALID_REQUEST'],
    [new NativeCnySingleHttpError(404, 'NOT_PUBLISHED'), 'NOT_PUBLISHED'],
    [new NativeCnySingleHttpError(503, 'TEMPORARILY_UNAVAILABLE'), 'TEMPORARILY_UNAVAILABLE'],
    [new BoundedJsonFetchError('REQUEST_TIMEOUT'), 'REQUEST_TIMEOUT'],
    [new Error('secret synthetic endpoint/body'), 'NETWORK_UNAVAILABLE'],
    [new DOMException('synthetic gateway cancelled', 'AbortError'), 'CANCELLED'],
  ] as const) {
    it(`renders fixed ${state} once without arbitrary body, retry or fallback`, async () => {
      const read = vi.fn(async () => { throw error })
      render(<NativeCnySingleDetailPanel gateway={gateway(read)} selection={singleSelection()} />)
      await stateIs(state)
      expect(panel().textContent).not.toContain('secret synthetic endpoint/body')
      expect(panel().textContent).not.toContain('所选单品详情已加载')
      expect(read).toHaveBeenCalledTimes(1)
      expect(globalThis.fetch).not.toHaveBeenCalled()
      if (state === 'NOT_PUBLISHED') expect(panel().textContent).toContain('不推断信号为 FALSE')
    })
  }
  it('refuses injected response pin drift before showing READY', async () => {
    const document = { ...singleDocument(), rights_sha256: pin('0') }
    render(<NativeCnySingleDetailPanel gateway={gateway(async () => document)} selection={singleSelection()} />)
    await stateIs('VALIDATION_ERROR')
    expect(panel().textContent).not.toContain('signal=TRUE')
  })
  for (const field of ['itemId', 'publicationId', 'publicSha256', 'rightsSha256', 'reviewSha256', 'catalogPublicationId', 'day'] as const) {
    it(`switching ${field} aborts and hides old READY detail immediately`, async () => {
      const queued = queuedGateway()
      const first = singleSelection()
      const next = { ...first, [field]: field === 'itemId' ? '9007199254740993' : field === 'day' ? '2026-10-02' : pin('0') }
      const rendered = render(<NativeCnySingleDetailPanel gateway={queued.api} selection={first} />)
      expect(queued.calls).toHaveLength(1)
      await act(async () => queued.calls[0].pending.resolve(singleDocument(first)))
      await stateIs('READY')
      rendered.rerender(<NativeCnySingleDetailPanel gateway={queued.api} selection={next} />)
      expect(panel().getAttribute('data-single-state')).toBe('LOADING')
      expect(panel().textContent).not.toContain('signal=TRUE')
      expect(queued.calls[0].signal.aborted).toBe(true)
      expect(queued.calls).toHaveLength(2)
      await act(async () => queued.calls[1].pending.resolve(singleDocument(next)))
      await stateIs('READY')
      expect(queued.calls[1].selection).toEqual(next)
      expect(panel().textContent).toContain(next[field])
    })
  }
  for (const field of ['itemId', 'publicationId', 'publicSha256', 'rightsSha256', 'reviewSha256', 'catalogPublicationId', 'day'] as const) {
    it(`pending old success cannot replace the result after switching ${field}`, async () => {
      const queued = queuedGateway()
      const first = singleSelection()
      const next = { ...first, [field]: field === 'itemId' ? '9007199254740993' : field === 'day' ? '2026-10-02' : pin('0') }
      const rendered = render(<NativeCnySingleDetailPanel gateway={queued.api} selection={first} />)
      rendered.rerender(<NativeCnySingleDetailPanel gateway={queued.api} selection={next} />)
      expect(queued.calls[0].signal.aborted).toBe(true)
      await act(async () => queued.calls[1].pending.resolve(singleDocument(next)))
      await stateIs('READY')
      const readyText = panel().textContent
      await act(async () => queued.calls[0].pending.resolve(singleDocument(first)))
      expect(panel().getAttribute('data-single-state')).toBe('READY')
      expect(panel().textContent).toBe(readyText)
      expect(queued.calls[1].selection[field]).toBe(next[field])
      expect(queued.calls).toHaveLength(2)
    })
  }
  it('an incomplete replacement hides READY data and does not request guessed pins', async () => {
    const queued = queuedGateway()
    const rendered = render(<NativeCnySingleDetailPanel gateway={queued.api} selection={singleSelection()} />)
    await act(async () => queued.calls[0].pending.resolve(singleDocument()))
    await stateIs('READY')
    rendered.rerender(<NativeCnySingleDetailPanel gateway={queued.api}
      selection={{ ...singleSelection(), publicationId: '' }} />)
    expect(panel().getAttribute('data-single-state')).toBe('INVALID_SELECTION')
    expect(panel().textContent).not.toContain('signal=TRUE')
    expect(queued.calls[0].signal.aborted).toBe(true)
    expect(queued.calls).toHaveLength(1)
  })
  it('ignores a genuinely pending success from A after B completes, including A→B→A', async () => {
    const queued = queuedGateway()
    const first = singleSelection('9007199254740993')
    const second = singleSelection('9007199254740992')
    const rendered = render(<NativeCnySingleDetailPanel gateway={queued.api} selection={first} />)
    rendered.rerender(<NativeCnySingleDetailPanel gateway={queued.api} selection={second} />)
    await act(async () => queued.calls[1].pending.resolve(singleDocument(second)))
    await stateIs('READY')
    await act(async () => queued.calls[0].pending.resolve(singleDocument(first)))
    expect(panel().textContent).toContain(second.itemId)
    expect(panel().textContent).not.toContain(first.itemId)
    rendered.rerender(<NativeCnySingleDetailPanel gateway={queued.api} selection={first} />)
    expect(panel().getAttribute('data-single-state')).toBe('LOADING')
    await act(async () => queued.calls[2].pending.resolve(singleDocument(first)))
    await stateIs('READY')
    expect(panel().textContent).toContain(first.itemId)
    expect(queued.calls).toHaveLength(3)
  })
  it('ignores a pending old rejection after B completes', async () => {
    const queued = queuedGateway()
    const first = singleSelection()
    const second = singleSelection('1')
    const rendered = render(<NativeCnySingleDetailPanel gateway={queued.api} selection={first} />)
    rendered.rerender(<NativeCnySingleDetailPanel gateway={queued.api} selection={second} />)
    await act(async () => queued.calls[1].pending.resolve(singleDocument(second)))
    await stateIs('READY')
    await act(async () => queued.calls[0].pending.reject(new Error('old response rejected')))
    expect(panel().getAttribute('data-single-state')).toBe('READY')
    expect(panel().textContent).not.toContain('old response rejected')
  })
  it('manual cancellation aborts and stays cancelled even if an abort-ignoring gateway resolves', async () => {
    const queued = queuedGateway()
    render(<NativeCnySingleDetailPanel gateway={queued.api} selection={singleSelection()} />)
    expect(panel().getAttribute('aria-busy')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '取消单品请求' }))
    expect(queued.calls[0].signal.aborted).toBe(true)
    expect(panel().getAttribute('data-single-state')).toBe('CANCELLED')
    await act(async () => queued.calls[0].pending.resolve(singleDocument()))
    expect(panel().getAttribute('data-single-state')).toBe('CANCELLED')
    expect(panel().getAttribute('aria-busy')).toBe('false')
    expect(queued.calls).toHaveLength(1)
  })
  it('unselection and unmount abort pending requests; no late content or new requests', async () => {
    const queued = queuedGateway()
    const rendered = render(<NativeCnySingleDetailPanel gateway={queued.api} selection={singleSelection()} />)
    rendered.rerender(<NativeCnySingleDetailPanel gateway={queued.api} selection={null} />)
    expect(queued.calls[0].signal.aborted).toBe(true)
    await act(async () => queued.calls[0].pending.resolve(singleDocument()))
    expect(panel().getAttribute('data-single-state')).toBe('UNSELECTED')
    expect(queued.calls).toHaveLength(1)
    rendered.rerender(<NativeCnySingleDetailPanel gateway={queued.api} selection={singleSelection()} />)
    rendered.unmount()
    expect(queued.calls[1].signal.aborted).toBe(true)
    await act(async () => queued.calls[1].pending.resolve(singleDocument()))
    expect(screen.queryByTestId('native-cny-single-detail')).toBeNull()
  })
  it('does not request again for newly allocated but value-equal full selection', async () => {
    const queued = queuedGateway()
    const selected = singleSelection()
    const rendered = render(<NativeCnySingleDetailPanel gateway={queued.api} selection={selected} />)
    expect(Object.isFrozen(queued.calls[0].selection)).toBe(true)
    rendered.rerender(<NativeCnySingleDetailPanel gateway={queued.api} selection={{ ...selected }} />)
    expect(queued.calls).toHaveLength(1)
    await act(async () => queued.calls[0].pending.resolve(singleDocument(selected)))
    await stateIs('READY')
  })
  it('replacing the explicit gateway cancels old work and hides its READY data', async () => {
    const old = queuedGateway()
    const next = queuedGateway()
    const selected = singleSelection()
    const rendered = render(<NativeCnySingleDetailPanel gateway={old.api} selection={selected} />)
    await act(async () => old.calls[0].pending.resolve(singleDocument(selected)))
    await stateIs('READY')
    rendered.rerender(<NativeCnySingleDetailPanel gateway={next.api} selection={selected} />)
    expect(old.calls[0].signal.aborted).toBe(true)
    expect(panel().getAttribute('data-single-state')).toBe('LOADING')
    await act(async () => next.calls[0].pending.resolve(singleDocument(selected)))
    await stateIs('READY')
  })
  it('React StrictMode cleanup suppresses the abandoned first effect response', async () => {
    const queued = queuedGateway()
    const selected = singleSelection()
    render(<StrictMode><NativeCnySingleDetailPanel gateway={queued.api} selection={selected} /></StrictMode>)
    expect(queued.calls).toHaveLength(2)
    expect(queued.calls[0].signal.aborted).toBe(true)
    await act(async () => queued.calls[0].pending.resolve(singleDocument(selected)))
    expect(panel().getAttribute('data-single-state')).toBe('LOADING')
    await act(async () => queued.calls[1].pending.resolve(singleDocument(selected)))
    await stateIs('READY')
  })
})
