import { act, render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App, VIEWS, type ViewId } from '../src/App'
import { CaseStatus, DataStatus, OutcomeLabel } from '../src/contract/enums'
import {
  OPEN_CASE_STATUSES,
  TERMINAL_CASE_STATUSES,
  hasOpenCase,
} from '../src/contract/caseLifecycle'
import { AnalysisUnitKind } from '../src/contract/enums'
import { identityRole } from '../src/contract/identity'
import {
  ITEM_STATES,
  LIFECYCLE_EVENTS,
  OUTCOMES,
  SOURCE_COVERAGE,
  UNIT_IDS,
  units,
} from '../src/mock/fixtures'
import { QualityListTestGateway } from './support/qualityListTestGateway'

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

// A parent MHN whose own children are in the pool is background, not a row. Deriving the split
// here rather than listing ids keeps these assertions honest when the fixture gains a unit.
const ALL_UNITS = units('zh')
const SUBJECT_IDS = ALL_UNITS.filter((u) => identityRole(u, ALL_UNITS) === 'SUBJECT').map(
  (u) => u.analysis_unit_id,
)
const BACKGROUND_IDS = ALL_UNITS.filter(
  (u) => identityRole(u, ALL_UNITS) === 'BACKGROUND_ONLY',
).map((u) => u.analysis_unit_id)
// The pool carries one envelope per granularity, so an envelope assertion has to name which.
const BASE_POOL = 'CANDIDATE-POOL/BASE_MHN'
const BASE_IDS = ALL_UNITS.filter(
  (u) =>
    u.analysis_unit_kind === AnalysisUnitKind.BASE_MHN && SUBJECT_IDS.includes(u.analysis_unit_id),
).map((u) => u.analysis_unit_id)

describe('the landing view is two doors', () => {
  it('offers exactly two', async () => {
    render(<App qualityGateway={new QualityListTestGateway()} />)
    await flush()
    expect(screen.getByTestId('hub-doors').querySelectorAll('button')).toHaveLength(2)
  })

  it('shows no nav bar, so the doors are the only way in', async () => {
    render(<App />)
    await flush()
    expect(screen.queryByTestId('nav-hub')).toBeNull()
  })

  it('each door opens its view and the way back stays available', async () => {
    const user = userEvent.setup()
    render(<App qualityGateway={new QualityListTestGateway()} />)
    await flush()

    await user.click(screen.getByTestId('door-items'))
    await flush()
    expect(screen.getByTestId('page-items')).toBeInTheDocument()

    await user.click(screen.getByTestId('nav-hub'))
    await flush()
    await user.click(screen.getByTestId('door-market'))
    await flush()
    expect(screen.getByTestId('page-market')).toBeInTheDocument()
  })

  it('the market door splits into a market page and a sector page', async () => {
    const user = userEvent.setup()
    render(
      <App
        initialPage="market"
        qualityGateway={new QualityListTestGateway()}
      />,
    )
    await flush()
    expect(screen.getByTestId('market-section-body-market')).toBeInTheDocument()
    expect(screen.queryByTestId('market-section-body-sectors')).toBeNull()

    await user.click(screen.getByTestId('market-section-sectors'))
    expect(screen.getByTestId('market-section-body-sectors')).toBeInTheDocument()
    expect(screen.queryByTestId('market-section-body-market')).toBeNull()
  })
})

