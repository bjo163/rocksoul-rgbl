import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import type {
  UpstreamAdapter,
  UpstreamAdapterContext,
  UpstreamAcquisitionResult,
  UpstreamEndpoint
} from './types.js'

export class UpstreamAdapterRegistry {
  private readonly adapters = new Map<string, UpstreamAdapter>()

  register(adapter: UpstreamAdapter): this {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Duplicate upstream adapter: ${adapter.id}`)
    }
    this.adapters.set(adapter.id, adapter)
    return this
  }

  resolve(id: string): UpstreamAdapter {
    const adapter = this.adapters.get(id)
    if (!adapter) {
      throw new Error(`Unknown upstream adapter: ${id}`)
    }
    return adapter
  }

  findForEndpoint(endpoint: UpstreamEndpoint): UpstreamAdapter | null {
    for (const adapter of this.adapters.values()) {
      if (adapter.supports(endpoint)) {
        return adapter
      }
    }
    return null
  }

  has(id: string): boolean {
    return this.adapters.has(id)
  }

  ids(): string[] {
    return [...this.adapters.keys()].sort()
  }
}

// 1. Generic HTTP JSON Adapter
export const httpJsonAdapter: UpstreamAdapter = {
  id: 'http-json',
  kind: 'rest_api',
  supports: (ep) => ep.type === 'rest_api' || Boolean(ep.baseUrl || ep.url),
  async acquire(endpoint, context): Promise<UpstreamAcquisitionResult> {
    const targetUrl = endpoint.baseUrl || endpoint.url
    if (!targetUrl) throw new Error(`Endpoint ${endpoint.id} has no baseUrl or url`)

    const fetchImpl = context.fetchImpl ?? fetch
    const res = await fetchImpl(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MoonWitness-Corpus/1.0'
      }
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${targetUrl}`)
    }

    const bytes = new Uint8Array(await res.arrayBuffer())
    const sourceSha256 = createHash('sha256').update(bytes).digest('hex')

    return {
      bytes,
      status: 'REMOTE_SYNCED',
      sourceUrl: targetUrl,
      resolvedLocation: res.url || targetUrl,
      retrievedAt: new Date().toISOString(),
      sourceSha256,
      byteSize: bytes.byteLength,
      etag: res.headers.get('etag') || undefined,
      lastModified: res.headers.get('last-modified') || undefined
    }
  },
  async parse(bytes) {
    const text = new TextDecoder().decode(bytes)
    return JSON.parse(text)
  }
}

// 2. Generic Raw Text Adapter
export const rawTextAdapter: UpstreamAdapter = {
  id: 'raw-text',
  kind: 'file_download',
  supports: (ep) => ep.type === 'file_download' || ep.type === 'raw_archive' || ep.type === 'open_data_archive',
  async acquire(endpoint, context): Promise<UpstreamAcquisitionResult> {
    const targetUrl = endpoint.url || endpoint.baseUrl
    if (!targetUrl) throw new Error(`Endpoint ${endpoint.id} has no url`)

    const fetchImpl = context.fetchImpl ?? fetch
    const res = await fetchImpl(targetUrl, {
      headers: { 'User-Agent': 'MoonWitness-Corpus/1.0' }
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${targetUrl}`)
    }

    const bytes = new Uint8Array(await res.arrayBuffer())
    const sourceSha256 = createHash('sha256').update(bytes).digest('hex')

    return {
      bytes,
      status: 'REMOTE_SYNCED',
      sourceUrl: targetUrl,
      resolvedLocation: res.url || targetUrl,
      retrievedAt: new Date().toISOString(),
      sourceSha256,
      byteSize: bytes.byteLength,
      etag: res.headers.get('etag') || undefined,
      lastModified: res.headers.get('last-modified') || undefined
    }
  },
  async parse(bytes) {
    return new TextDecoder().decode(bytes)
  }
}

// 3. Verifiable Git Repository Adapter
export const gitAdapter: UpstreamAdapter = {
  id: 'git-repository',
  kind: 'git_repository',
  supports: (ep) => ep.type === 'git_repository' || ep.type === 'git_repo' || Boolean(ep.repoUrl),
  async acquire(endpoint): Promise<UpstreamAcquisitionResult> {
    const repoUrl = endpoint.repoUrl || endpoint.url
    if (!repoUrl) throw new Error(`Git endpoint ${endpoint.id} missing repoUrl`)

    let headCommit: string
    try {
      const output = execFileSync('git', ['ls-remote', repoUrl, 'HEAD'], {
        encoding: 'utf8',
        timeout: 20000,
        stdio: ['ignore', 'pipe', 'pipe']
      })
      const match = output.match(/^([0-9a-fA-F]{40})\s+HEAD/m)
      if (!match) throw new Error(`Could not parse HEAD commit from remote git repository`)
      headCommit = match[1]
    } catch (err: any) {
      throw new Error(`Git remote verification failed for ${repoUrl}: ${err.stderr?.toString().trim() || err.message}`)
    }

    const payload = new TextEncoder().encode(JSON.stringify({ repoUrl, headCommit, verifiedAt: new Date().toISOString() }))

    return {
      bytes: payload,
      status: 'REMOTE_SYNCED',
      sourceUrl: repoUrl,
      resolvedLocation: repoUrl,
      retrievedAt: new Date().toISOString(),
      sourceSha256: headCommit,
      byteSize: payload.byteLength
    }
  }
}

export const defaultUpstreamAdapterRegistry = new UpstreamAdapterRegistry()
  .register(httpJsonAdapter)
  .register(rawTextAdapter)
  .register(gitAdapter)
