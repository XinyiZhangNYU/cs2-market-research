import { act, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { MockResearchApi } from '../src/api/MockResearchApi'
import { collectionHeader } from '../src/contract/collection'
import { AnalysisUnitKind } from '../src/contract/enums'
import {
  assertQueryOutcome,
  assertSingleAnalysisUnitKind,
  EditionKind,
  identityRole,
  ImpossibleQueryOutcome,
  MixedAnalysisUnitKinds,
  QuerySampleState,
  SourceCapabilityState,
  ZERO_SAMPLE_NON_CONCLUSIONS,
} from '../src/contract/identity'
import { ITEM_STATES, QUERY_OUTCOMES, UNIT_IDS, units } from '../src/mock/fixtures'

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}
const api = new MockResearchApi()
const ALL_UNITS = units('zh')

describe('the fixture actually contains the hazard these rules exist for', () => {
  it('holds a parent MHN together with a style child and a pattern child', () => {
    const kinds = new Set(ALL_UNITS.map((u) => u.analysis_unit_kind))
    expect(kinds).toEqual(new Set(Object.values(AnalysisUnitKind)))
    const children = ALL_UNITS.filter((u) => u.parent_analysis_unit_id !== null)
    expect(children.map((c) => c.analysis_unit_kind).sort()).toEqual([
      AnalysisUnitKind.PATTERN_VARIANT,
      AnalysisUnitKind.STYLE_VARIANT,
    ])
    for (const child of children) {
      expect(ALL_UNITS.some((u) => u.analysis_unit_id === child.parent_analysis_unit_id)).toBe(true)
    }
  })

  // Without this the edition model could be three-valued and nothing would notice.
  it('covers all four catalog edition values, UNKNOWN included', () => {
    expect(new Set(ALL_UNITS.map((u) => u.edition_kind))).toEqual(
      new Set(Object.values(EditionKind)),
    )
  })
})

describe('granularity is carried, never guessed', () => {
  // A UI that reads kind out of the id string would keep working here and break on real ids.
  it('cannot be recovered from the shape of analysis_unit_id', () => {
    for (const id of UNIT_IDS) expect(id).toMatch(/^ITEM-\d{4}$/)
    const byShape = new Set(UNIT_IDS.map((id) => id.replace(/\d/g, '#')))
    expect(byShape.size).toBe(1)
  })

  // models.py puts analysis_unit_kind on the feature and fusion types, not on the state snapshot.
  // If a future merge adds it there, this fails and the proposal wording has to be revisited.
  it('is absent from every item state snapshot', () => {
    for (const id of UNIT_IDS) {
      expect(ITEM_STATES[id]).not.toHaveProperty('analysis_unit_kind')
      expect(ITEM_STATES[id]).not.toHaveProperty('edition_kind')
    }
  })
})

describe('two identities are never summarised into one', () => {
  it('refuses a mixed-kind member list', () => {
    expect(() =>
      assertSingleAnalysisUnitKind([AnalysisUnitKind.BASE_MHN, AnalysisUnitKind.STYLE_VARIANT]),
    ).toThrow(MixedAnalysisUnitKinds)
    expect(() =>
      assertSingleAnalysisUnitKind([AnalysisUnitKind.BASE_MHN, AnalysisUnitKind.BASE_MHN]),
    ).not.toThrow()
    expect(() => assertSingleAnalysisUnitKind([undefined, undefined])).not.toThrow()
  })

  it('refuses to build a collection envelope over mixed kinds', () => {
    expect(() =>
      collectionHeader({
        scope_kind: 'ITEM',
        collection_id: 'MIXED',
        members: [
          { ...ITEM_STATES['ITEM-0007'], analysis_unit_kind: AnalysisUnitKind.BASE_MHN },
          { ...ITEM_STATES['ITEM-0008'], analysis_unit_kind: AnalysisUnitKind.STYLE_VARIANT },
        ],
      }),
    ).toThrow(MixedAnalysisUnitKinds)
  })

  it('gives the pool one envelope per granularity and none that spans two', async () => {
    const pool = await api.getCandidatePool('zh')
    expect(pool.groups.length).toBeGreaterThan(1)
    for (const group of pool.groups) {
      expect(group.rows.length).toBeGreaterThan(0)
      for (const row of group.rows) {
        expect(row.unit.analysis_unit_kind).toBe(group.analysis_unit_kind)
      }
      expect(group.header.member_count).toBe(group.rows.length)
    }
    const kinds = pool.groups.map((g) => g.analysis_unit_kind)
    expect(new Set(kinds).size).toBe(kinds.length)
  })
})

