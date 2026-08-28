import process from 'node:process'
import {
  UpstreamPlanner,
  UpstreamRunner
} from '@moonwitness/corpus-ingestion'

async function main() {
  const root = process.cwd()
  const planner = new UpstreamPlanner({ rootDir: root })
  const masterRegistry = await planner.loadMasterRegistry()
  const executorsRegistry = await planner.loadExecutorsRegistry()
  const { plans, readyCount, unmappedEndpointCount, defaultAllowFallback } = await planner.buildPlan()

  console.log('========================================================================')
  console.log('🌐 MoonWitness Master Universal Upstream Synchronization Engine')
  console.log('========================================================================')
  console.log(`Registry Version : v${masterRegistry.version}`)
  console.log(`Traditions       : ${Object.keys(masterRegistry.traditions).length}`)
  console.log(`Planned Endpoints: ${plans.length}`)
  console.log(`Ready to Execute : ${readyCount}`)
  console.log(`Unmapped/Disabled: ${unmappedEndpointCount}`)
  console.log(`Fallback Policy  : ${defaultAllowFallback ? 'ALLOW_FALLBACK (explicit)' : 'STRICT_PRODUCTION (default)'}`)
  console.log('========================================================================\n')

  const concurrency = Math.max(1, Math.min(8, executorsRegistry.defaults?.concurrency ?? 8))
  const timeoutMs = Math.max(10_000, executorsRegistry.defaults?.timeoutMs ?? 900_000)

  const runner = new UpstreamRunner({
    rootDir: root,
    concurrency,
    timeoutMs,
    plans,
    registryVersion: masterRegistry.version,
    defaultAllowFallback
  })

  console.log(`🚀 Starting parallel worker pool (${concurrency} workers)...`)
  const { manifest, manifestPath, hasFailures, failureReasons } = await runner.run()

  const isPartial = (manifest.totals.remoteSynced + manifest.totals.notModified) < manifest.totals.planned
  const upstreamStatus = hasFailures ? 'FAILED' : (isPartial ? 'PARTIAL' : 'FULL')

  console.log('\n------------------------------------------------------------------------')
  console.log('📊 UPSTREAM SYNCHRONIZATION RESULTS:')
  console.log('------------------------------------------------------------------------')
  console.log(`  REMOTE SYNCED : ${manifest.totals.remoteSynced}`)
  console.log(`  NOT MODIFIED  : ${manifest.totals.notModified}`)
  console.log(`  CACHE         : ${manifest.totals.cache}`)
  console.log(`  FALLBACK      : ${manifest.totals.fallback}`)
  console.log(`  FAILED        : ${manifest.totals.failed}`)
  console.log(`  UNSUPPORTED   : ${manifest.totals.unsupported}`)
  console.log('------------------------------------------------------------------------')
  console.log(`  ENGINE_STATUS   : ${hasFailures ? 'FAIL' : 'PASS'}`)
  console.log(`  UPSTREAM_STATUS : ${upstreamStatus}`)
  console.log(`  CORPUS_STATUS   : PASS`)
  console.log('------------------------------------------------------------------------')
  console.log(`📄 Manifest Path : ${manifestPath}`)
  console.log('------------------------------------------------------------------------\n')

  if (hasFailures) {
    console.error('❌ UPSTREAM SYNCHRONIZATION GATE FAILED:')
    for (const reason of failureReasons) {
      console.error(`  - ${reason}`)
    }
    process.exitCode = 1
  } else {
    console.log(`✨ Universal Upstream Sync Execution Complete (UPSTREAM COVERAGE: ${upstreamStatus}).`)
  }
}

main().catch((error) => {
  console.error('[sync-all-upstream fatal error]:', error)
  process.exitCode = 1
})
