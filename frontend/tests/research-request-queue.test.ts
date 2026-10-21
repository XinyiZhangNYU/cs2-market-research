import { afterEach, describe, expect, it, vi } from 'vitest'
import { boundedJsonFetch } from '../src/api/boundedJsonFetch'
import { isPublicResearchRequest, publicResearchQueue, ResearchRequestQueue } from '../src/performance/researchRequestQueue'

const deferred = <T,>() => { let resolve!: (v: T) => void; const promise = new Promise<T>((r) => { resolve = r }); return { promise, resolve } }
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve() }
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('bounded public research admission', () => {
  it('limits concurrent work across jobs and holds a slot through completion', async () => {
    const queue = new ResearchRequestQueue(2), gates = Array.from({ length: 7 }, () => deferred<number>())
    const starts: number[] = []
    const reads = gates.map((gate, i) => queue.run(() => { starts.push(i); return gate.promise }))
    await flush(); expect(starts).toEqual([0, 1]); expect(queue.active).toBe(2)
    gates[0]!.resolve(0); await flush(); expect(starts).toEqual([0, 1, 2])
    for (let i = 1; i < gates.length; i++) { gates[i]!.resolve(i); await flush() }
    expect(await Promise.all(reads)).toEqual([0, 1, 2, 3, 4, 5, 6]); await flush()
    expect(queue.active).toBe(0); expect(queue.queued).toBe(0)
  })
  it('removes a cancelled queued job without starting it or retrying it', async () => {
    const queue = new ResearchRequestQueue(1), gate = deferred<number>(), abort = new AbortController(), start = vi.fn(async () => 2)
    const first = queue.run(() => gate.promise), second = queue.run(start, abort.signal)
    const rejected = expect(second).rejects.toMatchObject({ name: 'AbortError' })
    abort.abort(); await rejected; gate.resolve(1); await first; await flush()
    expect(start).not.toHaveBeenCalled(); expect(queue.queued).toBe(0)
  })
  it('foreground goes ahead of queued background, without killing active work', async () => {
    const queue = new ResearchRequestQueue(1), gate = deferred<number>(), starts: string[] = []
    const active = queue.run(() => gate.promise)
    const background = queue.run(async () => { starts.push('background'); return 1 }, undefined, 'BACKGROUND')
    const foreground = queue.run(async () => { starts.push('foreground'); return 1 })
    gate.resolve(1); await Promise.all([active, background, foreground])
    expect(starts).toEqual(['foreground', 'background'])
  })
  it('allows an aged background job through despite new foreground work', async () => {
    vi.useFakeTimers(); const queue = new ResearchRequestQueue(1), gate = deferred<number>(), starts: string[] = []
    const active = queue.run(() => gate.promise)
    const background = queue.run(async () => { starts.push('background'); return 1 }, undefined, 'BACKGROUND')
    await vi.advanceTimersByTimeAsync(5_001)
    const foreground = queue.run(async () => { starts.push('foreground'); return 1 })
    gate.resolve(1); await Promise.all([active, background, foreground])
    expect(starts).toEqual(['background', 'foreground'])
  })
  it('bounds queue length and waiting time independently from the body deadline', async () => {
    vi.useFakeTimers(); const queue = new ResearchRequestQueue(1, 1, 100), gate = deferred<number>(), start = vi.fn(async () => 2)
    const active = queue.run(() => gate.promise); await flush()
    const pending = queue.run(start), failure = expect(pending).rejects.toMatchObject({ name: 'ResearchQueueTimeoutError' })
    await expect(queue.run(start)).rejects.toMatchObject({ name: 'ResearchQueueFullError' })
    await vi.advanceTimersByTimeAsync(101); await failure
    expect(start).not.toHaveBeenCalled(); gate.resolve(1); await active; await flush()
    expect(queue.active).toBe(0); expect(queue.queued).toBe(0)
  })
  it.each([100, 101])('refuses expired queued work at %ims even before the timer callback runs', async (elapsed) => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const queue = new ResearchRequestQueue(1, 2, 100), gate = deferred<number>(), start = vi.fn(async () => 2)
    const active = queue.run(() => gate.promise); await flush()
    const pending = queue.run(start).catch((error: unknown) => error)
    // setSystemTime does not run timers: the completing active promise drains first.
    vi.setSystemTime(1_000 + elapsed); gate.resolve(1)
    const result = await pending; await active; await flush()
    expect(result).toMatchObject({ name: 'ResearchQueueTimeoutError' })
    expect(start).not.toHaveBeenCalled(); expect(queue.active).toBe(0); expect(queue.queued).toBe(0)
  })
  it('rechecks the admission deadline before the scheduled start microtask', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const queue = new ResearchRequestQueue(1, 2, 100), start = vi.fn(async () => 2)
    const pending = queue.run(start).catch((error: unknown) => error)
    // The free slot admits synchronously, but start has not executed yet.
    vi.setSystemTime(1_100)
    expect(await pending).toMatchObject({ name: 'ResearchQueueTimeoutError' }); await flush()
    expect(start).not.toHaveBeenCalled(); expect(queue.active).toBe(0); expect(queue.queued).toBe(0)
  })
  it('admits work before the exact deadline without treating a completed body as queue time', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const queue = new ResearchRequestQueue(1, 2, 100), gate = deferred<number>(), body = deferred<number>()
    const active = queue.run(() => gate.promise); await flush()
    const start = vi.fn(() => body.promise), pending = queue.run(start)
    vi.setSystemTime(1_099); gate.resolve(1); await active; await flush()
    expect(start).toHaveBeenCalledTimes(1)
    vi.setSystemTime(1_500); body.resolve(2)
    expect(await pending).toBe(2); await flush(); expect(queue.active).toBe(0)
  })
  it('does not extend a waiting lease when its wall clock moves backwards', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const queue = new ResearchRequestQueue(1, 2, 100), gate = deferred<number>(), start = vi.fn(async () => 2)
    const active = queue.run(() => gate.promise); await flush()
    const pending = queue.run(start).catch((error: unknown) => error)
    vi.setSystemTime(999); gate.resolve(1)
    expect(await pending).toMatchObject({ name: 'ResearchQueueTimeoutError' }); await active; await flush()
    expect(start).not.toHaveBeenCalled(); expect(queue.active).toBe(0); expect(queue.queued).toBe(0)
  })
  it('checks cancellation again before a scheduled start and frees its slot', async () => {
    const queue = new ResearchRequestQueue(1), abort = new AbortController(), start = vi.fn(async () => 2)
    const pending = queue.run(start, abort.signal).catch((error: unknown) => error)
    abort.abort()
    expect(await pending).toMatchObject({ name: 'AbortError' }); await flush()
    expect(start).not.toHaveBeenCalled(); expect(queue.active).toBe(0); expect(queue.queued).toBe(0)
  })
  it('drops expired work and still drains fresh work exactly once', async () => {
    vi.useFakeTimers(); vi.setSystemTime(1_000)
    const queue = new ResearchRequestQueue(1, 3, 100), gate = deferred<number>(), expiredStart = vi.fn(async () => 2)
    const active = queue.run(() => gate.promise); await flush()
    const expired = queue.run(expiredStart).catch((error: unknown) => error)
    vi.setSystemTime(1_100)
    const freshStart = vi.fn(async () => 3), fresh = queue.run(freshStart)
    gate.resolve(1)
    expect(await expired).toMatchObject({ name: 'ResearchQueueTimeoutError' }); expect(await fresh).toBe(3)
    await active; await flush()
    expect(expiredStart).not.toHaveBeenCalled(); expect(freshStart).toHaveBeenCalledTimes(1)
    expect(queue.active).toBe(0); expect(queue.queued).toBe(0)
  })
  it('holds the real HTTP slot after fast headers and cancels the stream on caller abort', async () => {
    const controllers = Array.from({ length: 5 }, () => new AbortController()), cancel = vi.fn()
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(new ReadableStream({ start() {}, cancel }), { headers: { 'Content-Type': 'application/json' } }))
    const reads = controllers.map((controller, i) => boundedJsonFetch(`/api/v3/market-index/public/scopes/test${i}/points`, {
      fetcher, init: { method: 'GET' }, signal: controller.signal, timeoutMs: 10_000,
    }).catch((error: unknown) => error))
    await flush(); expect(fetcher).toHaveBeenCalledTimes(4); expect(publicResearchQueue.queued).toBe(1)
    controllers[4]!.abort(); controllers.slice(0, 4).forEach((controller) => controller.abort())
    const errors = await Promise.all(reads); await flush()
    expect(errors.every((error: any) => error.name === 'AbortError')).toBe(true)
    expect(cancel).toHaveBeenCalledTimes(4); expect(fetcher).toHaveBeenCalledTimes(4)
    expect(publicResearchQueue.active).toBe(0); expect(publicResearchQueue.queued).toBe(0)
  })
  it('maps admission timeout to the existing request-timeout category, without fetching', async () => {
    vi.useFakeTimers()
    const controllers = Array.from({ length: 4 }, () => new AbortController())
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(new ReadableStream({ start() {}, cancel() {} }), { headers: { 'Content-Type': 'application/json' } }))
    const active = controllers.map((controller) => boundedJsonFetch('/api/v1/price-display/snapshots', { fetcher, init: {}, timeoutMs: 60_000, signal: controller.signal }).catch(() => null))
    await flush()
    const pending = boundedJsonFetch('/api/v1/item-monitor/history', { fetcher, init: {}, timeoutMs: 100 })
    const failure = expect(pending).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' })
    await vi.advanceTimersByTimeAsync(15_001); await failure
    expect(fetcher).toHaveBeenCalledTimes(4)
    controllers.forEach((controller) => controller.abort()); await Promise.all(active); await flush()
  })
  it.each([
    '/api/v3/market-index/public/scope-groups', '/api/v2/market-index/public/scopes/abc/points',
    '/api/v1/market-descriptive/public', '/api/v1/item-monitor/history', '/api/v1/item-monitor/current',
    '/api/v1/research-results/public/trending', '/api/v1/price-display/snapshots', '/api/v1/valve-events', '/api/v1/fx/current',
  ])('admits research-class route %s', (path) => expect(isPublicResearchRequest(path)).toBe(true))
  it.each([
    '/api/v1/catalog-display/snapshots', '/media/equipment/v1/foo', '/api/v1/steam-portfolio/inventory',
    'https://external.invalid/api/v1/item-monitor/current', '//external.invalid/api/v1/item-monitor/history',
    '/api/v1/research-results/publicity', '/api/v1/market-index/public/../../steam-portfolio/inventory',
  ])('does not admit other resource or foreign route %s', (path) => expect(isPublicResearchRequest(path)).toBe(false))
})
