// The second contract layer, transcribed from src/cs2_research/result/models.py.
//
// JSON Schema Draft 2020-12 cannot express any of this: cross-field time order, the identity
// and accounting equalities, or the canonical-hash identity of a document. The schema is the
// structural boundary; this file is the semantic one. Both must agree with Python, and
// tests/wire-semantic.test.ts drives all of schemas/examples/semantic-cases.v1.json through
// them to show that they do.
import { validateClaims } from '../contract/claims'
import type { ClaimCode as ClaimCodeValue, DataBranch as DataBranchValue } from '../contract/enums'
import { isSortedByCodePoint, snapshotIdOf, sortedByCodePoint } from './canonical'
import { schemaEnum, schemaPattern, schemaRequired } from './schema'

// One source for the rule names: the union is derived from the array, so a rule can be renamed
// or added in exactly one place, and tests/wire-semantic.test.ts can check the shared probe file
// against the same list at run time.
export const SEMANTIC_RULES = [
  'EXACT_KEY_SET',
  'ENVELOPE_KIND',
  'NONBLANK_NUL_FREE_TEXT',
  'NONBLANK_UNICODE_SCALAR_TEXT',
  'CANONICAL_UTC_TIMESTAMP',
  'SHA256_DIGEST',
  'ENUM_MEMBER',
  'UNIT_TIME_ORDER',
  'IDENTITY_TIME_ORDER',
  'IDENTITY_CATALOG_MATCH',
  'IDENTITY_SCOPE_SHAPE',
  'ITEM_RECOMMENDATION_MATCH',
  'ITEM_INPUT_HASH_MATCH',
  'ITEM_SCOPE_SHAPE',
  'DOMAIN_INPUT_HASH_UNIFORM',
  'DOMAIN_MISSING_REASON',
  'DOMAIN_SET_EXACT',
  'FEATURE_KEYS_SORTED',
  'EVIDENCE_COVERAGE_RANGE',
  'SECTOR_BREADTH_RATIO',
  'SECTOR_BREADTH_DECIMAL',
  'CLAIM_BRANCH',
  'CANONICAL_SET_ORDER',
  'COLLECTION_TIME_ORDER',
  'COLLECTION_RETURNED_COUNT',
  'COLLECTION_MEMBER_DISJOINT',
  'COLLECTION_EXACT_ACCOUNTING',
  'COLLECTION_MEMBER_COUNT',
  'SNAPSHOT_ID_MATCH',
] as const

export type SemanticRule = (typeof SEMANTIC_RULES)[number]

export class SemanticViolation extends Error {
  readonly rule: SemanticRule

  constructor(rule: SemanticRule, message: string) {
    super(`${rule}: ${message}`)
    this.name = 'SemanticViolation'
    this.rule = rule
  }
}

function fail(rule: SemanticRule, message: string): never {
  throw new SemanticViolation(rule, message)
}

// Compiled from the shared schema, not transcribed from it. RC-R007 rewrote `nonblank_text` to
// spell its own character classes instead of relying on `.`, precisely because the two engines
// read `.` differently; a transcription here would be a second chance to get that wrong. Reading
// the shared file means a change to the contract's text vocabulary cannot leave this layer behind.
//
// Deliberately still not String#trim(): trim() counts U+FEFF as blank and U+0085 as not blank,
// and the contract's blank set says the opposite on both.
const NONBLANK_TEXT = schemaPattern('nonblank_text')
const CANONICAL_TIMESTAMP = schemaPattern('timestamp')
const SHA256 = schemaPattern('sha256')
const RATIO_DECIMAL = schemaPattern('ratio_decimal_text')
const SIGNED_FIXED_DECIMAL = schemaPattern('signed_fixed_decimal_text')
const EVIDENCE_COVERAGE = RATIO_DECIMAL
// An unpaired surrogate is not a Unicode scalar value and has no UTF-8 encoding, so the same
// document is unaddressable in Python while JavaScript would hash it happily. `nonblank_text`
// already excludes the range, but it excludes blanks and NUL too, and the contract names those
// two failures separately - so the surrogate case is asked first and answered by its own rule.
const LONE_SURROGATE = /\p{Surrogate}/u

