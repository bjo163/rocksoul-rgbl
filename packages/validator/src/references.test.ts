import assert from 'node:assert/strict'
import test from 'node:test'

import { extractCanonicalReferences } from './references.js'

test('extracts assertion core references including canonical-looking scope values', () => {
  assert.deepEqual(
    extractCanonicalReferences({
      record_type: 'assertion',
      subject: 'mw:person:a',
      predicate: 'mw:predicate:mentions',
      object: { entity: 'mw:resource:b' },
      scope: {
        tradition: 'mw:tradition:example',
        period: 'late-antiquity'
      },
      evidence: ['mw:evidence:a', 'mw:evidence:b'],
      provenance: 'mw:provenance:a'
    }),
    [
      { field: 'subject', id: 'mw:person:a' },
      { field: 'predicate', id: 'mw:predicate:mentions' },
      { field: 'object.entity', id: 'mw:resource:b' },
      { field: 'scope.tradition', id: 'mw:tradition:example' },
      { field: 'evidence[0]', id: 'mw:evidence:a' },
      { field: 'evidence[1]', id: 'mw:evidence:b' },
      { field: 'provenance', id: 'mw:provenance:a' }
    ]
  )
})

test('extracts evidence, provenance, and assessment references but ignores extensions', () => {
  assert.deepEqual(
    extractCanonicalReferences({
      record_type: 'evidence',
      target: 'mw:resource:a',
      provenance: 'mw:provenance:a',
      extensions: { hidden: 'mw:person:not-universal' }
    }),
    [
      { field: 'target', id: 'mw:resource:a' },
      { field: 'provenance', id: 'mw:provenance:a' }
    ]
  )

  assert.deepEqual(
    extractCanonicalReferences({
      record_type: 'provenance',
      source: 'mw:resource:a'
    }),
    [{ field: 'source', id: 'mw:resource:a' }]
  )

  assert.deepEqual(
    extractCanonicalReferences({
      record_type: 'assessment',
      target: 'mw:assertion:a',
      assessor: 'mw:agent:a',
      evidence: ['mw:evidence:a']
    }),
    [
      { field: 'target', id: 'mw:assertion:a' },
      { field: 'assessor', id: 'mw:agent:a' },
      { field: 'evidence[0]', id: 'mw:evidence:a' }
    ]
  )
})
