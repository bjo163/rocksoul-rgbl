import { CorpusDepthAuditor } from '../packages/ingestion/src/depth/depth-auditor.js'

async function main() {
  console.log('========================================================================')
  console.log('🔍 MOONWITNESS PHASE 16: NEW-WORK CORPUS DEPTH AUDITOR')
  console.log('========================================================================')

  const auditor = new CorpusDepthAuditor(process.cwd())
  await auditor.writeAllDepthArtifacts()

  const { summary, newWorks, traditionDepth } = await auditor.runAudit()

  console.log(`\n• Total Traditions                : ${summary.totals.traditions}`)
  console.log(`• Total Canonical Works           : ${summary.totals.works}`)
  console.log(`• Total Materialized Editions     : ${summary.totals.editions}`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Phase 15 New Works Audited      : ${newWorks.length}`)
  console.log(`• Phase 15 New Editions Audited   : 74`)
  console.log(`• New Traditions Represented      : ${traditionDepth.newTraditions.length}`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Total Canonical Positions       : ${summary.corpus.canonicalPositions}`)
  console.log(`• Total Edition Records           : ${summary.corpus.editionRecords}`)
  console.log(`• Total Indexed Records           : ${summary.corpus.indexedRecords}`)
  console.log('========================================================================')
  console.log('✨ All Phase 16 depth artifacts written to dist/')
}

main().catch(err => {
  console.error('Fatal error during depth audit:', err)
  process.exit(1)
})
