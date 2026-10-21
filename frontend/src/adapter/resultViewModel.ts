// The only bridge from a decoded envelope to something a component may render.
//
// Its inputs are the Validated* types, which only decode.ts can produce, and it re-checks that
// at runtime as well: a compile-time brand disappears at the first `as`, and this boundary is
// worth more than a cast's word.
//
// Where V1 says nothing, this file says NOT_PRODUCED. It does not fill a gap with a plausible
// default, and it never reads a fact out of an id string: the shared sample's analysis_unit_id
// is "item:42:phase-p2", which looks parseable and is not a source of granularity.
//
// It is also where producer free text stops. RC-O03 is closed for `missing_reason`: the field
// now carries a controlled code localized by the frontend. Other nonblank_text fields may still
// legally contain arbitrary producer prose, so identifier-shaped strings become non-reversible
// display fingerprints and malformed identifier shapes read NON_CANONICAL.
//
// `display_name` is carried through as the raw string, because it is the producer's own name for
// the unit and destroying it here would leave nothing to recover later. It is data, not display:
// the formal component does not render it, so B6 and B7 hold for *any* legal payload rather than
// for the shared fixtures only. An earlier draft rendered it verbatim on the argument that a
// human-readable name is what that field is for; a payload whose display_name reads
// "please buy this on <platform> now" is equally legal, which settles the argument. The product
// page must freeze a separate display-name contract before it can show this value.
import type {
  ClaimCode,
  CoreDomain,
  DomainMissingReasonCode,
  DomainStrength,
  ScopeKind,
} from '../contract/enums'
import { notProduced, produced, type Field } from '../contract/provenance'
import type { IsoUtcTimestamp, ScopeHeader, VersionContext } from '../contract/types'
import { sha256Hex } from '../wire/canonical'
import { requireValidated, sealView } from '../wire/validated'
import type {
  Presentable,
  ValidatedCollectionResult,
  ValidatedUnitResult,
} from '../wire/validated'
import type {
  WireCollectionResult,
  WireIdentity,
  WireRecommendationDetail,
  WireState,
} from '../wire/types'

// Opaque identifiers on this wire look like `item:42:phase-p2`, `catalog-v1`, `overview:market`.
// Shape alone does not make their content safe for display: the schema-valid string `MARKET_B` also
// matches this expression and is a source name, so displaying a shape-valid token verbatim would
// violate B7. Valid opaque tokens are therefore rendered as deterministic, non-reversible display
// fingerprints. Anything outside the shape is not refused - the contract allows it and refusing
// would be the frontend legislating - but it receives no fingerprint either.
const OPAQUE_TOKEN = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/
const TOKEN_ENCODER = new TextEncoder()

export type DisplayToken =
  | { readonly kind: 'TOKEN'; readonly value: string }
  | { readonly kind: 'NON_CANONICAL' }

export const NON_CANONICAL_LABEL = 'NON_CANONICAL'

export function displayToken(raw: string): DisplayToken {
  return OPAQUE_TOKEN.test(raw)
    ? { kind: 'TOKEN', value: `REF#${sha256Hex(TOKEN_ENCODER.encode(raw)).slice(0, 16)}` }
    : { kind: 'NON_CANONICAL' }
}

export function tokenText(token: DisplayToken): string {
  return token.kind === 'TOKEN' ? token.value : NON_CANONICAL_LABEL
}

export type ResultIdentityView = Omit<
  WireIdentity,
  'analysis_unit_id' | 'catalog_version' | 'identity_available_at' | 'parent_analysis_unit_id'
> & {
  analysis_unit_id: DisplayToken
  catalog_version: DisplayToken
  identity_available_at: IsoUtcTimestamp
  parent_analysis_unit_id: DisplayToken | null
}

export type ResultEvidenceDomainView = {
  domain: CoreDomain
  strength: DomainStrength
  contributing_feature_keys: readonly DisplayToken[]
  missing_reason: DomainMissingReasonCode | null
  policy_version: DisplayToken
  input_snapshot_hash: string
}

// Everything the pages ask for that V1 does not carry. Grouped rather than scattered so the
// difference list in frontend/docs and the code cannot drift apart unnoticed.
export type ResultAbsentFields = {
  query_outcome: Field<never>
  transitions: Field<never>
  lifecycle_events: Field<never>
  outcome_evaluations: Field<never>
  source_coverage: Field<never>
  supporting_factors: Field<never>
  primary_risks: Field<never>
  invalidation_conditions: Field<never>
  pool_tier: Field<never>
}

