import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

test('P17 graph baseline preserves role and term-usage edge classes', async () => {
  const root = process.cwd()
  const file = path.join(root, 'datasets/research-graph-baseline/data/core/evidence/graph.jsonl')
  const lines = (await readFile(file, 'utf8')).trim().split('\n')
  const edges = lines.map((line) => JSON.parse(line) as {
    record_type: string
    extensions?: { graph?: { edgeType?: string; status?: string; reviewState?: string } }
  })

  assert.equal(edges.length, 14)
  assert.ok(edges.every((edge) => edge.record_type === 'evidence'))
  assert.equal(edges.filter((edge) => edge.extensions?.graph?.edgeType === 'role').length, 7)
  assert.equal(edges.filter((edge) => edge.extensions?.graph?.edgeType === 'term_usage').length, 7)
  assert.ok(edges.every((edge) => edge.extensions?.graph?.status === 'asserted'))
  assert.ok(edges.every((edge) => edge.extensions?.graph?.reviewState === 'reviewed'))
})
