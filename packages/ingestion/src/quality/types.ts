export type WorkQualityGrade = 'A' | 'B' | 'C' | 'D' | 'F'
export type WorkCorpusStatus = 'FULL' | 'PARTIAL' | 'METADATA_ONLY' | 'EMPTY' | 'FAILED' | 'UNAVAILABLE'

export interface WorkCorpusAuditRecord {
  workId: string
  traditionId: string
  name: string
  editionIds: string[]
  sourceIds: string[]
  endpointIds: string[]
  recipeIds: string[]
  adapterIds: string[]

  registryCoverage: boolean
  executionPathCoverage: boolean
  liveDataCoverage: boolean

  status: WorkCorpusStatus
  technicalQualityScore: number
  qualityGrade: WorkQualityGrade

  records: number
  bytes: number
  sourceCount: number
  editionCount: number
  endpointCount: number

  remoteSynced: boolean
  notModified: boolean
  cache: boolean
  fallback: boolean
  failed: boolean

  sourceSha256: string[]
  normalizedSha256: string[]
  outputSha256: string[]

  firstRecord?: string
  lastRecord?: string

  empty: boolean
  placeholder: boolean
  duplicate: boolean
  validationErrors: string[]
  warnings: string[]
}

export interface PlaceholderAuditRecord {
  sourceId: string
  path: string
  suspiciousKeywords: string[]
  classification: 'production_source' | 'local_fallback_source' | 'test_fixture'
  safe: boolean
}

export type CrossSourceComparisonClass =
  | 'IDENTICAL'
  | 'MINOR_NORMALIZATION_DIFFERENCE'
  | 'STRUCTURAL_DIFFERENCE'
  | 'TEXTUAL_VARIANT'
  | 'TRANSLATION_DIFFERENCE'
  | 'UNRESOLVED'

export interface CrossSourceComparisonRecord {
  workId: string
  workName: string
  sourceA: string
  sourceB: string
  classification: CrossSourceComparisonClass
  totalComparableRecords: number
  matchingRecords: number
  similarityPercentage: number
  details: string
}

export interface WorkQualityReport {
  schemaVersion: '1.0.0'
  generatedAt: string
  totalWorks: number
  averageScore: number
  gradeBreakdown: Record<WorkQualityGrade, number>
  statusBreakdown: Record<WorkCorpusStatus, number>
  works: Array<{
    workId: string
    name: string
    traditionId: string
    score: number
    grade: WorkQualityGrade
    status: WorkCorpusStatus
    records: number
  }>
}
