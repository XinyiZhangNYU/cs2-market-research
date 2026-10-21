// Mirrors repo/src/cs2_research/state_machine/enums.py verbatim.
// These string values are the machine contract. Chinese text belongs in labels.ts only.

export const ScopeKind = {
  MARKET: 'MARKET',
  SECTOR: 'SECTOR',
  ITEM: 'ITEM',
} as const
export type ScopeKind = (typeof ScopeKind)[keyof typeof ScopeKind]

// All three are ITEM-scope. A parent MHN, a style variant and an exact pattern are different
// economic identities, and fusion.py rejects mixing them in one snapshot — so they must never
// be averaged or merged into one price in the UI either.
export const AnalysisUnitKind = {
  BASE_MHN: 'BASE_MHN',
  STYLE_VARIANT: 'STYLE_VARIANT',
  PATTERN_VARIANT: 'PATTERN_VARIANT',
} as const
export type AnalysisUnitKind = (typeof AnalysisUnitKind)[keyof typeof AnalysisUnitKind]

export const DataBranch = {
  A: 'A',
  B: 'B',
} as const
export type DataBranch = (typeof DataBranch)[keyof typeof DataBranch]

export const DataStatus = {
  COMPLETE: 'COMPLETE',
  UNAVAILABLE_BY_DESIGN: 'UNAVAILABLE_BY_DESIGN',
  DEGRADED_OPTIONAL: 'DEGRADED_OPTIONAL',
  DATA_UNAVAILABLE_RUNTIME_GRACE: 'DATA_UNAVAILABLE_RUNTIME_GRACE',
  STALE_GRACE: 'STALE_GRACE',
  DATA_UNAVAILABLE_RUNTIME: 'DATA_UNAVAILABLE_RUNTIME',
  STALE: 'STALE',
  CONFLICTED: 'CONFLICTED',
} as const
export type DataStatus = (typeof DataStatus)[keyof typeof DataStatus]

export const FreshnessStatus = {
  FRESH: 'FRESH',
  STALE: 'STALE',
} as const
export type FreshnessStatus = (typeof FreshnessStatus)[keyof typeof FreshnessStatus]

export const FeatureValueStatus = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  CONFLICTED: 'CONFLICTED',
} as const
export type FeatureValueStatus =
  (typeof FeatureValueStatus)[keyof typeof FeatureValueStatus]

export const MissingCause = {
  BY_DESIGN: 'BY_DESIGN',
  RUNTIME: 'RUNTIME',
} as const
export type MissingCause = (typeof MissingCause)[keyof typeof MissingCause]

export const FeatureRequiredness = {
  REQUIRED: 'REQUIRED',
  OPTIONAL: 'OPTIONAL',
} as const
export type FeatureRequiredness =
  (typeof FeatureRequiredness)[keyof typeof FeatureRequiredness]

export const FeatureProvision = {
  EXPECTED: 'EXPECTED',
  UNAVAILABLE_BY_DESIGN: 'UNAVAILABLE_BY_DESIGN',
} as const
export type FeatureProvision =
  (typeof FeatureProvision)[keyof typeof FeatureProvision]

export const SemanticStatus = {
  CONFIRMED: 'CONFIRMED',
  PROVISIONAL: 'PROVISIONAL',
  UNKNOWN: 'UNKNOWN',
  INCOMPATIBLE: 'INCOMPATIBLE',
} as const
export type SemanticStatus = (typeof SemanticStatus)[keyof typeof SemanticStatus]

export const EvidenceType = {
  PRICE: 'PRICE',
  TRADE: 'TRADE',
  ORDERBOOK: 'ORDERBOOK',
  LISTING: 'LISTING',
  SUPPLY: 'SUPPLY',
  PLATFORM_DERIVED: 'PLATFORM_DERIVED',
  INFERENCE: 'INFERENCE',
  EXTERNAL_CONTEXT: 'EXTERNAL_CONTEXT',
} as const
export type EvidenceType = (typeof EvidenceType)[keyof typeof EvidenceType]

