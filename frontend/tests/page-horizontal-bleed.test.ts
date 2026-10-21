// @vitest-environment node
// jsdom has no layout, so this guards the cause instead of the symptom: a negative side margin
// with a fixed length pulls an element past its column, and once that reaches past the page
// gutter the whole page pans sideways on phones. Full-bleed strips use --page-gutter instead.

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

/** Rules whose fixed negative side margin cannot reach the viewport edge, with the reason. */
const CONTAINED = new Map([
  ['.cx-visually-hidden', 'visually hidden 1px box'],
  ['.public-home__sr-only', 'visually hidden 1px box'],
  ['.public-market__scope-card-image', "cancels its own button's side padding"],
  ['.prototype-banner', 'research app only, never on the public site'],
])

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return cssFiles(path)
    return entry.name.endsWith('.css') ? [path] : []
  })
}

function rules(css: string): { selector: string; body: string }[] {
  const out: { selector: string; body: string }[] = []
  const preludes: string[] = []
  let text = ''
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (ch === '{') { preludes.push(text.trim()); text = '' }
    else if (ch === '}') { const selector = preludes.pop() ?? ''; if (text.trim()) out.push({ selector, body: text }); text = '' }
    else text += ch
  }
  return out
}

/** Splits a value on top-level whitespace, keeping calc(...) whole. */
function tokens(value: string): string[] {
  const out: string[] = []
  let depth = 0
  let token = ''
  for (const ch of value.trim()) {
    if (ch === '(') depth += 1
    if (ch === ')') depth -= 1
    if (/\s/.test(ch) && depth === 0) { if (token) out.push(token); token = '' }
    else token += ch
  }
  if (token) out.push(token)
  return out
}

function sideMargins(property: string, value: string): string[] {
  const parts = tokens(value.replace(/!important/, ''))
  if (property === 'margin') return parts.length === 4 ? [parts[1], parts[3]] : parts.length >= 2 ? [parts[1]] : parts
  if (property === 'margin-inline') return parts
  return /^margin-(left|right|inline-start|inline-end)$/.test(property) ? parts : []
}

const declarations = cssFiles(SRC).flatMap((file) =>
  rules(readFileSync(file, 'utf8')).flatMap(({ selector, body }) =>
    [...body.matchAll(/(margin[a-z-]*)\s*:\s*([^;]+)/g)].map(([, property, value]) => ({
      file: relative(SRC, file).replace(/\\/g, '/'),
      selector,
      property,
      value: value.trim(),
    })),
  ),
)

describe('page horizontal bleed', () => {
  it('has no fixed negative side margin outside contained rules', () => {
    const offenders = declarations
      .filter(({ property, value }) => sideMargins(property, value).some((part) => /^-\d/.test(part)))
      .filter(({ selector }) => !CONTAINED.has(selector))
      .map(({ file, selector, property, value }) => `${file} ${selector} { ${property}: ${value} }`)
    expect(offenders).toEqual([])
  })

  it('keeps every contained exception in use', () => {
    const negative = new Set(
      declarations.filter(({ property, value }) => sideMargins(property, value).some((part) => /^-\d/.test(part))).map(({ selector }) => selector),
    )
    expect([...CONTAINED.keys()].filter((selector) => !negative.has(selector))).toEqual([])
  })

  it('bleeds the catalog chip rows exactly to the page gutter', () => {
    const chips = declarations.filter(({ file, selector }) => file === 'catalog/catalogExplorer.css' && selector === '.cx-rail ul')
    expect(chips.filter(({ property }) => property === 'margin').map(({ value }) => value)).toContain('0 calc(var(--page-gutter, 0px) * -1) !important')
    const gutters = rules(readFileSync(join(SRC, 'styles.css'), 'utf8'))
      .filter(({ body }) => body.includes('--page-gutter:'))
      .map(({ body }) => /--page-gutter:\s*([^;]+)/.exec(body)?.[1].trim())
    expect(gutters).toEqual(['20px', '14px'])
  })
})
