import test from 'node:test'
import assert from 'node:assert/strict'
import { auditEventGraph } from './audit-phase27-event-graph.js'

test('Phase 27 matrix covers every event without inventing cross-domain edges', () => {
  const records = [
    { id: 'mw:event:one', record_type: 'entity', extensions: { timeline: { temporal: { status: 'SUPPORTED' }, sourceIds: ['Q1', 'Q2'] } } },
    { id: 'mw:assertion:one', record_type: 'assertion', subject: 'mw:event:one', object: { entity: 'mw:person:one' }, extensions: { timeline: { sourceIds: ['Q1', 'Q2'] } } }
  ]
  const report = auditEventGraph(records)
  assert.equal(report.events, 1)
  assert.equal(report.matrix.length, 1)
  assert.equal(report.personsWithEvents, 1)
  assert.equal(report.eventsWithTradition, 0)
  assert.equal(report.eventsWithWork, 0)
  assert.equal(report.eventsWithMultipleSources, 1)
  assert.equal(report.eventsWithIndependentSources, 0)
})

test('Phase 27 matrix is duplicate-free and deterministic', () => {
  const records = [{ id: 'mw:event:two', record_type: 'entity', extensions: { timeline: { temporal: { status: 'DISPUTED' } } } }]
  const first = auditEventGraph(records)
  const second = auditEventGraph(records)
  assert.deepEqual(first, second)
  assert.equal(new Set(first.matrix.map((row) => row.event)).size, first.matrix.length)
})
