import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TRADEUP_RELEASE } from '../src/tradeup/tradeupRelease.mjs'
const bytes = readFileSync(resolve(import.meta.dirname, `../public${TRADEUP_RELEASE.url}`))
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function freshLoader() {
  vi.resetModules()
  return import('../src/tradeup/tradeupGraphLoader')
}
describe('bounded pinned trade-up graph reuse', () => {
  it('shares and freezes only verified bytes, then revalidates after 30 seconds', async () => {
    const { loadTradeUpGraph, TRADEUP_GRAPH_REUSE_MS } = await freshLoader()
    let now = 1000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const fetchMock = vi.fn(async () => new Response(bytes))
    vi.stubGlobal('fetch', fetchMock)
    const first = await loadTradeUpGraph(new AbortController().signal)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.skins[0].catalog.media)).toBe(true)
    expect(await loadTradeUpGraph(new AbortController().signal)).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    now += TRADEUP_GRAPH_REUSE_MS
    fetchMock.mockImplementation(async () => new Response('invalid'))
    await expect(loadTradeUpGraph(new AbortController().signal)).rejects.toThrow('SHA-256 mismatch')
    fetchMock.mockImplementation(async () => new Response(bytes))
    await expect(loadTradeUpGraph(new AbortController().signal)).resolves.toHaveProperty('skins.length', 188)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
  it('does not cancel the shared fetch when only one of two readers leaves', async () => {
    const { loadTradeUpGraph } = await freshLoader()
    let finish!: (response: Response) => void
    let fetchSignal!: AbortSignal
    vi.stubGlobal('fetch', vi.fn((_url, init) => {
      fetchSignal = init.signal
      return new Promise<Response>((resolveResponse) => { finish = resolveResponse })
    }))
    const first = new AbortController(), second = new AbortController()
    const a = loadTradeUpGraph(first.signal), b = loadTradeUpGraph(second.signal)
    const rejected = expect(a).rejects.toMatchObject({ name: 'AbortError' })
    await Promise.resolve()
    first.abort()
    expect(fetchSignal.aborted).toBe(false)
    finish(new Response(bytes))
    await rejected
    await expect(b).resolves.toHaveProperty('skins.length', 188)
  })
  it('aborts an unused fetch and permits a new read without caching the abandoned result', async () => {
    const { loadTradeUpGraph } = await freshLoader()
    let fetchSignal!: AbortSignal
    const fetchMock = vi.fn((_url, init) => {
      fetchSignal = init.signal
      return new Promise<Response>((_resolveResponse, reject) => fetchSignal.addEventListener('abort', () => reject(fetchSignal.reason)))
    })
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController(), result = loadTradeUpGraph(controller.signal)
    const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' })
    await Promise.resolve(); controller.abort(); await rejected
    expect(fetchSignal.aborted).toBe(true)
    fetchMock.mockImplementation(async () => new Response(bytes))
    await expect(loadTradeUpGraph(new AbortController().signal)).resolves.toHaveProperty('skins.length', 188)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it('does not retain HTTP failures or retry them automatically', async () => {
    const { loadTradeUpGraph } = await freshLoader()
    const fetchMock = vi.fn(async () => new Response('', { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(loadTradeUpGraph(new AbortController().signal)).rejects.toThrow('503')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    fetchMock.mockImplementation(async () => new Response(bytes))
    await expect(loadTradeUpGraph(new AbortController().signal)).resolves.toHaveProperty('skins.length', 188)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
