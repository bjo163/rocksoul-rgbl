import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

const WORK = 'mw:work:dhammapada'
const PALI_EXPRESSION = 'mw:expression:dhammapada:pli'
const EXPRESSION = 'mw:expression:dhammapada:en-sujato'
const EDITION = 'mw:edition:dhammapada:sujato-2019'
const ARTIFACT = 'mw:artifact:dhammapada:suttacentral-sujato-1-20'
const CITATION = 'mw:citation-scheme:dhammapada:chapter-stanza-segment'
const PROVENANCE = 'mw:provenance:dhammapada:suttacentral-sujato-1-20'
const SUTTACENTRAL = 'mw:institution:suttacentral'

interface Segment { stanza: number; segment: number; text: string }
interface ParsedDhammapada { chapterTitle: string; segments: Segment[] }

function parseSource(text: string): ParsedDhammapada {
  const source = JSON.parse(text) as Record<string, string>
  const segments: Segment[] = []
  for (const [id, value] of Object.entries(source)) {
    const match = id.match(/^dhp(\d+):(\d+)$/)
    if (!match || Number(match[2]) === 0 || value === '') continue
    segments.push({ stanza: Number(match[1]), segment: Number(match[2]), text: value })
  }
  segments.sort((a, b) => a.stanza - b.stanza || a.segment - b.segment)
  return { chapterTitle: (source['dhp1:0.3'] ?? '1. Pairs').trim().replace(/^1\.\s*/, ''), segments }
}

function stanzaId(stanza: number): string { return `mw:passage:dhammapada:1:${stanza}` }
function segmentId(stanza: number, segment: number): string { return `mw:passage:dhammapada:1:${stanza}:${segment}` }
function contentId(stanza: number, segment: number): string { return `mw:content:dhammapada:1:${stanza}:${segment}:en-sujato` }

export const hooks: RecipeHooks<ParsedDhammapada, ParsedDhammapada> = {
  parse(bytes) {
    return parseSource(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  },
  normalize(parsed) {
    // Bilara segment values are preserved exactly, including punctuation and trailing spaces.
    return parsed
  },
  map(parsed) {
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
        description: 'English translation by Bhikkhu Sujato as published by SuttaCentral.',
        extensions: { textual: { work: WORK, language: 'en', script: 'Latn', relations: [{ relation: 'translation_of', expression: PALI_EXPRESSION }] } }
      },
      {
        id: EDITION, record_type: 'resource', kind: 'textual.edition',
        extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'SuttaCentral publication, edition 1 (2019), Bhikkhu Sujato, Sayings of the Dhamma' } }
      },
      {
        id: ARTIFACT, record_type: 'resource', kind: 'textual.artifact',
        extensions: {
          textual: { represents: EDITION, representation_kind: 'bilara_json_snapshot', media_type: 'application/json' },
          source: {
            title: 'Sayings of the Dhamma 1–20 — English translation by Bhikkhu Sujato',
            institution: SUTTACENTRAL,
            revision: 'bilara-data published commit cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6',
            canonical_url: 'https://suttacentral.net/dhp1-20/en/sujato',
            language: 'en', script: 'Latn',
            descriptor: {
              availability: 'bundled',
              locations: ['https://raw.githubusercontent.com/suttacentral/bilara-data/cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6/translation/en/sujato/sutta/kn/dhp/dhp1-20_translation-en-sujato.json'],
              media_type: 'application/json', byte_size: 4943,
              sha256: '0f4104ecc71702f56dd8a84ee3b3adbdfe3c544e10bbcf7a1d22c9b0c0975ac3',
              retrieved_at: '2026-08-26T21:02:01Z'
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
        source_reference: 'SuttaCentral bilara-data published branch, commit cf0dac3b59a3f9b1d4829acb311e303f1eb6bba6, dhp1-20_translation-en-sujato.json',
        activities: [
          { type: 'acquisition', method: 'Pinned HTTPS GitHub snapshot with SHA-256 verification', software: { name: 'curl', version: 'GitHub Actions ubuntu-latest' }, ended_at: '2026-08-26T21:02:01Z' },
          { type: 'parsing', method: 'Parse immutable Bilara segment identifiers and values', software: { name: 'mw:recipe:dhammapada:sujato-1-20', version: '1' } },
          { type: 'normalization', method: 'Identity normalization; segment text values are preserved exactly', software: { name: 'mw:recipe:dhammapada:sujato-1-20', version: 'identity-1' } },
          { type: 'mapping', method: 'Map chapter/stanza/segment hierarchy to generic textual profile', software: { name: 'mw:recipe:dhammapada:sujato-1-20', version: '1' } }
        ]
      }
    ] as CorpusRecord[]

    const chapter = 'mw:passage:dhammapada:1'
    records.push({
      id: chapter, record_type: 'resource', kind: 'textual.passage', labels: [{ value: parsed.chapterTitle, role: 'preferred', language: 'en', script: 'Latn' }],
      extensions: { textual: { container: EXPRESSION, unit: 'chapter', sequence: 1, local_id: '1', citations: [{ scheme: CITATION, reference: '1', path: ['1'] }] } }
    } as CorpusRecord)

    const byStanza = new Map<number, Segment[]>()
    for (const segment of parsed.segments) {
      const list = byStanza.get(segment.stanza) ?? []
      list.push(segment); byStanza.set(segment.stanza, list)
    }
    for (const stanza of [...byStanza.keys()].sort((a, b) => a - b)) {
      records.push({
        id: stanzaId(stanza), record_type: 'resource', kind: 'textual.passage',
        extensions: { textual: { container: EXPRESSION, parent: chapter, unit: 'stanza', sequence: stanza, local_id: String(stanza), citations: [{ scheme: CITATION, reference: `1:${stanza}`, path: ['1', String(stanza)] }] } }
      } as CorpusRecord)
      for (const segment of byStanza.get(stanza)!) {
        const target = segmentId(stanza, segment.segment)
        records.push({
          id: target, record_type: 'resource', kind: 'textual.passage',
          extensions: { textual: { container: EXPRESSION, parent: stanzaId(stanza), unit: 'segment', sequence: segment.segment, local_id: String(segment.segment), citations: [{ scheme: CITATION, reference: `1:${stanza}:${segment.segment}`, path: ['1', String(stanza), String(segment.segment)] }] } }
        } as CorpusRecord)
        records.push({
          id: contentId(stanza, segment.segment), record_type: 'resource', kind: 'textual.content',
          extensions: {
            textual: { target, language: 'en', script: 'Latn', representation: 'source', text: segment.text },
            source: { artifact: ARTIFACT, provenance: PROVENANCE }
          }
        } as CorpusRecord)
      }
    }
    return records
  },
  validate(records) {
    const findings: string[] = []
    const contents = records.filter((record) => record.record_type === 'resource' && record.kind === 'textual.content')
    const passages = records.filter((record) => record.record_type === 'resource' && record.kind === 'textual.passage')
    if (contents.length !== 90) findings.push(`Expected 90 Dhammapada segment content records, received ${contents.length}`)
    if (passages.length !== 111) findings.push(`Expected 111 Dhammapada passage records, received ${passages.length}`)
    if (new Set(records.map((record) => record.id)).size !== records.length) findings.push('Mapped Dhammapada record IDs must be unique')
    return findings
  }
}
