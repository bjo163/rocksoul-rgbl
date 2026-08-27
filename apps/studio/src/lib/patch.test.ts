import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCurationOverlay } from './patch.js'

test('studio builds a reviewable curation overlay without hidden state', () => {
  assert.deepEqual(buildCurationOverlay({
    operation: 'replace', target: 'mw:content:example:1', path: '/extensions/textual/text',
    reason: 'Correct source transcription', curator: 'mw:person:curator', provenance: 'mw:provenance:review', value: 'Updated.'
  }), { version: '0.1', operations: [{ op: 'replace', target: 'mw:content:example:1', path: '/extensions/textual/text', reason: 'Correct source transcription', curator: 'mw:person:curator', provenance: 'mw:provenance:review', value: 'Updated.' }] })
})
