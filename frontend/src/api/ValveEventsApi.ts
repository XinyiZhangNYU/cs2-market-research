import {
  decodeValveEventApiResponse,
  isValidatedValveEventResponse,
} from '../wire/valveEventApiDecode'
import type {
  ValidatedValveEventResponse,
  WireValveEventDetailResponse,
  WireValveEventListResponse,
} from '../wire/valveEventApiTypes'

export type ValveEventListRequest = {
  readonly operation: 'LIST'
  readonly cursor: string | null
}

export type ValveEventDetailRequest = {
  readonly operation: 'DETAIL'
  readonly event_id: string
}

export type ValveEventsRequest = ValveEventListRequest | ValveEventDetailRequest
export type ValveEventsReadOptions = Readonly<{ signal?: AbortSignal }>

export interface ValveEventsGateway {
  readonly kind: string
  read(request: ValveEventsRequest, options?: ValveEventsReadOptions): Promise<unknown>
}

export class UnexpectedValveEventResponse extends Error {
  constructor(expected: string, actual: string) {
    super(`Valve event read expected ${expected} but received ${actual}`)
    this.name = 'UnexpectedValveEventResponse'
  }
}
export class ValveEventRequestBindingViolation extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValveEventRequestBindingViolation'
  }
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  Object.freeze(value)
  for (const member of Object.values(value as Record<string, unknown>)) deepFreeze(member)
}

function protectedRequest<Request extends ValveEventsRequest>(request: Request): Request {
  const copy = structuredClone(request)
  deepFreeze(copy)
  return copy
}

export class ValveEventsApi {
  readonly kind = 'VALVE_EVENT_PUBLIC_READ' as const

  constructor(private readonly gateway: ValveEventsGateway) {
    if (!gateway || typeof gateway.read !== 'function') {
      throw new TypeError('ValveEventsApi requires an injected read gateway')
    }
  }

  async list(
    request: Omit<ValveEventListRequest, 'operation'>,
    options: ValveEventsReadOptions = {},
  ): Promise<ValidatedValveEventResponse & WireValveEventListResponse> {
    options.signal?.throwIfAborted()
    const payload = await this.gateway.read(protectedRequest({ operation: 'LIST', ...request }), options)
    options.signal?.throwIfAborted()
    const response = decodeValveEventApiResponse(payload)
    if (response.response_kind !== 'VALVE_EVENT_LIST') {
      throw new UnexpectedValveEventResponse('VALVE_EVENT_LIST', response.response_kind)
    }
    if (!isValidatedValveEventResponse(response, 'VALVE_EVENT_LIST')) {
      throw new TypeError('decoder returned an unregistered Valve event list')
    }
    return response as ValidatedValveEventResponse & WireValveEventListResponse
  }

  async detail(
    request: Omit<ValveEventDetailRequest, 'operation'>,
    options: ValveEventsReadOptions = {},
  ): Promise<ValidatedValveEventResponse & WireValveEventDetailResponse> {
    options.signal?.throwIfAborted()
    const payload = await this.gateway.read(protectedRequest({ operation: 'DETAIL', ...request }), options)
    options.signal?.throwIfAborted()
    const response = decodeValveEventApiResponse(payload)
    if (response.response_kind !== 'VALVE_EVENT_DETAIL') {
      throw new UnexpectedValveEventResponse('VALVE_EVENT_DETAIL', response.response_kind)
    }
    if (response.event.source.event_id !== request.event_id) {
      throw new ValveEventRequestBindingViolation(
        'Valve event detail did not answer the requested public event id',
      )
    }
    if (!isValidatedValveEventResponse(response, 'VALVE_EVENT_DETAIL')) {
      throw new TypeError('decoder returned an unregistered Valve event detail')
    }
    return response as ValidatedValveEventResponse & WireValveEventDetailResponse
  }
}
