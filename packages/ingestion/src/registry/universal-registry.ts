import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  TraditionRecord,
  WorkRecord,
  EditionRecord,
  SourceRecord,
  EndpointRecord,
  UniversalExecutionPlan,
  WorkCoverageReport
} from './types.js'

export class UniversalCorpusRegistry {
  private readonly configDir: string
  private traditionsMap = new Map<string, TraditionRecord>()
  private worksMap = new Map<string, WorkRecord>()
  private editionsMap = new Map<string, EditionRecord>()
  private sourcesMap = new Map<string, SourceRecord>()
  private endpointsMap = new Map<string, EndpointRecord>()
  private loaded = false

  constructor(configDir: string = path.join(process.cwd(), 'config')) {
    this.configDir = configDir
  }

  async loadAll(): Promise<this> {
    if (this.loaded) return this

    const [traditionsRaw, worksRaw, editionsRaw, sourcesRaw, endpointsRaw] = await Promise.all([
      readFile(path.join(this.configDir, 'traditions.json'), 'utf8'),
      readFile(path.join(this.configDir, 'works.json'), 'utf8'),
      readFile(path.join(this.configDir, 'editions.json'), 'utf8'),
      readFile(path.join(this.configDir, 'sources.json'), 'utf8'),
      readFile(path.join(this.configDir, 'endpoints.json'), 'utf8')
    ])

    const traditionsData = JSON.parse(traditionsRaw)
    for (const item of traditionsData.traditions || []) {
      if (this.traditionsMap.has(item.id)) throw new Error(`Duplicate tradition ID: ${item.id}`)
      this.traditionsMap.set(item.id, item)
    }

    const worksData = JSON.parse(worksRaw)
    for (const item of worksData.works || []) {
      if (this.worksMap.has(item.id)) throw new Error(`Duplicate work ID: ${item.id}`)
      this.worksMap.set(item.id, item)
    }

    const editionsData = JSON.parse(editionsRaw)
    for (const item of editionsData.editions || []) {
      if (this.editionsMap.has(item.id)) throw new Error(`Duplicate edition ID: ${item.id}`)
      this.editionsMap.set(item.id, item)
    }

    const sourcesData = JSON.parse(sourcesRaw)
    for (const item of sourcesData.sources || []) {
      if (this.sourcesMap.has(item.id)) throw new Error(`Duplicate source ID: ${item.id}`)
      this.sourcesMap.set(item.id, item)
    }

    const endpointsData = JSON.parse(endpointsRaw)
    for (const item of endpointsData.endpoints || []) {
      if (this.endpointsMap.has(item.id)) throw new Error(`Duplicate endpoint ID: ${item.id}`)
      this.endpointsMap.set(item.id, item)
    }

    this.loaded = true
    return this
  }

  resolveTradition(id: string): TraditionRecord {
    const item = this.traditionsMap.get(id)
    if (!item) throw new Error(`Unknown tradition: ${id}`)
    return item
  }

  resolveWork(id: string): WorkRecord {
    const item = this.worksMap.get(id)
    if (!item) throw new Error(`Unknown work: ${id}`)
    return item
  }

  resolveEdition(id: string): EditionRecord {
    const item = this.editionsMap.get(id)
    if (!item) throw new Error(`Unknown edition: ${id}`)
    return item
  }

  resolveSource(id: string): SourceRecord {
    const item = this.sourcesMap.get(id)
    if (!item) throw new Error(`Unknown source: ${id}`)
    return item
  }

  resolveEndpoint(id: string): EndpointRecord {
    const item = this.endpointsMap.get(id)
    if (!item) throw new Error(`Unknown endpoint: ${id}`)
    return item
  }

  resolveTraditionWorks(traditionId: string): WorkRecord[] {
    this.resolveTradition(traditionId)
    return [...this.worksMap.values()].filter(w => w.traditionId === traditionId)
  }

  resolveWorkEditions(workId: string): EditionRecord[] {
    this.resolveWork(workId)
    return [...this.editionsMap.values()].filter(e => e.workId === workId)
  }

  resolveWorkEndpoints(workId: string): EndpointRecord[] {
    this.resolveWork(workId)
    return [...this.endpointsMap.values()].filter(ep => ep.workId === workId)
  }

