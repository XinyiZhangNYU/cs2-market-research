import type { MouseEvent, ReactNode } from 'react'
import { useLang } from '../i18n'
import { formatDecimalWithIntl } from '../price/exactDisplayDecimal'
import { t, type StringKey } from '../i18n/strings'
import type {
  PublicResultErrorCode,
  PublicResultPublication,
} from '../wire/marketWatchlistPublicApiTypes'

export type PublicResultProblemCode = PublicResultErrorCode | 'TRANSPORT' | 'VALIDATION'

const PROBLEM_COPY = Object.freeze({
  INVALID_ARGUMENT: ['publicResultNotFoundTitle', 'publicResultNotFoundNote'],
  INVALID_CURSOR: ['publicResultNotFoundTitle', 'publicResultNotFoundNote'],
  NOT_PUBLISHED: ['publicResultNotPublishedTitle', 'publicResultNotPublishedNote'],
  NOT_FOUND: ['publicResultNotFoundTitle', 'publicResultNotFoundNote'],
  BACKEND_UNAVAILABLE: ['publicResultTemporaryTitle', 'publicResultTemporaryNote'],
  PUBLICATION_EXPIRED: ['publicResultExpiredTitle', 'publicResultExpiredNote'],
  PUBLICATION_WITHDRAWN: ['publicResultWithdrawnTitle', 'publicResultWithdrawnNote'],
  RESULT_CORRUPT: ['publicResultCorruptTitle', 'publicResultCorruptNote'],
  TRANSPORT: ['publicResultTemporaryTitle', 'publicResultTemporaryNote'],
  VALIDATION: ['publicResultCorruptTitle', 'publicResultCorruptNote'],
} satisfies Record<PublicResultProblemCode, readonly [StringKey, StringKey]>)

export function formatPublicInstant(value: string, lang: 'zh' | 'en'): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Decimal strings are rounded once, exactly; Number inputs keep the Number path. */
export function formatPublicRatio(value: string | number | null, lang: 'zh' | 'en'): string {
  if (value === null) return '—'
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return '—'
  return formatDecimalWithIntl(new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'auto',
  }), typeof value === 'string' ? value.trim() : value)
}

export function PublicResultLoading() {
  const lang = useLang()
  return (
    <div className="public-result-message public-result-message--loading" role="status">
      <span aria-hidden="true" />
      <p>{t('publicResultLoading', lang)}</p>
    </div>
  )
}

export function PublicResultProblem({
  code,
  onRetry,
  catalogHref,
  onCatalogClick,
}: {
  code: PublicResultProblemCode
  onRetry: () => void
  catalogHref: string
  onCatalogClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  const [title, note] = PROBLEM_COPY[code]
  return (
    <section className="public-result-message public-result-message--problem" role="status" data-error-code={code}>
      <p className="public-result-message__eyebrow">FORMAL RESULT</p>
      <h2>{t(title, lang)}</h2>
      <p>{t(note, lang)}</p>
      <div className="public-result-message__actions">
        <button type="button" onClick={onRetry}>{t('publicResultRetry', lang)}</button>
        <a href={catalogHref} onClick={onCatalogClick}>{t('publicResultBackCatalog', lang)}</a>
      </div>
    </section>
  )
}

export function PublicResultPublicationMeta({
  publication,
  extra,
}: {
  publication: PublicResultPublication
  extra?: ReactNode
}) {
  const lang = useLang()
  const stale = publication.freshness === 'STALE_RETAINED'
  return (
    <div className="public-result-publication" data-testid="public-result-publication">
      <div>
        <span>{t('publicResultAsOf', lang)}</span>
        <time dateTime={publication.result_as_of}>{formatPublicInstant(publication.result_as_of, lang)}</time>
      </div>
      <div>
        <span>{t('publicResultPublishedAt', lang)}</span>
        <time dateTime={publication.public_available_at}>{formatPublicInstant(publication.public_available_at, lang)}</time>
      </div>
      <div>
        <span>{t('publicResultCatalogAsOf', lang)}</span>
        <time dateTime={publication.catalog.as_of}>{formatPublicInstant(publication.catalog.as_of, lang)}</time>
      </div>
      <strong className={stale ? 'is-stale' : 'is-fresh'}>
        {t(stale ? 'publicResultStale' : 'publicResultFresh', lang)}
      </strong>
      {extra}
      {stale ? <p>{t('publicResultStaleNote', lang)}</p> : null}
    </div>
  )
}
