const ECMASCRIPT_WHITESPACE = /[\u0009-\u000d\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/gu

export const MAX_CATALOG_QUERY_SCALARS = 128

export function catalogQueryScalarCount(value: string): number {
  return [...value].length
}

export function isCatalogQueryTextWithinLimit(value: string): boolean {
  return catalogQueryScalarCount(value) <= MAX_CATALOG_QUERY_SCALARS
}

export function normalizeCatalogQueryText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(ECMASCRIPT_WHITESPACE, ' ')
    .replace(/^ | $/gu, '')
    .toLowerCase()
}
