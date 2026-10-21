import { useEffect, useRef, useState } from 'react'
import {
  assertItemImageSource,
  type ItemImageSource,
} from '../contract/itemImage'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'

export type ItemImageSlotVariant = 'thumbnail' | 'detail'
export type ItemImageRenderStatus = 'NOT_PRODUCED' | 'LOADING' | 'BOUND' | 'LOAD_FAILED'
export type ItemImageSlotPresentation = 'TECHNICAL' | 'PRODUCT'

export const ITEM_IMAGE_LOAD_TIMEOUT_MS = 12_000
export const ITEM_IMAGE_RETRY_DELAYS_MS = [1_000, 4_000, 15_000, 45_000] as const

function retryJitterMs(src: string, attempt: number): number {
  let hash = attempt + 1
  for (let index = 0; index < src.length; index += 1) {
    hash = (hash * 33 + src.charCodeAt(index)) >>> 0
  }
  return hash % 751
}

// Thumbnails share a small download budget so a long grid never bursts the media
// proxy, and their load timeout starts only once a slot is granted near the viewport.
export const ITEM_IMAGE_THUMBNAIL_CONCURRENCY = 6
type SlotEntry = { grant: () => void; state: 'WAITING' | 'ACTIVE' | 'DONE' }
const thumbnailSlots = { active: 0, queue: [] as SlotEntry[] }
function pumpThumbnailSlots() {
  while (thumbnailSlots.active < ITEM_IMAGE_THUMBNAIL_CONCURRENCY && thumbnailSlots.queue.length > 0) {
    const next = thumbnailSlots.queue.shift()!
    if (next.state !== 'WAITING') continue
    next.state = 'ACTIVE'
    thumbnailSlots.active += 1
    next.grant()
  }
}
function requestThumbnailSlot(grant: () => void): () => void {
  const entry: SlotEntry = { grant, state: 'WAITING' }
  thumbnailSlots.queue.push(entry)
  pumpThumbnailSlots()
  return () => {
    if (entry.state === 'ACTIVE') {
      thumbnailSlots.active -= 1
      entry.state = 'DONE'
      pumpThumbnailSlots()
    } else entry.state = 'DONE'
  }
}

export function itemImageRetryDelayMs(src: string, attempt: number): number {
  const base = ITEM_IMAGE_RETRY_DELAYS_MS[attempt]
  if (base === undefined) throw new RangeError('item image retry attempt is out of range')
  return base + retryJitterMs(src, attempt)
}

function PlaceholderGlyph() {
  return (
    <svg
      className="item-image-slot__glyph"
      viewBox="0 0 160 100"
      aria-hidden="true"
      focusable="false"
    >
      <path className="item-image-slot__bracket" d="M25 30V18h18M135 30V18h-18M25 70v12h18M135 70v12h-18" />
      <path className="item-image-slot__object" d="M48 61 65 42h43l12 13-14 10H58Z" />
      <circle className="item-image-slot__reticle" cx="80" cy="52" r="28" />
      <path className="item-image-slot__reticle" d="M80 15v14M80 75v10M43 52h14M103 52h14" />
    </svg>
  )
}

function statusText(status: ItemImageRenderStatus, lang: ReturnType<typeof useLang>): string {
  if (status === 'NOT_PRODUCED') return t('itemImageNotProduced', lang)
  if (status === 'LOADING') return t('itemImageLoading', lang)
  if (status === 'LOAD_FAILED') return t('itemImageLoadFailed', lang)
  return t('itemImageBound', lang)
}

