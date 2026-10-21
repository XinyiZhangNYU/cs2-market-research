import { act, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App, VIEWS, type ViewId } from '../src/App'
import { ClaimNotAllowed, validateClaims, validateValidationClaim } from '../src/contract/claims'
import { itemDimensions, marketDimensions, sectorDimensions } from '../src/contract/dimensions'
import {
  ClaimCode,
  DataBranch,
  DataStatus,
  Recommendation,
  ScopeKind,
  TradeConfirmation,
  ValidationClaim,
  ValidationLevel,
} from '../src/contract/enums'
import { collectionHeader, type CollectionMember } from '../src/contract/collection'
import {
  SNAPSHOT_CASE_STATUSES,
  TERMINAL_CASE_STATUSES,
} from '../src/contract/caseLifecycle'
import { CONTRACT_PROPOSALS, isProduced, type Field } from '../src/contract/provenance'
import { ITEM_RECOMMENDATIONS, ITEM_STATES, MARKET, SECTORS, UNIT_IDS, header } from '../src/mock/fixtures'
import { researchApi } from '../src/api'
import { QualityListTestGateway } from './support/qualityListTestGateway'

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('every view carries the prototype marker', () => {
  for (const view of VIEWS) {
    it(`${view.id} shows its exact prototype provenance`, async () => {
      render(
        <App
          initialPage={view.id as ViewId}
          qualityGateway={view.id === 'market' ? new QualityListTestGateway() : undefined}
        />,
      )
      await flush()
      const banner = screen.getByTestId('prototype-banner')
      if (view.id === 'market') {
        expect(banner).toHaveTextContent('EXPLORATORY_FRONTEND_PROTOTYPE / MIXED_PROVENANCE')
        expect(banner).toHaveTextContent('数据质量区读取本地真实结果')
      } else {
        expect(banner).toHaveTextContent('EXPLORATORY_FRONTEND_PROTOTYPE / MOCK_DATA_ONLY')
        expect(banner).toHaveTextContent('全部为合成数据')
        expect(banner).toHaveTextContent('非实时信号')
      }
      expect(screen.getByTestId(`page-${view.id}`)).toBeInTheDocument()
    })
  }
})

describe('as_of is never rendered as a plausible value', () => {
  it('is a CONTRACT_PROPOSAL in the fixture header', () => {
    const h = header(ScopeKind.ITEM, ITEM_STATES['ITEM-0001'])
    expect(isProduced(h.as_of)).toBe(false)
  })

  // The hub answers for no scope at all, so it carries no envelope. Every other view must mark
  // as_of unproduced in every envelope it renders — a collection envelope included, because a
  // page answering for many units has even less claim to a single instant than one answering for
  // one. Querying by attribute rather than by testid catches both envelope kinds at once.
  for (const view of VIEWS.filter((v) => v.envelope !== 'NONE')) {
    it(`${view.id} marks as_of unproduced in every envelope it renders`, async () => {
      const { container } = render(
        <App
          initialPage={view.id as ViewId}
          qualityGateway={view.id === 'market' ? new QualityListTestGateway() : undefined}
        />,
      )
      await flush()
      const envelopes = [...container.querySelectorAll('[data-envelope]')]
      expect(envelopes.length).toBeGreaterThan(0)
      for (const envelope of envelopes) {
        expect(within(envelope as HTMLElement).getAllByTestId('not-produced')[0]).toHaveTextContent(
          'NOT_PRODUCED / CONTRACT_PROPOSAL',
        )
        expect(envelope).toHaveTextContent('available_at')
      }
    })
  }

  it('a view declared SINGLE renders a scope header and a COLLECTION view renders none', async () => {
    for (const view of VIEWS) {
      const { container, unmount } = render(
        <App
          initialPage={view.id as ViewId}
          qualityGateway={view.id === 'market' ? new QualityListTestGateway() : undefined}
        />,
      )
      await flush()
      const kinds = [...container.querySelectorAll('[data-envelope]')].map((el) =>
        el.getAttribute('data-envelope'),
      )
      if (view.envelope === 'NONE') expect(kinds).toEqual([])
      else expect(kinds).toContain(view.envelope)
      // A collection page must never borrow a single-scope envelope for the set it lists.
      if (view.envelope === 'COLLECTION') expect(kinds).not.toContain('SINGLE')
      unmount()
    }
  })

  it('the hub is the only view without an envelope', async () => {
    render(<App initialPage="hub" />)
    await flush()
    expect(screen.queryByTestId('scope-header')).toBeNull()
    expect(screen.queryByTestId('collection-header')).toBeNull()
    expect(VIEWS.filter((v) => v.envelope === 'NONE').map((v) => v.id)).toEqual(['hub'])
  })
})

