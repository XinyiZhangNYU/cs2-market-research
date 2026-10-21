import { useMemo, useState } from 'react'
import { unitResultView, type PresentableUnitView } from '../adapter/resultViewModel'
import {
  FormalResultReadApi,
  type FormalResultReadGateway,
} from '../api/FormalResultReadApi'
import {
  dataStatusLabel,
  itemCycleStageLabel,
  label,
  recommendationLabel,
  signalStrengthLabel,
} from '../contract/labels'
import type { EditionKind } from '../contract/identity'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { PublicInstant } from './PublicInstant'

type ResearchResultRead =
  | Readonly<{
      kind: 'READY'
      view: PresentableUnitView
      asOf: string
      availableAt: string
      publishedAt: string
    }>
  | Readonly<{ kind: 'CONTROLLED_ABSENCE' }>
  | Readonly<{ kind: 'CONTROLLED_ERROR'; retryable: boolean }>

function evidenceCoverage(value: string): string {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? `${(parsed * 100).toFixed(0)}%` : '—'
}

export function CatalogUnitResearchResultPanel({
  gateway,
  analysisUnitId,
  expectedEdition,
  queryAsOf,
  catalogSnapshotId,
}: {
  gateway: FormalResultReadGateway
  analysisUnitId: string
  expectedEdition: EditionKind
  queryAsOf: string
  catalogSnapshotId: string
}) {
  const lang = useLang()
  const api = useMemo(() => new FormalResultReadApi(gateway), [gateway])
  const [attempt, setAttempt] = useState(0)
  const read = useAsync<ResearchResultRead>(async (signal) => {
    const response = await api.getUnit(
      { analysis_unit_id: analysisUnitId, as_of: queryAsOf },
      { signal },
    )
    if (response.response_kind === 'ERROR') {
      return response.error.code === 'NOT_FOUND'
        ? Object.freeze({ kind: 'CONTROLLED_ABSENCE' })
        : Object.freeze({ kind: 'CONTROLLED_ERROR', retryable: response.error.retryable })
    }

    const envelope = response.resource.envelope
    if (
      envelope.identity.scope_kind !== 'ITEM' ||
      envelope.identity.edition_kind !== expectedEdition ||
      !('cycle_stage' in envelope.state)
    ) {
      throw new TypeError('catalog selection and formal item result identity disagree')
    }
    return Object.freeze({
      kind: 'READY',
      view: unitResultView(envelope),
      asOf: envelope.as_of,
      availableAt: envelope.available_at,
      publishedAt: response.resource.storage.published_at,
    })
  }, [analysisUnitId, api, attempt, expectedEdition, queryAsOf])

  if (read.status === 'loading') {
    return (
      <section
        className="formal-unit-research formal-unit-research--state"
        data-testid="catalog-unit-research-result"
        data-result-state="LOADING"
        data-analysis-unit={analysisUnitId}
        data-catalog-snapshot={catalogSnapshotId}
        role="status"
      >
        <header>
          <h2>{t('publicResearchTitle', lang)}</h2>
          <span>{t('publicResearchLoading', lang)}</span>
        </header>
      </section>
    )
  }

  if (read.status === 'error') {
    return (
      <section
        className="formal-unit-research formal-unit-research--state"
        data-testid="catalog-unit-research-result"
        data-result-state="UNAVAILABLE"
        data-analysis-unit={analysisUnitId}
        data-catalog-snapshot={catalogSnapshotId}
        role="alert"
      >
        <header>
          <h2>{t('publicResearchTitle', lang)}</h2>
          <span>{t('publicResearchUnavailable', lang)}</span>
        </header>
        <p>{t('publicResearchUnavailableNote', lang)}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          {t('publicResearchRetry', lang)}
        </button>
      </section>
    )
  }

  if (read.value.kind === 'CONTROLLED_ERROR') {
    return (
      <section
        className="formal-unit-research formal-unit-research--state"
        data-testid="catalog-unit-research-result"
        data-result-state="UNAVAILABLE"
        data-analysis-unit={analysisUnitId}
        data-catalog-snapshot={catalogSnapshotId}
        role="alert"
      >
        <header>
          <h2>{t('publicResearchTitle', lang)}</h2>
          <span>{t('publicResearchUnavailable', lang)}</span>
        </header>
        <p>{t('publicResearchUnavailableNote', lang)}</p>
        {read.value.retryable ? (
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            {t('publicResearchRetry', lang)}
          </button>
        ) : null}
      </section>
    )
  }

  if (read.value.kind === 'CONTROLLED_ABSENCE') {
    return (
      <section
        className="formal-unit-research formal-unit-research--state"
        data-testid="catalog-unit-research-result"
        data-result-state="NOT_PUBLISHED"
        data-analysis-unit={analysisUnitId}
        data-catalog-snapshot={catalogSnapshotId}
        role="status"
      >
        <header>
          <h2>{t('publicResearchTitle', lang)}</h2>
          <span>{t('publicResearchPending', lang)}</span>
        </header>
        <p>{t('publicResearchPendingNote', lang)}</p>
      </section>
    )
  }

  const { view, asOf, availableAt, publishedAt } = read.value
  const state = view.state
  if (!('cycle_stage' in state)) {
    throw new TypeError('formal catalog research result must carry an item cycle stage')
  }
  return (
    <section
      className="formal-unit-research"
      data-testid="catalog-unit-research-result"
      data-result-state="READY"
      data-analysis-unit={analysisUnitId}
      data-catalog-snapshot={catalogSnapshotId}
    >
      <header>
        <h2>{t('publicResearchTitle', lang)}</h2>
        <span>{t('publicResearchReady', lang)}</span>
      </header>
      <dl className="formal-unit-research__summary">
        <div>
          <dt>{t('publicResearchStage', lang)}</dt>
          <dd>{label(itemCycleStageLabel, state.cycle_stage, lang)}</dd>
        </div>
        <div>
          <dt>{t('publicResearchConclusion', lang)}</dt>
          <dd>{label(recommendationLabel, state.recommendation, lang)}</dd>
        </div>
        <div>
          <dt>{t('publicResearchDataStatus', lang)}</dt>
          <dd>{label(dataStatusLabel, view.header.data_status, lang)}</dd>
        </div>
        {view.recommendation_detail ? (
          <div>
            <dt>{t('publicResearchEvidence', lang)}</dt>
            <dd>
              {label(signalStrengthLabel, view.recommendation_detail.signal_strength, lang)} ·{' '}
              {evidenceCoverage(view.recommendation_detail.evidence_coverage)}
            </dd>
          </div>
        ) : null}
      </dl>
      <details className="formal-unit-research__timing">
        <summary>{t('publicResearchTiming', lang)}</summary>
        <dl>
          <div>
            <dt>{t('publicResearchAsOf', lang)}</dt>
            <dd><PublicInstant value={asOf} testId="research-result-as-of" /></dd>
          </div>
          <div>
            <dt>{t('publicKnownTime', lang)}</dt>
            <dd><PublicInstant value={availableAt} testId="research-result-available-at" /></dd>
          </div>
          <div>
            <dt>{t('publicResearchPublished', lang)}</dt>
            <dd><PublicInstant value={publishedAt} testId="research-result-published-at" /></dd>
          </div>
        </dl>
      </details>
    </section>
  )
}
