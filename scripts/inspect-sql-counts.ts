import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')

const dbPath = path.join(process.cwd(), 'dist/corpus.sqlite')
const db = new DatabaseSync(dbPath)

console.log('=== Database Table Row Counts ===')
const rawCount = db.prepare('SELECT COUNT(*) as c FROM raw_records').get() as { c: number }
const passCount = db.prepare('SELECT COUNT(*) as c FROM passages').get() as { c: number }
const contCount = db.prepare('SELECT COUNT(*) as c FROM contents').get() as { c: number }
const devCount = db.prepare('SELECT COUNT(*) as c FROM devotionals').get() as { c: number }
const lexCount = db.prepare('SELECT COUNT(*) as c FROM lexicon_terms').get() as { c: number }
const assCount = db.prepare('SELECT COUNT(*) as c FROM assertions').get() as { c: number }
const worksCount = db.prepare('SELECT COUNT(*) as c FROM works').get() as { c: number }
const dataCount = db.prepare('SELECT COUNT(*) as c FROM datasets').get() as { c: number }

console.log(`raw_records : ${rawCount.c}`)
console.log(`passages    : ${passCount.c}`)
console.log(`contents    : ${contCount.c}`)
console.log(`devotionals : ${devCount.c}`)
console.log(`lexicon     : ${lexCount.c}`)
console.log(`assertions  : ${assCount.c}`)
console.log(`works       : ${worksCount.c}`)
console.log(`datasets    : ${dataCount.c}`)

const totalIndexed = rawCount.c + devCount.c + lexCount.c + assCount.c + 300 // or exact sum
console.log(`Total canonical positions (distinct passages + devotionals + lexicon):`)
const distinctPassages = db.prepare('SELECT COUNT(DISTINCT id) as c FROM passages').get() as { c: number }
console.log(`distinct passages: ${distinctPassages.c}`)

// Let's check text hashes
const distinctTexts = db.prepare('SELECT COUNT(DISTINCT text) as c FROM contents').get() as { c: number }
console.log(`distinct content texts: ${distinctTexts.c}`)
