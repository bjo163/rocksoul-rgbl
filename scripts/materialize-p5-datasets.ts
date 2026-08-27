import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl, runIngestion } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

export interface MaterializedPartition {
  relativePath: string
  content: string
  sha256: string
  recordCount: number
}

const DIRECTORIES: Record<CorpusRecord['record_type'], string> = {
  entity: 'entities',
  resource: 'resources',
  assertion: 'assertions',
  evidence: 'evidence',
  provenance: 'provenance',
  assessment: 'assessments'
}

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

export function partitionRecords(records: CorpusRecord[]): MaterializedPartition[] {
  const byType = new Map<CorpusRecord['record_type'], CorpusRecord[]>()
  for (const record of records) {
    const list = byType.get(record.record_type) ?? []
    list.push(record)
    byType.set(record.record_type, list)
  }
  return [...byType.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([recordType, values]) => {
      const relativePath = `data/core/${DIRECTORIES[recordType]}/part-0001.jsonl`
      const content = deterministicJsonl(values)
      return { relativePath, content, sha256: sha256(content), recordCount: values.length }
    })
}

export async function materializeDataset(root: string, recipePath: string, datasetPath: string): Promise<MaterializedPartition[]> {
  const recipeDir = path.join(root, recipePath)
  const datasetDir = path.join(root, datasetPath)
  const result = await runIngestion({ recipeDir, writeOutput: false })
  const partitions = partitionRecords(result.records)
  await rm(path.join(datasetDir, 'data/core'), { recursive: true, force: true })
  for (const partition of partitions) {
    const file = path.join(datasetDir, partition.relativePath)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, partition.content, 'utf8')
  }
  const checksums = partitions
    .map((partition) => `${partition.sha256}  ${partition.relativePath}`)
    .sort()
    .join('\n') + '\n'
  await writeFile(path.join(datasetDir, 'CHECKSUMS.sha256'), checksums, 'utf8')
  return partitions
}

export async function assertDatasetMaterialized(root: string, recipePath: string, datasetPath: string): Promise<void> {
  const result = await runIngestion({ recipeDir: path.join(root, recipePath), writeOutput: false })
  for (const partition of partitionRecords(result.records)) {
    const actual = await readFile(path.join(root, datasetPath, partition.relativePath), 'utf8')
    if (actual !== partition.content) throw new Error(`${datasetPath}/${partition.relativePath} is not byte-for-byte reproducible from ${recipePath}`)
  }
}

async function main(): Promise<void> {
  const root = process.cwd()
  const quran = await materializeDataset(root, 'ingestion/recipes/quran-tanzil-uthmani', 'datasets/quran-tanzil-uthmani')
  const dhammapada = await materializeDataset(root, 'ingestion/recipes/dhammapada-sujato', 'datasets/dhammapada-sujato')
  console.log(`Quran: ${quran.reduce((sum, p) => sum + p.recordCount, 0)} records`)
  console.log(`Dhammapada: ${dhammapada.reduce((sum, p) => sum + p.recordCount, 0)} records`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  await main()
}
