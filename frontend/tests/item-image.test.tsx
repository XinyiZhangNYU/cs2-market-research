import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ITEM_IMAGE_LOAD_TIMEOUT_MS,
  ITEM_IMAGE_RETRY_DELAYS_MS,
  ItemImageSlot,
  itemImageRetryDelayMs,
} from '../src/components/ItemImageSlot'
import {
  bindItemImageUrl,
  InvalidItemImageUrl,
  isBoundItemImage,
  ITEM_IMAGE_NOT_PRODUCED,
  type ItemImageSource,
} from '../src/contract/itemImage'
import { LangProvider } from '../src/i18n'

function Slot({ source = ITEM_IMAGE_NOT_PRODUCED }: { source?: ItemImageSource }) {
  return (
    <LangProvider lang="zh">
      <ItemImageSlot
        source={source}
        label="合成标的 A"
        variant="thumbnail"
        testId="subject-image"
      />
    </LangProvider>
  )
}

afterEach(() => vi.useRealTimers())

describe('the not-produced item image is an honest UI state', () => {
  it('uses the local neutral glyph and creates no image request', () => {
    render(<Slot />)
    const slot = screen.getByTestId('subject-image')
    expect(slot).toHaveAttribute('data-image-source', 'NOT_PRODUCED')
    expect(slot).toHaveAttribute('data-image-status', 'NOT_PRODUCED')
    expect(slot).toHaveTextContent('图片未产出')
    expect(slot.querySelector('svg')).not.toBeNull()
    expect(slot.querySelector('img')).toBeNull()
    expect(screen.getByRole('img')).toHaveAccessibleName('合成标的 A · 图片未产出')
  })

  it('is a frozen singleton rather than a plausible mock URL', () => {
    expect(Object.isFrozen(ITEM_IMAGE_NOT_PRODUCED)).toBe(true)
    expect(Object.keys(ITEM_IMAGE_NOT_PRODUCED)).toEqual(['status'])
  })

  it('survives serialization or hot-module replacement without gaining a URL sink', () => {
    const restored = structuredClone(ITEM_IMAGE_NOT_PRODUCED) as ItemImageSource
    expect(restored).not.toBe(ITEM_IMAGE_NOT_PRODUCED)
    render(<Slot source={restored} />)
    expect(screen.getByTestId('subject-image')).toHaveAttribute(
      'data-image-status',
      'NOT_PRODUCED',
    )
    expect(screen.getByTestId('subject-image').querySelector('img')).toBeNull()
  })
})

describe('the URL boundary is ready for a managed media adapter', () => {
  it('accepts a same-origin media route without an origin exception', () => {
    const source = bindItemImageUrl('/media/items/sha256-example.webp?version=2')
    expect(source.src).toBe('/media/items/sha256-example.webp?version=2')
    expect(source.status).toBe('BOUND')
    expect(isBoundItemImage(source)).toBe(true)
    expect(Object.isFrozen(source)).toBe(true)
  })

  it('accepts an exact approved HTTPS CDN origin', () => {
    const source = bindItemImageUrl('https://media.example.test/items/asset.webp', {
      allowedOrigins: ['https://media.example.test'],
    })
    expect(source.src).toBe('https://media.example.test/items/asset.webp')
  })

  it.each([
    'https://unapproved.example.test/item.webp',
    'http://media.example.test/item.webp',
    '//media.example.test/item.webp',
    'data:image/svg+xml;base64,PHN2Zy8+',
    'blob:https://media.example.test/id',
    'javascript:alert(1)',
    'https://user:secret@media.example.test/item.webp',
    ' ../item.webp',
    '/media\\item.webp',
  ])('rejects an unmanaged or malformed URL: %s', (src) => {
    expect(() => bindItemImageUrl(src)).toThrow(InvalidItemImageUrl)
  })

  it('requires every absolute origin to be a bare approved origin', () => {
    expect(() =>
      bindItemImageUrl('https://media.example.test/item.webp', {
        allowedOrigins: ['https://media.example.test/not-an-origin'],
      }),
    ).toThrow(InvalidItemImageUrl)
  })

  it('refuses a structurally forged BOUND object at the render sink', () => {
    const forged = {
      status: 'BOUND',
      src: 'https://platform.example.test/raw.webp',
    } as ItemImageSource
    expect(() => render(<Slot source={forged} />)).toThrow(
      'item image source must come from the media binding boundary',
    )
  })

  it('refuses a forged NOT_PRODUCED object that smuggles a URL', () => {
    const forged = {
      status: 'NOT_PRODUCED',
      src: 'https://platform.example.test/raw.webp',
    } as unknown as ItemImageSource

    expect(() => render(<Slot source={forged} />)).toThrow(
      'item image source must come from the media binding boundary',
    )
  })
})

