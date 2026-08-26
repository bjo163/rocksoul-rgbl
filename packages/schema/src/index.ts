export const CORPUS_SPEC_VERSION = '0.1' as const
export const JSON_SCHEMA_DIALECT = 'https://json-schema.org/draft/2020-12/schema' as const

export const CORE_RECORD_TYPES = [
  'entity',
  'resource',
  'assertion',
  'evidence',
  'provenance',
  'assessment'
] as const

export const PROFILE_IDS = ['textual@0.1', 'source@0.1'] as const
