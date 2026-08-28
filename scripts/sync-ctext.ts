import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const BASE_URL = 'https://ctext.org/api.pl'

async function fetchCtext(urn: string): Promise<{ text: string; sha256: string; bytes: number }> {
  const url = `${BASE_URL}?if=en&remap=gb&urn=${encodeURIComponent(urn)}`
  console.log(`[CText API] Fetching: ${urn} -> ${url}`)

  const res = await fetch(url, { headers: { 'Accept': 'application/xml, text/xml, */*' } })
  if (!res.ok) {
    throw new Error(`CText API HTTP ${res.status}: ${res.statusText}`)
  }

  const rawText = await res.text()
  const sha256 = createHash('sha256').update(rawText).digest('hex')

  return { text: rawText, sha256, bytes: Buffer.byteLength(rawText) }
}

async function main() {
  console.log('========================================================================')
  console.log('☯️ Chinese Text Project API Automated Upstream Seeding Engine')
  console.log('========================================================================\n')

  const targetDir = path.join(process.cwd(), 'ingestion/recipes/ctext/source')
  await mkdir(targetDir, { recursive: true })

  const targets = [
    { urn: 'ctp:dao-de-jing', file: 'dao-de-jing-raw.xml', desc: 'Tao Te Ching (Laozi 81 Chapters)' },
    { urn: 'ctp:analects', file: 'analects-raw.xml', desc: 'Analects of Confucius (Complete)' },
    { urn: 'ctp:zhuangzi', file: 'zhuangzi-raw.xml', desc: 'Zhuangzi (Daoist Master Zhuang)' }
  ]

  for (const t of targets) {
    try {
      const { text, sha256, bytes } = await fetchCtext(t.urn)
      await writeFile(path.join(targetDir, t.file), text, 'utf8')
      console.log(`✓ Synchronized ${t.urn} (${t.desc}): ${bytes} bytes (SHA-256: ${sha256.slice(0, 16)}...) -> ${t.file}`)
    } catch (err: any) {
      console.warn(`⚠ Could not fetch ${t.urn}: ${err.message}`)
    }
  }

  console.log('\n========================================================================')
  console.log('✨ Chinese Text Project Upstream Ingestion Complete!')
  console.log('========================================================================\n')
}

main().catch(console.error)
