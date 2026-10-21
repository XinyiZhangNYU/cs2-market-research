import monitorFixture from '../../../schemas/examples/single-item-monitor-public-api/v1/result.json'

export const HISTORY_PUBLICATION = '5'.repeat(64)
export const HISTORY_EVENT_TOKEN = '9'.repeat(64)

export function itemHistoryFixture() {
  return {
    contract_name: 'single-item-history-public-api',
    contract_version: '1',
    response_kind: 'RESULT',
    operation: 'LIST',
    publication: {
      publication_id: HISTORY_PUBLICATION,
      parent_publication_id: null,
      manifest_sha256: '6'.repeat(64),
      rights_revision: '7'.repeat(64),
      published_at: '2026-09-17T00:04:00Z',
      withdrawn_at: null,
    },
    snapshot: {
      source_contract: 'single-item-history-family-relation/2.4',
      source_manifest_sha256: '1'.repeat(64),
      source_family_events_sha256: '2'.repeat(64),
      catalog_snapshot_id: '3'.repeat(64),
      input_event_count: 120,
      history_observed_through: '2026-08-26',
      imported_at: '2026-09-13T18:00:00Z',
    },
    release: {
      release_id: '4'.repeat(64),
      algorithm_version: 'single-item-history-reconstruction/2.4',
      causal_kernel_version: 'single-item-causal-kernel/2.4',
      source_generator_commit: 'a'.repeat(40),
      accepted_verifier_commit: 'b'.repeat(40),
      version_contract_sha256: '8'.repeat(64),
      scope: 'HISTORICAL_ANOMALY_CYCLES',
      source_event_count: 120,
      public_event_count: 1,
      manipulation_labels_enabled: false,
    },
    sort: 'MAX_PRICE_MULTIPLE_DESC',
    page_size: 50,
    members: [{
      history_event_token: HISTORY_EVENT_TOKEN,
      catalog_snapshot_id: '3'.repeat(64),
      catalog: structuredClone(monitorFixture.members[0].catalog),
      product_pool: 'ORDINARY',
      family_cycle_ordinal: 2,
      timing_relationship: 'SUPPLY_LEADS',
      knowledge_mode: 'RETROSPECTIVE_LATE_BOUND',
      supply_onset: '2025-01-01',
      price_onset: '2025-01-10',
      pairing_detected_on: '2025-01-11',
      observed_through: '2025-03-01',
      statistics_from: '2025-01-01',
      statistics_through: '2025-03-01',
      peak_on: '2025-02-01',
      baseline_ask_usd: '10',
      peak_ask_usd: '30',
      maximum_price_multiple: '3',
      baseline_supply: '100',
      minimum_supply: 25,
      remaining_supply_ratio: '0.25',
      supply_contraction_ratio: '0.75',
      supply_measurement_confidence: 'LOW_BASELINE_DEPTH',
      related_variant_count: 3,
      event_end_is_economic_claim: false,
      manipulation_label: null,
    }],
    next_cursor: null,
  }
}

export function itemHistoryError(code: 'NOT_PUBLISHED' | 'WITHDRAWN' | 'TEMPORARILY_UNAVAILABLE') {
  return {
    contract_name: 'single-item-history-public-api',
    contract_version: '1',
    response_kind: 'ERROR',
    error: { code, retryable: code === 'TEMPORARILY_UNAVAILABLE' },
  }
}
