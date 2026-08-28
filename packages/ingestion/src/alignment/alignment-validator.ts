import { AlignmentEngine } from './alignment-engine.js'

export async function validateEditions(rootDir: string = process.cwd()): Promise<{
  valid: boolean
  problems: string[]
  totalWorks: number
  totalEditions: number
  totalLanguages: number
  worksWithMultipleEditions: number
}> {
  const problems: string[] = []
  const engine = new AlignmentEngine(rootDir)
  const { editionAuditReport, languageCoverageReport, alignmentReport } = await engine.runAlignment()

  if (editionAuditReport.totalEditions < 200) {
    problems.push(`Total editions count (${editionAuditReport.totalEditions}) is less than the required 200 threshold`)
  }

  if (languageCoverageReport.totalLanguages < 10) {
    problems.push(`Language count (${languageCoverageReport.totalLanguages}) is below expectations`)
  }

  for (const w of editionAuditReport.works) {
    if (w.editionCount === 0) {
      problems.push(`Work '${w.workId}' has 0 registered editions`)
    }
  }

  for (const a of alignmentReport.alignments) {
    if (a.editions.length === 0) {
      problems.push(`Alignment for '${a.canonicalId}' has 0 editions`)
    }
  }

  return {
    valid: problems.length === 0,
    problems,
    totalWorks: editionAuditReport.totalWorks,
    totalEditions: editionAuditReport.totalEditions,
    totalLanguages: languageCoverageReport.totalLanguages,
    worksWithMultipleEditions: editionAuditReport.worksWithMultipleEditions
  }
}
