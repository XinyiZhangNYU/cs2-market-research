// The parity file. It drives the *shared* probe set, so the frontend's answer is compared
// against the reference implementation's rather than against itself.
//
// Nothing here restates a rule. Each case names the rule it exercises and the acceptance it
// expects, the harness applies the case's own operations, and both expectations are read out of
// the case file - so a probe added on the backend side becomes a frontend obligation with no
// edit here. The positive samples are read off disk for the same reason.
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { canonicalJsonText, snapshotIdOf } from '../src/wire/canonical'
import {
  decodeCollectionResult,
  decodeResultEnvelope,
  decodeUnitResult,
  violationRule,
} from '../src/wire/decode'
import { SEMANTIC_RULES, type SemanticRule } from '../src/wire/semantic'
import { collectionResultView, unitResultView } from '../src/adapter/resultViewModel'

const FRONTEND = dirname(dirname(fileURLToPath(import.meta.url)))
const EXAMPLES = join(FRONTEND, '..', 'schemas', 'examples')

function example(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(EXAMPLES, name), 'utf8')) as Record<string, unknown>
}

// Not a hand-written list: a fourth positive sample becomes an obligation the moment it lands.
const VALID_EXAMPLES = readdirSync(EXAMPLES)
  .filter(
    (name) =>
      name.endsWith('.valid.json') &&
      example(name).contract_code === 'research-result-envelope',
  )
  .sort()

const UNIT = 'unit-item-branch-b.valid.json'
const COLLECTION = 'collection-missing-unavailable.valid.json'

// The shared mutation contract, verbatim: start from base_file, apply the operations in order,
// then - when rehash_snapshot is true - recompute snapshot_id from the mutated body.
type Operation =
  | { operation: 'replace'; path: (string | number)[]; value: unknown }
  | { operation: 'add'; path: (string | number)[]; value: unknown }
  | { operation: 'remove'; path: (string | number)[] }
  | { operation: 'reverse'; path: (string | number)[] }

type SemanticCase = {
  case_id: string
  rule_id: string
  base_file: string
  operations: Operation[]
  rehash_snapshot: boolean
  expected_acceptance: 'REJECT' | 'ACCEPT'
  python_error_contains?: string
}

const CASES: SemanticCase[] = JSON.parse(
  readFileSync(join(EXAMPLES, 'semantic-cases.v1.json'), 'utf8'),
) as SemanticCase[]

function container(
  document: Record<string, unknown>,
  path: (string | number)[],
  caseId: string,
): Record<string | number, unknown> {
  let node: unknown = document
  for (const segment of path.slice(0, -1)) {
    if (node === null || typeof node !== 'object') {
      throw new Error(`${caseId}: no container at ${JSON.stringify(path)}`)
    }
    node = (node as Record<string | number, unknown>)[segment]
  }
  if (node === null || typeof node !== 'object') {
    throw new Error(`${caseId}: no container at ${JSON.stringify(path)}`)
  }
  return node as Record<string | number, unknown>
}

function applyCase(probe: SemanticCase): Record<string, unknown> {
  const document = JSON.parse(JSON.stringify(example(probe.base_file))) as Record<string, unknown>
  for (const operation of probe.operations) {
    const parent = container(document, operation.path, probe.case_id)
    const last = operation.path[operation.path.length - 1]
    const present = Object.prototype.hasOwnProperty.call(parent, last)
    // A path that has already stopped matching the document would silently turn a targeted
    // mutation into an unrelated one, and the rejection would then prove nothing. `add` is the
    // mirror image: it only proves the unknown-key rule if the key really was absent.
    if (operation.operation === 'add') {
      if (present) throw new Error(`${probe.case_id}: ${JSON.stringify(operation.path)} exists`)
      parent[last] = operation.value
      continue
    }
    if (!present) {
      throw new Error(`${probe.case_id}: nothing at ${JSON.stringify(operation.path)}`)
    }
    if (operation.operation === 'replace') {
      parent[last] = operation.value
    } else if (operation.operation === 'remove') {
      // Removing an array element has to close the gap; `delete` would leave a hole that reads
      // back as undefined and would fail for a reason the probe did not ask about.
      if (Array.isArray(parent) && typeof last === 'number') parent.splice(last, 1)
      else delete parent[last]
    } else {
      const target = parent[last]
      if (!Array.isArray(target)) {
        throw new Error(`${probe.case_id}: reverse target is not an array`)
      }
      parent[last] = [...target].reverse()
    }
  }
  if (probe.rehash_snapshot) document.snapshot_id = snapshotIdOf(document)
  return document
}

