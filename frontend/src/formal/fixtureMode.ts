// Offline composition boundary for the shared Python-generated result-read fixtures.
//
// This is deliberately not a mock ResearchApi and not an HTTP transport. It replays the exact
// repository-root fixtures through FormalResultReadApi, so the API schema, nested envelope schema,
// semantic checks and request binding remain the only path into the formal display components.
import collectionDetailFixture from '../../../schemas/examples/result-read-collection-detail.valid.json'
import errorFixture from '../../../schemas/examples/result-read-error.valid.json'
import qualityDetailFixture from '../../../schemas/examples/result-read-quality-detail.valid.json'
import qualityListFixture from '../../../schemas/examples/result-read-quality-list.valid.json'
import unitDetailFixture from '../../../schemas/examples/result-read-unit-detail.valid.json'
import unitListFixture from '../../../schemas/examples/result-read-unit-list.valid.json'
import {
  FormalResultReadApi,
  type FormalResultReadGateway,
  type FormalResultReadRequest,
  type ValidatedOperationResponse,
} from '../api/FormalResultReadApi'

export type FormalFixtureScenarioId =
  | 'MARKET_COLLECTION'
  | 'ITEM_LIST'
  | 'ITEM_DETAIL'
  | 'QUALITY_DETAIL'
  | 'CONTROLLED_ERROR'

export type FormalFixtureScenario = Readonly<{
  id: FormalFixtureScenarioId
  operation: FormalResultReadRequest['operation']
  queryAsOf: string
}>

const FORMAL_FIXTURE_SCENARIO_VALUES = [
  {
    id: 'MARKET_COLLECTION',
    operation: 'COLLECTION_DETAIL',
    queryAsOf: '2026-08-21T00:00:02.000000Z',
  },
  {
    id: 'ITEM_LIST',
    operation: 'UNIT_LIST',
    queryAsOf: '2026-08-21T00:00:02.000000Z',
  },
  {
    id: 'ITEM_DETAIL',
    operation: 'UNIT_DETAIL',
    queryAsOf: '2026-08-21T00:00:02.000000Z',
  },
  {
    id: 'QUALITY_DETAIL',
    operation: 'QUALITY_DETAIL',
    queryAsOf: '2026-08-22T04:00:02.000000Z',
  },
  {
    id: 'CONTROLLED_ERROR',
    operation: 'UNIT_DETAIL',
    queryAsOf: '2026-08-21T00:00:02.000000Z',
  },
] as const satisfies readonly FormalFixtureScenario[]

export const FORMAL_FIXTURE_SCENARIOS: readonly FormalFixtureScenario[] = Object.freeze(
  FORMAL_FIXTURE_SCENARIO_VALUES.map((scenario) => Object.freeze({ ...scenario })),
)

const FIXTURES = Object.freeze({
  UNIT_DETAIL: unitDetailFixture,
  UNIT_LIST: unitListFixture,
  COLLECTION_DETAIL: collectionDetailFixture,
  QUALITY_DETAIL: qualityDetailFixture,
  QUALITY_LIST: qualityListFixture,
  ERROR: errorFixture,
})

export class SharedFormalFixtureGateway implements FormalResultReadGateway {
  readonly kind = 'FORMAL_FIXTURE' as const

  async read(request: FormalResultReadRequest): Promise<unknown> {
    if (request.operation === 'UNIT_DETAIL' && request.analysis_unit_id === 'missing') {
      return structuredClone(FIXTURES.ERROR)
    }
    return structuredClone(FIXTURES[request.operation])
  }
}

export function formalFixtureScenario(id: FormalFixtureScenarioId): FormalFixtureScenario {
  const scenario = FORMAL_FIXTURE_SCENARIOS.find((candidate) => candidate.id === id)
  if (!scenario) throw new TypeError(`unknown formal fixture scenario: ${id}`)
  return scenario
}

export function runFormalFixtureScenario(
  api: FormalResultReadApi,
  id: FormalFixtureScenarioId,
): Promise<ValidatedOperationResponse<'UNIT_DETAIL' | 'UNIT_LIST' | 'COLLECTION_DETAIL' | 'QUALITY_DETAIL'>> {
  if (id === 'MARKET_COLLECTION') {
    return api.getCollection({
      collection_id: 'overview:market',
      as_of: '2026-08-21T00:00:02.000000Z',
    })
  }
  if (id === 'ITEM_LIST') {
    return api.listUnits({
      query: {
        as_of: '2026-08-21T00:00:02.000000Z',
        scope_kind: 'ITEM',
        analysis_unit_kind: 'STYLE_VARIANT',
        edition_kind: 'STANDARD',
        parent_analysis_unit_id: 'item:42',
        data_status: 'UNAVAILABLE_BY_DESIGN',
        sort: 'ANALYSIS_UNIT_ID_ASC',
        page_size: 100,
      },
      cursor: null,
    })
  }
  if (id === 'QUALITY_DETAIL') {
    return api.getQuality({
      analysis_unit_id: 'item:43',
      as_of: '2026-08-22T04:00:02.000000Z',
    })
  }
  return api.getUnit({
    analysis_unit_id: id === 'CONTROLLED_ERROR' ? 'missing' : 'item:42:phase-p2',
    as_of: '2026-08-21T00:00:02.000000Z',
  })
}
