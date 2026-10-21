import type { WireCatalogDisplayMedia } from './catalogDisplayApiTypes'
import type {
  SteamPortfolioCatalogHit,
  SteamPortfolioCatalogHitsResponse,
  SteamPortfolioCatalogMember,
  SteamPortfolioInventoryResponse,
  SteamPortfolioStack,
} from './steamPortfolioApiTypes'

export class SteamPortfolioWireViolation extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SteamPortfolioWireViolation'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value)
  return actual.length === keys.length && keys.every((key) => actual.includes(key))
}

function text(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim() || value.length > maximum) {
    throw new SteamPortfolioWireViolation('text')
  }
  if (/[\u0000-\u001f\u007f]/u.test(value)) throw new SteamPortfolioWireViolation('text')
  return value
}

function integer(value: unknown, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw new SteamPortfolioWireViolation('integer')
  }
  return value
}

function boolean(value: unknown): boolean {
  if (value !== true && value !== false) throw new SteamPortfolioWireViolation('boolean')
  return value
}

function errorDocument(
  value: unknown,
  contract: 'steam-portfolio-inventory' | 'steam-portfolio-api',
  allowed: readonly string[],
): SteamPortfolioInventoryResponse | SteamPortfolioCatalogHitsResponse {
  if (!isRecord(value) || !exactKeys(value, ['api_contract', 'api_version', 'response_kind', 'error'])) {
    throw new SteamPortfolioWireViolation('error shape')
  }
  if (value.api_contract !== contract || value.api_version !== 'v1' || value.response_kind !== 'ERROR') {
    throw new SteamPortfolioWireViolation('error contract')
  }
  if (!isRecord(value.error) || !exactKeys(value.error, ['code', 'http_status', 'retryable'])) {
    throw new SteamPortfolioWireViolation('error fields')
  }
  if (typeof value.error.code !== 'string' || !allowed.includes(value.error.code)) {
    throw new SteamPortfolioWireViolation('error code')
  }
  return {
    api_contract: contract,
    api_version: 'v1',
    response_kind: 'ERROR',
    error: {
      code: value.error.code,
      http_status: integer(value.error.http_status, 400, 504),
      retryable: boolean(value.error.retryable),
    },
  } as SteamPortfolioInventoryResponse | SteamPortfolioCatalogHitsResponse
}

function stack(value: unknown): SteamPortfolioStack {
  if (!isRecord(value) || !exactKeys(value, ['market_hash_name', 'quantity'])) {
    throw new SteamPortfolioWireViolation('stack')
  }
  return {
    market_hash_name: text(value.market_hash_name, 512),
    quantity: integer(value.quantity, 1, 999_999),
  }
}

function media(value: unknown): WireCatalogDisplayMedia {
  if (!isRecord(value)) throw new SteamPortfolioWireViolation('media')
  if (value.status === 'NOT_PRODUCED') {
    if (!exactKeys(value, ['status'])) throw new SteamPortfolioWireViolation('media')
    return { status: 'NOT_PRODUCED' }
  }
  if (value.status !== 'BOUND' || !exactKeys(value, ['status', 'media_key', 'presentation_kind'])) {
    throw new SteamPortfolioWireViolation('media')
  }
  if (
    value.presentation_kind !== 'SERIES_REPRESENTATIVE' &&
    value.presentation_kind !== 'STYLE_REPRESENTATIVE'
  ) {
    throw new SteamPortfolioWireViolation('media')
  }
  return {
    status: 'BOUND',
    media_key: text(value.media_key, 512),
    presentation_kind: value.presentation_kind,
  }
}

function member(value: unknown): SteamPortfolioCatalogMember {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      'analysis_unit_id',
      'item_kind',
      'base_item_code',
      'edition_kind',
      'wear_tier',
      'localized_name',
      'media',
      'version_context',
    ])
  ) {
    throw new SteamPortfolioWireViolation('member')
  }
  if (!isRecord(value.localized_name) || !exactKeys(value.localized_name, ['authority', 'en', 'zh_cn'])) {
    throw new SteamPortfolioWireViolation('localized_name')
  }
  if (
    value.localized_name.authority !== 'VALVE_STEAM' &&
    value.localized_name.authority !== 'MARKET_D' &&
    value.localized_name.authority !== 'MARKET_B'
  ) {
    throw new SteamPortfolioWireViolation('authority')
  }
  const kinds = new Set(['WEAPON', 'KNIFE', 'GLOVE', 'AGENT', 'OTHER', 'UNKNOWN'])
  const editions = new Set(['STANDARD', 'STATTRAK', 'SOUVENIR', 'UNKNOWN'])
  const wears = new Set([
    'FACTORY_NEW',
    'MINIMAL_WEAR',
    'FIELD_TESTED',
    'WELL_WORN',
    'BATTLE_SCARRED',
    'NOT_APPLICABLE',
    'UNKNOWN',
  ])
  if (typeof value.item_kind !== 'string' || !kinds.has(value.item_kind)) {
    throw new SteamPortfolioWireViolation('item_kind')
  }
  if (typeof value.edition_kind !== 'string' || !editions.has(value.edition_kind)) {
    throw new SteamPortfolioWireViolation('edition_kind')
  }
  if (typeof value.wear_tier !== 'string' || !wears.has(value.wear_tier)) {
    throw new SteamPortfolioWireViolation('wear_tier')
  }
  if (!isRecord(value.version_context) || !exactKeys(value.version_context, ['media_asset_version_id'])) {
    throw new SteamPortfolioWireViolation('version_context')
  }
  const mediaAssetVersionId = value.version_context.media_asset_version_id
  if (mediaAssetVersionId !== null && (typeof mediaAssetVersionId !== 'string' || !/^[1-9][0-9]*$/u.test(mediaAssetVersionId))) {
    throw new SteamPortfolioWireViolation('media_asset_version_id')
  }
  return {
    analysis_unit_id: text(value.analysis_unit_id, 256),
    item_kind: value.item_kind as SteamPortfolioCatalogMember['item_kind'],
    base_item_code: text(value.base_item_code, 512),
    edition_kind: value.edition_kind as SteamPortfolioCatalogMember['edition_kind'],
    wear_tier: value.wear_tier as SteamPortfolioCatalogMember['wear_tier'],
    localized_name: {
      authority: value.localized_name.authority,
      en: text(value.localized_name.en, 512),
      zh_cn: text(value.localized_name.zh_cn, 512),
    },
    media: media(value.media),
    version_context: { media_asset_version_id: mediaAssetVersionId },
  }
}

