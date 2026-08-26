import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { FileSystemCorpusRepository } from './index.js'

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'mw-corpus-node-'))
  const dataset = join(root, 'datasets/example')
  await mkdir(join(dataset, 'data/resources'), { recursive: true })
  await writeFile(
    join(root, 'datasets/registry.json'),
    JSON.stringify({ specVersion: '0.1', datasets: [{ id: 'mw:dataset:test:fs', path: 'datasets/example', status: 'active' }] })
  )
  await writeFile(
    join(dataset, 'manifest.json'),
    JSON.stringify({
      id: 'mw:dataset:test:fs',
      datasetVersion: '1.0.0',
      specVersion: '0.1',
      profiles: ['textual@0.1'],
      partitions: [{ recordType: 'resource', path: 'data/resources/*.jsonl' }]
    })
  )
  await writeFile(
    join(dataset, 'data/resources/part-0001.jsonl'),
    `${JSON.stringify({
      id: 'mw:passage:test:fs:1',
      record_type: 'resource',
      kind: 'textual.passage',
      extensions: { textual: { container: 'mw:expression:test:fs', unit: 'section', citations: [{ scheme: 'mw:citation:test:fs', reference: 'A.1', path: ['A', '1'] }] } }
    })}\n`
  )
  return root
}

test('filesystem repository loads registry, manifest, JSONL, and passage references', async (t) => {
  const root = await fixture()
  t.after(() => rm(root, { recursive: true, force: true }))
  const repository = await FileSystemCorpusRepository.open(root)
  assert.equal((await repository.listDatasets()).length, 1)
  assert.equal((await repository.getPassage('mw:passage:test:fs:1'))?.kind, 'textual.passage')
  assert.deepEqual((await repository.lookupPassages({ reference: 'A.1' })).map((record) => record.id), ['mw:passage:test:fs:1'])
  assert.equal(await repository.getRecordDataset('mw:passage:test:fs:1'), 'mw:dataset:test:fs')
})

test('filesystem repository rejects partition paths that escape dataset root', async (t) => {
  const root = await fixture()
  t.after(() => rm(root, { recursive: true, force: true }))
  const manifestPath = join(root, 'datasets/example/manifest.json')
  await writeFile(
    manifestPath,
    JSON.stringify({
      id: 'mw:dataset:test:fs',
      datasetVersion: '1.0.0',
      specVersion: '0.1',
      profiles: [],
      partitions: [{ recordType: 'resource', path: '../../outside.jsonl' }]
    })
  )
  await assert.rejects(() => FileSystemCorpusRepository.open(root), /escapes its allowed root/)
})
