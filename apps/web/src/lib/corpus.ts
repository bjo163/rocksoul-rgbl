import { access } from 'node:fs/promises'
import { resolve } from 'node:path'
import type {
  Assessment,
  CanonicalId,
  CorpusRecord,
  Evidence,
  Provenance,
  Resource
} from '@moonwitness/corpus-core'
import { FileSystemCorpusRepository } from '@moonwitness/corpus-node'
import type { CorpusRepository, DatasetDescriptor } from '@moonwitness/corpus-repository'
import { displayName, getDatasetFriendlyMeta, textualPayload } from './presentation.js'

declare global {
  // eslint-disable-next-line no-var
  var __moonwitness_repository__: Promise<FileSystemCorpusRepository> | undefined
  // eslint-disable-next-line no-var
  var __moonwitness_root__: Promise<string> | undefined
}

async function hasRegistry(candidate: string): Promise<boolean> {
  try {
    await access(resolve(candidate, 'datasets/registry.json'))
    return true
  } catch {
    return false
  }
}

export async function getCorpusRoot(): Promise<string> {
  if (!globalThis.__moonwitness_root__) {
    globalThis.__moonwitness_root__ = (async () => {
      const candidates = [
        process.env.MOONWITNESS_CORPUS_ROOT,
        process.cwd(),
        resolve(process.cwd(), '..'),
        resolve(process.cwd(), '../..')
      ].filter((candidate): candidate is string => Boolean(candidate))

      for (const candidate of candidates) {
        const absolute = resolve(candidate)
        if (await hasRegistry(absolute)) return absolute
      }
      throw new Error('Could not locate datasets/registry.json. Set MOONWITNESS_CORPUS_ROOT to the repository root.')
    })()
  }
  return globalThis.__moonwitness_root__
}

export async function getRepository(): Promise<FileSystemCorpusRepository> {
  if (!globalThis.__moonwitness_repository__) {
    globalThis.__moonwitness_repository__ = getCorpusRoot().then((root) => FileSystemCorpusRepository.open(root))
  }
  return globalThis.__moonwitness_repository__
}

export async function datasetMap(repository: CorpusRepository): Promise<Map<CanonicalId, DatasetDescriptor>> {
  return new Map((await repository.listDatasets()).map((dataset) => [dataset.manifest.id, dataset]))
}

export interface CorpusSummary {
  total: number
  resources: number
  assertions: number
  entities: number
}

let summaryPromise: Promise<CorpusSummary> | undefined

export async function getCorpusSummary(): Promise<CorpusSummary> {
  if (!summaryPromise) {
    summaryPromise = (async () => {
      const root = await getCorpusRoot()
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const registryText = await fs.readFile(path.join(root, 'datasets/registry.json'), 'utf8')
      const registry = JSON.parse(registryText) as { datasets: Array<{ path: string }> }

      let total = 0
      let resources = 0
      let assertions = 0
      let entities = 0

      for (const entry of registry.datasets) {
        const coreDir = path.join(root, entry.path, 'data/core')
        try {
          const subdirs = await fs.readdir(coreDir, { withFileTypes: true })
          for (const sub of subdirs) {
            if (!sub.isDirectory()) continue
            const partitionDir = path.join(coreDir, sub.name)
            const files = await fs.readdir(partitionDir)
            for (const file of files) {
              if (!file.endsWith('.jsonl')) continue
              const buf = await fs.readFile(path.join(partitionDir, file))
              let lines = 0
              for (let i = 0; i < buf.length; i++) {
                if (buf[i] === 10) lines++
              }
              if (buf.length > 0 && buf[buf.length - 1] !== 10) lines++
              total += lines
              if (sub.name === 'resources') resources += lines
              else if (sub.name === 'assertions') assertions += lines
              else if (sub.name === 'entities') entities += lines
            }
          }
        } catch {
          // ignore missing directories
        }
      }
      return { total, resources, assertions, entities }
    })()
  }
  return summaryPromise
}

export interface RecordContext {
  record: CorpusRecord
  dataset: DatasetDescriptor | null
}

export async function getRecordContext(id: CanonicalId): Promise<RecordContext | null> {
  const repository = await getRepository()
  const record = await repository.getRecord(id)
  if (!record) return null
  const datasetId = await repository.getRecordDataset(id)
  const datasets = await datasetMap(repository)
  return { record, dataset: datasetId ? datasets.get(datasetId) ?? null : null }
}

