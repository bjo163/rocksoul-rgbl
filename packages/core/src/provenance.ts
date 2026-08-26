import type { CanonicalId } from './identifiers.js'

export type ProvenanceActivityType =
  | 'acquisition'
  | 'parsing'
  | 'normalization'
  | 'mapping'
  | 'curation'
  | 'reconciliation'
  | 'validation'
  | 'generation'
  | 'other'

export interface ProcessingSoftware {
  name: string
  version?: string
}

export interface ProvenanceActivity {
  type: ProvenanceActivityType
  method?: string
  agent?: CanonicalId
  software?: ProcessingSoftware
  started_at?: string
  ended_at?: string
  note?: string
  extensions?: Record<string, unknown>
}
