import assert from 'node:assert/strict'
import test from 'node:test'

import { RECORD_LIFECYCLE_STATUSES, isRecordLifecycleStatus } from './lifecycle.js'

test('record lifecycle vocabulary is intentionally minimal and universal', () => {
  assert.deepEqual(RECORD_LIFECYCLE_STATUSES, ['current', 'superseded', 'retired'])
  for (const status of RECORD_LIFECYCLE_STATUSES) assert.equal(isRecordLifecycleStatus(status), true)

  for (const workflowOrDomainState of ['draft', 'reviewed', 'approved', 'retracted', 'active']) {
    assert.equal(isRecordLifecycleStatus(workflowOrDomainState), false)
  }
})
