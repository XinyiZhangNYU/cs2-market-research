import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FxReferenceApi, type FxReferenceGateway } from '../src/api/FxReferenceApi'
import {
  HttpFxReferenceGateway,
  FxReferenceTransportError,
} from '../src/api/HttpFxReferenceGateway'
import { CurrentFxReference } from '../src/components/CurrentFxReference'
import { LangProvider } from '../src/i18n'
import {
  decodeFxReferenceApiResponse,
  FxReferenceSemanticViolation,
  FxReferenceWireViolation,
} from '../src/wire/fxReferenceApiDecode'

const KNOWN_AT = '2026-08-25T02:00:00.000000Z'

function response() {
  return {
    api_contract: 'fx-reference-api',
    api_version: 'v1',
    response_kind: 'FX_REFERENCE_CURRENT',
    query: { known_at: KNOWN_AT },
    reference: {
      authority: 'ECB',
      available_at: '2026-08-24T16:00:00.000000Z',
      carry_days: 1,
      cny_per_usd: '6.72054161',
      cny_valid_from: '2026-08-24T16:00:00.000000Z',
      method: 'ECB_EUR_CROSS',
      source_event_date: '2026-08-24',
      usage: 'REFERENCE_RATE_INFORMATIONAL_ONLY',
      usd_valid_from: '2026-08-24T16:00:00.000000Z',
    },
  }
}

class TestGateway implements FxReferenceGateway {
  readonly kind = 'TEST'
  readonly requests: unknown[] = []
  constructor(private readonly result: unknown = response()) {}
  async read(request: unknown): Promise<unknown> {
    this.requests.push(structuredClone(request))
    return structuredClone(this.result)
  }
}

describe('informational FX reference consumer boundary', () => {
  it('accepts, freezes and request-binds the current ECB cross-rate', async () => {
    const gateway = new TestGateway()
    const result = await new FxReferenceApi(gateway).current({ known_at: KNOWN_AT })
    expect(result.response_kind).toBe('FX_REFERENCE_CURRENT')
    expect(Object.isFrozen(result)).toBe(true)
    expect(gateway.requests).toEqual([{ known_at: KNOWN_AT }])
  })

  it('rejects unknown fields and semantic carry/time drift', () => {
    expect(() => decodeFxReferenceApiResponse({ ...response(), private_url: 'secret' }))
      .toThrow(FxReferenceWireViolation)
    const drift = response()
    drift.reference.carry_days = 0
    expect(() => decodeFxReferenceApiResponse(drift)).toThrow(FxReferenceSemanticViolation)
    const future = response()
    future.reference.available_at = '2026-08-26T16:00:00.000000Z'
    expect(() => decodeFxReferenceApiResponse(future)).toThrow(FxReferenceSemanticViolation)
  })

  it('uses one root-relative no-store GET and binds HTTP status', async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify(response()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    )
    await new HttpFxReferenceGateway({ fetcher }).read({ known_at: KNOWN_AT })
    expect(fetcher).toHaveBeenCalledOnce()
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe(`/api/v1/fx/current?known_at=${encodeURIComponent(KNOWN_AT)}`)
    expect(init).toMatchObject({
      method: 'GET', cache: 'no-store', credentials: 'same-origin',
      referrerPolicy: 'no-referrer',
    })

    const mismatch = new HttpFxReferenceGateway({
      fetcher: async () => new Response(JSON.stringify(response()), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    })
    await expect(mismatch.read({ known_at: KNOWN_AT })).rejects.toBeInstanceOf(
      FxReferenceTransportError,
    )
  })

  it('renders a labelled reference and fails closed without a hardcoded fallback', async () => {
    const view = render(
      <LangProvider lang="zh">
        <CurrentFxReference gateway={new TestGateway()} knownAt={KNOWN_AT} />
      </LangProvider>,
    )
    expect(await screen.findByTestId('public-fx-rate')).toHaveTextContent(
      '1 USD ≈ ¥6.72054161',
    )
    expect(view.container).toHaveTextContent('沿用 1 天')
    expect(view.container).toHaveTextContent('仅供换算参考')
    view.unmount()

    const english = render(
      <LangProvider lang="en">
        <CurrentFxReference gateway={new TestGateway()} knownAt={KNOWN_AT} />
      </LangProvider>,
    )
    expect(await screen.findByTestId('public-fx-rate')).toHaveTextContent(
      '1 USD ≈ ¥6.72054161',
    )
    expect(english.container).toHaveTextContent('Carried forward 1 day')
    english.unmount()

    render(
      <LangProvider lang="en">
        <CurrentFxReference
          gateway={{ kind: 'FAIL', read: async () => { throw new Error('private') } }}
          knownAt={KNOWN_AT}
        />
      </LangProvider>,
    )
    expect(await screen.findByTestId('public-fx-unavailable')).toHaveTextContent('Unavailable')
    expect(document.body).not.toHaveTextContent('6.72054161')
    expect(document.body).not.toHaveTextContent('private')
  })

  it('publishes the current rate to display-only consumers and clears it while unavailable', async () => {
    const onRateChange = vi.fn()
    const view = render(
      <LangProvider lang="en">
        <CurrentFxReference
          gateway={new TestGateway()}
          knownAt={KNOWN_AT}
          onRateChange={onRateChange}
        />
      </LangProvider>,
    )
    await waitFor(() => expect(onRateChange).toHaveBeenLastCalledWith('6.72054161'))
    expect(onRateChange).toHaveBeenCalledWith(null)
    view.unmount()

    const unavailable = vi.fn()
    render(
      <LangProvider lang="en">
        <CurrentFxReference
          gateway={{ kind: 'FAIL', read: async () => { throw new Error('private') } }}
          knownAt={KNOWN_AT}
          onRateChange={unavailable}
        />
      </LangProvider>,
    )
    await screen.findByTestId('public-fx-unavailable')
    expect(unavailable).toHaveBeenLastCalledWith(null)
  })
})
