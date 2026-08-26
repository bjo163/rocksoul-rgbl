import assert from 'node:assert/strict'
import test from 'node:test'
import { validateSemanticInvariants } from './semantic-invariants.js'

test('allows preferred labels in different language/script scopes', async () => {
  const findings = await validateSemanticInvariants({ id: 'mw:person:example', record_type: 'entity', kind: 'person', labels: [
    { value: 'Musa', role: 'preferred', language: 'id', script: 'Latn' },
    { value: 'موسى', role: 'preferred', language: 'ar', script: 'Arab' }
  ] })
  assert.equal(findings.length, 0)
})

test('rejects two preferred labels in the same language/script scope', async () => {
  const findings = await validateSemanticInvariants({ id: 'mw:person:example', record_type: 'entity', kind: 'person', labels: [
    { value: 'Musa', role: 'preferred', language: 'en', script: 'Latn' },
    { value: 'Moses', role: 'preferred', language: 'en', script: 'Latn' }
  ] })
  assert.equal(findings.some((finding) => finding.code === 'duplicate-preferred-label-scope'), true)
})

test('rejects whitespace-only label values at semantic validation layer', async () => {
  const findings = await validateSemanticInvariants({ id: 'mw:resource:example', record_type: 'resource', kind: 'text', labels: [
    { value: '   ', role: 'alternate', language: 'en', script: 'Latn' }
  ] })
  assert.equal(findings.some((finding) => finding.code === 'blank-label-value'), true)
})
