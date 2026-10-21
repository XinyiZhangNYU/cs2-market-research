import type { ErrorObject } from 'ajv/dist/2020'
import { compareCodePoints } from './canonical'
import { verifyCatalogDisplayMemberForSnapshot } from './catalogDisplayApiDecode'
import {
  CATALOG_DISPLAY_QUERY_API_SCHEMA_ID,
  CATALOG_NAVIGATION_PROFILE_SHA256,
  CATALOG_NAVIGATION_SOURCE_MAPPING_SHA256,
} from './catalogDisplayQueryApiSchema'
import type {
  CatalogQuerySort,
  CatalogQueryItemCategory,
  ValidatedCatalogDisplayQueryResponse,
  WireCatalogDetailResponse,
  WireCatalogDisplayQueryResponse,
  WireCatalogQueryError,
  WireCatalogQueryImageCounts,
  WireCatalogSeriesResponse,
  WireCatalogUnitsResponse,
} from './catalogDisplayQueryApiTypes'
import type { WireCatalogDisplayMember } from './catalogDisplayApiTypes'
import { validateCatalogDisplayQueryApiResponse } from './generated/catalogDisplayQueryApiValidator.js'
import { normalizeCatalogQueryText } from '../catalog/catalogQueryText'
import { compareCatalogSeriesProduct } from '../catalog/catalogSeriesPresentation'

export { validateCatalogDisplayQueryApiResponse }
export { normalizeCatalogQueryText } from '../catalog/catalogQueryText'

export class CatalogDisplayQueryWireViolation extends Error {
  readonly errors: readonly ErrorObject[]

  constructor(errors: readonly ErrorObject[]) {
    super(
      `catalog query response rejected by ${CATALOG_DISPLAY_QUERY_API_SCHEMA_ID}: ` +
        errors.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; '),
    )
    this.name = 'CatalogDisplayQueryWireViolation'
    this.errors = errors
  }
}

export type CatalogDisplayQuerySemanticRule =
  | 'ERROR_SHAPE'
  | 'PROFILE_BINDING'
  | 'SNAPSHOT_BINDING'
  | 'PAGE_ACCOUNTING'
  | 'QUERY_MEMBER_MATCH'
  | 'SORT_ORDER'
  | 'FACET_ACCOUNTING'
  | 'QUERY_SHAPE'

export class CatalogDisplayQuerySemanticViolation extends Error {
  constructor(
    readonly rule: CatalogDisplayQuerySemanticRule,
    message: string,
  ) {
    super(message)
    this.name = 'CatalogDisplayQuerySemanticViolation'
  }
}

function fail(rule: CatalogDisplayQuerySemanticRule, message: string): never {
  throw new CatalogDisplayQuerySemanticViolation(rule, message)
}

const ERROR_SHAPES = {
  INVALID_ARGUMENT: { http_status: 400, retryable: false },
  INVALID_CURSOR: { http_status: 400, retryable: false },
  NOT_FOUND: { http_status: 404, retryable: false },
  CONTRACT_UNAVAILABLE: { http_status: 503, retryable: true },
  RECORD_CORRUPT: { http_status: 503, retryable: false },
  BACKEND_UNAVAILABLE: { http_status: 503, retryable: true },
} as const

const EDITION_ORDER = ['STANDARD', 'STATTRAK', 'SOUVENIR', 'UNKNOWN'] as const
const WEAR_ORDER = [
  'FACTORY_NEW',
  'MINIMAL_WEAR',
  'FIELD_TESTED',
  'WELL_WORN',
  'BATTLE_SCARRED',
  'NOT_APPLICABLE',
  'UNKNOWN',
] as const
function verifyError(response: WireCatalogQueryError): void {
  const expected = ERROR_SHAPES[response.error.code]
  if (
    response.error.http_status !== expected.http_status ||
    response.error.retryable !== expected.retryable
  ) {
    fail('ERROR_SHAPE', 'catalog query error status or retryability is inconsistent')
  }
}

