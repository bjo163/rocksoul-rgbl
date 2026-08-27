import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

test('P13 discovery lanes cover requested expansion scopes with source-specific review', async () => {
  const registry = JSON.parse(await readFile(path.join(process.cwd(), 'docs/P13-DISCOVERY-LANES.json'), 'utf8')) as {
    sources: Record<string, { license: string; policy: string }>
    lanes: Array<{ id: string; candidates: Array<{ source: string; qid: string; sourceState: string; reviewState: string; canonicalId?: string }> }>
    guardrails: Record<string, boolean>
  }
  const required = [
    'bahai', 'zoroastrian', 'daoist', 'confucian', 'shinto', 'indigenous-traditional', 'ancient-historical', 'modern-new-religious-movements',
  ]
  assert.deepEqual(registry.lanes.map((lane) => lane.id), required)
  assert.equal(registry.sources.wikidata?.license, 'CC0-1.0')
  for (const lane of registry.lanes) {
    assert.ok(lane.candidates.length > 0, `${lane.id} must expose at least one discovery candidate`)
    for (const candidate of lane.candidates) {
      assert.ok(registry.sources[candidate.source], `${lane.id}/${candidate.qid} must reference a declared source`)
      assert.match(candidate.qid, /^Q\d+$/u)
      assert.ok(candidate.sourceState && candidate.reviewState)
    }
  }
  const shinto = registry.lanes.find((lane) => lane.id === 'shinto')!
  assert.equal(shinto.candidates[0]?.qid, 'Q384647')
  assert.equal(shinto.candidates[0]?.sourceState, 'external_discovery_only')
  assert.equal(shinto.candidates[0]?.canonicalId, undefined, 'external discovery must not mint a canonical person before review')
  assert.equal(registry.guardrails.discoveryIsNotIdentity, true)
  assert.equal(registry.guardrails.nameSimilarityNeverMerges, true)
  assert.equal(registry.guardrails.historicityRequiresSourcedAssessment, true)
  assert.equal(registry.guardrails.externalDiscoveryRequiresReviewBeforeBundling, true)
})
