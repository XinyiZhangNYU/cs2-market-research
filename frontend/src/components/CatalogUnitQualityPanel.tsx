import { useMemo, useState } from 'react'
import { qualityResultView, type PresentableQualityView } from '../adapter/qualityViewModel'
import {
  FormalResultReadApi,
  type FormalResultReadGateway,
} from '../api/FormalResultReadApi'
import { useAsync } from '../hooks/useAsync'
import { useLang } from '../i18n'
import { t, tf } from '../i18n/strings'
import { PublicInstant } from './PublicInstant'

type QualityPanelResult =
  | Readonly<{ kind: 'READY'; view: PresentableQualityView; publishedAt: string }>
  | Readonly<{ kind: 'CONTROLLED_ABSENCE' }>
  | Readonly<{ kind: 'CONTROLLED_ERROR'; retryable: boolean }>

function percentage(value: string): string {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? `${(parsed * 100).toFixed(1)}%` : '—'
}

export function CatalogUnitQualityPanel({
  gateway,
  analysisUnitId,
  queryAsOf,
}: {
  gateway: FormalResultReadGateway
  analysisUnitId: string
  queryAsOf: string
}) {
  const lang = useLang()
  const api = useMemo(() => new FormalResultReadApi(gateway), [gateway])
  const [attempt, setAttempt] = useState(0)
  const read = useAsync<QualityPanelResult>(async (signal) => {
    const response = await api.getQuality(
      { analysis_unit_id: analysisUnitId, as_of: queryAsOf },
      { signal },
    )
    if (response.response_kind === 'ERROR') {
      return response.error.code === 'NOT_FOUND'
        ? Object.freeze({ kind: 'CONTROLLED_ABSENCE' })
        : Object.freeze({
            kind: 'CONTROLLED_ERROR',
            retryable: response.error.retryable,
          })
    }
    return Object.freeze({
      kind: 'READY',
      view: qualityResultView(response.resource.envelope),
      publishedAt: response.resource.storage.published_at,
    })
  }, [api, analysisUnitId, queryAsOf, attempt])

  if (read.status === 'loading') {
    return (
      <div className="formal-unit-quality__state" role="status" data-testid="formal-unit-quality-loading">
        <span>{t('publicDetailQuality', lang)}</span>
        <strong>{t('publicQualityLoading', lang)}</strong>
      </div>
    )
  }
  if (read.status === 'error') {
    return (
      <div className="formal-unit-quality__state" role="alert">
        <span>{t('publicDetailQuality', lang)}</span>
        <strong>{t('publicQualityReadUnavailable', lang)}</strong>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          {t('liveQualityRetry', lang)}
        </button>
      </div>
    )
  }
  if (read.value.kind === 'CONTROLLED_ABSENCE') {
    return (
      <div className="formal-unit-quality__state" role="status" data-testid="formal-unit-quality-absent">
        <span>{t('publicDetailQuality', lang)}</span>
        <strong>{t('publicQualityUnavailable', lang)}</strong>
        <small>{t('publicQualityMissingNote', lang)}</small>
      </div>
    )
  }
  if (read.value.kind === 'CONTROLLED_ERROR') {
    return (
      <div className="formal-unit-quality__state" role="alert">
        <span>{t('publicDetailQuality', lang)}</span>
        <strong>{t('publicQualityReadUnavailable', lang)}</strong>
        {read.value.retryable ? (
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            {t('liveQualityRetry', lang)}
          </button>
        ) : null}
      </div>
    )
  }

  const { view, publishedAt } = read.value
  return (
    <details className="formal-unit-quality" data-testid="formal-unit-quality">
      <summary>
        <span>{t('publicDetailQuality', lang)}</span>
        <strong>
          {tf('publicQualityCompactCoverage', lang, {
            coverage: percentage(view.aggregate.coverage_ratio),
            fresh: percentage(view.aggregate.fresh_coverage_ratio),
          })}
        </strong>
        <small>
          {tf('publicQualityCompactGaps', lang, {
            missing: view.aggregate.missing_cell_count,
            stale: view.aggregate.stale_cell_count,
          })}
        </small>
      </summary>
      <dl>
        <div>
          <dt>{t('publicSnapshotTime', lang)}</dt>
          <dd><PublicInstant value={view.as_of} testId="quality-result-as-of" /></dd>
        </div>
        <div>
          <dt>{t('publicKnownTime', lang)}</dt>
          <dd><PublicInstant value={view.available_at} testId="quality-result-available-at" /></dd>
        </div>
        <div>
          <dt>{t('publicPublishedTime', lang)}</dt>
          <dd><PublicInstant value={publishedAt} testId="quality-result-published-at" /></dd>
        </div>
      </dl>
    </details>
  )
}
