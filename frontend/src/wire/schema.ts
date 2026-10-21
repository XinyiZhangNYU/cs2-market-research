// The formal wire schema, imported from the repository root rather than copied under frontend/.
// A copy could drift, and a drifted copy that still passes its own tests is worse than no copy:
// it would keep reporting agreement with a contract it no longer matches. Everything in this
// directory validates against this one file.
//
// contracts/result-contract/v1/RESOLUTIONS.md carries the decisions this schema encodes:
// RC-R001 (unit and collection both carry as_of), RC-R002 (exact member accounting),
// RC-R003 (P/D/S whitelist), RC-R005 (wire scope_kind is MARKET/SECTOR/ITEM only).
import schema from '../../../schemas/research-result-envelope.v1.schema.json'

export const RESULT_ENVELOPE_SCHEMA = schema

export const RESULT_ENVELOPE_SCHEMA_ID = 'urn:cs2-research:research-result-envelope:v1'

// Reading the schema's own lists is how the drift tests stay mechanical. Hand-copying an enum
// into a test would recreate the second-copy problem one level down: the copy would keep
// agreeing with itself after the contract moved.
function resolve(pointer: string): unknown {
  return pointer
    .split('/')
    .filter((segment) => segment.length > 0)
    .reduce<unknown>((node, segment) => {
      const key = segment.replace(/~1/g, '/').replace(/~0/g, '~')
      if (node === null || typeof node !== 'object') throw new Error(`no node at ${pointer}`)
      const next = (node as Record<string, unknown>)[key]
      if (next === undefined) throw new Error(`no node at ${pointer}`)
      return next
    }, RESULT_ENVELOPE_SCHEMA)
}

export function schemaEnum(pointer: string): readonly (string | null)[] {
  const values = (resolve(pointer) as { enum?: readonly (string | null)[] }).enum
  if (!values) throw new Error(`${pointer} has no enum`)
  return values
}

export function schemaRequired(pointer: string): readonly string[] {
  const required = (resolve(pointer) as { required?: readonly string[] }).required
  if (!required) throw new Error(`${pointer} has no required list`)
  return required
}

export function schemaNode(pointer: string): Record<string, unknown> {
  const node = resolve(pointer)
  if (node === null || typeof node !== 'object') throw new Error(`${pointer} is not a node`)
  return node as Record<string, unknown>
}

export function schemaHas(pointer: string): boolean {
  try {
    resolve(pointer)
    return true
  } catch {
    return false
  }
}

// The scalar vocabulary the drift gate speaks. `array<string>` rather than plain `array` so a
// change to an item type is caught too; nested objects are covered by their own tag table.
export type TypeTag =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | `array<${'string' | 'number' | 'boolean' | 'object'}>`
  | `${'string' | 'number' | 'boolean' | 'object'}|null`

function baseTagOfLiterals(values: readonly unknown[]): string {
  const kinds = new Set(values.filter((value) => value !== null).map((value) => typeof value))
  if (kinds.size !== 1) throw new Error(`ambiguous literal types: ${[...kinds].join(',')}`)
  const kind = [...kinds][0]
  if (kind === 'string' || kind === 'boolean') return kind
  if (kind === 'number') return 'number'
  throw new Error(`unsupported literal type ${kind}`)
}

