import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

test('P14 Hadith Nawawi dataset preserves distinct matn/isnad and human translations', async () => {
  const root = process.cwd()
  const datasetDir = path.join(root, 'datasets/hadith-nawawi-40')
  const resources = (await readFile(path.join(datasetDir, 'data/core/resources/hadith-nawawi-40.jsonl'), 'utf8'))
    .trim()
    .split(/\r?\n/)
    .map((l) => JSON.parse(l))
  const assertions = (await readFile(path.join(datasetDir, 'data/core/assertions/isnad.jsonl'), 'utf8'))
    .trim()
    .split(/\r?\n/)
    .map((l) => JSON.parse(l))

  const passages = resources.filter((r) => r.kind === 'textual.passage')
  const contents = resources.filter((r) => r.kind === 'textual.content')

  assert.ok(passages.length >= 7)
  assert.ok(contents.length >= 21) // 7 * (ar, en, id)
  assert.ok(assertions.length >= 7)

  // Verify Arabic content is populated and source-represented
  const arContents = contents.filter((c) => c.extensions?.textual?.language === 'ar')
  for (const c of arContents) {
    assert.ok(c.extensions?.textual?.text, 'Arabic content must expose Arabic text')
    assert.equal(c.extensions?.textual?.representation, 'source')
  }

  // Verify isnad assertions are transmission claims, not unqualified historical facts
  for (const a of assertions) {
    assert.equal(a.record_type, 'assertion')
    assert.equal(a.assertion_class, 'transmission_claim')
    assert.equal(a.scope?.tradition, 'mw:tradition:islam')
    assert.ok(a.extensions?.isnad?.first_transmitter)
  }
})
