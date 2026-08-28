import assert from 'node:assert/strict'
import test from 'node:test'
import { AlignmentEngine } from './alignment-engine.js'
import { validateEditions } from './alignment-validator.js'
import { buildAlignmentKey, buildEditionKey } from './alignment-key.js'

test('Alignment Key: builds deterministic alignment and edition keys', () => {
  const alignKey = buildAlignmentKey('quran', { workId: 'quran', surah: 2, ayah: 255 })
  assert.equal(alignKey, 'mw:align:quran:2:255')

  const edKey = buildEditionKey('quran', 'id', 'kemenag')
  assert.equal(edKey, 'mw:edition:quran:id:kemenag')
})

test('Alignment Engine: audits 200+ editions and validates multilingual alignment', async () => {
  const engine = new AlignmentEngine(process.cwd())
  const {
    alignmentReport,
    editionAuditReport,
    languageCoverageReport,
    editionCoverageReport
  } = await engine.runAlignment()

  assert.ok(editionAuditReport.totalEditions >= 200, `Total editions must be >= 200, got ${editionAuditReport.totalEditions}`)
  assert.equal(editionAuditReport.totalWorks, 104)
  assert.ok(editionAuditReport.worksWithMultipleEditions >= 50)
  assert.ok(editionAuditReport.worksWithMultipleLanguages >= 40)

  // Language coverage checks
  assert.ok(languageCoverageReport.totalLanguages >= 15, `Total languages must be >= 15, got ${languageCoverageReport.totalLanguages}`)
  assert.ok(languageCoverageReport.languages.some(l => l.isoCode === 'id'))
  assert.ok(languageCoverageReport.languages.some(l => l.isoCode === 'en'))
  assert.ok(languageCoverageReport.languages.some(l => l.isoCode === 'ar'))
  assert.ok(languageCoverageReport.languages.some(l => l.isoCode === 'he'))
  assert.ok(languageCoverageReport.languages.some(l => l.isoCode === 'grc'))
  assert.ok(languageCoverageReport.languages.some(l => l.isoCode === 'sa'))
  assert.ok(languageCoverageReport.languages.some(l => l.isoCode === 'pli'))

  // Multilingual alignment checks
  assert.ok(alignmentReport.totalWorksAligned > 0)
  assert.ok(alignmentReport.totalPositionsAligned > 0)
  assert.ok(alignmentReport.statusBreakdown.ALIGNED > 0)

  const quranAlignment = alignmentReport.alignments.find(a => a.workId === 'quran' && a.position === '2:255')
  assert.ok(quranAlignment)
  assert.ok(quranAlignment.editions.length >= 5)
  assert.ok(quranAlignment.editions.some(e => e.language === 'ar' && e.alignment === 'ALIGNED'))
  assert.ok(quranAlignment.editions.some(e => e.language === 'id' && e.alignment === 'ALIGNED'))
  assert.ok(quranAlignment.editions.some(e => e.language === 'en' && e.alignment === 'ALIGNED'))
})

test('Alignment Validator: validates hard edition invariants', async () => {
  const result = await validateEditions(process.cwd())
  assert.equal(result.valid, true, `Edition validation failed with: ${result.problems.join(', ')}`)
  assert.equal(result.totalWorks, 104)
  assert.ok(result.totalEditions >= 200)
  assert.ok(result.totalLanguages >= 15)
  assert.equal(result.problems.length, 0)
})
