import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NATIVE_CNY_BOOTSTRAP_ID, resolveNativeCnyPublicBootstrap } from '../src/publicNativeCnyBootstrap'
import { nativeTrendingFixture } from './native-cny-trending-view-fixture'
const hash = (digit: string) => digit.repeat(64)
const index = { kind: 'DAY', publication_id: hash('a'), spec_sha256: hash('b'), scope_code: 'ALL', bucket_date: '2026-10-01' }
function install(value: unknown) {
  const script = document.createElement('script')
  script.id = NATIVE_CNY_BOOTSTRAP_ID; script.type = 'application/json'
  script.textContent = typeof value === 'string' ? value : JSON.stringify(value)
  document.body.append(script); return script
}
const config = () => ({ schema: 'native-cny-public-bootstrap/1', index: structuredClone(index), trending: nativeTrendingFixture().selection })
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network forbidden') })) })
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals() })
describe('host-supplied native public bootstrap, synthetic only', () => {
  it('keeps the absent startup path on the existing rollback mode without any read', async () => {
    expect(await resolveNativeCnyPublicBootstrap(document)).toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('binds both real native HTTP readers to copied exact pins without starting them', async () => {
    const input = config(); install(input)
    const selected = await resolveNativeCnyPublicBootstrap(document)
    expect(selected?.index?.request).toEqual(index)
    expect(selected?.trending?.selection).toEqual(input.trending)
    expect(Object.isFrozen(selected?.index?.request)).toBe(true)
    expect(Object.isFrozen(selected?.trending?.selection)).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
    input.index.publication_id = hash('f')
    expect(selected?.index?.request).toEqual(index)
  })
  it('keeps explicit null targets selected, without discovering latest or old USD data', async () => {
    install({ schema: 'native-cny-public-bootstrap/1', index: null, trending: null })
    const selected = await resolveNativeCnyPublicBootstrap(document)
    expect(selected?.index?.request).toBeNull(); expect(selected?.trending?.selection).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('the selected HTTP reader asks only the pinned CNY endpoint and preserves withdrawal', async () => {
    install(config())
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ api_contract: 'native-cny-index-day/1', error: 'NOT_PUBLISHED' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    }))
    const selected = await resolveNativeCnyPublicBootstrap(document, fetcher)
    const result = await selected!.index!.gateway.read(selected!.index!.request!)
    expect(result).toMatchObject({ kind: 'ERROR', error: 'NOT_PUBLISHED', http_status: 404 })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(String(fetcher.mock.calls[0][0])).toBe('/api/v1/native-cny/index/day?publication=' + hash('a') + '&scope=ALL')
    expect(fetcher.mock.calls[0][1]?.cache).toBe('no-store')
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([
    () => ({ ...config(), schema: 'USD' }),
    () => ({ schema: 'native-cny-public-bootstrap/1', index }),
    () => ({ ...config(), single: {} }),
    () => ({ ...config(), variant: { expected_count: 14 } }),
    () => ({ ...config(), index: { ...index, currency: 'USD' } }),
    () => ({ ...config(), index: { ...index, publication_id: 'PENDING' } }),
    () => ({ ...config(), trending: { ...config().trending, ordinary_count: 218 } }),
    () => ({ ...config(), trending: { ...config().trending, rightsSha256: null } }),
    () => ({ ...config(), trending: { ...config().trending, endDate: '2026-02-30' } }),
    () => '{"schema":"native-cny-public-bootstrap/1","index":null,"index":null,"trending":null}',
  ])('rejects malformed/incomplete/foreign contracts before HTTP and never returns legacy', async (bad) => {
    install(bad())
    await expect(resolveNativeCnyPublicBootstrap(document)).rejects.toThrow('INVALID_NATIVE_CNY_PUBLIC_BOOTSTRAP')
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each(['duplicate', 'src', 'type', 'size'])('rejects %s script ambiguity', async (kind) => {
    const script = install(config())
    if (kind === 'duplicate') install(config())
    if (kind === 'src') script.setAttribute('src', '/not-read')
    if (kind === 'type') script.type = 'text/plain'
    if (kind === 'size') script.textContent = ' '.repeat(512 * 1024 + 1)
    await expect(resolveNativeCnyPublicBootstrap(document)).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()
  })
})
