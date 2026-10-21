import { afterEach, describe, expect, it, vi } from 'vitest'
import { prepareHomeDirectory } from '../src/performance/homeDirectory'
import type { MarketSectorIndexPublicApi } from '../src/api/MarketSectorIndexPublicApi'
import type { MarketSectorIndexGroupDirectoryV3 } from '../src/wire/marketSectorIndexPublicApiV3Types'

afterEach(() => vi.useRealTimers())
describe('visible HOME directory preparation', () => {
  it('has no creation-time read, and hands a failed cold preparation to both consumers without retry', async () => {
    const read = vi.fn(() => Promise.reject(new Error('synthetic unavailable')))
    const api = { directoryV3Groups: read } as unknown as MarketSectorIndexPublicApi
    const prepared = prepareHomeDirectory(api)
    expect(read).not.toHaveBeenCalled()
    const release = prepared.start()
    await expect(prepared.read(new AbortController().signal)).rejects.toThrow('synthetic unavailable')
    await expect(prepared.read(new AbortController().signal)).rejects.toThrow('synthetic unavailable')
    expect(read).toHaveBeenCalledTimes(1)
    release()
    await expect(prepareHomeDirectory(api).read(new AbortController().signal)).rejects.toThrow()
    expect(read).toHaveBeenCalledTimes(2)
  })
  it('a cancelled subscriber does not cancel the parent; final departure does cancel', async () => {
    let transport!: AbortSignal
    const api = { directoryV3Groups: vi.fn((_id, options) => {
      transport = options.signal; return new Promise(() => {})
    }) } as unknown as MarketSectorIndexPublicApi
    const prepared = prepareHomeDirectory(api), release = prepared.start(), reader = new AbortController()
    const outcome = prepared.read(reader.signal).catch((error) => error)
    reader.abort(); await outcome
    await Promise.resolve()
    expect(transport.aborted).toBe(false)
    release(); await Promise.resolve()
    expect(transport.aborted).toBe(true)
  })
  it('effect replay reacquires synchronously and keeps one live preparation', async () => {
    let transport!: AbortSignal
    const read = vi.fn((_id, options) => { transport = options.signal; return new Promise(() => {}) })
    const prepared = prepareHomeDirectory({ directoryV3Groups: read } as unknown as MarketSectorIndexPublicApi)
    prepared.start()(); const release = prepared.start()
    await Promise.resolve(); expect(read).toHaveBeenCalledTimes(1); expect(transport.aborted).toBe(false)
    release(); await Promise.resolve(); expect(transport.aborted).toBe(true)
  })
  it('revalidates late success at the existing 30-second bound and rejects backward clocks', async () => {
    vi.useFakeTimers(); vi.setSystemTime(100_000)
    const directory = {} as MarketSectorIndexGroupDirectoryV3
    const read = vi.fn(() => Promise.resolve(directory))
    const fresh = vi.fn(() => Date.now() < 130_000)
    const prepared = prepareHomeDirectory({ directoryV3Groups: read, isActiveDirectoryFresh: fresh } as unknown as MarketSectorIndexPublicApi)
    const signal = new AbortController().signal
    expect(await prepared.read(signal)).toBe(directory)
    vi.setSystemTime(130_000); expect(await prepared.read(signal)).toBe(directory)
    expect(read).toHaveBeenCalledTimes(2)
    vi.setSystemTime(90_000); await expect(prepared.read(signal)).rejects.toThrow('backwards')
    expect(read).toHaveBeenCalledTimes(2)
  })
  it('does not reset the clock of a near-expiry cached directory at preparation handoff', async () => {
    const directory = {} as MarketSectorIndexGroupDirectoryV3
    const successor = {} as MarketSectorIndexGroupDirectoryV3
    const read = vi.fn().mockResolvedValueOnce(directory).mockResolvedValueOnce(successor)
    const prepared = prepareHomeDirectory({ directoryV3Groups: read, isActiveDirectoryFresh: () => false } as unknown as MarketSectorIndexPublicApi)
    prepared.start()
    expect(await prepared.read(new AbortController().signal)).toBe(successor)
    expect(read).toHaveBeenCalledTimes(2)
  })
})
