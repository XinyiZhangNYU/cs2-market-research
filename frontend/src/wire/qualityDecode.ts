import type { ErrorObject } from 'ajv/dist/2020'
import {
  QUALITY_ENVELOPE_SCHEMA_ID,
} from './qualitySchema'
import { validateQualityEnvelope } from './generated/qualityEnvelopeValidator.js'
import {
  checkQualitySemantics,
  QualitySemanticViolation,
  type QualitySemanticRule,
} from './qualitySemantic'
import { seal, type ValidatedQualityResult } from './validated'

export { validateQualityEnvelope }

export class QualityWireContractViolation extends Error {
  readonly errors: readonly ErrorObject[]

  constructor(errors: readonly ErrorObject[]) {
    super(
      `quality envelope rejected by ${QUALITY_ENVELOPE_SCHEMA_ID}: ` +
        errors.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; '),
    )
    this.name = 'QualityWireContractViolation'
    this.errors = errors
  }
}

export function qualityViolationRule(
  error: unknown,
): QualitySemanticRule | 'SCHEMA' | undefined {
  if (error instanceof QualitySemanticViolation) return error.rule
  if (error instanceof QualityWireContractViolation) return 'SCHEMA'
  return undefined
}

export function decodeQualityResult(payload: unknown): ValidatedQualityResult {
  if (!validateQualityEnvelope(payload)) {
    throw new QualityWireContractViolation(validateQualityEnvelope.errors ?? [])
  }
  checkQualitySemantics(payload as unknown as import('./types').WireQualityResult)
  const sealed = structuredClone(payload) as object
  seal(sealed, 'QUALITY')
  return sealed as ValidatedQualityResult
}
