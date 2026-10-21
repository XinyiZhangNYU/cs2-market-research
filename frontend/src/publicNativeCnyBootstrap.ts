import type { NativeCnyPublicSelection } from './api/NativeCnyPublicSelection'
import type { NativeCnyIndexRequest } from './wire/nativeCnyIndexPublicApi'
import type { NativeCnyTrendingSelection } from './api/HttpNativeCnyTrendingGateway'
import { isModuleLoadFailure } from './performance/moduleLoadRecovery'

export const NATIVE_CNY_BOOTSTRAP_ID = 'cs2-native-cny-public'
const MAX_BOOTSTRAP_BYTES = 512 * 1024

export class NativeCnyPublicBootstrapError extends Error {
  constructor() { super('INVALID_NATIVE_CNY_PUBLIC_BOOTSTRAP'); this.name = 'NativeCnyPublicBootstrapError' }
}

/** The page host supplies exact external targets in one inert application/json script.
 * Absence is the existing rollback mode. A present invalid configuration stops
 * startup; null targets stay explicitly unselected. No discovery or HTTP here.
 * Native modules load only when the script exists, preserving the absent path. */
export async function resolveNativeCnyPublicBootstrap(
  document: Pick<Document, 'querySelectorAll'>,
  fetcher?: typeof fetch,
): Promise<NativeCnyPublicSelection | undefined> {
  const elements = document.querySelectorAll(`[id="${NATIVE_CNY_BOOTSTRAP_ID}"]`)
  if (elements.length === 0) return undefined
  try {
    if (elements.length !== 1) throw new Error()
    const element = elements[0]
    const text = element.textContent ?? ''
    if (element.tagName !== 'SCRIPT' || element.getAttribute('type') !== 'application/json' ||
        element.hasAttribute('src') || new TextEncoder().encode(text).byteLength > MAX_BOOTSTRAP_BYTES) throw new Error()
    const [{ parsePriceJson }, { snapshotNativeCnyIndexRequest },
      { snapshotNativeCnyTrendingSelection }, { HttpNativeCnyIndexPublicGateway },
      { HttpNativeCnyTrendingGateway }] = await Promise.all([
      import('./wire/priceDisplayJson'), import('./wire/nativeCnyIndexPublicApi'),
      import('./trending/nativeCnyTrendingViewModel'), import('./api/HttpNativeCnyIndexPublicGateway'),
      import('./api/HttpNativeCnyTrendingGateway'),
    ])
    const value = parsePriceJson(text)
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error()
    const config = value as Record<string, unknown>
    if (Object.keys(config).length !== 3 || config.schema !== 'native-cny-public-bootstrap/1' ||
        !Object.hasOwn(config, 'index') || !Object.hasOwn(config, 'trending')) throw new Error()
    if (config.trending !== null) {
      const fields = ['publicationId', 'publicSha256', 'rightsSha256', 'readinessReviewSha256',
        'candidateSha256', 'catalogPublicationId', 'startDate', 'endDate', 'knownAt']
      if (typeof config.trending !== 'object' || Array.isArray(config.trending) ||
          Object.keys(config.trending as object).length !== fields.length ||
          !fields.every(key => Object.hasOwn(config.trending as object, key))) throw new Error()
    }
    const request = config.index === null ? null : snapshotNativeCnyIndexRequest(config.index as NativeCnyIndexRequest)
    const selection = config.trending === null ? null : snapshotNativeCnyTrendingSelection(config.trending as NativeCnyTrendingSelection)
    return Object.freeze({
      index: Object.freeze({ gateway: new HttpNativeCnyIndexPublicGateway({ fetcher }), request }),
      trending: Object.freeze({ gateway: new HttpNativeCnyTrendingGateway(fetcher), selection }),
    })
  } catch (error) {
    if (isModuleLoadFailure(error)) throw error
    throw new NativeCnyPublicBootstrapError()
  }
}
