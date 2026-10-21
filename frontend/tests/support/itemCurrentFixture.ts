import monitorFixture from '../../../schemas/examples/single-item-monitor-public-api/v1/result.json'

export const CURRENT_PUBLICATION = '4'.repeat(64)
export const CURRENT_STAGE_TOKEN = '9'.repeat(64)
export const CURRENT_SECOND_STAGE_TOKEN = '8'.repeat(64)

function member(overrides: Record<string, unknown>) {
  return {
    stage_token: CURRENT_STAGE_TOKEN,
    catalog_snapshot_id: '1'.repeat(64),
    catalog: structuredClone(monitorFixture.members[0].catalog),
    stage: 'SUPPLY_PRESSURE',
    first_leg: 'SUPPLY',
    as_of: '2026-09-13T00:00:00Z',
    supply_onset: '2026-09-10',
    supply_detected_at: '2026-09-10T00:05:00Z',
    price_onset: null,
    price_detected_at: null,
    pairing_deadline_on: '2026-11-09',
    timing_relationship: null,
    supply_contraction_ratio: '0.75',
    supply_measurement_confidence: 'LOW_BASELINE_DEPTH',
    confidence_is_probability: false,
    bid_role: 'QUOTE_QUALITY_CONTEXT_ONLY',
    coverage: {
      expected_slots: 288,
      qualified_paired_slots: 254,
      longest_missing_run: 6,
      quality: 'PARTIAL_USABLE',
    },
    retrospective_peak: null,
    retrospective_ended_on: null,
    ...overrides,
  }
}

export function itemCurrentFixture() {
  return {
    contract_name: 'single-item-current-public-api',
    contract_version: '1',
    response_kind: 'RESULT',
    operation: 'LIST',
    publication: {
      publication_id: CURRENT_PUBLICATION,
      parent_publication_id: null,
      manifest_sha256: '5'.repeat(64),
      rights_revision: '6'.repeat(64),
      published_at: '2026-09-13T00:03:00Z',
      withdrawn_at: null,
    },
    snapshot: {
      catalog_snapshot_id: '1'.repeat(64),
      membership_version: '2'.repeat(64),
      input_head_sha256: '3'.repeat(64),
      source_observed_through: '2026-09-12',
      source_available_through: '2026-09-13T00:01:00Z',
      imported_at: '2026-09-13T00:02:00Z',
    },
    release: {
      runtime_version: 'single-item-prospective-runtime/4',
      projection_version: 'single-item-prospective-stage/1',
      causal_kernel_version: 'single-item-causal-kernel/2.4',
      policy_sha256: '7'.repeat(64),
      coverage_policy_version: 'a'.repeat(64),
      full_member_count: 16978,
      evaluated_member_count: 2,
      public_stage_count: 2,
    },
    freshness: {
      evaluated_at: '2026-09-13T12:00:00Z',
      expected_latest_complete_date: '2026-09-12',
      lag_complete_days: 0,
      status: 'CURRENT',
      headline_data_date: '2026-09-12',
    },
    empty_reason: null,
    sort: 'DETECTED_DESC',
    page_size: 50,
    members: [
      member({
        stage_token: CURRENT_SECOND_STAGE_TOKEN,
        stage: 'PRICE_RESPONSE_ONLY',
        first_leg: 'PRICE',
        supply_onset: null,
        supply_detected_at: null,
        price_onset: '2026-09-11',
        price_detected_at: '2026-09-11T00:05:00Z',
        supply_contraction_ratio: null,
        supply_measurement_confidence: 'STANDARD',
        coverage: { expected_slots: 288, qualified_paired_slots: 288, longest_missing_run: 0, quality: 'FULL' },
      }),
      member({}),
    ],
    next_cursor: null,
  }
}

export function itemCurrentEmpty() {
  const value: any = itemCurrentFixture()
  value.response_kind = 'EMPTY'
  value.release.public_stage_count = 0
  value.empty_reason = 'NO_CURRENT_STAGE'
  value.members = []
  return value
}

export function itemCurrentError(code: 'NOT_PUBLISHED' | 'WITHDRAWN' | 'TEMPORARILY_UNAVAILABLE') {
  return {
    contract_name: 'single-item-current-public-api',
    contract_version: '1',
    response_kind: 'ERROR',
    error: { code, retryable: code === 'TEMPORARILY_UNAVAILABLE' },
  }
}
