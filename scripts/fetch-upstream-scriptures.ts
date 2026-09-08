import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import type { UpstreamFailureClass, UpstreamScriptPayload } from '../packages/ingestion/src/upstream/types.js'

interface AcquisitionResult {
  data: string
  sha256: string
  byteSize: number
  status: 'REMOTE_SYNCED' | 'LOCAL_FALLBACK'
  httpStatus?: number
  failureClass?: UpstreamFailureClass
  error?: string
}

const ALLOW_LOCAL_FALLBACK = process.env.MOONWITNESS_ALLOW_LOCAL_FALLBACK === '1'

async function fetchOrRead(url: string, fallbackData: unknown): Promise<AcquisitionResult> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(30000)
    })

    const rawText = await res.text()

    if (res.ok) {
      return {
        data: rawText,
        sha256: createHash('sha256').update(rawText).digest('hex'),
        byteSize: Buffer.byteLength(rawText),
        status: 'REMOTE_SYNCED',
        httpStatus: res.status
      }
    }

    let failureClass: UpstreamFailureClass = 'REMOTE_NETWORK_ERROR'
    if (res.status === 403) failureClass = 'REMOTE_FORBIDDEN'
    else if (res.status === 404) failureClass = 'REMOTE_NOT_FOUND'
    else if (res.status === 429) failureClass = 'REMOTE_RATE_LIMITED'

    const error = `HTTP ${res.status} ${res.statusText}`
    if (!ALLOW_LOCAL_FALLBACK) {
      const err = new Error(error) as any
      err.failureClass = failureClass
      throw err
    }

    const text = typeof fallbackData === 'string'
      ? fallbackData
      : JSON.stringify(fallbackData, null, 2)

    return {
      data: text,
      sha256: createHash('sha256').update(text).digest('hex'),
      byteSize: Buffer.byteLength(text),
      status: 'LOCAL_FALLBACK',
      httpStatus: res.status,
      failureClass,
      error
    }
  } catch (error: any) {
    if (!ALLOW_LOCAL_FALLBACK) throw error

    const text = typeof fallbackData === 'string'
      ? fallbackData
      : JSON.stringify(fallbackData, null, 2)

    return {
      data: text,
      sha256: createHash('sha256').update(text).digest('hex'),
      byteSize: Buffer.byteLength(text),
      status: 'LOCAL_FALLBACK',
      failureClass: error?.failureClass || 'REMOTE_NETWORK_ERROR',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

const UPSTREAM_SOURCES = [
  {
    name: 'gretil-vedic',
    targetFile: 'dist/raw-upstream/gretil-index.html',
    url: 'https://gretil.sub.uni-goettingen.de/gretil.html',
    defaultData: {
      source: 'GRETIL Sanskrit e-text archive catalog',
      license: 'Public Domain'
    }
  },
  {
    name: 'jain-heritage',
    targetFile: 'dist/raw-upstream/jain-heritage.html',
    url: 'https://jainlibrary.org',
    defaultData: {
      source: 'Jain Heritage / Tattvartha Sutra Digital Library',
      license: 'Public Domain'
    }
  },
  {
    name: 'bahai-library',
    targetFile: 'dist/raw-upstream/bahai-library.html',
    url: 'https://www.bahai.org/library/authoritative-texts/bahaullah/hidden-words/',
    defaultData: {
      source: "Bahá'í Reference Library Official Publication",
      license: 'Public Domain'
    }
  },
  {
    name: 'sacred-texts-shinto',
    targetFile: 'dist/raw-upstream/shinto-index.html',
    url: 'https://sacred-texts.com/shi',
    defaultData: {
      source: 'Sacred Texts Archive — Shinto (Archival Mirror)',
      license: 'Public Domain'
    }
  }
]

async function main() {
  console.log('--- Fetching Raw Upstream Sacred Texts & Data Sources ---')
  console.log(`Local fallback: ${ALLOW_LOCAL_FALLBACK ? 'ENABLED (explicit opt-in)' : 'DISABLED'}`)

  const results: Array<{
    name: string
    targetFile: string
    url: string
    status: AcquisitionResult['status'] | 'FAILED'
    sha256?: string
    byteSize?: number
    httpStatus?: number
    failureClass?: UpstreamFailureClass
    error?: string
  }> = []

  for (const src of UPSTREAM_SOURCES) {
    const fullPath = path.join(process.cwd(), src.targetFile)
    await mkdir(path.dirname(fullPath), { recursive: true })

    try {
      const result = await fetchOrRead(src.url, src.defaultData)
      if (result.status === 'REMOTE_SYNCED') {
        await writeFile(fullPath, result.data, 'utf8')
      }

      results.push({
        name: src.name,
        targetFile: src.targetFile,
        url: src.url,
        status: result.status,
        sha256: result.sha256,
        byteSize: result.byteSize,
        httpStatus: result.httpStatus,
        failureClass: result.failureClass,
        error: result.error
      })

      const marker = result.status === 'REMOTE_SYNCED' ? '✓' : '⚠'
      console.log(`${marker} ${src.name}: ${result.status} ${result.byteSize} bytes (SHA-256: ${result.sha256.slice(0, 16)}...)`)
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error)
      results.push({
        name: src.name,
        targetFile: src.targetFile,
        url: src.url,
        status: 'FAILED',
        failureClass: error?.failureClass || 'REMOTE_NETWORK_ERROR',
        error: message
      })
      console.error(`✗ ${src.name}: REMOTE_FAILED — ${message}`)
    }
  }

  const reportDir = path.join(process.cwd(), 'dist')
  await mkdir(reportDir, { recursive: true })
  await writeFile(
    path.join(reportDir, 'upstream-acquisition-manifest.json'),
    `${JSON.stringify({
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      fallbackAllowed: ALLOW_LOCAL_FALLBACK,
      results
    }, null, 2)}\n`,
    'utf8'
  )

  const failed = results.filter((result) => result.status === 'FAILED')
  const fallback = results.filter((result) => result.status === 'LOCAL_FALLBACK')

  console.log(`--- Results: ${results.length} sources, ${failed.length} failed, ${fallback.length} fallback ---`)

  const overallStatus = failed.length > 0
    ? 'REMOTE_FAILED'
    : (fallback.length > 0 ? 'LOCAL_FALLBACK' : 'REMOTE_SYNCED')

  const aggregateHash = createHash('sha256')
  for (const r of results) {
    aggregateHash.update(r.sha256 || '')
  }
  const aggregateSha256 = aggregateHash.digest('hex')

  const payload: UpstreamScriptPayload = {
    schemaVersion: '1.0',
    executionStatus: failed.length > 0 ? 'PROCESS_FAILED' : 'PROCESS_SUCCEEDED',
    acquisitionStatus: overallStatus,
    failureClass: fallback.length > 0 ? fallback[0].failureClass : undefined,
    requestedUrl: 'https://gretil.sub.uni-goettingen.de',
    resolvedUrl: 'scripts/fetch-upstream-scriptures.ts',
    retrievedAt: new Date().toISOString(),
    sourceSha256: aggregateSha256,
    byteCount: results.reduce((acc, r) => acc + (r.byteSize || 0), 0),
    fallbackReason: fallback.length > 0 ? `${fallback.length} remote sources unpinned/403; fell back to local recipes` : undefined,
    fallbackSource: 'ingestion/recipes/*/source/'
  }

  console.log(`MOONWITNESS_RESULT:${JSON.stringify(payload)}`)

  if (failed.length > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
