import test from 'node:test'
import assert from 'node:assert/strict'
import { sha256Bytes } from '../checksum.js'

test('payload hashes are derived from exact retained bytes', () => {
  const original = new TextEncoder().encode('{"edition":"example"}')
  const same = new TextEncoder().encode('{"edition":"example"}')
  const changed = new TextEncoder().encode('{"edition":"changed"}')
  assert.equal(sha256Bytes(original), sha256Bytes(same))
  assert.notEqual(sha256Bytes(original), sha256Bytes(changed))
  assert.match(sha256Bytes(original), /^[0-9a-f]{64}$/)
})
