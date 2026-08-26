import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertExternalIdentifier,
  assertSourceLocalIdentifier,
  isExternalIdentifier,
  isSourceLocalIdentifier,
  normalizeExternalIdentifierScheme,
  sameExternalIdentifier,
  sameSourceLocalIdentifier
} from './identity-boundaries.js'

test('external identifiers preserve authority values and remain distinct from canonical IDs', () => {
  const identifier = {
    scheme: 'wikidata',
    value: 'Q12345',
    uri: 'https://www.wikidata.org/entity/Q12345'
  }

  assert.doesNotThrow(() => assertExternalIdentifier(identifier))
  assert.equal(isExternalIdentifier(identifier), true)
  assert.equal(identifier.value, 'Q12345')
  assert.equal(isExternalIdentifier('mw:person:musa'), false)
})

test('external identifier scheme normalization is pre-authoring only', () => {
  assert.equal(normalizeExternalIdentifierScheme(' VIAF '), 'viaf')
  assert.equal(normalizeExternalIdentifierScheme('source.registry-v2'), 'source.registry-v2')
  assert.throws(() => normalizeExternalIdentifierScheme('bad scheme'), TypeError)
  assert.throws(() => normalizeExternalIdentifierScheme('123'), TypeError)
})

test('external identifier equality ignores resolver URI but not scheme/value identity', () => {
  assert.equal(
    sameExternalIdentifier(
      { scheme: 'doi', value: '10.1000/example', uri: 'https://doi.org/10.1000/example' },
      { scheme: 'doi', value: '10.1000/example' }
    ),
    true
  )
  assert.equal(
    sameExternalIdentifier(
      { scheme: 'doi', value: '10.1000/example' },
      { scheme: 'other', value: '10.1000/example' }
    ),
    false
  )
  assert.equal(
    sameExternalIdentifier(
      { scheme: 'wikidata', value: 'Q1' },
      { scheme: 'wikidata', value: 'q1' }
    ),
    false
  )
})

test('source-local identifiers require explicit source context', () => {
  const identifier = {
    source: 'mw:resource:source-example',
    namespace: 'people',
    value: '123'
  } as const

  assert.doesNotThrow(() => assertSourceLocalIdentifier(identifier))
  assert.equal(isSourceLocalIdentifier(identifier), true)
  assert.equal(isSourceLocalIdentifier({ namespace: 'people', value: '123' }), false)
})

test('source-local equality includes source and optional namespace', () => {
  assert.equal(
    sameSourceLocalIdentifier(
      { source: 'mw:resource:a', namespace: 'people', value: '123' },
      { source: 'mw:resource:a', namespace: 'people', value: '123' }
    ),
    true
  )
  assert.equal(
    sameSourceLocalIdentifier(
      { source: 'mw:resource:a', namespace: 'people', value: '123' },
      { source: 'mw:resource:b', namespace: 'people', value: '123' }
    ),
    false
  )
  assert.equal(
    sameSourceLocalIdentifier(
      { source: 'mw:resource:a', namespace: 'people', value: '123' },
      { source: 'mw:resource:a', namespace: 'works', value: '123' }
    ),
    false
  )
})

test('identifier values reject empty strings and controls without normalizing authority data', () => {
  assert.equal(isExternalIdentifier({ scheme: 'viaf', value: '' }), false)
  assert.equal(isExternalIdentifier({ scheme: 'viaf', value: 'A\u0000B' }), false)
  assert.equal(isExternalIdentifier({ scheme: 'viaf', value: ' A-001 ' }), true)
  assert.equal(isSourceLocalIdentifier({ source: 'mw:resource:a', value: '' }), false)
})
