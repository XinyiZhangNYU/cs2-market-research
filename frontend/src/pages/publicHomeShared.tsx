import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react'
import type { NativePublicationGeneration } from '../api/MarketSectorIndexPublicApi'
import { catalogMediaRoute } from '../adapter/catalogDisplayViewModel'
import { bindItemImageUrl, ITEM_IMAGE_NOT_PRODUCED, type ItemImageSource } from '../contract/itemImage'
import { useLang, type Lang } from '../i18n'
import { homeT, type PublicHomeStringKey } from './publicHomeCopy'
import { formatDecimalWithIntl } from '../price/exactDisplayDecimal'

export type Load<T> =
  | Readonly<{ status: 'LOADING' }>
  | Readonly<{ status: 'READY'; value: T }>
  | Readonly<{ status: 'UNAVAILABLE' }>

export function aborted(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (error instanceof DOMException && error.name === 'AbortError')
}

/** A settled READY module is not re-read when HOME is shown again within this window, counted
 * from that module's own settle time. After it the value is still shown while it is read again:
 * the window only sets how often a return re-checks (the data is published daily). */
export const HOME_RETURN_FRESH_MS = 30_000

/** Reads one module may start in one HOME activation: the first read and at most one follow of
 * a newly accepted native publication. Past it a module of an older publication is withdrawn. */
export const HOME_ACTIVATION_READS = 2

type Settled<T> = Readonly<{ deps: readonly unknown[]; at: number; load: Load<T> }>
type Shown<T> = Readonly<{ deps: readonly unknown[]; load: Load<T> }>
const HOME_LOADING: Load<never> = Object.freeze({ status: 'LOADING' })

/** Ties a module's READY value to the native publication its API has accepted. */
export type HomeGeneration<T> = Readonly<{ store: NativePublicationGeneration; of: (value: T) => string }>
const NO_GENERATION = (): string | null => null
const NO_SUBSCRIPTION = () => () => undefined

function sameDeps(left: readonly unknown[], right: readonly unknown[]): boolean {
  return left.length === right.length && left.every((value, index) => Object.is(value, right[index]))
}

/** One read per module: each module loads and fails on its own, never borrowing another's data.
 * A READY value for the same deps survives hide/show inside HOME_RETURN_FRESH_MS and no read
 * starts; it is shown again when those deps come back after a read for other deps was dropped.
 * After that window the READY value stays on screen, unmarked, while it is read again: a new
 * value replaces it, and a read that yields nothing or fails withdraws it to UNAVAILABLE. After
 * UNAVAILABLE, or for deps never READY, HOME shows LOADING and reads again.
 * Hiding aborts an unsettled read; the value it was revalidating stays remembered.
 * The shown value carries the deps it belongs to and is checked during render, so the first
 * render for new deps never returns another identity's value before the effect runs.
 * With a generation, every READY value also belongs to one native publication. Once the API
 * accepts another one (on HOME or MARKET), a value of the old one is never shown again: while the
 * activation still has a read left (HOME_ACTIVATION_READS) the module reads the accepted one,
 * otherwise it is withdrawn to UNAVAILABLE. A read that fails while the accepted publication
 * moved is followed the same way. */
