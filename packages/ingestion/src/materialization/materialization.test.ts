import assert from 'node:assert/strict'
import test from 'node:test'
import { MaterializationAuditor } from './materialization-auditor.js'
import { validateMaterialization } from './materialization-validator.js'

test('Materialization Auditor: audits all 223 editions and classifies materialization status', async () => {
  const auditor = new MaterializationAuditor(process.cwd())
  const {
    auditRecords,
    zeroRecordEditions,
    recordReconciliations,
    canonicalOwnership,
    workLanguageMaterializations,
    summary,
    growthReport,
    sourceContributions
  } = await auditor.runAudit()

  assert.equal(auditRecords.length, 223, 'All 223 editions must be audited')
  assert.equal(summary.totalEditions, 223)

  // Verify breakdown
  assert.ok(summary.full > 0, `Must have full materialized editions, got ${summary.full}`)
  assert.ok(summary.partial > 0, `Must have partial editions, got ${summary.partial}`)
  assert.ok(summary.metadataOnly > 0, `Must expose metadata-only editions, got ${summary.metadataOnly}`)
  assert.equal(summary.full + summary.partial + summary.metadataOnly + summary.notAcquired + summary.failed + summary.unavailable, 223)

  // Zero-record editions must match metadata-only count
  assert.equal(zeroRecordEditions.length, summary.metadataOnly)

  // Growth report explanations
  assert.equal(growthReport.currentCanonicalRecords, 537051)
  assert.equal(growthReport.currentEditions, 223)
  assert.ok(growthReport.growthExplanation.length > 50)

  // Canonical ownership mappings
  assert.ok(canonicalOwnership.length > 0)
  assert.ok(canonicalOwnership.some(o => o.canonicalId === 'mw:quran:2:255'))
  assert.ok(canonicalOwnership.some(o => o.canonicalId === 'mw:tanakh:genesis:1:1'))

  // Source contribution report
  assert.ok(sourceContributions.length >= 20)
  assert.ok(sourceContributions.some(s => s.sourceId === 'tanzil' && s.canonicalRecordCount > 0))
  assert.ok(sourceContributions.some(s => s.sourceId === 'openscriptures' && s.canonicalRecordCount > 0))
})

test('Materialization Validator: validates hard materialization invariants', async () => {
  const result = await validateMaterialization(process.cwd())
  assert.equal(result.valid, true, `Materialization validation failed with: ${result.problems.join(', ')}`)
  assert.equal(result.totalEditions, 223)
  assert.equal(result.canonicalRecords, 537051)
  assert.equal(result.problems.length, 0)
})
