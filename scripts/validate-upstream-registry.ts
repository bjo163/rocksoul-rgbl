import { readFile } from 'node:fs/promises'
import path from 'node:path'

interface Endpoint {
  id?: unknown
  type?: unknown
  baseUrl?: unknown
  repoUrl?: unknown
  url?: unknown
  license?: unknown
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

const registryPath = path.join(process.cwd(), 'config/upstream-registry.json')

function fail(message: string): never {
  throw new Error(`[registry] ${message}`)
}

async function main() {
  const raw = await readFile(registryPath, 'utf8')
  let registry: Registry

  try {
    registry = JSON.parse(raw) as Registry
  } catch (error) {
    fail(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (!registry.version) fail('Missing top-level version')
  if (!registry.title) fail('Missing top-level title')
  if (!registry.traditions || typeof registry.traditions !== 'object') fail('Missing traditions object')

  const ids = new Set<string>()
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
      else if (ids.has(id)) problems.push(`duplicate endpoint id: ${id}`)
      else ids.add(id)

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
    }
  }

  console.log(JSON.stringify({
    valid: problems.length === 0,
    registryPath,
    registryVersion: registry.version,
    traditions: Object.keys(registry.traditions ?? {}).length,
    endpoints: endpointCount,
    uniqueEndpointIds: ids.size,
    problems
  }, null, 2))

  if (problems.length > 0) process.exitCode = 1
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
