import { CorpusDepthAuditor } from '../packages/ingestion/src/depth/depth-auditor.js'

async function main() {
  console.log('========================================================================')
  console.log('🔍 MOONWITNESS PHASE 16: NEW-WORK CORPUS DEPTH AUDITOR')
  console.log('========================================================================')

  const auditor = new CorpusDepthAuditor(process.cwd())
  await auditor.writeAllDepthArtifacts()

  const { summary, newWorks, traditionDepth } = await auditor.runAudit()

  console.log(`\n• Total Traditions                : ${summary.totalTraditions}`)
  console.log(`• Total Canonical Works           : ${summary.totalWorks}`)
  console.log(`• Total Materialized Editions     : ${summary.totalEditions}`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Phase 15 New Works Audited      : ${summary.phase15NewWorks}`)
  console.log(`• Phase 15 New Editions Audited   : ${summary.phase15NewEditions}`)
  console.log(`• New Traditions Represented      : ${traditionDepth.newTraditions.length}`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Total Canonical Positions       : ${summary.totalCanonicalPositions}`)
  console.log(`• Total Edition Records           : ${summary.totalEditionRecords}`)
  console.log(`• Total Indexed Records           : ${summary.totalIndexedRecords}`)
  console.log('========================================================================')
  console.log('✨ All Phase 16 depth artifacts written to dist/')
}

main().catch(err => {
  console.error('Fatal error during depth audit:', err)
  process.exit(1)
})
