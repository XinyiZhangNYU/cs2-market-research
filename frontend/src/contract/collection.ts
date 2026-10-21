// Builds the envelope for a page that answers for a set of units rather than one unit. Every
// collection-level field stays NOT_PRODUCED. Member facts are summarised as DERIVED_FROM_MEMBERS
// distributions: that is a frontend collapse into a summary, not a collapse into a collection
// scalar.

import type { AnalysisUnitKind, DataBranch, DataStatus, ScopeKind } from './enums'
import { assertSingleAnalysisUnitKind } from './identity'
import { notProduced, type DerivedFromMembers } from './provenance'
import type { CollectionHeader, IsoUtcTimestamp, VersionContext } from './types'
import { VERSION_FIELD_KEYS } from './types'

export type CollectionMember = {
  available_at?: IsoUtcTimestamp
  data_status?: DataStatus
  data_branch?: DataBranch
  versions?: VersionContext
  // Absent for MARKET and SECTOR members, which have no economic-identity granularity.
  analysis_unit_kind?: AnalysisUnitKind
}

// Scoped to state snapshots on purpose. A real collection type carries a collection-level as_of
// and data_branch together with missing_member_ids and unavailable_member_ids. No state snapshot
// has that shape, so this envelope reports a derived member summary and leaves the collection
// fields unproduced rather than inventing one.
const AGGREGATE_NOTE = {
  zh: '状态快照只在单个 analysis unit 上产出 available_at / data_status / data_branch / versions，没有任何状态快照产出集合层的对应字段。成员取值一致也不构成集合层存在该字段——那只是成员的性质。前端可以对成员字段做去重/分布摘要（DERIVED_FROM_MEMBERS），但不得把它填进集合字段。集合层五项一律 NOT_PRODUCED。（特征层的 IndexFeatureSnapshot 确实有集合级 as_of 与 data_branch，并配 missing_member_ids / unavailable_member_ids；那是另一层的类型，不能拿来当状态快照的集合页眉。）',
  en: 'State snapshots emit available_at, data_status, data_branch and versions per analysis unit; no state snapshot emits the collection-level counterpart. Members agreeing on a value does not make the collection have that field — it is a property of the members. The frontend may summarise member fields as a derived distribution (DERIVED_FROM_MEMBERS), but must not write that summary into the collection fields. The five collection-level fields stay NOT_PRODUCED. (features IndexFeatureSnapshot does carry a collection-level as_of and data_branch, paired with missing_member_ids and unavailable_member_ids; that is a different layer and cannot stand in for a state-snapshot envelope.)',
}

export function versionIdentity(versions: VersionContext): string {
  return VERSION_FIELD_KEYS.map((key) => `${key}=${versions[key]}`).join('|')
}

function distribute<T>(
  members: readonly CollectionMember[],
  pick: (member: CollectionMember) => T | undefined,
  key: (value: T) => string,
): DerivedFromMembers<T> {
  const counts = new Map<string, { value: T; count: number }>()
  let reported_count = 0
  for (const member of members) {
    const value = pick(member)
    if (value === undefined) continue
    reported_count += 1
    const id = key(value)
    const existing = counts.get(id)
    if (existing) existing.count += 1
    else counts.set(id, { value, count: 1 })
  }
  const buckets = [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .map(([, bucket]) => bucket)
  return {
    provenance: 'DERIVED_FROM_MEMBERS',
    member_count: members.length,
    reported_count,
    buckets,
  }
}

export function collectionHeader(input: {
  scope_kind: ScopeKind
  collection_id: string
  members: readonly CollectionMember[]
}): CollectionHeader {
  const { members } = input
  // Before anything is summarised. A distribution over a parent MHN and its own style/pattern
  // children answers for no single economic identity, which is the same refusal fusion.py makes.
  assertSingleAnalysisUnitKind(members.map((m) => m.analysis_unit_kind))
  const times = members.flatMap((m) => (m.available_at ? [m.available_at] : [])).sort()

  return {
    scope_kind: input.scope_kind,
    collection_id: input.collection_id,
    member_count: members.length,
    member_available_at:
      times.length === 0
        ? null
        : {
            provenance: 'DERIVED_FROM_MEMBERS',
            member_count: members.length,
            reported_count: times.length,
            earliest: times[0],
            latest: times[times.length - 1],
          },
    member_data_status: distribute(members, (m) => m.data_status, (status) => status),
    member_data_branch: distribute(members, (m) => m.data_branch, (branch) => branch),
    member_versions: distribute(members, (m) => m.versions, versionIdentity),
    as_of: notProduced('collection_envelope.as_of', AGGREGATE_NOTE),
    available_at: notProduced('collection_envelope.available_at', AGGREGATE_NOTE),
    data_status: notProduced('collection_envelope.data_status', AGGREGATE_NOTE),
    data_branch: notProduced('collection_envelope.data_branch', AGGREGATE_NOTE),
    versions: notProduced('collection_envelope.versions', AGGREGATE_NOTE),
  }
}
