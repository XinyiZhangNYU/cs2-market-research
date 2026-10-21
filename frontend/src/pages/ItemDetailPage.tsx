import { researchApi } from '../api'
import { renderClaimsZh } from '../contract/claims'
import { itemDimensions } from '../contract/dimensions'
import { DomainStrength } from '../contract/enums'
import {
  EditionKind,
  QuerySampleState,
  ZERO_SAMPLE_NON_CONCLUSIONS,
} from '../contract/identity'
import {
  analysisUnitKindLabel,
  coreDomainLabel,
  dataStatusLabel,
  domainStrengthLabel,
  editionKindLabel,
  itemCycleStageLabel,
  label,
  querySampleStateLabel,
  sourceCapabilityStateLabel,
  transitionModeLabel,
  transitionReasonLabel,
  zeroSampleNonConclusionLabel,
} from '../contract/labels'
import { BranchBDisclosure } from '../components/BranchBDisclosure'
import { DimensionGrid } from '../components/DimensionGrid'
import { EnumChip } from '../components/EnumChip'
import { FieldValue, NotProducedNote } from '../components/FieldValue'
import { ItemImageSlot } from '../components/ItemImageSlot'
import { ScopeHeaderBar } from '../components/ScopeHeaderBar'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { useAsync } from '../hooks/useAsync'
import { UNIT_IDS } from '../mock/fixtures'

