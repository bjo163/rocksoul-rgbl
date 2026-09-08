import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deterministicJsonl } from '@moonwitness/corpus-ingestion'
import type { CorpusRecord } from '@moonwitness/corpus-core'

const ROOT = process.cwd()
const URL = 'https://www.gutenberg.org/cache/epub/7145/pg7145.txt'
const DATASET = 'datasets/ancient-egypt-book-dead-budge'
const CORE = path.join(ROOT, DATASET, 'data/core')
const ids = {
  work: 'mw:work:ancient-egyptian:book-dead',
  expression: 'mw:expression:ancient-egyptian:book-dead:budge',
  edition: 'mw:edition:ancient-egyptian:book-dead:budge',
  artifact: 'mw:artifact:ancient-egyptian:book-dead:budge',
  provenance: 'mw:provenance:ancient-egyptian:book-dead:budge'
} as const
const sha256 = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')
const roman = (value: string) => {
  const m: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let total = 0
  let previous = 0
  for (const c of [...value.toUpperCase()].reverse()) {
    const n = m[c] ?? 0
    total += n < previous ? -n : n
    previous = n
  }
  return total
}

async function main(): Promise<void> {
  const response = await fetch(URL, { headers: { accept: 'text/plain' } })
  if (!response.ok) throw new Error(`Gutenberg download failed: ${response.status}`)
  const type = response.headers.get('content-type') ?? ''
  const text = await response.text()
  if (!type.toLowerCase().includes('text/plain')) throw new Error(`Unexpected content-type: ${type}`)
  if (/<(?:html|body|form|script)[\s>]/iu.test(text)) throw new Error('HTML/challenge payload rejected')
  if (!/\[eBook\s+#7145\]/iu.test(text)) throw new Error('Unexpected Gutenberg payload')
  if (!/E\.?\s*A\.?\s*(?:WALLIS\s+)?BUDGE/iu.test(text)) throw new Error('Unexpected author identity')
  const lines = text.split(/\r?\n/u)
  const heading = /^\s*CHAPTER\s+([IVXLCDM]+)\s*[.\-:]?\s*(?:\S.*)?$/iu
  const starts: Array<{ index: number; number: number; title: string }> = []
  const seen = new Set<number>()
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(heading)
    if (!match) continue
    const number = roman(match[1])
    if (number < 1 || seen.has(number)) continue
    seen.add(number)
    let title = `Chapter ${match[1].toUpperCase()}`
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j += 1) {
      const candidate = lines[j].trim()
      if (candidate) {
        title = candidate.replace(/[._]+$/gu, '')
        break
      }
    }
    starts.push({ index: i, number, title })
  }
  starts.sort((a, b) => a.index - b.index)
  if (starts.length < 10) throw new Error(`Expected 10+ chapters, found ${starts.length}`)
  const sourceHash = sha256(text)
  const records: CorpusRecord[] = [
    { id: ids.work, record_type: 'resource', kind: 'textual.work', labels: [{ value: 'The Book of the Dead', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text', tradition: 'ancient-egyptian' } } },
    { id: ids.expression, record_type: 'resource', kind: 'textual.expression', extensions: { textual: { work: ids.work, language: 'en', script: 'Latn' } } },
    { id: ids.edition, record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [ids.expression], edition_statement: 'The Book of the Dead — E. A. Wallis Budge' } } },
    { id: ids.artifact, record_type: 'resource', kind: 'textual.artifact', labels: [{ value: 'Project Gutenberg #7145', role: 'preferred', language: 'en' }], extensions: { textual: { represents: ids.edition, representation_kind: 'plain_text', media_type: 'text/plain' }, source: { title: 'The Book of the Dead', institution: 'Project Gutenberg', language: 'en', revision: 'eBook #7145', descriptor: { availability: 'remote', locations: [URL], media_type: 'text/plain', byte_size: Buffer.byteLength(text), sha256: sourceHash }, rights: { status: 'public_domain_in_usa', redistribution: 'per_project_gutenberg_terms', attribution: 'Sir E. A. Wallis Budge / Project Gutenberg', rights_uri: 'https://www.gutenberg.org/ebooks/7145', note: 'Verify target-jurisdiction status before redistribution.' } } } },
    { id: ids.provenance, record_type: 'provenance', source: ids.artifact, source_reference: `Project Gutenberg #7145; SHA-256 ${sourceHash}`, activities: [{ type: 'acquisition', method: 'Download and identity-validate pinned plain-text source', software: { name: 'scripts/materialize-ancient-egypt-book-dead-budge.ts', version: '3' } }, { type: 'parsing', method: 'Parse printed CHAPTER headings and preserve chapter bodies', software: { name: 'scripts/materialize-ancient-egypt-book-dead-budge.ts', version: '3' } }] }
  ]
  for (let index = 0; index < starts.length; index += 1) {
    const chapter = starts[index]
    const end = starts[index + 1]?.index ?? lines.length
    const body = lines.slice(chapter.index + 1, end).join('\n').replace(/\n{3,}/gu, '\n\n').trim()
    if (!body) throw new Error(`Empty chapter ${chapter.number}`)
    const passage = `mw:passage:ancient-egyptian:book-dead:${chapter.number}` as `mw:${string}`
    const content = `mw:content:ancient-egyptian:book-dead:${chapter.number}:en-budge` as `mw:${string}`
    records.push({ id: passage, record_type: 'resource', kind: 'textual.passage', labels: [{ value: chapter.title, role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { container: ids.expression, unit: 'chapter', sequence: chapter.number, local_id: String(chapter.number), citation: `chapter-${chapter.number}` } } } as CorpusRecord)
    records.push({ id: content, record_type: 'resource', kind: 'textual.content', extensions: { textual: { target: passage, language: 'en', script: 'Latn', representation: 'source', text: body }, source: { artifact: ids.artifact, provenance: ids.provenance } } } as CorpusRecord)
  }
  await mkdir(path.join(CORE, 'resources'), { recursive: true })
  await mkdir(path.join(CORE, 'provenance'), { recursive: true })
  const resource = `${DATASET}/data/core/resources/book-dead-budge.jsonl`
  const provenance = `${DATASET}/data/core/provenance/book-dead-budge.jsonl`
  await writeFile(path.join(ROOT, resource), deterministicJsonl(records.filter((r) => r.record_type === 'resource')), 'utf8')
  await writeFile(path.join(ROOT, provenance), deterministicJsonl(records.filter((r) => r.record_type === 'provenance')), 'utf8')
  const manifestPath = path.join(ROOT, DATASET, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>
  manifest.partitions = [
    { recordType: 'resource', path: 'data/core/resources/*.jsonl' },
    { recordType: 'provenance', path: 'data/core/provenance/*.jsonl' }
  ]
  manifest.availability = 'bundled'
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  const checksumFiles = [resource, provenance, `${DATASET}/manifest.json`]
  const checksums: string[] = []
  for (const file of checksumFiles) {
    const content = await readFile(path.join(ROOT, file), 'utf8')
    checksums.push(`${sha256(content)}  ${file}`)
  }
  checksums.push(`${sourceHash}  ${URL}`)
  await writeFile(path.join(ROOT, DATASET, 'CHECKSUMS.sha256'), `${checksums.join('\n')}\n`, 'utf8')
  console.log(`Materialized ${starts.length} Budge chapters (${records.length} canonical records)`)
}

await main()
