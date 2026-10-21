import { qualityResultView, type PresentableQualityView } from './qualityViewModel'
import { FormalResultReadApi, type FormalResultReadGateway } from '../api/FormalResultReadApi'
import type { AnalysisUnitKind } from '../contract/enums'
import type { EditionKind } from '../contract/identity'
import type { IsoUtcTimestamp } from '../contract/types'
import type {
  ResultReadErrorCode,
  WireQualityResultListQuery,
} from '../wire/resultReadApiTypes'

export type QualityListQuery = Readonly<{
  as_of: IsoUtcTimestamp
  analysis_unit_kind: AnalysisUnitKind | null
  edition_kind: EditionKind | null
  parent_analysis_unit_id: string | null
  sort: 'ANALYSIS_UNIT_ID_ASC'
  page_size: number
}>

export type QualityListMemberView = Readonly<{
  quality: PresentableQualityView
  published_at: IsoUtcTimestamp
}>

export type QualityPageAccounting = Readonly<{
  returned_rows: number
  expected_cells: number
  observed_cells: number
  fresh_cells: number
  missing_cells: number
  stale_cells: number
  future_facts: number
  conflict_rows: number
}>

export type QualityListPageView = Readonly<{
  channel: string
  query: QualityListQuery
  members: readonly QualityListMemberView[]
  next_cursor: string | null
  accounting: QualityPageAccounting
}>

export type QualityListControlledError = Readonly<{
  code: ResultReadErrorCode
  http_status: 400 | 404 | 503
  retryable: boolean
}>

export type QualityListLoadResult =
  | Readonly<{ kind: 'READY'; page: QualityListPageView }>
  | Readonly<{ kind: 'CONTROLLED_ERROR'; error: QualityListControlledError }>

function safeAdd(left: number, right: number, field: string): number {
  const sum = left + right
  if (!Number.isSafeInteger(sum)) {
    throw new TypeError(`quality page ${field} exceeds safe integer accounting`)
  }
  return sum
}

function pageAccounting(members: readonly QualityListMemberView[]): QualityPageAccounting {
  const totals = {
    returned_rows: members.length,
    expected_cells: 0,
    observed_cells: 0,
    fresh_cells: 0,
    missing_cells: 0,
    stale_cells: 0,
    future_facts: 0,
    conflict_rows: 0,
  }
  for (const member of members) {
    const aggregate = member.quality.aggregate
    totals.expected_cells = safeAdd(
      totals.expected_cells,
      aggregate.expected_cell_count,
      'expected_cells',
    )
    totals.observed_cells = safeAdd(
      totals.observed_cells,
      aggregate.observed_cell_count,
      'observed_cells',
    )
    totals.fresh_cells = safeAdd(
      totals.fresh_cells,
      aggregate.fresh_cell_count,
      'fresh_cells',
    )
    totals.missing_cells = safeAdd(
      totals.missing_cells,
      aggregate.missing_cell_count,
      'missing_cells',
    )
    totals.stale_cells = safeAdd(
      totals.stale_cells,
      aggregate.stale_cell_count,
      'stale_cells',
    )
    totals.future_facts = safeAdd(
      totals.future_facts,
      aggregate.future_fact_count,
      'future_facts',
    )
    totals.conflict_rows = safeAdd(
      totals.conflict_rows,
      member.quality.conflicts.length,
      'conflict_rows',
    )
  }
  return Object.freeze(totals)
}

export function utcQueryInstant(date: Date): IsoUtcTimestamp {
  if (!Number.isFinite(date.getTime())) throw new TypeError('query instant must be a valid Date')
  return date.toISOString().replace(/(\.\d{3})Z$/, '$1000Z')
}

export async function loadQualityListPage(
  gateway: FormalResultReadGateway,
  query: WireQualityResultListQuery,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<QualityListLoadResult> {
  const response = await new FormalResultReadApi(gateway).listQuality(
    { query, cursor },
    { signal },
  )
  if (response.response_kind === 'ERROR') {
    return Object.freeze({
      kind: 'CONTROLLED_ERROR' as const,
      error: Object.freeze({ ...response.error }),
    })
  }

  const members = Object.freeze(
    response.members.map((resource) =>
      Object.freeze({
        quality: qualityResultView(resource.envelope),
        published_at: resource.storage.published_at,
      }),
    ),
  )
  return Object.freeze({
    kind: 'READY' as const,
    page: Object.freeze({
      channel: gateway.kind,
      query: Object.freeze({ ...response.query }),
      members,
      next_cursor: response.next_cursor,
      accounting: pageAccounting(members),
    }),
  })
}
