import assert from 'node:assert/strict'
import test from 'node:test'
import { Phase21DepthAuditor } from './phase21-depth-auditor.js'

test('Phase 21 depth is derived from real retained records', async () => {
  const report=await new Phase21DepthAuditor(process.cwd()).runAudit()
  assert.equal(report.totals.registeredEditions, 618)
  assert.equal(report.totals.materializedEditions, report.totals.measuredEditions)
  assert.equal(report.totals.unmeasurableEditions, 580)
  assert.ok(report.totals.materializationRate < 100)
  assert.ok(report.unmeasurableReasons.NO_RECORD_DATA > 0)
  assert.ok(report.workDepth.every(w=>w.reasons.every(reason=>['SINGLE_EDITION','SINGLE_LANGUAGE','SINGLE_SOURCE','LOW_RECORD_COVERAGE','LOW_CANONICAL_COVERAGE','PARTIAL_OWNERSHIP','UNMEASURABLE_EDITION'].includes(reason))))
})