export interface AssertionsAround {
  outgoing: Awaited<ReturnType<CorpusRepository['findAssertions']>>
  incoming: Awaited<ReturnType<CorpusRepository['findAssertions']>>
}

export async function assertionsAround(id: CanonicalId, limit = 24): Promise<AssertionsAround> {
  const repository = await getRepository()
  const [outgoing, incoming] = await Promise.all([
    repository.findAssertions({ subject: id, limit }),
    repository.findAssertions({ objectEntity: id, limit })
  ])
  return { outgoing, incoming }
}

let contentIndexPromise: Promise<Map<CanonicalId, Resource[]>> | undefined

async function getContentIndex(): Promise<Map<CanonicalId, Resource[]>> {
  if (!contentIndexPromise) {
    contentIndexPromise = (async () => {
      const repository = await getRepository()
      const index = new Map<CanonicalId, Resource[]>()
      const recordsMap = (repository as unknown as { records?: Map<CanonicalId, CorpusRecord> }).records
      const source = recordsMap ? recordsMap.values() : repository.iterateRecords({ recordTypes: ['resource'], kinds: ['textual.content'] })

      for await (const record of source) {
        if (record.record_type !== 'resource' || record.kind !== 'textual.content') continue
        const payload = textualPayload(record)
        const target = payload?.target as CanonicalId | undefined
        if (target) {
          const list = index.get(target) ?? []
          list.push(record)
          index.set(target, list)
        }
      }
      return index
    })()
  }
  return contentIndexPromise
}

export async function contentForTarget(id: CanonicalId): Promise<Resource[]> {
  const index = await getContentIndex()
  return index.get(id) ?? []
}

let assessmentIndexPromise: Promise<Map<CanonicalId, Assessment[]>> | undefined

async function getAssessmentIndex(): Promise<Map<CanonicalId, Assessment[]>> {
  if (!assessmentIndexPromise) {
    assessmentIndexPromise = (async () => {
      const repository = await getRepository()
      const index = new Map<CanonicalId, Assessment[]>()
      const recordsMap = (repository as unknown as { records?: Map<CanonicalId, CorpusRecord> }).records
      const source = recordsMap ? recordsMap.values() : repository.iterateRecords({ recordTypes: ['assessment'] })

      for await (const record of source) {
        if (record.record_type === 'assessment' && record.target) {
          const list = index.get(record.target) ?? []
          list.push(record)
          index.set(record.target, list)
        }
      }
      return index
    })()
  }
  return assessmentIndexPromise
}

let passageIndexPromise: Promise<Map<CanonicalId, CorpusRecord>> | undefined

async function getPassageIndex(): Promise<Map<CanonicalId, CorpusRecord>> {
  if (!passageIndexPromise) {
    passageIndexPromise = (async () => {
      const repository = await getRepository()
      const index = new Map<CanonicalId, CorpusRecord>()
      const recordsMap = (repository as unknown as { records?: Map<CanonicalId, CorpusRecord> }).records
      const source = recordsMap ? recordsMap.values() : repository.iterateRecords({ recordTypes: ['resource'], kinds: ['textual.passage'] })

      for await (const record of source) {
        if (record.record_type === 'resource' && record.kind === 'textual.passage') {
          index.set(record.id, record)
        }
      }
      return index
    })()
  }
  return passageIndexPromise
}

export async function assessmentsForTarget(id: CanonicalId): Promise<Assessment[]> {
  const index = await getAssessmentIndex()
  return index.get(id) ?? []
}

export interface ParallelVerse {
  id: CanonicalId
  citation: string
  label?: string
  sourceText?: { language: string; text: string; script?: string; datasetId?: string }
  indonesianText?: { language: string; text: string; datasetId?: string }
  englishText?: { language: string; text: string; datasetId?: string }
  otherTexts: Array<{ language: string; text: string; script?: string; datasetId?: string }>
}

export interface ParallelReaderData {
  key: string
  title: string
  subtitle: string
  icon: string
  tradition: string
  currentSection: string
  totalSections: number
  sectionLabel: string
  sectionsList: Array<{ id: string; label: string }>
  verses: ParallelVerse[]
}

