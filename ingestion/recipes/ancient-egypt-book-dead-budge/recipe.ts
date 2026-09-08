import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

const WORK = 'mw:work:ancient-egyptian:book-dead'
const EXPRESSION = 'mw:expression:ancient-egyptian:book-dead:budge'
const EDITION = 'mw:edition:ancient-egyptian:book-dead:budge'
const ARTIFACT = 'mw:artifact:ancient-egyptian:book-dead:budge'
const PROVENANCE = 'mw:provenance:ancient-egyptian:book-dead:budge'

export interface ParsedBudge { chapters: Array<{ number: number; title: string; text: string }> }

const ROMAN: Record<string, number> = {}
for (let i = 1; i <= 220; i += 1) {
  let n = i
  let roman = ''
  for (const [value, numeral] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']] as Array<[number,string]>) {
    while (n >= value) { roman += numeral; n -= value }
  }
  ROMAN[roman] = i
}

function parseChapters(text: string): ParsedBudge {
  const normalized = text.replace(/^.*?\*\*\* START OF THE PROJECT GUTENBERG EBOOK[^\n]*\n/su, '')
  const lines = normalized.split(/\r?\n/u)
  const starts: Array<{ index: number; number: number; title: string }> = []
  const heading = /^\s*CHAPTER\s+([IVXLCDM]+)\.?\s*$/iu
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(heading)
    if (!match) continue
    const number = ROMAN[match[1].toUpperCase()]
    if (!number) continue
    let title = `Chapter ${match[1].toUpperCase()}`
    for (let j = i + 1; j < Math.min(lines.length, i + 5); j += 1) {
      const candidate = lines[j].trim()
      if (candidate && !candidate.startsWith('PLATE ') && !candidate.startsWith('Notes')) {
        title = candidate.replace(/[._]+$/gu, '')
        break
      }
    }
    starts.push({ index: i, number, title })
  }
  if (starts.length < 100) throw new Error(`Expected at least 100 printed chapters, found ${starts.length}`)
  return { chapters: starts.map((item, index) => {
    const end = starts[index + 1]?.index ?? lines.length
    const body = lines.slice(item.index + 1, end).join('\n').replace(/\n{3,}/gu, '\n\n').trim()
    if (!body) throw new Error(`Empty chapter ${item.number}`)
    return { number: item.number, title: item.title, text: body }
  }) }
}

export const hooks: RecipeHooks<ParsedBudge, ParsedBudge> = {
  parse(bytes) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    if (!text.includes('PROJECT GUTENBERG EBOOK 7145')) throw new Error('Unexpected Gutenberg payload')
    if (/<(?:html|body|form|script)[\s>]/iu.test(text)) throw new Error('HTML/challenge payload rejected')
    if (!/E\.?\s*A\.?\s*WALLIS BUDGE/iu.test(text)) throw new Error('Unexpected author identity')
    return parseChapters(text)
  },
  normalize(parsed) {
    return { chapters: parsed.chapters.map(chapter => ({ ...chapter, text: chapter.text.replace(/\n{3,}/gu, '\n\n').trim() })) }
  },
  map(parsed, context) {
    const records: CorpusRecord[] = [
      { id: WORK, record_type: 'resource', kind: 'textual.work', labels: [{ value: 'The Book of the Dead', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text', tradition: 'ancient-egyptian' } } },
      { id: EXPRESSION, record_type: 'resource', kind: 'textual.expression', description: 'E. A. Wallis Budge English edition of The Book of the Dead.', extensions: { textual: { work: WORK, language: 'en', script: 'Latn' } } },
      { id: EDITION, record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'The Book of the Dead — E. A. Wallis Budge' } } },
      { id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact', labels: [{ value: 'Project Gutenberg #7145', role: 'preferred', language: 'en' }], extensions: { textual: { represents: EDITION, representation_kind: 'plain_text', media_type: 'text/plain' }, source: { title: 'The Book of the Dead', institution: 'Project Gutenberg', language: 'en', revision: 'eBook #7145', descriptor: { availability: 'remote', locations: ['https://www.gutenberg.org/cache/epub/7145/pg7145.txt'], media_type: 'text/plain', byte_size: context.acquisition.source.byte_size, sha256: context.acquisition.sha256 }, rights: { status: 'public_domain_in_usa', redistribution: 'per_project_gutenberg_terms', attribution: 'E. A. Wallis Budge / Project Gutenberg', rights_uri: 'https://www.gutenberg.org/ebooks/7145', note: 'Verify target-jurisdiction status before redistribution.' } } } },
      { id: PROVENANCE, record_type: 'provenance', source: ARTIFACT, source_reference: 'Project Gutenberg eBook #7145; E. A. Wallis Budge', activities: [{ type: 'acquisition', method: 'HTTP download of pinned plain-text edition with source identity and payload checks', software: { name: 'mw:recipe:ancient-egyptian:book-dead-budge', version: '1' } }, { type: 'parsing', method: 'Parse printed CHAPTER headings and preserve chapter bodies', software: { name: 'mw:recipe:ancient-egyptian:book-dead-budge', version: '1' } }] }
    ]
    for (const chapter of parsed.chapters) {
      const passage = `mw:passage:ancient-egyptian:book-dead-budge:${chapter.number}`
      const content = `mw:content:ancient-egyptian:book-dead-budge:${chapter.number}:en`
      records.push({ id: passage, record_type: 'resource', kind: 'textual.passage', labels: [{ value: chapter.title, role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { container: EXPRESSION, unit: 'chapter', sequence: chapter.number, local_id: String(chapter.number), citation: `chapter-${chapter.number}` } } } as CorpusRecord)
      records.push({ id: content, record_type: 'resource', kind: 'textual.content', extensions: { textual: { target: passage, language: 'en', script: 'Latn', representation: 'source', text: chapter.text }, source: { artifact: ARTIFACT, provenance: PROVENANCE } } } as CorpusRecord)
    }
    return records
  },
  validate(records) {
    const passages = records.filter(record => record.kind === 'textual.passage')
    const contents = records.filter(record => record.kind === 'textual.content')
    const findings: string[] = []
    if (passages.length < 100) findings.push(`Expected at least 100 chapters, received ${passages.length}`)
    if (contents.length !== passages.length) findings.push('Chapter/content cardinality mismatch')
    if (new Set(records.map(record => record.id)).size !== records.length) findings.push('Duplicate record IDs')
    return findings
  }
}
