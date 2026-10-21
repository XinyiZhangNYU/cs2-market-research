import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  PUBLIC_LANGUAGE_ENDPOINT,
  PUBLIC_LANGUAGE_STORAGE_KEY,
  browserPublicLanguage,
  rememberPublicLanguagePreference,
  resolveInitialPublicLanguage,
} from '../src/i18n/publicLanguagePreference'

afterEach(() => vi.useRealTimers())

function edgeResponse(language: 'zh' | 'en'): Response {
  return new Response(JSON.stringify({
    api_contract: 'public-locale-default',
    api_version: 'v1',
    language,
  }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}

describe('public language preference', () => {
  it('uses an explicit URL language before saved or edge defaults', async () => {
    const fetcher = vi.fn(async () => edgeResponse('en'))
    const language = await resolveInitialPublicLanguage({
      location: { search: '?lang=zh' },
      storage: { getItem: () => 'en', setItem: () => undefined },
      navigatorLike: { language: 'en-US', languages: ['en-US'] },
      fetcher,
    })
    expect(language).toBe('zh')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('preserves a manual choice before consulting the edge', async () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
    }
    rememberPublicLanguagePreference('en', storage)
    expect(values.get(PUBLIC_LANGUAGE_STORAGE_KEY)).toBe('en')
    const fetcher = vi.fn(async () => edgeResponse('zh'))
    expect(await resolveInitialPublicLanguage({
      location: { search: '' }, storage,
      navigatorLike: { language: 'zh-CN', languages: ['zh-CN'] }, fetcher,
    })).toBe('en')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('accepts only the exact bounded edge contract', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      expect(input).toBe(PUBLIC_LANGUAGE_ENDPOINT)
      return edgeResponse('zh')
    })
    expect(await resolveInitialPublicLanguage({
      location: { search: '' }, storage: null,
      navigatorLike: { language: 'en-US', languages: ['en-US'] }, fetcher,
    })).toBe('zh')

    expect(await resolveInitialPublicLanguage({
      location: { search: '' }, storage: null,
      navigatorLike: { language: 'zh-Hans-CN', languages: ['zh-Hans-CN'] },
      fetcher: async () => new Response('{"language":"en","country":"CN"}'),
    })).toBe('zh')
  })

  it('falls back to the first browser language when edge discovery fails', async () => {
    expect(browserPublicLanguage({ language: 'en-US', languages: ['zh-TW', 'en-US'] })).toBe('zh')
    expect(await resolveInitialPublicLanguage({
      location: { search: '' }, storage: null,
      navigatorLike: { language: 'en-US', languages: ['en-US'] },
      fetcher: async () => { throw new Error('offline') },
    })).toBe('en')
  })
})