export interface DynamicScriptureWork {
  id: CanonicalId
  slug: string
  title: string
  nativeTitle?: string
  traditionId?: string
  traditionName: string
  icon: string
  description: string
  badge: string
  sectionLabel: string
  totalSections: number
  sampleSectionId: string
  href: string
}

let scriptureWorksPromise: Promise<DynamicScriptureWork[]> | undefined

export async function listAvailableScriptureWorks(): Promise<DynamicScriptureWork[]> {
  if (!scriptureWorksPromise) {
    scriptureWorksPromise = (async () => {
      const repository = await getRepository()
      const catalog = await getDynamicCorpusCatalog()

      const works: DynamicScriptureWork[] = []
      for await (const w of repository.iterateRecords({ recordTypes: ['resource'], kinds: ['textual.work'] })) {
        if (w.id.includes('example-')) continue // skip test fixtures

        const idLabel = ('labels' in w && Array.isArray(w.labels))
          ? w.labels.find((l) => l.language === 'id' && l.role === 'preferred')?.value
          : undefined
        const enLabel = ('labels' in w && Array.isArray(w.labels))
          ? w.labels.find((l) => l.language === 'en' && l.role === 'preferred')?.value
          : undefined
        const native = ('labels' in w && Array.isArray(w.labels))
          ? w.labels.find((l) => ['ar', 'sa', 'he', 'pi', 'zh', 'el'].includes(l.language) && l.role === 'preferred')?.value
          : undefined

        const title = idLabel ?? enLabel ?? displayName(w)
        const cleanWorkSuffix = w.id.replace(/^mw:work:/, '')
        const slug = cleanWorkSuffix.replace(/:/g, '-')

        // Match tradition dynamically from catalog
        const matchedTradition = catalog.traditions.find((t) => {
          const tKey = t.id.toLowerCase()
          return w.id.toLowerCase().includes(tKey) || (t.name && title.toLowerCase().includes(t.name.toLowerCase()))
        }) ?? (
          w.id.includes('quran') || w.id.includes('hadith') ? catalog.traditions.find((t) => t.id === 'islam') :
          w.id.includes('dhammapada') || w.id.includes('sutta') ? catalog.traditions.find((t) => t.id === 'buddhism') :
          w.id.includes('gita') ? catalog.traditions.find((t) => t.id === 'hinduism') :
          w.id.includes('testament') || w.id.includes('didache') ? catalog.traditions.find((t) => t.id === 'christianity') :
          w.id.includes('avot') || w.id.includes('hebrew') ? catalog.traditions.find((t) => t.id === 'judaism') :
          catalog.traditions.find((t) => t.id === 'interreligious')
        )

        const traditionName = matchedTradition?.name ?? 'Lintas Tradisi'
        const icon = matchedTradition?.icon ?? '📖'

        let sectionLabel = 'Bagian'
        let totalSections = 1
        if (w.id.includes('quran')) { sectionLabel = 'Surah'; totalSections = 114 }
        else if (w.id.includes('dhammapada')) { sectionLabel = 'Bab'; totalSections = 26 }
        else if (w.id.includes('gita')) { sectionLabel = 'Adhyaya'; totalSections = 18 }
        else if (w.id.includes('hadith')) { sectionLabel = 'Hadits'; totalSections = 42 }
        else if (w.id.includes('avot') || w.id.includes('mishnah')) { sectionLabel = 'Perek'; totalSections = 6 }
        else if (w.id.includes('testament') || w.id.includes('bible')) { sectionLabel = 'Pasal'; totalSections = 28 }

        works.push({
          id: w.id,
          slug,
          title,
          nativeTitle: native,
          traditionId: matchedTradition?.id,
          traditionName,
          icon,
          description: ('description' in w && typeof w.description === 'string')
            ? w.description
            : `Teks kanonikal ${title} ber-penjajaran paralel teks asli dan terjemahan resmi.`,
          badge: `${sectionLabel} 1 - ${totalSections}`,
          sectionLabel,
          totalSections,
          sampleSectionId: '1',
          href: `/read/${encodeURIComponent(slug)}?section=1`
        })
      }

      return works
    })()
  }
  return scriptureWorksPromise
}

