import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { SqliteCorpusRepository } from './sqlite-repository.js'

const dbPath = path.join(process.cwd(), 'dist/corpus.sqlite')

test('SqliteCorpusRepository loads the embedded database with sub-millisecond queries', async () => {
  const repo = SqliteCorpusRepository.open(dbPath)

  // 1. Test listing datasets
  const datasets = await repo.listDatasets()
  assert.ok(datasets.length >= 20, 'Must contain active datasets in SQLite store')

  // 2. Test getting a canonical record
  const startRecord = performance.now()
  const gitaWork = await repo.getRecord('mw:work:hinduism:bhagavad-gita')
  const recordDuration = performance.now() - startRecord
  assert.ok(gitaWork, 'Must retrieve Bhagavad Gita work record')
  assert.equal(gitaWork.id, 'mw:work:hinduism:bhagavad-gita')
  assert.ok(recordDuration < 10, `Single record query took ${recordDuration.toFixed(2)}ms (< 10ms target)`)

  // 3. Test parallel verse query (Passage + Translations)
  const startPassage = performance.now()
  const passageResult = repo.getPassageWithContents('mw:passage:hinduism:bhagavad-gita:1:1')
  const passageDuration = performance.now() - startPassage
  assert.ok(passageResult, 'Must retrieve Gita 1:1 with contents')
  assert.ok(passageResult.contents.length >= 2, 'Must contain Sanskrit and English translation')
  assert.ok(passageDuration < 10, `Passage contents query took ${passageDuration.toFixed(2)}ms`)

  // 4. Test work passage iteration (Gita Chapter 1 slokas)
  const startWork = performance.now()
  const gitaVerses = repo.getWorkPassages('mw:work:hinduism:bhagavad-gita', 10, 0)
  const workDuration = performance.now() - startWork
  assert.equal(gitaVerses.length, 10, 'Must retrieve 10 verses')
  assert.ok(workDuration < 50, `Batch 10 verses query took ${workDuration.toFixed(2)}ms`)

  // 5. Test devotional queries (Asmaul Husna & Duas)
  const asmaul = repo.getDevotionals('islam', 'asmaul-husna', 5)
  assert.equal(asmaul.length, 5, 'Must retrieve 5 Asmaul Husna')
  assert.equal(asmaul[0].arabic_text, 'الرَّحْمَنُ')

  // 6. Test search
  const startSearch = performance.now()
  const searchResults = await repo.search({ text: 'Ar-Rahman', limit: 10 })
  const searchDuration = performance.now() - startSearch
  assert.ok(searchResults.length >= 1, 'Must find search hits for Ar-Rahman')
  assert.ok(searchDuration < 150, `Search query took ${searchDuration.toFixed(2)}ms`)

  repo.close()
})
