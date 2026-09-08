import {
  fallbackPassages,
  fallbackSearchRecords,
  fallbackTraditions,
  fallbackWorks,
  type AssertionTraversal,
  type ContentLane,
  type CorpusResource,
  type DatasetInfo,
  type EvidenceRecord,
  type Passage,
  type PassageTrace,
  type ProvenanceRecord,
  type SearchRecord,
  type Tradition,
  type Work,
  type WorkHierarchy,
} from "./data"

const API_BASE = (import.meta.env.VITE_RGBL_API_URL as string | undefined)?.replace(/\/+$/, "") ?? ""
const REQUEST_TIMEOUT_MS = 8_000

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
}

export interface LoadResult<T> {
  data: T
  source: "api" | "fallback"
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

async function requestJson<T>(path: string): Promise<T> {
  if (!API_BASE) throw new Error("RGBL API URL is not configured")
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`RGBL API returned ${response.status}`)
    return await response.json() as T
  } finally {
    window.clearTimeout(timeout)
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.name === "AbortError" ? "RGBL API request timed out" : error.message
  return "RGBL API request failed"
}

export async function loadHealth(): Promise<LoadResult<ApiHealth | null>> {
  if (!API_BASE) return { data: null, source: "fallback" }
  try {
    return { data: await requestJson<ApiHealth>("/v1/health"), source: "api" }
  } catch (error) {
    return { data: null, source: "fallback", error: errorMessage(error) }
  }
}

export async function loadTraditions(): Promise<LoadResult<Tradition[]>> {
  if (!API_BASE) return { data: fallbackTraditions, source: "fallback" }
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
    return { data: fallbackTraditions, source: "fallback", error: errorMessage(error) }
  }
}

export async function loadWorks(): Promise<LoadResult<Work[]>> {
  if (!API_BASE) return { data: fallbackWorks, source: "fallback" }
  try {
    const payload = await requestJson<{ data?: unknown[] }>("/v1/works")
    const rows = Array.isArray(payload.data) ? payload.data : []
    return {
      source: "api",
      data: rows.map((item, index) => {
        const row = asRecord(item)
        const id = stringValue(row.id, row.canonical_id, row.canonicalId) ?? `work-${index + 1}`
        const title = stringValue(row.title_en, row.title_id, row.title_native, row.title, row.name) ?? id
        const workType = stringValue(row.work_type, row.workType)
        const datasetId = stringValue(row.dataset_id, row.datasetId)
        return {
          id,
          title,
          tradition: stringValue(row.tradition) ?? "unscoped",
          language: stringValue(row.source_language, row.language),
          description: workType ? `${workType.replaceAll("_", " ")} · canonical textual.work` : "Canonical textual.work record.",
          source: datasetId ?? "RGBL canonical corpus",
          datasetId,
          rights: stringValue(row.rights),
          availability: stringValue(row.availability),
        }
      }),
    }
  } catch (error) {
    return { data: fallbackWorks, source: "fallback", error: errorMessage(error) }
  }
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
  const id = stringValue(passage.id) ?? `${workId}:passage:unknown`
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
      ? `${contents.length} exact content lane${contents.length === 1 ? "" : "s"} available.`
      : "No exact content lane was returned for this passage.",
    contents,
  }
}

