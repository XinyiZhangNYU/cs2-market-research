import { canonicalHash } from './canonical'
import { validateSingleItemCurrentPublicApiResponse } from './generated/singleItemCurrentPublicApiValidator.js'
import type {
  ItemCurrentDocument,
  ItemCurrentErrorCode,
  ItemCurrentMember,
  ItemCurrentSort,
  ItemCurrentSuccess,
} from './itemCurrentPublicApiTypes'

export type ItemCurrentDecodeRequest =
  | Readonly<{ kind: 'LIST'; query: Readonly<{
      publication_id: string | null
      page_size: number
      cursor: string | null
      sort: ItemCurrentSort
      name_query: string | null
    }> }>
  | Readonly<{ kind: 'DETAIL'; query: Readonly<{ publication_id: string; stage_token: string }> }>

const decoded = new WeakSet<object>()
const ERROR_STATUS = Object.freeze({
  INVALID_REQUEST: 400,
  NOT_PUBLISHED: 404,
  NOT_FOUND: 404,
  WITHDRAWN: 410,
  STALE_EXPIRED: 410,
  CORRUPT_PUBLICATION: 503,
  TEMPORARILY_UNAVAILABLE: 503,
} satisfies Record<ItemCurrentErrorCode, number>)

export class ItemCurrentValidationError extends Error {
  constructor() {
    super('Item current response failed contract validation')
    this.name = 'ItemCurrentValidationError'
  }
}

