import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { UniversalCorpusRegistry } from '@moonwitness/corpus-ingestion'

interface Endpoint {
  id?: unknown
  type?: unknown
  baseUrl?: unknown
  repoUrl?: unknown
  url?: unknown
  license?: unknown
  enabled?: unknown
  required?: unknown
  allowRemote?: unknown
  allowCache?: unknown
  allowFallback?: unknown
}

interface Tradition {
  name?: unknown
  primaryLanguage?: unknown
  scripts?: unknown
  endpoints?: unknown
}

interface Registry {
  version?: unknown
  title?: unknown
  traditions?: Record<string, Tradition>
}

interface ExecutorJob {
  id?: unknown
  name?: unknown
  enabled?: unknown
  endpointIds?: unknown
  script?: unknown
  recipeId?: unknown
  adapterId?: unknown
  required?: unknown
  allowRemote?: unknown
  allowCache?: unknown
  allowFallback?: unknown
}

interface ExecutorRegistry {
  version?: unknown
  defaults?: unknown
  jobs?: ExecutorJob[]
}

const root = process.cwd()
const registryPath = path.join(root, 'config/upstream-registry.json')
const executorsPath = path.join(root, 'config/upstream-executors.json')

function fail(message: string): never {
  throw new Error(`[registry] ${message}`)
}

async function main() {
  const problems: string[] = []

  // 1. Validate Legacy/Runtime Upstream Master Registry
  if (!existsSync(registryPath)) fail(`Missing registry at ${registryPath}`)

  const raw = await readFile(registryPath, 'utf8')
  let registry: Registry
  try {
    registry = JSON.parse(raw)
  } catch (error) {
    fail(`Invalid JSON in ${registryPath}: ${error}`)
  }

  if (typeof registry !== 'object' || registry === null) fail('Registry must be an object')
  if (typeof registry.version !== 'string') problems.push('missing version string')
  if (typeof registry.title !== 'string') problems.push('missing title string')
  if (typeof registry.traditions !== 'object' || registry.traditions === null) {
    problems.push('missing traditions object')
  }

  const endpointIds = new Set<string>()
  let endpointCount = 0

  if (registry.traditions && typeof registry.traditions === 'object') {
    for (const [traditionId, tradition] of Object.entries(registry.traditions)) {
      if (typeof tradition !== 'object' || tradition === null) {
        problems.push(`tradition ${traditionId}: must be an object`)
        continue
      }

      if (!tradition.name) problems.push(`tradition ${traditionId}: missing name`)
      if (!tradition.primaryLanguage) problems.push(`tradition ${traditionId}: missing primaryLanguage`)
      if (!Array.isArray(tradition.scripts) || tradition.scripts.length === 0) {
        problems.push(`tradition ${traditionId}: scripts must be a non-empty array`)
      }

      if (!Array.isArray(tradition.endpoints)) {
        problems.push(`tradition ${traditionId}: endpoints must be an array`)
        continue
      }

      for (const endpoint of tradition.endpoints as Endpoint[]) {
        endpointCount++
        const epId = String(endpoint.id || '')
        if (!epId) {
          problems.push(`tradition ${traditionId}: endpoint missing id`)
          continue
        }

        if (endpointIds.has(epId)) {
          problems.push(`duplicate endpoint ID: ${epId}`)
        }
        endpointIds.add(epId)

        if (!endpoint.type) problems.push(`endpoint ${epId}: missing type`)
        if (!endpoint.license) problems.push(`endpoint ${epId}: missing license`)

        const hasLocation = Boolean(endpoint.baseUrl || endpoint.repoUrl || endpoint.url)
        if (!hasLocation) {
          problems.push(`endpoint ${epId}: must define baseUrl, repoUrl, or url`)
        }

        if (endpoint.enabled !== undefined && typeof endpoint.enabled !== 'boolean') {
          problems.push(`endpoint ${epId}: enabled must be boolean`)
        }
        if (endpoint.required !== undefined && typeof endpoint.required !== 'boolean') {
          problems.push(`endpoint ${epId}: required must be boolean`)
        }
        if (endpoint.allowRemote !== undefined && typeof endpoint.allowRemote !== 'boolean') {
          problems.push(`endpoint ${epId}: allowRemote must be boolean`)
        }
        if (endpoint.allowCache !== undefined && typeof endpoint.allowCache !== 'boolean') {
          problems.push(`endpoint ${epId}: allowCache must be boolean`)
        }
        if (endpoint.allowFallback !== undefined && typeof endpoint.allowFallback !== 'boolean') {
          problems.push(`endpoint ${epId}: allowFallback must be boolean`)
        }
      }
    }
  }

  // 2. Validate Executors Registry
  let jobCount = 0
  if (existsSync(executorsPath)) {
    const rawExecutors = await readFile(executorsPath, 'utf8')
    let executors: ExecutorRegistry
    try {
      executors = JSON.parse(rawExecutors)
    } catch (error) {
      fail(`Invalid JSON in ${executorsPath}: ${error}`)
    }

    if (executors.jobs && Array.isArray(executors.jobs)) {
      const jobIds = new Set<string>()
      for (const job of executors.jobs) {
        jobCount++
        const jobId = String(job.id || '')
        if (!jobId) {
          problems.push('executor job missing id')
          continue
        }
        if (jobIds.has(jobId)) {
          problems.push(`duplicate executor job ID: ${jobId}`)
        }
        jobIds.add(jobId)

        if (!job.name) problems.push(`job ${jobId}: missing name`)
        if (!Array.isArray(job.endpointIds) || job.endpointIds.length === 0) {
          problems.push(`job ${jobId}: endpointIds must be non-empty array`)
        } else {
          for (const epId of job.endpointIds as string[]) {
            if (!endpointIds.has(epId)) {
              problems.push(`job ${jobId}: references unknown endpoint '${epId}'`)
            }
          }
        }

        if (job.script) {
          const scriptFile = path.join(root, String(job.script))
          if (!existsSync(scriptFile)) {
            problems.push(`job ${jobId}: script file not found at ${job.script}`)
          }
        }
      }
    }
  }

  // 3. Validate Normalized Universal Corpus Registry (Traditions, Works, Editions, Sources, Endpoints)
  const universal = new UniversalCorpusRegistry(path.join(root, 'config'))
  await universal.loadAll()
  const universalValidation = universal.validateRegistry()
  problems.push(...universalValidation.problems)

  // Generate dist/work-coverage.json
  await universal.writeWorkCoverageReport(path.join(root, 'dist'))

  console.log(JSON.stringify({
    valid: problems.length === 0,
    registryPath,
    registryVersion: registry.version,
    traditions: universalValidation.traditionCount,
    works: universalValidation.workCount,
    editions: universalValidation.editionCount,
    sources: universalValidation.sourceCount,
    endpoints: universalValidation.endpointCount,
    executorJobs: jobCount,
    problems
  }, null, 2))

  if (problems.length > 0) process.exitCode = 1
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
