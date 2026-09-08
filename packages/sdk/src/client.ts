import path from 'node:path'
import { existsSync } from 'node:fs'
import { SqliteCorpusRepository } from '@moonwitness/corpus-node'
import type { CanonicalId, Resource } from '@moonwitness/corpus-core'

export interface MoonWitnessConfig {
  dbPath?: string
  apiEndpoint?: string
}

export interface ParallelVerse {
  id: string
  label?: string
  sourceText?: { language: string; script?: string; text: string }
  indonesianText?: { language: string; text: string }
  englishText?: { language: string; text: string }
  otherTexts?: Array<{ language: string; script?: string; text: string }>
}

function resolvePassageId(input: string): string {
  if (input.startsWith('mw:passage:')) return input
  const clean = input.replace(/^mw:/, '')

  // Common shorthands
  if (clean.startsWith('bhagavad-gita:') || clean.startsWith('gita:')) {
    return `mw:passage:hinduism:bhagavad-gita:${clean.split(':').slice(1).join(':')}`
  }
  if (clean.startsWith('yoga-sutras:') || clean.startsWith('yoga:')) {
    return `mw:passage:hinduism:yoga-sutras:${clean.split(':').slice(1).join(':')}`
  }
  if (clean.startsWith('tao-te-ching:') || clean.startsWith('tao:')) {
    return `mw:passage:taoism:tao-te-ching:${clean.split(':').slice(1).join(':')}`
  }
  if (clean.startsWith('analects:') || clean.startsWith('lunyu:')) {
    return `mw:passage:confucianism:analects:${clean.split(':').slice(1).join(':')}`
  }
  if (clean.startsWith('hadith-nawawi:') || clean.startsWith('hadith-nawawi-40:') || clean.startsWith('hadith:nawawi-40:') || clean.startsWith('nawawi:')) {
    return `mw:passage:hadith:nawawi-40:${clean.split(':').pop()}`
  }
  if (clean.startsWith('hadith-bukhari:') || clean.startsWith('hadith:bukhari:') || clean.startsWith('bukhari:')) {
    return `mw:passage:hadith:bukhari:${clean.split(':').pop()}`
  }
  if (clean.startsWith('gathas:') || clean.startsWith('zarathustra:') || clean.startsWith('gathas-zarathustra:')) {
    return `mw:passage:zoroastrianism:gathas:${clean.split(':').pop()}`
  }

  return `mw:passage:${clean}`
}

function resolveWorkId(input: string): string {
  if (input.startsWith('mw:work:')) return input
  const clean = input.replace(/^mw:/, '')

  if (clean === 'bhagavad-gita' || clean === 'gita') return 'mw:work:hinduism:bhagavad-gita'
  if (clean === 'yoga-sutras' || clean === 'yoga') return 'mw:work:hinduism:yoga-sutras'
  if (clean === 'tao-te-ching' || clean === 'tao') return 'mw:work:taoism:tao-te-ching'
  if (clean === 'analects' || clean === 'lunyu') return 'mw:work:confucianism:analects'
  if (clean === 'hadith-nawawi-40' || clean === 'nawawi') return 'mw:work:hadith:nawawi-40'
  if (clean === 'hadith-bukhari' || clean === 'bukhari') return 'mw:work:hadith:bukhari'
  if (clean === 'gathas' || clean === 'zarathustra') return 'mw:work:zoroastrianism:gathas'

  return `mw:work:${clean}`
}

export class MoonWitness {
  private repo?: SqliteCorpusRepository
  private apiEndpoint?: string

  constructor(config: MoonWitnessConfig = {}) {
    if (config.apiEndpoint) {
      this.apiEndpoint = config.apiEndpoint.replace(/\/$/, '')
    } else {
      this.repo = SqliteCorpusRepository.open(config.dbPath)
    }
  }

  static async open(config: MoonWitnessConfig = {}): Promise<MoonWitness> {
    return new MoonWitness(config)
  }

  // --- 1. Passages API ---
  passages = {
    get: async (passageId: string): Promise<ParallelVerse | null> => {
      const canonicalId = resolvePassageId(passageId) as CanonicalId

      if (this.repo) {
        const raw = this.repo.getPassageWithContents(canonicalId)
        if (!raw) return null
        return this.formatParallelVerse(raw.passage, raw.contents)
      } else if (this.apiEndpoint) {
        const res = await fetch(`${this.apiEndpoint}/v1/passages/${encodeURIComponent(canonicalId)}`)
        if (!res.ok) return null
        const payload = (await res.json()) as { data?: { passage?: Resource; contents?: Resource[] }; passage?: Resource; contents?: Resource[] }
        const data = payload.data ?? payload
        if (!data.passage) return null
        return this.formatParallelVerse(data.passage, data.contents ?? [])
      }
      return null
    }
  }

