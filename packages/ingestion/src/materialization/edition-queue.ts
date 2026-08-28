import path from 'node:path'
import { UniversalCorpusRegistry } from '../registry/universal-registry.js'
import type { MetadataEditionQueueItem, EditionQueuePriority, GranularMaterializationState } from './types.js'

export class MetadataEditionQueue {
  private readonly registry: UniversalCorpusRegistry

  constructor(rootDir: string = process.cwd()) {
    this.registry = new UniversalCorpusRegistry(path.join(rootDir, 'config'))
  }

  async buildQueue(): Promise<MetadataEditionQueueItem[]> {
    await this.registry.loadAll()
    const editions = this.registry.getEditions()
    const sources = this.registry.getSources()
    const sourceMap = new Map(sources.map(s => [s.id, s]))

    // Baseline non-metadata editions
    const existingMaterialized = new Set([
      'quran-tanzil-uthmani',
      'dhammapada-sujato-pali-en',
      'nawawi-ummah-ar-en',
      'duas-hisnul-muslim-canonical',
      'asmaul-husna-canonical',
      'sblgnt-greek-edition',
      'tanakh-wlc-hebrew',
      'gita-multilingual-edition',
      'web-classic-edition',
      'shabados-sggs-gurmukhi',
      'bukhari-ummah-ar-en',
      'muslim-ummah-ar-en',
      'abudawud-ummah-ar-en',
      'tirmidhi-ummah-ar-en',
      'nasai-ummah-ar-en',
      'ibnmajah-ummah-ar-en',
      'malik-ummah-ar-en',
      'qudsi-ummah-ar-en',
      'suttacentral-dn-sujato',
      'suttacentral-mn-sujato',
      'suttacentral-sn-sujato',
      'suttacentral-an-sujato',
      'suttacentral-kn-sujato',
      'suttacentral-vinaya-sujato',
      'heart-sutra-sanskrit-ed',
      'avesta-canonical-archive',
      'yasna-gathas-avesta-ed',
      'gretil-sanskrit-upanishads',
      'rigveda-gretil-edition',
      'samaveda-gretil-edition',
      'atharvaveda-gretil-edition',
      'yoga-sutras-gretil-edition',
      'shabados-japji-gurmukhi',
      'shabados-dasam-granth-ed',
      'jain-heritage-tattvartha-ed',
      'jain-heritage-kalpa-ed',
      'bahai-hidden-words-official',
      'bahai-kitab-aqdas-official',
      'bahai-kitab-iqan-official',
      'shinto-kojiki-archival',
      'shinto-nihon-shoki-archival',
      'ctext-daoism-classical',
      'ctext-zhuangzi-classical',
      'ctext-liezi-classical',
      'ctext-analects-classical',
      'ctext-mencius-classical',
      'ctext-great-learning-classical',
      'ctext-doctrine-mean-classical',
      'septuagint-lxx-edition',
      'perseus-canonical-greek',
      'apostolic-fathers-greek-ed',
      'early-church-fathers-ed',
      'mishnah-sefaria-ed',
      'talmud-bavli-sefaria-ed',
      'talmud-yerushalmi-sefaria-ed',
      'midrash-rabbah-sefaria-ed',
      'tosefta-sefaria-ed'
    ])

    const queue: MetadataEditionQueueItem[] = []

    for (const ed of editions) {
      if (existingMaterialized.has(ed.id)) continue

      const work = this.registry.resolveWork(ed.workId)
      const workEndpoints = this.registry.resolveWorkEndpoints(ed.workId)
      const workSources = this.registry.resolveWorkSources(ed.workId)

      const sourceCandidates = workSources.map(s => s.id)
      const endpointCandidates = workEndpoints.map(ep => ep.id)

      let priority: EditionQueuePriority = 'P2'
      let priorityReason = 'Community translation or edition'
      let currentStatus: GranularMaterializationState = 'DISCOVERABLE'

      const primarySource = workSources.length > 0 ? sourceMap.get(workSources[0].id) : undefined

      if (primarySource?.authorityLevel === 'official' || primarySource?.authorityLevel === 'institutional') {
        priority = 'P0'
        priorityReason = 'Official scriptural distribution center / institutional authority'
        currentStatus = 'REMOTE_READY'
      } else if (primarySource?.authorityLevel === 'academic') {
        priority = 'P1'
        priorityReason = 'Peer-reviewed critical academic edition'
        currentStatus = 'REMOTE_READY'
      } else if (primarySource?.authorityLevel === 'community') {
        priority = 'P2'
        priorityReason = 'Community verified translation feed'
        currentStatus = 'DISCOVERABLE'
      } else if (primarySource?.authorityLevel === 'archival') {
        priority = 'P3'
        priorityReason = 'Archival historical scan / TEI digitization'
        currentStatus = 'DISCOVERABLE'
      } else {
        priority = 'P4'
        priorityReason = 'Manual verification needed'
        currentStatus = 'MANUAL_ONLY'
      }

      queue.push({
        editionId: ed.id,
        workId: ed.workId,
        traditionId: work.traditionId,
        name: ed.name,
        language: ed.language,
        script: ed.script,
        editionType: ed.editionType,
        sourceCandidates,
        endpointCandidates,
        currentStatus,
        priority,
        priorityReason
      })
    }

    // Sort by priority (P0 -> P1 -> P2 -> P3 -> P4) then editionId
    const priorityWeight: Record<EditionQueuePriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 }
    queue.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority] || a.editionId.localeCompare(b.editionId))

    return queue
  }
}
