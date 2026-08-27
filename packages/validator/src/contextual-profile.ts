export const CONTEXTUAL_PROFILE_ID = 'contextual@0.1' as const

export const CONTEXTUAL_SCHEMA_FILE_BY_KIND: Readonly<Record<string, string>> = {
  'contextual.temporal': 'temporal.schema.json',
  'contextual.geography': 'geography.schema.json'
}
