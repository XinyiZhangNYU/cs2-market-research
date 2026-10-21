import type { EquipmentModel } from './equipmentModels'

// Presentation-side query intent only. The server still receives a plain
// equipment selection and search text; no alias or slang table is involved.

export type CatalogSearchIntent = Readonly<{
  /** Model named at the start of the query, when the user picked no model. */
  model: EquipmentModel | null
  /** Text left for the server-side series search, or null when nothing remains. */
  remainder: string | null
}>

const IGNORED = /[\s\-_.·・|｜]/u
const LATIN_WORD = /[a-z0-9]/iu

function compact(value: string): string {
  let out = ''
  for (const char of value.normalize('NFKC').toLowerCase()) {
    if (!IGNORED.test(char)) out += char
  }
  return out
}

type Candidate = Readonly<{ model: EquipmentModel; key: string }>

const candidateCache = new WeakMap<readonly EquipmentModel[], readonly Candidate[]>()

function candidatesFor(models: readonly EquipmentModel[]): readonly Candidate[] {
  const cached = candidateCache.get(models)
  if (cached) return cached
  const seen = new Set<string>()
  const list: Candidate[] = []
  for (const model of models) {
    if (model.scope !== 'MODEL' || model.category === 'UNCLASSIFIED') continue
    for (const name of [model.name.zh, model.name.en]) {
      const key = compact(name)
      if (key.length < 2 || seen.has(`${model.id}\u0000${key}`)) continue
      seen.add(`${model.id}\u0000${key}`)
      list.push({ model, key })
    }
  }
  // Longest key first so “M9 刺刀” wins over “刺刀”, “M4A1-S” over nothing shorter.
  list.sort((left, right) => right.key.length - left.key.length)
  candidateCache.set(models, list)
  return list
}

/** Returns how many original UTF-16 units cover `count` non-ignored characters. */
function originalLength(text: string, count: number): number {
  let consumed = 0
  let index = 0
  for (const char of text) {
    if (consumed === count) break
    if (!IGNORED.test(char)) consumed += [...char.normalize('NFKC').toLowerCase()].length
    index += char.length
  }
  return index
}

function trimRemainder(value: string): string | null {
  const trimmed = value.replace(/^[\s|｜·:：\-]+/u, '').trim()
  return trimmed === '' ? null : trimmed
}

export function parseCatalogSearchIntent(
  query: string,
  models: readonly EquipmentModel[],
): CatalogSearchIntent {
  const text = query.trim()
  if (text === '') return { model: null, remainder: null }
  const head = compact(text)
  for (const { model, key } of candidatesFor(models)) {
    if (!head.startsWith(key)) continue
    const end = originalLength(text, key.length)
    const next = text.slice(end, end + 1)
    const last = text.slice(end - 1, end)
    // A Latin name must end on a word boundary: “AWP” matches “AWP 二西莫夫”, not “AWPX”.
    if (next !== '' && LATIN_WORD.test(last) && LATIN_WORD.test(next)) continue
    return { model, remainder: trimRemainder(text.slice(end)) }
  }
  return { model: null, remainder: text }
}
