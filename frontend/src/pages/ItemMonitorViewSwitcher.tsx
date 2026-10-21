import type { MouseEvent } from 'react'
import { useLang } from '../i18n'
import { itemHistoryT } from './publicItemHistoryCopy'

const VIEW_LABEL = Object.freeze({ zh: '单品观察视图', en: 'Item monitor views' })

export function ItemMonitorViewSwitcher({ history, currentHref, historyHref, onCurrentClick, onHistoryClick }: {
  history: boolean
  currentHref: string
  historyHref: string
  onCurrentClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onHistoryClick: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const lang = useLang()
  return (
    <nav className="item-monitor-view-switcher" aria-label={VIEW_LABEL[lang]}>
      <a href={currentHref} aria-current={!history ? 'page' : undefined} className={!history ? 'is-active' : undefined} onClick={onCurrentClick}>
        {itemHistoryT('currentView', lang)}
      </a>
      <a href={historyHref} aria-current={history ? 'page' : undefined} className={history ? 'is-active' : undefined} onClick={onHistoryClick}>
        {itemHistoryT('historyView', lang)}
      </a>
    </nav>
  )
}
