// What this file checks is that the frontend agrees with the *shared* schema, not with a local
// idea of it. Every expectation below reads either the root schema file or the shared example
// files; none of them restates a rule in TypeScript. A test that restated the rule would keep
// passing after the contract moved, which is the failure mode worth engineering against.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  CaseStatus,
  ClaimCode,
  CoreDomain,
  DataBranch,
  DataStatus,
  DomainStrength,
  EvidenceFlag,
  ItemCycleStage,
  MarketLevelRegime,
  MarketTrendStage,
  Recommendation,
  RegimeRelation,
  RelativeStrength,
  ScopeKind,
  SectorTrendStage,
  SignalStrength,
  TradeConfirmation,
  AnalysisUnitKind,
} from '../src/contract/enums'
import { EditionKind } from '../src/contract/identity'
import type { VersionContext } from '../src/contract/types'
import { snapshotIdOf } from '../src/wire/canonical'
import {
  decodeResultEnvelope,
  validateResultEnvelope,
  violationRule,
  WireContractViolation,
} from '../src/wire/decode'
import { FIELD_TAG_TABLES, SCHEMA_TEXT_KINDS } from '../src/wire/fieldTags'
import { checkResultSemantics } from '../src/wire/semantic'
import {
  RESULT_ENVELOPE_SCHEMA,
  RESULT_ENVELOPE_SCHEMA_ID,
  schemaEnum,
  schemaHas,
  schemaNode,
  schemaRequired,
  schemaTextKinds,
  schemaTypeTag,
} from '../src/wire/schema'
import type {
  WireCollectionResult,
  WireEvidenceDomain,
  WireIdentity,
  WireItemState,
  WireMarketState,
  WireRecommendationDetail,
  WireSectorBreadth,
  WireSectorState,
  WireUnitResult,
} from '../src/wire/types'

const FRONTEND = dirname(dirname(fileURLToPath(import.meta.url)))
const EXAMPLES = join(FRONTEND, '..', 'schemas', 'examples')

function example(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(EXAMPLES, name), 'utf8')) as Record<string, unknown>
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

// Every mutation below has to be rehashed before it is offered to the decoder. Without this the
// document would be refused for carrying a stale snapshot_id, and a rejection for the wrong
// reason is not evidence that the rule under test exists. This is the same discipline the shared
// probe file states in its `rehash_snapshot` field.
function rehashed(document: Record<string, unknown>): Record<string, unknown> {
  document.snapshot_id = snapshotIdOf(document)
  return document
}

// One collection envelope with one field swapped, so a text case says only one thing at a time.
function withCollectionId(value: string): Record<string, unknown> {
  const document = clone(example('collection-missing-unavailable.valid.json'))
  document.collection_id = value
  return document
}

function refusal(document: unknown): string {
  try {
    decodeResultEnvelope(document)
  } catch (error) {
    const rule = violationRule(error)
    if (rule) return rule
    throw error
  }
  throw new Error('the decoder accepted a document that should have been refused')
}

const VALID_EXAMPLES = readdirSync(EXAMPLES).filter((name) => {
  if (!name.endsWith('.valid.json')) return false
  return example(name).contract_code === 'research-result-envelope'
})

describe('the wire schema is the shared one, not a local copy', () => {
  it('is the file the contract names', () => {
    expect(RESULT_ENVELOPE_SCHEMA.$id).toBe(RESULT_ENVELOPE_SCHEMA_ID)
    expect(RESULT_ENVELOPE_SCHEMA.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
  })

  it('has no second copy anywhere under frontend/', () => {
    const found: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.json') && readFileSync(full, 'utf8').includes('research-result-envelope')) {
          found.push(full.slice(FRONTEND.length))
        }
      }
    }
    walk(FRONTEND)
    expect(found).toEqual([])
  })

  it('reads the schema from outside frontend/', () => {
    const source = readFileSync(join(FRONTEND, 'src/wire/schema.ts'), 'utf8')
    expect(source).toContain("from '../../../schemas/research-result-envelope.v1.schema.json'")
    expect(statSync(join(FRONTEND, '../schemas/research-result-envelope.v1.schema.json')).isFile()).toBe(true)
  })
})

