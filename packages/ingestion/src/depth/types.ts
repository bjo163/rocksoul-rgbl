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
  recordCount: number | null
  canonicalPositions: number | null
  languages: string[]
  sourceIds: string[]
  materializationState: 'MATERIALIZED' | 'UNMATERIALIZED'
  measurementState: 'MEASURED' | 'UNMEASURABLE_AT_RECORD_LEVEL'
}

export interface EditionDepthEntry {
  editionId: string
  workId: string
  traditionId: string
  sourceId: string
  language: string
  editionType: string
  recordCount: number
  canonicalPositionCount: number
  uniquePayloadCount: number
  acquisitionState: string
  materializationState: string
  measurementState: string
  ownershipState: string
}

export interface CrossEditionEntry {
  workId: string
  editionA: string
  editionB: string
  sharedPositions: number
  uniquePositionsA: number
  uniquePositionsB: number
  identicalPayloads: number
  classification: string
}

export interface SourceWitnessAnalysisEntry {
  workId: string
  sourceA: string
  sourceB: string
  sharedCanonicalPositions: number
  sourceOnlyPositionsA: number
  sourceOnlyPositionsB: number
  identicalPayloads: number
  differentPayloads: number
}

export interface DeepWorkEntry {
  workId: string
  traditionId: string
  name: string
  reasons: string[]
  editionCount: number
  languageCount: number
  sourceCount: number
  canonicalPositionCount: number
  ownershipState: string
}

export interface Phase19ScopeEntry {
  traditionId: string
  workId: string
  editionId: string
  sourceId: string
  endpointId: string
  language: string
}

export interface EditionRecordTruthEntry {
  editionId: string
  workId: string
  materializationState: 'MATERIALIZED' | 'UNMATERIALIZED'
  measurementState: 'MEASURED' | 'UNMEASURABLE_AT_RECORD_LEVEL'
  actualRecordCount: number | null
  actualCanonicalPositionCount: number | null
  actualUniquePayloadCount: number | null
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

export interface DataModelLimitationsReport {
  schemaVersion: string
  generatedAt: string
  editionLevelOwnership: {
    status: 'PARTIAL'
    measurableEditions: number
    unmeasurableEditions: number
  }
  reason: string
  recommendation: string
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
  materialization: {
    materializedEditions: number
    unmaterializedEditions: number
  }
  measurement: {
    measuredEditions: number
    unmeasurableEditions: number
    zeroRecordEditions: number
    positiveRecordEditions: number
  }
  distributionSample: {
    sampleSize: number
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
  payloadMeasurement: {
    measuredUniquePayloads: number
    unmeasuredEditions: number
    globalUniquePayloads: number | null
    status: 'PARTIAL_MEASUREMENT' | 'COMPLETE'
  }
  editionContributions: {
    uniqueCorpusContribution: number
    additionalLanguage: number
    sourceWitness: number
    mirror: number
    structuralVariant: number
    partial: number
    unresolved: number
    unmeasurable: number
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
    unmeasurable: number
  }
}

export interface DepthValidationResult {
  valid: boolean
  problems: string[]
  totalTraditions: number
  totalWorks: number
  totalEditions: number
  materializedEditions: number
  measuredEditions: number
  unmeasurableEditions: number
  distributionSampleSize: number
  zeroRecordEditions: number
  positiveRecordEditions: number
  phase15NewWorks: number
  phase15NewEditions: number
  canonicalPositions: number
  editionRecords: number
  syntheticCountCalculations: number
}

