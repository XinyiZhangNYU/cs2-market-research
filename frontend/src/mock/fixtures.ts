// Fixed, reproducible synthetic data. No Date.now, no Math.random, no network, no key access.
// Every name, ratio and identifier here is invented and must never be read as market data.
// The fixture epoch is deliberately not "today" so a stale screenshot cannot pass as live output.
//
// Free text is held in both languages here and resolved by the API layer, because the Python
// contract types these fields as plain str with no localisation convention.

import {
  AnalysisUnitKind,
  CaseStatus,
  ClaimCode,
  CoreDomain,
  DataBranch,
  DataStatus,
  Directness,
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
  ScopeKind,
  SectorTrendStage,
  SignalStrength,
  TradeConfirmation,
  TransitionMode,
  TransitionReason,
  ValidationLevel,
} from '../contract/enums'
import {
  EditionKind,
  QuerySampleState,
  SourceCapabilityState,
  type QueryOutcome,
} from '../contract/identity'
import { ITEM_IMAGE_NOT_PRODUCED } from '../contract/itemImage'
import { notProduced } from '../contract/provenance'
import type { Lang, Localized } from '../i18n'
import { pick } from '../i18n'
import type {
  AnalysisUnit,
  EvidenceDomainSnapshot,
  ItemStateSnapshot,
  LifecycleEvent,
  MarketStateSnapshot,
  OutcomeEvaluation,
  RecommendationSnapshot,
  ScopeHeader,
  SectorStateSnapshot,
  SourceCoverageRow,
  StateTransition,
  VersionContext,
} from '../contract/types'

export const FIXTURE_EPOCH = '2026-01-15T00:00:00Z'
const T = (hoursFromEpoch: number): string => {
  const base = Date.parse(FIXTURE_EPOCH)
  return new Date(base + hoursFromEpoch * 3_600_000).toISOString()
}

export const VERSIONS: VersionContext = {
  catalog_version: 'SYNTHETIC-catalog-v0',
  group_version: 'SYNTHETIC-group-v0',
  index_version: 'SYNTHETIC-index-v0',
  fusion_method_version: 'SYNTHETIC-fusion-v0',
  feature_profile_version: 'SYNTHETIC-profile-b-v0',
  algorithm_version: 'SYNTHETIC-alg-v0-UNVALIDATED',
  parameter_set_version: 'SYNTHETIC-params-v0-SEED',
  stage_policy_version: 'SYNTHETIC-stage-policy-v0',
  failure_policy_version: 'SYNTHETIC-failure-policy-v0',
}

const AS_OF_PROPOSAL = notProduced('as_of', {
  zh: '状态快照只产出 available_at；as_of 目前只存在于 TemporalFeatureSnapshot 的特征窗口截止时点，未提升为 scope 级字段。',
  en: 'State snapshots emit available_at only; as_of currently exists on TemporalFeatureSnapshot as the feature-window end and has not been promoted to a scope-level field.',
})

const POOL_TIER_PROPOSAL = notProduced('pool_tier', {
  zh: 'L1–L3 标的池层级在 state_machine/enums.py 中没有对应枚举。',
  en: 'The L1-L3 pool tier has no enum in state_machine/enums.py.',
})

// Every field is read off the snapshot the header answers for. An earlier version defaulted
// data_status to COMPLETE and hardcoded the branch and versions, which meant a header could state
// a status and an algorithm version the snapshot never carried.
export function header(
  scope: (typeof ScopeKind)[keyof typeof ScopeKind],
  snapshot: {
    analysis_unit_id: string
    available_at: string
    data_status: (typeof DataStatus)[keyof typeof DataStatus]
    data_branch: (typeof DataBranch)[keyof typeof DataBranch]
    versions: VersionContext
  },
): ScopeHeader {
  return {
    scope_kind: scope,
    analysis_unit_id: snapshot.analysis_unit_id,
    available_at: snapshot.available_at,
    as_of: AS_OF_PROPOSAL,
    data_branch: snapshot.data_branch,
    data_status: snapshot.data_status,
    versions: snapshot.versions,
  }
}

export const MARKET: MarketStateSnapshot = {
  analysis_unit_id: 'MARKET-UNIFIED-CS2',
  available_at: T(72),
  trend_stage: MarketTrendStage.UP_BUILDING,
  level_regime: MarketLevelRegime.NORMAL,
  evidence_flags: [EvidenceFlag.PRICE_RISING, EvidenceFlag.DEMAND_ACCELERATING],
  data_status: DataStatus.DEGRADED_OPTIONAL,
  recommendation: Recommendation.WATCH,
  case_status: CaseStatus.ACTIVE,
  analysis_case_id: 'CASE-MKT-0001',
  data_branch: DataBranch.B,
  versions: VERSIONS,
  input_snapshot_hash: 'synthetic-market-hash-0001',
}

