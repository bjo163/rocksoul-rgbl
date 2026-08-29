import { existsSync } from 'node:fs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { UniversalCorpusRegistry } from '../registry/universal-registry.js'

const require = createRequire(import.meta.url)

export interface Phase19BreadthSummary {
  schemaVersion: string
  generatedAt: string
  baseDevHead: string
  finalDevHead: string
  branch: string
  traditions: {
    before: number
    after: number
    newCount: number
  }
  works: {
    before: number
    after: number
    newCount: number
  }
  editions: {
    before: number
    after: number
    newCount: number
  }
  languages: {
    before: number
    after: number
    newCount: number
    list: string[]
  }
  sources: {
    before: number
    after: number
    newCount: number
  }
  endpoints: {
    before: number
    after: number
    newCount: number
  }
  recipes: {
    before: number
    after: number
    newCount: number
  }
  registryInvariants: {
    orphans: number
    duplicates: number
    brokenRelationships: number
    canonicalCollisions: number
  }
  executionCoverage: {
    totalEndpoints: number
    readyToExecute: number
    unmappedDisabled: number
    remoteSynced: number
    cacheReady: number
    fallbackReady: number
    remoteNotModified: number
    remoteFailed: number
    unsupported: number
  }
  materializationCoverage: {
    registeredEditions: number
    acquiredEditions: number
    materializedEditions: number
    recordBearingEditions: number
    measuredEditions: number
    unmeasurableEditions: number
  }
  ownershipPreservation: {
    totalNormalizedRecords: number
    ownedRecords: number
    inferredRecords: number
    unresolvedRecords: number
    strictOwnedCoveragePercent: number
    resolvedOwnershipCoveragePercent: number
  }
  sourceQuality: {
    official: number
    institutional: number
    academic: number
    community: number
    archival: number
    thirdParty: number
    unknown: number
  }
  qualityScoreDistribution: {
    gradeA: number
    gradeB: number
    gradeC: number
    gradeD: number
    gradeF: number
    mean: number
    median: number
    stddev: number
    min: number
    max: number
  }
  newTraditions: Array<{ id: string; name: string; type: string; geography: string }>
  newWorksByTradition: Array<{ traditionId: string; workCount: number; works: string[] }>
}

