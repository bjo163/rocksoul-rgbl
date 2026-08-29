import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { CorpusDepthAuditor } from './depth-auditor.js'
import { validateDepth } from './depth-validator.js'

test('Corpus Depth Auditor V3: audits 37 Phase 15 new works with true record-level DB truth', async () => {
  const auditor = new CorpusDepthAuditor(process.cwd())
  const {
    delta,
    newWorks,
    newWorksActual,
    editionActual,
    editionRecordTruth,
    recordOwnership,
    indexComposition,
    dbIntegrityAudit,
    sqlProvenance,
    workMaterialization,
    languageDepth,
    sourceDepth,
    traditionDepth,
    recordReconciliation,
    summary
  } = await auditor.runAudit()

  assert.equal(newWorks.length, 37, `Expected 37 new works, got ${newWorks.length}`)
  assert.equal(newWorksActual.length, 37)
  assert.equal(editionActual.length, 465)
  assert.equal(editionRecordTruth.length, 465)
  assert.ok(recordOwnership.length > 0)
  assert.ok(sqlProvenance.length >= 6)
  assert.equal(workMaterialization.length, 37)
  assert.ok(workMaterialization.every(wm => wm.materializationStatus === 'MATERIALIZED'))
  assert.equal(delta.comparisons.phase16.traditions, 64)
  assert.equal(delta.comparisons.phase16.works, 225)
  assert.equal(delta.comparisons.phase16.editions, 465)
  assert.equal(traditionDepth.newTraditions.length, 11)
  assert.equal(recordReconciliation.totalNewWorks, 37)
  assert.equal(summary.totals.traditions, 64)
  assert.equal(summary.totals.works, 225)
  assert.equal(summary.totals.editions, 465)

  // Index Composition checks
  assert.ok(indexComposition.scripturalRecords > 0)
  assert.ok(indexComposition.rawRecords > 0)
  assert.ok(indexComposition.totalIndexed > 0)

  // DB Integrity checks
  assert.equal(dbIntegrityAudit.runtimeHardcodedCorpusMetrics, 0, 'Must have 0 hardcoded corpus metrics')
  assert.equal(dbIntegrityAudit.syntheticMultipliers, 0, 'Must have 0 synthetic multipliers')
  assert.equal(dbIntegrityAudit.registryDerivedRecordCounts, 0, 'Must have 0 registry-derived record counts')
  assert.equal(dbIntegrityAudit.fallbackRecordCounts, 0, 'Must have 0 fallback record counts')
  assert.ok(dbIntegrityAudit.actualSqlAggregations > 0)
  assert.equal(dbIntegrityAudit.actualRecordLevelMeasurements, 465)
  assert.equal(dbIntegrityAudit.measurementIntegrity, 'REAL_DATA')
  assert.equal(dbIntegrityAudit.status, 'PASS')
})

test('Fail-Closed: throws error if corpus database does not exist', async () => {
  const auditor = new CorpusDepthAuditor('/non/existent/path')
  await assert.rejects(
    async () => {
      await auditor.runAudit()
    },
    (err: Error) => {
      return err.message.includes('FAIL-CLOSED')
    }
  )
})

test('Static Source Inspection: ensures depth-auditor does not contain synthetic multipliers or forbidden patterns', async () => {
  const filePath = path.join(process.cwd(), 'packages/ingestion/src/depth/depth-auditor.ts')
  const content = await readFile(filePath, 'utf8')

  assert.ok(!content.includes('300 *'), 'depth-auditor.ts must not contain "300 *"')
  assert.ok(!content.includes('canonicalPositions: 300'), 'depth-auditor.ts must not contain "canonicalPositions: 300"')
  assert.ok(!content.includes('editionRecords: 300'), 'depth-auditor.ts must not contain "editionRecords: 300"')
  assert.ok(!content.includes('|| wEds.length'), 'depth-auditor.ts must not contain "|| wEds.length"')
  assert.ok(!content.includes('dbPassages * wEds.length'), 'depth-auditor.ts must not contain "dbPassages * wEds.length"')
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
