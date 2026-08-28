import assert from 'node:assert/strict'
import test from 'node:test'
import { CorpusAuditor } from './corpus-auditor.js'
import { validateCorpus } from './corpus-validator.js'

test('Corpus Auditor: audits all 58 canonical works and computes quality scores', async () => {
  const auditor = new CorpusAuditor(process.cwd())
  const { auditRecords, placeholderAudits, comparisons, qualityReport } = await auditor.runAudit()

  assert.equal(auditRecords.length, 58, 'All 58 works must be audited')
  assert.ok(qualityReport.averageScore >= 80, `Average quality score must be at least 80, got ${qualityReport.averageScore}`)
  assert.equal(qualityReport.totalWorks, 58)

  // Verify all grade counts sum to total works
  const totalGraded = qualityReport.gradeBreakdown.A + qualityReport.gradeBreakdown.B + qualityReport.gradeBreakdown.C + qualityReport.gradeBreakdown.D + qualityReport.gradeBreakdown.F
  assert.equal(totalGraded, 58)

  // Verify placeholders
  assert.ok(placeholderAudits.length > 0)
  assert.ok(placeholderAudits.every(p => p.safe))

  // Verify cross-source comparisons
  assert.ok(comparisons.length >= 4)
  assert.ok(comparisons.some(c => c.workId === 'quran'))
  assert.ok(comparisons.some(c => c.workId === 'tanakh'))
  assert.ok(comparisons.some(c => c.workId === 'greek-new-testament'))
})

test('Corpus Validator: validates hard corpus invariants', async () => {
  const result = await validateCorpus(process.cwd())
  assert.equal(result.valid, true, `Validation failed with errors: ${result.problems.join(', ')}`)
  assert.equal(result.totalWorks, 58)
  assert.equal(result.healthyWorks, 58)
  assert.equal(result.problems.length, 0)
})
