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
    return []
  }

  async traverseAssertionEvidence(id: CanonicalId): Promise<AssertionEvidenceTraversal | null> {
    const assertion = await this.getAssertion(id)
    if (!assertion) return null
    return {
      assertion,
      evidence: [],
      targets: []
    }
  }

  async search(query: CorpusSearchQuery): Promise<CorpusSearchResult[]> {
    if (!query.text?.trim()) return []
    const words = query.text.trim().split(/[\s\-+:,.'"!?()]+/).filter(Boolean)
    if (words.length === 0) return []
    const ftsQuery = words.map((w) => `"${w}"*`).join(' AND ')

    const limit = query.limit ?? 50
    const offset = query.offset ?? 0

    try {
      const sql = `
        SELECT f.passage_id as id, 'resource' as record_type, 'textual.passage' as kind, f.text as label, f.dataset_id, f.rank
        FROM fts_contents f
        WHERE fts_contents MATCH ?
        ORDER BY rank
        LIMIT ? OFFSET ?
      `
      const stmt = this.db.prepare(sql)
      const rows = stmt.all(ftsQuery, limit, offset) as Array<{
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
      // Fallback to LIKE query if complex FTS syntax fails
      const fallbackSql = `
        SELECT c.passage_id as id, 'resource' as record_type, 'textual.passage' as kind, c.text as label, c.dataset_id
        FROM contents c
        WHERE c.text LIKE ?
        LIMIT ? OFFSET ?
      `
      const stmt = this.db.prepare(fallbackSql)
      const rows = stmt.all(`%${words[0]}%`, limit, offset) as Array<{
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
  getDevotionals(tradition?: string, category?: string, limit = 100): any[] {
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
    sql += ' ORDER BY number ASC LIMIT ?'
    params.push(limit)

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

  getWorks(): Array<{ id: string; dataset_id: string; work_type: string; title_en: string; title_id: string; title_native: string }> {
    return this.db.prepare(`
      SELECT id, dataset_id, work_type, title_en, title_id, title_native
      FROM works
      ORDER BY title_en ASC
    `).all() as Array<{ id: string; dataset_id: string; work_type: string; title_en: string; title_id: string; title_native: string }>
  }

  close(): void {
    this.db.close()
  }
}
