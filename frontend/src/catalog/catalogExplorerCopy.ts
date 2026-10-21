import type { Lang, Localized } from '../i18n'

// Copy owned by the catalog explorer surface. Kept beside the surface rather than
// in the shared dictionaries so the public/prototype dictionaries stay byte-aligned.
const C = {
  equipment: { zh: '装备', en: 'Equipment' },
  allEquipment: { zh: '全部装备', en: 'All equipment' },
  allInCategory: { zh: '全部{name}', en: 'All {name}' },
  searchLabel: { zh: '搜索系列', en: 'Search series' },
  searchPlaceholder: { zh: '搜索', en: 'Search' },
  clearSearch: { zh: '清除搜索', en: 'Clear search' },
  any: { zh: '不限', en: 'Any' },
  rarity: { zh: '品质', en: 'Rarity' },
  category: { zh: '类别', en: 'Category' },
  wear: { zh: '磨损', en: 'Wear' },
  clearAll: { zh: '清除全部', en: 'Clear all' },
  removeCondition: { zh: '移除条件：{label}', en: 'Remove filter: {label}' },
  activeConditions: { zh: '当前条件', en: 'Active filters' },
  discoveryTitle: { zh: '随机探索', en: 'Discover' },
  searchResults: { zh: '搜索结果', en: 'Search results' },
  filteredResults: { zh: '筛选结果', en: 'Filtered results' },
  shownOfTotal: { zh: '{shown} / {total} 个系列', en: '{shown} of {total} series' },
  versions: { zh: '{count} 个版本', en: '{count} versions' },
  oneVersion: { zh: '1 个版本', en: '1 version' },
  modelSeries: { zh: '查看全部 {count} 个系列', en: 'All {count} series' },
  currentModel: { zh: '当前型号', en: 'Current model' },
  loadMore: { zh: '加载更多', en: 'Load more' },
  loadingMore: { zh: '正在加载…', en: 'Loading…' },
  loadingSeries: { zh: '正在读取系列…', en: 'Loading series…' },
  readFailed: { zh: '系列暂时无法读取。', en: 'Series cannot be loaded right now.' },
  readFailedRetained: { zh: '更新失败，仍显示上一次结果。', en: 'Update failed; showing the previous results.' },
  retry: { zh: '重试', en: 'Retry' },
  intentModel: { zh: '已识别型号：{model}', en: 'Recognised model: {model}' },
  intentKeyword: { zh: '，在其中搜索“{text}”', en: ', searching “{text}” within it' },
  intentUndo: { zh: '改为全文搜索', en: 'Search full text instead' },
  scopedSearch: { zh: '仅在 {model} 中搜索', en: 'Searching only in {model}' },
  emptyTitle: { zh: '没有符合条件的系列', en: 'No series match' },
  searchEverywhere: { zh: '在全部装备中搜索', en: 'Search all equipment' },
  clearFilters: { zh: '清除筛选', en: 'Clear filters' },
  back: { zh: '返回', en: 'Back' },
  location: { zh: '所在位置', en: 'Location' },
  kindFollow: { zh: '{name}大类', en: '{name} category' },
  seriesVersions: { zh: '版本与磨损', en: 'Versions and wear' },
  seriesCount: { zh: '共 {count} 件商品', en: '{count} items' },
  noVariant: { zh: '无此组合', en: 'Not produced' },
  lowestAsk: { zh: '最低在售', en: 'Lowest ask' },
  priceNone: { zh: '暂无报价', en: 'No listing' },
  priceLoading: { zh: '读取价格', en: 'Loading price' },
  openItem: { zh: '查看 {name}', en: 'Open {name}' },
  unitsLoading: { zh: '正在读取商品…', en: 'Loading items…' },
  unitsFailed: { zh: '商品列表暂时无法读取。', en: 'Items cannot be loaded right now.' },
  unitsEmpty: { zh: '这个系列在当前快照中没有商品。', en: 'This series has no items in the current snapshot.' },
  notApplicable: { zh: '无磨损', en: 'No wear' },
  unknownWear: { zh: '磨损未知', en: 'Wear unknown' },
  filter: { zh: '筛选', en: 'Filter' },
  close: { zh: '关闭', en: 'Close' },
  watchModel: { zh: '关注型号', en: 'Follow model' },
} as const satisfies Record<string, Localized>

export type CatalogExplorerCopyKey = keyof typeof C

export function cx(key: CatalogExplorerCopyKey, lang: Lang, values: Readonly<Record<string, string | number>> = {}): string {
  return C[key][lang].replace(/\{(\w+)\}/gu, (match, name: string) =>
    name in values ? String(values[name]) : match)
}
