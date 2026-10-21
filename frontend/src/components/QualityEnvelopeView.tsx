import { tokenText, type DisplayToken } from '../adapter/resultViewModel'
import type { PresentableQualityView } from '../adapter/qualityViewModel'
import { requirePresentable } from '../wire/validated'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { EnumChip } from './EnumChip'

function Token({ token }: { token: DisplayToken }) {
  return <code data-testid="display-token">{tokenText(token)}</code>
}

export function QualityEnvelopeView({ view }: { view: PresentableQualityView }) {
  requirePresentable(view, 'QualityEnvelopeView', 'QUALITY_VIEW')
  const lang = useLang()
  return (
    <section
      className="result-envelope"
      data-testid="quality-envelope"
      data-contract="research-quality-envelope/v1"
      data-analysis-unit={tokenText(view.identity.analysis_unit_id)}
    >
      <h3>{t('qualityEnvelopeTitle', lang)}</h3>
      <p className="scope-note">{t('qualityContractNote', lang)}</p>

      <div data-testid="quality-identity">
        <Token token={view.identity.analysis_unit_id} />
        <EnumChip machine={view.identity.analysis_unit_kind ?? 'UNKNOWN'} />
        <EnumChip machine={view.identity.edition_kind ?? 'UNKNOWN'} />
        {view.identity.parent_analysis_unit_id ? (
          <Token token={view.identity.parent_analysis_unit_id} />
        ) : (
          <code>parent=NONE</code>
        )}
        <code>as_of={view.as_of}</code>
        <code>available_at={view.available_at}</code>
      </div>

      <h4>{t('qualityAggregateTitle', lang)}</h4>
      <dl data-testid="quality-aggregate">
        {Object.entries(view.aggregate).map(([name, value]) => (
          <div key={name}>
            <dt><code>{name}</code></dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <h4>{t('qualitySourcesTitle', lang)}</h4>
      <ul data-testid="quality-sources">
        {view.source_summaries.map((row, index) => (
          <li key={`${tokenText(row.source_ref)}:${index}`}>
            <Token token={row.source_ref} />
            <code>{row.fresh_feature_count}/{row.expected_feature_count}</code>
            <code>missing={row.missing_feature_count}</code>
            <code>stale={row.stale_feature_count}</code>
          </li>
        ))}
      </ul>

      <h4>{t('qualityConflictsTitle', lang)}</h4>
      <ul data-testid="quality-conflicts">
        {view.conflicts.map((row, index) => (
          <li key={`${tokenText(row.feature_key)}:${index}`}>
            <Token token={row.feature_key} />
            <Token token={row.reason_code} />
            <code>facts={row.source_fact_count}</code>
            {row.relative_dispersion === null ? null : (
              <code>dispersion={row.relative_dispersion}</code>
            )}
          </li>
        ))}
      </ul>

      <h4>{t('qualityQueriesTitle', lang)}</h4>
      <ul data-testid="quality-queries">
        {view.query_observations.map((row, index) => (
          <li key={`${tokenText(row.observation_id)}:${index}`}>
            <Token token={row.observation_id} />
            <Token token={row.source_ref} />
            <EnumChip machine={row.query_kind} />
            <EnumChip machine={row.sample_state} />
            <EnumChip machine={row.capability_state} />
            <code>returned={row.returned_member_count}</code>
            {row.sample_state === 'ZERO_CURRENT_SAMPLE' ? (
              <em data-testid="quality-zero-sample-note">{t('qualityZeroSampleNote', lang)}</em>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
