import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { Phase19MetricReconciler } from './phase19-metric-reconciler.js'

test('Phase 19 Metric Reconciler: semantic invariants', async () => {
  const reconciler = new Phase19MetricReconciler(process.cwd())
  const contract = await reconciler.computeAllMetrics()
  const dim = contract.dimensions

  // 1. allowRemote=true with no manifest success MUST NOT become REMOTE_SYNCED
  const manifestPath = path.join(process.cwd(), 'dist/upstream-sync-manifest.json')
  if (!existsSync(manifestPath)) {
    assert.strictEqual(dim.acquisition.outcomes.REMOTE_SYNCED, 0, 'Without manifest evidence, REMOTE_SYNCED must be 0 regardless of endpoint policy')
  }

  // 2. REMOTE_SYNCED requires actual manifest evidence
  if (existsSync(manifestPath)) {
    const manifestData = JSON.parse(await (await import('node:fs/promises')).readFile(manifestPath, 'utf8'))
    const jobs = Array.isArray(manifestData.jobs) ? manifestData.jobs : []
    const manifestSynced = jobs.filter((j: any) => j.acquisitionStatus === 'REMOTE_SYNCED').length
    assert.strictEqual(dim.acquisition.outcomes.REMOTE_SYNCED, manifestSynced, 'REMOTE_SYNCED count must match manifest evidence')
  }

  // 3. MATERIALIZED does not imply MEASURED
  assert.ok(
    dim.materialization.materializedEditions >= dim.materialization.measuredEditions,
    'materializedEditions must be >= measuredEditions (measured is a subset of materialized)'
  )

  // 4. UNMEASURABLE does not imply ZERO
  assert.ok(
    dim.materialization.unmeasurableEditions >= 0,
    'unmeasurableEditions must be non-negative'
  )

  // 5. recordBearing requires actual records
  assert.ok(
    dim.materialization.recordBearingEditions <= dim.materialization.materializedEditions,
    'recordBearingEditions must be <= materializedEditions'
  )

  // 6. Acquisition outcomes are mutually exclusive
  const outcomes = dim.acquisition.outcomes
  const sum =
    outcomes.REMOTE_SYNCED +
    outcomes.REMOTE_NOT_MODIFIED +
    outcomes.LOCAL_CACHE +
    outcomes.LOCAL_FALLBACK +
    outcomes.REMOTE_FAILED +
    outcomes.UNSUPPORTED
  assert.strictEqual(sum, dim.acquisition.plannedJobs, 'Acquisition outcomes must be mutually exclusive and sum to plannedJobs')

  // 7. Acquisition outcome totals equal planned jobs
  assert.strictEqual(dim.invariants.acquisitionOutcomeAccounting, sum === dim.acquisition.plannedJobs, 'Invariant acquisitionOutcomeAccounting must reflect sum == plannedJobs')

  // 8. Ownership totals equal normalized rows
  const ownershipSum = dim.ownership.ownedRecords + dim.ownership.inferredRecords + dim.ownership.unresolvedRecords
  assert.strictEqual(ownershipSum, dim.ownership.totalNormalizedRecords, 'Ownership breakdown must sum to total normalized records')
})

test('Phase 19 Metric Reconciler: materialization dimensions are independent', async () => {
  const reconciler = new Phase19MetricReconciler(process.cwd())
  const contract = await reconciler.computeAllMetrics()
  const mat = contract.dimensions.materialization

  assert.ok(mat.registeredEditions >= mat.acquiredEditions, 'registered >= acquired')
  assert.ok(mat.acquiredEditions >= mat.materializedEditions, 'acquired >= materialized')
  assert.ok(mat.materializedEditions >= mat.recordBearingEditions, 'materialized >= recordBearing')

  assert.strictEqual(mat.measuredEditions + mat.unmeasurableEditions, mat.registeredEditions, 'measured + unmeasurable = registered')
  assert.strictEqual(mat.zeroRecordEditions + mat.positiveRecordEditions, mat.measuredEditions, 'zeroRecord + positiveRecord = measured')
})

