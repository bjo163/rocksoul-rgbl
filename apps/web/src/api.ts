import {
  fallbackPassages,
  fallbackSearchRecords,
  fallbackTraditions,
  fallbackWorks,
  type Passage,
  type SearchRecord,
  type Tradition,
  type Work,
} from "./data"

const API_BASE = (import.meta.env.VITE_RGBL_API_URL as string | undefined)?.replace(/\/+$/, "") ?? ""

export const rgblApiConfigured = Boolean(API_BASE)

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {}
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value
  }
  return undefined
}

async function getData(path: string) {
  if (!API_BASE) throw new Error("RGBL API URL is not configured")
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { accept: "application/json" },
  })
  if (!response.ok) throw new Error(`RGBL API returned ${response.status}`)
  const payload = await response.json() as { data?: unknown }
  return Array.isArray(payload.data) ? payload.data : []
}

export async function loadTraditions(): Promise<Tradition[]> {
  try {
    const rows = await getData("/v1/traditions")
    return rows.map((item) => {
      const row = asRecord(item)
      return {
        id: stringValue(row.id, row.tradition) ?? "unknown",
        name: stringValue(row.name, row.tradition) ?? "Unknown tradition",
        datasetCount: typeof row.datasetCount === "number" ? row.datasetCount : undefined,
        totalRecords: typeof row.totalRecords === "number" ? row.totalRecords : undefined,
        primaryLanguage: stringValue(row.primaryLanguage),
        scripts: Array.isArray(row.scripts) ? row.scripts.filter((value): value is string => typeof value === "string") : [],
      }
    })
  } catch {
    return fallbackTraditions
  }
}

export async function loadWorks(): Promise<Work[]> {
  try {
    const rows = await getData("/v1/works")
    return rows.map((item, index) => {
      const row = asRecord(item)
      const labels = Array.isArray(row.labels) ? row.labels : []
      const firstLabel = asRecord(labels[0])
      return {
        id: stringValue(row.id, row.canonical_id, row.canonicalId) ?? `work-${index + 1}`,
        title: stringValue(row.title, row.name, row.label, firstLabel.value) ?? "Untitled work",
        tradition: stringValue(row.tradition, row.family, row.domain) ?? "unscoped",
        language: stringValue(row.language, row.lang),
        description: stringValue(row.description, row.summary, row.note),
        source: stringValue(row.source, row.dataset),
      }
    })
  } catch {
    return fallbackWorks
  }
}

export async function loadPassages(workId: string): Promise<Passage[]> {
  try {
    const rows = await getData(`/v1/works/${encodeURIComponent(workId)}/passages?limit=12&offset=0`)
    return rows.map((item, index) => {
      const row = asRecord(item)
      const textual = asRecord(asRecord(row.extensions).textual)
      const source = asRecord(asRecord(row.extensions).source)
      const id = stringValue(row.id, row.canonical_id) ?? `${workId}:passage:${index + 1}`
      return {
        id,
        workId,
        locator: stringValue(row.locator, row.reference, row.citation, textual.target) ?? id,
        label: stringValue(row.title, row.label, row.reference, textual.target) ?? id,
        language: stringValue(row.language, textual.language),
        source: stringValue(row.source, source.artifact) ?? "RGBL corpus",
        provenance: stringValue(row.provenance, source.provenance) ?? "Canonical corpus provenance available through RGBL.",
        note: stringValue(row.text, textual.text, row.description),
      }
    })
  } catch {
    return fallbackPassages.filter((passage) => passage.workId === workId)
  }
}

export async function searchCorpus(query: string, tradition?: string): Promise<SearchRecord[]> {
  const clean = query.trim()
  if (!clean) return []

  if (API_BASE) {
    try {
      const params = new URLSearchParams({ q: clean, limit: "20", offset: "0" })
      if (tradition) params.set("tradition", tradition)
      const rows = await getData(`/v1/search?${params.toString()}`)
      return rows.map((item, index) => {
        const row = asRecord(item)
        const textual = asRecord(asRecord(row.extensions).textual)
        return {
          id: stringValue(row.id, row.canonical_id) ?? `result-${index + 1}`,
          title: stringValue(row.title, row.label, row.reference, textual.target) ?? "Corpus record",
          kind: stringValue(row.kind, row.record_type, row.type) ?? "record",
          tradition: stringValue(row.tradition),
          language: stringValue(row.language, textual.language),
          snippet: stringValue(row.text, row.snippet, row.description, textual.text),
          source: stringValue(row.source, asRecord(row.extensions).source),
          raw: row,
        }
      })
    } catch {
      // Fall through to the local metadata fallback so the deployed UI remains useful.
    }
  }

  const needle = clean.toLowerCase()
  return fallbackSearchRecords.filter((record) => {
    const haystack = [record.id, record.title, record.kind, record.tradition, record.language, record.snippet, record.source]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return haystack.includes(needle) && (!tradition || record.tradition === tradition)
  })
}
