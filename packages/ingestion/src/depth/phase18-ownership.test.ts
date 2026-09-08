import test from 'node:test'
import assert from 'node:assert/strict'
import { Phase18OwnershipAuditor } from './phase18-ownership-auditor.js'
import { validatePhase18Ownership } from './phase18-ownership-validator.js'

test('Phase 18 semantic accounting: mathematical ownership invariants and coverage percentages', async () => {
  const auditor = new Phase18OwnershipAuditor(process.cwd())
  const { summary } = await auditor.runAudit()

  const { total, owned, inferredWithEvidence, unresolved, strictOwnedCoveragePercent, resolvedOwnershipCoveragePercent } =
    summary.normalizedRecords

  // Invariant 1: Total partition conservation
  assert.equal(
    owned + inferredWithEvidence + unresolved,
    total,
    'owned + inferred + unresolved must strictly equal totalNormalizedRecords'
  )

  // Invariant 2: Mathematical correctness of strictOwnedCoveragePercent
  const expectedStrict = Number(((owned / total) * 100).toFixed(4))
  assert.equal(
    strictOwnedCoveragePercent,
    expectedStrict,
    'strictOwnedCoveragePercent must be exactly owned / total * 100'
  )
  assert.ok(strictOwnedCoveragePercent >= 0 && strictOwnedCoveragePercent <= 100, 'strict coverage must be in [0, 100]')

  // Invariant 3: Mathematical correctness of resolvedOwnershipCoveragePercent
  const expectedResolved = Number((((owned + inferredWithEvidence) / total) * 100).toFixed(4))
  assert.equal(
    resolvedOwnershipCoveragePercent,
    expectedResolved,
    'resolvedOwnershipCoveragePercent must be exactly (owned + inferred) / total * 100'
  )
  assert.ok(
    resolvedOwnershipCoveragePercent >= 0 && resolvedOwnershipCoveragePercent <= 100,
    'resolved coverage must be in [0, 100]'
  )
  assert.ok(
    resolvedOwnershipCoveragePercent >= strictOwnedCoveragePercent,
    'resolved coverage must be >= strict coverage'
  )
})

test('Phase 18 semantic accounting: source witness independent measurement and validity', async () => {
  const auditor = new Phase18OwnershipAuditor(process.cwd())
  const { summary } = await auditor.runAudit()

  const { sourceCount, sourceWitnessCount, independentMeasurement, witnesses } = summary.sourceWitnessAccounting

  assert.ok(independentMeasurement, 'source witnesses must be independently measured from SQLite persisted records')
  assert.ok(sourceWitnessCount > 0, 'source witness count must be > 0')
  assert.notEqual(sourceWitnessCount, 1, 'source witness count must not be a trivial fallback of 1')
  assert.equal(witnesses.length, sourceWitnessCount, 'witness array length must equal sourceWitnessCount')

  // Invariant: Every witness must have non-empty valid IDs
  for (const w of witnesses) {
    assert.ok(w.witnessId.startsWith('mw:witness:'), `witness ID ${w.witnessId} must start with mw:witness:`)
    assert.ok(w.sourceId.length > 0, `witness ${w.witnessId} must have non-empty sourceId`)
    assert.ok(w.workId.length > 0, `witness ${w.witnessId} must have non-empty workId`)
    assert.ok(w.editionId.length > 0, `witness ${w.witnessId} must have non-empty editionId`)
    assert.ok(w.recordCount > 0, `witness ${w.witnessId} must have recordCount > 0`)
    assert.ok(w.uniquePayloadCount > 0, `witness ${w.witnessId} must have uniquePayloadCount > 0`)
  }

  assert.ok(summary.invariants.sourceWitnessesValid, 'all witnesses must reference valid sources, works, and editions')
})

test('Phase 18 semantic accounting: unique payload COUNT(DISTINCT) formula and non-null guarantees', async () => {
  const auditor = new Phase18OwnershipAuditor(process.cwd())
  const { summary } = await auditor.runAudit()

  const { globalUniquePayloads, recordsWithPayloadHash, recordsWithoutPayloadHash, payloadFormula, perWork, perEdition } =
    summary.payloadAccounting

  // Must strictly use COUNT(DISTINCT normalized_text_hash), never SUM
  assert.equal(payloadFormula, 'COUNT(DISTINCT normalized_text_hash)')
  assert.ok(globalUniquePayloads > 0, 'global unique payloads must be > 0')
  assert.equal(recordsWithoutPayloadHash, 0, 'all normalized records must possess a cryptographic payload hash')
  assert.equal(recordsWithPayloadHash, summary.normalizedRecords.total, 'recordsWithPayloadHash must equal total records')

  // Verify per-work payload metrics
  assert.ok(perWork.length > 0, 'perWork unique payloads list must not be empty')
  for (const pw of perWork) {
    assert.ok(pw.workId.length > 0, 'workId must not be empty')
    assert.ok(pw.uniquePayloadCount > 0, `work ${pw.workId} uniquePayloadCount must be > 0`)
    assert.ok(pw.uniquePayloadCount <= pw.recordCount, `work ${pw.workId} unique payloads must be <= total records`)
  }

  // Verify per-edition payload metrics
  assert.ok(perEdition.length > 0, 'perEdition unique payloads list must not be empty')
  for (const pe of perEdition) {
    assert.ok(pe.editionId.length > 0, 'editionId must not be empty')
    assert.ok(pe.uniquePayloadCount > 0, `edition ${pe.editionId} uniquePayloadCount must be > 0`)
    assert.ok(pe.uniquePayloadCount <= pe.recordCount, `edition ${pe.editionId} unique payloads must be <= total records`)
  }
})

test('Phase 18 validation: full semantic validator returns valid with 0 problems', async () => {
  const result = await validatePhase18Ownership(process.cwd())
  assert.equal(result.valid, true, `Phase 18 validator must pass. Problems: ${result.problems.join(', ')}`)
  assert.equal(result.problems.length, 0)
  assert.equal(result.syntheticCountCalculations, 0)
  assert.equal(result.distributionSanity, true)
})