function assert(condition: unknown): asserts condition {
  if (!condition) throw new ItemCurrentValidationError()
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

function day(value: string): number {
  return instant(`${value}T00:00:00.000Z`)
}

function decimalParts(value: string): readonly [string, string] {
  const [integer = '', fraction = ''] = value.split('.')
  return [integer.replace(/^0+(?=\d)/u, ''), fraction.replace(/0+$/u, '')]
}

function compareDecimal(left: string | null, right: string | null): number {
  const [leftInteger, leftFraction] = decimalParts(left ?? '0')
  const [rightInteger, rightFraction] = decimalParts(right ?? '0')
  if (leftInteger.length !== rightInteger.length) return leftInteger.length - rightInteger.length
  if (leftInteger !== rightInteger) return leftInteger < rightInteger ? -1 : 1
  const width = Math.max(leftFraction.length, rightFraction.length)
  const leftPadded = leftFraction.padEnd(width, '0')
  const rightPadded = rightFraction.padEnd(width, '0')
  return leftPadded === rightPadded ? 0 : leftPadded < rightPadded ? -1 : 1
}

function detected(member: ItemCurrentMember): number {
  const values = [member.supply_detected_at, member.price_detected_at]
    .filter((value): value is string => value !== null)
    .map(instant)
  assert(values.length > 0)
  return Math.max(...values)
}

function reliabilityRank(member: ItemCurrentMember): number {
  if (member.supply_contraction_ratio === null) return 2
  return member.supply_measurement_confidence === 'STANDARD' ? 0 : 1
}

function compareMembers(left: ItemCurrentMember, right: ItemCurrentMember, sort: ItemCurrentSort): number {
  if (sort === 'RELIABLE_SIGNAL_DESC') {
    const reliability = reliabilityRank(left) - reliabilityRank(right)
    if (reliability !== 0) return reliability
    const contraction = compareDecimal(right.supply_contraction_ratio, left.supply_contraction_ratio)
    if (contraction !== 0) return contraction
  }
  if (sort === 'SUPPLY_CONTRACTION_DESC') {
    const contraction = compareDecimal(right.supply_contraction_ratio, left.supply_contraction_ratio)
    if (contraction !== 0) return contraction
  }
  const clock = detected(right) - detected(left)
  return clock !== 0 ? clock : left.stage_token.localeCompare(right.stage_token)
}

function validateCoverage(member: ItemCurrentMember): void {
  const { qualified_paired_slots: slots, longest_missing_run: gap, quality } = member.coverage
  assert(slots >= 252 && gap <= 12 && gap <= 288 - slots)
  assert(quality === (slots === 288 && gap === 0 ? 'FULL' : slots >= 260 ? 'HIGH_COVERAGE' : 'PARTIAL_USABLE'))
}

function validateMember(member: ItemCurrentMember, document: ItemCurrentSuccess): void {
  const { projection_hash: projectionHash, ...projectionDocument } = member.catalog
  assert(canonicalHash(projectionDocument) === projectionHash)
  assert(member.catalog_snapshot_id === document.snapshot.catalog_snapshot_id)
  assert(member.catalog.localized_name.en === member.catalog.localized_name.en.trim())
  assert(member.catalog.localized_name.zh_cn === member.catalog.localized_name.zh_cn.trim())
  assert(member.catalog.media.status === 'BOUND'
    ? member.catalog.version_context.media_asset_version_id !== null
    : member.catalog.version_context.media_asset_version_id === null)
  assert(member.retrospective_peak === null && member.retrospective_ended_on === null)
  assert(member.confidence_is_probability === false && member.bid_role === 'QUOTE_QUALITY_CONTEXT_ONLY')
  assert(detected(member) <= instant(member.as_of) && instant(member.as_of) <= instant(document.snapshot.source_available_through))
  validateCoverage(member)

  const hasSupply = member.supply_onset !== null && member.supply_detected_at !== null
  const hasPrice = member.price_onset !== null && member.price_detected_at !== null
  assert((member.supply_onset === null) === (member.supply_detected_at === null))
  assert((member.price_onset === null) === (member.price_detected_at === null))
  if (member.stage === 'SUPPLY_PRESSURE') {
    assert(hasSupply && !hasPrice && member.first_leg === 'SUPPLY' && member.timing_relationship === null)
  } else if (member.stage === 'PRICE_RESPONSE_ONLY') {
    assert(!hasSupply && hasPrice && member.first_leg === 'PRICE' && member.timing_relationship === null)
  } else {
    assert(hasSupply && hasPrice && member.timing_relationship !== null)
  }
  assert((member.supply_contraction_ratio !== null) === hasSupply)
  assert(compareDecimal(member.supply_contraction_ratio, '0') >= 0 && compareDecimal(member.supply_contraction_ratio, '1') <= 0)
  if (member.supply_onset !== null) assert(day(member.supply_onset) <= day(member.pairing_deadline_on))
  if (member.price_onset !== null) assert(day(member.price_onset) <= day(member.pairing_deadline_on))
}

function validateSuccess(document: ItemCurrentSuccess, request: ItemCurrentDecodeRequest): void {
  assert(document.operation === request.kind)
  assert(document.publication.withdrawn_at === null)
  assert(instant(document.snapshot.source_available_through) <= instant(document.snapshot.imported_at))
  assert(instant(document.snapshot.imported_at) <= instant(document.publication.published_at))
  assert(document.release.evaluated_member_count <= document.release.full_member_count)
  assert(document.release.public_stage_count <= document.release.evaluated_member_count)
  assert(document.freshness.headline_data_date === document.snapshot.source_observed_through)
  assert(document.freshness.lag_complete_days === Math.round(
    (day(document.freshness.expected_latest_complete_date) - day(document.freshness.headline_data_date)) / 86_400_000,
  ))
  assert(document.freshness.status === (document.freshness.lag_complete_days === 0 ? 'CURRENT' : 'STALE_RETAINED'))
  assert(document.response_kind === (document.release.public_stage_count === 0 ? 'EMPTY' : 'RESULT'))
  assert(document.empty_reason === (document.release.public_stage_count === 0 ? 'NO_CURRENT_STAGE' : null))
  if (request.query.publication_id !== null) assert(document.publication.publication_id === request.query.publication_id)
  if (request.kind === 'DETAIL') {
    assert(document.page_size === 1 && document.members.length === 1 && document.next_cursor === null)
    assert(document.members[0]?.stage_token === request.query.stage_token)
  } else {
    assert(document.sort === request.query.sort && document.page_size === request.query.page_size)
    assert(document.members.length <= document.page_size)
    if (document.release.public_stage_count > 0) assert(document.members.length > 0)
  }
  const tokens = document.members.map((member) => member.stage_token)
  assert(tokens.length === new Set(tokens).size)
  document.members.forEach((member) => validateMember(member, document))
  for (let index = 1; index < document.members.length; index += 1) {
    assert(compareMembers(document.members[index - 1]!, document.members[index]!, document.sort) <= 0)
  }
}

export function decodeItemCurrentDocument(
  input: unknown,
  request: ItemCurrentDecodeRequest,
  httpStatus: number,
): ItemCurrentDocument {
  try {
    const document: unknown = structuredClone(input)
    assert(validateSingleItemCurrentPublicApiResponse(document))
    const typed = document as ItemCurrentDocument
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
    if (error instanceof ItemCurrentValidationError) throw error
    throw new ItemCurrentValidationError()
  }
}

export function isDecodedItemCurrentDocument(value: unknown): value is ItemCurrentDocument {
  return value !== null && typeof value === 'object' && decoded.has(value)
}
