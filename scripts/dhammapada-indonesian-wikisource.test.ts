import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import path from 'node:path'

test('Wikisource Dhammapada snapshot preserves the explicit 359 gap', async () => {
  const root = process.cwd()
  const records = (await readFile(path.join(root, 'datasets/dhammapada-indonesian-wikisource/data/core/resources/dhammapada-indonesian.jsonl'), 'utf8'))
    .trim().split('\n').map(line => JSON.parse(line) as { id: string; kind?: string })
  const contents = records.filter(record => record.kind === 'textual.content')
  const alignments = records.filter(record => record.kind === 'textual.alignment')
  assert.equal(contents.length, 422)
  assert.equal(alignments.length, 422)
  assert.equal(contents.some(record => record.id.includes(':359:')), false)
  assert.equal(alignments.some(record => record.id.includes(':359')), false)

  const source = await readFile(path.join(root, 'ingestion/recipes/dhammapada-indonesian-wikisource/source/Dhammapada.wikitext'), 'utf8')
  assert.match(source, /^\* 165\)/mu)
  assert.doesNotMatch(source, /^\* \(359\)/mu)
})
