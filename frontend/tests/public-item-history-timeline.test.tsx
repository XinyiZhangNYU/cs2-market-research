import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../src/i18n'
import { historyMilestones, ItemHistoryDetail } from '../src/pages/PublicItemHistoryPage'
import { ItemHistoryValidationError, validateDisplayEpisodeMember, validateDisplayReleaseIdentity } from '../src/wire/itemHistoryPublicApiDecode'
import type { ItemHistoryMember, ItemHistoryRelease, ItemHistorySuccess } from '../src/wire/itemHistoryPublicApiTypes'


describe('historical item display timeline', () => {
  it('shows every retrospective milestone in chronological order', () => {
    expect(historyMilestones({
      supply_onset: '2025-10-23',
      price_onset: '2025-11-21',
      peak_on: '2025-12-03',
      statistics_through: '2025-12-19',
    })).toEqual([
      { date: '2025-10-23', label: 'supplyOnset', order: 0 },
      { date: '2025-11-21', label: 'priceOnset', order: 1 },
      { date: '2025-12-03', label: 'peakOn', order: 2 },
      { date: '2025-12-19', label: 'statisticsThrough', order: 3 },
    ])
  })

  it('keeps same-day milestones visible and deterministically ordered', () => {
    expect(historyMilestones({
      supply_onset: '2026-01-12',
      price_onset: '2026-01-12',
      peak_on: '2026-02-10',
      statistics_through: '2026-03-21',
    }).map(({ label }) => label)).toEqual([
      'supplyOnset', 'priceOnset', 'peakOn', 'statisticsThrough',
    ])
  })

  it('separates a merged group timeline from the representative variant native cycle', () => {
    const document = {
      publication: { published_at: '2026-09-20T00:00:00Z' },
      snapshot: { history_observed_through: '2026-08-26' },
      release: { public_event_count: 4789 },
      members: [{
        history_event_token: 'a'.repeat(64),
        catalog_snapshot_id: 'catalog-1',
        catalog: {
          analysis_unit_id: 'item:1663',
          localized_name: { zh_cn: 'FN57 | 暴怒野兽（略有磨损）', en: 'Five-SeveN | Hyper Beast (Minimal Wear)' },
          media: { status: 'NOT_PRODUCED' },
          version_context: { media_asset_version_id: null },
        },
        product_pool: 'ORDINARY',
        family_cycle_ordinal: 6,
        timing_relationship: 'SUPPLY_LEADS',
        supply_onset: '2025-10-23',
        price_onset: '2025-11-21',
        pairing_detected_on: '2025-11-21',
        observed_through: '2026-08-26',
        statistics_from: '2025-10-23',
        statistics_through: '2025-12-19',
        peak_on: '2025-12-18',
        baseline_ask_usd: '10',
        peak_ask_usd: '150',
        maximum_price_multiple: '15.4605075521699586696738288884',
        baseline_supply: '100',
        minimum_supply: 10,
        remaining_supply_ratio: '0.1',
        supply_contraction_ratio: '0.9',
        supply_measurement_confidence: 'STANDARD',
        related_variant_count: 4,
        display_episode_timeline_scope: 'DISPLAY_EPISODE_GROUP',
        display_episode_source_cycle_count: 2,
        group_timeline_includes_other_variants: true,
        representative_native: {
          item_id: 1663,
          family_event_id: 'b'.repeat(64),
          family_cycle_ordinal: 7,
          timing_relationship: 'CONCURRENT_DAILY',
          supply_onset: '2025-12-18',
          price_onset: '2025-12-18',
          pairing_detected_on: '2025-12-18',
          statistics_from: '2025-12-18',
          statistics_through: '2025-12-19',
          peak_on: '2025-12-18',
        },
        event_end_is_economic_claim: false,
        manipulation_label: null,
      }],
    } as unknown as ItemHistorySuccess

    render(<LangProvider lang="zh"><ItemHistoryDetail document={document} onClose={vi.fn()} /></LangProvider>)

    expect(screen.getByText(/事件组时间线/u)).toBeInTheDocument()
    expect(screen.getByText('最早节点或统计边界包含同一事件组内其他证据版本。')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '代表版本原生周期' })).toHaveTextContent('两个信号门同日通过')
    expect(screen.getByRole('region', { name: '代表版本原生周期' })).toHaveTextContent('2025年12月18日')
    expect(screen.getByText('15.46×')).toBeInTheDocument()
    expect(screen.queryByText('15.4605075521699586696738288884×')).not.toBeInTheDocument()
    expect(screen.queryByText('供给先于价格')).not.toBeInTheDocument()
  })

  it('rejects partial display release identity', () => {
    const release = {
      display_episode_policy_sha256: 'a'.repeat(64),
      display_episode_lineage_sha256: 'b'.repeat(64),
    } as ItemHistoryRelease
    expect(() => validateDisplayReleaseIdentity(release)).toThrow(ItemHistoryValidationError)
  })

  it('rejects a representative native peak that differs from the displayed representative peak', () => {
    const member = {
      catalog: { analysis_unit_id: 'item:1663' },
      timing_relationship: 'SUPPLY_LEADS',
      supply_onset: '2025-10-23',
      price_onset: '2025-11-21',
      pairing_detected_on: '2025-11-21',
      statistics_from: '2025-10-23',
      statistics_through: '2025-12-19',
      peak_on: '2025-12-18',
      display_episode_timeline_scope: 'DISPLAY_EPISODE_GROUP',
      display_episode_source_cycle_count: 2,
      group_timeline_includes_other_variants: true,
      representative_native: {
        item_id: 1663,
        timing_relationship: 'CONCURRENT_DAILY',
        supply_onset: '2025-12-18',
        price_onset: '2025-12-18',
        pairing_detected_on: '2025-12-18',
        statistics_from: '2025-12-18',
        statistics_through: '2025-12-19',
        peak_on: '2025-12-17',
      },
    }
    const release = { display_episode_contract: 'single-item-history-display-episode/2' } as ItemHistoryRelease
    expect(() => validateDisplayEpisodeMember(member as ItemHistoryMember, release)).toThrow(ItemHistoryValidationError)
  })

  it.each([
    ['group price and detection after its window', 'group'],
    ['native statistics after the observation boundary', 'native-statistics'],
    ['native price and detection after its window', 'native-gates'],
    ['native detection before its price onset', 'native-detection'],
  ])('rejects %s', (_label, mutation) => {
    const member = {
      catalog: { analysis_unit_id: 'item:1663' },
      timing_relationship: 'SUPPLY_LEADS',
      supply_onset: '2025-10-23',
      price_onset: '2025-11-21',
      pairing_detected_on: '2025-11-22',
      observed_through: '2026-08-26',
      statistics_from: '2025-10-23',
      statistics_through: '2025-12-19',
      peak_on: '2025-12-18',
      display_episode_timeline_scope: 'DISPLAY_EPISODE_GROUP',
      display_episode_source_cycle_count: 2,
      group_timeline_includes_other_variants: true,
      representative_native: {
        item_id: 1663,
        timing_relationship: 'CONCURRENT_DAILY',
        supply_onset: '2025-12-18',
        price_onset: '2025-12-18',
        pairing_detected_on: '2025-12-18',
        statistics_from: '2025-12-18',
        statistics_through: '2025-12-19',
        peak_on: '2025-12-18',
      },
    }
    if (mutation === 'group') {
      member.price_onset = '2099-01-01'
      member.pairing_detected_on = '2099-01-02'
    } else if (mutation === 'native-statistics') {
      member.representative_native!.statistics_through = '2099-01-02'
    } else if (mutation === 'native-gates') {
      member.representative_native!.price_onset = '2099-01-01'
      member.representative_native!.pairing_detected_on = '2099-01-02'
    } else {
      member.representative_native!.pairing_detected_on = '2025-12-17'
    }
    const native = member.representative_native!
    member.group_timeline_includes_other_variants = member.timing_relationship !== native.timing_relationship ||
      member.supply_onset !== native.supply_onset || member.price_onset !== native.price_onset ||
      member.pairing_detected_on !== native.pairing_detected_on ||
      member.statistics_from !== native.statistics_from || member.statistics_through !== native.statistics_through
    const release = { display_episode_contract: 'single-item-history-display-episode/2' } as ItemHistoryRelease
    expect(() => validateDisplayEpisodeMember(member as ItemHistoryMember, release)).toThrow(ItemHistoryValidationError)
  })

  it('allows a peak before the price gate when all dates remain inside the declared windows', () => {
    const member = {
      catalog: { analysis_unit_id: 'item:1663' },
      timing_relationship: 'SUPPLY_LEADS',
      supply_onset: '2025-10-23',
      price_onset: '2025-11-21',
      pairing_detected_on: '2025-11-22',
      observed_through: '2026-08-26',
      statistics_from: '2025-10-23',
      statistics_through: '2025-12-19',
      peak_on: '2025-11-01',
      display_episode_timeline_scope: 'DISPLAY_EPISODE_GROUP',
      display_episode_source_cycle_count: 1,
      group_timeline_includes_other_variants: false,
      representative_native: {
        item_id: 1663,
        timing_relationship: 'SUPPLY_LEADS',
        supply_onset: '2025-10-23',
        price_onset: '2025-11-21',
        pairing_detected_on: '2025-11-22',
        statistics_from: '2025-10-23',
        statistics_through: '2025-12-19',
        peak_on: '2025-11-01',
      },
    } as ItemHistoryMember
    const release = { display_episode_contract: 'single-item-history-display-episode/2' } as ItemHistoryRelease
    expect(() => validateDisplayEpisodeMember(member as ItemHistoryMember, release)).not.toThrow()
  })
})
