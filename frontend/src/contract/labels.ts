// Task-scoped FE-UX-002A foundation. The JSON bytes are the pre-existing provisional labels,
// moved without rewriting them. Product wording, field/axis labels and page activation remain
// FE-UX-002B. Existing pages continue to render machine values through EnumChip's TECHNICAL mode.

import displayLabelCatalogJson from '../i18n/display-labels.json'
import type { Lang, Localized } from '../i18n'
import {
  EditionKind,
  QuerySampleState,
  SourceCapabilityState,
  ZERO_SAMPLE_NON_CONCLUSIONS,
  type ZeroSampleNonConclusion,
} from './identity'
import {
  AnalysisUnitKind,
  CaseStatus,
  CoreDomain,
  DataBranch,
  DataStatus,
  Directness,
  DomainMissingReasonCode,
  DomainStrength,
  EvidenceFlag,
  ItemCycleStage,
  LifecycleAction,
  LifecycleEntityKind,
  MarketLevelRegime,
  MarketTrendStage,
  OutcomeLabel,
  Recommendation,
  RegimeRelation,
  RelativeStrength,
  ResolutionCode,
  SectorTrendStage,
  SignalStrength,
  TradeConfirmation,
  TransitionMode,
  TransitionReason,
  ValidationLevel,
} from './enums'

export type LabelMap<T extends string> = Record<T, Localized>

export class DisplayLabelCatalogError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DisplayLabelCatalogError'
  }
}

export const DISPLAY_LABEL_MAP_NAMES = [
  'itemCycleStage',
  'trendStage',
  'marketLevelRegime',
  'relativeStrength',
  'evidenceFlag',
  'regimeRelation',
  'recommendation',
  'tradeConfirmation',
  'caseStatus',
  'dataStatus',
  'dataBranch',
  'signalStrength',
  'domainStrength',
  'domainMissingReason',
  'coreDomain',
  'resolutionCode',
  'outcomeLabel',
  'validationLevel',
  'directness',
  'transitionReason',
  'transitionMode',
  'lifecycleAction',
  'lifecycleEntityKind',
  'analysisUnitKind',
  'editionKind',
  'querySampleState',
  'sourceCapabilityState',
  'zeroSampleNonConclusion',
] as const

export type DisplayLabelMapName = (typeof DISPLAY_LABEL_MAP_NAMES)[number]

// These keys mirror the existing S entries exactly. Context stays explicit because one wire field
// can have different established headings on MARKET and SECTOR surfaces.
export const DISPLAY_FIELD_AXIS_NAMES = [
  'dimCycleStage',
  'dimEvidenceFlags',
  'dimDataStatus',
  'dimRegimeRelation',
  'dimRecommendation',
  'dimCaseStatus',
  'dimMarketTrend',
  'dimMarketLevel',
  'dimSectorTrend',
  'dimRelativeStrength',
  'dimBreadth',
  'watchAxisRecommendation',
  'watchAxisCycleStage',
  'watchAxisCaseStatus',
] as const

export type DisplayFieldAxisName = (typeof DISPLAY_FIELD_AXIS_NAMES)[number]

export type DisplayLabelCatalog = {
  enumValues: Record<DisplayLabelMapName, unknown>
  fieldAxes: LabelMap<DisplayFieldAxisName>
}

const CJK = /[　-〿一-鿿＀-￯]/

function recordAt(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new DisplayLabelCatalogError(`${path} must be an object`)
  }
  return value as Record<string, unknown>
}

function assertExactKeys(
  record: Record<string, unknown>,
  expectedKeys: readonly string[],
  path: string,
): void {
  const actual = Object.keys(record)
  const expected = new Set(expectedKeys)
  const missing = expectedKeys.filter((key) => !(key in record))
  const extra = actual.filter((key) => !expected.has(key))
  if (missing.length > 0 || extra.length > 0) {
    throw new DisplayLabelCatalogError(
      `${path} key mismatch; missing=[${missing.join(',')}]; extra=[${extra.join(',')}]`,
    )
  }
}

export function decodeDisplayLabelCatalog(
  value: unknown,
): DisplayLabelCatalog {
  const root = recordAt(value, 'displayLabels')
  assertExactKeys(root, ['enumValues', 'fieldAxes'], 'displayLabels')
  const enumValues = recordAt(root.enumValues, 'displayLabels.enumValues')
  assertExactKeys(enumValues, DISPLAY_LABEL_MAP_NAMES, 'displayLabels.enumValues')
  const fieldAxes = decodeDisplayLabelMap(
    root.fieldAxes,
    DISPLAY_FIELD_AXIS_NAMES,
    'displayLabels.fieldAxes',
  )
  return {
    enumValues: enumValues as Record<DisplayLabelMapName, unknown>,
    fieldAxes,
  }
}

