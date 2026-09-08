import type {
  AssertionTraversal,
  ContentLane,
  CorpusCatalog,
  CorpusResource,
  DatasetInfo,
  EvidenceRecord,
  Passage,
  PassageTrace,
  ProvenanceRecord,
  SearchRecord,
  SemanticRuleRow,
  Tradition,
  Work,
  WorkHierarchy,
} from "./data"
import {
  browserDbStats,
  browserLoadPassage,
  browserLoadPassages,
  browserLoadPassageTrace,
  browserLoadWorkHierarchy,
  browserSearchCorpus,
  browserTraverseAssertion,
} from "./browser-db"

const API_BASE = (import.meta.env.VITE_RGBL_API_URL as string | undefined)?.replace(/\/+$/, "") ?? ""
const REQUEST_TIMEOUT_MS = 8_000
const CATALOG_URL = "/corpus-catalog.json"

export const rgblApiConfigured = Boolean(API_BASE)
export const rgblApiBaseUrl = API_BASE

export interface ApiHealth {
  status: string
  service?: string
  version?: string
  uptime?: number
  totalRecords?: number
  database?: string
  memoryUsageMb?: number
  corpusHash?: string
  catalogHash?: string
  datasetCount?: number
  passageCount?: number
  contentCount?: number
  evidenceCount?: number
  relationCount?: number
  assertionCount?: number
  bytesFetched?: number
  databaseBytes?: number
}

export interface LoadResult<T> {
  data: T
  source: "api" | "browser" | "catalog"
  error?: string
}

export interface PageResult<T> extends LoadResult<T[]> {
  offset: number
  limit: number
  total?: number
  hasMore: boolean
  latencyMs?: number
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value
  }
  return undefined
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value
  }
  return undefined
}

function labelOf(record: Record<string, unknown>) {
  const labels = Array.isArray(record.labels) ? record.labels : []
  const preferred = labels.map(asRecord).find((label) => label.role === "preferred")
  return stringValue(preferred?.value, asRecord(labels[0]).value, record.title, record.label, record.name)
}

function textualOf(record: Record<string, unknown>) {
  return asRecord(asRecord(record.extensions).textual)
}

function sourceOf(record: Record<string, unknown>) {
  return asRecord(asRecord(record.extensions).source)
}

function normalizeDataset(value: unknown): DatasetInfo | null {
  const row = asRecord(value)
  const id = stringValue(row.id)
  if (!id) return null
  return {
    id,
    version: stringValue(row.version, row.datasetVersion),
    specVersion: stringValue(row.spec_version, row.specVersion),
    tradition: stringValue(row.tradition),
    genre: stringValue(row.genre),
    sourceLanguage: stringValue(row.source_language, row.sourceLanguage),
    rights: stringValue(row.rights),
    availability: stringValue(row.availability),
    recordCount: numberValue(row.record_count, row.recordCount),
  }
}

let catalogPromise: Promise<CorpusCatalog> | undefined

export function loadCatalog(): Promise<CorpusCatalog> {
  if (!catalogPromise) {
    catalogPromise = fetch(CATALOG_URL, { headers: { accept: "application/json" } }).then(async (response) => {
      if (!response.ok) throw new Error("Generated corpus catalog returned " + response.status)
      return await response.json() as CorpusCatalog
    })
  }
  return catalogPromise
}

