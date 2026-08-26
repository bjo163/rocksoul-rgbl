import type { CorpusRecord } from '@moonwitness/corpus-core'
import type { RecipeHooks } from '@moonwitness/corpus-ingestion'

const DATASET_VERSION = '0.1.0'
const WORK = 'mw:work:quran'
const EXPRESSION = 'mw:expression:quran:ar-uthmani-tanzil-1.1'
const EDITION = 'mw:edition:quran:tanzil-1.1-uthmani'
const ARTIFACT = 'mw:artifact:quran:tanzil-1.1-uthmani'
const CITATION = 'mw:citation-scheme:quran:surah-ayah'
const PROVENANCE = 'mw:provenance:quran:tanzil-1.1-uthmani'
const TANZIL = 'mw:institution:tanzil-project'

interface Verse { surah: number; ayah: number; text: string }
interface ParsedQuran { verses: Verse[]; notice: string }

function passageId(surah: number, ayah?: number): string {
  return ayah === undefined ? `mw:passage:quran:${surah}` : `mw:passage:quran:${surah}:${ayah}`
}

function contentId(surah: number, ayah: number): string {
  return `mw:content:quran:${surah}:${ayah}:ar-uthmani`
}

function parseSource(text: string): ParsedQuran {
  const verses: Verse[] = []
  const notice: string[] = []
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^(\d+)\|(\d+)\|(.*)$/u)
    if (match) {
      verses.push({ surah: Number(match[1]), ayah: Number(match[2]), text: match[3] })
    } else if (line.startsWith('#')) notice.push(line)
    else if (line.trim() !== '') throw new Error(`Unexpected Tanzil source line: ${line.slice(0, 80)}`)
  }
  return { verses, notice: notice.join('\n') }
}

function sourceExtension(): Record<string, unknown> {
  return { artifact: ARTIFACT, provenance: PROVENANCE }
}

