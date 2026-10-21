import { Suspense, type ReactNode } from 'react'
import type { Lang } from '../i18n'
import { t } from '../i18n/strings'
import { PublicErrorBoundary } from './PublicErrorBoundary'

/** One kept-alive page. It stays mounted while hidden, so it has its own error boundary and its own
 * Suspense: a failure or a wait inside one page never replaces the page the reader is on. */
export function KeptAliveSurface({
  shown,
  active,
  lang,
  resetKey,
  children,
}: Readonly<{
  /** The current route's page; every other kept-alive page is hidden. */
  shown: boolean
  /** Shown, and not left behind by a pending navigation. */
  active: boolean
  lang: Lang
  /** This page's own route: a caught failure is retried when it changes. */
  resetKey: string
  children: ReactNode
}>) {
  return (
    <section hidden={!shown} aria-hidden={!shown}>
      <PublicErrorBoundary lang={lang} resetKey={resetKey} active={active}>
        <Suspense
          fallback={
            <div className="formal-site__module-loading" role="status">
              {t('publicLoadingSurface', lang)}
            </div>
          }
        >
          {children}
        </Suspense>
      </PublicErrorBoundary>
    </section>
  )
}
