import type { Lang, Localized } from '../i18n'
import { NATIVE_CNY_INDEX_METHOD, NATIVE_CNY_INDEX_METHOD_H } from '../wire/nativeCnyIndexPublicApi'

const MARKET_COPY = {
  dataDate: { zh: '统计日期', en: 'Data date' },
  expectedDate: { zh: '应有最新完整日', en: 'Expected latest complete day' },
  publicationClockUnknown: { zh: '首次公开时间未精确记录', en: 'Initial public time not recorded exactly' },
  publicationClockLowerBound: { zh: '确认公开不早于', en: 'Confirmed public no earlier than' },
  freshCurrent: { zh: '当前完整日', en: 'Current complete day' },
  freshHistorical: { zh: '仅作历史展示', en: 'Historical display only' },
  freshNoRecent: { zh: '暂无近期统计', en: 'No recent statistic' },
  historicalWarning: {
    zh: '当前完整日没有可发布统计；下方数值仅是仍在保留期内的历史结果。',
    en: 'No publishable statistic exists for the current complete day. Values below are retained historical results only.',
  },
  emptyTitle: { zh: '本次发布没有可展示的市场统计', en: 'No market statistic in this publication' },
  emptyNote: {
    zh: '这不是服务故障；本次发布没有满足公开条件的完整日数据。',
    en: 'This is not a service failure. This publication has no complete-day data eligible for public display.',
  },
  scopeDetail: { zh: '板块详情', en: 'Scope detail' },
  scopeLoading: { zh: '正在读取该板块的完整历史…', en: 'Loading the complete history for this sector…' },
  backOverview: { zh: '返回板块热力图', en: 'Back to sector heatmap' },
  selectedReturn: { zh: '展示涨跌', en: 'Displayed return' },
  pairedCoverage: { zh: '成对覆盖率', en: 'Paired coverage' },
  members: { zh: '有效／固定成员', en: 'Paired / fixed members' },
  coverageGrade: { zh: '覆盖等级', en: 'Coverage grade' },
  coverageHigh: { zh: '高覆盖', en: 'High coverage' },
  coveragePartial: { zh: '部分覆盖', en: 'Partial coverage' },
  coverageDetailOnly: { zh: '仅详情展示', en: 'Detail only' },
  methodRaw: { zh: '成员等权原始涨跌', en: 'Raw equal-member return' },
  methodSuppressed: { zh: '1% 对称缩尾后的成员等权涨跌', en: 'Equal-member return after symmetric 1% winsorization' },
  methodNote: {
    zh: '每个可用成员等权，不按价格、成交量或市值加权。覆盖不足时会保留缺失说明。',
    en: 'Each available member has equal weight. Results are not price-, volume-, or market-cap-weighted; missing coverage remains explicit.',
  },
  methodNoteNeutral: {
    zh: '按当前正式发布序列的方法计算，不按成交量或市值加权。覆盖不足时会保留缺失说明。',
    en: 'Computed with the method of the currently published official series. Results are not volume- or market-cap-weighted; missing coverage remains explicit.',
  },
  methodNoteH: {
    zh: '按价格分层平衡几何指数（H）计算：价格分三档平衡权重，取成员对数涨跌的加权平均；参照成员不足 100 或无法分档的范围退回成员等权几何平均。不按成交量或市值加权。覆盖不足时会保留缺失说明。',
    en: 'Computed as the price-tier balanced geometric index (H): weights are balanced across three price tiers and member log returns are averaged with those weights; a scope with fewer than 100 reference members, or that cannot be tiered, falls back to an equal-weight geometric mean. Results are not volume- or market-cap-weighted; missing coverage remains explicit.',
  },
  qualityTitle: { zh: '口径与覆盖', en: 'Method and coverage' },
  currentQuality: { zh: '当前日质量', en: 'Current-day quality' },
  qualityAvailable: { zh: '可用', en: 'Available' },
  qualityNoPublishedDay: { zh: '该日未发布', en: 'No published day' },
  qualityUnavailable: { zh: '不可用', en: 'Unavailable' },
  qualityBaselineOnly: { zh: '仅有基准日', en: 'Baseline only' },
  rawReturn: { zh: '诊断：原始等权日涨跌', en: 'Diagnostic: raw equal-weight daily return' },
  suppressedReturn: { zh: '正式：稳健等权日涨跌', en: 'Official: robust equal-weight daily return' },
  dayCoverage: { zh: '当日价格覆盖率', en: 'Day-price coverage' },
  memberPriceSum: { zh: '已覆盖成员价格合计', en: 'Covered-member price sum' },
  missingMembers: { zh: '缺少有效成对价格', en: 'Missing paired prices' },
  priceSumNote: {
    zh: '价格合计只把每个可用成员的一份选定收盘价相加，不代表市值、成交额或可投资指数。',
    en: 'The price sum adds one selected close per available member. It is not market capitalization, turnover, or an investable index.',
  },
  missingEndpoint: { zh: '端点缺失', en: 'Missing endpoint' },
  sourceBreak: { zh: '来源集合断裂', en: 'Source-set break' },
  singleSource: { zh: '单一来源成对值', en: 'Single-source pairs' },
  unmapped: { zh: '未映射成员', en: 'Unmapped members' },
  scopeMARKET: { zh: '市场', en: 'Market' },
  scopeSECTOR: { zh: '母板块', en: 'Sector' },
  scopeSUBSECTOR: { zh: '子板块', en: 'Subsector' },
  subsectorComparisonSuffix: { zh: '分类板块对比', en: ' subcategory comparison' },
  otherSubsectors: { zh: '其他子板块', en: 'Other subsectors' },
  indexTitle: { zh: '市场指数与历史轨迹', en: 'Market index and history' },
  indexMethodName: {
    zh: '正式序列：稳健等权（ROBUST_EQUAL_V3）',
    en: 'Official series: Robust equal weight (ROBUST_EQUAL_V3)',
  },
  indexMethodNameH: {
    zh: '正式序列：价格分层平衡几何指数（H）',
    en: 'Official series: Price-tier balanced geometric index (H)',
  },
  indexCurveMain: { zh: '价格分层平衡几何指数（H）', en: 'Price-tier balanced geometric index (H)' },
  indexCurveE: { zh: '等权几何指数', en: 'Equal-weight geometric index' },
  indexCurveENote: {
    zh: '等权几何指数：与主指数同一月度成员、等权几何平均、不剔除。仅作对照曲线，不替代主指数。',
    en: 'Equal-weight geometric index: the same monthly members as the main index, an equal-weight geometric mean, no exclusion. A comparison curve only; it does not replace the main index.',
  },
  indexCurveAsOf: { zh: '截至', en: 'as of' },
  indexCurveLegend: { zh: '曲线图例', en: 'Chart legend' },
  indexBoard: { zh: '大盘与板块', en: 'Market and sectors' },
  indexTabMarket: { zh: '大盘', en: 'Market' },
  indexTabSectors: { zh: '板块', en: 'Sectors' },
  indexWindow: { zh: '时间窗口', en: 'Time window' },
  indexRange7d: { zh: '7日', en: '7D' },
  indexRange1m: { zh: '1月', en: '1M' },
  indexRange3m: { zh: '3月', en: '3M' },
  indexRange1y: { zh: '1年', en: '1Y' },
  indexRangeAll: { zh: '全部', en: 'All' },
  indexSectorLines: { zh: '板块指数相对窗口起点', en: 'Sector index versus window start' },
  indexSectorLegend: { zh: '板块曲线', en: 'Sector lines' },
  indexAllSectors: { zh: '全部板块', en: 'All sectors' },
  indexSectorHeatmap: { zh: '板块热力', en: 'Sector heatmap' },
  indexSectorMethod: {
    zh: '曲线是各板块连续指数相对窗口起点的涨跌；色块只在日历完整且相邻日可连接时按窗口涨跌着色，否则为中性色。面积用成员最低售价合计的平方根，并给小板块留最小面积。图是示意，不是该板块成分。这不是成交量或市值。',
    en: 'Lines are each sector’s index versus the window start. Tile color uses the window return only for a complete calendar span of adjacent connected days; otherwise the tile stays neutral. Area uses the square root of the latest member minimum-ask sum, with a floor so small sectors stay readable. Pictures are illustrations, not constituents. This is not volume or market cap.',
  },
  indexNoSectors: { zh: '这次发布没有可绘制的板块指数。', en: 'No plottable sector index is available in this release.' },
  indexDisclosure: {
    zh: '当前只展示稳健等权正式序列，不提供价格或市值加权入口。这是描述统计，不是预测或交易建议。窗口涨跌只在所选日历完整、且相邻日全部正式可连接时显示；跨边界、缺口或不足日数为 —，不是 0。历史重建点并非当时可用信息。',
    en: 'Only the official robust equal-weight series is available here; there is no price- or market-cap-weighted entry point. These are descriptive statistics, not forecasts or trading advice. A window return appears only for a complete calendar span of formally connected adjacent days; a boundary, gap, or short span is —, not 0. Reconstructed history was not available at the time.',
  },
  indexDisclosureNeutral: {
    zh: '当前只展示一条正式序列，不提供成交量或市值加权入口。这是描述统计，不是预测或交易建议。窗口涨跌只在所选日历完整、且相邻日全部正式可连接时显示；跨边界、缺口或不足日数为 —，不是 0。历史重建点并非当时可用信息。',
    en: 'Only one official series is available here; there is no volume- or market-cap-weighted entry point. These are descriptive statistics, not forecasts or trading advice. A window return appears only for a complete calendar span of formally connected adjacent days; a boundary, gap, or short span is —, not 0. Reconstructed history was not available at the time.',
  },
  indexDisclosureH: {
    zh: '当前只展示一条正式序列：价格分层平衡几何指数（H），参照成员不足 100 或无法分档的范围退回等权几何平均；不提供成交量或市值加权入口。这是描述统计，不是预测或交易建议。窗口涨跌只在所选日历完整、且相邻日全部正式可连接时显示；跨边界、缺口或不足日数为 —，不是 0。历史重建点并非当时可用信息。',
    en: 'Only one official series is available here: the price-tier balanced geometric index (H), with an equal-weight geometric fallback for a scope with fewer than 100 reference members or that cannot be tiered; there is no volume- or market-cap-weighted entry point. These are descriptive statistics, not forecasts or trading advice. A window return appears only for a complete calendar span of formally connected adjacent days; a boundary, gap, or short span is —, not 0. Reconstructed history was not available at the time.',
  },
  indexVisualBridgeDisclosure: {
    zh: '实线表示正式可连接区间；虚线只连接两端均有指数值但跨越重建／实测、分段或日期边界的点，仅用于连续展示轨迹，不代表正式相邻日收益。真正的空值仍按不可用保留，不连接。悬停大盘或详情曲线可查看各点的重建／实测、总体质量、覆盖下界和来源质量分母。',
    en: 'Solid lines are formally connected intervals. A dashed bridge joins finite index levels across reconstruction/measured, segment, or calendar boundaries for visual continuity only; it is not an official adjacent-day return. A true null remains unavailable and is never joined. Hover the market or detail line for reconstruction/measured status, overall quality, coverage floor, and source-quality denominators.',
  },
  indexScope: { zh: '指数范围', en: 'Index scope' },
  indexLoading: { zh: '正在读取连续指数…', en: 'Loading the continuous index…' },
  indexLoadingMore: { zh: '正在读取其余板块…', en: 'Loading the remaining sectors…' },
  indexNoHistory: { zh: '这个板块尚无可展示的连续指数点。', en: 'No continuous index points are available for this scope yet.' },
  indexNoPoints: { zh: '所选区间没有可绘制的指数点。', en: 'No plottable index points exist in the selected window.' },
  indexLatestValue: { zh: '最新指数值', en: 'Latest index value' },
  indexDailyChange: { zh: '相邻日变化', en: 'Adjacent-day change' },
  indexCoverage: { zh: '保守覆盖下界', en: 'Conservative coverage floor' },
  indexQuality: { zh: '总体质量', en: 'Overall quality' },
  indexAskSum: { zh: '成员最低售价合计', en: 'Member minimum-ask sum' },
  indexMedianAsk: { zh: '成员最低售价中位数', en: 'Median member minimum ask' },
  indexMembers: { zh: '成对成员／分母上界', en: 'Paired members / denominator cap' },
  indexAvailability: { zh: '数据可用性', en: 'Data availability' },
  indexReconstructed: { zh: '事后重建', en: 'Late-bound reconstruction' },
  indexForward: { zh: '上线后同期实测', en: 'Measured contemporaneously' },
  indexGradeCounts: { zh: '来源质量分母 A–E', en: 'Source-quality denominators A–E' },
  indexAnomalyCount: { zh: '异常贡献成员数', en: 'Anomaly contributors' },
  indexAnomalyDetails: { zh: '查看异常贡献明细', en: 'View anomaly contribution detail' },
  indexAnomalyNameUnavailable: { zh: '饰品名称暂不可用', en: 'Item name unavailable' },
} as const satisfies Record<string, Localized>

export type MarketStringKey = keyof typeof MARKET_COPY

export function marketT(key: MarketStringKey, lang: Lang): string {
  return MARKET_COPY[key][lang]
}

export type IndexMethodVariant = 'V1' | 'H' | 'NEUTRAL'

/** Which method the method/disclosure copy may describe. Non-native (legacy USD) data is
 * always V1. Native data names only the method it actually carries (the /index/day method);
 * while that is not known, or for any other method, the copy stays neutral. */
export function indexMethodVariant(native: boolean, method: string | null | undefined): IndexMethodVariant {
  if (!native) return 'V1'
  if (method === NATIVE_CNY_INDEX_METHOD_H) return 'H'
  if (method === NATIVE_CNY_INDEX_METHOD) return 'V1'
  return 'NEUTRAL'
}

export const METHOD_NOTE_COPY = { V1: 'methodNote', H: 'methodNoteH', NEUTRAL: 'methodNoteNeutral' } as const satisfies Record<IndexMethodVariant, MarketStringKey>
export const INDEX_DISCLOSURE_COPY = { V1: 'indexDisclosure', H: 'indexDisclosureH', NEUTRAL: 'indexDisclosureNeutral' } as const satisfies Record<IndexMethodVariant, MarketStringKey>