function hit(value: unknown): SteamPortfolioCatalogHit {
  if (!isRecord(value) || !exactKeys(value, ['market_hash_name', 'status', 'member'])) {
    throw new SteamPortfolioWireViolation('hit')
  }
  const name = text(value.market_hash_name, 512)
  if (value.status === 'UNIQUE') {
    if (value.member === null) throw new SteamPortfolioWireViolation('unique member')
    return { market_hash_name: name, status: 'UNIQUE', member: member(value.member) }
  }
  if (value.status !== 'AMBIGUOUS' && value.status !== 'UNSUPPORTED') {
    throw new SteamPortfolioWireViolation('hit status')
  }
  if (value.member !== null) throw new SteamPortfolioWireViolation('empty member')
  return { market_hash_name: name, status: value.status, member: null }
}

export function decodeSteamPortfolioInventory(value: unknown): SteamPortfolioInventoryResponse {
  if (isRecord(value) && value.response_kind === 'ERROR') {
    return errorDocument(value, 'steam-portfolio-inventory', [
      'INVALID_ARGUMENT',
      'PRIVATE',
      'NOT_FOUND',
      'STEAM_UNAVAILABLE',
    ]) as SteamPortfolioInventoryResponse
  }
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      'api_contract',
      'api_version',
      'response_kind',
      'steamid',
      'appid',
      'contextid',
      'total_asset_count',
      'skipped_unnamed',
      'truncated',
      'stacks',
    ])
  ) {
    throw new SteamPortfolioWireViolation('inventory shape')
  }
  if (
    value.api_contract !== 'steam-portfolio-inventory' ||
    value.api_version !== 'v1' ||
    value.response_kind !== 'STEAM_PORTFOLIO_INVENTORY' ||
    value.appid !== 730 ||
    value.contextid !== '2'
  ) {
    throw new SteamPortfolioWireViolation('inventory contract')
  }
  if (!Array.isArray(value.stacks)) throw new SteamPortfolioWireViolation('stacks')
  return {
    api_contract: 'steam-portfolio-inventory',
    api_version: 'v1',
    response_kind: 'STEAM_PORTFOLIO_INVENTORY',
    steamid: text(value.steamid, 17),
    appid: 730,
    contextid: '2',
    total_asset_count: integer(value.total_asset_count, 0, 1_000_000),
    skipped_unnamed: integer(value.skipped_unnamed, 0, 1_000_000),
    truncated: boolean(value.truncated),
    stacks: value.stacks.map(stack),
  }
}

export function decodeSteamPortfolioCatalogHits(value: unknown): SteamPortfolioCatalogHitsResponse {
  if (isRecord(value) && value.response_kind === 'ERROR') {
    return errorDocument(value, 'steam-portfolio-api', [
      'INVALID_ARGUMENT',
      'NOT_FOUND',
      'CONTRACT_UNAVAILABLE',
      'RECORD_CORRUPT',
      'BACKEND_UNAVAILABLE',
    ]) as SteamPortfolioCatalogHitsResponse
  }
  if (
    !isRecord(value) ||
    !exactKeys(value, ['api_contract', 'api_version', 'response_kind', 'snapshot_id', 'hits'])
  ) {
    throw new SteamPortfolioWireViolation('hits shape')
  }
  if (
    value.api_contract !== 'steam-portfolio-api' ||
    value.api_version !== 'v1' ||
    value.response_kind !== 'STEAM_PORTFOLIO_CATALOG_HITS'
  ) {
    throw new SteamPortfolioWireViolation('hits contract')
  }
  if (typeof value.snapshot_id !== 'string' || !/^[0-9a-f]{64}$/u.test(value.snapshot_id)) {
    throw new SteamPortfolioWireViolation('snapshot_id')
  }
  if (!Array.isArray(value.hits) || value.hits.length > 40) {
    throw new SteamPortfolioWireViolation('hits')
  }
  return {
    api_contract: 'steam-portfolio-api',
    api_version: 'v1',
    response_kind: 'STEAM_PORTFOLIO_CATALOG_HITS',
    snapshot_id: value.snapshot_id,
    hits: value.hits.map(hit),
  }
}
