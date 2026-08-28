import { AlignmentEngine } from '@moonwitness/corpus-ingestion'
import path from 'node:path'

async function main() {
  const engine = new AlignmentEngine(process.cwd())
  await engine.writeAllEditionArtifacts(path.join(process.cwd(), 'dist'))
  const { editionAuditReport, languageCoverageReport } = await engine.runAlignment()

  console.log(JSON.stringify({
    success: true,
    totalWorks: editionAuditReport.totalWorks,
    totalEditions: editionAuditReport.totalEditions,
    totalLanguages: languageCoverageReport.totalLanguages,
    worksWithMultipleEditions: editionAuditReport.worksWithMultipleEditions,
    worksWithMultipleLanguages: editionAuditReport.worksWithMultipleLanguages
  }, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