const CONTRACT_CODE = 'research-result-envelope'
const CONTRACT_VERSION = 'v1'

const UNIT_KEYS = schemaRequired('/$defs/unit_result')
const COLLECTION_KEYS = schemaRequired('/$defs/collection_result')
const IDENTITY_KEYS = schemaRequired('/$defs/identity')
const VERSION_KEYS = schemaRequired('/$defs/versions')
const DETAIL_KEYS = schemaRequired('/$defs/recommendation_detail')
const DOMAIN_KEYS = schemaRequired('/$defs/evidence_domain')
const STATE_KEYS: Record<string, readonly string[]> = {
  MARKET: schemaRequired('/$defs/market_state'),
  SECTOR: schemaRequired('/$defs/sector_state'),
  ITEM: schemaRequired('/$defs/item_state'),
}

const SCOPE_KINDS = schemaEnum('/$defs/scope_kind')
const DATA_BRANCHES = schemaEnum('/$defs/data_branch')
const DATA_STATUSES = schemaEnum('/$defs/data_status')
const CLAIM_CODES = schemaEnum('/$defs/unit_result/properties/claims/items')
const CORE_DOMAINS = schemaEnum('/$defs/evidence_domain/properties/domain')
const DOMAIN_STRENGTHS = schemaEnum('/$defs/evidence_domain/properties/strength')
const DOMAIN_MISSING_REASON_CODES = schemaEnum('/$defs/domain_missing_reason_code')
const RECOMMENDATIONS = schemaEnum('/$defs/recommendation')
const ANALYSIS_UNIT_KINDS = schemaEnum('/$defs/identity/properties/analysis_unit_kind')
const EDITION_KINDS = schemaEnum('/$defs/identity/properties/edition_kind')

const REASON_REQUIRED = new Set(['UNAVAILABLE', 'CONFLICTED'])

function record(value: unknown, name: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail('EXACT_KEY_SET', `${name} must be an object`)
  }
  return value as Record<string, unknown>
}

// `rule` exists because a key-set mismatch does not always mean the same thing. An unknown key at
// the top level is a contract-vocabulary failure; an ITEM whose state carries MARKET keys is a
// scope-shape failure, and the shared probe for it declares ITEM_SCOPE_SHAPE. Same comparison,
// different thing being said about the document.
function exact(
  value: unknown,
  expected: readonly string[],
  name: string,
  rule: SemanticRule = 'EXACT_KEY_SET',
): Record<string, unknown> {
  const node = record(value, name)
  const actual = sortedByCodePoint(Object.keys(node))
  const wanted = sortedByCodePoint(expected)
  const same = actual.length === wanted.length && actual.every((key, i) => key === wanted[i])
  if (!same) {
    const missing = wanted.filter((key) => !actual.includes(key))
    const unexpected = actual.filter((key) => !wanted.includes(key))
    fail(
      rule,
      `${name} keys mismatch; missing=[${missing.join(',')}], unknown=[${unexpected.join(',')}]`,
    )
  }
  return node
}

function text(value: unknown, name: string): string {
  if (typeof value === 'string' && LONE_SURROGATE.test(value)) {
    fail('NONBLANK_UNICODE_SCALAR_TEXT', `${name} contains an unpaired UTF-16 surrogate`)
  }
  if (typeof value !== 'string' || !NONBLANK_TEXT.test(value)) {
    fail('NONBLANK_NUL_FREE_TEXT', `${name} must be non-empty NUL-free text`)
  }
  return value
}

function ratioDecimal(value: unknown, name: string, rule: SemanticRule): string {
  const raw = text(value, name)
  if (!RATIO_DECIMAL.test(raw)) {
    fail(rule, `${name} must be a decimal string between 0 and 1`)
  }
  return raw
}

