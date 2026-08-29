import { Phase18OwnershipAuditor } from './phase18-ownership-auditor.js'

export interface Phase18OwnershipValidationResult {
  valid: boolean
  problems: string[]
  totalNormalizedRecords: number
  ownedRecords: number
  inferredRecords: number
  unresolvedRecords: number
  strictOwnedCoveragePercent: number
  resolvedOwnershipCoveragePercent: number
  sourceCount: number
  sourceWitnessCount: number
  independentMeasurement: boolean
  globalUniquePayloads: number
  recordsWithPayloadHash: number
  recordsWithoutPayloadHash: number
  totalEditions: number
  measuredEditions: number
  positiveRecordEditions: number
  zeroRecordEditions: number
  unmeasurableEditions: number
  distributionSanity: boolean
  syntheticCountCalculations: number
}

export async function validatePhase18Ownership(rootDir: string = process.cwd()): Promise<Phase18OwnershipValidationResult> {
  const auditor = new Phase18OwnershipAuditor(rootDir)
  const { summary } = await auditor.runAudit()

  const problems: string[] = []

  if (summary.normalizedRecords.total < 200000) {
    problems.push(`Expected >= 200,000 normalized records, got ${summary.normalizedRecords.total}`)
  }

  // Invariant 1: owned + inferred + unresolved === total
  if (
    summary.normalizedRecords.owned +
      summary.normalizedRecords.inferredWithEvidence +
      summary.normalizedRecords.unresolved !==
    summary.normalizedRecords.total
  ) {
    problems.push(
      `Invariant failed: owned (${summary.normalizedRecords.owned}) + inferred (${summary.normalizedRecords.inferredWithEvidence}) + unresolved (${summary.normalizedRecords.unresolved}) !== total (${summary.normalizedRecords.total})`
    )
  }

  // Invariant 2: strictOwnedCoveragePercent calculation & bounds
  const calculatedStrict = (summary.normalizedRecords.owned / summary.normalizedRecords.total) * 100
  if (Math.abs(summary.normalizedRecords.strictOwnedCoveragePercent - calculatedStrict) > 0.001) {
    problems.push(
      `Invariant failed: strictOwnedCoveragePercent (${summary.normalizedRecords.strictOwnedCoveragePercent}) !== calculated (${calculatedStrict})`
    )
  }
  if (summary.normalizedRecords.strictOwnedCoveragePercent < 0 || summary.normalizedRecords.strictOwnedCoveragePercent > 100) {
    problems.push(`Strict owned coverage percent out of bounds: ${summary.normalizedRecords.strictOwnedCoveragePercent}%`)
  }

  // Invariant 3: resolvedOwnershipCoveragePercent calculation & bounds
  const calculatedResolved =
    ((summary.normalizedRecords.owned + summary.normalizedRecords.inferredWithEvidence) / summary.normalizedRecords.total) * 100
  if (Math.abs(summary.normalizedRecords.resolvedOwnershipCoveragePercent - calculatedResolved) > 0.001) {
    problems.push(
      `Invariant failed: resolvedOwnershipCoveragePercent (${summary.normalizedRecords.resolvedOwnershipCoveragePercent}) !== calculated (${calculatedResolved})`
    )
  }
  if (summary.normalizedRecords.resolvedOwnershipCoveragePercent < 0 || summary.normalizedRecords.resolvedOwnershipCoveragePercent > 100) {
    problems.push(`Resolved ownership coverage percent out of bounds: ${summary.normalizedRecords.resolvedOwnershipCoveragePercent}%`)
  }

  if (summary.editionMeasurement.totalEditions < 500) {
    problems.push(`Expected >= 500 total editions, got ${summary.editionMeasurement.totalEditions}`)
  }

  // Invariant 4: zero + positive === measured
  if (
    summary.editionMeasurement.zeroRecordEditions + summary.editionMeasurement.positiveRecordEditions !==
    summary.editionMeasurement.measuredEditions
  ) {
    problems.push(
      `Invariant failed: zeroRecordEditions (${summary.editionMeasurement.zeroRecordEditions}) + positiveRecordEditions (${summary.editionMeasurement.positiveRecordEditions}) !== measuredEditions (${summary.editionMeasurement.measuredEditions})`
    )
  }

  // Invariant 5: measured + unmeasurable === total
  if (
    summary.editionMeasurement.measuredEditions + summary.editionMeasurement.unmeasurableEditions !==
    summary.editionMeasurement.totalEditions
  ) {
    problems.push(
      `Invariant failed: measuredEditions (${summary.editionMeasurement.measuredEditions}) + unmeasurableEditions (${summary.editionMeasurement.unmeasurableEditions}) !== totalEditions (${summary.editionMeasurement.totalEditions})`
    )
  }

  // Invariant 6: sampleSize === measuredEditions
  if (summary.distributionSample.sampleSize !== summary.editionMeasurement.measuredEditions) {
    problems.push(
      `Sample size mismatch: distribution sampleSize (${summary.distributionSample.sampleSize}) !== measuredEditions (${summary.editionMeasurement.measuredEditions})`
    )
  }

  // Invariant 7: Distribution sanity
  if (!summary.distributionSample.sanityCheck) {
    problems.push('Distribution sanity failed: min <= p25 <= median <= p75 <= p90 <= max is false')
  }

  // Invariant 8: Source witness validation
  if (!summary.invariants.sourceWitnessesValid) {
    problems.push('Source witness validation failed: some witnesses reference non-existent source, work, or edition')
  }

  // Invariant 9: Payload formula
  if (summary.payloadAccounting.payloadFormula !== 'COUNT(DISTINCT normalized_text_hash)') {
    problems.push(`Invalid payload formula: expected COUNT(DISTINCT normalized_text_hash), got ${summary.payloadAccounting.payloadFormula}`)
  }

  // Invariant 10: Zero synthetic calculations
  if (summary.integrityAudit.syntheticMultipliers > 0 || summary.integrityAudit.hardcodedCorpusMetrics > 0) {
    problems.push('Found synthetic multipliers or hardcoded corpus metrics in ownership auditor')
  }

  return {
    valid: problems.length === 0,
    problems,
    totalNormalizedRecords: summary.normalizedRecords.total,
    ownedRecords: summary.normalizedRecords.owned,
    inferredRecords: summary.normalizedRecords.inferredWithEvidence,
    unresolvedRecords: summary.normalizedRecords.unresolved,
    strictOwnedCoveragePercent: summary.normalizedRecords.strictOwnedCoveragePercent,
    resolvedOwnershipCoveragePercent: summary.normalizedRecords.resolvedOwnershipCoveragePercent,
    sourceCount: summary.sourceWitnessAccounting.sourceCount,
    sourceWitnessCount: summary.sourceWitnessAccounting.sourceWitnessCount,
    independentMeasurement: summary.sourceWitnessAccounting.independentMeasurement,
    globalUniquePayloads: summary.payloadAccounting.globalUniquePayloads,
    recordsWithPayloadHash: summary.payloadAccounting.recordsWithPayloadHash,
    recordsWithoutPayloadHash: summary.payloadAccounting.recordsWithoutPayloadHash,
    totalEditions: summary.editionMeasurement.totalEditions,
    measuredEditions: summary.editionMeasurement.measuredEditions,
    positiveRecordEditions: summary.editionMeasurement.positiveRecordEditions,
    zeroRecordEditions: summary.editionMeasurement.zeroRecordEditions,
    unmeasurableEditions: summary.editionMeasurement.unmeasurableEditions,
    distributionSanity: summary.distributionSample.sanityCheck,
    syntheticCountCalculations: summary.integrityAudit.syntheticMultipliers + summary.integrityAudit.hardcodedCorpusMetrics
  }
}
