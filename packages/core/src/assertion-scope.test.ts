import assert from 'node:assert/strict'
import test from 'node:test'

import { assertAssertionScope, isAssertionScope } from './assertion-scope.js'

test('accepts the five explicit universal assertion scope dimensions', () => {
  assert.equal(isAssertionScope({
    tradition: 'mw:tradition:example',
    community: 'mw:community:example',
    agent: 'mw:agent:example',
    period: 'mw:period:example',
    place: 'mw:place:example'
  }), true)
})

test('rejects empty, literal, and undeclared assertion scope dimensions', () => {
  assert.equal(isAssertionScope({}), false)
  assert.equal(isAssertionScope({ period: 'late-antiquity' }), false)
  assert.throws(() => assertAssertionScope({ denomination: 'mw:community:example' }), TypeError)
})
