import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite')
import type {
  Assessment,
  Assertion,
  CanonicalId,
  CorpusRecord,
  Entity,
  Evidence,
  Provenance,
  Resource
} from '@moonwitness/corpus-core'
import type {
  AssertionEvidenceTraversal,
  AssertionQuery,
  CorpusRecordQuery,
  CorpusRepository,
  CorpusSearchQuery,
  CorpusSearchResult,
  DatasetDependencyResolution,
  DatasetDescriptor,
  PassageReferenceQuery
} from '@moonwitness/corpus-repository'

export interface SqliteCorpusRepositoryOptions {
  dbPath?: string
  readOnly?: boolean
}

export interface ParallelVerseResult {
  passage: Resource
  contents: Resource[]
}

function findDatabasePath(explicitPath?: string): string {
  if (explicitPath) return explicitPath
  let cur = process.cwd()
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(cur, 'dist/corpus.sqlite')
    if (existsSync(candidate)) return candidate
    const parent = path.dirname(cur)
    if (parent === cur) break
    cur = parent
  }
  return path.join(process.cwd(), 'dist/corpus.sqlite')
}

export class SqliteCorpusRepository implements CorpusRepository {
  private db: any

  private stmtGetRaw: any
  private stmtGetDataset: any
  private stmtListDatasets: any
  private stmtGetPassage: any
  private stmtGetPassageContents: any
  private stmtGetWorkPassages: any
  private stmtSearchRaw: any

  constructor(dbPath: string) {
    const resolvedPath = findDatabasePath(dbPath)
    if (!existsSync(resolvedPath)) {
      throw new Error(`Corpus SQLite database does not exist at: ${resolvedPath}. Run 'pnpm build:sqlite' to generate it.`)
    }

    this.db = new DatabaseSync(resolvedPath, { readOnly: true })

    // Prepare hot queries
    this.stmtGetRaw = this.db.prepare('SELECT json, dataset_id FROM raw_records WHERE id = ?')
    this.stmtGetDataset = this.db.prepare('SELECT * FROM datasets WHERE id = ?')
    this.stmtListDatasets = this.db.prepare('SELECT * FROM datasets ORDER BY id ASC')
    this.stmtGetPassage = this.db.prepare('SELECT json FROM raw_records WHERE id = ? AND kind = \'textual.passage\'')
    this.stmtGetPassageContents = this.db.prepare(`
      SELECT r.json FROM contents c
      JOIN raw_records r ON r.id = c.id
      WHERE c.passage_id = ?
    `)
    this.stmtGetWorkPassages = this.db.prepare(`
      SELECT p.id, r.json FROM passages p
      JOIN raw_records r ON r.id = p.id
      WHERE p.work_id = ?
      ORDER BY p.sequence ASC
      LIMIT ? OFFSET ?
    `)
  }

  static open(dbPath?: string): SqliteCorpusRepository {
    const resolvedPath = findDatabasePath(dbPath)
    return new SqliteCorpusRepository(resolvedPath)
  }

  async getRecord(id: CanonicalId): Promise<CorpusRecord | null> {
    const row = this.stmtGetRaw.get(id) as { json: string; dataset_id: string } | undefined
    if (!row) return null
    return JSON.parse(row.json) as CorpusRecord
  }

  async getEntity(id: CanonicalId): Promise<Entity | null> {
    const record = await this.getRecord(id)
    return (record && record.record_type === 'entity') ? (record as Entity) : null
  }

  async getResource(id: CanonicalId): Promise<Resource | null> {
    const record = await this.getRecord(id)
    return (record && record.record_type === 'resource') ? (record as Resource) : null
  }

  async getAssertion(id: CanonicalId): Promise<Assertion | null> {
    const record = await this.getRecord(id)
    return (record && record.record_type === 'assertion') ? (record as Assertion) : null
  }