export const SECTORS: readonly SectorStateSnapshot[] = [
  {
    analysis_unit_id: 'SECTOR-RIFLE',
    available_at: T(72),
    trend_stage: SectorTrendStage.UP_ACTIVE,
    relative_strength: RelativeStrength.LEADING,
    breadth: {
      advancing_member_ratio: '0.62',
      median_member_return: '0.041',
      breadth_expanding: true,
      breadth_narrowing: false,
      concentration_warning: false,
    },
    evidence_flags: [EvidenceFlag.PRICE_RISING, EvidenceFlag.DEMAND_ACCELERATING],
    data_status: DataStatus.COMPLETE,
    recommendation: Recommendation.WATCH,
    case_status: CaseStatus.ACTIVE,
    analysis_case_id: 'CASE-SEC-0001',
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-sector-rifle-hash',
  },
  {
    analysis_unit_id: 'SECTOR-KNIFE',
    available_at: T(72),
    trend_stage: SectorTrendStage.DOWN_ACTIVE,
    relative_strength: RelativeStrength.LAGGING,
    breadth: {
      advancing_member_ratio: '0.18',
      median_member_return: '-0.027',
      breadth_expanding: false,
      breadth_narrowing: true,
      concentration_warning: true,
    },
    evidence_flags: [EvidenceFlag.BREADTH_COLLAPSE, EvidenceFlag.CONCENTRATION_WARNING],
    data_status: DataStatus.COMPLETE,
    recommendation: Recommendation.IGNORE,
    case_status: CaseStatus.ACTIVE,
    analysis_case_id: 'CASE-SEC-0002',
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-sector-knife-hash',
  },
  {
    analysis_unit_id: 'SECTOR-GLOVE',
    available_at: T(60),
    trend_stage: SectorTrendStage.NEUTRAL,
    relative_strength: RelativeStrength.UNKNOWN,
    breadth: {
      advancing_member_ratio: null,
      median_member_return: null,
      breadth_expanding: false,
      breadth_narrowing: false,
      concentration_warning: false,
    },
    evidence_flags: [],
    data_status: DataStatus.CONFLICTED,
    recommendation: Recommendation.WITHHELD_DATA_INCOMPLETE,
    case_status: null,
    analysis_case_id: null,
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-sector-glove-hash',
  },
]

export const UNIT_IDS = [
  'ITEM-0001',
  'ITEM-0002',
  'ITEM-0003',
  'ITEM-0004',
  'ITEM-0005',
  'ITEM-0006',
  'ITEM-0007',
  'ITEM-0008',
  'ITEM-0009',
] as const

// edition is a field of its own rather than a variant attribute. Holding "stattrak" in
// variant_attributes as well would leave two answers to the same question, free to disagree.
const UNIT_DEFS: readonly {
  id: string
  name: Localized
  sector: string
  kind: AnalysisUnitKind
  edition: EditionKind
  parent: string | null
  variant: Readonly<Record<string, string>>
}[] = [
  {
    id: 'ITEM-0001',
    name: { zh: '合成标的 A · 步枪 · 久经沙场', en: 'Synthetic unit A · rifle · field-tested' },
    sector: 'SECTOR-RIFLE',
    kind: AnalysisUnitKind.BASE_MHN,
    edition: EditionKind.STANDARD,
    parent: null,
    variant: { wear_band: 'FIELD_TESTED' },
  },
  {
    id: 'ITEM-0002',
    name: { zh: '合成标的 B · 狙击枪 · 略有磨损', en: 'Synthetic unit B · sniper · minimal wear' },
    sector: 'SECTOR-RIFLE',
    kind: AnalysisUnitKind.BASE_MHN,
    edition: EditionKind.STANDARD,
    parent: null,
    variant: { wear_band: 'MINIMAL_WEAR' },
  },
  {
    id: 'ITEM-0003',
    name: { zh: '合成标的 C · 匕首 · 崭新出厂', en: 'Synthetic unit C · knife · factory new' },
    sector: 'SECTOR-KNIFE',
    kind: AnalysisUnitKind.BASE_MHN,
    edition: EditionKind.STANDARD,
    parent: null,
    // A finish attribute reported by a source and not promoted to an internal identity. It stays
    // an attribute of the base unit: DetailIdentityBinding refuses style/pattern facts unless
    // promotion_status is INTERNAL_VARIANT, so an unpromoted finish must not become a kind.
    variant: { wear_band: 'FACTORY_NEW', finish_variant: 'SYNTHETIC_VARIANT_04' },
  },
  {
    id: 'ITEM-0004',
    name: { zh: '合成标的 D · 手套 · 久经沙场', en: 'Synthetic unit D · gloves · field-tested' },
    sector: 'SECTOR-GLOVE',
    kind: AnalysisUnitKind.BASE_MHN,
    edition: EditionKind.STANDARD,
    parent: null,
    variant: { wear_band: 'FIELD_TESTED' },
  },
  {
    id: 'ITEM-0005',
    name: { zh: '合成标的 E · 步枪 · 崭新出厂', en: 'Synthetic unit E · rifle · factory new' },
    sector: 'SECTOR-RIFLE',
    kind: AnalysisUnitKind.BASE_MHN,
    edition: EditionKind.STATTRAK,
    parent: null,
    variant: { wear_band: 'FACTORY_NEW' },
  },
  {
    id: 'ITEM-0006',
    name: { zh: '合成标的 F · 匕首 · 略有磨损', en: 'Synthetic unit F · knife · minimal wear' },
    sector: 'SECTOR-KNIFE',
    kind: AnalysisUnitKind.BASE_MHN,
    edition: EditionKind.SOUVENIR,
    parent: null,
    variant: { wear_band: 'MINIMAL_WEAR' },
  },
  {
    id: 'ITEM-0007',
    name: { zh: '合成标的 G · 匕首 · 母体名', en: 'Synthetic unit G · knife · parent name' },
    sector: 'SECTOR-KNIFE',
    kind: AnalysisUnitKind.BASE_MHN,
    edition: EditionKind.STANDARD,
    parent: null,
    variant: { wear_band: 'FACTORY_NEW' },
  },
  {
    id: 'ITEM-0008',
    name: { zh: '合成标的 G · 款式子身份 S1', en: 'Synthetic unit G · style child S1' },
    sector: 'SECTOR-KNIFE',
    kind: AnalysisUnitKind.STYLE_VARIANT,
    edition: EditionKind.STANDARD,
    parent: 'ITEM-0007',
    variant: { wear_band: 'FACTORY_NEW', internal_variant_code: 'SYNTHETIC-STYLE-S1' },
  },
  {
    id: 'ITEM-0009',
    // UNKNOWN is the fourth catalog edition value and the reason a three-value model does not
    // work: the edition of this unit is not resolved, and there is no honest stand-in for that.
    name: { zh: '合成标的 G · 模板子身份 P7', en: 'Synthetic unit G · pattern child P7' },
    sector: 'SECTOR-KNIFE',
    kind: AnalysisUnitKind.PATTERN_VARIANT,
    edition: EditionKind.UNKNOWN,
    parent: 'ITEM-0007',
    variant: { wear_band: 'FACTORY_NEW', internal_variant_code: 'SYNTHETIC-PATTERN-P7' },
  },
]