export function decodeDisplayLabelMap<T extends string>(
  value: unknown,
  expectedValues: readonly T[],
  path = 'displayLabelMap',
): LabelMap<T> {
  const rawMap = recordAt(value, path)
  assertExactKeys(rawMap, expectedValues, path)

  const entries = expectedValues.map((machine) => {
    const localized = recordAt(rawMap[machine], `${path}.${machine}`)
    assertExactKeys(localized, ['zh', 'en'], `${path}.${machine}`)
    const { zh, en } = localized
    if (typeof zh !== 'string' || zh.trim().length === 0) {
      throw new DisplayLabelCatalogError(`${path}.${machine}.zh must be a non-empty string`)
    }
    if (typeof en !== 'string' || en.trim().length === 0) {
      throw new DisplayLabelCatalogError(`${path}.${machine}.en must be a non-empty string`)
    }
    if (CJK.test(en)) {
      throw new DisplayLabelCatalogError(`${path}.${machine}.en must not contain CJK text`)
    }
    return [machine, { zh, en }] as const
  })

  return Object.fromEntries(entries) as LabelMap<T>
}

const displayLabelCatalog = decodeDisplayLabelCatalog(displayLabelCatalogJson)

export const fieldAxisLabels = displayLabelCatalog.fieldAxes

function load<T extends string>(name: DisplayLabelMapName, values: readonly T[]): LabelMap<T> {
  return decodeDisplayLabelMap(
    displayLabelCatalog.enumValues[name],
    values,
    `displayLabels.enumValues.${name}`,
  )
}

export function label<T extends string>(map: LabelMap<T>, value: T, lang: Lang): string {
  const localized = map[value]
  if (localized === undefined) {
    throw new DisplayLabelCatalogError(`no display label for enum value ${JSON.stringify(value)}`)
  }
  return localized[lang]
}

export const itemCycleStageLabel = load<ItemCycleStage>(
  'itemCycleStage',
  Object.values(ItemCycleStage),
)
export const marketTrendStageLabel = load<MarketTrendStage>(
  'trendStage',
  Object.values(MarketTrendStage),
)
export const sectorTrendStageLabel = load<SectorTrendStage>(
  'trendStage',
  Object.values(SectorTrendStage),
)
export const marketLevelRegimeLabel = load<MarketLevelRegime>(
  'marketLevelRegime',
  Object.values(MarketLevelRegime),
)
export const relativeStrengthLabel = load<RelativeStrength>(
  'relativeStrength',
  Object.values(RelativeStrength),
)
export const evidenceFlagLabel = load<EvidenceFlag>('evidenceFlag', Object.values(EvidenceFlag))
export const regimeRelationLabel = load<RegimeRelation>(
  'regimeRelation',
  Object.values(RegimeRelation),
)
export const recommendationLabel = load<Recommendation>(
  'recommendation',
  Object.values(Recommendation),
)
export const tradeConfirmationLabel = load<TradeConfirmation>(
  'tradeConfirmation',
  Object.values(TradeConfirmation),
)
export const caseStatusLabel = load<CaseStatus>('caseStatus', Object.values(CaseStatus))
export const dataStatusLabel = load<DataStatus>('dataStatus', Object.values(DataStatus))
export const dataBranchLabel = load<DataBranch>('dataBranch', Object.values(DataBranch))
export const signalStrengthLabel = load<SignalStrength>(
  'signalStrength',
  Object.values(SignalStrength),
)
export const domainStrengthLabel = load<DomainStrength>(
  'domainStrength',
  Object.values(DomainStrength),
)
export const domainMissingReasonLabel = load<DomainMissingReasonCode>(
  'domainMissingReason',
  Object.values(DomainMissingReasonCode),
)
export const coreDomainLabel = load<CoreDomain>('coreDomain', Object.values(CoreDomain))
export const resolutionCodeLabel = load<ResolutionCode>(
  'resolutionCode',
  Object.values(ResolutionCode),
)
export const outcomeLabelLabel = load<OutcomeLabel>('outcomeLabel', Object.values(OutcomeLabel))
export const validationLevelLabel = load<ValidationLevel>(
  'validationLevel',
  Object.values(ValidationLevel),
)
export const directnessLabel = load<Directness>('directness', Object.values(Directness))
export const transitionReasonLabel = load<TransitionReason>(
  'transitionReason',
  Object.values(TransitionReason),
)
export const transitionModeLabel = load<TransitionMode>(
  'transitionMode',
  Object.values(TransitionMode),
)
export const lifecycleActionLabel = load<LifecycleAction>(
  'lifecycleAction',
  Object.values(LifecycleAction),
)
export const lifecycleEntityKindLabel = load<LifecycleEntityKind>(
  'lifecycleEntityKind',
  Object.values(LifecycleEntityKind),
)
export const analysisUnitKindLabel = load<AnalysisUnitKind>(
  'analysisUnitKind',
  Object.values(AnalysisUnitKind),
)
export const editionKindLabel = load<EditionKind>('editionKind', Object.values(EditionKind))
export const querySampleStateLabel = load<QuerySampleState>(
  'querySampleState',
  Object.values(QuerySampleState),
)
export const sourceCapabilityStateLabel = load<SourceCapabilityState>(
  'sourceCapabilityState',
  Object.values(SourceCapabilityState),
)
export const zeroSampleNonConclusionLabel = load<ZeroSampleNonConclusion>(
  'zeroSampleNonConclusion',
  ZERO_SAMPLE_NON_CONCLUSIONS,
)
