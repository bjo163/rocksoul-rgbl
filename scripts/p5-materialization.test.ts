import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { assertDatasetMaterialized } from './materialize-p5-datasets.js'

const root = process.cwd()

test('Quran real dataset is byte-for-byte reproducible from its pinned recipe', async () => {
  await assertDatasetMaterialized(root, 'ingestion/recipes/quran-tanzil-uthmani', 'datasets/quran-tanzil-uthmani')
})

test('Dhammapada real dataset is byte-for-byte reproducible from its pinned recipe', async () => {
  await assertDatasetMaterialized(root, 'ingestion/recipes/dhammapada-sujato', 'datasets/dhammapada-sujato')
})

test('P5 cross-tradition fixture explicitly disclaims equivalence', async () => {
  const file = await readFile('datasets/examples/p5-cross-tradition/data/core/resources/part-0001.jsonl', 'utf8')
  assert.match(file, /does not assert identity, equivalence, doctrinal similarity, or shared authority/)
})
