export type WorkQualityGrade = 'A' | 'B' | 'C' | 'D' | 'F'
export type WorkCorpusStatus = 'FULL' | 'PARTIAL' | 'METADATA_ONLY' | 'EMPTY' | 'FAILED' | 'UNAVAILABLE'

export interface QualityScoreComponents {
  sourceVerified: number // 0-20
  recordsNonEmpty: number // 0-20
  provenanceComplete: number // 0-15
  sha256Verified: number // 0-15
  parserValidated: number // 0-10
  schemaValidated: number // 0-10
  duplicateSafety: number // 0-5
  sourceAuthority: number // 0-5
}

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
  liveAcquisitionStatus: 'REMOTE_SYNCED' | 'REMOTE_NOT_MODIFIED' | 'LOCAL_CACHE' | 'LOCAL_FALLBACK' | 'REMOTE_FAILED' | 'UNSUPPORTED' | 'UNCONFIGURED'

  status: WorkCorpusStatus
  technicalQualityScore: number
  qualityGrade: WorkQualityGrade
  components: QualityScoreComponents

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

export type CrossSourceComparisonEligibility =
  | 'COMPARABLE'
  | 'PARTIALLY_COMPARABLE'
  | 'NOT_COMPARABLE'
  | 'UNKNOWN'

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
  eligibility: CrossSourceComparisonEligibility
  classification?: CrossSourceComparisonClass
  totalComparableRecords?: number
  matchingRecords?: number
  recordDifferences?: number
  similarityPercentage?: number
  details?: string
  reason?: string
}

export interface QualityScoreDistribution {
  schemaVersion: '1.0.0'
  generatedAt: string
  count: number
  min: number
  max: number
  mean: number
  median: number
  standardDeviation: number
  p25: number
  p50: number
  p75: number
  grades: Record<WorkQualityGrade, number>
  scoringDistributionCollapse: boolean
}

export interface WorkQualityReport {
  schemaVersion: '1.0.0'
  generatedAt: string
  totalWorks: number
  averageScore: number
  gradeBreakdown: Record<WorkQualityGrade, number>
  statusBreakdown: Record<WorkCorpusStatus, number>
  scoringDistributionCollapse: boolean
  works: Array<{
    workId: string
    name: string
    traditionId: string
    score: number
    grade: WorkQualityGrade
    status: WorkCorpusStatus
    liveAcquisitionStatus: string
    records: number
    components: QualityScoreComponents
  }>
}