export function units(lang: Lang): readonly AnalysisUnit[] {
  return UNIT_DEFS.map((def) => ({
    analysis_unit_id: def.id,
    scope_kind: ScopeKind.ITEM,
    analysis_unit_kind: def.kind,
    edition_kind: def.edition,
    parent_analysis_unit_id: def.parent,
    display_name: pick(def.name, lang),
    image: ITEM_IMAGE_NOT_PRODUCED,
    sector_id: def.sector,
    variant_attributes: def.variant,
    pool_tier: POOL_TIER_PROPOSAL,
  }))
}

// Two axes, kept apart on purpose. ITEM-0008 and ITEM-0009 both returned zero rows, but only
// ITEM-0008's source is known to support the query at all; ITEM-0009's capability is UNKNOWN.
// Rendering both as "no listings" would state a platform fact that only one of them supports.
export const QUERY_OUTCOMES: Readonly<Record<string, QueryOutcome>> = {
  'ITEM-0007': {
    sample_state: QuerySampleState.POSITIVE_SAMPLE,
    capability_state: SourceCapabilityState.CONFIRMED,
    returned_member_count: 12,
  },
  'ITEM-0008': {
    sample_state: QuerySampleState.ZERO_CURRENT_SAMPLE,
    capability_state: SourceCapabilityState.CONFIRMED,
    returned_member_count: 0,
  },
  'ITEM-0009': {
    sample_state: QuerySampleState.ZERO_CURRENT_SAMPLE,
    capability_state: SourceCapabilityState.UNKNOWN,
    returned_member_count: 0,
  },
}