async function requestJson<T>(path: string): Promise<T> {
  if (!API_BASE) throw new Error("RGBL API URL is not configured")
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(API_BASE + path, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error("RGBL API returned " + response.status)
    return await response.json() as T
  } finally {
    window.clearTimeout(timeout)
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.name === "AbortError" ? "RGBL API request timed out" : error.message
  return "RGBL data request failed"
}

async function catalogResult<T>(select: (catalog: CorpusCatalog) => T, error?: unknown): Promise<LoadResult<T>> {
  try {
    const catalog = await loadCatalog()
    return { data: select(catalog), source: "catalog", error: error ? errorMessage(error) : undefined }
  } catch (catalogError) {
    const message = [error ? errorMessage(error) : "", errorMessage(catalogError)].filter(Boolean).join(" · ")
    throw new Error(message || "Canonical web catalog is unavailable")
  }
}

export async function loadHealth(): Promise<LoadResult<ApiHealth | null>> {
  if (API_BASE) {
    try {
      return { data: await requestJson<ApiHealth>("/v1/health"), source: "api" }
    } catch (apiError) {
      try {
        const stats = await browserDbStats()
        return {
          source: "browser",
          error: errorMessage(apiError),
          data: {
            status: "browser-ready",
            service: "rocksoul-rgbl-browser-sqlite",
            totalRecords: stats.totalRecords,
            datasetCount: stats.datasetCount,
            passageCount: stats.passages,
            contentCount: stats.contents,
            evidenceCount: stats.evidence,
            relationCount: stats.relations,
            assertionCount: stats.assertions,
            bytesFetched: stats.bytesFetched,
            databaseBytes: stats.databaseBytes,
            database: "Immutable chunked SQLite · HTTP range/WASM",
          },
        }
      } catch (browserError) {
        return catalogResult((catalog) => ({
          status: "catalog-ready",
          service: "rocksoul-rgbl-static-catalog",
          totalRecords: catalog.summary.totalRecords,
          database: "Generated canonical repository catalog",
          corpusHash: catalog.corpusHash,
          catalogHash: catalog.catalogHash,
        }), browserError)
      }
    }
  }

  try {
    const stats = await browserDbStats()
    return {
      source: "browser",
      data: {
        status: "browser-ready",
        service: "rocksoul-rgbl-browser-sqlite",
        totalRecords: stats.totalRecords,
        datasetCount: stats.datasetCount,
        passageCount: stats.passages,
        contentCount: stats.contents,
        evidenceCount: stats.evidence,
        relationCount: stats.relations,
        assertionCount: stats.assertions,
        bytesFetched: stats.bytesFetched,
        databaseBytes: stats.databaseBytes,
        database: "Immutable chunked SQLite · HTTP range/WASM",
      },
    }
  } catch (browserError) {
    return catalogResult((catalog) => ({
      status: "catalog-ready",
      service: "rocksoul-rgbl-static-catalog",
      totalRecords: catalog.summary.totalRecords,
      database: "Generated canonical repository catalog",
      corpusHash: catalog.corpusHash,
      catalogHash: catalog.catalogHash,
    }), browserError)
  }
}

export async function loadSemanticRules(): Promise<LoadResult<SemanticRuleRow[]>> {
  return catalogResult((catalog) => catalog.semanticRules)
}

export async function loadTraditions(): Promise<LoadResult<Tradition[]>> {
  if (API_BASE) {
    try {
      const payload = await requestJson<{ data?: unknown[] }>("/v1/traditions")
      const rows = Array.isArray(payload.data) ? payload.data : []
      return {
        source: "api",
        data: rows.map((item) => {
          const row = asRecord(item)
          return {
            id: stringValue(row.id, row.tradition) ?? "unknown",
            name: stringValue(row.name, row.tradition) ?? "Unknown tradition",
            datasetCount: numberValue(row.datasetCount, row.dataset_count),
            totalRecords: numberValue(row.totalRecords, row.total_records),
            primaryLanguage: stringValue(row.primaryLanguage, row.primary_language),
            scripts: Array.isArray(row.scripts) ? row.scripts.filter((value): value is string => typeof value === "string") : [],
          }
        }),
      }
    } catch (error) {
      return catalogResult((catalog) => catalog.traditions, error)
    }
  }
  return catalogResult((catalog) => catalog.traditions)
}

export async function loadWorks(): Promise<LoadResult<Work[]>> {
  if (API_BASE) {
    try {
      const payload = await requestJson<{ data?: unknown[] }>("/v1/works")
      const rows = Array.isArray(payload.data) ? payload.data : []
      return {
        source: "api",
        data: rows.map((item, index) => {
          const row = asRecord(item)
          const id = stringValue(row.id, row.canonical_id, row.canonicalId) ?? "work-" + String(index + 1)
          const title = stringValue(row.title_en, row.title_id, row.title_native, row.title, row.name) ?? id
          const workType = stringValue(row.work_type, row.workType)
          const datasetId = stringValue(row.dataset_id, row.datasetId)
          return {
            id,
            title,
            tradition: stringValue(row.tradition) ?? "unscoped",
            language: stringValue(row.source_language, row.language),
            description: workType ? workType.replaceAll("_", " ") + " · canonical textual.work" : "Canonical textual.work record.",
            source: datasetId ?? "RGBL canonical corpus",
            datasetId,
            rights: stringValue(row.rights),
            availability: stringValue(row.availability),
          }
        }),
      }
    } catch (error) {
      return catalogResult((catalog) => catalog.works, error)
    }
  }
  return catalogResult((catalog) => catalog.works)
}

function normalizeContent(item: unknown): ContentLane {
  const row = asRecord(item)
  const textual = textualOf(row)
  const source = sourceOf(row)
  return {
    id: stringValue(row.id) ?? "mw:content:unknown",
    language: stringValue(textual.language, row.language) ?? "und",
    script: stringValue(textual.script),
    representation: stringValue(textual.representation) ?? "source",
    text: stringValue(textual.text, row.text) ?? "",
    artifact: stringValue(source.artifact),
    provenance: stringValue(source.provenance),
  }
}

function locatorOf(passage: Record<string, unknown>) {
  const textual = textualOf(passage)
  const citations = Array.isArray(textual.citations) ? textual.citations.map(asRecord) : []
  return stringValue(citations[0]?.reference, textual.reference, textual.local_id, passage.reference, labelOf(passage), passage.id) ?? "Passage"
}

function normalizePassageBundle(item: unknown, workId: string): Passage {
  const bundle = asRecord(item)
  const passage = asRecord(bundle.passage && typeof bundle.passage === "object" ? bundle.passage : item)
  const contents = Array.isArray(bundle.contents) ? bundle.contents.map(normalizeContent) : []
  const id = stringValue(passage.id) ?? workId + ":passage:unknown"
  const firstContent = contents[0]
  return {
    id,
    workId,
    locator: locatorOf(passage),
    label: labelOf(passage) ?? locatorOf(passage),
    language: firstContent?.language,
    source: firstContent?.artifact ?? "RGBL canonical corpus",
    provenance: firstContent?.provenance ?? "Provenance is available on the canonical source/content record.",
    note: contents.length
      ? String(contents.length) + " exact content lane(s) available."
      : "No exact content lane was returned for this passage.",
    contents,
  }
}

export async function loadPassages(workId: string, offset = 0, limit = 12): Promise<PageResult<Passage>> {
  if (API_BASE) {
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
      const payload = await requestJson<{ data?: unknown[]; total?: number; hasMore?: boolean; limit?: number; offset?: number }>(
        "/v1/works/" + encodeURIComponent(workId) + "/passages?" + params.toString(),
      )
      const rows = Array.isArray(payload.data) ? payload.data : []
      return {
        source: "api",
        data: rows.map((item) => normalizePassageBundle(item, workId)),
        offset: payload.offset ?? offset,
        limit: payload.limit ?? limit,
        total: payload.total,
        hasMore: Boolean(payload.hasMore),
      }
    } catch (apiError) {
      try {
        const page = await browserLoadPassages(workId, offset, limit)
        return { ...page, source: "browser", offset, limit, error: errorMessage(apiError) }
      } catch (browserError) {
        const result = await catalogResult((catalog) => catalog.passagePages[workId], browserError)
        const page = result.data
        const available = page?.data ?? []
        const data = available.slice(offset, offset + limit)
        return { data, source: "catalog", error: result.error, offset, limit, total: page?.total ?? 0, hasMore: offset + data.length < available.length }
      }
    }
  }

  try {
    const page = await browserLoadPassages(workId, offset, limit)
    return { ...page, source: "browser", offset, limit }
  } catch (browserError) {
    const result = await catalogResult((catalog) => catalog.passagePages[workId], browserError)
    const page = result.data
    const available = page?.data ?? []
    const data = available.slice(offset, offset + limit)
    return { data, source: "catalog", error: result.error, offset, limit, total: page?.total ?? 0, hasMore: offset + data.length < available.length }
  }
}

