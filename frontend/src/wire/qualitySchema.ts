// The quality contract is a sibling of the economic result contract, not an extension of it.
// It reuses the result identity vocabulary through an absolute $ref, so Ajv must register the
// shared result schema before compiling this document. Neither file is copied under frontend/.
import qualitySchema from '../../../schemas/research-quality-envelope.v1.schema.json'
import resultSchema from '../../../schemas/research-result-envelope.v1.schema.json'

export const QUALITY_ENVELOPE_SCHEMA = qualitySchema
export const QUALITY_ENVELOPE_SCHEMA_ID = 'urn:cs2-research:research-quality-envelope:v1'
export const QUALITY_SCHEMA_DEPENDENCIES = [resultSchema] as const

function resolveQuality(pointer: string): unknown {
  return pointer
    .split('/')
    .filter((segment) => segment.length > 0)
    .reduce<unknown>((node, segment) => {
      const key = segment.replace(/~1/g, '/').replace(/~0/g, '~')
      if (node === null || typeof node !== 'object') throw new Error(`no node at ${pointer}`)
      const next = (node as Record<string, unknown>)[key]
      if (next === undefined) throw new Error(`no node at ${pointer}`)
      return next
    }, QUALITY_ENVELOPE_SCHEMA)
}

export function qualitySchemaRequired(pointer: string): readonly string[] {
  const required = (resolveQuality(pointer) as { required?: readonly string[] }).required
  if (!required) throw new Error(`${pointer} has no required list`)
  return required
}

export function qualitySchemaEnum(pointer: string): readonly string[] {
  const values = (resolveQuality(pointer) as { enum?: readonly string[] }).enum
  if (!values) throw new Error(`${pointer} has no enum`)
  return values
}
