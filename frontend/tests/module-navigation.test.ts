import { afterEach, describe, expect, it, vi } from 'vitest'
import { createModuleNavigation } from '../src/performance/moduleNavigation'
const deferred = () => { let resolve!: () => void; const promise = new Promise<void>((r) => { resolve = r }); return { promise, resolve } }
afterEach(() => vi.useRealTimers())
describe('module navigation ordering and pending state', () => {
  it('exposes synchronous admission state before a React pending render', async () => {
    const navigation = createModuleNavigation(vi.fn()), gate = deferred(), apply = vi.fn()
    expect(navigation.pending).toBe(false)
    navigation.run(() => gate.promise, apply); expect(navigation.pending).toBe(true)
    gate.resolve(); await gate.promise
    expect(navigation.pending).toBe(false); expect(apply).toHaveBeenCalledTimes(1); navigation.dispose()
  })
  it('cancels without applying a route and invalidates late success and timeout', async () => {
    vi.useFakeTimers()
    const setPending = vi.fn(), navigation = createModuleNavigation(setPending, 100), gate = deferred(), apply = vi.fn()
    navigation.run(() => gate.promise, apply); navigation.cancel()
    expect(navigation.pending).toBe(false); expect(setPending).toHaveBeenLastCalledWith(false)
    await vi.advanceTimersByTimeAsync(101); gate.resolve(); await gate.promise
    expect(apply).not.toHaveBeenCalled(); navigation.dispose()
  })
  it('a fresh navigation after cancellation can still commit exactly once', async () => {
    const navigation = createModuleNavigation(vi.fn()), oldGate = deferred(), newGate = deferred(), old = vi.fn(), fresh = vi.fn()
    navigation.run(() => oldGate.promise, old); navigation.cancel(); navigation.run(() => newGate.promise, fresh)
    oldGate.resolve(); await oldGate.promise; expect(navigation.pending).toBe(true)
    newGate.resolve(); await newGate.promise
    expect(old).not.toHaveBeenCalled(); expect(fresh).toHaveBeenCalledTimes(1); expect(navigation.pending).toBe(false)
    navigation.dispose()
  })
  it('keeps prior content pending and commits only after the requested module resolves', async () => {
    const setPending = vi.fn(), apply = vi.fn(), gate = deferred(), navigation = createModuleNavigation(setPending)
    navigation.run(() => gate.promise, apply); expect(setPending).toHaveBeenLastCalledWith(true); expect(apply).not.toHaveBeenCalled()
    gate.resolve(); await gate.promise; expect(apply).toHaveBeenCalledTimes(1); expect(setPending).toHaveBeenLastCalledWith(false)
    navigation.dispose()
  })
  it('latest route wins even if previous imports finish out of order', async () => {
    const navigation = createModuleNavigation(vi.fn()), a = deferred(), b = deferred(), first = vi.fn(), second = vi.fn()
    navigation.run(() => a.promise, first); navigation.run(() => b.promise, second)
    b.resolve(); await b.promise; a.resolve(); await a.promise
    expect(first).not.toHaveBeenCalled(); expect(second).toHaveBeenCalledTimes(1); navigation.dispose()
  })
  it('same-module text/filter updates are urgent and supersede pending navigation', async () => {
    const setPending = vi.fn(), navigation = createModuleNavigation(setPending), gate = deferred(), old = vi.fn(), input = vi.fn()
    navigation.run(() => gate.promise, old); navigation.run(undefined, input)
    expect(input).toHaveBeenCalledTimes(1); expect(setPending).toHaveBeenLastCalledWith(false)
    gate.resolve(); await gate.promise; expect(old).not.toHaveBeenCalled(); navigation.dispose()
  })
  it('releases a hung module wait, but never commits history twice on late success', async () => {
    vi.useFakeTimers(); const setPending = vi.fn(), navigation = createModuleNavigation(setPending, 100), gate = deferred(), apply = vi.fn()
    navigation.run(() => gate.promise, apply); await vi.advanceTimersByTimeAsync(101)
    expect(apply).toHaveBeenCalledTimes(1); expect(setPending).toHaveBeenLastCalledWith(false)
    gate.resolve(); await gate.promise; expect(apply).toHaveBeenCalledTimes(1); navigation.dispose()
  })
  it('does not mutate a disposed page after late completion', async () => {
    const setPending = vi.fn(), navigation = createModuleNavigation(setPending), gate = deferred(), apply = vi.fn()
    navigation.run(() => gate.promise, apply); navigation.dispose(); setPending.mockClear()
    gate.resolve(); await gate.promise; expect(apply).not.toHaveBeenCalled(); expect(setPending).not.toHaveBeenCalled()
  })
  it('allows rejected imports to reach the ordinary route error boundary without retry', async () => {
    const load = vi.fn(async () => { throw new Error('module unavailable') }), apply = vi.fn(), navigation = createModuleNavigation(vi.fn())
    navigation.run(load, apply); await Promise.resolve(); await Promise.resolve()
    expect(apply).toHaveBeenCalledTimes(1); expect(load).toHaveBeenCalledTimes(1); navigation.dispose()
  })
})
