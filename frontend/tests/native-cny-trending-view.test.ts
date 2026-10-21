import { describe, expect, it } from 'vitest'
import type { NativeCnyTrendingDay, NativeCnyTrendingSelection } from '../src/api/HttpNativeCnyTrendingGateway'
import { nativeCnyTrendingExactReturnText, nativeCnyTrendingViewModel,
  snapshotNativeCnyTrendingSelection } from '../src/trending/nativeCnyTrendingViewModel'
import { nativeTrendingFixture } from './native-cny-trending-view-fixture'

describe('native Trending presentation is lossless and does not redefine ranking', () => {
  it('retains every decoded publication, clock, quality and source field with external pins separate', () => {
    const { day, selection } = nativeTrendingFixture()
    const view = nativeCnyTrendingViewModel(day, selection)
    for (const field of ['publicationId', 'publicSha256', 'rightsSha256', 'readinessReviewSha256',
      'releasedAt', 'currency', 'fxApplied', 'method', 'startDate', 'endDate', 'asOf',
      'inputAvailableAt', 'evidenceClass', 'historicalMembershipQualified'] as const)
      expect(view[field]).toBe(day[field])
    expect(view.selectionPins).toEqual(selection)
    expect(view.members.map(({ exactReturnText: _text, ...member }) => member)).toEqual(day.members)
    expect(view.members[0]).not.toHaveProperty('sourceAvailability')
    expect(view.members[0]).not.toHaveProperty('missingSources')
    expect(view).not.toHaveProperty('rightsCertified')
  })
  it('preserves huge ratios, original ranks and lexical tie identity order without Number sorting', () => {
    const { day, selection } = nativeTrendingFixture()
    const view = nativeCnyTrendingViewModel(day, selection)
    expect(view.members.map(member => member.analysisUnitId)).toEqual([
      'item:18446744073709551615', 'item:10', 'item:2', 'item:12',
    ])
    expect(view.gainers.map(member => member.rank)).toEqual([1, 2, 3])
    expect(view.losers.map(member => member.rank)).toEqual([1])
    expect(view.members[0].exactReturnText).toBe(`0x1${'0'.repeat(200)} / 0x3`)
    expect(view.members[3].exactReturnText).toBe('-0x1 / 0x3')
  })
  it('texts the disclosed exact-field boundary without decimal rounding or float conversion', () => {
    const exact = { numerator_hex: '1' + '0'.repeat(4095), denominator_hex: '3' }
    expect(nativeCnyTrendingExactReturnText(exact)).toBe(`0x${exact.numerator_hex} / 0x3`)
    expect(exact.numerator_hex).toHaveLength(4096)
  })
  it('freezes copied presentation values without mutating the input', () => {
    const { day, selection } = nativeTrendingFixture()
    const before = JSON.stringify({ day, selection })
    const view = nativeCnyTrendingViewModel(day, selection)
    for (const value of [view, view.selectionPins, view.members, view.gainers, view.losers,
      view.members[0], view.members[0].returnExact]) expect(Object.isFrozen(value)).toBe(true)
    expect(JSON.stringify({ day, selection })).toBe(before)
    expect(view.members).not.toBe(day.members)
    expect(view.members[0].returnExact).not.toBe(day.members[0].returnExact)
  })
  it('copies all nine selection values, ignoring later caller mutations', () => {
    const { selection } = nativeTrendingFixture()
    const frozen = snapshotNativeCnyTrendingSelection(selection)
    selection.knownAt = '2026-10-02T00:00:03Z'
    selection.candidateSha256 = 'f'.repeat(64)
    expect(frozen.knownAt).toBe('2026-10-02T00:00:02Z')
    expect(frozen.candidateSha256).toBe('a'.repeat(64))
    expect(Object.keys(frozen)).toHaveLength(9)
  })
  it.each(['publicationId', 'publicSha256', 'rightsSha256', 'readinessReviewSha256',
    'candidateSha256', 'catalogPublicationId', 'startDate', 'endDate', 'knownAt'] as const)(
    'rejects an incomplete selection before requesting: %s', field => {
      const bad = { ...nativeTrendingFixture().selection, [field]: undefined }
      expect(() => snapshotNativeCnyTrendingSelection(bad as unknown as NativeCnyTrendingSelection))
        .toThrow('INVALID_SELECTION')
    })
  it.each(['publicationId', 'publicSha256', 'rightsSha256', 'readinessReviewSha256',
    'candidateSha256', 'catalogPublicationId'] as const)('does not accept a drifting complete hash token: %s', field => {
    const selection = nativeTrendingFixture().selection
    expect(() => snapshotNativeCnyTrendingSelection({ ...selection, [field]: selection[field] + '\n' }))
      .toThrow('INVALID_SELECTION')
  })
  it.each(['2026-10-02t08:00:02+08:00', '2026-10-02 00:00:02,000000000Z',
    '2026-10-01T24:00:00Z'])('preserves a valid selection clock verbatim: %s', knownAt => {
    const selection = { ...nativeTrendingFixture().selection, knownAt }
    expect(snapshotNativeCnyTrendingSelection(selection).knownAt).toBe(knownAt)
  })
  it.each([
    { startDate: '2026-09-02' }, { endDate: '2026-02-30' }, { knownAt: '2026-10-02T00:00:00.1234561Z' },
  ])('rejects unsupported date/clock selection %j', patch => {
    expect(() => snapshotNativeCnyTrendingSelection({ ...nativeTrendingFixture().selection, ...patch }))
      .toThrow('INVALID_SELECTION')
  })
  it.each(['publicationId', 'publicSha256', 'rightsSha256', 'readinessReviewSha256',
    'startDate', 'endDate'] as const)('rejects a decoded day belonging to different pins/window: %s', field => {
    const { day, selection } = nativeTrendingFixture()
    expect(() => nativeCnyTrendingViewModel({ ...day, [field]: 'wrong' }, selection)).toThrow('INVALID_RESPONSE')
  })
  it.each([{ currency: 'USD' }, { fxApplied: true }, { method: 'LEGACY_USD' },
    { historicalMembershipQualified: true }])('cannot label a legacy or qualified day as this native view: %j', patch => {
    const { day, selection } = nativeTrendingFixture()
    expect(() => nativeCnyTrendingViewModel({ ...day, ...patch } as unknown as NativeCnyTrendingDay, selection))
      .toThrow('INVALID_RESPONSE')
  })
})
