// The scalar-type half of the drift gate.
//
// FE-RC-001B's drift test compared field names and enum members, so renaming a field or adding
// an enum value failed - but changing `advancing_member_ratio` from `string | null` to
// `number | null` passed typecheck and the whole suite. A ratio silently becoming a float is
// exactly the drift that matters: the wire carries decimals as strings so nothing rounds.
//
// Each table below is written in the TypeScript type's own vocabulary through `FieldTags<T>`,
// which computes the tag from the declared field type. That gives two independent failures:
//
//   compile time - change the TypeScript field type and its literal tag no longer matches,
//                  so `npm run build` / `npx tsc --noEmit` fails here;
//   run time     - tests/wire-schema.test.ts reads the same tag out of the schema, so a change
//                  on the contract side fails there.
import type { VersionContext } from '../contract/types'
import type { TextTag, TypeTag } from './schema'
import type {
  WireCollectionResult,
  WireEvidenceDomain,
  WireIdentity,
  WireItemState,
  WireMarketState,
  WireRecommendationDetail,
  WireSectorBreadth,
  WireSectorState,
  WireUnitResult,
} from './types'

type Scalar = 'string' | 'number' | 'boolean' | 'object'

type BaseTag<Value> = [Exclude<Value, null>] extends [boolean]
  ? 'boolean'
  : [Exclude<Value, null>] extends [string]
    ? 'string'
    : [Exclude<Value, null>] extends [number]
      ? 'number'
      : [Exclude<Value, null>] extends [readonly (infer Element)[]]
        ? `array<${BaseTag<Element> & Scalar}>`
        : [Exclude<Value, null>] extends [object]
          ? 'object'
          : never

export type Tag<Value> = null extends Value ? `${BaseTag<Value> & string}|null` : BaseTag<Value>

export type FieldTags<Shape> = { readonly [Key in keyof Shape]-?: Tag<Shape[Key]> }

const IDENTITY_TAGS: FieldTags<WireIdentity> = {
  analysis_unit_id: 'string',
  scope_kind: 'string',
  display_name: 'string',
  identity_available_at: 'string',
  catalog_version: 'string',
  analysis_unit_kind: 'string|null',
  edition_kind: 'string|null',
  parent_analysis_unit_id: 'string|null',
}

const VERSIONS_TAGS: FieldTags<VersionContext> = {
  catalog_version: 'string',
  group_version: 'string',
  index_version: 'string',
  fusion_method_version: 'string',
  feature_profile_version: 'string',
  algorithm_version: 'string',
  parameter_set_version: 'string',
  stage_policy_version: 'string',
  failure_policy_version: 'string',
}

const MARKET_STATE_TAGS: FieldTags<WireMarketState> = {
  trend_stage: 'string',
  level_regime: 'string',
  evidence_flags: 'array<string>',
  recommendation: 'string',
  case_status: 'string|null',
  analysis_case_id: 'string|null',
  input_snapshot_hash: 'string',
}

const SECTOR_BREADTH_TAGS: FieldTags<WireSectorBreadth> = {
  advancing_member_ratio: 'string|null',
  median_member_return: 'string|null',
  breadth_expanding: 'boolean',
  breadth_narrowing: 'boolean',
  concentration_warning: 'boolean',
}

const SECTOR_STATE_TAGS: FieldTags<WireSectorState> = {
  trend_stage: 'string',
  relative_strength: 'string',
  breadth: 'object',
  evidence_flags: 'array<string>',
  recommendation: 'string',
  case_status: 'string|null',
  analysis_case_id: 'string|null',
  input_snapshot_hash: 'string',
}

const ITEM_STATE_TAGS: FieldTags<WireItemState> = {
  cycle_stage: 'string',
  evidence_flags: 'array<string>',
  regime_relation: 'array<string>',
  recommendation: 'string',
  case_status: 'string|null',
  candidate_episode_id: 'string|null',
  cycle_case_id: 'string|null',
  input_snapshot_hash: 'string',
}

const RECOMMENDATION_DETAIL_TAGS: FieldTags<WireRecommendationDetail> = {
  recommendation: 'string',
  signal_strength: 'string',
  evidence_coverage: 'string',
  trade_confirmation: 'string',
  input_snapshot_hash: 'string',
}

const EVIDENCE_DOMAIN_TAGS: FieldTags<WireEvidenceDomain> = {
  domain: 'string',
  strength: 'string',
  contributing_feature_keys: 'array<string>',
  missing_reason: 'string|null',
  policy_version: 'string',
  input_snapshot_hash: 'string',
}

const UNIT_RESULT_TAGS: FieldTags<WireUnitResult> = {
  snapshot_id: 'string',
  contract_code: 'string',
  contract_version: 'string',
  envelope_kind: 'string',
  identity: 'object',
  as_of: 'string',
  available_at: 'string',
  data_branch: 'string',
  data_status: 'string',
  versions: 'object',
  state: 'object',
  recommendation_detail: 'object|null',
  evidence_domains: 'array<object>',
  claims: 'array<string>',
}

