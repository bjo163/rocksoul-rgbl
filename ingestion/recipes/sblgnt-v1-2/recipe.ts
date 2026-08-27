import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

const INSTITUTION = 'mw:institution:logos-sbl'
const WORK = 'mw:work:new-testament'
const EXPRESSION = 'mw:expression:new-testament:grc-sblgnt'
const EDITION = 'mw:edition:new-testament:sblgnt-v1-2'
const ARTIFACT = 'mw:artifact:sblgnt:v1-2'
const SCHEME = 'mw:citation-scheme:new-testament:book-chapter-verse'
const PROVENANCE = 'mw:provenance:sblgnt:v1-2'
const COMMIT = 'c4d241a9c1c479a55b989ba35a4976c1d0b8052c'
interface SourceFile { file: string; upstreamPath: string; byteSize: number; sha256: string }
interface SourceManifest { formatVersion: '1'; upstream: { repository: string; branch: string; commit: string; archiveSha256: string; archiveByteSize: number }; files: SourceFile[] }
interface Verse { book: string; chapter: number; verse: number; text: string }
interface Parsed { manifest: SourceManifest; verses: Verse[] }
function sha256(bytes: Uint8Array): string { return createHash('sha256').update(bytes).digest('hex') }
function decode(value: string): string { return value.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&apos;', "'").replaceAll('&amp;', '&') }
function idPart(value: string): string { return value.toLowerCase().replaceAll(/[^a-z0-9]+/gu, '-') }
function passageId(book: string, chapter: number, verse: number): string { return `mw:passage:sblgnt:v1-2:${idPart(book)}:${chapter}:${verse}` }
function contentId(book: string, chapter: number, verse: number): string { return `mw:content:sblgnt:v1-2:${idPart(book)}:${chapter}:${verse}` }
async function parseSourceManifest(bytes: Uint8Array, location: string): Promise<Parsed> {
  const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as SourceManifest
  if (manifest.formatVersion !== '1' || manifest.upstream.repository !== 'LogosBible/SBLGNT' || manifest.upstream.branch !== 'master' || manifest.upstream.commit !== COMMIT) throw new Error('SBLGNT source manifest is not pinned to the reviewed commit')
  const root = path.dirname(location); const verses: Verse[] = []
  for (const sourceFile of manifest.files) {
    const file = path.resolve(root, sourceFile.file)
    if (!file.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`Unsafe SBLGNT source path ${sourceFile.file}`)
    const bytes = await readFile(file)
    if (bytes.byteLength !== sourceFile.byteSize || sha256(bytes) !== sourceFile.sha256) throw new Error(`SBLGNT checksum mismatch for ${sourceFile.file}`)
    const xml = bytes.toString('utf8'); const book = path.basename(sourceFile.file, '.xml')
    for (const match of xml.matchAll(/<verse-number\s+id="([^"]+)"[^>]*>[\s\S]*?(?=<verse-number|<\/p>)/gu)) {
      const parts = match[1].match(/\s(\d+):(\d+)$/u); if (!parts) throw new Error(`Invalid SBLGNT verse ID ${match[1]}`)
      const text = [...match[0].matchAll(/<w>([\s\S]*?)<\/w>/gu)].map((word) => decode(word[1])).join('') + [...match[0].matchAll(/<suffix>([\s\S]*?)<\/suffix>/gu)].map((suffix) => decode(suffix[1])).join('')
      if (!text) throw new Error(`Empty SBLGNT verse ${match[1]}`)
      verses.push({ book, chapter: Number(parts[1]), verse: Number(parts[2]), text })
    }
  }
  verses.sort((a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse)
  return { manifest, verses }
}
export const hooks: RecipeHooks<Parsed, Parsed> = {
  parse(bytes, context) { return parseSourceManifest(bytes, context.acquisition.resolved_location) },
  normalize(parsed) { return parsed },
  map(parsed, context) {
    const source = parsed.manifest; const records: CorpusRecord[] = [
      { id: INSTITUTION, record_type: 'entity', kind: 'institution', labels: [{ value: 'Logos Bible Software / Society of Biblical Literature', role: 'preferred', language: 'en', script: 'Latn' }] },
      { id: WORK, record_type: 'resource', kind: 'textual.work', labels: [{ value: 'New Testament', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text' } } },
      { id: EXPRESSION, record_type: 'resource', kind: 'textual.expression', extensions: { textual: { work: WORK, language: 'grc', script: 'Grek' } } },
      { id: EDITION, record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'The Greek New Testament: SBL Edition v1.2' } } },
      { id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact', extensions: { textual: { represents: EDITION, representation_kind: 'xml-source-set', media_type: 'application/xml' }, source: { title: 'SBL Greek New Testament v1.2', institution: INSTITUTION, revision: `SBLGNT master commit ${COMMIT}`, canonical_url: `https://github.com/LogosBible/SBLGNT/tree/${COMMIT}/data/sblgnt/xml`, language: 'grc', script: 'Grek', descriptor: { availability: 'bundled', locations: [`https://github.com/LogosBible/SBLGNT/archive/${COMMIT}.tar.gz`], media_type: 'application/gzip', byte_size: source.upstream.archiveByteSize, sha256: source.upstream.archiveSha256, retrieved_at: '2026-08-27T00:00:00Z' }, rights: { status: 'licensed', redistribution: 'permitted', license_expression: 'CC-BY-4.0', rights_uri: 'https://creativecommons.org/licenses/by/4.0/', attribution: 'Society of Biblical Literature and Logos Bible Software, SBLGNT v1.2, CC BY 4.0.', note: 'Redistribution must retain attribution and indicate modifications.' } } } },
      { id: SCHEME, record_type: 'resource', kind: 'textual.citation_scheme', extensions: { textual: { applies_to: [EXPRESSION], components: [{ key: 'book', unit: 'book' }, { key: 'chapter', unit: 'chapter' }, { key: 'verse', unit: 'verse' }], delimiter: '.', example: 'Mt.1.1' } } },
      { id: PROVENANCE, record_type: 'provenance', source: ARTIFACT, source_reference: `LogosBible/SBLGNT data/sblgnt/xml at commit ${COMMIT}`, activities: [{ type: 'acquisition', method: 'Pinned Git archive and per-file SHA-256 manifest', software: { name: 'mw:recipe:sblgnt:v1-2', version: '1' }, ended_at: '2026-08-27T00:00:00Z' }, { type: 'parsing', method: 'Parse XML verse-number, w, and suffix elements without textual normalization', software: { name: 'mw:recipe:sblgnt:v1-2', version: 'sblgnt-xml-1' } }, { type: 'mapping', method: 'Map source Greek verse content to the generic textual profile', software: { name: 'mw:recipe:sblgnt:v1-2', version: '1' } }] }
    ] as CorpusRecord[]
    for (const [index, verse] of parsed.verses.entries()) {
      const p = passageId(verse.book, verse.chapter, verse.verse)
      records.push({
        id: p, record_type: 'resource', kind: 'textual.passage',
        extensions: {
          textual: {
            container: EXPRESSION, unit: 'verse', sequence: index + 1,
            local_id: `${verse.book}.${verse.chapter}.${verse.verse}`,
            citations: [{ scheme: SCHEME, reference: `${verse.book}.${verse.chapter}.${verse.verse}`, path: [verse.book, String(verse.chapter), String(verse.verse)] }]
          }
        }
      } as CorpusRecord)
      records.push({
        id: contentId(verse.book, verse.chapter, verse.verse), record_type: 'resource', kind: 'textual.content',
        extensions: { textual: { target: p, language: 'grc', script: 'Grek', representation: 'source', text: verse.text }, source: { artifact: ARTIFACT, provenance: PROVENANCE } }
      } as CorpusRecord)
    }
    return records
  },
  validate(records) { const passages = records.filter((record) => record.record_type === 'resource' && record.kind === 'textual.passage'); const contents = records.filter((record) => record.record_type === 'resource' && record.kind === 'textual.content'); return passages.length > 0 && passages.length === contents.length ? [] : ['SBLGNT must have one passage and source content record per verse'] }
}
