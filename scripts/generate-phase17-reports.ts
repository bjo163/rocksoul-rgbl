import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { UniversalCorpusRegistry } from '../packages/ingestion/src/registry/universal-registry.js'

async function main() {
  const distDir = path.join(process.cwd(), 'dist')
  await mkdir(distDir, { recursive: true })

  const registry = new UniversalCorpusRegistry(path.join(process.cwd(), 'config'))
  await registry.loadAll()

  const traditions = registry.getTraditions()
  const works = registry.getWorks()
  const editions = registry.getEditions()
  const sources = registry.getSources()
  const endpoints = registry.getEndpoints()

  const timestamp = new Date().toISOString()

  // 1. Phase 17 Baseline snapshot
  const baseline = {
    schemaVersion: '1.0.0',
    phase: 'PHASE_17_BASELINE',
    capturedAt: '2026-08-29T06:45:00.000Z',
    baseDevHead: 'bbd1dbd94ece2698915a8bea57ca7f4245e9a293',
    metrics: {
      traditions: 64,
      works: 225,
      editions: 465,
      languages: 62,
      sources: 36,
      endpoints: 228,
      canonicalPositions: 537051,
      editionRecords: 704231,
      indexedRecords: 537512,
      materializedEditions: 465,
      measuredEditions: 44,
      unmeasurableEditions: 421
    }
  }
  await writeFile(path.join(distDir, 'phase17-baseline.json'), JSON.stringify(baseline, null, 2) + '\n', 'utf8')

  // 2. Phase 17 Tradition Discovery Report
  const newTraditionIds = [
    'dadu-panth',
    'jeungsanism',
    'yiguandao',
    'igbo-odinani',
    'serer-religion',
    'cherokee-tradition',
    'inuit-tradition',
    'tongan-tradition',
    'fijian-tradition',
    'shabak-tradition',
    'baltic-tradition',
    'canaanite-phoenician'
  ]

  const traditionDiscovery = {
    schemaVersion: '1.0.0',
    generatedAt: timestamp,
    totalTraditions: traditions.length,
    newTraditionsCount: newTraditionIds.length,
    workers: [
      { workerId: 'worker-a', region: 'South Asia', traditionsAdded: ['dadu-panth'] },
      { workerId: 'worker-b', region: 'East Asia', traditionsAdded: ['jeungsanism', 'yiguandao'] },
      { workerId: 'worker-c', region: 'Africa', traditionsAdded: ['igbo-odinani', 'serer-religion'] },
      { workerId: 'worker-d', region: 'Indigenous Americas', traditionsAdded: ['cherokee-tradition', 'inuit-tradition'] },
      { workerId: 'worker-e', region: 'Pacific / Oceania', traditionsAdded: ['tongan-tradition', 'fijian-tradition'] },
      { workerId: 'worker-f', region: 'Middle East / Caucasus', traditionsAdded: ['shabak-tradition'] },
      { workerId: 'worker-g', region: 'European / Historical', traditionsAdded: ['baltic-tradition'] },
      { workerId: 'worker-h', region: 'Ancient Mediterranean / Historical', traditionsAdded: ['canaanite-phoenician'] }
    ],
    newTraditions: newTraditionIds.map(tId => {
      const t = registry.resolveTradition(tId)
      const tWorks = works.filter(w => w.traditionId === tId)
      const tEds = editions.filter(e => tWorks.some(w => w.id === e.workId))
      return {
        id: tId,
        name: t?.name || tId,
        family: t?.family || 'unknown',
        primaryLanguage: t?.primaryLanguage || 'unknown',
        worksCount: tWorks.length,
        editionsCount: tEds.length,
        works: tWorks.map(w => w.name)
      }
    })
  }
  await writeFile(path.join(distDir, 'phase17-tradition-discovery.json'), JSON.stringify(traditionDiscovery, null, 2) + '\n', 'utf8')

  // 3. Phase 17 Tradition Coverage
  const traditionCoverage = {
    schemaVersion: '1.0.0',
    generatedAt: timestamp,
    totalTraditions: traditions.length,
    traditions: traditions.map(t => {
      const tWorks = works.filter(w => w.traditionId === t.id)
      const tEds = editions.filter(e => tWorks.some(w => w.id === e.workId))
      const tSources = tWorks.flatMap(w => registry.resolveWorkSources(w.id))
      const tEndpoints = tWorks.flatMap(w => registry.resolveWorkEndpoints(w.id))
      return {
        traditionId: t.id,
        name: t.name,
        family: t.family,
        primaryLanguage: t.primaryLanguage,
        works: tWorks.length,
        editions: tEds.length,
        sources: tSources.length,
        endpoints: tEndpoints.length,
        materialized: true
      }
    })
  }
  await writeFile(path.join(distDir, 'phase17-tradition-coverage.json'), JSON.stringify(traditionCoverage, null, 2) + '\n', 'utf8')

  // 4. Phase 17 Work Coverage
  const workCoverage = {
    schemaVersion: '1.0.0',
    generatedAt: timestamp,
    totalWorks: works.length,
    works: works.map(w => {
      const wEds = editions.filter(e => e.workId === w.id)
      const wSources = registry.resolveWorkSources(w.id)
      const wEndpoints = registry.resolveWorkEndpoints(w.id)
      return {
        workId: w.id,
        traditionId: w.traditionId,
        name: w.name,
        workType: w.workType,
        primaryLanguage: (w as any).primaryLanguage || wEds[0]?.language || 'unknown',
        canonicalStatus: w.canonicalStatus,
        editions: wEds.length,
        sources: wSources.length,
        endpoints: wEndpoints.length
      }
    })
  }
  await writeFile(path.join(distDir, 'phase17-work-coverage.json'), JSON.stringify(workCoverage, null, 2) + '\n', 'utf8')

  // 5. Phase 17 Source Quality
  const sourceQuality = {
    schemaVersion: '1.0.0',
    generatedAt: timestamp,
    totalSources: sources.length,
    authorityBreakdown: {
      official: sources.filter(s => s.authorityLevel === 'official').length,
      institutional: sources.filter(s => s.authorityLevel === 'institutional').length,
      academic: sources.filter(s => s.authorityLevel === 'academic').length,
      community: sources.filter(s => s.authorityLevel === 'community').length,
      archival: sources.filter(s => s.authorityLevel === 'archival').length
    },
    sources: sources.map(s => {
      const sEndpoints = registry.resolveSourceEndpoints(s.id)
      return {
        sourceId: s.id,
        name: s.name,
        authorityLevel: s.authorityLevel,
        url: (s as any).url || '',
        endpointsCount: sEndpoints.length
      }
    })
  }
  await writeFile(path.join(distDir, 'phase17-source-quality.json'), JSON.stringify(sourceQuality, null, 2) + '\n', 'utf8')

  console.log('✨ All Phase 17 coverage and discovery reports written to dist/')
}

main().catch(console.error)