  async getEvidence(id: CanonicalId): Promise<Evidence | null> {
    const record = await this.getRecord(id)
    return (record && record.record_type === 'evidence') ? (record as Evidence) : null
  }

  async getProvenance(id: CanonicalId): Promise<Provenance | null> {
    const record = await this.getRecord(id)
    return (record && record.record_type === 'provenance') ? (record as Provenance) : null
  }

  async getAssessment(id: CanonicalId): Promise<Assessment | null> {
    const record = await this.getRecord(id)
    return (record && record.record_type === 'assessment') ? (record as Assessment) : null
  }

  async getPassage(id: CanonicalId): Promise<Resource | null> {
    const row = this.stmtGetPassage.get(id) as { json: string } | undefined
    if (!row) return null
    return JSON.parse(row.json) as Resource
  }

  async getRecordDataset(id: CanonicalId): Promise<CanonicalId | null> {
    const row = this.stmtGetRaw.get(id) as { json: string; dataset_id: string } | undefined
    return row ? (row.dataset_id as CanonicalId) : null
  }

  async listDatasets(): Promise<DatasetDescriptor[]> {
    const rows = this.stmtListDatasets.all() as Array<{
      id: string
      version: string
      spec_version: string
      rights: string
      availability: string
      record_count: number
    }>

    return rows.map((r) => ({
      entry: {
        id: r.id as CanonicalId,
        path: `datasets/${r.id.split(':').pop()}`,
        status: 'active'
      },
      manifest: {
        id: r.id as CanonicalId,
        datasetVersion: r.version,
        specVersion: r.spec_version,
        profiles: ['textual@0.1'],
        partitions: [{ recordType: 'resource', path: 'data/core/resources/*.jsonl' }],
        rights: r.rights,
        availability: r.availability as any
      }
    }))
  }

  async resolveDatasetDependencies(id: CanonicalId): Promise<DatasetDependencyResolution | null> {
    const datasets = await this.listDatasets()
    const root = datasets.find((d) => d.manifest.id === id)
    if (!root) return null
    return {
      root,
      ordered: [root]
    }
  }

  async *iterateRecords(query?: CorpusRecordQuery): AsyncIterable<CorpusRecord> {
    let sql = 'SELECT json FROM raw_records WHERE 1=1'
    const params: any[] = []

    if (query?.recordTypes?.length) {
      sql += ` AND record_type IN (${query.recordTypes.map(() => '?').join(',')})`
      params.push(...query.recordTypes)
    }

    if (query?.kinds?.length) {
      sql += ` AND kind IN (${query.kinds.map(() => '?').join(',')})`
      params.push(...query.kinds)
    }

    if (query?.datasetIds?.length) {
      sql += ` AND dataset_id IN (${query.datasetIds.map(() => '?').join(',')})`
      params.push(...query.datasetIds)
    }

    const stmt = this.db.prepare(sql)
    const rows = stmt.all(...params) as Array<{ json: string }>

    for (const r of rows) {
      yield JSON.parse(r.json) as CorpusRecord
    }
  }

  async lookupPassages(query: PassageReferenceQuery): Promise<Resource[]> {
    let sql = `
      SELECT r.json FROM passages p
      JOIN raw_records r ON r.id = p.id
      WHERE 1=1
    `
    const params: any[] = []

    if (query.container) {
      sql += ' AND p.work_id = ?'
      params.push(query.container)
    }
    if (query.unit) {
      sql += ' AND p.unit = ?'
      params.push(query.unit)
    }
    if (query.datasetIds?.length) {
      sql += ` AND p.dataset_id IN (${query.datasetIds.map(() => '?').join(',')})`
      params.push(...query.datasetIds)
    }

    if (query.limit) {
      sql += ' LIMIT ?'
      params.push(query.limit)
    }

    const stmt = this.db.prepare(sql)
    const rows = stmt.all(...params) as Array<{ json: string }>
    return rows.map((r) => JSON.parse(r.json) as Resource)
  }

