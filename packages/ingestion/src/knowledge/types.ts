export const KNOWLEDGE_DOMAIN_SCHEMA_VERSION = '1.0.0'

export type KnowledgeEvidenceStatus = 'SUPPORTED' | 'TRADITIONAL' | 'INFERRED' | 'UNCERTAIN' | 'DISPUTED' | 'UNKNOWN'
export type KnowledgeTemporalPrecision = 'EXACT_DATE' | 'DATE_RANGE' | 'YEAR' | 'YEAR_RANGE' | 'CENTURY' | 'ERA' | 'APPROXIMATE' | 'UNKNOWN' | 'DISPUTED'
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

export interface KnowledgeTemporalValue {
  value?: string
  precision: KnowledgeTemporalPrecision
  certainty?: 'HIGH' | 'MEDIUM' | 'LOW'
  status?: KnowledgeEvidenceStatus
  alternatives?: Array<{ value: string; precision: KnowledgeTemporalPrecision; sourceStatement: string }>
}

export interface TimelineQueryIndex {
  byPerson: Map<string, string[]>
  byTradition: Map<string, string[]>
  byWork: Map<string, string[]>
  byPlace: Map<string, string[]>
  byEra: Map<string, string[]>
  bySource: Map<string, string[]>
  byYear: Map<number, string[]>
}

export interface KnowledgeAudit {
  schemaVersion: string
  entityCounts: { traditions: number; persons: number; events: number; eras: number; works: number; places: number; languages: number; sources: number }
  relationshipCounts: Record<KnowledgeRelationType, number>
  depth: Record<string, number>
  orphans: { traditions: string[]; persons: string[]; events: string[]; works: string[] }
  temporal: { datedEvents: number; approximateEvents: number; disputedEvents: number; undatedEvents: number }
}
