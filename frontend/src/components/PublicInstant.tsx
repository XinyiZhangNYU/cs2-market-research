import { useMemo } from 'react'
import { useLang } from '../i18n'
import { t } from '../i18n/strings'

function localizedInstant(value: string, lang: 'zh' | 'en'): string {
  const instant = new Date(value)
  if (!Number.isFinite(instant.getTime())) {
    throw new TypeError('public instant must be valid date-time text')
  }
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).format(instant)
}

export function PublicInstant({
  value,
  testId,
}: {
  value: string
  testId?: string
}) {
  const lang = useLang()
  const localized = useMemo(() => localizedInstant(value, lang), [lang, value])
  return (
    <time
      className="public-instant"
      dateTime={value}
      data-testid={testId}
      title={t('publicLocalTime', lang)}
    >
      <span>{localized}</span>
      <small>
        {t('publicExactUtc', lang)} <code>{value}</code>
      </small>
    </time>
  )
}
