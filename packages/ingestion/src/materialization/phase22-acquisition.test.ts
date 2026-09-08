import assert from 'node:assert/strict'
import test from 'node:test'
import { MaterializationAuditor } from './materialization-auditor.js'

test('Phase 22 materialization audit is idempotent and does not inflate records', async () => {
  const first = await new MaterializationAuditor(process.cwd()).runAudit()
  const second = await new MaterializationAuditor(process.cwd()).runAudit()
  assert.deepEqual(
    [first.summary.totalEditions, first.summary.recordBearingEditions, first.summary.zeroRecordEditions],
    [second.summary.totalEditions, second.summary.recordBearingEditions, second.summary.zeroRecordEditions]
  )
  assert.equal(first.summary.recordBearingEditions, 38)
  assert.equal(first.zeroRecordEditions.length, 580)
})
