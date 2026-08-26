import assert from 'node:assert/strict'
import test from 'node:test'

import { validateSemanticInvariants } from './semantic-invariants.js'

test('rejects a lifecycle replacement that points to the record itself', async () => {
  const findings = await validateSemanticInvariants({
    id: 'mw:person:a',
    record_type: 'entity',
    kind: 'person',
    lifecycle: {
      status: 'superseded',
      replacements: ['mw:person:a']
    }
  })

  assert.equal(findings.some((finding) => finding.code === 'lifecycle-self-replacement'), true)
})
