import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import catalogFixture from '../../schemas/examples/catalog-display-list.valid.json'
import catalogQueryFixture from '../../schemas/examples/catalog-display-query-series.valid.json'
import snapshotFixture from '../../schemas/examples/catalog-display-snapshot-list.valid.json'
import qualityFixture from '../../schemas/examples/quality-item-style.valid.json'
import resultReadFixture from '../../schemas/examples/result-read-unit-list.valid.json'
import resultFixture from '../../schemas/examples/unit-item-branch-b.valid.json'
import valveEventFixture from '../../schemas/examples/valve-event-public-list.valid.json'
import priceFixture from '../../schemas/examples/price-display-item.valid.json'
import marketWatchlistFixture from '../../schemas/examples/market-watchlist-public-market.valid.json'
import marketWatchlistObservationFixture from '../../schemas/examples/market-watchlist-public-observation-watchlist.valid.json'
import singleItemTrendingFixture from '../../schemas/examples/single-item-trending-list.valid.json'
import marketDescriptiveFixture from '../../schemas/examples/market-descriptive-public-api/v1/overview-current.json'
import marketSectorIndexFixture from '../../schemas/examples/market-sector-index-public-api/v1/directory.json'
import marketSectorIndexV2Fixture from '../../schemas/examples/market-sector-index-public-api/v2/series.json'
import itemMonitorFixture from '../../schemas/examples/single-item-monitor-public-api/v1/result.json'
import { itemCurrentFixture } from './support/itemCurrentFixture'
import { itemHistoryFixture } from './support/itemHistoryFixture'
import {
  validateCatalogDisplayApiResponse,
  validateCatalogDisplayQueryApiResponse,
  validateCatalogDisplaySnapshotApiResponse,
  validateQualityEnvelope,
  validateResultEnvelope,
  validateResultReadApiResponse,
  validateValveEventApiResponse,
  validatePriceDisplayApiResponse,
  validateMarketWatchlistPublicApiResponse,
  validateMarketWatchlistObservationApiResponse,
  validateSingleItemTrendingPublicApiResponse,
  validateMarketDescriptivePublicApiResponse,
  validateMarketSectorIndexPublicApiResponse,
  validateMarketSectorIndexPublicApiV2Response,
  validateSingleItemMonitorPublicApiResponse,
  validateSingleItemCurrentPublicApiResponse,
  validateSingleItemHistoryPublicApiResponse,
  type GeneratedValidator,
} from '../src/wire/generated/wireValidators.js'

const frontendRoot = resolve(import.meta.dirname, '..')
const generatedRoot = resolve(frontendRoot, 'src', 'wire', 'generated')
const generatedFiles = [
  'catalogDisplayApiValidator.d.ts',
  'catalogDisplayApiValidator.js',
  'catalogDisplayQueryApiValidator.d.ts',
  'catalogDisplayQueryApiValidator.js',
  'catalogDisplaySnapshotApiValidator.d.ts',
  'catalogDisplaySnapshotApiValidator.js',
  'fxReferenceApiValidator.d.ts',
  'fxReferenceApiValidator.js',
  'marketDescriptivePublicApiValidator.d.ts',
  'marketDescriptivePublicApiValidator.js',
  'marketSectorIndexPublicApiV2Validator.d.ts',
  'marketSectorIndexPublicApiV2Validator.js',
  'marketSectorIndexPublicApiV3Validator.d.ts',
  'marketSectorIndexPublicApiV3Validator.js',
  'marketSectorIndexPublicApiValidator.d.ts',
  'marketSectorIndexPublicApiValidator.js',
  'marketWatchlistObservationApiValidator.d.ts',
  'marketWatchlistObservationApiValidator.js',
  'marketWatchlistPublicApiValidator.d.ts',
  'marketWatchlistPublicApiValidator.js',
  'priceDisplayApiValidator.d.ts',
  'priceDisplayApiValidator.js',
  'qualityEnvelopeValidator.d.ts',
  'qualityEnvelopeValidator.js',
  'resultEnvelopeValidator.d.ts',
  'resultEnvelopeValidator.js',
  'resultReadApiValidator.d.ts',
  'resultReadApiValidator.js',
  'singleItemCurrentPublicApiValidator.d.ts',
  'singleItemCurrentPublicApiValidator.js',
  'singleItemHistoryPublicApiValidator.d.ts',
  'singleItemHistoryPublicApiValidator.js',
  'singleItemMonitorPublicApiValidator.d.ts',
  'singleItemMonitorPublicApiValidator.js',
  'singleItemTrendingPublicApiV3Validator.d.ts',
  'singleItemTrendingPublicApiV3Validator.js',
  'singleItemTrendingPublicApiV4Validator.d.ts',
  'singleItemTrendingPublicApiV4Validator.js',
  'singleItemTrendingPublicApiValidator.d.ts',
  'singleItemTrendingPublicApiValidator.js',
  'valveEventApiValidator.d.ts',
  'valveEventApiValidator.js',
  'wireValidators.d.ts',
  'wireValidators.js',
]

