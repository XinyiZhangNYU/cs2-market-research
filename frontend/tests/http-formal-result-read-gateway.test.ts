import { describe, expect, it, vi } from 'vitest'
import {
  HttpFormalResultReadGateway,
  ResultGatewayTransportError,
} from '../src/api/HttpFormalResultReadGateway'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('HttpFormalResultReadGateway', () => {
  it('maps all current formal operations to deterministic same-origin GET routes', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse({ ok: true }))
    const gateway = new HttpFormalResultReadGateway({ fetcher })

    await gateway.read({
      operation: 'UNIT_DETAIL',
      analysis_unit_id: 'item:one/two',
      as_of: '2026-08-24T08:00:00.000000Z',
    })
    await gateway.read({
      operation: 'COLLECTION_DETAIL',
      collection_id: 'sector:rifles',
      as_of: '2026-08-24T08:00:01.000000Z',
    })
    await gateway.read({
      operation: 'QUALITY_DETAIL',
      analysis_unit_id: 'item:quality',
      as_of: '2026-08-24T08:00:02.000000Z',
    })
    await gateway.read({
      operation: 'QUALITY_LIST',
      query: {
        as_of: '2026-08-24T08:00:02.500000Z',
        analysis_unit_kind: 'STYLE_VARIANT',
        edition_kind: 'STANDARD',
        parent_analysis_unit_id: 'item:parent',
        sort: 'ANALYSIS_UNIT_ID_ASC',
        page_size: 25,
      },
      cursor: 'quality cursor',
    })
    await gateway.read({
      operation: 'UNIT_LIST',
      query: {
        as_of: '2026-08-24T08:00:03.000000Z',
        scope_kind: 'ITEM',
        analysis_unit_kind: 'STYLE_VARIANT',
        edition_kind: 'STATTRAK',
        parent_analysis_unit_id: 'item:parent',
        data_status: 'COMPLETE',
        sort: 'ANALYSIS_UNIT_ID_ASC',
        page_size: 50,
      },
      cursor: 'opaque cursor',
    })

    const urls = fetcher.mock.calls.map(([url]) => String(url))
    expect(urls).toEqual([
      '/api/v1/research-results/units/item%3Aone%2Ftwo?as_of=2026-08-24T08%3A00%3A00.000000Z',
      '/api/v1/research-results/collections/sector%3Arifles?as_of=2026-08-24T08%3A00%3A01.000000Z',
      '/api/v1/research-results/quality/item%3Aquality?as_of=2026-08-24T08%3A00%3A02.000000Z',
      '/api/v1/research-results/quality?as_of=2026-08-24T08%3A00%3A02.500000Z&analysis_unit_kind=STYLE_VARIANT&edition_kind=STANDARD&parent_analysis_unit_id=item%3Aparent&sort=ANALYSIS_UNIT_ID_ASC&page_size=25&cursor=quality+cursor',
      '/api/v1/research-results/units?as_of=2026-08-24T08%3A00%3A03.000000Z&scope_kind=ITEM&analysis_unit_kind=STYLE_VARIANT&edition_kind=STATTRAK&parent_analysis_unit_id=item%3Aparent&data_status=COMPLETE&sort=ANALYSIS_UNIT_ID_ASC&page_size=50&cursor=opaque+cursor',
    ])
    for (const [, init] of fetcher.mock.calls) {
      expect(init).toMatchObject({
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
        referrerPolicy: 'no-referrer',
      })
      expect(init?.headers).toEqual({ Accept: 'application/json' })
      expect(init?.signal).toBeInstanceOf(AbortSignal)
    }
  })

  it('omits null list filters rather than inventing transport values', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse({ ok: true }))
    const gateway = new HttpFormalResultReadGateway({
      baseUrl: 'http://127.0.0.1:8765/api/v1/research-results/',
      fetcher,
    })

    await gateway.read({
      operation: 'UNIT_LIST',
      query: {
        as_of: '2026-08-24T08:00:00.000000Z',
        scope_kind: null,
        analysis_unit_kind: null,
        edition_kind: null,
        parent_analysis_unit_id: null,
        data_status: null,
        sort: 'ANALYSIS_UNIT_ID_ASC',
        page_size: 200,
      },
      cursor: null,
    })

    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'http://127.0.0.1:8765/api/v1/research-results/units?as_of=2026-08-24T08%3A00%3A00.000000Z&sort=ANALYSIS_UNIT_ID_ASC&page_size=200',
    )
  })

  it('returns a controlled non-2xx API error for the formal decoder', async () => {
    const controlled = {
      api_contract: 'result-read-api',
      api_version: 'v1',
      response_kind: 'ERROR',
      error: { code: 'NOT_FOUND', http_status: 404, retryable: false },
    }
    const gateway = new HttpFormalResultReadGateway({
      fetcher: async () => jsonResponse(controlled, 404),
    })

    await expect(
      gateway.read({
        operation: 'QUALITY_DETAIL',
        analysis_unit_id: 'missing',
        as_of: '2026-08-24T08:00:00.000000Z',
      }),
    ).resolves.toEqual(controlled)
  })

  it('fails closed when HTTP status and controlled error body disagree', async () => {
    const gateway = new HttpFormalResultReadGateway({
      fetcher: async () =>
        jsonResponse(
          {
            api_contract: 'result-read-api',
            api_version: 'v1',
            response_kind: 'ERROR',
            error: { code: 'BACKEND_UNAVAILABLE', http_status: 503, retryable: true },
          },
          404,
        ),
    })

    await expect(
      gateway.read({
        operation: 'UNIT_DETAIL',
        analysis_unit_id: 'item:1',
        as_of: '2026-08-24T08:00:00.000000Z',
      }),
    ).rejects.toMatchObject({
      code: 'HTTP_STATUS_MISMATCH',
      retryable: false,
      httpStatus: 404,
    })
  })

  it('uses sanitized fail-closed errors for invalid JSON and network failures', async () => {
    const invalidJson = new HttpFormalResultReadGateway({
      fetcher: async () => new Response('<html>not json</html>', {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    })
    await expect(
      invalidJson.read({
        operation: 'UNIT_DETAIL',
        analysis_unit_id: 'item:1',
        as_of: '2026-08-24T08:00:00.000000Z',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_JSON_RESPONSE',
      retryable: true,
      httpStatus: 503,
    })

    const network = new HttpFormalResultReadGateway({
      fetcher: async () => {
        throw new Error('secret host and response body must not escape')
      },
    })
    await expect(
      network.read({
        operation: 'UNIT_DETAIL',
        analysis_unit_id: 'item:1',
        as_of: '2026-08-24T08:00:00.000000Z',
      }),
    ).rejects.toEqual(
      new ResultGatewayTransportError('NETWORK_UNAVAILABLE', true),
    )
  })

  it('propagates an explicit caller cancellation instead of misreporting a timeout', async () => {
    const fetcher = vi.fn<typeof fetch>(async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('cancelled by route change', 'AbortError')),
          { once: true },
        )
      }),
    )
    const gateway = new HttpFormalResultReadGateway({ fetcher })
    const controller = new AbortController()
    const read = gateway.read(
      {
        operation: 'QUALITY_DETAIL',
        analysis_unit_id: 'item:cancelled',
        as_of: '2026-08-24T08:00:00.000000Z',
      },
      { signal: controller.signal },
    )
    controller.abort()

    await expect(read).rejects.toMatchObject({ name: 'AbortError' })
    await expect(read).rejects.not.toBeInstanceOf(ResultGatewayTransportError)
  })

  it('rejects non-loopback cross-origin endpoints and credential-bearing URLs', () => {
    expect(
      () => new HttpFormalResultReadGateway({ baseUrl: 'https://example.com/api' }),
    ).toThrow(/same-origin or loopback/)
    expect(
      () => new HttpFormalResultReadGateway({ baseUrl: 'http://user:pass@localhost/api' }),
    ).toThrow(/same-origin or loopback/)
    expect(
      () => new HttpFormalResultReadGateway({ baseUrl: '//localhost/api' }),
    ).toThrow(/protocol-relative/)
  })
})
