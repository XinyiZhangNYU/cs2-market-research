import type { ScopeHeader } from '../contract/types'
import { dataBranchLabel, dataStatusLabel, label } from '../contract/labels'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'
import { EnumChip } from './EnumChip'
import { FieldValue, NotProducedNote } from './FieldValue'

export function ScopeHeaderBar({ header }: { header: ScopeHeader }) {
  const lang = useLang()
  return (
    <section
      className="scope-header"
      data-testid="scope-header"
      data-envelope="SINGLE"
      data-collection={header.analysis_unit_id}
    >
      <dl>
        <div>
          <dt>
            <code>as_of</code> {t('asOfTitle', lang)}
          </dt>
          <dd>
            <FieldValue field={header.as_of} render={(v) => <code>{v}</code>} />
          </dd>
        </div>
        <div>
          <dt>
            <code>available_at</code> {t('availableAtTitle', lang)}
          </dt>
          <dd>
            <code>{header.available_at}</code>
          </dd>
        </div>
        <div>
          <dt>{t('dataBranch', lang)}</dt>
          <dd>
            <EnumChip
              machine={header.data_branch}
              label={label(dataBranchLabel, header.data_branch, lang)}
            />
          </dd>
        </div>
        <div>
          <dt>{t('dataQualityStatus', lang)}</dt>
          <dd>
            <EnumChip
              machine={header.data_status}
              label={label(dataStatusLabel, header.data_status, lang)}
            />
          </dd>
        </div>
        <div>
          <dt>{t('algorithmVersion', lang)}</dt>
          <dd>
            <code>{header.versions.algorithm_version}</code>
          </dd>
        </div>
        <div>
          <dt>{t('parameterVersion', lang)}</dt>
          <dd>
            <code>{header.versions.parameter_set_version}</code>
          </dd>
        </div>
      </dl>
      <p className="scope-header__distinction">{t('timeDistinction', lang)}</p>
      <NotProducedNote field={header.as_of} />
    </section>
  )
}
