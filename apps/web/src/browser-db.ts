import { createDbWorker, type WorkerHttpvfs } from "sql.js-httpvfs"
import type { ContentLane, DatasetInfo, Passage, PassageTrace, SearchRecord } from "./data"

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
  const terms = tokenize(query)
  return terms.map((term) => term + "*").join(" AND ")
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

export async function browserDbStats() {
  const handle = await worker()
  const rows = await handle.db.query(
    "SELECT sum(record_count) AS total_records, count(*) AS datasets FROM datasets",
  ) as unknown as Array<{ total_records: number; datasets: number }>
  const stats = await handle.worker.getStats()
  return {
    totalRecords: rows[0]?.total_records ?? 0,
    datasetCount: rows[0]?.datasets ?? 0,
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
  const datasetRows = passageRow
    ? await handle.db.query(
        "SELECT id, tradition, version, spec_version, rights, availability, record_count FROM datasets WHERE id = ? LIMIT 1",
        passageRow.dataset_id,
      ) as unknown as DatasetRow[]
    : []

  const contents = contentRows.map(contentFromRow)
  const normalizedPassage = passageRow ? passageFromRow(passageRow) : passage
  normalizedPassage.contents = contents
  normalizedPassage.language = contents[0]?.language
  normalizedPassage.source = contents[0]?.artifact ?? passageRow?.dataset_id ?? passage.source
  normalizedPassage.provenance = contents[0]?.provenance ?? passage.provenance

  return {
    passage: normalizedPassage,
    rawPassage: passageRow ? {
      id: passageRow.id,
      record_type: "resource",
      kind: "textual.passage",
      labels: passageRow.label ? [{ value: passageRow.label, role: "preferred" }] : undefined,
      extensions: {
        textual: {
          unit: passageRow.unit,
          sequence: passageRow.sequence,
          container: passageRow.work_id,
        },
      },
    } : undefined,
    contents,
    artifacts: [],
    provenanceRecords: [],
    evidence: [],
    relations: [],
    dataset: datasetFromRow(datasetRows[0]),
  }
}