describe('the shared semantic probes are answered the same way as the reference', () => {
  it('finds all of them, with both expected acceptances represented', () => {
    expect(CASES.length).toBe(37)
    expect(CASES.filter((probe) => probe.expected_acceptance === 'REJECT').length).toBe(35)
    expect(CASES.filter((probe) => probe.expected_acceptance === 'ACCEPT').length).toBe(2)
  })

  // A probe naming a rule this frontend has never heard of is a contract change that arrived
  // without an implementation, and it must not be able to pass quietly. There is no exception
  // list any more: FE-RC-001C carved one out for CANONICAL_SET_ORDER on the reasoning that the
  // canonical hash enforced it, and RC-R007 replaced that with a real rejection rule.
  it('names only rules this frontend implements', () => {
    const known = new Set<string>(SEMANTIC_RULES)
    expect([...new Set(CASES.map((probe) => probe.rule_id))].filter((id) => !known.has(id))).toEqual(
      [],
    )
  })

  it.each(CASES.map((probe) => [probe.case_id, probe] as const))('%s', (_id, probe) => {
    // Without this the case would pass even if the base file had itself become undecodable.
    expect(() => decodeResultEnvelope(example(probe.base_file))).not.toThrow()

    const mutated = applyCase(probe)
    if (probe.expected_acceptance === 'ACCEPT') {
      expect(() => decodeResultEnvelope(mutated)).not.toThrow()
      return
    }

    let rule: SemanticRule | 'SCHEMA' | undefined
    let threw = false
    try {
      decodeResultEnvelope(mutated)
    } catch (error) {
      threw = true
      rule = violationRule(error)
    }
    expect(threw).toBe(true)
    // Rejecting for some other reason is not agreement with the reference, and a generic 'SCHEMA'
    // is not attribution. Both are asserted by comparing against the declared rule_id.
    expect(rule).toBe(probe.rule_id)
  })

  // The mutation had to actually change the document, or "rejected" would be meaningless.
  // Compared as parsed JSON rather than canonical bytes, because one probe carries an unpaired
  // surrogate and canonicalisation refuses to give that a byte form at all.
  it.each(CASES.map((probe) => [probe.case_id, probe] as const))(
    '%s changes its base',
    (_id, probe) => {
      expect(JSON.stringify(applyCase(probe))).not.toBe(JSON.stringify(example(probe.base_file)))
    },
  )
})

// Requirement 5 of FE-RC-001D read as a test: it is not enough that each probe is refused for its
// own rule, because a rule could still be unreachable if no probe named it. This asserts the
// reverse direction - every rule ID the shared set declares is produced by this frontend.
describe('every shared rule ID has a reachable mechanical attribution', () => {
  const declared = [...new Set(CASES.map((probe) => probe.rule_id))].sort()

  it('covers 29 distinct rule IDs', () => {
    expect(declared.length).toBe(29)
  })

  it('produces each of them from the probe that declares it', () => {
    const produced = new Set<string>()
    for (const probe of CASES) {
      if (probe.expected_acceptance !== 'REJECT') continue
      try {
        decodeResultEnvelope(applyCase(probe))
      } catch (error) {
        const rule = violationRule(error)
        if (rule !== undefined) produced.add(rule)
      }
    }
    expect(declared.filter((rule) => !produced.has(rule))).toEqual([])
    expect(produced.has('SCHEMA')).toBe(false)
  })

  // The rules with no shared probe are frontend-verified only. Stating the list keeps "not yet
  // cross-checked against Python" visible; it shrinks when BE adds probes and the assertion turns
  // red rather than quietly becoming stale.
  it('lists exactly the rules no shared probe exercises', () => {
    const probed = new Set(declared)
    expect(SEMANTIC_RULES.filter((rule) => !probed.has(rule)).slice().sort()).toEqual([])
  })
})

