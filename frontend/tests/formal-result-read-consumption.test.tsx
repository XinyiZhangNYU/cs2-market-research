import '@testing-library/jest-dom/vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  FormalResultReadApi,
  ResultReadRequestBindingViolation,
  UnexpectedResultReadResponse,
  type FormalResultReadGateway,
  type FormalResultReadRequest,
} from '../src/api/FormalResultReadApi'
import { FormalResultReadPanel } from '../src/components/FormalResultReadPanel'
import { LangProvider } from '../src/i18n'
import { decodeResultReadApiResponse } from '../src/wire/resultReadApiDecode'

const ROOT = join(import.meta.dirname, '..', '..', 'schemas', 'examples')

function fixture(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(ROOT, name), 'utf8')) as Record<string, unknown>
}

class FixtureGateway implements FormalResultReadGateway {
  readonly kind = 'FIXTURE_ONLY'
  readonly requests: FormalResultReadRequest[] = []

  constructor(private readonly response: Record<string, unknown>) {}

  async read(request: FormalResultReadRequest): Promise<unknown> {
    this.requests.push(request)
    return structuredClone(this.response)
  }
}

function renderResponse(name: string) {
  const response = decodeResultReadApiResponse(fixture(name))
  return render(
    <LangProvider lang="zh">
      <FormalResultReadPanel response={response} />
    </LangProvider>,
  )
}

describe('the formal frontend client stays transport-neutral and binds responses to requests', () => {
  it('consumes an exact Python-generated unit fixture without using global fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network forbidden'))
    const gateway = new FixtureGateway(fixture('result-read-unit-detail.valid.json'))
    const api = new FormalResultReadApi(gateway)
    const response = await api.getUnit({
      analysis_unit_id: 'item:42:phase-p2',
      as_of: '2026-08-21T00:00:02.000000Z',
    })

    expect(response.response_kind).toBe('UNIT_DETAIL')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(gateway.requests).toEqual([
      {
        operation: 'UNIT_DETAIL',
        analysis_unit_id: 'item:42:phase-p2',
        as_of: '2026-08-21T00:00:02.000000Z',
      },
    ])
    expect(Object.isFrozen(gateway.requests[0])).toBe(true)
    fetchSpy.mockRestore()
  })

  it('rejects a valid response that belongs to another request', async () => {
    const gateway = new FixtureGateway(fixture('result-read-unit-detail.valid.json'))
    const api = new FormalResultReadApi(gateway)
    await expect(
      api.getUnit({
        analysis_unit_id: 'item:someone-else',
        as_of: '2026-08-21T00:00:02.000000Z',
      }),
    ).rejects.toBeInstanceOf(ResultReadRequestBindingViolation)
  })

  it('rejects a schema-valid response kind that differs from the requested operation', async () => {
    const gateway = new FixtureGateway(fixture('result-read-collection-detail.valid.json'))
    const api = new FormalResultReadApi(gateway)
    await expect(
      api.getUnit({
        analysis_unit_id: 'item:42:phase-p2',
        as_of: '2026-08-21T00:00:02.000000Z',
      }),
    ).rejects.toBeInstanceOf(UnexpectedResultReadResponse)
  })

  it('binds all echoed list filters, ordering, page size and as_of', async () => {
    const gateway = new FixtureGateway(fixture('result-read-unit-list.valid.json'))
    const api = new FormalResultReadApi(gateway)
    const response = await api.listUnits({
      query: {
        as_of: '2026-08-21T00:00:02.000000Z',
        scope_kind: 'ITEM',
        analysis_unit_kind: 'STYLE_VARIANT',
        edition_kind: 'STANDARD',
        parent_analysis_unit_id: 'item:42',
        data_status: 'UNAVAILABLE_BY_DESIGN',
        sort: 'ANALYSIS_UNIT_ID_ASC',
        page_size: 100,
      },
      cursor: null,
    })
    expect(response.response_kind).toBe('UNIT_LIST')

    const mismatched = new FixtureGateway(fixture('result-read-unit-list.valid.json'))
    const mismatchedApi = new FormalResultReadApi(mismatched)
    await expect(
      mismatchedApi.listUnits({
        query: {
          as_of: '2026-08-21T00:00:02.000000Z',
          scope_kind: 'ITEM',
          analysis_unit_kind: 'STYLE_VARIANT',
          edition_kind: 'STANDARD',
          parent_analysis_unit_id: 'item:42',
          data_status: 'UNAVAILABLE_BY_DESIGN',
          sort: 'ANALYSIS_UNIT_ID_ASC',
          page_size: 50,
        },
        cursor: null,
      }),
    ).rejects.toBeInstanceOf(ResultReadRequestBindingViolation)
  })

  it('binds collection and quality detail responses to their requested identities', async () => {
    const collectionApi = new FormalResultReadApi(
      new FixtureGateway(fixture('result-read-collection-detail.valid.json')),
    )
    const collection = await collectionApi.getCollection({
      collection_id: 'overview:market',
      as_of: '2026-08-21T00:00:02.000000Z',
    })
    expect(collection.response_kind).toBe('COLLECTION_DETAIL')

    const qualityApi = new FormalResultReadApi(
      new FixtureGateway(fixture('result-read-quality-detail.valid.json')),
    )
    const quality = await qualityApi.getQuality({
      analysis_unit_id: 'item:43',
      as_of: '2026-08-22T04:00:02.000000Z',
    })
    expect(quality.response_kind).toBe('QUALITY_DETAIL')

    await expect(
      qualityApi.getQuality({
        analysis_unit_id: 'item:wrong',
        as_of: '2026-08-22T04:00:02.000000Z',
      }),
    ).rejects.toBeInstanceOf(ResultReadRequestBindingViolation)
  })

  it('binds every echoed quality-list filter, order, page size and as_of', async () => {
    const api = new FormalResultReadApi(
      new FixtureGateway(fixture('result-read-quality-list.valid.json')),
    )
    const response = await api.listQuality({
      query: {
        as_of: '2026-08-22T04:00:02.000000Z',
        analysis_unit_kind: 'STYLE_VARIANT',
        edition_kind: 'STANDARD',
        parent_analysis_unit_id: 'item:42',
        sort: 'ANALYSIS_UNIT_ID_ASC',
        page_size: 100,
      },
      cursor: null,
    })
    expect(response.response_kind).toBe('QUALITY_LIST')

    await expect(
      api.listQuality({
        query: {
          as_of: '2026-08-22T04:00:02.000000Z',
          analysis_unit_kind: 'STYLE_VARIANT',
          edition_kind: 'STANDARD',
          parent_analysis_unit_id: 'item:42',
          sort: 'ANALYSIS_UNIT_ID_ASC',
          page_size: 50,
        },
        cursor: null,
      }),
    ).rejects.toBeInstanceOf(ResultReadRequestBindingViolation)
  })

  it('returns only a controlled error contract instead of an exception message', async () => {
    const gateway = new FixtureGateway(fixture('result-read-error.valid.json'))
    const api = new FormalResultReadApi(gateway)
    const response = await api.getUnit({
      analysis_unit_id: 'missing',
      as_of: '2026-08-21T00:00:02.000000Z',
    })
    expect(response.response_kind).toBe('ERROR')
    if (response.response_kind !== 'ERROR') throw new Error('wrong test kind')
    expect(response.error).toEqual({ code: 'NOT_FOUND', http_status: 404, retryable: false })
  })
})

