import { nativeCnyTimestampMicros } from './nativeCnyTimestamp'

// The published Python wire has signed-64-bit item IDs. JSON.parse on the
// entire body would silently round them before any identity check could run.
export const NATIVE_CNY_SINGLE_MAX_BYTES = 64 * 1024
export const NATIVE_CNY_SINGLE_PROTOCOL_SHA256 = '8f3e637281413ef96b642e7b286685a2769ad349acf89d743320d309e15d4ea8'
export const NATIVE_CNY_SINGLE_HOURLY_POLICY = 'NATIVE_CNY_HOURLY_GRID_DAILY_MAX_21_OF_24_V1'
const MAX_ITEM = 9223372036854775807n
const FAMILIES = ['SUPPLY_LEAD', 'RECENT_PERSISTENT', 'COINCIDENT'] as const
type Family = typeof FAMILIES[number]
type Signal = 'TRUE' | 'FALSE' | 'UNKNOWN'
type Disposition = 'FIRST_ENTRY' | 'REENTRY' | 'LEFT_CENSORED' | 'CONTINUATION' | 'FALSE' | 'UNKNOWN'

export class NativeCnySingleDecodeError extends Error {
  constructor(readonly reason: string) {
    super(`invalid native CNY single response: ${reason}`)
    this.name = 'NativeCnySingleDecodeError'
  }
}

function requireSingle(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new NativeCnySingleDecodeError(reason)
}

/** Only this wire's integer numbers are needed; all remain BigInt until checked. */
export function parseNativeCnySingleJson(text: string): unknown {
  requireSingle(text.length <= NATIVE_CNY_SINGLE_MAX_BYTES
    && new TextEncoder().encode(text).byteLength <= NATIVE_CNY_SINGLE_MAX_BYTES, 'JSON byte limit')
  let position = 0
  const space = () => { while (/[\x20\t\r\n]/u.test(text[position] ?? '') && position < text.length) position++ }
  const string = (): string => {
    const start = position++
    let escaped = false
    while (position < text.length) {
      const character = text[position++]
      if (!escaped && character === '"') {
        let value: unknown
        try { value = JSON.parse(text.slice(start, position)) as unknown } catch { throw new NativeCnySingleDecodeError('JSON string') }
        requireSingle(typeof value === 'string', 'JSON string')
        for (let index = 0; index < value.length; index++) {
          const unit = value.charCodeAt(index)
          if (unit >= 0xd800 && unit <= 0xdbff) {
            const next = value.charCodeAt(++index)
            requireSingle(next >= 0xdc00 && next <= 0xdfff, 'JSON surrogate')
          } else requireSingle(unit < 0xdc00 || unit > 0xdfff, 'JSON surrogate')
        }
        return value
      }
      escaped = !escaped && character === '\\'
    }
    throw new NativeCnySingleDecodeError('JSON string')
  }
  const value = (depth: number): unknown => {
    requireSingle(depth <= 64, 'JSON nesting limit')
    space()
    const character = text[position]
    if (character === '"') return string()
    if (character === '{') {
      position++
      const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>
      const seen = new Set<string>()
      space()
      if (text[position] === '}') { position++; return result }
      while (true) {
        space()
        requireSingle(text[position] === '"', 'JSON object key')
        const key = string()
        requireSingle(!seen.has(key), 'JSON duplicate key')
        seen.add(key)
        space()
        requireSingle(text[position++] === ':', 'JSON object colon')
        result[key] = value(depth + 1)
        space()
        const separator = text[position++]
        if (separator === '}') return result
        requireSingle(separator === ',', 'JSON object separator')
      }
    }
    if (character === '[') {
      position++
      const result: unknown[] = []
      space()
      if (text[position] === ']') { position++; return result }
      while (true) {
        result.push(value(depth + 1))
        space()
        const separator = text[position++]
        if (separator === ']') return result
        requireSingle(separator === ',', 'JSON array separator')
      }
    }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]] as const) {
      if (text.startsWith(token, position)) { position += token.length; return result }
    }
    const integer = /^-?(?:0|[1-9][0-9]*)/u.exec(text.slice(position))
    requireSingle(integer !== null, 'JSON integer')
    position += integer[0].length
    requireSingle(!/[.eE0-9]/u.test(text[position] ?? ''), 'JSON integer token')
    return BigInt(integer[0])
  }
  const result = value(0)
  space()
  requireSingle(position === text.length, 'JSON trailing input')
  return result
}