export const ITEM_STATES: Readonly<Record<string, ItemStateSnapshot>> = {
  'ITEM-0001': {
    analysis_unit_id: 'ITEM-0001',
    available_at: T(72),
    cycle_stage: ItemCycleStage.CONFIRMED_UP,
    evidence_flags: [
      EvidenceFlag.PRICE_RISING,
      EvidenceFlag.DEMAND_ACCELERATING,
      EvidenceFlag.SUPPLY_CONTRACTING,
      EvidenceFlag.SUSPECTED_SWEEPING,
    ],
    data_status: DataStatus.UNAVAILABLE_BY_DESIGN,
    regime_relation: [RegimeRelation.SECTOR_DRIVEN, RegimeRelation.IN_LINE],
    recommendation: Recommendation.STRONG_CANDIDATE,
    case_status: CaseStatus.ACTIVE,
    candidate_episode_id: null,
    cycle_case_id: 'CYCLE-0001',
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-item-0001-hash',
  },
  'ITEM-0002': {
    analysis_unit_id: 'ITEM-0002',
    available_at: T(72),
    cycle_stage: ItemCycleStage.PRESSURE_BUILDING,
    evidence_flags: [EvidenceFlag.DEMAND_ACCELERATING],
    data_status: DataStatus.COMPLETE,
    regime_relation: [RegimeRelation.MARKET_DRIVEN],
    recommendation: Recommendation.RECOMMENDED_CANDIDATE,
    case_status: CaseStatus.ACTIVE,
    candidate_episode_id: 'EPISODE-0002',
    cycle_case_id: null,
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-item-0002-hash',
  },
  'ITEM-0003': {
    analysis_unit_id: 'ITEM-0003',
    available_at: T(70),
    cycle_stage: ItemCycleStage.COOLING,
    evidence_flags: [EvidenceFlag.OVERHEATED],
    data_status: DataStatus.COMPLETE,
    regime_relation: [RegimeRelation.COUNTER_REGIME],
    recommendation: Recommendation.COOLING_REMOVE_FROM_PRIORITY,
    // CYCLE-0003 was closed. engine.py clears both case ids and sets case_status to None on
    // closure, and models.py rejects a case_status with no case id behind it, so a snapshot
    // never carries RESOLVED. The closed case survives in the lifecycle event and the outcome,
    // which is the layer that does record terminal statuses. The stage stays COOLING: the
    // closure path replaces the case fields and does not touch cycle_stage.
    case_status: null,
    candidate_episode_id: null,
    cycle_case_id: null,
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-item-0003-hash',
  },
  'ITEM-0004': {
    analysis_unit_id: 'ITEM-0004',
    available_at: T(60),
    cycle_stage: ItemCycleStage.BASELINE,
    evidence_flags: [],
    data_status: DataStatus.CONFLICTED,
    regime_relation: [RegimeRelation.UNKNOWN],
    recommendation: Recommendation.WITHHELD_DATA_INCOMPLETE,
    case_status: null,
    candidate_episode_id: null,
    cycle_case_id: null,
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-item-0004-hash',
  },
  'ITEM-0005': {
    analysis_unit_id: 'ITEM-0005',
    available_at: T(48),
    cycle_stage: ItemCycleStage.PRESSURE_BUILDING,
    evidence_flags: [EvidenceFlag.PRICE_RISING],
    data_status: DataStatus.STALE_GRACE,
    regime_relation: [RegimeRelation.SECTOR_DRIVEN],
    recommendation: Recommendation.RECOMMENDED_CANDIDATE,
    case_status: CaseStatus.ACTIVE,
    candidate_episode_id: 'EPISODE-0005',
    cycle_case_id: null,
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-item-0005-hash',
  },
  // engine.py assigns SUSPENDED only when an active case id exists, so this unit still has an
  // open cycle case; the data went bad under it and the recommendation is withheld. A watch list
  // that filters on ACTIVE alone drops exactly this row, which is the one most worth showing.
  'ITEM-0006': {
    analysis_unit_id: 'ITEM-0006',
    available_at: T(44),
    cycle_stage: ItemCycleStage.CONFIRMED_UP,
    evidence_flags: [EvidenceFlag.PRICE_RISING],
    data_status: DataStatus.DATA_UNAVAILABLE_RUNTIME,
    regime_relation: [RegimeRelation.SECTOR_DRIVEN],
    recommendation: Recommendation.WITHHELD_DATA_INCOMPLETE,
    case_status: CaseStatus.SUSPENDED,
    candidate_episode_id: null,
    cycle_case_id: 'CYCLE-0006',
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-item-0006-hash',
  },
  // The parent MHN. Its quotes span every child below it, so its numbers are context for reading
  // them and never a row to rank the children against.
  'ITEM-0007': {
    analysis_unit_id: 'ITEM-0007',
    available_at: T(72),
    cycle_stage: ItemCycleStage.PRESSURE_BUILDING,
    evidence_flags: [EvidenceFlag.PRICE_RISING],
    data_status: DataStatus.COMPLETE,
    regime_relation: [RegimeRelation.SECTOR_DRIVEN],
    recommendation: Recommendation.WATCH,
    case_status: null,
    candidate_episode_id: null,
    cycle_case_id: null,
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-item-0007-hash',
  },
  // Zero current sample against a source that is known to support the query. The run itself
  // completed, so data_status stays COMPLETE: an observation of zero is an observation.
  'ITEM-0008': {
    analysis_unit_id: 'ITEM-0008',
    available_at: T(72),
    cycle_stage: ItemCycleStage.BASELINE,
    evidence_flags: [],
    data_status: DataStatus.COMPLETE,
    regime_relation: [RegimeRelation.UNKNOWN],
    recommendation: Recommendation.WITHHELD_DATA_INCOMPLETE,
    case_status: null,
    candidate_episode_id: null,
    cycle_case_id: null,
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-item-0008-hash',
  },
  // Zero current sample where the source is not even known to support the query.
  'ITEM-0009': {
    analysis_unit_id: 'ITEM-0009',
    available_at: T(72),
    cycle_stage: ItemCycleStage.BASELINE,
    evidence_flags: [],
    data_status: DataStatus.COMPLETE,
    regime_relation: [RegimeRelation.UNKNOWN],
    recommendation: Recommendation.WITHHELD_DATA_INCOMPLETE,
    case_status: null,
    candidate_episode_id: null,
    cycle_case_id: null,
    data_branch: DataBranch.B,
    versions: VERSIONS,
    input_snapshot_hash: 'synthetic-item-0009-hash',
  },
}

