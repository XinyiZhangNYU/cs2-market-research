import type { Lang } from './index'

export const PUBLIC_LANGUAGE_STORAGE_KEY = 'cs2rotate.public.language.v1'
export const PUBLIC_LANGUAGE_ENDPOINT = '/api/v1/locale-default'

type LocationSearch = Pick<Location, 'search'>
type NavigatorLanguage = Pick<Navigator, 'language' | 'languages'>
type StorageReader = Pick<Storage, 'getItem' | 'setItem'>
type FetchLike = typeof fetch

function availableStorage(): StorageReader | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function isLang(value: unknown): value is Lang {
  return value === 'zh' || value === 'en'
}

export function explicitPublicLanguage(location: LocationSearch): Lang | null {
  const values = new URLSearchParams(location.search).getAll('lang')
  return values.length === 1 && isLang(values[0]) ? values[0] : null
}

export function storedPublicLanguage(storage: StorageReader | null): Lang | null {
  if (storage === null) return null
  try {
    const value = storage.getItem(PUBLIC_LANGUAGE_STORAGE_KEY)
    return isLang(value) ? value : null
  } catch {
    return null
  }
}

export function rememberPublicLanguagePreference(
  language: Lang,
  storage: StorageReader | null = availableStorage(),
): void {
  try {
    storage?.setItem(PUBLIC_LANGUAGE_STORAGE_KEY, language)
  } catch {
    // A denied/private storage API must not prevent the language switch itself.
  }
}

export function browserPublicLanguage(
  navigatorLike: NavigatorLanguage | null,
): Lang {
  if (navigatorLike === null) return 'en'
  const candidates = [
    ...(Array.isArray(navigatorLike.languages) ? navigatorLike.languages : []),
    navigatorLike.language,
  ]
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || candidate.trim() === '') continue
    return candidate.trim().toLowerCase().split(/[-_]/u, 1)[0] === 'zh' ? 'zh' : 'en'
  }
  return 'en'
}

async function edgePublicLanguage(fetcher: FetchLike, timeoutMs: number): Promise<Lang | null> {
  const controller = new AbortController()
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetcher(PUBLIC_LANGUAGE_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    })
    if (!response.ok) return null
    const declaredLength = response.headers.get('content-length')
    if (declaredLength !== null && (!/^\d{1,4}$/u.test(declaredLength) || Number(declaredLength) > 2_048)) {
      return null
    }
    const body = await response.text()
    if (new TextEncoder().encode(body).byteLength > 2_048) return null
    const document = JSON.parse(body) as unknown
    if (document === null || typeof document !== 'object' || Array.isArray(document)) return null
    const value = document as Record<string, unknown>
    if (
      value.api_contract !== 'public-locale-default' ||
      value.api_version !== 'v1' ||
      !isLang(value.language)
    ) return null
    return value.language
  } catch {
    return null
  } finally {
    globalThis.clearTimeout(timer)
  }
}

export async function resolveInitialPublicLanguage({
  location = globalThis.location,
  storage = availableStorage(),
  navigatorLike = globalThis.navigator ?? null,
  fetcher = globalThis.fetch,
  edgeTimeoutMs = 1_500,
}: {
  location?: LocationSearch
  storage?: StorageReader | null
  navigatorLike?: NavigatorLanguage | null
  fetcher?: FetchLike
  edgeTimeoutMs?: number
} = {}): Promise<Lang> {
  const explicit = explicitPublicLanguage(location)
  if (explicit !== null) return explicit
  const stored = storedPublicLanguage(storage)
  if (stored !== null) return stored
  const edge = await edgePublicLanguage(fetcher, edgeTimeoutMs)
  return edge ?? browserPublicLanguage(navigatorLike)
}