function baseTag(node: Record<string, unknown>): string {
  if (typeof node.$ref === 'string') return baseTag(schemaNode(node.$ref.replace(/^#/, '')))
  if ('const' in node) return baseTagOfLiterals([node.const])
  if (Array.isArray(node.enum)) return baseTagOfLiterals(node.enum)
  const declared = node.type
  const types = (Array.isArray(declared) ? declared : [declared]).filter(
    (value) => value !== 'null',
  )
  if (types.length !== 1) throw new Error(`ambiguous type declaration: ${JSON.stringify(declared)}`)
  switch (types[0]) {
    case 'string':
      return 'string'
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'object':
      return 'object'
    case 'array': {
      const items = node.items
      if (items === undefined) throw new Error('array without items')
      return `array<${baseTag(items as Record<string, unknown>)}>`
    }
    default:
      throw new Error(`unsupported type ${String(types[0])}`)
  }
}

function isNullable(node: Record<string, unknown>): boolean {
  if (typeof node.$ref === 'string') return isNullable(schemaNode(node.$ref.replace(/^#/, '')))
  if (Array.isArray(node.type) && node.type.includes('null')) return true
  if (Array.isArray(node.enum) && node.enum.includes(null)) return true
  if (Array.isArray(node.oneOf)) {
    return node.oneOf.some(
      (branch) => (branch as Record<string, unknown>).type === 'null',
    )
  }
  return false
}

function nonNullBranches(node: Record<string, unknown>): Record<string, unknown>[] {
  if (!Array.isArray(node.oneOf)) return [node]
  const branches = (node.oneOf as Record<string, unknown>[]).filter(
    (branch) => branch.type !== 'null',
  )
  if (branches.length === 0) throw new Error('oneOf has no non-null branch')
  return branches
}

// Reads the scalar type the schema declares for one property, so src/wire/fieldTags.ts can be
// checked against the contract instead of against itself.
export function schemaTypeTag(pointer: string): TypeTag {
  const node = schemaNode(pointer)
  const nullable = isNullable(node)
  // A polymorphic branch (state is one of three shapes) still has one scalar kind; if the
  // branches ever disagreed on that, the schema would be saying something this gate cannot
  // represent, and it should fail loudly rather than pick one.
  const tags = new Set(nonNullBranches(node).map(baseTag))
  if (tags.size !== 1) throw new Error(`${pointer} mixes scalar kinds: ${[...tags].join(',')}`)
  const tag = [...tags][0]
  return (nullable ? `${tag}|null` : tag) as TypeTag
}

// The named string vocabularies the schema defines. Every string-valued leaf in the contract
// resolves to exactly one of these, to an inline enum, or to a fixed const - and which one it
// resolves to is part of the contract, not an implementation detail. `advancing_member_ratio`
// used to be `nonblank_text`, so a ratio of "1.01" and a return of "1e-3" were legal wire; the
// scalar tag table cannot see that change, because both spellings are `string|null`.
export const TEXT_KINDS = [
  'sha256',
  'timestamp',
  'nonblank_text',
  'ratio_decimal_text',
  'signed_fixed_decimal_text',
] as const

export type TextKind = (typeof TEXT_KINDS)[number]
export type TextTag = TextKind | 'enum' | `${TextKind | 'enum'}|null`

// Compiled from the shared file with the `u` flag, which is not decoration: the pattern excludes
// U+D800-U+DFFF to bar unpaired surrogates, and without `u` that range also matches each half of
// a well-formed astral pair, so "🗡 knives" would be refused. Ajv compiles the same pattern with
// the same flag (its unicodeRegExp option defaults to true) - asserted in tests/wire-schema.test.ts,
// because turning that option off would silently reintroduce the divergence.
export function schemaPattern(kind: TextKind): RegExp {
  const pattern = schemaNode(`/$defs/${kind}`).pattern
  if (typeof pattern !== 'string') throw new Error(`${kind} has no pattern`)
  return new RegExp(pattern, 'u')
}

function textTagOf(node: Record<string, unknown>): TextTag | undefined {
  const ref = node.$ref
  if (typeof ref === 'string') {
    const name = ref.replace('#/$defs/', '')
    if ((TEXT_KINDS as readonly string[]).includes(name)) return name as TextKind
    return textTagOf(schemaNode(ref.replace(/^#/, '')))
  }
  // A const string is a one-member enum, and the schema uses both spellings for the same field:
  // `trade_confirmation` is declared as an enum and narrowed to a const inside the branch-B
  // conditional. Keeping them apart would report that narrowing as a contradiction. What this
  // gate is for is the *text vocabulary* - free text against decimal against digest - and enum
  // membership drift already has its own test.
  if (typeof node.const === 'string') return 'enum'
  if (Array.isArray(node.enum)) {
    const values = node.enum.filter((value) => value !== null)
    if (values.length === 0 || values.some((value) => typeof value !== 'string')) return undefined
    return node.enum.includes(null) ? 'enum|null' : 'enum'
  }
  if (Array.isArray(node.oneOf)) {
    const branches = node.oneOf as Record<string, unknown>[]
    const nullable = branches.some((branch) => branch.type === 'null')
    const tags = new Set(
      branches
        .filter((branch) => branch.type !== 'null')
        .map(textTagOf)
        .filter((tag): tag is TextTag => tag !== undefined),
    )
    if (tags.size !== 1) return undefined
    const tag = [...tags][0]
    return nullable ? (`${tag}|null` as TextTag) : tag
  }
  // `evidence_coverage` states the 0-through-1 decimal pattern inline instead of referencing
  // `ratio_decimal_text`, so matching only on `$ref` would leave it out of the map entirely and
  // the coverage assertion would pass while one string field went unchecked. Matching on the
  // pattern itself also means that if the two spellings of the same vocabulary ever diverge, the
  // field drops out of the map and the coverage assertion turns red.
  if (node.type === 'string' && typeof node.pattern === 'string') {
    const named = TEXT_KINDS.filter((kind) => schemaNode(`/$defs/${kind}`).pattern === node.pattern)
    if (named.length === 1) return named[0]
  }
  return undefined
}

// Conditional subschemas restate a field that already has a home, and they restate it more
// narrowly: `analysis_unit_kind` is declared `enum|null` and narrowed to non-null inside the ITEM
// branch. So the declaration reached without passing through a conditional is authoritative, and
// a conditional may only fill in a path that has no declaration at all. Two declarations that
// disagree - or two conditional-only readings that disagree - are a genuinely ambiguous contract
// and stop the walk instead of being resolved by walk order.
function walkText(
  node: unknown,
  path: string,
  declared: Map<string, TextTag>,
  narrowed: Map<string, TextTag>,
  conditional: boolean,
  depth = 0,
): void {
  if (depth > 24) throw new Error('the schema walk did not terminate')
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return
  const record = node as Record<string, unknown>
  const tag = textTagOf(record)
  if (tag !== undefined) {
    const target = conditional ? narrowed : declared
    const seen = target.get(path)
    if (seen !== undefined && seen !== tag) throw new Error(`${path} is both ${seen} and ${tag}`)
    target.set(path, tag)
    return
  }
  if (typeof record.$ref === 'string') {
    walkText(schemaNode(record.$ref.replace(/^#/, '')), path, declared, narrowed, conditional, depth + 1)
    return
  }
  const properties = record.properties
  if (properties !== null && typeof properties === 'object') {
    for (const [name, child] of Object.entries(properties as Record<string, unknown>)) {
      walkText(child, `${path}/${name}`, declared, narrowed, conditional, depth + 1)
    }
  }
  walkText(record.items, `${path}/*`, declared, narrowed, conditional, depth + 1)
  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
    const branches = record[key]
    if (Array.isArray(branches)) {
      for (const branch of branches) {
        walkText(branch, path, declared, narrowed, true, depth + 1)
      }
    }
  }
  for (const key of ['if', 'then', 'else'] as const) {
    walkText(record[key], path, declared, narrowed, true, depth + 1)
  }
}

// Every string-valued instance path in the contract, with the vocabulary it must use. Read out
// of the schema so src/wire/fieldTags.ts is checked against the contract rather than itself.
export function schemaTextKinds(): Record<string, TextTag> {
  const declared = new Map<string, TextTag>()
  const narrowed = new Map<string, TextTag>()
  for (const root of ['/$defs/unit_result', '/$defs/collection_result']) {
    walkText(schemaNode(root), '', declared, narrowed, false)
  }
  for (const [path, tag] of narrowed) if (!declared.has(path)) declared.set(path, tag)
  return Object.fromEntries([...declared].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
}