export const ITEM_RECOMMENDATIONS: Readonly<Record<string, RecommendationSnapshot>> = {
  'ITEM-0001': {
    analysis_unit_id: 'ITEM-0001',
    available_at: T(72),
    recommendation: Recommendation.STRONG_CANDIDATE,
    signal_strength: SignalStrength.STRONG,
    evidence_coverage: '0.83',
    trade_confirmation: TradeConfirmation.UNAVAILABLE,
    data_branch: DataBranch.B,
    data_status: DataStatus.UNAVAILABLE_BY_DESIGN,
    input_snapshot_hash: 'synthetic-item-0001-hash',
    versions: VERSIONS,
  },
  'ITEM-0002': {
    analysis_unit_id: 'ITEM-0002',
    available_at: T(72),
    recommendation: Recommendation.RECOMMENDED_CANDIDATE,
    signal_strength: SignalStrength.MODERATE,
    evidence_coverage: '0.67',
    trade_confirmation: TradeConfirmation.UNAVAILABLE,
    data_branch: DataBranch.B,
    data_status: DataStatus.COMPLETE,
    input_snapshot_hash: 'synthetic-item-0002-hash',
    versions: VERSIONS,
  },
  'ITEM-0003': {
    analysis_unit_id: 'ITEM-0003',
    available_at: T(70),
    recommendation: Recommendation.COOLING_REMOVE_FROM_PRIORITY,
    signal_strength: SignalStrength.WEAK,
    evidence_coverage: '0.55',
    trade_confirmation: TradeConfirmation.UNAVAILABLE,
    data_branch: DataBranch.B,
    data_status: DataStatus.COMPLETE,
    input_snapshot_hash: 'synthetic-item-0003-hash',
    versions: VERSIONS,
  },
  'ITEM-0004': {
    analysis_unit_id: 'ITEM-0004',
    available_at: T(60),
    recommendation: Recommendation.WITHHELD_DATA_INCOMPLETE,
    signal_strength: SignalStrength.NONE,
    evidence_coverage: '0.20',
    trade_confirmation: TradeConfirmation.UNAVAILABLE,
    data_branch: DataBranch.B,
    data_status: DataStatus.CONFLICTED,
    input_snapshot_hash: 'synthetic-item-0004-hash',
    versions: VERSIONS,
  },
  'ITEM-0005': {
    analysis_unit_id: 'ITEM-0005',
    available_at: T(48),
    recommendation: Recommendation.RECOMMENDED_CANDIDATE,
    signal_strength: SignalStrength.NONE,
    evidence_coverage: '0.61',
    trade_confirmation: TradeConfirmation.UNAVAILABLE,
    data_branch: DataBranch.B,
    data_status: DataStatus.STALE_GRACE,
    input_snapshot_hash: 'synthetic-item-0005-hash',
    versions: VERSIONS,
  },
  'ITEM-0006': {
    analysis_unit_id: 'ITEM-0006',
    available_at: T(44),
    recommendation: Recommendation.WITHHELD_DATA_INCOMPLETE,
    signal_strength: SignalStrength.NONE,
    evidence_coverage: '0.15',
    trade_confirmation: TradeConfirmation.UNAVAILABLE,
    data_branch: DataBranch.B,
    data_status: DataStatus.DATA_UNAVAILABLE_RUNTIME,
    input_snapshot_hash: 'synthetic-item-0006-hash',
    versions: VERSIONS,
  },
  'ITEM-0007': {
    analysis_unit_id: 'ITEM-0007',
    available_at: T(72),
    recommendation: Recommendation.WATCH,
    signal_strength: SignalStrength.WEAK,
    evidence_coverage: '0.71',
    trade_confirmation: TradeConfirmation.UNAVAILABLE,
    data_branch: DataBranch.B,
    data_status: DataStatus.COMPLETE,
    input_snapshot_hash: 'synthetic-item-0007-hash',
    versions: VERSIONS,
  },
  // Coverage is 0.00 because nothing was observed, not because the evidence was weak.
  'ITEM-0008': {
    analysis_unit_id: 'ITEM-0008',
    available_at: T(72),
    recommendation: Recommendation.WITHHELD_DATA_INCOMPLETE,
    signal_strength: SignalStrength.NONE,
    evidence_coverage: '0.00',
    trade_confirmation: TradeConfirmation.UNAVAILABLE,
    data_branch: DataBranch.B,
    data_status: DataStatus.COMPLETE,
    input_snapshot_hash: 'synthetic-item-0008-hash',
    versions: VERSIONS,
  },
  'ITEM-0009': {
    analysis_unit_id: 'ITEM-0009',
    available_at: T(72),
    recommendation: Recommendation.WITHHELD_DATA_INCOMPLETE,
    signal_strength: SignalStrength.NONE,
    evidence_coverage: '0.00',
    trade_confirmation: TradeConfirmation.UNAVAILABLE,
    data_branch: DataBranch.B,
    data_status: DataStatus.COMPLETE,
    input_snapshot_hash: 'synthetic-item-0009-hash',
    versions: VERSIONS,
  },
}

type DomainDef = {
  core: (typeof CoreDomain)[keyof typeof CoreDomain]
  strength: (typeof DomainStrength)[keyof typeof DomainStrength]
  keys: readonly string[]
  missing: Localized | null
  at: string
  status: (typeof DataStatus)[keyof typeof DataStatus]
}