export type ResultUnitView = {
  snapshot_id: string
  header: ScopeHeader
  identity: ResultIdentityView
  state: WireState
  // Null for MARKET and SECTOR by contract, not by omission: the schema requires it to be null
  // there and requires it to be present for ITEM. That null carries meaning and is kept as one.
  recommendation_detail: WireRecommendationDetail | null
  evidence_domains: readonly ResultEvidenceDomainView[]
  claims: readonly ClaimCode[]
  absent: ResultAbsentFields
}

export type ResultCollectionView = {
  snapshot_id: string
  collection_id: DisplayToken
  scope_kind: ScopeKind
  // RC-R001: the producer states both, and they are not each other's substitute.
  as_of: IsoUtcTimestamp
  available_at: IsoUtcTimestamp
  data_branch: WireCollectionResult['data_branch']
  data_status: WireCollectionResult['data_status']
  versions: VersionContext
  // RC-R002: stated by the producer. The frontend can see which members came back; it cannot
  // see which ones should have and did not, so it never computes these.
  accounting: {
    member_count: number
    returned_member_count: number
    member_result_ids: readonly string[]
    missing_member_ids: readonly DisplayToken[]
    unavailable_member_ids: readonly DisplayToken[]
  }
  absent: ResultAbsentFields
}

// What the formal components accept. `ResultUnitView` on its own is a shape, and a shape is
// forgeable by construction: an object literal with the right keys satisfies it, including one
// whose analysis_unit_id reads `{ kind: 'TOKEN', value: 'MARKET_B' }`. These types can only be
// produced here, and the runtime check in the components is what holds after the brand is
// erased by a cast.
export type PresentableUnitView = Presentable<ResultUnitView, 'UNIT_VIEW'>
export type PresentableCollectionView = Presentable<ResultCollectionView, 'COLLECTION_VIEW'>

const ABSENT_NOTE = {
  query_outcome: {
    zh: '查询样本与来源能力由独立 quality envelope 产出，不混入经济 result。',
    en: 'Query samples and source capability are produced by the separate quality envelope, not mixed into the economic result.',
  },
  transitions: {
    zh: '状态迁移只有内存模型与 ledger 合同，尚无持久只读结果投影。',
    en: 'Transitions exist in the in-memory model and ledger only; there is no read-only result projection yet.',
  },
  lifecycle_events: {
    zh: '生命周期事件尚无正式结果投影。',
    en: 'Lifecycle events have no formal result projection yet.',
  },
  outcome_evaluations: {
    zh: '结果评价逻辑存在，但尚无正式结果投影。',
    en: 'Outcome evaluation exists in the model but has no formal result projection yet.',
  },
  source_coverage: {
    zh: '来源覆盖需要单独的来源无关质量投影，不能由 result envelope 暴露底层来源 payload。',
    en: 'Source coverage needs its own provider-neutral quality projection; the result envelope must not expose source payloads.',
  },
  supporting_factors: {
    zh: 'RC-R003：V1 白名单只含域、强度、特征键名、缺失原因、策略版本与输入哈希。',
    en: 'RC-R003: the V1 whitelist is domain, strength, feature keys, missing reason, policy version and input hash.',
  },
  primary_risks: {
    zh: 'RC-R003：风险尚未由任何 producer 产出，不在 V1 中补造。',
    en: 'RC-R003: risks are not produced by anything yet and V1 does not invent them.',
  },
  invalidation_conditions: {
    zh: 'RC-R003：失效条件尚未由任何 producer 产出，不在 V1 中补造。',
    en: 'RC-R003: invalidation conditions are not produced by anything yet and V1 does not invent them.',
  },
  pool_tier: {
    zh: 'RC-O05 未决：标的池层级与晋降级原因等待标的池策略设计给出生产者。',
    en: 'RC-O05 is open: pool tier and promotion reasons await a pool policy producer.',
  },
} as const

