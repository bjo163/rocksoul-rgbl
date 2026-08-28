import assert from 'node:assert/strict'
import test from 'node:test'
import { UpstreamPlanner } from './planner.js'
import { RecipeResolver } from './recipe-resolver.js'
import { buildRunManifest } from './manifest.js'
import {
  defaultUpstreamAdapterRegistry,
  UpstreamAdapterRegistry,
  httpJsonAdapter,
  rawTextAdapter,
  gitAdapter
} from './adapter-registry.js'
import type { UpstreamJobResult } from './types.js'

test('Upstream Architecture: RecipeResolver loads registered recipes', async () => {
  const resolver = new RecipeResolver()
  const recipes = await resolver.loadAllRecipes()
  assert.ok(recipes.size > 0, 'Must load registered recipes from ingestion/registry.json')
})

test('Upstream Architecture: AdapterRegistry supports registration and lookup', () => {
  const registry = new UpstreamAdapterRegistry()
  registry.register(httpJsonAdapter)
  registry.register(rawTextAdapter)
  registry.register(gitAdapter)

  assert.equal(registry.ids().length, 3)
  assert.ok(registry.has('http-json'))
  assert.ok(registry.has('raw-text'))
  assert.ok(registry.has('git-repository'))
  assert.equal(registry.resolve('http-json').id, 'http-json')

  assert.throws(() => {
    registry.register(httpJsonAdapter)
  }, /Duplicate upstream adapter/)

  assert.throws(() => {
    registry.resolve('unknown-adapter')
  }, /Unknown upstream adapter/)
})

test('Upstream Architecture: UpstreamPlanner builds deterministic plan from registry', async () => {
  const planner = new UpstreamPlanner()
  const { version, plans, readyCount } = await planner.buildPlan()

  assert.equal(version, '1.0.0')
  assert.ok(plans.length >= 17, `Expected at least 17 endpoint plans, got ${plans.length}`)
  assert.ok(readyCount >= 10, `Expected ready plans, got ${readyCount}`)

  // Verify deterministic sorting
  const ids = plans.map(p => p.id)
  const sortedIds = [...ids].sort((a, b) => a.localeCompare(b))
  assert.deepEqual(ids, sortedIds, 'Plans must be deterministically sorted by ID')
})

test('Upstream Architecture: buildRunManifest deterministically aggregates results sorted by ID', () => {
  const mockJobs: UpstreamJobResult[] = [
    {
      id: 'judaism:sefaria-api',
      traditionId: 'judaism',
      endpointId: 'sefaria-api',
      mode: 'script',
      status: 'succeeded',
      acquisitionStatus: 'REMOTE_SYNCED',
      required: false,
      durationMs: 120
    },
    {
      id: 'buddhism:suttacentral-bilara',
      traditionId: 'buddhism',
      endpointId: 'suttacentral-bilara',
      mode: 'script',
      status: 'succeeded',
      acquisitionStatus: 'REMOTE_SYNCED',
      required: false,
      durationMs: 85
    },
    {
      id: 'islam:ummah-api',
      traditionId: 'islam',
      endpointId: 'ummah-api',
      mode: 'script',
      status: 'succeeded',
      acquisitionStatus: 'REMOTE_SYNCED',
      required: true,
      durationMs: 250
    }
  ]

  const manifest = buildRunManifest({
    runId: 'test-run-123',
    startedAt: '2026-08-29T00:00:00Z',
    completedAt: '2026-08-29T00:01:00Z',
    registryVersion: '1.0.0',
    workers: 8,
    jobs: mockJobs
  })

  assert.equal(manifest.schemaVersion, '1.0.0')
  assert.equal(manifest.totals.planned, 3)
  assert.equal(manifest.totals.succeeded, 3)
  assert.equal(manifest.totals.failed, 0)
  assert.equal(manifest.jobs[0].id, 'buddhism:suttacentral-bilara')
  assert.equal(manifest.jobs[1].id, 'islam:ummah-api')
  assert.equal(manifest.jobs[2].id, 'judaism:sefaria-api')
})
