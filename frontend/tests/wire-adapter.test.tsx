// The path this file exercises is decode → view model → component. Every envelope below is
// validated by the shared schema first, including the ones built locally for a case the shared
// examples do not cover yet, so nothing reaches a component without having been a legal envelope.
import { render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  assertSingleResultGranularity,
  collectionResultView,
  displayToken,
  MixedResultGranularity,
  NON_CANONICAL_LABEL,
  tokenText,
  unitResultView,
  type PresentableCollectionView,
  type PresentableUnitView,
} from '../src/adapter/resultViewModel'
import {
  ResultCollectionEnvelopeView,
  ResultUnitEnvelopeView,
} from '../src/components/ResultEnvelopeView'
import { AnalysisUnitKind } from '../src/contract/enums'
import { isProduced } from '../src/contract/provenance'
import { LangProvider, type Lang } from '../src/i18n'
import { snapshotIdOf } from '../src/wire/canonical'
import { decodeCollectionResult, decodeUnitResult } from '../src/wire/decode'
import { schemaTextKinds } from '../src/wire/schema'
import {
  isPresentable,
  isValidated,
  UnpresentableView,
  UnvalidatedEnvelope,
} from '../src/wire/validated'

const EXAMPLES = join(dirname(dirname(fileURLToPath(import.meta.url))), '..', 'schemas', 'examples')

function example(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(EXAMPLES, name), 'utf8')) as Record<string, unknown>
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

// snapshot_id is part of the contract now, so any document assembled or edited here has to be
// hashed the way the producer would have hashed it before the decoder will look at it.
function sealed(document: Record<string, unknown>): Record<string, unknown> {
  document.snapshot_id = snapshotIdOf(document)
  return document
}

const ITEM = decodeUnitResult(example('unit-item-branch-b.valid.json'))
const COLLECTION = decodeCollectionResult(example('collection-missing-unavailable.valid.json'))

// MOCK_DATA_ONLY. The shared examples cover an ITEM unit and a COLLECTION; a MARKET unit is
// needed to prove the by-contract null path, so one is built here and put through the same
// decoder. If it ever stops being a legal envelope this file fails at import time.
const MARKET_DOCUMENT: Record<string, unknown> = {
  snapshot_id: 'b'.repeat(64),
  contract_code: 'research-result-envelope',
  contract_version: 'v1',
  envelope_kind: 'UNIT',
  identity: {
    analysis_unit_id: 'market:global',
    scope_kind: 'MARKET',
    display_name: 'MOCK_DATA_ONLY market',
    identity_available_at: '2026-08-20T23:00:00.000000Z',
    catalog_version: 'catalog-v1',
    analysis_unit_kind: null,
    edition_kind: null,
    parent_analysis_unit_id: null,
  },
  as_of: '2026-08-21T00:00:00.000000Z',
  available_at: '2026-08-20T23:59:59.000000Z',
  data_branch: 'B',
  data_status: 'COMPLETE',
  versions: clone(ITEM.versions),
  state: {
    trend_stage: 'NEUTRAL',
    level_regime: 'NORMAL',
    evidence_flags: [],
    recommendation: 'WATCH',
    case_status: null,
    analysis_case_id: null,
    input_snapshot_hash: 'b'.repeat(64),
  },
  recommendation_detail: null,
  evidence_domains: [],
  claims: [],
}

const MARKET = decodeUnitResult(sealed(clone(MARKET_DOCUMENT)))

function renderUnit(view: PresentableUnitView, lang: Lang = 'zh') {
  return render(
    <LangProvider lang={lang}>
      <ResultUnitEnvelopeView view={view} />
    </LangProvider>,
  )
}

