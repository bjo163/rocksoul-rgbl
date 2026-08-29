import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { auditWorkDepth } from '@moonwitness/corpus-ingestion'

const report = await auditWorkDepth(process.cwd())
await mkdir(path.join(process.cwd(), 'dist'), { recursive: true })
await writeFile(path.join(process.cwd(), 'dist/phase28-work-depth.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ ...report, rows: undefined }, null, 2))
if (report.totalWorks !== 297) throw new Error(`Expected all 297 canonical works in audit, got ${report.totalWorks}`)