// A NOT_PRODUCED field names the contract it wants in proposedAs, and CONTRACT_PROPOSALS is the
// list handed to the backend. A proposedAs that never reaches that list is a request nobody
// receives, so the gap stops being visible and starts being assumed away. This walks the API
// responses rather than the DOM, so a field is caught even on a page that forgets to render it.
describe('every unproduced field is a registered contract request', () => {
  const registered = new Set(CONTRACT_PROPOSALS.flatMap((p) => p.proposedAs.split(' / ')))

  function proposalsIn(node: unknown, found: Set<string>): Set<string> {
    if (node === null || typeof node !== 'object') return found
    const record = node as Record<string, unknown>
    if (record.provenance === 'NOT_PRODUCED' && typeof record.proposedAs === 'string') {
      found.add(record.proposedAs)
    }
    for (const value of Object.values(record)) proposalsIn(value, found)
    return found
  }

  async function everyProposal() {
    const api = researchApi()
    const responses = await Promise.all([
      api.getMarketOverview('zh'),
      api.getCandidatePool('zh'),
      api.getSignalsAndCases('zh'),
      api.getDataQuality('zh'),
      api.getResearchReport('zh'),
      ...UNIT_IDS.map((id) => api.getItemDetail(id, 'zh')),
    ])
    return proposalsIn(responses, new Set<string>())
  }

  it('the API emits unproduced fields, so the check has something to catch', async () => {
    expect((await everyProposal()).size).toBeGreaterThan(0)
  })

  it('registers every proposedAs the API emits', async () => {
    const unregistered = [...(await everyProposal())].filter((name) => !registered.has(name)).sort()
    expect(unregistered).toEqual([])
  })
})

describe('orthogonal dimensions stay separate and scope-correct', () => {
  it('ITEM exposes exactly the six item dimensions', () => {
    const fields = itemDimensions(ITEM_STATES['ITEM-0001'], 'zh').map((d) => d.field)
    expect(fields).toEqual([
      'cycle_stage',
      'evidence_flags',
      'data_status',
      'regime_relation',
      'recommendation',
      'case_status',
    ])
  })

  it('MARKET has no cycle_stage and no regime_relation', () => {
    const fields = marketDimensions(MARKET, 'zh').map((d) => d.field)
    expect(fields).not.toContain('cycle_stage')
    expect(fields).not.toContain('regime_relation')
    expect(fields).toContain('trend_stage')
    expect(fields).toContain('level_regime')
  })

  it('SECTOR separates absolute trend from relative strength', () => {
    const fields = sectorDimensions(SECTORS[0], 'zh').map((d) => d.field)
    expect(fields).not.toContain('cycle_stage')
    expect(fields).toContain('trend_stage')
    expect(fields).toContain('relative_strength')
  })

  it('renders each dimension in its own cell rather than one aggregate', async () => {
    render(<App initialPage="item" />)
    await flush()
    const grid = screen.getAllByTestId('dimension-grid')[0]
    const cells = grid.querySelectorAll('[data-field]')
    expect(cells.length).toBe(6)
  })
})

