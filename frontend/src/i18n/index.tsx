import { createContext, useContext, type ReactNode } from 'react'

export type Lang = 'zh' | 'en'

// Human-readable text carried in both languages. Machine values never use this type:
// an enum value is an identifier, not a language, and stays visible in every mode.
export type Localized = { zh: string; en: string }

export function pick(text: Localized, lang: Lang): string {
  return text[lang]
}

const LangContext = createContext<Lang>('zh')

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>
}

export function useLang(): Lang {
  return useContext(LangContext)
}

// The switch is labelled with ISO codes rather than language names: a name written in the
// language you are switching *to* would put a second language on the page, which is exactly
// what the one-language-per-page rule forbids.
export const LANGS: readonly Lang[] = ['zh', 'en']
export const LANG_CODE: Record<Lang, string> = { zh: 'ZH', en: 'EN' }