describe('the watch list is exactly the units with an open case', () => {
  const open = SUBJECT_IDS.filter((id) => hasOpenCase(ITEM_STATES[id].case_status))
  const closed = SUBJECT_IDS.filter((id) => !hasOpenCase(ITEM_STATES[id].case_status))

  // The predicate is not the frontend's to invent. engine.py assigns SUSPENDED only when an
  // active case id exists, and ledger.py refuses further events once a case is RESOLVED,
  // UNRESOLVED or RETRACTED. Partitioning here means adding a CaseStatus value fails this test
  // rather than silently falling into whichever branch the filter happens to take.
  it('every CaseStatus value is classified as open or terminal, never both or neither', () => {
    const all = [...Object.values(CaseStatus)].sort()
    expect([...OPEN_CASE_STATUSES, ...TERMINAL_CASE_STATUSES].sort()).toEqual(all)
    for (const status of OPEN_CASE_STATUSES) {
      expect(TERMINAL_CASE_STATUSES).not.toContain(status)
    }
  })

  it('UNRESOLVED is terminal, not a pending state', () => {
    expect(hasOpenCase(CaseStatus.UNRESOLVED)).toBe(false)
    expect(TERMINAL_CASE_STATUSES).toContain(CaseStatus.UNRESOLVED)
  })

  // Without a SUSPENDED row, filtering on ACTIVE alone and filtering on "has an open case" agree
  // on every unit, so the fixture would let the narrower predicate pass unnoticed.
  it('the fixture holds a SUSPENDED unit, so an ACTIVE-only filter would be observably wrong', () => {
    const suspended = UNIT_IDS.filter((id) => ITEM_STATES[id].case_status === CaseStatus.SUSPENDED)
    expect(suspended.length).toBeGreaterThan(0)
    expect(closed.length).toBeGreaterThan(0)
    for (const id of suspended) expect(open).toContain(id)
  })

  it('lists every open-case unit and no other', async () => {
    render(<App initialPage="items" />)
    await flush()
    const panel = screen.getByTestId('panel-watching')
    for (const id of open) {
      expect(within(panel).getByTestId(`watch-row-${id}`)).toBeInTheDocument()
    }
    for (const id of closed) {
      expect(within(panel).queryByTestId(`watch-row-${id}`)).toBeNull()
    }
  })

  it('names the excluded units rather than dropping them silently', async () => {
    render(<App initialPage="items" />)
    await flush()
    const excluded = screen.getByTestId('not-watching')
    for (const id of closed) expect(excluded).toHaveTextContent(id)
  })

  // Moving parents out of the ranked rows is only honest if they still appear somewhere. A unit
  // that is neither a subject nor background would have been dropped from the page entirely.
  it('accounts for every unit as either a subject or background', async () => {
    expect([...SUBJECT_IDS, ...BACKGROUND_IDS].sort()).toEqual([...UNIT_IDS].sort())
    expect(BACKGROUND_IDS.length).toBeGreaterThan(0)
    render(<App initialPage="items" />)
    await flush()
    const background = screen.getByTestId('pool-background')
    for (const id of BACKGROUND_IDS) expect(background).toHaveTextContent(id)
  })

  // An empty watch list is a legal market state, so the route into an item must not depend on the
  // list being non-empty. Every unit in the pool carries its own control.
  it('opens the detail view for a unit that is not under observation', async () => {
    const user = userEvent.setup()
    render(<App initialPage="items" />)
    await flush()
    const target = closed[0]
    await user.click(within(screen.getByTestId('not-watching')).getByText(target))
    await flush()
    expect(screen.getByTestId('page-item')).toHaveTextContent(target)
  })
})

