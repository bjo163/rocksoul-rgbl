import assert from 'node:assert/strict'
import test from 'node:test'

import { extractCanonicalReferences } from './references.js'

test('extracts all explicit universal assertion scope references', () => {
  assert.deepEqual(extractCanonicalReferences({
    record_type: 'assertion',
    subject: 'mw:person:a',
    predicate: 'mw:predicate:mentions',
    object: { entity: 'mw:resource:b' },
    scope: {
      tradition: 'mw:tradition:example',
      community: 'mw:community:example',
      agent: 'mw:agent:example',
      period: 'mw:period:example',
      place: 'mw:place:example'
    },
    evidence: ['mw:evidence:a'],
    provenance: 'mw:provenance:a'
  }), [
    { field: 'subject', id: 'mw:person:a' },
    { field: 'predicate', id: 'mw:predicate:mentions' },
    { field: 'object.entity', id: 'mw:resource:b' },
    { field: 'scope.tradition', id: 'mw:tradition:example' },
    { field: 'scope.community', id: 'mw:community:example' },
    { field: 'scope.agent', id: 'mw:agent:example' },
    { field: 'scope.period', id: 'mw:period:example' },
    { field: 'scope.place', id: 'mw:place:example' },
    { field: 'evidence[0]', id: 'mw:evidence:a' },
    { field: 'provenance', id: 'mw:provenance:a' }
  ])
})

test('extracts lifecycle replacements as universal canonical references', () => {
  assert.deepEqual(extractCanonicalReferences({
    record_type: 'entity',
    lifecycle: { status: 'superseded', replacements: ['mw:person:b'] }
  }), [{ field: 'lifecycle.replacements[0]', id: 'mw:person:b' }])
})
