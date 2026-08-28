import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { UniversalCorpusRegistry } from './universal-registry.js'

test('Universal Corpus Registry: loads all expanded normalized registry files', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const sources = registry.getSources()
  const endpoints = registry.getEndpoints()

  assert.equal(traditions.length, 12, 'Must have 12 normalized world traditions')
  assert.equal(works.length, 58, 'Must have 58 canonical scriptural works (50+ depth expansion)')
  assert.ok(editions.length >= 50, `Must have at least 50 editions, got ${editions.length}`)
  assert.equal(sources.length, 16, 'Must have 16 upstream sources')
  assert.ok(endpoints.length >= 50, `Must have at least 50 endpoints, got ${endpoints.length}`)
})

test('Universal Corpus Registry: resolves traditions, works, editions, sources, endpoints', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const islam = registry.resolveTradition('islam')
  assert.equal(islam.name, 'Islam')
  assert.equal(islam.family, 'abrahamic')

  const quran = registry.resolveWork('quran')
  assert.equal(quran.name, "Qur'an")
  assert.equal(quran.traditionId, 'islam')
  assert.deepEqual(quran.structure.levels, ['surah', 'ayah', 'word'])

  const abudawud = registry.resolveWork('hadith-abudawud')
  assert.equal(abudawud.traditionId, 'islam')

  const septuagint = registry.resolveWork('septuagint')
  assert.equal(septuagint.traditionId, 'christianity')

  const rigveda = registry.resolveWork('rigveda')
  assert.equal(rigveda.traditionId, 'hinduism')

  const mencius = registry.resolveWork('mencius')
  assert.equal(mencius.traditionId, 'confucianism')

  const tanzil = registry.resolveSource('tanzil')
  assert.equal(tanzil.name, 'Tanzil Project')

  const tanzilEp = registry.resolveEndpoint('tanzil-quran')
  assert.equal(tanzilEp.sourceId, 'tanzil')
  assert.equal(tanzilEp.workId, 'quran')
})

test('Universal Corpus Registry: navigates many-to-many relationships across expanded traditions', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  // Islam: 12 works
  const islamicWorks = registry.resolveTraditionWorks('islam')
  assert.equal(islamicWorks.length, 12, 'Islam must have Qur\'an, 6 major Hadith books, Malik, Nawawi, Qudsi, Duas, Names')
  assert.ok(islamicWorks.some(w => w.id === 'quran'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-bukhari'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-muslim'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-abudawud'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-tirmidhi'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-nasai'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-ibnmajah'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-malik'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-nawawi'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-qudsi'))
  assert.ok(islamicWorks.some(w => w.id === 'duas-hisnul-muslim'))
  assert.ok(islamicWorks.some(w => w.id === 'asmaul-husna'))

  // Christianity: 6 works
  const christianWorks = registry.resolveTraditionWorks('christianity')
  assert.equal(christianWorks.length, 6)

  // Judaism: 7 works
  const jewishWorks = registry.resolveTraditionWorks('judaism')
  assert.equal(jewishWorks.length, 7)

  // Hinduism: 6 works
  const hinduWorks = registry.resolveTraditionWorks('hinduism')
  assert.equal(hinduWorks.length, 6)

  // Buddhism: 8 works
  const buddhistWorks = registry.resolveTraditionWorks('buddhism')
  assert.equal(buddhistWorks.length, 8)
})

test('Universal Corpus Registry: validation catches no orphan references or duplicate IDs', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const validation = registry.validateRegistry()
  assert.equal(validation.valid, true, `Validation failed with problems: ${validation.problems.join(', ')}`)
  assert.equal(validation.problems.length, 0)
})

test('Universal Corpus Registry: achieves 100% work coverage and generates depth report', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const coverage = registry.generateWorkCoverageReport()
  assert.equal(coverage.traditions, 12)
  assert.equal(coverage.works, 58)
  assert.equal(coverage.worksWithUpstream, 58, 'All 58 scriptural works must be covered')
  assert.equal(coverage.worksWithoutUpstream, 0, '0 uncovered works')
  assert.equal(coverage.coveragePercent, 100, 'Work coverage must reach 100%')

  const depth = registry.generateCorpusDepthReport()
  assert.equal(depth.before.works, 27)
  assert.equal(depth.after.works, 58)
  assert.equal(depth.coverage.worksWithExecutableUpstream, 58)
  assert.equal(depth.coverage.worksWithoutExecutableUpstream, 0)
  assert.equal(depth.coverage.coveragePercent, 100)
  assert.equal(Object.keys(depth.newWorksByTradition).length, 12)
})