export async function loadPassageById(passageId: string): Promise<LoadResult<Passage | null>> {
  try {
    const passage = await browserLoadPassage(passageId)
    if (passage) return { data: passage, source: "browser" }
  } catch (browserError) {
    const catalog = await catalogResult((value) => {
      for (const page of Object.values(value.passagePages)) {
        const match = page.data.find((passage) => passage.id === passageId)
        if (match) return match
      }
      return null
    }, browserError)
    return catalog
  }
  return catalogResult((value) => {
    for (const page of Object.values(value.passagePages)) {
      const match = page.data.find((passage) => passage.id === passageId)
      if (match) return match
    }
    return null
  })
}

export async function loadWorkHierarchy(workId: string): Promise<LoadResult<WorkHierarchy>> {
  if (API_BASE) {
    try {
      const payload = await requestJson<{ data?: unknown }>("/v1/works/" + encodeURIComponent(workId))
      const data = asRecord(payload.data)
      return {
        source: "api",
        data: {
          work: Object.keys(asRecord(data.work)).length ? asRecord(data.work) as CorpusResource : null,
          expressions: Array.isArray(data.expressions) ? data.expressions.map((item) => asRecord(item) as CorpusResource) : [],
          editions: Array.isArray(data.editions) ? data.editions.map((item) => asRecord(item) as CorpusResource) : [],
          artifacts: Array.isArray(data.artifacts) ? data.artifacts.map((item) => asRecord(item) as CorpusResource) : [],
          dataset: normalizeDataset(data.dataset),
        },
      }
    } catch {}
  }

  try {
    const hierarchy = await browserLoadWorkHierarchy(workId)
    if (hierarchy) return { data: hierarchy, source: "browser" }
  } catch (browserError) {
    return catalogResult(
      (catalog) => catalog.hierarchies[workId] ?? { work: null, expressions: [], editions: [], artifacts: [], dataset: null },
      browserError,
    )
  }

  return catalogResult(
    (catalog) => catalog.hierarchies[workId] ?? { work: null, expressions: [], editions: [], artifacts: [], dataset: null },
  )
}

