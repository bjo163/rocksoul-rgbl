import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalId } from '@moonwitness/corpus-core'
import {
  COMPARISON_BOUNDARY,
  clampGraphDepth,
  hrefForRecord
} from './lib/presentation.js'

const id = 'mw:resource:example:item' as CanonicalId

test('record links route passages and core record families to dedicated explorer pages', () => {
  assert.equal(hrefForRecord(id, 'resource', 'textual.passage'), `/passage/${encodeURIComponent(id)}`)
  assert.equal(hrefForRecord(id, 'resource', 'textual.work'), `/resource/${encodeURIComponent(id)}`)
  assert.equal(hrefForRecord('mw:entity:example:item' as CanonicalId, 'entity'), '/entity/mw%3Aentity%3Aexample%3Aitem')
})

test('graph depth is always bounded to the public explorer safety range', () => {
  assert.equal(clampGraphDepth('0'), 1)
  assert.equal(clampGraphDepth('2'), 2)
  assert.equal(clampGraphDepth('99'), 3)
  assert.equal(clampGraphDepth('not-a-number'), 1)
})

test('comparison copy explicitly rejects identity and equivalence inference', () => {
  assert.match(COMPARISON_BOUNDARY, /does not assert identity/i)
  assert.match(COMPARISON_BOUNDARY, /equivalence/i)
})
