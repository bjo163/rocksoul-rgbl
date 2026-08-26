import type { CanonicalId } from './identifiers.js'
import type { Label } from './labels.js'
import type { RecordLifecycle } from './lifecycle.js'

export const TEXTUAL_PROFILE_ID = 'textual@0.1' as const

export type TextualResourceKind =
  | 'textual.work'
  | 'textual.expression'
  | 'textual.edition'
  | 'textual.artifact'
  | 'textual.passage'
  | 'textual.citation_scheme'
  | 'textual.content'
  | 'textual.alignment'
  | 'textual.variant'

export interface TextQuoteSelector {
  type: 'TextQuoteSelector'
  exact: string
  prefix?: string
  suffix?: string
}

export interface TextPositionSelector {
  type: 'TextPositionSelector'
  start: number
  end: number
}

export interface RangeSelector {
  type: 'RangeSelector'
  startSelector: TextQuoteSelector | TextPositionSelector
  endSelector: TextQuoteSelector | TextPositionSelector
}

export type TextSelector = TextQuoteSelector | TextPositionSelector | RangeSelector

export interface TextTarget {
  target: CanonicalId
  selector?: TextSelector
}

export interface CitationReference {
  scheme: CanonicalId
  reference: string
  path: string[]
}

export interface TextualWorkPayload {
  work_type?: string
  part_of?: CanonicalId
}

export type ExpressionRelation =
  | 'translation_of'
  | 'recension_of'
  | 'transliteration_of'
  | 'revision_of'
  | 'adaptation_of'
  | 'derived_from'

export interface TextualExpressionPayload {
  work: CanonicalId
  language: string
  script?: string
  relations?: Array<{ relation: ExpressionRelation; expression: CanonicalId }>
}

export interface TextualEditionPayload {
  expressions: CanonicalId[]
  edition_statement?: string
}

export interface TextualArtifactPayload {
  represents: CanonicalId
  representation_kind?: string
  media_type?: string
}

export interface TextualPassagePayload {
  container: CanonicalId
  parent?: CanonicalId
  unit: string
  sequence?: number
  local_id?: string
  citations?: CitationReference[]
}

export interface CitationSchemeComponent {
  key: string
  unit?: string
  optional?: boolean
}

export interface TextualCitationSchemePayload {
  applies_to: CanonicalId[]
  components: CitationSchemeComponent[]
  delimiter?: string
  example?: string
}

export type ContentRepresentation = 'source' | 'diplomatic' | 'normalized' | 'search'
export type ContentDerivationRelation =
  | 'translation'
  | 'transliteration'
  | 'normalization'
  | 'search_normalization'
  | 'transcription'
  | 'correction'
  | 'other'

export interface ContentDerivation {
  content: CanonicalId
  relation: ContentDerivationRelation
  method?: string
  version?: string
}

export interface TextualContentPayload {
  target: CanonicalId
  language: string
  script?: string
  representation: ContentRepresentation
  text: string
  derived_from?: ContentDerivation[]
}

export interface TextualAlignmentPayload {
  relation: string
  sources: TextTarget[]
  targets: TextTarget[]
  method?: string
  provenance?: CanonicalId
}

export interface TextualVariantReading {
  label?: string
  witnesses: CanonicalId[]
  content?: CanonicalId
  text?: string
  language?: string
  script?: string
}

export interface TextualVariantPayload {
  locus: TextTarget[]
  readings: TextualVariantReading[]
  provenance?: CanonicalId
}

export type TextualPayloadByKind = {
  'textual.work': TextualWorkPayload
  'textual.expression': TextualExpressionPayload
  'textual.edition': TextualEditionPayload
  'textual.artifact': TextualArtifactPayload
  'textual.passage': TextualPassagePayload
  'textual.citation_scheme': TextualCitationSchemePayload
  'textual.content': TextualContentPayload
  'textual.alignment': TextualAlignmentPayload
  'textual.variant': TextualVariantPayload
}

export type TextualResource<K extends TextualResourceKind = TextualResourceKind> = {
  id: CanonicalId
  record_type: 'resource'
  kind: K
  labels?: Label[]
  description?: string
  lifecycle?: RecordLifecycle
  extensions: Record<string, unknown> & { textual: TextualPayloadByKind[K] }
}
