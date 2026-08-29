import assert from 'node:assert/strict'
import test from 'node:test'
import { auditKnowledgeRecords } from '../packages/ingestion/src/knowledge/auditor.js'

test('knowledge domain auditor preserves explicit cross-domain evidence', () => {
  const records = [
    { id: 'mw:tradition:example', record_type: 'entity', kind: 'tradition' },
    { id: 'mw:person:example', record_type: 'entity', kind: 'person' },
    { id: 'mw:work:example', record_type: 'entity', kind: 'work' },
    { id: 'mw:event:example', record_type: 'entity', kind: 'event' },
    { id: 'mw:assertion:1', record_type: 'assertion', subject: 'mw:tradition:example', object: { entity: 'mw:person:example' } },
    { id: 'mw:assertion:2', record_type: 'assertion', subject: 'mw:person:example', object: { entity: 'mw:work:example' } },
    { id: 'mw:assertion:3', record_type: 'assertion', subject: 'mw:event:example', object: { entity: 'mw:person:example' } }
  ]
  const report = auditKnowledgeRecords(records)
  assert.equal(report.entityCounts.traditions, 1)
  assert.equal(report.entityCounts.persons, 1)
  assert.equal(report.entityCounts.events, 1)
  assert.equal(report.relationshipCounts.TRADITION_PERSON, 1)
  assert.equal(report.relationshipCounts.PERSON_WORK, 1)
  assert.equal(report.relationshipCounts.EVENT_PERSON, 1)
  assert.deepEqual(report.orphans.events, [])
})
