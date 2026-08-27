import assert from 'node:assert/strict'
import test from 'node:test'
import {
  P14_CITATION_ADAPTERS,
  buildP14CitationReference,
  citationSchemePayloadForP14Adapter,
  createP13MentionReviewCandidate,
  isCanonicalizedMentionCandidate,
} from './index.js'

test('P14 citation adapters preserve non-Bible citation hierarchies deterministically', () => {
  assert.deepEqual(Object.keys(P14_CITATION_ADAPTERS).sort(), [
    'chapter_verse',
    'folio_line',
    'fragment_selector',
    'hadith_report',
    'hymn_ang_raga',
    'tractate_mishnah',
  ])

  assert.deepEqual(
    buildP14CitationReference('hadith_report', 'mw:citation:hadith:test', {
      collection: 'bukhari', book: 1, chapter: 2, report: 3,
    }),
    { scheme: 'mw:citation:hadith:test', reference: 'bukhari:1:2:3', path: ['bukhari', '1', '2', '3'] },
  )
  assert.deepEqual(
    buildP14CitationReference('tractate_mishnah', 'mw:citation:mishnah:test', {
      tractate: 'berakhot', chapter: 1, mishnah: 1,
    }).path,
    ['berakhot', '1', '1'],
  )
  assert.deepEqual(
    buildP14CitationReference('hymn_ang_raga', 'mw:citation:sikh:test', {
      raga: 'asa', ang: 12, hymn: 3,
    }).path,
    ['asa', '12', '3'],
  )
  assert.deepEqual(
    citationSchemePayloadForP14Adapter('folio_line', ['mw:expression:test:folio']).components.map((component) => component.key),
    ['folio', 'line'],
  )
  assert.throws(() => buildP14CitationReference('chapter_verse', 'mw:citation:test:cv', { chapter: 1 }), /Missing required/u)
  assert.throws(() => buildP14CitationReference('chapter_verse', 'mw:citation:test:cv', { chapter: 1, verse: 2, stanza: 3 }), /Unexpected/u)
})

test('P14 passage extraction can only produce P13 review candidates, never automatic identity or role claims', () => {
  const candidate = createP13MentionReviewCandidate({
    id: 'mw:evidence:p14:test-mention',
    passage: 'mw:passage:quran:test',
    sourceDataset: 'mw:dataset:quran:test',
    sourceVersion: '0.1.0',
    selector: { type: 'TextQuoteSelector', exact: 'Moses' },
    mentionText: 'Moses',
    method: 'exact reviewed dictionary candidate extraction',
    provenance: 'mw:provenance:p14:test',
    candidateEntity: 'mw:person:moses',
  })
  assert.equal(candidate.record_type, 'evidence')
  assert.equal(candidate.relation, 'mention_candidate')
  assert.equal(isCanonicalizedMentionCandidate(candidate), false)
  const extension = candidate.extensions?.p14_p13 as {
    status: string
    reviewState: string
    prohibitedAutomaticClaims: string[]
  }
  assert.equal(extension.status, 'candidate')
  assert.equal(extension.reviewState, 'unreviewed')
  assert.deepEqual(extension.prohibitedAutomaticClaims, ['identity', 'role', 'tradition_membership'])
  assert.throws(() => createP13MentionReviewCandidate({
    id: 'mw:evidence:p14:bad-version', passage: 'mw:passage:quran:test', sourceDataset: 'mw:dataset:quran:test',
    sourceVersion: 'latest', selector: { type: 'TextQuoteSelector', exact: 'Moses' }, mentionText: 'Moses', method: 'test', provenance: 'mw:provenance:p14:test',
  }), /exact semver/u)
})