function verifyProfilesAndSnapshot(
  response: Exclude<WireCatalogDisplayQueryResponse, WireCatalogQueryError>,
): void {
  const profiles = response.profiles
  if (
    profiles.navigation_version !== 'v1' ||
    profiles.navigation_sha256 !== CATALOG_NAVIGATION_PROFILE_SHA256 ||
    profiles.source_mapping_sha256 !== CATALOG_NAVIGATION_SOURCE_MAPPING_SHA256 ||
    profiles.search_profile !== 'ECMASCRIPT_NFKC_WS_LOWER_V1' ||
    profiles.sort_profile !== 'LOCALIZED_CODEPOINT_V1'
  ) {
    fail('PROFILE_BINDING', 'catalog query response does not use the frozen navigation profile')
  }
  if (response.query.snapshot_id !== response.snapshot.snapshot_id) {
    fail('SNAPSHOT_BINDING', 'catalog query response mixed snapshot identities')
  }
}

function verifyImageCounts(counts: WireCatalogQueryImageCounts, expected?: number): void {
  if (counts.bound + counts.not_produced !== counts.total) {
    fail('FACET_ACCOUNTING', 'catalog query image counts do not add up')
  }
  if (expected !== undefined && counts.total !== expected) {
    fail('FACET_ACCOUNTING', 'catalog query image total disagrees with its eligible set')
  }
}

function verifyMembers(
  members: readonly WireCatalogDisplayMember[],
  response: Exclude<WireCatalogDisplayQueryResponse, WireCatalogQueryError>,
): void {
  const identifiers = new Set<string>()
  for (const member of members) {
    verifyCatalogDisplayMemberForSnapshot(member, response.snapshot)
    const identifier = member.projection.analysis_unit_id
    if (identifiers.has(identifier)) {
      fail('PAGE_ACCOUNTING', 'catalog query page repeats an analysis-unit identity')
    }
    identifiers.add(identifier)
  }
}

function compareMembers(
  left: WireCatalogDisplayMember,
  right: WireCatalogDisplayMember,
  locale: 'en' | 'zh_cn',
  sort: CatalogQuerySort,
): number {
  if (sort === 'EDITION_ASC') {
    const difference = EDITION_ORDER.indexOf(left.projection.edition_kind) -
      EDITION_ORDER.indexOf(right.projection.edition_kind)
    if (difference !== 0) return difference
  }
  if (sort === 'WEAR_ASC') {
    const difference = WEAR_ORDER.indexOf(left.projection.wear_tier) -
      WEAR_ORDER.indexOf(right.projection.wear_tier)
    if (difference !== 0) return difference
  }
  const name = compareCodePoints(
    normalizeCatalogQueryText(left.projection.localized_name[locale]),
    normalizeCatalogQueryText(right.projection.localized_name[locale]),
  )
  return name || compareCodePoints(
    left.projection.analysis_unit_id,
    right.projection.analysis_unit_id,
  )
}

function verifyPageShape(
  members: readonly unknown[],
  pageSize: number,
  nextCursor: string | null,
  total: number,
): void {
  if (members.length > pageSize || members.length > total) {
    fail('PAGE_ACCOUNTING', 'catalog query page exceeds its page size or total')
  }
  if (nextCursor !== null && members.length !== pageSize) {
    fail('PAGE_ACCOUNTING', 'continued catalog query pages must fill page_size')
  }
  if (members.length === 0 && total !== 0) {
    fail('PAGE_ACCOUNTING', 'a valid catalog query page cannot be empty inside a nonempty result')
  }
}

function itemCategory(member: WireCatalogDisplayMember): CatalogQueryItemCategory | null {
  const projection = member.projection
  if (projection.item_kind === 'WEAPON') {
    if (projection.edition_kind === 'STANDARD') return 'NORMAL'
    if (projection.edition_kind === 'STATTRAK') return 'STATTRAK'
    if (projection.edition_kind === 'SOUVENIR') return 'SOUVENIR'
  }
  if (projection.item_kind === 'KNIFE' || projection.item_kind === 'GLOVE') {
    if (projection.edition_kind === 'STANDARD') return 'STAR'
    if (projection.edition_kind === 'STATTRAK') return 'STAR_STATTRAK'
  }
  return null
}

function strictlyOrdered<T extends string>(
  values: readonly T[],
  order: readonly T[],
): boolean {
  return values.every((value, index) =>
    index === 0 || order.indexOf(values[index - 1]) < order.indexOf(value),
  )
}

