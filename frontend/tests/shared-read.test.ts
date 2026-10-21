import { afterEach, describe, expect, it, vi } from 'vitest'
import { SharedRead } from '../src/performance/sharedRead'
const deferred = <T,>() => { let resolve!: (v: T) => void; const promise = new Promise<T>((r) => { resolve = r }); return { promise, resolve } }
afterEach(() => vi.useRealTimers())
describe('subscriber-safe short-lived reads', () => {
  it('freshness inspection keeps the original clock and rejects a different value/key', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const value = Object.freeze({ marker: 'one' }), foreign = structuredClone(value), cache = new SharedRead<typeof value>(2, 100)
    const load = vi.fn(async () => value)
    await cache.read('bound', load, () => true)
    vi.setSystemTime(1_099)
    expect(cache.hasFreshValue('bound', (entry) => entry === value)).toBe(true)
    expect(cache.hasFreshValue('foreign', () => true)).toBe(false)
    expect(cache.hasFreshValue('bound', (entry) => entry === foreign)).toBe(false)
    vi.setSystemTime(1_100)
    expect(cache.hasFreshValue('bound', () => true)).toBe(false)
    expect(load).toHaveBeenCalledTimes(1)
    await cache.read('bound', load, () => true)
    vi.setSystemTime(1_050)
    expect(cache.hasFreshValue('bound', () => true)).toBe(false)
    expect(load).toHaveBeenCalledTimes(2)
  })
  it('shares an in-flight read; one subscriber leaving does not abort the other', async () => {
    const cache = new SharedRead<number>(2, 100), gate = deferred<number>(), abort = new AbortController(); let signal!: AbortSignal
    const load = vi.fn((s: AbortSignal) => { signal = s; return gate.promise })
    const first = cache.read('x', load, () => true, abort.signal), second = cache.read('x', load, () => true)
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    await Promise.resolve(); abort.abort(); await rejected; expect(signal.aborted).toBe(false)
    gate.resolve(1); expect(await second).toBe(1); expect(load).toHaveBeenCalledTimes(1)
  })
  it('aborts when the last subscriber leaves; late completion cannot overwrite a new read', async () => {
    const cache = new SharedRead<number>(2, 100), gate = deferred<number>(), abort = new AbortController(); let signal!: AbortSignal
    const first = cache.read('x', (s) => { signal = s; return gate.promise }, () => true, abort.signal)
    const rejected = expect(first).rejects.toThrow(); await Promise.resolve(); abort.abort(); await rejected
    expect(signal.aborted).toBe(true); expect(await cache.read('x', async () => 2, () => true)).toBe(2)
    gate.resolve(1); await Promise.resolve(); await Promise.resolve()
    expect(await cache.read('x', async () => 3, () => true)).toBe(2)
  })
  it('expires successful values, rejects backward-clock reuse and evicts to its bound', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const cache = new SharedRead<number>(2, 100), load = vi.fn(async () => 1)
    await cache.read('a', load, () => true); await cache.read('a', load, () => true); expect(load).toHaveBeenCalledTimes(1)
    vi.setSystemTime(1_100); await cache.read('a', load, () => true); expect(load).toHaveBeenCalledTimes(2)
    vi.setSystemTime(1_050); await cache.read('a', load, () => true); expect(load).toHaveBeenCalledTimes(3)
    await cache.read('b', load, () => true); await cache.read('c', load, () => true)
    await cache.read('a', load, () => true); expect(load).toHaveBeenCalledTimes(6)
  })
  it('does not retain rejected or ineligible answers', async () => {
    const cache = new SharedRead<number>(2, 100), bad = vi.fn(async () => { throw new Error('failure') }), ineligible = vi.fn(async () => 0)
    await expect(cache.read('x', bad, () => true)).rejects.toThrow(); await expect(cache.read('x', bad, () => true)).rejects.toThrow()
    expect(bad).toHaveBeenCalledTimes(2)
    await cache.read('x', ineligible, () => false); await cache.read('x', ineligible, () => false); expect(ineligible).toHaveBeenCalledTimes(2)
  })
  it('never starts an already cancelled read', async () => {
    const cache = new SharedRead<number>(2, 100), abort = new AbortController(), load = vi.fn(async () => 1); abort.abort()
    expect(() => cache.read('x', load, () => true, abort.signal)).toThrow(); expect(load).not.toHaveBeenCalled()
  })
  it('keeps a loaded value before announcing it, so a listener that drops every subscriber cannot lose it', async () => {
    const cache = new SharedRead<number>(2, 100), abort = new AbortController(), load = vi.fn(async () => 1)
    const announced: number[] = []
    const first = cache.read('x', load, () => true, abort.signal, (value) => { announced.push(value); abort.abort() })
    await expect(first).rejects.toThrow()
    expect(announced).toEqual([1])
    expect(cache.hasFreshValue('x', (value) => value === 1)).toBe(true)
    expect(await cache.read('x', load, () => true)).toBe(1); expect(load).toHaveBeenCalledTimes(1)
  })
  it('never announces a load whose last subscriber left before it completed', async () => {
    const cache = new SharedRead<number>(2, 100), abort = new AbortController(), gate = deferred<number>(), loaded = vi.fn()
    const first = cache.read('x', () => gate.promise, () => true, abort.signal, loaded)
    await Promise.resolve(); abort.abort(); await expect(first).rejects.toThrow()
    gate.resolve(1); await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
    expect(loaded).not.toHaveBeenCalled(); expect(cache.hasFreshValue('x', () => true)).toBe(false)
  })
  it('bounds distinct in-flight keys without evicting active subscribers', async () => {
    const cache = new SharedRead<number>(1, 100), gate = deferred<number>(), load = vi.fn(async () => 2)
    const first = cache.read('a', () => gate.promise, () => true)
    await expect(cache.read('b', load, () => true)).rejects.toThrow('capacity')
    expect(load).not.toHaveBeenCalled(); gate.resolve(1); expect(await first).toBe(1)
    expect(await cache.read('b', load, () => true)).toBe(2)
  })
})