// The anchor under everything above. If canonicalisation drifted by one byte, every hash-based
// assertion would still "pass" against itself while disagreeing with the producer.
describe('canonical bytes match the producer, not just this file', () => {
  it('finds all three positive samples', () => {
    expect(VALID_EXAMPLES).toEqual([
      'collection-missing-unavailable.valid.json',
      'unit-item-branch-b.valid.json',
      'unit-sector.valid.json',
    ])
  })

  it.each(VALID_EXAMPLES)('%s decodes and rehashes to its own snapshot_id', (name) => {
    const document = example(name)
    expect(snapshotIdOf(document)).toBe(document.snapshot_id)
    expect(() => decodeResultEnvelope(document)).not.toThrow()
  })

  it('sorts object keys by code point and appends a trailing newline', () => {
    expect(canonicalJsonText({ b: 1, a: [1, 2], A: null })).toBe('{"A":null,"a":[1,2],"b":1}\n')
  })

  it('uses Python code-point order when BMP and astral strings differ from UTF-16 order', () => {
    const document = example(COLLECTION)
    document.member_count = 3
    document.missing_member_ids = ['\uE000', String.fromCodePoint(0x1f5e1)]
    document.unavailable_member_ids = []
    document.snapshot_id = snapshotIdOf(document)
    expect(() => decodeCollectionResult(document)).not.toThrow()

    document.missing_member_ids = [...(document.missing_member_ids as string[])].reverse()
    document.snapshot_id = snapshotIdOf(document)
    expect(() => decodeCollectionResult(document)).toThrow(/CANONICAL_SET_ORDER/)
  })

  it('refuses a float, because the producer forbids one', () => {
    expect(() => canonicalJsonText({ x: 1.5 })).toThrow()
  })

  // Python's canonical encoder raises UnicodeEncodeError here. JavaScript would not stop on its
  // own - JSON.stringify emits a \ud800 escape and TextEncoder substitutes U+FFFD - so without
  // this the same document would get a JavaScript-only hash and appear addressable.
  it('refuses an unpaired surrogate the way the UTF-8 encoder does', () => {
    expect(() => canonicalJsonText({ id: `bad${String.fromCharCode(0xd800)}id` })).toThrow(
      /unpaired surrogate/,
    )
  })
})

// RC-R007's central invariant, and the FE-RC-001C blocker it came from: an envelope was accepted
// whose evidence_domains were reversed, because the decoder hashed a sorted copy. It was sealed,
// it was nominally validated, and `snapshotIdOf(it) !== it.snapshot_id`. The rule is now that
// nothing gets past the decoder that does not reproduce its own ID from its own bytes.
describe('every accepted document reproduces its own snapshot_id', () => {
  it.each(VALID_EXAMPLES)('%s', (name) => {
    const decoded = decodeResultEnvelope(example(name)) as unknown as Record<string, unknown>
    expect(snapshotIdOf(decoded)).toBe(decoded.snapshot_id)
  })

  // Not just the samples: the same invariant is asserted for whatever the shared ACCEPT probes
  // produce, which is where a normalising decoder would show up first.
  it.each(
    CASES.filter((probe) => probe.expected_acceptance === 'ACCEPT').map(
      (probe) => [probe.case_id, probe] as const,
    ),
  )('%s', (_id, probe) => {
    const decoded = decodeResultEnvelope(applyCase(probe)) as unknown as Record<string, unknown>
    expect(snapshotIdOf(decoded)).toBe(decoded.snapshot_id)
  })

  // The counter-case, stated directly rather than only through a probe: the hash is right for the
  // sorted reading of the content, and the document is still refused - for order, not for hash.
  it('refuses unsorted wire that carries the hash of its sorted content', () => {
    const document = example(UNIT)
    const sortedHash = document.snapshot_id
    document.evidence_domains = [...(document.evidence_domains as unknown[])].reverse()
    expect(document.snapshot_id).toBe(sortedHash)
    let rule: SemanticRule | 'SCHEMA' | undefined
    try {
      decodeResultEnvelope(document)
    } catch (error) {
      rule = violationRule(error)
    }
    expect(rule).toBe('CANONICAL_SET_ORDER')
  })

  // The shared probes for this carry a precomputed hash. These recompute it honestly from the
  // unsorted document, which closes the other half: the order rule has to fire on its own, not
  // as a side effect of a hash that no longer matches.
  //
  // The descending values are real contract members, because an invented one would be refused by
  // the enum or digest rule before the order rule was ever reached.
  it.each([
    ['claims', UNIT, 'claims', ['MULTI_SOURCE_ALIGNED', 'BUY_DEMAND_STRENGTHENING']],
    ['missing_member_ids', COLLECTION, 'missing_member_ids', ['market:z', 'market:a']],
    ['unavailable_member_ids', COLLECTION, 'unavailable_member_ids', ['market:z', 'market:a']],
  ] as const)('refuses unsorted %s even after an honest rehash', (_label, file, field, values) => {
    const document = example(file)
    // A single-element array cannot be out of order, so the fixture has to be widened first;
    // member_count moves with it so the accounting rule does not fire before the order rule.
    const before = (document[field] as string[]).length
    document[field] = [...values]
    if (file === COLLECTION) {
      document.member_count = (document.member_count as number) + values.length - before
    }
    document.snapshot_id = snapshotIdOf(document)
    let rule: SemanticRule | 'SCHEMA' | undefined
    try {
      decodeResultEnvelope(document)
    } catch (error) {
      rule = violationRule(error)
    }
    expect(rule).toBe('CANONICAL_SET_ORDER')
  })
})

