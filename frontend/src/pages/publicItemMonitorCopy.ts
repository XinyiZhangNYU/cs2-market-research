import type { Lang, Localized } from '../i18n'

const COPY = {
  eyebrow: { zh: 'EXPERIMENTAL ITEM MONITOR', en: 'EXPERIMENTAL ITEM MONITOR' },
  title: { zh: '单品观察榜', en: 'Item Monitor' },
  intro: {
    zh: '展示系统当前识别到的实验性单品信号。',
    en: 'Experimental item signals currently identified by the system.',
  },
  disclosure: {
    zh: '实验性 · 效果尚未验证 · 可能出现误报；仅说明系统观察到什么，不构成正式状态、建议或价格预测。',
    en: 'Experimental · efficacy unvalidated · false positives possible. This reports what the system observed; it is not a formal state, recommendation, or price forecast.',
  },
  loading: { zh: '正在读取单品观察…', en: 'Loading item observations…' },
  retry: { zh: '重新读取', en: 'Try again' },
  catalog: { zh: '浏览商品目录', en: 'Browse Item Explorer' },
  current: { zh: '当前数据', en: 'Current data' },
  stale: { zh: '保留中的旧发布', en: 'Retained stale publication' },
  unavailable: { zh: '尚无完整观察期', en: 'Observation window unavailable' },
  published: { zh: '公开时间', en: 'Published' },
  publicationClockUnknown: { zh: '首次公开时间未精确记录', en: 'Initial public time not recorded exactly' },
  publicationClockLowerBound: { zh: '确认公开不早于', en: 'Confirmed public no earlier than' },
  dataDate: { zh: '观察数据日', en: 'Observation data day' },
  members: { zh: '本次观察单品', en: 'Observed items' },
  emptyInitialTitle: { zh: '尚无满足条件的完整观察', en: 'No qualified observation yet' },
  emptyInitialNote: {
    zh: '页面和读取链路已经就绪；系统仍在等待真实数据形成完整观察期，不会用历史或模拟内容填充。',
    en: 'The page and read path are ready. The system is waiting for a complete real-data observation window and will not fill it with historical or simulated content.',
  },
  emptyMeasuredTitle: { zh: '本次没有符合条件的单品', en: 'No eligible items in this publication' },
  emptyMeasuredNote: {
    zh: '本次观察已完成，但没有单品达到公开条件；这不是服务故障。',
    en: 'The observation completed, but no item met the public criteria. This is not a service failure.',
  },
  signalTime: { zh: '首次显示信号', en: 'Signal observed' },
  events: { zh: '本次信号', en: 'Current signals' },
  earlierEvents: { zh: '更早信号次数', en: 'Earlier signal events' },
  coverage: { zh: '数据覆盖', en: 'Data coverage' },
  missingRun: { zh: '最长连续缺口', en: 'Longest missing run' },
  open: { zh: '查看观察详情', en: 'View observation' },
  close: { zh: '返回观察榜', en: 'Back to Item Monitor' },
  product: { zh: '查看具体商品', en: 'View item' },
  firstEntry: { zh: '首次进入', en: 'First entry' },
  reentry: { zh: '再次进入', en: 'Re-entry' },
  supplyLead: { zh: '供给先行变化', en: 'Supply-leading change' },
  recentPersistent: { zh: '近期持续变化', en: 'Recent persistent change' },
  coincident: { zh: '同步变化', en: 'Coincident change' },
  loadMore: { zh: '继续加载', en: 'Load more' },
  loadFailed: { zh: '继续加载失败；已显示内容仍保留。', en: 'Could not load more; already displayed items remain.' },
  notPublishedTitle: { zh: '尚无实验性发布', en: 'No experimental publication yet' },
  notPublishedNote: { zh: '读取链路已经就绪，但目前没有可公开的实验性观察。', en: 'The read path is ready, but no experimental observation is published yet.' },
  notFoundTitle: { zh: '没有找到这项观察', en: 'Observation not found' },
  notFoundNote: { zh: '它不属于所选发布，或链接已失效。', en: 'It does not belong to the selected publication, or the link is no longer valid.' },
  withdrawnTitle: { zh: '这次发布已撤回', en: 'This publication was withdrawn' },
  withdrawnNote: { zh: '页面不会自动改用更旧的观察。', en: 'The page will not silently substitute an older observation.' },
  expiredTitle: { zh: '这次发布已过保留期', en: 'This publication has expired' },
  expiredNote: { zh: '等待下一次实验性发布，或返回当前列表。', en: 'Wait for the next experimental publication or return to the current list.' },
  corruptTitle: { zh: '观察结果未通过校验', en: 'Observation failed validation' },
  corruptNote: { zh: '为避免展示错配信息，本次响应已被拒绝。', en: 'The response was rejected to avoid showing mismatched information.' },
  temporaryTitle: { zh: '观察服务暂不可用', en: 'Item Monitor is temporarily unavailable' },
  temporaryNote: { zh: '请稍后手动重试；页面不会回退到其他数据。', en: 'Try again later. The page will not fall back to another data source.' },
} as const satisfies Record<string, Localized>

export type ItemMonitorStringKey = keyof typeof COPY

export function itemMonitorT(key: ItemMonitorStringKey, lang: Lang): string {
  return COPY[key][lang]
}
