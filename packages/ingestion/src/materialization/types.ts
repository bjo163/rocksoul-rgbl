export type GranularMaterializationState =
  | 'METADATA_ONLY'
  | 'DISCOVERABLE'
  | 'REMOTE_READY'
  | 'AUTH_REQUIRED'
  | 'RATE_LIMITED'
  | 'MANUAL_ONLY'
  | 'SOURCE_UNAVAILABLE'
  | 'ACQUIRED'
  | 'PARSED'
  | 'NORMALIZED'
  | 'VALIDATED'
  | 'MATERIALIZED'
  | 'FAILED'

export type EditionMaterializationStatus =
  | 'FULL'
  | 'PARTIAL'
  | 'METADATA_ONLY'
  | 'NOT_ACQUIRED'
  | 'FAILED'
  | 'UNAVAILABLE'

export type EditionQueuePriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4'

export interface MetadataEditionQueueItem {
  editionId: string
  workId: string
  traditionId: string
  name: string
  language: string
  script: string
  editionType: string
  sourceCandidates: string[]
  endpointCandidates: string[]
  currentStatus: GranularMaterializationState
  priority: EditionQueuePriority
  priorityReason: string
}

export interface SourceCandidateModel {
  sourceId: string
  url: string
  sourceType: string
  authorityLevel: 'official' | 'institutional' | 'academic' | 'community' | 'archival'
  availability: 'online' | 'restricted' | 'manual'
  machineReadable: boolean
  authentication: boolean
  license: string
  evidence: string
}

export interface EditionMaterializationResult {
  editionId: string
  workId: string
  traditionId: string
  status: GranularMaterializationState
  records: number
  bytes: number
  sourceSha256?: string
  retrievedAt: string
  sourceId: string
  endpointId: string
  adapterId: string
  provenance: {
    requestedUrl: string
    resolvedUrl: string
    retrievedAt: string
    sourceSha256?: string
  }
}

export interface EditionRecordCount {
  editionId: string
  workId: string
  language: string
  rawRecords: number
  parsedRecords: number
  normalizedRecords: number
  canonicalPositions: number
  editionRecords: number
  materializationState: GranularMaterializationState
}

export interface MaterializationEngineSummary {
  schemaVersion: '1.0.0'
  generatedAt: string
  totalEditions: number
  metadataOnlyBefore: number
  materializedNew: number
  full: number
  partial: number
  metadataOnly: number
  authRequired: number
  rateLimited: number
  manualOnly: number
  sourceUnavailable: number
  failed: number
  recordBearingEditions: number
  materializationPercent: number
  canonicalPositionsBefore: number
  canonicalPositionsAfter: number
  editionRecordsBefore: number
  editionRecordsAfter: number
  languageRecords: number
  sourceWitnesses: number
}

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
  granularState?: GranularMaterializationState
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
  materializedEditionCount?: number
  recordCount: number
  canonicalRecordCount: number
  canonicalPositionCount?: number
  remoteSynced: number
  fallback: number
  failed: number
}