describe('shared valid examples reach the frontend through the one decoder', () => {
  it('finds the shared examples at all', () => {
    expect(VALID_EXAMPLES.length).toBeGreaterThan(0)
  })

  it.each(VALID_EXAMPLES)('accepts %s', (name) => {
    const envelope = decodeResultEnvelope(example(name))
    expect(envelope.contract_code).toBe('research-result-envelope')
    expect(envelope.contract_version).toBe('v1')
  })
})

// The mutations live in the shared file, so adding a negative case on the backend side is enough
// to make the frontend answer for it. Nothing here hardcodes what a rejection should look like.
type NegativeCase = {
  case_id: string
  base_file: string
  operation: 'replace' | 'add'
  path: (string | number)[]
  value: unknown
}

const NEGATIVE_CASES: NegativeCase[] = JSON.parse(
  readFileSync(join(EXAMPLES, 'negative-cases.json'), 'utf8'),
) as NegativeCase[]

function mutate(negative: NegativeCase): unknown {
  const document = clone(example(negative.base_file)) as Record<string, unknown>
  const parentPath = negative.path.slice(0, -1)
  const last = negative.path[negative.path.length - 1]
  let node: Record<string | number, unknown> = document
  for (const segment of parentPath) {
    const next = node[segment]
    if (next === null || typeof next !== 'object') {
      throw new Error(`${negative.case_id}: no container at ${JSON.stringify(parentPath)}`)
    }
    node = next as Record<string | number, unknown>
  }
  // A replace whose target vanished would quietly become an add, and would then be rejected for
  // being an unknown field rather than for the reason the case was written to prove.
  const present = Object.prototype.hasOwnProperty.call(node, last)
  if (negative.operation === 'replace' && !present) {
    throw new Error(`${negative.case_id}: replace target ${String(last)} is absent`)
  }
  if (negative.operation === 'add' && present) {
    throw new Error(`${negative.case_id}: add target ${String(last)} already exists`)
  }
  node[last] = negative.value
  return rehashed(document)
}

describe('every shared negative case is refused before it becomes a view model', () => {
  it('finds the shared negative cases at all', () => {
    expect(NEGATIVE_CASES.length).toBeGreaterThan(0)
  })

  it.each(NEGATIVE_CASES.map((negative) => [negative.case_id, negative] as const))(
    'rejects %s',
    (_id, negative) => {
      // The unmutated base has to be accepted, otherwise the rejection below would prove nothing.
      expect(() => decodeResultEnvelope(example(negative.base_file))).not.toThrow()
      expect(() => decodeResultEnvelope(mutate(negative))).toThrow(WireContractViolation)
    },
  )
})

describe('date-time is enforced, not merely declared', () => {
  it.each([
    ['no zone', '2026-08-21T00:00:00.000000'],
    ['not a time at all', 'yesterday'],
    ['an impossible month', '2026-13-21T00:00:00.000000Z'],
    ['a date with no time', '2026-08-21'],
  ])('rejects as_of with %s', (_label, value) => {
    const document = clone(example('unit-item-branch-b.valid.json'))
    document.as_of = value
    expect(refusal(rehashed(document))).toBe('CANONICAL_UTC_TIMESTAMP')
  })

  it('rejects a bad identity_available_at too', () => {
    const document = clone(example('unit-item-branch-b.valid.json'))
    ;(document.identity as Record<string, unknown>).identity_available_at = '2026-08-20'
    expect(refusal(rehashed(document))).toBe('CANONICAL_UTC_TIMESTAMP')
  })

  // FE-RC-001B recorded this as accepted: `format: date-time` follows RFC 3339, which permits a
  // separator other than "T" by agreement, and the frontend would have been legislating if it
  // tightened that alone. The two-layer contract closed it instead - `$defs/timestamp` now
  // carries an explicit canonical pattern - so what used to be a documented observation is a
  // rejection, and this test is what would notice the pattern being dropped again.
  it('rejects a space separator now that the canonical spelling is pinned', () => {
    const document = clone(example('unit-item-branch-b.valid.json'))
    document.as_of = '2026-08-21 00:00:00.000000Z'
    expect(refusal(rehashed(document))).toBe('CANONICAL_UTC_TIMESTAMP')
  })

  it('pins the canonical spelling in the schema, not only in the frontend', () => {
    expect(schemaHas('/$defs/timestamp/pattern')).toBe(true)
  })
})