export async function loadPassages(workId: string, offset = 0, limit = 12): Promise<PageResult<Passage>> {
  if (!API_BASE) {
    const all = fallbackPassages.filter((passage) => passage.workId === workId)
    const data = all.slice(offset, offset + limit)
    return { data, source: "fallback", offset, limit, total: all.length, hasMore: offset + data.length < all.length }
  }
  try {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const payload = await requestJson<{ data?: unknown[]; total?: number; hasMore?: boolean; limit?: number; offset?: number }>(
      `/v1/works/${encodeURIComponent(workId)}/passages?${params.toString()}`,
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
  } catch (error) {
    const all = fallbackPassages.filter((passage) => passage.workId === workId)
    return { data: all, source: "fallback", offset: 0, limit, total: all.length, hasMore: false, error: errorMessage(error) }
  }
}

function fallbackHierarchy(workId: string): WorkHierarchy {
  const work = fallbackWorks.find((item) => item.id === workId)
  const resources = (ids: Array<string | undefined>, kind: string) =>
    ids.filter((id): id is string => Boolean(id)).map((id) => ({ id, record_type: "resource", kind }))
  return {
    work: work ? { id: work.id, record_type: "resource", kind: "textual.work", labels: [{ value: work.title, role: "preferred", language: "en" }] } : null,
    expressions: resources([work?.featuredExpression], "textual.expression"),
    editions: resources([work?.featuredEdition], "textual.edition"),
    artifacts: [],
    dataset: work?.datasetId ? { id: work.datasetId, rights: work.rights, availability: work.availability } : null,
  }
}

export async function loadWorkHierarchy(workId: string): Promise<LoadResult<WorkHierarchy>> {
  if (!API_BASE) return { data: fallbackHierarchy(workId), source: "fallback" }
  try {
    const payload = await requestJson<{ data?: unknown }>(`/v1/works/${encodeURIComponent(workId)}`)
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
  } catch (error) {
    return { data: fallbackHierarchy(workId), source: "fallback", error: errorMessage(error) }
  }
}

export async function loadPassageTrace(passage: Passage): Promise<LoadResult<PassageTrace>> {
  if (!API_BASE) {
    return {
      source: "fallback",
      data: {
        passage,
        contents: passage.contents ?? [],
        artifacts: [],
        provenanceRecords: [],
        evidence: [],
        relations: [],
        dataset: null,
      },
    }
  }
  try {
    const payload = await requestJson<{ data?: unknown }>(`/v1/passages/${encodeURIComponent(passage.id)}`)
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
  } catch (error) {
    return {
      source: "fallback",
      error: errorMessage(error),
      data: {
        passage,
        contents: passage.contents ?? [],
        artifacts: [],
        provenanceRecords: [],
        evidence: [],
        relations: [],
        dataset: null,
      },
    }
  }
}

export async function searchCorpus(query: string, tradition?: string, offset = 0, limit = 20): Promise<PageResult<SearchRecord>> {
  const clean = query.trim()
  if (!clean) return { data: [], source: API_BASE ? "api" : "fallback", offset: 0, limit, hasMore: false }

  if (API_BASE) {
    try {
      const params = new URLSearchParams({ q: clean, limit: String(limit), offset: String(offset) })
      if (tradition) params.set("tradition", tradition)
      const payload = await requestJson<{ data?: unknown[]; hasMore?: boolean; latencyMs?: number; offset?: number; limit?: number }>(
        `/v1/search?${params.toString()}`,
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
            id: stringValue(row.id) ?? `result-${index + 1}`,
            title: stringValue(row.label, row.title) ?? "Corpus record",
            kind: stringValue(row.kind) ?? "record",
            recordType: stringValue(row.recordType, row.record_type),
            tradition: stringValue(row.tradition),
            language: stringValue(row.language),
            snippet: stringValue(row.label, row.snippet),
            source: stringValue(row.datasetId, row.dataset_id),
            datasetId: stringValue(row.datasetId, row.dataset_id),
            score: numberValue(row.score),
          }
        }),
      }
    } catch (error) {
      const fallback = fallbackSearch(clean, tradition)
      return { data: fallback, source: "fallback", offset: 0, limit, hasMore: false, error: errorMessage(error) }
    }
  }

  return { data: fallbackSearch(clean, tradition), source: "fallback", offset: 0, limit, hasMore: false }
}

function fallbackSearch(query: string, tradition?: string) {
  const needle = query.toLowerCase()
  return fallbackSearchRecords.filter((record) => {
    const haystack = [record.id, record.title, record.kind, record.tradition, record.language, record.snippet, record.source]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return haystack.includes(needle) && (!tradition || record.tradition === tradition)
  })
}

export async function loadAssertionTraversal(assertionId: string): Promise<LoadResult<AssertionTraversal | null>> {
  const id = assertionId.trim()
  if (!id || !API_BASE) return { data: null, source: "fallback" }
  try {
    const payload = await requestJson<{ data?: unknown }>(`/v1/assertions/${encodeURIComponent(id)}/traversal`)
    const data = asRecord(payload.data)
    return {
      source: "api",
      data: {
        assertion: asRecord(data.assertion),
        evidence: Array.isArray(data.evidence) ? data.evidence.map((item) => asRecord(item) as EvidenceRecord) : [],
        targets: Array.isArray(data.targets) ? data.targets.map(asRecord) : [],
      },
    }
  } catch (error) {
    return { data: null, source: "fallback", error: errorMessage(error) }
  }
}
