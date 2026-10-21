import type { Plugin } from 'vite'

type Chunk = { type: 'chunk'; fileName: string; facadeModuleId: string | null; isEntry: boolean; imports: string[]; dynamicImports: string[]; modules?: Record<string, unknown> }
type Artifact = Chunk | { type: 'asset'; fileName: string }

/** Only the mandatory shell and its static dependencies; never fan out over routes. */
export function startupPreloadFiles(bundle: Record<string, Artifact>): string[] {
  const entry = Object.values(bundle).find((file): file is Chunk => file.type === 'chunk'
    && file.isEntry && [file.facadeModuleId ?? '', ...Object.keys(file.modules ?? {})]
      .some((id) => /\/src\/public-main\.tsx$/u.test(id.replaceAll('\\', '/'))))
  if (!entry) throw new Error('public startup preload: public entry missing')
  const app = entry.dynamicImports.map((name) => bundle[name]).find((file): file is Chunk => file?.type === 'chunk'
    && /\/src\/PublicBetaApp\.tsx$/u.test(file.facadeModuleId?.replaceAll('\\', '/') ?? ''))
  if (!app) throw new Error('public startup preload: mandatory shell missing')
  const visited = new Set([entry.fileName])
  const files: string[] = []
  const visit = (name: string) => {
    if (visited.has(name)) return
    const chunk = bundle[name]
    if (chunk?.type !== 'chunk' || !/^assets\/[\w.-]+\.js$/u.test(chunk.fileName)) {
      throw new Error('public startup preload: missing or unsafe static dependency')
    }
    visited.add(name)
    files.push(chunk.fileName)
    for (const dependency of chunk.imports) visit(dependency)
  }
  visit(app.fileName)
  return files
}

export function publicStartupPreload(): Plugin {
  return {
    name: 'public-startup-preload',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (!context.bundle) return html // Development remains on the module graph.
        const files = startupPreloadFiles(context.bundle)
        return { html, tags: files.filter((file) => !html.includes(`href="/${file}"`)).map((file) => ({
          tag: 'link', attrs: { rel: 'modulepreload', crossorigin: true, href: `/${file}` }, injectTo: 'head',
        })) }
      },
    },
  }
}
