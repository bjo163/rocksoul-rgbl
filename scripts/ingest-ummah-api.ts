import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const API_KEY = 'umh_15a4914453f84679bd9aab17bda410bbc3fa9fd3'
const BASE_URL = 'https://ummahapi.com/api'

interface FetchResult<T> {
  data: T
  sha256: string
  byteSize: number
}

async function fetchUmmah<T>(endpoint: string): Promise<FetchResult<T>> {
  const url = `${BASE_URL}${endpoint}`
  console.log(`[UmmahAPI] Fetching ${url}...`)
  const res = await fetch(url, {
    headers: {
      'x-api-key': API_KEY,
      'Accept': 'application/json'
    }
  })

  if (!res.ok) {
    throw new Error(`UmmahAPI request failed for ${endpoint}: ${res.status} ${res.statusText}`)
  }

  const rawText = await res.text()
  const sha256 = createHash('sha256').update(rawText).digest('hex')
  const byteSize = Buffer.byteLength(rawText)
  const json = JSON.parse(rawText) as T

  return { data: json, sha256, byteSize }
}

async function main() {
  console.log('===========================================================')
  console.log('🕌 UmmahAPI Automated Sacred Data Ingestion & Seeding Engine')
  console.log('===========================================================')

  const rawSourceDir = path.join(process.cwd(), 'ingestion/recipes/ummah-api/source')
  await mkdir(rawSourceDir, { recursive: true })

  // 1. Fetch Duas
  const duasResult = await fetchUmmah<{ success: boolean; data: any }>('/duas')
  await writeFile(path.join(rawSourceDir, 'duas.json'), JSON.stringify(duasResult.data, null, 2), 'utf8')
  console.log(`✓ Ingested Authentic Duas: ${duasResult.byteSize} bytes (SHA-256: ${duasResult.sha256.slice(0, 16)}...)`)

  // 2. Fetch Quran Surahs
  const surahsResult = await fetchUmmah<{ success: boolean; data: any }>('/quran/surahs')
  await writeFile(path.join(rawSourceDir, 'quran-surahs.json'), JSON.stringify(surahsResult.data, null, 2), 'utf8')
  console.log(`✓ Ingested Quran Surahs Registry: ${surahsResult.byteSize} bytes (SHA-256: ${surahsResult.sha256.slice(0, 16)}...)`)

  // 3. Fetch Sahih Muslim Sample/Batches
  const muslimResult = await fetchUmmah<{ success: boolean; data: any }>('/hadith/muslim?limit=50')
  await writeFile(path.join(rawSourceDir, 'hadith-muslim-sample.json'), JSON.stringify(muslimResult.data, null, 2), 'utf8')
  console.log(`✓ Ingested Sahih Muslim Batch: ${muslimResult.byteSize} bytes (SHA-256: ${muslimResult.sha256.slice(0, 16)}...)`)

  // 4. Fetch Sahih Bukhari Sample/Batches
  const bukhariResult = await fetchUmmah<{ success: boolean; data: any }>('/hadith/bukhari?limit=50')
  await writeFile(path.join(rawSourceDir, 'hadith-bukhari-sample.json'), JSON.stringify(bukhariResult.data, null, 2), 'utf8')
  console.log(`✓ Ingested Sahih Bukhari Batch: ${bukhariResult.byteSize} bytes (SHA-256: ${bukhariResult.sha256.slice(0, 16)}...)`)

  // 5. Fetch Nawawi 40 Complete Collection
  const nawawiResult = await fetchUmmah<{ success: boolean; data: any }>('/hadith/nawawi?limit=42')
  await writeFile(path.join(rawSourceDir, 'hadith-nawawi.json'), JSON.stringify(nawawiResult.data, null, 2), 'utf8')
  console.log(`✓ Ingested 40 Hadith Nawawi Complete: ${nawawiResult.byteSize} bytes (SHA-256: ${nawawiResult.sha256.slice(0, 16)}...)`)

  console.log('\n===========================================================')
  console.log('✨ All UmmahAPI Raw Collections Downloaded & Verified!')
  console.log('===========================================================')
}

main().catch(console.error)