function signedFixedDecimal(value: unknown, name: string, rule: SemanticRule): string {
  const raw = text(value, name)
  if (!SIGNED_FIXED_DECIMAL.test(raw)) {
    fail(rule, `${name} must be a finite signed fixed-decimal string`)
  }
  return raw
}

// The reference builds a sorted envelope and then compares it against what arrived, which is the
// same question asked the other way round. RC-R007 made this a rejection rather than a silent
// repair: a decoder that sorts on the caller's behalf ends up sealing an object whose own bytes
// no longer hash to the snapshot_id it carries.
function requireCanonicalOrder(values: readonly string[], name: string): void {
  if (!isSortedByCodePoint(values)) {
    fail('CANONICAL_SET_ORDER', `${name} must use canonical ascending order`)
  }
}

function isRealInstant(raw: string): boolean {
  const year = Number(raw.slice(0, 4))
  const month = Number(raw.slice(5, 7))
  const day = Number(raw.slice(8, 10))
  const hour = Number(raw.slice(11, 13))
  const minute = Number(raw.slice(14, 16))
  const second = Number(raw.slice(17, 19))
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
  return day >= 1 && day <= days
}

function timestamp(value: unknown, name: string): string {
  const raw = text(value, name)
  if (!CANONICAL_TIMESTAMP.test(raw)) {
    fail(
      'CANONICAL_UTC_TIMESTAMP',
      `${name} must use canonical UTC spelling YYYY-MM-DDTHH:MM:SS.ffffffZ`,
    )
  }
  if (!isRealInstant(raw)) fail('CANONICAL_UTC_TIMESTAMP', `${name} is not a real instant`)
  return raw
}

function digest(value: unknown, name: string): string {
  const raw = text(value, name)
  if (!SHA256.test(raw)) fail('SHA256_DIGEST', `${name} must be a lowercase SHA-256 hex digest`)
  return raw
}

function member(
  values: readonly (string | null)[],
  value: unknown,
  name: string,
  rule: SemanticRule = 'ENUM_MEMBER',
): string {
  if (typeof value !== 'string' || !values.includes(value)) {
    fail(rule, `${name} is not a contract enum member`)
  }
  return value
}

function nullableMember(
  values: readonly (string | null)[],
  value: unknown,
  name: string,
): string | null {
  if (value === null) return null
  return member(values, value, name)
}

function textArray(value: unknown, name: string): string[] {
  if (!Array.isArray(value)) fail('EXACT_KEY_SET', `${name} must be an array`)
  const members = (value as unknown[]).map((entry) => text(entry, `${name} member`))
  if (new Set(members).size !== members.length) {
    fail('NONBLANK_NUL_FREE_TEXT', `${name} members must be unique`)
  }
  return members
}

function coverage(value: unknown): string {
  const raw = text(value, 'evidence_coverage')
  if (!EVIDENCE_COVERAGE.test(raw)) {
    fail('EVIDENCE_COVERAGE_RANGE', 'evidence_coverage must be a decimal string between 0 and 1')
  }
  return raw
}

function checkVersions(value: unknown): Record<string, string> {
  const node = exact(value, VERSION_KEYS, 'versions')
  const out: Record<string, string> = {}
  for (const field of VERSION_KEYS) out[field] = text(node[field], field)
  return out
}

interface IdentityFacts {
  scope_kind: string
  identity_available_at: string
  catalog_version: string
}

