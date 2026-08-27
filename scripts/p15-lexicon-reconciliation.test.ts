import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { buildP15ReconciliationReport } from './p15-lexicon-reconciliation.js'

test('P15 lexicon reconciliation report is deterministic and never auto-merges candidates', async () => {
  const root = process.cwd()
  const generated = await buildP15ReconciliationReport(root)
  const committed = JSON.parse(await readFile(path.join(root, 'docs/P15-RECONCILIATION-REPORT.json'), 'utf8'))

  assert.deepEqual(generated, committed)
  assert.equal(generated.automaticMerge, false)
  assert.deepEqual(generated.counts, {
    terms: 5,
    concepts: 5,
    transliterations: 2,
    duplicates: 0,
    spellingVariants: 0,
    homographs: 0,
    possibleConceptMatches: 0,
  })
  assert.equal(generated.guardrails.reportsAreCandidatesOnly, true)
  assert.equal(generated.guardrails.noAutomaticMerge, true)
  assert.equal(generated.guardrails.crossTraditionEquivalenceRequiresSource, true)
  assert.deepEqual(generated.transliterations.map((item) => item.id), [
    'mw:lexicon.transliteration:quran:allah',
    'mw:lexicon.transliteration:quran:rabb',
  ])
})
