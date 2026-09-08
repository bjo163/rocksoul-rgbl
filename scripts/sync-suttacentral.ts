import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const BASE_URL = 'https://suttacentral.net/api'

interface SuttaResponse {
  root_text: { text: string }
  translation: { text: string; author_uid: string }
  suttaplex: { title: string; blurb: string }
}

async function fetchSutta(suttaUid: string): Promise<{ data: any; sha256: string; bytes: number; rawText: string }> {
  const url = `${BASE_URL}/suttas/${suttaUid}/sujato?lang=en`
  console.log(`[SuttaCentral API] Fetching: ${suttaUid} -> ${url}`)

  const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'MoonWitness-Corpus/1.0' } })
  if (!res.ok) {
    throw new Error(`SuttaCentral API HTTP ${res.status}: ${res.statusText}`)
  }

  const rawText = await res.text()
  const sha256 = createHash('sha256').update(rawText).digest('hex')
  const data = JSON.parse(rawText)

  return { data, sha256, bytes: Buffer.byteLength(rawText), rawText }
}

async function main() {
  console.log('========================================================================')
  console.log('☸️ SuttaCentral API Automated Upstream Seeding Engine (Buddhism Tipitaka)')
  console.log('========================================================================\n')

  const targetDir = path.join(process.cwd(), 'ingestion/recipes/suttacentral/source')
  await mkdir(targetDir, { recursive: true })

  const targets = [
    { uid: 'dhp1-20', file: 'dhammapada-yamakavagga.json', desc: 'Dhammapada Chapter 1 (Pairs)' },
    { uid: 'dhp21-32', file: 'dhammapada-appamadavagga.json', desc: 'Dhammapada Chapter 2 (Heedfulness)' },
    { uid: 'dn1', file: 'digha-nikaya-1.json', desc: 'Dīgha Nikāya 1: Brahmajāla Sutta' },
    { uid: 'mn1', file: 'majjhima-nikaya-1.json', desc: 'Majjhima Nikāya 1: Mūlapariyāya Sutta' },
    { uid: 'sn56.11', file: 'dhammacakkappavattana-sutta.json', desc: 'First Discourse: Setting in Motion the Wheel of the Dhamma' }
  ]

  let totalBytes = 0
  const aggregateHash = createHash('sha256')
  let successfulFetches = 0

  for (const t of targets) {
    try {
      const { data, sha256, bytes, rawText } = await fetchSutta(t.uid)
      await writeFile(path.join(targetDir, t.file), JSON.stringify(data, null, 2), 'utf8')
      totalBytes += bytes
      aggregateHash.update(rawText)
      successfulFetches++
      console.log(`✓ Synchronized ${t.uid} (${t.desc}): ${bytes} bytes (SHA-256: ${sha256.slice(0, 16)}...) -> ${t.file}`)
    } catch (err: any) {
      console.warn(`⚠ Could not fetch ${t.uid}: ${err.message}`)
    }
  }

  const finalSha256 = aggregateHash.digest('hex')

  console.log('\n========================================================================')
  console.log('✨ SuttaCentral Upstream Ingestion Complete!')
  console.log('========================================================================\n')

  console.log(`MOONWITNESS_RESULT:${JSON.stringify({
    schemaVersion: '1.0',
    executionStatus: 'PROCESS_SUCCEEDED',
    acquisitionStatus: successfulFetches > 0 ? 'REMOTE_SYNCED' : 'REMOTE_FAILED',
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
