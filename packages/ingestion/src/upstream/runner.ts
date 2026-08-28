import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import type {
  UpstreamExecutionPlan,
  UpstreamJobResult,
  UpstreamRunManifest
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
}

export class UpstreamRunner {
  private readonly rootDir: string
  private readonly concurrency: number
  private readonly timeoutMs: number
  private readonly adapterRegistry: UpstreamAdapterRegistry

  constructor(options: RunnerOptions = {}) {
    this.rootDir = options.rootDir || process.cwd()
    this.concurrency = options.concurrency || 8
    this.timeoutMs = options.timeoutMs || 900000 // 15 mins default
    this.adapterRegistry = options.adapterRegistry || defaultUpstreamAdapterRegistry
  }

  async runJob(plan: UpstreamExecutionPlan, runId: string): Promise<UpstreamJobResult> {
    const started = Date.now()

    if (plan.status !== 'READY' || !plan.enabled) {
      return {
        id: plan.id,
        traditionId: plan.traditionId,
        endpointId: plan.endpointId,
        mode: plan.mode,
        status: plan.status === 'DISABLED' ? 'not_modified' : 'unsupported',
        acquisitionStatus: 'LOCAL_CACHE',
        required: plan.required,
        durationMs: 0
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
          env: { ...process.env, RUN_ID: runId, UPSTREAM_ENDPOINT: plan.endpointId },
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
          const success = code === 0

          resolve({
            id: plan.id,
            traditionId: plan.traditionId,
            endpointId: plan.endpointId,
            mode: 'script',
            status: success ? 'succeeded' : (plan.required ? 'failed' : 'fallback'),
            acquisitionStatus: success ? 'REMOTE_SYNCED' : 'LOCAL_FALLBACK',
            required: plan.required,
            durationMs,
            error: success ? undefined : (stderr.trim() || `Process exited with code ${code}`),
            provenance: {
              runId,
              traditionId: plan.traditionId,
              endpointId: plan.endpointId,
              sourceUrl: plan.endpoint.url || plan.endpoint.baseUrl || plan.endpoint.repoUrl,
              resolvedLocation: plan.script || 'unknown',
              retrievedAt: new Date().toISOString(),
              sourceSha256: 'script-managed'
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
            status: plan.required ? 'failed' : 'fallback',
            acquisitionStatus: 'LOCAL_FALLBACK',
            required: plan.required,
            durationMs: Date.now() - started,
            error: err.message
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
          allowNetwork: true
        })

        return {
          id: plan.id,
          traditionId: plan.traditionId,
          endpointId: plan.endpointId,
          mode: 'adapter',
          status: 'succeeded',
          acquisitionStatus: acq.status,
          required: plan.required,
          durationMs: Date.now() - started,
          byteCount: acq.byteSize,
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
          status: plan.required ? 'failed' : 'fallback',
          acquisitionStatus: 'REMOTE_FAILED',
          required: plan.required,
          durationMs: Date.now() - started,
          error: err.message
        }
      }
    }

    return {
      id: plan.id,
      traditionId: plan.traditionId,
      endpointId: plan.endpointId,
      mode: plan.mode,
      status: 'succeeded',
      acquisitionStatus: 'LOCAL_CACHE',
      required: plan.required,
      durationMs: Date.now() - started
    }
  }

  async run(options: RunnerOptions = {}): Promise<{
    manifest: UpstreamRunManifest
    manifestPath: string
    hasRequiredFailures: boolean
  }> {
    const runId = randomUUID()
    const startedAt = new Date().toISOString()
    const planner = new UpstreamPlanner({ rootDir: this.rootDir })
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

    // Add skipped/disabled items
    for (const plan of plans) {
      if (!results.some(r => r.id === plan.id)) {
        results.push({
          id: plan.id,
          traditionId: plan.traditionId,
          endpointId: plan.endpointId,
          mode: plan.mode,
          status: plan.status === 'DISABLED' ? 'not_modified' : 'unsupported',
          acquisitionStatus: 'LOCAL_CACHE',
          required: plan.required,
          durationMs: 0
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
      jobs: results
    })

    const manifestPath = await writeRunManifest(manifest, path.join(this.rootDir, 'dist'))
    const hasRequiredFailures = results.some(r => r.required && r.status === 'failed')

    return { manifest, manifestPath, hasRequiredFailures }
  }
}
