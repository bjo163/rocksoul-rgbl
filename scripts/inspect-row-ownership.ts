import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')

const dbPath = path.join(process.cwd(), 'dist/corpus.sqlite')
const db = new DatabaseSync(dbPath)

console.log('=== Sample contents rows ===')
const sampleContents = db.prepare('SELECT id, passage_id, dataset_id, language, script, representation FROM contents LIMIT 20').all()
console.log(sampleContents)

console.log('\n=== Distinct dataset_ids in contents ===')
const contentDatasets = db.prepare('SELECT DISTINCT dataset_id, COUNT(*) as c FROM contents GROUP BY dataset_id').all()
console.log(contentDatasets)

console.log('\n=== Distinct dataset_ids in passages ===')
const passageDatasets = db.prepare('SELECT DISTINCT dataset_id, COUNT(*) as c FROM passages GROUP BY dataset_id').all()
console.log(passageDatasets)

console.log('\n=== Sample raw_records kinds ===')
const rawKinds = db.prepare('SELECT kind, COUNT(*) as c FROM raw_records GROUP BY kind').all()
console.log(rawKinds)
