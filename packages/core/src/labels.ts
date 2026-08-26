export const LABEL_ROLES = ['preferred', 'alternate'] as const

export type LabelRole = (typeof LABEL_ROLES)[number]

/**
 * Human-facing multilingual label. Labels are descriptive strings, not identity.
 */
export interface Label {
  value: string
  role: LabelRole
  /** BCP 47 language tag when known, e.g. en, id, ar, he, zh-Hant. */
  language?: string
  /** ISO 15924 script code when known, e.g. Latn, Arab, Hebr. */
  script?: string
}

export function isLabelRole(value: unknown): value is LabelRole {
  return typeof value === 'string' && (LABEL_ROLES as readonly string[]).includes(value)
}