export async function getParallelReaderData(scriptureKey: string, sectionParam?: string): Promise<ParallelReaderData | null> {
  const repository = await getRepository()
  const contentIndex = await getContentIndex()
  const works = await listAvailableScriptureWorks()

  const cleanKey = scriptureKey.toLowerCase().replace(/^mw:work:/, '').replace(/:/g, '-')
  const matchedWork = works.find((w) => w.slug.toLowerCase() === cleanKey || w.id.toLowerCase().includes(cleanKey) || cleanKey.includes(w.slug.toLowerCase()))

  if (!matchedWork) return null

  // Determine passage prefix dynamically
  const workSuffix = matchedWork.id.replace(/^mw:work:/, '')
  let prefix = `mw:passage:${workSuffix}:`
  if (matchedWork.id === 'mw:work:quran') prefix = 'mw:passage:quran:'
  if (matchedWork.id === 'mw:work:dhammapada') prefix = 'mw:passage:dhammapada:'
  if (matchedWork.id === 'mw:work:hinduism:bhagavad-gita') prefix = 'mw:passage:hinduism:gita:'
  if (matchedWork.id === 'mw:work:hadith:nawawi-40') prefix = 'mw:passage:hadith:nawawi-40:'
  if (matchedWork.id === 'mw:work:devotional:baseline') prefix = 'mw:passage:devotional:'
  if (matchedWork.id === 'mw:work:mishnah:pirkei-avot') prefix = 'mw:passage:judaism:mishnah:pirkei-avot:'

  const totalSections = matchedWork.totalSections
  const currentSection = sectionParam && Number(sectionParam) >= 1 && Number(sectionParam) <= totalSections
    ? sectionParam
    : '1'

  const sectionsList: Array<{ id: string; label: string }> = []
  for (let i = 1; i <= totalSections; i++) {
    sectionsList.push({ id: String(i), label: `${matchedWork.sectionLabel} ${i}` })
  }

  const effectivePrefix = totalSections > 1
    ? `${prefix}${currentSection}:`
    : prefix

  // Find all passages matching current section prefix from in-memory index
  const passageIndex = await getPassageIndex()
  const matchingPassages: CorpusRecord[] = []
  for (const [id, record] of passageIndex) {
    if (id.startsWith(effectivePrefix)) {
      matchingPassages.push(record)
    }
  }

  // Sort passages by sequence
  matchingPassages.sort((a, b) => {
    const aSeq = (a as { extensions?: { textual?: { sequence?: number } } }).extensions?.textual?.sequence
    const bSeq = (b as { extensions?: { textual?: { sequence?: number } } }).extensions?.textual?.sequence
    if (typeof aSeq === 'number' && typeof bSeq === 'number') return aSeq - bSeq
    return a.id.localeCompare(b.id, undefined, { numeric: true })
  })

  // Assemble parallel representations
  const verses: ParallelVerse[] = matchingPassages.map((passage) => {
    const payload = textualPayload(passage) ?? {}
    const citations = Array.isArray(payload.citations) ? payload.citations as Array<{ reference?: string }> : []
    const citation = citations[0]?.reference ?? passage.id.split(':').pop() ?? ''
    const label = ('labels' in passage && passage.labels && passage.labels[0]?.value) ? passage.labels[0].value : undefined

    const contents = contentIndex.get(passage.id) ?? []
    let sourceText: ParallelVerse['sourceText']
    let indonesianText: ParallelVerse['indonesianText']
    let englishText: ParallelVerse['englishText']
    const otherTexts: ParallelVerse['otherTexts'] = []

    for (const c of contents) {
      const textMeta = textualPayload(c) ?? {}
      const text = typeof textMeta.text === 'string' ? textMeta.text : ''
      const lang = typeof textMeta.language === 'string' ? textMeta.language : ''
      const script = typeof textMeta.script === 'string' ? textMeta.script : undefined
      const rep = textMeta.representation

      if (rep === 'source' || ['ar', 'grc', 'el', 'he', 'pi', 'sa'].includes(lang)) {
        if (!sourceText) {
          sourceText = { language: lang, text, script, datasetId: c.id }
        } else {
          otherTexts.push({ language: lang, text, script, datasetId: c.id })
        }
      } else if (lang === 'id') {
        indonesianText = { language: lang, text, datasetId: c.id }
      } else if (lang === 'en') {
        englishText = { language: lang, text, datasetId: c.id }
      } else {
        otherTexts.push({ language: lang, text, script, datasetId: c.id })
      }
    }

    return {
      id: passage.id,
      citation,
      label,
      sourceText,
      indonesianText,
      englishText,
      otherTexts
    }
  })

  return {
    key: matchedWork.slug,
    title: matchedWork.title,
    subtitle: matchedWork.description,
    icon: matchedWork.icon,
    tradition: matchedWork.traditionName,
    currentSection,
    totalSections,
    sectionLabel: matchedWork.sectionLabel,
    sectionsList,
    verses
  }
}

