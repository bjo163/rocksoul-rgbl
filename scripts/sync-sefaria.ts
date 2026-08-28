import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const BASE_URL = 'https://www.sefaria.org/api'

interface SefariaTextResponse {
  ref: string
  he: string | string[]
  text: string | string[]
  versionTitle: string
  license: string
}

async function fetchSefariaText(ref: string): Promise<{ data: SefariaTextResponse; sha256: string; bytes: number }> {
  const url = `${BASE_URL}/texts/${encodeURIComponent(ref)}?context=0`
  console.log(`[Sefaria API] Fetching: ${ref} -> ${url}`)

  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) {
    throw new Error(`Sefaria API HTTP ${res.status}: ${res.statusText}`)
  }

  const rawText = await res.text()
  const sha256 = createHash('sha256').update(rawText).digest('hex')
  const data = JSON.parse(rawText) as SefariaTextResponse

  return { data, sha256, bytes: Buffer.byteLength(rawText) }
}

async function main() {
  console.log('========================================================================')
  console.log('📜 Sefaria API Automated Upstream Seeding Engine (Judaism & Tanakh)')
  console.log('========================================================================\n')

  const targetDir = path.join(process.cwd(), 'ingestion/recipes/sefaria/source')
  await mkdir(targetDir, { recursive: true })

  const targets = [
    { ref: 'Pirkei Avot 1', file: 'pirkei-avot-chapter-1.json' },
    { ref: 'Genesis 1', file: 'genesis-chapter-1.json' },
    { ref: 'Exodus 20', file: 'exodus-ten-commandments.json' },
    { ref: 'Psalms 23', file: 'psalms-23.json' }
  ]

  for (const t of targets) {
    try {
      const { data, sha256, bytes } = await fetchSefariaText(t.ref)
      await writeFile(path.join(targetDir, t.file), JSON.stringify(data, null, 2), 'utf8')
      console.log(`✓ Synchronized ${t.ref}: ${bytes} bytes (SHA-256: ${sha256.slice(0, 16)}...) -> ${t.file}`)
    } catch (err: any) {
      console.warn(`⚠ Could not fetch ${t.ref}: ${err.message}`)
    }
  }

  console.log('\n========================================================================')
  console.log('✨ Sefaria Upstream Ingestion Complete!')
  console.log('========================================================================\n')
}

main().catch(console.error)
