import { createRequire } from "node:module"
import { existsSync } from "node:fs"
import { mkdir, readFile, readdir, rm, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const { DatabaseSync } = require("node:sqlite")
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const target = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, "dist/browser/corpus-search.sqlite")

async function json(file) { return JSON.parse(await readFile(file, "utf8")) }
async function jsonlFiles(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await jsonlFiles(full))
    else if (entry.isFile() && entry.name.endsWith(".jsonl")) out.push(full)
  }
  return out.sort()
}
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {} }
function labelOf(record) {
  const labels = Array.isArray(record.labels) ? record.labels : []
  return labels.find((item) => item?.role === "preferred" && item?.language === "en")?.value
    ?? labels.find((item) => item?.role === "preferred")?.value
    ?? labels[0]?.value
    ?? record.id
}

const registry = await json(path.join(root, "datasets/registry.json"))
const entries = []
for (const entry of registry.datasets) {
  if (entry.status === "fixture") continue
  const manifestFile = path.join(root, entry.path, "manifest.json")
  if (!existsSync(manifestFile)) continue
  entries.push({
    entry,
    manifest: await json(manifestFile),
    files: await jsonlFiles(path.join(root, entry.path, "data/core")),
  })
}

const expressionToWork = new Map()
for (const dataset of entries) {
  for (const file of dataset.files) {
    const source = await readFile(file, "utf8")
    for (const line of source.split(/\r?\n/)) {
      if (!line.includes("textual.expression")) continue
      let record
      try { record = JSON.parse(line) } catch { continue }
      if (record.kind !== "textual.expression") continue
      const work = obj(obj(record.extensions).textual).work
      if (typeof work === "string") expressionToWork.set(record.id, work)
    }
  }
}

await mkdir(path.dirname(target), { recursive: true })
await rm(target, { force: true })
const db = new DatabaseSync(target)
db.exec(`
  PRAGMA journal_mode = OFF;
  PRAGMA synchronous = OFF;
  PRAGMA temp_store = MEMORY;
  PRAGMA cache_size = 50000;

  CREATE TABLE datasets (
    id TEXT PRIMARY KEY,
    tradition TEXT,
    version TEXT,
    spec_version TEXT,
    rights TEXT,
    availability TEXT,
    record_count INTEGER NOT NULL
  );

  CREATE TABLE passages (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    work_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    unit TEXT NOT NULL,
    label TEXT,
    labels_json TEXT
  );
  CREATE INDEX idx_browser_passages_work_seq ON passages(work_id, sequence);
  CREATE INDEX idx_browser_passages_dataset ON passages(dataset_id);

  CREATE VIRTUAL TABLE fts_contents USING fts3(text);

  CREATE TABLE search_meta (
    rowid INTEGER PRIMARY KEY,
    content_id TEXT NOT NULL,
    passage_id TEXT NOT NULL,
    dataset_id TEXT NOT NULL,
    language TEXT NOT NULL,
    script TEXT,
    representation TEXT NOT NULL,
    artifact TEXT,
    provenance TEXT
  );
  CREATE INDEX idx_browser_meta_passage ON search_meta(passage_id);
  CREATE INDEX idx_browser_meta_dataset ON search_meta(dataset_id);
`)

const insertDataset = db.prepare("INSERT INTO datasets VALUES (?, ?, ?, ?, ?, ?, ?)")
const insertPassage = db.prepare("INSERT OR REPLACE INTO passages VALUES (?, ?, ?, ?, ?, ?, ?)")
const insertFts = db.prepare("INSERT INTO fts_contents(docid, text) VALUES (?, ?)")
const insertMeta = db.prepare("INSERT INTO search_meta VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
let docid = 0
let totalRecords = 0
let indexedContents = 0
let totalPassages = 0

db.exec("BEGIN")
for (const dataset of entries) {
  let datasetCount = 0
  for (const file of dataset.files) {
    const source = await readFile(file, "utf8")
    for (const line of source.split(/\r?\n/)) {
      if (!line.trim()) continue
      datasetCount += 1
      totalRecords += 1
      let record
      try { record = JSON.parse(line) } catch { continue }
      if (record.record_type !== "resource") continue
      const textual = obj(obj(record.extensions).textual)
      if (record.kind === "textual.passage") {
        const container = typeof textual.container === "string" ? textual.container : ""
        const workId = typeof textual.work === "string"
          ? textual.work
          : container.startsWith("mw:work:")
            ? container
            : expressionToWork.get(container) ?? container
        insertPassage.run(
          record.id,
          dataset.manifest.id,
          workId,
          Number.isFinite(textual.sequence) ? textual.sequence : 0,
          typeof textual.unit === "string" ? textual.unit : "passage",
          labelOf(record),
          JSON.stringify(record.labels ?? []),
        )
        totalPassages += 1
      } else if (record.kind === "textual.content") {
        const text = typeof textual.text === "string" ? textual.text : ""
        const passageId = typeof textual.target === "string" ? textual.target : ""
        if (!text || !passageId) continue
        const sourceMeta = obj(obj(record.extensions).source)
        docid += 1
        insertFts.run(docid, text)
        insertMeta.run(
          docid,
          record.id,
          passageId,
          dataset.manifest.id,
          typeof textual.language === "string" ? textual.language : "und",
          typeof textual.script === "string" ? textual.script : null,
          typeof textual.representation === "string" ? textual.representation : "source",
          typeof sourceMeta.artifact === "string" ? sourceMeta.artifact : null,
          typeof sourceMeta.provenance === "string" ? sourceMeta.provenance : null,
        )
        indexedContents += 1
      }
    }
  }
  insertDataset.run(
    dataset.manifest.id,
    dataset.entry.tradition ?? dataset.manifest.tradition ?? "unscoped",
    dataset.manifest.datasetVersion ?? "0.1.0",
    dataset.manifest.specVersion ?? "0.1",
    typeof dataset.manifest.rights === "string" ? dataset.manifest.rights : JSON.stringify(dataset.manifest.rights ?? {}),
    dataset.manifest.availability ?? "bundled",
    datasetCount,
  )
}
db.exec("COMMIT")
try { db.exec("INSERT INTO fts_contents(fts_contents) VALUES('optimize')") } catch {}
db.exec("PRAGMA optimize")
db.close()

const info = await stat(target)
console.log(JSON.stringify({
  output: path.relative(root, target),
  totalRecords,
  passages: totalPassages,
  indexedContents,
  sizeBytes: info.size,
}, null, 2))