export type NativeCnySingleBinding = Readonly<{
  itemId: string
  publicationId: string
  publicSha256: string
  rightsSha256: string
  reviewSha256: string
  catalogPublicationId: string
  day: string
}>

export type NativeCnySingleFeature = Readonly<{
  item_id: string
  analysis_unit_id: string
  stage: null
  signals: Readonly<Record<Family, Signal>>
  dispositions: Readonly<Record<Family, Disposition>>
  first_available_at: string
  history_state: 'EXACT_BOUND' | 'UNKNOWN_NO_ARCHIVE_IDENTITY'
  baseline_month: string
  qualified_baseline_days: number
  current_qualified: boolean
  recent_complete: boolean
  reference_complete: boolean
}>

export type NativeCnySingleTrigger = Readonly<{
  trigger_id: string
  item_id: string
  family: Family
  entry_kind: 'FIRST_ENTRY' | 'REENTRY'
  onset_day: string
  computed_at: string
  first_available_at: string
  knowledge_mode: 'RETROSPECTIVE_LATE_BOUND'
  public_label: null | '历史重建'
}>

export type NativeCnySingleDay = Readonly<{
  api_contract: 'native-cny-single-day/1'
  publication_id: string
  public_sha256: string
  rights_sha256: string
  review_sha256: string
  released_at: string
  data: Readonly<{
    schema: 'native-cny-single-public-day/1'
    basis: 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1'
    currency: 'CNY'
    fx_applied: false
    method: 'CLAUDE_SEED_V2_HH55_X3'
    protocol_sha256: string
    hourly_policy: string
    day: string
    daily_origin: 'ARCHIVE_RECONSTRUCTION' | 'MEASURED_HOURLY_GRID'
    computed_at: string
    first_available_at: string
    knowledge_mode: 'RETROSPECTIVE_LATE_BOUND'
    catalog_publication_id: string
    features: readonly NativeCnySingleFeature[]
    triggers: readonly NativeCnySingleTrigger[]
    prospective_validation_credit: false
  }>
}>

function fields(value: unknown, names: readonly string[], reason: string): Record<string, unknown> {
  requireSingle(value !== null && typeof value === 'object' && !Array.isArray(value), reason)
  const record = value as Record<string, unknown>
  requireSingle(Object.keys(record).length === names.length && names.every((name) => Object.hasOwn(record, name)), reason)
  return record
}

function hash(value: unknown): asserts value is string {
  requireSingle(typeof value === 'string' && value.length === 64 && /^[0-9a-f]{64}$/u.test(value), 'SHA256')
}

function dayMillis(value: unknown): number {
  requireSingle(typeof value === 'string' && value.length === 10 && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u.test(value), 'day')
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(0, 0, 0, 0)
  requireSingle(year >= 1 && date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day, 'day')
  return date.getTime()
}

// Match ingestion.native_cny.timestamp: exact microseconds, explicit timezone,
// and extra fractional digits only when zero. Never compare rounded Date.parse.
function timestampMicros(value: unknown): bigint {
  try { return nativeCnyTimestampMicros(value) }
  catch { throw new NativeCnySingleDecodeError('timestamp') }
}

function item(value: unknown): string {
  requireSingle(typeof value === 'bigint' && value >= 0n && value <= MAX_ITEM, 'item identity')
  return value.toString()
}

export function checkedNativeCnySingleBinding(expected: NativeCnySingleBinding): NativeCnySingleBinding {
  requireSingle(expected !== null && typeof expected === 'object' && typeof expected.itemId === 'string'
    && /^(?:0|[1-9][0-9]{0,18})$/u.test(expected.itemId) && BigInt(expected.itemId) <= MAX_ITEM
    && BigInt(expected.itemId).toString() === expected.itemId, 'expected item identity')
  for (const name of ['publicationId', 'publicSha256', 'rightsSha256', 'reviewSha256', 'catalogPublicationId'] as const) hash(expected[name])
  dayMillis(expected.day)
  // Snapshot before awaiting transport; caller mutation cannot change the pin.
  return Object.freeze({ itemId: expected.itemId, publicationId: expected.publicationId,
    publicSha256: expected.publicSha256, rightsSha256: expected.rightsSha256,
    reviewSha256: expected.reviewSha256, catalogPublicationId: expected.catalogPublicationId, day: expected.day })
}

