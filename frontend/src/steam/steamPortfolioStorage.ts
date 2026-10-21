import {
  isItemTarget,
  parsePersonalWatchTarget,
  type PersonalWatchItemTarget,
} from '../watchlist/personalWatchlist'

const STORAGE_KEY = 'cs2-rotate-steam-portfolio-v1'
const MAX_SAVED_BYTES = 5_000_000
const MAX_SAVED_ROWS = 20_000
const STEAM_ID64 = /^[0-9]{17}$/u

export type SavedSteamPortfolioRow = Readonly<{
  quantity: number
  target: PersonalWatchItemTarget
}>

export type SavedSteamPortfolio = Readonly<{
  schema_version: 1
  saved_at: string
  steamid: string
  truncated: boolean
  skipped_unnamed: number
  unsupported: number
  rows: readonly SavedSteamPortfolioRow[]
}>

export interface SteamPortfolioStorage {
  read(): SavedSteamPortfolio | null
  write(value: SavedSteamPortfolio): void
  clear(): void
}

export class SteamPortfolioStorageError extends Error {
  constructor() {
    super('saved Steam portfolio is unavailable or invalid')
    this.name = 'SteamPortfolioStorageError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  return actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0
}

export function parseSavedSteamPortfolio(value: unknown): SavedSteamPortfolio {
  if (!isRecord(value) || !exactKeys(value, [
    'schema_version',
    'saved_at',
    'steamid',
    'truncated',
    'skipped_unnamed',
    'unsupported',
    'rows',
  ]) || value.schema_version !== 1 || typeof value.saved_at !== 'string' ||
    Number.isNaN(Date.parse(value.saved_at)) || typeof value.steamid !== 'string' ||
    !STEAM_ID64.test(value.steamid) || typeof value.truncated !== 'boolean' ||
    !nonNegativeInteger(value.skipped_unnamed) || !nonNegativeInteger(value.unsupported) ||
    !Array.isArray(value.rows) || value.rows.length > MAX_SAVED_ROWS) {
    throw new SteamPortfolioStorageError()
  }

  const keys = new Set<string>()
  const rows = value.rows.map((candidate) => {
    if (!isRecord(candidate) || !exactKeys(candidate, ['quantity', 'target']) ||
      !Number.isSafeInteger(candidate.quantity) || (candidate.quantity as number) <= 0) {
      throw new SteamPortfolioStorageError()
    }
    let target
    try {
      target = parsePersonalWatchTarget(candidate.target)
    } catch {
      throw new SteamPortfolioStorageError()
    }
    if (!isItemTarget(target) || target.added_at !== value.saved_at || keys.has(target.target_key)) {
      throw new SteamPortfolioStorageError()
    }
    keys.add(target.target_key)
    return Object.freeze({ quantity: candidate.quantity as number, target })
  })

  return Object.freeze({
    schema_version: 1 as const,
    saved_at: value.saved_at,
    steamid: value.steamid,
    truncated: value.truncated,
    skipped_unnamed: value.skipped_unnamed,
    unsupported: value.unsupported,
    rows: Object.freeze(rows),
  })
}

export class LocalSteamPortfolioStorage implements SteamPortfolioStorage {
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = window.localStorage) {}

  read(): SavedSteamPortfolio | null {
    try {
      const source = this.storage.getItem(STORAGE_KEY)
      if (source === null) return null
      if (source.length === 0 || source.length > MAX_SAVED_BYTES) throw new SteamPortfolioStorageError()
      return parseSavedSteamPortfolio(JSON.parse(source) as unknown)
    } catch {
      throw new SteamPortfolioStorageError()
    }
  }

  write(value: SavedSteamPortfolio): void {
    try {
      const admitted = parseSavedSteamPortfolio(value)
      const source = JSON.stringify(admitted)
      if (source.length > MAX_SAVED_BYTES) throw new SteamPortfolioStorageError()
      this.storage.setItem(STORAGE_KEY, source)
    } catch {
      throw new SteamPortfolioStorageError()
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(STORAGE_KEY)
    } catch {
      throw new SteamPortfolioStorageError()
    }
  }
}
