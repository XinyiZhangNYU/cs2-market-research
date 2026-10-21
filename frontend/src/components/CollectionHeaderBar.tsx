import type { ReactNode } from 'react'
import type { CollectionHeader, VersionContext } from '../contract/types'
import type { DerivedFromMembers } from '../contract/provenance'
import { dataStatusLabel, label } from '../contract/labels'
import { useLang } from '../i18n'
import { t, tf } from '../i18n/strings'
import { EnumChip } from './EnumChip'
import { FieldValue, NotProducedNote } from './FieldValue'

function MemberDistributionValue<T>({
  distribution,
  renderValue,
}: {
  distribution: DerivedFromMembers<T>
  renderValue: (value: T) => ReactNode
}) {
  const lang = useLang()
  if (distribution.reported_count === 0) return '—'
  const unanimous = distribution.buckets.length === 1
  return (
    <>
      {unanimous ? (
        <span className="member-unanimous" data-testid="member-unanimous">
          {tf('memberUnanimous', lang, { reported: distribution.reported_count })}
        </span>
      ) : null}
      {distribution.buckets.map((bucket, index) => (
        <span
          className="member-bucket"
          key={index}
          data-count={bucket.count}
        >
          {renderValue(bucket.value)}
          {unanimous ? null : <code className="member-bucket__count">× {bucket.count}</code>}
        </span>
      ))}
    </>
  )
}

export function CollectionHeaderBar({ header }: { header: CollectionHeader }) {
  const lang = useLang()
  return (
    <section
      className="scope-header scope-header--collection"
      data-testid="collection-header"
      data-envelope="COLLECTION"
      data-collection={header.collection_id}
    >
      <div
        className="collection-panel collection-panel--derived"
        data-testid="member-summary"
        data-provenance="DERIVED_FROM_MEMBERS"
      >
        <h3 className="collection-panel__title">
          {t('memberSummaryTitle', lang)}
          <code data-testid="derived-badge">DERIVED_FROM_MEMBERS</code>
        </h3>
        <dl>
          <div>
            <dt>{t('collectionMembers', lang)}</dt>
            <dd>
              <code>{header.member_count}</code>
            </dd>
          </div>
          <div data-testid="member-available-at">
            <dt>{t('memberAvailableAt', lang)}</dt>
            <dd>
              {header.member_available_at === null ? (
                '—'
              ) : (
                <code>
                  {header.member_available_at.earliest} … {header.member_available_at.latest}
                </code>
              )}
            </dd>
          </div>
          <div data-testid="member-data-status">
            <dt>{t('memberDataStatus', lang)}</dt>
            <dd>
              <MemberDistributionValue
                distribution={header.member_data_status}
                renderValue={(status) => (
                  <EnumChip
                    machine={status}
                    label={label(dataStatusLabel, status, lang)}
                  />
                )}
              />
            </dd>
          </div>
          <div data-testid="member-data-branch">
            <dt>{t('memberDataBranch', lang)}</dt>
            <dd>
              <MemberDistributionValue
                distribution={header.member_data_branch}
                renderValue={(branch) => <EnumChip machine={branch} />}
              />
            </dd>
          </div>
          <div data-testid="member-versions">
            <dt>{t('memberAlgorithmVersion', lang)}</dt>
            <dd>
              <MemberDistributionValue
                distribution={header.member_versions}
                renderValue={(versions: VersionContext) => (
                  <code>{versions.algorithm_version}</code>
                )}
              />
            </dd>
          </div>
        </dl>
        <p className="scope-header__distinction">{t('memberSummaryNote', lang)}</p>
      </div>

      <div
        className="collection-panel collection-panel--contract"
        data-testid="collection-provenance"
      >
        <h3 className="collection-panel__title">{t('collectionProvenanceTitle', lang)}</h3>
        <dl>
          <div>
            <dt>
              <code>collection as_of</code>
            </dt>
            <dd>
              <FieldValue field={header.as_of} render={(value) => <code>{value}</code>} />
            </dd>
          </div>
          <div>
            <dt>
              <code>collection available_at</code>
            </dt>
            <dd>
              <FieldValue field={header.available_at} render={(value) => <code>{value}</code>} />
            </dd>
          </div>
          <div>
            <dt>
              <code>collection data_status</code>
            </dt>
            <dd>
              <FieldValue
                field={header.data_status}
                render={(value) => (
                  <EnumChip machine={value} label={label(dataStatusLabel, value, lang)} />
                )}
              />
            </dd>
          </div>
          <div>
            <dt>
              <code>collection data_branch</code>
            </dt>
            <dd>
              <FieldValue field={header.data_branch} render={(value) => <EnumChip machine={value} />} />
            </dd>
          </div>
          <div>
            <dt>
              <code>collection versions</code>
            </dt>
            <dd>
              <FieldValue
                field={header.versions}
                render={(value) => <code>{value.algorithm_version}</code>}
              />
            </dd>
          </div>
        </dl>
        <p className="scope-header__distinction">{t('collectionDistinction', lang)}</p>
        <NotProducedNote field={header.as_of} />
      </div>
    </section>
  )
}
