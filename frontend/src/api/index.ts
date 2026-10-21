import { MockResearchApi } from './MockResearchApi'
import type { ResearchApi } from './ResearchApi'

export {
  DEFAULT_LOCAL_RESULT_API_BASE_URL,
  HttpFormalResultReadGateway,
  ResultGatewayTransportError,
} from './HttpFormalResultReadGateway'
export type {
  HttpFormalResultReadGatewayOptions,
  ResultGatewayTransportFailure,
} from './HttpFormalResultReadGateway'
export { FxReferenceApi, FxReferenceRequestBindingViolation } from './FxReferenceApi'
export type { FxReferenceGateway, FxReferenceRequest } from './FxReferenceApi'
export {
  DEFAULT_FX_REFERENCE_API_URL,
  HttpFxReferenceGateway,
  FxReferenceTransportError,
} from './HttpFxReferenceGateway'
export type {
  FxReferenceTransportFailure,
  HttpFxReferenceGatewayOptions,
} from './HttpFxReferenceGateway'
export {
  CatalogDisplayApi,
  CatalogDisplayRequestBindingViolation,
} from './CatalogDisplayApi'
export type {
  CatalogDisplayGateway,
  CatalogDisplayGatewayRequest,
  CatalogDisplayListRequest,
  CatalogDisplaySnapshotListRequest,
} from './CatalogDisplayApi'
export {
  DEFAULT_LOCAL_CATALOG_DISPLAY_API_BASE_URL,
  HttpCatalogDisplayGateway,
  CatalogDisplayTransportError,
} from './HttpCatalogDisplayGateway'
export type {
  HttpCatalogDisplayGatewayOptions,
  CatalogDisplayTransportFailure,
} from './HttpCatalogDisplayGateway'
export {
  catalogQueryInstant,
  createLiveCatalogDisplayRuntime,
} from './catalogDisplayRuntime'
export type {
  LiveCatalogDisplayRuntime,
  LiveCatalogDisplayRuntimeOptions,
} from './catalogDisplayRuntime'
export { ValveEventsApi } from './ValveEventsApi'
export type {
  ValveEventDetailRequest,
  ValveEventListRequest,
  ValveEventsGateway,
  ValveEventsRequest,
} from './ValveEventsApi'
export { SingleItemTrendingPublicApi } from './SingleItemTrendingPublicApi'
export type {
  SingleItemTrendingPublicGateway,
  TrendingReadOptions,
  TrendingTransportResponse,
} from './SingleItemTrendingPublicApi'
export { HttpSingleItemTrendingPublicGateway } from './HttpSingleItemTrendingPublicGateway'

// Legacy page-proposal swap point. The four MOCK product views consume this interface.
// FormalResultReadApi deliberately does not replace it: formal envelopes have different fields
// and guarantees, so App composes their offline workspace as a separate data channel instead of
// disguising a formal response as this proposal DTO.
let current: ResearchApi = new MockResearchApi()

export function researchApi(): ResearchApi {
  return current
}

export function setResearchApi(api: ResearchApi): void {
  current = api
}

export type { ResearchApi }
