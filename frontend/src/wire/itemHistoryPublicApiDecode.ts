import { canonicalHash } from './canonical'
import { validateSingleItemHistoryPublicApiResponse } from './generated/singleItemHistoryPublicApiValidator.js'
import type {
  ItemHistoryDocument,
  ItemHistoryErrorCode,
  ItemHistoryMember,
  ItemHistoryRelease,
  ItemHistorySort,
  ItemHistorySuccess,
  ItemHistoryTimingRelationship,
} from './itemHistoryPublicApiTypes'

export type ItemHistoryDecodeRequest =
  | Readonly<{ kind: 'LIST'; query: Readonly<{
      publication_id: string | null
      page_size: number
      cursor: string | null
      sort: ItemHistorySort
      name_query: string | null
    }> }>
  | Readonly<{ kind: 'DETAIL'; query: Readonly<{ publication_id: string; history_event_token: string }> }>

const decoded = new WeakSet<object>()
const ERROR_STATUS = Object.freeze({
  INVALID_REQUEST: 400,
  NOT_PUBLISHED: 404,
  NOT_FOUND: 404,
  WITHDRAWN: 410,
  STALE_EXPIRED: 410,
  CORRUPT_PUBLICATION: 503,
  TEMPORARILY_UNAVAILABLE: 503,
} satisfies Record<ItemHistoryErrorCode, number>)

export class ItemHistoryValidationError extends Error {
  constructor() {
    super('Item history response failed contract validation')
    this.name = 'ItemHistoryValidationError'
  }
}