// Drift guards. Each case is two-sided: the runtime comparison catches the schema moving, and
// the `Record<keyof T, true>` literals below stop compiling when the TypeScript shape moves.
describe('the TypeScript shapes have not drifted from the schema', () => {
  const NULLABLE = [
    ['/$defs/identity/properties/analysis_unit_kind', AnalysisUnitKind],
    ['/$defs/identity/properties/edition_kind', EditionKind],
    ['/$defs/nullable_case_status', CaseStatus],
  ] as const

  it.each([
    ['/$defs/scope_kind', ScopeKind],
    ['/$defs/data_branch', DataBranch],
    ['/$defs/data_status', DataStatus],
    ['/$defs/recommendation', Recommendation],
    ['/$defs/evidence_flags/items', EvidenceFlag],
    ['/$defs/market_state/properties/trend_stage', MarketTrendStage],
    ['/$defs/market_state/properties/level_regime', MarketLevelRegime],
    ['/$defs/sector_state/properties/trend_stage', SectorTrendStage],
    ['/$defs/sector_state/properties/relative_strength', RelativeStrength],
    ['/$defs/item_state/properties/cycle_stage', ItemCycleStage],
    ['/$defs/item_state/properties/regime_relation/items', RegimeRelation],
    ['/$defs/recommendation_detail/properties/signal_strength', SignalStrength],
    ['/$defs/recommendation_detail/properties/trade_confirmation', TradeConfirmation],
    ['/$defs/evidence_domain/properties/domain', CoreDomain],
    ['/$defs/evidence_domain/properties/strength', DomainStrength],
    ['/$defs/unit_result/properties/claims/items', ClaimCode],
  ] as const)('%s matches the mirrored enum', (pointer, mirrored) => {
    expect([...schemaEnum(pointer)].sort()).toEqual(Object.values(mirrored).sort())
  })

  it.each(NULLABLE)('%s matches the mirrored enum plus null', (pointer, mirrored) => {
    const schemaValues = [...schemaEnum(pointer)]
    expect(schemaValues).toContain(null)
    expect(schemaValues.filter((value) => value !== null).sort()).toEqual(
      Object.values(mirrored).sort(),
    )
  })

  const VERSIONS: Record<keyof VersionContext, true> = {
    catalog_version: true,
    group_version: true,
    index_version: true,
    fusion_method_version: true,
    feature_profile_version: true,
    algorithm_version: true,
    parameter_set_version: true,
    stage_policy_version: true,
    failure_policy_version: true,
  }
  const IDENTITY: Record<keyof WireIdentity, true> = {
    analysis_unit_id: true,
    scope_kind: true,
    display_name: true,
    identity_available_at: true,
    catalog_version: true,
    analysis_unit_kind: true,
    edition_kind: true,
    parent_analysis_unit_id: true,
  }
  const MARKET_STATE: Record<keyof WireMarketState, true> = {
    trend_stage: true,
    level_regime: true,
    evidence_flags: true,
    recommendation: true,
    case_status: true,
    analysis_case_id: true,
    input_snapshot_hash: true,
  }
  const SECTOR_STATE: Record<keyof WireSectorState, true> = {
    trend_stage: true,
    relative_strength: true,
    breadth: true,
    evidence_flags: true,
    recommendation: true,
    case_status: true,
    analysis_case_id: true,
    input_snapshot_hash: true,
  }
  const BREADTH: Record<keyof WireSectorBreadth, true> = {
    advancing_member_ratio: true,
    median_member_return: true,
    breadth_expanding: true,
    breadth_narrowing: true,
    concentration_warning: true,
  }
  const ITEM_STATE: Record<keyof WireItemState, true> = {
    cycle_stage: true,
    evidence_flags: true,
    regime_relation: true,
    recommendation: true,
    case_status: true,
    candidate_episode_id: true,
    cycle_case_id: true,
    input_snapshot_hash: true,
  }
  const RECOMMENDATION_DETAIL: Record<keyof WireRecommendationDetail, true> = {
    recommendation: true,
    signal_strength: true,
    evidence_coverage: true,
    trade_confirmation: true,
    input_snapshot_hash: true,
  }
  const EVIDENCE_DOMAIN: Record<keyof WireEvidenceDomain, true> = {
    domain: true,
    strength: true,
    contributing_feature_keys: true,
    missing_reason: true,
    policy_version: true,
    input_snapshot_hash: true,
  }
  const UNIT_RESULT: Record<keyof WireUnitResult, true> = {
    snapshot_id: true,
    contract_code: true,
    contract_version: true,
    envelope_kind: true,
    identity: true,
    as_of: true,
    available_at: true,
    data_branch: true,
    data_status: true,
    versions: true,
    state: true,
    recommendation_detail: true,
    evidence_domains: true,
    claims: true,
  }
  const COLLECTION_RESULT: Record<keyof WireCollectionResult, true> = {
    snapshot_id: true,
    contract_code: true,
    contract_version: true,
    envelope_kind: true,
    collection_id: true,
    scope_kind: true,
    as_of: true,
    available_at: true,
    data_branch: true,
    data_status: true,
    versions: true,
    member_count: true,
    returned_member_count: true,
    member_result_ids: true,
    missing_member_ids: true,
    unavailable_member_ids: true,
  }

  it.each([
    ['/$defs/versions', VERSIONS],
    ['/$defs/identity', IDENTITY],
    ['/$defs/market_state', MARKET_STATE],
    ['/$defs/sector_state', SECTOR_STATE],
    ['/$defs/sector_state/properties/breadth', BREADTH],
    ['/$defs/item_state', ITEM_STATE],
    ['/$defs/recommendation_detail', RECOMMENDATION_DETAIL],
    ['/$defs/evidence_domain', EVIDENCE_DOMAIN],
    ['/$defs/unit_result', UNIT_RESULT],
    ['/$defs/collection_result', COLLECTION_RESULT],
  ] as const)('%s carries exactly the mirrored fields', (pointer, mirrored) => {
    expect([...schemaRequired(pointer)].sort()).toEqual(Object.keys(mirrored).sort())
  })

  // Only definition positions are checked. `if` / `then` / `contains` subschemas are constraints
  // layered on a shape defined elsewhere, and closing them would reject the very fields they are
  // there to leave alone; the shared negative case `source-private-top-level-field` is what
  // proves unknown fields are actually refused at runtime.
  it('closes every defined object against unknown fields', () => {
    const open: string[] = []
    const checked: string[] = []
    const walk = (node: unknown, pointer: string) => {
      if (node === null || typeof node !== 'object' || Array.isArray(node)) return
      const record = node as Record<string, unknown>
      if (record.properties) {
        checked.push(pointer)
        if (record.additionalProperties !== false) open.push(pointer)
      }
      for (const key of ['properties', '$defs'] as const) {
        const container = record[key]
        if (container && typeof container === 'object') {
          for (const [name, child] of Object.entries(container as Record<string, unknown>)) {
            walk(child, `${pointer}/${key}/${name}`)
          }
        }
      }
      walk(record.items, `${pointer}/items`)
    }
    walk(RESULT_ENVELOPE_SCHEMA, '')
    expect(open).toEqual([])
    // A walk that reached nothing would also report no open objects.
    expect(checked).toEqual(
      expect.arrayContaining([
        '/$defs/versions',
        '/$defs/identity',
        '/$defs/market_state',
        '/$defs/sector_state',
        '/$defs/sector_state/properties/breadth',
        '/$defs/item_state',
        '/$defs/recommendation_detail',
        '/$defs/evidence_domain',
        '/$defs/unit_result',
        '/$defs/collection_result',
      ]),
    )
  })
})

