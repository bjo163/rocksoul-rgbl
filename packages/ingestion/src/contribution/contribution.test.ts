import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { EditionContributionAuditor } from './edition-contribution-auditor.js'
import { validateContributions } from './contribution-validator.js'

test('Edition Contribution Auditor: classifies all editions into contribution types and categories', async () => {
  const auditor = new EditionContributionAuditor(process.cwd())
  const { contributions, summary, positionMatrix, languageDepth, sourceDepth, workDepth, traditionDepth } =
    await auditor.runAudit()

  assert.ok(contributions.length >= 370, `Expected >= 370 editions, got ${contributions.length}`)
  assert.ok(summary.uniqueCorpusContribution > 0)
  assert.ok(summary.additionalLanguage > 0)
  assert.ok(summary.additionalSourceWitness >= 0)
  assert.equal(summary.duplicateMirror, 0)
  assert.equal(summary.unresolved, 0)

  assert.ok(positionMatrix.length >= 10)
  assert.ok(languageDepth.totalWorks >= 188)
  assert.ok(sourceDepth.totalSources >= 34)
  assert.ok(workDepth.totalWorks >= 188)
  assert.ok(traditionDepth.totalTraditions >= 53)

  // Verify all editions have valid normalizedTextHash and no negative counts
  for (const c of contributions) {
    assert.ok(c.normalizedTextHash.length === 64)
    assert.ok(c.rawRecords >= 0)
    assert.ok(c.editionRecords >= 0)
  }
})

test('Contribution Validator: validates hard invariants for Phase 14 depth audit', async () => {
  const result = await validateContributions(process.cwd())

  assert.equal(result.valid, true, `Contribution validation failed with problems: ${result.problems.join(', ')}`)
  assert.ok(result.totalEditions >= 370)
  assert.equal(result.problems.length, 0)
  assert.ok(result.uniqueCorpusContribution > 0)
  assert.ok(result.additionalLanguage > 0)
})
