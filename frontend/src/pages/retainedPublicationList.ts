export type TerminalPublicationCode = 'WITHDRAWN' | 'STALE_EXPIRED' | 'CORRUPT_PUBLICATION'

export function terminalPublicationCode(code: string): TerminalPublicationCode | null {
  return code === 'WITHDRAWN' || code === 'STALE_EXPIRED' || code === 'CORRUPT_PUBLICATION'
    ? code
    : null
}

type PublicationReadyState = Readonly<{
  document: Readonly<{ publication: Readonly<{ publication_id: string }> }>
  cacheKeys: readonly string[]
  activeCacheKeys?: readonly string[]
}>

/** Retains only settled list states; in-flight pagination never replaces them. */
export class RetainedPublicationListCache<T extends PublicationReadyState> {
  private readonly entries = new Map<string, T>()
  private readonly terminal = new Map<string, TerminalPublicationCode>()

  constructor(private readonly maxEntries = 32) {}

  get(key: string): T | undefined {
    const value = this.entries.get(key)
    if (value === undefined) return undefined
    if (this.terminal.has(value.document.publication.publication_id)) {
      this.entries.delete(key)
      return undefined
    }
    this.entries.delete(key)
    this.entries.set(key, value)
    return value
  }

  remember(value: T): void {
    if (this.terminal.has(value.document.publication.publication_id)) return
    for (const key of value.cacheKeys) {
      this.entries.delete(key)
      this.entries.set(key, value)
    }
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value as string | undefined
      if (oldest === undefined) break
      this.entries.delete(oldest)
    }
  }

  invalidateActiveAliases(): void {
    const aliases = new Set<string>()
    for (const value of this.entries.values()) {
      for (const key of value.activeCacheKeys ?? []) aliases.add(key)
    }
    if (aliases.size === 0) return

    // A pinned publication may share the same settled state with one or more
    // ACTIVE aliases. Revoke those capabilities from the retained state too;
    // otherwise a later pinned continuation can remember the old aliases.
    const replacements = new Map<T, T>()
    for (const [key, value] of this.entries) {
      if (aliases.has(key)) {
        this.entries.delete(key)
        continue
      }
      if (!value.cacheKeys.some((cacheKey) => aliases.has(cacheKey))) continue
      let replacement = replacements.get(value)
      if (replacement === undefined) {
        replacement = {
          ...value,
          cacheKeys: value.cacheKeys.filter((cacheKey) => !aliases.has(cacheKey)),
          activeCacheKeys: [],
        }
        replacements.set(value, replacement)
      }
      this.entries.set(key, replacement)
    }
  }

  invalidate(publicationId: string, code: TerminalPublicationCode): void {
    this.terminal.delete(publicationId)
    this.terminal.set(publicationId, code)
    for (const [key, value] of this.entries) {
      if (value.document.publication.publication_id === publicationId) this.entries.delete(key)
    }
    while (this.terminal.size > this.maxEntries) {
      const oldest = this.terminal.keys().next().value as string | undefined
      if (oldest === undefined) break
      this.terminal.delete(oldest)
    }
  }

  knownTerminal(publicationId: string): TerminalPublicationCode | null {
    return this.terminal.get(publicationId) ?? null
  }
}
