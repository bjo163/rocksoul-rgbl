import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import path from 'node:path'

test('P14 diversity and P16/P17 contract baselines preserve production guardrails', async () => {
  const root = process.cwd()
  const p14 = JSON.parse(await readFile(path.join(root, 'docs/P14-COVERAGE-REPORT.json'), 'utf8')) as { dimensions: string[]; bundledLanes: unknown[]; gates: Record<string, string>; unresolved: string[] }
  const p16 = JSON.parse(await readFile(path.join(root, 'docs/P16-CONTRACT-BASELINE.json'), 'utf8')) as { genres: string[]; accessStates: string[]; guardrails: Record<string, boolean> }
  const p17 = JSON.parse(await readFile(path.join(root, 'docs/P17-CONTRACT-BASELINE.json'), 'utf8')) as { edgeTypes: string[]; statuses: string[]; requiredFields: string[]; guardrails: Record<string, boolean> }
  assert.equal(p14.dimensions.length, 8)
  assert.ok(p14.bundledLanes.length >= 6)
  assert.equal(p14.gates.noExhaustivenessClaim, 'pass')
  assert.equal(p14.gates.noUnconsentedRestrictedContent, 'pass')
  assert.ok(p14.unresolved.length >= 4)
  assert.ok(p16.genres.includes('prayer') && p16.genres.includes('practice_description'))
  assert.ok(p16.accessStates.includes('metadata_only'))
  assert.equal(p16.guardrails.noRestrictedTextWithoutPermission, true)
  assert.ok(p17.edgeTypes.includes('quotation') && p17.edgeTypes.includes('parallel_passage'))
  assert.ok(p17.statuses.includes('negative') && p17.statuses.includes('retracted'))
  assert.ok(p17.requiredFields.includes('reviewState'))
  assert.equal(p17.guardrails.similarityIsCandidateOnly, true)
})