describe('all shared API fixture shapes reach the formal display boundary', () => {
  it('renders UNIT_DETAIL through the safe unit adapter', () => {
    renderResponse('result-read-unit-detail.valid.json')
    expect(screen.getByTestId('result-unit')).toHaveAttribute(
      'data-contract',
      'research-result-envelope/v1',
    )
  })

  it('renders UNIT_LIST as independently validated unit envelopes', () => {
    renderResponse('result-read-unit-list.valid.json')
    expect(screen.getByTestId('formal-result-read-list')).toBeInTheDocument()
    expect(screen.getAllByTestId('result-unit')).toHaveLength(1)
  })

  it('renders COLLECTION_DETAIL through the safe collection adapter', () => {
    renderResponse('result-read-collection-detail.valid.json')
    expect(screen.getByTestId('result-collection')).toHaveAttribute(
      'data-contract',
      'research-result-envelope/v1',
    )
  })

  it('renders QUALITY_DETAIL without merging it into an economic result', () => {
    renderResponse('result-read-quality-detail.valid.json')
    expect(screen.getByTestId('quality-envelope')).toHaveAttribute(
      'data-contract',
      'research-quality-envelope/v1',
    )
    expect(screen.queryByTestId('result-unit')).not.toBeInTheDocument()
  })

  it('renders QUALITY_LIST as independently validated quality envelopes', () => {
    renderResponse('result-read-quality-list.valid.json')
    expect(screen.getByTestId('formal-quality-read-list')).toBeInTheDocument()
    expect(screen.getAllByTestId('quality-envelope')).toHaveLength(1)
    expect(screen.queryByTestId('result-unit')).not.toBeInTheDocument()
  })

  it('renders ERROR using controlled fields only', () => {
    const { container } = renderResponse('result-read-error.valid.json')
    expect(screen.getByTestId('formal-result-read-error')).toHaveTextContent('NOT_FOUND')
    expect(container.textContent).not.toMatch(/SQL|DSN|MARKET_[A-D]/i)
  })

  it('rejects a forged outer response before a component can render it', () => {
    const forged = fixture('result-read-unit-detail.valid.json')
    expect(() =>
      render(
        <LangProvider lang="zh">
          <FormalResultReadPanel
            response={forged as unknown as Parameters<typeof FormalResultReadPanel>[0]['response']}
          />
        </LangProvider>,
      ),
    ).toThrow(/decoded result-read API response/)
  })
})
