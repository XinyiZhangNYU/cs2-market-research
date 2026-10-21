export class SnapshotSelectionUnavailable extends Error {
  constructor(queryAsOf: string) {
    super(`no dashboard snapshot exists at or before ${queryAsOf}`)
    this.name = 'SnapshotSelectionUnavailable'
  }
}

// Canonical result timestamps all use the same fixed-width UTC spelling, so code-point order is
// chronological order. The selector makes no fallback to a future snapshot.
export function selectLatestSnapshotAtOrBefore<T extends { readonly as_of: string }>(
  candidates: readonly T[],
  queryAsOf: string,
): T {
  const unique = new Map<string, T>()
  for (const candidate of candidates) {
    if (unique.has(candidate.as_of)) {
      throw new TypeError(`duplicate dashboard snapshot as_of: ${candidate.as_of}`)
    }
    unique.set(candidate.as_of, candidate)
  }
  const selected = [...unique.values()]
    .filter((candidate) => candidate.as_of <= queryAsOf)
    .sort((left, right) => (left.as_of < right.as_of ? -1 : left.as_of > right.as_of ? 1 : 0))
    .at(-1)
  if (!selected) throw new SnapshotSelectionUnavailable(queryAsOf)
  return selected
}