describe('the shared examples become view models through the one decoder', () => {
  it('renders the shared ITEM example', () => {
    renderUnit(unitResultView(ITEM))
    const unit = screen.getByTestId('result-unit')
    expect(unit).toHaveAttribute('data-contract', 'research-result-envelope/v1')
    expect(within(unit).getByTestId('result-identity')).toHaveTextContent(
      tokenText(displayToken('item:42:phase-p2')),
    )
    expect(within(unit).getByTestId('result-identity')).toHaveTextContent('STYLE_VARIANT')
    expect(within(unit).getByTestId('result-state')).toHaveTextContent('PRESSURE_BUILDING')
  })

  it('renders the shared COLLECTION example with the accounting the producer stated', () => {
    render(
      <LangProvider lang="zh">
        <ResultCollectionEnvelopeView view={collectionResultView(COLLECTION)} />
      </LangProvider>,
    )
    const accounting = screen.getByTestId('result-accounting')
    expect(accounting).toHaveTextContent(tokenText(displayToken('market:missing')))
    expect(accounting).toHaveTextContent(tokenText(displayToken('market:unavailable')))
    // Stated, not recomputed: 3 members with 1 returned is exactly what the envelope says.
    expect(accounting).toHaveTextContent('3')
    expect(accounting).toHaveTextContent('1')
  })

  it('keeps the three member sets as the producer sent them', () => {
    const view = collectionResultView(COLLECTION)
    expect(view.accounting.member_count).toBe(3)
    expect(view.accounting.returned_member_count).toBe(1)
    expect(view.accounting.member_result_ids).toEqual(COLLECTION.member_result_ids)
    expect(view.accounting.missing_member_ids.map(tokenText)).toEqual([
      tokenText(displayToken('market:missing')),
    ])
    expect(view.accounting.unavailable_member_ids.map(tokenText)).toEqual([
      tokenText(displayToken('market:unavailable')),
    ])
  })
})

