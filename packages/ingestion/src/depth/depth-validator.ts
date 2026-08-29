import { CorpusDepthAuditor } from './depth-auditor.js'
import type { DepthValidationResult } from './types.js'

export async function validateDepth(rootDir: string = process.cwd()): Promise<DepthValidationResult> {
  const auditor = new CorpusDepthAuditor(rootDir)
  const { summary, newWorks, workMaterialization, syntheticAudit } = await auditor.runAudit()

  const problems: string[] = []

  if (summary.totalTraditions < 60) {
    problems.push(`Expected >= 60 traditions, got ${summary.totalTraditions}`)
  }

  if (summary.totalWorks < 220) {
    problems.push(`Expected >= 220 works, got ${summary.totalWorks}`)
  }

  if (summary.totalEditions < 450) {
    problems.push(`Expected >= 450 editions, got ${summary.totalEditions}`)
  }

  if (newWorks.length < 35) {
    problems.push(`Expected >= 35 Phase 15 new works, got ${newWorks.length}`)
  }

  if (syntheticAudit.syntheticCountCalculations > 0) {
    problems.push(`Found ${syntheticAudit.syntheticCountCalculations} synthetic count calculations`)
  }

  if (syntheticAudit.status !== 'PASS') {
    problems.push(`Synthetic count audit status is ${syntheticAudit.status}`)
  }

  for (const wm of workMaterialization) {
    if (wm.records <= 0) {
      problems.push(`Expected positive records for work ${wm.workId}`)
    }
  }

  return {
    valid: problems.length === 0,
    problems,
    totalTraditions: summary.totalTraditions,
    totalWorks: summary.totalWorks,
    totalEditions: summary.totalEditions,
    phase15NewWorks: newWorks.length,
    phase15NewEditions: summary.phase15NewEditions,
    canonicalPositions: summary.totalCanonicalPositions,
    editionRecords: summary.totalEditionRecords,
    syntheticCountCalculations: syntheticAudit.syntheticCountCalculations
  }
}
