import type { Lang } from '../i18n'

const labels: Record<string, readonly [string, string]> = {
  SOURCE_ONLY: ['仅有官方公告', 'Official announcement only'],
  ANALYSIS_PENDING: ['分析待审核', 'Analysis pending review'],
  ANALYSIS_BLOCKED: ['分析暂不可用', 'Analysis unavailable'],
  PUBLIC: ['分析已发布', 'Analysis published'],
  SOURCE_UPDATED_ANALYSIS_PENDING: ['原文已更新 · 分析待更新', 'Source updated · analysis pending'],
  CORRECTED: ['分析已修订', 'Analysis corrected'],
  WITHDRAWN: ['分析已撤回', 'Analysis withdrawn'],
  PROSPECTIVE: ['事前分析', 'Prospective analysis'],
  RETROSPECTIVE_REPLAY: ['历史回放', 'Historical replay'],
  RETROSPECTIVE_WITH_HINDSIGHT: ['事后分析', 'Retrospective analysis'],
  RETROSPECTIVE_CORRECTION: ['事后修订', 'Retrospective correction'],
  POSITIVE: ['可能正向影响', 'Potential positive impact'],
  NEGATIVE: ['可能负向影响', 'Potential negative impact'],
  MIXED: ['影响或证据有分歧', 'Mixed impact or evidence'],
  NO_CLEAR_IMPACT: ['暂无明确影响', 'No clear impact'],
  UNCERTAIN: ['影响尚不确定', 'Impact uncertain'],
  SUPPORTED: ['观察证据支持', 'Supported by observations'],
  NOT_SUPPORTED: ['观察证据不支持', 'Not supported by observations'],
  UNAVAILABLE: ['数据不足', 'Insufficient data'],
  COMPLETE: ['背景数据完整', 'Complete context'],
  PARTIAL: ['背景数据不完整', 'Partial context'],
  TRACKED: ['已纳入跟踪', 'Tracked'],
  UNTRACKED_SUBJECT: ['未纳入跟踪', 'Not tracked'],
  UNRESOLVED: ['对象尚未匹配', 'Subject unresolved'],
  IMMEDIATE: ['近期', 'Immediate'],
  SHORT_TERM: ['短期', 'Short term'],
  STRUCTURAL: ['结构变化', 'Structural'],
  UNSPECIFIED: ['期限未明确', 'Horizon unspecified'],
  MARKET: ['市场', 'Market'],
  SECTOR: ['板块', 'Sector'],
  ITEM: ['单品', 'Item'],
  SUBJECT: ['公告涉及对象', 'Announcement subject'],
}

export function valvePublicLabel(code: string, lang: Lang): string {
  return labels[code]?.[lang === 'zh' ? 0 : 1] ?? (lang === 'zh' ? '状态暂不可识别' : 'Status not recognized')
}