const DOMAIN_DEFS: Readonly<Record<string, readonly DomainDef[]>> = {
  'ITEM-0001': [
    { core: CoreDomain.PRICE, strength: DomainStrength.STRONG, keys: ['unified_price_change_rate', 'robust_z_score'], missing: null, at: T(72), status: DataStatus.COMPLETE },
    { core: CoreDomain.DEMAND, strength: DomainStrength.MODERATE, keys: ['bid_depth_change'], missing: null, at: T(72), status: DataStatus.COMPLETE },
    { core: CoreDomain.SUPPLY, strength: DomainStrength.MODERATE, keys: ['sellable_supply_change'], missing: null, at: T(72), status: DataStatus.COMPLETE },
  ],
  'ITEM-0002': [
    { core: CoreDomain.PRICE, strength: DomainStrength.WEAK, keys: ['unified_price_change_rate'], missing: null, at: T(72), status: DataStatus.COMPLETE },
    { core: CoreDomain.DEMAND, strength: DomainStrength.MODERATE, keys: ['bid_depth_change'], missing: null, at: T(72), status: DataStatus.COMPLETE },
    { core: CoreDomain.SUPPLY, strength: DomainStrength.ABSENT, keys: [], missing: null, at: T(72), status: DataStatus.COMPLETE },
  ],
  'ITEM-0003': [
    { core: CoreDomain.PRICE, strength: DomainStrength.WEAK, keys: ['unified_price_change_rate'], missing: null, at: T(70), status: DataStatus.COMPLETE },
    { core: CoreDomain.DEMAND, strength: DomainStrength.ABSENT, keys: [], missing: null, at: T(70), status: DataStatus.COMPLETE },
    { core: CoreDomain.SUPPLY, strength: DomainStrength.WEAK, keys: ['sellable_supply_change'], missing: null, at: T(70), status: DataStatus.COMPLETE },
  ],
  'ITEM-0004': [
    {
      core: CoreDomain.PRICE,
      strength: DomainStrength.CONFLICTED,
      keys: [],
      missing: {
        zh: '两个来源的统一价格方向相反，超出离散度容忍',
        en: 'Two sources disagree on unified price direction beyond the dispersion tolerance',
      },
      at: T(60),
      status: DataStatus.CONFLICTED,
    },
    {
      core: CoreDomain.DEMAND,
      strength: DomainStrength.UNAVAILABLE,
      keys: [],
      missing: {
        zh: '该分支下求购深度按设计不提供',
        en: 'Bid depth is not provided by design on this branch',
      },
      at: T(60),
      status: DataStatus.UNAVAILABLE_BY_DESIGN,
    },
    {
      core: CoreDomain.SUPPLY,
      strength: DomainStrength.UNAVAILABLE,
      keys: [],
      missing: {
        zh: '运行期来源缺失且已超出宽限窗口',
        en: 'The source went missing at runtime and the grace window has expired',
      },
      at: T(60),
      status: DataStatus.DATA_UNAVAILABLE_RUNTIME,
    },
  ],
  'ITEM-0005': [
    { core: CoreDomain.PRICE, strength: DomainStrength.MODERATE, keys: ['unified_price_change_rate'], missing: null, at: T(48), status: DataStatus.STALE_GRACE },
    { core: CoreDomain.DEMAND, strength: DomainStrength.WEAK, keys: ['bid_depth_change'], missing: null, at: T(48), status: DataStatus.STALE_GRACE },
    { core: CoreDomain.SUPPLY, strength: DomainStrength.ABSENT, keys: [], missing: null, at: T(48), status: DataStatus.STALE_GRACE },
  ],
  'ITEM-0007': [
    { core: CoreDomain.PRICE, strength: DomainStrength.MODERATE, keys: ['unified_price_change_rate'], missing: null, at: T(72), status: DataStatus.COMPLETE },
    { core: CoreDomain.DEMAND, strength: DomainStrength.WEAK, keys: ['bid_depth_change'], missing: null, at: T(72), status: DataStatus.COMPLETE },
    { core: CoreDomain.SUPPLY, strength: DomainStrength.WEAK, keys: ['sellable_supply_change'], missing: null, at: T(72), status: DataStatus.COMPLETE },
  ],
  // Every domain is ABSENT because the query observed nothing, and the reason says only that.
  // It does not say the source cannot answer, that the identity does not exist, or that supply
  // is zero — none of which a zero-row response establishes.
  'ITEM-0008': [
    {
      core: CoreDomain.PRICE,
      strength: DomainStrength.ABSENT,
      keys: [],
      missing: {
        zh: '本次查询返回 0 条当前样本（ZERO_CURRENT_SAMPLE）。来源支持该查询，本时点没有匹配记录。',
        en: 'This query returned zero current samples (ZERO_CURRENT_SAMPLE). The source supports the query; nothing matched at this instant.',
      },
      at: T(72),
      status: DataStatus.COMPLETE,
    },
    {
      core: CoreDomain.DEMAND,
      strength: DomainStrength.ABSENT,
      keys: [],
      missing: {
        zh: '本次查询返回 0 条当前样本（ZERO_CURRENT_SAMPLE）。',
        en: 'This query returned zero current samples (ZERO_CURRENT_SAMPLE).',
      },
      at: T(72),
      status: DataStatus.COMPLETE,
    },
    {
      core: CoreDomain.SUPPLY,
      strength: DomainStrength.ABSENT,
      keys: [],
      missing: {
        zh: '本次查询返回 0 条当前样本（ZERO_CURRENT_SAMPLE）。这不构成对总供应量的任何陈述。',
        en: 'This query returned zero current samples (ZERO_CURRENT_SAMPLE). That states nothing about total supply.',
      },
      at: T(72),
      status: DataStatus.COMPLETE,
    },
  ],
  'ITEM-0009': [
    {
      core: CoreDomain.PRICE,
      strength: DomainStrength.ABSENT,
      keys: [],
      missing: {
        zh: '本次查询返回 0 条当前样本（ZERO_CURRENT_SAMPLE），且来源是否支持该查询为 UNKNOWN。两件事都未确定。',
        en: 'This query returned zero current samples (ZERO_CURRENT_SAMPLE) and the source capability is UNKNOWN. Neither question is settled.',
      },
      at: T(72),
      status: DataStatus.COMPLETE,
    },
    {
      core: CoreDomain.DEMAND,
      strength: DomainStrength.ABSENT,
      keys: [],
      missing: {
        zh: '本次查询返回 0 条当前样本（ZERO_CURRENT_SAMPLE），来源能力为 UNKNOWN。',
        en: 'This query returned zero current samples (ZERO_CURRENT_SAMPLE); source capability is UNKNOWN.',
      },
      at: T(72),
      status: DataStatus.COMPLETE,
    },
    {
      core: CoreDomain.SUPPLY,
      strength: DomainStrength.ABSENT,
      keys: [],
      missing: {
        zh: '本次查询返回 0 条当前样本（ZERO_CURRENT_SAMPLE），来源能力为 UNKNOWN。',
        en: 'This query returned zero current samples (ZERO_CURRENT_SAMPLE); source capability is UNKNOWN.',
      },
      at: T(72),
      status: DataStatus.COMPLETE,
    },
  ],
}

export function itemDomains(
  unitId: string,
  lang: Lang,
): readonly EvidenceDomainSnapshot[] {
  return (DOMAIN_DEFS[unitId] ?? []).map((def) => ({
    analysis_unit_id: unitId,
    scope_kind: ScopeKind.ITEM,
    domain: def.core,
    strength: def.strength,
    contributing_feature_keys: def.keys,
    missing_reason: def.missing ? pick(def.missing, lang) : null,
    policy_version: 'SYNTHETIC-pds-policy-v0',
    available_at: def.at,
    input_snapshot_hash: `synthetic-${unitId.toLowerCase()}-hash`,
    versions: VERSIONS,
    data_branch: DataBranch.B,
    data_status: def.status,
  }))
}

