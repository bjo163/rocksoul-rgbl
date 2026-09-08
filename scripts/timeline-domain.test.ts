import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTimelineQueryIndex, temporalStatus, validateEraContainment, validateTemporalInterval } from '../packages/ingestion/src/knowledge/index.js'

test('timeline identity is deterministic and preserves aliases through source IDs', () => {
  const records = [{ id: 'mw:event:wikidata-q1-birth', record_type: 'entity', kind: 'event', extensions: { timeline: { temporal: { year: 100, precision: 'YEAR' } } } }, { id: 'mw:assertion:a', record_type: 'assertion', subject: 'mw:event:wikidata-q1-birth', predicate: 'mw:predicate:related-to', object: { entity: 'mw:person:one' }, provenance: 'mw:provenance:test' }]
  const first = buildTimelineQueryIndex(records)
  const second = buildTimelineQueryIndex(records)
  assert.deepEqual([...first.byPerson], [...second.byPerson])
  assert.deepEqual(first.byPerson.get('mw:person:one'), ['mw:event:wikidata-q1-birth'])
  assert.deepEqual(first.byYear.get(100), ['mw:event:wikidata-q1-birth'])
})

test('temporal precision and disagreement states remain distinguishable', () => {
  assert.equal(temporalStatus({ precision: 'EXACT_DATE', certainty: 'HIGH' }), 'validated')
  assert.equal(temporalStatus({ precision: 'APPROXIMATE', certainty: 'LOW' }), 'uncertain')
  assert.equal(temporalStatus({ precision: 'DISPUTED', status: 'DISPUTED' }), 'disputed')
})

test('chronology validators reject impossible intervals and era escapes', () => {
  assert.equal(validateTemporalInterval(1, 2), true)
  assert.equal(validateTemporalInterval(2, 1), false)
  assert.equal(validateEraContainment(10, 20, 0, 30), true)
  assert.equal(validateEraContainment(10, 40, 0, 30), false)
})
