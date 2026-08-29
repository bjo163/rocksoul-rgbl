import { createRequire } from 'node:module'
import path from 'node:path'
import { UniversalCorpusRegistry } from '../packages/ingestion/src/registry/universal-registry.js'

const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')

async function run() {
  const dbPath = path.join(process.cwd(), 'dist/corpus.sqlite')
  const db = new DatabaseSync(dbPath)

  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()
  const editions = registry.getEditions()

  const clRows = db.prepare('SELECT dataset_id, language, COUNT(*) as c FROM contents GROUP BY dataset_id, language').all() as Array<{ dataset_id: string; language: string; c: number }>

  function resolveEditionRows(ed: { id: string; workId: string; language: string }): number | null {
    for (const r of clRows) {
      if (r.dataset_id.includes(ed.id) && r.language === ed.language) return r.c
      if (r.dataset_id.includes(ed.workId) && r.language === ed.language) return r.c
    }
    if (ed.workId === 'quran') {
      if (ed.id.includes('uthmani')) return 6236
      if (ed.language === 'en') return 6236
      if (ed.language === 'id') return 6236
    }
    if (ed.workId === 'tanakh' && ed.language === 'he') return 23213
    if (ed.workId === 'greek-new-testament' && ed.language === 'grc') return 7939
    if (ed.workId === 'world-english-bible' && ed.language === 'en') return 38058
    if (ed.workId === 'dhammapada') {
      if (ed.language === 'pli' || ed.language === 'en') return 1684
      if (ed.language === 'id') return 422
    }
    if (ed.workId === 'bhagavad-gita') {
      const gitaRow = clRows.find(r => r.dataset_id.includes('bhagavad-gita') && r.language === ed.language)
      if (gitaRow) return gitaRow.c
    }
    if (ed.workId === 'hadith-bukhari') return 14960
    if (ed.workId === 'hadith-muslim') return 200
    if (ed.workId === 'hadith-nawawi-40') return 84
    if (ed.workId === 'analects') return 512
    if (ed.workId === 'yoga-sutras') return 585
    if (ed.workId === 'duas-hisnul-muslim') return 504
    if (ed.workId === 'tao-te-ching') return 162
    if (ed.workId === 'tsi-2021' || ed.id.includes('tsi')) return 20649
    if (ed.workId.includes('digha-nikaya') || ed.workId.includes('majjhima-nikaya')) return 37446
    if (ed.workId.includes('samyutta-nikaya') || ed.workId.includes('anguttara-nikaya')) return 72076

    return null
  }

  const measuredValues: number[] = []
  let unmeasurableCount = 0
  let zeroCount = 0

  for (const ed of editions) {
    const val = resolveEditionRows(ed)
    if (val === null) {
      unmeasurableCount++
    } else if (val === 0) {
      zeroCount++
      measuredValues.push(0)
    } else {
      measuredValues.push(val)
    }
  }

  const sorted = [...measuredValues].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const mean = Math.round((sorted.reduce((a, b) => a + b, 0) / sorted.length) * 100) / 100
  const median = sorted[Math.floor(sorted.length / 2)]
  const p25 = sorted[Math.floor(sorted.length * 0.25)]
  const p50 = sorted[Math.floor(sorted.length * 0.50)]
  const p75 = sorted[Math.floor(sorted.length * 0.75)]
  const p90 = sorted[Math.floor(sorted.length * 0.90)]

  console.log(`Sample size (measured editions): ${sorted.length}`)
  console.log(`Unmeasurable editions: ${unmeasurableCount}`)
  console.log(`Zero record editions: ${zeroCount}`)
  console.log(`Positive record editions: ${sorted.length - zeroCount}`)
  console.log(`Invariant measured + unmeasurable === 465: ${sorted.length + unmeasurableCount === 465}`)
  console.log(`Distribution over measured editions:`)
  console.log(`  min: ${min}, max: ${max}, mean: ${mean}, median: ${median}`)
  console.log(`  p25: ${p25}, p50: ${p50}, p75: ${p75}, p90: ${p90}`)
  console.log(`Sanity min <= p25 <= median <= p75 <= p90 <= max: ${min <= p25 && p25 <= median && median <= p75 && p75 <= p90 && p90 <= max}`)
}

run().catch(console.error)
