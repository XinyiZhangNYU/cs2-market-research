import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { qualityResultView, type PresentableQualityView } from '../src/adapter/qualityViewModel'
import { tokenText, displayToken } from '../src/adapter/resultViewModel'
import { QualityEnvelopeView } from '../src/components/QualityEnvelopeView'
import { LangProvider } from '../src/i18n'
import { snapshotIdOf } from '../src/wire/canonical'
import {
  decodeQualityResult,
  qualityViolationRule,
  validateQualityEnvelope,
} from '../src/wire/qualityDecode'
import {
  QUALITY_ENVELOPE_SCHEMA,
  QUALITY_ENVELOPE_SCHEMA_ID,
  qualitySchemaEnum,
  qualitySchemaRequired,
} from '../src/wire/qualitySchema'
import type {
  WireQualityConflictSummary,
  WireQualityQueryObservation,
  WireQualityResult,
  WireQualitySourceSummary,
} from '../src/wire/types'
import {
  isPresentable,
  isValidated,
  UnpresentableView,
} from '../src/wire/validated'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const EXAMPLE = join(ROOT, '..', 'schemas', 'examples', 'quality-item-style.valid.json')

function document(): Record<string, unknown> {
  return JSON.parse(readFileSync(EXAMPLE, 'utf8')) as Record<string, unknown>
}

function rehash(value: Record<string, unknown>): Record<string, unknown> {
  value.snapshot_id = snapshotIdOf(value)
  return value
}

const QUALITY = decodeQualityResult(document())

describe('the shared quality schema is the only structural contract', () => {
  it('registers the expected identity and accepts the producer example', () => {
    expect(QUALITY_ENVELOPE_SCHEMA.$id).toBe(QUALITY_ENVELOPE_SCHEMA_ID)
    expect(validateQualityEnvelope(document())).toBe(true)
    expect(snapshotIdOf(document())).toBe(document().snapshot_id)
  })

  const ROOT_FIELDS: Record<keyof WireQualityResult, true> = {
    snapshot_id: true,
    contract_code: true,
    contract_version: true,
    envelope_kind: true,
    identity: true,
    as_of: true,
    available_at: true,
    policy_version: true,
    input_quality_snapshot_id: true,
    expected_cell_count: true,
    observed_cell_count: true,
    fresh_cell_count: true,
    coverage_ratio: true,
    fresh_coverage_ratio: true,
    missing_cell_count: true,
    stale_cell_count: true,
    future_fact_count: true,
    source_summaries: true,
    conflicts: true,
    query_observations: true,
  }
  const SOURCE_FIELDS: Record<keyof WireQualitySourceSummary, true> = {
    source_ref: true,
    expected_feature_count: true,
    observed_feature_count: true,
    fresh_feature_count: true,
    missing_feature_count: true,
    stale_feature_count: true,
  }
  const CONFLICT_FIELDS: Record<keyof WireQualityConflictSummary, true> = {
    feature_key: true,
    reason_code: true,
    participating_source_refs: true,
    source_fact_count: true,
    relative_dispersion: true,
  }
  const QUERY_FIELDS: Record<keyof WireQualityQueryObservation, true> = {
    observation_id: true,
    source_ref: true,
    query_kind: true,
    sample_state: true,
    capability_state: true,
    returned_member_count: true,
    observed_at: true,
    available_at: true,
  }

  it.each([
    ['', ROOT_FIELDS],
    ['/$defs/source_summary', SOURCE_FIELDS],
    ['/$defs/conflict_summary', CONFLICT_FIELDS],
    ['/$defs/query_observation', QUERY_FIELDS],
  ] as const)('%s carries exactly the TypeScript fields', (pointer, fields) => {
    expect([...qualitySchemaRequired(pointer)].sort()).toEqual(Object.keys(fields).sort())
  })

  it('derives all query enums from the shared schema', () => {
    expect(qualitySchemaEnum('/$defs/query_observation/properties/query_kind')).toEqual([
      'BASE_QUOTE',
      'LISTING_PAGE',
      'STYLE_LISTING',
      'STYLE_BID',
      'MARKET_SNAPSHOT',
    ])
  })
})

