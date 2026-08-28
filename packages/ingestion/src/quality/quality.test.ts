import assert from 'node:assert/strict'
import test from 'node:test'
import { CorpusAuditor } from './corpus-auditor.js'
import { validateCorpus } from './corpus-validator.js'

test('Corpus Auditor: audits all 104 works and computes evidence-based quality scores with variance', async () => {
  const auditor = new CorpusAuditor(process.cwd())
  const { auditRecords, placeholderAudits, comparisons, qualityReport, scoreDistribution } = await auditor.runAudit()

  assert.ok(auditRecords.length >= 104, 'All works must be audited')
  assert.ok(qualityReport.totalWorks >= 104)

  // Verify that score distribution has real variance (no scoring distribution collapse)
  assert.equal(scoreDistribution.scoringDistributionCollapse, false, 'Score distribution must not collapse to a single constant')
  assert.ok(scoreDistribution.standardDeviation > 0, `Standard deviation must be > 0, got ${scoreDistribution.standardDeviation}`)
  assert.ok(scoreDistribution.max > scoreDistribution.min, `Max score (${scoreDistribution.max}) must be greater than Min score (${scoreDistribution.min})`)

  // Check top tier live synced works score high
  const quranAudit = auditRecords.find(r => r.workId === 'quran')
  assert.ok(quranAudit, 'Quran audit record must exist')
  assert.ok(quranAudit.technicalQualityScore >= 75, `Quran score must be >= 75, got ${quranAudit.technicalQualityScore}`)
  assert.ok(['A', 'B', 'C'].includes(quranAudit.qualityGrade))

  // Check components are individually computed
  assert.ok(quranAudit.components.sourceVerified > 0)
  assert.ok(quranAudit.components.recordsNonEmpty > 0)
  assert.ok(quranAudit.components.provenanceComplete > 0)
  assert.ok(quranAudit.components.sha256Verified > 0)
  assert.ok(quranAudit.components.parserValidated > 0)
  assert.ok(quranAudit.components.schemaValidated > 0)
  assert.ok(quranAudit.components.duplicateSafety > 0)
  assert.ok(quranAudit.components.sourceAuthority > 0)

  // Verify grade counts sum to total works
  const totalGraded =
    qualityReport.gradeBreakdown.A +
    qualityReport.gradeBreakdown.B +
    qualityReport.gradeBreakdown.C +
    qualityReport.gradeBreakdown.D +
    qualityReport.gradeBreakdown.F
  assert.equal(totalGraded, qualityReport.totalWorks)

  // Verify placeholders
  assert.ok(placeholderAudits.length > 0)
  assert.ok(placeholderAudits.every(p => p.safe))

  // Verify cross-source comparison compatibility
  assert.ok(comparisons.length >= 5)
  const comparableQuran = comparisons.find(c => c.workId === 'quran' && c.classification === 'IDENTICAL')
  assert.ok(comparableQuran)
  assert.equal(comparableQuran.eligibility, 'COMPARABLE')

  const nonComparable = comparisons.find(c => c.eligibility === 'NOT_COMPARABLE')
  assert.ok(nonComparable, 'Must identify non-comparable cross-source queries')
  assert.equal(nonComparable.reason, 'different_work_identity')
})

test('Corpus Validator: validates hard corpus and quality invariants', async () => {
  const result = await validateCorpus(process.cwd())
  assert.equal(result.valid, true, `Validation failed with errors: ${result.problems.join(', ')}`)
  assert.ok(result.totalWorks >= 104)
  assert.ok(result.healthyWorks >= 104)
  assert.equal(result.scoringDistributionCollapse, false)
  assert.equal(result.problems.length, 0)
})
