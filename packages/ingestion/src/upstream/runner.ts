import { spawn } from 'node:child_process'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { UpstreamPlanner } from './planner.js'
import { defaultUpstreamAdapterRegistry, UpstreamAdapterRegistry } from './adapter-registry.js'
import { RecipeResolver } from './recipe-resolver.js'
import { buildRunManifest, writeRunManifest } from './manifest.js'
import type {
  UpstreamExecutionPlan,
  UpstreamJobResult,
  UpstreamRunManifest,
  ProcessExecutionStatus,
  UpstreamAcquisitionStatus,
  UpstreamScriptPayload,
  UpstreamFailureClass
} from './types.js'

export function classifyFailure(errStr?: string, status?: number): UpstreamFailureClass {
  if (!errStr && !status) return 'REMOTE_NETWORK_ERROR'
  const text = (errStr || '').toLowerCase()

  if (status === 404 || text.includes('404') || text.includes('not found')) {
    return 'REMOTE_NOT_FOUND'
  }
  if (status === 429 || text.includes('429') || text.includes('rate limit') || text.includes('too many requests')) {
    return 'REMOTE_RATE_LIMITED'
  }
  if (status === 401 || text.includes('401') || text.includes('unauthorized')) {
    return 'REMOTE_UNAUTHORIZED'
  }
  if (status === 403 || text.includes('403') || text.includes('forbidden') || text.includes('cloudflare')) {
    return 'REMOTE_FORBIDDEN'
  }
  if (text.includes('auth_required') || text.includes('requires an api key') || text.includes('missing api key')) {
    return 'REMOTE_AUTH_REQUIRED'
  }
  if (text.includes('timeout') || text.includes('timed out') || text.includes('etimedout')) {
    return 'REMOTE_TIMEOUT'
  }
  if (text.includes('econnrefused') || text.includes('enotfound') || text.includes('network') || text.includes('fetch failed')) {
    return 'REMOTE_NETWORK_ERROR'
  }
  if (text.includes('parse') || text.includes('json') || text.includes('syntaxerror')) {
    return 'REMOTE_PARSE_ERROR'
  }
  if (text.includes('unavailable') || text.includes('unreachable') || text.includes('503')) {
    return 'REMOTE_UNAVAILABLE'
  }

  return 'REMOTE_NETWORK_ERROR'
}

export interface RunnerOptions {
  workers?: number
  concurrency?: number
  defaultAllowFallback?: boolean
  outDir?: string
}

export class UpstreamRunner {
  private readonly rootDir: string
  private readonly workers: number
  private readonly defaultAllowFallback: boolean
  private readonly adapterRegistry: UpstreamAdapterRegistry
  private readonly recipeResolver: RecipeResolver
  private readonly timeoutMs: number

  constructor(options: {
    rootDir?: string
    workers?: number
    concurrency?: number
    defaultAllowFallback?: boolean
    adapterRegistry?: UpstreamAdapterRegistry
    recipeResolver?: RecipeResolver
    timeoutMs?: number
  } = {}) {
    this.rootDir = options.rootDir || process.cwd()
    this.workers = options.workers || options.concurrency || 3
    this.defaultAllowFallback = options.defaultAllowFallback ?? false
    this.adapterRegistry = options.adapterRegistry || defaultUpstreamAdapterRegistry
    this.recipeResolver = options.recipeResolver || new RecipeResolver(this.rootDir)
    this.timeoutMs = options.timeoutMs || 900000
  }

  private async retainPayload(bytes: Uint8Array, sha256: string): Promise<string> {
    const dir = path.join(this.rootDir, 'dist', 'acquisition-payloads')
    await mkdir(dir, { recursive: true })
    const file = path.join(dir, `${sha256}.bin`)
    if (!existsSync(file)) await writeFile(file, bytes)
    return path.relative(this.rootDir, file).replaceAll(path.sep, '/')
  }

