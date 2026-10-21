// Canonical JSON and snapshot hashing, transcribed from src/cs2_research/canonical.py.
// Both sides must emit the same bytes for the same document: the shared examples carry
// snapshot_id values Python computed, and tests/wire-semantic.test.ts re-derives them here.
// If this file drifts, those examples stop decoding — the drift cannot stay quiet.
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'

export class CanonicalizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CanonicalizationError'
  }
}

// Python orders keys by code point; Array#sort compares UTF-16 code units. The two disagree
// above the BMP, so ordering is done on code points rather than on the default comparator.
export function compareCodePoints(left: string, right: string): number {
  const a = Array.from(left)
  const b = Array.from(right)
  const shared = Math.min(a.length, b.length)
  for (let index = 0; index < shared; index += 1) {
    const x = a[index].codePointAt(0) as number
    const y = b[index].codePointAt(0) as number
    if (x !== y) return x < y ? -1 : 1
  }
  return a.length - b.length
}

export function sortedByCodePoint(values: readonly string[]): string[] {
  return [...values].sort(compareCodePoints)
}

export function isSortedByCodePoint(values: readonly string[]): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (compareCodePoints(values[index - 1], values[index]) > 0) return false
  }
  return true
}

function write(value: unknown, out: string[], path: string): void {
  if (value === null) {
    out.push('null')
    return
  }
  const kind = typeof value
  if (kind === 'boolean') {
    out.push(value === true ? 'true' : 'false')
    return
  }
  if (kind === 'string') {
    // canonical.py encodes to UTF-8, and an unpaired surrogate has no UTF-8 form: Python raises
    // UnicodeEncodeError. JavaScript would not stop here on its own - JSON.stringify emits a
    // \ud800 escape and TextEncoder silently substitutes U+FFFD - so a document Python cannot
    // address at all would otherwise receive a JavaScript-only hash.
    if (/\p{Surrogate}/u.test(value as string)) {
      throw new CanonicalizationError(`${path} contains an unpaired surrogate`)
    }
    out.push(JSON.stringify(value))
    return
  }
  if (kind === 'number') {
    // canonical.py refuses float and Decimal outright; only integers survive canonicalisation.
    if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
      throw new CanonicalizationError(`${path} is not a canonical integer`)
    }
    out.push(String(value))
    return
  }
  if (Array.isArray(value)) {
    out.push('[')
    value.forEach((entry, index) => {
      if (index > 0) out.push(',')
      write(entry, out, `${path}[${index}]`)
    })
    out.push(']')
    return
  }
  if (kind === 'object') {
    const record = value as Record<string, unknown>
    out.push('{')
    Object.keys(record)
      .sort(compareCodePoints)
      .forEach((key, index) => {
        if (index > 0) out.push(',')
        out.push(JSON.stringify(key), ':')
        write(record[key], out, `${path}.${key}`)
      })
    out.push('}')
    return
  }
  throw new CanonicalizationError(`${path} has no canonical JSON form (${kind})`)
}

const ENCODER = new TextEncoder()

export function canonicalJsonText(value: unknown): string {
  const out: string[] = []
  write(value, out, '$')
  out.push('\n')
  return out.join('')
}

export function canonicalJsonBytes(value: unknown): Uint8Array {
  return ENCODER.encode(canonicalJsonText(value))
}

export function sha256Hex(bytes: Uint8Array): string {
  return bytesToHex(sha256(bytes))
}

export function canonicalHash(value: unknown): string {
  return sha256Hex(canonicalJsonBytes(value))
}

// Hash the document as it stands, minus snapshot_id. No reordering, no repair - and since
// RC-R007 the decoder calls exactly this, so every envelope it accepts reproduces its own
// snapshot_id from its own bytes. The earlier decoder hashed a sorted copy instead, which let
// a document be accepted and sealed while its own bytes hashed to something else.
export function snapshotIdOf(document: Readonly<Record<string, unknown>>): string {
  const body: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(document)) {
    if (key !== 'snapshot_id') body[key] = value
  }
  return canonicalHash(body)
}
