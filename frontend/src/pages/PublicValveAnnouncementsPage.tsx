import { useMemo, type MouseEventHandler } from 'react'
import { HttpValveEventsGateway } from '../api/HttpValveEventsGateway'
import type { ValveEventsGateway } from '../api/ValveEventsApi'
import { useLang } from '../i18n'
import { ValveEventsWorkspace } from './ValveEventsWorkspace'
import './publicValve.css'

export function PublicValveAnnouncementsPage({
  gateway,
  historyHref = '/valve/history',
  onHistoryClick,
}: {
  gateway?: ValveEventsGateway
  historyHref?: string
  onHistoryClick?: MouseEventHandler<HTMLAnchorElement>
}) {
  const source = useMemo(() => gateway ?? new HttpValveEventsGateway(), [gateway])
  const lang = useLang()
  return (
    <section className="public-valve-archive" data-testid="public-valve-page">
      <nav className="public-valve-switcher" aria-label={lang === 'zh' ? 'Valve 公告视图' : 'Valve announcement views'}>
        <span aria-current="page">{lang === 'zh' ? '最新公告' : 'Latest announcements'}</span>
        <a href={historyHref} onClick={onHistoryClick}>{lang === 'zh' ? '历史分析' : 'Analysis history'}</a>
      </nav>
      <ValveEventsWorkspace gateway={source} publicPresentation />
    </section>
  )
}
