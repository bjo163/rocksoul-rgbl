import assert from 'node:assert/strict'
import test from 'node:test'
import { MetadataEditionQueue } from './edition-queue.js'
import { EditionMaterializer } from './edition-materializer.js'
import { MaterializationAuditor } from './materialization-auditor.js'
import { validateMaterialization } from './materialization-validator.js'
import { MaterializationReconciler } from './materialization-reconciler.js'

test('Metadata Edition Queue: builds prioritized work queue', async () => {
  const queue = new MetadataEditionQueue(process.cwd())
  const items = await queue.buildQueue()

  assert.ok(items.length >= 166, `Must contain at least 166 queue items, got ${items.length}`)
  assert.ok(items.some(i => i.priority === 'P0'), 'Must have P0 official/institutional items')
  assert.ok(items.some(i => i.priority === 'P1'), 'Must have P1 academic items')
  assert.ok(items.some(i => i.priority === 'P2'), 'Must have P2 community items')

  // Invariant: P0 items come before P4 items
  const p0Index = items.findIndex(i => i.priority === 'P0')
  const p4Index = items.findIndex(i => i.priority === 'P4')
  if (p4Index !== -1) {
    assert.ok(p0Index < p4Index, 'P0 items must precede P4 items')
  }
})

test('Edition Materializer: supports dry-run mode without downloading corpus data', async () => {
  const materializer = new EditionMaterializer(process.cwd())
  const { results, summary } = await materializer.executeMaterialization({ dryRun: true })

  assert.ok(results.length >= 166)
  assert.ok(results.every(r => r.status === 'REMOTE_READY'), 'Dry run must mark items as REMOTE_READY without downloading')
  assert.equal(summary.materializedNew, 0, 'Dry run must not increment materializedNew')
})

test('Edition Materializer: materializes metadata editions into verified corpus records', async () => {
  const materializer = new EditionMaterializer(process.cwd())
  const { results, recordCounts, summary, sourceContributions } = await materializer.executeMaterialization()

  assert.ok(results.length >= 166)
  assert.equal(summary.materializedNew, 0, 'Discovery must not manufacture new records')
  assert.equal(summary.recordBearingEditions, 38)
  assert.ok(summary.materializationPercent > 0 && summary.materializationPercent < 100)

  // Verify distinct four metrics
  assert.equal(summary.canonicalPositionsBefore, 0)
  assert.equal(summary.canonicalPositionsAfter, 0)
  assert.ok(summary.editionRecordsAfter > 0)

  // Verify record-level provenance
  assert.ok(results.every(r => r.provenance))
  assert.ok(results.filter(r => r.records > 0).every(r => r.sourceSha256 && r.sourceSha256.length === 64))

  // Verify source contributions
  assert.ok(sourceContributions.length >= 20)
  assert.ok(sourceContributions.some(s => s.sourceId === 'tanzil' && s.materializedEditionCount! > 0))
})

test('Materialization Validator: validates hard materialization invariants', async () => {
  const result = await validateMaterialization(process.cwd())
  assert.equal(result.valid, true, `Materialization validation failed with: ${result.problems.join(', ')}`)
  assert.ok(result.totalEditions >= 300)
  assert.equal(result.canonicalRecords, 239745)
  assert.equal(result.problems.length, 0)
})

test('Materialization Reconciler: reconciles all registered editions and maintains 0 lost editions', async () => {
  const reconciler = new MaterializationReconciler(process.cwd())
  const results = await reconciler.runReconciliation()

  assert.ok(results.baseline.editions >= 321)
  assert.ok(results.allEditionRecords.length >= 321)
  assert.ok(results.newEditions.length >= 98)
  assert.equal(results.canonicalRegression.unchanged, 537051)
  assert.equal(results.canonicalRegression.removed, 0)
  assert.equal(results.canonicalRegression.collisions, 0)
  assert.equal(results.placeholderAudit.placeholderContamination, 0)
  assert.equal(results.hashAudit.verified, true)
})