const COLLECTION_RESULT_TAGS: FieldTags<WireCollectionResult> = {
  snapshot_id: 'string',
  contract_code: 'string',
  contract_version: 'string',
  envelope_kind: 'string',
  collection_id: 'string',
  scope_kind: 'string',
  as_of: 'string',
  available_at: 'string',
  data_branch: 'string',
  data_status: 'string',
  versions: 'object',
  member_count: 'number',
  returned_member_count: 'number',
  member_result_ids: 'array<string>',
  missing_member_ids: 'array<string>',
  unavailable_member_ids: 'array<string>',
}

// The vocabulary half of the drift gate.
//
// The tables above read `string | null` off the TypeScript type, which is all TypeScript can
// say. The schema says more: `advancing_member_ratio` is a 0-through-1 decimal string and
// `median_member_return` is a finite signed fixed-decimal string, and both used to be free
// `nonblank_text` - so "1.01" and "1e-3" were legal wire and no tag above could tell. This
// declares the vocabulary each string-valued instance path must use, and
// tests/wire-schema.test.ts compares it against the same map read out of the schema.
export const SCHEMA_TEXT_KINDS: Readonly<Record<string, TextTag>> = {
  '/as_of': 'timestamp',
  '/available_at': 'timestamp',
  '/claims/*': 'enum',
  '/collection_id': 'nonblank_text',
  '/contract_code': 'enum',
  '/contract_version': 'enum',
  '/data_branch': 'enum',
  '/data_status': 'enum',
  '/envelope_kind': 'enum',
  '/evidence_domains/*/contributing_feature_keys/*': 'nonblank_text',
  '/evidence_domains/*/domain': 'enum',
  '/evidence_domains/*/input_snapshot_hash': 'sha256',
  '/evidence_domains/*/missing_reason': 'enum|null',
  '/evidence_domains/*/policy_version': 'nonblank_text',
  '/evidence_domains/*/strength': 'enum',
  '/identity/analysis_unit_id': 'nonblank_text',
  '/identity/analysis_unit_kind': 'enum|null',
  '/identity/catalog_version': 'nonblank_text',
  '/identity/display_name': 'nonblank_text',
  '/identity/edition_kind': 'enum|null',
  '/identity/identity_available_at': 'timestamp',
  '/identity/parent_analysis_unit_id': 'nonblank_text|null',
  '/identity/scope_kind': 'enum',
  '/member_result_ids/*': 'sha256',
  '/missing_member_ids/*': 'nonblank_text',
  '/recommendation_detail/evidence_coverage': 'ratio_decimal_text',
  '/recommendation_detail/input_snapshot_hash': 'sha256',
  '/recommendation_detail/recommendation': 'enum',
  '/recommendation_detail/signal_strength': 'enum',
  '/recommendation_detail/trade_confirmation': 'enum',
  '/scope_kind': 'enum',
  '/snapshot_id': 'sha256',
  '/state/analysis_case_id': 'nonblank_text|null',
  '/state/breadth/advancing_member_ratio': 'ratio_decimal_text|null',
  '/state/breadth/median_member_return': 'signed_fixed_decimal_text|null',
  '/state/candidate_episode_id': 'nonblank_text|null',
  '/state/case_status': 'enum|null',
  '/state/cycle_case_id': 'nonblank_text|null',
  '/state/cycle_stage': 'enum',
  '/state/evidence_flags/*': 'enum',
  '/state/input_snapshot_hash': 'sha256',
  '/state/level_regime': 'enum',
  '/state/recommendation': 'enum',
  '/state/regime_relation/*': 'enum',
  '/state/relative_strength': 'enum',
  '/state/trend_stage': 'enum',
  '/unavailable_member_ids/*': 'nonblank_text',
  '/versions/algorithm_version': 'nonblank_text',
  '/versions/catalog_version': 'nonblank_text',
  '/versions/failure_policy_version': 'nonblank_text',
  '/versions/feature_profile_version': 'nonblank_text',
  '/versions/fusion_method_version': 'nonblank_text',
  '/versions/group_version': 'nonblank_text',
  '/versions/index_version': 'nonblank_text',
  '/versions/parameter_set_version': 'nonblank_text',
  '/versions/stage_policy_version': 'nonblank_text',
}

export interface FieldTagTable {
  readonly pointer: string
  readonly tags: Readonly<Record<string, TypeTag>>
}

// Every object the schema defines appears here. tests/wire-schema.test.ts asserts that, so a
// new $defs object cannot arrive without a table to check it against.
export const FIELD_TAG_TABLES: readonly FieldTagTable[] = [
  { pointer: '/$defs/identity', tags: IDENTITY_TAGS },
  { pointer: '/$defs/versions', tags: VERSIONS_TAGS },
  { pointer: '/$defs/market_state', tags: MARKET_STATE_TAGS },
  { pointer: '/$defs/sector_state', tags: SECTOR_STATE_TAGS },
  { pointer: '/$defs/sector_state/properties/breadth', tags: SECTOR_BREADTH_TAGS },
  { pointer: '/$defs/item_state', tags: ITEM_STATE_TAGS },
  { pointer: '/$defs/recommendation_detail', tags: RECOMMENDATION_DETAIL_TAGS },
  { pointer: '/$defs/evidence_domain', tags: EVIDENCE_DOMAIN_TAGS },
  { pointer: '/$defs/unit_result', tags: UNIT_RESULT_TAGS },
  { pointer: '/$defs/collection_result', tags: COLLECTION_RESULT_TAGS },
]
