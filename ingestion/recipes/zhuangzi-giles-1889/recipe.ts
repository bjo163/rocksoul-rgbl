import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

const WORK = 'mw:work:zhuangzi'
const EXPRESSION = 'mw:expression:zhuangzi:en-giles-1889'
const EDITION = 'mw:edition:zhuangzi:giles-1889'
const ARTIFACT = 'mw:artifact:zhuangzi:giles-1889'
const PROVENANCE = 'mw:provenance:zhuangzi:giles-1889'

export interface ParsedZhuangzi {
  chapters: Array<{ number: number; title: string; text: string }>
}

const ROMAN = new Map([
  ['I',1],['II',2],['III',3],['IV',4],['V',5],['VI',6],['VII',7],['VIII',8],['IX',9],['X',10],
  ['XI',11],['XII',12],['XIII',13],['XIV',14],['XV',15],['XVI',16],['XVII',17],['XVIII',18],['XIX',19],['XX',20],
  ['XXI',21],['XXII',22],['XXIII',23],['XXIV',24],['XXV',25],['XXVI',26],['XXVII',27],['XXVIII',28],['XXIX',29],['XXX',30],
  ['XXXI',31],['XXXII',32],['XXXIII',33]
])

function romanToNumber(value: string): number {
  const number = ROMAN.get(value.toUpperCase())
  if (!number) throw new Error(`Unknown Zhuangzi chapter numeral: ${value}`)
  return number
}

function clean(line: string): string {
  return line
    .replace(/\u000c/gu, '')
    .replace(/\s+$/u, '')
}

function parseChapters(text: string): ParsedZhuangzi {
  const lines = text.replace(/^.*?\*\*\* START OF THE PROJECT GUTENBERG EBOOK[^\n]*\n/su, '').split(/\r?\n/u)
  const starts: Array<{ index: number; number: number; title: string }> = []
  const pattern = /^\s*CHAPTER\s+([IVXLCDM]+)\.\s*$/u
  const nextTitle = /^\s*(.{3,100})\s*$/u

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(pattern)
    if (!match) continue
    let title = ''
    for (let j = i + 1; j < Math.min(lines.length, i + 5); j += 1) {
      const candidate = lines[j].trim()
      if (candidate && !candidate.startsWith('_') && nextTitle.test(candidate)) {
        title = candidate.replace(/[._]+$/gu, '')
        break
      }
    }
    starts.push({ index: i, number: romanToNumber(match[1]), title: title || `Chapter ${match[1]}` })
  }

  const contentStarts = starts.filter(item => item.number <= 33)
  if (contentStarts.length !== 33) throw new Error(`Expected 33 Zhuangzi chapters, found ${contentStarts.length}`)

  return {
    chapters: contentStarts.map((item, index) => {
      const end = contentStarts[index + 1]?.index ?? lines.length
      const body = lines.slice(item.index + 1, end).map(clean).join('\n').trim()
      if (!body) throw new Error(`Empty Zhuangzi chapter ${item.number}`)
      return { number: item.number, title: item.title, text: body }
    })
  }
}

export const hooks: RecipeHooks<ParsedZhuangzi, ParsedZhuangzi> = {
  parse(bytes) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    if (!text.includes('PROJECT GUTENBERG EBOOK')) throw new Error('Unexpected Zhuangzi payload')
    if (/<(?:html|body|form|script)[\s>]/iu.test(text)) throw new Error('HTML payload rejected; expected plain-text Gutenberg edition')
    if (!text.includes('HERBERT A. GILES')) throw new Error('Unexpected Zhuangzi translator')
    return parseChapters(text)
  },
  normalize(parsed) {
    return {
      chapters: parsed.chapters.map(chapter => ({
        ...chapter,
        text: chapter.text.replace(/\n{3,}/gu, '\n\n').trim()
      }))
    }
  },
  map(parsed, context) {
    const records: CorpusRecord[] = [
      { id: WORK, record_type: 'resource', kind: 'textual.work', labels: [{ value: 'Zhuangzi', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text' } } },
      { id: EXPRESSION, record_type: 'resource', kind: 'textual.expression', description: 'Herbert A. Giles English translation published in 1889.', extensions: { textual: { work: WORK, language: 'en', script: 'Latn' } } },
      { id: EDITION, record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'Chuang Tzu: Mystic, Moralist, and Social Reformer (1889)' } } },
      { id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact', labels: [{ value: 'Project Gutenberg #59709 — Giles 1889', role: 'preferred', language: 'en' }], extensions: { textual: { represents: EDITION, representation_kind: 'plain_text', media_type: 'text/plain' }, source: { title: 'Chuang Tzu: Mystic, Moralist, and Social Reformer', institution: 'Project Gutenberg', language: 'en', revision: 'eBook #59709', descriptor: { availability: 'remote', locations: ['https://www.gutenberg.org/cache/epub/59709/pg59709.txt'], media_type: 'text/plain', byte_size: context.acquisition.source.byte_size, sha256: context.acquisition.sha256 }, rights: { status: 'public_domain_in_usa', redistribution: 'permitted_per_project_gutenberg_terms', attribution: 'Herbert Allen Giles / Project Gutenberg', rights_uri: 'https://www.gutenberg.org/ebooks/59709', note: 'Verify target-jurisdiction status before redistribution.' } } } },
      { id: PROVENANCE, record_type: 'provenance', source: ARTIFACT, source_reference: 'Project Gutenberg eBook #59709, Herbert Allen Giles translation, 1889', activities: [{ type: 'acquisition', method: 'HTTP download of pinned Project Gutenberg plain-text edition followed by payload identity checks', software: { name: 'mw:recipe:zhuangzi:giles-1889', version: '1' } }, { type: 'parsing', method: 'Parse the 33 printed Zhuangzi chapters by chapter heading and preserve chapter text', software: { name: 'mw:recipe:zhuangzi:giles-1889', version: '1' } }, { type: 'normalization', method: 'Collapse excessive blank lines without rewriting source wording', software: { name: 'mw:recipe:zhuangzi:giles-1889', version: 'identity-1' } } ] }
    ]

    for (const chapter of parsed.chapters) {
      const passage = `mw:passage:zhuangzi:${chapter.number}`
      const content = `mw:content:zhuangzi:${chapter.number}:en-giles-1889`
      records.push({ id: passage, record_type: 'resource', kind: 'textual.passage', labels: [{ value: chapter.title, role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { container: EXPRESSION, unit: 'chapter', sequence: chapter.number, local_id: String(chapter.number), citation: `chapter-${chapter.number}` } } } as CorpusRecord)
      records.push({ id: content, record_type: 'resource', kind: 'textual.content', extensions: { textual: { target: passage, language: 'en', script: 'Latn', representation: 'source', text: chapter.text }, source: { artifact: ARTIFACT, provenance: PROVENANCE } } } as CorpusRecord)
    }
    return records
  },
  validate(records) {
    const findings: string[] = []
    const chapters = records.filter(r => r.kind === 'textual.passage')
    const contents = records.filter(r => r.kind === 'textual.content')
    if (chapters.length !== 33) findings.push(`Expected 33 Zhuangzi chapters, received ${chapters.length}`)
    if (contents.length !== 33) findings.push(`Expected 33 Zhuangzi chapter contents, received ${contents.length}`)
    if (new Set(records.map(r => r.id)).size !== records.length) findings.push('Zhuangzi record IDs must be unique')
    return findings
  }
}
