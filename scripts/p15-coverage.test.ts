import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import path from 'node:path'

test('P15 coverage report matches the bundled lexicon seed counts', async () => {
  const root = process.cwd()
  const report = JSON.parse(await readFile(path.join(root, 'docs/P15-COVERAGE-REPORT.json'), 'utf8')) as { totals: { datasets: number; records: number; concepts: number; terms: number; usageEvidence: number }; gates: Record<string, string> }
  assert.deepEqual(report.totals, { datasets: 2, records: 24, concepts: 5, terms: 5, usageEvidence: 7 })
  assert.equal(report.gates.scopedConcepts, 'pass')
  assert.equal(report.gates.sourceEvidence, 'pass')
  assert.equal(report.gates.automaticIdentityMerge, 'disabled')
})
