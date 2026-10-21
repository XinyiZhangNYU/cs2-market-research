// Minimal rendering of a decoded formal envelope. Its props are the adapter's output types, so
// there is no path from raw JSON to the screen that skips the schema. This is a component and
// not a page: V1 cannot yet answer everything a product page asks, and adding a page would
// invite filling the difference with defaults.
import { renderClaimsZh } from '../contract/claims'
import {
  analysisUnitKindLabel,
  caseStatusLabel,
  coreDomainLabel,
  dataBranchLabel,
  dataStatusLabel,
  domainMissingReasonLabel,
  domainStrengthLabel,
  editionKindLabel,
  evidenceFlagLabel,
  itemCycleStageLabel,
  label,
  marketLevelRegimeLabel,
  marketTrendStageLabel,
  recommendationLabel,
  regimeRelationLabel,
  relativeStrengthLabel,
  sectorTrendStageLabel,
  signalStrengthLabel,
  tradeConfirmationLabel,
} from '../contract/labels'
import type { Field } from '../contract/provenance'
import {
  tokenText,
  type DisplayToken,
  type PresentableCollectionView,
  type PresentableUnitView,
  type ResultAbsentFields,
} from '../adapter/resultViewModel'
import type { WireState } from '../wire/types'
import { requirePresentable } from '../wire/validated'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { EnumChip } from './EnumChip'
import { FieldValue, NotProducedNote } from './FieldValue'