describe('a bound URL has stable loading and failure fallbacks', () => {
  it('moves from loading to bound only after the browser reports success', () => {
    const source = bindItemImageUrl('/media/items/ready.webp')
    render(<Slot source={source} />)
    const slot = screen.getByTestId('subject-image')
    const image = screen.getByRole('img', { name: '合成标的 A' })

    expect(slot).toHaveAttribute('data-image-status', 'LOADING')
    expect(slot).toHaveAttribute('aria-busy', 'true')
    expect(image).toHaveAttribute('src', '/media/items/ready.webp')
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer')

    fireEvent.load(image)
    expect(slot).toHaveAttribute('data-image-status', 'BOUND')
    expect(slot).toHaveAttribute('aria-busy', 'false')
    expect(slot).toHaveTextContent('图片已绑定')
    expect(slot.querySelector('.item-image-slot__fallback')).toBeNull()
  })

  it('keeps the slot loading while a bounded retry is pending', () => {
    const source = bindItemImageUrl('/media/items/missing.webp')
    render(<Slot source={source} />)
    const slot = screen.getByTestId('subject-image')
    fireEvent.error(screen.getByRole('img', { name: '合成标的 A' }))

    expect(slot).toHaveAttribute('data-image-status', 'LOADING')
    expect(slot).toHaveAttribute('data-image-attempt', '0')
    expect(slot.querySelector('.item-image-slot__fallback')).not.toBeNull()
  })

  it('restarts a stalled browser request and reaches an explicit terminal failure', () => {
    vi.useFakeTimers()
    const source = bindItemImageUrl('/media/items/stalled.webp')
    render(<Slot source={source} />)
    const slot = screen.getByTestId('subject-image')

    for (let attempt = 0; attempt < ITEM_IMAGE_RETRY_DELAYS_MS.length; attempt += 1) {
      act(() => vi.advanceTimersByTime(ITEM_IMAGE_LOAD_TIMEOUT_MS))
      expect(slot).toHaveAttribute('data-image-status', 'LOADING')
      expect(slot).toHaveAttribute('data-image-attempt', String(attempt))
      act(() => vi.advanceTimersByTime(itemImageRetryDelayMs(source.src, attempt)))
      expect(slot).toHaveAttribute('data-image-attempt', String(attempt + 1))
    }

    act(() => vi.advanceTimersByTime(ITEM_IMAGE_LOAD_TIMEOUT_MS))
    expect(slot).toHaveAttribute('data-image-status', 'LOAD_FAILED')
    expect(slot).toHaveTextContent('图片加载失败')
  })

  it('cancels the load watchdog after the browser reports success', () => {
    vi.useFakeTimers()
    const source = bindItemImageUrl('/media/items/ready-before-timeout.webp')
    render(<Slot source={source} />)
    fireEvent.load(screen.getByRole('img', { name: '合成标的 A' }))

    act(() => vi.advanceTimersByTime(
      ITEM_IMAGE_LOAD_TIMEOUT_MS * (ITEM_IMAGE_RETRY_DELAYS_MS.length + 2),
    ))
    expect(screen.getByTestId('subject-image')).toHaveAttribute('data-image-status', 'BOUND')
    expect(screen.getByTestId('subject-image')).toHaveAttribute('data-image-attempt', '0')
  })

  it('treats a replacement URL as a new load rather than inheriting old success', () => {
    const first = bindItemImageUrl('/media/items/first.webp')
    const second = bindItemImageUrl('/media/items/second.webp')
    const view = render(<Slot source={first} />)
    fireEvent.load(screen.getByRole('img', { name: '合成标的 A' }))
    expect(screen.getByTestId('subject-image')).toHaveAttribute('data-image-status', 'BOUND')

    view.rerender(<Slot source={second} />)
    expect(screen.getByTestId('subject-image')).toHaveAttribute('data-image-status', 'LOADING')
    expect(screen.getByRole('img', { name: '合成标的 A' })).toHaveAttribute(
      'src',
      '/media/items/second.webp',
    )
  })

  it('recovers all 32 concurrent slots after leaving and returning to the page', () => {
    const sources = Array.from({ length: 32 }, (_, index) =>
      bindItemImageUrl(`/media/items/concurrent-${index}.webp`))
    const Grid = () => (
      <LangProvider lang="zh">
        {sources.map((source, index) => (
          <ItemImageSlot
            key={source.src}
            source={source}
            label={`并发标的 ${index}`}
            variant="thumbnail"
            testId={`concurrent-image-${index}`}
          />
        ))}
      </LangProvider>
    )

    const firstVisit = render(<Grid />)
    expect(document.querySelectorAll('[data-image-status="LOADING"]')).toHaveLength(32)
    for (const image of Array.from(document.querySelectorAll('img'))) fireEvent.load(image)
    expect(document.querySelectorAll('[data-image-status="BOUND"]')).toHaveLength(32)

    firstVisit.unmount()
    render(<Grid />)
    expect(document.querySelectorAll('[data-image-status="LOADING"]')).toHaveLength(32)
    for (const image of Array.from(document.querySelectorAll('img'))) fireEvent.load(image)
    expect(document.querySelectorAll('[data-image-status="BOUND"]')).toHaveLength(32)
    expect(document.querySelectorAll('[data-image-status="LOAD_FAILED"]')).toHaveLength(0)
  })
})
