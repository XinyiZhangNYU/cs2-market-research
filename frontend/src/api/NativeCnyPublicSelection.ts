import type { NativeCnyIndexPanelGateway } from '../components/NativeCnyIndexPanel'
import type { NativeCnyIndexRequest } from '../wire/nativeCnyIndexPublicApi'
import type { NativeCnyTrendingPanelGateway } from '../trending/NativeCnyTrendingPanel'
import type { NativeCnyTrendingSelection } from './HttpNativeCnyTrendingGateway'
import type { NativeCnySingleDetailGateway } from '../adapter/nativeCnySingleViewModel'
import type { NativeCnySingleBinding } from '../wire/nativeCnySingleDecode'

/** Caller-selected public targets, not publication discovery or release authority.
 * An absent surface retains its legacy page. A present surface with a null target
 * remains explicitly unselected and must not fall back to legacy data. */
export type NativeCnyPublicSelection = Readonly<{
  index?: Readonly<{
    gateway: NativeCnyIndexPanelGateway
    request: NativeCnyIndexRequest | null
  }>
  trending?: Readonly<{
    gateway: NativeCnyTrendingPanelGateway
    selection: NativeCnyTrendingSelection | null
  }>
}>

/** Type preparation only. No PublicBetaApp prop consumes this selection yet.
 * Observed-trigger detail cannot replace the WATCHLIST list/current/history. */
export type NativeCnySingleDetailSelectionPreparation = Readonly<{
  gateway: NativeCnySingleDetailGateway
  selection: NativeCnySingleBinding | null
}>
