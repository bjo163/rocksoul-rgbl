import { Phase20DepthAuditor } from '../packages/ingestion/src/depth/phase20-depth-auditor.js'

async function main() {
  const auditor = new Phase20DepthAuditor(process.cwd())
  const summary = await auditor.runAudit()

  console.log('========================================================================')
  console.log('🔬 MOONWITNESS PHASE 20: CORPUS DEPTH AUDITOR')
  console.log('========================================================================')
  console.log(`• Baseline              : ${summary.baseline.traditions} traditions, ${summary.baseline.works} works, ${summary.baseline.editions} editions`)
  console.log(`• Phase 19 Additions    : ${summary.phase19Delta.traditions.length} traditions, ${summary.phase19Delta.works.length} works, ${summary.phase19Delta.editions.length} editions, ${summary.phase19Delta.languages.length} langs, ${summary.phase19Delta.sources.length} sources`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Work Depth Audited    : ${summary.workDepth.length} works`)
  console.log(`• Tradition Depth       : ${summary.traditionDepth.length} traditions`)
  console.log(`• Source Depth          : ${summary.sourceDepth.length} sources`)
  console.log(`• Language Depth        : ${summary.languageDepth.length} languages`)
  console.log(`• Shallow Works Flagged : ${summary.shallowWorks.length} works (candidates for future depth expansion)`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Strict Owned Coverage : ${summary.depthScorecard.ownershipDepth.strictOwnedCoveragePercent}%`)
  console.log(`• Resolved Ownership    : ${summary.depthScorecard.ownershipDepth.resolvedOwnershipCoveragePercent}%`)
  console.log(`• Global Unique Payload : ${summary.depthScorecard.payloadDepth.globalUniquePayloads.toLocaleString()}`)
  console.log(`• Source Witnesses      : ${summary.depthScorecard.crossSourceDepth.totalSourceWitnesses}`)
  console.log(`• Quality Score Mean    : ${summary.quality.mean} (A:${summary.quality.gradeBreakdown.A}, B:${summary.quality.gradeBreakdown.B}, C:${summary.quality.gradeBreakdown.C}, D:${summary.quality.gradeBreakdown.D}, F:${summary.quality.gradeBreakdown.F})`)
  console.log('========================================================================')
  console.log('✨ All 10 Phase 20 depth artifacts generated in dist/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
