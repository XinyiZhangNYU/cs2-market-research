import { useLang } from '../i18n'
import { t } from '../i18n/strings'

export type CatalogPitContext = Readonly<{
  data_environment: 'LIVE_LOCAL' | 'LIVE_PUBLIC'
  channel: 'LOCAL_REAL_PIT_CATALOG' | 'PUBLIC_REAL_PIT_CATALOG'
  query_as_of: string
  query_known_at: string
  snapshot: {
    snapshot_id: string
    catalog_version: string
    available_at: string
    member_count: number
    member_set_hash: string
  } | null
}>

function formatSnapshotInstant(value: string, lang: 'zh' | 'en'): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function CatalogPitContextBar({
  context,
  readState,
  presentation = 'TECHNICAL',
}: {
  context: CatalogPitContext
  readState: 'LOADING' | 'READY' | 'ERROR'
  presentation?: 'TECHNICAL' | 'PRODUCT'
}) {
  const lang = useLang()
  if (presentation === 'PRODUCT') {
    return (
      <section
        className="formal-data-context"
        data-testid="catalog-pit-context"
        data-data-environment={context.data_environment}
        data-read-state={readState}
      >
        <details>
          <summary>
            <span>{t('publicDataDetails', lang)}</span>
            <span className="formal-data-context__snapshot">
              <small>{t('publicSnapshotTime', lang)}</small>
              {context.snapshot ? (
                <time
                  dateTime={context.query_as_of}
                  data-testid="catalog-visible-snapshot-time"
                >
                  {formatSnapshotInstant(context.query_as_of, lang)}
                </time>
              ) : (
                <span>
                  {t(
                    readState === 'LOADING'
                      ? 'publicSnapshotLoading'
                      : 'publicSnapshotUnavailable',
                    lang,
                  )}
                </span>
              )}
            </span>
          </summary>
          <dl>
            <div>
              <dt>{t('publicSnapshotTime', lang)}</dt>
              <dd><time>{context.query_as_of}</time></dd>
            </div>
            <div>
              <dt>{t('publicKnownTime', lang)}</dt>
              <dd><time>{context.query_known_at}</time></dd>
            </div>
            {context.snapshot ? (
              <>
                <div>
                  <dt>{t('publicCatalogVersion', lang)}</dt>
                  <dd><code>{context.snapshot.catalog_version}</code></dd>
                </div>
                <div>
                  <dt>{t('publicCatalogMembers', lang)}</dt>
                  <dd>{context.snapshot.member_count}</dd>
                </div>
              </>
            ) : null}
          </dl>
        </details>
      </section>
    )
  }
  return (
    <section
      className="panel catalog-browse__pit"
      data-testid="catalog-pit-context"
      data-data-environment={context.data_environment}
      data-read-state={readState}
    >
      <strong>{context.data_environment}</strong>
      <code>{context.channel}</code>
      <span>
        {context.snapshot ? 'AS OF' : 'QUERY AS OF'}{' '}
        <code>{context.query_as_of}</code>
      </span>
      <span>
        {context.snapshot ? 'AVAILABLE AT' : 'KNOWN AT'}{' '}
        <code>{context.query_known_at}</code>
      </span>
      {context.snapshot ? (
        <>
          <span>
            SNAPSHOT <code>{context.snapshot.snapshot_id}</code>
          </span>
          <span>
            CATALOG <code>{context.snapshot.catalog_version}</code>
          </span>
          <span>
            MEMBERS <code>{context.snapshot.member_count}</code>
          </span>
        </>
      ) : null}
      <code>{readState}</code>
    </section>
  )
}
