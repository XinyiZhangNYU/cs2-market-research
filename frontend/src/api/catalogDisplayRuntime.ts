import type { CatalogDisplayGateway } from './CatalogDisplayApi'
import { HttpCatalogDisplayGateway } from './HttpCatalogDisplayGateway'

export type LiveCatalogDisplayRuntime = Readonly<{
  dataEnvironment: 'LIVE_LOCAL'
  gateway: CatalogDisplayGateway
  snapshotQueryAsOf: string
  snapshotKnownAt: string
}>

export type LiveCatalogDisplayRuntimeOptions = Readonly<{
  gateway?: CatalogDisplayGateway
  now?: () => Date
}>

export function catalogQueryInstant(date: Date): string {
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError('catalog query instant must be a valid Date')
  }
  return date.toISOString().replace(/(\.\d{3})Z$/, '$1000Z')
}

/**
 * Runtime bootstrap for the local real catalog channel.
 *
 * The browser entry uses this by default, while tests and embedded hosts can inject the exact
 * same gateway boundary. The generated instant is only the cutoff for snapshot discovery; it is
 * never reused as the units snapshot. The selected descriptor supplies the exact units `as_of`
 * and seal `available_at` after the inventory response has been decoded and request-bound.
 */
export function createLiveCatalogDisplayRuntime(
  options: LiveCatalogDisplayRuntimeOptions = {},
): LiveCatalogDisplayRuntime {
  const instant = catalogQueryInstant((options.now ?? (() => new Date()))())
  return Object.freeze({
    dataEnvironment: 'LIVE_LOCAL' as const,
    gateway: options.gateway ?? new HttpCatalogDisplayGateway(),
    snapshotQueryAsOf: instant,
    snapshotKnownAt: instant,
  })
}
