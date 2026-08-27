import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

const WORK = 'mw:work:dhammapada'
const PALI_EXPRESSION = 'mw:expression:dhammapada:pli'
const EXPRESSION = 'mw:expression:dhammapada:en-sujato'
const EDITION = 'mw:edition:dhammapada:sujato-2019'
const ARTIFACT = 'mw:artifact:dhammapada:suttacentral-sujato-complete'
const CITATION = 'mw:citation-scheme:dhammapada:chapter-stanza-segment'
const PROVENANCE = 'mw:provenance:dhammapada:suttacentral-sujato-complete'
const SUTTACENTRAL = 'mw:institution:suttacentral'
const UPSTREAM_COMMIT = 'cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6'

interface SourceFile {
  file: string
  upstreamPath: string
  start: number
  end: number
  byteSize: number
  sha256: string
  gitBlobSha1: string
}

interface SourceManifest {
  formatVersion: '1'
  upstream: {
    repository: 'suttacentral/bilara-data'
    branch: 'published'
    commit: string
  }
  files: SourceFile[]
}

interface Segment { stanza: number; segment: number; text: string }
interface Chapter {
  chapter: number
  start: number
  end: number
  title: string
  source: SourceFile
  segments: Segment[]
}
interface ParsedDhammapada { sourceManifest: SourceManifest; chapters: Chapter[] }

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function gitBlobSha1(bytes: Uint8Array): string {
  const header = Buffer.from(`blob ${bytes.byteLength}\0`, 'utf8')
  return createHash('sha1').update(header).update(bytes).digest('hex')
}

function chapterId(chapter: number): string { return `mw:passage:dhammapada:${chapter}` }
function stanzaId(chapter: number, stanza: number): string { return `mw:passage:dhammapada:${chapter}:${stanza}` }
function segmentId(chapter: number, stanza: number, segment: number): string { return `mw:passage:dhammapada:${chapter}:${stanza}:${segment}` }
function contentId(chapter: number, stanza: number, segment: number): string { return `mw:content:dhammapada:${chapter}:${stanza}:${segment}:en-sujato` }

async function parseSourceManifest(bytes: Uint8Array, resolvedLocation: string): Promise<ParsedDhammapada> {
  const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as SourceManifest
  if (manifest.formatVersion !== '1') throw new Error(`Unsupported Dhammapada source manifest version ${manifest.formatVersion}`)
  if (manifest.upstream.repository !== 'suttacentral/bilara-data') throw new Error('Unexpected Dhammapada upstream repository')
  if (manifest.upstream.branch !== 'published') throw new Error('Dhammapada source must be pinned from the SuttaCentral published branch')
  if (manifest.upstream.commit !== UPSTREAM_COMMIT) throw new Error(`Dhammapada source commit must remain ${UPSTREAM_COMMIT}`)
  if (manifest.files.length !== 26) throw new Error(`Expected 26 Dhammapada chapter source files, received ${manifest.files.length}`)

  const sourceRoot = path.dirname(resolvedLocation)
  const chapters: Chapter[] = []

  for (const [index, sourceFile] of manifest.files.entries()) {
    if (path.isAbsolute(sourceFile.file) || sourceFile.file.includes('..')) throw new Error(`Unsafe source file path ${sourceFile.file}`)
    const file = path.resolve(sourceRoot, sourceFile.file)
    if (!file.startsWith(`${path.resolve(sourceRoot)}${path.sep}`)) throw new Error(`Source file escapes source directory: ${sourceFile.file}`)
    const fileBytes = await readFile(file)
    if (fileBytes.byteLength !== sourceFile.byteSize) throw new Error(`Byte-size mismatch for ${sourceFile.file}`)
    if (sha256(fileBytes) !== sourceFile.sha256) throw new Error(`SHA-256 mismatch for ${sourceFile.file}`)
    if (gitBlobSha1(fileBytes) !== sourceFile.gitBlobSha1) throw new Error(`Git blob SHA-1 mismatch for ${sourceFile.file}`)

    const source = JSON.parse(fileBytes.toString('utf8')) as Record<string, string>
    const title = (source[`dhp${sourceFile.start}:0.3`] ?? '').trim()
    if (!title) throw new Error(`Missing chapter title in ${sourceFile.file}`)

    const segments: Segment[] = []
    for (const [id, value] of Object.entries(source)) {
      const match = id.match(/^dhp(\d+):(\d+)$/u)
      if (!match || Number(match[2]) === 0 || value === '') continue
      const stanza = Number(match[1])
      const segment = Number(match[2])
      if (stanza < sourceFile.start || stanza > sourceFile.end) throw new Error(`Out-of-range segment ${id} in ${sourceFile.file}`)
      segments.push({ stanza, segment, text: value })
    }
    segments.sort((a, b) => a.stanza - b.stanza || a.segment - b.segment)
    chapters.push({
      chapter: index + 1,
      start: sourceFile.start,
      end: sourceFile.end,
      title: title.replace(/^\d+\.\s*/u, ''),
      source: sourceFile,
      segments,
    })
  }

  return { sourceManifest: manifest, chapters }
}

