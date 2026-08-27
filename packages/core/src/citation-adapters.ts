import type { CanonicalId } from './identifiers.js'
import type { CitationReference, TextualCitationSchemePayload } from './textual-profile.js'

export type P14CitationAdapterId =
  | 'hadith_report'
  | 'folio_line'
  | 'hymn_ang_raga'
  | 'chapter_verse'
  | 'tractate_mishnah'
  | 'fragment_selector'

export interface P14CitationAdapterDefinition {
  id: P14CitationAdapterId
  delimiter: string
  components: Array<{ key: string; unit: string; optional?: boolean }>
  example: string
}

export const P14_CITATION_ADAPTERS: Record<P14CitationAdapterId, P14CitationAdapterDefinition> = {
  hadith_report: {
    id: 'hadith_report',
    delimiter: ':',
    components: [
      { key: 'collection', unit: 'collection' },
      { key: 'book', unit: 'book' },
      { key: 'chapter', unit: 'chapter', optional: true },
      { key: 'report', unit: 'report' },
    ],
    example: 'bukhari:1:2:3',
  },
  folio_line: {
    id: 'folio_line',
    delimiter: ':',
    components: [
      { key: 'folio', unit: 'folio' },
      { key: 'line', unit: 'line' },
    ],
    example: '12r:8',
  },
  hymn_ang_raga: {
    id: 'hymn_ang_raga',
    delimiter: ':',
    components: [
      { key: 'raga', unit: 'raga' },
      { key: 'ang', unit: 'ang' },
      { key: 'hymn', unit: 'hymn' },
    ],
    example: 'asa:12:3',
  },
  chapter_verse: {
    id: 'chapter_verse',
    delimiter: ':',
    components: [
      { key: 'chapter', unit: 'chapter' },
      { key: 'verse', unit: 'verse' },
    ],
    example: '2:47',
  },
  tractate_mishnah: {
    id: 'tractate_mishnah',
    delimiter: ':',
    components: [
      { key: 'tractate', unit: 'tractate' },
      { key: 'chapter', unit: 'chapter' },
      { key: 'mishnah', unit: 'mishnah' },
    ],
    example: 'berakhot:1:1',
  },
  fragment_selector: {
    id: 'fragment_selector',
    delimiter: ':',
    components: [
      { key: 'fragment', unit: 'fragment' },
      { key: 'selector', unit: 'selector', optional: true },
    ],
    example: 'frag-17:lines-4-8',
  },
}

export type CitationComponentValues = Record<string, string | number | undefined>

function normalizedComponentValue(value: string | number): string {
  const text = String(value).trim()
  if (!text) throw new TypeError('Citation component values must not be empty')
  if (/\r|\n/u.test(text)) throw new TypeError('Citation component values must remain single-line')
  return text
}

export function buildP14CitationReference(
  adapterId: P14CitationAdapterId,
  scheme: CanonicalId,
  values: CitationComponentValues,
): CitationReference {
  const adapter = P14_CITATION_ADAPTERS[adapterId]
  const allowed = new Set(adapter.components.map((component) => component.key))
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && !allowed.has(key)) throw new TypeError(`Unexpected ${adapterId} citation component: ${key}`)
  }

  const path: string[] = []
  for (const component of adapter.components) {
    const value = values[component.key]
    if (value === undefined) {
      if (component.optional) continue
      throw new TypeError(`Missing required ${adapterId} citation component: ${component.key}`)
    }
    path.push(normalizedComponentValue(value))
  }

  return { scheme, reference: path.join(adapter.delimiter), path }
}

export function citationSchemePayloadForP14Adapter(
  adapterId: P14CitationAdapterId,
  appliesTo: CanonicalId[],
): TextualCitationSchemePayload {
  const adapter = P14_CITATION_ADAPTERS[adapterId]
  return {
    applies_to: [...appliesTo],
    components: adapter.components.map((component) => ({ ...component })),
    delimiter: adapter.delimiter,
    example: adapter.example,
  }
}
