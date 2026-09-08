export interface Tradition {
  id: string
  name: string
  datasetCount?: number
  totalRecords?: number
  primaryLanguage?: string
  scripts?: string[]
}

export interface DatasetInfo {
  id: string
  version?: string
  specVersion?: string
  tradition?: string
  genre?: string
  sourceLanguage?: string
  rights?: string
  availability?: string
  recordCount?: number
}

export interface Work {
  id: string
  title: string
  tradition: string
  language?: string
  description?: string
  source?: string
  datasetId?: string
  rights?: string
  availability?: string
}

export interface ContentLane {
  id: string
  language: string
  script?: string
  representation: string
  text: string
  artifact?: string
  provenance?: string
}

export interface Passage {
  id: string
  workId: string
  locator: string
  label: string
  language?: string
  source: string
  provenance: string
  note?: string
  contents?: ContentLane[]
}

export interface SearchRecord {
  id: string
  title: string
  kind: string
  recordType?: string
  tradition?: string
  language?: string
  snippet?: string
  source?: string
  datasetId?: string
  score?: number
}

export interface CorpusResource {
  id: string
  record_type?: string
  kind?: string
  labels?: Array<{ value?: string; language?: string; role?: string; script?: string }>
  description?: string
  extensions?: Record<string, unknown>
  [key: string]: unknown
}

export interface ProvenanceRecord {
  id: string
  record_type?: string
  source?: string
  source_reference?: string
  activities?: Array<Record<string, unknown>>
  extensions?: Record<string, unknown>
  [key: string]: unknown
}

export interface EvidenceRecord {
  id: string
  record_type?: string
  target?: string
  relation?: string
  selector?: Record<string, unknown>
  provenance?: string
  extensions?: Record<string, unknown>
  [key: string]: unknown
}

export interface WorkHierarchy {
  work: CorpusResource | null
  expressions: CorpusResource[]
  editions: CorpusResource[]
  artifacts: CorpusResource[]
  dataset: DatasetInfo | null
}

export interface PassageTrace {
  passage: Passage
  rawPassage?: CorpusResource
  contents: ContentLane[]
  artifacts: CorpusResource[]
  provenanceRecords: ProvenanceRecord[]
  evidence: EvidenceRecord[]
  relations: CorpusResource[]
  dataset: DatasetInfo | null
}

export interface AssertionTraversal {
  assertion: Record<string, unknown>
  evidence: EvidenceRecord[]
  targets: Array<Record<string, unknown>>
}

export interface SemanticRuleRow {
  id: string
  label: string
  context: string
  epistemic: string
  sourceCount: number
  values: {
    support?: number
    counter?: number
    context?: number
    alternative?: number
  }
}

export interface CorpusCatalog {
  schemaVersion: number
  corpusHash: string
  catalogHash: string
  source: string
  summary: {
    totalRecords: number
    datasetCount: number
    workCount: number
    sampledPassageCount: number
  }
  traditions: Tradition[]
  works: Work[]
  hierarchies: Record<string, WorkHierarchy>
  passagePages: Record<string, { total: number; data: Passage[] }>
  traces: Record<string, PassageTrace>
  searchRecords: SearchRecord[]
  semanticRules: SemanticRuleRow[]
}
