import type {
  Assertion,
  CanonicalId,
  Entity,
  Evidence,
  Resource
} from '@moonwitness/corpus-core'

export interface CorpusSearchQuery {
  text?: string
  kinds?: string[]
  limit?: number
}

export interface CorpusSearchResult {
  id: CanonicalId
  recordType: string
  label?: string
  score?: number
}

export interface CorpusRepository {
  getEntity(id: CanonicalId): Promise<Entity | null>
  getResource(id: CanonicalId): Promise<Resource | null>
  getAssertion(id: CanonicalId): Promise<Assertion | null>
  getEvidence(id: CanonicalId): Promise<Evidence | null>
  search(query: CorpusSearchQuery): Promise<CorpusSearchResult[]>
}
