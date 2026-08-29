import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { CorpusDepthAuditor } from './depth-auditor.js'
import { validateDepth } from './depth-validator.js'

test('Corpus Depth Auditor: audits 37 Phase 15 new works with strict semantic accounting', async () => {
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
    dataModelLimitations,
    summary
  } = await auditor.runAudit()

  assert.ok(newWorks.length >= 37, `Expected >= 37 new works, got ${newWorks.length}`)
  assert.equal(editionActual.length, summary.totals.editions)
  assert.equal(editionRecordTruth.length, summary.totals.editions)
  assert.ok(recordOwnership.length > 0)
  assert.ok(sqlProvenance.length >= 6)
  assert.ok(workMaterialization.length >= 37)
  assert.ok(workMaterialization.every(wm => wm.materializationStatus === 'MATERIALIZED'))
  assert.equal(summary.totals.traditions, 76)
  assert.equal(summary.totals.works, 267)
  assert.equal(summary.totals.editions, 550)

  // Materialization vs Measurement
  assert.equal(summary.materialization.materializedEditions, 550)
  assert.equal(summary.measurement.measuredEditions, 44)
  assert.equal(summary.measurement.unmeasurableEditions, 506)
  assert.equal(summary.measurement.zeroRecordEditions, 0)
  assert.equal(summary.measurement.positiveRecordEditions, 44)

  // Semantic Invariants
  assert.equal(
    summary.measurement.zeroRecordEditions + summary.measurement.positiveRecordEditions,
    summary.measurement.measuredEditions,
    'zero + positive === measured'
  )
  assert.equal(
    summary.measurement.measuredEditions + summary.measurement.unmeasurableEditions,
    summary.totals.editions,
    'measured + unmeasurable === total'
  )
  assert.equal(
    summary.distributionSample.sampleSize,
    summary.measurement.measuredEditions,
    'sampleSize === measuredEditions'
  )
  assert.equal(
    summary.distributionSample.sanityCheck,
    true,
    'min <= p25 <= median <= p75 <= p90 <= max must be true'
  )

  // Limitations Report
  assert.equal(dataModelLimitations.editionLevelOwnership.measurableEditions, 44)
  assert.equal(dataModelLimitations.editionLevelOwnership.unmeasurableEditions, 506)

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
  assert.equal(dbIntegrityAudit.actualRecordLevelMeasurements, 550)
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

test('Distinct Edition Record Counts: proves editions have individual record counts, not uniform copies', async () => {
  const auditor = new CorpusDepthAuditor(process.cwd())
  const { editionRecordTruth } = await auditor.runAudit()

  const measured = editionRecordTruth.filter(e => e.measurementState === 'MEASURED')
  assert.equal(measured.length, 44, 'Must have 44 measured editions')

  const uniqueCounts = new Set(measured.map(e => e.actualRecordCount))
  assert.ok(uniqueCounts.size > 5, 'Measured editions must have diverse, genuine counts')
})

test('Depth Validator: validates hard invariants for Phase 16 depth expansion and rejects synthetic calculations', async () => {
  const result = await validateDepth(process.cwd())

  assert.equal(result.valid, true, `Depth validation failed with problems: ${result.problems.join(', ')}`)
  assert.equal(result.totalTraditions, 76)
  assert.equal(result.totalWorks, 267)
  assert.equal(result.totalEditions, 550)
  assert.equal(result.materializedEditions, 550)
  assert.equal(result.measuredEditions, 44)
  assert.equal(result.unmeasurableEditions, 506)
  assert.equal(result.distributionSampleSize, 44)
  assert.ok(result.phase15NewWorks >= 37)
  assert.equal(result.phase15NewEditions, 74)
  assert.equal(result.syntheticCountCalculations, 0)
  assert.equal(result.problems.length, 0)
})
