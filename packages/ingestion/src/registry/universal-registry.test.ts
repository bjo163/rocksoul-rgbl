import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { UniversalCorpusRegistry } from './universal-registry.js'

test('Universal Corpus Registry: loads all 28 traditions and 104 works', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const sources = registry.getSources()
  const endpoints = registry.getEndpoints()

  assert.equal(traditions.length, 28, 'Must have 28 world traditions (12 -> 25+ target achieved)')
  assert.equal(works.length, 104, 'Must have 104 canonical scriptural works (100+ target achieved)')
  assert.ok(editions.length >= 100, `Must have at least 100 editions, got ${editions.length}`)
  assert.ok(sources.length >= 20, `Must have at least 20 sources, got ${sources.length}`)
  assert.ok(endpoints.length >= 100, `Must have at least 100 endpoints, got ${endpoints.length}`)
})

test('Universal Corpus Registry: resolves newly added traditions and works', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const samaritanism = registry.resolveTradition('samaritanism')
  assert.equal(samaritanism.name, 'Samaritanism')

  const ifa = registry.resolveTradition('yoruba-ifa')
  assert.equal(ifa.name, 'Yoruba Religion (Ifá)')

  const gnosticism = registry.resolveTradition('gnosticism')
  assert.equal(gnosticism.name, 'Gnosticism')

  const hermeticism = registry.resolveTradition('hermeticism')
  assert.equal(hermeticism.name, 'Hermeticism')

  const thomas = registry.resolveWork('gospel-of-thomas')
  assert.equal(thomas.traditionId, 'gnosticism')

  const ifaCorpus = registry.resolveWork('odu-ifa-corpus')
  assert.equal(ifaCorpus.traditionId, 'yoruba-ifa')

  const corpusHermeticum = registry.resolveWork('corpus-hermeticum')
  assert.equal(corpusHermeticum.traditionId, 'hermeticism')
})

test('Universal Corpus Registry: validation catches no orphan references or duplicate IDs', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const validation = registry.validateRegistry()
  assert.equal(validation.valid, true, `Validation failed with problems: ${validation.problems.join(', ')}`)
  assert.equal(validation.problems.length, 0)
})

test('Universal Corpus Registry: generates multi-tradition discovery reports', async () => {
  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const discovery = registry.generateTraditionDiscoveryReport()
  assert.equal(discovery.totalTraditions, 28)
  assert.equal(discovery.traditions.length, 28)

  const coverage = registry.generateWorkCoverageReport()
  assert.equal(coverage.traditions, 28)
  assert.equal(coverage.works, 104)
  assert.equal(coverage.worksWithUpstream, 104)
  assert.equal(coverage.coveragePercent, 100)
})
