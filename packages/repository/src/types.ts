import type {
  Assessment,
  Assertion,
  AssertionScope,
  CanonicalId,
  CorpusRecord,
  Entity,
  Evidence,
  Provenance,
  Resource
} from '@moonwitness/corpus-core'

export type CorpusRecordType = CorpusRecord['record_type']

export interface DatasetPartition {
  recordType: string
  path: string
}

export interface DatasetManifest {
  id: CanonicalId
  datasetVersion: string
  specVersion: string
  profiles: string[]
  dependencies?: Array<{ dataset: CanonicalId; version: string }>
  partitions: DatasetPartition[]
  sources?: string[]
  rights?: string
  availability?: 'bundled' | 'external' | 'metadata_only' | 'restricted'
}

export interface DatasetRegistryEntry {
  id: CanonicalId
  path: string
  status: string
}

export interface DatasetDescriptor {
  entry: DatasetRegistryEntry
  manifest: DatasetManifest
}

export interface DatasetDependencyResolution {
  root: DatasetDescriptor
  ordered: DatasetDescriptor[]
}

export interface CorpusRecordQuery {
  recordTypes?: CorpusRecordType[]
  kinds?: string[]
  datasetIds?: CanonicalId[]
}

export type AssertionScopeFilter = Partial<AssertionScope>

export interface AssertionQuery {
  subject?: CanonicalId
  predicate?: CanonicalId
  objectEntity?: CanonicalId
  scope?: AssertionScopeFilter
  datasetIds?: CanonicalId[]
  limit?: number
}

export interface PassageReferenceQuery {
  reference: string
  scheme?: CanonicalId
  container?: CanonicalId
  unit?: string
  datasetIds?: CanonicalId[]
  limit?: number
}

export interface AssertionEvidenceTraversal {
  assertion: Assertion
  evidence: Evidence[]
  targets: CorpusRecord[]
}

export interface CorpusSearchQuery {
  text?: string
  recordTypes?: CorpusRecordType[]
  kinds?: string[]
  datasetIds?: CanonicalId[]
  assertionScope?: AssertionScopeFilter
  offset?: number
  limit?: number
}

export interface CorpusSearchResult {
  id: CanonicalId
  recordType: CorpusRecordType
  kind?: string
  label?: string
  datasetId?: CanonicalId
  score: number
}

export interface CorpusRepository {
  getRecord(id: CanonicalId): Promise<CorpusRecord | null>
  getEntity(id: CanonicalId): Promise<Entity | null>
  getResource(id: CanonicalId): Promise<Resource | null>
  getAssertion(id: CanonicalId): Promise<Assertion | null>
  getEvidence(id: CanonicalId): Promise<Evidence | null>
  getProvenance(id: CanonicalId): Promise<Provenance | null>
  getAssessment(id: CanonicalId): Promise<Assessment | null>
  getPassage(id: CanonicalId): Promise<Resource | null>
  getRecordDataset(id: CanonicalId): Promise<CanonicalId | null>
  listDatasets(): Promise<DatasetDescriptor[]>
  resolveDatasetDependencies(id: CanonicalId): Promise<DatasetDependencyResolution | null>
  iterateRecords(query?: CorpusRecordQuery): AsyncIterable<CorpusRecord>
  lookupPassages(query: PassageReferenceQuery): Promise<Resource[]>
  findAssertions(query?: AssertionQuery): Promise<Assertion[]>
  getEvidenceForAssertion(id: CanonicalId): Promise<Evidence[]>
  traverseAssertionEvidence(id: CanonicalId): Promise<AssertionEvidenceTraversal | null>
  search(query: CorpusSearchQuery): Promise<CorpusSearchResult[]>
  getAllRecords?(): ReadonlyMap<CanonicalId, CorpusRecord>
}
