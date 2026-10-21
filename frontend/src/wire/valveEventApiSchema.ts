import publicApiSchema from '../../../schemas/valve-event-public-api-v1.schema.json'

type JsonObject = Record<string, unknown>

function enumType(values: readonly unknown[]): string | readonly string[] {
  const types = [...new Set(values.map((value) => (value === null ? 'null' : typeof value)))]
  return types.length === 1 ? types[0] : types
}

function relaxForForwardCompatibleConsumer(value: unknown): void {
  if (Array.isArray(value)) {
    for (const member of value) relaxForForwardCompatibleConsumer(member)
    return
  }
  if (value === null || typeof value !== 'object') return
  const record = value as JsonObject
  if (record.additionalProperties === false) record.additionalProperties = true
  if (Array.isArray(record.enum)) {
    record.type = enumType(record.enum)
    delete record.enum
  }
  for (const member of Object.values(record)) relaxForForwardCompatibleConsumer(member)
}

// The root contract remains the producer authority. The consumer copy deliberately relaxes only
// future enum values and future object fields: identity constants, required fields, scalar types,
// timestamp spelling and digests remain strict. The adapter then maps unknown enums to UNKNOWN and
// selects only V1 fields, so a future harmless addition does not blank the page or enter the view.
const consumerSchema = structuredClone(publicApiSchema) as unknown
relaxForForwardCompatibleConsumer(consumerSchema)

export const VALVE_EVENT_API_CONSUMER_SCHEMA = consumerSchema
export const VALVE_EVENT_API_SCHEMA_ID =
  'https://cs2.example.invalid/schemas/valve-event-public-api-v1.schema.json'