export const Directness = {
  DIRECT: 'DIRECT',
  DERIVED: 'DERIVED',
  INFERRED: 'INFERRED',
  UNKNOWN: 'UNKNOWN',
} as const
export type Directness = (typeof Directness)[keyof typeof Directness]

export const CoreDomain = {
  PRICE: 'P',
  DEMAND: 'D',
  SUPPLY: 'S',
} as const
export type CoreDomain = (typeof CoreDomain)[keyof typeof CoreDomain]

export const DomainStrength = {
  UNAVAILABLE: 'UNAVAILABLE',
  CONFLICTED: 'CONFLICTED',
  ABSENT: 'ABSENT',
  WEAK: 'WEAK',
  MODERATE: 'MODERATE',
  STRONG: 'STRONG',
} as const
export type DomainStrength = (typeof DomainStrength)[keyof typeof DomainStrength]

// Structured reason codes carried by result evidence domains. These are localization keys,
// never producer-authored prose; keeping them in the machine enum layer prevents arbitrary
// instructions or source names from crossing the formal display boundary.
export const DomainMissingReasonCode = {
  UNAVAILABLE_BY_DESIGN: 'UNAVAILABLE_BY_DESIGN',
  OPTIONAL_DATA_UNAVAILABLE: 'OPTIONAL_DATA_UNAVAILABLE',
  DATA_UNAVAILABLE_RUNTIME_GRACE: 'DATA_UNAVAILABLE_RUNTIME_GRACE',
  DATA_UNAVAILABLE_RUNTIME: 'DATA_UNAVAILABLE_RUNTIME',
  STALE_GRACE: 'STALE_GRACE',
  STALE: 'STALE',
  CONFLICTED_INPUTS: 'CONFLICTED_INPUTS',
} as const
export type DomainMissingReasonCode =
  (typeof DomainMissingReasonCode)[keyof typeof DomainMissingReasonCode]

export const SignalStrength = {
  NONE: 'NONE',
  WEAK: 'WEAK',
  MODERATE: 'MODERATE',
  STRONG: 'STRONG',
} as const
export type SignalStrength = (typeof SignalStrength)[keyof typeof SignalStrength]

export const ItemCycleStage = {
  BASELINE: 'BASELINE',
  PRESSURE_BUILDING: 'PRESSURE_BUILDING',
  CONFIRMED_UP: 'CONFIRMED_UP',
  COOLING: 'COOLING',
} as const
export type ItemCycleStage = (typeof ItemCycleStage)[keyof typeof ItemCycleStage]

export const MarketTrendStage = {
  UP_BUILDING: 'UP_BUILDING',
  UP_ACTIVE: 'UP_ACTIVE',
  UP_COOLING: 'UP_COOLING',
  NEUTRAL: 'NEUTRAL',
  DOWN_BUILDING: 'DOWN_BUILDING',
  DOWN_ACTIVE: 'DOWN_ACTIVE',
  DOWN_COOLING: 'DOWN_COOLING',
} as const
export type MarketTrendStage =
  (typeof MarketTrendStage)[keyof typeof MarketTrendStage]

export const MarketLevelRegime = {
  DEPRESSED: 'DEPRESSED',
  NORMAL: 'NORMAL',
  ELEVATED: 'ELEVATED',
  UNKNOWN: 'UNKNOWN',
} as const
export type MarketLevelRegime =
  (typeof MarketLevelRegime)[keyof typeof MarketLevelRegime]

export const SectorTrendStage = {
  UP_BUILDING: 'UP_BUILDING',
  UP_ACTIVE: 'UP_ACTIVE',
  UP_COOLING: 'UP_COOLING',
  NEUTRAL: 'NEUTRAL',
  DOWN_BUILDING: 'DOWN_BUILDING',
  DOWN_ACTIVE: 'DOWN_ACTIVE',
  DOWN_COOLING: 'DOWN_COOLING',
} as const
export type SectorTrendStage =
  (typeof SectorTrendStage)[keyof typeof SectorTrendStage]

export const RelativeStrength = {
  LEADING: 'LEADING',
  IN_LINE: 'IN_LINE',
  LAGGING: 'LAGGING',
  UNKNOWN: 'UNKNOWN',
} as const
export type RelativeStrength =
  (typeof RelativeStrength)[keyof typeof RelativeStrength]

