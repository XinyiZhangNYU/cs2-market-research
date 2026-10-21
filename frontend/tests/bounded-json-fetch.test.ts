import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BoundedJsonFetchError,
  boundedJsonFetch,
} from '../src/api/boundedJsonFetch'

const INIT: RequestInit = {
  method: 'GET',
  headers: { Accept: 'application/json' },
}

function jsonResponse(body: BodyInit, headers: HeadersInit = {}): Response {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('boundedJsonFetch', () => {
  it('keeps the deadline active after fast headers until the body finishes', async () => {
    vi.useFakeTimers()
    const body = new ReadableStream<Uint8Array>({
      start() {},
      cancel() {},
    })
    const request = boundedJsonFetch('/slow-body', {
      fetcher: async () => jsonResponse(body),
      init: INIT,
      timeoutMs: 100,
    })
    const rejection = expect(request).rejects.toEqual(
      new BoundedJsonFetchError('REQUEST_TIMEOUT'),
    )
    await vi.advanceTimersByTimeAsync(101)
    await rejection
  })

  it('rejects limit plus one byte while streaming instead of parsing it', async () => {
    const bytes = new TextEncoder().encode('{"x":1}')
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.subarray(0, 3))
        controller.enqueue(bytes.subarray(3))
        controller.close()
      },
    })
    await expect(
      boundedJsonFetch('/oversized', {
        fetcher: async () => jsonResponse(body),
        init: INIT,
        timeoutMs: 1_000,
        maxBytes: bytes.byteLength - 1,
      }),
    ).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE', httpStatus: 200 })
  })

  it.each([
    ['text/javascript', 'callback({"ok":true})'],
    ['application/jsonp', '{"ok":true}'],
    ['application/json; charset=iso-8859-1', '{"ok":true}'],
    ['application/json, application/json', '{"ok":true}'],
  ])('rejects non-exact JSON content type %s', async (contentType, body) => {
    await expect(
      boundedJsonFetch('/wrong-content-type', {
        fetcher: async () =>
          new Response(body, {
            status: 200,
            headers: { 'Content-Type': contentType },
          }),
        init: INIT,
        timeoutMs: 1_000,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CONTENT_TYPE', httpStatus: 200 })
  })

  it('separates invalid UTF-8 and JSON from network failures', async () => {
    await expect(
      boundedJsonFetch('/invalid-utf8', {
        fetcher: async () => jsonResponse(new Uint8Array([0xff])),
        init: INIT,
        timeoutMs: 1_000,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_JSON_RESPONSE', httpStatus: 200 })

    await expect(
      boundedJsonFetch('/network', {
        fetcher: async () => {
          throw new Error('private upstream details')
        },
        init: INIT,
        timeoutMs: 1_000,
      }),
    ).rejects.toEqual(new BoundedJsonFetchError('NETWORK_UNAVAILABLE'))
  })

  it('checks the absolute deadline again after synchronous JSON parsing', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const originalParse = JSON.parse
    vi.spyOn(JSON, 'parse').mockImplementation((text: string) => {
      vi.setSystemTime(2_000)
      return originalParse(text) as unknown
    })

    await expect(
      boundedJsonFetch('/slow-parse', {
        fetcher: async () => jsonResponse('{"ok":true}'),
        init: INIT,
        timeoutMs: 1_000,
      }),
    ).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' })
  })

  it('propagates caller cancellation without converting it to a timeout', async () => {
    const fetcher = vi.fn<typeof fetch>(async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(init.signal?.reason),
          { once: true },
        )
      }),
    )
    const controller = new AbortController()
    const request = boundedJsonFetch('/cancelled', {
      fetcher,
      init: INIT,
      timeoutMs: 1_000,
      signal: controller.signal,
    })
    controller.abort(new DOMException('consumer left the page', 'AbortError'))

    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
    await expect(request).rejects.not.toBeInstanceOf(BoundedJsonFetchError)
  })

  it('returns only status metadata and the parsed unknown payload', async () => {
    await expect(
      boundedJsonFetch('/ok', {
        fetcher: async () => jsonResponse('{"ok":true}'),
        init: INIT,
        timeoutMs: 1_000,
      }),
    ).resolves.toEqual({ ok: true, status: 200, payload: { ok: true } })
  })
})
