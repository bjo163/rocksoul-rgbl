import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

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
  const rawRegistry = await readFile(registryPath, 'utf8')
  let registry: Registry

  try {
    registry = JSON.parse(rawRegistry) as Registry
  } catch (error) {
    fail(`Invalid JSON in upstream-registry.json: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (!registry.version) fail('Missing top-level version in upstream-registry.json')
  if (!registry.title) fail('Missing top-level title in upstream-registry.json')
  if (!registry.traditions || typeof registry.traditions !== 'object') fail('Missing traditions object in upstream-registry.json')

  const endpointIds = new Set<string>()
  const problems: string[] = []
  let endpointCount = 0

  for (const [traditionId, tradition] of Object.entries(registry.traditions)) {
    if (!tradition.name) problems.push(`${traditionId}: missing name`)
    if (!tradition.primaryLanguage) problems.push(`${traditionId}: missing primaryLanguage`)
    if (!Array.isArray(tradition.scripts) || tradition.scripts.length === 0) {
      problems.push(`${traditionId}: scripts must be a non-empty array`)
    }
    if (!Array.isArray(tradition.endpoints)) {
      problems.push(`${traditionId}: endpoints must be an array`)
      continue
    }

    for (const endpoint of tradition.endpoints as Endpoint[]) {
      endpointCount++
      const id = typeof endpoint.id === 'string' ? endpoint.id : ''

      if (!id) problems.push(`${traditionId}: endpoint missing id`)
      else if (endpointIds.has(id)) problems.push(`duplicate endpoint id: ${id}`)
      else endpointIds.add(id)

      const type = typeof endpoint.type === 'string' ? endpoint.type : ''
      const hasUrl = [endpoint.baseUrl, endpoint.repoUrl, endpoint.url]
        .some(value => typeof value === 'string' && value.length > 0)

      if (!hasUrl) problems.push(`${traditionId}/${id || '<unknown>'}: endpoint has no URL`)
      if (!type) problems.push(`${traditionId}/${id || '<unknown>'}: endpoint missing type`)
      if (!endpoint.license) problems.push(`${traditionId}/${id || '<unknown>'}: endpoint missing license`)

      if (type === 'rest_api' && !endpoint.baseUrl) problems.push(`${traditionId}/${id}: rest_api requires baseUrl`)
      if (type === 'git_repo' && !endpoint.repoUrl) problems.push(`${traditionId}/${id}: git_repo requires repoUrl`)
      if (type === 'raw_archive' && !(endpoint.url || endpoint.baseUrl)) {
        problems.push(`${traditionId}/${id}: raw_archive requires url or baseUrl`)
      }

      if (endpoint.allowFallback !== undefined && typeof endpoint.allowFallback !== 'boolean') {
        problems.push(`${traditionId}/${id}: allowFallback must be boolean`)
      }
      if (endpoint.allowRemote !== undefined && typeof endpoint.allowRemote !== 'boolean') {
        problems.push(`${traditionId}/${id}: allowRemote must be boolean`)
      }
      if (endpoint.allowCache !== undefined && typeof endpoint.allowCache !== 'boolean') {
        problems.push(`${traditionId}/${id}: allowCache must be boolean`)
      }
      if (endpoint.required !== undefined && typeof endpoint.required !== 'boolean') {
        problems.push(`${traditionId}/${id}: required must be boolean`)
      }
    }
  }

  // 2. Validate upstream-executors.json if present
  let jobCount = 0
  if (existsSync(executorsPath)) {
    const rawExecutors = await readFile(executorsPath, 'utf8')
    let executors: ExecutorRegistry

    try {
      executors = JSON.parse(rawExecutors) as ExecutorRegistry
    } catch (error) {
      fail(`Invalid JSON in upstream-executors.json: ${error instanceof Error ? error.message : String(error)}`)
    }

    if (!executors.version) problems.push('upstream-executors.json: missing version')
    if (!Array.isArray(executors.jobs)) problems.push('upstream-executors.json: jobs must be an array')
    else {
      jobCount = executors.jobs.length
      const jobIds = new Set<string>()

      for (const job of executors.jobs) {
        const jobId = typeof job.id === 'string' ? job.id : ''
        if (!jobId) problems.push('executor job missing id')
        else if (jobIds.has(jobId)) problems.push(`duplicate executor job id: ${jobId}`)
        else jobIds.add(jobId)

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

        if (job.allowFallback !== undefined && typeof job.allowFallback !== 'boolean') {
          problems.push(`job ${jobId}: allowFallback must be boolean`)
        }
        if (job.allowRemote !== undefined && typeof job.allowRemote !== 'boolean') {
          problems.push(`job ${jobId}: allowRemote must be boolean`)
        }
        if (job.allowCache !== undefined && typeof job.allowCache !== 'boolean') {
          problems.push(`job ${jobId}: allowCache must be boolean`)
        }
        if (job.required !== undefined && typeof job.required !== 'boolean') {
          problems.push(`job ${jobId}: required must be boolean`)
        }
      }
    }
  }

  console.log(JSON.stringify({
    valid: problems.length === 0,
    registryPath,
    registryVersion: registry.version,
    traditions: Object.keys(registry.traditions ?? {}).length,
    endpoints: endpointCount,
    uniqueEndpointIds: endpointIds.size,
    executorJobs: jobCount,
    problems
  }, null, 2))

  if (problems.length > 0) process.exitCode = 1
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
