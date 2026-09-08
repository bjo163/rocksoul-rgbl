import type { CorpusRecord } from '@moonwitness/corpus-core'
import { UniversalCorpusRegistry } from './registry/universal-registry.js'

export type WorkRole = 'AUTHOR' | 'COAUTHOR' | 'TRANSLATOR' | 'COMPILER' | 'EDITOR' | 'COMMENTATOR' | 'ADAPTER' | 'ATTRIBUTED_AUTHOR' | 'TRADITIONAL_ATTRIBUTION' | 'ANONYMOUS' | 'UNKNOWN'
export type AttributionStatus = 'HISTORICALLY_ESTABLISHED' | 'TRADITIONAL' | 'DISPUTED' | 'UNCERTAIN' | 'UNKNOWN'
export type WorkEvidenceStatus = 'SUPPORTED' | 'TRADITIONAL' | 'INFERRED' | 'UNCERTAIN' | 'DISPUTED'

export interface WorkEvidence {
  sourceId: string
  sourceIdentifier: string
  locator: string
  evidence: string
  status: WorkEvidenceStatus
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface WorkAttribution {
  workId: string
  personId?: string
  role: WorkRole
  status: AttributionStatus
  evidence: WorkEvidence
}

export interface WorkMetadata {
  workId: string
  canonicalName: string
  aliases: string[]
  alternateTitles: string[]
  workType: string
  traditionId: string
  originalLanguage?: string
  primaryLanguage?: string
  compositionDate?: string
  datePrecision: 'EXACT' | 'YEAR' | 'RANGE' | 'APPROXIMATE' | 'UNKNOWN'
  dateStatus: 'SUPPORTED' | 'UNCERTAIN' | 'UNKNOWN'
  externalIdentifiers: string[]
  evidence: WorkEvidence
}

export interface WorkDepthRow {
  workId: string
  metadata: WorkMetadata
  persons: string[]
  traditions: string[]
  languages: string[]
  sources: string[]
  editions: string[]
  materializedEditions: string[]
  measuredEditions: string[]
  events: string[]
  profile: string[]
}

export interface WorkDepthSummary {
  schemaVersion: '1.0.0'
  totalWorks: number
  identifiedWorks: number
  worksWithExternalIDs: number
  worksWithAuthors: number
  worksWithTraditions: number
  worksWithLanguages: number
  worksWithSources: number
  worksWithDates: number
  worksWithEvents: number
  worksWithEditions: number
  worksWithMaterializedEditions: number
  worksWithMeasuredEditions: number
  worksWithMultipleEditions: number
  temporal: { exact: number; year: number; range: number; approximate: number; disputed: number; unknown: number }
  rows: WorkDepthRow[]
}

export function validateAttribution(attribution: WorkAttribution): string[] {
  const problems: string[] = []
  if (!attribution.evidence.sourceId || !attribution.evidence.sourceIdentifier || !attribution.evidence.locator || !attribution.evidence.evidence) problems.push('attribution evidence is incomplete')
  if (attribution.role === 'TRADITIONAL_ATTRIBUTION' && attribution.status !== 'TRADITIONAL') problems.push('traditional attribution must retain TRADITIONAL status')
  if (attribution.role === 'ATTRIBUTED_AUTHOR' && attribution.status === 'HISTORICALLY_ESTABLISHED') problems.push('attributed author cannot be historically established without a source-specific migration')
  return problems
}

const WORK_SOURCE: WorkEvidence = {
  sourceId: 'mw:source:moonwitness-work-registry',
  sourceIdentifier: 'config/works.json',
  locator: 'config/works.json',
  evidence: 'Explicit canonical work registry entry; no external authority is implied.',
  status: 'SUPPORTED',
  confidence: 'HIGH'
}

function dateShape(value: string | undefined): WorkMetadata['datePrecision'] {
  if (!value) return 'UNKNOWN'
  if (/\b\d{4}\b/.test(value) && !/[–-]/.test(value) && !/\b(?:century|oral|ancestral|tradition|codified|documented|recorded)\b/i.test(value)) return 'YEAR'
  if (/[–-]/.test(value)) return 'RANGE'
  return 'APPROXIMATE'
}

export function metadataFromWork(work: any): WorkMetadata {
  const datePrecision = dateShape(work.compositionDate)
  return {
    workId: work.id,
    canonicalName: work.name,
    aliases: [],
    alternateTitles: [work.nativeTitle, work.shortTitle, work.longTitle].filter((x): x is string => Boolean(x)),
    workType: work.workType,
    traditionId: work.traditionId,
    originalLanguage: work.originalLanguage,
    primaryLanguage: work.primaryLanguage,
    compositionDate: work.compositionDate,
    datePrecision,
    dateStatus: work.compositionDate ? 'UNCERTAIN' : 'UNKNOWN',
    externalIdentifiers: [],
    evidence: WORK_SOURCE
  }
}

export async function auditWorkDepth(root = process.cwd()): Promise<WorkDepthSummary> {
  const registry = await new UniversalCorpusRegistry(`${root}/config`).loadAll()
  const repository = await import('@moonwitness/corpus-node').then(({ FileSystemCorpusRepository }) => FileSystemCorpusRepository.open(root))
  const records = repository.getAllRecords ? repository.getAllRecords() : new Map<string, CorpusRecord>()
  const resources = [...records.values()].filter((record): record is Extract<CorpusRecord, { record_type: 'resource' }> => record.record_type === 'resource')
  const editions = registry.getEditions()
  const workIds = new Set(registry.getWorks().map(work => work.id))
  // These are explicit source-defined mappings between the 31 existing textual
  // work namespaces and the canonical registry. They are identity mappings,
  // not fuzzy title matches, and do not create or rename any work.
  const corpusAliases: Record<string, string> = {
    'bahai:hidden-words': 'hidden-words', 'bible:web-classic': 'world-english-bible',
    'christianity:early-writings': 'early-christian-writings', 'confucianism:analects': 'analects',
    'dhammapada': 'dhammapada', 'hadith:bukhari': 'hadith-bukhari', 'hadith:muslim': 'hadith-muslim',
    'hadith:nawawi-40': 'hadith-nawawi-40', 'hebrew-bible': 'tanakh', 'hinduism:bhagavad-gita': 'bhagavad-gita',
    'hinduism:principal-upanishads': 'principal-upanishads', 'hinduism:yoga-sutras': 'yoga-sutras',
    'islam:asmaul-husna': 'asmaul-husna', 'islam:duas-authentic': 'duas-hisnul-muslim',
    'islam:tafsir-sample': 'tafsir-sample', 'jainism:tattvartha-sutra': 'tattvartha-sutra',
    'mishnah:pirkei-avot': 'mishnah-pirkei-avot', 'new-testament': 'greek-new-testament',
    'shinto:kojiki': 'kojiki', 'sikhism:japji-sahib': 'japji-sahib', 'suttapitaka:an': 'anguttara-nikaya',
    'suttapitaka:dn': 'digha-nikaya', 'suttapitaka:mn': 'majjhima-nikaya', 'suttapitaka:sn': 'samyutta-nikaya',
    'taoism:tao-te-ching': 'tao-te-ching', 'zoroastrianism:gathas': 'yasna-gathas'
  }
  const mapCorpusWork = (id: string) => corpusAliases[id] ?? id
  const resourcesByWork = new Map<string, typeof resources>()
  const expressionWork = new Map<string, string>()
  const add = (workId: string, resource: typeof resources[number]) => {
    if (!workIds.has(workId)) return
    const bucket = resourcesByWork.get(workId) ?? []
    bucket.push(resource)
    resourcesByWork.set(workId, bucket)
  }
  for (const resource of resources) {
    const textual = resource.extensions?.textual as { work?: string; expressions?: string[]; target?: string } | undefined
    if (resource.kind === 'textual.work' && resource.id.startsWith('mw:work:')) add(mapCorpusWork(resource.id.slice('mw:work:'.length)), resource)
    if (resource.kind === 'textual.expression' && textual?.work?.startsWith('mw:work:')) {
      const workId = mapCorpusWork(textual.work.slice('mw:work:'.length))
      expressionWork.set(resource.id, workId)
      add(workId, resource)
    }
  }
  const editionWork = new Map<string, string>()
  for (const edition of editions) editionWork.set(`mw:edition:${edition.id}`, edition.workId)
  for (const resource of resources) {
    if (resource.kind === 'textual.edition') {
      const workId = resource.id.startsWith('mw:edition:') ? editionWork.get(resource.id) : undefined
      if (workId) add(workId, resource)
      else for (const expression of ((resource.extensions?.textual as { expressions?: string[] } | undefined)?.expressions ?? [])) {
        const expressionWorkId = expressionWork.get(expression)
        if (expressionWorkId) { add(expressionWorkId, resource); break }
      }
    }
  }
  const materializedWorkIds = new Set(resources.filter(resource => resource.kind === 'textual.content').flatMap(resource => {
    const id = resource.id
    return [...workIds].filter(workId => id === `mw:content:${workId}` || id.includes(`:${workId}:`))
  }))
  const endpointsByWork = new Map<string, Set<string>>()
  for (const work of registry.getWorks()) endpointsByWork.set(work.id, new Set(registry.resolveWorkSources(work.id).map(source => source.id)))
  const rows = registry.getWorks().map(work => {
    const metadata = metadataFromWork(work)
    const textual = resourcesByWork.get(work.id) ?? []
    const expressions = textual.filter(resource => resource.kind === 'textual.expression')
    const languages = new Set<string>([metadata.originalLanguage, metadata.primaryLanguage].filter((x): x is string => Boolean(x)))
    for (const expression of expressions) {
      const language = (expression.extensions?.textual as { language?: string } | undefined)?.language
      if (language) languages.add(language)
    }
    const workEditions = editions.filter(edition => edition.workId === work.id)
    const corpusEditions = textual.filter(resource => resource.kind === 'textual.edition').map(resource => resource.id).sort()
    const measuredEditions = materializedWorkIds.has(work.id) ? corpusEditions : []
    const sources = endpointsByWork.get(work.id) ?? new Set<string>()
    const persons: string[] = []
    const traditions = [work.traditionId]
    const events: string[] = []
    const profile = ['IDENTIFIED', 'TRADITION_LINKED', ...(languages.size ? ['LANGUAGE_LINKED'] : []), ...(sources.size ? ['SOURCE_LINKED'] : []), ...(workEditions.length ? ['EDITION_LINKED'] : []), ...(metadata.compositionDate ? ['TEMPORAL_CONTEXT'] : []), 'PROVENANCE_COMPLETE']
    if (corpusEditions.length) profile.push('MATERIALIZED_EDITION')
    if (measuredEditions.length) profile.push('MEASURED_EDITION')
    return { workId: work.id, metadata, persons, traditions, languages: [...languages].sort(), sources: [...sources].sort(), editions: workEditions.map(x => x.id).sort(), materializedEditions: corpusEditions, measuredEditions, events, profile }
  })
  const temporal = { exact: 0, year: 0, range: 0, approximate: 0, disputed: 0, unknown: 0 }
  for (const row of rows) temporal[row.metadata.datePrecision === 'EXACT' ? 'exact' : row.metadata.datePrecision === 'YEAR' ? 'year' : row.metadata.datePrecision === 'RANGE' ? 'range' : row.metadata.datePrecision === 'APPROXIMATE' ? 'approximate' : 'unknown']++
  return {
    schemaVersion: '1.0.0', totalWorks: rows.length, identifiedWorks: rows.filter(row => row.profile.includes('IDENTIFIED')).length,
    worksWithExternalIDs: rows.filter(row => row.metadata.externalIdentifiers.length).length,
    worksWithAuthors: rows.filter(row => row.persons.length).length, worksWithTraditions: rows.filter(row => row.traditions.length).length,
    worksWithLanguages: rows.filter(row => row.languages.length).length, worksWithSources: rows.filter(row => row.sources.length).length,
    worksWithDates: rows.filter(row => row.metadata.compositionDate).length, worksWithEvents: rows.filter(row => row.events.length).length,
    worksWithEditions: rows.filter(row => row.editions.length).length, worksWithMaterializedEditions: rows.filter(row => row.materializedEditions.length).length,
    worksWithMeasuredEditions: rows.filter(row => row.measuredEditions.length).length, worksWithMultipleEditions: rows.filter(row => row.editions.length > 1).length, temporal, rows
  }
}
