import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { verifyTradeUpRelease } from '../src/tradeup/tradeupGraph.mjs'
import { TRADEUP_RELEASE } from '../src/tradeup/tradeupRelease.mjs'

const path = new URL(`../public${TRADEUP_RELEASE.url}`, import.meta.url)
const bytes = await readFile(path)
// Source-only hygiene checks stay out of the browser bundle. The browser
// accepts only these exact reviewed bytes and validates their graph structure.
const text = bytes.toString('utf8')
for (const forbidden of ['steam_image', 'steamstatic', 'http://', 'https://']) {
  if (text.includes(forbidden)) throw new Error(`trade-up public graph contains ${forbidden}`)
}
const graph = verifyTradeUpRelease(bytes)
// The source digests cover this subset only: its rule edges and its catalog bindings.
const digest = (value) => createHash('sha256').update(`${JSON.stringify(value)}
`).digest('hex')
if (graph.source.subset_rules_sha256 !== digest({ collections: graph.collections, cases: graph.cases })) throw new Error('trade-up subset rules digest differs')
if (graph.source.subset_catalog_sha256 !== digest(graph.skins.map((skin) => skin.catalog))) throw new Error('trade-up subset catalog digest differs')
console.log(`TRADEUP_PUBLIC_GRAPH_VERIFIED=${graph.skins.length} RELEASE=${TRADEUP_RELEASE.id} SHA256=${TRADEUP_RELEASE.sha256}`)
