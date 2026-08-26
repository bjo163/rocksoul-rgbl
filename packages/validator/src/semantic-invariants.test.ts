import assert from 'node:assert/strict'
import test from 'node:test'

import { deterministicAssertionId, deterministicEvidenceId } from '@moonwitness/corpus-core'
import { validateSemanticInvariants } from './semantic-invariants.js'

const assertion = {
  record_type: 'assertion',
  id: 'mw:assertion:example:001',
  subject: 'mw:person:musa',
  predicate: 'mw:predicate:has-role',
  object: { entity: 'mw:concept:prophet' },
  assertion_class: 'explicit_source',
  scope: { tradition: 'mw:tradition:islam' }
} as const

const evidence = {
  record_type: 'evidence',
  id: 'mw:evidence:example:001',
  target: 'mw:resource:example',
  relation: 'supports',
  selector: { type: 'text_quote', exact: 'example' }
} as const

test('valid curated core records satisfy semantic invariants', async () => {
  assert.deepEqual(await validateSemanticInvariants(assertion), [])
  assert.deepEqual(await validateSemanticInvariants(evidence), [])
  assert.deepEqual(
    await validateSemanticInvariants({
      record_type: 'entity',
      id: 'mw:person:musa',
      kind: 'person'
    }),
    []
  )
})

test('fixed record families cannot masquerade behind another canonical ID kind', async () => {
  const findings = await validateSemanticInvariants({
    ...assertion,
    id: 'mw:evidence:example:wrong-family'
  })
  assert.equal(findings.some((finding) => finding.code === 'record-family-id-kind'), true)
})

test('semantic classification strings cannot be blank', async () => {
  const cases = [
    { record_type: 'entity', id: 'mw:person:a', kind: '   ' },
    { ...assertion, assertion_class: '\t' },
    { ...evidence, relation: '' },
    { record_type: 'assessment', id: 'mw:assessment:a', target: 'mw:assertion:a', result: '  ' }
  ]

  for (const record of cases) {
    const findings = await validateSemanticInvariants(record)
    assert.equal(findings.length > 0, true, JSON.stringify(record))
  }
})

test('a deterministic assertion ID must verify against the semantic payload', async () => {
  const id = await deterministicAssertionId(assertion)
  assert.deepEqual(await validateSemanticInvariants({ ...assertion, id }), [])

  const findings = await validateSemanticInvariants({
    ...assertion,
    id,
    object: { entity: 'mw:concept:king' }
  })
  assert.equal(findings.some((finding) => finding.code === 'deterministic-id-mismatch'), true)
})

test('a deterministic evidence ID must verify against target/relation/selector identity', async () => {
  const id = await deterministicEvidenceId(evidence)
  assert.deepEqual(await validateSemanticInvariants({ ...evidence, id }), [])

  const findings = await validateSemanticInvariants({ ...evidence, id, relation: 'contradicts' })
  assert.equal(findings.some((finding) => finding.code === 'deterministic-id-mismatch'), true)
})

test('malformed v1 sha256-looking IDs are rejected semantically', async () => {
  const findings = await validateSemanticInvariants({
    ...assertion,
    id: 'mw:assertion:v1:sha256:abc'
  })
  assert.equal(findings.some((finding) => finding.code === 'malformed-deterministic-id'), true)
})
