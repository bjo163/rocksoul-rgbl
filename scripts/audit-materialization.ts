import { MaterializationAuditor } from '@moonwitness/corpus-ingestion'
import path from 'node:path'

async function main() {
  const auditor = new MaterializationAuditor(process.cwd())
  await auditor.writeAllMaterializationArtifacts(path.join(process.cwd(), 'dist'))
  const { summary, growthReport } = await auditor.runAudit()

  console.log(JSON.stringify({
    success: true,
    totalEditions: summary.totalEditions,
    full: summary.full,
    partial: summary.partial,
    metadataOnly: summary.metadataOnly,
    materializationPercent: summary.materializationPercent,
    recordBearingEditions: summary.recordBearingEditions,
    zeroRecordEditions: summary.zeroRecordEditions,
    canonicalRecords: growthReport.currentCanonicalRecords,
    indexedRecords: growthReport.currentIndexedRecords
  }, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