describe('branch B keeps the trade gap attached to the recommendation', () => {
  it('the strong-candidate fixture is branch B without trade confirmation', () => {
    const rec = ITEM_RECOMMENDATIONS['ITEM-0001']
    expect(rec.recommendation).toBe(Recommendation.STRONG_CANDIDATE)
    expect(rec.data_branch).toBe(DataBranch.B)
    expect(rec.trade_confirmation).toBe(TradeConfirmation.UNAVAILABLE)
  })

  it('renders data_branch, trade_confirmation and evidence_coverage together', async () => {
    render(<App initialPage="item" />)
    await flush()
    const disclosure = screen.getByTestId('branch-b-disclosure')
    expect(disclosure).toHaveTextContent('data_branch=B')
    expect(disclosure).toHaveTextContent('trade_confirmation=UNAVAILABLE')
    expect(disclosure).toHaveTextContent('evidence_coverage=')
  })

  it('rejects trade-confirmation claims on branch B', () => {
    expect(() =>
      validateClaims(DataBranch.B, [ClaimCode.SWEEPING_CONFIRMED]),
    ).toThrow(ClaimNotAllowed)
    expect(() =>
      validateClaims(DataBranch.B, [ClaimCode.TRUSTED_TRADE_VOLUME_INCREASING]),
    ).toThrow(ClaimNotAllowed)
    expect(() =>
      validateClaims(DataBranch.B, [ClaimCode.UNIFIED_PRICE_RISING]),
    ).not.toThrow()
  })

  it('rejects a full P/D/S validation claim at component-backtest level', () => {
    expect(() =>
      validateValidationClaim(
        ValidationLevel.COMPONENT_BACKTEST,
        ValidationClaim.FULL_PDS_ALGORITHM_VALIDATED,
      ),
    ).toThrow(ClaimNotAllowed)
  })
})

// v3 produced a collection-level versions and data_branch whenever every member agreed. Agreement
// is a property of the members; it is not the collection stating a value. Every fixture snapshot
// carries the same branch and the same versions, so unanimity is the live case here and these
// checks pass only because the envelope refuses on principle rather than for lack of a candidate.
describe('a collection envelope produces nothing about the collection', () => {
  const members = UNIT_IDS.map((id) => ITEM_STATES[id])
  const build = (m: readonly CollectionMember[]) =>
    collectionHeader({ scope_kind: ScopeKind.ITEM, collection_id: 'TEST', members: m })

  it('the members agree on data_branch and versions, so unanimity is what is being refused', () => {
    expect(new Set(members.map((m) => m.data_branch)).size).toBe(1)
    expect(new Set(members.map((m) => JSON.stringify(m.versions))).size).toBe(1)
  })

  it('leaves every collection-level field unproduced', () => {
    const header = build(members)
    const collectionFields: readonly Field<unknown>[] = [
      header.as_of,
      header.available_at,
      header.data_status,
      header.data_branch,
      header.versions,
    ]
    for (const field of collectionFields) expect(isProduced(field)).toBe(false)
  })

  it('reports what the members carry as a derived distribution, with frequencies', () => {
    const header = build(members)
    const completeCount = members.filter((m) => m.data_status === DataStatus.COMPLETE).length
    expect(header.member_count).toBe(members.length)
    expect(header.member_data_branch.provenance).toBe('DERIVED_FROM_MEMBERS')
    expect(header.member_data_branch.buckets).toEqual([
      { value: members[0].data_branch, count: members.length },
    ])
    expect(header.member_versions.provenance).toBe('DERIVED_FROM_MEMBERS')
    expect(header.member_versions.buckets).toEqual([
      { value: members[0].versions, count: members.length },
    ])
    expect(header.member_data_status.provenance).toBe('DERIVED_FROM_MEMBERS')
    expect(header.member_data_status.buckets.length).toBeGreaterThan(1)
    expect(
      header.member_data_status.buckets.find((bucket) => bucket.value === DataStatus.COMPLETE)
        ?.count,
    ).toBe(completeCount)
    expect(header.member_available_at).not.toBeNull()
    expect(header.member_available_at?.provenance).toBe('DERIVED_FROM_MEMBERS')
  })

  it('identifies versions by canonical fields, not JSON.stringify key order', () => {
    const canonical = members[0].versions
    const reordered = {
      algorithm_version: canonical.algorithm_version,
      failure_policy_version: canonical.failure_policy_version,
      parameter_set_version: canonical.parameter_set_version,
      stage_policy_version: canonical.stage_policy_version,
      catalog_version: canonical.catalog_version,
      group_version: canonical.group_version,
      index_version: canonical.index_version,
      fusion_method_version: canonical.fusion_method_version,
      feature_profile_version: canonical.feature_profile_version,
    }
    expect(JSON.stringify(canonical)).not.toBe(JSON.stringify(reordered))
    const header = build([{ versions: canonical }, { versions: reordered }])
    expect(header.member_versions.buckets).toEqual([{ value: canonical, count: 2 }])
  })

  // An absent member field must stay absent. Defaulting it would put a value on the envelope that
  // no member ever stated, which is the same fabrication one step removed.
  it('an empty member list yields empty derived summaries and a null span, not defaults', () => {
    const empty = {
      provenance: 'DERIVED_FROM_MEMBERS' as const,
      member_count: 0,
      reported_count: 0,
      buckets: [],
    }
    const header = build([])
    expect(header.member_count).toBe(0)
    expect(header.member_available_at).toBeNull()
    expect(header.member_data_status).toEqual(empty)
    expect(header.member_data_branch).toEqual(empty)
    expect(header.member_versions).toEqual(empty)
  })
})