  async executePlan(plan: UpstreamExecutionPlan, runId: string): Promise<UpstreamJobResult> {
    const started = Date.now()
    const targetUrl = plan.endpoint.baseUrl || plan.endpoint.repoUrl || plan.endpoint.url

    // 1. Script Execution Mode
    if (plan.mode === 'script' && plan.script) {
      const scriptPath = path.resolve(this.rootDir, plan.script)
      return new Promise<UpstreamJobResult>((resolve) => {
        let stdout = ''
        let stderr = ''
        let timedOut = false

        const env = {
          ...process.env,
          MOONWITNESS_UPSTREAM_RUN_ID: runId,
          MOONWITNESS_UPSTREAM_TRADITION: plan.traditionId,
          MOONWITNESS_UPSTREAM_ENDPOINT: plan.endpointId,
          MOONWITNESS_ALLOW_LOCAL_FALLBACK: (plan.allowFallback ?? this.defaultAllowFallback) ? '1' : '0'
        }

        const child = spawn('node', ['--import', 'tsx', scriptPath], {
          cwd: this.rootDir,
          env,
          stdio: ['ignore', 'pipe', 'pipe']
        })

        child.stdout.on('data', (d) => { stdout += d.toString() })
        child.stderr.on('data', (d) => { stderr += d.toString() })

        const timer = setTimeout(() => {
          timedOut = true
          child.kill('SIGTERM')
        }, this.timeoutMs)

        child.on('close', (code) => {
          clearTimeout(timer)
          const durationMs = Date.now() - started
          let executionStatus: ProcessExecutionStatus = code === 0 ? 'PROCESS_SUCCEEDED' : 'PROCESS_FAILED'
          if (timedOut) executionStatus = 'PROCESS_TIMEOUT'

          // Machine-readable child-process result matching
          const regex = /^MOONWITNESS_RESULT[:=](.+)$/gm
          const rawMatches: string[] = []
          let match: RegExpExecArray | null
          while ((match = regex.exec(stdout)) !== null) {
            rawMatches.push(match[1])
          }

          let acqStatus: UpstreamAcquisitionStatus = 'REMOTE_FAILED'
          let jobStatus: UpstreamJobResult['status'] = 'failed'
          let parsedPayload: UpstreamScriptPayload | null = null
          let failureClass: UpstreamFailureClass | undefined
          let fallbackReason: string | undefined
          let fallbackSource: string | undefined = plan.fallbackSource
          let sourceSha256: string | undefined
          let byteCount: number | undefined
          let contentType: string | undefined
          let etag: string | undefined
          let lastModified: string | undefined
          let repoUrl: string | undefined
          let resolvedCommit: string | undefined
          let ref: string | undefined
          let defaultBranch: string | undefined
          let resolvedUrl: string = plan.script || 'unknown'
          let retrievedAt: string = new Date().toISOString()
          let errorMsg: string | undefined

          if (executionStatus === 'PROCESS_TIMEOUT') {
            acqStatus = 'REMOTE_FAILED'
            jobStatus = 'failed'
            failureClass = 'REMOTE_TIMEOUT'
            errorMsg = `Process timed out after ${this.timeoutMs}ms`
            fallbackReason = 'PROCESS_TIMEOUT'
          } else if (executionStatus === 'PROCESS_FAILED') {
            acqStatus = 'REMOTE_FAILED'
            jobStatus = 'failed'
            errorMsg = stderr.trim() || `Script exited with code ${code}`
            failureClass = classifyFailure(errorMsg)
            fallbackReason = `Process failed with exit code ${code}`
          } else if (rawMatches.length === 0) {
            // Process exited 0 but emitted no structured result
            acqStatus = 'REMOTE_FAILED'
            jobStatus = 'failed'
            failureClass = 'REMOTE_PARSE_ERROR'
            errorMsg = 'INVALID_ACQUISITION_RESULT: Missing MOONWITNESS_RESULT payload'
            fallbackReason = 'INVALID_ACQUISITION_RESULT'
          } else if (rawMatches.length > 1) {
            // Duplicate results emitted
            acqStatus = 'REMOTE_FAILED'
            jobStatus = 'failed'
            failureClass = 'REMOTE_PARSE_ERROR'
            errorMsg = 'INVALID_ACQUISITION_RESULT: Duplicate MOONWITNESS_RESULT payloads emitted'
            fallbackReason = 'DUPLICATE_ACQUISITION_RESULT'
          } else {
            const rawJson = rawMatches[0].trim()
            try {
              parsedPayload = JSON.parse(rawJson) as UpstreamScriptPayload
              if (!parsedPayload.acquisitionStatus) {
                throw new Error('Missing acquisitionStatus in payload')
              }
              acqStatus = parsedPayload.acquisitionStatus
              failureClass = parsedPayload.failureClass
              fallbackReason = parsedPayload.fallbackReason
              if (parsedPayload.fallbackSource) fallbackSource = parsedPayload.fallbackSource
              if (parsedPayload.sourceSha256) sourceSha256 = parsedPayload.sourceSha256
              if (parsedPayload.byteCount !== undefined) byteCount = parsedPayload.byteCount
              if (parsedPayload.contentType) contentType = parsedPayload.contentType
              if (parsedPayload.etag) etag = parsedPayload.etag
              if (parsedPayload.lastModified) lastModified = parsedPayload.lastModified
              if (parsedPayload.repoUrl) repoUrl = parsedPayload.repoUrl
              if (parsedPayload.resolvedCommit) resolvedCommit = parsedPayload.resolvedCommit
              if (parsedPayload.ref) ref = parsedPayload.ref
              if (parsedPayload.defaultBranch) defaultBranch = parsedPayload.defaultBranch
              if (parsedPayload.resolvedUrl) resolvedUrl = parsedPayload.resolvedUrl
              if (parsedPayload.retrievedAt) retrievedAt = parsedPayload.retrievedAt
              if (parsedPayload.error) errorMsg = parsedPayload.error

              if (acqStatus === 'REMOTE_FAILED' && !failureClass) {
                failureClass = classifyFailure(errorMsg || fallbackReason)
              }

              const statusMap: Record<UpstreamAcquisitionStatus, UpstreamJobResult['status']> = {
                REMOTE_SYNCED: 'succeeded',
                REMOTE_NOT_MODIFIED: 'not_modified',
                LOCAL_CACHE: 'cache',
                LOCAL_FALLBACK: 'fallback',
                REMOTE_FAILED: 'failed',
                UNSUPPORTED: 'unsupported'
              }
              jobStatus = statusMap[acqStatus] ?? 'failed'
            } catch (err: any) {
              acqStatus = 'REMOTE_FAILED'
              jobStatus = 'failed'
              failureClass = 'REMOTE_PARSE_ERROR'
              errorMsg = `INVALID_ACQUISITION_RESULT: Malformed JSON: ${err.message}`
              fallbackReason = 'MALFORMED_RESULT_JSON'
            }
          }

          resolve({
            id: plan.id,
            traditionId: plan.traditionId,
            endpointId: plan.endpointId,
            mode: 'script',
            executionStatus,
            status: jobStatus,
            acquisitionStatus: acqStatus,
            failureClass,
            required: plan.required ?? false,
            allowFallback: plan.allowFallback ?? this.defaultAllowFallback,
            allowCache: plan.allowCache ?? false,
            durationMs,
            error: errorMsg,
            fallbackReason,
            fallbackSource,
            requestedUrl: targetUrl,
            resolvedUrl,
            retrievedAt,
            byteCount,
            sourceSha256,
            contentType,
            etag,
            lastModified,
            repoUrl,
            resolvedCommit,
            ref,
            defaultBranch,
            provenance: {
              runId,
              traditionId: plan.traditionId,
              endpointId: plan.endpointId,
              sourceUrl: targetUrl,
              resolvedLocation: resolvedUrl,
              retrievedAt,
              sourceSha256: sourceSha256 || 'script-managed'
            }
          })
        })

        child.on('error', (err) => {
          clearTimeout(timer)
          resolve({
            id: plan.id,
            traditionId: plan.traditionId,
            endpointId: plan.endpointId,
            mode: 'script',
            executionStatus: 'PROCESS_FAILED',
            status: 'failed',
            acquisitionStatus: 'REMOTE_FAILED',
            failureClass: classifyFailure(err.message),
            required: plan.required ?? false,
            allowFallback: plan.allowFallback ?? this.defaultAllowFallback,
            allowCache: plan.allowCache ?? false,
            durationMs: Date.now() - started,
            error: err.message,
            fallbackReason: err.message,
            requestedUrl: targetUrl,
            retrievedAt: new Date().toISOString()
          })
        })
      })
    }

    // 2. Adapter Execution Mode
    if (plan.mode === 'adapter' && plan.adapterId) {
      const adapter = this.adapterRegistry.resolve(plan.adapterId)
      try {
        const acq = await adapter.acquire(plan.endpoint, {
          endpoint: plan.endpoint,
          traditionId: plan.traditionId,
          allowNetwork: plan.allowRemote ?? true
        })

        // Acquisition is not materialization: retain the exact verified response so a
        // later parser/materializer can inspect it without re-downloading the endpoint.
        const outputFiles = acq.bytes.byteLength > 0 && acq.sourceSha256
          ? [await this.retainPayload(acq.bytes, acq.sourceSha256)]
          : []

        const statusMap: Record<UpstreamAcquisitionStatus, UpstreamJobResult['status']> = {
          REMOTE_SYNCED: 'succeeded',
          REMOTE_NOT_MODIFIED: 'not_modified',
          LOCAL_CACHE: 'cache',
          LOCAL_FALLBACK: 'fallback',
          REMOTE_FAILED: 'failed',
          UNSUPPORTED: 'unsupported'
        }

        return {
          id: plan.id,
          traditionId: plan.traditionId,
          endpointId: plan.endpointId,
          mode: 'adapter',
          executionStatus: 'PROCESS_SUCCEEDED',
          status: statusMap[acq.status] ?? 'succeeded',
          acquisitionStatus: acq.status,
          failureClass: acq.failureClass,
          required: plan.required ?? false,
          allowFallback: plan.allowFallback ?? this.defaultAllowFallback,
          allowCache: plan.allowCache ?? false,
          durationMs: Date.now() - started,
          byteCount: acq.byteSize,
          requestedUrl: targetUrl,
          resolvedUrl: acq.resolvedLocation,
          retrievedAt: acq.retrievedAt,
          fallbackReason: acq.fallbackReason,
          fallbackSource: acq.fallbackSource,
          sourceSha256: acq.sourceSha256,
          contentType: acq.contentType,
          etag: acq.etag,
          lastModified: acq.lastModified,
          repoUrl: acq.repoUrl,
          resolvedCommit: acq.resolvedCommit,
          ref: acq.ref,
          defaultBranch: acq.defaultBranch,
          outputFiles,
          provenance: {
            runId,
            traditionId: plan.traditionId,
            endpointId: plan.endpointId,
            adapterId: plan.adapterId,
            sourceUrl: acq.sourceUrl,
            resolvedLocation: acq.resolvedLocation,
            retrievedAt: acq.retrievedAt,
            sourceSha256: acq.sourceSha256,
            etag: acq.etag,
            lastModified: acq.lastModified
          }
        }
      } catch (err: any) {
        return {
          id: plan.id,
          traditionId: plan.traditionId,
          endpointId: plan.endpointId,
          mode: 'adapter',
          executionStatus: 'PROCESS_FAILED',
          status: 'failed',
          acquisitionStatus: 'REMOTE_FAILED',
          failureClass: classifyFailure(err.message),
          required: plan.required ?? false,
          allowFallback: plan.allowFallback ?? this.defaultAllowFallback,
          allowCache: plan.allowCache ?? false,
          durationMs: Date.now() - started,
          error: err.message,
          fallbackReason: err.message,
          requestedUrl: targetUrl,
          retrievedAt: new Date().toISOString()
        }
      }
    }

    return {
      id: plan.id,
      traditionId: plan.traditionId,
      endpointId: plan.endpointId,
      mode: plan.mode,
      executionStatus: 'PROCESS_SUCCEEDED',
      status: 'cache',
      acquisitionStatus: 'LOCAL_CACHE',
      required: plan.required ?? false,
      allowFallback: plan.allowFallback ?? this.defaultAllowFallback,
      allowCache: plan.allowCache ?? false,
      durationMs: Date.now() - started,
      requestedUrl: targetUrl,
      resolvedUrl: targetUrl,
      retrievedAt: new Date().toISOString()
    }
  }