describe('a parent MHN is background, not a competitor to its own children', () => {
  it('is classified as background exactly while its children are present', async () => {
    const parent = ALL_UNITS.find((u) => u.analysis_unit_id === 'ITEM-0007')!
    expect(identityRole(parent, ALL_UNITS)).toBe('BACKGROUND_ONLY')
    // The same parent, listed without its children, is an ordinary subject.
    expect(identityRole(parent, [parent])).toBe('SUBJECT')
    // A base MHN that never had children is never demoted to background.
    const lone = ALL_UNITS.find((u) => u.analysis_unit_id === 'ITEM-0001')!
    expect(identityRole(lone, ALL_UNITS)).toBe('SUBJECT')
  })

  it('is kept out of the ranked rows and out of every envelope', async () => {
    const pool = await api.getCandidatePool('zh')
    const backgroundIds = pool.background.map((row) => row.unit.analysis_unit_id)
    expect(backgroundIds).toContain('ITEM-0007')
    for (const id of backgroundIds) {
      expect(pool.rows.map((r) => r.unit.analysis_unit_id)).not.toContain(id)
      for (const group of pool.groups) {
        expect(group.rows.map((r) => r.unit.analysis_unit_id)).not.toContain(id)
      }
    }
  })

  it('renders in the background list rather than as a watch row', async () => {
    render(<App initialPage="items" />)
    await flush()
    const background = screen.getByTestId('pool-background')
    expect(background).toHaveTextContent('ITEM-0007')
    expect(background).toHaveTextContent('BACKGROUND_ONLY')
    expect(screen.queryByTestId('watch-row-ITEM-0007')).toBeNull()
    expect(screen.getByTestId('not-watching')).not.toHaveTextContent('ITEM-0007')
  })

  // The child's page names its parent, and does so as context: the parent's own figures are not
  // repeated under the child's identity.
  it('names the parent on a child page without borrowing its numbers', async () => {
    const detail = await api.getItemDetail('ITEM-0008', 'zh')
    expect(detail.parent?.analysis_unit_id).toBe('ITEM-0007')
    expect(detail.state.analysis_unit_id).toBe('ITEM-0008')
    expect(detail.recommendation.analysis_unit_id).toBe('ITEM-0008')
    expect(detail.recommendation.evidence_coverage).not.toBe(
      (await api.getItemDetail('ITEM-0007', 'zh')).recommendation.evidence_coverage,
    )
    for (const domain of detail.domains) {
      expect(domain.analysis_unit_id).toBe('ITEM-0008')
    }
  })

  it('leaves the parent slot empty for a base MHN', async () => {
    const detail = await api.getItemDetail('ITEM-0001', 'zh')
    expect(detail.parent).toBeNull()
  })
})

describe('a zero result is a statement about one query, not about the world', () => {
  it('mirrors the two combinations the backend refuses to store', () => {
    expect(() =>
      assertQueryOutcome({
        sample_state: QuerySampleState.ZERO_CURRENT_SAMPLE,
        capability_state: SourceCapabilityState.CONFIRMED,
        returned_member_count: 3,
      }),
    ).toThrow(ImpossibleQueryOutcome)
    expect(() =>
      assertQueryOutcome({
        sample_state: QuerySampleState.POSITIVE_SAMPLE,
        capability_state: SourceCapabilityState.UNKNOWN,
        returned_member_count: 3,
      }),
    ).toThrow(ImpossibleQueryOutcome)
  })

  // Two units return zero rows and mean different things by it. A fixture with only one of them
  // would let "no results" and "unsupported" be rendered with the same words and still pass.
  it('separates a zero sample from what the source can answer at all', () => {
    expect(QUERY_OUTCOMES['ITEM-0008'].sample_state).toBe(QuerySampleState.ZERO_CURRENT_SAMPLE)
    expect(QUERY_OUTCOMES['ITEM-0008'].capability_state).toBe(SourceCapabilityState.CONFIRMED)
    expect(QUERY_OUTCOMES['ITEM-0009'].sample_state).toBe(QuerySampleState.ZERO_CURRENT_SAMPLE)
    expect(QUERY_OUTCOMES['ITEM-0009'].capability_state).toBe(SourceCapabilityState.UNKNOWN)
  })

  it('shows the controlled state and spells out what it does not establish', async () => {
    render(<App initialPage="item" initialItemId="ITEM-0008" />)
    await flush()
    const outcome = screen.getByTestId('query-outcome')
    expect(outcome).toHaveTextContent('ZERO_CURRENT_SAMPLE')
    expect(outcome).toHaveTextContent('returned_member_count=0')
    const limits = within(outcome).getByTestId('zero-sample-limits')
    for (const code of ZERO_SAMPLE_NON_CONCLUSIONS) expect(limits).toHaveTextContent(code)
  })

  it('reports the unknown capability rather than implying the source failed', async () => {
    render(<App initialPage="item" initialItemId="ITEM-0009" />)
    await flush()
    const outcome = screen.getByTestId('query-outcome')
    expect(outcome).toHaveTextContent('ZERO_CURRENT_SAMPLE')
    expect(outcome).toHaveTextContent('UNKNOWN')
  })

  it('shows no zero-sample panel when the query did return samples', async () => {
    render(<App initialPage="item" initialItemId="ITEM-0001" />)
    await flush()
    expect(screen.getByTestId('query-outcome')).toHaveTextContent('POSITIVE_SAMPLE')
    expect(screen.queryByTestId('zero-sample-limits')).toBeNull()
  })
})