// Constraints the schema does enforce. These are here so the difference list can say "verified"
// rather than "assumed", and so a future loosening of the schema is caught here rather than by a
// page quietly rendering something the contract used to forbid.
describe('the schema enforces the identity and branch rules it claims to', () => {
  const item = () => clone(example('unit-item-branch-b.valid.json'))
  const withIdentity = (patch: Record<string, unknown>) => {
    const document = item()
    Object.assign(document.identity as Record<string, unknown>, patch)
    return rehashed(document)
  }

  it('refuses economic granularity on a MARKET identity', () => {
    const document = withIdentity({ scope_kind: 'MARKET', analysis_unit_kind: 'BASE_MHN' })
    expect(() => decodeResultEnvelope(document)).toThrow(WireContractViolation)
  })

  it.each(['analysis_unit_kind', 'edition_kind'])('refuses a null %s on an ITEM', (field) => {
    expect(() => decodeResultEnvelope(withIdentity({ [field]: null }))).toThrow(
      WireContractViolation,
    )
  })

  // RC-R005. catalog has its own ScopeKind with values like EXACT_VARIANT; it names a different
  // thing and must never travel on the wire under the same key.
  it('refuses a catalog ScopeKind value as a wire scope_kind', () => {
    expect(() => decodeResultEnvelope(withIdentity({ scope_kind: 'EXACT_VARIANT' }))).toThrow(
      WireContractViolation,
    )
  })

  it('refuses a sweeping claim on branch B', () => {
    const document = item()
    document.claims = ['SWEEPING_CONFIRMED']
    expect(() => decodeResultEnvelope(rehashed(document))).toThrow(WireContractViolation)
  })

  it('refuses an ITEM missing one of the three domains', () => {
    const document = item()
    document.evidence_domains = (document.evidence_domains as unknown[]).slice(0, 2)
    expect(refusal(rehashed(document))).toBe('DOMAIN_SET_EXACT')
  })
})

