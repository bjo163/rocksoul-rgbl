import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

const COMMIT = 'cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6'
const INSTITUTION = 'mw:institution:suttacentral'
const PROVENANCE = 'mw:provenance:suttacentral:dn-mn-sujato'
type Collection = 'dn' | 'mn'
interface SourceFile { file: string; upstreamPath: string; byteSize: number; sha256: string }
interface Manifest { formatVersion: '1'; upstream: { repository: string; branch: string; commit: string }; files: SourceFile[] }
interface Sutta { collection: Collection; localId: string; title: string; segments: Array<{ id: string; text: string }> }
interface Parsed { manifest: Manifest; suttas: Sutta[] }
function sha(bytes: Uint8Array): string { return createHash('sha256').update(bytes).digest('hex') }
function safe(value: string): string { return value.toLowerCase().replaceAll(/[^a-z0-9._-]+/gu, '-') }
function work(c: Collection): string { return `mw:work:suttapitaka:${c}` }
function expression(c: Collection): string { return `mw:expression:suttapitaka:${c}:en-sujato` }
function edition(c: Collection): string { return `mw:edition:suttapitaka:${c}:sujato-published` }
function scheme(c: Collection): string { return `mw:citation-scheme:suttapitaka:${c}:sutta-segment` }
function artifact(c: Collection): string { return `mw:artifact:suttacentral:${c}-sujato` }
async function parseManifest(bytes: Uint8Array, location: string): Promise<Parsed> {
  const manifest = JSON.parse(new TextDecoder('utf8', { fatal: true }).decode(bytes)) as Manifest
  if (manifest.formatVersion !== '1' || manifest.upstream.repository !== 'suttacentral/bilara-data' || manifest.upstream.branch !== 'published' || manifest.upstream.commit !== COMMIT || manifest.files.length !== 186) throw new Error('Unexpected DN/MN source manifest')
  const root = path.dirname(location); const suttas: Sutta[] = []
  for (const source of manifest.files) {
    const file = path.resolve(root, source.file)
    if (!file.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`Unsafe source path ${source.file}`)
    const raw = await readFile(file)
    if (raw.byteLength !== source.byteSize || sha(raw) !== source.sha256) throw new Error(`Checksum mismatch ${source.file}`)
    const match = path.basename(source.file).match(/^(dn|mn)(\d+)_translation-en-sujato\.json$/u)
    if (!match) throw new Error(`Unexpected source filename ${source.file}`)
    const collection = match[1] as Collection; const localId = `${collection}${match[2]}`
    const values = JSON.parse(raw.toString('utf8')) as Record<string, string>
    const segments = Object.entries(values).filter(([id, text]) => id.startsWith(`${localId}:`) && text !== '').map(([id, text]) => ({ id: id.slice(localId.length + 1), text }))
    if (!segments.length) throw new Error(`No segments in ${source.file}`)
    const title = (values[`${localId}:0.2`] ?? values[`${localId}:0.1`] ?? localId).trim()
    suttas.push({ collection, localId, title, segments })
  }
  suttas.sort((a, b) => a.collection.localeCompare(b.collection) || Number(a.localId.slice(2)) - Number(b.localId.slice(2)))
  return { manifest, suttas }
}
export const hooks: RecipeHooks<Parsed, Parsed> = {
  parse(bytes, context) { return parseManifest(bytes, context.acquisition.resolved_location) },
  normalize(parsed) { return parsed },
  map(parsed, context) {
    const records: CorpusRecord[] = []
    for (const c of ['dn', 'mn'] as const) {
      records.push({ id: work(c), record_type: 'resource', kind: 'textual.work', labels: [{ value: c === 'dn' ? 'Dīgha Nikāya' : 'Majjhima Nikāya', role: 'preferred', language: 'pli', script: 'Latn' }], extensions: { textual: { work_type: 'religious_text_collection' } } } as CorpusRecord)
      records.push({ id: expression(c), record_type: 'resource', kind: 'textual.expression', extensions: { textual: { work: work(c), language: 'en', script: 'Latn' } } } as CorpusRecord)
      records.push({ id: edition(c), record_type: 'resource', kind: 'textual.edition', extensions: { textual: { expressions: [expression(c)], edition_statement: `Bhikkhu Sujato English translation, SuttaCentral published@${COMMIT}` } } } as CorpusRecord)
      records.push({ id: scheme(c), record_type: 'resource', kind: 'textual.citation_scheme', extensions: { textual: { applies_to: [expression(c)], components: [{ key: 'sutta', unit: 'sutta' }, { key: 'segment', unit: 'segment' }], delimiter: ':', example: `${c}1:1.1.1` } } } as CorpusRecord)
      records.push({ id: artifact(c), record_type: 'resource', kind: 'textual.artifact', extensions: { textual: { represents: edition(c), representation_kind: 'bilara-json-source-set', media_type: 'application/json' }, source: { title: `SuttaCentral ${c.toUpperCase()} English translations by Bhikkhu Sujato`, institution: INSTITUTION, revision: `bilara-data published commit ${COMMIT}`, canonical_url: `https://github.com/suttacentral/bilara-data/tree/${COMMIT}/translation/en/sujato/sutta/${c}`, language: 'en', script: 'Latn', descriptor: { availability: 'bundled', locations: [`https://github.com/suttacentral/bilara-data/tree/${COMMIT}/translation/en/sujato/sutta/${c}`], media_type: 'application/json', byte_size: context.acquisition.source.byte_size, sha256: context.acquisition.sha256, retrieved_at: '2026-08-27T00:00:00Z' }, rights: { status: 'public_domain', redistribution: 'permitted', license_expression: 'CC0-1.0', rights_uri: 'https://creativecommons.org/publicdomain/zero/1.0/', attribution: 'Bhikkhu Sujato / SuttaCentral (CC0).', note: 'Bilara-supported SuttaCentral translations are dedicated to the public domain.' } } } } as CorpusRecord)
    }
    records.push({ id: PROVENANCE, record_type: 'provenance', source: artifact('dn'), source_reference: `SuttaCentral bilara-data published@${COMMIT}, DN and MN Sujato translation files`, activities: [{ type: 'acquisition', method: 'Pinned 186 GitHub source files with per-file SHA-256 manifest', software: { name: 'mw:recipe:suttacentral:dn-mn-sujato', version: '1' }, ended_at: '2026-08-27T00:00:00Z' }, { type: 'normalization', method: 'Identity; Bilara segment values are preserved exactly', software: { name: 'mw:recipe:suttacentral:dn-mn-sujato', version: 'identity-1' } }] } as CorpusRecord)
    for (const [suttaIndex, sutta] of parsed.suttas.entries()) {
      const suttaId = `mw:passage:suttacentral:${sutta.collection}:${sutta.localId}`
      records.push({ id: suttaId, record_type: 'resource', kind: 'textual.passage', labels: [{ value: sutta.title, role: 'preferred', language: 'en', script: 'Latn' }], extensions: { textual: { container: expression(sutta.collection), unit: 'sutta', sequence: suttaIndex + 1, local_id: sutta.localId, citations: [{ scheme: scheme(sutta.collection), reference: sutta.localId, path: [sutta.localId] }] } } } as CorpusRecord)
      for (const [index, segment] of sutta.segments.entries()) {
        const segmentPart = safe(segment.id); const target = `${suttaId}:${segmentPart}`
        records.push({ id: target, record_type: 'resource', kind: 'textual.passage', extensions: { textual: { container: expression(sutta.collection), parent: suttaId, unit: 'segment', sequence: index + 1, local_id: segment.id, citations: [{ scheme: scheme(sutta.collection), reference: `${sutta.localId}:${segment.id}`, path: [sutta.localId, segment.id] }] } } } as CorpusRecord)
        records.push({ id: `mw:content:suttacentral:${sutta.collection}:${sutta.localId}:${segmentPart}:en-sujato`, record_type: 'resource', kind: 'textual.content', extensions: { textual: { target, language: 'en', script: 'Latn', representation: 'source', text: segment.text }, source: { artifact: artifact(sutta.collection), provenance: PROVENANCE } } } as CorpusRecord)
      }
    }
    return records
  },
  validate(records) { const suttas = records.filter((r) => r.record_type === 'resource' && r.kind === 'textual.passage' && r.extensions?.textual?.unit === 'sutta'); return suttas.length === 186 ? [] : [`Expected 186 DN/MN suttas, got ${suttas.length}`] }
}
