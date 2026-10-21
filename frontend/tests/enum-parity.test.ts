// @vitest-environment node
// Guards the TypeScript mirror against silently diverging from the Python contract
// (src/cs2_research/state_machine/enums.py in this repository).

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as ts from '../src/contract/enums'
import * as identity from '../src/contract/identity'

const PY_PATH = fileURLToPath(
  new URL('../../src/cs2_research/state_machine/enums.py', import.meta.url),
)

function parsePythonStrEnums(source: string): Map<string, Set<string>> {
  // Long members are wrapped as NAME = (\n    "VALUE"\n); collapse those before scanning lines.
  const normalized = source.replace(/=\s*\(\s*("(?:[^"\\]|\\.)*")\s*\)/g, '= $1')
  const result = new Map<string, Set<string>>()
  let current: string | null = null
  for (const line of normalized.split(/\r?\n/)) {
    const classMatch = /^class\s+(\w+)\(StrEnum\):/.exec(line)
    if (classMatch) {
      current = classMatch[1]
      result.set(current, new Set())
      continue
    }
    if (line.trim() !== '' && !/^\s/.test(line)) {
      current = null
      continue
    }
    if (!current) continue
    const memberMatch = /^\s{4}\w+\s*=\s*"([^"]+)"\s*$/.exec(line)
    if (memberMatch) result.get(current)!.add(memberMatch[1])
  }
  return result
}

const pythonEnums = parsePythonStrEnums(readFileSync(PY_PATH, 'utf8'))

const MIRRORED: Record<string, Readonly<Record<string, string>>> = {
  ScopeKind: ts.ScopeKind,
  AnalysisUnitKind: ts.AnalysisUnitKind,
  DataBranch: ts.DataBranch,
  DataStatus: ts.DataStatus,
  FreshnessStatus: ts.FreshnessStatus,
  FeatureValueStatus: ts.FeatureValueStatus,
  MissingCause: ts.MissingCause,
  FeatureRequiredness: ts.FeatureRequiredness,
  FeatureProvision: ts.FeatureProvision,
  SemanticStatus: ts.SemanticStatus,
  EvidenceType: ts.EvidenceType,
  Directness: ts.Directness,
  CoreDomain: ts.CoreDomain,
  DomainStrength: ts.DomainStrength,
  DomainMissingReasonCode: ts.DomainMissingReasonCode,
  SignalStrength: ts.SignalStrength,
  ItemCycleStage: ts.ItemCycleStage,
  MarketTrendStage: ts.MarketTrendStage,
  MarketLevelRegime: ts.MarketLevelRegime,
  SectorTrendStage: ts.SectorTrendStage,
  RelativeStrength: ts.RelativeStrength,
  EvidenceFlag: ts.EvidenceFlag,
  RegimeRelation: ts.RegimeRelation,
  Recommendation: ts.Recommendation,
  TradeConfirmation: ts.TradeConfirmation,
  CaseStatus: ts.CaseStatus,
  ResolutionCode: ts.ResolutionCode,
  TransitionMode: ts.TransitionMode,
  TransitionReason: ts.TransitionReason,
  LifecycleEntityKind: ts.LifecycleEntityKind,
  LifecycleAction: ts.LifecycleAction,
  OutcomeLabel: ts.OutcomeLabel,
  ValidationLevel: ts.ValidationLevel,
  ValidationClaim: ts.ValidationClaim,
  ClaimCode: ts.ClaimCode,
}

describe('TypeScript enum mirror matches the Python contract', () => {
  it('parsed the Python source', () => {
    expect(pythonEnums.size).toBeGreaterThan(20)
  })

  it('mirrors every StrEnum defined in enums.py', () => {
    const missing = [...pythonEnums.keys()].filter((name) => !(name in MIRRORED))
    expect(missing).toEqual([])
  })

  for (const [name, tsEnum] of Object.entries(MIRRORED)) {
    it(`${name} has identical members`, () => {
      const pythonValues = pythonEnums.get(name)
      expect(pythonValues, `${name} missing from enums.py`).toBeDefined()
      expect([...Object.values(tsEnum)].sort()).toEqual([...pythonValues!].sort())
    })
  }
})

// The identity fields are Literal aliases in catalog/models.py, not StrEnums, so the parser above
// never sees them and EditionKind was free to drift. Same guard, different declaration form.
const CATALOG_PATH = fileURLToPath(
  new URL('../../src/cs2_research/catalog/models.py', import.meta.url),
)

function parsePythonLiterals(source: string): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>()
  for (const match of source.matchAll(/^(\w+)\s*=\s*Literal\[([\s\S]*?)\]/gm)) {
    result.set(match[1], new Set([...match[2].matchAll(/"([^"]+)"/g)].map((m) => m[1])))
  }
  return result
}

const catalogLiterals = parsePythonLiterals(readFileSync(CATALOG_PATH, 'utf8'))

// Only what the frontend actually mirrors. The rest of catalog stays out of the result contract.
const CATALOG_MIRRORED: Record<string, Readonly<Record<string, string>>> = {
  EditionKind: identity.EditionKind,
  PromotionStatus: identity.PromotionStatus,
  AnalysisUnitKind: ts.AnalysisUnitKind,
}

describe('TypeScript mirror matches the catalog Literal aliases', () => {
  it('parsed the catalog source', () => {
    expect(catalogLiterals.size).toBeGreaterThan(5)
  })

  for (const [name, tsEnum] of Object.entries(CATALOG_MIRRORED)) {
    it(`${name} has identical members`, () => {
      const pythonValues = catalogLiterals.get(name)
      expect(pythonValues, `${name} missing from catalog/models.py`).toBeDefined()
      expect([...Object.values(tsEnum)].sort()).toEqual([...pythonValues!].sort())
    })
  }

  // catalog and state_machine both define ScopeKind and SemanticStatus, and they are different
  // things. The frontend mirrors the state_machine pair; asserting the collision is real keeps a
  // later reader from "fixing" the mirror against the wrong file.
  it.each(['ScopeKind', 'SemanticStatus'])('%s means something else in catalog', (name) => {
    const catalogValues = [...catalogLiterals.get(name)!].sort()
    const stateValues = [...pythonEnums.get(name)!].sort()
    expect(catalogValues).not.toEqual(stateValues)
    expect([...Object.values(MIRRORED[name])].sort()).toEqual(stateValues)
  })
})