describe('quality semantics stay exact and source-neutral', () => {
  it('seals a private immutable copy', () => {
    expect(isValidated(QUALITY, 'QUALITY')).toBe(true)
    expect(Object.isFrozen(QUALITY)).toBe(true)
    expect(Object.isFrozen(QUALITY.source_summaries)).toBe(true)
  })

  it.each([
    ['cell accounting', 'QUALITY_CELL_ACCOUNTING', (value: Record<string, unknown>) => {
      value.missing_cell_count = 0
    }],
    ['freshness accounting', 'QUALITY_FRESHNESS_ACCOUNTING', (value: Record<string, unknown>) => {
      value.stale_cell_count = 0
    }],
    ['ratio binding', 'QUALITY_RATIO_MATCH', (value: Record<string, unknown>) => {
      value.coverage_ratio = '0.5'
    }],
    ['source reconciliation', 'QUALITY_SOURCE_RECONCILIATION', (value: Record<string, unknown>) => {
      const rows = value.source_summaries as Record<string, unknown>[]
      rows[0].expected_feature_count = 3
      rows[0].missing_feature_count = 2
    }],
    ['canonical source order', 'QUALITY_CANONICAL_ORDER', (value: Record<string, unknown>) => {
      value.source_summaries = [...(value.source_summaries as unknown[])].reverse()
    }],
    ['query sample shape', 'QUALITY_QUERY_SHAPE', (value: Record<string, unknown>) => {
      const rows = value.query_observations as Record<string, unknown>[]
      rows[0].returned_member_count = 1
    }],
  ] as const)('rejects %s with an attributable rule', (_name, rule, mutate) => {
    const value = document()
    mutate(value)
    let actual: string | undefined
    try {
      decodeQualityResult(rehash(value))
    } catch (error) {
      actual = qualityViolationRule(error)
    }
    expect(actual).toBe(rule)
  })

  it('rejects arbitrary source-private top-level fields structurally', () => {
    const value = document()
    value.platform_price = 123
    expect(() => decodeQualityResult(rehash(value))).toThrow()
  })
})

describe('the formal quality view preserves the two zero-sample axes', () => {
  function renderQuality(view: PresentableQualityView) {
    return render(
      <LangProvider lang="zh">
        <QualityEnvelopeView view={view} />
      </LangProvider>,
    )
  }

  it('renders aggregate quality and fixed zero-sample semantics without raw source refs', () => {
    const view = qualityResultView(QUALITY)
    const { container } = renderQuality(view)
    expect(screen.getByTestId('quality-aggregate')).toHaveTextContent('coverage_ratio0.75')
    expect(screen.getByTestId('quality-queries')).toHaveTextContent('ZERO_CURRENT_SAMPLE')
    expect(screen.getByTestId('quality-queries')).toHaveTextContent('UNKNOWN')
    expect(screen.getByTestId('quality-zero-sample-note')).toHaveTextContent('本次无正样本')
    expect(screen.getByTestId('quality-zero-sample-note')).toHaveTextContent('不等于来源不支持')
    expect(container.innerHTML).not.toContain('source:primary')
    expect(container.innerHTML).not.toContain('source:backup')
    expect(container.innerHTML).not.toContain('MARKET_B')
  })

  it('projects the parent through the same irreversible identity boundary', () => {
    const view = qualityResultView(QUALITY)
    expect(tokenText(view.identity.parent_analysis_unit_id!)).toBe(
      tokenText(displayToken('item:42')),
    )
    renderQuality(view)
    expect(screen.getByTestId('quality-identity')).not.toHaveTextContent('item:42')
  })

  it('does not let a plain shape or another view kind cross the display boundary', () => {
    const view = qualityResultView(QUALITY)
    expect(isPresentable(view, 'QUALITY_VIEW')).toBe(true)
    const forged = { ...view } as unknown as PresentableQualityView
    expect(() => renderQuality(forged)).toThrow(UnpresentableView)
  })
})
