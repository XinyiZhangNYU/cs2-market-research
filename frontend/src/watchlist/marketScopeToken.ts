import { canonicalHash } from '../wire/canonical'

/** Stable descriptive-market scope token; with no publication it opens the scope on the latest release. */
export function marketScopeToken(scopeId: string): string {
  return canonicalHash({ contract: 'market-descriptive-public-api', scope_id: scopeId })
}
