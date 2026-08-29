import { Phase18OwnershipAuditor } from './phase18-ownership-auditor.js'

export interface Phase18OwnershipValidationResult {
  valid: boolean
  problems: string[]
  totalNormalizedRecords: number
  ownedRecords: number
  inferredRecords: number
  unresolvedRecords: number
  ownershipCoveragePercent: number
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

  if (summary.normalizedRecords.coveragePercent < 90) {
    problems.push(`Expected >= 90% ownership coverage, got ${summary.normalizedRecords.coveragePercent}%`)
  }

  if (summary.editionMeasurement.totalEditions < 500) {
    problems.push(`Expected >= 500 total editions, got ${summary.editionMeasurement.totalEditions}`)
  }

  // Invariant 1: zero + positive === measured
  if (summary.editionMeasurement.zeroRecordEditions + summary.editionMeasurement.positiveRecordEditions !== summary.editionMeasurement.measuredEditions) {
    problems.push(
      `Invariant failed: zeroRecordEditions (${summary.editionMeasurement.zeroRecordEditions}) + positiveRecordEditions (${summary.editionMeasurement.positiveRecordEditions}) !== measuredEditions (${summary.editionMeasurement.measuredEditions})`
    )
  }

  // Invariant 2: measured + unmeasurable === total
  if (summary.editionMeasurement.measuredEditions + summary.editionMeasurement.unmeasurableEditions !== summary.editionMeasurement.totalEditions) {
    problems.push(
      `Invariant failed: measuredEditions (${summary.editionMeasurement.measuredEditions}) + unmeasurableEditions (${summary.editionMeasurement.unmeasurableEditions}) !== totalEditions (${summary.editionMeasurement.totalEditions})`
    )
  }

  // Invariant 3: sampleSize === measuredEditions
  if (summary.distributionSample.sampleSize !== summary.editionMeasurement.measuredEditions) {
    problems.push(
      `Sample size mismatch: distribution sampleSize (${summary.distributionSample.sampleSize}) !== measuredEditions (${summary.editionMeasurement.measuredEditions})`
    )
  }

  // Invariant 4: Distribution sanity
  if (!summary.distributionSample.sanityCheck) {
    problems.push(`Distribution sanity failed: min <= p25 <= median <= p75 <= p90 <= max is false`)
  }

  // Invariant 5: Zero synthetic calculations
  if (summary.integrityAudit.syntheticMultipliers > 0 || summary.integrityAudit.hardcodedCorpusMetrics > 0) {
    problems.push(`Found synthetic multipliers or hardcoded corpus metrics in ownership auditor`)
  }

  return {
    valid: problems.length === 0,
    problems,
    totalNormalizedRecords: summary.normalizedRecords.total,
    ownedRecords: summary.normalizedRecords.owned,
    inferredRecords: summary.normalizedRecords.inferredWithEvidence,
    unresolvedRecords: summary.normalizedRecords.unresolved,
    ownershipCoveragePercent: summary.normalizedRecords.coveragePercent,
    totalEditions: summary.editionMeasurement.totalEditions,
    measuredEditions: summary.editionMeasurement.measuredEditions,
    positiveRecordEditions: summary.editionMeasurement.positiveRecordEditions,
    zeroRecordEditions: summary.editionMeasurement.zeroRecordEditions,
    unmeasurableEditions: summary.editionMeasurement.unmeasurableEditions,
    distributionSanity: summary.distributionSample.sanityCheck,
    syntheticCountCalculations: summary.integrityAudit.syntheticMultipliers + summary.integrityAudit.hardcodedCorpusMetrics
  }
}
