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
import { getDatasetFriendlyMeta, textualPayload } from './presentation.js'

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
      for await (const record of repository.iterateRecords({ recordTypes: ['resource'], kinds: ['textual.content'] })) {
        if (record.record_type !== 'resource') continue
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
      for await (const record of repository.iterateRecords({ recordTypes: ['assessment'] })) {
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

export async function assessmentsForTarget(id: CanonicalId): Promise<Assessment[]> {
  const index = await getAssessmentIndex()
  return index.get(id) ?? []
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

function getTraditionIcon(key: string): { icon: string; color: string } {
  const k = key.toLowerCase()
  if (k.includes('islam') || k.includes('quran') || k.includes('hadith')) return { icon: '🕌', color: '#10b981' }
  if (k.includes('christianity') || k.includes('bible') || k.includes('sblgnt') || k.includes('tsi')) return { icon: '✝️', color: '#38bdf8' }
  if (k.includes('judaism') || k.includes('oshb') || k.includes('wlc') || k.includes('mishnah')) return { icon: '✡️', color: '#fbbf24' }
  if (k.includes('buddhism') || k.includes('dhammapada') || k.includes('sutta')) return { icon: '☸️', color: '#f97316' }
  if (k.includes('hinduism') || k.includes('gita') || k.includes('sanskrit')) return { icon: '🕉️', color: '#a855f7' }
  if (k.includes('daoism')) return { icon: '☯️', color: '#06b6d4' }
  if (k.includes('confucianism')) return { icon: '📜', color: '#eab308' }
  if (k.includes('sikhism')) return { icon: '☬', color: '#ec4899' }
  if (k.includes('shinto')) return { icon: '⛩️', color: '#ef4444' }
  if (k.includes('jainism')) return { icon: '🪷', color: '#14b8a6' }
  if (k.includes('zoroastrianism')) return { icon: '🔥', color: '#f59e0b' }
  return { icon: '🌐', color: '#0ea5e9' }
}

export async function getDynamicCorpusCatalog(): Promise<DynamicCorpusCatalog> {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const repository = await getRepository()
      const datasets = await repository.listDatasets()

      // Dynamically discover all tradition entities from the corpus
      const traditionEntities = new Map<string, CorpusRecord>()
      for await (const r of repository.iterateRecords({ recordTypes: ['entity'], kinds: ['tradition'] })) {
        traditionEntities.set(r.id, r)
      }

      // Sample passages per dataset dynamically
      const samplePassagesByDataset = new Map<string, { id: string; label: string }>()
      for await (const r of repository.iterateRecords({ recordTypes: ['resource'], kinds: ['textual.passage'] })) {
        const dId = await repository.getRecordDataset(r.id)
        if (dId && !samplePassagesByDataset.has(dId)) {
          const label = ('labels' in r && r.labels && r.labels[0]?.value) ? r.labels[0].value : r.id
          samplePassagesByDataset.set(dId, { id: r.id, label })
        }
      }

      // Group datasets dynamically by resolved tradition
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
        const meta = getDatasetFriendlyMeta(dataset.manifest.id)
        const idLower = dataset.manifest.id.toLowerCase()

        // Resolve tradition key dynamically
        let traditionKey = 'interreligious'
        let traditionEntityId = ''

        if (idLower.includes('islam') || idLower.includes('quran') || idLower.includes('hadith') || idLower.includes('tafsir')) {
          traditionKey = 'islam'
          traditionEntityId = 'mw:tradition:islam'
        } else if (idLower.includes('christianity') || idLower.includes('bible') || idLower.includes('sblgnt') || idLower.includes('tsi') || idLower.includes('early-writings') || idLower.includes('web-classic')) {
          traditionKey = 'christianity'
          traditionEntityId = 'mw:tradition:christianity'
        } else if (idLower.includes('judaism') || idLower.includes('oshb') || idLower.includes('wlc') || idLower.includes('mishnah') || idLower.includes('avot')) {
          traditionKey = 'judaism'
          traditionEntityId = 'mw:tradition:judaism'
        } else if (idLower.includes('buddhism') || idLower.includes('dhammapada') || idLower.includes('sutta') || idLower.includes('sujato')) {
          traditionKey = 'buddhism'
          traditionEntityId = 'mw:tradition:buddhism'
        } else if (idLower.includes('hinduism') || idLower.includes('gita') || idLower.includes('bhagavad') || idLower.includes('sanskrit')) {
          traditionKey = 'hinduism'
          traditionEntityId = 'mw:tradition:hinduism'
        }

        const entityRecord = traditionEntityId ? traditionEntities.get(traditionEntityId) : undefined
        const { icon, color } = getTraditionIcon(traditionKey)

        let traditionName = meta.tradition
        let nativeName: string | undefined

        if (entityRecord && 'labels' in entityRecord && entityRecord.labels) {
          const idLabel = entityRecord.labels.find((l) => l.language === 'id' && l.role === 'preferred')?.value
          const enLabel = entityRecord.labels.find((l) => l.language === 'en' && l.role === 'preferred')?.value
          traditionName = idLabel ? `Tradisi ${idLabel}` : enLabel ? `Tradisi ${enLabel}` : meta.tradition

          const native = entityRecord.labels.find((l) => ['ar', 'sa', 'he', 'pi', 'zh', 'el'].includes(l.language) && l.role === 'preferred')?.value
          nativeName = native
        }

        const group = traditionGroups.get(traditionKey) ?? {
          id: traditionKey,
          entityId: traditionEntityId,
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
