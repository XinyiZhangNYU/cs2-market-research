import type { Lang, Localized } from '../i18n'

const strings = {
  title: { zh: '各平台报价', en: 'Marketplace quotes' },
  ask: { zh: '在售', en: 'Listing' },
  bid: { zh: '求购', en: 'Buy order' },
  aggregate: { zh: '综合参考', en: 'Aggregate' },
  eventTime: { zh: '价格时点', en: 'Price time' },
  empty: { zh: '暂无报价。', en: 'No quotes yet.' },
  none: { zh: '暂无价格', en: 'No price' },
  notConnected: { zh: '价格暂不可用。', en: 'Prices are not available yet.' },
  loading: { zh: '正在读取价格…', en: 'Loading prices…' },
  NO_COMPATIBLE_SNAPSHOT: { zh: '这件饰品暂无价格。', en: 'No prices for this item yet.' },
  CONTRACT_UNAVAILABLE: { zh: '价格服务暂时不可用。', en: 'The price service is temporarily unavailable.' },
  NETWORK_UNAVAILABLE: { zh: '价格暂时无法读取，请稍后再试。', en: 'Prices could not be loaded. Please try again later.' },
  RECORD_REJECTED: { zh: '价格暂时无法显示。', en: 'Prices cannot be shown right now.' },
} satisfies Record<string, Localized>

export function priceText(key: keyof typeof strings, lang: Lang): string {
  return strings[key][lang]
}