function checkIdentity(value: unknown): IdentityFacts {
  const node = exact(value, IDENTITY_KEYS, 'identity')
  const scopeKind = member(SCOPE_KINDS, node.scope_kind, 'scope_kind')
  const analysisUnitId = text(node.analysis_unit_id, 'analysis_unit_id')
  text(node.display_name, 'display_name')
  const availableAt = timestamp(node.identity_available_at, 'identity_available_at')
  const catalogVersion = text(node.catalog_version, 'catalog_version')
  const unitKind = nullableMember(
    ANALYSIS_UNIT_KINDS,
    node.analysis_unit_kind,
    'analysis_unit_kind',
  )
  const editionKind = nullableMember(EDITION_KINDS, node.edition_kind, 'edition_kind')
  const parentId =
    node.parent_analysis_unit_id === null
      ? null
      : text(node.parent_analysis_unit_id, 'parent_analysis_unit_id')
  if (scopeKind === 'ITEM') {
    if (unitKind === null) fail('IDENTITY_SCOPE_SHAPE', 'ITEM identity requires analysis_unit_kind')
    if (editionKind === null) fail('IDENTITY_SCOPE_SHAPE', 'ITEM identity requires edition_kind')
    if (unitKind === 'BASE_MHN' && parentId !== null) {
      fail('IDENTITY_SCOPE_SHAPE', 'BASE_MHN identity cannot carry a parent')
    }
    if (unitKind !== 'BASE_MHN') {
      if (parentId === null) {
        fail('IDENTITY_SCOPE_SHAPE', 'STYLE/PATTERN identity requires a parent')
      }
      if (parentId === analysisUnitId) {
        fail('IDENTITY_SCOPE_SHAPE', 'an item identity cannot parent itself')
      }
    }
  } else if (unitKind !== null || editionKind !== null || parentId !== null) {
    fail('IDENTITY_SCOPE_SHAPE', 'MARKET/SECTOR identity cannot carry item granularity or parent')
  }
  return {
    scope_kind: scopeKind,
    identity_available_at: availableAt,
    catalog_version: catalogVersion,
  }
}

function checkState(scopeKind: string, value: unknown): Record<string, unknown> {
  const node = exact(value, STATE_KEYS[scopeKind], `${scopeKind} state`, 'ITEM_SCOPE_SHAPE')
  member(RECOMMENDATIONS, node.recommendation, 'recommendation')
  digest(node.input_snapshot_hash, 'input_snapshot_hash')
  if (scopeKind === 'SECTOR') {
    // Both were `nonblank_text|null` until RC-R007, so a ratio of "1.01" and a return written in
    // exponent notation were legal wire while the producer was emitting Decimal strings.
    const breadth = record(node.breadth, 'breadth')
    if (breadth.advancing_member_ratio !== null) {
      ratioDecimal(breadth.advancing_member_ratio, 'advancing_member_ratio', 'SECTOR_BREADTH_RATIO')
    }
    if (breadth.median_member_return !== null) {
      signedFixedDecimal(
        breadth.median_member_return,
        'median_member_return',
        'SECTOR_BREADTH_DECIMAL',
      )
    }
  }
  return node
}

function checkRecommendationDetail(
  value: unknown,
  dataBranch: string,
): Record<string, unknown> | null {
  if (value === null) return null
  const node = exact(value, DETAIL_KEYS, 'recommendation_detail')
  member(RECOMMENDATIONS, node.recommendation, 'recommendation')
  coverage(node.evidence_coverage)
  digest(node.input_snapshot_hash, 'input_snapshot_hash')
  if (dataBranch === 'B' && node.trade_confirmation !== 'UNAVAILABLE') {
    fail('CLAIM_BRANCH', 'data branch B cannot confirm a trade')
  }
  return node
}

function checkDomains(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) fail('EXACT_KEY_SET', 'evidence_domains must be an array')
  const seen = new Set<string>()
  const domains: Record<string, unknown>[] = []
  ;(value as unknown[]).forEach((raw, index) => {
    const node = exact(raw, DOMAIN_KEYS, `evidence_domains[${index}]`)
    const domain = member(CORE_DOMAINS, node.domain, 'domain')
    if (seen.has(domain)) fail('DOMAIN_SET_EXACT', 'evidence domains must be unique')
    seen.add(domain)
    const strength = member(DOMAIN_STRENGTHS, node.strength, 'strength')
    const keys = textArray(node.contributing_feature_keys, 'contributing_feature_keys')
    if (REASON_REQUIRED.has(strength)) {
      member(
        DOMAIN_MISSING_REASON_CODES,
        node.missing_reason,
        'missing_reason',
        'DOMAIN_MISSING_REASON',
      )
    } else if (node.missing_reason !== null) {
      fail('DOMAIN_MISSING_REASON', 'available evidence domain cannot carry missing_reason')
    }
    if (!isSortedByCodePoint(keys)) {
      fail('FEATURE_KEYS_SORTED', 'contributing_feature_keys must be sorted')
    }
    text(node.policy_version, 'policy_version')
    digest(node.input_snapshot_hash, 'input_snapshot_hash')
    domains.push(node)
  })
  if (seen.size !== CORE_DOMAINS.length) {
    fail('DOMAIN_SET_EXACT', 'ITEM results require exactly P/D/S evidence domains')
  }
  requireCanonicalOrder(
    domains.map((node) => node.domain as string),
    'evidence_domains',
  )
  return domains
}