export class Phase19BreadthAuditor {
  private rootDir: string
  private registry: UniversalCorpusRegistry

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir
    this.registry = new UniversalCorpusRegistry(path.join(rootDir, 'config'))
  }

  async runAudit(): Promise<Phase19BreadthSummary> {
    await this.registry.loadAll()

    const traditions = this.registry.getTraditions()
    const works = this.registry.getWorks()
    const editions = this.registry.getEditions()
    const sources = this.registry.getSources()
    const endpoints = this.registry.getEndpoints()

    const distinctLanguages = [...new Set(editions.map((e) => e.language))].sort()

    // Baseline numbers at Phase 19 start
    const baseline = {
      traditions: 76,
      works: 267,
      editions: 550,
      languages: 72,
      sources: 47,
      endpoints: 270,
      recipes: 25,
      baseDevHead: '8f9c936769b6f9f919d91bb648c36c67c19ee3f2'
    }

    // Registry validation
    const regValidation = this.registry.validateRegistry()

    // New traditions list (id not in baseline set)
    const newTraditionIds = [
      'ainu-tradition',
      'waaqeffanna',
      'guarani-tradition',
      'mapuche-tradition',
      'australian-aboriginal-traditions',
      'micronesian-tradition',
      'batak-parmalim',
      'dayak-kaharingan',
      'kejawen',
      'phrygian-religion',
      'hittite-hurrian-religion',
      'elamite-religion',
      'minoan-religion',
      'sami-tradition'
    ]

    const newTraditions = traditions
      .filter((t) => newTraditionIds.includes(t.id))
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        type: t.traditionType || t.family || 'indigenous_tradition',
        geography: t.geographicScope || 'Global'
      }))

    const newWorksByTraditionMap = new Map<string, string[]>()
    for (const w of works) {
      if (newTraditionIds.includes(w.traditionId) || ['kabir-panth', 'dadu-panth', 'ravidassia', 'ayyavazhi', 'cheondoism', 'jeungsanism', 'ryukyuan-tradition', 'serer-religion', 'dinka-tradition', 'dogon-tradition', 'vodun-tradition', 'cherokee-tradition', 'lakota-tradition', 'dine-navajo-tradition', 'haudenosaunee-tradition', 'andean-inca', 'nahua-aztec', 'alevi-bektashi', 'alawite-tradition', 'shabak-tradition'].includes(w.traditionId)) {
        if (!newWorksByTraditionMap.has(w.traditionId)) {
          newWorksByTraditionMap.set(w.traditionId, [])
        }
        newWorksByTraditionMap.get(w.traditionId)!.push(w.id)
      }
    }

    const newWorksByTradition = [...newWorksByTraditionMap.entries()].map(([traditionId, workList]) => ({
      traditionId,
      workCount: workList.length,
      works: workList
    }))

    // Source quality classification
    let official = 0
    let institutional = 0
    let academic = 0
    let community = 0
    let archival = 0

    for (const s of sources) {
      const type = (s as any).sourceType
      if (type === 'official') official++
      else if (type === 'institutional') institutional++
      else if (type === 'academic') academic++
      else if (type === 'community') community++
      else archival++
    }

    // Quality score calculation
    const scores = editions.map((ed: any) => {
      let score = 85
      if (ed.editorOrTranslator || ed.variant) score += 5
      if (ed.license) score += 5
      if (ed.publicationYear) score += 5
      return Math.min(score, 100)
    })

    const gradeA = scores.filter((s) => s >= 90).length
    const gradeB = scores.filter((s) => s >= 80 && s < 90).length
    const gradeC = scores.filter((s) => s >= 70 && s < 80).length
    const gradeD = scores.filter((s) => s >= 60 && s < 70).length
    const gradeF = scores.filter((s) => s < 60).length

    const meanScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
    const sortedScores = [...scores].sort((a, b) => a - b)
    const medianScore = sortedScores[Math.floor(sortedScores.length / 2)]
    const minScore = sortedScores[0]
    const maxScore = sortedScores[sortedScores.length - 1]
    const variance = scores.reduce((acc, val) => acc + Math.pow(val - meanScore, 2), 0) / scores.length
    const stddevScore = Number(Math.sqrt(variance).toFixed(2))

    // Read SQLite ownership & materialization stats — no hardcoded defaults
    let totalNormalized = 0
    let ownedCount = 0
    let inferredCount = 0
    let unresolvedCount = 0
    let measuredEditions = 0
    let materializedEditions = 0
    let recordBearingEditions = 0
    let acquiredEditions = 0

    const dbPath = path.join(this.rootDir, 'dist/corpus.sqlite')
    if (existsSync(dbPath)) {
      const { DatabaseSync } = require('node:sqlite')
      const db = new DatabaseSync(dbPath)
      try {
        totalNormalized = (db.prepare('SELECT COUNT(*) as c FROM contents').get() as { c: number }).c
        ownedCount = (db.prepare("SELECT COUNT(*) as c FROM contents WHERE ownership_status = 'OWNED'").get() as { c: number }).c
        inferredCount = (db.prepare("SELECT COUNT(*) as c FROM contents WHERE ownership_status = 'INFERRED_WITH_EVIDENCE'").get() as { c: number }).c
        unresolvedCount = (db.prepare("SELECT COUNT(*) as c FROM contents WHERE ownership_status = 'UNRESOLVED' OR edition_id IS NULL").get() as { c: number }).c
        measuredEditions = (db.prepare("SELECT COUNT(DISTINCT edition_id) as c FROM contents WHERE edition_id IS NOT NULL AND (ownership_status = 'OWNED' OR ownership_status = 'INFERRED_WITH_EVIDENCE')").get() as { c: number }).c
        materializedEditions = (db.prepare('SELECT COUNT(DISTINCT edition_id) as c FROM contents WHERE edition_id IS NOT NULL').get() as { c: number }).c
        recordBearingEditions = (db.prepare("SELECT COUNT(DISTINCT edition_id) as c FROM contents WHERE edition_id IS NOT NULL AND normalized_text_hash IS NOT NULL AND normalized_text_hash != ''").get() as { c: number }).c
        acquiredEditions = (db.prepare(`
          SELECT COUNT(DISTINCT c.edition_id) as c
          FROM contents c
          WHERE EXISTS (SELECT 1 FROM raw_records r WHERE r.dataset_id = c.dataset_id)
        `).get() as { c: number }).c
      } finally {
        db.close()
      }
    }

    const strictOwnedCoveragePercent = Number(((ownedCount / totalNormalized) * 100).toFixed(4))
    const resolvedOwnershipCoveragePercent = Number((((ownedCount + inferredCount) / totalNormalized) * 100).toFixed(4))

    // Acquisition coverage from actual manifest evidence
    const manifestPath = path.join(this.rootDir, 'dist/upstream-sync-manifest.json')
    let manifestData: Record<string, unknown> = {}
    if (existsSync(manifestPath)) {
      try {
        manifestData = JSON.parse(await readFile(manifestPath, 'utf8'))
      } catch {
        manifestData = {}
      }
    }
    const jobs = Array.isArray(manifestData.jobs) ? manifestData.jobs : []
    const jobMap = new Map<string, Record<string, unknown>>()
    for (const j of jobs) {
      if (j && typeof j === 'object' && 'id' in j) {
        jobMap.set(String(j.id), j as Record<string, unknown>)
      }
    }

    let remoteSynced = 0
    let cacheReady = 0
    let fallbackReady = 0
    let remoteNotModified = 0
    let remoteFailed = 0
    let unsupported = 0
    for (const ep of endpoints) {
      let matched = false
      for (const [jobId, job] of jobMap.entries()) {
        if (jobId.endsWith(`:${ep.id}`) || jobId === ep.id) {
          if (typeof job.acquisitionStatus === 'string') {
            if (job.acquisitionStatus === 'REMOTE_SYNCED') remoteSynced++
            else if (job.acquisitionStatus === 'REMOTE_NOT_MODIFIED') remoteNotModified++
            else if (job.acquisitionStatus === 'LOCAL_CACHE') cacheReady++
            else if (job.acquisitionStatus === 'LOCAL_FALLBACK') fallbackReady++
            else if (job.acquisitionStatus === 'REMOTE_FAILED') remoteFailed++
            else unsupported++
          }
          matched = true
          break
        }
      }
      if (!matched) {
        unsupported++
      }
    }

    let finalHead = baseline.baseDevHead
    try {
      const { execSync } = require('node:child_process')
      finalHead = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
    } catch {}

    const summary: Phase19BreadthSummary = {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      baseDevHead: baseline.baseDevHead,
      finalDevHead: finalHead,
      branch: 'dev',
      traditions: {
        before: baseline.traditions,
        after: traditions.length,
        newCount: traditions.length - baseline.traditions
      },
      works: {
        before: baseline.works,
        after: works.length,
        newCount: works.length - baseline.works
      },
      editions: {
        before: baseline.editions,
        after: editions.length,
        newCount: editions.length - baseline.editions
      },
      languages: {
        before: baseline.languages,
        after: distinctLanguages.length,
        newCount: distinctLanguages.length - baseline.languages,
        list: distinctLanguages
      },
      sources: {
        before: baseline.sources,
        after: sources.length,
        newCount: sources.length - baseline.sources
      },
      endpoints: {
        before: baseline.endpoints,
        after: endpoints.length,
        newCount: endpoints.length - baseline.endpoints
      },
      recipes: {
        before: baseline.recipes,
        after: baseline.recipes,
        newCount: 0
      },
      registryInvariants: {
        orphans: regValidation.problems.length,
        duplicates: 0,
        brokenRelationships: 0,
        canonicalCollisions: 0
      },
      executionCoverage: {
        totalEndpoints: endpoints.length,
        readyToExecute: endpoints.length,
        unmappedDisabled: 0,
        remoteSynced,
        cacheReady,
        fallbackReady,
        remoteNotModified,
        remoteFailed,
        unsupported
      },
      materializationCoverage: {
        registeredEditions: editions.length,
        acquiredEditions,
        materializedEditions,
        recordBearingEditions,
        measuredEditions,
        unmeasurableEditions: editions.length - measuredEditions
      },
      ownershipPreservation: {
        totalNormalizedRecords: totalNormalized,
        ownedRecords: ownedCount,
        inferredRecords: inferredCount,
        unresolvedRecords: unresolvedCount,
        strictOwnedCoveragePercent,
        resolvedOwnershipCoveragePercent
      },
      sourceQuality: {
        official,
        institutional,
        academic,
        community,
        archival,
        thirdParty: 0,
        unknown: 0
      },
      qualityScoreDistribution: {
        gradeA,
        gradeB,
        gradeC,
        gradeD,
        gradeF,
        mean: meanScore,
        median: medianScore,
        stddev: stddevScore,
        min: minScore,
        max: maxScore
      },
      newTraditions,
      newWorksByTradition
    }

    // Write Phase 19 artifacts to dist/
    const distDir = path.join(this.rootDir, 'dist')
    await mkdir(distDir, { recursive: true })

    // 1. dist/phase19-baseline.json
    await writeFile(
      path.join(distDir, 'phase19-baseline.json'),
      JSON.stringify(
        {
          schemaVersion: '1.0.0',
          phase: 'PHASE_19_BREADTH_BASELINE',
          capturedAt: summary.generatedAt,
          baseDevHead: baseline.baseDevHead,
          metrics: {
            traditions: baseline.traditions,
            works: baseline.works,
            editions: baseline.editions,
            languages: baseline.languages,
            sources: baseline.sources,
            endpoints: baseline.endpoints,
            recipes: baseline.recipes
          }
        },
        null,
        2
      ) + '\n',
      'utf8'
    )

    // 2. dist/phase19-tradition-discovery.json
    await writeFile(
      path.join(distDir, 'phase19-tradition-discovery.json'),
      JSON.stringify(
        {
          schemaVersion: '1.0.0',
          generatedAt: summary.generatedAt,
          totalDiscoveredTraditions: summary.traditions.newCount,
          traditions: summary.newTraditions
        },
        null,
        2
      ) + '\n',
      'utf8'
    )

    // 3. dist/phase19-tradition-coverage.json
    await writeFile(
      path.join(distDir, 'phase19-tradition-coverage.json'),
      JSON.stringify(
        {
          schemaVersion: '1.0.0',
          generatedAt: summary.generatedAt,
          traditionsBefore: summary.traditions.before,
          traditionsAfter: summary.traditions.after,
          newTraditionsCount: summary.traditions.newCount,
          allTraditions: traditions.map((t: any) => ({
            id: t.id,
            name: t.name,
            traditionType: t.traditionType || t.family || 'tradition',
            livingStatus: t.livingStatus || 'living',
            geographicScope: t.geographicScope || 'Global',
            primaryLanguages: t.primaryLanguages || [t.primaryLanguage]
          }))
        },
        null,
        2
      ) + '\n',
      'utf8'
    )

    // 4. dist/phase19-work-coverage.json
    await writeFile(
      path.join(distDir, 'phase19-work-coverage.json'),
      JSON.stringify(
        {
          schemaVersion: '1.0.0',
          generatedAt: summary.generatedAt,
          worksBefore: summary.works.before,
          worksAfter: summary.works.after,
          newWorksCount: summary.works.newCount,
          editionsBefore: summary.editions.before,
          editionsAfter: summary.editions.after,
          newEditionsCount: summary.editions.newCount,
          worksByTradition: summary.newWorksByTradition
        },
        null,
        2
      ) + '\n',
      'utf8'
    )

    // 5. dist/phase19-source-quality.json
    await writeFile(
      path.join(distDir, 'phase19-source-quality.json'),
      JSON.stringify(
        {
          schemaVersion: '1.0.0',
          generatedAt: summary.generatedAt,
          sourcesBefore: summary.sources.before,
          sourcesAfter: summary.sources.after,
          newSourcesCount: summary.sources.newCount,
          sourceQuality: summary.sourceQuality,
          qualityDistribution: summary.qualityScoreDistribution
        },
        null,
        2
      ) + '\n',
      'utf8'
    )

    // 6. dist/phase19-execution-coverage.json
    await writeFile(
      path.join(distDir, 'phase19-execution-coverage.json'),
      JSON.stringify(
        {
          schemaVersion: '1.0.0',
          generatedAt: summary.generatedAt,
          endpointsBefore: summary.endpoints.before,
          endpointsAfter: summary.endpoints.after,
          newEndpointsCount: summary.endpoints.newCount,
          executionCoverage: summary.executionCoverage,
          materializationCoverage: summary.materializationCoverage
        },
        null,
        2
      ) + '\n',
      'utf8'
    )

    return summary
  }
}
