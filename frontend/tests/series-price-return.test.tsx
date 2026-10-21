import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PRICE_MEMORY_TTL_MS, type PriceRequest, type PriceTransportResponse } from '../src/api/PriceDisplayApi'
import { useSeriesPriceRows } from '../src/price/useSeriesPriceRows'
import type { PriceDocument } from '../src/wire/priceDisplayApiTypes'
import { catalogFixture, itemFixture, snapshotsFixture } from './support/priceWireFixtures'

const item = itemFixture()
const unitId = item.query.analysis_unit_id
const transport = (document: PriceDocument): PriceTransportResponse => ({ payload: document, etag: `"${document.document_hash}"`, httpStatus: 200 })
type Mode = 'OK' | 'ITEM_FAILS' | 'DISCOVERY_FAILS'

function testGateway() {
  const state = { mode: 'OK' as Mode }
  const read = vi.fn(async (request: PriceRequest) => {
    if (request.kind === 'PRICE_SNAPSHOT_LIST') {
      if (state.mode === 'DISCOVERY_FAILS') throw new Error('offline')
      return transport(snapshotsFixture())
    }
    if (state.mode === 'ITEM_FAILS') throw new Error('offline')
    return transport(itemFixture())
  })
  return { gateway: { kind: 'SYNTHETIC_TEST', read }, read, state }
}
type Gateway = ReturnType<typeof testGateway>['gateway']
const props = (gateway: Gateway, enabled = true) => ({
  gateway, catalog: catalogFixture, unitIds: [unitId], queryAsOf: snapshotsFixture().query.query_as_of, knownAt: item.query.known_at, enabled,
})
const mount = (gateway: Gateway) => renderHook((p: ReturnType<typeof props>) => useSeriesPriceRows(p), { initialProps: props(gateway) })
const status = (view: ReturnType<typeof mount>) => view.result.current.get(unitId)?.status
const flush = async () => { await act(async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }) }
const T0 = 20_000_000

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('series price rows on return (F-B)', () => {
  it('a remount after the price TTL shows the last READY rows at once and revalidates them', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const { gateway, read } = testGateway()
    const first = mount(gateway)
    expect(status(first)).toBe('LOADING')
    await waitFor(() => expect(status(first)).toBe('READY'))
    expect(read).toHaveBeenCalledTimes(2) // discovery + one item
    first.unmount() // series -> detail unmounts the series page
    vi.setSystemTime(T0 + PRICE_MEMORY_TTL_MS + 1)
    const second = mount(gateway)
    expect(status(second)).toBe('READY')
    await waitFor(() => expect(read).toHaveBeenCalledTimes(4))
    await flush()
    expect(status(second)).toBe('READY')
  })

  it('rows remembered a week ago are shown, unchanged, while their re-read hangs', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const { gateway, read } = testGateway()
    const first = mount(gateway)
    await waitFor(() => expect(status(first)).toBe('READY'))
    const rows = first.result.current.get(unitId)
    first.unmount()
    vi.setSystemTime(T0 + 7 * 86_400_000)
    read.mockImplementation(() => new Promise<PriceTransportResponse>(() => {}))
    const second = mount(gateway)
    expect(second.result.current.get(unitId)).toBe(rows)
    await flush()
    expect(second.result.current.get(unitId)).toBe(rows)
    expect(read).toHaveBeenCalledTimes(3) // discovery + item, then the hanging discovery
  })

  it('resuming a day later keeps the rows visible while they are read again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const { gateway, read } = testGateway()
    const view = mount(gateway)
    await waitFor(() => expect(status(view)).toBe('READY'))
    view.rerender(props(gateway, false))
    vi.setSystemTime(T0 + 86_400_000)
    view.rerender(props(gateway, true))
    expect(status(view)).toBe('READY')
    await waitFor(() => expect(read).toHaveBeenCalledTimes(4))
    await flush()
    expect(status(view)).toBe('READY')
  })

  it.each([
    ['the item read fails', 'ITEM_FAILS'],
    ['the publication cannot be discovered', 'DISCOVERY_FAILS'],
  ] as const)('when %s on revalidation the stale rows are replaced and forgotten', async (_label, mode) => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const { gateway, state } = testGateway()
    const first = mount(gateway)
    await waitFor(() => expect(status(first)).toBe('READY'))
    first.unmount()
    vi.setSystemTime(T0 + PRICE_MEMORY_TTL_MS + 1)
    state.mode = mode
    const second = mount(gateway)
    expect(status(second)).toBe('READY')
    await waitFor(() => expect(status(second)).toBe('UNAVAILABLE'))
    second.unmount()
    state.mode = 'OK'
    const third = mount(gateway)
    expect(status(third)).toBe('LOADING')
    await waitFor(() => expect(status(third)).toBe('READY'))
  })

  it('pausing keeps the shown rows; resuming keeps them visible while revalidating', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
    const { gateway, read } = testGateway()
    const view = mount(gateway)
    await waitFor(() => expect(status(view)).toBe('READY'))
    view.rerender(props(gateway, false))
    expect(status(view)).toBe('READY')
    vi.setSystemTime(T0 + PRICE_MEMORY_TTL_MS + 1)
    view.rerender(props(gateway, true))
    expect(status(view)).toBe('READY')
    await waitFor(() => expect(read).toHaveBeenCalledTimes(4))
    await flush()
    expect(status(view)).toBe('READY')
  })

  it('pausing aborts unsettled reads without inventing a result', async () => {
    const signals: AbortSignal[] = []
    const read = vi.fn((_request: PriceRequest, options?: { signal?: AbortSignal }) => {
      signals.push(options!.signal!); return new Promise<PriceTransportResponse>(() => {})
    })
    const gateway = { kind: 'SYNTHETIC_TEST', read }
    const view = mount(gateway)
    await waitFor(() => expect(read).toHaveBeenCalledTimes(1))
    view.rerender(props(gateway, false))
    await flush()
    expect(signals.every((signal) => signal.aborted)).toBe(true)
    expect(status(view)).toBe('LOADING')
  })

  it('rows remembered for one gateway are never shown for another', async () => {
    const one = testGateway(), two = testGateway()
    const first = mount(one.gateway)
    await waitFor(() => expect(status(first)).toBe('READY'))
    first.unmount()
    const other = mount(two.gateway)
    expect(status(other)).toBe('LOADING')
    await waitFor(() => expect(status(other)).toBe('READY'))
  })

  it('the same mounted rows never show another PIT scope or gateway, even on the first render (FA-06)', async () => {
    const one = testGateway(), two = testGateway()
    const laterKnownAt = '2099-01-01T00:00:00Z'
    // Every render is recorded, not only the cells after effects have run.
    const seen: Array<readonly [string, string | undefined]> = []
    const view = renderHook((p: ReturnType<typeof props>) => {
      const cells = useSeriesPriceRows(p)
      seen.push([`${p.gateway === one.gateway ? 'one' : 'two'}|${p.knownAt}`, cells.get(unitId)?.status])
      return cells
    }, { initialProps: props(one.gateway) })
    await waitFor(() => expect(view.result.current.get(unitId)?.status).toBe('READY'))
    const rows = view.result.current.get(unitId)
    one.read.mockImplementation(() => new Promise<PriceTransportResponse>(() => {}))
    two.read.mockImplementation(() => new Promise<PriceTransportResponse>(() => {}))
    let from = seen.length
    view.rerender({ ...props(one.gateway), knownAt: laterKnownAt })
    expect(seen.slice(from).length).toBeGreaterThan(0)
    expect(seen.slice(from).every(([id, cell]) => id === `one|${laterKnownAt}` && cell === 'LOADING')).toBe(true)
    from = seen.length
    view.rerender(props(two.gateway))
    expect(seen.slice(from).length).toBeGreaterThan(0)
    expect(seen.slice(from).every(([id, cell]) => id.startsWith('two|') && cell === 'LOADING')).toBe(true)
    // Back to the first identity: its remembered rows on the first render, then revalidated.
    from = seen.length
    view.rerender(props(one.gateway))
    expect(seen[from]).toEqual([`one|${item.query.known_at}`, 'READY'])
    expect(view.result.current.get(unitId)).toBe(rows)
  })
})