// Hashed exactly as it arrived. Nothing is sorted, filled in or repaired on the way, so an
// envelope that gets past this line reproduces its own snapshot_id from its own bytes - which is
// what makes the sealed object addressable by the id it carries. The previous version hashed a
// normalised copy, and an envelope with reversed evidence_domains was therefore accepted and
// sealed while `snapshotIdOf(sealed) !== sealed.snapshot_id`.
function checkSnapshot(document: Record<string, unknown>): void {
  const declared = digest(document.snapshot_id, 'snapshot_id')
  if (declared !== snapshotIdOf(document)) {
    fail(
      'SNAPSHOT_ID_MATCH',
      `snapshot_id does not match canonical ${String(document.envelope_kind)} result`,
    )
  }
}

function checkContractFields(document: Record<string, unknown>, kind: string): void {
  if (document.contract_code !== CONTRACT_CODE) fail('ENVELOPE_KIND', 'unsupported contract_code')
  if (document.contract_version !== CONTRACT_VERSION) {
    fail('ENVELOPE_KIND', 'unsupported contract_version')
  }
  if (document.envelope_kind !== kind) {
    fail('ENVELOPE_KIND', `result requires envelope_kind=${kind}`)
  }
}

export function checkUnitSemantics(value: unknown): void {
  const document = exact(value, UNIT_KEYS, 'unit result')
  checkContractFields(document, 'UNIT')
  const claims = textArray(document.claims, 'claims')
  claims.forEach((claim) => member(CLAIM_CODES, claim, 'claim'))
  const identity = checkIdentity(document.identity)
  const asOf = timestamp(document.as_of, 'as_of')
  const availableAt = timestamp(document.available_at, 'available_at')
  const dataBranch = member(DATA_BRANCHES, document.data_branch, 'data_branch')
  member(DATA_STATUSES, document.data_status, 'data_status')
  const versions = checkVersions(document.versions)

  // The canonical spelling is fixed width and zero padded, so ordering the strings orders the
  // instants. That equivalence is why no Date parsing happens on the comparison path.
  if (identity.identity_available_at > asOf) {
    fail('IDENTITY_TIME_ORDER', 'identity knowledge cannot be later than as_of')
  }
  if (availableAt > asOf) fail('UNIT_TIME_ORDER', 'available_at cannot be later than as_of')
  if (identity.catalog_version !== versions.catalog_version) {
    fail('IDENTITY_CATALOG_MATCH', 'identity and state catalog versions differ')
  }

  const state = checkState(identity.scope_kind, document.state)
  const detail = checkRecommendationDetail(document.recommendation_detail, dataBranch)
  let domains: Record<string, unknown>[] = []
  if (identity.scope_kind === 'ITEM') {
    if (detail === null) fail('ITEM_SCOPE_SHAPE', 'ITEM result requires recommendation_detail')
    domains = checkDomains(document.evidence_domains)
    if (detail.recommendation !== state.recommendation) {
      fail('ITEM_RECOMMENDATION_MATCH', 'item state and recommendation detail disagree')
    }
    if (detail.input_snapshot_hash !== state.input_snapshot_hash) {
      fail('ITEM_INPUT_HASH_MATCH', 'item state and recommendation detail input hashes differ')
    }
    const domainHashes = new Set(domains.map((node) => node.input_snapshot_hash as string))
    if (domainHashes.size !== 1) {
      fail('DOMAIN_INPUT_HASH_UNIFORM', 'P/D/S evidence domains must bind one feature snapshot')
    }
  } else if (detail !== null || (document.evidence_domains as unknown[]).length > 0) {
    fail('ITEM_SCOPE_SHAPE', 'MARKET/SECTOR result cannot carry item recommendation or P/D/S')
  }

  // src/contract/claims.ts holds the branch rule and raises its own error type. Letting that
  // escape would leave the caller with an exception carrying no rule name, and the probe for this
  // case would then only prove that something somewhere refused - the reference does the same
  // re-wrapping for the same reason.
  try {
    validateClaims(dataBranch as DataBranchValue, claims as ClaimCodeValue[])
  } catch (error) {
    fail('CLAIM_BRANCH', error instanceof Error ? error.message : String(error))
  }
  if (identity.scope_kind !== 'ITEM' && claims.length > 0) {
    fail('ITEM_SCOPE_SHAPE', 'MARKET/SECTOR result cannot carry item claims')
  }

  requireCanonicalOrder(claims, 'claims')
  checkSnapshot(document)
}

