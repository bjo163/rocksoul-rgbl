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
    safetyReviewContract: { reviewStates: string[]; requiredChecks: string[]; defaultDisposition: string; bundleRequires: string[]; restrictedOrInitiatoryBundleRequiresCommunityReview: boolean; blockedMaterialCannotBeBundled: boolean; unsourcedInstructionalContentCannotBeCanonical: boolean }
    guardrails: Record<string, boolean>
  }
  const p17 = JSON.parse(await readFile(path.join(root, 'docs/P17-CONTRACT-BASELINE.json'), 'utf8')) as {
    edgeTypes: string[]
    edgeAliases: Record<string, string>
    statuses: string[]
    reviewStates: string[]
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
  assert.deepEqual(p16.safetyReviewContract.bundleRequires, ['rights_reviewed', 'safety_reviewed'])
  assert.ok(p16.safetyReviewContract.requiredChecks.includes('restricted_content') && p16.safetyReviewContract.requiredChecks.includes('instructional_risk'))
  assert.equal(p16.safetyReviewContract.restrictedOrInitiatoryBundleRequiresCommunityReview, true)
  assert.equal(p16.safetyReviewContract.blockedMaterialCannotBeBundled, true)
  assert.equal(p16.safetyReviewContract.unsourcedInstructionalContentCannotBeCanonical, true)
  assert.equal(p16.guardrails.noRestrictedTextWithoutPermission, true)
  assert.equal(p16.guardrails.noUnsourcedRitualInstructions, true)

  assert.ok(p17.edgeTypes.includes('quotation') && p17.edgeTypes.includes('parallel_passage'))
  assert.equal(p17.edgeAliases.textual_alignment, 'parallel_passage')
  assert.ok(p17.requiredFields.includes('edgeType') && p17.requiredFields.includes('selector') && p17.requiredFields.includes('reviewState'))
  assert.ok(p17.statuses.includes('negative') && p17.statuses.includes('absent') && p17.statuses.includes('retracted'))
  assert.deepEqual(p17.assessmentKinds, ['source_assertion', 'curator_assessment', 'automated_candidate_score'])
  assert.equal(p17.edgeContract.selectorRequiredForPassageOrFragmentTargets, true)
  assert.equal(p17.edgeContract.automatedScoresCannotSetAssertedStatus, true)
  assert.equal(p17.edgeContract.legacyAliasesMustResolveToCanonicalTypes, true)
  assert.equal(p17.edgeTypeContracts.allusion_candidate.cannotBePromotedBySimilarityAlone, true)
  assert.equal(p17.edgeTypeContracts.parallel_passage.requiresBoundaryAndGapMetadata, true)
  assert.equal(p17.assessmentContract.automated_candidate_score.canonicalConclusionAllowed, false)
  assert.equal(p17.lifecyclePolicy.negativeAndAbsentFindingsRetained, true)
  assert.equal(p17.guardrails.similarityIsCandidateOnly, true)
  assert.equal(p17.guardrails.dependenceRequiresSource, true)
  assert.equal(p17.guardrails.noUntraceableCanonicalClaim, true)

  const graphText = await readFile(path.join(root, 'datasets/research-graph-baseline/data/core/evidence/graph.jsonl'), 'utf8')
  const edges = graphText.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as {
    provenance?: string
    selector?: unknown
    extensions?: { graph?: { edgeType?: string; sourceDataset?: string; sourceVersion?: string; subject?: string; object?: string; method?: string; status?: string; reviewState?: string } }
  })
  assert.ok(edges.length > 0)
  for (const edge of edges) {
    const graph = edge.extensions?.graph
    assert.ok(graph, 'research graph evidence must expose extensions.graph')
    assert.ok(edge.selector, 'research graph evidence must expose an exact selector')
    assert.ok(edge.provenance, 'research graph evidence must expose provenance')
    assert.ok(graph.edgeType && graph.sourceDataset && graph.sourceVersion && graph.subject && graph.object && graph.method && graph.status && graph.reviewState)
    assert.match(graph.sourceVersion, /^\d+\.\d+\.\d+$/)
    assert.ok(p17.statuses.includes(graph.status))
    assert.ok(p17.reviewStates.includes(graph.reviewState))
    const canonicalType = p17.edgeAliases[graph.edgeType] ?? graph.edgeType
    assert.ok(p17.edgeTypes.includes(canonicalType), `unknown graph edge type: ${graph.edgeType}`)
    assert.ok(p17.edgeTypeContracts[canonicalType], `missing contract for graph edge type: ${canonicalType}`)
  }
})