function AbsentList({ absent }: { absent: ResultAbsentFields }) {
  const lang = useLang()
  const entries = Object.entries(absent) as [string, Field<never>][]
  return (
    <section data-testid="result-absent">
      <h4>{t('resultAbsentTitle', lang)}</h4>
      <p className="scope-note">{t('resultAbsentNote', lang)}</p>
      <ul>
        {entries.map(([key, field]) => (
          <li key={key}>
            <code>{key}</code>
            <FieldValue field={field} render={() => null} />
            <NotProducedNote field={field} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Token({ token }: { token: DisplayToken }) {
  return <code data-testid="display-token">{tokenText(token)}</code>
}

function StateChips({ state }: { state: WireState }) {
  const lang = useLang()
  return (
    <div data-testid="result-state">
      {'cycle_stage' in state ? (
        <EnumChip
          machine={state.cycle_stage}
          label={label(itemCycleStageLabel, state.cycle_stage, lang)}
        />
      ) : null}
      {'level_regime' in state ? (
        <>
          <EnumChip
            machine={state.trend_stage}
            label={label(marketTrendStageLabel, state.trend_stage, lang)}
          />
          <EnumChip
            machine={state.level_regime}
            label={label(marketLevelRegimeLabel, state.level_regime, lang)}
          />
        </>
      ) : null}
      {'relative_strength' in state ? (
        <>
          <EnumChip
            machine={state.trend_stage}
            label={label(sectorTrendStageLabel, state.trend_stage, lang)}
          />
          <EnumChip
            machine={state.relative_strength}
            label={label(relativeStrengthLabel, state.relative_strength, lang)}
          />
        </>
      ) : null}
      <EnumChip
        machine={state.recommendation}
        label={label(recommendationLabel, state.recommendation, lang)}
      />
      {state.case_status ? (
        <EnumChip
          machine={state.case_status}
          label={label(caseStatusLabel, state.case_status, lang)}
        />
      ) : null}
      {state.evidence_flags.map((flag) => (
        <EnumChip key={flag} machine={flag} label={label(evidenceFlagLabel, flag, lang)} />
      ))}
      {'regime_relation' in state
        ? state.regime_relation.map((relation) => (
            <EnumChip
              key={relation}
              machine={relation}
              label={label(regimeRelationLabel, relation, lang)}
            />
          ))
        : null}
      <code>input_snapshot_hash={state.input_snapshot_hash.slice(0, 12)}…</code>
    </div>
  )
}

// The props type can only be produced by the adapter, and the runtime check is what survives a
// cast. Both are needed: without the type a caller wanders in with raw JSON, and without the
// check `plainObject as PresentableUnitView` walks straight past the type.
export function ResultUnitEnvelopeView({ view }: { view: PresentableUnitView }) {
  requirePresentable(view, 'ResultUnitEnvelopeView', 'UNIT_VIEW')
  const lang = useLang()
  const { identity } = view
  return (
    <section
      className="result-envelope"
      data-testid="result-unit"
      data-contract="research-result-envelope/v1"
      data-analysis-unit={tokenText(identity.analysis_unit_id)}
    >
      <h3>{t('resultEnvelopeTitle', lang)}</h3>
      <p className="scope-note">{t('resultContractNote', lang)}</p>

      <h4>{t('resultIdentityTitle', lang)}</h4>
      <div data-testid="result-identity">
        <Token token={identity.analysis_unit_id} />
        <EnumChip machine={identity.scope_kind} />
        {identity.analysis_unit_kind ? (
          <EnumChip
            machine={identity.analysis_unit_kind}
            label={label(analysisUnitKindLabel, identity.analysis_unit_kind, lang)}
          />
        ) : null}
        {identity.edition_kind ? (
          <EnumChip
            machine={identity.edition_kind}
            label={label(editionKindLabel, identity.edition_kind, lang)}
          />
        ) : null}
        <code>catalog_version=</code>
        <Token token={identity.catalog_version} />
        <code>identity_available_at={identity.identity_available_at}</code>
      </div>
      <p className="scope-note" data-testid="result-free-text-note">
        {t('resultDisplayNameNote', lang)}
      </p>
      <div data-testid="result-parent">
        <code>parent_analysis_unit_id</code>
        {identity.parent_analysis_unit_id ? (
          <Token token={identity.parent_analysis_unit_id} />
        ) : (
          <code>NONE</code>
        )}
      </div>

      <h4>{t('resultStateTitle', lang)}</h4>
      <StateChips state={view.state} />

      <h4>{t('resultRecommendationTitle', lang)}</h4>
      {view.recommendation_detail ? (
        <div data-testid="result-recommendation">
          <EnumChip
            machine={view.recommendation_detail.recommendation}
            label={label(recommendationLabel, view.recommendation_detail.recommendation, lang)}
          />
          <EnumChip
            machine={view.recommendation_detail.signal_strength}
            label={label(signalStrengthLabel, view.recommendation_detail.signal_strength, lang)}
          />
          <EnumChip
            machine={view.recommendation_detail.trade_confirmation}
            label={label(
              tradeConfirmationLabel,
              view.recommendation_detail.trade_confirmation,
              lang,
            )}
          />
          <code>evidence_coverage={view.recommendation_detail.evidence_coverage}</code>
        </div>
      ) : (
        <p className="scope-note" data-testid="result-recommendation-by-design">
          {t('resultRecommendationByDesign', lang)}
        </p>
      )}

      <h4>{t('resultDomainsTitle', lang)}</h4>
      <div className="domains" data-testid="result-domains">
        {view.evidence_domains.map((domain) => (
          <section className="domain" key={domain.domain}>
            <h5>
              <code>{domain.domain}</code> {label(coreDomainLabel, domain.domain, lang)}
            </h5>
            <EnumChip
              machine={domain.strength}
              label={label(domainStrengthLabel, domain.strength, lang)}
            />
            {domain.missing_reason !== null ? (
              <p className="domain__reason" data-testid="result-missing-reason">
                <EnumChip
                  machine={domain.missing_reason}
                  label={label(domainMissingReasonLabel, domain.missing_reason, lang)}
                />
              </p>
            ) : (
              <ul className="domain__keys">
                {domain.contributing_feature_keys.map((key, index) => (
                  <li key={`${tokenText(key)}:${index}`}>
                    <Token token={key} />
                  </li>
                ))}
              </ul>
            )}
            <p className="muted">
              <code>policy_version=</code>
              <Token token={domain.policy_version} />
            </p>
          </section>
        ))}
      </div>

      <h4>{t('resultClaimsTitle', lang)}</h4>
      <ul className="claims" data-testid="result-claims">
        {renderClaimsZh(view.header.data_branch, view.claims).map((text, index) => (
          <li key={view.claims[index]}>
            <code>{view.claims[index]}</code>
            {lang === 'zh' ? (
              <span>{text}</span>
            ) : (
              <span className="not-produced">
                <code>NOT_PRODUCED / CONTRACT_PROPOSAL</code>
                <em>{t('claimRenderingUndefined', lang)}</em>
              </span>
            )}
          </li>
        ))}
        {view.claims.length === 0 ? <li className="muted">{t('noClaims', lang)}</li> : null}
      </ul>

      <AbsentList absent={view.absent} />
    </section>
  )
}

export function ResultCollectionEnvelopeView({ view }: { view: PresentableCollectionView }) {
  requirePresentable(view, 'ResultCollectionEnvelopeView', 'COLLECTION_VIEW')
  const lang = useLang()
  const { accounting } = view
  return (
    <section
      className="result-envelope"
      data-testid="result-collection"
      data-contract="research-result-envelope/v1"
      data-collection={tokenText(view.collection_id)}
    >
      <h3>{t('resultEnvelopeTitle', lang)}</h3>
      <p className="scope-note">{t('resultContractNote', lang)}</p>

      <div data-testid="result-collection-header">
        <Token token={view.collection_id} />
        <EnumChip machine={view.scope_kind} />
        <EnumChip
          machine={view.data_branch}
          label={label(dataBranchLabel, view.data_branch, lang)}
        />
        <EnumChip
          machine={view.data_status}
          label={label(dataStatusLabel, view.data_status, lang)}
        />
        <code>as_of={view.as_of}</code>
        <code>available_at={view.available_at}</code>
      </div>
      <p className="scope-note">{t('resultAsOfNote', lang)}</p>

      <h4>{t('resultAccountingTitle', lang)}</h4>
      <p className="scope-note">{t('resultAccountingNote', lang)}</p>
      <dl data-testid="result-accounting">
        <div>
          <dt>
            <code>member_count</code>
          </dt>
          <dd>{accounting.member_count}</dd>
        </div>
        <div>
          <dt>
            <code>returned_member_count</code>
          </dt>
          <dd>{accounting.returned_member_count}</dd>
        </div>
        <div>
          <dt>
            <code>missing_member_ids</code>
          </dt>
          <dd>
            {accounting.missing_member_ids.length === 0 ? (
              <span className="muted">0</span>
            ) : (
              <ul>
                {accounting.missing_member_ids.map((id, index) => (
                  <li key={`${tokenText(id)}:${index}`}>
                    <Token token={id} />
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div>
          <dt>
            <code>unavailable_member_ids</code>
          </dt>
          <dd>
            {accounting.unavailable_member_ids.length === 0 ? (
              <span className="muted">0</span>
            ) : (
              <ul>
                {accounting.unavailable_member_ids.map((id, index) => (
                  <li key={`${tokenText(id)}:${index}`}>
                    <Token token={id} />
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>

      <AbsentList absent={view.absent} />
    </section>
  )
}
