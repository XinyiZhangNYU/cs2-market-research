import { useEffect, useRef, useState } from 'react'

export type RetainedRead<T> =
  | { status: 'idle' }
  | { status: 'loading'; value?: T }
  | { status: 'ready'; value: T }
  | { status: 'error'; error: unknown; value?: T }

/** Keep the last successful value during replacement; cancellation cannot win. */
export function useRetainedRead<T>(
  enabled: boolean,
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
): readonly [RetainedRead<T>, () => void] {
  const [attempt, setAttempt] = useState(0)
  const [read, setRead] = useState<RetainedRead<T>>({ status: 'idle' })
  const generation = useRef(0)
  const successful = useRef<{ key: string; value: T } | null>(null)
  useEffect(() => {
    const current = ++generation.current
    if (!enabled) return
    if (successful.current?.key === key) {
      // A → pending B → A must restore A's ready state, not retain B's loading.
      setRead({ status: 'ready', value: successful.current.value })
      return
    }
    const controller = new AbortController()
    setRead((previous) => 'value' in previous && previous.value !== undefined
      ? { status: 'loading', value: previous.value } : { status: 'loading' })
    Promise.resolve().then(() => load(controller.signal)).then(
      (value) => {
        if (!controller.signal.aborted && generation.current === current) {
          successful.current = { key, value }
          setRead({ status: 'ready', value })
        }
      },
      (error) => {
        if (controller.signal.aborted || generation.current !== current) return
        setRead((previous) => 'value' in previous && previous.value !== undefined
          ? { status: 'error', error, value: previous.value } : { status: 'error', error })
      },
    )
    return () => controller.abort()
    // A canonical request key owns the request; render-time closures do not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, enabled, key])
  return [read, () => {
    successful.current = null
    setAttempt((value) => value + 1)
  }] as const
}
