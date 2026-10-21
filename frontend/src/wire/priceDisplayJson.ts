// JSON.parse alone erases duplicate keys and the distinction between 1, 1.0 and
// 1e0. Price V1 permits only integer JSON number tokens; prices are decimal strings.
// This bounded, non-evaluating parser runs inside boundedJsonFetch's deadline.
export function parsePriceJson(text: string): unknown {
  let at = 0
  const reject = (): never => { throw new TypeError('Invalid price JSON') }
  const whitespace = () => { while (/[ \t\r\n]/u.test(text[at] ?? '\0')) at += 1 }
  const string = (): string => {
    if (text[at] !== '"') return reject()
    const start = at++
    while (at < text.length) {
      const char = text[at++]
      if (char === '\\') { at += 1; continue }
      if (char === '"') {
        const value: unknown = JSON.parse(text.slice(start, at))
        if (typeof value !== 'string' || /[\ud800-\udfff]/u.test(value)) return reject()
        return value
      }
    }
    return reject()
  }
  const value = (depth: number): unknown => {
    if (depth > 64) return reject()
    whitespace()
    const char = text[at]
    if (char === '"') return string()
    if (char === '{') {
      at += 1
      const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>
      const keys = new Set<string>()
      whitespace()
      if (text[at] === '}') { at += 1; return result }
      while (true) {
        whitespace()
        const key = string()
        if (keys.has(key)) return reject()
        keys.add(key)
        whitespace()
        if (text[at++] !== ':') return reject()
        result[key] = value(depth + 1)
        whitespace()
        const separator = text[at++]
        if (separator === '}') return result
        if (separator !== ',') return reject()
      }
    }
    if (char === '[') {
      at += 1
      const result: unknown[] = []
      whitespace()
      if (text[at] === ']') { at += 1; return result }
      while (true) {
        result.push(value(depth + 1))
        whitespace()
        const separator = text[at++]
        if (separator === ']') return result
        if (separator !== ',') return reject()
      }
    }
    for (const [literal, parsed] of [['true', true], ['false', false], ['null', null]] as const) {
      if (text.startsWith(literal, at)) { at += literal.length; return parsed }
    }
    const token = /^-?(?:0|[1-9][0-9]*)/u.exec(text.slice(at))?.[0]
    if (token === undefined) return reject()
    at += token.length
    const number = Number(token)
    if (!Number.isSafeInteger(number)) return reject()
    return number
  }
  const document = value(0)
  whitespace()
  if (at !== text.length || document === null || typeof document !== 'object' || Array.isArray(document)) return reject()
  return document
}
