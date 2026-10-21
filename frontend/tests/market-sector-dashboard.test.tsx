import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadMarketSectorDashboard } from '../src/adapter/marketSectorDashboardViewModel'
import type { FormalResultReadRequest } from '../src/api/FormalResultReadApi'
import type { MarketSectorDashboardGateway } from '../src/api/MarketSectorDashboardGateway'
import {
  selectLatestSnapshotAtOrBefore,
  SnapshotSelectionUnavailable,
} from '../src/api/snapshotSelector'
import { OfflineMarketSectorDashboardGateway } from '../src/formal/marketSectorDashboardGateway'
import { LangProvider } from '../src/i18n'
import { MarketSectorDashboardPage } from '../src/pages/MarketSectorDashboardPage'

const CJK = /[　-〿一-鿿＀-￯]/
const SNAPSHOT_AS_OF = '2026-08-22T08:00:00.000000Z'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the point-in-time selector has one rule for one or many snapshots', () => {
  const candidates = [
    { as_of: '2026-08-20T00:00:00.000000Z', id: 'old' },
    { as_of: '2026-08-22T00:00:00.000000Z', id: 'current' },
    { as_of: '2026-08-24T00:00:00.000000Z', id: 'future' },
  ] as const

  it('chooses the maximum as_of that is not later than the query instant', () => {
    expect(
      selectLatestSnapshotAtOrBefore(
        candidates,
        '2026-08-23T00:00:00.000000Z',
      ).id,
    ).toBe('current')
    expect(
      selectLatestSnapshotAtOrBefore(candidates, '2026-08-24T00:00:00.000000Z').id,
    ).toBe('future')
  })

  it('never falls forward and refuses an ambiguous duplicate as_of', () => {
    expect(() =>
      selectLatestSnapshotAtOrBefore(candidates, '2026-08-19T00:00:00.000000Z'),
    ).toThrow(SnapshotSelectionUnavailable)
    expect(() =>
      selectLatestSnapshotAtOrBefore(
        [candidates[0], { ...candidates[0], id: 'duplicate' }],
        candidates[0].as_of,
      ),
    ).toThrow('duplicate dashboard snapshot as_of')
  })
})

describe('the shared dashboard fixture has one decoded and reconciled consumption path', () => {
  it('loads MARKET, every SECTOR and COLLECTION under one selected context', async () => {
    const view = await loadMarketSectorDashboard(
      new OfflineMarketSectorDashboardGateway(),
      '2026-08-23T00:00:00.000000Z',
    )
    expect(view.channel).toBe('OFFLINE_FIXTURE')
    expect(view.contract_status).toBe('VALIDATED')
    expect(view.query_as_of).toBe('2026-08-23T00:00:00.000000Z')
    expect(view.selected_as_of).toBe(SNAPSHOT_AS_OF)
    expect(view.market.header.as_of).toEqual({
      provenance: 'PRODUCED',
      value: SNAPSHOT_AS_OF,
    })
    expect(view.sectors).toHaveLength(4)
    expect(
      view.sectors.every(
        (sector) =>
          sector.header.as_of.provenance === 'PRODUCED' &&
          sector.header.as_of.value === SNAPSHOT_AS_OF,
      ),
    ).toBe(true)
    expect(view.sector_collection.as_of).toBe(SNAPSHOT_AS_OF)
    expect(view.sector_collection.accounting.returned_member_count).toBe(4)
    expect(view.sector_collection.accounting.member_count).toBe(4)
    expect(view.sector_collection.accounting.member_result_ids).toEqual(
      [...view.sectors.map((sector) => sector.snapshot_id)].sort(),
    )
  })

  it('fails closed if COLLECTION no longer names the returned SECTOR snapshots', async () => {
    const base = new OfflineMarketSectorDashboardGateway()
    const gateway: MarketSectorDashboardGateway = {
      kind: 'OFFLINE_FIXTURE',
      listMarketSectorSnapshots: () => base.listMarketSectorSnapshots(),
      async read(request: FormalResultReadRequest): Promise<unknown> {
        const payload = await base.read(request)
        if (request.operation !== 'COLLECTION_DETAIL') return payload
        const changed = structuredClone(payload) as {
          resource: { envelope: { member_result_ids: string[] } }
        }
        changed.resource.envelope.member_result_ids[0] = '0'.repeat(64)
        return changed
      },
    }
    await expect(loadMarketSectorDashboard(gateway)).rejects.toThrow()
  })
})

describe('the MARKET / SECTOR page renders validated fixture facts without network or prose leaks', () => {
  it('shows exact time, explicit OFFLINE_FIXTURE and every reconciled sector row', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network forbidden'))
    render(
      <LangProvider lang="zh">
        <MarketSectorDashboardPage />
      </LangProvider>,
    )

    expect(await screen.findByTestId('dashboard-accounting')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-channel')).toHaveTextContent('OFFLINE_FIXTURE')
    expect(screen.getByTestId('dashboard-temporal-rail')).toHaveTextContent(SNAPSHOT_AS_OF)
    expect(screen.getAllByTestId('dashboard-sector-row')).toHaveLength(4)
    expect(screen.getByTestId('dashboard-accounting')).toHaveTextContent('4')
    expect(document.body).not.toHaveTextContent('Synthetic global market')
    expect(document.body).not.toHaveTextContent('Synthetic knives sector')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('has a complete English surface without CJK leakage', async () => {
    const { container } = render(
      <LangProvider lang="en">
        <MarketSectorDashboardPage />
      </LangProvider>,
    )
    expect(await screen.findByTestId('dashboard-accounting')).toBeInTheDocument()
    expect(CJK.test(container.textContent ?? '')).toBe(false)
  })
})
