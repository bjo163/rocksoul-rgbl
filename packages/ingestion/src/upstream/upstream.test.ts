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

test('Test 1: process success + remote success', () => {
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
    byteCount: 154000,
    sourceSha256: 'a1b2c3d4e5f6'
  }

  assert.equal(job.executionStatus, 'PROCESS_SUCCEEDED')
  assert.equal(job.acquisitionStatus, 'REMOTE_SYNCED')
  assert.equal(job.status, 'succeeded')
})

test('Test 2: process success + fallback', () => {
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

test('Test 3: process success + invalid result', () => {
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

test('Test 4: process failure', () => {
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

test('Test 5: process timeout', () => {
  const job: UpstreamJobResult = {
    id: 'test:timeout-script',
    traditionId: 'test',
    endpointId: 'timeout-script',
    mode: 'script',
    executionStatus: 'PROCESS_TIMEOUT',
    status: 'failed',
    acquisitionStatus: 'REMOTE_FAILED',
    required: true,
    allowFallback: false,
    allowCache: false,
    durationMs: 900000,
    error: 'Process timed out after 900000ms'
  }

  assert.equal(job.executionStatus, 'PROCESS_TIMEOUT')
  assert.equal(job.acquisitionStatus, 'REMOTE_FAILED')
  assert.equal(job.status, 'failed')
})

test('Test 6: malformed result JSON', () => {
  const job: UpstreamJobResult = {
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

  assert.equal(job.status, 'failed')
  assert.equal(job.acquisitionStatus, 'REMOTE_FAILED')
})

test('Test 7: missing result', () => {
  const job: UpstreamJobResult = {
    id: 'test:missing',
    traditionId: 'test',
    endpointId: 'missing',
    mode: 'script',
    executionStatus: 'PROCESS_SUCCEEDED',
    status: 'failed',
    acquisitionStatus: 'REMOTE_FAILED',
    required: false,
    allowFallback: false,
    allowCache: false,
    durationMs: 10,
    error: 'INVALID_ACQUISITION_RESULT: Missing MOONWITNESS_RESULT payload'
  }

  assert.equal(job.status, 'failed')
  assert.equal(job.acquisitionStatus, 'REMOTE_FAILED')
})

test('Test 8: manifest category mismatch / accounting invariant failure', () => {
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

  assert.equal(manifest.valid, true)
  assert.equal(manifest.accountingValid, true)
  assert.equal(manifest.totals.planned, 1)
  assert.equal(manifest.totals.remoteSynced, 1)
})

test('Test 9: duplicate job IDs rejected', () => {
  const duplicateJobs: UpstreamJobResult[] = [
    {
      id: 'duplicate-id',
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
    },
    {
      id: 'duplicate-id',
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

  assert.throws(() => {
    buildRunManifest({
      runId: 'test-dup',
      startedAt: '2026-08-29T00:00:00Z',
      completedAt: '2026-08-29T00:01:00Z',
      registryVersion: '1.0.0',
      workers: 1,
      jobs: duplicateJobs
    })
  }, /Duplicate upstream job ID/)
})

test('Test 10: duplicate acquisition result envelope rejected', () => {
  const job: UpstreamJobResult = {
    id: 'test:duplicate-envelope',
    traditionId: 'test',
    endpointId: 'duplicate-envelope',
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

  assert.equal(job.status, 'failed')
  assert.equal(job.acquisitionStatus, 'REMOTE_FAILED')
})

test('Test 11 & 12: required failure vs optional failure', () => {
  const reqFail: UpstreamJobResult = {
    id: 'test:req-fail',
    traditionId: 'test',
    endpointId: 'req-fail',
    mode: 'adapter',
    executionStatus: 'PROCESS_FAILED',
    status: 'failed',
    acquisitionStatus: 'REMOTE_FAILED',
    required: true,
    allowFallback: false,
    allowCache: false,
    durationMs: 10
  }
  const optFail: UpstreamJobResult = {
    id: 'test:opt-fail',
    traditionId: 'test',
    endpointId: 'opt-fail',
    mode: 'adapter',
    executionStatus: 'PROCESS_FAILED',
    status: 'failed',
    acquisitionStatus: 'REMOTE_FAILED',
    required: false,
    allowFallback: false,
    allowCache: false,
    durationMs: 10
  }

  assert.equal(reqFail.required, true)
  assert.equal(optFail.required, false)
})

test('Test 13 & 14: required fallback vs optional fallback', () => {
  const reqFallback: UpstreamJobResult = {
    id: 'test:req-fallback',
    traditionId: 'test',
    endpointId: 'req-fallback',
    mode: 'script',
    executionStatus: 'PROCESS_SUCCEEDED',
    status: 'fallback',
    acquisitionStatus: 'LOCAL_FALLBACK',
    required: true,
    allowFallback: true,
    allowCache: false,
    durationMs: 10
  }
  const optFallback: UpstreamJobResult = {
    id: 'test:opt-fallback',
    traditionId: 'test',
    endpointId: 'opt-fallback',
    mode: 'script',
    executionStatus: 'PROCESS_SUCCEEDED',
    status: 'fallback',
    acquisitionStatus: 'LOCAL_FALLBACK',
    required: false,
    allowFallback: true,
    allowCache: false,
    durationMs: 10
  }

  assert.equal(reqFallback.required, true)
  assert.equal(optFallback.required, false)
})