export async function loadPassageTrace(passage: Passage): Promise<LoadResult<PassageTrace>> {
  if (API_BASE) {
    try {
      const payload = await requestJson<{ data?: unknown }>("/v1/passages/" + encodeURIComponent(passage.id))
      const data = asRecord(payload.data)
      const normalized = normalizePassageBundle({ passage: data.passage, contents: data.contents }, passage.workId)
      return {
        source: "api",
        data: {
          passage: normalized,
          rawPassage: asRecord(data.passage) as CorpusResource,
          contents: Array.isArray(data.contents) ? data.contents.map(normalizeContent) : [],
          artifacts: Array.isArray(data.artifacts) ? data.artifacts.map((item) => asRecord(item) as CorpusResource) : [],
          provenanceRecords: Array.isArray(data.provenance) ? data.provenance.map((item) => asRecord(item) as ProvenanceRecord) : [],
          evidence: Array.isArray(data.evidence) ? data.evidence.map((item) => asRecord(item) as EvidenceRecord) : [],
          relations: Array.isArray(data.relations) ? data.relations.map((item) => asRecord(item) as CorpusResource) : [],
          dataset: normalizeDataset(data.dataset),
        },
      }
    } catch {}
  }

  try {
    const browserTrace = await browserLoadPassageTrace(passage)
    const catalog = await loadCatalog().catch(() => null)
    const catalogTrace = catalog?.traces[passage.id]
    return {
      source: "browser",
      data: catalogTrace ? {
        ...browserTrace,
        artifacts: catalogTrace.artifacts,
        provenanceRecords: catalogTrace.provenanceRecords,
        evidence: catalogTrace.evidence,
        relations: catalogTrace.relations,
        dataset: browserTrace.dataset ?? catalogTrace.dataset,
      } : browserTrace,
    }
  } catch (browserError) {
    return catalogResult((catalog) => catalog.traces[passage.id] ?? {
      passage,
      contents: passage.contents ?? [],
      artifacts: [],
      provenanceRecords: [],
      evidence: [],
      relations: [],
      dataset: null,
    }, browserError)
  }
}

