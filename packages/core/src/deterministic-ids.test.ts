import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertionIdentityPayload,
  canonicalizeDeterministicJson,
  deterministicAssertionId,
  deterministicEvidenceId,
  evidenceIdentityPayload,
  isDeterministicId,
  parseDeterministicId,
  verifyDeterministicId
} from './deterministic-ids.js'

const ASSERTION_ID =
  'mw:assertion:v1:sha256:5b8d516a62168363cbd70ec3fce5db1cb37ecd8d07e50e102a2c00eb24337034'
const EVIDENCE_ID =
  'mw:evidence:v1:sha256:72538a91352d690ff28786aff990359ae2846947367abd3a631e81b3e6a46752'

const assertionInput = {
  subject: 'mw:person:musa',
  predicate: 'mw:predicate:has-role',
  object: { entity: 'mw:concept:prophet' },
  assertion_class: 'explicit_source',
  scope: { tradition: 'mw:tradition:islam' }
} as const

const evidenceInput = {
  target: 'mw:resource:example',
  relation: 'supports',
  selector: { type: 'text_quote', exact: 'example' }
} as const

test('canonical JSON is independent of object insertion order and preserves array order', () => {
  assert.equal(
    canonicalizeDeterministicJson({ b: 2, a: { z: 1, y: 2 }, list: ['b', 'a'] }),
    '{"a":{"y":2,"z":1},"b":2,"list":["b","a"]}'
  )

  assert.notEqual(
    canonicalizeDeterministicJson({ list: ['a', 'b'] }),
    canonicalizeDeterministicJson({ list: ['b', 'a'] })
  )
})

test('canonical JSON rejects values that JSON.stringify would silently change', () => {
  assert.throws(() => canonicalizeDeterministicJson(undefined), TypeError)
  assert.throws(() => canonicalizeDeterministicJson(Number.NaN), TypeError)
  assert.throws(() => canonicalizeDeterministicJson(Number.POSITIVE_INFINITY), TypeError)
  assert.throws(() => canonicalizeDeterministicJson(1n), TypeError)
  assert.throws(() => canonicalizeDeterministicJson(new Date()), TypeError)

  const cyclic: Record<string, unknown> = {}
  cyclic.self = cyclic
  assert.throws(() => canonicalizeDeterministicJson(cyclic), TypeError)
})

test('assertion recipe v1 matches the published golden vector', async () => {
  const payload = assertionIdentityPayload(assertionInput)
  assert.equal(
    canonicalizeDeterministicJson(payload),
    '{"assertion_class":"explicit_source","object":{"entity":"mw:concept:prophet"},"predicate":"mw:predicate:has-role","record_type":"assertion","scope":{"tradition":"mw:tradition:islam"},"subject":"mw:person:musa"}'
  )
  assert.equal(await deterministicAssertionId(assertionInput), ASSERTION_ID)
})

test('assertion evidence, provenance, extensions, and existing id do not change semantic identity', async () => {
  const first = await deterministicAssertionId({
    ...assertionInput,
    id: 'mw:assertion:temporary:a',
    evidence: ['mw:evidence:example:a'],
    provenance: 'mw:provenance:example:a',
    extensions: { review: 'first' }
  })
  const second = await deterministicAssertionId({
    ...assertionInput,
    id: 'mw:assertion:temporary:b',
    evidence: ['mw:evidence:example:b'],
    provenance: 'mw:provenance:example:b',
    extensions: { review: 'second' }
  })

  assert.equal(first, second)
  assert.equal(first, ASSERTION_ID)
})

test('assertion semantic changes remint the deterministic ID', async () => {
  const changedObject = await deterministicAssertionId({
    ...assertionInput,
    object: { entity: 'mw:concept:king' }
  })
  const changedScope = await deterministicAssertionId({
    ...assertionInput,
    scope: { tradition: 'mw:tradition:example' }
  })

  assert.notEqual(changedObject, ASSERTION_ID)
  assert.notEqual(changedScope, ASSERTION_ID)
})

test('evidence recipe v1 matches the published golden vector', async () => {
  const payload = evidenceIdentityPayload(evidenceInput)
  assert.equal(
    canonicalizeDeterministicJson(payload),
    '{"record_type":"evidence","relation":"supports","selector":{"exact":"example","type":"text_quote"},"target":"mw:resource:example"}'
  )
  assert.equal(await deterministicEvidenceId(evidenceInput), EVIDENCE_ID)
})

test('evidence provenance and extensions do not change pointer identity', async () => {
  const first = await deterministicEvidenceId({
    ...evidenceInput,
    provenance: 'mw:provenance:example:a',
    extensions: { parser: 'a' }
  })
  const second = await deterministicEvidenceId({
    ...evidenceInput,
    provenance: 'mw:provenance:example:b',
    extensions: { parser: 'b' }
  })

  assert.equal(first, second)
  assert.equal(first, EVIDENCE_ID)
})

test('deterministic IDs parse, validate, and verify their canonical payload', async () => {
  assert.equal(isDeterministicId(ASSERTION_ID), true)
  assert.equal(isDeterministicId('mw:assertion:v1:sha256:abc'), false)

  assert.deepEqual(parseDeterministicId(ASSERTION_ID), {
    kind: 'assertion',
    recipeVersion: 'v1',
    algorithm: 'sha256',
    digest: '5b8d516a62168363cbd70ec3fce5db1cb37ecd8d07e50e102a2c00eb24337034'
  })

  assert.equal(await verifyDeterministicId(ASSERTION_ID, assertionIdentityPayload(assertionInput)), true)
  assert.equal(
    await verifyDeterministicId(
      `mw:assertion:v1:sha256:${'0'.repeat(64)}`,
      assertionIdentityPayload(assertionInput)
    ),
    false
  )
})