  async run(options: RunnerOptions = {}): Promise<{
    manifest: UpstreamRunManifest
    manifestPath: string
    hasFailures: boolean
    failureReasons: string[]
  }> {
    const runId = randomUUID()
    const startedAt = new Date().toISOString()
    const planner = new UpstreamPlanner({
      rootDir: this.rootDir,
      defaultAllowFallback: this.defaultAllowFallback
    })

    const { plans } = await planner.buildPlan()
    const activePlans = plans.filter(p => p.enabled)

    const jobResults: UpstreamJobResult[] = []
    const queue = [...activePlans]
    const workersCount = options.workers || this.workers

    const worker = async () => {
      while (queue.length > 0) {
        const plan = queue.shift()
        if (!plan) break
        const result = await this.executePlan(plan, runId)
        jobResults.push(result)
      }
    }

    const workerPromises = Array.from({ length: workersCount }, () => worker())
    await Promise.all(workerPromises)

    const completedAt = new Date().toISOString()

    const manifest = buildRunManifest({
      runId,
      startedAt,
      completedAt,
      registryVersion: '1.0.0',
      workers: workersCount,
      jobs: jobResults,
      defaultAllowFallback: this.defaultAllowFallback
    })

    const manifestPath = await writeRunManifest(manifest, options.outDir || path.join(this.rootDir, 'dist'))

    const failureReasons: string[] = []
    let hasFailures = false

    for (const job of jobResults) {
      if (job.required && (job.acquisitionStatus === 'REMOTE_FAILED' || job.acquisitionStatus === 'LOCAL_FALLBACK')) {
        hasFailures = true
        failureReasons.push(`Required job ${job.id} did not remotely sync: ${job.acquisitionStatus} (${job.error || job.fallbackReason})`)
      } else if (!job.allowFallback && job.acquisitionStatus === 'LOCAL_FALLBACK') {
        hasFailures = true
        failureReasons.push(`Job ${job.id} fell back when allowFallback=false`)
      }
    }

    return {
      manifest,
      manifestPath,
      hasFailures,
      failureReasons
    }
  }
}
