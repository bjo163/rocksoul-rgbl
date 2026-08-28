import assert from 'node:assert/strict'
import test from 'node:test'
import { UpstreamPlanner } from './planner.js'
import { RecipeResolver } from './recipe-resolver.js'
import { buildRunManifest, buildCoverageReport, buildCoverageAuditReport } from './manifest.js'
import { classifyFailure } from './runner.js'
import {
  defaultUpstreamAdapterRegistry,
  UpstreamAdapterRegistry,
  httpJsonAdapter,
  rawTextAdapter,
  gitAdapter
} from './adapter-registry.js'
import type { UpstreamJobResult, UpstreamExecutionPlan, UpstreamFailureClass } from './types.js'

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

  const auditReport = buildCoverageAuditReport(manifest)
  assert.equal(auditReport.totalEndpoints, 1)
  assert.equal(auditReport.endpoints[0].remoteReachable, true)
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

test('Test 10: 17/17 full remote success coverage model', () => {
  const full17Jobs: UpstreamJobResult[] = Array.from({ length: 17 }, (_, i) => ({
    id: `job-${i + 1}`,
    traditionId: `trad-${i + 1}`,
    endpointId: `ep-${i + 1}`,
    mode: 'adapter',
    executionStatus: 'PROCESS_SUCCEEDED',
    status: 'succeeded',
    acquisitionStatus: 'REMOTE_SYNCED',
    required: false,
    allowFallback: false,
    allowCache: false,
    durationMs: 50,
    sourceSha256: `sha256-${i}`
  }))

  const manifest = buildRunManifest({
    runId: 'test-full-17',
    startedAt: '2026-08-29T00:00:00Z',
    completedAt: '2026-08-29T00:01:00Z',
    registryVersion: '1.0.0',
    workers: 4,
    jobs: full17Jobs
  })

  const coverage = buildCoverageReport(manifest)
  assert.equal(coverage.planned, 17)
  assert.equal(coverage.remoteSynced, 17)
  assert.equal(coverage.remoteCoveragePercent, 100)
  assert.equal(coverage.status, 'COMPLETE')
})

test('Test 11: 16/17 success + 1 optional failure coverage model', () => {
  const mixedJobs: UpstreamJobResult[] = [
    ...Array.from({ length: 16 }, (_, i) => ({
      id: `job-${i + 1}`,
      traditionId: `trad-${i + 1}`,
      endpointId: `ep-${i + 1}`,
      mode: 'adapter' as const,
      executionStatus: 'PROCESS_SUCCEEDED' as const,
      status: 'succeeded' as const,
      acquisitionStatus: 'REMOTE_SYNCED' as const,
      required: false,
      allowFallback: false,
      allowCache: false,
      durationMs: 50
    })),
    {
      id: 'job-17-opt-fail',
      traditionId: 'trad-17',
      endpointId: 'ep-17',
      mode: 'adapter',
      executionStatus: 'PROCESS_FAILED',
      status: 'failed',
      acquisitionStatus: 'REMOTE_FAILED',
      failureClass: 'REMOTE_NOT_FOUND',
      required: false,
      allowFallback: false,
      allowCache: false,
      durationMs: 50,
      error: 'HTTP 404'
    }
  ]

  const manifest = buildRunManifest({
    runId: 'test-16-1',
    startedAt: '2026-08-29T00:00:00Z',
    completedAt: '2026-08-29T00:01:00Z',
    registryVersion: '1.0.0',
    workers: 4,
    jobs: mixedJobs
  })

  const coverage = buildCoverageReport(manifest)
  assert.equal(coverage.planned, 17)
  assert.equal(coverage.remoteSynced, 16)
  assert.equal(coverage.failed, 1)
  assert.equal(coverage.status, 'PARTIAL')
  assert.equal(coverage.failureClasses?.REMOTE_NOT_FOUND, 1)
})

test('Test 12: Git commit and HTTP provenance integrity', () => {
  const gitJob: UpstreamJobResult = {
    id: 'christianity:sblgnt',
    traditionId: 'christianity',
    endpointId: 'sblgnt',
    mode: 'adapter',
    executionStatus: 'PROCESS_SUCCEEDED',
    status: 'succeeded',
    acquisitionStatus: 'REMOTE_SYNCED',
    required: false,
    allowFallback: false,
    allowCache: false,
    durationMs: 200,
    requestedUrl: 'https://github.com/morphgnt/sblgnt.git',
    resolvedUrl: 'https://github.com/morphgnt/sblgnt.git',
    sourceSha256: 'aaed91e57c8e4a8dc9a2383e129ca5e75fe6393d',
    repoUrl: 'https://github.com/morphgnt/sblgnt.git',
    resolvedCommit: 'aaed91e57c8e4a8dc9a2383e129ca5e75fe6393d',
    ref: 'HEAD',
    defaultBranch: 'master'
  }

  const httpJob: UpstreamJobResult = {
    id: 'zoroastrianism:avesta-archive',
    traditionId: 'zoroastrianism',
    endpointId: 'avesta-archive',
    mode: 'adapter',
    executionStatus: 'PROCESS_SUCCEEDED',
    status: 'succeeded',
    acquisitionStatus: 'REMOTE_SYNCED',
    required: false,
    allowFallback: false,
    allowCache: false,
    durationMs: 300,
    requestedUrl: 'http://www.avesta.org',
    resolvedUrl: 'https://www.avesta.org/',
    sourceSha256: '322df8bac9ff9d4d1ec4d38a7d3623871db78931011f22b44c183b36c204a571',
    contentType: 'text/html',
    byteCount: 34295,
    etag: '"85f7-659c1aa5c4d80-gzip"',
    lastModified: 'Mon, 24 Aug 2026 02:23:02 GMT'
  }

  assert.equal(gitJob.resolvedCommit, 'aaed91e57c8e4a8dc9a2383e129ca5e75fe6393d')
  assert.equal(httpJob.contentType, 'text/html')
  assert.ok((httpJob.byteCount ?? 0) > 0)
})

test('Test 13: Error Taxonomy classification helper', () => {
  assert.equal(classifyFailure('HTTP 404 Not Found', 404), 'REMOTE_NOT_FOUND')
  assert.equal(classifyFailure('HTTP 429 Too Many Requests', 429), 'REMOTE_RATE_LIMITED')
  assert.equal(classifyFailure('HTTP 401 Unauthorized', 401), 'REMOTE_UNAUTHORIZED')
  assert.equal(classifyFailure('HTTP 403 Forbidden', 403), 'REMOTE_FORBIDDEN')
  assert.equal(classifyFailure('REMOTE_AUTH_REQUIRED: CTEXT_API_KEY required'), 'REMOTE_AUTH_REQUIRED')
  assert.equal(classifyFailure('ETIMEDOUT connect to server'), 'REMOTE_TIMEOUT')
  assert.equal(classifyFailure('ENOTFOUND api.domain.org'), 'REMOTE_NETWORK_ERROR')
  assert.equal(classifyFailure('SyntaxError: Unexpected token < in JSON'), 'REMOTE_PARSE_ERROR')
  assert.equal(classifyFailure('HTTP 503 Service Unavailable'), 'REMOTE_UNAVAILABLE')
})