function verifySeries(response: WireCatalogSeriesResponse): void {
  if (response.query.sort === 'DISCOVERY') {
    if (response.query.equipment_selection_id !== 'GLOBAL' ||
      !/^[A-Za-z0-9._-]{1,128}$/u.test(response.query.discovery_seed ?? '') ||
      [response.query.rarity, response.query.item_category, response.query.wear_tier, response.query.search_text].some((value) => value !== null)) {
      fail('QUERY_SHAPE', 'discovery requires a bounded seed and unfiltered global scope')
    }
  } else if (response.query.discovery_seed !== undefined) {
    fail('QUERY_SHAPE', 'discovery seed is only valid for discovery')
  }
  verifyPageShape(
    response.members,
    response.query.page_size,
    response.next_cursor,
    response.total_matching_series,
  )
  const keys = new Set<string>()
  const expectedSearch = response.query.search_text === null
    ? null
    : normalizeCatalogQueryText(response.query.search_text)
  if (
    expectedSearch === '' ||
    expectedSearch !== response.query.search_normalized
  ) {
    fail('QUERY_SHAPE', 'series search text does not match the frozen normalization profile')
  }
  for (const member of response.members) {
    verifyMembers([member.representative], response)
    const projection = member.representative.projection
    if (
      projection.item_kind !== member.item_kind ||
      projection.base_item_code !== member.base_item_code ||
      member.equipment_model_id.length === 0 ||
      member.category_id.length === 0 ||
      member.matched_member_count > response.snapshot.member_count ||
      (response.query.rarity !== null && member.rarity !== response.query.rarity) ||
      (response.query.item_category !== null &&
        itemCategory(member.representative) !== response.query.item_category) ||
      (response.query.wear_tier !== null && projection.wear_tier !== response.query.wear_tier)
    ) {
      fail('QUERY_MEMBER_MATCH', 'series representative does not match its exact series identity')
    }
    const key = `${member.item_kind}\u0000${member.base_item_code}`
    if (keys.has(key)) fail('PAGE_ACCOUNTING', 'series page repeats a series identity')
    keys.add(key)
  }
  for (let index = 1; index < response.members.length; index += 1) {
    if (response.query.sort === 'DISCOVERY') break
    if (response.query.sort === 'PRODUCT') {
      const left = response.members[index - 1]
      const right = response.members[index]
      const order = compareCatalogSeriesProduct(left, right, response.query.locale)
      if (order >= 0) fail('SORT_ORDER', 'series page is not in product order')
      continue
    }
    if (
      compareMembers(
        response.members[index - 1].representative,
        response.members[index].representative,
        response.query.locale,
        'NAME_ASC',
      ) >= 0
    ) {
      fail('SORT_ORDER', 'series page is not in frozen localized code-point order')
    }
  }
}

function verifyUnits(response: WireCatalogUnitsResponse): void {
  verifyPageShape(
    response.members,
    response.query.page_size,
    response.next_cursor,
    response.total_matching_members,
  )
  verifyMembers(response.members, response)
  if (
    !strictlyOrdered(response.query.edition_kinds, EDITION_ORDER) ||
    !strictlyOrdered(response.query.wear_tiers, WEAR_ORDER)
  ) {
    fail('QUERY_SHAPE', 'unit edition/wear filters are not in frozen enum order')
  }
  const editions = new Set(response.query.edition_kinds)
  const wears = new Set(response.query.wear_tiers)
  for (const member of response.members) {
    const projection = member.projection
    if (
      projection.item_kind !== response.query.item_kind ||
      projection.base_item_code !== response.query.base_item_code ||
      !editions.has(projection.edition_kind) ||
      !wears.has(projection.wear_tier) ||
      (response.query.item_category !== null &&
        itemCategory(member) !== response.query.item_category)
    ) {
      fail('QUERY_MEMBER_MATCH', 'unit does not match the echoed series/filter query')
    }
  }
  for (let index = 1; index < response.members.length; index += 1) {
    if (
      compareMembers(
        response.members[index - 1],
        response.members[index],
        response.query.locale,
        response.query.sort,
      ) >= 0
    ) {
      fail('SORT_ORDER', 'unit page is not in frozen localized code-point order')
    }
  }
  const editionValues = response.facet.edition_counts.map(({ value }) => value)
  const wearValues = response.facet.wear_counts.map(({ value }) => value)
  if (
    editionValues.some((value, index) => EDITION_ORDER.indexOf(value) <= EDITION_ORDER.indexOf(editionValues[index - 1] ?? '')) ||
    wearValues.some((value, index) => WEAR_ORDER.indexOf(value) <= WEAR_ORDER.indexOf(wearValues[index - 1] ?? ''))
  ) {
    fail('FACET_ACCOUNTING', 'facet options are not in canonical enum order')
  }
  if (
    response.facet.edition_counts.reduce((sum, entry) => sum + entry.count, 0) !== response.facet.eligible_member_count ||
    response.facet.wear_counts.reduce((sum, entry) => sum + entry.count, 0) !== response.facet.eligible_member_count
  ) {
    fail('FACET_ACCOUNTING', 'edition/wear facet counts do not cover the eligible series')
  }
  verifyImageCounts(response.facet.image_counts, response.facet.eligible_member_count)
}

