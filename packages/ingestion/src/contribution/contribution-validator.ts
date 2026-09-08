import { EditionContributionAuditor } from './edition-contribution-auditor.js'
import type { ContributionValidationResult } from './types.js'

export async function validateContributions(rootDir: string = process.cwd()): Promise<ContributionValidationResult> {
  const auditor = new EditionContributionAuditor(rootDir)
  const { contributions, summary } = await auditor.runAudit()

  const problems: string[] = []

  if (contributions.length < 370) {
    problems.push(`Expected >= 370 editions, got ${contributions.length}`)
  }

  if (summary.uniqueCorpusContribution <= 0) {
    problems.push('Expected positive uniqueCorpusContribution count')
  }

  if (summary.additionalLanguage <= 0) {
    problems.push('Expected positive additionalLanguage count')
  }

  for (const c of contributions) {
    if (c.rawRecords < 0 || c.editionRecords < 0) {
      problems.push(`Negative record count found in edition ${c.editionId}`)
    }
    if (!c.normalizedTextHash || c.normalizedTextHash.length !== 64) {
      problems.push(`Invalid normalizedTextHash for edition ${c.editionId}`)
    }
  }

  return {
    valid: problems.length === 0,
    problems,
    totalEditions: contributions.length,
    canonicalPositions: summary.totalCanonicalPositions,
    editionRecords: summary.totalEditionRecords,
    uniqueCorpusContribution: summary.uniqueCorpusContribution,
    additionalLanguage: summary.additionalLanguage,
    additionalSourceWitness: summary.additionalSourceWitness
  }
}