export const hooks: RecipeHooks<ParsedQuran, ParsedQuran> = {
  parse(bytes) {
    return parseSource(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  },
  normalize(parsed) {
    // Tanzil permits redistribution of verbatim text but forbids changing the Quran text.
    // The normalizer is intentionally an identity function.
    return parsed
  },
  map(parsed) {
    const records: CorpusRecord[] = [
      {
        id: TANZIL,
        record_type: 'entity',
        kind: 'institution',
        labels: [{ value: 'Tanzil Project', role: 'preferred', language: 'en', script: 'Latn' }]
      },
      {
        id: WORK,
        record_type: 'resource',
        kind: 'textual.work',
        labels: [
          { value: 'Quran', role: 'preferred', language: 'en', script: 'Latn' },
          { value: 'القرآن', role: 'preferred', language: 'ar', script: 'Arab' }
        ],
        extensions: { textual: { work_type: 'religious_text' } }
      },
      {
        id: EXPRESSION,
        record_type: 'resource',
        kind: 'textual.expression',
        extensions: { textual: { work: WORK, language: 'ar', script: 'Arab' } }
      },
      {
        id: EDITION,
        record_type: 'resource',
        kind: 'textual.edition',
        extensions: { textual: { expressions: [EXPRESSION], edition_statement: 'Tanzil Quran Text Uthmani, Version 1.1' } }
      },
      {
        id: ARTIFACT,
        record_type: 'resource',
        kind: 'textual.artifact',
        description: 'Pinned verbatim Tanzil Uthmani v1.1 text snapshot acquired from the dotquran/corpus mirror at an exact commit.',
        extensions: {
          textual: { represents: EDITION, representation_kind: 'plain_text_snapshot', media_type: 'text/plain' },
          source: {
            title: 'Tanzil Quran Text — Uthmani, Version 1.1',
            institution: TANZIL,
            revision: '1.1 / mirror commit c23f5cec2e95e253dc450bd0f34d09e37ba40fac',
            canonical_url: 'https://tanzil.net/download/',
            language: 'ar',
            script: 'Arab',
            descriptor: {
              availability: 'bundled',
              locations: [
                'https://raw.githubusercontent.com/dotquran/corpus/c23f5cec2e95e253dc450bd0f34d09e37ba40fac/src/resources/uthmani.txt',
                'https://tanzil.net/download/'
              ],
              media_type: 'text/plain',
              byte_size: 1396087,
              sha256: '6933e133dd56db778c801bf738848454e43648105a151e8d84d86a7cae39ec5f',
              retrieved_at: '2026-08-26T21:02:01Z'
            },
            rights: {
              status: 'licensed',
              redistribution: 'permitted',
              license_expression: 'CC-BY-3.0',
              rights_uri: 'https://creativecommons.org/licenses/by/3.0/',
              attribution: 'Quran text source: Tanzil Project (https://tanzil.net).',
              note: 'Tanzil permits verbatim redistribution with attribution and requires the text not be changed. The bundled raw snapshot retains the upstream copyright notice.'
            }
          }
        }
      },
      {
        id: 'mw:resource:quran:tanzil-rights-notice',
        record_type: 'resource',
        kind: 'source.notice',
        description: parsed.notice,
        extensions: {
          source: {
            title: 'Tanzil Quran Text copyright and redistribution notice',
            institution: TANZIL,
            canonical_url: 'https://tanzil.net/download/',
            rights: {
              status: 'licensed', redistribution: 'permitted', license_expression: 'CC-BY-3.0',
              rights_uri: 'https://creativecommons.org/licenses/by/3.0/',
              attribution: 'Quran text source: Tanzil Project (https://tanzil.net).'
            }
          }
        }
      },
      {
        id: CITATION,
        record_type: 'resource',
        kind: 'textual.citation_scheme',
        extensions: {
          textual: {
            applies_to: [EXPRESSION],
            components: [{ key: 'surah', unit: 'surah' }, { key: 'ayah', unit: 'ayah' }],
            delimiter: ':', example: '2:255'
          }
        }
      },
      {
        id: PROVENANCE,
        record_type: 'provenance',
        source: ARTIFACT,
        source_reference: 'Tanzil Uthmani v1.1; pinned dotquran mirror commit c23f5cec2e95e253dc450bd0f34d09e37ba40fac',
        activities: [
          { type: 'acquisition', method: 'Pinned HTTPS mirror snapshot with SHA-256 verification', software: { name: 'curl', version: 'GitHub Actions ubuntu-latest' }, ended_at: '2026-08-26T21:02:01Z' },
          { type: 'parsing', method: 'Parse source rows as surah|ayah|text without altering text', software: { name: 'mw:recipe:quran:tanzil-uthmani-1.1', version: DATASET_VERSION } },
          { type: 'normalization', method: 'Identity normalization; Quran text is not modified', software: { name: 'mw:recipe:quran:tanzil-uthmani-1.1', version: 'identity-1' } },
          { type: 'mapping', method: 'Map rows to generic textual Work/Expression/Edition/Passage/Content records', software: { name: 'mw:recipe:quran:tanzil-uthmani-1.1', version: '1' } }
        ]
      }
    ] as CorpusRecord[]

    const bySurah = new Map<number, Verse[]>()
    for (const verse of parsed.verses) {
      const list = bySurah.get(verse.surah) ?? []
      list.push(verse)
      bySurah.set(verse.surah, list)
    }

    for (const surah of [...bySurah.keys()].sort((a, b) => a - b)) {
      records.push({
        id: passageId(surah), record_type: 'resource', kind: 'textual.passage',
        extensions: { textual: { container: EXPRESSION, unit: 'surah', sequence: surah, local_id: String(surah), citations: [{ scheme: CITATION, reference: String(surah), path: [String(surah)] }] } }
      } as CorpusRecord)
      for (const verse of bySurah.get(surah)!) {
        const target = passageId(surah, verse.ayah)
        records.push({
          id: target, record_type: 'resource', kind: 'textual.passage',
          extensions: { textual: { container: EXPRESSION, parent: passageId(surah), unit: 'ayah', sequence: verse.ayah, local_id: String(verse.ayah), citations: [{ scheme: CITATION, reference: `${surah}:${verse.ayah}`, path: [String(surah), String(verse.ayah)] }] } }
        } as CorpusRecord)
        records.push({
          id: contentId(surah, verse.ayah), record_type: 'resource', kind: 'textual.content',
          extensions: {
            textual: { target, language: 'ar', script: 'Arab', representation: 'source', text: verse.text },
            source: sourceExtension()
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
    if (contents.length !== 6236) findings.push(`Expected 6236 Quran content records, received ${contents.length}`)
    if (passages.length !== 6350) findings.push(`Expected 6350 Quran passage records, received ${passages.length}`)
    const ids = new Set(records.map((record) => record.id))
    if (ids.size !== records.length) findings.push('Mapped Quran record IDs must be unique')
    return findings
  }
}