describe('a page answering for many units does not borrow one unit provenance', () => {
  it('gives the pool and the case history separate envelopes', async () => {
    render(<App initialPage="items" />)
    await flush()
    const collections = screen
      .getAllByTestId('collection-header')
      .map((el) => el.getAttribute('data-collection'))
    expect(collections).toContain(BASE_POOL)
    expect(collections).toContain('CASE-HISTORY')
  })

  it('reports the member span instead of one aggregate timestamp', async () => {
    render(<App initialPage="items" />)
    await flush()
    const pool = screen
      .getAllByTestId('collection-header')
      .find((el) => el.getAttribute('data-collection') === BASE_POOL)!
    const times = [...new Set(BASE_IDS.map((id) => ITEM_STATES[id].available_at))].sort()
    expect(pool).toHaveTextContent(times[0])
    expect(pool).toHaveTextContent(times[times.length - 1])
  })

  // The pool holds units at several data statuses. A single COMPLETE on the envelope would read
  // as "this whole list is complete", which no snapshot anywhere says.
  it('lists the distinct member data statuses and produces no aggregate one', async () => {
    render(<App initialPage="items" />)
    await flush()
    const pool = screen
      .getAllByTestId('collection-header')
      .find((el) => el.getAttribute('data-collection') === BASE_POOL)!
    for (const status of new Set(BASE_IDS.map((id) => ITEM_STATES[id].data_status))) {
      expect(pool).toHaveTextContent(status)
    }
    expect(pool).toHaveTextContent('collection_envelope.data_status')
  })

  // Every member carries the same data_branch and the same versions, so this is the case where
  // collapsing was most tempting and where v3 did collapse. The envelope still declines: what the
  // members agree on is reported as the members' agreement, not as the collection's own value.
  it('refuses a collection data_branch and versions although every member agrees', async () => {
    render(<App initialPage="items" />)
    await flush()
    const pool = screen
      .getAllByTestId('collection-header')
      .find((el) => el.getAttribute('data-collection') === BASE_POOL)!
    expect(new Set(BASE_IDS.map((id) => ITEM_STATES[id].data_branch)).size).toBe(1)
    expect(pool).toHaveTextContent('collection_envelope.data_branch')
    expect(pool).toHaveTextContent('collection_envelope.versions')
    expect(within(pool).getByTestId('member-data-branch')).toBeInTheDocument()
    expect(within(pool).getByTestId('member-versions')).toBeInTheDocument()
  })

  it('visually separates the member summary from collection-level fields', async () => {
    render(<App initialPage="items" />)
    await flush()
    const pool = screen
      .getAllByTestId('collection-header')
      .find((el) => el.getAttribute('data-collection') === BASE_POOL)!
    const summary = within(pool).getByTestId('member-summary')
    const contract = within(pool).getByTestId('collection-provenance')
    expect(summary).toHaveAttribute('data-provenance', 'DERIVED_FROM_MEMBERS')
    expect(summary).toHaveTextContent('DERIVED_FROM_MEMBERS')
    expect(summary).toHaveTextContent(`全部 ${BASE_IDS.length} 个已报告成员一致为`)
    expect(within(summary).getByTestId('member-data-branch')).toHaveTextContent('B')
    expect(within(summary).getByTestId('member-versions')).toHaveTextContent(
      ITEM_STATES[BASE_IDS[0]].versions.algorithm_version,
    )
    expect(contract).toHaveTextContent('collection_envelope.data_branch')
    expect(contract).toHaveTextContent('collection_envelope.versions')
    expect(contract).toHaveTextContent('NOT_PRODUCED')
    expect(contract).not.toHaveTextContent(`全部 ${BASE_IDS.length} 个已报告成员一致为`)
    expect(within(contract).queryByTestId('member-unanimous')).toBeNull()
  })

  it('keeps frequencies on mixed member data_status instead of a distinct list', async () => {
    render(<App initialPage="items" />)
    await flush()
    const pool = screen
      .getAllByTestId('collection-header')
      .find((el) => el.getAttribute('data-collection') === BASE_POOL)!
    const status = within(pool).getByTestId('member-data-status')
    const completeCount = BASE_IDS.filter(
      (id) => ITEM_STATES[id].data_status === DataStatus.COMPLETE,
    ).length
    expect(completeCount).toBeGreaterThan(1)
    expect(status).toHaveTextContent('COMPLETE')
    expect(status).toHaveTextContent(`× ${completeCount}`)
    expect(within(status).queryByTestId('member-unanimous')).toBeNull()
  })

  // OutcomeEvaluation has evaluated_at — when the outcome was judged — and no available_at. An
  // earlier version passed evaluated_at in as the member span, which renames a field instead of
  // reporting a missing one. An empty span is the honest answer.
  it('reports no member span for the case history rather than renaming evaluated_at', async () => {
    render(<App initialPage="items" />)
    await flush()
    const history = screen
      .getAllByTestId('collection-header')
      .find((el) => el.getAttribute('data-collection') === 'CASE-HISTORY')!
    for (const outcome of OUTCOMES) expect(history).not.toHaveTextContent(outcome.evaluated_at)
  })
})