export const EvidenceFlag = {
  DEMAND_ACCELERATING: 'DEMAND_ACCELERATING',
  SUPPLY_CONTRACTING: 'SUPPLY_CONTRACTING',
  PRICE_RISING: 'PRICE_RISING',
  SUSPECTED_SWEEPING: 'SUSPECTED_SWEEPING',
  SWEEPING_CONFIRMED: 'SWEEPING_CONFIRMED',
  REACCELERATION: 'REACCELERATION',
  OVERHEATED: 'OVERHEATED',
  SHOCK: 'SHOCK',
  BREADTH_COLLAPSE: 'BREADTH_COLLAPSE',
  LIQUIDITY_CONTRACTION: 'LIQUIDITY_CONTRACTION',
  CONCENTRATION_WARNING: 'CONCENTRATION_WARNING',
} as const
export type EvidenceFlag = (typeof EvidenceFlag)[keyof typeof EvidenceFlag]

export const RegimeRelation = {
  MARKET_DRIVEN: 'MARKET_DRIVEN',
  SECTOR_DRIVEN: 'SECTOR_DRIVEN',
  ITEM_SPECIFIC: 'ITEM_SPECIFIC',
  COUNTER_REGIME: 'COUNTER_REGIME',
  IN_LINE: 'IN_LINE',
  UNKNOWN: 'UNKNOWN',
} as const
export type RegimeRelation = (typeof RegimeRelation)[keyof typeof RegimeRelation]

export const Recommendation = {
  IGNORE: 'IGNORE',
  WATCH: 'WATCH',
  RECOMMENDED_CANDIDATE: 'RECOMMENDED_CANDIDATE',
  STRONG_CANDIDATE: 'STRONG_CANDIDATE',
  OVERHEATED_DO_NOT_CHASE: 'OVERHEATED_DO_NOT_CHASE',
  COOLING_REMOVE_FROM_PRIORITY: 'COOLING_REMOVE_FROM_PRIORITY',
  WITHHELD_DATA_INCOMPLETE: 'WITHHELD_DATA_INCOMPLETE',
} as const
export type Recommendation = (typeof Recommendation)[keyof typeof Recommendation]

export const TradeConfirmation = {
  UNAVAILABLE: 'UNAVAILABLE',
  AVAILABLE_NOT_CONFIRMED: 'AVAILABLE_NOT_CONFIRMED',
  CONFIRMED: 'CONFIRMED',
} as const
export type TradeConfirmation =
  (typeof TradeConfirmation)[keyof typeof TradeConfirmation]

export const CaseStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  RESOLVED: 'RESOLVED',
  UNRESOLVED: 'UNRESOLVED',
  RETRACTED: 'RETRACTED',
} as const
export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus]

export const ResolutionCode = {
  COMPLETED_UP_CYCLE: 'COMPLETED_UP_CYCLE',
  RETURNED_TO_BASELINE: 'RETURNED_TO_BASELINE',
  TREND_REVERSED: 'TREND_REVERSED',
  NO_CONFIRMATION: 'NO_CONFIRMATION',
  DATA_LOSS: 'DATA_LOSS',
  INVALID_INPUT: 'INVALID_INPUT',
} as const
export type ResolutionCode = (typeof ResolutionCode)[keyof typeof ResolutionCode]

export const TransitionMode = {
  FORMAL: 'FORMAL',
  SHADOW: 'SHADOW',
} as const
export type TransitionMode = (typeof TransitionMode)[keyof typeof TransitionMode]

export const TransitionReason = {
  PRESSURE_CONFIRMED: 'PRESSURE_CONFIRMED',
  ABSOLUTE_RISE_CONFIRMED: 'ABSOLUTE_RISE_CONFIRMED',
  PRESSURE_DISSIPATED: 'PRESSURE_DISSIPATED',
  COOLING_CONFIRMED: 'COOLING_CONFIRMED',
  REACCELERATION: 'REACCELERATION',
  RETURNED_TO_BASELINE: 'RETURNED_TO_BASELINE',
  FAST_PATH_THEORETICAL: 'FAST_PATH_THEORETICAL',
} as const
export type TransitionReason =
  (typeof TransitionReason)[keyof typeof TransitionReason]