export function decodeNativeCnySingleDay(payload: unknown, binding: NativeCnySingleBinding): NativeCnySingleDay {
  const expected = checkedNativeCnySingleBinding(binding)
  const envelope = fields(payload, ['api_contract', 'publication_id', 'public_sha256', 'rights_sha256', 'review_sha256', 'released_at', 'data'], 'envelope fields')
  requireSingle(envelope.api_contract === 'native-cny-single-day/1', 'API contract')
  for (const [key, pin] of [['publication_id', expected.publicationId], ['public_sha256', expected.publicSha256],
    ['rights_sha256', expected.rightsSha256], ['review_sha256', expected.reviewSha256]] as const) requireSingle(envelope[key] === pin, `expected ${key}`)
  const released = timestampMicros(envelope.released_at)
  const data = fields(envelope.data, ['schema', 'basis', 'currency', 'fx_applied', 'method', 'protocol_sha256', 'hourly_policy',
    'day', 'daily_origin', 'computed_at', 'first_available_at', 'knowledge_mode', 'catalog_publication_id',
    'features', 'triggers', 'prospective_validation_credit'], 'day fields')
  requireSingle(data.schema === 'native-cny-single-public-day/1' && data.basis === 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1'
    && data.currency === 'CNY' && data.fx_applied === false && data.method === 'CLAUDE_SEED_V2_HH55_X3'
    && data.protocol_sha256 === NATIVE_CNY_SINGLE_PROTOCOL_SHA256 && data.hourly_policy === NATIVE_CNY_SINGLE_HOURLY_POLICY
    && data.prospective_validation_credit === false && data.knowledge_mode === 'RETROSPECTIVE_LATE_BOUND', 'native HH55/X3 contract')
  requireSingle(data.day === expected.day && data.catalog_publication_id === expected.catalogPublicationId, 'expected day/catalog')
  requireSingle(data.daily_origin === 'ARCHIVE_RECONSTRUCTION' || data.daily_origin === 'MEASURED_HOURLY_GRID', 'daily origin')
  const available = timestampMicros(data.first_available_at), computed = timestampMicros(data.computed_at)
  requireSingle(available <= computed && computed <= released, 'release clock')
  requireSingle(Array.isArray(data.features) && data.features.length === 1
    && Array.isArray(data.triggers) && data.triggers.length >= 1 && data.triggers.length <= 3, 'selected item counts')
  const row = fields(data.features[0], ['item_id', 'analysis_unit_id', 'stage', 'signals', 'dispositions', 'first_available_at',
    'history_state', 'baseline_month', 'qualified_baseline_days', 'current_qualified', 'recent_complete', 'reference_complete'], 'feature fields')
  const itemId = item(row.item_id)
  requireSingle(itemId === expected.itemId && row.analysis_unit_id === `item:${itemId}` && row.stage === null, 'selected feature identity/stage')
  const signals = fields(row.signals, FAMILIES, 'signal families')
  const dispositions = fields(row.dispositions, FAMILIES, 'disposition families')
  for (const family of FAMILIES) {
    requireSingle(['TRUE', 'FALSE', 'UNKNOWN'].includes(signals[family] as string)
      && ['FIRST_ENTRY', 'REENTRY', 'LEFT_CENSORED', 'CONTINUATION', 'FALSE', 'UNKNOWN'].includes(dispositions[family] as string)
      && (signals[family] === 'UNKNOWN') === (dispositions[family] === 'UNKNOWN')
      && (signals[family] === 'FALSE') === (dispositions[family] === 'FALSE'), 'signals/dispositions')
  }
  requireSingle(row.history_state === 'EXACT_BOUND' || row.history_state === 'UNKNOWN_NO_ARCHIVE_IDENTITY', 'history state')
  requireSingle(typeof row.baseline_month === 'string' && row.baseline_month.length === 7
    && /^[0-9]{4}-(?:0[1-9]|1[0-2])$/u.test(row.baseline_month), 'baseline month')
  requireSingle(typeof row.qualified_baseline_days === 'bigint' && row.qualified_baseline_days >= 0n && row.qualified_baseline_days <= 365n, 'baseline count')
  requireSingle(typeof row.current_qualified === 'boolean' && typeof row.recent_complete === 'boolean' && typeof row.reference_complete === 'boolean', 'qualification flags')
  requireSingle(timestampMicros(row.first_available_at) <= available, 'feature clock')
  const feature: NativeCnySingleFeature = Object.freeze({
    item_id: itemId, analysis_unit_id: `item:${itemId}`, stage: null,
    signals: Object.freeze({ ...signals }) as Readonly<Record<Family, Signal>>,
    dispositions: Object.freeze({ ...dispositions }) as Readonly<Record<Family, Disposition>>,
    first_available_at: row.first_available_at as string, history_state: row.history_state,
    baseline_month: row.baseline_month, qualified_baseline_days: Number(row.qualified_baseline_days),
    current_qualified: row.current_qualified, recent_complete: row.recent_complete, reference_complete: row.reference_complete,
  })
  const seen = new Set<Family>()
  const triggers = data.triggers.map((value): NativeCnySingleTrigger => {
    const trigger = fields(value, ['trigger_id', 'item_id', 'family', 'entry_kind', 'onset_day', 'computed_at',
      'first_available_at', 'knowledge_mode', 'public_label'], 'trigger fields')
    hash(trigger.trigger_id)
    requireSingle(item(trigger.item_id) === itemId && FAMILIES.includes(trigger.family as Family), 'trigger identity/family')
    const family = trigger.family as Family
    requireSingle(!seen.has(family) && (trigger.entry_kind === 'FIRST_ENTRY' || trigger.entry_kind === 'REENTRY')
      && feature.signals[family] === 'TRUE' && feature.dispositions[family] === trigger.entry_kind
      && trigger.onset_day === data.day && trigger.computed_at === data.computed_at
      && trigger.first_available_at === feature.first_available_at && trigger.knowledge_mode === data.knowledge_mode
      && (trigger.public_label === null || trigger.public_label === '历史重建'), 'trigger binding')
    seen.add(family)
    return Object.freeze({ trigger_id: trigger.trigger_id, item_id: itemId, family, entry_kind: trigger.entry_kind,
      onset_day: expected.day, computed_at: data.computed_at as string, first_available_at: feature.first_available_at,
      knowledge_mode: 'RETROSPECTIVE_LATE_BOUND', public_label: trigger.public_label })
  })
  requireSingle(FAMILIES.every((family) => seen.has(family)
    === (feature.dispositions[family] === 'FIRST_ENTRY' || feature.dispositions[family] === 'REENTRY')), 'trigger coverage')
  return Object.freeze({ api_contract: 'native-cny-single-day/1', publication_id: expected.publicationId,
    // This digest seals the original published day, NOT this filtered detail body.
    public_sha256: expected.publicSha256, rights_sha256: expected.rightsSha256, review_sha256: expected.reviewSha256,
    released_at: envelope.released_at as string,
    data: Object.freeze({ schema: 'native-cny-single-public-day/1', basis: 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1',
      currency: 'CNY', fx_applied: false, method: 'CLAUDE_SEED_V2_HH55_X3', protocol_sha256: NATIVE_CNY_SINGLE_PROTOCOL_SHA256,
      hourly_policy: NATIVE_CNY_SINGLE_HOURLY_POLICY, day: expected.day, daily_origin: data.daily_origin,
      computed_at: data.computed_at as string, first_available_at: data.first_available_at as string,
      knowledge_mode: 'RETROSPECTIVE_LATE_BOUND', catalog_publication_id: expected.catalogPublicationId,
      features: Object.freeze([feature]), triggers: Object.freeze(triggers), prospective_validation_credit: false }),
  })
}
