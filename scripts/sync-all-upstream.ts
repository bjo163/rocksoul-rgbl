import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

interface Endpoint {
  id: string
  name: string
  type: string
  enabled?: boolean
}

interface Tradition {
  name: string
  primaryLanguage: string
  scripts: string[]
  endpoints: Endpoint[]
}

interface UpstreamRegistry {
  version: string
  title: string
  traditions: Record<string, Tradition>
}

interface ExecutorJob {
  id: string
  name: string
  enabled: boolean
  endpointIds: string[]
  script: string
  required?: boolean
}

interface ExecutorRegistry {
  version: string
  defaults?: {
    concurrency?: number
    timeoutMs?: number
  }
  jobs: ExecutorJob[]
}

interface JobResult {
  id: string
  name: string
  script: string
  status: 'succeeded' | 'failed'
  code: number | null
  durationMs: number
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T
}

async function runScript(job: ExecutorJob, timeoutMs: number): Promise<JobResult> {
  const started = Date.now()
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

  console.log(`[SYNC] ${job.name}`)
  console.log(`       ${job.script}`)

  return await new Promise<JobResult>((resolve) => {
    const child = spawn(pnpm, ['exec', 'tsx', job.script], {
      stdio: 'inherit',
      shell: false,
      env: process.env
    })

    let settled = false
    const finish = (result: JobResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      finish({
        id: job.id,
        name: job.name,
        script: job.script,
        status: 'failed',
        code: null,
        durationMs: Date.now() - started
      })
    }, timeoutMs)

    child.on('error', () => {
      clearTimeout(timer)
      finish({
        id: job.id,
        name: job.name,
        script: job.script,
        status: 'failed',
        code: null,
        durationMs: Date.now() - started
      })
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      finish({
        id: job.id,
        name: job.name,
        script: job.script,
        status: code === 0 ? 'succeeded' : 'failed',
        code,
        durationMs: Date.now() - started
      })
    })
  })
}

async function workerPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (item === undefined) return
      await worker(item)
    }
  })

  await Promise.all(workers)
}

async function main() {
  const root = process.cwd()
  const registry = await readJson<UpstreamRegistry>(path.join(root, 'config/upstream-registry.json'))
  const executors = await readJson<ExecutorRegistry>(path.join(root, 'config/upstream-executors.json'))

  const endpointIds = new Set<string>()
  const endpointOwner = new Map<string, string>()

  for (const [traditionId, tradition] of Object.entries(registry.traditions)) {
    for (const endpoint of tradition.endpoints ?? []) {
      if (endpoint.enabled === false) continue
      endpointIds.add(endpoint.id)
      endpointOwner.set(endpoint.id, traditionId)
    }
  }

  const jobs = executors.jobs.filter((job) =>
    job.enabled && job.endpointIds.some((endpointId) => endpointIds.has(endpointId))
  )

  const coveredEndpointIds = new Set(jobs.flatMap((job) => job.endpointIds))
  const unmapped = [...endpointIds].filter((id) => !coveredEndpointIds.has(id))

  console.log('========================================================================')
  console.log('🌐 MoonWitness Master Universal Upstream Synchronization Engine')
  console.log('========================================================================')
  console.log(`Registry   : v${registry.version}`)
  console.log(`Traditions : ${Object.keys(registry.traditions).length}`)
  console.log(`Endpoints  : ${endpointIds.size}`)
  console.log(`Jobs       : ${jobs.length}`)

  if (unmapped.length > 0) {
    console.warn(`⚠ Unmapped enabled endpoints (${unmapped.length}):`)
    for (const endpointId of unmapped) {
      console.warn(`  - ${endpointId} (${endpointOwner.get(endpointId) ?? 'unknown'})`)
    }
  }

  const concurrency = Math.max(1, Math.min(8, executors.defaults?.concurrency ?? 3))
  const timeoutMs = Math.max(10_000, executors.defaults?.timeoutMs ?? 900_000)
  const results: JobResult[] = []

  await workerPool(jobs, concurrency, async (job) => {
    const result = await runScript(job, timeoutMs)
    results.push(result)
  })

  results.sort((a, b) => a.id.localeCompare(b.id))

  const manifest = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    registryVersion: registry.version,
    totals: {
      traditions: Object.keys(registry.traditions).length,
      endpoints: endpointIds.size,
      jobs: jobs.length,
      succeeded: results.filter((r) => r.status === 'succeeded').length,
      failed: results.filter((r) => r.status === 'failed').length,
      unmappedEndpoints: unmapped.length
    },
    results,
    unmappedEndpoints: unmapped
  }

  const reportDir = path.join(root, 'dist')
  await mkdir(reportDir, { recursive: true })
  await writeFile(
    path.join(reportDir, 'upstream-sync-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  )

  console.log('------------------------------------------------------------------------')
  console.log(`✅ Succeeded : ${manifest.totals.succeeded}`)
  console.log(`❌ Failed    : ${manifest.totals.failed}`)
  console.log(`⚠ Unmapped  : ${manifest.totals.unmappedEndpoints}`)
  console.log(`Workers     : ${concurrency}`)
  console.log('------------------------------------------------------------------------')

  if (results.some((result) => result.status === 'failed' && jobs.find((job) => job.id === result.id)?.required === true)) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