export const LifecycleEntityKind = {
  ANALYSIS_CASE: 'ANALYSIS_CASE',
  CANDIDATE_EPISODE: 'CANDIDATE_EPISODE',
  CYCLE_CASE: 'CYCLE_CASE',
} as const
export type LifecycleEntityKind =
  (typeof LifecycleEntityKind)[keyof typeof LifecycleEntityKind]

export const LifecycleAction = {
  STARTED: 'STARTED',
  CONVERTED: 'CONVERTED',
  SUSPENDED: 'SUSPENDED',
  RESUMED: 'RESUMED',
  REACCELERATED: 'REACCELERATED',
  CLOSED: 'CLOSED',
} as const
export type LifecycleAction = (typeof LifecycleAction)[keyof typeof LifecycleAction]

export const OutcomeLabel = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  INDETERMINATE_DATA_LOSS: 'INDETERMINATE_DATA_LOSS',
  INVALID_CASE: 'INVALID_CASE',
} as const
export type OutcomeLabel = (typeof OutcomeLabel)[keyof typeof OutcomeLabel]

export const ValidationLevel = {
  PRICE_ONLY: 'PRICE_ONLY',
  COMPONENT_BACKTEST: 'COMPONENT_BACKTEST',
  PROSPECTIVE_FULL_SIGNAL: 'PROSPECTIVE_FULL_SIGNAL',
  WALK_FORWARD_OUT_OF_SAMPLE: 'WALK_FORWARD_OUT_OF_SAMPLE',
} as const
export type ValidationLevel = (typeof ValidationLevel)[keyof typeof ValidationLevel]

export const ValidationClaim = {
  COMPONENTS_EXECUTE_POINT_IN_TIME: 'COMPONENTS_EXECUTE_POINT_IN_TIME',
  PRICE_FEATURES_HAVE_HISTORICAL_ASSOCIATION:
    'PRICE_FEATURES_HAVE_HISTORICAL_ASSOCIATION',
  FULL_PDS_ALGORITHM_VALIDATED: 'FULL_PDS_ALGORITHM_VALIDATED',
} as const
export type ValidationClaim = (typeof ValidationClaim)[keyof typeof ValidationClaim]

export const ClaimCode = {
  UNIFIED_PRICE_RISING: 'UNIFIED_PRICE_RISING',
  BID_PRICE_RISING: 'BID_PRICE_RISING',
  BUY_DEMAND_STRENGTHENING: 'BUY_DEMAND_STRENGTHENING',
  SELLABLE_SUPPLY_DECLINING: 'SELLABLE_SUPPLY_DECLINING',
  MULTI_SOURCE_ALIGNED: 'MULTI_SOURCE_ALIGNED',
  TRUSTED_TRADE_VOLUME_INCREASING: 'TRUSTED_TRADE_VOLUME_INCREASING',
  SWEEPING_CONFIRMED: 'SWEEPING_CONFIRMED',
} as const
export type ClaimCode = (typeof ClaimCode)[keyof typeof ClaimCode]

export const BLOCKING_DATA_STATUSES: readonly DataStatus[] = [
  DataStatus.DATA_UNAVAILABLE_RUNTIME,
  DataStatus.STALE,
  DataStatus.CONFLICTED,
]

export const GRACEABLE_DATA_STATUSES: readonly DataStatus[] = [
  DataStatus.DATA_UNAVAILABLE_RUNTIME,
  DataStatus.STALE,
]

export const DERIVED_GRACE_DATA_STATUSES: readonly DataStatus[] = [
  DataStatus.DATA_UNAVAILABLE_RUNTIME_GRACE,
  DataStatus.STALE_GRACE,
]

export const EVIDENCE_BEARING_STRENGTHS: readonly DomainStrength[] = [
  DomainStrength.WEAK,
  DomainStrength.MODERATE,
  DomainStrength.STRONG,
]
