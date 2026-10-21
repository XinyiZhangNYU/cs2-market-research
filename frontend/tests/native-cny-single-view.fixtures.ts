import { decodeNativeCnySingleDay, NATIVE_CNY_SINGLE_HOURLY_POLICY, NATIVE_CNY_SINGLE_PROTOCOL_SHA256 } from '../src/wire/nativeCnySingleDecode'
import type { NativeCnySingleBinding, NativeCnySingleDay } from '../src/wire/nativeCnySingleDecode'

export const pin = (character: string) => character.repeat(64)
export function singleSelection(itemId = '9223372036854775807'): NativeCnySingleBinding {
  return { itemId, publicationId: pin('a'), publicSha256: pin('b'), rightsSha256: pin('c'),
    reviewSha256: pin('d'), catalogPublicationId: pin('e'), day: '2026-10-03' }
}

/** Fresh local synthetic publication; never a live backend specimen. */
export function singleDocument(selection = singleSelection()): NativeCnySingleDay {
  return decodeNativeCnySingleDay({
    api_contract: 'native-cny-single-day/1', publication_id: selection.publicationId,
    public_sha256: selection.publicSha256, rights_sha256: selection.rightsSha256,
    review_sha256: selection.reviewSha256, released_at: '2026-10-04T02:00:00.000003+00:00',
    data: { schema: 'native-cny-single-public-day/1', basis: 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1',
      currency: 'CNY', fx_applied: false, method: 'CLAUDE_SEED_V2_HH55_X3',
      protocol_sha256: NATIVE_CNY_SINGLE_PROTOCOL_SHA256, hourly_policy: NATIVE_CNY_SINGLE_HOURLY_POLICY,
      day: selection.day, daily_origin: 'MEASURED_HOURLY_GRID',
      computed_at: '2026-10-04T01:00:00.000002+00:00', first_available_at: '2026-10-04T01:00:00.000001Z',
      knowledge_mode: 'RETROSPECTIVE_LATE_BOUND', catalog_publication_id: selection.catalogPublicationId,
      prospective_validation_credit: false,
      features: [{ item_id: BigInt(selection.itemId), analysis_unit_id: `item:${selection.itemId}`,
        stage: null, signals: { SUPPLY_LEAD: 'TRUE', RECENT_PERSISTENT: 'TRUE', COINCIDENT: 'UNKNOWN' },
        dispositions: { SUPPLY_LEAD: 'FIRST_ENTRY', RECENT_PERSISTENT: 'CONTINUATION', COINCIDENT: 'UNKNOWN' },
        first_available_at: '2026-10-04T01:00:00Z', history_state: 'UNKNOWN_NO_ARCHIVE_IDENTITY',
        baseline_month: '2026-09', qualified_baseline_days: 30n,
        current_qualified: true, recent_complete: true, reference_complete: false }],
      triggers: [{ trigger_id: pin('f'), item_id: BigInt(selection.itemId), family: 'SUPPLY_LEAD',
        entry_kind: 'FIRST_ENTRY', onset_day: selection.day, computed_at: '2026-10-04T01:00:00.000002+00:00',
        first_available_at: '2026-10-04T01:00:00Z', knowledge_mode: 'RETROSPECTIVE_LATE_BOUND', public_label: null }],
    },
  }, selection)
}

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
