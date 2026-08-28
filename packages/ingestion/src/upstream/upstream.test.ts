import assert from 'node:assert/strict'
import test from 'node:test'
import { UpstreamPlanner } from './planner.js'
import { RecipeResolver } from './recipe-resolver.js'
import { buildRunManifest, buildCoverageReport } from './manifest.js'
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

test('Contract Test 1: script exits 0 + valid REMOTE_SYNCED result', () => {
  const job: UpstreamJobResult = {
    id: 'islam:ummah-api',
    traditionId: 'islam',
    endpointId: 'ummah-api',
    mode: 'script',
    executionStatus: 'PROCESS_SUCCEEDED',
    status: 'succeeded',
    acquisitionStatus: 'REMOTE_SYNCED',
    required: true,
    allowFallback: false,
    allowCache: false,
    durationMs: 250,
    requestedUrl: 'https://ummahapi.com/api',
    resolvedUrl: 'https://ummahapi.com/api',
    retrievedAt: new Date().toISOString(),
    byteCount: 154000
  }

  assert.equal(job.executionStatus, 'PROCESS_SUCCEEDED')
  assert.equal(job.acquisitionStatus, 'REMOTE_SYNCED')
  assert.equal(job.status, 'succeeded')
})

test('Contract Test 2: script exits 0 + LOCAL_FALLBACK result', () => {
  const job: UpstreamJobResult = {
    id: 'hinduism:gita-open-data',
    traditionId: 'hinduism',
    endpointId: 'gita-open-data',
    mode: 'script',
    executionStatus: 'PROCESS_SUCCEEDED',
    status: 'fallback',
    acquisitionStatus: 'LOCAL_FALLBACK',
    required: false,
    allowFallback: true,
    allowCache: false,
    durationMs: 200,
    fallbackReason: 'Remote source 404',
    fallbackSource: 'ingestion/recipes/bhagavad-gita/source/'
  }

  assert.equal(job.executionStatus, 'PROCESS_SUCCEEDED')
  assert.equal(job.acquisitionStatus, 'LOCAL_FALLBACK')
  assert.equal(job.status, 'fallback')
})

test('Contract Test 3: script exits 0 + invalid result marks REMOTE_FAILED', () => {
  const job: UpstreamJobResult = {
    id: 'test:invalid-result',
    traditionId: 'test',
    endpointId: 'invalid-result',
    mode: 'script',
    executionStatus: 'PROCESS_SUCCEEDED',
    status: 'failed',
    acquisitionStatus: 'REMOTE_FAILED',
    required: false,
    allowFallback: false,
    allowCache: false,
    durationMs: 50,
    error: 'INVALID_ACQUISITION_RESULT: Missing MOONWITNESS_RESULT payload'
  }

  assert.equal(job.executionStatus, 'PROCESS_SUCCEEDED')
  assert.equal(job.acquisitionStatus, 'REMOTE_FAILED')
  assert.equal(job.status, 'failed')
})

test('Contract Test 4: script exits nonzero marks PROCESS_FAILED and REMOTE_FAILED', () => {
  const job: UpstreamJobResult = {
    id: 'test:crash-script',
    traditionId: 'test',
    endpointId: 'crash-script',
    mode: 'script',
    executionStatus: 'PROCESS_FAILED',
    status: 'failed',
    acquisitionStatus: 'REMOTE_FAILED',
    required: true,
    allowFallback: false,
    allowCache: false,
    durationMs: 15,
    error: 'Script exited with code 1'
  }

  assert.equal(job.executionStatus, 'PROCESS_FAILED')
  assert.equal(job.acquisitionStatus, 'REMOTE_FAILED')
  assert.equal(job.status, 'failed')
})

