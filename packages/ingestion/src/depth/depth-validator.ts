import { CorpusDepthAuditor } from './depth-auditor.js'
import type { DepthValidationResult } from './types.js'

export async function validateDepth(rootDir: string = process.cwd()): Promise<DepthValidationResult> {
  const auditor = new CorpusDepthAuditor(rootDir)
  const { summary, newWorks, dbIntegrityAudit } = await auditor.runAudit()

  const problems: string[] = []

  if (summary.totals.traditions < 60) {
    problems.push(`Expected >= 60 traditions, got ${summary.totals.traditions}`)
  }

  if (summary.totals.works < 220) {
    problems.push(`Expected >= 220 works, got ${summary.totals.works}`)
  }

  if (summary.totals.editions < 450) {
    problems.push(`Expected >= 450 editions, got ${summary.totals.editions}`)
  }

  if (newWorks.length < 35) {
    problems.push(`Expected >= 35 Phase 15 new works, got ${newWorks.length}`)
  }

  // Materialization vs Measurement semantics
  if (summary.materialization.materializedEditions !== summary.totals.editions) {
    problems.push(
      `Materialized editions (${summary.materialization.materializedEditions}) !== total editions (${summary.totals.editions})`
    )
  }

  // Measurement invariants
  const accounted = summary.measurement.measuredEditions + summary.measurement.unmeasurableEditions
  if (accounted !== summary.totals.editions) {
    problems.push(
      `Measurement accounting mismatch: measured (${summary.measurement.measuredEditions}) + unmeasurable (${summary.measurement.unmeasurableEditions}) !== total (${summary.totals.editions})`
    )
  }

  if (summary.measurement.zeroRecordEditions + summary.measurement.positiveRecordEditions !== summary.measurement.measuredEditions) {
    problems.push(
      `Zero (${summary.measurement.zeroRecordEditions}) + positive (${summary.measurement.positiveRecordEditions}) !== measured (${summary.measurement.measuredEditions})`
    )
  }

  // Distribution Sample sanity
  if (summary.distributionSample.sampleSize !== summary.measurement.measuredEditions) {
    problems.push(
      `Distribution sample size (${summary.distributionSample.sampleSize}) !== measured editions (${summary.measurement.measuredEditions})`
    )
  }

  if (!summary.distributionSample.sanityCheck) {
    problems.push(`Distribution failed sanity check: min <= p25 <= median <= p75 <= p90 <= max is false`)
  }

  if (dbIntegrityAudit.runtimeHardcodedCorpusMetrics > 0) {
    problems.push(`Found ${dbIntegrityAudit.runtimeHardcodedCorpusMetrics} hardcoded corpus metrics`)
  }

  if (dbIntegrityAudit.syntheticMultipliers > 0) {
    problems.push(`Found ${dbIntegrityAudit.syntheticMultipliers} synthetic multipliers`)
  }

  if (dbIntegrityAudit.registryDerivedRecordCounts > 0) {
    problems.push(`Found ${dbIntegrityAudit.registryDerivedRecordCounts} registry-derived record counts`)
  }

  if (dbIntegrityAudit.fallbackRecordCounts > 0) {
    problems.push(`Found ${dbIntegrityAudit.fallbackRecordCounts} fallback record counts`)
  }

  if (dbIntegrityAudit.measurementIntegrity !== 'REAL_DATA') {
    problems.push(`Measurement integrity is ${dbIntegrityAudit.measurementIntegrity}, expected REAL_DATA`)
  }

  if (dbIntegrityAudit.status !== 'PASS') {
    problems.push(`DB integrity audit status is ${dbIntegrityAudit.status}`)
  }

  return {
    valid: problems.length === 0,
    problems,
    totalTraditions: summary.totals.traditions,
    totalWorks: summary.totals.works,
    totalEditions: summary.totals.editions,
    materializedEditions: summary.materialization.materializedEditions,
    measuredEditions: summary.measurement.measuredEditions,
    unmeasurableEditions: summary.measurement.unmeasurableEditions,
    distributionSampleSize: summary.distributionSample.sampleSize,
    zeroRecordEditions: summary.measurement.zeroRecordEditions,
    positiveRecordEditions: summary.measurement.positiveRecordEditions,
    phase15NewWorks: newWorks.length,
    phase15NewEditions: 74,
    canonicalPositions: summary.corpus.canonicalPositions,
    editionRecords: summary.corpus.editionRecords,
    syntheticCountCalculations: dbIntegrityAudit.runtimeHardcodedCorpusMetrics + dbIntegrityAudit.syntheticMultipliers
  }
}