// A closed case is exactly the case whose unit left the watch list, so the history names units the
// list above no longer holds. Without a control on the id these rows are a dead end.
describe('the case history routes to the unit it names', () => {
  const closedUnit = 'ITEM-0003'

  it('the target is absent from the watch list, so the history is its only route', () => {
    expect(hasOpenCase(ITEM_STATES[closedUnit].case_status)).toBe(false)
    expect(OUTCOMES.some((o) => o.analysis_unit_id === closedUnit)).toBe(true)
    expect(LIFECYCLE_EVENTS.some((e) => e.analysis_unit_id === closedUnit)).toBe(true)
  })

  for (const table of ['outcome-table', 'lifecycle-table']) {
    it(`opens the detail view from the ${table}`, async () => {
      const user = userEvent.setup()
      render(<App initialPage="items" />)
      await flush()
      const cell = within(screen.getByTestId(table)).getAllByText(closedUnit)[0]
      await user.click(cell)
      await flush()
      expect(screen.getByTestId('page-item')).toHaveTextContent(closedUnit)
    })
  }
})

// models.py raises on a snapshot that sets both case ids: an active cycle case replaces an active
// candidate episode. Two labelled slots side by side read as two concurrent cases, one of which
// happens to be empty — a shape the backend cannot produce.
describe('an item shows the one case slot it can have', () => {
  for (const id of UNIT_IDS.filter((u) => hasOpenCase(ITEM_STATES[u].case_status))) {
    it(`${id} names exactly the id kind that is set`, async () => {
      const user = userEvent.setup()
      render(<App initialPage="items" />)
      await flush()
      await user.click(screen.getByTestId(`watch-toggle-${id}`))
      const detail = screen.getByTestId(`watch-detail-${id}`)
      const state = ITEM_STATES[id]
      const set = state.candidate_episode_id ? 'candidate_episode_id' : 'cycle_case_id'
      const unset = set === 'candidate_episode_id' ? 'cycle_case_id' : 'candidate_episode_id'
      expect(detail).toHaveTextContent(set)
      expect(detail).not.toHaveTextContent(unset)
      expect(detail).toHaveTextContent(state.candidate_episode_id ?? state.cycle_case_id!)
    })
  }
})

describe('collapsed watch rows show the current snapshot axes', () => {
  const state = ITEM_STATES['ITEM-0001']

  const collapsedMachines = () =>
    [
      ...screen
        .getByTestId('watch-axis-recommendation-ITEM-0001')
        .querySelectorAll('[data-machine]'),
      ...screen.getByTestId('watch-tags-ITEM-0001').querySelectorAll('[data-machine]'),
    ].map((el) => el.getAttribute('data-machine'))

  it('shows recommendation and cycle_stage with axis labels and no hover or click', async () => {
    render(<App initialPage="items" />)
    await flush()
    const machines = collapsedMachines()
    expect(machines).toContain(state.recommendation)
    expect(machines).toContain(state.cycle_stage)
    expect(screen.getByTestId('watch-axis-recommendation-ITEM-0001')).toHaveTextContent('推荐')
    expect(screen.getByTestId('watch-axis-cycle-ITEM-0001')).toHaveTextContent('阶段')
  })

  it('keeps evidence_flags and regime_relation off the collapsed row', async () => {
    render(<App initialPage="items" />)
    await flush()
    const machines = collapsedMachines()
    expect(state.evidence_flags.length).toBeGreaterThan(0)
    expect(state.regime_relation.length).toBeGreaterThan(0)
    for (const flag of state.evidence_flags) expect(machines).not.toContain(flag)
    for (const relation of state.regime_relation) expect(machines).not.toContain(relation)
  })

  it('marks SUSPENDED on the collapsed row and omits it for an active case', async () => {
    render(<App initialPage="items" />)
    await flush()
    expect(ITEM_STATES['ITEM-0006'].case_status).toBe(CaseStatus.SUSPENDED)
    expect(screen.getByTestId('watch-axis-suspended-ITEM-0006')).toHaveTextContent('SUSPENDED')
    expect(screen.queryByTestId('watch-axis-suspended-ITEM-0001')).toBeNull()
  })
})

