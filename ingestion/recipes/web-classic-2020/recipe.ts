import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

const INSTITUTION = 'mw:institution:ebible'
const WORK = 'mw:work:bible:web-classic'
const EXPRESSION = 'mw:expression:bible:en-web-classic-2020'
const EDITION = 'mw:edition:bible:web-classic-2020'
const BOOK_SET = 'mw:collection:bible:web-classic-2020-ecumenical'
const ARTIFACT = 'mw:artifact:web-classic:2020-vpl'
const SCHEME = 'mw:citation-scheme:bible:book-chapter-verse'
const PROVENANCE = 'mw:provenance:web-classic:2020'
interface Manifest { formatVersion: '1'; upstream: { publisher: string; edition: string; url: string; archiveSha256: string; archiveByteSize: number }; file: { path: string; byteSize: number; sha256: string } }
interface Verse { book: string; chapter: number; verse: number; text: string }
interface Parsed { manifest: Manifest; verses: Verse[] }
function hash(bytes: Uint8Array): string { return createHash('sha256').update(bytes).digest('hex') }
function part(value: string): string { return value.toLowerCase().replaceAll(/[^a-z0-9]+/gu, '-') }
function passageId(v: Verse): string { return `mw:passage:web-classic:2020:${part(v.book)}:${v.chapter}:${v.verse}` }
function contentId(v: Verse): string { return `mw:content:web-classic:2020:${part(v.book)}:${v.chapter}:${v.verse}` }
async function parseManifest(bytes: Uint8Array, location: string): Promise<Parsed> {
  const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as Manifest
  if (manifest.formatVersion !== '1' || manifest.upstream.publisher !== 'eBible.org') throw new Error('Unexpected WEB source manifest')
  const source = path.resolve(path.dirname(location), manifest.file.path)
  if (!source.startsWith(`${path.resolve(path.dirname(location))}${path.sep}`)) throw new Error('WEB source path escapes recipe directory')
  const raw = await readFile(source)
  if (raw.byteLength !== manifest.file.byteSize || hash(raw) !== manifest.file.sha256) throw new Error('WEB VPL source checksum mismatch')
  const verses = raw.toString('utf8').split(/\r?\n/u).filter(Boolean).map((line) => {
    const match = line.match(/^([0-9A-Z]{3,4})\s+(\d+):(\d+)(?:\s(.*))?$/u)
    if (!match) throw new Error(`Invalid WEB VPL line: ${line.slice(0, 80)}`)
    return { book: match[1], chapter: Number(match[2]), verse: Number(match[3]), text: match[4] ?? '' }
  })
  return { manifest, verses }
}
export const hooks: RecipeHooks<Parsed, Parsed> = {
  parse(bytes, context) { return parseManifest(bytes, context.acquisition.resolved_location) },
  normalize(parsed) { return parsed },
  map(parsed) {
    const { manifest, verses } = parsed
    const books = [...new Set(verses.map((verse) => verse.book))]
    const records: CorpusRecord[] = [
      { id: INSTITUTION, record_type: 'entity', kind: 'institution', labels: [{ value: 'eBible.org', role: 'preferred', language: 'en', script: 'Latn' }] },
      { id: WORK, record_type: 'resource', kind: 'textual.work', labels: [{ value: 'World English Bible Classic', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text' } } },
      { id: EXPRESSION, record_type: 'resource', kind: 'textual.expression', extensions: { textual: { work: WORK, language: 'en', script: 'Latn' } } },
      { id: EDITION, record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'World English Bible Classic, 2020 stable text edition' } } },
      { id: BOOK_SET, record_type: 'resource', kind: 'textual.book_set', labels: [{ value: 'WEB Classic ecumenical book set', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { edition: EDITION, members: books.map((book, index) => ({ book, sequence: index + 1 })) } } },
      { id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact', extensions: { textual: { represents: EDITION, representation_kind: 'verse_per_line_text', media_type: 'text/plain' }, source: { title: 'World English Bible Classic 2020 stable text, verse-per-line export', institution: INSTITUTION, revision: '2020 stable text edition; downloaded 2026-08-27', canonical_url: manifest.upstream.url, language: 'en', script: 'Latn', descriptor: { availability: 'bundled', locations: [manifest.upstream.url], media_type: 'application/zip', byte_size: manifest.upstream.archiveByteSize, sha256: manifest.upstream.archiveSha256, retrieved_at: '2026-08-27T00:00:00Z' }, rights: { status: 'public_domain', redistribution: 'permitted', attribution: 'World English Bible Classic, eBible.org. “World English Bible” is a trademark of eBible.org.', note: 'Text is dedicated to the public domain; retain edition/trademark context and do not label modified text as World English Bible.' } } } },
      { id: SCHEME, record_type: 'resource', kind: 'textual.citation_scheme', extensions: { textual: { applies_to: [EXPRESSION], components: [{ key: 'book', unit: 'book' }, { key: 'chapter', unit: 'chapter' }, { key: 'verse', unit: 'verse' }], delimiter: '.', example: 'GEN.1.1' } } },
      { id: PROVENANCE, record_type: 'provenance', source: ARTIFACT, source_reference: 'eBible.org eng-web_vpl.zip, World English Bible Classic 2020 stable text', activities: [{ type: 'acquisition', method: 'Pinned eBible VPL ZIP and extracted plain-text checksum', software: { name: 'mw:recipe:web-classic:2020', version: '1' }, ended_at: '2026-08-27T00:00:00Z' }, { type: 'parsing', method: 'Parse book chapter verse VPL lines without textual normalization', software: { name: 'mw:recipe:web-classic:2020', version: 'ebible-vpl-1' } }] }
    ] as CorpusRecord[]
    for (const [index, verse] of verses.entries()) {
      const target = passageId(verse)
      records.push({ id: target, record_type: 'resource', kind: 'textual.passage', extensions: { textual: { container: EXPRESSION, unit: 'verse', sequence: index + 1, local_id: `${verse.book}.${verse.chapter}.${verse.verse}`, citations: [{ scheme: SCHEME, reference: `${verse.book}.${verse.chapter}.${verse.verse}`, path: [verse.book, String(verse.chapter), String(verse.verse)] }] } } } as CorpusRecord)
      records.push({ id: contentId(verse), record_type: 'resource', kind: 'textual.content', extensions: { textual: { target, language: 'en', script: 'Latn', representation: 'source', text: verse.text }, source: { artifact: ARTIFACT, provenance: PROVENANCE } } } as CorpusRecord)
    }
    return records
  },
  validate(records) { const passages = records.filter((record) => record.record_type === 'resource' && record.kind === 'textual.passage'); const content = records.filter((record) => record.record_type === 'resource' && record.kind === 'textual.content'); return passages.length > 0 && passages.length === content.length ? [] : ['WEB must map one source content record per verse'] }
}