  // --- 2. Works API ---
  works = {
    get: async (workId: string): Promise<any | null> => {
      const canonicalId = resolveWorkId(workId) as CanonicalId
      if (this.repo) {
        return this.repo.getRecord(canonicalId)
      } else if (this.apiEndpoint) {
        const res = await fetch(`${this.apiEndpoint}/v1/works/${encodeURIComponent(canonicalId)}`)
        if (!res.ok) return null
        const payload = (await res.json()) as { data?: { work?: unknown } | unknown }
        const data = payload.data
        return data && typeof data === 'object' && 'work' in data ? (data as { work: unknown }).work : data ?? payload
      }
      return null
    },

    getPassages: async (workId: string, page = 1, limit = 20): Promise<{ page: number; limit: number; passages: ParallelVerse[] }> => {
      const canonicalId = resolveWorkId(workId) as CanonicalId
      const offset = (page - 1) * limit

      if (this.repo) {
        const items = this.repo.getWorkPassages(canonicalId, limit, offset)
        return {
          page,
          limit,
          passages: items.map((i) => this.formatParallelVerse(i.passage, i.contents))
        }
      } else if (this.apiEndpoint) {
        const res = await fetch(`${this.apiEndpoint}/v1/works/${encodeURIComponent(canonicalId)}/passages?page=${page}&limit=${limit}`)
        const data = (await res.json()) as any
        return {
          page,
          limit,
          passages: (data.data || data.passages || []).map((i: any) => this.formatParallelVerse(i.passage, i.contents || []))
        }
      }
      return { page, limit, passages: [] }
    }
  }

  // --- 3. Devotionals API (Duas, Asmaul Husna, Mantras, Prayers) ---
  devotionals = {
    list: async (filter: { tradition?: string; category?: string; limit?: number } = {}): Promise<any[]> => {
      if (this.repo) {
        return this.repo.getDevotionals(filter.tradition, filter.category, filter.limit ?? 50)
      } else if (this.apiEndpoint) {
        const params = new URLSearchParams()
        if (filter.tradition) params.set('tradition', filter.tradition)
        if (filter.category) params.set('category', filter.category)
        if (filter.limit) params.set('limit', String(filter.limit))
        const res = await fetch(`${this.apiEndpoint}/v1/devotionals?${params}`)
        const data = (await res.json()) as any
        return data.data || data.items || []
      }
      return []
    }
  }

  // --- 4. Search API ---
  async search(query: string, options: { limit?: number; offset?: number } = {}): Promise<any[]> {
    if (this.repo) {
      return this.repo.search({ text: query, limit: options.limit ?? 20, offset: options.offset ?? 0 })
    } else if (this.apiEndpoint) {
      const res = await fetch(`${this.apiEndpoint}/v1/search?q=${encodeURIComponent(query)}&limit=${options.limit ?? 20}&offset=${options.offset ?? 0}`)
      const data = (await res.json()) as any
      return data.data || data.results || []
    }
    return []
  }

  // --- Helper ---
  private formatParallelVerse(passage: Resource, contents: Resource[]): ParallelVerse {
    let sourceText: ParallelVerse['sourceText']
    let indonesianText: ParallelVerse['indonesianText']
    let englishText: ParallelVerse['englishText']
    const otherTexts: Array<{ language: string; script?: string; text: string }> = []

    for (const c of contents) {
      const ext = (c as any).extensions?.textual ?? {}
      const lang = ext.language || ''
      const script = ext.script
      const text = ext.text || ''

      if (lang === 'id' || lang === 'ind') {
        indonesianText = { language: lang, text }
      } else if (lang === 'en' || lang === 'eng') {
        englishText = { language: lang, text }
      } else if (['ar', 'sa', 'zh', 'lzh', 'he', 'grc', 'ae', 'pi', 'pli'].includes(lang) || ext.representation === 'source') {
        if (!sourceText) {
          sourceText = { language: lang, script, text }
        } else {
          otherTexts.push({ language: lang, script, text })
        }
      } else {
        otherTexts.push({ language: lang, script, text })
      }
    }

    return {
      id: passage.id,
      label: passage.labels?.[0]?.value,
      sourceText,
      indonesianText,
      englishText,
      otherTexts
    }
  }

  close(): void {
    this.repo?.close()
  }
}
