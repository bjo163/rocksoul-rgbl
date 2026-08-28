import { readFile } from 'node:fs/promises'
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

async function loadRegistry(): Promise<UpstreamRegistry> {
  const file = path.join(process.cwd(), 'config/upstream-registry.json')
  return JSON.parse(await readFile(file, 'utf8')) as UpstreamRegistry
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
      const url = ep.baseUrl || ep.repoUrl || ep.url
      const auth = ep.authEnv ? `🔑 Auth: $${ep.authEnv}` : '🔓 Public/No Auth'
      console.log(`   • ${ep.name} [${ep.type.toUpperCase()}] (${ep.license})`)
      console.log(`     URL: ${url} | ${auth}`)
      if (ep.collections && ep.collections.length > 0) {
        console.log(`     Collections: ${ep.collections.map(c => c.name).join(', ')}`)
      }
    }
    console.log('')
  }
}

async function auditCommand() {
  const reg = await loadRegistry()
  console.log('\n========================================================================================')
  console.log('🔍 Auditing Upstream Repository Connectivity & Health Across All 12 Traditions')
  console.log('========================================================================================\n')

  for (const [key, t] of Object.entries(reg.traditions)) {
    console.log(`Testing [${key.toUpperCase()}] endpoints...`)
    for (const ep of t.endpoints) {
      if (ep.type === 'rest_api' && ep.baseUrl) {
        const start = performance.now()
        try {
          const headers: Record<string, string> = { 'Accept': 'application/json' }
          if (ep.authEnv && ep.authHeader && process.env[ep.authEnv]) {
            headers[ep.authHeader] = process.env[ep.authEnv]!
          }
          const res = await fetch(ep.baseUrl, { headers, signal: AbortSignal.timeout(5000) })
          const latency = (performance.now() - start).toFixed(0)
          console.log(`   ✓ ${ep.id.padEnd(20)}: HTTP ${res.status} (${latency}ms) -> ${ep.baseUrl}`)
        } catch (err: any) {
          console.log(`   ⚠ ${ep.id.padEnd(20)}: ${err.message} -> ${ep.baseUrl}`)
        }
      } else {
        const url = ep.repoUrl || ep.url
        console.log(`   ℹ ${ep.id.padEnd(20)}: [${ep.type.toUpperCase()}] -> ${url}`)
      }
    }
  }
  console.log('\nAudit complete.\n')
}

const action = process.argv[2] || 'list'
if (action === 'list') {
  listCommand().catch(console.error)
} else if (action === 'audit') {
  auditCommand().catch(console.error)
} else {
  console.log('Usage: moonwitness-corpus upstream [list|audit|sync]')
}
