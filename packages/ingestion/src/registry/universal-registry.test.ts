import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { UniversalCorpusRegistry } from './universal-registry.js'

test('Universal Corpus Registry: loads all 50+ traditions, 185+ works, and 370+ editions', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const sources = registry.getSources()
  const endpoints = registry.getEndpoints()

  assert.ok(traditions.length >= 50, `Must have >= 50 world traditions, got ${traditions.length}`)
  assert.ok(works.length >= 185, `Must have >= 185 canonical scriptural works, got ${works.length}`)
  assert.ok(editions.length >= 370, `Must have >= 370 editions, got ${editions.length}`)
  assert.ok(sources.length >= 32, `Must have >= 32 sources, got ${sources.length}`)
  assert.ok(endpoints.length >= 185, `Must have >= 185 endpoints, got ${endpoints.length}`)
})

test('Universal Corpus Registry: resolves newly added breadth traditions and works', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const buyrukEds = registry.resolveWorkEditions('buyruk-imam-jafar')
  assert.ok(buyrukEds.length >= 2, 'Buyruk of Imam Jafar must have at least 2 editions')
  assert.ok(buyrukEds.some(e => e.language === 'ota'))
  assert.ok(buyrukEds.some(e => e.language === 'en'))

  const baalEds = registry.resolveWorkEditions('baal-cycle-ugaritic')
  assert.ok(baalEds.length >= 2, 'Baal Cycle must have at least 2 editions')
  assert.ok(baalEds.some(e => e.language === 'uga'))
  assert.ok(baalEds.some(e => e.language === 'en'))

  const leborEds = registry.resolveWorkEditions('lebor-gabala-erenn')
  assert.ok(leborEds.length >= 2, 'Lebor Gabala Erenn must have at least 2 editions')
  assert.ok(leborEds.some(e => e.language === 'sga'))
  assert.ok(leborEds.some(e => e.language === 'en'))
})

test('Universal Corpus Registry: validation catches no orphan references or duplicate IDs across all traditions', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const endpoints = registry.getEndpoints()

  assert.ok(traditions.length >= 50)
  assert.ok(works.length >= 185)
  assert.ok(editions.length >= 370)
  assert.ok(endpoints.length >= 185)
})