export const ITEM_TRANSITIONS: Readonly<Record<string, readonly StateTransition[]>> = {
  'ITEM-0001': [
    {
      analysis_unit_id: 'ITEM-0001',
      available_at: T(24),
      from_stage: ItemCycleStage.BASELINE,
      to_stage: ItemCycleStage.PRESSURE_BUILDING,
      reason: TransitionReason.PRESSURE_CONFIRMED,
      mode: TransitionMode.FORMAL,
      input_snapshot_hash: 'synthetic-item-0001-t1',
      versions: VERSIONS,
      data_branch: DataBranch.B,
      data_status: DataStatus.COMPLETE,
    },
    {
      analysis_unit_id: 'ITEM-0001',
      available_at: T(60),
      from_stage: ItemCycleStage.PRESSURE_BUILDING,
      to_stage: ItemCycleStage.CONFIRMED_UP,
      reason: TransitionReason.ABSOLUTE_RISE_CONFIRMED,
      mode: TransitionMode.FORMAL,
      input_snapshot_hash: 'synthetic-item-0001-t2',
      versions: VERSIONS,
      data_branch: DataBranch.B,
      data_status: DataStatus.COMPLETE,
    },
  ],
  'ITEM-0002': [
    {
      analysis_unit_id: 'ITEM-0002',
      available_at: T(36),
      from_stage: ItemCycleStage.BASELINE,
      to_stage: ItemCycleStage.PRESSURE_BUILDING,
      reason: TransitionReason.PRESSURE_CONFIRMED,
      mode: TransitionMode.FORMAL,
      input_snapshot_hash: 'synthetic-item-0002-t1',
      versions: VERSIONS,
      data_branch: DataBranch.B,
      data_status: DataStatus.COMPLETE,
    },
  ],
  'ITEM-0003': [
    {
      analysis_unit_id: 'ITEM-0003',
      available_at: T(12),
      from_stage: ItemCycleStage.CONFIRMED_UP,
      to_stage: ItemCycleStage.COOLING,
      reason: TransitionReason.COOLING_CONFIRMED,
      mode: TransitionMode.FORMAL,
      input_snapshot_hash: 'synthetic-item-0003-t1',
      versions: VERSIONS,
      data_branch: DataBranch.B,
      data_status: DataStatus.COMPLETE,
    },
  ],
  'ITEM-0004': [],
  'ITEM-0005': [
    {
      analysis_unit_id: 'ITEM-0005',
      available_at: T(30),
      from_stage: ItemCycleStage.BASELINE,
      to_stage: ItemCycleStage.PRESSURE_BUILDING,
      reason: TransitionReason.PRESSURE_CONFIRMED,
      mode: TransitionMode.FORMAL,
      input_snapshot_hash: 'synthetic-item-0005-t1',
      versions: VERSIONS,
      data_branch: DataBranch.B,
      data_status: DataStatus.COMPLETE,
    },
  ],
}

export const ITEM_CLAIMS: Readonly<Record<string, readonly ClaimCode[]>> = {
  'ITEM-0001': [
    ClaimCode.UNIFIED_PRICE_RISING,
    ClaimCode.BUY_DEMAND_STRENGTHENING,
    ClaimCode.SELLABLE_SUPPLY_DECLINING,
    ClaimCode.MULTI_SOURCE_ALIGNED,
  ],
  'ITEM-0002': [ClaimCode.BID_PRICE_RISING, ClaimCode.BUY_DEMAND_STRENGTHENING],
  'ITEM-0003': [ClaimCode.UNIFIED_PRICE_RISING],
  'ITEM-0004': [],
  'ITEM-0005': [ClaimCode.UNIFIED_PRICE_RISING],
}

export const LIFECYCLE_EVENTS: readonly LifecycleEvent[] = [
  {
    entity_kind: LifecycleEntityKind.CANDIDATE_EPISODE,
    entity_id: 'EPISODE-0001',
    analysis_unit_id: 'ITEM-0001',
    action: LifecycleAction.STARTED,
    occurred_at: T(24),
    previous_entity_id: null,
    resolution_code: null,
  },
  {
    entity_kind: LifecycleEntityKind.CYCLE_CASE,
    entity_id: 'CYCLE-0001',
    analysis_unit_id: 'ITEM-0001',
    action: LifecycleAction.CONVERTED,
    occurred_at: T(60),
    previous_entity_id: 'EPISODE-0001',
    resolution_code: null,
  },
  {
    entity_kind: LifecycleEntityKind.CYCLE_CASE,
    entity_id: 'CYCLE-0003',
    analysis_unit_id: 'ITEM-0003',
    action: LifecycleAction.CLOSED,
    occurred_at: T(70),
    previous_entity_id: null,
    resolution_code: ResolutionCode.RETURNED_TO_BASELINE,
  },
  {
    entity_kind: LifecycleEntityKind.CANDIDATE_EPISODE,
    entity_id: 'EPISODE-0005',
    analysis_unit_id: 'ITEM-0005',
    action: LifecycleAction.SUSPENDED,
    occurred_at: T(48),
    previous_entity_id: null,
    resolution_code: null,
  },
]