function assert(condition: unknown): asserts condition {
  if (!condition) throw new ItemHistoryValidationError()
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

function timingRelationship(supplyOnset: string, priceOnset: string): ItemHistoryTimingRelationship {
  if (supplyOnset < priceOnset) return 'SUPPLY_LEADS'
  if (priceOnset < supplyOnset) return 'PRICE_LEADS'
  return 'CONCURRENT_DAILY'
}

export function validateDisplayReleaseIdentity(release: ItemHistoryRelease): void {
  const fields = [
    release.display_episode_contract,
    release.display_episode_policy_sha256,
    release.display_episode_lineage_sha256,
  ]
  assert(fields.every((value) => value === undefined) || fields.every((value) => value !== undefined))
}

export function validateDisplayEpisodeMember(member: ItemHistoryMember, release: ItemHistoryRelease): void {
  if (release.display_episode_contract === undefined) return
  const native = member.representative_native
  assert(release.display_episode_contract === 'single-item-history-display-episode/2')
  assert(native !== undefined)
  assert(member.display_episode_timeline_scope === 'DISPLAY_EPISODE_GROUP')
  assert(Number.isInteger(member.display_episode_source_cycle_count) && member.display_episode_source_cycle_count! >= 1)
  assert(member.catalog.analysis_unit_id === `item:${native.item_id}`)
  const observed = instant(`${member.observed_through}T00:00:00.000Z`)
  const groupStart = instant(`${member.statistics_from}T00:00:00.000Z`)
  const groupEnd = instant(`${member.statistics_through}T00:00:00.000Z`)
  const groupSupply = instant(`${member.supply_onset}T00:00:00.000Z`)
  const groupPrice = instant(`${member.price_onset}T00:00:00.000Z`)
  const groupDetected = instant(`${member.pairing_detected_on}T00:00:00.000Z`)
  const nativeStart = instant(`${native.statistics_from}T00:00:00.000Z`)
  const nativeEnd = instant(`${native.statistics_through}T00:00:00.000Z`)
  const nativePeak = instant(`${native.peak_on}T00:00:00.000Z`)
  const nativeSupply = instant(`${native.supply_onset}T00:00:00.000Z`)
  const nativePrice = instant(`${native.price_onset}T00:00:00.000Z`)
  const nativeDetected = instant(`${native.pairing_detected_on}T00:00:00.000Z`)
  assert(groupStart <= groupSupply && groupSupply <= groupEnd)
  assert(groupStart <= groupPrice && groupPrice <= groupEnd)
  assert(Math.max(groupSupply, groupPrice) <= groupDetected && groupDetected <= groupEnd)
  assert(nativeStart <= nativeSupply && nativeSupply <= nativeEnd)
  assert(nativeStart <= nativePrice && nativePrice <= nativeEnd)
  assert(Math.max(nativeSupply, nativePrice) <= nativeDetected && nativeDetected <= nativeEnd)
  assert(nativeStart <= nativePeak && nativePeak <= nativeEnd && nativeEnd <= observed)
  assert(member.timing_relationship === timingRelationship(member.supply_onset, member.price_onset))
  assert(native.timing_relationship === timingRelationship(native.supply_onset, native.price_onset))
  assert(native.peak_on === member.peak_on)
  const differs = member.timing_relationship !== native.timing_relationship ||
    member.supply_onset !== native.supply_onset || member.price_onset !== native.price_onset ||
    member.pairing_detected_on !== native.pairing_detected_on ||
    member.statistics_from !== native.statistics_from || member.statistics_through !== native.statistics_through
  assert(member.group_timeline_includes_other_variants === differs)
}

function decimalParts(value: string): readonly [string, string] {
  const [integer = '', fraction = ''] = value.split('.')
  return [integer.replace(/^0+(?=\d)/u, ''), fraction.replace(/0+$/u, '')]
}

function compareDecimal(left: string, right: string): number {
  const [leftInteger, leftFraction] = decimalParts(left)
  const [rightInteger, rightFraction] = decimalParts(right)
  if (leftInteger.length !== rightInteger.length) return leftInteger.length - rightInteger.length
  if (leftInteger !== rightInteger) return leftInteger < rightInteger ? -1 : 1
  const width = Math.max(leftFraction.length, rightFraction.length)
  const leftPadded = leftFraction.padEnd(width, '0')
  const rightPadded = rightFraction.padEnd(width, '0')
  return leftPadded === rightPadded ? 0 : leftPadded < rightPadded ? -1 : 1
}

function compareMembers(left: ItemHistoryMember, right: ItemHistoryMember, sort: ItemHistorySort): number {
  if (sort === 'MAX_PRICE_MULTIPLE_DESC') {
    const multiple = compareDecimal(right.maximum_price_multiple, left.maximum_price_multiple)
    if (multiple !== 0) return multiple
    const onset = right.supply_onset.localeCompare(left.supply_onset)
    if (onset !== 0) return onset
  } else {
    const onset = right.supply_onset.localeCompare(left.supply_onset)
    if (onset !== 0) return onset
    const multiple = compareDecimal(right.maximum_price_multiple, left.maximum_price_multiple)
    if (multiple !== 0) return multiple
  }
  return left.history_event_token.localeCompare(right.history_event_token)
}

function validateMember(member: ItemHistoryMember, document: ItemHistorySuccess): void {
  const { projection_hash: projectionHash, ...projectionDocument } = member.catalog
  assert(canonicalHash(projectionDocument) === projectionHash)
  assert(member.catalog_snapshot_id === document.snapshot.catalog_snapshot_id)
  assert(member.catalog.localized_name.en === member.catalog.localized_name.en.trim())
  assert(member.catalog.localized_name.zh_cn === member.catalog.localized_name.zh_cn.trim())
  assert(member.catalog.media.status === 'BOUND'
    ? member.catalog.version_context.media_asset_version_id !== null
    : member.catalog.version_context.media_asset_version_id === null)
  assert(member.manipulation_label === null && member.event_end_is_economic_claim === false)
  assert(instant(`${member.statistics_from}T00:00:00.000Z`) <= instant(`${member.statistics_through}T00:00:00.000Z`))
  assert(instant(`${member.peak_on}T00:00:00.000Z`) >= instant(`${member.statistics_from}T00:00:00.000Z`))
  assert(instant(`${member.peak_on}T00:00:00.000Z`) <= instant(`${member.statistics_through}T00:00:00.000Z`))
  assert(instant(`${member.observed_through}T00:00:00.000Z`) >= instant(`${member.statistics_through}T00:00:00.000Z`))
  validateDisplayEpisodeMember(member, document.release)
}

function validateSuccess(document: ItemHistorySuccess, request: ItemHistoryDecodeRequest): void {
  assert(document.operation === request.kind)
  assert(document.publication.withdrawn_at === null)
  assert(instant(document.snapshot.imported_at) <= instant(document.publication.published_at))
  assert(document.release.public_event_count <= document.release.source_event_count)
  validateDisplayReleaseIdentity(document.release)
  if (request.query.publication_id !== null) assert(document.publication.publication_id === request.query.publication_id)
  if (request.kind === 'DETAIL') {
    assert(document.page_size === 1 && document.members.length === 1 && document.next_cursor === null)
    assert(document.members[0]?.history_event_token === request.query.history_event_token)
  } else {
    assert(document.sort === request.query.sort && document.page_size === request.query.page_size)
    assert(document.members.length > 0 && document.members.length <= document.page_size)
  }
  const tokens = document.members.map((member) => member.history_event_token)
  assert(tokens.length === new Set(tokens).size)
  document.members.forEach((member) => validateMember(member, document))
  for (let index = 1; index < document.members.length; index += 1) {
    assert(compareMembers(document.members[index - 1]!, document.members[index]!, document.sort) <= 0)
  }
}

export function decodeItemHistoryDocument(
  input: unknown,
  request: ItemHistoryDecodeRequest,
  httpStatus: number,
): ItemHistoryDocument {
  try {
    const document: unknown = structuredClone(input)
    assert(validateSingleItemHistoryPublicApiResponse(document))
    const typed = document as ItemHistoryDocument
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
    if (error instanceof ItemHistoryValidationError) throw error
    throw new ItemHistoryValidationError()
  }
}

export function isDecodedItemHistoryDocument(value: unknown): value is ItemHistoryDocument {
  return value !== null && typeof value === 'object' && decoded.has(value)
}