export const hooks: RecipeHooks<ParsedDhammapada, ParsedDhammapada> = {
  async parse(bytes, context) {
    return parseSourceManifest(bytes, context.acquisition.resolved_location)
  },
  normalize(parsed) {
    // Bilara segment values are preserved exactly, including punctuation, markup tags, and trailing spaces.
    return parsed
  },
  map(parsed, context) {
    const records: CorpusRecord[] = [
      {
        id: SUTTACENTRAL, record_type: 'entity', kind: 'institution',
        labels: [{ value: 'SuttaCentral', role: 'preferred', language: 'en', script: 'Latn' }]
      },
      {
        id: WORK, record_type: 'resource', kind: 'textual.work',
        labels: [{ value: 'Dhammapada', role: 'preferred', language: 'en', script: 'Latn' }],
        extensions: { textual: { work_type: 'religious_text' } }
      },
      {
        id: PALI_EXPRESSION, record_type: 'resource', kind: 'textual.expression',
        extensions: { textual: { work: WORK, language: 'pli' } }
      },
      {
        id: EXPRESSION, record_type: 'resource', kind: 'textual.expression',
        description: 'Complete English translation by Bhikkhu Sujato as published by SuttaCentral.',
        extensions: { textual: { work: WORK, language: 'en', script: 'Latn', relations: [{ relation: 'translation_of', expression: PALI_EXPRESSION }] } }
      },
      {
        id: EDITION, record_type: 'resource', kind: 'textual.edition',
        extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'SuttaCentral publication scpub7, Bhikkhu Sujato, Sayings of the Dhamma' } }
      },
      {
        id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact',
        extensions: {
          textual: { represents: EDITION, representation_kind: 'bilara_json_source_set', media_type: 'application/json' },
          source: {
            title: 'Complete Sayings of the Dhamma — English translation by Bhikkhu Sujato',
            institution: SUTTACENTRAL,
            revision: `bilara-data published commit ${UPSTREAM_COMMIT}`,
            canonical_url: 'https://suttacentral.net/edition/dhp/en/sujato',
            language: 'en', script: 'Latn',
            descriptor: {
              availability: 'bundled',
              locations: [`https://github.com/suttacentral/bilara-data/tree/${UPSTREAM_COMMIT}/translation/en/sujato/sutta/kn/dhp`],
              media_type: 'application/json',
              byte_size: context.acquisition.source.byte_size,
              sha256: context.acquisition.sha256,
              retrieved_at: '2026-08-27T00:00:00Z'
            },
            rights: {
              status: 'public_domain', redistribution: 'permitted', license_expression: 'CC0-1.0',
              rights_uri: 'https://creativecommons.org/publicdomain/zero/1.0/',
              attribution: 'Bhikkhu Sujato / SuttaCentral (CC0).',
              note: 'SuttaCentral publication metadata dedicates this translation to the public domain under CC0.'
            }
          }
        }
      },
      {
        id: CITATION, record_type: 'resource', kind: 'textual.citation_scheme',
        extensions: { textual: { applies_to: [EXPRESSION], components: [{ key: 'chapter', unit: 'chapter' }, { key: 'stanza', unit: 'stanza' }, { key: 'segment', unit: 'segment' }], delimiter: ':', example: '1:1:1' } }
      },
      {
        id: PROVENANCE, record_type: 'provenance', source: ARTIFACT,
        source_reference: `SuttaCentral bilara-data published branch, commit ${UPSTREAM_COMMIT}, complete translation/en/sujato/sutta/kn/dhp source set`,
        activities: [
          { type: 'acquisition', method: 'Pinned GitHub raw snapshots recorded in a deterministic source manifest with SHA-256 and Git blob verification', software: { name: 'scripts/acquire-dhammapada-sujato.mjs', version: '1' }, ended_at: '2026-08-27T00:00:00Z' },
          { type: 'parsing', method: 'Parse immutable Bilara segment identifiers and values from 26 chapter-range files', software: { name: 'mw:recipe:dhammapada:sujato', version: '1' } },
          { type: 'normalization', method: 'Identity normalization; Bilara segment text values are preserved exactly', software: { name: 'mw:recipe:dhammapada:sujato', version: 'identity-1' } },
          { type: 'mapping', method: 'Map 26 chapters, 423 stanzas, and source segments to the generic textual profile', software: { name: 'mw:recipe:dhammapada:sujato', version: '1' } }
        ]
      }
    ] as CorpusRecord[]

    for (const chapter of parsed.chapters) {
      const chapterTarget = chapterId(chapter.chapter)
      records.push({
        id: chapterTarget, record_type: 'resource', kind: 'textual.passage',
        labels: [{ value: chapter.title, role: 'preferred', language: 'en', script: 'Latn' }],
        extensions: { textual: { container: EXPRESSION, unit: 'chapter', sequence: chapter.chapter, local_id: String(chapter.chapter), citations: [{ scheme: CITATION, reference: String(chapter.chapter), path: [String(chapter.chapter)] }] } }
      } as CorpusRecord)

      const byStanza = new Map<number, Segment[]>()
      for (const segment of chapter.segments) {
        const list = byStanza.get(segment.stanza) ?? []
        list.push(segment)
        byStanza.set(segment.stanza, list)
      }

      for (const stanza of [...byStanza.keys()].sort((a, b) => a - b)) {
        const stanzaTarget = stanzaId(chapter.chapter, stanza)
        records.push({
          id: stanzaTarget, record_type: 'resource', kind: 'textual.passage',
          extensions: { textual: { container: EXPRESSION, parent: chapterTarget, unit: 'stanza', sequence: stanza - chapter.start + 1, local_id: String(stanza), citations: [{ scheme: CITATION, reference: `${chapter.chapter}:${stanza}`, path: [String(chapter.chapter), String(stanza)] }] } }
        } as CorpusRecord)

        for (const segment of byStanza.get(stanza)!) {
          const target = segmentId(chapter.chapter, stanza, segment.segment)
          records.push({
            id: target, record_type: 'resource', kind: 'textual.passage',
            extensions: { textual: { container: EXPRESSION, parent: stanzaTarget, unit: 'segment', sequence: segment.segment, local_id: String(segment.segment), citations: [{ scheme: CITATION, reference: `${chapter.chapter}:${stanza}:${segment.segment}`, path: [String(chapter.chapter), String(stanza), String(segment.segment)] }] } }
          } as CorpusRecord)
          records.push({
            id: contentId(chapter.chapter, stanza, segment.segment), record_type: 'resource', kind: 'textual.content',
            extensions: {
              textual: { target, language: 'en', script: 'Latn', representation: 'source', text: segment.text },
              source: { artifact: ARTIFACT, provenance: PROVENANCE }
            }
          } as CorpusRecord)
        }
      }
    }
    return records
  },
  validate(records) {
    const findings: string[] = []
    const resources = records.filter((record) => record.record_type === 'resource')
    const passages = resources.filter((record) => record.kind === 'textual.passage')
    const chapters = passages.filter((record) => record.extensions?.textual?.unit === 'chapter')
    const stanzas = passages.filter((record) => record.extensions?.textual?.unit === 'stanza')
    const segments = passages.filter((record) => record.extensions?.textual?.unit === 'segment')
    const contents = resources.filter((record) => record.kind === 'textual.content')
    if (chapters.length !== 26) findings.push(`Expected 26 Dhammapada chapters, received ${chapters.length}`)
    if (stanzas.length !== 423) findings.push(`Expected 423 Dhammapada stanzas, received ${stanzas.length}`)
    if (segments.length !== contents.length) findings.push(`Expected one content record per source segment, received ${segments.length} segments and ${contents.length} contents`)
    if (contents.length <= 423) findings.push(`Expected source segmentation finer than stanza level, received ${contents.length} content records`)
    const stanzaNumbers = stanzas.map((record) => Number(record.extensions?.textual?.local_id)).sort((a, b) => a - b)
    for (let stanza = 1; stanza <= 423; stanza += 1) {
      if (stanzaNumbers[stanza - 1] !== stanza) findings.push(`Missing or duplicated Dhammapada stanza ${stanza}`)
    }
    if (new Set(records.map((record) => record.id)).size !== records.length) findings.push('Mapped Dhammapada record IDs must be unique')
    return findings
  }
}
