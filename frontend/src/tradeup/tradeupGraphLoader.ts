import { verifyTradeUpRelease } from './tradeupGraph.mjs'
import { TRADEUP_RELEASE } from './tradeupRelease.mjs'
import { SharedRead } from '../performance/sharedRead'
import type { TradeUpGraphDocument } from './tradeupTypes'

// Memory only, one pinned release, 30s maximum. Invalid bytes and failures are
// never retained; cancellation detaches a reader without aborting its peers.
export const TRADEUP_GRAPH_REUSE_MS = 30_000
const graphReads = new SharedRead<TradeUpGraphDocument>(1, TRADEUP_GRAPH_REUSE_MS)
function freezeGraph<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freezeGraph)
    Object.freeze(value)
  }
  return value
}

export async function loadTradeUpGraph(signal: AbortSignal) {
  return graphReads.read(TRADEUP_RELEASE.sha256, async (sharedSignal) => {
    const response = await fetch(`${TRADEUP_RELEASE.url}?sha256=${TRADEUP_RELEASE.sha256}`, {
      headers: { Accept: 'application/json' }, cache: 'no-cache', signal: sharedSignal,
    })
    if (!response.ok) throw new Error(`trade-up graph ${response.status}`)
    const bytes = new Uint8Array(await response.arrayBuffer())
    return freezeGraph(verifyTradeUpRelease(bytes))
  }, () => true, signal)
}
