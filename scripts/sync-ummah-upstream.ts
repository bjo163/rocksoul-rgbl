import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'

const API_KEY = 'umh_15a4914453f84679bd9aab17bda410bbc3fa9fd3'
const BASE_URL = 'https://ummahapi.com/api'

export interface HadithRecord {
  id: string
  collection: string
  collection_name: string
  hadithnumber: number
  arabic: string
  english: string
  grade?: string
}

export interface HadithApiResponse {
  success: boolean
  service: string
  data: {
    collection: string
    collection_name: string
    page: number
    limit: number
    total: number
    total_pages: number
    hadiths: HadithRecord[]
  }
}

export const ISLAMIC_COLLECTIONS = [
  { id: 'nawawi', name: "Nawawi's 40 Hadith", targetDataset: 'hadith-nawawi-40', total: 42, defaultBatch: 42 },
  { id: 'qudsi', name: '40 Hadith Qudsi', targetDataset: 'hadith-qudsi-40', total: 40, defaultBatch: 40 },
  { id: 'muslim', name: 'Sahih Muslim', targetDataset: 'hadith-muslim', total: 7360, defaultBatch: 100 },
  { id: 'bukhari', name: 'Sahih al-Bukhari', targetDataset: 'hadith-bukhari', total: 7580, defaultBatch: 100 },
  { id: 'abudawud', name: 'Sunan Abu Dawud', targetDataset: 'hadith-abudawud', total: 5272, defaultBatch: 100 },
  { id: 'tirmidhi', name: 'Jami at-Tirmidhi', targetDataset: 'hadith-tirmidhi', total: 3926, defaultBatch: 100 },
  { id: 'nasai', name: "Sunan an-Nasa'i", targetDataset: 'hadith-nasai', total: 5679, defaultBatch: 100 },
  { id: 'ibnmajah', name: 'Sunan Ibn Majah', targetDataset: 'hadith-ibnmajah', total: 4340, defaultBatch: 100 },
  { id: 'malik', name: 'Muwatta Malik', targetDataset: 'hadith-malik', total: 1829, defaultBatch: 100 }
]

export async function fetchHadithPage(collection: string, page: number, limit = 50): Promise<{ data: HadithApiResponse; rawText: string; bytes: number }> {
  const url = `${BASE_URL}/hadith/${collection}?page=${page}&limit=${limit}`
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'x-api-key': API_KEY,
          'Accept': 'application/json',
          'User-Agent': 'MoonWitness-Corpus/1.0'
        }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const rawText = await res.text()
      const data = JSON.parse(rawText) as HadithApiResponse
      return { data, rawText, bytes: Buffer.byteLength(rawText) }
    } catch (err: any) {
      if (attempt === 3) throw err
      await new Promise(r => setTimeout(r, 1000 * attempt))
    }
  }
  throw new Error(`Failed to fetch ${url}`)
}

export async function syncCollectionRaw(
  collectionId: string,
  maxHadiths?: number,
  onBytes?: (bytes: number, rawText: string) => void
): Promise<number> {
  const targetDir = path.join(process.cwd(), `ingestion/recipes/ummah-api/source/hadith/${collectionId}`)
  await mkdir(targetDir, { recursive: true })

  console.log(`\n📥 Synchronizing [${collectionId}] from UmmahAPI...`)
  let page = 1
  let fetchedCount = 0
  const limit = 50

  while (true) {
    const filePath = path.join(targetDir, `page_${String(page).padStart(4, '0')}.json`)
    let pageData: HadithApiResponse

    if (existsSync(filePath)) {
      const rawText = await readFile(filePath, 'utf8')
      pageData = JSON.parse(rawText)
      onBytes?.(Buffer.byteLength(rawText), rawText)
    } else {
      const { data, rawText, bytes } = await fetchHadithPage(collectionId, page, limit)
      pageData = data
      await writeFile(filePath, rawText, 'utf8')
      onBytes?.(bytes, rawText)
      // Gentle pacing for API stability
      await new Promise(r => setTimeout(r, 150))
    }

    const count = pageData.data?.hadiths?.length || 0
    fetchedCount += count
    process.stdout.write(`\r   -> Page ${page}/${pageData.data?.total_pages || '?'}: ${fetchedCount} hadiths saved`)

    if (count === 0 || page >= (pageData.data?.total_pages || 1)) break
    if (maxHadiths && fetchedCount >= maxHadiths) break
    page++
  }

  console.log(`\n✓ [${collectionId}] Raw upstream synchronization complete (${fetchedCount} hadiths).`)
  return fetchedCount
}

async function main() {
  console.log('========================================================================')
  console.log('🕌 UmmahAPI Universal Islamic Hadith & Sacred Text Upstream Pipeline')
  console.log('========================================================================')

  const target = process.argv[2] || 'core' // 'core' (Nawawi, Qudsi, Bukhari head, Muslim head, Duas) or 'all'
  let totalBytes = 0
  const aggregateHash = createHash('sha256')

  const onBytes = (bytes: number, text: string) => {
    totalBytes += bytes
    aggregateHash.update(text)
  }

  // 1. Sync Duas
  const duasDir = path.join(process.cwd(), 'ingestion/recipes/ummah-api/source/duas')
  await mkdir(duasDir, { recursive: true })
  console.log('\n📥 Synchronizing Authentic Duas...')
  const duasRes = await fetch(`${BASE_URL}/duas`, {
    headers: { 'x-api-key': API_KEY, 'Accept': 'application/json', 'User-Agent': 'MoonWitness-Corpus/1.0' }
  })
  if (duasRes.ok) {
    const rawText = await duasRes.text()
    const duasData = JSON.parse(rawText)
    await writeFile(path.join(duasDir, 'duas-canonical.json'), JSON.stringify(duasData, null, 2), 'utf8')
    onBytes(Buffer.byteLength(rawText), rawText)
    console.log(`✓ Duas synchronized (${duasData.data?.total || 0} prayers).`)
  }

  // 2. Sync Hadith Collections
  if (target === 'all') {
    for (const c of ISLAMIC_COLLECTIONS) {
      await syncCollectionRaw(c.id, undefined, onBytes)
    }
  } else {
    await syncCollectionRaw('nawawi', 42, onBytes)
    await syncCollectionRaw('qudsi', 40, onBytes)
    await syncCollectionRaw('bukhari', 100, onBytes)
    await syncCollectionRaw('muslim', 100, onBytes)
  }

  const finalSha256 = aggregateHash.digest('hex')

  console.log('\n========================================================================')
  console.log('✨ Upstream Resources Successfully Structured and Synced!')
  console.log('========================================================================\n')

  console.log(`MOONWITNESS_RESULT:${JSON.stringify({
    schemaVersion: '1.0',
    executionStatus: 'PROCESS_SUCCEEDED',
    acquisitionStatus: 'REMOTE_SYNCED',
    requestedUrl: BASE_URL,
    resolvedUrl: BASE_URL,
    retrievedAt: new Date().toISOString(),
    sourceSha256: finalSha256,
    byteCount: totalBytes
  })}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
