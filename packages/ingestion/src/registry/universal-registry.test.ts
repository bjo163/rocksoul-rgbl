import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { UniversalCorpusRegistry } from './universal-registry.js'

test('Universal Corpus Registry: loads all normalized registry files', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const sources = registry.getSources()
  const endpoints = registry.getEndpoints()

  assert.equal(traditions.length, 12, 'Must have 12 normalized world traditions')
  assert.equal(works.length, 27, 'Must have exactly 27 canonical scriptural works')
  assert.ok(editions.length >= 25, `Must have at least 25 editions, got ${editions.length}`)
  assert.equal(sources.length, 16, 'Must have 16 upstream sources')
  assert.ok(endpoints.length >= 27, `Must have at least 27 endpoints, got ${endpoints.length}`)
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

  const bukhari = registry.resolveWork('hadith-bukhari')
  assert.equal(bukhari.traditionId, 'islam')

  const tanzil = registry.resolveSource('tanzil')
  assert.equal(tanzil.name, 'Tanzil Project')

  const tanzilEp = registry.resolveEndpoint('tanzil-quran')
  assert.equal(tanzilEp.sourceId, 'tanzil')
  assert.equal(tanzilEp.workId, 'quran')
})

test('Universal Corpus Registry: navigates many-to-many relationships', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  // 1 Tradition -> Many Works
  const islamicWorks = registry.resolveTraditionWorks('islam')
  assert.equal(islamicWorks.length, 6, 'Islam must have Qur\'an, Hadith Bukhari, Muslim, Nawawi, Duas, Asmaul Husna')
  assert.ok(islamicWorks.some(w => w.id === 'quran'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-bukhari'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-muslim'))
  assert.ok(islamicWorks.some(w => w.id === 'hadith-nawawi'))
  assert.ok(islamicWorks.some(w => w.id === 'duas-hisnul-muslim'))
  assert.ok(islamicWorks.some(w => w.id === 'asmaul-husna'))

  // 1 Work -> Many Editions
  const quranEditions = registry.resolveWorkEditions('quran')
  assert.ok(quranEditions.length >= 2, 'Quran must have Uthmani and translation editions')

  // 1 Work -> Many Endpoints & Sources
  const quranEndpoints = registry.resolveWorkEndpoints('quran')
  assert.ok(quranEndpoints.length >= 2, 'Quran must have Tanzil and QuranEnc/Ummah endpoints')

  const quranSources = registry.resolveWorkSources('quran')
  assert.ok(quranSources.some(s => s.id === 'tanzil'))
})

test('Universal Corpus Registry: validation catches no orphan references', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const validation = registry.validateRegistry()
  assert.equal(validation.valid, true, `Validation failed with problems: ${validation.problems.join(', ')}`)
  assert.equal(validation.problems.length, 0)
})

test('Universal Corpus Registry: achieves 100% work coverage (27/27 covered)', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const coverage = registry.generateWorkCoverageReport()
  assert.equal(coverage.traditions, 12)
  assert.equal(coverage.works, 27)
  assert.equal(coverage.worksWithUpstream, 27, 'All 27 scriptural works must be covered')
  assert.equal(coverage.worksWithoutUpstream, 0, '0 uncovered works')
  assert.equal(coverage.coveragePercent, 100, 'Work coverage must reach 100%')

  const uncovered = registry.generateUncoveredWorksReport()
  assert.equal(uncovered.totalWorks, 27)
  assert.equal(uncovered.coveredWorks, 27)
  assert.equal(uncovered.uncoveredWorks, 0)
  assert.equal(uncovered.works.length, 0)
})
