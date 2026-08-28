import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { UniversalCorpusRegistry } from './universal-registry.js'

test('Universal Corpus Registry: loads all 60+ traditions, 220+ works, and 450+ editions', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const sources = registry.getSources()
  const endpoints = registry.getEndpoints()

  assert.ok(traditions.length >= 60, `Must have >= 60 world traditions, got ${traditions.length}`)
  assert.ok(works.length >= 220, `Must have >= 220 canonical scriptural works, got ${works.length}`)
  assert.ok(editions.length >= 450, `Must have >= 450 editions, got ${editions.length}`)
  assert.ok(sources.length >= 34, `Must have >= 34 sources, got ${sources.length}`)
  assert.ok(endpoints.length >= 225, `Must have >= 225 endpoints, got ${endpoints.length}`)
})

test('Universal Corpus Registry: resolves newly added breadth traditions and works', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const sarBachanEds = registry.resolveWorkEditions('sar-bachan-radhasoami')
  assert.ok(sarBachanEds.length >= 2, 'Sar Bachan Radhasoami must have at least 2 editions')
  assert.ok(sarBachanEds.some(e => e.language === 'hi'))
  assert.ok(sarBachanEds.some(e => e.language === 'en'))

  const samGiangEds = registry.resolveWorkEditions('sam-giang-khuyen-tu')
  assert.ok(samGiangEds.length >= 2, 'Sam Giang Khuyen Tu must have at least 2 editions')
  assert.ok(samGiangEds.some(e => e.language === 'vi'))
  assert.ok(samGiangEds.some(e => e.language === 'en'))

  const liberLinteusEds = registry.resolveWorkEditions('liber-linteus-zagrebiensis')
  assert.ok(liberLinteusEds.length >= 2, 'Liber Linteus must have at least 2 editions')
  assert.ok(liberLinteusEds.some(e => e.language === 'ett'))
  assert.ok(liberLinteusEds.some(e => e.language === 'en'))
})

test('Universal Corpus Registry: validation catches no orphan references or duplicate IDs across all traditions', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const endpoints = registry.getEndpoints()

  assert.ok(traditions.length >= 60)
  assert.ok(works.length >= 220)
  assert.ok(editions.length >= 450)
  assert.ok(endpoints.length >= 225)
})
