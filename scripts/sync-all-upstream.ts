import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {
  UpstreamPlanner,
  UpstreamRunner,
  type UpstreamMasterRegistry,
  type ExecutorRegistry
} from '@moonwitness/corpus-ingestion'

async function main() {
  const root = process.cwd()
  const planner = new UpstreamPlanner({ rootDir: root })
  const masterRegistry = await planner.loadMasterRegistry()
  const executorsRegistry = await planner.loadExecutorsRegistry()
  const { plans, readyCount, unmappedEndpointCount } = await planner.buildPlan()

  console.log('========================================================================')
  console.log('🌐 MoonWitness Master Universal Upstream Synchronization Engine')
  console.log('========================================================================')
  console.log(`Registry Version : v${masterRegistry.version}`)
  console.log(`Traditions       : ${Object.keys(masterRegistry.traditions).length}`)
  console.log(`Planned Endpoints: ${plans.length}`)
  console.log(`Ready to Execute : ${readyCount}`)
  console.log(`Unmapped/Disabled: ${unmappedEndpointCount}`)
  console.log('========================================================================\n')

  const concurrency = Math.max(1, Math.min(8, executorsRegistry.defaults?.concurrency ?? 8))
  const timeoutMs = Math.max(10_000, executorsRegistry.defaults?.timeoutMs ?? 900_000)

  const runner = new UpstreamRunner({
    rootDir: root,
    concurrency,
    timeoutMs,
    plans,
    registryVersion: masterRegistry.version
  })

  console.log(`🚀 Starting parallel worker pool (${concurrency} workers)...`)
  const { manifest, manifestPath, hasRequiredFailures } = await runner.run()

  console.log('\n------------------------------------------------------------------------')
  console.log(`✅ Succeeded    : ${manifest.totals.succeeded}`)
  console.log(`⏸ Not Modified : ${manifest.totals.notModified}`)
  console.log(`🔄 Fallback     : ${manifest.totals.fallback}`)
  console.log(`❌ Failed       : ${manifest.totals.failed}`)
  console.log(`⚠ Unsupported  : ${manifest.totals.unsupported}`)
  console.log(`📄 Manifest Path: ${manifestPath}`)
  console.log('------------------------------------------------------------------------\n')

  if (hasRequiredFailures) {
    console.error('❌ One or more required upstream jobs failed!')
    process.exitCode = 1
  } else {
    console.log('✨ Universal Upstream Synchronization Complete.')
  }
}

main().catch((error) => {
  console.error('[sync-all-upstream fatal error]:', error)
  process.exitCode = 1
})
