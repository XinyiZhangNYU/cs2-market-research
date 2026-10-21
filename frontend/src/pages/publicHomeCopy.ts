import type { Lang, Localized } from '../i18n'

const COPY = {
  marketKicker: { zh: '整体市场指数 · 30日', en: 'Whole-market index · 30D' },
  marketLoading: { zh: '正在读取指数…', en: 'Loading the index…' },
  marketUnavailable: { zh: '指数暂不可用', en: 'Index unavailable' },
  marketWindow: { zh: '近30日区间涨跌', en: '30-day window change' },
  marketGap: { zh: '30日区间', en: '30-day window' },
  marketDaily: { zh: '最新单日', en: 'Latest day' },
  marketLevel: { zh: '指数点位', en: 'Index level' },
  marketMembers: { zh: '成分饰品', en: 'Members' },
  dataThrough: { zh: '数据截至', en: 'Data through' },
  openMarket: { zh: '查看大盘', en: 'Open market' },
  sectorsTitle: { zh: '板块最新单日涨跌', en: 'Sectors · latest daily change' },
  sectorsLoading: { zh: '正在读取板块…', en: 'Loading sectors…' },
  sectorsUnavailable: { zh: '板块数据暂不可用', en: 'Sector data unavailable' },
  moversTitle: { zh: '30日涨幅前五', en: 'Top 30-day gainers' },
  moversLoading: { zh: '正在读取涨跌榜…', en: 'Loading movers…' },
  moversUnavailable: { zh: '涨跌榜暂不可用', en: 'Movers unavailable' },
  moversEmpty: { zh: '本期没有公开的涨幅条目', en: 'No published gainers in this edition' },
  moversWindow: { zh: '{start} 至 {end}', en: '{start} to {end}' },
  currentTitle: { zh: '单品观察', en: 'Item Monitor' },
  currentLoading: { zh: '正在读取观察榜…', en: 'Loading the monitor…' },
  currentUnavailable: { zh: '观察榜暂不可用', en: 'Item Monitor unavailable' },
  currentEmpty: { zh: '当前没有处于观察阶段的单品', en: 'No item is in a monitored stage now' },
  valveTitle: { zh: 'Valve 最新公告', en: 'Latest from Valve' },
  valveLoading: { zh: '正在读取公告…', en: 'Loading announcements…' },
  valveUnavailable: { zh: 'Valve 公告暂不可用', en: 'Valve announcements unavailable' },
  valveEmpty: { zh: '暂无公开公告', en: 'No public announcements yet' },
  valveNoSummary: { zh: '分析尚未发布', en: 'Analysis not published yet' },
  stale: { zh: '数据已滞后', en: 'Data delayed' },
  viewAll: { zh: '全部', en: 'View all' },
  retryHint: { zh: '可稍后刷新，或进入对应页面重新读取。', en: 'Refresh later, or open the page to read it again.' },
} as const satisfies Record<string, Localized>

export type PublicHomeStringKey = keyof typeof COPY

export function homeT(key: PublicHomeStringKey, lang: Lang): string {
  return COPY[key][lang]
}

export function homeTf(
  key: PublicHomeStringKey,
  lang: Lang,
  vars: Readonly<Record<string, string | number>>,
): string {
  return homeT(key, lang).replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value === undefined ? match : String(value)
  })
}
