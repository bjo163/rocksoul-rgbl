import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

interface Endpoint {
  id: string
  name: string
  type: 'rest_api' | 'git_repo' | 'raw_archive'
  baseUrl?: string
  repoUrl?: string
  url?: string
  authType?: 'header' | 'bearer' | 'none'
  authHeader?: string
  authEnv?: string
  license: string
  collections?: Array<{ name: string; path?: string; desc: string }>
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

interface AuditResult {
  tradition: string
  endpointId: string
  endpointType: string
  url: string | null
  status: 'healthy' | 'not_found' | 'method_not_allowed' | 'unreachable' | 'unknown'
  httpStatus?: number
  latencyMs?: number
  contentType?: string | null
  error?: string
  checkedAt: string
}

async function loadRegistry(): Promise<UpstreamRegistry> {
  const file = path.join(process.cwd(), 'config/upstream-registry.json')
  return JSON.parse(await readFile(file, 'utf8')) as UpstreamRegistry
}

function endpointUrl(ep: Endpoint): string | null {
  return ep.baseUrl || ep.repoUrl || ep.url || null
}

function classifyHttp(status: number): AuditResult['status'] {
  if (status >= 200 && status < 400) return 'healthy'
  if (status === 404) return 'not_found'
  if (status === 405) return 'method_not_allowed'
  return 'unknown'
}

async function auditHttpEndpoint(ep: Endpoint, tradition: string): Promise<AuditResult> {
  const url = endpointUrl(ep)
  const checkedAt = new Date().toISOString()
  if (!url) {
    return { tradition, endpointId: ep.id, endpointType: ep.type, url: null, status: 'unknown', error: 'No URL configured', checkedAt }
  }

  const start = performance.now()
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'MoonWitness-Corpus-Upstream-Audit/1.0'
    }

    if (ep.authEnv && ep.authHeader && process.env[ep.authEnv]) {
      headers[ep.authHeader] = process.env[ep.authEnv]!
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    })

    return {
      tradition,
      endpointId: ep.id,
      endpointType: ep.type,
      url,
      status: classifyHttp(res.status),
      httpStatus: res.status,
      latencyMs: Math.round(performance.now() - start),
      contentType: res.headers.get('content-type'),
      checkedAt
    }
  } catch (err) {
    return {
      tradition,
      endpointId: ep.id,
      endpointType: ep.type,
      url,
      status: 'unreachable',
      latencyMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
      checkedAt
    }
  }
}

async function auditRepo(ep: Endpoint, tradition: string): Promise<AuditResult> {
  const url = endpointUrl(ep)
  const checkedAt = new Date().toISOString()
  if (!url) {
    return { tradition, endpointId: ep.id, endpointType: ep.type, url: null, status: 'unknown', error: 'No repository URL configured', checkedAt }
  }

  // GitHub repositories are best validated through their HTTPS URL. We intentionally
  // avoid shelling out to git here so `upstream:audit` remains portable in CI.
  const start = performance.now()
  try {
    const res = await fetch(url.replace(/\.git$/, ''), {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
        'User-Agent': 'MoonWitness-Corpus-Upstream-Audit/1.0'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    })

    return {
      tradition,
      endpointId: ep.id,
      endpointType: ep.type,
      url,
      status: classifyHttp(res.status),
      httpStatus: res.status,
      latencyMs: Math.round(performance.now() - start),
      contentType: res.headers.get('content-type'),
      checkedAt
    }
  } catch (err) {
    return {
      tradition,
      endpointId: ep.id,
      endpointType: ep.type,
      url,
      status: 'unreachable',
      latencyMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
      checkedAt
    }
  }
}

async function listCommand() {
  const reg = await loadRegistry()
  console.log('\n========================================================================================')
  console.log(`🌐 ${reg.title} (v${reg.version})`)
  console.log('========================================================================================\n')

  for (const [key, t] of Object.entries(reg.traditions)) {
    console.log(`📍 [${key.toUpperCase()}] — ${t.name}`)
    console.log(`   Language: ${t.primaryLanguage} | Scripts: ${t.scripts.join(', ')}`)
    for (const ep of t.endpoints) {
      const url = endpointUrl(ep)
      const auth = ep.authEnv ? `🔑 Auth: $${ep.authEnv}` : '🔓 Public/No Auth'
      console.log(`   • ${ep.name} [${ep.type.toUpperCase()}] (${ep.license})`)
      console.log(`     URL: ${url} | ${auth}`)
      if (ep.collections?.length) {
        console.log(`     Collections: ${ep.collections.map(c => c.name).join(', ')}`)
      }
    }
    console.log('')
  }
}

async function auditCommand() {
  const reg = await loadRegistry()
  const results: AuditResult[] = []

  console.log('\n========================================================================================')
  console.log('🔍 Deep Upstream Connectivity & Endpoint Audit')
  console.log('========================================================================================\n')

  for (const [key, t] of Object.entries(reg.traditions)) {
    console.log(`Testing [${key.toUpperCase()}] endpoints...`)
    for (const ep of t.endpoints) {
      const result = ep.type === 'rest_api' || ep.type === 'raw_archive'
        ? await auditHttpEndpoint(ep, key)
        : await auditRepo(ep, key)

      results.push(result)

      const status = result.httpStatus ? `HTTP ${result.httpStatus}` : result.status
      const latency = result.latencyMs != null ? ` ${result.latencyMs}ms` : ''
      console.log(`   ${result.status === 'healthy' ? '✓' : result.status === 'unreachable' ? '⚠' : '✗'} ${ep.id.padEnd(24)} ${status}${latency} -> ${result.url ?? 'NO URL'}`)
    }
  }

  const report = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    registryVersion: reg.version,
    totals: {
      endpoints: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      notFound: results.filter(r => r.status === 'not_found').length,
      methodNotAllowed: results.filter(r => r.status === 'method_not_allowed').length,
      unreachable: results.filter(r => r.status === 'unreachable').length,
      unknown: results.filter(r => r.status === 'unknown').length
    },
    results
  }

  const reportPath = path.join(process.cwd(), 'upstream-audit.json')
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  console.log(`\nAudit report written to ${reportPath}`)
  console.log(`Healthy: ${report.totals.healthy}/${report.totals.endpoints}`)
  console.log('Audit complete.\n')

  if (report.totals.unreachable > 0 || report.totals.notFound > 0) {
    process.exitCode = 1
  }
}

const action = process.argv[2] || 'list'

if (action === 'list') {
  listCommand().catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
} else if (action === 'audit') {
  auditCommand().catch((err) => {
    console.error('Audit failed:', err)
    process.exitCode = 1
  })
} else {
  console.log('Usage: pnpm upstream:list | pnpm upstream:audit')
  process.exitCode = 1
}
