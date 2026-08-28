import path from 'node:path'
import { UniversalCorpusRegistry } from '../registry/universal-registry.js'
import { CorpusAuditor } from './corpus-auditor.js'

export async function validateCorpus(rootDir: string = process.cwd()): Promise<{
  valid: boolean
  problems: string[]
  totalWorks: number
  healthyWorks: number
}> {
  const problems: string[] = []
  const registry = new UniversalCorpusRegistry(path.join(rootDir, 'config'))
  await registry.loadAll()

  const regValidation = registry.validateRegistry()
  problems.push(...regValidation.problems)

  const auditor = new CorpusAuditor(rootDir)
  const { auditRecords } = await auditor.runAudit()

  let healthyWorks = 0
  for (const record of auditRecords) {
    if (record.empty) {
      problems.push(`Work '${record.workId}' has 0 records`)
    }
    if (record.validationErrors.length > 0) {
      problems.push(...record.validationErrors.map(e => `Work '${record.workId}': ${e}`))
    }
    if (record.technicalQualityScore >= 70) {
      healthyWorks++
    }
  }

  return {
    valid: problems.length === 0,
    problems,
    totalWorks: auditRecords.length,
    healthyWorks
  }
}
