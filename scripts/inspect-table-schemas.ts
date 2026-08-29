import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')

const dbPath = path.join(process.cwd(), 'dist/corpus.sqlite')
const db = new DatabaseSync(dbPath)

const tables = ['datasets', 'works', 'passages', 'contents', 'devotionals', 'lexicon_terms', 'assertions', 'raw_records']

for (const t of tables) {
  console.log(`\n=== Table: ${t} ===`)
  const cols = db.prepare(`PRAGMA table_info(${t})`).all()
  console.log('Columns:', cols.map((c: any) => `${c.name} (${c.type})`).join(', '))
  const count = (db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get() as { c: number }).c
  console.log(`Total Rows: ${count}`)
  const sample = db.prepare(`SELECT * FROM ${t} LIMIT 1`).all()
  console.log('Sample Row:', sample)
}
