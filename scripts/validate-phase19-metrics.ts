import { Phase19MetricReconciler } from '../packages/ingestion/src/metrics/phase19-metric-reconciler.js'

async function main() {
  const reconciler = new Phase19MetricReconciler(process.cwd())
  const contract = await reconciler.computeAllMetrics()
  const inv = contract.dimensions.invariants

  const problems: string[] = []

  if (!inv.acquisitionSumMatchesJobs) {
    problems.push('Acquisition outcomes do not sum to planned jobs')
  }
  if (!inv.ownershipSumMatchesNormalized) {
    problems.push('Ownership breakdown does not sum to total normalized records')
  }
  if (!inv.measuredSumMatchesPositiveAndZero) {
    problems.push('Measured editions does not equal zero + positive record editions')
  }
  if (!inv.editionSumMatchesMeasuredAndUnmeasurable) {
    problems.push('Total editions does not equal measured + unmeasurable editions')
  }
  if (!inv.materializedWithinAcquired) {
    problems.push('Materialized editions exceeds acquired editions')
  }
  if (!inv.noOrphans) {
    problems.push('Registry contains orphan references')
  }
  if (!inv.noDuplicates) {
    problems.push('Registry contains duplicates')
  }
  if (!inv.noBrokenRelationships) {
    problems.push('Registry contains broken relationships')
  }

  if (problems.length > 0) {
    console.error('❌ Metric validation failed with problems:', problems)
    process.exit(1)
  }

  console.log('✅ Metric validation passed with all hard invariants satisfied.')
  console.log(`• Traditions  : ${contract.dimensions.registry.traditions}`)
  console.log(`• Works       : ${contract.dimensions.registry.works}`)
  console.log(`• Editions    : ${contract.dimensions.registry.editions}`)
  console.log(`• Languages   : ${contract.dimensions.registry.languages}`)
  console.log(`• Sources     : ${contract.dimensions.registry.sources}`)
  console.log(`• Endpoints   : ${contract.dimensions.registry.endpoints}`)
  console.log(`• Acquisition : ${contract.dimensions.acquisition.outcomeAccounting} (${contract.dimensions.acquisition.plannedJobs} planned)`)
  console.log(`• Ownership   : ${contract.dimensions.ownership.strictOwnedCoveragePercent}% strict / ${contract.dimensions.ownership.resolvedOwnershipCoveragePercent}% resolved`)
  console.log(`• Quality     : Mean ${contract.dimensions.quality.scoreDistribution.mean} (A:${contract.dimensions.quality.scoreDistribution.A}, B:${contract.dimensions.quality.scoreDistribution.B}, C:${contract.dimensions.quality.scoreDistribution.C}, D:${contract.dimensions.quality.scoreDistribution.D}, F:${contract.dimensions.quality.scoreDistribution.F})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
