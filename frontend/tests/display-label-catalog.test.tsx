import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import displayLabelCatalogJson from '../src/i18n/display-labels.json'
import {
  DISPLAY_FIELD_AXIS_NAMES,
  DISPLAY_LABEL_MAP_NAMES,
  DisplayLabelCatalogError,
  decodeDisplayLabelCatalog,
  decodeDisplayLabelMap,
  label,
  type LabelMap,
} from '../src/contract/labels'
import { EditionKind } from '../src/contract/identity'
import { EnumChip, EnumPresentation } from '../src/components/EnumChip'

const CJK = /[　-〿一-鿿＀-￯]/

describe('the JSON display-label catalog is exact and fail-closed', () => {
  it('uses the concise product edition names in both languages', () => {
    const decoded = decodeDisplayLabelCatalog(displayLabelCatalogJson)
    const editions = decoded.enumValues.editionKind as Record<
      EditionKind,
      { zh: string; en: string }
    >

    expect(editions[EditionKind.STANDARD]).toEqual({ zh: '普通', en: 'Standard' })
    expect(editions[EditionKind.SOUVENIR]).toEqual({ zh: '纪念品', en: 'Souvenir' })
    expect(editions[EditionKind.STATTRAK]).toEqual({ zh: 'StatTrak™', en: 'StatTrak™' })
  })

  it('contains only the approved mechanical enum namespaces', () => {
    const decoded = decodeDisplayLabelCatalog(displayLabelCatalogJson)
    expect(Object.keys(decoded.enumValues).sort()).toEqual([...DISPLAY_LABEL_MAP_NAMES].sort())
    expect(Object.keys(decoded.fieldAxes).sort()).toEqual([...DISPLAY_FIELD_AXIS_NAMES].sort())
  })

  it('keeps every current localized value non-empty and English free of CJK', () => {
    const decoded = decodeDisplayLabelCatalog(displayLabelCatalogJson)
    const maps = { ...decoded.enumValues, fieldAxes: decoded.fieldAxes }
    for (const [mapName, rawMap] of Object.entries(maps)) {
      for (const [machine, localized] of Object.entries(
        rawMap as Record<string, { zh: string; en: string }>,
      )) {
        expect(localized.zh.trim().length, `${mapName}.${machine}.zh`).toBeGreaterThan(0)
        expect(localized.en.trim().length, `${mapName}.${machine}.en`).toBeGreaterThan(0)
        expect(CJK.test(localized.en), `${mapName}.${machine}.en`).toBe(false)
        expect(Object.keys(localized).sort(), `${mapName}.${machine} locale keys`).toEqual([
          'en',
          'zh',
        ])
      }
    }
  })

  it('rejects missing and extra catalog namespaces', () => {
    const missing = structuredClone(displayLabelCatalogJson) as Record<string, unknown>
    const missingEnumValues = missing.enumValues as Record<string, unknown>
    delete missingEnumValues.itemCycleStage
    expect(() => decodeDisplayLabelCatalog(missing)).toThrow(DisplayLabelCatalogError)
    expect(() => decodeDisplayLabelCatalog(missing)).toThrow(/missing=\[itemCycleStage\]/)

    const extra = structuredClone(displayLabelCatalogJson) as Record<string, unknown>
    const extraEnumValues = extra.enumValues as Record<string, unknown>
    extraEnumValues.futureProductFields = {}
    expect(() => decodeDisplayLabelCatalog(extra)).toThrow(DisplayLabelCatalogError)
    expect(() => decodeDisplayLabelCatalog(extra)).toThrow(/extra=\[futureProductFields\]/)

    const missingAxis = structuredClone(displayLabelCatalogJson) as Record<string, unknown>
    const missingFieldAxes = missingAxis.fieldAxes as Record<string, unknown>
    delete missingFieldAxes.dimMarketTrend
    expect(() => decodeDisplayLabelCatalog(missingAxis)).toThrow(/missing=\[dimMarketTrend\]/)
  })

  it('rejects missing, extra, empty, mixed-language and malformed entries', () => {
    const valid = {
      A: { zh: '甲', en: 'Alpha' },
      B: { zh: '乙', en: 'Beta' },
    }
    expect(decodeDisplayLabelMap(valid, ['A', 'B'])).toEqual(valid)

    expect(() => decodeDisplayLabelMap({ A: valid.A }, ['A', 'B'])).toThrow(/missing=\[B\]/)
    expect(() => decodeDisplayLabelMap({ ...valid, C: valid.A }, ['A', 'B'])).toThrow(
      /extra=\[C\]/,
    )
    expect(() => decodeDisplayLabelMap({ ...valid, A: { zh: '', en: 'Alpha' } }, ['A', 'B']))
      .toThrow(/A\.zh must be a non-empty string/)
    expect(() => decodeDisplayLabelMap({ ...valid, A: { zh: '甲', en: '中文' } }, ['A', 'B']))
      .toThrow(/A\.en must not contain CJK text/)
    expect(() =>
      decodeDisplayLabelMap(
        { ...valid, A: { zh: '甲', en: 'Alpha', fallback: 'A' } },
        ['A', 'B'],
      ),
    ).toThrow(/extra=\[fallback\]/)
  })

  it('does not fall back to an unknown machine value', () => {
    const map: LabelMap<'KNOWN'> = { KNOWN: { zh: '已知', en: 'Known' } }
    expect(() => label(map, 'UNKNOWN' as 'KNOWN', 'en')).toThrow(DisplayLabelCatalogError)
    expect(() => label(map, 'UNKNOWN' as 'KNOWN', 'en')).toThrow(
      /no display label for enum value "UNKNOWN"/,
    )
  })
})

describe('EnumChip presentation is explicit while current pages remain technical', () => {
  it('keeps the existing machine plus label DOM in the default TECHNICAL mode', () => {
    const { container } = render(<EnumChip machine="NORMAL" label="Normal" />)
    const chip = container.querySelector('.enum-chip')
    expect(chip).toHaveAttribute('data-machine', 'NORMAL')
    expect(chip?.querySelector('code')).toHaveTextContent('NORMAL')
    expect(chip?.querySelector('em')).toHaveTextContent('Normal')
  })

  it('can render one human line while retaining the machine value only as metadata', () => {
    const { container } = render(
      <EnumChip
        machine="NORMAL"
        label="Normal"
        presentation={EnumPresentation.PRODUCT_PRIMARY}
      />,
    )
    const chip = container.querySelector('.enum-chip')
    expect(chip).toHaveAttribute('data-machine', 'NORMAL')
    expect(chip?.querySelector('code')).toBeNull()
    expect(screen.getByText('Normal')).toBeInTheDocument()
    expect(screen.queryByText('NORMAL')).toBeNull()
  })

  it('refuses PRODUCT_PRIMARY without a localized label', () => {
    expect(() =>
      render(
        <EnumChip
          machine="NORMAL"
          label=""
          presentation={EnumPresentation.PRODUCT_PRIMARY}
        />,
      ),
    ).toThrow(/PRODUCT_PRIMARY requires a localized label/)
  })
})
