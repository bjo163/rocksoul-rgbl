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

export async function fetchHadithPage(collection: string, page: number, limit = 50): Promise<HadithApiResponse> {
  const url = `${BASE_URL}/hadith/${collection}?page=${page}&limit=${limit}`
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'x-api-key': API_KEY,
          'Accept': 'application/json'
        }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      return await res.json() as HadithApiResponse
    } catch (err: any) {
      if (attempt === 3) throw err
      await new Promise(r => setTimeout(r, 1000 * attempt))
    }
  }
  throw new Error(`Failed to fetch ${url}`)
}

export async function syncCollectionRaw(collectionId: string, maxHadiths?: number): Promise<number> {
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
      pageData = JSON.parse(await readFile(filePath, 'utf8'))
    } else {
      pageData = await fetchHadithPage(collectionId, page, limit)
      await writeFile(filePath, JSON.stringify(pageData, null, 2), 'utf8')
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

  // 1. Sync Duas
  const duasDir = path.join(process.cwd(), 'ingestion/recipes/ummah-api/source/duas')
  await mkdir(duasDir, { recursive: true })
  console.log('\n📥 Synchronizing Authentic Duas...')
  const duasRes = await fetch(`${BASE_URL}/duas`, { headers: { 'x-api-key': API_KEY, 'Accept': 'application/json' } })
  if (duasRes.ok) {
    const duasData = await duasRes.json()
    await writeFile(path.join(duasDir, 'duas-canonical.json'), JSON.stringify(duasData, null, 2), 'utf8')
    console.log(`✓ Duas synchronized (${duasData.data?.total || 0} prayers).`)
  }

  // 2. Sync Hadith Collections
  if (target === 'all') {
    for (const c of ISLAMIC_COLLECTIONS) {
      await syncCollectionRaw(c.id)
    }
  } else {
    // Core collections: Nawawi (complete 42), Qudsi (complete 40), Bukhari (first 100), Muslim (first 100)
    await syncCollectionRaw('nawawi', 42)
    await syncCollectionRaw('qudsi', 40)
    await syncCollectionRaw('bukhari', 100)
    await syncCollectionRaw('muslim', 100)
  }

  console.log('\n========================================================================')
  console.log('✨ Upstream Resources Successfully Structured and Synced!')
  console.log('========================================================================\n')
}

main().catch(console.error)
