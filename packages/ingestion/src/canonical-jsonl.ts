import type { CorpusRecord } from '@moonwitness/corpus-core'

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const object = value as Record<string, unknown>
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`
}

export function deterministicJsonl(records: CorpusRecord[]): string {
  const entries = records.map((record) => ({ record, json: canonicalJson(record) }))
  entries.sort((a, b) => {
    const byId = String(a.record.id).localeCompare(String(b.record.id))
    return byId || a.json.localeCompare(b.json)
  })
  return `${entries.map((entry) => entry.json).join('\n')}\n`
}
