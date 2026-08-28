import type {
  AssertionObject,
  CanonicalId,
  CorpusRecord,
  Resource
} from '@moonwitness/corpus-core'

export const COMPARISON_BOUNDARY =
  'This view places records side by side for inspection. It does not assert identity, equivalence, shared authority, or factual agreement between them.'

export function encodeId(id: string): string {
  return encodeURIComponent(id)
}

export function canonicalHref(id: CanonicalId | string): string {
  return `/record/${encodeId(id as CanonicalId)}`
}

export function datasetHref(id: CanonicalId | string): string {
  return `/datasets/${encodeId(id as CanonicalId)}`
}

export function hrefForRecord(id: CanonicalId, recordType: CorpusRecord['record_type'], kind?: string): string {
  const encoded = encodeId(id)
  if (recordType === 'entity') return `/entity/${encoded}`
  if (recordType === 'resource') return kind === 'textual.passage' ? `/passage/${encoded}` : `/resource/${encoded}`
  if (recordType === 'assertion') return `/assertion/${encoded}`
  if (recordType === 'evidence') return `/evidence/${encoded}`
  if (recordType === 'provenance') return `/provenance/${encoded}`
  return `/record/${encoded}`
}

export function recordHref(record: CorpusRecord): string {
  return hrefForRecord(record.id, record.record_type, 'kind' in record ? record.kind : undefined)
}

export function preferredLabel(record: CorpusRecord): string | undefined {
  if (!('labels' in record) || !record.labels?.length) return undefined
  return record.labels.find((label) => label.role === 'preferred')?.value ?? record.labels[0]?.value
}

export function displayName(record: CorpusRecord): string {
  return preferredLabel(record) ?? record.id
}

export function assertionObjectText(object: AssertionObject): string {
  if ('entity' in object) return object.entity
  if (object.value === null) return 'null'
  if (typeof object.value === 'string') return object.value
  return JSON.stringify(object.value)
}

export function textualPayload(resource: Resource): Record<string, unknown> | null {
  const textual = resource.extensions?.textual
  return textual && typeof textual === 'object' && !Array.isArray(textual)
    ? textual as Record<string, unknown>
    : null
}

export function isRtlScript(script: unknown): boolean {
  return script === 'Arab' || script === 'Hebr' || script === 'Syrc' || script === 'Thaa'
}

export function clampGraphDepth(value: unknown): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.min(3, Math.max(1, Math.trunc(parsed)))
}

export interface FriendlyDatasetInfo {
  title: string
  subtitle: string
  tradition: string
  icon: string
  badge: string
  description: string
}

export function getDatasetFriendlyMeta(id: string, manifest?: { profiles?: string[]; sources?: Array<{ role?: string }> }): FriendlyDatasetInfo {
  const cleanId = id.replace(/^mw:dataset:/, '')
  const parts = cleanId.split(':')
  const domain = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'General'

  // Format clean human title from canonical id segments
  const title = parts
    .map((p) => p.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
    .join(' · ')

  // Profile-based badge (directly from manifest.profiles or canonical namespace)
  const profile = manifest?.profiles?.[0]
  let badge = 'Dataset'
  let icon = '📦'

  if (profile?.startsWith('textual') || cleanId.includes('quran') || cleanId.includes('bible') || cleanId.includes('oshb') || cleanId.includes('dhammapada') || cleanId.includes('gita')) {
    badge = 'Kitab Suci / Teks'
    icon = '📖'
  } else if (profile?.startsWith('lexicon') || cleanId.includes('lexicon')) {
    badge = 'Leksikon'
    icon = '📚'
  } else if (profile?.startsWith('devotional') || cleanId.includes('devotional')) {
    badge = 'Doa & Liturgi'
    icon = '🤲'
  } else if (profile?.startsWith('research-graph') || cleanId.includes('research-graph')) {
    badge = 'Graf Riset'
    icon = '🕸️'
  } else if (profile?.startsWith('entity') || cleanId.includes('world-religions')) {
    badge = 'Registri Entitas'
    icon = '🌐'
  }

  return {
    title,
    subtitle: `Paket korpus kanonikal ${domain}`,
    tradition: domain,
    icon,
    badge,
    description: `Paket data kanonikal MoonWitness ${cleanId} ber-provenance dan checksum SHA-256 terverifikasi.`
  }
}
