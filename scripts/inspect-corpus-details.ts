import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')

const dbPath = path.join(process.cwd(), 'dist/corpus.sqlite')
const db = new DatabaseSync(dbPath)

const rows = db.prepare('SELECT work_id, COUNT(*) as passage_count FROM passages GROUP BY work_id').all() as Array<{ work_id: string; passage_count: number }>
console.log(`Work passage counts (total distinct works in passages table: ${rows.length}):`)
for (const r of rows) {
  console.log(`  ${r.work_id}: ${r.passage_count}`)
}

const contentLangs = db.prepare('SELECT language, COUNT(*) as content_count FROM contents GROUP BY language').all() as Array<{ language: string; content_count: number }>
console.log(`\nContent languages (total languages: ${contentLangs.length}):`)
for (const cl of contentLangs) {
  console.log(`  ${cl.language}: ${cl.content_count}`)
}

const rawKinds = db.prepare('SELECT kind, COUNT(*) as count FROM raw_records GROUP BY kind').all() as Array<{ kind: string; count: number }>
console.log(`\nRaw records by kind:`)
for (const rk of rawKinds) {
  console.log(`  ${rk.kind}: ${rk.count}`)
}
