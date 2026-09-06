import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const root = process.cwd()
const URL = 'https://www.gutenberg.org/cache/epub/59709/pg59709.txt'
const DATASET = 'datasets/zhuangzi-giles-1889'
const OUTPUT = path.join(root, DATASET, 'data/core')
const ARTIFACT = 'mw:artifact:zhuangzi:giles-1889'
const PROVENANCE = 'mw:provenance:zhuangzi:giles-1889'

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

async function main(): Promise<void> {
  const response = await fetch(URL, { headers: { accept: 'text/plain' } })
  if (!response.ok) throw new Error(`Gutenberg download failed: ${response.status} ${response.statusText}`)
  const contentType = response.headers.get('content-type') ?? ''
  const text = await response.text()

  if (!contentType.toLowerCase().includes('text/plain')) throw new Error(`Unexpected content-type: ${contentType}`)
  if (/<(?:html|body|form|script)[\s>]/iu.test(text)) throw new Error('HTML payload rejected; expected plain text')
  if (!/\[eBook\s+#59709\]/iu.test(text)) throw new Error('Unexpected Project Gutenberg payload')
  if (!/HERBERT\s+A\.\s+GILES/iu.test(text)) throw new Error('Unexpected translator')
  if (!/LONDON/iu.test(text) || !/BERNARD\s+QUARITCH/iu.test(text) || !/1889/iu.test(text)) throw new Error('Unexpected 1889 title-page identity')

  const lines = text.split(/\r?\n/u)
  const starts: Array<{ number: number; title: string; line: number }> = []
  const heading = /^\s*CHAPTER\s+([IVXLCDM]+)[.\s-]*(?:.*)?$/iu
  const roman = new Map([['I',1],['II',2],['III',3],['IV',4],['V',5],['VI',6],['VII',7],['VIII',8],['IX',9],['X',10],['XI',11],['XII',12],['XIII',13],['XIV',14],['XV',15],['XVI',16],['XVII',17],['XVIII',18],['XIX',19],['XX',20],['XXI',21],['XXII',22],['XXIII',23],['XXIV',24],['XXV',25],['XXVI',26],['XXVII',27],['XXVIII',28],['XXIX',29],['XXX',30],['XXXI',31],['XXXII',32],['XXXIII',33]])

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(heading)
    if (!match) continue
    const number = roman.get(match[1].toUpperCase())
    if (!number) continue
    let title = `Chapter ${match[1].toUpperCase()}`
    const inlineTitle = lines[i].replace(/^\s*CHAPTER\s+[IVXLCDM]+[.\s-]*/iu, '').trim()
    if (inlineTitle) title = inlineTitle.replace(/[._]+$/gu, '')
    starts.push({ number, title, line: i })
  }

  const chapters = starts.filter(item => item.number >= 1 && item.number <= 33)
  const unique = new Map<number, (typeof chapters)[number]>()
  for (const chapter of chapters) unique.set(chapter.number, chapter)
  const ordered = [...unique.values()].sort((a, b) => a.number - b.number)
  if (ordered.length !== 33) throw new Error(`Expected 33 Zhuangzi chapters, found ${ordered.length}`)

  const editionHash = sha256(text)
  const records: CorpusRecord[] = [
    { id: 'mw:work:zhuangzi', record_type: 'resource', kind: 'textual.work', labels: [{ value: 'Zhuangzi', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text' } } },
    { id: 'mw:expression:zhuangzi:en-giles-1889', record_type: 'resource', kind: 'textual.expression', extensions: { textual: { work: 'mw:work:zhuangzi', language: 'en', script: 'Latn' } } },
    { id: 'mw:edition:zhuangzi:giles-1889', record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: ['mw:expression:zhuangzi:en-giles-1889'], edition_statement: 'Chuang Tzu: Mystic, Moralist, and Social Reformer — Herbert Allen Giles, 1889' } } },
    { id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact', labels: [{ value: 'Project Gutenberg #59709', role: 'preferred', language: 'en' }], extensions: { textual: { represents: 'mw:edition:zhuangzi:giles-1889', representation_kind: 'plain_text', media_type: 'text/plain' }, source: { title: 'Chuang Tzu: Mystic, Moralist, and Social Reformer', institution: 'Project Gutenberg', language: 'en', revision: 'eBook #59709', descriptor: { availability: 'bundled', locations: [URL], media_type: 'text/plain', byte_size: Buffer.byteLength(text), sha256: editionHash }, rights: { status: 'public_domain_in_usa', redistribution: 'per_project_gutenberg_terms', attribution: 'Herbert Allen Giles / Project Gutenberg', rights_uri: 'https://www.gutenberg.org/ebooks/59709', note: 'Verify target-jurisdiction status before redistribution.' } } } },
    { id: PROVENANCE, record_type: 'provenance', source: ARTIFACT, source_reference: `Project Gutenberg #59709; HTTP source SHA-256 ${editionHash}`, activities: [{ type: 'acquisition', method: 'Fetch Project Gutenberg plain text and verify title-page/translator identity plus payload type', software: { name: 'scripts/materialize-zhuangzi-giles-1889.ts', version: '2' } }, { type: 'parsing', method: 'Identify all 33 numbered chapter headings and preserve chapter body text', software: { name: 'scripts/materialize-zhuangzi-giles-1889.ts', version: '2' } }, { type: 'normalization', method: 'Trim surrounding whitespace and normalize repeated blank lines only', software: { name: 'scripts/materialize-zhuangzi-giles-1889.ts', version: '2' } }] }
  ]

  for (const [index, chapter] of ordered.entries()) {
    const start = chapter.line + 1
    const end = ordered[index + 1]?.line ?? lines.length
    const body = lines.slice(start, end).join('\n').replace(/\n{3,}/gu, '\n\n').trim()
    if (!body) throw new Error(`Empty chapter body for Zhuangzi ${chapter.number}`)
    const passage = `mw:passage:zhuangzi:${chapter.number}`
    const content = `mw:content:zhuangzi:${chapter.number}:en-giles-1889`
    records.push({ id: passage, record_type: 'resource', kind: 'textual.passage', labels: [{ value: chapter.title, role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { container: 'mw:expression:zhuangzi:en-giles-1889', unit: 'chapter', sequence: chapter.number, local_id: String(chapter.number), citation: `chapter-${chapter.number}` } } } as CorpusRecord)
    records.push({ id: content, record_type: 'resource', kind: 'textual.content', extensions: { textual: { target: passage, language: 'en', script: 'Latn', representation: 'source', text: body }, source: { artifact: ARTIFACT, provenance: PROVENANCE } } } as CorpusRecord)
  }

  const resourceDir = path.join(OUTPUT, 'resources')
  const provenanceDir = path.join(OUTPUT, 'provenance')
  await mkdir(resourceDir, { recursive: true })
  await mkdir(provenanceDir, { recursive: true })
  const resourcePath = path.join(resourceDir, 'zhuangzi-giles-1889.jsonl')
  const provenancePath = path.join(provenanceDir, 'zhuangzi-giles-1889.jsonl')
  await writeFile(resourcePath, deterministicJsonl(records.filter(record => record.record_type === 'resource')), 'utf8')
  await writeFile(provenancePath, deterministicJsonl(records.filter(record => record.record_type === 'provenance')), 'utf8')

  const manifestPath = path.join(root, DATASET, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>
  manifest.sourceSha256 = editionHash
  manifest.sourceByteSize = Buffer.byteLength(text)
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  const checksumFiles = [resourcePath, provenancePath, manifestPath]
  const checksums = []
  for (const file of checksumFiles) checksums.push(`${sha256(await readFile(file, 'utf8'))}  ${path.relative(root, file).replaceAll('\\', '/')}`)
  checksums.push(`${editionHash}  ${URL}`)
  await writeFile(path.join(root, DATASET, 'CHECKSUMS.sha256'), `${checksums.join('\n')}\n`, 'utf8')

  console.log(`Materialized ${ordered.length} Zhuangzi chapters (${records.length} canonical records)`)
}

await main()
