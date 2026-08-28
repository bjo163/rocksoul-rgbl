import { CorpusAuditor } from '@moonwitness/corpus-ingestion'
import path from 'node:path'

async function main() {
  const auditor = new CorpusAuditor(process.cwd())
  const { comparisons } = await auditor.runAudit()
  console.log('========================================================================')
  console.log('🔍 MoonWitness Cross-Source Equivalence & Comparison Report')
  console.log('========================================================================')
  for (const c of comparisons) {
    console.log(`• [${c.classification}] ${c.workName} (${c.workId})`)
    console.log(`  Source A : ${c.sourceA}`)
    console.log(`  Source B : ${c.sourceB}`)
    console.log(`  Alignment: ${c.matchingRecords} / ${c.totalComparableRecords} records (${c.similarityPercentage}%)`)
    console.log(`  Details  : ${c.details}`)
    console.log('------------------------------------------------------------------------')
  }
  console.log(`Total active cross-source comparisons evaluated: ${comparisons.length}`)
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
