import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const outputPath = path.join(root, "apps/web/public/corpus-catalog.json")
const checkOnly = process.argv.includes("--check")
const maxSamplePassagesPerWork = 12

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"))
}

async function listJsonl(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await listJsonl(full))
    else if (entry.isFile() && entry.name.endsWith(".jsonl")) out.push(full)
  }
  return out.sort()
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function preferredLabel(record) {
  const labels = Array.isArray(record.labels) ? record.labels : []
  const preferredEn = labels.find((label) => label?.role === "preferred" && label?.language === "en")
  const preferred = labels.find((label) => label?.role === "preferred")
  return preferredEn?.value ?? preferred?.value ?? labels[0]?.value ?? record.id
}

function titleCase(value) {
  return String(value)
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function sourceRevision() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim()
  } catch {
    return process.env.GITHUB_SHA ?? "unknown"
  }
}

function parseLine(line) {
  try { return JSON.parse(line) } catch { return null }
}

async function forEachLine(files, visit) {
  for (const file of files) {
    const content = await readFile(file, "utf8")
    const lines = content.split(/\r?\n/)
    for (const line of lines) {
      if (!line.trim()) continue
      await visit(line, file)
    }
  }
}

const registry = await readJson(path.join(root, "datasets/registry.json"))
const upstream = await readJson(path.join(root, "config/upstream-registry.json"))
const semanticRules = await readJson(path.join(root, "config/textual-semantic-rules.json"))

const datasets = []
for (const entry of registry.datasets) {
  if (entry.status === "fixture") continue
  const manifestPath = path.join(root, entry.path, "manifest.json")
  if (!existsSync(manifestPath)) continue
  const manifest = await readJson(manifestPath)
  datasets.push({
    entry,
    manifest,
    files: await listJsonl(path.join(root, entry.path, "data/core")),
    recordCount: 0,
  })
}

const worksRaw = new Map()
const workDataset = new Map()
const expressionsRaw = new Map()
const expressionToWork = new Map()
const editionsRaw = new Map()
const artifactsRaw = new Map()

for (const dataset of datasets) {
  await forEachLine(dataset.files, (line) => {
    dataset.recordCount += 1
    if (!line.includes('"record_type":"resource"') && !line.includes('"record_type": "resource"')) return
    if (
      !line.includes("textual.work") &&
      !line.includes("textual.expression") &&
      !line.includes("textual.edition") &&
      !line.includes("textual.artifact")
    ) return
    const record = parseLine(line)
    if (!record || record.record_type !== "resource") return
    const textual = asObject(asObject(record.extensions).textual)
    if (record.kind === "textual.work") {
      worksRaw.set(record.id, record)
      workDataset.set(record.id, dataset.manifest.id)
    } else if (record.kind === "textual.expression") {
      expressionsRaw.set(record.id, record)
      if (typeof textual.work === "string") expressionToWork.set(record.id, textual.work)
    } else if (record.kind === "textual.edition") {
      editionsRaw.set(record.id, record)
    } else if (record.kind === "textual.artifact") {
      artifactsRaw.set(record.id, record)
    }
  })
}

const datasetById = new Map(datasets.map((dataset) => [dataset.manifest.id, dataset]))
const passagesByWorkRaw = new Map()
const passageTotalByWork = new Map()
const selectedPassageIds = new Set()
const selectedPassageRaw = new Map()

for (const dataset of datasets) {
  await forEachLine(dataset.files, (line) => {
    if (!line.includes("textual.passage")) return
    const record = parseLine(line)
    if (!record || record.record_type !== "resource" || record.kind !== "textual.passage") return
    const textual = asObject(asObject(record.extensions).textual)
    const container = typeof textual.container === "string" ? textual.container : undefined
    const declaredWork = typeof textual.work === "string" ? textual.work : undefined
    const workId = declaredWork ?? (container?.startsWith("mw:work:") ? container : container ? expressionToWork.get(container) : undefined)
    if (!workId || !worksRaw.has(workId)) return
    passageTotalByWork.set(workId, (passageTotalByWork.get(workId) ?? 0) + 1)
    const sample = passagesByWorkRaw.get(workId) ?? []
    if (sample.length >= maxSamplePassagesPerWork) return
    sample.push(record)
    passagesByWorkRaw.set(workId, sample)
    selectedPassageIds.add(record.id)
    selectedPassageRaw.set(record.id, record)
  })
}

