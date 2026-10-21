// A field is PRODUCED only if the Python contract in src/cs2_research emits it today.
// Anything the prototype needs but the implementation does not emit stays NOT_PRODUCED and
// carries no value at all, so a plausible-looking number cannot be rendered by accident.

import type { Localized } from '../i18n'

export type Produced<T> = { readonly provenance: 'PRODUCED'; readonly value: T }

export type NotProduced = {
  readonly provenance: 'NOT_PRODUCED'
  readonly status: 'CONTRACT_PROPOSAL'
  readonly proposedAs: string
  readonly note: Localized
}

export type Field<T> = Produced<T> | NotProduced

// A frontend summary of member fields is neither PRODUCED nor NOT_PRODUCED. It is derived
// here from values the members already carry. Do not fold this into Field<T>: a collection
// field stays unproduced even when every member agrees, and the summary must not look like
// a produced collection scalar.
export type DerivedFromMembers<T> = {
  readonly provenance: 'DERIVED_FROM_MEMBERS'
  readonly member_count: number
  readonly reported_count: number
  readonly buckets: readonly { readonly value: T; readonly count: number }[]
}

export type DerivedSpan<T> = {
  readonly provenance: 'DERIVED_FROM_MEMBERS'
  readonly member_count: number
  readonly reported_count: number
  readonly earliest: T
  readonly latest: T
}

export function produced<T>(value: T): Produced<T> {
  return { provenance: 'PRODUCED', value }
}

export function notProduced(proposedAs: string, note: Localized): NotProduced {
  return { provenance: 'NOT_PRODUCED', status: 'CONTRACT_PROPOSAL', proposedAs, note }
}

export function isProduced<T>(field: Field<T>): field is Produced<T> {
  return field.provenance === 'PRODUCED'
}

export type ContractProposal = {
  readonly proposedAs: string
  readonly requestedBy: Localized
  readonly note: Localized
}

