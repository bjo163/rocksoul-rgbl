import assert from 'node:assert/strict'
import test from 'node:test'
import { deduplicateDiversityCandidates, selectDiverseCandidates } from './p14-diversity-sampling.js'

const candidates = [
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `islam-${index + 1}`,
    tradition: 'Islam',
    genre: index < 6 ? 'scripture' : 'commentary',
    sourceLanguage: 'ar',
    community: 'general',
    dedupeKey: index === 7 ? 'islam-7-source' : `islam-${index + 1}-source`,
  })),
  { id: 'islam-7-duplicate', tradition: 'Islam', genre: 'commentary', sourceLanguage: 'ar', community: 'general', dedupeKey: 'islam-7-source' },
  { id: 'buddhist-pali', tradition: 'Buddhism', genre: 'scripture', sourceLanguage: 'pli', community: 'theravada', dedupeKey: 'buddhist-pali-source' },
  { id: 'hindu-sanskrit', tradition: 'Hinduism', genre: 'hymn', sourceLanguage: 'sa', community: 'vaishnava', dedupeKey: 'hindu-sanskrit-source' },
]

test('P14 diversity selection removes exact duplicates and prevents high-volume lanes from hiding coverage gaps', () => {
  const deduped = deduplicateDiversityCandidates(candidates)
  assert.equal(deduped.duplicates.length, 1)
  assert.equal(deduped.duplicates[0]?.duplicate, 'islam-7-duplicate')

  const first = selectDiverseCandidates(candidates, 3)
  const second = selectDiverseCandidates([...candidates].reverse(), 3)
  assert.deepEqual(first, second, 'selection must not depend on input ordering')
  assert.equal(new Set(first.selected.map((candidate) => candidate.tradition)).size, 3)
  assert.ok(first.selected.some((candidate) => candidate.sourceLanguage === 'pli'))
  assert.ok(first.selected.some((candidate) => candidate.sourceLanguage === 'sa'))
})

test('P14 diversity selection validates limits and dedupe identity', () => {
  assert.deepEqual(selectDiverseCandidates(candidates, 0).selected, [])
  assert.throws(() => selectDiverseCandidates(candidates, -1), /non-negative integer/u)
  assert.throws(() => deduplicateDiversityCandidates([{ id: 'bad', tradition: 'x', genre: 'x', sourceLanguage: 'x', dedupeKey: '' }]), /stable dedupeKey/u)
})