const validators: readonly [string, GeneratedValidator, unknown][] = [
  ['result envelope', validateResultEnvelope, resultFixture],
  ['quality envelope', validateQualityEnvelope, qualityFixture],
  ['result-read API', validateResultReadApiResponse, resultReadFixture],
  ['catalog display API', validateCatalogDisplayApiResponse, catalogFixture],
  ['catalog query API', validateCatalogDisplayQueryApiResponse, catalogQueryFixture],
  [
    'catalog snapshot API',
    validateCatalogDisplaySnapshotApiResponse,
    snapshotFixture,
  ],
  ['Valve event API', validateValveEventApiResponse, valveEventFixture],
  ['price display API', validatePriceDisplayApiResponse, priceFixture],
  ['market/watchlist public API', validateMarketWatchlistPublicApiResponse, marketWatchlistFixture],
  ['market/watchlist observation API', validateMarketWatchlistObservationApiResponse, marketWatchlistObservationFixture],
  ['single-item Trending public API', validateSingleItemTrendingPublicApiResponse, singleItemTrendingFixture],
  ['market descriptive public API', validateMarketDescriptivePublicApiResponse, marketDescriptiveFixture],
  ['market/sector index public API', validateMarketSectorIndexPublicApiResponse, marketSectorIndexFixture],
  ['market/sector index public API V2', validateMarketSectorIndexPublicApiV2Response, marketSectorIndexV2Fixture],
  ['single-item monitor public API', validateSingleItemMonitorPublicApiResponse, itemMonitorFixture],
  ['single-item current public API', validateSingleItemCurrentPublicApiResponse, itemCurrentFixture()],
  ['single-item history public API', validateSingleItemHistoryPublicApiResponse, itemHistoryFixture()],
]