// RC-R002 was an ACCEPTED resolution that the structural schema could not express, so FE-RC-001B
// recorded it as three expected failures. The semantic layer states it now, on both sides, so
// these are ordinary tests: each asserts not only that the document is refused but which rule
// refused it, because a rejection under some other rule would not be evidence that this one runs.
describe('RC-R002: member accounting has to add up', () => {
  const collection = () => clone(example('collection-missing-unavailable.valid.json'))

  it('accepts the unmutated collection, so the refusals below mean something', () => {
    expect(() => decodeResultEnvelope(collection())).not.toThrow()
  })

  it('rejects returned_member_count disagreeing with member_result_ids.length', () => {
    const document = collection()
    document.returned_member_count = 99
    expect(refusal(rehashed(document))).toBe('COLLECTION_RETURNED_COUNT')
  })

  it('rejects a member listed as both missing and unavailable', () => {
    const document = collection()
    document.missing_member_ids = ['market:both']
    document.unavailable_member_ids = ['market:both']
    expect(refusal(rehashed(document))).toBe('COLLECTION_MEMBER_DISJOINT')
  })

  it('rejects member_count smaller than returned plus missing plus unavailable', () => {
    const document = collection()
    document.member_count = 1
    expect(refusal(rehashed(document))).toBe('COLLECTION_EXACT_ACCOUNTING')
  })

  it('rejects member_count larger than the three lists account for', () => {
    const document = collection()
    document.member_count = (document.member_count as number) + 1
    expect(refusal(rehashed(document))).toBe('COLLECTION_EXACT_ACCOUNTING')
  })
})