// Every page-level field the prototype wants but the current implementation does not emit.
// The list is the frontend's explicit contract request; none of these fields is assumed.
export const CONTRACT_PROPOSALS: readonly ContractProposal[] = [
  {
    proposedAs: 'as_of',
    requestedBy: { zh: '每一页的页眉', en: 'every page header' },
    note: {
      zh: '状态快照只产出 available_at。特征层的 as_of 是特征窗口的截止时点，不是 scope 级研究截止时点；把它提升为页面字段需要一个状态与特征的联接，目前没有实现。',
      en: 'State snapshots emit available_at only. The as_of on the feature layer is a feature-window end, not a scope-level research cutoff; promoting it to a page field needs a state/feature join that is not implemented.',
    },
  },
  {
    proposedAs: 'analysis_unit_kind',
    requestedBy: { zh: '任何显示单品身份的位置', en: 'anything showing an item identity' },
    note: {
      zh: 'AnalysisUnitKind（BASE_MHN / STYLE_VARIANT / PATTERN_VARIANT）只在特征与融合层产出，ItemStateSnapshot 不携带它。三者同为 ITEM scope，却是不同的经济身份，fusion.py 拒绝跨粒度融合。需要的是随结果返回、经 PIT catalog 绑定的身份投影，而不是由前端解析 analysis_unit_id 字符串或从状态快照反推。',
      en: 'AnalysisUnitKind (BASE_MHN / STYLE_VARIANT / PATTERN_VARIANT) is emitted only on the feature and fusion types; ItemStateSnapshot does not carry it. All three are ITEM scope yet different economic identities, and fusion.py refuses to fuse across them. What is needed is an identity projection returned with the result through a PIT catalog binding, not granularity parsed out of the analysis_unit_id string or inferred from a state snapshot.',
    },
  },
  {
    proposedAs: 'edition_kind',
    requestedBy: { zh: '任何显示单品身份的位置', en: 'anything showing an item identity' },
    note: {
      zh: 'catalog 的 ItemVariantVersion 允许 STANDARD / STATTRAK / SOUVENIR / UNKNOWN 四个值，其中 UNKNOWN 表示尚未解析；没有任何状态快照携带 edition_kind。前端必须按四值建模，UNKNOWN 不得折叠成 STANDARD；需要的是结果身份投影上的四值字段。',
      en: 'In catalog, ItemVariantVersion admits STANDARD, STATTRAK, SOUVENIR and UNKNOWN, where UNKNOWN means not yet resolved; no state snapshot carries edition_kind. A frontend must model all four values and never fold UNKNOWN into STANDARD; what is needed is a four-valued field on the result identity projection.',
    },
  },
  {
    proposedAs: 'source_coverage',
    requestedBy: { zh: '数据质量、单品详情', en: 'data quality, item detail' },
    note: {
      zh: '数值层保留了来源覆盖，但没有任何状态快照按 scope 重新导出覆盖摘要。',
      en: 'The numeric layer retains source coverage, but no state snapshot re-exports a per-scope coverage summary.',
    },
  },
  {
    proposedAs: 'supporting_factors / primary_risks / invalidation_conditions',
    requestedBy: { zh: '单品详情、信号与案例', en: 'item detail, signals and cases' },
    note: {
      zh: '产品设计要求每条观察结论同时给出支持因素、主要风险和改变结论的条件。证据层带有贡献特征的血缘，但还没有可渲染的风险/失效条件合同。',
      en: 'The product design requires every observation to show support, risk and what would change the conclusion. The evidence layer carries contributor lineage, but no rendered risk/invalidation contract exists.',
    },
  },
  {
    proposedAs: 'inference_confidence / primary_error_sources',
    requestedBy: { zh: '任何展示推断量的位置', en: 'anything rendering an inferred quantity' },
    note: {
      zh: '展示推断量时需要同时给出“推断”标签、置信度和主要误差来源。Directness.INFERRED 已产出，置信度和误差来源没有。',
      en: 'An inferred quantity needs an inferred label plus confidence and main error sources. Directness.INFERRED is emitted; confidence and error sources are not.',
    },
  },
  {
    proposedAs: 'promotion_reason / demotion_reason',
    requestedBy: { zh: '标的池', en: 'candidate pool' },
    note: {
      zh: '标的池需要展示晋级/降级原因。TransitionReason 只覆盖周期阶段迁移，不覆盖池层级变动。',
      en: 'The pool view needs promotion/demotion reasons. TransitionReason covers cycle-stage moves, not pool-tier moves.',
    },
  },
  {
    proposedAs: 'pool_tier',
    requestedBy: { zh: '标的池', en: 'candidate pool' },
    note: {
      zh: 'L1–L3 标的池层级是产品概念，在 state_machine/enums.py 中没有对应枚举。',
      en: 'The L1-L3 pool tier is a product concept with no enum in state_machine/enums.py.',
    },
  },
  {
    proposedAs: 'collection_envelope.as_of / collection_envelope.available_at / collection_envelope.data_status / collection_envelope.data_branch / collection_envelope.versions',
    requestedBy: { zh: '任何一次答复多个 analysis unit 的页面', en: 'any page answering for many analysis units' },
    note: {
      zh: '状态快照只在单个 analysis unit 上产出 available_at / data_status / data_branch / versions，没有集合层的对应字段。成员取值一致也不算——那是成员的性质，不是集合有这个字段。真正的集合类型应同时携带集合级 as_of、data_branch 以及 missing_member_ids / unavailable_member_ids，由状态层产出，而不是由前端折算。',
      en: 'State snapshots emit available_at, data_status, data_branch and versions per analysis unit; no collection-level counterpart exists. Members agreeing on a value does not count — that is a property of the members, not evidence the collection has the field. A real collection type carries a collection-level as_of and data_branch together with missing_member_ids and unavailable_member_ids, produced by the state layer rather than collapsed by the frontend.',
    },
  },
  {
    proposedAs: 'claims.py English renderings',
    requestedBy: { zh: '单品详情的可用结论', en: 'publishable claims on item detail' },
    note: {
      zh: 'claims.py 的 _ZH_RENDERING 只定义中文措辞。结论措辞受约束——分支 B 的措辞上限就实现在同一个文件里——所以英文措辞不能由前端自行发明，必须先写进 claims.py。',
      en: 'The _ZH_RENDERING table in claims.py defines Chinese wording only. Claim wording is constrained — the branch-B wording cap lives in the same file — so English wording cannot be invented by the frontend and has to be added to claims.py first.',
    },
  },
  {
    proposedAs: 'remaining producer-text display contract',
    requestedBy: { zh: '展示名与 mock 详情文本', en: 'display names and mock detail text' },
    note: {
      zh: '正式 missing_reason 已改为受控代码并由前端本地化。display_name、隔离事件详情等 mock 文本仍没有正式展示合同，不能沿用 missing_reason 的处理方式直接放行。',
      en: 'Formal missing_reason now uses controlled codes localized by the frontend. Mock text such as display_name and isolated-event detail still lacks a formal display contract and cannot reuse the missing_reason treatment.',
    },
  },
]
