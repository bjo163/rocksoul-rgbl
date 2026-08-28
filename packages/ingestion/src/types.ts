import type { CanonicalId, CorpusRecord } from '@moonwitness/corpus-core'

export type AcquisitionStatus =
  | 'REMOTE_SYNCED'
  | 'REMOTE_NOT_MODIFIED'
  | 'REMOTE_FAILED'
  | 'LOCAL_CACHE'
  | 'LOCAL_FALLBACK'

export type AcquisitionDescriptor = FilesystemAcquisition | HttpAcquisition

export interface FilesystemAcquisition {
  kind: 'filesystem'
  path: string
  sha256: string
  byte_size?: number
  media_type?: string
}

export interface HttpAcquisition {
  kind: 'http'
  url: string
  sha256: string
  byte_size?: number
  media_type?: string
}

export interface IngestionRecipe {
  id: CanonicalId
  version: string
  specVersion: '0.1'
  source: AcquisitionDescriptor
  adapter?: string
  implementation: {
    module: string
    parserVersion: string
    normalizerVersion: string
    mapperVersion: string
    validatorVersion?: string
  }
  overlays?: string[]
  output: { path: string }
}

export interface AcquisitionProvenance {
  status: AcquisitionStatus
  source_url?: string
  resolved_location: string
  retrieved_at?: string
  source_version?: string
  etag?: string
  last_modified?: string
  source_sha256: string
}

export interface AcquisitionResult {
  bytes: Uint8Array
  source: AcquisitionDescriptor
  resolved_location: string
  retrieved_at?: string
  sha256: string
  status?: AcquisitionStatus
  provenance?: AcquisitionProvenance
}

export interface ParserContext { recipe: IngestionRecipe; acquisition: AcquisitionResult }
export interface NormalizerContext extends ParserContext {}
export interface MapperContext extends ParserContext {}
export interface RecipeValidatorContext extends ParserContext {}

export interface RecipeHooks<Parsed = unknown, Normalized = unknown> {
  parse(bytes: Uint8Array, context: ParserContext): Promise<Parsed> | Parsed
  normalize(parsed: Parsed, context: NormalizerContext): Promise<Normalized> | Normalized
  map(normalized: Normalized, context: MapperContext): Promise<CorpusRecord[]> | CorpusRecord[]
  validate?(records: CorpusRecord[], context: RecipeValidatorContext): Promise<string[]> | string[]
}

export interface CurationOperation {
  op: 'add' | 'replace' | 'remove'
  target: CanonicalId
  path: string
  value?: unknown
  reason: string
  curator: CanonicalId
  provenance: CanonicalId
}

export interface CurationOverlay {
  version: '0.1'
  operations: CurationOperation[]
}

export interface IngestionRunOptions {
  recipeDir: string
  allowNetwork?: boolean
  outputPath?: string
  writeOutput?: boolean
  fetchImpl?: typeof fetch
}

export interface IngestionResult {
  recipe: IngestionRecipe
  records: CorpusRecord[]
  output: string
  outputSha256: string
  acquisition: Omit<AcquisitionResult, 'bytes'>
  appliedCorrections: CurationOperation[]
  findings: string[]
}