// The other half of the scalar drift gate. src/wire/fieldTags.ts states each field's scalar kind
// in the TypeScript type's own vocabulary, so changing the declared type breaks compilation
// there; this reads the same tag out of the schema, so changing the contract breaks here. Neither
// side can move alone. The acceptance case for FE-RC-001C is `advancing_member_ratio` going from
// `string|null` to `number|null`: the first fails tsc at fieldTags.ts, the second fails this test.
describe('field scalar types have not drifted from the schema', () => {
  const cases = FIELD_TAG_TABLES.flatMap((table) =>
    Object.entries(table.tags).map(
      ([field, tag]) => [`${table.pointer}/properties/${field}`, tag] as const,
    ),
  )

  it('has something to check', () => {
    expect(cases.length).toBeGreaterThan(80)
  })

  it.each(cases)('%s is %s on both sides', (pointer, tag) => {
    expect(schemaTypeTag(pointer)).toBe(tag)
  })

  // Without this, adding an object to the schema and forgetting a tag table would leave the new
  // object's scalars unguarded while every existing assertion stayed green.
  it('has a tag table for every object the schema defines', () => {
    const objects: string[] = []
    const walk = (node: unknown, pointer: string) => {
      if (node === null || typeof node !== 'object' || Array.isArray(node)) return
      const record = node as Record<string, unknown>
      if (record.properties) objects.push(pointer)
      for (const key of ['properties', '$defs'] as const) {
        const container = record[key]
        if (container && typeof container === 'object') {
          for (const [name, child] of Object.entries(container as Record<string, unknown>)) {
            walk(child, `${pointer}/${key}/${name}`)
          }
        }
      }
      walk(record.items, `${pointer}/items`)
    }
    walk(RESULT_ENVELOPE_SCHEMA, '')
    expect(objects.sort()).toEqual(FIELD_TAG_TABLES.map((table) => table.pointer).sort())
  })
})

