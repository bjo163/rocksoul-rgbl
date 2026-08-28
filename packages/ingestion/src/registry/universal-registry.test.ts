import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { UniversalCorpusRegistry } from './universal-registry.js'

test('Universal Corpus Registry: loads all 28 traditions, 104 works, and 200+ editions', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const sources = registry.getSources()
  const endpoints = registry.getEndpoints()

  assert.equal(traditions.length, 28, 'Must have 28 world traditions')
  assert.equal(works.length, 104, 'Must have 104 canonical scriptural works')
  assert.ok(editions.length >= 200, `Must have at least 200 editions, got ${editions.length}`)
  assert.ok(sources.length >= 20, `Must have at least 20 sources, got ${sources.length}`)
  assert.ok(endpoints.length >= 100, `Must have at least 100 endpoints, got ${endpoints.length}`)
})

test('Universal Corpus Registry: resolves newly added multi-language editions', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const quranEds = registry.resolveWorkEditions('quran')
  assert.ok(quranEds.length >= 5, 'Quran must have at least 5 multi-language editions')
  assert.ok(quranEds.some(e => e.language === 'ar'))
  assert.ok(quranEds.some(e => e.language === 'en'))
  assert.ok(quranEds.some(e => e.language === 'id'))
  assert.ok(quranEds.some(e => e.language === 'tr'))
  assert.ok(quranEds.some(e => e.language === 'ur'))

  const gntEds = registry.resolveWorkEditions('greek-new-testament')
  assert.ok(gntEds.length >= 4)
  assert.ok(gntEds.some(e => e.language === 'grc'))
  assert.ok(gntEds.some(e => e.language === 'la'))
  assert.ok(gntEds.some(e => e.language === 'id'))
  assert.ok(gntEds.some(e => e.language === 'de'))
})

test('Universal Corpus Registry: validation catches no orphan references or duplicate IDs', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const validation = registry.validateRegistry()
  assert.equal(validation.valid, true, `Validation failed with problems: ${validation.problems.join(', ')}`)
  assert.equal(validation.problems.length, 0)
})
