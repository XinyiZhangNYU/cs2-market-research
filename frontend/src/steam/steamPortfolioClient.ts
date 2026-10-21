import {
  BoundedJsonFetchError,
  boundedJsonFetch,
  boundedJsonTimeout,
} from '../api/boundedJsonFetch'
import type { GatewayReadOptions } from '../api/GatewayReadOptions'
import {
  decodeSteamPortfolioCatalogHits,
  decodeSteamPortfolioInventory,
  SteamPortfolioWireViolation,
} from '../wire/steamPortfolioApiDecode'
import {
  STEAM_PORTFOLIO_NAME_PAGE_SIZE,
  type SteamPortfolioCatalogHitsSuccess,
  type SteamPortfolioInventorySuccess,
} from '../wire/steamPortfolioApiTypes'

export class SteamPortfolioReadError extends Error {
  constructor(
    readonly code:
      | 'INVALID_ARGUMENT'
      | 'PRIVATE'
      | 'NOT_FOUND'
      | 'STEAM_UNAVAILABLE'
      | 'CONTRACT_UNAVAILABLE'
      | 'RECORD_CORRUPT'
      | 'BACKEND_UNAVAILABLE'
      | 'TRANSPORT'
      | 'VALIDATION',
    readonly retryable: boolean,
    readonly httpStatus: number | null = null,
  ) {
    super(`steam portfolio read failed: ${code}`)
    this.name = 'SteamPortfolioReadError'
  }
}

export type SteamPortfolioClientOptions = Readonly<{
  fetcher?: typeof fetch
  timeoutMs?: number
}>

function chunkNames(names: readonly string[]): readonly (readonly string[])[] {
  const pages: string[][] = []
  for (let index = 0; index < names.length; index += STEAM_PORTFOLIO_NAME_PAGE_SIZE) {
    pages.push(names.slice(index, index + STEAM_PORTFOLIO_NAME_PAGE_SIZE))
  }
  return pages
}

function transportFailure(error: unknown): SteamPortfolioReadError {
  if (error instanceof SteamPortfolioReadError) return error
  if (error instanceof SteamPortfolioWireViolation) {
    return new SteamPortfolioReadError('VALIDATION', false)
  }
  if (error instanceof BoundedJsonFetchError) {
    return new SteamPortfolioReadError('TRANSPORT', error.code !== 'INVALID_JSON_RESPONSE')
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new SteamPortfolioReadError('TRANSPORT', true)
  }
  return new SteamPortfolioReadError('TRANSPORT', true)
}

export class SteamPortfolioClient {
  private readonly fetcher: typeof fetch
  private readonly inventoryTimeoutMs: number
  private readonly catalogTimeoutMs: number

  constructor(options: SteamPortfolioClientOptions = {}) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis)
    this.inventoryTimeoutMs = boundedJsonTimeout(options.timeoutMs ?? 45_000)
    this.catalogTimeoutMs = boundedJsonTimeout(15_000)
  }

  async loadInventory(
    steamid: string,
    options: GatewayReadOptions = {},
  ): Promise<SteamPortfolioInventorySuccess> {
    try {
      const parameters = new URLSearchParams()
      parameters.set('steamid', steamid)
      const response = await boundedJsonFetch(`/api/v1/steam-portfolio/inventory?${parameters}`, {
        fetcher: this.fetcher,
        init: {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          credentials: 'same-origin',
          referrerPolicy: 'no-referrer',
          redirect: 'error',
        },
        signal: options.signal,
        timeoutMs: this.inventoryTimeoutMs,
      })
      const document = decodeSteamPortfolioInventory(response.payload)
      if (document.response_kind === 'ERROR') {
        throw new SteamPortfolioReadError(
          document.error.code,
          document.error.retryable,
          document.error.http_status,
        )
      }
      if (document.steamid !== steamid) {
        throw new SteamPortfolioReadError('VALIDATION', false, response.status)
      }
      return document
    } catch (error) {
      throw transportFailure(error)
    }
  }

  async loadCatalogHits(
    snapshotId: string,
    names: readonly string[],
    options: GatewayReadOptions = {},
  ): Promise<SteamPortfolioCatalogHitsSuccess> {
    const hits = new Map<string, SteamPortfolioCatalogHitsSuccess['hits'][number]>()
    let echoedSnapshot = snapshotId
    try {
      for (const page of chunkNames(names)) {
        const parameters = new URLSearchParams()
        parameters.set('snapshot_id', snapshotId)
        for (const name of page) parameters.append('names', name)
        const response = await boundedJsonFetch(
          `/api/v1/steam-portfolio/catalog-hits?${parameters}`,
          {
            fetcher: this.fetcher,
            init: {
              method: 'GET',
              headers: { Accept: 'application/json' },
              cache: 'no-store',
              credentials: 'same-origin',
              referrerPolicy: 'no-referrer',
              redirect: 'error',
            },
            signal: options.signal,
            timeoutMs: this.catalogTimeoutMs,
          },
        )
        const document = decodeSteamPortfolioCatalogHits(response.payload)
        if (document.response_kind === 'ERROR') {
          throw new SteamPortfolioReadError(
            document.error.code,
            document.error.retryable,
            document.error.http_status,
          )
        }
        if (document.snapshot_id !== snapshotId) {
          throw new SteamPortfolioReadError('VALIDATION', false, response.status)
        }
        echoedSnapshot = document.snapshot_id
        for (const hit of document.hits) hits.set(hit.market_hash_name, hit)
      }
      return {
        api_contract: 'steam-portfolio-api',
        api_version: 'v1',
        response_kind: 'STEAM_PORTFOLIO_CATALOG_HITS',
        snapshot_id: echoedSnapshot,
        hits: names.map((name) => {
          const hit = hits.get(name)
          if (hit === undefined) throw new SteamPortfolioReadError('VALIDATION', false)
          return hit
        }),
      }
    } catch (error) {
      throw transportFailure(error)
    }
  }
}
