import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

const WORK = 'mw:work:ancient-egypt:book-of-dead'
const EXPRESSION = 'mw:expression:ancient-egypt:book-of-dead:en-budge'
const EDITION = 'mw:edition:ancient-egypt:book-of-dead:budge'
const ARTIFACT = 'mw:artifact:ancient-egypt:book-of-dead:budge'
const PROVENANCE = 'mw:provenance:ancient-egypt:book-of-dead:budge'

interface ParsedChapter { number: number; title: string; text: string }
interface TextualExtension { unit?: string; [key: string]: unknown }

function extractChapters(text: string): ParsedChapter[] {
  const cleaned = text.replace(/\r/g, '')
  const marker = /^(?:CHAPTER\s+([0-9IVXLCDM]+)[.: -]+(.+)|\[CHAPTER\s+([0-9IVXLCDM]+)\]\s*(.*))$/gim
  const hits: Array<{ index: number; number: number; title: string }> = []
  let match: RegExpExecArray | null
  while ((match = marker.exec(cleaned))) {
    const rawNumber = match[1] ?? match[3]
    const number = /^\d+$/u.test(rawNumber) ? Number(rawNumber) : 0
    if (number > 0) hits.push({ index: match.index, number, title: (match[2] ?? match[4] ?? '').trim() })
  }
  const chapters: ParsedChapter[] = []
  for (let i = 0; i < hits.length; i += 1) {
    const current = hits[i]
    const next = hits[i + 1]
    const body = cleaned.slice(current.index, next?.index ?? cleaned.length).replace(marker, '').trim()
    if (body.length < 40) continue
    chapters.push({ number: current.number, title: current.title || `Chapter ${current.number}`, text: body })
  }
  return chapters
}

export const hooks: RecipeHooks<string, ParsedChapter[]> = {
  parse(bytes) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    if (/<!doctype\s+html|<html[\s>]|captcha|cloudflare/i.test(text.slice(0, 12000))) {
      throw new Error('Rejected non-corpus HTML/CAPTCHA response from upstream')
    }
    if (!text.includes('*** START OF THIS PROJECT GUTENBERG EBOOK')) throw new Error('Missing Project Gutenberg start marker')
    if (!text.includes('*** END OF THIS PROJECT GUTENBERG EBOOK')) throw new Error('Missing Project Gutenberg end marker')
    return text
  },
  normalize(text) {
    return extractChapters(text)
  },
  map(chapters, context) {
    const records: CorpusRecord[] = [
      { id: WORK, record_type: 'resource', kind: 'textual.work', labels: [{ value: 'The Book of the Dead', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text', tradition: 'ancient-egyptian' } } },
      { id: EXPRESSION, record_type: 'resource', kind: 'textual.expression', labels: [{ value: 'The Book of the Dead — Budge', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work: WORK, language: 'en' } } },
      { id: EDITION, record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'E. A. Wallis Budge historical English edition' } } },
      { id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact', extensions: { textual: { represents: EDITION, representation_kind: 'project_gutenberg_plain_text', media_type: 'text/plain' }, source: { artifact: ARTIFACT, provenance: PROVENANCE, institution: 'mw:institution:project-gutenberg', language: 'en', title: 'The Book of the Dead', descriptor: { locations: [context.acquisition.resolved_location], media_type: 'text/plain; charset=utf-8', byte_size: context.acquisition.source.byte_size, sha256: context.acquisition.sha256 }, rights: { status: 'public_domain_in_usa', redistribution: 'verify_target_jurisdiction', license_expression: 'Project Gutenberg License', attribution: 'Sir E. A. Wallis Budge' } } } },
      { id: PROVENANCE, record_type: 'provenance', source: ARTIFACT, source_reference: 'Project Gutenberg ebook 7145; E. A. Wallis Budge; plain-text acquisition', activities: [{ type: 'acquisition', method: 'Pinned Project Gutenberg plain-text endpoint with corpus-marker and HTML/CAPTCHA rejection', software: { name: 'mw:recipe:ancient-egypt:book-of-dead:budge', version: '1' } }] }
    ]
    for (const chapter of chapters) {
      const target = `mw:passage:ancient-egypt:book-of-dead:budge:${chapter.number}` as `mw:${string}`
      const contentId = `mw:content:ancient-egypt:book-of-dead:budge:${chapter.number}` as `mw:${string}`
      records.push({ id: target, record_type: 'resource', kind: 'textual.passage', labels: [{ value: chapter.title, role: 'preferred', language: 'en' }], extensions: { textual: { container: EXPRESSION, unit: 'chapter', sequence: chapter.number, local_id: String(chapter.number) } } } as CorpusRecord)
      records.push({ id: contentId, record_type: 'resource', kind: 'textual.content', extensions: { textual: { target, language: 'en', script: 'Latn', representation: 'source', text: chapter.text }, source: { artifact: ARTIFACT, provenance: PROVENANCE } } } as CorpusRecord)
    }
    return records
  },
  validate(records) {
    const ids = records.map((record) => record.id)
    if (new Set(ids).size !== ids.length) return ['mapped record IDs must be unique']
    const chapters = records.filter((record) => ((record.extensions?.textual ?? {}) as TextualExtension).unit === 'chapter')
    if (chapters.length < 10) return [`Expected substantial chapter extraction, received ${chapters.length}`]
    return []
  }
}