  resolveSourceEndpoints(sourceId: string): EndpointRecord[] {
    this.resolveSource(sourceId)
    return [...this.endpointsMap.values()].filter(ep => ep.sourceId === sourceId)
  }

  resolveWorkSources(workId: string): SourceRecord[] {
    const endpoints = this.resolveWorkEndpoints(workId)
    const sourceIds = new Set(endpoints.map(ep => ep.sourceId))
    return [...sourceIds].map(id => this.resolveSource(id))
  }

  getTraditions(): TraditionRecord[] {
    return [...this.traditionsMap.values()]
  }

  getWorks(): WorkRecord[] {
    return [...this.worksMap.values()]
  }

  getEditions(): EditionRecord[] {
    return [...this.editionsMap.values()]
  }

  getSources(): SourceRecord[] {
    return [...this.sourcesMap.values()]
  }

  getEndpoints(): EndpointRecord[] {
    return [...this.endpointsMap.values()]
  }

  validateRegistry(): {
    valid: boolean
    traditionCount: number
    workCount: number
    editionCount: number
    sourceCount: number
    endpointCount: number
    problems: string[]
  } {
    const problems: string[] = []

    // 1. Verify works point to valid traditions
    for (const work of this.worksMap.values()) {
      if (!this.traditionsMap.has(work.traditionId)) {
        problems.push(`Work '${work.id}' references non-existent tradition '${work.traditionId}'`)
      }
    }

    // 2. Verify editions point to valid works
    for (const edition of this.editionsMap.values()) {
      if (!this.worksMap.has(edition.workId)) {
        problems.push(`Edition '${edition.id}' references non-existent work '${edition.workId}'`)
      }
    }

    // 3. Verify endpoints point to valid sources and works
    for (const ep of this.endpointsMap.values()) {
      if (!this.sourcesMap.has(ep.sourceId)) {
        problems.push(`Endpoint '${ep.id}' references non-existent source '${ep.sourceId}'`)
      }
      if (!this.worksMap.has(ep.workId)) {
        problems.push(`Endpoint '${ep.id}' references non-existent work '${ep.workId}'`)
      }
      if (ep.editionId && !this.editionsMap.has(ep.editionId)) {
        problems.push(`Endpoint '${ep.id}' references non-existent edition '${ep.editionId}'`)
      }
    }

    return {
      valid: problems.length === 0,
      traditionCount: this.traditionsMap.size,
      workCount: this.worksMap.size,
      editionCount: this.editionsMap.size,
      sourceCount: this.sourcesMap.size,
      endpointCount: this.endpointsMap.size,
      problems
    }
  }

  generateWorkCoverageReport(): WorkCoverageReport {
    const works = this.getWorks()
    const traditions = this.getTraditions()
    let worksWithUpstream = 0

    const traditionBreakdown = traditions.map((t) => {
      const tWorks = this.resolveTraditionWorks(t.id)
      let tWorksWithUpstream = 0
      for (const w of tWorks) {
        const eps = this.resolveWorkEndpoints(w.id)
        if (eps.length > 0) {
          tWorksWithUpstream++
          worksWithUpstream++
        }
      }
      const tCoverage = tWorks.length > 0 ? Number(((tWorksWithUpstream / tWorks.length) * 100).toFixed(2)) : 0
      return {
        traditionId: t.id,
        traditionName: t.name,
        workCount: tWorks.length,
        worksWithUpstream: tWorksWithUpstream,
        coveragePercent: tCoverage
      }
    })

    const coveragePercent = works.length > 0
      ? Number(((worksWithUpstream / works.length) * 100).toFixed(2))
      : 0

    return {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      traditions: traditions.length,
      works: works.length,
      editions: this.editionsMap.size,
      sources: this.sourcesMap.size,
      endpoints: this.endpointsMap.size,
      worksWithUpstream,
      worksWithoutUpstream: works.length - worksWithUpstream,
      coveragePercent,
      traditionBreakdown
    }
  }

  async writeWorkCoverageReport(outDir: string = path.join(process.cwd(), 'dist')): Promise<string> {
    await mkdir(outDir, { recursive: true })
    const report = this.generateWorkCoverageReport()
    const targetFile = path.join(outDir, 'work-coverage.json')
    await writeFile(targetFile, JSON.stringify(report, null, 2) + '\n', 'utf8')
    return targetFile
  }
}