// FE-RC-001B claimed the decoder's output could not be tampered with and it could: the audit
// rewrote as_of after decoding and walked the result into the adapter. These are the regressions
// the rejection asked for, over time, identity and accounting.
describe('a decoded envelope cannot be rewritten after validation', () => {
  it('is frozen all the way down', () => {
    const unit = decodeUnitResult(example(UNIT))
    expect(Object.isFrozen(unit)).toBe(true)
    expect(Object.isFrozen(unit.identity)).toBe(true)
    expect(Object.isFrozen(unit.evidence_domains)).toBe(true)
    expect(Object.isFrozen(unit.evidence_domains[0])).toBe(true)
  })

  it.each([
    [
      'time',
      (unit: Record<string, unknown>) => {
        unit.as_of = 'not-a-time'
      },
    ],
    [
      'identity',
      (unit: Record<string, unknown>) => {
        ;(unit.identity as Record<string, unknown>).display_name = 'rewritten'
      },
    ],
  ])('refuses a rewrite of %s and keeps the original value', (_label, rewrite) => {
    const unit = decodeUnitResult(example(UNIT))
    const before = JSON.stringify(unit)
    expect(() => rewrite(unit as unknown as Record<string, unknown>)).toThrow(TypeError)
    expect(JSON.stringify(unit)).toBe(before)
  })

  it('refuses a rewrite of collection accounting', () => {
    const collection = decodeCollectionResult(example(COLLECTION))
    const before = collection.member_count
    expect(() => {
      ;(collection as unknown as Record<string, unknown>).member_count = 99
    }).toThrow(TypeError)
    expect(collection.member_count).toBe(before)
    expect(() => {
      ;(collection.missing_member_ids as string[]).push('market:injected')
    }).toThrow(TypeError)
    expect(collection.missing_member_ids).toHaveLength(1)
  })

  it('leaves the caller own object alone', () => {
    const payload = example(UNIT)
    decodeResultEnvelope(payload)
    expect(Object.isFrozen(payload)).toBe(false)
  })

  // The rewritten value cannot reach a component either, because the adapter refuses anything
  // the decoder did not produce - the brand is a WeakSet entry, not just a TypeScript type.
  it('refuses an unvalidated look-alike at the adapter boundary', () => {
    const forged = JSON.parse(JSON.stringify(example(UNIT)))
    forged.as_of = 'not-a-time'
    expect(() => unitResultView(forged)).toThrow(/unitResultView/)
    const forgedCollection = JSON.parse(JSON.stringify(example(COLLECTION)))
    expect(() => collectionResultView(forgedCollection)).toThrow(/collectionResultView/)
  })

  it('accepts what the decoder did produce', () => {
    expect(() => unitResultView(decodeUnitResult(example(UNIT)))).not.toThrow()
    expect(() => collectionResultView(decodeCollectionResult(example(COLLECTION)))).not.toThrow()
  })
})
