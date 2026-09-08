import { CorpusAuditor } from '@moonwitness/corpus-ingestion'

async function main() {
  const auditor = new CorpusAuditor(process.cwd())
  const { qualityReport, auditRecords } = await auditor.runAudit()

  console.log('========================================================================')
  console.log('📊 MOONWITNESS UNIVERSAL CORPUS QUALITY SUMMARY')
  console.log('========================================================================')
  console.log(`Total Canonical Works : ${qualityReport.totalWorks}`)
  console.log(`Average Quality Score : ${qualityReport.averageScore} / 100`)
  console.log(`Grade Distribution    : A=${qualityReport.gradeBreakdown.A}, B=${qualityReport.gradeBreakdown.B}, C=${qualityReport.gradeBreakdown.C}, D=${qualityReport.gradeBreakdown.D}, F=${qualityReport.gradeBreakdown.F}`)
  console.log(`Status Distribution   : FULL=${qualityReport.statusBreakdown.FULL}, PARTIAL=${qualityReport.statusBreakdown.PARTIAL}, FAILED=${qualityReport.statusBreakdown.FAILED}`)
  console.log('------------------------------------------------------------------------')
  console.log('TOP CORPUS WORKS:')
  for (const w of qualityReport.works.slice(0, 15)) {
    console.log(`  [Grade ${w.grade} - Score ${w.score}] ${w.name} (${w.traditionId}) -> ${w.records} records [${w.status}]`)
  }
  console.log(`  ... and ${qualityReport.works.length - 15} additional works registered and audited.`)
  console.log('========================================================================')
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
