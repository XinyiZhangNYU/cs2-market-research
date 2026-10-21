import { useEffect, useState } from 'react'
const COMPACT_HOME_QUERY = '(max-width: 720px)'

/** Same breakpoint as HOME rendering; phones use bounded intent, not blanket idle warming. */
export const homeIdleEnabled = (home: boolean, pending: boolean, compact: boolean) => home && !pending && !compact

export function useCompactHome(): boolean {
  const query = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(COMPACT_HOME_QUERY) : null
  const [compact, setCompact] = useState(() => query?.matches ?? false)
  useEffect(() => {
    if (query === null) return undefined
    const update = () => setCompact(query.matches)
    update(); query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [query?.media]) // eslint-disable-line react-hooks/exhaustive-deps
  return compact
}
