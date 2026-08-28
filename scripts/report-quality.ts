import { CorpusAuditor } from '@moonwitness/corpus-ingestion'

async function main() {
  const auditor = new CorpusAuditor(process.cwd())
  const { qualityReport, scoreDistribution, comparisons } = await auditor.runAudit()

  console.log('========================================================================')
  console.log('🎯 MOONWITNESS DATA TRUST & TECHNICAL QUALITY AUDIT REPORT')
  console.log('========================================================================')
  console.log(`Total Works Audited   : ${qualityReport.totalWorks}`)
  console.log(`Average Quality Score : ${qualityReport.averageScore} / 100`)
  console.log(`Score Distribution    : Min=${scoreDistribution.min}, Max=${scoreDistribution.max}, Median=${scoreDistribution.median}, StdDev=${scoreDistribution.standardDeviation}`)
  console.log(`Percentiles           : P25=${scoreDistribution.p25}, P50=${scoreDistribution.p50}, P75=${scoreDistribution.p75}`)
  console.log(`Grade Distribution    : A=${qualityReport.gradeBreakdown.A}, B=${qualityReport.gradeBreakdown.B}, C=${qualityReport.gradeBreakdown.C}, D=${qualityReport.gradeBreakdown.D}, F=${qualityReport.gradeBreakdown.F}`)
  console.log(`Distribution Collapse : ${qualityReport.scoringDistributionCollapse ? 'YES ⚠️' : 'NO (Verified Score Variance ✅)'}`)
  console.log('------------------------------------------------------------------------')
  console.log('TOP QUALITY WORKS (EVIDENCE-VERIFIED):')
  const sortedWorks = [...qualityReport.works].sort((a, b) => b.score - a.score)
  for (const w of sortedWorks.slice(0, 10)) {
    console.log(`  [Grade ${w.grade} - Score ${w.score}] ${w.name} (${w.traditionId}) -> ${w.records} records [Live: ${w.liveAcquisitionStatus}]`)
  }
  console.log('------------------------------------------------------------------------')
  console.log('CROSS-SOURCE EQUIVALENCE ELIGIBILITY:')
  for (const c of comparisons) {
    console.log(`  • [${c.eligibility}] ${c.workName} -> ${c.classification || c.reason || 'N/A'}`)
  }
  console.log('========================================================================')
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
