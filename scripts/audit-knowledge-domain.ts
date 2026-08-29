import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { FileSystemCorpusRepository } from '@moonwitness/corpus-node'
import { auditKnowledgeRecords } from '../packages/ingestion/src/knowledge/auditor.js'
import { buildTimelineQueryIndex } from '../packages/ingestion/src/knowledge/timeline.js'

const root = process.cwd()
const repository = await FileSystemCorpusRepository.open(root)
const records: Array<Record<string, any>> = []
for await (const record of repository.iterateRecords()) records.push(record as Record<string, any>)
const report = auditKnowledgeRecords(records)
const timelineIndex = buildTimelineQueryIndex(records)
const timeline = { ...report, queryIndexSizes: { byPerson: timelineIndex.byPerson.size, byTradition: timelineIndex.byTradition.size, byWork: timelineIndex.byWork.size, byPlace: timelineIndex.byPlace.size, byEra: timelineIndex.byEra.size, bySource: timelineIndex.bySource.size, byYear: timelineIndex.byYear.size } }
await mkdir(path.join(root, 'dist'), { recursive: true })
await writeFile(path.join(root, 'dist/knowledge-domain-audit.json'), `${JSON.stringify(timeline, null, 2)}\n`)
await writeFile(path.join(root, 'dist/timeline-domain-audit.json'), `${JSON.stringify(timeline, null, 2)}\n`)
console.log(JSON.stringify(timeline, null, 2))
