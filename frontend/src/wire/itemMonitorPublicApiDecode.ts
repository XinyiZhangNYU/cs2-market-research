import { canonicalHash } from './canonical'
import { validateSingleItemMonitorPublicApiResponse } from './generated/singleItemMonitorPublicApiValidator.js'
import type {
  ItemMonitorDocument,
  ItemMonitorErrorCode,
  ItemMonitorMember,
  ItemMonitorSuccess,
} from './itemMonitorPublicApiTypes'

export type ItemMonitorDecodeRequest =
  | Readonly<{ kind: 'LIST'; query: Readonly<{ publication_id: string | null; page_size: number; cursor: string | null; sort: 'SIGNAL_TIME_DESC' }> }>
  | Readonly<{ kind: 'DETAIL'; query: Readonly<{ publication_id: string; analysis_unit_token: string }> }>

const decoded = new WeakSet<object>()
const ERROR_STATUS = Object.freeze({
  INVALID_REQUEST: 400,
  NOT_PUBLISHED: 404,
  NOT_FOUND: 404,
  WITHDRAWN: 410,
  STALE_EXPIRED: 410,
  CORRUPT_PUBLICATION: 503,
  TEMPORARILY_UNAVAILABLE: 503,
} satisfies Record<ItemMonitorErrorCode, number>)
const SIGNAL_ORDER = Object.freeze(['SUPPLY_LEAD', 'RECENT_PERSISTENT', 'COINCIDENT'] as const)

export class ItemMonitorValidationError extends Error {
  constructor() {
    super('Item monitor response failed contract validation')
    this.name = 'ItemMonitorValidationError'
  }
}

