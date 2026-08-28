export type EditionMaterializationStatus =
  | 'FULL'
  | 'PARTIAL'
  | 'METADATA_ONLY'
  | 'NOT_ACQUIRED'
  | 'FAILED'
  | 'UNAVAILABLE'

export interface EditionMaterializationRecord {
  editionId: string
  workId: string
  traditionId: string
  editionType: string
  language: string
  script: string
  sourceIds: string[]
  endpointIds: string[]
  recipeIds: string[]
  adapterIds: string[]

  registryStatus: 'REGISTERED' | 'UNREGISTERED'
  executionStatus: 'READY' | 'CONFIGURED' | 'PENDING'
  acquisitionStatus: 'REMOTE_SYNCED' | 'REMOTE_NOT_MODIFIED' | 'LOCAL_CACHE' | 'LOCAL_FALLBACK' | 'REMOTE_FAILED' | 'UNCONFIGURED'

  rawBytes: number
  rawSha256?: string
  parsedRecords: number
  normalizedRecords: number
  canonicalRecords: number
  indexedRecords: number

  provenanceStatus: 'VERIFIED' | 'PRESENT' | 'PENDING'
  hashStatus: 'VERIFIED' | 'PRESENT' | 'PENDING'
  validationStatus: 'PASS' | 'PENDING' | 'FAIL'
  materializationStatus: EditionMaterializationStatus
}

export interface ZeroRecordEdition {
  editionId: string
  workId: string
  workName: string
  traditionId: string
  language: string
  sourceIds: string[]
  endpointIds: string[]
  reason: string
}

export interface RecordReconciliationRecord {
  workId: string
  editionId: string
  rawRecords: number
  parsedRecords: number
  normalizedRecords: number
  canonicalRecords: number
  indexedRecords: number
  reconciliationStatus: 'EXACT_MATCH' | 'NORMALIZED_FILTER' | 'PENDING_MATERIALIZATION'
  explanation: string
}

export interface CanonicalRecordOwnershipRecord {
  canonicalId: string
  workId: string
  position: string
  editionIds: string[]
  sourceIds: string[]
  languages: string[]
}

export interface WorkLanguageMaterializationRecord {
  workId: string
  workName: string
  traditionId: string
  originalLanguage: string
  originalEditionId: string
  translations: Array<{
    editionId: string
    language: string
    materializationStatus: EditionMaterializationStatus
    records: number
    alignmentStatus: string
  }>
  alignedPositions: number
  missingPositions: number
  alignmentPercentage: number
}

export interface EditionMaterializationSummary {
  schemaVersion: '1.0.0'
  generatedAt: string
  totalEditions: number
  full: number
  partial: number
  metadataOnly: number
  notAcquired: number
  failed: number
  unavailable: number
  materializationPercent: number
  recordBearingPercent: number
  recordBearingEditions: number
  zeroRecordEditions: number
}

export interface CorpusGrowthReport {
  schemaVersion: '1.0.0'
  generatedAt: string
  previousCanonicalRecords: number
  currentCanonicalRecords: number
  deltaCanonicalRecords: number
  previousIndexedRecords: number
  currentIndexedRecords: number
  deltaIndexedRecords: number
  previousEditions: number
  currentEditions: number
  deltaEditions: number
  growthExplanation: string
}

export interface SourceContributionRecord {
  sourceId: string
  sourceName: string
  authorityLevel: string
  editionCount: number
  workCount: number
  recordCount: number
  canonicalRecordCount: number
  remoteSynced: number
  fallback: number
  failed: number
}
