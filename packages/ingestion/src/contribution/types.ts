export type EditionContributionType =
  | 'UNIQUE_CORPUS_CONTRIBUTION'
  | 'ADDITIONAL_LANGUAGE'
  | 'ADDITIONAL_SOURCE_WITNESS'
  | 'DUPLICATE_MIRROR'
  | 'STRUCTURAL_VARIANT'
  | 'PARTIAL_COVERAGE'
  | 'UNRESOLVED'

export type EditionTextClassification =
  | 'PRIMARY_TEXT'
  | 'TRANSLATION'
  | 'CRITICAL_EDITION'
  | 'ACADEMIC_EDITION'
  | 'LITURGICAL_EDITION'
  | 'SOURCE_WITNESS'
  | 'MIRROR'
  | 'DERIVATIVE'
  | 'COMMENTARY'
  | 'METADATA_ONLY'
  | 'UNRESOLVED'

export interface EditionContributionRecord {
  editionId: string
  workId: string
  traditionId: string
  sourceId: string
  endpointId: string

  language: string
  script: string
  editionType: string

  materializationStatus: string

  rawRecords: number
  parsedRecords: number
  normalizedRecords: number
  editionRecords: number
  canonicalPositions: number

  nonEmptyTextRecords: number
  uniqueTextPayloads: number
  duplicateTextPayloads: number

  firstPosition: string
  lastPosition: string

  coveragePercent: number
  sourceWitnessType: string
  contributionType: EditionContributionType
  textClassification: EditionTextClassification
  normalizedTextHash: string
}

export interface EditionPositionMatrixEntry {
  workId: string
  position: string
  canonicalRecordId: string
  editionIds: string[]
  languages: string[]
  sourceIds: string[]
}

export interface LanguageDepthReport {
  schemaVersion: string
  generatedAt: string
  totalWorks: number
  totalLanguages: number
  works: Array<{
    workId: string
    workName: string
    traditionId: string
    languages: Record<string, number>
    editionCount: number
    originalLanguage: string
    originalLanguageEditions: number
    translationEditions: number
    sourceWitnessEditions: number
  }>
}

export interface SourceDepthReport {
  schemaVersion: string
  generatedAt: string
  totalSources: number
  sources: Array<{
    sourceId: string
    sourceName: string
    authorityLevel: string
    workCount: number
    editionCount: number
    languageCount: number
    editionRecords: number
    canonicalPositions: number
    uniquePayloads: number
    mirrorPayloads: number
  }>
}

export interface WorkDepthReport {
  schemaVersion: string
  generatedAt: string
  totalWorks: number
  works: Array<{
    workId: string
    workName: string
    traditionId: string
    editionCount: number
    languageCount: number
    sourceCount: number
    canonicalPositions: number
    editionRecords: number
    originalLanguageEditionCount: number
    translationEditionCount: number
    criticalEditionCount: number
    sourceWitnessCount: number
    uniqueTextPayloads: number
  }>
}

export interface TraditionDepthReport {
  schemaVersion: string
  generatedAt: string
  totalTraditions: number
  traditions: Array<{
    traditionId: string
    traditionName: string
    family: string
    workCount: number
    editionCount: number
    languageCount: number
    sourceCount: number
    canonicalPositions: number
    editionRecords: number
  }>
}

export interface RecordOwnershipRecord {
  canonicalRecordId: string
  workId: string
  position: string
  editionIds: string[]
  sourceIds: string[]
  languages: string[]
}

export interface ContributionSummary {
  schemaVersion: string
  generatedAt: string
  totalEditions: number
  uniqueCorpusContribution: number
  additionalLanguage: number
  additionalSourceWitness: number
  duplicateMirror: number
  structuralVariant: number
  partialCoverage: number
  unresolved: number
  totalEditionRecords: number
  totalCanonicalPositions: number
  totalSourceWitnesses: number
  totalUniqueTextPayloads: number
  positionCoverage: {
    singleEdition: number
    multiEdition: number
    multiLanguage: number
  }
}

export interface ContributionValidationResult {
  valid: boolean
  problems: string[]
  totalEditions: number
  canonicalPositions: number
  editionRecords: number
  uniqueCorpusContribution: number
  additionalLanguage: number
  additionalSourceWitness: number
}
