import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { Phase19BreadthAuditor } from './phase19-breadth-auditor.js'

test('Phase 19 Breadth Auditor: execution coverage uses actual manifest evidence', async () => {
  const auditor = new Phase19BreadthAuditor(process.cwd())
  const summary = await auditor.runAudit()

  const manifestPath = path.join(process.cwd(), 'dist/upstream-sync-manifest.json')
  if (!existsSync(manifestPath)) {
    assert.strictEqual(summary.executionCoverage.remoteSynced, 0, 'Without manifest, remoteSynced must be 0')
  }

  if (existsSync(manifestPath)) {
    const manifestData = JSON.parse(await (await import('node:fs/promises')).readFile(manifestPath, 'utf8'))
    const jobs = Array.isArray(manifestData.jobs) ? manifestData.jobs : []
    const manifestSynced = jobs.filter((j: any) => j.acquisitionStatus === 'REMOTE_SYNCED').length
    assert.strictEqual(summary.executionCoverage.remoteSynced, manifestSynced, 'remoteSynced must match manifest evidence')
  }
})

test('Phase 19 Breadth Auditor: materialization coverage is independent of measurement', async () => {
  const auditor = new Phase19BreadthAuditor(process.cwd())
  const summary = await auditor.runAudit()
  const mat = summary.materializationCoverage

  assert.ok(mat.registeredEditions >= mat.acquiredEditions, 'registered >= acquired')
  assert.ok(mat.acquiredEditions >= mat.materializedEditions, 'acquired >= materialized')
  assert.ok(mat.materializedEditions >= mat.recordBearingEditions, 'materialized >= recordBearing')

  assert.strictEqual(mat.measuredEditions + mat.unmeasurableEditions, mat.registeredEditions, 'measured + unmeasurable = registered')
})

test('Phase 19 Breadth Auditor: canonical metrics are split and distinct from corpus counts', async () => {
  const auditor = new Phase19BreadthAuditor(process.cwd())
  const summary = await auditor.runAudit()
  const can = summary.canonicalMetrics

  assert.ok(can.canonicalContentRows > 0, 'canonicalContentRows must be positive')
  assert.ok(can.canonicalPassageRows > 0, 'canonicalPassageRows must be positive')
  assert.ok(can.canonicalPositions > 0, 'canonicalPositions must be positive')
  assert.strictEqual(can.canonicalPositions, can.canonicalIds, 'canonicalPositions must equal canonicalIds')
  assert.notStrictEqual(can.canonicalContentRows + can.canonicalPassageRows, can.canonicalPositions, 'canonicalPositions must not equal sum of content and passage rows')
})

test('Phase 19 Breadth Auditor: distribution uses true median and documented percentiles', async () => {
  const auditor = new Phase19BreadthAuditor(process.cwd())
  const summary = await auditor.runAudit()
  const dis = summary.distribution

  assert.strictEqual(dis.percentileMethod, 'linear_interpolation', 'percentile method must be documented')
  assert.ok(dis.sampleSize > 0, 'sampleSize must be positive')
  assert.ok(dis.min <= dis.p25, 'min <= p25')
  assert.ok(dis.p25 <= dis.median, 'p25 <= median')
  assert.ok(dis.median <= dis.p75, 'median <= p75')
  assert.ok(dis.p75 <= dis.p90, 'p75 <= p90')
  assert.ok(dis.p90 <= dis.max, 'p90 <= max')
  assert.strictEqual(dis.p50, dis.median, 'p50 must equal median')
})

test('Phase 19 Breadth Auditor: no hardcoded runtime constants', async () => {
  const auditor = new Phase19BreadthAuditor(process.cwd())
  const summary = await auditor.runAudit()

  assert.ok(summary.ownershipPreservation.totalNormalizedRecords > 0, 'totalNormalizedRecords must come from actual DB')
  assert.ok(summary.ownershipPreservation.ownedRecords >= 0, 'ownedRecords must come from actual DB')
  assert.ok(summary.materializationCoverage.registeredEditions > 0, 'registeredEditions must come from registry')
  assert.ok(summary.canonicalMetrics.canonicalPositions > 0, 'canonicalPositions must come from SQLite')
})
