import { Phase19MetricReconciler } from '../packages/ingestion/src/metrics/phase19-metric-reconciler.js'

async function main() {
  const reconciler = new Phase19MetricReconciler(process.cwd())
  const contract = await reconciler.computeAllMetrics()
  await reconciler.writeAllReconciliationArtifacts(contract)

  console.log('========================================================================')
  console.log('📊 MOONWITNESS PHASE 19 METRIC AUDITOR')
  console.log('========================================================================')
  console.log(`• Registry Dimensions       : ${contract.dimensions.registry.traditions} traditions, ${contract.dimensions.registry.works} works, ${contract.dimensions.registry.editions} editions`)
  console.log(`• Languages / Sources / EPs : ${contract.dimensions.registry.languages} langs, ${contract.dimensions.registry.sources} sources, ${contract.dimensions.registry.endpoints} endpoints`)
  console.log('------------------------------------------------------------------------')
  console.log(`• Acquisition Outcome Sum   : ${contract.dimensions.acquisition.plannedJobs} / ${contract.dimensions.acquisition.plannedJobs} (${contract.dimensions.acquisition.outcomeAccounting})`)
  console.log(`• Live Remote Coverage      : ${contract.dimensions.acquisition.liveRemoteCoveragePercent}%`)
  console.log(`• Contents Rows (SQL Ground): ${contract.dimensions.record.contentsRows.toLocaleString()}`)
  console.log(`• Total Canonical Positions : ${contract.dimensions.canonical.canonicalPositions.toLocaleString()}`)
  console.log(`• Strict Owned Coverage     : ${contract.dimensions.ownership.strictOwnedCoveragePercent}%`)
  console.log(`• Resolved Ownership Pct    : ${contract.dimensions.ownership.resolvedOwnershipCoveragePercent}%`)
  console.log(`• Quality Score Mean        : ${contract.dimensions.quality.scoreDistribution.mean} (Model: ${contract.dimensions.quality.modelVersion})`)
  console.log('========================================================================')
  console.log('✨ All Phase 19 reconciliation artifacts written to dist/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
