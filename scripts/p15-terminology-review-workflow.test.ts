import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

test('P15 terminology review workflow covers naming, deprecation, sensitivity, and disputed translation without automatic merges', async () => {
  const workflow = JSON.parse(await readFile(path.join(process.cwd(), 'docs/P15-TERMINOLOGY-REVIEW-WORKFLOW.json'), 'utf8')) as {
    concerns: string[]
    states: string[]
    requiredDecisionFields: string[]
    transitions: Array<{ from: string; to: string; requires: string[] }>
    concernPolicies: Record<string, Record<string, unknown>>
    guardrails: Record<string, boolean>
  }
  assert.deepEqual(workflow.concerns, [
    'community_preferred_naming',
    'deprecated_label',
    'sensitive_language',
    'disputed_translation',
  ])
  for (const required of ['termOrConcept', 'concern', 'state', 'scope', 'reviewer', 'provenance', 'evidence', 'rationale']) {
    assert.ok(workflow.requiredDecisionFields.includes(required), `missing required decision field ${required}`)
  }
  assert.ok(workflow.transitions.some((transition) => transition.to === 'community_review'))
  assert.ok(workflow.transitions.some((transition) => transition.to === 'deprecated_scoped'))
  assert.ok(workflow.transitions.some((transition) => transition.to === 'sensitive_hold'))
  assert.ok(workflow.transitions.some((transition) => transition.to === 'disputed'))
  assert.equal(workflow.concernPolicies.community_preferred_naming?.globalPreferredNameAllowed, false)
  assert.equal(workflow.concernPolicies.deprecated_label?.deleteOnDeprecation, false)
  assert.equal(workflow.concernPolicies.sensitive_language?.publicationMayBeMetadataOnly, true)
  assert.equal(workflow.concernPolicies.disputed_translation?.automaticWinnerAllowed, false)
  assert.equal(workflow.guardrails.noAutomaticConceptMerge, true)
  assert.equal(workflow.guardrails.noNameOnlyIdentity, true)
  assert.equal(workflow.guardrails.noTranslationOnlyEquivalence, true)
  assert.equal(workflow.guardrails.noUnsourcedDefinition, true)
  assert.equal(workflow.guardrails.reviewHistoryRetained, true)
})