// All four OutcomeLabel values appear here on purpose: a fixture holding only success and
// failure would let a two-way "right/wrong" rendering pass its tests.
export const OUTCOMES: readonly OutcomeEvaluation[] = [
  {
    case_id: 'CYCLE-0003',
    analysis_unit_id: 'ITEM-0003',
    label: OutcomeLabel.FAILURE,
    validation_level: ValidationLevel.COMPONENT_BACKTEST,
    evaluated_at: T(71),
    resolution_code: ResolutionCode.RETURNED_TO_BASELINE,
    versions: VERSIONS,
  },
  {
    case_id: 'CYCLE-0009',
    analysis_unit_id: 'ITEM-0002',
    label: OutcomeLabel.INDETERMINATE_DATA_LOSS,
    validation_level: ValidationLevel.COMPONENT_BACKTEST,
    evaluated_at: T(66),
    resolution_code: ResolutionCode.DATA_LOSS,
    versions: VERSIONS,
  },
  {
    case_id: 'CYCLE-0008',
    analysis_unit_id: 'ITEM-0004',
    label: OutcomeLabel.INVALID_CASE,
    validation_level: ValidationLevel.COMPONENT_BACKTEST,
    evaluated_at: T(58),
    resolution_code: ResolutionCode.INVALID_INPUT,
    versions: VERSIONS,
  },
  {
    case_id: 'CYCLE-0007',
    analysis_unit_id: 'ITEM-0005',
    label: OutcomeLabel.SUCCESS,
    validation_level: ValidationLevel.COMPONENT_BACKTEST,
    evaluated_at: T(40),
    resolution_code: ResolutionCode.COMPLETED_UP_CYCLE,
    versions: VERSIONS,
  },
]

export const SOURCE_COVERAGE: readonly SourceCoverageRow[] = [
  {
    source_id: 'SYNTHETIC-SOURCE-1',
    observed_units: 5,
    last_observed_at: T(72),
    directness: Directness.DIRECT,
    data_status: DataStatus.COMPLETE,
  },
  {
    source_id: 'SYNTHETIC-SOURCE-2',
    observed_units: 4,
    last_observed_at: T(66),
    directness: Directness.DERIVED,
    data_status: DataStatus.DEGRADED_OPTIONAL,
  },
  {
    source_id: 'SYNTHETIC-SOURCE-3',
    observed_units: 2,
    last_observed_at: T(30),
    directness: Directness.INFERRED,
    data_status: DataStatus.STALE,
  },
]

const ISOLATED_EVENT_DEFS: readonly {
  at: string
  unit: string
  detail: Localized
}[] = [
  {
    at: T(60),
    unit: 'ITEM-0004',
    detail: {
      zh: '两个来源的统一价格方向相反，超出离散度容忍，该单品已隔离并暂停迁移。',
      en: 'Two sources disagreed on unified price direction beyond tolerance; the unit is isolated and its transitions are paused.',
    },
  },
  {
    at: T(48),
    unit: 'ITEM-0005',
    detail: {
      zh: '来源刷新中断，进入 STALE_GRACE；保留上一推荐但 signal_strength 置为 NONE。',
      en: 'The source refresh stalled and the unit entered STALE_GRACE; the previous recommendation is retained but signal_strength is set to NONE.',
    },
  },
]

export function isolatedEvents(lang: Lang) {
  return ISOLATED_EVENT_DEFS.map((def) => ({
    occurred_at: def.at,
    analysis_unit_id: def.unit,
    detail: pick(def.detail, lang),
  }))
}

const INDEX_MEMBER_DEFS: readonly { id: string; name: Localized; weight: string }[] = [
  { id: 'ITEM-0001', name: { zh: '合成标的 A', en: 'Synthetic unit A' }, weight: '0.30' },
  { id: 'ITEM-0002', name: { zh: '合成标的 B', en: 'Synthetic unit B' }, weight: '0.25' },
  { id: 'ITEM-0003', name: { zh: '合成标的 C', en: 'Synthetic unit C' }, weight: '0.20' },
  { id: 'ITEM-0005', name: { zh: '合成标的 E', en: 'Synthetic unit E' }, weight: '0.25' },
]

export function indexMembers(lang: Lang) {
  return INDEX_MEMBER_DEFS.map((def) => ({
    analysis_unit_id: def.id,
    display_name: pick(def.name, lang),
    weight: def.weight,
  }))
}

export const PAPER_VALIDATION_NOTE: Localized = {
  zh: '本页结果全部来自固定合成样本。当前验证等级为 COMPONENT_BACKTEST，按 claims.py 的约束，它不能声称 FULL_PDS_ALGORITHM_VALIDATED。',
  en: 'Everything on this page comes from a fixed synthetic sample. The current validation level is COMPONENT_BACKTEST, which under claims.py cannot assert FULL_PDS_ALGORITHM_VALIDATED.',
}

export const SUPPORTING_FACTORS = notProduced('supporting_factors', {
  zh: '产品设计要求每条观察结论同时给出支持因素；当前实现只产出 EvidenceDomainSnapshot 的贡献特征 key。',
  en: 'The product design requires every observation to name its supporting factors; the current implementation only emits contributing feature keys on EvidenceDomainSnapshot.',
})
export const PRIMARY_RISKS = notProduced('primary_risks', {
  zh: '产品设计要求同时展示主要风险；当前实现没有风险合同。',
  en: 'The product design requires primary risks to be shown alongside; the current implementation has no risk contract.',
})
export const INVALIDATION_CONDITIONS = notProduced('invalidation_conditions', {
  zh: '产品设计要求给出改变结论的条件；当前实现没有失效条件合同。',
  en: 'The product design requires the conditions that would change the conclusion; the current implementation has no invalidation contract.',
})
export const PROMOTION_REASON = notProduced('promotion_reason', {
  zh: '产品设计要求标的池展示晋级/降级原因；TransitionReason 只覆盖周期阶段迁移。',
  en: 'The product design requires promotion/demotion reasons in the pool view; TransitionReason only covers cycle-stage moves.',
})
