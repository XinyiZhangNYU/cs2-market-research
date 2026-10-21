import { TRADEUP_RELEASE } from './tradeupRelease.mjs'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'

function requireFact(condition, detail) {
  if (!condition) throw new Error(`INVALID_TRADEUP_GRAPH: ${detail}`)
}
function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function text(value) {
  return typeof value === 'string' && value.trim().length > 0
}
function strings(value) {
  return Array.isArray(value) && value.every(text) && new Set(value).size === value.length
}
function float(value) {
  requireFact(typeof value === 'string' && /^(?:0|1)(?:\.\d{1,32})?$/u.test(value), 'float syntax')
  const [whole, tail = ''] = value.split('.')
  const scale = 10n ** BigInt(tail.length)
  const numerator = BigInt(whole + tail)
  requireFact(numerator <= scale, 'float outside [0,1]')
  return { numerator, scale }
}

// Direct engine callers cannot silently omit members or renormalize damaged
// edges. This structural gate does not by itself establish provenance.
export function validateTradeUpGraph(graph) {
  requireFact(object(graph) && graph.schema === 'cs2rotate.tradeup.public-graph.v1', 'schema')
  requireFact(Array.isArray(graph.skins) && graph.skins.length > 0, 'skins')
  requireFact(object(graph.source) && object(graph.collections) && object(graph.cases), 'containers')
  requireFact(object(graph.labels_zh) && object(graph.labels_zh.collections) && object(graph.labels_zh.cases), 'labels')
  const byId = new Map()
  const units = new Set()
  const bases = new Set()
  for (const skin of graph.skins) {
    requireFact(object(skin) && text(skin.id) && !byId.has(skin.id), 'duplicate or empty skin identity')
    requireFact(['weapon', 'knife', 'glove'].includes(skin.kind), `kind ${skin.id}`)
    requireFact(Number.isInteger(skin.rarity_tier) && skin.rarity_tier >= 1 && skin.rarity_tier <= 7, `rarity ${skin.id}`)
    requireFact(typeof skin.has_stattrak === 'boolean', `edition ${skin.id}`)
    requireFact(skin.kind !== 'glove' || skin.has_stattrak === false, `glove edition ${skin.id}`)
    requireFact(typeof skin.weapon === 'string' && typeof skin.finish === 'string' && text(skin.rarity_name), `skin fields ${skin.id}`)
    requireFact(skin.collection === null || text(skin.collection), `collection ${skin.id}`)
    requireFact(strings(skin.cases), `cases ${skin.id}`)
    const low = float(skin.float_min)
    const high = float(skin.float_max)
    requireFact(low.numerator * high.scale < high.numerator * low.scale, `nonpositive float span ${skin.id}`)
    requireFact(object(skin.names) && text(skin.names.en) && text(skin.names.zh_cn), `names ${skin.id}`)
    const catalog = skin.catalog
    requireFact(object(catalog) && text(catalog.analysis_unit_id) && text(catalog.base_item_code), `catalog ${skin.id}`)
    requireFact(!units.has(catalog.analysis_unit_id) && !bases.has(catalog.base_item_code), `duplicate catalog identity ${skin.id}`)
    requireFact(object(catalog.localized_name) && catalog.localized_name.en === skin.names.en && catalog.localized_name.zh_cn === skin.names.zh_cn, `localized identity ${skin.id}`)
    requireFact(object(catalog.media) && catalog.media.status === 'BOUND' && text(catalog.media.media_key) && text(catalog.media.media_asset_version_id), `media ${skin.id}`)
    units.add(catalog.analysis_unit_id)
    bases.add(catalog.base_item_code)
    byId.set(skin.id, skin)
  }
  const collectionEdges = new Set()
  for (const [name, collection] of Object.entries(graph.collections)) {
    requireFact(text(name) && object(collection) && object(collection.by_tier), `collection shape ${name}`)
    for (const [tier, ids] of Object.entries(collection.by_tier)) {
      requireFact(/^[1-7]$/u.test(tier) && strings(ids) && ids.length > 0, `collection pool ${name}`)
      for (const id of ids) {
        const skin = byId.get(id)
        requireFact(skin && skin.kind === 'weapon' && skin.collection === name && skin.rarity_tier === Number(tier), `collection edge ${name}/${id}`)
        requireFact(!collectionEdges.has(id), `duplicate collection edge ${id}`)
        collectionEdges.add(id)
      }
    }
  }
  for (const skin of graph.skins) {
    requireFact(skin.kind !== 'weapon' || skin.collection === null || collectionEdges.has(skin.id), `missing collection edge ${skin.id}`)
  }
  const caseEdges = new Set()
  for (const [name, entry] of Object.entries(graph.cases)) {
    requireFact(text(name) && object(entry) && strings(entry.gold_ids) && entry.gold_ids.length > 0, `case pool ${name}`)
    for (const id of entry.gold_ids) {
      const skin = byId.get(id)
      requireFact(skin && ['knife', 'glove'].includes(skin.kind) && skin.cases.includes(name), `case edge ${name}/${id}`)
      caseEdges.add(`${name}\0${id}`)
    }
  }
  for (const skin of graph.skins) {
    for (const name of skin.cases) {
      requireFact(Object.hasOwn(graph.cases, name), `missing case ${name}`)
      requireFact(skin.kind === 'weapon' || caseEdges.has(`${name}\0${skin.id}`), `missing gold edge ${name}/${skin.id}`)
    }
  }
  requireFact(graph.source.catalog_media_bound === graph.skins.length && graph.source.catalog_media_not_produced === 0, 'media totals')
  return graph
}

// SHA is computed from received bytes, not reserialized JSON. The expected pin
// is compiled with the application rather than accepted from the response.
export function verifyTradeUpRelease(bytes) {
  requireFact(bytesToHex(sha256(bytes)) === TRADEUP_RELEASE.sha256, 'release SHA-256 mismatch')
  const textBytes = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  const graph = validateTradeUpGraph(JSON.parse(textBytes))
  requireFact(graph.skins.length === TRADEUP_RELEASE.skins, 'release skin count')
  requireFact(Object.keys(graph.source).length === Object.keys(TRADEUP_RELEASE.source).length, 'source contract')
  for (const [key, value] of Object.entries(TRADEUP_RELEASE.source)) {
    requireFact(graph.source[key] === value, `release source ${key}`)
  }
  return graph
}
