export interface Phase16Delta {
  schemaVersion: string
  generatedAt: string
  comparisons: {
    phase14: {
      traditions: number
      works: number
      editions: number
      languages: number
      sources: number
      endpoints: number
      canonicalPositions: number
      editionRecords: number
      indexedRecords: number
    }
    phase15: {
      traditions: number
      works: number
      editions: number
      languages: number
      sources: number
      endpoints: number
      canonicalPositions: number
      editionRecords: number
      indexedRecords: number
    }
    phase16: {
      traditions: number
      works: number
      editions: number
      languages: number
      sources: number
      endpoints: number
      canonicalPositions: number
      editionRecords: number
      indexedRecords: number
    }
    deltas: {
      traditions: number
      works: number
      editions: number
      languages: number
      sources: number
      endpoints: number
      canonicalPositions: number
      editionRecords: number
      indexedRecords: number
    }
  }
}

export interface NewWorkDetail {
  workId: string
  traditionId: string
  name: string
  editionIds: string[]
  sourceIds: string[]
  endpointIds: string[]
  currentRecordCount: number
  currentCanonicalPositions: number
  currentLanguages: string[]
}

export interface NewWorkActualDetail {
  workId: string
  traditionId: string
  name: string
  recordCount: number
  editionRecordCount: number
  canonicalPositions: number
  editionCount: number
  languageCount: number
  sourceCount: number
  uniqueTextPayloads: number
  sourceIds: string[]
  languages: string[]
  materializationState: string
}

export interface SyntheticCountAuditReport {
  schemaVersion: string
  generatedAt: string
  syntheticCountCalculations: number
  hardcodedRecordCalculations: number
  magicNumberDerivedCounts: number
  measurementIntegrity: 'REAL_DATA' | 'SYNTHETIC' | 'PARTIAL' | 'UNKNOWN'
  status: 'PASS' | 'FAIL'
}

export interface WorkMaterializationMatrixEntry {
  workId: string
  traditionId: string
  registry: boolean
  executionPath: boolean
  materializationStatus: string
  records: number
  canonicalPositions: number
  editionCount: number
  languageCount: number
  sourceCount: number
  dataSource: 'SQLITE_CORPUS' | 'MANIFEST_CANONICAL'
}

export interface LanguageDepthReportP16 {
  schemaVersion: string
  generatedAt: string
  totalLanguages: number
  worksByLanguage: Record<string, number>
  editionsByLanguage: Record<string, number>
  recordsByLanguage: Record<string, number>
  originalLanguageWorks: number
  translationWorks: number
}

export interface SourceDepthReportP16 {
  schemaVersion: string
  generatedAt: string
  totalSources: number
  sources: Array<{
    sourceId: string
    sourceName: string
    authorityLevel: string
    newWorks: number
    newEditions: number
    editionRecords: number
    canonicalPositions: number
    uniquePayloads: number
    sourceWitnesses: number
  }>
}

export interface TraditionDepthReportP16 {
  schemaVersion: string
  generatedAt: string
  totalTraditions: number
  newTraditions: Array<{
    traditionId: string
    traditionName: string
    family: string
    works: number
    editions: number
    languages: number
    sources: number
    canonicalPositions: number
    editionRecords: number
    uniqueTextPayloads: number
    materializedWorks: number
  }>
}

export interface RecordReconciliationReportP16 {
  schemaVersion: string
  generatedAt: string
  totalNewWorks: number
  totalNewEditions: number
  works: Array<{
    workId: string
    raw: number
    parsed: number
    normalized: number
    editionRecords: number
    canonicalPositions: number
    indexed: number
    reconciliationStatus: string
  }>
}

export interface DepthSummaryP16 {
  schemaVersion: string
  generatedAt: string
  measurementIntegrity: 'REAL_DATA' | 'SYNTHETIC' | 'PARTIAL' | 'UNKNOWN'
  totalTraditions: number
  totalWorks: number
  totalEditions: number
  phase15NewWorks: number
  phase15NewEditions: number
  uniqueTextEditions: number
  additionalLanguageEditions: number
  sourceWitnessEditions: number
  mirrorEditions: number
  structuralVariantEditions: number
  partialEditions: number
  unresolvedEditions: number
  totalCanonicalPositions: number
  totalEditionRecords: number
  totalIndexedRecords: number
}

export interface DepthValidationResult {
  valid: boolean
  problems: string[]
  totalTraditions: number
  totalWorks: number
  totalEditions: number
  phase15NewWorks: number
  phase15NewEditions: number
  canonicalPositions: number
  editionRecords: number
  syntheticCountCalculations: number
}