function verifyDetail(response: WireCatalogDetailResponse): void {
  verifyMembers([response.member], response)
  verifyMembers(response.siblings, response)
  if (response.member.projection.analysis_unit_id !== response.query.analysis_unit_id) {
    fail('QUERY_MEMBER_MATCH', 'detail member does not match requested analysis-unit identity')
  }
  if (response.siblings.length > response.query.page_size || response.siblings.length > response.sibling_total) {
    fail('PAGE_ACCOUNTING', 'detail sibling page exceeds its page size or total')
  }
  if (response.next_cursor !== null && response.siblings.length !== response.query.page_size) {
    fail('PAGE_ACCOUNTING', 'continued detail sibling pages must fill page_size')
  }
  for (const sibling of response.siblings) {
    if (
      sibling.projection.item_kind !== response.member.projection.item_kind ||
      sibling.projection.base_item_code !== response.member.projection.base_item_code
    ) {
      fail('QUERY_MEMBER_MATCH', 'detail sibling does not share the member series identity')
    }
  }
  for (let index = 1; index < response.siblings.length; index += 1) {
    if (
      compareCodePoints(
        response.siblings[index - 1].projection.analysis_unit_id,
        response.siblings[index].projection.analysis_unit_id,
      ) >= 0
    ) {
      fail('SORT_ORDER', 'detail siblings are not in stable identity order')
    }
  }
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  Object.freeze(value)
  for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry)
}

const SEALED_RESPONSES = new WeakMap<object, WireCatalogDisplayQueryResponse['response_kind']>()

export function isValidatedCatalogDisplayQueryResponse(
  value: unknown,
  kind?: WireCatalogDisplayQueryResponse['response_kind'],
): value is ValidatedCatalogDisplayQueryResponse {
  if (value === null || typeof value !== 'object') return false
  const actual = SEALED_RESPONSES.get(value)
  return actual !== undefined && (kind === undefined || actual === kind)
}

export function decodeCatalogDisplayQueryApiResponse(
  payload: unknown,
): ValidatedCatalogDisplayQueryResponse {
  if (!validateCatalogDisplayQueryApiResponse(payload)) {
    throw new CatalogDisplayQueryWireViolation(
      validateCatalogDisplayQueryApiResponse.errors ?? [],
    )
  }
  const response = structuredClone(payload) as WireCatalogDisplayQueryResponse
  if (response.response_kind === 'ERROR') {
    verifyError(response)
  } else {
    verifyProfilesAndSnapshot(response)
    if (response.response_kind === 'CATALOG_QUERY_BOOTSTRAP') {
      verifyImageCounts(response.image_counts, response.snapshot.member_count)
      const categories = new Set<string>()
      for (const entry of response.categories) {
        if (
          categories.has(entry.category_id) ||
          entry.member_count > response.snapshot.member_count ||
          entry.series_count > entry.member_count
        ) {
          fail('PAGE_ACCOUNTING', 'bootstrap category accounting is duplicated or impossible')
        }
        categories.add(entry.category_id)
      }
      const equipment = new Set<string>()
      for (const entry of response.equipment) {
        if (
          equipment.has(entry.selection_id) ||
          !categories.has(entry.category_id) ||
          entry.member_count > response.snapshot.member_count ||
          entry.series_count > entry.member_count
        ) {
          fail('PAGE_ACCOUNTING', 'bootstrap equipment accounting is duplicated or impossible')
        }
        equipment.add(entry.selection_id)
      }
    } else if (response.response_kind === 'CATALOG_QUERY_SERIES') {
      verifySeries(response)
    } else if (response.response_kind === 'CATALOG_QUERY_UNITS') {
      verifyUnits(response)
    } else {
      verifyDetail(response)
    }
  }
  deepFreeze(response)
  SEALED_RESPONSES.set(response, response.response_kind)
  return response as ValidatedCatalogDisplayQueryResponse
}
