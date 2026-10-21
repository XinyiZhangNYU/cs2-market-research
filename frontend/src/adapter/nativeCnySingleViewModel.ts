import { NativeCnySingleHttpError } from '../api/HttpNativeCnySingleGateway'
import { BoundedJsonFetchError } from '../api/boundedJsonFetch'
import { checkedNativeCnySingleBinding, decodeNativeCnySingleDay, NativeCnySingleDecodeError } from '../wire/nativeCnySingleDecode'
import type { NativeCnySingleBinding, NativeCnySingleDay, NativeCnySingleFeature, NativeCnySingleTrigger } from '../wire/nativeCnySingleDecode'

/** The caller chooses and pins a publication; this interface has no latest/legacy route. */
export interface NativeCnySingleDetailGateway {
  readonly kind: 'HTTP_NATIVE_CNY_SINGLE'
  read(selection: NativeCnySingleBinding, options: { signal: AbortSignal }): Promise<NativeCnySingleDay>
}

type Family = keyof NativeCnySingleFeature['signals']
const FAMILIES: readonly Family[] = ['SUPPLY_LEAD', 'RECENT_PERSISTENT', 'COINCIDENT']

export type NativeCnySingleFamilyView = Readonly<{
  family: Family
  signal: NativeCnySingleFeature['signals'][Family]
  disposition: NativeCnySingleFeature['dispositions'][Family]
  trigger: NativeCnySingleTrigger | null
  triggerFact: 'PUBLISHED_OBSERVED_TRIGGER' | 'NO_PUBLISHED_TRIGGER_FOR_FAMILY'
}>

export type NativeCnySingleDetailView = Readonly<{
  selection: NativeCnySingleBinding
  rank: 'NO_RANK'
  stage: null
  price: 'NOT_PUBLISHED_IN_SINGLE_DETAIL'
  publicDigestScope: 'ORIGINAL_PUBLISHED_DAY_NOT_FILTERED_DETAIL'
  publication: NativeCnySingleDay
  feature: NativeCnySingleFeature
  families: readonly NativeCnySingleFamilyView[]
}>

export class NativeCnySingleViewError extends Error {
  constructor() {
    super('invalid native CNY single view binding')
    this.name = 'NativeCnySingleViewError'
  }
}

function wireItemId(value: string): bigint {
  // Never coerce a Number ID back into text: precision may already have been lost.
  if (typeof value !== 'string' || !/^(?:0|[1-9][0-9]{0,18})$/u.test(value)
    || BigInt(value).toString() !== value || BigInt(value) > 9223372036854775807n) {
    throw new NativeCnySingleViewError()
  }
  return BigInt(value)
}

/** Pure projection. Recheck injected gateway results against the entire external selection. */
export function nativeCnySingleDetailView(
  document: NativeCnySingleDay,
  selection: NativeCnySingleBinding,
): NativeCnySingleDetailView {
  const expected = checkedNativeCnySingleBinding(selection)
  if (document === null || typeof document !== 'object' || document.data === null
    || typeof document.data !== 'object' || !Array.isArray(document.data.features) || document.data.features.length !== 1
    || !Array.isArray(document.data.triggers) || document.data.triggers.length < 1
    || document.data.triggers.length > 3) throw new NativeCnySingleViewError()
  // Only the already-decoded IDs and bounded day count change representation.
  // The frozen wire decoder remains the authority for clocks, flags and trigger coverage.
  const checked = decodeNativeCnySingleDay({
    ...document,
    data: {
      ...document.data,
      features: document.data.features.map((row) => {
        if (row === null || typeof row !== 'object'
          || !Number.isInteger(row.qualified_baseline_days) || row.qualified_baseline_days < 0
          || row.qualified_baseline_days > 365) throw new NativeCnySingleViewError()
        return { ...row, item_id: wireItemId(row.item_id), qualified_baseline_days: BigInt(row.qualified_baseline_days) }
      }),
      triggers: document.data.triggers.map((trigger) => {
        if (trigger === null || typeof trigger !== 'object') throw new NativeCnySingleViewError()
        return { ...trigger, item_id: wireItemId(trigger.item_id) }
      }),
    },
  }, expected)
  const feature = checked.data.features[0]
  const families = FAMILIES.map((family): NativeCnySingleFamilyView => {
    const trigger = checked.data.triggers.find((value) => value.family === family) ?? null
    return Object.freeze({ family, signal: feature.signals[family], disposition: feature.dispositions[family],
      trigger, triggerFact: trigger === null ? 'NO_PUBLISHED_TRIGGER_FOR_FAMILY' : 'PUBLISHED_OBSERVED_TRIGGER' })
  })
  return Object.freeze({ selection: expected, rank: 'NO_RANK', stage: null,
    price: 'NOT_PUBLISHED_IN_SINGLE_DETAIL', publicDigestScope: 'ORIGINAL_PUBLISHED_DAY_NOT_FILTERED_DETAIL',
    publication: checked, feature, families: Object.freeze(families) })
}

export type NativeCnySingleProblemCode = 'INVALID_SELECTION' | 'INVALID_GATEWAY' | 'VALIDATION_ERROR'
  | 'INVALID_REQUEST' | 'NOT_PUBLISHED' | 'TEMPORARILY_UNAVAILABLE' | 'REQUEST_TIMEOUT'
  | 'NETWORK_UNAVAILABLE' | 'CANCELLED'

/** Fixed public explanations: no server body, arbitrary exception text or fallback. */
export function nativeCnySingleProblem(error: unknown): NativeCnySingleProblemCode {
  if (error instanceof NativeCnySingleHttpError) return error.code
  if (error instanceof NativeCnySingleDecodeError || error instanceof NativeCnySingleViewError) return 'VALIDATION_ERROR'
  if (error instanceof BoundedJsonFetchError) {
    return error.code === 'REQUEST_TIMEOUT' || error.code === 'NETWORK_UNAVAILABLE' ? error.code : 'VALIDATION_ERROR'
  }
  // Browser DOMException is not required to inherit from Error.
  if ((error instanceof Error || error instanceof DOMException) && error.name === 'AbortError') return 'CANCELLED'
  return 'NETWORK_UNAVAILABLE'
}