describe('build-time wire validators', () => {
  it.each(validators)('accepts the shared %s positive fixture', (_name, validate, fixture) => {
    expect(validate(fixture)).toBe(true)
    expect(validate.errors).toBeNull()
  })

  it.each(validators)('keeps Ajv errors for an invalid %s payload', (_name, validate) => {
    expect(validate({})).toBe(false)
    expect(validate.errors?.length).toBeGreaterThan(0)
    expect(validate.errors?.every((error) => typeof error.keyword === 'string')).toBe(true)
  })

  it('is byte-current with every registered shared schema', () => {
    const result = spawnSync(
      process.execPath,
      ['scripts/generate-wire-validators.mjs', '--check'],
      {
        cwd: frontendRoot,
        encoding: 'utf8',
        windowsHide: true,
      },
    )
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('WIRE_VALIDATORS_CURRENT=44')
    expect(readdirSync(generatedRoot).sort()).toEqual(generatedFiles)
  })

  it('generates exactly the same outputs for LF and CRLF schema sources without changing files', () => {
    const result = spawnSync(process.execPath, ['scripts/generate-wire-validators.mjs', '--check-eol-parity'], {
      cwd: frontendRoot, encoding: 'utf8', windowsHide: true,
    })
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('WIRE_VALIDATORS_EOL_PARITY=44')
  })

  it('contains independently loadable static validators but no browser runtime compiler', () => {
    const generated = generatedFiles
      .filter((name) => name.endsWith('.js'))
      .map((name) => readFileSync(resolve(generatedRoot, name), 'utf8'))
      .join('\n')
    for (const schema of [
      'research-result-envelope.v1.schema.json',
      'research-quality-envelope.v1.schema.json',
      'result-read-api.v1.schema.json',
      'catalog-display-api.v1.schema.json',
      'catalog-display-snapshot-api.v1.schema.json',
      'catalog-display-query-api.v1.schema.json',
      'valve-event-public-api-v1.schema.json',
      'fx-reference-api.v1.schema.json',
      'price-display-api.v1.schema.json',
      'market-watchlist-public-api.v1.schema.json',
      'market-watchlist-public-observation-api.v1.schema.json',
      'single-item-trending-public-api.v2.schema.json',
      'single-item-monitor-public-api.v1.schema.json',
      'single-item-current-public-api.v1.schema.json',
      'single-item-history-public-api.v1.schema.json',
      'market-sector-index-public-api.v1.schema.json',
      'market-sector-index-public-api.v2.schema.json',
      'market-sector-index-public-api.v3.schema.json',
    ]) {
      expect(generated).toContain(`${schema}:`)
    }
    expect(generated).not.toMatch(
      /\brequire\s*\(|\bnew\s+Function\b|\beval\s*\(|compileSchema|KeywordCxt/u,
    )

    const decoderModules = [
      ['src/wire/decode.ts', 'resultEnvelopeValidator.js'],
      ['src/wire/qualityDecode.ts', 'qualityEnvelopeValidator.js'],
      ['src/wire/resultReadApiDecode.ts', 'resultReadApiValidator.js'],
      ['src/wire/catalogDisplayApiDecode.ts', 'catalogDisplayApiValidator.js'],
      ['src/wire/catalogDisplaySnapshotApiDecode.ts', 'catalogDisplaySnapshotApiValidator.js'],
      ['src/wire/catalogDisplayQueryApiDecode.ts', 'catalogDisplayQueryApiValidator.js'],
      ['src/wire/valveEventApiDecode.ts', 'valveEventApiValidator.js'],
      ['src/wire/fxReferenceApiDecode.ts', 'fxReferenceApiValidator.js'],
      ['src/wire/priceDisplayApiDecode.ts', 'priceDisplayApiValidator.js'],
      ['src/wire/marketWatchlistPublicApiDecode.ts', 'marketWatchlistPublicApiValidator.js'],
      ['src/wire/marketWatchlistObservationApiDecode.ts', 'marketWatchlistObservationApiValidator.js'],
      ['src/wire/singleItemTrendingPublicApiDecode.ts', 'singleItemTrendingPublicApiValidator.js'],
      ['src/wire/itemMonitorPublicApiDecode.ts', 'singleItemMonitorPublicApiValidator.js'],
      ['src/wire/itemCurrentPublicApiDecode.ts', 'singleItemCurrentPublicApiValidator.js'],
      ['src/wire/itemHistoryPublicApiDecode.ts', 'singleItemHistoryPublicApiValidator.js'],
      ['src/wire/marketSectorIndexPublicApiDecode.ts', 'marketSectorIndexPublicApiValidator.js'],
      ['src/wire/marketSectorIndexPublicApiDecode.ts', 'marketSectorIndexPublicApiV2Validator.js'],
    ] as const
    for (const [decoder, validator] of decoderModules) {
      const source = readFileSync(resolve(frontendRoot, decoder), 'utf8')
      expect(source).toContain(`./generated/${validator}`)
      expect(source).not.toMatch(/new Ajv|\.compile\(|addFormats\(/u)
    }
  })
})




