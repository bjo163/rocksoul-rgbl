import assert from 'node:assert/strict'
import test from 'node:test'

import { LABEL_ROLES, isLabelRole } from './labels.js'

test('label roles are explicit and minimal', () => {
  assert.deepEqual(LABEL_ROLES, ['preferred', 'alternate'])
  assert.equal(isLabelRole('preferred'), true)
  assert.equal(isLabelRole('alternate'), true)
  assert.equal(isLabelRole('canonical'), false)
})
