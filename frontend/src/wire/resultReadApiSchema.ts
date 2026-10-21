import apiSchema from '../../../schemas/result-read-api.v1.schema.json'
import qualitySchema from '../../../schemas/research-quality-envelope.v1.schema.json'
import resultSchema from '../../../schemas/research-result-envelope.v1.schema.json'

export const RESULT_READ_API_SCHEMA = apiSchema
export const RESULT_READ_API_SCHEMA_ID = 'urn:cs2-research:result-read-api:v1'
export const RESULT_READ_API_SCHEMA_DEPENDENCIES = [resultSchema, qualitySchema] as const