export function ItemDetailPage({
  analysisUnitId,
  onOpenItem,
  onReturnToBrowse,
}: {
  analysisUnitId: string
  onOpenItem: (id: string) => void
  onReturnToBrowse?: () => void
}) {
  const lang = useLang()
  const state = useAsync(
    () => researchApi().getItemDetail(analysisUnitId, lang),
    [analysisUnitId, lang],
  )
  if (state.status === 'error')
    return (
      <p className="loading">
        {t('unknownUnit', lang)}
        {analysisUnitId}
      </p>
    )
  if (state.status !== 'ready') return <p className="loading">{t('loading', lang)}</p>
  const detail = state.value

  return (
    <div className="page" data-testid="page-item">
      <h1>{t('pageItem', lang)}</h1>
      {onReturnToBrowse ? (
        <button type="button" data-testid="return-to-catalog-browse" onClick={onReturnToBrowse}>
          {t('returnToCatalogBrowse', lang)}
        </button>
      ) : null}

      <div className="item-switch">
        {UNIT_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={id === analysisUnitId ? 'is-active' : undefined}
            onClick={() => onOpenItem(id)}
          >
            {id}
          </button>
        ))}
      </div>

      <section className="item-hero" data-testid="item-hero">
        <ItemImageSlot
          source={detail.unit.image}
          label={detail.unit.display_name}
          variant="detail"
          testId={`item-image-${detail.unit.analysis_unit_id}-detail`}
        />
        <div className="item-hero__content">
          <h2>
            <code>{detail.unit.analysis_unit_id}</code> {detail.unit.display_name}
          </h2>
          <ScopeHeaderBar header={detail.header} />
        </div>
      </section>

      <h3>{t('identityTitle', lang)}</h3>
      <p className="scope-note">{t('identityNote', lang)}</p>
      <div data-testid="identity-projection">
        <EnumChip
          machine={detail.unit.analysis_unit_kind}
          label={label(analysisUnitKindLabel, detail.unit.analysis_unit_kind, lang)}
        />
        <EnumChip
          machine={detail.unit.edition_kind}
          label={label(editionKindLabel, detail.unit.edition_kind, lang)}
          tone={detail.unit.edition_kind === EditionKind.UNKNOWN ? 'warn' : 'neutral'}
        />
      </div>

      {detail.parent ? (
        <div data-testid="parent-context">
          <h4>{t('parentContextTitle', lang)}</h4>
          <p className="scope-note">{t('parentContextNote', lang)}</p>
          <button
            type="button"
            className="unit-link"
            onClick={() => onOpenItem(detail.parent!.analysis_unit_id)}
          >
            <code>{detail.parent.analysis_unit_id}</code>
          </button>
          <span>{detail.parent.display_name}</span>
        </div>
      ) : null}

      <h3>{t('querySampleTitle', lang)}</h3>
      <p className="scope-note">{t('querySampleNote', lang)}</p>
      <div data-testid="query-outcome">
        <EnumChip
          machine={detail.query_outcome.sample_state}
          label={label(querySampleStateLabel, detail.query_outcome.sample_state, lang)}
          tone={
            detail.query_outcome.sample_state === QuerySampleState.ZERO_CURRENT_SAMPLE
              ? 'warn'
              : 'neutral'
          }
        />
        <EnumChip
          machine={detail.query_outcome.capability_state}
          label={label(sourceCapabilityStateLabel, detail.query_outcome.capability_state, lang)}
        />
        <code>returned_member_count={detail.query_outcome.returned_member_count}</code>
        {detail.query_outcome.sample_state === QuerySampleState.ZERO_CURRENT_SAMPLE ? (
          <div data-testid="zero-sample-limits">
            <p>{t('zeroSampleMeans', lang)}</p>
            <ul>
              {ZERO_SAMPLE_NON_CONCLUSIONS.map((code) => (
                <li key={code}>
                  <code>{code}</code>
                  <span>{label(zeroSampleNonConclusionLabel, code, lang)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <h3>{t('sixDimensions', lang)}</h3>
      <DimensionGrid dimensions={itemDimensions(detail.state, lang)} />

      <h3>{t('recommendationAndTrade', lang)}</h3>
      <BranchBDisclosure recommendation={detail.recommendation} />

      <h3>{t('pdsDomains', lang)}</h3>
      <div className="domains">
        {detail.domains.map((domain) => (
          <section className="domain" key={domain.domain}>
            <h4>
              <code>{domain.domain}</code> {label(coreDomainLabel, domain.domain, lang)}
            </h4>
            <EnumChip
              machine={domain.strength}
              label={label(domainStrengthLabel, domain.strength, lang)}
              tone={
                domain.strength === DomainStrength.CONFLICTED ||
                domain.strength === DomainStrength.UNAVAILABLE
                  ? 'blocked'
                  : 'neutral'
              }
            />
            <EnumChip
              machine={domain.data_status}
              label={label(dataStatusLabel, domain.data_status, lang)}
            />
            {domain.missing_reason ? (
              <p className="domain__reason">{domain.missing_reason}</p>
            ) : (
              <ul className="domain__keys">
                {domain.contributing_feature_keys.map((key) => (
                  <li key={key}>
                    <code>{key}</code>
                  </li>
                ))}
              </ul>
            )}
            <p className="muted">
              <code>policy_version={domain.policy_version}</code>
            </p>
          </section>
        ))}
      </div>

      <h3>{t('availableClaims', lang)}</h3>
      <ul className="claims">
        {renderClaimsZh(detail.state.data_branch, detail.claims).map((text, index) => (
          <li key={detail.claims[index]}>
            <code>{detail.claims[index]}</code>
            {lang === 'zh' ? (
              <span>{text}</span>
            ) : (
              <span className="not-produced" data-testid="claim-rendering-undefined">
                <code>NOT_PRODUCED / CONTRACT_PROPOSAL</code>
                <em>{t('claimRenderingUndefined', lang)}</em>
              </span>
            )}
          </li>
        ))}
        {detail.claims.length === 0 ? <li className="muted">{t('noClaims', lang)}</li> : null}
      </ul>

      <h3>{t('tripleTitle', lang)}</h3>
      <div className="triple">
        <div>
          <h4>{t('supportingFactors', lang)}</h4>
          <FieldValue
            field={detail.supporting_factors}
            render={(items) => (
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          />
          <NotProducedNote field={detail.supporting_factors} />
        </div>
        <div>
          <h4>{t('primaryRisks', lang)}</h4>
          <FieldValue
            field={detail.primary_risks}
            render={(items) => (
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          />
          <NotProducedNote field={detail.primary_risks} />
        </div>
        <div>
          <h4>{t('invalidationConditions', lang)}</h4>
          <FieldValue
            field={detail.invalidation_conditions}
            render={(items) => (
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          />
          <NotProducedNote field={detail.invalidation_conditions} />
        </div>
      </div>

      <h3>{t('timeline', lang)}</h3>
      <ol className="timeline">
        {detail.transitions.map((transition) => (
          <li key={transition.input_snapshot_hash}>
            <code>{transition.available_at}</code>
            <span>
              <code>{transition.from_stage}</code>
              {' → '}
              <code>{transition.to_stage}</code>
            </span>
            <em>
              {label(itemCycleStageLabel, transition.from_stage, lang)} →{' '}
              {label(itemCycleStageLabel, transition.to_stage, lang)}
            </em>
            <EnumChip
              machine={transition.reason}
              label={label(transitionReasonLabel, transition.reason, lang)}
            />
            <EnumChip
              machine={transition.mode}
              label={label(transitionModeLabel, transition.mode, lang)}
            />
          </li>
        ))}
        {detail.transitions.length === 0 ? (
          <li className="muted">{t('noTransitions', lang)}</li>
        ) : null}
      </ol>

      <h3>{t('variantTitle', lang)}</h3>
      <p className="scope-note">{t('variantNote', lang)}</p>
      <dl className="variant">
        {Object.entries(detail.unit.variant_attributes).map(([key, value]) => (
          <div key={key}>
            <dt>
              <code>{key}</code>
            </dt>
            <dd>
              <code>{value}</code>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
