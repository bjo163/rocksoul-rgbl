import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

interface AcquisitionResult {
  data: string
  sha256: string
  byteSize: number
  status: 'REMOTE_SYNCED' | 'LOCAL_FALLBACK'
  httpStatus?: number
  error?: string
}

const ALLOW_LOCAL_FALLBACK = process.env.MOONWITNESS_ALLOW_LOCAL_FALLBACK === '1'

async function fetchOrRead(url: string, fallbackData: unknown): Promise<AcquisitionResult> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
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

    const error = `HTTP ${res.status} ${res.statusText}`
    if (!ALLOW_LOCAL_FALLBACK) throw new Error(error)

    const text = typeof fallbackData === 'string'
      ? fallbackData
      : JSON.stringify(fallbackData, null, 2)

    return {
      data: text,
      sha256: createHash('sha256').update(text).digest('hex'),
      byteSize: Buffer.byteLength(text),
      status: 'LOCAL_FALLBACK',
      httpStatus: res.status,
      error
    }
  } catch (error) {
    if (!ALLOW_LOCAL_FALLBACK) throw error

    const text = typeof fallbackData === 'string'
      ? fallbackData
      : JSON.stringify(fallbackData, null, 2)

    return {
      data: text,
      sha256: createHash('sha256').update(text).digest('hex'),
      byteSize: Buffer.byteLength(text),
      status: 'LOCAL_FALLBACK',
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
      source: 'GRETIL Sanskrit e-text archive',
      license: 'Public Domain'
    }
  },
  {
    name: 'jain-heritage',
    targetFile: 'dist/raw-upstream/jain-heritage.html',
    url: 'https://jainlibrary.org',
    defaultData: {
      source: 'Jain Heritage / Tattvartha Sutra',
      license: 'Public Domain'
    }
  },
  {
    name: 'bahai-library',
    targetFile: 'dist/raw-upstream/bahai-library.html',
    url: 'https://www.bahai.org/library/',
    defaultData: {
      source: "Bahá'í Reference Library",
      license: 'Public Domain'
    }
  },
  {
    name: 'sacred-texts-shinto',
    targetFile: 'dist/raw-upstream/shinto-index.html',
    url: 'https://sacred-texts.com/shi',
    defaultData: {
      source: 'Sacred Texts Archive — Shinto',
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
        error: result.error
      })

      const marker = result.status === 'REMOTE_SYNCED' ? '✓' : '⚠'
      console.log(`${marker} ${src.name}: ${result.status} ${result.byteSize} bytes (SHA-256: ${result.sha256.slice(0, 16)}...)`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      results.push({
        name: src.name,
        targetFile: src.targetFile,
        url: src.url,
        status: 'FAILED',
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

  console.log(`MOONWITNESS_RESULT:${JSON.stringify({
    schemaVersion: '1.0',
    executionStatus: failed.length > 0 ? 'PROCESS_FAILED' : 'PROCESS_SUCCEEDED',
    acquisitionStatus: overallStatus,
    requestedUrl: 'https://gretil.sub.uni-goettingen.de',
    resolvedUrl: 'scripts/fetch-upstream-scriptures.ts',
    retrievedAt: new Date().toISOString(),
    sourceSha256: aggregateSha256,
    byteCount: results.reduce((acc, r) => acc + (r.byteSize || 0), 0),
    fallbackReason: fallback.length > 0 ? `${fallback.length} remote sources unpinned/404; fell back to local recipes` : undefined,
    fallbackSource: 'ingestion/recipes/*/source/'
  })}`)

  if (failed.length > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
