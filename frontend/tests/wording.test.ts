// @vitest-environment node
// The product design bans outcome-promising copy, and branch B additionally bans trade-confirmation
// wording. A source scan catches these in prose that no component test would ever render.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

const BANNED_ANYWHERE = ['稳赚', '必涨', '收益预测', '保本', '包赚']

// Allowed only inside the two files that mirror claims.py, where they name what is forbidden.
const TRADE_CONFIRMATION_WORDS = ['真实扫货']
const MIRROR_FILES = ['claims.ts', 'labels.ts']

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(SRC).filter((f) => /\.(ts|tsx|css)$/.test(f))

describe('prohibited copy', () => {
  it('found source files to scan', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  for (const word of BANNED_ANYWHERE) {
    it(`no file contains "${word}"`, () => {
      const hits = files.filter((f) => readFileSync(f, 'utf8').includes(word))
      expect(hits).toEqual([])
    })
  }

  for (const word of TRADE_CONFIRMATION_WORDS) {
    it(`"${word}" appears only in the claims.py mirror`, () => {
      const hits = files
        .filter((f) => readFileSync(f, 'utf8').includes(word))
        .filter((f) => !MIRROR_FILES.some((name) => f.endsWith(name)))
      expect(hits).toEqual([])
    })
  }

  // The collection header summarises members. Claiming it lists them one by one, or that
  // nothing is collapsed, overstates what the derived distribution actually does.
  for (const phrase of ['Nothing is collapsed', '分别列出', 'listed as they are']) {
    it(`no file claims "${phrase}"`, () => {
      const hits = files.filter((f) => readFileSync(f, 'utf8').includes(phrase))
      expect(hits).toEqual([])
    })
  }
})

// The bans below are about what reaches the screen, so they read code with comments removed. A
// comment that explains why a reading is wrong is the opposite of the problem, and a scan that
// flagged it would push the reasoning out of the file. Over-stripping only risks a miss, and no
// string here contains "//".
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
}

// B6. A zero-row response licenses none of these readings. The interface may still name them in
// order to deny them, which is exactly what the zero-sample panel does — so each occurrence has
// to sit behind a negation rather than be absent.
const NEGATION_PREFIXES = [
  '不等于',
  '不构成',
  '不说明',
  '并不意味着',
  'does not mean ',
  'does not say ',
  'does not establish ',
  'not evidence that ',
  'nothing about ',
]

// A source is not a platform. Saying a platform lacks support reaches past the one query that
// was actually run, so this one has no negated form to allow — the panel speaks of 来源 instead.
const ZERO_SAMPLE_OUTRIGHT = ['平台不支持', 'the platform does not support']

const ZERO_SAMPLE_ONLY_NEGATED = [
  '该身份不存在',
  '总供应量为零',
  'the source cannot answer',
  'this identity does not exist',
  'total supply is zero',
]

describe('a zero sample is not reported as a fact about the platform', () => {
  for (const phrase of ZERO_SAMPLE_OUTRIGHT) {
    it(`"${phrase}" appears nowhere at all`, () => {
      expect(files.filter((f) => code(f).includes(phrase))).toEqual([])
    })
  }

  for (const phrase of ZERO_SAMPLE_ONLY_NEGATED) {
    it(`"${phrase}" appears only behind a negation`, () => {
      const unqualified: string[] = []
      for (const file of files) {
        const text = code(file)
        let from = 0
        for (;;) {
          const at = text.indexOf(phrase, from)
          if (at === -1) break
          const before = text.slice(0, at)
          if (!NEGATION_PREFIXES.some((prefix) => before.endsWith(prefix))) unqualified.push(file)
          from = at + phrase.length
        }
      }
      expect(unqualified).toEqual([])
    })
  }

  // The denials have to actually be present, or the rule above would pass on a codebase that
  // simply never mentions the subject — which is not the same as refusing the conclusion.
  it('does state the denials somewhere', () => {
    const all = files.map(code).join('\n')
    for (const phrase of ZERO_SAMPLE_ONLY_NEGATED) expect(all).toContain(phrase)
  })
})

// B7. A provider authority may now appear as neutral catalog-name attribution. It must never be
// turned into somewhere to trade: destination copy remains globally forbidden regardless of
// whether a provider name arrived from the wire or appears in surrounding UI text.
const DESTINATION_PHRASES = [
  '去哪买',
  '哪里买',
  '购买链接',
  '前往购买',
  '立即购买',
  '下单',
  'where to buy',
  'buy now',
  'buy on ',
  'purchase link',
]

describe('sources are not presented as places to trade', () => {
  for (const phrase of DESTINATION_PHRASES) {
    it(`no rendered string contains "${phrase}"`, () => {
      expect(files.filter((f) => code(f).includes(phrase))).toEqual([])
    })
  }
})