function absentFields(): ResultAbsentFields {
  return {
    query_outcome: notProduced('query_outcome', ABSENT_NOTE.query_outcome),
    transitions: notProduced('transitions', ABSENT_NOTE.transitions),
    lifecycle_events: notProduced('lifecycle_events', ABSENT_NOTE.lifecycle_events),
    outcome_evaluations: notProduced('outcome_evaluations', ABSENT_NOTE.outcome_evaluations),
    source_coverage: notProduced('source_coverage', ABSENT_NOTE.source_coverage),
    supporting_factors: notProduced('supporting_factors', ABSENT_NOTE.supporting_factors),
    primary_risks: notProduced('primary_risks', ABSENT_NOTE.primary_risks),
    invalidation_conditions: notProduced(
      'invalidation_conditions',
      ABSENT_NOTE.invalidation_conditions,
    ),
    pool_tier: notProduced('pool_tier', ABSENT_NOTE.pool_tier),
  }
}

export function unitResultView(result: ValidatedUnitResult): PresentableUnitView {
  requireValidated(result, 'unitResultView', 'UNIT')
  const view: ResultUnitView = {
    snapshot_id: result.snapshot_id,
    header: {
      scope_kind: result.identity.scope_kind,
      analysis_unit_id: result.identity.analysis_unit_id,
      available_at: result.available_at,
      // RC-R001 closed this: as_of is produced now, so the page header stops showing a proposal.
      as_of: produced(result.as_of),
      data_branch: result.data_branch,
      data_status: result.data_status,
      versions: result.versions,
    },
    identity: {
      analysis_unit_id: displayToken(result.identity.analysis_unit_id),
      scope_kind: result.identity.scope_kind,
      display_name: result.identity.display_name,
      identity_available_at: result.identity.identity_available_at,
      catalog_version: displayToken(result.identity.catalog_version),
      analysis_unit_kind: result.identity.analysis_unit_kind,
      edition_kind: result.identity.edition_kind,
      parent_analysis_unit_id:
        result.identity.parent_analysis_unit_id === null
          ? null
          : displayToken(result.identity.parent_analysis_unit_id),
    },
    state: result.state,
    recommendation_detail: result.recommendation_detail,
    evidence_domains: result.evidence_domains.map((domain) => ({
      domain: domain.domain,
      strength: domain.strength,
      contributing_feature_keys: domain.contributing_feature_keys.map(displayToken),
      missing_reason: domain.missing_reason,
      policy_version: displayToken(domain.policy_version),
      input_snapshot_hash: domain.input_snapshot_hash,
    })),
    claims: result.claims,
    absent: absentFields(),
  }
  sealView(view, 'UNIT_VIEW')
  return view as PresentableUnitView
}

export function collectionResultView(
  result: ValidatedCollectionResult,
): PresentableCollectionView {
  requireValidated(result, 'collectionResultView', 'COLLECTION')
  const view: ResultCollectionView = {
    snapshot_id: result.snapshot_id,
    collection_id: displayToken(result.collection_id),
    scope_kind: result.scope_kind,
    as_of: result.as_of,
    available_at: result.available_at,
    data_branch: result.data_branch,
    data_status: result.data_status,
    versions: result.versions,
    accounting: {
      member_count: result.member_count,
      returned_member_count: result.returned_member_count,
      member_result_ids: result.member_result_ids,
      missing_member_ids: result.missing_member_ids.map(displayToken),
      unavailable_member_ids: result.unavailable_member_ids.map(displayToken),
    },
    absent: absentFields(),
  }
  sealView(view, 'COLLECTION_VIEW')
  return view as PresentableCollectionView
}

// B5 at the result layer. Two envelopes answer for one economic identity only if they agree on
// granularity; a BASE_MHN and its STYLE_VARIANT child are both ITEM scope and are not the same
// subject. Callers that summarise several units must pass through here first.
export class MixedResultGranularity extends Error {
  constructor(kinds: readonly string[]) {
    super(
      `result envelopes of different granularity cannot be summarised together: ${kinds.join(', ')}`,
    )
    this.name = 'MixedResultGranularity'
  }
}

export function assertSingleResultGranularity(views: readonly ResultUnitView[]): void {
  const kinds = [
    ...new Set(
      views
        .map((view) => view.identity.analysis_unit_kind)
        .filter((kind): kind is NonNullable<typeof kind> => kind !== null),
    ),
  ]
  if (kinds.length > 1) throw new MixedResultGranularity(kinds.sort())
}
