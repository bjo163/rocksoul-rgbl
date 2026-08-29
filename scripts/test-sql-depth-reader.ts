import { createRequire } from 'node:module'
import path from 'node:path'
import { UniversalCorpusRegistry } from '../packages/ingestion/src/registry/universal-registry.js'

const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')

async function run() {
  const start = Date.now()
  const dbPath = path.join(process.cwd(), 'dist/corpus.sqlite')
  const db = new DatabaseSync(dbPath)

  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const sources = registry.getSources()

  // Global SQL Aggregations
  const totalPassages = (db.prepare('SELECT COUNT(*) as c FROM passages').get() as { c: number }).c
  const totalContents = (db.prepare('SELECT COUNT(*) as c FROM contents').get() as { c: number }).c
  const totalRawRecords = (db.prepare('SELECT COUNT(*) as c FROM raw_records').get() as { c: number }).c
  const totalDevotionals = (db.prepare('SELECT COUNT(*) as c FROM devotionals').get() as { c: number }).c
  const totalLexicon = (db.prepare('SELECT COUNT(*) as c FROM lexicon_terms').get() as { c: number }).c
  const totalAssertions = (db.prepare('SELECT COUNT(*) as c FROM assertions').get() as { c: number }).c

  console.log(`Global SQL counts (computed in ${Date.now() - start}ms):`)
  console.log(`- passages: ${totalPassages}`)
  console.log(`- contents: ${totalContents}`)
  console.log(`- raw_records: ${totalRawRecords}`)
  console.log(`- devotionals: ${totalDevotionals}`)
  console.log(`- lexicon: ${totalLexicon}`)
  console.log(`- assertions: ${totalAssertions}`)

  // Work-level aggregation from DB
  const workRows = db.prepare(`
    SELECT work_id, COUNT(*) as canonical_positions
    FROM passages
    GROUP BY work_id
  `).all() as Array<{ work_id: string; canonical_positions: number }>

  console.log(`\nAggregated ${workRows.length} active works in passages table:`)
  for (const wr of workRows.slice(0, 5)) {
    console.log(`  ${wr.work_id}: ${wr.canonical_positions} positions`)
  }

  // Language aggregation from DB
  const langRows = db.prepare(`
    SELECT language, COUNT(*) as count
    FROM contents
    GROUP BY language
    ORDER BY count DESC
  `).all() as Array<{ language: string; count: number }>

  console.log(`\nAggregated ${langRows.length} active languages in contents table:`)
  for (const lr of langRows.slice(0, 5)) {
    console.log(`  ${lr.language}: ${lr.count} records`)
  }
}

run().catch(console.error)
