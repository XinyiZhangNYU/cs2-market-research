import { describe, expect, it, vi } from 'vitest'
import listFixture from '../../schemas/examples/valve-event-public-list.valid.json'
import {
  HttpValveEventsGateway,
  ValveEventTransportError,
} from '../src/api/HttpValveEventsGateway'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

describe('HttpValveEventsGateway', () => {
  it('maps list continuations and detail reads to bounded same-origin GET requests', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse(listFixture))
    const gateway = new HttpValveEventsGateway({ fetcher })
    const eventId = 'a'.repeat(64)

    await gateway.read({ operation: 'LIST', cursor: null })
    await gateway.read({ operation: 'LIST', cursor: 'opaque cursor' })
    await gateway.read({ operation: 'DETAIL', event_id: eventId })

    expect(fetcher.mock.calls.map(([input]) => String(input))).toEqual([
      '/api/v1/valve-events?limit=100',
      '/api/v1/valve-events?limit=100&cursor=opaque+cursor',
      '/api/v1/valve-events/' + eventId,
    ])
    for (const [, init] of fetcher.mock.calls) {
      expect(init).toMatchObject({
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
        referrerPolicy: 'no-referrer',
        redirect: 'error',
        headers: { Accept: 'application/json' },
      })
      expect(init?.signal).toBeInstanceOf(AbortSignal)
    }
  })

  it('accepts explicit loopback development endpoints but rejects foreign origins', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse(listFixture))
    const gateway = new HttpValveEventsGateway({
      baseUrl: 'http://127.0.0.1:8765/api/v1/valve-events/',
      fetcher,
    })
    await gateway.read({ operation: 'LIST', cursor: null })
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'http://127.0.0.1:8765/api/v1/valve-events?limit=100',
    )
    expect(
      () => new HttpValveEventsGateway({ baseUrl: 'https://example.com/api' }),
    ).toThrow(/same-origin or loopback/u)
    expect(
      () => new HttpValveEventsGateway({ baseUrl: '//localhost/api' }),
    ).toThrow(/protocol-relative/u)
  })

  it('fails closed with sanitized transport categories', async () => {
    const failed = new HttpValveEventsGateway({
      fetcher: async () => jsonResponse({ error: { secret: 'do not reflect' } }, 503),
    })
    await expect(failed.read({ operation: 'LIST', cursor: null })).rejects.toEqual(
      new ValveEventTransportError('HTTP_STATUS_MISMATCH', true, 503),
    )

    const network = new HttpValveEventsGateway({
      fetcher: async () => {
        throw new Error('private DSN and origin body')
      },
    })
    await expect(network.read({ operation: 'LIST', cursor: null })).rejects.toEqual(
      new ValveEventTransportError('NETWORK_UNAVAILABLE', true),
    )
    await expect(
      network.read({ operation: 'DETAIL', event_id: 'not-a-public-id' }),
    ).rejects.toEqual(new ValveEventTransportError('INVALID_REQUEST', false))
  })
})