const contentsByPassage = new Map()
const selectedContentIds = new Set()
const provenanceIds = new Set()
const artifactIds = new Set()

for (const dataset of datasets) {
  await forEachLine(dataset.files, (line) => {
    if (!line.includes("textual.content")) return
    const record = parseLine(line)
    if (!record || record.record_type !== "resource" || record.kind !== "textual.content") return
    const extensions = asObject(record.extensions)
    const textual = asObject(extensions.textual)
    const target = typeof textual.target === "string" ? textual.target : undefined
    if (!target || !selectedPassageIds.has(target)) return
    const source = asObject(extensions.source)
    const list = contentsByPassage.get(target) ?? []
    list.push(record)
    contentsByPassage.set(target, list)
    selectedContentIds.add(record.id)
    if (typeof source.provenance === "string") provenanceIds.add(source.provenance)
    if (typeof source.artifact === "string") artifactIds.add(source.artifact)
  })
}

const provenanceRecords = new Map()
const evidenceByTarget = new Map()
const relationsByPassage = new Map()
const selectedTargets = new Set([...selectedPassageIds, ...selectedContentIds])

for (const dataset of datasets) {
  await forEachLine(dataset.files, (line) => {
    if (line.includes('"record_type":"provenance"') || line.includes('"record_type": "provenance"')) {
      const record = parseLine(line)
      if (record && provenanceIds.has(record.id)) provenanceRecords.set(record.id, record)
      return
    }
    if (line.includes('"record_type":"evidence"') || line.includes('"record_type": "evidence"')) {
      const record = parseLine(line)
      if (!record || typeof record.target !== "string" || !selectedTargets.has(record.target)) return
      const list = evidenceByTarget.get(record.target) ?? []
      list.push(record)
      evidenceByTarget.set(record.target, list)
      return
    }
    if (!line.includes("textual.alignment") && !line.includes("textual.variant")) return
    const record = parseLine(line)
    if (!record || record.record_type !== "resource") return
    for (const passageId of selectedPassageIds) {
      if (!line.includes(passageId)) continue
      const list = relationsByPassage.get(passageId) ?? []
      list.push(record)
      relationsByPassage.set(passageId, list)
    }
  })
}

const traditionMeta = new Map()
for (const [id, metaValue] of Object.entries(upstream.traditions ?? {})) {
  const meta = asObject(metaValue)
  traditionMeta.set(id, {
    id,
    name: typeof meta.name === "string" ? meta.name : titleCase(id),
    primaryLanguage: typeof meta.primaryLanguage === "string" ? meta.primaryLanguage : undefined,
    scripts: Array.isArray(meta.scripts) ? meta.scripts.filter((value) => typeof value === "string") : [],
    datasetCount: 0,
    totalRecords: 0,
  })
}

for (const dataset of datasets) {
  const tradition = dataset.entry.tradition ?? dataset.manifest.tradition ?? asObject(dataset.manifest.extensions).tradition ?? "unscoped"
  if (!traditionMeta.has(tradition)) {
    traditionMeta.set(tradition, { id: tradition, name: titleCase(tradition), scripts: [], datasetCount: 0, totalRecords: 0 })
  }
  const target = traditionMeta.get(tradition)
  target.datasetCount += 1
  target.totalRecords += dataset.recordCount
}

