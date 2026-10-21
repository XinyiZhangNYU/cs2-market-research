/** The page shown when the app cannot start, or has stopped after an uncaught error, and no
 * automatic reload is under way. It is part of the entry module and needs nothing that may have
 * failed to load: plain DOM, its own copy and the entry stylesheet. It shows no data. */
import type { Lang } from '../i18n'
import {
  browserPublicLanguage,
  explicitPublicLanguage,
  storedPublicLanguage,
} from '../i18n/publicLanguagePreference'
import { reloadPage } from './moduleLoadRecovery'

export const STARTUP_FALLBACK_ID = 'public-startup-fallback'

const COPY: Readonly<Record<Lang, Readonly<Record<'eyebrow' | 'title' | 'note' | 'action' | 'sources', string>>>> = {
  zh: {
    eyebrow: '页面暂不可用',
    title: '网站暂时无法加载',
    note: '网站可能刚刚更新，或网络连接中断。请重新加载；如果问题持续，请稍后再试。',
    action: '重新加载',
    sources: '来源、隐私与使用说明',
  },
  en: {
    eyebrow: 'Page unavailable',
    title: 'The site could not be loaded',
    note: 'The site may have just been updated, or the connection was interrupted. Reload the page. If the problem continues, try again later.',
    action: 'Reload',
    sources: 'Sources, privacy and terms',
  },
}

/** The app's language when the app never resolved one: the address, the stored choice, then the
 * browser. The edge default is not awaited here. */
export function startupFallbackLanguage(): Lang {
  let storage: Storage | null = null
  try {
    storage = globalThis.localStorage ?? null
  } catch {
    // Storage blocked: the address or the browser decides.
  }
  return explicitPublicLanguage(globalThis.location)
    ?? storedPublicLanguage(storage)
    ?? browserPublicLanguage(globalThis.navigator ?? null)
}

function element<K extends keyof HTMLElementTagNameMap>(
  document: Document,
  tag: K,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  return node
}

/** Shows the page after the app root, once per document. The button reloads by hand, outside the
 * tab's limit on automatic reloads. */
export function showStartupFallback(root: HTMLElement, lang: Lang, reload: () => void = reloadPage): void {
  const document = root.ownerDocument
  if (document.getElementById(STARTUP_FALLBACK_ID) !== null) return
  const copy = COPY[lang]
  const page = element(document, 'main')
  page.id = STARTUP_FALLBACK_ID
  page.className = 'formal-startup-fallback'
  page.lang = lang === 'zh' ? 'zh-CN' : 'en'
  const panel = element(document, 'section')
  panel.className = 'formal-runtime-error'
  panel.setAttribute('role', 'alert')
  const button = element(document, 'button', copy.action)
  button.type = 'button'
  button.addEventListener('click', () => reload())
  const link = element(document, 'a', copy.sources)
  link.href = `/sources/valve.html#${lang}`
  const sources = element(document, 'p')
  sources.append(link)
  panel.append(
    element(document, 'p', copy.eyebrow),
    element(document, 'h1', copy.title),
    element(document, 'p', copy.note),
    button,
    sources,
  )
  page.append(panel)
  root.after(page)
}
