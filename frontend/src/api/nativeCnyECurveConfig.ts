/**
 * The E second curve ("等权几何指数 / Equal-weight geometric index") is not in the release
 * selector, so its spec is a fixed build-time constant: VITE_NATIVE_CNY_E_SPEC, the
 * spec_sha256 of the server E seed RECEIPT (RUNBOOK E1.4). It is only known after that seed,
 * so the default is fail-closed: unset, empty or not 64 lowercase hex hides E.
 *
 * VITE_NATIVE_CNY_E_CURVE is the rollback lever: '0' or 'false' hides E while keeping the
 * spec in the build environment. Any other value, or unset, shows E when the spec is set.
 * Both are read once at build time; there is no URL, storage, HTML or runtime injection.
 */
const E_SPEC_PATTERN = /^[0-9a-f]{64}$/u

export function nativeCnyECurveSpec(
  spec: string | undefined = import.meta.env.VITE_NATIVE_CNY_E_SPEC,
  flag: string | undefined = import.meta.env.VITE_NATIVE_CNY_E_CURVE,
): string | null {
  if (flag === '0' || flag === 'false') return null
  return typeof spec === 'string' && E_SPEC_PATTERN.test(spec) ? spec : null
}

/** The public build refuses a set but malformed spec instead of silently shipping E hidden. */
export function nativeCnyECurveSpecProblem(spec: string | undefined): string | null {
  if (spec === undefined || spec === '') return null
  return E_SPEC_PATTERN.test(spec) ? null : 'VITE_NATIVE_CNY_E_SPEC must be 64 lowercase hex characters (the E seed spec_sha256)'
}
