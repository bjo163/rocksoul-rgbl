import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import type { CanonicalId, CorpusRecord } from '@moonwitness/corpus-core'
import { MemoryCorpusRepository, type DatasetDescriptor } from '@moonwitness/corpus-repository'
import { writeDerivedArtifacts } from './index.js'

const datasetId = 'mw:dataset:test:build' as CanonicalId
const records: CorpusRecord[] = [
  { id: 'mw:entity:test:build', record_type: 'entity', kind: 'concept', labels: [{ value: 'Build Example', role: 'preferred' }] },
  { id: 'mw:resource:test:build', record_type: 'resource', kind: 'document', description: 'Deterministic build fixture' }
]
const descriptor: DatasetDescriptor = {
  entry: { id: datasetId, path: 'datasets/build', status: 'fixture' },
  manifest: { id: datasetId, datasetVersion: '1.0.0', specVersion: '0.1', profiles: [], partitions: [] }
}
const recordDatasets = new Map<CanonicalId, CanonicalId>(records.map((record) => [record.id, datasetId]))

test('derived catalog/search artifacts are deterministic and database-free', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'mw-corpus-build-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const repository = new MemoryCorpusRepository(records, [descriptor], recordDatasets)
  const first = join(root, 'first')
  const second = join(root, 'second')
  const manifestA = await writeDerivedArtifacts(repository, first)
  const manifestB = await writeDerivedArtifacts(repository, second)
  assert.deepEqual(manifestA, manifestB)
  for (const file of ['catalog.json', 'records.jsonl', 'search-index.jsonl', 'build-manifest.json']) {
    assert.equal(await readFile(join(first, file), 'utf8'), await readFile(join(second, file), 'utf8'))
  }
  const filenames = await readdir(first)
  assert.equal(filenames.some((name) => /\.(sqlite|duckdb|parquet)$/i.test(name)), false)
})