// RC-R007 closed the divergence that stood here as a permanent exception. The shared pattern
// used to write its lookahead with `.`, which excludes U+000A in Python and U+000A, U+000D,
// U+2028 and U+2029 in ECMAScript, so "\rM9 Bayonet" was refused here and accepted there. The
// pattern now spells its own character classes and the exception is gone rather than documented.
//
// What replaces it is a parity assertion in the other direction: these three inputs must get the
// same answer from the structural layer, the semantic layer and the reference.
describe('contract text is Unicode scalar text, and both layers read it the same way', () => {
  const CR = String.fromCharCode(13)
  const LONE_SURROGATE = String.fromCharCode(0xd800)
  const SURROGATE = /\p{Surrogate}/u
  const CASES = [
    ['a carriage-return prefix', `${CR}M9 Bayonet`, undefined],
    ['an astral scalar value', `${String.fromCodePoint(0x1f5e1)} knives`, undefined],
    ['an unpaired surrogate', `bad${LONE_SURROGATE}id`, 'NONBLANK_UNICODE_SCALAR_TEXT'],
    ['blank-only text', String.fromCharCode(0xa0), 'NONBLANK_NUL_FREE_TEXT'],
    ['embedded NUL', `a${String.fromCharCode(0)}b`, 'NONBLANK_NUL_FREE_TEXT'],
  ] as const

  it('no longer writes the lookahead with a dot', () => {
    expect(String(schemaNode('/$defs/nonblank_text').pattern)).not.toContain('(?=.*[^')
  })

  // The `u` flag is load-bearing rather than cosmetic. The pattern excludes U+D800-U+DFFF to bar
  // unpaired surrogates; without `u` that range also matches each half of a well-formed astral
  // pair, so an emoji would be refused. Ajv's unicodeRegExp option defaults to true, and this is
  // what would turn red if that default were ever overridden in decode.ts.
  it.each(CASES)('the schema layer answers %s the same way', (_label, value, refused) => {
    expect(validateResultEnvelope(withCollectionId(value))).toBe(refused === undefined)
  })

  // Accepted cases have to carry an honest hash or they would stop at the snapshot rule for an
  // unrelated reason. The surrogate case cannot carry one: it has no UTF-8 form, so there is no
  // hash to write - which is precisely why the text rule has to run before the snapshot rule.
  it.each(CASES)('the semantic layer names %s the same way', (_label, value, refused) => {
    const document = withCollectionId(value)
    if (!SURROGATE.test(value)) rehashed(document)
    let rule: string | undefined
    try {
      checkResultSemantics(document)
    } catch (error) {
      rule = violationRule(error)
    }
    expect(rule).toBe(refused)
  })

  it('has no canonical form to hash for an unpaired surrogate', () => {
    expect(() => snapshotIdOf(withCollectionId(`bad${LONE_SURROGATE}id`))).toThrow(
      /unpaired surrogate/,
    )
  })

  it('lets a carriage-return prefix decode all the way through', () => {
    expect(() => decodeResultEnvelope(rehashed(withCollectionId(`${CR}M9 Bayonet`)))).not.toThrow()
  })

  it('lets an astral scalar value decode all the way through', () => {
    const document = rehashed(withCollectionId(`${String.fromCodePoint(0x1f5e1)} knives`))
    expect(() => decodeResultEnvelope(document)).not.toThrow()
  })
})

// The scalar drift gate's second half. `advancing_member_ratio` was `nonblank_text|null` and is a
// 0-through-1 decimal string now; both spellings are `string|null`, so the tag tables above cannot
// tell them apart. This compares the *vocabulary* each string field must use, read out of the
// schema, against the vocabulary declared here.
describe('string fields have not drifted to a different vocabulary', () => {
  const actual = schemaTextKinds()

  it('agrees with the declared table, field for field', () => {
    expect(actual).toEqual(SCHEMA_TEXT_KINDS)
  })

  // Without this a new string field could arrive with no entry, and the equality above would be
  // the only thing standing between it and going unchecked - which it would not, since a missing
  // key fails the comparison. Stated separately so the reason is visible.
  it('leaves no string field unclassified', () => {
    const declared = new Set(Object.keys(SCHEMA_TEXT_KINDS))
    expect(Object.keys(actual).filter((path) => !declared.has(path))).toEqual([])
  })

  it('holds the two breadth fields to decimal vocabularies, including nullability', () => {
    expect(actual['/state/breadth/advancing_member_ratio']).toBe('ratio_decimal_text|null')
    expect(actual['/state/breadth/median_member_return']).toBe('signed_fixed_decimal_text|null')
  })

  it.each([
    ['advancing_member_ratio', '1.01', 'SECTOR_BREADTH_RATIO'],
    ['median_member_return', '1e-3', 'SECTOR_BREADTH_DECIMAL'],
  ])('refuses %s = %s and names it', (field, value, rule) => {
    const document = example('unit-sector.valid.json')
    ;((document.state as Record<string, unknown>).breadth as Record<string, unknown>)[field] = value
    expect(refusal(rehashed(document))).toBe(rule)
  })

  it('accepts null for both, because the contract does', () => {
    const document = example('unit-sector.valid.json')
    const breadth = (document.state as Record<string, unknown>).breadth as Record<string, unknown>
    breadth.advancing_member_ratio = null
    breadth.median_member_return = null
    expect(() => decodeResultEnvelope(rehashed(document))).not.toThrow()
  })
})
