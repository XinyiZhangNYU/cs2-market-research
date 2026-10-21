// Presentation-only media binding for item identities.
//
// This is intentionally not part of the shared research-result wire. A result answers what the
// research system knows about an economic identity; an image URL is a catalog/media concern with
// different provenance, licensing and expiry rules. The product-facing adapter may join the two,
// but neither the page nor a mock fixture may invent a platform URL.

const BOUND_ITEM_IMAGE = Symbol('BOUND_ITEM_IMAGE')
const REGISTERED_BOUND_IMAGES = new WeakSet<object>()
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/
const MAX_IMAGE_URL_LENGTH = 8_192

// Keep the URL-free sentinel serializable: fixtures and HMR may recreate this exact shape.
export const ITEM_IMAGE_NOT_PRODUCED = Object.freeze({
  status: 'NOT_PRODUCED' as const,
})

export type NotProducedItemImage = typeof ITEM_IMAGE_NOT_PRODUCED

export type BoundItemImage = Readonly<{
  status: 'BOUND'
  src: string
  [BOUND_ITEM_IMAGE]: true
}>

export type ItemImageSource = NotProducedItemImage | BoundItemImage

export type ItemImageUrlPolicy = Readonly<{
  // Absolute CDN origins are opt-in. Keeping this list at the adapter boundary prevents a raw
  // MARKET_B/Steam URL from becoming a hotlink merely because it is syntactically valid HTTPS.
  allowedOrigins?: readonly string[]
}>

export class InvalidItemImageUrl extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidItemImageUrl'
  }
}

function isLoopback(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

function validatedAllowedOrigins(policy: ItemImageUrlPolicy): ReadonlySet<string> {
  const origins = new Set<string>()
  for (const rawOrigin of policy.allowedOrigins ?? []) {
    let parsed: URL
    try {
      parsed = new URL(rawOrigin)
    } catch {
      throw new InvalidItemImageUrl('invalid allowed image origin')
    }
    const secure = parsed.protocol === 'https:'
    const localDevelopment = parsed.protocol === 'http:' && isLoopback(parsed.hostname)
    if (
      (!secure && !localDevelopment) ||
      parsed.username !== '' ||
      parsed.password !== '' ||
      parsed.pathname !== '/' ||
      parsed.search !== '' ||
      parsed.hash !== ''
    ) {
      throw new InvalidItemImageUrl('allowed image origin must be a bare approved origin')
    }
    origins.add(parsed.origin)
  }
  return origins
}

function normalizedImageUrl(raw: string, policy: ItemImageUrlPolicy): string {
  if (
    typeof raw !== 'string' ||
    raw.length === 0 ||
    raw !== raw.trim() ||
    raw.length > MAX_IMAGE_URL_LENGTH ||
    CONTROL_CHARACTER.test(raw) ||
    raw.includes('\\')
  ) {
    throw new InvalidItemImageUrl('item image URL is empty, malformed or outside the size limit')
  }

  // A root-relative URL is the preferred production handoff: the deployment can put an object
  // store/CDN behind /media without exposing a provider URL to the research UI.
  if (raw.startsWith('/') && !raw.startsWith('//')) {
    const parsed = new URL(raw, 'https://same-origin.invalid')
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new InvalidItemImageUrl('item image URL must be root-relative or absolute')
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new InvalidItemImageUrl('item image URL must not contain credentials')
  }
  const secure = parsed.protocol === 'https:'
  const localDevelopment = parsed.protocol === 'http:' && isLoopback(parsed.hostname)
  if (!secure && !localDevelopment) {
    throw new InvalidItemImageUrl('item image URL must use HTTPS (HTTP is local-development only)')
  }
  if (!validatedAllowedOrigins(policy).has(parsed.origin)) {
    throw new InvalidItemImageUrl('item image origin is not approved')
  }
  return parsed.href
}

// The only constructor for a real image binding. Its brand and runtime registry make it difficult
// for an arbitrary object or decoded JSON blob to be passed straight to an <img> sink.
export function bindItemImageUrl(
  src: string,
  policy: ItemImageUrlPolicy = {},
): BoundItemImage {
  const bound = Object.freeze({
    status: 'BOUND' as const,
    src: normalizedImageUrl(src, policy),
    [BOUND_ITEM_IMAGE]: true as const,
  })
  REGISTERED_BOUND_IMAGES.add(bound)
  return bound
}

export function isNotProducedItemImage(source: unknown): source is NotProducedItemImage {
  return (
    typeof source === 'object' &&
    source !== null &&
    (source as { status?: unknown }).status === 'NOT_PRODUCED' &&
    Reflect.ownKeys(source).length === 1
  )
}

export function isBoundItemImage(source: unknown): source is BoundItemImage {
  return (
    typeof source === 'object' &&
    source !== null &&
    (source as { status?: unknown }).status === 'BOUND' &&
    REGISTERED_BOUND_IMAGES.has(source)
  )
}

export function assertItemImageSource(source: unknown): asserts source is ItemImageSource {
  if (isNotProducedItemImage(source) || isBoundItemImage(source)) return
  throw new TypeError('item image source must come from the media binding boundary')
}
