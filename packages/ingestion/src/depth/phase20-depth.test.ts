import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { Phase20DepthAuditor } from './phase20-depth-auditor.js'

test('Phase 20 Depth Auditor: audits new-tradition and new-work corpus depth with strict data provenance', async () => {
  const auditor = new Phase20DepthAuditor(process.cwd())
  const summary = await auditor.runAudit()

  // 1. Baseline invariants
  assert.equal(summary.baseline.traditions, 90)
  assert.equal(summary.baseline.works, 297)
  assert.equal(summary.baseline.editions, 618)
  assert.equal(summary.baseline.languages, 91)
  assert.equal(summary.baseline.sources, 54)
  assert.equal(summary.baseline.endpoints, 308)

  // 2. Phase 19 Delta invariants
  assert.equal(summary.phase19Delta.traditions.length, 14)
  assert.ok(summary.phase19Delta.works.length >= 30)
  assert.equal(summary.phase19Delta.sources.length, 7)
  assert.equal(summary.phase19Delta.languages.length, 19)

  // 3. Work depth integrity
  assert.ok(summary.workDepth.length >= 30)
  for (const wd of summary.workDepth) {
    assert.ok(wd.workId.length > 0)
    assert.ok(wd.traditionId.length > 0)
    assert.ok(wd.editionCount >= 1)
    assert.ok(wd.maturityFlags.length >= 1)
  }

  // 4. Tradition depth integrity
  assert.equal(summary.traditionDepth.length, 14)
  for (const td of summary.traditionDepth) {
    assert.ok(td.workCount >= 1)
    assert.ok(td.editionCount >= 1)
    assert.ok(td.languageCount >= 1)
  }

  // 5. Ownership breakdown & invariants
  const own = summary.depthScorecard.ownershipDepth
  assert.ok(own.totalNormalizedRecords > 200_000)
  assert.equal(own.ownedRecords + own.inferredRecords + own.unresolvedRecords, own.totalNormalizedRecords)
  const expectedStrictOwned = Number(((own.ownedRecords / own.totalNormalizedRecords) * 100).toFixed(4))
  const expectedResolvedOwnership = Number((((own.ownedRecords + own.inferredRecords) / own.totalNormalizedRecords) * 100).toFixed(4))
  assert.equal(own.strictOwnedCoveragePercent, expectedStrictOwned)
  assert.equal(own.resolvedOwnershipCoveragePercent, expectedResolvedOwnership)

  // 6. SQL Provenance completeness
  assert.ok(summary.sqlProvenance.length >= 8)
  assert.ok(summary.sqlProvenance.every((sp) => sp.query.length > 0 && sp.tables.length > 0))

  // 7. Quality engine consistency
  assert.equal(summary.quality.modelVersion, 'v1.0.0-canonical-corpus-auditor')
  assert.equal(summary.quality.gradeBreakdown.A, 0)
  assert.equal(summary.quality.gradeBreakdown.B, 5)
  assert.equal(summary.quality.gradeBreakdown.F, 0)
  assert.ok(summary.quality.mean > 70 && summary.quality.mean < 75)
})
