import { Component, Suspense, useState, type ReactNode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { preloadable } from '../src/performance/preloadable'
afterEach(cleanup)
function Counter() { const [n, set] = useState(0); return <button onClick={() => set(n + 1)}>count {n}</button> }
describe('resolved module rendering', () => {
  it('renders a preloaded module immediately without a warm lazy fallback', async () => {
    const load = vi.fn(async () => ({ default: Counter })), module = preloadable(load)
    await module.preload()
    render(<Suspense fallback={<p>module pending</p>}><module.Component /></Suspense>)
    expect(screen.getByRole('button')).toHaveTextContent('count 0'); expect(screen.queryByText('module pending')).toBeNull()
    expect(load).toHaveBeenCalledTimes(1)
  })
  it('deduplicates preload calls and preserves mounted state after a cold lazy load', async () => {
    let finish!: (value: { default: typeof Counter }) => void
    const load = vi.fn(() => new Promise<{ default: typeof Counter }>((resolve) => { finish = resolve })), module = preloadable(load)
    const view = render(<Suspense fallback={<p>module pending</p>}><module.Component /></Suspense>)
    expect(screen.getByText('module pending')).toBeInTheDocument()
    const first = module.preload(), second = module.preload(); expect(first).toBe(second)
    await act(async () => { finish({ default: Counter }); await first })
    fireEvent.click(screen.getByRole('button')); expect(screen.getByRole('button')).toHaveTextContent('count 1')
    view.rerender(<Suspense fallback={<p>module pending</p>}><module.Component /></Suspense>)
    expect(screen.getByRole('button')).toHaveTextContent('count 1'); expect(load).toHaveBeenCalledTimes(1)
  })
})
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <button onClick={() => this.setState({ failed: false })}>retry</button> : this.props.children }
}
const realWait = (ms: number) => act(() => new Promise<void>((resolve) => { setTimeout(resolve, ms) }))
describe('failed module imports are not remembered', () => {
  it('each later intent tries once more, and a mount after a successful intent renders at once', async () => {
    const load = vi.fn<() => Promise<{ default: typeof Counter }>>()
      .mockRejectedValueOnce(new Error('chunk')).mockRejectedValueOnce(new Error('chunk')).mockResolvedValue({ default: Counter })
    const module = preloadable(load)
    await expect(module.preload()).rejects.toThrow('chunk')
    await expect(module.preload()).rejects.toThrow('chunk')
    await module.preload()
    render(<Suspense fallback={<p>module pending</p>}><module.Component /></Suspense>)
    expect(screen.getByRole('button')).toHaveTextContent('count 0'); expect(load).toHaveBeenCalledTimes(3)
  })
  it('a mount after a failed intent waits for the newest attempt', async () => {
    let finish!: (value: { default: typeof Counter }) => void
    const load = vi.fn<() => Promise<{ default: typeof Counter }>>()
      .mockRejectedValueOnce(new Error('chunk')).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const module = preloadable(load)
    await expect(module.preload()).rejects.toThrow('chunk')
    const retry = module.preload()
    render(<Suspense fallback={<p>module pending</p>}><module.Component /></Suspense>)
    expect(screen.getByText('module pending')).toBeInTheDocument()
    await act(async () => { finish({ default: Counter }); await retry })
    expect(screen.getByRole('button')).toHaveTextContent('count 0'); expect(load).toHaveBeenCalledTimes(2)
  })
  it('an import that keeps failing reaches the error boundary after one attempt and never retries by itself', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      let online = false
      const load = vi.fn(async () => { if (!online) throw new Error('chunk'); return { default: Counter } })
      const module = preloadable(load)
      render(<Boundary><Suspense fallback={<p>module pending</p>}><module.Component /></Suspense></Boundary>)
      const retry = await screen.findByRole('button', { name: 'retry' })
      // Real time past React's fallback throttle: the failure stays settled, with no new import.
      await realWait(800)
      expect(load).toHaveBeenCalledTimes(1)
      // A boundary reset without an intent shows the failure again instead of importing.
      fireEvent.click(retry)
      expect(await screen.findByRole('button', { name: 'retry' })).toBeInTheDocument()
      await realWait(400)
      expect(load).toHaveBeenCalledTimes(1)
      // A navigation or prefetch intent tries once more; the next mount uses its result.
      online = true
      await act(async () => { await module.preload() })
      fireEvent.click(screen.getByRole('button', { name: 'retry' }))
      expect(screen.getByRole('button', { name: 'count 0' })).toBeInTheDocument()
      expect(load).toHaveBeenCalledTimes(2)
    } finally { quiet.mockRestore() }
  })
})
