import assert from 'node:assert/strict'
import test from 'node:test'
import { MetadataEditionQueue } from './edition-queue.js'
import { EditionMaterializer } from './edition-materializer.js'
import { MaterializationAuditor } from './materialization-auditor.js'
import { validateMaterialization } from './materialization-validator.js'

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
  assert.ok(summary.materializedNew >= 100, `Must materialize at least 100 editions, got ${summary.materializedNew}`)
  assert.ok(summary.recordBearingEditions >= 150, `Must have >= 150 record-bearing editions, got ${summary.recordBearingEditions}`)
  assert.ok(summary.materializationPercent >= 60, `Materialization percentage must be >= 60%, got ${summary.materializationPercent}%`)

  // Verify distinct four metrics
  assert.equal(summary.canonicalPositionsBefore, 537051)
  assert.equal(summary.canonicalPositionsAfter, 537051)
  assert.ok(summary.editionRecordsAfter > summary.editionRecordsBefore)

  // Verify record-level provenance
  assert.ok(results.every(r => r.provenance && r.provenance.requestedUrl.length > 0))
  assert.ok(results.every(r => r.sourceSha256 && r.sourceSha256.length === 64))

  // Verify source contributions
  assert.ok(sourceContributions.length >= 20)
  assert.ok(sourceContributions.some(s => s.sourceId === 'tanzil' && s.materializedEditionCount! > 0))
})

test('Materialization Validator: validates hard materialization invariants', async () => {
  const result = await validateMaterialization(process.cwd())
  assert.equal(result.valid, true, `Materialization validation failed with: ${result.problems.join(', ')}`)
  assert.ok(result.totalEditions >= 250)
  assert.equal(result.canonicalRecords, 537051)
  assert.equal(result.problems.length, 0)
})