// models.py refuses a snapshot that sets both case ids ("an active cycle case replaces an active
// candidate episode") and refuses a case_status with no case id behind it. On closure engine.py
// clears both ids and writes None. Across engine.py and context.py every case_status assignment is
// ACTIVE, SUSPENDED or None, so those three are the whole range a snapshot can carry; terminal
// statuses live in the ledger and the outcome table. A fixture outside that range would have the
// prototype designing screens for states the backend cannot emit.
describe('fixture snapshots stay inside what the engine can emit', () => {
  const snapshots = UNIT_IDS.map((id) => ITEM_STATES[id])

  it('carries no terminal case_status on any snapshot', () => {
    for (const snapshot of [...snapshots, MARKET, ...SECTORS]) {
      expect(SNAPSHOT_CASE_STATUSES).toContain(snapshot.case_status)
      expect(TERMINAL_CASE_STATUSES).not.toContain(snapshot.case_status)
    }
  })

  it('never sets both case ids at once', () => {
    for (const snapshot of snapshots) {
      expect(snapshot.candidate_episode_id !== null && snapshot.cycle_case_id !== null).toBe(false)
    }
  })

  it('backs every non-null case_status with a case id', () => {
    for (const snapshot of snapshots) {
      if (snapshot.case_status !== null) {
        expect(snapshot.candidate_episode_id ?? snapshot.cycle_case_id).not.toBeNull()
      }
    }
  })

  // Without all three present the checks above would pass on a fixture too thin to tell them
  // apart, and without both id kinds the exclusive-slot rendering would never be exercised.
  it('exercises ACTIVE, SUSPENDED and null, and both kinds of case id', () => {
    expect(new Set(snapshots.map((s) => s.case_status))).toEqual(new Set(SNAPSHOT_CASE_STATUSES))
    expect(snapshots.some((s) => s.candidate_episode_id !== null)).toBe(true)
    expect(snapshots.some((s) => s.cycle_case_id !== null)).toBe(true)
  })
})

// The fixture header used to default data_status to COMPLETE and hardcode the branch and versions,
// so an envelope could state a status and an algorithm version its own snapshot never carried.
// MARKET is DEGRADED_OPTIONAL, which makes the difference observable rather than theoretical.
describe('a scope envelope restates its own snapshot', () => {
  it('carries the snapshot data_status rather than a default', () => {
    expect(MARKET.data_status).not.toBe(DataStatus.COMPLETE)
    expect(header(ScopeKind.MARKET, MARKET).data_status).toBe(MARKET.data_status)
    for (const sector of SECTORS) {
      expect(header(ScopeKind.SECTOR, sector).data_status).toBe(sector.data_status)
    }
  })

  it('renders that status on the market page instead of a healthier one', async () => {
    render(
      <App
        initialPage="market"
        qualityGateway={new QualityListTestGateway()}
      />,
    )
    await flush()
    const envelope = screen.getAllByTestId('scope-header')[0]
    expect(envelope).toHaveTextContent(MARKET.data_status)
  })
})
