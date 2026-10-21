import controlledErrorFixture from '../../../schemas/examples/result-read-error.valid.json'
import qualityListFixture from '../../../schemas/examples/result-read-quality-list.valid.json'
import type {
  FormalResultReadGateway,
  FormalResultReadRequest,
} from '../../src/api/FormalResultReadApi'
import type { WireQualityResultListQuery } from '../../src/wire/resultReadApiTypes'

export class QualityListTestGateway implements FormalResultReadGateway {
  readonly kind = 'LOCAL_RESULT_API' as const
  readonly requests: FormalResultReadRequest[] = []

  constructor(
    private readonly options: Readonly<{
      nextCursor?: string | null
      controlledError?: boolean
      throwError?: Error
    }> = {},
  ) {}

  async read(request: FormalResultReadRequest): Promise<unknown> {
    this.requests.push(structuredClone(request))
    if (this.options.throwError) throw this.options.throwError
    if (this.options.controlledError) return structuredClone(controlledErrorFixture)
    if (request.operation !== 'QUALITY_LIST') {
      throw new TypeError('QualityListTestGateway accepts QUALITY_LIST only')
    }

    const response = structuredClone(qualityListFixture) as unknown as Record<string, unknown> & {
      query: WireQualityResultListQuery
      members: unknown[]
      next_cursor: string | null
    }
    response.query = structuredClone(request.query)
    const matches =
      (request.query.analysis_unit_kind === null ||
        request.query.analysis_unit_kind === 'STYLE_VARIANT') &&
      (request.query.edition_kind === null || request.query.edition_kind === 'STANDARD') &&
      (request.query.parent_analysis_unit_id === null ||
        request.query.parent_analysis_unit_id === 'item:42')
    if (!matches) response.members = []
    response.next_cursor =
      request.cursor === null ? (this.options.nextCursor ?? null) : null
    return response
  }
}
