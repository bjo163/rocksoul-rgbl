import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

const WORK = 'mw:work:ancient-egyptian:book-dead'
const EXPRESSION = 'mw:expression:ancient-egyptian:book-dead:renouf-1904'
const EDITION = 'mw:edition:ancient-egyptian:book-dead:renouf-1904'
const ARTIFACT = 'mw:artifact:ancient-egyptian:book-dead:renouf-1904'
const PROVENANCE = 'mw:provenance:ancient-egyptian:book-dead:renouf-1904'

export interface ParsedRenouf { chapters: Array<{ number: number; title: string; text: string }> }

const ROMAN: Record<string, number> = {}
for (let i = 1; i <= 220; i += 1) {
  let n = i
  let roman = ''
  for (const [value, numeral] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']] as Array<[number,string]>) {
    while (n >= value) { roman += numeral; n -= value }
  }
  ROMAN[roman] = i
}

function parseChapters(text: string): ParsedRenouf {
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
  return {
    chapters: starts.map((item, index) => {
      const end = starts[index + 1]?.index ?? lines.length
      const body = lines.slice(item.index + 1, end).join('\n').replace(/\n{3,}/gu, '\n\n').trim()
      if (!body) throw new Error(`Empty chapter ${item.number}`)
      return { number: item.number, title: item.title, text: body }
    })
  }
}

export const hooks: RecipeHooks<ParsedRenouf, ParsedRenouf> = {
  parse(bytes) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    if (!text.includes('PROJECT GUTENBERG EBOOK 69566')) throw new Error('Unexpected Gutenberg payload')
    if (/<(?:html|body|form|script)[\s>]/iu.test(text)) throw new Error('HTML/challenge payload rejected')
    if (!text.includes('P. LE PAGE RENOUF') || !text.includes('E. NAVILLE')) throw new Error('Unexpected translator identity')
    if (!text.includes('SOCIETY OF BIBLICAL ARCHAEOLOGY') || !text.includes('1904')) throw new Error('Unexpected edition identity')
    return parseChapters(text)
  },
  normalize(parsed) {
    return { chapters: parsed.chapters.map(chapter => ({ ...chapter, text: chapter.text.replace(/\n{3,}/gu, '\n\n').trim() })) }
  },
  map(parsed, context) {
    const records: CorpusRecord[] = [
      { id: WORK, record_type: 'resource', kind: 'textual.work', labels: [{ value: 'The Egyptian Book of the Dead', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text', tradition: 'ancient-egyptian' } } },
      { id: EXPRESSION, record_type: 'resource', kind: 'textual.expression', description: 'Translation and commentary by P. Le Page Renouf, continued and completed by Edouard Naville; 1904 edition.', extensions: { textual: { work: WORK, language: 'en', script: 'Latn' } } },
      { id: EDITION, record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'The Egyptian Book of the Dead — Renouf / Naville, 1904' } } },
      { id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact', labels: [{ value: 'Project Gutenberg #69566', role: 'preferred', language: 'en' }], extensions: { textual: { represents: EDITION, representation_kind: 'plain_text', media_type: 'text/plain' }, source: { title: 'The Egyptian Book of the dead', institution: 'Project Gutenberg', language: 'en', revision: 'eBook #69566', descriptor: { availability: 'remote', locations: ['https://www.gutenberg.org/cache/epub/69566/pg69566.txt'], media_type: 'text/plain', byte_size: context.acquisition.source.byte_size, sha256: context.acquisition.sha256 }, rights: { status: 'public_domain_in_usa', redistribution: 'per_project_gutenberg_terms', attribution: 'P. Le Page Renouf / Edouard Naville / Project Gutenberg', rights_uri: 'https://www.gutenberg.org/ebooks/69566', note: 'Verify target-jurisdiction status before redistribution.' } } } },
      { id: PROVENANCE, record_type: 'provenance', source: ARTIFACT, source_reference: 'Project Gutenberg eBook #69566; Renouf/Naville 1904 edition', activities: [{ type: 'acquisition', method: 'HTTP download of pinned plain-text edition with source identity and payload checks', software: { name: 'mw:recipe:ancient-egyptian:book-dead-renouf-1904', version: '1' } }, { type: 'parsing', method: 'Parse numbered CHAPTER headings and preserve chapter bodies', software: { name: 'mw:recipe:ancient-egyptian:book-dead-renouf-1904', version: '1' } }] }
    ]
    for (const chapter of parsed.chapters) {
      const passage = `mw:passage:ancient-egyptian:book-dead-renouf:${chapter.number}`
      const content = `mw:content:ancient-egyptian:book-dead-renouf:${chapter.number}:en`
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
