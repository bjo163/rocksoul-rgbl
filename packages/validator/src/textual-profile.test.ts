import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateTextSelector,
  validateTextualGraphInvariants,
  type TextualRecordSnapshot
} from './textual-profile.js'

function resource(id: string, kind: string, textual: Record<string, unknown>): Record<string, unknown> {
  return { id, record_type: 'resource', kind, extensions: { textual } }
}

function snapshot(record: Record<string, unknown>, line = 1): TextualRecordSnapshot {
  return { record, datasetId: 'mw:dataset:example:textual-test', file: 'fixture.jsonl', line }
}

function findings(records: Record<string, unknown>[]) {
  const snapshots = records.map((record, index) => snapshot(record, index + 1))
  const all = new Map<string, Record<string, unknown>>()
  for (const record of records) if (typeof record.id === 'string') all.set(record.id, record)
  return validateTextualGraphInvariants(snapshots, all)
}

const work = resource('mw:work:test', 'textual.work', {})
const expression = resource('mw:expression:test:en', 'textual.expression', {
  work: 'mw:work:test', language: 'en', script: 'Latn'
})
const scheme = resource('mw:citation-scheme:test', 'textual.citation_scheme', {
  applies_to: ['mw:expression:test:en'],
  components: [{ key: 'chapter', unit: 'chapter' }, { key: 'verse', unit: 'verse' }],
  delimiter: ':'
})
const chapter = resource('mw:passage:test:chapter-1', 'textual.passage', {
  container: 'mw:expression:test:en', unit: 'chapter', sequence: 1,
  citations: [{ scheme: 'mw:citation-scheme:test', reference: '1', path: ['1'] }]
})
const verse = resource('mw:passage:test:verse-1-1', 'textual.passage', {
  container: 'mw:expression:test:en', parent: 'mw:passage:test:chapter-1', unit: 'verse', sequence: 1,
  citations: [{ scheme: 'mw:citation-scheme:test', reference: '1:1', path: ['1', '1'] }]
})
const source = resource('mw:content:test:1-1:source', 'textual.content', {
  target: 'mw:passage:test:verse-1-1', language: 'en', representation: 'source', text: 'Example.'
})
const normalized = resource('mw:content:test:1-1:normalized', 'textual.content', {
  target: 'mw:passage:test:verse-1-1', language: 'en', representation: 'normalized', text: 'Example.',
  derived_from: [{ content: 'mw:content:test:1-1:source', relation: 'normalization' }]
})

test('valid arbitrary-depth textual graph passes semantic invariants', () => {
  assert.deepEqual(findings([work, expression, scheme, chapter, verse, source, normalized]), [])
})

test('typed textual references reject structurally incompatible core targets', () => {
  const person = { id: 'mw:person:test', record_type: 'entity', kind: 'person' }
  const badExpression = resource('mw:expression:bad:en', 'textual.expression', {
    work: 'mw:person:test', language: 'en'
  })
  const result = findings([person, badExpression])
  assert.equal(result.some((finding) => finding.code === 'textual-reference-kind'), true)
})

test('passage hierarchy catches parent cycles, container mismatch, and sibling sequence collision', () => {
  const otherExpression = resource('mw:expression:test:other', 'textual.expression', { work: 'mw:work:test', language: 'en' })
  const a = resource('mw:passage:test:a', 'textual.passage', {
    container: 'mw:expression:test:en', parent: 'mw:passage:test:b', unit: 'verse', sequence: 1
  })
  const b = resource('mw:passage:test:b', 'textual.passage', {
    container: 'mw:expression:test:other', parent: 'mw:passage:test:a', unit: 'verse', sequence: 1
  })
  const c = resource('mw:passage:test:c', 'textual.passage', {
    container: 'mw:expression:test:en', parent: 'mw:passage:test:a', unit: 'verse', sequence: 1
  })
  const d = resource('mw:passage:test:d', 'textual.passage', {
    container: 'mw:expression:test:en', parent: 'mw:passage:test:a', unit: 'verse', sequence: 1
  })
  const result = findings([work, expression, otherExpression, a, b, c, d])
  assert.equal(result.some((finding) => finding.code === 'passage-parent-cycle'), true)
  assert.equal(result.some((finding) => finding.code === 'passage-container-mismatch'), true)
  assert.equal(result.some((finding) => finding.code === 'duplicate-passage-sequence'), true)
})

test('citation paths cannot exceed scheme depth or terminate at the wrong passage unit', () => {
  const bad = resource('mw:passage:test:bad-citation', 'textual.passage', {
    container: 'mw:expression:test:en', unit: 'chapter',
    citations: [
      { scheme: 'mw:citation-scheme:test', reference: '1:1:1', path: ['1', '1', '1'] },
      { scheme: 'mw:citation-scheme:test', reference: '1:1', path: ['1', '1'] }
    ]
  })
  const result = findings([work, expression, scheme, bad])
  assert.equal(result.some((finding) => finding.code === 'citation-path-depth'), true)
  assert.equal(result.some((finding) => finding.code === 'citation-unit-mismatch'), true)
})

test('content source boundary and derivation cycles are enforced', () => {
  const a = resource('mw:content:test:a', 'textual.content', {
    target: 'mw:passage:test:verse-1-1', language: 'en', representation: 'source', text: 'A',
    derived_from: [{ content: 'mw:content:test:b', relation: 'correction' }]
  })
  const b = resource('mw:content:test:b', 'textual.content', {
    target: 'mw:passage:test:verse-1-1', language: 'en', representation: 'normalized', text: 'B',
    derived_from: [{ content: 'mw:content:test:a', relation: 'normalization' }]
  })
  const result = findings([work, expression, scheme, chapter, verse, a, b])
  assert.equal(result.some((finding) => finding.code === 'source-content-derived'), true)
  assert.equal(result.some((finding) => finding.code === 'content-derivation-cycle'), true)
})

test('text position selectors enforce start <= end including nested range endpoints', () => {
  const direct = validateTextSelector({ type: 'TextPositionSelector', start: 8, end: 3 })
  assert.equal(direct.some((finding) => finding.code === 'text-position-order'), true)
  const nested = validateTextSelector({
    type: 'RangeSelector',
    startSelector: { type: 'TextPositionSelector', start: 5, end: 1 },
    endSelector: { type: 'TextQuoteSelector', exact: 'x' }
  })
  assert.equal(nested.some((finding) => finding.code === 'text-position-order'), true)
})
