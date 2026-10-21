import { describe, expect, it } from 'vitest'
import { commonObservableReturn, longestConnectedReturn, windowReturn } from '../src/pages/publicMarketIndexChart'
import type { MarketSectorIndexPoint } from '../src/wire/marketSectorIndexPublicApiTypes'

function point(date: string, value: string | null, connect: boolean, period: string | null, segment = 's1'): MarketSectorIndexPoint {
  return { date, segment_id: segment, connect_to_previous: connect,
    index: { value, period_return: period } } as MarketSectorIndexPoint
}

const first = point('2026-09-01', '1000', false, null)
const second = point('2026-09-02', '1010', true, '0.01')

describe('strict single-series continuity diagnostics', () => {
  it.each([
    point('2026-09-04', '1500', true, '0.2'),
    point('2026-09-03', '1500', true, null),
    point('2026-09-03', '1500', true, '0.2', 's2'),
    point('2026-09-03', '1500', false, '0.2'),
    point('2026-09-03', null, true, '0.2'),
  ])('does not trust a visual join across a missing or invalid link', (broken) => {
    const points = [first, second, broken]
    expect(windowReturn(points)).toBeNull()
    expect(longestConnectedReturn(points)).toBeCloseTo(0.01)
    expect(commonObservableReturn(points)).toBeCloseTo(0.01)
  })

  it('does not relabel a short segment as a complete calendar window', () => {
    expect(windowReturn([first, second], '1M')).toBeNull()
    expect(longestConnectedReturn([first, second])).toBeCloseTo(0.01)
    expect(longestConnectedReturn([])).toBeNull()
    expect(longestConnectedReturn([first])).toBeNull()
  })
})
