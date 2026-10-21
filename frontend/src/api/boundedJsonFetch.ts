import { isPublicResearchRequest, publicResearchQueue, ResearchQueueFullError, ResearchQueueTimeoutError, type ResearchRequestPriority } from '../performance/researchRequestQueue'

export const DEFAULT_MAX_JSON_RESPONSE_BYTES = 8 * 1024 * 1024

export type BoundedJsonFetchFailure =
  | 'NETWORK_UNAVAILABLE'
  | 'REQUEST_TIMEOUT'
  | 'INVALID_CONTENT_TYPE'
  | 'RESPONSE_TOO_LARGE'
  | 'INVALID_JSON_RESPONSE'

export class BoundedJsonFetchError extends Error {
  constructor(
    readonly code: BoundedJsonFetchFailure,
    readonly httpStatus: number | null = null,
  ) {
    super(`bounded JSON fetch failed: ${code}`)
    this.name = 'BoundedJsonFetchError'
  }
}

export type BoundedJsonFetchOptions = Readonly<{
  fetcher: typeof fetch
  init: RequestInit
  timeoutMs: number
  signal?: AbortSignal
  maxBytes?: number
  priority?: ResearchRequestPriority
  // Optional strict parser for a new wire. It runs under the same full deadline;
  // existing callers retain their original JSON/BOM behavior.
  parseJson?: (text: string) => unknown
}>

export type BoundedJsonResponse = Readonly<{
  ok: boolean
  status: number
  payload: unknown
}>

export function boundedJsonTimeout(value: number): number {
  if (!Number.isInteger(value) || value < 100 || value > 60_000) {
    throw new TypeError('JSON request timeout must be an integer from 100 to 60000 ms')
  }
  return value
}

function boundedByteLimit(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > DEFAULT_MAX_JSON_RESPONSE_BYTES) {
    throw new TypeError(
      `JSON response limit must be an integer from 1 to ${DEFAULT_MAX_JSON_RESPONSE_BYTES} bytes`,
    )
  }
  return value
}

function isExactJsonContentType(response: Response): boolean {
  const value = response.headers.get('content-type')
  if (value === null || value.includes(',')) return false
  const parts = value.split(';').map((part) => part.trim().toLowerCase())
  if (parts[0] !== 'application/json') return false
  return parts.length === 1 || (parts.length === 2 && parts[1] === 'charset=utf-8')
}

async function cancelResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel()
  } catch {
    // Validation failures retain their stable category even if an adversarial
    // stream rejects cancellation.
  }
}

async function readBoundedBody(
  response: Response,
  signal: AbortSignal,
  maxBytes: number,
): Promise<Uint8Array> {
  const declaredLength = response.headers.get('content-length')
  if (declaredLength !== null) {
    if (!/^(?:0|[1-9][0-9]*)$/u.test(declaredLength)) {
      await cancelResponseBody(response)
      throw new BoundedJsonFetchError('RESPONSE_TOO_LARGE', response.status)
    }
    const parsedLength = Number(declaredLength)
    if (!Number.isSafeInteger(parsedLength) || parsedLength > maxBytes) {
      await cancelResponseBody(response)
      throw new BoundedJsonFetchError('RESPONSE_TOO_LARGE', response.status)
    }
  }

  if (response.body === null) return new Uint8Array()
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  const abortReader = () => {
    void reader.cancel(signal.reason).catch(() => undefined)
  }
  signal.addEventListener('abort', abortReader, { once: true })
  try {
    while (true) {
      signal.throwIfAborted()
      const { done, value } = await reader.read()
      signal.throwIfAborted()
      if (done) break
      if (value === undefined || !ArrayBuffer.isView(value) || value.BYTES_PER_ELEMENT !== 1) {
        throw new BoundedJsonFetchError('INVALID_JSON_RESPONSE', response.status)
      }
      const chunk = new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
      total += chunk.byteLength
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined)
        throw new BoundedJsonFetchError('RESPONSE_TOO_LARGE', response.status)
      }
      chunks.push(chunk)
    }
  } finally {
    signal.removeEventListener('abort', abortReader)
    reader.releaseLock()
  }

  const body = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