export function useHomeLoad<T>(
  enabled: boolean,
  read: (signal: AbortSignal, publish: (value: T) => void) => Promise<T | null>,
  deps: readonly unknown[],
  generation: HomeGeneration<T> | null = null,
): Load<T> {
  const [shown, setShown] = useState<Shown<T>>(() => ({ deps, load: HOME_LOADING }))
  const settled = useRef<Settled<T> | null>(null)
  const store = generation?.store ?? null
  const of = useRef(generation?.of)
  of.current = generation?.of
  const accepted = useSyncExternalStore(store?.subscribe ?? NO_SUBSCRIPTION, store?.current ?? NO_GENERATION)
  const reading = useRef(false)
  // Reads started in this activation; a new activation (or new deps) starts again from zero.
  const reads = useRef(0)
  const [follow, setFollow] = useState(0)
  const belongs = (load: Load<T>, key: string | null): boolean => (
    load.status !== 'READY' || key === null || of.current === undefined || of.current(load.value) === key
  )
  useEffect(() => {
    if (enabled) reads.current = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])
  useEffect(() => {
    const setState = (load: Load<T>) => setShown({ deps, load })
    if (!enabled) return undefined
    const current = () => store?.current() ?? null
    const last = settled.current
    const kept = last !== null && last.load.status === 'READY' && sameDeps(last.deps, deps)
      && belongs(last.load, current()) ? last : null
    if (kept !== null) {
      const age = Date.now() - kept.at
      if (age >= 0 && age < HOME_RETURN_FRESH_MS) {
        // Unchanged after a plain hide/show; after A, B, A it replaces B's LOADING.
        setState(kept.load)
        return undefined
      }
    }
    // Past the window the kept value stays shown until this read settles.
    setState(kept?.load ?? HOME_LOADING)
    const controller = new AbortController()
    reading.current = true
    reads.current += 1
    const started = current()
    const finish = (result: Load<T>) => {
      reading.current = false
      let next = result
      const now = current()
      // Another surface accepted a newer publication while this read ran: its value is of the
      // old one, or it failed against a publication that has since moved.
      if (!belongs(next, now) || (next.status === 'UNAVAILABLE' && now !== started)) {
        if (reads.current < HOME_ACTIVATION_READS) {
          setState(HOME_LOADING)
          setFollow((count) => count + 1)
          return
        }
        next = { status: 'UNAVAILABLE' }
      }
      settled.current = { deps, at: Date.now(), load: next }
      setState(next)
    }
    // Intermediate rows are visible but never treated as a settled return cache.
    read(controller.signal, (value) => {
      const ready: Load<T> = { status: 'READY', value }
      if (!controller.signal.aborted && belongs(ready, current())) setState(ready)
    })
      .then((value) => {
        if (controller.signal.aborted) return
        finish(value === null ? { status: 'UNAVAILABLE' } : { status: 'READY', value })
      })
      .catch((error: unknown) => {
        if (aborted(error, controller.signal)) return
        finish({ status: 'UNAVAILABLE' })
      })
    return () => {
      reading.current = false
      controller.abort()
    }
    // The read closure is rebuilt each render; its inputs are the explicit deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, follow, ...deps])
  useEffect(() => {
    // A settled value of an older publication is read again; a read in flight checks on settle.
    if (!enabled || reading.current) return
    const last = settled.current
    if (last === null || !sameDeps(last.deps, deps) || belongs(last.load, accepted)) return
    if (reads.current < HOME_ACTIVATION_READS) {
      setFollow((count) => count + 1)
      return
    }
    // This activation's reads are spent: withdraw instead of reading again.
    const withdrawn: Load<T> = { status: 'UNAVAILABLE' }
    settled.current = { deps, at: Date.now(), load: withdrawn }
    setShown({ deps, load: withdrawn })
    // Runs when the accepted publication changes; the other inputs are read as they are then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accepted])
  // The deps changed and their effect has not run yet (or HOME is hidden): show what that effect
  // would show first, the READY value kept for these deps or LOADING, never the previous deps' value.
  const last = settled.current
  const visible = sameDeps(shown.deps, deps) ? shown.load
    : last !== null && last.load.status === 'READY' && sameDeps(last.deps, deps) ? last.load : HOME_LOADING
  // Never one frame of an older publication beside the accepted one.
  return belongs(visible, accepted) ? visible : HOME_LOADING
}

export function locale(lang: Lang): string {
  return lang === 'zh' ? 'zh-CN' : 'en-US'
}

export function formatDay(value: string | null | undefined, lang: Lang, withYear = false): string {
  if (!value) return '—'
  const parsed = new Date(value.includes('T') ? value : `${value}T12:00:00.000Z`)
  if (!Number.isFinite(parsed.getTime())) return value
  return new Intl.DateTimeFormat(locale(lang), {
    ...(withYear ? { year: 'numeric' } : {}),
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

/** Exact decimal strings (native CNY) are rounded once by Intl; numbers keep their path. */
export function formatSignedPercent(ratio: number | string | null, lang: Lang): string {
  if (ratio === null || !Number.isFinite(Number(ratio))) return '—'
  return formatDecimalWithIntl(new Intl.NumberFormat(locale(lang), {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }), ratio)
}

/** Colour/direction only; the text comes from formatSignedPercent. */
export function direction(ratio: number | string | null): 'up' | 'down' | 'flat' {
  const value = ratio === null ? Number.NaN : Number(ratio)
  if (!Number.isFinite(value) || Math.abs(value) < 0.0005) return 'flat'
  return value > 0 ? 'up' : 'down'
}

export function ModuleHead({
  titleId,
  title,
  meta,
  stale,
  href,
  onClick,
}: {
  titleId: string
  title: string
  meta: string | null
  stale: boolean
  href: string
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  return (
    <header className="public-home__module-head">
      <h2 id={titleId}>{title}</h2>
      <a href={href} onClick={onClick}>{homeT('viewAll', lang)} →</a>
      <p className="public-home__module-meta">
        <span>{meta ?? ' '}</span>
        {stale ? <em>{homeT('stale', lang)}</em> : null}
      </p>
    </header>
  )
}

export function ModuleMessage({
  status,
  loading,
  unavailable,
  empty,
  className = 'public-home__rows',
}: {
  status: 'LOADING' | 'UNAVAILABLE' | 'EMPTY'
  loading: PublicHomeStringKey
  unavailable: PublicHomeStringKey
  empty?: PublicHomeStringKey
  className?: string
}) {
  const lang = useLang()
  return (
    <div className={`${className} public-home__message`} role="status" data-state={status.toLowerCase()}>
      <p>{homeT(status === 'LOADING' ? loading : status === 'EMPTY' ? empty ?? unavailable : unavailable, lang)}</p>
      {status === 'UNAVAILABLE' ? <small>{homeT('retryHint', lang)}</small> : null}
    </div>
  )
}

export function itemImage(media: Readonly<{ status: string; media_key?: string }>, assetVersionId: string | null): ItemImageSource {
  if (media.status === 'NOT_PRODUCED' || media.media_key === undefined || assetVersionId === null) return ITEM_IMAGE_NOT_PRODUCED
  return bindItemImageUrl(catalogMediaRoute(media.media_key, assetVersionId))
}