export function ItemImageSlot({
  source,
  label,
  variant,
  testId,
  presentation = 'TECHNICAL',
  metadataPending = false,
}: {
  source: ItemImageSource
  label: string
  variant: ItemImageSlotVariant
  testId: string
  presentation?: ItemImageSlotPresentation
  /** A validated row exists, but its image binding has not arrived yet. */
  metadataPending?: boolean
}) {
  assertItemImageSource(source)
  if (label.trim().length === 0) throw new TypeError('ItemImageSlot requires a non-empty label')

  const lang = useLang()
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const boundSrc = !metadataPending && source.status === 'BOUND' ? source.src : null
  const figure = useRef<HTMLElement>(null)
  const releaseSlot = useRef<(() => void) | null>(null)
  // Environments without IntersectionObserver keep the original eager behaviour.
  const gated = variant === 'thumbnail' && typeof IntersectionObserver === 'function'
  const [near, setNear] = useState(!gated)
  const [grantedKey, setGrantedKey] = useState<string | null>(null)
  const slotKey = boundSrc === null ? null : `${boundSrc}|${attempt}`
  const ready = !gated || (slotKey !== null && grantedKey === slotKey)

  useEffect(() => {
    if (loadTimer.current !== null) clearTimeout(loadTimer.current)
    loadTimer.current = null
    if (retryTimer.current !== null) clearTimeout(retryTimer.current)
    retryTimer.current = null
    setAttempt(0)
    setLoadedSrc(null)
    setFailedSrc(null)
  }, [boundSrc])

  useEffect(() => () => {
    if (loadTimer.current !== null) clearTimeout(loadTimer.current)
    if (retryTimer.current !== null) clearTimeout(retryTimer.current)
  }, [])

  useEffect(() => {
    if (!gated || near) return
    const element = figure.current
    if (!element) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setNear(true)
        observer.disconnect()
      }
    }, { rootMargin: '400px 0px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [gated, near])

  useEffect(() => {
    if (!gated || !near || slotKey === null || loadedSrc === boundSrc || failedSrc === boundSrc) return
    const release = requestThumbnailSlot(() => setGrantedKey(slotKey))
    releaseSlot.current = release
    return () => {
      release()
      if (releaseSlot.current === release) releaseSlot.current = null
    }
  }, [boundSrc, failedSrc, gated, loadedSrc, near, slotKey])

  useEffect(() => {
    if (
      boundSrc === null ||
      loadedSrc === boundSrc ||
      failedSrc === boundSrc ||
      retryTimer.current !== null ||
      !ready
    ) return

    loadTimer.current = setTimeout(() => {
      loadTimer.current = null
      releaseSlot.current?.()
      setLoadedSrc(null)
      if (retryTimer.current !== null) return
      if (attempt >= ITEM_IMAGE_RETRY_DELAYS_MS.length) {
        setFailedSrc(boundSrc)
        return
      }
      retryTimer.current = setTimeout(() => {
        retryTimer.current = null
        setAttempt((current) => current + 1)
      }, itemImageRetryDelayMs(boundSrc, attempt))
    }, ITEM_IMAGE_LOAD_TIMEOUT_MS)

    return () => {
      if (loadTimer.current !== null) clearTimeout(loadTimer.current)
      loadTimer.current = null
    }
  }, [attempt, boundSrc, failedSrc, loadedSrc, ready])

  const renderStatus: ItemImageRenderStatus =
    metadataPending ? 'LOADING' : boundSrc === null
      ? 'NOT_PRODUCED'
      : failedSrc === boundSrc
        ? 'LOAD_FAILED'
        : loadedSrc === boundSrc
          ? 'BOUND'
          : 'LOADING'
  const text = statusText(renderStatus, lang)
  const showFallback = renderStatus !== 'BOUND'
  const showCaption = presentation === 'TECHNICAL' || renderStatus !== 'BOUND'

  return (
    <figure
      className={`item-image-slot item-image-slot--${variant} item-image-slot--${renderStatus.toLowerCase().replaceAll('_', '-')}`}
      data-testid={testId}
      data-image-source={source.status}
      data-image-status={renderStatus}
      data-image-presentation={presentation}
      data-image-attempt={boundSrc === null ? undefined : String(attempt)}
      aria-busy={renderStatus === 'LOADING'}
      ref={figure}
    >
      {boundSrc !== null && ready ? (
        <img
          key={`${boundSrc}:${attempt}`}
          className="item-image-slot__image"
          src={boundSrc}
          alt={label}
          loading={variant === 'thumbnail' ? 'lazy' : 'eager'}
          decoding="async"
          fetchPriority={variant === 'detail' ? 'high' : 'low'}
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={() => {
            releaseSlot.current?.()
            if (loadTimer.current !== null) clearTimeout(loadTimer.current)
            loadTimer.current = null
            if (retryTimer.current !== null) clearTimeout(retryTimer.current)
            retryTimer.current = null
            setFailedSrc(null)
            setLoadedSrc(boundSrc)
          }}
          onError={() => {
            releaseSlot.current?.()
            if (loadTimer.current !== null) clearTimeout(loadTimer.current)
            loadTimer.current = null
            setLoadedSrc(null)
            if (retryTimer.current !== null) return
            if (attempt >= ITEM_IMAGE_RETRY_DELAYS_MS.length) {
              setFailedSrc(boundSrc)
              return
            }
            retryTimer.current = setTimeout(() => {
              retryTimer.current = null
              setAttempt((current) => current + 1)
            }, itemImageRetryDelayMs(boundSrc, attempt))
          }}
        />
      ) : null}

      {showFallback ? (
        <div
          className="item-image-slot__fallback"
          role={boundSrc === null ? 'img' : undefined}
          aria-label={boundSrc === null ? `${label} · ${text}` : undefined}
          aria-hidden={boundSrc !== null ? 'true' : undefined}
        >
          <PlaceholderGlyph />
        </div>
      ) : null}

      {showCaption ? (
        <figcaption
          className="item-image-slot__status"
          aria-live={source.status === 'BOUND' ? 'polite' : undefined}
        >
          <span>{text}</span>
          {presentation === 'TECHNICAL' ? <code>{renderStatus}</code> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}
