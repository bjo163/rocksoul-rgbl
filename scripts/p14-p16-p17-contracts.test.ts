import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import path from 'node:path'

test('P14 diversity and P16/P17 contract baselines preserve production guardrails', async () => {
  const root = process.cwd()
  const p14 = JSON.parse(await readFile(path.join(root, 'docs/P14-COVERAGE-REPORT.json'), 'utf8')) as { dimensions: string[]; bundledLanes: unknown[]; gates: Record<string, string>; unresolved: string[] }
  const p16 = JSON.parse(await readFile(path.join(root, 'docs/P16-CONTRACT-BASELINE.json'), 'utf8')) as {
    genres: string[]
    accessStates: string[]
    requiredMetadata: string[]
    recordContracts: Record<string, { allowedLayers?: string[]; required: string[]; cannotImplyNormativity?: boolean; cannotSubstituteForText?: boolean }>
    completeWorkContract: { required: string[]; completenessValue: string }
    boundedExcerptContract: { required: string[]; completenessValues: string[]; parentWorkRequired: boolean }
    sensitivityPolicy: Record<string, string | boolean>
    guardrails: Record<string, boolean>
  }
  const p17 = JSON.parse(await readFile(path.join(root, 'docs/P17-CONTRACT-BASELINE.json'), 'utf8')) as {
    edgeTypes: string[]
    statuses: string[]
    requiredFields: string[]
    assessmentKinds: string[]
    edgeContract: Record<string, string[] | boolean>
    edgeTypeContracts: Record<string, Record<string, string | boolean>>
    assessmentContract: Record<string, Record<string, string | boolean>>
    lifecyclePolicy: Record<string, boolean>
    guardrails: Record<string, boolean>
  }

  assert.equal(p14.dimensions.length, 8)
  assert.ok(p14.bundledLanes.length >= 6)
  assert.equal(p14.gates.noExhaustivenessClaim, 'pass')
  assert.equal(p14.gates.noUnconsentedRestrictedContent, 'pass')
  assert.ok(p14.unresolved.length >= 4)

  assert.ok(p16.genres.includes('prayer') && p16.genres.includes('practice_description'))
  assert.ok(p16.accessStates.includes('metadata_only') && p16.accessStates.includes('restricted'))
  assert.ok(p16.requiredMetadata.includes('rights') && p16.requiredMetadata.includes('provenance') && p16.requiredMetadata.includes('sensitivity'))
  assert.deepEqual(p16.recordContracts.devotional_text.allowedLayers, ['normative_source_text'])
  assert.equal(p16.recordContracts.practice_description.cannotImplyNormativity, true)
  assert.equal(p16.recordContracts.performance_evidence.cannotSubstituteForText, true)
  assert.equal(p16.completeWorkContract.completenessValue, 'complete')
  assert.equal(p16.boundedExcerptContract.parentWorkRequired, true)
  assert.ok(p16.boundedExcerptContract.required.includes('selector'))
  assert.equal(p16.sensitivityPolicy.restrictedTextRequiresExplicitPermission, true)
  assert.equal(p16.sensitivityPolicy.defaultForUnreviewed, 'metadata_only')
  assert.equal(p16.guardrails.noRestrictedTextWithoutPermission, true)
  assert.equal(p16.guardrails.noUnsourcedRitualInstructions, true)

  assert.ok(p17.edgeTypes.includes('quotation') && p17.edgeTypes.includes('parallel_passage'))
  assert.ok(p17.requiredFields.includes('selector') && p17.requiredFields.includes('reviewState'))
  assert.ok(p17.statuses.includes('negative') && p17.statuses.includes('absent') && p17.statuses.includes('retracted'))
  assert.deepEqual(p17.assessmentKinds, ['source_assertion', 'curator_assessment', 'automated_candidate_score'])
  assert.equal(p17.edgeContract.selectorRequiredForPassageOrFragmentTargets, true)
  assert.equal(p17.edgeContract.automatedScoresCannotSetAssertedStatus, true)
  assert.equal(p17.edgeTypeContracts.allusion_candidate.cannotBePromotedBySimilarityAlone, true)
  assert.equal(p17.edgeTypeContracts.parallel_passage.requiresBoundaryAndGapMetadata, true)
  assert.equal(p17.assessmentContract.automated_candidate_score.canonicalConclusionAllowed, false)
  assert.equal(p17.lifecyclePolicy.negativeAndAbsentFindingsRetained, true)
  assert.equal(p17.guardrails.similarityIsCandidateOnly, true)
  assert.equal(p17.guardrails.dependenceRequiresSource, true)
  assert.equal(p17.guardrails.noUntraceableCanonicalClaim, true)
})