function assert(condition: unknown): asserts condition {
  if (!condition) throw new ItemMonitorValidationError()
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function instant(value: string): number {
  const parsed = Date.parse(value)
  assert(Number.isFinite(parsed))
  return parsed
}

function validateMember(member: ItemMonitorMember, document: ItemMonitorSuccess): void {
  const { projection_hash: projectionHash, ...projectionDocument } = member.catalog
  assert(canonicalHash(projectionDocument) === projectionHash)
  assert(member.catalog.analysis_unit_id === member.catalog.analysis_unit_id.trim())
  assert(member.catalog.base_item_code === member.catalog.base_item_code.trim())
  assert(member.catalog.localized_name.en === member.catalog.localized_name.en.trim())
  assert(member.catalog.localized_name.zh_cn === member.catalog.localized_name.zh_cn.trim())
  assert(member.catalog.analysis_unit_kind === 'BASE_MHN'
    ? member.catalog.parent_analysis_unit_id === null
    : member.catalog.parent_analysis_unit_id !== null)
  assert(member.analysis_unit_token === canonicalHash({
    contract: 'single-item-monitor-public-api', analysis_unit_id: member.catalog.analysis_unit_id,
  }))
  assert(member.catalog_snapshot_id === document.snapshot.catalog_snapshot_id)
  assert(member.coverage.qualified_paired_slots >= 260)
  assert(member.coverage.qualified_paired_slots <= member.coverage.expected_slots)
  assert(member.coverage.longest_missing_run <= 12)
  assert(member.coverage.longest_missing_run <= member.coverage.expected_slots - member.coverage.qualified_paired_slots)
  assert((member.coverage.longest_missing_run === 0) === (member.coverage.qualified_paired_slots === 288))
  assert(member.signal_events.length >= 1 && member.signal_events.length <= 3)
  const observed = instant(member.signal_observed_at)
  const observedDate = new Date(observed)
  assert(observedDate.getUTCHours() === 0 && observedDate.getUTCMinutes() === 0 && observedDate.getUTCSeconds() === 0 && observedDate.getUTCMilliseconds() === 0)
  assert(document.snapshot.start_date !== null && document.snapshot.end_date !== null)
  const signalDay = observed - 24 * 60 * 60 * 1000
  assert(signalDay >= Date.parse(`${document.snapshot.start_date}T00:00:00.000Z`))
  assert(signalDay <= Date.parse(`${document.snapshot.end_date}T00:00:00.000Z`))
  assert(instant(member.catalog.valid_from) <= observed)
  let previousOrder = -1
  for (const event of member.signal_events) {
    const order = SIGNAL_ORDER.indexOf(event.signal_family)
    assert(order > previousOrder)
    previousOrder = order
    assert(event.trigger_reasons.join('\u0000') === [event.signal_family, event.entry_kind].sort().join('\u0000'))
    assert(instant(event.known_at) >= observed)
    assert(instant(event.known_at) <= instant(document.snapshot.source_export_as_of))
  }
  if (member.catalog.media.status === 'BOUND') assert(member.catalog.version_context.media_asset_version_id !== null)
  else assert(member.catalog.version_context.media_asset_version_id === null)
}

function validateSuccess(document: ItemMonitorSuccess, request: ItemMonitorDecodeRequest): void {
  assert(document.operation === request.kind)
  assert(document.publication.withdrawn_at === null)
  assert(instant(document.snapshot.source_export_as_of) <= instant(document.snapshot.imported_at))
  assert(instant(document.snapshot.imported_at) <= instant(document.publication.published_at))
  assert(instant(document.publication.published_at) <= instant(document.freshness.evaluated_at))
  const disclosure = document.publication.clock_disclosure
  if (disclosure !== undefined && disclosure !== null) {
    assert(disclosure.status === 'PREPARED_CLOCK_NOT_ACTUAL')
    assert(disclosure.published_at_kind === 'PREPARED_VALUE')
    assert(disclosure.actual_public_available_at === null)
    assert(disclosure.reason === 'INITIAL_ACTIVE_APPLY_CLOCK_NOT_OBSERVED')
    assert(instant(document.publication.published_at) < instant(disclosure.known_not_before_at))
    assert(instant(disclosure.known_not_before_at) <= instant(disclosure.recorded_at))
    assert(instant(disclosure.recorded_at) <= instant(document.freshness.evaluated_at))
  }
  assert(document.release.public_member_count <= document.release.full_member_count)
  assert(document.release.pre_release_candidate_count + document.release.public_member_count <= document.release.source_candidate_count)
  if (document.snapshot.start_date === null || document.snapshot.end_date === null) {
    assert(document.snapshot.start_date === null && document.snapshot.end_date === null)
  } else {
    assert(Date.parse(document.snapshot.start_date) <= Date.parse(document.snapshot.end_date))
  }
  if (document.empty_reason === 'NO_QUALIFIED_OBSERVATION') {
    assert(document.snapshot.start_date === null && document.snapshot.end_date === null)
    assert(document.freshness.status === 'UNAVAILABLE')
    assert(document.freshness.lag_complete_days === null && document.freshness.headline_data_date === null)
    assert(document.release.source_candidate_count === 0)
  } else {
    assert(document.snapshot.start_date !== null && document.snapshot.end_date !== null)
    assert(Date.parse(`${document.snapshot.end_date}T00:00:00.000Z`) < instant(document.snapshot.source_export_as_of))
  }
  if (document.response_kind === 'EMPTY') {
    assert(document.members.length === 0 && document.release.public_member_count === 0)
    assert(document.empty_reason !== null && document.next_cursor === null)
  } else {
    assert(document.release.public_member_count > 0 && document.empty_reason === null)
  }
  if (request.query.publication_id !== null) {
    assert(document.publication.publication_id === request.query.publication_id)
  }
  if (request.kind === 'DETAIL') {
    assert(document.page_size === 1 && document.members.length === 1 && document.next_cursor === null)
    assert(document.members[0]?.analysis_unit_token === request.query.analysis_unit_token)
  } else {
    assert(document.page_size === request.query.page_size)
    if (request.query.cursor !== null) assert(document.publication.publication_id === request.query.publication_id)
  }
  const tokens = document.members.map((member) => member.analysis_unit_token)
  assert(tokens.length === new Set(tokens).size)
  assert(document.members.length <= document.page_size)
  document.members.forEach((member) => validateMember(member, document))
  for (let index = 1; index < document.members.length; index += 1) {
    const before = document.members[index - 1]
    const current = document.members[index]
    assert(before !== undefined && current !== undefined)
    const timeOrder = instant(before.signal_observed_at) - instant(current.signal_observed_at)
    assert(timeOrder > 0 || (timeOrder === 0 && before.catalog.localized_name.en <= current.catalog.localized_name.en))
  }
  const expected = new Date(instant(document.freshness.evaluated_at) - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  assert(document.freshness.expected_latest_complete_date === expected)
  if (document.snapshot.end_date === null) {
    assert(document.freshness.status === 'UNAVAILABLE' && document.freshness.lag_complete_days === null && document.freshness.headline_data_date === null)
  } else {
    const lag = Math.round((Date.parse(`${expected}T00:00:00.000Z`) - Date.parse(`${document.snapshot.end_date}T00:00:00.000Z`)) / (24 * 60 * 60 * 1000))
    assert(lag >= 0 && document.freshness.lag_complete_days === lag)
    assert(document.freshness.status === (lag === 0 ? 'CURRENT' : 'STALE_RETAINED'))
    assert(document.freshness.headline_data_date === document.snapshot.end_date)
  }
}

export function decodeItemMonitorDocument(
  input: unknown,
  request: ItemMonitorDecodeRequest,
  httpStatus: number,
): ItemMonitorDocument {
  try {
    const document: unknown = structuredClone(input)
    assert(validateSingleItemMonitorPublicApiResponse(document))
    const typed = document as ItemMonitorDocument
    if (typed.response_kind === 'ERROR') {
      assert(ERROR_STATUS[typed.error.code] === httpStatus)
      assert(typed.error.retryable === (typed.error.code === 'TEMPORARILY_UNAVAILABLE'))
    } else {
      assert(httpStatus === 200)
      validateSuccess(typed, request)
    }
    deepFreeze(typed)
    decoded.add(typed)
    return typed
  } catch (error) {
    if (error instanceof ItemMonitorValidationError) throw error
    throw new ItemMonitorValidationError()
  }
}

export function isDecodedItemMonitorDocument(value: unknown): value is ItemMonitorDocument {
  return value !== null && typeof value === 'object' && decoded.has(value)
}
