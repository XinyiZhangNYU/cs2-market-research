import { decodeNativeCnyTrendingDay } from '../src/api/HttpNativeCnyTrendingGateway'
import { canonicalHash } from '../src/wire/canonical'

/** Entirely synthetic, decoded by the actual frozen native wire. No live data. */
export function nativeTrendingFixture(publicationDigit = '1', displayName = '合成 Trending 物品') {
  const hash = (digit: string) => digit.repeat(64)
  const data = {
    schema: 'native-cny-trending-public-day/1', basis: 'UPSTREAM_VENDOR_DECLARED_NATIVE_CNY_V1',
    currency: 'CNY', fx_applied: false, method: 'TRENDING_NATIVE_CNY_EXACT_ENDPOINTS_V1',
    numeric_semantics: 'EXACT_NATIVE_CNY_RETURN_RATIO', candidate_sha256: hash('a'),
    catalog_publication_id: hash('b'), start_date: '2026-09-01', end_date: '2026-10-01',
    as_of: '2026-10-02t00:00:00.123456000Z', input_available_at: '2026-10-02T00:00:00.123455Z',
    evidence_class: 'HYBRID_BRIDGED', historical_membership_qualified: false,
    members: [
      { rank: 1, direction: 'GAINERS', analysis_unit_id: 'item:18446744073709551615',
        display_name: displayName, evidence_grade: 'TWO_SOURCE_SUPPORTED', supporting_source_count: 2,
        return_exact: { numerator_hex: '1' + '0'.repeat(200), denominator_hex: '3' }, conservative_source: 'market_a' },
      { rank: 2, direction: 'GAINERS', analysis_unit_id: 'item:10', display_name: '相等比率：十',
        evidence_grade: 'THREE_SOURCE_CONFIRMED', supporting_source_count: 3,
        return_exact: { numerator_hex: '1', denominator_hex: '3' }, conservative_source: 'market_c' },
      { rank: 3, direction: 'GAINERS', analysis_unit_id: 'item:2', display_name: '相等比率：二',
        evidence_grade: 'TWO_SOURCE_SUPPORTED', supporting_source_count: 2,
        return_exact: { numerator_hex: '1', denominator_hex: '3' }, conservative_source: 'market_b' },
      { rank: 1, direction: 'LOSERS', analysis_unit_id: 'item:12', display_name: '合成跌幅物品',
        evidence_grade: 'TWO_SOURCE_SUPPORTED', supporting_source_count: 2,
        return_exact: { numerator_hex: '-1', denominator_hex: '3' }, conservative_source: 'market_a' },
    ],
  }
  const envelope = { api_contract: 'native-cny-trending-day/1', publication_id: hash(publicationDigit),
    public_sha256: canonicalHash(data), rights_sha256: hash('c'), readiness_review_sha256: hash('d'),
    released_at: '2026-10-02T00:00:01+00:00', data }
  const selection = { publicationId: envelope.publication_id, publicSha256: envelope.public_sha256,
    rightsSha256: envelope.rights_sha256, readinessReviewSha256: envelope.readiness_review_sha256,
    candidateSha256: data.candidate_sha256, catalogPublicationId: data.catalog_publication_id,
    startDate: data.start_date, endDate: data.end_date, knownAt: '2026-10-02T00:00:02Z' }
  const day = decodeNativeCnyTrendingDay(envelope, selection)
  return { envelope, selection, day }
}
