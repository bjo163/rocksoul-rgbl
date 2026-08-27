export interface AdvancedProfileDefinition {
  profileId: string
  directory: string
  schemaFile: string
}

export const ADVANCED_PROFILE_BY_KIND: Readonly<Record<string, AdvancedProfileDefinition>> = {
  'contextual.temporal': { profileId: 'contextual@0.1', directory: 'contextual', schemaFile: 'temporal.schema.json' },
  'contextual.geography': { profileId: 'contextual@0.1', directory: 'contextual', schemaFile: 'geography.schema.json' },
  'bibliographic.record': { profileId: 'bibliographic@0.1', directory: 'bibliographic', schemaFile: 'record.schema.json' },
  'manuscript.witness': { profileId: 'manuscript@0.1', directory: 'manuscript', schemaFile: 'witness.schema.json' },
  'media.iiif_artifact': { profileId: 'media@0.1', directory: 'media', schemaFile: 'iiif-artifact.schema.json' },
  'media.selector': { profileId: 'media@0.1', directory: 'media', schemaFile: 'selector.schema.json' }
}
