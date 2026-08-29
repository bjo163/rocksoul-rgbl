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
  canonicalPositionCount: number
  editionRecordCount: number
  editionCount: number
  languageCount: number
  sourceCount: number
  uniqueTextPayloads: number
  sourceIds: string[]
  languages: string[]
  materializationState: string
}

export interface EditionActualDetail {
  editionId: string
  workId: string
  recordCount: number
  canonicalPositions: number
  languages: string[]
  sourceIds: string[]
  materializationState: string
}

export interface EditionRecordTruthEntry {
  editionId: string
  workId: string
  actualRecordCount: number
  actualCanonicalPositionCount: number
  actualUniquePayloadCount: number
  measurementState: 'MEASURED' | 'UNMEASURABLE_AT_RECORD_LEVEL' | 'ZERO_RECORD'
  reason?: string
}

export interface RecordOwnershipEntry {
  canonicalRecordId: string
  workId: string
  position: string
  editionIds: string[]
  sourceIds: string[]
  languages: string[]
}

export interface IndexCompositionReport {
  schemaVersion: string
  generatedAt: string
  scripturalRecords: number
  devotionalRecords: number
  lexiconTerms: number
  assertions: number
  rawRecords: number
  totalIndexed: number
}

export interface DbIntegrityAuditReport {
  runtimeHardcodedCorpusMetrics: number
  syntheticMultipliers: number
  registryDerivedRecordCounts: number
  fallbackRecordCounts: number
  actualSqlAggregations: number
  actualRecordLevelMeasurements: number
  measurementIntegrity: 'REAL_DATA'
  status: 'PASS' | 'FAIL'
}

export interface SqlProvenanceEntry {
  metric: string
  table: string
  query: string
  result: number
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
    raw: number | 'NOT_AVAILABLE'
    parsed: number | 'NOT_AVAILABLE'
    normalized: number | 'NOT_AVAILABLE'
    editionRecords: number
    canonicalPositions: number
    indexed: number
    reconciliationStatus: string
  }>
}

export interface DepthSummaryActualP16 {
  schemaVersion: string
  generatedAt: string
  measurementIntegrity: 'REAL_DATA' | 'PARTIAL' | 'UNMEASURABLE'
  totals: {
    traditions: number
    works: number
    editions: number
    languages: number
    sources: number
    endpoints: number
  }
  corpus: {
    canonicalPositions: number
    editionRecords: number
    indexedRecords: number
    rawRecords: number
    passages: number
    contents: number
    devotionals: number
    lexiconTerms: number
    assertions: number
  }
  editionMeasurement: {
    totalEditions: number
    measuredEditions: number
    zeroRecordEditions: number
    unmeasurableEditions: number
  }
  editionDistribution: {
    min: number
    max: number
    mean: number
    median: number
    p25: number
    p50: number
    p75: number
    p90: number
    sanityCheck: boolean
  }
  editionContributions: {
    uniqueCorpusContribution: number
    additionalLanguage: number
    sourceWitness: number
    mirror: number
    structuralVariant: number
    partial: number
    unresolved: number
  }
  crossEdition: {
    identicalText: number
    normalizationEquivalent: number
    translation: number
    textualVariant: number
    structuralVariant: number
    partial: number
    notComparable: number
    unresolved: number
  }
}

export interface DepthValidationResult {
  valid: boolean
  problems: string[]
  totalTraditions: number
  totalWorks: number
  totalEditions: number
  measuredEditions: number
  unmeasurableEditions: number
  phase15NewWorks: number
  phase15NewEditions: number
  canonicalPositions: number
  editionRecords: number
  syntheticCountCalculations: number
}
