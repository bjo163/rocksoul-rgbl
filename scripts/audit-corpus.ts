import { CorpusAuditor } from '@moonwitness/corpus-ingestion'
import path from 'node:path'

async function main() {
  const auditor = new CorpusAuditor(process.cwd())
  await auditor.writeAllAuditArtifacts(path.join(process.cwd(), 'dist'))
  const { qualityReport } = await auditor.runAudit()
  console.log(JSON.stringify({
    success: true,
    totalWorks: qualityReport.totalWorks,
    averageScore: qualityReport.averageScore,
    gradeBreakdown: qualityReport.gradeBreakdown,
    statusBreakdown: qualityReport.statusBreakdown
  }, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
