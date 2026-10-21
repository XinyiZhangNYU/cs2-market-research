import equal from 'fast-deep-equal'
import { PublicResultValidationError } from '../wire/marketWatchlistPublicApiDecode'
import type {
  PublicResultPublication,
  PublicWatchlistMember,
  PublicWatchlistResponse,
} from '../wire/marketWatchlistPublicApiTypes'

function requireContinuation(condition: unknown): asserts condition {
  if (!condition) throw new PublicResultValidationError()
}

function consumeCursor(
  previous: readonly string[],
  requested: string | null,
  next: string | null,
): readonly string[] {
  const consumed = requested === null ? [] : [...previous, requested]
  requireContinuation(new Set(consumed).size === consumed.length)
  requireContinuation(next === null || !consumed.includes(next))
  return Object.freeze(consumed)
}

export type WatchlistContinuation = Readonly<{
  document: PublicWatchlistResponse
  members: readonly PublicWatchlistMember[]
  nextCursor: string | null
  consumedCursors: readonly string[]
}>

/** Preserve the publication and ordering contract across individually validated pages. */
export function appendPublicWatchlist(
  current: WatchlistContinuation | null,
  document: PublicWatchlistResponse,
  cursor: string | null,
): WatchlistContinuation {
  requireContinuation(document.query.cursor === cursor)
  if (current !== null) {
    requireContinuation(cursor !== null && cursor === current.nextCursor)
    requireContinuation(document.total === current.document.total)
    requireContinuation(document.query.query_known_at === current.document.query.query_known_at)
    requireContinuation(equal(document.publication, current.document.publication))
  } else {
    requireContinuation(cursor === null)
  }
  const members = [...(current?.members ?? []), ...document.members]
  const identities = new Set<string>()
  for (const [index, member] of members.entries()) {
    requireContinuation(member.rank === index + 1)
    requireContinuation(!identities.has(member.result.analysis_unit_id))
    identities.add(member.result.analysis_unit_id)
  }
  requireContinuation(document.next_cursor === null
    ? members.length === document.total
    : members.length < document.total)
  return {
    document,
    members: Object.freeze(members),
    nextCursor: document.next_cursor,
    consumedCursors: consumeCursor(current?.consumedCursors ?? [], cursor, document.next_cursor),
  }
}

export type HistoryContinuation<T> = Readonly<{
  members: readonly T[]
  nextCursor: string | null
  queryKnownAt: string | null
  consumedCursors: readonly string[]
}>

type HistoryPage<T> = Readonly<{
  query: Readonly<{ cursor: string | null; query_known_at: string }>
  members: readonly T[]
  next_cursor: string | null
}>

function precedes(left: PublicResultPublication, right: PublicResultPublication): boolean {
  return left.result_as_of > right.result_as_of || (
    left.result_as_of === right.result_as_of && (
      left.public_available_at > right.public_available_at || (
        left.public_available_at === right.public_available_at &&
        left.publication_id < right.publication_id
      )
    )
  )
}

export function appendPublicHistory<T extends Readonly<{ publication: PublicResultPublication }>>(
  current: HistoryContinuation<T>,
  document: HistoryPage<T>,
  cursor: string | null,
): HistoryContinuation<T> {
  requireContinuation(document.query.cursor === cursor)
  if (cursor !== null) {
    requireContinuation(cursor === current.nextCursor)
    requireContinuation(document.query.query_known_at === current.queryKnownAt)
  }
  const members = [...(cursor === null ? [] : current.members), ...document.members]
  const identities = new Set<string>()
  for (const [index, member] of members.entries()) {
    requireContinuation(!identities.has(member.publication.publication_id))
    if (index > 0) requireContinuation(precedes(members[index - 1].publication, member.publication))
    identities.add(member.publication.publication_id)
  }
  return {
    members: Object.freeze(members),
    nextCursor: document.next_cursor,
    queryKnownAt: document.query.query_known_at,
    consumedCursors: consumeCursor(current.consumedCursors, cursor, document.next_cursor),
  }
}
