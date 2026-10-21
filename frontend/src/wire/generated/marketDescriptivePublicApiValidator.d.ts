import type { ErrorObject } from 'ajv'

interface GeneratedValidator {
  (data: unknown): boolean
  errors?: ErrorObject[] | null
  evaluated?: unknown
}

export declare const validateMarketDescriptivePublicApiResponse: GeneratedValidator