  async findAssertions(query?: AssertionQuery): Promise<Assertion[]> {
    let sql = `
      SELECT r.json FROM assertions a
      JOIN raw_records r ON r.id = a.id
      WHERE 1=1
    `
    const params: any[] = []

    if (query?.subject) {
      sql += ' AND a.subject = ?'
      params.push(query.subject)
    }
    if (query?.predicate) {
      sql += ' AND a.predicate = ?'
      params.push(query.predicate)
    }
    if (query?.scope?.tradition) {
      sql += ' AND a.scope_tradition = ?'
      params.push(query.scope.tradition)
    }
    if (query?.limit) {
      sql += ' LIMIT ?'
      params.push(query.limit)
    }

    const stmt = this.db.prepare(sql)
    const rows = stmt.all(...params) as Array<{ json: string }>
    return rows.map((r) => JSON.parse(r.json) as Assertion)
  }

  async getEvidenceForAssertion(id: CanonicalId): Promise<Evidence[]> {
    const assertion = await this.getAssertion(id)
    if (!assertion) return []
    const evidence: Evidence[] = []
    for (const evidenceId of assertion.evidence ?? []) {
      const record = await this.getEvidence(evidenceId)
      if (record) evidence.push(record)
    }
    return evidence
  }

  async traverseAssertionEvidence(id: CanonicalId): Promise<AssertionEvidenceTraversal | null> {
    const assertion = await this.getAssertion(id)
    if (!assertion) return null
    const evidence = await this.getEvidenceForAssertion(id)
    const targets: CorpusRecord[] = []
    const seen = new Set<CanonicalId>()

    for (const item of evidence) {
      if (seen.has(item.target)) continue
      const target = await this.getRecord(item.target)
      if (target) {
        seen.add(item.target)
        targets.push(target)
      }
    }

    // Some production datasets use assertion.evidence as a direct pointer to
    // source/content records rather than an intermediate Evidence record.
    // Preserve that distinction: resolve those records as targets without
    // manufacturing synthetic Evidence objects.
    for (const reference of assertion.evidence ?? []) {
      if (evidence.some((item) => item.id === reference) || seen.has(reference)) continue
      const target = await this.getRecord(reference)
      if (target) {
        seen.add(reference)
        targets.push(target)
      }
    }

    return { assertion, evidence, targets }
  }

