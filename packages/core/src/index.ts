import type { CanonicalId } from './identifiers.js'

export * from './identifiers.js'

export interface Label {
  value: string
  language?: string
  script?: string
}

export interface BaseRecord {
  id: CanonicalId
  record_type: 'entity' | 'resource' | 'assertion' | 'evidence' | 'provenance' | 'assessment'
}

export interface Entity extends BaseRecord {
  record_type: 'entity'
  kind: string
  labels?: Label[]
  description?: string
  extensions?: Record<string, unknown>
}

export interface Resource extends BaseRecord {
  record_type: 'resource'
  kind: string
  labels?: Label[]
  description?: string
  extensions?: Record<string, unknown>
}

export type AssertionObject =
  | { entity: CanonicalId }
  | { value: string | number | boolean | null; datatype?: string; language?: string }

export interface Assertion extends BaseRecord {
  record_type: 'assertion'
  subject: CanonicalId
  predicate: CanonicalId
  object: AssertionObject
  assertion_class: string
  scope?: Record<string, CanonicalId | string>
  evidence?: CanonicalId[]
  provenance?: CanonicalId
  extensions?: Record<string, unknown>
}

export interface EvidenceSelector {
  type: string
  [key: string]: unknown
}

export interface Evidence extends BaseRecord {
  record_type: 'evidence'
  target: CanonicalId
  relation: string
  selector?: EvidenceSelector
  provenance?: CanonicalId
  extensions?: Record<string, unknown>
}

export interface Provenance extends BaseRecord {
  record_type: 'provenance'
  source: CanonicalId
  source_reference?: string
  activity?: Record<string, unknown>
  extensions?: Record<string, unknown>
}

export interface Assessment extends BaseRecord {
  record_type: 'assessment'
  target: CanonicalId
  result: string
  assessor?: CanonicalId
  method?: string
  confidence?: number
  evidence?: CanonicalId[]
  extensions?: Record<string, unknown>
}

export type CorpusRecord = Entity | Resource | Assertion | Evidence | Provenance | Assessment