function datasetInfo(dataset) {
  if (!dataset) return null
  return {
    id: dataset.manifest.id,
    version: dataset.manifest.datasetVersion,
    specVersion: dataset.manifest.specVersion,
    tradition: dataset.entry.tradition ?? dataset.manifest.tradition ?? "unscoped",
    genre: dataset.entry.genre ?? dataset.manifest.genre,
    sourceLanguage: dataset.entry.sourceLanguage ?? dataset.manifest.source_language,
    rights: typeof dataset.manifest.rights === "string" ? dataset.manifest.rights : JSON.stringify(dataset.manifest.rights ?? {}),
    availability: dataset.manifest.availability,
    recordCount: dataset.recordCount,
  }
}

function contentLane(record) {
  const extensions = asObject(record.extensions)
  const textual = asObject(extensions.textual)
  const source = asObject(extensions.source)
  return {
    id: record.id,
    language: typeof textual.language === "string" ? textual.language : "und",
    script: typeof textual.script === "string" ? textual.script : undefined,
    representation: typeof textual.representation === "string" ? textual.representation : "source",
    text: typeof textual.text === "string" ? textual.text : "",
    artifact: typeof source.artifact === "string" ? source.artifact : undefined,
    provenance: typeof source.provenance === "string" ? source.provenance : undefined,
  }
}

function passageLocator(record) {
  const textual = asObject(asObject(record.extensions).textual)
  const citations = Array.isArray(textual.citations) ? textual.citations : []
  const first = asObject(citations[0])
  return first.reference ?? textual.reference ?? textual.local_id ?? preferredLabel(record) ?? record.id
}

function normalizedPassage(record, workId) {
  const contents = (contentsByPassage.get(record.id) ?? []).map(contentLane)
  const first = contents[0]
  return {
    id: record.id,
    workId,
    locator: String(passageLocator(record)),
    label: preferredLabel(record),
    language: first?.language,
    source: first?.artifact ?? "canonical dataset",
    provenance: first?.provenance ?? "not declared",
    note: contents.length ? String(contents.length) + " exact content lane(s) available." : "No exact content lane is bundled in the catalog sample.",
    contents,
  }
}

const works = [...worksRaw.values()].map((record) => {
  const datasetId = workDataset.get(record.id)
  const dataset = datasetById.get(datasetId)
  const expressions = [...expressionsRaw.values()].filter((expression) => expressionToWork.get(expression.id) === record.id)
  const language = asObject(asObject(expressions[0]?.extensions).textual).language
  const textual = asObject(asObject(record.extensions).textual)
  return {
    id: record.id,
    title: preferredLabel(record),
    tradition: dataset?.entry.tradition ?? "unscoped",
    language: typeof language === "string" ? language : dataset?.entry.sourceLanguage,
    description: typeof record.description === "string"
      ? record.description
      : typeof textual.work_type === "string"
        ? titleCase(textual.work_type) + " · canonical textual.work"
        : "Canonical textual.work record.",
    source: Array.isArray(dataset?.manifest.sources) ? dataset.manifest.sources[0] : datasetId,
    datasetId,
    rights: typeof dataset?.manifest.rights === "string" ? dataset.manifest.rights : undefined,
    availability: dataset?.manifest.availability,
  }
}).sort((a, b) => a.title.localeCompare(b.title))

const hierarchies = {}
const passagePages = {}
const traces = {}