function catalogSearch(catalog: CorpusCatalog, query: string, tradition?: string) {
  const needle = query.toLowerCase()
  return catalog.searchRecords.filter((record) => {
    const haystack = [record.id, record.title, record.kind, record.tradition, record.language, record.snippet, record.source]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return haystack.includes(needle) && (!tradition || record.tradition === tradition)
  })
}

export async function searchCorpus(query: string, tradition?: string, offset = 0, limit = 20): Promise<PageResult<SearchRecord>> {
  const clean = query.trim()
  if (!clean) return { data: [], source: API_BASE ? "api" : "browser", offset: 0, limit, hasMore: false }

  if (API_BASE) {
    try {
      const params = new URLSearchParams({ q: clean, limit: String(limit), offset: String(offset) })
      if (tradition) params.set("tradition", tradition)
      const payload = await requestJson<{ data?: unknown[]; hasMore?: boolean; latencyMs?: number; offset?: number; limit?: number }>(
        "/v1/search?" + params.toString(),
      )
      const rows = Array.isArray(payload.data) ? payload.data : []
      return {
        source: "api",
        offset: payload.offset ?? offset,
        limit: payload.limit ?? limit,
        hasMore: Boolean(payload.hasMore),
        latencyMs: payload.latencyMs,
        data: rows.map((item, index) => {
          const row = asRecord(item)
          return {
            id: stringValue(row.id) ?? "result-" + String(index + 1),
            title: stringValue(row.label, row.title) ?? "Corpus record",
            kind: stringValue(row.kind) ?? "record",
            recordType: stringValue(row.recordType, row.record_type),
            tradition: stringValue(row.tradition),
            language: stringValue(row.language),
            snippet: stringValue(row.label, row.snippet),
            source: stringValue(row.datasetId, row.dataset_id),
            datasetId: stringValue(row.datasetId, row.dataset_id),
            workId: stringValue(row.workId, row.work_id),
            score: numberValue(row.score),
          }
        }),
      }
    } catch {}
  }

  try {
    const page = await browserSearchCorpus(clean, tradition, offset, limit)
    return { ...page, source: "browser", offset, limit }
  } catch (browserError) {
    const result = await catalogResult((catalog) => catalogSearch(catalog, clean, tradition), browserError)
    const data = result.data.slice(offset, offset + limit)
    return { data, source: "catalog", offset, limit, hasMore: offset + data.length < result.data.length, error: result.error }
  }
}

export async function loadAssertionTraversal(assertionId: string): Promise<LoadResult<AssertionTraversal | null>> {
  const id = assertionId.trim()
  if (!id) return { data: null, source: API_BASE ? "api" : "browser" }

  if (API_BASE) {
    try {
      const payload = await requestJson<{ data?: unknown }>("/v1/assertions/" + encodeURIComponent(id) + "/traversal")
      const data = asRecord(payload.data)
      return {
        source: "api",
        data: {
          assertion: asRecord(data.assertion),
          evidence: Array.isArray(data.evidence) ? data.evidence.map((item) => asRecord(item) as EvidenceRecord) : [],
          targets: Array.isArray(data.targets) ? data.targets.map(asRecord) : [],
        },
      }
    } catch {}
  }

  try {
    return { data: await browserTraverseAssertion(id), source: "browser" }
  } catch (browserError) {
    return { data: null, source: "catalog", error: errorMessage(browserError) }
  }
}