/**
 * Fetch one JSON response under a single deadline covering headers, body,
 * UTF-8 decoding and JSON parsing. The payload deliberately remains unknown;
 * the existing wire decoders still own Schema and semantic validation.
 */
export async function boundedJsonFetch(
  input: RequestInfo | URL,
  options: BoundedJsonFetchOptions,
): Promise<BoundedJsonResponse> {
  // Validate bounds before queue admission. The existing network/body deadline
  // starts only when dispatched; caller cancellation applies while queued too.
  boundedJsonTimeout(options.timeoutMs)
  boundedByteLimit(options.maxBytes ?? DEFAULT_MAX_JSON_RESPONSE_BYTES)
  if (!isPublicResearchRequest(input)) return performBoundedJsonFetch(input, options)
  try {
    return await publicResearchQueue.run(
      () => performBoundedJsonFetch(input, options), options.signal, options.priority,
    )
  } catch (error) {
    if (error instanceof ResearchQueueFullError) throw new BoundedJsonFetchError('NETWORK_UNAVAILABLE')
    if (error instanceof ResearchQueueTimeoutError) throw new BoundedJsonFetchError('REQUEST_TIMEOUT')
    throw error
  }
}

async function performBoundedJsonFetch(
  input: RequestInfo | URL,
  options: BoundedJsonFetchOptions,
): Promise<BoundedJsonResponse> {
  const timeoutMs = boundedJsonTimeout(options.timeoutMs)
  const deadlineAt = Date.now() + timeoutMs
  const maxBytes = boundedByteLimit(
    options.maxBytes ?? DEFAULT_MAX_JSON_RESPONSE_BYTES,
  )
  const controller = new AbortController()
  let timedOut = false
  const abortFromCaller = () => controller.abort(options.signal?.reason)
  if (options.signal?.aborted) options.signal.throwIfAborted()
  options.signal?.addEventListener('abort', abortFromCaller, { once: true })
  const timeout = globalThis.setTimeout(() => {
    timedOut = true
    controller.abort(new DOMException('JSON response deadline exceeded', 'TimeoutError'))
  }, timeoutMs)
  const throwIfDeadlineExceeded = () => {
    if (timedOut || Date.now() >= deadlineAt) {
      timedOut = true
      controller.abort(new DOMException('JSON response deadline exceeded', 'TimeoutError'))
      throw new BoundedJsonFetchError('REQUEST_TIMEOUT')
    }
    controller.signal.throwIfAborted()
  }

  try {
    const response = await options.fetcher(input, {
      ...options.init,
      signal: controller.signal,
    })
    if (!isExactJsonContentType(response)) {
      await cancelResponseBody(response)
      throw new BoundedJsonFetchError('INVALID_CONTENT_TYPE', response.status)
    }
    throwIfDeadlineExceeded()
    const bytes = await readBoundedBody(response, controller.signal, maxBytes)
    throwIfDeadlineExceeded()
    let text: string
    try {
      text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: options.parseJson !== undefined }).decode(bytes)
    } catch {
      throw new BoundedJsonFetchError('INVALID_JSON_RESPONSE', response.status)
    }
    throwIfDeadlineExceeded()
    let payload: unknown
    try {
      payload = options.parseJson ? options.parseJson(text) : JSON.parse(text) as unknown
    } catch {
      throw new BoundedJsonFetchError('INVALID_JSON_RESPONSE', response.status)
    }
    throwIfDeadlineExceeded()
    return Object.freeze({ ok: response.ok, status: response.status, payload })
  } catch (error) {
    if (options.signal?.aborted) options.signal.throwIfAborted()
    if (timedOut) throw new BoundedJsonFetchError('REQUEST_TIMEOUT')
    if (error instanceof BoundedJsonFetchError) throw error
    throw new BoundedJsonFetchError('NETWORK_UNAVAILABLE')
  } finally {
    globalThis.clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}
