import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import type {
  UpstreamExecutionPlan,
  UpstreamJobResult,
  UpstreamRunManifest,
  UpstreamScriptPayload,
  UpstreamAcquisitionStatus
} from './types.js'
import { buildRunManifest, writeRunManifest } from './manifest.js'
import { UpstreamPlanner } from './planner.js'
import { defaultUpstreamAdapterRegistry, UpstreamAdapterRegistry } from './adapter-registry.js'

export interface RunnerOptions {
  rootDir?: string
  concurrency?: number
  timeoutMs?: number
  allowNetwork?: boolean
  adapterRegistry?: UpstreamAdapterRegistry
  plans?: UpstreamExecutionPlan[]
  registryVersion?: string
  defaultAllowFallback?: boolean
}

export class UpstreamRunner {
  private readonly rootDir: string
  private readonly concurrency: number
  private readonly timeoutMs: number
  private readonly adapterRegistry: UpstreamAdapterRegistry
  private readonly defaultAllowFallback: boolean

  constructor(options: RunnerOptions = {}) {
    this.rootDir = options.rootDir || process.cwd()
    this.concurrency = options.concurrency || 8
    this.timeoutMs = options.timeoutMs || 900000 // 15 mins default
    this.adapterRegistry = options.adapterRegistry || defaultUpstreamAdapterRegistry
    this.defaultAllowFallback = options.defaultAllowFallback ?? (process.env.MOONWITNESS_ALLOW_FALLBACK === '1')
  }

