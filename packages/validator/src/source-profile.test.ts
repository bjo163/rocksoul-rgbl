import assert from 'node:assert/strict'
import test from 'node:test'

import { validateProvenanceRecordInvariants, validateSourceRecordInvariants } from './source-profile.js'

const artifact = {
  id: 'mw:artifact:fixture:source',
  record_type: 'resource',
  kind: 'textual.artifact',
  extensions: { textual: { represents: 'mw:edition:fixture:one' } }
}
const provenance = {
  id: 'mw:provenance:fixture:one',
  record_type: 'provenance',
  source: artifact.id,
  activities: [{ type: 'parsing' }]
}
const agent = { id: 'mw:person:fixture-curator', record_type: 'entity', kind: 'person' }
const recordById = new Map<string, Record<string, unknown>>([
  [artifact.id, artifact],
  [provenance.id, provenance],
  [agent.id, agent]
])

test('bundled artifacts require pinned integrity and redistribution-safe rights', () => {
  const record = {
    ...artifact,
    extensions: {
      ...artifact.extensions,
      source: { descriptor: { availability: 'bundled' } }
    }
  }
  const codes = validateSourceRecordInvariants(record, recordById).map((finding) => finding.code)
  assert.equal(codes.includes('bundled-artifact-missing-sha256'), true)
  assert.equal(codes.includes('bundled-artifact-missing-byte-size'), true)
  assert.equal(codes.includes('bundled-artifact-missing-rights'), true)
})

test('LicenseRef identifiers used by expressions must be defined', () => {
  const record = {
    ...artifact,
    extensions: {
      ...artifact.extensions,
      source: {
        descriptor: {
          availability: 'bundled',
          byte_size: 23,
          sha256: '5338866a400c1231e62e2fd5e5a800cdc0ba71ec0d135f87a1907eccd1be99ff'
        },
        rights: {
          status: 'licensed',
          redistribution: 'permitted',
          license_expression: 'LicenseRef-Fixture'
        }
      }
    }
  }
  const codes = validateSourceRecordInvariants(record, recordById).map((finding) => finding.code)
  assert.equal(codes.includes('undefined-license-ref'), true)
})

test('source-profile textual content must name exact artifact and provenance', () => {
  const content = {
    id: 'mw:content:fixture:source',
    record_type: 'resource',
    kind: 'textual.content',
    extensions: { textual: { target: 'mw:passage:fixture:one', language: 'en', representation: 'source', text: 'fixture' }, source: { title: 'Fixture' } }
  }
  const codes = validateSourceRecordInvariants(content, recordById).map((finding) => finding.code)
  assert.equal(codes.includes('content-missing-source-artifact'), true)
  assert.equal(codes.includes('content-missing-provenance'), true)
})

test('provenance activities require typed agent references and ordered timestamps', () => {
  const record = {
    id: 'mw:provenance:fixture:bad-time',
    record_type: 'provenance',
    source: artifact.id,
    activities: [
      {
        type: 'curation',
        agent: artifact.id,
        started_at: '2026-08-27T02:00:00Z',
        ended_at: '2026-08-27T01:00:00Z'
      }
    ]
  }
  const codes = validateProvenanceRecordInvariants(record, recordById).map((finding) => finding.code)
  assert.equal(codes.includes('source-reference-record-type'), true)
  assert.equal(codes.includes('provenance-activity-time-order'), true)
})
