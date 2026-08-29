export const KNOWLEDGE_DOMAIN_SCHEMA_VERSION = '1.0.0'

export type KnowledgeEvidenceStatus = 'SUPPORTED' | 'TRADITIONAL' | 'INFERRED' | 'UNCERTAIN' | 'DISPUTED' | 'UNKNOWN'
export type KnowledgeRelationType =
  | 'TRADITION_PERSON' | 'TRADITION_WORK' | 'TRADITION_EVENT' | 'TRADITION_LANGUAGE' | 'TRADITION_SOURCE'
  | 'PERSON_TRADITION' | 'PERSON_WORK' | 'PERSON_EVENT' | 'PERSON_PLACE'
  | 'EVENT_TRADITION' | 'EVENT_PERSON' | 'EVENT_WORK' | 'EVENT_PLACE'

export interface KnowledgeEntity {
  id: string
  kind: string
  labels?: unknown[]
  provenance?: unknown
  evidenceStatus?: KnowledgeEvidenceStatus
}

export interface KnowledgeAudit {
  schemaVersion: string
  entityCounts: { traditions: number; persons: number; events: number; eras: number; works: number; places: number; languages: number; sources: number }
  relationshipCounts: Record<KnowledgeRelationType, number>
  depth: Record<string, number>
  orphans: { traditions: string[]; persons: string[]; events: string[]; works: string[] }
  temporal: { datedEvents: number; approximateEvents: number; disputedEvents: number; undatedEvents: number }
}
