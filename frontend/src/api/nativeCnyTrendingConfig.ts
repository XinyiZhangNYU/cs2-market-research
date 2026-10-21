import type { CatalogDisplayGateway } from './CatalogDisplayApi'
import { HttpSingleItemTrendingPublicGateway } from './HttpSingleItemTrendingPublicGateway'
import { NativeCnyTrendingPublicGateway } from './NativeCnyTrendingPublicGateway'

/** Independent of the market flag. Fixed build-time rollback, no URL/storage toggle. */
export function nativeCnyTrendingEnabled(value: string | undefined = import.meta.env.VITE_NATIVE_CNY_TRENDING): boolean {
  return value !== '0' && value !== 'false'
}
export function createTrendingPublicGateway(catalog: CatalogDisplayGateway, enabled = nativeCnyTrendingEnabled()) {
  return enabled ? new NativeCnyTrendingPublicGateway(catalog) : new HttpSingleItemTrendingPublicGateway()
}
