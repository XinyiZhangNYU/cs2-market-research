import detailTemplate from '../../schemas/examples/catalog-display-query-detail.valid.json'
import { canonicalHash } from '../src/wire/canonical'
import type { CatalogDisplayGateway, CatalogDisplayGatewayRequest, CatalogDisplayQueryGatewayRequest } from '../src/api/CatalogDisplayApi'
import { nativeTrendingFixture } from './native-cny-trending-view-fixture'
import type { WireCatalogDetailResponse } from '../src/wire/catalogDisplayQueryApiTypes'
import type { NativeCnyTrendingMember } from '../src/api/HttpNativeCnyTrendingGateway'

export const fixtureNow = () => new Date('2026-10-11T12:00:00Z')
export const EMPTY_FILTERS = { item_kind: null, base_item_code: null, edition_kind: null, wear_tier: null } as const
export const NATIVE_QUERY = { as_of: null, publication_id: null, direction: 'GAINERS', page_size: 24,
  cursor: null, filters: EMPTY_FILTERS } as const

export function exactRatio(n: bigint, d: bigint): NativeCnyTrendingMember['returnExact'] {
  let a = n < 0n ? -n : n, b = d
  while (b) { const r = a % b; a = b; b = r }
  return { numerator_hex: (n / a).toString(16), denominator_hex: (d / a).toString(16) }
}

/** Synthetic identities and values only. Also used by the offline screenshot server. */
export function nativePublicFixture(perDirection = 4) {
  const { envelope } = nativeTrendingFixture()
  envelope.data.members = (['GAINERS', 'LOSERS'] as const).flatMap((direction, lane) =>
    Array.from({ length: perDirection }, (_, index) => ({
      rank: index + 1, direction, analysis_unit_id: `item:${lane * perDirection + index + 1}`,
      display_name: `Synthetic fallback ${lane * perDirection + index + 1}`,
      evidence_grade: index % 2 ? 'TWO_SOURCE_SUPPORTED' : 'THREE_SOURCE_CONFIRMED',
      supporting_source_count: index % 2 ? 2 : 3,
      return_exact: exactRatio(BigInt(perDirection - index) * (lane ? -1n : 1n), lane ? 100n : 10n),
      conservative_source: (['market_a', 'market_b', 'market_c'] as const)[index % 3],
    })))
  envelope.data.as_of = '2026-10-02T00:00:00Z'
  envelope.data.input_available_at = '2026-10-01T23:59:00Z'
  envelope.public_sha256 = canonicalHash(envelope.data)
  return envelope
}

export class SyntheticTrendingCatalog implements CatalogDisplayGateway {
  readonly kind = 'SYNTHETIC_TRENDING_CATALOG'
  readonly requests: (CatalogDisplayGatewayRequest | CatalogDisplayQueryGatewayRequest)[] = []
  readonly snapshot = { ...detailTemplate.snapshot, catalog_version: detailTemplate.member.projection.catalog_version,
    member_count: 100, snapshot_id: 'c'.repeat(64) }
  missing = new Set(['item:4'])
  active = 0
  maxActive = 0
  delayMs = 0
  async read(request: CatalogDisplayGatewayRequest) {
    this.requests.push(request)
    if (request.operation !== 'CATALOG_DISPLAY_SNAPSHOT_LIST') throw new Error('Unexpected catalog read')
    return { api_contract: 'catalog-display-snapshot-api', api_version: 'v1', response_kind: 'CATALOG_DISPLAY_SNAPSHOT_LIST',
      query: request.query, members: [this.snapshot], next_cursor: null }
  }
  async readQuery(request: CatalogDisplayQueryGatewayRequest) {
    this.requests.push(request)
    if (request.operation !== 'CATALOG_QUERY_DETAIL') throw new Error('Unexpected catalog query')
    this.active++
    this.maxActive = Math.max(this.maxActive, this.active)
    try {
      if (this.delayMs) await new Promise((resolve) => setTimeout(resolve, this.delayMs))
      if (this.missing.has(request.query.analysis_unit_id)) return { api_contract: 'catalog-display-query-api', api_version: 'v1',
        response_kind: 'ERROR', error: { code: 'NOT_FOUND', http_status: 404, retryable: false } }
      const doc = structuredClone(detailTemplate) as WireCatalogDetailResponse
      doc.query = { ...request.query }
      doc.snapshot = { ...this.snapshot }
      const p = doc.member.projection, ordinal = Number(request.query.analysis_unit_id.split(':')[1])
      p.analysis_unit_id = request.query.analysis_unit_id
      p.item_kind = ordinal % 2 ? 'WEAPON' : 'KNIFE'
      p.base_item_code = ordinal % 2 ? 'synthetic.ak47' : 'synthetic.bayonet'
      p.edition_kind = ordinal % 3 ? 'STANDARD' : 'STATTRAK'
      p.wear_tier = ordinal % 2 ? 'FIELD_TESTED' : 'FACTORY_NEW'
      const prefix = p.edition_kind === 'STATTRAK' ? 'StatTrak™ ' : ''
      p.localized_name = { authority: 'VALVE_STEAM', en: `${prefix}Synthetic ${ordinal % 2 ? 'Rifle' : 'Knife'} | Sample ${ordinal}`,
        zh_cn: `${prefix}合成${ordinal % 2 ? '步枪' : '刀具'} | 样例 ${ordinal}` }
      p.media = { status: 'BOUND', media_key: `synthetic/${ordinal}`, presentation_kind: 'SERIES_REPRESENTATIVE' }
      const { projection_hash: _hash, ...body } = p
      p.projection_hash = canonicalHash(body)
      doc.siblings = [doc.member]
      doc.sibling_total = 1
      return doc
    } finally { this.active-- }
  }
}

export const nativeFixtureResponse = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'Content-Type': 'application/json' },
})
