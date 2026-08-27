import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import path from 'node:path'
import { assertCoverageMatrix } from './coverage-matrix.js'

test('P12 coverage report is synchronized and exposes unresolved language gates', async () => {
  const root = process.cwd()
  await assertCoverageMatrix(root)
  const report = JSON.parse(await readFile(path.join(root, 'docs/P12-FOUNDATION-COVERAGE-REPORT.json'), 'utf8')) as {
    totals: { activeDatasets: number; records: number }
    gates: { noUnresolvedBundledRights: { status: string }; requiredSourceEnglishIndonesian: { status: string; gaps: unknown[] } }
    datasets: unknown[]
  }
  assert.equal(report.totals.activeDatasets, 12)
  assert.equal(report.totals.records, 444846)
  assert.equal(report.datasets.length, report.totals.activeDatasets)
  assert.equal(report.gates.noUnresolvedBundledRights.status, 'pass')
  assert.equal(report.gates.requiredSourceEnglishIndonesian.status, 'blocked')
  assert.ok(report.gates.requiredSourceEnglishIndonesian.gaps.length > 0)
})
