import { CorpusDepthAuditor } from './depth-auditor.js'
import type { DepthValidationResult } from './types.js'

export async function validateDepth(rootDir: string = process.cwd()): Promise<DepthValidationResult> {
  const auditor = new CorpusDepthAuditor(rootDir)
  const { summary, newWorks, workMaterialization, syntheticAudit } = await auditor.runAudit()

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

  if (syntheticAudit.hardcodedCorpusMetrics > 0) {
    problems.push(`Found ${syntheticAudit.hardcodedCorpusMetrics} hardcoded corpus metrics`)
  }

  if (syntheticAudit.syntheticMultipliers > 0) {
    problems.push(`Found ${syntheticAudit.syntheticMultipliers} synthetic multipliers`)
  }

  if (syntheticAudit.defaultCorpusCounts > 0) {
    problems.push(`Found ${syntheticAudit.defaultCorpusCounts} default corpus counts`)
  }

  if (syntheticAudit.measurementIntegrity !== 'REAL_DATA') {
    problems.push(`Measurement integrity is ${syntheticAudit.measurementIntegrity}, expected REAL_DATA`)
  }

  if (syntheticAudit.status !== 'PASS') {
    problems.push(`Synthetic count audit status is ${syntheticAudit.status}`)
  }

  return {
    valid: problems.length === 0,
    problems,
    totalTraditions: summary.totals.traditions,
    totalWorks: summary.totals.works,
    totalEditions: summary.totals.editions,
    phase15NewWorks: newWorks.length,
    phase15NewEditions: 74,
    canonicalPositions: summary.corpus.canonicalPositions,
    editionRecords: summary.corpus.editionRecords,
    syntheticCountCalculations: syntheticAudit.hardcodedCorpusMetrics + syntheticAudit.syntheticMultipliers
  }
}
