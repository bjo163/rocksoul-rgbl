import { Phase19BreadthAuditor } from '../packages/ingestion/src/breadth/phase19-breadth-auditor.js'

async function main() {
  const auditor = new Phase19BreadthAuditor(process.cwd())
  const summary = await auditor.runAudit()

  console.log('========================================================================')
  console.log('🌐 MOONWITNESS PHASE 19: MULTI-TRADITION BREADTH EXPANSION AUDITOR')
  console.log('========================================================================')
  console.log(`• Traditions  : ${summary.traditions.before} → ${summary.traditions.after} (+${summary.traditions.newCount} new)`)
  console.log(`• Works       : ${summary.works.before} → ${summary.works.after} (+${summary.works.newCount} new)`)
  console.log(`• Editions    : ${summary.editions.before} → ${summary.editions.after} (+${summary.editions.newCount} new)`)
  console.log(`• Languages   : ${summary.languages.before} → ${summary.languages.after} (+${summary.languages.newCount} new)`)
  console.log(`• Sources     : ${summary.sources.before} → ${summary.sources.after} (+${summary.sources.newCount} new)`)
  console.log(`• Endpoints   : ${summary.endpoints.before} → ${summary.endpoints.after} (+${summary.endpoints.newCount} new)`)
  console.log(`• Recipes     : ${summary.recipes.before} → ${summary.recipes.after} (+${summary.recipes.newCount} new)`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Orphans / Duplicates / Broken Rel : ${summary.registryInvariants.orphans} / ${summary.registryInvariants.duplicates} / ${summary.registryInvariants.brokenRelationships}`)
  console.log(`• Execution Ready Endpoints        : ${summary.executionCoverage.readyToExecute}/${summary.executionCoverage.totalEndpoints}`)
  console.log(`• Registered / Measured Editions   : ${summary.materializationCoverage.registeredEditions} / ${summary.materializationCoverage.measuredEditions}`)
  console.log(`• Strict Owned Coverage Percent    : ${summary.ownershipPreservation.strictOwnedCoveragePercent}%`)
  console.log(`• Resolved Ownership Coverage Pct  : ${summary.ownershipPreservation.resolvedOwnershipCoveragePercent}%`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Quality Distribution (A/B/C/D/F) : ${summary.qualityScoreDistribution.gradeA}/${summary.qualityScoreDistribution.gradeB}/${summary.qualityScoreDistribution.gradeC}/${summary.qualityScoreDistribution.gradeD}/${summary.qualityScoreDistribution.gradeF}`)
  console.log(`• Mean / Median Quality Score      : ${summary.qualityScoreDistribution.mean} / ${summary.qualityScoreDistribution.median}`)
  console.log('========================================================================')
  console.log('✨ All Phase 19 breadth expansion artifacts written to dist/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
