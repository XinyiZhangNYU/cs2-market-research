import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useRetainedRead } from '../src/hooks/useRetainedRead'

describe('retained read cancellation and cache transitions', () => {
  it('restores ready A after pending B and ignores the cancelled B result', async () => {
    let finishB!: (value: string) => void
    let signalB!: AbortSignal
    const load = vi.fn((key: string, signal: AbortSignal) => {
      if (key === 'A') return Promise.resolve('value A')
      signalB = signal
      return new Promise<string>((resolve) => { finishB = resolve })
    })
    const hook = renderHook(({ key }) => useRetainedRead(true, key, (signal) => load(key, signal)), {
      initialProps: { key: 'A' },
    })
    await waitFor(() => expect(hook.result.current[0]).toEqual({ status: 'ready', value: 'value A' }))
    hook.rerender({ key: 'B' })
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    expect(hook.result.current[0]).toEqual({ status: 'loading', value: 'value A' })
    hook.rerender({ key: 'A' })
    await waitFor(() => expect(hook.result.current[0]).toEqual({ status: 'ready', value: 'value A' }))
    expect(signalB.aborted).toBe(true)
    await act(async () => finishB('late B'))
    expect(hook.result.current[0]).toEqual({ status: 'ready', value: 'value A' })
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('exposes synchronous failures and lets retry recover', async () => {
    const load = vi.fn<() => Promise<string>>()
      .mockImplementationOnce(() => { throw new Error('temporary') })
      .mockResolvedValueOnce('recovered')
    const hook = renderHook(() => useRetainedRead(true, 'A', load))
    await waitFor(() => expect(hook.result.current[0].status).toBe('error'))
    act(() => hook.result.current[1]())
    await waitFor(() => expect(hook.result.current[0]).toEqual({ status: 'ready', value: 'recovered' }))
    expect(load).toHaveBeenCalledTimes(2)
  })
})