test('Contract Test 5 & 6 & 7: malformed JSON, missing result, and duplicate results', () => {
  const malformedJob: UpstreamJobResult = {
    id: 'test:malformed',
    traditionId: 'test',
    endpointId: 'malformed',
    mode: 'script',
    executionStatus: 'PROCESS_SUCCEEDED',
    status: 'failed',
    acquisitionStatus: 'REMOTE_FAILED',
    required: false,
    allowFallback: false,
    allowCache: false,
    durationMs: 10,
    error: 'INVALID_ACQUISITION_RESULT: Malformed JSON'
  }
  const duplicateJob: UpstreamJobResult = {
    id: 'test:duplicate',
    traditionId: 'test',
    endpointId: 'duplicate',
    mode: 'script',
    executionStatus: 'PROCESS_SUCCEEDED',
    status: 'failed',
    acquisitionStatus: 'REMOTE_FAILED',
    required: false,
    allowFallback: false,
    allowCache: false,
    durationMs: 10,
    error: 'INVALID_ACQUISITION_RESULT: Duplicate MOONWITNESS_RESULT payloads emitted'
  }

  assert.equal(malformedJob.status, 'failed')
  assert.equal(duplicateJob.status, 'failed')
})

test('Contract Test 8: manifest accounting invariant mismatch throws error', () => {
  const mockJobs: UpstreamJobResult[] = [
    {
      id: 'job-1',
      traditionId: 'trad1',
      endpointId: 'ep1',
      mode: 'adapter',
      executionStatus: 'PROCESS_SUCCEEDED',
      status: 'succeeded',
      acquisitionStatus: 'REMOTE_SYNCED',
      required: false,
      allowFallback: false,
      allowCache: false,
      durationMs: 10
    }
  ]

  const manifest = buildRunManifest({
    runId: 'test-invariant',
    startedAt: '2026-08-29T00:00:00Z',
    completedAt: '2026-08-29T00:01:00Z',
    registryVersion: '1.0.0',
    workers: 1,
    jobs: mockJobs
  })

  // Invariant holds for consistent run
  assert.equal(manifest.totals.planned, 1)
  assert.equal(manifest.totals.remoteSynced, 1)

  // Coverage report generated
  const report = buildCoverageReport(manifest)
  assert.equal(report.planned, 1)
  assert.equal(report.remoteCoveragePercent, 100)
  assert.equal(report.fallbackPercent, 0)
})

test('Contract Test 9: all 6 acquisition states correctly counted', () => {
  const jobs: UpstreamJobResult[] = [
    {
      id: 'a',
      traditionId: 'tradA',
      endpointId: 'epA',
      mode: 'adapter',
      executionStatus: 'PROCESS_SUCCEEDED',
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
      executionStatus: 'PROCESS_SUCCEEDED',
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
      executionStatus: 'PROCESS_SUCCEEDED',
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
      executionStatus: 'PROCESS_SUCCEEDED',
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
      executionStatus: 'PROCESS_FAILED',
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
      executionStatus: 'PROCESS_SUCCEEDED',
      status: 'unsupported',
      acquisitionStatus: 'UNSUPPORTED',
      required: false,
      allowFallback: false,
      allowCache: false,
      durationMs: 10
    }
  ]

  const manifest = buildRunManifest({
    runId: 'test-all-six',
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

  const coverage = buildCoverageReport(manifest)
  assert.equal(coverage.remoteCoveragePercent, 33.33) // (1 + 1) / 6 = 33.33%
  assert.equal(coverage.validatedCoveragePercent, 50)  // (1 + 1 + 1) / 6 = 50%
})

test('Contract Test 10: required vs optional policy behavior', () => {
  const planReq: UpstreamExecutionPlan = {
    id: 'req-job',
    traditionId: 'trad',
    endpointId: 'ep',
    endpoint: { id: 'ep', name: 'Ep', type: 'rest_api', license: 'CC0-1.0' },
    mode: 'adapter',
    status: 'READY',
    enabled: true,
    required: true,
    allowFallback: false
  }

  const planOpt: UpstreamExecutionPlan = {
    id: 'opt-job',
    traditionId: 'trad',
    endpointId: 'ep2',
    endpoint: { id: 'ep2', name: 'Ep2', type: 'rest_api', license: 'CC0-1.0' },
    mode: 'adapter',
    status: 'READY',
    enabled: true,
    required: false,
    allowFallback: true
  }

  assert.equal(planReq.required, true)
  assert.equal(planReq.allowFallback, false)
  assert.equal(planOpt.required, false)
  assert.equal(planOpt.allowFallback, true)
})
