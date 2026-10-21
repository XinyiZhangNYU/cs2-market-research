// The validated boundary. A WireUnitResult is a shape; a ValidatedUnitResult is a claim that
// the shape passed both contract layers and has not been touched since. The claim is carried
// two ways, because a type alone is erased at runtime and a frozen object alone is forgeable:
//   - compile time: an unforgeable brand, so the adapter cannot be handed a plain wire object;
//   - run time: deep freeze plus a registry only decode() writes to.
import type { WireCollectionResult, WireQualityResult, WireUnitResult } from './types'

declare const VALIDATED: unique symbol

export type DeepReadonly<T> = T extends readonly (infer Element)[]
  ? readonly DeepReadonly<Element>[]
  : T extends object
    ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
    : T

export type Validated<T, Kind extends string> = DeepReadonly<T> & {
  readonly [VALIDATED]: Kind
}

export type ValidatedUnitResult = Validated<WireUnitResult, 'UNIT'>
export type ValidatedCollectionResult = Validated<WireCollectionResult, 'COLLECTION'>
export type ValidatedQualityResult = Validated<WireQualityResult, 'QUALITY'>
export type ValidatedResultEnvelope = ValidatedUnitResult | ValidatedCollectionResult

export class UnvalidatedEnvelope extends Error {
  constructor(where: string) {
    super(`${where} was given an envelope that did not come from decodeResultEnvelope`)
    this.name = 'UnvalidatedEnvelope'
  }
}

export type ValidatedKind = 'UNIT' | 'COLLECTION' | 'QUALITY'
export type PresentableKind = 'UNIT_VIEW' | 'COLLECTION_VIEW' | 'QUALITY_VIEW'

// A WeakSet only proved "some decoded envelope" and "some adapter view". It did not preserve
// the Kind parameter carried by the TypeScript brand, so a cast could feed a validated
// COLLECTION into the UNIT adapter (or a COLLECTION view into the UNIT component), pass the
// runtime gate and fail later with an unrelated TypeError. The registry stores the kind too so
// the runtime and compile-time claims are the same claim.
const SEALED = new WeakMap<object, ValidatedKind>()
const PRESENTABLE_VIEWS = new WeakMap<object, PresentableKind>()

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  Object.freeze(value)
  for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry)
}

// Only decode() calls this, and only on a private copy it built itself.
export function seal(value: object, kind: ValidatedKind): void {
  deepFreeze(value)
  SEALED.set(value, kind)
}

export function isValidated(value: unknown, kind?: ValidatedKind): boolean {
  if (typeof value !== 'object' || value === null) return false
  const actual = SEALED.get(value)
  return actual !== undefined && (kind === undefined || actual === kind)
}

export function requireValidated<T>(value: T, where: string, kind?: ValidatedKind): T {
  if (!isValidated(value, kind)) throw new UnvalidatedEnvelope(where)
  return value
}

// The same boundary one step further out. The adapter's output is not an envelope - it has
// already dropped free text and reduced identifiers to tokens - so a component that accepted
// anything envelope-shaped would be accepting the wrong thing. It gets its own registry rather
// than sharing SEALED: a view must not pass for an envelope, and an envelope must not pass for
// a view. Without this, `{ ...view, identity: { ...identity, analysis_unit_id: { kind: 'TOKEN',
// value: 'MARKET_B' } } }` is a structurally perfect ResultUnitView that renders a source name into
// the DOM, and nothing in the type system would object, because spreading erases nothing.
declare const PRESENTABLE: unique symbol

export type Presentable<T, Kind extends string> = DeepReadonly<T> & {
  readonly [PRESENTABLE]: Kind
}

export class UnpresentableView extends Error {
  constructor(where: string) {
    super(`${where} was given a view that did not come from the result adapter`)
    this.name = 'UnpresentableView'
  }
}

// Only the adapter calls this, and only on an object it built itself out of a validated envelope.
export function sealView(value: object, kind: PresentableKind): void {
  deepFreeze(value)
  PRESENTABLE_VIEWS.set(value, kind)
}

export function isPresentable(value: unknown, kind?: PresentableKind): boolean {
  if (typeof value !== 'object' || value === null) return false
  const actual = PRESENTABLE_VIEWS.get(value)
  return actual !== undefined && (kind === undefined || actual === kind)
}

export function requirePresentable<T>(value: T, where: string, kind?: PresentableKind): T {
  if (!isPresentable(value, kind)) throw new UnpresentableView(where)
  return value
}
