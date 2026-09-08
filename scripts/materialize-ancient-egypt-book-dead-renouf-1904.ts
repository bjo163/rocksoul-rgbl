import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const ROOT = process.cwd()
const URL = 'https://www.gutenberg.org/cache/epub/69566/pg69566.txt'
const DATASET = 'datasets/ancient-egypt-book-dead-renouf'
const CORE = path.join(ROOT, DATASET, 'data/core')
const WORK = 'mw:work:ancient-egyptian:book-dead'
const EXPRESSION = 'mw:expression:ancient-egyptian:book-dead:renouf-1904'
const EDITION = 'mw:edition:ancient-egyptian:book-dead:renouf-1904'
const ARTIFACT = 'mw:artifact:ancient-egyptian:book-dead:renouf-1904'
const PROVENANCE = 'mw:provenance:ancient-egyptian:book-dead-renouf-1904'
const sha256 = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')
const roman = (value: string): number => {
  const symbols: Record<string, number> = { I:1,V:5,X:10,L:50,C:100,D:500,M:1000 }
  let total = 0, previous = 0
  for (const ch of [...value.toUpperCase()].reverse()) {
    const current = symbols[ch] ?? 0
    total += current < previous ? -current : current
    previous = current
  }
  return total
}

async function main(): Promise<void> {
  const response = await fetch(URL, { headers: { accept: 'text/plain' } })
  if (!response.ok) throw new Error(`Gutenberg download failed: ${response.status} ${response.statusText}`)
  const contentType = response.headers.get('content-type') ?? ''
  const text = await response.text()
  if (!contentType.toLowerCase().includes('text/plain')) throw new Error(`Unexpected content-type: ${contentType}`)
  if (/<(?:html|body|form|script)[\s>]/iu.test(text)) throw new Error('HTML/challenge payload rejected')
  if (!/\[eBook\s+#69566\]/iu.test(text)) throw new Error('Unexpected Gutenberg payload')
  if (!/P\.?\s*LE\s*PAGE\s*RENOUF/iu.test(text) || !/E\.?\s*NAVILLE/iu.test(text)) throw new Error('Unexpected translator identity')
  if (!/SOCIETY\s+OF\s+BIBLICAL\s+ARCHAEOLOGY/iu.test(text) || !/1904/u.test(text)) throw new Error('Unexpected 1904 edition identity')

  const lines = text.split(/\r?\n/u)
  const heading = /^\s*CHAPTER\s+([IVXLCDM]+)\s*[.\-:]?\s*(?:\S.*)?$/iu
  const starts: Array<{ index: number; number: number; title: string }> = []
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(heading)
    if (!match) continue
    const number = roman(match[1])
    let title = `Chapter ${match[1].toUpperCase()}`
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j += 1) {
      const candidate = lines[j].trim()
      if (candidate && !candidate.startsWith('Notes') && !candidate.startsWith('PLATE ')) {
        title = candidate.replace(/[._]+$/gu, '')
        break
      }
    }
    starts.push({ index: i, number, title })
  }
  starts.sort((a, b) => a.index - b.index)
  if (starts.length < 100) throw new Error(`Expected at least 100 chapter markers, found ${starts.length}`)

  const sourceHash = sha256(text)
  const records: CorpusRecord[] = [
    { id: WORK, record_type: 'resource', kind: 'textual.work', labels: [{ value: 'The Egyptian Book of the Dead', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text', tradition: 'ancient-egyptian' } } },
    { id: EXPRESSION, record_type: 'resource', kind: 'textual.expression', description: 'Translation by P. Le Page Renouf, continued and completed by Edouard Naville; original publication 1904.', extensions: { textual: { work: WORK, language: 'en', script: 'Latn' } } },
    { id: EDITION, record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'The Egyptian Book of the Dead — Renouf / Naville, 1904' } } },
    { id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact', labels: [{ value: 'Project Gutenberg #69566', role: 'preferred', language: 'en' }], extensions: { textual: { represents: EDITION, representation_kind: 'plain_text', media_type: 'text/plain' }, source: { title: 'The Egyptian Book of the dead', institution: 'Project Gutenberg', language: 'en', revision: 'eBook #69566', descriptor: { availability: 'remote', locations: [URL], media_type: 'text/plain', byte_size: Buffer.byteLength(text), sha256: sourceHash }, rights: { status: 'public_domain_in_usa', redistribution: 'per_project_gutenberg_terms', attribution: 'P. Le Page Renouf / Edouard Naville / Project Gutenberg', rights_uri: 'https://www.gutenberg.org/ebooks/69566', note: 'Verify target-jurisdiction status before redistribution.' } } } },
    { id: PROVENANCE, record_type: 'provenance', source: ARTIFACT, source_reference: `Project Gutenberg #69566; source SHA-256 ${sourceHash}`, activities: [{ type: 'acquisition', method: 'Fetch pinned Project Gutenberg plain text and validate identity/content type', software: { name: 'scripts/materialize-ancient-egypt-book-dead-renouf-1904.ts', version: '3' } }, { type: 'parsing', method: 'Parse printed CHAPTER headings, preserve non-empty chapter bodies, and skip empty repetition markers', software: { name: 'scripts/materialize-ancient-egypt-book-dead-renouf-1904.ts', version: '3' } }] }
  ]

  let materializedChapters = 0
  for (let index = 0; index < starts.length; index += 1) {
    const chapter = starts[index]
    const end = starts[index + 1]?.index ?? lines.length
    const body = lines.slice(chapter.index + 1, end).join('\n').replace(/\n{3,}/gu, '\n\n').trim()
    if (!body) continue
    const passage = `mw:passage:ancient-egyptian:book-dead-renouf:${chapter.number}`
    const content = `mw:content:ancient-egyptian:book-dead-renouf:${chapter.number}:en`
    records.push({ id: passage, record_type: 'resource', kind: 'textual.passage', labels: [{ value: chapter.title, role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { container: EXPRESSION, unit: 'chapter', sequence: chapter.number, local_id: String(chapter.number), citation: `chapter-${chapter.number}` } } } as CorpusRecord)
    records.push({ id: content, record_type: 'resource', kind: 'textual.content', extensions: { textual: { target: passage, language: 'en', script: 'Latn', representation: 'source', text: body }, source: { artifact: ARTIFACT, provenance: PROVENANCE } } } as CorpusRecord)
    materializedChapters += 1
  }
  if (materializedChapters < 100) throw new Error(`Expected 100+ non-empty chapters, found ${materializedChapters}`)

  await mkdir(path.join(CORE, 'resources'), { recursive: true })
  await mkdir(path.join(CORE, 'provenance'), { recursive: true })
  await writeFile(path.join(CORE, 'resources/book-dead-renouf-1904.jsonl'), deterministicJsonl(records.filter(r => r.record_type === 'resource')), 'utf8')
  await writeFile(path.join(CORE, 'provenance/book-dead-renouf-1904.jsonl'), deterministicJsonl(records.filter(r => r.record_type === 'provenance')), 'utf8')
  const manifestPath = path.join(ROOT, DATASET, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>
  manifest.partitions = [
    { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
    { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' }
  ]
  manifest.availability = 'bundled'
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  const files = [`${DATASET}/data/core/resources/book-dead-renouf-1904.jsonl`, `${DATASET}/data/core/provenance/book-dead-renouf-1904.jsonl`, `${DATASET}/manifest.json`]
  const checksums: string[] = []
  for (const file of files) checksums.push(`${sha256(await readFile(path.join(ROOT, file), 'utf8'))}  ${file}`)
  checksums.push(`${sourceHash}  ${URL}`)
  await writeFile(path.join(ROOT, DATASET, 'CHECKSUMS.sha256'), `${checksums.join('\n')}\n`, 'utf8')
  console.log(`Materialized ${materializedChapters} non-empty Renouf/Naville chapters (${records.length} canonical records)`)
}

await main()
