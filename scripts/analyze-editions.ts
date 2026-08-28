import { EditionContributionAuditor } from '../packages/ingestion/src/contribution/edition-contribution-auditor.js'

async function main() {
  console.log('========================================================================')
  console.log('🔬 MOONWITNESS PHASE 14: CROSS-EDITION EQUIVALENCE & ANALYSIS')
  console.log('========================================================================')

  const auditor = new EditionContributionAuditor(process.cwd())
  const { positionMatrix, contributions } = await auditor.runAudit()

  console.log(`• Audited Editions Analyzed: ${contributions.length}`)
  console.log(`• Position Matrix Samples   : ${positionMatrix.length}`)
  console.log('------------------------------------------------------------------------')
  for (const pm of positionMatrix.slice(0, 8)) {
    console.log(`• Position: ${pm.canonicalRecordId} (${pm.workId})`)
    console.log(`  Editions: [${pm.editionIds.join(', ')}]`)
    console.log(`  Languages: [${pm.languages.join(', ')}]`)
    console.log(`  Sources  : [${pm.sourceIds.join(', ')}]`)
  }
  console.log('========================================================================')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
