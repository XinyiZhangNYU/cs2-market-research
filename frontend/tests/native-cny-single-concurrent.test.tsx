import { Suspense, startTransition, useState } from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NativeCnySingleDetailPanel } from '../src/components/NativeCnySingleDetailPanel'
import type { NativeCnySingleDetailGateway } from '../src/adapter/nativeCnySingleViewModel'
import type { NativeCnySingleBinding, NativeCnySingleDay } from '../src/wire/nativeCnySingleDecode'
import { deferred, singleDocument, singleSelection } from './native-cny-single-view.fixtures'

beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => { throw new Error('NETWORK_FORBIDDEN') })))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

for (const completion of ['success', 'failure'] as const) {
  it(`preserves committed A's ${completion} while speculative target B suspends and is abandoned`, async () => {
    const a = singleSelection('1'), b = singleSelection('2')
    const pending = deferred<NativeCnySingleDay>(), suspension = deferred<void>()
    const calls: Array<{ selection: NativeCnySingleBinding; signal: AbortSignal }> = []
    const gateway: NativeCnySingleDetailGateway = { kind: 'HTTP_NATIVE_CNY_SINGLE',
      read: (selection, { signal }) => { calls.push({ selection, signal }); return pending.promise } }
    let update!: (next: NativeCnySingleBinding) => void
    let speculativeRenders = 0
    function Gate({ selected }: { selected: NativeCnySingleBinding }) {
      if (selected.itemId === b.itemId) { speculativeRenders++; throw suspension.promise }
      return null
    }
    function Host() {
      const [selected, setSelected] = useState(a)
      update = setSelected
      return <Suspense fallback={<p>Uncommitted target</p>}>
        <NativeCnySingleDetailPanel gateway={gateway} selection={selected} /><Gate selected={selected} />
      </Suspense>
    }
    render(<Host />)
    await act(async () => { startTransition(() => update(b)); await Promise.resolve() })
    expect(speculativeRenders).toBeGreaterThan(0)
    expect(calls).toHaveLength(1)
    expect(calls[0].selection).toEqual(a)
    expect(calls[0].signal.aborted).toBe(false)
    await act(async () => {
      if (completion === 'success') pending.resolve(singleDocument(a))
      else pending.reject(new Error('Synthetic committed A failure'))
      await Promise.resolve()
    })
    await act(async () => { update(a); await Promise.resolve() })
    expect(calls).toHaveLength(1)
    expect(calls[0].signal.aborted).toBe(false)
    expect(screen.getByTestId('native-cny-single-detail').getAttribute('data-single-state'))
      .toBe(completion === 'success' ? 'READY' : 'NETWORK_UNAVAILABLE')
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
}
