import detailFixture from '../../../schemas/examples/valve-event-public-detail.valid.json'
import listFixture from '../../../schemas/examples/valve-event-public-list.valid.json'
import type {
  ValveEventsGateway,
  ValveEventsRequest,
} from '../api/ValveEventsApi'

export const SYNTHETIC_VALVE_EVENT_ID = 'event-synthetic-reload-001'

export class SharedValveEventsFixtureGateway implements ValveEventsGateway {
  readonly kind = 'FORMAL_FIXTURE' as const

  async read(request: ValveEventsRequest): Promise<unknown> {
    return structuredClone(request.operation === 'LIST' ? listFixture : detailFixture)
  }
}
