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
function textTargets(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => typeof item === "string" ? item : obj(item).target)
    .filter((item) => typeof item === "string" && item.length > 0)
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

  CREATE TABLE works (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    json TEXT NOT NULL
  );

  CREATE TABLE expressions (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    work_id TEXT NOT NULL,
    json TEXT NOT NULL
  );
  CREATE INDEX idx_browser_expressions_work ON expressions(work_id);

  CREATE TABLE editions (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    json TEXT NOT NULL
  );

  CREATE TABLE edition_expressions (
    edition_id TEXT NOT NULL,
    expression_id TEXT NOT NULL,
    PRIMARY KEY (edition_id, expression_id)
  );
  CREATE INDEX idx_browser_editions_expression ON edition_expressions(expression_id);

  CREATE TABLE artifacts (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    represents TEXT,
    json TEXT NOT NULL
  );
  CREATE INDEX idx_browser_artifacts_represents ON artifacts(represents);

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
    content_id TEXT NOT NULL UNIQUE,
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

  CREATE TABLE provenance (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    json TEXT NOT NULL
  );

  CREATE TABLE evidence (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    target TEXT,
    relation TEXT,
    provenance TEXT,
    json TEXT NOT NULL
  );
  CREATE INDEX idx_browser_evidence_target ON evidence(target);

  CREATE TABLE relations (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    relation TEXT,
    method TEXT,
    provenance TEXT,
    json TEXT NOT NULL
  );

  CREATE TABLE relation_targets (
    relation_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    role TEXT NOT NULL,
    PRIMARY KEY (relation_id, target_id, role)
  );
  CREATE INDEX idx_browser_relation_target ON relation_targets(target_id);

  CREATE TABLE assertions (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    json TEXT NOT NULL
  );

  CREATE TABLE assertion_evidence (
    assertion_id TEXT NOT NULL,
    ref_id TEXT NOT NULL,
    PRIMARY KEY (assertion_id, ref_id)
  );
  CREATE INDEX idx_browser_assertion_ref ON assertion_evidence(ref_id);
`)

const insertDataset = db.prepare("INSERT INTO datasets VALUES (?, ?, ?, ?, ?, ?, ?)")
const insertWork = db.prepare("INSERT OR REPLACE INTO works VALUES (?, ?, ?)")
const insertExpression = db.prepare("INSERT OR REPLACE INTO expressions VALUES (?, ?, ?, ?)")
const insertEdition = db.prepare("INSERT OR REPLACE INTO editions VALUES (?, ?, ?)")
const insertEditionExpression = db.prepare("INSERT OR IGNORE INTO edition_expressions VALUES (?, ?)")
const insertArtifact = db.prepare("INSERT OR REPLACE INTO artifacts VALUES (?, ?, ?, ?)")
const insertPassage = db.prepare("INSERT OR REPLACE INTO passages VALUES (?, ?, ?, ?, ?, ?, ?)")
const insertFts = db.prepare("INSERT INTO fts_contents(docid, text) VALUES (?, ?)")
const insertMeta = db.prepare("INSERT INTO search_meta VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
const insertProvenance = db.prepare("INSERT OR REPLACE INTO provenance VALUES (?, ?, ?)")
const insertEvidence = db.prepare("INSERT OR REPLACE INTO evidence VALUES (?, ?, ?, ?, ?, ?)")
const insertRelation = db.prepare("INSERT OR REPLACE INTO relations VALUES (?, ?, ?, ?, ?, ?, ?)")
const insertRelationTarget = db.prepare("INSERT OR IGNORE INTO relation_targets VALUES (?, ?, ?)")
const insertAssertion = db.prepare("INSERT OR REPLACE INTO assertions VALUES (?, ?, ?)")
const insertAssertionEvidence = db.prepare("INSERT OR IGNORE INTO assertion_evidence VALUES (?, ?)")

let docid = 0
let totalRecords = 0
let indexedContents = 0
let totalPassages = 0
let hierarchyRecords = 0
let artifactRecords = 0
let provenanceRecords = 0
let evidenceRecords = 0
let relationRecords = 0
let assertionRecords = 0

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

      if (record.record_type === "provenance") {
        insertProvenance.run(record.id, dataset.manifest.id, JSON.stringify(record))
        provenanceRecords += 1
        continue
      }

      if (record.record_type === "evidence") {
        insertEvidence.run(
          record.id,
          dataset.manifest.id,
          typeof record.target === "string" ? record.target : null,
          typeof record.relation === "string" ? record.relation : null,
          typeof record.provenance === "string" ? record.provenance : null,
          JSON.stringify(record),
        )
        evidenceRecords += 1
        continue
      }

      if (record.record_type === "assertion") {
        insertAssertion.run(record.id, dataset.manifest.id, JSON.stringify(record))
        for (const ref of Array.isArray(record.evidence) ? record.evidence : []) {
          if (typeof ref === "string") insertAssertionEvidence.run(record.id, ref)
        }
        assertionRecords += 1
        continue
      }

      if (record.record_type !== "resource") continue
      const textual = obj(obj(record.extensions).textual)
      if (record.kind === "textual.work") {
        insertWork.run(record.id, dataset.manifest.id, JSON.stringify(record))
        hierarchyRecords += 1
      } else if (record.kind === "textual.expression") {
        const workId = typeof textual.work === "string" ? textual.work : expressionToWork.get(record.id) ?? ""
        insertExpression.run(record.id, dataset.manifest.id, workId, JSON.stringify(record))
        hierarchyRecords += 1
      } else if (record.kind === "textual.edition") {
        insertEdition.run(record.id, dataset.manifest.id, JSON.stringify(record))
        for (const expressionId of textTargets(textual.expressions)) {
          insertEditionExpression.run(record.id, expressionId)
        }
        hierarchyRecords += 1
      } else if (record.kind === "textual.artifact") {
        const represents = typeof textual.represents === "string" ? textual.represents : null
        insertArtifact.run(record.id, dataset.manifest.id, represents, JSON.stringify(record))
        hierarchyRecords += 1
        artifactRecords += 1
      } else if (record.kind === "textual.passage") {
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
      } else if (record.kind === "textual.alignment" || record.kind === "textual.variant") {
        insertRelation.run(
          record.id,
          dataset.manifest.id,
          record.kind,
          typeof textual.relation === "string" ? textual.relation : null,
          typeof textual.method === "string" ? textual.method : null,
          typeof textual.provenance === "string" ? textual.provenance : null,
          JSON.stringify(record),
        )
        for (const target of textTargets(textual.sources)) insertRelationTarget.run(record.id, target, "source")
        for (const target of textTargets(textual.targets)) insertRelationTarget.run(record.id, target, "target")
        relationRecords += 1
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
  hierarchyRecords,
  artifactRecords,
  provenanceRecords,
  evidenceRecords,
  relationRecords,
  assertionRecords,
  sizeBytes: info.size,
}, null, 2))
