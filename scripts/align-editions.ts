import { AlignmentEngine } from '@moonwitness/corpus-ingestion'

async function main() {
  const engine = new AlignmentEngine(process.cwd())
  const { alignmentReport } = await engine.runAlignment()

  console.log('========================================================================')
  console.log('🔗 MOONWITNESS MULTILINGUAL POSITION ALIGNMENTS')
  console.log('========================================================================')
  console.log(`Total Positions Sampled: ${alignmentReport.totalPositionsAligned}`)
  console.log(`Status Breakdown       : ALIGNED=${alignmentReport.statusBreakdown.ALIGNED}, STRUCTURALLY_ALIGNED=${alignmentReport.statusBreakdown.STRUCTURALLY_ALIGNED}, PARTIALLY_ALIGNED=${alignmentReport.statusBreakdown.PARTIALLY_ALIGNED}`)
  console.log('------------------------------------------------------------------------')
  for (const a of alignmentReport.alignments) {
    console.log(`• Canonical ID: ${a.canonicalId}`)
    for (const e of a.editions) {
      console.log(`    [${e.alignment}] lang=${e.language} | edition=${e.editionId} | recordId=${e.recordId}`)
    }
  }
  console.log('========================================================================')
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
