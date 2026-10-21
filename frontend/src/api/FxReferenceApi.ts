import {
  decodeFxReferenceApiResponse,
  isValidatedFxReferenceApiResponse,
} from '../wire/fxReferenceApiDecode'
import type { ValidatedFxReferenceApiResponse } from '../wire/fxReferenceApiTypes'

export type FxReferenceRequest = Readonly<{ known_at: string }>

export interface FxReferenceGateway {
  readonly kind: string
  read(request: FxReferenceRequest): Promise<unknown>
}

export class FxReferenceRequestBindingViolation extends Error {
  constructor() {
    super('FX reference response does not answer the requested known_at')
    this.name = 'FxReferenceRequestBindingViolation'
  }
}

export class FxReferenceApi {
  constructor(private readonly gateway: FxReferenceGateway) {
    if (!gateway || typeof gateway.read !== 'function') {
      throw new TypeError('FxReferenceApi requires an injected gateway')
    }
  }

  async current(request: FxReferenceRequest): Promise<ValidatedFxReferenceApiResponse> {
    const protectedRequest = Object.freeze(structuredClone(request))
    const response = decodeFxReferenceApiResponse(
      await this.gateway.read(protectedRequest),
    )
    if (
      response.response_kind === 'FX_REFERENCE_CURRENT' &&
      response.query.known_at !== request.known_at
    ) throw new FxReferenceRequestBindingViolation()
    if (!isValidatedFxReferenceApiResponse(response, response.response_kind)) {
      throw new TypeError('decoder returned an unregistered FX reference response')
    }
    return response
  }
}
