import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { CorpusDepthAuditor } from './depth-auditor.js'
import { validateDepth } from './depth-validator.js'

test('Corpus Depth Auditor: audits 37 Phase 15 new works and generates data-derived depth metrics without synthetic multipliers', async () => {
  const auditor = new CorpusDepthAuditor(process.cwd())
  const { delta, newWorks, newWorksActual, syntheticAudit, workMaterialization, languageDepth, sourceDepth, traditionDepth, recordReconciliation, summary } =
    await auditor.runAudit()

  assert.equal(newWorks.length, 37, `Expected 37 new works, got ${newWorks.length}`)
  assert.equal(newWorksActual.length, 37)
  assert.equal(workMaterialization.length, 37)
  assert.ok(workMaterialization.every(wm => wm.materializationStatus === 'MATERIALIZED'))
  assert.equal(delta.comparisons.phase16.traditions, 64)
  assert.equal(delta.comparisons.phase16.works, 225)
  assert.equal(delta.comparisons.phase16.editions, 465)
  assert.equal(traditionDepth.newTraditions.length, 11)
  assert.equal(recordReconciliation.totalNewWorks, 37)
  assert.equal(summary.phase15NewWorks, 37)
  assert.equal(summary.phase15NewEditions, 74)

  // Synthetic check invariants
  assert.equal(syntheticAudit.syntheticCountCalculations, 0, 'Must have 0 synthetic count calculations')
  assert.equal(syntheticAudit.hardcodedRecordCalculations, 0, 'Must have 0 hardcoded record calculations')
  assert.equal(syntheticAudit.magicNumberDerivedCounts, 0, 'Must have 0 magic number calculations')
  assert.equal(syntheticAudit.measurementIntegrity, 'REAL_DATA')
  assert.equal(syntheticAudit.status, 'PASS')
})

test('Depth Validator: validates hard invariants for Phase 16 depth expansion and rejects synthetic calculations', async () => {
  const result = await validateDepth(process.cwd())

  assert.equal(result.valid, true, `Depth validation failed with problems: ${result.problems.join(', ')}`)
  assert.equal(result.totalTraditions, 64)
  assert.equal(result.totalWorks, 225)
  assert.equal(result.totalEditions, 465)
  assert.equal(result.phase15NewWorks, 37)
  assert.equal(result.phase15NewEditions, 74)
  assert.equal(result.syntheticCountCalculations, 0)
  assert.equal(result.problems.length, 0)
})
