/** Build-time rollback only. No runtime DOM, publication, spec or date injection. */
export function nativeCnyMarketEnabled(value: string | undefined = import.meta.env.VITE_NATIVE_CNY_MARKET): boolean {
  return value !== '0'
}
