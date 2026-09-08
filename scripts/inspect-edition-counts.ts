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

  // Map edition IDs to DB counts
  const contentCountByDatasetAndLang = new Map<string, number>()
  const rows = db.prepare(`
    SELECT dataset_id, language, COUNT(*) as c
    FROM contents
    GROUP BY dataset_id, language
  `).all() as Array<{ dataset_id: string; language: string; c: number }>

  for (const r of rows) {
    contentCountByDatasetAndLang.set(`${r.dataset_id}:${r.language}`, r.c)
  }

  // Work passage counts
  const workPassages = new Map<string, number>()
  const pRows = db.prepare(`
    SELECT work_id, COUNT(*) as c
    FROM passages
    GROUP BY work_id
  `).all() as Array<{ work_id: string; c: number }>

  for (const pr of pRows) {
    workPassages.set(pr.work_id, pr.c)
  }

  console.log(`Total Editions in Registry: ${editions.length}`)
  console.log(`Total Distinct dataset/lang content groups in SQLite: ${rows.length}`)
  console.log(`Sample dataset/lang groups:`)
  for (const r of rows.slice(0, 10)) {
    console.log(`  ${r.dataset_id} [${r.language}]: ${r.c} records`)
  }
}

run().catch(console.error)
