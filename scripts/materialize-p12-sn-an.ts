import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl, runIngestion } from '@moonwitness/corpus-ingestion'

const root = process.cwd()
const dataset = 'datasets/suttacentral-sn-an-sujato'
const result = await runIngestion({ recipeDir: path.join(root, 'ingestion/recipes/suttacentral-sn-an'), writeOutput: false })
if (result.records.length !== 147914) throw new Error(`Expected 147914 records, got ${result.records.length}`)
for (const recordType of ['resource', 'provenance'] as const) {
  const records = result.records.filter((record) => record.record_type === recordType)
  const directory = recordType === 'resource' ? 'resources' : 'provenance'
  const target = path.join(root, dataset, 'data/core', directory, 'sn-an.jsonl')
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, deterministicJsonl(records), 'utf8')
}
const files = [`${dataset}/data/core/provenance/sn-an.jsonl`, `${dataset}/data/core/resources/sn-an.jsonl`, `${dataset}/manifest.json`, `${dataset}/README.md`]
const checksums = []
for (const file of files) { const bytes = await readFile(path.join(root, file)); checksums.push(`${createHash('sha256').update(bytes).digest('hex')}  ${file}`) }
await writeFile(path.join(root, dataset, 'CHECKSUMS.sha256'), `${checksums.join('\n')}\n`, 'utf8')
console.log(`Materialized ${result.records.length} deterministic SN/AN records (${result.outputSha256})`)
