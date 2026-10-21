import type { ReactNode } from 'react'
import { isProduced, type Field } from '../contract/provenance'
import { pick, useLang } from '../i18n'

// A NOT_PRODUCED field has no value to fall back on, so this renders the marker and the
// reason instead. There is deliberately no "placeholder value" branch.

export function FieldValue<T>({
  field,
  render,
}: {
  field: Field<T>
  render: (value: T) => ReactNode
}) {
  const lang = useLang()
  if (isProduced(field)) return <>{render(field.value)}</>
  return (
    <span className="not-produced" data-testid="not-produced" title={pick(field.note, lang)}>
      <code>NOT_PRODUCED / {field.status}</code>
      <em>{field.proposedAs}</em>
    </span>
  )
}

export function NotProducedNote<T>({ field }: { field: Field<T> }) {
  const lang = useLang()
  if (isProduced(field)) return null
  return <p className="not-produced-note">{pick(field.note, lang)}</p>
}