export interface EvidenceChainItem {
  evidence: Evidence
  target: CorpusRecord | null
  provenance: Provenance | null
  source: CorpusRecord | null
}

export async function evidenceChainForAssertion(id: CanonicalId): Promise<EvidenceChainItem[]> {
  const repository = await getRepository()
  const evidence = await repository.getEvidenceForAssertion(id)
  return Promise.all(evidence.map(async (item) => {
    const [target, provenance] = await Promise.all([
      repository.getRecord(item.target),
      item.provenance ? repository.getProvenance(item.provenance) : Promise.resolve(null)
    ])
    const source = provenance ? await repository.getRecord(provenance.source) : null
    return { evidence: item, target, provenance, source }
  }))
}

export async function evidenceContext(id: CanonicalId): Promise<EvidenceChainItem | null> {
  const repository = await getRepository()
  const evidence = await repository.getEvidence(id)
  if (!evidence) return null
  const [target, provenance] = await Promise.all([
    repository.getRecord(evidence.target),
    evidence.provenance ? repository.getProvenance(evidence.provenance) : Promise.resolve(null)
  ])
  const source = provenance ? await repository.getRecord(provenance.source) : null
  return { evidence, target, provenance, source }
}

export interface DynamicTraditionDataset {
  id: string
  title: string
  subtitle: string
  badge: string
  datasetVersion: string
  status: string
  featuredPassage?: { id: string; label: string }
}

export interface DynamicTraditionHub {
  id: string
  entityId?: string
  name: string
  nativeName?: string
  icon: string
  subtitle: string
  color: string
  description: string
  datasets: DynamicTraditionDataset[]
}

export interface DynamicCorpusCatalog {
  traditions: DynamicTraditionHub[]
  samplePills: Array<{ label: string; query: string }>
  featuredCategories: Array<{
    title: string
    icon: string
    desc: string
    href: string
    count: number
    cta: string
  }>
}

let catalogPromise: Promise<DynamicCorpusCatalog> | undefined

function getTraditionDisplay(entityId?: string, traditionEntity?: CorpusRecord): { icon: string; color: string } {
  if (!entityId) return { icon: '🌐', color: '#0ea5e9' }
  const id = entityId.toLowerCase()
  if (id.includes('islam')) return { icon: '🕌', color: '#10b981' }
  if (id.includes('christianity')) return { icon: '✝️', color: '#38bdf8' }
  if (id.includes('judaism')) return { icon: '✡️', color: '#fbbf24' }
  if (id.includes('buddhism')) return { icon: '☸️', color: '#f97316' }
  if (id.includes('hinduism')) return { icon: '🕉️', color: '#a855f7' }
  if (id.includes('daoism')) return { icon: '☯️', color: '#06b6d4' }
  if (id.includes('confucianism')) return { icon: '📜', color: '#eab308' }
  if (id.includes('sikhism')) return { icon: '☬', color: '#ec4899' }
  if (id.includes('shinto')) return { icon: '⛩️', color: '#ef4444' }
  if (id.includes('jainism')) return { icon: '🪷', color: '#14b8a6' }
  if (id.includes('zoroastrianism')) return { icon: '🔥', color: '#f59e0b' }
  if (id.includes('bahai')) return { icon: '⭐', color: '#8b5cf6' }
  return { icon: '🌐', color: '#0ea5e9' }
}