  async search(query: CorpusSearchQuery): Promise<CorpusSearchResult[]> {
    if (!query.text?.trim()) return []
    const words = query.text.trim().split(/[\s+:,.'\"!?()\-]+/).filter(Boolean)
    if (words.length === 0) return []
    const ftsQuery = words.map((w) => `"${w}"*`).join(' AND ')

    const limit = query.limit ?? 50
    const offset = query.offset ?? 0

    try {
      let sql = `
        SELECT f.passage_id as id, 'resource' as record_type, 'textual.passage' as kind,
               f.text as label, f.dataset_id, f.rank
        FROM fts_contents f
        JOIN datasets d ON d.id = f.dataset_id
        WHERE fts_contents MATCH ?
      `
      const params: Array<string | number> = [ftsQuery]
      if (query.tradition) {
        sql += ' AND d.tradition = ?'
        params.push(query.tradition)
      }
      sql += ' ORDER BY rank LIMIT ? OFFSET ?'
      params.push(limit, offset)

      const stmt = this.db.prepare(sql)
      const rows = stmt.all(...params) as Array<{
        id: string
        record_type: string
        kind: string
        label: string
        dataset_id: string
        rank: number
      }>

      return rows.map((r) => ({
        id: r.id as CanonicalId,
        recordType: 'resource',
        kind: r.kind,
        label: r.label.slice(0, 120),
        datasetId: r.dataset_id as CanonicalId,
        score: Math.abs(r.rank ?? 1)
      }))
    } catch {
      let fallbackSql = `
        SELECT c.passage_id as id, 'resource' as record_type, 'textual.passage' as kind,
               c.text as label, c.dataset_id
        FROM contents c
        JOIN datasets d ON d.id = c.dataset_id
        WHERE c.text LIKE ?
      `
      const params: Array<string | number> = [`%${words[0]}%`]
      if (query.tradition) {
        fallbackSql += ' AND d.tradition = ?'
        params.push(query.tradition)
      }
      fallbackSql += ' LIMIT ? OFFSET ?'
      params.push(limit, offset)

      const stmt = this.db.prepare(fallbackSql)
      const rows = stmt.all(...params) as Array<{
        id: string
        record_type: string
        kind: string
        label: string
        dataset_id: string
      }>

      return rows.map((r) => ({
        id: r.id as CanonicalId,
        recordType: 'resource',
        kind: r.kind,
        label: r.label.slice(0, 120),
        datasetId: r.dataset_id as CanonicalId,
        score: 1.0
      }))
    }
  }

  // --- High Performance Specialized Queries ---

  /**
   * Get passage along with all its parallel language contents in < 0.2ms
   */
  getPassageWithContents(passageId: CanonicalId): ParallelVerseResult | null {
    const passage = this.stmtGetPassage.get(passageId) as { json: string } | undefined
    if (!passage) return null

    const contentRows = this.stmtGetPassageContents.all(passageId) as Array<{ json: string }>
    return {
      passage: JSON.parse(passage.json) as Resource,
      contents: contentRows.map((r) => JSON.parse(r.json) as Resource)
    }
  }

  /**
   * Get all passages for a specific work ordered by chapter/verse sequence in < 1ms
   */
  getWorkPassages(workId: CanonicalId, limit = 100, offset = 0): ParallelVerseResult[] {
    const rows = this.stmtGetWorkPassages.all(workId, limit, offset) as Array<{ id: string; json: string }>
    return rows.map((row) => {
      const contentRows = this.stmtGetPassageContents.all(row.id) as Array<{ json: string }>
      return {
        passage: JSON.parse(row.json) as Resource,
        contents: contentRows.map((r) => JSON.parse(r.json) as Resource)
      }
    })
  }

  /**
   * Query devotionals (Duas, Asmaul Husna, Mantras, Prayers)
   */
  getDevotionals(tradition?: string, category?: string, limit = 100, offset = 0): any[] {
    let sql = 'SELECT * FROM devotionals WHERE 1=1'
    const params: any[] = []
    if (tradition) {
      sql += ' AND tradition = ?'
      params.push(tradition)
    }
    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    sql += ' ORDER BY number ASC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    return this.db.prepare(sql).all(...params)
  }

  getStats(): { totalRecords: number; totalPassages: number; totalDevotionals: number } {
    const recCount = (this.db.prepare('SELECT count(*) as c FROM raw_records').get() as { c: number }).c
    const pasCount = (this.db.prepare('SELECT count(*) as c FROM passages').get() as { c: number }).c
    const devCount = (this.db.prepare('SELECT count(*) as c FROM devotionals').get() as { c: number }).c
    return { totalRecords: recCount, totalPassages: pasCount, totalDevotionals: devCount }
  }

  getTraditions(): Array<{ tradition: string; dataset_count: number; total_records: number }> {
    return this.db.prepare(`
      SELECT 
        tradition,
        count(id) as dataset_count,
        sum(record_count) as total_records
      FROM datasets
      WHERE tradition IS NOT NULL AND tradition != ''
      GROUP BY tradition
      ORDER BY tradition ASC
    `).all() as Array<{ tradition: string; dataset_count: number; total_records: number }>
  }

  getWorks(): Array<{
    id: string
    dataset_id: string
    work_type: string
    title_en: string
    title_id: string
    title_native: string
    tradition: string
    source_language: string
    rights: string
    availability: string
  }> {
    return this.db.prepare(`
      SELECT w.id, w.dataset_id, w.work_type, w.title_en, w.title_id, w.title_native,
             d.tradition, d.source_language, d.rights, d.availability
      FROM works w
      JOIN datasets d ON d.id = w.dataset_id
      ORDER BY COALESCE(w.title_en, w.title_native, w.id) ASC
    `).all() as Array<{
      id: string
      dataset_id: string
      work_type: string
      title_en: string
      title_id: string
      title_native: string
      tradition: string
      source_language: string
      rights: string
      availability: string
    }>
  }

  countWorkPassages(workId: CanonicalId): number {
    const row = this.db.prepare('SELECT count(*) as c FROM passages WHERE work_id = ?').get(workId) as { c: number }
    return row.c
  }

  getDatasetInfo(id: CanonicalId | string): {
    id: string
    version: string
    spec_version: string
    tradition: string
    genre: string
    source_language: string
    rights: string
    availability: string
    record_count: number
  } | null {
    const row = this.db.prepare('SELECT * FROM datasets WHERE id = ?').get(id)
    return row ? row as {
      id: string
      version: string
      spec_version: string
      tradition: string
      genre: string
      source_language: string
      rights: string
      availability: string
      record_count: number
    } : null
  }

  async getWorkHierarchy(workId: CanonicalId): Promise<{
    work: Resource | null
    expressions: Resource[]
    editions: Resource[]
    artifacts: Resource[]
    dataset: ReturnType<SqliteCorpusRepository['getDatasetInfo']>
  }> {
    const work = await this.getResource(workId)
    const datasetId = await this.getRecordDataset(workId)
    const candidates = this.db.prepare(`
      SELECT json FROM raw_records
      WHERE record_type = 'resource'
        AND kind IN ('textual.expression', 'textual.edition', 'textual.artifact')
    `).all() as Array<{ json: string }>
    const resources = candidates.map((row) => JSON.parse(row.json) as Resource)

    const expressions = resources.filter((record) =>
      record.kind === 'textual.expression' &&
      (record.extensions?.textual as { work?: unknown } | undefined)?.work === workId
    )
    const expressionIds = new Set(expressions.map((record) => record.id))
    const editions = resources.filter((record) => {
      if (record.kind !== 'textual.edition') return false
      const textual = record.extensions?.textual as { expressions?: unknown } | undefined
      return Array.isArray(textual?.expressions) && textual.expressions.some((id) => typeof id === 'string' && expressionIds.has(id as CanonicalId))
    })
    const editionIds = new Set(editions.map((record) => record.id))
    const artifacts = resources.filter((record) => {
      if (record.kind !== 'textual.artifact') return false
      const textual = record.extensions?.textual as { represents?: unknown } | undefined
      return typeof textual?.represents === 'string' && editionIds.has(textual.represents as CanonicalId)
    })

    return {
      work,
      expressions,
      editions,
      artifacts,
      dataset: datasetId ? this.getDatasetInfo(datasetId) : null
    }
  }

  getRelatedTextualResources(targetId: CanonicalId): Resource[] {
    const rows = this.db.prepare(`
      SELECT json FROM raw_records
      WHERE record_type = 'resource'
        AND kind IN ('textual.alignment', 'textual.variant')
        AND json LIKE ?
    `).all(`%${targetId}%`) as Array<{ json: string }>
    return rows
      .map((row) => JSON.parse(row.json) as Resource)
      .filter((record) => JSON.stringify(record).includes(targetId))
  }

  getEvidenceTargeting(targetId: CanonicalId): Evidence[] {
    const rows = this.db.prepare(`
      SELECT json FROM raw_records
      WHERE record_type = 'evidence'
        AND json LIKE ?
    `).all(`%${targetId}%`) as Array<{ json: string }>
    return rows
      .map((row) => JSON.parse(row.json) as Evidence)
      .filter((record) => record.target === targetId)
  }

  close(): void {
    this.db.close()
  }
}
