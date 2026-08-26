import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

import {
  CANONICAL_ID_MAX_LENGTH,
  assertCanonicalId,
  formatCanonicalId,
  isCanonicalId,
  normalizeCanonicalIdKind,
  normalizeCanonicalIdSegment,
  parseCanonicalId
} from './identifiers.js'

const root = process.cwd()
const validIds = JSON.parse(
  await readFile(path.join(root, 'fixtures/identifiers/valid.json'), 'utf8')
) as string[]
const invalidIds = JSON.parse(
  await readFile(path.join(root, 'fixtures/identifiers/invalid.json'), 'utf8')
) as Array<{ value: string; reason: string }>

test('valid canonical ID fixtures parse and round trip', () => {
  for (const id of validIds) {
    assert.equal(isCanonicalId(id), true, id)
    assert.doesNotThrow(() => assertCanonicalId(id), id)

    const parsed = parseCanonicalId(id)
    assert.equal(parsed.prefix, 'mw')
    assert.equal(formatCanonicalId(parsed.kind, ...parsed.segments), id)
  }
})

test('invalid canonical ID fixtures are rejected', () => {
  for (const fixture of invalidIds) {
    assert.equal(isCanonicalId(fixture.value), false, fixture.reason)
    assert.throws(() => assertCanonicalId(fixture.value), TypeError, fixture.reason)
  }
})

test('formatter enforces kind and segment grammar', () => {
  assert.equal(formatCanonicalId('person', 'musa'), 'mw:person:musa')
  assert.equal(formatCanonicalId('assertion', 'example', '001'), 'mw:assertion:example:001')
  assert.throws(() => formatCanonicalId('123', 'musa'), TypeError)
  assert.throws(() => formatCanonicalId('person'), TypeError)
  assert.throws(() => formatCanonicalId('person', 'musa--aaron'), TypeError)
  assert.throws(() => formatCanonicalId('person', 'Musa'), TypeError)
})

test('formatter enforces the canonical ID maximum length', () => {
  const tooLongSegment = 'a'.repeat(CANONICAL_ID_MAX_LENGTH)
  assert.throws(() => formatCanonicalId('person', tooLongSegment), TypeError)
})

test('normalization is conservative and only prepares minting candidates', () => {
  assert.equal(normalizeCanonicalIdKind(' Person '), 'person')
  assert.equal(normalizeCanonicalIdSegment(' Example Person '), 'example-person')
  assert.equal(normalizeCanonicalIdSegment('Alpha_Beta.Gamma-1'), 'alpha_beta.gamma-1')
  assert.throws(() => normalizeCanonicalIdSegment('Mūsā'), TypeError)
  assert.throws(() => normalizeCanonicalIdSegment('musa--aaron'), TypeError)
})
