// The only door into the frontend, and the only producer of the Validated* types. Three steps,
// in this order:
//
//   1. structure  - the shared JSON Schema (src/wire/schema.ts)
//   2. semantics  - the cross-field rules the schema cannot state (src/wire/semantic.ts)
//   3. sealing    - a private deep-frozen copy, registered so the adapter can tell it apart
//
// Step 3 is what makes the boundary real rather than asserted. FE-RC-001B returned the caller's
// own object with writable fields and a comment claiming this could not happen; the audit
// rewrote as_of to 'not-a-time' after decoding and walked it straight into the adapter.
import type { ErrorObject } from 'ajv/dist/2020'
import { validateResultEnvelope } from './generated/resultEnvelopeValidator.js'
import { RESULT_ENVELOPE_SCHEMA } from './schema'
import { SemanticViolation, checkResultSemantics, type SemanticRule } from './semantic'
import {
  seal,
  type ValidatedCollectionResult,
  type ValidatedResultEnvelope,
  type ValidatedUnitResult,
} from './validated'

// The two layers overlap: blank text, timestamp spelling, digest shape, the missing_reason
// conditional and the coverage range are stated both structurally and semantically. When the
// structural pass refuses one of those, the semantic pass is asked to name it, so a caller gets
// the same rule name Python would have reported rather than an anonymous "SCHEMA".
//
// An earlier attempt mapped Ajv's `schemaPath` prefixes to rule names. That was wrong: Ajv
// reports schemaPath relative to the subschema being compiled, so `$defs/evidence_domain`'s own
// conditional surfaces as `#/allOf/0/if`, not as `#/$defs/evidence_domain/allOf/0/if`, and the
// mapping silently matched nothing. Asking the layer that actually owns the rule avoids guessing
// at another library's error vocabulary.
function ruleFromSemantics(payload: unknown): SemanticRule | undefined {
  try {
    checkResultSemantics(payload as Parameters<typeof checkResultSemantics>[0])
  } catch (error) {
    // Anything else means the payload was too malformed for the semantic pass to reach a rule,
    // which is precisely the case where 'SCHEMA' is the honest answer.
    if (error instanceof SemanticViolation) return error.rule
  }
  return undefined
}

export class WireContractViolation extends Error {
  readonly errors: readonly ErrorObject[]
  readonly rule: SemanticRule | 'SCHEMA'

  constructor(errors: readonly ErrorObject[], rule?: SemanticRule) {
    super(
      `result envelope rejected by ${RESULT_ENVELOPE_SCHEMA.$id}: ` +
        errors.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; '),
    )
    this.name = 'WireContractViolation'
    this.errors = errors
    this.rule = rule ?? 'SCHEMA'
  }
}

export { validateResultEnvelope }

// Reported by both layers, so a caller can ask one question - which rule refused this? - and
// not care whether the answer came from the schema or from the semantic pass.
export function violationRule(error: unknown): SemanticRule | 'SCHEMA' | undefined {
  if (error instanceof SemanticViolation) return error.rule
  if (error instanceof WireContractViolation) return error.rule
  return undefined
}

function kindMismatch(expected: string, actual: unknown): WireContractViolation {
  return new WireContractViolation([
    {
      instancePath: '/envelope_kind',
      schemaPath: '#/envelope_kind',
      keyword: 'const',
      params: { allowedValue: expected },
      message: `expected a ${expected} envelope, got ${String(actual)}`,
    },
  ])
}

export function decodeResultEnvelope(payload: unknown): ValidatedResultEnvelope {
  if (!validateResultEnvelope(payload)) {
    const errors = validateResultEnvelope.errors ?? []
    throw new WireContractViolation(errors, ruleFromSemantics(payload))
  }
  checkResultSemantics(payload)
  // structuredClone, not the caller's object: whoever handed the payload in keeps their
  // reference, and freezing theirs would be both a surprise and still no guarantee, because
  // they could have kept an inner reference from before the call.
  const sealed = structuredClone(payload) as object
  seal(sealed, (payload as { envelope_kind: 'UNIT' | 'COLLECTION' }).envelope_kind)
  return sealed as ValidatedResultEnvelope
}

export function decodeUnitResult(payload: unknown): ValidatedUnitResult {
  const envelope = decodeResultEnvelope(payload)
  if (envelope.envelope_kind !== 'UNIT') throw kindMismatch('UNIT', envelope.envelope_kind)
  return envelope
}

export function decodeCollectionResult(payload: unknown): ValidatedCollectionResult {
  const envelope = decodeResultEnvelope(payload)
  if (envelope.envelope_kind !== 'COLLECTION') {
    throw kindMismatch('COLLECTION', envelope.envelope_kind)
  }
  return envelope
}
