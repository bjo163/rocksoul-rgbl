import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { FileSystemCorpusRepository } from '@moonwitness/corpus-node'
import { auditKnowledgeRecords } from '../packages/ingestion/src/knowledge/auditor.js'

const root = process.cwd()
const repository = await FileSystemCorpusRepository.open(root)
const records: Array<Record<string, any>> = []
for await (const record of repository.iterateRecords()) records.push(record as Record<string, any>)
const report = auditKnowledgeRecords(records)
await mkdir(path.join(root, 'dist'), { recursive: true })
await writeFile(path.join(root, 'dist/knowledge-domain-audit.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
