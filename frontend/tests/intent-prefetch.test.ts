import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createIntentPrefetchScheduler,
  permitsBackgroundPrefetch,
} from '../src/performance/intentPrefetch'

afterEach(() => vi.useRealTimers())

describe('intent prefetch scheduling', () => {
  it('does not start work while a pointer rapidly sweeps across entries', async () => {
    vi.useFakeTimers()
    const task = vi.fn(async () => undefined)
    const scheduler = createIntentPrefetchScheduler({ delayMs: 200, canRun: () => true })
    for (const key of ['knife', 'case', 'weapon', 'glove']) {
      scheduler.schedule(key, task)
      await vi.advanceTimersByTimeAsync(40)
      scheduler.cancel(key)
    }
    await vi.advanceTimersByTimeAsync(500)
    expect(task).not.toHaveBeenCalled()
    scheduler.dispose()
  })

  it('promotes an explicit touch or click intent and deduplicates it', async () => {
    vi.useFakeTimers()
    const task = vi.fn(async () => undefined)
    const scheduler = createIntentPrefetchScheduler({ delayMs: 200, canRun: () => true })
    scheduler.schedule('knife', task)
    scheduler.schedule('knife', task, true)
    scheduler.schedule('knife', task, true)
    await vi.runAllTimersAsync()
    expect(task).toHaveBeenCalledTimes(1)
    scheduler.dispose()
  })

  it('limits background work to two tasks at a time', async () => {
    const releases: (() => void)[] = []
    let active = 0
    let peak = 0
    const task = vi.fn(async () => {
      active += 1
      peak = Math.max(peak, active)
      await new Promise<void>((resolve) => releases.push(resolve))
      active -= 1
    })
    const scheduler = createIntentPrefetchScheduler({ maxConcurrent: 2, canRun: () => true })
    scheduler.schedule('one', task, true)
    scheduler.schedule('two', task, true)
    scheduler.schedule('three', task, true)
    await vi.waitFor(() => expect(task).toHaveBeenCalledTimes(2))
    releases.shift()?.()
    await vi.waitFor(() => expect(task).toHaveBeenCalledTimes(3))
    expect(peak).toBe(2)
    releases.splice(0).forEach((release) => release())
    scheduler.dispose()
  })

  it('disables background work for hidden, data-saver and 2G contexts', () => {
    expect(permitsBackgroundPrefetch('hidden', {})).toBe(false)
    expect(permitsBackgroundPrefetch('visible', { saveData: true })).toBe(false)
    expect(permitsBackgroundPrefetch('visible', { effectiveType: '2g' })).toBe(false)
    expect(permitsBackgroundPrefetch('visible', { effectiveType: '4g' })).toBe(true)
  })
})
