import assert from 'node:assert/strict'
import test from 'node:test'
import { assertAssertionObject, isAssertionObject } from './assertion-values.js'

test('assertion object accepts entity and literal envelopes', () => {
  assert.doesNotThrow(() => assertAssertionObject({ entity: 'mw:person:musa' }))
  assert.doesNotThrow(() => assertAssertionObject({ value: 'Musa', language: 'id' }))
  assert.doesNotThrow(() => assertAssertionObject({ value: 42, datatype: 'xsd:integer' }))
  assert.equal(isAssertionObject({ value: true }), true)
})

test('assertion object rejects ambiguous or invalid literal envelopes', () => {
  assert.throws(() => assertAssertionObject({ entity: 'mw:person:musa', value: 'Musa' }), TypeError)
  assert.throws(() => assertAssertionObject({ value: 42, language: 'en' }), TypeError)
  assert.throws(() => assertAssertionObject({ value: 'Musa', language: 'EN' }), TypeError)
  assert.throws(() => assertAssertionObject({ value: Number.NaN }), TypeError)
  assert.throws(() => assertAssertionObject({ value: 'Musa', extra: true }), TypeError)
})
