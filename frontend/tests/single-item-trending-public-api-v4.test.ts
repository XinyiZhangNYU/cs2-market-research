import { describe, expect, it } from 'vitest'
import tieredFixture from '../../schemas/examples/single-item-trending-tiered-list.valid.json'
import { decodeTrendingPublicDocument, TrendingPublicValidationError } from '../src/wire/singleItemTrendingPublicApiDecode'
import { validateSingleItemTrendingPublicApiV4Response } from '../src/wire/generated/wireValidators.js'
import type { TrendingListQuery } from '../src/wire/singleItemTrendingPublicApiTypes'

const QUERY = Object.freeze({
  as_of: null,
  publication_id: null,
  direction: 'GAINERS',
  page_size: 50,
  cursor: null,
  filters: Object.freeze({ item_kind: null, base_item_code: null, edition_kind: null, wear_tier: null }),
} satisfies TrendingListQuery)

function reconstructedV4(): any {
  const payload: any = structuredClone(tieredFixture)
  payload.api_version = 'v4'
  delete payload.publication.producer_release.minimum_three_source_endpoint_ratio_bps
  delete payload.publication.producer_release.minimum_qualified_three_source_endpoint_ratio_bps
  delete payload.publication.producer_release.minimum_direction_eligible_ratio_bps
  payload.publication.numeric_profile.segment = 'SOURCE_TIERED_HISTORY_HYBRID'
  const end = new Date(`${payload.publication.result_as_of}T00:00:00.000Z`)
  end.setUTCDate(end.getUTCDate() - 30)
  payload.publication.window_start_date = end.toISOString().slice(0, 10)
  payload.publication.evidence_class = 'RECONSTRUCTED_HISTORY'
  payload.publication.freshness_anchor_at = payload.publication.input_available_at
  payload.publication.evidence_disclosure = {
    start_endpoint_acquisition: 'HISTORICAL_PROVIDER_ARCHIVE',
    end_endpoint_acquisition: 'HISTORICAL_PROVIDER_ARCHIVE',
    historical_obtained_at: payload.publication.input_available_at,
    late_bound_current_membership: true,
    pit_membership_claimed: false,
    prospective_continuity_credit: false,
    public_label: '历史重建',
  }
  payload.publication.currency_disclosure = {
    source_currency: 'USD',
    source_native_semantics: 'UPSTREAM_PROVIDER_USD_REFERENCE_NOT_PROVEN_PLATFORM_NATIVE',
    analysis_currency: 'CNY',
    analysis_semantics: 'FX_RECONSTRUCTED_CNY_REFERENCE',
    conversion_policy: 'analysis-cny-minor-half-even/1',
    start_fx_source_event_date: payload.publication.window_start_date,
    end_fx_source_event_date: payload.publication.result_as_of,
    current_fx_repricing_forbidden: true,
  }
  delete payload.publication.tiering_policy.maximum_quote_age_minutes
  delete payload.publication.tiering_policy.minimum_qualified_slots
  delete payload.publication.tiering_policy.expected_slots
  payload.publication.tiering_policy.evidence_class = 'RECONSTRUCTED_HISTORY'
  payload.publication.tiering_policy.allowed_missing_reasons = ['PROVIDER_HISTORY_SOURCE_ABSENT']
  payload.publication.tiering_policy.public_primary_grade = 'THREE_SOURCE_CONFIRMED'
  payload.publication.tiering_policy.two_source_publication_state =
    'WITHHELD_PENDING_SEPARATE_RIGHTS_AND_PRODUCT_APPROVAL'
  payload.publication.tiering_policy.public_readiness_policy_id = '9'.repeat(64)
  payload.publication.tiering_policy.minimum_qualified_three_source_endpoint_ratio_bps = 0
  payload.publication.tiering_policy.minimum_public_candidates_per_direction = 1
  payload.publication.tiering_policy.empty_public_lane_state = 'WITHHOLD_PUBLICATION'
  payload.members = payload.members.filter((member: any) => member.evidence_grade === 'THREE_SOURCE_CONFIRMED')
  payload.members.forEach((member: any, index: number) => { member.rank = index + 1 })
  payload.total = payload.members.length
  payload.publication.accounting.gainer_count = payload.members.length
  payload.publication.accounting.loser_count = 1
  return payload
}

describe('single-item-trending-public-api/v4 evidence boundary', () => {
  it('accepts explicit reconstructed history without granting prospective credit', () => {
    const payload = reconstructedV4()
    expect(
      validateSingleItemTrendingPublicApiV4Response(payload),
      JSON.stringify(validateSingleItemTrendingPublicApiV4Response.errors),
    ).toBe(true)
    const decoded = decodeTrendingPublicDocument(payload, QUERY, 200)
    expect(decoded.api_version).toBe('v4')
    if (decoded.response_kind !== 'TRENDING_LIST') throw new Error('unexpected response')
    expect(decoded.publication.evidence_disclosure?.public_label).toBe('历史重建')
    expect(decoded.publication.evidence_disclosure?.prospective_continuity_credit).toBe(false)
  })

  it('rejects a backdated prospective claim and live absence semantics in history', () => {
    const credit = reconstructedV4()
    credit.publication.evidence_disclosure.prospective_continuity_credit = true
    expect(() => decodeTrendingPublicDocument(credit, QUERY, 200)).toThrow(TrendingPublicValidationError)

    const downgraded = reconstructedV4()
    downgraded.members[0].evidence_grade = 'TWO_SOURCE_SUPPORTED'
    downgraded.members[0].supporting_sources = ['market_a', 'market_c']
    downgraded.members[0].unavailable_sources = [{
      source_code: 'market_b',
      start_reason: 'PROVIDER_HISTORY_SOURCE_ABSENT',
      end_reason: 'PROVIDER_HISTORY_SOURCE_ABSENT',
    }]
    expect(() => decodeTrendingPublicDocument(downgraded, QUERY, 200)).toThrow(TrendingPublicValidationError)
  })

  it('rejects a response below the formal A3 coverage or complete-lane gates', () => {
    const lowCoverage = reconstructedV4()
    lowCoverage.publication.tiering_policy.minimum_qualified_three_source_endpoint_ratio_bps =
      lowCoverage.publication.accounting.qualified_three_source_endpoint_ratio_bps + 1
    expect(() => decodeTrendingPublicDocument(lowCoverage, QUERY, 200)).toThrow(
      TrendingPublicValidationError,
    )

    const shortLane = reconstructedV4()
    shortLane.publication.accounting.gainer_count = 0
    expect(() => decodeTrendingPublicDocument(shortLane, QUERY, 200)).toThrow(
      TrendingPublicValidationError,
    )

    const emptyLanes = reconstructedV4()
    emptyLanes.publication.accounting.gainer_count = 0
    emptyLanes.publication.accounting.loser_count = 0
    expect(() => decodeTrendingPublicDocument(emptyLanes, QUERY, 200)).toThrow(
      TrendingPublicValidationError,
    )
  })
})
