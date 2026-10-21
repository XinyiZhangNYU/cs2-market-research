// Current research and technical surfaces retain the machine value. PRODUCT_PRIMARY is a dormant
// FE-UX-002A capability until FE-UX-002B approves wording and identifies product-primary surfaces.

export const EnumPresentation = {
  TECHNICAL: 'TECHNICAL',
  PRODUCT_PRIMARY: 'PRODUCT_PRIMARY',
} as const

export type EnumPresentation = (typeof EnumPresentation)[keyof typeof EnumPresentation]

type CommonProps = {
  machine: string
  tone?: 'neutral' | 'warn' | 'blocked'
}

type EnumChipProps =
  | (CommonProps & {
      presentation?: typeof EnumPresentation.TECHNICAL
      label?: string
    })
  | (CommonProps & {
      presentation: typeof EnumPresentation.PRODUCT_PRIMARY
      label: string
    })

export function EnumChip({
  machine,
  label,
  tone = 'neutral',
  presentation = EnumPresentation.TECHNICAL,
}: EnumChipProps) {
  if (presentation === EnumPresentation.PRODUCT_PRIMARY && !label?.trim()) {
    throw new Error(`PRODUCT_PRIMARY requires a localized label for ${JSON.stringify(machine)}`)
  }

  return (
    <span className={`enum-chip enum-chip--${tone}`} data-machine={machine}>
      {presentation === EnumPresentation.TECHNICAL ? <code>{machine}</code> : null}
      {label ? <em>{label}</em> : null}
    </span>
  )
}