describe('expanding a watch row shows the rest of the current snapshot in three groups', () => {
  const state = ITEM_STATES['ITEM-0001']

  it('puts flags and regime relation in the grounds group', async () => {
    const user = userEvent.setup()
    render(<App initialPage="items" />)
    await flush()
    await user.click(screen.getByTestId('watch-toggle-ITEM-0001'))
    const grounds = screen.getByTestId('watch-snapshot-evidence-ITEM-0001')
    for (const flag of state.evidence_flags) expect(grounds).toHaveTextContent(flag)
    for (const relation of state.regime_relation) expect(grounds).toHaveTextContent(relation)
    expect(screen.getByTestId('watch-snapshot-data-ITEM-0001')).toHaveTextContent('data_status')
    expect(screen.getByTestId('watch-snapshot-identity-ITEM-0001')).toHaveTextContent(
      'cycle_case_id',
    )
  })

  it('pointer hover does not expand the row or change its disclosure state', async () => {
    const user = userEvent.setup()
    render(<App initialPage="items" />)
    await flush()
    const row = screen.getByTestId('watch-row-ITEM-0001')
    const toggle = screen.getByTestId('watch-toggle-ITEM-0001')
    const detail = screen.getByTestId('watch-detail-ITEM-0001')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(detail).toHaveAttribute('hidden')

    await user.hover(row)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(detail).toHaveAttribute('hidden')

    await user.unhover(row)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(detail).toHaveAttribute('hidden')
  })

  it('click toggles the detail and links the disclosure control to its panel', async () => {
    const user = userEvent.setup()
    render(<App initialPage="items" />)
    await flush()
    const toggle = screen.getByTestId('watch-toggle-ITEM-0001')
    const detail = screen.getByTestId('watch-detail-ITEM-0001')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', detail.id)

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(detail).not.toHaveAttribute('hidden')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(detail).toHaveAttribute('hidden')
  })

  it('keeps the disclosure operable from the keyboard', async () => {
    const user = userEvent.setup()
    render(<App initialPage="items" />)
    await flush()
    const toggle = screen.getByTestId('watch-toggle-ITEM-0001')
    const detail = screen.getByTestId('watch-detail-ITEM-0001')

    toggle.focus()
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(detail).not.toHaveAttribute('hidden')

    await user.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(detail).toHaveAttribute('hidden')
  })
})

describe('outcome evaluation stays four-way', () => {
  it('the fixture exercises all four labels, so a right/wrong rendering cannot pass', () => {
    const seen = [...new Set(OUTCOMES.map((o) => o.label))].sort()
    expect(seen).toEqual([...Object.values(OutcomeLabel)].sort())
  })

  it('shows one cell per OutcomeLabel value and nothing merged', async () => {
    render(<App initialPage="items" />)
    await flush()
    const spread = screen.getByTestId('outcome-spread')
    expect(spread.querySelectorAll('[data-outcome]')).toHaveLength(
      Object.values(OutcomeLabel).length,
    )
    for (const value of Object.values(OutcomeLabel)) {
      expect(spread.querySelector(`[data-outcome="${value}"]`)).not.toBeNull()
    }
  })
})

