import { createDbWorker, type WorkerHttpvfs } from "sql.js-httpvfs"
import type {
  AssertionTraversal,
  ContentLane,
  CorpusResource,
  DatasetInfo,
  EvidenceRecord,
  Passage,
  PassageTrace,
  ProvenanceRecord,
  SearchRecord,
  WorkHierarchy,
} from "./data"

const CONFIG_URL = "/corpus-db/config.json"
const WORKER_URL = "/vendor/sqlite-httpvfs/sqlite.worker.js"
const WASM_URL = "/vendor/sqlite-httpvfs/sql-wasm.wasm"

let workerPromise: Promise<WorkerHttpvfs> | undefined

function worker() {
  if (!workerPromise) {
    workerPromise = createDbWorker(
      [{ from: "jsonconfig", configUrl: CONFIG_URL }],
      WORKER_URL,
      WASM_URL,
    )
  }
  return workerPromise
}

function tokenize(query: string) {
  return query
    .normalize("NFKC")
    .trim()
    .split(/[^\p{L}\p{N}]+/u)
    .map((term) => term.replace(/[\x00-\x1f"'*:^(){}\[\]-]+/g, ""))
    .filter(Boolean)
}

function ftsQuery(query: string) {
  return tokenize(query).map((term) => term + "*").join(" AND ")
}

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try { return JSON.parse(value) as T } catch { return null }
}

function placeholders(values: unknown[]) {
  return values.map(() => "?").join(",")
}

type PassageRow = {
  id: string
  dataset_id: string
  work_id: string
  sequence: number
  unit: string
  label: string | null
  labels_json: string | null
}

type ContentRow = {
  rowid: number
  content_id: string
  passage_id: string
  dataset_id: string
  language: string
  script: string | null
  representation: string
  artifact: string | null
  provenance: string | null
  text: string
}

type DatasetRow = {
  id: string
  tradition: string | null
  version: string | null
  spec_version: string | null
  rights: string | null
  availability: string | null
  record_count: number
}

type SearchRow = {
  id: string
  work_id: string
  title: string | null
  dataset_id: string
  tradition: string | null
  language: string
  snippet: string
}

type JsonRow = { json: string }
type EvidenceRow = {
  id: string
  target: string | null
  relation: string | null
  provenance: string | null
  json: string
}

function passageFromRow(row: PassageRow): Passage {
  return {
    id: row.id,
    workId: row.work_id,
    locator: row.label ?? row.id,
    label: row.label ?? row.id,
    source: row.dataset_id,
    provenance: "Resolved from the immutable browser corpus database.",
    note: row.unit ? row.unit + " · sequence " + row.sequence : undefined,
    contents: [],
  }
}

function passageResource(row: PassageRow): CorpusResource {
  return {
    id: row.id,
    record_type: "resource",
    kind: "textual.passage",
    labels: parseJson<CorpusResource["labels"]>(row.labels_json) ?? (row.label ? [{ value: row.label, role: "preferred" }] : undefined),
    extensions: {
      textual: {
        unit: row.unit,
        sequence: row.sequence,
        container: row.work_id,
      },
    },
  }
}

function contentFromRow(row: ContentRow): ContentLane {
  return {
    id: row.content_id,
    language: row.language,
    script: row.script ?? undefined,
    representation: row.representation,
    text: row.text,
    artifact: row.artifact ?? undefined,
    provenance: row.provenance ?? undefined,
  }
}

function contentResource(row: ContentRow): CorpusResource {
  return {
    id: row.content_id,
    record_type: "resource",
    kind: "textual.content",
    extensions: {
      source: {
        artifact: row.artifact ?? undefined,
        provenance: row.provenance ?? undefined,
      },
      textual: {
        target: row.passage_id,
        language: row.language,
        script: row.script ?? undefined,
        representation: row.representation,
        text: row.text,
      },
    },
  }
}

function datasetFromRow(row: DatasetRow | undefined): DatasetInfo | null {
  if (!row) return null
  return {
    id: row.id,
    version: row.version ?? undefined,
    specVersion: row.spec_version ?? undefined,
    tradition: row.tradition ?? undefined,
    rights: row.rights ?? undefined,
    availability: row.availability ?? undefined,
    recordCount: row.record_count,
  }
}

async function datasetById(id: string | undefined) {
  if (!id) return null
  const handle = await worker()
  const rows = await handle.db.query(
    "SELECT id, tradition, version, spec_version, rights, availability, record_count FROM datasets WHERE id = ? LIMIT 1",
    id,
  ) as unknown as DatasetRow[]
  return datasetFromRow(rows[0])
}

async function jsonRows(sql: string, ...params: Array<string | number>) {
  const handle = await worker()
  return await handle.db.query(sql, ...params) as unknown as JsonRow[]
}

async function contentRowById(id: string) {
  const handle = await worker()
  const rows = await handle.db.query(
    `SELECT m.rowid, m.content_id, m.passage_id, m.dataset_id, m.language, m.script,
            m.representation, m.artifact, m.provenance, f.text
     FROM search_meta m
     JOIN fts_contents f ON f.docid = m.rowid
     WHERE m.content_id = ?
     LIMIT 1`,
    id,
  ) as unknown as ContentRow[]
  return rows[0]
}

async function resolveRecord(id: string): Promise<Record<string, unknown> | null> {
  const handle = await worker()

  const content = await contentRowById(id)
  if (content) return contentResource(content)

  const passages = await handle.db.query(
    "SELECT id, dataset_id, work_id, sequence, unit, label, labels_json FROM passages WHERE id = ? LIMIT 1",
    id,
  ) as unknown as PassageRow[]
  if (passages[0]) return passageResource(passages[0])

  for (const table of ["works", "expressions", "editions", "artifacts", "relations", "assertions", "evidence", "provenance"]) {
    const rows = await jsonRows("SELECT json FROM " + table + " WHERE id = ? LIMIT 1", id)
    const record = parseJson<Record<string, unknown>>(rows[0]?.json)
    if (record) return record
  }
  return null
}

export async function browserDbStats() {
  const handle = await worker()
  const [datasetRows, passageRows, contentRows, evidenceRows, relationRows, assertionRows] = await Promise.all([
    handle.db.query("SELECT sum(record_count) AS total_records, count(*) AS datasets FROM datasets") as unknown as Promise<Array<{ total_records: number; datasets: number }>>,
    handle.db.query("SELECT count(*) AS passages FROM passages") as unknown as Promise<Array<{ passages: number }>>,
    handle.db.query("SELECT count(*) AS contents FROM search_meta") as unknown as Promise<Array<{ contents: number }>>,
    handle.db.query("SELECT count(*) AS evidence FROM evidence") as unknown as Promise<Array<{ evidence: number }>>,
    handle.db.query("SELECT count(*) AS relations FROM relations") as unknown as Promise<Array<{ relations: number }>>,
    handle.db.query("SELECT count(*) AS assertions FROM assertions") as unknown as Promise<Array<{ assertions: number }>>,
  ])
  const stats = await handle.worker.getStats()
  return {
    totalRecords: datasetRows[0]?.total_records ?? 0,
    datasetCount: datasetRows[0]?.datasets ?? 0,
    passages: passageRows[0]?.passages ?? 0,
    contents: contentRows[0]?.contents ?? 0,
    evidence: evidenceRows[0]?.evidence ?? 0,
    relations: relationRows[0]?.relations ?? 0,
    assertions: assertionRows[0]?.assertions ?? 0,
    bytesFetched: stats?.totalFetchedBytes ?? 0,
    databaseBytes: stats?.totalBytes ?? 0,
  }
}

export async function browserSearchCorpus(
  query: string,
  tradition: string | undefined,
  offset: number,
  limit: number,
): Promise<{ data: SearchRecord[]; hasMore: boolean }> {
  const match = ftsQuery(query)
  if (!match) return { data: [], hasMore: false }
  const handle = await worker()
  const params: Array<string | number> = [match]
  let traditionClause = ""
  if (tradition) {
    traditionClause = " AND d.tradition = ?"
    params.push(tradition)
  }
  params.push(limit + 1, offset)
  const rows = await handle.db.query(
    `SELECT
       m.passage_id AS id,
       p.work_id AS work_id,
       p.label AS title,
       m.dataset_id AS dataset_id,
       d.tradition AS tradition,
       m.language AS language,
       substr(f.text, 1, 360) AS snippet
     FROM fts_contents f
     JOIN search_meta m ON m.rowid = f.docid
     JOIN passages p ON p.id = m.passage_id
     JOIN datasets d ON d.id = m.dataset_id
     WHERE f.text MATCH ?${traditionClause}
     ORDER BY f.docid
     LIMIT ? OFFSET ?`,
    ...params,
  ) as unknown as SearchRow[]

  const page = rows.slice(0, limit)
  return {
    hasMore: rows.length > limit,
    data: page.map((row) => ({
      id: row.id,
      title: row.title ?? row.id,
      kind: "textual.passage",
      recordType: "resource",
      tradition: row.tradition ?? undefined,
      language: row.language,
      snippet: row.snippet,
      source: row.dataset_id,
      datasetId: row.dataset_id,
      workId: row.work_id,
    })),
  }
}

export async function browserLoadPassages(
  workId: string,
  offset: number,
  limit: number,
): Promise<{ data: Passage[]; total: number; hasMore: boolean }> {
  const handle = await worker()
  const [rows, count] = await Promise.all([
    handle.db.query(
      "SELECT id, dataset_id, work_id, sequence, unit, label, labels_json FROM passages WHERE work_id = ? ORDER BY sequence ASC LIMIT ? OFFSET ?",
      workId,
      limit + 1,
      offset,
    ) as unknown as Promise<PassageRow[]>,
    handle.db.query(
      "SELECT count(*) AS total FROM passages WHERE work_id = ?",
      workId,
    ) as unknown as Promise<Array<{ total: number }>>,
  ])
  return {
    data: rows.slice(0, limit).map(passageFromRow),
    total: count[0]?.total ?? rows.length,
    hasMore: rows.length > limit,
  }
}

export async function browserLoadPassage(passageId: string): Promise<Passage | null> {
  const handle = await worker()
  const rows = await handle.db.query(
    "SELECT id, dataset_id, work_id, sequence, unit, label, labels_json FROM passages WHERE id = ? LIMIT 1",
    passageId,
  ) as unknown as PassageRow[]
  return rows[0] ? passageFromRow(rows[0]) : null
}

export async function browserLoadWorkHierarchy(workId: string): Promise<WorkHierarchy | null> {
  const handle = await worker()
  const workRows = await jsonRows("SELECT json FROM works WHERE id = ? LIMIT 1", workId)
  const work = parseJson<CorpusResource>(workRows[0]?.json)
  if (!work) return null

  const expressionRows = await jsonRows("SELECT json FROM expressions WHERE work_id = ? ORDER BY id", workId)
  const expressions = expressionRows.map((row) => parseJson<CorpusResource>(row.json)).filter((row): row is CorpusResource => Boolean(row))
  const expressionIds = expressions.map((item) => item.id)

  let editions: CorpusResource[] = []
  if (expressionIds.length) {
    const rows = await jsonRows(
      "SELECT DISTINCT e.json FROM editions e JOIN edition_expressions x ON x.edition_id = e.id WHERE x.expression_id IN (" + placeholders(expressionIds) + ") ORDER BY e.id",
      ...expressionIds,
    )
    editions = rows.map((row) => parseJson<CorpusResource>(row.json)).filter((row): row is CorpusResource => Boolean(row))
  }

  const editionIds = editions.map((item) => item.id)
  let artifacts: CorpusResource[] = []
  if (editionIds.length) {
    const rows = await jsonRows(
      "SELECT json FROM artifacts WHERE represents IN (" + placeholders(editionIds) + ") ORDER BY id",
      ...editionIds,
    )
    artifacts = rows.map((row) => parseJson<CorpusResource>(row.json)).filter((row): row is CorpusResource => Boolean(row))
  }

  const datasetRows = await handle.db.query(
    "SELECT d.id, d.tradition, d.version, d.spec_version, d.rights, d.availability, d.record_count FROM datasets d JOIN works w ON w.dataset_id = d.id WHERE w.id = ? LIMIT 1",
    workId,
  ) as unknown as DatasetRow[]

  return {
    work,
    expressions,
    editions,
    artifacts,
    dataset: datasetFromRow(datasetRows[0]),
  }
}

export async function browserLoadPassageTrace(passage: Passage): Promise<PassageTrace> {
  const handle = await worker()
  const [contentRows, passageRows] = await Promise.all([
    handle.db.query(
      `SELECT m.rowid, m.content_id, m.passage_id, m.dataset_id, m.language, m.script,
              m.representation, m.artifact, m.provenance, f.text
       FROM search_meta m
       JOIN fts_contents f ON f.docid = m.rowid
       WHERE m.passage_id = ?
       ORDER BY m.rowid ASC`,
      passage.id,
    ) as unknown as Promise<ContentRow[]>,
    handle.db.query(
      "SELECT id, dataset_id, work_id, sequence, unit, label, labels_json FROM passages WHERE id = ? LIMIT 1",
      passage.id,
    ) as unknown as Promise<PassageRow[]>,
  ])

  const passageRow = passageRows[0]
  const contents = contentRows.map(contentFromRow)
  const normalizedPassage = passageRow ? passageFromRow(passageRow) : passage
  normalizedPassage.contents = contents
  normalizedPassage.language = contents[0]?.language
  normalizedPassage.source = contents[0]?.artifact ?? passageRow?.dataset_id ?? passage.source
  normalizedPassage.provenance = contents[0]?.provenance ?? passage.provenance

  const targetIds = [passage.id, ...contents.map((item) => item.id)]
  const artifactIds = [...new Set(contents.map((item) => item.artifact).filter((id): id is string => Boolean(id)))]
  const directProvenanceIds = [...new Set(contents.map((item) => item.provenance).filter((id): id is string => Boolean(id)))]

  let artifacts: CorpusResource[] = []
  if (artifactIds.length) {
    const rows = await jsonRows(
      "SELECT json FROM artifacts WHERE id IN (" + placeholders(artifactIds) + ") ORDER BY id",
      ...artifactIds,
    )
    artifacts = rows.map((row) => parseJson<CorpusResource>(row.json)).filter((row): row is CorpusResource => Boolean(row))
  }

  let evidence: EvidenceRecord[] = []
  if (targetIds.length) {
    const rows = await handle.db.query(
      "SELECT id, target, relation, provenance, json FROM evidence WHERE target IN (" + placeholders(targetIds) + ") ORDER BY id",
      ...targetIds,
    ) as unknown as EvidenceRow[]
    evidence = rows.map((row) => parseJson<EvidenceRecord>(row.json)).filter((row): row is EvidenceRecord => Boolean(row))
  }

  let relations: CorpusResource[] = []
  if (targetIds.length) {
    const rows = await jsonRows(
      "SELECT DISTINCT r.json FROM relations r JOIN relation_targets t ON t.relation_id = r.id WHERE t.target_id IN (" + placeholders(targetIds) + ") ORDER BY r.id",
      ...targetIds,
    )
    relations = rows.map((row) => parseJson<CorpusResource>(row.json)).filter((row): row is CorpusResource => Boolean(row))
  }

  const provenanceIds = [...new Set([
    ...directProvenanceIds,
    ...evidence.map((item) => item.provenance).filter((id): id is string => Boolean(id)),
    ...relations.map((item) => {
      const textual = (item.extensions?.textual ?? {}) as Record<string, unknown>
      return typeof textual.provenance === "string" ? textual.provenance : undefined
    }).filter((id): id is string => Boolean(id)),
  ])]

  let provenanceRecords: ProvenanceRecord[] = []
  if (provenanceIds.length) {
    const rows = await jsonRows(
      "SELECT json FROM provenance WHERE id IN (" + placeholders(provenanceIds) + ") ORDER BY id",
      ...provenanceIds,
    )
    provenanceRecords = rows.map((row) => parseJson<ProvenanceRecord>(row.json)).filter((row): row is ProvenanceRecord => Boolean(row))
  }

  return {
    passage: normalizedPassage,
    rawPassage: passageRow ? passageResource(passageRow) : undefined,
    contents,
    artifacts,
    provenanceRecords,
    evidence,
    relations,
    dataset: await datasetById(passageRow?.dataset_id),
  }
}

export async function browserTraverseAssertion(assertionId: string): Promise<AssertionTraversal | null> {
  const handle = await worker()
  const assertionRows = await jsonRows("SELECT json FROM assertions WHERE id = ? LIMIT 1", assertionId)
  const assertion = parseJson<Record<string, unknown>>(assertionRows[0]?.json)
  if (!assertion) return null

  const refs = await handle.db.query(
    "SELECT ref_id FROM assertion_evidence WHERE assertion_id = ? ORDER BY ref_id",
    assertionId,
  ) as unknown as Array<{ ref_id: string }>

  const evidence: EvidenceRecord[] = []
  const targets: Array<Record<string, unknown>> = []
  const seenTargets = new Set<string>()

  for (const { ref_id: refId } of refs) {
    const evidenceRows = await handle.db.query(
      "SELECT id, target, relation, provenance, json FROM evidence WHERE id = ? LIMIT 1",
      refId,
    ) as unknown as EvidenceRow[]

    const evidenceRecord = parseJson<EvidenceRecord>(evidenceRows[0]?.json)
    if (evidenceRecord) {
      evidence.push(evidenceRecord)
      const targetId = evidenceRecord.target
      if (targetId && !seenTargets.has(targetId)) {
        const target = await resolveRecord(targetId)
        if (target) {
          seenTargets.add(targetId)
          targets.push(target)
        }
      }
      continue
    }

    if (!seenTargets.has(refId)) {
      const target = await resolveRecord(refId)
      if (target) {
        seenTargets.add(refId)
        targets.push(target)
      }
    }
  }

  return { assertion, evidence, targets }
}