export async function getDynamicCorpusCatalog(): Promise<DynamicCorpusCatalog> {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const repository = await getRepository()
      const datasets = await repository.listDatasets()

      // 1. Dynamically discover all tradition entities from the corpus
      const traditionEntities = new Map<CanonicalId, CorpusRecord>()
      for await (const r of repository.iterateRecords({ recordTypes: ['entity'], kinds: ['tradition'] })) {
        traditionEntities.set(r.id, r)
      }

      // 2. Discover assertion scopes to connect datasets directly to tradition entities
      const datasetToTradition = new Map<CanonicalId, CanonicalId>()
      for await (const a of repository.iterateRecords({ recordTypes: ['assertion'] })) {
        if (a.record_type === 'assertion' && a.scope?.tradition && traditionEntities.has(a.scope.tradition)) {
          const dId = await repository.getRecordDataset(a.id)
          if (dId && !datasetToTradition.has(dId)) {
            datasetToTradition.set(dId, a.scope.tradition)
          }
        }
      }

      // 3. Sample passages per dataset dynamically from textual.passage records
      const samplePassagesByDataset = new Map<string, { id: string; label: string }>()
      for await (const r of repository.iterateRecords({ recordTypes: ['resource'], kinds: ['textual.passage'] })) {
        const dId = await repository.getRecordDataset(r.id)
        if (dId && !samplePassagesByDataset.has(dId)) {
          const label = ('labels' in r && r.labels && r.labels[0]?.value) ? r.labels[0].value : r.id
          samplePassagesByDataset.set(dId, { id: r.id, label })
        }
      }

      // 4. Group datasets dynamically by resolved tradition entity
      const traditionGroups = new Map<string, {
        id: string
        entityId?: string
        name: string
        nativeName?: string
        icon: string
        color: string
        description: string
        datasets: DynamicTraditionDataset[]
      }>()

      for (const dataset of datasets) {
        const meta = getDatasetFriendlyMeta(dataset.manifest.id, dataset.manifest)
        const dId = dataset.manifest.id.toLowerCase()

        // Resolve tradition entity:
        // Priority 1: Direct assertion scope in dataset
        let resolvedEntityId = datasetToTradition.get(dataset.manifest.id)

        // Priority 2: Match dataset ID against tradition entity ID or its registered labels/aliases
        if (!resolvedEntityId) {
          for (const [tId, tEntity] of traditionEntities) {
            const suffix = tId.replace(/^mw:tradition:/, '').toLowerCase()
            const labels = ('labels' in tEntity && Array.isArray(tEntity.labels))
              ? tEntity.labels.map((l) => l.value.toLowerCase())
              : []

            const matchesSuffix = dId.includes(`:${suffix}:`) || dId.endsWith(`:${suffix}`) || dId.includes(suffix)
            const matchesAlias = labels.some((label) => label.length > 3 && dId.includes(label))

            if (matchesSuffix || matchesAlias) {
              resolvedEntityId = tId
              break
            }
          }
        }

        // Priority 3: Common scriptural namespaces mapped to traditions
        if (!resolvedEntityId) {
          if (dId.includes('quran') || dId.includes('hadith') || dId.includes('tafsir')) {
            resolvedEntityId = 'mw:tradition:islam'
          } else if (dId.includes('bible') || dId.includes('sblgnt') || dId.includes('tsi') || dId.includes('early-writings') || dId.includes('web-classic')) {
            resolvedEntityId = 'mw:tradition:christianity'
          } else if (dId.includes('oshb') || dId.includes('wlc') || dId.includes('mishnah') || dId.includes('avot')) {
            resolvedEntityId = 'mw:tradition:judaism'
          } else if (dId.includes('dhammapada') || dId.includes('sutta') || dId.includes('sujato')) {
            resolvedEntityId = 'mw:tradition:buddhism'
          } else if (dId.includes('gita') || dId.includes('bhagavad') || dId.includes('sanskrit')) {
            resolvedEntityId = 'mw:tradition:hinduism'
          }
        }

        const entityRecord = resolvedEntityId ? traditionEntities.get(resolvedEntityId) : undefined
        const traditionKey = resolvedEntityId ? resolvedEntityId.replace(/^mw:tradition:/, '') : 'interreligious'
        const { icon, color } = getTraditionDisplay(resolvedEntityId, entityRecord)

        let traditionName = resolvedEntityId ? 'Tradisi ' + traditionKey.charAt(0).toUpperCase() + traditionKey.slice(1) : 'Lintas Tradisi'
        let nativeName: string | undefined

        if (entityRecord && 'labels' in entityRecord && Array.isArray(entityRecord.labels)) {
          const idLabel = entityRecord.labels.find((l) => l.language === 'id' && l.role === 'preferred')?.value
          const enLabel = entityRecord.labels.find((l) => l.language === 'en' && l.role === 'preferred')?.value
          traditionName = idLabel ? `Tradisi ${idLabel}` : enLabel ? `Tradisi ${enLabel}` : traditionName

          const native = entityRecord.labels.find((l) => ['ar', 'sa', 'he', 'pi', 'zh', 'el'].includes(l.language) && l.role === 'preferred')?.value
          nativeName = native
        }

        const group = traditionGroups.get(traditionKey) ?? {
          id: traditionKey,
          entityId: resolvedEntityId,
          name: traditionName,
          nativeName,
          icon,
          color,
          description: `Koleksi teks suci, literatur kanonikal, terjemahan, dan rekaman evidensi ${traditionName}.`,
          datasets: []
        }

        group.datasets.push({
          id: dataset.manifest.id,
          title: meta.title,
          subtitle: meta.subtitle,
          badge: meta.badge,
          datasetVersion: dataset.manifest.datasetVersion,
          status: dataset.entry.status,
          featuredPassage: samplePassagesByDataset.get(dataset.manifest.id)
        })

        traditionGroups.set(traditionKey, group)
      }

      const traditions: DynamicTraditionHub[] = Array.from(traditionGroups.values()).map((g) => ({
        ...g,
        subtitle: `${g.datasets.length} Paket Kitab & Koleksi`
      }))

      // Dynamic sample pills derived automatically from actual dataset passages
      const samplePills: Array<{ label: string; query: string }> = []
      for (const t of traditions) {
        for (const d of t.datasets) {
          if (d.featuredPassage) {
            samplePills.push({
              label: `${t.icon} ${d.featuredPassage.label}`,
              query: d.featuredPassage.label
            })
            if (samplePills.length >= 10) break
          }
        }
        if (samplePills.length >= 10) break
      }

      const featuredCategories = [
        {
          title: 'Pembaca Ayat & Teks Suci',
          icon: '📖',
          desc: 'Baca teks sumber bahasa asli berdampingan dengan transliterasi dan terjemahan resmi Indonesia & Inggris.',
          href: '/datasets',
          count: datasets.filter((d) => d.manifest.profiles.includes('textual@0.1')).length,
          cta: 'Buka Katalog Teks'
        },
        {
          title: 'Pencarian Korpus Instan',
          icon: '🔍',
          desc: 'Cari kata kunci, topik, kutipan ayat, atau doa di antara seluruh rekaman kanonikal dengan filter tradisi dan bahasa.',
          href: '/search',
          count: datasets.length,
          cta: 'Coba Pencarian'
        },
        {
          title: 'Koleksi Doa & Liturgi',
          icon: '🤲',
          desc: 'Kumpulan doa harian, kredo kuno, mantra meditasi, dan lantunan suci dunia ber-tinjauan sensitivitas.',
          href: '/search?q=devotional',
          count: datasets.filter((d) => d.manifest.profiles.includes('devotional@0.1') || d.manifest.id.includes('devotional')).length || 1,
          cta: 'Jelajahi Doa'
        },
        {
          title: 'Leksikon Teologi Multibahasa',
          icon: '📚',
          desc: 'Kamus konsep spiritual dan nama suci (Ibrani, Yunani, Arab, Pali, Sanskerta) terhubung langsung ke bukti kemunculan di ayat.',
          href: '/search?q=lexicon',
          count: datasets.filter((d) => d.manifest.profiles.includes('lexicon@0.1')).length,
          cta: 'Buka Leksikon'
        },
        {
          title: 'Graf Evidensi & Intertekstual',
          icon: '🕸️',
          desc: 'Telusuri silsilah figur, kutipan langsung lintas teks, dan rantai tafsir tanpa klaim spekulatif.',
          href: '/datasets/mw%3Adataset%3Aresearch-graph%3Abaseline',
          count: datasets.filter((d) => d.manifest.profiles.includes('research-graph@0.1') || d.manifest.id.includes('research-graph')).length || 1,
          cta: 'Lihat Graf Riset'
        },
        {
          title: 'Perbandingan Teks Berdampingan',
          icon: '⚖️',
          desc: 'Bandingkan dua teks atau edisi secara transparan berdampingan tanpa memaksakan kesetaraan atau peleburan makna.',
          href: '/compare',
          count: datasets.length,
          cta: 'Bandingkan Dokumen'
        }
      ]

      return { traditions, samplePills, featuredCategories }
    })()
  }
  return catalogPromise
}
