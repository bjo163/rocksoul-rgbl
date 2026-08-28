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
        'User-Agent': 'MoonWitness-Corpus-Ingester/1.0',
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
    name: 'principal-upanishads',
    targetFile: 'ingestion/recipes/principal-upanishads/source/upanishads-sanskrit-gretil.json',
    url: 'https://raw.githubusercontent.com/gretil/gretil/master/1_sanskr/1_veda/4_upa/upa_all.json',
    defaultData: {
      source: 'GRETIL Sanskrit e-text archive',
      license: 'verify_per_item',
      editions: ['Isha', 'Kena', 'Katha', 'Mundaka', 'Mandukya']
    }
  },
  {
    name: 'sikhism-japji-sahib',
    targetFile: 'ingestion/recipes/sikhism-japji-sahib/source/japji-sahib-sggs.json',
    url: 'https://raw.githubusercontent.com/shabados/database/master/raw/japji.json',
    defaultData: {
      source: 'Sri Guru Granth Sahib / ShabadOS',
      license: 'verify_per_item'
    }
  },
  {
    name: 'jainism-tattvartha-sutra',
    targetFile: 'ingestion/recipes/jainism-tattvartha-sutra/source/tattvartha-sutra-raw.json',
    url: 'https://raw.githubusercontent.com/jain-heritage/tattvartha/master/data/tattvartha.json',
    defaultData: {
      source: 'Tattvartha Sutra',
      license: 'verify_per_item'
    }
  },
  {
    name: 'bahai-hidden-words',
    targetFile: 'ingestion/recipes/bahai-hidden-words/source/hidden-words-raw.json',
    url: 'https://raw.githubusercontent.com/bahai-open-data/writings/master/hidden-words.json',
    defaultData: {
      source: "The Hidden Words of Baha'u'llah",
      license: 'verify_per_item'
    }
  },
  {
    name: 'hadith-muslim',
    targetFile: 'ingestion/recipes/hadith-muslim/source/hadith-muslim-raw.json',
    url: 'https://raw.githubusercontent.com/Jaguar16/open-hadith-data/master/muslim/muslim.json',
    defaultData: {
      source: 'Sahih Muslim',
      license: 'verify_per_item'
    }
  },
  {
    name: 'shinto-kojiki',
    targetFile: 'ingestion/recipes/shinto-kojiki/source/kojiki-raw.json',
    url: 'https://raw.githubusercontent.com/sacred-texts/shinto/master/kojiki.json',
    defaultData: {
      source: 'Sacred Texts Archive — Kojiki',
      url: 'https://sacred-texts.com/shi/kj/index.htm',
      license: 'Public Domain / verify'
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
    requestedUrl: 'https://raw.githubusercontent.com',
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
