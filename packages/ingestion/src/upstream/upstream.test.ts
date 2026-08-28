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
import type { UpstreamJobResult, UpstreamExecutionPlan } from './types.js'

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

test('Contract Test: buildRunManifest deterministically aggregates results sorted by ID', () => {
  const mockJobs: UpstreamJobResult[] = [
    {
      id: 'judaism:sefaria-api',
      traditionId: 'judaism',
      endpointId: 'sefaria-api',
      mode: 'script',
      status: 'succeeded',
      acquisitionStatus: 'REMOTE_SYNCED',
      required: false,
      allowFallback: false,
      allowCache: false,
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
      allowFallback: false,
      allowCache: false,
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
      allowFallback: false,
      allowCache: false,
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
  assert.equal(manifest.totals.remoteSynced, 3)
  assert.equal(manifest.totals.failed, 0)
  assert.equal(manifest.jobs[0].id, 'buddhism:suttacentral-bilara')
  assert.equal(manifest.jobs[1].id, 'islam:ummah-api')
  assert.equal(manifest.jobs[2].id, 'judaism:sefaria-api')
})

test('Contract Test: remote success and remote not modified statuses', () => {
  const jobs: UpstreamJobResult[] = [
    {
      id: 'islam:tanzil-quran',
      traditionId: 'islam',
      endpointId: 'tanzil-quran',
      mode: 'adapter',
      status: 'succeeded',
      acquisitionStatus: 'REMOTE_SYNCED',
      required: true,
      allowFallback: false,
      allowCache: false,
      durationMs: 100,
      requestedUrl: 'https://tanzil.net/pub/download/quran-uthmani.txt',
      resolvedUrl: 'https://tanzil.net/pub/download/quran-uthmani.txt',
      retrievedAt: new Date().toISOString()
    },
    {
      id: 'judaism:oshb-wlc',
      traditionId: 'judaism',
      endpointId: 'oshb-wlc',
      mode: 'adapter',
      status: 'not_modified',
      acquisitionStatus: 'REMOTE_NOT_MODIFIED',
      required: false,
      allowFallback: false,
      allowCache: false,
      durationMs: 50,
      requestedUrl: 'https://github.com/openscriptures/morphhb.git',
      resolvedUrl: 'https://github.com/openscriptures/morphhb.git',
      retrievedAt: new Date().toISOString()
    }
  ]

  const manifest = buildRunManifest({
    runId: 'test-remote-success',
    startedAt: '2026-08-29T00:00:00Z',
    completedAt: '2026-08-29T00:01:00Z',
    registryVersion: '1.0.0',
    workers: 2,
    jobs
  })

  assert.equal(manifest.totals.remoteSynced, 1)
  assert.equal(manifest.totals.notModified, 1)
  assert.equal(manifest.totals.fallback, 0)
  assert.equal(manifest.totals.failed, 0)
})

test('Contract Test: remote failure and disallowed fallback gate checks', () => {
  const jobs: UpstreamJobResult[] = [
    {
      id: 'hinduism:gretil-vedic',
      traditionId: 'hinduism',
      endpointId: 'gretil-vedic',
      mode: 'script',
      status: 'failed',
      acquisitionStatus: 'REMOTE_FAILED',
      required: false,
      allowFallback: false,
      allowCache: false,
      durationMs: 200,
      error: 'HTTP 404 Not Found'
    },
    {
      id: 'bahai:bahai-library',
      traditionId: 'bahai',
      endpointId: 'bahai-library',
      mode: 'script',
      status: 'fallback',
      acquisitionStatus: 'LOCAL_FALLBACK',
      required: false,
      allowFallback: false, // Disallowed fallback!
      allowCache: false,
      durationMs: 200,
      fallbackReason: 'HTTP 404 Not Found'
    }
  ]

  const manifest = buildRunManifest({
    runId: 'test-failures',
    startedAt: '2026-08-29T00:00:00Z',
    completedAt: '2026-08-29T00:01:00Z',
    registryVersion: '1.0.0',
    workers: 2,
    jobs
  })

  assert.equal(manifest.totals.failed, 1)
  assert.equal(manifest.totals.fallback, 1)
  assert.equal(manifest.totals.remoteSynced, 0)
})

test('Contract Test: allowed cache vs allowed fallback policies', () => {
  const jobs: UpstreamJobResult[] = [
    {
      id: 'christianity:sblgnt',
      traditionId: 'christianity',
      endpointId: 'sblgnt',
      mode: 'adapter',
      status: 'cache',
      acquisitionStatus: 'LOCAL_CACHE',
      required: false,
      allowFallback: false,
      allowCache: true, // explicitly permitted cache
      durationMs: 10
    },
    {
      id: 'shinto:sacred-texts-shinto',
      traditionId: 'shinto',
      endpointId: 'sacred-texts-shinto',
      mode: 'script',
      status: 'fallback',
      acquisitionStatus: 'LOCAL_FALLBACK',
      required: false,
      allowFallback: true, // explicitly permitted fallback
      allowCache: false,
      durationMs: 15,
      fallbackReason: 'Remote host offline'
    }
  ]

  const manifest = buildRunManifest({
    runId: 'test-policy',
    startedAt: '2026-08-29T00:00:00Z',
    completedAt: '2026-08-29T00:01:00Z',
    registryVersion: '1.0.0',
    workers: 2,
    defaultAllowFallback: true,
    jobs
  })

  assert.equal(manifest.totals.cache, 1)
  assert.equal(manifest.totals.fallback, 1)
  assert.equal(manifest.totals.failed, 0)
  assert.equal(manifest.policy.defaultAllowFallback, true)
})

test('Contract Test: mixed worker pool results aggregation', () => {
  const jobs: UpstreamJobResult[] = [
    {
      id: 'a',
      traditionId: 'tradA',
      endpointId: 'epA',
      mode: 'adapter',
      status: 'succeeded',
      acquisitionStatus: 'REMOTE_SYNCED',
      required: true,
      allowFallback: false,
      allowCache: false,
      durationMs: 10
    },
    {
      id: 'b',
      traditionId: 'tradB',
      endpointId: 'epB',
      mode: 'adapter',
      status: 'not_modified',
      acquisitionStatus: 'REMOTE_NOT_MODIFIED',
      required: false,
      allowFallback: false,
      allowCache: false,
      durationMs: 10
    },
    {
      id: 'c',
      traditionId: 'tradC',
      endpointId: 'epC',
      mode: 'adapter',
      status: 'cache',
      acquisitionStatus: 'LOCAL_CACHE',
      required: false,
      allowFallback: false,
      allowCache: true,
      durationMs: 10
    },
    {
      id: 'd',
      traditionId: 'tradD',
      endpointId: 'epD',
      mode: 'script',
      status: 'fallback',
      acquisitionStatus: 'LOCAL_FALLBACK',
      required: false,
      allowFallback: true,
      allowCache: false,
      durationMs: 10
    },
    {
      id: 'e',
      traditionId: 'tradE',
      endpointId: 'epE',
      mode: 'adapter',
      status: 'failed',
      acquisitionStatus: 'REMOTE_FAILED',
      required: false,
      allowFallback: false,
      allowCache: false,
      durationMs: 10
    },
    {
      id: 'f',
      traditionId: 'tradF',
      endpointId: 'epF',
      mode: 'adapter',
      status: 'unsupported',
      acquisitionStatus: 'UNSUPPORTED',
      required: false,
      allowFallback: false,
      allowCache: false,
      durationMs: 10
    }
  ]

  const manifest = buildRunManifest({
    runId: 'test-mixed',
    startedAt: '2026-08-29T00:00:00Z',
    completedAt: '2026-08-29T00:01:00Z',
    registryVersion: '1.0.0',
    workers: 6,
    jobs
  })

  assert.equal(manifest.totals.planned, 6)
  assert.equal(manifest.totals.remoteSynced, 1)
  assert.equal(manifest.totals.notModified, 1)
  assert.equal(manifest.totals.cache, 1)
  assert.equal(manifest.totals.fallback, 1)
  assert.equal(manifest.totals.failed, 1)
  assert.equal(manifest.totals.unsupported, 1)
})