for (const work of works) {
  const workRecord = worksRaw.get(work.id)
  const expressions = [...expressionsRaw.values()].filter((expression) => expressionToWork.get(expression.id) === work.id)
  const expressionIds = new Set(expressions.map((item) => item.id))
  const editions = [...editionsRaw.values()].filter((edition) => {
    const textual = asObject(asObject(edition.extensions).textual)
    return Array.isArray(textual.expressions) && textual.expressions.some((id) => expressionIds.has(id))
  })
  const editionIds = new Set(editions.map((item) => item.id))
  const artifacts = [...artifactsRaw.values()].filter((artifact) => {
    const represents = asObject(asObject(artifact.extensions).textual).represents
    return typeof represents === "string" && editionIds.has(represents)
  })
  const dataset = datasetById.get(work.datasetId)
  hierarchies[work.id] = { work: workRecord, expressions, editions, artifacts, dataset: datasetInfo(dataset) }

  const samples = (passagesByWorkRaw.get(work.id) ?? []).map((passage) => normalizedPassage(passage, work.id))
  passagePages[work.id] = { total: passageTotalByWork.get(work.id) ?? 0, data: samples }

  for (const passage of samples) {
    const rawPassage = selectedPassageRaw.get(passage.id)
    const contents = passage.contents ?? []
    const contentRecords = contentsByPassage.get(passage.id) ?? []
    const traceArtifactIds = new Set(contentRecords.map((record) => asObject(asObject(record.extensions).source).artifact).filter((id) => typeof id === "string"))
    const traceProvenanceIds = new Set(contentRecords.map((record) => asObject(asObject(record.extensions).source).provenance).filter((id) => typeof id === "string"))
    const evidence = []
    for (const target of [passage.id, ...contents.map((content) => content.id)]) {
      evidence.push(...(evidenceByTarget.get(target) ?? []))
    }
    traces[passage.id] = {
      passage,
      rawPassage,
      contents,
      artifacts: [...traceArtifactIds].map((id) => artifactsRaw.get(id)).filter(Boolean),
      provenanceRecords: [...traceProvenanceIds].map((id) => provenanceRecords.get(id)).filter(Boolean),
      evidence,
      relations: relationsByPassage.get(passage.id) ?? [],
      dataset: datasetInfo(dataset),
    }
  }
}

const searchRecords = [
  ...works.map((work) => ({
    id: work.id,
    title: work.title,
    kind: "textual.work",
    recordType: "resource",
    tradition: work.tradition,
    language: work.language,
    snippet: work.description,
    source: work.datasetId,
    datasetId: work.datasetId,
  })),
  ...Object.values(passagePages).flatMap((page) => page.data.map((passage) => ({
    id: passage.id,
    title: passage.label,
    kind: "textual.passage",
    recordType: "resource",
    language: passage.language,
    snippet: passage.contents?.map((content) => content.text).filter(Boolean).join(" ").slice(0, 240),
    source: passage.source,
  }))),
]

const payloadWithoutHash = {
  schemaVersion: 1,
  sourceRevision: sourceRevision(),
  source: "rocksoul-rgbl canonical repository",
  summary: {
    totalRecords: datasets.reduce((sum, dataset) => sum + dataset.recordCount, 0),
    datasetCount: datasets.length,
    workCount: works.length,
    sampledPassageCount: selectedPassageIds.size,
  },
  traditions: [...traditionMeta.values()].sort((a, b) => a.name.localeCompare(b.name)),
  works,
  hierarchies,
  passagePages,
  traces,
  searchRecords,
  semanticRules: semanticRules.rules.map((rule) => ({
    id: rule.id,
    label: rule.label + " · " + rule.boundary.replaceAll("_", " "),
    context: rule.context,
    epistemic: rule.epistemic,
    sourceCount: 0,
    values: rule.matrix,
  })),
}

const canonical = JSON.stringify(payloadWithoutHash)
const payload = {
  ...payloadWithoutHash,
  catalogHash: createHash("sha256").update(canonical).digest("hex"),
}
const rendered = JSON.stringify(payload, null, 2) + "\n"

if (checkOnly) {
  if (!existsSync(outputPath)) {
    console.error("Generated web catalog is missing:", path.relative(root, outputPath))
    process.exit(1)
  }
  const existing = await readFile(outputPath, "utf8")
  if (existing !== rendered) {
    console.error("Generated web catalog is stale. Run: node scripts/export-web-catalog.mjs")
    process.exit(1)
  }
  console.log("Generated web catalog is current:", payload.catalogHash)
} else {
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, rendered)
  console.log(JSON.stringify({
    output: path.relative(root, outputPath),
    catalogHash: payload.catalogHash,
    totalRecords: payload.summary.totalRecords,
    datasets: payload.summary.datasetCount,
    works: payload.summary.workCount,
    sampledPassages: payload.summary.sampledPassageCount,
  }, null, 2))
}
