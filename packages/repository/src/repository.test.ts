import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalId, CorpusRecord } from '@moonwitness/corpus-core'
import { MemoryCorpusRepository, resolveDatasetDependencies, type DatasetDescriptor } from './index.js'

const datasetA = 'mw:dataset:test:a' as CanonicalId
const datasetB = 'mw:dataset:test:b' as CanonicalId
const subject = 'mw:person:test:subject' as CanonicalId
const passage = 'mw:passage:test:1' as CanonicalId
const evidenceId = 'mw:evidence:test:1' as CanonicalId
const assertionId = 'mw:assertion:test:1' as CanonicalId

const datasets: DatasetDescriptor[] = [
  {
    entry: { id: datasetA, path: 'datasets/a', status: 'active' },
    manifest: {
      id: datasetA,
      datasetVersion: '1.0.0',
      specVersion: '0.1',
      profiles: [],
      partitions: []
    }
  },
  {
    entry: { id: datasetB, path: 'datasets/b', status: 'active' },
    manifest: {
      id: datasetB,
      datasetVersion: '1.0.0',
      specVersion: '0.1',
      profiles: [],
      dependencies: [{ dataset: datasetA, version: '1.0.0' }],
      partitions: []
    }
  }
]

const records: CorpusRecord[] = [
  { id: subject, record_type: 'entity', kind: 'person', labels: [{ value: 'Test Subject', role: 'preferred' }] },
  {
    id: passage,
    record_type: 'resource',
    kind: 'textual.passage',
    extensions: {
      textual: {
        container: 'mw:expression:test:en',
        unit: 'verse',
        sequence: 1,
        citations: [{ scheme: 'mw:citation-scheme:test', reference: '1:1', path: ['1', '1'] }]
      }
    }
  },
  {
    id: 'mw:content:test:1',
    record_type: 'resource',
    kind: 'textual.content',
    extensions: { textual: { target: passage, language: 'en', representation: 'source', text: 'Searchable witness text' } }
  },
  {
    id: evidenceId,
    record_type: 'evidence',
    target: passage,
    relation: 'supports'
  },
  {
    id: assertionId,
    record_type: 'assertion',
    subject,
    predicate: 'mw:predicate:test',
    object: { entity: passage },
    assertion_class: 'explicit_source',
    scope: { tradition: 'mw:tradition:test' },
    evidence: [evidenceId]
  }
]

const recordDatasets = new Map(records.map((record) => [record.id, datasetA]))
const repository = new MemoryCorpusRepository(records, datasets, recordDatasets)

test('canonical lookup and typed lookup share one record index', async () => {
  assert.equal((await repository.getRecord(subject))?.id, subject)
  assert.equal((await repository.getEntity(subject))?.kind, 'person')
  assert.equal(await repository.getResource(subject), null)
})

test('passage reference lookup is generic and citation-scheme based', async () => {
  const result = await repository.lookupPassages({ reference: '1:1' })
  assert.deepEqual(result.map((item) => item.id), [passage])
})

test('assertion traversal preserves assertion, evidence, and target boundaries', async () => {
  const traversal = await repository.traverseAssertionEvidence(assertionId)
  assert.equal(traversal?.assertion.id, assertionId)
  assert.deepEqual(traversal?.evidence.map((item) => item.id), [evidenceId])
  assert.deepEqual(traversal?.targets.map((item) => item.id), [passage])
})

test('scope filters are descriptive query filters', async () => {
  assert.equal((await repository.findAssertions({ scope: { tradition: 'mw:tradition:test' } })).length, 1)
  assert.equal((await repository.findAssertions({ scope: { tradition: 'mw:tradition:other' } })).length, 0)
})

test('search is deterministic and includes textual content', async () => {
  const result = await repository.search({ text: 'searchable witness', limit: 10 })
  assert.deepEqual(result.map((item) => item.id), ['mw:content:test:1'])
})

test('dataset dependency resolution is exact-version and topological', () => {
  const resolution = resolveDatasetDependencies(datasets, datasetB)
  assert.deepEqual(resolution?.ordered.map((item) => item.manifest.id), [datasetA, datasetB])
})

test('dataset dependency resolution rejects version mismatch and cycles', () => {
  const wrongVersion: DatasetDescriptor[] = [
    datasets[0]!,
    {
      ...datasets[1]!,
      manifest: { ...datasets[1]!.manifest, dependencies: [{ dataset: datasetA, version: '2.0.0' }] }
    }
  ]
  assert.throws(() => resolveDatasetDependencies(wrongVersion, datasetB), /requires .*2\.0\.0.*provides 1\.0\.0/)

  const cyclic: DatasetDescriptor[] = [
    {
      ...datasets[0]!,
      manifest: { ...datasets[0]!.manifest, dependencies: [{ dataset: datasetB, version: '1.0.0' }] }
    },
    datasets[1]!
  ]
  assert.throws(() => resolveDatasetDependencies(cyclic, datasetB), /dependency cycle/)
})
