import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()

test('P15 contracts preserve scoped lexical identity boundaries', async () => {
  const policy = await readFile(path.join(root, 'spec/v0.1/profiles/lexicon.md'), 'utf8')
  assert.match(policy, /never evidence of identity or equivalence/i)

  const lines = (await readFile(path.join(root, 'datasets/examples/p15-lexicon-contract/data/core/resources/fixture.jsonl'), 'utf8'))
    .trim().split(/\r?\n/).map((line) => JSON.parse(line) as Record<string, unknown>)
  const kinds = new Set(lines.map((record) => record.kind))
  for (const kind of ['concept', 'term', 'sacred_name', 'epithet', 'title', 'honorific', 'definition', 'usage', 'transliteration', 'etymology', 'relation']) {
    assert.ok(kinds.has(`lexicon.${kind}`), `missing lexicon.${kind} contract fixture`)
  }

  const assertions = (await readFile(path.join(root, 'datasets/examples/p15-lexicon-contract/data/core/assertions/designations.jsonl'), 'utf8'))
    .trim().split(/\r?\n/).map((line) => JSON.parse(line) as Record<string, unknown>)
  assert.equal(assertions.length, 4)
  for (const assertion of assertions) {
    assert.equal(assertion.predicate, 'mw:predicate:designates')
    assert.ok(assertion.scope)
    assert.match(String(assertion.provenance), /^mw:provenance:/)
    assert.notEqual(assertion.subject, (assertion.object as { entity: string }).entity, 'designation and entity identity must remain separate')
  }
})
