import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { UniversalCorpusRegistry } from './universal-registry.js'

test('Universal Corpus Registry: loads all 42 traditions, 142 works, and 270 editions', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const sources = registry.getSources()
  const endpoints = registry.getEndpoints()

  assert.equal(traditions.length, 42, `Must have 42 world traditions, got ${traditions.length}`)
  assert.ok(works.length >= 140, `Must have at least 140 canonical scriptural works, got ${works.length}`)
  assert.ok(editions.length >= 250, `Must have at least 250 editions, got ${editions.length}`)
  assert.ok(sources.length >= 30, `Must have at least 30 sources, got ${sources.length}`)
  assert.ok(endpoints.length >= 140, `Must have at least 140 endpoints, got ${endpoints.length}`)
})

test('Universal Corpus Registry: resolves newly added breadth traditions and works', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const enochEds = registry.resolveWorkEditions('book-of-enoch')
  assert.ok(enochEds.length >= 2, 'Book of Enoch must have at least 2 editions')
  assert.ok(enochEds.some(e => e.language === 'gez'))
  assert.ok(enochEds.some(e => e.language === 'en'))

  const gilgameshEds = registry.resolveWorkEditions('epic-of-gilgamesh')
  assert.ok(gilgameshEds.length >= 2, 'Gilgamesh must have at least 2 editions')
  assert.ok(gilgameshEds.some(e => e.language === 'akk'))
  assert.ok(gilgameshEds.some(e => e.language === 'en'))

  const popolVuhEds = registry.resolveWorkEditions('popol-vuh')
  assert.ok(popolVuhEds.length >= 2, 'Popol Vuh must have at least 2 editions')
  assert.ok(popolVuhEds.some(e => e.language === 'quc'))
  assert.ok(popolVuhEds.some(e => e.language === 'en'))
})

test('Universal Corpus Registry: validation catches no orphan references or duplicate IDs across 42 traditions', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const validation = registry.validateRegistry()
  assert.equal(validation.valid, true, `Validation failed with problems: ${validation.problems.join(', ')}`)
  assert.equal(validation.problems.length, 0)
})
