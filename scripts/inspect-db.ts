import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')

const dbPath = path.join(process.cwd(), 'dist/corpus.sqlite')
const db = new DatabaseSync(dbPath)

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>
console.log('Tables:', tables.map(t => t.name))

for (const t of tables) {
  try {
    const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get() as { c: number }
    console.log(`${t.name}: ${count.c} rows`)
  } catch (e: any) {
    console.log(`${t.name}: error ${e.message}`)
  }
}

// Sample dataset breakdown
const datasets = db.prepare('SELECT id, record_count FROM datasets LIMIT 10').all()
console.log('\nSample datasets:', datasets)

// Sample passages
const passageWorks = db.prepare('SELECT DISTINCT work_id, COUNT(*) as c FROM passages GROUP BY work_id LIMIT 10').all()
console.log('\nSample passage works:', passageWorks)
