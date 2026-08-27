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

export function canonicalHref(id: CanonicalId): string {
  return `/record/${encodeId(id)}`
}

export function datasetHref(id: CanonicalId): string {
  return `/datasets/${encodeId(id)}`
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
  tradition: 'Islam' | 'Kekristenan' | 'Yudaisme' | 'Buddhisme' | 'Hinduisme' | 'Lintas Tradisi' | 'Sistem'
  icon: string
  badge: string
  description: string
}

export function getDatasetFriendlyMeta(id: string): FriendlyDatasetInfo {
  const cleanId = id.replace(/^mw:dataset:/, '')
  const lower = id.toLowerCase()

  let tradition: FriendlyDatasetInfo['tradition'] = 'Lintas Tradisi'
  let icon = '📦'
  let badge = 'Dataset'

  if (lower.includes('islam') || lower.includes('quran') || lower.includes('hadith') || lower.includes('tafsir')) {
    tradition = 'Islam'
    icon = lower.includes('hadith') ? '📜' : lower.includes('tafsir') ? '💡' : '🕌'
  } else if (lower.includes('christianity') || lower.includes('bible') || lower.includes('sblgnt') || lower.includes('tsi') || lower.includes('early-writings') || lower.includes('web-classic')) {
    tradition = 'Kekristenan'
    icon = lower.includes('early-writings') ? '📜' : '✝️'
  } else if (lower.includes('judaism') || lower.includes('oshb') || lower.includes('wlc') || lower.includes('mishnah') || lower.includes('avot')) {
    tradition = 'Yudaisme'
    icon = lower.includes('mishnah') ? '📜' : '✡️'
  } else if (lower.includes('buddhism') || lower.includes('dhammapada') || lower.includes('sutta') || lower.includes('sujato')) {
    tradition = 'Buddhisme'
    icon = '☸️'
  } else if (lower.includes('hinduism') || lower.includes('gita') || lower.includes('bhagavad') || lower.includes('sanskrit')) {
    tradition = 'Hinduisme'
    icon = '🕉️'
  } else if (lower.includes('devotional')) {
    tradition = 'Lintas Tradisi'
    icon = '🤲'
    badge = 'Doa & Liturgi'
  } else if (lower.includes('research-graph')) {
    tradition = 'Lintas Tradisi'
    icon = '🕸️'
    badge = 'Graf Evidensi'
  } else if (lower.includes('world-religions')) {
    tradition = 'Lintas Tradisi'
    icon = '🌐'
    badge = 'Registri Entitas'
  }

  if (lower.includes('lexicon')) {
    badge = 'Leksikon'
    icon = '📚'
  } else if (lower.includes('translation') || lower.includes('indonesian') || lower.includes('english') || lower.includes('tsi') || lower.includes('kemenag') || lower.includes('rwwad') || lower.includes('web-classic')) {
    badge = 'Terjemahan'
  } else if (lower.includes('quran') || lower.includes('wlc') || lower.includes('sblgnt') || lower.includes('gita') || lower.includes('dhammapada')) {
    badge = 'Kitab Suci'
  }

  // Format clean human title
  const parts = cleanId.split(':')
  const titleFormatted = parts
    .map((p) => p.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
    .join(' · ')

  return {
    title: titleFormatted,
    subtitle: `Paket kanonikal ${tradition}`,
    tradition,
    icon,
    badge,
    description: `Paket data kanonikal MoonWitness ${cleanId} ber-provenance dan checksum SHA-256 terverifikasi.`
  }
}