// The market page now owns the real QUALITY_LIST surface. Other proposal pages retain the
// synthetic research-basis strip until their real replacements exist.
describe('quality provenance follows the data source of each view', () => {
  for (const view of VIEWS.filter((candidate) => candidate.id !== 'market')) {
    it(`${view.id} carries the strip and the contract requests`, async () => {
      render(<App initialPage={view.id as ViewId} />)
      await flush()
      const strip = screen.getByTestId('quality-strip')
      expect(within(strip).getByTestId('contract-proposals')).toBeInTheDocument()
      expect(within(strip).getByTestId('validation-verdict')).toBeInTheDocument()
    })
  }

  it('market replaces the synthetic strip with the real quality cross-section', async () => {
    render(
      <App
        initialPage="market"
        qualityGateway={new QualityListTestGateway()}
      />,
    )
    expect(await screen.findByTestId('market-live-quality')).toBeInTheDocument()
    expect(await screen.findByTestId('live-quality-row')).toBeInTheDocument()
    expect(screen.queryByTestId('quality-strip')).toBeNull()
  })

  // toBeInTheDocument passes for content inside a collapsed <details>, so on its own it cannot
  // show that a reader ever met the warning. The summary renders whether or not the strip is
  // open, so the risk that constrains every conclusion is asserted there instead.
  for (const view of VIEWS.filter((candidate) => candidate.id !== 'market')) {
    it(`${view.id} shows the degraded source statuses without the strip being opened`, async () => {
      render(<App initialPage={view.id as ViewId} />)
      await flush()
      const strip = screen.getByTestId('quality-strip')
      expect(strip).not.toHaveAttribute('open')
      const summary = within(strip).getByTestId('quality-summary')
      const risk = within(summary).getByTestId('quality-risk')
      const degraded = SOURCE_COVERAGE.filter((s) => s.data_status !== DataStatus.COMPLETE)
      expect(degraded.length).toBeGreaterThan(0)
      for (const source of degraded) expect(risk).toHaveTextContent(source.data_status)
      expect(within(summary).getByTestId('quality-isolated')).toBeInTheDocument()
    })
  }

  // An earlier version drew a single COMPLETE chip whenever nothing was degraded, stating a
  // set-level status the sources never carry — the same collapse the collection envelope refuses.
  // The sources hold three distinct statuses, so one summarising chip would be visibly wrong.
  it('lists every distinct source status rather than one verdict over the set', async () => {
    render(<App initialPage="hub" />)
    await flush()
    const risk = screen.getByTestId('quality-risk')
    const distinct = [...new Set(SOURCE_COVERAGE.map((s) => s.data_status))]
    expect(distinct.length).toBeGreaterThan(1)
    expect(risk.querySelectorAll('[data-machine]')).toHaveLength(distinct.length)
    for (const status of distinct) expect(risk).toHaveTextContent(status)
  })
})

// B7. A source answers "how well was this observed", never "where should this be bought".
describe('sources are coverage facts, not places to trade', () => {
  it('names only synthetic sources', () => {
    expect(SOURCE_COVERAGE.length).toBeGreaterThan(0)
    for (const source of SOURCE_COVERAGE) {
      expect(source.source_id).toMatch(/^SYNTHETIC-SOURCE-\d+$/)
    }
  })

  // A row carrying a price, a link or a stock count would be an invitation whatever the copy
  // around it said. The shape is the guarantee; the wording ban is only the second line.
  it('carries no field that could name a destination', () => {
    for (const source of SOURCE_COVERAGE) {
      expect(Object.keys(source).sort()).toEqual([
        'data_status',
        'directness',
        'last_observed_at',
        'observed_units',
        'source_id',
      ])
    }
  })

  it.each(['items', 'item'] as const)('shows source ids only in the quality strip on %s', async (page) => {
    render(<App initialPage={page} />)
    await flush()
    const strip = screen.getByTestId('quality-strip')
    for (const source of SOURCE_COVERAGE) {
      expect(strip).toHaveTextContent(source.source_id)
      const elsewhere = screen
        .getAllByText(source.source_id)
        .filter((node) => !strip.contains(node))
      expect(elsewhere).toEqual([])
    }
  })
})
