import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

const INSTITUTION = 'mw:institution:openscriptures'
const WORK = 'mw:work:hebrew-bible'
const EXPRESSION = 'mw:expression:hebrew-bible:he'
const EDITION = 'mw:edition:hebrew-bible:wlc'
const ARTIFACT = 'mw:artifact:oshb:wlc'
const SCHEME = 'mw:citation-scheme:hebrew-bible:book-chapter-verse'
const PROVENANCE = 'mw:provenance:oshb:wlc'
const LEMMA = 'mw:predicate:has-lemma'
const MORPH = 'mw:predicate:has-morphology'
const COMMIT = '3d15126fb1ef74867fc1434be1942e837932691f'

interface SourceFile { file: string; upstreamPath: string; byteSize: number; sha256: string }
interface SourceManifest { formatVersion: '1'; upstream: { repository: string; branch: string; commit: string; archiveSha256: string; archiveByteSize: number }; files: SourceFile[] }
interface Token { id: string; text: string; lemma: string; morph: string; n?: string }
interface Verse { book: string; chapter: number; verse: number; text: string; tokens: Token[] }
interface Parsed { manifest: SourceManifest; verses: Verse[] }

function sha256(bytes: Uint8Array): string { return createHash('sha256').update(bytes).digest('hex') }
function xmlDecode(value: string): string { return value.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&apos;', "'").replaceAll('&amp;', '&') }
function attr(tag: string, name: string): string { return xmlDecode(tag.match(new RegExp(`${name}="([^"]*)"`, 'u'))?.[1] ?? '') }
function idPart(value: string): string { return value.toLowerCase().replaceAll(/[^a-z0-9]+/gu, '-') }
function passageId(book: string, chapter: number, verse: number): string { return `mw:passage:oshb:wlc:${idPart(book)}:${chapter}:${verse}` }
function contentId(book: string, chapter: number, verse: number): string { return `mw:content:oshb:wlc:${idPart(book)}:${chapter}:${verse}` }
function morphologyId(book: string, chapter: number, verse: number): string { return `mw:evidence:oshb:wlc:${idPart(book)}:${chapter}:${verse}:morphology` }

async function parseSourceManifest(bytes: Uint8Array, location: string): Promise<Parsed> {
  const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as SourceManifest
  if (manifest.formatVersion !== '1' || manifest.upstream.repository !== 'openscriptures/morphhb' || manifest.upstream.branch !== 'master' || manifest.upstream.commit !== COMMIT) throw new Error('OSHB source manifest is not pinned to the reviewed master commit')
  const sourceRoot = path.dirname(location)
  const verses: Verse[] = []
  for (const sourceFile of manifest.files) {
    const file = path.resolve(sourceRoot, sourceFile.file)
    if (!file.startsWith(`${path.resolve(sourceRoot)}${path.sep}`)) throw new Error(`Unsafe OSHB source path ${sourceFile.file}`)
    const bytes = await readFile(file)
    if (bytes.byteLength !== sourceFile.byteSize || sha256(bytes) !== sourceFile.sha256) throw new Error(`OSHB source checksum mismatch for ${sourceFile.file}`)
    const xml = bytes.toString('utf8')
    const book = path.basename(sourceFile.file, '.xml')
    const verseMatches = [...xml.matchAll(/<verse\s+([^>]+)>([\s\S]*?)<\/verse>/gu)]
    for (const match of verseMatches) {
      const osis = attr(match[1], 'osisID').split('.')
      const chapter = Number(osis.at(-2)); const verse = Number(osis.at(-1))
      if (!Number.isInteger(chapter) || !Number.isInteger(verse)) throw new Error(`Invalid OSIS verse ID in ${sourceFile.file}`)
      const tokens: Token[] = [...match[2].matchAll(/<w\s+([^>]+)>([\s\S]*?)<\/w>/gu)].map((word) => ({ id: attr(word[1], 'id'), text: xmlDecode(word[2]), lemma: attr(word[1], 'lemma'), morph: attr(word[1], 'morph'), n: attr(word[1], 'n') || undefined }))
      if (!tokens.length || tokens.some((token) => !token.id || !token.text || !token.morph)) throw new Error(`OSHB verse ${osis.join('.')} has incomplete token data`)
      const punctuation = [...match[2].matchAll(/<seg[^>]*>([\s\S]*?)<\/seg>/gu)].map((seg) => xmlDecode(seg[1])).join('')
      verses.push({ book, chapter, verse, text: tokens.map((token) => token.text).join(' ') + punctuation, tokens })
    }
  }
  verses.sort((a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter || a.verse - b.verse)
  return { manifest, verses }
}

export const hooks: RecipeHooks<Parsed, Parsed> = {
  parse(bytes, context) { return parseSourceManifest(bytes, context.acquisition.resolved_location) },
  normalize(parsed) { return parsed },
  map(parsed, context) {
    const source = parsed.manifest
    const records: CorpusRecord[] = [
      { id: INSTITUTION, record_type: 'entity', kind: 'institution', labels: [{ value: 'Open Scriptures', role: 'preferred', language: 'en', script: 'Latn' }] },
      { id: LEMMA, record_type: 'entity', kind: 'predicate', labels: [{ value: 'has lemma', role: 'preferred', language: 'en', script: 'Latn' }] },
      { id: MORPH, record_type: 'entity', kind: 'predicate', labels: [{ value: 'has morphology', role: 'preferred', language: 'en', script: 'Latn' }] },
      { id: WORK, record_type: 'resource', kind: 'textual.work', labels: [{ value: 'Hebrew Bible', role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text' } } },
      { id: EXPRESSION, record_type: 'resource', kind: 'textual.expression', extensions: { textual: { work: WORK, language: 'he', script: 'Hebr' } } },
      { id: EDITION, record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'Westminster Leningrad Codex as distributed by Open Scriptures Hebrew Bible' } } },
      { id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact', extensions: { textual: { represents: EDITION, representation_kind: 'osis-xml-source-set', media_type: 'application/xml' }, source: { title: 'Open Scriptures Hebrew Bible / Westminster Leningrad Codex', institution: INSTITUTION, revision: `morphhb master commit ${COMMIT}`, canonical_url: `https://github.com/openscriptures/morphhb/tree/${COMMIT}/wlc`, language: 'he', script: 'Hebr', descriptor: { availability: 'bundled', locations: [`https://github.com/openscriptures/morphhb/archive/${COMMIT}.tar.gz`], media_type: 'application/gzip', byte_size: source.upstream.archiveByteSize, sha256: source.upstream.archiveSha256, retrieved_at: '2026-08-27T00:00:00Z' }, rights: { status: 'licensed', redistribution: 'permitted', license_expression: 'CC-BY-4.0', rights_uri: 'https://creativecommons.org/licenses/by/4.0/', attribution: 'Westminster Leningrad Codex public-domain text; OSHB lemma and morphology annotations © Open Scriptures, CC BY 4.0.', note: 'WLC text and OSHB annotations are represented separately in the source-preserving records; retain attribution when redistributing annotations.' } } } },
      { id: SCHEME, record_type: 'resource', kind: 'textual.citation_scheme', extensions: { textual: { applies_to: [EXPRESSION], components: [{ key: 'book', unit: 'book' }, { key: 'chapter', unit: 'chapter' }, { key: 'verse', unit: 'verse' }], delimiter: '.', example: 'Gen.1.1' } } },
      { id: PROVENANCE, record_type: 'provenance', source: ARTIFACT, source_reference: `Open Scriptures morphhb wlc directory at commit ${COMMIT}`, activities: [{ type: 'acquisition', method: 'Pinned OSHB archive and per-file SHA-256 manifest', software: { name: 'mw:recipe:oshb:wlc', version: '1' }, ended_at: '2026-08-27T00:00:00Z' }, { type: 'parsing', method: 'Parse OSIS verse and w token attributes without NFC normalization', software: { name: 'mw:recipe:oshb:wlc', version: 'oshb-osis-1' } }, { type: 'mapping', method: 'Map source Hebrew verse content and separate morphology evidence preserving OSHB token IDs', software: { name: 'mw:recipe:oshb:wlc', version: '1' } }] }
    ] as CorpusRecord[]
    for (const [index, verse] of parsed.verses.entries()) {
      const p = passageId(verse.book, verse.chapter, verse.verse); const c = contentId(verse.book, verse.chapter, verse.verse)
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
      records.push({ id: c, record_type: 'resource', kind: 'textual.content', extensions: { textual: { target: p, language: 'he', script: 'Hebr', representation: 'source', text: verse.text }, source: { artifact: ARTIFACT, provenance: PROVENANCE } } } as CorpusRecord)
      records.push({ id: morphologyId(verse.book, verse.chapter, verse.verse), record_type: 'evidence', target: c, relation: 'morphology', selector: { type: 'TextQuoteSelector', exact: verse.text }, provenance: PROVENANCE, extensions: { oshb: { verse: `${verse.book}.${verse.chapter}.${verse.verse}`, tokens: verse.tokens.map((token) => ({ id: token.id, lemma: token.lemma, morph: token.morph, ...(token.n ? { n: token.n } : {}) })) } } } as CorpusRecord)
    }
    return records
  },
  validate(records) {
    const verses = records.filter((record) => record.record_type === 'resource' && record.kind === 'textual.passage')
    const contents = records.filter((record) => record.record_type === 'resource' && record.kind === 'textual.content')
    const morphology = records.filter((record) => record.record_type === 'evidence' && record.relation === 'morphology')
    const ids = new Set(records.map((record) => record.id))
    const findings: string[] = []
    if (!verses.length || verses.length !== contents.length || contents.length !== morphology.length) findings.push('OSHB must have one passage, source content, and morphology evidence record per verse')
    if (ids.size !== records.length) findings.push('OSHB mapped IDs must be unique')
    return findings
  }
}