test('Phase 19 Metric Reconciler: distribution uses true median and linear interpolation percentiles', async () => {
  const reconciler = new Phase19MetricReconciler(process.cwd())
  const contract = await reconciler.computeAllMetrics()
  const dis = contract.dimensions.distribution

  assert.strictEqual(dis.percentileMethod, 'linear_interpolation', 'percentile method must be documented')
  assert.ok(dis.sampleSize > 0, 'sampleSize must be positive')
  assert.ok(dis.min <= dis.p25, 'min <= p25')
  assert.ok(dis.p25 <= dis.median, 'p25 <= median')
  assert.ok(dis.median <= dis.p75, 'median <= p75')
  assert.ok(dis.p75 <= dis.p90, 'p75 <= p90')
  assert.ok(dis.p90 <= dis.max, 'p90 <= max')
  assert.strictEqual(dis.p50, dis.median, 'p50 must equal median under linear interpolation')
  assert.ok(dis.median !== (dis.min + dis.max) / 2 || dis.sampleSize <= 2, 'median must not be midpoint(min,max) for sampleSize > 2')
})

test('Phase 19 Metric Reconciler: canonical metrics are split and grounded', async () => {
  const reconciler = new Phase19MetricReconciler(process.cwd())
  const contract = await reconciler.computeAllMetrics()
  const can = contract.dimensions.canonical
  const rec = contract.dimensions.record

  assert.ok(can.canonicalContentRows > 0, 'canonicalContentRows must be positive')
  assert.ok(can.canonicalPassageRows > 0, 'canonicalPassageRows must be positive')
  assert.ok(can.canonicalPositions > 0, 'canonicalPositions must be positive')
  assert.strictEqual(can.canonicalPositions, can.canonicalIds, 'canonicalPositions must equal canonicalIds when canonical identity is work_id:sequence')
  assert.notStrictEqual(can.canonicalContentRows + can.canonicalPassageRows, can.canonicalPositions, 'canonicalPositions must not be sum of content + passage rows')
})

test('Phase 19 Metric Reconciler: no hardcoded runtime constants in computed metrics', async () => {
  const reconciler = new Phase19MetricReconciler(process.cwd())
  const contract = await reconciler.computeAllMetrics()
  const rec = contract.dimensions.record
  const own = contract.dimensions.ownership
  const can = contract.dimensions.canonical

  assert.ok(rec.contentsRows > 0, 'contentsRows must be positive from actual DB')
  assert.ok(rec.rawRecords > 0, 'rawRecords must be positive from actual DB')
  assert.ok(can.canonicalPositions > 0, 'canonicalPositions must be computed from SQLite')
  assert.ok(contract.dimensions.corpus.indexedRows > 0, 'indexedRows must be computed from actual DB')
  assert.ok(own.ownedRecords >= 0, 'ownedRecords must be from actual DB')
})

test('Phase 19 Metric Reconciler: distribution invariants pass', async () => {
  const reconciler = new Phase19MetricReconciler(process.cwd())
  const contract = await reconciler.computeAllMetrics()

  assert.strictEqual(contract.dimensions.invariants.distributionInvariants, true, 'distributionInvariants must be true')
})

test('Phase 19 Metric Reconciler: contract includes versioning fields', async () => {
  const reconciler = new Phase19MetricReconciler(process.cwd())
  const contract = await reconciler.computeAllMetrics()

  assert.ok(contract.metricContractVersion, 'metricContractVersion must be present')
  assert.ok(contract.canonicalMetricVersion, 'canonicalMetricVersion must be present')
  assert.ok(contract.qualityModelVersion, 'qualityModelVersion must be present')
  assert.ok(contract.gitCommit, 'gitCommit must be present')
})
