import type { CanonicalId, CorpusRecord } from '@moonwitness/corpus-core'
import type { IngestionRecipe } from '../types.js'

export type ExecutionMode = 'recipe' | 'adapter' | 'script'
export type ExecutionStatus = 'READY' | 'UNMAPPED' | 'UNSUPPORTED_ADAPTER' | 'INVALID_RECIPE' | 'DISABLED'
export type ProcessExecutionStatus = 'PROCESS_SUCCEEDED' | 'PROCESS_FAILED'

export type UpstreamAcquisitionStatus =
  | 'REMOTE_SYNCED'
  | 'REMOTE_NOT_MODIFIED'
  | 'LOCAL_CACHE'
  | 'LOCAL_FALLBACK'
  | 'REMOTE_FAILED'
  | 'UNSUPPORTED'

export interface UpstreamPolicy {
  allowRemote?: boolean
  allowCache?: boolean
  allowFallback?: boolean
  required?: boolean
}

export interface UpstreamEndpoint extends UpstreamPolicy {
  id: string
  name: string
  type: 'rest_api' | 'git_repository' | 'git_repo' | 'open_data_archive' | 'sparql_endpoint' | 'raw_archive' | 'file_download' | string
  license: string
  enabled?: boolean
  baseUrl?: string
  repoUrl?: string
  url?: string
  rateLimit?: string
  authRequired?: boolean
  documentation?: string
  outputRecipeId?: string
  fallbackSource?: string
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

export interface ExecutorJobDefinition extends UpstreamPolicy {
  id: string
  name: string
  enabled: boolean
  endpointIds: string[]
  script?: string
  recipeId?: string
  adapterId?: string
  timeoutMs?: number
  fallbackSource?: string
}

export interface ExecutorRegistry {
  version: string
  defaults?: {
    concurrency?: number
    shell?: boolean
    timeoutMs?: number
    allowRemote?: boolean
    allowCache?: boolean
    allowFallback?: boolean
  }
  jobs: ExecutorJobDefinition[]
}

export interface UpstreamExecutionPlan extends UpstreamPolicy {
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
  script?: string
  fallbackSource?: string
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
  status: UpstreamAcquisitionStatus
  sourceUrl?: string
  resolvedLocation: string
  retrievedAt: string
  sourceSha256: string
  byteSize: number
  etag?: string
  lastModified?: string
  fallbackReason?: string
  fallbackSource?: string
}

export interface UpstreamScriptPayload {
  acquisitionStatus: UpstreamAcquisitionStatus
  sourceUrl?: string
  resolvedUrl?: string
  retrievedAt?: string
  sourceSha256?: string
  byteCount?: number
  fallbackReason?: string
  fallbackSource?: string
  error?: string
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
  executionStatus: ProcessExecutionStatus
  status: 'succeeded' | 'not_modified' | 'cache' | 'fallback' | 'failed' | 'unsupported'
  acquisitionStatus: UpstreamAcquisitionStatus
  required: boolean
  allowFallback: boolean
  allowCache: boolean
  durationMs: number
  error?: string
  fallbackReason?: string
  fallbackSource?: string
  requestedUrl?: string
  resolvedUrl?: string
  retrievedAt?: string
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
  policy: {
    defaultAllowFallback: boolean
  }
  totals: {
    planned: number
    remoteSynced: number
    notModified: number
    cache: number
    fallback: number
    failed: number
    unsupported: number
  }
  jobs: UpstreamJobResult[]
}

export interface UpstreamCoverageReport {
  schemaVersion: '1.0.0'
  generatedAt: string
  runId: string
  registryVersion: string
  planned: number
  remoteSynced: number
  notModified: number
  cache: number
  fallback: number
  failed: number
  unsupported: number
  remoteCoveragePercent: number
  validatedCoveragePercent: number
  fallbackPercent: number
  failurePercent: number
}
