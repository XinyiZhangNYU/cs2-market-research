import { describe, expect, it } from 'vitest'
import watchlistFixture from '../../schemas/examples/market-watchlist-public-watchlist.valid.json'
import { appendPublicWatchlist } from '../src/pages/publicResultContinuation'
import { decodePublicResultDocument, PublicResultValidationError } from '../src/wire/marketWatchlistPublicApiDecode'
import type { PublicWatchlistResponse } from '../src/wire/marketWatchlistPublicApiTypes'

const PUBLICATION_A = '1'.repeat(64)

function watchPage(publicationId: string, cursor: string | null): PublicWatchlistResponse {
  const source = structuredClone(watchlistFixture)
  const rank = cursor === null ? 1 : 2
  const member = source.members[0]
  const unit = `item:${publicationId[0]}-${rank}`
  member.rank = rank
  member.tie_break_key = unit
  member.result.analysis_unit_id = unit
  member.catalog.analysis_unit_id = unit
  member.catalog.localized_name.en = `Item ${publicationId[0]} page ${rank}`
  return {
    ...source,
    publication: { ...source.publication, publication_id: publicationId },
    query: { ...source.query, publication_id: publicationId, cursor },
    members: [member],
    total: 2,
    next_cursor: cursor === null ? 'page_two' : null,
  } as PublicWatchlistResponse
}

function decoded(page: PublicWatchlistResponse): PublicWatchlistResponse {
  const { query_known_at: _knownAt, ...query } = page.query
  return decodePublicResultDocument(page, { kind: 'WATCHLIST', query }, 200) as PublicWatchlistResponse
}

describe('legacy formal-result continuation binding', () => {
  it('merges complete, consecutively ranked pages from one publication', () => {
    const first = appendPublicWatchlist(null, decoded(watchPage(PUBLICATION_A, null)), null)
    const complete = appendPublicWatchlist(first, decoded(watchPage(PUBLICATION_A, 'page_two')), 'page_two')
    expect(complete.members.map((member) => member.rank)).toEqual([1, 2])
    expect(complete.nextCursor).toBeNull()
  })

  it.each(['publication', 'knownAt', 'duplicateMember', 'rankGap', 'total', 'cursorCycle'] as const)(
    'rejects individually valid pages with cross-page %s drift', (problem) => {
      const first = appendPublicWatchlist(null, decoded(watchPage(PUBLICATION_A, null)), null)
      const page = structuredClone(watchPage(PUBLICATION_A, 'page_two'))
      if (problem === 'publication') Object.assign(page.publication, { manifest_hash: '9'.repeat(64) })
      if (problem === 'knownAt') Object.assign(page.query, { query_known_at: '2026-09-03T12:06:00.000000Z' })
      if (problem === 'duplicateMember') {
        const id = first.members[0].result.analysis_unit_id
        Object.assign(page.members[0], { tie_break_key: id })
        Object.assign(page.members[0].result, { analysis_unit_id: id })
        Object.assign(page.members[0].catalog, { analysis_unit_id: id })
      }
      if (problem === 'rankGap') {
        Object.assign(page.members[0], { rank: 3 })
        Object.assign(page, { total: 3 })
      }
      if (problem === 'total') Object.assign(page, { total: 3 })
      if (problem === 'cursorCycle') Object.assign(page, { next_cursor: 'page_two' })
      expect(() => appendPublicWatchlist(first, decoded(page), 'page_two')).toThrow(PublicResultValidationError)
    },
  )

  it('rejects incomplete terminal pages instead of silently truncating a ranking', () => {
    const page = { ...watchPage(PUBLICATION_A, null), next_cursor: null }
    expect(() => appendPublicWatchlist(null, decoded(page), null)).toThrow(PublicResultValidationError)
  })
})
