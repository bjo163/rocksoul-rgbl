import type { CanonicalId, CorpusRecord } from '@moonwitness/corpus-core'
import type { AcquisitionStatus, IngestionRecipe } from '../types.js'

export type ExecutionMode = 'recipe' | 'adapter' | 'script'
export type ExecutionStatus = 'READY' | 'UNMAPPED' | 'UNSUPPORTED_ADAPTER' | 'INVALID_RECIPE' | 'DISABLED'

export interface UpstreamEndpoint {
  id: string
  name: string
  type: 'rest_api' | 'git_repository' | 'open_data_archive' | 'sparql_endpoint' | 'file_download' | string
  license: string
  enabled?: boolean
  required?: boolean
  baseUrl?: string
  repoUrl?: string
  url?: string
  rateLimit?: string
  authRequired?: boolean
  documentation?: string
  outputRecipeId?: string
}

export interface UpstreamTradition {
  name: string
  primaryLanguage: string
  scripts: string[]
  endpoints: UpstreamEndpoint[]
}

export interface UpstreamMasterRegistry {
  version: string
  title: string
  description?: string
  traditions: Record<string, UpstreamTradition>
}

export interface ExecutorJobDefinition {
  id: string
  name: string
  enabled: boolean
  endpointIds: string[]
  script?: string
  recipeId?: string
  adapterId?: string
  required?: boolean
  timeoutMs?: number
}

export interface ExecutorRegistry {
  version: string
  defaults?: {
    concurrency?: number
    shell?: boolean
    timeoutMs?: number
  }
  jobs: ExecutorJobDefinition[]
}

export interface UpstreamExecutionPlan {
  id: string
  traditionId: string
  endpointId: string
  endpoint: UpstreamEndpoint
  sourceId?: string
  recipeId?: string
  adapterId?: string
  mode: ExecutionMode
  status: ExecutionStatus
  enabled: boolean
  required: boolean
  script?: string
}

export interface UpstreamAdapterContext {
  endpoint: UpstreamEndpoint
  traditionId: string
  recipe?: IngestionRecipe
  allowNetwork?: boolean
  fetchImpl?: typeof fetch
}

export interface UpstreamAcquisitionResult {
  bytes: Uint8Array
  status: AcquisitionStatus
  sourceUrl?: string
  resolvedLocation: string
  retrievedAt: string
  sourceSha256: string
  byteSize: number
  etag?: string
  lastModified?: string
}

export interface UpstreamAdapter {
  readonly id: string
  readonly kind: string
  supports(endpoint: UpstreamEndpoint): boolean
  acquire(endpoint: UpstreamEndpoint, context: UpstreamAdapterContext): Promise<UpstreamAcquisitionResult>
  parse?(bytes: Uint8Array, context: UpstreamAdapterContext): Promise<unknown>
}

export interface UpstreamJobProvenance {
  runId: string
  traditionId: string
  workId?: string
  sourceId?: string
  endpointId: string
  recipeId?: string
  adapterId?: string
  sourceUrl?: string
  resolvedLocation: string
  retrievedAt: string
  sourceVersion?: string
  sourceCommit?: string
  etag?: string
  lastModified?: string
  sourceSha256: string
  normalizedSha256?: string
  outputSha256?: string
  parserVersion?: string
  normalizerVersion?: string
  mapperVersion?: string
  validatorVersion?: string
}

export interface UpstreamJobResult {
  id: string
  traditionId: string
  endpointId: string
  mode: ExecutionMode
  status: 'succeeded' | 'not_modified' | 'failed' | 'unsupported' | 'fallback'
  acquisitionStatus: AcquisitionStatus
  required: boolean
  durationMs: number
  error?: string
  provenance?: UpstreamJobProvenance
  recordCount?: number
  byteCount?: number
  outputFiles?: string[]
}

export interface UpstreamRunManifest {
  schemaVersion: '1.0.0'
  runId: string
  startedAt: string
  completedAt: string
  registryVersion: string
  workers: number
  totals: {
    planned: number
    succeeded: number
    notModified: number
    failed: number
    unsupported: number
    fallback: number
  }
  jobs: UpstreamJobResult[]
}
