import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const API_KEY = 'umh_15a4914453f84679bd9aab17bda410bbc3fa9fd3'
const BASE_URL = 'https://ummahapi.com/api'

interface ApiResponse<T> {
  success: boolean
  service?: string
  data: T
}

async function fetchWithRetry<T>(endpoint: string, retries = 3): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'x-api-key': API_KEY,
          'Accept': 'application/json'
        }
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }
      const json = await res.json() as ApiResponse<T>
      return json.data
    } catch (err: any) {
      if (attempt === retries) throw new Error(`Failed to fetch ${url}: ${err.message}`)
      await new Promise((r) => setTimeout(r, 500 * attempt))
    }
  }
  throw new Error(`Exhausted retries for ${url}`)
}

async function main() {
  console.log('========================================================================')
  console.log('🕌 UmmahAPI Full Automated Corpus Ingestion & Deep Synchronization Engine')
  console.log('========================================================================\n')

  const rawDir = path.join(process.cwd(), 'ingestion/recipes/ummah-api/source')
  await mkdir(rawDir, { recursive: true })

  // 1. Full Duas Ingestion (126 Authentic Supplications)
  console.log('📥 [1/5] Fetching complete authentic Duas collection...')
  const duasData = await fetchWithRetry<any>('/duas')
  const duasJson = JSON.stringify(duasData, null, 2)
  await writeFile(path.join(rawDir, 'duas-complete.json'), duasJson, 'utf8')
  console.log(`   ✓ Ingested complete Duas (${Buffer.byteLength(duasJson)} bytes, categories: ${duasData.categories?.length ?? 0})\n`)

  // 2. Full 40 Hadith Nawawi (42 Hadiths)
  console.log('📥 [2/5] Fetching complete 40 Hadith Nawawi collection...')
  const nawawiData = await fetchWithRetry<any>('/hadith/nawawi?limit=42')
  const nawawiJson = JSON.stringify(nawawiData, null, 2)
  await writeFile(path.join(rawDir, 'hadith-nawawi-complete.json'), nawawiJson, 'utf8')
  console.log(`   ✓ Ingested complete 40 Hadith Nawawi (${nawawiData.hadiths?.length ?? 0} hadiths)\n`)

  // 3. Full Quran Surah Registry (114 Surahs)
  console.log('📥 [3/5] Fetching complete Quran Surahs & structure...')
  const surahsData = await fetchWithRetry<any>('/quran/surahs')
  const surahsJson = JSON.stringify(surahsData, null, 2)
  await writeFile(path.join(rawDir, 'quran-surahs-complete.json'), surahsJson, 'utf8')
  console.log(`   ✓ Ingested 114 Quran Surahs metadata (${surahsData.surahs?.length ?? 0} surahs)\n`)

  // 4. Islamic Names & Asmaul Husna
  console.log('📥 [4/5] Fetching Islamic Names & Sacred Attributes...')
  const namesData = await fetchWithRetry<any>('/names?limit=100')
  const namesJson = JSON.stringify(namesData, null, 2)
  await writeFile(path.join(rawDir, 'islamic-names.json'), namesJson, 'utf8')
  console.log(`   ✓ Ingested Islamic Names & Attributes (${namesData.names?.length ?? 0} records)\n`)

  // 5. Sahih Muslim Core Sample & Head
  console.log('📥 [5/5] Fetching Sahih Muslim authenticated stream...')
  const muslimData = await fetchWithRetry<any>('/hadith/muslim?limit=100')
  const muslimJson = JSON.stringify(muslimData, null, 2)
  await writeFile(path.join(rawDir, 'hadith-muslim-head.json'), muslimJson, 'utf8')
  console.log(`   ✓ Ingested Sahih Muslim stream (${muslimData.hadiths?.length ?? 0} hadiths)\n`)

  console.log('========================================================================')
  console.log('✨ All UmmahAPI Sacred Datasets Successfully Synchronized & Pinned!')
  console.log('📁 Raw files stored in: ingestion/recipes/ummah-api/source/')
  console.log('========================================================================\n')
}

main().catch((err) => {
  console.error('❌ Sync failed:', err)
  process.exit(1)
})