describe('B5. granularity comes from the field, never from the identifier', () => {
  it('reads STYLE_VARIANT from analysis_unit_kind, not from the id that looks parseable', () => {
    const view = unitResultView(ITEM)
    // The shared id spells out "item:42:phase-p2", but the presentation boundary exposes only a
    // fingerprint. Neither the raw id nor its parseable-looking suffix can drive granularity.
    expect(tokenText(view.identity.analysis_unit_id)).toMatch(/^REF#[0-9a-f]{16}$/)
    expect(tokenText(view.identity.analysis_unit_id)).not.toContain('phase-p2')
    expect(view.identity.analysis_unit_kind).toBe(AnalysisUnitKind.STYLE_VARIANT)

    const renamed = clone(ITEM) as unknown as Record<string, unknown>
    ;(renamed.identity as Record<string, unknown>).analysis_unit_id = 'item:42:opaque'
    ;(renamed.identity as Record<string, unknown>).analysis_unit_kind = 'BASE_MHN'
    ;(renamed.identity as Record<string, unknown>).parent_analysis_unit_id = null
    expect(unitResultView(decodeUnitResult(sealed(renamed))).identity.analysis_unit_kind).toBe(
      AnalysisUnitKind.BASE_MHN,
    )
  })

  it('refuses to summarise a BASE_MHN and a STYLE_VARIANT together', () => {
    const base = clone(ITEM) as unknown as Record<string, unknown>
    ;(base.identity as Record<string, unknown>).analysis_unit_kind = 'BASE_MHN'
    ;(base.identity as Record<string, unknown>).parent_analysis_unit_id = null
    const views = [unitResultView(ITEM), unitResultView(decodeUnitResult(sealed(base)))]
    expect(() => assertSingleResultGranularity(views)).toThrow(MixedResultGranularity)
  })

  it('allows a single granularity, and a MARKET unit that has none', () => {
    expect(() => assertSingleResultGranularity([unitResultView(ITEM)])).not.toThrow()
    expect(() =>
      assertSingleResultGranularity([unitResultView(MARKET), unitResultView(ITEM)]),
    ).not.toThrow()
  })
})

describe('B6. what V1 does not carry is shown as absent, not as an answer', () => {
  const ABSENT = [
    'query_outcome',
    'transitions',
    'lifecycle_events',
    'outcome_evaluations',
    'source_coverage',
    'supporting_factors',
    'primary_risks',
    'invalidation_conditions',
    'pool_tier',
  ]

  it.each(ABSENT)('marks %s NOT_PRODUCED', (key) => {
    renderUnit(unitResultView(ITEM))
    const absent = screen.getByTestId('result-absent')
    const row = within(absent)
      .getAllByRole('listitem')
      .find((node) => node.textContent?.startsWith(key))
    expect(row).toBeDefined()
    expect(row).toHaveTextContent('NOT_PRODUCED')
  })

  it('projects the PIT-resolved parent as an opaque token', () => {
    const view = unitResultView(ITEM)
    expect(view.identity.parent_analysis_unit_id).not.toBeNull()
    expect(tokenText(view.identity.parent_analysis_unit_id!)).toBe(
      tokenText(displayToken('item:42')),
    )
    renderUnit(view)
    expect(screen.getByTestId('result-parent')).toHaveTextContent(tokenText(displayToken('item:42')))
  })

  // A contract that answers "null" is not a contract that failed to answer. Collapsing the two
  // would either invent a parent edge or hide a real by-design null behind a NOT_PRODUCED badge.
  it('does not mark a by-contract null as NOT_PRODUCED', () => {
    renderUnit(unitResultView(MARKET))
    expect(screen.getByTestId('result-recommendation-by-design')).toBeVisible()
    expect(screen.queryByTestId('result-recommendation')).toBeNull()
    const unit = screen.getByTestId('result-unit')
    const parent = screen.getByTestId('result-parent')
    const absent = screen.getByTestId('result-absent')
    for (const badge of within(unit).getAllByTestId('not-produced')) {
      expect(parent.contains(badge) || absent.contains(badge)).toBe(true)
    }
  })

  it('says nothing about the source, the identity or total supply when a field is absent', () => {
    for (const lang of ['zh', 'en'] as const) {
      const { unmount } = renderUnit(unitResultView(ITEM), lang)
      const text = screen.getByTestId('result-unit').textContent ?? ''
      for (const forbidden of [
        '平台不支持',
        '该身份不存在',
        '总供应量为零',
        'the platform does not support',
        'this identity does not exist',
        'total supply is zero',
      ]) {
        expect(text).not.toContain(forbidden)
      }
      unmount()
    }
  })
})

describe('B7. a result envelope carries no destination to trade at', () => {
  it('has no source field to render in the first place', () => {
    expect(Object.keys(ITEM).sort()).toEqual(
      [
        'as_of',
        'available_at',
        'claims',
        'contract_code',
        'contract_version',
        'data_branch',
        'data_status',
        'envelope_kind',
        'evidence_domains',
        'identity',
        'recommendation_detail',
        'snapshot_id',
        'state',
        'versions',
      ].sort(),
    )
    for (const domain of ITEM.evidence_domains) {
      expect(Object.keys(domain).sort()).toEqual(
        [
          'contributing_feature_keys',
          'domain',
          'input_snapshot_hash',
          'missing_reason',
          'policy_version',
          'strength',
        ].sort(),
      )
    }
  })

  it.each(['zh', 'en'] as const)('names no platform and no purchase step in %s', (lang) => {
    const { unmount } = renderUnit(unitResultView(ITEM), lang)
    const text = screen.getByTestId('result-unit').textContent ?? ''
    for (const pattern of [/\bMarket [A-D]\b/, /\bMARKET_[A-D]\b/, /市场 [A-D]/]) {
      expect(text).not.toMatch(pattern)
    }
    for (const phrase of ['去哪买', '购买链接', '立即购买', '下单', 'where to buy', 'buy now']) {
      expect(text).not.toContain(phrase)
    }
    unmount()
  })
})

describe('branch B is visible as branch B', () => {
  it('renders the by-design unavailability the envelope declares', () => {
    const view = unitResultView(ITEM)
    expect(view.header.data_branch).toBe('B')
    expect(view.header.data_status).toBe('UNAVAILABLE_BY_DESIGN')
    expect(view.recommendation_detail?.trade_confirmation).toBe('UNAVAILABLE')
    renderUnit(view)
    expect(screen.getByTestId('result-recommendation')).toHaveTextContent('UNAVAILABLE')
  })

  it('carries as_of as a produced fact now that RC-R001 is closed', () => {
    const view = unitResultView(ITEM)
    expect(isProduced(view.header.as_of)).toBe(true)
    expect(isProduced(view.header.as_of) ? view.header.as_of.value : null).toBe(ITEM.as_of)
  })
})

// RC-O03 is open, so every nonblank_text field in the envelope may legally carry any sentence at
// all. FE-RC-001B rendered `missing_reason` straight into the DOM, which meant a schema-valid
// envelope could put "请立即在 MARKET_B 下单" on the screen and B7 held only for the shared fixtures.
//
// The proof below is payload-general rather than fixture-specific: the free-text locations are
// read out of the schema, every one of them is filled with a hostile sentinel, and the assertion
// is that none of them reaches the rendered output. A new nonblank_text field in the schema
// arrives here as a failing coverage assertion rather than as an untested hole.
const SENTINEL_PREFIX = '请立即在 MARKET_B 下单'
const OPAQUE_SOURCE_PREFIX = 'MARKET_B_'

function sentinelFor(field: string): string {
  return `${SENTINEL_PREFIX}（${field}）`
}

function opaqueSourceSentinelFor(field: string): string {
  return `${OPAQUE_SOURCE_PREFIX}${field}`
}

// The producer free-text locations, read out of the same schema walk the drift gate uses rather
// than out of a second walk written here. `nonblank_text` is the contract's own name for "any
// sentence at all is legal in this field", so filtering the vocabulary map on it is the same
// question the earlier bespoke walk was asking, minus the duplicate implementation - and minus
// the chance of the two drifting apart. `breadth` left this set when RC-R007 gave those two
// fields decimal vocabularies, and this picks that up without an edit.
const FREE_TEXT_PATHS: string[] = Object.entries(schemaTextKinds())
  .filter(([, tag]) => tag === 'nonblank_text' || tag === 'nonblank_text|null')
  .map(([path]) => path)
  .sort()

function fillPath(node: unknown, segments: readonly string[], value: string): boolean {
  if (node === null || typeof node !== 'object') return false
  const [head, ...rest] = segments
  if (head === '*') {
    if (!Array.isArray(node)) return false
    let filled = false
    node.forEach((element, index) => {
      if (rest.length === 0) {
        if (typeof element === 'string') {
          node[index] = value
          filled = true
        }
      } else if (fillPath(element, rest, value)) {
        filled = true
      }
    })
    return filled
  }
  const record = node as Record<string, unknown>
  if (!(head in record)) return false
  if (rest.length === 0) {
    // A null nullable slot is not a free-text value in this document; another fixture covers it.
    if (typeof record[head] !== 'string') return false
    record[head] = value
    return true
  }
  return fillPath(record[head], rest, value)
}

// The sentinel is keyed by field name rather than by path, so identity.catalog_version and
// versions.catalog_version receive the same string and the envelope stays legal.
function withSentinels(
  document: Record<string, unknown>,
  valueFor: (field: string) => string = sentinelFor,
): {
  document: Record<string, unknown>
  filled: string[]
} {
  const copy = clone(document)
  const filled: string[] = []
  for (const path of FREE_TEXT_PATHS) {
    const segments = path.split('/').filter(Boolean)
    const field = segments.filter((segment) => segment !== '*').at(-1) ?? ''
    if (fillPath(copy, segments, valueFor(field))) filled.push(path)
  }
  return { document: sealed(copy), filled }
}

const ITEM_DOCUMENT = example('unit-item-branch-b.valid.json')
const COLLECTION_DOCUMENT = example('collection-missing-unavailable.valid.json')

// Two ITEM variants, because a domain renders its feature keys when evidence is available and its
// withheld notice when it is not. One document cannot exercise both branches.
function itemDocument(withheldDomains: boolean): Record<string, unknown> {
  const document = clone(ITEM_DOCUMENT)
  ;(document.state as Record<string, unknown>).cycle_case_id = 'cycle:placeholder'
  if (withheldDomains) {
    for (const domain of document.evidence_domains as Record<string, unknown>[]) {
      domain.strength = 'UNAVAILABLE'
      domain.missing_reason = 'UNAVAILABLE_BY_DESIGN'
    }
  }
  return document
}

function marketDocument(): Record<string, unknown> {
  const document = clone(MARKET_DOCUMENT)
  ;(document.state as Record<string, unknown>).analysis_case_id = 'case:placeholder'
  return document
}

// MOCK_DATA_ONLY, and needed for coverage rather than for a rendering case: the two breadth
// ratios are the only free-text locations that live on a SECTOR state, and the shared examples
// have no SECTOR unit. The schema types them as nonblank_text or null - not as a decimal - so a
// producer may legally put a sentence where a ratio belongs. That is recorded in
// docs/formal-contract-difference.md rather than patched here.
function sectorDocument(): Record<string, unknown> {
  const document = clone(MARKET_DOCUMENT)
  ;(document.identity as Record<string, unknown>).analysis_unit_id = 'sector:knives'
  ;(document.identity as Record<string, unknown>).scope_kind = 'SECTOR'
  document.state = {
    trend_stage: 'NEUTRAL',
    relative_strength: 'IN_LINE',
    breadth: {
      advancing_member_ratio: '0.5',
      median_member_return: '0.01',
      breadth_expanding: false,
      breadth_narrowing: false,
      concentration_warning: false,
    },
    evidence_flags: [],
    recommendation: 'WATCH',
    case_status: null,
    analysis_case_id: 'case:placeholder',
    input_snapshot_hash: 'b'.repeat(64),
  }
  return document
}

const SENTINEL_UNITS = [
  ['ITEM with available domains', withSentinels(itemDocument(false))],
  ['ITEM with withheld domains', withSentinels(itemDocument(true))],
  ['MARKET', withSentinels(marketDocument())],
  ['SECTOR', withSentinels(sectorDocument())],
] as const
const SENTINEL_COLLECTION = withSentinels(COLLECTION_DOCUMENT)
const OPAQUE_SOURCE_UNITS = [
  ['ITEM with available domains', withSentinels(itemDocument(false), opaqueSourceSentinelFor)],
  ['ITEM with withheld domains', withSentinels(itemDocument(true), opaqueSourceSentinelFor)],
  ['MARKET', withSentinels(marketDocument(), opaqueSourceSentinelFor)],
  ['SECTOR', withSentinels(sectorDocument(), opaqueSourceSentinelFor)],
] as const
const OPAQUE_SOURCE_COLLECTION = withSentinels(
  COLLECTION_DOCUMENT,
  opaqueSourceSentinelFor,
)

describe('RC-O03. producer free text does not reach the screen for any legal payload', () => {
  it('found the free-text locations in the schema rather than in a list here', () => {
    expect(FREE_TEXT_PATHS).toContain('/identity/display_name')
    expect(FREE_TEXT_PATHS).toContain('/identity/parent_analysis_unit_id')
    expect(FREE_TEXT_PATHS).not.toContain('/evidence_domains/*/missing_reason')
    expect(FREE_TEXT_PATHS).toContain('/collection_id')
    expect(FREE_TEXT_PATHS.length).toBe(21)
    // The two breadth fields used to be here. They are decimal vocabularies now, so a sentence
    // cannot reach them at all and the display boundary is no longer what protects them.
    expect(FREE_TEXT_PATHS).not.toContain('/state/breadth/advancing_member_ratio')
    expect(FREE_TEXT_PATHS).not.toContain('/state/breadth/median_member_return')
  })

  // Without this, a fixture that happened to miss a field would leave that field untested while
  // every assertion below still passed.
  it('fills every one of them across the fixtures', () => {
    const covered = new Set<string>([
      ...SENTINEL_UNITS.flatMap(([, fixture]) => fixture.filled),
      ...SENTINEL_COLLECTION.filled,
    ])
    expect([...covered].sort()).toEqual(FREE_TEXT_PATHS)
  })

  it.each(
    SENTINEL_UNITS.flatMap(([name, fixture]) =>
      (['zh', 'en'] as const).map((lang) => [`${name} in ${lang}`, fixture, lang] as const),
    ),
  )('renders no producer free text for %s', (_name, fixture, lang) => {
    const view = unitResultView(decodeUnitResult(fixture.document))
    const { container, unmount } = renderUnit(view, lang)
    expect(container.innerHTML).not.toContain(SENTINEL_PREFIX)
    expect(container.innerHTML).not.toContain('MARKET_B')
    // The identity token is where the sentinel would have surfaced, so seeing the marker proves
    // the boundary ran rather than that the field was quietly dropped.
    expect(container.innerHTML).toContain(NON_CANONICAL_LABEL)
    unmount()
  })

  it.each(['zh', 'en'] as const)('renders no producer free text for a COLLECTION in %s', (lang) => {
    const view = collectionResultView(decodeCollectionResult(SENTINEL_COLLECTION.document))
    const { container } = render(
      <LangProvider lang={lang}>
        <ResultCollectionEnvelopeView view={view} />
      </LangProvider>,
    )
    expect(container.innerHTML).not.toContain(SENTINEL_PREFIX)
    expect(container.innerHTML).not.toContain('MARKET_B')
    expect(container.innerHTML).toContain(NON_CANONICAL_LABEL)
  })

  it.each(OPAQUE_SOURCE_UNITS)(
    'renders no token-shaped source text from any free-text field in %s',
    (_name, fixture) => {
      const view = unitResultView(decodeUnitResult(fixture.document))
      const { container } = renderUnit(view)
      expect(container.innerHTML).not.toContain(OPAQUE_SOURCE_PREFIX)
    },
  )

  it('renders no token-shaped source text from any COLLECTION free-text field', () => {
    const view = collectionResultView(decodeCollectionResult(OPAQUE_SOURCE_COLLECTION.document))
    const { container } = render(
      <LangProvider lang="zh">
        <ResultCollectionEnvelopeView view={view} />
      </LangProvider>,
    )
    expect(container.innerHTML).not.toContain(OPAQUE_SOURCE_PREFIX)
  })

  // The specific case the rejection named, kept as its own test so it cannot be lost in a
  // refactor of the general one.
  it('rejects arbitrary producer prose in missing_reason before display', () => {
    const document = clone(ITEM_DOCUMENT)
    for (const domain of document.evidence_domains as Record<string, unknown>[]) {
      domain.strength = 'UNAVAILABLE'
      domain.missing_reason = SENTINEL_PREFIX
    }
    expect(() => decodeUnitResult(sealed(document))).toThrow()
  })

  it('renders a controlled missing-reason code through the localization table', () => {
    const document = clone(ITEM_DOCUMENT)
    for (const domain of document.evidence_domains as Record<string, unknown>[]) {
      domain.strength = 'UNAVAILABLE'
      domain.missing_reason = 'UNAVAILABLE_BY_DESIGN'
    }
    const { container } = renderUnit(unitResultView(decodeUnitResult(sealed(document))))
    expect(screen.getAllByTestId('result-missing-reason').length).toBe(3)
    expect(container).toHaveTextContent('UNAVAILABLE_BY_DESIGN')
    expect(container).toHaveTextContent('当前数据分支按设计不提供')
  })

  it('shows only a non-reversible fingerprint when an identifier has the opaque-token shape', () => {
    const view = unitResultView(ITEM)
    expect(tokenText(view.identity.analysis_unit_id)).toBe(
      tokenText(displayToken('item:42:phase-p2')),
    )
    expect(tokenText(view.identity.analysis_unit_id)).not.toContain('item:42:phase-p2')
    const document = clone(ITEM_DOCUMENT)
    ;(document.identity as Record<string, unknown>).analysis_unit_id = 'item 42 <b>bold</b>'
    const hostile = unitResultView(decodeUnitResult(sealed(document)))
    expect(tokenText(hostile.identity.analysis_unit_id)).toBe(NON_CANONICAL_LABEL)
  })

  it.each(['MARKET_B', 'MARKET_D', 'MARKET_A', '市场 C'])(
    'does not render the source name %s when a producer puts it in a schema-valid identifier',
    (sourceName) => {
      const document = clone(ITEM_DOCUMENT)
      ;(document.identity as Record<string, unknown>).analysis_unit_id = sourceName
      const view = unitResultView(decodeUnitResult(sealed(document)))
      const { container } = renderUnit(view)
      expect(container.textContent).not.toContain(sourceName)
    },
  )
})

// The other half of RC-O03's guarantee. Everything above proves that free text carried by a
// *decoded envelope* stops at the adapter. That leaves the way round the adapter: a plain object
// with the right keys is a structurally perfect view, and TypeScript is happy to see one where a
// view is expected once anything casts. So the view boundary is nominal and frozen too, and the
// registry behind it is not the envelope registry - a view is not an envelope and must not pass
// for one in either direction.
describe('the formal components take adapter output and nothing that merely resembles it', () => {
  it('freezes the view it returns, all the way down', () => {
    const view = unitResultView(ITEM)
    expect(Object.isFrozen(view)).toBe(true)
    expect(Object.isFrozen(view.identity)).toBe(true)
    expect(Object.isFrozen(view.evidence_domains)).toBe(true)
    expect(Object.isFrozen(view.evidence_domains[0])).toBe(true)
    expect(Object.isFrozen(view.absent.pool_tier)).toBe(true)
    expect(() => {
      ;(view.identity as { display_name: string }).display_name = 'rewritten'
    }).toThrow(TypeError)
    expect(view.identity.display_name).toBe(ITEM.identity.display_name)
  })

  it('freezes the collection view it returns, all the way down', () => {
    const view = collectionResultView(COLLECTION)
    expect(Object.isFrozen(view)).toBe(true)
    expect(Object.isFrozen(view.accounting)).toBe(true)
    expect(Object.isFrozen(view.accounting.member_result_ids)).toBe(true)
    expect(() => {
      ;(view.accounting as { member_count: number }).member_count = 99
    }).toThrow(TypeError)
  })

  // The named regression. `{ kind: 'TOKEN', value: 'MARKET_B' }` is a well-formed DisplayToken whose
  // value is a source name, and a spread of a real view carrying it satisfies every structural
  // requirement the component states. The only thing standing between it and the DOM is that
  // the object was not built by the adapter.
  it('refuses a spread of a real view whose identity token was rewritten to a source name', () => {
    const view = unitResultView(ITEM)
    const forged = {
      ...view,
      identity: { ...view.identity, analysis_unit_id: { kind: 'TOKEN', value: 'MARKET_B' } },
    } as unknown as PresentableUnitView
    // Structurally it is a view: the component's own prop type accepts it after the cast, and
    // the token reads back exactly as a real one would.
    expect(tokenText(forged.identity.analysis_unit_id)).toBe('MARKET_B')
    expect(() => renderUnit(forged)).toThrow(UnpresentableView)
    expect(document.body.innerHTML).not.toContain('MARKET_B')
  })

  it('refuses a forged collection view the same way', () => {
    const view = collectionResultView(COLLECTION)
    const forged = {
      ...view,
      collection_id: { kind: 'TOKEN', value: 'MARKET_B' },
    } as unknown as PresentableCollectionView
    expect(() =>
      render(
        <LangProvider lang="zh">
          <ResultCollectionEnvelopeView view={forged} />
        </LangProvider>,
      ),
    ).toThrow(UnpresentableView)
    expect(document.body.innerHTML).not.toContain('MARKET_B')
  })

  it('does not let a decoded envelope stand in for a view', () => {
    expect(isValidated(ITEM)).toBe(true)
    expect(isPresentable(ITEM)).toBe(false)
    expect(() => renderUnit(ITEM as unknown as PresentableUnitView)).toThrow(UnpresentableView)
  })

  it('does not let a view stand in for a decoded envelope', () => {
    const view = unitResultView(ITEM)
    expect(isPresentable(view)).toBe(true)
    expect(isValidated(view)).toBe(false)
    expect(() => unitResultView(view as unknown as typeof ITEM)).toThrow(UnvalidatedEnvelope)
  })

  it('preserves UNIT/COLLECTION kind in the validated runtime registry', () => {
    expect(() => unitResultView(COLLECTION as unknown as typeof ITEM)).toThrow(UnvalidatedEnvelope)
    expect(() => collectionResultView(ITEM as unknown as typeof COLLECTION)).toThrow(
      UnvalidatedEnvelope,
    )
  })

  it('preserves UNIT/COLLECTION kind in the presentable runtime registry', () => {
    const collection = collectionResultView(COLLECTION)
    expect(() => renderUnit(collection as unknown as PresentableUnitView)).toThrow(
      UnpresentableView,
    )

    const unit = unitResultView(ITEM)
    expect(() =>
      render(
        <LangProvider lang="zh">
          <ResultCollectionEnvelopeView view={unit as unknown as PresentableCollectionView} />
        </LangProvider>,
      ),
    ).toThrow(UnpresentableView)
  })

  it('names the boundary that refused, so the failure is readable', () => {
    expect(() => renderUnit({} as unknown as PresentableUnitView)).toThrow(
      /ResultUnitEnvelopeView was given a view that did not come from the result adapter/,
    )
  })
})