  async runJob(plan: UpstreamExecutionPlan, runId: string): Promise<UpstreamJobResult> {
    const started = Date.now()
    const targetUrl = plan.endpoint.url || plan.endpoint.baseUrl || plan.endpoint.repoUrl

    if (plan.status !== 'READY' || !plan.enabled) {
      const acqStatus: UpstreamAcquisitionStatus = plan.status === 'DISABLED' ? 'REMOTE_NOT_MODIFIED' : 'UNSUPPORTED'
      return {
        id: plan.id,
        traditionId: plan.traditionId,
        endpointId: plan.endpointId,
        mode: plan.mode,
        executionStatus: 'PROCESS_SUCCEEDED',
        status: plan.status === 'DISABLED' ? 'not_modified' : 'unsupported',
        acquisitionStatus: acqStatus,
        required: plan.required ?? false,
        allowFallback: plan.allowFallback ?? this.defaultAllowFallback,
        allowCache: plan.allowCache ?? false,
        durationMs: 0,
        requestedUrl: targetUrl,
        resolvedUrl: targetUrl,
        retrievedAt: new Date().toISOString()
      }
    }

    // 1. Script execution mode
    if (plan.mode === 'script' && plan.script) {
      const tsxCli = path.join(this.rootDir, 'node_modules/tsx/dist/cli.mjs')
      const scriptPath = path.isAbsolute(plan.script) ? plan.script : path.join(this.rootDir, plan.script)
      const args = [tsxCli, scriptPath]

      return new Promise<UpstreamJobResult>((resolve) => {
        const child = spawn(process.execPath, args, {
          cwd: this.rootDir,
          env: {
            ...process.env,
            RUN_ID: runId,
            UPSTREAM_ENDPOINT: plan.endpointId,
            MOONWITNESS_ALLOW_LOCAL_FALLBACK: plan.allowFallback ? '1' : '0'
          },
          stdio: 'pipe',
          shell: false
        })

        let stdout = ''
        let stderr = ''
        child.stdout.on('data', d => stdout += d.toString())
        child.stderr.on('data', d => stderr += d.toString())

        const timer = setTimeout(() => {
          child.kill('SIGTERM')
        }, this.timeoutMs)

        child.on('close', (code) => {
          clearTimeout(timer)
          const durationMs = Date.now() - started
          const executionStatus = code === 0 ? 'PROCESS_SUCCEEDED' : 'PROCESS_FAILED'

          // Task 2: Machine-readable contract parsing
          const matches = stdout.match(/^MOONWITNESS_RESULT:(.+)$/gm)

          let acqStatus: UpstreamAcquisitionStatus = 'REMOTE_FAILED'
          let jobStatus: UpstreamJobResult['status'] = 'failed'
          let parsedPayload: UpstreamScriptPayload | null = null
          let fallbackReason: string | undefined
          let fallbackSource: string | undefined = plan.fallbackSource
          let sourceSha256: string = 'script-managed'
          let byteCount: number | undefined
          let resolvedUrl: string = plan.script || 'unknown'
          let retrievedAt: string = new Date().toISOString()
          let errorMsg: string | undefined

          if (executionStatus === 'PROCESS_FAILED') {
            acqStatus = 'REMOTE_FAILED'
            jobStatus = 'failed'
            errorMsg = stderr.trim() || `Script exited with code ${code}`
            fallbackReason = `Process failed with exit code ${code}`
          } else if (!matches || matches.length === 0) {
            // Exited 0 but missing structured payload
            acqStatus = 'REMOTE_FAILED'
            jobStatus = 'failed'
            errorMsg = 'INVALID_ACQUISITION_RESULT: Missing MOONWITNESS_RESULT payload'
            fallbackReason = 'Missing structured result envelope'
          } else if (matches.length > 1) {
            // Duplicate payload emission
            acqStatus = 'REMOTE_FAILED'
            jobStatus = 'failed'
            errorMsg = 'INVALID_ACQUISITION_RESULT: Duplicate MOONWITNESS_RESULT payloads emitted'
            fallbackReason = 'Duplicate result envelopes emitted'
          } else {
            const rawJson = matches[0].slice('MOONWITNESS_RESULT:'.length).trim()
            try {
              parsedPayload = JSON.parse(rawJson) as UpstreamScriptPayload
              if (!parsedPayload.acquisitionStatus) {
                throw new Error('Missing acquisitionStatus in payload')
              }
              acqStatus = parsedPayload.acquisitionStatus
              fallbackReason = parsedPayload.fallbackReason
              if (parsedPayload.fallbackSource) fallbackSource = parsedPayload.fallbackSource
              if (parsedPayload.sourceSha256) sourceSha256 = parsedPayload.sourceSha256
              if (parsedPayload.byteCount !== undefined) byteCount = parsedPayload.byteCount
              if (parsedPayload.resolvedUrl) resolvedUrl = parsedPayload.resolvedUrl
              if (parsedPayload.retrievedAt) retrievedAt = parsedPayload.retrievedAt
              if (parsedPayload.error) errorMsg = parsedPayload.error

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
              errorMsg = `INVALID_ACQUISITION_RESULT: Malformed JSON: ${err.message}`
              fallbackReason = 'Malformed result JSON'
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
            provenance: {
              runId,
              traditionId: plan.traditionId,
              endpointId: plan.endpointId,
              sourceUrl: targetUrl,
              resolvedLocation: resolvedUrl,
              retrievedAt,
              sourceSha256
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
            required: plan.required ?? false,
            allowFallback: plan.allowFallback ?? this.defaultAllowFallback,
            allowCache: plan.allowCache ?? false,
            durationMs: Date.now() - started,
            error: err.message,
            requestedUrl: targetUrl,
            retrievedAt: new Date().toISOString()
          })
        })
      })
    }

    // 2. Adapter acquisition mode
    if (plan.mode === 'adapter' && plan.adapterId) {
      try {
        const adapter = this.adapterRegistry.resolve(plan.adapterId)
        const acq = await adapter.acquire(plan.endpoint, {
          endpoint: plan.endpoint,
          traditionId: plan.traditionId,
          allowNetwork: plan.allowRemote ?? true
        })

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
    const { plans, version } = await planner.buildPlan()

    const activePlans = (options.plans || plans).filter(p => p.enabled && p.status === 'READY')
    const results: UpstreamJobResult[] = []

    // Parallel bounded concurrency worker pool
    const queue = [...activePlans]
    const workers = Array.from({ length: Math.min(this.concurrency, queue.length || 1) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift()
        if (!item) break
        const result = await this.runJob(item, runId)
        results.push(result)
      }
    })

    await Promise.all(workers)

    // Add skipped/disabled/unmapped items
    for (const plan of plans) {
      if (!results.some(r => r.id === plan.id)) {
        const acqStatus: UpstreamAcquisitionStatus = plan.status === 'DISABLED' ? 'REMOTE_NOT_MODIFIED' : 'UNSUPPORTED'
        results.push({
          id: plan.id,
          traditionId: plan.traditionId,
          endpointId: plan.endpointId,
          mode: plan.mode,
          executionStatus: 'PROCESS_SUCCEEDED',
          status: plan.status === 'DISABLED' ? 'not_modified' : 'unsupported',
          acquisitionStatus: acqStatus,
          required: plan.required ?? false,
          allowFallback: plan.allowFallback ?? this.defaultAllowFallback,
          allowCache: plan.allowCache ?? false,
          durationMs: 0,
          requestedUrl: plan.endpoint.url || plan.endpoint.baseUrl || plan.endpoint.repoUrl,
          retrievedAt: new Date().toISOString()
        })
      }
    }

    const completedAt = new Date().toISOString()
    const manifest = buildRunManifest({
      runId,
      startedAt,
      completedAt,
      registryVersion: options.registryVersion || version,
      workers: this.concurrency,
      defaultAllowFallback: this.defaultAllowFallback,
      jobs: results
    })

    const manifestPath = await writeRunManifest(manifest, path.join(this.rootDir, 'dist'))

    // Strict Evaluation Gate:
    const failureReasons: string[] = []

    for (const job of results) {
      // 1. Required job failed
      if (job.required && (job.status === 'failed' || job.acquisitionStatus === 'REMOTE_FAILED')) {
        failureReasons.push(`Required job '${job.id}' failed: ${job.error || 'Remote acquisition failure'}`)
      }
      // 2. Required job fell back
      if (job.required && (job.status === 'fallback' || job.acquisitionStatus === 'LOCAL_FALLBACK')) {
        failureReasons.push(`Required job '${job.id}' fell back to local data. Required jobs must be REMOTE_SYNCED or REMOTE_NOT_MODIFIED.`)
      }
      // 3. Unexpected fallback (fallback occurred when allowFallback is false)
      if (job.acquisitionStatus === 'LOCAL_FALLBACK' && !job.allowFallback) {
        failureReasons.push(`Unexpected fallback in job '${job.id}' (allowFallback=false).`)
      }
      // 4. Unsupported required endpoint
      if (job.required && (job.status === 'unsupported' || job.acquisitionStatus === 'UNSUPPORTED')) {
        failureReasons.push(`Required endpoint '${job.id}' is unsupported by the executor graph.`)
      }
      // 5. Unexpected cache hit when allowCache is false
      if (job.acquisitionStatus === 'LOCAL_CACHE' && !job.allowCache && job.required) {
        failureReasons.push(`Unexpected local cache hit for required job '${job.id}' (allowCache=false).`)
      }
    }

    const hasFailures = failureReasons.length > 0

    return { manifest, manifestPath, hasFailures, failureReasons }
  }
}