export function checkCollectionSemantics(value: unknown): void {
  const document = exact(value, COLLECTION_KEYS, 'collection result')
  checkContractFields(document, 'COLLECTION')
  const returned = document.returned_member_count
  if (typeof returned !== 'number' || !Number.isInteger(returned)) {
    fail('COLLECTION_RETURNED_COUNT', 'returned_member_count must be an integer')
  }
  const memberIds = textArray(document.member_result_ids, 'member_result_ids')
  if (returned !== memberIds.length) {
    fail('COLLECTION_RETURNED_COUNT', 'returned_member_count does not match member IDs')
  }

  text(document.collection_id, 'collection_id')
  member(SCOPE_KINDS, document.scope_kind, 'scope_kind')
  member(DATA_BRANCHES, document.data_branch, 'data_branch')
  member(DATA_STATUSES, document.data_status, 'data_status')
  checkVersions(document.versions)
  const asOf = timestamp(document.as_of, 'as_of')
  const availableAt = timestamp(document.available_at, 'available_at')
  if (availableAt > asOf) {
    fail('COLLECTION_TIME_ORDER', 'collection available_at cannot be later than as_of')
  }

  const memberCount = document.member_count
  if (typeof memberCount !== 'number' || !Number.isInteger(memberCount)) {
    fail('COLLECTION_MEMBER_COUNT', 'member_count must be an integer')
  }
  if (memberCount < 0) fail('COLLECTION_MEMBER_COUNT', 'member_count cannot be negative')

  memberIds.forEach((id) => digest(id, 'member_result_ids'))
  const missing = textArray(document.missing_member_ids, 'missing_member_ids')
  const unavailable = textArray(document.unavailable_member_ids, 'unavailable_member_ids')
  if (missing.some((id) => unavailable.includes(id))) {
    fail('COLLECTION_MEMBER_DISJOINT', 'missing and unavailable members must not overlap')
  }
  if (memberIds.length + missing.length + unavailable.length !== memberCount) {
    fail('COLLECTION_EXACT_ACCOUNTING', 'collection member accounting must be exact')
  }

  requireCanonicalOrder(memberIds, 'member_result_ids')
  requireCanonicalOrder(missing, 'missing_member_ids')
  requireCanonicalOrder(unavailable, 'unavailable_member_ids')
  checkSnapshot(document)
}

export function checkResultSemantics(value: unknown): void {
  const document = record(value, 'result envelope')
  if (document.envelope_kind === 'UNIT') return checkUnitSemantics(document)
  if (document.envelope_kind === 'COLLECTION') return checkCollectionSemantics(document)
  fail('ENVELOPE_KIND', `unsupported envelope_kind: ${String(document.envelope_kind)}`)
}
